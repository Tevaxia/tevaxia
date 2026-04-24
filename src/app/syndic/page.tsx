"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import SEOContent from "@/components/SEOContent";
import { formatEUR } from "@/lib/calculations";
import { estimerCoutsRenovation, type RenovationEstimate } from "@/lib/renovation-costs";
import { getEnergyComparables, getAvailableCommunes, buildImpactRange } from "@/lib/energy-comparables";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

const ENERGY_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900",
  E: "bg-orange-400 text-white",
  F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white",
  H: "bg-red-700 text-white",
  I: "bg-red-900 text-white",
};

const HEATING_TYPES = [
  { value: "gaz", labelKey: "heatingGaz" },
  { value: "fioul", labelKey: "heatingFioul" },
  { value: "pac", labelKey: "heatingPac" },
  { value: "district", labelKey: "heatingDistrict" },
  { value: "electric", labelKey: "heatingElectric" },
];

type Tab = "config" | "lots" | "charges" | "energy" | "renovation";

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "config", labelKey: "tabConfig" },
  { key: "lots", labelKey: "tabLots" },
  { key: "charges", labelKey: "tabCharges" },
  { key: "energy", labelKey: "tabEnergy" },
  { key: "renovation", labelKey: "tabRenovation" },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BuildingConfig {
  name: string;
  address: string;
  commune: string;
  nbLots: number;
  surfaceTotale: number;
  anneeConstruction: number;
  classeEnergie: string;
  heatingType: string;
}

interface Lot {
  id: string;
  numero: string;
  surface: number;
  tantiemes: number;
  occupant: "proprietaire" | "locataire";
  loyerMensuel: number;
}

interface ChargesConfig {
  chauffage: number;
  eau: number;
  ascenseur: number;
  nettoyage: number;
  assurance: number;
  honorairesSyndic: number;
  fondsReserve: number;
}

/* ------------------------------------------------------------------ */
/*  EPBD deadlines                                                     */
/* ------------------------------------------------------------------ */

function getEpbdDeadline(classe: string): string {
  switch (classe) {
    case "I": return "2030";
    case "H": return "2030";
    case "G": return "2033";
    case "F": return "2033";
    case "E": return "2040";
    case "D": return "2045";
    default: return "Conforme";
  }
}

/* ------------------------------------------------------------------ */
/*  Klimabonus subsidy estimation                                      */
/* ------------------------------------------------------------------ */

