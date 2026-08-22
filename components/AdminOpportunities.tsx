"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, BadgeCheck, ExternalLink, X } from "lucide-react";
import { UAE_TZ } from "@/lib/time";
import {
  type Opportunity,
  WORK_TYPES,
  ENGLISH_LEVELS,
  CATEGORIES,
  PAYMENT_STATUSES,
  LISTING_DAYS,
  isLive,
  formatDate,
} from "@/lib/opportunities";

// Expiry is a whole day on the UAE clock, like every other date in this project.
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: UAE_TZ, year: "numeric", month: "2-digit", day: "2-digit" })
      .format(new Date(iso));
  } catch {
    return "";
  }
}
function fromDateInput(value: string): string | null {
  return value ? `${value}T23:59:59+04:00` : null;
}
function inDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

type Draft = Partial<Opportunity> & { title: string; company_name: string };

const BLANK: Draft = {
  title: "",
  company_name: "",
  category: "",
  location: "",
  country: "",
  work_type: "remote",
  language_requirements: "",
  english_level: "B2+",
  salary: "",
  description: "",
  requirements: "",
  application_url: "",
  application_email: "",
  deadline: "",
  status: "draft",
  is_paid: false,
  payment_status: "unpaid",
  expires_at: null,
};

// Only the columns an admin edits — never `id`, `created_at` or the audit fields.
const FIELDS = [
  "title", "company_name", "category", "location", "country", "work_type",
  "language_requirements", "english_level", "salary", "description", "requirements",
  "application_url", "application_email", "deadline", "status", "is_paid",
  "payment_status", "expires_at",
] as const;

function payload(d: Draft) {
  const out: Record<string, unknown> = {};
  for (const key of FIELDS) {
    const v = (d as Record<string, unknown>)[key];
    out[key] = v === "" ? null : v;
  }
  out.title = d.title.trim();
  out.company_name = d.company_name.trim();
  return out;
}

