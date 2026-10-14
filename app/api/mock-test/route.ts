import { NextResponse } from "next/server";

// Free IELTS Speaking mock test booking — emails each request to Jurgen (same Resend setup as /api/demo).
export async function POST(req: Request) {
  let d: Record<string, unknown>;
  try {
    d = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  if (d.company) return NextResponse.json({ ok: true }); // honeypot: silently drop bots

  const name = String(d.name ?? "").trim();
  const email = String(d.email ?? "").trim();
  const whatsapp = String(d.whatsapp ?? "").trim();
  if (!name || !email || !whatsapp) {
    return NextResponse.json({ ok: false, error: "Please fill in your name, email and WhatsApp number." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEMO_NOTIFY_EMAIL || "mundolingu@gmail.com";
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Booking isn't connected yet. Please message us on WhatsApp instead." },
      { status: 503 }
    );
  }
  const from = process.env.DEMO_FROM_EMAIL || "MundoLingu <onboarding@resend.dev>";

  const esc = (v: unknown) => String(v ?? "").replace(/</g, "&lt;");
  const digits = whatsapp.replace(/[^0-9]/g, "");
  const waLink = digits ? `https://wa.me/${digits}` : "";
  const rows: [string, unknown][] = [
    ["Name", name],
    ["Email", email],
    ["WhatsApp", whatsapp],
    ["Why they need IELTS", d.reason || "—"],
    ["Exam", d.exam || "—"],
    ["Target band", d.target || "—"],
    ["Exam date", d.when || "—"],
    ["Best time for the call", d.slot || "—"],
    ["Came from page", d.source || "mock-test"],
  ];
  const html =
    `<h2 style="font-family:sans-serif;color:#0C1C3C">New free Speaking mock test request</h2>` +
    `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">` +
    rows
      .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#555"><b>${k}</b></td><td style="padding:6px 0">${esc(v)}</td></tr>`)
      .join("") +
    `</table>` +
    (waLink ? `<p style="font-family:sans-serif;font-size:15px"><a href="${waLink}">Message them on WhatsApp to book a time</a></p>` : "");
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Mock test request: ${name} — ${d.exam || "IELTS"} target ${d.target || "?"} (${d.reason || "—"})`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Couldn't send right now. Please message us on WhatsApp." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't send right now. Please message us on WhatsApp." }, { status: 502 });
  }
}
