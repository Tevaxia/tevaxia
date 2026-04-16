"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerEmolumentsNotaire, formatEUR, formatPct } from "@/lib/calculations";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";

// ── Luxembourg VEFA milestones ──────────────────────────────
interface MilestoneDef {
  labelKey: string;
  defaultPct: number;       // % of purchase price (default)
  monthsAfterStart: number;
}

const DEFAULT_MILESTONES: MilestoneDef[] = [
  { labelKey: "milestoneSignature",    defaultPct: 5,   monthsAfterStart: 0 },
  { labelKey: "milestoneFondations",   defaultPct: 15,  monthsAfterStart: 4 },
  { labelKey: "milestoneHorsEau",      defaultPct: 20,  monthsAfterStart: 10 },
  { labelKey: "milestoneHorsAir",      defaultPct: 20,  monthsAfterStart: 14 },
  { labelKey: "milestoneCloisons",     defaultPct: 15,  monthsAfterStart: 18 },
  { labelKey: "milestoneFinition",     defaultPct: 15,  monthsAfterStart: 22 },
  { labelKey: "milestoneLivraison",    defaultPct: 10,  monthsAfterStart: 26 },
];

// ── TVA / duties constants ──────────────────────────────────
const TVA_NORMAL = 0.17;
const TVA_REDUIT = 0.03;
const TVA_FAVEUR_PLAFOND = 50_000;
const TAUX_DROITS = 0.07; // 6% enregistrement + 1% transcription

// ── Month names for timeline ─────────────────────────────────
const MONTH_KEYS = [
  "monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun",
  "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec",
];

