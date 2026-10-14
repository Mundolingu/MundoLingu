import { ArrowRight } from "lucide-react";
import MockTestForm from "@/components/MockTestForm";

const WA = `https://wa.me/971504296090?text=${encodeURIComponent("Hi MundoLingu! I'm a nurse / healthcare worker and I need IELTS. I'd like the free Speaking mock test.")}`;

export const metadata = {
  title: "IELTS for Nurses in Dubai & the UAE | Online 1-to-1 Preparation",
  description:
    "1-to-1 online IELTS preparation for nurses and healthcare workers in the UAE who need a band for registration in the UK, Ireland, Australia, Canada or New Zealand. Lessons around your shifts. Free Speaking mock test.",
  alternates: { canonical: "/ielts-for-nurses" },
  openGraph: {
    title: "IELTS for Nurses | MundoLingu",
    description: "Online 1-to-1 IELTS lessons that fit around your shifts. Start with a free Speaking mock test.",
    url: "/ielts-for-nurses",
  },
};

const FAQ = [
  {
    q: "What IELTS score do I need as a nurse?",
    a: "Each country's nursing regulator sets its own minimum overall band and minimum score per skill, and these rules change from time to time. In your free mock test we check the latest requirement for the country you're applying to, so you know your exact target.",
  },
  {
    q: "IELTS Academic or General Training?",
    a: "Nursing regulators usually ask for IELTS Academic, but always check with the regulator in your destination country. We'll confirm it with you before you start.",
  },
  {
    q: "I work shifts. Can I still take lessons?",
    a: "Yes. All lessons are 1-to-1 and online, so we book them around your rota: mornings, evenings or days off.",
  },
  {
    q: "I keep missing my score in one skill. Can you help?",
    a: "Yes, this is very common, often in Writing or Speaking. Your study plan focuses on the skill that's holding you back, with personal feedback on every task.",
  },
  {
    q: "Do you prepare for PTE too?",
    a: "Yes. Some regulators also accept PTE Academic. We offer 1-to-1 preparation for IELTS, PTE and TOEFL.",
  },
];

export default function NursesPage() {
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
        <a className="dx-toplink" href="#book">Free mock test</a>
      </header>

      <main className="dx-wrap">
        <section className="dx-hero mt-hero">
          <div>
            <span className="blog-eyebrow">IELTS for nurses &amp; healthcare workers</span>
            <h1 className="blog-h1">Get the IELTS band your nursing registration needs</h1>
            <p className="blog-lead">
              Moving from the UAE to the UK, Ireland, Australia, Canada or New Zealand? 1-to-1 online IELTS lessons
              that fit around your shifts, focused on the skill that&apos;s holding you back.
            </p>
            <ul className="dx-facts">
              <li>1-to-1, online</li>
              <li>Lessons around your shifts</li>
              <li>Free weekly exam class</li>
              <li>IELTS &amp; PTE</li>
            </ul>
          </div>
          <div id="book">
            <MockTestForm source="nurses" defaultReason="Nurse / healthcare registration" />
          </div>
        </section>

        <section className="dx-sec">
          <h2>Sound familiar?</h2>
          <ul className="dx-list">
            <li>You&apos;ve taken IELTS before and missed your score by half a band in one skill.</li>
            <li>You work long shifts and can&apos;t get to a classroom course.</li>
            <li>Writing Task 1 or Task 2 always pulls your score down.</li>
            <li>You know your English is good, but Speaking under exam pressure is hard.</li>
          </ul>
          <p className="dx-p" style={{ marginTop: 18 }}>
            You&apos;re not alone. Most healthcare workers we teach already speak English every day at work. What they
            need is exam technique and focused practice on one or two skills, not a general English course.
          </p>
        </section>

        <section className="dx-sec">
          <h2>How it works</h2>
          <ol className="dx-steps">
            <li><b>Free Speaking mock test.</b> 15 minutes online. You get your estimated Speaking band and we confirm the exact score your regulator needs.</li>
            <li><b>Your study plan.</b> Built around your target, your exam date and the skill holding you back.</li>
            <li><b>1-to-1 lessons around your rota.</b> Focused practice with feedback on every Writing and Speaking task.</li>
            <li><b>Free weekly live exam class.</b> Extra practice in real exam conditions, included in every package.</li>
          </ol>
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
          <h3>Find out where you stand today</h3>
          <p>Book your free Speaking mock test, or message us on WhatsApp and we&apos;ll help you there.</p>
          <div className="blog-cta-btns">
            <a className="ml-btn ml-btn--primary" href="#book">Book free mock test <ArrowRight /></a>
            <a className="ml-btn ml-btn--wa" href={WA} target="_blank" rel="noreferrer">WhatsApp us <ArrowRight /></a>
          </div>
        </div>
      </main>
    </div>
  );
}
