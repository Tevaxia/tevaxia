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
  { label: "Contract signing",              defaultPct: 5,   monthsAfterStart: 0 },
  { label: "Foundations complete",           defaultPct: 15,  monthsAfterStart: 4 },
  { label: "Walls complete (hors d'eau)",    defaultPct: 20,  monthsAfterStart: 10 },
  { label: "Roof complete (hors d'air)",     defaultPct: 20,  monthsAfterStart: 14 },
  { label: "Interior partitions",            defaultPct: 15,  monthsAfterStart: 18 },
  { label: "Finishing works",                defaultPct: 15,  monthsAfterStart: 22 },
  { label: "Delivery (keys handover)",       defaultPct: 10,  monthsAfterStart: 26 },
];

// ── VAT / duties constants ──────────────────────────────────
const TVA_NORMAL = 0.17;
const TVA_REDUIT = 0.03;
const TVA_FAVEUR_PLAFOND = 50_000;
const TAUX_DROITS = 0.07; // 6% registration + 1% transcription

// ── Month names for timeline ─────────────────────────────────
const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
    // -- Registration duties (land only) --
    const droitsBruts = partTerrain * TAUX_DROITS;
    const bellegenAktMax = nbAcquereurs * 40_000;
    const bellegenAkt = residencePrincipale ? Math.min(bellegenAktMax, droitsBruts) : 0;
    const droitsNets = Math.max(0, droitsBruts - bellegenAkt);

    // -- VAT on construction --
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

    // -- Payment schedule (appels de fonds) --
    const [startYear, startMonth] = moisDebut.split("-").map(Number);
    const tauxMensuel = (tauxHypotheque / 100) / 12;

    let cumulVerse = 0;      // cumulative amount paid to developer
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
            VEFA Calculator
          </h1>
          <p className="mt-2 text-muted">
            Off-plan purchase (Vente en Etat Futur d'Achevement) — payment schedule, VAT, registration duties, completion guarantee
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Left column: Inputs ─────────────────────────── */}
          <div className="space-y-6">
            {/* Property */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">VEFA property</h2>
              <div className="space-y-4">
                <InputField
                  label="Total purchase price (incl. developer margin)"
                  value={prixTotal}
                  onChange={(v) => setPrixTotal(Number(v))}
                  suffix="EUR"
                  min={0}
                  hint="Contractual price excluding acquisition fees"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Land portion"
                    value={partTerrain}
                    onChange={(v) => setPartTerrain(Number(v))}
                    suffix="EUR"
                    min={0}
                    hint="Subject to 7% registration duties"
                  />
                  <InputField
                    label="Construction portion"
                    value={partConstruction}
                    onChange={() => {}}
                    suffix="EUR"
                    hint="= Price - Land (subject to VAT)"
                  />
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Buyer</h2>
              <div className="space-y-4">
                <ToggleField
                  label="Primary residence"
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                  hint="Qualifies for 3% reduced VAT and Bellegen Akt tax credit"
                />
                <InputField
                  label="Number of buyers"
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: "1 person (EUR 40,000 Bellegen Akt)" },
                    { value: "2", label: "2 persons / couple (EUR 80,000 Bellegen Akt)" },
                  ]}
                />
              </div>
            </div>

            {/* Financing */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Financing</h2>
              <div className="space-y-4">
                <InputField
                  label="Mortgage amount"
                  value={montantHypotheque}
                  onChange={(v) => setMontantHypotheque(Number(v))}
                  suffix="EUR"
                  min={0}
                  hint="Used to calculate mortgage registration fees"
                />
                <InputField
                  label="Annual mortgage rate"
                  value={tauxHypotheque}
                  onChange={(v) => setTauxHypotheque(Number(v))}
                  suffix="%"
                  min={0}
                  max={15}
                  step={0.1}
                  hint="Used to calculate intercalary interest during construction"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Estimated timeline</h2>
              <InputField
                label="Planned signing month"
                type="text"
                value={moisDebut}
                onChange={setMoisDebut}
                hint="Format YYYY-MM (e.g. 2026-06)"
              />
            </div>

            {/* Customizable milestone percentages */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-navy">Contractual payment schedule</h2>
                <button
                  onClick={resetPcts}
                  className="rounded-lg border border-card-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-slate"
                >
                  Reset
                </button>
              </div>
              <p className="mb-4 text-xs text-muted">
                Adjust the percentages to match your VEFA contract. The total must equal 100%.
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
                    {totalPct.toFixed(0)}%
                  </span>
                </div>
                {!pctValid && (
                  <p className="text-xs font-medium text-red-500">
                    The total must equal 100%. Difference: {(totalPct - 100).toFixed(1)}%
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
                  Construction timeline
                </h3>
                {/* Timeline bar */}
                <div className="relative mx-4 mb-2 mt-8">
                  {/* Main horizontal line */}
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-blue-200" />
                  {/* Milestone points */}
                  {timelineData.points.map((pt, i) => (
                    <div
                      key={i}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${pt.position}%`, top: "50%", transform: "translate(-50%, -50%)" }}
                    >
                      {/* Dot */}
                      <div
                        className={`h-4 w-4 rounded-full border-2 border-white shadow-sm ${
                          i === 0
                            ? "bg-navy"
                            : i === timelineData.points.length - 1
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {/* Label above (even indices) or below (odd indices) to avoid overlap */}
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center ${
                          i % 2 === 0 ? "bottom-full mb-2" : "top-full mt-2"
                        }`}
                      >
                        <div className="text-[10px] font-semibold text-navy">{pt.label}</div>
                        <div className="text-[9px] text-muted leading-tight max-w-[80px] whitespace-normal">
                          {pt.milestoneLabel}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-blue-600">{pt.pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Spacer for labels */}
                <div className="h-24" />
                <p className="text-xs text-muted">
                  Estimated duration: {timelineData.totalDuration} months from contract to delivery. Dates are indicative and depend on actual construction progress.
                </p>
              </div>
            )}

            {/* Milestone schedule */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                Payment schedule (appels de fonds)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-2">Milestone</th>
                      <th className="pb-2 pr-2 text-right">%</th>
                      <th className="pb-2 pr-2 text-right">Amount</th>
                      <th className="pb-2 pr-2 text-right">Cumulative</th>
                      <th className="pb-2 text-right">Est. date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border/50">
                    {calc.milestones.map((m, i) => (
                      <tr key={i} className={i === calc.milestones.length - 1 ? "font-semibold text-navy" : "text-foreground"}>
                        <td className="py-2 pr-2">{m.label}</td>
                        <td className="py-2 pr-2 text-right font-mono">{(m.pct * 100).toFixed(0)}%</td>
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
                  Warning: the total percentages do not add up to 100%.
                </p>
              )}
              <p className="mt-3 text-xs text-muted">
                Indicative schedule based on construction progress. Payment calls are issued by the developer upon certification of each milestone by an independent architect.
              </p>
            </div>

            {/* Intercalary interest section */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-navy">
                Intercalary interest
              </h3>
              <p className="mb-4 text-xs text-muted">
                During construction, the bank releases the loan progressively. The buyer pays interest on the capital already disbursed, without repaying the principal. This is the number one hidden cost of an off-plan purchase.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-2">Phase</th>
                      <th className="pb-2 pr-2 text-right">Capital disbursed</th>
                      <th className="pb-2 pr-2 text-right">Duration</th>
                      <th className="pb-2 pr-2 text-right">Phase interest</th>
                      <th className="pb-2 text-right">Cumul. interest</th>
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
                          {m.monthsToNext > 0 ? `${m.monthsToNext} months` : "—"}
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
                      <td className="pt-3 pr-2" colSpan={3}>Total intercalary interest</td>
                      <td className="pt-3 pr-2 text-right font-mono" colSpan={2}>
                        {formatEUR(calc.totalIntercalaire)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-800">
                  Estimated intercalary cost: <span className="font-bold">{formatEUR(calc.totalIntercalaire)}</span> over the entire construction period
                  ({tauxHypotheque.toFixed(1)}% annual on a {formatEUR(montantHypotheque)} loan).
                  This amount is added to the total acquisition cost and represents {prixTotal > 0 ? formatPct(calc.totalIntercalaire / prixTotal) : "—%"} of the property price.
                </p>
              </div>
            </div>

            {/* Registration duties */}
            <ResultPanel
              title="Registration duties (land)"
              lines={[
                { label: "Land portion", value: formatEUR(partTerrain), sub: true },
                { label: "Gross duties (7%)", value: formatEUR(calc.droitsBruts) },
                ...(calc.bellegenAkt > 0
                  ? [{ label: `Bellegen Akt (${nbAcquereurs} x EUR 40,000)`, value: `- ${formatEUR(calc.bellegenAkt)}` }]
                  : []),
                { label: "Net duties payable", value: formatEUR(calc.droitsNets), highlight: true },
              ]}
            />

            {/* VAT */}
            <ResultPanel
              title="VAT (construction)"
              lines={[
                { label: "VAT base (construction)", value: formatEUR(calc.partConstruction), sub: true },
                {
                  label: "Rate applied",
                  value: residencePrincipale ? "3% (reduced)" : "17% (standard)",
                },
                { label: "VAT amount", value: formatEUR(calc.tvaMontant) },
                ...(calc.faveurFiscale > 0
                  ? [
                      { label: "Tax benefit (3% VAT)", value: formatEUR(calc.faveurFiscale), sub: true },
                      {
                        label: "Benefit cap",
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
              title="Other fees"
              lines={[
                { label: "Notary fees", value: formatEUR(calc.emolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [{ label: "Mortgage registration fees", value: formatEUR(calc.fraisHypotheque) }]
                  : []),
              ]}
            />

            {/* Grand total */}
            <ResultPanel
              title="Total VEFA acquisition cost"
              className="border-gold/30"
              lines={[
                { label: "Property price", value: formatEUR(prixTotal) },
                { label: "Net registration duties", value: formatEUR(calc.droitsNets), sub: true },
                { label: "VAT", value: formatEUR(calc.tvaMontant), sub: true },
                { label: "Notary + mortgage", value: formatEUR(calc.emolumentsNotaire + calc.fraisHypotheque), sub: true },
                { label: "Intercalary interest", value: formatEUR(calc.totalIntercalaire), sub: true },
                {
                  label: `Total fees (${formatPct(prixTotal > 0 ? (calc.totalFrais + calc.totalIntercalaire) / prixTotal : 0)})`,
                  value: formatEUR(calc.totalFrais + calc.totalIntercalaire),
                },
                {
                  label: "Total acquisition cost",
                  value: formatEUR(calc.coutTotal + calc.totalIntercalaire),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* Progress bar visualization */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">Payment breakdown</h3>
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
                      title={`${m.label}: ${milestonePcts[i].toFixed(0)}%`}
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
                      <span className="font-mono font-semibold text-navy">{milestonePcts[i].toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion guarantee */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Completion guarantee (garantie d'achevement)</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Legal requirement</strong> — The developer must provide a
                  completion guarantee (garantie extrinseque) issued by an approved Luxembourg financial
                  institution. This guarantees the property will be completed even if the developer defaults.
                </p>
                <p>
                  <strong className="text-slate">Buyer protection</strong> — In VEFA transactions, buyer
                  payments are legally protected. The notarial deed must reference the guarantee and its
                  conditions. Payment calls cannot exceed the statutory percentages tied to actual construction
                  progress.
                </p>
                <p>
                  <strong className="text-slate">Handover and defects</strong> — At delivery, the buyer can
                  note defects (reserves). The developer must remedy them within a set timeframe. The
                  10-year structural guarantee (garantie decennale) covers major structural defects.
                </p>
              </div>
            </div>

            {/* Good to know */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Good to know</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">3% VAT for primary residence</strong> — The tax benefit is
                  capped at {formatEUR(TVA_FAVEUR_PLAFOND)}. Beyond this threshold, the remaining VAT is
                  charged at 17%. This benefit is granted once per lifetime per buyer and must be applied for
                  with the Registration Duties and VAT Authority (AED).
                </p>
                <p>
                  <strong className="text-slate">Land vs. construction split</strong> — In a VEFA purchase,
                  the land portion is subject to 7% registration duties while the construction portion is
                  subject to VAT. The split is defined in the notarial deed.
                </p>
                <p>
                  <strong className="text-slate">Bellegen Akt</strong> — Tax credit of EUR 40,000 per buyer
                  (EUR 80,000 for a couple) on registration duties. Only available for primary residences and
                  first-time use.
                </p>
                <p>
                  <strong className="text-slate">Intercalary interest</strong> — During the construction phase
                  (24 to 30 months), the bank releases the loan as payment calls come in. The buyer
                  pays monthly interest on the capital already disbursed, without repaying the principal. This
                  often-overlooked cost typically amounts to EUR 15,000 to 25,000 for a standard loan.
                </p>
                <p>
                  <strong className="text-slate">Construction timeline</strong> — Expect an average of 24 to
                  30 months from signing to delivery. The schedule depends on project size, weather conditions,
                  and contractor availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
