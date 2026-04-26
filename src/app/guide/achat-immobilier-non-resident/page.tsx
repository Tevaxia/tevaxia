import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "achat-immobilier-non-resident";
const NAMESPACE = "guide.achatNonResident";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideAchatNonResident() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={9}
      inlineCalculatorHref="/frais-acquisition"
      hasTable
      sections={[
        { id: "cadre", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "fiscalite", paragraphs: 2, callout: { variant: "tip", key: "callout2" } },
        { id: "financement", paragraphs: 2 },
        { id: "exemples", paragraphs: 1, callout: { variant: "example", key: "callout3" } },
      ]}
    />
  );
}
