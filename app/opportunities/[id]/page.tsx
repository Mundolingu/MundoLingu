import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OpportunityDetail from "@/components/OpportunityDetail";
import { type Opportunity, PUBLIC_COLUMNS } from "@/lib/opportunities";

// Listings change whenever a company is published or expires, so never cache.
export const dynamic = "force-dynamic";

// Row-level security only returns published, unexpired listings to a visitor, so
// an unpublished draft is a 404 here rather than a leak.
async function getOpportunity(id: string): Promise<Opportunity | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("opportunities")
      .select(PUBLIC_COLUMNS)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    return (data as unknown as Opportunity) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getOpportunity(id);
  if (!o) return { title: "Opportunity — MundoLingu" };
  return {
    title: `${o.title} — ${o.company_name}`,
    description: (o.description || "").slice(0, 160) || undefined,
    alternates: { canonical: `/opportunities/${o.id}` },
  };
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity} />;
}
