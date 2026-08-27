// Timezone-aware date/time helpers.
//
// The single rule of this file: one class = one real-world moment. That moment
// lives in Supabase as a `timestamptz` (an absolute instant). Everything below
// only ever *renders* that instant into a zone using Intl with an IANA id, so
// daylight-saving transitions are handled by the platform's own tz database.
// There is no arithmetic on hours anywhere in this file, and no fixed offsets.

import { MASTER_TZ } from "./timezones";

export { MASTER_TZ };

/* ------------------------------------------------------------------ parsing */

export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The wall-clock reading of `date` in `tz`, expressed as a UTC epoch. */
function wallClockEpoch(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const g: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") g[p.type] = p.value;

  return Date.UTC(
    Number(g.year),
    Number(g.month) - 1,
    Number(g.day),
    Number(g.hour) % 24,
    Number(g.minute),
    Number(g.second)
  );
}

/** How far `tz` is from UTC at that specific instant (DST included). */
export function zoneOffsetMs(date: Date, tz: string): number {
  return wallClockEpoch(date, tz) - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Turn a wall-clock reading in `tz` into the absolute instant it names.
 * Two passes so the offset used is the one in force at the resulting instant —
 * that is what makes it correct across a daylight-saving boundary.
 */
export function zonedWallClockToInstant(
  year: number,
  month: number, // 1-12
  day: number,
  hour = 0,
  minute = 0,
  tz: string = MASTER_TZ
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = naive - zoneOffsetMs(new Date(naive), tz);
  guess = naive - zoneOffsetMs(new Date(guess), tz);
  return new Date(guess);
}

/**
 * A `date` column ("2026-09-15") plus an optional `time` column ("18:00:00"),
 * both read as Dubai wall-clock, resolved to the instant they describe.
 */
export function dubaiDateTimeToInstant(dateStr: string, timeStr?: string | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || ""));
  if (!m) return null;
  let hour = 0;
  let minute = 0;
  if (timeStr) {
    const t = /^(\d{1,2}):(\d{2})/.exec(String(timeStr));
    if (t) {
      hour = Number(t[1]);
      minute = Number(t[2]);
    }
  }
  return zonedWallClockToInstant(Number(m[1]), Number(m[2]), Number(m[3]), hour, minute, MASTER_TZ);
}

/* --------------------------------------------------------------- formatting */

// The hub already reads dates as "Tue, Sep 15" and times as "6:00 PM", so short
// dates and times stay on en-US. Full dates use en-GB purely for the
// day-first "15 September 2026" reading used on the published schedule.
const SHORT_LOCALE = "en-US";
const LONG_DATE_LOCALE = "en-GB";

function fmt(date: Date, tz: string, opts: Intl.DateTimeFormatOptions, locale = SHORT_LOCALE): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: tz, ...opts }).format(date);
  } catch {
    // An unknown tz should never make a class disappear — fall back to UTC.
    return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...opts }).format(date);
  }
}

/** "15 September 2026" */
export function formatLongDate(date: Date, tz: string): string {
  return fmt(date, tz, { day: "numeric", month: "long", year: "numeric" }, LONG_DATE_LOCALE);
}

/** "Tue, 15 Sep" */
export function formatShortDate(date: Date, tz: string): string {
  return fmt(date, tz, { weekday: "short", day: "numeric", month: "short" });
}

/** "6:00 PM" */
export function formatTime(date: Date, tz: string): string {
  return fmt(date, tz, { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "Tue, 15 Sep · 6:00 PM" */
export function formatShortDateTime(date: Date, tz: string): string {
  return `${formatShortDate(date, tz)} · ${formatTime(date, tz)}`;
}

/** "GMT+4" / "GMT-6" — for the selector, so customers can sanity-check. */
export function formatOffset(date: Date, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    if (name) return name === "GMT" ? "GMT+0" : name;
  } catch {}
  return "";
}

/** Day-in-zone key, for "is this the same calendar day where you are?". */
export function dayKey(date: Date, tz: string): string {
  return fmt(date, tz, { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** Two-letter day badge pieces used by the existing events list. */
export function dayBadge(date: Date, tz: string): { day: string; mon: string } {
  return {
    day: fmt(date, tz, { day: "2-digit" }),
    mon: fmt(date, tz, { month: "short" }),
  };
}

/* -------------------------------------------------------------------- status */

export type LiveState = "upcoming" | "soon" | "live" | "ended";

export const DEFAULT_DURATION_MIN = 60;
/** How close to the start "Starting soon" kicks in. */
const SOON_MS = 30 * 60 * 1000;

/**
 * Status is derived from absolute instants only, never from a rendered local
 * string — so every customer worldwide sees the same class in the same state.
 */
export function liveState(start: Date, durationMin: number, now: number): LiveState {
  const startMs = start.getTime();
  const endMs = startMs + Math.max(1, durationMin) * 60 * 1000;
  if (now >= endMs) return "ended";
  if (now >= startMs) return "live";
  if (startMs - now <= SOON_MS) return "soon";
  return "upcoming";
}

export function stateLabel(state: LiveState): string {
  switch (state) {
    case "live":
      return "LIVE NOW";
    case "soon":
      return "STARTING SOON";
    case "ended":
      return "ENDED";
    default:
      return "UPCOMING";
  }
}

/**
 * "Starts in 2 hours 15 minutes" / "Starts today at 6:00 PM" — always computed
 * from the absolute instant, then phrased using the customer's own zone.
 */
export function countdownText(start: Date, tz: string, now: number, durationMin = DEFAULT_DURATION_MIN): string {
  const state = liveState(start, durationMin, now);
  if (state === "live") return "Happening right now";
  if (state === "ended") return "This class has finished";

  const ms = start.getTime() - now;
  const mins = Math.round(ms / 60000);

  if (mins <= 1) return "Starts in less than a minute";
  if (mins < 60) return `Starts in ${mins} minute${mins === 1 ? "" : "s"}`;

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) {
    const h = `${hours} hour${hours === 1 ? "" : "s"}`;
    return rem ? `Starts in ${h} ${rem} minute${rem === 1 ? "" : "s"}` : `Starts in ${h}`;
  }

  const today = dayKey(new Date(now), tz);
  const tomorrow = dayKey(new Date(now + 86400000), tz);
  const target = dayKey(start, tz);
  if (target === today) return `Starts today at ${formatTime(start, tz)}`;
  if (target === tomorrow) return `Starts tomorrow at ${formatTime(start, tz)}`;

  const days = Math.floor(hours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"} — ${formatShortDateTime(start, tz)}`;
}
