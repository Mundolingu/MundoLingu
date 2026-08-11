"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// Reasons handed over by /auth/callback when an email link doesn't work out.
const LINK_ERRORS: Record<string, string> = {
  expired: "That link has expired. Please request a new one, then try again.",
  invalid: "That link didn't work — it may have already been used. Please log in below.",
  incomplete: "That link was incomplete. Open it again from your email, or log in below.",
};

// Supabase's own messages are written for developers. Say it in plain language instead.
function friendly(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password don't match an account. Check for typos, or create an account below.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox for the link we sent you.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "You already have an account with this email — log in instead.";
  if (m.includes("password should be at least"))
    return "Please choose a password with at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts just now. Please wait a minute and try again.";
  return message;
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Read on mount rather than with useSearchParams so this page can stay static.
  useEffect(() => {
    try {
      const reason = new URLSearchParams(window.location.search).get("error");
      if (!reason) return;
      setMsg(LINK_ERRORS[reason] || LINK_ERRORS.invalid);
      window.history.replaceState(null, "", window.location.pathname);
    } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data: signUp, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setLoading(false);
        setMsg(friendly(error.message));
        return;
      }
      // Supabase returns a user with no identities (and no error) when the email is
      // already taken. Without this check people wait for an email that never arrives.
      if (signUp.user && Array.isArray(signUp.user.identities) && signUp.user.identities.length === 0) {
        setLoading(false);
        setMode("signin");
        setMsg("You already have an account with this email — log in below.");
        return;
      }
      if (signUp.session) {
        setLoading(false);
        router.push("/members");
        router.refresh();
        return;
      }
      const { data } = await supabase.auth.getSession();
      setLoading(false);
      if (data.session) {
        router.push("/members");
        router.refresh();
      } else {
        setMsg("Almost there — check your email to confirm your account, then log in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setMsg(friendly(error.message));
        return;
      }
      router.push("/members");
      router.refresh();
    }
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
                <input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
              </div>
              <div className="login-field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
              </div>
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Please wait…" : mode === "signin" ? "Log in" : "Create account"}
              </button>
            </form>
            {msg && <p className="login-note" style={{ color: "#b23b13" }}>{msg}</p>}
            <p className="login-alt">
              {mode === "signin" ? (
                <>New here? <a onClick={() => { setMode("signup"); setMsg(null); }} style={{ cursor: "pointer" }}>Create an account</a></>
              ) : (
                <>Already a member? <a onClick={() => { setMode("signin"); setMsg(null); }} style={{ cursor: "pointer" }}>Log in</a></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
