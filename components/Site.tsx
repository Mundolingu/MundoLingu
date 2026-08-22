"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, Check, Instagram, Mail, MessageCircle, Menu, X, Globe } from "lucide-react";
import DemoForm from "@/components/DemoForm";

// Add your full WhatsApp number (country code, no +, spaces or dashes), e.g. "5215512345678".
const WHATSAPP_NUMBER = "971504296090";

// Show your latest Instagram posts: get a widget URL (see guide) and set NEXT_PUBLIC_IG_EMBED in Netlify.
const INSTAGRAM_EMBED_URL = process.env.NEXT_PUBLIC_IG_EMBED || "";

type Lang = "en" | "es";

const NAV: { id: string; en: string; es: string; page?: boolean; route?: string }[] = [
  { id: "vision", en: "Vision", es: "Visión" },
  { id: "method", en: "Method", es: "Método" },
  { id: "team", en: "Our Team", es: "Equipo", page: true },
  { id: "membership", en: "Membership", es: "Membresía" },
  { id: "pricing", en: "Pricing", es: "Precios" },
  { id: "faq", en: "FAQ", es: "Preguntas" },
  { id: "level-test", en: "Level test", es: "Test de nivel", route: "/level-test" },
  { id: "opportunities", en: "Opportunities", es: "Oportunidades", route: "/opportunities" },
  { id: "blog", en: "Blog", es: "Blog", route: "/blog" },
];

const HERO = {
  en: {
    english: { eyebrow: "English for Spanish speakers", line1: "Learn English.", greet: "hello.",
      sub: "The distance between where you are and where you want to be is a language. Personalised online English, built around your goals — not a generic classroom.",
      words: ["a promotion", "a new country", "a bigger salary", "real confidence", "a global career"] },
    spanish: { eyebrow: "Spanish for internationals", line1: "Learn Spanish.", greet: "hola.",
      sub: "Living, working, or moving somewhere new? Personalised online Spanish that helps you belong — not just translate.",
      words: ["a new home", "real connection", "an easier move", "a second culture", "a life abroad"] },
  },
  es: {
    english: { eyebrow: "Inglés para hispanohablantes", line1: "Aprende inglés.", greet: "hello.",
      sub: "La distancia entre donde estás y donde quieres llegar es un idioma. Inglés online personalizado, diseñado en torno a tus metas, no una clase genérica.",
      words: ["un ascenso", "un nuevo país", "un mejor salario", "confianza real", "una carrera global"] },
    spanish: { eyebrow: "Español para internacionales", line1: "Aprende español.", greet: "hola.",
      sub: "¿Vives, trabajas o te mudas a un lugar nuevo? Español online personalizado que te ayuda a pertenecer, no solo a traducir.",
      words: ["un nuevo hogar", "conexión real", "una mudanza más fácil", "una segunda cultura", "una vida en el extranjero"] },
  },
};

const STATS = {
  en: [ { b: "1,200+", s: "lessons taught" }, { b: "4.9★", s: "average rating" }, { b: "12", s: "countries reached" }, { b: "MX · EU · UAE", s: "and Latin America" } ],
  es: [ { b: "1.200+", s: "clases impartidas" }, { b: "4.9★", s: "valoración media" }, { b: "12", s: "países alcanzados" }, { b: "MX · EU · EAU", s: "y Latinoamérica" } ],
};

const TAGS = {
  en: ["Passed my B2 interview", "Moved to Canada", "Now working in Spanish in CDMX", "Promoted to team lead", "Ordered dinner in Madrid — no English", "Closed my first client abroad", "Relocated to Dubai", "Stopped translating in my head", "Nailed my visa interview"],
  es: ["Aprobé mi entrevista B2", "Me mudé a Canadá", "Ahora trabajo en español en CDMX", "Ascendido a líder de equipo", "Pedí la cena en Madrid, sin inglés", "Cerré mi primer cliente en el extranjero", "Me mudé a Dubái", "Dejé de traducir en mi cabeza", "Aprobé mi entrevista de visa"],
};

const WHY = {
  en: [
    { n: "01", h: "A door to the opportunity you want", p: "The interview, the promotion, the international role, the move abroad — a language is what gets you into the room." },
    { n: "02", h: "The confidence to actually speak", p: "We teach you to be understood, not to be perfect. You'll be speaking from your very first lesson." },
    { n: "03", h: "A plan shaped around your life", p: "Your goals, your schedule, your pace — in English or Spanish. Never a one-size-fits-all class." },
  ],
  es: [
    { n: "01", h: "Una puerta a la oportunidad que quieres", p: "La entrevista, el ascenso, el puesto internacional, la mudanza: un idioma es lo que te abre la puerta." },
    { n: "02", h: "La confianza para hablar de verdad", p: "Te enseñamos a que te entiendan, no a ser perfecto. Hablarás desde tu primera clase." },
    { n: "03", h: "Un plan a la medida de tu vida", p: "Tus metas, tu horario, tu ritmo, en inglés o español. Nunca una clase igual para todos." },
  ],
};

