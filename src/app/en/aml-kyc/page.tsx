"use client";

import { useState } from "react";
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

export default function AmlKyc() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [...new Set(AML_CHECKLIST.map((c) => c.categorie))];
  const totalItems = AML_CHECKLIST.length;
  const checkedItems = Object.values(checks).filter(Boolean).length;
  const obligatoiresManquants = AML_CHECKLIST.filter((c) => c.obligatoire && !checks[c.id]);
  const pct = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Real Estate AML / KYC</h1>
          <p className="mt-2 text-muted">
            Anti-money laundering checklist for real estate transactions in Luxembourg — Law of 12 November 2004, as amended
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-navy">AML/KYC Compliance</span>
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
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          checks[item.id] ? "border-success bg-success text-white" : "border-input-border hover:border-navy"
                        }`}
                      >
                        {checks[item.id] && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
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
