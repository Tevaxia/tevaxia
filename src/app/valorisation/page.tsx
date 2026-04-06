"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2, formatPct } from "@/lib/calculations";
import {
  calculerComparaison,
  calculerCapitalisation,
  calculerDCF,
  calculerMLV,
  calculerResiduelleEnergetique,
  calculerTermeReversion,
  reconcilier,
  type Comparable,
} from "@/lib/valuation";
import { evaluerESG } from "@/lib/esg";
import {
  rechercherCommune,
  suggestComparables,
  DATA_SOURCES,
  type MarketDataCommune,
  type SearchResult,
} from "@/lib/market-data";
import {
  ASSET_TYPES,
  EVS_VALUE_TYPES,
  getAssetTypeConfig,
  type AssetType,
  type EVSValueType,
} from "@/lib/asset-types";
import AdjustmentGuidePanel from "@/components/AdjustmentGuide";
import MarketDataPanel from "@/components/MarketDataPanel";
import { calculerAjustDate } from "@/lib/adjustments";
import { generateReportBlob } from "@/components/ValuationReport";
import { PdfButton } from "@/components/energy/EnergyPdf";
import { downloadDocxReport } from "@/components/ValuationDocx";
import { getDemographics } from "@/lib/demographics";
import { getLatestValue, TAUX_HYPOTHECAIRE, OAT_10Y, INDICE_CONSTRUCTION } from "@/lib/macro-data";
import { getProfile } from "@/lib/profile";
import { genererNarrative } from "@/lib/narrative";
import { estimerCoutsRenovation } from "@/lib/renovation-costs";
import { evaluerChecklist, scoreChecklist } from "@/lib/evs-checklist";
import Breadcrumbs from "@/components/Breadcrumbs";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import ReportModeEVS from "@/components/ReportModeEVS";

type ActiveTab = "comparaison" | "capitalisation" | "terme_reversion" | "dcf" | "esg" | "energie" | "mlv" | "reconciliation";

// ============================================================
// TAB 1 — COMPARAISON
// ============================================================

