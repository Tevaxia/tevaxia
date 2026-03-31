"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerEmolumentsNotaire, formatEUR, formatPct } from "@/lib/calculations";

// ── Luxembourg VEFA milestones ──────────────────────────────
interface Milestone {
  label: string;
  pct: number;       // % of purchase price
  monthsAfterStart: number;
}

const MILESTONES: Milestone[] = [
  { label: "Signature du contrat",          pct: 0.05,  monthsAfterStart: 0 },
  { label: "Fondations achevees",           pct: 0.15,  monthsAfterStart: 4 },
  { label: "Hors d'eau (murs montes)",      pct: 0.20,  monthsAfterStart: 10 },
  { label: "Hors d'air (toiture achevee)",  pct: 0.20,  monthsAfterStart: 14 },
  { label: "Cloisons interieures",          pct: 0.15,  monthsAfterStart: 18 },
  { label: "Travaux de finition",           pct: 0.15,  monthsAfterStart: 22 },
  { label: "Livraison (remise des cles)",   pct: 0.10,  monthsAfterStart: 26 },
];

// ── TVA / duties constants ──────────────────────────────────
const TVA_NORMAL = 0.17;
const TVA_REDUIT = 0.03;
const TVA_FAVEUR_PLAFOND = 50_000;
const TAUX_DROITS = 0.07; // 6% enregistrement + 1% transcription

export default function VefaCalculator() {
  // ── Inputs ──────────────────────────────────────────────────
  const [prixTotal, setPrixTotal] = useState(650000);
  const [partTerrain, setPartTerrain] = useState(195000);
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [nbAcquereurs, setNbAcquereurs] = useState<1 | 2>(2);
  const [montantHypotheque, setMontantHypotheque] = useState(520000);
  const [moisDebut, setMoisDebut] = useState("2026-06");

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
    const milestoneRows = MILESTONES.map((m) => {
      const montant = prixTotal * m.pct;
      const totalMonths = (startYear * 12 + (startMonth - 1)) + m.monthsAfterStart;
      const year = Math.floor(totalMonths / 12);
      const month = (totalMonths % 12) + 1;
      const dateStr = `${String(month).padStart(2, "0")}/${year}`;
      return { ...m, montant, dateStr };
    });

    // -- Cumulative check --
    let cumul = 0;
    const milestoneWithCumul = milestoneRows.map((row) => {
      cumul += row.montant;
      return { ...row, cumul };
    });

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
      milestones: milestoneWithCumul,
    };
  }, [prixTotal, partTerrain, residencePrincipale, nbAcquereurs, montantHypotheque, moisDebut, partConstruction]);

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
              <InputField
                label="Montant du pret hypothecaire"
                value={montantHypotheque}
                onChange={(v) => setMontantHypotheque(Number(v))}
                suffix="EUR"
                min={0}
                hint="Pour le calcul des frais d'inscription hypothecaire"
              />
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
          </div>

          {/* ── Right column: Results ───────────────────────── */}
          <div className="space-y-6">
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
              <p className="mt-3 text-xs text-muted">
                Echeancier indicatif selon l'avancement des travaux. Les appels de fonds sont emis par le promoteur sur constatation de l'achevement de chaque etape par un architecte independant.
              </p>
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
                {
                  label: `Total frais (${formatPct(prixTotal > 0 ? calc.totalFrais / prixTotal : 0)})`,
                  value: formatEUR(calc.totalFrais),
                },
                {
                  label: "Cout total d'acquisition",
                  value: formatEUR(calc.coutTotal),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            {/* Progress bar visualization */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">Repartition des paiements</h3>
              <div className="flex h-8 w-full overflow-hidden rounded-lg">
                {MILESTONES.map((m, i) => {
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
                      style={{ width: `${m.pct * 100}%` }}
                      title={`${m.label}: ${(m.pct * 100).toFixed(0)} %`}
                    >
                      {m.pct >= 0.10 ? `${(m.pct * 100).toFixed(0)}%` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1.5">
                {MILESTONES.map((m, i) => {
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
                      <span className="font-mono font-semibold text-navy">{(m.pct * 100).toFixed(0)} %</span>
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
