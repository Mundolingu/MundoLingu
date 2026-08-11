"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Play, Download, Upload } from "lucide-react";

// Paste your recurring Zoom / Google Meet room link here so members can join live lessons:
const LIVE_LESSON_URL = "#";

const LESSONS = [
  { title: "Ordering food & drinks with confidence", meta: "12 min · A2" },
  { title: "Small talk that actually flows", meta: "18 min · B1" },
  { title: "Nailing the job interview", meta: "24 min · B2" },
  { title: "Past tense without the panic", meta: "15 min · A2" },
  { title: "Phone calls & voice notes at work", meta: "20 min · B1" },
  { title: "Sounding natural: connected speech", meta: "16 min · B2" },
];
const LIVE_NEXT = {
  title: "Conversation Club: Travel stories",
  when: "Thursday · 7:00 PM (CDMX)",
  note: "Live speaking practice with your teacher and other members. Cameras optional, courage required.",
};
const LIVE_UPCOMING = [
  { title: "Grammar clinic: the tricky tenses", when: "Saturday · 10:00 AM" },
  { title: "Pronunciation lab", when: "Tuesday · 6:30 PM" },
  { title: "Members Q&A", when: "Friday · 5:00 PM" },
];
// Shown until you add real events in Supabase (Table Editor -> events).
const SAMPLE_EVENTS = [
  { day: "14", mon: "Mar", title: "Workshop: Speaking without translating", desc: "A 90-minute live workshop plus guided practice." },
  { day: "21", mon: "Mar", title: "Guest session: interviews in English", desc: "With a hiring manager — bring your questions." },
  { day: "28", mon: "Mar", title: "Community game night", desc: "Vocabulary games, all levels welcome." },
];
// To add a workbook: upload its PDF (Supabase Storage) and paste the URL as "url".
const WORKBOOKS = [
  { month: "March", title: "MundoLingu Workbook — March", url: "#" },
  { month: "February", title: "MundoLingu Workbook — February", url: "#" },
  { month: "January", title: "MundoLingu Workbook — January", url: "#" },
  { month: "December", title: "MundoLingu Workbook — December", url: "#" },
];

const TABS = [
  { id: "lessons", label: "Lessons" },
  { id: "live", label: "Live classes" },
  { id: "events", label: "Events" },
  { id: "workbooks", label: "Workbooks" },
];

function HandInCard({ w }: { w: { month: string; title: string; url: string } }) {
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
      const path = `${user.id}/${w.month}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("submissions").upload(path, file, { upsert: false });
      if (up.error) { setErr("Upload failed — is the 'submissions' storage set up? (See README.)"); setState("error"); return; }
      await supabase.from("submissions").insert({ user_id: user.id, email: user.email, workbook: w.title, file_path: path });
      try {
        await fetch("/api/submission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workbook: w.title, email: user.email, filePath: path }),
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
      <div className="mem-book-top"><span className="mo">{w.month}</span></div>
      <div className="mem-bb">
        <h3>{w.title}</h3>
        <a className="dl" href={w.url}><Download size={15} /> Download PDF</a>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" style={{ display: "none" }} onChange={onFile} />
        <button className="handin" onClick={() => inputRef.current && inputRef.current.click()} disabled={state === "uploading" || state === "done"}>
          {state === "uploading" ? "Uploading…" : state === "done" ? "Handed in \u2713" : (<><Upload size={14} /> Hand in your work</>)}
        </button>
        {state === "error" && <span className="handin-err">{err}</span>}
      </div>
    </div>
  );
}

export default function MembersArea() {
  const [tab, setTab] = useState("lessons");
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
        if (active && data && data.length) {
          setEvents(
            data.map((row: any) => {
              const d = new Date(String(row.event_date) + "T00:00:00");
              return {
                day: String(d.getDate()).padStart(2, "0"),
                mon: d.toLocaleString("en-US", { month: "short" }),
                title: row.title,
                desc: row.description || "",
              };
            })
          );
        }
      } catch {
        // no events table yet — keep the samples
      }
    })();
    return () => { active = false; };
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function manage() {
    const res = await fetch("/api/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="mem-root">
      <header className="mem-head">
        <div className="mem-head-in">
          <img src="/logo-wordmark-white.png" alt="MundoLingu" />
          <div className="mem-head-r">
            <button className="mem-logout" onClick={manage}>Manage membership</button>
            <button className="mem-logout" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="mem-wrap">
        <h1 className="mem-hello">Welcome back.</h1>
        <p className="mem-hello-sub">Your lessons, live classes, events, and workbooks — all in one place.</p>

        <div className="mem-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} className={"mem-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "lessons" && (
          <div className="mem-soon">
            <div className="mem-soon-badge"><Play size={26} fill="currentColor" /></div>
            <h3>Video lessons are on the way</h3>
            <p>We&apos;re filming a full library of lessons right now — they&apos;ll appear here soon. In the meantime, jump into a live class or grab this month&apos;s workbook.</p>
            <button className="mem-soon-btn" onClick={() => setTab("live")}>See live classes</button>
          </div>
        )}

        {tab === "live" && (
          <div>
            <div className="mem-live-hero">
              <div>
                <small>Next live class</small>
                <h3>{LIVE_NEXT.title}</h3>
                <p>{LIVE_NEXT.when} — {LIVE_NEXT.note}</p>
              </div>
              <a className="mem-join" href={LIVE_LESSON_URL} target="_blank" rel="noreferrer">Enter the lesson</a>
            </div>
            {LIVE_UPCOMING.map((s) => (
              <div className="mem-row" key={s.title}>
                <div><h4>{s.title}</h4><span>{s.when}</span></div>
                <a className="rj" href={LIVE_LESSON_URL} target="_blank" rel="noreferrer">Enter the lesson</a>
              </div>
            ))}
          </div>
        )}

        {tab === "events" && (
          <div>
            {events.map((ev, i) => (
              <div className="mem-event" key={ev.title + i}>
                <div className="mem-date"><b>{ev.day}</b><span>{ev.mon}</span></div>
                <div><h4>{ev.title}</h4><p>{ev.desc}</p></div>
              </div>
            ))}
          </div>
        )}

        {tab === "workbooks" && (
          <div>
            <div className="mem-grid">
              {WORKBOOKS.map((w) => (<HandInCard w={w} key={w.title} />))}
            </div>
            <p className="mem-caption">Download each month&apos;s workbook, then hand in your completed work right here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
