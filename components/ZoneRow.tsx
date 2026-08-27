"use client";

import { useEffect, useState } from "react";
import { zoneTimes } from "@/lib/timezones";

/**
 * One live-class instant, read out in the student's own zone and in each region
 * we teach across. The student's own zone comes first and is highlighted, so
 * nobody has to work out what "6pm Dubai" means for them.
 */
export default function ZoneRow({ iso, className = "" }: { iso: string; className?: string }) {
  // The server has no idea where the reader is sitting, so these times are
  // worked out after mount only — rendering them on the server would hydrate
  // into different text.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const zones = zoneTimes(iso);
  if (!zones.length) return null;
  return (
    <div className={"tz-row " + className}>
      {zones.map((z) => (
        <div className={"tz-chip" + (z.isLocal ? " tz-chip--master" : "")} key={z.id}>
          <span className="tz-chip-label"><span className="tz-chip-flag">{z.flag}</span>{z.label}</span>
          <span className="tz-chip-time">
            {z.time}
            {z.dayShift ? (
              <sup title={z.dayShift > 0 ? "the next day" : "the day before"}>
                {z.dayShift > 0 ? "+1d" : "−1d"}
              </sup>
            ) : null}
          </span>
          <span className="tz-chip-meta">{z.meta}</span>
        </div>
      ))}
    </div>
  );
}
