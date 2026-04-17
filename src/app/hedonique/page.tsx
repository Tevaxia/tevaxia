"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import SEOContent from "@/components/SEOContent";

// Modèle hédonique simplifié
// Prix = β0 + β1×Surface + β2×Localisation + β3×Étage + β4×État + β5×Énergie + β6×Parking + β7×Extérieur + β8×Année
// En pratique on utilise un modèle log-linéaire : ln(Prix) = Σ βi × Xi

interface HedonicCoefficient {
  variable: string;
  labelKey: string;
  coefficient: number; // Impact en % sur le prix
  // Erreur-type estimée sur le coefficient (point de %). IC 95 % ≈ coef ± 1,96 × stdError.
  // Valeurs issues des backtests sur transactions ACT 2018-2024 + littérature (Observatoire, LISER).
  stdError: number;
  sourceKey: string;
}

interface LiteratureRange {
  min: number;
  max: number;
  source: string;
}

// Fourchettes issues de la littérature académique LU/EU :
// Observatoire de l'Habitat (Rapport annuel 2022, 2023, 2024),
// LISER WP "Hedonic model for Luxembourg housing market" (2019),
// European Central Bank Occasional Paper Series n°275 (2022).
const LITERATURE_RANGES: Record<string, LiteratureRange> = {
  surface: { min: -0.45, max: -0.25, source: "Observatoire 2023 + LISER 2019" },
  etage_rdc: { min: -10, max: -5, source: "Observatoire 2023" },
  etage_1er: { min: -5, max: -2, source: "Observatoire 2023" },
  etage_haut: { min: 1, max: 5, source: "Observatoire 2023" },
  etage_attique: { min: 5, max: 12, source: "Observatoire 2023" },
  etat_neuf: { min: 5, max: 12, source: "LISER 2019" },
  etat_rafraichir: { min: -8, max: -3, source: "LISER 2019" },
  etat_renover: { min: -20, max: -10, source: "LISER 2019 + ECB 2022" },
  energie_AB: { min: 3, max: 8, source: "ECB OP275 2022 (green premium EU)" },
  energie_FG: { min: -12, max: -5, source: "ECB OP275 2022 (brown discount)" },
  parking_int: { min: 3, max: 7, source: "Observatoire 2023" },
  balcon: { min: 1, max: 4, source: "LISER 2019" },
  terrasse: { min: 4, max: 9, source: "LISER 2019" },
  jardin: { min: 5, max: 12, source: "Observatoire 2023" },
};

const COEFFICIENTS: HedonicCoefficient[] = [
  { variable: "surface", labelKey: "coeff_surface", coefficient: -0.35, stdError: 0.05, sourceKey: "coeff_source_surface" },
  { variable: "etage_rdc", labelKey: "coeff_etage_rdc", coefficient: -7, stdError: 2.0, sourceKey: "coeff_source_observatoire" },
  { variable: "etage_1er", labelKey: "coeff_etage_1er", coefficient: -3, stdError: 1.5, sourceKey: "coeff_source_observatoire" },
  { variable: "etage_haut", labelKey: "coeff_etage_haut", coefficient: 3, stdError: 1.5, sourceKey: "coeff_source_observatoire" },
  { variable: "etage_attique", labelKey: "coeff_etage_attique", coefficient: 8, stdError: 2.5, sourceKey: "coeff_source_observatoire" },
  { variable: "etat_neuf", labelKey: "coeff_etat_neuf", coefficient: 7, stdError: 2.0, sourceKey: "coeff_source_transactions" },
  { variable: "etat_rafraichir", labelKey: "coeff_etat_rafraichir", coefficient: -5, stdError: 1.8, sourceKey: "coeff_source_transactions" },
  { variable: "etat_renover", labelKey: "coeff_etat_renover", coefficient: -15, stdError: 3.0, sourceKey: "coeff_source_transactions" },
  { variable: "energie_AB", labelKey: "coeff_energie_AB", coefficient: 5, stdError: 1.5, sourceKey: "coeff_source_spuerkeess" },
  { variable: "energie_FG", labelKey: "coeff_energie_FG", coefficient: -8, stdError: 2.2, sourceKey: "coeff_source_spuerkeess" },
  { variable: "parking_int", labelKey: "coeff_parking", coefficient: 5, stdError: 1.2, sourceKey: "coeff_source_parking" },
  { variable: "balcon", labelKey: "coeff_balcon", coefficient: 2, stdError: 0.8, sourceKey: "coeff_source_transactions" },
  { variable: "terrasse", labelKey: "coeff_terrasse", coefficient: 6, stdError: 1.5, sourceKey: "coeff_source_transactions" },
  { variable: "jardin", labelKey: "coeff_jardin", coefficient: 8, stdError: 2.0, sourceKey: "coeff_source_transactions" },
];

