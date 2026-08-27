"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Play, Download, Upload, X, Video, Calendar, BookOpen } from "lucide-react";
import TimezoneSelector from "@/components/TimezoneSelector";
import { StatusPill, WhenLines } from "@/components/ClassTiming";
import { MASTER_LABEL, detectZone, isValidZone, zoneLabel } from "@/lib/timezones";
import {
  DEFAULT_DURATION_MIN,
  countdownText,
  dayBadge,
  dubaiDateTimeToInstant,
  liveState,
  toDate,
} from "@/lib/time";

const TABS = [
  { id: "lessons", label: "Lessons" },
  { id: "live", label: "Live classes" },
  { id: "events", label: "Events" },
  { id: "workbooks", label: "Workbooks" },
];

const TZ_STORAGE_KEY = "ml-tz";

// --- YouTube helpers (works with youtu.be/… and youtube.com/watch?v=… links) ---
function ytId(url: string): string | null {
  const m = (url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
function ytEmbed(url: string): string | null {
  const id = ytId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}
function ytThumb(url: string): string | null {
  const id = ytId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/**
 * The absolute moment a row happens at.
 *  - live_classes always carry starts_at (timestamptz) — the instant itself.
 *  - events may carry starts_at, or an event_date + a start_time that is read
 *    as Dubai wall-clock, or neither (an all-day event).
 */
function rowInstant(row: any): Date | null {
  if (row?.starts_at) return toDate(row.starts_at);
  if (row?.event_date && row?.start_time) return dubaiDateTimeToInstant(row.event_date, row.start_time);
  return null;
}

function rowDuration(row: any): number {
  const n = Number(row?.duration_minutes);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DURATION_MIN;
}

/** Day/month badge for an all-day event — a plain date, so no zone shifting. */
function plainDayBadge(dateStr: string): { day: string; mon: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || ""));
  if (!m) return { day: "--", mon: "" };
  const utc = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return {
    day: m[3],
    mon: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(utc),
  };
}

function HandInCard({ wb }: { wb: any }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setState("uploading");
    setErr("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr("Please log in again."); setState("error"); return; }
      const ext = (file.name.split(".").pop() || "file").toLowerCase();
      const path = `${user.id}/${(wb.label || "workbook")}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("submissions").upload(path, file, { upsert: false });
      if (up.error) { setErr("Upload failed — is the 'submissions' storage set up? (See README.)"); setState("error"); return; }
      await supabase.from("submissions").insert({ user_id: user.id, email: user.email, workbook: wb.title, file_path: path });
      try {
        await fetch("/api/submission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workbook: wb.title, email: user.email, filePath: path }),
        });
      } catch {}
      setState("done");
    } catch {
      setErr("Upload failed. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="mem-book">
      <div className="mem-book-top">
        {wb.cover_url ? <img className="mem-book-cover" src={wb.cover_url} alt="" /> : null}
        <span className="mo">{wb.label || "Workbook"}</span>
      </div>
      <div className="mem-bb">
        <h3>{wb.title}</h3>
        <a className="dl" href={wb.pdf_url || "#"} target="_blank" rel="noreferrer"><Download size={15} /> Download PDF</a>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" style={{ display: "none" }} onChange={onFile} />
        <button className="handin" onClick={() => inputRef.current && inputRef.current.click()} disabled={state === "uploading" || state === "done"}>
          {state === "uploading" ? "Uploading…" : state === "done" ? "Handed in ✓" : (<><Upload size={14} /> Hand in your work</>)}
        </button>
        {state === "error" && <span className="handin-err">{err}</span>}
      </div>
    </div>
  );
}

export default function MembersArea({ initialTimezone }: { initialTimezone?: string | null }) {
  const [tab, setTab] = useState("lessons");
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [workbooks, setWorkbooks] = useState<any[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [tz, setTz] = useState<string | null>(
    initialTimezone && isValidZone(initialTimezone) ? initialTimezone : null
  );
  const [savingTz, setSavingTz] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const router = useRouter();

  // Resolve the customer's zone: their saved profile setting wins, then the
  // last choice made on this device, then whatever the browser reports.
  useEffect(() => {
    if (tz) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(TZ_STORAGE_KEY); } catch {}
    setTz(stored && isValidZone(stored) ? stored : detectZone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps "LIVE NOW" and the countdown honest without a full refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const [ls, lv, ev, wb] = await Promise.all([
          supabase.from("lessons").select("*").order("sort", { ascending: true }),
          supabase.from("live_classes").select("*").order("starts_at", { ascending: true }),
          supabase.from("events").select("*").order("event_date", { ascending: true }),
          supabase.from("workbooks").select("*").order("sort", { ascending: true }),
        ]);
        if (!active) return;
        setLessons(ls.data || []);
        setLive(lv.data || []);
        setEvents(ev.data || []);
        setWorkbooks(wb.data || []);
      } catch {}
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  // Which classes to show, and in what state — decided from absolute instants,
  // never from a rendered local time, so it is identical for every customer.
  const upcomingLive = useMemo(() => {
    return live
      .map((c) => {
        const instant = rowInstant(c);
        const duration = rowDuration(c);
        return { row: c, instant, duration, state: instant ? liveState(instant, duration, now) : null };
      })
      .filter((c) => c.instant && c.instant.getTime() + (c.duration + 60) * 60000 > now)
      .sort((a, b) => (a.instant as Date).getTime() - (b.instant as Date).getTime());
  }, [live, now]);

  const eventRows = useMemo(() => {
    return events.map((row) => {
      const instant = rowInstant(row);
      const duration = rowDuration(row);
      return {
        row,
        instant,
        state: instant ? liveState(instant, duration, now) : null,
      };
    });
  }, [events, now]);

  async function changeTz(next: string) {
    if (!isValidZone(next)) return;
    setTz(next);
    try { localStorage.setItem(TZ_STORAGE_KEY, next); } catch {}
    setSavingTz(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      // Stored on the member's existing profile row — no new account system.
      if (user) await supabase.from("profiles").update({ timezone: next }).eq("id", user.id);
    } catch {
      // The choice still applies for this visit via localStorage.
    }
    setSavingTz(false);
  }

  function openLesson(l: any) {
    const emb = ytEmbed(l.video_url);
    if (emb) setPlaying(emb);
    else if (l.video_url) window.open(l.video_url, "_blank");
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mem-root">
      <header className="mem-head">
        <div className="mem-head-in">
          <img src="/logo-wordmark-white.png" alt="MundoLingu" />
          <div className="mem-head-r">
            <button className="mem-logout" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="mem-wrap">
        <div className="mem-greet">
          <div className="mem-greet-t">
            <h1 className="mem-hello">Welcome back.</h1>
            <p className="mem-hello-sub">Your lessons, live classes, events, and workbooks — all in one place.</p>
          </div>
          {tz ? <TimezoneSelector value={tz} onChange={changeTz} saving={savingTz} /> : null}
        </div>

        <div className="mem-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} className={"mem-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}>
              {t.label}
            </button>
          ))}
        </div>

        {loading || !tz ? (
          <div className="mem-loading">Loading your content…</div>
        ) : (
          <>
            {tab === "lessons" && (
              lessons.length ? (
                <div className="mem-grid">
                  {lessons.map((l) => (
                    <div className="mem-card" key={l.id} onClick={() => openLesson(l)} role="button">
                      <div className="mem-thumb">
                        {ytThumb(l.video_url) ? <img src={ytThumb(l.video_url) as string} alt="" /> : null}
                        <span className="play"><Play size={20} fill="currentColor" /></span>
                      </div>
                      <div className="mem-cb"><h3>{l.title}</h3><div className="meta">{l.level || ""}</div></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mem-soon">
                  <div className="mem-soon-badge"><Play size={26} fill="currentColor" /></div>
                  <h3>Video lessons are on the way</h3>
                  <p>We&apos;re filming a full library of lessons right now — they&apos;ll appear here soon. In the meantime, jump into a live class or grab this month&apos;s workbook.</p>
                  <button className="mem-soon-btn" onClick={() => setTab("live")}>See live classes</button>
                </div>
              )
            )}

            {tab === "live" && (
              upcomingLive.length ? (
                <div>
                  <div className="mem-live-hero">
                    <div>
                      <small>
                        Next live class
                        {upcomingLive[0].state ? <StatusPill state={upcomingLive[0].state} /> : null}
                      </small>
                      <h3>{upcomingLive[0].row.title}</h3>
                      <WhenLines instant={upcomingLive[0].instant as Date} tz={tz} />
                      <p className="mem-count">
                        {countdownText(upcomingLive[0].instant as Date, tz, now, upcomingLive[0].duration)}
                      </p>
                      {upcomingLive[0].row.note ? <p>{upcomingLive[0].row.note}</p> : null}
                    </div>
                    {upcomingLive[0].row.join_url ? (
                      <a className="mem-join" href={upcomingLive[0].row.join_url} target="_blank" rel="noreferrer">
                        {upcomingLive[0].state === "live" ? "Join now" : "Join the class"}
                      </a>
                    ) : null}
                  </div>
                  {upcomingLive.slice(1).map((c) => (
                    <div className="mem-row" key={c.row.id}>
                      <div>
                        <h4>
                          {c.row.title}
                          {c.state && c.state !== "upcoming" ? <StatusPill state={c.state} /> : null}
                        </h4>
                        <WhenLines instant={c.instant as Date} tz={tz} compact />
                        {c.row.note ? <span className="mem-row-note">{c.row.note}</span> : null}
                      </div>
                      {c.row.join_url ? <a className="rj" href={c.row.join_url} target="_blank" rel="noreferrer">Join</a> : null}
                    </div>
                  ))}
                  <p className="mem-caption">
                    Every class is scheduled in {MASTER_LABEL} time and shown above in {zoneLabel(tz)} time.
                    Change your timezone at the top of the page if you have moved.
                  </p>
                </div>
              ) : (
                <div className="mem-soon">
                  <div className="mem-soon-badge"><Video size={26} /></div>
                  <h3>No live classes scheduled yet</h3>
                  <p>New live classes are added regularly — check back soon, or grab this month&apos;s workbook in the meantime.</p>
                </div>
              )
            )}

            {tab === "events" && (
              eventRows.length ? (
                <div>
                  {eventRows.map((e, i) => {
                    const badge = e.instant ? dayBadge(e.instant, tz) : plainDayBadge(e.row.event_date);
                    return (
                      <div className="mem-event" key={e.row.id || e.row.title + i}>
                        <div className="mem-date"><b>{badge.day}</b><span>{badge.mon}</span></div>
                        <div>
                          <h4>
                            {e.row.title}
                            {e.state && e.state !== "upcoming" ? <StatusPill state={e.state} /> : null}
                          </h4>
                          {e.instant ? (
                            <WhenLines instant={e.instant} tz={tz} compact />
                          ) : (
                            <span className="mem-when is-compact"><span className="mem-when-main">All day</span></span>
                          )}
                          {e.row.description ? <p>{e.row.description}</p> : null}
                          {e.row.join_url ? (
                            <a className="rj" href={e.row.join_url} target="_blank" rel="noreferrer">Join</a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  <p className="mem-caption">
                    Events are scheduled in {MASTER_LABEL} time and shown here in {zoneLabel(tz)} time.
                  </p>
                </div>
              ) : (
                <div className="mem-soon">
                  <div className="mem-soon-badge"><Calendar size={26} /></div>
                  <h3>No upcoming events yet</h3>
                  <p>Workshops and community events will show up here — stay tuned!</p>
                </div>
              )
            )}

            {tab === "workbooks" && (
              workbooks.length ? (
                <div>
                  <div className="mem-grid">
                    {workbooks.map((wb) => (<HandInCard wb={wb} key={wb.id} />))}
                  </div>
                  <p className="mem-caption">Download each workbook, then hand in your completed work right here.</p>
                </div>
              ) : (
                <div className="mem-soon">
                  <div className="mem-soon-badge"><BookOpen size={26} /></div>
                  <h3>Workbooks are on the way</h3>
                  <p>Your downloadable workbooks will appear here soon.</p>
                </div>
              )
            )}
          </>
        )}

        <p className="mem-legal"><a href="/terms">Terms &amp; Conditions</a></p>
      </main>

      {playing && (
        <div className="mem-modal" onClick={() => setPlaying(null)}>
          <div className="mem-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mem-modal-x" onClick={() => setPlaying(null)} aria-label="Close"><X size={20} /></button>
            <div className="mem-modal-video">
              <iframe src={playing} title="Lesson" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
