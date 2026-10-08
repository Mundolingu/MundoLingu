"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Globe } from "lucide-react";
import { TERMS, type TermsLang } from "@/lib/terms";

export default function TermsPage() {
  const [lang, setLang] = useState<TermsLang>("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      const nl = (navigator.language || "").toLowerCase();
      if (s === "en" || s === "es" || s === "ar") setLang(s);
      else if (nl.startsWith("es")) setLang("es");
      else if (nl.startsWith("ar")) setLang("ar");
    } catch {}
  }, []);
  useEffect(() => {
    try { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; } catch {}
  }, [lang]);
  function sw(l: TermsLang) { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  const t = TERMS[lang];
  return (
    <div className="blog-root" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <div className="ml-langsw">
          <Globe size={14} />
          <button className={lang === "en" ? "on" : ""} onClick={() => sw("en")}>EN</button>
          <button className={lang === "es" ? "on" : ""} onClick={() => sw("es")}>ES</button>
          <button className={lang === "ar" ? "on" : ""} onClick={() => sw("ar")} lang="ar">ع</button>
        </div>
      </header>
      <article className="terms-wrap">
        <a className="blog-back" href="/"><ArrowLeft size={15} className="terms-backic" /> {t.back}</a>
        <span className="blog-eyebrow">{t.sub}</span>
        <h1 className="blog-title">{t.title}</h1>
        <p className="terms-updated">{t.updated}</p>
        <p className="terms-intro">{t.intro}</p>

        <nav className="terms-toc" aria-label={t.contents}>
          <h2>{t.contents}</h2>
          <ol>{t.sections.map((s, i) => (<li key={i}><a href={`#s${i + 1}`}>{s.h}</a></li>))}</ol>
        </nav>

        {t.sections.map((s, i) => (
          <section className="terms-sec" id={`s${i + 1}`} key={i}>
            <h2>{s.h}</h2>
            {s.p?.map((x, k) => (<p key={k}>{x}</p>))}
            {s.bullets && <ul>{s.bullets.map((b, k) => (<li key={k}>{b}</li>))}</ul>}
            {s.box && (
              <div className="terms-box">
                <h3>{s.box.title}</h3>
                {s.box.items.map((it, k) => (<p key={k}><b>{it.b}</b> {it.t}</p>))}
              </div>
            )}
            {s.after?.map((x, k) => (<p key={k}>{x}</p>))}
          </section>
        ))}
        <p className="terms-thanks">{t.thanks}</p>
      </article>
    </div>
  );
}
