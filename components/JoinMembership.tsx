"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinMembership({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function join() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg(data.error || "Something went wrong. Please try again.");
      setLoading(false);
    } catch {
      setMsg("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="login-root">
      <div className="login-card" style={{ textAlign: "center" }}>
        <div className="login-logo">
          <img src="/logo-emblem.png" alt="MundoLingu" />
        </div>
        <h1>You&apos;re almost in</h1>
        <p className="login-sub">
          Signed in as {email}. Activate your membership to unlock the lessons, live classes, events, and workbooks.
        </p>
        <button className="login-btn" onClick={join} disabled={loading}>
          {loading ? "Redirecting…" : "Join — $10 first month, then $15/mo"}
        </button>
        {msg && <p className="login-note" style={{ color: "#b23b13" }}>{msg}</p>}
        <p className="login-alt">
          <a onClick={logout} style={{ cursor: "pointer" }}>Log out</a>
        </p>
      </div>
    </div>
  );
}
