"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Globe } from "lucide-react";
import type { Post } from "@/lib/posts";

export default function BlogArticle({ post }: { post: Post }) {
  const [lang, setLang] = useState<"en" | "es">("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);
  function sw(l: "en" | "es") { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  const c = post[lang];
  const tt = lang === "es"
    ? { back: "← Volver al blog", read: "min de lectura", ctaH: "¿Listo para dar el paso?", ctaP: "Reserva una clase de prueba gratis o descubre tu nivel de inglés en dos minutos.", demo: "Reserva una clase gratis", test: "Test de nivel" }
    : { back: "← Back to the blog", read: "min read", ctaH: "Ready to take the step?", ctaP: "Book a free demo lesson, or find out your English level in two minutes.", demo: "Book a free demo", test: "Level test" };

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
      <article className="blog-article">
        <a href="/blog" className="blog-back">{tt.back}</a>
        <div className="blog-card-tag">{post.tag[lang]} · {post.readMins} {tt.read}</div>
        <h1 className="blog-title">{c.title}</h1>
        <div className="blog-body">
          {c.body.map((b, i) => {
            if (b.type === "h") return <h2 key={i}>{b.text}</h2>;
            if (b.type === "list") return <ul key={i}>{(b.items || []).map((it, j) => <li key={j}>{it}</li>)}</ul>;
            return <p key={i}>{b.text}</p>;
          })}
        </div>
        <div className="blog-cta">
          <h3>{tt.ctaH}</h3>
          <p>{tt.ctaP}</p>
          <div className="blog-cta-btns">
            <a className="ml-btn ml-btn--primary" href="/#demo">{tt.demo} <ArrowRight /></a>
            <a className="ml-btn" href="/level-test" style={{ background: "transparent", color: "#fff", boxShadow: "inset 0 0 0 1.4px rgba(255,255,255,.3)" }}>{tt.test} <ArrowRight /></a>
          </div>
        </div>
      </article>
    </div>
  );
}
