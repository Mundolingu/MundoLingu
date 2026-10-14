"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const WHATSAPP_NUMBER = "971504296090";

type Props = {
  /** Which page the lead came from, shown in the email (e.g. "mock-test", "nurses"). */
  source?: string;
  /** Pre-selected answer for "Why do you need IELTS?" */
  defaultReason?: string;
};

const REASONS = [
  "Nurse / healthcare registration",
  "Visa or immigration (Canada, UK, Australia…)",
  "University abroad",
  "Work or career",
  "Other",
];

export default function MockTestForm({ source = "mock-test", defaultReason = "" }: Props) {
  const [state, setState] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("sending");
    const fd = new FormData(e.currentTarget);
    setName(String(fd.get("name") || ""));
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/mock-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, source }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !json.ok) {
        setError(json.error || "Something went wrong. Please message us on WhatsApp.");
        setState("form");
        return;
      }
      setState("done");
    } catch {
      setError("Something went wrong. Please message us on WhatsApp.");
      setState("form");
    }
  }

  const waText = `Hi MundoLingu! I just booked the free IELTS Speaking mock test on your website${name ? ` (my name is ${name})` : ""}. When can we do it?`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  if (state === "done") {
    return (
      <div className="mt-card mt-done">
        <span className="blog-eyebrow">Request received</span>
        <h3>Thank you{name ? `, ${name}` : ""}!</h3>
        <p>A teacher will message you on WhatsApp within 24 hours to pick a time for your free 15-minute Speaking mock test.</p>
        <p>Want it sooner? Send us a message now:</p>
        <a className="ml-btn ml-btn--wa" href={waHref} target="_blank" rel="noreferrer">Message us on WhatsApp <ArrowRight /></a>
      </div>
    );
  }

  return (
    <form className="mt-card mt-form" onSubmit={submit}>
      <h3>Book your free Speaking mock test</h3>
      <p className="mt-sub">Takes 30 seconds. A teacher will message you on WhatsApp to pick a time.</p>

      {/* honeypot — hidden from people, bots fill it in */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="mt-hp" aria-hidden="true" />

      <label htmlFor="mt-name">Your name</label>
      <input id="mt-name" name="name" type="text" required autoComplete="name" />

      <label htmlFor="mt-email">Email</label>
      <input id="mt-email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" />

      <label htmlFor="mt-wa">WhatsApp number</label>
      <input id="mt-wa" name="whatsapp" type="tel" required autoComplete="tel" placeholder="+971 50 123 4567" />

      <label htmlFor="mt-reason">Why do you need IELTS?</label>
      <select id="mt-reason" name="reason" defaultValue={defaultReason || REASONS[0]}>
        {REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>

      <div className="mt-row">
        <div>
          <label htmlFor="mt-exam">Exam</label>
          <select id="mt-exam" name="exam" defaultValue="IELTS Academic">
            <option>IELTS Academic</option>
            <option>IELTS General Training</option>
            <option>PTE</option>
            <option>TOEFL</option>
            <option>Not sure yet</option>
          </select>
        </div>
        <div>
          <label htmlFor="mt-target">Score you need</label>
          <select id="mt-target" name="target" defaultValue="7.0">
            <option>5.5</option><option>6.0</option><option>6.5</option><option>7.0</option>
            <option>7.5</option><option>8.0+</option><option>Not sure</option>
          </select>
        </div>
      </div>

      <div className="mt-row">
        <div>
          <label htmlFor="mt-when">Exam date</label>
          <select id="mt-when" name="when" defaultValue="1–3 months">
            <option>Within 1 month</option><option>1–3 months</option><option>3–6 months</option><option>Not booked yet</option>
          </select>
        </div>
        <div>
          <label htmlFor="mt-slot">Best time for you</label>
          <select id="mt-slot" name="slot" defaultValue="Evening">
            <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Weekend</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-error" role="alert">{error}</p>}

      <button className="ml-btn ml-btn--primary mt-submit" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Book my free mock test"} <ArrowRight />
      </button>
      <p className="mt-fine">Free, no obligation. We only use your details to arrange your test.</p>
    </form>
  );
}
