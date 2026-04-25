"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("pmsPickup");
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
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user || !property) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
        <Link href="/connexion" className="text-navy underline">{t("loginPrompt")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`/pms/${propertyId}/rapports`} className="hover:text-navy">{t("crumbReports")}</Link>
        <span>/</span>
        <span className="text-navy">{t("crumbCurrent")}</span>
      </div>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Window picker */}
      <div className="mt-5 rounded-xl border border-card-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">{t("windowLabel")}</span>
          {([7, 14, 30, 60, 90] as const).map((d) => (
            <button key={d} onClick={() => setWindowDays(d)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                windowDays === d ? "bg-navy text-white" : "bg-background border border-card-border text-slate hover:bg-card-border/40"
              }`}>
              {t("windowBtn", { d })}
            </button>
          ))}
          {report && (
            <span className="ml-auto text-xs text-muted">
              {t("windowRange", { start: report.window_start, end: report.window_end })}
            </span>
          )}
        </div>
      </div>

      {building && <div className="mt-6 text-center text-sm text-muted">{t("building")}</div>}

      {report && !building && (
        <>
          {/* KPIs */}
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Kpi label={t("kpiPickupRes")} value={String(report.total_reservations)}
              sub={t("kpiPickupResSub", { n: windowDays })} />
            <Kpi label={t("kpiRoomNights")} value={report.total_room_nights.toLocaleString()}
              sub={t("kpiRoomNightsSub")} />
            <Kpi label={t("kpiTotalRevenue")} value={formatEUR(report.total_revenue)} tone="emerald" />
            <Kpi label={t("kpiAvgAdr")} value={formatEUR(report.avg_adr)} sub={t("kpiAvgAdrSub")} />
          </div>

          {report.total_reservations === 0 ? (
            <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
              {t("emptyWindow")}
            </div>
          ) : (
            <>
              {/* Ventilation par mois de séjour */}
              <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                  {t("sectionByStayMonth")}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                        <th className="px-3 py-2 text-left">{t("colStayMonth")}</th>
                        <th className="px-3 py-2 text-right">{t("colReservations")}</th>
                        <th className="px-3 py-2 text-right">{t("colRoomNights")}</th>
                        <th className="px-3 py-2 text-right">{t("colRevenue")}</th>
                        <th className="px-3 py-2 text-right">{t("colAdr")}</th>
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
                      <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="room_nights" fill="#0B2447" name={t("chartLegendRoomNights")} />
                      <Bar dataKey="reservations" fill="#6366F1" name={t("chartLegendReservations")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Pickup daily (graphique) */}
              <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                  {t("sectionByDay")}
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={report.by_day_booked}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${Number(v) / 1000}k`} />
                    <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke="#0B2447"
                      strokeWidth={2} dot={false} name={t("chartLegendCount")} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981"
                      strokeWidth={2} dot={false} name={t("chartLegendRevenue")} />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              {/* Ventilation par source */}
              <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                  {t("sectionBySource")}
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                      <th className="px-3 py-2 text-left">{t("colChannel")}</th>
                      <th className="px-3 py-2 text-right">{t("colReservations")}</th>
                      <th className="px-3 py-2 text-right">{t("colPctCount")}</th>
                      <th className="px-3 py-2 text-right">{t("colRevenue")}</th>
                      <th className="px-3 py-2 text-right">{t("colPctRevenue")}</th>
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

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900"
            dangerouslySetInnerHTML={{ __html: t("methodology") }} />
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
