import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import PersonaLanding from "@/components/PersonaLanding";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("solutions.hotel.meta"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/solutions/hotel", locale),
  };
}

export default async function HotelSolutionPage() {
  const [t, locale] = await Promise.all([
    getTranslations("solutions.hotel"),
    getLocale(),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

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
        items: t.raw("problem.items") as Array<{ title: string; desc: string; stat: string }>,
      }}
      howItWorks={{
        title: t("howItWorks.title"),
        intro: t("howItWorks.intro"),
        steps: t.raw("howItWorks.steps") as Array<{ number: string; title: string; desc: string }>,
      }}
      features={{
        title: t("features.title"),
        intro: t("features.intro"),
        items: t.raw("features.items") as Array<{ title: string; desc: string }>,
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
        features: t.raw("pricing.features") as string[],
        ctaPlatform: t("pricing.ctaPlatform"),
        ctaEmit: t("pricing.ctaEmit"),
        ctaEmitHref: `${lp}/pms`,
      }}
      faq={{
        title: t("faq.title"),
        items: t.raw("faq.items") as Array<{ q: string; a: string }>,
      }}
      finalCta={{
        title: t("finalCta.title"),
        desc: t("finalCta.desc"),
        cta: t("finalCta.cta"),
        ctaHref: `${lp}/connexion`,
        ctaSecondary: t("finalCta.ctaSecondary"),
        ctaSecondaryHref: `${lp}/pms`,
      }}
    />
  );
}
