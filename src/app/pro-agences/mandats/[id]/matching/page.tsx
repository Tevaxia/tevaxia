"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getMandate, type AgencyMandate } from "@/lib/agency-mandates";
import {
  findContactsForMandate, VERDICT_COLORS,
  type MatchResult, type MatchVerdict,
} from "@/lib/agency-matching";
import { contactDisplayName, type CrmContactKind } from "@/lib/crm/types";
import { logInteraction } from "@/lib/crm/interactions";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

const VERDICT_KEY: Record<MatchVerdict, string> = {
  strong: "verdictStrong",
  possible: "verdictPossible",
  weak: "verdictWeak",
};

const KIND_KEY: Record<CrmContactKind, string> = {
  prospect: "kindProspect",
  lead: "kindLead",
  acquereur: "kindAcquereur",
  vendeur: "kindVendeur",
  bailleur: "kindBailleur",
  locataire: "kindLocataire",
  partenaire: "kindPartenaire",
  autre: "kindAutre",
};

export default function MandateMatchingPage() {
  const t = useTranslations("proaMatching");
  const params = useParams<{ id: string }>();
  const mandateId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const [mandate, setMandate] = useState<AgencyMandate | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(40);

  const reload = useCallback(async () => {
    if (!mandateId || !isSupabaseConfigured || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [m, results] = await Promise.all([
        getMandate(mandateId),
        findContactsForMandate(mandateId, { minScore }),
      ]);
      setMandate(m);
      setMatches(results);
    } catch (e) {
      setError(errMsg(e, t("errMatching")));
    }
    setLoading(false);
  }, [mandateId, user, minScore, t]);

  useEffect(() => { void reload(); }, [reload]);

  const flagAndContact = async (m: MatchResult) => {
    try {
      await logInteraction({
        mandateId: m.mandate.id,
        contactId: m.contact.id,
        type: "note",
        direction: "internal",
        subject: t("suggestionLogSubject", { verdict: t(VERDICT_KEY[m.verdict]), score: m.score.total }),
        body: m.score.notes.join(" · "),
      });
      alert(t("suggestionLogAlert", { name: contactDisplayName(m.contact) }));
    } catch (e) {
      setError(errMsg(e, t("errGeneric")));
    }
  };

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href="/connexion" className="text-navy underline">{t("loginPrompt")}</Link>
    </div>
  );
  if (!mandate) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
      {t("notFound")} <Link href="/pro-agences/mandats" className="text-navy underline">{t("backToList")}</Link>
    </div>
  );

  const stats = {
    strong: matches.filter((m) => m.verdict === "strong").length,
    possible: matches.filter((m) => m.verdict === "possible").length,
    weak: matches.filter((m) => m.verdict === "weak").length,
  };

  const buildEmailBody = (m: MatchResult): string => {
    const commune = mandate.property_commune ? t("emailBodyCommune", { commune: mandate.property_commune }) : "";
    const price = mandate.prix_demande ? t("emailBodyPrice", { price: formatEUR(mandate.prix_demande) }) : "";
    const surface = mandate.property_surface ? t("emailBodySurface", { surface: mandate.property_surface }) : "";
    return t("emailBody", {
      name: m.contact.first_name ?? "",
      address: mandate.property_address,
      commune,
      price,
      surface,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/pro-agences/mandats" className="hover:text-navy">{t("crumbMandates")}</Link>
        <span>/</span>
        <Link href={`/pro-agences/mandats/${mandateId}`} className="hover:text-navy">
          {mandate.reference ?? mandate.id.slice(0, 8)}
        </Link>
        <span>/</span>
        <span className="text-navy">{t("crumbMatching")}</span>
      </div>

      {/* Header */}
      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>
      </div>

      {/* Rappel mandat */}
      <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-navy">{mandate.property_address}</span>
          <span className="rounded-full bg-background px-2 py-0.5">{mandate.property_commune ?? "—"}</span>
          <span className="rounded-full bg-background px-2 py-0.5">{mandate.property_type ?? "—"}</span>
          <span className="rounded-full bg-background px-2 py-0.5 font-mono">
            {mandate.prix_demande ? formatEUR(mandate.prix_demande) : t("badgePriceUnknown")}
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 font-mono">
            {mandate.property_surface ? `${mandate.property_surface} m²` : t("badgeSurfaceUnknown")}
          </span>
          {mandate.property_epc_class && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-900">
              {t("badgeEpc", { class: mandate.property_epc_class })}
            </span>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
        <StatCard label={t("statStrong")} value={stats.strong} tone="emerald" />
        <StatCard label={t("statPossible")} value={stats.possible} tone="amber" />
        <StatCard label={t("statWeak")} value={stats.weak} tone="neutral" />
        <StatCard label={t("statTotal")} value={matches.length} tone="navy" />
      </div>

      {/* Threshold filter */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">{t("thresholdLabel")}</span>
          {[0, 40, 70].map((s) => (
            <button key={s} onClick={() => setMinScore(s)}
              className={`rounded-full px-3 py-1 font-semibold ${
                minScore === s ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
              }`}>
              {s === 0 ? t("thresholdAll") : s === 40 ? t("thresholdPossible") : t("thresholdStrong")}
            </button>
          ))}
        </div>
      </div>

      {/* Matches list */}
      {matches.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("emptyMatches")}
          <div className="mt-2 text-xs">{t("emptyHint")}</div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {matches.map((m) => (
            <div key={m.contact.id} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/pro-agences/crm/contacts/${m.contact.id}`}
                      className="text-base font-semibold text-navy hover:underline truncate">
                      {contactDisplayName(m.contact)}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERDICT_COLORS[m.verdict]}`}>
                      {t(VERDICT_KEY[m.verdict])}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted">
                      {t(KIND_KEY[m.contact.kind])}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted">
                    {m.contact.email && <span>📧 {m.contact.email}</span>}
                    {m.contact.phone && <span>📞 {m.contact.phone}</span>}
                    {(m.contact.budget_min != null || m.contact.budget_max != null) && (
                      <span>
                        {t("budgetLabel", {
                          min: m.contact.budget_min ? formatEUR(m.contact.budget_min) : t("budgetUnknown"),
                          max: m.contact.budget_max ? formatEUR(m.contact.budget_max) : t("budgetUnknown"),
                        })}
                      </span>
                    )}
                    {(m.contact.target_surface_min != null || m.contact.target_surface_max != null) && (
                      <span>
                        {t("surfaceLabel", {
                          min: m.contact.target_surface_min ?? t("budgetUnknown"),
                          max: m.contact.target_surface_max ?? t("budgetUnknown"),
                        })}
                      </span>
                    )}
                    {m.contact.target_zones && m.contact.target_zones.length > 0 && (
                      <span>{t("zonesLabel", { list: m.contact.target_zones.join(", ") })}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-navy">{m.score.total}</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted">{t("scoreOver")}</div>
                  </div>
                </div>
              </div>

              {/* Score breakdown bars */}
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ScoreBar label={t("barBudget")} value={m.score.budget} max={40} />
                <ScoreBar label={t("barSurface")} value={m.score.surface} max={30} />
                <ScoreBar label={t("barZone")} value={m.score.zone} max={20} />
                <ScoreBar label={t("barType")} value={m.score.type} max={10} />
              </div>

              {/* Notes */}
              <details className="mt-3">
                <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-muted">
                  {t("scoreDetails")}
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-slate">
                  {m.score.noteKeys.map((nk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-navy">·</span>
                      <span>{t(nk.key, nk.params ?? {})}</span>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {m.contact.email && (
                  <a href={`mailto:${m.contact.email}?subject=${encodeURIComponent(t("emailSubject", { address: mandate.property_address }))}&body=${encodeURIComponent(buildEmailBody(m))}`}
                    className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                    {t("btnEmail")}
                  </a>
                )}
                <button onClick={() => flagAndContact(m)}
                  className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-background">
                  {t("btnLogSuggestion")}
                </button>
                <Link href={`/pro-agences/crm/contacts/${m.contact.id}`}
                  className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-slate hover:bg-background">
                  {t("btnViewContact")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900"
        dangerouslySetInnerHTML={{ __html: t("algoNotice") }}
      />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "neutral" | "navy" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200"
    : tone === "amber" ? "bg-amber-50 border-amber-200"
    : tone === "navy" ? "bg-navy text-white border-transparent"
    : "bg-card border-card-border";
  const text = tone === "emerald" ? "text-emerald-900"
    : tone === "amber" ? "text-amber-900"
    : tone === "navy" ? "text-white"
    : "text-navy";
  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className={`text-[10px] uppercase tracking-wider ${tone === "navy" ? "text-white/70" : "text-muted"}`}>{label}</div>
      <div className={`mt-1 text-2xl font-bold ${text}`}>{value}</div>
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : pct > 0 ? "bg-slate-400" : "bg-slate-200";
  return (
    <div>
      <div className="flex items-baseline justify-between text-[10px] text-muted mb-1">
        <span className="font-semibold uppercase tracking-wider">{label}</span>
        <span className="font-mono">{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