const STEPS = {
  en: [
    { h: "Discovery", p: "A short conversation about where you want your language to take you." },
    { h: "Personal assessment", p: "We find your real level — how you speak, listen, and think, not just a test score." },
    { h: "Your learning plan", p: "A roadmap built for your goal: the job, the move, the exam, the confidence." },
    { h: "Live 1-to-1 lessons", p: "Real practice with a teacher who adapts to you, every session." },
    { h: "Weekly progress", p: "Clear checkpoints so you always feel yourself moving forward." },
    { h: "Confidence building", p: "We push you to speak sooner and worry less — that's where fluency lives." },
    { h: "Real-life language", p: "The English or Spanish you'll actually use at work, on calls, and in the street." },
    { h: "Long-term fluency", p: "Habits and support that keep you improving long after the first lesson." },
  ],
  es: [
    { h: "Descubrimiento", p: "Una breve conversación sobre a dónde quieres que te lleve el idioma." },
    { h: "Evaluación personal", p: "Encontramos tu nivel real: cómo hablas, escuchas y piensas, no solo una nota." },
    { h: "Tu plan de aprendizaje", p: "Una hoja de ruta hecha para tu meta: el trabajo, la mudanza, el examen, la confianza." },
    { h: "Clases 1 a 1 en vivo", p: "Práctica real con un profe que se adapta a ti, en cada sesión." },
    { h: "Progreso semanal", p: "Puntos de control claros para que siempre sientas que avanzas." },
    { h: "Construir confianza", p: "Te animamos a hablar antes y a preocuparte menos: ahí vive la fluidez." },
    { h: "Idioma de la vida real", p: "El inglés o español que de verdad usarás en el trabajo, en llamadas y en la calle." },
    { h: "Fluidez a largo plazo", p: "Hábitos y apoyo que te mantienen mejorando mucho después de la primera clase." },
  ],
};

const STORIES = {
  en: [
    { q: "After eight months I did the interview in English and got the job in Guadalajara. I stopped translating in my head — I just spoke.", by: "Mariana", ctx: "learning English" },
    { q: "I moved to Dubai for work and picked up Spanish for the Latin American side of my role. Six months in, I close calls in Spanish.", by: "James", ctx: "learning Spanish" },
  ],
  es: [
    { q: "Después de ocho meses hice la entrevista en inglés y conseguí el trabajo en Guadalajara. Dejé de traducir en mi cabeza: simplemente hablé.", by: "Mariana", ctx: "aprendiendo inglés" },
    { q: "Me mudé a Dubái por trabajo y aprendí español para la parte latinoamericana de mi puesto. A los seis meses, cierro llamadas en español.", by: "James", ctx: "aprendiendo español" },
  ],
};

const BENEFITS = {
  en: ["Exclusive workbooks", "Weekly study plans", "Guided learning roadmaps", "Speaking practice sessions", "Grammar lessons", "Vocabulary packs", "Member-only video lessons", "Weekly challenges", "Accountability check-ins", "A community moving with you", "Live group sessions", "Discounts on private lessons"],
  es: ["Cuadernos exclusivos", "Planes de estudio semanales", "Hojas de ruta guiadas", "Sesiones de práctica oral", "Clases de gramática", "Packs de vocabulario", "Videoclases solo para miembros", "Retos semanales", "Seguimiento y motivación", "Una comunidad que avanza contigo", "Sesiones grupales en vivo", "Descuentos en clases privadas"],
};

const FAQ = {
  en: [
    { q: "Do you teach both English and Spanish?", a: "Yes. English for Spanish speakers, and Spanish for English speakers, professionals and expats — including across Europe and Dubai. Same personalised method, either direction." },
    { q: "Can complete beginners join?", a: "Absolutely. We start exactly where you are and build from your very first lesson. Many of our students began from zero." },
    { q: "Do I need to speak well already for the demo?", a: "Not at all. The demo is a relaxed 15-minute chat to find your level and your goals. There's zero pressure and nothing to prepare." },
    { q: "How does the membership work?", a: "Monthly access to resources, live group speaking sessions, weekly plans and community. It's $10 for the first month, then $15 after — cancel anytime." },
    { q: "How do I choose or change my teacher?", a: "We match you with the right teacher after your demo. If you'd like a different fit later, you can switch anytime — no awkwardness." },
    { q: "Where are your students based?", a: "Across Mexico and Latin America, and increasingly Europe and Dubai. Everything is online and scheduled around your life." },
  ],
  es: [
    { q: "¿Enseñan inglés y español?", a: "Sí. Inglés para hispanohablantes, y español para angloparlantes, profesionales y expatriados, incluso en Europa y Dubái. El mismo método personalizado, en cualquier dirección." },
    { q: "¿Pueden unirse principiantes totales?", a: "Por supuesto. Empezamos justo donde estás y construimos desde tu primera clase. Muchos de nuestros estudiantes empezaron desde cero." },
    { q: "¿Necesito hablar bien para la clase de prueba?", a: "Para nada. La prueba es una charla relajada de 15 minutos para conocer tu nivel y tus metas. Sin presión y sin nada que preparar." },
    { q: "¿Cómo funciona la membresía?", a: "Acceso mensual a recursos, sesiones grupales de conversación en vivo, planes semanales y comunidad. Son $10 el primer mes, luego $15, y cancelas cuando quieras." },
    { q: "¿Cómo elijo o cambio de profe?", a: "Te asignamos al profe indicado después de tu prueba. Si más adelante prefieres otro, puedes cambiar cuando quieras, sin problema." },
    { q: "¿De dónde son tus estudiantes?", a: "De México y Latinoamérica, y cada vez más de Europa y Dubái. Todo es online y se adapta a tu horario." },
  ],
};

