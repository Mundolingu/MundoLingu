import { HTMLRewriter } from '../vendor/deno.land/x/htmlrewriter@v1.0.0/src/index.ts';
import { updateModifiedHeaders } from './headers.ts';
import { addMiddlewareHeaders, hasMiddlewareResponseHeadersToApply, isMiddlewareRequest, isMiddlewareResponse, mergeMiddlewareCookies } from './middleware.ts';
import { addBasePath, normalizeDataUrl, normalizeLocalePath, normalizeTrailingSlash, relativizeURL, removeBasePath, rewriteDataPath } from './util.ts';
export const buildResponse = async ({ context, logger, request, result, nextConfig })=>{
  logger.withFields({
    is_nextresponse_next: result.response.headers.has('x-middleware-next')
  }).debug('Building Next.js response');
  updateModifiedHeaders(request.headers, result.response.headers);
  // They've returned the MiddlewareRequest directly, so we'll call `next()` for them.
  if (isMiddlewareRequest(result.response)) {
    result.response = await result.response.next();
  }
  if (isMiddlewareResponse(result.response)) {
    const { response } = result;
    if (request.method === 'HEAD' || request.method === 'OPTIONS') {
      return response.originResponse;
    }
    // NextResponse doesn't set cookies onto the originResponse, so we need to copy them over
    // In some cases, it's possible there are no headers set. See https://github.com/netlify/pod-ecosystem-frameworks/issues/475
    if (response.cookies._headers?.has('set-cookie')) {
      response.originResponse.headers.set('set-cookie', response.cookies._headers.get('set-cookie'));
    }
    // If it's JSON we don't need to use the rewriter, we can just parse it
    if (response.originResponse.headers.get('content-type')?.includes('application/json')) {
      const props = await response.originResponse.json();
      const transformed = response.dataTransforms.reduce((prev, transform)=>{
        return transform(prev);
      }, props);
      const body = JSON.stringify(transformed);
      const headers = new Headers(response.headers);
      headers.set('content-length', String(body.length));
      return Response.json(transformed, {
        ...response,
        headers
      });
    }
    if (response.dataTransforms.length > 0 || response.elementHandlers.length > 0) {
      // Log when HTMLRewriter code path is triggered (controlled by NETLIFY_LOG_HTML_REWRITER env var at runtime)
      if (Deno.env.get('NETLIFY_LOG_HTML_REWRITER') === 'true') {
        logger.withFields({
          dataTransforms_count: response.dataTransforms.length,
          elementHandlers_count: response.elementHandlers.length
        }).log('Using HTMLRewriter for response transformation');
      }
      const { initHtmlRewriter } = await import('../html-rewriter-wasm.ts');
      await initHtmlRewriter();
      // This var will hold the contents of the script tag
      let buffer = '';
      // Create an HTMLRewriter that matches the Next data script tag
      const rewriter = new HTMLRewriter();
      if (response.dataTransforms.length > 0) {
        rewriter.on('script[id="__NEXT_DATA__"]', {
          text (textChunk) {
            // Grab all the chunks in the Next data script tag
            buffer += textChunk.text;
            if (textChunk.lastInTextNode) {
              try {
                // When we have all the data, try to parse it as JSON
                const data = JSON.parse(buffer.trim());
                // Apply all of the transforms to the props
                const props = response.dataTransforms.reduce((prev, transform)=>transform(prev), data.props);
                // Replace the data with the transformed props
                // With `html: true` the input is treated as raw HTML
                // @see https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/#global-types
                textChunk.replace(JSON.stringify({
                  ...data,
                  props
                }), {
                  html: true
                });
              } catch (err) {
                console.log('Could not parse', err);
              }
            } else {
              // Remove the chunk after we've appended it to the buffer
              textChunk.remove();
            }
          }
        });
      }
      if (response.elementHandlers.length > 0) {
        response.elementHandlers.forEach(([selector, handlers])=>rewriter.on(selector, handlers));
      }
      return rewriter.transform(response.originResponse);
    } else {
      return response.originResponse;
    }
  }
  let edgeResponse = new Response(result.response.body, result.response);
  request.headers.set('x-nf-next-middleware', 'skip');
  let rewrite = edgeResponse.headers.get('x-middleware-rewrite');
  let redirect = edgeResponse.headers.get('location');
  let nextRedirect = edgeResponse.headers.get('x-nextjs-redirect');
  // Data requests (i.e. requests for /_next/data ) need special handling
  const isDataReq = request.headers.has('x-nextjs-data');
  // Data requests need to be normalized to the route path
  if (isDataReq && !redirect && !rewrite && !nextRedirect) {
    const requestUrl = new URL(request.url);
    const normalizedDataUrl = normalizeDataUrl(requestUrl.pathname);
    // Don't rewrite unless the URL has changed
    if (normalizedDataUrl !== requestUrl.pathname) {
      rewrite = `${normalizedDataUrl}${requestUrl.search}`;
      logger.withFields({
        rewrite_url: rewrite
      }).debug('Rewritten data URL');
    }
  }
  if (rewrite) {
    logger.withFields({
      rewrite_url: rewrite
    }).debug('Found middleware rewrite');
    const rewriteUrl = new URL(rewrite, request.url);
    const baseUrl = new URL(request.url);
    if (rewriteUrl.toString() === baseUrl.toString() && !hasMiddlewareResponseHeadersToApply(edgeResponse, {
      ignoreHeaders: [
        'x-middleware-rewrite'
      ]
    })) {
      logger.withFields({
        rewrite_url: rewrite
      }).debug('Rewrite URL is the same as original URL and no response headers need to be applied');
      return;
    }
    const relativeUrl = relativizeURL(rewrite, request.url);
    if (isDataReq) {
      // Data requests might be rewritten to an external URL
      // This header tells the client router the redirect target, and if it's external then it will do a full navigation
      edgeResponse.headers.set('x-nextjs-rewrite', relativeUrl);
    }
    if (rewriteUrl.origin !== baseUrl.origin) {
      logger.withFields({
        rewrite_url: rewrite
      }).debug('Rewriting to external url');
      const proxyRequest = await cloneRequest(rewriteUrl, request);
      // Remove Netlify internal headers
      for (const key of request.headers.keys()){
        if (key.startsWith('x-nf-')) {
          proxyRequest.headers.delete(key);
        }
      }
      return addMiddlewareHeaders(fetch(proxyRequest, {
        redirect: 'manual'
      }), edgeResponse);
    }
    if (isDataReq) {
      rewriteUrl.pathname = rewriteDataPath({
        dataUrl: new URL(request.url).pathname,
        newRoute: removeBasePath(rewriteUrl.pathname, nextConfig?.basePath),
        basePath: nextConfig?.basePath
      });
    } else {
      // respect trailing slash rules to prevent 308s
      rewriteUrl.pathname = normalizeTrailingSlash(rewriteUrl.pathname, nextConfig?.trailingSlash);
    }
    const target = normalizeLocalizedTarget({
      target: rewriteUrl.toString(),
      request,
      nextConfig
    });
    if (target === request.url && !hasMiddlewareResponseHeadersToApply(edgeResponse, {
      ignoreHeaders: [
        'x-middleware-rewrite'
      ]
    })) {
      logger.withFields({
        rewrite_url: rewrite
      }).debug('Normalized rewrite URL is the same as original URL and no response headers need to be applied');
      return;
    }
    edgeResponse.headers.set('x-middleware-rewrite', relativeUrl);
    request.headers.set('x-middleware-rewrite', target);
    // cookies set in middleware need to be available during the lambda request
    const newRequest = await cloneRequest(target, request);
    const newRequestCookies = mergeMiddlewareCookies(edgeResponse, newRequest);
    if (newRequestCookies) {
      newRequest.headers.set('Cookie', newRequestCookies);
    }
    return addMiddlewareHeaders(context.next(newRequest), edgeResponse);
  }
  if (redirect) {
    redirect = normalizeLocalizedTarget({
      target: redirect,
      request,
      nextConfig
    });
    if (redirect === request.url) {
      if (hasMiddlewareResponseHeadersToApply(edgeResponse, {
        ignoreHeaders: [
          'location'
        ]
      })) {
        // if we need to apply headers but the redirect is to the same URL, we should remove the location header and apply the other headers,
        // otherwise we might end up with a redirect loop in the browser with no way for the client to know that something has changed (e.g. cookies have been set)
        const headersWithoutLocation = new Headers(edgeResponse.headers);
        headersWithoutLocation.delete('location');
        headersWithoutLocation.set('x-middleware-next', '1');
        edgeResponse = new Response(null, {
          status: 200,
          headers: headersWithoutLocation
        });
      } else {
        logger.withFields({
          redirect_url: redirect
        }).debug('Redirect url is the same as original URL and no response headers need to be applied');
        return;
      }
    }
    edgeResponse.headers.set('location', relativizeURL(redirect, request.url));
  }
  // Data requests shouldn't automatically redirect in the browser (they might be HTML pages): they're handled by the router
  if (redirect && isDataReq) {
    edgeResponse.headers.delete('location');
    edgeResponse.headers.set('x-nextjs-redirect', relativizeURL(redirect, request.url));
  }
  nextRedirect = edgeResponse.headers.get('x-nextjs-redirect');
  if (nextRedirect && isDataReq) {
    edgeResponse.headers.set('x-nextjs-redirect', normalizeDataUrl(nextRedirect));
  }
  if (edgeResponse.headers.get('x-middleware-next') === '1') {
    edgeResponse.headers.delete('x-middleware-next');
    // cookies set in middleware need to be available during the lambda request
    const newRequest = await cloneRequest(request.url, request);
    const newRequestCookies = mergeMiddlewareCookies(edgeResponse, newRequest);
    if (newRequestCookies) {
      newRequest.headers.set('Cookie', newRequestCookies);
    }
    return addMiddlewareHeaders(context.next(newRequest), edgeResponse);
  }
  return edgeResponse;
};
/**
 * Normalizes the locale in a URL.
 */ function normalizeLocalizedTarget({ target, request, nextConfig }) {
  const targetUrl = new URL(target, request.url);
  const normalizedTarget = normalizeLocalePath(targetUrl.pathname, nextConfig?.i18n?.locales);
  if (normalizedTarget.detectedLocale && !normalizedTarget.pathname.startsWith(`/api/`) && !normalizedTarget.pathname.startsWith(`/_next/static/`)) {
    targetUrl.pathname = addBasePath(`/${normalizedTarget.detectedLocale}${normalizedTarget.pathname}`, nextConfig?.basePath) || `/`;
  } else {
    targetUrl.pathname = addBasePath(normalizedTarget.pathname, nextConfig?.basePath) || `/`;
  }
  return targetUrl.toString();
}
async function cloneRequest(url, request) {
  // This is not ideal, but streaming to an external URL doesn't work
  const body = request.body && !request.bodyUsed ? await request.arrayBuffer() : undefined;
  return new Request(url, {
    headers: request.headers,
    method: request.method,
    body
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdG1wL3RtcC0yNjA4LTRpU3RjMEh0bnVUaS9lZGdlLXJ1bnRpbWUvbGliL3Jlc3BvbnNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29udGV4dCB9IGZyb20gJ0BuZXRsaWZ5L2VkZ2UtZnVuY3Rpb25zJ1xuaW1wb3J0IHtcbiAgSFRNTFJld3JpdGVyLFxuICB0eXBlIFRleHRDaHVuayxcbn0gZnJvbSAnLi4vdmVuZG9yL2Rlbm8ubGFuZC94L2h0bWxyZXdyaXRlckB2MS4wLjAvc3JjL2luZGV4LnRzJ1xuXG5pbXBvcnQgeyB1cGRhdGVNb2RpZmllZEhlYWRlcnMgfSBmcm9tICcuL2hlYWRlcnMudHMnXG5pbXBvcnQgdHlwZSB7IFN0cnVjdHVyZWRMb2dnZXIgfSBmcm9tICcuL2xvZ2dpbmcudHMnXG5pbXBvcnQge1xuICBhZGRNaWRkbGV3YXJlSGVhZGVycyxcbiAgaGFzTWlkZGxld2FyZVJlc3BvbnNlSGVhZGVyc1RvQXBwbHksXG4gIGlzTWlkZGxld2FyZVJlcXVlc3QsXG4gIGlzTWlkZGxld2FyZVJlc3BvbnNlLFxuICBtZXJnZU1pZGRsZXdhcmVDb29raWVzLFxufSBmcm9tICcuL21pZGRsZXdhcmUudHMnXG5pbXBvcnQgeyBSZXF1ZXN0RGF0YSB9IGZyb20gJy4vbmV4dC1yZXF1ZXN0LnRzJ1xuaW1wb3J0IHtcbiAgYWRkQmFzZVBhdGgsXG4gIG5vcm1hbGl6ZURhdGFVcmwsXG4gIG5vcm1hbGl6ZUxvY2FsZVBhdGgsXG4gIG5vcm1hbGl6ZVRyYWlsaW5nU2xhc2gsXG4gIHJlbGF0aXZpemVVUkwsXG4gIHJlbW92ZUJhc2VQYXRoLFxuICByZXdyaXRlRGF0YVBhdGgsXG59IGZyb20gJy4vdXRpbC50cydcblxuZXhwb3J0IGludGVyZmFjZSBGZXRjaEV2ZW50UmVzdWx0IHtcbiAgcmVzcG9uc2U6IFJlc3BvbnNlXG4gIHdhaXRVbnRpbDogUHJvbWlzZTxhbnk+XG59XG5cbmludGVyZmFjZSBCdWlsZFJlc3BvbnNlT3B0aW9ucyB7XG4gIGNvbnRleHQ6IENvbnRleHRcbiAgbG9nZ2VyOiBTdHJ1Y3R1cmVkTG9nZ2VyXG4gIHJlcXVlc3Q6IFJlcXVlc3RcbiAgcmVzdWx0OiBGZXRjaEV2ZW50UmVzdWx0XG4gIG5leHRDb25maWc/OiBSZXF1ZXN0RGF0YVsnbmV4dENvbmZpZyddXG59XG5cbmV4cG9ydCBjb25zdCBidWlsZFJlc3BvbnNlID0gYXN5bmMgKHtcbiAgY29udGV4dCxcbiAgbG9nZ2VyLFxuICByZXF1ZXN0LFxuICByZXN1bHQsXG4gIG5leHRDb25maWcsXG59OiBCdWlsZFJlc3BvbnNlT3B0aW9ucyk6IFByb21pc2U8UmVzcG9uc2UgfCB2b2lkPiA9PiB7XG4gIGxvZ2dlclxuICAgIC53aXRoRmllbGRzKHsgaXNfbmV4dHJlc3BvbnNlX25leHQ6IHJlc3VsdC5yZXNwb25zZS5oZWFkZXJzLmhhcygneC1taWRkbGV3YXJlLW5leHQnKSB9KVxuICAgIC5kZWJ1ZygnQnVpbGRpbmcgTmV4dC5qcyByZXNwb25zZScpXG5cbiAgdXBkYXRlTW9kaWZpZWRIZWFkZXJzKHJlcXVlc3QuaGVhZGVycywgcmVzdWx0LnJlc3BvbnNlLmhlYWRlcnMpXG5cbiAgLy8gVGhleSd2ZSByZXR1cm5lZCB0aGUgTWlkZGxld2FyZVJlcXVlc3QgZGlyZWN0bHksIHNvIHdlJ2xsIGNhbGwgYG5leHQoKWAgZm9yIHRoZW0uXG4gIGlmIChpc01pZGRsZXdhcmVSZXF1ZXN0KHJlc3VsdC5yZXNwb25zZSkpIHtcbiAgICByZXN1bHQucmVzcG9uc2UgPSBhd2FpdCByZXN1bHQucmVzcG9uc2UubmV4dCgpXG4gIH1cblxuICBpZiAoaXNNaWRkbGV3YXJlUmVzcG9uc2UocmVzdWx0LnJlc3BvbnNlKSkge1xuICAgIGNvbnN0IHsgcmVzcG9uc2UgfSA9IHJlc3VsdFxuICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ0hFQUQnIHx8IHJlcXVlc3QubWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICAgIHJldHVybiByZXNwb25zZS5vcmlnaW5SZXNwb25zZVxuICAgIH1cblxuICAgIC8vIE5leHRSZXNwb25zZSBkb2Vzbid0IHNldCBjb29raWVzIG9udG8gdGhlIG9yaWdpblJlc3BvbnNlLCBzbyB3ZSBuZWVkIHRvIGNvcHkgdGhlbSBvdmVyXG4gICAgLy8gSW4gc29tZSBjYXNlcywgaXQncyBwb3NzaWJsZSB0aGVyZSBhcmUgbm8gaGVhZGVycyBzZXQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbmV0bGlmeS9wb2QtZWNvc3lzdGVtLWZyYW1ld29ya3MvaXNzdWVzLzQ3NVxuICAgIGlmIChyZXNwb25zZS5jb29raWVzLl9oZWFkZXJzPy5oYXMoJ3NldC1jb29raWUnKSkge1xuICAgICAgcmVzcG9uc2Uub3JpZ2luUmVzcG9uc2UuaGVhZGVycy5zZXQoXG4gICAgICAgICdzZXQtY29va2llJyxcbiAgICAgICAgcmVzcG9uc2UuY29va2llcy5faGVhZGVycy5nZXQoJ3NldC1jb29raWUnKSEsXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gSWYgaXQncyBKU09OIHdlIGRvbid0IG5lZWQgdG8gdXNlIHRoZSByZXdyaXRlciwgd2UgY2FuIGp1c3QgcGFyc2UgaXRcbiAgICBpZiAocmVzcG9uc2Uub3JpZ2luUmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpPy5pbmNsdWRlcygnYXBwbGljYXRpb24vanNvbicpKSB7XG4gICAgICBjb25zdCBwcm9wcyA9IGF3YWl0IHJlc3BvbnNlLm9yaWdpblJlc3BvbnNlLmpzb24oKVxuICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSByZXNwb25zZS5kYXRhVHJhbnNmb3Jtcy5yZWR1Y2UoKHByZXYsIHRyYW5zZm9ybSkgPT4ge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtKHByZXYpXG4gICAgICB9LCBwcm9wcylcbiAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh0cmFuc2Zvcm1lZClcbiAgICAgIGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhyZXNwb25zZS5oZWFkZXJzKVxuICAgICAgaGVhZGVycy5zZXQoJ2NvbnRlbnQtbGVuZ3RoJywgU3RyaW5nKGJvZHkubGVuZ3RoKSlcblxuICAgICAgcmV0dXJuIFJlc3BvbnNlLmpzb24odHJhbnNmb3JtZWQsIHsgLi4ucmVzcG9uc2UsIGhlYWRlcnMgfSlcbiAgICB9XG5cbiAgICBpZiAocmVzcG9uc2UuZGF0YVRyYW5zZm9ybXMubGVuZ3RoID4gMCB8fCByZXNwb25zZS5lbGVtZW50SGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gTG9nIHdoZW4gSFRNTFJld3JpdGVyIGNvZGUgcGF0aCBpcyB0cmlnZ2VyZWQgKGNvbnRyb2xsZWQgYnkgTkVUTElGWV9MT0dfSFRNTF9SRVdSSVRFUiBlbnYgdmFyIGF0IHJ1bnRpbWUpXG4gICAgICBpZiAoRGVuby5lbnYuZ2V0KCdORVRMSUZZX0xPR19IVE1MX1JFV1JJVEVSJykgPT09ICd0cnVlJykge1xuICAgICAgICBsb2dnZXJcbiAgICAgICAgICAud2l0aEZpZWxkcyh7XG4gICAgICAgICAgICBkYXRhVHJhbnNmb3Jtc19jb3VudDogcmVzcG9uc2UuZGF0YVRyYW5zZm9ybXMubGVuZ3RoLFxuICAgICAgICAgICAgZWxlbWVudEhhbmRsZXJzX2NvdW50OiByZXNwb25zZS5lbGVtZW50SGFuZGxlcnMubGVuZ3RoLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmxvZygnVXNpbmcgSFRNTFJld3JpdGVyIGZvciByZXNwb25zZSB0cmFuc2Zvcm1hdGlvbicpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgaW5pdEh0bWxSZXdyaXRlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9odG1sLXJld3JpdGVyLXdhc20udHMnKVxuICAgICAgYXdhaXQgaW5pdEh0bWxSZXdyaXRlcigpXG5cbiAgICAgIC8vIFRoaXMgdmFyIHdpbGwgaG9sZCB0aGUgY29udGVudHMgb2YgdGhlIHNjcmlwdCB0YWdcbiAgICAgIGxldCBidWZmZXIgPSAnJ1xuICAgICAgLy8gQ3JlYXRlIGFuIEhUTUxSZXdyaXRlciB0aGF0IG1hdGNoZXMgdGhlIE5leHQgZGF0YSBzY3JpcHQgdGFnXG4gICAgICBjb25zdCByZXdyaXRlciA9IG5ldyBIVE1MUmV3cml0ZXIoKVxuXG4gICAgICBpZiAocmVzcG9uc2UuZGF0YVRyYW5zZm9ybXMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXdyaXRlci5vbignc2NyaXB0W2lkPVwiX19ORVhUX0RBVEFfX1wiXScsIHtcbiAgICAgICAgICB0ZXh0KHRleHRDaHVuazogVGV4dENodW5rKSB7XG4gICAgICAgICAgICAvLyBHcmFiIGFsbCB0aGUgY2h1bmtzIGluIHRoZSBOZXh0IGRhdGEgc2NyaXB0IHRhZ1xuICAgICAgICAgICAgYnVmZmVyICs9IHRleHRDaHVuay50ZXh0XG4gICAgICAgICAgICBpZiAodGV4dENodW5rLmxhc3RJblRleHROb2RlKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gV2hlbiB3ZSBoYXZlIGFsbCB0aGUgZGF0YSwgdHJ5IHRvIHBhcnNlIGl0IGFzIEpTT05cbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShidWZmZXIudHJpbSgpKVxuICAgICAgICAgICAgICAgIC8vIEFwcGx5IGFsbCBvZiB0aGUgdHJhbnNmb3JtcyB0byB0aGUgcHJvcHNcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHJlc3BvbnNlLmRhdGFUcmFuc2Zvcm1zLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgIChwcmV2LCB0cmFuc2Zvcm0pID0+IHRyYW5zZm9ybShwcmV2KSxcbiAgICAgICAgICAgICAgICAgIGRhdGEucHJvcHMsXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGRhdGEgd2l0aCB0aGUgdHJhbnNmb3JtZWQgcHJvcHNcbiAgICAgICAgICAgICAgICAvLyBXaXRoIGBodG1sOiB0cnVlYCB0aGUgaW5wdXQgaXMgdHJlYXRlZCBhcyByYXcgSFRNTFxuICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXJzLmNsb3VkZmxhcmUuY29tL3dvcmtlcnMvcnVudGltZS1hcGlzL2h0bWwtcmV3cml0ZXIvI2dsb2JhbC10eXBlc1xuICAgICAgICAgICAgICAgIHRleHRDaHVuay5yZXBsYWNlKEpTT04uc3RyaW5naWZ5KHsgLi4uZGF0YSwgcHJvcHMgfSksIHsgaHRtbDogdHJ1ZSB9KVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ291bGQgbm90IHBhcnNlJywgZXJyKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGNodW5rIGFmdGVyIHdlJ3ZlIGFwcGVuZGVkIGl0IHRvIHRoZSBidWZmZXJcbiAgICAgICAgICAgICAgdGV4dENodW5rLnJlbW92ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3BvbnNlLmVsZW1lbnRIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlc3BvbnNlLmVsZW1lbnRIYW5kbGVycy5mb3JFYWNoKChbc2VsZWN0b3IsIGhhbmRsZXJzXSkgPT4gcmV3cml0ZXIub24oc2VsZWN0b3IsIGhhbmRsZXJzKSlcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXdyaXRlci50cmFuc2Zvcm0ocmVzcG9uc2Uub3JpZ2luUmVzcG9uc2UpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXNwb25zZS5vcmlnaW5SZXNwb25zZVxuICAgIH1cbiAgfVxuXG4gIGxldCBlZGdlUmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UocmVzdWx0LnJlc3BvbnNlLmJvZHksIHJlc3VsdC5yZXNwb25zZSlcbiAgcmVxdWVzdC5oZWFkZXJzLnNldCgneC1uZi1uZXh0LW1pZGRsZXdhcmUnLCAnc2tpcCcpXG5cbiAgbGV0IHJld3JpdGUgPSBlZGdlUmVzcG9uc2UuaGVhZGVycy5nZXQoJ3gtbWlkZGxld2FyZS1yZXdyaXRlJylcbiAgbGV0IHJlZGlyZWN0ID0gZWRnZVJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdsb2NhdGlvbicpXG4gIGxldCBuZXh0UmVkaXJlY3QgPSBlZGdlUmVzcG9uc2UuaGVhZGVycy5nZXQoJ3gtbmV4dGpzLXJlZGlyZWN0JylcblxuICAvLyBEYXRhIHJlcXVlc3RzIChpLmUuIHJlcXVlc3RzIGZvciAvX25leHQvZGF0YSApIG5lZWQgc3BlY2lhbCBoYW5kbGluZ1xuICBjb25zdCBpc0RhdGFSZXEgPSByZXF1ZXN0LmhlYWRlcnMuaGFzKCd4LW5leHRqcy1kYXRhJylcbiAgLy8gRGF0YSByZXF1ZXN0cyBuZWVkIHRvIGJlIG5vcm1hbGl6ZWQgdG8gdGhlIHJvdXRlIHBhdGhcbiAgaWYgKGlzRGF0YVJlcSAmJiAhcmVkaXJlY3QgJiYgIXJld3JpdGUgJiYgIW5leHRSZWRpcmVjdCkge1xuICAgIGNvbnN0IHJlcXVlc3RVcmwgPSBuZXcgVVJMKHJlcXVlc3QudXJsKVxuICAgIGNvbnN0IG5vcm1hbGl6ZWREYXRhVXJsID0gbm9ybWFsaXplRGF0YVVybChyZXF1ZXN0VXJsLnBhdGhuYW1lKVxuICAgIC8vIERvbid0IHJld3JpdGUgdW5sZXNzIHRoZSBVUkwgaGFzIGNoYW5nZWRcbiAgICBpZiAobm9ybWFsaXplZERhdGFVcmwgIT09IHJlcXVlc3RVcmwucGF0aG5hbWUpIHtcbiAgICAgIHJld3JpdGUgPSBgJHtub3JtYWxpemVkRGF0YVVybH0ke3JlcXVlc3RVcmwuc2VhcmNofWBcbiAgICAgIGxvZ2dlci53aXRoRmllbGRzKHsgcmV3cml0ZV91cmw6IHJld3JpdGUgfSkuZGVidWcoJ1Jld3JpdHRlbiBkYXRhIFVSTCcpXG4gICAgfVxuICB9XG5cbiAgaWYgKHJld3JpdGUpIHtcbiAgICBsb2dnZXIud2l0aEZpZWxkcyh7IHJld3JpdGVfdXJsOiByZXdyaXRlIH0pLmRlYnVnKCdGb3VuZCBtaWRkbGV3YXJlIHJld3JpdGUnKVxuXG4gICAgY29uc3QgcmV3cml0ZVVybCA9IG5ldyBVUkwocmV3cml0ZSwgcmVxdWVzdC51cmwpXG4gICAgY29uc3QgYmFzZVVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpXG4gICAgaWYgKFxuICAgICAgcmV3cml0ZVVybC50b1N0cmluZygpID09PSBiYXNlVXJsLnRvU3RyaW5nKCkgJiZcbiAgICAgICFoYXNNaWRkbGV3YXJlUmVzcG9uc2VIZWFkZXJzVG9BcHBseShlZGdlUmVzcG9uc2UsIHtcbiAgICAgICAgaWdub3JlSGVhZGVyczogWyd4LW1pZGRsZXdhcmUtcmV3cml0ZSddLFxuICAgICAgfSlcbiAgICApIHtcbiAgICAgIGxvZ2dlclxuICAgICAgICAud2l0aEZpZWxkcyh7IHJld3JpdGVfdXJsOiByZXdyaXRlIH0pXG4gICAgICAgIC5kZWJ1ZygnUmV3cml0ZSBVUkwgaXMgdGhlIHNhbWUgYXMgb3JpZ2luYWwgVVJMIGFuZCBubyByZXNwb25zZSBoZWFkZXJzIG5lZWQgdG8gYmUgYXBwbGllZCcpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCByZWxhdGl2ZVVybCA9IHJlbGF0aXZpemVVUkwocmV3cml0ZSwgcmVxdWVzdC51cmwpXG5cbiAgICBpZiAoaXNEYXRhUmVxKSB7XG4gICAgICAvLyBEYXRhIHJlcXVlc3RzIG1pZ2h0IGJlIHJld3JpdHRlbiB0byBhbiBleHRlcm5hbCBVUkxcbiAgICAgIC8vIFRoaXMgaGVhZGVyIHRlbGxzIHRoZSBjbGllbnQgcm91dGVyIHRoZSByZWRpcmVjdCB0YXJnZXQsIGFuZCBpZiBpdCdzIGV4dGVybmFsIHRoZW4gaXQgd2lsbCBkbyBhIGZ1bGwgbmF2aWdhdGlvblxuXG4gICAgICBlZGdlUmVzcG9uc2UuaGVhZGVycy5zZXQoJ3gtbmV4dGpzLXJld3JpdGUnLCByZWxhdGl2ZVVybClcbiAgICB9XG5cbiAgICBpZiAocmV3cml0ZVVybC5vcmlnaW4gIT09IGJhc2VVcmwub3JpZ2luKSB7XG4gICAgICBsb2dnZXIud2l0aEZpZWxkcyh7IHJld3JpdGVfdXJsOiByZXdyaXRlIH0pLmRlYnVnKCdSZXdyaXRpbmcgdG8gZXh0ZXJuYWwgdXJsJylcbiAgICAgIGNvbnN0IHByb3h5UmVxdWVzdCA9IGF3YWl0IGNsb25lUmVxdWVzdChyZXdyaXRlVXJsLCByZXF1ZXN0KVxuXG4gICAgICAvLyBSZW1vdmUgTmV0bGlmeSBpbnRlcm5hbCBoZWFkZXJzXG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiByZXF1ZXN0LmhlYWRlcnMua2V5cygpKSB7XG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aCgneC1uZi0nKSkge1xuICAgICAgICAgIHByb3h5UmVxdWVzdC5oZWFkZXJzLmRlbGV0ZShrZXkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFkZE1pZGRsZXdhcmVIZWFkZXJzKGZldGNoKHByb3h5UmVxdWVzdCwgeyByZWRpcmVjdDogJ21hbnVhbCcgfSksIGVkZ2VSZXNwb25zZSlcbiAgICB9XG5cbiAgICBpZiAoaXNEYXRhUmVxKSB7XG4gICAgICByZXdyaXRlVXJsLnBhdGhuYW1lID0gcmV3cml0ZURhdGFQYXRoKHtcbiAgICAgICAgZGF0YVVybDogbmV3IFVSTChyZXF1ZXN0LnVybCkucGF0aG5hbWUsXG4gICAgICAgIG5ld1JvdXRlOiByZW1vdmVCYXNlUGF0aChyZXdyaXRlVXJsLnBhdGhuYW1lLCBuZXh0Q29uZmlnPy5iYXNlUGF0aCksXG4gICAgICAgIGJhc2VQYXRoOiBuZXh0Q29uZmlnPy5iYXNlUGF0aCxcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHJlc3BlY3QgdHJhaWxpbmcgc2xhc2ggcnVsZXMgdG8gcHJldmVudCAzMDhzXG4gICAgICByZXdyaXRlVXJsLnBhdGhuYW1lID0gbm9ybWFsaXplVHJhaWxpbmdTbGFzaChyZXdyaXRlVXJsLnBhdGhuYW1lLCBuZXh0Q29uZmlnPy50cmFpbGluZ1NsYXNoKVxuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IG5vcm1hbGl6ZUxvY2FsaXplZFRhcmdldCh7IHRhcmdldDogcmV3cml0ZVVybC50b1N0cmluZygpLCByZXF1ZXN0LCBuZXh0Q29uZmlnIH0pXG4gICAgaWYgKFxuICAgICAgdGFyZ2V0ID09PSByZXF1ZXN0LnVybCAmJlxuICAgICAgIWhhc01pZGRsZXdhcmVSZXNwb25zZUhlYWRlcnNUb0FwcGx5KGVkZ2VSZXNwb25zZSwge1xuICAgICAgICBpZ25vcmVIZWFkZXJzOiBbJ3gtbWlkZGxld2FyZS1yZXdyaXRlJ10sXG4gICAgICB9KVxuICAgICkge1xuICAgICAgbG9nZ2VyXG4gICAgICAgIC53aXRoRmllbGRzKHsgcmV3cml0ZV91cmw6IHJld3JpdGUgfSlcbiAgICAgICAgLmRlYnVnKFxuICAgICAgICAgICdOb3JtYWxpemVkIHJld3JpdGUgVVJMIGlzIHRoZSBzYW1lIGFzIG9yaWdpbmFsIFVSTCBhbmQgbm8gcmVzcG9uc2UgaGVhZGVycyBuZWVkIHRvIGJlIGFwcGxpZWQnLFxuICAgICAgICApXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgZWRnZVJlc3BvbnNlLmhlYWRlcnMuc2V0KCd4LW1pZGRsZXdhcmUtcmV3cml0ZScsIHJlbGF0aXZlVXJsKVxuICAgIHJlcXVlc3QuaGVhZGVycy5zZXQoJ3gtbWlkZGxld2FyZS1yZXdyaXRlJywgdGFyZ2V0KVxuXG4gICAgLy8gY29va2llcyBzZXQgaW4gbWlkZGxld2FyZSBuZWVkIHRvIGJlIGF2YWlsYWJsZSBkdXJpbmcgdGhlIGxhbWJkYSByZXF1ZXN0XG4gICAgY29uc3QgbmV3UmVxdWVzdCA9IGF3YWl0IGNsb25lUmVxdWVzdCh0YXJnZXQsIHJlcXVlc3QpXG4gICAgY29uc3QgbmV3UmVxdWVzdENvb2tpZXMgPSBtZXJnZU1pZGRsZXdhcmVDb29raWVzKGVkZ2VSZXNwb25zZSwgbmV3UmVxdWVzdClcbiAgICBpZiAobmV3UmVxdWVzdENvb2tpZXMpIHtcbiAgICAgIG5ld1JlcXVlc3QuaGVhZGVycy5zZXQoJ0Nvb2tpZScsIG5ld1JlcXVlc3RDb29raWVzKVxuICAgIH1cblxuICAgIHJldHVybiBhZGRNaWRkbGV3YXJlSGVhZGVycyhjb250ZXh0Lm5leHQobmV3UmVxdWVzdCksIGVkZ2VSZXNwb25zZSlcbiAgfVxuXG4gIGlmIChyZWRpcmVjdCkge1xuICAgIHJlZGlyZWN0ID0gbm9ybWFsaXplTG9jYWxpemVkVGFyZ2V0KHsgdGFyZ2V0OiByZWRpcmVjdCwgcmVxdWVzdCwgbmV4dENvbmZpZyB9KVxuICAgIGlmIChyZWRpcmVjdCA9PT0gcmVxdWVzdC51cmwpIHtcbiAgICAgIGlmIChoYXNNaWRkbGV3YXJlUmVzcG9uc2VIZWFkZXJzVG9BcHBseShlZGdlUmVzcG9uc2UsIHsgaWdub3JlSGVhZGVyczogWydsb2NhdGlvbiddIH0pKSB7XG4gICAgICAgIC8vIGlmIHdlIG5lZWQgdG8gYXBwbHkgaGVhZGVycyBidXQgdGhlIHJlZGlyZWN0IGlzIHRvIHRoZSBzYW1lIFVSTCwgd2Ugc2hvdWxkIHJlbW92ZSB0aGUgbG9jYXRpb24gaGVhZGVyIGFuZCBhcHBseSB0aGUgb3RoZXIgaGVhZGVycyxcbiAgICAgICAgLy8gb3RoZXJ3aXNlIHdlIG1pZ2h0IGVuZCB1cCB3aXRoIGEgcmVkaXJlY3QgbG9vcCBpbiB0aGUgYnJvd3NlciB3aXRoIG5vIHdheSBmb3IgdGhlIGNsaWVudCB0byBrbm93IHRoYXQgc29tZXRoaW5nIGhhcyBjaGFuZ2VkIChlLmcuIGNvb2tpZXMgaGF2ZSBiZWVuIHNldClcbiAgICAgICAgY29uc3QgaGVhZGVyc1dpdGhvdXRMb2NhdGlvbiA9IG5ldyBIZWFkZXJzKGVkZ2VSZXNwb25zZS5oZWFkZXJzKVxuICAgICAgICBoZWFkZXJzV2l0aG91dExvY2F0aW9uLmRlbGV0ZSgnbG9jYXRpb24nKVxuICAgICAgICBoZWFkZXJzV2l0aG91dExvY2F0aW9uLnNldCgneC1taWRkbGV3YXJlLW5leHQnLCAnMScpXG4gICAgICAgIGVkZ2VSZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgICAgaGVhZGVyczogaGVhZGVyc1dpdGhvdXRMb2NhdGlvbixcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZ2dlclxuICAgICAgICAgIC53aXRoRmllbGRzKHsgcmVkaXJlY3RfdXJsOiByZWRpcmVjdCB9KVxuICAgICAgICAgIC5kZWJ1ZyhcbiAgICAgICAgICAgICdSZWRpcmVjdCB1cmwgaXMgdGhlIHNhbWUgYXMgb3JpZ2luYWwgVVJMIGFuZCBubyByZXNwb25zZSBoZWFkZXJzIG5lZWQgdG8gYmUgYXBwbGllZCcsXG4gICAgICAgICAgKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gICAgZWRnZVJlc3BvbnNlLmhlYWRlcnMuc2V0KCdsb2NhdGlvbicsIHJlbGF0aXZpemVVUkwocmVkaXJlY3QsIHJlcXVlc3QudXJsKSlcbiAgfVxuXG4gIC8vIERhdGEgcmVxdWVzdHMgc2hvdWxkbid0IGF1dG9tYXRpY2FsbHkgcmVkaXJlY3QgaW4gdGhlIGJyb3dzZXIgKHRoZXkgbWlnaHQgYmUgSFRNTCBwYWdlcyk6IHRoZXkncmUgaGFuZGxlZCBieSB0aGUgcm91dGVyXG4gIGlmIChyZWRpcmVjdCAmJiBpc0RhdGFSZXEpIHtcbiAgICBlZGdlUmVzcG9uc2UuaGVhZGVycy5kZWxldGUoJ2xvY2F0aW9uJylcbiAgICBlZGdlUmVzcG9uc2UuaGVhZGVycy5zZXQoJ3gtbmV4dGpzLXJlZGlyZWN0JywgcmVsYXRpdml6ZVVSTChyZWRpcmVjdCwgcmVxdWVzdC51cmwpKVxuICB9XG5cbiAgbmV4dFJlZGlyZWN0ID0gZWRnZVJlc3BvbnNlLmhlYWRlcnMuZ2V0KCd4LW5leHRqcy1yZWRpcmVjdCcpXG5cbiAgaWYgKG5leHRSZWRpcmVjdCAmJiBpc0RhdGFSZXEpIHtcbiAgICBlZGdlUmVzcG9uc2UuaGVhZGVycy5zZXQoJ3gtbmV4dGpzLXJlZGlyZWN0Jywgbm9ybWFsaXplRGF0YVVybChuZXh0UmVkaXJlY3QpKVxuICB9XG5cbiAgaWYgKGVkZ2VSZXNwb25zZS5oZWFkZXJzLmdldCgneC1taWRkbGV3YXJlLW5leHQnKSA9PT0gJzEnKSB7XG4gICAgZWRnZVJlc3BvbnNlLmhlYWRlcnMuZGVsZXRlKCd4LW1pZGRsZXdhcmUtbmV4dCcpXG5cbiAgICAvLyBjb29raWVzIHNldCBpbiBtaWRkbGV3YXJlIG5lZWQgdG8gYmUgYXZhaWxhYmxlIGR1cmluZyB0aGUgbGFtYmRhIHJlcXVlc3RcbiAgICBjb25zdCBuZXdSZXF1ZXN0ID0gYXdhaXQgY2xvbmVSZXF1ZXN0KHJlcXVlc3QudXJsLCByZXF1ZXN0KVxuICAgIGNvbnN0IG5ld1JlcXVlc3RDb29raWVzID0gbWVyZ2VNaWRkbGV3YXJlQ29va2llcyhlZGdlUmVzcG9uc2UsIG5ld1JlcXVlc3QpXG4gICAgaWYgKG5ld1JlcXVlc3RDb29raWVzKSB7XG4gICAgICBuZXdSZXF1ZXN0LmhlYWRlcnMuc2V0KCdDb29raWUnLCBuZXdSZXF1ZXN0Q29va2llcylcbiAgICB9XG5cbiAgICByZXR1cm4gYWRkTWlkZGxld2FyZUhlYWRlcnMoY29udGV4dC5uZXh0KG5ld1JlcXVlc3QpLCBlZGdlUmVzcG9uc2UpXG4gIH1cblxuICByZXR1cm4gZWRnZVJlc3BvbnNlXG59XG5cbi8qKlxuICogTm9ybWFsaXplcyB0aGUgbG9jYWxlIGluIGEgVVJMLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVMb2NhbGl6ZWRUYXJnZXQoe1xuICB0YXJnZXQsXG4gIHJlcXVlc3QsXG4gIG5leHRDb25maWcsXG59OiB7XG4gIHRhcmdldDogc3RyaW5nXG4gIHJlcXVlc3Q6IFJlcXVlc3RcbiAgbmV4dENvbmZpZz86IFJlcXVlc3REYXRhWyduZXh0Q29uZmlnJ11cbn0pOiBzdHJpbmcge1xuICBjb25zdCB0YXJnZXRVcmwgPSBuZXcgVVJMKHRhcmdldCwgcmVxdWVzdC51cmwpXG5cbiAgY29uc3Qgbm9ybWFsaXplZFRhcmdldCA9IG5vcm1hbGl6ZUxvY2FsZVBhdGgodGFyZ2V0VXJsLnBhdGhuYW1lLCBuZXh0Q29uZmlnPy5pMThuPy5sb2NhbGVzKVxuXG4gIGlmIChcbiAgICBub3JtYWxpemVkVGFyZ2V0LmRldGVjdGVkTG9jYWxlICYmXG4gICAgIW5vcm1hbGl6ZWRUYXJnZXQucGF0aG5hbWUuc3RhcnRzV2l0aChgL2FwaS9gKSAmJlxuICAgICFub3JtYWxpemVkVGFyZ2V0LnBhdGhuYW1lLnN0YXJ0c1dpdGgoYC9fbmV4dC9zdGF0aWMvYClcbiAgKSB7XG4gICAgdGFyZ2V0VXJsLnBhdGhuYW1lID1cbiAgICAgIGFkZEJhc2VQYXRoKFxuICAgICAgICBgLyR7bm9ybWFsaXplZFRhcmdldC5kZXRlY3RlZExvY2FsZX0ke25vcm1hbGl6ZWRUYXJnZXQucGF0aG5hbWV9YCxcbiAgICAgICAgbmV4dENvbmZpZz8uYmFzZVBhdGgsXG4gICAgICApIHx8IGAvYFxuICB9IGVsc2Uge1xuICAgIHRhcmdldFVybC5wYXRobmFtZSA9IGFkZEJhc2VQYXRoKG5vcm1hbGl6ZWRUYXJnZXQucGF0aG5hbWUsIG5leHRDb25maWc/LmJhc2VQYXRoKSB8fCBgL2BcbiAgfVxuICByZXR1cm4gdGFyZ2V0VXJsLnRvU3RyaW5nKClcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2xvbmVSZXF1ZXN0KHVybCwgcmVxdWVzdDogUmVxdWVzdCkge1xuICAvLyBUaGlzIGlzIG5vdCBpZGVhbCwgYnV0IHN0cmVhbWluZyB0byBhbiBleHRlcm5hbCBVUkwgZG9lc24ndCB3b3JrXG4gIGNvbnN0IGJvZHkgPSByZXF1ZXN0LmJvZHkgJiYgIXJlcXVlc3QuYm9keVVzZWQgPyBhd2FpdCByZXF1ZXN0LmFycmF5QnVmZmVyKCkgOiB1bmRlZmluZWRcbiAgcmV0dXJuIG5ldyBSZXF1ZXN0KHVybCwge1xuICAgIGhlYWRlcnM6IHJlcXVlc3QuaGVhZGVycyxcbiAgICBtZXRob2Q6IHJlcXVlc3QubWV0aG9kLFxuICAgIGJvZHksXG4gIH0pXG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FDRSxZQUFZLFFBRVAseURBQXdEO0FBRS9ELFNBQVMscUJBQXFCLFFBQVEsZUFBYztBQUVwRCxTQUNFLG9CQUFvQixFQUNwQixtQ0FBbUMs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
// denoCacheMetadata=12453740646577013977,18066837777939101711