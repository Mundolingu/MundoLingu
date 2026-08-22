import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminOpportunities from "@/components/AdminOpportunities";

export const metadata = { title: "Opportunities admin" };
export const dynamic = "force-dynamic";

export default async function AdminOpportunitiesPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The same profiles row the members area already uses — no second permission
  // system. Set `is_admin` to true in Supabase -> Table Editor -> profiles.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/members");

  return <AdminOpportunities userId={user.id} />;
}
