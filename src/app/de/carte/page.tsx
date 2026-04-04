"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatEUR } from "@/lib/calculations";
import { rechercherCommune, type MarketDataCommune, type SearchResult } from "@/lib/market-data";
import { PriceEvolutionChart, PriceIndexChart } from "@/components/PriceChart";
import { getDemographics } from "@/lib/demographics";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

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

type PriceField = "prixM2Existant" | "prixM2VEFA" | "prixM2Annonces";

const PRICE_TYPES: { key: PriceField; label: string }[] = [
  { key: "prixM2Existant", label: "Existing" },
  { key: "prixM2VEFA", label: "New (VEFA)" },
  { key: "prixM2Annonces", label: "Listings" },
];

export default function Carte() {
  const [search, setSearch] = useState("");
  const [selectedCommune, setSelectedCommune] = useState<MarketDataCommune | null>(null);
  const [sortBy, setSortBy] = useState<"prix" | "canton" | "nom">("canton");
  const [priceField, setPriceField] = useState<PriceField>("prixM2Existant");

  const allCommunes = useMemo(() => {
    const names = getAllCommunes();
    return names.map((n) => getMarketDataCommune(n)).filter(Boolean) as MarketDataCommune[];
  }, []);

  const maxPrix = useMemo(() => Math.max(...allCommunes.map((c) => c[priceField] || 0)), [allCommunes, priceField]);

  const searchResults = useMemo(() => rechercherCommune(search), [search]);

  const sortedCommunes = useMemo(() => {
    const filtered = search && searchResults.length > 0
      ? searchResults.map((r) => r.commune)
      : allCommunes;

    return [...filtered].sort((a, b) => {
      if (sortBy === "prix") return (b[priceField] || 0) - (a[priceField] || 0);
      if (sortBy === "nom") return a.commune.localeCompare(b.commune);
      // canton
      const ai = CANTONS_ORDER.indexOf(a.canton);
      const bi = CANTONS_ORDER.indexOf(b.canton);
      if (ai !== bi) return ai - bi;
      return (b[priceField] || 0) - (a[priceField] || 0);
    });
  }, [allCommunes, searchResults, search, sortBy, priceField]);

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
            Property price map
          </h1>
          <p className="mt-2 text-muted">
            Average prices per m² by commune — Source: Observatoire de l'Habitat (notarial deeds)
          </p>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Price /m²:</span>
          <span className="rounded px-2 py-0.5 bg-emerald-100 text-emerald-800">{"< 5,000 €"}</span>
          <span className="rounded px-2 py-0.5 bg-green-100 text-green-800">5–6k €</span>
          <span className="rounded px-2 py-0.5 bg-lime-100 text-lime-800">6–7k €</span>
          <span className="rounded px-2 py-0.5 bg-yellow-100 text-yellow-800">7–8k €</span>
          <span className="rounded px-2 py-0.5 bg-amber-100 text-amber-800">8–9k €</span>
          <span className="rounded px-2 py-0.5 bg-orange-100 text-orange-800">9–10k €</span>
          <span className="rounded px-2 py-0.5 bg-red-100 text-red-800">{"> 10,000 €"}</span>
        </div>

        {/* Price type toggle */}
        <div className="mb-4 flex gap-2">
          {PRICE_TYPES.map((pt) => (
            <button
              key={pt.key}
              onClick={() => setPriceField(pt.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                priceField === pt.key
                  ? "bg-navy text-white"
                  : "bg-background text-muted border border-card-border hover:bg-navy/5"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedCommune(null); }}
            placeholder="Search for a commune or locality..."
            className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "prix" | "canton" | "nom")}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm"
          >
            <option value="canton">By canton</option>
            <option value="prix">By price (descending)</option>
            <option value="nom">By name</option>
          </select>
        </div>

        {/* Leaflet Map */}
        <div className="mb-8">
          <LeafletMap
            communes={allCommunes}
            onSelectCommune={setSelectedCommune}
            selectedCommune={selectedCommune?.commune}
            priceField={priceField}
          />
          <p className="mt-2 text-xs text-muted text-center">Circle size proportional to transaction volume. Click for details.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Communes grid */}
          <div className="lg:col-span-2">
            {sortBy === "canton" ? (
              <div className="space-y-6">
                {CANTONS_ORDER.map((canton) => {
                  const communes = communesByCanton[canton];
                  if (!communes || communes.length === 0) return null;
                  return (
                    <div key={canton}>
                      <h3 className="text-sm font-semibold text-navy mb-2">Canton of {canton}</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {communes.map((c) => {
                          const prix = c[priceField];
                          return (
                          <button
                            key={c.commune}
                            onClick={() => setSelectedCommune(c)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                              selectedCommune?.commune === c.commune ? "border-navy ring-2 ring-navy/20" : "border-card-border"
                            } bg-card`}
                          >
                            <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getPriceColor(prix)}`}>
                              {prix ? `${(prix / 1000).toFixed(1)}k` : "\u2014"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate truncate">{c.commune}</div>
                              <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                                <div
                                  className="h-1.5 rounded-full bg-navy/30"
                                  style={{ width: getPriceBarWidth(prix, maxPrix) }}
                                />
                              </div>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {sortedCommunes.map((c) => {
                  const prix = c[priceField];
                  return (
                  <button
                    key={c.commune}
                    onClick={() => setSelectedCommune(c)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                      selectedCommune?.commune === c.commune ? "border-navy ring-2 ring-navy/20" : "border-card-border"
                    } bg-card`}
                  >
                    <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getPriceColor(prix)}`}>
                      {prix ? `${(prix / 1000).toFixed(1)}k` : "\u2014"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate truncate">{c.commune}</div>
                      <div className="text-xs text-muted">{c.canton}</div>
                    </div>
                  </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected commune details */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {selectedCommune ? (
                <>
                  <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-navy">{selectedCommune.commune}</h2>
                    <p className="text-xs text-muted">{selectedCommune.canton} — {selectedCommune.periode}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className={`rounded-lg p-3 text-center ${priceField === "prixM2Existant" ? "bg-navy/15 ring-2 ring-navy/30" : "bg-navy/5"}`}>
                        <div className="text-xs text-muted">Existing</div>
                        <div className="text-lg font-bold text-navy">{selectedCommune.prixM2Existant ? formatEUR(selectedCommune.prixM2Existant) : "\u2014"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${priceField === "prixM2VEFA" ? "bg-navy/15 ring-2 ring-navy/30" : "bg-navy/5"}`}>
                        <div className="text-xs text-muted">New (VEFA)</div>
                        <div className="text-lg font-bold text-navy">{selectedCommune.prixM2VEFA ? formatEUR(selectedCommune.prixM2VEFA) : "\u2014"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${priceField === "prixM2Annonces" ? "bg-gold/20 ring-2 ring-gold/40" : "bg-gold/10"}`}>
                        <div className="text-xs text-muted">Listings</div>
                        <div className="text-lg font-bold text-gold-dark">{selectedCommune.prixM2Annonces ? formatEUR(selectedCommune.prixM2Annonces) : "\u2014"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className="rounded-lg bg-teal/10 p-3 text-center">
                        <div className="text-xs text-muted">Rent</div>
                        <div className="text-lg font-bold text-teal">{selectedCommune.loyerM2Annonces ? `${selectedCommune.loyerM2Annonces.toFixed(1)} €` : "\u2014"}</div>
                        <div className="text-[10px] text-muted">/m²/month</div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted">
                      {selectedCommune.nbTransactions} transactions — {selectedCommune.source}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href="/de/estimation"
                        className="flex-1 rounded-lg bg-navy px-3 py-2 text-center text-xs font-medium text-white hover:bg-navy-light transition-colors"
                      >
                        Estimate a property
                      </Link>
                      <Link
                        href="/de/valorisation"
                        className="flex-1 rounded-lg border border-navy px-3 py-2 text-center text-xs font-medium text-navy hover:bg-navy/5 transition-colors"
                      >
                        Professional valuation
                      </Link>
                    </div>
                  </div>

                  {/* Demographics */}
                  {(() => {
                    const demo = getDemographics(selectedCommune.commune);
                    if (!demo) return null;
                    return (
                      <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-navy mb-2">Demographics</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted">Population</span><br/><span className="font-semibold">{demo.population.toLocaleString("fr-LU")}</span></div>
                          <div><span className="text-muted">Growth</span><br/><span className="font-semibold text-success">+{demo.croissancePct}%</span> <span className="text-[10px] text-muted">(10 yrs)</span></div>
                          <div><span className="text-muted">Density</span><br/><span className="font-semibold">{demo.densiteHabKm2} inhab/km²</span></div>
                          <div><span className="text-muted">% foreign nationals</span><br/><span className="font-semibold">{demo.pctEtrangers}%</span></div>
                          {demo.revenuMedian && <div><span className="text-muted">Median income</span><br/><span className="font-semibold">{formatEUR(demo.revenuMedian)}/yr</span></div>}
                          {demo.tauxEmploi && <div><span className="text-muted">Employment rate</span><br/><span className="font-semibold">{demo.tauxEmploi}%</span></div>}
                        </div>
                        <p className="mt-2 text-[10px] text-muted">Source: STATEC (2025 estimates)</p>
                      </div>
                    );
                  })()}

                  {/* Neighbourhoods if available */}
                  {selectedCommune.quartiers && selectedCommune.quartiers.length > 0 && (
                    <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-navy mb-3">Neighbourhoods</h3>
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
                    <p className="text-sm text-muted">Click on a commune to view details</p>
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
