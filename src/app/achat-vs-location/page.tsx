"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";

/**
 * Luxembourg "déduction des intérêts débiteurs" (art. 98bis LIR).
 * Maximum deductible interest per person per year:
 *   - Years 1-5  (première occupation): 2 000 €
 *   - Years 6-10:                       1 500 €
 *   - Year 11+:                         1 000 €
 * Multiply by nbPersonnes (1 or 2 for a couple).
 */
function deductionInteretsMax(annee: number, nbPersonnes: number): number {
  let plafond: number;
  if (annee <= 5) {
    plafond = 2000;
  } else if (annee <= 10) {
    plafond = 1500;
  } else {
    plafond = 1000;
  }
  return plafond * nbPersonnes;
}

export default function AchatVsLocation() {
  const [viewMode, setViewMode] = useState<"quick" | "full">("quick");

  // Achat
  const [prixBien, setPrixBien] = useState(750000);
  const [apport, setApport] = useState(150000);
  const [tauxCredit, setTauxCredit] = useState(3.5);
  const [dureeCredit, setDureeCredit] = useState(25);
  const [fraisAcquisitionPct, setFraisAcquisitionPct] = useState(7);
  const [chargesCoproMensuel, setChargesCoproMensuel] = useState(250);
  const [taxeFonciereAn, setTaxeFonciereAn] = useState(200);
  const [entretienAnPct, setEntretienAnPct] = useState(1);
  const [appreciationAn, setAppreciationAn] = useState(2);

  // Assurance solde restant dû
  const [tauxAssuranceSRD, setTauxAssuranceSRD] = useState(0.3);

  // Déduction intérêts débiteurs
  const [nbPersonnes, setNbPersonnes] = useState(2);
  const [tauxMarginalIR, setTauxMarginalIR] = useState(39);

  // Location
  const [loyerMensuel, setLoyerMensuel] = useState(2000);
  const [indexationLoyer, setIndexationLoyer] = useState(2);

  // Placement alternatif (si on loue, on place l'apport)
  const [rendementPlacement, setRendementPlacement] = useState(4);

  // Horizon
  const [horizon, setHorizon] = useState(15);

  const result = useMemo(() => {
    const montantCredit = prixBien - apport;
    const fraisAcquisition = prixBien * (fraisAcquisitionPct / 100);
    const tauxMensuel = tauxCredit / 100 / 12;
    const nbMois = dureeCredit * 12;

    // Mensualité crédit
    const mensualiteCredit = tauxMensuel > 0
      ? montantCredit * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1)
      : montantCredit / nbMois;

    // Assurance SRD mensuelle (on the initial capital)
    const assuranceSRDMensuel = montantCredit * (tauxAssuranceSRD / 100) / 12;

    // Tableaux année par année
    const annees: {
      annee: number;
      // Achat
      coutAchatCumule: number;
      capitalRembourse: number;
      capitalRestant: number;
      valeurBien: number;
      patrimoineNetAchat: number;
      deductionInterets: number;
      economieFiscaleCumul: number;
      assuranceSRDAnnuel: number;
      // Location
      coutLocationCumule: number;
      placementCapital: number;
      patrimoineNetLocation: number;
    }[] = [];

    let coutAchatCumule = apport + fraisAcquisition;
    let capitalRestant = montantCredit;
    let coutLocationCumule = 0;
    let placementCapital = apport + fraisAcquisition; // Si on loue, on garde l'apport + frais
    let loyerAnnuel = loyerMensuel * 12;
    let economieFiscaleCumul = 0;

    for (let a = 1; a <= horizon; a++) {
      // ACHAT
      const valeurBien = prixBien * Math.pow(1 + appreciationAn / 100, a);
      const interetsAnnuels = capitalRestant * (tauxCredit / 100);
      const capitalAnnuel = Math.min(mensualiteCredit * 12 - interetsAnnuels, capitalRestant);
      capitalRestant = Math.max(0, capitalRestant - capitalAnnuel);

      // Luxembourg interest deduction
      const plafondDeduction = deductionInteretsMax(a, nbPersonnes);
      const deductionInterets = Math.min(interetsAnnuels, plafondDeduction);
      const economieFiscaleAnnuelle = deductionInterets * (tauxMarginalIR / 100);
      economieFiscaleCumul += economieFiscaleAnnuelle;

      // Assurance SRD (annual cost)
      const assuranceSRDAnnuel = assuranceSRDMensuel * 12;

      const coutAchatAnnuel =
        mensualiteCredit * 12 +
        chargesCoproMensuel * 12 +
        taxeFonciereAn +
        prixBien * (entretienAnPct / 100) +
        assuranceSRDAnnuel -
        economieFiscaleAnnuelle; // Interest deduction reduces effective cost

      coutAchatCumule += coutAchatAnnuel;

      const patrimoineNetAchat = valeurBien - capitalRestant;

      // LOCATION
      coutLocationCumule += loyerAnnuel;
      const coutMensuelAchatPourComparaison =
        mensualiteCredit +
        chargesCoproMensuel +
        taxeFonciereAn / 12 +
        prixBien * (entretienAnPct / 100) / 12 +
        assuranceSRDMensuel -
        economieFiscaleAnnuelle / 12;

      const economieMensuelle =
        coutMensuelAchatPourComparaison -
        loyerMensuel * Math.pow(1 + indexationLoyer / 100, a - 1);

      if (economieMensuelle > 0) {
        placementCapital += economieMensuelle * 12;
      }
      placementCapital *= (1 + rendementPlacement / 100);
      loyerAnnuel *= (1 + indexationLoyer / 100);

      annees.push({
        annee: a,
        coutAchatCumule,
        capitalRembourse: montantCredit - capitalRestant,
        capitalRestant,
        valeurBien,
        patrimoineNetAchat,
        deductionInterets,
        economieFiscaleCumul,
        assuranceSRDAnnuel,
        coutLocationCumule,
        placementCapital,
        patrimoineNetLocation: placementCapital,
      });
    }

    // Point de croisement : quand achat devient plus avantageux
    const croisement = annees.find((a) => a.patrimoineNetAchat > a.patrimoineNetLocation);

    // Exact crossover year (fractional) for chart annotation
    let crossoverYear: number | null = null;
    for (let i = 1; i < annees.length; i++) {
      const prev = annees[i - 1];
      const curr = annees[i];
      const diffPrev = prev.patrimoineNetAchat - prev.patrimoineNetLocation;
      const diffCurr = curr.patrimoineNetAchat - curr.patrimoineNetLocation;
      if (diffPrev <= 0 && diffCurr > 0) {
        // Linear interpolation
        crossoverYear = prev.annee + (-diffPrev) / (diffCurr - diffPrev);
        break;
      }
    }

    // Chart data
    const chartData = annees.map((a) => ({
      annee: a.annee,
      achat: Math.round(a.patrimoineNetAchat),
      location: Math.round(a.patrimoineNetLocation),
    }));

    return {
      mensualiteCredit,
      fraisAcquisition,
      montantCredit,
      assuranceSRDMensuel,
      annees,
      croisement,
      crossoverYear,
      chartData,
      derniere: annees[annees.length - 1],
    };
  }, [
    prixBien, apport, tauxCredit, dureeCredit, fraisAcquisitionPct,
    chargesCoproMensuel, taxeFonciereAn, entretienAnPct, appreciationAn,
    tauxAssuranceSRD, nbPersonnes, tauxMarginalIR,
    loyerMensuel, indexationLoyer, rendementPlacement, horizon,
  ]);

  const coutMensuelTotal =
    result.mensualiteCredit +
    chargesCoproMensuel +
    taxeFonciereAn / 12 +
    prixBien * (entretienAnPct / 100) / 12 +
    result.assuranceSRDMensuel;

  // First year fiscal saving (for display)
  const deductionAn1 = result.annees.length > 0 ? result.annees[0].deductionInterets : 0;
  const economieFiscaleMensuelleAn1 = (deductionAn1 * (tauxMarginalIR / 100)) / 12;
  const coutMensuelNetAchat = coutMensuelTotal - economieFiscaleMensuelleAn1;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Acheter ou louer ?</h1>
          <p className="mt-2 text-muted">Comparez le coût total et le patrimoine constitué sur la durée</p>
          <div className="mt-4 inline-flex rounded-lg border border-card-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setViewMode("quick")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "quick"
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Vue rapide
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "full"
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Vue détaillée
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Inputs */}
          <div className="space-y-6">
            {/* Quick mode: 5 essential inputs */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Paramètres essentiels</h2>
              <div className="space-y-4">
                <InputField label="Prix du bien" value={prixBien} onChange={(v) => setPrixBien(Number(v))} suffix="€" />
                <InputField label="Apport personnel" value={apport} onChange={(v) => setApport(Number(v))} suffix="€" />
                <InputField label="Taux du crédit" value={tauxCredit} onChange={(v) => setTauxCredit(Number(v))} suffix="%" step={0.1} />
                <InputField label="Loyer mensuel" value={loyerMensuel} onChange={(v) => setLoyerMensuel(Number(v))} suffix="€" />
                <InputField label="Durée de comparaison" value={horizon} onChange={(v) => setHorizon(Number(v))} suffix="ans" min={1} max={35} />
              </div>
            </div>

            {/* Full mode: additional inputs */}
            {viewMode === "full" && (
              <>
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">Achat — détails</h2>
                  <div className="space-y-4">
                    <InputField label="Durée du crédit" value={dureeCredit} onChange={(v) => setDureeCredit(Number(v))} suffix="ans" />
                    <InputField label="Frais d'acquisition" value={fraisAcquisitionPct} onChange={(v) => setFraisAcquisitionPct(Number(v))} suffix="%" hint="Droits 7% - Bëllegen Akt. Utilisez le simulateur pour le détail." />
                    <InputField label="Charges copropriété" value={chargesCoproMensuel} onChange={(v) => setChargesCoproMensuel(Number(v))} suffix="€/mois" />
                    <InputField label="Impôt foncier" value={taxeFonciereAn} onChange={(v) => setTaxeFonciereAn(Number(v))} suffix="€/an" hint="Très faible au Luxembourg" />
                    <InputField label="Entretien annuel" value={entretienAnPct} onChange={(v) => setEntretienAnPct(Number(v))} suffix="% prix" hint="Configurable — typiquement 0,5-1,5%" step={0.1} />
                    <InputField label="Appréciation annuelle du bien" value={appreciationAn} onChange={(v) => setAppreciationAn(Number(v))} suffix="%" step={0.1} hint="Configurable — historique LU ~3-5%/an, récent ~2%" />
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">Assurance solde restant dû</h2>
                  <div className="space-y-4">
                    <InputField
                      label="Taux assurance SRD"
                      value={tauxAssuranceSRD}
                      onChange={(v) => setTauxAssuranceSRD(Number(v))}
                      suffix="% capital"
                      step={0.05}
                      hint="Typiquement 0,20-0,40% du capital emprunté par an"
                    />
                    <div className="text-xs text-muted">
                      Coût mensuel : <span className="font-semibold text-foreground">{formatEUR2(result.assuranceSRDMensuel)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">Déduction intérêts débiteurs</h2>
                  <p className="mb-3 text-xs text-muted">
                    Art. 98bis LIR — Résidence principale. Max 2 000 €/pers. (5 prem. années), 1 500 € (6-10), 1 000 € (11+).
                  </p>
                  <div className="space-y-4">
                    <InputField
                      label="Nombre de personnes (foyer fiscal)"
                      value={nbPersonnes}
                      onChange={(v) => setNbPersonnes(Math.max(1, Math.min(2, Number(v))))}
                      suffix="pers."
                      min={1}
                      max={2}
                    />
                    <InputField
                      label="Taux marginal d'imposition"
                      value={tauxMarginalIR}
                      onChange={(v) => setTauxMarginalIR(Number(v))}
                      suffix="%"
                      step={1}
                      hint="Pour estimer l'économie fiscale réelle"
                    />
                    <div className="text-xs text-muted">
                      Plafond déduction an 1 : <span className="font-semibold text-foreground">{formatEUR(deductionInteretsMax(1, nbPersonnes))}</span>
                      {" — "}Économie fiscale an 1 : <span className="font-semibold text-foreground">{formatEUR2(economieFiscaleMensuelleAn1 * 12)}/an</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">Location — détails</h2>
                  <div className="space-y-4">
                    <InputField label="Indexation annuelle du loyer" value={indexationLoyer} onChange={(v) => setIndexationLoyer(Number(v))} suffix="%" step={0.1} hint="Augmentation max 10% / 2 ans (réforme 2024)" />
                    <InputField label="Rendement placement alternatif" value={rendementPlacement} onChange={(v) => setRendementPlacement(Number(v))} suffix="%" step={0.1} hint="Configurable — si on loue, on place l'apport ailleurs" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Résultats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verdict */}
            <div className={`rounded-2xl p-8 text-white text-center shadow-lg ${
              result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                ? "bg-gradient-to-br from-navy to-navy-light"
                : "bg-gradient-to-br from-teal to-teal-light"
            }`}>
              <div className="text-sm text-white/60">
                {result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                  ? `Acheter est plus avantageux sur ${horizon} ans`
                  : `Louer est plus avantageux sur ${horizon} ans`}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs text-white/50">Patrimoine net si achat</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetAchat)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Capital si location + placement</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetLocation)}</div>
                </div>
              </div>
              {result.croisement && (
                <div className="mt-4 text-sm text-white/70">
                  L&apos;achat devient plus avantageux à partir de l&apos;année {result.croisement.annee}
                </div>
              )}
            </div>

            {/* Crossover chart */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-navy">Évolution du patrimoine net</h3>
                <p className="text-xs text-muted mt-1">
                  Patrimoine achat (valeur du bien − capital restant dû) vs capital accumulé si location + placement
                </p>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart
                  data={result.chartData}
                  margin={{ top: 10, right: 20, bottom: 5, left: 10 }}
                >
                  <defs>
                    <linearGradient id="achatGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1B2A4A" />
                      <stop offset="100%" stopColor="#2D4A7A" />
                    </linearGradient>
                    <linearGradient id="locationGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2A9D8F" />
                      <stop offset="100%" stopColor="#4EC5B7" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="annee"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Année", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "#6B7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => {
                      const n = Number(v);
                      if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                      if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
                      return `${n}`;
                    }}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatEUR(Number(value)),
                      name === "achat" ? "Patrimoine achat" : "Capital location",
                    ]}
                    labelFormatter={(label) => `Année ${label}`}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e2db",
                      backgroundColor: "rgba(255,255,255,0.95)",
                    }}
                  />
                  {result.crossoverYear && (
                    <ReferenceLine
                      x={Math.round(result.crossoverYear)}
                      stroke="#C8A951"
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      label={{
                        value: `Croisement ~an ${result.crossoverYear.toFixed(1)}`,
                        position: "top",
                        fontSize: 11,
                        fill: "#C8A951",
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="achat"
                    stroke="url(#achatGrad)"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#1B2A4A", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#1B2A4A" }}
                    name="achat"
                  />
                  <Line
                    type="monotone"
                    dataKey="location"
                    stroke="url(#locationGrad)"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#2A9D8F", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#2A9D8F" }}
                    name="location"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: "#1B2A4A" }} />
                  Patrimoine achat
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: "#2A9D8F" }} />
                  Capital location
                </span>
                {result.crossoverYear && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-5 rounded-sm border-b-2 border-dashed" style={{ borderColor: "#C8A951" }} />
                    Point de croisement
                  </span>
                )}
              </div>
            </div>

            {viewMode === "full" && (
              <>
                {/* Coûts mensuels comparés */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultPanel
                    title="Coût mensuel — Achat"
                    lines={[
                      { label: "Mensualité crédit", value: formatEUR2(result.mensualiteCredit) },
                      { label: "Charges copropriété", value: formatEUR2(chargesCoproMensuel), sub: true },
                      { label: "Impôt foncier", value: formatEUR2(taxeFonciereAn / 12), sub: true },
                      { label: "Entretien", value: formatEUR2(prixBien * entretienAnPct / 100 / 12), sub: true },
                      { label: "Assurance SRD", value: formatEUR2(result.assuranceSRDMensuel), sub: true },
                      { label: "Total brut mensuel", value: formatEUR2(coutMensuelTotal), highlight: true },
                      { label: "Économie fiscale intérêts (an 1)", value: `- ${formatEUR2(economieFiscaleMensuelleAn1)}`, sub: true },
                      { label: "Coût net mensuel (an 1)", value: formatEUR2(coutMensuelNetAchat), highlight: true },
                    ]}
                  />
                  <ResultPanel
                    title="Coût mensuel — Location"
                    lines={[
                      { label: "Loyer (année 1)", value: formatEUR2(loyerMensuel) },
                      { label: `Loyer (année ${horizon})`, value: formatEUR2(loyerMensuel * Math.pow(1 + indexationLoyer / 100, horizon - 1)), sub: true },
                      { label: "Différence mensuelle nette (an 1)", value: formatEUR2(coutMensuelNetAchat - loyerMensuel), highlight: true },
                    ]}
                  />
                </div>

                {/* Déduction intérêts — résumé */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultPanel
                    title="Déduction intérêts débiteurs"
                    lines={[
                      { label: "Intérêts an 1", value: formatEUR2(result.annees.length > 0 ? result.annees[0].deductionInterets : 0) },
                      { label: "Plafond an 1", value: formatEUR(deductionInteretsMax(1, nbPersonnes)), sub: true },
                      { label: `Économie fiscale cumulée (${horizon} ans)`, value: formatEUR(result.derniere.economieFiscaleCumul), highlight: true },
                    ]}
                  />
                  <ResultPanel
                    title="Assurance solde restant dû"
                    lines={[
                      { label: "Coût mensuel", value: formatEUR2(result.assuranceSRDMensuel) },
                      { label: "Coût annuel", value: formatEUR2(result.assuranceSRDMensuel * 12), sub: true },
                      { label: `Coût total (${Math.min(horizon, dureeCredit)} ans)`, value: formatEUR(result.assuranceSRDMensuel * 12 * Math.min(horizon, dureeCredit)), highlight: true },
                    ]}
                  />
                </div>

                {/* Tableau année par année */}
                <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-card-border bg-background">
                        <th className="px-3 py-2 text-left font-semibold text-navy">Année</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">Valeur bien</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">Capital restant dû</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">Patrimoine achat</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">Capital placement</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">Avantage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.annees.filter((a) => a.annee % (horizon > 15 ? 3 : horizon > 10 ? 2 : 1) === 0 || a.annee === 1 || a.annee === horizon).map((a) => {
                        const diff = a.patrimoineNetAchat - a.patrimoineNetLocation;
                        return (
                          <tr key={a.annee} className="border-b border-card-border/50 hover:bg-background/50">
                            <td className="px-3 py-1.5 font-medium">{a.annee}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.valeurBien)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-muted">{formatEUR(a.capitalRestant)}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(a.patrimoineNetAchat)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.patrimoineNetLocation)}</td>
                            <td className={`px-3 py-1.5 text-right font-mono font-semibold ${diff > 0 ? "text-navy" : "text-teal"}`}>
                              {diff > 0 ? "Achat" : "Location"} {formatEUR(Math.abs(diff))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Hypothèses configurables :</strong> Le résultat dépend fortement de l&apos;appréciation du bien
                    ({appreciationAn}%/an) et du rendement du placement alternatif ({rendementPlacement}%/an).
                    Modifiez ces paramètres pour tester différents scénarios. Les frais d&apos;acquisition au Luxembourg (Bëllegen Akt)
                    rendent l&apos;achat plus attractif qu&apos;en France grâce au crédit d&apos;impôt.
                    La déduction des intérêts débiteurs (art. 98bis LIR) réduit le coût effectif de l&apos;achat,
                    surtout les 5 premières années (max {formatEUR(2000 * nbPersonnes)}/an pour {nbPersonnes} personne{nbPersonnes > 1 ? "s" : ""}).
                    L&apos;assurance solde restant dû ({tauxAssuranceSRD}%) est un coût souvent oublié.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
