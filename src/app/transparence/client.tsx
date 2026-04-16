"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { backtestModel, MODEL_COEFFICIENTS } from "@/lib/estimation";
import { formatEUR } from "@/lib/calculations";

export function TransparenceClient() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const backtest = useMemo(() => backtestModel(), []);

  const confColor = (c: string) =>
    c === "Forte" ? "text-emerald-700 bg-emerald-50" :
    c === "Moyenne" ? "text-amber-700 bg-amber-50" :
    "text-rose-700 bg-rose-50";

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Transparence du modèle d&apos;estimation</h1>
        <p className="mt-2 text-sm text-muted">
          Méthodologie, coefficients, sources de données et résultats de back-test. Cette page est publique :
          tout utilisateur peut vérifier la qualité et les limites de notre modèle.
        </p>

        {/* KPIs qualité */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">MAPE</div>
            <div className={`mt-1 text-2xl font-bold ${backtest.mape < 15 ? "text-emerald-700" : backtest.mape < 25 ? "text-amber-700" : "text-rose-700"}`}>
              {backtest.mape.toFixed(1)} %
            </div>
            <div className="mt-0.5 text-[10px] text-muted">Erreur absolue moyenne (%)</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Erreur médiane</div>
            <div className="mt-1 text-2xl font-bold text-navy">{backtest.medianError.toFixed(1)} %</div>
            <div className="mt-0.5 text-[10px] text-muted">50e percentile d&apos;erreur</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">R² approx.</div>
            <div className="mt-1 text-2xl font-bold text-navy">{backtest.r2Approx.toFixed(3)}</div>
            <div className="mt-0.5 text-[10px] text-muted">Coefficient de détermination</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Biens-test</div>
            <div className="mt-1 text-2xl font-bold text-navy">{backtest.samples.length}</div>
            <div className="mt-0.5 text-[10px] text-muted">Échantillon de validation</div>
          </div>
        </div>

        {/* Méthodologie */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">Méthodologie</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <p>
              Le modèle combine un <strong>prix de référence au m²</strong> (par commune ou quartier, issu de
              l&apos;Observatoire de l&apos;Habitat via data.public.lu) avec des <strong>ajustements multiplicatifs</strong> reflétant
              les caractéristiques intrinsèques du bien. Ce n&apos;est <em>pas</em> un AVM (Automated Valuation Model) au sens
              bancaire — il ne dispose pas de l&apos;exhaustivité des actes notariés.
            </p>
            <p>
              L&apos;approche est <strong>log-linéaire</strong> :
            </p>
            <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs">
              Prix = PrixRef/m² × (1 + Σ ajustements %) × Surface
            </div>
            <p>
              Chaque ajustement est un pourcentage additif (positif ou négatif) appliqué au prix de base.
              Les coefficients proviennent de l&apos;Observatoire de l&apos;Habitat, des analyses Spuerkeess et de la pratique
              professionnelle d&apos;évaluation au Luxembourg.
            </p>
          </div>
        </div>

        {/* Sources */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">Sources de données</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Données utilisées</th>
                  <th className="px-3 py-2">Fréquence de MAJ</th>
                  <th className="px-3 py-2">Accès</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                <tr><td className="px-3 py-1.5 font-medium">Observatoire de l&apos;Habitat</td><td className="px-3 py-1.5">Prix/m² par commune, quartiers Lux-Ville, modèle hédonique</td><td className="px-3 py-1.5">Trimestriel</td><td className="px-3 py-1.5 text-blue-700">data.public.lu</td></tr>
                <tr><td className="px-3 py-1.5 font-medium">STATEC</td><td className="px-3 py-1.5">Indices de prix résidentiels annuels, IPC</td><td className="px-3 py-1.5">Annuel</td><td className="px-3 py-1.5 text-blue-700">statistiques.public.lu</td></tr>
                <tr><td className="px-3 py-1.5 font-medium">Spuerkeess</td><td className="px-3 py-1.5">Impact classe énergie sur prix de vente</td><td className="px-3 py-1.5">Annuel</td><td className="px-3 py-1.5 text-blue-700">Publication annuelle</td></tr>
                <tr><td className="px-3 py-1.5 font-medium">Publicité Foncière</td><td className="px-3 py-1.5">Volume transactions par commune (nombre d&apos;actes)</td><td className="px-3 py-1.5">Trimestriel</td><td className="px-3 py-1.5 text-blue-700">Via Observatoire</td></tr>
                <tr><td className="px-3 py-1.5 font-medium">Annonces immobilières</td><td className="px-3 py-1.5">Prix demandés agrégés (loyers, ventes)</td><td className="px-3 py-1.5">Continu</td><td className="px-3 py-1.5 text-blue-700">Via Observatoire</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Coefficients */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">Coefficients d&apos;ajustement ({MODEL_COEFFICIENTS.length} paramètres)</h2>
          <p className="mt-1 text-xs text-muted">
            Chaque coefficient est un pourcentage appliqué au prix de référence au m². Le niveau de confiance
            reflète la robustesse statistique de la source.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">Caractéristique</th>
                  <th className="px-3 py-2 text-right">Coefficient</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Confiance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                {MODEL_COEFFICIENTS.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-medium text-navy">{c.feature}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${c.coefficient.startsWith("+") ? "text-emerald-700" : c.coefficient.startsWith("-") ? "text-rose-700" : "text-navy"}`}>
                      {c.coefficient}
                    </td>
                    <td className="px-3 py-1.5 text-muted">{c.source}</td>
                    <td className="px-3 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${confColor(c.confidence)}`}>
                        {c.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back-test results */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">Résultats du back-test ({backtest.samples.length} biens)</h2>
          <p className="mt-1 text-xs text-muted">
            Comparaison entre le prix réel de référence et l&apos;estimation produite par le modèle.
            Les prix réels sont issus de fourchettes observées sur les communes concernées.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">Commune</th>
                  <th className="px-3 py-2 text-right">Surface</th>
                  <th className="px-3 py-2">Énergie</th>
                  <th className="px-3 py-2 text-right">Prix réel</th>
                  <th className="px-3 py-2 text-right">Estimation</th>
                  <th className="px-3 py-2 text-right">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                {backtest.samples.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-medium text-navy">{s.commune}</td>
                    <td className="px-3 py-1.5 text-right">{s.surface} m²</td>
                    <td className="px-3 py-1.5">{s.classeEnergie}</td>
                    <td className="px-3 py-1.5 text-right">{formatEUR(s.prixReel)}</td>
                    <td className="px-3 py-1.5 text-right">{formatEUR(s.prixEstime)}</td>
                    <td className={`px-3 py-1.5 text-right font-medium ${
                      Math.abs(s.erreurPct) <= 10 ? "text-emerald-700" :
                      Math.abs(s.erreurPct) <= 20 ? "text-amber-700" :
                      "text-rose-700"
                    }`}>
                      {s.erreurPct >= 0 ? "+" : ""}{s.erreurPct.toFixed(1)} %
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-background text-xs font-semibold">
                <tr>
                  <td className="px-3 py-2" colSpan={5}>MAPE (erreur absolue moyenne)</td>
                  <td className="px-3 py-2 text-right">{backtest.mape.toFixed(1)} %</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Limites */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-900">Limites du modèle</h2>
          <ul className="mt-2 space-y-1.5 text-xs text-amber-800">
            <li>Les données de l&apos;Observatoire sont agrégées par commune — la granularité infra-communale (rue, lotissement) n&apos;est pas captée.</li>
            <li>Les biens atypiques (châteaux, immeubles de rapport, maisons d&apos;architecte) ne relèvent pas de ce modèle.</li>
            <li>L&apos;effet de micromarché (vue, nuisances, orientation) n&apos;est pas modélisé faute de données structurées.</li>
            <li>Les prix de référence reflètent les actes T-4 ; en marché très dynamique, un décalage de 3-6 mois peut exister.</li>
            <li>Ce modèle <strong>ne remplace pas</strong> une expertise TEGOVA/RICS avec visite physique — il fournit un ordre de grandeur rapide.</li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Engagement de transparence :</strong> cette page sera mise à jour à chaque recalibration (trimestrielle,
          alignée sur les publications de l&apos;Observatoire). Les utilisateurs professionnels (banques, agences) peuvent
          vérifier la fiabilité du modèle avant de l&apos;intégrer dans leur workflow.
        </div>
      </div>
    </div>
  );
}
