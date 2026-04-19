"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR, formatPct } from "@/lib/calculations";
import { calculerRentabiliteSTR, OTA_COMMISSION, STR_DEFAULT_COSTS, STR_MAX_MARGINAL_TAX_RATE } from "@/lib/str-calc";
import SaveButton from "@/components/SaveButton";
import { sauvegarderEvaluation } from "@/lib/storage";

export default function RentabiliteStr() {
  const t = useTranslations("strRentabilite");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [commune, setCommune] = useState("Luxembourg");
  const [surface, setSurface] = useState(60);
  const [capacity, setCapacity] = useState(4);
  const [adr, setAdr] = useState(120);
  const [occupancyPct, setOccupancyPct] = useState(60);
  const [otaChannel, setOtaChannel] = useState<"airbnb" | "booking" | "vrbo" | "direct">("airbnb");

  const [cleaningPerStay, setCleaningPerStay] = useState(STR_DEFAULT_COSTS.cleaningPerStay);
  const [avgStayLengthDays, setAvgStayLengthDays] = useState(STR_DEFAULT_COSTS.avgStayLengthDays);
  const [vacancyDaysBetween, setVacancyDaysBetween] = useState(1);
  const [pnoAnnual, setPnoAnnual] = useState(450);
  const [internetTv, setInternetTv] = useState(480);
  const [utilities, setUtilities] = useState(1800);
  const [furnitureAmort, setFurnitureAmort] = useState(800);
  const [subscriptions, setSubscriptions] = useState(0);

  const [marginalTaxRate, setMarginalTaxRate] = useState(0.30);
  const [acquisitionPrice, setAcquisitionPrice] = useState(450000);

  const nightsPerYear = useMemo(() => Math.round(365 * (occupancyPct / 100)), [occupancyPct]);

  const OTA_OPTIONS = [
    { value: "airbnb", label: `Airbnb (${(OTA_COMMISSION.airbnb * 100).toFixed(0)}% ${t("form.commission")})` },
    { value: "booking", label: `Booking.com (${(OTA_COMMISSION.booking * 100).toFixed(0)}%)` },
    { value: "vrbo", label: `Vrbo (${(OTA_COMMISSION.vrbo * 100).toFixed(0)}%)` },
    { value: "direct", label: t("form.direct") },
  ];

  const TAX_BRACKETS = [
    { value: "0.11", label: t("tax.low") },
    { value: "0.22", label: t("tax.mid") },
    { value: "0.30", label: t("tax.avg") },
    { value: "0.39", label: t("tax.high") },
    { value: "0.4578", label: t("tax.max") },
  ];

  const result = useMemo(() => calculerRentabiliteSTR({
    commune, surface, capacity, adr, occupancyPct, nightsPerYear, otaChannel,
    variable: {
      cleaningPerStay,
      linenPerStay: STR_DEFAULT_COSTS.linenPerStay,
      consumablesPerStay: STR_DEFAULT_COSTS.consumablesPerStay,
      avgStayLengthDays,
    },
    fixed: {
      pnoInsuranceAnnual: pnoAnnual,
      internetTvAnnual: internetTv,
      utilitiesAnnual: utilities,
      furnitureAmortAnnual: furnitureAmort,
      subscriptionFees: subscriptions,
    },
    acquisitionPrice: acquisitionPrice > 0 ? acquisitionPrice : undefined,
    userMarginalTaxRate: marginalTaxRate,
    vacancyDaysBetween,
  }), [commune, surface, capacity, adr, occupancyPct, nightsPerYear, otaChannel, cleaningPerStay, avgStayLengthDays, pnoAnnual, internetTv, utilities, furnitureAmort, subscriptions, acquisitionPrice, marginalTaxRate, vacancyDaysBetween]);

  const ltAnnualGross = acquisitionPrice > 0 ? Math.round(acquisitionPrice * 0.05) : 0;
  const ltNetEstimate = Math.max(0, ltAnnualGross - 2000 - Math.round(ltAnnualGross * marginalTaxRate));
  const strVsLtDelta = result.netAfterTax - ltNetEstimate;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/str`} className="text-xs text-muted hover:text-navy">&larr; {t("back")}</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sections.property")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("form.commune")} type="text" value={commune} onChange={(v) => setCommune(String(v))} />
                <InputField label={t("form.surface")} value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label={t("form.capacity")} value={capacity} onChange={(v) => setCapacity(Number(v))} />
                <InputField label={t("form.acqPrice")} value={acquisitionPrice} onChange={(v) => setAcquisitionPrice(Number(v))} suffix="€" hint={t("form.acqPriceHint")} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sections.commercial")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("form.adr")} value={adr} onChange={(v) => setAdr(Number(v))} suffix="€" hint={t("form.adrHint")} />
                <InputField label={t("form.occupancy")} value={occupancyPct} onChange={(v) => setOccupancyPct(Number(v))} suffix="%" hint={t("form.occupancyHint", { n: nightsPerYear })} min={0} max={95} />
                <InputField label={t("form.channel")} type="select" value={otaChannel} onChange={(v) => setOtaChannel(v as "airbnb" | "booking" | "vrbo" | "direct")} options={OTA_OPTIONS} />
                <InputField label={t("form.stayLength")} value={avgStayLengthDays} onChange={(v) => setAvgStayLengthDays(Number(v))} suffix={t("form.nightsSuffix")} hint={t("form.stayLengthHint")} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sections.costs")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("form.cleaning")} value={cleaningPerStay} onChange={(v) => setCleaningPerStay(Number(v))} suffix="€" hint={t("form.cleaningHint")} />
                <InputField label={t("form.vacancy")} value={vacancyDaysBetween} onChange={(v) => setVacancyDaysBetween(Number(v))} suffix={t("form.daysSuffix")} />
                <InputField label={t("form.pno")} value={pnoAnnual} onChange={(v) => setPnoAnnual(Number(v))} suffix="€" hint={t("form.pnoHint")} />
                <InputField label={t("form.internetTv")} value={internetTv} onChange={(v) => setInternetTv(Number(v))} suffix="€" />
                <InputField label={t("form.utilities")} value={utilities} onChange={(v) => setUtilities(Number(v))} suffix="€" hint={t("form.utilitiesHint")} />
                <InputField label={t("form.furnitureAmort")} value={furnitureAmort} onChange={(v) => setFurnitureAmort(Number(v))} suffix="€/an" />
                <InputField label={t("form.subscriptions")} value={subscriptions} onChange={(v) => setSubscriptions(Number(v))} suffix="€/an" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sections.tax")}</h2>
              <InputField
                label={t("form.marginalRate")}
                type="select"
                value={String(marginalTaxRate)}
                onChange={(v) => setMarginalTaxRate(Number(v))}
                options={TAX_BRACKETS}
                hint={t("form.marginalRateHint")}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-2xl p-8 text-white text-center shadow-lg ${result.netAfterTax > 0 ? "bg-gradient-to-br from-rose-700 to-orange-600" : "bg-gradient-to-br from-slate-700 to-slate-600"}`}>
              <div className="text-sm text-white/70">{t("result.netLabel")}</div>
              <div className="mt-2 text-5xl font-bold">{formatEUR(result.netAfterTax)}</div>
              <div className="mt-2 text-sm text-white/70">
                {t("result.perMonth", { n: formatEUR(Math.round(result.netAfterTax / 12)) })}
              </div>
              {result.netYieldPct !== undefined && (
                <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {t("result.netYield")} : {result.netYieldPct.toFixed(2)}%
                </div>
              )}
            </div>

            <ResultPanel
              title={t("result.breakdown")}
              lines={[
                { label: t("result.grossRevenue"), value: formatEUR(result.grossRevenue), highlight: true },
                { label: `${t("result.otaCommission")} (${otaChannel})`, value: `- ${formatEUR(result.otaCommission)}`, sub: true },
                { label: t("result.afterOta"), value: formatEUR(result.revenueAfterOta) },
                { label: t("result.cleaningTotal", { n: result.numberOfStays }), value: `- ${formatEUR(result.cleaningTotal)}`, sub: true },
                { label: t("result.linenTotal"), value: `- ${formatEUR(result.linenTotal)}`, sub: true },
                { label: t("result.consumablesTotal"), value: `- ${formatEUR(result.consumablesTotal)}`, sub: true },
                { label: t("result.fixedTotal"), value: `- ${formatEUR(result.fixedTotal)}`, sub: true },
                { label: t("result.opCharges"), value: `- ${formatEUR(result.operatingCharges)}` },
                { label: t("result.netBeforeTax"), value: formatEUR(result.netBeforeTax), highlight: true },
                { label: t("result.taxEstimated", { pct: (marginalTaxRate * 100).toFixed(0) }), value: `- ${formatEUR(result.estimatedTax)}`, sub: true },
                { label: t("result.netAfterTax"), value: formatEUR(result.netAfterTax), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title={t("result.metrics")}
              lines={[
                { label: t("metrics.stays"), value: String(result.numberOfStays) },
                { label: t("metrics.nightsRented"), value: `${nightsPerYear} / 365` },
                { label: t("metrics.revpar"), value: `${result.revPAR.toFixed(0)} €` },
                { label: t("metrics.adrEffective"), value: `${result.adrEffective.toFixed(0)} €` },
                { label: t("metrics.costRatio"), value: formatPct(result.costRatioPct / 100), warning: result.costRatioPct > 50 },
                { label: t("metrics.grossYield"), value: result.grossYieldPct !== undefined ? `${result.grossYieldPct.toFixed(2)}%` : "—" },
                { label: t("metrics.netYield"), value: result.netYieldPct !== undefined ? `${result.netYieldPct.toFixed(2)}%` : "—" },
              ]}
            />

            {acquisitionPrice > 0 && (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-indigo-900">{t("ltCompare.title")}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white p-3 border border-indigo-100">
                    <div className="text-xs text-muted">{t("ltCompare.strNet")}</div>
                    <div className="text-lg font-bold text-rose-700">{formatEUR(result.netAfterTax)}</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-indigo-100">
                    <div className="text-xs text-muted">{t("ltCompare.ltNet")}</div>
                    <div className="text-lg font-bold text-indigo-700">{formatEUR(ltNetEstimate)}</div>
                  </div>
                </div>
                <div className="mt-3 text-center text-sm">
                  {t("ltCompare.delta")} :{" "}
                  <strong className={strVsLtDelta > 0 ? "text-emerald-700" : "text-rose-700"}>
                    {strVsLtDelta > 0 ? "+" : ""}{formatEUR(strVsLtDelta)}/an
                  </strong>
                  {" "}{strVsLtDelta > 0 ? t("ltCompare.favorStr") : t("ltCompare.favorLt")}
                </div>
                <p className="mt-2 text-xs text-indigo-800">
                  <strong>{t("ltCompare.warn")}</strong>{" "}
                  <Link href={`${lp}/str/compliance`} className="underline">{t("ltCompare.complianceLink")}</Link>.
                </p>
              </div>
            )}

            <AiAnalysisCard
              context={[
                `Simulation rentabilité Airbnb/Booking au Luxembourg`,
                `Bien: ${surface} m² à ${commune}, capacité ${capacity} voyageurs`,
                `Prix acquisition: ${acquisitionPrice > 0 ? formatEUR(acquisitionPrice) : "non renseigné"}`,
                `ADR cible: ${adr} €/nuit, occupation ${occupancyPct}% (${nightsPerYear} nuits/an)`,
                `Canal: ${otaChannel} (commission ${((OTA_COMMISSION[otaChannel] || 0) * 100).toFixed(0)}%)`,
                `Taux marginal IR: ${(marginalTaxRate * 100).toFixed(0)}%`,
                ``,
                `Revenu brut: ${formatEUR(result.grossRevenue)}`,
                `Net après impôt: ${formatEUR(result.netAfterTax)}`,
                `Yield net: ${result.netYieldPct !== undefined ? `${result.netYieldPct.toFixed(2)}%` : "—"}`,
                ``,
                `Comparaison LT règle 5%: ${formatEUR(ltNetEstimate)} net estimé → STR ${strVsLtDelta > 0 ? "+" : ""}${formatEUR(strVsLtDelta)}/an`,
              ].join("\n")}
              prompt="Analyse cette simulation STR au Luxembourg pour un hôte potentiel. Livre réalisme ADR/occupation, risque licence 90 jours, arbitrage LT/CT, optimisations fiscales, seuil rentabilité vs LT."
            />

            <div className="flex justify-end">
              <SaveButton
                onClick={() => sauvegarderEvaluation({
                  nom: `STR — ${commune} ${surface}m² — ${formatEUR(result.netAfterTax)}/an`,
                  type: "str-rentabilite",
                  commune,
                  valeurPrincipale: result.netAfterTax,
                  data: { commune, surface, capacity, adr, occupancyPct, otaChannel, acquisitionPrice, marginalTaxRate },
                })}
                label={t("save")}
                successLabel={t("saved")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
