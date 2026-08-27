import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify, type Opportunity } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

type Row = typeof opportunities.$inferSelect;

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

type DbError = { code?: string; message?: string; cause?: { code?: string; message?: string } };

// True when the database simply is not ready to answer yet: the migration has
// not been applied, or there is no usable connection. Drizzle wraps the driver
// error, so the original is checked through `cause` as well.
//
// The admin screen maps any non-2xx response to "no permission", so these cases
// must come back as a normal 200 carrying `unavailable` instead — otherwise a
// missing table would look like a permissions problem.
function isUnavailable(err: unknown): boolean {
  const e = err as DbError;
  const codes = [e?.code, e?.cause?.code].filter(Boolean) as string[];
  const message = `${e?.message ?? ""} ${e?.cause?.message ?? ""}`;
  return (
    codes.includes("42P01") || // undefined_table — migration not applied yet
    codes.some((c) => c.startsWith("08")) || // connection exception
    /relation .*opportunities.* does not exist|user is required|NETLIFY_DB_URL/i.test(message)
  );
}

export async function GET(req: Request) {
  const wantsAll = new URL(req.url).searchParams.get("all") === "1";

  // Drafts are admin-only, so authorise before touching the database.
  if (wantsAll) {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const rows = wantsAll
      ? await db.select().from(opportunities).orderBy(asc(opportunities.sort), desc(opportunities.createdAt))
      : await db
          .select()
          .from(opportunities)
          .where(eq(opportunities.published, true))
          .orderBy(asc(opportunities.sort), desc(opportunities.createdAt));

    return NextResponse.json({ items: rows.map(toApi) });
  } catch (err) {
    if (isUnavailable(err)) {
      console.warn("Opportunities database not ready:", (err as DbError)?.cause?.message ?? err);
      return NextResponse.json({ items: [], unavailable: true });
    }
    console.error("Failed to list opportunities:", err);
    return NextResponse.json({ error: "Could not load opportunities." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });

  const text = (v: unknown) => String(v ?? "").trim();
  const optional = (v: unknown) => text(v) || null;

  const values = {
    title,
    kind: text(body.kind) || "Opportunity",
    organisation: optional(body.organisation),
    location: optional(body.location),
    summary: text(body.summary),
    body: text(body.body),
    applyUrl: optional(body.apply_url),
    deadline: optional(body.deadline),
    published: Boolean(body.published),
    sort: Number.isFinite(Number(body.sort)) ? Number(body.sort) : 0,
  };

  // Slugs are unique. Titles legitimately repeat ("Open day"), so fall back to
  // a numbered variant rather than rejecting the save.
  const base = slugify(title);
  for (let attempt = 0; attempt < 25; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      const [row] = await db.insert(opportunities).values({ ...values, slug }).returning();
      return NextResponse.json({ item: toApi(row) }, { status: 201 });
    } catch (err) {
      if (isUnavailable(err)) {
        console.error("Opportunities database not ready:", err);
        return NextResponse.json(
          { error: "The opportunities database is not ready yet. Deploy to apply the migration, then try again." },
          { status: 503 }
        );
      }
      const code = (err as { code?: string }).code;
      if (code === "23505") continue; // slug taken — try the next variant
      console.error("Failed to create opportunity:", err);
      return NextResponse.json({ error: "Could not save the opportunity." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate a unique link for that title." }, { status: 409 });
}
