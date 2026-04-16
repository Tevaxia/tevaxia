"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR, formatPct } from "@/lib/calculations";

interface MotelInputs {
  category: "aparthotel" | "motel" | "residence_hoteliere";
  nbUnits: number;
  avgUnitSize: number; // m² par unité
  adr: number;
  avgStayNights: number; // durée moyenne séjour (plus long que hôtel classique)
  occupancy: number;
  staffRatio: number; // 0-1 — plus faible qu'hôtel classique (self-service)
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
  const revenueOther = Math.round(revenueRooms * 0.04); // parking, vending, laundry
  const revenueTotal = revenueRooms + revenueBreakfast + revenueOther;

  const staff = Math.round(revenueTotal * i.staffRatio);
  const opex = Math.round(revenueTotal * i.opexRatio);
  const ffe = Math.round(revenueTotal * 0.03); // FF&E reserve plus faible (durée vie mobilier supérieure en aparthotel)
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

const CATEGORY_LABELS: { value: MotelInputs["category"]; label: string; desc: string }[] = [
  { value: "aparthotel", label: "Aparthotel / appart-hôtel", desc: "Séjour 3-14 jours, kitchenette, business traveler" },
  { value: "motel", label: "Motel / budget stay", desc: "Séjour 1-3 jours, autoroute, voyageurs transit" },
  { value: "residence_hoteliere", label: "Résidence hôtelière / extended stay", desc: "Séjour 1-12 semaines, expats, corporate" },
];

export default function MotelAparthotelPage() {
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
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">&larr; Hôtellerie</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Aparthotel / Motel / Résidence hôtelière</h1>
          <p className="mt-2 text-muted">
            Valorisation dédiée aux séjours prolongés et hôtellerie budget. Ratios USALI adaptés (staff réduit pour self-service,
            mobilier durable, petit-déj optionnel, kitchenette), capitalisation EBITDA avec cap rate selon catégorie.
          </p>
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
              <h2 className="mb-4 text-base font-semibold text-navy">Configuration</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Nombre d'unités" value={nbUnits} onChange={(v) => setNbUnits(Number(v))} />
                <InputField label="Surface moyenne par unité" value={avgUnitSize} onChange={(v) => setAvgUnitSize(Number(v))} suffix="m²" />
                <InputField label="ADR (€/nuit)" value={adr} onChange={(v) => setAdr(Number(v))} suffix="€" />
                <InputField label="Durée moyenne séjour" value={avgStayNights} onChange={(v) => setAvgStayNights(Number(v))} suffix="nuits" hint="Aparthotel ~7, Motel ~1.5, Résidence ~14" />
                <InputField label="Occupation annuelle" value={Math.round(occupancy * 100)} onChange={(v) => setOccupancy(Number(v) / 100)} suffix="%" />
                <InputField label="Staff ratio" value={(staffRatio * 100).toFixed(1)} onChange={(v) => setStaffRatio(Number(v) / 100)} suffix="% revenu" hint="Self-service = moins que hôtel (35-40%)" />
                <InputField label="Opex ratio" value={(opexRatio * 100).toFixed(1)} onChange={(v) => setOpexRatio(Number(v) / 100)} suffix="% revenu" />
                <InputField label="Cap rate sortie" value={(capRate * 100).toFixed(2)} onChange={(v) => setCapRate(Number(v) / 100)} suffix="%" hint="Motel ~7.5%, Aparthotel ~6.5%, Résidence ~6%" />
              </div>
              <div className="mt-3 space-y-1">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasKitchenette} onChange={(e) => setHasKitchenette(e.target.checked)} /> Kitchenette en unité</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasBreakfast} onChange={(e) => setHasBreakfast(e.target.checked)} /> Petit-déjeuner inclus (+8% revenu)</label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-amber-700 to-orange-600 p-8 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/60">Valorisation DCF</div>
              <div className="mt-2 text-4xl font-bold">{formatEUR(result.valeurDCF)}</div>
              <div className="mt-1 text-sm text-white/70">
                Soit {formatEUR(result.valeurParUnit)} par unité · EBITDA {formatEUR(result.ebitda)} ({formatPct(result.ebitdaMargin)})
              </div>
            </div>

            <ResultPanel
              title="P&L exploitation annuel"
              lines={[
                { label: "Revenu chambres", value: formatEUR(result.revenueRooms) },
                { label: "Revenu petit-déjeuner", value: formatEUR(result.revenueBreakfast), sub: true },
                { label: "Autres revenus (parking/vending)", value: formatEUR(result.revenueOther), sub: true },
                { label: "Revenu total", value: formatEUR(result.revenueTotal), highlight: true },
                { label: `Staff (${(staffRatio * 100).toFixed(1)}%)`, value: `- ${formatEUR(result.staff)}`, sub: true },
                { label: `Opex (${(opexRatio * 100).toFixed(1)}%)`, value: `- ${formatEUR(result.opex)}`, sub: true },
                { label: "GOP", value: `${formatEUR(result.gop)} (${formatPct(result.gopMargin)})`, highlight: true },
                { label: "FF&E reserve 3%", value: `- ${formatEUR(result.ffe)}`, sub: true },
                { label: "EBITDA", value: `${formatEUR(result.ebitda)} (${formatPct(result.ebitdaMargin)})`, highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Métriques exploitation"
              lines={[
                { label: "Nuits louées/unité/an", value: `${result.nightsPerUnit} sur 365` },
                { label: "RevPAR par unité", value: `${result.revPARnoCapacity.toFixed(0)} €` },
                { label: "ADR effectif", value: `${adr} €` },
                { label: "Séjours moyens/unité/an", value: `${Math.round(result.nightsPerUnit / avgStayNights)}` },
                { label: "Surface totale", value: `${nbUnits * avgUnitSize} m²` },
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
