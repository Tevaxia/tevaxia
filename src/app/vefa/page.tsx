"use client";

import { useState, useMemo, useCallback } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerEmolumentsNotaire, formatEUR, formatPct } from "@/lib/calculations";

// ── Luxembourg VEFA milestones ──────────────────────────────
interface MilestoneDef {
  label: string;
  defaultPct: number;       // % of purchase price (default)
  monthsAfterStart: number;
}

const DEFAULT_MILESTONES: MilestoneDef[] = [
  { label: "Signature du contrat",          defaultPct: 5,   monthsAfterStart: 0 },
  { label: "Fondations achevees",           defaultPct: 15,  monthsAfterStart: 4 },
  { label: "Hors d'eau (murs montes)",      defaultPct: 20,  monthsAfterStart: 10 },
  { label: "Hors d'air (toiture achevee)",  defaultPct: 20,  monthsAfterStart: 14 },
  { label: "Cloisons interieures",          defaultPct: 15,  monthsAfterStart: 18 },
  { label: "Travaux de finition",           defaultPct: 15,  monthsAfterStart: 22 },
  { label: "Livraison (remise des cles)",   defaultPct: 10,  monthsAfterStart: 26 },
];

// ── TVA / duties constants ──────────────────────────────────
const TVA_NORMAL = 0.17;
const TVA_REDUIT = 0.03;
const TVA_FAVEUR_PLAFOND = 50_000;
const TAUX_DROITS = 0.07; // 6% enregistrement + 1% transcription

// ── Month names for timeline ─────────────────────────────────
const MONTH_NAMES_SHORT = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
];

