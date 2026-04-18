"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { buildRevenueForecast, forecastAlert, type ForecastSummary } from "@/lib/pms/forecast";
import {
  getEventsInRange, impactMultiplier, IMPACT_LABELS, IMPACT_COLORS,
} from "@/lib/pms/events-calendar-lu";
import type { PmsProperty } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";
import {
  ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";

export default function ForecastPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [report, setReport] = useState<ForecastSummary | null>(null);
  const [horizon, setHorizon] = useState<7 | 14 | 30 | 60 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try { setProperty(await getProperty(propertyId)); }
    catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const build = useCallback(async () => {
    if (!propertyId) return;
    setBuilding(true);
    try { setReport(await buildRevenueForecast(propertyId, horizon)); }
    catch (e) { setError(errMsg(e)); }
    setBuilding(false);
  }, [propertyId, horizon]);

  useEffect(() => { if (user && property) void build(); }, [user, property, build]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`/pms/${propertyId}/rapports`} className="hover:text-navy">Rapports</Link>
        <span>/</span>
        <span className="text-navy">Revenue forecast</span>
      </div>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy">Revenue Forecast</h1>
        <p className="mt-1 text-sm text-muted">
          Projection OTB (On The Books) + pickup conservateur extrapolé des 30 derniers jours.
          Alerte automatique si occupancy forecast &lt; seuil à J-14 / J-7 / J-2.
        </p>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-5 rounded-xl border border-card-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Horizon :</span>
          {([7, 14, 30, 60, 90] as const).map((d) => (
            <button key={d} onClick={() => setHorizon(d)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                horizon === d ? "bg-navy text-white" : "bg-background border border-card-border text-slate hover:bg-card-border/40"
              }`}>
              J+{d}
            </button>
          ))}
          {report && (
            <span className="ml-auto text-xs text-muted">
              {report.period_start} → {report.period_end} · Pickup rate {report.pickup_rate_per_day}/jour
            </span>
          )}
        </div>
      </div>

      {building && <div className="mt-6 text-center text-sm text-muted">Projection en cours…</div>}

      {report && !building && (
        <>
          {/* KPIs */}
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Kpi label="OTB chambres" value={report.total_otb_rooms.toLocaleString("fr-LU")}
              sub="stock déjà encaissé" />
            <Kpi label="Pickup attendu"
              value={report.total_expected_pickup_rooms.toLocaleString("fr-LU")}
              sub="conservatif 40%" tone="blue" />
            <Kpi label="Forecast rooms"
              value={report.total_forecast_rooms.toLocaleString("fr-LU")}
              sub={`/ ${(report.total_capacity * report.horizon_days).toLocaleString("fr-LU")} capacité`}
              tone="emerald" />
            <Kpi label="Forecast occupancy"
              value={`${report.avg_forecast_occupancy.toFixed(1)}%`}
              sub={`ADR ${formatEUR(report.avg_forecast_adr)}`} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Kpi label="Revenue OTB" value={formatEUR(report.total_otb_revenue)} />
            <Kpi label="Revenue pickup" value={formatEUR(report.total_expected_pickup_revenue)} tone="blue" />
            <Kpi label="Total forecast revenue" value={formatEUR(report.total_forecast_revenue)} tone="emerald" />
          </div>

          {/* Chart forecast */}
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">Forecast quotidien</h2>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={report.days.map((d) => ({
                date: d.date.slice(5),
                otb: d.otb_rooms,
                pickup: d.expected_pickup_rooms,
                capacity: d.capacity,
                occ: d.forecast_occupancy,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="otb" stackId="rooms" fill="#0B2447" name="OTB" />
                <Bar yAxisId="left" dataKey="pickup" stackId="rooms" fill="#6366F1" name="Pickup attendu" />
                <Line yAxisId="left" type="monotone" dataKey="capacity" stroke="#94A3B8"
                  strokeDasharray="5 5" strokeWidth={1} dot={false} name="Capacité" />
                <Line yAxisId="right" type="monotone" dataKey="occ" stroke="#10B981"
                  strokeWidth={2} dot={false} name="Occupancy %" />
              </ComposedChart>
            </ResponsiveContainer>
          </section>

          {/* Alertes */}
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">Alertes actionables</h2>
            <div className="space-y-2">
              {report.days.filter((d) => {
                const days = Math.floor((new Date(d.date).getTime() - Date.now()) / 86400000);
                return forecastAlert(d.forecast_occupancy, days).level !== "ok";
              }).slice(0, 10).map((d) => {
                const days = Math.floor((new Date(d.date).getTime() - Date.now()) / 86400000);
                const alert = forecastAlert(d.forecast_occupancy, days);
                return (
                  <div key={d.date} className={`rounded-lg border p-3 ${
                    alert.level === "critical" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{new Date(d.date).toLocaleDateString("fr-LU", { weekday: "short", day: "2-digit", month: "short" })} (J+{days})</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        alert.level === "critical" ? "bg-rose-900 text-white" : "bg-amber-800 text-white"
                      }`}>
                        {d.forecast_occupancy.toFixed(0)}% occ
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate">{alert.message}</div>
                  </div>
                );
              })}
              {report.days.every((d) => {
                const days = Math.floor((new Date(d.date).getTime() - Date.now()) / 86400000);
                return forecastAlert(d.forecast_occupancy, days).level === "ok";
              }) && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  ✓ Aucune alerte — occupancy projetée dans la norme sur tout l&apos;horizon.
                </div>
              )}
            </div>
          </section>

          {/* Table détaillée */}
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">Détail par jour</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-2 py-2 text-left">Date</th>
                    <th className="px-2 py-2 text-right">OTB</th>
                    <th className="px-2 py-2 text-right">Pickup att.</th>
                    <th className="px-2 py-2 text-right">Forecast</th>
                    <th className="px-2 py-2 text-right">Occ %</th>
                    <th className="px-2 py-2 text-right">Revenue OTB</th>
                    <th className="px-2 py-2 text-right">Revenue forecast</th>
                  </tr>
                </thead>
                <tbody>
                  {report.days.map((d, i) => (
                    <tr key={d.date} className={i % 2 === 0 ? "" : "bg-background/50"}>
                      <td className="px-2 py-1 font-mono">{new Date(d.date).toLocaleDateString("fr-LU", { day: "2-digit", month: "short" })}</td>
                      <td className="px-2 py-1 text-right font-mono">{d.otb_rooms}</td>
                      <td className="px-2 py-1 text-right font-mono text-indigo-700">+{d.expected_pickup_rooms}</td>
                      <td className="px-2 py-1 text-right font-mono font-semibold">{d.forecast_rooms}/{d.capacity}</td>
                      <td className={`px-2 py-1 text-right font-mono ${d.forecast_occupancy >= 80 ? "text-emerald-700 font-semibold" : d.forecast_occupancy >= 50 ? "" : "text-rose-700"}`}>
                        {d.forecast_occupancy.toFixed(0)}%
                      </td>
                      <td className="px-2 py-1 text-right font-mono">{formatEUR(d.otb_revenue)}</td>
                      <td className="px-2 py-1 text-right font-mono font-semibold">{formatEUR(d.forecast_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Événements LU impactants sur la période */}
          {(() => {
            const events = getEventsInRange(report.period_start, report.period_end);
            if (events.length === 0) return null;
            return (
              <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                  Événements LU impactants ({events.length})
                </h2>
                <div className="space-y-2">
                  {events.map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-card-border/50 bg-background p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-navy">{ev.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${IMPACT_COLORS[ev.impact]}`}>
                              {IMPACT_LABELS[ev.impact]}
                            </span>
                          </div>
                          <div className="text-xs text-muted">{ev.description}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-mono">
                            {new Date(ev.start_date).toLocaleDateString("fr-LU", { day: "2-digit", month: "short" })}
                            {" → "}
                            {new Date(ev.end_date).toLocaleDateString("fr-LU", { day: "2-digit", month: "short" })}
                          </div>
                          <div className="text-muted text-[10px]">
                            Multiplier pickup ×{impactMultiplier(ev.impact).toFixed(1)}
                          </div>
                        </div>
                      </div>
                      {ev.notes && (
                        <div className="mt-1 text-[11px] text-amber-800 italic">💡 {ev.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-muted">
                  💡 Les événements à impact <strong>high</strong> ou <strong>extreme</strong> justifient
                  typiquement +20% à +40% sur vos tarifs. Activez stop-sell ou MinLOS 2 nuits
                  pour maximiser le RevPAR.
                </div>
              </section>
            );
          })()}

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <strong>Méthodologie :</strong> {report.methodology}. Le pickup est pondéré à 40%
            pour prudence (approche conservatrice Revenue Management). Pour une projection plus
            agressive en périodes de forte demande connue (événements, saisonnalité), ajustez
            manuellement via rate plans + restrictions. À J-14/J-7/J-2, utilisez les alertes
            pour déclencher actions : baisse tarif, MinLOS, rate plan discount, campagne OTA.
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" | "blue" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "blue" ? "bg-blue-50 border-blue-200" :
    "bg-card border-card-border";
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