export default function AdminOpportunities({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setErr("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      // PGRST205 = table missing from PostgREST's schema cache, 42P01/42703 =
      // the table or a column really isn't there. All mean the same thing here.
      const missing =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.code === "42703" ||
        /does not exist|Could not find the table/i.test(error.message);
      setErr(
        missing
          ? "The opportunities table isn't there yet — run supabase/schema.sql in the Supabase SQL Editor, then reload."
          : error.message
      );
    }
    setRows((data as Opportunity[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy("save");
    setErr("");
    const supabase = createClient();
    const body = payload(editing);
    const res = editing.id
      ? await supabase.from("opportunities").update(body).eq("id", editing.id)
      : await supabase.from("opportunities").insert({ ...body, company_id: editing.company_id || userId });
    setBusy(null);
    if (res.error) { setErr(res.error.message); return; }
    setEditing(null);
    load();
  }

  async function patch(o: Opportunity, changes: Partial<Opportunity>) {
    setBusy(o.id);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("opportunities").update(changes).eq("id", o.id);
    setBusy(null);
    if (error) { setErr(error.message); return; }
    load();
  }

  async function remove(o: Opportunity) {
    if (!window.confirm(`Delete “${o.title}”? This cannot be undone.`)) return;
    setBusy(o.id);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("opportunities").delete().eq("id", o.id);
    setBusy(null);
    if (error) { setErr(error.message); return; }
    load();
  }

  function publish(o: Opportunity) {
    patch(o, {
      status: "published",
      published_at: o.published_at || new Date().toISOString(),
      // Give a freshly published listing a run of its own if none was set.
      expires_at: o.expires_at || inDays(LISTING_DAYS),
    });
  }

  const set = (patchDraft: Partial<Draft>) => setEditing((d) => (d ? { ...d, ...patchDraft } : d));

  return (
    <div className="adm-root">
      <header className="mem-head">
        <div className="mem-head-in">
          <img src="/logo-wordmark-white.png" alt="MundoLingu" />
          <div className="mem-head-r">
            <a className="mem-logout" href="/opportunities">View board</a>
            <a className="mem-logout" href="/members">Members area</a>
          </div>
        </div>
      </header>

      <main className="mem-wrap">
        <h1 className="mem-hello">Opportunities</h1>
        <p className="mem-hello-sub">
          Create listings, publish them once a company has paid, and set when they come down.
        </p>

        {err ? <div className="adm-err">{err}</div> : null}

        <button className="adm-new" onClick={() => setEditing({ ...BLANK })}>
          <Plus size={16} /> New opportunity
        </button>

        {loading ? (
          <div className="mem-loading">Loading…</div>
        ) : rows.length ? (
          <div className="adm-list">
            {rows.map((o) => {
              const live = isLive(o);
              return (
                <div className="adm-row" key={o.id}>
                  <div className="adm-row-main">
                    <h3>{o.title}</h3>
                    <div className="adm-meta">
                      {o.company_name}
                      {o.location ? ` · ${o.location}` : ""}
                      {o.expires_at ? ` · until ${formatDate(o.expires_at)}` : ""}
                    </div>
                    <div className="adm-badges">
                      <span className={"adm-badge is-" + o.status}>{o.status}</span>
                      {o.status === "published" && !live ? <span className="adm-badge is-archived">expired</span> : null}
                      <span className={"adm-badge is-" + (o.is_paid ? "paid" : "unpaid")}>
                        {o.is_paid ? "paid" : o.payment_status}
                      </span>
                    </div>
                  </div>
                  <div className="adm-actions">
                    {o.status === "published" ? (
                      <button disabled={busy === o.id} onClick={() => patch(o, { status: "draft" })} title="Unpublish">
                        <EyeOff size={15} /> Unpublish
                      </button>
                    ) : (
                      <button disabled={busy === o.id} onClick={() => publish(o)} title="Publish">
                        <Eye size={15} /> Publish
                      </button>
                    )}
                    <button
                      disabled={busy === o.id}
                      onClick={() => patch(o, { is_paid: !o.is_paid, payment_status: o.is_paid ? "unpaid" : "paid" })}
                      title="Toggle payment"
                    >
                      <BadgeCheck size={15} /> {o.is_paid ? "Mark unpaid" : "Mark paid"}
                    </button>
                    <button disabled={busy === o.id} onClick={() => setEditing({ ...o, deadline: o.deadline || "" })}>
                      <Pencil size={15} /> Edit
                    </button>
                    <a href={`/opportunities/${o.id}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> View</a>
                    <button className="is-danger" disabled={busy === o.id} onClick={() => remove(o)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mem-soon">
            <h3>No opportunities yet</h3>
            <p>Add the first listing and publish it when the company has paid.</p>
          </div>
        )}
      </main>

      {editing ? (
        <div className="mem-modal" onClick={() => setEditing(null)}>
          <div className="adm-form-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="adm-close" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
            <h2>{editing.id ? "Edit opportunity" : "New opportunity"}</h2>
            <form className="adm-form" onSubmit={save}>
              <label className="adm-wide">
                <span>Title</span>
                <input required value={editing.title} onChange={(e) => set({ title: e.target.value })} placeholder="Software Engineer — English speaking" />
              </label>
              <label>
                <span>Company</span>
                <input required value={editing.company_name} onChange={(e) => set({ company_name: e.target.value })} />
              </label>
              <label>
                <span>Category</span>
                <select value={editing.category || ""} onChange={(e) => set({ category: e.target.value })}>
                  <option value="">—</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>
                <span>Location</span>
                <input value={editing.location || ""} onChange={(e) => set({ location: e.target.value })} placeholder="Mexico City" />
              </label>
              <label>
                <span>Country</span>
                <input value={editing.country || ""} onChange={(e) => set({ country: e.target.value })} placeholder="Mexico" />
              </label>
              <label>
                <span>Work type</span>
                <select value={editing.work_type || ""} onChange={(e) => set({ work_type: e.target.value })}>
                  <option value="">—</option>
                  {WORK_TYPES.map((w) => <option key={w.value} value={w.value}>{w.en}</option>)}
                </select>
              </label>
              <label>
                <span>English level</span>
                <select value={editing.english_level || ""} onChange={(e) => set({ english_level: e.target.value })}>
                  <option value="">—</option>
                  {ENGLISH_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <label>
                <span>Languages</span>
                <input value={editing.language_requirements || ""} onChange={(e) => set({ language_requirements: e.target.value })} placeholder="Spanish + English" />
              </label>
              <label>
                <span>Salary</span>
                <input value={editing.salary || ""} onChange={(e) => set({ salary: e.target.value })} placeholder="$45,000 MXN / month" />
              </label>
              <label className="adm-wide">
                <span>Description</span>
                <textarea rows={5} value={editing.description || ""} onChange={(e) => set({ description: e.target.value })} placeholder="One paragraph per line." />
              </label>
              <label className="adm-wide">
                <span>Requirements</span>
                <textarea rows={5} value={editing.requirements || ""} onChange={(e) => set({ requirements: e.target.value })} placeholder="One requirement per line." />
              </label>
              <label>
                <span>Application link</span>
                <input type="url" value={editing.application_url || ""} onChange={(e) => set({ application_url: e.target.value })} placeholder="https://…" />
              </label>
              <label>
                <span>Application email</span>
                <input type="email" value={editing.application_email || ""} onChange={(e) => set({ application_email: e.target.value })} />
              </label>
              <label>
                <span>Deadline</span>
                <input type="date" value={(editing.deadline || "").slice(0, 10)} onChange={(e) => set({ deadline: e.target.value })} />
              </label>
              <label>
                <span>Expires (comes off the board)</span>
                <input type="date" value={toDateInput(editing.expires_at || null)} onChange={(e) => set({ expires_at: fromDateInput(e.target.value) })} />
              </label>
              <label>
                <span>Status</span>
                <select value={editing.status || "draft"} onChange={(e) => set({ status: e.target.value })}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label>
                <span>Payment</span>
                <select value={editing.payment_status || "unpaid"} onChange={(e) => set({ payment_status: e.target.value, is_paid: e.target.value === "paid" })}>
                  {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <div className="adm-form-foot">
                <button type="button" className="adm-cancel" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="mem-soon-btn" disabled={busy === "save"}>
                  {busy === "save" ? "Saving…" : editing.id ? "Save changes" : "Create opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
