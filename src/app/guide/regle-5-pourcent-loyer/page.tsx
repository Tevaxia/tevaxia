import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "regle-5-pourcent-loyer";
const NAMESPACE = "guide.regle5Pourcent";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideRegle5() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={8}
      inlineCalculatorHref="/calculateur-loyer"
      hasTable
      sections={[
        { id: "principe", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "capital", paragraphs: 2, callout: { variant: "tip", key: "callout2" } },
        { id: "calcul", paragraphs: 2 },
        { id: "exemples", paragraphs: 1, callout: { variant: "example", key: "callout3" } },
      ]}
    />
  );
}
