"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { estimer, type EstimationResult } from "@/lib/estimation";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR } from "@/lib/adjustments";
import { formatEUR } from "@/lib/calculations";
import { listerEvaluations, type SavedValuation } from "@/lib/storage";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ConfidenceGauge from "@/components/ConfidenceGauge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";

// ============================================================
// TYPE LABELS — maps SavedValuation.type to a human-readable label
// ============================================================
const TYPE_LABELS: Record<SavedValuation["type"], string> = {
  estimation: "Estimation",
  valorisation: "Valorisation",
  capitalisation: "Capitalisation",
  dcf: "DCF",
  "dcf-multi": "DCF Multi",
  frais: "Frais d'acquisition",
  "plus-values": "Plus-values",
  loyer: "Calculateur loyer",
  aides: "Aides",
  "achat-location": "Achat vs Location",
  "bilan-promoteur": "Bilan promoteur",
  "str-rentabilite": "STR — Rentabilité",
  "str-arbitrage": "STR — Arbitrage LT/CT",
};

// ============================================================
// LIVE COMPARISON — existing BienColumn component
// ============================================================

interface BienState {
  communeSearch: string;
  selectedResult: SearchResult | null;
  surface: number;
  nbChambres: number;
  etage: string;
  etat: string;
  exterieur: string;
  parking: boolean;
  classeEnergie: string;
  estNeuf: boolean;
}

const DEFAULT_BIEN: BienState = {
  communeSearch: "",
  selectedResult: null,
  surface: 80,
  nbChambres: 2,
  etage: "2ème-3ème étage (réf.)",
  etat: "Bon état (réf.)",
  exterieur: "Balcon standard (ref.)",
  parking: true,
  classeEnergie: "D",
  estNeuf: false,
};

