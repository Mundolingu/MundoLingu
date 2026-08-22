import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Payment for a job listing, using the Stripe account the membership already
 * runs on. Set STRIPE_OPPORTUNITY_PRICE_ID to a one-off price and the board
 * becomes a paid product; leave it unset and everything else still works —
 * listings are simply published by hand from the admin screen.
 *
 * The listing is published by the Stripe webhook, never by the browser, so a
 * cancelled or failed payment cannot put an advert live.
 */
export async function POST(req: Request) {
  const price = process.env.STRIPE_OPPORTUNITY_PRICE_ID;
  if (!price) {
    return NextResponse.json(
      { error: "Listing payments aren't set up yet — add STRIPE_OPPORTUNITY_PRICE_ID. See the README." },
      { status: 503 }
    );
  }

  let body: { opportunityId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const opportunityId = String(body.opportunityId || "");
  if (!opportunityId) return NextResponse.json({ error: "Which listing?" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: opportunity }, { data: profile }] = await Promise.all([
    admin.from("opportunities").select("id,title,company_id,company_name").eq("id", opportunityId).maybeSingle(),
    admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
  ]);

  if (!opportunity) return NextResponse.json({ error: "That listing no longer exists." }, { status: 404 });
  if (opportunity.company_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: "That listing belongs to someone else." }, { status: 403 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    customer_email: user.email ?? undefined,
    metadata: { opportunity_id: opportunity.id, supabase_user_id: user.id },
    success_url: `${site}/admin/opportunities?paid=${opportunity.id}`,
    cancel_url: `${site}/admin/opportunities`,
  });

  await admin
    .from("opportunities")
    .update({ payment_status: "pending", payment_id: session.id })
    .eq("id", opportunity.id);

  return NextResponse.json({ url: session.url });
}
