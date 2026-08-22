// Times for live classes and events are entered in Supabase as UAE (Dubai) clock
// time — see the notes at the top of supabase/schema.sql. Everything is rendered
// here in both UAE and Mexico City time so members in either country know exactly
// when to show up.

export const UAE_TZ = "Asia/Dubai";
export const MX_TZ = "America/Mexico_City";

export const UAE_LABEL = "UAE";
export const MX_LABEL = "Mexico";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

// Dubai is UTC+4 all year (no daylight saving), so the offset is safe to hardcode.
const UAE_OFFSET = "+04:00";

function normalize(raw: string): string {
  if (DATE_ONLY.test(raw)) return `${raw}T00:00:00${UAE_OFFSET}`;
  const iso = raw.replace(" ", "T");
  // A value stored without a zone means "the time I typed in Supabase", i.e. UAE time.
  return HAS_OFFSET.test(iso) ? iso : `${iso}${UAE_OFFSET}`;
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

export type ZonedWhen = { label: string; text: string };

/**
 * The same moment written out for both audiences. Each line carries its own date
 * because the 10-hour gap regularly puts Dubai and Mexico City on different days.
 */
export function dualFor(d: Date, timed: boolean): ZonedWhen[] {
  if (!timed) return [{ label: "", text: formatDay(d, UAE_TZ) }];
  return [
    { label: UAE_LABEL, text: formatDayTime(d, UAE_TZ) },
    { label: MX_LABEL, text: formatDayTime(d, MX_TZ) },
  ];
}

export function dualWhen(value: string | null | undefined): ZonedWhen[] {
  const d = parseWhen(value);
  return d ? dualFor(d, hasTime(value)) : [];
}

/** One week, in milliseconds. Dubai has no daylight saving, so adding this to an
 *  instant always lands on the same weekday at the same time on the UAE clock. */
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
