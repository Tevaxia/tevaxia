import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import AuditedFiscalGuide from "@/components/guide/AuditedFiscalGuide";

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

export default async function Guide() {
  const t = await getTranslations(NAMESPACE);
  return <AuditedFiscalGuide kind="rent" title={t("title")} />;
}
