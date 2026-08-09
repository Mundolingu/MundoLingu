"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, Check, Instagram, Mail, MessageCircle, Menu, X } from "lucide-react";
import DemoForm from "@/components/DemoForm";

// Add your full WhatsApp number (country code, no +, spaces or dashes) to show a floating chat button, e.g. "5215512345678".
const WHATSAPP_NUMBER = "";

/* ============================================================
   MundoLingu — flagship homepage
   Dual-language school (English & Spanish). Site UI in English.
   Signature: the horizon line + a hero "I want to learn" selector.
   Palette derived & disciplined from the brand set:
   navy / midnight / cool paper / sunrise orange / teal.
   ============================================================ */



const HERO = {
  english: {
    eyebrow: "English for Spanish speakers",
    line1: "Learn English.",
    sub: "The distance between where you are and where you want to be is a language. Personalised online English, built around your goals — not a generic classroom.",
    greet: "hello.",
  },
  spanish: {
    eyebrow: "Spanish for internationals",
    line1: "Learn Spanish.",
    sub: "Living, working, or moving somewhere new? Personalised online Spanish that helps you belong — not just translate.",
    greet: "hola.",
  },
};
const ENG_WORDS = ["a promotion", "a new country", "a bigger salary", "real confidence", "a global career"];
const ESP_WORDS = ["a new home", "real connection", "an easier move", "a second culture", "a life abroad"];

