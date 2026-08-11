export type Block = { type: "p" | "h" | "list"; text?: string; items?: string[] };
export type PostContent = { title: string; excerpt: string; body: Block[] };
export type Post = {
  slug: string;
  date: string;
  readMins: number;
  tag: { en: string; es: string };
  en: PostContent;
  es: PostContent;
};

export const POSTS: Post[] = [
  {
    slug: "english-phrases-job-interview",
    date: "2026-07-16",
    readMins: 4,
    tag: { en: "Career", es: "Carrera" },
    en: {
      title: "10 English phrases that make job interviews easier",
      excerpt: "Walk into your next interview sounding calm and confident with these ready-to-use lines.",
      body: [
        { type: "p", text: `A job interview in English can feel like the highest-stakes conversation of your life. The good news? You don't need perfect grammar — you need a handful of natural phrases you can lean on when the pressure is on. Here are ten that work in almost any interview.` },
        { type: "list", items: [
          `"Thanks for having me — I'm excited to be here." A warm, confident opener.`,
          `"Let me tell you a bit about my background..." Buys you a second and signals structure.`,
          `"In my previous role, I was responsible for..." The clearest way to describe experience.`,
          `"A good example of that would be..." Turns a vague claim into a real story.`,
          `"I really enjoy working in a team, but I'm also comfortable taking the lead."`,
          `"That's a great question. Let me think for a moment." It's completely fine to pause.`,
          `"What I'm looking for in my next role is..." Shows intention, not desperation.`,
          `"Could you tell me more about the team I'd be working with?" Great questions impress.`,
          `"I'm confident I can bring value here because..."`,
          `"Thank you for your time — I'd love to be part of this." A strong, memorable close.`,
        ] },
        { type: "p", text: `Practise these out loud until they feel automatic. When your opening and closing lines are solid, everything in between gets easier — and you sound like someone who belongs in the room.` },
      ],
    },
    es: {
      title: "10 frases en inglés para entrevistas de trabajo",
      excerpt: "Entra a tu próxima entrevista sonando tranquilo y seguro con estas frases listas para usar.",
      body: [
        { type: "p", text: `Una entrevista de trabajo en inglés puede sentirse como la conversación más importante de tu vida. ¿La buena noticia? No necesitas una gramática perfecta, necesitas un puñado de frases naturales en las que apoyarte cuando llega la presión. Aquí tienes diez que funcionan en casi cualquier entrevista.` },
        { type: "list", items: [
          `"Thanks for having me — I'm excited to be here." — un inicio cálido y con confianza.`,
          `"Let me tell you a bit about my background..." — te da un segundo y muestra estructura.`,
          `"In my previous role, I was responsible for..." — la forma más clara de describir tu experiencia.`,
          `"A good example of that would be..." — convierte una idea vaga en una historia real.`,
          `"I really enjoy working in a team, but I'm also comfortable taking the lead." — el equilibrio perfecto.`,
          `"That's a great question. Let me think for a moment." — está perfectamente bien hacer una pausa.`,
          `"What I'm looking for in my next role is..." — muestra intención, no desesperación.`,
          `"Could you tell me more about the team I'd be working with?" — las buenas preguntas impresionan.`,
          `"I'm confident I can bring value here because..."`,
          `"Thank you for your time — I'd love to be part of this." — un cierre fuerte y memorable.`,
        ] },
        { type: "p", text: `Practica estas frases en voz alta hasta que te salgan solas. Cuando tu inicio y tu cierre son sólidos, todo lo del medio se vuelve más fácil, y suenas como alguien que pertenece a ese lugar.` },
      ],
    },
  },
  {
    slug: "stop-translating-in-your-head",
    date: "2026-07-29",
    readMins: 3,
    tag: { en: "Fluency", es: "Fluidez" },
    en: {
      title: "How to stop translating in your head",
      excerpt: "The mental habit that slows every learner down — and four ways to finally break it.",
      body: [
        { type: "p", text: `Almost every language learner hits the same wall: you hear a question, translate it into your native language, think of an answer, translate it back, and then finally speak. By the time you do, the conversation has moved on. Translating in your head is exhausting — and it's one of the biggest things standing between you and fluency. Here's how to start thinking directly in your new language.` },
        { type: "h", text: `1. Name the things around you` },
        { type: "p", text: `Throughout your day, silently label objects, actions and feelings in the language you're learning. No translation — just the word and the thing. This builds a direct link between meaning and language.` },
        { type: "h", text: `2. Learn phrases, not just words` },
        { type: "p", text: `Fluent speakers don't build every sentence from scratch. They reuse chunks — "do you mind if...", "I was just about to...". Collect these and they'll come out automatically, no translation required.` },
        { type: "h", text: `3. Think in simple sentences` },
        { type: "p", text: `You don't need complex grammar to think in a language. Start narrating your day in short, simple sentences: "I'm making coffee. It's cold today. I need to reply to that email." Simple and direct beats perfect and slow.` },
        { type: "h", text: `4. Talk to yourself` },
        { type: "p", text: `It sounds silly, but rehearsing everyday thoughts out loud trains your brain to produce the language without a middle step. The more you do it, the faster real conversations feel.` },
        { type: "p", text: `None of this happens overnight — but every time you catch yourself thinking directly, that's fluency being built. Be patient, and keep going.` },
      ],
    },
    es: {
      title: "Cómo dejar de traducir en tu cabeza",
      excerpt: "El hábito mental que frena a todos los estudiantes, y cuatro formas de romperlo por fin.",
      body: [
        { type: "p", text: `Casi todos los estudiantes de idiomas chocan con la misma pared: escuchas una pregunta, la traduces a tu idioma, piensas una respuesta, la traduces de vuelta y por fin hablas. Para cuando lo haces, la conversación ya avanzó. Traducir en tu cabeza es agotador, y es una de las cosas más grandes que se interponen entre tú y la fluidez. Así puedes empezar a pensar directamente en tu nuevo idioma.` },
        { type: "h", text: `1. Nombra las cosas a tu alrededor` },
        { type: "p", text: `A lo largo del día, etiqueta en silencio objetos, acciones y emociones en el idioma que aprendes. Sin traducir, solo la palabra y la cosa. Esto crea un vínculo directo entre el significado y el idioma.` },
        { type: "h", text: `2. Aprende frases, no solo palabras` },
        { type: "p", text: `Quienes hablan con fluidez no construyen cada oración desde cero. Reutilizan bloques: "do you mind if...", "I was just about to...". Colecciónalos y saldrán solos, sin traducir.` },
        { type: "h", text: `3. Piensa en oraciones simples` },
        { type: "p", text: `No necesitas gramática compleja para pensar en un idioma. Empieza a narrar tu día en oraciones cortas y simples: "I'm making coffee. It's cold today." Lo simple y directo gana a lo perfecto y lento.` },
        { type: "h", text: `4. Habla contigo mismo` },
        { type: "p", text: `Suena tonto, pero ensayar en voz alta tus pensamientos cotidianos entrena a tu cerebro para producir el idioma sin un paso intermedio. Cuanto más lo haces, más rápidas se sienten las conversaciones reales.` },
        { type: "p", text: `Nada de esto pasa de la noche a la mañana, pero cada vez que te descubras pensando directamente, es fluidez que estás construyendo. Ten paciencia y sigue adelante.` },
      ],
    },
  },
  {
    slug: "signs-ready-to-live-abroad",
    date: "2026-08-06",
    readMins: 3,
    tag: { en: "Moving abroad", es: "Mudarte" },
    en: {
      title: "5 signs you're ready to live abroad — language-wise",
      excerpt: "Moving to a new country? Here's how to know your language is ready for the leap.",
      body: [
        { type: "p", text: `Moving abroad is one of the bravest things you can do — and your language level plays a huge part in how smooth those first months feel. You don't need to be perfect (nobody is), but here are five signs you're ready to thrive, not just survive.` },
        { type: "list", items: [
          `You can handle the "boring" stuff. Booking appointments, asking for directions, sorting out a phone plan — the unglamorous admin of daily life feels manageable.`,
          `You can make small talk. A quick chat with a neighbour or colleague doesn't fill you with dread. Real connection starts here.`,
          `You can ask for help — and understand the answer. The skill isn't knowing everything; it's saying "I don't understand, could you repeat that?" with confidence.`,
          `You recover from mistakes. You mix up a word, laugh, and carry on. That resilience matters more than a big vocabulary.`,
          `You think in the language sometimes. Even small moments — counting, a stray thought — mean the language is becoming part of you.`,
        ] },
        { type: "p", text: `If most of these sound like you, you're more ready than you think. And if they don't yet? That's exactly what a focused plan is for — we'll get you there before you pack a single box.` },
      ],
    },
    es: {
      title: "5 señales de que estás listo para vivir en el extranjero",
      excerpt: "¿Te mudas a un nuevo país? Así sabes si tu idioma está listo para el salto.",
      body: [
        { type: "p", text: `Mudarte al extranjero es una de las cosas más valientes que puedes hacer, y tu nivel de idioma influye muchísimo en lo tranquilos que se sienten esos primeros meses. No necesitas ser perfecto (nadie lo es), pero aquí tienes cinco señales de que estás listo para prosperar, no solo sobrevivir.` },
        { type: "list", items: [
          `Puedes con lo "aburrido". Agendar citas, pedir indicaciones, contratar un plan de teléfono: el papeleo poco glamoroso del día a día se siente manejable.`,
          `Puedes hacer conversación ligera. Una charla rápida con un vecino o colega no te llena de miedo. La conexión real empieza aquí.`,
          `Puedes pedir ayuda y entender la respuesta. La habilidad no es saberlo todo, es decir "I don't understand, could you repeat that?" con confianza.`,
          `Te recuperas de los errores. Confundes una palabra, te ríes y sigues. Esa resiliencia importa más que un vocabulario enorme.`,
          `A veces piensas en el idioma. Incluso momentos pequeños (contar, un pensamiento suelto) significan que el idioma se está volviendo parte de ti.`,
        ] },
        { type: "p", text: `Si la mayoría te suena, estás más listo de lo que crees. ¿Y si todavía no? Para eso existe un plan enfocado: te llevamos ahí antes de que empaques una sola caja.` },
      ],
    },
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
