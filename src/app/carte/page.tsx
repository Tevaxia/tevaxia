"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatEUR } from "@/lib/calculations";
import { rechercherCommune, type MarketDataCommune, type SearchResult } from "@/lib/market-data";
import { PriceEvolutionChart, PriceIndexChart } from "@/components/PriceChart";

// Import all commune data directly
import { getAllCommunes, getMarketDataCommune } from "@/lib/market-data";

function getPriceColor(prix: number | null): string {
  if (!prix) return "bg-gray-100 text-gray-400";
  if (prix >= 10000) return "bg-red-100 text-red-800 border-red-200";
  if (prix >= 9000) return "bg-orange-100 text-orange-800 border-orange-200";
  if (prix >= 8000) return "bg-amber-100 text-amber-800 border-amber-200";
  if (prix >= 7000) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (prix >= 6000) return "bg-lime-100 text-lime-800 border-lime-200";
  if (prix >= 5000) return "bg-green-100 text-green-800 border-green-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function getPriceBarWidth(prix: number | null, maxPrix: number): string {
  if (!prix) return "0%";
  return `${(prix / maxPrix) * 100}%`;
}

const CANTONS_ORDER = [
  "Luxembourg", "Capellen", "Esch-sur-Alzette", "Mersch",
  "Grevenmacher", "Remich", "Echternach", "Diekirch",
  "Redange", "Wiltz", "Clervaux", "Vianden",
];