export default function VefaCalculator() {
  // ── Inputs ──────────────────────────────────────────────────
  const [prixTotal, setPrixTotal] = useState(650000);
  const [partTerrain, setPartTerrain] = useState(195000);
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [nbAcquereurs, setNbAcquereurs] = useState<1 | 2>(2);
  const [montantHypotheque, setMontantHypotheque] = useState(520000);
  const [moisDebut, setMoisDebut] = useState("2026-06");

  // ── Intercalary interest inputs ─────────────────────────────
  const [tauxHypotheque, setTauxHypotheque] = useState(3.5); // annual rate in %

  // ── Customizable milestone percentages ──────────────────────
  const [milestonePcts, setMilestonePcts] = useState<number[]>(
    DEFAULT_MILESTONES.map((m) => m.defaultPct)
  );

  const handlePctChange = useCallback((index: number, value: string) => {
    const num = parseFloat(value);
    setMilestonePcts((prev) => {
      const next = [...prev];
      next[index] = isNaN(num) ? 0 : num;
      return next;
    });
  }, []);

  const resetPcts = useCallback(() => {
    setMilestonePcts(DEFAULT_MILESTONES.map((m) => m.defaultPct));
  }, []);

  const totalPct = milestonePcts.reduce((s, p) => s + p, 0);
  const pctValid = Math.abs(totalPct - 100) < 0.01;

  const partConstruction = Math.max(0, prixTotal - partTerrain);

  // ── Calculations ────────────────────────────────────────────
  const calc = useMemo(() => {
    // -- Droits d'enregistrement (terrain only) --
    const droitsBruts = partTerrain * TAUX_DROITS;
    const bellegenAktMax = nbAcquereurs * 40_000;
    const bellegenAkt = residencePrincipale ? Math.min(bellegenAktMax, droitsBruts) : 0;
    const droitsNets = Math.max(0, droitsBruts - bellegenAkt);

    // -- TVA on construction --
    let tvaMontant: number;
    let faveurFiscale = 0;
    let tauxEffectif: number;

    if (residencePrincipale) {
      const tvaNormale = partConstruction * TVA_NORMAL;
      const tvaReduite = partConstruction * TVA_REDUIT;
      faveurFiscale = Math.min(TVA_FAVEUR_PLAFOND, tvaNormale - tvaReduite);
      tvaMontant = tvaNormale - faveurFiscale;
      tauxEffectif = partConstruction > 0 ? tvaMontant / partConstruction : TVA_REDUIT;
    } else {
      tvaMontant = partConstruction * TVA_NORMAL;
      tauxEffectif = TVA_NORMAL;
    }

    // -- Notary fees --
    const emolumentsNotaire = calculerEmolumentsNotaire(prixTotal);

    // -- Mortgage costs --
    const droitsHypotheque = montantHypotheque * 0.005;
    const fraisHypotheque = droitsHypotheque + calculerEmolumentsNotaire(montantHypotheque) * 0.5;

    // -- Totals --
    const totalFrais = droitsNets + tvaMontant + emolumentsNotaire + fraisHypotheque;
    const coutTotal = prixTotal + totalFrais;

    // -- Appels de fonds (milestone schedule) --
    const [startYear, startMonth] = moisDebut.split("-").map(Number);
    const tauxMensuel = (tauxHypotheque / 100) / 12;

    let cumulVerse = 0;      // cumulative amount paid to promoter
    let cumulIntercalaire = 0; // cumulative intercalary interest paid

    const milestoneRows = DEFAULT_MILESTONES.map((m, i) => {
      const pct = milestonePcts[i] / 100;
      const montant = prixTotal * pct;
      const totalMonths = (startYear * 12 + (startMonth - 1)) + m.monthsAfterStart;
      const year = Math.floor(totalMonths / 12);
      const month = (totalMonths % 12) + 1;
      const dateStr = `${String(month).padStart(2, "0")}/${year}`;

      // Intercalary interest calculation:
      // After this payment, the bank has disbursed cumulVerse + montant of the mortgage.
      // But the disbursed amount from the mortgage is capped at the mortgage amount.
      // Between this milestone and the next, the buyer pays interest on the drawn-down amount.
      const prevCumulVerse = cumulVerse;
      cumulVerse += montant;

      // The amount drawn from the mortgage at this point:
      // Typically the buyer's own funds (apport) are used first, then the mortgage.
      // For simplicity, we assume the mortgage is drawn proportionally to payments.
      // drawn = min(cumulVerse, montantHypotheque) * (montantHypotheque / prixTotal)
      // A more standard approach: drawn = cumulVerse * (montantHypotheque / prixTotal)
      // capped at montantHypotheque
      const ratioMortgage = montantHypotheque > 0 && prixTotal > 0
        ? Math.min(1, montantHypotheque / prixTotal)
        : 0;
      const drawnAfterPayment = Math.min(montantHypotheque, cumulVerse * ratioMortgage);

      // Months until next milestone (or 0 for last)
      const nextMonths = i < DEFAULT_MILESTONES.length - 1
        ? DEFAULT_MILESTONES[i + 1].monthsAfterStart - m.monthsAfterStart
        : 0;

      // Intercalary interest for this phase = drawn amount * monthly rate * months
      const interetPhase = drawnAfterPayment * tauxMensuel * nextMonths;
      cumulIntercalaire += interetPhase;

      return {
        label: m.label,
        pct,
        montant,
        cumul: cumulVerse,
        dateStr,
        monthsAfterStart: m.monthsAfterStart,
        drawnMortgage: drawnAfterPayment,
        monthsToNext: nextMonths,
        interetPhase,
        cumulIntercalaire,
      };
    });

    const totalIntercalaire = cumulIntercalaire;

    return {
      partConstruction,
      droitsBruts,
      bellegenAkt,
      droitsNets,
      tvaMontant,
      faveurFiscale,
      tauxEffectif,
      emolumentsNotaire,
      fraisHypotheque,
      totalFrais,
      coutTotal,
      milestones: milestoneRows,
      totalIntercalaire,
    };
  }, [prixTotal, partTerrain, residencePrincipale, nbAcquereurs, montantHypotheque, moisDebut, partConstruction, milestonePcts, tauxHypotheque]);

  // ── Timeline helpers ────────────────────────────────────────
  const timelineData = useMemo(() => {
    const [startYear, startMonth] = moisDebut.split("-").map(Number);
    if (!startYear || !startMonth) return null;

    const totalDuration = DEFAULT_MILESTONES[DEFAULT_MILESTONES.length - 1].monthsAfterStart;
    if (totalDuration === 0) return null;

    const points = DEFAULT_MILESTONES.map((m, i) => {
      const absMonth = (startYear * 12 + (startMonth - 1)) + m.monthsAfterStart;
      const year = Math.floor(absMonth / 12);
      const month = (absMonth % 12) + 1;
      const label = `${MONTH_NAMES_SHORT[month - 1]} ${year}`;
      const position = (m.monthsAfterStart / totalDuration) * 100;
      return {
        label,
        milestoneLabel: m.label,
        pct: milestonePcts[i],
        position,
        monthsAfterStart: m.monthsAfterStart,
      };
    });

    return { points, totalDuration };
  }, [moisDebut, milestonePcts]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Simulateur VEFA
          </h1>
          <p className="mt-2 text-muted">
            Vente en Etat Futur d'Achevement — appels de fonds, TVA, droits d'enregistrement, garantie d'achevement
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Left column: Inputs ─────────────────────────── */}
          <div className="space-y-6">
            {/* Property */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Le bien VEFA</h2>
              <div className="space-y-4">
                <InputField
                  label="Prix de vente total (TTC promoteur)"
                  value={prixTotal}
                  onChange={(v) => setPrixTotal(Number(v))}
                  suffix="EUR"
                  min={0}
                  hint="Prix contractuel tout compris hors frais d'acquisition"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Part terrain"
                    value={partTerrain}
                    onChange={(v) => setPartTerrain(Number(v))}
                    suffix="EUR"
                    min={0}
                    hint="Soumise aux droits d'enregistrement (7 %)"
                  />
                  <InputField
                    label="Part construction"
                    value={partConstruction}
                    onChange={() => {}}
                    suffix="EUR"
                    hint="= Prix - Terrain (soumise a la TVA)"
                  />
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Acquereur</h2>
              <div className="space-y-4">
                <ToggleField
                  label="Residence principale"
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                  hint="Ouvre droit a la TVA 3 % et au Bellegen Akt"
                />
                <InputField
                  label="Nombre d'acquereurs"
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: "1 personne (40 000 EUR Bellegen Akt)" },
                    { value: "2", label: "2 personnes / couple (80 000 EUR Bellegen Akt)" },
                  ]}
                />
              </div>
            </div>

            {/* Financing */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Financement</h2>
              <div className="space-y-4">
                <InputField
                  label="Montant du pret hypothecaire"
                  value={montantHypotheque}
                  onChange={(v) => setMontantHypotheque(Number(v))}
                  suffix="EUR"
                  min={0}
                  hint="Pour le calcul des frais d'inscription hypothecaire"
                />
                <InputField
                  label="Taux hypothecaire annuel"
                  value={tauxHypotheque}
                  onChange={(v) => setTauxHypotheque(Number(v))}
                  suffix="%"
                  min={0}
                  max={15}
                  step={0.1}
                  hint="Pour le calcul des interets intercalaires pendant la construction"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Calendrier previsionnel</h2>
              <InputField
                label="Mois de signature prevu"
                type="text"
                value={moisDebut}
                onChange={setMoisDebut}
                hint="Format AAAA-MM (ex : 2026-06)"
              />
            </div>

            {/* Customizable milestone percentages */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-navy">Echeancier contractuel</h2>
                <button
                  onClick={resetPcts}
                  className="rounded-lg border border-card-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-slate"
                >
                  Reinitialiser
                </button>
              </div>
              <p className="mb-4 text-xs text-muted">
                Adaptez les pourcentages a votre contrat VEFA. Le total doit etre egal a 100 %.
              </p>
              <div className="space-y-3">
                {DEFAULT_MILESTONES.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-slate truncate" title={m.label}>
                      {m.label}
                    </span>
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        value={milestonePcts[i]}
                        onChange={(e) => handlePctChange(i, e.target.value)}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full rounded-lg border border-input-border bg-input-bg py-1.5 pl-3 pr-8 text-right text-sm font-mono text-foreground shadow-sm transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                        %
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-card-border pt-3">
                  <span className="text-sm font-semibold text-slate">Total</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      pctValid ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {totalPct.toFixed(0)} %
                  </span>
                </div>
                {!pctValid && (
                  <p className="text-xs font-medium text-red-500">
                    Le total des pourcentages doit etre egal a 100 %. Difference : {(totalPct - 100).toFixed(1)} %
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column: Results ───────────────────────── */}
          <div className="space-y-6">
            {/* Visual Timeline */}
            {timelineData && (
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-navy">
                  Chronologie du chantier
                </h3>
                {/* Timeline — version tableau pour éviter les chevauchements */}
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr>
                        {timelineData.points.map((pt, i) => (
                          <th key={i} className="px-1 pb-2 font-semibold text-navy text-[10px] align-bottom">
                            {pt.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Progress bar row */}
                      <tr>
                        <td colSpan={timelineData.points.length} className="py-2 px-2">
                          <div className="relative h-3 rounded-full bg-blue-100">
                            {timelineData.points.map((pt, i) => (
                              <div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                style={{ left: `${pt.position}%` }}
                              >
                                <div className={`h-4 w-4 rounded-full border-2 border-white shadow-sm ${
                                  i === 0 ? "bg-navy" : i === timelineData.points.length - 1 ? "bg-emerald-500" : "bg-blue-500"
                                }`} />
                              </div>
                            ))}
                            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-navy via-blue-500 to-emerald-500" style={{ width: "100%" }} />
                          </div>
                        </td>
                      </tr>
                      {/* Milestone labels */}
                      <tr>
                        {timelineData.points.map((pt, i) => (
                          <td key={i} className="px-1 pt-2 align-top">
                            <div className="text-[9px] text-muted leading-tight">{pt.milestoneLabel}</div>
                          </td>
                        ))}
                      </tr>
                      {/* Percentages */}
                      <tr>
                        {timelineData.points.map((pt, i) => (
                          <td key={i} className="px-1 pt-1">
                            <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-600">{pt.pct}%</span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted">
                  Duree estimee : {timelineData.totalDuration} mois du contrat a la livraison. Les dates sont indicatives et dependent de l'avancement reel des travaux.
                </p>
              </div>
            )}

            {/* Milestone schedule */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                Echeancier des appels de fonds
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-2">Etape</th>
                      <th className="pb-2 pr-2 text-right">%</th>
                      <th className="pb-2 pr-2 text-right">Montant</th>
                      <th className="pb-2 pr-2 text-right">Cumul</th>
                      <th className="pb-2 text-right">Date est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border/50">
                    {calc.milestones.map((m, i) => (
                      <tr key={i} className={i === calc.milestones.length - 1 ? "font-semibold text-navy" : "text-foreground"}>
                        <td className="py-2 pr-2">{m.label}</td>
                        <td className="py-2 pr-2 text-right font-mono">{(m.pct * 100).toFixed(0)} %</td>
                        <td className="py-2 pr-2 text-right font-mono">{formatEUR(m.montant)}</td>
                        <td className="py-2 pr-2 text-right font-mono">{formatEUR(m.cumul)}</td>
                        <td className="py-2 text-right font-mono text-muted">{m.dateStr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!pctValid && (
                <p className="mt-3 text-xs font-medium text-red-500">
                  Attention : le total des pourcentages n'est pas egal a 100 %.
                </p>
              )}
              <p className="mt-3 text-xs text-muted">
                Echeancier indicatif selon l'avancement des travaux. Les appels de fonds sont emis par le promoteur sur constatation de l'achevement de chaque etape par un architecte independant.
              </p>
            </div>

            {/* Intercalary interest section */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-navy">
                Interets intercalaires
              </h3>
              <p className="mb-4 text-xs text-muted">
                Pendant la construction, la banque debloque le pret progressivement. L'acquereur paie des interets sur le capital deja debourse, sans rembourser le capital. C'est le cout cache n°1 d'un achat en VEFA.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-2">Phase</th>
                      <th className="pb-2 pr-2 text-right">Capital debourse</th>
                      <th className="pb-2 pr-2 text-right">Duree</th>
                      <th className="pb-2 pr-2 text-right">Interets phase</th>
                      <th className="pb-2 text-right">Cumul interets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border/50">
                    {calc.milestones.map((m, i) => (
                      <tr
                        key={i}
                        className={
                          i === calc.milestones.length - 1
                            ? "font-semibold text-navy"
                            : "text-foreground"
                        }
                      >
                        <td className="py-2 pr-2">{m.label}</td>
                        <td className="py-2 pr-2 text-right font-mono">{formatEUR(m.drawnMortgage)}</td>
                        <td className="py-2 pr-2 text-right font-mono">
                          {m.monthsToNext > 0 ? `${m.monthsToNext} mois` : "—"}
                        </td>
                        <td className="py-2 pr-2 text-right font-mono">
                          {m.interetPhase > 0 ? formatEUR(m.interetPhase) : "—"}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {m.cumulIntercalaire > 0 ? formatEUR(m.cumulIntercalaire) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gold font-semibold text-navy">
                      <td className="pt-3 pr-2" colSpan={3}>Total interets intercalaires</td>
                      <td className="pt-3 pr-2 text-right font-mono" colSpan={2}>
                        {formatEUR(calc.totalIntercalaire)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-800">
                  Cout intercalaire estime : <span className="font-bold">{formatEUR(calc.totalIntercalaire)}</span> sur toute la duree de la construction
                  ({tauxHypotheque.toFixed(1)} % annuel sur un pret de {formatEUR(montantHypotheque)}).
                  Ce montant s'ajoute au cout total d'acquisition et represente {prixTotal > 0 ? formatPct(calc.totalIntercalaire / prixTotal) : "— %"} du prix du bien.
                </p>
              </div>
            </div>

            {/* Droits d'enregistrement */}
            <ResultPanel
              title="Droits d'enregistrement (terrain)"
              lines={[
                { label: "Part terrain", value: formatEUR(partTerrain), sub: true },
                { label: "Droits bruts (7 %)", value: formatEUR(calc.droitsBruts) },
                ...(calc.bellegenAkt > 0
                  ? [{ label: `Bellegen Akt (${nbAcquereurs} x 40 000 EUR)`, value: `- ${formatEUR(calc.bellegenAkt)}` }]
                  : []),
                { label: "Droits nets a payer", value: formatEUR(calc.droitsNets), highlight: true },
              ]}
            />

            {/* TVA */}
            <ResultPanel
              title="TVA (construction)"
              lines={[
                { label: "Base TVA (construction)", value: formatEUR(calc.partConstruction), sub: true },
                {
                  label: "Taux applique",
                  value: residencePrincipale ? "3 % (reduit)" : "17 % (normal)",
                },
                { label: "Montant TVA", value: formatEUR(calc.tvaMontant) },
                ...(calc.faveurFiscale > 0
                  ? [
                      { label: "Faveur fiscale TVA 3 %", value: formatEUR(calc.faveurFiscale), sub: true },
                      {
                        label: "Plafond de faveur",
                        value: `${formatEUR(TVA_FAVEUR_PLAFOND)}`,
                        sub: true,
                        warning: calc.faveurFiscale >= TVA_FAVEUR_PLAFOND,
                      },
                    ]
                  : []),
              ]}
            />

            {/* Other fees */}
            <ResultPanel
              title="Autres frais"
              lines={[
                { label: "Emoluments notariaux", value: formatEUR(calc.emolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [{ label: "Frais d'hypotheque", value: formatEUR(calc.fraisHypotheque) }]
                  : []),
              ]}
            />

            {/* Grand total */}
            <ResultPanel
              title="Cout total de l'acquisition VEFA"
              className="border-gold/30"
              lines={[
                { label: "Prix du bien", value: formatEUR(prixTotal) },
                { label: "Droits d'enregistrement nets", value: formatEUR(calc.droitsNets), sub: true },
                { label: "TVA", value: formatEUR(calc.tvaMontant), sub: true },
                { label: "Notaire + hypotheque", value: formatEUR(calc.emolumentsNotaire + calc.fraisHypotheque), sub: true },
                { label: "Interets intercalaires", value: formatEUR(calc.totalIntercalaire), sub: true },
                {
                  label: `Total frais (${formatPct(prixTotal > 0 ? (calc.totalFrais + calc.totalIntercalaire) / prixTotal : 0)})`,
                  value: formatEUR(calc.totalFrais + calc.totalIntercalaire),
                },
                {
                  label: "Cout total d'acquisition",
                  value: formatEUR(calc.coutTotal + calc.totalIntercalaire),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* Progress bar visualization */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">Repartition des paiements</h3>
              <div className="flex h-8 w-full overflow-hidden rounded-lg">
                {DEFAULT_MILESTONES.map((m, i) => {
                  const pct = milestonePcts[i] / 100;
                  const colors = [
                    "bg-navy",
                    "bg-blue-600",
                    "bg-blue-500",
                    "bg-blue-400",
                    "bg-sky-400",
                    "bg-sky-300",
                    "bg-emerald-400",
                  ];
                  return (
                    <div
                      key={i}
                      className={`${colors[i]} flex items-center justify-center text-xs font-semibold text-white`}
                      style={{ width: `${pct * 100}%` }}
                      title={`${m.label}: ${milestonePcts[i].toFixed(0)} %`}
                    >
                      {pct >= 0.10 ? `${milestonePcts[i].toFixed(0)}%` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1.5">
                {DEFAULT_MILESTONES.map((m, i) => {
                  const colors = [
                    "bg-navy",
                    "bg-blue-600",
                    "bg-blue-500",
                    "bg-blue-400",
                    "bg-sky-400",
                    "bg-sky-300",
                    "bg-emerald-400",
                  ];
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className={`inline-block h-3 w-3 shrink-0 rounded-sm ${colors[i]}`} />
                      <span className="flex-1 text-slate">{m.label}</span>
                      <span className="font-mono font-semibold text-navy">{milestonePcts[i].toFixed(0)} %</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Garantie d'achevement */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Garantie d'achevement</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Obligation legale</strong> — Le promoteur doit fournir une
                  garantie d'achevement (aussi appelee garantie extrinseque) delivree par un etablissement
                  financier agree au Luxembourg. Cette garantie assure que le bien sera acheve meme en cas de
                  defaillance du promoteur.
                </p>
                <p>
                  <strong className="text-slate">Protection de l'acquereur</strong> — En VEFA, les fonds verses
                  par l'acquereur sont proteges. L'acte notarie doit mentionner la garantie et ses conditions.
                  Les appels de fonds ne peuvent exceder les pourcentages prevus par la loi, lies a
                  l'avancement reel des travaux.
                </p>
                <p>
                  <strong className="text-slate">Reception et reserves</strong> — Lors de la livraison,
                  l'acquereur peut emettre des reserves sur les defauts constates. Le promoteur dispose d'un
                  delai pour y remedier. La garantie decennale couvre les vices structurels pendant 10 ans.
                </p>
              </div>
            </div>

            {/* Bon a savoir */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Bon a savoir</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">TVA 3 % residence principale</strong> — La faveur fiscale est
                  plafonnee a {formatEUR(TVA_FAVEUR_PLAFOND)}. Au-dela, la TVA restante est facturee a 17 %.
                  Le benefice est octroye une seule fois dans la vie de l'acquereur et doit etre demande aupres de
                  l'Administration de l'Enregistrement, des Domaines et de la TVA (AED).
                </p>
                <p>
                  <strong className="text-slate">Terrain vs construction</strong> — Dans un achat VEFA, la part
                  terrain est soumise aux droits d'enregistrement (7 %), tandis que la part construction est
                  soumise a la TVA. La repartition est fixee dans l'acte notarie.
                </p>
                <p>
                  <strong className="text-slate">Bellegen Akt</strong> — Credit d'impot de 40 000 EUR par acquereur
                  (80 000 EUR pour un couple) sur les droits d'enregistrement. Applicable uniquement pour la
                  residence principale et lors de la premiere utilisation.
                </p>
                <p>
                  <strong className="text-slate">Interets intercalaires</strong> — Pendant la phase de construction
                  (24 a 30 mois), la banque debloque le pret au fur et a mesure des appels de fonds. L'acquereur
                  paie des interets mensuels sur le capital deja debourse, sans amortir le capital. Ce cout,
                  souvent oublie, represente typiquement 15 000 a 25 000 EUR pour un pret standard.
                </p>
                <p>
                  <strong className="text-slate">Duree de construction</strong> — Comptez en moyenne 24 a 30 mois
                  entre la signature et la livraison. Le calendrier depend de la taille du projet, de la meteo
                  et de la disponibilite des entreprises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