const TEACHERS: { [k in Lang]: { name: string; teaches: string; meta: string; phil: string; spec: string; photo?: string }[] } = {
  en: [
    { name: "Jurgen Knechten", teaches: "Founder", meta: "8 years in private schools · Istanbul · Dubai · Prague", phil: "“I'd rather build real progress that sticks for life than the kind that fades.”", spec: "Founder of MundoLingu. Eight years teaching English in private schools around the world, and five years teaching online — genuinely invested in every student and the progress they make.", photo: "/team-jurgen.jpg" },
    { name: "Dania", teaches: "English & Spanish", meta: "12+ years · United States · Istanbul", phil: "“Real-life goals, real energy — every single lesson.”", spec: "English and Spanish teacher with over 12 years' experience across the world, including the United States and Istanbul. She teaches around real-life targets and brings the best energy to every lesson.", photo: "/team-dania.jpg" },
    { name: "Samantha", teaches: "English & Spanish", meta: "CEO · Emirates cabin crew", phil: "“I teach people to create their own opportunities — because I've lived it.”", spec: "Emirates cabin crew and CEO at MundoLingu. Alongside seeing the world, she teaches English and Spanish online — showing people how to create opportunities to better their lives, from real experience gained across the globe.", photo: "/team-samantha.jpg" },
    { name: "Paty", teaches: "English & Spanish", meta: "Emirates cabin crew · Qualified in Mexico", phil: "“A clear structure that gets you speaking, fast.”", spec: "Emirates cabin crew who qualified as an English language teacher in Mexico. She teaches English and Spanish online and speaks from real experience travelling the world, with a clear, structured method that makes progress fast.", photo: "/team-paty.jpg" },
  ],
  es: [
    { name: "Jurgen Knechten", teaches: "Fundador", meta: "8 años en escuelas privadas · Estambul · Dubái · Praga", phil: "“Prefiero construir progreso real que dura toda la vida, no del que se desvanece.”", spec: "Fundador de MundoLingu. Ocho años enseñando inglés en escuelas privadas por todo el mundo, y cinco años enseñando online, comprometido de verdad con cada estudiante y su progreso.", photo: "/team-jurgen.jpg" },
    { name: "Dania", teaches: "Inglés y español", meta: "12+ años · Estados Unidos · Estambul", phil: "“Metas de la vida real, energía real, en cada clase.”", spec: "Profesora de inglés y español con más de 12 años de experiencia por el mundo, incluidos Estados Unidos y Estambul. Enseña en torno a metas reales y trae la mejor energía a cada clase.", photo: "/team-dania.jpg" },
    { name: "Samantha", teaches: "Inglés y español", meta: "CEO · tripulante de Emirates", phil: "“Enseño a la gente a crear sus propias oportunidades, porque yo lo he vivido.”", spec: "Tripulante de cabina de Emirates y CEO en MundoLingu. Además de recorrer el mundo, enseña inglés y español online, mostrando a las personas cómo crear oportunidades para mejorar su vida, desde la experiencia real ganada por todo el planeta.", photo: "/team-samantha.jpg" },
    { name: "Paty", teaches: "Inglés y español", meta: "Tripulante de Emirates · Titulada en México", phil: "“Una estructura clara que te hace hablar, rápido.”", spec: "Tripulante de cabina de Emirates, titulada como profesora de inglés en México. Enseña inglés y español online y habla desde la experiencia real de viajar por el mundo, con un método claro y estructurado que hace avanzar rápido.", photo: "/team-paty.jpg" },
  ],
};

