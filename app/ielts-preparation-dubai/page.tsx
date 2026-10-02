import { ArrowRight } from "lucide-react";

const WA = `https://wa.me/971504296090?text=${encodeURIComponent("Hi MundoLingu! I'm in Dubai and preparing for IELTS. I'd like a free demo lesson.")}`;

export const metadata = {
  title: "IELTS Preparation in Dubai | 1-to-1 Online IELTS Classes",
  description:
    "1-to-1 online IELTS preparation for Dubai and the UAE. Your own study plan, very experienced teachers and a free weekly live exam class. Take the free band check.",
  alternates: { canonical: "/ielts-preparation-dubai" },
  openGraph: {
    title: "IELTS Preparation in Dubai | MundoLingu",
    description: "1-to-1 online IELTS classes built around your target band. Free band check and free demo lesson.",
    url: "/ielts-preparation-dubai",
  },
};

const FAQ = [
  {
    q: "Are the IELTS classes online or in person?",
    a: "All lessons are 1-to-1 and online, so you can join from anywhere in Dubai or the UAE, from home or between shifts, without travelling to a centre.",
  },
  {
    q: "Do you prepare for IELTS Academic and General Training?",
    a: "Yes. We prepare students for both versions. In your free demo lesson we check which one your university, employer or visa needs.",
  },
  {
    q: "How long will it take to reach my target band?",
    a: "It depends on your current band in each skill and how often you study. Students who are close in most skills often need 1 to 2 months; others need longer. Your free demo lesson gives you a realistic plan.",
  },
  {
    q: "What is included?",
    a: "A personal study plan, 1-to-1 lessons with an experienced teacher, feedback on your Writing and Speaking, and a free weekly live exam class.",
  },
  {
    q: "Do you also prepare for TOEFL and PTE?",
    a: "Yes. We offer 1-to-1 preparation for IELTS, TOEFL and PTE Academic.",
  },
  {
    q: "How do I start?",
    a: "Take the free 5-minute band check, then message us on WhatsApp. We'll book a free demo lesson where a teacher gives you your exact band and your plan.",
  },
];

export default function IeltsDubaiPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "MundoLingu",
      url: "https://mundolingu.com",
      areaServed: ["Dubai", "United Arab Emirates"],
      description: "1-to-1 online IELTS, TOEFL and PTE preparation.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="blog-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <a className="dx-toplink" href="/ielts-band-check">Free band check</a>
      </header>

      <main className="dx-wrap">
        <section className="dx-hero">
          <span className="blog-eyebrow">IELTS preparation in Dubai</span>
          <h1 className="blog-h1">IELTS preparation in Dubai, built around your target band</h1>
          <p className="blog-lead">
            1-to-1 online IELTS classes for professionals, nurses and students in Dubai and across the UAE.
            Your own study plan, very experienced teachers, and a free live exam class every week.
          </p>
          <div className="dx-btns">
            <a className="ml-btn ml-btn--primary" href="/ielts-band-check">Take the free band check <ArrowRight /></a>
            <a className="ml-btn dx-btn-wa" href={WA} target="_blank" rel="noreferrer">Message us on WhatsApp <ArrowRight /></a>
          </div>
          <ul className="dx-facts">
            <li>1-to-1, online</li>
            <li>Academic &amp; General Training</li>
            <li>Free weekly live exam class</li>
            <li>Also TOEFL &amp; PTE</li>
          </ul>
        </section>

        <section className="dx-sec">
          <h2>Who our IELTS classes are for</h2>
          <ul className="dx-list">
            <li><b>Moving abroad.</b> You need a specific band for a visa or immigration to Canada, the UK or Australia.</li>
            <li><b>Nurses and healthcare professionals.</b> You need a band for professional registration.</li>
            <li><b>University applicants.</b> Your offer depends on an overall band and minimum scores per skill.</li>
            <li><b>Busy professionals in Dubai.</b> You work full-time and need lessons that fit around your shifts.</li>
          </ul>
        </section>

        <section className="dx-sec">
          <h2>How it works</h2>
          <ol className="dx-steps">
            <li><b>Free band check.</b> A 5-minute online check of your grammar, vocabulary and reading.</li>
            <li><b>Free demo lesson.</b> A teacher checks your Speaking and Writing and tells you your exact band in each skill.</li>
            <li><b>Your study plan.</b> Built around your target band, your exam date and your weakest skills.</li>
            <li><b>1-to-1 lessons and a weekly exam class.</b> Focused lessons, feedback on every task, and a free live exam class each week.</li>
          </ol>
        </section>

        <section className="dx-sec">
          <h2>What we cover</h2>
          <div className="dx-grid">
            <div><h3>Listening</h3><p>Question types, note-taking and staying focused through all four sections.</p></div>
            <div><h3>Reading</h3><p>Skimming, scanning and TRUE/FALSE/NOT GIVEN without running out of time.</p></div>
            <div><h3>Writing</h3><p>Task 1 and Task 2, marked against the four official criteria, with personal feedback.</p></div>
            <div><h3>Speaking</h3><p>Real exam practice for all three parts, so you speak with confidence on the day.</p></div>
          </div>
        </section>

        <section className="dx-sec">
          <h2>You&apos;re not a number in a classroom</h2>
          <p className="dx-p">
            Big IELTS courses teach everyone the same lesson. We build every lesson around you: where you lose points,
            what band you need and when your exam is. Our teachers have taught English for many years in Dubai, Istanbul,
            Prague and online. <a href="/#team">Meet the team</a>.
          </p>
          <p className="dx-p">
            Lessons come in packages of 10 or 20, and the larger package lowers the price per lesson. Message us on WhatsApp for current prices.
          </p>
        </section>

        <section className="dx-sec">
          <h2>IELTS preparation in Dubai: common questions</h2>
          <div className="dx-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="dx-sec">
          <h2>Read more</h2>
          <ul className="dx-list">
            <li><a href="/blog/ielts-band-7-writing-tips">IELTS Band 7 Writing: 7 tips that actually move your score</a></li>
            <li><a href="/blog/ielts-band-6-to-7-how-long">How long does it take to go from IELTS Band 6 to 7?</a></li>
            <li><a href="/blog/ielts-vs-pte-which-is-easier">IELTS vs PTE: which is easier for you?</a></li>
          </ul>
        </section>

        <div className="blog-cta">
          <h3>What band would you get today?</h3>
          <p>Take the free 5-minute band check, then get your exact band from a teacher on WhatsApp.</p>
          <div className="blog-cta-btns">
            <a className="ml-btn ml-btn--primary" href="/ielts-band-check">Free IELTS band check <ArrowRight /></a>
            <a className="ml-btn" href={WA} target="_blank" rel="noreferrer" style={{ background: "transparent", color: "#fff", boxShadow: "inset 0 0 0 1.4px rgba(255,255,255,.3)" }}>WhatsApp us <ArrowRight /></a>
          </div>
        </div>
      </main>
    </div>
  );
}
