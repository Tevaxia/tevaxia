"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatEUR } from "@/lib/calculations";
import { rechercherCommune, type MarketDataCommune } from "@/lib/market-data";
import { PriceEvolutionChart, PriceIndexChart } from "@/components/PriceChart";
import { getDemographics } from "@/lib/demographics";
import { getMarketCycle } from "@/lib/market-cycle";
import { computeMarketScore, getScoreColor, getScoreBarColor } from "@/lib/market-score";
import dynamic from "next/dynamic";
import { generateCartePdfBlob, PdfButton } from "@/components/ToolsPdf";
import MarketAlertButton from "@/components/MarketAlertButton";
import SEOContent from "@/components/SEOContent";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });
import CantonHeatmap from "@/components/CantonHeatmap";

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
type ViewMode = PriceField | "rendement";

function computeYield(commune: MarketDataCommune): number | null {
  if (!commune.loyerM2Annonces || !commune.prixM2Existant) return null;
  return (commune.loyerM2Annonces * 12) / commune.prixM2Existant * 100;
}

function getYieldColor(yieldPct: number | null): string {
  if (yieldPct == null) return "bg-gray-100 text-gray-400";
  if (yieldPct >= 4) return "bg-green-100 text-green-800 border-green-200";
  if (yieldPct >= 3) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export default function Carte() {
  const t = useTranslations("carte");
  const [search, setSearch] = useState("");
  const [selectedCommune, setSelectedCommune] = useState<MarketDataCommune | null>(null);
  const [sortBy, setSortBy] = useState<"prix" | "canton" | "nom">("canton");
  const [viewMode, setViewMode] = useState<ViewMode>("prixM2Existant");
  const isRendement = viewMode === "rendement";
  const priceField: PriceField = isRendement ? "prixM2Existant" : viewMode;

  const PRICE_TYPES: { key: PriceField; label: string }[] = [
    { key: "prixM2Existant", label: t("existing") },
    { key: "prixM2VEFA", label: t("newVefa") },
    { key: "prixM2Annonces", label: t("listings") },
  ];

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
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Légende */}
        {isRendement ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">{t("grossYield")} :</span>
            <span className="rounded px-2 py-0.5 bg-red-100 text-red-800">{"< 3 %"}</span>
            <span className="rounded px-2 py-0.5 bg-amber-100 text-amber-800">3–4 %</span>
            <span className="rounded px-2 py-0.5 bg-green-100 text-green-800">{"> 4 %"}</span>
            <span className="text-muted ml-2">{t("yieldFormula")}</span>
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">{t("pricePerSqm")} :</span>
            <span className="rounded px-2 py-0.5 bg-emerald-100 text-emerald-800">{"< 5 000 €"}</span>
            <span className="rounded px-2 py-0.5 bg-green-100 text-green-800">5–6k €</span>
            <span className="rounded px-2 py-0.5 bg-lime-100 text-lime-800">6–7k €</span>
            <span className="rounded px-2 py-0.5 bg-yellow-100 text-yellow-800">7–8k €</span>
            <span className="rounded px-2 py-0.5 bg-amber-100 text-amber-800">8–9k €</span>
            <span className="rounded px-2 py-0.5 bg-orange-100 text-orange-800">9–10k €</span>
            <span className="rounded px-2 py-0.5 bg-red-100 text-red-800">{"> 10 000 €"}</span>
          </div>
        )}

        {/* Price type toggle */}
        <div className="mb-4 flex flex-wrap gap-2">
          {PRICE_TYPES.map((pt) => (
            <button
              key={pt.key}
              onClick={() => setViewMode(pt.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === pt.key
                  ? "bg-navy text-white"
                  : "bg-background text-muted border border-card-border hover:bg-navy/5"
              }`}
            >
              {pt.label}
            </button>
          ))}
          <button
            onClick={() => setViewMode("rendement")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isRendement
                ? "bg-teal text-white"
                : "bg-background text-muted border border-card-border hover:bg-teal/5"
            }`}
          >
            {t("yield")}
          </button>
        </div>

        {/* Search + Sort */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedCommune(null); }}
            placeholder={t("searchPlaceholder")}
            className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "prix" | "canton" | "nom")}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm"
          >
            <option value="canton">{t("sortByCanton")}</option>
            <option value="prix">{t("sortByPrice")}</option>
            <option value="nom">{t("sortByName")}</option>
          </select>
        </div>

        {/* Heatmap choroplèthe par canton (alternative visuelle rapide) */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-navy">{t("heatmapTitle")}</h2>
          <CantonHeatmap data={allCommunes} />
        </div>

        {/* Carte Leaflet */}
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-navy">{t("mapDetailTitle")}</h2>
          <LeafletMap
            communes={allCommunes}
            onSelectCommune={setSelectedCommune}
            selectedCommune={selectedCommune?.commune}
            priceField={priceField}
            viewMode={viewMode}
            cadastreLabel={t("geoportailCadastreLayer")}
          />
          <p className="mt-2 text-xs text-muted text-center">{t("mapHint")}</p>
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
                      <h3 className="text-sm font-semibold text-navy mb-2">{t("cantonOf", { canton })}</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {communes.map((c) => {
                          const prix = c[priceField];
                          const yieldPct = computeYield(c);
                          return (
                          <button
                            key={c.commune}
                            onClick={() => setSelectedCommune(c)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                              selectedCommune?.commune === c.commune ? "border-navy ring-2 ring-navy/20" : "border-card-border"
                            } bg-card`}
                          >
                            {isRendement ? (
                              <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getYieldColor(yieldPct)}`}>
                                {yieldPct != null ? `${yieldPct.toFixed(1)}%` : "—"}
                              </div>
                            ) : (
                              <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getPriceColor(prix)}`}>
                                {prix ? `${(prix / 1000).toFixed(1)}k` : "—"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate truncate">{c.commune}</div>
                              {isRendement ? (
                                <div className="text-xs text-muted mt-0.5">
                                  {c.loyerM2Annonces ? `${c.loyerM2Annonces.toFixed(1)} €/m²/${t("month")}` : "—"}
                                </div>
                              ) : (
                                <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                                  <div
                                    className="h-1.5 rounded-full bg-navy/30"
                                    style={{ width: getPriceBarWidth(prix, maxPrix) }}
                                  />
                                </div>
                              )}
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
                  const yieldPct = computeYield(c);
                  return (
                  <button
                    key={c.commune}
                    onClick={() => setSelectedCommune(c)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                      selectedCommune?.commune === c.commune ? "border-navy ring-2 ring-navy/20" : "border-card-border"
                    } bg-card`}
                  >
                    {isRendement ? (
                      <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getYieldColor(yieldPct)}`}>
                        {yieldPct != null ? `${yieldPct.toFixed(1)}%` : "—"}
                      </div>
                    ) : (
                      <div className={`flex h-10 w-16 items-center justify-center rounded text-xs font-bold ${getPriceColor(prix)}`}>
                        {prix ? `${(prix / 1000).toFixed(1)}k` : "—"}
                      </div>
                    )}
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

          {/* Détail commune sélectionnée */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {selectedCommune ? (
                <>
                  <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold text-navy">{selectedCommune.commune}</h2>
                        <p className="text-xs text-muted">{selectedCommune.canton} — {selectedCommune.periode}</p>
                      </div>
                      <MarketAlertButton commune={selectedCommune.commune} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className={`rounded-lg p-3 text-center ${priceField === "prixM2Existant" ? "bg-navy/15 ring-2 ring-navy/30" : "bg-navy/5"}`}>
                        <div className="text-xs text-muted">{t("existing")}</div>
                        <div className="text-lg font-bold text-navy">{selectedCommune.prixM2Existant ? formatEUR(selectedCommune.prixM2Existant) : "—"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${priceField === "prixM2VEFA" ? "bg-navy/15 ring-2 ring-navy/30" : "bg-navy/5"}`}>
                        <div className="text-xs text-muted">{t("newVefa")}</div>
                        <div className="text-lg font-bold text-navy">{selectedCommune.prixM2VEFA ? formatEUR(selectedCommune.prixM2VEFA) : "—"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${priceField === "prixM2Annonces" ? "bg-gold/20 ring-2 ring-gold/40" : "bg-gold/10"}`}>
                        <div className="text-xs text-muted">{t("listings")}</div>
                        <div className="text-lg font-bold text-gold-dark">{selectedCommune.prixM2Annonces ? formatEUR(selectedCommune.prixM2Annonces) : "—"}</div>
                        <div className="text-[10px] text-muted">/m²</div>
                      </div>
                      <div className="rounded-lg bg-teal/10 p-3 text-center">
                        <div className="text-xs text-muted">{t("rent")}</div>
                        <div className="text-lg font-bold text-teal">{selectedCommune.loyerM2Annonces ? `${selectedCommune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
                        <div className="text-[10px] text-muted">/m²/{t("month")}</div>
                      </div>
                    </div>

                    {/* Rendement brut */}
                    {(() => {
                      const yieldPct = computeYield(selectedCommune);
                      if (yieldPct == null) return null;
                      return (
                        <div className={`mt-3 rounded-lg p-3 text-center ${isRendement ? "ring-2 ring-teal/40" : ""} ${getYieldColor(yieldPct)}`}>
                          <div className="text-xs font-medium">{t("grossYield")}</div>
                          <div className="text-xl font-bold">{yieldPct.toFixed(2)} %</div>
                          <div className="text-[10px]">{t("yieldFormulaShort")}</div>
                        </div>
                      );
                    })()}

                    {/* Cycle de marché badge */}
                    {selectedCommune.quartiers && selectedCommune.quartiers.length > 0 && (() => {
                      // Determine dominant trend from quartier data
                      const counts = { hausse: 0, stable: 0, baisse: 0 };
                      for (const q of selectedCommune.quartiers) {
                        counts[q.tendance]++;
                      }
                      const dominant = (Object.entries(counts) as [keyof typeof counts, number][])
                        .sort((a, b) => b[1] - a[1])[0][0];
                      const cycle = getMarketCycle(dominant);
                      return (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-muted">{t("marketCycle")}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cycle.color} ${
                            dominant === "hausse" ? "bg-green-100" :
                            dominant === "baisse" ? "bg-red-100" :
                            "bg-gray-100"
                          }`}>
                            <span>{cycle.icon}</span>
                            <span>{cycle.phase}</span>
                          </span>
                        </div>
                      );
                    })()}

                    {/* Score de marche */}
                    {(() => {
                      const score = computeMarketScore(selectedCommune);
                      const color = getScoreColor(score.level);
                      const barColor = getScoreBarColor(score.level);
                      return (
                        <div className="mt-3 rounded-lg bg-background p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted">{t("marketScore")}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
                              {score.level} ({score.score}/100)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200">
                            <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${score.score}%` }} />
                          </div>
                          <div className="mt-1.5 grid grid-cols-2 gap-1">
                            {score.components.map((comp) => (
                              <div key={comp.label} className="flex items-center justify-between text-[10px]">
                                <span className="text-muted">{comp.label}</span>
                                <span className="font-mono font-medium text-slate">{comp.score}/25</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-3 text-xs text-muted">
                      {t("transactions", { count: selectedCommune.nbTransactions ?? 0 })} — {selectedCommune.source}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href="/estimation"
                        className="flex-1 rounded-lg bg-navy px-3 py-2 text-center text-xs font-medium text-white hover:bg-navy-light transition-colors"
                      >
                        {t("estimateProperty")}
                      </Link>
                      <Link
                        href="/valorisation"
                        className="flex-1 rounded-lg border border-navy px-3 py-2 text-center text-xs font-medium text-navy hover:bg-navy/5 transition-colors"
                      >
                        {t("proValuation")}
                      </Link>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <PdfButton
                        label="PDF"
                        filename={`carte-prix-${selectedCommune.commune.toLowerCase()}-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                        generateBlob={() =>
                          generateCartePdfBlob({
                            commune: selectedCommune.commune,
                            prixMoyenM2: selectedCommune.prixM2Existant || 0,
                            prixMedianM2: selectedCommune.prixM2Annonces || undefined,
                            nbTransactions: selectedCommune.nbTransactions || undefined,
                            fourchetteBasse: selectedCommune.prixM2Existant
                              ? Math.round(selectedCommune.prixM2Existant * 0.85)
                              : undefined,
                            fourchetteHaute: selectedCommune.prixM2VEFA || undefined,
                            details: [
                              ...(selectedCommune.prixM2VEFA
                                ? [{ label: "Prix VEFA/m2", value: `${formatEUR(selectedCommune.prixM2VEFA)}/m2` }]
                                : []),
                              ...(selectedCommune.loyerM2Annonces
                                ? [{ label: "Loyer/m2/mois", value: `${selectedCommune.loyerM2Annonces.toFixed(1)} EUR` }]
                                : []),
                            ],
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Démographie */}
                  {(() => {
                    const demo = getDemographics(selectedCommune.commune);
                    if (!demo) return null;
                    return (
                      <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-navy mb-2">{t("demographics")}</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted">{t("population")}</span><br/><span className="font-semibold">{demo.population.toLocaleString("fr-LU")}</span></div>
                          <div><span className="text-muted">{t("growth")}</span><br/><span className="font-semibold text-success">+{demo.croissancePct}%</span> <span className="text-[10px] text-muted">{t("tenYears")}</span></div>
                          <div><span className="text-muted">{t("density")}</span><br/><span className="font-semibold">{demo.densiteHabKm2} {t("densityUnit")}</span></div>
                          <div><span className="text-muted">{t("foreignersPct")}</span><br/><span className="font-semibold">{demo.pctEtrangers}%</span></div>
                          {demo.revenuMedian && <div><span className="text-muted">{t("medianIncome")}</span><br/><span className="font-semibold">{formatEUR(demo.revenuMedian)}/{t("perYear")}</span></div>}
                          {demo.tauxEmploi && <div><span className="text-muted">{t("employmentRate")}</span><br/><span className="font-semibold">{demo.tauxEmploi}%</span></div>}
                        </div>
                        <p className="mt-2 text-[10px] text-muted">{t("demographicsSource")}</p>
                      </div>
                    );
                  })()}

                  {/* Quartiers si dispo */}
                  {selectedCommune.quartiers && selectedCommune.quartiers.length > 0 && (
                    <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-navy mb-3">{t("neighborhoods")}</h3>
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
                    <p className="text-sm text-muted">{t("clickCommune")}</p>
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

    <SEOContent
      ns="carte"
      sections={[
        { titleKey: "prixTitle", contentKey: "prixContent" },
        { titleKey: "lireTitle", contentKey: "lireContent" },
        { titleKey: "evolutionTitle", contentKey: "evolutionContent" },
        { titleKey: "communesTitle", contentKey: "communesContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/estimation", labelKey: "estimation" },
        { href: "/indices", labelKey: "indices" },
      ]}
    />
    </>
  );
}
