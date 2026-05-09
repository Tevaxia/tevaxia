"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  LU_MONTHLY_NIGHTS,
  LU_CATEGORY_BREAKDOWN,
  LU_ORIGIN_BREAKDOWN,
  getLatestYearNights,
  getLatestYearOccupancy,
  yearOverYearChange,
} from "@/lib/hotellerie/statec-tourism";
import { Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ComposedChart, Line, Legend, PieChart, Pie, Cell } from "recharts";

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
const ORIGIN_COLORS = ["#1e3a5f", "#b8860b", "#2c7a7b", "#4a90d9", "#6b7280", "#9333ea", "#dc2626", "#059669"];

export default function ObservatoireHotellerieLu() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("observatoireHotellerie");
  const [yearFilter, setYearFilter] = useState<number>(2025);

  const latestNights = getLatestYearNights();
  const latestOcc = getLatestYearOccupancy();
  const yoy = yearOverYearChange();

  const monthlyData = useMemo(() => {
    return LU_MONTHLY_NIGHTS
      .filter((m) => m.year === yearFilter)
      .map((m) => ({
        label: MONTH_LABELS[m.month - 1],
        nights: m.nights,
        occupancy: m.occupancyPct,
        arrivals: m.arrivals,
      }));
  }, [yearFilter]);

  const categoryData = useMemo(() => {
    return LU_CATEGORY_BREAKDOWN.filter((c) => c.year === yearFilter && c.category !== "all");
  }, [yearFilter]);

  const originData = useMemo(() => LU_ORIGIN_BREAKDOWN, []);

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/hotellerie`} className="text-xs text-muted hover:text-navy">
          {t("backHub")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800">
            {t("publicData")}
          </span>
          <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-sky-800">
            {t("noSignup")}
          </span>
        </div>

        {/* KPI cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Kpi label={t("kpiNights")} value={`${Math.round(latestNights / 1000).toLocaleString("fr-LU")} k`} hint={`${yoy.nights >= 0 ? "+" : ""}${yoy.nights.toFixed(1)} % YoY`} positive={yoy.nights >= 0} />
          <Kpi label={t("kpiOcc")} value={`${latestOcc.toFixed(1)} %`} hint={`${yoy.occupancy >= 0 ? "+" : ""}${yoy.occupancy.toFixed(1)} pp YoY`} positive={yoy.occupancy >= 0} />
          <Kpi label={t("kpiAdrNat")} value={`~165 €`} hint={t("kpiAdrNatHint")} />
          <Kpi label={t("kpiRevPARNat")} value={`~115 €`} hint={t("kpiRevPARNatHint")} />
        </div>

        {/* Year selector */}
        <div className="mt-6 flex items-center gap-2">
          <label className="text-xs text-muted">{t("yearFilter")}</label>
          {[2023, 2024, 2025].map((y) => (
            <button
              key={y}
              onClick={() => setYearFilter(y)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                yearFilter === y ? "bg-navy text-white" : "bg-card border border-card-border text-muted hover:bg-navy/5"
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Monthly chart */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-1">{t("chartMonthlyTitle", { year: yearFilter })}</h2>
          <p className="text-[11px] text-muted mb-3">{t("chartMonthlySubtitle")}</p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="nights" fill="#1e3a5f" name={t("legendNights")} />
              <Line yAxisId="right" type="monotone" dataKey="occupancy" stroke="#b8860b" strokeWidth={2.5} dot={{ r: 3 }} name={t("legendOccupancy")} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-navy mb-1">{t("chartCategoryTitle", { year: yearFilter })}</h2>
            <p className="text-[11px] text-muted mb-3">{t("chartCategorySubtitle")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">{t("colCategory")}</th>
                    <th className="px-3 py-2 text-right">{t("colOccupancy")}</th>
                    <th className="px-3 py-2 text-right">{t("colAdr")}</th>
                    <th className="px-3 py-2 text-right">{t("colRevPAR")}</th>
                    <th className="px-3 py-2 text-right">{t("colNights")}</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((c) => (
                    <tr key={c.category} className="border-t border-card-border">
                      <td className="px-3 py-2 font-medium">{c.category}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.occupancyPct} %</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.adrEstimate} €</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{c.revPAR} €</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted">{Math.round((c.nightsLU + c.nightsNonLU) / 1000).toLocaleString("fr-LU")} k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Origin pie */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-navy mb-1">{t("chartOriginTitle")}</h2>
            <p className="text-[11px] text-muted mb-3">{t("chartOriginSubtitle")}</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={originData} dataKey="nights" nameKey="origin" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {originData.map((_, i) => <Cell key={i} fill={ORIGIN_COLORS[i % ORIGIN_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${Math.round(Number(v) / 1000)}k nuitées`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data sources disclaimer */}
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-5">
          <h3 className="text-sm font-semibold text-sky-900 mb-2">{t("sourcesTitle")}</h3>
          <ul className="ml-4 list-disc space-y-1 text-xs text-sky-800">
            <li><strong>STATEC Tourism Statistics</strong> — <a href="https://lustat.statec.lu" target="_blank" rel="noreferrer" className="underline hover:no-underline">lustat.statec.lu</a> (tables B5000/B5100/B5200, publication trimestrielle gratuite)</li>
            <li><strong>Eurostat Tourism</strong> — <a href="https://ec.europa.eu/eurostat/databrowser/view/tour_occ_arm" target="_blank" rel="noreferrer" className="underline hover:no-underline">tour_occ_arm / tour_occ_arn</a> (arrivées/nuitées mensuelles)</li>
            <li><strong>STR EMEA Performance Report</strong> — résumés publics trimestriels (<a href="https://str.com/resources" target="_blank" rel="noreferrer" className="underline hover:no-underline">str.com/resources</a>)</li>
            <li><strong>Horwath HTL European Hotel Valuation Index</strong> — publication annuelle publique</li>
          </ul>
          <p className="mt-3 text-[11px] text-sky-900">
            {t("sourcesNote")}
          </p>
        </div>

        <div className="mt-6 text-xs text-muted">{t("disclaimer")}</div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, positive }: { label: string; value: string; hint?: string; positive?: boolean }) {
  const hintColor = positive === true ? "text-emerald-700" : positive === false ? "text-rose-700" : "text-muted";
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className="mt-1 text-2xl font-bold font-mono text-navy">{value}</div>
      {hint && <div className={`text-[10px] ${hintColor}`}>{hint}</div>}
    </div>
  );
}
