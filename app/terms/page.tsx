import TermsPage from "@/components/TermsPage";

export const metadata = {
  title: "Terms & Conditions",
  description: "MundoLingu Terms & Conditions: bookings, packages, payment, cancellations, membership, refunds and privacy.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <TermsPage />;
}
