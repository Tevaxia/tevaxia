import Link from "next/link";

export type PortalLandingProps = {
  lp: string;
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    secondaryHref: string;
  };
  features: { title: string; intro: string; items: Array<{ icon: string; title: string; desc: string }> };
  access: { title: string; intro: string; steps: Array<{ number: string; title: string; desc: string }>; note: string };
  faq: { title: string; items: Array<{ q: string; a: string }> };
  related: { title: string; items: Array<{ label: string; href: string; desc: string }> };
};

export default function PortalAccessLanding({ lp, hero, features, access, faq, related }: PortalLandingProps) {
  return (
    <div className="bg-background">
      <section className="bg-gradient-to-b from-navy via-navy to-navy-light text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold ring-1 ring-gold/30">
            {hero.badge}
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {hero.title} <span className="text-gold">{hero.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:contact@tevaxia.lu"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gold-light transition-colors"
            >
              {hero.primaryCta}
            </a>
            <Link
              href={hero.secondaryHref}
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              {hero.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">{features.title}</h2>
        <p className="mt-3 max-w-3xl text-base text-slate-700 leading-relaxed">{features.intro}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-card-border bg-card p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-2xl">
                {item.icon}
              </div>
              <h3 className="text-base font-semibold text-navy">{item.title}</h3>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-card-border bg-card/40">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">{access.title}</h2>
          <p className="mt-3 max-w-3xl text-base text-slate-700 leading-relaxed">{access.intro}</p>
          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {access.steps.map((step, i) => (
              <li key={i} className="rounded-xl border border-card-border bg-white p-5">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
                  {step.number}
                </div>
                <h3 className="text-sm font-semibold text-navy">{step.title}</h3>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {access.note}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">{faq.title}</h2>
        <div className="mt-6 space-y-3">
          {faq.items.map((item, i) => (
            <details key={i} className="group rounded-lg border border-card-border bg-card p-4">
              <summary className="cursor-pointer text-sm font-semibold text-navy hover:text-gold">
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-card-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">{related.title}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.items.map((item, i) => (
              <Link
                key={i}
                href={item.href.startsWith("http") ? item.href : `${lp}${item.href}`}
                className="rounded-xl border border-card-border bg-card p-5 hover:border-gold transition-colors"
              >
                <div className="text-sm font-semibold text-navy">{item.label}</div>
                <div className="mt-1.5 text-xs text-slate-700 leading-relaxed">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
