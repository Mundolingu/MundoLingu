"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// Supabase's raw messages are aimed at developers. Show something a member
// can actually act on.
function friendlyError(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password don't match. Please try again, or create an account if you're new here.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox for the link we sent you.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "There's already an account with this email. Try logging in instead.";
  if (m.includes("password should be") || m.includes("at least 6"))
    return "Please choose a password with at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("fetch") || m.includes("network") || m.includes("timed out"))
    return "We couldn't reach the server. Please check your connection and try again.";
  return message || "Something went wrong. Please try again.";
}

// Never let a stalled request leave the button spinning forever.
function withTimeout<T>(promise: PromiseLike<T>, ms = 20000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), ms)
    ),
  ]);
}

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  // Someone who is already signed in shouldn't have to log in again.
  useEffect(() => {
    if (!CONFIGURED) return;
    let active = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        const session = data.session;
        if (!active || !session) return;
        // Only bounce on a session that is genuinely still good, so an expired
        // one can't ping-pong between here and /members.
        const stillValid = !session.expires_at || session.expires_at * 1000 > Date.now();
        if (stillValid) window.location.replace("/members");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMsg(null);
    setOk(false);
    setLoading(true);

    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "signup") {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          })
        );
        if (error) {
          setMsg(friendlyError(error.message));
          setLoading(false);
          return;
        }
        if (data.session) {
          // Full page load so the server sees the new session cookie straight
          // away. Keep the button disabled until the browser navigates.
          window.location.assign("/members");
          return;
        }
        setOk(true);
        setMsg("Almost there — check your email to confirm your account, then log in.");
        setLoading(false);
        return;
      }

      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: cleanEmail, password })
      );
      if (error) {
        setMsg(friendlyError(error.message));
        setLoading(false);
        return;
      }
      window.location.assign("/members");
    } catch (err: any) {
      setMsg(friendlyError(err?.message || ""));
      setLoading(false);
    }
  }

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setMsg(null);
    setOk(false);
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo-emblem.png" alt="MundoLingu" />
        </div>
        <h1>{mode === "signin" ? "Member login" : "Create your account"}</h1>
        <p className="login-sub">
          {mode === "signin"
            ? "Welcome back — sign in to your MundoLingu membership."
            : "Join MundoLingu — create an account to get started."}
        </p>

        {!CONFIGURED ? (
          <p className="login-note" style={{ fontSize: 13, color: "#8a3d16" }}>
            Login isn&apos;t connected yet. Follow the setup steps in the README to enable it.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required value={email} disabled={loading}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
                  autoComplete="email" autoCapitalize="none" spellCheck={false} />
              </div>
              <div className="login-field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" required value={password} disabled={loading}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
                  minLength={mode === "signup" ? 6 : undefined}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"} />
              </div>
              <button className="login-btn" type="submit" disabled={loading} aria-busy={loading}>
                {loading ? (
                  <>
                    <span className="login-spin" aria-hidden="true" />
                    {mode === "signin" ? "Logging you in…" : "Creating your account…"}
                  </>
                ) : mode === "signin" ? "Log in" : "Create account"}
              </button>
            </form>
            {msg && (
              <p className="login-note" role="status" aria-live="polite"
                style={{ color: ok ? "#14776b" : "#b23b13" }}>
                {msg}
              </p>
            )}
            <p className="login-alt">
              {mode === "signin" ? (
                <>New here? <a onClick={() => switchMode("signup")} style={{ cursor: "pointer" }}>Create an account</a></>
              ) : (
                <>Already a member? <a onClick={() => switchMode("signin")} style={{ cursor: "pointer" }}>Log in</a></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
