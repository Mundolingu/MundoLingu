"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";

type Item = string | { lead: string; text: string };
type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "sub"; text: string }
  | { type: "list"; items: Item[] }
  | { type: "contact"; items: { label: string; value: string; href?: string }[] };

type Doc = { title: string; sub: string; updated: string; body: Block[] };

const EN: Doc = {
  title: "Terms & Conditions",
  sub: "MundoLingu — Online Language School",
  updated: "Last updated: 26 August 2026",
  body: [
    { type: "p", text: "Welcome to MundoLingu. These Terms & Conditions (the \"Terms\") explain how our online language lessons and memberships work, and the rules that apply when you book, pay for, and take part in our classes. MundoLingu is an online language school operated from Dubai, United Arab Emirates, offering English lessons for Spanish speakers and Spanish lessons for English speakers. By booking a lesson, creating an account, or purchasing a membership or lesson package, you agree to these Terms. Please read them carefully." },

    { type: "h", text: "1. The services we provide" },
    { type: "p", text: "MundoLingu provides online language education, which may include:" },
    { type: "list", items: [
      "One-to-one (private) language lessons with a MundoLingu teacher.",
      "Live group speaking classes held on scheduled evenings each week.",
      "A monthly membership giving access to a members' area with video lessons, live classes, an events calendar, and a library of downloadable workbooks.",
      "Learning materials such as workbooks, worksheets, and practice resources.",
      "A free demo lesson for new students who want to try MundoLingu before enrolling.",
    ] },
    { type: "p", text: "The exact lessons, materials, and features available may change over time as we improve our service. We'll always aim to give you what was described when you enrolled." },

    { type: "h", text: "2. Your account and eligibility" },
    { type: "list", items: [
      "Our lessons and memberships are intended for adults (18 years or older). A student under 18 may take part only with the consent and supervision of a parent or legal guardian, who accepts these Terms on the student's behalf.",
      "You are responsible for keeping your account details and any access code or login secure, and for all activity that takes place under your account.",
      "Please give us accurate information when you sign up (for example your name, email, and contact number) so we can deliver your lessons and reach you if needed.",
    ] },

    { type: "h", text: "3. Bookings, packages and payment" },
    { type: "list", items: [
      "Lessons and packages are booked in advance and paid for before the lesson or period begins, using the payment method shown to you or agreed with us (for example, bank transfer confirmed via WhatsApp).",
      "A \"package\" is a set of lessons purchased together (for example a block of private lessons or a term of group classes). A \"membership period\" is the month you have paid for.",
      "Prices are shown at the time of purchase. We may update our prices from time to time, but a change will never affect a package or membership period you have already paid for.",
      "Lesson times are reserved specifically for you. When you book a time slot, that slot is held for you and your teacher, which is why the cancellation rules in Section 4 apply.",
    ] },

    { type: "h", text: "4. Cancellations, rescheduling and missed lessons" },
    { type: "p", text: "We know life happens, and we'll always try to be flexible. To keep scheduling fair for our teachers and other students, the following applies to any lesson that has a reserved time slot (private lessons and live group classes):" },
    { type: "sub", text: "How lesson cancellations work" },
    { type: "list", items: [
      { lead: "More than 24 hours' notice.", text: "You may reschedule or cancel free of charge, and the lesson stays in your package to be used another time." },
      { lead: "Less than 24 hours' notice, or not showing up, without a valid reason.", text: "The lesson is counted as completed and deducted from your package. A valid reason includes things such as illness, a family emergency, or another genuine situation beyond your control — assessed reasonably and in good faith." },
      { lead: "Fair-use allowance.", text: "Each student may use this late-cancellation allowance up to two (2) times within a single package or membership period." },
      { lead: "After the second time.", text: "If it happens a third time, we'll pause and have a friendly conversation with you to understand what's going on and find a solution that works — whether that's adjusting your schedule, your plan, or the support we give you. Our goal is always to help you keep learning, never to penalise you." },
    ] },
    { type: "p", text: "Whenever possible, please give us as much notice as you can so we can offer your slot to another student and help you find a better time. If you need to cancel, let us know by your usual contact channel (for example WhatsApp or email)." },

    { type: "h", text: "5. Free demo lesson" },
    { type: "p", text: "New students may book one free demo lesson so we can get to know each other and plan the right learning path for you. The demo lesson is free of charge and carries no obligation to continue. It's offered per student, and we may limit repeat demo bookings." },

    { type: "h", text: "6. Membership" },
    { type: "list", items: [
      "Membership is billed monthly and renews automatically until you cancel.",
      "You can cancel your membership at any time. When you cancel, you'll keep access until the end of the period you've already paid for, and you won't be charged again after that.",
      "Introductory or promotional pricing (for example a reduced first month) applies only as described at the time you sign up; standard pricing applies afterwards.",
      "Membership gives you access to the members' area and its content as it stands from time to time. We add new materials regularly, but the specific content available may change.",
    ] },

    { type: "h", text: "7. Refunds" },
    { type: "p", text: "Because our lessons, materials, and members' content are delivered digitally, and because lesson slots are reserved specifically for you, fees are generally non-refundable except where a refund is required by law. Lessons that have already been taken or counted as completed (including under Section 4) are not refundable. If you believe there are exceptional circumstances, please contact us — we'll always review your situation fairly and in good faith." },

    { type: "h", text: "8. Student conduct and community" },
    { type: "p", text: "MundoLingu is a friendly, respectful learning community. When taking part in lessons, live classes, or any MundoLingu space, you agree to:" },
    { type: "list", items: [
      "Treat teachers and fellow students with courtesy and respect.",
      "Not record, share, or republish lessons, live classes, or other students' contributions without permission.",
      "Not use MundoLingu's services for any unlawful, harmful, or abusive purpose.",
    ] },
    { type: "p", text: "We may pause or end access for anyone who behaves abusively or repeatedly breaks these Terms, where appropriate without a refund." },

    { type: "h", text: "9. Learning materials and intellectual property" },
    { type: "p", text: "All MundoLingu lessons, workbooks, videos, graphics, and other materials are the property of MundoLingu (or used with permission) and are protected by intellectual property laws. They are provided for your own personal learning only. You may download and use materials for your studies, but you may not copy, resell, distribute, or share them publicly without our written permission." },

    { type: "h", text: "10. Privacy and your data" },
    { type: "p", text: "We collect and use personal information (such as your name, email, phone number, and learning preferences) only to provide and improve our services, arrange your lessons, and communicate with you. We do not sell your personal data. If you would like to know what information we hold, or ask us to update or delete it, please contact us using the details at the end of these Terms." },

    { type: "h", text: "11. Availability of the service" },
    { type: "p", text: "We work hard to keep lessons and the members' area running smoothly, but online services can occasionally be affected by technical issues, third-party platforms, or events outside our control. If a lesson can't go ahead because of a problem on our side, we'll reschedule it or return it to your package." },

    { type: "h", text: "12. Changes to these Terms" },
    { type: "p", text: "We may update these Terms from time to time — for example, to reflect new features or legal requirements. The latest version will always be published on our website with an updated date. If you keep using our services after a change, that means you accept the updated Terms." },

    { type: "h", text: "13. Liability" },
    { type: "p", text: "MundoLingu provides language education and support to help you learn, but we can't guarantee any specific result, exam score, or level of fluency, as progress depends on many factors including your own practice. To the fullest extent permitted by law, MundoLingu is not liable for indirect or unforeseeable losses arising from the use of our services. Nothing in these Terms limits any rights you may have that cannot be excluded by law." },

    { type: "h", text: "14. Governing law" },
    { type: "p", text: "These Terms are governed by the laws of the United Arab Emirates (Dubai), without affecting any mandatory consumer-protection rights you may have in your own country of residence." },

    { type: "h", text: "15. Contact us" },
    { type: "p", text: "If you have any questions about these Terms or your lessons, we're happy to help:" },
    { type: "contact", items: [
      { label: "Email", value: "mundolingu@gmail.com", href: "mailto:mundolingu@gmail.com" },
      { label: "WhatsApp", value: "+971 50 429 6090" },
      { label: "Website", value: "www.mundolingu.com", href: "https://www.mundolingu.com" },
      { label: "Instagram", value: "@mundolingu" },
    ] },
    { type: "p", text: "Thank you for learning with MundoLingu. We're looking forward to helping you reach your language goals." },
  ],
};