function estimerKlimabonus(
  classeActuelle: string,
  classeCible: string,
  surface: number
): { eligible: boolean; montantEstime: number; tauxCouverture: number } {
  const indexActuel = ENERGY_CLASSES.indexOf(classeActuelle);
  const indexCible = ENERGY_CLASSES.indexOf(classeCible);
  if (indexCible < 0 || indexActuel < 0 || indexCible >= indexActuel) {
    return { eligible: false, montantEstime: 0, tauxCouverture: 0 };
  }
  const saut = indexActuel - indexCible;
  // Klimabonus: ~25-50 EUR/m2 for 1-2 class jumps, up to 80-120 EUR/m2 for deep renovation
  let tauxParM2: number;
  if (saut >= 5) tauxParM2 = 100;
  else if (saut >= 3) tauxParM2 = 70;
  else if (saut >= 2) tauxParM2 = 45;
  else tauxParM2 = 25;

  const montant = Math.round(tauxParM2 * surface);
  return { eligible: true, montantEstime: montant, tauxCouverture: saut >= 3 ? 0.35 : 0.25 };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_BUILDING: BuildingConfig = {
  name: "Résidence Les Tilleuls",
  address: "12, rue des Champs",
  commune: "Luxembourg",
  nbLots: 12,
  surfaceTotale: 960,
  anneeConstruction: 1985,
  classeEnergie: "F",
  heatingType: "gaz",
};

const DEFAULT_CHARGES: ChargesConfig = {
  chauffage: 18000,
  eau: 4800,
  ascenseur: 3600,
  nettoyage: 4200,
  assurance: 5400,
  honorairesSyndic: 7200,
  fondsReserve: 6000,
};

function generateLots(nbLots: number, surfaceTotale: number): Lot[] {
  const lots: Lot[] = [];
  const baseSurface = Math.round(surfaceTotale / nbLots);
  let remainingSurface = surfaceTotale;

  for (let i = 0; i < nbLots; i++) {
    const isLast = i === nbLots - 1;
    // Add some realistic variation (+/- 20%)
    const variation = isLast ? 0 : (Math.random() - 0.5) * 0.4;
    const surface = isLast
      ? remainingSurface
      : Math.max(25, Math.round(baseSurface * (1 + variation)));
    remainingSurface -= surface;

    lots.push({
      id: String(i + 1),
      numero: String(i + 1),
      surface,
      tantiemes: 0, // will be auto-calculated
      occupant: Math.random() > 0.3 ? "proprietaire" : "locataire",
      loyerMensuel: Math.round(surface * 18),
    });
  }

  // Recalculate tantiemes based on surface proportionally out of 1000
  const totalSurf = lots.reduce((s, l) => s + l.surface, 0);
  let tantRemaining = 1000;
  lots.forEach((lot, i) => {
    if (i === lots.length - 1) {
      lot.tantiemes = tantRemaining;
    } else {
      lot.tantiemes = Math.round((lot.surface / totalSurf) * 1000);
      tantRemaining -= lot.tantiemes;
    }
  });

  return lots;
}

function fmt(n: number, locale = "fr-LU"): string {
  return n.toLocaleString(locale, { maximumFractionDigits: 0 });
}

function fmtDec(n: number, dec = 1, locale = "fr-LU"): string {
  return n.toLocaleString(locale, { maximumFractionDigits: dec, minimumFractionDigits: dec });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SyndicPage() {
  const t = useTranslations("syndic");
  const communes = useMemo(() => getAvailableCommunes(), []);

  /* --- State --- */
  const [activeTab, setActiveTab] = useState<Tab>("config");
  const [building, setBuilding] = useState<BuildingConfig>(DEFAULT_BUILDING);
  const [lots, setLots] = useState<Lot[]>(() => generateLots(12, 960));
  const [charges, setCharges] = useState<ChargesConfig>(DEFAULT_CHARGES);
  const [targetClass, setTargetClass] = useState<string>("C");
  const [agMode, setAgMode] = useState(false);

  /* --- Derived calculations --- */
  const totalTantiemes = useMemo(() => lots.reduce((s, l) => s + l.tantiemes, 0), [lots]);
  const totalSurface = useMemo(() => lots.reduce((s, l) => s + l.surface, 0), [lots]);
  const totalCharges = useMemo(
    () =>
      charges.chauffage +
      charges.eau +
      charges.ascenseur +
      charges.nettoyage +
      charges.assurance +
      charges.honorairesSyndic +
      charges.fondsReserve,
    [charges]
  );
  const occupancyRate = useMemo(() => {
    const occupied = lots.filter((l) => l.occupant === "locataire").length;
    return lots.length > 0 ? occupied / lots.length : 0;
  }, [lots]);

  /* --- Energy calculations --- */
  const energyData = useMemo(() => {
    const { data, isCommune } = getEnergyComparables(building.commune);
    const impactRange = buildImpactRange(data);
    const currentImpact = impactRange[building.classeEnergie];
    return { data, isCommune, impactRange, currentImpact };
  }, [building.commune, building.classeEnergie]);

  const renovation = useMemo<RenovationEstimate>(
    () => estimerCoutsRenovation(building.classeEnergie, targetClass, building.surfaceTotale, building.anneeConstruction),
    [building.classeEnergie, targetClass, building.surfaceTotale, building.anneeConstruction]
  );

  const klimabonus = useMemo(
    () => estimerKlimabonus(building.classeEnergie, targetClass, building.surfaceTotale),
    [building.classeEnergie, targetClass, building.surfaceTotale]
  );

  /* --- Handlers --- */
  const updateBuilding = useCallback(<K extends keyof BuildingConfig>(key: K, value: BuildingConfig[K]) => {
    setBuilding((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateCharges = useCallback(<K extends keyof ChargesConfig>(key: K, value: number) => {
    setCharges((prev) => ({ ...prev, [key]: value }));
  }, []);

  const regenerateLots = useCallback(() => {
    setLots(generateLots(building.nbLots, building.surfaceTotale));
  }, [building.nbLots, building.surfaceTotale]);

  const updateLot = useCallback((id: string, field: keyof Lot, value: string | number) => {
    setLots((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: typeof l[field] === "number" ? Number(value) : value };
        return updated;
      })
    );
  }, []);

  const addLot = useCallback(() => {
    const newId = String(Date.now());
    setLots((prev) => [
      ...prev,
      { id: newId, numero: String(prev.length + 1), surface: 80, tantiemes: 0, occupant: "proprietaire", loyerMensuel: 1440 },
    ]);
  }, []);

  const removeLot = useCallback((id: string) => {
    setLots((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const recalcTantiemes = useCallback(() => {
    setLots((prev) => {
      const total = prev.reduce((s, l) => s + l.surface, 0);
      if (total === 0) return prev;
      let remaining = 1000;
      return prev.map((l, i) => {
        if (i === prev.length - 1) return { ...l, tantiemes: remaining };
        const t = Math.round((l.surface / total) * 1000);
        remaining -= t;
        return { ...l, tantiemes: t };
      });
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  TAB: Configuration                                                 */
  /* ------------------------------------------------------------------ */

  function renderConfig() {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-navy">{t("buildingInfo")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t("buildingName")}
              value={building.name}
              onChange={(v) => updateBuilding("name", v)}
              type="text"
            />
            <InputField
              label={t("address")}
              value={building.address}
              onChange={(v) => updateBuilding("address", v)}
              type="text"
            />
            <InputField
              label={t("commune")}
              value={building.commune}
              onChange={(v) => updateBuilding("commune", v)}
              type="select"
              options={communes.map((c) => ({ value: c, label: c }))}
            />
            <InputField
              label={t("nbLots")}
              value={building.nbLots}
              onChange={(v) => updateBuilding("nbLots", Math.max(2, Math.min(200, Number(v))))}
              min={2}
              max={200}
              suffix={t("lots")}
            />
            <InputField
              label={t("surfaceTotale")}
              value={building.surfaceTotale}
              onChange={(v) => updateBuilding("surfaceTotale", Math.max(50, Number(v)))}
              min={50}
              suffix="m\u00B2"
            />
            <InputField
              label={t("yearConstruction")}
              value={building.anneeConstruction}
              onChange={(v) => updateBuilding("anneeConstruction", Number(v))}
              min={1850}
              max={2026}
            />
            <InputField
              label={t("currentEnergyClass")}
              value={building.classeEnergie}
              onChange={(v) => updateBuilding("classeEnergie", v)}
              type="select"
              options={ENERGY_CLASSES.map((c) => ({ value: c, label: `${t("class")} ${c}` }))}
            />
            <InputField
              label={t("heatingType")}
              value={building.heatingType}
              onChange={(v) => updateBuilding("heatingType", v)}
              type="select"
              options={HEATING_TYPES.map((h) => ({ value: h.value, label: t(h.labelKey) }))}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={regenerateLots}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
            >
              {t("generateLots")}
            </button>
          </div>
        </div>

        {/* Quick summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{building.nbLots}</div>
            <div className="text-sm text-muted">{t("lotsLabel")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{fmt(building.surfaceTotale)} m&sup2;</div>
            <div className="text-sm text-muted">{t("surfaceHabitable")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className={`inline-block rounded-lg px-3 py-1 text-lg font-bold ${ENERGY_COLORS[building.classeEnergie] || "bg-gray-400 text-white"}`}>
              {building.classeEnergie}
            </div>
            <div className="mt-1 text-sm text-muted">{t("currentClass")}</div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  TAB: Lots Management                                               */
  /* ------------------------------------------------------------------ */

  function renderLots() {
    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{lots.length}</div>
            <div className="text-sm text-muted">{t("lotsLabel")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{fmt(totalSurface)} m&sup2;</div>
            <div className="text-sm text-muted">{t("totalSurface")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{fmt(totalTantiemes)}</div>
            <div className="text-sm text-muted">{t("totalTantiemes")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{fmtDec(occupancyRate * 100, 0)}%</div>
            <div className="text-sm text-muted">{t("occupancyRate")}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={addLot} className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors">
            + {t("addLot")}
          </button>
          <button onClick={recalcTantiemes} className="rounded-lg border border-navy/30 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5 transition-colors">
            {t("recalcTantiemes")}
          </button>
        </div>

        {/* Lots table */}
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-navy/5">
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("lotNumber")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("surface")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("tantiemes")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("tantPct")}</th>
                <th className="px-3 py-3 text-left font-semibold text-navy">{t("occupant")}</th>
                <th className="px-3 py-3 text-right font-semibold text-navy">{t("rentMonthly")}</th>
                <th className="px-3 py-3 text-center font-semibold text-navy"></th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id} className="border-b border-card-border/50 hover:bg-navy/3">
                  <td className="px-3 py-2">
                    <input
                      className="w-16 rounded border border-input-border bg-input-bg px-2 py-1 text-sm"
                      value={lot.numero}
                      onChange={(e) => updateLot(lot.id, "numero", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-20 rounded border border-input-border bg-input-bg px-2 py-1 text-right text-sm"
                      value={lot.surface}
                      onChange={(e) => updateLot(lot.id, "surface", e.target.value)}
                      min={10}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-20 rounded border border-input-border bg-input-bg px-2 py-1 text-right text-sm"
                      value={lot.tantiemes}
                      onChange={(e) => updateLot(lot.id, "tantiemes", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-muted">
                    {totalTantiemes > 0 ? fmtDec((lot.tantiemes / totalTantiemes) * 100) : "0"}%
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-input-border bg-input-bg px-2 py-1 text-sm"
                      value={lot.occupant}
                      onChange={(e) => updateLot(lot.id, "occupant", e.target.value)}
                    >
                      <option value="proprietaire">{t("owner")}</option>
                      <option value="locataire">{t("tenant")}</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-24 rounded border border-input-border bg-input-bg px-2 py-1 text-right text-sm"
                      value={lot.loyerMensuel}
                      onChange={(e) => updateLot(lot.id, "loyerMensuel", e.target.value)}
                      min={0}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeLot(lot.id)}
                      className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                      title={t("removeLot")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  TAB: Charges Distribution                                          */
  /* ------------------------------------------------------------------ */

  function renderCharges() {
    const chargeCategories: { key: keyof ChargesConfig; labelKey: string }[] = [
      { key: "chauffage", labelKey: "chargeChauffage" },
      { key: "eau", labelKey: "chargeEau" },
      { key: "ascenseur", labelKey: "chargeAscenseur" },
      { key: "nettoyage", labelKey: "chargeNettoyage" },
      { key: "assurance", labelKey: "chargeAssurance" },
      { key: "honorairesSyndic", labelKey: "chargeHonoraires" },
      { key: "fondsReserve", labelKey: "chargeFondsReserve" },
    ];

    return (
      <div className="space-y-6">
        {/* Charges input */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-navy">{t("annualCharges")}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chargeCategories.map(({ key, labelKey }) => (
              <InputField
                key={key}
                label={t(labelKey)}
                value={charges[key]}
                onChange={(v) => updateCharges(key, Math.max(0, Number(v)))}
                suffix="\u20AC/an"
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-card-border pt-4">
            <span className="text-sm font-semibold text-navy">{t("totalChargesAnnual")}</span>
            <span className="text-xl font-bold text-navy">{formatEUR(totalCharges)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            {t("chargesPerM2")}: {fmtDec(totalSurface > 0 ? totalCharges / totalSurface : 0)} &euro;/m&sup2;/an
          </p>
        </div>

        {/* Distribution table */}
        <div className="rounded-xl border border-card-border bg-card shadow-sm">
          <h3 className="p-4 text-base font-semibold text-navy border-b border-card-border">{t("chargesDistribution")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-navy/5">
                  <th className="px-3 py-3 text-left font-semibold text-navy">{t("lotNumber")}</th>
                  <th className="px-3 py-3 text-right font-semibold text-navy">{t("tantiemes")}</th>
                  <th className="px-3 py-3 text-right font-semibold text-navy">{t("tantPct")}</th>
                  {chargeCategories.map(({ key, labelKey }) => (
                    <th key={key} className="px-3 py-3 text-right font-semibold text-navy whitespace-nowrap">
                      {t(labelKey)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold text-navy">{t("totalLot")}</th>
                  <th className="px-3 py-3 text-right font-semibold text-navy">{t("monthlyLot")}</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => {
                  const pct = totalTantiemes > 0 ? lot.tantiemes / totalTantiemes : 0;
                  const lotTotal = Math.round(totalCharges * pct);
                  return (
                    <tr key={lot.id} className="border-b border-card-border/50 hover:bg-navy/3">
                      <td className="px-3 py-2 font-medium">{t("lotAbbrev")} {lot.numero}</td>
                      <td className="px-3 py-2 text-right font-mono">{lot.tantiemes}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted">{fmtDec(pct * 100)}%</td>
                      {chargeCategories.map(({ key }) => (
                        <td key={key} className="px-3 py-2 text-right font-mono">
                          {fmt(Math.round(charges[key] * pct))}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-mono font-semibold text-navy">{fmt(lotTotal)} &euro;</td>
                      <td className="px-3 py-2 text-right font-mono text-muted">{fmt(Math.round(lotTotal / 12))} &euro;</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-navy/5 font-semibold">
                  <td className="px-3 py-3" colSpan={2}>{t("total")}</td>
                  <td className="px-3 py-3 text-right">100%</td>
                  {chargeCategories.map(({ key }) => (
                    <td key={key} className="px-3 py-3 text-right font-mono">{fmt(charges[key])}</td>
                  ))}
                  <td className="px-3 py-3 text-right font-mono text-navy">{fmt(totalCharges)} &euro;</td>
                  <td className="px-3 py-3 text-right font-mono text-muted">{fmt(Math.round(totalCharges / 12))} &euro;</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Legal reference */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
          <strong>{t("legalRef")}:</strong> {t("chargesLegalText")}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  TAB: Energy Dashboard                                              */
  /* ------------------------------------------------------------------ */

  function renderEnergy() {
    const currentImpact = energyData.currentImpact;
    const valeurEstimeeM2 = 6500; // average price/m2 in Luxembourg for estimation
    const valeurBatiment = valeurEstimeeM2 * building.surfaceTotale;
    const impactEur = currentImpact
      ? Math.round(valeurBatiment * (currentImpact.central / 100))
      : 0;

    return (
      <div className="space-y-6">
        {/* Current energy class badge */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm text-center">
          <h3 className="mb-4 text-base font-semibold text-navy">{t("energyClassTitle")}</h3>
          <div className="flex items-center justify-center gap-4">
            {ENERGY_CLASSES.map((c) => (
              <div
                key={c}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                  c === building.classeEnergie
                    ? `${ENERGY_COLORS[c]} ring-2 ring-offset-2 ring-navy scale-125`
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {c}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            {t("buildingLabel")}: <strong>{building.name}</strong> &mdash; {building.commune}
          </p>
        </div>

        {/* Green premium / brown discount */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultPanel
            title={t("greenPremiumBrown")}
            lines={[
              { label: t("currentClassLabel"), value: building.classeEnergie, highlight: true },
              {
                label: t("priceImpact"),
                value: currentImpact ? `${currentImpact.central > 0 ? "+" : ""}${currentImpact.central}%` : "N/A",
                warning: currentImpact ? currentImpact.central < 0 : false,
              },
              {
                label: t("impactOnValue"),
                value: formatEUR(impactEur),
                warning: impactEur < 0,
              },
              {
                label: t("confidence"),
                value: currentImpact ? t(`confidence_${currentImpact.confidence}`) : "N/A",
                sub: true,
              },
              {
                label: t("source"),
                value: energyData.isCommune ? building.commune : t("nationalAvg"),
                sub: true,
              },
            ]}
          />

          <ResultPanel
            title={t("buildingValue")}
            lines={[
              { label: t("estimatedValueM2"), value: `${fmt(valeurEstimeeM2)} \u20AC/m\u00B2` },
              { label: t("totalSurface"), value: `${fmt(building.surfaceTotale)} m\u00B2` },
              { label: t("grossValue"), value: formatEUR(valeurBatiment), highlight: true },
              {
                label: t("adjustedValue"),
                value: formatEUR(valeurBatiment + impactEur),
                highlight: true,
                large: true,
              },
            ]}
          />
        </div>

        {/* Renovation cost summary */}
        <ResultPanel
          title={t("renovationSummary")}
          lines={[
            { label: t("targetClassLabel"), value: targetClass },
            { label: t("estimatedCostMin"), value: formatEUR(renovation.totalMin) },
            { label: t("estimatedCostMax"), value: formatEUR(renovation.totalMax) },
            { label: t("estimatedCostAvg"), value: formatEUR(renovation.totalMoyen), highlight: true },
            { label: t("honoraires"), value: formatEUR(renovation.honoraires), sub: true },
            { label: t("totalWithHonoraires"), value: formatEUR(renovation.totalAvecHonoraires), highlight: true, large: true },
            { label: t("estimatedDuration"), value: `${renovation.dureeEstimeeMois} ${t("months")}` },
          ]}
        />

        {/* Klimabonus */}
        {klimabonus.eligible && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-green-800">{t("klimabonusTitle")}</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">{t("estimatedSubsidy")}</span>
                <span className="font-mono font-bold text-green-800">{formatEUR(klimabonus.montantEstime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">{t("coverageRate")}</span>
                <span className="font-mono font-bold text-green-800">{fmtDec(klimabonus.tauxCouverture * 100, 0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">{t("netCostAfterSubsidy")}</span>
                <span className="font-mono font-bold text-green-800">{formatEUR(renovation.totalAvecHonoraires - klimabonus.montantEstime)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-green-600">{t("klimabonusNote")}</p>
          </div>
        )}

        {/* Per-lot share */}
        <div className="rounded-xl border border-card-border bg-card shadow-sm">
          <h3 className="p-4 text-base font-semibold text-navy border-b border-card-border">{t("perLotShare")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-navy/5">
                  <th className="px-3 py-3 text-left font-semibold text-navy">{t("lotNumber")}</th>
                  <th className="px-3 py-3 text-right font-semibold text-navy">{t("tantPct")}</th>
                  <th className="px-3 py-3 text-right font-semibold text-navy">{t("renovationShare")}</th>
                  {klimabonus.eligible && (
                    <th className="px-3 py-3 text-right font-semibold text-navy">{t("subsidyShare")}</th>
                  )}
                  <th className="px-3 py-3 text-right font-semibold text-navy">{t("netShare")}</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => {
                  const pct = totalTantiemes > 0 ? lot.tantiemes / totalTantiemes : 0;
                  const share = Math.round(renovation.totalAvecHonoraires * pct);
                  const subsidyShare = Math.round(klimabonus.montantEstime * pct);
                  return (
                    <tr key={lot.id} className="border-b border-card-border/50 hover:bg-navy/3">
                      <td className="px-3 py-2 font-medium">{t("lotAbbrev")} {lot.numero}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted">{fmtDec(pct * 100)}%</td>
                      <td className="px-3 py-2 text-right font-mono">{formatEUR(share)}</td>
                      {klimabonus.eligible && (
                        <td className="px-3 py-2 text-right font-mono text-green-600">-{formatEUR(subsidyShare)}</td>
                      )}
                      <td className="px-3 py-2 text-right font-mono font-semibold text-navy">{formatEUR(share - subsidyShare)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link to energy community */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-navy">{t("energyCommunityTitle")}</h3>
          <p className="mb-4 text-sm text-muted">{t("energyCommunityDesc")}</p>
          <Link
            href="/energy/communaute"
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
          >
            {t("energyCommunityLink")}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  TAB: Renovation Planning                                           */
  /* ------------------------------------------------------------------ */

  function renderRenovation() {
    const epbdDeadline = getEpbdDeadline(building.classeEnergie);
    const targetClasses = ENERGY_CLASSES.filter(
      (c) => ENERGY_CLASSES.indexOf(c) < ENERGY_CLASSES.indexOf(building.classeEnergie)
    );

    return (
      <div className="space-y-6">
        {/* AG mode toggle */}
        <div className="flex items-center justify-between rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-navy">{t("agModeTitle")}</h3>
            <p className="text-sm text-muted">{t("agModeDesc")}</p>
          </div>
          <button
            onClick={() => setAgMode(!agMode)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              agMode
                ? "bg-gold text-navy-dark"
                : "border border-navy/30 text-navy hover:bg-navy/5"
            }`}
          >
            {agMode ? t("agModeOn") : t("agModeOff")}
          </button>
        </div>

        {/* Target class selector */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-navy">{t("targetClassSelect")}</h3>
          <div className="flex flex-wrap items-center gap-3">
            {targetClasses.map((c) => (
              <button
                key={c}
                onClick={() => setTargetClass(c)}
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                  c === targetClass
                    ? `${ENERGY_COLORS[c]} ring-2 ring-offset-2 ring-navy scale-110`
                    : `${ENERGY_COLORS[c]} opacity-50 hover:opacity-80`
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            {t("jumpLabel")}: {building.classeEnergie} &rarr; {targetClass}
          </p>
        </div>

        {/* EPBD Timeline */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-amber-800">{t("epbdTimeline")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-amber-700">{t("currentClassLabel")}</div>
              <div className="text-lg font-bold text-amber-900">{t("class")} {building.classeEnergie}</div>
            </div>
            <div>
              <div className="text-sm text-amber-700">{t("epbdDeadline")}</div>
              <div className="text-lg font-bold text-amber-900">{epbdDeadline}</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-amber-600">{t("epbdNote")}</p>
        </div>

        {/* Renovation breakdown */}
        {renovation.postes.length > 0 ? (
          <div className="rounded-xl border border-card-border bg-card shadow-sm">
            <h3 className="p-4 text-base font-semibold text-navy border-b border-card-border">{t("renovationBreakdown")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-navy/5">
                    <th className="px-4 py-3 text-left font-semibold text-navy">{t("workItem")}</th>
                    {!agMode && (
                      <>
                        <th className="px-4 py-3 text-right font-semibold text-navy">{t("costMin")}</th>
                        <th className="px-4 py-3 text-right font-semibold text-navy">{t("costMax")}</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-right font-semibold text-navy">{t("costAvg")}</th>
                  </tr>
                </thead>
                <tbody>
                  {renovation.postes.map((poste, i) => (
                    <tr key={i} className="border-b border-card-border/50 hover:bg-navy/3">
                      <td className="px-4 py-2">{t(poste.labelKey)}</td>
                      {!agMode && (
                        <>
                          <td className="px-4 py-2 text-right font-mono">{formatEUR(poste.coutMin)}</td>
                          <td className="px-4 py-2 text-right font-mono">{formatEUR(poste.coutMax)}</td>
                        </>
                      )}
                      <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(poste.coutMoyen)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-navy/5 font-semibold">
                    <td className="px-4 py-3">{t("totalWorks")}</td>
                    {!agMode && (
                      <>
                        <td className="px-4 py-3 text-right font-mono">{formatEUR(renovation.totalMin)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatEUR(renovation.totalMax)}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right font-mono">{formatEUR(renovation.totalMoyen)}</td>
                  </tr>
                  <tr className="bg-navy/5">
                    <td className="px-4 py-2 text-muted">{t("honoraires")} (10%)</td>
                    {!agMode && (
                      <>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </>
                    )}
                    <td className="px-4 py-2 text-right font-mono">{formatEUR(renovation.honoraires)}</td>
                  </tr>
                  <tr className="bg-navy/10 font-bold">
                    <td className="px-4 py-3">{t("grandTotal")}</td>
                    {!agMode && (
                      <>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right font-mono text-navy">{formatEUR(renovation.totalAvecHonoraires)}</td>
                  </tr>
                  {klimabonus.eligible && (
                    <>
                      <tr className="bg-green-50">
                        <td className="px-4 py-2 text-green-700">{t("klimabonusSubsidy")}</td>
                        {!agMode && (
                          <>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2"></td>
                          </>
                        )}
                        <td className="px-4 py-2 text-right font-mono text-green-700">-{formatEUR(klimabonus.montantEstime)}</td>
                      </tr>
                      <tr className="bg-green-50 font-bold">
                        <td className="px-4 py-3 text-green-800">{t("netCostAfterSubsidy")}</td>
                        {!agMode && (
                          <>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3"></td>
                          </>
                        )}
                        <td className="px-4 py-3 text-right font-mono text-green-800">{formatEUR(renovation.totalAvecHonoraires - klimabonus.montantEstime)}</td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-green-800 font-medium">{t("alreadyCompliant")}</p>
          </div>
        )}

        {/* Per-lot cost AG view */}
        {agMode && renovation.postes.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card shadow-sm">
            <h3 className="p-4 text-base font-semibold text-navy border-b border-card-border">{t("agPerLotTitle")}</h3>
            <p className="px-4 py-2 text-sm text-muted">{t("agPerLotDesc")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-navy/5">
                    <th className="px-4 py-3 text-left font-semibold text-navy">{t("lotNumber")}</th>
                    <th className="px-4 py-3 text-right font-semibold text-navy">{t("surface")}</th>
                    <th className="px-4 py-3 text-right font-semibold text-navy">{t("tantPct")}</th>
                    <th className="px-4 py-3 text-right font-semibold text-navy">{t("grossShareLot")}</th>
                    {klimabonus.eligible && (
                      <th className="px-4 py-3 text-right font-semibold text-navy">{t("subsidyShare")}</th>
                    )}
                    <th className="px-4 py-3 text-right font-semibold text-navy">{t("netShareLot")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => {
                    const pct = totalTantiemes > 0 ? lot.tantiemes / totalTantiemes : 0;
                    const grossShare = Math.round(renovation.totalAvecHonoraires * pct);
                    const subsidyShare = Math.round(klimabonus.montantEstime * pct);
                    const netShare = grossShare - subsidyShare;
                    return (
                      <tr key={lot.id} className="border-b border-card-border/50 hover:bg-navy/3">
                        <td className="px-4 py-2 font-medium">{t("lotAbbrev")} {lot.numero}</td>
                        <td className="px-4 py-2 text-right font-mono">{lot.surface} m&sup2;</td>
                        <td className="px-4 py-2 text-right font-mono text-muted">{fmtDec(pct * 100)}%</td>
                        <td className="px-4 py-2 text-right font-mono">{formatEUR(grossShare)}</td>
                        {klimabonus.eligible && (
                          <td className="px-4 py-2 text-right font-mono text-green-600">-{formatEUR(subsidyShare)}</td>
                        )}
                        <td className="px-4 py-2 text-right font-mono font-bold text-navy">{formatEUR(netShare)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Renovation duration */}
        {renovation.postes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-navy">{renovation.dureeEstimeeMois}</div>
              <div className="text-sm text-muted">{t("monthsDuration")}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-navy">{renovation.postes.length}</div>
              <div className="text-sm text-muted">{t("workItems")}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-navy">
                {fmt(Math.round(renovation.totalAvecHonoraires / building.surfaceTotale))} &euro;
              </div>
              <div className="text-sm text-muted">{t("costPerM2")}</div>
            </div>
          </div>
        )}

        {/* Legal note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
          <strong>{t("legalRef")}:</strong> {t("renovationLegalText")}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  const tabContent: Record<Tab, () => React.ReactNode> = {
    config: renderConfig,
    lots: renderLots,
    charges: renderCharges,
    energy: renderEnergy,
    renovation: renderRenovation,
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 text-lg text-white/70">{t("subtitle")}</p>
        </div>
      </section>

      {/* Syndic primary CTA */}
      <section className="border-b border-card-border bg-gradient-to-br from-navy to-navy/90 text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-gold">{t("primaryCta.label")}</div>
              <div className="mt-1 text-lg font-bold">{t("primaryCta.title")}</div>
              <p className="text-sm text-white/70 mt-0.5">{t("primaryCta.desc")}</p>
            </div>
            <Link href="/syndic/coproprietes"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-navy-dark hover:bg-gold-light transition-colors">
              ★ {t("primaryCta.button")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Outils complémentaires — grille de cartes */}
      <section className="border-b border-card-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("toolkit.title")}</h2>
              <p className="mt-1 text-xs text-muted">{t("toolkit.subtitle")}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ToolkitCard
              href="/calculateur-loyer?from=syndic"
              title={t("toolkit.loyerTitle")}
              desc={t("toolkit.loyerDesc")}
              category={t("toolkit.catCalc")}
              iconColor="bg-emerald-100 text-emerald-900"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5V6a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0115 6v1.5m-6 0h6m-6 0H6.75A2.25 2.25 0 004.5 9.75v8.25a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V9.75a2.25 2.25 0 00-2.25-2.25H15M9 15h.008v.008H9V15zm3 0h.008v.008H12V15zm3 0h.008v.008H15V15zm-3-3h.008v.008H12V12zm-3 0h.008v.008H9V12zm6 0h.008v.008H15V12z" /></svg>}
            />
            <ToolkitCard
              href="/portfolio?from=syndic"
              title={t("toolkit.portfolioTitle")}
              desc={t("toolkit.portfolioDesc")}
              category={t("toolkit.catAsset")}
              iconColor="bg-indigo-100 text-indigo-900"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" /></svg>}
            />
            <ToolkitCard
              href="/energy/portfolio?from=syndic"
              title={t("toolkit.energyPortfolioTitle")}
              desc={t("toolkit.energyPortfolioDesc")}
              category={t("toolkit.catEnergy")}
              iconColor="bg-amber-100 text-amber-900"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
            />
            <ToolkitCard
              href="/energy/epbd?from=syndic"
              title={t("toolkit.epbdTitle")}
              desc={t("toolkit.epbdDesc")}
              category={t("toolkit.catEnergy")}
              iconColor="bg-lime-100 text-lime-900"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <ToolkitCard
              href="/aml-kyc?from=syndic"
              title={t("toolkit.amlTitle")}
              desc={t("toolkit.amlDesc")}
              category={t("toolkit.catCompliance")}
              iconColor="bg-slate-200 text-slate-900"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.333 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
            />
            <ToolkitCard
              href="/syndic/benchmark?from=syndic"
              title={t("toolkit.benchmarkTitle")}
              desc={t("toolkit.benchmarkDesc")}
              category={t("toolkit.catAnalysis")}
              iconColor="bg-fuchsia-100 text-fuchsia-900"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
            />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 border-b border-card-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-navy text-white shadow-sm"
                    : "text-muted hover:bg-navy/5 hover:text-navy"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {tabContent[activeTab]()}
      </div>

      {/* SEO Content */}
      <SEOContent
        ns="syndic"
        sections={[
          { titleKey: "gestionTitle", contentKey: "gestionContent" },
          { titleKey: "chargesTitle", contentKey: "chargesContent" },
          { titleKey: "renovationTitle", contentKey: "renovationContent" },
          { titleKey: "reglementationTitle", contentKey: "reglementationContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/energy/impact", labelKey: "energyImpact" },
          { href: "/energy/renovation", labelKey: "energyRenovation" },
          { href: "/energy/communaute", labelKey: "energyCommunaute" },
          { href: "/energy/epbd", labelKey: "energyEpbd" },
          { href: "/portfolio", labelKey: "portfolio" },
        ]}
      />
    </main>
  );
}

function ToolkitCard({ href, title, desc, category, icon, iconColor }: {
  href: string; title: string; desc: string; category: string;
  icon: React.ReactNode; iconColor: string;
}) {
  return (
    <Link href={href}
      className="group relative rounded-xl border border-card-border bg-card p-4 hover:border-navy hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">{category}</div>
          <h3 className="mt-0.5 text-sm font-bold text-navy group-hover:text-navy-light">{title}</h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">{desc}</p>
        </div>
        <svg className="h-4 w-4 text-muted group-hover:text-navy group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}
