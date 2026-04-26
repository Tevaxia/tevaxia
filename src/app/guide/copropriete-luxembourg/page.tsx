import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "copropriete-luxembourg";
const NAMESPACE = "guide.copropriete";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideCopropriete() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={9}
      inlineCalculatorHref="/copropriete"
      sections={[
        { id: "definition", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "syndic", paragraphs: 2 },
        { id: "ag", paragraphs: 2, callout: { variant: "warning", key: "callout2" } },
        { id: "fonds", paragraphs: 2, callout: { variant: "tip", key: "callout3" } },
      ]}
    />
  );
}
