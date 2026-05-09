"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { listHotels, type Hotel } from "@/lib/hotels";
import { listMyOrganizations } from "@/lib/orgs";
import {
  listMetrics, upsertMetrics, deleteMetric,
  parseCsvMetrics, buildForecast, generateSeedData,
  type DailyMetric, type ForecastResult,
} from "@/lib/hotel-forecast";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

type MetricKey = "occupancy" | "adr" | "revpar";
const METRIC_I18N_KEY: Record<MetricKey, string> = {
  occupancy: "metricOccupancy",
  adr: "metricAdr",
  revpar: "metricRevpar",
};
const METRIC_COLOR: Record<MetricKey, string> = {
  occupancy: "#2563EB",
  adr: "#059669",
  revpar: "#7C3AED",
};

export default function HotelForecastPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("hotelForecast");
  const { user } = useAuth();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("occupancy");
  const [horizon, setHorizon] = useState(90);

  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvText, setCsvText] = useState("");

  const [showManual, setShowManual] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    metric_date: new Date().toISOString().slice(0, 10),
    occupancy: 0.75,
    adr: 120,
  });

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const orgs = await listMyOrganizations();
        const hotelOrgs = orgs.filter((o) => o.org_type === "hotel_group");
        if (hotelOrgs.length === 0) return;
        const allHotels: Hotel[] = [];
        for (const o of hotelOrgs) {
          const hs = await listHotels(o.id);
          allHotels.push(...hs);
        }
        setHotels(allHotels);
        if (allHotels.length > 0) setActiveHotelId(allHotels[0].id);
      } catch (e) { setError(errMsg(e, t("error"))); }
    })();
  }, [user, t]);

  const refreshMetrics = useCallback(async (hotelId: string) => {
    try {
      // Charge les 365 derniers jours pour historique
      const from = new Date();
      from.setUTCDate(from.getUTCDate() - 365);
      const ms = await listMetrics(hotelId, from.toISOString().slice(0, 10));
      setMetrics(ms);
    } catch (e) { setError(errMsg(e, t("error"))); }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeHotelId) void refreshMetrics(activeHotelId);
  }, [activeHotelId, refreshMetrics]);

  const forecast: ForecastResult | null = useMemo(() => {
    if (metrics.length < 14) return null;
    return buildForecast(metrics, activeMetric, horizon);
  }, [metrics, activeMetric, horizon]);

  const handleImportCsv = async () => {
    if (!activeHotelId || !csvText.trim()) return;
    try {
      const rows = parseCsvMetrics(csvText);
      if (rows.length === 0) { setError(t("noCsvRows")); return; }
      await upsertMetrics(activeHotelId, rows.map((r) => ({ ...r, source: "csv_import" as const })));
      setCsvText(""); setShowCsvImport(false);
      await refreshMetrics(activeHotelId);
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleSeed = async () => {
    if (!activeHotelId) return;
    if (!confirm(t("seedConfirm"))) return;
    try {
      const rows = generateSeedData(0.72, 130, 120);
      await upsertMetrics(activeHotelId, rows.map((r) => ({ ...r, source: "forecast_seed" as const })));
      await refreshMetrics(activeHotelId);
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleManualSave = async () => {
    if (!activeHotelId) return;
    try {
      await upsertMetrics(activeHotelId, [{
        metric_date: manualEntry.metric_date,
        occupancy: manualEntry.occupancy,
        adr: manualEntry.adr,
        source: "manual",
      }]);
      setShowManual(false);
      await refreshMetrics(activeHotelId);
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleDeleteMetric = async (id: string) => {
    try { await deleteMetric(id); if (activeHotelId) await refreshMetrics(activeHotelId); }
    catch (e) { setError(errMsg(e, t("error"))); }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t("loginPrompt")}</p>
        <Link href={`${lp}/connexion`} className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">{t("loginBtn")}</Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/hotellerie`} className="text-xs text-muted hover:text-navy">{t("hubLink")}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle")}
        </p>

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        {hotels.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <p className="text-sm text-muted">
              {t("noHotel")}{" "}
              <Link href={`${lp}/hotellerie/groupe`} className="text-navy underline">{t("noHotelLink")}</Link>
              {" "}{t("noHotelSuffix")}
            </p>
          </div>
        )}

        {hotels.length > 0 && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="text-xs text-muted">{t("hotelLabel")}</label>
              <select value={activeHotelId ?? ""} onChange={(e) => setActiveHotelId(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm">
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>

              <div className="ml-auto flex flex-wrap gap-2">
                <button onClick={() => setShowManual(!showManual)}
                  className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                  {t("manualEntry")}
                </button>
                <button onClick={() => setShowCsvImport(!showCsvImport)}
                  className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                  {t("importCsv")}
                </button>
                {metrics.length === 0 && (
                  <button onClick={handleSeed}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                    {t("generateDemo")}
                  </button>
                )}
              </div>
            </div>

            {showManual && (
              <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-xs text-muted">{t("dateLabel")}</label>
                    <input type="date" value={manualEntry.metric_date}
                      onChange={(e) => setManualEntry({ ...manualEntry, metric_date: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted">{t("occupancyLabel")}</label>
                    <input type="number" min="0" max="1" step="0.01" value={manualEntry.occupancy}
                      onChange={(e) => setManualEntry({ ...manualEntry, occupancy: Number(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted">{t("adrLabel")}</label>
                    <input type="number" min="0" step="1" value={manualEntry.adr}
                      onChange={(e) => setManualEntry({ ...manualEntry, adr: Number(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleManualSave}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      {t("save")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCsvImport && (
              <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
                <label className="text-xs text-muted">
                  {t("csvFormat")}
                </label>
                <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)}
                  placeholder="date,occupancy,adr&#10;2026-01-01,0.75,120&#10;2026-01-02,0.82,125"
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-mono"
                  rows={8} />
                <div className="mt-2 flex justify-end">
                  <button onClick={handleImportCsv} disabled={!csvText.trim()}
                    className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-40">
                    {t("importBtn")}
                  </button>
                </div>
              </div>
            )}

            {/* Metric + horizon selectors */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-lg border border-card-border bg-card">
                {(["occupancy", "adr", "revpar"] as MetricKey[]).map((m) => (
                  <button key={m} onClick={() => setActiveMetric(m)}
                    className={`px-3 py-1.5 text-xs ${activeMetric === m ? "bg-navy text-white" : "text-navy"} ${m === "occupancy" ? "rounded-l-lg" : m === "revpar" ? "rounded-r-lg" : ""}`}>
                    {t(METRIC_I18N_KEY[m])}
                  </button>
                ))}
              </div>
              <label className="text-xs text-muted">{t("horizonLabel")}</label>
              <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm">
                <option value={30}>{t("days30")}</option>
                <option value={60}>{t("days60")}</option>
                <option value={90}>{t("days90")}</option>
                <option value={120}>{t("days120")}</option>
                <option value={180}>{t("days180")}</option>
              </select>
            </div>

            {/* Chart + KPIs */}
            {forecast ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <KpiCard label={t("kpiAvgHistorical", { metric: t(METRIC_I18N_KEY[activeMetric]) })}
                    value={activeMetric === "occupancy"
                      ? `${(avg(forecast.historical.map((p) => p.value)) * 100).toFixed(1)} %`
                      : formatEUR(avg(forecast.historical.map((p) => p.value)))} />
                  <KpiCard label={t("kpiAvgForecast", { metric: t(METRIC_I18N_KEY[activeMetric]) })}
                    value={activeMetric === "occupancy"
                      ? `${(avg(forecast.forecast.map((p) => p.value)) * 100).toFixed(1)} %`
                      : formatEUR(avg(forecast.forecast.map((p) => p.value)))} />
                  <KpiCard label={t("kpiMape")} value={`${forecast.mape.toFixed(1)} %`} />
                  <KpiCard label={t("kpiHistoryPoints")} value={String(forecast.historical.length)} />
                </div>

                <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
                  <ForecastChart forecast={forecast} color={METRIC_COLOR[activeMetric]} metric={activeMetric}
                    labels={{ today: t("chartToday"), historical: t("legendHistorical"), forecast: t("legendForecast"), ci: t("legendCi") }} />
                </div>

                {/* Forecast table */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-navy hover:underline">
                    {t("showForecastValues", { count: forecast.forecast.length })}
                  </summary>
                  <div className="mt-2 overflow-x-auto rounded-xl border border-card-border bg-card">
                    <table className="w-full text-xs">
                      <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="px-3 py-2">{t("thDate")}</th>
                          <th className="px-3 py-2 text-right">{t("thForecast")}</th>
                          <th className="px-3 py-2 text-right">{t("thCiLow")}</th>
                          <th className="px-3 py-2 text-right">{t("thCiHigh")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {forecast.forecast.map((p) => (
                          <tr key={p.date}>
                            <td className="px-3 py-1.5">{new Date(p.date).toLocaleDateString("fr-LU", { weekday: "short", day: "2-digit", month: "short" })}</td>
                            <td className="px-3 py-1.5 text-right font-medium">
                              {activeMetric === "occupancy" ? `${(p.value * 100).toFixed(1)} %` : formatEUR(p.value)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-muted">
                              {activeMetric === "occupancy" ? `${(p.lower * 100).toFixed(1)} %` : formatEUR(p.lower)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-muted">
                              {activeMetric === "occupancy" ? `${(p.upper * 100).toFixed(1)} %` : formatEUR(p.upper)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-card-border bg-card p-8 text-center text-sm text-muted">
                {t("minDataWarning")}
              </div>
            )}

            {/* Recent metrics table */}
            {metrics.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-navy hover:underline">
                  {t("showHistory", { count: metrics.length })}
                </summary>
                <div className="mt-2 overflow-x-auto rounded-xl border border-card-border bg-card max-h-96">
                  <table className="w-full text-xs">
                    <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2">{t("thDate")}</th>
                        <th className="px-3 py-2 text-right">{t("thOccupation")}</th>
                        <th className="px-3 py-2 text-right">{t("thAdr")}</th>
                        <th className="px-3 py-2 text-right">{t("thRevpar")}</th>
                        <th className="px-3 py-2">{t("thSource")}</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/50">
                      {metrics.slice().reverse().slice(0, 60).map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-1.5">{new Date(m.metric_date).toLocaleDateString("fr-LU")}</td>
                          <td className="px-3 py-1.5 text-right">{m.occupancy !== null ? `${(m.occupancy * 100).toFixed(1)} %` : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{m.adr !== null ? formatEUR(m.adr) : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{m.revpar !== null ? formatEUR(m.revpar) : "—"}</td>
                          <td className="px-3 py-1.5 text-muted text-[10px]">{m.source}</td>
                          <td className="px-3 py-1.5 text-right">
                            <button onClick={() => handleDeleteMetric(m.id)}
                              className="rounded p-1 text-muted hover:text-rose-600" title={t("deleteTitle")}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </>
        )}

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          {t("methodology")}
        </div>
      </div>
    </div>
  );
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className="mt-1 text-xl font-bold text-navy">{value}</div>
    </div>
  );
}

// ---------- SVG chart ----------

function ForecastChart({ forecast, color, metric, labels }: {
  forecast: { historical: { date: string; value: number }[]; forecast: { date: string; value: number; lower: number; upper: number }[] };
  color: string;
  metric: MetricKey;
  labels: { today: string; historical: string; forecast: string; ci: string };
}) {
  const W = 900, H = 260, pad = 32;
  const all = [...forecast.historical, ...forecast.forecast];
  if (all.length === 0) return null;

  // Limit historical points to last 120 for readability
  const hist = forecast.historical.slice(-120);
  const fcast = forecast.forecast;
  const display = [...hist, ...fcast];

  const ys = display.map((p) => "value" in p ? p.value : 0);
  const lowers = fcast.map((p) => p.lower);
  const uppers = fcast.map((p) => p.upper);
  const yMin = Math.min(...ys, ...lowers);
  const yMax = Math.max(...ys, ...uppers);
  const yRange = yMax - yMin || 1;

  const x = (i: number) => pad + (i / (display.length - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);

  const histPath = hist.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const fcastPath = fcast.map((p, i) => `${i === 0 ? "M" : "L"}${x(hist.length + i)},${y(p.value)}`).join(" ");
  const bandPath = fcast.length > 0
    ? fcast.map((p, i) => `${i === 0 ? "M" : "L"}${x(hist.length + i)},${y(p.upper)}`).join(" ") +
      " " + fcast.slice().reverse().map((p, i) => `L${x(hist.length + fcast.length - 1 - i)},${y(p.lower)}`).join(" ") + " Z"
    : "";

  const fmtY = (v: number) => metric === "occupancy" ? `${(v * 100).toFixed(0)} %` : `${v.toFixed(0)} €`;

  // Gridlines
  const ticks = 4;
  const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
    const tv = yMin + (yRange * i) / ticks;
    return { y: y(tv), label: fmtY(tv) };
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[600px]">
        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={pad} x2={W - pad} y1={g.y} y2={g.y} stroke="#E5E7EB" strokeWidth={1} />
            <text x={pad - 6} y={g.y + 3} fontSize={9} fill="#6B7280" textAnchor="end">{g.label}</text>
          </g>
        ))}
        {/* Confidence band */}
        {bandPath && <path d={bandPath} fill={color} opacity={0.12} />}
        {/* Historical line */}
        <path d={histPath} stroke={color} strokeWidth={1.5} fill="none" />
        {/* Forecast line (dashed) */}
        <path d={fcastPath} stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
        {/* Separator between historical and forecast */}
        {fcast.length > 0 && (
          <line x1={x(hist.length - 0.5)} x2={x(hist.length - 0.5)} y1={pad} y2={H - pad}
            stroke="#94A3B8" strokeWidth={1} strokeDasharray="2 2" />
        )}
        {/* X-axis labels : first, boundary, last */}
        <text x={pad} y={H - pad + 14} fontSize={9} fill="#6B7280">{display[0]?.date.slice(5)}</text>
        {fcast.length > 0 && (
          <text x={x(hist.length - 0.5)} y={H - pad + 14} fontSize={9} fill="#6B7280" textAnchor="middle">
            {labels.today}
          </text>
        )}
        <text x={W - pad} y={H - pad + 14} fontSize={9} fill="#6B7280" textAnchor="end">
          {display[display.length - 1]?.date.slice(5)}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-0.5" style={{ backgroundColor: color }}></span> {labels.historical}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 border-b border-dashed" style={{ borderColor: color }}></span> {labels.forecast}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: color, opacity: 0.12 }}></span> {labels.ci}
        </span>
      </div>
    </div>
  );
}
