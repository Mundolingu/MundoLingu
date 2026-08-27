"use client";

import { MASTER_LABEL, MASTER_TZ, zoneLabel } from "@/lib/timezones";
import {
  formatLongDate,
  formatShortDateTime,
  formatTime,
  stateLabel,
  type LiveState,
} from "@/lib/time";

/** 🔴 LIVE NOW / STARTING SOON / UPCOMING / ENDED */
export function StatusPill({ state }: { state: LiveState }) {
  return (
    <span className={"mem-status is-" + state}>
      {state === "live" ? <span className="mem-status-dot" aria-hidden="true" /> : null}
      {stateLabel(state)}
    </span>
  );
}

/**
 * Both readings of the same moment: the customer's own zone first (that is the
 * one they act on), with the Dubai reference underneath so the published
 * schedule and what they see can always be matched up.
 */
export function WhenLines({
  instant,
  tz,
  compact,
}: {
  instant: Date;
  tz: string;
  compact?: boolean;
}) {
  const sameZone = tz === MASTER_TZ;
  return (
    <div className={"mem-when" + (compact ? " is-compact" : "")}>
      <span className="mem-when-main">
        {compact ? null : <span className="mem-when-date">{formatLongDate(instant, tz)}</span>}
        <span className="mem-when-local">
          {sameZone ? "Time" : "Your local time"}:{" "}
          <b>{compact ? formatShortDateTime(instant, tz) : formatTime(instant, tz)}</b>{" "}
          <i>({zoneLabel(tz)})</i>
        </span>
      </span>
      {sameZone ? null : (
        <span className="mem-when-alt">
          {MASTER_LABEL} time: {formatShortDateTime(instant, MASTER_TZ)}
        </span>
      )}
    </div>
  );
}
