"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const WHATSAPP_NUMBER = "971504296090";

type Skill = "grammar" | "vocabulary" | "reading";
type Q = { q: string; options: string[]; answer: number; skill: Skill; passage?: boolean };

const PASSAGE =
  "Remote work has grown rapidly over the past decade. Supporters argue that it saves commuting time and allows employees to organise their day more flexibly. Critics, however, point out that working from home can blur the line between professional and personal life, and that new staff in particular may miss out on informal learning from colleagues. Several studies suggest that a hybrid model, combining office and home days, offers a balance between these advantages and drawbacks.";

const QUESTIONS: Q[] = [
  { q: "If I ___ more time, I would study abroad.", options: ["had", "have", "would have"], answer: 0, skill: "grammar" },
  { q: "Governments should ___ measures to reduce air pollution.", options: ["make", "do", "take"], answer: 2, skill: "vocabulary" },
  { q: "The number of international students ___ increased since 2010.", options: ["have", "has", "are"], answer: 1, skill: "grammar" },
  { q: "The number of tourists ___ dramatically between 2000 and 2020.", options: ["raised", "rose", "arose"], answer: 1, skill: "vocabulary" },
  { q: "The graph shows that sales rose ___ 20% in March.", options: ["by", "with", "at"], answer: 0, skill: "grammar" },
  { q: "___ the heavy rain, the event went ahead as planned.", options: ["Although", "Despite", "However"], answer: 1, skill: "vocabulary" },
  { q: "The report, ___ was published last year, caused a lot of debate.", options: ["that", "which", "who"], answer: 1, skill: "grammar" },
  { q: "A “detrimental” effect is one that is…", options: ["harmful", "helpful", "temporary"], answer: 0, skill: "vocabulary" },
  { q: "Which word is best for a formal essay? “Many experts ___ that cities are becoming too crowded.”", options: ["reckon", "argue", "feel like"], answer: 1, skill: "vocabulary" },
  { q: "Hardly ___ the room when the phone started ringing.", options: ["I had entered", "had I entered", "I entered"], answer: 1, skill: "grammar" },
  { q: "It is essential that every candidate ___ the deadline.", options: ["meets", "meet", "will meet"], answer: 1, skill: "grammar" },
  { q: "According to the text, supporters say remote work…", options: ["increases salaries", "saves commuting time", "reduces workload"], answer: 1, skill: "reading", passage: true },
  { q: "Who may miss out on informal learning from colleagues?", options: ["Managers", "New staff", "Part-time workers"], answer: 1, skill: "reading", passage: true },
  { q: "In the text, the word “blur” is closest in meaning to…", options: ["make less clear", "make stronger", "separate"], answer: 0, skill: "reading", passage: true },
  { q: "TRUE, FALSE or NOT GIVEN? “Studies prove that hybrid work increases company profits.”", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: 2, skill: "reading", passage: true },
];

function bandFor(score: number) {
  if (score <= 4) return { band: "4.5 or below", msg: "You have a base to build on. With a clear plan and the right practice, steady progress is very realistic." };
  if (score <= 7) return { band: "5.0 – 5.5", msg: "You understand a lot already. The next step is accuracy and exam technique, which is exactly what 1-to-1 lessons fix fastest." };
  if (score <= 10) return { band: "6.0 – 6.5", msg: "A solid level. Most students at this point lose their points in Writing and Speaking, not in what they know." };
  if (score <= 13) return { band: "7.0 – 7.5", msg: "A strong result. Getting to the next band is about precision and polish, and a teacher can show you exactly where." };
  return { band: "8.0 or higher", msg: "Excellent. You're in high-band territory. We'll make sure your Writing and Speaking match this level on exam day." };
}

const SKILL_LABEL: Record<Skill, string> = { grammar: "Grammar", vocabulary: "Vocabulary", reading: "Reading" };

