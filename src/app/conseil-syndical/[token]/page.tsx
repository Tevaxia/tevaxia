"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getPortalData, type PortalData } from "@/lib/coownership-portal";
import { formatEUR } from "@/lib/calculations";

export default function ConseilSyndicalDashboard() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("conseilSyndical");
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const token = String(params?.token ?? "");
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getPortalData(token)
      .then((d) => setData(d))
      .catch(() => setData({ error: t("errGeneric") } as PortalData))
      .finally(() => setLoading(false));
  }, [token, t]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!data || data.error || !data.coownership) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">{t("invalidTitle")}</h1>
        <p className="text-muted">{t("invalidBody")}</p>
      </div>
    );
  }

  const { coownership, assemblies, fund_calls } = data;
  const totalCalls = fund_calls.reduce((s, c) => s + c.amount, 0);
  const paidCalls = fund_calls.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
  const unpaidCalls = totalCalls - paidCalls;

  const anomalies: string[] = [];
  if (unpaidCalls > totalCalls * 0.2) anomalies.push(t("anomalyImpaye", { pct: ((unpaidCalls / totalCalls) * 100).toFixed(1) }));
  if (coownership.works_fund_balance !== null && coownership.nb_lots > 5 && coownership.works_fund_balance < 10000) {
    anomalies.push(t("anomalyFundLow"));
  }
  const recentAG = assemblies.find((a) => new Date(a.scheduled_at).getFullYear() >= new Date().getFullYear() - 1);
  if (!recentAG) anomalies.push(t("anomalyNoAg"));

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">
          <div className="text-xs uppercase tracking-wider text-white/70">{t("dashboardKicker")}</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{coownership.name}</h1>
          {coownership.address && <p className="mt-1 text-sm text-white/80">{coownership.address}{coownership.commune ? `, ${coownership.commune}` : ""}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1">{t("lotsTantiemes", { lots: coownership.nb_lots, tantiemes: coownership.total_tantiemes })}</span>
            {coownership.year_built && <span className="rounded-full bg-white/10 px-3 py-1">{t("builtIn", { year: coownership.year_built })}</span>}
          </div>
        </div>

        {/* Alertes anomalies */}
        {anomalies.length > 0 && (
          <div className="mt-6 rounded-xl border-2 border-rose-200 bg-rose-50 p-5">
            <h2 className="text-sm font-semibold text-rose-900">{t("anomaliesTitle", { n: anomalies.length })}</h2>
            <ul className="mt-3 space-y-2 text-sm text-rose-900">
              {anomalies.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"></span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* KPIs financiers */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpiAppelsCumules")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(totalCalls)}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpiEncaisse")}</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(paidCalls)}</div>
            <div className="text-xs text-muted">{totalCalls > 0 ? `${((paidCalls / totalCalls) * 100).toFixed(1)}%` : "—"}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpiImpayes")}</div>
            <div className="mt-1 text-2xl font-bold text-rose-700">{formatEUR(unpaidCalls)}</div>
          </div>
        </div>

        {coownership.works_fund_balance !== null && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-900">{t("worksFundTitle")}</h3>
            <div className="mt-1 text-2xl font-bold text-amber-900">{formatEUR(coownership.works_fund_balance)}</div>
            <p className="mt-1 text-xs text-amber-800">{t("worksFundDesc")}</p>
          </div>
        )}

        {/* Historique AG */}
        {assemblies.length > 0 && (
          <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy">{t("agHistoryTitle")}</h2>
            <div className="mt-4 space-y-2">
              {assemblies.map((a) => (
                <div key={a.id} className="rounded-lg border border-card-border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-navy">{a.title}</div>
                      <div className="text-xs text-muted">
                        {a.type === "ordinary" ? t("agOrdinary") : t("agExtraordinary")} ·{" "}
                        {new Date(a.scheduled_at).toLocaleString(dateLocale, { dateStyle: "long", timeStyle: "short" })}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-medium">{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-card-border bg-background p-4 text-xs text-muted text-center">
          {t("footer")}
        </div>
      </div>
    </div>
  );
}
