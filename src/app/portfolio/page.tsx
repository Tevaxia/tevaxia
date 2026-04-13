"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";
import { listerEvaluations, type SavedValuation } from "@/lib/storage";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const STORAGE_KEY = "tevaxia_portfolio";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PortfolioAsset {
  id: string;
  nom: string;
  type: string;
  commune: string;
  valeur: number;
  loyerAnnuel: number;
  surface: number;
  dette: number;
}

/** Merged view: manual asset or saved valuation */
interface UnifiedProperty {
  id: string;
  nom: string;
  commune: string;
  valeur: number;
  surface: number;
  prixM2: number;
  energyClass?: string;
  type: string;
  date: string;
  source: "manual" | "saved";
}

type SortKey = "nom" | "commune" | "valeur" | "surface" | "prixM2" | "energyClass" | "date";
type SortDir = "asc" | "desc";

const EMPTY_ASSET: Omit<PortfolioAsset, "id"> = {
  nom: "", type: "Appartement", commune: "", valeur: 0, loyerAnnuel: 0, surface: 0, dette: 0,
};

const DEFAULT_ASSETS: PortfolioAsset[] = [
  { id: "1", nom: "Appartement Kirchberg", type: "Appartement", commune: "Luxembourg", valeur: 750000, loyerAnnuel: 28800, surface: 75, dette: 500000 },
  { id: "2", nom: "Bureau Cloche d'Or", type: "Bureau", commune: "Luxembourg", valeur: 1200000, loyerAnnuel: 72000, surface: 150, dette: 800000 },
];

/* ------------------------------------------------------------------ */
/*  Energy class helpers                                               */
/* ------------------------------------------------------------------ */

const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const ENERGY_SCORE: Record<string, number> = { A: 9, B: 8, C: 7, D: 6, E: 5, F: 4, G: 3, H: 2, I: 1 };
const ENERGY_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900",
  E: "bg-orange-400 text-white",
  F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white",
  H: "bg-red-700 text-white",
  I: "bg-red-900 text-white",
};

function scoreToClass(score: number): string {
  const idx = Math.max(0, Math.min(8, Math.round(9 - score)));
  return ENERGY_CLASSES[idx];
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

function loadFromStorage(): PortfolioAsset[] {
  if (typeof window === "undefined") return DEFAULT_ASSETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore corrupt data
  }
  return DEFAULT_ASSETS;
}

/* ------------------------------------------------------------------ */
/*  Extract energy class from saved valuation data                     */
/* ------------------------------------------------------------------ */

function extractEnergyClass(v: SavedValuation): string | undefined {
  const d = v.data as Record<string, unknown>;
  // Various keys used by different tools
  if (typeof d.classeEnergie === "string" && ENERGY_CLASSES.includes(d.classeEnergie)) return d.classeEnergie;
  if (typeof d.classe === "string" && ENERGY_CLASSES.includes(d.classe)) return d.classe;
  if (typeof d.energyClass === "string" && ENERGY_CLASSES.includes(d.energyClass)) return d.energyClass;
  return undefined;
}