export default function BandCheck() {
  const [stage, setStage] = useState<"intro" | "about" | "quiz" | "details" | "result">("intro");
  const [exam, setExam] = useState("IELTS");
  const [target, setTarget] = useState("7.0");
  const [when, setWhen] = useState("1–3 months");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const total = QUESTIONS.length;
  const score = answers.filter((a, i) => a === QUESTIONS[i].answer).length;
  const result = bandFor(score);

  const skills: Skill[] = ["grammar", "vocabulary", "reading"];
  const bySkill = skills.map((s) => {
    const idx = QUESTIONS.map((q, i) => (q.skill === s ? i : -1)).filter((i) => i >= 0);
    const right = idx.filter((i) => answers[i] === QUESTIONS[i].answer).length;
    return { skill: s, right, of: idx.length, pct: right / idx.length };
  });
  const weakest = [...bySkill].sort((a, b) => a.pct - b.pct)[0];

  function choose(i: number) {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
    if (step + 1 >= total) setStage("details");
    else setStep(step + 1);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const fd = new FormData(e.currentTarget);
    setName(String(fd.get("name") || ""));
    try {
      await fetch("/api/band-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          whatsapp: fd.get("whatsapp"),
          exam,
          target,
          when,
          band: result.band,
          score: `${score}/${total}`,
          weakest: SKILL_LABEL[weakest.skill],
          breakdown: bySkill.map((b) => `${SKILL_LABEL[b.skill]} ${b.right}/${b.of}`).join(", "),
        }),
      });
    } catch {}
    setSending(false);
    setStage("result");
  }

  function restart() {
    setStage("intro"); setStep(0); setAnswers([]);
  }

  const waText =
    `Hi MundoLingu! I did the band check on your website. Estimated band: ${result.band}. ` +
    `My target: ${exam} ${target}, exam ${when.toLowerCase()}. I'd like my free exact band check.`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  const selectStyle: React.CSSProperties = {
    padding: "13px 14px", borderRadius: 11, border: "none", boxShadow: "inset 0 0 0 1.4px var(--line)",
    fontSize: 15, fontFamily: "var(--sans)", background: "#fff", color: "var(--ink)", width: "100%",
  };
  const label: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "var(--muted)", marginBottom: -4 };

  return (
    <div className="lt-root">
      <div className="lt-card">
        <a href="/" className="lt-back">&larr; MundoLingu</a>

        {stage === "intro" && (
          <div className="lt-intro">
            <span className="lt-eyebrow">Free IELTS band check</span>
            <h1>What band would you get today?</h1>
            <p>15 exam-style questions on grammar, vocabulary and reading. About 5 minutes. You get an estimated band, your weakest area, and a free exact band check with a teacher on WhatsApp.</p>
            <button className="lt-btn" onClick={() => setStage("about")}>Start the band check <ArrowRight size={18} /></button>
          </div>
        )}

        {stage === "about" && (
          <form className="lt-lead" style={{ background: "transparent", boxShadow: "none", padding: 0 }} onSubmit={(e) => { e.preventDefault(); setStage("quiz"); }}>
            <span className="lt-eyebrow" style={{ textAlign: "center" }}>First, 3 quick questions</span>
            <label style={label} htmlFor="bc-exam">Which exam are you taking?</label>
            <select id="bc-exam" style={selectStyle} value={exam} onChange={(e) => setExam(e.target.value)}>
              <option>IELTS</option><option>TOEFL</option><option>PTE</option><option>Not sure yet</option>
            </select>
            <label style={label} htmlFor="bc-target">What score do you need?</label>
            <select id="bc-target" style={selectStyle} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option>5.5</option><option>6.0</option><option>6.5</option><option>7.0</option><option>7.5</option><option>8.0+</option><option>Not sure</option>
            </select>
            <label style={label} htmlFor="bc-when">When is your exam?</label>
            <select id="bc-when" style={selectStyle} value={when} onChange={(e) => setWhen(e.target.value)}>
              <option>Within 1 month</option><option>1–3 months</option><option>3–6 months</option><option>Not booked yet</option>
            </select>
            <button className="lt-btn" type="submit">Start the questions <ArrowRight size={18} /></button>
          </form>
        )}

        {stage === "quiz" && (
          <div className="lt-quiz">
            <div className="lt-progress"><span style={{ width: `${(step / total) * 100}%` }} /></div>
            <div className="lt-count">Question {step + 1} of {total} &middot; {SKILL_LABEL[QUESTIONS[step].skill]}</div>
            {QUESTIONS[step].passage && (
              <p style={{ background: "var(--paper)", borderRadius: 12, padding: "14px 16px", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)", margin: "14px 0 0", boxShadow: "inset 0 0 0 1px var(--line-2)" }}>{PASSAGE}</p>
            )}
            <h2 className="lt-q">{QUESTIONS[step].q}</h2>
            <div className="lt-options">
              {QUESTIONS[step].options.map((o, i) => (
                <button key={i} className="lt-option" onClick={() => choose(i)}>{o}</button>
              ))}
            </div>
          </div>
        )}

        {stage === "details" && (
          <form className="lt-lead" onSubmit={submit}>
            <p className="lt-lead-title">Your result is ready</p>
            <p style={{ fontSize: 14.5, color: "var(--muted)", margin: "0 0 4px", textAlign: "center", lineHeight: 1.5 }}>
              Tell us where to send your free exact band check. A teacher will message you personally.
            </p>
            <input name="name" type="text" required placeholder="Your name" aria-label="Your name" />
            <input name="email" type="email" required placeholder="you@email.com" aria-label="Email" />
            <input name="whatsapp" type="tel" required placeholder="WhatsApp number, e.g. +971 50 123 4567" aria-label="WhatsApp number" />
            <button className="lt-btn" type="submit" disabled={sending}>{sending ? "Loading..." : "Show my band"} <ArrowRight size={18} /></button>
          </form>
        )}

        {stage === "result" && (
          <div className="lt-result">
            <span className="lt-eyebrow">{name ? `${name}, your estimated band` : "Your estimated band"}</span>
            <div className="lt-badge">{result.band}<small>Target: {exam} {target}</small></div>
            <p className="lt-score">You scored {score} / {total} &middot; Weakest area: {SKILL_LABEL[weakest.skill]}</p>
            <p className="lt-msg">{result.msg}</p>
            <p style={{ fontSize: 13.5, color: "var(--faint)", maxWidth: "46ch", margin: "-14px auto 22px", lineHeight: 1.5 }}>
              This quick check covers grammar, vocabulary and reading only. Your real band also depends on Writing and Speaking, which a teacher checks in your free demo lesson.
            </p>
            <a className="lt-btn" href={waHref} target="_blank" rel="noreferrer" style={{ background: "#25D366", color: "#fff", textDecoration: "none" }}>
              Get my exact band free on WhatsApp <ArrowRight size={18} />
            </a>
            <div><button className="lt-restart" onClick={restart}>Take the check again</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
