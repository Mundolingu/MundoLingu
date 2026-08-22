// Everything the opportunities board agrees on: the shape of a listing, the
// vocabularies the filters and the admin form share, and the few helpers used on
// both the public page and the admin screen. One place to change, so the board
// and the form can never drift apart.

export type Opportunity = {
  id: string;
  title: string;
  company_name: string;
  company_id: string | null;
  description: string | null;
  requirements: string | null;
  category: string | null;
  location: string | null;
  country: string | null;
  work_type: string | null;
  language_requirements: string | null;
  english_level: string | null;
  salary: string | null;
  application_url: string | null;
  application_email: string | null;
  deadline: string | null;
  status: string;
  is_paid: boolean;
  payment_status: string;
  payment_id: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

// The columns the public board needs. Listed explicitly so a future private
// column (an internal note, a contact's phone number) is never served by accident.
export const PUBLIC_COLUMNS =
  "id,title,company_name,description,requirements,category,location,country,work_type,language_requirements,english_level,salary,application_url,application_email,deadline,published_at,expires_at,created_at";

export const WORK_TYPES = [
  { value: "remote", en: "Remote", es: "Remoto" },
  { value: "on-site", en: "On-site", es: "Presencial" },
  { value: "hybrid", en: "Hybrid", es: "Híbrido" },
];

// CEFR levels, written the way a job ad writes them.
export const ENGLISH_LEVELS = ["A2+", "B1+", "B2+", "C1+", "C2 / Native"];

export const CATEGORIES = [
  "Software & IT",
  "Customer support",
  "Sales",
  "Marketing",
  "Finance & admin",
  "Education",
  "Design",
  "Operations",
  "Other",
];

export const STATUSES = ["draft", "published", "archived"];
export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "refunded"];

/** How long a paid listing stays up when no deadline is given. */
export const LISTING_DAYS = 30;

export function workTypeLabel(value: string | null | undefined, lang: "en" | "es" = "en"): string {
  const found = WORK_TYPES.find((w) => w.value === value);
  return found ? found[lang] : value || "";
}

/** Published, not archived, and not past its expiry — what a visitor may see. */
export function isLive(o: Pick<Opportunity, "status" | "expires_at">, now = Date.now()): boolean {
  if (o.status !== "published") return false;
  if (!o.expires_at) return true;
  const t = Date.parse(o.expires_at);
  return Number.isNaN(t) || t > now;
}

/** "Posted today" / "Posted 3 days ago" / a plain date once it is older than a month. */
export function postedLabel(value: string | null | undefined, lang: "en" | "es" = "en"): string {
  const t = value ? Date.parse(value) : NaN;
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return lang === "es" ? "Publicado hoy" : "Posted today";
  if (days === 1) return lang === "es" ? "Publicado ayer" : "Posted yesterday";
  if (days < 30) return lang === "es" ? `Publicado hace ${days} días` : `Posted ${days} days ago`;
  return (lang === "es" ? "Publicado el " : "Posted ") + formatDate(value, lang);
}

/** A plain calendar date. Deadlines are whole days, so no timezone maths applies. */
export function formatDate(value: string | null | undefined, lang: "en" | "es" = "en"): string {
  if (!value) return "";
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return "";
  }
}

/** True once the closing date has passed (the whole closing day still counts). */
export function isClosed(deadline: string | null | undefined, now = Date.now()): boolean {
  if (!deadline) return false;
  const t = Date.parse(`${String(deadline).slice(0, 10)}T23:59:59Z`);
  return !Number.isNaN(t) && t < now;
}

/** Where "Apply now" points: the company's link, or an email fallback. */
export function applyHref(o: Pick<Opportunity, "application_url" | "application_email" | "title">): string | null {
  if (o.application_url) return o.application_url;
  if (o.application_email) {
    return `mailto:${o.application_email}?subject=${encodeURIComponent(`Application — ${o.title}`)}`;
  }
  return null;
}

/** The unique values of one column across the listings, for a filter dropdown. */
export function optionsFor(rows: Opportunity[], key: keyof Opportunity): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) seen.add(v.trim());
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}
