import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isClubId, type ClubId } from "@/lib/clubs";

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
  // Which club a payment is for: set metadata "club" = conversation / spanish / exam
  // on the Stripe Payment Link or subscription. Without it, Conversation Club.
  const clubOf = (meta: Stripe.Metadata | null | undefined): ClubId =>
    isClubId(meta?.club) ? (meta!.club as ClubId) : "conversation";

  const setClub = async (customerId: string, club: ClubId, active: boolean, status: string) => {
    await admin
      .from("profiles")
      .update({ [`club_${club}`]: active, subscription_status: status })
      .eq("stripe_customer_id", customerId);
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.customer) await setClub(s.customer as string, clubOf(s.metadata), true, "active");
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const active = ["active", "trialing", "past_due"].includes(sub.status);
      await setClub(sub.customer as string, clubOf(sub.metadata), active, sub.status);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await setClub(sub.customer as string, clubOf(sub.metadata), false, "canceled");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