function TabComparaison({
  surfaceBien,
  onValeur,
  assetType,
  communeSearch,
  setCommuneSearch,
  selectedResult,
  setSelectedResult,
  searchResults,
  selectedCommune,
  comparables,
  setComparables,
}: {
  surfaceBien: number;
  onValeur: (v: number) => void;
  assetType: AssetType;
  communeSearch: string;
  setCommuneSearch: (v: string) => void;
  selectedResult: SearchResult | null;
  setSelectedResult: (v: SearchResult | null) => void;
  searchResults: SearchResult[];
  selectedCommune: MarketDataCommune | null;
  comparables: Comparable[];
  setComparables: React.Dispatch<React.SetStateAction<Comparable[]>>;
}) {
  const t = useTranslations("valorisation");

  const result = useMemo(() => {
    if (comparables.length === 0) {
      onValeur(0);
      return null;
    }
    const r = calculerComparaison(comparables, surfaceBien);
    onValeur(r.valeurEstimeePonderee);
    return r;
  }, [comparables, surfaceBien, onValeur]);

  const updateComp = (index: number, field: keyof Comparable, value: string | number) => {
    setComparables((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof next[index][field] === "number" ? Number(value) : value };
      return next;
    });
  };

  const addComp = () => {
    // Pré-remplir avec le prix moyen communal si disponible
    const prixM2Ref = selectedCommune?.prixM2Existant || 0;
    setComparables((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        adresse: selectedCommune ? `${t("compVirtuelLabel")} — ${selectedCommune.commune}` : "",
        prixVente: prixM2Ref > 0 ? prixM2Ref * surfaceBien : 0,
        surface: surfaceBien,
        dateVente: new Date().toISOString().slice(0, 7),
        ajustLocalisation: 0, ajustEtat: 0, ajustEtage: 0,
        ajustExterieur: 0, ajustParking: 0, ajustDate: 0, ajustAutre: 0,
        poids: 33,
      },
    ]);
  };

  const removeComp = (index: number) => {
    setComparables((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Références de marché — données publiques */}
      <div className="rounded-xl border-2 border-navy/20 bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy mb-1">{t("refMarcheParCommune")}</h2>
        <p className="text-xs text-muted mb-4">{t("refMarcheSource")}</p>

        <div className="relative">
          <input
            type="text"
            value={communeSearch}
            onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.commune.commune + r.matchedOn}
                  onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors"
                >
                  {r.isLocalite ? (
                    <>
                      <span className="font-medium">{r.matchedOn}</span>
                      <span className="text-muted ml-1">— {r.quartier ? t("quartierDe") : t("communeDe")} {r.commune.commune}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{r.commune.commune}</span>
                      <span className="text-muted ml-2">({r.commune.canton})</span>
                    </>
                  )}
                  <span className="float-right font-mono text-navy">
                    {r.quartier ? formatEUR(r.quartier.prixM2) : r.commune.prixM2Existant ? formatEUR(r.commune.prixM2Existant) : "—"}/m²
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCommune && (
          <div className="mt-4">
            {selectedResult?.isLocalite && (
              <p className="text-xs text-muted mb-2">
                <span className="font-medium text-slate">{selectedResult.matchedOn}</span> — {selectedResult.quartier ? t("quartierDe") : t("communeDe")} <span className="font-medium text-slate">{selectedCommune.commune}</span> ({selectedCommune.canton}).
                {selectedResult.quartier && (
                  <span className="ml-1 text-slate">{selectedResult.quartier.note}</span>
                )}
              </p>
            )}

            {/* Prix quartier spécifique si dispo */}
            {selectedResult?.quartier && (
              <div className="mb-3 rounded-lg border-2 border-navy/20 bg-navy/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-navy">{selectedResult.quartier.nom}</div>
                    <div className="text-xs text-muted">{selectedResult.quartier.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-navy">{formatEUR(selectedResult.quartier.prixM2)}/m²</div>
                    {selectedResult.quartier.loyerM2 && (
                      <div className="text-xs text-muted">{t("loyer")} : {selectedResult.quartier.loyerM2.toFixed(1)} €/m²/{t("suffixMois")}</div>
                    )}
                    <div className={`text-xs font-medium ${selectedResult.quartier.tendance === "hausse" ? "text-success" : selectedResult.quartier.tendance === "baisse" ? "text-error" : "text-muted"}`}>
                      {t("tendance")} : {selectedResult.quartier.tendance}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">{t("prixM2Transactions")}</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2Existant ? formatEUR(selectedCommune.prixM2Existant) : "—"}</div>
              <div className="text-[10px] text-muted">{t("existantActes")}</div>
            </div>
            <div className="rounded-lg bg-navy/5 p-3 text-center">
              <div className="text-xs text-muted">{t("prixM2VEFA")}</div>
              <div className="text-lg font-bold text-navy">{selectedCommune.prixM2VEFA ? formatEUR(selectedCommune.prixM2VEFA) : "—"}</div>
              <div className="text-[10px] text-muted">{t("neufActes")}</div>
            </div>
            <div className="rounded-lg bg-gold/10 p-3 text-center">
              <div className="text-xs text-muted">{t("prixM2Annonces")}</div>
              <div className="text-lg font-bold text-gold-dark">{selectedCommune.prixM2Annonces ? formatEUR(selectedCommune.prixM2Annonces) : "—"}</div>
              <div className="text-[10px] text-muted">{t("annoncesDonnees")}</div>
            </div>
            <div className="rounded-lg bg-teal/10 p-3 text-center">
              <div className="text-xs text-muted">{t("loyerM2Mois")}</div>
              <div className="text-lg font-bold text-teal">{selectedCommune.loyerM2Annonces ? `${selectedCommune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
              <div className="text-[10px] text-muted">{t("annoncesDonnees")}</div>
            </div>
            </div>
          </div>
        )}

        {selectedCommune && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>{t("nbTransactions", { nb: selectedCommune.nbTransactions ?? 0, periode: selectedCommune.periode ?? "" })}</span>
            <span>{selectedCommune.source}</span>
          </div>
        )}

        {/* Grille quartiers si disponible */}
        {selectedCommune?.quartiers && selectedCommune.quartiers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-navy mb-2">{t("prixParQuartier", { commune: selectedCommune.commune })}</h3>
            <div className="rounded-lg border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">{t("thQuartier")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">€/m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("thLoyerM2")}</th>
                    <th className="px-3 py-2 text-center font-semibold text-navy">{t("tendance")}</th>
                    <th className="px-3 py-2 text-left font-semibold text-navy">{t("thCaracteristique")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCommune.quartiers
                    .sort((a, b) => b.prixM2 - a.prixM2)
                    .map((qr) => (
                    <tr key={qr.nom} className={`border-b border-card-border/50 hover:bg-background/50 ${selectedResult?.quartier?.nom === qr.nom ? "bg-navy/5" : ""}`}>
                      <td className="px-3 py-1.5 font-medium">{qr.nom}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold">{formatEUR(qr.prixM2)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted">{qr.loyerM2 ? `${qr.loyerM2.toFixed(1)} €` : "—"}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          qr.tendance === "hausse" ? "bg-green-100 text-green-700" :
                          qr.tendance === "baisse" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{qr.tendance}</span>
                      </td>
                      <td className="px-3 py-1.5 text-muted">{qr.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[10px] text-muted">{t("quartiersSourceNote")}</p>
          </div>
        )}
      </div>

      {/* Données marché par segment (non-résidentiel) */}
      {assetType !== "residential_apartment" && (
        <MarketDataPanel assetType={assetType} />
      )}

      {/* Sources de données */}
      <div className="rounded-lg border border-card-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-navy mb-2">{t("sourcesOuvertes")}</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <a href={DATA_SOURCES.prixTransactionsParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixTransactionsParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixTransactionsParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.prixAffinesParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixAffinesParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixAffinesParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.prixAnnoncesParCommune.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">{DATA_SOURCES.prixAnnoncesParCommune.format}</span>
            <span className="text-slate">{DATA_SOURCES.prixAnnoncesParCommune.label}</span>
          </a>
          <a href={DATA_SOURCES.indicePrixSTATEC.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-background transition-colors">
            <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium text-navy">SDMX</span>
            <span className="text-slate">{DATA_SOURCES.indicePrixSTATEC.label}</span>
          </a>
        </div>
      </div>

      {/* Évaluation rapide par ajustement du prix communal */}
      {selectedCommune && selectedCommune.prixM2Existant && (
        <div className="rounded-xl border-2 border-gold/30 bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-1">{t("evalParAjustement")}</h2>
          <p className="text-xs text-muted mb-4">
            {t("prixDeBase")} : <strong className="text-navy">{formatEUR(selectedCommune.prixM2Existant)}/m²</strong> ({selectedCommune.commune})
            {selectedResult?.quartier && <> — {t("thQuartier").toLowerCase()} {selectedResult.quartier.nom} : <strong className="text-navy">{formatEUR(selectedResult.quartier.prixM2)}/m²</strong></>}
            . {t("ajustezCaracteristiques")}
          </p>

          {/* Ajustements inline — sans avoir à créer de comparable */}
          {comparables.length === 0 && (
            <div>
              <button
                onClick={addComp}
                className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-light transition-colors"
              >
                {t("commencerEvaluation", { commune: selectedCommune.commune })}
              </button>
              <p className="mt-2 text-xs text-muted text-center">
                {t("compCreePrixMoyen")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Comparables */}
      {comparables.length > 0 && (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <div className="rounded-lg bg-navy/5 border border-navy/10 p-4 mb-4">
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="text-navy">{t("compGuideTitle")}</strong>{" "}
            {t("compGuideText")}
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-navy">{t("comparablesTitle", { count: comparables.length })}</h2>
            <p className="text-xs text-muted">{t("comparablesSub")}</p>
          </div>
          <button
            onClick={addComp}
            className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors"
          >
            {t("ajouterComparable")}
          </button>
        </div>

        <div className="space-y-4">
          {comparables.map((comp, i) => (
            <div key={comp.id} className="rounded-lg border border-card-border bg-background p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-navy">{t("comparableN", { n: i + 1 })}</span>
                <button onClick={() => removeComp(i)} className="text-xs text-error hover:underline">
                  {t("supprimer")}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InputField label={t("adresse")} type="text" value={comp.adresse} onChange={(v) => updateComp(i, "adresse", v)} className="sm:col-span-3" />
                <InputField label={t("prixDeVente")} value={comp.prixVente} onChange={(v) => updateComp(i, "prixVente", v)} suffix="€" />
                <InputField label={t("surface")} value={comp.surface} onChange={(v) => updateComp(i, "surface", v)} suffix="m²" />
                <InputField label={t("dateVente")} type="text" value={comp.dateVente} onChange={(v) => updateComp(i, "dateVente", v)} hint={t("dateHintAAAAMM")} />
              </div>

              {/* Ajustements avec guides statistiques */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-navy">{t("ajustementsTitle")}</span>
                  <span className="text-[10px] text-muted">{t("ajustementsHint")}</span>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {/* Localisation */}
                  <div className="flex gap-2">
                    <InputField label={t("localisation")} value={comp.ajustLocalisation} onChange={(v) => updateComp(i, "ajustLocalisation", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="localisation" currentValue={comp.ajustLocalisation} onApply={(v) => updateComp(i, "ajustLocalisation", v)} />
                  </div>

                  {/* État */}
                  <div className="flex gap-2">
                    <InputField label={t("etat")} value={comp.ajustEtat} onChange={(v) => updateComp(i, "ajustEtat", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etat" currentValue={comp.ajustEtat} onApply={(v) => updateComp(i, "ajustEtat", v)} />
                  </div>

                  {/* Étage */}
                  <div className="flex gap-2">
                    <InputField label={t("etageVue")} value={comp.ajustEtage} onChange={(v) => updateComp(i, "ajustEtage", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="etage" currentValue={comp.ajustEtage} onApply={(v) => updateComp(i, "ajustEtage", v)} />
                  </div>

                  {/* Extérieur */}
                  <div className="flex gap-2">
                    <InputField label={t("exterieur")} value={comp.ajustExterieur} onChange={(v) => updateComp(i, "ajustExterieur", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="exterieur" currentValue={comp.ajustExterieur} onApply={(v) => updateComp(i, "ajustExterieur", v)} />
                  </div>

                  {/* Parking */}
                  <div className="flex gap-2">
                    <InputField label={t("parking")} value={comp.ajustParking} onChange={(v) => updateComp(i, "ajustParking", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="parking" currentValue={comp.ajustParking} onApply={(v) => updateComp(i, "ajustParking", v)} />
                  </div>

                  {/* Date — avec auto-calcul STATEC */}
                  <div className="flex gap-2">
                    <InputField label={t("dateIndex")} value={comp.ajustDate} onChange={(v) => updateComp(i, "ajustDate", v)} suffix="%" step={0.5} className="w-28 shrink-0" />
                    <AdjustmentGuidePanel critere="date" currentValue={comp.ajustDate} onApply={(v) => updateComp(i, "ajustDate", v)} dateVente={comp.dateVente} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <InputField label={t("autreAjustement")} value={comp.ajustAutre} onChange={(v) => updateComp(i, "ajustAutre", v)} suffix="%" step={0.5} hint={t("autreAjustementHint")} />
                  <InputField label={t("poids")} value={comp.poids} onChange={(v) => updateComp(i, "poids", v)} suffix="%" min={0} max={100} hint={t("poidsHint")} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {!selectedCommune && comparables.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-card-border py-12 text-center">
          <p className="text-sm text-muted">{t("selectCommuneStart")}</p>
        </div>
      )}

      {/* Résultats — seulement si des comparables sont saisis */}
      {result && result.comparables.length > 0 && (
        <>
          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  <th className="px-3 py-2.5 text-left font-semibold text-navy">{t("thComp")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("thEurM2Brut")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("thAjustTotal")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("thEurM2Ajuste")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("poids")}</th>
                </tr>
              </thead>
              <tbody>
                {result.comparables.map((c, i) => (
                  <tr key={c.id} className="border-b border-card-border/50">
                    <td className="px-3 py-2 font-medium">{c.adresse || `${t("thComp")} ${i + 1}`}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatEUR(c.prixM2Brut)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted">{c.totalAjustements > 0 ? "+" : ""}{c.totalAjustements.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(c.prixM2Ajuste)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted">{c.poids}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ResultPanel
            title={t("valeurParComparaison")}
            lines={[
              { label: t("prixMoyenAjusteM2"), value: formatEUR(result.prixM2Moyen), sub: true },
              { label: t("prixMoyenPondereM2"), value: formatEUR(result.prixM2MoyenPondere) },
              { label: t("surfaceDuBien"), value: `${surfaceBien} m²`, sub: true },
              { label: t("valeurEstimeePonderee"), value: formatEUR(result.valeurEstimeePonderee), highlight: true, large: true },
            ]}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// TAB 2 — CAPITALISATION DIRECTE
// ============================================================

function TabCapitalisation({ onValeur }: { onValeur: (v: number) => void }) {
  const t = useTranslations("valorisation");
  const [loyerBrut, setLoyerBrut] = useState(36000);
  const [chargesNonRecup, setChargesNonRecup] = useState(1800);
  const [tauxVacance, setTauxVacance] = useState(5);
  const [provisionEntretien, setProvisionEntretien] = useState(3);
  const [assurancePNO, setAssurancePNO] = useState(400);
  const [fraisGestion, setFraisGestion] = useState(5);
  const [taxeFonciere, setTaxeFonciere] = useState(200);
  const [tauxCap, setTauxCap] = useState(4.0);
  const [ervAnnuel, setErvAnnuel] = useState(0);

  const result = useMemo(() => {
    const r = calculerCapitalisation({
      loyerBrutAnnuel: loyerBrut,
      chargesNonRecuperables: chargesNonRecup,
      tauxVacance: tauxVacance / 100,
      provisionGrosEntretien: provisionEntretien / 100,
      assurancePNO,
      fraisGestion: fraisGestion / 100,
      taxeFonciere,
      tauxCapitalisation: tauxCap / 100,
      ervAnnuel: ervAnnuel > 0 ? ervAnnuel : undefined,
    });
    onValeur(r.valeur);
    return r;
  }, [loyerBrut, chargesNonRecup, tauxVacance, provisionEntretien, assurancePNO, fraisGestion, taxeFonciere, tauxCap, onValeur]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capRevenus")}</h2>
          <div className="space-y-4">
            <InputField label={t("loyerBrutAnnuel")} value={loyerBrut} onChange={(v) => setLoyerBrut(Number(v))} suffix="€" hint={`${formatEUR2(loyerBrut / 12)} /${t("suffixMois")}`} />
            <InputField label={t("tauxDeVacance")} value={tauxVacance} onChange={(v) => setTauxVacance(Number(v))} suffix="%" step={0.5} hint={t("tauxVacanceHint")} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capChargesProprietaire")}</h2>
          <div className="space-y-4">
            <InputField label={t("chargesNonRecup")} value={chargesNonRecup} onChange={(v) => setChargesNonRecup(Number(v))} suffix={t("suffixEurAn")} />
            <InputField label={t("provisionEntretien")} value={provisionEntretien} onChange={(v) => setProvisionEntretien(Number(v))} suffix={t("suffixPctLoyer")} step={0.5} />
            <InputField label={t("assurancePNO")} value={assurancePNO} onChange={(v) => setAssurancePNO(Number(v))} suffix={t("suffixEurAn")} />
            <InputField label={t("fraisGestion")} value={fraisGestion} onChange={(v) => setFraisGestion(Number(v))} suffix={t("suffixPctLoyer")} step={0.5} />
            <InputField label={t("impotFoncier")} value={taxeFonciere} onChange={(v) => setTaxeFonciere(Number(v))} suffix={t("suffixEurAn")} hint={t("impotFoncierHint")} />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capERVTitle")}</h2>
          <InputField
            label={t("loyerMarcheERV")}
            value={ervAnnuel}
            onChange={(v) => setErvAnnuel(Number(v))}
            suffix="€"
            hint={t("loyerMarcheERVHint")}
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capTauxCap")}</h2>
          <InputField
            label={t("tauxDeCapitalisation")}
            value={tauxCap}
            onChange={(v) => setTauxCap(Number(v))}
            suffix="%"
            step={0.1}
            hint={t("tauxCapHint")}
          />
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              {t("capTauxCapNote")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ResultPanel
          title={t("capResultNOI")}
          lines={[
            { label: t("loyerBrutAnnuel"), value: formatEUR(loyerBrut) },
            { label: t("capVacanceLine", { pct: tauxVacance }), value: `- ${formatEUR(loyerBrut * tauxVacance / 100)}`, sub: true },
            { label: t("capLoyerBrutEffectif"), value: formatEUR(result.loyerBrutEffectif) },
            { label: t("capChargesProprietaireLine"), value: `- ${formatEUR(result.totalCharges)}` },
            { label: t("capNOI"), value: formatEUR(result.noi), highlight: true, large: true },
          ]}
        />

        <ResultPanel
          title={t("valeurParCapitalisation")}
          className="border-gold/30"
          lines={[
            { label: t("capNOIDivTaux", { noi: formatEUR(result.noi), taux: tauxCap }), value: `${formatEUR(result.noi)} / ${tauxCap}%`, sub: true },
            { label: t("valeurEstimee"), value: formatEUR(result.valeur), highlight: true, large: true },
            { label: t("rendementInitial"), value: formatPct(result.rendementInitial) },
            { label: t("rendementBrut"), value: formatPct(result.rendementBrut), sub: true },
            { label: t("rendementNet"), value: formatPct(result.rendementNet), sub: true },
            ...(result.rendementReversionnaire !== undefined ? [
              { label: t("rendementReversionnaire"), value: formatPct(result.rendementReversionnaire) },
              { label: result.sousLoue ? t("sousLoue") : t("surLoue"), value: `${result.potentielReversion ? (result.potentielReversion > 0 ? "+" : "") + result.potentielReversion.toFixed(1) + "%" : "0%"}`, warning: !result.sousLoue },
            ] : []),
          ]}
        />

        {/* Sensibilité au taux de capitalisation */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-navy">{t("capSensibiliteTauxCap")}</h3>
          <div className="space-y-1">
            {result.sensibilite.map((s) => {
              const isActive = Math.abs(s.tauxCap - tauxCap) < 0.01;
              return (
                <div key={s.tauxCap} className={`flex justify-between py-1.5 px-2 rounded text-sm ${isActive ? "bg-navy/5 font-semibold" : ""}`}>
                  <span className="text-muted">{t("taux")} {s.tauxCap.toFixed(2)}%</span>
                  <span className="font-mono">{formatEUR(s.valeur)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 3 — DCF
// ============================================================

function TabDCF({ onValeur }: { onValeur: (v: number) => void }) {
  const t = useTranslations("valorisation");
  const [loyerInitial, setLoyerInitial] = useState(36000);
  const [tauxIndex, setTauxIndex] = useState(2.0);
  const [tauxVacance, setTauxVacance] = useState(5);
  const [chargesAnnuelles, setChargesAnnuelles] = useState(4500);
  const [progressionCharges, setProgressionCharges] = useState(2.0);
  const [periodeAnalyse, setPeriodeAnalyse] = useState(10);
  const [tauxActu, setTauxActu] = useState(5.5);
  const [tauxCapSortie, setTauxCapSortie] = useState(4.5);
  const [fraisCession, setFraisCession] = useState(7);

  const result = useMemo(() => {
    const r = calculerDCF({
      loyerAnnuelInitial: loyerInitial,
      tauxIndexation: tauxIndex / 100,
      tauxVacance: tauxVacance / 100,
      chargesAnnuelles,
      tauxProgressionCharges: progressionCharges / 100,
      periodeAnalyse,
      tauxActualisation: tauxActu / 100,
      tauxCapSortie: tauxCapSortie / 100,
      fraisCessionPct: fraisCession / 100,
    });
    onValeur(r.valeurDCF);
    return r;
  }, [loyerInitial, tauxIndex, tauxVacance, chargesAnnuelles, progressionCharges, periodeAnalyse, tauxActu, tauxCapSortie, fraisCession, onValeur]);

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("dcfCashFlows")}</h2>
            <div className="space-y-4">
              <InputField label={t("dcfLoyerInitial")} value={loyerInitial} onChange={(v) => setLoyerInitial(Number(v))} suffix="€" />
              <InputField label={t("dcfIndexation")} value={tauxIndex} onChange={(v) => setTauxIndex(Number(v))} suffix="%" step={0.1} hint={t("dcfIndexationHint")} />
              <InputField label={t("tauxDeVacance")} value={tauxVacance} onChange={(v) => setTauxVacance(Number(v))} suffix="%" step={0.5} />
              <InputField label={t("dcfChargesAn1")} value={chargesAnnuelles} onChange={(v) => setChargesAnnuelles(Number(v))} suffix="€" />
              <InputField label={t("dcfProgressionCharges")} value={progressionCharges} onChange={(v) => setProgressionCharges(Number(v))} suffix="%" step={0.1} />
              <InputField label={t("periodeAnalyse")} value={periodeAnalyse} onChange={(v) => setPeriodeAnalyse(Number(v))} suffix={t("suffixAns")} min={5} max={20} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("dcfTauxActuSortie")}</h2>
            <div className="space-y-4">
              <InputField
                label={t("tauxActualisation")}
                value={tauxActu}
                onChange={(v) => setTauxActu(Number(v))}
                suffix="%"
                step={0.1}
                hint={t("tauxActualisationHint")}
              />
              <InputField
                label={t("tauxCapSortie")}
                value={tauxCapSortie}
                onChange={(v) => setTauxCapSortie(Number(v))}
                suffix="%"
                step={0.1}
                hint={t("tauxCapSortieHint")}
              />
              <InputField label={t("fraisCession")} value={fraisCession} onChange={(v) => setFraisCession(Number(v))} suffix="%" hint={t("fraisCessionHint")} />
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                {t("dcfTauxNote")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ResultPanel
            title={t("dcfValeurTitle")}
            className="border-gold/30"
            lines={[
              { label: t("dcfRevenusNetsActualises"), value: formatEUR(result.totalNOIActualise) },
              { label: t("dcfRevenuNetProjection", { annee: periodeAnalyse + 1 }), value: formatEUR(result.noiTerminal), sub: true },
              { label: t("dcfValeurReventeBrute"), value: formatEUR(result.valeurTerminaleBrute), sub: true },
              { label: t("dcfFraisCessionPct", { pct: fraisCession }), value: `- ${formatEUR(result.fraisCession)}`, sub: true },
              { label: t("dcfValeurReventeNette"), value: formatEUR(result.valeurTerminaleNette), sub: true },
              { label: t("dcfValeurReventeActualisee"), value: formatEUR(result.valeurTerminaleActualisee) },
              { label: t("dcfValeurDCF"), value: formatEUR(result.valeurDCF), highlight: true, large: true },
              { label: t("dcfTRI"), value: `${(result.irr * 100).toFixed(2)} %`, highlight: true },
            ]}
          />

          {/* Matrice de sensibilité DCF */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">{t("dcfSensibiliteTitle")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="px-2 py-1.5 text-left text-navy">{t("dcfActuVsSortie")}</th>
                    {[...new Set(result.sensibilite.map((s) => s.tauxCapSortie))].map((tc) => (
                      <th key={tc} className="px-2 py-1.5 text-right text-navy">{tc.toFixed(1)}%</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(result.sensibilite.map((s) => s.tauxActu))].map((ta) => (
                    <tr key={ta} className="border-b border-card-border/50">
                      <td className="px-2 py-1.5 font-medium">{ta.toFixed(1)}%</td>
                      {result.sensibilite.filter((s) => s.tauxActu === ta).map((s) => {
                        const isBase = Math.abs(s.tauxActu - tauxActu) < 0.01 && Math.abs(s.tauxCapSortie - tauxCapSortie) < 0.01;
                        return (
                          <td key={s.tauxCapSortie} className={`px-2 py-1.5 text-right font-mono ${isBase ? "bg-navy/10 font-bold" : ""}`}>
                            {formatEUR(s.valeur)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted">{t("dcfSensibiliteNote")}</p>
          </div>

          {/* Proportion cash flows vs terminal */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">{t("dcfDecompositionTitle")}</h3>
            <div className="flex gap-1 h-6 rounded-full overflow-hidden">
              <div
                className="bg-navy rounded-l-full"
                style={{ width: `${result.valeurDCF > 0 ? (result.totalNOIActualise / result.valeurDCF) * 100 : 50}%` }}
              />
              <div
                className="bg-gold rounded-r-full"
                style={{ width: `${result.valeurDCF > 0 ? (result.valeurTerminaleActualisee / result.valeurDCF) * 100 : 50}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>{t("dcfRevenusNets")} : {result.valeurDCF > 0 ? ((result.totalNOIActualise / result.valeurDCF) * 100).toFixed(0) : 0}%</span>
              <span>{t("dcfValeurRevente")} : {result.valeurDCF > 0 ? ((result.valeurTerminaleActualisee / result.valeurDCF) * 100).toFixed(0) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des cash flows */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-3 py-2.5 text-left font-semibold text-navy">{t("dcfThAnnee")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThLoyerBrut")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThVacance")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThCharges")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThRevenuNet")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThFacteurActu")}</th>
              <th className="px-3 py-2.5 text-right font-semibold text-navy">{t("dcfThRevenuActualise")}</th>
            </tr>
          </thead>
          <tbody>
            {result.cashFlows.map((cf) => (
              <tr key={cf.annee} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-3 py-2 font-medium">{cf.annee}</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(cf.loyerBrut)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{formatEUR(cf.vacance)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{formatEUR(cf.charges)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(cf.noi)}</td>
                <td className="px-3 py-2 text-right font-mono text-muted">{cf.facteurActualisation.toFixed(4)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatEUR(cf.noiActualise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// TAB — TERME & RÉVERSION
// ============================================================

function TabTermeReversion({ onValeur }: { onValeur: (v: number) => void }) {
  const t = useTranslations("valorisation");
  const [loyerEnPlace, setLoyerEnPlace] = useState(36000);
  const [erv, setErv] = useState(42000);
  const [dureeRestante, setDureeRestante] = useState(5);
  const [tauxTerme, setTauxTerme] = useState(4.0);
  const [tauxReversion, setTauxReversion] = useState(5.0);

  const result = useMemo(() => {
    const r = calculerTermeReversion({
      loyerEnPlace,
      erv,
      dureeRestanteBail: dureeRestante,
      tauxTerme: tauxTerme / 100,
      tauxReversion: tauxReversion / 100,
    });
    onValeur(r.valeur);
    return r;
  }, [loyerEnPlace, erv, dureeRestante, tauxTerme, tauxReversion, onValeur]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("capRevenus")}</h2>
          <div className="space-y-4">
            <InputField label={t("trLoyerEnPlace")} value={loyerEnPlace} onChange={(v) => setLoyerEnPlace(Number(v))} suffix="€" hint={t("trLoyerEnPlaceHint")} />
            <InputField label={t("trERV")} value={erv} onChange={(v) => setErv(Number(v))} suffix="€" hint={t("trERVHint")} />
            <InputField label={t("trDureeRestante")} value={dureeRestante} onChange={(v) => setDureeRestante(Number(v))} suffix={t("suffixAns")} min={0} max={30} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("trTauxRendement")}</h2>
          <div className="space-y-4">
            <InputField label={t("trTauxTerme")} value={tauxTerme} onChange={(v) => setTauxTerme(Number(v))} suffix="%" step={0.1} hint={t("trTauxTermeHint")} />
            <InputField label={t("trTauxReversion")} value={tauxReversion} onChange={(v) => setTauxReversion(Number(v))} suffix="%" step={0.1} hint={t("trTauxReversionHint")} />
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              {t("trMethodeNote")}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <ResultPanel
          title={t("trResultTitle")}
          className="border-gold/30"
          lines={[
            { label: t("trTermeLine", { loyer: formatEUR(loyerEnPlace), facteur: result.facteurTerme.toFixed(3), duree: dureeRestante, taux: tauxTerme }), value: formatEUR(result.valeurTerme) },
            { label: t("trReversionLine", { erv: formatEUR(erv), facteurPerp: result.facteurReversionPerp.toFixed(2), facteurDiff: result.facteurDiffere.toFixed(4) }), value: formatEUR(result.valeurReversion) },
            { label: t("trValeurTotale"), value: formatEUR(result.valeur), highlight: true, large: true },
            { label: t("trRendementEquivalent"), value: formatPct(result.rendementEquivalent), sub: true },
            { label: loyerEnPlace < erv ? t("sousLoue") : t("surLoue"), value: `${((erv - loyerEnPlace) / loyerEnPlace * 100).toFixed(1)}%`, warning: loyerEnPlace > erv },
          ]}
        />
      </div>
    </div>
  );
}

// ============================================================
// TAB — ESG / DURABILITÉ
// ============================================================

function TabESG() {
  const t = useTranslations("valorisation");
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [anneeConstruction, setAnneeConstruction] = useState(1990);
  const [zoneInondable, setZoneInondable] = useState(false);
  const [risqueSecheresse, setRisqueSecheresse] = useState(false);
  const [risqueGlissement, setRisqueGlissement] = useState(false);
  const [proximitePollue, setProximitePollue] = useState(false);
  const [isolationRecente, setIsolationRecente] = useState(false);
  const [panneauxSolaires, setPanneauxSolaires] = useState(false);
  const [pompeAChaleur, setPompeAChaleur] = useState(false);
  const [certifications, setCertifications] = useState<string[]>([]);

  const result = useMemo(() =>
    evaluerESG({
      classeEnergie,
      anneeConstruction,
      zoneInondable,
      risqueSecheresse,
      risqueGlissementTerrain: risqueGlissement,
      proximiteSitePollue: proximitePollue,
      isolationRecente,
      panneauxSolaires,
      pompeAChaleur,
      certifications,
    }),
  [classeEnergie, anneeConstruction, zoneInondable, risqueSecheresse, risqueGlissement, proximitePollue, isolationRecente, panneauxSolaires, pompeAChaleur, certifications]);

  const scoreColor = result.score >= 60 ? "text-success" : result.score >= 40 ? "text-warning" : "text-error";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("esgPerfEnergetique")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label={t("esgClasseEnergie")} type="select" value={classeEnergie} onChange={setClasseEnergie} options={[
              { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
              { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
            ]} />
            <InputField label={t("esgAnneeConstruction")} value={anneeConstruction} onChange={(v) => setAnneeConstruction(Number(v))} min={1800} max={2026} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("esgRisquesEnv")}</h2>
          <div className="space-y-3">
            <ToggleField label={t("esgZoneInondable")} checked={zoneInondable} onChange={setZoneInondable} />
            <ToggleField label={t("esgRisqueSecheresse")} checked={risqueSecheresse} onChange={setRisqueSecheresse} />
            <ToggleField label={t("esgRisqueGlissement")} checked={risqueGlissement} onChange={setRisqueGlissement} />
            <ToggleField label={t("esgProximitePollue")} checked={proximitePollue} onChange={setProximitePollue} />
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("esgEquipementsDurables")}</h2>
          <div className="space-y-3">
            <ToggleField label={t("esgIsolationRecente")} checked={isolationRecente} onChange={setIsolationRecente} />
            <ToggleField label={t("esgPanneauxSolaires")} checked={panneauxSolaires} onChange={setPanneauxSolaires} />
            <ToggleField label={t("esgPompeAChaleur")} checked={pompeAChaleur} onChange={setPompeAChaleur} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate mb-2">{t("esgCertifications")}</label>
            <div className="flex flex-wrap gap-2">
              {["BREEAM", "DGNB", "WELL", "LEED", "HQE", "Minergie"].map((cert) => (
                <button key={cert} onClick={() => setCertifications((prev) => prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert])}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${certifications.includes(cert) ? "bg-navy text-white" : "bg-background text-muted border border-card-border hover:bg-navy/5"}`}>
                  {cert}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* Score ESG */}
        <div className="rounded-2xl border border-card-border bg-card p-8 text-center shadow-sm">
          <div className="text-sm text-muted">{t("esgScoreESG")}</div>
          <div className={`text-5xl font-bold mt-2 ${scoreColor}`}>{result.score}/100</div>
          <div className={`mt-2 text-lg font-semibold ${scoreColor}`}>{t("esgNiveau")} {result.niveau} — {t(result.niveauLabelKey)}</div>
          <div className="mt-3 text-sm font-medium">
            {t("esgImpactEstime")} : <span className={result.impactValeur >= 0 ? "text-success" : "text-error"}>{result.impactValeur > 0 ? "+" : ""}{result.impactValeur}%</span>
          </div>
        </div>
        {/* Risques */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">{t("esgRisquesIdentifies")}</h3>
          <div className="space-y-2">
            {result.risques.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.niveau === "eleve" ? "bg-red-100 text-red-700" : r.niveau === "moyen" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {t(`esgNiveauRisque_${r.niveau}`)}
                </span>
                <span className="text-slate">{t(r.labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
        {result.opportuniteKeys.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-3">{t("esgPointsPositifs")}</h3>
            <ul className="space-y-1 text-sm text-slate">
              {result.opportuniteKeys.map((oKey, i) => {
                // Handle special certification key format: "esgOppoCertifications:BREEAM, DGNB"
                if (oKey.startsWith("esgOppoCertifications:")) {
                  const certs = oKey.split(":")[1];
                  return <li key={i}>+ {t("esgOppoCertifications", { certs })}</li>;
                }
                return <li key={i}>+ {t(oKey)}</li>;
              })}
            </ul>
          </div>
        )}
        {result.recommandationKeys.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-3">{t("esgRecommandations")}</h3>
            <ul className="space-y-1 text-sm text-slate">
              {result.recommandationKeys.map((rKey, i) => <li key={i}>{t(rKey)}</li>)}
            </ul>
          </div>
        )}
        <div className="rounded-lg bg-navy/5 border border-navy/10 p-3">
          <p className="text-xs text-slate leading-relaxed">
            {t("esgEVSNote")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB — RÉSIDUELLE ÉNERGÉTIQUE
// ============================================================

function TabEnergie({ valeurMarcheCible, surfaceBien }: { valeurMarcheCible: number; surfaceBien: number }) {
  const t = useTranslations("valorisation");
  const [classeActuelle, setClasseActuelle] = useState("E");
  const [classeCible, setClasseCible] = useState("B");
  const [anneeConstruction, setAnneeConstruction] = useState(1985);
  const [valeurApres, setValeurApres] = useState(valeurMarcheCible);
  const [coutTravaux, setCoutTravaux] = useState(80000);
  const [honoraires, setHonoraires] = useState(8000);
  const [fraisFinancement, setFraisFinancement] = useState(3000);
  const [margePrudentielle, setMargePrudentielle] = useState(10);
  const [aidesPrevues, setAidesPrevues] = useState(40000);

  const energyClassOptions = [
    { value: "A", label: t("classeA") },
    { value: "B", label: t("classeB") },
    { value: "C", label: t("classeC") },
    { value: "D", label: t("classeD") },
    { value: "E", label: t("classeE") },
    { value: "F", label: t("classeF") },
    { value: "G", label: t("classeG") },
  ];

  const targetClassOptions = [
    { value: "A", label: t("classeA") },
    { value: "B", label: t("classeB") },
    { value: "C", label: t("classeC") },
    { value: "D", label: t("classeD") },
  ];

  const result = useMemo(
    () =>
      calculerResiduelleEnergetique({
        classeActuelle,
        classeCible,
        valeurApresRenovation: valeurApres,
        coutTravauxRenovation: coutTravaux,
        honorairesEtudes: honoraires,
        fraisFinancement,
        margePrudentielle,
        aidesPrevues,
      }),
    [classeActuelle, classeCible, valeurApres, coutTravaux, honoraires, fraisFinancement, margePrudentielle, aidesPrevues]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("esgPerfEnergetique")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t("enClasseActuelle")}
              type="select"
              value={classeActuelle}
              onChange={setClasseActuelle}
              options={energyClassOptions}
            />
            <InputField
              label={t("enClasseCible")}
              type="select"
              value={classeCible}
              onChange={setClasseCible}
              options={targetClassOptions}
            />
          </div>
          <InputField
            label={t("esgAnneeConstruction")}
            value={anneeConstruction}
            onChange={(v) => setAnneeConstruction(Number(v))}
            min={1800}
            max={2026}
            className="mt-4"
            hint={t("enAnneeConstructionHint")}
          />
          <InputField
            label={t("enValeurApresRenovation")}
            value={valeurApres}
            onChange={(v) => setValeurApres(Number(v))}
            suffix="€"
            className="mt-4"
            hint={t("enValeurApresHint")}
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-navy">{t("enCoutsRenovation")}</h2>
            <button
              onClick={() => {
                const est = estimerCoutsRenovation(classeActuelle, classeCible, surfaceBien, anneeConstruction);
                if (est.totalMoyen > 0) {
                  setCoutTravaux(est.totalMoyen);
                  setHonoraires(est.honoraires);
                }
              }}
              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-navy-dark hover:bg-gold-light transition-colors"
            >
              {t("enEstimerAuto")}
            </button>
          </div>

          {/* Détail estimation auto */}
          {(() => {
            const est = estimerCoutsRenovation(classeActuelle, classeCible, surfaceBien, anneeConstruction);
            if (est.postes.length === 0) return null;
            return (
              <div className="mb-4 rounded-lg bg-background border border-card-border p-3">
                <div className="text-xs font-semibold text-navy mb-2">{t("enEstimationAutoTitle", { classeActuelle, classeCible, surface: surfaceBien, annee: anneeConstruction })}</div>
                <div className="space-y-1">
                  {est.postes.map((p) => (
                    <div key={p.labelKey} className="flex justify-between text-xs">
                      <span className="text-muted">{t(p.labelKey)}</span>
                      <span className="font-mono">{formatEUR(p.coutMin)} – {formatEUR(p.coutMax)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-semibold border-t border-card-border pt-1 mt-1">
                    <span>{t("enTotalTravauxFourchette")}</span>
                    <span className="font-mono">{formatEUR(est.totalMin)} – {formatEUR(est.totalMax)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{t("enHonoraires10pct")}</span>
                    <span className="font-mono">{formatEUR(est.honoraires)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{t("enDureeEstimee")}</span>
                    <span>{est.dureeEstimeeMois} {t("suffixMois")}</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted">{t("enFourchetteNote")}</p>
              </div>
            );
          })()}

          <div className="space-y-4">
            <InputField label={t("enTravauxRenovation")} value={coutTravaux} onChange={(v) => setCoutTravaux(Number(v))} suffix="€" hint={t("enTravauxHint")} />
            <InputField label={t("enHonorairesEtudes")} value={honoraires} onChange={(v) => setHonoraires(Number(v))} suffix="€" hint={t("enHonorairesHint")} />
            <InputField label={t("enFraisFinancement")} value={fraisFinancement} onChange={(v) => setFraisFinancement(Number(v))} suffix="€" hint={t("enFraisFinancementHint")} />
            <InputField
              label={t("enMargePrudentielle")}
              value={margePrudentielle}
              onChange={(v) => setMargePrudentielle(Number(v))}
              suffix="%"
              step={1}
              hint={t("enMargePrudentielleHint")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("enAidesPrevues")}</h2>
          <InputField
            label={t("enTotalAides")}
            value={aidesPrevues}
            onChange={(v) => setAidesPrevues(Number(v))}
            suffix="€"
            hint={t("enTotalAidesHint")}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Diagramme visuel classe énergétique */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-navy">{t("enTransitionEnergetique")}</h3>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white ${
                classeActuelle <= "C" ? "bg-green-500" : classeActuelle <= "E" ? "bg-amber-500" : "bg-red-500"
              }`}>
                {classeActuelle}
              </div>
              <div className="mt-1 text-xs text-muted">{t("enActuelle")}</div>
            </div>
            <svg className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <div className="text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white ${
                classeCible <= "B" ? "bg-green-500" : "bg-green-400"
              }`}>
                {classeCible}
              </div>
              <div className="mt-1 text-xs text-muted">{t("enCible")}</div>
            </div>
          </div>
        </div>

        <ResultPanel
          title={t("enResultTitle")}
          className="border-gold/30"
          lines={[
            { label: t("enValeurApresClasse", { classe: classeCible }), value: formatEUR(result.valeurApresRenovation) },
            { label: t("enTravauxHonoFinancement"), value: `- ${formatEUR(result.coutTotalBrut)}`, sub: true },
            { label: t("enMargePrudentiellePct", { pct: margePrudentielle }), value: `- ${formatEUR(result.margePrudentielleMontant)}`, sub: true },
            { label: t("enCoutTotalBrutMarge"), value: `- ${formatEUR(result.coutTotalAvecMarge)}` },
            { label: t("enAidesPrevuesLine"), value: `+ ${formatEUR(result.aidesDeduites)}` },
            { label: t("enCoutNetApresAides"), value: `- ${formatEUR(result.coutNetApresAides)}` },
            { label: t("enValeurResiduelle"), value: formatEUR(result.valeurResiduelle), highlight: true, large: true },
            { label: t("enDecoteEnergetique"), value: `${formatEUR(result.decoteEnergetique)} (${result.decoteEnergetiquePct.toFixed(1)}%)`, warning: result.decoteEnergetiquePct > 15 },
          ]}
        />

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-navy">{t("enMethodeEVSTitle")}</h3>
          <div className="space-y-2 text-sm text-muted leading-relaxed">
            <p>
              <strong className="text-slate">{t("enPrincipe")} :</strong> {t("enPrincipeText")}
            </p>
            <p>
              <strong className="text-slate">{t("enValeurResiduelle")}</strong> = {t("enFormule")}
            </p>
            <p>
              <strong className="text-slate">{t("enArt208EBA")} :</strong> {t("enArt208EBAText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 5 — MLV / CRR
// ============================================================

function TabMLV({ valeurMarche }: { valeurMarche: number }) {
  const t = useTranslations("valorisation");
  const [decoteConj, setDecoteConj] = useState(5);
  const [decoteComm, setDecoteComm] = useState(3);
  const [decoteSpec, setDecoteSpec] = useState(2);

  const result = useMemo(
    () =>
      calculerMLV({
        valeurMarche,
        decoteConjoncturelle: decoteConj,
        decoteCommercialisation: decoteComm,
        decoteSpecifique: decoteSpec,
      }),
    [valeurMarche, decoteConj, decoteComm, decoteSpec]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("mlvValeurMarche")}</h2>
          <div className="text-center py-4">
            <div className="text-sm text-muted">{t("mlvValeurMarcheEVS1")}</div>
            <div className="text-3xl font-bold text-navy mt-1">{formatEUR(valeurMarche)}</div>
            <p className="text-xs text-muted mt-2">{t("mlvIssueReconciliation")}</p>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("mlvDecotesPrudentielles")}</h2>
          <div className="space-y-4">
            <InputField
              label={t("mlvDecoteConjoncturelle")}
              value={decoteConj}
              onChange={(v) => setDecoteConj(Number(v))}
              suffix="%"
              step={0.5}
              hint={t("mlvDecoteConjHint")}
            />
            <InputField
              label={t("mlvDecoteCommercialisation")}
              value={decoteComm}
              onChange={(v) => setDecoteComm(Number(v))}
              suffix="%"
              step={0.5}
              hint={t("mlvDecoteCommHint")}
            />
            <InputField
              label={t("mlvDecoteSpecifique")}
              value={decoteSpec}
              onChange={(v) => setDecoteSpec(Number(v))}
              suffix="%"
              step={0.5}
              hint={t("mlvDecoteSpecHint")}
            />
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              {t("mlvCRRNote")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ResultPanel
          title={t("mlvResultTitle")}
          className="border-gold/30"
          lines={[
            { label: t("mlvValeurMarcheMV"), value: formatEUR(result.valeurMarche) },
            { label: t("mlvDecoteConjLine", { pct: decoteConj }), value: `- ${formatEUR(result.valeurMarche * decoteConj / 100)}`, sub: true },
            { label: t("mlvDecoteCommLine", { pct: decoteComm }), value: `- ${formatEUR(result.valeurMarche * decoteComm / 100)}`, sub: true },
            { label: t("mlvDecoteSpecLine", { pct: decoteSpec }), value: `- ${formatEUR(result.valeurMarche * decoteSpec / 100)}`, sub: true },
            { label: t("mlvTotalDecotes"), value: `- ${formatEUR(result.totalDecotes)} (${result.totalDecotesPct.toFixed(1)}%)` },
            { label: "MLV", value: formatEUR(result.mlv), highlight: true, large: true },
            { label: t("mlvRatioMLVMV"), value: `${(result.ratioMLVsurMV * 100).toFixed(1)}%`, sub: true },
          ]}
        />

        {/* CRR Risk Weight bands */}
        <div className="rounded-xl border border-card-border bg-card shadow-sm">
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-base font-semibold text-navy">{t("mlvCRR2Title")}</h3>
            <p className="text-xs text-muted mt-1">{t("mlvCRR2Subtitle")}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-card-border bg-background">
                <th className="px-4 py-2 text-left font-semibold text-navy">{t("mlvThBandeLTV")}</th>
                <th className="px-4 py-2 text-right font-semibold text-navy">{t("mlvThRiskWeight")}</th>
                <th className="px-4 py-2 text-right font-semibold text-navy">{t("mlvThPretMax")}</th>
              </tr>
            </thead>
            <tbody>
              {result.ltvBands.filter(b => b.ltvMax <= 1.0).map((band) => (
                <tr key={band.label} className="border-b border-card-border/50">
                  <td className="px-4 py-2">{band.label}</td>
                  <td className="px-4 py-2 text-right font-mono">{(band.riskWeight * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(band.montantMaxPret)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 5 — RÉCONCILIATION
// ============================================================

function TabReconciliation({
  valeurComparaison,
  valeurCapitalisation,
  valeurDCF,
  selectedCommune,
  assetType,
  evsInfo,
  surfaceBien,
}: {
  valeurComparaison: number;
  valeurCapitalisation: number;
  valeurDCF: number;
  selectedCommune: MarketDataCommune | null;
  assetType: string;
  evsInfo: { label: string };
  surfaceBien: number;
}) {
  const t = useTranslations("valorisation");
  const [poidsComp, setPoidsComp] = useState(50);
  const [poidsCap, setPoidsCap] = useState(25);
  const [poidsDCF, setPoidsDCF] = useState(25);

  // Scénarios : ajustement en % sur chaque valeur
  const [scenarioHautPct, setScenarioHautPct] = useState(10);
  const [scenarioBasPct, setScenarioBasPct] = useState(10);

  const makeReconc = useCallback((compAdj: number, capAdj: number, dcfAdj: number) => {
    return reconcilier({
      valeurComparaison: valeurComparaison ? valeurComparaison * (1 + compAdj / 100) : undefined,
      poidsComparaison: poidsComp,
      valeurCapitalisation: valeurCapitalisation ? valeurCapitalisation * (1 + capAdj / 100) : undefined,
      poidsCapitalisation: poidsCap,
      valeurDCF: valeurDCF ? valeurDCF * (1 + dcfAdj / 100) : undefined,
      poidsDCF,
    });
  }, [valeurComparaison, valeurCapitalisation, valeurDCF, poidsComp, poidsCap, poidsDCF]);

  const resultBase = useMemo(() => makeReconc(0, 0, 0), [makeReconc]);
  const resultHaut = useMemo(() => makeReconc(scenarioHautPct, scenarioHautPct, scenarioHautPct), [makeReconc, scenarioHautPct]);
  const resultBas = useMemo(() => makeReconc(-scenarioBasPct, -scenarioBasPct, -scenarioBasPct), [makeReconc, scenarioBasPct]);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pondérations */}
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("recValeursMethodePonderation")}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">{t("tabComparaison")}</div>
                  <div className="text-lg font-bold text-navy">{valeurComparaison ? formatEUR(valeurComparaison) : "—"}</div>
                </div>
                <InputField label={t("poids")} value={poidsComp} onChange={(v) => setPoidsComp(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">{t("tabCapitalisation")}</div>
                  <div className="text-lg font-bold text-navy">{valeurCapitalisation ? formatEUR(valeurCapitalisation) : "—"}</div>
                </div>
                <InputField label={t("poids")} value={poidsCap} onChange={(v) => setPoidsCap(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background p-3">
                <div>
                  <div className="text-sm font-medium text-slate">DCF</div>
                  <div className="text-lg font-bold text-navy">{valeurDCF ? formatEUR(valeurDCF) : "—"}</div>
                </div>
                <InputField label={t("poids")} value={poidsDCF} onChange={(v) => setPoidsDCF(Number(v))} suffix="%" min={0} max={100} className="w-24" />
              </div>
            </div>
          </div>

          {/* Paramètres scénarios */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("recScenarios")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label={t("recScenarioHaut")} value={scenarioHautPct} onChange={(v) => setScenarioHautPct(Number(v))} suffix="%" min={1} max={30} hint={t("recScenarioHautHint")} />
              <InputField label={t("recScenarioBas")} value={scenarioBasPct} onChange={(v) => setScenarioBasPct(Number(v))} suffix="%" min={1} max={30} hint={t("recScenarioBasHint")} />
            </div>
            <p className="mt-2 text-xs text-muted">{t("recScenarioNote")}</p>
          </div>
        </div>

        {/* Résultat base */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-gold/40 bg-gradient-to-br from-card to-gold/5 p-8 shadow-sm text-center">
            <div className="text-sm text-muted uppercase tracking-wider">{t("recValeurReconciliee")}</div>
            <div className="mt-2 text-4xl font-bold text-navy">{formatEUR(resultBase.valeurReconciliee)}</div>
            <div className="mt-2 text-sm text-muted">{t("recScenarioCentral")}</div>
          </div>

          <ResultPanel
            title={t("recControleQualite")}
            lines={[
              { label: t("recEcartMaxMethodes"), value: `${resultBase.ecartMaxPct.toFixed(1)}%`, warning: resultBase.ecartMaxPct > 20 },
              { label: t("recEcartType"), value: formatEUR(resultBase.ecartType), sub: true },
              ...(resultBase.ecartMaxPct > 20 ? [{ label: t("recAlerte"), value: t("recAlerteEcart"), warning: true }] : []),
            ]}
          />
        </div>
      </div>

      {/* Tableau comparatif 3 scénarios */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy"></th>
              <th className="px-4 py-3 text-center font-semibold text-error">{t("recScenarioBasCol", { pct: scenarioBasPct })}</th>
              <th className="px-4 py-3 text-center font-semibold text-navy bg-navy/5">{t("recScenarioCentralCol")}</th>
              <th className="px-4 py-3 text-center font-semibold text-success">{t("recScenarioHautCol", { pct: scenarioHautPct })}</th>
            </tr>
          </thead>
          <tbody>
            {valeurComparaison > 0 && (
              <tr className="border-b border-card-border/50">
                <td className="px-4 py-2 text-muted">{t("tabComparaison")}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurComparaison * (1 - scenarioBasPct / 100))}</td>
                <td className="px-4 py-2 text-center font-mono bg-navy/5 font-semibold">{formatEUR(valeurComparaison)}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurComparaison * (1 + scenarioHautPct / 100))}</td>
              </tr>
            )}
            {valeurCapitalisation > 0 && (
              <tr className="border-b border-card-border/50">
                <td className="px-4 py-2 text-muted">{t("tabCapitalisation")}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurCapitalisation * (1 - scenarioBasPct / 100))}</td>
                <td className="px-4 py-2 text-center font-mono bg-navy/5 font-semibold">{formatEUR(valeurCapitalisation)}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurCapitalisation * (1 + scenarioHautPct / 100))}</td>
              </tr>
            )}
            {valeurDCF > 0 && (
              <tr className="border-b border-card-border/50">
                <td className="px-4 py-2 text-muted">DCF</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurDCF * (1 - scenarioBasPct / 100))}</td>
                <td className="px-4 py-2 text-center font-mono bg-navy/5 font-semibold">{formatEUR(valeurDCF)}</td>
                <td className="px-4 py-2 text-center font-mono">{formatEUR(valeurDCF * (1 + scenarioHautPct / 100))}</td>
              </tr>
            )}
            <tr className="bg-background font-semibold">
              <td className="px-4 py-3 text-navy">{t("recValeurReconciliee")}</td>
              <td className="px-4 py-3 text-center font-mono text-error text-lg">{formatEUR(resultBas.valeurReconciliee)}</td>
              <td className="px-4 py-3 text-center font-mono text-navy text-lg bg-navy/5">{formatEUR(resultBase.valeurReconciliee)}</td>
              <td className="px-4 py-3 text-center font-mono text-success text-lg">{formatEUR(resultHaut.valeurReconciliee)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          {t("recScenariosNote")}
        </p>
      </div>

      {/* Tornado / Sensitivity chart */}
      {resultBase.valeurReconciliee > 0 && (() => {
        const base = resultBase.valeurReconciliee;

        // Build sensitivity items based on available methods
        const items: { label: string; description: string; impactPos: number; impactNeg: number }[] = [];

        // ERV +/- 10% => ~10% impact on all methods (weighted by their contribution)
        items.push({
          label: t("sensERV"),
          description: t("sensERVDesc"),
          impactPos: base * 0.10,
          impactNeg: -base * 0.10,
        });

        // Cap rate +/- 50bps => ~10% on capitalisation value (weighted)
        if (valeurCapitalisation > 0) {
          const capWeight = poidsCap / (poidsComp + poidsCap + poidsDCF || 1);
          const capImpact = valeurCapitalisation * 0.10 * capWeight;
          items.push({
            label: t("sensTauxCap"),
            description: t("sensTauxCapDesc"),
            impactPos: capImpact,
            impactNeg: -capImpact,
          });
        }

        // Discount rate +/- 50bps => ~5% on DCF value (weighted)
        if (valeurDCF > 0) {
          const dcfWeight = poidsDCF / (poidsComp + poidsCap + poidsDCF || 1);
          const dcfImpact = valeurDCF * 0.05 * dcfWeight;
          items.push({
            label: t("sensTauxActu"),
            description: t("sensTauxActuDesc"),
            impactPos: dcfImpact,
            impactNeg: -dcfImpact,
          });
        }

        // Vacancy +/- 200bps => ~3% on income methods (capitalisation + DCF weighted)
        {
          const incomeWeight = ((valeurCapitalisation > 0 ? poidsCap : 0) + (valeurDCF > 0 ? poidsDCF : 0))
            / (poidsComp + poidsCap + poidsDCF || 1);
          if (incomeWeight > 0) {
            const vacImpact = base * 0.03 * incomeWeight;
            items.push({
              label: t("sensVacance"),
              description: t("sensVacanceDesc"),
              impactPos: vacImpact,
              impactNeg: -vacImpact,
            });
          }
        }

        // Sort by absolute impact (largest first)
        items.sort((a, b) => Math.abs(b.impactPos) - Math.abs(a.impactPos));

        const maxAbsImpact = Math.max(...items.map((it) => Math.max(Math.abs(it.impactPos), Math.abs(it.impactNeg))));

        return (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-1">{t("sensTitle")}</h3>
            <p className="text-xs text-muted mb-6">
              {t("sensSubtitle", { base: formatEUR(base) })}
            </p>
            <div className="space-y-4">
              {items.map((item) => {
                const pctNeg = maxAbsImpact > 0 ? (Math.abs(item.impactNeg) / maxAbsImpact) * 100 : 0;
                const pctPos = maxAbsImpact > 0 ? (Math.abs(item.impactPos) / maxAbsImpact) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-navy">{item.label}</span>
                        <span className="ml-2 text-xs text-muted hidden sm:inline">{item.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 h-7">
                      {/* Negative (left side) */}
                      <div className="flex-1 flex justify-end">
                        <div className="text-xs font-mono text-error mr-2 whitespace-nowrap min-w-[90px] text-right">
                          {formatEUR(item.impactNeg)}
                        </div>
                        <div className="relative w-full max-w-[200px] flex justify-end">
                          <div
                            className="h-6 rounded-l bg-error/70 transition-all"
                            style={{ width: `${pctNeg}%`, minWidth: pctNeg > 0 ? "4px" : "0px" }}
                          />
                        </div>
                      </div>
                      {/* Center line */}
                      <div className="w-px h-7 bg-navy/30 flex-shrink-0" />
                      {/* Positive (right side) */}
                      <div className="flex-1 flex justify-start">
                        <div className="relative w-full max-w-[200px] flex justify-start">
                          <div
                            className="h-6 rounded-r bg-success/70 transition-all"
                            style={{ width: `${pctPos}%`, minWidth: pctPos > 0 ? "4px" : "0px" }}
                          />
                        </div>
                        <div className="text-xs font-mono text-success ml-2 whitespace-nowrap min-w-[90px]">
                          +{formatEUR(item.impactPos)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-card-border/50">
              <p className="text-xs text-muted leading-relaxed">
                {t("sensFootnote")}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Texte narratif */}
      {(valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-4">{t("recAnalyseNarrative")}</h3>
          <div className="prose prose-sm text-slate leading-relaxed space-y-3">
            {genererNarrative({
              commune: selectedCommune?.commune,
              assetType,
              evsType: evsInfo.label,
              surface: surfaceBien,
              valeurComparaison: valeurComparaison || undefined,
              valeurCapitalisation: valeurCapitalisation || undefined,
              valeurDCF: valeurDCF || undefined,
              valeurReconciliee: resultBase.valeurReconciliee || undefined,
              prixM2Commune: selectedCommune?.prixM2Existant || undefined,
              nbTransactions: selectedCommune?.nbTransactions || undefined,
            }, t).split("\n\n").map((para, i) => (
              <p key={i} className="text-sm">{para.split(/\*\*(.+?)\*\*/g).map((seg, j) => j % 2 === 1 ? <strong key={j}>{seg}</strong> : seg)}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function Valorisation() {
  const t = useTranslations("valorisation");
  const [viewMode, setViewMode] = useState<"calculateur" | "rapport">("calculateur");
  const [activeTab, setActiveTab] = useState<ActiveTab>("comparaison");
  const [surfaceBien, setSurfaceBien] = useState(80);
  const [assetType, setAssetType] = useState<AssetType>("residential_apartment");
  const [evsValueType, setEvsValueType] = useState<EVSValueType>("market_value");

  // Recherche commune — état global (persiste entre onglets)
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);
  const selectedCommune = selectedResult?.commune ?? null;

  // Comparables — état global (persiste entre onglets)
  const [comparables, setComparables] = useState<Comparable[]>([]);

  const assetConfig = useMemo(() => getAssetTypeConfig(assetType), [assetType]);
  const evsInfo = useMemo(() => EVS_VALUE_TYPES.find((e) => e.id === evsValueType)!, [evsValueType]);

  // Valeurs remontées par chaque onglet
  const [valeurComparaison, setValeurComparaison] = useState(0);
  const [valeurCapitalisation, setValeurCapitalisation] = useState(0);
  const [valeurDCF, setValeurDCF] = useState(0);

  // Stable callback refs
  const onValeurComp = useCallback((v: number) => setValeurComparaison(v), []);
  const onValeurCap = useCallback((v: number) => setValeurCapitalisation(v), []);
  const onValeurDCF = useCallback((v: number) => setValeurDCF(v), []);

  // Valeur de marché pour MLV (prend la réconciliée ou la meilleure dispo)
  const valeurMarchePourMLV = valeurComparaison || valeurCapitalisation || valeurDCF || 750000;

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
    setCommuneSearch("");
    setSelectedResult(null);
    setComparables([]);
    setValeurComparaison(0);
    setValeurCapitalisation(0);
    setValeurDCF(0);
  }, []);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              {t("pageTitle")}
            </h1>
            <span className="rounded-full bg-navy/10 px-3 py-0.5 text-xs font-semibold text-navy">
              EVS 2025
            </span>
          </div>
          <p className="mt-2 text-muted">
            {t("pageSubtitle")}
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
            onClick={() => setViewMode("rapport")}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === "rapport"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {t("modeRapportEVS")}
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

          {/* EVS value type + asset context */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <InputField
                label={t("baseDeValeur")}
                type="select"
                value={evsValueType}
                onChange={(v) => setEvsValueType(v as EVSValueType)}
                options={EVS_VALUE_TYPES.map((e) => ({ value: e.id, label: `${e.evs} — ${t(e.labelKey)}` }))}
              />
              <p className="mt-2 text-xs text-muted leading-relaxed">{t(evsInfo.descriptionKey)}</p>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <InputField
                label={t("surfaceDuBien")}
                value={surfaceBien}
                onChange={(v) => setSurfaceBien(Number(v))}
                suffix="m²"
              />
              <div className="mt-3 text-xs text-muted">
                <div className="font-medium text-slate mb-1">{t("methodesRecommandees")} :</div>
                {assetConfig.recommendedMethodKeys.map((mk, i) => (
                  <div key={i}>• {t(mk)}</div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-slate mb-2">{t("parametresReference")} — {t(assetConfig.labelKey)}</div>
              <div className="space-y-1 text-xs text-muted">
                <div className="flex justify-between"><span>{t("tauxDeCapitalisation")}</span><span className="font-mono">{assetConfig.defaults.capRateMin}–{assetConfig.defaults.capRateMax}%</span></div>
                <div className="flex justify-between"><span>{t("tauxDeVacance")}</span><span className="font-mono">{assetConfig.defaults.vacancyRate}%</span></div>
                <div className="flex justify-between"><span>{t("tauxActualisation")}</span><span className="font-mono">{assetConfig.defaults.discountRateDefault}%</span></div>
                <div className="flex justify-between"><span>{t("tauxSortieRevente")}</span><span className="font-mono">{assetConfig.defaults.exitCapDefault}%</span></div>
                <div className="flex justify-between"><span>{t("decotesMLV")}</span><span className="font-mono">{assetConfig.defaults.mlvConjoncturelleDefault + assetConfig.defaults.mlvCommercialisationDefault + assetConfig.defaults.mlvSpecifiqueDefault}%</span></div>
              </div>
              {assetConfig.specificMetricKeys.length > 0 && (
                <div className="mt-2 pt-2 border-t border-card-border text-xs text-muted">
                  <span className="font-medium text-slate">{t("metriquesCles")} : </span>
                  {assetConfig.specificMetricKeys.map((mk) => t(mk)).join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Asset type notes */}
          <div className="rounded-lg bg-navy/5 border border-navy/10 px-4 py-3">
            <p className="text-xs text-slate leading-relaxed">{t(assetConfig.notesKey)}</p>
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
            {(valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (<>
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `${t("pageTitle")} — ${selectedCommune?.commune || "?"} — ${surfaceBien} m²`,
                    type: "valorisation",
                    commune: selectedCommune?.commune,
                    valeurPrincipale: valeurComparaison || valeurCapitalisation || valeurDCF,
                    data: { surfaceBien, assetType, evsValueType, commune: selectedCommune?.commune, valeurComparaison, valeurCapitalisation, valeurDCF },
                  });
                }}
                label={t("sauvegarder")}
                successLabel={t("sauvegarde")}
              />
              <PdfButton
                generateBlob={() => {
                  const demo = selectedCommune ? getDemographics(selectedCommune.commune) : undefined;
                  const prof = getProfile();
                  return generateReportBlob({
                    dateRapport: new Date().toISOString().split("T")[0],
                    commune: selectedCommune?.commune,
                    assetType: t(assetConfig.labelKey),
                    evsType: t(evsInfo.labelKey),
                    surface: surfaceBien,
                    valeurComparaison: valeurComparaison || undefined,
                    valeurCapitalisation: valeurCapitalisation || undefined,
                    valeurDCF: valeurDCF || undefined,
                    prixM2Commune: selectedCommune?.prixM2Existant,
                    transactionsCommune: selectedCommune?.nbTransactions || undefined,
                    comparables: comparables.filter(c => c.prixVente > 0).map(c => ({
                      adresse: c.adresse,
                      prixVente: c.prixVente,
                      surface: c.surface,
                      prixM2: c.surface > 0 ? Math.round(c.prixVente / c.surface) : 0,
                      ajustement: Math.round(((c.localisation || 0) + (c.etat || 0) + (c.etageVue || 0) + (c.exterieur || 0) + (c.parking || 0) + (c.dateIndexation || 0) + (c.autre || 0)) * 10) / 10,
                      prixAjuste: c.surface > 0 ? Math.round((c.prixVente / c.surface) * (1 + ((c.localisation || 0) + (c.etat || 0) + (c.etageVue || 0) + (c.exterieur || 0) + (c.parking || 0) + (c.dateIndexation || 0) + (c.autre || 0)) / 100)) : 0,
                    })),
                    demographicsCommune: demo ? {
                      population: demo.population,
                      croissancePct: demo.croissancePct,
                      revenuMedian: demo.revenuMedian,
                      tauxChomage: demo.tauxChomage,
                      pctEtrangers: demo.pctEtrangers,
                      densiteHabKm2: demo.densiteHabKm2,
                      canton: demo.canton,
                    } : undefined,
                    tauxHypothecaire: getLatestValue(TAUX_HYPOTHECAIRE),
                    oat10y: getLatestValue(OAT_10Y),
                    indiceConstruction: getLatestValue(INDICE_CONSTRUCTION),
                    fourchetteBas: valeurComparaison ? Math.round(valeurComparaison * 0.92) : undefined,
                    fourchetteHaut: valeurComparaison ? Math.round(valeurComparaison * 1.08) : undefined,
                    classeEnergie: undefined,
                    expertNom: prof.nomComplet || undefined,
                    expertSociete: prof.societe || undefined,
                    expertQualifications: prof.qualifications || undefined,
                    logoUrl: prof.logoUrl || undefined,
                  });
                }}
                filename={`tevaxia-rapport-${new Date().toISOString().split("T")[0]}.pdf`}
                label="PDF"
              />
              <button
                onClick={() => downloadDocxReport({
                  dateRapport: new Date().toISOString().split("T")[0],
                  commune: selectedCommune?.commune,
                  assetType: t(assetConfig.labelKey),
                  evsType: t(evsInfo.labelKey),
                  surface: surfaceBien,
                  valeurComparaison: valeurComparaison || undefined,
                  valeurCapitalisation: valeurCapitalisation || undefined,
                  valeurDCF: valeurDCF || undefined,
                })}
                className="rounded-lg border border-gold px-3 py-2 text-xs font-medium text-gold-dark hover:bg-gold/10 transition-colors"
              >
                DOCX
              </button>
            </>)}
            {(selectedCommune || comparables.length > 0 || valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0) && (
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
        {viewMode === "calculateur" && (<>
        {/* Checklist EVS */}
        {(() => {
          const check = evaluerChecklist({
            communeSelectionnee: !!selectedCommune,
            surfaceRenseignee: surfaceBien > 0,
            assetTypeSelectionne: true,
            evsTypeSelectionne: true,
            comparaisonFaite: valeurComparaison > 0,
            nbComparables: comparables.length,
            capitalisationFaite: valeurCapitalisation > 0,
            dcfFait: valeurDCF > 0,
            esgEvalue: false,
            classeEnergieRenseignee: false,
            donnesMarcheConsultees: !!selectedCommune,
            reconciliationFaite: valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0,
            scenariosAnalyses: false,
            narrativeGeneree: valeurComparaison > 0 || valeurCapitalisation > 0 || valeurDCF > 0,
            mlvCalculee: false,
          });
          const score = scoreChecklist(check);
          if (score.remplis === 0) return null;
          return (
            <div className="mb-4 rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-navy">{t("conformiteEVS")}</div>
                <div className={`text-xs font-bold ${score.pctCompletion >= 80 ? "text-success" : score.pctCompletion >= 50 ? "text-warning" : "text-error"}`}>
                  {score.remplis}/{score.total} ({score.pctCompletion.toFixed(0)}%)
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${score.pctCompletion >= 80 ? "bg-success" : score.pctCompletion >= 50 ? "bg-warning" : "bg-error"}`}
                  style={{ width: `${score.pctCompletion}%` }}
                />
              </div>
              {score.obligatoiresManquants.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {score.obligatoiresManquants.map((item) => (
                    <span key={item.id} className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-700">{t(item.labelKey)}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="sticky top-16 z-30 mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        {activeTab === "comparaison" && (
          <TabComparaison
            surfaceBien={surfaceBien}
            onValeur={onValeurComp}
            assetType={assetType}
            communeSearch={communeSearch}
            setCommuneSearch={setCommuneSearch}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            searchResults={searchResults}
            selectedCommune={selectedCommune}
            comparables={comparables}
            setComparables={setComparables}
          />
        )}
        {activeTab === "capitalisation" && <TabCapitalisation onValeur={onValeurCap} />}
        {activeTab === "terme_reversion" && <TabTermeReversion onValeur={onValeurCap} />}
        {activeTab === "dcf" && <TabDCF onValeur={onValeurDCF} />}
        {activeTab === "esg" && <TabESG />}
        {activeTab === "energie" && <TabEnergie valeurMarcheCible={valeurMarchePourMLV} surfaceBien={surfaceBien} />}
        {activeTab === "mlv" && <TabMLV valeurMarche={valeurMarchePourMLV} />}
        {activeTab === "reconciliation" && (
          <TabReconciliation
            valeurComparaison={valeurComparaison}
            valeurCapitalisation={valeurCapitalisation}
            valeurDCF={valeurDCF}
            selectedCommune={selectedCommune}
            assetType={t(assetConfig.labelKey)}
            evsInfo={{ label: t(evsInfo.labelKey) }}
            surfaceBien={surfaceBien}
          />
        )}
        </>)}

        {/* MODE RAPPORT EVS */}
        {viewMode === "rapport" && (
          <ReportModeEVS
            surfaceBien={surfaceBien}
            assetType={t(assetConfig.labelKey)}
            evsValueType={evsValueType}
            selectedCommune={selectedCommune}
            valeurComparaison={valeurComparaison}
            valeurCapitalisation={valeurCapitalisation}
            valeurDCF={valeurDCF}
            valeurMarchePourMLV={valeurMarchePourMLV}
          />
        )}
      </div>

    </div>
  );
}
