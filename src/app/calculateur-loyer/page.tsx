"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerCapitalInvesti, formatEUR, formatEUR2 } from "@/lib/calculations";

export default function CalculateurLoyer() {
  const [prixAcquisition, setPrixAcquisition] = useState(500000);
  const [anneeAcquisition, setAnneeAcquisition] = useState(2010);
  const [travauxMontant, setTravauxMontant] = useState(0);
  const [travauxAnnee, setTravauxAnnee] = useState(2015);
  const [anneeBail, setAnneeBail] = useState(2025);
  const [surfaceHabitable, setSurfaceHabitable] = useState(80);
  const [appliquerVetuste, setAppliquerVetuste] = useState(false);
  const [tauxVetuste, setTauxVetuste] = useState(2);
  const [avecColocation, setAvecColocation] = useState(false);
  const [nbColocataires, setNbColocataires] = useState(3);

  const result = useMemo(
    () =>
      calculerCapitalInvesti({
        prixAcquisition,
        anneeAcquisition,
        travauxMontant,
        travauxAnnee,
        anneeBail,
        surfaceHabitable,
        nbColocataires: avecColocation ? nbColocataires : undefined,
        appliquerVetuste,
        tauxVetusteAnnuel: tauxVetuste / 100,
      }),
    [prixAcquisition, anneeAcquisition, travauxMontant, travauxAnnee, anneeBail, surfaceHabitable, avecColocation, nbColocataires, appliquerVetuste, tauxVetuste]
  );

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Calculateur de Capital Investi & Plafond de Loyer
          </h1>
          <p className="mt-2 text-muted">
            Loi modifiée du 21 septembre 2006 — Le loyer annuel ne peut excéder 5% du capital investi
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
                  hint="Prix payé (hors frais)"
                />
                <InputField
                  label="Année d'acquisition"
                  value={anneeAcquisition}
                  onChange={(v) => setAnneeAcquisition(Number(v))}
                  min={1960}
                  max={2026}
                  hint="Pour le coefficient de réévaluation"
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Travaux d'amélioration</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Montant des travaux"
                  value={travauxMontant}
                  onChange={(v) => setTravauxMontant(Number(v))}
                  suffix="€"
                  min={0}
                  hint="Travaux d'amélioration (pas d'entretien)"
                />
                <InputField
                  label="Année des travaux"
                  value={travauxAnnee}
                  onChange={(v) => setTravauxAnnee(Number(v))}
                  min={1960}
                  max={2026}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Bail & Surface</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Année du bail"
                  value={anneeBail}
                  onChange={(v) => setAnneeBail(Number(v))}
                  min={1960}
                  max={2030}
                />
                <InputField
                  label="Surface habitable"
                  value={surfaceHabitable}
                  onChange={(v) => setSurfaceHabitable(Number(v))}
                  suffix="m²"
                  min={1}
                />
              </div>
              <div className="mt-4 space-y-3">
                <ToggleField
                  label="Colocation"
                  checked={avecColocation}
                  onChange={setAvecColocation}
                  hint="Somme des loyers ≤ plafond (réforme 2024)"
                />
                {avecColocation && (
                  <InputField
                    label="Nombre de colocataires"
                    value={nbColocataires}
                    onChange={(v) => setNbColocataires(Number(v))}
                    min={2}
                    max={10}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Vétusté (optionnel)</h2>
              <div className="space-y-3">
                <ToggleField
                  label="Appliquer une décote vétusté"
                  checked={appliquerVetuste}
                  onChange={setAppliquerVetuste}
                  hint="Non imposé par la loi — à utiliser si le bien est en mauvais état"
                />
                {appliquerVetuste && (
                  <InputField
                    label="Taux annuel de vétusté"
                    value={tauxVetuste}
                    onChange={(v) => setTauxVetuste(Number(v))}
                    suffix="%"
                    min={0}
                    max={5}
                    step={0.5}
                    hint="Pratique courante : 1-2%. Aucun taux légal imposé."
                  />
                )}
              </div>
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Attention :</strong> La loi de 2006 ne fixe aucun taux de vétusté. Le taux de 2% parfois
                  cité vient de conventions comptables (amortissement sur 50 ans), pas du texte légal.
                  Les coefficients de réévaluation STATEC compensent déjà l'érosion monétaire —
                  la vétusté ne devrait refléter que l'usure physique réelle du bâtiment.
                  En pratique, les commissions des loyers l'apprécient au cas par cas.
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <ResultPanel
              title="Capital investi"
              lines={[
                { label: "Prix d'acquisition", value: formatEUR(prixAcquisition) },
                { label: `Coefficient réévaluation (${anneeAcquisition})`, value: result.coeffAcquisition.toFixed(2), sub: true },
                { label: "Prix réévalué", value: formatEUR(result.prixReevalue) },
                ...(travauxMontant > 0
                  ? [
                      { label: "Travaux d'amélioration", value: formatEUR(travauxMontant) },
                      { label: `Coefficient réévaluation (${travauxAnnee})`, value: result.coeffTravaux.toFixed(2), sub: true },
                      { label: "Travaux réévalués", value: formatEUR(result.travauxReevalues) },
                    ]
                  : []),
                ...(appliquerVetuste
                  ? [{
                      label: `Vétusté (${result.anneesVetuste} ans × ${tauxVetuste}%)`,
                      value: `- ${formatEUR(result.decoteVetuste)} (${(result.decoteVetustePct * 100).toFixed(0)}%)`,
                      warning: result.decoteVetustePct >= 0.5,
                    }]
                  : []),
                { label: "Capital investi", value: formatEUR(result.capitalInvesti), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Plafond de loyer"
              className="border-gold/30"
              lines={[
                { label: "Loyer annuel maximum (5%)", value: formatEUR2(result.loyerAnnuelMax) },
                { label: "Loyer mensuel maximum", value: formatEUR2(result.loyerMensuelMax), highlight: true, large: true },
                { label: "Loyer au m²/mois", value: formatEUR2(result.loyerM2Mensuel), sub: true },
                ...(avecColocation && result.loyerParColocataire
                  ? [
                      {
                        label: `Loyer max par colocataire (${nbColocataires})`,
                        value: formatEUR2(result.loyerParColocataire),
                        highlight: true,
                      },
                    ]
                  : []),
              ]}
            />

            {/* Explications */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Base légale</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Loi modifiée du 21 septembre 2006</strong> — Le loyer annuel
                  ne peut excéder 5% du capital investi dans le logement.
                </p>
                <p>
                  <strong className="text-slate">Capital investi</strong> = prix d'acquisition réévalué
                  (coefficients STATEC) + travaux d'amélioration réévalués − vétusté éventuelle
                  (appréciée au cas par cas, pas de taux légal fixe).
                </p>
                <p>
                  <strong className="text-slate">Réforme juillet 2024</strong> — La distinction "logement de
                  luxe" est supprimée. Frais d'agence partagés 50/50. Garantie locative réduite à 2 mois.
                  Augmentations limitées à 10% tous les 2 ans. Colocation : somme des loyers ≤ plafond.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
