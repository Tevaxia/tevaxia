"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";
import { generateBilanPromoteurPdfBlob, PdfButton } from "@/components/ToolsPdf";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";

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
    const months = 24;
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
  }, [surfaceVendable, prixVenteM2, nbParkings, prixParking, coutConstructionM2, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, aleas, margePromoteur, surfaceTerrain, prixTerrainM2, coutTerrainConnu, typeOperation, fraisGeometre, fraisLotissement, tauxPreCommercialisation, vefaSchedule]);

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

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
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
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