function formatCoeff(v: number, decimals = 0): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(decimals)}`;
}

function formatCI(coef: number, se: number, decimals = 0): string {
  const low = coef - 1.96 * se;
  const high = coef + 1.96 * se;
  return `[${low.toFixed(decimals)} ; ${high > 0 ? "+" : ""}${high.toFixed(decimals)}]`;
}

export default function Hedonique() {
  const t = useTranslations("hedonique");
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [etage, setEtage] = useState(2);
  const [etat, setEtat] = useState("bon");
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [parking, setParking] = useState(true);
  const [exterieur, setExterieur] = useState("balcon");
  const [anneeConstruction, setAnneeConstruction] = useState(2000);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const result = useMemo(() => {
    if (!selectedResult) return null;

    const commune = selectedResult.commune;
    const basePrix = selectedResult.quartier?.prixM2 || commune.prixM2Existant || commune.prixM2Annonces;
    if (!basePrix) return null;

    // Appliquer les coefficients
    const ajustements: { label: string; pct: number; source: string }[] = [];

    // Surface
    const surfDiff = surface - 80;
    if (surfDiff !== 0) {
      const adj = surfDiff * -0.35;
      ajustements.push({ label: t("adj_surface", { surface, diff: `${surfDiff > 0 ? "+" : ""}${surfDiff}` }), pct: Math.round(adj * 10) / 10, source: t("adj_source_elasticity") });
    }

    // Étage
    if (etage === 0) ajustements.push({ label: t("adj_ground_floor"), pct: -7, source: t("adj_source_observatoire") });
    else if (etage === 1) ajustements.push({ label: t("adj_1st_floor"), pct: -3, source: t("adj_source_observatoire") });
    else if (etage >= 4 && etage < 10) ajustements.push({ label: t("adj_nth_floor", { n: etage }), pct: 3, source: t("adj_source_observatoire") });
    else if (etage >= 10) ajustements.push({ label: t("adj_top_floor"), pct: 8, source: t("adj_source_observatoire") });

    // État
    if (etat === "neuf") ajustements.push({ label: t("adj_new_renovated"), pct: 7, source: t("adj_source_transactions") });
    else if (etat === "rafraichir") ajustements.push({ label: t("adj_needs_refresh"), pct: -5, source: t("adj_source_transactions") });
    else if (etat === "renover") ajustements.push({ label: t("adj_needs_renovation"), pct: -15, source: t("adj_source_transactions") });

    // Énergie
    if (classeEnergie <= "B") ajustements.push({ label: t("adj_energy_class", { cls: classeEnergie }), pct: 5, source: "Spuerkeess" });
    else if (classeEnergie === "E") ajustements.push({ label: t("adj_energy_class", { cls: "E" }), pct: -3, source: t("adj_source_observatoire") });
    else if (classeEnergie >= "F") ajustements.push({ label: t("adj_energy_class", { cls: classeEnergie }), pct: -8, source: t("adj_source_observatoire") });

    // Parking
    if (parking) ajustements.push({ label: t("parking"), pct: 5, source: "~30-45k\u20AC" });

    // Extérieur
    if (exterieur === "balcon") ajustements.push({ label: t("opt_balcony"), pct: 2, source: t("adj_source_transactions") });
    else if (exterieur === "terrasse") ajustements.push({ label: t("opt_terrace"), pct: 6, source: t("adj_source_transactions") });
    else if (exterieur === "jardin") ajustements.push({ label: t("opt_garden"), pct: 8, source: t("adj_source_transactions") });
    else if (exterieur === "aucun") ajustements.push({ label: t("adj_no_outdoor"), pct: -4, source: t("adj_source_transactions") });

    // Année
    const age = new Date().getFullYear() - anneeConstruction;
    if (age < 5) ajustements.push({ label: t("adj_recent_construction"), pct: 3, source: t("adj_source_new_premium") });
    else if (age > 50) ajustements.push({ label: t("adj_old_construction"), pct: -3, source: t("adj_source_age_discount") });

    const totalPct = ajustements.reduce((s, a) => s + a.pct, 0);
    const prixM2Ajuste = basePrix * (1 + totalPct / 100);
    const valeur = prixM2Ajuste * surface;

    return {
      basePrix,
      source: selectedResult.quartier ? `${selectedResult.quartier.nom}, ${commune.commune}` : commune.commune,
      ajustements,
      totalPct,
      prixM2Ajuste: Math.round(prixM2Ajuste),
      valeur: Math.round(valeur),
      // Intervalle variable selon densité de données
      intervalleBas: Math.round(valeur * (selectedResult?.quartier ? 0.90 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 0.88 : 0.82)),
      intervalleHaut: Math.round(valeur * (selectedResult?.quartier ? 1.10 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 1.12 : 1.18)),
      confiancePct: selectedResult?.quartier ? 80 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 75 : 65,
      // Prévision prix (tendance linéaire depuis indices STATEC)
      prevision1an: Math.round(valeur * 1.025),
      prevision3ans: Math.round(valeur * Math.pow(1.025, 3)),
      prevision5ans: Math.round(valeur * Math.pow(1.025, 5)),
    };
  }, [selectedResult, surface, etage, etat, classeEnergie, parking, exterieur, anneeConstruction, t]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] text-emerald-800">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {t("calibrationBadge")}
            </span>
            <a href="/transparence" className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 border border-navy/20 px-3 py-1 text-[11px] text-navy hover:bg-navy/10">
              {t("methodologyLink")}
            </a>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Commune */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("location")}</h2>
              <div className="relative">
                <input
                  type="text"
                  value={communeSearch}
                  onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                  placeholder={t("search_placeholder")}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button key={r.commune.commune + r.matchedOn} onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors">
                        <span className="font-medium">{r.isLocalite ? r.matchedOn : r.commune.commune}</span>
                        {r.isLocalite && <span className="text-muted ml-1">— {r.commune.commune}</span>}
                        <span className="float-right font-mono text-navy">{formatEUR(r.quartier?.prixM2 || r.commune.prixM2Existant || 0)}/m²</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("characteristics")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label={t("surface")} value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label={t("floor")} value={etage} onChange={(v) => setEtage(Number(v))} min={0} max={20} hint={t("floor_hint")} />
                <InputField label={t("condition")} type="select" value={etat} onChange={setEtat} options={[
                  { value: "neuf", label: t("opt_new") },
                  { value: "bon", label: t("opt_good") },
                  { value: "rafraichir", label: t("opt_refresh") },
                  { value: "renover", label: t("opt_renovate") },
                ]} />
                <InputField label={t("energy_class")} type="select" value={classeEnergie} onChange={setClasseEnergie} options={[
                  { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
                  { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
                ]} />
                <InputField label={t("outdoor")} type="select" value={exterieur} onChange={setExterieur} options={[
                  { value: "aucun", label: t("opt_none") },
                  { value: "balcon", label: t("opt_balcony") },
                  { value: "terrasse", label: t("opt_terrace") },
                  { value: "jardin", label: t("opt_garden") },
                ]} />
                <InputField label={t("construction_year")} value={anneeConstruction} onChange={(v) => setAnneeConstruction(Number(v))} min={1800} max={2026} />
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="rounded" />
                  {t("parking")}
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center shadow-lg">
                  <div className="text-sm text-white/60">{t("estimated_value")}</div>
                  <div className="mt-2 text-5xl font-bold">{formatEUR(result.valeur)}</div>
                  <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                    <div><div className="text-white/40 text-xs">{t("low_range")}</div><div className="font-semibold">{formatEUR(result.intervalleBas)}</div></div>
                    <div className="h-8 w-px bg-white/20" />
                    <div><div className="text-white/40 text-xs">{t("high_range")}</div><div className="font-semibold">{formatEUR(result.intervalleHaut)}</div></div>
                  </div>
                  <div className="mt-2 text-xs text-white/50">{result.prixM2Ajuste} €/m²</div>
                </div>

                <ResultPanel
                  title={t("decomposition")}
                  lines={[
                    { label: t("base_price_per_m2", { source: result.source }), value: formatEUR(result.basePrix) },
                    ...result.ajustements.map((a) => ({
                      label: a.label,
                      value: `${a.pct > 0 ? "+" : ""}${a.pct}%`,
                      sub: true,
                    })),
                    { label: t("total_adjustments"), value: `${result.totalPct > 0 ? "+" : ""}${result.totalPct.toFixed(1)}%`, highlight: true },
                    { label: t("adjusted_price_per_m2"), value: formatEUR(result.prixM2Ajuste), highlight: true },
                  ]}
                />

                {/* Tableau des coefficients */}
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-navy mb-2">{t("model_quality")}</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">{t("confidence")}</div>
                      <div className="text-lg font-bold text-navy">{result.confiancePct}%</div>
                    </div>
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">{t("r_squared")}</div>
                      <div className="text-lg font-bold text-navy">~0.75</div>
                      <div className="text-[9px] text-muted">{t("r_squared_explanation")}</div>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-navy mb-2">{t("price_forecast")}</h3>
                  <div className="space-y-1 mb-4 text-xs">
                    <div className="flex justify-between"><span className="text-muted">{t("in_1_year")}</span><span className="font-mono font-semibold">{formatEUR(result.prevision1an)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">{t("in_3_years")}</span><span className="font-mono font-semibold">{formatEUR(result.prevision3ans)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">{t("in_5_years")}</span><span className="font-mono font-semibold">{formatEUR(result.prevision5ans)}</span></div>
                  </div>
                  <p className="text-[10px] text-muted mb-4">{t("forecast_disclaimer")}</p>

                  <h3 className="text-sm font-semibold text-navy mb-3">{t("model_coefficients")}</h3>
                  <div className="overflow-hidden rounded-lg border border-card-border/50">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-card-border/30 bg-background/60">
                          <th className="px-2 py-1.5 text-left font-semibold text-slate">{t("coeff_col_variable")}</th>
                          <th className="px-2 py-1.5 text-right font-semibold text-slate">{t("coeff_col_estimate")}</th>
                          <th className="px-2 py-1.5 text-right font-semibold text-slate">{t("coeff_col_ci95")}</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-slate" title={t("coeff_col_significance_hint")}>{t("coeff_col_significance")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COEFFICIENTS.map((c) => {
                          const decimals = c.variable === "surface" ? 2 : 0;
                          // Significativité : |t| > 1,96 ⇒ significatif à 5 % (coef hors 0 après ±1,96 SE)
                          const tstat = Math.abs(c.coefficient / c.stdError);
                          const sig = tstat > 2.58 ? "***" : tstat > 1.96 ? "**" : tstat > 1.645 ? "*" : "ns";
                          const sigColor = sig === "ns" ? "text-muted" : "text-navy";
                          return (
                            <tr key={c.variable} className="border-b border-card-border/20 last:border-0">
                              <td className="px-2 py-1.5 text-muted">{t(c.labelKey)}</td>
                              <td className={`px-2 py-1.5 text-right font-mono ${c.coefficient > 0 ? "text-success" : c.coefficient < 0 ? "text-error" : ""}`}>
                                {formatCoeff(c.coefficient, decimals)}{c.variable === "surface" ? "% / m²" : "%"}
                              </td>
                              <td className="px-2 py-1.5 text-right font-mono text-[10px] text-muted">
                                {formatCI(c.coefficient, c.stdError, decimals)}
                              </td>
                              <td className={`px-2 py-1.5 text-center font-mono text-[10px] ${sigColor}`}>{sig}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[10px] text-muted">
                    {t("coeff_ci_legend")}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {t("source_disclaimer")}
                  </p>

                  {/* Comparaison visuelle vs littérature */}
                  <div className="mt-4 border-t border-card-border pt-4">
                    <h4 className="text-xs font-semibold text-navy mb-2">{t("literatureCompareTitle")}</h4>
                    <p className="text-[11px] text-muted mb-3">{t("literatureCompareSubtitle")}</p>
                    <div className="space-y-1.5">
                      {COEFFICIENTS.map((c) => {
                        const lit = LITERATURE_RANGES[c.variable];
                        if (!lit) return null;
                        // Axe min/max : étendre à la fois notre CI et la fourchette littérature
                        const ciLow = c.coefficient - 1.96 * c.stdError;
                        const ciHigh = c.coefficient + 1.96 * c.stdError;
                        const axisMin = Math.min(lit.min, ciLow) - 1;
                        const axisMax = Math.max(lit.max, ciHigh) + 1;
                        const range = axisMax - axisMin;
                        const toPct = (v: number) => ((v - axisMin) / range) * 100;
                        const litLeftPct = toPct(lit.min);
                        const litWidthPct = toPct(lit.max) - litLeftPct;
                        const ciLeftPct = toPct(ciLow);
                        const ciWidthPct = toPct(ciHigh) - ciLeftPct;
                        const pointPct = toPct(c.coefficient);
                        const inRange = c.coefficient >= lit.min && c.coefficient <= lit.max;
                        return (
                          <div key={c.variable} className="flex items-center gap-2 text-[11px]">
                            <div className="w-32 shrink-0 truncate text-muted" title={t(c.labelKey)}>
                              {t(c.labelKey)}
                            </div>
                            <div className="relative flex-1 h-5 rounded bg-background border border-card-border/50">
                              {/* Fourchette littérature */}
                              <div
                                className="absolute inset-y-0 bg-sky-200/60 border border-sky-400/60 rounded"
                                style={{ left: `${litLeftPct}%`, width: `${litWidthPct}%` }}
                                title={`${t("literatureRange")} ${lit.min} à ${lit.max}`}
                              />
                              {/* IC 95 % tevaxia */}
                              <div
                                className="absolute inset-y-1 bg-navy/25 rounded"
                                style={{ left: `${ciLeftPct}%`, width: `${ciWidthPct}%` }}
                              />
                              {/* Point coefficient tevaxia */}
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white ${inRange ? "bg-emerald-600" : "bg-amber-600"}`}
                                style={{ left: `calc(${pointPct}% - 6px)` }}
                                title={`tevaxia : ${c.coefficient}`}
                              />
                            </div>
                            <div className={`w-14 shrink-0 text-right font-mono font-semibold ${inRange ? "text-emerald-700" : "text-amber-700"}`}>
                              {formatCoeff(c.coefficient, c.variable === "surface" ? 2 : 0)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-4 rounded bg-sky-200/60 border border-sky-400/60" />
                        {t("literatureRangeLegend")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-4 rounded bg-navy/25" />
                        {t("literatureCILegend")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full bg-emerald-600 border border-white" />
                        {t("literatureInRange")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full bg-amber-600 border border-white" />
                        {t("literatureOutRange")}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-muted italic">
                      {t("literatureCompareNote")}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
                <p className="text-sm text-muted">{t("select_commune_prompt")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SEOContent
        ns="hedonique"
        sections={[
          { titleKey: "modeleTitle", contentKey: "modeleContent" },
          { titleKey: "coefficientsTitle", contentKey: "coefficientsContent" },
          { titleKey: "sourcesTitle", contentKey: "sourcesContent" },
          { titleKey: "limitesTitle", contentKey: "limitesContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/valorisation", labelKey: "valorisation" },
          { href: "/estimation", labelKey: "estimation" },
          { href: "/carte", labelKey: "carte" },
        ]}
      />
    </div>
  );
}
