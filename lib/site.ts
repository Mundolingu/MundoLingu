const PRIMARY = "https://www.mundolingu.com";

/**
 * www.mundolingu.com is the primary domain — the apex only 301s to it. Any apex
 * value gets normalised up to www so canonical tags, the sitemap and Stripe
 * redirects never advertise the redirecting host. Other origins (localhost, a
 * deploy preview URL) pass through untouched.
 */
export function siteUrl(raw?: string): string {
  if (!raw) return PRIMARY;
  try {
    const url = new URL(raw);
    if (url.hostname === "mundolingu.com") url.hostname = "www.mundolingu.com";
    return url.origin;
  } catch {
    return PRIMARY;
  }
}

/** Canonical origin for metadata, robots and the sitemap. */
export const SITE_URL = siteUrl(process.env.NEXT_PUBLIC_SITE_URL);
