"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR, formatPct } from "@/lib/calculations";

interface MotelInputs {
  category: "aparthotel" | "motel" | "residence_hoteliere";
  nbUnits: number;
  avgUnitSize: number;
  adr: number;
  avgStayNights: number;
  occupancy: number;
  staffRatio: number;
  opexRatio: number;
  capRate: number;
  hasKitchenette: boolean;
  hasBreakfast: boolean;
}

const CATEGORY_DEFAULTS: Record<MotelInputs["category"], Partial<MotelInputs>> = {
  aparthotel: { adr: 95, avgStayNights: 7, staffRatio: 0.18, opexRatio: 0.22, capRate: 0.065 },
  motel: { adr: 75, avgStayNights: 1.5, staffRatio: 0.15, opexRatio: 0.20, capRate: 0.075 },
  residence_hoteliere: { adr: 110, avgStayNights: 14, staffRatio: 0.14, opexRatio: 0.18, capRate: 0.060 },
};

function computeMotel(i: MotelInputs) {
  const nights = Math.round(365 * i.occupancy);
  const revenueRooms = i.nbUnits * nights * i.adr;
  const revenueBreakfast = i.hasBreakfast ? Math.round(revenueRooms * 0.08) : 0;
  const revenueOther = Math.round(revenueRooms * 0.04);
  const revenueTotal = revenueRooms + revenueBreakfast + revenueOther;

  const staff = Math.round(revenueTotal * i.staffRatio);
  const opex = Math.round(revenueTotal * i.opexRatio);
  const ffe = Math.round(revenueTotal * 0.03);
  const gop = revenueTotal - staff - opex;
  const gopMargin = revenueTotal > 0 ? gop / revenueTotal : 0;
  const ebitda = gop - ffe;
  const ebitdaMargin = revenueTotal > 0 ? ebitda / revenueTotal : 0;

  const valeurDCF = i.capRate > 0 ? Math.round(ebitda / i.capRate) : 0;
  const valeurParUnit = i.nbUnits > 0 ? Math.round(valeurDCF / i.nbUnits) : 0;

  const revPARnoCapacity = i.nbUnits > 0 ? revenueRooms / (i.nbUnits * 365) : 0;

  return {
    revenueRooms, revenueBreakfast, revenueOther, revenueTotal,
    staff, opex, ffe, gop, gopMargin, ebitda, ebitdaMargin,
    valeurDCF, valeurParUnit, revPARnoCapacity, nightsPerUnit: nights,
  };
}

