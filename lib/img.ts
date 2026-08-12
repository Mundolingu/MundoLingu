// The brand artwork (workbook covers, teacher portraits) is uploaded at full
// resolution — the covers are close to 2 MB each. Netlify's Image CDN resizes
// and re-encodes them to webp/avif on the fly, so a page can show a dozen
// without the visitor downloading the originals.
//
// Only same-origin paths are rewritten. Anything already absolute is handed
// back untouched, since remote hosts need an entry in netlify.toml first.
export function cdnImage(src: string, width: number, height?: number): string {
  if (!src.startsWith("/") || src.startsWith("/.netlify/")) return src;

  const params = new URLSearchParams({ url: src, w: String(width) });
  if (height) {
    params.set("h", String(height));
    params.set("fit", "cover");
  }
  return `/.netlify/images?${params.toString()}`;
}

// Same image at 1x and 2x, for `srcSet` on anything that matters visually.
export function cdnSrcSet(src: string, width: number, height?: number): string {
  if (!src.startsWith("/") || src.startsWith("/.netlify/")) return "";

  const at = (scale: number) =>
    `${cdnImage(src, width * scale, height ? height * scale : undefined)} ${scale}x`;
  return `${at(1)}, ${at(2)}`;
}
