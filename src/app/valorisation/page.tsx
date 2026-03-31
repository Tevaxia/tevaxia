"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  { id: "comparaison", label: "Comparaison" },
  { id: "capitalisation", label: "Capitalisation" },
  { id: "terme_reversion", label: "Terme & Réversion" },
  { id: "dcf", label: "Flux actualisés" },
  { id: "esg", label: "ESG" },
  { id: "energie", label: "Résiduelle énergie" },
  { id: "mlv", label: "Valeur hypothécaire" },
  { id: "reconciliation", label: "Réconciliation" },
];

// ============================================================
// TAB 1 — COMPARAISON
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

  // Auto-suggest comparables when commune is selected and none exist
  useEffect(() => {
    if (selectedCommune && comparables.length === 0) {
      const suggested = suggestComparables(selectedCommune.commune, 4);
      if (suggested.length > 0) {
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
      }
    }
  }, [selectedCommune]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Références de marché — données publiques */}
      <div className="rounded-xl border-2 border-navy/20 bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy mb-1">Références de marché par commune</h2>
        <p className="text-xs text-muted mb-4">Source : Observatoire de l'Habitat / Publicité Foncière (actes notariés) — données ouvertes CC0</p>

        <div className="relative">
          <input
            type="text"
            value={communeSearch}
            onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
            placeholder="Rechercher une commune ou localité (ex: Bourglinster, Kirchberg, Howald...)"
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
                      <span className="text-muted ml-1">— {r.quartier ? "quartier de" : "commune de"} {r.commune.commune}</span>
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
                <span className="font-medium text-slate">{selectedResult.matchedOn}</span> — {selectedResult.quartier ? "quartier de" : "commune de"} <span className="font-medium text-slate">{selectedCommune.commune}</span> ({selectedCommune.canton}).
                {selectedResult.quartier && (
                  <span className="ml-1 text-slate">{selectedResult.quartier.note}</span>
                )}
              </p>
            )}

            {/* Prix quartier spécifique si dispo */}
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
                      <div className="text-xs text-muted">Loyer : {selectedResult.quartier.loyerM2.toFixed(1)} €/m²/mois</div>
                    )}
                    <div className={`text-xs font-medium ${selectedResult.quartier.tendance === "hausse" ? "text-success" : selectedResult.quartier.tendance === "baisse" ? "text-error" : "text-muted"}`}>
                      Tendance : {selectedResult.quartier.tendance}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">Prix /m² transactions</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2Existant ? formatEUR(selectedCommune.prixM2Existant) : "—"}</div>
              <div className="text-[10px] text-muted">Existant — actes notariés</div>
            </div>
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">Prix /m² VEFA</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2VEFA ? formatEUR(selectedCommune.prixM2VEFA) : "—"}</div>
              <div className="text-[10px] text-muted">Neuf — actes notariés</div>
            </div>
            <div className="rounded-lg bg-gold/10 p-3 text-center">
              <div className="text-xs text-muted">Prix /m² annonces</div>
              <div className="text-lg font-bold text-gold-dark">{selectedCommune.prixM2Annonces ? formatEUR(selectedCommune.prixM2Annonces) : "—"}</div>
              <div className="text-[10px] text-muted">Annonces — données agrégées</div>
            </div>
            <div className="rounded-lg bg-teal/10 p-3 text-center">
              <div className="text-xs text-muted">Loyer /m²/mois</div>
              <div className="text-lg font-bold text-teal">{selectedCommune.loyerM2Annonces ? `${selectedCommune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
              <div className="text-[10px] text-muted">Annonces — données agrégées</div>
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

        {/* Grille quartiers si disponible */}
        {selectedCommune?.quartiers && selectedCommune.quartiers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-navy mb-2">Prix par quartier — {selectedCommune.commune}</h3>
            <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Quartier</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">€/m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Loyer/m²</th>
                    <th className="px-3 py-2 text-center font-semibold text-navy">Tendance</th>
                    <th className="px-3 py-2 text-left font-semibold text-navy">Caractéristique</th>
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
                        }`}>{qr.tendance}</span>
                      </td>
                      <td className="px-3 py-1.5 text-muted">{qr.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[10px] text-muted">Source : Observatoire de l'Habitat — prix annoncés par quartier. Données indicatives, triées par prix décroissant.</p>
          </div>
        )}
      </div>

      {/* Données marché par segment (non-résidentiel) */}
      {assetType !== "residential_apartment" && (
        <MarketDataPanel assetType={assetType} />
      )}

      {/* Sources de données */}
      <div className="rounded-lg border border-card-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-navy mb-2">Sources de données ouvertes</h3>
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

      {/* Comparables — saisie manuelle */}
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-navy">Comparables</h2>
            <p className="text-xs text-muted">Saisissez vos références de transactions réelles</p>
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
                Suggérer des comparables
              </button>
            )}
            <button
              onClick={addComp}
              className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors"
            >
              + Ajouter
            </button>
          </div>
        </div>

        {comparables.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-card-border py-8 text-center">
            <p className="text-sm text-muted">Aucun comparable saisi</p>
            <p className="text-xs text-muted mt-1">{selectedCommune ? "Cliquez \"Suggérer\" ou ajoutez manuellement" : "Sélectionnez une commune puis ajoutez des comparables"}</p>
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
                  Suggérer des comparables
                </button>
              )}
              <button onClick={addComp} className="rounded-lg bg-navy/10 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/20 transition-colors">
                + Ajouter manuellement
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
                  Supprimer
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InputField label="Adresse" type="text" value={comp.adresse} onChange={(v) => updateComp(i, "adresse", v)} className="sm:col-span-3" />
                <InputField label="Prix de vente" value={comp.prixVente} onChange={(v) => updateComp(i, "prixVente", v)} suffix="€" />
                <InputField label="Surface" value={comp.surface} onChange={(v) => updateComp(i, "surface", v)} suffix="m²" />
                <InputField label="Date vente" type="text" value={comp.dateVente} onChange={(v) => updateComp(i, "dateVente", v)} hint="AAAA-MM" />
              </div>

              {/* Ajustements avec guides statistiques */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-navy">Ajustements</span>
                  <span className="text-[10px] text-muted">Cliquez sur une suggestion pour appliquer la valeur</span>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {/* Localisation */}
                  <div className="flex gap-2">
                    <InputField label="Localisation" value={comp.ajustLocalisation} onChange={(v) => updateComp(i, "ajustLocalisation", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="localisation" currentValue={comp.ajustLocalisation} onApply={(v) => updateComp(i, "ajustLocalisation", v)} />
                  </div>

                  {/* État */}
                  <div className="flex gap-2">
                    <InputField label="État" value={comp.ajustEtat} onChange={(v) => updateComp(i, "ajustEtat", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etat" currentValue={comp.ajustEtat} onApply={(v) => updateComp(i, "ajustEtat", v)} />
                  </div>

                  {/* Étage */}
                  <div className="flex gap-2">
                    <InputField label="Étage / Vue" value={comp.ajustEtage} onChange={(v) => updateComp(i, "ajustEtage", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etage" currentValue={comp.ajustEtage} onApply={(v) => updateComp(i, "ajustEtage", v)} />
                  </div>

                  {/* Extérieur */}
                  <div className="flex gap-2">
                    <InputField label="Extérieur" value={comp.ajustExterieur} onChange={(v) => updateComp(i, "ajustExterieur", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="exterieur" currentValue={comp.ajustExterieur} onApply={(v) => updateComp(i, "ajustExterieur", v)} />
                  </div>

                  {/* Parking */}
                  <div className="flex gap-2">
                    <InputField label="Parking" value={comp.ajustParking} onChange={(v) => updateComp(i, "ajustParking", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="parking" currentValue={comp.ajustParking} onApply={(v) => updateComp(i, "ajustParking", v)} />
                  </div>

                  {/* Date — avec auto-calcul STATEC */}
                  <div className="flex gap-2">
                    <InputField label="Date (index.)" value={comp.ajustDate} onChange={(v) => updateComp(i, "ajustDate", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="date" currentValue={comp.ajustDate} onApply={(v) => updateComp(i, "ajustDate", v)} dateVente={comp.dateVente} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <InputField label="Autre ajustement" value={comp.ajustAutre} onChange={(v) => updateComp(i, "ajustAutre", v)} suffix="%" step={0.5} hint="Libre — justifier" />
                  <InputField label="Poids" value={comp.poids} onChange={(v) => updateComp(i, "poids", v)} suffix="%" min={0} max={100} hint="Pondération dans la moyenne" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Résultats — seulement si des comparables sont saisis */}
      {result && result.comparables.length > 0 && (
        <>
          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  <th className="px-3 py-2.5 text-left font-semibold text-navy">Comp.</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">€/m² brut</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">Ajust. total</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">€/m² ajusté</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">Poids</th>
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
            title="Valeur par comparaison"
            lines={[
              { label: "Prix moyen ajusté /m²", value: formatEUR(result.prixM2Moyen), sub: true },
              { label: "Prix moyen pondéré /m²", value: formatEUR(result.prixM2MoyenPondere) },
              { label: "Surface du bien", value: `${surfaceBien} m²`, sub: true },
              { label: "Valeur estimée (pondérée)", value: formatEUR(result.valeurEstimeePonderee), highlight: true, large: true },
            ]}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// TAB 2 — CAPITALISATION DIRECTE
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
          <h2 className="mb-4 text-base font-semibold text-navy">Revenus</h2>
          <div className="space-y-4">
            <InputField label="Loyer brut annuel" value={loyerBrut} onChange={(v) => setLoyerBrut(Number(v))} suffix="€" hint={`${formatEUR2(loyerBrut / 12)} /mois`} />
            <InputField label="Taux de vacance" value={tauxVacance} onChange={(v) => setTauxVacance(Number(v))} suffix="%" step={0.5} hint="Configurable — dépend du marché local et du type de bien" />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Charges propriétaire</h2>
          <div className="space-y-4">
            <InputField label="Charges non récupérables" value={chargesNonRecup} onChange={(v) => setChargesNonRecup(Number(v))} suffix="€/an" />
            <InputField label="Provision gros entretien" value={provisionEntretien} onChange={(v) => setProvisionEntretien(Number(v))} suffix="% loyer" step={0.5} />
            <InputField label="Assurance PNO" value={assurancePNO} onChange={(v) => setAssurancePNO(Number(v))} suffix="€/an" />
            <InputField label="Frais de gestion" value={fraisGestion} onChange={(v) => setFraisGestion(Number(v))} suffix="% loyer" step={0.5} />
            <InputField label="Impôt foncier" value={taxeFonciere} onChange={(v) => setTaxeFonciere(Number(v))} suffix="€/an" hint="Très faible au Luxembourg vs France" />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Valeur locative de marché (optionnel)</h2>
          <InputField
            label="Loyer de marché annuel (ERV)"
            value={ervAnnuel}
            onChange={(v) => setErvAnnuel(Number(v))}
            suffix="€"
            hint="Si différent du loyer en place — permet de calculer le rendement réversionnaire et le potentiel de réversion"
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Taux de capitalisation</h2>
          <InputField
            label="Taux de capitalisation"
            value={tauxCap}
            onChange={(v) => setTauxCap(Number(v))}
            suffix="%"
            step={0.1}
            hint="Configurable — paramètre subjectif, dépend du marché, de la localisation et du risque"
          />
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Taux de capitalisation :</strong> Pas de valeur universelle. Au Luxembourg, les taux
              résidentiels se situent entre 3% (prime, Luxembourg-Ville) et 5,5% (secondaire, nord).
              Le choix du taux impacte fortement la valeur — un écart de 0,5% peut représenter
              +15% de valeur. Justifier systématiquement.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ResultPanel
          title="Résultat net d'exploitation (NOI)"
          lines={[
            { label: "Loyer brut annuel", value: formatEUR(loyerBrut) },
            { label: `Vacance (${tauxVacance}%)`, value: `- ${formatEUR(loyerBrut * tauxVacance / 100)}`, sub: true },
            { label: "Loyer brut effectif", value: formatEUR(result.loyerBrutEffectif) },
            { label: "Charges propriétaire", value: `- ${formatEUR(result.totalCharges)}` },
            { label: "Résultat net d'exploitation", value: formatEUR(result.noi), highlight: true, large: true },
          ]}
        />

        <ResultPanel
          title="Valeur par capitalisation"
          className="border-gold/30"
          lines={[
            { label: "Résultat net / Taux capitalisation", value: `${formatEUR(result.noi)} / ${tauxCap}%`, sub: true },
            { label: "Valeur estimée", value: formatEUR(result.valeur), highlight: true, large: true },
            { label: "Rendement initial (loyer en place)", value: formatPct(result.rendementInitial) },
            { label: "Rendement brut", value: formatPct(result.rendementBrut), sub: true },
            { label: "Rendement net", value: formatPct(result.rendementNet), sub: true },
            ...(result.rendementReversionnaire !== undefined ? [
              { label: "Rendement réversionnaire (loyer de marché)", value: formatPct(result.rendementReversionnaire) },
              { label: result.sousLoue ? "Sous-loué — potentiel de réversion" : "Sur-loué — risque de réversion", value: `${result.potentielReversion ? (result.potentielReversion > 0 ? "+" : "") + result.potentielReversion.toFixed(1) + "%" : "0%"}`, warning: !result.sousLoue },
            ] : []),
          ]}
        />

        {/* Sensibilité au taux de capitalisation */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-navy">Analyse de sensibilité — Taux de capitalisation</h3>
          <div className="space-y-1">
            {result.sensibilite.map((s) => {
              const isActive = Math.abs(s.tauxCap - tauxCap) < 0.01;
              return (
                <div key={s.tauxCap} className={`flex justify-between py-1.5 px-2 rounded text-sm ${isActive ? "bg-navy/5 font-semibold" : ""}`}>
                  <span className="text-muted">Taux {s.tauxCap.toFixed(2)}%</span>
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
              <InputField label="Loyer annuel initial" value={loyerInitial} onChange={(v) => setLoyerInitial(Number(v))} suffix="€" />
              <InputField label="Indexation annuelle" value={tauxIndex} onChange={(v) => setTauxIndex(Number(v))} suffix="%" step={0.1} hint="Configurable — croissance prévue des loyers" />
              <InputField label="Taux de vacance" value={tauxVacance} onChange={(v) => setTauxVacance(Number(v))} suffix="%" step={0.5} />
              <InputField label="Charges propriétaire (année 1)" value={chargesAnnuelles} onChange={(v) => setChargesAnnuelles(Number(v))} suffix="€" />
              <InputField label="Progression annuelle charges" value={progressionCharges} onChange={(v) => setProgressionCharges(Number(v))} suffix="%" step={0.1} />
              <InputField label="Période d'analyse" value={periodeAnalyse} onChange={(v) => setPeriodeAnalyse(Number(v))} suffix="ans" min={5} max={20} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Taux d'actualisation & sortie</h2>
            <div className="space-y-4">
              <InputField
                label="Taux d'actualisation"
                value={tauxActu}
                onChange={(v) => setTauxActu(Number(v))}
                suffix="%"
                step={0.1}
                hint="Configurable — coût d'opportunité du capital, intègre la prime de risque"
              />
              <InputField
                label="Taux de capitalisation de sortie"
                value={tauxCapSortie}
                onChange={(v) => setTauxCapSortie(Number(v))}
                suffix="%"
                step={0.1}
                hint="Configurable — généralement ≥ cap rate d'entrée pour refléter le vieillissement"
              />
              <InputField label="Frais de cession" value={fraisCession} onChange={(v) => setFraisCession(Number(v))} suffix="%" hint="Droits, notaire, agence (~7% au Luxembourg)" />
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Taux d'actualisation et taux de sortie :</strong> Ces deux paramètres sont les plus sensibles du modèle.
                Le taux d'actualisation reflète le rendement attendu par l'investisseur (taux sans risque + prime de risque immobilier).
                Le taux de sortie sert à estimer la valeur de revente en fin de période — il est généralement supérieur au taux de capitalisation d'entrée pour refléter le vieillissement du bien.
                Un écart de 0,5% sur l'un ou l'autre peut modifier la valeur de 10-15%.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ResultPanel
            title="Valeur DCF"
            className="border-gold/30"
            lines={[
              { label: "Revenus nets actualisés (cumul)", value: formatEUR(result.totalNOIActualise) },
              { label: `Revenu net année ${periodeAnalyse + 1} (projection)`, value: formatEUR(result.noiTerminal), sub: true },
              { label: "Valeur de revente estimée (brute)", value: formatEUR(result.valeurTerminaleBrute), sub: true },
              { label: `Frais de cession (${fraisCession}%)`, value: `- ${formatEUR(result.fraisCession)}`, sub: true },
              { label: "Valeur de revente nette", value: formatEUR(result.valeurTerminaleNette), sub: true },
              { label: "Valeur de revente actualisée", value: formatEUR(result.valeurTerminaleActualisee) },
              { label: "Valeur DCF", value: formatEUR(result.valeurDCF), highlight: true, large: true },
              { label: "Taux de rendement interne (TRI/IRR)", value: `${(result.irr * 100).toFixed(2)} %`, highlight: true },
            ]}
          />

          {/* Matrice de sensibilité DCF */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">Sensibilité — Taux d'actualisation × Taux de sortie</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="px-2 py-1.5 text-left text-navy">Actu. \ Sortie</th>
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
            <p className="mt-2 text-[10px] text-muted">La case en surbrillance correspond aux paramètres actuels. Variation de ±0,5%.</p>
          </div>

          {/* Proportion cash flows vs terminal */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">Décomposition de la valeur</h3>
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
              <span>Revenus nets : {result.valeurDCF > 0 ? ((result.totalNOIActualise / result.valeurDCF) * 100).toFixed(0) : 0}%</span>
              <span>Valeur de revente : {result.valeurDCF > 0 ? ((result.valeurTerminaleActualisee / result.valeurDCF) * 100).toFixed(0) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des cash flows */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-3 py-2.5 text-left font-semibold text-navy">Année</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Loyer brut</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Vacance</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Charges</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Revenu net</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Facteur actu.</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">Revenu actualisé</th>
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
// TAB — TERME & RÉVERSION
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
          <h2 className="mb-4 text-base font-semibold text-navy">Revenus</h2>
          <div className="space-y-4">
            <InputField label="Loyer en place (annuel)" value={loyerEnPlace} onChange={(v) => setLoyerEnPlace(Number(v))} suffix="€" hint="Loyer actuellement perçu" />
            <InputField label="Valeur locative de marché — ERV (annuel)" value={erv} onChange={(v) => setErv(Number(v))} suffix="€" hint="Loyer de marché estimé au renouvellement" />
            <InputField label="Durée restante du bail" value={dureeRestante} onChange={(v) => setDureeRestante(Number(v))} suffix="ans" min={0} max={30} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Taux de rendement</h2>
          <div className="space-y-4">
            <InputField label="Taux terme (loyer en place — plus sécurisé)" value={tauxTerme} onChange={(v) => setTauxTerme(Number(v))} suffix="%" step={0.1} hint="Configurable — appliqué au loyer contractuel, plus faible car revenu garanti" />
            <InputField label="Taux réversion (ERV — plus risqué)" value={tauxReversion} onChange={(v) => setTauxReversion(Number(v))} suffix="%" step={0.1} hint="Configurable — appliqué au loyer de marché futur, plus élevé car incertain" />
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Méthode terme & réversion :</strong> Le loyer en place est capitalisé au taux terme pour la durée restante
              du bail (revenu contractuel, plus sûr). L'ERV est capitalisé en perpétuité au taux de réversion, différé de la durée
              restante (revenu futur, moins certain). La somme donne la valeur. Le taux terme est inférieur au taux de réversion.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <ResultPanel
          title="Valeur par terme & réversion"
          className="border-gold/30"
          lines={[
            { label: `Terme : ${formatEUR(loyerEnPlace)} × ${result.facteurTerme.toFixed(3)} (YP ${dureeRestante} ans à ${tauxTerme}%)`, value: formatEUR(result.valeurTerme) },
            { label: `Réversion : ${formatEUR(erv)} × ${result.facteurReversionPerp.toFixed(2)} × ${result.facteurDiffere.toFixed(4)}`, value: formatEUR(result.valeurReversion) },
            { label: "Valeur totale", value: formatEUR(result.valeur), highlight: true, large: true },
            { label: "Rendement équivalent", value: formatPct(result.rendementEquivalent), sub: true },
            { label: loyerEnPlace < erv ? "Sous-loué — potentiel de réversion" : "Sur-loué — risque à l'échéance", value: `${((erv - loyerEnPlace) / loyerEnPlace * 100).toFixed(1)}%`, warning: loyerEnPlace > erv },
          ]}
        />
      </div>
    </div>
  );
}

// ============================================================
// TAB — ESG / DURABILITÉ
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
          <h2 className="mb-4 text-base font-semibold text-navy">Performance énergétique</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Classe énergie (CPE)" type="select" value={classeEnergie} onChange={setClasseEnergie} options={[
              { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
              { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
            ]} />
            <InputField label="Année de construction" value={anneeConstruction} onChange={(v) => setAnneeConstruction(Number(v))} min={1800} max={2026} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Risques environnementaux</h2>
          <div className="space-y-3">
            <ToggleField label="Zone inondable" checked={zoneInondable} onChange={setZoneInondable} />
            <ToggleField label="Risque sécheresse (retrait-gonflement)" checked={risqueSecheresse} onChange={setRisqueSecheresse} />
            <ToggleField label="Risque glissement de terrain" checked={risqueGlissement} onChange={setRisqueGlissement} />
            <ToggleField label="Proximité site pollué" checked={proximitePollue} onChange={setProximitePollue} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Équipements durables</h2>
          <div className="space-y-3">
            <ToggleField label="Isolation récente (< 10 ans)" checked={isolationRecente} onChange={setIsolationRecente} />
            <ToggleField label="Panneaux solaires" checked={panneauxSolaires} onChange={setPanneauxSolaires} />
            <ToggleField label="Pompe à chaleur" checked={pompeAChaleur} onChange={setPompeAChaleur} />
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
        {/* Score ESG */}
        <div className="rounded-2xl border border-card-border bg-card p-8 text-center shadow-sm">
          <div className="text-sm text-muted">Score ESG</div>
          <div className={`text-5xl font-bold mt-2 ${scoreColor}`}>{result.score}/100</div>
          <div className={`mt-2 text-lg font-semibold ${scoreColor}`}>Niveau {result.niveau} — {result.niveauLabel}</div>
          <div className="mt-3 text-sm font-medium">
            Impact estimé sur la valeur : <span className={result.impactValeur >= 0 ? "text-success" : "text-error"}>{result.impactValeur > 0 ? "+" : ""}{result.impactValeur}%</span>
          </div>
        </div>
        {/* Risques */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">Risques identifiés</h3>
          <div className="space-y-2">
            {result.risques.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.niveau === "eleve" ? "bg-red-100 text-red-700" : r.niveau === "moyen" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {r.niveau}
                </span>
                <span className="text-slate">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
        {result.opportunites.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-3">Points positifs</h3>
            <ul className="space-y-1 text-sm text-slate">
              {result.opportunites.map((o, i) => <li key={i}>+ {o}</li>)}
            </ul>
          </div>
        )}
        {result.recommandations.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-3">Recommandations</h3>
            <ul className="space-y-1 text-sm text-slate">
              {result.recommandations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        <div className="rounded-lg bg-navy/5 border border-navy/10 p-3">
          <p className="text-xs text-slate leading-relaxed">
            <strong>EVS 2025 / Red Book 2025 :</strong> Les facteurs ESG doivent être pris en compte dans toute évaluation.
            Le score ESG influence la valeur via la prime verte (green premium) pour les biens performants et la décote brune
            (brown discount) pour les passoires énergétiques. Conformément à l'article 208 des orientations EBA, les facteurs
            environnementaux doivent être intégrés dans l'évaluation des collatéraux immobiliers.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB — RÉSIDUELLE ÉNERGÉTIQUE
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
          <h2 className="mb-4 text-base font-semibold text-navy">Performance énergétique</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Classe actuelle"
              type="select"
              value={classeActuelle}
              onChange={setClasseActuelle}
              options={[
                { value: "A", label: "A — Très performant" },
                { value: "B", label: "B — Performant" },
                { value: "C", label: "C — Assez performant" },
                { value: "D", label: "D — Moyen" },
                { value: "E", label: "E — Peu performant" },
                { value: "F", label: "F — Très peu performant" },
                { value: "G", label: "G — Extrêmement peu performant" },
              ]}
            />
            <InputField
              label="Classe cible après rénovation"
              type="select"
              value={classeCible}
              onChange={setClasseCible}
              options={[
                { value: "A", label: "A — Très performant" },
                { value: "B", label: "B — Performant" },
                { value: "C", label: "C — Assez performant" },
                { value: "D", label: "D — Moyen" },
              ]}
            />
          </div>
          <InputField
            label="Année de construction"
            value={anneeConstruction}
            onChange={(v) => setAnneeConstruction(Number(v))}
            min={1800}
            max={2026}
            className="mt-4"
            hint="Pour estimer la complexité de la rénovation"
          />
          <InputField
            label="Valeur estimée après rénovation"
            value={valeurApres}
            onChange={(v) => setValeurApres(Number(v))}
            suffix="€"
            className="mt-4"
            hint="Valeur de marché si le bien était à la classe cible"
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-navy">Coûts de rénovation</h2>
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
              Estimer automatiquement
            </button>
          </div>

          {/* Détail estimation auto */}
          {(() => {
            const est = estimerCoutsRenovation(classeActuelle, classeCible, surfaceBien, anneeConstruction);
            if (est.postes.length === 0) return null;
            return (
              <div className="mb-4 rounded-lg bg-background border border-card-border p-3">
                <div className="text-xs font-semibold text-navy mb-2">Estimation automatique ({classeActuelle} → {classeCible}, {surfaceBien} m², {anneeConstruction})</div>
                <div className="space-y-1">
                  {est.postes.map((p) => (
                    <div key={p.label} className="flex justify-between text-xs">
                      <span className="text-muted">{p.label}</span>
                      <span className="font-mono">{formatEUR(p.coutMin)} – {formatEUR(p.coutMax)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-semibold border-t border-card-border pt-1 mt-1">
                    <span>Total travaux (fourchette)</span>
                    <span className="font-mono">{formatEUR(est.totalMin)} – {formatEUR(est.totalMax)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>+ Honoraires (~10%)</span>
                    <span className="font-mono">{formatEUR(est.honoraires)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>Durée estimée</span>
                    <span>{est.dureeEstimeeMois} mois</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted">Fourchettes indicatives — marché luxembourgeois. Cliquez "Estimer automatiquement" pour pré-remplir les champs.</p>
              </div>
            );
          })()}

          <div className="space-y-4">
            <InputField label="Travaux de rénovation énergétique" value={coutTravaux} onChange={(v) => setCoutTravaux(Number(v))} suffix="€" hint="Isolation, menuiseries, chauffage, ventilation..." />
            <InputField label="Honoraires et études" value={honoraires} onChange={(v) => setHonoraires(Number(v))} suffix="€" hint="Audit énergétique, maîtrise d'œuvre, bureau d'études" />
            <InputField label="Frais de financement" value={fraisFinancement} onChange={(v) => setFraisFinancement(Number(v))} suffix="€" hint="Intérêts intercalaires si financement" />
            <InputField
              label="Marge prudentielle (aléas)"
              value={margePrudentielle}
              onChange={(v) => setMargePrudentielle(Number(v))}
              suffix="%"
              step={1}
              hint="Configurable — aléas chantier, surprises techniques. Typiquement 5-15%."
            />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Aides prévues</h2>
          <InputField
            label="Total des aides estimées"
            value={aidesPrevues}
            onChange={(v) => setAidesPrevues(Number(v))}
            suffix="€"
            hint="Klimabonus, Topup, Enoprimes, aides communales — utiliser le simulateur d'aides"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Diagramme visuel classe énergétique */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-navy">Transition énergétique</h3>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white ${
                classeActuelle <= "C" ? "bg-green-500" : classeActuelle <= "E" ? "bg-amber-500" : "bg-red-500"
              }`}>
                {classeActuelle}
              </div>
              <div className="mt-1 text-xs text-muted">Actuelle</div>
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
              <div className="mt-1 text-xs text-muted">Cible</div>
            </div>
          </div>
        </div>

        <ResultPanel
          title="Approche résiduelle énergétique"
          className="border-gold/30"
          lines={[
            { label: `Valeur après rénovation (classe ${classeCible})`, value: formatEUR(result.valeurApresRenovation) },
            { label: "Travaux + honoraires + financement", value: `- ${formatEUR(result.coutTotalBrut)}`, sub: true },
            { label: `Marge prudentielle (${margePrudentielle}%)`, value: `- ${formatEUR(result.margePrudentielleMontant)}`, sub: true },
            { label: "Coût total brut avec marge", value: `- ${formatEUR(result.coutTotalAvecMarge)}` },
            { label: "Aides prévues", value: `+ ${formatEUR(result.aidesDeduites)}` },
            { label: "Coût net après aides", value: `- ${formatEUR(result.coutNetApresAides)}` },
            { label: "Valeur résiduelle (état actuel)", value: formatEUR(result.valeurResiduelle), highlight: true, large: true },
            { label: "Décote énergétique", value: `${formatEUR(result.decoteEnergetique)} (${result.decoteEnergetiquePct.toFixed(1)}%)`, warning: result.decoteEnergetiquePct > 15 },
          ]}
        />

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-navy">Méthode EVS 2025</h3>
          <div className="space-y-2 text-sm text-muted leading-relaxed">
            <p>
              <strong className="text-slate">Principe :</strong> La valeur actuelle du bien se déduit de sa valeur
              hypothétique une fois rénové, diminuée des coûts nécessaires pour atteindre la performance cible.
            </p>
            <p>
              <strong className="text-slate">Valeur résiduelle</strong> = Valeur après rénovation − (Coûts travaux + Honoraires
              + Financement + Marge aléas) + Aides publiques
            </p>
            <p>
              <strong className="text-slate">Art. 208 EBA :</strong> Les facteurs ESG, notamment la performance
              énergétique, doivent être intégrés dans l'évaluation du collatéral. La décote énergétique
              reflète le coût de mise en conformité que l'acquéreur devra supporter.
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
          <h2 className="mb-4 text-base font-semibold text-navy">Valeur de marché</h2>
          <div className="text-center py-4">
            <div className="text-sm text-muted">Valeur de marché (EVS1)</div>
            <div className="text-3xl font-bold text-navy mt-1">{formatEUR(valeurMarche)}</div>
            <p className="text-xs text-muted mt-2">Issue de la réconciliation ou saisie directe</p>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Décotes prudentielles (marge de sécurité bancaire)</h2>
          <div className="space-y-4">
            <InputField
              label="Décote conjoncturelle"
              value={decoteConj}
              onChange={(v) => setDecoteConj(Number(v))}
              suffix="%"
              step={0.5}
              hint="Configurable — marge de prudence par rapport aux conditions de marché actuelles (exclure les éléments spéculatifs)"
            />
            <InputField
              label="Décote commercialisation"
              value={decoteComm}
              onChange={(v) => setDecoteComm(Number(v))}
              suffix="%"
              step={0.5}
              hint="Configurable — risque de liquidité / délai de vente"
            />
            <InputField
              label="Décote spécifique"
              value={decoteSpec}
              onChange={(v) => setDecoteSpec(Number(v))}
              suffix="%"
              step={0.5}
              hint="Configurable — risques propres au bien (état, localisation secondaire, etc.)"
            />
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Valeur hypothécaire (Règlement CRR Art. 229 / Norme EVS3) :</strong> La valeur hypothécaire est la valeur
              que la banque retient comme garantie du prêt. Elle doit refléter la valeur soutenable à long terme, en excluant
              les éléments spéculatifs et les conditions de marché exceptionnelles.
              L'évaluateur doit documenter et justifier chaque décote. Il n'existe pas de taux réglementaire fixe — les décotes
              sont des jugements professionnels.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ResultPanel
          title="Valeur hypothécaire (Mortgage Lending Value)"
          className="border-gold/30"
          lines={[
            { label: "Valeur de marché (MV)", value: formatEUR(result.valeurMarche) },
            { label: `Décote conjoncturelle (${decoteConj}%)`, value: `- ${formatEUR(result.valeurMarche * decoteConj / 100)}`, sub: true },
            { label: `Décote commercialisation (${decoteComm}%)`, value: `- ${formatEUR(result.valeurMarche * decoteComm / 100)}`, sub: true },
            { label: `Décote spécifique (${decoteSpec}%)`, value: `- ${formatEUR(result.valeurMarche * decoteSpec / 100)}`, sub: true },
            { label: "Total décotes", value: `- ${formatEUR(result.totalDecotes)} (${result.totalDecotesPct.toFixed(1)}%)` },
            { label: "MLV", value: formatEUR(result.mlv), highlight: true, large: true },
            { label: "Ratio valeur hypothécaire / valeur de marché", value: `${(result.ratioMLVsurMV * 100).toFixed(1)}%`, sub: true },
          ]}
        />

        {/* CRR Risk Weight bands */}
        <div className="rounded-xl border border-card-border bg-card shadow-sm">
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-base font-semibold text-navy">Pondérations CRR2 — Art. 125 (résidentiel)</h3>
            <p className="text-xs text-muted mt-1">Montants maximaux de prêt par bande de LTV, basés sur la MLV</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-card-border bg-background">
                <th className="px-4 py-2 text-left font-semibold text-navy">Bande LTV</th>
                <th className="px-4 py-2 text-right font-semibold text-navy">Risk Weight</th>
                <th className="px-4 py-2 text-right font-semibold text-navy">Prêt max</th>
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
// TAB 5 — RÉCONCILIATION
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

  // Scénarios : ajustement en % sur chaque valeur
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
        {/* Pondérations */}
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Valeurs par méthode et pondération</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">Comparaison</div>
                  <div className="text-lg font-bold text-navy">{valeurComparaison ? formatEUR(valeurComparaison) : "—"}</div>
                </div>
                <InputField label="Poids" value={poidsComp} onChange={(v) => setPoidsComp(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">Capitalisation</div>
                  <div className="text-lg font-bold text-navy">{valeurCapitalisation ? formatEUR(valeurCapitalisation) : "—"}</div>
                </div>
                <InputField label="Poids" value={poidsCap} onChange={(v) => setPoidsCap(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">DCF</div>
                  <div className="text-lg font-bold text-navy">{valeurDCF ? formatEUR(valeurDCF) : "—"}</div>
                </div>
                <InputField label="Poids" value={poidsDCF} onChange={(v) => setPoidsDCF(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
            </div>
          </div>

          {/* Paramètres scénarios */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Scénarios</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Scénario haut (+%)" value={scenarioHautPct} onChange={(v) => setScenarioHautPct(Number(v))} suffix="%" min={1} max={30} hint="Hypothèse optimiste" />
              <InputField label="Scénario bas (−%)" value={scenarioBasPct} onChange={(v) => setScenarioBasPct(Number(v))} suffix="%" min={1} max={30} hint="Hypothèse prudente" />
            </div>
            <p className="mt-2 text-xs text-muted">Applique un ajustement uniforme sur les valeurs de chaque méthode avant réconciliation.</p>
          </div>
        </div>

        {/* Résultat base */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-gold/40 bg-gradient-to-br from-card to-gold/5 p-8 shadow-sm text-center">
            <div className="text-sm text-muted uppercase tracking-wider">Valeur de marché réconciliée</div>
            <div className="mt-2 text-4xl font-bold text-navy">{formatEUR(resultBase.valeurReconciliee)}</div>
            <div className="mt-2 text-sm text-muted">Scénario central — EVS1</div>
          </div>

          <ResultPanel
            title="Contrôle qualité"
            lines={[
              { label: "Écart max entre méthodes", value: `${resultBase.ecartMaxPct.toFixed(1)}%`, warning: resultBase.ecartMaxPct > 20 },
              { label: "Écart-type", value: formatEUR(resultBase.ecartType), sub: true },
              ...(resultBase.ecartMaxPct > 20 ? [{ label: "Alerte", value: "Écart > 20% — analyser les divergences", warning: true }] : []),
            ]}
          />
        </div>
      </div>

      {/* Tableau comparatif 3 scénarios */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy"></th>
              <th className="px-4 py-3 text-center font-semibold text-error">Scénario bas (−{scenarioBasPct}%)</th>
              <th className="px-4 py-3 text-center font-semibold text-navy bg-navy/5">Scénario central</th>
              <th className="px-4 py-3 text-center font-semibold text-success">Scénario haut (+{scenarioHautPct}%)</th>
            </tr>
          </thead>
          <tbody>
            {valeurComparaison > 0 && (
              <tr className="border-b border-card-border/50">
                <td className="px-4 py-2 text-muted">Comparaison</td>
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
              <td className="px-4 py-3 text-navy">Valeur réconciliée</td>
              <td className="px-4 py-3 text-center font-mono text-error text-lg">{formatEUR(resultBas.valeurReconciliee)}</td>
              <td className="px-4 py-3 text-center font-mono text-navy text-lg bg-navy/5">{formatEUR(resultBase.valeurReconciliee)}</td>
              <td className="px-4 py-3 text-center font-mono text-success text-lg">{formatEUR(resultHaut.valeurReconciliee)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Analyse par scénarios :</strong> Les scénarios haut et bas appliquent un ajustement uniforme
          sur les valeurs de chaque méthode. En pratique, les variations peuvent être asymétriques
          (ex: cap rate +50bps en scénario bas mais comparaison −5% seulement). Pour une analyse
          plus fine, utilisez les matrices de sensibilité dans chaque onglet de méthode.
        </p>
      </div>

      {/* Texte narratif */}
      {(valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-4">Analyse narrative</h3>
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
// PAGE PRINCIPALE
// ============================================================

export default function Valorisation() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("comparaison");
  const [surfaceBien, setSurfaceBien] = useState(80);
  const [assetType, setAssetType] = useState<AssetType>("residential_apartment");
  const [evsValueType, setEvsValueType] = useState<EVSValueType>("market_value");

  // Recherche commune — état global (persiste entre onglets)
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);
  const selectedCommune = selectedResult?.commune ?? null;

  // Comparables — état global (persiste entre onglets)
  const [comparables, setComparables] = useState<Comparable[]>([]);

  const assetConfig = useMemo(() => getAssetTypeConfig(assetType), [assetType]);
  const evsInfo = useMemo(() => EVS_VALUE_TYPES.find((e) => e.id === evsValueType)!, [evsValueType]);

  // Valeurs remontées par chaque onglet
  const [valeurComparaison, setValeurComparaison] = useState(0);
  const [valeurCapitalisation, setValeurCapitalisation] = useState(0);
  const [valeurDCF, setValeurDCF] = useState(0);

  // Stable callback refs
  const onValeurComp = useCallback((v: number) => setValeurComparaison(v), []);
  const onValeurCap = useCallback((v: number) => setValeurCapitalisation(v), []);
  const onValeurDCF = useCallback((v: number) => setValeurDCF(v), []);

  // Valeur de marché pour MLV (prend la réconciliée ou la meilleure dispo)
  const valeurMarchePourMLV = valeurComparaison || valeurCapitalisation || valeurDCF || 750000;

  // Reset complet
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
              Valorisation Immobilière
            </h1>
            <span className="rounded-full bg-navy/10 px-3 py-0.5 text-xs font-semibold text-navy">
              EVS 2025
            </span>
          </div>
          <p className="mt-2 text-muted">
            Conforme TEGOVA European Valuation Standards 2025 (10e édition)
          </p>
        </div>

        {/* Type d'actif + Base de valeur EVS + Surface */}
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
                label="Base de valeur (EVS 2025)"
                type="select"
                value={evsValueType}
                onChange={(v) => setEvsValueType(v as EVSValueType)}
                options={EVS_VALUE_TYPES.map((e) => ({ value: e.id, label: `${e.evs} — ${e.label}` }))}
              />
              <p className="mt-2 text-xs text-muted leading-relaxed">{evsInfo.description}</p>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <InputField
                label="Surface du bien"
                value={surfaceBien}
                onChange={(v) => setSurfaceBien(Number(v))}
                suffix="m²"
              />
              <div className="mt-3 text-xs text-muted">
                <div className="font-medium text-slate mb-1">Méthodes recommandées :</div>
                {assetConfig.recommendedMethods.map((m, i) => (
                  <div key={i}>• {m}</div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-slate mb-2">Paramètres de référence — {assetConfig.label}</div>
              <div className="space-y-1 text-xs text-muted">
                <div className="flex justify-between"><span>Taux de capitalisation</span><span className="font-mono">{assetConfig.defaults.capRateMin}–{assetConfig.defaults.capRateMax}%</span></div>
                <div className="flex justify-between"><span>Taux de vacance</span><span className="font-mono">{assetConfig.defaults.vacancyRate}%</span></div>
                <div className="flex justify-between"><span>Taux d'actualisation</span><span className="font-mono">{assetConfig.defaults.discountRateDefault}%</span></div>
                <div className="flex justify-between"><span>Taux de sortie (revente)</span><span className="font-mono">{assetConfig.defaults.exitCapDefault}%</span></div>
                <div className="flex justify-between"><span>Décotes valeur hypothécaire</span><span className="font-mono">{assetConfig.defaults.mlvConjoncturelleDefault + assetConfig.defaults.mlvCommercialisationDefault + assetConfig.defaults.mlvSpecifiqueDefault}%</span></div>
              </div>
              {assetConfig.specificMetrics.length > 0 && (
                <div className="mt-2 pt-2 border-t border-card-border text-xs text-muted">
                  <span className="font-medium text-slate">Métriques clés : </span>
                  {assetConfig.specificMetrics.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Asset type notes */}
          <div className="rounded-lg bg-navy/5 border border-navy/10 px-4 py-3">
            <p className="text-xs text-slate leading-relaxed">{assetConfig.notes}</p>
          </div>

          {/* Résumé persistant : commune + valeurs + reset */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {selectedCommune && (
              <div className="rounded-lg bg-navy/5 border border-navy/10 px-3 py-2">
                <span className="text-muted">Commune :</span>{" "}
                <span className="font-semibold text-navy">{selectedCommune.commune}</span>
                {selectedResult?.isLocalite && <span className="text-muted"> ({selectedResult.matchedOn})</span>}
                {selectedCommune.prixM2Existant && <span className="ml-2 font-mono text-xs text-muted">{formatEUR(selectedCommune.prixM2Existant)}/m²</span>}
              </div>
            )}
            {valeurComparaison > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">Comparaison :</span> <span className="font-semibold text-navy">{formatEUR(valeurComparaison)}</span></div>
            )}
            {valeurCapitalisation > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">Capitalisation :</span> <span className="font-semibold text-navy">{formatEUR(valeurCapitalisation)}</span></div>
            )}
            {valeurDCF > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">DCF :</span> <span className="font-semibold text-navy">{formatEUR(valeurDCF)}</span></div>
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
                Rapport PDF
              </button>
            )}
            {(selectedCommune || comparables.length > 0 || valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-error/30 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Checklist EVS */}
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
                <div className="text-xs font-semibold text-navy">Conformité EVS 2025</div>
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
