import Link from "next/link";

const TIERS = [
  {
    name: "Essentiel",
    description: "Calculateurs et simulateurs",
    features: [
      "Estimation instantanée",
      "Carte des prix par commune",
      "Capital investi & plafond de loyer",
      "Frais d'acquisition (Bëllegen Akt)",
      "Plus-values immobilières",
      "Simulateur d'aides (5 couches)",
      "Outils bancaires (LTV, amortissement, DSCR)",
      "Comparateur acheter ou louer",
      "Données marché par commune et quartier",
    ],
    cta: "Commencer",
    href: "/estimation",
  },
  {
    name: "Pro",
    description: "Évaluation professionnelle",
    features: [
      "Valorisation EVS 2025 — 8 méthodes",
      "Comparaison, capitalisation, terme & réversion",
      "DCF avec TRI et matrice de sensibilité",
      "DCF multi-locataires (bail par bail)",
      "Approche résiduelle énergétique + estimation auto des coûts",
      "Valeur hypothécaire (MLV / CRR)",
      "Section ESG et checklist conformité EVS",
      "Bilan promoteur (compte à rebours)",
      "Portfolio multi-actifs",
      "Rapport PDF et analyse narrative",
      "Sauvegarde cloud",
    ],
    cta: "Accéder",
    href: "/valorisation",
    highlight: true,
  },
  {
    name: "Expert",
    description: "Intégration et données avancées",
    features: [
      "API REST (8 endpoints de calcul)",
      "Données marché commerciales (bureaux, retail, logistique, hôtels)",
      "9 types d'actifs avec paramètres contextuels",
      "6 bases de valeur TEGOVA (EVS1–EVS6)",
      "Guides d'ajustement statistiques",
      "Données démographiques par commune",
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
