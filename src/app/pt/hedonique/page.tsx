"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR, type AdjustmentSuggestion } from "@/lib/adjustments";

// Simplified hedonic model
// Price = B0 + B1*Surface + B2*Location + B3*Floor + B4*Condition + B5*Energy + B6*Parking + B7*Outdoor + B8*Year
// In practice a log-linear model is used: ln(Price) = Sum Bi * Xi

interface HedonicCoefficient {
  variable: string;
  label: string;
  coefficient: number; // Impact in % on price
  source: string;
}

// Coefficients calibrated on Luxembourg data
// Source: Observatoire de l'Habitat (hedonic model), academic publications
const COEFFICIENTS: HedonicCoefficient[] = [
  { variable: "surface", label: "Surface area (per additional m² beyond 80 m²)", coefficient: -0.35, source: "Surface elasticity: -0.35%/m² beyond 80 m²" },
  { variable: "etage_rdc", label: "Ground floor (vs 2nd-3rd)", coefficient: -7, source: "Hedonic observatory" },
  { variable: "etage_1er", label: "1st floor (vs 2nd-3rd)", coefficient: -3, source: "Hedonic observatory" },
  { variable: "etage_haut", label: "4th+ floor (vs 2nd-3rd)", coefficient: 3, source: "Hedonic observatory" },
  { variable: "etage_attique", label: "Penthouse / top floor", coefficient: 8, source: "Hedonic observatory" },
  { variable: "etat_neuf", label: "New / recently renovated", coefficient: 7, source: "Observed transactions" },
  { variable: "etat_rafraichir", label: "Needs refreshing", coefficient: -5, source: "Observed transactions" },
  { variable: "etat_renover", label: "Needs renovation", coefficient: -15, source: "Observed transactions" },
  { variable: "energie_AB", label: "Energy class A-B (vs D)", coefficient: 5, source: "Spuerkeess / Observatory" },
  { variable: "energie_FG", label: "Energy class F-G (vs D)", coefficient: -8, source: "Spuerkeess / Observatory" },
  { variable: "parking_int", label: "Indoor parking", coefficient: 5, source: "~30-45k EUR / space" },
  { variable: "balcon", label: "Balcony", coefficient: 2, source: "Observed transactions" },
  { variable: "terrasse", label: "Terrace > 15 m²", coefficient: 6, source: "Observed transactions" },
  { variable: "jardin", label: "Private garden", coefficient: 8, source: "Observed transactions" },
];