const UI = {
  en: {
    login: "Log in", memberLogin: "Member login", bookDemo: "Book a free demo", exploreMembership: "Explore the membership",
    iWantToLearn: "I want to learn", learnEnglish: "English", learnSpanish: "Spanish",
    heroFoot: "Free 15-minute demo · meet a teacher · zero pressure", liveLesson: "Live lesson", confidence: "Confidence",
    whyEyebrow: "Why MundoLingu", whyTitle: "We don't sell lessons. We open doors.",
    visionEyebrow: "Our vision", visionBody: "Most language schools hand everyone the same syllabus and hope they keep up. We were built on the opposite conviction: that a language is deeply personal — bound up with the job you're chasing, the country you're moving to, the person you're becoming. So we start with you, and shape everything around where you're going.",
    diff: [ { h: "A plan built for one", p: "No fixed curriculum. Your goal, your level, and your life shape every lesson from the very first day." }, { h: "Confidence before perfection", p: "You'll speak from session one. We teach you to be understood and unafraid — fluency follows courage, not grammar drills." }, { h: "Teachers who've crossed the same borders", p: "Native English and Spanish teachers who've built lives in a new language — so you learn the language you'll actually live in." }, { h: "A community, not a classroom", p: "Real support between lessons, and people moving toward the same kind of life. You're never just a name on a register." } ],
    founderQuote: "“Whether your next step is a promotion, a move abroad, or simply the courage to speak — we'll build the path with you.”", founderBy: "Jurgen · Founder, MundoLingu",
    methodEyebrow: "How it works", methodTitle: "A journey, not a course.",
    storiesEyebrow: "Student stories", storiesTitle: "Real people. Real change.",
    membEyebrow: "The membership", membTitle: "Your language journey starts here.", membLead: "Everything you need to keep going — in English or Spanish — with a community moving right alongside you.",
    membTag: "Membership", firstMonth: "first month", membSub: "then $15 / month · cancel anytime · English or Spanish", joinMembership: "Join the membership", tryFirst: "Prefer to try first? Start with a free demo lesson.",
    pricingEyebrow: "Pricing", pricingTitle: "Choose the path that fits your goal.",
    planCommunity: "Learn with a community", planCommunityFor: "For motivated self-starters who want structure and momentum.", planCommunityPrice: "first month, then $15/mo",
    planCommunityList: ["Live group speaking sessions", "Weekly plans, workbooks & resources", "Community & accountability", "Member discounts on 1-to-1 lessons", "English or Spanish"],
    planPrivateTag: "Private 1-to-1", planPrivate: "Learn with your own teacher", planPrivateFor: "For the fastest, most personal progress toward a specific goal.", planPrivatePrice: "Personalised", planPrivatePriceSub: "priced to your plan",
    planPrivateList: ["Your own dedicated teacher", "A plan built for your goal or exam", "Flexible scheduling around your life", "The fastest route to fluency", "English or Spanish"],
    pricingFoot: "Every path starts with a free 15-minute demo lesson.",
    faqEyebrow: "Questions", faqTitle: "Everything you might be wondering.",
    igTitle: "Follow the journey.", igLead: "Daily tips, student wins, and behind-the-scenes with our teachers — come say hi on Instagram.", igBtn: "Follow on Instagram",
    finalEyebrow: "Book a free demo", finalTitle: "Your bigger life is one conversation away.", finalLead: "A free 15-minute demo. Meet a teacher, find your level, and leave with a plan — in English or Spanish. No pressure, no commitment.", demoAlt: "Prefer to start on your own?",
    teamEyebrow: "The MundoLingu team", teamTitle: "The people behind your progress.", teamLead: "A small, dedicated team of teachers and mentors — each one here to help you speak with confidence, in English or Spanish.",
    bookWith: "Book a demo with", readyToMeet: "Ready to meet yours?", applyTitle: "Want to teach with us?", applyBody: "We're always looking for passionate English and Spanish teachers who care about real progress. Send your CV and a few words about yourself — if you're a great fit, we'll be in touch.", applyBtn: "Send your CV",
    footTag: "English & Spanish, made personal. Online lessons that turn a language into an opportunity.", explore: "Explore", contact: "Contact", footBar: "© 2026 MundoLingu · Online — Mexico · Latin America · Europe · Dubai",
  },
  es: {
    login: "Entrar", memberLogin: "Acceso de miembros", bookDemo: "Reserva una clase gratis", exploreMembership: "Explora la membresía",
    iWantToLearn: "Quiero aprender", learnEnglish: "Inglés", learnSpanish: "Español",
    heroFoot: "Clase de prueba de 15 min · conoce a un profe · sin compromiso", liveLesson: "Clase en vivo", confidence: "Confianza",
    whyEyebrow: "Por qué MundoLingu", whyTitle: "No vendemos clases. Abrimos puertas.",
    visionEyebrow: "Nuestra visión", visionBody: "La mayoría de las escuelas dan a todos el mismo temario y esperan que sigan el ritmo. Nosotros nacimos con la convicción contraria: que un idioma es algo profundamente personal, ligado al trabajo que buscas, al país al que te mudas, a la persona en la que te conviertes. Por eso empezamos por ti y lo diseñamos todo en torno a hacia dónde vas.",
    diff: [ { h: "Un plan hecho para uno", p: "Sin temario fijo. Tu meta, tu nivel y tu vida dan forma a cada clase desde el primer día." }, { h: "Confianza antes que perfección", p: "Hablarás desde la primera sesión. Te enseñamos a que te entiendan y a perder el miedo: la fluidez viene del valor, no de repetir gramática." }, { h: "Profes que han cruzado las mismas fronteras", p: "Profesores nativos de inglés y español que han construido su vida en un nuevo idioma, para que aprendas el idioma que de verdad vas a vivir." }, { h: "Una comunidad, no un aula", p: "Apoyo real entre clases y gente que va hacia el mismo tipo de vida. Nunca eres solo un nombre en una lista." } ],
    founderQuote: "“Ya sea un ascenso, una mudanza al extranjero o simplemente el valor de hablar, construiremos el camino contigo.”", founderBy: "Jurgen · Fundador, MundoLingu",
    methodEyebrow: "Cómo funciona", methodTitle: "Un camino, no un curso.",
    storiesEyebrow: "Historias de estudiantes", storiesTitle: "Personas reales. Cambios reales.",
    membEyebrow: "La membresía", membTitle: "Tu viaje con el idioma empieza aquí.", membLead: "Todo lo que necesitas para seguir avanzando, en inglés o español, con una comunidad que avanza a tu lado.",
    membTag: "Membresía", firstMonth: "el primer mes", membSub: "luego $15/mes · cancela cuando quieras · inglés o español", joinMembership: "Únete a la membresía", tryFirst: "¿Prefieres probar primero? Empieza con una clase gratis.",
    pricingEyebrow: "Precios", pricingTitle: "Elige el camino que encaja con tu meta.",
    planCommunity: "Aprende en comunidad", planCommunityFor: "Para personas motivadas que quieren estructura e impulso.", planCommunityPrice: "primer mes, luego $15/mes",
    planCommunityList: ["Sesiones grupales de conversación en vivo", "Planes semanales, cuadernos y recursos", "Comunidad y motivación", "Descuentos de miembro en clases 1 a 1", "Inglés o español"],
    planPrivateTag: "Privado 1 a 1", planPrivate: "Aprende con tu propio profe", planPrivateFor: "Para el progreso más rápido y personal hacia una meta concreta.", planPrivatePrice: "Personalizado", planPrivatePriceSub: "según tu plan",
    planPrivateList: ["Tu propio profe dedicado", "Un plan hecho para tu meta o examen", "Horarios flexibles a tu medida", "El camino más rápido a la fluidez", "Inglés o español"],
    pricingFoot: "Todo empieza con una clase de prueba gratis de 15 minutos.",
    faqEyebrow: "Preguntas", faqTitle: "Todo lo que quizás te preguntas.",
    igTitle: "Sigue el camino.", igLead: "Consejos diarios, logros de estudiantes y el detrás de cámaras con nuestros profes. Ven a saludarnos en Instagram.", igBtn: "Síguenos en Instagram",
    finalEyebrow: "Reserva una clase gratis", finalTitle: "Tu vida más grande está a una conversación de distancia.", finalLead: "Una clase de prueba gratis de 15 minutos. Conoce a un profe, descubre tu nivel y sal con un plan, en inglés o español. Sin presión, sin compromiso.", demoAlt: "¿Prefieres empezar por tu cuenta?",
    teamEyebrow: "El equipo de MundoLingu", teamTitle: "Las personas detrás de tu progreso.", teamLead: "Un equipo pequeño y dedicado de profes y mentores, cada uno aquí para ayudarte a hablar con confianza, en inglés o español.",
    bookWith: "Reserva una clase con", readyToMeet: "¿Quieres conocer al tuyo?", applyTitle: "¿Quieres enseñar con nosotros?", applyBody: "Siempre buscamos profes apasionados de inglés y español a quienes les importe el progreso real. Envía tu CV y unas líneas sobre ti; si encajas, te contactamos.", applyBtn: "Envía tu CV",
    footTag: "Inglés y español, hechos personales. Clases online que convierten un idioma en una oportunidad.", explore: "Explora", contact: "Contacto", footBar: "© 2026 MundoLingu · Online — México · Latinoamérica · Europa · Dubái",
  },
};

