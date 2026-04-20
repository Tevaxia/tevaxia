/**
 * Helpers SEO partagés — construction d'URLs canonical + hreflang
 * pour pages multilingues next-intl.
 *
 * Pattern tevaxia.lu :
 * - fr est la locale par défaut, sans préfixe : /guide/slug
 * - autres locales préfixées : /en/guide/slug, /de/guide/slug, etc.
 */

import type { Metadata } from "next";

export const BASE = "https://tevaxia.lu";
export const LOCALES = ["fr", "en", "de", "pt", "lb"] as const;
export type Locale = (typeof LOCALES)[number];

export function buildLocaleUrl(pagePath: string, locale: string): string {
  const path = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  return locale === "fr" ? `${BASE}${path}` : `${BASE}/${locale}${path}`;
}

/**
 * Renvoie l'objet alternates à injecter dans generateMetadata :
 * - canonical pointe sur la version de la locale courante
 * - languages liste toutes les variantes locales pour hreflang
 * - x-default pointe sur la version fr (par défaut)
 */
export function localizedAlternates(pagePath: string, currentLocale: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = buildLocaleUrl(pagePath, loc);
  }
  languages["x-default"] = buildLocaleUrl(pagePath, "fr");

  return {
    canonical: buildLocaleUrl(pagePath, currentLocale),
    languages,
  };
}

/**
 * Metadata "noindex" pour pages auth-gated ou utilitaires
 * (sans contenu public pertinent).
 */
export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: true },
};
