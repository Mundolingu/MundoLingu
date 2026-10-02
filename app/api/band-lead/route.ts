import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let d: Record<string, string>;
  try {
    d = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEMO_NOTIFY_EMAIL || "mundolingu@gmail.com";
  if (!apiKey) return NextResponse.json({ ok: true, emailed: false });
  const from = process.env.DEMO_FROM_EMAIL || "MundoLingu <onboarding@resend.dev>";

  const esc = (v: unknown) => String(v ?? "").replace(/</g, "&lt;");
  const digits = String(d.whatsapp ?? "").replace(/[^0-9]/g, "");
  const waLink = digits ? `https://wa.me/${digits}` : "";
  const row = (k: string, v: unknown) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#667">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`;

  const html =
    `<h2 style="font-family:sans-serif;color:#0C1C3C">New IELTS band-check lead</h2>` +
    `<table style="font-family:sans-serif;font-size:14px">` +
    row("Name", d.name) + row("Email", d.email) + row("WhatsApp", d.whatsapp) +
    row("Exam", d.exam) + row("Target", d.target) + row("Exam date", d.when) +
    row("Estimated band", d.band) + row("Score", d.score) + row("Weakest area", d.weakest) + row("Breakdown", d.breakdown) +
    `</table>` +
    (waLink ? `<p style="font-family:sans-serif;font-size:14px"><a href="${waLink}">Message them on WhatsApp</a></p>` : "");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to, reply_to: d.email,
        subject: `Band check: ${d.name || "lead"} — est. ${d.band}, target ${d.exam} ${d.target} (${d.when})`,
        html,
      }),
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
