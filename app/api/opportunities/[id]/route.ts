import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import type { Opportunity } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

type Row = typeof opportunities.$inferSelect;
type Params = { params: Promise<{ id: string }> };

function toApi(row: Row): Opportunity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    organisation: row.organisation,
    location: row.location,
    summary: row.summary,
    body: row.body,
    apply_url: row.applyUrl,
    deadline: row.deadline,
    published: row.published,
    sort: row.sort,
  };
}

// Postgres rejects a malformed uuid, so screen the id before querying.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Unknown opportunity." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = (v: unknown) => String(v ?? "").trim();
  const optional = (v: unknown) => text(v) || null;

  // Only assign fields the request actually sent, so publishing a card does not
  // blank out the rest of its content.
  const patch: Partial<typeof opportunities.$inferInsert> = { updatedAt: new Date() };
  if ("title" in body) {
    const title = text(body.title);
    if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
    patch.title = title;
  }
  if ("kind" in body) patch.kind = text(body.kind) || "Opportunity";
  if ("organisation" in body) patch.organisation = optional(body.organisation);
  if ("location" in body) patch.location = optional(body.location);
  if ("summary" in body) patch.summary = text(body.summary);
  if ("body" in body) patch.body = text(body.body);
  if ("apply_url" in body) patch.applyUrl = optional(body.apply_url);
  if ("deadline" in body) patch.deadline = optional(body.deadline);
  if ("published" in body) patch.published = Boolean(body.published);
  if ("sort" in body) patch.sort = Number.isFinite(Number(body.sort)) ? Number(body.sort) : 0;

  // The slug is deliberately left alone after creation so existing links keep working.

  try {
    const [row] = await db.update(opportunities).set(patch).where(eq(opportunities.id, id)).returning();
    if (!row) return NextResponse.json({ error: "Unknown opportunity." }, { status: 404 });
    return NextResponse.json({ item: toApi(row) });
  } catch (err) {
    console.error("Failed to update opportunity:", err);
    return NextResponse.json({ error: "Could not update the opportunity." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Unknown opportunity." }, { status: 404 });

  try {
    const [row] = await db.delete(opportunities).where(eq(opportunities.id, id)).returning();
    if (!row) return NextResponse.json({ error: "Unknown opportunity." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete opportunity:", err);
    return NextResponse.json({ error: "Could not delete the opportunity." }, { status: 500 });
  }
}
