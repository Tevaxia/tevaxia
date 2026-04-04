"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listerEvaluations, supprimerEvaluation, supprimerTout, type SavedValuation } from "@/lib/storage";
import { formatEUR } from "@/lib/calculations";

const TYPE_LABELS: Record<string, { label: string; href: string }> = {
  estimation: { label: "Estimation", href: "/pt/estimation" },
  valorisation: { label: "EVS Valuation", href: "/pt/valorisation" },
  capitalisation: { label: "Capitalisation", href: "/pt/valorisation" },
  dcf: { label: "DCF", href: "/pt/valorisation" },
  "dcf-multi": { label: "Multi-tenant DCF", href: "/pt/dcf-multi" },
  frais: { label: "Acquisition costs", href: "/pt/frais-acquisition" },
  "plus-values": { label: "Capital gains", href: "/pt/plus-values" },
  loyer: { label: "Invested capital / Rent", href: "/pt/calculateur-loyer" },
  aides: { label: "Subsidies simulator", href: "/pt/simulateur-aides" },
  "achat-location": { label: "Buy vs Rent", href: "/pt/achat-vs-location" },
  "bilan-promoteur": { label: "Developer appraisal", href: "/pt/bilan-promoteur" },
};

export default function MesEvaluations() {
  const [evaluations, setEvaluations] = useState<SavedValuation[]>([]);

  useEffect(() => {
    setEvaluations(listerEvaluations());
  }, []);

  const handleDelete = (id: string) => {
    supprimerEvaluation(id);
    setEvaluations(listerEvaluations());
  };

  const handleDeleteAll = () => {
    supprimerTout();
    setEvaluations([]);
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">My valuations</h1>
            <p className="mt-2 text-muted">Saved locally in your browser</p>
          </div>
          {evaluations.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="rounded-lg border border-error/30 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
            >
              Delete all
            </button>
          )}
        </div>

        {evaluations.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
            <p className="text-lg text-muted">No saved valuations</p>
            <p className="mt-2 text-sm text-muted">
              Use the "Save" button in the calculators to store your work.
            </p>
            <Link href="/pt/valorisation" className="mt-4 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors">
              Start a valuation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {evaluations.map((ev) => {
              const typeInfo = TYPE_LABELS[ev.type] || { label: ev.type, href: "/" };
              return (
                <div key={ev.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[10px] font-semibold text-navy">{typeInfo.label}</span>
                      <h3 className="text-sm font-semibold text-slate truncate">{ev.nom}</h3>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                      <span>{new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      {ev.commune && <span>{ev.commune}</span>}
                      {ev.assetType && <span>{ev.assetType}</span>}
                    </div>
                  </div>
                  {ev.valeurPrincipale && ev.valeurPrincipale > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-navy">{formatEUR(ev.valeurPrincipale)}</div>
                    </div>
                  )}
                  <div className="flex gap-2 shrink-0">
                    <Link href={typeInfo.href} className="rounded-lg bg-navy/10 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/20 transition-colors">
                      Open
                    </Link>
                    <button onClick={() => handleDelete(ev.id)} className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted hover:text-error hover:border-error/30 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Local storage:</strong> Your valuations are saved in the browser (localStorage).
            They are not transmitted to our servers. If you clear your browsing data or switch
            browsers/devices, your valuations will be lost. Maximum 50 valuations stored.
          </p>
        </div>
      </div>
    </div>
  );
}
