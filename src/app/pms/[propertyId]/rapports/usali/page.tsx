"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { buildUsaliMonthly, monthLabel, yoyDelta, type UsaliMonthlyReport } from "@/lib/pms/usali";
import UsaliReportPdf from "@/components/UsaliReportPdf";
import type { PmsProperty } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

export default function UsaliReportPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [report, setReport] = useState<UsaliMonthlyReport | null>(null);
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
      const r = await buildUsaliMonthly(propertyId, year, month);
      setReport(r);
    } catch (e) { setError(errMsg(e)); }
    setBuilding(false);
  }, [propertyId, year, month]);

  useEffect(() => { if (user && property) void build(); }, [user, property, build]);

  const download = async () => {
    if (!report) return;
    const blob = await pdf(<UsaliReportPdf report={report} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usali-${report.property_name.replace(/\s+/g, "-").toLowerCase()}-${year}-${String(month).padStart(2, "0")}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`/pms/${propertyId}/rapports`} className="hover:text-navy">Rapports</Link>
        <span>/</span>
        <span className="text-navy">USALI mensuel</span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Rapport USALI mensuel</h1>
          <p className="mt-1 text-sm text-muted">
            Uniform System of Accounts for the Lodging Industry v11 — standard mondial AHLA/HOTREC.
            KPIs occupancy / ADR / RevPAR / TRevPAR + ventilation revenus par département et comparatif YoY.
          </p>
        </div>
        {report && (
          <button onClick={download}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            ↓ Télécharger PDF
          </button>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Period selector */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-card p-4">
        <label className="text-xs">
          <span className="mr-2 text-muted">Mois</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border border-input-border bg-input-bg px-2 py-1">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="mr-2 text-muted">Année</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border border-input-border bg-input-bg px-2 py-1">
            {[year - 2, year - 1, year, year + 1].filter((y, i, arr) => arr.indexOf(y) === i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <span className="text-xs text-muted">{monthLabel(year, month)}</span>
      </div>

      {building && <div className="mt-6 text-center text-sm text-muted">Construction du rapport…</div>}

      {report && !building && (
        <>
          {/* KPIs */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Occupancy" value={`${report.occupancy_pct.toFixed(2)}%`}
              yoy={yoyDelta(report.occupancy_pct, report.prev_year_same_month?.occupancy_pct)} />
            <Kpi label="ADR" value={formatEUR(report.adr)}
              yoy={yoyDelta(report.adr, report.prev_year_same_month?.adr)} />
            <Kpi label="RevPAR" value={formatEUR(report.revpar)}
              yoy={yoyDelta(report.revpar, report.prev_year_same_month?.revpar)} />
            <Kpi label="TRevPAR" value={formatEUR(report.trevpar)} sub="Total revenue / available" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Rooms sold" value={report.rooms_sold.toLocaleString("fr-LU")} sub="chambres vendues" />
            <Kpi label="Rooms available" value={report.rooms_available.toLocaleString("fr-LU")} sub={`${report.days_in_period} jours × inventaire`} />
            <Kpi label="Total revenue" value={formatEUR(report.total_revenue_ttc)} sub="TTC"
              yoy={yoyDelta(report.total_revenue_ttc,
                (report.prev_year_same_month?.room_revenue_ttc ?? 0) * (report.total_revenue_ttc / Math.max(1, report.room_revenue_ttc)))} />
            <Kpi label="Taxe séjour" value={formatEUR(report.taxe_sejour_collected)} sub="collectée (hors TVA)" tone="amber" />
          </div>

          {/* Revenue breakdown */}
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">Revenue breakdown (USALI)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-3 py-2 text-left">Department</th>
                  <th className="px-3 py-2 text-right">HT</th>
                  <th className="px-3 py-2 text-right">TVA</th>
                  <th className="px-3 py-2 text-right">TTC</th>
                  <th className="px-3 py-2 text-right">% Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Rooms", ht: report.room_revenue_ht, tva: report.room_revenue_tva, ttc: report.room_revenue_ttc, tone: "bg-blue-50/40" },
                  { label: "Food & Beverage", ht: report.fb_revenue_ht, tva: report.fb_revenue_tva, ttc: report.fb_revenue_ttc, tone: "" },
                  { label: "Other Operated Departments", ht: report.other_revenue_ht, tva: report.other_revenue_tva, ttc: report.other_revenue_ttc, tone: "bg-blue-50/40" },
                  { label: "City tax (hors TVA)", ht: report.taxe_sejour_collected, tva: 0, ttc: report.taxe_sejour_collected, tone: "" },
                ].map((l) => {
                  const pct = report.total_revenue_ttc > 0 ? (l.ttc / report.total_revenue_ttc * 100) : 0;
                  return (
                    <tr key={l.label} className={`border-b border-card-border/40 ${l.tone}`}>
                      <td className="px-3 py-2 font-medium">{l.label}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatEUR(l.ht)}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted">{formatEUR(l.tva)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(l.ttc)}</td>
                      <td className="px-3 py-2 text-right">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-navy text-white font-bold">
                  <td className="px-3 py-2">Total Revenue</td>
                  <td className="px-3 py-2 text-right font-mono">{formatEUR(report.total_revenue_ht)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatEUR(report.total_revenue_tva)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatEUR(report.total_revenue_ttc)}</td>
                  <td className="px-3 py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Daily trend charts */}
          {report.daily_audits.length > 0 && (
            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-card-border bg-card p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">Occupancy quotidien</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={report.daily_audits.map((a) => ({ date: a.audit_date.slice(8, 10), occ: a.occupancy_pct }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                    <Line type="monotone" dataKey="occ" stroke="#0B2447" strokeWidth={2} dot={false} name="Occupancy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">Revenue vs RevPAR</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.daily_audits.map((a) => ({
                    date: a.audit_date.slice(8, 10),
                    revenue: a.room_revenue,
                    revpar: a.revpar,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatEUR(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="revenue" fill="#0B2447" name="Room rev." />
                    <Bar dataKey="revpar" fill="#6366F1" name="RevPAR" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Categories detail */}
          {report.categories.length > 0 && (
            <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
                Détail catégories ({report.categories.length})
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-3 py-2 text-left">Catégorie</th>
                    <th className="px-3 py-2 text-right">Transactions</th>
                    <th className="px-3 py-2 text-right">HT</th>
                    <th className="px-3 py-2 text-right">TVA</th>
                    <th className="px-3 py-2 text-right">TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((c, i) => (
                    <tr key={c.category} className={i % 2 === 0 ? "" : "bg-background/40"}>
                      <td className="px-3 py-1.5">{c.label}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">{c.nb_transactions}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">{formatEUR(c.revenue_ht)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-muted">{formatEUR(c.tva)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold">{formatEUR(c.revenue_ttc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Flash activité */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Arrivées" value={String(report.arrivals_total)} sub="cumul mois" />
            <Kpi label="Départs" value={String(report.departures_total)} sub="cumul mois" />
            <Kpi label="Stayovers" value={String(report.stayovers_total)} sub="nuits in-house" />
            <Kpi label="No-shows" value={String(report.no_shows_total)} sub="non-présentés" tone={report.no_shows_total > 0 ? "amber" : undefined} />
          </div>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <strong>USALI v11 :</strong> standard mondial de reporting hôtelier (AHLA + HOTREC).
            Adopté par les Big 4 (PwC / Deloitte / EY / KPMG) pour le benchmarking hôtellier.
            Les KPIs officiels sont ADR, RevPAR et TRevPAR — le RevPAR étant la mesure synthétique
            de performance (ADR × occupancy).
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, yoy, tone }: {
  label: string; value: string; sub?: string;
  yoy?: { abs: number; pct: number | null } | null;
  tone?: "amber";
}) {
  const bg = tone === "amber" ? "bg-amber-50 border-amber-200" : "bg-card border-card-border";
  const txt = tone === "amber" ? "text-amber-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
      {yoy && yoy.pct !== null && (
        <div className={`text-[10px] font-semibold ${yoy.pct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
          {yoy.pct >= 0 ? "+" : ""}{yoy.pct.toFixed(1)}% YoY
        </div>
      )}
      {sub && !yoy && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