function extractSurface(v: SavedValuation): number {
  const d = v.data as Record<string, unknown>;
  if (typeof d.surface === "number" && d.surface > 0) return d.surface;
  if (typeof d.surface === "string" && Number(d.surface) > 0) return Number(d.surface);
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Portfolio() {
  const [assets, setAssets] = useState<PortfolioAsset[]>(DEFAULT_ASSETS);
  const [savedValuations, setSavedValuations] = useState<SavedValuation[]>([]);
  const hydrated = useRef(false);

  // Sorting state for comparison table
  const [sortKey, setSortKey] = useState<SortKey>("valeur");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Tab state: "manual" | "saved" | "all"
  const [activeTab, setActiveTab] = useState<"manual" | "saved" | "all">("all");

  // Load from localStorage on mount (client only)
  useEffect(() => {
    const stored = loadFromStorage();
    setAssets(stored);
    setSavedValuations(listerEvaluations());
    hydrated.current = true;
  }, []);

  // Auto-save manual assets to localStorage
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch {
      // storage full or unavailable
    }
  }, [assets]);

  const updateAsset = (index: number, field: keyof PortfolioAsset, value: string | number) => {
    setAssets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof next[index][field] === "number" ? Number(value) : value };
      return next;
    });
  };

  const addAsset = () => setAssets((prev) => [...prev, { ...EMPTY_ASSET, id: String(Date.now()) }]);
  const removeAsset = (i: number) => setAssets((prev) => prev.filter((_, idx) => idx !== i));

  /* ---------------------------------------------------------------- */
  /*  Unified properties (manual + saved valuations)                   */
  /* ---------------------------------------------------------------- */

  const unifiedProperties = useMemo<UnifiedProperty[]>(() => {
    const fromManual: UnifiedProperty[] = assets.map((a) => ({
      id: `manual-${a.id}`,
      nom: a.nom || "Actif sans nom",
      commune: a.commune,
      valeur: a.valeur,
      surface: a.surface,
      prixM2: a.surface > 0 ? a.valeur / a.surface : 0,
      type: a.type,
      date: "",
      source: "manual" as const,
    }));

    const fromSaved: UnifiedProperty[] = savedValuations
      .filter((v) => v.valeurPrincipale && v.valeurPrincipale > 0)
      .map((v) => {
        const surface = extractSurface(v);
        return {
          id: `saved-${v.id}`,
          nom: v.nom,
          commune: v.commune || "",
          valeur: v.valeurPrincipale!,
          surface,
          prixM2: surface > 0 ? v.valeurPrincipale! / surface : 0,
          energyClass: extractEnergyClass(v),
          type: v.assetType || v.type,
          date: v.date,
          source: "saved" as const,
        };
      });

    return [...fromManual, ...fromSaved];
  }, [assets, savedValuations]);

  /* ---------------------------------------------------------------- */
  /*  Filtered properties based on active tab                          */
  /* ---------------------------------------------------------------- */

  const filteredProperties = useMemo(() => {
    if (activeTab === "manual") return unifiedProperties.filter((p) => p.source === "manual");
    if (activeTab === "saved") return unifiedProperties.filter((p) => p.source === "saved");
    return unifiedProperties;
  }, [unifiedProperties, activeTab]);

  /* ---------------------------------------------------------------- */
  /*  Portfolio summary stats                                          */
  /* ---------------------------------------------------------------- */

  const stats = useMemo(() => {
    const all = filteredProperties;
    const valeurTotale = all.reduce((s, a) => s + a.valeur, 0);
    const surfaceTotale = all.reduce((s, a) => s + a.surface, 0);
    const avgPrixM2 = surfaceTotale > 0 ? valeurTotale / surfaceTotale : 0;
    const nbProperties = all.length;

    // Energy stats (only from saved with energy class)
    const withEnergy = all.filter((p) => p.energyClass && ENERGY_SCORE[p.energyClass]);
    const avgEnergyScore = withEnergy.length > 0
      ? withEnergy.reduce((s, p) => s + (ENERGY_SCORE[p.energyClass!] || 0), 0) / withEnergy.length
      : 0;
    const avgEnergyClass = avgEnergyScore > 0 ? scoreToClass(avgEnergyScore) : null;

    // Manual-only stats
    const manualAssets = assets;
    const detteTotale = manualAssets.reduce((s, a) => s + a.dette, 0);
    const loyerTotal = manualAssets.reduce((s, a) => s + a.loyerAnnuel, 0);
    const valeurManuelle = manualAssets.reduce((s, a) => s + a.valeur, 0);
    const surfaceManuelle = manualAssets.reduce((s, a) => s + a.surface, 0);
    const equityTotale = valeurManuelle - detteTotale;
    const ltvGlobal = valeurManuelle > 0 ? detteTotale / valeurManuelle : 0;
    const rendementBrut = valeurManuelle > 0 ? loyerTotal / valeurManuelle : 0;
    const rendementEquity = equityTotale > 0 ? loyerTotal / equityTotale : 0;
    const loyerNet = loyerTotal * 0.7;
    const rendementNet = valeurManuelle > 0 ? loyerNet / valeurManuelle : 0;

    // By type
    const parType: Record<string, { count: number; valeur: number }> = {};
    for (const a of all) {
      const t = a.type || "Autre";
      if (!parType[t]) parType[t] = { count: 0, valeur: 0 };
      parType[t].count++;
      parType[t].valeur += a.valeur;
    }

    return {
      valeurTotale, surfaceTotale, avgPrixM2, nbProperties,
      avgEnergyScore, avgEnergyClass, withEnergyCount: withEnergy.length,
      detteTotale, loyerTotal, loyerNet, equityTotale, ltvGlobal,
      rendementBrut, rendementNet, rendementEquity,
      parType, nbActifs: manualAssets.length,
    };
  }, [filteredProperties, assets]);

  /* ---------------------------------------------------------------- */
  /*  Value evolution chart data                                       */
  /* ---------------------------------------------------------------- */

  const chartData = useMemo(() => {
    // Combine saved valuations (which have dates) to show cumulative portfolio value
    const withDates = savedValuations
      .filter((v) => v.valeurPrincipale && v.valeurPrincipale > 0 && v.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (withDates.length === 0) return [];

    // Group by date (day level) and show cumulative sum
    const dayMap = new Map<string, number>();
    let cumulative = 0;
    for (const v of withDates) {
      const day = new Date(v.date).toLocaleDateString("fr-LU", { day: "2-digit", month: "short", year: "numeric" });
      cumulative += v.valeurPrincipale!;
      dayMap.set(day, cumulative);
    }

    return Array.from(dayMap.entries()).map(([date, valeur]) => ({ date, valeur }));
  }, [savedValuations]);

  /* ---------------------------------------------------------------- */
  /*  Sortable comparison table                                        */
  /* ---------------------------------------------------------------- */

  const sortedProperties = useMemo(() => {
    const arr = [...filteredProperties];
    arr.sort((a, b) => {
      let va: string | number = 0;
      let vb: string | number = 0;
      switch (sortKey) {
        case "nom": va = a.nom.toLowerCase(); vb = b.nom.toLowerCase(); break;
        case "commune": va = a.commune.toLowerCase(); vb = b.commune.toLowerCase(); break;
        case "valeur": va = a.valeur; vb = b.valeur; break;
        case "surface": va = a.surface; vb = b.surface; break;
        case "prixM2": va = a.prixM2; vb = b.prixM2; break;
        case "energyClass": va = ENERGY_SCORE[a.energyClass || ""] || 0; vb = ENERGY_SCORE[b.energyClass || ""] || 0; break;
        case "date": va = a.date || ""; vb = b.date || ""; break;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredProperties, sortKey, sortDir]);

  // Best / worst performers (by value)
  const bestId = useMemo(() => {
    if (filteredProperties.length === 0) return null;
    return filteredProperties.reduce((best, p) => p.prixM2 > best.prixM2 ? p : best, filteredProperties[0]).id;
  }, [filteredProperties]);

  const worstId = useMemo(() => {
    const withSurface = filteredProperties.filter((p) => p.prixM2 > 0);
    if (withSurface.length === 0) return null;
    return withSurface.reduce((worst, p) => p.prixM2 < worst.prixM2 ? p : worst, withSurface[0]).id;
  }, [filteredProperties]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return " \u2195";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  /* ---------------------------------------------------------------- */
  /*  PDF export                                                       */
  /* ---------------------------------------------------------------- */

  const handlePdfExport = useCallback(async () => {
    const { generatePortfolioDashboardPdfBlob } = await import("@/components/PortfolioPdf");
    const blob = await generatePortfolioDashboardPdfBlob({
      properties: filteredProperties,
      stats: {
        valeurTotale: stats.valeurTotale,
        avgPrixM2: stats.avgPrixM2,
        nbProperties: stats.nbProperties,
        avgEnergyClass: stats.avgEnergyClass,
        surfaceTotale: stats.surfaceTotale,
      },
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toLocaleDateString("fr-LU").replace(/\//g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredProperties, stats]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">Portfolio immobilier</h1>
            <p className="mt-2 text-muted">Agregez vos biens et suivez la performance globale</p>
          </div>
          <button
            onClick={handlePdfExport}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Exporter PDF
          </button>
        </div>

        {/* ============================================================ */}
        {/*  1. PORTFOLIO SUMMARY CARDS                                   */}
        {/* ============================================================ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total value */}
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white">
            <div className="text-xs text-white/60">Valeur totale</div>
            <div className="text-2xl font-bold mt-1">{formatEUR(stats.valeurTotale)}</div>
            <div className="mt-2 text-xs text-white/50">{stats.nbProperties} bien{stats.nbProperties > 1 ? "s" : ""}</div>
          </div>

          {/* Average price / m2 */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs text-muted">Prix moyen / m2</div>
            <div className="text-2xl font-bold text-navy mt-1">
              {stats.avgPrixM2 > 0 ? formatEUR(stats.avgPrixM2) : "--"}
            </div>
            <div className="mt-2 text-xs text-muted">{stats.surfaceTotale > 0 ? `${Math.round(stats.surfaceTotale)} m2 total` : "Aucune surface"}</div>
          </div>

          {/* Number of properties */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs text-muted">Nombre de biens</div>
            <div className="text-2xl font-bold text-navy mt-1">{stats.nbProperties}</div>
            <div className="mt-2 text-xs text-muted">
              {assets.length} manuel{assets.length > 1 ? "s" : ""} + {savedValuations.filter((v) => v.valeurPrincipale && v.valeurPrincipale > 0).length} evaluation{savedValuations.filter((v) => v.valeurPrincipale && v.valeurPrincipale > 0).length > 1 ? "s" : ""}
            </div>
          </div>

          {/* Average energy score */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs text-muted">Score energetique moyen</div>
            {stats.avgEnergyClass ? (
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold ${ENERGY_COLORS[stats.avgEnergyClass] || "bg-gray-200 text-gray-700"}`}>
                  {stats.avgEnergyClass}
                </span>
                <span className="text-sm text-slate-600">{stats.withEnergyCount} bien{stats.withEnergyCount > 1 ? "s" : ""} avec CPE</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-navy mt-1">--</div>
            )}
            <div className="mt-2 text-xs text-muted">
              {stats.avgEnergyClass ? `Score ${stats.avgEnergyScore.toFixed(1)} / 9` : "Aucune classe CPE"}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  2. VALUE EVOLUTION CHART                                     */}
        {/* ============================================================ */}
        {chartData.length > 1 && (
          <div className="mb-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-navy mb-1">Evolution de la valeur du portfolio</h3>
            <p className="text-[10px] text-muted mb-4">Valeur cumulee des evaluations sauvegardees, par date d&apos;ajout</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value) => [formatEUR(Number(value)), "Valeur"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e2db" }}
                />
                <Area
                  type="monotone"
                  dataKey="valeur"
                  stroke="#1B2A4A"
                  fill="url(#colorPortfolio)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#1B2A4A" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length <= 1 && savedValuations.length === 0 && (
          <div className="mb-8 rounded-xl border border-dashed border-card-border bg-card/50 p-8 text-center">
            <p className="text-sm text-muted">
              Sauvegardez des evaluations depuis les outils (Estimation, Valorisation, etc.) pour voir l&apos;evolution de votre portfolio dans le temps.
            </p>
            <Link href="/estimation" className="mt-3 inline-block text-sm font-medium text-navy hover:underline">
              Commencer une estimation &rarr;
            </Link>
          </div>
        )}

        {/* ============================================================ */}
        {/*  3. PROPERTY COMPARISON TABLE                                 */}
        {/* ============================================================ */}
        {unifiedProperties.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-navy">Comparaison des biens</h2>
              {/* Tab filter */}
              <div className="flex items-center gap-1 rounded-lg border border-card-border bg-background p-0.5">
                {(["all", "manual", "saved"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-navy text-white"
                        : "text-muted hover:text-navy"
                    }`}
                  >
                    {tab === "all" ? "Tous" : tab === "manual" ? "Manuels" : "Evaluations"}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    {([
                      ["nom", "Nom"],
                      ["commune", "Commune"],
                      ["valeur", "Valeur"],
                      ["surface", "Surface"],
                      ["prixM2", "Prix/m2"],
                      ["energyClass", "Classe CPE"],
                      ["date", "Date"],
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <th
                        key={key}
                        onClick={() => toggleSort(key)}
                        className="px-3 py-2.5 text-left font-semibold text-navy cursor-pointer select-none hover:bg-navy/5 transition-colors whitespace-nowrap"
                      >
                        {label}{sortIcon(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProperties.map((p) => {
                    const isBest = p.id === bestId && filteredProperties.length > 2;
                    const isWorst = p.id === worstId && filteredProperties.length > 2;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-card-border/50 transition-colors ${
                          isBest ? "bg-green-50" : isWorst ? "bg-red-50" : "hover:bg-background/50"
                        }`}
                      >
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            {p.nom}
                            {isBest && <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">Meilleur</span>}
                            {isWorst && <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Plus faible</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">{p.commune || "--"}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatEUR(p.valeur)}</td>
                        <td className="px-3 py-2 text-right font-mono">{p.surface > 0 ? `${p.surface} m2` : "--"}</td>
                        <td className="px-3 py-2 text-right font-mono">{p.prixM2 > 0 ? formatEUR(p.prixM2) : "--"}</td>
                        <td className="px-3 py-2">
                          {p.energyClass ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${ENERGY_COLORS[p.energyClass] || "bg-gray-200"}`}>
                              {p.energyClass}
                            </span>
                          ) : (
                            <span className="text-muted">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted whitespace-nowrap">
                          {p.date ? new Date(p.date).toLocaleDateString("fr-LU") : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  ORIGINAL PORTFOLIO: KPIs + Manual asset editor               */}
        {/* ============================================================ */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* KPIs */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white">
              <div className="text-xs text-white/60">Valeur totale (biens manuels)</div>
              <div className="text-3xl font-bold mt-1">{formatEUR(assets.reduce((s, a) => s + a.valeur, 0))}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-white/50">Equity</span><br/><span className="font-semibold">{formatEUR(stats.equityTotale)}</span></div>
                <div><span className="text-white/50">Dette</span><br/><span className="font-semibold">{formatEUR(stats.detteTotale)}</span></div>
              </div>
            </div>

            <ResultPanel
              title="Indicateurs portfolio"
              lines={[
                { label: "Nombre d'actifs", value: String(stats.nbActifs) },
                { label: "Surface totale", value: `${assets.reduce((s, a) => s + a.surface, 0)} m2` },
                { label: "Loyer total annuel", value: formatEUR(stats.loyerTotal) },
                { label: "Rendement brut", value: formatPct(stats.rendementBrut) },
                { label: "Rendement net estime (-30% charges)", value: formatPct(stats.rendementNet) },
                { label: "Rendement sur equity", value: formatPct(stats.rendementEquity), highlight: true },
                { label: "LTV global", value: formatPct(stats.ltvGlobal), warning: stats.ltvGlobal > 0.75 },
              ]}
            />

            {/* Repartition */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-navy mb-3">Repartition par type</h3>
              <div className="space-y-2">
                {Object.entries(stats.parType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-slate">{type} ({data.count})</span>
                    <div className="text-right">
                      <span className="font-mono font-semibold">{formatEUR(data.valeur)}</span>
                      <span className="text-xs text-muted ml-2">({stats.valeurTotale > 0 ? (data.valeur / stats.valeurTotale * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actifs manuels */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">Actifs manuels ({assets.length})</h2>
              <button onClick={addAsset} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">+ Ajouter</button>
            </div>

            {assets.map((asset, i) => (
              <div key={asset.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-navy">{asset.nom || `Actif ${i + 1}`}</span>
                  <div className="flex items-center gap-3">
                    <Link href="/estimation" className="text-xs text-navy hover:underline font-medium">Re-estimer</Link>
                    <button onClick={() => removeAsset(i)} className="text-xs text-error hover:underline">Supprimer</button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <InputField label="Nom" type="text" value={asset.nom} onChange={(v) => updateAsset(i, "nom", v)} />
                  <InputField label="Type" type="select" value={asset.type} onChange={(v) => updateAsset(i, "type", v)} options={[
                    { value: "Appartement", label: "Appartement" },
                    { value: "Maison", label: "Maison" },
                    { value: "Bureau", label: "Bureau" },
                    { value: "Commerce", label: "Commerce" },
                    { value: "Logistique", label: "Logistique" },
                    { value: "Terrain", label: "Terrain" },
                    { value: "Autre", label: "Autre" },
                  ]} />
                  <InputField label="Commune" type="text" value={asset.commune} onChange={(v) => updateAsset(i, "commune", v)} />
                  <InputField label="Surface" value={asset.surface} onChange={(v) => updateAsset(i, "surface", v)} suffix="m2" />
                  <InputField label="Valeur" value={asset.valeur} onChange={(v) => updateAsset(i, "valeur", v)} suffix="EUR" />
                  <InputField label="Loyer annuel" value={asset.loyerAnnuel} onChange={(v) => updateAsset(i, "loyerAnnuel", v)} suffix="EUR" />
                  <InputField label="Dette" value={asset.dette} onChange={(v) => updateAsset(i, "dette", v)} suffix="EUR" />
                  <div className="flex items-end text-xs text-muted pb-2">
                    Rdt: {asset.valeur > 0 ? formatPct(asset.loyerAnnuel / asset.valeur) : "--"}
                  </div>
                </div>
              </div>
            ))}

            {/* Tableau recapitulatif actifs manuels */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Actif</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Valeur</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Loyer</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Rdt brut</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">LTV</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">% portfolio</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => {
                    const totalManuel = assets.reduce((s, x) => s + x.valeur, 0);
                    return (
                      <tr key={a.id} className="border-b border-card-border/50">
                        <td className="px-3 py-1.5 font-medium">{a.nom}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.valeur)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.loyerAnnuel)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{a.valeur > 0 ? formatPct(a.loyerAnnuel / a.valeur) : "--"}</td>
                        <td className={`px-3 py-1.5 text-right font-mono ${a.valeur > 0 && a.dette / a.valeur > 0.75 ? "text-error" : ""}`}>
                          {a.valeur > 0 ? formatPct(a.dette / a.valeur) : "--"}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted">
                          {totalManuel > 0 ? `${(a.valeur / totalManuel * 100).toFixed(0)}%` : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
