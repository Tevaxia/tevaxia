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
      ? "Exempt"
      : result.typeGain === "speculation"
      ? "Speculative gain"
      : "Disposal gain";

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
            Real Estate Capital Gains Calculator
          </h1>
          <p className="mt-2 text-muted">
            Art. 99ter (speculation) and Art. 99bis / 102 LIR (disposal) — STATEC revaluation coefficients
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
                />
                <InputField
                  label="Year of acquisition"
                  value={anneeAcquisition}
                  onChange={(v) => setAnneeAcquisition(Number(v))}
                  min={1960}
                  max={2026}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Disposal</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Sale price"
                  value={prixCession}
                  onChange={(v) => setPrixCession(Number(v))}
                  suffix="€"
                  min={0}
                />
                <InputField
                  label="Year of sale"
                  value={anneeCession}
                  onChange={(v) => setAnneeCession(Number(v))}
                  min={1960}
                  max={2030}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Deductions</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Acquisition costs"
                  value={fraisAcquisition}
                  onChange={(v) => setFraisAcquisition(Number(v))}
                  suffix="€"
                  min={0}
                  hint="Duties, notary, agency..."
                />
                <InputField
                  label="Value-adding works"
                  value={travauxDeductibles}
                  onChange={(v) => setTravauxDeductibles(Number(v))}
                  suffix="€"
                  min={0}
                  hint="Works increasing the property value"
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Situation</h2>
              <div className="space-y-3">
                <ToggleField
                  label="Primary residence"
                  checked={estResidencePrincipale}
                  onChange={setEstResidencePrincipale}
                  hint="Effectively and continuously occupied"
                />
                <ToggleField
                  label="Couple / Joint taxation"
                  checked={estCouple}
                  onChange={setEstCouple}
                  hint="Doubled allowance (100,000 € instead of 50,000 €)"
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
                Holding period: {result.dureeDetention} year{result.dureeDetention > 1 ? "s" : ""}
              </span>
            </div>

            {/* Holding period timeline */}
            {(() => {
              const maxYears = Math.max(5, result.dureeDetention + 1);
              const pctUser = Math.min((result.dureeDetention / maxYears) * 100, 100);
              const pctTwoYears = (2 / maxYears) * 100;
              return (
                <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-navy">Holding period — applicable regime</h3>
                  {/* Bar */}
                  <div className="relative h-7 w-full rounded-full overflow-hidden bg-gray-100">
                    {/* Red zone: 0-2 years */}
                    <div
                      className="absolute inset-y-0 left-0 bg-red-400/70"
                      style={{ width: `${pctTwoYears}%` }}
                    />
                    {/* Amber zone: 2+ years */}
                    <div
                      className="absolute inset-y-0 bg-amber-400/60"
                      style={{ left: `${pctTwoYears}%`, right: 0 }}
                    />
                    {/* User dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 border-white bg-navy shadow-md z-10"
                      style={{ left: `${pctUser}%` }}
                      title={`${result.dureeDetention} year${result.dureeDetention > 1 ? "s" : ""}`}
                    />
                  </div>
                  {/* Labels under the bar */}
                  <div className="relative mt-1.5 h-5 text-[10px] font-medium">
                    <span className="absolute left-0 text-red-700">0</span>
                    <span
                      className="absolute -translate-x-1/2 text-red-700"
                      style={{ left: `${pctTwoYears}%` }}
                    >
                      2 yrs
                    </span>
                    <span className="absolute right-0 text-amber-700">{maxYears} yrs</span>
                  </div>
                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" />
                      <span className="text-muted">0-2 yrs: Speculation — global rate</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
                      <span className="text-muted">{"> "}2 yrs: Disposal — half-global rate + STATEC revaluation</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                      <span className="text-muted">Primary residence = exempt</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-navy bg-navy" />
                      <span className="text-slate font-semibold">
                        Your holding period: {result.dureeDetention} year{result.dureeDetention > 1 ? "s" : ""}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })()}

            {result.typeGain === "exonere" ? (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
                <h3 className="text-lg font-semibold text-green-800">Full exemption</h3>
                <p className="mt-2 text-sm text-green-700">
                  {result.explication}
                </p>
                <p className="mt-3 text-sm text-green-600">
                  Gross capital gain: {formatEUR(result.gainBrut)} — not taxable
                </p>
              </div>
            ) : (
              <>
                <ResultPanel
                  title="Capital gain calculation"
                  lines={[
                    { label: "Sale price", value: formatEUR(prixCession) },
                    ...(result.typeGain === "cession"
                      ? [
                          { label: "Acquisition price", value: formatEUR(prixAcquisition), sub: true },
                          {
                            label: `Revaluation coefficient (${anneeAcquisition})`,
                            value: result.coefficient.toFixed(2),
                            sub: true,
                          },
                          {
                            label: "Revalued acquisition price",
                            value: `- ${formatEUR(result.prixAcquisitionRevalorise)}`,
                          },
                        ]
                      : [{ label: "Acquisition price", value: `- ${formatEUR(prixAcquisition)}` }]),
                    ...(result.fraisForfaitaires > 0
                      ? [{ label: "Deductible costs", value: `- ${formatEUR(result.fraisForfaitaires)}`, sub: true }]
                      : []),
                    { label: "Gross capital gain", value: formatEUR(result.gainBrut), highlight: true },
                    ...(result.abattement > 0
                      ? [
                          {
                            label: `Ten-year allowance${estCouple ? " (couple)" : ""}`,
                            value: `- ${formatEUR(result.abattement)}`,
                          },
                        ]
                      : []),
                    { label: "Taxable capital gain", value: formatEUR(result.gainImposable), highlight: true, large: true },
                  ]}
                />

                <ResultPanel
                  title="Estimated tax"
                  className="border-warning/30"
                  lines={[
                    {
                      label: result.typeGain === "speculation" ? "Estimated global rate" : "Estimated half-global rate",
                      value: `~${(result.tauxEffectif * 100).toFixed(0)} %`,
                      sub: true,
                    },
                    { label: "Estimated tax", value: formatEUR(result.estimationImpot), highlight: true, large: true },
                    { label: "Net after tax", value: formatEUR(result.netApresImpot), highlight: true },
                  ]}
                />
              </>
            )}

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Explanation</h3>
              <p className="text-sm text-muted leading-relaxed">{result.explication}</p>
              <div className="mt-4 space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Speculation (2 years or less)</strong> — Taxed at the global rate
                  (progressive scale). No revaluation of the acquisition price.
                </p>
                <p>
                  <strong className="text-slate">Disposal ({">"} 2 years)</strong> — Acquisition price revalued using
                  STATEC coefficients. Ten-year allowance of 50,000 € (100,000 € for couples). Taxed
                  at the half-global rate.
                </p>
                <p>
                  <strong className="text-slate">Primary residence</strong> — Full exemption if
                  effectively and continuously occupied.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