const ES: Doc = {
  title: "Términos y Condiciones",
  sub: "MundoLingu — Escuela de Idiomas en Línea",
  updated: "Última actualización: 26 de agosto de 2026",
  body: [
    { type: "p", text: "Te damos la bienvenida a MundoLingu. Estos Términos y Condiciones (los «Términos») explican cómo funcionan nuestras clases y membresías de idiomas en línea, y las reglas que se aplican cuando reservas, pagas y participas en nuestras clases. MundoLingu es una escuela de idiomas en línea gestionada desde Dubái, Emiratos Árabes Unidos, que ofrece clases de inglés para hispanohablantes y clases de español para angloparlantes. Al reservar una clase, crear una cuenta o adquirir una membresía o paquete de clases, aceptas estos Términos. Por favor, léelos con atención." },

    { type: "h", text: "1. Los servicios que ofrecemos" },
    { type: "p", text: "MundoLingu ofrece educación de idiomas en línea, que puede incluir:" },
    { type: "list", items: [
      "Clases particulares (uno a uno) con un profesor de MundoLingu.",
      "Clases grupales de conversación en vivo, en horarios establecidos por las tardes cada semana.",
      "Una membresía mensual que da acceso a un área de miembros con lecciones en video, clases en vivo, un calendario de eventos y una biblioteca de cuadernos de trabajo descargables.",
      "Materiales de aprendizaje como cuadernos de trabajo, hojas de ejercicios y recursos de práctica.",
      "Una clase de prueba gratuita para nuevos estudiantes que quieran conocer MundoLingu antes de inscribirse.",
    ] },
    { type: "p", text: "Las clases, los materiales y las funciones disponibles pueden cambiar con el tiempo a medida que mejoramos nuestro servicio. Siempre procuraremos ofrecerte lo que se describió cuando te inscribiste." },

    { type: "h", text: "2. Tu cuenta y requisitos" },
    { type: "list", items: [
      "Nuestras clases y membresías están dirigidas a personas adultas (mayores de 18 años). Un estudiante menor de 18 años solo puede participar con el consentimiento y la supervisión de un padre, madre o tutor legal, quien acepta estos Términos en su nombre.",
      "Eres responsable de mantener seguros los datos de tu cuenta y cualquier código de acceso o contraseña, así como de toda la actividad que se realice en tu cuenta.",
      "Por favor, proporciónanos información correcta al registrarte (por ejemplo, tu nombre, correo electrónico y número de contacto) para que podamos impartir tus clases y comunicarnos contigo si es necesario.",
    ] },

    { type: "h", text: "3. Reservas, paquetes y pagos" },
    { type: "list", items: [
      "Las clases y los paquetes se reservan por adelantado y se pagan antes de que comience la clase o el periodo, mediante el método de pago que se te indique o que acordemos contigo (por ejemplo, transferencia bancaria confirmada por WhatsApp).",
      "Un «paquete» es un conjunto de clases adquiridas juntas (por ejemplo, un bloque de clases particulares o un periodo de clases grupales). Un «periodo de membresía» es el mes que has pagado.",
      "Los precios se muestran en el momento de la compra. Podemos actualizar nuestros precios ocasionalmente, pero ningún cambio afectará a un paquete o periodo de membresía que ya hayas pagado.",
      "Los horarios de clase se reservan específicamente para ti. Cuando reservas un horario, ese espacio queda apartado para ti y tu profesor, y por eso se aplican las reglas de cancelación de la Sección 4.",
    ] },

    { type: "h", text: "4. Cancelaciones, cambios de horario y clases perdidas" },
    { type: "p", text: "Sabemos que la vida pasa, y siempre intentaremos ser flexibles. Para que la organización de horarios sea justa para nuestros profesores y demás estudiantes, lo siguiente se aplica a cualquier clase que tenga un horario reservado (clases particulares y clases grupales en vivo):" },
    { type: "sub", text: "Cómo funcionan las cancelaciones de clases" },
    { type: "list", items: [
      { lead: "Con más de 24 horas de antelación.", text: "Puedes cambiar el horario o cancelar sin costo, y la clase permanece en tu paquete para usarla en otro momento." },
      { lead: "Con menos de 24 horas de antelación, o si no te presentas, sin un motivo válido.", text: "La clase se cuenta como realizada y se descuenta de tu paquete. Un motivo válido incluye situaciones como enfermedad, una emergencia familiar u otra circunstancia genuina fuera de tu control, evaluada de forma razonable y de buena fe." },
      { lead: "Margen de uso razonable.", text: "Cada estudiante puede usar este margen de cancelación de último momento hasta dos (2) veces dentro de un mismo paquete o periodo de membresía." },
      { lead: "Después de la segunda vez.", text: "Si ocurre una tercera vez, haremos una pausa y tendremos una conversación amistosa contigo para entender qué está pasando y encontrar una solución que funcione, ya sea ajustar tu horario, tu plan o el apoyo que te damos. Nuestro objetivo siempre es ayudarte a seguir aprendiendo, nunca penalizarte." },
    ] },
    { type: "p", text: "Siempre que sea posible, avísanos con la mayor antelación que puedas para que podamos ofrecer tu horario a otro estudiante y ayudarte a encontrar un mejor momento. Si necesitas cancelar, avísanos por tu canal de contacto habitual (por ejemplo, WhatsApp o correo electrónico)." },

    { type: "h", text: "5. Clase de prueba gratuita" },
    { type: "p", text: "Los nuevos estudiantes pueden reservar una clase de prueba gratuita para conocernos y planificar juntos el mejor camino de aprendizaje para ti. La clase de prueba es gratuita y no implica ninguna obligación de continuar. Se ofrece por estudiante, y podemos limitar la repetición de clases de prueba." },

    { type: "h", text: "6. Membresía" },
    { type: "list", items: [
      "La membresía se cobra mensualmente y se renueva automáticamente hasta que la canceles.",
      "Puedes cancelar tu membresía en cualquier momento. Al cancelar, conservarás el acceso hasta el final del periodo que ya hayas pagado, y no se te volverá a cobrar después de eso.",
      "Los precios promocionales o de introducción (por ejemplo, un primer mes con descuento) se aplican únicamente como se describe en el momento de tu registro; después se aplica el precio estándar.",
      "La membresía te da acceso al área de miembros y a su contenido tal como esté disponible en cada momento. Agregamos materiales nuevos con regularidad, pero el contenido específico disponible puede cambiar.",
    ] },

    { type: "h", text: "7. Reembolsos" },
    { type: "p", text: "Debido a que nuestras clases, materiales y contenido para miembros se entregan de forma digital, y a que los horarios de clase se reservan específicamente para ti, las tarifas por lo general no son reembolsables, salvo cuando la ley exija un reembolso. Las clases que ya se hayan tomado o contado como realizadas (incluidas las de la Sección 4) no son reembolsables. Si consideras que existen circunstancias excepcionales, contáctanos: siempre revisaremos tu situación de forma justa y de buena fe." },

    { type: "h", text: "8. Conducta del estudiante y comunidad" },
    { type: "p", text: "MundoLingu es una comunidad de aprendizaje amable y respetuosa. Al participar en las clases, las clases en vivo o cualquier espacio de MundoLingu, aceptas:" },
    { type: "list", items: [
      "Tratar a los profesores y a los demás estudiantes con cortesía y respeto.",
      "No grabar, compartir ni volver a publicar las clases, las clases en vivo o las aportaciones de otros estudiantes sin autorización.",
      "No usar los servicios de MundoLingu para ningún fin ilícito, dañino o abusivo.",
    ] },
    { type: "p", text: "Podemos suspender o cancelar el acceso de cualquier persona que se comporte de forma abusiva o incumpla estos Términos de forma reiterada, sin reembolso cuando corresponda." },

    { type: "h", text: "9. Materiales de aprendizaje y propiedad intelectual" },
    { type: "p", text: "Todas las clases, cuadernos de trabajo, videos, gráficos y demás materiales de MundoLingu son propiedad de MundoLingu (o se utilizan con autorización) y están protegidos por las leyes de propiedad intelectual. Se proporcionan únicamente para tu aprendizaje personal. Puedes descargar y usar los materiales para tus estudios, pero no puedes copiarlos, revenderlos, distribuirlos ni compartirlos públicamente sin nuestra autorización por escrito." },

    { type: "h", text: "10. Privacidad y tus datos" },
    { type: "p", text: "Recopilamos y usamos datos personales (como tu nombre, correo electrónico, número de teléfono y preferencias de aprendizaje) únicamente para prestar y mejorar nuestros servicios, organizar tus clases y comunicarnos contigo. No vendemos tus datos personales. Si deseas saber qué información tenemos sobre ti, o pedirnos que la actualicemos o eliminemos, contáctanos usando los datos que aparecen al final de estos Términos." },

    { type: "h", text: "11. Disponibilidad del servicio" },
    { type: "p", text: "Nos esforzamos por mantener las clases y el área de miembros funcionando sin problemas, pero los servicios en línea pueden verse afectados ocasionalmente por problemas técnicos, plataformas de terceros o situaciones fuera de nuestro control. Si una clase no puede realizarse por un problema de nuestra parte, la reprogramaremos o la devolveremos a tu paquete." },

    { type: "h", text: "12. Cambios en estos Términos" },
    { type: "p", text: "Podemos actualizar estos Términos ocasionalmente, por ejemplo, para reflejar nuevas funciones o requisitos legales. La versión más reciente siempre estará publicada en nuestro sitio web con la fecha actualizada. Si sigues usando nuestros servicios después de un cambio, significa que aceptas los Términos actualizados." },

    { type: "h", text: "13. Responsabilidad" },
    { type: "p", text: "MundoLingu ofrece educación y apoyo en idiomas para ayudarte a aprender, pero no podemos garantizar ningún resultado específico, calificación de examen ni nivel de fluidez, ya que el progreso depende de muchos factores, incluida tu propia práctica. En la medida máxima permitida por la ley, MundoLingu no se hace responsable de pérdidas indirectas o imprevisibles derivadas del uso de nuestros servicios. Nada en estos Términos limita los derechos que puedas tener y que no puedan excluirse por ley." },

    { type: "h", text: "14. Legislación aplicable" },
    { type: "p", text: "Estos Términos se rigen por las leyes de los Emiratos Árabes Unidos (Dubái), sin que ello afecte los derechos obligatorios de protección al consumidor que puedas tener en tu país de residencia." },

    { type: "h", text: "15. Contáctanos" },
    { type: "p", text: "Si tienes alguna pregunta sobre estos Términos o tus clases, con gusto te ayudamos:" },
    { type: "contact", items: [
      { label: "Correo electrónico", value: "mundolingu@gmail.com", href: "mailto:mundolingu@gmail.com" },
      { label: "WhatsApp", value: "+971 50 429 6090" },
      { label: "Sitio web", value: "www.mundolingu.com", href: "https://www.mundolingu.com" },
      { label: "Instagram", value: "@mundolingu" },
    ] },
    { type: "p", text: "Gracias por aprender con MundoLingu. Tenemos muchas ganas de ayudarte a alcanzar tus metas con los idiomas." },
  ],
};

