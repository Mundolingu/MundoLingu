"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const WHATSAPP_NUMBER = "971504296090";
const WHATSAPP_SHOW = "+971 50 429 6090";

type SkillKey = "L" | "R" | "W" | "S";
type Opt = [string, string, string?];

const Q: Record<string, Opt[]> = {
  module: [["ac", "Academic"], ["gt", "General Training"], ["ns", "Not sure yet"]],
  level: [
    ["4.5", "Around 4.0–4.5", "I manage simple everyday English"],
    ["5", "Around 5.0–5.5", "I get by, but make many mistakes"],
    ["6", "Around 6.0", "Fairly comfortable; writing or speaking hold me back"],
    ["6.75", "Around 6.5–7.0", "Strong English; I need exam polish"],
  ],
  target: [["5.5", "5.5"], ["6", "6.0"], ["6.5", "6.5"], ["7", "7.0"], ["7.5", "7.5"], ["8", "8.0+"]],
  when: [["3", "Within 4 weeks"], ["6", "1–2 months"], ["10", "2–3 months"], ["18", "3–6 months"], ["0", "Not booked yet"]],
  hours: [["3", "2–4 hrs"], ["6", "5–7 hrs"], ["10", "8–12 hrs"], ["14", "12+ hrs"]],
  weak: [["L", "Listening"], ["R", "Reading"], ["W", "Writing"], ["S", "Speaking"]],
  goal: [["uni", "University / study abroad"], ["mig", "Migration / visa"], ["work", "Work or professional licence"], ["other", "Personal goal"]],
};

const SK: Record<SkillKey, string> = { L: "Listening", R: "Reading", W: "Writing", S: "Speaking" };
const ALL: SkillKey[] = ["W", "S", "R", "L"];
const fmtBand = (b: number) => (Math.round(b * 2) / 2).toFixed(1);

function tipFor(sk: SkillKey, mod: string) {
  const ac = mod !== "gt";
  return {
    L: "Listening: do one recorded section a day and check every wrong answer against the transcript. Most lost points come from spelling and plurals in the answer sheet.",
    R: ac
      ? "Reading (Academic): practise skimming a 900-word passage in 2 minutes, then scanning for names, dates and numbers. Learn the True / False / Not Given logic until it is automatic."
      : "Reading (General): the first sections are short, practical texts (ads, notices, workplace documents). Work fast there so you keep 25+ minutes for the long final passage.",
    W: ac
      ? "Writing (Academic): Task 1 describes a chart, graph or process in 150+ words in about 20 minutes; Task 2 is a 250+ word essay and counts double. Write two timed tasks a week and get them marked against the four band criteria."
      : "Writing (General): Task 1 is a letter (formal, semi-formal or informal) in 150+ words; Task 2 is a 250+ word essay and counts double. Learn the right tone for each letter type and write two timed tasks a week.",
    S: "Speaking: record yourself answering Part 2 cue cards (1 minute to prepare, up to 2 minutes to speak). Fluency and range matter more than a perfect accent, so practise speaking without long pauses.",
  }[sk];
}

const GOAL_NOTE: Record<string, string> = {
  uni: "Universities often set a minimum for each skill (for example 6.0 in Writing) as well as the overall band. Check your course page for both numbers.",
  mig: "Migration routes usually need a minimum in every skill, not only the overall band, and some require a specific test type. Check the official requirement before you book.",
  work: "Professional bodies often ask for high scores in all four skills. Check the exact requirement for your licence or employer.",
  other: "A clear target date keeps you moving. If you haven't booked yet, pick a date that gives you the hours this plan needs.",
};

