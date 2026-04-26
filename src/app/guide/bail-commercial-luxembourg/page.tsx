import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "bail-commercial-luxembourg";
const NAMESPACE = "guide.bailCommercial";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideBailCommercial() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={9}
      inlineCalculatorHref="/bail-commercial"
      sections={[
        { id: "cadre", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "duree", paragraphs: 2 },
        { id: "loyer", paragraphs: 2, callout: { variant: "warning", key: "callout2" } },
        { id: "renouvellement", paragraphs: 2, callout: { variant: "tip", key: "callout3" } },
      ]}
    />
  );
}
