"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      if (!acceptedTerms) {
        setLoading(false);
        setMsg("Please accept the Terms & Conditions to create your account.");
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setLoading(false);
        setMsg(error.message);
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
        setMsg(error.message);
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
              {mode === "signup" && (
                <label className="login-terms">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</a>
                  </span>
                </label>
              )}
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Please wait…" : mode === "signin" ? "Log in" : "Create account"}
              </button>
            </form>
            {msg && <p className="login-note" style={{ color: "#b23b13" }}>{msg}</p>}
            <p className="login-alt">
              {mode === "signin" ? (
                <>New here? <a onClick={() => { setMode("signup"); setMsg(null); setAcceptedTerms(false); }} style={{ cursor: "pointer" }}>Create an account</a></>
              ) : (
                <>Already a member? <a onClick={() => { setMode("signin"); setMsg(null); setAcceptedTerms(false); }} style={{ cursor: "pointer" }}>Log in</a></>
              )}
            </p>
            <p className="login-note"><a href="/terms">Terms &amp; Conditions</a></p>
          </>
        )}
      </div>
    </div>
  );
}
