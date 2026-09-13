import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildLocaleUrl, localizedAlternates, type Locale } from "@/lib/seo";
import { SEO_BRANDING } from "@/lib/seo-branding";

/** Keep search snippets aligned with the translated content visible on the page. */
export async function translatedPageMetadata(locale: Locale, path: string, titleKey: string, descriptionKey: string, noindex = false): Promise<Metadata> {
  const t = await getTranslations({ locale });
  const title = t(titleKey);
  const description = t(descriptionKey);
  return {
    title, description,
    alternates: localizedAlternates(path, locale),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: buildLocaleUrl(path, locale), siteName: "tevaxia.lu", type: "website", locale: SEO_BRANDING[locale].ogLocale, images: ["https://tevaxia.lu/og-image.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["https://tevaxia.lu/og-image.png"] },
  };
}
