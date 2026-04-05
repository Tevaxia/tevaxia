"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import { formatEUR } from "@/lib/calculations";
import { EVS_VALUE_TYPES, type EVSValueType } from "@/lib/asset-types";
import type { MarketDataCommune } from "@/lib/market-data";

/* ================================================================
   TYPES & PROPS
   ================================================================ */
interface ReportModeProps {
  surfaceBien: number;
  assetType: string;
  evsValueType: EVSValueType;
  selectedCommune: MarketDataCommune | null;
  valeurComparaison: number;
  valeurCapitalisation: number;
  valeurDCF: number;
  valeurMarchePourMLV: number;
}

interface SectionDef {
  num: string;
  titleKey: string;
}

const SECTIONS: SectionDef[] = [
  { num: "1", titleKey: "rptSec1Title" },
  { num: "2", titleKey: "rptSec2Title" },
  { num: "3", titleKey: "rptSec3Title" },
  { num: "4", titleKey: "rptSec4Title" },
  { num: "5", titleKey: "rptSec5Title" },
  { num: "6", titleKey: "rptSec6Title" },
  { num: "7", titleKey: "rptSec7Title" },
  { num: "8", titleKey: "rptSec8Title" },
  { num: "9", titleKey: "rptSec9Title" },
  { num: "10", titleKey: "rptSec10Title" },
  { num: "11", titleKey: "rptSec11Title" },
  { num: "A", titleKey: "rptSecATitle" },
];

/* ================================================================
   HELPERS
   ================================================================ */

/** Highlight wrapper for auto-populated data */
function AutoData({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
      {children}
      <p className="mt-2 text-[10px] font-medium text-blue-500 uppercase tracking-wider">Auto-populé</p>
    </div>
  );
}

/** Reusable sub-section header */
function SubSection({ num, title }: { num: string; title: string }) {
  return (
    <h4 className="text-sm font-semibold text-navy flex items-center gap-2 mt-1">
      <span className="text-xs text-muted font-mono">{num}</span>
      {title}
    </h4>
  );
}

/** Simple checkbox row */
function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-slate cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-navy focus:ring-navy/30"
      />
      <span>{label}</span>
    </label>
  );
}

