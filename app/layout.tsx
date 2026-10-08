import type { Metadata } from "next";
import { Newsreader, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mundolingu.com"),
  title: {
    default: "MundoLingu — IELTS, PTE & TOEFL prep, English & Spanish online",
    template: "%s — MundoLingu",
  },
  description:
    "1-to-1 online IELTS, PTE and TOEFL preparation with experienced native teachers, plus English and Spanish lessons and a weekly Conversation Club. For students in the UAE, the Gulf and Europe. Book a free demo lesson.",
  keywords: [
    "IELTS preparation Dubai",
    "IELTS preparation online",
    "PTE preparation UAE",
    "TOEFL preparation online",
    "IELTS tutor UAE",
    "English conversation club",
    "learn English online",
    "learn Spanish online",
    "English for Spanish speakers",
    "Spanish for expats",
    "online language lessons",
    "private English tutor",
    "Spanish lessons Dubai",
  ],
  openGraph: {
    title: "MundoLingu — IELTS, PTE & TOEFL prep, English & Spanish online",
    description:
      "1-to-1 IELTS, PTE and TOEFL preparation, plus English and Spanish lessons and a weekly Conversation Club. Book a free demo lesson.",
    url: "/",
    siteName: "MundoLingu",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MundoLingu — IELTS, PTE & TOEFL prep, English & Spanish online",
    description: "1-to-1 IELTS, PTE and TOEFL preparation, plus English and Spanish lessons online.",
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <noscript>
          {/* Reveal all content if JS is disabled */}
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important;}`}</style>
        </noscript>
      </head>
      <body className={`${serif.variable} ${sans.variable}`}>
        {children}
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN })}
          />
        ) : null}
      </body>
    </html>
  );
}
