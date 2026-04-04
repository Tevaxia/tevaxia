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
  // Client identification
  { id: "id_1", categorie: "Client identification", label: "Identity document verified", description: "Passport, national ID card or residence permit currently valid", obligatoire: true, reference: "Art. 3-2 AML Law" },
  { id: "id_2", categorie: "Client identification", label: "Proof of address", description: "Utility bill less than 3 months old or certificate of residence", obligatoire: true, reference: "Art. 3-2 AML Law" },
  { id: "id_3", categorie: "Client identification", label: "Beneficial owner identified", description: "If legal entity: RBE register, organisation chart, articles of association", obligatoire: true, reference: "Art. 3-6 AML Law" },
  { id: "id_4", categorie: "Client identification", label: "Source of funds verified", description: "Origin of funds for the acquisition (salary, sale, inheritance, loan)", obligatoire: true, reference: "Art. 3-2(d) AML Law" },
  { id: "id_5", categorie: "Client identification", label: "PEP questionnaire completed", description: "Check whether the client is a Politically Exposed Person or closely associated with a PEP", obligatoire: true, reference: "Art. 3-4 AML Law" },

  // Enhanced due diligence
  { id: "vig_1", categorie: "Enhanced due diligence", label: "Sanctions list screening", description: "EU, UN, OFAC, national lists verification", obligatoire: true, reference: "Art. 3-3 AML Law" },
  { id: "vig_2", categorie: "Enhanced due diligence", label: "High-risk country checked", description: "Check whether the client or funds originate from a high-risk country (FATF list)", obligatoire: true, reference: "Art. 3-3 AML Law" },
  { id: "vig_3", categorie: "Enhanced due diligence", label: "Complex ownership structure analysed", description: "If acquisition via SCI/SPV/holding: analyse the ownership chain", obligatoire: false, reference: "Art. 3-3(b) AML Law" },
  { id: "vig_4", categorie: "Enhanced due diligence", label: "Unusual transaction documented", description: "Price significantly above/below market, cash payment, unjustified urgency", obligatoire: false, reference: "Art. 5 AML Law" },

  // Transaction documentation
  { id: "doc_1", categorie: "Transaction documentation", label: "Preliminary sale agreement reviewed", description: "Price consistency with the market, conditions precedent", obligatoire: true, reference: "Best practice" },
  { id: "doc_2", categorie: "Transaction documentation", label: "Financing documented", description: "Bank loan offer or proof of own funds", obligatoire: true, reference: "Art. 3-2(d) AML Law" },
  { id: "doc_3", categorie: "Transaction documentation", label: "Transaction register maintained", description: "Document retention for 5 years after the end of the business relationship", obligatoire: true, reference: "Art. 4 AML Law" },

  // Reporting
  { id: "decl_1", categorie: "Reporting", label: "Risk assessment completed", description: "Client risk profile (low / medium / high) documented", obligatoire: true, reference: "Art. 3-1 AML Law" },
  { id: "decl_2", categorie: "Reporting", label: "AML training up to date", description: "Staff trained on AML/CTF obligations (annually)", obligatoire: true, reference: "Art. 6 AML Law" },
  { id: "decl_3", categorie: "Reporting", label: "AML officer designated", description: "Name of the AML compliance officer within the organisation", obligatoire: true, reference: "Art. 4-1 AML Law" },
];

/* IDs that trigger "High" risk when checked */
const HIGH_RISK_IDS = new Set(["id_5", "vig_2", "vig_3"]); // PEP, high-risk country, complex structure

const IDENTIFICATION_IDS = AML_CHECKLIST.filter((c) => c.categorie === "Client identification").map((c) => c.id);
const VIGILANCE_IDS = AML_CHECKLIST.filter((c) => c.categorie === "Enhanced due diligence").map((c) => c.id);

type RiskLevel = "High" | "Medium" | "Low";

