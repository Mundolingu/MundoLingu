"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Opportunities from "@/components/Opportunities";
import { Play, Download, Upload, X, Video, Calendar, BookOpen } from "lucide-react";

const TABS = [
  { id: "lessons", label: "Lessons" },
  { id: "live", label: "Live classes" },
  { id: "events", label: "Events" },
  { id: "opportunities", label: "Opportunities" },
  { id: "workbooks", label: "Workbooks" },
];

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
function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}

// --- Class times in every student zone ---
// Class times are stored in UAE wall-clock time. Dubai is permanently UTC+4 and
// never uses daylight saving, so a naive value is read as +04:00 and Intl takes
// care of daylight saving in each of the target zones.
const CLASS_ZONES: { flag: string; label: string; tz: string }[] = [
  { flag: "\u{1F1E6}\u{1F1EA}", label: "UAE", tz: "Asia/Dubai" },
  { flag: "\u{1F1F2}\u{1F1FD}", label: "Mexico City", tz: "America/Mexico_City" },
  { flag: "\u{1F1EC}\u{1F1E7}", label: "London", tz: "Europe/London" },
  { flag: "\u{1F1EA}\u{1F1FA}", label: "Europe", tz: "Europe/Paris" },
  { flag: "\u{1F1F9}\u{1F1F7}", label: "Turkey", tz: "Europe/Istanbul" },
  { flag: "\u{1F1EE}\u{1F1F3}", label: "India", tz: "Asia/Kolkata" },
  { flag: "\u{1F1F8}\u{1F1EC}", label: "Singapore", tz: "Asia/Singapore" },
];

// The absolute moment a stored class time refers to, or null if it is unusable.
function classMoment(value: any): Date | null {
  const raw = String(value == null ? "" : value).trim();
  if (!raw) return null;
  const stamp = raw.replace(" ", "T");
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(stamp)) d = new Date(stamp + "T00:00:00+04:00");
  else if (/^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(stamp)) d = new Date(stamp + "+04:00");
  else d = new Date(stamp);
  return isNaN(d.getTime()) ? null : d;
}

function zoneDayKey(m: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(m);
  const get = (t: string) => (parts.find((x) => x.type === t) || { value: "" }).value;
  return get("year") + "-" + get("month") + "-" + get("day");
}

function ClassZones({ startsAt, dark = false }: { startsAt: any; dark?: boolean }) {
  const m = classMoment(startsAt);
  if (!m) return null;
  let lines: { label: string; flag: string; time: string }[];
  try {
    const uaeDay = zoneDayKey(m, "Asia/Dubai");
    lines = CLASS_ZONES.map((z) => {
      const time = new Intl.DateTimeFormat("en-US", { timeZone: z.tz, hour: "numeric", minute: "2-digit", hour12: true }).format(m);
      // Only note the date when the class lands on a different day than in the UAE.
      const day = zoneDayKey(m, z.tz) === uaeDay
        ? ""
        : new Intl.DateTimeFormat("en-GB", { timeZone: z.tz, day: "numeric", month: "short" }).format(m);
      return { label: z.label, flag: z.flag, time: day ? time + " (" + day + ")" : time };
    });
  } catch {
    return null;
  }

  return (
    <div className={"cz" + (dark ? " cz--dark" : "")}>
      <h5 className="cz-title">Class time in your timezone</h5>
      <ul className="cz-list">
        {lines.map((l) => (
          <li key={l.label}>
            <span className="cz-zone"><span className="cz-flag" aria-hidden="true">{l.flag}</span>{l.label}:</span>
            <span className="cz-time">{l.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
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
          {state === "uploading" ? "Uploading…" : state === "done" ? "Handed in \u2713" : (<><Upload size={14} /> Hand in your work</>)}
        </button>
        {state === "error" && <span className="handin-err">{err}</span>}
      </div>
    </div>
  );
}

export default function MembersArea({ isAdmin = false }: { isAdmin?: boolean }) {
  const [tab, setTab] = useState("lessons");
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [workbooks, setWorkbooks] = useState<any[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const router = useRouter();

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
        const now = Date.now();
        setLive((lv.data || []).filter((c: any) => new Date(c.starts_at).getTime() > now - 2 * 3600 * 1000));
        setEvents((ev.data || []).map((row: any) => {
          const d = new Date(String(row.event_date) + "T00:00:00");
          return { day: String(d.getDate()).padStart(2, "0"), mon: d.toLocaleString("en-US", { month: "short" }), title: row.title, desc: row.description || "" };
        }));
        setWorkbooks(wb.data || []);
      } catch {}
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

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
        <h1 className="mem-hello">Welcome back.</h1>
        <p className="mem-hello-sub">Your lessons, live classes, events, opportunities, and workbooks — all in one place.</p>

        <div className="mem-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} className={"mem-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
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
              live.length ? (
                <div>
                  <div className="mem-live-hero">
                    <div>
                      <small>Next live class</small>
                      <h3>{live[0].title}</h3>
                      <p>{fmtWhen(live[0].starts_at)}{live[0].note ? ` — ${live[0].note}` : ""}</p>
                    </div>
                    {live[0].join_url ? <a className="mem-join" href={live[0].join_url} target="_blank" rel="noreferrer">Join the class</a> : null}
                    <ClassZones startsAt={live[0].starts_at} dark />
                  </div>
                  {live.slice(1).map((c) => (
                    <div className="mem-class" key={c.id}>
                      <div className="mem-row">
                        <div><h4>{c.title}</h4><span>{fmtWhen(c.starts_at)}</span></div>
                        {c.join_url ? <a className="rj" href={c.join_url} target="_blank" rel="noreferrer">Join</a> : null}
                      </div>
                      <ClassZones startsAt={c.starts_at} />
                    </div>
                  ))}
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
              events.length ? (
                <div>
                  {events.map((ev, i) => (
                    <div className="mem-event" key={ev.title + i}>
                      <div className="mem-date"><b>{ev.day}</b><span>{ev.mon}</span></div>
                      <div><h4>{ev.title}</h4><p>{ev.desc}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mem-soon">
                  <div className="mem-soon-badge"><Calendar size={26} /></div>
                  <h3>No upcoming events yet</h3>
                  <p>Workshops and community events will show up here — stay tuned!</p>
                </div>
              )
            )}

            {tab === "opportunities" && <Opportunities isAdmin={isAdmin} />}

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
