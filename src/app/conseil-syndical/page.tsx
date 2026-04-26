import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import PortalAccessLanding from "@/components/PortalAccessLanding";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("portalLandings.conseilSyndical.meta"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/conseil-syndical", locale),
  };
}

export default async function ConseilSyndicalPage() {
  const [t, locale] = await Promise.all([
    getTranslations("portalLandings.conseilSyndical"),
    getLocale(),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  return (
    <PortalAccessLanding
      lp={lp}
      hero={{
        badge: t("hero.badge"),
        title: t("hero.title"),
        titleAccent: t("hero.titleAccent"),
        subtitle: t("hero.subtitle"),
        primaryCta: t("hero.primaryCta"),
        secondaryCta: t("hero.secondaryCta"),
        secondaryHref: `${lp}/guide/copropriete-luxembourg`,
      }}
      features={{
        title: t("features.title"),
        intro: t("features.intro"),
        items: t.raw("features.items") as Array<{ icon: string; title: string; desc: string }>,
      }}
      access={{
        title: t("access.title"),
        intro: t("access.intro"),
        steps: t.raw("access.steps") as Array<{ number: string; title: string; desc: string }>,
        note: t("access.note"),
      }}
      faq={{
        title: t("faq.title"),
        items: t.raw("faq.items") as Array<{ q: string; a: string }>,
      }}
      related={{
        title: t("related.title"),
        items: t.raw("related.items") as Array<{ label: string; href: string; desc: string }>,
      }}
    />
  );
}
