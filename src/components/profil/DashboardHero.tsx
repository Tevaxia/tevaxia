"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

const TIER_STYLE: Record<string, { dot: string; label: string }> = {
  free: { dot: "bg-slate-400", label: "Free" },
  pro: { dot: "bg-emerald-400", label: "Pro" },
  enterprise: { dot: "bg-amber-400", label: "Enterprise" },
};

function greetingKey(hour: number): "greetMorning" | "greetAfternoon" | "greetEvening" {
  if (hour < 12) return "greetMorning";
  if (hour < 18) return "greetAfternoon";
  return "greetEvening";
}

function firstName(profile: UserProfile, user: User | null): string {
  if (profile.nomComplet?.trim()) {
    return profile.nomComplet.trim().split(" ")[0];
  }
  if (user?.user_metadata?.full_name) {
    return String(user.user_metadata.full_name).split(" ")[0];
  }
  if (user?.user_metadata?.name) {
    return String(user.user_metadata.name).split(" ")[0];
  }
  return "";
}

export default function DashboardHero({ user, profile }: DashboardHeroProps) {
  const t = useTranslations("dashboardHero");
  const [stats, setStats] = useState<Stats | null>(null);
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

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
  const name = firstName(profile, user);
  const greeting = t(greetingKey(hour));
  const initial = (name || profile.societe || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="rounded-2xl border border-card-border/60 bg-gradient-to-br from-navy-dark via-navy to-navy-light p-6 sm:p-8 shadow-lg text-white overflow-hidden relative">
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="" className="h-12 w-12 rounded-xl bg-white p-1 object-contain shrink-0 ring-1 ring-white/20" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold/80 to-gold text-navy-dark flex items-center justify-center text-lg font-bold shrink-0 ring-1 ring-white/20">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-medium">
                {greeting}
              </div>
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight truncate leading-tight">
                {name || profile.societe || t("defaultUser")}
              </h2>
              {profile.societe && name && (
                <div className="mt-0.5 text-xs text-white/60 truncate">{profile.societe}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/15`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tierStyle.dot}`} />
              {tierStyle.label}
            </span>
            {stats?.hasByok && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/15">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
                {t("byokActive")}
              </span>
            )}
          </div>
        </div>

        {/* KPIs — 4 cards, grandes numériques, hints minimaux */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi
            label={t("kpiValuations")}
            value={stats?.valuationsCount ?? "—"}
            hint={stats ? `/ ${stats.itemsCap.toLocaleString("fr-LU")}` : undefined}
          />
          <Kpi
            label={t("kpiAiAnalyses")}
            value={stats ? (stats.hasByok ? "∞" : String(stats.aiUsageToday)) : "—"}
            hint={stats ? (stats.hasByok ? t("aiUnlimited") : `/ ${stats.aiQuotaFree} ${t("aiToday")}`) : undefined}
          />
          <Kpi
            label={t("kpiActiveAlerts")}
            value={stats?.alertsActive ?? "—"}
          />
          <Kpi
            label={t("kpiSharedLinks")}
            value={stats?.sharedLinksActive ?? "—"}
            hint={stats && stats.apiKeysCount > 0 ? t("sharedApiKeys", { count: stats.apiKeysCount }) : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] backdrop-blur-sm px-4 py-3 ring-1 ring-white/10 transition-colors hover:bg-white/[0.09]">
      <div className="text-[10px] uppercase tracking-wider text-white/50 font-medium">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums tracking-tight">{value}</span>
        {hint && <span className="text-[10px] text-white/40 font-mono truncate">{hint}</span>}
      </div>
    </div>
  );
}
