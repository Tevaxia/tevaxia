"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";

type HotelCategory = "budget" | "midscale" | "upscale" | "luxury";

interface CapexItem {
  year: number;
  type: "reserve" | "soft_refresh" | "hard_refresh" | "major_renovation";
  label: string;
  amount: number;
  note?: string;
}

const RESERVE_PCT: Record<HotelCategory, number> = { budget: 0.03, midscale: 0.04, upscale: 0.05, luxury: 0.06 };
const SOFT_REFRESH_PCT: Record<HotelCategory, number> = { budget: 0.015, midscale: 0.02, upscale: 0.025, luxury: 0.03 };
const HARD_REFRESH_PCT: Record<HotelCategory, number> = { budget: 0.05, midscale: 0.07, upscale: 0.09, luxury: 0.12 };
const MAJOR_RENOVATION_PCT: Record<HotelCategory, number> = { budget: 0.10, midscale: 0.14, upscale: 0.18, luxury: 0.25 };

const TYPE_COLORS: Record<CapexItem["type"], string> = {
  reserve: "bg-slate-100 text-slate-800 border-slate-200",
  soft_refresh: "bg-blue-100 text-blue-900 border-blue-200",
  hard_refresh: "bg-amber-100 text-amber-900 border-amber-200",
  major_renovation: "bg-rose-100 text-rose-900 border-rose-200",
};

