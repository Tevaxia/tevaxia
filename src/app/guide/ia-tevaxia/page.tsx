import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import GuideTemplate from "@/components/guide/GuideTemplate";

const SLUG = "ia-tevaxia";
const NAMESPACE = "guide.iaTevaxia";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations(NAMESPACE), getLocale()]);
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: localizedAlternates(`/guide/${SLUG}`, locale),
  };
}

export default async function GuideIaTevaxia() {
  return (
    <GuideTemplate
      namespace={NAMESPACE}
      slug={SLUG}
      readingMinutes={7}
      inlineCalculatorHref="/profil"
      sections={[
        { id: "analyse", paragraphs: 2, callout: { variant: "info", key: "callout1" } },
        { id: "evs", paragraphs: 2 },
        { id: "pdf", paragraphs: 2, callout: { variant: "tip", key: "callout2" } },
        { id: "chat", paragraphs: 2, callout: { variant: "warning", key: "callout3" } },
      ]}
    />
  );
}
