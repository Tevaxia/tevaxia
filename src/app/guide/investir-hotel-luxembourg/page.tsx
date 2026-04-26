import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "investir-hotel-luxembourg";
const NAMESPACE = "guide.investirHotel";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideInvestirHotel() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={10}
      inlineCalculatorHref="/hotellerie/valorisation"
      sections={[
        { id: "marche", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "indicateurs", paragraphs: 2 },
        { id: "valorisation", paragraphs: 2, callout: { variant: "tip", key: "callout2" } },
        { id: "duediligence", paragraphs: 2, callout: { variant: "example", key: "callout3" } },
      ]}
    />
  );
}
