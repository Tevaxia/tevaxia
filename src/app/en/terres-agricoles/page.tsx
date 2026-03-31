"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import { evaluerTerreAgricole } from "@/lib/agricultural";

export default function TerresAgricoles() {
  const [surfaceHa, setSurfaceHa] = useState(5);
  const [qualiteSol, setQualiteSol] = useState<"bonne" | "moyenne" | "faible">("moyenne");
  const [localisation, setLocalisation] = useState<"centre_sud" | "centre" | "nord" | "est">("centre");
  const [batimentsExistants, setBatimentsExistants] = useState(false);
  const [surfaceBatiments, setSurfaceBatiments] = useState(500);
  const [amiantePresume, setAmiantePresume] = useState(false);
  const [exploitationActive, setExploitationActive] = useState(true);
  const [bailRuralEnCours, setBailRuralEnCours] = useState(false);

  const result = useMemo(() =>
    evaluerTerreAgricole({ surfaceHa, qualiteSol, localisation, batimentsExistants, surfaceBatiments, amiantePresume, exploitationActive, bailRuralEnCours }),
  [surfaceHa, qualiteSol, localisation, batimentsExistants, surfaceBatiments, amiantePresume, exploitationActive, bailRuralEnCours]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Valuation — Agricultural Land</h1>
          <p className="mt-2 text-muted">Estimate the value of agricultural land and farm buildings in Luxembourg</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Land</h2>
              <div className="space-y-4">
                <InputField label="Area" value={surfaceHa} onChange={(v) => setSurfaceHa(Number(v))} suffix="hectares" step={0.5} min={0.1} hint={`= ${(surfaceHa * 10000).toLocaleString("fr-LU")} m²`} />
                <InputField label="Soil quality" type="select" value={qualiteSol} onChange={(v) => setQualiteSol(v as typeof qualiteSol)} options={[
                  { value: "bonne", label: "Good — fertile arable land" },
                  { value: "moyenne", label: "Average — meadows, pastures" },
                  { value: "faible", label: "Poor — slopes, wetlands" },
                ]} />
                <InputField label="Location" type="select" value={localisation} onChange={(v) => setLocalisation(v as typeof localisation)} options={[
                  { value: "centre_sud", label: "Centre-South (Luxembourg City, Esch)" },
                  { value: "centre", label: "Centre (Mersch, Capellen)" },
                  { value: "est", label: "East (Moselle, Grevenmacher)" },
                  { value: "nord", label: "North (Diekirch, Wiltz, Clervaux)" },
                ]} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Farm Buildings</h2>
              <div className="space-y-3">
                <ToggleField label="Existing buildings" checked={batimentsExistants} onChange={setBatimentsExistants} />
                {batimentsExistants && (<>
                  <InputField label="Building area" value={surfaceBatiments} onChange={(v) => setSurfaceBatiments(Number(v))} suffix="m²" hint="Barns, stables, sheds..." />
                  <ToggleField label="Active farming operation" checked={exploitationActive} onChange={setExploitationActive} hint="If not active: risk of demolition obligation (PAG AGR zone)" />
                  {!exploitationActive && (
                    <ToggleField label="Presumed asbestos" checked={amiantePresume} onChange={setAmiantePresume} hint="Fibre-cement roofing, old insulation — mandatory survey" />
                  )}
                </>)}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-2xl p-8 text-center shadow-lg ${result.valeurNette > 0 ? "bg-gradient-to-br from-navy to-navy-light text-white" : "bg-gradient-to-br from-error to-red-600 text-white"}`}>
              <div className="text-sm text-white/60">Estimated net value</div>
              <div className="mt-2 text-4xl font-bold">{formatEUR(result.valeurNette)}</div>
              <div className="mt-2 text-xs text-white/50">{formatEUR(result.prixHaEstime)}/ha x {surfaceHa} ha</div>
            </div>

            <ResultPanel title="Valuation breakdown" lines={[
              { label: `Land (${surfaceHa} ha x ${formatEUR(result.prixHaEstime)}/ha)`, value: formatEUR(result.valeurTerres) },
              ...(result.valeurBatiments > 0 ? [{ label: "Farm buildings", value: formatEUR(result.valeurBatiments) }] : []),
              ...(result.coutDemolition > 0 ? [{ label: "Demolition cost", value: `- ${formatEUR(result.coutDemolition)}`, warning: true }] : []),
              ...(result.coutDesamiantage > 0 ? [{ label: "Asbestos removal cost", value: `- ${formatEUR(result.coutDesamiantage)}`, warning: true }] : []),
              { label: "Net value", value: formatEUR(result.valeurNette), highlight: true, large: true },
            ]} />

            {result.alertes.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">Alerts</h3>
                <ul className="space-y-2">
                  {result.alertes.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                      <svg className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reference prices */}
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-navy mb-3">Reference prices by zone (EUR/ha)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="px-2 py-1.5 text-left text-navy">Zone</th>
                      <th className="px-2 py-1.5 text-right text-navy">Good</th>
                      <th className="px-2 py-1.5 text-right text-navy">Average</th>
                      <th className="px-2 py-1.5 text-right text-navy">Poor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { zone: "Centre-South", b: 65000, m: 50000, f: 35000 },
                      { zone: "Centre", b: 55000, m: 42000, f: 30000 },
                      { zone: "East (Moselle)", b: 50000, m: 38000, f: 28000 },
                      { zone: "North", b: 40000, m: 32000, f: 22000 },
                    ].map((r) => (
                      <tr key={r.zone} className="border-b border-card-border/50">
                        <td className="px-2 py-1.5">{r.zone}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatEUR(r.b)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatEUR(r.m)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatEUR(r.f)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-muted">Source: estimates based on observed transactions. Indicative data — the Luxembourg agricultural land market has limited transparency.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
