"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  buildStrForecast,
  generateStrSeed,
  parseStrCsv,
  type StrMonthlyMetric,
  type StrForecastResult,
} from "@/lib/str-forecast";
import { errMsg } from "@/lib/errors";

const MONTH_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

export default function StrForecastPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("strForecast");
  const [metrics, setMetrics] = useState<StrMonthlyMetric[]>([]);
  const [csvText, setCsvText] = useState("");
  const [horizon, setHorizon] = useState(12);
  const [daysPerMonth, setDaysPerMonth] = useState(30);
  const [showCsv, setShowCsv] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forecast: StrForecastResult | null = useMemo(() => {
    if (metrics.length < 6) return null;
    return buildStrForecast(metrics, horizon, daysPerMonth);
  }, [metrics, horizon, daysPerMonth]);

  const handleImport = () => {
    try {
      const rows = parseStrCsv(csvText);
      if (rows.length === 0) {
        setError(t("noRows"));
        return;
      }
      setMetrics(rows);
      setCsvText("");
      setShowCsv(false);
      setError(null);
    } catch (e) {
      setError(errMsg(e, String(e)));
    }
  };

  const handleSeed = () => {
    setMetrics(generateStrSeed(0.65, 130, 24));
    setError(null);
  };

  const handleClear = () => {
    setMetrics([]);
    setError(null);
  };

  const exportCsv = () => {
    if (!forecast) return;
    const all = [...forecast.historical, ...forecast.forecast];
    const lines = [
      "year,month,occupancy,adr,revenue,isForecast,lowerRevenue,upperRevenue",
      ...all.map((p) =>
        `${p.year},${String(p.month).padStart(2, "0")},${p.occupancy.toFixed(4)},${p.adr.toFixed(2)},${p.revenue.toFixed(2)},${p.isForecast ? 1 : 0},${p.lowerRevenue.toFixed(2)},${p.upperRevenue.toFixed(2)}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `str-forecast-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalHistorical = forecast?.historical.reduce((s, p) => s + p.revenue, 0) ?? 0;
  const totalForecast = forecast?.forecast.reduce((s, p) => s + p.revenue, 0) ?? 0;
  const totalLow = forecast?.forecast.reduce((s, p) => s + p.lowerRevenue, 0) ?? 0;
  const totalHigh = forecast?.forecast.reduce((s, p) => s + p.upperRevenue, 0) ?? 0;

  const max = forecast
    ? Math.max(...[...forecast.historical, ...forecast.forecast].map((p) => p.upperRevenue))
    : 1;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/str`} className="text-xs text-muted hover:text-navy">
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={handleSeed} className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
            {t("seedDemo")}
          </button>
          <button onClick={() => setShowCsv(!showCsv)} className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
            {showCsv ? t("cancel") : t("importCsv")}
          </button>
          {metrics.length > 0 && (
            <>
              <button onClick={handleClear} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                {t("clear")}
              </button>
              {forecast && (
                <button onClick={exportCsv} className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                  {t("exportCsv")}
                </button>
              )}
            </>
          )}
        </div>

        {showCsv && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
            <label className="text-xs font-semibold text-navy">{t("csvLabel")}</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"2024-01,0.58,115\n2024-02,0.62,120\n..."}
              className="mt-2 w-full rounded-lg border border-input-border bg-input-bg p-3 text-xs font-mono"
              rows={8}
            />
            <p className="mt-2 text-[11px] text-muted">{t("csvHint")}</p>
            <button onClick={handleImport} className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              {t("import")}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-muted">{t("horizonLabel")}</span>
            <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="rounded-lg border border-input-border bg-input-bg px-2 py-1">
              {[6, 12, 18, 24].map((h) => <option key={h} value={h}>{h} {t("months")}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted">{t("daysPerMonthLabel")}</span>
            <input type="number" min={1} max={31} value={daysPerMonth} onChange={(e) => setDaysPerMonth(Number(e.target.value) || 30)} className="w-16 rounded-lg border border-input-border bg-input-bg px-2 py-1" />
          </label>
        </div>

        {!forecast && metrics.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <p className="text-sm text-muted">{t("emptyState")}</p>
          </div>
        )}

        {!forecast && metrics.length > 0 && metrics.length < 6 && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            {t("insufficientData", { count: metrics.length })}
          </div>
        )}

        {forecast && (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <Kpi label={t("kpiHistorical")} value={`${Math.round(totalHistorical).toLocaleString("fr-LU")} €`} hint={t("kpiHistoricalHint", { months: forecast.historical.length })} />
              <Kpi label={t("kpiForecast")} value={`${Math.round(totalForecast).toLocaleString("fr-LU")} €`} hint={t("kpiForecastHint", { months: forecast.forecast.length })} />
              <Kpi label={t("kpiRange")} value={`${Math.round(totalLow).toLocaleString("fr-LU")} – ${Math.round(totalHigh).toLocaleString("fr-LU")} €`} hint={t("kpiRangeHint")} />
              <Kpi label={t("kpiMape")} value={`${forecast.mape.revenue.toFixed(1)} %`} hint={t("kpiMapeHint")} />
            </div>

            <div className="mt-6 rounded-xl border border-card-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">{t("chartTitle")}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  forecast.confidence === "high" ? "bg-emerald-100 text-emerald-800" :
                  forecast.confidence === "medium" ? "bg-amber-100 text-amber-800" :
                  "bg-rose-100 text-rose-800"
                }`}>
                  {t(`confidence.${forecast.confidence}`)}
                </span>
              </div>
              <div className="mt-4 flex items-end gap-1 overflow-x-auto">
                {[...forecast.historical, ...forecast.forecast].map((p, i) => {
                  const hPct = (p.revenue / max) * 100;
                  const bandPct = p.isForecast ? ((p.upperRevenue - p.lowerRevenue) / max) * 100 : 0;
                  return (
                    <div key={i} className="flex min-w-[28px] flex-1 flex-col items-center">
                      <div className="relative h-40 w-full flex flex-col justify-end">
                        {p.isForecast && (
                          <div
                            className="absolute bottom-0 w-full bg-navy/10"
                            style={{ height: `${(p.upperRevenue / max) * 100}%` }}
                          />
                        )}
                        <div
                          className={`relative w-full ${p.isForecast ? "bg-navy/50" : "bg-navy"}`}
                          style={{ height: `${hPct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[9px] text-muted">
                        {MONTH_FR[p.month - 1]}
                      </div>
                      {p.month === 1 && (
                        <div className="text-[10px] font-bold text-navy">{p.year}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-muted">
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-navy"/> {t("legendHistorical")}</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-navy/50"/> {t("legendForecast")}</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 bg-navy/10"/> {t("legendRange")}</span>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-card-border bg-card">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t("colPeriod")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("colOccupancy")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("colAdr")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("colRevenue")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("colRange")}</th>
                    <th className="px-3 py-2 text-center font-semibold">{t("colType")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...forecast.historical, ...forecast.forecast].map((p, i) => (
                    <tr key={i} className={`border-t border-card-border ${p.isForecast ? "bg-slate-50/60" : ""}`}>
                      <td className="px-3 py-1.5 font-medium">{p.year}-{String(p.month).padStart(2, "0")}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{(p.occupancy * 100).toFixed(1)} %</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{p.adr.toFixed(0)} €</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{Math.round(p.revenue).toLocaleString("fr-LU")} €</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted">
                        {p.isForecast ? `${Math.round(p.lowerRevenue).toLocaleString("fr-LU")} – ${Math.round(p.upperRevenue).toLocaleString("fr-LU")}` : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${p.isForecast ? "bg-navy/10 text-navy" : "bg-emerald-100 text-emerald-800"}`}>
                          {p.isForecast ? t("typeForecast") : t("typeHistorical")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-xs text-muted">{t("methodology")}</p>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className="mt-1 text-xl font-bold text-navy font-mono">{value}</div>
      <div className="mt-0.5 text-[10px] text-muted truncate">{hint}</div>
    </div>
  );
}
