// Shared shape for an opportunity as it travels over the API.
// Field names are snake_case here to match the JSON the API returns.
export type Opportunity = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  organisation: string | null;
  location: string | null;
  summary: string;
  body: string;
  apply_url: string | null;
  deadline: string | null;
  published: boolean;
  sort: number;
};

// Turns a title into a URL-safe slug. Accents are stripped so "Máster en Málaga"
// becomes "master-en-malaga" rather than losing the characters entirely.
export function slugify(title: string): string {
  const base = (title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return base || "opportunity";
}

// Dates arrive as "YYYY-MM-DD". Parsing with an explicit midnight keeps the day
// correct regardless of the reader's time zone.
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "";
  const d = new Date(String(deadline) + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
