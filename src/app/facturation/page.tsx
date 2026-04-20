import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("facturation.meta"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: true, follow: true },
    alternates: localizedAlternates("/facturation", locale),
  };
}

export default async function FacturationLanding() {
  const [t, locale] = await Promise.all([
    getTranslations("facturation"),
    getLocale(),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-navy-dark py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-400/30 px-3 py-1 text-xs font-semibold text-amber-200 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t("hero.badge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80">{t("hero.subtitle")}</p>
          <p className="mt-3 max-w-3xl text-sm text-white/60">{t("hero.note")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`${lp}/facturation/emission`}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy-dark hover:bg-gold-light transition-colors">
              {t("hero.ctaEmit")} →
            </Link>
            <a href="#pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
              {t("hero.ctaPricing")}
            </a>
          </div>
        </div>
      </section>

      {/* Différenciateur */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t("diff.title")}</h2>
          <p className="mt-3 text-slate max-w-3xl">{t("diff.intro")}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DiffCard icon="🏢" title={t("diff.locative.title")} desc={t("diff.locative.desc")} />
            <DiffCard icon="🏛️" title={t("diff.syndic.title")} desc={t("diff.syndic.desc")} />
            <DiffCard icon="🏨" title={t("diff.pms.title")} desc={t("diff.pms.desc")} />
            <DiffCard icon="🏪" title={t("diff.bail.title")} desc={t("diff.bail.desc")} />
            <DiffCard icon="🧑‍💼" title={t("diff.expert.title")} desc={t("diff.expert.desc")} />
            <DiffCard icon="📄" title={t("diff.generic.title")} desc={t("diff.generic.desc")} />
          </div>
        </div>
      </section>

      {/* Conformité */}
      <section className="bg-card py-16 border-y border-card-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t("compliance.title")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <ComplianceItem title={t("compliance.fr.title")} items={[
              t("compliance.fr.i1"),
              t("compliance.fr.i2"),
              t("compliance.fr.i3"),
              t("compliance.fr.i4"),
            ]} />
            <ComplianceItem title={t("compliance.lu.title")} items={[
              t("compliance.lu.i1"),
              t("compliance.lu.i2"),
              t("compliance.lu.i3"),
              t("compliance.lu.i4"),
            ]} />
          </div>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>{t("compliance.statusTitle")}</strong> {t("compliance.statusBody")}
          </div>
        </div>
      </section>

      {/* Inclus dans l'abonnement */}
      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-card-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t("pricing.title")}</h2>
            <p className="mt-3 text-slate">{t("pricing.subtitle")}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {(t.raw("pricing.features") as string[]).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`${lp}/pricing`}
                className="inline-flex items-center gap-2 rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition-colors">
                {t("pricing.ctaPlatform")}
              </Link>
              <Link href={`${lp}/facturation/emission`}
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
                {t("pricing.ctaEmit")} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card py-16 border-t border-card-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t("faq.title")}</h2>
          <div className="mt-8 space-y-6">
            <FaqItem q={t("faq.q1.q")} a={t("faq.q1.a")} />
            <FaqItem q={t("faq.q2.q")} a={t("faq.q2.a")} />
            <FaqItem q={t("faq.q3.q")} a={t("faq.q3.a")} />
            <FaqItem q={t("faq.q4.q")} a={t("faq.q4.a")} />
            <FaqItem q={t("faq.q5.q")} a={t("faq.q5.a")} />
            <FaqItem q={t("faq.q6.q")} a={t("faq.q6.a")} />
          </div>
        </div>
      </section>
    </div>
  );
}

function DiffCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      <p className="mt-1 text-xs text-muted leading-relaxed">{desc}</p>
    </div>
  );
}

function ComplianceItem({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-base font-bold text-navy mb-3">{title}</h3>
      <ul className="space-y-1.5 text-sm text-slate">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">✓</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-xl border border-card-border bg-background p-4">
      <summary className="cursor-pointer text-sm font-semibold text-navy">{q}</summary>
      <p className="mt-3 text-sm text-slate leading-relaxed">{a}</p>
    </details>
  );
}