export default function IeltsPlan() {
  const [name, setName] = useState("");
  const [s, setS] = useState({ module: "ac", level: "5", target: "6.5", when: "10", hours: "6", goal: "uni" });
  const [weak, setWeak] = useState<SkillKey[]>(["W", "S"]);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState("");

  const set = (k: keyof typeof s, v: string) => { setS({ ...s, [k]: v }); setTouched(true); };
  const toggleWeak = (k: SkillKey) => { setWeak(weak.includes(k) ? weak.filter((x) => x !== k) : [...weak, k]); setTouched(true); };

  // ---- Plan logic ----
  const cur = parseFloat(s.level), tgt = parseFloat(s.target);
  const booked = s.when !== "0";
  const weeks = booked ? parseInt(s.when) : 12;
  const hrs = parseInt(s.hours);
  const gap = Math.max(0, tgt - cur);
  // Rough guide: about 150 focused study hours to move up one overall band
  const needed = Math.round(gap * 150);
  const available = weeks * hrs;
  const ratio = needed === 0 ? 9 : available / needed;
  const perWeekNeeded = Math.ceil(needed / weeks);

  let vTone = "good", vHead = "", vText = "";
  if (gap === 0) {
    vHead = "You're close to your target";
    vText = "Your level already matches the band you need. Focus on exam technique and timing so nerves don't cost you half a band on the day.";
  } else if (ratio >= 1) {
    vHead = "Your timeline works";
    vText = `You need roughly ${needed} hours of focused study and you have about ${available}. Stick to the plan and take a full mock test every two weeks.`;
  } else if (ratio >= 0.6) {
    vTone = "warn"; vHead = "Possible, but tight";
    vText = `You need roughly ${needed} hours and have about ${available}. That gap closes when every hour counts: a clear strategy for each task type and expert feedback on your writing and speaking.`;
  } else {
    vTone = "bad"; vHead = "Very ambitious for this timeline";
    vText = `A jump of ${gap.toFixed(1)} bands usually takes around ${needed} hours; you have about ${available}. Consider ${booked ? "moving your exam date" : "booking a date"} ${perWeekNeeded <= 20 ? `or studying about ${perWeekNeeded} hours a week` : "further out"}, and get a teacher to target exactly what is costing you points.`;
  }

  // Weekly split: weak skills weigh double, ~15% for vocabulary and mock tests
  const w: Record<SkillKey, number> = { L: 1, R: 1, W: 1, S: 1 };
  weak.forEach((k) => (w[k] = 2));
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  const split = (["L", "R", "W", "S"] as SkillKey[]).map((k) => ({ k, h: Math.max(0.5, Math.round(((hrs * 0.85 * w[k]) / tot) * 2) / 2) }));
  const maxH = Math.max(...split.map((x) => x.h));
  const mockH = Math.max(0.5, Math.round((hrs - split.reduce((a, x) => a + x.h, 0)) * 2) / 2);

  let phases: [string, string, string][];
  if (weeks <= 4) {
    phases = [
      ["Week 1", "Diagnose & fix strategy", "Take a full practice test, find your lowest skill, and learn the method for each question type."],
      [`Weeks 2–${weeks}`, "Timed practice", "Daily timed sections, two marked writing tasks a week, and a full mock test in the last week."],
    ];
  } else {
    const a = Math.max(1, Math.round(weeks * 0.3)), b = Math.max(a + 1, Math.round(weeks * 0.7));
    phases = [
      [`Weeks 1–${a}`, "Foundation", "Diagnostic test, grammar and vocabulary gaps, and the method for every question type."],
      [`Weeks ${a + 1}–${b}`, "Skill building", `Most of your hours go to ${weak.length ? weak.map((k) => SK[k]).join(" & ") : "all four skills"}. Untimed first, then timed.`],
      [`Weeks ${b + 1}–${weeks}`, "Exam mode", "Full mock tests under real timing, review every mistake, and rest well before the exam."],
    ];
  }

  // A typical week: every skill once + 2 extra days for the hardest skills, never the same skill two days running
  const extras: SkillKey[] = weak.length ? [weak[0], weak[1 % weak.length]] : ["W", "S"];
  const cnt: Record<SkillKey, number> = { W: 1, S: 1, R: 1, L: 1 };
  extras.forEach((k) => cnt[k]++);
  const order: SkillKey[] = [];
  let prev: SkillKey | null = null;
  while (order.length < 6) {
    const pick = ALL.filter((k) => cnt[k] > 0 && k !== prev).sort((a, b) => cnt[b] - cnt[a])[0] || ALL.find((k) => cnt[k] > 0)!;
    order.push(pick); cnt[pick]--; prev = pick;
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mins = Math.round((hrs * 60) / 7 / 5) * 5;
  const dayFocus: Record<SkillKey, string> = {
    L: "Listening: one timed section + transcript check",
    R: "Reading: one passage, timed, then vocabulary review",
    W: s.module === "gt" ? "Writing: one letter or essay, timed" : "Writing: one Task 1 chart or Task 2 essay, timed",
    S: "Speaking: Part 2 cue cards, recorded and replayed",
  };

  let rec: string, recWhy: string;
  if (gap >= 1.5 || ratio < 0.6 || weeks <= 4) { rec = "Exam Result (30 lessons) or Exam Booster (20 lessons)"; recWhy = "Your gap and timeline call for regular 1-to-1 sessions, so a teacher can fix the exact mistakes that cost you points."; }
  else if (gap >= 1 || ratio < 1) { rec = "Exam Booster (20 lessons)"; recWhy = "A steady rhythm of 1-to-1 lessons plus marked writing will get you over the line in time."; }
  else { rec = "Exam Starter (10 lessons)"; recWhy = "You are on track. A short package to sharpen technique and check your writing and speaking is enough."; }

  const modName = { ac: "Academic", gt: "General Training", ns: "IELTS (module to confirm)" }[s.module];
  const whenLabel = Q.when.find((x) => x[0] === s.when)![1];
  const msg =
    `Hi MundoLingu! I'm ${name.trim() || "[your name]"}. I made my IELTS study plan on your website:\n` +
    `• ${modName}\n• Level now: about ${fmtBand(cur)}\n• Target: ${s.target === "8" ? "8.0+" : fmtBand(tgt)}\n• Exam: ${whenLabel}\n` +
    `• Hardest skills: ${weak.length ? weak.map((k) => SK[k]).join(", ") : "none chosen"}\nI'd like to book a free demo lesson.`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  async function copy() {
    try { await navigator.clipboard.writeText(msg); setCopied("Copied ✓"); }
    catch { setCopied("Copy not available"); }
    setTimeout(() => setCopied(""), 2000);
  }

  const radio = (k: keyof typeof s, cls = "") => (
    <div className={`ip-opts ${cls}`} role="radiogroup">
      {Q[k].map(([v, label, sub]) => (
        <button type="button" key={v} role="radio" aria-checked={s[k] === v} className={`ip-opt ${s[k] === v ? "on" : ""}`} onClick={() => set(k, v)}>
          {label}{sub && <small>{sub}</small>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="ip-root">
      <style>{CSS}</style>
      <header className="ip-head">
        <div className="ip-wrap">
          <a href="/" className="ip-back">&larr; MundoLingu</a>
          <span className="ip-eyebrow">Free IELTS study plan</span>
          <h1>Your personal IELTS plan in 60 seconds</h1>
          <p>Answer 8 quick questions. You get a plan built around your target band, your exam date and the skills that hold you back, plus an honest check on whether your timeline works.</p>
        </div>
      </header>

      <main className="ip-wrap ip-grid">
        <form className="ip-card ip-form" onSubmit={(e) => e.preventDefault()}>
          <div className="ip-q">
            <label htmlFor="ip-name">1. Your first name</label>
            <input id="ip-name" type="text" maxLength={30} placeholder="e.g. Sara" value={name} onChange={(e) => { setName(e.target.value); setTouched(true); }} />
          </div>
          <div className="ip-q"><span className="ip-lbl">2. Which IELTS are you taking?</span>{radio("module")}</div>
          <div className="ip-q">
            <span className="ip-lbl">3. Your English level right now</span>
            <span className="ip-hint">Not sure? Take our <a href="/ielts-band-check">free band check</a> first.</span>
            {radio("level", "ip-stack")}
          </div>
          <div className="ip-q"><span className="ip-lbl">4. The overall band you need</span>{radio("target")}</div>
          <div className="ip-q"><span className="ip-lbl">5. When is your exam?</span>{radio("when")}</div>
          <div className="ip-q"><span className="ip-lbl">6. Study hours you can give each week</span>{radio("hours")}</div>
          <div className="ip-q">
            <span className="ip-lbl">7. Which skills feel hardest?</span>
            <span className="ip-hint">Pick one or more.</span>
            <div className="ip-opts">
              {(Q.weak as [SkillKey, string][]).map(([v, label]) => (
                <button type="button" key={v} role="checkbox" aria-checked={weak.includes(v)} className={`ip-opt ${weak.includes(v) ? "on" : ""}`} onClick={() => toggleWeak(v)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="ip-q"><span className="ip-lbl">8. Why do you need IELTS?</span>{radio("goal")}</div>
        </form>

        <section className="ip-plan" aria-live="polite">
          <div className="ip-card">
            {!touched && <span className="ip-sample">Example plan · change the answers to make it yours</span>}
            <h2>{name.trim() ? `${name.trim()}'s` : "Your"} IELTS plan: {fmtBand(cur)} → {s.target === "8" ? "8.0+" : fmtBand(tgt)}</h2>
            <div className="ip-stats">
              <div><b>{gap.toFixed(1)}</b><span>bands to gain</span></div>
              <div><b>{weeks}</b><span>weeks{booked ? "" : " (suggested)"}</span></div>
              <div><b>{available}</b><span>study hours you have</span></div>
              <div><b>{needed}</b><span>hours usually needed</span></div>
            </div>
            <div className={`ip-verdict ${vTone}`}><strong>{vHead}</strong>{vText}</div>
          </div>

          <div className="ip-card">
            <h3>Your {hrs} hours a week</h3>
            <div className="ip-bars">
              {split.map((x) => (
                <div key={x.k} className={`ip-bar ${weak.includes(x.k) ? "weak" : ""}`}>
                  <span>{SK[x.k]}{weak.includes(x.k) && <em className="ip-tag">FOCUS</em>}</span>
                  <div className="ip-track"><div style={{ width: `${(x.h / maxH) * 100}%` }} /></div>
                  <i>{x.h} h</i>
                </div>
              ))}
              <div className="ip-bar mock">
                <span>Mocks &amp; vocab</span>
                <div className="ip-track"><div style={{ width: `${(mockH / maxH) * 100}%` }} /></div>
                <i>{mockH} h</i>
              </div>
            </div>
          </div>

          <div className="ip-card">
            <h3>Your roadmap</h3>
            <div className={`ip-phases ${phases.length === 2 ? "two" : ""}`}>
              {phases.map((p) => (
                <div key={p[0]} className="ip-phase"><span>{p[0]}</span><b>{p[1]}</b><p>{p[2]}</p></div>
              ))}
            </div>
          </div>

          <div className="ip-card">
            <h3>A typical week</h3>
            <table className="ip-week"><tbody>
              {order.map((k, j) => (<tr key={j}><td>{days[j]}</td><td>{dayFocus[k]}</td><td>{mins} min</td></tr>))}
              <tr><td>Sun</td><td>{weeks <= 4 ? "Full mock test" : "Mock section or full mock every 2nd week, then review mistakes"}</td><td>{mins} min</td></tr>
            </tbody></table>
          </div>

          <div className="ip-card">
            <h3>Where to start</h3>
            <ul className="ip-tips">
              {(weak.length ? weak : (["W", "S"] as SkillKey[])).map((k) => <li key={k}>{tipFor(k, s.module)}</li>)}
              <li>{GOAL_NOTE[s.goal]}</li>
            </ul>
          </div>

          <div className="ip-next">
            <h3>Your next step: a free demo lesson</h3>
            <p>Meet your teacher, do a live lesson and get a real level check. No sales pitch in the lesson.</p>
            <p>Based on your answers we&apos;d suggest <strong>{rec}</strong>. {recWhy}</p>
            <ul>
              <li>Lessons built around you, with personal study plans</li>
              <li>A weekly live exam class included</li>
              <li>WhatsApp support and free access to our group classes</li>
            </ul>
            <div className="ip-actions">
              <a className="ip-btn wa" href={waHref} target="_blank" rel="noreferrer">Send my plan on WhatsApp <ArrowRight size={18} /></a>
              <button type="button" className="ip-btn ghost" onClick={copy}>{copied || "Copy my plan"}</button>
            </div>
            <p className="ip-small">WhatsApp: {WHATSAPP_SHOW} · Instagram: @mundolingu</p>
          </div>
        </section>
      </main>
    </div>
  );
}

const CSS = `
.ip-root{font-family:var(--sans);color:var(--ink);background:var(--paper);min-height:100vh;line-height:1.55;font-size:16px}
.ip-root *{box-sizing:border-box}
.ip-wrap{max-width:1120px;margin:0 auto;padding:0 16px}
.ip-head{background:var(--navy);color:#fff;padding:22px 0 30px}
.ip-back{color:var(--d-muted);text-decoration:none;font-size:14px;font-weight:600}
.ip-back:hover{color:#fff}
.ip-eyebrow{display:block;margin-top:18px;color:var(--cyan);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.ip-head h1{font-family:var(--serif);font-size:clamp(28px,4.4vw,42px);line-height:1.15;margin:8px 0 0;max-width:22ch;text-wrap:balance}
.ip-head p{color:var(--d-muted);max-width:60ch;margin:12px 0 0}
.ip-grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:24px;align-items:start;padding-top:24px;padding-bottom:48px}
@media (max-width:860px){.ip-grid{grid-template-columns:1fr}}
.ip-card{background:#fff;border-radius:14px;padding:22px;box-shadow:inset 0 0 0 1px var(--line)}
.ip-card h2{font-family:var(--serif);font-size:26px;line-height:1.2;margin:8px 0 0;text-wrap:balance}
.ip-card h3{font-size:18px;margin:0 0 12px}
.ip-q{display:flex;flex-direction:column;gap:8px;padding:14px 0;border-top:1px solid var(--line-2)}
.ip-q:first-child{border-top:0;padding-top:0}
.ip-q label,.ip-lbl{font-weight:700;font-size:15px}
.ip-hint{font-size:13px;color:var(--muted);margin-top:-4px}
.ip-hint a{color:var(--teal-text)}
.ip-q input{font:inherit;padding:11px 12px;border:none;box-shadow:inset 0 0 0 1.4px var(--line);border-radius:10px;color:var(--ink)}
.ip-q input:focus-visible{outline:3px solid var(--cyan);outline-offset:1px}
.ip-opts{display:flex;flex-wrap:wrap;gap:8px}
.ip-opt{font:600 14px var(--sans);padding:8px 13px;border-radius:999px;border:none;box-shadow:inset 0 0 0 1.5px var(--line);background:#fff;color:var(--ink);cursor:pointer;text-align:left}
.ip-opt:hover{box-shadow:inset 0 0 0 1.5px var(--teal)}
.ip-opt.on{background:var(--teal);color:#fff;box-shadow:none}
.ip-opt:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
.ip-opt small{display:block;font-weight:400;font-size:12.5px;opacity:.85}
.ip-stack .ip-opt{width:100%;border-radius:10px}
.ip-plan{display:flex;flex-direction:column;gap:18px}
.ip-sample{display:inline-block;background:#e6f5f5;color:var(--teal-text);font-weight:700;font-size:12px;letter-spacing:.05em;text-transform:uppercase;padding:4px 10px;border-radius:999px}
.ip-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
@media (max-width:560px){.ip-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ip-stats div{box-shadow:inset 0 0 0 1px var(--line);border-radius:12px;padding:12px}
.ip-stats b{display:block;font-size:24px;font-variant-numeric:tabular-nums}
.ip-stats span{font-size:12.5px;color:var(--muted)}
.ip-verdict{margin-top:14px;border-left:5px solid #1a8f55;background:#eef7f3;border-radius:10px;padding:14px 16px}
.ip-verdict.warn{border-color:#c77a06;background:#fdf6ea}
.ip-verdict.bad{border-color:#c2410c;background:#fdf0ea}
.ip-verdict strong{display:block;font-size:17px;margin-bottom:2px}
.ip-bars{display:flex;flex-direction:column;gap:8px}
.ip-bar{display:grid;grid-template-columns:120px 1fr 52px;gap:10px;align-items:center;font-size:14px}
.ip-track{height:12px;background:var(--line-2);border-radius:6px;overflow:hidden}
.ip-track div{height:100%;background:var(--teal);border-radius:6px}
.ip-bar.weak .ip-track div{background:var(--orange)}
.ip-bar.mock .ip-track div{background:#6a4bc4}
.ip-bar i{font-style:normal;text-align:right;color:var(--muted);font-variant-numeric:tabular-nums}
.ip-tag{font-style:normal;font-size:11px;font-weight:700;color:var(--orange);margin-left:5px}
.ip-phases{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ip-phases.two{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (max-width:560px){.ip-phases,.ip-phases.two{grid-template-columns:1fr}}
.ip-phase{box-shadow:inset 0 0 0 1px var(--line);border-top:4px solid var(--cyan);border-radius:10px;padding:12px}
.ip-phase:nth-child(2){border-top-color:var(--teal)}
.ip-phase:nth-child(3){border-top-color:#6a4bc4}
.ip-phase span{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.ip-phase b{display:block;margin:2px 0 4px}
.ip-phase p{margin:0;font-size:14px}
.ip-week{width:100%;border-collapse:collapse;font-size:14px}
.ip-week td{padding:8px 6px;border-top:1px solid var(--line-2);vertical-align:top}
.ip-week td:first-child{font-weight:700;width:52px}
.ip-week td:last-child{text-align:right;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.ip-tips{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.ip-next{background:var(--navy);color:#fff;border-radius:14px;padding:22px}
.ip-next h3{font-size:20px;margin:0}
.ip-next p{color:var(--d-muted);margin:8px 0 0}
.ip-next strong{color:#fff}
.ip-next ul{margin:10px 0 0;padding-left:20px;color:var(--d-text)}
.ip-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.ip-btn{display:inline-flex;align-items:center;gap:8px;font:700 15px var(--sans);padding:12px 18px;border-radius:10px;border:none;cursor:pointer;text-decoration:none}
.ip-btn.wa{background:#25D366;color:#fff}
.ip-btn.ghost{background:transparent;color:#fff;box-shadow:inset 0 0 0 1.5px var(--d-line)}
.ip-btn:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
.ip-small{font-size:13px;margin-top:10px!important}
@media (prefers-reduced-motion:reduce){.ip-root *{transition:none!important}}
`;
