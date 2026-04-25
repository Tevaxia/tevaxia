"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getMandate, updateMandate, computeEstimatedCommission, computeCoMandateSplit,
  mandateDaysRemaining, mandateProgressPct, MANDATE_PIPELINE_ORDER,
  type AgencyMandate, type MandateStatus, type MandateType,
} from "@/lib/agency-mandates";
import {
  listDiffusion, upsertDiffusion, updateDiffusionStatus, deleteDiffusion,
  DIFFUSION_STATUS_COLORS, DEFAULT_LU_PORTALS,
  type AgencyMandateDiffusion, type MandatePortal, type DiffusionStatus,
} from "@/lib/agency-diffusion";
import {
  listOffers, createOffer, updateOffer, deleteOffer, offerVsAsking,
  OFFER_STATUS_COLORS,
  type AgencyMandateOffer, type OfferStatus,
} from "@/lib/agency-offers";
import { listInteractions, logInteraction } from "@/lib/crm/interactions";
import type { CrmInteraction, CrmInteractionType } from "@/lib/crm/types";
import { buildOpenImmoXml, buildPortalCsv, downloadBlob } from "@/lib/agency-xml";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

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

const STATUS_KEY: Record<MandateStatus, string> = {
  prospect: "statusProspect",
  mandat_signe: "statusMandatSigne",
  diffuse: "statusDiffuse",
  en_visite: "statusEnVisite",
  offre_recue: "statusOffreRecue",
  sous_compromis: "statusSousCompromis",
  vendu: "statusVendu",
  abandonne: "statusAbandonne",
  expire: "statusExpire",
};

const TYPE_KEY: Record<MandateType, string> = {
  exclusif: "typeExclusif",
  simple: "typeSimple",
  semi_exclusif: "typeSemiExclusif",
  recherche: "typeRecherche",
};

const PORTAL_KEY: Record<MandatePortal, string> = {
  athome: "portalAthome",
  immotop: "portalImmotop",
  immoweb: "portalImmoweb",
  athome_finance: "portalAthomeFinance",
  linkedin: "portalLinkedin",
  facebook: "portalFacebook",
  website: "portalWebsite",
  seloger: "portalSeloger",
  leboncoin: "portalLeboncoin",
  other: "portalOther",
};

const DIFF_STATUS_KEY: Record<DiffusionStatus, string> = {
  draft: "diffStatusDraft",
  pending: "diffStatusPending",
  published: "diffStatusPublished",
  paused: "diffStatusPaused",
  expired: "diffStatusExpired",
  withdrawn: "diffStatusWithdrawn",
  rejected: "diffStatusRejected",
};

const OFFER_STATUS_KEY: Record<OfferStatus, string> = {
  received: "offerStatusReceived",
  counter_sent: "offerStatusCounterSent",
  counter_received: "offerStatusCounterReceived",
  accepted: "offerStatusAccepted",
  refused: "offerStatusRefused",
  withdrawn: "offerStatusWithdrawn",
  expired: "offerStatusExpired",
};

const INTERACTION_KEY: Record<CrmInteractionType, string> = {
  call: "interactionCall",
  email: "interactionEmail",
  sms: "interactionSms",
  meeting: "interactionMeeting",
  visit: "interactionVisit",
  offer: "interactionOffer",
  document: "interactionDocument",
  note: "interactionNote",
  task_done: "interactionTaskDone",
  status_change: "interactionStatusChange",
};

type Tab = "apercu" | "diffusion" | "offres" | "timeline";

