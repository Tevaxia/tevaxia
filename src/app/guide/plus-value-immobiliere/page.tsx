import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "plus-value-immobiliere";
const NAMESPACE = "guide.plusValue";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuidePlusValue() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={9}
      inlineCalculatorHref="/plus-values"
      hasTable
      sections={[
        { id: "regime", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "calcul", paragraphs: 2 },
        { id: "abattements", paragraphs: 2, callout: { variant: "tip", key: "callout2" } },
        { id: "exemples", paragraphs: 1, callout: { variant: "example", key: "callout3" } },
      ]}
    />
  );
}
