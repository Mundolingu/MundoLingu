// Times for live classes and events are entered in Supabase as UAE (Dubai) clock
// time — see the notes at the top of supabase/schema.sql. UAE is the single source
// of truth: nothing else is ever stored. Every other clock on the site is derived
// from it here, at render time, using real IANA zones so daylight saving is
// applied automatically for whatever date the class or event falls on.

export const UAE_TZ = "Asia/Dubai";
export const MX_TZ = "America/Mexico_City";

export const UAE_LABEL = "UAE";
export const MX_LABEL = "Mexico";

/**
 * The regions we publish times for, in reading order. Each one is a real IANA
 * zone, so offsets and daylight-saving switches come from the system's timezone
 * database instead of being hardcoded — the gap between Dubai and New York, for
 * example, is 8h in summer and 9h in winter, and that is handled for us.
 *
 * Chosen to match where MundoLingu members actually are (Mexico and Latin
 * America, Europe, the UAE) with one representative city per region:
 *   Mexico  → Mexico City (the whole community's reference, no DST since 2022)
 *   USA     → New York (US Eastern, the usual reference for US times)
 *   Europe  → Madrid (Central European Time, the Spanish-speaking anchor)
 *   Asia    → Tokyo (a stable, widely understood East-Asian reference)
 * Add or change a region here and it updates everywhere it is shown.
 */
export type Zone = { key: string; flag: string; label: string; tz: string };

export const ZONES: Zone[] = [
  { key: "uae", flag: "🇦🇪", label: "UAE", tz: UAE_TZ },
  { key: "mexico", flag: "🇲🇽", label: "Mexico", tz: MX_TZ },
  { key: "usa", flag: "🇺🇸", label: "USA", tz: "America/New_York" },
  { key: "europe", flag: "🇪🇺", label: "Europe", tz: "Europe/Madrid" },
  { key: "asia", flag: "🌏", label: "Asia", tz: "Asia/Tokyo" },
];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
// Accepts every shape Postgres/PostgREST hands back or an admin may type:
// "…Z", "…+00:00", "…+0400" and the short "…+04" the Table Editor allows.
const HAS_OFFSET = /(Z|[+-]\d{2}(:?\d{2})?)$/;

// Dubai is UTC+4 all year (no daylight saving), so the offset is safe to hardcode.
const UAE_OFFSET = "+04:00";

/** "+04" / "+0400" / "+04:00" all become "+04:00" — only that form parses everywhere. */
function canonicalOffset(offset: string): string {
  if (offset === "Z") return "Z";
  const digits = offset.slice(1).replace(":", "");
  return `${offset[0]}${digits.slice(0, 2)}:${digits.length > 2 ? digits.slice(2, 4) : "00"}`;
}

function normalize(raw: string): string {
  if (DATE_ONLY.test(raw)) return `${raw}T00:00:00${UAE_OFFSET}`;
  const iso = raw.replace(" ", "T");
  const offset = iso.match(HAS_OFFSET);
  // A value stored without a zone means "the time I typed in Supabase", i.e. UAE time.
  if (!offset) return `${iso}${UAE_OFFSET}`;
  return iso.slice(0, iso.length - offset[0].length) + canonicalOffset(offset[0]);
}

/** Turn a Supabase `timestamptz` / `date` value into a real instant. */
export function parseWhen(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(normalize(String(value).trim()));
  return isNaN(d.getTime()) ? null : d;
}

/** True when the value carries a clock time (and not just a calendar day). */
export function hasTime(value: string | null | undefined): boolean {
  if (!value) return false;
  return !DATE_ONLY.test(String(value).trim());
}

function fmt(d: Date, tz: string, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(d);
  } catch {
    return "";
  }
}

export function formatDay(d: Date, tz: string): string {
  return fmt(d, tz, { weekday: "short", month: "short", day: "numeric" });
}

export function formatTime(d: Date, tz: string): string {
  return fmt(d, tz, { hour: "numeric", minute: "2-digit" });
}

export function formatDayTime(d: Date, tz: string): string {
  const day = formatDay(d, tz);
  const time = formatTime(d, tz);
  return day && time ? `${day} · ${time}` : day || time;
}

export function dayNumber(d: Date, tz: string): string {
  return fmt(d, tz, { day: "2-digit" });
}

export function monthShort(d: Date, tz: string): string {
  return fmt(d, tz, { month: "short" });
}

export function weekdayLong(d: Date, tz: string): string {
  return fmt(d, tz, { weekday: "long" });
}

export type ZonedWhen = { key: string; flag: string; label: string; tz: string; time: string; day: string; full: string; dayShift: number };

/** Calendar day in a zone as YYYY-MM-DD, so two zones can be compared safely. */
function isoDay(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return "";
  }
}

/** Whole days between two YYYY-MM-DD strings (b - a). */
function dayGap(a: string, b: string): number {
  if (!a || !b) return 0;
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Number.isNaN(ms) ? 0 : Math.round(ms / 86400000);
}

/**
 * The same instant on every clock we publish. `dayShift` says whether that region
 * is already on the next day (+1) or still on the previous one (-1) compared with
 * the UAE date — a 23:00 Dubai class is 04:00 the *next* morning in Tokyo, and
 * members need to see that rather than guess it.
 */
export function zonedTimes(d: Date, zones: Zone[] = ZONES): ZonedWhen[] {
  const base = isoDay(d, UAE_TZ);
  return zones.map((z) => ({
    key: z.key,
    flag: z.flag,
    label: z.label,
    tz: z.tz,
    time: formatTime(d, z.tz),
    day: formatDay(d, z.tz),
    full: formatDayTime(d, z.tz),
    dayShift: dayGap(base, isoDay(d, z.tz)),
  }));
}

/** Same as `zonedTimes`, straight from a raw Supabase value. */
export function zonedWhen(value: string | null | undefined): ZonedWhen[] {
  const d = parseWhen(value);
  return d ? zonedTimes(d) : [];
}

/** One week, in milliseconds. Dubai has no daylight saving, so adding this to an
 *  instant always lands on the same weekday at the same time on the UAE clock. */
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
