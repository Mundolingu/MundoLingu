import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isClubId, type ClubId } from "@/lib/clubs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe calls this address after every payment / cancellation and we
// tick (or untick) the member's club in Supabase automatically.
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

  // Which club a subscription is for (we store it on the subscription after checkout).
  const clubOf = (meta: Stripe.Metadata | null | undefined): ClubId | null =>
    isClubId(meta?.club) ? (meta!.club as ClubId) : null;

  const setClubByCustomer = async (customerId: string, club: ClubId, active: boolean, status: string) => {
    await admin
      .from("profiles")
      .update({ [`club_${club}`]: active, subscription_status: status })
      .eq("stripe_customer_id", customerId);
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      // Our site adds client_reference_id = "<user id>__<club>" to every Payment Link.
      const [userId, maybeClub] = (s.client_reference_id || "").split("__");
      const club: ClubId = isClubId(maybeClub) ? maybeClub : clubOf(s.metadata) ?? "conversation";
      const customerId = (s.customer as string) || null;

      if (userId) {
        await admin
          .from("profiles")
          .update({
            [`club_${club}`]: true,
            subscription_status: "active",
            ...(customerId ? { stripe_customer_id: customerId } : {}),
          })
          .eq("id", userId);
      } else if (customerId) {
        await setClubByCustomer(customerId, club, true, "active");
      }

      // Label the subscription with the club + member, so a later cancel locks the right club.
      if (s.subscription) {
        try {
          await stripe.subscriptions.update(s.subscription as string, {
            metadata: { club, ...(userId ? { supabase_user_id: userId } : {}) },
          });
        } catch {}
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const club = clubOf(sub.metadata);
      if (!club) break; // not labelled yet (checkout event handles it)
      const active =
        event.type === "customer.subscription.updated" &&
        ["active", "trialing", "past_due"].includes(sub.status);
      const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
      const userId = sub.metadata?.supabase_user_id;
      if (userId) {
        await admin.from("profiles").update({ [`club_${club}`]: active, subscription_status: status }).eq("id", userId);
      } else {
        await setClubByCustomer(sub.customer as string, club, active, status);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
