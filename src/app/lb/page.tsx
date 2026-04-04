import Link from "next/link";

const MODULES = [
  {
    href: "/lb/estimation",
    title: "Instant Estimation",
    description: "Municipality, surface area, floor, condition, energy class — get a price estimate with range based on Luxembourg public data.",
    tag: "New",
    color: "from-rose-500 to-pink-500",
  },
  {
    href: "/lb/carte",
    title: "Price Map",
    description: "Price per sqm by municipality and neighbourhood. Observatoire de l'Habitat data, sortable by canton, price or name.",
    tag: "New",
    color: "from-indigo-500 to-blue-500",
  },
  {
    href: "/lb/calculateur-loyer",
    title: "Rent Cap & Capital",
    description: "Calculate the legal rent ceiling under the 5% invested capital rule. STATEC revaluation coefficients, depreciation, co-tenancy.",
    tag: "Law 2006",
    color: "from-navy to-navy-light",
  },
  {
    href: "/lb/frais-acquisition",
    title: "Acquisition Fees",
    description: "Registration duties 7%, Bëllegen Akt (€40,000/person), VAT 3% vs 17% on VEFA, notary fees, mortgage costs.",
    tag: "Bëllegen Akt",
    color: "from-gold-dark to-gold",
  },
  {
    href: "/lb/plus-values",
    title: "Capital Gains Tax",
    description: "Speculation vs long-term gains, revaluation coefficients, decennial allowance, principal residence exemption.",
    tag: "Art. 99ter & 102 LIR",
    color: "from-teal to-teal-light",
  },
  {
    href: "/lb/simulateur-aides",
    title: "Subsidies Simulator",
    description: "5 layers of cumulative subsidies: state acquisition, energy renovation, private, municipal, heritage. The most comprehensive tool in Luxembourg.",
    tag: "Unique",
    color: "from-emerald-600 to-emerald-500",
  },
  {
    href: "/lb/achat-vs-location",
    title: "Buy vs Rent",
    description: "Compare total cost and wealth accumulation over time. Crossover point, alternative investment, property appreciation.",
    tag: "New",
    color: "from-cyan-600 to-cyan-500",
  },
  {
    href: "/lb/bilan-promoteur",
    title: "Developer Feasibility",
    description: "Residual land value method: sales price − construction costs − fees − margin = maximum land charge. Adapted to Luxembourg costs.",
    tag: "Developers",
    color: "from-amber-600 to-amber-500",
  },
  {
    href: "/lb/valorisation",
    title: "EVS 2025 Valuation",
    description: "Comparison, direct capitalisation, DCF, Mortgage Lending Value, reconciliation. TEGOVA European Valuation Standards compliant.",
    tag: "TEGOVA EVS",
    color: "from-purple-700 to-purple-500",
  },
  {
    href: "/lb/outils-bancaires",
    title: "Banking Tools",
    description: "LTV, borrowing capacity, amortisation schedules, DSCR. Reference tools for mortgage lending.",
    tag: "Mortgage",
    color: "from-slate to-gray-600",
  },
];

export default function HomeEN() {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-navy py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-90" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Luxembourg real estate,{" "}
              <span className="text-gold">calculated with precision</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Calculation tools, simulators and practical reference for real estate
              professionals in Luxembourg. Rent caps, acquisition fees, capital gains,
              state subsidies — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/50">
              <span className="rounded-full border border-white/20 px-3 py-1">Rent Law 2006</span>
              <span className="rounded-full border border-white/20 px-3 py-1">Bëllegen Akt</span>
              <span className="rounded-full border border-white/20 px-3 py-1">PAG / PAP</span>
              <span className="rounded-full border border-white/20 px-3 py-1">STATEC Coefficients</span>
              <span className="rounded-full border border-white/20 px-3 py-1">CRR / EBA</span>
              <span className="rounded-full border border-white/20 px-3 py-1">TEGOVA EVS 2025</span>
            </div>
          </div>
        </div>
      </section>

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
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-navy group-hover:text-navy-light transition-colors">{module.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{module.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-navy">{module.tag}</span>
                  <svg className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "100", label: "Municipalities covered" },
              { value: "8", label: "EVS valuation methods" },
              { value: "9", label: "Asset types" },
              { value: "FR / EN", label: "Bilingual French and English" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-navy sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Missing a tool?</h2>
                <p className="mt-4 text-white/70 leading-relaxed">
                  tevaxia.lu is under active development. If you need a specific calculator,
                  a feature for your professional practice, or if you find an error — let us know.
                </p>
                <div className="mt-6">
                  <a href="mailto:contact@tevaxia.lu" className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-dark shadow-sm transition-colors hover:bg-gold-light">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    contact@tevaxia.lu
                  </a>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">Already available</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    <li>Estimation, price map, hedonic valuation</li>
                    <li>EVS 2025 valuation (8 methods, 9 asset types)</li>
                    <li>Multi-tenant DCF, developer feasibility, portfolio</li>
                    <li>Fees, capital gains, subsidies (detailed Klimabonus), VEFA</li>
                    <li>PAG/PAP with Geoportail map, agricultural land</li>
                    <li>AML/KYC, banking tools, buy vs rent</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">Integrated data sources</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/60">
                    <li>Observatoire de l'Habitat (data.public.lu)</li>
                    <li>STATEC — Price indices & construction costs</li>
                    <li>Geoportail.lu — Cadastre & PAG zoning</li>
                    <li>Office, retail & logistics market reports</li>
                    <li>Mortgage rates and construction indices</li>
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
