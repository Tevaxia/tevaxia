"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import ShareLinkButton from "@/components/ShareLinkButton";
import SEOContent from "@/components/SEOContent";
import { computeHotelValuation, getDefaultsForCategory } from "@/lib/hotellerie/valuation";
import type { HotelCategory } from "@/lib/hotellerie/types";

const CATEGORIES: { value: HotelCategory; label: string }[] = [
  { value: "budget", label: "Budget (1-2★)" },
  { value: "midscale", label: "Midscale (3★)" },
  { value: "upscale", label: "Upscale (4★)" },
  { value: "luxury", label: "Luxury (5★)" },
];

function formatEUR(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number, digits = 1): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return `${(n * 100).toFixed(digits)} %`;
}

export default function ValorisationHotelPage() {
  const locale = useLocale();
  const t = useTranslations("hotellerieToolPages");
  const tc = useTranslations("hotellerieCalc");
  const tcv = useTranslations("hotellerieCalc.valorisation");
  const tl = useTranslations("hotellerieCalc.valorisation.labels");
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [nbChambres, setNbChambres] = useState(45);
  const [adr, setAdr] = useState(120);
  const [occupancy, setOccupancy] = useState(0.65);
  const [category, setCategory] = useState<HotelCategory>("midscale");

  const [overrideRatios, setOverrideRatios] = useState(false);
  const defaults = getDefaultsForCategory(category);
  const [staffRatio, setStaffRatio] = useState(defaults.staffRatio);
  const [energyRatio, setEnergyRatio] = useState(defaults.energyRatio);
  const [otherOpexRatio, setOtherOpexRatio] = useState(defaults.otherOpexRatio);
  const [capRate, setCapRate] = useState(defaults.capRate);
  const [pricePerKey, setPricePerKey] = useState(defaults.pricePerKey);

  const result = useMemo(() => {
    try {
      return computeHotelValuation({
        nbChambres,
        adr,
        occupancy,
        category,
        ...(overrideRatios && {
          staffRatio,
          energyRatio,
          otherOpexRatio,
          capRate,
          pricePerKeyOverride: pricePerKey,
        }),
      });
    } catch {
      return null;
    }
  }, [nbChambres, adr, occupancy, category, overrideRatios, staffRatio, energyRatio, otherOpexRatio, capRate, pricePerKey]);

  const onCategoryChange = (val: string) => {
    const cat = val as HotelCategory;
    setCategory(cat);
    if (!overrideRatios) {
      const d = getDefaultsForCategory(cat);
      setStaffRatio(d.staffRatio);
      setEnergyRatio(d.energyRatio);
      setOtherOpexRatio(d.otherOpexRatio);
      setCapRate(d.capRate);
      setPricePerKey(d.pricePerKey);
    }
  };

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`${lp}/hotellerie`}
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("backToHub")}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t("valorisationTitle")}</h1>
          <p className="mt-2 text-lg text-white/70">{t("valorisationSubtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">{tcv("hotelChars")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField
                  label={tl("nbChambres")}
                  value={nbChambres}
                  onChange={(v) => setNbChambres(Number(v) || 0)}
                  min={1}
                  max={1000}
                />
                <InputField
                  label={tl("categorie")}
                  type="select"
                  value={category}
                  onChange={onCategoryChange}
                  options={CATEGORIES}
                />
                <InputField
                  label={tl("adr")}
                  value={adr}
                  onChange={(v) => setAdr(Number(v) || 0)}
                  suffix="€/nuit"
                  hint="Average Daily Rate — prix moyen vendu par nuitée"
                  min={10}
                  max={2000}
                />
                <InputField
                  label={tl("occupancy")}
                  value={Math.round(occupancy * 100)}
                  onChange={(v) => setOccupancy(Math.max(1, Math.min(95, Number(v) || 0)) / 100)}
                  suffix="%"
                  hint="Nuitées vendues / nuitées disponibles"
                  min={1}
                  max={95}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-navy">{tcv("operationalAssumptions")}</h2>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={overrideRatios}
                    onChange={(e) => {
                      setOverrideRatios(e.target.checked);
                      if (!e.target.checked) {
                        const d = getDefaultsForCategory(category);
                        setStaffRatio(d.staffRatio);
                        setEnergyRatio(d.energyRatio);
                        setOtherOpexRatio(d.otherOpexRatio);
                        setCapRate(d.capRate);
                        setPricePerKey(d.pricePerKey);
                      }
                    }}
                    className="h-4 w-4 rounded border-input-border"
                  />
                  {tc("personalize")}
                </label>
              </div>
              <p className="mt-1 text-xs text-muted">{tcv("operationalAssumptionsHint")}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField
                  label={tl("staffRatio")}
                  value={(staffRatio * 100).toFixed(1)}
                  onChange={(v) => setStaffRatio(Math.max(0, Math.min(60, Number(v) || 0)) / 100)}
                  suffix="% revenu"
                  className={!overrideRatios ? "opacity-60" : ""}
                />
                <InputField
                  label={tl("opexRatio")}
                  value={(energyRatio * 100).toFixed(1)}
                  onChange={(v) => setEnergyRatio(Math.max(0, Math.min(20, Number(v) || 0)) / 100)}
                  suffix="% revenu"
                  className={!overrideRatios ? "opacity-60" : ""}
                />
                <InputField
                  label={tl("opexRatio")}
                  value={(otherOpexRatio * 100).toFixed(1)}
                  onChange={(v) => setOtherOpexRatio(Math.max(0, Math.min(40, Number(v) || 0)) / 100)}
                  suffix="% revenu"
                  className={!overrideRatios ? "opacity-60" : ""}
                />
                <InputField
                  label={tl("capRate")}
                  value={(capRate * 100).toFixed(2)}
                  onChange={(v) => setCapRate(Math.max(0.01, Math.min(0.20, (Number(v) || 0) / 100)))}
                  suffix="%"
                  className={!overrideRatios ? "opacity-60" : ""}
                />
                <InputField
                  label={tl("nbChambres")}
                  value={pricePerKey}
                  onChange={(v) => setPricePerKey(Math.max(10000, Number(v) || 0))}
                  suffix="€/chambre"
                  className={!overrideRatios ? "opacity-60" : ""}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white p-6">
                  <div className="text-sm uppercase tracking-wider text-purple-700 font-semibold">
                    {tcv("estimatedMarketValue")}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-navy sm:text-4xl">
                    {formatEUR(result.valeurCentrale)}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {tcv("range")} : <span className="font-medium text-navy">{formatEUR(result.fourchetteBasse)}</span>{" "}
                    – <span className="font-medium text-navy">{formatEUR(result.fourchetteHaute)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                      DCF : {formatEUR(result.valeurDCF)}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      Multiple : {formatEUR(result.valeurMultipleParChambre)}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                      x{result.multipleEbitda.toFixed(1)} EBITDA
                    </span>
                  </div>
                </div>

                <ResultPanel
                  title={tcv("commercialPerf")}
                  lines={[
                    { label: "RevPAR", value: `${result.revPAR.toFixed(0)} €/nuit/chambre`, highlight: true },
                    { label: "Revenu chambres annuel", value: formatEUR(result.revenuRoomsAnnuel) },
                    { label: "Revenu F&B annuel", value: formatEUR(result.breakdown.fb) },
                    { label: "Revenu autres (MICE, spa…)", value: formatEUR(result.breakdown.autres) },
                    { label: "Revenu total annuel", value: formatEUR(result.revenuTotalAnnuel), highlight: true, large: true },
                  ]}
                />

                <ResultPanel
                  title={tcv("operatingPL")}
                  lines={[
                    { label: "Charges personnel", value: formatEUR(result.charges.staff) },
                    { label: "Charges énergie", value: formatEUR(result.charges.energy) },
                    { label: "Autres opex", value: formatEUR(result.charges.other) },
                    { label: "Total charges opérationnelles", value: formatEUR(result.charges.total), sub: true },
                    { label: "GOP (Gross Operating Profit)", value: `${formatEUR(result.gop)} (${formatPct(result.gopMargin)})`, highlight: true },
                    { label: "Réserve FF&E (4 %)", value: formatEUR(result.ffe), sub: true },
                    { label: "EBITDA stabilisé", value: `${formatEUR(result.ebitda)} (${formatPct(result.ebitdaMargin)})`, highlight: true, large: true, warning: result.ebitda < 0 },
                  ]}
                />

                <ResultPanel
                  title={tcv("methodology")}
                  lines={[
                    { label: "Catégorie", value: CATEGORIES.find((c) => c.value === category)?.label ?? category },
                    { label: "Cap rate appliqué", value: formatPct(result.capRateUsed, 2) },
                    { label: "Prix/chambre comparables", value: formatEUR(result.pricePerKeyUsed) },
                    { label: "Valeur DCF (EBITDA / cap rate)", value: formatEUR(result.valeurDCF), sub: true },
                    { label: "Valeur multiple (chambres × prix/clé)", value: formatEUR(result.valeurMultipleParChambre), sub: true },
                  ]}
                />

                <ShareLinkButton
                  toolType="hotel-valorisation"
                  defaultTitle={`Valorisation hôtel — ${nbChambres} chambres ${category}`}
                  payload={{
                    inputs: { nbChambres, adr, occupancy, category, overrideRatios, staffRatio, energyRatio, otherOpexRatio, capRate, pricePerKey },
                    results: result,
                  }}
                />
              </>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
                {tc("checkInputs")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
          <strong>{tc("methodLabel")} :</strong> {tcv("methodNote")}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-card-border bg-card p-5">
          <div>
            <div className="text-sm font-semibold text-navy">{tcv("nextStepTitle")}</div>
            <p className="mt-1 text-xs text-muted">{tcv("nextStepDesc")}</p>
          </div>
          <Link
            href={`${lp}/hotellerie/dscr`}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
          >
            {tcv("nextStepCta")}
          </Link>
        </div>
      </div>

      <SEOContent
        ns="hotellerieValorisation"
        sections={[
          { titleKey: "methodTitle", contentKey: "methodContent" },
          { titleKey: "ratiosTitle", contentKey: "ratiosContent" },
          { titleKey: "capRateTitle", contentKey: "capRateContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
        ]}
        relatedLinks={[
          { href: "/hotellerie", labelKey: "hotellerie" },
          { href: "/hotellerie/dscr", labelKey: "hotelDscr" },
        ]}
      />
    </div>
  );
}
