import { HTMLRewriter as RawHTMLRewriter } from "../pkg/htmlrewriter.js";
export { default as init } from "../pkg/htmlrewriter.js";
export class HTMLRewriter {
  constructor(){}
  elementHandlers = [];
  documentHandlers = [];
  on(selector, handlers) {
    this.elementHandlers.push([
      selector,
      handlers
    ]);
    return this;
  }
  onDocument(handlers) {
    this.documentHandlers.push(handlers);
    return this;
  }
  transform(response) {
    const body = response.body;
    // HTMLRewriter doesn't run the end handler if the body is null, so it's
    // pointless to setup the transform stream.
    if (body === null) {
      return new Response(body, response);
    }
    if (response instanceof Response) {
      // Make sure we validate chunks are BufferSources and convert them to
      // Uint8Arrays as required by the Rust glue code.
      response = new Response(response.body, response);
    }
    let rewriter;
    const transformStream = new TransformStream({
      start: (controller)=>{
        // Create a rewriter instance for this transformation that writes its
        // output to the transformed response's stream. Note that each
        // RawHTMLRewriter can only be used once.
        rewriter = new RawHTMLRewriter((chunk)=>{
          // enqueue will throw on empty chunks
          if (chunk.length !== 0) controller.enqueue(chunk);
        });
        // Add all registered handlers
        for (const [selector, handlers] of this.elementHandlers){
          rewriter.on(selector, handlers);
        }
        for (const handlers of this.documentHandlers){
          rewriter.onDocument(handlers);
        }
      },
      transform: (chunk)=>{
        rewriter.write(chunk);
      },
      flush: ()=>{
        rewriter.end();
        rewriter.free();
      }
    });
    // Return a response with the transformed body, copying over headers, etc
    const res = new Response(body.pipeThrough(transformStream), response);
    // If Content-Length is set, it's probably going to be wrong, since we're
    // rewriting content, so remove it
    res.headers.delete("Content-Length");
    return res;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vb3B0L2J1aWxkL3JlcG8vLm5ldGxpZnkvZWRnZS1mdW5jdGlvbnMvX19fbmV0bGlmeS1lZGdlLWhhbmRsZXItbWlkZGxld2FyZS9lZGdlLXJ1bnRpbWUvdmVuZG9yL2Rlbm8ubGFuZC94L2h0bWxyZXdyaXRlckB2MS4wLjAvc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEhUTUxSZXdyaXRlciBhcyBSYXdIVE1MUmV3cml0ZXIgfSBmcm9tIFwiLi4vcGtnL2h0bWxyZXdyaXRlci5qc1wiO1xuaW1wb3J0IHR5cGUgeyBEb2N1bWVudEhhbmRsZXJzLCBFbGVtZW50SGFuZGxlcnMgfSBmcm9tIFwiLi90eXBlcy5kLnRzXCI7XG5cbmV4cG9ydCB0eXBlIHtcbiAgQ29tbWVudCxcbiAgQ29udGVudFR5cGVPcHRpb25zLFxuICBEb2N0eXBlLFxuICBEb2N1bWVudEVuZCxcbiAgRG9jdW1lbnRIYW5kbGVycyxcbiAgRWxlbWVudCxcbiAgRWxlbWVudEhhbmRsZXJzLFxuICBFbmRUYWcsXG4gIFRleHRDaHVuayxcbn0gZnJvbSBcIi4vdHlwZXMuZC50c1wiO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIGluaXQgfSBmcm9tIFwiLi4vcGtnL2h0bWxyZXdyaXRlci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgSFRNTFJld3JpdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIGVsZW1lbnRIYW5kbGVyczogW3NlbGVjdG9yOiBzdHJpbmcsIGhhbmRsZXJzOiBFbGVtZW50SGFuZGxlcnNdW10gPSBbXTtcbiAgZG9jdW1lbnRIYW5kbGVyczogRG9jdW1lbnRIYW5kbGVyc1tdID0gW107XG5cbiAgb24oc2VsZWN0b3I6IHN0cmluZywgaGFuZGxlcnM6IEVsZW1lbnRIYW5kbGVycyk6IEhUTUxSZXdyaXRlciB7XG4gICAgdGhpcy5lbGVtZW50SGFuZGxlcnMucHVzaChbc2VsZWN0b3IsIGhhbmRsZXJzXSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgb25Eb2N1bWVudChoYW5kbGVyczogRG9jdW1lbnRIYW5kbGVycyk6IEhUTUxSZXdyaXRlciB7XG4gICAgdGhpcy5kb2N1bWVudEhhbmRsZXJzLnB1c2goaGFuZGxlcnMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdHJhbnNmb3JtKHJlc3BvbnNlOiBSZXNwb25zZSk6IFJlc3BvbnNlIHtcbiAgICBjb25zdCBib2R5ID0gcmVzcG9uc2UuYm9keSBhcyBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PiB8IG51bGw7XG4gICAgLy8gSFRNTFJld3JpdGVyIGRvZXNuJ3QgcnVuIHRoZSBlbmQgaGFuZGxlciBpZiB0aGUgYm9keSBpcyBudWxsLCBzbyBpdCdzXG4gICAgLy8gcG9pbnRsZXNzIHRvIHNldHVwIHRoZSB0cmFuc2Zvcm0gc3RyZWFtLlxuICAgIGlmIChib2R5ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICBpZiAocmVzcG9uc2UgaW5zdGFuY2VvZiBSZXNwb25zZSkge1xuICAgICAgLy8gTWFrZSBzdXJlIHdlIHZhbGlkYXRlIGNodW5rcyBhcmUgQnVmZmVyU291cmNlcyBhbmQgY29udmVydCB0aGVtIHRvXG4gICAgICAvLyBVaW50OEFycmF5cyBhcyByZXF1aXJlZCBieSB0aGUgUnVzdCBnbHVlIGNvZGUuXG4gICAgICByZXNwb25zZSA9IG5ldyBSZXNwb25zZShyZXNwb25zZS5ib2R5LCByZXNwb25zZSk7XG4gICAgfVxuXG4gICAgbGV0IHJld3JpdGVyOiBSYXdIVE1MUmV3cml0ZXI7XG4gICAgY29uc3QgdHJhbnNmb3JtU3RyZWFtID0gbmV3IFRyYW5zZm9ybVN0cmVhbTxVaW50OEFycmF5LCBVaW50OEFycmF5Pih7XG4gICAgICBzdGFydDogKGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgLy8gQ3JlYXRlIGEgcmV3cml0ZXIgaW5zdGFuY2UgZm9yIHRoaXMgdHJhbnNmb3JtYXRpb24gdGhhdCB3cml0ZXMgaXRzXG4gICAgICAgIC8vIG91dHB1dCB0byB0aGUgdHJhbnNmb3JtZWQgcmVzcG9uc2UncyBzdHJlYW0uIE5vdGUgdGhhdCBlYWNoXG4gICAgICAgIC8vIFJhd0hUTUxSZXdyaXRlciBjYW4gb25seSBiZSB1c2VkIG9uY2UuXG4gICAgICAgIHJld3JpdGVyID0gbmV3IFJhd0hUTUxSZXdyaXRlcigoY2h1bms6IFVpbnQ4QXJyYXkpID0+IHtcbiAgICAgICAgICAvLyBlbnF1ZXVlIHdpbGwgdGhyb3cgb24gZW1wdHkgY2h1bmtzXG4gICAgICAgICAgaWYgKGNodW5rLmxlbmd0aCAhPT0gMCkgY29udHJvbGxlci5lbnF1ZXVlKGNodW5rKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIEFkZCBhbGwgcmVnaXN0ZXJlZCBoYW5kbGVyc1xuICAgICAgICBmb3IgKGNvbnN0IFtzZWxlY3RvciwgaGFuZGxlcnNdIG9mIHRoaXMuZWxlbWVudEhhbmRsZXJzKSB7XG4gICAgICAgICAgcmV3cml0ZXIub24oc2VsZWN0b3IsIGhhbmRsZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXJzIG9mIHRoaXMuZG9jdW1lbnRIYW5kbGVycykge1xuICAgICAgICAgIHJld3JpdGVyLm9uRG9jdW1lbnQoaGFuZGxlcnMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdHJhbnNmb3JtOiAoY2h1bmspID0+IHtcbiAgICAgICAgcmV3cml0ZXIud3JpdGUoY2h1bmspO1xuICAgICAgfSxcbiAgICAgIGZsdXNoOiAoKSA9PiB7XG4gICAgICAgIHJld3JpdGVyLmVuZCgpO1xuICAgICAgICByZXdyaXRlci5mcmVlKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIFJldHVybiBhIHJlc3BvbnNlIHdpdGggdGhlIHRyYW5zZm9ybWVkIGJvZHksIGNvcHlpbmcgb3ZlciBoZWFkZXJzLCBldGNcbiAgICBjb25zdCByZXMgPSBuZXcgUmVzcG9uc2UoYm9keS5waXBlVGhyb3VnaCh0cmFuc2Zvcm1TdHJlYW0pLCByZXNwb25zZSk7XG4gICAgLy8gSWYgQ29udGVudC1MZW5ndGggaXMgc2V0LCBpdCdzIHByb2JhYmx5IGdvaW5nIHRvIGJlIHdyb25nLCBzaW5jZSB3ZSdyZVxuICAgIC8vIHJld3JpdGluZyBjb250ZW50LCBzbyByZW1vdmUgaXRcbiAgICByZXMuaGVhZGVycy5kZWxldGUoXCJDb250ZW50LUxlbmd0aFwiKTtcbiAgICByZXR1cm4gcmVzO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxnQkFBZ0IsZUFBZSxRQUFRLHlCQUF5QjtBQWV6RSxTQUFTLFdBQVcsSUFBSSxRQUFRLHlCQUF5QjtBQUV6RCxPQUFPLE1BQU07RUFDWCxhQUFjLENBQUM7RUFFZixrQkFBbUUsRUFBRSxDQUFDO0VBQ3RFLG1CQUF1QyxFQUFFLENBQUM7RUFFMUMsR0FBRyxRQUFnQixFQUFFLFFBQXlCLEVBQWdCO0lBQzVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO01BQUM7TUFBVTtLQUFTO0lBQzlDLE9BQU8sSUFBSTtFQUNiO0VBQ0EsV0FBVyxRQUEwQixFQUFnQjtJQUNuRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDO0lBQzNCLE9BQU8sSUFBSTtFQUNiO0VBRUEsVUFBVSxRQUFrQixFQUFZO0lBQ3RDLE1BQU0sT0FBTyxTQUFTLElBQUk7SUFDMUIsd0VBQXdFO0lBQ3hFLDJDQUEyQztJQUMzQyxJQUFJLFNBQVMsTUFBTTtNQUNqQixPQUFPLElBQUksU0FBUyxNQUFNO0lBQzVCO0lBRUEsSUFBSSxvQkFBb0IsVUFBVTtNQUNoQyxxRUFBcUU7TUFDckUsaURBQWlEO01BQ2pELFdBQVcsSUFBSSxTQUFTLFNBQVMsSUFBSSxFQUFFO0lBQ3pDO0lBRUEsSUFBSTtJQUNKLE1BQU0sa0JBQWtCLElBQUksZ0JBQXdDO01BQ2xFLE9BQU8sQ0FBQztRQUNOLHFFQUFxRTtRQUNyRSw4REFBOEQ7UUFDOUQseUNBQXlDO1FBQ3pDLFdBQVcsSUFBSSxnQkFBZ0IsQ0FBQztVQUM5QixxQ0FBcUM7VUFDckMsSUFBSSxNQUFNLE1BQU0sS0FBSyxHQUFHLFdBQVcsT0FBTyxDQUFDO1FBQzdDO1FBQ0EsOEJBQThCO1FBQzlCLEtBQUssTUFBTSxDQUFDLFVBQVUsU0FBUyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUU7VUFDdkQsU0FBUyxFQUFFLENBQUMsVUFBVTtRQUN4QjtRQUNBLEtBQUssTUFBTSxZQUFZLElBQUksQ0FBQyxnQkFBZ0IsQ0FBRTtVQUM1QyxTQUFTLFVBQVUsQ0FBQztRQUN0QjtNQUNGO01BQ0EsV0FBVyxDQUFDO1FBQ1YsU0FBUyxLQUFLLENBQUM7TUFDakI7TUFDQSxPQUFPO1FBQ0wsU0FBUyxHQUFHO1FBQ1osU0FBUyxJQUFJO01BQ2Y7SUFDRjtJQUNBLHlFQUF5RTtJQUN6RSxNQUFNLE1BQU0sSUFBSSxTQUFTLEtBQUssV0FBVyxDQUFDLGtCQUFrQjtJQUM1RCx5RUFBeUU7SUFDekUsa0NBQWtDO0lBQ2xDLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNuQixPQUFPO0VBQ1Q7QUFDRiJ9
// denoCacheMetadata=9398018693395992315,5242890612307100533