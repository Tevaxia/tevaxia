"use client";

import { useState, useMemo } from "react";
import ToggleField from "@/components/ToggleField";

interface CheckItem {
  id: string;
  categorie: string;
  label: string;
  description: string;
  obligatoire: boolean;
  reference: string;
}

const AML_CHECKLIST: CheckItem[] = [
  // Identification client
  { id: "id_1", categorie: "Identification du client", label: "Pièce d'identité vérifiée", description: "Passeport, carte d'identité ou titre de séjour en cours de validité", obligatoire: true, reference: "Art. 3-2 Loi AML" },
  { id: "id_2", categorie: "Identification du client", label: "Justificatif de domicile", description: "Facture de moins de 3 mois ou attestation de résidence", obligatoire: true, reference: "Art. 3-2 Loi AML" },
  { id: "id_3", categorie: "Identification du client", label: "Bénéficiaire effectif identifié", description: "Si personne morale : registre RBE, organigramme, statuts", obligatoire: true, reference: "Art. 3-6 Loi AML" },
  { id: "id_4", categorie: "Identification du client", label: "Source des fonds vérifiée", description: "Origine des fonds pour l'acquisition (salaire, vente, héritage, emprunt)", obligatoire: true, reference: "Art. 3-2(d) Loi AML" },
  { id: "id_5", categorie: "Identification du client", label: "Questionnaire PPE complété", description: "Vérification si le client est une Personne Politiquement Exposée ou proche d'une PPE", obligatoire: true, reference: "Art. 3-4 Loi AML" },

  // Vigilance renforcée
  { id: "vig_1", categorie: "Vigilance renforcée", label: "Screening listes de sanctions", description: "Vérification UE, ONU, OFAC, listes nationales", obligatoire: true, reference: "Art. 3-3 Loi AML" },
  { id: "vig_2", categorie: "Vigilance renforcée", label: "Pays à risque vérifié", description: "Vérifier si le client ou les fonds proviennent d'un pays à haut risque (liste GAFI)", obligatoire: true, reference: "Art. 3-3 Loi AML" },
  { id: "vig_3", categorie: "Vigilance renforcée", label: "Structure de propriété complexe analysée", description: "Si acquisition via SCI/SPV/holding : analyser la chaîne de détention", obligatoire: false, reference: "Art. 3-3(b) Loi AML" },
  { id: "vig_4", categorie: "Vigilance renforcée", label: "Transaction inhabituelle documentée", description: "Prix significativement au-dessus/en dessous du marché, paiement en espèces, urgence injustifiée", obligatoire: false, reference: "Art. 5 Loi AML" },

  // Documentation transaction
  { id: "doc_1", categorie: "Documentation transaction", label: "Compromis de vente vérifié", description: "Cohérence du prix avec le marché, conditions suspensives", obligatoire: true, reference: "Bonne pratique" },
  { id: "doc_2", categorie: "Documentation transaction", label: "Financement documenté", description: "Offre de prêt bancaire ou preuve de fonds propres", obligatoire: true, reference: "Art. 3-2(d) Loi AML" },
  { id: "doc_3", categorie: "Documentation transaction", label: "Registre des transactions tenu", description: "Conservation des documents 5 ans après la fin de la relation d'affaires", obligatoire: true, reference: "Art. 4 Loi AML" },

  // Déclaration
  { id: "decl_1", categorie: "Déclaration", label: "Évaluation du risque réalisée", description: "Profil de risque du client (faible / moyen / élevé) documenté", obligatoire: true, reference: "Art. 3-1 Loi AML" },
  { id: "decl_2", categorie: "Déclaration", label: "Formation AML à jour", description: "Personnel formé aux obligations LCB-FT (annuellement)", obligatoire: true, reference: "Art. 6 Loi AML" },
  { id: "decl_3", categorie: "Déclaration", label: "Responsable AML désigné", description: "Nom du responsable conformité AML au sein de l'organisation", obligatoire: true, reference: "Art. 4-1 Loi AML" },
];

/* IDs that trigger "Élevé" risk when checked */
const HIGH_RISK_IDS = new Set(["id_5", "vig_2", "vig_3"]); // PPE, high-risk country, complex structure

