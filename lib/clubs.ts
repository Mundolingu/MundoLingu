// ============================================================
// THE THREE PAID CLUBS — edit prices, names and wording here.
// Used by the homepage, the "join a club" payment page and the members hub.
// ============================================================

export type ClubId = "conversation" | "spanish" | "exam";
export const CLUB_IDS: ClubId[] = ["conversation", "spanish", "exam"];

// First-month discount code (people type it at checkout / mention it when paying).
export const PROMO_CODE = "FIRST25";
export const PROMO_PERCENT = 25;

type Txt = { en: string; es: string; ar: string };
type List = { en: string[]; es: string[]; ar: string[] };

export type Club = {
  id: ClubId;
  usd: number; // monthly price in US dollars
  aed: number; // monthly price in UAE dirhams
  // Stripe Payment Link (https://buy.stripe.com/...). Set it in Netlify as an
  // environment variable (NEXT_PUBLIC_STRIPE_LINK_CONVERSATION / _SPANISH / _EXAM),
  // or paste it between the quotes below. Empty = bank-transfer fallback is shown.
  stripeLink: string;
  color: string;
  name: Txt;
  for: Txt;
  includes: List;
};

export const CLUBS: Record<ClubId, Club> = {
  conversation: {
    id: "conversation",
    usd: 15,
    aed: 60,
    stripeLink: process.env.NEXT_PUBLIC_STRIPE_LINK_CONVERSATION || "",
    color: "var(--teal)",
    name: { en: "Conversation Club", es: "Club de conversación", ar: "نادي المحادثة" },
    for: {
      en: "Speak English with confidence, every single week.",
      es: "Habla inglés con seguridad, cada semana.",
      ar: "تحدّث الإنجليزية بثقة، كل أسبوع.",
    },
    includes: {
      en: ["A weekly live conversation class", "All our student books, A1 to B2", "A new themed book every month (all levels)", "Personal feedback from a professional teacher"],
      es: ["Una clase de conversación en vivo cada semana", "Todos nuestros libros del alumno, de A1 a B2", "Un libro temático nuevo cada mes (todos los niveles)", "Feedback personal de un profe profesional"],
      ar: ["حصة محادثة مباشرة كل أسبوع", "جميع كتب الطالب لدينا، من A1 إلى B2", "كتاب جديد بموضوع مختلف كل شهر (لجميع المستويات)", "ملاحظات شخصية من معلم محترف"],
    },
  },
  spanish: {
    id: "spanish",
    usd: 15,
    aed: 60,
    stripeLink: process.env.NEXT_PUBLIC_STRIPE_LINK_SPANISH || "",
    color: "var(--orange)",
    name: { en: "Spanish Club", es: "Club de español", ar: "نادي الإسبانية" },
    for: {
      en: "Learn and speak Spanish for work, travel and life abroad.",
      es: "Aprende y habla español para el trabajo, los viajes y la vida en el extranjero.",
      ar: "تعلّم الإسبانية وتحدّثها للعمل والسفر والحياة في الخارج.",
    },
    includes: {
      en: ["A weekly live Spanish class", "All our Spanish student books, A1 to B2", "A new themed book every month (all levels)", "Personal feedback from a professional teacher"],
      es: ["Una clase de español en vivo cada semana", "Todos nuestros libros de español, de A1 a B2", "Un libro temático nuevo cada mes (todos los niveles)", "Feedback personal de un profe profesional"],
      ar: ["حصة إسبانية مباشرة كل أسبوع", "جميع كتب الطالب للإسبانية، من A1 إلى B2", "كتاب جديد بموضوع مختلف كل شهر (لجميع المستويات)", "ملاحظات شخصية من معلم محترف"],
    },
  },
  exam: {
    id: "exam",
    usd: 20,
    aed: 75,
    stripeLink: process.env.NEXT_PUBLIC_STRIPE_LINK_EXAM || "",
    color: "var(--navy)",
    name: { en: "Exam Club", es: "Club de exámenes", ar: "نادي الاختبارات" },
    for: {
      en: "Weekly exam practice for IELTS, TOEFL and PTE.",
      es: "Práctica semanal de examen para IELTS, TOEFL y PTE.",
      ar: "تدريب أسبوعي على اختبارات IELTS وTOEFL وPTE.",
    },
    includes: {
      en: ["A weekly live exam class", "Special books for every exam: IELTS, TOEFL and PTE", "Personal feedback on your exam book work", "Strategies for every part of the test"],
      es: ["Una clase de examen en vivo cada semana", "Libros especiales para cada examen: IELTS, TOEFL y PTE", "Feedback personal sobre tu trabajo en los libros", "Estrategias para cada parte del examen"],
      ar: ["حصة اختبار مباشرة كل أسبوع", "كتب خاصة لكل اختبار: IELTS وTOEFL وPTE", "ملاحظات شخصية على عملك في كتب الاختبار", "استراتيجيات لكل جزء من الاختبار"],
    },
  },
};

// 15 -> "15", 11.25 -> "11.25"
export function money(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

// Price after the first-month discount, e.g. 15 -> 11.25
export function firstMonth(n: number): string {
  return money(Math.round(n * (100 - PROMO_PERCENT)) / 100);
}

// Stripe link with the discount code and email already filled in.
// client_reference_id tells our webhook WHICH member paid for WHICH club,
// so the club unlocks automatically (format: <supabase user id>__<club>).
export function stripeHref(club: Club, email?: string, userId?: string): string {
  if (!club.stripeLink) return "";
  const p = new URLSearchParams({ prefilled_promo_code: PROMO_CODE });
  if (email) p.set("prefilled_email", email);
  if (userId) p.set("client_reference_id", `${userId}__${club.id}`);
  return `${club.stripeLink}${club.stripeLink.includes("?") ? "&" : "?"}${p.toString()}`;
}

// Which clubs a profile row has access to.
// Before the new database columns exist, an old "is_member" member counts as Conversation Club.
export function clubsOf(profile: any): ClubId[] {
  if (!profile) return [];
  const hasColumns = "club_conversation" in profile || "club_spanish" in profile || "club_exam" in profile;
  if (!hasColumns) return profile.is_member ? ["conversation"] : [];
  return CLUB_IDS.filter((id) => profile[`club_${id}`] === true);
}

export function isClubId(x: unknown): x is ClubId {
  return typeof x === "string" && (CLUB_IDS as string[]).includes(x);
}
