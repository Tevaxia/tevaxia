"use client";

import { useState, useMemo, useCallback } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2, formatPct } from "@/lib/calculations";
import {
  calculerComparaison,
  calculerCapitalisation,
  calculerDCF,
  calculerMLV,
  calculerResiduelleEnergetique,
  calculerTermeReversion,
  reconcilier,
  type Comparable,
} from "@/lib/valuation";
import { evaluerESG } from "@/lib/esg";
import {
  rechercherCommune,
  suggestComparables,
  DATA_SOURCES,
  type MarketDataCommune,
  type SearchResult,
} from "@/lib/market-data";
import {
  ASSET_TYPES,
  EVS_VALUE_TYPES,
  getAssetTypeConfig,
  type AssetType,
  type EVSValueType,
} from "@/lib/asset-types";
import AdjustmentGuidePanel from "@/components/AdjustmentGuide";
import MarketDataPanel from "@/components/MarketDataPanel";
import { calculerAjustDate } from "@/lib/adjustments";
import { downloadReport } from "@/components/ValuationReport";
import { genererNarrative } from "@/lib/narrative";
import { estimerCoutsRenovation } from "@/lib/renovation-costs";
import { evaluerChecklist, scoreChecklist } from "@/lib/evs-checklist";

type ActiveTab = "comparaison" | "capitalisation" | "terme_reversion" | "dcf" | "esg" | "energie" | "mlv" | "reconciliation";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "comparaison", label: "Comparison" },
  { id: "capitalisation", label: "Capitalisation" },
  { id: "terme_reversion", label: "Term & Reversion" },
  { id: "dcf", label: "Discounted Cash Flow" },
  { id: "esg", label: "ESG" },
  { id: "energie", label: "Energy Residual" },
  { id: "mlv", label: "Mortgage Lending Value" },
  { id: "reconciliation", label: "Reconciliation" },
];

// ============================================================
// TAB 1 — COMPARISON
// ============================================================

