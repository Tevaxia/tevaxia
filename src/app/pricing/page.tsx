import Link from "next/link";

const TIERS = [
  {
    name: "Essentiel",
    description: "Calculateurs et simulateurs pour les particuliers",
    features: [
      "Estimation instantanée (double modèle transactions + annonces)",
      "Carte interactive des prix (Leaflet, filtre existant/VEFA/annonces)",
      "Capital investi & plafond de loyer (meublé, colocation, STATEC)",
      "Frais d'acquisition (taux temporaire, Bëllegen Akt, camembert)",
      "Plus-values immobilières (timeline, net après impôt)",
      "Simulateur d'aides (Klimabonus détaillé par mesure, 5 couches)",
      "Calculateur VEFA (intérêts intercalaires, jalons personnalisables)",
      "Outils bancaires (LTV, DSCR, assurance SRD, taux indicatifs LU)",
      "Acheter ou louer (graphique croisement, déductions intérêts LU)",
      "Données marché par commune, quartier et type de bien",
      "Bail emphytéotique (décote 99 ans)",
    ],
    cta: "Commencer",
    href: "/estimation",
  },
  {
    name: "Pro",
    description: "Évaluation professionnelle et conformité",
    features: [
      "Valorisation EVS 2025 — 8 méthodes, 9 types d'actifs",
      "Comparaison avec guides d'ajustement statistiques",
      "Capitalisation directe + terme & réversion + ERV réversionnaire",
      "DCF avec TRI, matrice de sensibilité, tornado chart",
      "DCF multi-locataires (break options, step rents, CAPEX, IRR equity)",
      "Approche résiduelle énergétique + estimation auto des coûts",
      "Valeur hypothécaire (MLV / CRR Art. 229)",
      "Section ESG (score, risques, impact valeur) + checklist EVS",
      "Valorisation hédonique (14 coefficients, prévision prix)",
      "Bilan promoteur (trésorerie, pré-commercialisation, lotissement)",
      "Portfolio multi-actifs (rendement net, re-estimation)",
      "Analyse narrative auto-générée + scénarios Base/Haut/Bas",
      "Rapport PDF et DOCX personnalisables (profil évaluateur)",
      "PAG/PAP avec carte Geoportail + calculateur COS/CMU",
      "Terres agricoles (bail rural, démolition, désamiantage)",
      "AML/KYC (score risque, sanctions UE, export PDF)",
    ],
    cta: "Accéder",
    href: "/valorisation",
    highlight: true,
  },
  {
    name: "Expert",
    description: "Intégration, données et bilingue",
    features: [
      "API REST (9 endpoints de calcul + données marché)",
      "Base de données marché (6 onglets, export CSV)",
      "Données commerciales (bureaux, retail, logistique, hôtels, terrains)",
      "Sources : Observatoire de l'Habitat, STATEC, rapports de marché",
      "Données démographiques par commune",
      "9 types d'actifs avec paramètres contextuels",
      "6 bases de valeur TEGOVA (EVS1–EVS6)",
      "Version bilingue complète (FR + EN)",
      "Sauvegarde cloud (Supabase)",
      "Login Google / LinkedIn",
      "Support par email",
    ],
    cta: "Accéder",
    href: "/valorisation",
  },
];

export default function Pricing() {
  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Tarifs</h1>
          <p className="mt-3 text-muted">
            Tous les outils sont en accès libre pendant la phase de lancement.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 shadow-sm ${
                tier.highlight
                  ? "border-gold bg-gradient-to-b from-card to-gold/5 ring-2 ring-gold/30"
                  : "border-card-border bg-card"
              }`}
            >
              <h2 className="text-xl font-bold text-navy">{tier.name}</h2>
              <p className="mt-1 text-sm text-muted">{tier.description}</p>

              <Link
                href={tier.href}
                className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                  tier.highlight
                    ? "bg-navy text-white hover:bg-navy-light"
                    : "border border-card-border text-navy hover:bg-background"
                }`}
              >
                {tier.cta}
              </Link>

              <ul className="mt-6 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate">
                    <svg className="h-4 w-4 shrink-0 text-navy/40 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted">
          Questions ou suggestions ? <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
        </div>
      </div>
    </div>
  );
}
