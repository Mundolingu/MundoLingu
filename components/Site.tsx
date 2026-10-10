"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, Check, Instagram, Mail, MessageCircle, Menu, X, Globe } from "lucide-react";
import DemoForm from "@/components/DemoForm";
import { AR } from "@/components/site-ar";

// Add your full WhatsApp number (country code, no +, spaces or dashes), e.g. "5215512345678".
const WHATSAPP_NUMBER = "971504296090";

// Show your latest Instagram posts: get a widget URL (see guide) and set NEXT_PUBLIC_IG_EMBED in Netlify.
const INSTAGRAM_EMBED_URL = process.env.NEXT_PUBLIC_IG_EMBED || "";

type Lang = "en" | "es" | "ar";

const NAV: { id: string; en: string; es: string; page?: boolean; route?: string }[] = [
  { id: "exams", en: "Exam prep", es: "Exámenes" },
  { id: "method", en: "Method", es: "Método" },
  { id: "team", en: "Our Team", es: "Equipo", page: true },
  { id: "membership", en: "Conversation Club", es: "Club de conversación" },
  { id: "pricing", en: "Pricing", es: "Precios" },
  { id: "faq", en: "FAQ", es: "Preguntas" },
  { id: "level-test", en: "Level test", es: "Test de nivel", route: "/level-test" },
  { id: "ielts-band-check", en: "IELTS check", es: "Test IELTS", route: "/ielts-band-check" },
  { id: "blog", en: "Blog", es: "Blog", route: "/blog" },
];

type Learn = "exams" | "english" | "spanish";

const EXAM_CHIPS = ["IELTS", "PTE", "TOEFL"];

