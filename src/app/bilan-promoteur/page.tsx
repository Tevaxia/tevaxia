"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";
import { generateBilanPromoteurPdfBlob, PdfButton } from "@/components/ToolsPdf";
import ShareLinkButton from "@/components/ShareLinkButton";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import PdfExtractButton from "@/components/PdfExtractButton";

export default function BilanPromoteur() {
  const t = useTranslations("bilanPromoteur");
  // Recettes
  // Type d'opération
  const [typeOperation, setTypeOperation] = useState<"immeuble" | "lotissement" | "maisons">("immeuble");

  const [surfaceVendable, setSurfaceVendable] = useState(2000);
  const [prixVenteM2, setPrixVenteM2] = useState(8500);
  const [nbParkings, setNbParkings] = useState(30);
  const [prixParking, setPrixParking] = useState(35000);

  // Terrain
  const [surfaceTerrain, setSurfaceTerrain] = useState(3000);
  const [prixTerrainM2, setPrixTerrainM2] = useState(0); // 0 = compte à rebours, sinon coût connu
  const [coutTerrainConnu, setCoutTerrainConnu] = useState(false);

  // Coûts construction
  const [coutConstructionM2, setCoutConstructionM2] = useState(2800);
  const [surfaceBrute, setSurfaceBrute] = useState(2800);
  const [voirie, setVoirie] = useState(200000);
  const [honorairesArchitecte, setHonorairesArchitecte] = useState(8);
  const [honorairesBET, setHonorairesBET] = useState(4);
  const [etudesAutres, setEtudesAutres] = useState(50000);

  // Frais spécifiques lotissement/maisons
  const [fraisGeometre, setFraisGeometre] = useState(typeOperation !== "immeuble" ? 15000 : 0);
  const [fraisLotissement, setFraisLotissement] = useState(typeOperation !== "immeuble" ? 30000 : 0);
  const [nbLots, setNbLots] = useState(typeOperation !== "immeuble" ? 6 : 0);

  // Pré-commercialisation
  const [tauxPreCommercialisation, setTauxPreCommercialisation] = useState(50); // % pré-vendu

  // Frais promoteur
  const [fraisCommerciaux, setFraisCommerciaux] = useState(3); // % CA
  const [fraisFinanciers, setFraisFinanciers] = useState(3); // % coût total
  const [assurances, setAssurances] = useState(1.5); // % coûts construction
  const [fraisGestion, setFraisGestion] = useState(2); // % CA
  const [aleas, setAleas] = useState(5); // % coûts construction

  // Marge
  const [margePromoteur, setMargePromoteur] = useState(15); // % CA

  // Multi-tranches / phasage
  const [multiTranchesActive, setMultiTranchesActive] = useState(false);
  const [trancheT1Pct, setTrancheT1Pct] = useState(40);
  const [trancheT2Pct, setTrancheT2Pct] = useState(40);
  const [trancheT1Offset, setTrancheT1Offset] = useState(0);
  const [trancheT2Offset, setTrancheT2Offset] = useState(12);
  const [trancheT3Offset, setTrancheT3Offset] = useState(24);

  // Suivi d'exécution : saisie des coûts réels mois par mois
  const [suiviExecutionActive, setSuiviExecutionActive] = useState(false);
  const [coutsReelsParMois, setCoutsReelsParMois] = useState<Record<number, number>>({});
  const updateCoutReel = useCallback((mois: number, valeur: number) => {
    setCoutsReelsParMois((prev) => ({ ...prev, [mois]: valeur }));
  }, []);

  // Plan de trésorerie — VEFA call schedule (standard LU)
  // 5% / 15% / 20% / 20% / 15% / 15% / 10% spread across 24 months
  const vefaSchedule = useMemo(() => {
    // 7 tranches spread across 24 months
    // Each tranche is triggered at a specific month milestone
    const tranches = [
      { month: 1, pct: 5, label: t("vefaSignature") },
      { month: 4, pct: 15, label: t("vefaFoundations") },
      { month: 8, pct: 20, label: t("vefaGroundFloorSlab") },
      { month: 12, pct: 20, label: t("vefaRoofed") },
      { month: 16, pct: 15, label: t("vefaPartitions") },
      { month: 20, pct: 15, label: t("vefaFinishing") },
      { month: 24, pct: 10, label: t("vefaDelivery") },
    ];
    return tranches;
  }, [t]);

  const treasuryPlan = useMemo(() => {
    // We need result values — compute key totals here too
    const caTotal_ = surfaceVendable * prixVenteM2 + nbParkings * prixParking;
    const coutsConstruction_ = surfaceBrute * coutConstructionM2;
    const coutsVoirie_ = voirie;
    const coutsArchitecte_ = coutsConstruction_ * (honorairesArchitecte / 100);
    const coutsBET_ = coutsConstruction_ * (honorairesBET / 100);
    const coutsEtudes_ = etudesAutres;
    const coutsAleas_ = coutsConstruction_ * (aleas / 100);
    const coutsLotissement_ = typeOperation !== "immeuble" ? fraisGeometre + fraisLotissement : 0;
    const totalConstruction_ = coutsConstruction_ + coutsVoirie_ + coutsArchitecte_ + coutsBET_ + coutsEtudes_ + coutsAleas_ + coutsLotissement_;

    // Terrain cost
    const coutTerrain_ = coutTerrainConnu ? surfaceTerrain * prixTerrainM2 : 0;

    // Monthly construction cost (spread evenly over 24 months)
    const monthlyConstruction = totalConstruction_ / 24;

    // Revenue from pre-sold units (VEFA calls)
    const preVenduCA = caTotal_ * (tauxPreCommercialisation / 100);

    // Build monthly arrays (1-indexed: month 1..24)
    const quarterlyData: {
      quarter: string;
      cumExpenditure: number;
      cumRevenue: number;
      netPosition: number;
    }[] = [];

    let cumExpenditure = 0;
    let cumRevenue = 0;
    let peakNeed = 0;
    let peakQuarter = "";

    for (let q = 1; q <= 8; q++) {
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;

      // Expenditure this quarter
      let qExpenditure = 0;
      // Land purchase in Q1 (months 1-3)
      if (q === 1) {
        qExpenditure += coutTerrain_;
      }
      // Construction spread over 24 months
      qExpenditure += monthlyConstruction * 3;

      cumExpenditure += qExpenditure;

      // Revenue this quarter: check each VEFA tranche
      let qRevenue = 0;
      for (const tranche of vefaSchedule) {
        if (tranche.month >= startMonth && tranche.month <= endMonth) {
          qRevenue += preVenduCA * (tranche.pct / 100);
        }
      }
      cumRevenue += qRevenue;

      const net = cumRevenue - cumExpenditure;
      const label = `T${q} (M${startMonth}-${endMonth})`;

      if (net < peakNeed) {
        peakNeed = net;
        peakQuarter = label;
      }

      quarterlyData.push({
        quarter: label,
        cumExpenditure,
        cumRevenue,
        netPosition: net,
      });
    }

    return { quarterlyData, peakNeed, peakQuarter };
  }, [surfaceVendable, prixVenteM2, nbParkings, prixParking, coutConstructionM2, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, aleas, surfaceTerrain, prixTerrainM2, coutTerrainConnu, typeOperation, fraisGeometre, fraisLotissement, tauxPreCommercialisation, vefaSchedule]);

  const result = useMemo(() => {
    // RECETTES
    const caLogements = surfaceVendable * prixVenteM2;
    const caParkings = nbParkings * prixParking;
    const caTotal = caLogements + caParkings;

    // TERRAIN (si coût connu)
    const coutTerrain = coutTerrainConnu ? surfaceTerrain * prixTerrainM2 : 0;

    // COÛTS CONSTRUCTION
    const coutsConstruction = surfaceBrute * coutConstructionM2;
    const coutsVoirie = voirie;
    const coutsArchitecte = coutsConstruction * (honorairesArchitecte / 100);
    const coutsBET = coutsConstruction * (honorairesBET / 100);
    const coutsEtudes = etudesAutres;
    const coutsAleas = coutsConstruction * (aleas / 100);
    const coutsLotissement = typeOperation !== "immeuble" ? fraisGeometre + fraisLotissement : 0;
    const totalConstruction = coutsConstruction + coutsVoirie + coutsArchitecte + coutsBET + coutsEtudes + coutsAleas + coutsLotissement;

    // FRAIS PROMOTEUR
    const fCommerciaux = caTotal * (fraisCommerciaux / 100);
    const fFinanciers = (totalConstruction + caTotal * margePromoteur / 100) * (fraisFinanciers / 100); // Sur le coût engagé
    const fAssurances = coutsConstruction * (assurances / 100);
    const fGestion = caTotal * (fraisGestion / 100);
    const totalFrais = fCommerciaux + fFinanciers + fAssurances + fGestion;

    // MARGE
    const margeMontant = caTotal * (margePromoteur / 100);

    // CHARGE FONCIÈRE RÉSIDUELLE = CA - Construction - Frais - Marge
    // Si terrain connu : marge résiduelle = CA - terrain - construction - frais - marge
    // Si terrain inconnu (compte à rebours) : charge foncière max = CA - construction - frais - marge
    const chargeFonciere = caTotal - totalConstruction - totalFrais - margeMontant - coutTerrain;
    const chargeFonciereM2Terrain = surfaceVendable > 0 ? chargeFonciere / surfaceVendable : 0;

    // Ratios
    const ratioFoncierCA = caTotal > 0 ? chargeFonciere / caTotal : 0;
    const ratioConstructionCA = caTotal > 0 ? totalConstruction / caTotal : 0;
    const ratioFraisCA = caTotal > 0 ? totalFrais / caTotal : 0;
    const margeEffective = caTotal > 0 ? margeMontant / caTotal : 0;

    // Rentabilité sur fonds propres (estimation)
    const fondsPropreEstimes = chargeFonciere + caTotal * 0.10; // ~10% du CA en fonds propres
    const rentaFP = fondsPropreEstimes > 0 ? margeMontant / fondsPropreEstimes : 0;

    return {
      caLogements, caParkings, caTotal,
      coutTerrain, coutsConstruction, coutsVoirie, coutsArchitecte, coutsBET, coutsEtudes, coutsAleas, coutsLotissement, totalConstruction,
      fCommerciaux, fFinanciers, fAssurances, fGestion, totalFrais,
      margeMontant,
      chargeFonciere, chargeFonciereM2Terrain,
      ratioFoncierCA, ratioConstructionCA, ratioFraisCA, margeEffective, rentaFP,
    };
  }, [surfaceVendable, prixVenteM2, nbParkings, prixParking, coutConstructionM2, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, fraisCommerciaux, fraisFinanciers, assurances, fraisGestion, aleas, margePromoteur, surfaceTerrain, prixTerrainM2, coutTerrainConnu, typeOperation, fraisGeometre, fraisLotissement]);

  // --- Sensitivity analysis ---
  // Helper: compute margin % and charge foncière for arbitrary prixVente, coutConstr, tauxFinancier
  const computeScenario = useCallback((prixVente: number, coutConstr: number, tauxFin: number) => {
    const caLogements = surfaceVendable * prixVente;
    const caParkings = nbParkings * prixParking;
    const caTotal = caLogements + caParkings;
    const coutTerrain = coutTerrainConnu ? surfaceTerrain * prixTerrainM2 : 0;
    const coutsConstruction = surfaceBrute * coutConstr;
    const coutsArchitecte = coutsConstruction * (honorairesArchitecte / 100);
    const coutsBET = coutsConstruction * (honorairesBET / 100);
    const coutsAleas = coutsConstruction * (aleas / 100);
    const coutsLotissement = typeOperation !== "immeuble" ? fraisGeometre + fraisLotissement : 0;
    const totalConstruction = coutsConstruction + voirie + coutsArchitecte + coutsBET + etudesAutres + coutsAleas + coutsLotissement;
    const fCommerciaux = caTotal * (fraisCommerciaux / 100);
    const fFinanciers = (totalConstruction + caTotal * margePromoteur / 100) * (tauxFin / 100);
    const fAssurances = coutsConstruction * (assurances / 100);
    const fGestion = caTotal * (fraisGestion / 100);
    const totalFrais = fCommerciaux + fFinanciers + fAssurances + fGestion;
    const margeMontant = caTotal * (margePromoteur / 100);
    const chargeFonciere = caTotal - totalConstruction - totalFrais - margeMontant - coutTerrain;
    const margeEffective = caTotal > 0 ? (chargeFonciere / caTotal) * 100 : 0;
    return { chargeFonciere, margeEffective };
  }, [surfaceVendable, nbParkings, prixParking, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, aleas, fraisCommerciaux, assurances, fraisGestion, margePromoteur, surfaceTerrain, prixTerrainM2, coutTerrainConnu, typeOperation, fraisGeometre, fraisLotissement]);

  // Matrix 1: Prix de vente vs Coût construction
  const sensitivityPrixConstr = useMemo(() => {
    const prixVariants = [prixVenteM2 * 0.9, prixVenteM2, prixVenteM2 * 1.1];
    const coutVariants = [coutConstructionM2 * 0.9, coutConstructionM2, coutConstructionM2 * 1.1];
    return prixVariants.map((pv) =>
      coutVariants.map((cc) => computeScenario(pv, cc, fraisFinanciers))
    );
  }, [prixVenteM2, coutConstructionM2, fraisFinanciers, computeScenario]);

  // Matrix 2: Prix de vente vs Taux de financement
  const sensitivityPrixTaux = useMemo(() => {
    const prixVariants = [prixVenteM2 * 0.9, prixVenteM2, prixVenteM2 * 1.1];
    const tauxVariants = [fraisFinanciers - 1, fraisFinanciers, fraisFinanciers + 1];
    return prixVariants.map((pv) =>
      tauxVariants.map((tf) => computeScenario(pv, coutConstructionM2, tf))
    );
  }, [prixVenteM2, coutConstructionM2, fraisFinanciers, computeScenario]);

  // Tornado: impact ±10 % de chaque variable sur la charge foncière
  const tornadoData = useMemo(() => {
    const baseCharge = result.chargeFonciere;

    const variants = [
      { key: "prixVenteM2", labelKey: "tornPrixVente", base: prixVenteM2 },
      { key: "coutConstructionM2", labelKey: "tornCoutConstruction", base: coutConstructionM2 },
      { key: "margePromoteur", labelKey: "tornMargePromoteur", base: margePromoteur },
      { key: "fraisFinanciers", labelKey: "tornFraisFinanciers", base: fraisFinanciers },
      { key: "aleas", labelKey: "tornAleas", base: aleas },
      { key: "fraisCommerciaux", labelKey: "tornFraisCommerciaux", base: fraisCommerciaux },
      { key: "honorairesArchitecte", labelKey: "tornHonArchi", base: honorairesArchitecte },
      { key: "voirie", labelKey: "tornVoirie", base: voirie },
    ];

    const recompute = (overrideKey: string, overrideVal: number) => {
      const pv = overrideKey === "prixVenteM2" ? overrideVal : prixVenteM2;
      const cc = overrideKey === "coutConstructionM2" ? overrideVal : coutConstructionM2;
      const mp = overrideKey === "margePromoteur" ? overrideVal : margePromoteur;
      const ff = overrideKey === "fraisFinanciers" ? overrideVal : fraisFinanciers;
      const al = overrideKey === "aleas" ? overrideVal : aleas;
      const fc = overrideKey === "fraisCommerciaux" ? overrideVal : fraisCommerciaux;
      const ha = overrideKey === "honorairesArchitecte" ? overrideVal : honorairesArchitecte;
      const vv = overrideKey === "voirie" ? overrideVal : voirie;

      const caLogements = surfaceVendable * pv;
      const caTotal = caLogements + nbParkings * prixParking;
      const coutTerrain = coutTerrainConnu ? surfaceTerrain * prixTerrainM2 : 0;
      const coutsConstruction = surfaceBrute * cc;
      const coutsArchitecte = coutsConstruction * (ha / 100);
      const coutsBET = coutsConstruction * (honorairesBET / 100);
      const coutsAleas = coutsConstruction * (al / 100);
      const coutsLotissement = typeOperation !== "immeuble" ? fraisGeometre + fraisLotissement : 0;
      const totalConstruction = coutsConstruction + vv + coutsArchitecte + coutsBET + etudesAutres + coutsAleas + coutsLotissement;
      const fCommerciaux = caTotal * (fc / 100);
      const fFinanciers = (totalConstruction + caTotal * mp / 100) * (ff / 100);
      const fAssurances = coutsConstruction * (assurances / 100);
      const fGestion = caTotal * (fraisGestion / 100);
      const totalFrais = fCommerciaux + fFinanciers + fAssurances + fGestion;
      const margeMontant = caTotal * (mp / 100);
      return caTotal - totalConstruction - totalFrais - margeMontant - coutTerrain;
    };

    return variants
      .map((v) => {
        const low = recompute(v.key, v.base * 0.9);
        const high = recompute(v.key, v.base * 1.1);
        const deltaLow = low - baseCharge;
        const deltaHigh = high - baseCharge;
        return {
          labelKey: v.labelKey,
          low: Math.min(deltaLow, deltaHigh),
          high: Math.max(deltaLow, deltaHigh),
          range: Math.abs(deltaHigh - deltaLow),
        };
      })
      .sort((a, b) => b.range - a.range);
  }, [
    result.chargeFonciere, prixVenteM2, coutConstructionM2, margePromoteur, fraisFinanciers, aleas,
    fraisCommerciaux, honorairesArchitecte, voirie, surfaceVendable, nbParkings, prixParking,
    coutTerrainConnu, surfaceTerrain, prixTerrainM2, surfaceBrute, honorairesBET, typeOperation,
    fraisGeometre, fraisLotissement, etudesAutres, assurances, fraisGestion,
  ]);

  const tornadoMax = useMemo(
    () => Math.max(...tornadoData.map((t) => Math.max(Math.abs(t.low), Math.abs(t.high))), 1),
    [tornadoData],
  );

  // Scénarios multiples (stockage localStorage)
  interface Scenario {
    id: string;
    name: string;
    date: string;
    // Snapshot of inputs
    typeOperation: typeof typeOperation;
    surfaceVendable: number;
    prixVenteM2: number;
    nbParkings: number;
    prixParking: number;
    surfaceTerrain: number;
    prixTerrainM2: number;
    coutTerrainConnu: boolean;
    coutConstructionM2: number;
    margePromoteur: number;
    fraisFinanciers: number;
    aleas: number;
    // Computed results
    caTotal: number;
    chargeFonciere: number;
    margeMontant: number;
    ratioFoncierCA: number;
  }
  const SCENARIOS_KEY = "tevaxia_bilan_promoteur_scenarios";
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCENARIOS_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setScenarios(JSON.parse(raw) as Scenario[]);
      }
    } catch { /* ignore */ }
  }, []);

  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    const entry: Scenario = {
      id: `scn-${Date.now()}`,
      name: scenarioName.trim(),
      date: new Date().toISOString(),
      typeOperation,
      surfaceVendable, prixVenteM2, nbParkings, prixParking,
      surfaceTerrain, prixTerrainM2, coutTerrainConnu,
      coutConstructionM2, margePromoteur, fraisFinanciers, aleas,
      caTotal: result.caTotal,
      chargeFonciere: result.chargeFonciere,
      margeMontant: result.margeMontant,
      ratioFoncierCA: result.ratioFoncierCA,
    };
    const next = [entry, ...scenarios].slice(0, 10);
    setScenarios(next);
    try {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(next));
    } catch { /* quota */ }
    setScenarioName("");
  };

  const loadScenario = (s: Scenario) => {
    setTypeOperation(s.typeOperation);
    setSurfaceVendable(s.surfaceVendable);
    setPrixVenteM2(s.prixVenteM2);
    setNbParkings(s.nbParkings);
    setPrixParking(s.prixParking);
    setSurfaceTerrain(s.surfaceTerrain);
    setPrixTerrainM2(s.prixTerrainM2);
    setCoutTerrainConnu(s.coutTerrainConnu);
    setCoutConstructionM2(s.coutConstructionM2);
    setMargePromoteur(s.margePromoteur);
    setFraisFinanciers(s.fraisFinanciers);
    setAleas(s.aleas);
  };

  const deleteScenario = (id: string) => {
    const next = scenarios.filter((s) => s.id !== id);
    setScenarios(next);
    try {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTypeOperation("immeuble");
                setSurfaceVendable(2400);
                setPrixVenteM2(9200);
                setNbParkings(32);
                setPrixParking(38000);
                setSurfaceTerrain(3200);
                setPrixTerrainM2(0);
                setCoutTerrainConnu(false);
                setCoutConstructionM2(3100);
                setSurfaceBrute(3000);
                setVoirie(220000);
                setHonorairesArchitecte(8);
                setHonorairesBET(4.5);
                setEtudesAutres(65000);
                setFraisCommerciaux(3);
                setFraisFinanciers(3.5);
                setAssurances(1.5);
                setFraisGestion(2);
                setAleas(5);
                setMargePromoteur(15);
                setTauxPreCommercialisation(55);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Charger exemple démo
            </button>
            <PdfExtractButton
              schema="bilan_promoteur"
              onExtracted={(d) => {
                const set = <T,>(v: unknown, setter: (x: T) => void, coerce: (v: unknown) => T) => {
                  if (v !== null && v !== undefined) setter(coerce(v));
                };
                const num = (v: unknown) => Number(v) || 0;
                set(d.typeOperation, setTypeOperation, (v) => (["immeuble", "lotissement", "maisons"].includes(String(v)) ? (v as "immeuble" | "lotissement" | "maisons") : "immeuble"));
                set(d.surfaceVendable, setSurfaceVendable, num);
                set(d.prixVenteM2, setPrixVenteM2, num);
                set(d.nbParkings, setNbParkings, num);
                set(d.prixParking, setPrixParking, num);
                set(d.surfaceTerrain, setSurfaceTerrain, num);
                set(d.prixTerrainM2, setPrixTerrainM2, num);
                set(d.coutTerrainConnu, setCoutTerrainConnu, Boolean);
                set(d.coutConstructionM2, setCoutConstructionM2, num);
                set(d.surfaceBrute, setSurfaceBrute, num);
                set(d.voirie, setVoirie, num);
                set(d.honorairesArchitecte, setHonorairesArchitecte, num);
                set(d.honorairesBET, setHonorairesBET, num);
                set(d.etudesAutres, setEtudesAutres, num);
                set(d.fraisCommerciaux, setFraisCommerciaux, num);
                set(d.fraisFinanciers, setFraisFinanciers, num);
                set(d.assurances, setAssurances, num);
                set(d.fraisGestion, setFraisGestion, num);
                set(d.aleas, setAleas, num);
                set(d.margePromoteur, setMargePromoteur, num);
                set(d.tauxPreCommercialisation, setTauxPreCommercialisation, num);
              }}
              label="Pré-remplir depuis bilan PDF"
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("operationType")}</h2>
              <div className="flex gap-2 mb-6">
                {([["immeuble", t("collectiveBuilding")], ["lotissement", t("subdivision")], ["maisons", t("individualHouses")]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setTypeOperation(val)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${typeOperation === val ? "bg-navy text-white" : "bg-background text-muted border border-card-border hover:bg-navy/5"}`}>
                    {label}
                  </button>
                ))}
              </div>

              <h2 className="mb-4 text-base font-semibold text-navy">{t("land")}</h2>
              <div className="space-y-4 mb-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label={t("totalLandCost")} value={surfaceTerrain * prixTerrainM2} onChange={(v) => setPrixTerrainM2(surfaceTerrain > 0 ? Number(v) / surfaceTerrain : 0)} suffix="€" />
                  <InputField label={t("landArea")} value={surfaceTerrain} onChange={(v) => setSurfaceTerrain(Number(v))} suffix="m²" />
                </div>
                {surfaceTerrain > 0 && prixTerrainM2 > 0 && (
                  <p className="text-xs text-muted">{t("landPricePerSqm", { price: formatEUR(prixTerrainM2) })}</p>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!coutTerrainConnu} onChange={(e) => setCoutTerrainConnu(!e.target.checked)} className="rounded" />
                  <label className="text-sm text-slate">{t("residualMode")}</label>
                </div>
              </div>

              <h2 className="mb-4 text-base font-semibold text-navy">{t("projectedRevenue")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("sellableArea")} value={surfaceVendable} onChange={(v) => setSurfaceVendable(Number(v))} suffix="m²" hint={t("sellableAreaHint")} />
                <InputField label={t("sellingPricePerSqm")} value={prixVenteM2} onChange={(v) => setPrixVenteM2(Number(v))} suffix="€" hint={t("sellingPricePerSqmHint")} />
                <InputField label={t("parkingCount")} value={nbParkings} onChange={(v) => setNbParkings(Number(v))} />
                <InputField label={t("parkingPrice")} value={prixParking} onChange={(v) => setPrixParking(Number(v))} suffix="€" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("constructionCosts")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("grossArea")} value={surfaceBrute} onChange={(v) => setSurfaceBrute(Number(v))} suffix="m²" hint={t("grossAreaHint")} />
                <InputField label={t("constructionCostPerSqm")} value={coutConstructionM2} onChange={(v) => setCoutConstructionM2(Number(v))} suffix="€" hint={t("constructionCostPerSqmHint")} />
                <InputField label={t("roadworks")} value={voirie} onChange={(v) => setVoirie(Number(v))} suffix="€" />
                <InputField label={t("miscStudies")} value={etudesAutres} onChange={(v) => setEtudesAutres(Number(v))} suffix="€" hint={t("miscStudiesHint")} />
                <InputField label={t("architectFees")} value={honorairesArchitecte} onChange={(v) => setHonorairesArchitecte(Number(v))} suffix={t("pctConstr")} hint={t("architectFeesHint")} step={0.5} />
                <InputField label={t("betFees")} value={honorairesBET} onChange={(v) => setHonorairesBET(Number(v))} suffix={t("pctConstr")} hint={t("betFeesHint")} step={0.5} />
                <InputField label={t("contingencies")} value={aleas} onChange={(v) => setAleas(Number(v))} suffix={t("pctConstr")} hint={t("contingenciesHint")} step={0.5} />
                {typeOperation !== "immeuble" && (<>
                  <InputField label={t("surveyorFees")} value={fraisGeometre} onChange={(v) => setFraisGeometre(Number(v))} suffix="€" hint={t("surveyorFeesHint")} />
                  <InputField label={t("subdivisionFees")} value={fraisLotissement} onChange={(v) => setFraisLotissement(Number(v))} suffix="€" hint={t("subdivisionFeesHint")} />
                  <InputField label={t("lotCount")} value={nbLots} onChange={(v) => setNbLots(Number(v))} hint={t("lotCountHint")} />
                </>)}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("promotionFees")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("commercialFees")} value={fraisCommerciaux} onChange={(v) => setFraisCommerciaux(Number(v))} suffix={t("pctCA")} hint={t("commercialFeesHint")} step={0.5} />
                <InputField label={t("financialFees")} value={fraisFinanciers} onChange={(v) => setFraisFinanciers(Number(v))} suffix={t("pctCosts")} hint={t("financialFeesHint")} step={0.5} />
                <InputField label={t("insurance")} value={assurances} onChange={(v) => setAssurances(Number(v))} suffix={t("pctConstr")} step={0.5} />
                <InputField label={t("managementFees")} value={fraisGestion} onChange={(v) => setFraisGestion(Number(v))} suffix={t("pctCA")} hint={t("managementFeesHint")} step={0.5} />
                <InputField label={t("preCommercialisation")} value={tauxPreCommercialisation} onChange={(v) => setTauxPreCommercialisation(Number(v))} suffix={t("pctSold")} min={0} max={100} hint={t("preCommercialisationHint")} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("developerMargin")}</h2>
              <InputField label={t("marginOnCA")} value={margePromoteur} onChange={(v) => setMargePromoteur(Number(v))} suffix="%" hint={t("marginOnCAHint")} step={1} />
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-6">
            {/* Charge foncière résiduelle */}
            <div className={`rounded-2xl p-8 text-center shadow-lg ${
              result.chargeFonciere > 0
                ? "bg-gradient-to-br from-navy to-navy-light text-white"
                : "bg-gradient-to-br from-error to-red-600 text-white"
            }`}>
              <div className="text-sm text-white/60">
                {coutTerrainConnu ? t("residualMargin") : t("maxLandCharge")}
              </div>
              <div className="mt-2 text-5xl font-bold">{formatEUR(result.chargeFonciere)}</div>
              <div className="mt-2 text-sm text-white/60">
                {coutTerrainConnu
                  ? t("landCostSummary", { cost: formatEUR(result.coutTerrain), perSqm: formatEUR(prixTerrainM2) })
                  : t("perSqmSellable", { price: formatEUR(result.chargeFonciereM2Terrain) })
                }
              </div>
              {result.chargeFonciere <= 0 && (
                <div className="mt-3 text-sm text-white/80">
                  {coutTerrainConnu ? t("notProfitableWithLand") : t("negativeLandCharge")}
                </div>
              )}
            </div>

            <ResultPanel
              title={t("residualCalculation")}
              lines={[
                { label: t("revenueHousing"), value: formatEUR(result.caLogements) },
                { label: t("revenueParking"), value: formatEUR(result.caParkings), sub: true },
                { label: t("totalRevenue"), value: formatEUR(result.caTotal), highlight: true },
                ...(coutTerrainConnu && result.coutTerrain > 0 ? [{ label: t("landLine", { perSqm: formatEUR(prixTerrainM2) }), value: `- ${formatEUR(result.coutTerrain)}` }] : []),
                { label: t("constructionLine", { pct: formatPct(result.ratioConstructionCA) }), value: `- ${formatEUR(result.totalConstruction)}` },
                { label: t("feesLine", { pct: formatPct(result.ratioFraisCA) }), value: `- ${formatEUR(result.totalFrais)}` },
                { label: t("marginLine", { pct: margePromoteur }), value: `- ${formatEUR(result.margeMontant)}` },
                { label: coutTerrainConnu ? t("equalsResidualMargin") : t("equalsMaxLandCharge"), value: formatEUR(result.chargeFonciere), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title={t("costDetail")}
              lines={[
                { label: t("grossConstruction", { area: surfaceBrute, cost: formatEUR(coutConstructionM2) }), value: formatEUR(result.coutsConstruction) },
                { label: t("roadworksShort"), value: formatEUR(result.coutsVoirie), sub: true },
                { label: t("architectLine", { pct: honorairesArchitecte }), value: formatEUR(result.coutsArchitecte), sub: true },
                { label: t("betLine", { pct: honorairesBET }), value: formatEUR(result.coutsBET), sub: true },
                { label: t("miscStudiesShort"), value: formatEUR(result.coutsEtudes), sub: true },
                { label: t("contingenciesLine", { pct: aleas }), value: formatEUR(result.coutsAleas), sub: true },
                { label: t("totalConstructionLabel"), value: formatEUR(result.totalConstruction), highlight: true },
                { label: t("commercialLine", { pct: fraisCommerciaux }), value: formatEUR(result.fCommerciaux), sub: true },
                { label: t("financialLine", { pct: fraisFinanciers }), value: formatEUR(result.fFinanciers), sub: true },
                { label: t("insuranceLine", { pct: assurances }), value: formatEUR(result.fAssurances), sub: true },
                { label: t("managementLine", { pct: fraisGestion }), value: formatEUR(result.fGestion), sub: true },
                { label: t("totalFeesLabel"), value: formatEUR(result.totalFrais), highlight: true },
              ]}
            />

            <ResultPanel
              title={t("ratios")}
              lines={[
                { label: t("landChargeOverCA"), value: formatPct(result.ratioFoncierCA), warning: result.ratioFoncierCA < 0.10 },
                { label: t("constructionOverCA"), value: formatPct(result.ratioConstructionCA) },
                { label: t("feesOverCA"), value: formatPct(result.ratioFraisCA) },
                { label: t("marginOverCA"), value: formatPct(result.margeEffective) },
                { label: t("returnOnEquity"), value: formatPct(result.rentaFP), sub: true },
              ]}
            />

            <div className="flex justify-end gap-2">
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `Bilan promoteur — ${surfaceVendable} m² — ${formatEUR(prixVenteM2)}/m²`,
                    type: "bilan-promoteur",
                    valeurPrincipale: result.chargeFonciere,
                    data: { surfaceVendable, prixVenteM2, nbParkings, prixParking, surfaceTerrain, prixTerrainM2, coutTerrainConnu, coutConstructionM2, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, fraisCommerciaux, fraisFinanciers, assurances, fraisGestion, aleas, margePromoteur, typeOperation },
                  });
                }}
                label="Sauvegarder"
                successLabel="Sauvegardé !"
              />
              <PdfButton
                label="PDF"
                filename={`bilan-promoteur-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                generateBlob={() =>
                  generateBilanPromoteurPdfBlob({
                    surfaceTerrain,
                    surfacePlancher: surfaceVendable,
                    prixVenteM2,
                    recettesTotales: result.caTotal,
                    coutConstruction: result.coutsConstruction,
                    coutHonoraires: result.coutsArchitecte + result.coutsBET + result.coutsEtudes,
                    coutFinancement: result.fFinanciers,
                    coutCommercialisation: result.fCommerciaux,
                    totalCouts: result.totalConstruction + result.totalFrais,
                    margeBrute: result.margeMontant,
                    margePct: result.margeEffective * 100,
                    chargeFonciere: result.chargeFonciere,
                    chargeFonciereM2: result.chargeFonciereM2Terrain,
                  })
                }
              />
            </div>
            <ShareLinkButton
              toolType="bilan-promoteur"
              defaultTitle={`Bilan promoteur ${typeOperation} — ${surfaceVendable} m²`}
              payload={{
                inputs: { typeOperation, surfaceVendable, prixVenteM2, nbParkings, prixParking, surfaceTerrain, prixTerrainM2, coutTerrainConnu, coutConstructionM2, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, fraisGeometre, fraisLotissement, nbLots, tauxPreCommercialisation, fraisCommerciaux, fraisFinanciers, assurances, fraisGestion, aleas, margePromoteur },
                results: result,
              }}
              className="mt-3"
            />

            <AiAnalysisCard
              context={[
                `Type opération: ${typeOperation}`,
                `Surface vendable: ${surfaceVendable} m²`,
                `Prix vente: ${prixVenteM2} €/m²`,
                `Parkings: ${nbParkings} × ${prixParking} €`,
                `CA total projeté: ${formatEUR(result.caTotal)}`,
                `Terrain: ${coutTerrainConnu ? `${formatEUR(result.coutTerrain)} (${prixTerrainM2} €/m² × ${surfaceTerrain} m²)` : "en compte à rebours"}`,
                `Surface brute: ${surfaceBrute} m² × ${coutConstructionM2} €/m² = ${formatEUR(result.coutsConstruction)}`,
                `Total coûts construction: ${formatEUR(result.totalConstruction)} (${formatPct(result.ratioConstructionCA)} du CA)`,
                `Frais promoteur: ${formatEUR(result.totalFrais)} (${formatPct(result.ratioFraisCA)} du CA)`,
                `Aléas: ${aleas}% de construction`,
                `Pré-commercialisation: ${tauxPreCommercialisation}%`,
                `Marge promoteur visée: ${margePromoteur}% = ${formatEUR(result.margeMontant)}`,
                `Charge foncière résiduelle: ${formatEUR(result.chargeFonciere)} (${formatPct(result.ratioFoncierCA)} du CA)`,
                `Rentabilité fonds propres estimée: ${formatPct(result.rentaFP)}`,
                `Besoin max trésorerie: ${treasuryPlan.peakNeed < 0 ? `${formatEUR(Math.abs(treasuryPlan.peakNeed))} en ${treasuryPlan.peakQuarter}` : "aucun (auto-financé VEFA)"}`,
              ].join("\n")}
              prompt="Analyse ce bilan promoteur luxembourgeois en mode pré-acquisition. Donne un diagnostic professionnel : (1) viabilité du montage et cohérence des ratios, (2) risques identifiés (marché, coûts, financement, pré-commercialisation), (3) points faibles à négocier ou sécuriser, (4) recommandations d'ajustement. Réfère-toi aux standards du marché LU (ratio charge foncière 10-20% du CA, marge promoteur 10-18%)."
            />

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                {t("methodNote")}
              </p>
            </div>

            {/* Plan de trésorerie */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-navy">{t("treasuryPlanTitle")}</h3>
              <p className="mb-4 text-xs text-muted">
                {t("treasuryPlanDesc", { pct: tauxPreCommercialisation })}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border text-left">
                      <th className="py-2 pr-3 font-semibold text-slate">{t("quarter")}</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">{t("cumExpenditure")}</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">{t("cumRevenue")}</th>
                      <th className="py-2 pl-3 font-semibold text-slate text-right">{t("netPosition")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treasuryPlan.quarterlyData.map((row, i) => {
                      const isPeak = row.netPosition === treasuryPlan.peakNeed && treasuryPlan.peakNeed < 0;
                      return (
                        <tr key={i} className={`border-b border-card-border/50 ${isPeak ? "bg-red-50" : ""}`}>
                          <td className="py-2 pr-3 font-medium text-slate">{row.quarter}</td>
                          <td className="py-2 px-3 text-right font-mono text-muted">{formatEUR(row.cumExpenditure)}</td>
                          <td className="py-2 px-3 text-right font-mono text-success">{formatEUR(row.cumRevenue)}</td>
                          <td className={`py-2 pl-3 text-right font-mono font-semibold ${row.netPosition >= 0 ? "text-success" : "text-error"}`}>
                            {formatEUR(row.netPosition)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {treasuryPlan.peakNeed < 0 && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-800">
                    {t("maxFinancingNeed", { amount: formatEUR(Math.abs(treasuryPlan.peakNeed)), quarter: treasuryPlan.peakQuarter })}
                  </p>
                </div>
              )}
              {treasuryPlan.peakNeed >= 0 && (
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs text-green-800">
                    {t("noFinancingNeed")}
                  </p>
                </div>
              )}
            </div>

            {/* Multi-tranches (phasage) */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold text-navy">{t("multiTranchesTitle")}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t("multiTranchesSubtitle")}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={multiTranchesActive}
                    onChange={(e) => setMultiTranchesActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-slate">{t("multiTranchesEnable")}</span>
                </label>
              </div>

              {multiTranchesActive && (() => {
                const t1Pct = Math.max(0, Math.min(100, trancheT1Pct));
                const t2Pct = Math.max(0, Math.min(100 - t1Pct, trancheT2Pct));
                const t3Pct = Math.max(0, 100 - t1Pct - t2Pct);
                const tranches = [
                  { label: "T1", pct: t1Pct, offset: trancheT1Offset, color: "bg-emerald-500" },
                  { label: "T2", pct: t2Pct, offset: trancheT2Offset, color: "bg-sky-500" },
                  { label: "T3", pct: t3Pct, offset: trancheT3Offset, color: "bg-amber-500" },
                ];

                // Consolidated monthly treasury across all 3 tranches over 48 months
                const horizonMois = 48;
                const monthlyData: { m: number; exp: number; rev: number; net: number; cumul: number }[] = [];
                let cumul = 0;
                for (let m = 1; m <= horizonMois; m++) {
                  let exp = 0;
                  let rev = 0;
                  for (const tr of tranches) {
                    if (tr.pct === 0) continue;
                    const mLocal = m - tr.offset;
                    if (mLocal < 1 || mLocal > 24) continue;
                    const trancheTotal = (result.totalConstruction + result.coutTerrain) * (tr.pct / 100);
                    // Construction répartie uniformément sur 24 mois
                    exp += trancheTotal / 24;
                    // Terrain : payé au mois 1 de la tranche
                    if (mLocal === 1 && result.coutTerrain > 0) {
                      exp += result.coutTerrain * (tr.pct / 100) - result.coutTerrain * (tr.pct / 100) / 24;
                    }
                    // Revenue : VEFA tranches × pré-commercialisation × part de la tranche
                    for (const v of vefaSchedule) {
                      if (v.month === mLocal) {
                        rev += result.caTotal * (tr.pct / 100) * (tauxPreCommercialisation / 100) * (v.pct / 100);
                      }
                    }
                  }
                  const net = rev - exp;
                  cumul += net;
                  monthlyData.push({ m, exp, rev, net, cumul });
                }
                const peakNeed = Math.min(...monthlyData.map((d) => d.cumul));
                const peakMonth = monthlyData.find((d) => d.cumul === peakNeed)?.m ?? 0;
                const totalEnd = monthlyData[monthlyData.length - 1]?.cumul ?? 0;

                return (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs text-muted mb-1">{t("trancheT1")} ({t1Pct} %)</label>
                        <input type="range" min={0} max={100} value={trancheT1Pct} onChange={(e) => setTrancheT1Pct(Number(e.target.value))} className="w-full" />
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                          <span>{t("multiOffset")}</span>
                          <input type="number" value={trancheT1Offset} onChange={(e) => setTrancheT1Offset(Number(e.target.value))} min={0} max={48} className="w-14 rounded border border-input-border bg-input-bg px-1 py-0.5 text-right font-mono" /> {t("multiMonths")}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">{t("trancheT2")} ({t2Pct} %)</label>
                        <input type="range" min={0} max={100 - t1Pct} value={trancheT2Pct} onChange={(e) => setTrancheT2Pct(Number(e.target.value))} className="w-full" />
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                          <span>{t("multiOffset")}</span>
                          <input type="number" value={trancheT2Offset} onChange={(e) => setTrancheT2Offset(Number(e.target.value))} min={0} max={48} className="w-14 rounded border border-input-border bg-input-bg px-1 py-0.5 text-right font-mono" /> {t("multiMonths")}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">{t("trancheT3")} ({t3Pct} %)</label>
                        <div className="text-[10px] text-muted">{t("multiAuto")}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                          <span>{t("multiOffset")}</span>
                          <input type="number" value={trancheT3Offset} onChange={(e) => setTrancheT3Offset(Number(e.target.value))} min={0} max={48} className="w-14 rounded border border-input-border bg-input-bg px-1 py-0.5 text-right font-mono" /> {t("multiMonths")}
                        </div>
                      </div>
                    </div>

                    {/* Table par tranche */}
                    <div className="overflow-x-auto rounded-lg border border-card-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-card-border bg-background">
                            <th className="px-2 py-1.5 text-left font-semibold text-slate">{t("multiTrancheCol")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-slate">{t("multiPct")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-slate">{t("multiCA")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-slate">{t("multiCoutsConstr")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-slate">{t("multiMarge")}</th>
                            <th className="px-2 py-1.5 text-left font-semibold text-slate">{t("multiPeriode")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tranches.map((tr) => {
                            const ca = result.caTotal * (tr.pct / 100);
                            const coutConstr = (result.totalConstruction + result.coutTerrain) * (tr.pct / 100);
                            const marge = result.margeMontant * (tr.pct / 100);
                            return (
                              <tr key={tr.label} className="border-b border-card-border/50">
                                <td className="px-2 py-1.5 font-semibold">
                                  <span className={`inline-block w-2 h-2 rounded-full ${tr.color} mr-1.5`} />
                                  {tr.label}
                                </td>
                                <td className="px-2 py-1.5 text-right font-mono">{tr.pct} %</td>
                                <td className="px-2 py-1.5 text-right font-mono">{formatEUR(ca)}</td>
                                <td className="px-2 py-1.5 text-right font-mono text-muted">{formatEUR(coutConstr)}</td>
                                <td className="px-2 py-1.5 text-right font-mono text-emerald-700">{formatEUR(marge)}</td>
                                <td className="px-2 py-1.5 text-[11px] text-muted font-mono">M{tr.offset + 1} → M{tr.offset + 24}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Gantt-like visualization : 48 mois */}
                    <div>
                      <div className="mb-2 text-xs font-semibold text-slate">{t("multiGantt")}</div>
                      <div className="space-y-1">
                        {tranches.map((tr) => (
                          <div key={tr.label} className="flex items-center gap-2">
                            <span className="w-7 text-xs font-semibold text-slate">{tr.label}</span>
                            <div className="flex-1 relative h-4 bg-background rounded border border-card-border/50 overflow-hidden">
                              {tr.pct > 0 && (
                                <div
                                  className={`absolute top-0 h-full ${tr.color} opacity-80`}
                                  style={{
                                    left: `${(tr.offset / horizonMois) * 100}%`,
                                    width: `${Math.min(100, (24 / horizonMois) * 100)}%`,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="w-7 text-[10px] text-muted">M</span>
                          <div className="flex-1 flex text-[10px] text-muted font-mono">
                            {[0, 12, 24, 36, 48].map((m) => (
                              <span key={m} style={{ flex: 1 }}>{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Besoin financement consolidé */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`rounded-lg p-3 border ${peakNeed < 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                        <div className="text-[10px] uppercase text-muted">{t("multiPeakNeed")}</div>
                        <div className={`mt-0.5 text-sm font-mono font-bold ${peakNeed < 0 ? "text-amber-900" : "text-emerald-900"}`}>
                          {peakNeed < 0 ? formatEUR(Math.abs(peakNeed)) : t("multiNoPeak")}
                        </div>
                        <div className="text-[10px] text-muted">M{peakMonth}</div>
                      </div>
                      <div className="rounded-lg p-3 border bg-navy/5 border-navy/20">
                        <div className="text-[10px] uppercase text-muted">{t("multiCumulEnd")}</div>
                        <div className={`mt-0.5 text-sm font-mono font-bold ${totalEnd >= 0 ? "text-navy" : "text-rose-700"}`}>
                          {formatEUR(totalEnd)}
                        </div>
                        <div className="text-[10px] text-muted">M{horizonMois}</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted">{t("multiNote")}</p>
                  </div>
                );
              })()}
              {!multiTranchesActive && (
                <p className="text-xs text-muted italic">{t("multiTranchesHelp")}</p>
              )}
            </div>

            {/* Suivi d'exécution : prévisionnel vs réel */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold text-navy">{t("suiviExecutionTitle")}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t("suiviExecutionSubtitle")}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={suiviExecutionActive}
                    onChange={(e) => setSuiviExecutionActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-slate">{t("suiviExecutionEnable")}</span>
                </label>
              </div>

              {suiviExecutionActive && (() => {
                // Prévisionnel : construction / 24 + terrain Q1
                const totalCoutPrevisionnel = result.totalConstruction + result.coutTerrain;
                const coutMensuelPrevisionnel = result.totalConstruction / 24;
                const moisAffiches = 24;

                const rows = [];
                let cumulPrev = 0;
                let cumulReel = 0;
                for (let m = 1; m <= moisAffiches; m++) {
                  const prevMois = coutMensuelPrevisionnel + (m === 1 ? result.coutTerrain : 0);
                  const reelMois = coutsReelsParMois[m] ?? 0;
                  cumulPrev += prevMois;
                  cumulReel += reelMois;
                  rows.push({ mois: m, prevMois, reelMois, cumulPrev, cumulReel, ecart: cumulReel - cumulPrev });
                }
                const ecartFinal = cumulReel - totalCoutPrevisionnel;
                const ecartPctFinal = totalCoutPrevisionnel > 0 ? (ecartFinal / totalCoutPrevisionnel) * 100 : 0;
                const moisSaisis = Object.keys(coutsReelsParMois).filter((k) => (coutsReelsParMois[Number(k)] ?? 0) > 0).length;

                return (
                  <div className="space-y-4">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-card-border bg-background p-3 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-muted">{t("suiviPrevisionnel")}</div>
                        <div className="mt-1 text-sm font-mono font-bold text-navy">{formatEUR(totalCoutPrevisionnel)}</div>
                      </div>
                      <div className="rounded-lg border border-card-border bg-background p-3 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-muted">{t("suiviReelSaisi")}</div>
                        <div className="mt-1 text-sm font-mono font-bold text-navy">{formatEUR(cumulReel)}</div>
                        <div className="text-[10px] text-muted">{moisSaisis}/{moisAffiches} mois</div>
                      </div>
                      <div className={`rounded-lg border p-3 text-center ${
                        Math.abs(ecartPctFinal) < 5 ? "border-emerald-200 bg-emerald-50"
                          : Math.abs(ecartPctFinal) < 15 ? "border-amber-200 bg-amber-50"
                            : "border-rose-200 bg-rose-50"
                      }`}>
                        <div className="text-[10px] uppercase tracking-wider text-muted">{t("suiviEcart")}</div>
                        <div className={`mt-1 text-sm font-mono font-bold ${
                          ecartFinal > 0 ? "text-rose-900" : ecartFinal < 0 ? "text-emerald-900" : "text-navy"
                        }`}>
                          {ecartFinal > 0 ? "+" : ""}{formatEUR(ecartFinal)}
                        </div>
                        <div className={`text-[10px] ${ecartPctFinal > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                          {ecartPctFinal > 0 ? "+" : ""}{ecartPctFinal.toFixed(1)} %
                        </div>
                      </div>
                      <div className="rounded-lg border border-card-border bg-background p-3 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-muted">{t("suiviMargeImpactee")}</div>
                        <div className="mt-1 text-sm font-mono font-bold text-navy">
                          {formatEUR(result.margeMontant - Math.max(0, ecartFinal))}
                        </div>
                      </div>
                    </div>

                    {/* Table mois par mois */}
                    <div className="overflow-x-auto rounded-lg border border-card-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-card-border bg-background">
                            <th className="px-2 py-1.5 text-left font-semibold">{t("suiviColMois")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold">{t("suiviColPrevu")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold">{t("suiviColReel")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold">{t("suiviColCumulPrev")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold">{t("suiviColCumulReel")}</th>
                            <th className="px-2 py-1.5 text-right font-semibold">{t("suiviColEcart")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.mois} className="border-b border-card-border/40">
                              <td className="px-2 py-1 font-medium">M{r.mois}</td>
                              <td className="px-2 py-1 text-right font-mono text-muted">{formatEUR(r.prevMois)}</td>
                              <td className="px-2 py-1 text-right">
                                <input
                                  type="number"
                                  value={coutsReelsParMois[r.mois] ?? ""}
                                  onChange={(e) => updateCoutReel(r.mois, Number(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-24 rounded border border-input-border bg-input-bg px-2 py-0.5 text-xs text-right font-mono"
                                />
                              </td>
                              <td className="px-2 py-1 text-right font-mono">{formatEUR(r.cumulPrev)}</td>
                              <td className="px-2 py-1 text-right font-mono">{formatEUR(r.cumulReel)}</td>
                              <td className={`px-2 py-1 text-right font-mono ${
                                r.ecart > 0 ? "text-rose-700" : r.ecart < 0 ? "text-emerald-700" : "text-muted"
                              }`}>
                                {r.ecart > 0 ? "+" : ""}{formatEUR(r.ecart)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-muted">{t("suiviNote")}</p>
                  </div>
                );
              })()}
              {!suiviExecutionActive && (
                <p className="text-xs text-muted italic">{t("suiviExecutionHelp")}</p>
              )}
            </div>

            {/* Analyse de sensibilité */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-navy">{t("sensitivityTitle")}</h3>
              <p className="mb-4 text-xs text-muted">{t("sensitivityDesc")}</p>

              {/* Matrix 1: Prix de vente vs Coût construction */}
              <h4 className="mb-2 text-sm font-semibold text-slate">{t("sensitivityPrixConstr")}</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-2 pr-2 text-left font-semibold text-slate">
                        {t("sensitivitySalePrice")} ↓ / {t("sensitivityConstrCost")} →
                      </th>
                      {[coutConstructionM2 * 0.9, coutConstructionM2, coutConstructionM2 * 1.1].map((cc, j) => (
                        <th key={j} className={`py-2 px-2 text-center font-semibold ${j === 1 ? "text-navy" : "text-slate"}`}>
                          {formatEUR(Math.round(cc))}
                          {j === 0 && <span className="block text-[10px] text-muted">−10 %</span>}
                          {j === 1 && <span className="block text-[10px] text-navy/60">{t("sensitivityCurrent")}</span>}
                          {j === 2 && <span className="block text-[10px] text-muted">+10 %</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[prixVenteM2 * 0.9, prixVenteM2, prixVenteM2 * 1.1].map((pv, i) => (
                      <tr key={i} className="border-b border-card-border/50">
                        <td className={`py-2 pr-2 font-medium ${i === 1 ? "text-navy" : "text-slate"}`}>
                          {formatEUR(Math.round(pv))}
                          {i === 0 && <span className="ml-1 text-[10px] text-muted">−10 %</span>}
                          {i === 1 && <span className="ml-1 text-[10px] text-navy/60">{t("sensitivityCurrent")}</span>}
                          {i === 2 && <span className="ml-1 text-[10px] text-muted">+10 %</span>}
                        </td>
                        {sensitivityPrixConstr[i].map((cell, j) => {
                          const bg = cell.margeEffective > 15 ? "bg-green-100 text-green-800" : cell.margeEffective >= 5 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
                          const isCurrent = i === 1 && j === 1;
                          return (
                            <td key={j} className={`py-2 px-2 text-center font-mono ${bg} ${isCurrent ? "ring-2 ring-navy/30 font-bold" : ""}`}>
                              <div>{cell.margeEffective.toFixed(1)} %</div>
                              <div className="text-[10px] opacity-70">{formatEUR(Math.round(cell.chargeFonciere))}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Matrix 2: Prix de vente vs Taux de financement */}
              <h4 className="mb-2 text-sm font-semibold text-slate">{t("sensitivityPrixTaux")}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-2 pr-2 text-left font-semibold text-slate">
                        {t("sensitivitySalePrice")} ↓ / {t("sensitivityFinRate")} →
                      </th>
                      {[fraisFinanciers - 1, fraisFinanciers, fraisFinanciers + 1].map((tf, j) => (
                        <th key={j} className={`py-2 px-2 text-center font-semibold ${j === 1 ? "text-navy" : "text-slate"}`}>
                          {tf.toFixed(1)} %
                          {j === 0 && <span className="block text-[10px] text-muted">−1 pt</span>}
                          {j === 1 && <span className="block text-[10px] text-navy/60">{t("sensitivityCurrent")}</span>}
                          {j === 2 && <span className="block text-[10px] text-muted">+1 pt</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[prixVenteM2 * 0.9, prixVenteM2, prixVenteM2 * 1.1].map((pv, i) => (
                      <tr key={i} className="border-b border-card-border/50">
                        <td className={`py-2 pr-2 font-medium ${i === 1 ? "text-navy" : "text-slate"}`}>
                          {formatEUR(Math.round(pv))}
                          {i === 0 && <span className="ml-1 text-[10px] text-muted">−10 %</span>}
                          {i === 1 && <span className="ml-1 text-[10px] text-navy/60">{t("sensitivityCurrent")}</span>}
                          {i === 2 && <span className="ml-1 text-[10px] text-muted">+10 %</span>}
                        </td>
                        {sensitivityPrixTaux[i].map((cell, j) => {
                          const bg = cell.margeEffective > 15 ? "bg-green-100 text-green-800" : cell.margeEffective >= 5 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
                          const isCurrent = i === 1 && j === 1;
                          return (
                            <td key={j} className={`py-2 px-2 text-center font-mono ${bg} ${isCurrent ? "ring-2 ring-navy/30 font-bold" : ""}`}>
                              <div>{cell.margeEffective.toFixed(1)} %</div>
                              <div className="text-[10px] opacity-70">{formatEUR(Math.round(cell.chargeFonciere))}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-3 text-[10px] text-muted">
                <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-green-200" /> {t("sensitivityGreen")}</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-amber-200" /> {t("sensitivityYellow")}</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-red-200" /> {t("sensitivityRed")}</span>
              </div>

              {/* Tornado chart */}
              <div className="mt-6 border-t border-card-border pt-4">
                <h4 className="mb-1 text-sm font-semibold text-slate">{t("tornadoTitle")}</h4>
                <p className="mb-3 text-[11px] text-muted">{t("tornadoSubtitle")}</p>
                <div className="space-y-1.5">
                  {tornadoData.map((row) => {
                    const lowPct = (row.low / tornadoMax) * 50;
                    const highPct = (row.high / tornadoMax) * 50;
                    return (
                      <div key={row.labelKey} className="grid grid-cols-[120px_1fr_110px] items-center gap-2 text-[11px]">
                        <div className="text-right text-slate truncate" title={t(row.labelKey)}>{t(row.labelKey)}</div>
                        <div className="relative h-5 bg-slate-50 rounded">
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300" />
                          {row.low < 0 && (
                            <div
                              className="absolute top-0 bottom-0 bg-rose-400/70 rounded-l"
                              style={{ right: "50%", width: `${Math.abs(lowPct)}%` }}
                            />
                          )}
                          {row.high > 0 && (
                            <div
                              className="absolute top-0 bottom-0 bg-emerald-400/70 rounded-r"
                              style={{ left: "50%", width: `${highPct}%` }}
                            />
                          )}
                          {row.low > 0 && (
                            <div
                              className="absolute top-0 bottom-0 bg-emerald-300/70"
                              style={{ left: `${50 + lowPct}%`, width: `${highPct - lowPct}%` }}
                            />
                          )}
                          {row.high < 0 && (
                            <div
                              className="absolute top-0 bottom-0 bg-rose-300/70"
                              style={{ right: `${50 - highPct}%`, width: `${lowPct - highPct}%` }}
                            />
                          )}
                        </div>
                        <div className="text-right font-mono text-muted tabular-nums">
                          {formatEUR(Math.round(row.low))} / {formatEUR(Math.round(row.high))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[10px] text-muted">{t("tornadoNote")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scénarios multiples — comparaison côte-à-côte */}
        <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="text-base font-semibold text-navy">{t("scenariosTitle")}</h2>
              <p className="mt-0.5 text-[11px] text-muted">{t("scenariosSubtitle")}</p>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder={t("scenarioNamePlaceholder")}
                className="rounded-md border border-input-border bg-input-bg px-2 py-1.5 text-xs w-48"
              />
              <button
                onClick={saveScenario}
                disabled={!scenarioName.trim()}
                className="rounded-lg bg-navy text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:bg-navy-light"
              >
                {t("scenarioSave")}
              </button>
            </div>
          </div>

          {scenarios.length === 0 ? (
            <p className="rounded-lg border border-dashed border-card-border bg-background p-4 text-center text-xs text-muted">
              {t("scenariosEmpty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t("scnName")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("scnPrixVente")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("scnCoutConstr")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("scnMarge")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("scnCaTotal")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("scnChargeFonciere")}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t("scnRatioFoncier")}</th>
                    <th className="px-3 py-2 text-center font-semibold">{t("scnActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row: scénario courant */}
                  <tr className="border-t border-card-border bg-emerald-50/50">
                    <td className="px-3 py-2 font-semibold text-emerald-800">
                      {t("scnCurrent")}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{prixVenteM2.toLocaleString("fr-LU")}</td>
                    <td className="px-3 py-2 text-right font-mono">{coutConstructionM2.toLocaleString("fr-LU")}</td>
                    <td className="px-3 py-2 text-right font-mono">{margePromoteur} %</td>
                    <td className="px-3 py-2 text-right font-mono">{formatEUR(result.caTotal)}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(result.chargeFonciere)}</td>
                    <td className="px-3 py-2 text-right font-mono">{(result.ratioFoncierCA * 100).toFixed(1)} %</td>
                    <td className="px-3 py-2 text-center text-muted">—</td>
                  </tr>
                  {scenarios.map((s) => {
                    const deltaCF = s.chargeFonciere - result.chargeFonciere;
                    const deltaPct = result.chargeFonciere > 0 ? (deltaCF / result.chargeFonciere) * 100 : 0;
                    return (
                      <tr key={s.id} className="border-t border-card-border">
                        <td className="px-3 py-2">
                          <div className="font-medium text-navy">{s.name}</div>
                          <div className="text-[10px] text-muted">{new Date(s.date).toLocaleDateString("fr-LU")}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{s.prixVenteM2.toLocaleString("fr-LU")}</td>
                        <td className="px-3 py-2 text-right font-mono">{s.coutConstructionM2.toLocaleString("fr-LU")}</td>
                        <td className="px-3 py-2 text-right font-mono">{s.margePromoteur} %</td>
                        <td className="px-3 py-2 text-right font-mono">{formatEUR(s.caTotal)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatEUR(s.chargeFonciere)}
                          {result.chargeFonciere > 0 && (
                            <div className={`text-[10px] font-normal ${deltaCF >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {deltaCF > 0 ? "+" : ""}{deltaPct.toFixed(1)} %
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{(s.ratioFoncierCA * 100).toFixed(1)} %</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => loadScenario(s)}
                              className="rounded px-1.5 py-0.5 text-[10px] border border-navy text-navy hover:bg-navy/5"
                              title={t("scnLoad")}
                            >
                              {t("scnLoadShort")}
                            </button>
                            <button
                              onClick={() => deleteScenario(s.id)}
                              className="rounded px-1.5 py-0.5 text-[10px] border border-rose-300 text-rose-700 hover:bg-rose-50"
                              title={t("scnDelete")}
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-[10px] text-muted">{t("scenariosNote")}</p>
            </div>
          )}
        </div>
      </div>

      <SEOContent
        ns="bilanPromoteur"
        sections={[
          { titleKey: "faisabiliteTitle", contentKey: "faisabiliteContent" },
          { titleKey: "compteAReboursTitle", contentKey: "compteAReboursContent" },
          { titleKey: "coutsTitle", contentKey: "coutsContent" },
          { titleKey: "margeTitle", contentKey: "margeContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/estimateur-construction", labelKey: "estimateurConstruction" },
          { href: "/calculateur-vrd", labelKey: "calculateurVrd" },
          { href: "/valorisation", labelKey: "valorisation" },
        ]}
      />
    </div>
  );
}
