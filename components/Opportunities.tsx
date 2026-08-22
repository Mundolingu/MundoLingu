"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Globe, Search, MapPin, Briefcase, Clock, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  type Opportunity,
  PUBLIC_COLUMNS,
  WORK_TYPES,
  workTypeLabel,
  postedLabel,
  formatDate,
  isClosed,
  optionsFor,
} from "@/lib/opportunities";

const COPY = {
  en: {
    eyebrow: "Opportunities",
    title: "Work that speaks your language",
    lead: "Discover career opportunities from companies looking for talented Spanish-speaking professionals with strong English skills.",
    search: "Search by role, company or keyword",
    country: "All countries",
    work: "Anywhere",
    category: "All categories",
    level: "Any English level",
    clear: "Clear filters",
    results: (n: number) => `${n} ${n === 1 ? "opportunity" : "opportunities"}`,
    none: "No opportunities match your filters",
    noneSub: "Try clearing a filter, or check back soon — new roles are added as companies post them.",
    soon: "No opportunities posted yet",
    soonSub: "This is where companies hiring English-speaking talent will post their roles. Check back soon.",
    loading: "Loading opportunities…",
    view: "View role",
    closes: "Closes",
    closed: "Closed",
    hiring: "Hiring?",
    hiringSub: "Reach a community of bilingual professionals across Mexico, Latin America, Europe and the UAE. Tell us about the role and we will get your listing live.",
    hiringCta: "Post an opportunity",
    back: "Back to site",
  },
  es: {
    eyebrow: "Oportunidades",
    title: "Trabajo que habla tu idioma",
    lead: "Descubre oportunidades profesionales de empresas que buscan talento hispanohablante con un buen nivel de inglés.",
    search: "Busca por puesto, empresa o palabra clave",
    country: "Todos los países",
    work: "En cualquier lugar",
    category: "Todas las categorías",
    level: "Cualquier nivel de inglés",
    clear: "Limpiar filtros",
    results: (n: number) => `${n} ${n === 1 ? "oportunidad" : "oportunidades"}`,
    none: "Ninguna oportunidad coincide con tus filtros",
    noneSub: "Prueba quitando un filtro, o vuelve pronto: añadimos puestos nuevos conforme las empresas los publican.",
    soon: "Aún no hay oportunidades publicadas",
    soonSub: "Aquí publicarán sus vacantes las empresas que buscan talento con inglés. Vuelve pronto.",
    loading: "Cargando oportunidades…",
    view: "Ver puesto",
    closes: "Cierra",
    closed: "Cerrada",
    hiring: "¿Estás contratando?",
    hiringSub: "Llega a una comunidad de profesionales bilingües en México, Latinoamérica, Europa y los EAU. Cuéntanos sobre el puesto y publicamos tu vacante.",
    hiringCta: "Publica una oportunidad",
    back: "Volver al sitio",
  },
};

const HIRING_MAILTO =
  "mailto:mundolingu@gmail.com?subject=" + encodeURIComponent("Post an opportunity — MundoLingu");

const EMPTY = { q: "", country: "", work: "", category: "", level: "" };

