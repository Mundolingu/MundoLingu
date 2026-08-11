import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MembersArea from "@/components/MembersArea";
import JoinMembership from "@/components/JoinMembership";

export const metadata = { title: "Members" };
export const dynamic = "force-dynamic";

export default async function MembersPage() {
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
    .select("is_member")
    .eq("id", user.id)
    .single();

  if (!profile?.is_member) return <JoinMembership email={user.email ?? ""} />;

  return <MembersArea />;
}
