import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "bellegen-akt";
const NAMESPACE = "guide.bellegenAkt";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideBellegenAkt() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={6}
      inlineCalculatorHref="/frais-acquisition"
      hasTable
      sections={[
        { id: "principe", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "conditions", paragraphs: 2, callout: { variant: "warning", key: "callout2" } },
        { id: "demande", paragraphs: 2 },
        { id: "exemples", paragraphs: 1, callout: { variant: "example", key: "callout3" } },
      ]}
    />
  );
}
