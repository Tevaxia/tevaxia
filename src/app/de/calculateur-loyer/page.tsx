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
  const [estMeuble, setEstMeuble] = useState(false);
  const [showCoefficients, setShowCoefficients] = useState(false);

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
        estMeuble,
      }),
    [prixAcquisition, anneeAcquisition, travauxMontant, travauxAnnee, anneeBail, surfaceHabitable, avecColocation, nbColocataires, appliquerVetuste, tauxVetuste, estMeuble]
  );

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Invested Capital & Rent Cap Calculator
          </h1>
          <p className="mt-2 text-muted">
            Amended law of 21 September 2006 — Annual rent may not exceed 5% of invested capital
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Acquisition</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Acquisition price"
                  value={prixAcquisition}
                  onChange={(v) => setPrixAcquisition(Number(v))}
                  suffix="€"
                  min={0}
                  hint="Purchase price (excluding fees)"
                />
                <InputField
                  label="Year of acquisition"
                  value={anneeAcquisition}
                  onChange={(v) => setAnneeAcquisition(Number(v))}
                  min={1960}
                  max={2026}
                  hint="For the revaluation coefficient"
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Improvement Works</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Amount of works"
                  value={travauxMontant}
                  onChange={(v) => setTravauxMontant(Number(v))}
                  suffix="€"
                  min={0}
                  hint="Improvement works (not maintenance)"
                />
                <InputField
                  label="Year of works"
                  value={travauxAnnee}
                  onChange={(v) => setTravauxAnnee(Number(v))}
                  min={1960}
                  max={2026}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Lease & Floor Area</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Lease year"
                  value={anneeBail}
                  onChange={(v) => setAnneeBail(Number(v))}
                  min={1960}
                  max={2030}
                />
                <InputField
                  label="Living area"
                  value={surfaceHabitable}
                  onChange={(v) => setSurfaceHabitable(Number(v))}
                  suffix="m²"
                  min={1}
                />
              </div>
              <div className="mt-4 space-y-3">
                <ToggleField
                  label="Furnished dwelling"
                  checked={estMeuble}
                  onChange={setEstMeuble}
                  hint="10% surcharge allowed on the maximum rent"
                />
                <ToggleField
                  label="Shared tenancy"
                  checked={avecColocation}
                  onChange={setAvecColocation}
                  hint="Sum of rents must not exceed the cap (2024 reform)"
                />
                {avecColocation && (
                  <InputField
                    label="Number of co-tenants"
                    value={nbColocataires}
                    onChange={(v) => setNbColocataires(Number(v))}
                    min={2}
                    max={10}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Depreciation (optional)</h2>
              <div className="space-y-3">
                <ToggleField
                  label="Apply depreciation discount"
                  checked={appliquerVetuste}
                  onChange={setAppliquerVetuste}
                  hint="Not required by law — use if the property is in poor condition"
                />
                {appliquerVetuste && (
                  <InputField
                    label="Annual depreciation rate"
                    value={tauxVetuste}
                    onChange={(v) => setTauxVetuste(Number(v))}
                    suffix="%"
                    min={0}
                    max={5}
                    step={0.5}
                    hint="Common practice: 1-2%. No legally mandated rate."
                  />
                )}
              </div>
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Note:</strong> The 2006 law does not set any depreciation rate. The 2% figure sometimes
                  cited comes from accounting conventions (depreciation over 50 years), not from the legal text.
                  The STATEC revaluation coefficients already compensate for monetary erosion —
                  depreciation should only reflect the actual physical wear of the building.
                  In practice, rent commissions assess it on a case-by-case basis.
                </p>
              </div>
            </div>

            {/* STATEC coefficients table */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <button onClick={() => setShowCoefficients(!showCoefficients)} className="flex items-center justify-between w-full text-left">
                <h2 className="text-base font-semibold text-navy">STATEC revaluation coefficients</h2>
                <svg className={`h-5 w-5 text-muted transition-transform ${showCoefficients ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showCoefficients && (
                <div className="mt-4 grid grid-cols-3 gap-1 text-xs sm:grid-cols-5">
                  {Array.from({ length: 2026 - 1960 + 1 }, (_, i) => {
                    const a = 1960 + i;
                    const c = require("@/lib/constants").COEFFICIENTS_REEVALUATION[a];
                    return c ? (
                      <div key={a} className={`flex justify-between rounded px-2 py-1 ${a === anneeAcquisition ? "bg-navy/10 font-semibold text-navy" : ""}`}>
                        <span className="text-muted">{a}</span>
                        <span className="font-mono">{c.toFixed(2)}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <ResultPanel
              title="Invested capital"
              lines={[
                { label: "Acquisition price", value: formatEUR(prixAcquisition) },
                { label: `Revaluation coefficient (${anneeAcquisition})`, value: result.coeffAcquisition.toFixed(2), sub: true },
                { label: "Revalued price", value: formatEUR(result.prixReevalue) },
                ...(travauxMontant > 0
                  ? [
                      { label: "Improvement works", value: formatEUR(travauxMontant) },
                      { label: `Revaluation coefficient (${travauxAnnee})`, value: result.coeffTravaux.toFixed(2), sub: true },
                      { label: "Revalued works", value: formatEUR(result.travauxReevalues) },
                    ]
                  : []),
                ...(appliquerVetuste
                  ? [{
                      label: `Depreciation (${result.anneesVetuste} yrs × ${tauxVetuste}%)`,
                      value: `- ${formatEUR(result.decoteVetuste)} (${(result.decoteVetustePct * 100).toFixed(0)}%)`,
                      warning: result.decoteVetustePct >= 0.5,
                    }]
                  : []),
                { label: "Invested capital", value: formatEUR(result.capitalInvesti), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Rent cap"
              className="border-gold/30"
              lines={[
                { label: "Maximum annual rent (5%)", value: formatEUR2(result.loyerAnnuelMax) },
                { label: "Maximum monthly rent", value: formatEUR2(result.loyerMensuelMax), highlight: true, large: true },
                { label: "Rent per m²/month", value: formatEUR2(result.loyerM2Mensuel), sub: true },
                ...(avecColocation && result.loyerParColocataire
                  ? [
                      {
                        label: `Max rent per co-tenant (${nbColocataires})`,
                        value: formatEUR2(result.loyerParColocataire),
                        highlight: true,
                      },
                    ]
                  : []),
              ]}
            />

            {/* Legal basis */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Legal basis</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Amended law of 21 September 2006</strong> — Annual rent
                  may not exceed 5% of the invested capital in the dwelling.
                </p>
                <p>
                  <strong className="text-slate">Invested capital</strong> = revalued acquisition price
                  (STATEC coefficients) + revalued improvement works - any depreciation
                  (assessed case by case, no fixed legal rate).
                </p>
                <p>
                  <strong className="text-slate">July 2024 reform</strong> — The "luxury housing"
                  distinction is abolished. Agency fees shared 50/50. Security deposit reduced to 2 months.
                  Increases limited to 10% every 2 years. Shared tenancy: sum of rents must not exceed the cap.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
