"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errMsg } from "@/lib/errors";

interface OrgStats {
  members_count: number;
  keys_active: number;
  calls_total: number;
  calls_errors: number;
  error_rate: number;
  top_members: Array<{ user_id: string; calls: number }>;
  daily: Array<{ day: string; total: number }>;
  period_days: number;
}

export default function OrgAgencyStats({ orgId }: { orgId: string }) {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!supabase || !orgId) return;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const { data, error } = await supabase!.rpc("org_agency_stats", { p_org_id: orgId, p_days: days });
        if (error) throw error;
        setStats(data as OrgStats);
      } catch (e) {
        setError(errMsg(e, String(e)));
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId, days]);

  if (loading) return <p className="text-xs text-muted">Chargement des statistiques…</p>;
  if (error) return <p className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">{error}</p>;
  if (!stats) return null;

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.total));

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-navy">Activité de l&apos;agence</h3>
          <p className="text-xs text-muted">Usage API + membres (réservé aux admins)</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-card-border bg-background px-2 py-1 text-xs"
        >
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Membres" value={stats.members_count} />
        <Kpi label="Clés API actives" value={stats.keys_active} />
        <Kpi label={`Appels ${stats.period_days}j`} value={stats.calls_total.toLocaleString("fr-FR")} />
        <Kpi
          label="Taux d'erreur"
          value={`${stats.error_rate} %`}
          tone={stats.error_rate > 5 ? "rose" : stats.error_rate > 1 ? "amber" : "emerald"}
        />
      </div>

      {stats.daily.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Appels par jour</div>
          <div className="flex items-end gap-[2px] h-20">
            {stats.daily.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.total}`}
                className="flex-1 bg-navy/70 rounded-t"
                style={{ height: `${(d.total / maxDaily) * 100}%`, minHeight: "2px" }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>{stats.daily[0]?.day}</span>
            <span>{stats.daily[stats.daily.length - 1]?.day}</span>
          </div>
        </div>
      )}

      {stats.top_members.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Top 5 membres par activité</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 font-semibold">User</th>
                <th className="py-1 font-semibold text-right">Appels {stats.period_days}j</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_members.map((m, i) => (
                <tr key={m.user_id} className="border-t border-card-border/50">
                  <td className="py-1 font-mono text-[10px] text-muted">
                    #{i + 1} · {m.user_id.slice(0, 8)}…
                  </td>
                  <td className="py-1 text-right font-mono tabular-nums">{m.calls.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-muted">
            Tri par nombre d&apos;appels API. Pour un suivi commercial (mandats, conversions), contactez-nous pour l&apos;add-on CRM.
          </p>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone = "navy" }: { label: string; value: number | string; tone?: "navy" | "emerald" | "amber" | "rose" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-700" :
    tone === "amber" ? "text-amber-700" :
    tone === "rose" ? "text-rose-700" :
    "text-navy";
  return (
    <div className="rounded-lg border border-card-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
