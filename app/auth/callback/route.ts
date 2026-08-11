import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase's email links can carry either a PKCE `code` or a `token_hash` + `type`,
// depending on the email template. Handle both.
type OtpType = "email" | "signup" | "invite" | "magiclink" | "recovery" | "email_change";

// Netlify runs this route on the deploy's own hostname, so `new URL(request.url).origin`
// resolves to the raw *.netlify.app address rather than the domain the visitor is on.
// Redirecting there lands them on a different origin, where the session cookies we just
// set don't exist — so rebuild the base URL from the forwarded host instead.
function baseUrl(request: Request): string {
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (host) {
    const proto =
      headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = baseUrl(request);

  // Only allow relative destinations, so the link can't be used to bounce people offsite.
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/members";

  // Short codes only — the login page turns these into wording. Never reflect
  // arbitrary text from the URL back onto the page.
  const failWith = (reason: "expired" | "invalid" | "incomplete") =>
    NextResponse.redirect(`${base}/login?error=${reason}`);

  // Supabase appends these when a link is expired, already used, or tampered with.
  if (searchParams.get("error") || searchParams.get("error_description")) {
    return failWith(searchParams.get("error_code") === "otp_expired" ? "expired" : "invalid");
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if (!code && !tokenHash) return failWith("incomplete");

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: (searchParams.get("type") as OtpType) || "email",
      });

  // Previously this result was ignored, so a dead link still redirected to /members and
  // then got silently bounced back to /login with no explanation.
  if (error) return failWith("invalid");

  return NextResponse.redirect(`${base}${destination}`);
}
