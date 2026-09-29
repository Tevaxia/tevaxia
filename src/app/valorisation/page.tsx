"use client";

import { useAuth } from "@/components/AuthProvider";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import { formatEUR } from "@/lib/calculations";
import {
  reconcilier,
  calculerComparaisonDocumentee,
  type Comparable,
} from "@/lib/valuation";
import {ComparisonEvidence as TabComparaison} from "@/components/ComparisonEvidence";
import {ReconciliationPanel,type ReconciliationWeights} from "@/components/ReconciliationPanel";
import {CapitalisationScenario} from "@/components/CapitalisationScenario";
import {PrudentialValue} from "@/components/PrudentialValue";
import {DcfScenario} from "@/components/DcfScenario";
import { EsgDossier } from "@/components/EsgDossier";
import {
  rechercherCommune,
  type SearchResult,
} from "@/lib/market-data";
import {
  ASSET_TYPES,
  getAssetTypeConfig,
  type AssetType,
  type EVSValueType,
} from "@/lib/asset-types";
const _lazy_generateReportBlob = async (...args: Parameters<typeof import("@/components/ValuationReport")["generateReportBlob"]>): Promise<Blob> => (await import("@/components/ValuationReport")).generateReportBlob(...args);
import { PdfButton } from "@/components/PdfButton";
import { downloadDocxReport } from "@/components/ValuationDocx";
import { getProfile } from "@/lib/profile";
import { RenovationResidual } from "@/components/RenovationResidual";
import { TermReversion } from "@/components/TermReversion";
import Breadcrumbs from "@/components/Breadcrumbs";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import ShareLinkButton from "@/components/ShareLinkButton";
import SignReportButton from "@/components/SignReportButton";
import ReportModeEVS from "@/components/ReportModeEVS";

type ActiveTab = "comparaison" | "capitalisation" | "terme_reversion" | "dcf" | "esg" | "energie" | "mlv" | "reconciliation";

// ============================================================
// TAB 1 — COMPARAISON
// ============================================================

// ============================================================
// TAB 2 — CAPITALISATION DIRECTE
// ============================================================

function TabCapitalisation({onValeur}:{onValeur:(value:number)=>void}) {return <CapitalisationScenario onValeur={onValeur}/>;}

// ============================================================
// TAB 3 — DCF
// ============================================================

function TabDCF({onValeur}:{onValeur:(value:number)=>void}) {return <DcfScenario onValeur={onValeur}/>;}

// ============================================================
// TAB — TERME & RÉVERSION
// ============================================================

function TabTermeReversion({ onValeur }: { onValeur: (v:number)=>void }) { return <TermReversion onValue={onValeur} />; }

// ============================================================
// TAB — ESG / DURABILITÉ
// ============================================================

function TabESG() { return <EsgDossier />; }

// ============================================================
// TAB — RÉSIDUELLE ÉNERGÉTIQUE
// ============================================================

function TabEnergie() { return <RenovationResidual />; }

// ============================================================
// TAB 5 — MLV / CRR
// ============================================================

function TabMLV({valeurMarche}:{valeurMarche:number}) {return <PrudentialValue value={valeurMarche}/>;}

