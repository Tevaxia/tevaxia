"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { listMyMandates, computeCoMandateSplit, type AgencyMandate } from "@/lib/agency-mandates";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export default function CommissionsPage() {
  const t = useTranslations("proaCommissions");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();
  const [mandates, setMandates] = useState<AgencyMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const m = await listMyMandates();
      setMandates(m);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, []);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const stats = useMemo(() => {
    const sold = mandates.filter((m) => m.status === "vendu" && m.sold_at);
    const soldThisYear = sold.filter((m) => m.sold_at && new Date(m.sold_at).getFullYear() === year);
    const activePipeline = mandates.filter((m) =>
      ["mandat_signe", "diffuse", "en_visite", "offre_recue", "sous_compromis"].includes(m.status),
    );

    const totalPerceived = soldThisYear.reduce((s, m) => {
      const split = computeCoMandateSplit(m);
      return s + (Number(m.commission_amount_percue) || split.primary);
    }, 0);

    const totalPipeline = activePipeline.reduce((s, m) => {
      const split = computeCoMandateSplit(m);
      return s + split.primary;
    }, 0);

    const byMonth: Record<number, { nb: number; amount: number; avg: number }> = {};
    for (let i = 0; i < 12; i++) byMonth[i] = { nb: 0, amount: 0, avg: 0 };
    for (const m of soldThisYear) {
      if (!m.sold_at) continue;
      const month = new Date(m.sold_at).getMonth();
      const split = computeCoMandateSplit(m);
      const amount = Number(m.commission_amount_percue) || split.primary;
      byMonth[month].nb += 1;
      byMonth[month].amount += amount;
    }
    for (const k of Object.keys(byMonth)) {
      const b = byMonth[Number(k)];
      b.avg = b.nb > 0 ? b.amount / b.nb : 0;
    }

    const avgCommission = soldThisYear.length > 0 ? totalPerceived / soldThisYear.length : 0;

    return {
      sold, soldThisYear, activePipeline,
      totalPerceived, totalPipeline, avgCommission,
      byMonth,
    };
  }, [mandates, year]);

  const MONTHS = [
    t("monthJan"), t("monthFeb"), t("monthMar"), t("monthApr"), t("monthMay"), t("monthJun"),
    t("monthJul"), t("monthAug"), t("monthSep"), t("monthOct"), t("monthNov"), t("monthDec"),
  ];

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href={`${lp}/connexion`} className="text-navy underline">{t("login")}</Link></div>;

  const chartData = MONTHS.map((label, i) => ({
    month: label,
    commissions: Math.round(stats.byMonth[i].amount),
    nb: stats.byMonth[i].nb,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href={`${lp}/pro-agences`} className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle", { year })}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("pageSubtitle")}
          </p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm">
          {[year - 2, year - 1, year, year + 1].filter((y, i, a) => a.indexOf(y) === i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Kpi label={t("kpiSold")} value={String(stats.soldThisYear.length)} sub={t("kpiSoldSub", { n: stats.sold.length })} />
        <Kpi label={t("kpiPerceived")} value={formatEUR(stats.totalPerceived)} tone="emerald" />
        <Kpi label={t("kpiAvg")} value={formatEUR(stats.avgCommission)} sub={t("kpiAvgSub")} />
        <Kpi label={t("kpiPipeline")} value={formatEUR(stats.totalPipeline)}
          sub={t("kpiPipelineSub", { n: stats.activePipeline.length })} tone="blue" />
      </div>

      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
          {t("chartTitle")}
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `${Number(v) / 1000}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v, name) => name === "commissions" ? formatEUR(Number(v)) : v} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="commissions" fill="#0B2447" name={t("chartLegendCom")} />
            <Bar yAxisId="right" dataKey="nb" fill="#10B981" name={t("chartLegendNb")} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {stats.soldThisYear.length > 0 && (
        <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
            {t("detailTitle", { year })}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-3 py-2 text-left">{t("colSoldAt")}</th>
                  <th className="px-3 py-2 text-left">{t("colProperty")}</th>
                  <th className="px-3 py-2 text-left">{t("colClient")}</th>
                  <th className="px-3 py-2 text-right">{t("colSoldPrice")}</th>
                  <th className="px-3 py-2 text-right">{t("colRate")}</th>
                  <th className="px-3 py-2 text-right">{t("colCommission")}</th>
                  <th className="px-3 py-2 text-center">{t("colCoMandate")}</th>
                  <th className="px-3 py-2 text-right">{t("colDelay")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.soldThisYear
                  .sort((a, b) => (b.sold_at ?? "").localeCompare(a.sold_at ?? ""))
                  .map((m) => {
                    const split = computeCoMandateSplit(m);
                    const amount = Number(m.commission_amount_percue) || split.primary;
                    return (
                      <tr key={m.id} className="border-b border-card-border/40">
                        <td className="px-3 py-1.5 text-xs">
                          {m.sold_at ? new Date(m.sold_at).toLocaleDateString(dateLocale) : t("dash")}
                        </td>
                        <td className="px-3 py-1.5">
                          <Link href={`${lp}/pro-agences/mandats/${m.id}`}
                            className="font-medium text-navy hover:underline">
                            {m.property_address}
                          </Link>
                          <div className="text-[10px] text-muted">{m.property_commune ?? t("dash")}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs">{m.client_name ?? t("dash")}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs">
                          {m.sold_price ? formatEUR(Number(m.sold_price)) : t("dash")}
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs">{m.commission_pct ?? t("dash")}%</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold text-emerald-700">
                          {formatEUR(amount)}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {m.is_co_mandate ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-900">
                              ✓ ({m.co_agency_name ?? t("dash")})
                            </span>
                          ) : t("dash")}
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs text-muted">
                          {m.days_to_close ?? t("dash")}{t("daySuffix")}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="bg-background font-bold">
                  <td colSpan={5} className="px-3 py-2 text-right">{t("totalYear", { year })}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700">{formatEUR(stats.totalPerceived)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {stats.activePipeline.length > 0 && (
        <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
            {t("pipelineTitle", { n: stats.activePipeline.length })}
          </h2>
          <div className="text-xs text-muted mb-3">
            {t("pipelineHint")} <strong>{formatEUR(stats.totalPipeline)}</strong>.
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-left">{t("colProperty")}</th>
                <th className="px-3 py-2 text-left">{t("colStatus")}</th>
                <th className="px-3 py-2 text-right">{t("colAskPrice")}</th>
                <th className="px-3 py-2 text-right">{t("colEstCom")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.activePipeline.slice(0, 20).map((m) => {
                const split = computeCoMandateSplit(m);
                return (
                  <tr key={m.id} className="border-b border-card-border/40">
                    <td className="px-3 py-1.5">
                      <Link href={`${lp}/pro-agences/mandats/${m.id}`}
                        className="font-medium text-navy hover:underline">
                        {m.property_address}
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted">{m.status}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs">
                      {m.prix_demande ? formatEUR(Number(m.prix_demande)) : t("dash")}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs text-blue-700">
                      {formatEUR(split.primary)}
                    </td>
                  </tr>
                );
              })}
              {stats.activePipeline.length > 20 && (
                <tr><td colSpan={4} className="px-3 py-2 text-center text-[10px] text-muted">
                  {t("moreMandates", { n: stats.activePipeline.length - 20 })}
                </td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("fiscalityTitle")}</strong> {t("fiscalityBody")}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" | "blue" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "blue" ? "bg-blue-50 border-blue-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "blue" ? "text-blue-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