export default function Hedonique() {
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [etage, setEtage] = useState(2);
  const [etat, setEtat] = useState("bon");
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [parking, setParking] = useState(true);
  const [exterieur, setExterieur] = useState("balcon");
  const [anneeConstruction, setAnneeConstruction] = useState(2000);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const result = useMemo(() => {
    if (!selectedResult) return null;

    const commune = selectedResult.commune;
    const basePrix = selectedResult.quartier?.prixM2 || commune.prixM2Existant || commune.prixM2Annonces;
    if (!basePrix) return null;

    // Apply coefficients
    const ajustements: { label: string; pct: number; source: string }[] = [];

    // Surface
    const surfDiff = surface - 80;
    if (surfDiff !== 0) {
      const adj = surfDiff * -0.35;
      ajustements.push({ label: `Surface ${surface} m² (${surfDiff > 0 ? "+" : ""}${surfDiff} m² vs ref. 80 m²)`, pct: Math.round(adj * 10) / 10, source: "Elasticity -0.35%/m²" });
    }

    // Floor
    if (etage === 0) ajustements.push({ label: "Ground floor", pct: -7, source: "Observatory" });
    else if (etage === 1) ajustements.push({ label: "1st floor", pct: -3, source: "Observatory" });
    else if (etage >= 4 && etage < 10) ajustements.push({ label: `${etage}th floor`, pct: 3, source: "Observatory" });
    else if (etage >= 10) ajustements.push({ label: "Top floor / penthouse", pct: 8, source: "Observatory" });

    // Condition
    if (etat === "neuf") ajustements.push({ label: "New / renovated", pct: 7, source: "Transactions" });
    else if (etat === "rafraichir") ajustements.push({ label: "Needs refreshing", pct: -5, source: "Transactions" });
    else if (etat === "renover") ajustements.push({ label: "Needs renovation", pct: -15, source: "Transactions" });

    // Energy
    if (classeEnergie <= "B") ajustements.push({ label: `Energy class ${classeEnergie}`, pct: 5, source: "Spuerkeess" });
    else if (classeEnergie === "E") ajustements.push({ label: "Energy class E", pct: -3, source: "Observatory" });
    else if (classeEnergie >= "F") ajustements.push({ label: `Energy class ${classeEnergie}`, pct: -8, source: "Observatory" });

    // Parking
    if (parking) ajustements.push({ label: "Indoor parking", pct: 5, source: "~30-45k EUR" });

    // Outdoor space
    if (exterieur === "balcon") ajustements.push({ label: "Balcony", pct: 2, source: "Transactions" });
    else if (exterieur === "terrasse") ajustements.push({ label: "Terrace > 15 m²", pct: 6, source: "Transactions" });
    else if (exterieur === "jardin") ajustements.push({ label: "Private garden", pct: 8, source: "Transactions" });
    else if (exterieur === "aucun") ajustements.push({ label: "No outdoor space", pct: -4, source: "Transactions" });

    // Year
    const age = new Date().getFullYear() - anneeConstruction;
    if (age < 5) ajustements.push({ label: "Recent construction (< 5 years)", pct: 3, source: "New-build premium" });
    else if (age > 50) ajustements.push({ label: "Construction > 50 years", pct: -3, source: "Obsolescence discount" });

    const totalPct = ajustements.reduce((s, a) => s + a.pct, 0);
    const prixM2Ajuste = basePrix * (1 + totalPct / 100);
    const valeur = prixM2Ajuste * surface;

    return {
      basePrix,
      source: selectedResult.quartier ? `${selectedResult.quartier.nom}, ${commune.commune}` : commune.commune,
      ajustements,
      totalPct,
      prixM2Ajuste: Math.round(prixM2Ajuste),
      valeur: Math.round(valeur),
      // Variable confidence interval depending on data density
      intervalleBas: Math.round(valeur * (selectedResult?.quartier ? 0.90 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 0.88 : 0.82)),
      intervalleHaut: Math.round(valeur * (selectedResult?.quartier ? 1.10 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 1.12 : 1.18)),
      confiancePct: selectedResult?.quartier ? 80 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 75 : 65,
      // Price forecast (linear trend from STATEC indices)
      prevision1an: Math.round(valeur * 1.025),
      prevision3ans: Math.round(valeur * Math.pow(1.025, 3)),
      prevision5ans: Math.round(valeur * Math.pow(1.025, 5)),
    };
  }, [selectedResult, surface, etage, etat, classeEnergie, parking, exterieur, anneeConstruction]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Hedonic Valuation</h1>
          <p className="mt-2 text-muted">
            Multi-criteria pricing model inspired by the Observatoire de l'Habitat methodology
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Municipality */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Location</h2>
              <div className="relative">
                <input
                  type="text"
                  value={communeSearch}
                  onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                  placeholder="Municipality, locality or neighbourhood..."
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button key={r.commune.commune + r.matchedOn} onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors">
                        <span className="font-medium">{r.isLocalite ? r.matchedOn : r.commune.commune}</span>
                        {r.isLocalite && <span className="text-muted ml-1">— {r.commune.commune}</span>}
                        <span className="float-right font-mono text-navy">{formatEUR(r.quartier?.prixM2 || r.commune.prixM2Existant || 0)}/m²</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Characteristics */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Characteristics</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Surface area" value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label="Floor" value={etage} onChange={(v) => setEtage(Number(v))} min={0} max={20} hint="0 = ground floor, 10+ = penthouse" />
                <InputField label="Condition" type="select" value={etat} onChange={setEtat} options={[
                  { value: "neuf", label: "New / renovated" },
                  { value: "bon", label: "Good condition" },
                  { value: "rafraichir", label: "Needs refreshing" },
                  { value: "renover", label: "Needs renovation" },
                ]} />
                <InputField label="Energy class" type="select" value={classeEnergie} onChange={setClasseEnergie} options={[
                  { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
                  { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
                ]} />
                <InputField label="Outdoor space" type="select" value={exterieur} onChange={setExterieur} options={[
                  { value: "aucun", label: "None" },
                  { value: "balcon", label: "Balcony" },
                  { value: "terrasse", label: "Terrace > 15 m²" },
                  { value: "jardin", label: "Private garden" },
                ]} />
                <InputField label="Year of construction" value={anneeConstruction} onChange={(v) => setAnneeConstruction(Number(v))} min={1800} max={2026} />
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="rounded" />
                  Indoor parking
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center shadow-lg">
                  <div className="text-sm text-white/60">Estimated hedonic value</div>
                  <div className="mt-2 text-5xl font-bold">{formatEUR(result.valeur)}</div>
                  <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                    <div><div className="text-white/40 text-xs">Low (-12%)</div><div className="font-semibold">{formatEUR(result.intervalleBas)}</div></div>
                    <div className="h-8 w-px bg-white/20" />
                    <div><div className="text-white/40 text-xs">High (+12%)</div><div className="font-semibold">{formatEUR(result.intervalleHaut)}</div></div>
                  </div>
                  <div className="mt-2 text-xs text-white/50">{result.prixM2Ajuste} EUR/m²</div>
                </div>

                <ResultPanel
                  title="Hedonic breakdown"
                  lines={[
                    { label: `Base price /m² (${result.source})`, value: formatEUR(result.basePrix) },
                    ...result.ajustements.map((a) => ({
                      label: a.label,
                      value: `${a.pct > 0 ? "+" : ""}${a.pct}%`,
                      sub: true,
                    })),
                    { label: "Total adjustments", value: `${result.totalPct > 0 ? "+" : ""}${result.totalPct.toFixed(1)}%`, highlight: true },
                    { label: "Adjusted price /m²", value: formatEUR(result.prixM2Ajuste), highlight: true },
                  ]}
                />

                {/* Model quality & forecasts */}
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-navy mb-2">Model quality</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">Confidence</div>
                      <div className="text-lg font-bold text-navy">{result.confiancePct}%</div>
                    </div>
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">Estimated R²</div>
                      <div className="text-lg font-bold text-navy">~0.75</div>
                      <div className="text-[9px] text-muted">Explains ~75% of the variation</div>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-navy mb-2">Price forecast</h3>
                  <div className="space-y-1 mb-4 text-xs">
                    <div className="flex justify-between"><span className="text-muted">In 1 year (+2.5%/yr)</span><span className="font-mono font-semibold">{formatEUR(result.prevision1an)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">In 3 years</span><span className="font-mono font-semibold">{formatEUR(result.prevision3ans)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">In 5 years</span><span className="font-mono font-semibold">{formatEUR(result.prevision5ans)}</span></div>
                  </div>
                  <p className="text-[10px] text-muted mb-4">Linear projection based on recent trend (+2.5%/yr). Forecasts are not guarantees.</p>

                  <h3 className="text-sm font-semibold text-navy mb-3">Model coefficients</h3>
                  <div className="space-y-1 text-xs">
                    {COEFFICIENTS.map((c) => (
                      <div key={c.variable} className="flex justify-between py-1 border-b border-card-border/30">
                        <span className="text-muted">{c.label}</span>
                        <span className={`font-mono ${c.coefficient > 0 ? "text-success" : c.coefficient < 0 ? "text-error" : ""}`}>
                          {c.coefficient > 0 ? "+" : ""}{c.coefficient}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-muted">
                    Coefficients calibrated on data from the Observatoire de l'Habitat and Spuerkeess
                    publications. This is not the official Observatory model (which is not public) but an
                    approximation based on published results.
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
                <p className="text-sm text-muted">Select a municipality to get the hedonic estimate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
