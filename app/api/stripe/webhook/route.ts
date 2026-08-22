import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { LISTING_DAYS } from "@/lib/opportunities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new NextResponse("Webhook signature verification failed.", { status: 400 });
  }

  const admin = createAdminClient();
  const setMember = async (customerId: string, active: boolean, status: string) => {
    await admin
      .from("profiles")
      .update({ is_member: active, subscription_status: status })
      .eq("stripe_customer_id", customerId);
  };

  // A paid job listing goes live here rather than in the browser, so an advert
  // can only appear once Stripe confirms the money arrived.
  const publishListing = async (opportunityId: string, paymentId: string) => {
    const { data: listing } = await admin
      .from("opportunities")
      .select("deadline, expires_at")
      .eq("id", opportunityId)
      .maybeSingle();
    const runsUntil =
      listing?.expires_at ||
      (listing?.deadline ? `${String(listing.deadline).slice(0, 10)}T23:59:59+04:00` : null) ||
      new Date(Date.now() + LISTING_DAYS * 86400000).toISOString();
    await admin
      .from("opportunities")
      .update({
        is_paid: true,
        payment_status: "paid",
        payment_id: paymentId,
        status: "published",
        published_at: new Date().toISOString(),
        expires_at: runsUntil,
      })
      .eq("id", opportunityId);
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const opportunityId = s.metadata?.opportunity_id;
      if (opportunityId) {
        await publishListing(opportunityId, s.id);
        break;
      }
      if (s.customer) await setMember(s.customer as string, true, "active");
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const active = ["active", "trialing", "past_due"].includes(sub.status);
      await setMember(sub.customer as string, active, sub.status);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await setMember(sub.customer as string, false, "canceled");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
