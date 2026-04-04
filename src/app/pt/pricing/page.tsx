import Link from "next/link";

const TIERS = [
  {
    name: "Essential",
    description: "Calculators and simulators",
    features: [
      "Instant estimation",
      "Price map by commune",
      "Invested capital & rent cap",
      "Acquisition costs (Bëllegen Akt)",
      "Capital gains tax",
      "Subsidies simulator (5 layers)",
      "Banking tools (LTV, amortisation, DSCR)",
      "Buy vs rent comparison",
      "Market data by commune and neighbourhood",
    ],
    cta: "Get started",
    href: "/pt/estimation",
  },
  {
    name: "Pro",
    description: "Professional valuation",
    features: [
      "EVS 2025 valuation — 8 methods",
      "Comparison, capitalisation, term & reversion",
      "DCF with IRR and sensitivity matrix",
      "Multi-tenant DCF (lease by lease)",
      "Energy residual approach + auto cost estimation",
      "Mortgage lending value (MLV / CRR)",
      "ESG section and EVS compliance checklist",
      "Developer appraisal (residual method)",
      "Multi-asset portfolio",
      "PDF report and narrative analysis",
      "Cloud storage",
    ],
    cta: "Access",
    href: "/pt/valorisation",
    highlight: true,
  },
  {
    name: "Expert",
    description: "Integration and advanced data",
    features: [
      "REST API (8 calculation endpoints)",
      "Commercial market data (offices, retail, logistics, hotels)",
      "9 asset types with contextual parameters",
      "6 TEGOVA bases of value (EVS1–EVS6)",
      "Statistical adjustment guides",
      "Demographic data by commune",
      "Email support",
    ],
    cta: "Access",
    href: "/pt/valorisation",
  },
];

export default function Pricing() {
  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Pricing</h1>
          <p className="mt-3 text-muted">
            All tools are freely accessible during the launch phase.
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
          Questions or suggestions? <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
        </div>
      </div>
    </div>
  );
}
