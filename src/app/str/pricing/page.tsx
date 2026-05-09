"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";

type ZoneKey = "luxembourg_ville" | "kirchberg" | "esch" | "nord_tourisme" | "mondorf";

// Saisonnalité LU par mois (coefficient ADR)
const LU_SEASONALITY: Record<ZoneKey, number[]> = {
  luxembourg_ville: [0.85, 0.92, 1.00, 1.05, 1.10, 1.12, 0.95, 0.80, 1.15, 1.08, 0.98, 0.92],
  kirchberg:        [0.90, 1.00, 1.05, 1.10, 1.12, 1.10, 0.85, 0.70, 1.15, 1.10, 1.00, 0.88],
  esch:             [0.85, 0.90, 0.95, 1.00, 1.05, 1.05, 0.90, 0.80, 1.05, 1.00, 0.95, 0.88],
  nord_tourisme:    [0.75, 0.80, 0.90, 1.00, 1.15, 1.25, 1.35, 1.40, 1.10, 0.95, 0.80, 0.85],
  mondorf:          [0.80, 0.85, 0.95, 1.05, 1.15, 1.25, 1.30, 1.30, 1.10, 1.00, 0.85, 0.85],
};

const EVENTS_LU: { month: number; nameKey: string; name: string; adrBoost: number }[] = [
  { month: 5, nameKey: "marathon", name: "ING Night Marathon", adrBoost: 1.30 },
  { month: 5, nameKey: "artbasel", name: "ArtBasel (avril-mai)", adrBoost: 1.15 },
  { month: 6, nameKey: "feteNationale", name: "Fête nationale 23 juin", adrBoost: 1.25 },
  { month: 8, nameKey: "schueberfouer", name: "Schueberfouer", adrBoost: 1.40 },
  { month: 11, nameKey: "marcheNoel", name: "Marché de Noël", adrBoost: 1.20 },
  { month: 12, nameKey: "nouvelAn", name: "Nouvel An", adrBoost: 1.35 },
];

