"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { getMarketDataCommune, type MarketDataCommune } from "@/lib/market-data";
import { getDemographics } from "@/lib/demographics";
import { formatEUR } from "@/lib/calculations";
import { INDICES_PRIX_ANNUELS } from "@/lib/adjustments";
import { PriceEvolutionChart } from "@/components/PriceChart";

export default function CommunePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const communeName = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-").replace("Sur-", "sur-").replace("Les-", "les-").replace("La-", "la-");

  const commune = useMemo(() => getMarketDataCommune(communeName) || getMarketDataCommune(slug), [communeName, slug]);
  const demo = useMemo(() => getDemographics(communeName), [communeName]);

  if (!commune) {
    return (
      <div className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-2xl font-bold text-navy">Commune non trouvée</h1>
          <p className="mt-2 text-muted">La commune "{slug}" n'a pas été trouvée dans notre base de données.</p>
          <Link href="/carte" className="mt-4 inline-block rounded-lg bg-navy px-6 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors">
            Voir la carte des prix
          </Link>
        </div>
      </div>
    );
  }

  const loyerAnnuel = commune.loyerM2Annonces ? commune.loyerM2Annonces * 12 : null;
  const rendementBrut = commune.prixM2Existant && loyerAnnuel ? (loyerAnnuel / commune.prixM2Existant * 100) : null;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-xs text-muted mb-4">
          <Link href="/" className="hover:text-navy">Accueil</Link> &gt;{" "}
          <Link href="/carte" className="hover:text-navy">Carte des prix</Link> &gt;{" "}
          <span className="text-slate">{commune.commune}</span>
        </div>

        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          Immobilier à {commune.commune}
        </h1>
        <p className="mt-2 text-muted">Canton de {commune.canton} — Données {commune.periode}</p>

        {/* Prix overview */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-navy/5 p-4 text-center">
            <div className="text-xs text-muted">Prix /m² (existant)</div>
            <div className="text-2xl font-bold text-navy">{commune.prixM2Existant ? formatEUR(commune.prixM2Existant) : "—"}</div>
            <div className="text-[10px] text-muted">Actes notariés</div>
          </div>
          <div className="rounded-xl bg-navy/5 p-4 text-center">
            <div className="text-xs text-muted">Prix /m² (VEFA)</div>
            <div className="text-2xl font-bold text-navy">{commune.prixM2VEFA ? formatEUR(commune.prixM2VEFA) : "—"}</div>
            <div className="text-[10px] text-muted">Neuf</div>
          </div>
          <div className="rounded-xl bg-gold/10 p-4 text-center">
            <div className="text-xs text-muted">Loyer /m²/mois</div>
            <div className="text-2xl font-bold text-gold-dark">{commune.loyerM2Annonces ? `${commune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
          </div>
          <div className="rounded-xl bg-teal/10 p-4 text-center">
            <div className="text-xs text-muted">Rendement brut</div>
            <div className="text-2xl font-bold text-teal">{rendementBrut ? `${rendementBrut.toFixed(1)}%` : "—"}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Left */}
          <div className="space-y-6">
            {/* Auto-generated area guide */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-3">Marché immobilier à {commune.commune}</h2>
              <div className="text-sm text-muted leading-relaxed space-y-2">
                <p>
                  Le prix moyen au m² à {commune.commune} s'établit à{" "}
                  <strong className="text-slate">{formatEUR(commune.prixM2Existant || 0)}/m²</strong> pour les
                  appartements existants ({commune.periode}).
                  {commune.prixM2VEFA && ` Le neuf (VEFA) se négocie autour de ${formatEUR(commune.prixM2VEFA)}/m².`}
                </p>
                {commune.nbTransactions && (
                  <p>{commune.nbTransactions} transactions ont été enregistrées sur la dernière période, ce qui confère
                  {commune.nbTransactions > 50 ? " une bonne fiabilité" : " une fiabilité limitée"} aux données.</p>
                )}
                {commune.loyerM2Annonces && (
                  <p>Le loyer moyen s'établit à {commune.loyerM2Annonces.toFixed(1)} €/m²/mois.
                  {rendementBrut && ` Le rendement locatif brut est de ${rendementBrut.toFixed(1)}%.`}</p>
                )}
                {commune.prixM2Existant && commune.prixM2Annonces && (
                  <p>L'écart entre les prix de transaction et les prix annoncés est de{" "}
                  <strong className="text-slate">{((commune.prixM2Annonces - commune.prixM2Existant) / commune.prixM2Existant * 100).toFixed(0)}%</strong>,
                  reflétant la marge de négociation typique.</p>
                )}
              </div>
            </div>

            {/* Demographics */}
            {demo && (
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-semibold text-navy mb-3">Démographie</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted">Population</span><br/><span className="font-semibold">{demo.population.toLocaleString("fr-LU")}</span></div>
                  <div><span className="text-muted">Croissance (10 ans)</span><br/><span className="font-semibold text-success">+{demo.croissancePct}%</span></div>
                  <div><span className="text-muted">Densité</span><br/><span className="font-semibold">{demo.densiteHabKm2} hab/km²</span></div>
                  <div><span className="text-muted">% étrangers</span><br/><span className="font-semibold">{demo.pctEtrangers}%</span></div>
                  {demo.revenuMedian && <div><span className="text-muted">Revenu médian</span><br/><span className="font-semibold">{formatEUR(demo.revenuMedian)}/an</span></div>}
                  {demo.tauxEmploi && <div><span className="text-muted">Taux d'emploi</span><br/><span className="font-semibold">{demo.tauxEmploi}%</span></div>}
                </div>
                <p className="mt-3 text-[10px] text-muted">Source : STATEC (estimations)</p>
              </div>
            )}

            {/* Quartiers */}
            {commune.quartiers && commune.quartiers.length > 0 && (
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-semibold text-navy mb-3">Prix par quartier</h2>
                <div className="space-y-2">
                  {commune.quartiers.sort((a, b) => b.prixM2 - a.prixM2).map((q) => (
                    <div key={q.nom} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate font-medium">{q.nom}</span>
                        <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${q.tendance === "hausse" ? "bg-green-100 text-green-700" : q.tendance === "baisse" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{q.tendance}</span>
                      </div>
                      <span className="font-mono font-semibold text-navy">{formatEUR(q.prixM2)}/m²</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="space-y-6">
            <PriceEvolutionChart />

            {/* Actions */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-4">Outils pour {commune.commune}</h2>
              <div className="space-y-2">
                <Link href="/estimation" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">Estimer un bien</div><div className="text-xs text-muted">Prix avec ajustements</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link href="/frais-acquisition" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">Calculer les frais d'acquisition</div><div className="text-xs text-muted">Droits, Bëllegen Akt, notaire</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link href="/simulateur-aides" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">Simuler les aides</div><div className="text-xs text-muted">5 couches cumulables</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link href="/achat-vs-location" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">Acheter ou louer ?</div><div className="text-xs text-muted">Comparer sur la durée</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </div>

            <p className="text-xs text-muted text-center">
              Source : Observatoire de l'Habitat (data.public.lu) — actes notariés.
              Les données sont fournies à titre indicatif.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
