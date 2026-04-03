import type { MetadataRoute } from "next";

const BASE = "https://tevaxia.lu";

const PAGES = [
  "", "/estimation", "/hedonique", "/carte", "/marche",
  "/calculateur-loyer", "/frais-acquisition", "/plus-values",
  "/simulateur-aides", "/vefa", "/outils-bancaires",
  "/achat-vs-location", "/bilan-promoteur", "/valorisation",
  "/dcf-multi", "/portfolio", "/pag-pap", "/terres-agricoles",
  "/aml-kyc", "/pricing", "/connexion",
  "/mentions-legales", "/confidentialite",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of PAGES) {
    // FR
    entries.push({
      url: `${BASE}${page}`,
      lastModified: now,
      changeFrequency: page === "" ? "weekly" : "monthly",
      priority: page === "" ? 1.0 : page === "/estimation" ? 0.9 : 0.7,
      alternates: {
        languages: {
          fr: `${BASE}${page}`,
          en: `${BASE}/en${page}`,
        },
      },
    });
    // EN
    entries.push({
      url: `${BASE}/en${page}`,
      lastModified: now,
      changeFrequency: page === "" ? "weekly" : "monthly",
      priority: page === "" ? 0.9 : 0.6,
      alternates: {
        languages: {
          fr: `${BASE}${page}`,
          en: `${BASE}/en${page}`,
        },
      },
    });
  }

  return entries;
}
