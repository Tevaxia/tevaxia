import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "estimation-bien-immobilier";
const NAMESPACE = "guide.estimation";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideEstimation() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={9}
      inlineCalculatorHref="/estimation"
      sections={[
        { id: "methodes", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "donnees", paragraphs: 2 },
        { id: "facteurs", paragraphs: 2, callout: { variant: "warning", key: "callout2" } },
        { id: "tegova", paragraphs: 2, callout: { variant: "tip", key: "callout3" } },
      ]}
    />
  );
}