const wa = (msg: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

// Exam-prep 1-to-1 packages. No prices on the site: prices are shared after the free demo.
const PACKAGES = {
  en: [
    { name: "Exam Starter", lessons: "10", tag: "Sharpen your skills", best: false,
      for: "You’re close to your target, or your test date is coming up soon.",
      perks: ["10 private 1-to-1 lessons", "Level check and a personal study plan", "Laser focus on your weakest skill"] },
    { name: "Exam Booster", lessons: "20", tag: "Most popular", best: true,
      for: "You want a real score jump and to walk into the exam calm and confident.",
      perks: ["20 private 1-to-1 lessons", "Everything in Exam Starter", "All four skills, step by step", "Regular progress checks against your target"] },
    { name: "Exam Result", lessons: "30", tag: "For big goals", best: false,
      for: "You need a high score like band 7+, or you’re starting further away.",
      perks: ["30 private 1-to-1 lessons", "Everything in Exam Booster", "Complete preparation, from foundations to test day", "The most practice and feedback before your exam"] },
  ],
  es: [
    { name: "Exam Starter", lessons: "10", tag: "Afina tus habilidades", best: false,
      for: "Estás cerca de tu nota objetivo o tu examen se acerca.",
      perks: ["10 clases privadas 1 a 1", "Prueba de nivel y plan de estudio personal", "Enfoque total en tu habilidad más débil"] },
    { name: "Exam Booster", lessons: "20", tag: "El más popular", best: true,
      for: "Quieres subir tu nota de verdad y llegar al examen tranquilo y seguro.",
      perks: ["20 clases privadas 1 a 1", "Todo lo de Exam Starter", "Las cuatro habilidades, paso a paso", "Revisiones de progreso frente a tu objetivo"] },
    { name: "Exam Result", lessons: "30", tag: "Para metas grandes", best: false,
      for: "Necesitas una nota alta, como band 7+, o empiezas desde más lejos.",
      perks: ["30 clases privadas 1 a 1", "Todo lo de Exam Booster", "Preparación completa, de las bases al día del examen", "La mayor práctica y feedback antes de tu examen"] },
  ],
  ar: AR.PACKAGES,
};

// "Us vs a typical course" comparison
const COMPARE = {
  en: [
    ["Class size", "15–20 students in one room", "Just you and your teacher"],
    ["Lessons", "The same syllabus for everyone", "Built around your weak spots and target score"],
    ["Help between lessons", "Only during class hours", "24/7 WhatsApp support"],
    ["Homework", "One worksheet for the whole class", "Extra homework whenever you ask"],
    ["Speaking practice", "A few minutes per lesson", "Free group classes + a weekly live exam class"],
    ["Schedule", "Fixed times you work around", "Lessons that fit around your life"],
  ],
  es: [
    ["Tamaño de clase", "15–20 alumnos en un aula", "Solo tú y tu profe"],
    ["Clases", "El mismo temario para todos", "Diseñadas según tus puntos débiles y tu nota objetivo"],
    ["Ayuda entre clases", "Solo en horario de clase", "Soporte por WhatsApp 24/7"],
    ["Tareas", "Una hoja para toda la clase", "Tareas extra siempre que las pidas"],
    ["Práctica oral", "Unos minutos por clase", "Clases grupales gratis + clase de examen en vivo semanal"],
    ["Horario", "Horas fijas a las que te adaptas", "Clases que se adaptan a tu vida"],
  ],
  ar: AR.COMPARE,
};

const HERO = {
  en: {
    exams: { eyebrow: "IELTS · PTE · TOEFL preparation", line1: "Pass your exam.", greet: "band 7+",
      sub: "1-to-1 exam preparation with experienced native teachers — a study plan built around you, a weekly live exam class, and real results. Not just a number in a classroom.",
      words: ["your visa", "a university place", "a global career", "your dream score", "a new country"] },
    english: { eyebrow: "English for international learners", line1: "Learn English.", greet: "hello.",
      sub: "The distance between where you are and where you want to be is a language. Personalised online English, built around your goals — not a generic classroom.",
      words: ["a promotion", "a new country", "a bigger salary", "real confidence", "a global career"] },
    spanish: { eyebrow: "Spanish for internationals", line1: "Learn Spanish.", greet: "hola.",
      sub: "Living, working, or moving somewhere new? Personalised online Spanish that helps you belong — not just translate.",
      words: ["a new home", "real connection", "an easier move", "a second culture", "a life abroad"] },
  },
  es: {
    exams: { eyebrow: "Preparación IELTS · PTE · TOEFL", line1: "Aprueba tu examen.", greet: "band 7+",
      sub: "Preparación de exámenes 1 a 1 con profes nativos con experiencia: un plan de estudio hecho para ti, una clase de examen en vivo cada semana y resultados reales. No eres solo un número en un aula.",
      words: ["tu visa", "una plaza universitaria", "una carrera global", "la nota que sueñas", "un nuevo país"] },
    english: { eyebrow: "Inglés para estudiantes internacionales", line1: "Aprende inglés.", greet: "hello.",
      sub: "La distancia entre donde estás y donde quieres llegar es un idioma. Inglés online personalizado, diseñado en torno a tus metas, no una clase genérica.",
      words: ["un ascenso", "un nuevo país", "un mejor salario", "confianza real", "una carrera global"] },
    spanish: { eyebrow: "Español para internacionales", line1: "Aprende español.", greet: "hola.",
      sub: "¿Vives, trabajas o te mudas a un lugar nuevo? Español online personalizado que te ayuda a pertenecer, no solo a traducir.",
      words: ["un nuevo hogar", "conexión real", "una mudanza más fácil", "una segunda cultura", "una vida en el extranjero"] },
  },
  ar: AR.HERO,
};

const STATS = {
  en: [ { b: "1,200+", s: "lessons taught" }, { b: "4.9★", s: "average rating" }, { b: "12", s: "countries reached" }, { b: "UAE · Gulf · EU", s: "and worldwide online" } ],
  es: [ { b: "1.200+", s: "clases impartidas" }, { b: "4.9★", s: "valoración media" }, { b: "12", s: "países alcanzados" }, { b: "EAU · Golfo · UE", s: "y en todo el mundo online" } ],
  ar: AR.STATS,
};

const TAGS = {
  en: ["Passed my B2 interview", "Moved to Canada", "Now working in Spanish in CDMX", "Promoted to team lead", "Ordered dinner in Madrid — no English", "Closed my first client abroad", "Relocated to Dubai", "Stopped translating in my head", "Nailed my visa interview"],
  es: ["Aprobé mi entrevista B2", "Me mudé a Canadá", "Ahora trabajo en español en CDMX", "Ascendido a líder de equipo", "Pedí la cena en Madrid, sin inglés", "Cerré mi primer cliente en el extranjero", "Me mudé a Dubái", "Dejé de traducir en mi cabeza", "Aprobé mi entrevista de visa"],
  ar: AR.TAGS,
};

const WHY = {
  en: [
    { n: "01", h: "A door to the opportunity you want", p: "The IELTS band, the visa, the university place, the promotion, the move abroad — a language is what gets you into the room." },
    { n: "02", h: "The confidence to actually speak", p: "We teach you to be understood, not to be perfect. You'll be speaking from your very first lesson." },
    { n: "03", h: "A plan shaped around your life", p: "Your goals, your schedule, your pace — in English or Spanish. Never a one-size-fits-all class." },
  ],
  es: [
    { n: "01", h: "Una puerta a la oportunidad que quieres", p: "La nota del IELTS, la visa, la plaza universitaria, el ascenso, la mudanza: un idioma es lo que te abre la puerta." },
    { n: "02", h: "La confianza para hablar de verdad", p: "Te enseñamos a que te entiendan, no a ser perfecto. Hablarás desde tu primera clase." },
    { n: "03", h: "Un plan a la medida de tu vida", p: "Tus metas, tu horario, tu ritmo, en inglés o español. Nunca una clase igual para todos." },
  ],
  ar: AR.WHY,
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
  ar: AR.STEPS,
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
  ar: AR.STORIES,
};

const BENEFITS = {
  en: ["Exclusive workbooks", "Weekly study plans", "Guided learning roadmaps", "Speaking practice sessions", "Grammar lessons", "Vocabulary packs", "Member-only video lessons", "Weekly challenges", "Accountability check-ins", "A community moving with you", "Live group sessions", "Discounts on private lessons"],
  es: ["Cuadernos exclusivos", "Planes de estudio semanales", "Hojas de ruta guiadas", "Sesiones de práctica oral", "Clases de gramática", "Packs de vocabulario", "Videoclases solo para miembros", "Retos semanales", "Seguimiento y motivación", "Una comunidad que avanza contigo", "Sesiones grupales en vivo", "Descuentos en clases privadas"],
  ar: AR.BENEFITS,
};

const FAQ = {
  en: [
    { q: "Which exams do you prepare students for?", a: "IELTS (Academic and General Training), PTE Academic and TOEFL iBT. Every student gets 1-to-1 lessons with an experienced native teacher, a personal study plan, and a weekly live exam class. Our Head of Exams is a licensed IELTS teacher with 14+ years of experience." },
    { q: "Is the Conversation Club included with exam prep?", a: "Yes. Every exam-prep package includes free access to our Conversation / Exam Talk Prep Club, so you practise speaking every week alongside your private lessons." },
    { q: "Do you teach both English and Spanish?", a: "Yes. English for Spanish speakers, and Spanish for English speakers, professionals and expats — including across Europe and Dubai. Same personalised method, either direction." },
    { q: "Can complete beginners join?", a: "Absolutely. We start exactly where you are and build from your very first lesson. Many of our students began from zero." },
    { q: "Do I need to speak well already for the demo?", a: "Not at all. The demo is a relaxed 15-minute chat to find your level and your goals. There's zero pressure and nothing to prepare." },
    { q: "How does the membership work?", a: "Monthly access to resources, live group speaking sessions, weekly plans and community. It's $10 for the first month, then $15 after — cancel anytime." },
    { q: "How do I choose or change my teacher?", a: "We match you with the right teacher after your demo. If you'd like a different fit later, you can switch anytime — no awkwardness." },
    { q: "Where are your students based?", a: "Mostly across the UAE and the Gulf and Europe, with students worldwide. Everything is online and scheduled around your time zone." },
  ],
  es: [
    { q: "¿Para qué exámenes preparan?", a: "IELTS (Academic y General Training), PTE Academic y TOEFL iBT. Cada estudiante recibe clases 1 a 1 con un profe nativo con experiencia, un plan de estudio personal y una clase de examen en vivo cada semana. Nuestro Jefe de Exámenes es profesor de IELTS con licencia y más de 14 años de experiencia." },
    { q: "¿El Club de conversación está incluido con la preparación de exámenes?", a: "Sí. Cada paquete de preparación de exámenes incluye acceso gratis a nuestro Conversation / Exam Talk Prep Club, para que practiques la conversación cada semana además de tus clases privadas." },
    { q: "¿Enseñan inglés y español?", a: "Sí. Inglés para hispanohablantes, y español para angloparlantes, profesionales y expatriados, incluso en Europa y Dubái. El mismo método personalizado, en cualquier dirección." },
    { q: "¿Pueden unirse principiantes totales?", a: "Por supuesto. Empezamos justo donde estás y construimos desde tu primera clase. Muchos de nuestros estudiantes empezaron desde cero." },
    { q: "¿Necesito hablar bien para la clase de prueba?", a: "Para nada. La prueba es una charla relajada de 15 minutos para conocer tu nivel y tus metas. Sin presión y sin nada que preparar." },
    { q: "¿Cómo funciona la membresía?", a: "Acceso mensual a recursos, sesiones grupales de conversación en vivo, planes semanales y comunidad. Son $10 el primer mes, luego $15, y cancelas cuando quieras." },
    { q: "¿Cómo elijo o cambio de profe?", a: "Te asignamos al profe indicado después de tu prueba. Si más adelante prefieres otro, puedes cambiar cuando quieras, sin problema." },
    { q: "¿De dónde son tus estudiantes?", a: "Sobre todo de los Emiratos, el Golfo y Europa, con estudiantes en todo el mundo. Todo es online y se adapta a tu zona horaria." },
  ],
  ar: AR.FAQ,
};

const EXAMS = {
  en: [
    { name: "IELTS", full: "Academic & General Training", badge: "Most accepted", color: "var(--teal)", for: "For university, work and visas in the UK, Australia, Canada and beyond.",
      points: ["All four skills: listening, reading, writing, speaking", "Writing Task 1 & 2 marked with clear feedback", "Speaking mock tests in real exam format"] },
    { name: "PTE", full: "PTE Academic", badge: "Fastest results", color: "var(--orange)", for: "The fast, computer-based test — accepted for UK, Australian and New Zealand visas, and by ÖSYM in Turkey.",
      points: ["Strategies for every computer-scored task", "Pronunciation and oral fluency training", "Timed practice under real exam conditions"] },
    { name: "TOEFL", full: "TOEFL iBT", badge: "For US universities", color: "var(--cyan)", for: "The academic test for universities in the US and worldwide.",
      points: ["Integrated speaking and writing tasks", "Academic vocabulary and note-taking", "Full practice tests with score feedback"] },
  ],
  es: [
    { name: "IELTS", full: "Academic y General Training", badge: "El más aceptado", color: "var(--teal)", for: "Para universidad, trabajo y visas en Reino Unido, Australia, Canadá y más.",
      points: ["Las cuatro habilidades: listening, reading, writing, speaking", "Writing Task 1 y 2 corregidos con feedback claro", "Simulacros de speaking en formato real"] },
    { name: "PTE", full: "PTE Academic", badge: "Resultados más rápidos", color: "var(--orange)", for: "El examen rápido por computadora: aceptado para visas de Reino Unido, Australia y Nueva Zelanda, y por ÖSYM en Turquía.",
      points: ["Estrategias para cada tarea calificada por computadora", "Entrenamiento de pronunciación y fluidez", "Práctica cronometrada en condiciones reales"] },
    { name: "TOEFL", full: "TOEFL iBT", badge: "Para universidades de EE. UU.", color: "var(--cyan)", for: "El examen académico para universidades en EE. UU. y en todo el mundo.",
      points: ["Tareas integradas de speaking y writing", "Vocabulario académico y toma de notas", "Exámenes de práctica completos con feedback"] },
  ],
  ar: AR.EXAMS,
};

const TEACHERS: { [k in Lang]: { name: string; teaches: string; meta: string; phil: string; spec: string; photo?: string }[] } = {
  en: [
    { name: "Jurgen Knechten", teaches: "Founder", meta: "8 years in private schools · Istanbul · Dubai · Prague", phil: "“I'd rather build real progress that sticks for life than the kind that fades.”", spec: "Founder of MundoLingu. Eight years teaching English in private schools around the world, and five years teaching online — genuinely invested in every student and the progress they make.", photo: "/team-jurgen.jpg" },
    { name: "Nico Furno", teaches: "Head of Exams", meta: "14+ years · South Africa · UAE", phil: "Exam preparation built on 14 years of IELTS teaching.", spec: "Head of Exams at MundoLingu. A licensed IELTS teacher from South Africa with over 14 years of experience, including 8 years teaching across different schools in the UAE.", photo: "/team-nico.jpg" },
    { name: "Dania", teaches: "English & Spanish", meta: "12+ years · United States · Istanbul", phil: "“Real-life goals, real energy — every single lesson.”", spec: "English and Spanish teacher with over 12 years' experience across the world, including the United States and Istanbul. She teaches around real-life targets and brings the best energy to every lesson.", photo: "/team-dania.jpg" },
    { name: "Samantha", teaches: "English & Spanish", meta: "CEO · Emirates cabin crew", phil: "“I teach people to create their own opportunities — because I've lived it.”", spec: "Emirates cabin crew and CEO at MundoLingu. Alongside seeing the world, she teaches English and Spanish online — showing people how to create opportunities to better their lives, from real experience gained across the globe.", photo: "/team-samantha.jpg" },
    { name: "Paty", teaches: "English & Spanish", meta: "Emirates cabin crew · Qualified in Mexico", phil: "“A clear structure that gets you speaking, fast.”", spec: "Emirates cabin crew who qualified as an English language teacher in Mexico. She teaches English and Spanish online and speaks from real experience travelling the world, with a clear, structured method that makes progress fast.", photo: "/team-paty.jpg" },
  ],
  es: [
    { name: "Jurgen Knechten", teaches: "Fundador", meta: "8 años en escuelas privadas · Estambul · Dubái · Praga", phil: "“Prefiero construir progreso real que dura toda la vida, no del que se desvanece.”", spec: "Fundador de MundoLingu. Ocho años enseñando inglés en escuelas privadas por todo el mundo, y cinco años enseñando online, comprometido de verdad con cada estudiante y su progreso.", photo: "/team-jurgen.jpg" },
    { name: "Nico Furno", teaches: "Jefe de Exámenes", meta: "14+ años · Sudáfrica · EAU", phil: "Preparación de exámenes basada en 14 años enseñando IELTS.", spec: "Jefe de Exámenes en MundoLingu. Profesor de IELTS con licencia, originario de Sudáfrica, con más de 14 años de experiencia, incluidos 8 años enseñando en distintas escuelas de los Emiratos Árabes Unidos.", photo: "/team-nico.jpg" },
    { name: "Dania", teaches: "Inglés y español", meta: "12+ años · Estados Unidos · Estambul", phil: "“Metas de la vida real, energía real, en cada clase.”", spec: "Profesora de inglés y español con más de 12 años de experiencia por el mundo, incluidos Estados Unidos y Estambul. Enseña en torno a metas reales y trae la mejor energía a cada clase.", photo: "/team-dania.jpg" },
    { name: "Samantha", teaches: "Inglés y español", meta: "CEO · tripulante de Emirates", phil: "“Enseño a la gente a crear sus propias oportunidades, porque yo lo he vivido.”", spec: "Tripulante de cabina de Emirates y CEO en MundoLingu. Además de recorrer el mundo, enseña inglés y español online, mostrando a las personas cómo crear oportunidades para mejorar su vida, desde la experiencia real ganada por todo el planeta.", photo: "/team-samantha.jpg" },
    { name: "Paty", teaches: "Inglés y español", meta: "Tripulante de Emirates · Titulada en México", phil: "“Una estructura clara que te hace hablar, rápido.”", spec: "Tripulante de cabina de Emirates, titulada como profesora de inglés en México. Enseña inglés y español online y habla desde la experiencia real de viajar por el mundo, con un método claro y estructurado que hace avanzar rápido.", photo: "/team-paty.jpg" },
  ],
  ar: AR.TEACHERS,
};

const UI = {
  en: {
    login: "Log in", memberLogin: "Member login", bookDemo: "Book a free demo", exploreMembership: "Explore the Conversation Club",
    iWantToLearn: "I want", learnExams: "Exam prep", learnEnglish: "English", learnSpanish: "Spanish", unlock: "Unlock",
    bookExamDemo: "Book a free exam demo", joinClub: "Join the Conversation Club", askWa: "Or ask us anything on WhatsApp", waHi: "Hi MundoLingu! I'm interested in IELTS / PTE / TOEFL preparation.",
    trust: ["Licensed IELTS Head of Exams", "Native, experienced teachers", "Free 15-min demo, no commitment"],
    pkgEyebrow: "1-to-1 exam packages", pkgTitle: "Choose how far you want to go.", pkgNote: "Three packages, one goal: your score. Book a free demo and your teacher will recommend the right one for you.", lessonsWord: "lessons", limited: "Limited 1-to-1 spots each month. Book your free demo to reserve yours.", pickPkg: "Start with a free demo",
    mtTitle: "Free IELTS mini-test", mtBody: "Not sure where you are? Get our free IELTS mini-test on WhatsApp, send back your answers, and our Head of Exams will tell you your estimated band — free.", mtBtn: "Get the free mini-test", mtMsg: "Hi MundoLingu! I'd like the free IELTS mini-test.",
    barDemo: "Free exam demo", examsVisual: "IELTS · PTE · TOEFL", targetScore: "Target score",
    heroFoot: "Free 15-minute demo · meet a teacher · zero pressure", liveLesson: "Live lesson", confidence: "Confidence",
    whyEyebrow: "Why MundoLingu", whyTitle: "We don't sell lessons. We open doors.",
    visionEyebrow: "Our vision", visionBody: "Most language schools hand everyone the same syllabus and hope they keep up. We were built on the opposite conviction: that a language is deeply personal — bound up with the job you're chasing, the country you're moving to, the person you're becoming. So we start with you, and shape everything around where you're going.",
    diff: [ { h: "A plan built for one", p: "No fixed curriculum. Your goal, your level, and your life shape every lesson from the very first day." }, { h: "Confidence before perfection", p: "You'll speak from session one. We teach you to be understood and unafraid — fluency follows courage, not grammar drills." }, { h: "Teachers who've crossed the same borders", p: "Native English and Spanish teachers who've built lives in a new language — so you learn the language you'll actually live in." }, { h: "A community, not a classroom", p: "Real support between lessons, and people moving toward the same kind of life. You're never just a name on a register." } ],
    founderQuote: "“Whether your next step is a promotion, a move abroad, or simply the courage to speak — we'll build the path with you.”", founderBy: "Jurgen · Founder, MundoLingu",
    methodEyebrow: "How it works", methodTitle: "A journey, not a course.",
    storiesEyebrow: "Student stories", storiesTitle: "Real people. Real change.",
    membEyebrow: "The Conversation Club", membTitle: "Speak every week. Build real confidence.", membLead: "Our English and Spanish Conversation Clubs: a weekly live class, monthly workbooks and feedback from a professional teacher. All levels welcome — and free with every exam-prep package.",
    membTag: "Conversation Club", firstMonth: "first month", membSub: "then $15 / month · cancel anytime · English or Spanish", joinMembership: "Join the Conversation Club", clubFree: "Free with every IELTS, PTE & TOEFL package", tryFirst: "Prefer to try first? Start with a free demo lesson.",
    pricingEyebrow: "Pricing", pricingTitle: "Choose the path that fits your goal.",
    planCommunity: "Speak every week", planCommunityFor: "For anyone who wants regular speaking practice, structure and momentum.", planCommunityPrice: "first month, then $15/mo",
    planCommunityList: ["A weekly live conversation class", "Monthly workbooks & resources", "Feedback from a professional teacher", "All levels welcome", "English or Spanish"],
    planExamTag: "Exam prep 1-to-1", planExam: "Pass IELTS, PTE or TOEFL", planExamFor: "For students who need a target score for study, work or a visa.", planExamPrice: "3 packages", planExamPriceSub: "10, 20 or 30 lessons",
    planExamList: ["Your own experienced native teacher", "A personal study plan for your target score", "Extra homework whenever you ask", "24/7 WhatsApp support", "Free group classes + weekly live exam class"],
    planPrivateTag: "Private 1-to-1", planPrivate: "Learn with your own teacher", planPrivateFor: "For the fastest, most personal progress toward a specific goal.", planPrivatePrice: "Personalised", planPrivatePriceSub: "priced to your plan",
    planPrivateList: ["Your own dedicated teacher", "A plan built for your goal or exam", "Flexible scheduling around your life", "The fastest route to fluency", "English or Spanish"],
    pricingFoot: "Every path starts with a free 15-minute demo lesson.",
    examsEyebrow: "Exam preparation", examsTitle: "IELTS, PTE & TOEFL — prepared properly.", examsLead: "Whether you need a score for university, a visa or your career, you get your own teacher and a plan built around you. Led by our Head of Exams, a licensed IELTS teacher with 14+ years of experience across South Africa and the UAE.",
    examsIncl: "Included in every package, at no extra cost", examsInclList: ["1-to-1 lessons with an experienced native teacher", "A personal study plan for your target score", "Free access to our group classes (Conversation / Exam Talk Prep Club)", "A weekly live exam class", "Extra homework whenever you ask for it", "24/7 WhatsApp support"],
    cmpEyebrow: "Why students choose us", cmpTitle: "You’re not just a number in a classroom.", cmpThem: "A typical exam course", cmpUs: "MundoLingu", cmpClose: "Every week you wait is one less week to prepare. Your free demo takes 15 minutes.",
    bandCheck: "Try our free IELTS band check", ieltsDubai: "IELTS preparation in Dubai",
    faqEyebrow: "Questions", faqTitle: "Everything you might be wondering.",
    igTitle: "Follow the journey.", igLead: "Daily tips, student wins, and behind-the-scenes with our teachers — come say hi on Instagram.", igBtn: "Follow on Instagram",
    finalEyebrow: "Book a free demo", finalTitle: "Your bigger life is one conversation away.", finalLead: "A free 15-minute demo. Meet a teacher, find your level, and leave with a plan — for IELTS, PTE, TOEFL, English or Spanish. No pressure, no commitment.", demoAlt: "Prefer to start on your own?",
    teamEyebrow: "The MundoLingu team", teamTitle: "The people behind your progress.", teamLead: "A small, dedicated team of teachers and mentors — each one here to help you speak with confidence, in English or Spanish.",
    bookWith: "Book a demo with", readyToMeet: "Ready to meet yours?", applyTitle: "Want to teach with us?", applyBody: "We're always looking for passionate English and Spanish teachers who care about real progress. Send your CV and a few words about yourself — if you're a great fit, we'll be in touch.", applyBtn: "Send your CV",
    footTag: "IELTS, PTE & TOEFL preparation, plus English & Spanish made personal. Online lessons that turn a language into an opportunity.", explore: "Explore", contact: "Contact", footBar: "© 2026 MundoLingu · Online — UAE · Gulf · Europe · Worldwide",
    terms: "Terms & Conditions", freeExamDemo: (x: string) => `Free ${x} demo`,
    visionHead: ["An education that begins with the ", "person", " — not the language."] as [string, string, string],
    englishLabel: "English", spanishLabel: "Español",
  },
  es: {
    login: "Entrar", memberLogin: "Acceso de miembros", bookDemo: "Reserva una clase gratis", exploreMembership: "Explora el Club de conversación",
    iWantToLearn: "Quiero", learnExams: "Exámenes", learnEnglish: "Inglés", learnSpanish: "Español", unlock: "Desbloquea",
    bookExamDemo: "Reserva una clase de examen gratis", joinClub: "Únete al Club de conversación", askWa: "O pregúntanos lo que quieras por WhatsApp", waHi: "¡Hola MundoLingu! Me interesa la preparación de IELTS / PTE / TOEFL.",
    trust: ["Jefe de Exámenes IELTS con licencia", "Profes nativos con experiencia", "Clase gratis de 15 min, sin compromiso"],
    pkgEyebrow: "Paquetes de examen 1 a 1", pkgTitle: "Elige hasta dónde quieres llegar.", pkgNote: "Tres paquetes, una meta: tu nota. Reserva una clase gratis y tu profe te recomendará el ideal para ti.", lessonsWord: "clases", limited: "Plazas 1 a 1 limitadas cada mes. Reserva tu clase gratis para asegurar la tuya.", pickPkg: "Empieza con una clase gratis",
    mtTitle: "Mini-test IELTS gratis", mtBody: "¿No sabes en qué nivel estás? Pide nuestro mini-test IELTS gratis por WhatsApp, envía tus respuestas y nuestro Jefe de Exámenes te dirá tu band estimado, gratis.", mtBtn: "Pide el mini-test gratis", mtMsg: "¡Hola MundoLingu! Quiero el mini-test IELTS gratis.",
    barDemo: "Clase de examen gratis", examsVisual: "IELTS · PTE · TOEFL", targetScore: "Nota objetivo",
    heroFoot: "Clase de prueba de 15 min · conoce a un profe · sin compromiso", liveLesson: "Clase en vivo", confidence: "Confianza",
    whyEyebrow: "Por qué MundoLingu", whyTitle: "No vendemos clases. Abrimos puertas.",
    visionEyebrow: "Nuestra visión", visionBody: "La mayoría de las escuelas dan a todos el mismo temario y esperan que sigan el ritmo. Nosotros nacimos con la convicción contraria: que un idioma es algo profundamente personal, ligado al trabajo que buscas, al país al que te mudas, a la persona en la que te conviertes. Por eso empezamos por ti y lo diseñamos todo en torno a hacia dónde vas.",
    diff: [ { h: "Un plan hecho para uno", p: "Sin temario fijo. Tu meta, tu nivel y tu vida dan forma a cada clase desde el primer día." }, { h: "Confianza antes que perfección", p: "Hablarás desde la primera sesión. Te enseñamos a que te entiendan y a perder el miedo: la fluidez viene del valor, no de repetir gramática." }, { h: "Profes que han cruzado las mismas fronteras", p: "Profesores nativos de inglés y español que han construido su vida en un nuevo idioma, para que aprendas el idioma que de verdad vas a vivir." }, { h: "Una comunidad, no un aula", p: "Apoyo real entre clases y gente que va hacia el mismo tipo de vida. Nunca eres solo un nombre en una lista." } ],
    founderQuote: "“Ya sea un ascenso, una mudanza al extranjero o simplemente el valor de hablar, construiremos el camino contigo.”", founderBy: "Jurgen · Fundador, MundoLingu",
    methodEyebrow: "Cómo funciona", methodTitle: "Un camino, no un curso.",
    storiesEyebrow: "Historias de estudiantes", storiesTitle: "Personas reales. Cambios reales.",
    membEyebrow: "El Club de conversación", membTitle: "Habla cada semana. Gana confianza real.", membLead: "Nuestros Clubs de conversación en inglés y en español: una clase en vivo cada semana, cuadernos mensuales y feedback de un profe profesional. Para todos los niveles, y gratis con cada paquete de preparación de exámenes.",
    membTag: "Club de conversación", firstMonth: "el primer mes", membSub: "luego $15/mes · cancela cuando quieras · inglés o español", joinMembership: "Únete al Club de conversación", clubFree: "Gratis con cada paquete de IELTS, PTE y TOEFL", tryFirst: "¿Prefieres probar primero? Empieza con una clase gratis.",
    pricingEyebrow: "Precios", pricingTitle: "Elige el camino que encaja con tu meta.",
    planCommunity: "Habla cada semana", planCommunityFor: "Para quien quiere práctica oral constante, estructura e impulso.", planCommunityPrice: "primer mes, luego $15/mes",
    planCommunityList: ["Una clase de conversación en vivo cada semana", "Cuadernos y recursos mensuales", "Feedback de un profe profesional", "Para todos los niveles", "Inglés o español"],
    planExamTag: "Exámenes 1 a 1", planExam: "Aprueba IELTS, PTE o TOEFL", planExamFor: "Para quien necesita una nota para estudiar, trabajar o una visa.", planExamPrice: "3 paquetes", planExamPriceSub: "10, 20 o 30 clases",
    planExamList: ["Tu propio profe nativo con experiencia", "Un plan de estudio para tu nota objetivo", "Tareas extra siempre que las pidas", "Soporte por WhatsApp 24/7", "Clases grupales gratis + clase de examen semanal"],
    planPrivateTag: "Privado 1 a 1", planPrivate: "Aprende con tu propio profe", planPrivateFor: "Para el progreso más rápido y personal hacia una meta concreta.", planPrivatePrice: "Personalizado", planPrivatePriceSub: "según tu plan",
    planPrivateList: ["Tu propio profe dedicado", "Un plan hecho para tu meta o examen", "Horarios flexibles a tu medida", "El camino más rápido a la fluidez", "Inglés o español"],
    pricingFoot: "Todo empieza con una clase de prueba gratis de 15 minutos.",
    examsEyebrow: "Preparación de exámenes", examsTitle: "IELTS, PTE y TOEFL, bien preparados.", examsLead: "Necesites una nota para la universidad, una visa o tu carrera, tendrás tu propio profe y un plan hecho para ti. Dirigido por nuestro Jefe de Exámenes, profesor de IELTS con licencia y más de 14 años de experiencia en Sudáfrica y los Emiratos.",
    examsIncl: "Incluido en cada paquete, sin costo extra", examsInclList: ["Clases 1 a 1 con un profe nativo con experiencia", "Un plan de estudio personal para tu nota objetivo", "Acceso gratis a nuestras clases grupales (Conversation / Exam Talk Prep Club)", "Una clase de examen en vivo cada semana", "Tareas extra siempre que las pidas", "Soporte por WhatsApp 24/7"],
    cmpEyebrow: "Por qué nos eligen", cmpTitle: "No eres solo un número en un aula.", cmpThem: "Un curso de examen típico", cmpUs: "MundoLingu", cmpClose: "Cada semana que esperas es una semana menos para prepararte. Tu clase gratis dura 15 minutos.",
    bandCheck: "Haz nuestro test IELTS gratis", ieltsDubai: "Preparación IELTS en Dubái",
    faqEyebrow: "Preguntas", faqTitle: "Todo lo que quizás te preguntas.",
    igTitle: "Sigue el camino.", igLead: "Consejos diarios, logros de estudiantes y el detrás de cámaras con nuestros profes. Ven a saludarnos en Instagram.", igBtn: "Síguenos en Instagram",
    finalEyebrow: "Reserva una clase gratis", finalTitle: "Tu vida más grande está a una conversación de distancia.", finalLead: "Una clase de prueba gratis de 15 minutos. Conoce a un profe, descubre tu nivel y sal con un plan: IELTS, PTE, TOEFL, inglés o español. Sin presión, sin compromiso.", demoAlt: "¿Prefieres empezar por tu cuenta?",
    teamEyebrow: "El equipo de MundoLingu", teamTitle: "Las personas detrás de tu progreso.", teamLead: "Un equipo pequeño y dedicado de profes y mentores, cada uno aquí para ayudarte a hablar con confianza, en inglés o español.",
    bookWith: "Reserva una clase con", readyToMeet: "¿Quieres conocer al tuyo?", applyTitle: "¿Quieres enseñar con nosotros?", applyBody: "Siempre buscamos profes apasionados de inglés y español a quienes les importe el progreso real. Envía tu CV y unas líneas sobre ti; si encajas, te contactamos.", applyBtn: "Envía tu CV",
    footTag: "Preparación IELTS, PTE y TOEFL, más inglés y español hechos personales. Clases online que convierten un idioma en una oportunidad.", explore: "Explora", contact: "Contacto", footBar: "© 2026 MundoLingu · Online — EAU · Golfo · Europa · Todo el mundo",
    terms: "Términos y Condiciones", freeExamDemo: (x: string) => `Clase de ${x} gratis`,
    visionHead: ["Una educación que empieza por la ", "persona", ", no por el idioma."] as [string, string, string],
    englishLabel: "Inglés", spanishLabel: "Español",
  },
  ar: AR.UI,
};

export default function Site() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [learn, setLearn] = useState<Learn>("exams");
  const [wi, setWi] = useState(0);
  const [faq, setFaq] = useState(0);
  const [page, setPage] = useState<"home" | "team">("home");
  const [interest, setInterest] = useState("IELTS");
  const rootRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ml-lang");
      const nl = (navigator.language || "").toLowerCase();
      if (saved === "es" || saved === "en" || saved === "ar") setLang(saved);
      else if (nl.startsWith("es")) setLang("es");
      else if (nl.startsWith("ar")) setLang("ar");
    } catch {}
  }, []);
  useEffect(() => {
    try { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; } catch {}
  }, [lang]);
  const navLabel = (n: { id: string; en: string; es: string }) => (lang === "ar" ? AR.NAV[n.id] || n.en : n[lang]);
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
  const bookExam = (exam: string) => { setInterest(exam); go("demo"); };
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
      <button className={lang === "ar" ? "on" : ""} onClick={() => switchLang("ar")} lang="ar">ع</button>
    </div>
  );

  return (
    <div className="ml-root" ref={rootRef} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      {/* NAV */}
      <nav className={"ml-nav" + (scrolled ? " scrolled" : "")}>
        <div className="ml-nav-in">
          <a href="#top" className="ml-lockup" onClick={(e) => { e.preventDefault(); go("top"); }} aria-label="MundoLingu — home">
            <img className="ml-lockup-mark" src="/logo-emblem.png" alt="" />
            <img className="ml-lockup-word" src="/logo-wordmark.png" alt="MundoLingu" />
          </a>
          <div className="ml-navlinks">
            {NAV.map((n) => (
              <a key={n.id} className="ml-navlink" href={n.route ? n.route : n.page ? "#team" : "#" + n.id} onClick={(e) => { if (n.route) return; e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{navLabel(n)}</a>
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
          <a key={n.id} href={n.route ? n.route : n.page ? "#team" : "#" + n.id} onClick={(e) => { if (n.route) return; e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{navLabel(n)}</a>
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
                    {t.unlock} <span className="ml-nowrap"><span key={lang + learn + wi} className="ml-rotator ml-rotator--anim">{word}</span>.</span>
                  </h1>
                  <p className="ml-lead">{hero.sub}</p>

                  <div className="ml-exam-chips" aria-label="Exams we prepare for">
                    {EXAM_CHIPS.map((x) => (
                      <a key={x} className="ml-exam-chip" href="#exams" onClick={(e) => { e.preventDefault(); go("exams"); }}>{x}</a>
                    ))}
                  </div>

                  <div className="ml-hero-ctas">
                    <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); go("demo"); }}>{learn === "exams" ? t.bookExamDemo : t.bookDemo} <ArrowRight /></a>
                    <a className="ml-btn ml-btn--ghost" href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>{t.joinClub} <ArrowRight /></a>
                  </div>

                  <a className="ml-wa-link" href={wa(t.waHi)} target="_blank" rel="noreferrer"><MessageCircle /> {t.askWa}</a>

                  <div className="ml-learn" style={{ marginTop: 28 }}>
                    <span className="ml-learn-label">{t.iWantToLearn}</span>
                    <div className="ml-learn-seg" role="group" aria-label="Choose what to learn">
                      <button className={learn === "exams" ? "is-active" : ""} aria-pressed={learn === "exams"} onClick={() => setLearn("exams")}>{t.learnExams}</button>
                      <button className={learn === "english" ? "is-active" : ""} aria-pressed={learn === "english"} onClick={() => setLearn("english")}>{t.learnEnglish}</button>
                      <button className={learn === "spanish" ? "is-active" : ""} aria-pressed={learn === "spanish"} onClick={() => setLearn("spanish")}>{t.learnSpanish}</button>
                    </div>
                  </div>

                  <div className="ml-trust">{t.trust.map((x) => (<span key={x}><Check /> {x}</span>))}</div>
                </div>

                <div className="ml-visual" aria-hidden="true">
                  <div className="ml-visual-top">
                    <span className="ml-live"><b />{t.liveLesson}</span>
                    <span>{learn === "exams" ? t.examsVisual : (learn === "english" ? t.englishLabel : t.spanishLabel) + " · A1 → C1"}</span>
                  </div>
                  <div className="ml-greet"><span key={learn}>{hero.greet}</span></div>
                  <div className="ml-visual-bottom">
                    <div className="ml-horizon ml-horizon--draw" />
                    <div className="ml-progress-label"><span>{learn === "exams" ? t.targetScore : t.confidence}</span><span>{learn === "exams" ? "7.5" : "80%"}</span></div>
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

            {/* EXAM PREP */}
            <section className="ml-section ml-section--dark" id="exams">
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.examsEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.examsTitle}</h2>
                <p className="ml-lead" data-reveal>{t.examsLead}</p>
                <div className="ml-exams">
                  {EXAMS[lang].map((ex, i) => (
                    <article className="ml-exam" data-reveal style={{ transitionDelay: i * 0.08 + "s", ["--exam" as string]: ex.color }} key={ex.name}>
                      <span className="ml-exam-badge">{ex.badge}</span>
                      <div className="ml-exam-head"><h3>{ex.name}</h3><span>{ex.full}</span></div>
                      <p className="ml-exam-for">{ex.for}</p>
                      <ul>{ex.points.map((pt) => (<li key={pt}><Check /> {pt}</li>))}</ul>
                      <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); bookExam(ex.name); }}>{t.freeExamDemo(ex.name)} <ArrowRight /></a>
                    </article>
                  ))}
                </div>
                <div className="ml-pkgs-head" data-reveal>
                  <span className="ml-eyebrow">{t.pkgEyebrow}</span>
                  <h3>{t.pkgTitle}</h3>
                  <p>{t.pkgNote}</p>
                </div>
                <div className="ml-pkgs">
                  {PACKAGES[lang].map((pk, i) => (
                    <div className={"ml-pkg" + (pk.best ? " ml-pkg--best" : "")} data-reveal style={{ transitionDelay: i * 0.06 + "s" }} key={pk.name}>
                      <span className="ml-pkg-flag">{pk.tag}</span>
                      <div className="ml-pkg-name">{pk.name}</div>
                      <div className="ml-pkg-lessons"><b>{pk.lessons}</b> {t.lessonsWord}</div>
                      <p className="ml-pkg-for">{pk.for}</p>
                      <ul>{pk.perks.map((x) => (<li key={x}><Check /> {x}</li>))}</ul>
                      <a className={"ml-btn " + (pk.best ? "ml-btn--primary" : "ml-btn--light")} href="#demo" onClick={(e) => { e.preventDefault(); bookExam(interest); }}>{t.pickPkg} <ArrowRight /></a>
                    </div>
                  ))}
                </div>
                <div className="ml-exam-incl" data-reveal>
                  <h4>{t.examsIncl}</h4>
                  <div className="ml-exam-incl-list">
                    {t.examsInclList.map((li) => (<span key={li}><Check /> {li}</span>))}
                  </div>
                  <div className="ml-exam-links">
                    <a href="/ielts-band-check">{t.bandCheck} <ArrowUpRight /></a>
                    <a href="/ielts-preparation-dubai">{t.ieltsDubai} <ArrowUpRight /></a>
                  </div>
                </div>

                <p className="ml-limited" data-reveal><span className="ml-dotpulse" /> {t.limited}</p>

                <div className="ml-minitest" data-reveal>
                  <div>
                    <h3>{t.mtTitle}</h3>
                    <p>{t.mtBody}</p>
                  </div>
                  <a className="ml-btn ml-btn--wa" href={wa(t.mtMsg)} target="_blank" rel="noreferrer"><MessageCircle /> {t.mtBtn}</a>
                </div>
              </div>
            </section>

            {/* US vs THEM */}
            <section className="ml-section" id="why-us">
              <div className="ml-wrap">
                <span className="ml-eyebrow" data-reveal>{t.cmpEyebrow}</span>
                <h2 className="ml-h2" data-reveal>{t.cmpTitle}</h2>
                <div className="ml-cmp" data-reveal role="table">
                  <div className="ml-cmp-row ml-cmp-head" role="row"><span role="columnheader" /><span role="columnheader">{t.cmpThem}</span><span role="columnheader">{t.cmpUs}</span></div>
                  {COMPARE[lang].map(([k, them, us]) => (
                    <div className="ml-cmp-row" role="row" key={k}>
                      <span role="rowheader">{k}</span>
                      <span role="cell" className="ml-cmp-them"><X /> {them}</span>
                      <span role="cell" className="ml-cmp-us"><Check /> {us}</span>
                    </div>
                  ))}
                </div>
                <div className="ml-cmp-cta" data-reveal>
                  <p>{t.cmpClose}</p>
                  <div className="ml-cmp-btns">
                    <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); bookExam(interest); }}>{t.bookExamDemo} <ArrowRight /></a>
                    <a className="ml-btn ml-btn--wa" href={wa(t.waHi)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
                  </div>
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
                <h2 className="ml-vision-head" data-reveal><>{t.visionHead[0]}<em>{t.visionHead[1]}</em>{t.visionHead[2]}</></h2>
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
                      <div className="ml-club-free"><Check /> {t.clubFree}</div>
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
                <div className="ml-plans ml-plans--3">
                  <div className="ml-plan ml-plan--feature" data-reveal>
                    <span className="ml-plan-tag">{t.planExamTag}</span>
                    <h3>{t.planExam}</h3>
                    <p className="for">{t.planExamFor}</p>
                    <div className="ml-plan-price">{t.planExamPrice} <small>{t.planExamPriceSub}</small></div>
                    <ul>{t.planExamList.map((li) => (<li key={li}><Check /> {li}</li>))}</ul>
                    <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); bookExam("IELTS"); }}>{t.bookExamDemo} <ArrowRight /></a>
                  </div>
                  <div className="ml-plan" data-reveal style={{ transitionDelay: "0.08s" }}>
                    <span className="ml-plan-tag">{t.membTag}</span>
                    <h3>{t.planCommunity}</h3>
                    <p className="for">{t.planCommunityFor}</p>
                    <div className="ml-plan-price">$10 <small>{t.planCommunityPrice}</small></div>
                    <ul>{t.planCommunityList.map((li) => (<li key={li}><Check /> {li}</li>))}</ul>
                    <a className="ml-btn ml-btn--ghost" href="#membership" onClick={(e) => { e.preventDefault(); go("membership"); }}>{t.joinMembership} <ArrowRight /></a>
                  </div>
                  <div className="ml-plan" data-reveal style={{ transitionDelay: "0.16s" }}>
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
                <DemoForm lang={lang} interest={interest} />
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
              {NAV.map((n) => (<a key={n.id} href={n.route ? n.route : n.page ? "#team" : "#" + n.id} onClick={(e) => { if (n.route) return; e.preventDefault(); n.page ? goTeam() : go(n.id); }}>{navLabel(n)}</a>))}
            </div>
            <div className="ml-foot-col">
              <h5>{t.contact}</h5>
              <a href="https://wa.me/971504296090" target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
              <a href="https://instagram.com/mundolingu" target="_blank" rel="noreferrer"><Instagram /> @mundolingu</a>
              <a href="mailto:mundolingu@gmail.com"><Mail /> mundolingu@gmail.com</a>
            </div>
          </div>
          <div className="ml-foot-bar"><span>{t.footBar}</span><a className="ml-foot-terms" href="/terms">{t.terms}</a></div>
        </div>
      </footer>

      {page === "home" && (
        <div className={"ml-mbar" + (scrolled && !mobileOpen ? " show" : "")}>
          <a className="ml-btn ml-btn--primary" href="#demo" onClick={(e) => { e.preventDefault(); bookExam(interest); }}>{t.barDemo} <ArrowRight /></a>
          <a className="ml-mbar-wa" href={wa(t.waHi)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle /></a>
        </div>
      )}

      {WHATSAPP_NUMBER && (
        <a className="wa-fab" href={wa(t.waHi)} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.2 4.9 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4 15 3.5 13.5 3.5 12 3.5 7.3 7.3 3.5 12 3.5S20.5 7.3 20.5 12 16.7 20 12 20z" />
            <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.3-.6-2.2-1.2-3.1-2.6-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.1-.3.2-.5v-.5c-.1-.1-.7-1.6-.9-2.2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2.1-.5 3.3.7 1.7 1.9 3.1 3.5 4.1 1.6 1 2.9 1.1 3.4 1 .5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z" />
          </svg>
        </a>
      )}
    </div>
  );
}
