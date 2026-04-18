"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { computeCoMandateSplit, type AgencyMandate } from "@/lib/agency-mandates";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

interface AgentStats {
  user_id: string;
  name: string;
  mandates_total: number;
  mandates_active: number;
  mandates_signed: number;
  mandates_sold: number;
  mandates_abandoned: number;
  conversion_rate: number; // sold / signed
  avg_days_to_sign: number;
  avg_days_to_close: number;
  commissions_perceived: number;
  commissions_pipeline: number;
}

export default function AgentPerformancePage() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Charge tous les mandats visibles par l'user (RLS filtre auto)
      const { data: mandatesData } = await supabase
        .from("agency_mandates").select("*");
      const mandates = (mandatesData ?? []) as AgencyMandate[];

      // Group by user_id
      const byAgent = new Map<string, AgencyMandate[]>();
      for (const m of mandates) {
        const list = byAgent.get(m.user_id) ?? [];
        list.push(m);
        byAgent.set(m.user_id, list);
      }

      // Charge noms agents (essaie tables profiles + fallback user_id)
      const userIds = Array.from(byAgent.keys());
      let nameMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles").select("id, full_name, email").in("id", userIds);
        nameMap = new Map(
          ((profs ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>)
            .map((p) => [p.id, p.full_name ?? p.email ?? p.id.slice(0, 8)]),
        );
      }

      const stats: AgentStats[] = [];
      for (const [userId, ms] of byAgent.entries()) {
        const activeStatuses = ["mandat_signe", "diffuse", "en_visite", "offre_recue", "sous_compromis"];
        const soldThisYear = ms.filter((m) =>
          m.status === "vendu" && m.sold_at && new Date(m.sold_at).getFullYear() === year,
        );
        const signed = ms.filter((m) => m.signed_at).length;
        const active = ms.filter((m) => activeStatuses.includes(m.status));

        const daysToSignVals = ms.filter((m) => m.days_to_sign != null).map((m) => Number(m.days_to_sign));
        const daysToCloseVals = ms.filter((m) => m.days_to_close != null).map((m) => Number(m.days_to_close));

        const commissionsPerceived = soldThisYear.reduce((s, m) => {
          const split = computeCoMandateSplit(m);
          return s + (Number(m.commission_amount_percue) || split.primary);
        }, 0);
        const commissionsPipeline = active.reduce((s, m) => {
          const split = computeCoMandateSplit(m);
          return s + split.primary;
        }, 0);

        stats.push({
          user_id: userId,
          name: nameMap.get(userId) ?? userId.slice(0, 8),
          mandates_total: ms.length,
          mandates_active: active.length,
          mandates_signed: signed,
          mandates_sold: soldThisYear.length,
          mandates_abandoned: ms.filter((m) => m.status === "abandonne").length,
          conversion_rate: signed > 0 ? (soldThisYear.length / signed) * 100 : 0,
          avg_days_to_sign: daysToSignVals.length > 0
            ? daysToSignVals.reduce((a, b) => a + b, 0) / daysToSignVals.length : 0,
          avg_days_to_close: daysToCloseVals.length > 0
            ? daysToCloseVals.reduce((a, b) => a + b, 0) / daysToCloseVals.length : 0,
          commissions_perceived: commissionsPerceived,
          commissions_pipeline: commissionsPipeline,
        });
      }
      stats.sort((a, b) => b.commissions_perceived - a.commissions_perceived);
      setAgents(stats);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [user, year]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const totals = useMemo(() => ({
    agents: agents.length,
    totalSold: agents.reduce((s, a) => s + a.mandates_sold, 0),
    totalCommissions: agents.reduce((s, a) => s + a.commissions_perceived, 0),
    totalPipeline: agents.reduce((s, a) => s + a.commissions_pipeline, 0),
    avgConversion: agents.length > 0
      ? agents.reduce((s, a) => s + a.conversion_rate, 0) / agents.length : 0,
  }), [agents]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/pro-agences" className="text-xs text-muted hover:text-navy">← Pro agences</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Performance agents</h1>
          <p className="mt-1 text-sm text-muted">
            Classement des agents par commissions perçues {year}, avec métriques
            conversion / cycle de vente / pipeline. Visible par les admins d&apos;organisation.
          </p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm">
          {[year - 2, year - 1, year].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Totals */}
      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        <Kpi label="Agents" value={String(totals.agents)} />
        <Kpi label="Ventes closées" value={String(totals.totalSold)} />
        <Kpi label="Taux conversion moyen" value={`${totals.avgConversion.toFixed(1)}%`} />
        <Kpi label="Commissions perçues" value={formatEUR(totals.totalCommissions)} tone="emerald" />
        <Kpi label="Pipeline total" value={formatEUR(totals.totalPipeline)} tone="blue" />
      </div>

      {/* Table */}
      {agents.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucun agent avec mandats visibles dans votre périmètre.
        </div>
      ) : (
        <section className="mt-6 rounded-xl border border-card-border bg-card p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Agent</th>
                <th className="px-3 py-2 text-right">Mandats</th>
                <th className="px-3 py-2 text-right">Signés</th>
                <th className="px-3 py-2 text-right">Vendus {year}</th>
                <th className="px-3 py-2 text-right">Conversion</th>
                <th className="px-3 py-2 text-right">Délai signe</th>
                <th className="px-3 py-2 text-right">Délai vente</th>
                <th className="px-3 py-2 text-right">Commission €</th>
                <th className="px-3 py-2 text-right">Pipeline €</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a, i) => (
                <tr key={a.user_id} className={i % 2 === 0 ? "" : "bg-background/40"}>
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {i === 0 && <span className="inline-block mr-1">🥇</span>}
                    {i === 1 && <span className="inline-block mr-1">🥈</span>}
                    {i === 2 && <span className="inline-block mr-1">🥉</span>}
                    {i + 1}
                  </td>
                  <td className="px-3 py-1.5 font-semibold text-navy">{a.name}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs">{a.mandates_total}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs">{a.mandates_signed}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs text-emerald-700 font-semibold">
                    {a.mandates_sold}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs">
                    {a.conversion_rate > 0 ? `${a.conversion_rate.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs text-muted">
                    {a.avg_days_to_sign > 0 ? `${a.avg_days_to_sign.toFixed(0)}j` : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs text-muted">
                    {a.avg_days_to_close > 0 ? `${a.avg_days_to_close.toFixed(0)}j` : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs font-bold text-emerald-700">
                    {formatEUR(a.commissions_perceived)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs text-blue-700">
                    {formatEUR(a.commissions_pipeline)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-navy text-white font-bold">
                <td colSpan={8} className="px-3 py-2 text-right">Totaux</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(totals.totalCommissions)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(totals.totalPipeline)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Métriques USALI (revenue management adapté immo) :</strong>
        conversion = ventes closées / mandats signés · cycle vente = délai entre signé et
        acte authentique. Un cycle &lt; 90 jours est sain en marché LU. Conversion &gt; 70 %
        indique un bon qualitative de leads. Pipeline × probabilité moyenne = projection
        commission T+3 mois.
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "blue" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "blue" ? "bg-blue-50 border-blue-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "blue" ? "text-blue-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}
