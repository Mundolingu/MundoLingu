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
  const html =
    `<h2 style="font-family:sans-serif;color:#0C1C3C">New level-test lead</h2>` +
    `<p style="font-family:sans-serif;font-size:14px"><b>${esc(d.name) || "Someone"}</b> (${esc(d.email)}) took the English level test.</p>` +
    `<p style="font-family:sans-serif;font-size:14px">Result: <b>${esc(d.level)}</b> \u2014 scored ${esc(d.score)}. They'd like a free demo.</p>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, reply_to: d.email, subject: `New level-test lead \u2014 ${d.name || "lead"} (${d.level})`, html }),
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
