"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning", "Afternoon", "Evening"];

export default function DemoForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.get("company")) { setStatus("done"); return; } // honeypot
    setName(String(fd.get("name") || ""));
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      age: fd.get("age"),
      language: fd.get("language"),
      timezone: fd.get("timezone"),
      days: fd.getAll("days"),
      times: fd.getAll("times"),
      reason: fd.get("reason"),
    };
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="demo-card demo-success" data-reveal>
        <div className="demo-check">&#10003;</div>
        <h3>Thank you{name ? `, ${name.split(" ")[0]}` : ""}!</h3>
        <p>We&apos;ve got your request and the times you&apos;re free. We&apos;ll email you shortly to lock in your free demo lesson.</p>
      </div>
    );
  }

  return (
    <form className="demo-card" onSubmit={onSubmit} data-reveal>
      <input type="text" name="company" className="demo-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="demo-grid">
        <div className="demo-field">
          <label htmlFor="d-name">Full name</label>
          <input id="d-name" name="name" type="text" required placeholder="Your name" />
        </div>
        <div className="demo-field">
          <label htmlFor="d-email">Email</label>
          <input id="d-email" name="email" type="email" required placeholder="you@email.com" />
        </div>
        <div className="demo-field">
          <label htmlFor="d-phone">Phone / WhatsApp</label>
          <input id="d-phone" name="phone" type="tel" required placeholder="+52 ..." />
        </div>
        <div className="demo-field">
          <label htmlFor="d-age">Age</label>
          <input id="d-age" name="age" type="number" required min={5} max={99} placeholder="e.g. 28" />
        </div>

        <div className="demo-field demo-span">
          <label>Which days work for you?</label>
          <div className="demo-chips">
            {DAYS.map((d) => (
              <label className="demo-chip" key={d}>
                <input type="checkbox" name="days" value={d} /> {d}
              </label>
            ))}
          </div>
        </div>

        <div className="demo-field demo-span">
          <label>What time of day?</label>
          <div className="demo-chips">
            {TIMES.map((t) => (
              <label className="demo-chip" key={t}>
                <input type="checkbox" name="times" value={t} /> {t}
              </label>
            ))}
          </div>
        </div>

        <div className="demo-field">
          <label htmlFor="d-tz">Your time zone (optional)</label>
          <input id="d-tz" name="timezone" type="text" placeholder="e.g. Mexico City / GMT-6" />
        </div>
        <div className="demo-field">
          <label htmlFor="d-lang">I want to learn</label>
          <select id="d-lang" name="language" defaultValue="English">
            <option>English</option>
            <option>Spanish</option>
          </select>
        </div>

        <div className="demo-field demo-span">
          <label htmlFor="d-reason">Why do you want to learn?</label>
          <textarea id="d-reason" name="reason" rows={4} required placeholder="A new job, moving abroad, travel, confidence..."></textarea>
        </div>
      </div>
      {status === "error" && <p className="demo-msg">{error}</p>}
      <button className="demo-submit" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Request my free demo"}
      </button>
      <p className="demo-fine">No pressure, no commitment — a real teacher will reach out to schedule.</p>
    </form>
  );
}
