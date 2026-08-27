"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Briefcase, ExternalLink } from "lucide-react";
import { formatDeadline, type Opportunity } from "@/lib/opportunities";

// Splits the stored text into paragraphs on blank lines, matching the hint the
// admin editor gives when writing the details field.
function paragraphs(body: string): string[] {
  return (body || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function Opportunities({ isAdmin = false }: { isAdmin?: boolean }) {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Opportunity | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/opportunities", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (active && json && Array.isArray(json.items)) setItems(json.items);
      } catch {
        // Leave the list empty — the empty state explains it well enough.
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const manage = isAdmin ? (
    <p className="op-manage"><a href="/admin/opportunities">Manage opportunities</a></p>
  ) : null;

  if (loading) return <div className="mem-loading">Loading opportunities…</div>;

  if (open) {
    const facts: Array<[string, string]> = [
      ["Type", open.kind],
      ["Organisation", open.organisation || ""],
      ["Location", open.location || ""],
      ["Deadline", formatDeadline(open.deadline)],
    ].filter(([, v]) => Boolean(v)) as Array<[string, string]>;

    return (
      <div className="op-detail">
        <button className="op-back" onClick={() => setOpen(null)}>
          <ArrowLeft size={15} /> All opportunities
        </button>
        <span className="op-kind">{open.kind}</span>
        <h2 className="op-detail-title">{open.title}</h2>
        {open.summary ? <p className="op-detail-lead">{open.summary}</p> : null}

        {facts.length ? (
          <div className="op-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <b>{value}</b>
              </div>
            ))}
          </div>
        ) : null}

        <div className="op-body">
          {paragraphs(open.body).map((p, i) => <p key={i}>{p}</p>)}
        </div>

        {open.apply_url ? (
          <a className="ml-btn ml-btn--primary op-apply" href={open.apply_url} target="_blank" rel="noopener noreferrer">
            Apply now <ExternalLink size={15} />
          </a>
        ) : null}
        {manage}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div>
        <div className="mem-soon">
          <div className="mem-soon-badge"><Briefcase size={26} /></div>
          <h3>No opportunities right now</h3>
          <p>Jobs, scholarships and volunteering placements we find for you will appear here.</p>
        </div>
        {manage}
      </div>
    );
  }

  return (
    <div>
      <div className="op-grid">
        {items.map((o) => {
          const deadline = formatDeadline(o.deadline);
          const meta = [o.organisation, o.location].filter(Boolean).join(" · ");
          return (
            <button className="op-card" key={o.id} onClick={() => setOpen(o)}>
              <div className="op-card-top">
                <span className="op-kind">{o.kind}</span>
                {deadline ? <span className="op-deadline">Closes {deadline}</span> : null}
              </div>
              <h3>{o.title}</h3>
              {meta ? <div className="op-meta">{meta}</div> : null}
              {o.summary ? <p>{o.summary}</p> : null}
              <span className="op-cta">View details <ArrowRight size={15} /></span>
            </button>
          );
        })}
      </div>
      <p className="mem-caption">Tap any opportunity to see the full details and how to apply.</p>
      {manage}
    </div>
  );
}
