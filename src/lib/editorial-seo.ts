import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { buildLocaleUrl, localizedAlternates, type Locale } from "@/lib/seo";
import { SEO_BRANDING } from "@/lib/seo-branding";
import fr from "@/messages/seo/fr.json";
import en from "@/messages/seo/en.json";
import de from "@/messages/seo/de.json";
import pt from "@/messages/seo/pt.json";
import lb from "@/messages/seo/lb.json";

export type EditorialPagePath = keyof typeof fr;
export const EDITORIAL_SEO: Record<Locale, typeof fr> = { fr, en, de, pt, lb };

/** Explicit page copy, separate from UI labels and inherited section metadata. */
export function buildEditorialMetadata(locale: Locale, path: EditorialPagePath, noindex = false): Metadata {
  const copy = EDITORIAL_SEO[locale][path];
  return {
    ...copy,
    alternates: localizedAlternates(path, locale),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      ...copy, url: buildLocaleUrl(path, locale), siteName: "tevaxia.lu",
      type: "website", locale: SEO_BRANDING[locale].ogLocale,
      images: ["https://tevaxia.lu/og-image.png"],
    },
    twitter: { ...copy, card: "summary_large_image", images: ["https://tevaxia.lu/og-image.png"] },
  };
}

export async function editorialPageMetadata(path: EditorialPagePath, noindex = false): Promise<Metadata> {
  return buildEditorialMetadata(await getLocale() as Locale, path, noindex);
}
