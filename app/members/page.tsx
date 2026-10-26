import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/admin-auth";
import MembersArea from "@/components/MembersArea";
import JoinMembership from "@/components/JoinMembership";
import { clubsOf, isClubId } from "@/lib/clubs";

export const metadata = { title: "Members" };
export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const wanted = typeof sp.club === "string" && isClubId(sp.club) ? sp.club : null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="login-root">
        <div className="login-card" style={{ textAlign: "center" }}>
          <h1>Members area</h1>
          <p className="login-sub">
            This area isn&apos;t connected yet. Follow the setup steps in the README to enable member login and payments.
          </p>
          <p className="login-alt">
            <a href="/">Back to site</a>
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*") // "*" so the page still works before the referral columns exist
    .eq("id", user.id)
    .single();

  const clubs = clubsOf(profile);
  const join = (
    <JoinMembership
      email={user.email ?? ""}
      userId={user.id}
      justPaid={sp.paid === "1"}
      referredBy={profile?.referred_by ?? null}
      owned={clubs}
      preselect={wanted}
    />
  );

  // Not in any club yet -> choose a club and pay.
  if (!clubs.length) return join;
  // Already a member but asked to join another club (?join=1 or ?club=spanish for a club they don't have).
  if (sp.join === "1" || (wanted && !clubs.includes(wanted))) return join;

  // Admins get a link through to the opportunities editor from inside the hub.
  const isAdmin = adminEmails().includes((user.email ?? "").toLowerCase());

  return <MembersArea isAdmin={isAdmin} referralCode={profile?.referral_code ?? null} clubs={clubs} initialClub={wanted} canManage={!!profile?.stripe_customer_id} />;
}
