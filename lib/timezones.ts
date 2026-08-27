// Friendly timezone catalogue for MundoLingu.
//
// Customers pick a plain city name; the app only ever stores and works with the
// real IANA identifier (e.g. "America/Mexico_City"). Never a fixed offset —
// offsets change twice a year in most of these places, IANA ids do not.

export type Zone = { id: string; label: string; flag: string; region: string };

// Dubai is the scheduling / reference zone. Classes are created in this zone.
export const MASTER_TZ = "Asia/Dubai";
export const MASTER_LABEL = "Dubai";

export const ZONES: Zone[] = [
  // Middle East
  { id: "Asia/Dubai", label: "Dubai / UAE", flag: "🇦🇪", region: "Middle East" },
  { id: "Asia/Riyadh", label: "Riyadh", flag: "🇸🇦", region: "Middle East" },
  { id: "Asia/Qatar", label: "Doha", flag: "🇶🇦", region: "Middle East" },

  // Europe & UK
  { id: "Europe/London", label: "London", flag: "🇬🇧", region: "Europe" },
  { id: "Europe/Dublin", label: "Dublin", flag: "🇮🇪", region: "Europe" },
  { id: "Europe/Lisbon", label: "Lisbon", flag: "🇵🇹", region: "Europe" },
  { id: "Europe/Madrid", label: "Madrid", flag: "🇪🇸", region: "Europe" },
  { id: "Europe/Paris", label: "Paris", flag: "🇫🇷", region: "Europe" },
  { id: "Europe/Brussels", label: "Brussels", flag: "🇧🇪", region: "Europe" },
  { id: "Europe/Amsterdam", label: "Amsterdam", flag: "🇳🇱", region: "Europe" },
  { id: "Europe/Berlin", label: "Berlin", flag: "🇩🇪", region: "Europe" },
  { id: "Europe/Zurich", label: "Zurich", flag: "🇨🇭", region: "Europe" },
  { id: "Europe/Rome", label: "Rome", flag: "🇮🇹", region: "Europe" },
  { id: "Europe/Vienna", label: "Vienna", flag: "🇦🇹", region: "Europe" },
  { id: "Europe/Warsaw", label: "Warsaw", flag: "🇵🇱", region: "Europe" },
  { id: "Europe/Athens", label: "Athens", flag: "🇬🇷", region: "Europe" },
  { id: "Europe/Istanbul", label: "Istanbul", flag: "🇹🇷", region: "Europe" },
  { id: "Europe/Moscow", label: "Moscow", flag: "🇷🇺", region: "Europe" },

  // Americas
  { id: "America/Mexico_City", label: "Mexico City", flag: "🇲🇽", region: "Americas" },
  { id: "America/Tijuana", label: "Tijuana", flag: "🇲🇽", region: "Americas" },
  { id: "America/Cancun", label: "Cancún", flag: "🇲🇽", region: "Americas" },
  { id: "America/Monterrey", label: "Monterrey", flag: "🇲🇽", region: "Americas" },
  { id: "America/New_York", label: "New York", flag: "🇺🇸", region: "Americas" },
  { id: "America/Chicago", label: "Chicago", flag: "🇺🇸", region: "Americas" },
  { id: "America/Denver", label: "Denver", flag: "🇺🇸", region: "Americas" },
  { id: "America/Phoenix", label: "Phoenix", flag: "🇺🇸", region: "Americas" },
  { id: "America/Los_Angeles", label: "Los Angeles", flag: "🇺🇸", region: "Americas" },
  { id: "America/Toronto", label: "Toronto", flag: "🇨🇦", region: "Americas" },
  { id: "America/Vancouver", label: "Vancouver", flag: "🇨🇦", region: "Americas" },
  { id: "America/Guatemala", label: "Guatemala City", flag: "🇬🇹", region: "Americas" },
  { id: "America/Panama", label: "Panama City", flag: "🇵🇦", region: "Americas" },
  { id: "America/Bogota", label: "Bogotá", flag: "🇨🇴", region: "Americas" },
  { id: "America/Lima", label: "Lima", flag: "🇵🇪", region: "Americas" },
  { id: "America/Santiago", label: "Santiago", flag: "🇨🇱", region: "Americas" },
  { id: "America/Argentina/Buenos_Aires", label: "Buenos Aires", flag: "🇦🇷", region: "Americas" },
  { id: "America/Sao_Paulo", label: "São Paulo", flag: "🇧🇷", region: "Americas" },

  // Africa
  { id: "Africa/Casablanca", label: "Casablanca", flag: "🇲🇦", region: "Africa" },
  { id: "Africa/Lagos", label: "Lagos", flag: "🇳🇬", region: "Africa" },
  { id: "Africa/Cairo", label: "Cairo", flag: "🇪🇬", region: "Africa" },
  { id: "Africa/Johannesburg", label: "Johannesburg", flag: "🇿🇦", region: "Africa" },
  { id: "Africa/Nairobi", label: "Nairobi", flag: "🇰🇪", region: "Africa" },

  // Asia & Pacific
  { id: "Asia/Karachi", label: "Karachi", flag: "🇵🇰", region: "Asia & Pacific" },
  { id: "Asia/Kolkata", label: "Delhi / Mumbai", flag: "🇮🇳", region: "Asia & Pacific" },
  { id: "Asia/Dhaka", label: "Dhaka", flag: "🇧🇩", region: "Asia & Pacific" },
  { id: "Asia/Bangkok", label: "Bangkok", flag: "🇹🇭", region: "Asia & Pacific" },
  { id: "Asia/Jakarta", label: "Jakarta", flag: "🇮🇩", region: "Asia & Pacific" },
  { id: "Asia/Singapore", label: "Singapore", flag: "🇸🇬", region: "Asia & Pacific" },
  { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", flag: "🇲🇾", region: "Asia & Pacific" },
  { id: "Asia/Manila", label: "Manila", flag: "🇵🇭", region: "Asia & Pacific" },
  { id: "Asia/Hong_Kong", label: "Hong Kong", flag: "🇭🇰", region: "Asia & Pacific" },
  { id: "Asia/Shanghai", label: "Shanghai / Beijing", flag: "🇨🇳", region: "Asia & Pacific" },
  { id: "Asia/Seoul", label: "Seoul", flag: "🇰🇷", region: "Asia & Pacific" },
  { id: "Asia/Tokyo", label: "Tokyo", flag: "🇯🇵", region: "Asia & Pacific" },
  { id: "Australia/Perth", label: "Perth", flag: "🇦🇺", region: "Asia & Pacific" },
  { id: "Australia/Brisbane", label: "Brisbane", flag: "🇦🇺", region: "Asia & Pacific" },
  { id: "Australia/Sydney", label: "Sydney", flag: "🇦🇺", region: "Asia & Pacific" },
  { id: "Australia/Melbourne", label: "Melbourne", flag: "🇦🇺", region: "Asia & Pacific" },
  { id: "Pacific/Auckland", label: "Auckland", flag: "🇳🇿", region: "Asia & Pacific" },

  // Fallback so nobody is ever stuck without a valid choice.
  { id: "UTC", label: "UTC (GMT)", flag: "🌐", region: "Other" },
];

export const REGION_ORDER = ["Middle East", "Europe", "Americas", "Africa", "Asia & Pacific", "Other"];

const BY_ID = new Map(ZONES.map((z) => [z.id, z]));

/** True when the runtime actually knows this IANA id. */
export function isValidZone(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: id });
    return true;
  } catch {
    return false;
  }
}

export function findZone(id: string | null | undefined): Zone | null {
  return (id && BY_ID.get(id)) || null;
}

/** "America/Argentina/Buenos_Aires" -> "Buenos Aires" (used for zones outside the catalogue). */
export function cityFromId(id: string): string {
  const last = id.split("/").pop() || id;
  return last.replace(/_/g, " ");
}

/** Friendly label for any IANA id, catalogued or not. */
export function zoneLabel(id: string): string {
  return findZone(id)?.label ?? cityFromId(id);
}

export function zoneFlag(id: string): string {
  return findZone(id)?.flag ?? "🌍";
}

/**
 * The customer's device timezone, or Dubai if the browser will not say.
 * Called on the client only — never during server rendering.
 */
export function detectZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isValidZone(tz)) return tz;
  } catch {}
  return MASTER_TZ;
}

/**
 * The catalogue plus, if needed, the customer's own detected zone so the
 * selector always shows where they actually are.
 */
export function zonesWith(extra: string | null | undefined): Zone[] {
  if (!extra || BY_ID.has(extra) || !isValidZone(extra)) return ZONES;
  return [...ZONES, { id: extra, label: cityFromId(extra), flag: "🌍", region: "Other" }];
}
