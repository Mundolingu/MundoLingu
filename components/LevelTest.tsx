"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const QUESTIONS = [
  { q: "Hello, ___ name is Ana.", options: ["my", "me", "I"], answer: 0 },
  { q: "She ___ coffee every morning.", options: ["drink", "drinks", "drinking"], answer: 1 },
  { q: "I ___ to the cinema last night.", options: ["go", "went", "gone"], answer: 1 },
  { q: "There ___ many people at the party.", options: ["was", "were", "is"], answer: 1 },
  { q: "If it rains, we ___ stay at home.", options: ["will", "would", "are"], answer: 0 },
  { q: "I've lived here ___ five years.", options: ["since", "for", "during"], answer: 1 },
  { q: "By next year, she ___ her degree.", options: ["will finish", "will have finished", "finishes"], answer: 1 },
  { q: "He suggested ___ a little earlier.", options: ["to leave", "leaving", "leave"], answer: 1 },
  { q: "Not only ___ late, but he also forgot the documents.", options: ["he was", "was he", "he is"], answer: 1 },
  { q: "___ harder, she would have passed the exam.", options: ["If she studied", "Had she studied", "She had studied"], answer: 1 },
];

function levelFor(score: number) {
  if (score <= 2) return { code: "A1", name: "Beginner", msg: "You're just getting started \u2014 and that's the exciting part. With a personal plan, you'll be holding real conversations sooner than you think." };
  if (score <= 4) return { code: "A2", name: "Elementary", msg: "You've got the basics down. The next step is building the confidence to speak more freely and naturally." };
  if (score <= 6) return { code: "B1", name: "Intermediate", msg: "Solid intermediate level! Now it's about sounding natural and handling real-world situations with ease." };
  if (score <= 8) return { code: "B2", name: "Upper-Intermediate", msg: "Impressive \u2014 you're upper-intermediate. Let's polish your fluency, nuance and professional English." };
  return { code: "C1", name: "Advanced", msg: "Excellent \u2014 that's an advanced level. We'll refine the finer details and keep your English sharp." };
}

export default function LevelTest() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const total = QUESTIONS.length;
  const done = step >= total;
  const score = answers.filter((a, i) => a === QUESTIONS[i].answer).length;
  const level = levelFor(score);

  function choose(idx: number) {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
    setStep(step + 1);
  }
  function restart() { setStep(-1); setAnswers([]); setSent(false); }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/level-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          level: `${level.code} (${level.name})`,
          score: `${score}/${total}`,
        }),
      });
    } catch {}
    setSending(false);
    setSent(true);
  }

  return (
    <div className="lt-root">
      <div className="lt-card">
        <a href="/" className="lt-back">&larr; MundoLingu</a>

        {step === -1 && (
          <div className="lt-intro">
            <span className="lt-eyebrow">Free English level test</span>
            <h1>What&apos;s your English level?</h1>
            <p>Answer 10 quick questions and get your level (A1&ndash;C1) in two minutes &mdash; plus a tailored next step. No sign-up needed to see your result.</p>
            <button className="lt-btn" onClick={() => setStep(0)}>Start the test <ArrowRight size={18} /></button>
          </div>
        )}

        {step >= 0 && !done && (
          <div className="lt-quiz">
            <div className="lt-progress"><span style={{ width: `${(step / total) * 100}%` }} /></div>
            <div className="lt-count">Question {step + 1} of {total}</div>
            <h2 className="lt-q">{QUESTIONS[step].q}</h2>
            <div className="lt-options">
              {QUESTIONS[step].options.map((o, i) => (
                <button key={i} className="lt-option" onClick={() => choose(i)}>{o}</button>
              ))}
            </div>
          </div>
        )}

        {done && (
          <div className="lt-result">
            <span className="lt-eyebrow">Your result</span>
            <div className="lt-badge">{level.code}<small>{level.name}</small></div>
            <p className="lt-score">You scored {score} / {total}</p>
            <p className="lt-msg">{level.msg}</p>

            {!sent ? (
              <form className="lt-lead" onSubmit={submitLead}>
                <p className="lt-lead-title">Want a free demo tailored to your level?</p>
                <input name="name" type="text" required placeholder="Your name" />
                <input name="email" type="email" required placeholder="you@email.com" />
                <button className="lt-btn" type="submit" disabled={sending}>{sending ? "Sending..." : "Book my free demo"} <ArrowRight size={18} /></button>
              </form>
            ) : (
              <div className="lt-thanks">Thanks! We&apos;ll be in touch to set up your free demo. &#127881;</div>
            )}

            <button className="lt-restart" onClick={restart}>Take the test again</button>
          </div>
        )}
      </div>
    </div>
  );
}