function computeRiskLevel(checks: Record<string, boolean>): RiskLevel {
  // If PEP checked, high-risk country checked, or complex structure checked -> High
  for (const id of HIGH_RISK_IDS) {
    if (checks[id]) return "High";
  }

  // Count unchecked vigilance items
  const uncheckedVigilance = VIGILANCE_IDS.filter((id) => !checks[id]).length;

  // If 2+ vigilance items unchecked -> Medium
  if (uncheckedVigilance >= 2) return "Medium";

  // If all identification items checked and <2 vigilance items unchecked -> Low
  const allIdentificationChecked = IDENTIFICATION_IDS.every((id) => checks[id]);
  if (allIdentificationChecked && uncheckedVigilance < 2) return "Low";

  // Default to Medium
  return "Medium";
}

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  "Low": { bg: "bg-green-100", text: "text-green-800", label: "Low Risk" },
  "Medium": { bg: "bg-amber-100", text: "text-amber-800", label: "Medium Risk" },
  "High": { bg: "bg-red-100", text: "text-red-800", label: "High Risk" },
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

  const today = new Date().toLocaleDateString("en-LU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Real Estate AML / KYC</h1>
          <p className="mt-2 text-muted">
            Anti-money laundering checklist for real estate transactions in Luxembourg — Law of 12 November 2004, as amended
          </p>
        </div>

        {/* Print-only header (hidden on screen, visible when printing) */}
        <div className="hidden print:block mb-6 border-b-2 border-navy pb-4">
          <h2 className="text-lg font-bold text-navy">AML / KYC Report</h2>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><strong>Client:</strong> {clientName || "Not provided"}</p>
            <p><strong>Date:</strong> {today}</p>
            <p><strong>Property address:</strong> {propertyAddress || "Not provided"}</p>
            <p>
              <strong>Risk level:</strong>{" "}
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${riskStyle.bg} ${riskStyle.text}`}>
                {riskStyle.label}
              </span>
            </p>
            <p><strong>Compliance:</strong> {checkedItems}/{totalItems} ({pct.toFixed(0)}%)</p>
          </div>
        </div>

        {/* Client info & actions (hidden in print — the print header above shows these values) */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm print:hidden">
          <h2 className="text-base font-semibold text-navy mb-4">Transaction information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-slate mb-1">
                Client name
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="E.g. John Smith"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-slate placeholder:text-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <div>
              <label htmlFor="propertyAddress" className="block text-sm font-medium text-slate mb-1">
                Property address
              </label>
              <input
                id="propertyAddress"
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="E.g. 12 rue de la Gare, L-1234 Luxembourg"
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
              Save as PDF
            </button>
          </div>
        </div>

        {/* Sanctions list search */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm print:hidden">
          <h2 className="text-base font-semibold text-navy mb-3">EU sanctions list search</h2>
          <p className="mb-3 text-xs text-muted">
            Check whether a person or entity appears on the European Union sanctions map (sanctionsmap.eu).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={sanctionSearch}
              onChange={(e) => setSanctionSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSanctionSearch(); }}
              placeholder="Person or entity name"
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
              Search
            </button>
          </div>
        </div>

        {/* Progress bar + Risk badge */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy">AML/KYC Compliance</span>
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
            <p className="mt-2 text-xs text-error">{obligatoiresManquants.length} mandatory item(s) missing</p>
          )}
        </div>

        {/* Checklist by category */}
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
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">Mandatory</span>
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
          <h2 className="text-base font-semibold text-navy mb-3">Regulatory references</h2>
          <div className="space-y-2 text-sm text-muted">
            <p><strong className="text-slate">Law of 12 November 2004</strong>, as amended, on the fight against money laundering and terrorist financing (AML/CTF).</p>
            <p><strong className="text-slate">Grand-Ducal Regulation of 1 February 2010</strong> specifying professional obligations.</p>
            <p><strong className="text-slate">CSSF Circular 20/744</strong> on AML obligations of financial sector professionals.</p>
            <p><strong className="text-slate">CRF (Cellule de Renseignement Financier)</strong> — Suspicious activity report: crf@justice.etat.lu</p>
          </div>
        </div>
      </div>
    </div>
  );
}
