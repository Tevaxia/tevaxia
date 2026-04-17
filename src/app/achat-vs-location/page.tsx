"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import InputField from "@/components/InputField";
import SliderField from "@/components/SliderField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";
import { generateAchatLocationPdfBlob, PdfButton } from "@/components/ToolsPdf";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";

// Box-Muller : échantillon normal N(mean, sd)
function sampleNormal(mean: number, sd: number): number {
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sd * z0;
}

interface MonteCarloProps {
  baselineAppreciation: number;
  baselineRendement: number;
  baselineIndexation: number;
  horizon: number;
  prixBien: number;
  apport: number;
  fraisAcquisitionPct: number;
  mensualiteCredit: number;
  capitalCredit: number;
  tauxCredit: number;
  dureeCredit: number;
  loyerMensuel: number;
  chargesCoproMensuel: number;
  taxeFonciereAn: number;
  entretienAnPct: number;
  assuranceSRDMensuel: number;
}

function MonteCarloSection(props: MonteCarloProps) {
  const t = useTranslations("achatLocation");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{
    pctAchat: number;
    meanAchat: number;
    meanLoc: number;
    medianDiff: number;
    p5Diff: number;
    p95Diff: number;
    histogram: { bucket: string; count: number }[];
  } | null>(null);

  const runSimulation = () => {
    setRunning(true);
    // Run in microtask to let UI update
    setTimeout(() => {
      const N = 1000;
      const diffs: number[] = [];
      const achatVals: number[] = [];
      const locVals: number[] = [];
      let achatWins = 0;

      for (let i = 0; i < N; i++) {
        // Échantillonner les paramètres clés
        const apprec = sampleNormal(props.baselineAppreciation, 2) / 100;
        const rendement = sampleNormal(props.baselineRendement, 3) / 100;
        const indexation = Math.max(0, sampleNormal(props.baselineIndexation, 1)) / 100;

        // Simulation simplifiée sur l'horizon : recalcul identique à l'engine
        const fraisAcquisition = props.prixBien * (props.fraisAcquisitionPct / 100);
        let capitalRestant = props.capitalCredit;
        let placementCapital = props.apport + fraisAcquisition;
        let loyerAnnuel = props.loyerMensuel * 12;

        for (let a = 1; a <= props.horizon; a++) {
          const valeurBien = props.prixBien * Math.pow(1 + apprec, a);
          const interetsAnnuels = capitalRestant * (props.tauxCredit / 100);
          const capitalAnnuel = Math.min(props.mensualiteCredit * 12 - interetsAnnuels, capitalRestant);
          capitalRestant = Math.max(0, capitalRestant - capitalAnnuel);

          const coutAchatMensuel =
            props.mensualiteCredit +
            props.chargesCoproMensuel +
            props.taxeFonciereAn / 12 +
            (props.prixBien * (props.entretienAnPct / 100)) / 12 +
            props.assuranceSRDMensuel;
          const loyerMensuelA = loyerAnnuel / 12;
          const economieMensuelle = coutAchatMensuel - loyerMensuelA;
          if (economieMensuelle > 0) placementCapital += economieMensuelle * 12;
          placementCapital *= 1 + rendement;
          loyerAnnuel *= 1 + indexation;

          if (a === props.horizon) {
            const patrimoineAchat = valeurBien - capitalRestant;
            const patrimoineLoc = placementCapital;
            achatVals.push(patrimoineAchat);
            locVals.push(patrimoineLoc);
            diffs.push(patrimoineAchat - patrimoineLoc);
            if (patrimoineAchat > patrimoineLoc) achatWins++;
          }
        }
      }

      diffs.sort((a, b) => a - b);
      const p5 = diffs[Math.floor(N * 0.05)];
      const p95 = diffs[Math.floor(N * 0.95)];
      const median = diffs[Math.floor(N * 0.5)];
      const meanAchat = achatVals.reduce((s, v) => s + v, 0) / N;
      const meanLoc = locVals.reduce((s, v) => s + v, 0) / N;

      // Histogramme diff (achat − location)
      const min = diffs[0];
      const max = diffs[N - 1];
      const nbBuckets = 20;
      const bucketSize = (max - min) / nbBuckets;
      const buckets: number[] = Array(nbBuckets).fill(0);
      for (const d of diffs) {
        const idx = Math.min(nbBuckets - 1, Math.floor((d - min) / bucketSize));
        buckets[idx]++;
      }
      const histogram = buckets.map((count, i) => ({
        bucket: `${Math.round((min + i * bucketSize) / 1000)}k`,
        count,
      }));

      setResults({
        pctAchat: (achatWins / N) * 100,
        meanAchat,
        meanLoc,
        medianDiff: median,
        p5Diff: p5,
        p95Diff: p95,
        histogram,
      });
      setRunning(false);
    }, 10);
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="text-base font-semibold text-navy">{t("monteCarloTitle")}</h3>
          <p className="mt-0.5 text-xs text-muted">{t("monteCarloSubtitle")}</p>
        </div>
        <button
          onClick={runSimulation}
          disabled={running}
          className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50 whitespace-nowrap"
        >
          {running ? t("monteCarloRunning") : t("monteCarloRun")}
        </button>
      </div>

      {results && (
        <>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <div className={`rounded-lg p-3 text-center ${results.pctAchat >= 50 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
              <div className="text-[10px] uppercase tracking-wider text-muted">{t("monteCarloProbAchat")}</div>
              <div className={`mt-1 text-3xl font-bold ${results.pctAchat >= 50 ? "text-emerald-900" : "text-rose-900"}`}>
                {results.pctAchat.toFixed(1)} %
              </div>
            </div>
            <div className="rounded-lg p-3 border border-card-border bg-background text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted">{t("monteCarloMedianDiff")}</div>
              <div className={`mt-1 text-xl font-bold ${results.medianDiff >= 0 ? "text-navy" : "text-rose-700"}`}>
                {results.medianDiff >= 0 ? "+" : ""}{formatEUR(results.medianDiff)}
              </div>
            </div>
            <div className="rounded-lg p-3 border border-card-border bg-background text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted">{t("monteCarloIC90")}</div>
              <div className="mt-1 text-xs font-mono text-slate">
                {formatEUR(results.p5Diff)} à {formatEUR(results.p95Diff)}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={results.histogram} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
              <XAxis dataKey="bucket" tick={{ fontSize: 9 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: unknown) => (typeof v === "number" ? `${v} scénarios` : "—")}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill="#1e3a5f" />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[10px] text-muted text-center">{t("monteCarloHistogramLabel")}</p>
        </>
      )}

      {!results && !running && (
        <p className="text-xs text-muted italic">{t("monteCarloHelp")}</p>
      )}

      <p className="mt-3 text-[10px] text-muted">{t("monteCarloNote")}</p>
    </div>
  );
}

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
  const t = useTranslations("achatLocation");
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
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
          <div className="mt-4 inline-flex rounded-lg border border-card-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setViewMode("quick")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "quick"
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("viewQuick")}
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "full"
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("viewFull")}
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Inputs */}
          <div className="space-y-6">
            {/* Quick mode: 5 essential inputs */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionEssentials")}</h2>
              <div className="space-y-5">
                <SliderField label={t("prixBien")} value={prixBien} onChange={setPrixBien} min={100000} max={2000000} step={10000} suffix="€" />
                <SliderField label={t("apport")} value={apport} onChange={setApport} min={0} max={500000} step={5000} suffix="€" />
                <SliderField label={t("tauxCredit")} value={tauxCredit} onChange={setTauxCredit} min={1} max={6} step={0.1} suffix="%" />
                <SliderField label={t("loyerMensuel")} value={loyerMensuel} onChange={setLoyerMensuel} min={500} max={5000} step={50} suffix="€" />
                <SliderField label={t("dureeComparaison")} value={horizon} onChange={setHorizon} min={5} max={40} step={1} suffix={t("suffixAns")} />
              </div>
            </div>

            {/* Full mode: additional inputs */}
            {viewMode === "full" && (
              <>
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAchatDetails")}</h2>
                  <div className="space-y-4">
                    <InputField label={t("dureeCredit")} value={dureeCredit} onChange={(v) => setDureeCredit(Number(v))} suffix={t("suffixAns")} />
                    <InputField label={t("fraisAcquisition")} value={fraisAcquisitionPct} onChange={(v) => setFraisAcquisitionPct(Number(v))} suffix="%" hint={t("fraisAcquisitionHint")} />
                    <InputField label={t("chargesCopro")} value={chargesCoproMensuel} onChange={(v) => setChargesCoproMensuel(Number(v))} suffix={t("suffixEuroMois")} />
                    <InputField label={t("impotFoncier")} value={taxeFonciereAn} onChange={(v) => setTaxeFonciereAn(Number(v))} suffix={t("suffixEuroAn")} hint={t("impotFoncierHint")} />
                    <InputField label={t("entretienAnnuel")} value={entretienAnPct} onChange={(v) => setEntretienAnPct(Number(v))} suffix={t("suffixPctPrix")} hint={t("entretienAnnuelHint")} step={0.1} />
                    <SliderField label={t("appreciationAnnuelle")} value={appreciationAn} onChange={setAppreciationAn} min={0} max={8} step={0.5} suffix="%" hint={t("appreciationAnnuelleHint")} />
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAssuranceSRD")}</h2>
                  <div className="space-y-4">
                    <InputField
                      label={t("tauxAssuranceSRD")}
                      value={tauxAssuranceSRD}
                      onChange={(v) => setTauxAssuranceSRD(Number(v))}
                      suffix={t("suffixPctCapital")}
                      step={0.05}
                      hint={t("tauxAssuranceSRDHint")}
                    />
                    <div className="text-xs text-muted">
                      {t("coutMensuelLabel")} <span className="font-semibold text-foreground">{formatEUR2(result.assuranceSRDMensuel)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionDeductionInterets")}</h2>
                  <p className="mb-3 text-xs text-muted">
                    {t("deductionInteretsDescription")}
                  </p>
                  <div className="space-y-4">
                    <InputField
                      label={t("nbPersonnes")}
                      value={nbPersonnes}
                      onChange={(v) => setNbPersonnes(Math.max(1, Math.min(2, Number(v))))}
                      suffix={t("suffixPers")}
                      min={1}
                      max={2}
                    />
                    <InputField
                      label={t("tauxMarginal")}
                      value={tauxMarginalIR}
                      onChange={(v) => setTauxMarginalIR(Number(v))}
                      suffix="%"
                      step={1}
                      hint={t("tauxMarginalHint")}
                    />
                    <div className="text-xs text-muted">
                      {t("plafondDeductionAn1")} <span className="font-semibold text-foreground">{formatEUR(deductionInteretsMax(1, nbPersonnes))}</span>
                      {" — "}{t("economieFiscaleAn1")} <span className="font-semibold text-foreground">{formatEUR2(economieFiscaleMensuelleAn1 * 12)}/{t("perAn")}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionLocationDetails")}</h2>
                  <div className="space-y-4">
                    <SliderField label={t("indexationLoyer")} value={indexationLoyer} onChange={setIndexationLoyer} min={0} max={5} step={0.5} suffix="%" hint={t("indexationLoyerHint")} />
                    <SliderField label={t("rendementPlacement")} value={rendementPlacement} onChange={setRendementPlacement} min={0} max={10} step={0.5} suffix="%" hint={t("rendementPlacementHint")} />
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
                  ? t("verdictAchat", { horizon })
                  : t("verdictLocation", { horizon })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs text-white/50">{t("patrimoineAchat")}</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetAchat)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">{t("capitalLocation")}</div>
                  <div className="text-3xl font-bold mt-1">{formatEUR(result.derniere.patrimoineNetLocation)}</div>
                </div>
              </div>
              {result.croisement && (
                <div className="mt-4 text-sm text-white/70">
                  {t("croisementMessage", { annee: result.croisement.annee })}
                </div>
              )}
            </div>

            <AiAnalysisCard
              context={[
                `Horizon: ${horizon} ans — ménage ${nbPersonnes} personne(s)`,
                `— Achat —`,
                `Prix: ${formatEUR(prixBien)}, apport: ${formatEUR(apport)}, crédit ${tauxCredit}% sur ${dureeCredit} ans`,
                `Frais acquisition: ${fraisAcquisitionPct}% — charges copro: ${formatEUR(chargesCoproMensuel)}/mois`,
                `Taxe foncière: ${formatEUR(taxeFonciereAn)}/an, entretien: ${entretienAnPct}%/an, appréciation: ${appreciationAn}%/an`,
                `Assurance SRD: ${tauxAssuranceSRD}%`,
                `— Location —`,
                `Loyer: ${formatEUR(loyerMensuel)}/mois, indexation ${indexationLoyer}%/an`,
                `Placement alternatif: ${rendementPlacement}%/an`,
                "",
                `Patrimoine net fin horizon — Achat: ${formatEUR(result.derniere.patrimoineNetAchat)}`,
                `Patrimoine net fin horizon — Location+placement: ${formatEUR(result.derniere.patrimoineNetLocation)}`,
                result.croisement ? `Point de bascule: année ${result.croisement.annee}` : `Pas de bascule sur ${horizon} ans`,
                `Déduction intérêts LIR plafonnée: ${formatEUR(deductionInteretsMax(1, nbPersonnes))}/an an 1`,
              ].join("\n")}
              prompt="Conseille cet utilisateur particulier au Luxembourg sur le choix achat vs location. Structure : (1) le verdict chiffré sur cet horizon et le point de bascule, (2) facteurs NON chiffrés à peser (stabilité professionnelle/familiale, mobilité, amour du bien, liquidité), (3) risques spécifiques achat (remontée taux, chute prix, copropriété dégradée) vs risques location (hausse loyers, obligation de départ), (4) profils où le choix bascule (mutation probable, famille à agrandir, entrepreneur, approche retraite). Personnalisé, humain, pas que comptable."
            />

            <div className="flex justify-end gap-2">
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `Achat vs Location — ${formatEUR(prixBien)} vs ${formatEUR(loyerMensuel)}/mois`,
                    type: "achat-location",
                    valeurPrincipale: result.derniere.patrimoineNetAchat,
                    data: { prixBien, apport, tauxCredit, dureeCredit, loyerMensuel, horizon, fraisAcquisitionPct, chargesCoproMensuel, taxeFonciereAn, entretienAnPct, appreciationAn, indexationLoyer, rendementPlacement },
                  });
                }}
                label="Sauvegarder"
                successLabel="Sauvegardé !"
              />
              <PdfButton
                label="PDF"
                filename={`achat-vs-location-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                generateBlob={() =>
                  generateAchatLocationPdfBlob({
                    verdict: result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation ? "Achat" : "Location",
                    prixAchat: prixBien,
                    loyerMensuel,
                    dureeAns: horizon,
                    tauxCredit,
                    patrimoineAchat: result.derniere.patrimoineNetAchat,
                    patrimoineLocation: result.derniere.patrimoineNetLocation,
                    crossoverYear: result.crossoverYear != null ? Math.round(result.crossoverYear) : undefined,
                    economieAchat: result.derniere.patrimoineNetAchat > result.derniere.patrimoineNetLocation
                      ? result.derniere.patrimoineNetAchat - result.derniere.patrimoineNetLocation
                      : undefined,
                  })
                }
              />
            </div>

            {/* Crossover chart */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-navy">{t("chartTitle")}</h3>
                <p className="text-xs text-muted mt-1">
                  {t("chartDescription")}
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
                    label={{ value: t("axisAnnee"), position: "insideBottomRight", offset: -5, fontSize: 11, fill: "#6B7280" }}
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
                      name === "achat" ? t("legendeAchat") : t("legendeLocation"),
                    ]}
                    labelFormatter={(label) => t("tooltipAnnee", { annee: label })}
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
                        value: t("croisementLabel", { annee: result.crossoverYear.toFixed(1) }),
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
                  {t("legendeAchat")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: "#2A9D8F" }} />
                  {t("legendeLocation")}
                </span>
                {result.crossoverYear && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-5 rounded-sm border-b-2 border-dashed" style={{ borderColor: "#C8A951" }} />
                    {t("legendeCroisement")}
                  </span>
                )}
              </div>
            </div>

            {viewMode === "full" && (
              <>
                {/* Coûts mensuels comparés */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultPanel
                    title={t("coutMensuelAchat")}
                    lines={[
                      { label: t("mensualiteCredit"), value: formatEUR2(result.mensualiteCredit) },
                      { label: t("chargesCopro"), value: formatEUR2(chargesCoproMensuel), sub: true },
                      { label: t("impotFoncier"), value: formatEUR2(taxeFonciereAn / 12), sub: true },
                      { label: t("entretien"), value: formatEUR2(prixBien * entretienAnPct / 100 / 12), sub: true },
                      { label: t("assuranceSRD"), value: formatEUR2(result.assuranceSRDMensuel), sub: true },
                      { label: t("totalBrutMensuel"), value: formatEUR2(coutMensuelTotal), highlight: true },
                      { label: t("economieFiscaleInteretsAn1"), value: `- ${formatEUR2(economieFiscaleMensuelleAn1)}`, sub: true },
                      { label: t("coutNetMensuelAn1"), value: formatEUR2(coutMensuelNetAchat), highlight: true },
                    ]}
                  />
                  <ResultPanel
                    title={t("coutMensuelLocation")}
                    lines={[
                      { label: t("loyerAnnee1"), value: formatEUR2(loyerMensuel) },
                      { label: t("loyerAnneeN", { annee: horizon }), value: formatEUR2(loyerMensuel * Math.pow(1 + indexationLoyer / 100, horizon - 1)), sub: true },
                      { label: t("differenceMensuelleAn1"), value: formatEUR2(coutMensuelNetAchat - loyerMensuel), highlight: true },
                    ]}
                  />
                </div>

                {/* Déduction intérêts — résumé */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultPanel
                    title={t("deductionInteretsTitle")}
                    lines={[
                      { label: t("interetsAn1"), value: formatEUR2(result.annees.length > 0 ? result.annees[0].deductionInterets : 0) },
                      { label: t("plafondAn1"), value: formatEUR(deductionInteretsMax(1, nbPersonnes)), sub: true },
                      { label: t("economieFiscaleCumulee", { horizon }), value: formatEUR(result.derniere.economieFiscaleCumul), highlight: true },
                    ]}
                  />
                  <ResultPanel
                    title={t("assuranceSRDTitle")}
                    lines={[
                      { label: t("coutMensuel"), value: formatEUR2(result.assuranceSRDMensuel) },
                      { label: t("coutAnnuel"), value: formatEUR2(result.assuranceSRDMensuel * 12), sub: true },
                      { label: t("coutTotal", { annees: Math.min(horizon, dureeCredit) }), value: formatEUR(result.assuranceSRDMensuel * 12 * Math.min(horizon, dureeCredit)), highlight: true },
                    ]}
                  />
                </div>

                {/* Tableau année par année */}
                <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-card-border bg-background">
                        <th className="px-3 py-2 text-left font-semibold text-navy">{t("colAnnee")}</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">{t("colValeurBien")}</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">{t("colCapitalRestant")}</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">{t("colPatrimoineAchat")}</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">{t("colCapitalPlacement")}</th>
                        <th className="px-3 py-2 text-right font-semibold text-navy">{t("colAvantage")}</th>
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
                              {diff > 0 ? t("achat") : t("location")} {formatEUR(Math.abs(diff))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>{t("hypothesesTitle")}</strong> {t("hypothesesText", { appreciation: appreciationAn, rendement: rendementPlacement, plafond: formatEUR(2000 * nbPersonnes), nbPersonnes, tauxSRD: tauxAssuranceSRD })}
                  </p>
                </div>

                <MonteCarloSection
                  baselineAppreciation={appreciationAn}
                  baselineRendement={rendementPlacement}
                  baselineIndexation={indexationLoyer}
                  horizon={horizon}
                  prixBien={prixBien}
                  apport={apport}
                  fraisAcquisitionPct={fraisAcquisitionPct}
                  mensualiteCredit={result.mensualiteCredit}
                  capitalCredit={result.montantCredit}
                  tauxCredit={tauxCredit}
                  dureeCredit={dureeCredit}
                  loyerMensuel={loyerMensuel}
                  chargesCoproMensuel={chargesCoproMensuel}
                  taxeFonciereAn={taxeFonciereAn}
                  entretienAnPct={entretienAnPct}
                  assuranceSRDMensuel={result.assuranceSRDMensuel}
                />
              </>
            )}
          </div>
        </div>
      </div>

    </div>

    <SEOContent
      ns="achatLocation"
      sections={[
        { titleKey: "dilemmeTitle", contentKey: "dilemmeContent" },
        { titleKey: "tcoTitle", contentKey: "tcoContent" },
        { titleKey: "levierTitle", contentKey: "levierContent" },
        { titleKey: "seuilTitle", contentKey: "seuilContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/frais-acquisition", labelKey: "frais" },
        { href: "/simulateur-aides", labelKey: "aides" },
        { href: "/outils-bancaires", labelKey: "bancaire" },
      ]}
    />
    </>
  );
}
