"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Pencil, Plus, Trash2 } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities";

const EMPTY = {
  id: "",
  title: "",
  kind: "Opportunity",
  organisation: "",
  location: "",
  summary: "",
  body: "",
  apply_url: "",
  deadline: "",
  published: false,
  sort: 0,
};

type Draft = typeof EMPTY;

export default function OpportunitiesAdmin() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "anon">("loading");
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/opportunities?all=1", { cache: "no-store" });
      if (res.status === 401) { setState("anon"); return; }
      // Anything else that is not a clean 200 means this account was not
      // granted the admin listing — never fall through to the editor.
      if (!res.ok) { setState("denied"); return; }
      const json = await res.json().catch(() => null);
      if (!json) { setState("denied"); return; }
      setItems(Array.isArray(json.items) ? json.items : []);
      if (json.unavailable) setMsg("The opportunities database has not been provisioned yet — it is created on the next deploy.");
      setState("ready");
    } catch {
      // A network failure is not proof of access either.
      setState("denied");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function edit(o: Opportunity) {
    setDraft({
      id: o.id,
      title: o.title,
      kind: o.kind,
      organisation: o.organisation || "",
      location: o.location || "",
      summary: o.summary,
      body: o.body,
      apply_url: o.apply_url || "",
      deadline: o.deadline || "",
      published: o.published,
      sort: o.sort,
    });
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) { setMsg("A title is required."); return; }
    setSaving(true);
    setMsg("");
    const payload = { ...draft, deadline: draft.deadline || null, apply_url: draft.apply_url || null };
    const res = await fetch(draft.id ? `/api/opportunities/${draft.id}` : "/api/opportunities", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setMsg(json.error || `Save failed (${res.status}).`); return; }
    setDraft(null);
    setMsg(draft.id ? "Saved." : "Created.");
    load();
  }

  async function togglePublish(o: Opportunity) {
    setMsg("");
    const res = await fetch(`/api/opportunities/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !o.published }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(json.error || `Could not update (${res.status}).`); return; }
    load();
  }

  async function remove(o: Opportunity) {
    if (!confirm(`Delete "${o.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/opportunities/${o.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(json.error || `Could not delete (${res.status}).`); return; }
    load();
  }

  if (state === "loading") return <div className="adm-root"><div className="adm-wrap"><p className="adm-note">Loading…</p></div></div>;

  if (state === "anon" || state === "denied") {
    return (
      <div className="adm-root">
        <div className="adm-wrap">
          <a className="op-back" href="/"><ArrowLeft size={15} /> Back to MundoLingu</a>
          <h1 className="adm-h1">Opportunities admin</h1>
          <p className="adm-note">
            {state === "anon"
              ? "You need to be logged in with an admin account to manage opportunities."
              : "This account does not have permission to manage opportunities."}
          </p>
          {state === "anon" ? <a className="ml-btn ml-btn--primary" href="/login">Log in</a> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="adm-root">
      <div className="adm-wrap">
        <a className="op-back" href="/"><ArrowLeft size={15} /> Back to MundoLingu</a>
        <div className="adm-head">
          <h1 className="adm-h1">Opportunities</h1>
          <button className="ml-btn ml-btn--primary" onClick={() => setDraft({ ...EMPTY })}><Plus size={16} /> New opportunity</button>
        </div>
        {msg ? <p className="adm-msg">{msg}</p> : null}

        {draft ? (
          <div className="adm-form">
            <h2>{draft.id ? "Edit opportunity" : "New opportunity"}</h2>
            <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Cabin crew recruitment day — Dubai" /></label>
            <div className="adm-row">
              <label>Type<input value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} placeholder="Job / Scholarship / Volunteering" /></label>
              <label>Organisation<input value={draft.organisation} onChange={(e) => setDraft({ ...draft, organisation: e.target.value })} /></label>
            </div>
            <div className="adm-row">
              <label>Location<input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Dubai, UAE" /></label>
              <label>Deadline<input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} /></label>
            </div>
            <label>Summary<textarea rows={2} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></label>
            <label>Details<textarea rows={7} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Leave a blank line between paragraphs." /></label>
            <div className="adm-row">
              <label>Apply link<input value={draft.apply_url} onChange={(e) => setDraft({ ...draft, apply_url: e.target.value })} placeholder="https://…" /></label>
              <label>Order<input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) || 0 })} /></label>
            </div>
            <label className="adm-check">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              Published (visible on the website)
            </label>
            <div className="adm-actions">
              <button className="ml-btn ml-btn--primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"} <Check size={16} /></button>
              <button className="ml-btn ml-btn--ghost" onClick={() => setDraft(null)}>Cancel</button>
            </div>
          </div>
        ) : null}

        {items.length ? (
          <div className="adm-list">
            {items.map((o) => (
              <div className="adm-item" key={o.id}>
                <div>
                  <span className={"adm-pill" + (o.published ? " on" : "")}>{o.published ? "Published" : "Draft"}</span>
                  <h3>{o.title}</h3>
                  <small>{[o.kind, o.organisation, o.location].filter(Boolean).join(" · ")} · {o.slug}</small>
                </div>
                <div className="adm-item-actions">
                  <button onClick={() => togglePublish(o)}>{o.published ? "Unpublish" : "Publish"}</button>
                  <button onClick={() => edit(o)}><Pencil size={15} /> Edit</button>
                  <button className="danger" onClick={() => remove(o)}><Trash2 size={15} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="adm-note">No opportunities yet. Create the first one above.</p>
        )}
      </div>
    </div>
  );
}
