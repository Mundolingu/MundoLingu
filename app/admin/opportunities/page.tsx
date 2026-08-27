import OpportunitiesAdmin from "@/components/OpportunitiesAdmin";

export const metadata = { title: "Opportunities admin" };
export const dynamic = "force-dynamic";

// The component checks permissions through /api/opportunities, which returns 401
// for signed-out visitors and 403 for accounts that are not admins.
export default function OpportunitiesAdminPage() {
  return <OpportunitiesAdmin />;
}
