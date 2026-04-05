"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listerEvaluations, supprimerEvaluation, supprimerTout, listerCorbeille, restaurerEvaluation, supprimerDefinitivement, viderCorbeille, type SavedValuation, type TrashedValuation } from "@/lib/storage";
import { formatEUR } from "@/lib/calculations";

const TYPE_LABELS: Record<string, { label: string; href: string }> = {
  estimation: { label: "Estimation", href: "/estimation" },
  valorisation: { label: "Valorisation EVS", href: "/valorisation" },
  capitalisation: { label: "Capitalisation", href: "/valorisation" },
  dcf: { label: "DCF", href: "/valorisation" },
  "dcf-multi": { label: "DCF Multi-locataires", href: "/dcf-multi" },
  frais: { label: "Frais d'acquisition", href: "/frais-acquisition" },
  "plus-values": { label: "Plus-values", href: "/plus-values" },
  loyer: { label: "Capital investi / Loyer", href: "/calculateur-loyer" },
  aides: { label: "Simulateur d'aides", href: "/simulateur-aides" },
  "achat-location": { label: "Achat vs Location", href: "/achat-vs-location" },
  "bilan-promoteur": { label: "Bilan promoteur", href: "/bilan-promoteur" },
};

export default function MesEvaluations() {
  const [evaluations, setEvaluations] = useState<SavedValuation[]>([]);
  const [trash, setTrash] = useState<TrashedValuation[]>([]);
  const [showTrash, setShowTrash] = useState(false);

  useEffect(() => {
    setEvaluations(listerEvaluations());
    setTrash(listerCorbeille());
  }, []);

  const handleDelete = (id: string) => {
    supprimerEvaluation(id);
    setEvaluations(listerEvaluations());
    setTrash(listerCorbeille());
  };

  const handleDeleteAll = () => {
    supprimerTout();
    setEvaluations([]);
    setTrash(listerCorbeille());
  };

  const handleRestore = (id: string) => {
    restaurerEvaluation(id);
    setEvaluations(listerEvaluations());
    setTrash(listerCorbeille());
  };

  const handleDeletePermanent = (id: string) => {
    supprimerDefinitivement(id);
    setTrash(listerCorbeille());
  };

  const handleEmptyTrash = () => {
    viderCorbeille();
    setTrash([]);
  };

  function daysLeft(deletedAt: string): number {
    const ms = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime());
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">Mes évaluations</h1>
            <p className="mt-2 text-muted">Sauvegardées localement dans votre navigateur</p>
          </div>
          <div className="flex items-center gap-2">
            {trash.length > 0 && (
              <button
                onClick={() => setShowTrash(!showTrash)}
                className={`relative rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${showTrash ? "border-navy bg-navy/5 text-navy" : "border-card-border text-muted hover:bg-background"}`}
              >
                <svg className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Corbeille
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{trash.length}</span>
              </button>
            )}
            {evaluations.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="rounded-lg border border-error/30 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
              >
                Tout supprimer
              </button>
            )}
          </div>
        </div>

        {evaluations.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
            <p className="text-lg text-muted">Aucune évaluation sauvegardée</p>
            <p className="mt-2 text-sm text-muted">
              Utilisez le bouton "Sauvegarder" dans les calculateurs pour enregistrer vos travaux.
            </p>
            <Link href="/valorisation" className="mt-4 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors">
              Commencer une évaluation
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
                      <span>{new Date(ev.date).toLocaleDateString("fr-LU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
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
                      Ouvrir
                    </Link>
                    <button onClick={() => handleDelete(ev.id)} className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted hover:text-error hover:border-error/30 transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Corbeille ── */}
        {showTrash && trash.length > 0 && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                <span className="text-sm font-semibold text-amber-800">Corbeille ({trash.length})</span>
                <span className="text-xs text-amber-600">Suppression automatique après 7 jours</span>
              </div>
              <button onClick={handleEmptyTrash} className="text-xs text-red-600 hover:text-red-800 font-medium">
                Vider la corbeille
              </button>
            </div>
            <div className="divide-y divide-amber-100">
              {trash.map((item) => {
                const days = daysLeft(item.deletedAt);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-500 font-mono">{days}j</span>
                        <h3 className="text-sm text-slate/70 truncate">{item.nom}</h3>
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(item.date).toLocaleDateString("fr-LU", { day: "numeric", month: "short", year: "numeric" })}
                        {item.valeurPrincipale ? ` — ${formatEUR(item.valeurPrincipale)}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleRestore(item.id)} className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors">
                        Restaurer
                      </button>
                      <button onClick={() => handleDeletePermanent(item.id)} className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-muted hover:text-error hover:border-error/30 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Stockage local :</strong> Vos évaluations sont sauvegardées dans le navigateur (localStorage).
            Les éléments supprimés sont conservés dans la corbeille pendant 7 jours avant suppression définitive.
            Maximum 50 évaluations conservées.
          </p>
        </div>
      </div>
    </div>
  );
}