export default function MandateDetailPage() {
  const t = useTranslations("proaMandateDetail");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const fmtDate = (s: string | null | undefined): string => {
    if (!s) return t("dash");
    return new Date(s).toLocaleDateString(dateLocale, { year: "numeric", month: "short", day: "numeric" });
  };
  const fmtDateTime = (s: string | null | undefined): string => {
    if (!s) return t("dash");
    return new Date(s).toLocaleString(dateLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

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
      setError(errMsg(e, t("errLoad")));
    }
    setLoading(false);
  }, [mandateId, user, t]);

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
      setError(errMsg(e, t("errSave")));
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
      subject: t("statusInternal", { label: t(STATUS_KEY[s]) }),
    });
    await reload();
  };

  const exportOpenImmo = () => {
    if (!mandate) return;
    const xml = buildOpenImmoXml([mandate], {
      firmenname: t("firmenname"),
      openimmo_anid: user?.id ?? "tevaxia",
      lang: locale as "fr" | "de" | "en" | "lb" | "pt",
      email_zentrale: user?.email ?? "",
    });
    downloadBlob(xml, t("fileOpenImmo", { ref: mandate.reference ?? mandate.id.slice(0, 8) }), "application/xml;charset=utf-8");
  };

  const exportCsv = () => {
    if (!mandate) return;
    const csv = buildPortalCsv([mandate]);
    downloadBlob(csv, t("fileMandateCsv", { ref: mandate.reference ?? mandate.id.slice(0, 8) }), "text/csv;charset=utf-8");
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
          {t("supabaseRequired")}
        </div>
      </div>
    );
  }
  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <Link href="/connexion" className="text-navy underline">{t("loginPrompt")}</Link>
      </div>
    );
  }
  if (!mandate) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted">{t("notFound")}</p>
        <Link href="/pro-agences/mandats" className="mt-4 inline-block text-navy underline">{t("backToList")}</Link>
      </div>
    );
  }

  const progress = mandateProgressPct(mandate.status);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences" className="hover:text-navy">{t("crumbProa")}</Link>
        <span>/</span>
        <Link href="/pro-agences/mandats" className="hover:text-navy">{t("crumbMandates")}</Link>
        <span>/</span>
        <span className="text-navy">{mandate.reference ?? mandate.id.slice(0, 8)}</span>
      </div>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy truncate">{mandate.property_address}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[mandate.status]}`}>
              {t(STATUS_KEY[mandate.status])}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {mandate.property_commune ?? t("dash")} · {mandate.property_type ?? t("dash")} · {t(TYPE_KEY[mandate.mandate_type])}
            {mandate.reference && t("refPrefix", { ref: mandate.reference })}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/pro-agences/mandats/${mandate.id}/matching`}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100">
            {t("btnMatching")}
          </Link>
          <Link href={`/pro-agences/mandats/${mandate.id}/signatures`}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-100">
            {t("btnSignatures")}
          </Link>
          <Link href={`/pro-agences/mandats/${mandate.id}/bon-de-visite`}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">
            {t("btnVisitSlip")}
          </Link>
          <button onClick={exportCsv}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
            {t("btnExportCsv")}
          </button>
          <button onClick={exportOpenImmo}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background"
            title={t("btnExportOpenImmoTitle")}>
            {t("btnExportOpenImmo")}
          </button>
          {!editMode ? (
            <button onClick={() => setEditMode(true)}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              {t("btnEdit")}
            </button>
          ) : (
            <>
              <button onClick={() => { setForm(mandate); setEditMode(false); }}
                className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate">
                {t("btnCancel")}
              </button>
              <button onClick={save} disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? t("btnSaving") : t("btnSave")}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      {/* Progress pipeline */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">{t("pipelineLabel")}</div>
          <div className="text-xs text-muted">{t("progressSuffix", { n: progress })}</div>
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
                title={t(STATUS_KEY[s])}>
                {t(STATUS_KEY[s])}
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
              {t(STATUS_KEY[s])}
            </button>
          ))}
        </div>
      </div>

      {/* Stats ligne */}
      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <StatCard label={t("statPrice")} value={mandate.prix_demande ? formatEUR(mandate.prix_demande) : t("dash")} />
          <StatCard label={t("statCommission")} value={formatEUR(stats.split.total)}
            sub={mandate.is_co_mandate ? t("statCommissionAgency", { amount: formatEUR(stats.split.primary) }) : undefined} />
          <StatCard label={t("statEndMandate")} value={fmtDate(mandate.end_date)}
            sub={stats.daysLeft !== null ? t("statDaysLeft", { n: stats.daysLeft }) : undefined}
            tone={stats.daysLeft !== null && stats.daysLeft <= 30 && stats.daysLeft >= 0 ? "warn" : "neutral"} />
          <StatCard label={t("statDiffusion")} value={t("statPortalsCount", { n: stats.publishedCount })}
            sub={stats.totalViews ? t("statViewsLeads", { views: stats.totalViews, leads: stats.totalLeads ?? 0 }) : undefined} />
          <StatCard label={t("statActiveOffers")} value={String(stats.activeOffers)}
            sub={stats.bestOffer > 0 ? t("statBestOffer", { amount: formatEUR(stats.bestOffer) }) : undefined} />
          <StatCard label={t("statDelays")}
            value={mandate.days_to_close != null ? t("statDaysToClose", { n: mandate.days_to_close }) :
                   mandate.days_to_sign != null ? t("statDaysToSign", { n: mandate.days_to_sign }) : t("dash")} />
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-card-border">
        {([
          { id: "apercu", label: t("tabApercu") },
          { id: "diffusion", label: t("tabDiffusion", { n: diffusions.length }) },
          { id: "offres", label: t("tabOffers", { n: offers.length }) },
          { id: "timeline", label: t("tabTimeline", { n: interactions.length }) },
        ] as { id: Tab; label: string }[]).map((tabItem) => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === tabItem.id ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy"
            }`}>
            {tabItem.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "apercu" && (
          <ApercuTab mandate={mandate} form={form} setForm={setForm} editMode={editMode} fmtDate={fmtDate} />
        )}
        {tab === "diffusion" && (
          <DiffusionTab mandate={mandate} diffusions={diffusions} onChange={reload} />
        )}
        {tab === "offres" && (
          <OffresTab mandate={mandate} offers={offers} onChange={reload} fmtDate={fmtDate} dateLocale={dateLocale} />
        )}
        {tab === "timeline" && (
          <TimelineTab mandate={mandate} interactions={interactions} onChange={reload} fmtDateTime={fmtDateTime} />
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

function Field({ label, value, onChange, type = "text", readOnly = false, step, options, dash = "—" }: {
  label: string; value: string | number | null | undefined;
  onChange?: (v: string) => void;
  type?: "text" | "number" | "date" | "textarea" | "select";
  readOnly?: boolean; step?: number;
  options?: { value: string; label: string }[];
  dash?: string;
}) {
  const v = value ?? "";
  if (readOnly) {
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
        <div className="mt-0.5 text-sm text-navy">{v || dash}</div>
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

function ApercuTab({ mandate, form, setForm, editMode, fmtDate }: {
  mandate: AgencyMandate;
  form: Partial<AgencyMandate>;
  setForm: (p: Partial<AgencyMandate>) => void;
  editMode: boolean;
  fmtDate: (s: string | null | undefined) => string;
}) {
  const t = useTranslations("proaMandateDetail");
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
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("sectionPropertyInfo")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label={t("fieldAddress")} value={str("property_address")} dash={t("dash")}
              onChange={(v) => set("property_address", v)} readOnly={!editMode} />
          </div>
          <Field label={t("fieldCommune")} value={str("property_commune")} dash={t("dash")}
            onChange={(v) => set("property_commune", v || null)} readOnly={!editMode} />
          <Field label={t("fieldType")} value={str("property_type")} readOnly={!editMode} dash={t("dash")}
            type="select" onChange={(v) => set("property_type", v)}
            options={[
              { value: "appartement", label: t("propTypeApartment") },
              { value: "maison", label: t("propTypeHouse") },
              { value: "terrain", label: t("propTypeLand") },
              { value: "commercial", label: t("propTypeCommercial") },
            ]} />
          <Field label={t("fieldSurface")} value={num("property_surface")} type="number" dash={t("dash")}
            onChange={(v) => set("property_surface", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label={t("fieldBedrooms")} value={num("property_bedrooms")} type="number" dash={t("dash")}
            onChange={(v) => set("property_bedrooms", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label={t("fieldBathrooms")} value={num("property_bathrooms")} type="number" dash={t("dash")}
            onChange={(v) => set("property_bathrooms", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label={t("fieldFloor")} value={num("property_floor")} type="number" dash={t("dash")}
            onChange={(v) => set("property_floor", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label={t("fieldYearBuilt")} value={num("property_year_built")} type="number" dash={t("dash")}
            onChange={(v) => set("property_year_built", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label={t("fieldEpc")} value={str("property_epc_class")} dash={t("dash")}
            onChange={(v) => set("property_epc_class", v || null)} readOnly={!editMode}
            type="select" options={[
              { value: "", label: t("dash") },
              ...["A+", "A", "B", "C", "D", "E", "F", "G", "H", "I"].map((c) => ({ value: c, label: c })),
            ]} />
          <div className="col-span-2">
            <Field label={t("fieldDescription")} value={str("property_description")} type="textarea" dash={t("dash")}
              onChange={(v) => set("property_description", v || null)} readOnly={!editMode} />
          </div>
        </div>
      </div>

      {/* Conditions commerciales */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("sectionCommercial")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label={t("fieldPrice")} value={num("prix_demande")} type="number" dash={t("dash")}
            onChange={(v) => set("prix_demande", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label={t("fieldCommissionPct")} value={num("commission_pct")} type="number" step={0.5} dash={t("dash")}
            onChange={(v) => set("commission_pct", v ? Number(v) : null)} readOnly={!editMode} />
          <Field label={t("fieldMandateType")} value={str("mandate_type")} readOnly={!editMode} dash={t("dash")}
            type="select" onChange={(v) => set("mandate_type", v as MandateType)}
            options={(Object.keys(TYPE_KEY) as MandateType[]).map((k) => ({ value: k, label: t(TYPE_KEY[k]) }))} />
          <Field label={t("fieldRef")} value={str("reference")} dash={t("dash")}
            onChange={(v) => set("reference", v || null)} readOnly={!editMode} />
          <Field label={t("fieldStartDate")} value={str("start_date")} type="date" dash={t("dash")}
            onChange={(v) => set("start_date", v || null)} readOnly={!editMode} />
          <Field label={t("fieldEndDate")} value={str("end_date")} type="date" dash={t("dash")}
            onChange={(v) => set("end_date", v || null)} readOnly={!editMode} />
          <Field label={t("fieldSignedAt")} value={fmtDate(str("signed_at") as string)} readOnly dash={t("dash")} />
          <Field label={t("fieldSoldAt")} value={fmtDate(str("sold_at") as string)} readOnly dash={t("dash")} />
        </div>

        {/* Co-mandat */}
        <div className="mt-5 border-t border-card-border pt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input type="checkbox" checked={editMode ? !!form.is_co_mandate : mandate.is_co_mandate}
              disabled={!editMode} onChange={(e) => set("is_co_mandate", e.target.checked)} />
            {t("coMandateLabel")}
          </label>
          {(editMode ? form.is_co_mandate : mandate.is_co_mandate) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label={t("coAgencyName")} value={str("co_agency_name")} dash={t("dash")}
                onChange={(v) => set("co_agency_name", v || null)} readOnly={!editMode} />
              <Field label={t("coAgencyContact")} value={str("co_agency_contact")} dash={t("dash")}
                onChange={(v) => set("co_agency_contact", v || null)} readOnly={!editMode} />
              <Field label={t("coAgencyPct")} value={num("co_agency_commission_pct")} dash={t("dash")}
                type="number" step={0.1}
                onChange={(v) => set("co_agency_commission_pct", v ? Number(v) : null)} readOnly={!editMode} />
            </div>
          )}
        </div>
      </div>

      {/* Client */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("sectionClient")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label={t("fieldClientName")} value={str("client_name")} dash={t("dash")}
            onChange={(v) => set("client_name", v || null)} readOnly={!editMode} />
          <Field label={t("fieldClientEmail")} value={str("client_email")} dash={t("dash")}
            onChange={(v) => set("client_email", v || null)} readOnly={!editMode} />
          <Field label={t("fieldClientPhone")} value={str("client_phone")} dash={t("dash")}
            onChange={(v) => set("client_phone", v || null)} readOnly={!editMode} />
        </div>
        <div className="mt-4">
          <Link href={`/pro-agences/crm/contacts?mandate=${mandate.id}`}
            className="text-xs text-navy underline">
            {t("linkContacts")}
          </Link>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("sectionNotes")}</h2>
        <div className="mt-4">
          <Field label={t("fieldNotes")} value={str("notes")} type="textarea" dash={t("dash")}
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
  const t = useTranslations("proaMandateDetail");
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
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900"
        dangerouslySetInnerHTML={{ __html: t("diffusionAdvice") }}
      />

      {/* Ajout portail rapide */}
      {missingPortals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted self-center">{t("addPortalLabel")}</span>
          {missingPortals.slice(0, 6).map((p) => (
            <button key={p} onClick={() => addDiffusion(p)}
              className="rounded-lg border border-dashed border-navy/30 bg-white px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/5">
              + {t(PORTAL_KEY[p])}
            </button>
          ))}
          {missingPortals.length > 6 && (
            <select value={addPortal} onChange={(e) => {
              const v = e.target.value as MandatePortal | "";
              if (v) void addDiffusion(v);
            }} className="rounded-lg border border-card-border bg-white px-3 py-1 text-xs">
              <option value="">{t("otherPortals")}</option>
              {missingPortals.slice(6).map((p) => (
                <option key={p} value={p}>{t(PORTAL_KEY[p])}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Tableau diffusions */}
      {diffusions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("emptyPortals")}
          <div className="mt-4 flex justify-center gap-2">
            {DEFAULT_LU_PORTALS.map((p) => (
              <button key={p} onClick={() => addDiffusion(p)}
                className="rounded-lg bg-navy px-3 py-1 text-xs font-semibold text-white">
                + {t(PORTAL_KEY[p])}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/60">
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("colPortal")}</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("colStatus")}</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("colExternalRef")}</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("colUrl")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("colViews")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("colLeads")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("colCost")}</th>
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
  const t = useTranslations("proaMandateDetail");
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
      <td className="px-3 py-3 font-medium text-navy">{t(PORTAL_KEY[d.portal])}</td>
      <td className="px-3 py-3">
        <select value={d.status}
          onChange={async (e) => { await updateDiffusionStatus(d.id, e.target.value as DiffusionStatus); await onChange(); }}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${DIFFUSION_STATUS_COLORS[d.status]}`}>
          {(Object.keys(DIFF_STATUS_KEY) as DiffusionStatus[]).map((v) => (
            <option key={v} value={v}>{t(DIFF_STATUS_KEY[v])}</option>
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
      <td className="px-3 py-3 text-right font-mono text-xs">{d.views_count ?? t("dash")}</td>
      <td className="px-3 py-3 text-right font-mono text-xs">{d.leads_count ?? t("dash")}</td>
      <td className="px-3 py-3 text-right font-mono text-xs">{d.cost_eur ? formatEUR(d.cost_eur) : t("dash")}</td>
      <td className="px-3 py-3 text-right">
        <button onClick={async () => {
          if (confirm(t("confirmRemovePortal", { portal: t(PORTAL_KEY[d.portal]) }))) { await deleteDiffusion(d.id); await onChange(); }
        }} className="text-xs text-rose-700 hover:underline">×</button>
      </td>
    </tr>
  );
}

function OffresTab({ mandate, offers, onChange, fmtDate, dateLocale }: {
  mandate: AgencyMandate;
  offers: AgencyMandateOffer[];
  onChange: () => Promise<void>;
  fmtDate: (s: string | null | undefined) => string;
  dateLocale: string;
}) {
  const t = useTranslations("proaMandateDetail");
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
    if (!form.buyer_name.trim() || !form.amount_eur) { setErr(t("errBuyerNameAmount")); return; }
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
        subject: t("offerLogSubject", { amount: Number(form.amount_eur).toLocaleString(dateLocale) }),
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
      setErr(errMsg(e, t("errCreateOffer")));
    }
    setSaving(false);
  };

  const accept = async (o: AgencyMandateOffer) => {
    if (!confirm(t("confirmAcceptOffer", { name: o.buyer_name, amount: formatEUR(o.amount_eur) }))) return;
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
            ? t("offersEmpty")
            : t("offersCount", {
                n: offers.length,
                amount: formatEUR(Math.max(0, ...offers.filter((o) => !["refused","withdrawn","expired"].includes(o.status)).map((o) => o.amount_eur))),
              })}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          {showForm ? t("btnCancel") : t("btnNewOffer")}
        </button>
      </div>

      {err && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{err}</div>}

      {showForm && (
        <div className="rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("fieldBuyerName")} value={form.buyer_name}
              onChange={(v) => setForm((f) => ({ ...f, buyer_name: v }))} />
            <Field label={t("fieldBuyerEmail")} value={form.buyer_email}
              onChange={(v) => setForm((f) => ({ ...f, buyer_email: v }))} />
            <Field label={t("fieldOfferAmount")} value={form.amount_eur} type="number"
              onChange={(v) => setForm((f) => ({ ...f, amount_eur: v }))} />
            <Field label={t("fieldValidUntil")} value={form.valid_until} type="date"
              onChange={(v) => setForm((f) => ({ ...f, valid_until: v }))} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.requires_financing}
                onChange={(e) => setForm((f) => ({ ...f, requires_financing: e.target.checked }))} />
              {t("fieldRequiresFinancing")}
            </label>
            <Field label={t("fieldFinancingAmount")} value={form.financing_amount_eur} type="number"
              onChange={(v) => setForm((f) => ({ ...f, financing_amount_eur: v }))} />
            <Field label={t("fieldFinancingDeadline")} value={form.financing_deadline} type="date"
              onChange={(v) => setForm((f) => ({ ...f, financing_deadline: v }))} />
            <div className="sm:col-span-2">
              <Field label={t("fieldOtherConditions")} value={form.other_conditions} type="textarea"
                onChange={(v) => setForm((f) => ({ ...f, other_conditions: v }))} />
            </div>
          </div>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
            {saving ? t("btnSavingOffer") : t("btnSaveOffer")}
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
                        {t(OFFER_STATUS_KEY[o.status])}
                      </span>
                    </div>
                    {o.buyer_email && <div className="text-[10px] text-muted">{o.buyer_email}</div>}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-navy">{formatEUR(o.amount_eur)}</span>
                      {cmp.pct !== null && (
                        <span className={`text-xs font-semibold ${verdictColor}`}>
                          {t("offerVsPct", { sign: cmp.pct >= 0 ? "+" : "", pct: cmp.pct.toFixed(1) })}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
                      <span>{t("offerReceivedOn", { date: fmtDate(o.offered_at) })}</span>
                      {o.valid_until && <span>{t("offerValidUntil", { date: fmtDate(o.valid_until) })}</span>}
                      {o.requires_financing && (
                        <span className="text-amber-800">
                          {t("offerFinancingCond", { amount: o.financing_amount_eur ? ` ${formatEUR(o.financing_amount_eur)}` : "" })}
                          {o.financing_deadline ? t("offerFinancingDeadline", { date: fmtDate(o.financing_deadline) }) : ""}
                        </span>
                      )}
                      {o.requires_sale_of_current_property && <span>{t("offerSaleCond")}</span>}
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
                          {t("btnAccept")}
                        </button>
                        <button onClick={() => refuse(o)}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          {t("btnRefuse")}
                        </button>
                        <button onClick={async () => {
                          await updateOffer(o.id, { status: o.status === "counter_sent" ? "received" : "counter_sent" });
                          await onChange();
                        }} className="rounded-lg border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50">
                          {t("btnCounter")}
                        </button>
                      </>
                    )}
                    <button onClick={async () => {
                      if (confirm(t("confirmDeleteOffer"))) { await deleteOffer(o.id); await onChange(); }
                    }} className="mt-1 text-[10px] text-rose-700 hover:underline">
                      {t("btnDelete")}
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

function TimelineTab({ mandate, interactions, onChange, fmtDateTime }: {
  mandate: AgencyMandate;
  interactions: CrmInteraction[];
  onChange: () => Promise<void>;
  fmtDateTime: (s: string | null | undefined) => string;
}) {
  const t = useTranslations("proaMandateDetail");
  const [note, setNote] = useState("");
  const [type, setType] = useState<CrmInteractionType>("note");

  const log = async () => {
    if (!note.trim()) return;
    await logInteraction({
      mandateId: mandate.id,
      type,
      direction: type === "email" || type === "call" ? "outbound" : "internal",
      subject: type === "note"
        ? note.slice(0, 80)
        : t("interactionSubjectFmt", { type: t(INTERACTION_KEY[type]), body: note.slice(0, 60) }),
      body: note,
    });
    setNote("");
    await onChange();
  };

  return (
    <div className="space-y-4">
      {/* Quick log */}
      <div className="rounded-xl border border-card-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("timelineAddTitle")}</div>
        <div className="flex flex-wrap gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as CrmInteractionType)}
            className="rounded-lg border border-input-border bg-input-bg px-2 py-2 text-sm">
            {(["note", "call", "email", "sms", "meeting", "visit", "document"] as CrmInteractionType[]).map((tt) => (
              <option key={tt} value={tt}>{t(INTERACTION_KEY[tt])}</option>
            ))}
          </select>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void log(); }}
            placeholder={t("timelinePlaceholder")}
            className="flex-1 min-w-[250px] rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          <button onClick={log} disabled={!note.trim()}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
            {t("btnLog")}
          </button>
        </div>
      </div>

      {/* Timeline */}
      {interactions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("timelineEmpty")}
        </div>
      ) : (
        <ol className="relative border-l border-card-border pl-6">
          {interactions.map((i) => (
            <li key={i.id} className="mb-5 ml-2">
              <div className="absolute -left-[7px] h-3 w-3 rounded-full border-2 border-navy bg-background" />
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-navy">
                  {t(INTERACTION_KEY[i.interaction_type])}
                </span>
                <span className="text-[10px] text-muted">· {fmtDateTime(i.occurred_at)}</span>
                {i.direction && i.direction !== "internal" && (
                  <span className="rounded bg-background px-1.5 py-0.5 text-[9px] text-muted">
                    {i.direction === "inbound" ? t("directionInbound") : t("directionOutbound")}
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
