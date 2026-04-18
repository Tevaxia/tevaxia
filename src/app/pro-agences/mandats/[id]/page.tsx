"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getMandate, updateMandate, computeEstimatedCommission, computeCoMandateSplit,
  mandateDaysRemaining, mandateProgressPct, MANDATE_PIPELINE_ORDER,
  type AgencyMandate, type MandateStatus, type MandateType,
} from "@/lib/agency-mandates";
import {
  listDiffusion, upsertDiffusion, updateDiffusionStatus, deleteDiffusion,
  PORTAL_LABELS, DIFFUSION_STATUS_LABELS, DIFFUSION_STATUS_COLORS, DEFAULT_LU_PORTALS,
  type AgencyMandateDiffusion, type MandatePortal, type DiffusionStatus,
} from "@/lib/agency-diffusion";
import {
  listOffers, createOffer, updateOffer, deleteOffer, offerVsAsking,
  OFFER_STATUS_LABELS, OFFER_STATUS_COLORS,
  type AgencyMandateOffer, type OfferStatus,
} from "@/lib/agency-offers";
import { listInteractions, logInteraction } from "@/lib/crm/interactions";
import type { CrmInteraction, CrmInteractionType } from "@/lib/crm/types";
import { buildOpenImmoXml, buildPortalCsv, downloadBlob } from "@/lib/agency-xml";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

const STATUS_LABELS: Record<MandateStatus, string> = {
  prospect: "Prospect",
  mandat_signe: "Mandat signé",
  diffuse: "Diffusé",
  en_visite: "En visite",
  offre_recue: "Offre reçue",
  sous_compromis: "Sous compromis",
  vendu: "Vendu",
  abandonne: "Abandonné",
  expire: "Expiré",
};

const STATUS_COLORS: Record<MandateStatus, string> = {
  prospect: "bg-slate-100 text-slate-800",
  mandat_signe: "bg-blue-100 text-blue-900",
  diffuse: "bg-indigo-100 text-indigo-900",
  en_visite: "bg-violet-100 text-violet-900",
  offre_recue: "bg-amber-100 text-amber-900",
  sous_compromis: "bg-orange-100 text-orange-900",
  vendu: "bg-emerald-100 text-emerald-900",
  abandonne: "bg-gray-100 text-gray-700",
  expire: "bg-rose-100 text-rose-900",
};

const TYPE_LABELS: Record<MandateType, string> = {
  exclusif: "Exclusif",
  simple: "Simple",
  semi_exclusif: "Semi-exclusif",
  recherche: "Recherche (acquéreur)",
};

const INTERACTION_LABELS: Record<CrmInteractionType, string> = {
  call: "Appel",
  email: "Email",
  sms: "SMS",
  meeting: "RDV",
  visit: "Visite",
  offer: "Offre",
  document: "Document",
  note: "Note",
  task_done: "Tâche ✓",
  status_change: "Statut",
};

