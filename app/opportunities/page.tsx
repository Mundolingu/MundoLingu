import Opportunities from "@/components/Opportunities";

export const metadata = {
  title: "Opportunities — MundoLingu",
  description:
    "Career opportunities from companies looking for talented Spanish-speaking professionals with strong English skills.",
  alternates: { canonical: "/opportunities" },
};

export default function OpportunitiesPage() {
  return <Opportunities />;
}
