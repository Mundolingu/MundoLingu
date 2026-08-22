import { zonedTimes, formatDay, UAE_TZ } from "@/lib/time";

/**
 * One moment, on every clock MundoLingu publishes. Live classes, events and
 * anything else with a date share this component so the times can never drift
 * apart — the only input is the instant itself, and every region is derived
 * from it (see `lib/time.ts`), daylight saving included.
 *
 * `timed` false means an all-day entry: there is no clock time to convert, so
 * only the date is shown.
 */
export default function ZoneTimes({
  date,
  timed = true,
  tone,
  className = "",
}: {
  date: Date | null;
  timed?: boolean;
  tone?: "dark";
  className?: string;
}) {
  if (!date) return null;

  const cls = ["tz", tone === "dark" ? "on-dark" : "", className].filter(Boolean).join(" ");

  if (!timed) {
    return (
      <div className={cls}>
        <span className="tz-day">{formatDay(date, UAE_TZ)}</span>
      </div>
    );
  }

  return (
    <div className={cls}>
      <span className="tz-day">{formatDay(date, UAE_TZ)}</span>
      <div className="tz-strip" role="list">
        {zonedTimes(date).map((z) => (
          <span
            className={"tz-chip" + (z.key === "uae" ? " is-source" : "")}
            key={z.key}
            role="listitem"
            title={`${z.label} — ${z.full}`}
            aria-label={`${z.label}: ${z.full}`}
          >
            <span className="tz-flag" aria-hidden="true">{z.flag}</span>
            <span className="tz-name">{z.label}</span>
            <span className="tz-time">{z.time}</span>
            {z.dayShift ? (
              <span className="tz-shift" aria-hidden="true">{z.dayShift > 0 ? `+${z.dayShift}d` : `${z.dayShift}d`}</span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
