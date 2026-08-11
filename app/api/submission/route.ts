import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Emails you when a member hands in a workbook. Best-effort: never blocks the upload.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { workbook, email, filePath } = body || {};
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEMO_NOTIFY_EMAIL || "mundolingu@gmail.com";
  if (!apiKey) return NextResponse.json({ ok: true, emailed: false });
  const from = process.env.DEMO_FROM_EMAIL || "MundoLingu <onboarding@resend.dev>";

  // Try to attach a temporary download link to the file.
  let link = "";
  try {
    if (filePath) {
      const admin = createAdminClient();
      const { data } = await admin.storage.from("submissions").createSignedUrl(filePath, 60 * 60 * 24 * 7);
      if (data && data.signedUrl) link = data.signedUrl;
    }
  } catch {
    // no link — the email still tells you who handed in what
  }

  const esc = (v: unknown) => String(v ?? "").replace(/</g, "&lt;");
  const html =
    `<h2 style="font-family:sans-serif;color:#0C1C3C">New workbook hand-in</h2>` +
    `<p style="font-family:sans-serif;font-size:14px"><b>${esc(email) || "A member"}</b> handed in <b>${esc(workbook) || "a workbook"}</b>.</p>` +
    (link
      ? `<p style="font-family:sans-serif;font-size:14px"><a href="${link}">Download their work</a> (link works for 7 days)</p>`
      : `<p style="font-family:sans-serif;font-size:13px;color:#555">Find the file in Supabase &rarr; Storage &rarr; submissions.</p>`);

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `New hand-in — ${workbook || "workbook"}`, html }),
    });
  } catch {
    // ignore — the hand-in already succeeded
  }

  return NextResponse.json({ ok: true });
}
