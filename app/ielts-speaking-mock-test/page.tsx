import { ArrowRight } from "lucide-react";
import MockTestForm from "@/components/MockTestForm";

const WA = `https://wa.me/971504296090?text=${encodeURIComponent("Hi MundoLingu! I'd like a free IELTS Speaking mock test.")}`;

export const metadata = {
  title: "Free IELTS Speaking Mock Test (Online, 15 Minutes)",
  description:
    "Book a free 15-minute IELTS Speaking mock test online with an experienced teacher. All three parts, your estimated Speaking band and two tips to improve. Dubai, UAE and worldwide.",
  alternates: { canonical: "/ielts-speaking-mock-test" },
  openGraph: {
    title: "Free IELTS Speaking Mock Test | MundoLingu",
    description: "15 minutes, online, with an experienced teacher. Get your estimated Speaking band free.",
    url: "/ielts-speaking-mock-test",
  },
};

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. The mock test is free and there is no obligation to buy anything afterwards.",
  },
  {
    q: "How does it work?",
    a: "After you book, a teacher messages you on WhatsApp to pick a time. The test is a 15-minute online video call that follows the real IELTS Speaking format: Part 1, Part 2 and Part 3.",
  },
  {
    q: "What do I get at the end?",
    a: "Your estimated Speaking band, the area where you lose the most points, and two clear tips you can use straight away.",
  },
  {
    q: "Is this the official IELTS test?",
    a: "No. It's a practice test with one of our teachers, so you know where you stand before the real exam. It does not give you an official score.",
  },
  {
    q: "Can I do it for PTE or TOEFL?",
    a: "Yes. Choose your exam in the form and the teacher will use that exam's speaking format.",
  },
];

export default function MockTestPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="blog-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <a className="dx-toplink" href="#book">Book free test</a>
      </header>

      <main className="dx-wrap">
        <section className="dx-hero mt-hero">
          <div>
            <span className="blog-eyebrow">Free · 15 minutes · Online</span>
            <h1 className="blog-h1">Free IELTS Speaking mock test</h1>
            <p className="blog-lead">
              Speaking is the part most people fear. Find out your Speaking band now, not on exam day.
              A 15-minute practice test with an experienced teacher, in the real exam format.
            </p>
            <ul className="dx-facts">
              <li>All 3 Speaking parts</li>
              <li>Your estimated band</li>
              <li>2 tips to improve</li>
              <li>No obligation</li>
            </ul>
          </div>
          <div id="book">
            <MockTestForm source="mock-test" />
          </div>
        </section>

        <section className="dx-sec">
          <h2>What happens in your mock test</h2>
          <ol className="dx-steps">
            <li><b>Part 1 (4–5 min).</b> Short questions about you, your work and your daily life.</li>
            <li><b>Part 2 (3–4 min).</b> You get a topic card, one minute to prepare, then speak for up to two minutes.</li>
            <li><b>Part 3 (4–5 min).</b> A deeper discussion linked to your Part 2 topic.</li>
            <li><b>Your feedback.</b> Your estimated Speaking band, where you lose points, and two tips you can use straight away.</li>
          </ol>
        </section>

        <section className="dx-sec">
          <h2>Who it&apos;s for</h2>
          <ul className="dx-list">
            <li><b>Nurses and healthcare workers</b> who need a band for registration abroad. <a href="/ielts-for-nurses">IELTS for nurses</a></li>
            <li><b>People moving abroad</b> who need a band for a visa or PR.</li>
            <li><b>University applicants</b> with a minimum Speaking score in their offer.</li>
            <li><b>Anyone with an exam date coming up</b> who wants to know where they stand.</li>
          </ul>
        </section>

        <section className="dx-sec">
          <h2>Common questions</h2>
          <div className="dx-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="blog-cta">
          <h3>Prefer to just message us?</h3>
          <p>Send us a WhatsApp message and we&apos;ll book your free mock test there.</p>
          <div className="blog-cta-btns">
            <a className="ml-btn ml-btn--wa" href={WA} target="_blank" rel="noreferrer">WhatsApp us <ArrowRight /></a>
            <a className="ml-btn ml-btn--light" href="/ielts-band-check">Or take the free band check <ArrowRight /></a>
          </div>
        </div>
      </main>
    </div>
  );
}