function TabComparaison({
  surfaceBien,
  onValeur,
  assetType,
  communeSearch,
  setCommuneSearch,
  selectedResult,
  setSelectedResult,
  searchResults,
  selectedCommune,
  comparables,
  setComparables,
}: {
  surfaceBien: number;
  onValeur: (v: number) => void;
  assetType: AssetType;
  communeSearch: string;
  setCommuneSearch: (v: string) => void;
  selectedResult: SearchResult | null;
  setSelectedResult: (v: SearchResult | null) => void;
  searchResults: SearchResult[];
  selectedCommune: MarketDataCommune | null;
  comparables: Comparable[];
  setComparables: React.Dispatch<React.SetStateAction<Comparable[]>>;
}) {

  const result = useMemo(() => {
    if (comparables.length === 0) {
      onValeur(0);
      return null;
    }
    const r = calculerComparaison(comparables, surfaceBien);
    onValeur(r.valeurEstimeePonderee);
    return r;
  }, [comparables, surfaceBien, onValeur]);

  const updateComp = (index: number, field: keyof Comparable, value: string | number) => {
    setComparables((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof next[index][field] === "number" ? Number(value) : value };
      return next;
    });
  };

  const addComp = () => {
    setComparables((prev) => [
      ...prev,
      {
        id: String(Date.now()), adresse: "", prixVente: 0, surface: 0,
        dateVente: "2025-01", ajustLocalisation: 0, ajustEtat: 0, ajustEtage: 0,
        ajustExterieur: 0, ajustParking: 0, ajustDate: 0, ajustAutre: 0, poids: 33,
      },
    ]);
  };

  const removeComp = (index: number) => {
    setComparables((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Market references — public data */}
      <div className="rounded-xl border-2 border-navy/20 bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy mb-1">Market references by municipality</h2>
        <p className="text-xs text-muted mb-4">Source: Observatoire de l'Habitat / Land Registry (notarial deeds) — open data CC0</p>

        <div className="relative">
          <input
            type="text"
            value={communeSearch}
            onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
            placeholder="Search for a municipality or locality (e.g. Bourglinster, Kirchberg, Howald...)"
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.commune.commune + r.matchedOn}
                  onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors"
                >
                  {r.isLocalite ? (
                    <>
                      <span className="font-medium">{r.matchedOn}</span>
                      <span className="text-muted ml-1">— {r.quartier ? "district of" : "municipality of"} {r.commune.commune}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{r.commune.commune}</span>
                      <span className="text-muted ml-2">({r.commune.canton})</span>
                    </>
                  )}
                  <span className="float-right font-mono text-navy">
                    {r.quartier ? formatEUR(r.quartier.prixM2) : r.commune.prixM2Existant ? formatEUR(r.commune.prixM2Existant) : "—"}/m²
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCommune && (
          <div className="mt-4">
            {selectedResult?.isLocalite && (
              <p className="text-xs text-muted mb-2">
                <span className="font-medium text-slate">{selectedResult.matchedOn}</span> — {selectedResult.quartier ? "district of" : "municipality of"} <span className="font-medium text-slate">{selectedCommune.commune}</span> ({selectedCommune.canton}).
                {selectedResult.quartier && (
                  <span className="ml-1 text-slate">{selectedResult.quartier.note}</span>
                )}
              </p>
            )}

            {/* Specific district price if available */}
            {selectedResult?.quartier && (
              <div className="mb-3 rounded-lg border-2 border-navy/20 bg-navy/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-navy">{selectedResult.quartier.nom}</div>
                    <div className="text-xs text-muted">{selectedResult.quartier.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-navy">{formatEUR(selectedResult.quartier.prixM2)}/m²</div>
                    {selectedResult.quartier.loyerM2 && (
                      <div className="text-xs text-muted">Rent: {selectedResult.quartier.loyerM2.toFixed(1)} €/m²/month</div>
                    )}
                    <div className={`text-xs font-medium ${selectedResult.quartier.tendance === "hausse" ? "text-success" : selectedResult.quartier.tendance === "baisse" ? "text-error" : "text-muted"}`}>
                      Trend: {selectedResult.quartier.tendance === "hausse" ? "rising" : selectedResult.quartier.tendance === "baisse" ? "falling" : "stable"}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">Transaction price /m²</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2Existant ? formatEUR(selectedCommune.prixM2Existant) : "—"}</div>
              <div className="text-[10px] text-muted">Existing — notarial deeds</div>
            </div>
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">Off-plan price /m² (VEFA)</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2VEFA ? formatEUR(selectedCommune.prixM2VEFA) : "—"}</div>
              <div className="text-[10px] text-muted">New-build — notarial deeds</div>
            </div>
            <div className="rounded-lg bg-gold/10 p-3 text-center">
              <div className="text-xs text-muted">Listing price /m²</div>
              <div className="text-lg font-bold text-gold-dark">{selectedCommune.prixM2Annonces ? formatEUR(selectedCommune.prixM2Annonces) : "—"}</div>
              <div className="text-[10px] text-muted">Listings — aggregated data</div>
            </div>
            <div className="rounded-lg bg-teal/10 p-3 text-center">
              <div className="text-xs text-muted">Rent /m²/month</div>
              <div className="text-lg font-bold text-teal">{selectedCommune.loyerM2Annonces ? `${selectedCommune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
              <div className="text-[10px] text-muted">Listings — aggregated data</div>
            </div>
            </div>
          </div>
        )}

        {selectedCommune && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>{selectedCommune.nbTransactions} transactions — {selectedCommune.periode}</span>
            <span>{selectedCommune.source}</span>
          </div>
        )}

        {/* District grid if available */}
        {selectedCommune?.quartiers && selectedCommune.quartiers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-navy mb-2">Prices by district — {selectedCommune.commune}</h3>
            <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">District</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">€/m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Rent/m²</th>
                    <th className="px-3 py-2 text-center font-semibold text-navy">Trend</th>
                    <th className="px-3 py-2 text-left font-semibold text-navy">Characteristic</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCommune.quartiers
                    .sort((a, b) => b.prixM2 - a.prixM2)
                    .map((qr) => (
                    <tr key={qr.nom} className={`border-b border-card-border/50 hover:bg-background/50 ${selectedResult?.quartier?.nom === qr.nom ? "bg-navy/5" : ""}`}>
                      <td className="px-3 py-1.5 font-medium">{qr.nom}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(qr.prixM2)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted">{qr.loyerM2 ? `${qr.loyerM2.toFixed(1)} €` : "—"}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          qr.tendance === "hausse" ? "bg-green-100 text-green-700" :
                          qr.tendance === "baisse" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{qr.tendance === "hausse" ? "rising" : qr.tendance === "baisse" ? "falling" : "stable"}</span>
                      </td>
                      <td className="px-3 py-1.5 text-muted">{qr.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[10px] text-muted">Source: Observatoire de l'Habitat — listing prices by district. Indicative data, sorted by descending price.</p>
          </div>
        )}
      </div>

      {/* Market data by segment (non-residential) */}
      {assetType !== "residential_apartment" && (
        <MarketDataPanel assetType={assetType} />
      )}

      {/* Data sources */}
      <div className="rounded-lg border border-card-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-navy mb-2">Open data sources</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <a href={DATA_SOURCES.prixTransactionsParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixTransactionsParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixTransactionsParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.prixAffinesParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixAffinesParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixAffinesParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.prixAnnoncesParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixAnnoncesParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixAnnoncesParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.indicePrixSTATEC.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">SDMX</span>
            <span className="text-slate">{DATA_SOURCES.indicePrixSTATEC.label}</span>
          </a>
        </div>
      </div>

      {/* Comparables — manual entry */}
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-navy">Comparables</h2>
            <p className="text-xs text-muted">Enter your actual transaction references</p>
          </div>
          <div className="flex gap-2">
            {selectedCommune && comparables.length === 0 && (
              <button
                onClick={() => {
                  const suggested = suggestComparables(selectedCommune.commune, 4);
                  const newComps: Comparable[] = suggested.map((s, i) => ({
                    id: String(Date.now() + i),
                    adresse: s.source,
                    prixVente: s.prixM2 * surfaceBien,
                    surface: surfaceBien,
                    dateVente: "2025-01",
                    ajustLocalisation: 0,
                    ajustEtat: 0,
                    ajustEtage: 0,
                    ajustExterieur: 0,
                    ajustParking: 0,
                    ajustDate: 0,
                    ajustAutre: 0,
                    poids: Math.round(100 / suggested.length),
                  }));
                  setComparables(newComps);
                }}
                className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-navy-dark hover:bg-gold-light transition-colors"
              >
                Suggest comparables
              </button>
            )}
            <button
              onClick={addComp}
              className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        {comparables.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-card-border py-8 text-center">
            <p className="text-sm text-muted">No comparables entered</p>
            <p className="text-xs text-muted mt-1">{selectedCommune ? "Click \"Suggest\" or add manually" : "Select a municipality then add comparables"}</p>
            <div className="mt-3 flex gap-2 justify-center">
              {selectedCommune && (
                <button
                  onClick={() => {
                    const suggested = suggestComparables(selectedCommune.commune, 4);
                    setComparables(suggested.map((s, i) => ({
                      id: String(Date.now() + i),
                      adresse: s.source,
                      prixVente: s.prixM2 * surfaceBien,
                      surface: surfaceBien,
                      dateVente: "2025-01",
                      ajustLocalisation: 0, ajustEtat: 0, ajustEtage: 0, ajustExterieur: 0,
                      ajustParking: 0, ajustDate: 0, ajustAutre: 0,
                      poids: Math.round(100 / suggested.length),
                    })));
                  }}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy-dark hover:bg-gold-light transition-colors"
                >
                  Suggest comparables
                </button>
              )}
              <button onClick={addComp} className="rounded-lg bg-navy/10 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/20 transition-colors">
                + Add manually
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {comparables.map((comp, i) => (
            <div key={comp.id} className="rounded-lg border border-card-border bg-background p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-navy">Comparable {i + 1}</span>
                <button onClick={() => removeComp(i)} className="text-xs text-error hover:underline">
                  Remove
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InputField label="Address" type="text" value={comp.adresse} onChange={(v) => updateComp(i, "adresse", v)} className="sm:col-span-3" />
                <InputField label="Sale price" value={comp.prixVente} onChange={(v) => updateComp(i, "prixVente", v)} suffix="€" />
                <InputField label="Area" value={comp.surface} onChange={(v) => updateComp(i, "surface", v)} suffix="m²" />
                <InputField label="Sale date" type="text" value={comp.dateVente} onChange={(v) => updateComp(i, "dateVente", v)} hint="YYYY-MM" />
              </div>

              {/* Adjustments with statistical guides */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-navy">Adjustments</span>
                  <span className="text-[10px] text-muted">Click a suggestion to apply the value</span>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {/* Location */}
                  <div className="flex gap-2">
                    <InputField label="Location" value={comp.ajustLocalisation} onChange={(v) => updateComp(i, "ajustLocalisation", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="localisation" currentValue={comp.ajustLocalisation} onApply={(v) => updateComp(i, "ajustLocalisation", v)} />
                  </div>

                  {/* Condition */}
                  <div className="flex gap-2">
                    <InputField label="Condition" value={comp.ajustEtat} onChange={(v) => updateComp(i, "ajustEtat", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etat" currentValue={comp.ajustEtat} onApply={(v) => updateComp(i, "ajustEtat", v)} />
                  </div>

                  {/* Floor / View */}
                  <div className="flex gap-2">
                    <InputField label="Floor / View" value={comp.ajustEtage} onChange={(v) => updateComp(i, "ajustEtage", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etage" currentValue={comp.ajustEtage} onApply={(v) => updateComp(i, "ajustEtage", v)} />
                  </div>

                  {/* Outdoor space */}
                  <div className="flex gap-2">
                    <InputField label="Outdoor space" value={comp.ajustExterieur} onChange={(v) => updateComp(i, "ajustExterieur", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="exterieur" currentValue={comp.ajustExterieur} onApply={(v) => updateComp(i, "ajustExterieur", v)} />
                  </div>

                  {/* Parking */}
                  <div className="flex gap-2">
                    <InputField label="Parking" value={comp.ajustParking} onChange={(v) => updateComp(i, "ajustParking", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="parking" currentValue={comp.ajustParking} onApply={(v) => updateComp(i, "ajustParking", v)} />
                  </div>

                  {/* Date — with STATEC auto-calculation */}
                  <div className="flex gap-2">
                    <InputField label="Date (index.)" value={comp.ajustDate} onChange={(v) => updateComp(i, "ajustDate", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="date" currentValue={comp.ajustDate} onApply={(v) => updateComp(i, "ajustDate", v)} dateVente={comp.dateVente} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <InputField label="Other adjustment" value={comp.ajustAutre} onChange={(v) => updateComp(i, "ajustAutre", v)} suffix="%" step={0.5} hint="Discretionary — justify" />
                  <InputField label="Weight" value={comp.poids} onChange={(v) => updateComp(i, "poids", v)} suffix="%" min={0} max={100} hint="Weighting in average" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results — only if comparables are entered */}
      {result && result.comparables.length > 0 && (
        <>
          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  <th className="px-3 py-2.5 text-left font-semibold text-navy">Comp.</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">€/m² gross</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">Total adj.</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">€/m² adjusted</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">Weight</th>
                </tr>
              </thead>
              <tbody>
                {result.comparables.map((c, i) => (
                  <tr key={c.id} className="border-b border-card-border/50">
                    <td className="px-3 py-2 font-medium">{c.adresse || `Comp. ${i + 1}`}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatEUR(c.prixM2Brut)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted">{c.totalAjustements > 0 ? "+" : ""}{c.totalAjustements.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(c.prixM2Ajuste)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted">{c.poids}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ResultPanel
            title="Value by comparison"
            lines={[
              { label: "Adjusted average price /m²", value: formatEUR(result.prixM2Moyen), sub: true },
              { label: "Weighted average price /m²", value: formatEUR(result.prixM2MoyenPondere) },
              { label: "Property area", value: `${surfaceBien} m²`, sub: true },
              { label: "Estimated value (weighted)", value: formatEUR(result.valeurEstimeePonderee), highlight: true, large: true },
            ]}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// TAB 2 — DIRECT CAPITALISATION
// ============================================================

function TabCapitalisation({ onValeur }: { onValeur: (v: number) => void }) {
  const [loyerBrut, setLoyerBrut] = useState(36000);
  const [chargesNonRecup, setChargesNonRecup] = useState(1800);
  const [tauxVacance, setTauxVacance] = useState(5);
  const [provisionEntretien, setProvisionEntretien] = useState(3);
  const [assurancePNO, setAssurancePNO] = useState(400);
  const [fraisGestion, setFraisGestion] = useState(5);
  const [taxeFonciere, setTaxeFonciere] = useState(200);
  const [tauxCap, setTauxCap] = useState(4.0);
  const [ervAnnuel, setErvAnnuel] = useState(0);

  const result = useMemo(() => {
    const r = calculerCapitalisation({
      loyerBrutAnnuel: loyerBrut,
      chargesNonRecuperables: chargesNonRecup,
      tauxVacance: tauxVacance / 100,
      provisionGrosEntretien: provisionEntretien / 100,
      assurancePNO,
      fraisGestion: fraisGestion / 100,
      taxeFonciere,
      tauxCapitalisation: tauxCap / 100,
      ervAnnuel: ervAnnuel > 0 ? ervAnnuel : undefined,
    });
    onValeur(r.valeur);
    return r;
  }, [loyerBrut, chargesNonRecup, tauxVacance, provisionEntretien, assurancePNO, fraisGestion, taxeFonciere, tauxCap, onValeur]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Income</h2>
          <div className="space-y-4">
            <InputField label="Gross annual rent" value={loyerBrut} onChange={(v) => setLoyerBrut(Number(v))} suffix="€" hint={`${formatEUR2(loyerBrut / 12)} /month`} />
            <InputField label="Void rate" value={tauxVacance} onChange={(v) => setTauxVacance(Number(v))} suffix="%" step={0.5} hint="Adjustable — depends on local market and asset type" />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Landlord charges</h2>
          <div className="space-y-4">
            <InputField label="Non-recoverable charges" value={chargesNonRecup} onChange={(v) => setChargesNonRecup(Number(v))} suffix="€/yr" />
            <InputField label="Major repairs provision" value={provisionEntretien} onChange={(v) => setProvisionEntretien(Number(v))} suffix="% of rent" step={0.5} />
            <InputField label="Landlord insurance" value={assurancePNO} onChange={(v) => setAssurancePNO(Number(v))} suffix="€/yr" />
            <InputField label="Management fees" value={fraisGestion} onChange={(v) => setFraisGestion(Number(v))} suffix="% of rent" step={0.5} />
            <InputField label="Property tax" value={taxeFonciere} onChange={(v) => setTaxeFonciere(Number(v))} suffix="€/yr" hint="Very low in Luxembourg compared to France" />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Market rental value (optional)</h2>
          <InputField
            label="Annual market rent (ERV)"
            value={ervAnnuel}
            onChange={(v) => setErvAnnuel(Number(v))}
            suffix="€"
            hint="If different from passing rent — allows calculation of reversionary yield and reversion potential"
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Capitalisation rate</h2>
          <InputField
            label="Capitalisation rate"
            value={tauxCap}
            onChange={(v) => setTauxCap(Number(v))}
            suffix="%"
            step={0.1}
            hint="Adjustable — subjective parameter, depends on the market, location and risk"
          />
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Capitalisation rate:</strong> No universal value. In Luxembourg, residential cap rates
              range from 3% (prime, Luxembourg City) to 5.5% (secondary, north).
              The choice of rate significantly impacts value — a 0.5% difference can represent
              +15% in value. Must be systematically justified.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ResultPanel
          title="Net Operating Income (NOI)"
          lines={[
            { label: "Gross annual rent", value: formatEUR(loyerBrut) },
            { label: `Void (${tauxVacance}%)`, value: `- ${formatEUR(loyerBrut * tauxVacance / 100)}`, sub: true },
            { label: "Effective gross income", value: formatEUR(result.loyerBrutEffectif) },
            { label: "Landlord charges", value: `- ${formatEUR(result.totalCharges)}` },
            { label: "Net Operating Income (NOI)", value: formatEUR(result.noi), highlight: true, large: true },
          ]}
        />

        <ResultPanel
          title="Value by capitalisation"
          className="border-gold/30"
          lines={[
            { label: "NOI / Capitalisation rate", value: `${formatEUR(result.noi)} / ${tauxCap}%`, sub: true },
            { label: "Estimated value", value: formatEUR(result.valeur), highlight: true, large: true },
            { label: "Initial yield (passing rent)", value: formatPct(result.rendementInitial) },
            { label: "Gross yield", value: formatPct(result.rendementBrut), sub: true },
            { label: "Net yield", value: formatPct(result.rendementNet), sub: true },
            ...(result.rendementReversionnaire !== undefined ? [
              { label: "Reversionary yield (market rent)", value: formatPct(result.rendementReversionnaire) },
              { label: result.sousLoue ? "Under-rented — reversion potential" : "Over-rented — reversion risk", value: `${result.potentielReversion ? (result.potentielReversion > 0 ? "+" : "") + result.potentielReversion.toFixed(1) + "%" : "0%"}`, warning: !result.sousLoue },
            ] : []),
          ]}
        />

        {/* Cap rate sensitivity */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-navy">Sensitivity analysis — Capitalisation rate</h3>
          <div className="space-y-1">
            {result.sensibilite.map((s) => {
              const isActive = Math.abs(s.tauxCap - tauxCap) < 0.01;
              return (
                <div key={s.tauxCap} className={`flex justify-between py-1.5 px-2 rounded text-sm ${isActive ? "bg-navy/5 font-semibold" : ""}`}>
                  <span className="text-muted">Rate {s.tauxCap.toFixed(2)}%</span>
                  <span className="font-mono">{formatEUR(s.valeur)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 3 — DCF
// ============================================================

function TabDCF({ onValeur }: { onValeur: (v: number) => void }) {
  const [loyerInitial, setLoyerInitial] = useState(36000);
  const [tauxIndex, setTauxIndex] = useState(2.0);
  const [tauxVacance, setTauxVacance] = useState(5);
  const [chargesAnnuelles, setChargesAnnuelles] = useState(4500);
  const [progressionCharges, setProgressionCharges] = useState(2.0);
  const [periodeAnalyse, setPeriodeAnalyse] = useState(10);
  const [tauxActu, setTauxActu] = useState(5.5);
  const [tauxCapSortie, setTauxCapSortie] = useState(4.5);
  const [fraisCession, setFraisCession] = useState(7);

  const result = useMemo(() => {
    const r = calculerDCF({
      loyerAnnuelInitial: loyerInitial,
      tauxIndexation: tauxIndex / 100,
      tauxVacance: tauxVacance / 100,
      chargesAnnuelles,
      tauxProgressionCharges: progressionCharges / 100,
      periodeAnalyse,
      tauxActualisation: tauxActu / 100,
      tauxCapSortie: tauxCapSortie / 100,
      fraisCessionPct: fraisCession / 100,
    });
    onValeur(r.valeurDCF);
    return r;
  }, [loyerInitial, tauxIndex, tauxVacance, chargesAnnuelles, progressionCharges, periodeAnalyse, tauxActu, tauxCapSortie, fraisCession, onValeur]);

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Cash flows</h2>
            <div className="space-y-4">
              <InputField label="Initial annual rent" value={loyerInitial} onChange={(v) => setLoyerInitial(Number(v))} suffix="€" />
              <InputField label="Annual indexation" value={tauxIndex} onChange={(v) => setTauxIndex(Number(v))} suffix="%" step={0.1} hint="Adjustable — projected rental growth" />
              <InputField label="Void rate" value={tauxVacance} onChange={(v) => setTauxVacance(Number(v))} suffix="%" step={0.5} />
              <InputField label="Landlord charges (year 1)" value={chargesAnnuelles} onChange={(v) => setChargesAnnuelles(Number(v))} suffix="€" />
              <InputField label="Annual charge growth" value={progressionCharges} onChange={(v) => setProgressionCharges(Number(v))} suffix="%" step={0.1} />
              <InputField label="Analysis period" value={periodeAnalyse} onChange={(v) => setPeriodeAnalyse(Number(v))} suffix="yrs" min={5} max={20} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Discount rate & exit yield</h2>
            <div className="space-y-4">
              <InputField
                label="Discount rate"
                value={tauxActu}
                onChange={(v) => setTauxActu(Number(v))}
                suffix="%"
                step={0.1}
                hint="Adjustable — opportunity cost of capital, incorporating the risk premium"
              />
              <InputField
                label="Exit capitalisation rate"
                value={tauxCapSortie}
                onChange={(v) => setTauxCapSortie(Number(v))}
                suffix="%"
                step={0.1}
                hint="Adjustable — generally >= entry cap rate to reflect ageing"
              />
              <InputField label="Disposal costs" value={fraisCession} onChange={(v) => setFraisCession(Number(v))} suffix="%" hint="Duties, notary, agency (~7% in Luxembourg)" />
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Discount rate and exit yield:</strong> These two parameters are the most sensitive in the model.
                The discount rate reflects the investor's expected return (risk-free rate + real estate risk premium).
                The exit yield is used to estimate the resale value at the end of the holding period — it is generally
                higher than the entry cap rate to reflect the ageing of the asset.
                A 0.5% difference in either can change the value by 10-15%.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ResultPanel
            title="DCF Value"
            className="border-gold/30"
            lines={[
              { label: "Discounted net income (cumulative)", value: formatEUR(result.totalNOIActualise) },
              { label: `Net income year ${periodeAnalyse + 1} (projection)`, value: formatEUR(result.noiTerminal), sub: true },
              { label: "Estimated resale value (gross)", value: formatEUR(result.valeurTerminaleBrute), sub: true },
              { label: `Disposal costs (${fraisCession}%)`, value: `- ${formatEUR(result.fraisCession)}`, sub: true },
              { label: "Net resale value", value: formatEUR(result.valeurTerminaleNette), sub: true },
              { label: "Discounted resale value", value: formatEUR(result.valeurTerminaleActualisee) },
              { label: "DCF Value", value: formatEUR(result.valeurDCF), highlight: true, large: true },
              { label: "Internal Rate of Return (IRR)", value: `${(result.irr * 100).toFixed(2)} %`, highlight: true },
            ]}
          />

          {/* DCF sensitivity matrix */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">Sensitivity — Discount rate x Exit yield</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="px-2 py-1.5 text-left text-navy">Disc. \ Exit</th>
                    {[...new Set(result.sensibilite.map((s) => s.tauxCapSortie))].map((tc) => (
                      <th key={tc} className="px-2 py-1.5 text-right text-navy">{tc.toFixed(1)}%</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(result.sensibilite.map((s) => s.tauxActu))].map((ta) => (
                    <tr key={ta} className="border-b border-card-border/50">
                      <td className="px-2 py-1.5 font-medium">{ta.toFixed(1)}%</td>
                      {result.sensibilite.filter((s) => s.tauxActu === ta).map((s) => {
                        const isBase = Math.abs(s.tauxActu - tauxActu) < 0.01 && Math.abs(s.tauxCapSortie - tauxCapSortie) < 0.01;
                        return (
                          <td key={s.tauxCapSortie} className={`px-2 py-1.5 text-right font-mono ${isBase ? "bg-navy/10 font-bold" : ""}`}>
                            {formatEUR(s.valeur)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted">The highlighted cell corresponds to the current parameters. Variation of +/-0.5%.</p>
          </div>

          {/* Cash flows vs terminal proportion */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">Value breakdown</h3>
            <div className="flex gap-1 h-6 rounded-full overflow-hidden">
              <div
                className="bg-navy rounded-l-full"
                style={{ width: `${result.valeurDCF > 0 ? (result.totalNOIActualise / result.valeurDCF) * 100 : 50}%` }}
              />
              <div
                className="bg-gold rounded-r-full"
                style={{ width: `${result.valeurDCF > 0 ? (result.valeurTerminaleActualisee / result.valeurDCF) * 100 : 50}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>Net income: {result.valeurDCF > 0 ? ((result.totalNOIActualise / result.valeurDCF) * 100).toFixed(0) : 0}%</span>
              <span>Resale value: {result.valeurDCF > 0 ? ((result.valeurTerminaleActualisee / result.valeurDCF) * 100).toFixed(0) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash flow table */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-3 py-2.5 text-left font-semibold text-navy">Year</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Gross rent</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Void</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Charges</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Net income</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Disc. factor</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Discounted income</th>
            </tr>
          </thead>
          <tbody>
            {result.cashFlows.map((cf) => (
              <tr key={cf.annee} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-3 py-2 font-medium">{cf.annee}</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(cf.loyerBrut)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{formatEUR(cf.vacance)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{formatEUR(cf.charges)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(cf.noi)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{cf.facteurActualisation.toFixed(4)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(cf.noiActualise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// TAB — TERM & REVERSION
// ============================================================

function TabTermeReversion({ onValeur }: { onValeur: (v: number) => void }) {
  const [loyerEnPlace, setLoyerEnPlace] = useState(36000);
  const [erv, setErv] = useState(42000);
  const [dureeRestante, setDureeRestante] = useState(5);
  const [tauxTerme, setTauxTerme] = useState(4.0);
  const [tauxReversion, setTauxReversion] = useState(5.0);

  const result = useMemo(() => {
    const r = calculerTermeReversion({
      loyerEnPlace,
      erv,
      dureeRestanteBail: dureeRestante,
      tauxTerme: tauxTerme / 100,
      tauxReversion: tauxReversion / 100,
    });
    onValeur(r.valeur);
    return r;
  }, [loyerEnPlace, erv, dureeRestante, tauxTerme, tauxReversion, onValeur]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Income</h2>
          <div className="space-y-4">
            <InputField label="Passing rent (annual)" value={loyerEnPlace} onChange={(v) => setLoyerEnPlace(Number(v))} suffix="€" hint="Current rent received" />
            <InputField label="Estimated Rental Value — ERV (annual)" value={erv} onChange={(v) => setErv(Number(v))} suffix="€" hint="Estimated market rent at renewal" />
            <InputField label="Remaining lease term" value={dureeRestante} onChange={(v) => setDureeRestante(Number(v))} suffix="yrs" min={0} max={30} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Yield rates</h2>
          <div className="space-y-4">
            <InputField label="Term yield (passing rent — more secure)" value={tauxTerme} onChange={(v) => setTauxTerme(Number(v))} suffix="%" step={0.1} hint="Adjustable — applied to contractual rent, lower because income is secured" />
            <InputField label="Reversion yield (ERV — higher risk)" value={tauxReversion} onChange={(v) => setTauxReversion(Number(v))} suffix="%" step={0.1} hint="Adjustable — applied to future market rent, higher because uncertain" />
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Term & reversion method:</strong> The passing rent is capitalised at the term yield for the remaining
              lease duration (contractual income, more secure). The ERV is capitalised in perpetuity at the reversion yield, deferred by the remaining
              term (future income, less certain). The sum gives the value. The term yield is lower than the reversion yield.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <ResultPanel
          title="Value by term & reversion"
          className="border-gold/30"
          lines={[
            { label: `Term: ${formatEUR(loyerEnPlace)} x ${result.facteurTerme.toFixed(3)} (YP ${dureeRestante} yrs at ${tauxTerme}%)`, value: formatEUR(result.valeurTerme) },
            { label: `Reversion: ${formatEUR(erv)} x ${result.facteurReversionPerp.toFixed(2)} x ${result.facteurDiffere.toFixed(4)}`, value: formatEUR(result.valeurReversion) },
            { label: "Total value", value: formatEUR(result.valeur), highlight: true, large: true },
            { label: "Equivalent yield", value: formatPct(result.rendementEquivalent), sub: true },
            { label: loyerEnPlace < erv ? "Under-rented — reversion potential" : "Over-rented — risk at expiry", value: `${((erv - loyerEnPlace) / loyerEnPlace * 100).toFixed(1)}%`, warning: loyerEnPlace > erv },
          ]}
        />
      </div>
    </div>
  );
}

// ============================================================
// TAB — ESG / SUSTAINABILITY
// ============================================================

function TabESG() {
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [anneeConstruction, setAnneeConstruction] = useState(1990);
  const [zoneInondable, setZoneInondable] = useState(false);
  const [risqueSecheresse, setRisqueSecheresse] = useState(false);
  const [risqueGlissement, setRisqueGlissement] = useState(false);
  const [proximitePollue, setProximitePollue] = useState(false);
  const [isolationRecente, setIsolationRecente] = useState(false);
  const [panneauxSolaires, setPanneauxSolaires] = useState(false);
  const [pompeAChaleur, setPompeAChaleur] = useState(false);
  const [certifications, setCertifications] = useState<string[]>([]);

  const result = useMemo(() =>
    evaluerESG({
      classeEnergie,
      anneeConstruction,
      zoneInondable,
      risqueSecheresse,
      risqueGlissementTerrain: risqueGlissement,
      proximiteSitePollue: proximitePollue,
      isolationRecente,
      panneauxSolaires,
      pompeAChaleur,
      certifications,
    }),
  [classeEnergie, anneeConstruction, zoneInondable, risqueSecheresse, risqueGlissement, proximitePollue, isolationRecente, panneauxSolaires, pompeAChaleur, certifications]);

  const scoreColor = result.score >= 60 ? "text-success" : result.score >= 40 ? "text-warning" : "text-error";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Energy performance</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Energy class (CPE)" type="select" value={classeEnergie} onChange={setClasseEnergie} options={[
              { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
              { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
            ]} />
            <InputField label="Year of construction" value={anneeConstruction} onChange={(v) => setAnneeConstruction(Number(v))} min={1800} max={2026} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Environmental risks</h2>
          <div className="space-y-3">
            <ToggleField label="Flood zone" checked={zoneInondable} onChange={setZoneInondable} />
            <ToggleField label="Drought risk (shrink-swell)" checked={risqueSecheresse} onChange={setRisqueSecheresse} />
            <ToggleField label="Landslide risk" checked={risqueGlissement} onChange={setRisqueGlissement} />
            <ToggleField label="Proximity to contaminated site" checked={proximitePollue} onChange={setProximitePollue} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Sustainable equipment</h2>
          <div className="space-y-3">
            <ToggleField label="Recent insulation (< 10 years)" checked={isolationRecente} onChange={setIsolationRecente} />
            <ToggleField label="Solar panels" checked={panneauxSolaires} onChange={setPanneauxSolaires} />
            <ToggleField label="Heat pump" checked={pompeAChaleur} onChange={setPompeAChaleur} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate mb-2">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {["BREEAM", "DGNB", "WELL", "LEED", "HQE", "Minergie"].map((cert) => (
                <button key={cert} onClick={() => setCertifications((prev) => prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert])}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${certifications.includes(cert) ? "bg-navy text-white" : "bg-background text-muted border border-card-border hover:bg-navy/5"}`}>
                  {cert}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* ESG Score */}
        <div className="rounded-2xl border border-card-border bg-card p-8 text-center shadow-sm">
          <div className="text-sm text-muted">ESG Score</div>
          <div className={`text-5xl font-bold mt-2 ${scoreColor}`}>{result.score}/100</div>
          <div className={`mt-2 text-lg font-semibold ${scoreColor}`}>Level {result.niveau} — {result.niveauLabel}</div>
          <div className="mt-3 text-sm font-medium">
            Estimated impact on value: <span className={result.impactValeur >= 0 ? "text-success" : "text-error"}>{result.impactValeur > 0 ? "+" : ""}{result.impactValeur}%</span>
          </div>
        </div>
        {/* Risks */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">Identified risks</h3>
          <div className="space-y-2">
            {result.risques.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.niveau === "eleve" ? "bg-red-100 text-red-700" : r.niveau === "moyen" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {r.niveau === "eleve" ? "high" : r.niveau === "moyen" ? "medium" : "low"}
                </span>
                <span className="text-slate">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
        {result.opportunites.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-3">Positive points</h3>
            <ul className="space-y-1 text-sm text-slate">
              {result.opportunites.map((o, i) => <li key={i}>+ {o}</li>)}
            </ul>
          </div>
        )}
        {result.recommandations.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-3">Recommendations</h3>
            <ul className="space-y-1 text-sm text-slate">
              {result.recommandations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        <div className="rounded-lg bg-navy/5 border border-navy/10 p-3">
          <p className="text-xs text-slate leading-relaxed">
            <strong>EVS 2025 / Red Book 2025:</strong> ESG factors must be considered in every valuation.
            The ESG score influences value via the green premium for high-performing assets and the brown
            discount for energy-inefficient buildings. In accordance with Article 208 of the EBA guidelines, environmental
            factors must be integrated into the valuation of real estate collateral.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB — ENERGY RESIDUAL
// ============================================================

function TabEnergie({ valeurMarcheCible, surfaceBien }: { valeurMarcheCible: number; surfaceBien: number }) {
  const [classeActuelle, setClasseActuelle] = useState("E");
  const [classeCible, setClasseCible] = useState("B");
  const [anneeConstruction, setAnneeConstruction] = useState(1985);
  const [valeurApres, setValeurApres] = useState(valeurMarcheCible);
  const [coutTravaux, setCoutTravaux] = useState(80000);
  const [honoraires, setHonoraires] = useState(8000);
  const [fraisFinancement, setFraisFinancement] = useState(3000);
  const [margePrudentielle, setMargePrudentielle] = useState(10);
  const [aidesPrevues, setAidesPrevues] = useState(40000);

  const result = useMemo(
    () =>
      calculerResiduelleEnergetique({
        classeActuelle,
        classeCible,
        valeurApresRenovation: valeurApres,
        coutTravauxRenovation: coutTravaux,
        honorairesEtudes: honoraires,
        fraisFinancement,
        margePrudentielle,
        aidesPrevues,
      }),
    [classeActuelle, classeCible, valeurApres, coutTravaux, honoraires, fraisFinancement, margePrudentielle, aidesPrevues]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Energy performance</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Current class"
              type="select"
              value={classeActuelle}
              onChange={setClasseActuelle}
              options={[
                { value: "A", label: "A — Very efficient" },
                { value: "B", label: "B — Efficient" },
                { value: "C", label: "C — Fairly efficient" },
                { value: "D", label: "D — Average" },
                { value: "E", label: "E — Poor" },
                { value: "F", label: "F — Very poor" },
                { value: "G", label: "G — Extremely poor" },
              ]}
            />
            <InputField
              label="Target class after renovation"
              type="select"
              value={classeCible}
              onChange={setClasseCible}
              options={[
                { value: "A", label: "A — Very efficient" },
                { value: "B", label: "B — Efficient" },
                { value: "C", label: "C — Fairly efficient" },
                { value: "D", label: "D — Average" },
              ]}
            />
          </div>
          <InputField
            label="Year of construction"
            value={anneeConstruction}
            onChange={(v) => setAnneeConstruction(Number(v))}
            min={1800}
            max={2026}
            className="mt-4"
            hint="To estimate renovation complexity"
          />
          <InputField
            label="Estimated value after renovation"
            value={valeurApres}
            onChange={(v) => setValeurApres(Number(v))}
            suffix="€"
            className="mt-4"
            hint="Market value if the property were at the target class"
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-navy">Renovation costs</h2>
            <button
              onClick={() => {
                const est = estimerCoutsRenovation(classeActuelle, classeCible, surfaceBien, anneeConstruction);
                if (est.totalMoyen > 0) {
                  setCoutTravaux(est.totalMoyen);
                  setHonoraires(est.honoraires);
                }
              }}
              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-navy-dark hover:bg-gold-light transition-colors"
            >
              Auto-estimate
            </button>
          </div>

          {/* Auto-estimate detail */}
          {(() => {
            const est = estimerCoutsRenovation(classeActuelle, classeCible, surfaceBien, anneeConstruction);
            if (est.postes.length === 0) return null;
            return (
              <div className="mb-4 rounded-lg bg-background border border-card-border p-3">
                <div className="text-xs font-semibold text-navy mb-2">Auto-estimate ({classeActuelle} → {classeCible}, {surfaceBien} m², {anneeConstruction})</div>
                <div className="space-y-1">
                  {est.postes.map((p) => (
                    <div key={p.label} className="flex justify-between text-xs">
                      <span className="text-muted">{p.label}</span>
                      <span className="font-mono">{formatEUR(p.coutMin)} – {formatEUR(p.coutMax)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-semibold border-t border-card-border pt-1 mt-1">
                    <span>Total works (range)</span>
                    <span className="font-mono">{formatEUR(est.totalMin)} – {formatEUR(est.totalMax)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>+ Professional fees (~10%)</span>
                    <span className="font-mono">{formatEUR(est.honoraires)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>Estimated duration</span>
                    <span>{est.dureeEstimeeMois} months</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted">Indicative ranges — Luxembourg market. Click "Auto-estimate" to pre-fill fields.</p>
              </div>
            );
          })()}

          <div className="space-y-4">
            <InputField label="Energy renovation works" value={coutTravaux} onChange={(v) => setCoutTravaux(Number(v))} suffix="€" hint="Insulation, windows, heating, ventilation..." />
            <InputField label="Professional fees and studies" value={honoraires} onChange={(v) => setHonoraires(Number(v))} suffix="€" hint="Energy audit, project management, engineering" />
            <InputField label="Financing costs" value={fraisFinancement} onChange={(v) => setFraisFinancement(Number(v))} suffix="€" hint="Interim interest if financed" />
            <InputField
              label="Contingency margin"
              value={margePrudentielle}
              onChange={(v) => setMargePrudentielle(Number(v))}
              suffix="%"
              step={1}
              hint="Adjustable — construction contingencies, unforeseen issues. Typically 5-15%."
            />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Expected subsidies</h2>
          <InputField
            label="Total estimated subsidies"
            value={aidesPrevues}
            onChange={(v) => setAidesPrevues(Number(v))}
            suffix="€"
            hint="Klimabonus, Topup, Enoprimes, municipal aids — use the aid simulator"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Energy class visual diagram */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-navy">Energy transition</h3>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white ${
                classeActuelle <= "C" ? "bg-green-500" : classeActuelle <= "E" ? "bg-amber-500" : "bg-red-500"
              }`}>
                {classeActuelle}
              </div>
              <div className="mt-1 text-xs text-muted">Current</div>
            </div>
            <svg className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <div className="text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white ${
                classeCible <= "B" ? "bg-green-500" : "bg-green-400"
              }`}>
                {classeCible}
              </div>
              <div className="mt-1 text-xs text-muted">Target</div>
            </div>
          </div>
        </div>

        <ResultPanel
          title="Energy residual approach"
          className="border-gold/30"
          lines={[
            { label: `Value after renovation (class ${classeCible})`, value: formatEUR(result.valeurApresRenovation) },
            { label: "Works + fees + financing", value: `- ${formatEUR(result.coutTotalBrut)}`, sub: true },
            { label: `Contingency margin (${margePrudentielle}%)`, value: `- ${formatEUR(result.margePrudentielleMontant)}`, sub: true },
            { label: "Gross total cost with contingency", value: `- ${formatEUR(result.coutTotalAvecMarge)}` },
            { label: "Expected subsidies", value: `+ ${formatEUR(result.aidesDeduites)}` },
            { label: "Net cost after subsidies", value: `- ${formatEUR(result.coutNetApresAides)}` },
            { label: "Residual value (current condition)", value: formatEUR(result.valeurResiduelle), highlight: true, large: true },
            { label: "Energy discount", value: `${formatEUR(result.decoteEnergetique)} (${result.decoteEnergetiquePct.toFixed(1)}%)`, warning: result.decoteEnergetiquePct > 15 },
          ]}
        />

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-navy">EVS 2025 Method</h3>
          <div className="space-y-2 text-sm text-muted leading-relaxed">
            <p>
              <strong className="text-slate">Principle:</strong> The current value of the property is derived from its
              hypothetical value once renovated, reduced by the costs needed to reach the target performance level.
            </p>
            <p>
              <strong className="text-slate">Residual value</strong> = Value after renovation - (Works costs + Professional fees
              + Financing + Contingency margin) + Public subsidies
            </p>
            <p>
              <strong className="text-slate">Art. 208 EBA:</strong> ESG factors, particularly energy performance,
              must be integrated into collateral valuation. The energy discount
              reflects the compliance cost that the buyer will have to bear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 5 — MLV / CRR
// ============================================================

function TabMLV({ valeurMarche }: { valeurMarche: number }) {
  const [decoteConj, setDecoteConj] = useState(5);
  const [decoteComm, setDecoteComm] = useState(3);
  const [decoteSpec, setDecoteSpec] = useState(2);

  const result = useMemo(
    () =>
      calculerMLV({
        valeurMarche,
        decoteConjoncturelle: decoteConj,
        decoteCommercialisation: decoteComm,
        decoteSpecifique: decoteSpec,
      }),
    [valeurMarche, decoteConj, decoteComm, decoteSpec]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Market value</h2>
          <div className="text-center py-4">
            <div className="text-sm text-muted">Market Value (EVS1)</div>
            <div className="text-3xl font-bold text-navy mt-1">{formatEUR(valeurMarche)}</div>
            <p className="text-xs text-muted mt-2">From reconciliation or direct entry</p>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Prudential discounts (bank safety margin)</h2>
          <div className="space-y-4">
            <InputField
              label="Market cycle discount"
              value={decoteConj}
              onChange={(v) => setDecoteConj(Number(v))}
              suffix="%"
              step={0.5}
              hint="Adjustable — prudence margin relative to current market conditions (exclude speculative elements)"
            />
            <InputField
              label="Marketing discount"
              value={decoteComm}
              onChange={(v) => setDecoteComm(Number(v))}
              suffix="%"
              step={0.5}
              hint="Adjustable — liquidity risk / time to sell"
            />
            <InputField
              label="Specific discount"
              value={decoteSpec}
              onChange={(v) => setDecoteSpec(Number(v))}
              suffix="%"
              step={0.5}
              hint="Adjustable — risks specific to the property (condition, secondary location, etc.)"
            />
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Mortgage Lending Value (MLV) (CRR Art. 229 / EVS3 Standard):</strong> The MLV is the value
              retained by the bank as loan collateral. It must reflect the long-term sustainable value, excluding
              speculative elements and exceptional market conditions.
              The valuer must document and justify each discount. There is no fixed regulatory rate — the discounts
              are professional judgements.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ResultPanel
          title="Mortgage Lending Value (MLV)"
          className="border-gold/30"
          lines={[
            { label: "Market value (MV)", value: formatEUR(result.valeurMarche) },
            { label: `Market cycle discount (${decoteConj}%)`, value: `- ${formatEUR(result.valeurMarche * decoteConj / 100)}`, sub: true },
            { label: `Marketing discount (${decoteComm}%)`, value: `- ${formatEUR(result.valeurMarche * decoteComm / 100)}`, sub: true },
            { label: `Specific discount (${decoteSpec}%)`, value: `- ${formatEUR(result.valeurMarche * decoteSpec / 100)}`, sub: true },
            { label: "Total discounts", value: `- ${formatEUR(result.totalDecotes)} (${result.totalDecotesPct.toFixed(1)}%)` },
            { label: "MLV", value: formatEUR(result.mlv), highlight: true, large: true },
            { label: "MLV / Market value ratio", value: `${(result.ratioMLVsurMV * 100).toFixed(1)}%`, sub: true },
          ]}
        />

        {/* CRR Risk Weight bands */}
        <div className="rounded-xl border border-card-border bg-card shadow-sm">
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-base font-semibold text-navy">CRR2 risk weights — Art. 125 (residential)</h3>
            <p className="text-xs text-muted mt-1">Maximum loan amounts per LTV band, based on MLV</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-card-border bg-background">
                <th className="px-4 py-2 text-left font-semibold text-navy">LTV band</th>
                <th className="px-4 py-2 text-right font-semibold text-navy">Risk Weight</th>
                <th className="px-4 py-2 text-right font-semibold text-navy">Max loan</th>
              </tr>
            </thead>
            <tbody>
              {result.ltvBands.filter(b => b.ltvMax <= 1.0).map((band) => (
                <tr key={band.label} className="border-b border-card-border/50">
                  <td className="px-4 py-2">{band.label}</td>
                  <td className="px-4 py-2 text-right font-mono">{(band.riskWeight * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(band.montantMaxPret)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 5 — RECONCILIATION
// ============================================================

function TabReconciliation({
  valeurComparaison,
  valeurCapitalisation,
  valeurDCF,
  selectedCommune,
  assetType,
  evsInfo,
  surfaceBien,
}: {
  valeurComparaison: number;
  valeurCapitalisation: number;
  valeurDCF: number;
  selectedCommune: MarketDataCommune | null;
  assetType: string;
  evsInfo: { label: string };
  surfaceBien: number;
}) {
  const [poidsComp, setPoidsComp] = useState(50);
  const [poidsCap, setPoidsCap] = useState(25);
  const [poidsDCF, setPoidsDCF] = useState(25);

  // Scenarios: adjustment in % on each value
  const [scenarioHautPct, setScenarioHautPct] = useState(10);
  const [scenarioBasPct, setScenarioBasPct] = useState(10);

  const makeReconc = useCallback((compAdj: number, capAdj: number, dcfAdj: number) => {
    return reconcilier({
      valeurComparaison: valeurComparaison ? valeurComparaison * (1 + compAdj / 100) : undefined,
      poidsComparaison: poidsComp,
      valeurCapitalisation: valeurCapitalisation ? valeurCapitalisation * (1 + capAdj / 100) : undefined,
      poidsCapitalisation: poidsCap,
      valeurDCF: valeurDCF ? valeurDCF * (1 + dcfAdj / 100) : undefined,
      poidsDCF,
    });
  }, [valeurComparaison, valeurCapitalisation, valeurDCF, poidsComp, poidsCap, poidsDCF]);

  const resultBase = useMemo(() => makeReconc(0, 0, 0), [makeReconc]);
  const resultHaut = useMemo(() => makeReconc(scenarioHautPct, scenarioHautPct, scenarioHautPct), [makeReconc, scenarioHautPct]);
  const resultBas = useMemo(() => makeReconc(-scenarioBasPct, -scenarioBasPct, -scenarioBasPct), [makeReconc, scenarioBasPct]);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Weights */}
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Values by method and weighting</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">Comparison</div>
                  <div className="text-lg font-bold text-navy">{valeurComparaison ? formatEUR(valeurComparaison) : "—"}</div>
                </div>
                <InputField label="Weight" value={poidsComp} onChange={(v) => setPoidsComp(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">Capitalisation</div>
                  <div className="text-lg font-bold text-navy">{valeurCapitalisation ? formatEUR(valeurCapitalisation) : "—"}</div>
                </div>
                <InputField label="Weight" value={poidsCap} onChange={(v) => setPoidsCap(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">DCF</div>
                  <div className="text-lg font-bold text-navy">{valeurDCF ? formatEUR(valeurDCF) : "—"}</div>
                </div>
                <InputField label="Weight" value={poidsDCF} onChange={(v) => setPoidsDCF(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
            </div>
          </div>

          {/* Scenario parameters */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Scenarios</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Upside scenario (+%)" value={scenarioHautPct} onChange={(v) => setScenarioHautPct(Number(v))} suffix="%" min={1} max={30} hint="Optimistic assumption" />
              <InputField label="Downside scenario (-%)" value={scenarioBasPct} onChange={(v) => setScenarioBasPct(Number(v))} suffix="%" min={1} max={30} hint="Prudent assumption" />
            </div>
            <p className="mt-2 text-xs text-muted">Applies a uniform adjustment to the values from each method before reconciliation.</p>
          </div>
        </div>

        {/* Base result */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-gold/40 bg-gradient-to-br from-card to-gold/5 p-8 shadow-sm text-center">
            <div className="text-sm text-muted uppercase tracking-wider">Reconciled Market Value</div>
            <div className="mt-2 text-4xl font-bold text-navy">{formatEUR(resultBase.valeurReconciliee)}</div>
            <div className="mt-2 text-sm text-muted">Central scenario — EVS1</div>
          </div>

          <ResultPanel
            title="Quality control"
            lines={[
              { label: "Max gap between methods", value: `${resultBase.ecartMaxPct.toFixed(1)}%`, warning: resultBase.ecartMaxPct > 20 },
              { label: "Standard deviation", value: formatEUR(resultBase.ecartType), sub: true },
              ...(resultBase.ecartMaxPct > 20 ? [{ label: "Alert", value: "Gap > 20% — analyse divergences", warning: true }] : []),
            ]}
          />
        </div>
      </div>

      {/* 3-scenario comparison table */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy"></th>
              <th className="px-4 py-3 text-center font-semibold text-error">Downside (-{scenarioBasPct}%)</th>
              <th className="px-4 py-3 text-center font-semibold text-navy bg-navy/5">Central scenario</th>
              <th className="px-4 py-3 text-center font-semibold text-success">Upside (+{scenarioHautPct}%)</th>
            </tr>
          </thead>
          <tbody>
            {valeurComparaison > 0 && (
              <tr className="border-b border-card-border/50">
                <td className="px-4 py-2 text-muted">Comparison</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurComparaison * (1 - scenarioBasPct / 100))}</td>
                <td className="px-4 py-2 text-center font-mono bg-navy/5 font-semibold">{formatEUR(valeurComparaison)}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurComparaison * (1 + scenarioHautPct / 100))}</td>
              </tr>
            )}
            {valeurCapitalisation > 0 && (
              <tr className="border-b border-card-border/50">
                <td className="px-4 py-2 text-muted">Capitalisation</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurCapitalisation * (1 - scenarioBasPct / 100))}</td>
                <td className="px-4 py-2 text-center font-mono bg-navy/5 font-semibold">{formatEUR(valeurCapitalisation)}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurCapitalisation * (1 + scenarioHautPct / 100))}</td>
              </tr>
            )}
            {valeurDCF > 0 && (
              <tr className="border-b border-card-border/50">
                <td className="px-4 py-2 text-muted">DCF</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurDCF * (1 - scenarioBasPct / 100))}</td>
                <td className="px-4 py-2 text-center font-mono bg-navy/5 font-semibold">{formatEUR(valeurDCF)}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurDCF * (1 + scenarioHautPct / 100))}</td>
              </tr>
            )}
            <tr className="bg-background font-semibold">
              <td className="px-4 py-3 text-navy">Reconciled value</td>
              <td className="px-4 py-3 text-center font-mono text-error text-lg">{formatEUR(resultBas.valeurReconciliee)}</td>
              <td className="px-4 py-3 text-center font-mono text-navy text-lg bg-navy/5">{formatEUR(resultBase.valeurReconciliee)}</td>
              <td className="px-4 py-3 text-center font-mono text-success text-lg">{formatEUR(resultHaut.valeurReconciliee)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Scenario analysis:</strong> The upside and downside scenarios apply a uniform adjustment
          to the values from each method. In practice, variations may be asymmetric
          (e.g. cap rate +50bps in the downside but comparison only -5%). For a more
          detailed analysis, use the sensitivity matrices in each method tab.
        </p>
      </div>

      {/* Narrative text */}
      {(valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-4">Narrative analysis</h3>
          <div className="prose prose-sm text-slate leading-relaxed space-y-3">
            {genererNarrative({
              commune: selectedCommune?.commune,
              assetType,
              evsType: evsInfo.label,
              surface: surfaceBien,
              valeurComparaison: valeurComparaison || undefined,
              valeurCapitalisation: valeurCapitalisation || undefined,
              valeurDCF: valeurDCF || undefined,
              valeurReconciliee: resultBase.valeurReconciliee || undefined,
              prixM2Commune: selectedCommune?.prixM2Existant || undefined,
              nbTransactions: selectedCommune?.nbTransactions || undefined,
            }).split("\n\n").map((para, i) => (
              <p key={i} className="text-sm">{para.split(/\*\*(.+?)\*\*/g).map((seg, j) => j % 2 === 1 ? <strong key={j}>{seg}</strong> : seg)}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function Valorisation() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("comparaison");
  const [surfaceBien, setSurfaceBien] = useState(80);
  const [assetType, setAssetType] = useState<AssetType>("residential_apartment");
  const [evsValueType, setEvsValueType] = useState<EVSValueType>("market_value");

  // Municipality search — global state (persists between tabs)
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);
  const selectedCommune = selectedResult?.commune ?? null;

  // Comparables — global state (persists between tabs)
  const [comparables, setComparables] = useState<Comparable[]>([]);

  const assetConfig = useMemo(() => getAssetTypeConfig(assetType), [assetType]);
  const evsInfo = useMemo(() => EVS_VALUE_TYPES.find((e) => e.id === evsValueType)!, [evsValueType]);

  // Values reported by each tab
  const [valeurComparaison, setValeurComparaison] = useState(0);
  const [valeurCapitalisation, setValeurCapitalisation] = useState(0);
  const [valeurDCF, setValeurDCF] = useState(0);

  // Stable callback refs
  const onValeurComp = useCallback((v: number) => setValeurComparaison(v), []);
  const onValeurCap = useCallback((v: number) => setValeurCapitalisation(v), []);
  const onValeurDCF = useCallback((v: number) => setValeurDCF(v), []);

  // Market value for MLV (takes reconciled or best available)
  const valeurMarchePourMLV = valeurComparaison || valeurCapitalisation || valeurDCF || 750000;

  // Full reset
  const handleReset = useCallback(() => {
    setCommuneSearch("");
    setSelectedResult(null);
    setComparables([]);
    setValeurComparaison(0);
    setValeurCapitalisation(0);
    setValeurDCF(0);
  }, []);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              Property Valuation
            </h1>
            <span className="rounded-full bg-navy/10 px-3 py-0.5 text-xs font-semibold text-navy">
              EVS 2025
            </span>
          </div>
          <p className="mt-2 text-muted">
            Compliant with TEGOVA European Valuation Standards 2025 (10th edition)
          </p>
        </div>

        {/* Asset type + EVS value basis + Area */}
        <div className="mb-6 space-y-4">
          {/* Asset type selector */}
          <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {ASSET_TYPES.map((at) => (
                <button
                  key={at.id}
                  onClick={() => setAssetType(at.id)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    assetType === at.id
                      ? "bg-navy text-white shadow-sm"
                      : "bg-background text-muted hover:bg-navy/5 hover:text-navy"
                  }`}
                >
                  {at.label}
                </button>
              ))}
            </div>
          </div>

          {/* EVS value type + asset context */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <InputField
                label="Basis of value (EVS 2025)"
                type="select"
                value={evsValueType}
                onChange={(v) => setEvsValueType(v as EVSValueType)}
                options={EVS_VALUE_TYPES.map((e) => ({ value: e.id, label: `${e.evs} — ${e.label}` }))}
              />
              <p className="mt-2 text-xs text-muted leading-relaxed">{evsInfo.description}</p>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <InputField
                label="Property area"
                value={surfaceBien}
                onChange={(v) => setSurfaceBien(Number(v))}
                suffix="m²"
              />
              <div className="mt-3 text-xs text-muted">
                <div className="font-medium text-slate mb-1">Recommended methods:</div>
                {assetConfig.recommendedMethods.map((m, i) => (
                  <div key={i}>• {m}</div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-slate mb-2">Reference parameters — {assetConfig.label}</div>
              <div className="space-y-1 text-xs text-muted">
                <div className="flex justify-between"><span>Capitalisation rate</span><span className="font-mono">{assetConfig.defaults.capRateMin}–{assetConfig.defaults.capRateMax}%</span></div>
                <div className="flex justify-between"><span>Void rate</span><span className="font-mono">{assetConfig.defaults.vacancyRate}%</span></div>
                <div className="flex justify-between"><span>Discount rate</span><span className="font-mono">{assetConfig.defaults.discountRateDefault}%</span></div>
                <div className="flex justify-between"><span>Exit yield (resale)</span><span className="font-mono">{assetConfig.defaults.exitCapDefault}%</span></div>
                <div className="flex justify-between"><span>MLV discounts</span><span className="font-mono">{assetConfig.defaults.mlvConjoncturelleDefault + assetConfig.defaults.mlvCommercialisationDefault + assetConfig.defaults.mlvSpecifiqueDefault}%</span></div>
              </div>
              {assetConfig.specificMetrics.length > 0 && (
                <div className="mt-2 pt-2 border-t border-card-border text-xs text-muted">
                  <span className="font-medium text-slate">Key metrics: </span>
                  {assetConfig.specificMetrics.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Asset type notes */}
          <div className="rounded-lg bg-navy/5 border border-navy/10 px-4 py-3">
            <p className="text-xs text-slate leading-relaxed">{assetConfig.notes}</p>
          </div>

          {/* Persistent summary: municipality + values + reset */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {selectedCommune && (
              <div className="rounded-lg bg-navy/5 border border-navy/10 px-3 py-2">
                <span className="text-muted">Municipality:</span>{" "}
                <span className="font-semibold text-navy">{selectedCommune.commune}</span>
                {selectedResult?.isLocalite && <span className="text-muted"> ({selectedResult.matchedOn})</span>}
                {selectedCommune.prixM2Existant && <span className="ml-2 font-mono text-xs text-muted">{formatEUR(selectedCommune.prixM2Existant)}/m²</span>}
              </div>
            )}
            {valeurComparaison > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">Comparison:</span> <span className="font-semibold text-navy">{formatEUR(valeurComparaison)}</span></div>
            )}
            {valeurCapitalisation > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">Capitalisation:</span> <span className="font-semibold text-navy">{formatEUR(valeurCapitalisation)}</span></div>
            )}
            {valeurDCF > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">DCF:</span> <span className="font-semibold text-navy">{formatEUR(valeurDCF)}</span></div>
            )}
            {(valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
              <button
                onClick={() => downloadReport({
                  dateRapport: new Date().toISOString().split("T")[0],
                  commune: selectedCommune?.commune,
                  assetType: assetConfig.label,
                  evsType: evsInfo.label,
                  surface: surfaceBien,
                  valeurComparaison: valeurComparaison || undefined,
                  valeurCapitalisation: valeurCapitalisation || undefined,
                  valeurDCF: valeurDCF || undefined,
                })}
                className="rounded-lg bg-gold px-3 py-2 text-xs font-medium text-navy-dark hover:bg-gold-light transition-colors"
              >
                PDF Report
              </button>
            )}
            {(selectedCommune || comparables.length > 0 || valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-error/30 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* EVS Checklist */}
        {(() => {
          const check = evaluerChecklist({
            communeSelectionnee: !!selectedCommune,
            surfaceRenseignee: surfaceBien > 0,
            assetTypeSelectionne: true,
            evsTypeSelectionne: true,
            comparaisonFaite: valeurComparaison > 0,
            nbComparables: comparables.length,
            capitalisationFaite: valeurCapitalisation > 0,
            dcfFait: valeurDCF > 0,
            esgEvalue: false,
            classeEnergieRenseignee: false,
            donnesMarcheConsultees: !!selectedCommune,
            reconciliationFaite: valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0,
            scenariosAnalyses: false,
            narrativeGeneree: valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0,
            mlvCalculee: false,
          });
          const score = scoreChecklist(check);
          if (score.remplis === 0) return null;
          return (
            <div className="mb-4 rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-navy">EVS 2025 Compliance</div>
                <div className={`text-xs font-bold ${score.pctCompletion >= 80 ? "text-success" : score.pctCompletion >= 50 ? "text-warning" : "text-error"}`}>
                  {score.remplis}/{score.total} ({score.pctCompletion.toFixed(0)}%)
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${score.pctCompletion >= 80 ? "bg-success" : score.pctCompletion >= 50 ? "bg-warning" : "bg-error"}`}
                  style={{ width: `${score.pctCompletion}%` }}
                />
              </div>
              {score.obligatoiresManquants.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {score.obligatoiresManquants.map((item) => (
                    <span key={item.id} className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-700">{item.label}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "comparaison" && (
          <TabComparaison
            surfaceBien={surfaceBien}
            onValeur={onValeurComp}
            assetType={assetType}
            communeSearch={communeSearch}
            setCommuneSearch={setCommuneSearch}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            searchResults={searchResults}
            selectedCommune={selectedCommune}
            comparables={comparables}
            setComparables={setComparables}
          />
        )}
        {activeTab === "capitalisation" && <TabCapitalisation onValeur={onValeurCap} />}
        {activeTab === "terme_reversion" && <TabTermeReversion onValeur={onValeurCap} />}
        {activeTab === "dcf" && <TabDCF onValeur={onValeurDCF} />}
        {activeTab === "esg" && <TabESG />}
        {activeTab === "energie" && <TabEnergie valeurMarcheCible={valeurMarchePourMLV} surfaceBien={surfaceBien} />}
        {activeTab === "mlv" && <TabMLV valeurMarche={valeurMarchePourMLV} />}
        {activeTab === "reconciliation" && (
          <TabReconciliation
            valeurComparaison={valeurComparaison}
            valeurCapitalisation={valeurCapitalisation}
            valeurDCF={valeurDCF}
            selectedCommune={selectedCommune}
            assetType={assetConfig.label}
            evsInfo={evsInfo}
            surfaceBien={surfaceBien}
          />
        )}
      </div>
    </div>
  );
}
