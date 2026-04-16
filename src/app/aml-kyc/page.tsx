"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";

interface CheckItem {
  id: string;
  categorieKey: string;
  labelKey: string;
  descriptionKey: string;
  obligatoire: boolean;
  reference: string;
}

const AML_CHECKLIST: CheckItem[] = [
  // Identification client
  { id: "id_1", categorieKey: "catIdentification", labelKey: "id1Label", descriptionKey: "id1Desc", obligatoire: true, reference: "Art. 3-2 Loi AML" },
  { id: "id_2", categorieKey: "catIdentification", labelKey: "id2Label", descriptionKey: "id2Desc", obligatoire: true, reference: "Art. 3-2 Loi AML" },
  { id: "id_3", categorieKey: "catIdentification", labelKey: "id3Label", descriptionKey: "id3Desc", obligatoire: true, reference: "Art. 3-6 Loi AML" },
  { id: "id_4", categorieKey: "catIdentification", labelKey: "id4Label", descriptionKey: "id4Desc", obligatoire: true, reference: "Art. 3-2(d) Loi AML" },
  { id: "id_5", categorieKey: "catIdentification", labelKey: "id5Label", descriptionKey: "id5Desc", obligatoire: true, reference: "Art. 3-4 Loi AML" },
  { id: "id_5b", categorieKey: "catIdentification", labelKey: "id5bLabel", descriptionKey: "id5bDesc", obligatoire: false, reference: "Art. 3-4 Loi AML" },

  // Vigilance renforcée
  { id: "vig_1", categorieKey: "catVigilance", labelKey: "vig1Label", descriptionKey: "vig1Desc", obligatoire: true, reference: "Art. 3-3 Loi AML" },
  { id: "vig_2", categorieKey: "catVigilance", labelKey: "vig2Label", descriptionKey: "vig2Desc", obligatoire: true, reference: "Art. 3-3 Loi AML" },
  { id: "vig_3", categorieKey: "catVigilance", labelKey: "vig3Label", descriptionKey: "vig3Desc", obligatoire: false, reference: "Art. 3-3(b) Loi AML" },
  { id: "vig_4", categorieKey: "catVigilance", labelKey: "vig4Label", descriptionKey: "vig4Desc", obligatoire: false, reference: "Art. 5 Loi AML" },

  // Documentation transaction
  { id: "doc_1", categorieKey: "catDocumentation", labelKey: "doc1Label", descriptionKey: "doc1Desc", obligatoire: true, reference: "Bonne pratique" },
  { id: "doc_2", categorieKey: "catDocumentation", labelKey: "doc2Label", descriptionKey: "doc2Desc", obligatoire: true, reference: "Art. 3-2(d) Loi AML" },
  { id: "doc_3", categorieKey: "catDocumentation", labelKey: "doc3Label", descriptionKey: "doc3Desc", obligatoire: true, reference: "Art. 4 Loi AML" },

  // Déclaration
  { id: "decl_1", categorieKey: "catDeclaration", labelKey: "decl1Label", descriptionKey: "decl1Desc", obligatoire: true, reference: "Art. 3-1 Loi AML" },
  { id: "decl_2", categorieKey: "catDeclaration", labelKey: "decl2Label", descriptionKey: "decl2Desc", obligatoire: true, reference: "Art. 6 Loi AML" },
  { id: "decl_3", categorieKey: "catDeclaration", labelKey: "decl3Label", descriptionKey: "decl3Desc", obligatoire: true, reference: "Art. 4-1 Loi AML" },
];

/* IDs that trigger "Élevé" risk when checked */
const HIGH_RISK_IDS = new Set(["id_5b", "vig_2", "vig_3"]); // Client IS PPE, high-risk country, complex structure

const IDENTIFICATION_IDS = AML_CHECKLIST.filter((c) => c.categorieKey === "catIdentification").map((c) => c.id);
const VIGILANCE_IDS = AML_CHECKLIST.filter((c) => c.categorieKey === "catVigilance").map((c) => c.id);

type RiskLevel = "Élevé" | "Moyen" | "Faible";

