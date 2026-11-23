import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";
import ProductLanding from "@/components/product/ProductLanding";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("productPages.syndic.meta"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/solutions/syndic", locale),
  };
}

// Présentation du logiciel de syndic. Le simulateur de charges reste sur
// `/syndic` ; le logiciel lui-même s'ouvre sur `/syndic/coproprietes`.
export default function SyndicSolutionPage() {
  return (
    <ProductLanding
      product="syndic"
      path="/solutions/syndic"
      openHref="/syndic/coproprietes"
      links={["/syndic", "/syndic/lettres-types", "/syndic/procuration"]}
    />
  );
}