export default function StrPricingPage() {
  const t = useTranslations("strPricing");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const MONTH_NAMES = useMemo(() => [
    t("months.jan"), t("months.feb"), t("months.mar"), t("months.apr"),
    t("months.may"), t("months.jun"), t("months.jul"), t("months.aug"),
    t("months.sep"), t("months.oct"), t("months.nov"), t("months.dec"),
  ], [t]);

  const [zone, setZone] = useState<ZoneKey>("luxembourg_ville");
  const [baseAdr, setBaseAdr] = useState(120);
  const [minAdr, setMinAdr] = useState(75);
  const [maxAdr, setMaxAdr] = useState(280);
  const [weekendBoost, setWeekendBoost] = useState(1.15);
  const [lastMinuteDays, setLastMinuteDays] = useState(7);
  const [lastMinuteDiscount, setLastMinuteDiscount] = useState(0.15);

  const monthlyRates = useMemo(() => {
    const seas = LU_SEASONALITY[zone];
    return MONTH_NAMES.map((m, i) => {
      const rate = Math.round(baseAdr * seas[i]);
      const event = EVENTS_LU.find((e) => e.month === i + 1);
      const eventRate = event ? Math.round(rate * event.adrBoost) : null;
      return {
        month: m,
        seasonFactor: seas[i],
        baseRate: Math.min(maxAdr, Math.max(minAdr, rate)),
        weekendRate: Math.min(maxAdr, Math.round(rate * weekendBoost)),
        eventName: event ? t(`events.${event.nameKey}`) : undefined,
        eventRate: eventRate ? Math.min(maxAdr, eventRate) : null,
      };
    });
  }, [zone, baseAdr, minAdr, maxAdr, weekendBoost, MONTH_NAMES, t]);

  const lastMinuteExample = Math.round(baseAdr * (1 - lastMinuteDiscount));
  const averageYearly = Math.round(monthlyRates.reduce((s, m) => s + m.baseRate, 0) / 12);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/str`} className="text-xs text-muted hover:text-navy">&larr; {t("back")}</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("params")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("fields.zone")}
                  type="select"
                  value={zone}
                  onChange={(v) => setZone(v as ZoneKey)}
                  options={[
                    { value: "luxembourg_ville", label: t("zones.luxembourg_ville") },
                    { value: "kirchberg", label: t("zones.kirchberg") },
                    { value: "esch", label: t("zones.esch") },
                    { value: "nord_tourisme", label: t("zones.nord_tourisme") },
                    { value: "mondorf", label: t("zones.mondorf") },
                  ]}
                />
                <InputField label={t("fields.baseAdr")} value={baseAdr} onChange={(v) => setBaseAdr(Number(v))} suffix="€" hint={t("hints.baseAdr")} />
                <InputField label={t("fields.minAdr")} value={minAdr} onChange={(v) => setMinAdr(Number(v))} suffix="€" hint={t("hints.minAdr")} />
                <InputField label={t("fields.maxAdr")} value={maxAdr} onChange={(v) => setMaxAdr(Number(v))} suffix="€" hint={t("hints.maxAdr")} />
                <InputField label={t("fields.weekendBoost")} value={Math.round((weekendBoost - 1) * 100)} onChange={(v) => setWeekendBoost(1 + Number(v) / 100)} suffix="%" hint={t("hints.weekendBoost")} />
                <InputField label={t("fields.lastMinuteDays")} value={lastMinuteDays} onChange={(v) => setLastMinuteDays(Number(v))} suffix={t("fields.daysSuffix")} />
                <InputField label={t("fields.lastMinuteDiscount")} value={Math.round(lastMinuteDiscount * 100)} onChange={(v) => setLastMinuteDiscount(Number(v) / 100)} suffix="%" hint={t("hints.lastMinuteDiscount")} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-rose-700 to-orange-600 p-6 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/60">{t("recommended.label")}</div>
              <div className="mt-2 text-4xl font-bold">{averageYearly} €</div>
              <div className="mt-1 text-sm text-white/70">
                {t("recommended.weekends")} {Math.round(averageYearly * weekendBoost)} € · {t("recommended.lastMinute")} {lastMinuteExample} €
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-card-border bg-background">
                <h3 className="text-base font-semibold text-navy">{t("table.title")}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-xs text-muted">
                    <th className="px-4 py-2 font-medium">{t("table.month")}</th>
                    <th className="px-4 py-2 font-medium text-right">{t("table.coef")}</th>
                    <th className="px-4 py-2 font-medium text-right">{t("table.week")}</th>
                    <th className="px-4 py-2 font-medium text-right">{t("table.weekend")}</th>
                    <th className="px-4 py-2 font-medium text-right">{t("table.event")}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRates.map((r) => (
                    <tr key={r.month} className="border-b border-card-border/50">
                      <td className="px-4 py-2 font-medium text-navy">{r.month}</td>
                      <td className="px-4 py-2 text-right text-xs text-muted">×{r.seasonFactor.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(r.baseRate)}</td>
                      <td className="px-4 py-2 text-right font-mono text-rose-700">{formatEUR(r.weekendRate)}</td>
                      <td className="px-4 py-2 text-right">
                        {r.eventName && r.eventRate ? (
                          <div className="text-xs">
                            <div className="font-mono font-bold text-amber-700">{formatEUR(r.eventRate)}</div>
                            <div className="text-muted">{r.eventName}</div>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AiAnalysisCard
              context={[
                `Dynamic pricing STR Luxembourg — ${zone}`,
                `ADR base: ${baseAdr}€, range ${minAdr}-${maxAdr}€`,
                `ADR moyen annuel: ${averageYearly}€`,
                `Saisonnalité: pics ${monthlyRates.filter((r) => r.seasonFactor >= 1.15).map((r) => r.month).join(", ")}; creux ${monthlyRates.filter((r) => r.seasonFactor < 0.9).map((r) => r.month).join(", ")}`,
                `Événements: ${EVENTS_LU.map((e) => `${e.name} (+${((e.adrBoost - 1) * 100).toFixed(0)}%)`).join(" / ")}`,
                `Boost weekend: +${((weekendBoost - 1) * 100).toFixed(0)}%`,
                `Last-minute: -${(lastMinuteDiscount * 100).toFixed(0)}% si < ${lastMinuteDays}j`,
              ].join("\n")}
              prompt="Analyse cette stratégie dynamic pricing STR Luxembourg. Livre : (1) réalisme des coefficients saisonniers par zone vs données AirDNA/Airbnb LU, (2) événements manquants à intégrer, (3) stratégie occupation vs ADR, (4) pricing rules complémentaires, (5) benchmark outil. Concret et actionnable pour un hôte LU."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
