"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listReservations } from "@/lib/pms/reservations";
import { aggregateKpis } from "@/lib/pms/kpi";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { PmsProperty, PmsReservation, PmsNightAudit } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart,
} from "recharts";

function plusDaysISO(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}

export default function ReportsPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [audits, setAudits] = useState<PmsNightAudit[]>([]);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [period, setPeriod] = useState<"7" | "30" | "90" | "365">("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    const days = Number(period);
    (async () => {
      setLoading(true);
      const from = plusDaysISO(-days);
      const to = plusDaysISO(0);
      const [p, res] = await Promise.all([
        getProperty(propertyId),
        listReservations(propertyId, { fromDate: from, toDate: to }),
      ]);
      setProperty(p);
      setReservations(res);

      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from("pms_night_audits")
          .select("*")
          .eq("property_id", propertyId)
          .gte("audit_date", from)
          .order("audit_date");
        setAudits((data ?? []) as PmsNightAudit[]);
      }
      setLoading(false);
    })();
  }, [propertyId, user, authLoading, period]);

  const runNightAuditToday = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.rpc("pms_run_night_audit", { p_property_id: propertyId, p_date: plusDaysISO(0) });
    const days = Number(period);
    const { data } = await supabase
      .from("pms_night_audits")
      .select("*")
      .eq("property_id", propertyId)
      .gte("audit_date", plusDaysISO(-days))
      .order("audit_date");
    setAudits((data ?? []) as PmsNightAudit[]);
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Connectez-vous</Link></div>;

  const kpis = aggregateKpis(audits);

  // Données graphiques
  const dailyData = audits.map((a) => ({
    date: a.audit_date.slice(5),
    occupancy: Math.round(Number(a.occupancy_pct) * 10) / 10,
    adr: Math.round(Number(a.adr)),
    revpar: Math.round(Number(a.revpar)),
    revenue: Math.round(Number(a.room_revenue)),
  }));

  // Sources réservations
  const sourceStats = reservations.reduce<Record<string, { count: number; revenue: number }>>((acc, r) => {
    const s = r.source;
    if (!acc[s]) acc[s] = { count: 0, revenue: 0 };
    acc[s].count++;
    acc[s].revenue += Number(r.total_amount || 0);
    return acc;
  }, {});

  const sourceBarData = Object.entries(sourceStats)
    .map(([source, s]) => ({ source, count: s.count, revenue: Math.round(s.revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  // Export CSV night audits
  const exportCsv = () => {
    const lines = ["date;total_rooms;occupied;occupancy_pct;adr;revpar;room_revenue;taxe_sejour"];
    for (const a of audits) {
      lines.push([
        a.audit_date, a.total_rooms, a.occupied_rooms,
        Number(a.occupancy_pct).toFixed(1),
        Number(a.adr).toFixed(2),
        Number(a.revpar).toFixed(2),
        Number(a.room_revenue).toFixed(2),
        Number(a.taxe_sejour_collected).toFixed(2),
      ].join(";"));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${property.name.replace(/\s+/g, "-")}-${period}j.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Rapports &amp; analytics</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 text-xs">
          {(["7","30","90","365"] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 ${period === p ? "bg-navy text-white" : "border border-card-border text-slate hover:border-navy"}`}>
              {p}j
            </button>
          ))}
        </div>
        <button type="button" onClick={runNightAuditToday}
          className="rounded-md border border-navy bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/10">
          Exécuter night audit aujourd&apos;hui
        </button>
        <button type="button" onClick={exportCsv} className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy">
          Export CSV
        </button>
        <Link
          href={`/api/pms/ical/${propertyId}`}
          target="_blank"
          className="ml-auto rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          📅 iCal feed OTA (read-only)
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Occupation" value={kpis.occupancyPct.toFixed(1) + " %"} tone="emerald" />
        <Kpi label="ADR" value={formatEUR(kpis.adr)} tone="navy" />
        <Kpi label="RevPAR" value={formatEUR(kpis.revpar)} tone="navy" />
        <Kpi label="CA chambres" value={formatEUR(kpis.totalRoomRevenue)} />
      </div>

      {/* Charts */}
      {dailyData.length > 0 && (
        <>
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">Occupation &amp; RevPAR par jour</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "%", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "€", angle: 90, position: "insideRight", style: { fontSize: 10 } }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="occupancy" fill="#10b981" name="Occupation %" />
                  <Line yAxisId="right" type="monotone" dataKey="revpar" stroke="#1e3a5f" strokeWidth={2} name="RevPAR" />
                  <Line yAxisId="right" type="monotone" dataKey="adr" stroke="#d4a84a" strokeWidth={2} strokeDasharray="5 5" name="ADR" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">CA chambres par jour</h2>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1e3a5f" name="CA chambres €" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {/* Sources */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">Performance par source ({reservations.length} réservations)</h2>
        {sourceBarData.length === 0 ? (
          <p className="text-xs text-muted italic">Aucune réservation sur la période.</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={sourceBarData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Nb réservations" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="CA €" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {dailyData.length === 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900">
          Aucun night audit sur la période. Cliquez &laquo; Exécuter night audit aujourd&apos;hui &raquo; pour snapshooter
          la situation actuelle (idempotent), ou programmez une tâche cron Supabase pour automatiser l&apos;exécution chaque nuit.
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "navy" | "emerald" }) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : tone === "navy"
      ? "bg-navy text-white border-transparent"
      : "bg-card border-card-border text-navy";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-[11px] opacity-80">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