export default function HotelCapexPage() {
  const t = useTranslations("hotelCapex");
  const [revenueAnnuel, setRevenueAnnuel] = useState(4_500_000);
  const [category, setCategory] = useState<HotelCategory>("upscale");
  const [horizonAns, setHorizonAns] = useState(10);
  const [ageHotel, setAgeHotel] = useState(8);

  const TYPE_LABELS: Record<CapexItem["type"], string> = {
    reserve: t("typeReserve"),
    soft_refresh: t("typeSoft"),
    hard_refresh: t("typeHard"),
    major_renovation: t("typeMajor"),
  };

  const plan = useMemo(() => {
    const items: CapexItem[] = [];
    const currentYear = new Date().getFullYear();
    for (let y = 1; y <= horizonAns; y++) {
      items.push({ year: currentYear + y, type: "reserve", label: t("itemReserveLabel"), amount: revenueAnnuel * RESERVE_PCT[category] });
    }
    const nextSoft = 5 - (ageHotel % 5);
    for (let y = nextSoft; y <= horizonAns; y += 5) {
      items.push({ year: currentYear + y, type: "soft_refresh", label: t("itemSoftLabel"), amount: revenueAnnuel * SOFT_REFRESH_PCT[category], note: t("itemSoftNote") });
    }
    const nextHard = 10 - (ageHotel % 10);
    for (let y = nextHard; y <= horizonAns; y += 10) {
      items.push({ year: currentYear + y, type: "hard_refresh", label: t("itemHardLabel"), amount: revenueAnnuel * HARD_REFRESH_PCT[category], note: t("itemHardNote") });
    }
    const nextMajor = 20 - (ageHotel % 20);
    if (nextMajor <= horizonAns) {
      items.push({ year: currentYear + nextMajor, type: "major_renovation", label: t("itemMajorLabel"), amount: revenueAnnuel * MAJOR_RENOVATION_PCT[category], note: t("itemMajorNote") });
    }
    return items.sort((a, b) => a.year - b.year);
  }, [revenueAnnuel, category, horizonAns, ageHotel, t]);

  const totalByType = useMemo(() => {
    const totals: Record<CapexItem["type"], number> = { reserve: 0, soft_refresh: 0, hard_refresh: 0, major_renovation: 0 };
    for (const i of plan) totals[i.type] += i.amount;
    return totals;
  }, [plan]);

  const totalCapex = plan.reduce((s, i) => s + i.amount, 0);
  const avgAnnualCapex = horizonAns > 0 ? totalCapex / horizonAns : 0;
  const ratioSurCA = revenueAnnuel > 0 ? (avgAnnualCapex / revenueAnnuel) * 100 : 0;

  const byYear = useMemo(() => {
    const map = new Map<number, number>();
    for (const i of plan) {
      map.set(i.year, (map.get(i.year) ?? 0) + i.amount);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [plan]);

  const maxYearly = Math.max(1, ...byYear.map(([, v]) => v));

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionParams")}</h2>
              <div className="space-y-4">
                <InputField label={t("inputCa")} value={revenueAnnuel} onChange={(v) => setRevenueAnnuel(Number(v))} suffix="€" />
                <InputField
                  label={t("inputCategory")}
                  type="select"
                  value={category}
                  onChange={(v) => setCategory(v as HotelCategory)}
                  options={[
                    { value: "budget", label: t("catBudget") },
                    { value: "midscale", label: t("catMidscale") },
                    { value: "upscale", label: t("catUpscale") },
                    { value: "luxury", label: t("catLuxury") },
                  ]}
                />
                <InputField label={t("inputAge")} value={ageHotel} onChange={(v) => setAgeHotel(Number(v))} min={0} max={100} hint={t("inputAgeHint")} />
                <InputField label={t("inputHorizon")} value={horizonAns} onChange={(v) => setHorizonAns(Number(v))} suffix={t("ansSuffix")} min={5} max={20} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">{t("ratiosTitle")}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted">{t("ratioReserve")}</span><span className="font-mono font-semibold">{(RESERVE_PCT[category] * 100).toFixed(1)} {t("ratioReserveSuffix")}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t("ratioSoft")}</span><span className="font-mono font-semibold">{(SOFT_REFRESH_PCT[category] * 100).toFixed(1)} %</span></div>
                <div className="flex justify-between"><span className="text-muted">{t("ratioHard")}</span><span className="font-mono font-semibold">{(HARD_REFRESH_PCT[category] * 100).toFixed(1)} %</span></div>
                <div className="flex justify-between"><span className="text-muted">{t("ratioMajor")}</span><span className="font-mono font-semibold">{(MAJOR_RENOVATION_PCT[category] * 100).toFixed(1)} %</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
              <div className="text-xs text-white/60">{t("totalTitle", { n: horizonAns })}</div>
              <div className="mt-2 text-4xl font-bold">{formatEUR(totalCapex)}</div>
              <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <div className="text-white/60">{t("avgAnnual")}</div>
                  <div className="font-semibold">{formatEUR(avgAnnualCapex)}</div>
                </div>
                <div>
                  <div className="text-white/60">{t("pctCa")}</div>
                  <div className={`font-semibold ${ratioSurCA > 10 ? "text-amber-300" : "text-emerald-300"}`}>
                    {ratioSurCA.toFixed(1)} %
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">{t("breakdownTitle")}</h3>
              <div className="space-y-2">
                {(Object.entries(totalByType) as [CapexItem["type"], number][]).map(([type, amt]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[type]}`}>
                      {TYPE_LABELS[type]}
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-background border border-card-border/40 overflow-hidden">
                      <div className="h-full bg-navy/60" style={{ width: `${(amt / totalCapex) * 100}%` }} />
                    </div>
                    <span className="w-24 shrink-0 text-right font-mono font-semibold text-xs">
                      {formatEUR(amt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">{t("forecastTitle")}</h3>
              <div className="space-y-1">
                {byYear.map(([year, amount]) => (
                  <div key={year} className="flex items-center gap-2 text-xs">
                    <div className="w-12 shrink-0 font-mono text-muted">{year}</div>
                    <div className="flex-1 h-5 rounded bg-background border border-card-border/40 overflow-hidden">
                      <div
                        className={`h-full ${amount > maxYearly * 0.7 ? "bg-rose-500" : amount > maxYearly * 0.4 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${(amount / maxYearly) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right font-mono font-semibold">{formatEUR(amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <AiAnalysisCard
              context={[
                `Plan CAPEX hôtel ${category} sur ${horizonAns} ans`,
                `CA annuel : ${formatEUR(revenueAnnuel)}`,
                `Âge hôtel : ${ageHotel} ans`,
                `CAPEX total ${horizonAns} ans : ${formatEUR(totalCapex)}`,
                `Moyenne annuelle : ${formatEUR(avgAnnualCapex)} (${ratioSurCA.toFixed(1)} % CA)`,
                `Prochains pics :`,
                ...byYear.slice(0, 5).map(([y, a]) => `  ${y} : ${formatEUR(a)}`),
              ].join("\n")}
              prompt="Analyse ce plan CAPEX hôtelier au Luxembourg. Livre : (1) cohérence des ratios appliqués vs benchmark HVS/PwC 2024 (budget 3-4% réserve, luxury 5-6%), (2) opportunités d'optimisation (étalement des soft/hard refresh pour lisser trésorerie, partenariat franchise pour mutualiser achats FF&E, subventions LU pour CAPEX énergétique via Klimabonus tertiaire ~20-40%), (3) impact sur DSCR bancaire si CAPEX non provisionné dans le compte d'exploitation, (4) seuil d'alerte : > 12% CA annuel = obsolescence + risque FF&E lag vs concurrence. Recommandations chiffrées."
            />

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <strong>{t("hvsStrong")}</strong> {t("hvsBody")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
