import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "bail-habitation-luxembourg";
const NAMESPACE = "guide.bailHabitation";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideBailHabitation() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={8}
      inlineCalculatorHref="/calculateur-loyer"
      sections={[
        { id: "cadre", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "loyer", paragraphs: 2 },
        { id: "obligations", paragraphs: 2, callout: { variant: "warning", key: "callout2" } },
        { id: "fin", paragraphs: 2, callout: { variant: "tip", key: "callout3" } },
      ]}
    />
  );
}
