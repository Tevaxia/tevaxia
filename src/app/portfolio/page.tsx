"use client";
import { useAuth } from "@/components/AuthProvider";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";
import { listerEvaluationsAsync, type SavedValuation } from "@/lib/storage";
import SEOContent from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Bar, Legend, Line, ComposedChart, CartesianGrid } from "recharts";

import { readPortfolio, writePortfolio, portfolioRecovery, isPropertyValuation, valuationSurface, portfolioCsv, portfolioScenario, type PortfolioAsset } from "@/lib/manual-portfolio";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Energy class helpers                                               */
/* ------------------------------------------------------------------ */

const ENERGY_CLASSES = ["A+", "A", "B", "C", "D", "E", "F", "G", "H", "I"];
const ENERGY_SCORE: Record<string, number> = { "A+": 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 4, G: 3, H: 2, I: 1 };
const ENERGY_COLORS: Record<string, string> = {
  "A+": "bg-green-700 text-white",
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
  const idx = Math.max(0, Math.min(9, Math.round(10 - score)));
  return ENERGY_CLASSES[idx];
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Portfolio() {
  const { user, loading } = useAuth();
  const t = useTranslations("portfolio");
  if (loading) return <div aria-busy="true" className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
    <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
    <p className="mt-2 text-muted">{t("subtitle")}</p>
  </div>;
  return <PortfolioContent key={user?.id ?? "guest"}/>;
}

function PortfolioContent() {
  const { user: valuationUser } = useAuth();
  const t = useTranslations("portfolio");
  const locale=useLocale();
  const lp=locale==="fr"?"":`/${locale}`;
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [archiveError,setArchiveError]=useState(false);
  const [archiveLoaded,setArchiveLoaded]=useState(false);
  const [savedValuations, setSavedValuations] = useState<SavedValuation[]>([]);
  const assetsRef=useRef<PortfolioAsset[]>([]);
  const [manualLoaded,setManualLoaded]=useState(false);
  const [manualError,setManualError]=useState(false);
  const [writeError,setWriteError]=useState(false);
  const [recovery,setRecovery]=useState<string|null>(null);
  const live=useRef(true),pdfRunning=useRef(false);
  const [pdfBusy,setPdfBusy]=useState(false);
  const [pdfError,setPdfError]=useState(false);

  // Sorting state for comparison table
  const [sortKey, setSortKey] = useState<SortKey>("valeur");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Tab state: "manual" | "saved" | "all"
  const [activeTab, setActiveTab] = useState<"manual" | "saved" | "all">("manual");

  useEffect(() => {
    let active=true;live.current=true;
    Promise.resolve().then(()=>{
      if(!active)return;
      try{const stored=readPortfolio(valuationUser?.id??null);assetsRef.current=stored;setAssets(stored);setManualLoaded(true);}
      catch{setManualError(true);}
      try{setRecovery(portfolioRecovery(valuationUser?.id??null));}catch{setManualError(true);}
    });
    listerEvaluationsAsync(valuationUser?.id??null).then(({items,cloudError})=>{if(active){setSavedValuations(items);setArchiveError(cloudError);setArchiveLoaded(true);}}).catch(()=>{if(active){setArchiveError(true);setArchiveLoaded(true);}});
    return()=>{active=false;live.current=false;};
  }, [valuationUser?.id]);

  const commitAssets=(next:PortfolioAsset[])=>{
    if(!manualLoaded||manualError)return;
    try{writePortfolio(next,valuationUser?.id??null);assetsRef.current=next;setAssets(next);setWriteError(false);}
    catch{setWriteError(true);}
  };
  const updateAsset = (index: number, field: keyof PortfolioAsset, value: string | number) => {
    const next=[...assetsRef.current];
    next[index]={...next[index],[field]:typeof next[index][field]==="number"?Number(value):value};
    commitAssets(next);
  };
  const addAsset=()=>commitAssets([...assetsRef.current,{...EMPTY_ASSET,id:crypto.randomUUID()}]);
  const removeAsset=(index:number)=>commitAssets(assetsRef.current.filter((_,i)=>i!==index));
  const download=(text:string,name:string)=>{const url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);};

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
      .filter(isPropertyValuation)
      .map((v) => {
        const surface = valuationSurface(v);
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
    const valuedSurface=all.filter(p=>p.surface>0);
    const avgPrixM2 = surfaceTotale > 0 ? valuedSurface.reduce((sum,p)=>sum+p.valeur,0) / surfaceTotale : 0;
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
      detteTotale, loyerTotal, equityTotale, ltvGlobal,
      rendementBrut,
      parType, nbActifs: manualAssets.length,
    };
  }, [filteredProperties, assets]);

  /* ---------------------------------------------------------------- */
  /*  Value evolution chart data                                       */
  /* ---------------------------------------------------------------- */

  const chartData = useMemo(() => {
    // Independent saved valuation records, not a cumulative property performance series.
    return savedValuations.filter(isPropertyValuation).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)).map(v=>({date:new Date(v.date).toLocaleDateString(locale==='lb'?'de-LU':locale),valeur:v.valeurPrincipale!}));
  }, [savedValuations,locale]);

  /* ---------------------------------------------------------------- */
  /*  Cash flow 12 mois glissants                                      */
  /* ---------------------------------------------------------------- */

  const cashFlow12m = useMemo(() => {
    const scenario=portfolioScenario(stats.loyerTotal,stats.detteTotale);
    const now=new Date();
    return Array.from({length:12},(_,i)=>({label:new Date(now.getFullYear(),now.getMonth()+i,1).toLocaleDateString(locale==='lb'?'de-LU':locale,{month:'short',year:'2-digit'}),income:scenario.income,charges:-scenario.charges,dette:-scenario.interest,net:scenario.net}));
  }, [stats.loyerTotal, stats.detteTotale,locale]);

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
    const known=filteredProperties.filter(p=>p.surface>0);
    if (known.length === 0) return null;
    return known.reduce((best, p) => p.prixM2 > best.prixM2 ? p : best, known[0]).id;
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
    if(pdfRunning.current)return;
    pdfRunning.current=true;setPdfBusy(true);setPdfError(false);
    try {
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
    if(!live.current)return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`;
    a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch{if(live.current)setPdfError(true);}
    finally{pdfRunning.current=false;if(live.current)setPdfBusy(false);}
  }, [filteredProperties, stats]);

  /* ----------------------------------------------------------------- */
  /*  Export fiscal LU (formulaire 100 F — annexe 190 revenus locatifs) */
  /* ----------------------------------------------------------------- */
  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="bg-background py-8 sm:py-12">
      {!archiveLoaded && <p role="status" className="mx-auto max-w-7xl px-4 text-sm">{t("archiveLoading")}</p>}
      {archiveError && <p role="alert" className="mx-auto max-w-7xl px-4 text-sm text-amber-800">{t("archiveError")}</p>}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {pdfError&&<p role="alert" className="mb-4 text-sm text-rose-800">{t("exportError")}</p>}
        {(manualError||writeError)&&<p role="alert" className="mb-4 rounded border border-rose-300 p-3 text-sm text-rose-800">{t("storageError")}</p>}
        {recovery&&<button className="mb-4 rounded border px-3 py-2 text-sm" onClick={()=>download(recovery,'portfolio-recovery.json')}>{t("recoverLocal")}</button>}
        <p className="mb-4 text-sm text-muted">{t("scopeNotice")}</p>
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl [overflow-wrap:anywhere]">{t("title")}</h1>
            <p className="mt-2 text-muted">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!manualLoaded||manualError}
              onClick={() => download(portfolioCsv(assets,[t('fieldName'),t('fieldType'),t('fieldCommune'),t('fieldValue'),t('fieldSurface'),t('avgPriceM2'),t('fieldAnnualRent'),t('fieldDebt'),t('headerLTV'),t('headerGrossYield')]),'portfolio.csv')}
              className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-white px-4 py-2.5 text-sm font-semibold text-slate transition hover:bg-background active:scale-95"
              title={t("csvScope")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h5a1 1 0 110 2H6a1 1 0 01-1-1z" />
              </svg>
              {t("csvManual")}
            </button>
            <a href="https://impotsdirects.public.lu/fr/az/l/logem_loc.html" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-card-border px-4 py-2.5 text-sm font-semibold">{t("taxGuide")}</a>
            <button
              disabled={!manualLoaded||manualError||!archiveLoaded||archiveError||activeTab!=="manual"||pdfBusy}
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
              {t("manualCount", { count: assets.length })} + {t("evaluationCount", { count: savedValuations.filter(isPropertyValuation).length })}
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
              {stats.avgEnergyClass ? `${t("score")} ${stats.avgEnergyScore.toFixed(1)} / 10` : t("noEPC")}
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

        {archiveLoaded && !archiveError && chartData.length <= 1 && savedValuations.length === 0 && (
          <div className="mb-8 rounded-xl border border-dashed border-card-border bg-card/50 p-8 text-center">
            <p className="text-sm text-muted">
              {t("emptyChartHint")}
            </p>
            <Link href={`${lp}/estimation`} className="mt-3 inline-block text-sm font-medium text-navy hover:underline">
              {t("startEstimation")} &rarr;
            </Link>
          </div>
        )}

        {/* ============================================================ */}
        {/*  2bis. CASH FLOW 12 MOIS GLISSANTS                            */}
        {/* ============================================================ */}
        {stats.loyerTotal > 0 && (
          <div className="mb-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
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
        {/*  2b. EXPENSE BREAKDOWN PAR BIEN (type / lot)                  */}
        {/* ============================================================ */}
        {assets.length > 0 && (() => {
          const COPRO_MONTHLY = 250; // défaut copro mensuel
          const PNO_RATE = 0.005;
          const TAXE_RATE = 0.001;
          const GESTION_RATE = 0.05;
          const ENTRETIEN_RATE = 0.005;

          const rows = assets.map((a) => {
            const copro = COPRO_MONTHLY * 12;
            const pno = a.valeur * PNO_RATE;
            const taxe = a.valeur * TAXE_RATE;
            const entretien = a.valeur * ENTRETIEN_RATE;
            const gestion = a.loyerAnnuel * GESTION_RATE;
            const total = copro + pno + taxe + entretien + gestion;
            const ratioLoyer = a.loyerAnnuel > 0 ? total / a.loyerAnnuel : 0;
            return { asset: a, copro, pno, taxe, entretien, gestion, total, ratioLoyer };
          });
          const totals = {
            copro: rows.reduce((s, r) => s + r.copro, 0),
            pno: rows.reduce((s, r) => s + r.pno, 0),
            taxe: rows.reduce((s, r) => s + r.taxe, 0),
            entretien: rows.reduce((s, r) => s + r.entretien, 0),
            gestion: rows.reduce((s, r) => s + r.gestion, 0),
            total: rows.reduce((s, r) => s + r.total, 0),
          };

          return (
            <div className="mb-8 rounded-xl border border-card-border bg-card shadow-sm p-5">
              <h2 className="text-base font-semibold text-navy mb-1">{t("expensesTitle")}</h2>
              <p className="text-xs text-muted mb-4">{t("expensesSubtitle")}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-background">
                      <th className="px-3 py-2 text-left font-semibold text-navy">{t("expensesColBien")}</th>
                      <th className="px-3 py-2 text-right font-semibold text-navy">{t("expensesColCopro")}</th>
                      <th className="px-3 py-2 text-right font-semibold text-navy">{t("expensesColPno")}</th>
                      <th className="px-3 py-2 text-right font-semibold text-navy">{t("expensesColTaxe")}</th>
                      <th className="px-3 py-2 text-right font-semibold text-navy">{t("expensesColEntretien")}</th>
                      <th className="px-3 py-2 text-right font-semibold text-navy">{t("expensesColGestion")}</th>
                      <th className="px-3 py-2 text-right font-semibold text-navy">{t("expensesColTotal")}</th>
                      <th className="px-3 py-2 text-right font-semibold text-navy">{t("expensesColRatio")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.asset.id} className="border-b border-card-border/40 hover:bg-background/50">
                        <td className="px-3 py-2 font-medium">{r.asset.nom || "—"}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatEUR(r.copro)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatEUR(r.pno)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatEUR(r.taxe)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatEUR(r.entretien)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatEUR(r.gestion)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-navy">{formatEUR(r.total)}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {(r.ratioLoyer * 100).toFixed(1)} %
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-navy bg-navy/5 font-semibold">
                      <td className="px-3 py-2">{t("expensesTotal")}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatEUR(totals.copro)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatEUR(totals.pno)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatEUR(totals.taxe)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatEUR(totals.entretien)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatEUR(totals.gestion)}</td>
                      <td className="px-3 py-2 text-right font-mono text-navy">{formatEUR(totals.total)}</td>
                      <td className="px-3 py-2" />
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[10px] text-muted">{t("expensesNote")}</p>
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/*  3. PROPERTY COMPARISON TABLE                                 */}
        {/* ============================================================ */}
        {unifiedProperties.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
                          {p.date ? new Date(p.date).toLocaleDateString(locale=== "lb" ? "de-LU" : locale) : "--"}
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
                { label: t("kpiGrossYield"), value: assets.some(a=>a.valeur>0)?formatPct(stats.rendementBrut):"—" },
                { label: t("kpiNetYield"), value: t("notCalculated") },
                { label: t("kpiEquityYield"), value: t("notCalculated"), highlight: true },
                { label: t("kpiLTV"), value: assets.some(a=>a.valeur>0)?formatPct(stats.ltvGlobal):"—" },
              ]}
            />

            <p className="text-sm text-muted">{t("missingExpenses")}</p>

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
              <button disabled={!manualLoaded||manualError} onClick={addAsset} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">{t("addAsset")}</button>
            </div>

            {assets.map((asset, i) => (
              <div key={asset.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-semibold text-navy">{asset.nom || `${t("asset")} ${i + 1}`}</span>
                  <div className="flex items-center gap-3">
                    <Link href={`${lp}/estimation`} className="text-xs text-navy hover:underline font-medium">{t("reEstimate")}</Link>
                    <button disabled={!manualLoaded||manualError} onClick={() => removeAsset(i)} className="text-xs text-error hover:underline">{t("delete")}</button>
                  </div>
                </div>
                <fieldset disabled={!manualLoaded||manualError} className="grid gap-3 sm:grid-cols-4">
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
                </fieldset>
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
                        <td className="px-3 py-1.5 text-right font-mono">
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

        <RelatedTools keys={["dcfMulti", "valorisation", "esgCrrem", "energyRenovation"]} />
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
