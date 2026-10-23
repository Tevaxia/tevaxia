"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";
import { calculerArbitrageSTR, STR_DEFAULT_COSTS, type StrRentabiliteInputs } from "@/lib/str-calc";

export default function StrArbitrage() {
  const t = useTranslations("strArbitrage");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [commune, setCommune] = useState("Luxembourg");
  const [acquisitionPrice, setAcquisitionPrice] = useState(450000);
  const [adr, setAdr] = useState(120);
  const [occupancyPct, setOccupancyPct] = useState(60);
  const [cleaningPerStay, setCleaningPerStay] = useState(STR_DEFAULT_COSTS.cleaningPerStay);
  const [fixedCostsAnnual, setFixedCostsAnnual] = useState(3500);
  const [ltMonthlyRent, setLtMonthlyRent] = useState(2400);
  const [ltDeductibleAnnual, setLtDeductibleAnnual] = useState(3500);
  const [mixedStrDays, setMixedStrDays] = useState(85);
  const [mixedLtMonths, setMixedLtMonths] = useState(9);
  const [marginalTaxRate, setMarginalTaxRate] = useState(0.30);

  const TAX_BRACKETS = [
    { value: "0.11", label: "~11%" },
    { value: "0.22", label: "~22%" },
    { value: "0.3", label: "~30%" },
    { value: "0.39", label: "~39%" },
    { value: "0.4578", label: t("tax.max") },
  ];

  const strInputs = useMemo<StrRentabiliteInputs>(() => ({
    commune, surface: 60, capacity: 4, adr, occupancyPct,
    nightsPerYear: Math.round(365 * occupancyPct / 100),
    otaChannel: "airbnb",
    variable: { cleaningPerStay, linenPerStay: STR_DEFAULT_COSTS.linenPerStay, consumablesPerStay: STR_DEFAULT_COSTS.consumablesPerStay, avgStayLengthDays: STR_DEFAULT_COSTS.avgStayLengthDays },
    fixed: { pnoInsuranceAnnual: 0, internetTvAnnual: 0, utilitiesAnnual: 0, furnitureAmortAnnual: 0, subscriptionFees: fixedCostsAnnual },
    acquisitionPrice,
    userMarginalTaxRate: marginalTaxRate,
    vacancyDaysBetween: 1,
  }), [commune, adr, occupancyPct, cleaningPerStay, fixedCostsAnnual, acquisitionPrice, marginalTaxRate]);

  const arbitrage = useMemo(() => calculerArbitrageSTR({
    strInputs,
    ltMonthlyRent,
    ltMarginalTaxRate: marginalTaxRate,
    ltDeductibleChargesAnnual: ltDeductibleAnnual,
    mixedStrDays,
    mixedLtMonths,
  }), [strInputs, ltMonthlyRent, marginalTaxRate, ltDeductibleAnnual, mixedStrDays, mixedLtMonths]);

  const scenarios = [
    { key: "lt", label: t("scenarios.lt"), net: arbitrage.scenarioLT.netAnnual, color: "indigo" as const },
    { key: "str", label: t("scenarios.str"), net: arbitrage.scenarioSTR.netAnnual, color: "rose" as const },
    { key: "mixed", label: t("scenarios.mixed"), net: arbitrage.scenarioMixed.totalNet, color: "emerald" as const },
  ];

  const best = scenarios.reduce((a, b) => a.net > b.net ? a : b);

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
              <h2 className="mb-4 text-base font-semibold text-navy">{t("property.title")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("property.commune")} type="text" value={commune} onChange={(v) => setCommune(String(v))} />
                <InputField label={t("property.acqPrice")} value={acquisitionPrice} onChange={(v) => setAcquisitionPrice(Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0)))} suffix="€" />
                <InputField label={t("property.marginalRate")} type="select" value={String(marginalTaxRate)} onChange={(v) => setMarginalTaxRate(Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0)))} options={TAX_BRACKETS} />
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-rose-900">{t("strPure.title")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("strPure.adr")} value={adr} onChange={(v) => setAdr(Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0)))} suffix="€" />
                <InputField label={t("strPure.occupancy")} value={occupancyPct} onChange={(v) => setOccupancyPct(Math.min(100, Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0))))} suffix="%" />
                <InputField label={t("strPure.cleaning")} value={cleaningPerStay} onChange={(v) => setCleaningPerStay(Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0)))} suffix="€" />
                <InputField label={t("strPure.fixedCosts")} value={fixedCostsAnnual} onChange={(v) => setFixedCostsAnnual(Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0)))} suffix="€" hint={t("strPure.fixedCostsHint")} />
              </div>
              <p className="mt-3 text-xs text-rose-800">{t("strPure.note")}</p>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-indigo-900">{t("lt.title")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("lt.monthlyRent")} value={ltMonthlyRent} onChange={(v) => setLtMonthlyRent(Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0)))} suffix="€" hint={t("lt.monthlyRentHint")} />
                <InputField label={t("lt.deductible")} value={ltDeductibleAnnual} onChange={(v) => setLtDeductibleAnnual(Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0)))} suffix="€" hint={t("lt.deductibleHint")} />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-emerald-900">{t("mixed.title")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("mixed.strDays")}
                  value={mixedStrDays}
                  onChange={(v) => setMixedStrDays(Math.min(Math.floor(365 - mixedLtMonths * 365 / 12), Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0))))}
                  suffix={t("mixed.daysSuffix")}
                  max={Math.floor(365 - mixedLtMonths * 365 / 12)}
                  hint={t("mixed.strDaysHint")}
                />
                <InputField
                  label={t("mixed.ltMonths")}
                  value={mixedLtMonths}
                  onChange={(v) => setMixedLtMonths(Math.min(Math.floor((365 - mixedStrDays) * 12 / 365), Math.max(0, (Number.isFinite(Number(v)) ? Number(v) : 0))))}
                  suffix={t("mixed.monthsSuffix")}
                  max={Math.floor((365 - mixedStrDays) * 12 / 365)}
                  hint={t("mixed.ltMonthsHint")}
                />
              </div>
              <p className="mt-3 text-xs text-emerald-800">{t("mixed.note")}</p>
              <p className="mt-2 text-xs text-emerald-800">{t("mixed.effectiveNights", { n: arbitrage.scenarioMixed.effectiveStrNights })}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/60">{t("result.bestLabel")}</div>
              <div className="mt-2 text-3xl font-bold">
                {scenarios.find((s) => s.key === arbitrage.recommendation)?.label}
              </div>
              <div className="mt-1 text-2xl font-mono">{formatEUR(best.net)}/an</div>
              <div className="mt-3 text-sm text-white/70">
                {t("result.delta")} : <strong>{formatEUR(arbitrage.deltaBestVsWorst)}/an</strong>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-4">{t("result.comparison")}</h3>
              <div className="space-y-3">
                {scenarios.map((s) => {
                  const isBest = s.key === arbitrage.recommendation;
                  const maxNet = Math.max(...scenarios.map((x) => x.net));
                  const widthPct = maxNet > 0 ? (s.net / maxNet) * 100 : 0;
                  const barColor = s.color === "rose" ? "bg-rose-500"
                    : s.color === "indigo" ? "bg-indigo-500"
                    : "bg-emerald-500";
                  return (
                    <div key={s.key} className={`rounded-lg p-3 ${isBest ? "bg-navy/5 ring-2 ring-navy/20" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isBest ? "text-navy font-bold" : "text-slate"}`}>
                          {s.label} {isBest && <span className="ml-1 text-xs">★</span>}
                        </span>
                        <span className="font-mono font-bold text-navy">{formatEUR(s.net)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.max(widthPct, 4)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">{t("detail.lt")}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">{t("detail.annualGross")}</span><span className="font-mono">{formatEUR(arbitrage.scenarioLT.grossAnnual)}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t("lt.deductible")}</span><span className="font-mono">- {formatEUR(arbitrage.scenarioLT.charges)}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t("detail.taxEstimated")}</span><span className="font-mono text-rose-700">- {formatEUR(arbitrage.scenarioLT.tax)}</span></div>
                <div className="flex justify-between font-semibold pt-1 border-t border-card-border"><span>{t("detail.annualNet")}</span><span className="font-mono text-indigo-700">{formatEUR(arbitrage.scenarioLT.netAnnual)}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">{t("detail.mixed")}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">{t("detail.strDays", { n: mixedStrDays })}</span><span className="font-mono text-rose-700">{formatEUR(arbitrage.scenarioMixed.strNet)}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t("detail.ltMonths", { n: mixedLtMonths })}</span><span className="font-mono text-indigo-700">{formatEUR(arbitrage.scenarioMixed.ltNet)}</span></div>
                <div className="flex justify-between font-semibold pt-1 border-t border-card-border"><span>{t("detail.totalMixed")}</span><span className="font-mono text-emerald-700">{formatEUR(arbitrage.scenarioMixed.totalNet)}</span></div>
              </div>
            </div>

            <AiAnalysisCard
              context={[
                `Arbitrage LT vs STR vs Mixte au Luxembourg`,
                `Bien: ${commune}, ${formatEUR(acquisitionPrice)} acquisition`,
                `Taux marginal IR: ${(marginalTaxRate * 100).toFixed(0)}%`,
                ``,
                `Scénario STR pur: ${formatEUR(arbitrage.scenarioSTR.netAnnual)}/an (ADR ${adr}€, occupation ${occupancyPct}%)`,
                `Scénario LT: ${formatEUR(arbitrage.scenarioLT.netAnnual)}/an (loyer ${formatEUR(ltMonthlyRent)}/mois)`,
                `Scénario mixte: ${formatEUR(arbitrage.scenarioMixed.totalNet)}/an (${mixedStrDays}j STR + ${mixedLtMonths} mois LT)`,
                ``,
                `Recommandation mécanique: ${arbitrage.recommendation.toUpperCase()}`,
              ].join("\n")}
              prompt="Analyse cet arbitrage 3 scénarios LT/STR/Mixte. Facteurs non chiffrés, risques réglementaires 90j, profils gagnants, recommandation finale."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
