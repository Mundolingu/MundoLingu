"use client";

import { Globe } from "lucide-react";
import { formatOffset } from "@/lib/time";
import { REGION_ORDER, zoneFlag, zoneLabel, zonesWith, type Zone } from "@/lib/timezones";

/**
 * "Your timezone: 🇦🇪 Dubai / UAE ▾"
 *
 * Shows friendly city names; the value handed back is always a real IANA id.
 * A native <select> on purpose — it is the control every phone already knows
 * how to scroll, so long zone names never break the mobile layout.
 */
export default function TimezoneSelector({
  value,
  onChange,
  saving,
}: {
  value: string;
  onChange: (tz: string) => void;
  saving?: boolean;
}) {
  const zones = zonesWith(value);
  const grouped: { region: string; items: Zone[] }[] = REGION_ORDER.map((region) => ({
    region,
    items: zones.filter((z) => z.region === region),
  })).filter((g) => g.items.length > 0);

  const now = new Date();
  const offset = formatOffset(now, value);

  return (
    <label className="mem-tz" title={`${zoneLabel(value)} — ${value}`}>
      <Globe size={14} aria-hidden="true" />
      <span className="mem-tz-label">Your timezone</span>
      <span className="mem-tz-value">
        <span className="mem-tz-flag" aria-hidden="true">{zoneFlag(value)}</span>
        {zoneLabel(value)}
        {offset ? <span className="mem-tz-off">{offset}</span> : null}
      </span>
      <select
        aria-label="Choose your timezone"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
      >
        {grouped.map((g) => (
          <optgroup key={g.region} label={g.region}>
            {g.items.map((z) => (
              <option key={z.id} value={z.id}>
                {z.flag} {z.label} ({formatOffset(now, z.id)})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
