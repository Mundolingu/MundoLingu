"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { POSTS } from "@/lib/posts";

export default function BlogIndex() {
  const [lang, setLang] = useState<"en" | "es">("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);
  function sw(l: "en" | "es") { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  const tt = lang === "es"
    ? { eyebrow: "El blog", title: "Ideas para aprender más rápido", lead: "Consejos prácticos de inglés y español, historias y guías para convertir un idioma en una oportunidad.", read: "min de lectura", more: "Leer" }
    : { eyebrow: "The blog", title: "Ideas to learn faster", lead: "Practical English and Spanish tips, stories and guides to turn a language into an opportunity.", read: "min read", more: "Read" };

  return (
    <div className="blog-root">
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <div className="ml-langsw">
          <Globe size={14} />
          <button className={lang === "en" ? "on" : ""} onClick={() => sw("en")}>EN</button>
          <button className={lang === "es" ? "on" : ""} onClick={() => sw("es")}>ES</button>
        </div>
      </header>
      <div className="blog-wrap">
        <span className="blog-eyebrow">{tt.eyebrow}</span>
        <h1 className="blog-h1">{tt.title}</h1>
        <p className="blog-lead">{tt.lead}</p>
        <div className="blog-list">
          {POSTS.map((p) => {
            const c = p[lang];
            return (
              <a className="blog-card" href={`/blog/${p.slug}`} key={p.slug}>
                <div className="blog-card-tag">{p.tag[lang]} · {p.readMins} {tt.read}</div>
                <h2>{c.title}</h2>
                <p>{c.excerpt}</p>
                <span className="blog-card-more">{tt.more} <ArrowRight size={15} /></span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
