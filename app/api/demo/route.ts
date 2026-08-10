import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  if (data.company) return NextResponse.json({ ok: true }); // honeypot: silently drop bots

  const { name, email, country, phone, age, language, reason, timezone, days, times } = data;
  if (!name || !email || !phone || !reason) {
    return NextResponse.json({ ok: false, error: "Please fill in all the fields." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEMO_NOTIFY_EMAIL || "mundolingu@gmail.com";
  if (!apiKey || !to) {
    return NextResponse.json(
      { ok: false, error: "The form isn't connected to email yet — see the README." },
      { status: 503 }
    );
  }
  const from = process.env.DEMO_FROM_EMAIL || "MundoLingu <onboarding@resend.dev>";

  const esc = (v: unknown) => String(v ?? "").replace(/</g, "&lt;");
  const list = (v: unknown) => (Array.isArray(v) && v.length ? v.join(", ") : "—");
  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Country", country || "\u2014"],
    ["Phone", phone],
    ["Age", String(age ?? "")],
    ["Wants to learn", language || "—"],
    ["Available days", list(days)],
    ["Preferred time", list(times)],
    ["Time zone", timezone || "—"],
    ["Reason", reason],
  ];
  const html =
    `<h2 style="font-family:sans-serif;color:#0C1C3C">New demo request</h2>` +
    `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#555;vertical-align:top"><b>${k}</b></td><td style="padding:6px 0">${esc(v)}</td></tr>`
      )
      .join("") +
    `</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `New demo request — ${name}`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Couldn't send right now. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't send right now. Please try again." }, { status: 502 });
  }
}
