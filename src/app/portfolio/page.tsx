"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";
import { listerEvaluations, type SavedValuation } from "@/lib/storage";
import SEOContent from "@/components/SEOContent";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  Line,
  ComposedChart,
  CartesianGrid,
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
  const t = useTranslations("portfolio");
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
      nom: a.nom || t("unnamedAsset"),
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
  }, [assets, savedValuations, t]);

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
  /*  Cash flow 12 mois glissants                                      */
  /* ---------------------------------------------------------------- */

  const cashFlow12m = useMemo(() => {
    const monthlyGrossIncome = stats.loyerTotal / 12;
    // Hypothèses simplifiées (paramétrables à terme)
    const vacancyRate = 0.05;    // 5 % vacance moyenne
    const chargesRate = 0.15;    // 15 % charges non récupérables
    const mortgageRate = 0.035;  // 3.5 % taux
    const monthlyInterest = stats.detteTotale * (mortgageRate / 12);

    const effectiveIncome = monthlyGrossIncome * (1 - vacancyRate);
    const charges = effectiveIncome * chargesRate;
    const netMonthly = effectiveIncome - charges - monthlyInterest;

    const now = new Date();
    const months: { label: string; income: number; charges: number; dette: number; net: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString("fr-LU", { month: "short", year: "2-digit" });
      // Saisonnalité légère : décembre/janvier = -10 %, juin-août = +5 %
      const month = d.getMonth();
      const season = (month === 11 || month === 0) ? 0.90 : (month >= 5 && month <= 7) ? 1.05 : 1.0;
      months.push({
        label,
        income: Math.round(effectiveIncome * season),
        charges: -Math.round(charges),
        dette: -Math.round(monthlyInterest),
        net: Math.round(netMonthly * season),
      });
    }
    return months;
  }, [stats.loyerTotal, stats.detteTotale]);

  const cashFlowAnnuel = useMemo(() => {
    const income = cashFlow12m.reduce((s, m) => s + m.income, 0);
    const charges = cashFlow12m.reduce((s, m) => s + Math.abs(m.charges), 0);
    const dette = cashFlow12m.reduce((s, m) => s + Math.abs(m.dette), 0);
    const net = cashFlow12m.reduce((s, m) => s + m.net, 0);
    return { income, charges, dette, net };
  }, [cashFlow12m]);

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

  /* ----------------------------------------------------------------- */
  /*  Export fiscal LU (formulaire 100 F — annexe 190 revenus locatifs) */
  /* ----------------------------------------------------------------- */
  const handleFiscalExport = useCallback(() => {
    const year = new Date().getFullYear() - 1; // déclaration porte sur l'exercice précédent
    const rate = 0.035; // hypothèse taux moyen
    const pnoRate = 0.005; // 0.5 % de la valeur
    const taxeFonciereRate = 0.001; // 0.1 % de la valeur (indicatif, varie par commune)
    const gestionRate = 0.05; // forfait 5 % des loyers
    // Amortissement : dégressif selon ancienneté (règlement grand-ducal 21/12/2007)
    const amortFixed = 0.02; // 2 % par défaut

    const lines: string[][] = [];
    const header = [
      "Bien",
      "Commune",
      "Surface (m²)",
      "Loyer annuel brut (€)",
      "Intérêts emprunt (€)",
      "Assurance PNO (€)",
      "Taxe foncière (€)",
      "Frais gestion 5 % (€)",
      "Amortissement 2 % (€)",
      "Total charges déductibles (€)",
      "Revenu net locatif (€)",
    ];
    lines.push(header);

    let totalRevenus = 0;
    let totalInterets = 0;
    let totalPNO = 0;
    let totalTF = 0;
    let totalGestion = 0;
    let totalAmort = 0;
    let totalCharges = 0;
    let totalNet = 0;

    for (const a of assets) {
      const loyer = a.loyerAnnuel;
      const interets = a.dette * rate;
      const pno = a.valeur * pnoRate;
      const tf = a.valeur * taxeFonciereRate;
      const gestion = loyer * gestionRate;
      const amort = a.valeur * amortFixed;
      const charges = interets + pno + tf + gestion + amort;
      const net = loyer - charges;

      totalRevenus += loyer;
      totalInterets += interets;
      totalPNO += pno;
      totalTF += tf;
      totalGestion += gestion;
      totalAmort += amort;
      totalCharges += charges;
      totalNet += net;

      lines.push([
        a.nom || "—",
        a.commune || "—",
        String(a.surface),
        loyer.toFixed(0),
        interets.toFixed(0),
        pno.toFixed(0),
        tf.toFixed(0),
        gestion.toFixed(0),
        amort.toFixed(0),
        charges.toFixed(0),
        net.toFixed(0),
      ]);
    }

    lines.push([
      "TOTAL",
      "",
      "",
      totalRevenus.toFixed(0),
      totalInterets.toFixed(0),
      totalPNO.toFixed(0),
      totalTF.toFixed(0),
      totalGestion.toFixed(0),
      totalAmort.toFixed(0),
      totalCharges.toFixed(0),
      totalNet.toFixed(0),
    ]);

    const preamble = [
      `# Déclaration impôt sur le revenu ${year} — Annexe 190 (revenus locatifs)`,
      `# Généré par tevaxia.lu le ${new Date().toLocaleDateString("fr-LU")}`,
      `# Base légale : art. 99 LIR (revenus location), règlement GD 21/12/2007 (amortissement)`,
      `# Hypothèses : taux emprunt ${(rate * 100).toFixed(1)}%, PNO ${(pnoRate * 100).toFixed(2)}% de la valeur, taxe foncière ${(taxeFonciereRate * 100).toFixed(2)}% de la valeur, gestion forfaitaire ${(gestionRate * 100).toFixed(0)}%, amortissement linéaire ${(amortFixed * 100).toFixed(0)}%`,
      `# À reporter dans le formulaire 100 F (ligne 41 + annexe dédiée) ou 100 bis (conjoint séparé).`,
      ``,
    ];
    const csv = preamble.join("\n") + lines.map((r) => r.map((c) => (c.includes(",") || c.includes(";") ? `"${c}"` : c)).join(";")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `declaration-100F-annexe-190-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [assets]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
            <p className="mt-2 text-muted">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleFiscalExport}
              title={t("exportFiscalHint")}
              className="inline-flex items-center gap-2 rounded-lg border border-navy bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-navy/5 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h5a1 1 0 110 2H6a1 1 0 01-1-1z" />
              </svg>
              {t("exportFiscal")}
            </button>
            <button
              onClick={handlePdfExport}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {t("exportPdf")}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  1. PORTFOLIO SUMMARY CARDS                                   */}
        {/* ============================================================ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total value */}
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white">
            <div className="text-xs text-white/60">{t("totalValue")}</div>
            <div className="text-2xl font-bold mt-1">{formatEUR(stats.valeurTotale)}</div>
            <div className="mt-2 text-xs text-white/50">{t("propertiesCount", { count: stats.nbProperties })}</div>
          </div>

          {/* Average price / m2 */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs text-muted">{t("avgPriceM2")}</div>
            <div className="text-2xl font-bold text-navy mt-1">
              {stats.avgPrixM2 > 0 ? formatEUR(stats.avgPrixM2) : "--"}
            </div>
            <div className="mt-2 text-xs text-muted">{stats.surfaceTotale > 0 ? `${Math.round(stats.surfaceTotale)} m2 ${t("total")}` : t("noSurface")}</div>
          </div>

          {/* Number of properties */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs text-muted">{t("numberOfProperties")}</div>
            <div className="text-2xl font-bold text-navy mt-1">{stats.nbProperties}</div>
            <div className="mt-2 text-xs text-muted">
              {t("manualCount", { count: assets.length })} + {t("evaluationCount", { count: savedValuations.filter((v) => v.valeurPrincipale && v.valeurPrincipale > 0).length })}
            </div>
          </div>

          {/* Average energy score */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs text-muted">{t("avgEnergyScore")}</div>
            {stats.avgEnergyClass ? (
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold ${ENERGY_COLORS[stats.avgEnergyClass] || "bg-gray-200 text-gray-700"}`}>
                  {stats.avgEnergyClass}
                </span>
                <span className="text-sm text-slate-600">{t("propertiesWithEPC", { count: stats.withEnergyCount })}</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-navy mt-1">--</div>
            )}
            <div className="mt-2 text-xs text-muted">
              {stats.avgEnergyClass ? `${t("score")} ${stats.avgEnergyScore.toFixed(1)} / 9` : t("noEPC")}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  2. VALUE EVOLUTION CHART                                     */}
        {/* ============================================================ */}
        {chartData.length > 1 && (
          <div className="mb-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-navy mb-1">{t("chartTitle")}</h3>
            <p className="text-[10px] text-muted mb-4">{t("chartSubtitle")}</p>
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
                  formatter={(value) => [formatEUR(Number(value)), t("value")]}
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
              {t("emptyChartHint")}
            </p>
            <Link href="/estimation" className="mt-3 inline-block text-sm font-medium text-navy hover:underline">
              {t("startEstimation")} &rarr;
            </Link>
          </div>
        )}

        {/* ============================================================ */}
        {/*  2bis. CASH FLOW 12 MOIS GLISSANTS                            */}
        {/* ============================================================ */}
        {stats.loyerTotal > 0 && (
          <div className="mb-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-navy">{t("cashflowTitle")}</h3>
                <p className="mt-0.5 text-[10px] text-muted">{t("cashflowSubtitle")}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted">{t("cashflowNetAnnuel")}</div>
                <div className={`text-lg font-mono font-bold ${cashFlowAnnuel.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {formatEUR(cashFlowAnnuel.net)}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={cashFlow12m} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatEUR(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" stackId="a" fill="#059669" name={t("cashflowIncome")} />
                <Bar dataKey="charges" stackId="a" fill="#d97706" name={t("cashflowCharges")} />
                <Bar dataKey="dette" stackId="a" fill="#dc2626" name={t("cashflowDette")} />
                <Line type="monotone" dataKey="net" stroke="#1B2A4A" strokeWidth={2.5} dot={{ r: 3 }} name={t("cashflowNet")} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1.5">
                <div className="text-[10px] uppercase text-emerald-700">{t("cashflowIncome")}</div>
                <div className="font-mono font-bold text-emerald-900">{formatEUR(cashFlowAnnuel.income)}</div>
              </div>
              <div className="rounded bg-amber-50 border border-amber-200 px-2 py-1.5">
                <div className="text-[10px] uppercase text-amber-700">{t("cashflowCharges")}</div>
                <div className="font-mono font-bold text-amber-900">- {formatEUR(cashFlowAnnuel.charges)}</div>
              </div>
              <div className="rounded bg-rose-50 border border-rose-200 px-2 py-1.5">
                <div className="text-[10px] uppercase text-rose-700">{t("cashflowDette")}</div>
                <div className="font-mono font-bold text-rose-900">- {formatEUR(cashFlowAnnuel.dette)}</div>
              </div>
              <div className={`rounded border px-2 py-1.5 ${cashFlowAnnuel.net >= 0 ? "bg-navy/5 border-navy/20" : "bg-rose-50 border-rose-300"}`}>
                <div className="text-[10px] uppercase text-navy/70">{t("cashflowNet")}</div>
                <div className={`font-mono font-bold ${cashFlowAnnuel.net >= 0 ? "text-navy" : "text-rose-900"}`}>{formatEUR(cashFlowAnnuel.net)}</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted">{t("cashflowNote")}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/*  3. PROPERTY COMPARISON TABLE                                 */}
        {/* ============================================================ */}
        {unifiedProperties.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-navy">{t("comparisonTitle")}</h2>
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
                    {tab === "all" ? t("tabAll") : tab === "manual" ? t("tabManual") : t("tabEvaluations")}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    {([
                      ["nom", t("headerName")],
                      ["commune", t("headerCommune")],
                      ["valeur", t("headerValue")],
                      ["surface", t("headerSurface")],
                      ["prixM2", t("headerPriceM2")],
                      ["energyClass", t("headerEnergy")],
                      ["date", t("headerDate")],
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
                            {isBest && <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">{t("best")}</span>}
                            {isWorst && <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">{t("worst")}</span>}
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
              <div className="text-xs text-white/60">{t("totalValueManual")}</div>
              <div className="text-3xl font-bold mt-1">{formatEUR(assets.reduce((s, a) => s + a.valeur, 0))}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-white/50">{t("equity")}</span><br/><span className="font-semibold">{formatEUR(stats.equityTotale)}</span></div>
                <div><span className="text-white/50">{t("debt")}</span><br/><span className="font-semibold">{formatEUR(stats.detteTotale)}</span></div>
              </div>
            </div>

            <ResultPanel
              title={t("kpiTitle")}
              lines={[
                { label: t("kpiNbAssets"), value: String(stats.nbActifs) },
                { label: t("kpiTotalSurface"), value: `${assets.reduce((s, a) => s + a.surface, 0)} m2` },
                { label: t("kpiAnnualRent"), value: formatEUR(stats.loyerTotal) },
                { label: t("kpiGrossYield"), value: formatPct(stats.rendementBrut) },
                { label: t("kpiNetYield"), value: formatPct(stats.rendementNet) },
                { label: t("kpiEquityYield"), value: formatPct(stats.rendementEquity), highlight: true },
                { label: t("kpiLTV"), value: formatPct(stats.ltvGlobal), warning: stats.ltvGlobal > 0.75 },
              ]}
            />

            {/* Repartition */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-navy mb-3">{t("distributionByType")}</h3>
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
              <h2 className="text-base font-semibold text-navy">{t("manualAssets", { count: assets.length })}</h2>
              <button onClick={addAsset} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">{t("addAsset")}</button>
            </div>

            {assets.map((asset, i) => (
              <div key={asset.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-navy">{asset.nom || `${t("asset")} ${i + 1}`}</span>
                  <div className="flex items-center gap-3">
                    <Link href="/estimation" className="text-xs text-navy hover:underline font-medium">{t("reEstimate")}</Link>
                    <button onClick={() => removeAsset(i)} className="text-xs text-error hover:underline">{t("delete")}</button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <InputField label={t("fieldName")} type="text" value={asset.nom} onChange={(v) => updateAsset(i, "nom", v)} />
                  <InputField label={t("fieldType")} type="select" value={asset.type} onChange={(v) => updateAsset(i, "type", v)} options={[
                    { value: "Appartement", label: t("typeAppartement") },
                    { value: "Maison", label: t("typeMaison") },
                    { value: "Bureau", label: t("typeBureau") },
                    { value: "Commerce", label: t("typeCommerce") },
                    { value: "Logistique", label: t("typeLogistique") },
                    { value: "Terrain", label: t("typeTerrain") },
                    { value: "Autre", label: t("typeAutre") },
                  ]} />
                  <InputField label={t("fieldCommune")} type="text" value={asset.commune} onChange={(v) => updateAsset(i, "commune", v)} />
                  <InputField label={t("fieldSurface")} value={asset.surface} onChange={(v) => updateAsset(i, "surface", v)} suffix="m2" />
                  <InputField label={t("fieldValue")} value={asset.valeur} onChange={(v) => updateAsset(i, "valeur", v)} suffix="EUR" />
                  <InputField label={t("fieldAnnualRent")} value={asset.loyerAnnuel} onChange={(v) => updateAsset(i, "loyerAnnuel", v)} suffix="EUR" />
                  <InputField label={t("fieldDebt")} value={asset.dette} onChange={(v) => updateAsset(i, "dette", v)} suffix="EUR" />
                  <div className="flex items-end text-xs text-muted pb-2">
                    {t("yield")}: {asset.valeur > 0 ? formatPct(asset.loyerAnnuel / asset.valeur) : "--"}
                  </div>
                </div>
              </div>
            ))}

            {/* Tableau recapitulatif actifs manuels */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">{t("headerAsset")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("headerValue")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("headerRent")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("headerGrossYield")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("headerLTV")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("headerPortfolioPct")}</th>
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

      <SEOContent
        ns="portfolio"
        sections={[
          { titleKey: "gestionTitle", contentKey: "gestionContent" },
          { titleKey: "indicateursTitle", contentKey: "indicateursContent" },
          { titleKey: "performanceTitle", contentKey: "performanceContent" },
          { titleKey: "energieTitle", contentKey: "energieContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/valorisation", labelKey: "valorisation" },
          { href: "/dcf-multi", labelKey: "dcfMulti" },
          { href: "/outils-bancaires", labelKey: "bancaire" },
        ]}
      />
    </div>
  );
}
