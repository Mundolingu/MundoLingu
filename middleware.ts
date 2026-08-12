import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const AUTH_COOKIE = /^sb-.*-auth-token(\.\d+)?$/;

/**
 * Reads the Supabase auth cookie (which Supabase splits across
 * `…auth-token.0`, `.1`, … when it gets large) and returns the session expiry
 * in seconds. Returns null when there is no session cookie, or when the cookie
 * can't be understood — in which case we fall back to asking Supabase.
 */
function sessionExpiry(request: NextRequest): number | null {
  const parts = request.cookies
    .getAll()
    .filter((c) => AUTH_COOKIE.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

  if (!parts.length) return null;

  try {
    let raw = parts.map((c) => c.value).join("");
    if (raw.startsWith("base64-")) {
      let b64 = raw.slice(7).replace(/-/g, "+").replace(/_/g, "/");
      b64 += "=".repeat((4 - (b64.length % 4)) % 4);
      const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
      raw = new TextDecoder().decode(bytes);
    }
    const expiresAt = JSON.parse(raw)?.expires_at;
    return typeof expiresAt === "number" ? expiresAt : null;
  } catch {
    return null;
  }
}

function toLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  // If Supabase isn't configured yet, don't block anything.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();

  const expiry = sessionExpiry(request);

  // No session cookie at all — bounce to login without calling out to Supabase.
  if (expiry === null && !request.cookies.getAll().some((c) => AUTH_COOKIE.test(c.name))) {
    return toLogin(request);
  }

  // Session is still valid for a while, so let the request through. The
  // /members page verifies the user with Supabase before it renders anything,
  // so skipping the duplicate check here costs nothing in security and saves a
  // full network round-trip on every members page load.
  if (expiry !== null && expiry * 1000 - Date.now() > 60_000) {
    return NextResponse.next({ request });
  }

  // Session is unreadable, expired, or about to expire: go through Supabase so
  // refreshed tokens are written back to the cookies.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return toLogin(request);

  return response;
}

export const config = {
  matcher: ["/members", "/members/:path*"],
};
