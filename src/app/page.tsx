import Link from "next/link";

const MODULES = [
  {
    href: "/estimation",
    title: "Estimation instantanée",
    description: "Commune, surface, étage, état, énergie — obtenez une estimation avec fourchette de prix basée sur les données publiques luxembourgeoises.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699-2.067a14.997 14.997 0 01-3.44 0" />
      </svg>
    ),
    tag: "Nouveau",
    color: "from-rose-500 to-pink-500",
  },
  {
    href: "/carte",
    title: "Carte des prix",
    description: "Prix au m² par commune et par quartier. Données Observatoire de l'Habitat, triables par canton, prix ou nom.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    tag: "Nouveau",
    color: "from-indigo-500 to-blue-500",
  },
  {
    href: "/calculateur-loyer",
    title: "Capital Investi & Loyer",
    description: "Calculez le plafond légal de loyer selon la règle des 5% du capital investi. Coefficients de réévaluation, vétusté, gestion colocation.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
    tag: "Loi 2006 modifiée",
    color: "from-navy to-navy-light",
  },
  {
    href: "/frais-acquisition",
    title: "Frais d'Acquisition",
    description: "Droits d'enregistrement 7%, Bëllegen Akt (40 000 €/pers.), TVA 3% vs 17% sur VEFA, émoluments notariaux, frais d'hypothèque.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    tag: "Bëllegen Akt",
    color: "from-gold-dark to-gold",
  },
  {
    href: "/plus-values",
    title: "Plus-Values Immobilières",
    description: "Spéculation vs cession longue durée, coefficients de réévaluation, abattement décennal, exemption résidence principale.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    tag: "Art. 99ter & 102 LIR",
    color: "from-teal to-teal-light",
  },
  {
    href: "/simulateur-aides",
    title: "Simulateur d'Aides",
    description: "5 couches d'aides cumulables : étatiques, rénovation énergie, privées, communales, patrimoine. L'outil le plus complet du Luxembourg.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    tag: "Killer feature",
    color: "from-emerald-600 to-emerald-500",
  },
  {
    href: "/achat-vs-location",
    title: "Acheter ou Louer ?",
    description: "Comparez le coût total et le patrimoine constitué sur la durée. Point de croisement, placement alternatif, appréciation du bien.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    tag: "Nouveau",
    color: "from-cyan-600 to-cyan-500",
  },
  {
    href: "/bilan-promoteur",
    title: "Bilan Promoteur",
    description: "Compte à rebours : prix de vente − coûts − frais − marge = charge foncière maximale. Adapté aux coûts de construction luxembourgeois.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    tag: "Promoteurs",
    color: "from-amber-600 to-amber-500",
  },
  {
    href: "/valorisation",
    title: "Valorisation EVS 2025",
    description: "Comparaison, capitalisation directe, DCF, Mortgage Lending Value, réconciliation. Conforme TEGOVA European Valuation Standards.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-1.5M12 12.75l3-1.5M12 12.75L9 11.25M12 12.75V16.5" />
      </svg>
    ),
    tag: "TEGOVA EVS",
    color: "from-purple-700 to-purple-500",
  },
  {
    href: "/outils-bancaires",
    title: "Outils Bancaires",
    description: "LTV, capacité d'emprunt, tableaux d'amortissement, DSCR. Outils de référence pour le crédit immobilier.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
    tag: "Crédit immobilier",
    color: "from-slate to-gray-600",
  },
];

export default function Home() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-90" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              L'immobilier luxembourgeois,{" "}
              <span className="text-gold">calculé avec précision</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Outils de calcul, de simulation et base pratique pour les professionnels
              de l'immobilier au Luxembourg. Capital investi, frais d'acquisition,
              plus-values, aides étatiques — tout en un seul endroit.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/50">
              <span className="rounded-full border border-white/20 px-3 py-1">Loi bail 2006 modifiée</span>
              <span className="rounded-full border border-white/20 px-3 py-1">Bëllegen Akt</span>
              <span className="rounded-full border border-white/20 px-3 py-1">PAG / PAP</span>
              <span className="rounded-full border border-white/20 px-3 py-1">Coefficients STATEC</span>
              <span className="rounded-full border border-white/20 px-3 py-1">CRR / EBA</span>
              <span className="rounded-full border border-white/20 px-3 py-1">TEGOVA EVS 2025</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modules grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group relative flex flex-col rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${module.color} text-white shadow-sm`}>
                  {module.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy group-hover:text-navy-light transition-colors">
                  {module.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {module.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-navy">
                    {module.tag}
                  </span>
                  <svg
                    className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Key figures */}
      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "7 %", label: "Droits d'enregistrement + transcription" },
              { value: "5 %", label: "Plafond loyer / capital investi" },
              { value: "40 000 €", label: "Bëllegen Akt par acquéreur" },
              { value: "3 %", label: "TVA réduite résidence principale" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-navy sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Suggestion */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Un outil vous manque ?
                </h2>
                <p className="mt-4 text-white/70 leading-relaxed">
                  tevaxia.lu est en construction active. Si vous avez besoin d'un calculateur
                  spécifique, d'une fonctionnalité pour votre pratique professionnelle, ou
                  si vous constatez une erreur dans nos calculs — faites-le nous savoir.
                </p>
                <div className="mt-6">
                  <a
                    href="mailto:contact@tevaxia.lu"
                    className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-dark shadow-sm transition-colors hover:bg-gold-light"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    contact@tevaxia.lu
                  </a>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">Prochains modules prévus</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    <li>Analyse PAG/PAP par commune</li>
                    <li>Base de données marché (prix/m², loyers, transactions)</li>
                    <li>Valorisation hédonique (modèle propre)</li>
                    <li>Calculateur bail VEFA</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">Sources de données intégrées</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    <li>Observatoire de l'Habitat (data.public.lu)</li>
                    <li>STATEC — Indices de prix</li>
                    <li>Geoportail.lu — Cadastre</li>
                    <li>Annonces immobilières (données agrégées)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
