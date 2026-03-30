"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerFraisAcquisition, formatEUR, formatPct } from "@/lib/calculations";

export default function FraisAcquisition() {
  const [prixBien, setPrixBien] = useState(750000);
  const [estNeuf, setEstNeuf] = useState(false);
  const [partTerrain, setPartTerrain] = useState(250000);
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [nbAcquereurs, setNbAcquereurs] = useState<1 | 2>(2);
  const [montantHypotheque, setMontantHypotheque] = useState(600000);

  const partConstruction = prixBien - partTerrain;

  const result = useMemo(
    () =>
      calculerFraisAcquisition({
        prixBien,
        estNeuf,
        partTerrain: estNeuf ? partTerrain : undefined,
        partConstruction: estNeuf ? partConstruction : undefined,
        residencePrincipale,
        nbAcquereurs,
        montantHypotheque,
      }),
    [prixBien, estNeuf, partTerrain, partConstruction, residencePrincipale, nbAcquereurs, montantHypotheque]
  );

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Simulateur de Frais d'Acquisition
          </h1>
          <p className="mt-2 text-muted">
            Droits d'enregistrement, Bëllegen Akt, TVA, émoluments notariaux, frais d'hypothèque
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Le bien</h2>
              <div className="space-y-4">
                <InputField
                  label="Prix du bien"
                  value={prixBien}
                  onChange={(v) => setPrixBien(Number(v))}
                  suffix="€"
                  min={0}
                />
                <ToggleField
                  label="Bien neuf (VEFA / construction)"
                  checked={estNeuf}
                  onChange={setEstNeuf}
                  hint="TVA applicable sur la part construction"
                />
                {estNeuf && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="Part terrain"
                      value={partTerrain}
                      onChange={(v) => setPartTerrain(Number(v))}
                      suffix="€"
                      min={0}
                      hint="Soumis aux droits d'enregistrement 7%"
                    />
                    <InputField
                      label="Part construction"
                      value={partConstruction}
                      onChange={() => {}}
                      suffix="€"
                      hint="= Prix − Terrain (soumise à TVA)"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Acquéreur</h2>
              <div className="space-y-4">
                <ToggleField
                  label="Résidence principale"
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                  hint="Ouvre droit au Bëllegen Akt et TVA 3%"
                />
                <InputField
                  label="Nombre d'acquéreurs"
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: "1 personne (40 000 € Bëllegen Akt)" },
                    { value: "2", label: "2 personnes / couple (80 000 € Bëllegen Akt)" },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Financement</h2>
              <InputField
                label="Montant de l'hypothèque"
                value={montantHypotheque}
                onChange={(v) => setMontantHypotheque(Number(v))}
                suffix="€"
                min={0}
                hint="Pour le calcul des frais d'inscription hypothécaire"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <ResultPanel
              title="Droits d'enregistrement & transcription"
              lines={[
                { label: "Base taxable", value: formatEUR(result.baseDroits), sub: true },
                { label: "Droits d'enregistrement (6%)", value: formatEUR(result.droitsEnregistrement) },
                { label: "Droit de transcription (1%)", value: formatEUR(result.droitsTranscription) },
                { label: "Total droits bruts (7%)", value: formatEUR(result.droitsTotal) },
                ...(result.creditBellegenAkt > 0
                  ? [
                      {
                        label: `Bëllegen Akt (${nbAcquereurs} × 40 000 €)`,
                        value: `- ${formatEUR(result.creditBellegenAkt)}`,
                      },
                    ]
                  : []),
                { label: "Droits nets à payer", value: formatEUR(result.droitsApresCredit), highlight: true },
              ]}
            />

            {estNeuf && (
              <ResultPanel
                title="TVA"
                lines={[
                  { label: "Base TVA (construction)", value: formatEUR(result.tvaApplicable), sub: true },
                  {
                    label: `Taux appliqué`,
                    value: residencePrincipale ? "3 % (réduit)" : "17 % (normal)",
                  },
                  { label: "Montant TVA", value: formatEUR(result.montantTva) },
                  ...(result.faveurFiscaleTva > 0
                    ? [{ label: "Faveur fiscale TVA 3%", value: formatEUR(result.faveurFiscaleTva), sub: true }]
                    : []),
                ]}
              />
            )}

            <ResultPanel
              title="Autres frais"
              lines={[
                { label: "Émoluments notariaux", value: formatEUR(result.emolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [
                      { label: "Frais d'hypothèque", value: formatEUR(result.fraisHypotheque) },
                    ]
                  : []),
              ]}
            />

            <ResultPanel
              title="Total"
              className="border-gold/30"
              lines={[
                { label: "Prix du bien", value: formatEUR(prixBien) },
                { label: `Total des frais (${formatPct(result.totalPourcentage)})`, value: formatEUR(result.totalFrais) },
                { label: "Coût total d'acquisition", value: formatEUR(result.coutTotalAcquisition), highlight: true, large: true },
              ]}
            />

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Bon à savoir</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Bëllegen Akt</strong> — Crédit d'impôt de 40 000 € par
                  acquéreur (80 000 € pour un couple) sur les droits d'enregistrement. Applicable uniquement
                  pour la résidence principale et lors de la première utilisation.
                </p>
                <p>
                  <strong className="text-slate">VEFA / Neuf</strong> — Les droits de 7% ne portent que
                  sur la part terrain. La part construction est soumise à la TVA (3% résidence principale,
                  17% sinon), avec un plafond de faveur fiscale de 50 000 €.
                </p>
                <p>
                  <strong className="text-slate">Émoluments notariaux</strong> — Calculés selon un barème
                  dégressif réglementé (4% jusqu'à 10 000 € puis dégressif).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