/** Textarea helper */
function TA({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 ${className}`}
    />
  );
}

/** SWOT textarea with colored border */
function SwotTA({
  value,
  onChange,
  placeholder,
  color,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  color: "green" | "red" | "blue" | "amber";
  suggestions?: string[];
}) {
  const colors = {
    green: "border-green-200 bg-green-50/50 focus:border-green-500 focus:ring-green-500/20",
    red: "border-red-200 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20",
    blue: "border-blue-200 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/20",
    amber: "border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500/20",
  };
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${colors[color]}`}
      />
      {suggestions && suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const nl = value.length > 0 ? "\n" : "";
                onChange(value + nl + "- " + s);
              }}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-muted hover:bg-gray-200 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function ReportModeEVS({
  surfaceBien,
  assetType,
  evsValueType,
  selectedCommune,
  valeurComparaison,
  valeurCapitalisation,
  valeurDCF,
  valeurMarchePourMLV,
}: ReportModeProps) {
  const t = useTranslations("valorisation");
  const today = new Date().toISOString().split("T")[0];

  // ---- UI state ----
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "1": true });
  const [reportComments, setReportComments] = useState<Record<string, string>>({});

  // ==================== SECTION 1 — MISSION ====================
  const [s1ClientNom, setS1ClientNom] = useState("");
  const [s1ClientSIREN, setS1ClientSIREN] = useState("");
  const [s1ClientAdresse, setS1ClientAdresse] = useState("");
  const [s1ClientLien, setS1ClientLien] = useState("");
  const [s1TypeMission, setS1TypeMission] = useState<EVSValueType>(evsValueType);
  const [s1Finalite, setS1Finalite] = useState("");
  const [s1UtilisationPrevue, setS1UtilisationPrevue] = useState("");
  const [s1BienDesignation, setS1BienDesignation] = useState("");
  const [s1BienAdresse, setS1BienAdresse] = useState("");
  const [s1BienUsage, setS1BienUsage] = useState(assetType);
  const [s1BienCadastre, setS1BienCadastre] = useState("");
  const [s1BienLots, setS1BienLots] = useState("");
  // 1.5 Types de valeur
  const [s1ValVenale, setS1ValVenale] = useState(evsValueType === "market_value");
  const [s1ValLocative, setS1ValLocative] = useState(evsValueType === "market_rent");
  const [s1ValCRR, setS1ValCRR] = useState(evsValueType === "mlv");
  const [s1ValLTV, setS1ValLTV] = useState(false);
  const [s1Hypotheses, setS1Hypotheses] = useState("");
  // 1.5b
  const [s1HypothesesSpeciales, setS1HypothesesSpeciales] = useState("");
  // 1.6
  const [s1Independance, setS1Independance] = useState("");
  // 1.8
  const [s1DateVisite, setS1DateVisite] = useState("");
  const [s1PersonneVisite, setS1PersonneVisite] = useState("");
  const [s1ConditionsVisite, setS1ConditionsVisite] = useState("");
  // 1.9
  const [s1DateValeur, setS1DateValeur] = useState(today);
  // 1.11
  const [s1DocsFournis, setS1DocsFournis] = useState("");
  const [s1DocsDemandesNonFournis, setS1DocsDemandesNonFournis] = useState("");
  const [s1DocsCollectes, setS1DocsCollectes] = useState("");
  // 1.12
  const [s1ClauseInspection, setS1ClauseInspection] = useState(false);
  const [s1ClauseDocuments, setS1ClauseDocuments] = useState(false);
  const [s1ClauseEnvironnement, setS1ClauseEnvironnement] = useState(false);
  const [s1ClauseMarche, setS1ClauseMarche] = useState(false);
  const [s1ClausesTexte, setS1ClausesTexte] = useState("");

  // ==================== SECTION 2 — SITUATION GEO ====================
  const [s2Localisation, setS2Localisation] = useState("");
  const [s2Environnement, setS2Environnement] = useState("");
  const [s2Desserte, setS2Desserte] = useState("");

  // ==================== SECTION 3 — SITUATION JURIDIQUE ====================
  const [s3RegimePropriete, setS3RegimePropriete] = useState("pleine_propriete");
  const [s3RefActe, setS3RefActe] = useState("");
  const [s3DateAcquisition, setS3DateAcquisition] = useState("");
  const [s3Servitudes, setS3Servitudes] = useState("");
  const [s3DateReglement, setS3DateReglement] = useState("");
  const [s3Tantiemes, setS3Tantiemes] = useState("");
  const [s3ElementsCopro, setS3ElementsCopro] = useState("");

  // ==================== SECTION 4 — URBANISME ====================
  const [s4Urbanisme, setS4Urbanisme] = useState("");
  const [s4ServitudesPubliques, setS4ServitudesPubliques] = useState("");
  const [s4Constructibilite, setS4Constructibilite] = useState("");
  const [s4Projets, setS4Projets] = useState("");

  // ==================== SECTION 5 — DESCRIPTION ====================
  const [s5TypeConstruction, setS5TypeConstruction] = useState(assetType);
  const [s5Structure, setS5Structure] = useState("");
  const [s5Annee, setS5Annee] = useState(1990);
  const [s5UsagePhysique, setS5UsagePhysique] = useState("");
  const [s5UsageJuridique, setS5UsageJuridique] = useState("");
  const [s5SurfaceTerrain, setS5SurfaceTerrain] = useState(0);
  const [s5SurfaceBatiment, setS5SurfaceBatiment] = useState(surfaceBien);
  const [s5SourceMesures, setS5SourceMesures] = useState("");
  const [s5GrosOeuvre, setS5GrosOeuvre] = useState("bon");
  const [s5SecondOeuvre, setS5SecondOeuvre] = useState("bon");
  const [s5Finitions, setS5Finitions] = useState("bon");
  const [s5Diagnostics, setS5Diagnostics] = useState("");
  const [s5Confort, setS5Confort] = useState("");
  const [s5Installations, setS5Installations] = useState("");
  const [s5Annexes, setS5Annexes] = useState("");
  // ESG
  const [s5ClasseEnergie, setS5ClasseEnergie] = useState("D");
  const [s5ObligationsRenov, setS5ObligationsRenov] = useState("");
  const [s5Consommations, setS5Consommations] = useState("");
  const [s5CoutsConformite, setS5CoutsConformite] = useState("");
  const [s5RisquesClimat, setS5RisquesClimat] = useState("");
  const [s5Geologie, setS5Geologie] = useState("");
  const [s5Contamination, setS5Contamination] = useState("");
  const [s5Eau, setS5Eau] = useState("");
  const [s5Certifications, setS5Certifications] = useState("");

  // ==================== SECTION 6 — SITUATION LOCATIVE ====================
  const [s6Occupation, setS6Occupation] = useState("libre");
  const [s6VacantsDescription, setS6VacantsDescription] = useState("");
  const [s6Charges, setS6Charges] = useState("");

  // ==================== SECTION 7 — ETUDE DE MARCHE ====================
  const [s7Tendances, setS7Tendances] = useState("");
  const [s7OffreDemande, setS7OffreDemande] = useState("");
  const [s7Perspectives, setS7Perspectives] = useState("");

  // ==================== SECTION 8 — SWOT ====================
  const [s8Forces, setS8Forces] = useState("");
  const [s8Faiblesses, setS8Faiblesses] = useState("");
  const [s8Opportunites, setS8Opportunites] = useState("");
  const [s8Menaces, setS8Menaces] = useState("");

  // ==================== SECTION 9 — EVALUATION ====================
  const [s9MethodeComparaison, setS9MethodeComparaison] = useState(true);
  const [s9MethodeCapitalisation, setS9MethodeCapitalisation] = useState(true);
  const [s9MethodeDCF, setS9MethodeDCF] = useState(true);
  const [s9MethodeResiduelle, setS9MethodeResiduelle] = useState(false);
  const [s9MethodeTermeReversion, setS9MethodeTermeReversion] = useState(false);
  const [s9Justification, setS9Justification] = useState("");

  // ==================== SECTION 10 — CONCLUSIONS ====================
  const [s10ValeurHorsDroits, setS10ValeurHorsDroits] = useState(0);
  const [s10ValeurDroitsInclus, setS10ValeurDroitsInclus] = useState(0);
  const [s10RegimeFiscal, setS10RegimeFiscal] = useState("");
  const [s10ImpactESG, setS10ImpactESG] = useState("");
  const [s10Reserves, setS10Reserves] = useState("");
  const [s10Incertitude, setS10Incertitude] = useState("");

  // ==================== SECTION 11 — CERTIFICATION ====================
  const [s11ExpertNom, setS11ExpertNom] = useState("");
  const [s11ExpertQualif, setS11ExpertQualif] = useState("REV (TEGOVA)");
  const [s11DateSignature, setS11DateSignature] = useState(today);
  const [s11Cert1, setS11Cert1] = useState(true);
  const [s11Cert2, setS11Cert2] = useState(true);
  const [s11Cert3, setS11Cert3] = useState(true);
  const [s11Cert4, setS11Cert4] = useState(true);
  const [s11Cert5, setS11Cert5] = useState(true);
  const [s11Cert6, setS11Cert6] = useState(true);

  // ==================== ANNEXES ====================
  const [annexePlans, setAnnexePlans] = useState(false);
  const [annexePhotos, setAnnexePhotos] = useState(false);
  const [annexeJuridique, setAnnexeJuridique] = useState(false);
  const [annexeUrbanisme, setAnnexeUrbanisme] = useState(false);
  const [annexeTechnique, setAnnexeTechnique] = useState(false);
  const [annexeLocatif, setAnnexeLocatif] = useState(false);
  const [annexeCalculs, setAnnexeCalculs] = useState(false);
  const [annexeESG, setAnnexeESG] = useState(false);
  const [annexeQualifications, setAnnexeQualifications] = useState(false);

  // ---- Helpers ----
  const toggleSection = (num: string) =>
    setExpanded((prev) => ({ ...prev, [num]: !prev[num] }));

  const setComment = (num: string, value: string) =>
    setReportComments((prev) => ({ ...prev, [num]: value }));

  // ---- Auto-computed values ----
  const valeurReconciliee = useMemo(() => valeurMarchePourMLV, [valeurMarchePourMLV]);

  const ltvRatio = useMemo(() => {
    if (valeurReconciliee <= 0) return 0;
    return valeurReconciliee > 0 ? ((valeurReconciliee * 0.8) / valeurReconciliee) * 100 : 0;
  }, [valeurReconciliee]);

  // ---- Fill status ----
  const isSectionFilled = (num: string): boolean => {
    switch (num) {
      case "1": return s1ClientNom.length > 0;
      case "2": return !!selectedCommune || s2Localisation.length > 0;
      case "3": return s3RegimePropriete.length > 0 && s3RefActe.length > 0;
      case "4": return !!selectedCommune || s4Urbanisme.length > 0;
      case "5": return surfaceBien > 0;
      case "6": return s6Occupation.length > 0;
      case "7": return valeurComparaison > 0 || !!selectedCommune || s7Tendances.length > 0;
      case "8": return s8Forces.length > 0 || s8Faiblesses.length > 0;
      case "9": return valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0;
      case "10": return valeurReconciliee > 0;
      case "11": return s11ExpertNom.length > 0;
      case "A": return annexePlans || annexePhotos || annexeJuridique || annexeUrbanisme || annexeTechnique || annexeLocatif || annexeCalculs || annexeESG || annexeQualifications;
      default: return false;
    }
  };

  const totalSections = 12; // 11 + annexes
  const filledSections = SECTIONS.filter((s) => isSectionFilled(s.num)).length;

  const conditionOptions = [
    { value: "neuf", label: t("rptCondNeuf") },
    { value: "tres_bon", label: t("rptCondTresBon") },
    { value: "bon", label: t("rptCondBon") },
    { value: "moyen", label: t("rptCondMoyen") },
    { value: "a_renover", label: t("rptCondARenover") },
  ];

  /* ================================================================
     SECTION RENDERERS
     ================================================================ */

  // ==================== 1. MISSION ====================
  const renderSection1 = () => (
    <div className="space-y-6">
      {/* 1.1 Identité du client */}
      <div className="space-y-3">
        <SubSection num="1.1" title={t("rpt1_1_title")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField label={t("rpt1_1_nom")} type="text" value={s1ClientNom} onChange={setS1ClientNom} />
          <InputField label={t("rpt1_1_siren")} type="text" value={s1ClientSIREN} onChange={setS1ClientSIREN} hint={t("rpt1_1_sirenHint")} />
        </div>
        <InputField label={t("rpt1_1_adresse")} type="text" value={s1ClientAdresse} onChange={setS1ClientAdresse} />
        <InputField label={t("rpt1_1_lien")} type="text" value={s1ClientLien} onChange={setS1ClientLien} hint={t("rpt1_1_lienHint")} />
      </div>

      {/* 1.2 Finalité */}
      <div className="space-y-3">
        <SubSection num="1.2" title={t("rpt1_2_title")} />
        <InputField
          label={t("rpt1_2_typeMission")}
          type="select"
          value={s1TypeMission}
          onChange={(v) => setS1TypeMission(v as EVSValueType)}
          options={EVS_VALUE_TYPES.map((e) => ({ value: e.id, label: `${e.evs} — ${t(e.labelKey)}` }))}
        />
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt1_2_finalite")}</label>
          <TA value={s1Finalite} onChange={setS1Finalite} placeholder={t("rpt1_2_finaliteHint")} rows={2} />
        </div>
        <InputField label={t("rpt1_2_utilisation")} type="text" value={s1UtilisationPrevue} onChange={setS1UtilisationPrevue} hint={t("rpt1_2_utilisationHint")} />
      </div>

      {/* 1.3 Identification des biens */}
      <div className="space-y-3">
        <SubSection num="1.3" title={t("rpt1_3_title")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField label={t("rpt1_3_designation")} type="text" value={s1BienDesignation} onChange={setS1BienDesignation} />
          <InputField label={t("rpt1_3_adresse")} type="text" value={s1BienAdresse} onChange={setS1BienAdresse} />
          <InputField label={t("rpt1_3_usage")} type="text" value={s1BienUsage} onChange={setS1BienUsage} />
          <InputField label={t("rpt1_3_cadastre")} type="text" value={s1BienCadastre} onChange={setS1BienCadastre} hint={t("rptCadastralHint")} />
        </div>
        <InputField label={t("rpt1_3_lots")} type="text" value={s1BienLots} onChange={setS1BienLots} hint={t("rpt1_3_lotsHint")} />
      </div>

      {/* 1.4 Référentiels */}
      <div className="space-y-2">
        <SubSection num="1.4" title={t("rpt1_4_title")} />
        <AutoData>
          <p className="text-sm font-medium text-navy">{t("rpt1_4_auto")}</p>
        </AutoData>
      </div>

      {/* 1.5 Types de valeur */}
      <div className="space-y-3">
        <SubSection num="1.5" title={t("rpt1_5_title")} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Check checked={s1ValVenale} onChange={setS1ValVenale} label={t("rpt1_5_venale")} />
          <Check checked={s1ValLocative} onChange={setS1ValLocative} label={t("rpt1_5_locative")} />
          <Check checked={s1ValCRR} onChange={setS1ValCRR} label={t("rpt1_5_crr")} />
          <Check checked={s1ValLTV} onChange={setS1ValLTV} label={t("rpt1_5_ltv")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt1_5_hypotheses")}</label>
          <TA value={s1Hypotheses} onChange={setS1Hypotheses} placeholder={t("rpt1_5_hypothesesHint")} />
        </div>
      </div>

      {/* 1.5b Hypothèses spéciales */}
      <div className="space-y-2">
        <SubSection num="1.5b" title={t("rpt1_5b_title")} />
        <TA value={s1HypothesesSpeciales} onChange={setS1HypothesesSpeciales} placeholder={t("rpt1_5b_hint")} />
      </div>

      {/* 1.6 Indépendance */}
      <div className="space-y-2">
        <SubSection num="1.6" title={t("rpt1_6_title")} />
        <AutoData>
          <p className="text-sm text-slate">{t("rptIndependanceText")}</p>
        </AutoData>
        <TA value={s1Independance} onChange={setS1Independance} placeholder={t("rpt1_6_hint")} rows={2} />
      </div>

      {/* 1.7 Compétence */}
      <div className="space-y-2">
        <SubSection num="1.7" title={t("rpt1_7_title")} />
        <AutoData>
          <p className="text-sm text-slate">{t("rptCompetenceText")}</p>
        </AutoData>
      </div>

      {/* 1.8 Visite */}
      <div className="space-y-3">
        <SubSection num="1.8" title={t("rpt1_8_title")} />
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label={t("rpt1_8_date")} type="text" value={s1DateVisite} onChange={setS1DateVisite} hint="AAAA-MM-JJ" />
          <InputField label={t("rpt1_8_personne")} type="text" value={s1PersonneVisite} onChange={setS1PersonneVisite} />
          <InputField label={t("rpt1_8_conditions")} type="text" value={s1ConditionsVisite} onChange={setS1ConditionsVisite} />
        </div>
      </div>

      {/* 1.9 Date de valeur */}
      <div className="space-y-2">
        <SubSection num="1.9" title={t("rpt1_9_title")} />
        <InputField label={t("rpt1_9_date")} type="text" value={s1DateValeur} onChange={setS1DateValeur} hint="AAAA-MM-JJ" />
      </div>

      {/* 1.10 Date de rédaction */}
      <div className="space-y-2">
        <SubSection num="1.10" title={t("rpt1_10_title")} />
        <AutoData>
          <p className="text-sm font-mono text-navy">{today}</p>
        </AutoData>
      </div>

      {/* 1.11 Documents */}
      <div className="space-y-3">
        <SubSection num="1.11" title={t("rpt1_11_title")} />
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt1_11_fournis")}</label>
          <TA value={s1DocsFournis} onChange={setS1DocsFournis} placeholder={t("rpt1_11_fournisHint")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt1_11_demandesNonFournis")}</label>
          <TA value={s1DocsDemandesNonFournis} onChange={setS1DocsDemandesNonFournis} placeholder={t("rpt1_11_demandesNonFournisHint")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt1_11_collectes")}</label>
          <TA value={s1DocsCollectes} onChange={setS1DocsCollectes} placeholder={t("rpt1_11_collectesHint")} />
        </div>
      </div>

      {/* 1.12 Clauses restrictives */}
      <div className="space-y-3">
        <SubSection num="1.12" title={t("rpt1_12_title")} />
        <div className="space-y-2">
          <Check checked={s1ClauseInspection} onChange={setS1ClauseInspection} label={t("rpt1_12_inspection")} />
          <Check checked={s1ClauseDocuments} onChange={setS1ClauseDocuments} label={t("rpt1_12_documents")} />
          <Check checked={s1ClauseEnvironnement} onChange={setS1ClauseEnvironnement} label={t("rpt1_12_environnement")} />
          <Check checked={s1ClauseMarche} onChange={setS1ClauseMarche} label={t("rpt1_12_marche")} />
        </div>
        <TA value={s1ClausesTexte} onChange={setS1ClausesTexte} placeholder={t("rpt1_12_clausesHint")} />
      </div>
    </div>
  );

  // ==================== 2. SITUATION GÉOGRAPHIQUE ====================
  const renderSection2 = () => (
    <div className="space-y-6">
      {/* 2.1 Situation générale */}
      <div className="space-y-2">
        <SubSection num="2.1" title={t("rpt2_1_title")} />
        {selectedCommune ? (
          <AutoData>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-muted">{t("commune")} :</span>{" "}
                <span className="font-semibold text-navy">{selectedCommune.commune}</span>
              </div>
              <div>
                <span className="text-muted">{t("rptCanton")} :</span>{" "}
                <span className="font-semibold text-navy">{selectedCommune.canton}</span>
              </div>
              {selectedCommune.prixM2Existant && (
                <div>
                  <span className="text-muted">{t("prixM2Transactions")} :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{formatEUR(selectedCommune.prixM2Existant)}/m²</span>
                </div>
              )}
              {selectedCommune.nbTransactions && (
                <div>
                  <span className="text-muted">{t("rptNbTransactions")} :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{selectedCommune.nbTransactions}</span>
                </div>
              )}
            </div>
          </AutoData>
        ) : (
          <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
            {t("rptSelectCommuneFirst")}
          </div>
        )}
      </div>

      {/* 2.2 Localisation particulière */}
      <div className="space-y-2">
        <SubSection num="2.2" title={t("rpt2_2_title")} />
        <TA value={s2Localisation} onChange={setS2Localisation} placeholder={t("rpt2_2_hint")} />
      </div>

      {/* 2.3 Environnement et voisinage */}
      <div className="space-y-2">
        <SubSection num="2.3" title={t("rpt2_3_title")} />
        <TA value={s2Environnement} onChange={setS2Environnement} placeholder={t("rpt2_3_hint")} />
      </div>

      {/* 2.4 Desserte et transports */}
      <div className="space-y-2">
        <SubSection num="2.4" title={t("rpt2_4_title")} />
        <TA value={s2Desserte} onChange={setS2Desserte} placeholder={t("rpt2_4_hint")} />
      </div>
    </div>
  );

  // ==================== 3. SITUATION JURIDIQUE ====================
  const renderSection3 = () => (
    <div className="space-y-6">
      {/* 3.1 Régime de propriété */}
      <div className="space-y-3">
        <SubSection num="3.1" title={t("rpt3_1_title")} />
        <InputField
          label={t("rptOwnershipType")}
          type="select"
          value={s3RegimePropriete}
          onChange={setS3RegimePropriete}
          options={[
            { value: "pleine_propriete", label: t("rptPleinePropriete") },
            { value: "copropriete", label: t("rptCopropriete") },
            { value: "indivision", label: t("rpt3_1_indivision") },
            { value: "emphyteose", label: t("rptEmphyteose") },
            { value: "droit_superficie", label: t("rptDroitSuperficie") },
            { value: "bail_construction", label: t("rpt3_1_bailConstruction") },
          ]}
        />
      </div>

      {/* 3.2 Titre de propriété */}
      <div className="space-y-3">
        <SubSection num="3.2" title={t("rpt3_2_title")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField label={t("rpt3_2_refActe")} type="text" value={s3RefActe} onChange={setS3RefActe} hint={t("rpt3_2_refActeHint")} />
          <InputField label={t("rpt3_2_dateAcquisition")} type="text" value={s3DateAcquisition} onChange={setS3DateAcquisition} hint="AAAA-MM-JJ" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rptServitudes")}</label>
          <TA value={s3Servitudes} onChange={setS3Servitudes} placeholder={t("rptServitudesHint")} />
        </div>
      </div>

      {/* 3.3 Règlement de copropriété */}
      <div className="space-y-3">
        <SubSection num="3.3" title={t("rpt3_3_title")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField label={t("rpt3_3_dateReglement")} type="text" value={s3DateReglement} onChange={setS3DateReglement} hint="AAAA-MM-JJ" />
          <InputField label={t("rpt3_3_tantiemes")} type="text" value={s3Tantiemes} onChange={setS3Tantiemes} hint={t("rpt3_3_tantièmesHint")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt3_3_elements")}</label>
          <TA value={s3ElementsCopro} onChange={setS3ElementsCopro} placeholder={t("rpt3_3_elementsHint")} />
        </div>
      </div>
    </div>
  );

  // ==================== 4. SITUATION URBANISTIQUE ====================
  const renderSection4 = () => (
    <div className="space-y-6">
      {/* 4.1 Documents d'urbanisme */}
      <div className="space-y-2">
        <SubSection num="4.1" title={t("rpt4_1_title")} />
        {selectedCommune ? (
          <AutoData>
            <p className="text-sm text-slate">{t("rptPAGNote")}</p>
          </AutoData>
        ) : (
          <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
            {t("rptSelectCommuneFirst")}
          </div>
        )}
        <TA value={s4Urbanisme} onChange={setS4Urbanisme} placeholder={t("rpt4_1_hint")} />
      </div>

      {/* 4.2 Servitudes publiques */}
      <div className="space-y-2">
        <SubSection num="4.2" title={t("rpt4_2_title")} />
        <TA value={s4ServitudesPubliques} onChange={setS4ServitudesPubliques} placeholder={t("rpt4_2_hint")} />
      </div>

      {/* 4.3 Constructibilité */}
      <div className="space-y-2">
        <SubSection num="4.3" title={t("rpt4_3_title")} />
        <TA value={s4Constructibilite} onChange={setS4Constructibilite} placeholder={t("rpt4_3_hint")} />
      </div>

      {/* 4.4 Projets */}
      <div className="space-y-2">
        <SubSection num="4.4" title={t("rpt4_4_title")} />
        <TA value={s4Projets} onChange={setS4Projets} placeholder={t("rpt4_4_hint")} />
      </div>
    </div>
  );

  // ==================== 5. DESCRIPTION DU BIEN ====================
  const renderSection5 = () => (
    <div className="space-y-6">
      {/* 5.1 Nature et consistance */}
      <div className="space-y-3">
        <SubSection num="5.1" title={t("rpt5_1_title")} />
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField
            label={t("rptBuildingType")}
            type="select"
            value={s5TypeConstruction}
            onChange={setS5TypeConstruction}
            options={[
              { value: "residential_apartment", label: t("rptAppartement") },
              { value: "residential_house", label: t("rptMaison") },
              { value: "residential_building", label: t("rpt5_1_immeuble") },
              { value: "office", label: t("rptBureaux") },
              { value: "retail", label: t("rptCommerce") },
              { value: "mixed_use", label: t("rptMixte") },
            ]}
          />
          <InputField label={t("rpt5_1_structure")} type="text" value={s5Structure} onChange={setS5Structure} hint={t("rpt5_1_structureHint")} />
          <InputField label={t("esgAnneeConstruction")} value={s5Annee} onChange={(v) => setS5Annee(Number(v))} min={1800} max={2030} />
        </div>
      </div>

      {/* 5.2 Usage */}
      <div className="space-y-3">
        <SubSection num="5.2" title={t("rpt5_2_title")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField label={t("rpt5_2_physique")} type="text" value={s5UsagePhysique} onChange={setS5UsagePhysique} />
          <InputField label={t("rpt5_2_juridique")} type="text" value={s5UsageJuridique} onChange={setS5UsageJuridique} />
        </div>
      </div>

      {/* 5.3 Surfaces */}
      <div className="space-y-3">
        <SubSection num="5.3" title={t("rpt5_3_title")} />
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label={t("rpt5_3_surfaceTerrain")} value={s5SurfaceTerrain} onChange={(v) => setS5SurfaceTerrain(Number(v))} suffix="m²" />
          <div>
            <AutoData>
              <div className="text-sm">
                <span className="text-muted">{t("surfaceDuBien")} :</span>{" "}
                <span className="font-mono font-semibold text-navy">{s5SurfaceBatiment} m²</span>
              </div>
            </AutoData>
          </div>
          <InputField label={t("rpt5_3_sourceMesures")} type="text" value={s5SourceMesures} onChange={setS5SourceMesures} hint={t("rpt5_3_sourceMesuresHint")} />
        </div>
      </div>

      {/* 5.4 État d'entretien */}
      <div className="space-y-3">
        <SubSection num="5.4" title={t("rpt5_4_title")} />
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label={t("rpt5_4_grosOeuvre")} type="select" value={s5GrosOeuvre} onChange={setS5GrosOeuvre} options={conditionOptions} />
          <InputField label={t("rpt5_4_secondOeuvre")} type="select" value={s5SecondOeuvre} onChange={setS5SecondOeuvre} options={conditionOptions} />
          <InputField label={t("rpt5_4_finitions")} type="select" value={s5Finitions} onChange={setS5Finitions} options={conditionOptions} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_4_diagnostics")}</label>
          <TA value={s5Diagnostics} onChange={setS5Diagnostics} placeholder={t("rpt5_4_diagnosticsHint")} />
        </div>
      </div>

      {/* 5.5 Équipements */}
      <div className="space-y-3">
        <SubSection num="5.5" title={t("rpt5_5_title")} />
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_5_confort")}</label>
          <TA value={s5Confort} onChange={setS5Confort} placeholder={t("rpt5_5_confortHint")} rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_5_installations")}</label>
          <TA value={s5Installations} onChange={setS5Installations} placeholder={t("rpt5_5_installationsHint")} rows={2} />
        </div>
      </div>

      {/* 5.6 Annexes */}
      <div className="space-y-2">
        <SubSection num="5.6" title={t("rpt5_6_title")} />
        <TA value={s5Annexes} onChange={setS5Annexes} placeholder={t("rpt5_6_hint")} />
      </div>

      {/* 5.7 ESG & Environnement */}
      <div className="space-y-4">
        <SubSection num="5.7" title={t("rpt5_7_title")} />

        {/* Performance énergétique */}
        <div className="space-y-3 rounded-lg border border-card-border p-4">
          <h5 className="text-xs font-semibold text-navy uppercase tracking-wider">{t("rpt5_7_perfEnergetique")}</h5>
          <InputField
            label={t("esgClasseEnergie")}
            type="select"
            value={s5ClasseEnergie}
            onChange={setS5ClasseEnergie}
            options={["A", "B", "C", "D", "E", "F", "G"].map((c) => ({ value: c, label: c }))}
          />
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_7_obligationsRenov")}</label>
            <TA value={s5ObligationsRenov} onChange={setS5ObligationsRenov} placeholder={t("rpt5_7_obligationsRenovHint")} rows={2} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_7_consommations")}</label>
              <TA value={s5Consommations} onChange={setS5Consommations} placeholder={t("rpt5_7_consommationsHint")} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_7_coutsConformite")}</label>
              <TA value={s5CoutsConformite} onChange={setS5CoutsConformite} placeholder={t("rpt5_7_coutsConformiteHint")} rows={2} />
            </div>
          </div>
        </div>

        {/* Facteurs environnementaux Art. 208 EBA */}
        <div className="space-y-3 rounded-lg border border-card-border p-4">
          <h5 className="text-xs font-semibold text-navy uppercase tracking-wider">{t("rpt5_7_art208")}</h5>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_7_risquesClimat")}</label>
              <TA value={s5RisquesClimat} onChange={setS5RisquesClimat} placeholder={t("rpt5_7_risquesClimatHint")} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_7_geologie")}</label>
              <TA value={s5Geologie} onChange={setS5Geologie} placeholder={t("rpt5_7_geologieHint")} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_7_contamination")}</label>
              <TA value={s5Contamination} onChange={setS5Contamination} placeholder={t("rpt5_7_contaminationHint")} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t("rpt5_7_eau")}</label>
              <TA value={s5Eau} onChange={setS5Eau} placeholder={t("rpt5_7_eauHint")} rows={2} />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-navy uppercase tracking-wider">{t("rpt5_7_certifications")}</h5>
          <TA value={s5Certifications} onChange={setS5Certifications} placeholder={t("rpt5_7_certificationsHint")} rows={2} />
        </div>

        <div className="rounded-lg bg-navy/5 border border-navy/10 p-3">
          <p className="text-xs text-slate">
            <span className="font-semibold text-navy">{t("rptESGArt208")} :</span> {t("rptESGArt208Text")}
          </p>
        </div>
      </div>
    </div>
  );

  // ==================== 6. SITUATION LOCATIVE ====================
  const renderSection6 = () => (
    <div className="space-y-6">
      {/* 6.1 État d'occupation */}
      <div className="space-y-3">
        <SubSection num="6.1" title={t("rpt6_1_title")} />
        <InputField
          label={t("rpt6_1_occupation")}
          type="select"
          value={s6Occupation}
          onChange={setS6Occupation}
          options={[
            { value: "libre", label: t("rpt6_1_libre") },
            { value: "occupe_proprietaire", label: t("rpt6_1_occupeProprietaire") },
            { value: "loue", label: t("rpt6_1_loue") },
            { value: "partiellement_loue", label: t("rpt6_1_partiellementLoue") },
            { value: "vacant", label: t("rpt6_1_vacant") },
          ]}
        />
      </div>

      {/* 6.2 Analyse des baux */}
      <div className="space-y-3">
        <SubSection num="6.2" title={t("rpt6_2_title")} />
        {(valeurCapitalisation > 0 || valeurDCF > 0) ? (
          <AutoData>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {valeurCapitalisation > 0 && (
                <div>
                  <span className="text-muted">{t("tabCapitalisation")} :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{formatEUR(valeurCapitalisation)}</span>
                </div>
              )}
              {valeurDCF > 0 && (
                <div>
                  <span className="text-muted">DCF :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{formatEUR(valeurDCF)}</span>
                </div>
              )}
            </div>
          </AutoData>
        ) : (
          <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
            {t("rptFillCapOrDCF")}
          </div>
        )}
        {/* Locaux vacants */}
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt6_2_vacants")}</label>
          <TA value={s6VacantsDescription} onChange={setS6VacantsDescription} placeholder={t("rpt6_2_vacantsHint")} />
        </div>
      </div>

      {/* 6.3 Charges */}
      <div className="space-y-2">
        <SubSection num="6.3" title={t("rpt6_3_title")} />
        <TA value={s6Charges} onChange={setS6Charges} placeholder={t("rpt6_3_hint")} />
      </div>
    </div>
  );

  // ==================== 7. ÉTUDE DE MARCHÉ ====================
  const renderSection7 = () => (
    <div className="space-y-6">
      {/* 7.1 Analyse du marché */}
      <div className="space-y-3">
        <SubSection num="7.1" title={t("rpt7_1_title")} />
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt7_1_tendances")}</label>
          <TA value={s7Tendances} onChange={setS7Tendances} placeholder={t("rpt7_1_tendancesHint")} />
        </div>
        {/* Auto macro data */}
        {selectedCommune && (
          <AutoData>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-muted">{t("commune")} :</span>{" "}
                <span className="font-semibold text-navy">{selectedCommune.commune}</span>
              </div>
              {selectedCommune.prixM2Existant && (
                <div>
                  <span className="text-muted">{t("prixM2Transactions")} :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{formatEUR(selectedCommune.prixM2Existant)}/m²</span>
                </div>
              )}
              {selectedCommune.prixM2VEFA && (
                <div>
                  <span className="text-muted">{t("prixM2VEFA")} :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{formatEUR(selectedCommune.prixM2VEFA)}/m²</span>
                </div>
              )}
              {selectedCommune.loyerM2Annonces && (
                <div>
                  <span className="text-muted">{t("loyerM2Mois")} :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{selectedCommune.loyerM2Annonces.toFixed(1)} EUR</span>
                </div>
              )}
            </div>
          </AutoData>
        )}
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt7_1_offreDemande")}</label>
          <TA value={s7OffreDemande} onChange={setS7OffreDemande} placeholder={t("rpt7_1_offreDemandeHint")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1">{t("rpt7_1_perspectives")}</label>
          <TA value={s7Perspectives} onChange={setS7Perspectives} placeholder={t("rpt7_1_perspectivesHint")} />
        </div>
      </div>

      {/* 7.2 Transactions comparables */}
      <div className="space-y-2">
        <SubSection num="7.2" title={t("rpt7_2_title")} />
        {valeurComparaison > 0 ? (
          <AutoData>
            <div className="text-sm">
              <span className="text-muted">{t("valeurParComparaison")} :</span>{" "}
              <span className="font-mono font-semibold text-navy">{formatEUR(valeurComparaison)}</span>
            </div>
          </AutoData>
        ) : (
          <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
            {t("rptSelectCommuneFirst")}
          </div>
        )}
      </div>
    </div>
  );

  // ==================== 8. SWOT ====================
  const renderSection8 = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 8.1 Forces */}
        <div>
          <SubSection num="8.1" title={t("rptForces")} />
          <div className="mt-1">
            <SwotTA
              value={s8Forces}
              onChange={setS8Forces}
              placeholder={t("rptForcesPlaceholder")}
              color="green"
            />
          </div>
        </div>

        {/* 8.2 Faiblesses */}
        <div>
          <SubSection num="8.2" title={t("rptFaiblesses")} />
          <div className="mt-1">
            <SwotTA
              value={s8Faiblesses}
              onChange={setS8Faiblesses}
              placeholder={t("rptFaiblessesPlaceholder")}
              color="red"
            />
          </div>
        </div>

        {/* 8.3 Opportunités */}
        <div>
          <SubSection num="8.3" title={t("rptOpportunites")} />
          <div className="mt-1">
            <SwotTA
              value={s8Opportunites}
              onChange={setS8Opportunites}
              placeholder={t("rptOpportunitesPlaceholder")}
              color="blue"
              suggestions={[
                t("rpt8_3_sug1"),
                t("rpt8_3_sug2"),
              ]}
            />
          </div>
        </div>

        {/* 8.4 Menaces */}
        <div>
          <SubSection num="8.4" title={t("rptMenaces")} />
          <div className="mt-1">
            <SwotTA
              value={s8Menaces}
              onChange={setS8Menaces}
              placeholder={t("rptMenacesPlaceholder")}
              color="amber"
              suggestions={[
                t("rpt8_4_sug1"),
                t("rpt8_4_sug2"),
                t("rpt8_4_sug3"),
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== 9. ÉVALUATION ====================
  const renderSection9 = () => {
    const hasAnyValue = valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0;
    return (
      <div className="space-y-6">
        {/* 9.1 Méthodes retenues */}
        <div className="space-y-3">
          <SubSection num="9.1" title={t("rpt9_1_title")} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Check checked={s9MethodeComparaison} onChange={setS9MethodeComparaison} label={t("tabComparaison")} />
            <Check checked={s9MethodeCapitalisation} onChange={setS9MethodeCapitalisation} label={t("tabCapitalisation")} />
            <Check checked={s9MethodeDCF} onChange={setS9MethodeDCF} label="DCF" />
            <Check checked={s9MethodeResiduelle} onChange={setS9MethodeResiduelle} label={t("rpt9_1_residuelle")} />
            <Check checked={s9MethodeTermeReversion} onChange={setS9MethodeTermeReversion} label={t("tabTermeReversion")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("rpt9_1_justification")}</label>
            <TA value={s9Justification} onChange={setS9Justification} placeholder={t("rpt9_1_justificationHint")} />
          </div>
        </div>

        {/* 9.2 Comparaison */}
        {s9MethodeComparaison && (
          <div className="space-y-2">
            <SubSection num="9.2" title={t("rpt9_2_title")} />
            {valeurComparaison > 0 ? (
              <AutoData>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{t("tabComparaison")}</span>
                  <span className="font-mono font-semibold text-navy">{formatEUR(valeurComparaison)}</span>
                </div>
              </AutoData>
            ) : (
              <div className="rounded-lg border border-dashed border-card-border p-3 text-center text-sm text-muted">
                {t("rptFillAtLeastOneMethod")}
              </div>
            )}
          </div>
        )}

        {/* 9.3 Rendement */}
        {s9MethodeCapitalisation && (
          <div className="space-y-2">
            <SubSection num="9.3" title={t("rpt9_3_title")} />
            {valeurCapitalisation > 0 ? (
              <AutoData>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{t("tabCapitalisation")}</span>
                  <span className="font-mono font-semibold text-navy">{formatEUR(valeurCapitalisation)}</span>
                </div>
              </AutoData>
            ) : (
              <div className="rounded-lg border border-dashed border-card-border p-3 text-center text-sm text-muted">
                {t("rptFillCapOrDCF")}
              </div>
            )}
          </div>
        )}

        {/* 9.4 Résiduelle énergétique */}
        {s9MethodeResiduelle && (
          <div className="space-y-2">
            <SubSection num="9.4" title={t("rpt9_4_title")} />
            <div className="rounded-lg border border-dashed border-card-border p-3 text-center text-sm text-muted">
              {t("rpt9_4_hint")}
            </div>
          </div>
        )}

        {/* 9.5 DCF */}
        {s9MethodeDCF && (
          <div className="space-y-2">
            <SubSection num="9.5" title={t("rpt9_5_title")} />
            {valeurDCF > 0 ? (
              <AutoData>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">DCF</span>
                  <span className="font-mono font-semibold text-navy">{formatEUR(valeurDCF)}</span>
                </div>
              </AutoData>
            ) : (
              <div className="rounded-lg border border-dashed border-card-border p-3 text-center text-sm text-muted">
                {t("rptFillCapOrDCF")}
              </div>
            )}
          </div>
        )}

        {/* 9.6 Terme & Réversion */}
        {s9MethodeTermeReversion && (
          <div className="space-y-2">
            <SubSection num="9.6" title={t("rpt9_6_title")} />
            <div className="rounded-lg border border-dashed border-card-border p-3 text-center text-sm text-muted">
              {t("rpt9_6_hint")}
            </div>
          </div>
        )}

        {/* 9.7 Réconciliation */}
        <div className="space-y-2">
          <SubSection num="9.7" title={t("rpt9_7_title")} />
          {hasAnyValue ? (
            <AutoData>
              <div className="space-y-2 text-sm">
                {valeurComparaison > 0 && (
                  <div className="flex justify-between py-1 border-b border-blue-200/50">
                    <span className="text-muted">{t("tabComparaison")}</span>
                    <span className="font-mono font-semibold text-navy">{formatEUR(valeurComparaison)}</span>
                  </div>
                )}
                {valeurCapitalisation > 0 && (
                  <div className="flex justify-between py-1 border-b border-blue-200/50">
                    <span className="text-muted">{t("tabCapitalisation")}</span>
                    <span className="font-mono font-semibold text-navy">{formatEUR(valeurCapitalisation)}</span>
                  </div>
                )}
                {valeurDCF > 0 && (
                  <div className="flex justify-between py-1 border-b border-blue-200/50">
                    <span className="text-muted">DCF</span>
                    <span className="font-mono font-semibold text-navy">{formatEUR(valeurDCF)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 font-semibold text-navy">
                  <span>{t("recValeurReconciliee")}</span>
                  <span className="font-mono">{formatEUR(valeurReconciliee)}</span>
                </div>
              </div>
            </AutoData>
          ) : (
            <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
              {t("rptFillAtLeastOneMethod")}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== 10. CONCLUSIONS ====================
  const renderSection10 = () => {
    const hasAnyValue = valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0;
    return (
      <div className="space-y-6">
        {/* 10.1 Synthèse des méthodes */}
        <div className="space-y-2">
          <SubSection num="10.1" title={t("rpt10_1_title")} />
          {hasAnyValue ? (
            <AutoData>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-200/50">
                      <th className="py-2 text-left text-muted font-medium">{t("rpt10_1_methode")}</th>
                      <th className="py-2 text-right text-muted font-medium">{t("valeurEstimee")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valeurComparaison > 0 && (
                      <tr className="border-b border-blue-100/50">
                        <td className="py-2 text-slate">{t("tabComparaison")}</td>
                        <td className="py-2 text-right font-mono font-semibold text-navy">{formatEUR(valeurComparaison)}</td>
                      </tr>
                    )}
                    {valeurCapitalisation > 0 && (
                      <tr className="border-b border-blue-100/50">
                        <td className="py-2 text-slate">{t("tabCapitalisation")}</td>
                        <td className="py-2 text-right font-mono font-semibold text-navy">{formatEUR(valeurCapitalisation)}</td>
                      </tr>
                    )}
                    {valeurDCF > 0 && (
                      <tr className="border-b border-blue-100/50">
                        <td className="py-2 text-slate">DCF</td>
                        <td className="py-2 text-right font-mono font-semibold text-navy">{formatEUR(valeurDCF)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AutoData>
          ) : (
            <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
              {t("rptFillAtLeastOneMethod")}
            </div>
          )}
        </div>

        {/* 10.2 Valeur retenue */}
        <div className="space-y-3">
          <SubSection num="10.2" title={t("rpt10_2_title")} />
          {hasAnyValue && (
            <div className="rounded-lg bg-gold/10 border border-gold/30 p-4">
              <div className="text-center">
                <div className="text-xs text-muted uppercase tracking-wider">{t("recValeurReconciliee")}</div>
                <div className="text-3xl font-bold text-navy mt-1">{formatEUR(valeurReconciliee)}</div>
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label={t("rpt10_2_horsDroits")} value={s10ValeurHorsDroits || valeurReconciliee} onChange={(v) => setS10ValeurHorsDroits(Number(v))} prefix="EUR" />
            <InputField label={t("rpt10_2_droitsInclus")} value={s10ValeurDroitsInclus} onChange={(v) => setS10ValeurDroitsInclus(Number(v))} prefix="EUR" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("rpt10_2_regimeFiscal")}</label>
            <TA value={s10RegimeFiscal} onChange={setS10RegimeFiscal} placeholder={t("rpt10_2_regimeFiscalHint")} rows={2} />
          </div>
          {/* CRR / MLV */}
          {valeurMarchePourMLV > 0 && (
            <AutoData>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted">{t("rpt10_2_crr")} :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{formatEUR(valeurMarchePourMLV)}</span>
                </div>
                <div>
                  <span className="text-muted">LTV (80 %) :</span>{" "}
                  <span className="font-mono font-semibold text-navy">{formatEUR(valeurMarchePourMLV * 0.8)}</span>
                </div>
              </div>
            </AutoData>
          )}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("rpt10_2_impactESG")}</label>
            <TA value={s10ImpactESG} onChange={setS10ImpactESG} placeholder={t("rpt10_2_impactESGHint")} rows={2} />
          </div>
        </div>

        {/* 10.3 Réserves */}
        <div className="space-y-2">
          <SubSection num="10.3" title={t("rpt10_3_title")} />
          <TA value={s10Reserves} onChange={setS10Reserves} placeholder={t("rpt10_3_hint")} />
        </div>

        {/* 10.3b Incertitude */}
        <div className="space-y-2">
          <SubSection num="10.3b" title={t("rpt10_3b_title")} />
          <TA value={s10Incertitude} onChange={setS10Incertitude} placeholder={t("rpt10_3b_hint")} />
        </div>
      </div>
    );
  };

  // ==================== 11. CERTIFICATION ====================
  const renderSection11 = () => (
    <div className="space-y-6">
      {/* Expert info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label={t("rptExpertName")} type="text" value={s11ExpertNom} onChange={setS11ExpertNom} />
        <InputField
          label={t("rptExpertQualif")}
          type="select"
          value={s11ExpertQualif}
          onChange={setS11ExpertQualif}
          options={[
            { value: "REV (TEGOVA)", label: "REV (TEGOVA)" },
            { value: "TRV (TEGOVA)", label: "TRV (TEGOVA)" },
            { value: "MRICS", label: "MRICS" },
            { value: "FRICS", label: "FRICS" },
            { value: "Expert immobilier agree", label: t("rptExpertAgree") },
          ]}
        />
      </div>

      {/* 6 Certification statements */}
      <div className="space-y-3 rounded-lg bg-navy/5 border border-navy/10 p-4">
        <h5 className="text-xs font-semibold text-navy uppercase tracking-wider">{t("rpt11_certStatements")}</h5>
        <div className="space-y-2 text-sm">
          <Check checked={s11Cert1} onChange={setS11Cert1} label={t("rpt11_cert1")} />
          <Check checked={s11Cert2} onChange={setS11Cert2} label={t("rpt11_cert2")} />
          <Check checked={s11Cert3} onChange={setS11Cert3} label={t("rpt11_cert3")} />
          <Check checked={s11Cert4} onChange={setS11Cert4} label={t("rpt11_cert4")} />
          <Check checked={s11Cert5} onChange={setS11Cert5} label={t("rpt11_cert5")} />
          <Check checked={s11Cert6} onChange={setS11Cert6} label={t("rpt11_cert6")} />
        </div>
      </div>

      {/* Date de signature */}
      <InputField label={t("rpt11_dateSignature")} type="text" value={s11DateSignature} onChange={setS11DateSignature} hint="AAAA-MM-JJ" />

      {/* Référentiel */}
      <AutoData>
        <p className="text-sm font-medium text-navy">{t("rpt1_4_auto")}</p>
      </AutoData>
    </div>
  );

  // ==================== ANNEXES ====================
  const renderSectionA = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("rptA_description")}</p>
      <div className="space-y-2">
        <Check checked={annexePlans} onChange={setAnnexePlans} label={t("rptA_1_plans")} />
        <Check checked={annexePhotos} onChange={setAnnexePhotos} label={t("rptA_2_photos")} />
        <Check checked={annexeJuridique} onChange={setAnnexeJuridique} label={t("rptA_3_juridique")} />
        <Check checked={annexeUrbanisme} onChange={setAnnexeUrbanisme} label={t("rptA_4_urbanisme")} />
        <Check checked={annexeTechnique} onChange={setAnnexeTechnique} label={t("rptA_5_technique")} />
        <Check checked={annexeLocatif} onChange={setAnnexeLocatif} label={t("rptA_6_locatif")} />
        <Check checked={annexeCalculs} onChange={setAnnexeCalculs} label={t("rptA_7_calculs")} />
        <Check checked={annexeESG} onChange={setAnnexeESG} label={t("rptA_8_esg")} />
        <Check checked={annexeQualifications} onChange={setAnnexeQualifications} label={t("rptA_9_qualifications")} />
      </div>
    </div>
  );

  /* ================================================================
     RENDERER MAP
     ================================================================ */
  const sectionRenderers: Record<string, () => React.JSX.Element> = {
    "1": renderSection1,
    "2": renderSection2,
    "3": renderSection3,
    "4": renderSection4,
    "5": renderSection5,
    "6": renderSection6,
    "7": renderSection7,
    "8": renderSection8,
    "9": renderSection9,
    "10": renderSection10,
    "11": renderSection11,
    "A": renderSectionA,
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-navy">{t("rptProgress")}</div>
          <div
            className={`text-sm font-bold ${
              filledSections >= 10
                ? "text-success"
                : filledSections >= 6
                  ? "text-warning"
                  : "text-error"
            }`}
          >
            {filledSections}/{totalSections} {t("rptSectionsRemplies")}
          </div>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full transition-all ${
              filledSections >= 10
                ? "bg-success"
                : filledSections >= 6
                  ? "bg-warning"
                  : "bg-error"
            }`}
            style={{ width: `${(filledSections / totalSections) * 100}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const isExpanded = expanded[section.num] ?? false;
        const isFilled = isSectionFilled(section.num);

        return (
          <div
            key={section.num}
            className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => toggleSection(section.num)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-background/50 transition-colors"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  isFilled
                    ? "bg-success/10 text-success"
                    : "bg-navy/10 text-navy"
                }`}
              >
                {section.num}
              </span>
              <span className="flex-1 text-sm font-semibold text-navy">
                {t(section.titleKey)}
              </span>
              {isFilled && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  {t("rptRempli")}
                </span>
              )}
              <svg
                className={`h-5 w-5 text-muted transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {/* Content */}
            {isExpanded && (
              <div className="border-t border-card-border px-5 py-5 space-y-5">
                {sectionRenderers[section.num]?.()}

                {/* Expert comment */}
                <div className="border-t border-card-border/50 pt-4">
                  <label className="block text-xs font-semibold text-navy mb-1">
                    {t("rptCommentaireExpert")}
                  </label>
                  <textarea
                    value={reportComments[section.num] || ""}
                    onChange={(e) => setComment(section.num, e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder={t("rptCommentairePlaceholder")}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
