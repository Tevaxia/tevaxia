import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import PersonaLanding from "@/components/PersonaLanding";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("solutions.syndic.meta"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/solutions/syndic", locale),
  };
}

export default async function SyndicSolutionPage() {
  const [t, locale, ttoc] = await Promise.all([
    getTranslations("solutions.syndic"),
    getLocale(),
    getTranslations("common.toc"),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  const problems = (t.raw("problem.items") as Array<{ title: string; desc: string; stat: string }>);
  const steps = (t.raw("howItWorks.steps") as Array<{ number: string; title: string; desc: string }>);
  const features = (t.raw("features.items") as Array<{ title: string; desc: string }>);
  const pricingFeatures = (t.raw("pricing.features") as string[]);
  const faqItems = (t.raw("faq.items") as Array<{ q: string; a: string }>);

  return (
    <PersonaLanding
      lp={lp}
      locale={locale}
      hero={{
        badge: t("hero.badge"),
        title: t("hero.title"),
        titleAccent: t("hero.titleAccent"),
        subtitle: t("hero.subtitle"),
        cta: t("hero.cta"),
        ctaSecondary: t("hero.ctaSecondary"),
        kpis: (t.raw("hero.kpis") as Array<{ value: string; label: string }>),
      }}
      problem={{
        title: t("problem.title"),
        intro: t("problem.intro"),
        items: problems,
      }}
      howItWorks={{
        title: t("howItWorks.title"),
        intro: t("howItWorks.intro"),
        steps,
      }}
      features={{
        title: t("features.title"),
        intro: t("features.intro"),
        items: features,
      }}
      trust={{
        title: t("trust.title"),
        agileTitle: t("trust.agileTitle"),
        agileDesc: t("trust.agileDesc"),
        customTitle: t("trust.customTitle"),
        customDesc: t("trust.customDesc"),
        supportTitle: t("trust.supportTitle"),
        supportDesc: t("trust.supportDesc"),
      }}
      pricing={{
        title: t("pricing.title"),
        subtitle: t("pricing.subtitle"),
        features: pricingFeatures,
        ctaPlatform: t("pricing.ctaPlatform"),
        ctaEmit: t("pricing.ctaEmit"),
        ctaEmitHref: `${lp}/syndic`,
      }}
      faq={{
        title: t("faq.title"),
        items: faqItems,
      }}
      finalCta={{
        title: t("finalCta.title"),
        desc: t("finalCta.desc"),
        cta: t("finalCta.cta"),
        ctaHref: `${lp}/connexion`,
        ctaSecondary: t("finalCta.ctaSecondary"),
        ctaSecondaryHref: `${lp}/syndic`,
      }}
      toc={{
        label: ttoc("label"),
        hero: ttoc("hero"),
        problem: ttoc("problem"),
        how: ttoc("how"),
        features: ttoc("features"),
        trust: ttoc("trust"),
        pricing: ttoc("pricing"),
        faq: ttoc("faq"),
      }}
    />
  );
}