export default function Carte() {
  const [search, setSearch] = useState("");
  const [selectedCommune, setSelectedCommune] = useState<MarketDataCommune | null>(null);
  const [sortBy, setSortBy] = useState<"prix" | "canton" | "nom">("canton");

  const allCommunes = useMemo(() => {
    const names = getAllCommunes();
    return names.map((n) => getMarketDataCommune(n)).filter(Boolean) as MarketDataCommune[];
  }, []);

  const maxPrix = useMemo(() => Math.max(...allCommunes.map((c) => c.prixM2Existant || 0)), [allCommunes]);

  const searchResults = useMemo(() => rechercherCommune(search), [search]);

  const sortedCommunes = useMemo(() => {
    const filtered = search && searchResults.length > 0
      ? searchResults.map((r) => r.commune)
      : allCommunes;

    return [...filtered].sort((a, b) => {
      if (sortBy === "prix") return (b.prixM2Existant || 0) - (a.prixM2Existant || 0);
      if (sortBy === "nom") return a.commune.localeCompare(b.commune);
      // canton
      const ai = CANTONS_ORDER.indexOf(a.canton);
      const bi = CANTONS_ORDER.indexOf(b.canton);
      if (ai !== bi) return ai - bi;
      return (b.prixM2Existant || 0) - (a.prixM2Existant || 0);
    });
  }, [allCommunes, searchResults, search, sortBy]);

  // Group by canton for canton view
  const communesByCanton = useMemo(() => {
    const groups: Record<string, MarketDataCommune[]> = {};
    for (const c of sortedCommunes) {
      if (!groups[c.canton]) groups[c.canton] = [];
      groups[c.canton].push(c);
    }
    return groups;
  }, [sortedCommunes]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Carte des prix immobiliers
          </h1>
          <p className="mt-2 text-muted">
            Prix moyens au m² par commune — Source : Observatoire de l'Habitat (actes notariés)
          </p>
        </div>

        {/* Légende */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Prix /m² :</span>
          <span className="rounded px-2 py-0.5 bg-emerald-100 text-emerald-800">{"< 5 000 €"}</span>
          <span className="rounded px-2 py-0.5 bg-green-100 text-green-800">5–6k €</span>
          <span className="rounded px-2 py-0.5 bg-lime-100 text-lime-800">6–7k €</span>
          <span className="rounded px-2 py-0.5 bg-yellow-100 text-yellow-800">7–8k €</span>
          <span className="rounded px-2 py-0.5 bg-amber-100 text-amber-800">8–9k €</span>
          <span className="rounded px-2 py-0.5 bg-orange-100 text-orange-800">9–10k €</span>
          <span className="rounded px-2 py-0.5 bg-red-100 text-red-800">{"> 10 000 €"}</span>
        </div>

        {/* Search + Sort */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedCommune(null); }}
            placeholder="Rechercher une commune ou localité..."
            className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "prix" | "canton" | "nom")}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm"
          >
            <option value="canton">Par canton</option>
            <option value="prix">Par prix (décroissant)</option>
            <option value="nom">Par nom</option>
          </select>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Grille des communes */}
          <div className="lg:col-span-2">
            {sortBy === "canton" ? (
              <div className="space-y-6">
                {CANTONS_ORDER.map((canton) => {
                  const communes = communesByCanton[canton];
                  if (!communes || communes.length === 0) return null;
                  return (
                    <div key={canton}>
                      <h3 className="text-sm font-semibold text-navy mb-2">Canton de {canton}</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {communes.map((c) => (
                          <button
                            key={c.commune}
                            onClick={() => setSelectedCommune(c)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                              selectedCommune?.commune === c.commune ? "border-navy ring-2 ring-navy/20" : "border-card-border"
                            } bg-card`}
                          >
                            <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getPriceColor(c.prixM2Existant)}`}>
                              {c.prixM2Existant ? `${(c.prixM2Existant / 1000).toFixed(1)}k` : "—"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate truncate">{c.commune}</div>
                              <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                                <div
                                  className="h-1.5 rounded-full bg-navy/30"
                                  style={{ width: getPriceBarWidth(c.prixM2Existant, maxPrix) }}
                                />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {sortedCommunes.map((c) => (
                  <button
                    key={c.commune}
                    onClick={() => setSelectedCommune(c)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                      selectedCommune?.commune === c.commune ? "border-navy ring-2 ring-navy/20" : "border-card-border"
                    } bg-card`}
                  >
                    <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getPriceColor(c.prixM2Existant)}`}>
                      {c.prixM2Existant ? `${(c.prixM2Existant / 1000).toFixed(1)}k` : "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate truncate">{c.commune}</div>
                      <div className="text-xs text-muted">{c.canton}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Détail commune sélectionnée */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {selectedCommune ? (
                <>
                  <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-navy">{selectedCommune.commune}</h2>
                    <p className="text-xs text-muted">{selectedCommune.canton} — {selectedCommune.periode}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-navy/5 p-3 text-center">
                        <div className="text-xs text-muted">Existant</div>
                        <div className="text-lg font-bold text-navy">{selectedCommune.prixM2Existant ? formatEUR(selectedCommune.prixM2Existant) : "—"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className="rounded-lg bg-navy/5 p-3 text-center">
                        <div className="text-xs text-muted">Neuf (VEFA)</div>
                        <div className="text-lg font-bold text-navy">{selectedCommune.prixM2VEFA ? formatEUR(selectedCommune.prixM2VEFA) : "—"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className="rounded-lg bg-gold/10 p-3 text-center">
                        <div className="text-xs text-muted">Annonces</div>
                        <div className="text-lg font-bold text-gold-dark">{selectedCommune.prixM2Annonces ? formatEUR(selectedCommune.prixM2Annonces) : "—"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className="rounded-lg bg-teal/10 p-3 text-center">
                        <div className="text-xs text-muted">Loyer</div>
                        <div className="text-lg font-bold text-teal">{selectedCommune.loyerM2Annonces ? `${selectedCommune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
                        <div className="text-[10px] text-muted">/m²/mois</div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted">
                      {selectedCommune.nbTransactions} transactions — {selectedCommune.source}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href="/estimation"
                        className="flex-1 rounded-lg bg-navy px-3 py-2 text-center text-xs font-medium text-white hover:bg-navy-light transition-colors"
                      >
                        Estimer un bien
                      </Link>
                      <Link
                        href="/valorisation"
                        className="flex-1 rounded-lg border border-navy px-3 py-2 text-center text-xs font-medium text-navy hover:bg-navy/5 transition-colors"
                      >
                        Valorisation pro
                      </Link>
                    </div>
                  </div>

                  {/* Quartiers si dispo */}
                  {selectedCommune.quartiers && selectedCommune.quartiers.length > 0 && (
                    <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-navy mb-3">Quartiers</h3>
                      <div className="space-y-1">
                        {selectedCommune.quartiers
                          .sort((a, b) => b.prixM2 - a.prixM2)
                          .map((q) => (
                            <div key={q.nom} className="flex items-center justify-between text-xs py-1">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                                  q.tendance === "hausse" ? "bg-green-100 text-green-700" :
                                  q.tendance === "baisse" ? "bg-red-100 text-red-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>{q.tendance === "hausse" ? "+" : q.tendance === "baisse" ? "-" : "="}</span>
                                <span className="text-slate">{q.nom}</span>
                              </div>
                              <span className="font-mono font-semibold text-navy">{formatEUR(q.prixM2)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center">
                    <p className="text-sm text-muted">Cliquez sur une commune pour voir le détail</p>
                  </div>
                  <PriceEvolutionChart />
                  <PriceIndexChart />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
