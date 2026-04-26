import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "tva-3-pourcent-logement";
const NAMESPACE = "guide.tva3Pourcent";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideTva3() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={7}
      inlineCalculatorHref="/vefa"
      hasTable
      sections={[
        { id: "principe", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "conditions", paragraphs: 2, callout: { variant: "tip", key: "callout2" } },
        { id: "demarche", paragraphs: 2 },
        { id: "exemples", paragraphs: 1, callout: { variant: "example", key: "callout3" } },
      ]}
    />
  );
}
