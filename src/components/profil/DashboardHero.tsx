"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/profile";
import type { User } from "@supabase/supabase-js";

interface DashboardHeroProps {
  user: User | null;
  profile: UserProfile;
}

interface Stats {
  tier: string;
  valuationsCount: number;
  alertsActive: number;
  sharedLinksActive: number;
  apiKeysCount: number;
  aiUsageToday: number;
  aiQuotaFree: number;
  itemsCap: number;
  hasByok: boolean;
}

const TIER_STYLE: Record<string, { badge: string; label: string }> = {
  free: { badge: "bg-slate-100 text-slate-800 border-slate-200", label: "Free" },
  pro: { badge: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Pro" },
  enterprise: { badge: "bg-amber-100 text-amber-800 border-amber-300", label: "Enterprise" },
};

export default function DashboardHero({ user, profile }: DashboardHeroProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user || !supabase) return;
    const load = async () => {
      const [tierRes, valuationsRes, alertsRes, sharedRes, apiKeysRes, aiRes] = await Promise.all([
        supabase!.from("user_tiers").select("tier, items_cap").eq("user_id", user.id).maybeSingle(),
        supabase!.from("valuations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase!.from("market_alerts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("active", true),
        supabase!.from("shared_links").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("expires_at", new Date().toISOString()),
        supabase!.from("api_keys").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("active", true),
        supabase!.from("user_ai_settings").select("daily_usage, last_usage_date, ai_api_key_encrypted").eq("user_id", user.id).maybeSingle(),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const aiData = aiRes.data as { daily_usage?: number; last_usage_date?: string; ai_api_key_encrypted?: string | null } | null;
      const aiToday = aiData?.last_usage_date === today ? (aiData?.daily_usage ?? 0) : 0;

      setStats({
        tier: (tierRes.data as { tier?: string } | null)?.tier ?? "free",
        itemsCap: (tierRes.data as { items_cap?: number } | null)?.items_cap ?? 500,
        valuationsCount: valuationsRes.count ?? 0,
        alertsActive: alertsRes.count ?? 0,
        sharedLinksActive: sharedRes.count ?? 0,
        apiKeysCount: apiKeysRes.count ?? 0,
        aiUsageToday: aiToday,
        aiQuotaFree: 5,
        hasByok: !!aiData?.ai_api_key_encrypted,
      });
    };
    void load();
  }, [user]);

  const tierStyle = TIER_STYLE[stats?.tier ?? "free"] ?? TIER_STYLE.free;
  const displayName = profile.nomComplet || user?.email?.split("@")[0] || "Utilisateur";

  return (
    <div className="rounded-2xl border border-card-border bg-gradient-to-br from-navy to-navy-light p-6 sm:p-8 shadow-lg text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {profile.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logoUrl} alt="" className="h-14 w-14 rounded-xl bg-white p-1 object-contain shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold shrink-0">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-white/60">Bienvenue</div>
            <div className="text-xl sm:text-2xl font-bold truncate">{displayName}</div>
            {profile.societe && <div className="text-sm text-white/70 truncate">{profile.societe}</div>}
            {profile.qualifications && <div className="text-xs text-white/50 truncate mt-0.5">{profile.qualifications}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tierStyle.badge}`}>
            Plan {tierStyle.label}
          </span>
          {stats?.hasByok && (
            <span className="rounded-full border border-purple-300 bg-purple-100 text-purple-800 px-3 py-1 text-xs font-semibold">
              BYOK actif
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Évaluations" value={stats?.valuationsCount ?? "—"} hint={stats ? `/ ${stats.itemsCap.toLocaleString("fr-LU")} max` : undefined} />
        <Kpi
          label="Analyses IA"
          value={stats ? (stats.hasByok ? "∞" : `${stats.aiUsageToday}/${stats.aiQuotaFree}`) : "—"}
          hint={stats ? (stats.hasByok ? "Illimité (BYOK)" : "aujourd'hui") : undefined}
        />
        <Kpi label="Alertes actives" value={stats?.alertsActive ?? "—"} hint={stats?.alertsActive === 0 ? "Aucune" : "communes suivies"} />
        <Kpi label="Liens partagés" value={stats?.sharedLinksActive ?? "—"} hint={stats ? `${stats.apiKeysCount} clés API` : undefined} />
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-white/60">{label}</div>
      <div className="mt-0.5 text-2xl font-bold font-mono">{value}</div>
      {hint && <div className="text-[10px] text-white/50 truncate">{hint}</div>}
    </div>
  );
}