function BienColumn({
  label,
  bien,
  setBien,
  result,
  t,
}: {
  label: string;
  bien: BienState;
  setBien: (b: BienState) => void;
  result: EstimationResult | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const tv = useTranslations("valorisation");
  const searchResults = useMemo(() => rechercherCommune(bien.communeSearch), [bien.communeSearch]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-navy">{label}</h2>

      {/* Commune search */}
      <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={bien.communeSearch}
            onChange={(e) => {
              setBien({ ...bien, communeSearch: e.target.value, selectedResult: e.target.value ? bien.selectedResult : null });
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          {bien.communeSearch.length >= 2 && searchResults.length > 0 && !bien.selectedResult && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.commune.commune + r.matchedOn}
                  onClick={() => {
                    setBien({
                      ...bien,
                      selectedResult: r,
                      communeSearch: r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune,
                    });
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors"
                >
                  {r.isLocalite ? (
                    <>
                      <span className="font-medium">{r.matchedOn}</span>
                      <span className="text-muted ml-1">-- {r.quartier ? "quartier" : "commune"} de {r.commune.commune}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{r.commune.commune}</span>
                      <span className="text-muted ml-2">({r.commune.canton})</span>
                    </>
                  )}
                  <span className="float-right font-mono text-navy">
                    {r.quartier ? formatEUR(r.quartier.prixM2) : r.commune.prixM2Existant ? formatEUR(r.commune.prixM2Existant) : "--"}/m2
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {bien.selectedResult && (
          <div className="mt-2 text-xs text-muted">
            {bien.selectedResult.quartier
              ? `${bien.selectedResult.quartier.nom} -- ${bien.selectedResult.quartier.note}`
              : `${bien.selectedResult.commune.commune} (${bien.selectedResult.commune.canton})`}
          </div>
        )}
      </div>

      {/* Characteristics */}
      <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm space-y-3">
        <InputField label={t("surface")} value={bien.surface} onChange={(v) => setBien({ ...bien, surface: Number(v) })} suffix="m2" min={10} max={500} />
        <InputField label={t("chambres")} value={bien.nbChambres} onChange={(v) => setBien({ ...bien, nbChambres: Number(v) })} min={0} max={10} />
        <InputField
          label={t("etage")}
          type="select"
          value={bien.etage}
          onChange={(v) => setBien({ ...bien, etage: v })}
          options={AJUST_ETAGE.map((a) => ({ value: a.labelKey, label: `${tv(a.labelKey)} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
        />
        <InputField
          label={t("etat")}
          type="select"
          value={bien.etat}
          onChange={(v) => setBien({ ...bien, etat: v })}
          options={AJUST_ETAT.map((a) => ({ value: a.labelKey, label: `${tv(a.labelKey)} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
        />
        <InputField
          label={t("exterieur")}
          type="select"
          value={bien.exterieur}
          onChange={(v) => setBien({ ...bien, exterieur: v })}
          options={AJUST_EXTERIEUR.map((a) => ({ value: a.labelKey, label: `${tv(a.labelKey)} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
        />
        <InputField
          label={t("classeEnergie")}
          type="select"
          value={bien.classeEnergie}
          onChange={(v) => setBien({ ...bien, classeEnergie: v })}
          options={[
            { value: "A", label: "A (+5%)" },
            { value: "B", label: "B (+3%)" },
            { value: "C", label: "C (+1%)" },
            { value: "D", label: "D (ref.)" },
            { value: "E", label: "E (-3%)" },
            { value: "F", label: "F (-6%)" },
            { value: "G", label: "G (-10%)" },
          ]}
        />
        <ToggleField label={t("parking")} checked={bien.parking} onChange={(v) => setBien({ ...bien, parking: v })} hint="+4%" />
        <ToggleField label={t("neuf")} checked={bien.estNeuf} onChange={(v) => setBien({ ...bien, estNeuf: v })} />
      </div>

      {/* Result */}
      {result ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-navy to-navy-light p-5 text-white text-center shadow-lg">
            <div className="text-xs text-white/60">{t("estimationCentrale")}</div>
            <div className="mt-1 text-3xl font-bold">{formatEUR(result.estimationCentrale)}</div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-white/70">
              <div>
                <div className="text-white/40 text-[10px]">{t("basse")}</div>
                <div className="font-semibold">{formatEUR(result.estimationBasse)}</div>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <div className="text-white/40 text-[10px]">{t("haute")}</div>
                <div className="font-semibold">{formatEUR(result.estimationHaute)}</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-white/50">
              {result.prixM2Ajuste} EUR/m2 x {bien.surface} m2
            </div>
          </div>

          {/* Adjustments */}
          {result.ajustements.length > 0 && (
            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-navy mb-2">{t("ajustements")}</h3>
              <div className="space-y-1">
                {result.ajustements.map((a, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted">{a.labelParams ? tv(a.labelKey, a.labelParams) : tv(a.labelKey)}</span>
                    <span className={`font-mono ${a.pct > 0 ? "text-success" : a.pct < 0 ? "text-error" : "text-muted"}`}>
                      {a.pct > 0 ? "+" : ""}{a.pct}%
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-semibold border-t border-card-border pt-1">
                  <span>Total</span>
                  <span className={result.totalAjustements > 0 ? "text-success" : result.totalAjustements < 0 ? "text-error" : ""}>
                    {result.totalAjustements > 0 ? "+" : ""}{result.totalAjustements}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <ConfidenceGauge level={result.confiance} note={result.confianceNote} />
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center">
          <p className="text-sm text-muted">{t("selectCommune")}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SAVED EVALUATIONS COMPARATOR
// ============================================================

function SavedComparator({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [evaluations, setEvaluations] = useState<SavedValuation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvaluations(listerEvaluations());
  }, []);

  const selected = useMemo(
    () => selectedIds.map((id) => evaluations.find((e) => e.id === id)).filter(Boolean) as SavedValuation[],
    [selectedIds, evaluations],
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  // Detect if all selected evaluations share the same type
  const sharedType = useMemo(() => {
    if (selected.length < 2) return null;
    const first = selected[0].type;
    return selected.every((e) => e.type === first) ? first : null;
  }, [selected]);

  // Format date nicely
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fr-LU", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };

  if (evaluations.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-card-border p-12 text-center">
        <p className="text-sm text-muted">{t("noSaved")}</p>
        <p className="mt-1 text-xs text-muted">{t("noSavedHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection list */}
      <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-navy mb-3">{t("selectEvaluations")}</h2>
        <p className="text-xs text-muted mb-3">{t("selectHint")}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {evaluations.map((ev) => {
            const isSelected = selectedIds.includes(ev.id);
            const isDisabled = !isSelected && selectedIds.length >= 3;
            return (
              <button
                key={ev.id}
                onClick={() => !isDisabled && toggleSelection(ev.id)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? "border-navy ring-2 ring-navy/20 bg-navy/5"
                    : isDisabled
                      ? "border-card-border bg-card opacity-40 cursor-not-allowed"
                      : "border-card-border bg-card hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate truncate">{ev.nom}</div>
                    <div className="text-xs text-muted mt-0.5">{TYPE_LABELS[ev.type] || ev.type}</div>
                    {ev.commune && <div className="text-xs text-muted">{ev.commune}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    {ev.valeurPrincipale != null && (
                      <div className="text-sm font-bold text-navy font-mono">{formatEUR(ev.valeurPrincipale)}</div>
                    )}
                    <div className="text-[10px] text-muted">{fmtDate(ev.date)}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-navy">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {t("selected")}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison table/cards */}
      {selected.length >= 2 && (
        <div className="rounded-xl border border-card-border bg-card p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-4 text-center">{t("comparisonTitle")}</h2>

          {/* Mobile: cards */}
          <div className="sm:hidden space-y-4">
            {selected.map((ev, i) => (
              <div key={ev.id} className="rounded-lg border border-card-border bg-background p-4">
                <div className="text-xs text-muted mb-1">{t("evaluationLabel", { n: i + 1 })}</div>
                <div className="text-sm font-semibold text-navy truncate">{ev.nom}</div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">{t("colType")}</span>
                    <span className="font-medium">{TYPE_LABELS[ev.type] || ev.type}</span>
                  </div>
                  {ev.commune && (
                    <div className="flex justify-between">
                      <span className="text-muted">{t("colCommune")}</span>
                      <span className="font-medium">{ev.commune}</span>
                    </div>
                  )}
                  {ev.valeurPrincipale != null && (
                    <div className="flex justify-between">
                      <span className="text-muted">{t("colValeur")}</span>
                      <span className="font-bold font-mono text-navy">{formatEUR(ev.valeurPrincipale)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted">{t("colDate")}</span>
                    <span className="font-medium">{fmtDate(ev.date)}</span>
                  </div>
                  {/* Type-specific metrics */}
                  {sharedType === "estimation" && ev.data.surface != null && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted">{t("colSurface")}</span>
                        <span className="font-mono">{String(ev.data.surface)} m2</span>
                      </div>
                      {ev.valeurPrincipale != null && (
                        <div className="flex justify-between">
                          <span className="text-muted">{t("colPrixM2")}</span>
                          <span className="font-mono">{formatEUR(Math.round(ev.valeurPrincipale / Number(ev.data.surface)))}/m2</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted"></th>
                  {selected.map((ev, i) => (
                    <th key={ev.id} className="px-3 py-2 text-right text-xs font-semibold text-navy">
                      {t("evaluationLabel", { n: i + 1 })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Nom */}
                <tr className="border-b border-card-border/50">
                  <td className="px-3 py-1.5 text-muted">{t("colNom")}</td>
                  {selected.map((ev) => (
                    <td key={ev.id} className="px-3 py-1.5 text-right font-medium text-sm max-w-[200px] truncate">{ev.nom}</td>
                  ))}
                </tr>

                {/* Type */}
                <tr className="border-b border-card-border/50">
                  <td className="px-3 py-1.5 text-muted">{t("colType")}</td>
                  {selected.map((ev) => (
                    <td key={ev.id} className="px-3 py-1.5 text-right">
                      <span className="inline-block rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
                        {TYPE_LABELS[ev.type] || ev.type}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Commune */}
                <tr className="border-b border-card-border/50">
                  <td className="px-3 py-1.5 text-muted">{t("colCommune")}</td>
                  {selected.map((ev) => (
                    <td key={ev.id} className="px-3 py-1.5 text-right">{ev.commune || "--"}</td>
                  ))}
                </tr>

                {/* Valeur principale */}
                <tr className="border-b border-card-border/50 bg-navy/5">
                  <td className="px-3 py-2 font-semibold text-navy">{t("colValeur")}</td>
                  {selected.map((ev) => (
                    <td key={ev.id} className="px-3 py-2 text-right font-mono font-bold text-navy">
                      {ev.valeurPrincipale != null ? formatEUR(ev.valeurPrincipale) : "--"}
                    </td>
                  ))}
                </tr>

                {/* Date */}
                <tr className="border-b border-card-border/50">
                  <td className="px-3 py-1.5 text-muted">{t("colDate")}</td>
                  {selected.map((ev) => (
                    <td key={ev.id} className="px-3 py-1.5 text-right text-xs">{fmtDate(ev.date)}</td>
                  ))}
                </tr>

                {/* Type-specific metrics for estimation */}
                {sharedType === "estimation" && (
                  <>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colSurface")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                          {ev.data.surface != null ? `${ev.data.surface} m2` : "--"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colPrixM2")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                          {ev.valeurPrincipale != null && ev.data.surface
                            ? `${formatEUR(Math.round(ev.valeurPrincipale / Number(ev.data.surface)))}/m2`
                            : "--"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colClasseEnergie")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-medium">
                          {(ev.data.classeEnergie as string) || "--"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colChambres")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                          {ev.data.nbChambres != null ? String(ev.data.nbChambres) : "--"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Type-specific metrics for frais */}
                {sharedType === "frais" && (
                  <tr className="border-b border-card-border/50">
                    <td className="px-3 py-1.5 text-muted">{t("colPrixBien")}</td>
                    {selected.map((ev) => (
                      <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                        {ev.data.prixBien != null ? formatEUR(Number(ev.data.prixBien)) : "--"}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Type-specific metrics for loyer */}
                {sharedType === "loyer" && (
                  <>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colSurface")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                          {ev.data.surfaceHabitable != null ? `${ev.data.surfaceHabitable} m2` : "--"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colPrixBien")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                          {ev.data.prixAcquisition != null ? formatEUR(Number(ev.data.prixAcquisition)) : "--"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Type-specific metrics for plus-values */}
                {sharedType === "plus-values" && (
                  <>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colPrixAcquisition")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                          {ev.data.prixAcquisition != null ? formatEUR(Number(ev.data.prixAcquisition)) : "--"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 text-muted">{t("colPrixCession")}</td>
                      {selected.map((ev) => (
                        <td key={ev.id} className="px-3 py-1.5 text-right font-mono">
                          {ev.data.prixCession != null ? formatEUR(Number(ev.data.prixCession)) : "--"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Value difference summary when exactly 2 selected */}
          {selected.length === 2 && selected[0].valeurPrincipale != null && selected[1].valeurPrincipale != null && (
            <div className="mt-4 rounded-lg bg-background p-4 text-center">
              <div className="text-xs text-muted mb-1">{t("ecart")}</div>
              <div className={`text-xl font-bold font-mono ${
                selected[0].valeurPrincipale > selected[1].valeurPrincipale ? "text-error" :
                selected[0].valeurPrincipale < selected[1].valeurPrincipale ? "text-success" : "text-muted"
              }`}>
                {selected[0].valeurPrincipale - selected[1].valeurPrincipale > 0 ? "+" : ""}
                {formatEUR(selected[0].valeurPrincipale - selected[1].valeurPrincipale)}
              </div>
              {selected[1].valeurPrincipale > 0 && (
                <div className="text-xs text-muted mt-1">
                  {((selected[0].valeurPrincipale - selected[1].valeurPrincipale) / selected[1].valeurPrincipale * 100) > 0 ? "+" : ""}
                  {((selected[0].valeurPrincipale - selected[1].valeurPrincipale) / selected[1].valeurPrincipale * 100).toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selected.length < 2 && (
        <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center">
          <p className="text-sm text-muted">{t("selectAtLeast2")}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE — tabs between live comparison and saved evaluations
// ============================================================

export default function Comparer() {
  const t = useTranslations("comparer");
  const [tab, setTab] = useState<"live" | "saved">("live");

  const [bienA, setBienA] = useState<BienState>({ ...DEFAULT_BIEN });
  const [bienB, setBienB] = useState<BienState>({ ...DEFAULT_BIEN });

  const resultA = useMemo(() => {
    if (!bienA.selectedResult) return null;
    return estimer({
      commune: bienA.selectedResult.commune.commune,
      quartier: bienA.selectedResult.quartier?.nom,
      surface: bienA.surface,
      nbChambres: bienA.nbChambres,
      etage: bienA.etage,
      etat: bienA.etat,
      exterieur: bienA.exterieur,
      parking: bienA.parking,
      classeEnergie: bienA.classeEnergie,
      typeBien: "appartement",
      estNeuf: bienA.estNeuf,
    });
  }, [bienA]);

  const resultB = useMemo(() => {
    if (!bienB.selectedResult) return null;
    return estimer({
      commune: bienB.selectedResult.commune.commune,
      quartier: bienB.selectedResult.quartier?.nom,
      surface: bienB.surface,
      nbChambres: bienB.nbChambres,
      etage: bienB.etage,
      etat: bienB.etat,
      exterieur: bienB.exterieur,
      parking: bienB.parking,
      classeEnergie: bienB.classeEnergie,
      typeBien: "appartement",
      estNeuf: bienB.estNeuf,
    });
  }, [bienB]);

  // Comparison metrics
  const comparison = useMemo(() => {
    if (!resultA || !resultB) return null;
    const diffPrix = resultA.estimationCentrale - resultB.estimationCentrale;
    const diffPrixPct = resultB.estimationCentrale > 0
      ? ((resultA.estimationCentrale - resultB.estimationCentrale) / resultB.estimationCentrale) * 100
      : 0;
    const diffPrixM2 = resultA.prixM2Ajuste - resultB.prixM2Ajuste;
    const diffPrixM2Pct = resultB.prixM2Ajuste > 0
      ? ((resultA.prixM2Ajuste - resultB.prixM2Ajuste) / resultB.prixM2Ajuste) * 100
      : 0;
    const moreExpensive = diffPrix > 0 ? "A" : diffPrix < 0 ? "B" : "equal";
    return { diffPrix, diffPrixPct, diffPrixM2, diffPrixM2Pct, moreExpensive };
  }, [resultA, resultB]);

  return (
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 flex justify-center gap-2">
          <button
            onClick={() => setTab("live")}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === "live"
                ? "bg-navy text-white"
                : "bg-background text-muted border border-card-border hover:bg-navy/5"
            }`}
          >
            {t("tabLive")}
          </button>
          <button
            onClick={() => setTab("saved")}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === "saved"
                ? "bg-navy text-white"
                : "bg-background text-muted border border-card-border hover:bg-navy/5"
            }`}
          >
            {t("tabSaved")}
          </button>
        </div>

        {tab === "live" && (
          <>
            {/* Side by side columns */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BienColumn label={t("bienA")} bien={bienA} setBien={setBienA} result={resultA} t={t} />
              <BienColumn label={t("bienB")} bien={bienB} setBien={setBienB} result={resultB} t={t} />
            </div>

            {/* Comparison summary */}
            {comparison && resultA && resultB && (
              <div className="mt-8 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-semibold text-navy mb-4 text-center">{t("comparisonTitle")}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Price comparison */}
                  <div className="rounded-lg bg-background p-4 text-center">
                    <div className="text-xs text-muted mb-1">{t("ecartPrix")}</div>
                    <div className={`text-xl font-bold ${comparison.diffPrix > 0 ? "text-error" : comparison.diffPrix < 0 ? "text-success" : "text-muted"}`}>
                      {comparison.diffPrix > 0 ? "+" : ""}{formatEUR(comparison.diffPrix)}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {comparison.diffPrixPct > 0 ? "+" : ""}{comparison.diffPrixPct.toFixed(1)}%
                    </div>
                  </div>

                  {/* Price per m2 comparison */}
                  <div className="rounded-lg bg-background p-4 text-center">
                    <div className="text-xs text-muted mb-1">{t("ecartPrixM2")}</div>
                    <div className={`text-xl font-bold ${comparison.diffPrixM2 > 0 ? "text-error" : comparison.diffPrixM2 < 0 ? "text-success" : "text-muted"}`}>
                      {comparison.diffPrixM2 > 0 ? "+" : ""}{formatEUR(comparison.diffPrixM2)}/m2
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {comparison.diffPrixM2Pct > 0 ? "+" : ""}{comparison.diffPrixM2Pct.toFixed(1)}%
                    </div>
                  </div>

                  {/* Which is more expensive */}
                  <div className="rounded-lg bg-background p-4 text-center">
                    <div className="text-xs text-muted mb-1">{t("plusCher")}</div>
                    <div className="text-xl font-bold text-navy">
                      {comparison.moreExpensive === "A"
                        ? t("bienA")
                        : comparison.moreExpensive === "B"
                          ? t("bienB")
                          : t("egal")}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {comparison.moreExpensive !== "equal" && (
                        <>{t("dePlus", { montant: formatEUR(Math.abs(comparison.diffPrix)) })}</>
                      )}
                    </div>
                  </div>

                  {/* Confidence comparison */}
                  <div className="rounded-lg bg-background p-4 text-center">
                    <div className="text-xs text-muted mb-1">{t("confiance")}</div>
                    <div className="flex justify-center gap-3">
                      <div>
                        <div className="text-[10px] text-muted">{t("bienA")}</div>
                        <span className={`text-sm font-semibold ${
                          resultA.confiance === "forte" ? "text-success" : resultA.confiance === "moyenne" ? "text-warning" : "text-error"
                        }`}>
                          {resultA.confiance}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-card-border" />
                      <div>
                        <div className="text-[10px] text-muted">{t("bienB")}</div>
                        <span className={`text-sm font-semibold ${
                          resultB.confiance === "forte" ? "text-success" : resultB.confiance === "moyenne" ? "text-warning" : "text-error"
                        }`}>
                          {resultB.confiance}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed side-by-side table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted"></th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-navy">{t("bienA")}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-navy">{t("bienB")}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted">{t("ecart")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-card-border/50">
                        <td className="px-3 py-1.5 text-muted">{t("prixBaseM2")}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(resultA.prixM2Base)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(resultB.prixM2Base)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted">{formatEUR(resultA.prixM2Base - resultB.prixM2Base)}</td>
                      </tr>
                      <tr className="border-b border-card-border/50">
                        <td className="px-3 py-1.5 text-muted">{t("ajustements")}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{resultA.totalAjustements > 0 ? "+" : ""}{resultA.totalAjustements}%</td>
                        <td className="px-3 py-1.5 text-right font-mono">{resultB.totalAjustements > 0 ? "+" : ""}{resultB.totalAjustements}%</td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted">{resultA.totalAjustements - resultB.totalAjustements} pts</td>
                      </tr>
                      <tr className="border-b border-card-border/50">
                        <td className="px-3 py-1.5 text-muted">{t("prixAjusteM2")}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(resultA.prixM2Ajuste)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(resultB.prixM2Ajuste)}</td>
                        <td className={`px-3 py-1.5 text-right font-mono font-semibold ${comparison.diffPrixM2 > 0 ? "text-error" : comparison.diffPrixM2 < 0 ? "text-success" : ""}`}>
                          {comparison.diffPrixM2 > 0 ? "+" : ""}{formatEUR(comparison.diffPrixM2)}
                        </td>
                      </tr>
                      <tr className="border-b border-card-border/50">
                        <td className="px-3 py-1.5 text-muted">{t("basse")}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(resultA.estimationBasse)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(resultB.estimationBasse)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted">{formatEUR(resultA.estimationBasse - resultB.estimationBasse)}</td>
                      </tr>
                      <tr className="border-b border-card-border/50 bg-navy/5">
                        <td className="px-3 py-2 font-semibold text-navy">{t("estimationCentrale")}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-navy">{formatEUR(resultA.estimationCentrale)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-navy">{formatEUR(resultB.estimationCentrale)}</td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${comparison.diffPrix > 0 ? "text-error" : comparison.diffPrix < 0 ? "text-success" : ""}`}>
                          {comparison.diffPrix > 0 ? "+" : ""}{formatEUR(comparison.diffPrix)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 text-muted">{t("haute")}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(resultA.estimationHaute)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatEUR(resultB.estimationHaute)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted">{formatEUR(resultA.estimationHaute - resultB.estimationHaute)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "saved" && <SavedComparator t={t} />}

        {resultA && resultB && comparison && (
          <div className="mt-6">
            <AiAnalysisCard
              context={[
                `— Bien A —`,
                `Commune: ${bienA.selectedResult?.commune.commune ?? "—"}${bienA.selectedResult?.quartier ? ` (${bienA.selectedResult.quartier.nom})` : ""}`,
                `${bienA.surface} m², ${bienA.nbChambres} ch., étage ${bienA.etage}, état ${bienA.etat}, énergie ${bienA.classeEnergie}${bienA.estNeuf ? ", neuf" : ""}${bienA.parking ? ", parking" : ""}`,
                `Estimation centrale: ${formatEUR(resultA.estimationCentrale)} (${formatEUR(resultA.prixM2Ajuste)}/m²)`,
                `Confiance: ${resultA.confiance}`,
                "",
                `— Bien B —`,
                `Commune: ${bienB.selectedResult?.commune.commune ?? "—"}${bienB.selectedResult?.quartier ? ` (${bienB.selectedResult.quartier.nom})` : ""}`,
                `${bienB.surface} m², ${bienB.nbChambres} ch., étage ${bienB.etage}, état ${bienB.etat}, énergie ${bienB.classeEnergie}${bienB.estNeuf ? ", neuf" : ""}${bienB.parking ? ", parking" : ""}`,
                `Estimation centrale: ${formatEUR(resultB.estimationCentrale)} (${formatEUR(resultB.prixM2Ajuste)}/m²)`,
                `Confiance: ${resultB.confiance}`,
                "",
                `— Comparaison —`,
                `Écart prix total: ${comparison.diffPrix > 0 ? "+" : ""}${formatEUR(comparison.diffPrix)} (${comparison.diffPrixPct > 0 ? "+" : ""}${comparison.diffPrixPct.toFixed(1)}%)`,
                `Écart prix/m²: ${comparison.diffPrixM2 > 0 ? "+" : ""}${formatEUR(comparison.diffPrixM2)}`,
              ].join("\n")}
              prompt="Arbitre entre ces deux biens immobiliers luxembourgeois. Livre : (1) quel bien offre le meilleur rapport qualité/prix objectivement, (2) critères qualitatifs clés à pondérer (localisation, état, énergie, potentiel), (3) marge de négociation réaliste sur chacun vs prix de marché commune, (4) recommandation finale selon le profil (résidence principale vs investissement locatif vs revente court terme). Sois direct et argumenté."
            />
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-8 text-xs text-muted text-center leading-relaxed max-w-2xl mx-auto">
          {t("disclaimer")}
        </p>
      </div>
    </div>

    <SEOContent
      ns="comparer"
      sections={[
        { titleKey: "methodeTitle", contentKey: "methodeContent" },
        { titleKey: "criteresTitle", contentKey: "criteresContent" },
        { titleKey: "ajustementsTitle", contentKey: "ajustementsContent" },
        { titleKey: "decisionTitle", contentKey: "decisionContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
      ]}
      relatedLinks={[
        { href: "/estimation", labelKey: "estimation" },
        { href: "/hedonique", labelKey: "hedonique" },
        { href: "/carte", labelKey: "carte" },
      ]}
    />
    </>
  );
}
