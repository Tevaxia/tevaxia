"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerFraisAcquisition, formatEUR, formatPct } from "@/lib/calculations";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
            Acquisition Fees Simulator
          </h1>
          <p className="mt-2 text-muted">
            Registration duties, Bellegen Akt, VAT, notary fees, mortgage costs
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">The property</h2>
              <div className="space-y-4">
                <InputField
                  label="Property price"
                  value={prixBien}
                  onChange={(v) => setPrixBien(Number(v))}
                  suffix="€"
                  min={0}
                />
                <ToggleField
                  label="New build (VEFA / construction)"
                  checked={estNeuf}
                  onChange={setEstNeuf}
                  hint="VAT applies to the construction portion"
                />
                {estNeuf && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="Land portion"
                      value={partTerrain}
                      onChange={(v) => setPartTerrain(Number(v))}
                      suffix="€"
                      min={0}
                      hint="Subject to 7% registration duties"
                    />
                    <InputField
                      label="Construction portion"
                      value={partConstruction}
                      onChange={() => {}}
                      suffix="€"
                      hint="= Price - Land (subject to VAT)"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Buyer</h2>
              <div className="space-y-4">
                <ToggleField
                  label="Primary residence"
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                  hint="Qualifies for Bellegen Akt and 3% VAT"
                />
                <InputField
                  label="Number of buyers"
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: "1 person (40,000 € Bellegen Akt)" },
                    { value: "2", label: "2 persons / couple (80,000 € Bellegen Akt)" },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Financing</h2>
              <InputField
                label="Mortgage amount"
                value={montantHypotheque}
                onChange={(v) => setMontantHypotheque(Number(v))}
                suffix="€"
                min={0}
                hint="For calculating mortgage registration fees"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <ResultPanel
              title="Registration & transcription duties"
              lines={[
                { label: "Taxable base", value: formatEUR(result.baseDroits), sub: true },
                { label: "Registration duties (6%)", value: formatEUR(result.droitsEnregistrement) },
                { label: "Transcription duty (1%)", value: formatEUR(result.droitsTranscription) },
                { label: "Total gross duties (7%)", value: formatEUR(result.droitsTotal) },
                ...(result.creditBellegenAkt > 0
                  ? [
                      {
                        label: `Bellegen Akt (${nbAcquereurs} × 40,000 €)`,
                        value: `- ${formatEUR(result.creditBellegenAkt)}`,
                      },
                    ]
                  : []),
                { label: "Net duties payable", value: formatEUR(result.droitsApresCredit), highlight: true },
              ]}
            />

            {estNeuf && (
              <ResultPanel
                title="VAT"
                lines={[
                  { label: "VAT base (construction)", value: formatEUR(result.tvaApplicable), sub: true },
                  {
                    label: `Applied rate`,
                    value: residencePrincipale ? "3% (reduced)" : "17% (standard)",
                  },
                  { label: "VAT amount", value: formatEUR(result.montantTva) },
                  ...(result.faveurFiscaleTva > 0
                    ? [{ label: "3% VAT tax benefit", value: formatEUR(result.faveurFiscaleTva), sub: true }]
                    : []),
                ]}
              />
            )}

            <ResultPanel
              title="Other fees"
              lines={[
                { label: "Notary fees", value: formatEUR(result.emolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [
                      { label: "Mortgage fees", value: formatEUR(result.fraisHypotheque) },
                    ]
                  : []),
              ]}
            />

            <ResultPanel
              title="Total"
              className="border-gold/30"
              lines={[
                { label: "Property price", value: formatEUR(prixBien) },
                { label: `Total fees (${formatPct(result.totalPourcentage)})`, value: formatEUR(result.totalFrais) },
                { label: "Total acquisition cost", value: formatEUR(result.coutTotalAcquisition), highlight: true, large: true },
              ]}
            />

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            {/* Donut chart breakdown */}
            {result.totalFrais > 0 && (() => {
              const data = [
                { name: "Net duties", value: result.droitsApresCredit, color: "#1B2A4A" },
                ...(result.montantTva > 0 ? [{ name: "VAT", value: result.montantTva, color: "#C8A951" }] : []),
                { name: "Notary", value: result.emolumentsNotaire, color: "#2A9D8F" },
                ...(result.fraisHypotheque > 0 ? [{ name: "Mortgage", value: result.fraisHypotheque, color: "#6B7280" }] : []),
              ].filter((d) => d.value > 0);
              return (
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-navy">Fee breakdown</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatEUR(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {data.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted">{d.name}</span>
                        <span className="font-mono font-semibold">{formatEUR(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

              <h3 className="mb-3 text-base font-semibold text-navy">Good to know</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Bellegen Akt</strong> — Tax credit of 40,000 € per
                  buyer (80,000 € for a couple) on registration duties. Only applicable
                  for the primary residence and on first use.
                </p>
                <p>
                  <strong className="text-slate">VEFA / New build</strong> — The 7% duties apply only
                  to the land portion. The construction portion is subject to VAT (3% for primary residence,
                  17% otherwise), with a tax benefit cap of 50,000 €.
                </p>
                <p>
                  <strong className="text-slate">Notary fees</strong> — Calculated using a regulated
                  degressive scale (4% up to 10,000 € then degressive).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
