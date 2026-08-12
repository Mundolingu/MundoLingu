import { NextResponse } from "next/server";

// Latest posts and reels from @mundolingu, for the "Follow the journey" tiles.
//
// Setup (once): create a long-lived Instagram access token and add it in
// Netlify → Site settings → Environment variables as INSTAGRAM_ACCESS_TOKEN.
// Optionally set INSTAGRAM_USER_ID if the token belongs to a business account
// managed through the Facebook Graph API. Until then this returns an empty
// list and the site falls back to its plain tiles — nothing breaks.

const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const CACHE_SECONDS = 1800; // refresh the feed at most every 30 minutes

type Tile = {
  id: string;
  image: string;
  permalink: string;
  isVideo: boolean;
  caption: string;
};

function toTile(item: any): Tile | null {
  const isVideo = item?.media_type === "VIDEO";
  const image = isVideo
    ? item?.thumbnail_url || item?.media_url
    : item?.media_url || item?.thumbnail_url;
  if (!image || !item?.permalink) return null;
  return {
    id: String(item.id ?? item.permalink),
    image,
    permalink: item.permalink,
    isVideo,
    caption: String(item.caption ?? "").slice(0, 140),
  };
}

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: true, connected: false, posts: [] },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  }

  const userId = process.env.INSTAGRAM_USER_ID;
  const endpoint = userId
    ? `https://graph.facebook.com/v21.0/${userId}/media`
    : "https://graph.instagram.com/me/media";
  const url = `${endpoint}?fields=${FIELDS}&limit=12&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) {
      // Token expired or Instagram is unhappy — fall back to the plain tiles
      // rather than showing an error on the homepage.
      return NextResponse.json(
        { ok: true, connected: false, posts: [] },
        { headers: { "Cache-Control": "public, max-age=300" } }
      );
    }

    const json = await res.json();
    const posts = (Array.isArray(json?.data) ? json.data : [])
      .map(toTile)
      .filter(Boolean)
      .slice(0, 8);

    return NextResponse.json(
      { ok: true, connected: true, posts },
      {
        headers: {
          "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
          "Netlify-CDN-Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400, stale-if-error=604800`,
        },
      }
    );
  } catch {
    return NextResponse.json(
      { ok: true, connected: false, posts: [] },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }
}
