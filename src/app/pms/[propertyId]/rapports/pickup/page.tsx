"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { buildPickupReport, type PickupReport } from "@/lib/pms/pickup";
import type { PmsProperty } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export default function PickupReportPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [report, setReport] = useState<PickupReport | null>(null);
  const [windowDays, setWindowDays] = useState<7 | 14 | 30 | 60 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const p = await getProperty(propertyId);
      setProperty(p);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const build = useCallback(async () => {
    if (!propertyId) return;
    setBuilding(true);
    try {
      const r = await buildPickupReport(propertyId, windowDays);
      setReport(r);
    } catch (e) { setError(errMsg(e)); }
    setBuilding(false);
  }, [propertyId, windowDays]);

  useEffect(() => { if (user && property) void build(); }, [user, property, build]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }
  if (!user || !property) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
        <Link href="/connexion" className="text-navy underline">Se connecter</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`/pms/${propertyId}/rapports`} className="hover:text-navy">Rapports</Link>
        <span>/</span>
        <span className="text-navy">Pickup report</span>
      </div>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy">Pickup Report</h1>
        <p className="mt-1 text-sm text-muted">
          Réservations encaissées dans la fenêtre récente, ventilées par mois de séjour futur
          et source. KPI critique de revenue management pour ajuster tarifs, restrictions
          (MinLOS, CTA) et canaux de distribution.
        </p>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Window picker */}
      <div className="mt-5 rounded-xl border border-card-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Fenêtre de réservation :</span>
          {([7, 14, 30, 60, 90] as const).map((d) => (
            <button key={d} onClick={() => setWindowDays(d)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                windowDays === d ? "bg-navy text-white" : "bg-background border border-card-border text-slate hover:bg-card-border/40"
              }`}>
              {d} derniers jours
            </button>
          ))}
          {report && (
            <span className="ml-auto text-xs text-muted">
              {report.window_start} → {report.window_end}
            </span>
          )}
        </div>
      </div>

      {building && <div className="mt-6 text-center text-sm text-muted">Construction…</div>}

      {report && !building && (
        <>
          {/* KPIs */}
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Kpi label="Réservations pickup" value={String(report.total_reservations)}
              sub={`${windowDays} derniers jours`} />
            <Kpi label="Room nights OTB" value={report.total_room_nights.toLocaleString("fr-LU")}
              sub="sold during window" />
            <Kpi label="Revenue total" value={formatEUR(report.total_revenue)} tone="emerald" />
            <Kpi label="ADR moyen" value={formatEUR(report.avg_adr)} sub="revenue / room nights" />
          </div>

          {report.total_reservations === 0 ? (
            <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
              Aucune réservation créée dans cette fenêtre. Ajustez l&apos;horizon ou vérifiez
              vos canaux de distribution.
            </div>
          ) : (
            <>
              {/* Ventilation par mois de séjour */}
              <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                  Ventilation par mois de séjour
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                        <th className="px-3 py-2 text-left">Mois séjour</th>
                        <th className="px-3 py-2 text-right">Réservations</th>
                        <th className="px-3 py-2 text-right">Room nights</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                        <th className="px-3 py-2 text-right">ADR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.by_stay_month.map((m, i) => (
                        <tr key={m.stay_month} className={i % 2 === 0 ? "" : "bg-background/50"}>
                          <td className="px-3 py-1.5 font-medium">{m.stay_month}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{m.reservations}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{m.room_nights}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(m.revenue_total)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-muted">{formatEUR(m.adr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={report.by_stay_month}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stay_month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => Number(v).toLocaleString("fr-LU")} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="room_nights" fill="#0B2447" name="Room nights" />
                      <Bar dataKey="reservations" fill="#6366F1" name="Réservations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Pickup daily (graphique) */}
              <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                  Pickup quotidien (jour de réservation)
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={report.by_day_booked}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${Number(v) / 1000}k`} />
                    <Tooltip formatter={(v) => Number(v).toLocaleString("fr-LU")} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke="#0B2447"
                      strokeWidth={2} dot={false} name="Nb rés." />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981"
                      strokeWidth={2} dot={false} name="Revenue €" />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              {/* Ventilation par source */}
              <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                  Ventilation par source
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                      <th className="px-3 py-2 text-left">Canal</th>
                      <th className="px-3 py-2 text-right">Réservations</th>
                      <th className="px-3 py-2 text-right">% du total</th>
                      <th className="px-3 py-2 text-right">Revenue</th>
                      <th className="px-3 py-2 text-right">Part revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_source.map((s) => {
                      const pctCount = (s.count / report.total_reservations) * 100;
                      const pctRev = report.total_revenue > 0 ? (s.revenue / report.total_revenue) * 100 : 0;
                      return (
                        <tr key={s.source}>
                          <td className="px-3 py-1.5 font-medium">{s.source}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{s.count}</td>
                          <td className="px-3 py-1.5 text-right text-xs">{pctCount.toFixed(1)}%</td>
                          <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(s.revenue)}</td>
                          <td className="px-3 py-1.5 text-right text-xs">{pctRev.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            </>
          )}

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <strong>Revenue Management :</strong> utilisez ce rapport pour détecter pickup anormal
            (positif ou négatif) et ajuster tarifs / restrictions en conséquence. Un pickup faible
            sur un mois proche justifie baisse de prix ou ouverture de rate plans discount.
            Un pickup excessif permet raise rates et fermeture MinLOS 1 nuit.
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
