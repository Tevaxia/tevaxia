"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerPlusValue, formatEUR } from "@/lib/calculations";

export default function PlusValues() {
  const [prixAcquisition, setPrixAcquisition] = useState(400000);
  const [anneeAcquisition, setAnneeAcquisition] = useState(2015);
  const [prixCession, setPrixCession] = useState(550000);
  const [anneeCession, setAnneeCession] = useState(2025);
  const [fraisAcquisition, setFraisAcquisition] = useState(0);
  const [travauxDeductibles, setTravauxDeductibles] = useState(0);
  const [estResidencePrincipale, setEstResidencePrincipale] = useState(false);
  const [estCouple, setEstCouple] = useState(false);

  const result = useMemo(
    () =>
      calculerPlusValue({
        prixAcquisition,
        anneeAcquisition,
        prixCession,
        anneeCession,
        fraisAcquisition: fraisAcquisition || undefined,
        travauxDeductibles: travauxDeductibles || undefined,
        estResidencePrincipale,
        estCouple,
      }),
    [prixAcquisition, anneeAcquisition, prixCession, anneeCession, fraisAcquisition, travauxDeductibles, estResidencePrincipale, estCouple]
  );

  const typeLabel =
    result.typeGain === "exonere"
      ? "Exonéré"
      : result.typeGain === "speculation"
      ? "Gain de spéculation"
      : "Gain de cession";

  const typeBadgeColor =
    result.typeGain === "exonere"
      ? "bg-green-100 text-green-800"
      : result.typeGain === "speculation"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Calculateur de Plus-Values Immobilières
          </h1>
          <p className="mt-2 text-muted">
            Art. 99ter (spéculation) et Art. 99bis / 102 LIR (cession) — Coefficients de réévaluation STATEC
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Acquisition</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Prix d'acquisition"
                  value={prixAcquisition}
                  onChange={(v) => setPrixAcquisition(Number(v))}
                  suffix="€"
                  min={0}
                />
                <InputField
                  label="Année d'acquisition"
                  value={anneeAcquisition}
                  onChange={(v) => setAnneeAcquisition(Number(v))}
                  min={1960}
                  max={2026}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Cession</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Prix de cession"
                  value={prixCession}
                  onChange={(v) => setPrixCession(Number(v))}
                  suffix="€"
                  min={0}
                />
                <InputField
                  label="Année de cession"
                  value={anneeCession}
                  onChange={(v) => setAnneeCession(Number(v))}
                  min={1960}
                  max={2030}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Déductions</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Frais d'acquisition"
                  value={fraisAcquisition}
                  onChange={(v) => setFraisAcquisition(Number(v))}
                  suffix="€"
                  min={0}
                  hint="Droits, notaire, agence..."
                />
                <InputField
                  label="Travaux de plus-value"
                  value={travauxDeductibles}
                  onChange={(v) => setTravauxDeductibles(Number(v))}
                  suffix="€"
                  min={0}
                  hint="Travaux augmentant la valeur"
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Situation</h2>
              <div className="space-y-3">
                <ToggleField
                  label="Résidence principale"
                  checked={estResidencePrincipale}
                  onChange={setEstResidencePrincipale}
                  hint="Occupée effectivement et de manière continue"
                />
                <ToggleField
                  label="Couple / Imposition collective"
                  checked={estCouple}
                  onChange={setEstCouple}
                  hint="Abattement doublé (100 000 € au lieu de 50 000 €)"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Type badge */}
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${typeBadgeColor}`}>
                {typeLabel}
              </span>
              <span className="text-sm text-muted">
                Détention : {result.dureeDetention} an{result.dureeDetention > 1 ? "s" : ""}
              </span>
            </div>

            {result.typeGain === "exonere" ? (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
                <h3 className="text-lg font-semibold text-green-800">Exonération totale</h3>
                <p className="mt-2 text-sm text-green-700">
                  {result.explication}
                </p>
                <p className="mt-3 text-sm text-green-600">
                  Plus-value brute : {formatEUR(result.gainBrut)} — non imposable
                </p>
              </div>
            ) : (
              <>
                <ResultPanel
                  title="Calcul de la plus-value"
                  lines={[
                    { label: "Prix de cession", value: formatEUR(prixCession) },
                    ...(result.typeGain === "cession"
                      ? [
                          { label: "Prix d'acquisition", value: formatEUR(prixAcquisition), sub: true },
                          {
                            label: `Coefficient réévaluation (${anneeAcquisition})`,
                            value: result.coefficient.toFixed(2),
                            sub: true,
                          },
                          {
                            label: "Prix d'acquisition revalorisé",
                            value: `- ${formatEUR(result.prixAcquisitionRevalorise)}`,
                          },
                        ]
                      : [{ label: "Prix d'acquisition", value: `- ${formatEUR(prixAcquisition)}` }]),
                    ...(result.fraisForfaitaires > 0
                      ? [{ label: "Frais déductibles", value: `- ${formatEUR(result.fraisForfaitaires)}`, sub: true }]
                      : []),
                    { label: "Plus-value brute", value: formatEUR(result.gainBrut), highlight: true },
                    ...(result.abattement > 0
                      ? [
                          {
                            label: `Abattement décennal${estCouple ? " (couple)" : ""}`,
                            value: `- ${formatEUR(result.abattement)}`,
                          },
                        ]
                      : []),
                    { label: "Plus-value imposable", value: formatEUR(result.gainImposable), highlight: true, large: true },
                  ]}
                />

                <ResultPanel
                  title="Estimation d'impôt"
                  className="border-warning/30"
                  lines={[
                    {
                      label: result.typeGain === "speculation" ? "Taux global estimé" : "Demi-taux global estimé",
                      value: `~${(result.tauxEffectif * 100).toFixed(0)} %`,
                      sub: true,
                    },
                    { label: "Impôt estimé", value: formatEUR(result.estimationImpot), highlight: true, large: true },
                  ]}
                />
              </>
            )}

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Explication</h3>
              <p className="text-sm text-muted leading-relaxed">{result.explication}</p>
              <div className="mt-4 space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Spéculation (≤ 2 ans)</strong> — Imposée au taux global
                  (barème progressif). Pas de réévaluation du prix d'acquisition.
                </p>
                <p>
                  <strong className="text-slate">Cession ({">"} 2 ans)</strong> — Prix d'acquisition revalorisé par
                  les coefficients STATEC. Abattement décennal de 50 000 € (100 000 € couple). Imposée
                  au demi-taux global.
                </p>
                <p>
                  <strong className="text-slate">Résidence principale</strong> — Exonération totale si
                  occupée effectivement et de manière continue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
