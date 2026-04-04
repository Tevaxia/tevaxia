"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";

export default function BilanPromoteur() {
  // Revenue
  // Operation type
  const [typeOperation, setTypeOperation] = useState<"immeuble" | "lotissement" | "maisons">("immeuble");

  const [surfaceVendable, setSurfaceVendable] = useState(2000);
  const [prixVenteM2, setPrixVenteM2] = useState(8500);
  const [nbParkings, setNbParkings] = useState(30);
  const [prixParking, setPrixParking] = useState(35000);

  // Land
  const [surfaceTerrain, setSurfaceTerrain] = useState(3000);
  const [prixTerrainM2, setPrixTerrainM2] = useState(0); // 0 = residual method, otherwise known cost
  const [coutTerrainConnu, setCoutTerrainConnu] = useState(false);

  // Construction costs
  const [coutConstructionM2, setCoutConstructionM2] = useState(2800);
  const [surfaceBrute, setSurfaceBrute] = useState(2800);
  const [voirie, setVoirie] = useState(200000);
  const [honorairesArchitecte, setHonorairesArchitecte] = useState(8);
  const [honorairesBET, setHonorairesBET] = useState(4);
  const [etudesAutres, setEtudesAutres] = useState(50000);

  // Lotissement / individual houses specific fees
  const [fraisGeometre, setFraisGeometre] = useState(typeOperation !== "immeuble" ? 15000 : 0);
  const [fraisLotissement, setFraisLotissement] = useState(typeOperation !== "immeuble" ? 30000 : 0);
  const [nbLots, setNbLots] = useState(typeOperation !== "immeuble" ? 6 : 0);

  // Pre-sales
  const [tauxPreCommercialisation, setTauxPreCommercialisation] = useState(50); // % pre-sold

  // Developer fees
  const [fraisCommerciaux, setFraisCommerciaux] = useState(3); // % revenue
  const [fraisFinanciers, setFraisFinanciers] = useState(3); // % total cost
  const [assurances, setAssurances] = useState(1.5); // % construction costs
  const [fraisGestion, setFraisGestion] = useState(2); // % revenue
  const [aleas, setAleas] = useState(5); // % construction costs

  // Margin
  const [margePromoteur, setMargePromoteur] = useState(15); // % revenue

  // Treasury plan — VEFA call schedule (standard LU)
  // 5% / 15% / 20% / 20% / 15% / 15% / 10% spread across 24 months
  const vefaSchedule = useMemo(() => {
    // 7 tranches spread across 24 months
    // Each tranche is triggered at a specific month milestone
    const tranches = [
      { month: 1, pct: 5, label: "Signing" },
      { month: 4, pct: 15, label: "Foundations" },
      { month: 8, pct: 20, label: "Ground floor slab" },
      { month: 12, pct: 20, label: "Watertight" },
      { month: 16, pct: 15, label: "Partitions" },
      { month: 20, pct: 15, label: "Finishing" },
      { month: 24, pct: 10, label: "Delivery" },
    ];
    return tranches;
  }, []);

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

    // Land cost
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
      const label = `Q${q} (M${startMonth}-${endMonth})`;

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
    // REVENUE
    const caLogements = surfaceVendable * prixVenteM2;
    const caParkings = nbParkings * prixParking;
    const caTotal = caLogements + caParkings;

    // LAND (if known cost)
    const coutTerrain = coutTerrainConnu ? surfaceTerrain * prixTerrainM2 : 0;

    // CONSTRUCTION COSTS
    const coutsConstruction = surfaceBrute * coutConstructionM2;
    const coutsVoirie = voirie;
    const coutsArchitecte = coutsConstruction * (honorairesArchitecte / 100);
    const coutsBET = coutsConstruction * (honorairesBET / 100);
    const coutsEtudes = etudesAutres;
    const coutsAleas = coutsConstruction * (aleas / 100);
    const coutsLotissement = typeOperation !== "immeuble" ? fraisGeometre + fraisLotissement : 0;
    const totalConstruction = coutsConstruction + coutsVoirie + coutsArchitecte + coutsBET + coutsEtudes + coutsAleas + coutsLotissement;

    // DEVELOPER FEES
    const fCommerciaux = caTotal * (fraisCommerciaux / 100);
    const fFinanciers = (totalConstruction + caTotal * margePromoteur / 100) * (fraisFinanciers / 100); // On committed cost
    const fAssurances = coutsConstruction * (assurances / 100);
    const fGestion = caTotal * (fraisGestion / 100);
    const totalFrais = fCommerciaux + fFinanciers + fAssurances + fGestion;

    // MARGIN
    const margeMontant = caTotal * (margePromoteur / 100);

    // RESIDUAL LAND CHARGE = Revenue - Construction - Fees - Margin
    // If land known: residual margin = Revenue - land - construction - fees - margin
    // If land unknown (residual method): max land charge = Revenue - construction - fees - margin
    const chargeFonciere = caTotal - totalConstruction - totalFrais - margeMontant - coutTerrain;
    const chargeFonciereM2Terrain = surfaceVendable > 0 ? chargeFonciere / surfaceVendable : 0;

    // Ratios
    const ratioFoncierCA = caTotal > 0 ? chargeFonciere / caTotal : 0;
    const ratioConstructionCA = caTotal > 0 ? totalConstruction / caTotal : 0;
    const ratioFraisCA = caTotal > 0 ? totalFrais / caTotal : 0;
    const margeEffective = caTotal > 0 ? margeMontant / caTotal : 0;

    // Return on equity (estimate)
    const fondsPropreEstimes = chargeFonciere + caTotal * 0.10; // ~10% of revenue as equity
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

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Developer Feasibility Study</h1>
          <p className="mt-2 text-muted">
            Residual method — Determine the maximum land charge from the sale price
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Operation type</h2>
              <div className="flex gap-2 mb-6">
                {([["immeuble", "Apartment building"], ["lotissement", "Lotissement"], ["maisons", "Individual houses"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setTypeOperation(val)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${typeOperation === val ? "bg-navy text-white" : "bg-background text-muted border border-card-border hover:bg-navy/5"}`}>
                    {label}
                  </button>
                ))}
              </div>

              <h2 className="mb-4 text-base font-semibold text-navy">Land</h2>
              <div className="space-y-4 mb-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label="Total land cost" value={surfaceTerrain * prixTerrainM2} onChange={(v) => setPrixTerrainM2(surfaceTerrain > 0 ? Number(v) / surfaceTerrain : 0)} suffix="EUR" />
                  <InputField label="Land area" value={surfaceTerrain} onChange={(v) => setSurfaceTerrain(Number(v))} suffix="m²" />
                </div>
                {surfaceTerrain > 0 && prixTerrainM2 > 0 && (
                  <p className="text-xs text-muted">i.e. {formatEUR(prixTerrainM2)}/m² of land</p>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!coutTerrainConnu} onChange={(e) => setCoutTerrainConnu(!e.target.checked)} className="rounded" />
                  <label className="text-sm text-slate">Residual method mode (unknown land — calculate max land charge)</label>
                </div>
              </div>

              <h2 className="mb-4 text-base font-semibold text-navy">Projected revenue</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Sellable area" value={surfaceVendable} onChange={(v) => setSurfaceVendable(Number(v))} suffix="m²" hint="Total sellable living area" />
                <InputField label="Sale price /m²" value={prixVenteM2} onChange={(v) => setPrixVenteM2(Number(v))} suffix="EUR" hint="Average exit price incl. VAT" />
                <InputField label="Number of parking spaces" value={nbParkings} onChange={(v) => setNbParkings(Number(v))} />
                <InputField label="Price per parking space" value={prixParking} onChange={(v) => setPrixParking(Number(v))} suffix="EUR" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Construction costs</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Gross area (SHOB)" value={surfaceBrute} onChange={(v) => setSurfaceBrute(Number(v))} suffix="m²" hint="Including common areas, parking" />
                <InputField label="Construction cost /m² gross" value={coutConstructionM2} onChange={(v) => setCoutConstructionM2(Number(v))} suffix="EUR" hint="Adjustable — LU: 2,500-3,500 EUR/m²" />
                <InputField label="Roads & utilities" value={voirie} onChange={(v) => setVoirie(Number(v))} suffix="EUR" />
                <InputField label="Miscellaneous studies" value={etudesAutres} onChange={(v) => setEtudesAutres(Number(v))} suffix="EUR" hint="Surveyor, soil, environmental..." />
                <InputField label="Architect fees" value={honorairesArchitecte} onChange={(v) => setHonorairesArchitecte(Number(v))} suffix="% constr." hint="Adjustable — typically 7-10%" step={0.5} />
                <InputField label="Engineering fees" value={honorairesBET} onChange={(v) => setHonorairesBET(Number(v))} suffix="% constr." hint="Technical engineering consultancy" step={0.5} />
                <InputField label="Contingencies" value={aleas} onChange={(v) => setAleas(Number(v))} suffix="% constr." hint="Adjustable — 3 to 8%" step={0.5} />
                {typeOperation !== "immeuble" && (<>
                  <InputField label="Surveyor / boundary marking" value={fraisGeometre} onChange={(v) => setFraisGeometre(Number(v))} suffix="EUR" hint="Lotissement: boundary marking, plot division" />
                  <InputField label="Lotissement fees" value={fraisLotissement} onChange={(v) => setFraisLotissement(Number(v))} suffix="EUR" hint="PAP NQ, individual connections, shared spaces" />
                  <InputField label="Number of lots" value={nbLots} onChange={(v) => setNbLots(Number(v))} hint="For per-lot cost calculation" />
                </>)}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Development fees</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Sales & marketing" value={fraisCommerciaux} onChange={(v) => setFraisCommerciaux(Number(v))} suffix="% rev." hint="Sales, advertising" step={0.5} />
                <InputField label="Finance costs" value={fraisFinanciers} onChange={(v) => setFraisFinanciers(Number(v))} suffix="% costs" hint="Interim interest" step={0.5} />
                <InputField label="Insurance" value={assurances} onChange={(v) => setAssurances(Number(v))} suffix="% constr." step={0.5} />
                <InputField label="Management fees" value={fraisGestion} onChange={(v) => setFraisGestion(Number(v))} suffix="% rev." hint="Programme management" step={0.5} />
                <InputField label="Pre-sales" value={tauxPreCommercialisation} onChange={(v) => setTauxPreCommercialisation(Number(v))} suffix="% sold" min={0} max={100} hint="% pre-sold before construction. Impacts finance cost." />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Developer margin</h2>
              <InputField label="Margin on revenue" value={margePromoteur} onChange={(v) => setMargePromoteur(Number(v))} suffix="%" hint="Adjustable — typically 10-20% of revenue" step={1} />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Residual land charge */}
            <div className={`rounded-2xl p-8 text-center shadow-lg ${
              result.chargeFonciere > 0
                ? "bg-gradient-to-br from-navy to-navy-light text-white"
                : "bg-gradient-to-br from-error to-red-600 text-white"
            }`}>
              <div className="text-sm text-white/60">
                {coutTerrainConnu ? "Residual margin of the operation" : "Maximum land charge (residual land value)"}
              </div>
              <div className="mt-2 text-5xl font-bold">{formatEUR(result.chargeFonciere)}</div>
              <div className="mt-2 text-sm text-white/60">
                {coutTerrainConnu
                  ? `Land: ${formatEUR(result.coutTerrain)} (${formatEUR(prixTerrainM2)}/m²)`
                  : `i.e. ${formatEUR(result.chargeFonciereM2Terrain)} /m² sellable`
                }
              </div>
              {result.chargeFonciere <= 0 && (
                <div className="mt-3 text-sm text-white/80">
                  {coutTerrainConnu ? "The operation is not profitable at this land price" : "The land charge is negative — the project is not viable"}
                </div>
              )}
            </div>

            <ResultPanel
              title="Residual calculation"
              lines={[
                { label: "Housing revenue", value: formatEUR(result.caLogements) },
                { label: "Parking revenue", value: formatEUR(result.caParkings), sub: true },
                { label: "Total revenue", value: formatEUR(result.caTotal), highlight: true },
                ...(coutTerrainConnu && result.coutTerrain > 0 ? [{ label: `Land (${formatEUR(prixTerrainM2)}/m²)`, value: `- ${formatEUR(result.coutTerrain)}` }] : []),
                { label: `Construction (${formatPct(result.ratioConstructionCA)})`, value: `- ${formatEUR(result.totalConstruction)}` },
                { label: `Development fees (${formatPct(result.ratioFraisCA)})`, value: `- ${formatEUR(result.totalFrais)}` },
                { label: `Developer margin (${margePromoteur}%)`, value: `- ${formatEUR(result.margeMontant)}` },
                { label: coutTerrainConnu ? "= Residual margin" : "= Maximum land charge", value: formatEUR(result.chargeFonciere), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Cost breakdown"
              lines={[
                { label: `Gross construction (${surfaceBrute} m² x ${formatEUR(coutConstructionM2)})`, value: formatEUR(result.coutsConstruction) },
                { label: "Roads & utilities", value: formatEUR(result.coutsVoirie), sub: true },
                { label: `Architect (${honorairesArchitecte}%)`, value: formatEUR(result.coutsArchitecte), sub: true },
                { label: `Engineering (${honorairesBET}%)`, value: formatEUR(result.coutsBET), sub: true },
                { label: "Miscellaneous studies", value: formatEUR(result.coutsEtudes), sub: true },
                { label: `Contingencies (${aleas}%)`, value: formatEUR(result.coutsAleas), sub: true },
                { label: "Total construction", value: formatEUR(result.totalConstruction), highlight: true },
                { label: `Sales & marketing (${fraisCommerciaux}% rev.)`, value: formatEUR(result.fCommerciaux), sub: true },
                { label: `Finance costs (${fraisFinanciers}%)`, value: formatEUR(result.fFinanciers), sub: true },
                { label: `Insurance (${assurances}%)`, value: formatEUR(result.fAssurances), sub: true },
                { label: `Management (${fraisGestion}% rev.)`, value: formatEUR(result.fGestion), sub: true },
                { label: "Total fees", value: formatEUR(result.totalFrais), highlight: true },
              ]}
            />

            <ResultPanel
              title="Ratios"
              lines={[
                { label: "Land charge / Revenue", value: formatPct(result.ratioFoncierCA), warning: result.ratioFoncierCA < 0.10 },
                { label: "Construction / Revenue", value: formatPct(result.ratioConstructionCA) },
                { label: "Fees / Revenue", value: formatPct(result.ratioFraisCA) },
                { label: "Margin / Revenue", value: formatPct(result.margeEffective) },
                { label: "Return on equity (est.)", value: formatPct(result.rentaFP), sub: true },
              ]}
            />

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Residual method:</strong> Sale price - Construction costs - Fees - Margin
                = Maximum land charge the developer can pay for the plot.
                In Luxembourg, construction costs are among the highest in Europe (2,500-3,500 EUR/m²).
                The land charge / revenue ratio typically ranges between 15% and 30% depending on location.
              </p>
            </div>

            {/* Treasury plan */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-navy">Treasury plan</h3>
              <p className="mb-4 text-xs text-muted">
                Simplified cash flow over 24 months — VEFA payment calls ({tauxPreCommercialisation}% pre-sold) following the standard LU schedule (5/15/20/20/15/15/10)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border text-left">
                      <th className="py-2 pr-3 font-semibold text-slate">Quarter</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">Cumul. expenditure</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">Cumul. revenue</th>
                      <th className="py-2 pl-3 font-semibold text-slate text-right">Net position</th>
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
                    <strong>Peak financing need:</strong> {formatEUR(Math.abs(treasuryPlan.peakNeed))} reached in {treasuryPlan.peakQuarter}.
                    This is the amount the developer must cover through equity and/or development loan.
                  </p>
                </div>
              )}
              {treasuryPlan.peakNeed >= 0 && (
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs text-green-800">
                    <strong>No financing need:</strong> VEFA payment calls cover expenditure throughout the construction period.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