const NAV: { id: string; label: string; page?: boolean }[] = [
  { id: "vision", label: "Vision" },
  { id: "method", label: "Method" },
  { id: "team", label: "Our Team", page: true },
  { id: "membership", label: "Membership" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

const STATS = [
  { b: "1,200+", s: "lessons taught" },
  { b: "4.9★", s: "average rating" },
  { b: "12", s: "countries reached" },
  { b: "MX · EU · UAE", s: "and Latin America" },
];
const TAGS = [
  "Passed my B2 interview", "Moved to Canada", "Now working in Spanish in CDMX",
  "Promoted to team lead", "Ordered dinner in Madrid — no English", "Closed my first client abroad",
  "Relocated to Dubai", "Stopped translating in my head", "Nailed my visa interview",
];
const WHY = [
  { n: "01", h: "A door to the opportunity you want", p: "The interview, the promotion, the international role, the move abroad — a language is what gets you into the room." },
  { n: "02", h: "The confidence to actually speak", p: "We teach you to be understood, not to be perfect. You'll be speaking from your very first lesson." },
  { n: "03", h: "A plan shaped around your life", p: "Your goals, your schedule, your pace — in English or Spanish. Never a one-size-fits-all class." },
];
const STEPS = [
  { h: "Discovery", p: "A short conversation about where you want your language to take you." },
  { h: "Personal assessment", p: "We find your real level — how you speak, listen, and think, not just a test score." },
  { h: "Your learning plan", p: "A roadmap built for your goal: the job, the move, the exam, the confidence." },
  { h: "Live 1-to-1 lessons", p: "Real practice with a teacher who adapts to you, every session." },
  { h: "Weekly progress", p: "Clear checkpoints so you always feel yourself moving forward." },
  { h: "Confidence building", p: "We push you to speak sooner and worry less — that's where fluency lives." },
  { h: "Real-life language", p: "The English or Spanish you'll actually use at work, on calls, and in the street." },
  { h: "Long-term fluency", p: "Habits and support that keep you improving long after the first lesson." },
];
const TEACHERS = [
  { mono: "DM", name: "Daniel M.", teaches: "Teaches English", meta: "American · English, Spanish", phil: "“Fluency is a habit, not a talent.”", spec: "Careers, job interviews & business English." },
  { mono: "LS", name: "Lucía S.", teaches: "Teaches Spanish", meta: "Mexican · Spanish, English", phil: "“You'll speak like you live here — not like a textbook.”", spec: "Everyday & relocation Spanish for expats." },
  { mono: "SK", name: "Sophie K.", teaches: "English & Spanish", meta: "British · English, Spanish, French", phil: "“Small wins, every single week.”", spec: "Confidence, pronunciation & conversation." },
];
const STORIES = [
  { q: "After eight months I did the interview in English and got the job in Guadalajara. I stopped translating in my head — I just spoke.", by: "Mariana", ctx: "learning English" },
  { q: "I moved to Dubai for work and picked up Spanish for the Latin American side of my role. Six months in, I close calls in Spanish.", by: "James", ctx: "learning Spanish" },
];
const BENEFITS = [
  "Exclusive workbooks", "Weekly study plans", "Guided learning roadmaps", "Speaking practice sessions",
  "Grammar lessons", "Vocabulary packs", "Member-only video lessons", "Weekly challenges",
  "Accountability check-ins", "A community moving with you", "Live group sessions", "Discounts on private lessons",
];
const FAQ = [
  { q: "Do you teach both English and Spanish?", a: "Yes. English for Spanish speakers, and Spanish for English speakers, professionals and expats — including across Europe and Dubai. Same personalised method, either direction." },
  { q: "Can complete beginners join?", a: "Absolutely. We start exactly where you are and build from your very first lesson. Many of our students began from zero." },
  { q: "Do I need to speak well already for the demo?", a: "Not at all. The demo is a relaxed 15-minute chat to find your level and your goals. There's zero pressure and nothing to prepare." },
  { q: "How does the membership work?", a: "Monthly access to resources, live group speaking sessions, weekly plans and community. It's $10 for the first month, then $15 after — cancel anytime." },
  { q: "How do I choose or change my teacher?", a: "We match you with the right teacher after your demo. If you'd like a different fit later, you can switch anytime — no awkwardness." },
  { q: "Where are your students based?", a: "Across Mexico and Latin America, and increasingly Europe and Dubai. Everything is online and scheduled around your life." },
];


export default function Site() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [learn, setLearn] = useState<"english" | "spanish">("english");
  const [wi, setWi] = useState(0);
  const [faq, setFaq] = useState(0);
  const [page, setPage] = useState<"home" | "team">("home");
  const rootRef = useRef(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = rootRef.current ? Array.from(rootRef.current.querySelectorAll("[data-reveal]")) : [];
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
    const t = setTimeout(() => els.forEach((e) => e.classList.add("is-in")), 1600);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [page]);

  useEffect(() => { setWi(0); }, [learn]);
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setWi((v) => v + 1), 2400);
    return () => clearInterval(id);
  }, [learn]);

  const words = learn === "english" ? ENG_WORDS : ESP_WORDS;
  const word = words[wi % words.length];
  const hero = HERO[learn];

  const go = (id: string) => {
    setMobileOpen(false);
    setPage("home");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, 60);
  };

  const goTeam = () => {
    setMobileOpen(false);
    setPage("team");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="ml-root" ref={rootRef}>

      {/* NAV */}
      <nav className={"ml-nav" + (scrolled ? " scrolled" : "")}>
        <div className="ml-nav-in">
          <a href="#top" className="ml-lockup" onClick={(e) => { e.preventDefault(); go("top"); }} aria-label="MundoLingu — home">
            <img className="ml-lockup-mark" src="/logo-emblem.png" alt="" />
            <img className="ml-lockup-word" src="/logo-wordmark.png" alt="MundoLingu" />
          </a>
          <div className="ml-navlinks">
            {NAV.map((n) => (
              <a key={n.id} className="ml-navlink" href={n.page ? "#team" : "#" + n.id} onClick={(e) => { e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{n.label}</a>
            ))}
          </div>
          <div className="ml-nav-cta">
            <a className="ml-loginlink" href="/login">Log in</a>
            <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
              Book a free demo <ArrowRight />
            </a>
            <button className="ml-mobile-btn" aria-label="Open menu" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={"ml-mobile" + (mobileOpen ? " open" : "")}>
        {NAV.map((n) => (
          <a key={n.id} href={n.page ? "#team" : "#" + n.id} onClick={(e) => { e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{n.label}</a>
        ))}
        <a href="/login" onClick={() => setMobileOpen(false)}>Member login</a>
        <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
          Book a free demo <ArrowRight />
        </a>
      </div>

      <main id="top">
        {page === "team" ? (
          <section className="ml-section" id="team" style={{ paddingTop: "148px" }}>
            <div className="ml-wrap">
              <span className="ml-eyebrow" data-reveal>The MundoLingu team</span>
              <h1 className="ml-team-title" data-reveal>The people behind your progress.</h1>
              <p className="ml-lead" data-reveal>A small, dedicated team of teachers and mentors — each one here to help you speak with confidence, in English or Spanish.</p>
              <div className="ml-tgrid" style={{ marginTop: "48px" }}>
                {TEACHERS.map((t, i) => (
                  <article className="ml-teacher" data-reveal style={{ transitionDelay: i * 0.08 + "s" }} key={t.name}>
                    <div className="ml-portrait">
                      <span className="ml-badge">{t.teaches}</span>
                      <span className="ml-mono">{t.mono}</span>
                    </div>
                    <div className="ml-teacher-body">
                      <h3>{t.name}</h3>
                      <div className="ml-teacher-meta">{t.meta}</div>
                      <p className="ml-teacher-phil">{t.phil}</p>
                      <p className="ml-teacher-spec">{t.spec}</p>
                      <a className="ml-teacher-cta" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
                        Book a demo with {t.name.split(" ")[0]} <ArrowUpRight />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              <div className="ml-team-cta" data-reveal>
                <p>Ready to meet yours?</p>
                <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>Book a free demo <ArrowRight /></a>
              </div>
            </div>
          </section>
        ) : (
          <>
        {/* HERO */}
        <section className="ml-hero">
          <div className="ml-wrap ml-hero-grid">
            <div>
              <span className="ml-eyebrow">{hero.eyebrow}</span>
              <h1>
                <span className="ml-unlock">{hero.line1}</span><br />
                Unlock <span key={learn + "-" + wi} className="ml-rotator ml-rotator--anim">{word}</span>.
              </h1>
              <p className="ml-lead">{hero.sub}</p>

              <div className="ml-hero-ctas">
                <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
                  Book a free demo <ArrowRight />
                </a>
                <a className="ml-btn ml-btn--ghost" href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>
                  Explore the membership <ArrowRight />
                </a>
              </div>

              <div className="ml-learn" style={{ marginTop: 34 }}>
                <span className="ml-learn-label">I want to learn</span>
                <div className="ml-learn-seg" role="group" aria-label="Choose a language to learn">
                  <button className={learn === "english" ? "is-active" : ""} aria-pressed={learn === "english"} onClick={() => setLearn("english")}>English</button>
                  <button className={learn === "spanish" ? "is-active" : ""} aria-pressed={learn === "spanish"} onClick={() => setLearn("spanish")}>Spanish</button>
                </div>
              </div>

              <div className="ml-hero-foot">
                <span className="ml-dotpulse" /> Free 15-minute demo · meet a teacher · zero pressure
              </div>
            </div>

            {/* hero visual */}
            <div className="ml-visual" aria-hidden="true">
              <div className="ml-visual-top">
                <span className="ml-live"><b />Live lesson</span>
                <span>{learn === "english" ? "English · A1 → C1" : "Español · A1 → C1"}</span>
              </div>
              <div className="ml-greet"><span key={learn}>{hero.greet}</span></div>
              <div className="ml-visual-bottom">
                <div className="ml-horizon ml-horizon--draw" />
                <div className="ml-progress-label"><span>Confidence</span><span>80%</span></div>
                <div className="ml-progress"><i /></div>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="ml-proof">
          <div className="ml-wrap">
            <div className="ml-stats" data-reveal>
              {STATS.map((s) => (
                <div className="ml-stat" key={s.s}><b>{s.b}</b><span>{s.s}</span></div>
              ))}
            </div>
          </div>
          <div className="ml-marquee">
            <div className="ml-mtrack">
              {[...TAGS, ...TAGS].map((t, i) => (<span className="ml-tag" key={i}>{t}”</span>))}
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="ml-section" id="why">
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal>Why MundoLingu</span>
            <h2 className="ml-h2" data-reveal>We don't sell lessons. We open doors.</h2>
            <div className="ml-why">
              {WHY.map((w, i) => (
                <div className="ml-card" data-reveal style={{ transitionDelay: i * 0.08 + "s" }} key={w.n}>
                  <span className="ml-card-n">{w.n}</span>
                  <h3>{w.h}</h3>
                  <p>{w.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VISION */}
        <section className="ml-section ml-section--dark" id="vision">
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal>Our vision</span>
            <h2 className="ml-vision-head" data-reveal>An education that begins with the <em>person</em> — not the language.</h2>
            <p className="ml-vision-body" data-reveal>
              Most language schools hand everyone the same syllabus and hope they keep up. We were built on
              the opposite conviction: that a language is deeply personal — bound up with the job you're
              chasing, the country you're moving to, the person you're becoming. So we start with you, and
              shape everything around where you're going.
            </p>

            <div className="ml-diff">
              <div className="ml-diff-item" data-reveal>
                <span className="ml-diff-n">01</span>
                <h4>A plan built for one</h4>
                <p>No fixed curriculum. Your goal, your level, and your life shape every lesson from the very first day.</p>
              </div>
              <div className="ml-diff-item" data-reveal style={{ transitionDelay: "0.06s" }}>
                <span className="ml-diff-n">02</span>
                <h4>Confidence before perfection</h4>
                <p>You'll speak from session one. We teach you to be understood and unafraid — fluency follows courage, not grammar drills.</p>
              </div>
              <div className="ml-diff-item" data-reveal style={{ transitionDelay: "0.12s" }}>
                <span className="ml-diff-n">03</span>
                <h4>Teachers who've crossed the same borders</h4>
                <p>Native English and Spanish teachers who've built lives in a new language — so you learn the language you'll actually live in.</p>
              </div>
              <div className="ml-diff-item" data-reveal style={{ transitionDelay: "0.18s" }}>
                <span className="ml-diff-n">04</span>
                <h4>A community, not a classroom</h4>
                <p>Real support between lessons, and people moving toward the same kind of life. You're never just a name on a register.</p>
              </div>
            </div>

            <div className="ml-founder" data-reveal>
              <p className="ml-founder-q">“Whether your next step is a promotion, a move abroad, or simply the courage to speak — we'll build the path with you.”</p>
              <div className="ml-founder-by"><span className="line" /> Jurgen · Founder, MundoLingu</div>
            </div>
          </div>
        </section>

        {/* METHOD */}
        <section className="ml-section" id="method">
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal>How it works</span>
            <h2 className="ml-h2" data-reveal>A journey, not a course.</h2>
            <div className="ml-time">
              {STEPS.map((s, i) => (
                <div className="ml-step" data-reveal key={s.h}>
                  <div className="ml-node">{String(i + 1).padStart(2, "0")}</div>
                  <div><h4>{s.h}</h4><p>{s.p}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* STORIES */}
        <section className="ml-section" id="stories">
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal>Student stories</span>
            <h2 className="ml-h2" data-reveal>Real people. Real change.</h2>
            <div className="ml-stories">
              {STORIES.map((s, i) => (
                <div className="ml-story" data-reveal style={{ transitionDelay: i * 0.08 + "s" }} key={s.by}>
                  <div className="qm">“</div>
                  <blockquote>{s.q}</blockquote>
                  <div className="ml-story-by"><b>{s.by}</b> · {s.ctx}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MEMBERSHIP */}
        <section className="ml-section ml-section--tight" id="membership" style={{ background: "var(--paper-2)" }}>
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal>The membership</span>
            <h2 className="ml-h2" data-reveal>Your language journey starts here.</h2>
            <p className="ml-lead" data-reveal>Everything you need to keep going — in English or Spanish — with a community moving right alongside you.</p>
            <div className="ml-memb-grid">
              <div className="ml-benefits" data-reveal>
                {BENEFITS.map((b) => (
                  <div className="ml-benefit" key={b}><Check /> {b}</div>
                ))}
              </div>
              <div className="ml-price-card" data-reveal>
                <div className="rel">
                  <div className="ml-plan-tag" style={{ color: "var(--cyan)" }}>Membership</div>
                  <div className="ml-price-tag" style={{ marginTop: 14 }}>$10 <small>first month</small></div>
                  <div className="ml-price-sub">then $15 / month · cancel anytime · English or Spanish</div>
                  <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
                    Join the membership <ArrowRight />
                  </a>
                  <div className="ml-price-note">Prefer to try first? Start with a free demo lesson.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="ml-section" id="pricing">
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal>Pricing</span>
            <h2 className="ml-h2" data-reveal>Choose the path that fits your goal.</h2>
            <div className="ml-plans">
              <div className="ml-plan" data-reveal>
                <span className="ml-plan-tag">Membership</span>
                <h3>Learn with a community</h3>
                <p className="for">For motivated self-starters who want structure and momentum.</p>
                <div className="ml-plan-price">$10 <small>first month, then $15/mo</small></div>
                <ul>
                  <li><Check /> Live group speaking sessions</li>
                  <li><Check /> Weekly plans, workbooks & resources</li>
                  <li><Check /> Community & accountability</li>
                  <li><Check /> Member discounts on 1-to-1 lessons</li>
                  <li><Check /> English or Spanish</li>
                </ul>
                <a className="ml-btn ml-btn--ghost" href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>
                  Join the membership <ArrowRight />
                </a>
              </div>
              <div className="ml-plan ml-plan--feature" data-reveal style={{ transitionDelay: "0.08s" }}>
                <span className="ml-plan-tag">Private 1-to-1</span>
                <h3>Learn with your own teacher</h3>
                <p className="for">For the fastest, most personal progress toward a specific goal.</p>
                <div className="ml-plan-price">Personalised <small>priced to your plan</small></div>
                <ul>
                  <li><Check /> Your own dedicated teacher</li>
                  <li><Check /> A plan built for your goal or exam</li>
                  <li><Check /> Flexible scheduling around your life</li>
                  <li><Check /> The fastest route to fluency</li>
                  <li><Check /> English or Spanish</li>
                </ul>
                <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
                  Book a free demo <ArrowRight />
                </a>
              </div>
            </div>
            <p className="ml-plans-foot">Every path starts with a free 15-minute demo lesson.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="ml-section ml-section--tight" id="faq" style={{ background: "var(--paper-2)" }}>
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal>Questions</span>
            <h2 className="ml-h2" data-reveal>Everything you might be wondering.</h2>
            <div className="ml-faq">
              {FAQ.map((f, i) => (
                <div className={"ml-faq-item" + (faq === i ? " open" : "")} key={i}>
                  <button className="ml-faq-q" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}>
                    {f.q} <span className="ml-faq-ic" />
                  </button>
                  <div className="ml-faq-a"><p>{f.a}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="ml-section ml-section--mid ml-final" id="demo">
          <div className="ml-wrap">
            <span className="ml-eyebrow" data-reveal style={{ justifyContent: "center", display: "flex" }}>Book a free demo</span>
            <h2 data-reveal>Your bigger life is one conversation away.</h2>
            <p className="ml-lead" data-reveal>A free 15-minute demo. Meet a teacher, find your level, and leave with a plan — in English or Spanish. No pressure, no commitment.</p>
            <DemoForm />
            <p className="ml-demo-alt" data-reveal>Prefer to start on your own? <a href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>Explore the membership</a></p>
            <div className="ml-horizon" style={{ marginTop: 48 }} data-reveal />
          </div>
        </section>
                </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="ml-footer">
        <div className="ml-wrap">
          <div className="ml-foot-grid">
            <div>
              <div className="ml-foot-lockup">
                <span className="ml-foot-chip"><img src="/logo-emblem.png" alt="" /></span>
                <img className="ml-foot-word" src="/logo-wordmark-white.png" alt="MundoLingu" />
              </div>
              <p className="ml-foot-tag">English &amp; Spanish, made personal. Online lessons that turn a language into an opportunity.</p>
            </div>
            <div className="ml-foot-col">
              <h5>Explore</h5>
              {NAV.map((n) => (<a key={n.id} href={n.page ? "#team" : "#" + n.id} onClick={(e) => { e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{n.label}</a>))}
            </div>
            <div className="ml-foot-col">
              <h5>Contact</h5>
              <a href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}><MessageCircle /> WhatsApp</a>
              <a href="https://instagram.com/mundolingu" target="_blank" rel="noreferrer"><Instagram /> @mundolingu</a>
              <a href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}><Mail /> hello@mundolingu.com</a>
            </div>
          </div>
          <div className="ml-foot-bar">
            <span>© 2026 MundoLingu · Online — Mexico · Latin America · Europe · Dubai</span>
            <span>Site in English</span>
          </div>
        </div>
      </footer>
      {WHATSAPP_NUMBER && (
        <a
          className="wa-fab"
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi MundoLingu! I'd like to know more about lessons.")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.2 4.9 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4 15 3.5 13.5 3.5 12 3.5 7.3 7.3 3.5 12 3.5S20.5 7.3 20.5 12 16.7 20 12 20z" />
            <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.3-.6-2.2-1.2-3.1-2.6-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.1-.3.2-.5v-.5c-.1-.1-.7-1.6-.9-2.2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2.1-.5 3.3.7 1.7 1.9 3.1 3.5 4.1 1.6 1 2.9 1.1 3.4 1 .5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z" />
          </svg>
        </a>
      )}

    </div>
  );
}