export default function MotelAparthotelPage() {
  const t = useTranslations("hotelMotel");
  const [category, setCategory] = useState<MotelInputs["category"]>("aparthotel");
  const [nbUnits, setNbUnits] = useState(40);
  const [avgUnitSize, setAvgUnitSize] = useState(35);
  const [adr, setAdr] = useState(95);
  const [avgStayNights, setAvgStayNights] = useState(7);
  const [occupancy, setOccupancy] = useState(0.70);
  const [staffRatio, setStaffRatio] = useState(0.18);
  const [opexRatio, setOpexRatio] = useState(0.22);
  const [capRate, setCapRate] = useState(0.065);
  const [hasKitchenette, setHasKitchenette] = useState(true);
  const [hasBreakfast, setHasBreakfast] = useState(false);

  const CATEGORY_LABELS: { value: MotelInputs["category"]; label: string; desc: string }[] = [
    { value: "aparthotel", label: t("catAparthotelLabel"), desc: t("catAparthotelDesc") },
    { value: "motel", label: t("catMotelLabel"), desc: t("catMotelDesc") },
    { value: "residence_hoteliere", label: t("catResidenceLabel"), desc: t("catResidenceDesc") },
  ];

  const applyCategoryDefaults = (cat: MotelInputs["category"]) => {
    setCategory(cat);
    const d = CATEGORY_DEFAULTS[cat];
    if (d.adr !== undefined) setAdr(d.adr);
    if (d.avgStayNights !== undefined) setAvgStayNights(d.avgStayNights);
    if (d.staffRatio !== undefined) setStaffRatio(d.staffRatio);
    if (d.opexRatio !== undefined) setOpexRatio(d.opexRatio);
    if (d.capRate !== undefined) setCapRate(d.capRate);
    setHasKitchenette(cat !== "motel");
    setHasBreakfast(cat === "motel");
  };

  const result = useMemo(() => computeMotel({
    category, nbUnits, avgUnitSize, adr, avgStayNights, occupancy,
    staffRatio, opexRatio, capRate, hasKitchenette, hasBreakfast,
  }), [category, nbUnits, avgUnitSize, adr, avgStayNights, occupancy, staffRatio, opexRatio, capRate, hasKitchenette, hasBreakfast]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORY_LABELS.map((c) => (
            <button key={c.value} onClick={() => applyCategoryDefaults(c.value)}
              className={`rounded-lg border px-4 py-3 text-left ${category === c.value ? "border-navy bg-navy/5 ring-2 ring-navy/20" : "border-card-border bg-card hover:bg-slate-50"}`}>
              <div className={`text-sm font-semibold ${category === c.value ? "text-navy" : "text-foreground"}`}>{c.label}</div>
              <div className="text-xs text-muted mt-0.5">{c.desc}</div>
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("configTitle")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("inputNbUnits")} value={nbUnits} onChange={(v) => setNbUnits(Number(v))} />
                <InputField label={t("inputSize")} value={avgUnitSize} onChange={(v) => setAvgUnitSize(Number(v))} suffix="m²" />
                <InputField label={t("inputAdr")} value={adr} onChange={(v) => setAdr(Number(v))} suffix="€" />
                <InputField label={t("inputStay")} value={avgStayNights} onChange={(v) => setAvgStayNights(Number(v))} suffix={t("suffixNuits")} hint={t("inputStayHint")} />
                <InputField label={t("inputOccupancy")} value={Math.round(occupancy * 100)} onChange={(v) => setOccupancy(Number(v) / 100)} suffix="%" />
                <InputField label={t("inputStaffRatio")} value={(staffRatio * 100).toFixed(1)} onChange={(v) => setStaffRatio(Number(v) / 100)} suffix={t("suffixRevenue")} hint={t("inputStaffRatioHint")} />
                <InputField label={t("inputOpexRatio")} value={(opexRatio * 100).toFixed(1)} onChange={(v) => setOpexRatio(Number(v) / 100)} suffix={t("suffixRevenue")} />
                <InputField label={t("inputCapRate")} value={(capRate * 100).toFixed(2)} onChange={(v) => setCapRate(Number(v) / 100)} suffix="%" hint={t("inputCapRateHint")} />
              </div>
              <div className="mt-3 space-y-1">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasKitchenette} onChange={(e) => setHasKitchenette(e.target.checked)} /> {t("checkboxKitchenette")}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasBreakfast} onChange={(e) => setHasBreakfast(e.target.checked)} /> {t("checkboxBreakfast")}</label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-amber-700 to-orange-600 p-8 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/60">{t("dcfBadge")}</div>
              <div className="mt-2 text-4xl font-bold">{formatEUR(result.valeurDCF)}</div>
              <div className="mt-1 text-sm text-white/70">
                {t("dcfDetail", { value: formatEUR(result.valeurParUnit), ebitda: formatEUR(result.ebitda), margin: formatPct(result.ebitdaMargin) })}
              </div>
            </div>

            <ResultPanel
              title={t("panelPlTitle")}
              lines={[
                { label: t("panelRevRooms"), value: formatEUR(result.revenueRooms) },
                { label: t("panelRevBreakfast"), value: formatEUR(result.revenueBreakfast), sub: true },
                { label: t("panelRevOther"), value: formatEUR(result.revenueOther), sub: true },
                { label: t("panelRevTotal"), value: formatEUR(result.revenueTotal), highlight: true },
                { label: t("panelStaff", { pct: (staffRatio * 100).toFixed(1) }), value: `- ${formatEUR(result.staff)}`, sub: true },
                { label: t("panelOpex", { pct: (opexRatio * 100).toFixed(1) }), value: `- ${formatEUR(result.opex)}`, sub: true },
                { label: t("panelGop"), value: `${formatEUR(result.gop)} (${formatPct(result.gopMargin)})`, highlight: true },
                { label: t("panelFfe"), value: `- ${formatEUR(result.ffe)}`, sub: true },
                { label: t("panelEbitda"), value: `${formatEUR(result.ebitda)} (${formatPct(result.ebitdaMargin)})`, highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title={t("panelMetricsTitle")}
              lines={[
                { label: t("metricNights"), value: t("metricNightsValue", { n: result.nightsPerUnit }) },
                { label: t("metricRevpar"), value: `${result.revPARnoCapacity.toFixed(0)} €` },
                { label: t("metricAdrEff"), value: `${adr} €` },
                { label: t("metricSejours"), value: `${Math.round(result.nightsPerUnit / avgStayNights)}` },
                { label: t("metricSurface"), value: `${nbUnits * avgUnitSize} m²` },
              ]}
            />

            <AiAnalysisCard
              context={[
                `Valorisation aparthotel / motel / résidence hôtelière — Luxembourg`,
                `Catégorie: ${CATEGORY_LABELS.find((c) => c.value === category)?.label}`,
                `${nbUnits} unités × ${avgUnitSize} m² moyen, ADR ${adr}€, occupation ${(occupancy * 100).toFixed(0)}%`,
                `Durée moyenne séjour: ${avgStayNights} nuits`,
                `Kitchenette: ${hasKitchenette ? "oui" : "non"}, Petit-déjeuner: ${hasBreakfast ? "oui" : "non"}`,
                `Staff ratio: ${(staffRatio * 100).toFixed(1)}%, Opex: ${(opexRatio * 100).toFixed(1)}%, Cap rate: ${(capRate * 100).toFixed(2)}%`,
                "",
                `Revenu total annuel: ${formatEUR(result.revenueTotal)}`,
                `GOP: ${formatEUR(result.gop)} (${formatPct(result.gopMargin)})`,
                `EBITDA: ${formatEUR(result.ebitda)} (${formatPct(result.ebitdaMargin)})`,
                `Valeur DCF: ${formatEUR(result.valeurDCF)} (${formatEUR(result.valeurParUnit)}/unité)`,
              ].join("\n")}
              prompt="Analyse cette valorisation aparthotel/motel/résidence hôtelière au Luxembourg. Livre : (1) réalisme des ratios USALI adaptés long séjour (staff réduit 15-20% vs hôtel 35-40%, opex réduit, FF&E reserve 3% vs 5% hôtel), (2) positionnement catégorie et cap rate vs transactions comparables (aparthotel Europe ~6-7%, motel ~7-8.5%, résidence ~5.5-6.5%), (3) spécificités LU : demande expats (corporate 7-14 jours), saisonnalité moindre, clientèle frontaliers, régime TVA (petit-déj 17%, hébergement 3% si < 90 jours sinon TVA standard), (4) optimisations : mix clients (70% corporate 30% leisure idéal), F&B minimum viable (grab & go vs restaurant complet), pricing par durée de séjour (dégressif > 7 nuits), (5) comparaison vs location courte durée pure (Airbnb) qui est le concurrent direct. Références HVS, Horwath HTL, ULI Emerging Trends."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
