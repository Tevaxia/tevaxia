"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { listMyMandates, mandateDaysRemaining, type AgencyMandate } from "@/lib/agency-mandates";
import { listSignatureRequests, type SignatureRequest } from "@/lib/agency-signatures";
import { formatEUR } from "@/lib/calculations";

interface AlertItem {
  id: string;
  module: "crm" | "syndic" | "pms";
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  actionUrl: string;
  actionLabel: string;
  amount?: number;
  dueDate?: string;
}

const SEVERITY_COLORS: Record<AlertItem["severity"], string> = {
  critical: "border-rose-300 bg-rose-50",
  warning: "border-amber-300 bg-amber-50",
  info: "border-blue-300 bg-blue-50",
};

const SEVERITY_BADGES: Record<AlertItem["severity"], string> = {
  critical: "bg-rose-600 text-white",
  warning: "bg-amber-600 text-white",
  info: "bg-blue-600 text-white",
};

const MODULE_COLORS: Record<AlertItem["module"], string> = {
  crm: "bg-indigo-100 text-indigo-900",
  syndic: "bg-fuchsia-100 text-fuchsia-900",
  pms: "bg-teal-100 text-teal-900",
};

export default function AlertsPage() {
  const t = useTranslations("actionsPrioritaires");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale;

  const { user, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | AlertItem["severity"] | AlertItem["module"]>("all");

  const buildAlerts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const collected: AlertItem[] = [];

    try {
      const mandates = await listMyMandates();
      const active = mandates.filter((m) =>
        ["mandat_signe", "diffuse", "en_visite", "offre_recue", "sous_compromis"].includes(m.status),
      );
      for (const m of active) {
        const d = mandateDaysRemaining(m.end_date);
        if (d !== null && d >= 0 && d <= 30) {
          collected.push({
            id: `mandate-exp-${m.id}`, module: "crm",
            severity: d <= 7 ? "critical" : "warning",
            title: t("alerts.mandateExpiring", { days: d }),
            detail: m.property_address,
            actionUrl: `${lp}/pro-agences/mandats/${m.id}`,
            actionLabel: t("alerts.openMandate"),
            amount: m.commission_amount_estimee ?? undefined,
            dueDate: m.end_date ?? undefined,
          });
        }
      }

      const pending = await listSignatureRequests({ status: ["sent", "viewed"] });
      const now = Date.now();
      for (const s of pending as SignatureRequest[]) {
        if (!s.sent_at) continue;
        const days = Math.floor((now - new Date(s.sent_at).getTime()) / 86400000);
        if (days >= 3) {
          collected.push({
            id: `sig-pending-${s.id}`, module: "crm",
            severity: days >= 14 ? "critical" : "warning",
            title: t("alerts.sigPending", { days }),
            detail: t("alerts.sigPendingDetail", { name: s.signer_name, doc: s.document_title }),
            actionUrl: s.mandate_id
              ? `${lp}/pro-agences/mandats/${s.mandate_id}/signatures`
              : `${lp}/pro-agences/mandats`,
            actionLabel: t("alerts.remindSig"),
            dueDate: s.expires_at,
          });
        }
      }

      const { data: unpaidData } = await supabase
        .from("coownership_unpaid_charges")
        .select("*");
      type Unpaid = {
        charge_id: string; lot_number: string; owner_name: string | null;
        call_label: string; due_date: string; amount_outstanding: number;
        days_late: number; last_palier_sent: number; eligible_palier: number;
        coownership_id: string;
      };
      for (const u of ((unpaidData ?? []) as Unpaid[])) {
        if (u.eligible_palier > u.last_palier_sent) {
          collected.push({
            id: `unpaid-${u.charge_id}`, module: "syndic",
            severity: u.days_late > 60 ? "critical" : u.days_late > 30 ? "warning" : "info",
            title: t("alerts.unpaid", { lot: u.lot_number, tier: u.eligible_palier }),
            detail: t("alerts.unpaidDetail", {
              owner: u.owner_name ?? "?",
              label: u.call_label,
              days: u.days_late,
            }),
            actionUrl: `${lp}/syndic/coproprietes/${u.coownership_id}/relances`,
            actionLabel: t("alerts.manageReminders"),
            amount: Number(u.amount_outstanding),
            dueDate: u.due_date,
          });
        }
      }

      const { data: convAssemblies } = await supabase
        .from("coownership_assemblies")
        .select("id, title, coownership_id, scheduled_at, status")
        .in("status", ["draft", "convened"]);
      for (const a of ((convAssemblies ?? []) as Array<{
        id: string; title: string; coownership_id: string; scheduled_at: string; status: string;
      }>)) {
        const { count } = await supabase
          .from("assembly_resolutions")
          .select("*", { count: "exact", head: true })
          .eq("assembly_id", a.id);
        if ((count ?? 0) === 0) {
          collected.push({
            id: `ag-noresol-${a.id}`, module: "syndic",
            severity: "warning",
            title: t("alerts.agNoResol", { title: a.title }),
            detail: t("alerts.agScheduled", { date: new Date(a.scheduled_at).toLocaleDateString(dateLocale) }),
            actionUrl: `${lp}/syndic/coproprietes/${a.coownership_id}/assemblees/${a.id}`,
            actionLabel: t("alerts.addAgenda"),
            dueDate: a.scheduled_at,
          });
        }
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const { data: noShows } = await supabase
        .from("pms_reservations")
        .select("id, property_id, booker_name, check_in, check_out, total_amount")
        .eq("status", "no_show")
        .gte("check_in", sevenDaysAgo);
      for (const r of ((noShows ?? []) as Array<{
        id: string; property_id: string; booker_name: string | null;
        check_in: string; check_out: string; total_amount: number;
      }>)) {
        collected.push({
          id: `noshow-${r.id}`, module: "pms",
          severity: "warning",
          title: t("alerts.noShow"),
          detail: t("alerts.noShowDetail", { name: r.booker_name ?? "?", date: r.check_in }),
          actionUrl: `${lp}/pms/${r.property_id}/reservations/${r.id}`,
          actionLabel: t("alerts.treat"),
          amount: Number(r.total_amount),
        });
      }

      const severityRank: Record<AlertItem["severity"], number> = { critical: 0, warning: 1, info: 2 };
      collected.sort((a, b) => {
        const sr = severityRank[a.severity] - severityRank[b.severity];
        if (sr !== 0) return sr;
        return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      });

      setAlerts(collected);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [user, t, lp, dateLocale]);

  useEffect(() => { if (!authLoading && user) void buildAlerts(); }, [user, authLoading, buildAlerts]);

  const filtered = alerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "critical" || filter === "warning" || filter === "info") return a.severity === filter;
    return a.module === filter;
  });

  const counts = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    crm: alerts.filter((a) => a.module === "crm").length,
    syndic: alerts.filter((a) => a.module === "syndic").length,
    pms: alerts.filter((a) => a.module === "pms").length,
  };

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href={`${lp}/connexion`} className="text-navy underline">{t("signIn")}</Link></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={counts.total} onClick={() => setFilter("all")}
          active={filter === "all"} />
        <StatCard label={t("stats.critical")} value={counts.critical} tone="critical"
          onClick={() => setFilter("critical")} active={filter === "critical"} />
        <StatCard label={t("stats.warning")} value={counts.warning} tone="warning"
          onClick={() => setFilter("warning")} active={filter === "warning"} />
        <StatCard label={t("stats.info")} value={counts.info} tone="info"
          onClick={() => setFilter("info")} active={filter === "info"} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="text-muted self-center">{t("module")}</span>
        {(["all", "crm", "syndic", "pms"] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 font-semibold ${
              filter === k ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
            }`}>
            {k === "all" ? t("filter.all", { n: counts.total })
              : k === "crm" ? t("filter.crm", { n: counts.crm })
              : k === "syndic" ? t("filter.syndic", { n: counts.syndic })
              : t("filter.pms", { n: counts.pms })}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-16 text-center">
          <div className="text-4xl mb-2">✓</div>
          <h2 className="text-lg font-bold text-emerald-900">{t("empty.title")}</h2>
          <p className="mt-2 text-sm text-muted">{t("empty.sub")}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 ${SEVERITY_COLORS[a.severity]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_BADGES[a.severity]}`}>
                      {a.severity}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${MODULE_COLORS[a.module]}`}>
                      {t(`moduleLabels.${a.module}`)}
                    </span>
                    {a.amount != null && (
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-mono">
                        {formatEUR(a.amount)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-base font-bold text-navy">{a.title}</h3>
                  <p className="mt-0.5 text-xs text-slate">{a.detail}</p>
                </div>
                <Link href={a.actionUrl}
                  className="shrink-0 rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light">
                  {a.actionLabel} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        {t("footer")}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone, onClick, active }: {
  label: string; value: number;
  tone?: "critical" | "warning" | "info";
  onClick: () => void; active: boolean;
}) {
  const bg = active ? "ring-2 ring-navy" : "";
  const toneBg = tone === "critical" ? "bg-rose-50 border-rose-200" :
    tone === "warning" ? "bg-amber-50 border-amber-200" :
    tone === "info" ? "bg-blue-50 border-blue-200" : "bg-card border-card-border";
  const toneTxt = tone === "critical" ? "text-rose-900" :
    tone === "warning" ? "text-amber-900" :
    tone === "info" ? "text-blue-900" : "text-navy";
  return (
    <button onClick={onClick}
      className={`rounded-xl border ${toneBg} ${bg} p-3 text-left transition-all`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneTxt}`}>{value}</div>
    </button>
  );
}