export default function Terms() {
  const [lang, setLang] = useState<"en" | "es">("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);
  function sw(l: "en" | "es") { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  const doc = lang === "es" ? ES : EN;
  const back = lang === "es" ? "← Volver a MundoLingu" : "← Back to MundoLingu";

  return (
    <div className="blog-root">
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <div className="ml-langsw">
          <Globe size={14} />
          <button className={lang === "en" ? "on" : ""} onClick={() => sw("en")}>EN</button>
          <button className={lang === "es" ? "on" : ""} onClick={() => sw("es")}>ES</button>
        </div>
      </header>
      <article className="blog-article">
        <a href="/" className="blog-back">{back}</a>
        <h1 className="blog-title terms-h1">{doc.title}</h1>
        <p className="terms-sub">{doc.sub}</p>
        <p className="terms-updated">{doc.updated}</p>
        <div className="blog-body terms-body">
          {doc.body.map((b, i) => {
            if (b.type === "h") return <h2 key={i}>{b.text}</h2>;
            if (b.type === "sub") return <h3 key={i}>{b.text}</h3>;
            if (b.type === "list") return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  typeof it === "string"
                    ? <li key={j}>{it}</li>
                    : <li key={j}><b>{it.lead}</b> {it.text}</li>
                ))}
              </ul>
            );
            if (b.type === "contact") return (
              <ul className="terms-contact" key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    {it.label}:{" "}
                    {it.href
                      ? <a href={it.href} target={it.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">{it.value}</a>
                      : it.value}
                  </li>
                ))}
              </ul>
            );
            return <p key={i}>{b.text}</p>;
          })}
        </div>
      </article>
    </div>
  );
}