const IDENTIFICATION_IDS = AML_CHECKLIST.filter((c) => c.categorie === "Identification du client").map((c) => c.id);
const VIGILANCE_IDS = AML_CHECKLIST.filter((c) => c.categorie === "Vigilance renforcée").map((c) => c.id);

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

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  "Faible": { bg: "bg-green-100", text: "text-green-800", label: "Risque Faible" },
  "Moyen": { bg: "bg-amber-100", text: "text-amber-800", label: "Risque Moyen" },
  "Élevé": { bg: "bg-red-100", text: "text-red-800", label: "Risque Élevé" },
};

export default function AmlKyc() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [clientName, setClientName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [sanctionSearch, setSanctionSearch] = useState("");

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [...new Set(AML_CHECKLIST.map((c) => c.categorie))];
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
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">AML / KYC Immobilier</h1>
          <p className="mt-2 text-muted">
            Checklist anti-blanchiment pour les transactions immobilières au Luxembourg — Loi du 12 novembre 2004 modifiée
          </p>
        </div>

        {/* Print-only header (hidden on screen, visible when printing) */}
        <div className="hidden print:block mb-6 border-b-2 border-navy pb-4">
          <h2 className="text-lg font-bold text-navy">Rapport AML / KYC</h2>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><strong>Client :</strong> {clientName || "Non renseigné"}</p>
            <p><strong>Date :</strong> {today}</p>
            <p><strong>Adresse du bien :</strong> {propertyAddress || "Non renseignée"}</p>
            <p>
              <strong>Niveau de risque :</strong>{" "}
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${riskStyle.bg} ${riskStyle.text}`}>
                {riskStyle.label}
              </span>
            </p>
            <p><strong>Conformité :</strong> {checkedItems}/{totalItems} ({pct.toFixed(0)}%)</p>
          </div>
        </div>

        {/* Client info & actions (hidden in print — the print header above shows these values) */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm print:hidden">
          <h2 className="text-base font-semibold text-navy mb-4">Informations de la transaction</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-slate mb-1">
                Nom du client
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex : Jean Dupont"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-slate placeholder:text-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <div>
              <label htmlFor="propertyAddress" className="block text-sm font-medium text-slate mb-1">
                Adresse du bien
              </label>
              <input
                id="propertyAddress"
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="Ex : 12 rue de la Gare, L-1234 Luxembourg"
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
              Sauvegarder en PDF
            </button>
          </div>
        </div>

        {/* Sanctions list search */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm print:hidden">
          <h2 className="text-base font-semibold text-navy mb-3">Recherche sur la liste de sanctions UE</h2>
          <p className="mb-3 text-xs text-muted">
            Vérifiez si une personne ou entité figure sur la carte des sanctions de l&apos;Union européenne (sanctionsmap.eu).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={sanctionSearch}
              onChange={(e) => setSanctionSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSanctionSearch(); }}
              placeholder="Nom de la personne ou entité"
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
              Rechercher
            </button>
          </div>
        </div>

        {/* Barre de progression + Risk badge */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy">Conformité AML/KYC</span>
              <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${riskStyle.bg} ${riskStyle.text}`}>
                {riskStyle.label}
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
            <p className="mt-2 text-xs text-error">{obligatoiresManquants.length} élément(s) obligatoire(s) manquant(s)</p>
          )}
        </div>

        {/* Checklist par catégorie */}
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-4">{cat}</h2>
              <div className="space-y-4">
                {AML_CHECKLIST.filter((c) => c.categorie === cat).map((item) => (
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
                            {item.label}
                          </span>
                          {item.obligatoire && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">Obligatoire</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted">{item.description}</p>
                        <p className="mt-1 text-[10px] text-muted italic">{item.reference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-3">Références réglementaires</h2>
          <div className="space-y-2 text-sm text-muted">
            <p><strong className="text-slate">Loi du 12 novembre 2004</strong> modifiée relative à la lutte contre le blanchiment et contre le financement du terrorisme (LCB-FT).</p>
            <p><strong className="text-slate">Règlement grand-ducal du 1er février 2010</strong> précisant les obligations professionnelles.</p>
            <p><strong className="text-slate">CSSF Circulaire 20/744</strong> sur les obligations AML des professionnels du secteur financier.</p>
            <p><strong className="text-slate">CRF (Cellule de Renseignement Financier)</strong> — Déclaration de soupçon : crf@justice.etat.lu</p>
          </div>
        </div>
      </div>
    </div>
  );
}