export default function Site() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [learn, setLearn] = useState<"english" | "spanish">("english");
  const [wi, setWi] = useState(0);
  const [faq, setFaq] = useState(0);
  const [page, setPage] = useState<"home" | "team">("home");
  const rootRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ml-lang");
      if (saved === "es" || saved === "en") setLang(saved);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);
  function switchLang(l: Lang) { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = rootRef.current ? Array.from((rootRef.current as HTMLElement).querySelectorAll("[data-reveal]")) : [];
    if (reduce || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
    const t = setTimeout(() => els.forEach((e) => e.classList.add("is-in")), 1600);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [page, lang]);

  useEffect(() => { setWi(0); }, [learn, lang]);
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setWi((v) => v + 1), 2400);
    return () => clearInterval(id);
  }, [learn, lang]);

  const t = UI[lang];
  const hero = HERO[lang][learn];
  const word = hero.words[wi % hero.words.length];

  const go = (id: string) => {
    setMobileOpen(false);
    setPage("home");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 60);
  };
  const goTeam = () => {
    setMobileOpen(false);
    setPage("team");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const LangSwitch = () => (
    <div className="ml-langsw" role="group" aria-label="Language">
      <Globe size={14} />
      <button className={lang === "en" ? "on" : ""} onClick={() => switchLang("en")}>EN</button>
      <button className={lang === "es" ? "on" : ""} onClick={() => switchLang("es")}>ES</button>
    </div>
  );

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
              <a key={n.id} className="ml-navlink" href={n.route ? n.route : n.page ? "#team" : "#" + n.id} onClick={(e) => { if (n.route) return; e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{n[lang]}</a>
            ))}
          </div>
          <div className="ml-nav-cta">
            <a className="ml-loginlink" href="/login">{t.login}</a>
            <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
              {t.bookDemo} <ArrowRight />
            </a>
            <LangSwitch />
            <button className="ml-mobile-btn" aria-label="Open menu" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={"ml-mobile" + (mobileOpen ? " open" : "")}>
        {NAV.map((n) => (
          <a key={n.id} href={n.route ? n.route : n.page ? "#team" : "#" + n.id} onClick={(e) => { if (n.route) return; e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{n[lang]}</a>
        ))}
        <a href="/login" onClick={() => setMobileOpen(false)}>{t.memberLogin}</a>
        <div style={{ marginTop: 18 }}><LangSwitch /></div>
        <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
          {t.bookDemo} <ArrowRight />
        </a>
      </div>

      <main id="top">
        {page === "team" ? (
          <section className="ml-section" id="team" style={{ paddingTop: "148px" }}>
            <div className="ml-wrap">
              <span className="ml-eyebrow" data-reveal>{t.teamEyebrow}</span>
              <h1 className="ml-team-title" data-reveal>{t.teamTitle}</h1>
              <p className="ml-lead" data-reveal>{t.teamLead}</p>
              <div className="ml-tgrid" style={{ marginTop: "48px" }}>
                {TEACHERS[lang].map((tc, i) => (
                  <article className="ml-teacher" data-reveal style={{ transitionDelay: i * 0.08 + "s" }} key={i}>
                    <div className="ml-portrait">
                      <span className="ml-badge">{tc.teaches}</span>
                      {tc.photo ? <img className="ml-portrait-img" src={tc.photo} alt={tc.name} /> : <span className="ml-mono">{tc.name[0]}</span>}
                    </div>
                    <div className="ml-teacher-body">
                      <h3>{tc.name}</h3>
                      <div className="ml-teacher-meta">{tc.meta}</div>
                      <p className="ml-teacher-phil">{tc.phil}</p>
                      <p className="ml-teacher-spec">{tc.spec}</p>
                      <a className="ml-teacher-cta" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>
                        {t.bookWith} {tc.name.split(" ")[0]} <ArrowUpRight />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              <div className="ml-team-cta" data-reveal>
                <p>{t.readyToMeet}</p>
                <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>{t.bookDemo} <ArrowRight /></a>
              </div>
              <div className="ml-apply" data-reveal>
                <div>
                  <h3>{t.applyTitle}</h3>
                  <p>{t.applyBody}</p>
                </div>
                <a className="ml-btn ml-btn--primary" href="mailto:mundolingu@gmail.com?subject=Teaching application - MundoLingu">{t.applyBtn} <ArrowRight /></a>
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
                    {lang === "es" ? "Desbloquea" : "Unlock"} <span key={lang + learn + wi} className="ml-rotator ml-rotator--anim">{word}</span>.
                  </h1>
                  <p className="ml-lead">{hero.sub}</p>

                  <div className="ml-hero-ctas">
                    <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>{t.bookDemo} <ArrowRight /></a>
                    <a className="ml-btn ml-btn--ghost" href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>{t.exploreMembership} <ArrowRight /></a>
                  </div>

                  <div className="ml-learn" style={{ marginTop: 34 }}>
                    <span className="ml-learn-label">{t.iWantToLearn}</span>
                    <div className="ml-learn-seg" role="group" aria-label="Choose a language to learn">
                      <button className={learn === "english" ? "is-active" : ""} aria-pressed={learn === "english"} onClick={() => setLearn("english")}>{t.learnEnglish}</button>
                      <button className={learn === "spanish" ? "is-active" : ""} aria-pressed={learn === "spanish"} onClick={() => setLearn("spanish")}>{t.learnSpanish}</button>
                    </div>
                  </div>

                  <div className="ml-hero-foot"><span className="ml-dotpulse" /> {t.heroFoot}</div>
                </div>

                <div className="ml-visual" aria-hidden="true">
                  <div className="ml-visual-top">
                    <span className="ml-live"><b />{t.liveLesson}</span>
                    <span>{learn === "english" ? (lang === "es" ? "Inglés" : "English") : "Español"} · A1 → C1</span>
                  </div>
                  <div className="ml-greet"><span key={learn}>{hero.greet}</span></div>
                  <div className="ml-visual-bottom">
                    <div className="ml-horizon ml-horizon--draw" />
                    <div className="ml-progress-label"><span>{t.confidence}</span><span>80%</span></div>
                    <div className="ml-progress"><i /></div>
                  </div>
                </div>
              </div>
            </section>

            {/* SOCIAL PROOF */}
            <section className="ml-proof">
              <div className="ml-wrap">
                <div className="ml-stats" data-reveal>
                  {STATS[lang].map((s) => (<div className="ml-stat" key={s.s}><b>{s.b}</b><span>{s.s}</span></div>))}
                </div>
              </div>
              <div className="ml-marquee">
                <div className="ml-mtrack">
                  {[...TAGS[lang], ...TAGS[lang]].map((tag, i) => (<span className="ml-tag" key={i}>{tag}”</span>))}
                </div>
              </div>
            </section>

            {/* WHY */}
            <section className="ml-section" id="why">
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.whyEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.whyTitle}</h2>
                <div className="ml-why">
                  {WHY[lang].map((w, i) => (
                    <div className="ml-card" data-reveal style={{ transitionDelay: i * 0.08 + "s" }} key={w.n}>
                      <span className="ml-card-n">{w.n}</span><h3>{w.h}</h3><p>{w.p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* VISION */}
            <section className="ml-section ml-section--dark" id="vision">
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.visionEyebrow}</span>
                <h2 className="ml-vision-head" data-reveal>{lang === "es" ? (<>Una educación que empieza por la <em>persona</em>, no por el idioma.</>) : (<>An education that begins with the <em>person</em> — not the language.</>)}</h2>
                <p className="ml-vision-body" data-reveal>{t.visionBody}</p>
                <div className="ml-diff">
                  {t.diff.map((d, i) => (
                    <div className="ml-diff-item" data-reveal style={{ transitionDelay: i * 0.06 + "s" }} key={i}>
                      <span className="ml-diff-n">{String(i + 1).padStart(2, "0")}</span><h4>{d.h}</h4><p>{d.p}</p>
                    </div>
                  ))}
                </div>
                <div className="ml-founder" data-reveal>
                  <p className="ml-founder-q">{t.founderQuote}</p>
                  <div className="ml-founder-by"><span className="line" /> {t.founderBy}</div>
                </div>
              </div>
            </section>

            {/* METHOD */}
            <section className="ml-section" id="method">
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.methodEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.methodTitle}</h2>
                <div className="ml-time">
                  {STEPS[lang].map((s, i) => (
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
                <span className="ml-eyebrow" data-reveal>{t.storiesEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.storiesTitle}</h2>
                <div className="ml-stories">
                  {STORIES[lang].map((s, i) => (
                    <div className="ml-story" data-reveal style={{ transitionDelay: i * 0.08 + "s" }} key={s.by}>
                      <div className="qm">“</div><blockquote>{s.q}</blockquote>
                      <div className="ml-story-by"><b>{s.by}</b> · {s.ctx}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* MEMBERSHIP */}
            <section className="ml-section ml-section--tight" id="membership" style={{ background: "var(--paper-2)" }}>
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.membEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.membTitle}</h2>
                <p className="ml-lead" data-reveal>{t.membLead}</p>
                <div className="ml-memb-grid">
                  <div className="ml-benefits" data-reveal>
                    {BENEFITS[lang].map((b) => (<div className="ml-benefit" key={b}><Check /> {b}</div>))}
                  </div>
                  <div className="ml-price-card" data-reveal>
                    <div className="rel">
                      <div className="ml-plan-tag" style={{ color: "var(--cyan)" }}>{t.membTag}</div>
                      <div className="ml-price-tag" style={{ marginTop: 14 }}>$10 <small>{t.firstMonth}</small></div>
                      <div className="ml-price-sub">{t.membSub}</div>
                      <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>{t.joinMembership} <ArrowRight /></a>
                      <div className="ml-price-note">{t.tryFirst}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PRICING */}
            <section className="ml-section" id="pricing">
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.pricingEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.pricingTitle}</h2>
                <div className="ml-plans">
                  <div className="ml-plan" data-reveal>
                    <span className="ml-plan-tag">{t.membTag}</span>
                    <h3>{t.planCommunity}</h3>
                    <p className="for">{t.planCommunityFor}</p>
                    <div className="ml-plan-price">$10 <small>{t.planCommunityPrice}</small></div>
                    <ul>{t.planCommunityList.map((li) => (<li key={li}><Check /> {li}</li>))}</ul>
                    <a className="ml-btn ml-btn--ghost" href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>{t.joinMembership} <ArrowRight /></a>
                  </div>
                  <div className="ml-plan ml-plan--feature" data-reveal style={{ transitionDelay: "0.08s" }}>
                    <span className="ml-plan-tag">{t.planPrivateTag}</span>
                    <h3>{t.planPrivate}</h3>
                    <p className="for">{t.planPrivateFor}</p>
                    <div className="ml-plan-price">{t.planPrivatePrice} <small>{t.planPrivatePriceSub}</small></div>
                    <ul>{t.planPrivateList.map((li) => (<li key={li}><Check /> {li}</li>))}</ul>
                    <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>{t.bookDemo} <ArrowRight /></a>
                  </div>
                </div>
                <p className="ml-plans-foot">{t.pricingFoot}</p>
              </div>
            </section>

            {/* FAQ */}
            <section className="ml-section ml-section--tight" id="faq" style={{ background: "var(--paper-2)" }}>
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.faqEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.faqTitle}</h2>
                <div className="ml-faq">
                  {FAQ[lang].map((f, i) => (
                    <div className={"ml-faq-item" + (faq === i ? " open" : "")} key={i}>
                      <button className="ml-faq-q" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}>{f.q} <span className="ml-faq-ic" /></button>
                      <div className="ml-faq-a"><p>{f.a}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* INSTAGRAM */}
            <section className="ml-section ml-section--tight" id="instagram" style={{ background: "var(--paper-2)" }}>
              <div className="ml-wrap ml-ig">
                <div>
                  <span className="ml-eyebrow" data-reveal>@mundolingu</span>
                  <h2 className="ml-h2" data-reveal>{t.igTitle}</h2>
                  <p className="ml-lead" data-reveal>{t.igLead}</p>
                  <a className="ml-btn ml-btn--primary" href="https://instagram.com/mundolingu" target="_blank" rel="noreferrer" data-reveal style={{ marginTop: "28px" }}>{t.igBtn} <ArrowRight /></a>
                </div>
                {INSTAGRAM_EMBED_URL ? (
                  <div className="ml-ig-embed" data-reveal>
                    <iframe src={INSTAGRAM_EMBED_URL} title="Instagram feed" />
                  </div>
                ) : (
                  <div className="ml-ig-tiles" data-reveal><span /><span /><span /><span /></div>
                )}
              </div>
            </section>

            {/* FINAL CTA */}
            <section className="ml-section ml-section--mid ml-final" id="demo">
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal style={{ justifyContent: "center", display: "flex" }}>{t.finalEyebrow}</span>
                <h2 data-reveal>{t.finalTitle}</h2>
                <p className="ml-lead" data-reveal>{t.finalLead}</p>
                <DemoForm lang={lang} />
                <p className="ml-demo-alt" data-reveal>{t.demoAlt} <a href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>{t.exploreMembership}</a></p>
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
              <p className="ml-foot-tag">{t.footTag}</p>
            </div>
            <div className="ml-foot-col">
              <h5>{t.explore}</h5>
              {NAV.map((n) => (<a key={n.id} href={n.route ? n.route : n.page ? "#team" : "#" + n.id} onClick={(e) => { if (n.route) return; e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{n[lang]}</a>))}
            </div>
            <div className="ml-foot-col">
              <h5>{t.contact}</h5>
              <a href="https://wa.me/971504296090" target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
              <a href="https://instagram.com/mundolingu" target="_blank" rel="noreferrer"><Instagram /> @mundolingu</a>
              <a href="mailto:mundolingu@gmail.com"><Mail /> mundolingu@gmail.com</a>
            </div>
          </div>
          <div className="ml-foot-bar"><span>{t.footBar}</span></div>
        </div>
      </footer>

      {WHATSAPP_NUMBER && (
        <a className="wa-fab" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi MundoLingu! I'd like to know more about lessons.")}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.2 4.9 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4 15 3.5 13.5 3.5 12 3.5 7.3 7.3 3.5 12 3.5S20.5 7.3 20.5 12 16.7 20 12 20z" />
            <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.3-.6-2.2-1.2-3.1-2.6-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.1-.3.2-.5v-.5c-.1-.1-.7-1.6-.9-2.2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2.1-.5 3.3.7 1.7 1.9 3.1 3.5 4.1 1.6 1 2.9 1.1 3.4 1 .5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z" />
          </svg>
        </a>
      )}
    </div>
  );
}