function computeRiskLevel(checks: Record<string, boolean>): RiskLevel {
  // If PPE checked, high-risk country checked, or complex structure checked -> Élevé
  for (const id of HIGH_RISK_IDS) {
    if (checks[id]) return "Élevé";
  }

  // Count unchecked vigilance items
  const uncheckedVigilance = VIGILANCE_IDS.filter((id) => !checks[id]).length;

  // If 2+ vigilance items unchecked -> Moyen
  if (uncheckedVigilance >= 2) return "Moyen";

  // If all identification items checked and <2 vigilance items unchecked -> Faible
  const allIdentificationChecked = IDENTIFICATION_IDS.every((id) => checks[id]);
  if (allIdentificationChecked && uncheckedVigilance < 2) return "Faible";

  // Default to Moyen
  return "Moyen";
}

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; labelKey: string }> = {
  "Faible": { bg: "bg-green-100", text: "text-green-800", labelKey: "riskLow" },
  "Moyen": { bg: "bg-amber-100", text: "text-amber-800", labelKey: "riskMedium" },
  "Élevé": { bg: "bg-red-100", text: "text-red-800", labelKey: "riskHigh" },
};

export default function AmlKyc() {
  const t = useTranslations("amlKyc");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [clientName, setClientName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [sanctionSearch, setSanctionSearch] = useState("");

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [...new Set(AML_CHECKLIST.map((c) => c.categorieKey))];
  const totalItems = AML_CHECKLIST.length;
  const checkedItems = Object.values(checks).filter(Boolean).length;
  const obligatoiresManquants = AML_CHECKLIST.filter((c) => c.obligatoire && !checks[c.id]);
  const pct = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const riskLevel = useMemo(() => computeRiskLevel(checks), [checks]);
  const riskStyle = RISK_STYLES[riskLevel];

  const handleSanctionSearch = () => {
    const trimmed = sanctionSearch.trim();
    if (!trimmed) return;
    window.open(
      `https://www.sanctionsmap.eu/#/main?search=${encodeURIComponent(trimmed)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString("fr-LU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Print-only header (hidden on screen, visible when printing) */}
        <div className="hidden print:block mb-6 border-b-2 border-navy pb-4">
          <h2 className="text-lg font-bold text-navy">{t("reportTitle")}</h2>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><strong>{t("printClient")}</strong> {clientName || t("notProvided")}</p>
            <p><strong>{t("printDate")}</strong> {today}</p>
            <p><strong>{t("printAddress")}</strong> {propertyAddress || t("notProvidedF")}</p>
            <p>
              <strong>{t("printRiskLevel")}</strong>{" "}
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${riskStyle.bg} ${riskStyle.text}`}>
                {t(riskStyle.labelKey)}
              </span>
            </p>
            <p><strong>{t("printConformity")}</strong> {checkedItems}/{totalItems} ({pct.toFixed(0)}%)</p>
          </div>
        </div>

        {/* Client info & actions (hidden in print — the print header above shows these values) */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm print:hidden">
          <h2 className="text-base font-semibold text-navy mb-4">{t("transactionInfo")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-slate mb-1">
                {t("clientName")}
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={t("clientNamePlaceholder")}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-slate placeholder:text-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <div>
              <label htmlFor="propertyAddress" className="block text-sm font-medium text-slate mb-1">
                {t("propertyAddress")}
              </label>
              <input
                id="propertyAddress"
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder={t("propertyAddressPlaceholder")}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-slate placeholder:text-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-light"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034l-.001.003" />
              </svg>
              {t("savePdf")}
            </button>
          </div>
        </div>

        {/* Sanctions list search */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm print:hidden">
          <h2 className="text-base font-semibold text-navy mb-3">{t("sanctionSearchTitle")}</h2>
          <p className="mb-3 text-xs text-muted">
            {t("sanctionSearchDesc")}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={sanctionSearch}
              onChange={(e) => setSanctionSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSanctionSearch(); }}
              placeholder={t("sanctionSearchPlaceholder")}
              className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-slate placeholder:text-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
            <button
              onClick={handleSanctionSearch}
              disabled={!sanctionSearch.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              {t("search")}
            </button>
          </div>
        </div>

        {/* Barre de progression + Risk badge */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy">{t("conformity")}</span>
              <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${riskStyle.bg} ${riskStyle.text}`}>
                {t(riskStyle.labelKey)}
              </span>
            </div>
            <span className={`text-sm font-bold ${pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-error"}`}>
              {checkedItems}/{totalItems} ({pct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-100">
            <div
              className={`h-3 rounded-full transition-all ${pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-error"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {obligatoiresManquants.length > 0 && (
            <p className="mt-2 text-xs text-error">{t("missingMandatory", { count: obligatoiresManquants.length })}</p>
          )}
        </div>

        {/* Checklist par catégorie */}
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-4">{t(cat)}</h2>
              <div className="space-y-4">
                {AML_CHECKLIST.filter((c) => c.categorieKey === cat).map((item) => (
                  <div key={item.id} className={`rounded-lg border p-4 transition-colors ${checks[item.id] ? "border-success/30 bg-green-50/50" : "border-card-border"}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors print:hidden ${
                          checks[item.id] ? "border-success bg-success text-white" : "border-input-border hover:border-navy"
                        }`}
                      >
                        {checks[item.id] && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      {/* Print-only status marker */}
                      <span className="hidden print:inline-block mt-0.5 shrink-0 text-sm font-bold">
                        {checks[item.id] ? "[OK]" : "[  ]"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${checks[item.id] ? "text-success line-through" : "text-slate"}`}>
                            {t(item.labelKey)}
                          </span>
                          {item.obligatoire && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">{t("mandatory")}</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted">{t(item.descriptionKey)}</p>
                        <p className="mt-1 text-[10px] text-muted italic">{item.reference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <AiAnalysisCard
            context={[
              `Dossier KYC — Luxembourg`,
              `Client: ${clientName || "non renseigné"}`,
              `Bien: ${propertyAddress || "non renseigné"}`,
              `Score conformité: ${checkedItems}/${totalItems} (${pct.toFixed(0)}%)`,
              `Niveau de risque calculé: ${riskLevel}`,
              `Items obligatoires manquants: ${obligatoiresManquants.length}`,
              obligatoiresManquants.length > 0
                ? `Détail manques: ${obligatoiresManquants.map((c) => t(c.labelKey)).join(" / ")}`
                : "Tous items obligatoires cochés",
              "",
              `Flags à risque cochés:`,
              `  - PPE (politiquement exposé): ${checks["id_5b"] ? "OUI" : "non"}`,
              `  - Pays à haut risque: ${checks["vig_2"] ? "OUI" : "non"}`,
              `  - Structure juridique complexe: ${checks["vig_3"] ? "OUI" : "non"}`,
            ].join("\n")}
            prompt="Analyse ce dossier KYC/AML dans le contexte luxembourgeois (loi modifiée du 12 novembre 2004 + règlement CSSF 12-02). Livre : (1) synthèse du niveau de risque avec justification, (2) red flags prioritaires à investiguer, (3) mesures de vigilance renforcée à mettre en œuvre si risque Moyen/Élevé (origine des fonds, bénéficiaire effectif, contrôles supplémentaires), (4) documents complémentaires à demander au client, (5) recommandation sur l'opportunité de déclaration CRF (Cellule de Renseignement Financier) si signaux ambigus. Référence légale précise."
          />
        </div>

        <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-3">{t("regulatoryReferences")}</h2>
          <div className="space-y-2 text-sm text-muted">
            <p><strong className="text-slate">{t("ref1Title")}</strong> {t("ref1Desc")}</p>
            <p><strong className="text-slate">{t("ref2Title")}</strong> {t("ref2Desc")}</p>
            <p><strong className="text-slate">{t("ref3Title")}</strong> {t("ref3Desc")}</p>
            <p><strong className="text-slate">{t("ref4Title")}</strong> {t("ref4Desc")}</p>
          </div>
        </div>
      </div>

      <SEOContent
        ns="amlKyc"
        sections={[
          { titleKey: "obligationsTitle", contentKey: "obligationsContent" },
          { titleKey: "loi2004Title", contentKey: "loi2004Content" },
          { titleKey: "identificationTitle", contentKey: "identificationContent" },
          { titleKey: "declarationTitle", contentKey: "declarationContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/valorisation", labelKey: "valorisation" },
        ]}
      />
    </div>
  );
}
