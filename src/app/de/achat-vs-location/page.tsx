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
 * Luxembourg "deduction of debit interest" (art. 98bis LIR).
 * Maximum deductible interest per person per year:
 *   - Years 1-5  (first occupation): 2,000 EUR
 *   - Years 6-10:                    1,500 EUR
 *   - Year 11+:                      1,000 EUR
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
  // Purchase
  const [prixBien, setPrixBien] = useState(750000);
  const [apport, setApport] = useState(150000);
  const [tauxCredit, setTauxCredit] = useState(3.5);
  const [dureeCredit, setDureeCredit] = useState(25);
  const [fraisAcquisitionPct, setFraisAcquisitionPct] = useState(7);
  const [chargesCoproMensuel, setChargesCoproMensuel] = useState(250);
  const [taxeFonciereAn, setTaxeFonciereAn] = useState(200);
  const [entretienAnPct, setEntretienAnPct] = useState(1);
  const [appreciationAn, setAppreciationAn] = useState(2);

  // Outstanding balance insurance (assurance solde restant du)
  const [tauxAssuranceSRD, setTauxAssuranceSRD] = useState(0.3);

  // Debit interest deduction
  const [nbPersonnes, setNbPersonnes] = useState(2);
  const [tauxMarginalIR, setTauxMarginalIR] = useState(39);

  // Rental
  const [loyerMensuel, setLoyerMensuel] = useState(2000);
  const [indexationLoyer, setIndexationLoyer] = useState(2);

  // Alternative investment (if renting, the down payment is invested)
  const [rendementPlacement, setRendementPlacement] = useState(4);

  // Horizon
  const [horizon, setHorizon] = useState(15);

  const result = useMemo(() => {
    const montantCredit = prixBien - apport;
    const fraisAcquisition = prixBien * (fraisAcquisitionPct / 100);
    const tauxMensuel = tauxCredit / 100 / 12;
    const nbMois = dureeCredit * 12;

    // Monthly mortgage payment
    const mensualiteCredit = tauxMensuel > 0
      ? montantCredit * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1)
      : montantCredit / nbMois;

    // Monthly SRD insurance (on the initial capital)
    const assuranceSRDMensuel = montantCredit * (tauxAssuranceSRD / 100) / 12;

    // Year-by-year tables
    const annees: {
      annee: number;
      // Purchase
      coutAchatCumule: number;
      capitalRembourse: number;
      capitalRestant: number;
      valeurBien: number;
      patrimoineNetAchat: number;
      deductionInterets: number;
      economieFiscaleCumul: number;
      assuranceSRDAnnuel: number;
      // Rental
      coutLocationCumule: number;
      placementCapital: number;
      patrimoineNetLocation: number;
    }[] = [];

    let coutAchatCumule = apport + fraisAcquisition;
    let capitalRestant = montantCredit;
    let coutLocationCumule = 0;
    let placementCapital = apport + fraisAcquisition; // If renting, keep the down payment + fees
    let loyerAnnuel = loyerMensuel * 12;
    let economieFiscaleCumul = 0;

    for (let a = 1; a <= horizon; a++) {
      // PURCHASE
      const valeurBien = prixBien * Math.pow(1 + appreciationAn / 100, a);
      const interetsAnnuels = capitalRestant * (tauxCredit / 100);
      const capitalAnnuel = Math.min(mensualiteCredit * 12 - interetsAnnuels, capitalRestant);
      capitalRestant = Math.max(0, capitalRestant - capitalAnnuel);

      // Luxembourg interest deduction
      const plafondDeduction = deductionInteretsMax(a, nbPersonnes);
      const deductionInterets = Math.min(interetsAnnuels, plafondDeduction);
      const economieFiscaleAnnuelle = deductionInterets * (tauxMarginalIR / 100);
      economieFiscaleCumul += economieFiscaleAnnuelle;

      // SRD insurance (annual cost)
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

      // RENTAL
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

    // Crossover point: when buying becomes more advantageous
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
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Buy or Rent?</h1>
          <p className="mt-2 text-muted">Compare the total cost and the wealth accumulated over time</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Purchase</h2>
              <div className="space-y-4">
                <InputField label="Property price" value={prixBien} onChange={(v) => setPrixBien(Number(v))} suffix="€" />
                <InputField label="Down payment" value={apport} onChange={(v) => setApport(Number(v))} suffix="€" />
                <InputField label="Mortgage rate" value={tauxCredit} onChange={(v) => setTauxCredit(Number(v))} suffix="%" step={0.1} />
                <InputField label="Mortgage term" value={dureeCredit} onChange={(v) => setDureeCredit(Number(v))} suffix="years" />
                <InputField label="Acquisition fees" value={fraisAcquisitionPct} onChange={(v) => setFraisAcquisitionPct(Number(v))} suffix="%" hint="Registration 7% - Bellegen Akt. Use the simulator for details." />
                <InputField label="Condominium charges" value={chargesCoproMensuel} onChange={(v) => setChargesCoproMensuel(Number(v))} suffix="€/month" />
                <InputField label="Property tax" value={taxeFonciereAn} onChange={(v) => setTaxeFonciereAn(Number(v))} suffix="€/year" hint="Very low in Luxembourg" />
                <InputField label="Annual maintenance" value={entretienAnPct} onChange={(v) => setEntretienAnPct(Number(v))} suffix="% price" hint="Adjustable — typically 0.5-1.5%" step={0.1} />
                <InputField label="Annual property appreciation" value={appreciationAn} onChange={(v) => setAppreciationAn(Number(v))} suffix="%" step={0.1} hint="Adjustable — historical LU ~3-5%/year, recent ~2%" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Outstanding balance insurance</h2>
              <div className="space-y-4">
                <InputField
                  label="SRD insurance rate"
                  value={tauxAssuranceSRD}
                  onChange={(v) => setTauxAssuranceSRD(Number(v))}
                  suffix="% capital"
                  step={0.05}
                  hint="Typically 0.20-0.40% of borrowed capital per year"
                />
                <div className="text-xs text-muted">
                  Monthly cost: <span className="font-semibold text-foreground">{formatEUR2(result.assuranceSRDMensuel)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Debit interest deduction</h2>
              <p className="mb-3 text-xs text-muted">
                Art. 98bis LIR — Primary residence. Max 2,000 EUR/pers. (first 5 years), 1,500 EUR (6-10), 1,000 EUR (11+).
              </p>
              <div className="space-y-4">
                <InputField
                  label="Number of persons (tax household)"
                  value={nbPersonnes}
                  onChange={(v) => setNbPersonnes(Math.max(1, Math.min(2, Number(v))))}
                  suffix="pers."
                  min={1}
                  max={2}
                />
                <InputField
                  label="Marginal income tax rate"
                  value={tauxMarginalIR}
                  onChange={(v) => setTauxMarginalIR(Number(v))}
                  suffix="%"
                  step={1}
                  hint="To estimate the actual tax saving"
                />
                <div className="text-xs text-muted">
                  Deduction cap year 1: <span className="font-semibold text-foreground">{formatEUR(deductionInteretsMax(1, nbPersonnes))}</span>
                  {" — "}Tax saving year 1: <span className="font-semibold text-foreground">{formatEUR2(economieFiscaleMensuelleAn1 * 12)}/year</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Rental</h2>
              <div className="space-y-4">
                <InputField label="Monthly rent" value={loyerMensuel} onChange={(v) => setLoyerMensuel(Number(v))} suffix="€" />
                <InputField label="Annual rent indexation" value={indexationLoyer} onChange={(v) => setIndexationLoyer(Number(v))} suffix="%" step={0.1} hint="Max increase 10% / 2 years (2024 reform)" />
                <InputField label="Alternative investment return" value={rendementPlacement} onChange={(v) => setRendementPlacement(Number(v))} suffix="%" step={0.1} hint="Adjustable — if renting, the down payment is invested elsewhere" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Horizon</h2>
              <InputField label="Comparison period" value={horizon} onChange={(v) => setHorizon(Number(v))} suffix="years" min={1} max={35} />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verdict */}
            <div className={`rounded-2xl p-8 text-white text-center shadow-lg ${
              result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                ? "bg-gradient-to-br from-navy to-navy-light"
                : "bg-gradient-to-br from-teal to-teal-light"
            }`}>
              <div className="text-sm text-white/60">
                {result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                  ? `Buying is more advantageous over ${horizon} years`
                  : `Renting is more advantageous over ${horizon} years`}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs text-white/50">Net wealth if buying</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetAchat)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Capital if renting + investing</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetLocation)}</div>
                </div>
              </div>
              {result.croisement && (
                <div className="mt-4 text-sm text-white/70">
                  Buying becomes more advantageous from year {result.croisement.annee}
                </div>
              )}
            </div>

            {/* Crossover chart */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-navy">Net wealth evolution</h3>
                <p className="text-xs text-muted mt-1">
                  Purchase wealth (property value - outstanding balance) vs accumulated capital if renting + investing
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
                    label={{ value: "Year", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "#6B7280" }}
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
                      name === "achat" ? "Purchase wealth" : "Rental capital",
                    ]}
                    labelFormatter={(label) => `Year ${label}`}
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
                        value: `Crossover ~yr ${result.crossoverYear.toFixed(1)}`,
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
                  Purchase wealth
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: "#2A9D8F" }} />
                  Rental capital
                </span>
                {result.crossoverYear && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-5 rounded-sm border-b-2 border-dashed" style={{ borderColor: "#C8A951" }} />
                    Crossover point
                  </span>
                )}
              </div>
            </div>

            {/* Compared monthly costs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultPanel
                title="Monthly cost — Purchase"
                lines={[
                  { label: "Mortgage payment", value: formatEUR2(result.mensualiteCredit) },
                  { label: "Condominium charges", value: formatEUR2(chargesCoproMensuel), sub: true },
                  { label: "Property tax", value: formatEUR2(taxeFonciereAn / 12), sub: true },
                  { label: "Maintenance", value: formatEUR2(prixBien * entretienAnPct / 100 / 12), sub: true },
                  { label: "SRD insurance", value: formatEUR2(result.assuranceSRDMensuel), sub: true },
                  { label: "Gross monthly total", value: formatEUR2(coutMensuelTotal), highlight: true },
                  { label: "Interest tax saving (yr 1)", value: `- ${formatEUR2(economieFiscaleMensuelleAn1)}`, sub: true },
                  { label: "Net monthly cost (yr 1)", value: formatEUR2(coutMensuelNetAchat), highlight: true },
                ]}
              />
              <ResultPanel
                title="Monthly cost — Rental"
                lines={[
                  { label: "Rent (year 1)", value: formatEUR2(loyerMensuel) },
                  { label: `Rent (year ${horizon})`, value: formatEUR2(loyerMensuel * Math.pow(1 + indexationLoyer / 100, horizon - 1)), sub: true },
                  { label: "Net monthly difference (yr 1)", value: formatEUR2(coutMensuelNetAchat - loyerMensuel), highlight: true },
                ]}
              />
            </div>

            {/* Interest deduction — summary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultPanel
                title="Debit interest deduction"
                lines={[
                  { label: "Interest yr 1", value: formatEUR2(result.annees.length > 0 ? result.annees[0].deductionInterets : 0) },
                  { label: "Cap yr 1", value: formatEUR(deductionInteretsMax(1, nbPersonnes)), sub: true },
                  { label: `Cumulative tax saving (${horizon} yrs)`, value: formatEUR(result.derniere.economieFiscaleCumul), highlight: true },
                ]}
              />
              <ResultPanel
                title="Outstanding balance insurance"
                lines={[
                  { label: "Monthly cost", value: formatEUR2(result.assuranceSRDMensuel) },
                  { label: "Annual cost", value: formatEUR2(result.assuranceSRDMensuel * 12), sub: true },
                  { label: `Total cost (${Math.min(horizon, dureeCredit)} yrs)`, value: formatEUR(result.assuranceSRDMensuel * 12 * Math.min(horizon, dureeCredit)), highlight: true },
                ]}
              />
            </div>

            {/* Year-by-year table */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Year</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Property value</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Outstanding balance</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Purchase wealth</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Investment capital</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Advantage</th>
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
                          {diff > 0 ? "Buy" : "Rent"} {formatEUR(Math.abs(diff))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Adjustable assumptions:</strong> The result depends heavily on property appreciation
                ({appreciationAn}%/year) and alternative investment return ({rendementPlacement}%/year).
                Modify these parameters to test different scenarios. Acquisition fees in Luxembourg (Bellegen Akt)
                make buying more attractive than in France thanks to the tax credit.
                The debit interest deduction (art. 98bis LIR) reduces the effective cost of buying,
                especially during the first 5 years (max {formatEUR(2000 * nbPersonnes)}/year for {nbPersonnes} person{nbPersonnes > 1 ? "s" : ""}).
                Outstanding balance insurance ({tauxAssuranceSRD}%) is an often overlooked cost.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