// ============================================================
// TAB 5 — RÉCONCILIATION
// ============================================================

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function Valorisation() {
  const { user: valuationUser } = useAuth();
  const { user } = useAuth();
  const t = useTranslations("valorisation"), sessionText=useTranslations("valuationSession"), scopeText=useTranslations("valuationScope");
  const expertText = useTranslations("expertGuidance");
  const expertGuidance = { limits: expertText("limits"), contact: expertText("contact") };
  const [viewMode, setViewMode] = useState<"calculateur" | "rapport">("calculateur");
  const [activeTab, setActiveTab] = useState<ActiveTab>("comparaison");
  const [visitedTabs,setVisitedTabs]=useState<ActiveTab[]>(['comparaison']);
  const [sessionRevision,setSessionRevision]=useState(0);
  const [reportVisited,setReportVisited]=useState(false);
  const [incomeSource,setIncomeSource]=useState<'capitalisation'|'terme_reversion'>('capitalisation');
  const selectTab=(tab:ActiveTab)=>{setActiveTab(tab);setVisitedTabs(prev=>prev.includes(tab)?prev:[...prev,tab]);if(tab==='capitalisation'||tab==='terme_reversion')setIncomeSource(tab)};
  const [surfaceBien, setSurfaceBien] = useState(80);
  const [assetType, setAssetType] = useState<AssetType>("residential_apartment");
  const evsValueType:EVSValueType="market_value";

  // Recherche commune — état global (persiste entre onglets)
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);
  const selectedCommune = selectedResult?.commune ?? null;

  // Comparables — état global (persiste entre onglets)
  const [comparables, setComparables] = useState<Comparable[]>([]);

  const assetConfig = useMemo(() => getAssetTypeConfig(assetType), [assetType]);

  // Valeurs remontées par chaque onglet
  const comparisonResult=useMemo(()=>{try{return calculerComparaisonDocumentee(comparables,surfaceBien)}catch{return null}},[comparables,surfaceBien]);
  const valeurComparaison=comparisonResult?.valeurEstimeePonderee??0;
  const [directCapitalisation,setDirectCapitalisation]=useState(0);
  const [termCapitalisation,setTermCapitalisation]=useState(0);
  const valeurCapitalisation=incomeSource==='capitalisation'?directCapitalisation:termCapitalisation;
  const incomeLabel=t(incomeSource==='capitalisation'?'tabCapitalisation':'tabTermeReversion');
  const [valeurDCF, setValeurDCF] = useState(0);

  // Template de rapport PDF + commissionnaire (banque / juge / notaire)
  const [reportTemplate, setReportTemplate] = useState<"standard" | "bancaire" | "judiciaire" | "succession">("standard");
  const [commissionnaire, setCommissionnaire] = useState("");
  const [signature, setSignature] = useState<{ hash: string; url: string; date: string; payload: string } | null>(null);

  // Stable callback refs
  const onValeurCap = useCallback((v: number) => setDirectCapitalisation(v), []);
  const onValeurTerm = useCallback((v: number) => setTermCapitalisation(v), []);
  const onValeurDCF = useCallback((v: number) => setValeurDCF(v), []);

  const [reconciliationWeights,setReconciliationWeights]=useState<ReconciliationWeights>({comparison:50,capitalisation:25,dcf:25});
  const reconciliation=useMemo(()=>{try{if(!Number.isFinite(surfaceBien)||surfaceBien<=0||surfaceBien>1e7)return null;return reconcilier({valeurComparaison,poidsComparaison:reconciliationWeights.comparison,valeurCapitalisation,poidsCapitalisation:reconciliationWeights.capitalisation,valeurDCF,poidsDCF:reconciliationWeights.dcf})}catch{return null}},[valeurComparaison,valeurCapitalisation,valeurDCF,reconciliationWeights,surfaceBien]);
  const valeurMarchePourMLV=reconciliation?.valeurReconciliee??0;

  const reportMethods=reconciliation?.methodes.map(m=>({...m,nom:m.nom==='Capitalisation'?incomeLabel:m.nom}));
  const signaturePayload={incomeSource,comparables,commune:selectedCommune?.commune,assetType:assetConfig.id,evsType:"indicative_capital_value",surface:surfaceBien,prixM2Commune:selectedCommune?.prixM2Existant,valeurComparaison,valeurCapitalisation,valeurDCF,valeurReconciliee:valeurMarchePourMLV,reconciliationWeights};
  const currentSignature=signature?.payload===JSON.stringify(signaturePayload)?signature:null;

  // Tab labels inside component to use t()
  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "comparaison", label: t("tabComparaison") },
    { id: "capitalisation", label: t("tabCapitalisation") },
    { id: "terme_reversion", label: t("tabTermeReversion") },
    { id: "dcf", label: t("tabDCF") },
    { id: "esg", label: t("tabESG") },
    { id: "energie", label: t("tabEnergie") },
    { id: "mlv", label: t("tabMLV") },
    { id: "reconciliation", label: t("tabReconciliation") },
  ];

  // Reset complet
  const handleReset = useCallback(() => {
    setSurfaceBien(80);
    setAssetType("residential_apartment");
    setReportTemplate("standard");
    setCommissionnaire("");
    setCommuneSearch("");
    setSelectedResult(null);
    setComparables([]);
    setDirectCapitalisation(0);
    setTermCapitalisation(0);
    setIncomeSource('capitalisation');
    setVisitedTabs(['comparaison']);
    setActiveTab('comparaison');
    setSessionRevision(n=>n+1);
    setSignature(null);
    setReportVisited(false);
    setViewMode('calculateur');
    setValeurDCF(0);
    setReconciliationWeights({comparison:50,capitalisation:25,dcf:25});
  }, []);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 [overflow-wrap:anywhere]">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              {scopeText("title")}
            </h1>

          </div>
          <p className="mt-2 text-muted">
            {scopeText("intro")}
          </p>
        </div>

        {/* Toggle: Mode calculateur / Mode rapport EVS */}
        <div className="mb-6 flex items-center gap-1 rounded-xl bg-card border border-card-border p-1 shadow-sm w-fit">
          <button
            onClick={() => setViewMode("calculateur")}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === "calculateur"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {t("modeCalculateur")}
          </button>
          <button
            onClick={() => {setReportVisited(true);setViewMode("rapport")}}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === "rapport"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {scopeText("draft")}
          </button>
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
                  {t(at.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-card p-4 space-y-3">
              <h2 className="font-semibold">{scopeText("capitalValue")}</h2><p className="text-sm text-muted">{scopeText("basis")}</p><p className="text-sm text-muted">{scopeText("asset")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4 space-y-3">
              <InputField label={t("surfaceDuBien")} value={Number.isNaN(surfaceBien)?"":surfaceBien} onChange={v=>setSurfaceBien(v.trim()===""?NaN:Number(v))} min={0} max={1e7} suffix="m²"/>
              {(!Number.isFinite(surfaceBien)||surfaceBien<=0||surfaceBien>1e7)&&<p id="valuation-surface-invalid" role="status" className="text-sm text-muted">{scopeText("surfaceInvalid")}</p>}
              <p className="text-sm text-muted">{scopeText("inputs")}</p>
            </div>
          </div>

          {/* Résumé persistant : commune + valeurs + reset */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {selectedCommune && (
              <div className="rounded-lg bg-navy/5 border border-navy/10 px-3 py-2">
                <span className="text-muted">{t("commune")} :</span>{" "}
                <span className="font-semibold text-navy">{selectedCommune.commune}</span>
                {selectedResult?.isLocalite && <span className="text-muted"> ({selectedResult.matchedOn})</span>}
                {selectedCommune.prixM2Existant && <span className="ml-2 font-mono text-xs text-muted">{formatEUR(selectedCommune.prixM2Existant)}/m²</span>}
              </div>
            )}
            {valeurComparaison > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">{t("tabComparaison")} :</span> <span className="font-semibold text-navy">{formatEUR(valeurComparaison)}</span></div>
            )}
            {valeurCapitalisation > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">{t("tabCapitalisation")} :</span> <span className="font-semibold text-navy">{formatEUR(valeurCapitalisation)}</span></div>
            )}
            {valeurDCF > 0 && (
              <div className="rounded-lg bg-card border border-card-border px-3 py-2"><span className="text-muted">DCF :</span> <span className="font-semibold text-navy">{formatEUR(valeurDCF)}</span></div>
            )}
            {valeurMarchePourMLV > 0 && (<>
              <div className="w-full flex flex-wrap items-center gap-2 rounded-lg border border-navy/15 bg-navy/5 px-3 py-2">
                <label className="text-xs font-semibold text-navy">{t("reportTemplateLabel")}</label>
                <select
                  value={reportTemplate}
                  onChange={(e) => setReportTemplate(e.target.value as typeof reportTemplate)}
                  className="rounded-md border border-navy/20 bg-white px-2 py-1 text-xs"
                >
                  <option value="standard">{t("templateStandard")}</option>
                  <option value="bancaire">{t("templateBancaire")}</option>
                  <option value="judiciaire">{t("templateJudiciaire")}</option>
                  <option value="succession">{t("templateSuccession")}</option>
                </select>
                <input
                  type="text"
                  value={commissionnaire}
                  onChange={(e) => setCommissionnaire(e.target.value)}
                  placeholder={t("commissionnairePlaceholder")}
                  className="flex-1 min-w-[180px] rounded-md border border-navy/20 bg-white px-2 py-1 text-xs"
                />
              </div>
              <SaveButton
                onClick={async () => {
                  await sauvegarderEvaluation({
                    nom: `${t("pageTitle")} — ${selectedCommune?.commune || "?"} — ${surfaceBien} m²`,
                    type: "valorisation",
                    commune: selectedCommune?.commune,
                    valeurPrincipale: valeurMarchePourMLV,
                    data: { surfaceBien, assetType, evsValueType, commune: selectedCommune?.commune, valeurComparaison, valeurCapitalisation, valeurDCF, valeurReconciliee:valeurMarchePourMLV, reconciliationWeights, comparables, incomeSource },
                  }, valuationUser?.id ?? null);
                }}
                label={t("sauvegarder")}
                successLabel={t("sauvegarde")}
              />
              <PdfButton
                generateBlob={() => {
                  const prof = getProfile(user?.id ?? null);
                  return _lazy_generateReportBlob({
                    expertGuidance,
                    dateRapport: new Date().toISOString().split("T")[0],
                    commune: selectedCommune?.commune,
                    assetType: t(assetConfig.labelKey),
                    evsType: scopeText("capitalValue"),
                    surface: surfaceBien,
                    valeurComparaison: valeurComparaison || undefined,
                    valeurCapitalisation: valeurCapitalisation || undefined,
                    valeurDCF: valeurDCF || undefined,
                    valeurRéconciliee: valeurMarchePourMLV,
                    reconciliation: reportMethods,
                    prixM2Commune: selectedCommune?.prixM2Existant || undefined,
                    transactionsCommune: selectedCommune?.nbTransactions || undefined,
                    comparables: (comparisonResult?comparables:[]).map(c => {
                      const totalAjust = (c.ajustLocalisation || 0) + (c.ajustEtat || 0) + (c.ajustEtage || 0) + (c.ajustExterieur || 0) + (c.ajustParking || 0) + (c.ajustDate || 0) + (c.ajustAutre || 0);
                      const prixM2 = c.surface > 0 ? c.prixVente / c.surface : 0;
                      return {
                        adresse: [c.adresse,c.dateVente,c.source,c.justification].filter(Boolean).join(" — "),
                        prixVente: c.prixVente,
                        surface: c.surface,
                        prixM2,
                        ajustement: totalAjust,
                        prixAjuste: prixM2 * (1 + totalAjust / 100),
                      };
                    }),
                    classeEnergie: undefined,
                    expertNom: prof.nomComplet || undefined,
                    expertSociete: prof.societe || undefined,
                    expertQualifications: prof.qualifications || undefined,
                    logoUrl: prof.logoUrl || undefined,
                    reportTemplate,
                    commissionnaire: commissionnaire.trim() || undefined,
                    signatureHash: currentSignature?.hash,
                    signatureUrl: currentSignature?.url,
                    signatureDate: currentSignature?.date,
                  });
                }}
                filename={`tevaxia-rapport-${reportTemplate}-${new Date().toISOString().split("T")[0]}.pdf`}
                label="PDF"
              />
              <button
                onClick={() => downloadDocxReport({
                  expertGuidance,
                  dateRapport: new Date().toISOString().split("T")[0],
                  commune: selectedCommune?.commune,
                  assetType: t(assetConfig.labelKey),
                  evsType: scopeText("capitalValue"),
                  surface: surfaceBien,
                  valeurComparaison: valeurComparaison || undefined,
                  valeurCapitalisation: valeurCapitalisation || undefined,
                  valeurDCF: valeurDCF || undefined,
                  valeurReconciliee: valeurMarchePourMLV,
                  reconciliation: reportMethods,
                  comparables: comparisonResult?comparables:[],
                }, user?.id ?? null)}
                className="rounded-lg border border-gold px-3 py-2 text-xs font-medium text-gold-dark hover:bg-gold/10 transition-colors"
              >
                DOCX
              </button>
              <ShareLinkButton
                toolType="valorisation"
                defaultTitle={`Valorisation ${selectedCommune?.commune ?? ""} — ${surfaceBien} m²`}
                payload={{
                  inputs: {
                    commune: selectedCommune?.commune,
                    assetType: t(assetConfig.labelKey),
                    evsType: scopeText("capitalValue"),
                    surface: surfaceBien,
                    prixM2Commune: selectedCommune?.prixM2Existant,
                  },
                  results: {
                    valeurComparaison: valeurComparaison || undefined,
                    valeurCapitalisation: valeurCapitalisation || undefined,
                    valeurDCF: valeurDCF || undefined,
                    valeurRetenue: valeurMarchePourMLV,
                    reconciliation: reportMethods,
                  },
                }}
              />
              <SignReportButton
                reportTitle={`Valorisation ${selectedCommune?.commune ?? ""} — ${surfaceBien} m²`}
                payload={signaturePayload}
                onSigned={(hash, url, date) => setSignature({ hash, url, date, payload:JSON.stringify(signaturePayload) })}
              />
            </>)}
            {(selectedCommune || comparables.length > 0 || visitedTabs.length > 1 || reportVisited) && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-error/30 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
              >
                {t("reinitialiser")}
              </button>
            )}
          </div>
        </div>

        {/* MODE CALCULATEUR */}
        <div key={sessionRevision} hidden={viewMode !== "calculateur"}>
        <p className="mb-4 text-sm text-muted">{sessionText("persistence")}</p>
        {/* Tabs */}
        <div className="sticky top-16 z-30 mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
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

        {visitedTabs.includes("comparaison") && (<div hidden={activeTab !== "comparaison"}>
          <TabComparaison
            surfaceBien={surfaceBien}
            result={comparisonResult}
            communeSearch={communeSearch}
            setCommuneSearch={setCommuneSearch}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            searchResults={searchResults}
            comparables={comparables}
            setComparables={setComparables}
          />
        </div>)}
        {visitedTabs.includes("capitalisation") && <div hidden={activeTab !== "capitalisation"}><TabCapitalisation onValeur={onValeurCap} /></div>}
        {visitedTabs.includes("terme_reversion") && <div hidden={activeTab !== "terme_reversion"}><TabTermeReversion onValeur={onValeurTerm} /></div>}
        {visitedTabs.includes("dcf") && <div hidden={activeTab !== "dcf"}><TabDCF onValeur={onValeurDCF} /></div>}
        {visitedTabs.includes("esg") && <div hidden={activeTab !== "esg"}><TabESG /></div>}
        {visitedTabs.includes("energie") && <div hidden={activeTab !== "energie"}><TabEnergie /></div>}
        {visitedTabs.includes("mlv") && <div hidden={activeTab !== "mlv"}><TabMLV valeurMarche={valeurMarchePourMLV} /></div>}
        {visitedTabs.includes("reconciliation") && (<div hidden={activeTab !== "reconciliation"}>
          <p id="reconciliation-income-source" className="mb-3 text-sm text-muted">{sessionText("incomeSource")} : {incomeLabel}</p>
          <ReconciliationPanel values={{comparison:valeurComparaison,capitalisation:valeurCapitalisation,dcf:valeurDCF}} weights={reconciliationWeights} onWeights={setReconciliationWeights} result={reconciliation}/>

        </div>)}
        </div>

        {/* MODE RAPPORT EVS */}
        {reportVisited && (<div key={"report-"+sessionRevision} hidden={viewMode !== "rapport"}>
          <ReportModeEVS
            surfaceBien={surfaceBien}
            assetType={t(assetConfig.labelKey)}
            incomeLabel={incomeLabel}
            comparables={comparisonResult?comparables:[]}
            selectedCommune={selectedCommune}
            valeurComparaison={valeurComparaison}
            valeurCapitalisation={valeurCapitalisation}
            valeurDCF={valeurDCF}
            valeurMarchePourMLV={valeurMarchePourMLV}
          />
        </div>)}

        <RelatedTools keys={["hedonique", "comparer", "dcfMulti", "indices", "marche", "estimation"]} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8"><p className="text-sm text-muted">{scopeText("review")}</p></div>
    </div>
  );
}
