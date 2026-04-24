"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import { listHotels, type Hotel, type HotelCategory } from "@/lib/hotels";
import { formatEUR } from "@/lib/calculations";

interface HotelWithLatestPeriod extends Hotel {
  latestPeriod?: {
    period_label: string;
    revpar: number | null;
    adr: number | null;
    occupancy: number | null;
    gop: number | null;
    gop_margin: number | null;
  };
  score?: number;
}

function computeScore(h: HotelWithLatestPeriod): number {
  if (!h.latestPeriod) return 0;
  const p = h.latestPeriod;
  const occ = (p.occupancy ?? 0) * 100;
  const adrNorm = Math.min(100, (p.adr ?? 0) / 3);
  const gopMargin = (p.gop_margin ?? 0) * 100;
  return Math.round((occ * 0.35) + (adrNorm * 0.30) + (gopMargin * 0.35));
}

function pctColor(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (score >= 60) return "bg-lime-100 text-lime-900 border-lime-200";
  if (score >= 45) return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-rose-100 text-rose-900 border-rose-200";
}

export default function HotelBenchmarkPage() {
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations("hotelBenchmark");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [hotels, setHotels] = useState<HotelWithLatestPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  const CATEGORY_LABEL: Record<HotelCategory, string> = {
    budget: t("catBudget"),
    midscale: t("catMidscale"),
    upscale: t("catUpscale"),
    luxury: t("catLuxury"),
  };

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    void (async () => {
      const list = await listMyOrganizations();
      const hotelOrgs = list.filter((o) => o.org_type === "hotel_group");
      setOrgs(hotelOrgs);
      if (hotelOrgs.length > 0) setActiveOrgId(hotelOrgs[0].id);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeOrgId) return;
    void (async () => {
      setLoading(true);
      const hs = await listHotels(activeOrgId);
      if (supabase) {
        const enriched: HotelWithLatestPeriod[] = await Promise.all(
          hs.map(async (h) => {
            const { data } = await supabase!
              .from("hotel_periods")
              .select("period_label, revpar, adr, occupancy, gop, gop_margin")
              .eq("hotel_id", h.id)
              .order("period_label", { ascending: false })
              .limit(1)
              .maybeSingle();
            return { ...h, latestPeriod: data ?? undefined } as HotelWithLatestPeriod;
          }),
        );
        setHotels(enriched);
      } else {
        setHotels(hs as HotelWithLatestPeriod[]);
      }
      setLoading(false);
    })();
  }, [activeOrgId]);

  const ranked = useMemo(() => {
    return [...hotels]
      .map((h) => ({ ...h, score: computeScore(h) }))
      .sort((a, b) => b.score - a.score);
  }, [hotels]);

  const stats = useMemo(() => {
    const withPeriod = hotels.filter((h) => h.latestPeriod);
    if (withPeriod.length === 0) return null;
    const avgRevPar = withPeriod.reduce((s, h) => s + (h.latestPeriod?.revpar ?? 0), 0) / withPeriod.length;
    const avgADR = withPeriod.reduce((s, h) => s + (h.latestPeriod?.adr ?? 0), 0) / withPeriod.length;
    const avgOcc = withPeriod.reduce((s, h) => s + (h.latestPeriod?.occupancy ?? 0), 0) / withPeriod.length;
    const avgGopMargin = withPeriod.reduce((s, h) => s + (h.latestPeriod?.gop_margin ?? 0), 0) / withPeriod.length;
    return { avgRevPar, avgADR, avgOcc, avgGopMargin, count: withPeriod.length };
  }, [hotels]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {t("supabaseRequired")}
        </div>
      </div>
    );
  }

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href="/connexion" className="text-navy underline">{t("signIn")}</Link>
    </div>
  );

  if (orgs.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("noOrgs")}{" "}
          <Link href="/profil/organisation" className="text-navy underline">/profil/organisation</Link>.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>

      {orgs.length > 1 && (
        <div className="mt-4">
          <select
            value={activeOrgId ?? ""}
            onChange={(e) => setActiveOrgId(e.target.value)}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
          >
            {orgs.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
          </select>
        </div>
      )}

      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">{t("statHotels")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{stats.count}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">{t("statRevparAvg")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(stats.avgRevPar)}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">{t("statAdrAvg")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(stats.avgADR)}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">{t("statOccAvg")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{(stats.avgOcc * 100).toFixed(1)} %</div>
          </div>
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("noHotels")}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/60">
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("thRank")}</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("thHotel")}</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("thCat")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("thRooms")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("thRevpar")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("thAdr")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("thOcc")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("thGop")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("thScore")}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((h, i) => {
                const p = h.latestPeriod;
                const vsAvg = stats && p?.revpar ? (p.revpar - stats.avgRevPar) / stats.avgRevPar : 0;
                const score = h.score ?? 0;
                return (
                  <tr key={h.id} className="border-b border-card-border/40 hover:bg-background/40">
                    <td className="px-3 py-3 font-mono font-semibold">{i + 1}</td>
                    <td className="px-3 py-3">
                      <Link href={`/hotellerie/groupe/${h.id}`} className="font-medium text-navy hover:underline">
                        {h.name}
                      </Link>
                      {p && <div className="text-[10px] text-muted">{t("lastPeriod", { period: p.period_label })}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs">{CATEGORY_LABEL[h.category]}</td>
                    <td className="px-3 py-3 text-right font-mono">{h.nb_chambres}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">
                      {p?.revpar ? formatEUR(p.revpar) : "—"}
                      {p?.revpar && stats && (
                        <div className={`text-[9px] ${vsAvg > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {t("vsAvg", { value: `${vsAvg > 0 ? "+" : ""}${(vsAvg * 100).toFixed(1)}` })}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{p?.adr ? formatEUR(p.adr) : "—"}</td>
                    <td className="px-3 py-3 text-right font-mono">{p?.occupancy ? `${(p.occupancy * 100).toFixed(1)} %` : "—"}</td>
                    <td className="px-3 py-3 text-right font-mono">{p?.gop_margin ? `${(p.gop_margin * 100).toFixed(1)} %` : "—"}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`inline-block rounded-lg border px-2 py-1 font-mono font-bold ${pctColor(score)}`}>
                        {score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("scoringStrong")}</strong> {t("scoringBody")}{" "}
        <Link href="/hotellerie/observatoire-lu" className="underline">{t("scoringLink")}</Link>{" "}
        {t("scoringSuffix")}
      </div>
    </div>
  );
}