export default function VefaCalculator() {
  const t = useTranslations("vefa");

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
      // eslint-disable-next-line react-hooks/immutability
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
        labelKey: m.labelKey,
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
      const monthKey = MONTH_KEYS[month - 1];
      const position = (m.monthsAfterStart / totalDuration) * 100;
      return {
        monthKey,
        year,
        milestoneLabelKey: m.labelKey,
        pct: milestonePcts[i],
        position,
        monthsAfterStart: m.monthsAfterStart,
      };
    });

    return { points, totalDuration };
  }, [moisDebut, milestonePcts]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Left column: Inputs ─────────────────────────── */}
          <div className="space-y-6">
            {/* Property */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionBien")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("prixTotalLabel")}
                  value={prixTotal}
                  onChange={(v) => setPrixTotal(Number(v))}
                  suffix="EUR"
                  min={0}
                  hint={t("prixTotalHint")}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label={t("partTerrainLabel")}
                    value={partTerrain}
                    onChange={(v) => setPartTerrain(Number(v))}
                    suffix="EUR"
                    min={0}
                    hint={t("partTerrainHint")}
                  />
                  <InputField
                    label={t("partConstructionLabel")}
                    value={partConstruction}
                    onChange={() => {}}
                    suffix="EUR"
                    hint={t("partConstructionHint")}
                  />
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAcquereur")}</h2>
              <div className="space-y-4">
                <ToggleField
                  label={t("residencePrincipaleLabel")}
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                  hint={t("residencePrincipaleHint")}
                />
                <InputField
                  label={t("nbAcquereursLabel")}
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: t("acquereur1") },
                    { value: "2", label: t("acquereur2") },
                  ]}
                />
              </div>
            </div>

            {/* Financing */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFinancement")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("montantHypothequeLabel")}
                  value={montantHypotheque}
                  onChange={(v) => setMontantHypotheque(Number(v))}
                  suffix="EUR"
                  min={0}
                  hint={t("montantHypothequeHint")}
                />
                <InputField
                  label={t("tauxHypothequeLabel")}
                  value={tauxHypotheque}
                  onChange={(v) => setTauxHypotheque(Number(v))}
                  suffix="%"
                  min={0}
                  max={15}
                  step={0.1}
                  hint={t("tauxHypothequeHint")}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionCalendrier")}</h2>
              <InputField
                label={t("moisSignatureLabel")}
                type="text"
                value={moisDebut}
                onChange={setMoisDebut}
                hint={t("moisSignatureHint")}
              />
            </div>

            {/* Customizable milestone percentages */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-navy">{t("sectionEcheancier")}</h2>
                <button
                  onClick={resetPcts}
                  className="rounded-lg border border-card-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-slate"
                >
                  {t("reinitialiser")}
                </button>
              </div>
              <p className="mb-4 text-xs text-muted">
                {t("echeancierHint")}
              </p>
              <div className="space-y-3">
                {DEFAULT_MILESTONES.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-slate truncate" title={t(m.labelKey)}>
                      {t(m.labelKey)}
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
                  <span className="text-sm font-semibold text-slate">{t("total")}</span>
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
                    {t("pctError", { diff: (totalPct - 100).toFixed(1) })}
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
                  {t("chronologieChantier")}
                </h3>
                {/* Timeline — version tableau pour éviter les chevauchements */}
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr>
                        {timelineData.points.map((pt, i) => (
                          <th key={i} className="px-1 pb-2 font-semibold text-navy text-[10px] align-bottom">
                            {t(pt.monthKey)} {pt.year}
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
                            <div className="text-[9px] text-muted leading-tight">{t(pt.milestoneLabelKey)}</div>
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
                  {t("dureeEstimee", { mois: timelineData.totalDuration })}
                </p>
              </div>
            )}

            {/* Milestone schedule */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">
                {t("echeancierAppels")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-2">{t("colEtape")}</th>
                      <th className="pb-2 pr-2 text-right">%</th>
                      <th className="pb-2 pr-2 text-right">{t("colMontant")}</th>
                      <th className="pb-2 pr-2 text-right">{t("colCumul")}</th>
                      <th className="pb-2 text-right">{t("colDateEst")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border/50">
                    {calc.milestones.map((m, i) => (
                      <tr key={i} className={i === calc.milestones.length - 1 ? "font-semibold text-navy" : "text-foreground"}>
                        <td className="py-2 pr-2">{t(m.labelKey)}</td>
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
                  {t("pctWarning")}
                </p>
              )}
              <p className="mt-3 text-xs text-muted">
                {t("echeancierNote")}
              </p>
            </div>

            {/* Intercalary interest section */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-navy">
                {t("interetsIntercalaires")}
              </h3>
              <p className="mb-4 text-xs text-muted">
                {t("interetsIntercalairesDesc")}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-medium uppercase text-muted">
                      <th className="pb-2 pr-2">{t("colPhase")}</th>
                      <th className="pb-2 pr-2 text-right">{t("colCapitalDebourse")}</th>
                      <th className="pb-2 pr-2 text-right">{t("colDuree")}</th>
                      <th className="pb-2 pr-2 text-right">{t("colInteretsPhase")}</th>
                      <th className="pb-2 text-right">{t("colCumulInterets")}</th>
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
                        <td className="py-2 pr-2">{t(m.labelKey)}</td>
                        <td className="py-2 pr-2 text-right font-mono">{formatEUR(m.drawnMortgage)}</td>
                        <td className="py-2 pr-2 text-right font-mono">
                          {m.monthsToNext > 0 ? t("nMois", { n: m.monthsToNext }) : "—"}
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
                      <td className="pt-3 pr-2" colSpan={3}>{t("totalInteretsIntercalaires")}</td>
                      <td className="pt-3 pr-2 text-right font-mono" colSpan={2}>
                        {formatEUR(calc.totalIntercalaire)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-800">
                  {t("coutIntercalaireResume", {
                    montant: formatEUR(calc.totalIntercalaire),
                    taux: tauxHypotheque.toFixed(1),
                    pret: formatEUR(montantHypotheque),
                    pctPrix: prixTotal > 0 ? formatPct(calc.totalIntercalaire / prixTotal) : "— %",
                  })}
                </p>
              </div>
            </div>

            {/* Droits d'enregistrement */}
            <ResultPanel
              title={t("droitsEnregistrementTitle")}
              lines={[
                { label: t("partTerrainResult"), value: formatEUR(partTerrain), sub: true },
                { label: t("droitsBruts"), value: formatEUR(calc.droitsBruts) },
                ...(calc.bellegenAkt > 0
                  ? [{ label: t("bellegenAkt", { nb: nbAcquereurs }), value: `- ${formatEUR(calc.bellegenAkt)}` }]
                  : []),
                { label: t("droitsNets"), value: formatEUR(calc.droitsNets), highlight: true },
              ]}
            />

            {/* TVA */}
            <ResultPanel
              title={t("tvaTitle")}
              lines={[
                { label: t("baseTva"), value: formatEUR(calc.partConstruction), sub: true },
                {
                  label: t("tauxApplique"),
                  value: residencePrincipale ? t("tauxReduit") : t("tauxNormal"),
                },
                { label: t("montantTva"), value: formatEUR(calc.tvaMontant) },
                ...(calc.faveurFiscale > 0
                  ? [
                      { label: t("faveurFiscale"), value: formatEUR(calc.faveurFiscale), sub: true },
                      {
                        label: t("plafondFaveur"),
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
              title={t("autresFraisTitle")}
              lines={[
                { label: t("emolumentsNotariaux"), value: formatEUR(calc.emolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [{ label: t("fraisHypotheque"), value: formatEUR(calc.fraisHypotheque) }]
                  : []),
              ]}
            />

            {/* Grand total */}
            <ResultPanel
              title={t("coutTotalTitle")}
              className="border-gold/30"
              lines={[
                { label: t("prixDuBien"), value: formatEUR(prixTotal) },
                { label: t("droitsEnregistrementNets"), value: formatEUR(calc.droitsNets), sub: true },
                { label: t("tvaLabel"), value: formatEUR(calc.tvaMontant), sub: true },
                { label: t("notaireHypotheque"), value: formatEUR(calc.emolumentsNotaire + calc.fraisHypotheque), sub: true },
                { label: t("interetsIntercalairesLabel"), value: formatEUR(calc.totalIntercalaire), sub: true },
                {
                  label: `${t("totalFrais")} (${formatPct(prixTotal > 0 ? (calc.totalFrais + calc.totalIntercalaire) / prixTotal : 0)})`,
                  value: formatEUR(calc.totalFrais + calc.totalIntercalaire),
                },
                {
                  label: t("coutTotalAcquisition"),
                  value: formatEUR(calc.coutTotal + calc.totalIntercalaire),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            <AiAnalysisCard
              context={[
                `Acquisition VEFA au Luxembourg`,
                `Prix total: ${formatEUR(prixTotal)} (terrain ${formatEUR(partTerrain)} + construction ${formatEUR(partConstruction)})`,
                `Résidence principale: ${residencePrincipale ? "oui" : "non"} — ${nbAcquereurs} acquéreur(s)`,
                `Montant hypothèque: ${formatEUR(montantHypotheque)} à ${tauxHypotheque}%`,
                `Mois début chantier: ${moisDebut}`,
                "",
                `Répartition appels de fonds: ${DEFAULT_MILESTONES.map((m, i) => `${t(m.labelKey)} ${milestonePcts[i]}%`).join(" / ")}`,
                `Total appels: ${totalPct}% ${pctValid ? "(conforme)" : "(NON CONFORME — à revoir)"}`,
                "",
                `Droits d'enregistrement bruts (terrain): ${formatEUR(calc.droitsBruts)}`,
                `Bëllegen Akt appliqué: ${formatEUR(calc.bellegenAkt)}`,
                `Droits nets: ${formatEUR(calc.droitsNets)}`,
                `TVA construction: ${formatEUR(calc.tvaMontant)} (taux effectif ${formatPct(calc.tauxEffectif)})`,
                `Faveur TVA 3% appliquée: ${formatEUR(calc.faveurFiscale)}`,
                `Émoluments notaire: ${formatEUR(calc.emolumentsNotaire)}${montantHypotheque > 0 ? ` + frais hypothèque ${formatEUR(calc.fraisHypotheque)}` : ""}`,
                `Intérêts intercalaires: ${formatEUR(calc.totalIntercalaire)}`,
                `Total frais: ${formatEUR(calc.totalFrais + calc.totalIntercalaire)} (${formatPct(prixTotal > 0 ? (calc.totalFrais + calc.totalIntercalaire) / prixTotal : 0)})`,
                `Coût total acquisition: ${formatEUR(calc.coutTotal + calc.totalIntercalaire)}`,
              ].join("\n")}
              prompt="Analyse ce contrat VEFA (Vente en l'État Futur d'Achèvement) au Luxembourg pour l'acquéreur. Livre : (1) décodage pédagogique de la répartition des appels de fonds par tranche — est-elle équilibrée, y a-t-il des risques de sur-paiement précoce vs avancement réel ? (2) garanties obligatoires à vérifier (garantie d'achèvement extrinsèque, assurance dommages-ouvrage, décennale, parfait achèvement), (3) clauses contractuelles sensibles à négocier (délais de livraison + pénalités de retard, modifications, échelles de pénalités, révision de prix), (4) optimisation fiscale vérifiée (TVA 3% appliquée correctement, plafond 50k€, Bëllegen Akt), (5) red flags à signaler avant signature. Concret et référencé loi VEFA LU."
            />

            {/* Progress bar visualization */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">{t("repartitionPaiements")}</h3>
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
                      title={`${t(m.labelKey)}: ${milestonePcts[i].toFixed(0)} %`}
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
                      <span className="flex-1 text-slate">{t(m.labelKey)}</span>
                      <span className="font-mono font-semibold text-navy">{milestonePcts[i].toFixed(0)} %</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Garantie d'achevement */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">{t("garantieTitle")}</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">{t("garantieObligationTitle")}</strong> — {t("garantieObligationText")}
                </p>
                <p>
                  <strong className="text-slate">{t("garantieProtectionTitle")}</strong> — {t("garantieProtectionText")}
                </p>
                <p>
                  <strong className="text-slate">{t("garantieReceptionTitle")}</strong> — {t("garantieReceptionText")}
                </p>
              </div>
            </div>

            {/* Bon a savoir */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">{t("bonASavoirTitle")}</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">{t("bonTvaTitle")}</strong> — {t("bonTvaText", { plafond: formatEUR(TVA_FAVEUR_PLAFOND) })}
                </p>
                <p>
                  <strong className="text-slate">{t("bonTerrainTitle")}</strong> — {t("bonTerrainText")}
                </p>
                <p>
                  <strong className="text-slate">{t("bonBellegenTitle")}</strong> — {t("bonBellegenText")}
                </p>
                <p>
                  <strong className="text-slate">{t("bonInteretsTitle")}</strong> — {t("bonInteretsText")}
                </p>
                <p>
                  <strong className="text-slate">{t("bonDureeTitle")}</strong> — {t("bonDureeText")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SEOContent
      ns="vefa"
      sections={[
        { titleKey: "guideTitle", contentKey: "guideContent" },
        { titleKey: "echeancierSeoTitle", contentKey: "echeancierSeoContent" },
        { titleKey: "tvaSeoTitle", contentKey: "tvaSeoContent" },
        { titleKey: "intercalairesTitle", contentKey: "intercalairesContent" },
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
        { href: "/outils-bancaires", labelKey: "bancaire" },
        { href: "/simulateur-aides", labelKey: "aides" },
      ]}
    />
    </>
  );
}
