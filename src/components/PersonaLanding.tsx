import Link from "next/link";
import type { ReactNode } from "react";

export interface PersonaProblem {
  title: string;
  desc: string;
  stat?: string;
}

export interface PersonaStep {
  number: string;
  title: string;
  desc: string;
}

export interface PersonaFeature {
  title: string;
  desc: string;
}

export interface PersonaFaqItem {
  q: string;
  a: string;
}

export interface PersonaLandingProps {
  lp: string;
  locale: string;

  hero: {
    badge: string;
    title: string;
    titleAccent?: string;
    subtitle: string;
    cta: string;
    ctaSecondary: string;
    kpis: Array<{ value: string; label: string }>;
  };

  problem: {
    title: string;
    intro: string;
    items: PersonaProblem[];
  };

  howItWorks: {
    title: string;
    intro: string;
    steps: PersonaStep[];
  };

  features: {
    title: string;
    intro: string;
    items: PersonaFeature[];
  };

  trust: {
    title: string;
    agileTitle: string;
    agileDesc: string;
    customTitle: string;
    customDesc: string;
    supportTitle: string;
    supportDesc: string;
  };

  pricing: {
    title: string;
    subtitle: string;
    features: string[];
    ctaPlatform: string;
    ctaEmit: string;
    ctaEmitHref: string;
  };

  faq: {
    title: string;
    items: PersonaFaqItem[];
  };

  finalCta: {
    title: string;
    desc: string;
    cta: string;
    ctaHref: string;
    ctaSecondary?: string;
    ctaSecondaryHref?: string;
  };

  /** Optional icon for hero (SVG element) */
  heroIcon?: ReactNode;
}

export default function PersonaLanding(p: PersonaLandingProps) {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-navy-dark py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-semibold text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                {p.hero.badge}
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {p.hero.title}{" "}
                {p.hero.titleAccent && (
                  <span className="text-gold">{p.hero.titleAccent}</span>
                )}
              </h1>
              <p className="mt-5 text-lg text-white/80 leading-relaxed">{p.hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`${p.lp}/connexion`}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy-dark hover:bg-gold-light transition-colors shadow-lg"
                >
                  {p.hero.cta} →
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  {p.hero.ctaSecondary}
                </a>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                {p.hero.kpis.map((kpi, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold text-gold">{kpi.value}</div>
                    <div className="text-xs text-white/60 mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {p.heroIcon && (
              <div className="hidden lg:flex justify-center items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gold/20 rounded-full blur-3xl" />
                  <div className="relative text-gold/80">{p.heroIcon}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">{p.problem.title}</h2>
            <p className="mt-4 text-lg text-slate">{p.problem.intro}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {p.problem.items.map((pb, i) => (
              <div key={i} className="rounded-xl border border-rose-200 bg-rose-50/40 p-6">
                <h3 className="text-base font-bold text-navy">{pb.title}</h3>
                <p className="mt-2 text-sm text-slate leading-relaxed">{pb.desc}</p>
                {pb.stat && (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-rose-700">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M3.75 21.75h16.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    {pb.stat}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-card border-y border-card-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">{p.howItWorks.title}</h2>
            <p className="mt-4 text-lg text-slate">{p.howItWorks.intro}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {p.howItWorks.steps.map((step, i) => (
              <div key={i} className="rounded-xl border border-card-border bg-background p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white font-bold text-sm">
                    {step.number}
                  </div>
                  <h3 className="text-base font-bold text-navy">{step.title}</h3>
                </div>
                <p className="mt-4 text-sm text-slate leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">{p.features.title}</h2>
            <p className="mt-4 text-lg text-slate">{p.features.intro}</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {p.features.items.map((f, i) => (
              <div key={i} className="rounded-lg border border-card-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{f.title}</h3>
                    <p className="mt-1 text-xs text-slate leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl text-center">{p.trust.title}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-base font-bold text-white">{p.trust.agileTitle}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{p.trust.agileDesc}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-6">
              <div className="text-3xl mb-3">🛠️</div>
              <h3 className="text-base font-bold text-white">{p.trust.customTitle}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{p.trust.customDesc}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-6">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-base font-bold text-white">{p.trust.supportTitle}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{p.trust.supportDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (inclusion) */}
      <section id="pricing" className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-navy bg-card p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">{p.pricing.title}</h2>
            <p className="mt-3 text-slate">{p.pricing.subtitle}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {p.pricing.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`${p.lp}/pricing`}
                className="inline-flex items-center gap-2 rounded-lg border border-navy bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition-colors"
              >
                {p.pricing.ctaPlatform}
              </Link>
              <Link
                href={p.pricing.ctaEmitHref}
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
              >
                {p.pricing.ctaEmit} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card border-t border-card-border py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">{p.faq.title}</h2>
          <div className="mt-8 space-y-4">
            {p.faq.items.map((it, i) => (
              <details key={i} className="rounded-xl border border-card-border bg-background p-5">
                <summary className="cursor-pointer text-sm font-semibold text-navy">{it.q}</summary>
                <p className="mt-3 text-sm text-slate leading-relaxed">{it.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-navy to-navy-dark py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{p.finalCta.title}</h2>
          <p className="mt-4 text-lg text-white/80">{p.finalCta.desc}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={p.finalCta.ctaHref}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy-dark hover:bg-gold-light transition-colors shadow-lg"
            >
              {p.finalCta.cta} →
            </Link>
            {p.finalCta.ctaSecondary && p.finalCta.ctaSecondaryHref && (
              <Link
                href={p.finalCta.ctaSecondaryHref}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                {p.finalCta.ctaSecondary}
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
