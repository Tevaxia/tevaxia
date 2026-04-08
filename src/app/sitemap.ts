import type { MetadataRoute } from "next";

const BASE = "https://tevaxia.lu";
const ENERGY_BASE = "https://energy.tevaxia.lu";
const LOCALES = ["fr", "en", "de", "pt", "lb"] as const;

const PAGES = [
  "", "/estimation", "/hedonique", "/carte", "/marche",
  "/calculateur-loyer", "/frais-acquisition", "/plus-values",
  "/simulateur-aides", "/vefa", "/outils-bancaires",
  "/achat-vs-location", "/bilan-promoteur", "/valorisation",
  "/dcf-multi", "/portfolio", "/pag-pap", "/terres-agricoles",
  "/aml-kyc", "/estimateur-construction", "/calculateur-vrd",
  "/convertisseur-surfaces", "/pricing", "/connexion",
  "/mentions-legales", "/confidentialite", "/plan-du-site",
];

const ENERGY_PAGES = [
  "", "/impact", "/renovation", "/communaute",
  "/epbd", "/estimateur-cpe", "/lenoz", "/portfolio", "/hvac",
];

function localeUrl(base: string, page: string, locale: string) {
  if (locale === "fr") return `${base}${page}`;
  return `${base}/${locale}${page}`;
}

function alternates(base: string, page: string) {
  const langs: Record<string, string> = {};
  for (const loc of LOCALES) langs[loc] = localeUrl(base, page, loc);
  langs["x-default"] = `${base}${page}`;
  return { languages: langs };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const entries: MetadataRoute.Sitemap = [];

  // Main domain pages — all 5 locales
  for (const page of PAGES) {
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(BASE, page, locale),
        lastModified: now,
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: locale === "fr"
          ? (page === "" ? 1.0 : page === "/estimation" ? 0.9 : 0.7)
          : (page === "" ? 0.9 : 0.6),
        alternates: alternates(BASE, page),
      });
    }
  }

  // Energy subdomain pages — all 5 locales
  for (const page of ENERGY_PAGES) {
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(ENERGY_BASE, page, locale),
        lastModified: now,
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: locale === "fr"
          ? (page === "" ? 0.9 : 0.8)
          : (page === "" ? 0.8 : 0.7),
        alternates: alternates(ENERGY_BASE, page),
      });
    }
  }

  return entries;
}
