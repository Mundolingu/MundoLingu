"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Download, Globe, Instagram, Mail, MessageCircle } from "lucide-react";

const WHATSAPP = "971504296090";
const PDF = "/mundolingu-terms-and-conditions.pdf";

type Lang = "en" | "es";

type Block =
  | { t: "p"; x: string }
  | { t: "ul"; x: string[] }
  | { t: "callout"; h: string; items: { h: string; x: string }[] }
  | { t: "contact" };

type Section = { id: string; n: string; h: string; blocks: Block[] };

const COPY: { [k in Lang]: {
  eyebrow: string; title: string; sub: string; updated: string; download: string;
  intro: string; toc: string; back: string; closing: string;
  ctaTitle: string; ctaBody: string; ctaBtn: string; ctaWa: string;
  footBar: string; footHome: string;
  sections: Section[];
} } = {
  en: {
    eyebrow: "Legal",
    title: "Terms & Conditions",
    sub: "MundoLingu — Online Language School",
    updated: "Last updated 26 August 2026",
    download: "Download PDF (EN & ES)",
    toc: "On this page",
    back: "Back to home",
    intro:
      "Welcome to MundoLingu. These Terms & Conditions (the “Terms”) explain how our online language lessons and memberships work, and the rules that apply when you book, pay for, and take part in our classes. MundoLingu is an online language school operated from Dubai, United Arab Emirates, offering English lessons for Spanish speakers and Spanish lessons for English speakers. By booking a lesson, creating an account, or purchasing a membership or lesson package, you agree to these Terms. Please read them carefully.",
    closing: "Thank you for learning with MundoLingu. We’re looking forward to helping you reach your language goals.",
    ctaTitle: "Still have a question?",
    ctaBody: "If anything here isn’t clear, just ask — we’d rather explain it in a conversation than leave you guessing.",
    ctaBtn: "Book a free demo",
    ctaWa: "Ask on WhatsApp",
    footBar: "© 2026 MundoLingu · Online — Mexico · Latin America · Europe · Dubai",
    footHome: "Home",
    sections: [
      { id: "services", n: "01", h: "The services we provide", blocks: [
        { t: "p", x: "MundoLingu provides online language education, which may include:" },
        { t: "ul", x: [
          "One-to-one (private) language lessons with a MundoLingu teacher.",
          "Live group speaking classes held on scheduled evenings each week.",
          "A monthly membership giving access to a members’ area with video lessons, live classes, an events calendar, and a library of downloadable workbooks.",
          "Learning materials such as workbooks, worksheets, and practice resources.",
          "A free demo lesson for new students who want to try MundoLingu before enrolling.",
        ] },
        { t: "p", x: "The exact lessons, materials, and features available may change over time as we improve our service. We’ll always aim to give you what was described when you enrolled." },
      ] },
      { id: "account", n: "02", h: "Your account and eligibility", blocks: [
        { t: "ul", x: [
          "Our lessons and memberships are intended for adults (18 years or older). A student under 18 may take part only with the consent and supervision of a parent or legal guardian, who accepts these Terms on the student’s behalf.",
          "You are responsible for keeping your account details and any access code or login secure, and for all activity that takes place under your account.",
          "Please give us accurate information when you sign up (for example your name, email, and contact number) so we can deliver your lessons and reach you if needed.",
        ] },
      ] },
      { id: "payment", n: "03", h: "Bookings, packages and payment", blocks: [
        { t: "ul", x: [
          "Lessons and packages are booked in advance and paid for before the lesson or period begins, using the payment method shown to you or agreed with us (for example, bank transfer confirmed via WhatsApp).",
          "A “package” is a set of lessons purchased together (for example a block of private lessons or a term of group classes). A “membership period” is the month you have paid for.",
          "Prices are shown at the time of purchase. We may update our prices from time to time, but a change will never affect a package or membership period you have already paid for.",
          "Lesson times are reserved specifically for you. When you book a time slot, that slot is held for you and your teacher, which is why the cancellation rules in Section 4 apply.",
        ] },
      ] },
      { id: "cancellations", n: "04", h: "Cancellations, rescheduling and missed lessons", blocks: [
        { t: "p", x: "We know life happens, and we’ll always try to be flexible. To keep scheduling fair for our teachers and other students, the following applies to any lesson that has a reserved time slot (private lessons and live group classes):" },
        { t: "callout", h: "How lesson cancellations work", items: [
          { h: "More than 24 hours’ notice.", x: "You may reschedule or cancel free of charge, and the lesson stays in your package to be used another time." },
          { h: "Less than 24 hours’ notice, or not showing up, without a valid reason.", x: "The lesson is counted as completed and deducted from your package. A valid reason includes things such as illness, a family emergency, or another genuine situation beyond your control — assessed reasonably and in good faith." },
          { h: "Fair-use allowance.", x: "Each student may use this late-cancellation allowance up to two (2) times within a single package or membership period." },
          { h: "After the second time.", x: "If it happens a third time, we’ll pause and have a friendly conversation with you to understand what’s going on and find a solution that works — whether that’s adjusting your schedule, your plan, or the support we give you. Our goal is always to help you keep learning, never to penalise you." },
        ] },
        { t: "p", x: "Whenever possible, please give us as much notice as you can so we can offer your slot to another student and help you find a better time. If you need to cancel, let us know by your usual contact channel (for example WhatsApp or email)." },
      ] },
      { id: "demo", n: "05", h: "Free demo lesson", blocks: [
        { t: "p", x: "New students may book one free demo lesson so we can get to know each other and plan the right learning path for you. The demo lesson is free of charge and carries no obligation to continue. It’s offered per student, and we may limit repeat demo bookings." },
      ] },
      { id: "membership", n: "06", h: "Membership", blocks: [
        { t: "ul", x: [
          "Membership is billed monthly and renews automatically until you cancel.",
          "You can cancel your membership at any time. When you cancel, you’ll keep access until the end of the period you’ve already paid for, and you won’t be charged again after that.",
          "Introductory or promotional pricing (for example a reduced first month) applies only as described at the time you sign up; standard pricing applies afterwards.",
          "Membership gives you access to the members’ area and its content as it stands from time to time. We add new materials regularly, but the specific content available may change.",
        ] },
      ] },
      { id: "refunds", n: "07", h: "Refunds", blocks: [
        { t: "p", x: "Because our lessons, materials, and members’ content are delivered digitally, and because lesson slots are reserved specifically for you, fees are generally non-refundable except where a refund is required by law. Lessons that have already been taken or counted as completed (including under Section 4) are not refundable. If you believe there are exceptional circumstances, please contact us — we’ll always review your situation fairly and in good faith." },
      ] },
      { id: "conduct", n: "08", h: "Student conduct and community", blocks: [
        { t: "p", x: "MundoLingu is a friendly, respectful learning community. When taking part in lessons, live classes, or any MundoLingu space, you agree to:" },
        { t: "ul", x: [
          "Treat teachers and fellow students with courtesy and respect.",
          "Not record, share, or republish lessons, live classes, or other students’ contributions without permission.",
          "Not use MundoLingu’s services for any unlawful, harmful, or abusive purpose.",
        ] },
        { t: "p", x: "We may pause or end access for anyone who behaves abusively or repeatedly breaks these Terms, where appropriate without a refund." },
      ] },
      { id: "ip", n: "09", h: "Learning materials and intellectual property", blocks: [
        { t: "p", x: "All MundoLingu lessons, workbooks, videos, graphics, and other materials are the property of MundoLingu (or used with permission) and are protected by intellectual property laws. They are provided for your own personal learning only. You may download and use materials for your studies, but you may not copy, resell, distribute, or share them publicly without our written permission." },
      ] },
      { id: "privacy", n: "10", h: "Privacy and your data", blocks: [
        { t: "p", x: "We collect and use personal information (such as your name, email, phone number, and learning preferences) only to provide and improve our services, arrange your lessons, and communicate with you. We do not sell your personal data. If you would like to know what information we hold, or ask us to update or delete it, please contact us using the details at the end of these Terms." },
      ] },
      { id: "availability", n: "11", h: "Availability of the service", blocks: [
        { t: "p", x: "We work hard to keep lessons and the members’ area running smoothly, but online services can occasionally be affected by technical issues, third-party platforms, or events outside our control. If a lesson can’t go ahead because of a problem on our side, we’ll reschedule it or return it to your package." },
      ] },
      { id: "changes", n: "12", h: "Changes to these Terms", blocks: [
        { t: "p", x: "We may update these Terms from time to time — for example, to reflect new features or legal requirements. The latest version will always be published on our website with an updated date. If you keep using our services after a change, that means you accept the updated Terms." },
      ] },
      { id: "liability", n: "13", h: "Liability", blocks: [
        { t: "p", x: "MundoLingu provides language education and support to help you learn, but we can’t guarantee any specific result, exam score, or level of fluency, as progress depends on many factors including your own practice. To the fullest extent permitted by law, MundoLingu is not liable for indirect or unforeseeable losses arising from the use of our services. Nothing in these Terms limits any rights you may have that cannot be excluded by law." },
      ] },
      { id: "law", n: "14", h: "Governing law", blocks: [
        { t: "p", x: "These Terms are governed by the laws of the United Arab Emirates (Dubai), without affecting any mandatory consumer-protection rights you may have in your own country of residence." },
      ] },
      { id: "contact", n: "15", h: "Contact us", blocks: [
        { t: "p", x: "If you have any questions about these Terms or your lessons, we’re happy to help:" },
        { t: "contact" },
      ] },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Términos y Condiciones",
    sub: "MundoLingu — Escuela de Idiomas en Línea",
    updated: "Última actualización: 26 de agosto de 2026",
    download: "Descargar PDF (EN y ES)",
    toc: "En esta página",
    back: "Volver al inicio",
    intro:
      "Te damos la bienvenida a MundoLingu. Estos Términos y Condiciones (los «Términos») explican cómo funcionan nuestras clases y membresías de idiomas en línea, y las reglas que se aplican cuando reservas, pagas y participas en nuestras clases. MundoLingu es una escuela de idiomas en línea gestionada desde Dubái, Emiratos Árabes Unidos, que ofrece clases de inglés para hispanohablantes y clases de español para angloparlantes. Al reservar una clase, crear una cuenta o adquirir una membresía o paquete de clases, aceptas estos Términos. Por favor, léelos con atención.",
    closing: "Gracias por aprender con MundoLingu. Tenemos muchas ganas de ayudarte a alcanzar tus metas con los idiomas.",
    ctaTitle: "¿Te queda alguna duda?",
    ctaBody: "Si algo aquí no queda claro, pregúntanos. Preferimos explicártelo en una conversación que dejarte con dudas.",
    ctaBtn: "Reserva una clase gratis",
    ctaWa: "Pregunta por WhatsApp",
    footBar: "© 2026 MundoLingu · Online — México · Latinoamérica · Europa · Dubái",
    footHome: "Inicio",
    sections: [
      { id: "services", n: "01", h: "Los servicios que ofrecemos", blocks: [
        { t: "p", x: "MundoLingu ofrece educación de idiomas en línea, que puede incluir:" },
        { t: "ul", x: [
          "Clases particulares (uno a uno) con un profesor de MundoLingu.",
          "Clases grupales de conversación en vivo, en horarios establecidos por las tardes cada semana.",
          "Una membresía mensual que da acceso a un área de miembros con lecciones en video, clases en vivo, un calendario de eventos y una biblioteca de cuadernos de trabajo descargables.",
          "Materiales de aprendizaje como cuadernos de trabajo, hojas de ejercicios y recursos de práctica.",
          "Una clase de prueba gratuita para nuevos estudiantes que quieran conocer MundoLingu antes de inscribirse.",
        ] },
        { t: "p", x: "Las clases, los materiales y las funciones disponibles pueden cambiar con el tiempo a medida que mejoramos nuestro servicio. Siempre procuraremos ofrecerte lo que se describió cuando te inscribiste." },
      ] },
      { id: "account", n: "02", h: "Tu cuenta y requisitos", blocks: [
        { t: "ul", x: [
          "Nuestras clases y membresías están dirigidas a personas adultas (mayores de 18 años). Un estudiante menor de 18 años solo puede participar con el consentimiento y la supervisión de un padre, madre o tutor legal, quien acepta estos Términos en su nombre.",
          "Eres responsable de mantener seguros los datos de tu cuenta y cualquier código de acceso o contraseña, así como de toda la actividad que se realice en tu cuenta.",
          "Por favor, proporciónanos información correcta al registrarte (por ejemplo, tu nombre, correo electrónico y número de contacto) para que podamos impartir tus clases y comunicarnos contigo si es necesario.",
        ] },
      ] },
      { id: "payment", n: "03", h: "Reservas, paquetes y pagos", blocks: [
        { t: "ul", x: [
          "Las clases y los paquetes se reservan por adelantado y se pagan antes de que comience la clase o el periodo, mediante el método de pago que se te indique o que acordemos contigo (por ejemplo, transferencia bancaria confirmada por WhatsApp).",
          "Un «paquete» es un conjunto de clases adquiridas juntas (por ejemplo, un bloque de clases particulares o un periodo de clases grupales). Un «periodo de membresía» es el mes que has pagado.",
          "Los precios se muestran en el momento de la compra. Podemos actualizar nuestros precios ocasionalmente, pero ningún cambio afectará a un paquete o periodo de membresía que ya hayas pagado.",
          "Los horarios de clase se reservan específicamente para ti. Cuando reservas un horario, ese espacio queda apartado para ti y tu profesor, y por eso se aplican las reglas de cancelación de la Sección 4.",
        ] },
      ] },
      { id: "cancellations", n: "04", h: "Cancelaciones, cambios de horario y clases perdidas", blocks: [
        { t: "p", x: "Sabemos que la vida pasa, y siempre intentaremos ser flexibles. Para que la organización de horarios sea justa para nuestros profesores y demás estudiantes, lo siguiente se aplica a cualquier clase que tenga un horario reservado (clases particulares y clases grupales en vivo):" },
        { t: "callout", h: "Cómo funcionan las cancelaciones de clases", items: [
          { h: "Con más de 24 horas de antelación.", x: "Puedes cambiar el horario o cancelar sin costo, y la clase permanece en tu paquete para usarla en otro momento." },
          { h: "Con menos de 24 horas de antelación, o si no te presentas, sin un motivo válido.", x: "La clase se cuenta como realizada y se descuenta de tu paquete. Un motivo válido incluye situaciones como enfermedad, una emergencia familiar u otra circunstancia genuina fuera de tu control, evaluada de forma razonable y de buena fe." },
          { h: "Margen de uso razonable.", x: "Cada estudiante puede usar este margen de cancelación de último momento hasta dos (2) veces dentro de un mismo paquete o periodo de membresía." },
          { h: "Después de la segunda vez.", x: "Si ocurre una tercera vez, haremos una pausa y tendremos una conversación amistosa contigo para entender qué está pasando y encontrar una solución que funcione, ya sea ajustar tu horario, tu plan o el apoyo que te damos. Nuestro objetivo siempre es ayudarte a seguir aprendiendo, nunca penalizarte." },
        ] },
        { t: "p", x: "Siempre que sea posible, avísanos con la mayor antelación que puedas para que podamos ofrecer tu horario a otro estudiante y ayudarte a encontrar un mejor momento. Si necesitas cancelar, avísanos por tu canal de contacto habitual (por ejemplo, WhatsApp o correo electrónico)." },
      ] },
      { id: "demo", n: "05", h: "Clase de prueba gratuita", blocks: [
        { t: "p", x: "Los nuevos estudiantes pueden reservar una clase de prueba gratuita para conocernos y planificar juntos el mejor camino de aprendizaje para ti. La clase de prueba es gratuita y no implica ninguna obligación de continuar. Se ofrece por estudiante, y podemos limitar la repetición de clases de prueba." },
      ] },
      { id: "membership", n: "06", h: "Membresía", blocks: [
        { t: "ul", x: [
          "La membresía se cobra mensualmente y se renueva automáticamente hasta que la canceles.",
          "Puedes cancelar tu membresía en cualquier momento. Al cancelar, conservarás el acceso hasta el final del periodo que ya hayas pagado, y no se te volverá a cobrar después de eso.",
          "Los precios promocionales o de introducción (por ejemplo, un primer mes con descuento) se aplican únicamente como se describe en el momento de tu registro; después se aplica el precio estándar.",
          "La membresía te da acceso al área de miembros y a su contenido tal como esté disponible en cada momento. Agregamos materiales nuevos con regularidad, pero el contenido específico disponible puede cambiar.",
        ] },
      ] },
      { id: "refunds", n: "07", h: "Reembolsos", blocks: [
        { t: "p", x: "Debido a que nuestras clases, materiales y contenido para miembros se entregan de forma digital, y a que los horarios de clase se reservan específicamente para ti, las tarifas por lo general no son reembolsables, salvo cuando la ley exija un reembolso. Las clases que ya se hayan tomado o contado como realizadas (incluidas las de la Sección 4) no son reembolsables. Si consideras que existen circunstancias excepcionales, contáctanos: siempre revisaremos tu situación de forma justa y de buena fe." },
      ] },
      { id: "conduct", n: "08", h: "Conducta del estudiante y comunidad", blocks: [
        { t: "p", x: "MundoLingu es una comunidad de aprendizaje amable y respetuosa. Al participar en las clases, las clases en vivo o cualquier espacio de MundoLingu, aceptas:" },
        { t: "ul", x: [
          "Tratar a los profesores y a los demás estudiantes con cortesía y respeto.",
          "No grabar, compartir ni volver a publicar las clases, las clases en vivo o las aportaciones de otros estudiantes sin autorización.",
          "No usar los servicios de MundoLingu para ningún fin ilícito, dañino o abusivo.",
        ] },
        { t: "p", x: "Podemos suspender o cancelar el acceso de cualquier persona que se comporte de forma abusiva o incumpla estos Términos de forma reiterada, sin reembolso cuando corresponda." },
      ] },
      { id: "ip", n: "09", h: "Materiales de aprendizaje y propiedad intelectual", blocks: [
        { t: "p", x: "Todas las clases, cuadernos de trabajo, videos, gráficos y demás materiales de MundoLingu son propiedad de MundoLingu (o se utilizan con autorización) y están protegidos por las leyes de propiedad intelectual. Se proporcionan únicamente para tu aprendizaje personal. Puedes descargar y usar los materiales para tus estudios, pero no puedes copiarlos, revenderlos, distribuirlos ni compartirlos públicamente sin nuestra autorización por escrito." },
      ] },
      { id: "privacy", n: "10", h: "Privacidad y tus datos", blocks: [
        { t: "p", x: "Recopilamos y usamos datos personales (como tu nombre, correo electrónico, número de teléfono y preferencias de aprendizaje) únicamente para prestar y mejorar nuestros servicios, organizar tus clases y comunicarnos contigo. No vendemos tus datos personales. Si deseas saber qué información tenemos sobre ti, o pedirnos que la actualicemos o eliminemos, contáctanos usando los datos que aparecen al final de estos Términos." },
      ] },
      { id: "availability", n: "11", h: "Disponibilidad del servicio", blocks: [
        { t: "p", x: "Nos esforzamos por mantener las clases y el área de miembros funcionando sin problemas, pero los servicios en línea pueden verse afectados ocasionalmente por problemas técnicos, plataformas de terceros o situaciones fuera de nuestro control. Si una clase no puede realizarse por un problema de nuestra parte, la reprogramaremos o la devolveremos a tu paquete." },
      ] },
      { id: "changes", n: "12", h: "Cambios en estos Términos", blocks: [
        { t: "p", x: "Podemos actualizar estos Términos ocasionalmente, por ejemplo, para reflejar nuevas funciones o requisitos legales. La versión más reciente siempre estará publicada en nuestro sitio web con la fecha actualizada. Si sigues usando nuestros servicios después de un cambio, significa que aceptas los Términos actualizados." },
      ] },
      { id: "liability", n: "13", h: "Responsabilidad", blocks: [
        { t: "p", x: "MundoLingu ofrece educación y apoyo en idiomas para ayudarte a aprender, pero no podemos garantizar ningún resultado específico, calificación de examen ni nivel de fluidez, ya que el progreso depende de muchos factores, incluida tu propia práctica. En la medida máxima permitida por la ley, MundoLingu no se hace responsable de pérdidas indirectas o imprevisibles derivadas del uso de nuestros servicios. Nada en estos Términos limita los derechos que puedas tener y que no puedan excluirse por ley." },
      ] },
      { id: "law", n: "14", h: "Legislación aplicable", blocks: [
        { t: "p", x: "Estos Términos se rigen por las leyes de los Emiratos Árabes Unidos (Dubái), sin que ello afecte los derechos obligatorios de protección al consumidor que puedas tener en tu país de residencia." },
      ] },
      { id: "contact", n: "15", h: "Contáctanos", blocks: [
        { t: "p", x: "Si tienes alguna pregunta sobre estos Términos o tus clases, con gusto te ayudamos:" },
        { t: "contact" },
      ] },
    ],
  },
};

const CONTACTS = [
  { icon: Mail, label: "mundolingu@gmail.com", href: "mailto:mundolingu@gmail.com" },
  { icon: MessageCircle, label: "+971 50 429 6090", href: `https://wa.me/${WHATSAPP}` },
  { icon: Globe, label: "www.mundolingu.com", href: "/" },
  { icon: Instagram, label: "@mundolingu", href: "https://instagram.com/mundolingu" },
];

export default function Terms() {
  const [lang, setLang] = useState<Lang>("en");
  const [active, setActive] = useState("");

  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);
  function sw(l: Lang) { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  const c = COPY[lang];

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const els = c.sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (ents) => {
        const vis = ents.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-96px 0px -62% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [c]);

  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(id);
    try { history.replaceState(null, "", "#" + id); } catch {}
  };

  return (
    <div className="lg-root">
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <div className="ml-langsw">
          <Globe size={14} />
          <button className={lang === "en" ? "on" : ""} onClick={() => sw("en")}>EN</button>
          <button className={lang === "es" ? "on" : ""} onClick={() => sw("es")}>ES</button>
        </div>
      </header>

      <section className="lg-hero">
        <div className="lg-hero-in">
          <span className="lg-eyebrow">{c.eyebrow}</span>
          <h1 className="lg-title">{c.title}</h1>
          <p className="lg-sub">{c.sub}</p>
          <div className="lg-meta">
            <span className="lg-pill">{c.updated}</span>
            <a className="lg-dl" href={PDF} target="_blank" rel="noreferrer"><Download size={15} /> {c.download}</a>
          </div>
        </div>
        <div className="lg-hero-line" />
      </section>

      <div className="lg-body">
        <aside className="lg-toc">
          <nav aria-label={c.toc}>
            <h2>{c.toc}</h2>
            {c.sections.map((s) => (
              <a key={s.id} href={"#" + s.id} onClick={jump(s.id)} className={active === s.id ? "on" : ""}>
                <span>{s.n}</span> {s.h}
              </a>
            ))}
          </nav>
        </aside>

        <main className="lg-content">
          <p className="lg-intro">{c.intro}</p>

          {c.sections.map((s) => (
            <section className="lg-sec" id={s.id} key={s.id}>
              <h2 className="lg-sec-h"><span className="lg-sec-n">{s.n}</span> {s.h}</h2>
              {s.blocks.map((b, i) => {
                if (b.t === "p") return <p key={i}>{b.x}</p>;
                if (b.t === "ul") return (
                  <ul key={i}>{b.x.map((li, j) => (<li key={j}>{li}</li>))}</ul>
                );
                if (b.t === "callout") return (
                  <div className="lg-callout" key={i}>
                    <h3>{b.h}</h3>
                    {b.items.map((it, j) => (
                      <p key={j}><b>{it.h}</b> {it.x}</p>
                    ))}
                  </div>
                );
                return (
                  <div className="lg-contact" key={i}>
                    {CONTACTS.map((ct) => {
                      const Icon = ct.icon;
                      const ext = ct.href.startsWith("http");
                      return (
                        <a key={ct.label} href={ct.href} {...(ext ? { target: "_blank", rel: "noreferrer" } : {})}>
                          <Icon size={17} /> <span>{ct.label}</span>
                        </a>
                      );
                    })}
                  </div>
                );
              })}
            </section>
          ))}

          <p className="lg-closing">{c.closing}</p>

          <div className="lg-cta">
            <h3>{c.ctaTitle}</h3>
            <p>{c.ctaBody}</p>
            <div className="lg-cta-btns">
              <a className="ml-btn ml-btn--primary" href="/#demo">{c.ctaBtn} <ArrowRight size={17} /></a>
              <a className="ml-btn ml-btn--light" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> {c.ctaWa}
              </a>
            </div>
          </div>
        </main>
      </div>

      <footer className="lg-foot">
        <span>{c.footBar}</span>
        <a href="/">{c.footHome}</a>
      </footer>
    </div>
  );
}