export default function Opportunities() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState(EMPTY);

  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);
  function sw(l: "en" | "es") { setLang(l); try { localStorage.setItem("ml-lang", l); } catch {} }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        // Row-level security already limits this to live listings; the filters are
        // repeated here so a logged-in company never sees its own drafts on the
        // public board.
        const { data } = await supabase
          .from("opportunities")
          .select(PUBLIC_COLUMNS)
          .eq("status", "published")
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .order("published_at", { ascending: false });
        if (active) setRows((data as unknown as Opportunity[]) || []);
      } catch {
        // Board not set up yet (see supabase/schema.sql) — fall through to the empty state.
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const t = COPY[lang];
  const countries = useMemo(() => optionsFor(rows, "country"), [rows]);
  const categories = useMemo(() => optionsFor(rows, "category"), [rows]);
  const levels = useMemo(() => optionsFor(rows, "english_level"), [rows]);

  const shown = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return rows.filter((o) => {
      if (f.country && o.country !== f.country) return false;
      if (f.work && o.work_type !== f.work) return false;
      if (f.category && o.category !== f.category) return false;
      if (f.level && o.english_level !== f.level) return false;
      if (!q) return true;
      return [o.title, o.company_name, o.location, o.country, o.category, o.description, o.language_requirements]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, f]);

  const filtering = f.q !== "" || f.country !== "" || f.work !== "" || f.category !== "" || f.level !== "";

  return (
    <div className="opp-root">
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
        <div className="opp-top-r">
          <a className="opp-back" href="/">{t.back}</a>
          <div className="ml-langsw">
            <Globe size={14} />
            <button className={lang === "en" ? "on" : ""} onClick={() => sw("en")}>EN</button>
            <button className={lang === "es" ? "on" : ""} onClick={() => sw("es")}>ES</button>
          </div>
        </div>
      </header>

      <div className="opp-wrap">
        <span className="blog-eyebrow">{t.eyebrow}</span>
        <h1 className="blog-h1">{t.title}</h1>
        <p className="blog-lead">{t.lead}</p>

        {!loading && rows.length > 0 && (
          <div className="opp-filters">
            <label className="opp-search">
              <Search size={16} />
              <input
                type="search"
                value={f.q}
                placeholder={t.search}
                aria-label={t.search}
                onChange={(e) => setF({ ...f, q: e.target.value })}
              />
            </label>
            <div className="opp-selects">
              <select value={f.country} aria-label={t.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
                <option value="">{t.country}</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={f.work} aria-label={t.work} onChange={(e) => setF({ ...f, work: e.target.value })}>
                <option value="">{t.work}</option>
                {WORK_TYPES.map((w) => <option key={w.value} value={w.value}>{w[lang]}</option>)}
              </select>
              <select value={f.category} aria-label={t.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                <option value="">{t.category}</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={f.level} aria-label={t.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
                <option value="">{t.level}</option>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {filtering ? <button className="opp-clear" onClick={() => setF(EMPTY)}>{t.clear}</button> : null}
            </div>
            <p className="opp-count">{t.results(shown.length)}</p>
          </div>
        )}

        {loading ? (
          <div className="mem-loading">{t.loading}</div>
        ) : shown.length ? (
          <div className="opp-list">
            {shown.map((o) => {
              const closed = isClosed(o.deadline);
              return (
                <a className="opp-card" href={`/opportunities/${o.id}`} key={o.id}>
                  <div className="opp-card-top">
                    <div>
                      <h2>{o.title}</h2>
                      <div className="opp-company"><Building2 size={14} /> {o.company_name}</div>
                    </div>
                    {o.salary ? <span className="opp-salary">{o.salary}</span> : null}
                  </div>

                  <div className="opp-tags">
                    {o.location || o.country ? (
                      <span className="opp-tag"><MapPin size={12} /> {[o.location, o.country].filter(Boolean).join(" · ")}</span>
                    ) : null}
                    {o.work_type ? <span className="opp-tag"><Briefcase size={12} /> {workTypeLabel(o.work_type, lang)}</span> : null}
                    {o.english_level ? <span className="opp-tag is-level">EN {o.english_level}</span> : null}
                    {o.category ? <span className="opp-tag">{o.category}</span> : null}
                  </div>

                  {o.description ? <p className="opp-excerpt">{o.description}</p> : null}

                  <div className="opp-card-foot">
                    <span className="opp-posted"><Clock size={12} /> {postedLabel(o.published_at || o.created_at, lang)}</span>
                    {o.deadline ? (
                      <span className={"opp-deadline" + (closed ? " is-closed" : "")}>
                        {closed ? t.closed : `${t.closes} ${formatDate(o.deadline, lang)}`}
                      </span>
                    ) : null}
                    <span className="opp-more">{t.view} <ArrowRight size={15} /></span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="mem-soon">
            <div className="mem-soon-badge"><Briefcase size={26} /></div>
            <h3>{rows.length ? t.none : t.soon}</h3>
            <p>{rows.length ? t.noneSub : t.soonSub}</p>
            {rows.length ? <button className="mem-soon-btn" onClick={() => setF(EMPTY)}>{t.clear}</button> : null}
          </div>
        )}

        <div className="blog-cta opp-cta">
          <h3>{t.hiring}</h3>
          <p>{t.hiringSub}</p>
          <div className="blog-cta-btns">
            <a className="mem-soon-btn" href={HIRING_MAILTO}>{t.hiringCta}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
