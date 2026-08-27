/**
 * Time-zone helpers for live classes.
 *
 * Everything goes through Intl with an IANA zone id, so daylight saving is
 * handled for us — there are no fixed UTC offsets stored anywhere. A class
 * time is a single instant (`starts_at` is `timestamptz`); these helpers only
 * decide how that instant reads in each place a student might be sitting.
 */

export type Zone = { id: string; label: string; flag: string };

/** The regions MundoLingu teaches across. Five, to match the .tz-row grid. */
export const ZONES: Zone[] = [
  { id: "America/Mexico_City", label: "Mexico City", flag: "🇲🇽" },
  { id: "America/Bogota", label: "Bogotá · Lima", flag: "🇨🇴" },
  { id: "America/Argentina/Buenos_Aires", label: "Buenos Aires", flag: "🇦🇷" },
  { id: "Europe/Madrid", label: "Madrid", flag: "🇪🇸" },
  { id: "Asia/Dubai", label: "Dubai", flag: "🇦🇪" },
];

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, zone: string, opts: Intl.DateTimeFormatOptions) {
  const key = locale + "|" + zone + "|" + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: zone });
    } catch {
      // Unknown zone (very old browser, or a bad id) — fall back to UTC.
      f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" });
    }
    cache.set(key, f);
  }
  return f;
}

/** The viewer's own zone, e.g. "America/Mexico_City". */
export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** "America/New_York" -> "New York", so any viewer zone gets a readable label. */
export function zoneLabel(id: string): string {
  const tail = id.split("/").pop() || id;
  return tail.replace(/_/g, " ");
}

/** Clock time only, e.g. "6:00 PM". */
export function timeIn(iso: string, zone: string, locale = "en-US"): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return formatter(locale, zone, { hour: "numeric", minute: "2-digit" }).format(d);
}

/** Short zone name for the instant, e.g. "GMT+4" — DST-correct. */
export function zoneAbbr(iso: string, zone: string, locale = "en-US"): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = formatter(locale, zone, { hour: "numeric", timeZoneName: "short" }).formatToParts(d);
  return parts.find((p) => p.type === "timeZoneName")?.value || "";
}

/** Calendar day in a zone as YYYY-MM-DD, for comparing dates across zones. */
function dayKey(d: Date, zone: string): string {
  return formatter("en-CA", zone, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Whole days the class lands ahead of / behind `base` — usually 0, sometimes ±1. */
export function dayShift(iso: string, zone: string, base: string): number {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  const a = dayKey(d, zone);
  const b = dayKey(d, base);
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

/** Weekday + date in a zone, e.g. "Mon, Sep 1". */
export function dateIn(iso: string, zone: string, locale = "en-US"): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return formatter(locale, zone, { weekday: "short", month: "short", day: "numeric" }).format(d);
}

/** Full, unambiguous line: "Mon, Sep 1 · 6:00 PM GMT+4". */
export function fullInZone(iso: string, zone: string, locale = "en-US"): string {
  const date = dateIn(iso, zone, locale);
  if (!date) return "";
  const abbr = zoneAbbr(iso, zone, locale);
  return `${date} · ${timeIn(iso, zone, locale)}${abbr ? " " + abbr : ""}`;
}

export type ZoneTime = {
  id: string;
  flag: string;
  label: string;
  time: string;
  meta: string;
  dayShift: number;
  isLocal: boolean;
};

/**
 * The row of conversions shown under a live class: the viewer's own zone
 * first, then the teaching regions (skipping whichever one the viewer is
 * already in, so nothing is listed twice).
 */
export function zoneTimes(iso: string, locale = "en-US"): ZoneTime[] {
  const here = localZone();
  const out: ZoneTime[] = [
    {
      id: here,
      flag: "📍",
      label: "Your time",
      time: timeIn(iso, here, locale),
      meta: `${zoneLabel(here)} · ${zoneAbbr(iso, here, locale)}`,
      dayShift: 0,
      isLocal: true,
    },
  ];
  for (const z of ZONES) {
    if (z.id === here) continue;
    out.push({
      id: z.id,
      flag: z.flag,
      label: z.label,
      time: timeIn(iso, z.id, locale),
      meta: dateIn(iso, z.id, locale),
      dayShift: dayShift(iso, z.id, here),
      isLocal: false,
    });
  }
  return out;
}