type Tab = "apercu" | "diffusion" | "offres" | "timeline";

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-LU", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("fr-LU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function MandateDetailPage() {
  const params = useParams<{ id: string }>();
  const mandateId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("apercu");
  const [mandate, setMandate] = useState<AgencyMandate | null>(null);
  const [diffusions, setDiffusions] = useState<AgencyMandateDiffusion[]>([]);
  const [offers, setOffers] = useState<AgencyMandateOffer[]>([]);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<AgencyMandate>>({});

  const reload = useCallback(async () => {
    if (!mandateId || !isSupabaseConfigured || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [m, d, o, ints] = await Promise.all([
        getMandate(mandateId),
        listDiffusion(mandateId),
        listOffers(mandateId),
        listInteractions({ mandateId, limit: 50 }),
      ]);
      setMandate(m);
      setDiffusions(d);
      setOffers(o);
      setInteractions(ints);
      if (m) setForm(m);
    } catch (e) {
      setError(errMsg(e, "Impossible de charger le mandat"));
    }
    setLoading(false);
  }, [mandateId, user]);

  useEffect(() => { void reload(); }, [reload]);

  const save = async () => {
    if (!mandate) return;
    setSaving(true);
    try {
      const patch: Partial<AgencyMandate> = { ...form };
      patch.commission_amount_estimee = computeEstimatedCommission({
        prix_demande: patch.prix_demande ?? mandate.prix_demande,
        commission_pct: patch.commission_pct ?? mandate.commission_pct,
      });
      await updateMandate(mandate.id, patch);
      await reload();
      setEditMode(false);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Erreur sauvegarde"));
    }
    setSaving(false);
  };

  const changeStatus = async (s: MandateStatus) => {
    if (!mandate) return;
    const patch: Partial<AgencyMandate> = { status: s };
    if (s === "mandat_signe" && !mandate.signed_at) patch.signed_at = new Date().toISOString();
    if (s === "vendu") patch.sold_at = new Date().toISOString();
    await updateMandate(mandate.id, patch);
    await logInteraction({
      mandateId: mandate.id,
      type: "status_change",
      direction: "internal",
      subject: `Statut → ${STATUS_LABELS[s]}`,
    });
    await reload();
  };

  const exportOpenImmo = () => {
    if (!mandate) return;
    const xml = buildOpenImmoXml([mandate], {
      firmenname: "Agence",
      openimmo_anid: user?.id ?? "tevaxia",
      lang: "fr",
      email_zentrale: user?.email ?? "",
    });
    downloadBlob(xml, `openimmo-${mandate.reference ?? mandate.id.slice(0, 8)}.xml`, "application/xml;charset=utf-8");
  };

  const exportCsv = () => {
    if (!mandate) return;
    const csv = buildPortalCsv([mandate]);
    downloadBlob(csv, `mandat-${mandate.reference ?? mandate.id.slice(0, 8)}.csv`, "text/csv;charset=utf-8");
  };

  const stats = useMemo(() => {
    if (!mandate) return null;
    const daysLeft = mandateDaysRemaining(mandate.end_date);
    const split = computeCoMandateSplit(mandate);
    const publishedCount = diffusions.filter((d) => d.status === "published").length;
    const totalViews = diffusions.reduce((s, d) => s + (d.views_count ?? 0), 0);
    const totalLeads = diffusions.reduce((s, d) => s + (d.leads_count ?? 0), 0);
    const activeOffers = offers.filter((o) =>
      ["received", "counter_sent", "counter_received"].includes(o.status)).length;
    const bestOffer = offers.filter((o) =>
      ["received", "counter_sent", "counter_received", "accepted"].includes(o.status))
      .reduce((max, o) => o.amount_eur > max ? o.amount_eur : max, 0);
    return { daysLeft, split, publishedCount, totalViews, totalLeads, activeOffers, bestOffer };
  }, [mandate, diffusions, offers]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Supabase requis.
        </div>
      </div>
    );
  }
  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <Link href="/connexion" className="text-navy underline">Se connecter</Link>
      </div>
    );
  }
  if (!mandate) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted">Mandat introuvable.</p>
        <Link href="/pro-agences/mandats" className="mt-4 inline-block text-navy underline">← Retour aux mandats</Link>
      </div>
    );
  }

  const progress = mandateProgressPct(mandate.status);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences" className="hover:text-navy">Pro agences</Link>
        <span>/</span>
        <Link href="/pro-agences/mandats" className="hover:text-navy">Mandats</Link>
        <span>/</span>
        <span className="text-navy">{mandate.reference ?? mandate.id.slice(0, 8)}</span>
      </div>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy truncate">{mandate.property_address}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[mandate.status]}`}>
              {STATUS_LABELS[mandate.status]}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {mandate.property_commune ?? "—"} · {mandate.property_type ?? "—"} · {TYPE_LABELS[mandate.mandate_type]}
            {mandate.reference && ` · Réf ${mandate.reference}`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/pro-agences/mandats/${mandate.id}/matching`}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100">
            🎯 Matching acquéreurs
          </Link>
          <Link href={`/pro-agences/mandats/${mandate.id}/signatures`}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-100">
            ✍️ Signatures
          </Link>
          <button onClick={exportCsv}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
            ↓ CSV
          </button>
          <button onClick={exportOpenImmo}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background"
            title="Export OpenImmo v1.2.7 — standard européen accepté par athome / Immotop">
            ↓ OpenImmo
          </button>
          {!editMode ? (
            <button onClick={() => setEditMode(true)}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              Modifier
            </button>
          ) : (
            <>
              <button onClick={() => { setForm(mandate); setEditMode(false); }}
                className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      {/* Progress pipeline */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Pipeline</div>
          <div className="text-xs text-muted">{progress}% avancé</div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {MANDATE_PIPELINE_ORDER.map((s) => {
            const idx = MANDATE_PIPELINE_ORDER.indexOf(s);
            const cur = MANDATE_PIPELINE_ORDER.indexOf(mandate.status);
            const isActive = idx === cur;
            const isPast = cur >= 0 && idx < cur;
            return (
              <button key={s} onClick={() => changeStatus(s)}
                className={`flex-1 min-w-[90px] rounded-md px-2 py-2 text-[10px] font-semibold transition-colors ${
                  isActive ? "bg-navy text-white" : isPast ? "bg-emerald-100 text-emerald-900" : "bg-background text-muted hover:bg-card-border/40"
                }`}
                title={STATUS_LABELS[s]}>
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          {(["abandonne", "expire"] as MandateStatus[]).map((s) => (
            <button key={s} onClick={() => changeStatus(s)}
              className={`rounded-md px-3 py-1 text-[10px] font-semibold ${
                mandate.status === s ? STATUS_COLORS[s] : "bg-background text-muted hover:bg-card-border/40"
              }`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats ligne */}
      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <StatCard label="Prix demandé" value={mandate.prix_demande ? formatEUR(mandate.prix_demande) : "—"} />
          <StatCard label="Commission est." value={formatEUR(stats.split.total)}
            sub={mandate.is_co_mandate ? `dont agence : ${formatEUR(stats.split.primary)}` : undefined} />
          <StatCard label="Fin mandat" value={fmtDate(mandate.end_date)}
            sub={stats.daysLeft !== null ? `${stats.daysLeft}j restants` : undefined}
            tone={stats.daysLeft !== null && stats.daysLeft <= 30 && stats.daysLeft >= 0 ? "warn" : "neutral"} />
          <StatCard label="Diffusion" value={`${stats.publishedCount} portail(s)`}
            sub={stats.totalViews ? `${stats.totalViews} vues · ${stats.totalLeads ?? 0} leads` : undefined} />
          <StatCard label="Offres actives" value={String(stats.activeOffers)}
            sub={stats.bestOffer > 0 ? `meilleure : ${formatEUR(stats.bestOffer)}` : undefined} />
          <StatCard label="Délais"
            value={mandate.days_to_close != null ? `${mandate.days_to_close}j vente` :
                   mandate.days_to_sign != null ? `${mandate.days_to_sign}j compromis` : "—"} />
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-card-border">
        {([
          { id: "apercu", label: "Aperçu & fiche bien" },
          { id: "diffusion", label: `Diffusion (${diffusions.length})` },
          { id: "offres", label: `Offres (${offers.length})` },
          { id: "timeline", label: `Timeline (${interactions.length})` },
        ] as { id: Tab; label: string }[]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "apercu" && (
          <ApercuTab mandate={mandate} form={form} setForm={setForm} editMode={editMode} />
        )}
        {tab === "diffusion" && (
          <DiffusionTab mandate={mandate} diffusions={diffusions} onChange={reload} />
        )}
        {tab === "offres" && (
          <OffresTab mandate={mandate} offers={offers} onChange={reload} />
        )}
        {tab === "timeline" && (
          <TimelineTab mandate={mandate} interactions={interactions} onChange={reload} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Composants
// ============================================================

function StatCard({ label, value, sub, tone = "neutral" }: {
  label: string; value: string; sub?: string; tone?: "neutral" | "warn";
}) {
  const bg = tone === "warn" ? "border-amber-200 bg-amber-50" : "border-card-border bg-card";
  const txt = tone === "warn" ? "text-amber-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-base font-bold ${txt}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted">{sub}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", readOnly = false, step, options }: {
  label: string; value: string | number | null | undefined;
  onChange?: (v: string) => void;
  type?: "text" | "number" | "date" | "textarea" | "select";
  readOnly?: boolean; step?: number;
  options?: { value: string; label: string }[];
}) {
  const v = value ?? "";
  if (readOnly) {
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
        <div className="mt-0.5 text-sm text-navy">{v || "—"}</div>
      </div>
    );
  }
  const base = "w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm";
  return (
    <label className="block">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      {type === "textarea" ? (
        <textarea value={String(v)} rows={3}
          onChange={(e) => onChange?.(e.target.value)} className={base} />
      ) : type === "select" && options ? (
        <select value={String(v)} onChange={(e) => onChange?.(e.target.value)} className={base}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={String(v)} step={step}
          onChange={(e) => onChange?.(e.target.value)} className={base} />
      )}
    </label>
  );
}

function ApercuTab({ mandate, form, setForm, editMode }: {
  mandate: AgencyMandate;
  form: Partial<AgencyMandate>;
  setForm: (p: Partial<AgencyMandate>) => void;
  editMode: boolean;
}) {
  const set = <K extends keyof AgencyMandate>(k: K, v: AgencyMandate[K]) => setForm({ ...form, [k]: v });
  const str = (k: keyof AgencyMandate) => (editMode ? (form[k] as string | null | undefined) : (mandate[k] as string | null | undefined));
  const num = (k: keyof AgencyMandate) => {
    const v = editMode ? form[k] : mandate[k];
    return v != null ? Number(v) : null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Fiche bien */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Fiche bien</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Adresse" value={str("property_address")}
              onChange={(v) => set("property_address", v)} readOnly={!editMode} />
          </div>
          <Field label="Commune" value={str("property_commune")}
            onChange={(v) => set("property_commune", v || null)} readOnly={!editMode} />
          <Field label="Type" value={str("property_type")} readOnly={!editMode}
            type="select" onChange={(v) => set("property_type", v)}
            options={[
              { value: "appartement", label: "Appartement" },
              { value: "maison", label: "Maison" },
              { value: "terrain", label: "Terrain" },
              { value: "commercial", label: "Commercial" },
            ]} />
          <Field label="Surface (m²)" value={num("property_surface")} type="number"
            onChange={(v) => set("property_surface", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label="Chambres" value={num("property_bedrooms")} type="number"
            onChange={(v) => set("property_bedrooms", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label="Salles de bain" value={num("property_bathrooms")} type="number"
            onChange={(v) => set("property_bathrooms", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label="Étage" value={num("property_floor")} type="number"
            onChange={(v) => set("property_floor", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label="Année construction" value={num("property_year_built")} type="number"
            onChange={(v) => set("property_year_built", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label="Classe énergie (CPE)" value={str("property_epc_class")}
            onChange={(v) => set("property_epc_class", v || null)} readOnly={!editMode}
            type="select" options={[
              { value: "", label: "—" },
              ...["A+", "A", "B", "C", "D", "E", "F", "G", "H", "I"].map((c) => ({ value: c, label: c })),
            ]} />
          <div className="col-span-2">
            <Field label="Description publiable" value={str("property_description")} type="textarea"
              onChange={(v) => set("property_description", v || null)} readOnly={!editMode} />
          </div>
        </div>
      </div>

      {/* Conditions commerciales */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Conditions commerciales</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Prix demandé (€)" value={num("prix_demande")} type="number"
            onChange={(v) => set("prix_demande", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label="Commission %" value={num("commission_pct")} type="number" step={0.5}
            onChange={(v) => set("commission_pct", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label="Type mandat" value={str("mandate_type")} readOnly={!editMode}
            type="select" onChange={(v) => set("mandate_type", v as MandateType)}
            options={(Object.entries(TYPE_LABELS) as [string, string][]).map(([v, l]) => ({ value: v, label: l }))} />
          <Field label="Référence interne" value={str("reference")}
            onChange={(v) => set("reference", v || null)} readOnly={!editMode} />
          <Field label="Début mandat" value={str("start_date")} type="date"
            onChange={(v) => set("start_date", v || null)} readOnly={!editMode} />
          <Field label="Fin mandat" value={str("end_date")} type="date"
            onChange={(v) => set("end_date", v || null)} readOnly={!editMode} />
          <Field label="Signé le" value={fmtDate(str("signed_at") as string)} readOnly />
          <Field label="Vendu le" value={fmtDate(str("sold_at") as string)} readOnly />
        </div>

        {/* Co-mandat */}
        <div className="mt-5 border-t border-card-border pt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input type="checkbox" checked={editMode ? !!form.is_co_mandate : mandate.is_co_mandate}
              disabled={!editMode} onChange={(e) => set("is_co_mandate", e.target.checked)} />
            Co-mandat (partage commission avec autre agence)
          </label>
          {(editMode ? form.is_co_mandate : mandate.is_co_mandate) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Nom agence partenaire" value={str("co_agency_name")}
                onChange={(v) => set("co_agency_name", v || null)} readOnly={!editMode} />
              <Field label="Contact partenaire" value={str("co_agency_contact")}
                onChange={(v) => set("co_agency_contact", v || null)} readOnly={!editMode} />
              <Field label="Commission partenaire (% sur prix vente)" value={num("co_agency_commission_pct")}
                type="number" step={0.1}
                onChange={(v) => set("co_agency_commission_pct", v ? Number(v) : null)} readOnly={!editMode} />
            </div>
          )}
        </div>
      </div>

      {/* Client */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Client (mandant)</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Nom" value={str("client_name")}
            onChange={(v) => set("client_name", v || null)} readOnly={!editMode} />
          <Field label="Email" value={str("client_email")}
            onChange={(v) => set("client_email", v || null)} readOnly={!editMode} />
          <Field label="Téléphone" value={str("client_phone")}
            onChange={(v) => set("client_phone", v || null)} readOnly={!editMode} />
        </div>
        <div className="mt-4">
          <Link href={`/pro-agences/crm/contacts?mandate=${mandate.id}`}
            className="text-xs text-navy underline">
            Voir tous les contacts liés à ce mandat →
          </Link>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Notes internes</h2>
        <div className="mt-4">
          <Field label="Notes (non diffusées)" value={str("notes")} type="textarea"
            onChange={(v) => set("notes", v || null)} readOnly={!editMode} />
        </div>
      </div>
    </div>
  );
}

function DiffusionTab({ mandate, diffusions, onChange }: {
  mandate: AgencyMandate;
  diffusions: AgencyMandateDiffusion[];
  onChange: () => Promise<void>;
}) {
  const [addPortal, setAddPortal] = useState<MandatePortal | "">("");
  const missingPortals: MandatePortal[] = ([
    "athome", "immotop", "immoweb", "athome_finance",
    "linkedin", "facebook", "website", "seloger", "leboncoin", "other",
  ] as MandatePortal[]).filter((p) => !diffusions.some((d) => d.portal === p));

  const addDiffusion = async (portal: MandatePortal) => {
    await upsertDiffusion(mandate.id, portal, { status: "draft" });
    setAddPortal("");
    await onChange();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Conseil :</strong> diffuser sur les 3 portails LU majeurs (athome.lu, Immotop.lu, Immoweb)
        maximise la visibilité. L&apos;export OpenImmo (bouton ↓ en haut) est accepté par tous les agrégateurs
        européens pour un push batch — prochainement : sync API temps réel avec athome (business dev en cours).
      </div>

      {/* Ajout portail rapide */}
      {missingPortals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted self-center">Ajouter :</span>
          {missingPortals.slice(0, 6).map((p) => (
            <button key={p} onClick={() => addDiffusion(p)}
              className="rounded-lg border border-dashed border-navy/30 bg-white px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/5">
              + {PORTAL_LABELS[p]}
            </button>
          ))}
          {missingPortals.length > 6 && (
            <select value={addPortal} onChange={(e) => {
              const v = e.target.value as MandatePortal | "";
              if (v) void addDiffusion(v);
            }} className="rounded-lg border border-card-border bg-white px-3 py-1 text-xs">
              <option value="">Autres portails…</option>
              {missingPortals.slice(6).map((p) => (
                <option key={p} value={p}>{PORTAL_LABELS[p]}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Tableau diffusions */}
      {diffusions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucun portail configuré. Ajoutez au moins athome.lu pour une visibilité LU.
          <div className="mt-4 flex justify-center gap-2">
            {DEFAULT_LU_PORTALS.map((p) => (
              <button key={p} onClick={() => addDiffusion(p)}
                className="rounded-lg bg-navy px-3 py-1 text-xs font-semibold text-white">
                + {PORTAL_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/60">
                <th className="px-3 py-3 text-left font-semibold text-navy">Portail</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">Statut</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">Réf externe</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">URL</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">Vues</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">Leads</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">Coût</th>
                <th className="px-3 py-3 text-right font-semibold text-navy"></th>
              </tr>
            </thead>
            <tbody>
              {diffusions.map((d) => <DiffusionRow key={d.id} d={d} onChange={onChange} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DiffusionRow({ d, onChange }: { d: AgencyMandateDiffusion; onChange: () => Promise<void> }) {
  const [externalRef, setExternalRef] = useState(d.external_ref ?? "");
  const [publicUrl, setPublicUrl] = useState(d.public_url ?? "");

  const saveRef = async () => {
    if (externalRef !== (d.external_ref ?? "") || publicUrl !== (d.public_url ?? "")) {
      await upsertDiffusion(d.mandate_id, d.portal, {
        external_ref: externalRef || null,
        public_url: publicUrl || null,
      });
      await onChange();
    }
  };

  return (
    <tr className="border-b border-card-border/40 hover:bg-background/40">
      <td className="px-3 py-3 font-medium text-navy">{PORTAL_LABELS[d.portal]}</td>
      <td className="px-3 py-3">
        <select value={d.status}
          onChange={async (e) => { await updateDiffusionStatus(d.id, e.target.value as DiffusionStatus); await onChange(); }}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${DIFFUSION_STATUS_COLORS[d.status]}`}>
          {(Object.entries(DIFFUSION_STATUS_LABELS) as [DiffusionStatus, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <input type="text" value={externalRef} onBlur={saveRef}
          onChange={(e) => setExternalRef(e.target.value)}
          className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
      </td>
      <td className="px-3 py-3">
        <input type="text" value={publicUrl} onBlur={saveRef} placeholder="https://…"
          onChange={(e) => setPublicUrl(e.target.value)}
          className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
      </td>
      <td className="px-3 py-3 text-right font-mono text-xs">{d.views_count ?? "—"}</td>
      <td className="px-3 py-3 text-right font-mono text-xs">{d.leads_count ?? "—"}</td>
      <td className="px-3 py-3 text-right font-mono text-xs">{d.cost_eur ? formatEUR(d.cost_eur) : "—"}</td>
      <td className="px-3 py-3 text-right">
        <button onClick={async () => {
          if (confirm(`Retirer ${PORTAL_LABELS[d.portal]} ?`)) { await deleteDiffusion(d.id); await onChange(); }
        }} className="text-xs text-rose-700 hover:underline">×</button>
      </td>
    </tr>
  );
}

function OffresTab({ mandate, offers, onChange }: {
  mandate: AgencyMandate;
  offers: AgencyMandateOffer[];
  onChange: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    buyer_name: string; buyer_email: string; amount_eur: string;
    valid_until: string; requires_financing: boolean;
    financing_amount_eur: string; financing_deadline: string;
    other_conditions: string;
  }>({
    buyer_name: "", buyer_email: "", amount_eur: "",
    valid_until: "", requires_financing: true,
    financing_amount_eur: "", financing_deadline: "",
    other_conditions: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.buyer_name.trim() || !form.amount_eur) { setErr("Nom et montant requis."); return; }
    setSaving(true); setErr(null);
    try {
      await createOffer({
        mandate_id: mandate.id,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email || null,
        amount_eur: Number(form.amount_eur),
        valid_until: form.valid_until || null,
        requires_financing: form.requires_financing,
        financing_amount_eur: form.financing_amount_eur ? Number(form.financing_amount_eur) : null,
        financing_deadline: form.financing_deadline || null,
        other_conditions: form.other_conditions || null,
        status: "received",
      });
      await logInteraction({
        mandateId: mandate.id,
        type: "offer",
        direction: "inbound",
        subject: `Offre reçue ${Number(form.amount_eur).toLocaleString("fr-LU")} €`,
        body: `${form.buyer_name}${form.buyer_email ? ` · ${form.buyer_email}` : ""}`,
      });
      setForm({
        buyer_name: "", buyer_email: "", amount_eur: "",
        valid_until: "", requires_financing: true,
        financing_amount_eur: "", financing_deadline: "", other_conditions: "",
      });
      setShowForm(false);
      await onChange();
    } catch (e) {
      setErr(errMsg(e, "Erreur création"));
    }
    setSaving(false);
  };

  const accept = async (o: AgencyMandateOffer) => {
    if (!confirm(`Accepter l'offre de ${o.buyer_name} à ${formatEUR(o.amount_eur)} ?`)) return;
    await updateOffer(o.id, { status: "accepted" });
    await onChange();
  };
  const refuse = async (o: AgencyMandateOffer) => {
    await updateOffer(o.id, { status: "refused" });
    await onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">
          {offers.length === 0
            ? "Aucune offre reçue pour ce bien."
            : `${offers.length} offre(s) · meilleure active : ${formatEUR(Math.max(0, ...offers.filter((o) => !["refused","withdrawn","expired"].includes(o.status)).map((o) => o.amount_eur)))}`}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          {showForm ? "Annuler" : "+ Nouvelle offre"}
        </button>
      </div>

      {err && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{err}</div>}

      {showForm && (
        <div className="rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom acquéreur *" value={form.buyer_name}
              onChange={(v) => setForm((f) => ({ ...f, buyer_name: v }))} />
            <Field label="Email acquéreur" value={form.buyer_email}
              onChange={(v) => setForm((f) => ({ ...f, buyer_email: v }))} />
            <Field label="Montant offre (€) *" value={form.amount_eur} type="number"
              onChange={(v) => setForm((f) => ({ ...f, amount_eur: v }))} />
            <Field label="Valide jusqu'au" value={form.valid_until} type="date"
              onChange={(v) => setForm((f) => ({ ...f, valid_until: v }))} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.requires_financing}
                onChange={(e) => setForm((f) => ({ ...f, requires_financing: e.target.checked }))} />
              Conditionnelle à obtention crédit
            </label>
            <Field label="Montant crédit demandé (€)" value={form.financing_amount_eur} type="number"
              onChange={(v) => setForm((f) => ({ ...f, financing_amount_eur: v }))} />
            <Field label="Deadline accord crédit" value={form.financing_deadline} type="date"
              onChange={(v) => setForm((f) => ({ ...f, financing_deadline: v }))} />
            <div className="sm:col-span-2">
              <Field label="Autres conditions suspensives" value={form.other_conditions} type="textarea"
                onChange={(v) => setForm((f) => ({ ...f, other_conditions: v }))} />
            </div>
          </div>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
            {saving ? "Création…" : "Enregistrer offre"}
          </button>
        </div>
      )}

      {offers.length > 0 && (
        <div className="space-y-3">
          {offers.map((o) => {
            const cmp = offerVsAsking(o, mandate.prix_demande);
            const verdictColor =
              cmp.verdict === "above" ? "text-emerald-700" :
              cmp.verdict === "at" ? "text-navy" :
              cmp.verdict === "below_5" ? "text-amber-700" :
              "text-rose-700";
            return (
              <div key={o.id} className={`rounded-xl border p-4 ${
                o.status === "accepted" ? "border-emerald-200 bg-emerald-50" :
                o.status === "refused" ? "border-rose-100 bg-rose-50/30 opacity-70" :
                "border-card-border bg-card"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy">{o.buyer_name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${OFFER_STATUS_COLORS[o.status]}`}>
                        {OFFER_STATUS_LABELS[o.status]}
                      </span>
                    </div>
                    {o.buyer_email && <div className="text-[10px] text-muted">{o.buyer_email}</div>}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-navy">{formatEUR(o.amount_eur)}</span>
                      {cmp.pct !== null && (
                        <span className={`text-xs font-semibold ${verdictColor}`}>
                          ({cmp.pct >= 0 ? "+" : ""}{cmp.pct.toFixed(1)}% vs demandé)
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
                      <span>Reçue : {fmtDate(o.offered_at)}</span>
                      {o.valid_until && <span>Valide → {fmtDate(o.valid_until)}</span>}
                      {o.requires_financing && (
                        <span className="text-amber-800">
                          Conditionnelle crédit{o.financing_amount_eur ? ` ${formatEUR(o.financing_amount_eur)}` : ""}
                          {o.financing_deadline ? ` (accord avant ${fmtDate(o.financing_deadline)})` : ""}
                        </span>
                      )}
                      {o.requires_sale_of_current_property && <span>Sous condition vente actuelle</span>}
                    </div>
                    {o.other_conditions && (
                      <div className="mt-2 text-xs text-slate italic">{o.other_conditions}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {!["accepted", "refused", "withdrawn", "expired"].includes(o.status) && (
                      <>
                        <button onClick={() => accept(o)}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                          Accepter
                        </button>
                        <button onClick={() => refuse(o)}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          Refuser
                        </button>
                        <button onClick={async () => {
                          await updateOffer(o.id, { status: o.status === "counter_sent" ? "received" : "counter_sent" });
                          await onChange();
                        }} className="rounded-lg border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50">
                          Contre-propo.
                        </button>
                      </>
                    )}
                    <button onClick={async () => {
                      if (confirm("Supprimer cette offre ?")) { await deleteOffer(o.id); await onChange(); }
                    }} className="mt-1 text-[10px] text-rose-700 hover:underline">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ mandate, interactions, onChange }: {
  mandate: AgencyMandate;
  interactions: CrmInteraction[];
  onChange: () => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [type, setType] = useState<CrmInteractionType>("note");

  const log = async () => {
    if (!note.trim()) return;
    await logInteraction({
      mandateId: mandate.id,
      type,
      direction: type === "email" || type === "call" ? "outbound" : "internal",
      subject: type === "note" ? note.slice(0, 80) : `${INTERACTION_LABELS[type]}: ${note.slice(0, 60)}`,
      body: note,
    });
    setNote("");
    await onChange();
  };

  return (
    <div className="space-y-4">
      {/* Quick log */}
      <div className="rounded-xl border border-card-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Ajouter au fil</div>
        <div className="flex flex-wrap gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as CrmInteractionType)}
            className="rounded-lg border border-input-border bg-input-bg px-2 py-2 text-sm">
            {(["note", "call", "email", "sms", "meeting", "visit", "document"] as CrmInteractionType[]).map((t) => (
              <option key={t} value={t}>{INTERACTION_LABELS[t]}</option>
            ))}
          </select>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void log(); }}
            placeholder="Quoi ? (ex. appel client, visite programmée, DPE envoyé…)"
            className="flex-1 min-w-[250px] rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          <button onClick={log} disabled={!note.trim()}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
            Loguer
          </button>
        </div>
      </div>

      {/* Timeline */}
      {interactions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucune interaction enregistrée. Tracez les appels, visites et échanges pour garder un historique complet.
        </div>
      ) : (
        <ol className="relative border-l border-card-border pl-6">
          {interactions.map((i) => (
            <li key={i.id} className="mb-5 ml-2">
              <div className="absolute -left-[7px] h-3 w-3 rounded-full border-2 border-navy bg-background" />
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-navy">
                  {INTERACTION_LABELS[i.interaction_type]}
                </span>
                <span className="text-[10px] text-muted">· {fmtDateTime(i.occurred_at)}</span>
                {i.direction && i.direction !== "internal" && (
                  <span className="rounded bg-background px-1.5 py-0.5 text-[9px] text-muted">
                    {i.direction === "inbound" ? "entrant" : "sortant"}
                  </span>
                )}
              </div>
              {i.subject && <div className="mt-1 text-sm font-medium text-navy">{i.subject}</div>}
              {i.body && i.body !== i.subject && (
                <div className="mt-1 text-xs text-slate whitespace-pre-wrap">{i.body}</div>
              )}
              {i.outcome && (
                <div className="mt-1 rounded bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800 inline-block">
                  → {i.outcome}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
