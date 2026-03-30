"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";

export default function BilanPromoteur() {
  // Recettes
  const [surfaceVendable, setSurfaceVendable] = useState(2000);
  const [prixVenteM2, setPrixVenteM2] = useState(8500);
  const [nbParkings, setNbParkings] = useState(30);
  const [prixParking, setPrixParking] = useState(35000);

  // Coûts construction
  const [coutConstructionM2, setCoutConstructionM2] = useState(2800);
  const [surfaceBrute, setSurfaceBrute] = useState(2800); // Surface brute > vendable (parties communes)
  const [voirie, setVoirie] = useState(200000);
  const [honorairesArchitecte, setHonorairesArchitecte] = useState(8); // % coûts construction
  const [honorairesBET, setHonorairesBET] = useState(4);
  const [etudesAutres, setEtudesAutres] = useState(50000);

  // Frais promoteur
  const [fraisCommerciaux, setFraisCommerciaux] = useState(3); // % CA
  const [fraisFinanciers, setFraisFinanciers] = useState(3); // % coût total
  const [assurances, setAssurances] = useState(1.5); // % coûts construction
  const [fraisGestion, setFraisGestion] = useState(2); // % CA
  const [aleas, setAleas] = useState(5); // % coûts construction

  // Marge
  const [margePromoteur, setMargePromoteur] = useState(15); // % CA

  const result = useMemo(() => {
    // RECETTES
    const caLogements = surfaceVendable * prixVenteM2;
    const caParkings = nbParkings * prixParking;
    const caTotal = caLogements + caParkings;

    // COÛTS CONSTRUCTION
    const coutsConstruction = surfaceBrute * coutConstructionM2;
    const coutsVoirie = voirie;
    const coutsArchitecte = coutsConstruction * (honorairesArchitecte / 100);
    const coutsBET = coutsConstruction * (honorairesBET / 100);
    const coutsEtudes = etudesAutres;
    const coutsAleas = coutsConstruction * (aleas / 100);
    const totalConstruction = coutsConstruction + coutsVoirie + coutsArchitecte + coutsBET + coutsEtudes + coutsAleas;

    // FRAIS PROMOTEUR
    const fCommerciaux = caTotal * (fraisCommerciaux / 100);
    const fFinanciers = (totalConstruction + caTotal * margePromoteur / 100) * (fraisFinanciers / 100); // Sur le coût engagé
    const fAssurances = coutsConstruction * (assurances / 100);
    const fGestion = caTotal * (fraisGestion / 100);
    const totalFrais = fCommerciaux + fFinanciers + fAssurances + fGestion;

    // MARGE
    const margeMontant = caTotal * (margePromoteur / 100);

    // CHARGE FONCIÈRE RÉSIDUELLE = CA - Construction - Frais - Marge
    const chargeFonciere = caTotal - totalConstruction - totalFrais - margeMontant;
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
      coutsConstruction, coutsVoirie, coutsArchitecte, coutsBET, coutsEtudes, coutsAleas, totalConstruction,
      fCommerciaux, fFinanciers, fAssurances, fGestion, totalFrais,
      margeMontant,
      chargeFonciere, chargeFonciereM2Terrain,
      ratioFoncierCA, ratioConstructionCA, ratioFraisCA, margeEffective, rentaFP,
    };
  }, [surfaceVendable, prixVenteM2, nbParkings, prixParking, coutConstructionM2, surfaceBrute, voirie, honorairesArchitecte, honorairesBET, etudesAutres, fraisCommerciaux, fraisFinanciers, assurances, fraisGestion, aleas, margePromoteur]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Bilan promoteur</h1>
          <p className="mt-2 text-muted">
            Méthode du compte à rebours — Déterminez la charge foncière maximale à partir du prix de vente
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Recettes prévisionnelles</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Surface vendable" value={surfaceVendable} onChange={(v) => setSurfaceVendable(Number(v))} suffix="m²" hint="Surface habitable vendable totale" />
                <InputField label="Prix de vente /m²" value={prixVenteM2} onChange={(v) => setPrixVenteM2(Number(v))} suffix="€" hint="Prix moyen de sortie TTC" />
                <InputField label="Nombre de parkings" value={nbParkings} onChange={(v) => setNbParkings(Number(v))} />
                <InputField label="Prix par parking" value={prixParking} onChange={(v) => setPrixParking(Number(v))} suffix="€" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Coûts de construction</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Surface brute (SHOB)" value={surfaceBrute} onChange={(v) => setSurfaceBrute(Number(v))} suffix="m²" hint="Incluant parties communes, parkings" />
                <InputField label="Coût construction /m² brut" value={coutConstructionM2} onChange={(v) => setCoutConstructionM2(Number(v))} suffix="€" hint="Configurable — LU : 2 500-3 500 €/m²" />
                <InputField label="VRD / Voirie" value={voirie} onChange={(v) => setVoirie(Number(v))} suffix="€" />
                <InputField label="Études diverses" value={etudesAutres} onChange={(v) => setEtudesAutres(Number(v))} suffix="€" hint="Géomètre, sol, environnement..." />
                <InputField label="Honoraires architecte" value={honorairesArchitecte} onChange={(v) => setHonorairesArchitecte(Number(v))} suffix="% constr." hint="Configurable — typiquement 7-10%" step={0.5} />
                <InputField label="Honoraires BET" value={honorairesBET} onChange={(v) => setHonorairesBET(Number(v))} suffix="% constr." hint="Bureau d'études techniques" step={0.5} />
                <InputField label="Aléas / Imprévus" value={aleas} onChange={(v) => setAleas(Number(v))} suffix="% constr." hint="Configurable — 3 à 8%" step={0.5} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Frais de promotion</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Frais commerciaux" value={fraisCommerciaux} onChange={(v) => setFraisCommerciaux(Number(v))} suffix="% CA" hint="Commercialisation, publicité" step={0.5} />
                <InputField label="Frais financiers" value={fraisFinanciers} onChange={(v) => setFraisFinanciers(Number(v))} suffix="% coûts" hint="Intérêts intercalaires" step={0.5} />
                <InputField label="Assurances" value={assurances} onChange={(v) => setAssurances(Number(v))} suffix="% constr." step={0.5} />
                <InputField label="Frais de gestion" value={fraisGestion} onChange={(v) => setFraisGestion(Number(v))} suffix="% CA" hint="Gestion de programme" step={0.5} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Marge du promoteur</h2>
              <InputField label="Marge sur CA" value={margePromoteur} onChange={(v) => setMargePromoteur(Number(v))} suffix="%" hint="Configurable — typiquement 10-20% du CA" step={1} />
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
              <div className="text-sm text-white/60">Charge foncière maximale (valeur résiduelle du terrain)</div>
              <div className="mt-2 text-5xl font-bold">{formatEUR(result.chargeFonciere)}</div>
              <div className="mt-2 text-sm text-white/60">
                soit {formatEUR(result.chargeFonciereM2Terrain)} /m² vendable
              </div>
              {result.chargeFonciere <= 0 && (
                <div className="mt-3 text-sm text-white/80">
                  L'opération n'est pas viable avec ces paramètres — la charge foncière est négative
                </div>
              )}
            </div>

            <ResultPanel
              title="Compte à rebours"
              lines={[
                { label: "CA Logements", value: formatEUR(result.caLogements) },
                { label: "CA Parkings", value: formatEUR(result.caParkings), sub: true },
                { label: "Chiffre d'affaires total", value: formatEUR(result.caTotal), highlight: true },
                { label: `Construction (${formatPct(result.ratioConstructionCA)})`, value: `- ${formatEUR(result.totalConstruction)}` },
                { label: `Frais promotion (${formatPct(result.ratioFraisCA)})`, value: `- ${formatEUR(result.totalFrais)}` },
                { label: `Marge promoteur (${margePromoteur}%)`, value: `- ${formatEUR(result.margeMontant)}` },
                { label: "= Charge foncière résiduelle", value: formatEUR(result.chargeFonciere), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Détail des coûts"
              lines={[
                { label: `Construction brute (${surfaceBrute} m² × ${formatEUR(coutConstructionM2)})`, value: formatEUR(result.coutsConstruction) },
                { label: "VRD / Voirie", value: formatEUR(result.coutsVoirie), sub: true },
                { label: `Architecte (${honorairesArchitecte}%)`, value: formatEUR(result.coutsArchitecte), sub: true },
                { label: `BET (${honorairesBET}%)`, value: formatEUR(result.coutsBET), sub: true },
                { label: "Études diverses", value: formatEUR(result.coutsEtudes), sub: true },
                { label: `Aléas (${aleas}%)`, value: formatEUR(result.coutsAleas), sub: true },
                { label: "Total construction", value: formatEUR(result.totalConstruction), highlight: true },
                { label: `Commerciaux (${fraisCommerciaux}% CA)`, value: formatEUR(result.fCommerciaux), sub: true },
                { label: `Financiers (${fraisFinanciers}%)`, value: formatEUR(result.fFinanciers), sub: true },
                { label: `Assurances (${assurances}%)`, value: formatEUR(result.fAssurances), sub: true },
                { label: `Gestion (${fraisGestion}% CA)`, value: formatEUR(result.fGestion), sub: true },
                { label: "Total frais", value: formatEUR(result.totalFrais), highlight: true },
              ]}
            />

            <ResultPanel
              title="Ratios"
              lines={[
                { label: "Charge foncière / CA", value: formatPct(result.ratioFoncierCA), warning: result.ratioFoncierCA < 0.10 },
                { label: "Construction / CA", value: formatPct(result.ratioConstructionCA) },
                { label: "Frais / CA", value: formatPct(result.ratioFraisCA) },
                { label: "Marge / CA", value: formatPct(result.margeEffective) },
                { label: "Rentabilité sur fonds propres (est.)", value: formatPct(result.rentaFP), sub: true },
              ]}
            />

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Méthode du compte à rebours :</strong> Prix de vente − Coûts de construction − Frais − Marge
                = Charge foncière maximale que le promoteur peut payer pour le terrain.
                Au Luxembourg, les coûts de construction sont parmi les plus élevés d'Europe (2 500-3 500 €/m²).
                Le ratio charge foncière / CA se situe typiquement entre 15% et 30% selon la localisation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
