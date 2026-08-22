"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Globe, MapPin, Briefcase, Clock, Building2, Languages, GraduationCap, Banknote, CalendarDays } from "lucide-react";
import { type Opportunity, workTypeLabel, postedLabel, formatDate, isClosed, applyHref } from "@/lib/opportunities";

const COPY = {
  en: {
    back: "All opportunities",
    apply: "Apply now",
    noApply: "Applications for this role are handled by MundoLingu — get in touch and we will introduce you.",
    contact: "Ask about this role",
    about: "About the role",
    requirements: "Requirements",
    closes: "Applications close",
    closed: "Applications are closed",
    location: "Location",
    work: "Work type",
    language: "Languages",
    level: "English level",
    salary: "Salary",
    category: "Category",
    posted: "Posted",
  },
  es: {
    back: "Todas las oportunidades",
    apply: "Postúlate",
    noApply: "MundoLingu gestiona las postulaciones de este puesto — escríbenos y te presentamos.",
    contact: "Pregunta por este puesto",
    about: "Sobre el puesto",
    requirements: "Requisitos",
    closes: "Las postulaciones cierran el",
    closed: "Las postulaciones están cerradas",
    location: "Ubicación",
    work: "Modalidad",
    language: "Idiomas",
    level: "Nivel de inglés",
    salary: "Salario",
    category: "Categoría",
    posted: "Publicado",
  },
};

/** Free text typed as separate lines becomes a list; a single paragraph stays one. */
function lines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
}

export default function OpportunityDetail({ opportunity: o }: { opportunity: Opportunity }) {
  const [lang, setLang] = useState<"en" | "es">("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);
  function sw(l: "en" | "es") { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  const t = COPY[lang];
  const closed = isClosed(o.deadline);
  const href = applyHref(o);
  const facts: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <MapPin size={14} />, label: t.location, value: [o.location, o.country].filter(Boolean).join(" · ") },
    { icon: <Briefcase size={14} />, label: t.work, value: workTypeLabel(o.work_type, lang) },
    { icon: <Languages size={14} />, label: t.language, value: o.language_requirements || "" },
    { icon: <GraduationCap size={14} />, label: t.level, value: o.english_level || "" },
    { icon: <Banknote size={14} />, label: t.salary, value: o.salary || "" },
    { icon: <CalendarDays size={14} />, label: t.category, value: o.category || "" },
  ].filter((x) => x.value);

  const reqs = o.requirements ? lines(o.requirements) : [];

  return (
    <div className="opp-root">
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <div className="opp-top-r">
          <a className="opp-back" href="/opportunities">{t.back}</a>
          <div className="ml-langsw">
            <Globe size={14} />
            <button className={lang === "en" ? "on" : ""} onClick={() => sw("en")}>EN</button>
            <button className={lang === "es" ? "on" : ""} onClick={() => sw("es")}>ES</button>
          </div>
        </div>
      </header>

      <article className="opp-detail">
        <a className="blog-back" href="/opportunities"><ArrowLeft size={14} /> {t.back}</a>

        <div className="opp-detail-head">
          <div>
            <h1>{o.title}</h1>
            <div className="opp-company"><Building2 size={15} /> {o.company_name}</div>
            <span className="opp-posted"><Clock size={12} /> {postedLabel(o.published_at || o.created_at, lang)}</span>
          </div>
          {href && !closed ? (
            <a className="mem-join" href={href} target="_blank" rel="noreferrer noopener">{t.apply}</a>
          ) : null}
        </div>

        {facts.length ? (
          <dl className="opp-facts">
            {facts.map((x) => (
              <div className="opp-fact" key={x.label}>
                <dt>{x.icon} {x.label}</dt>
                <dd>{x.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {o.deadline ? (
          <p className={"opp-deadline-line" + (closed ? " is-closed" : "")}>
            {closed ? t.closed : `${t.closes} ${formatDate(o.deadline, lang)}`}
          </p>
        ) : null}

        <div className="blog-body opp-body">
          {o.description ? (
            <>
              <h2>{t.about}</h2>
              {lines(o.description).map((p, i) => <p key={i}>{p}</p>)}
            </>
          ) : null}

          {reqs.length ? (
            <>
              <h2>{t.requirements}</h2>
              <ul>{reqs.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </>
          ) : null}
        </div>

        <div className="opp-apply">
          {href && !closed ? (
            <a className="mem-join" href={href} target="_blank" rel="noreferrer noopener">{t.apply}</a>
          ) : (
            <>
              <p>{closed ? t.closed : t.noApply}</p>
              {!closed ? (
                <a
                  className="mem-join"
                  href={`mailto:mundolingu@gmail.com?subject=${encodeURIComponent(`${o.title} — ${o.company_name}`)}`}
                >
                  {t.contact}
                </a>
              ) : null}
            </>
          )}
        </div>
      </article>
    </div>
  );
}
