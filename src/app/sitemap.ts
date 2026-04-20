import type { MetadataRoute } from "next";
import { getAllCommunes, slugifyCommune } from "@/lib/market-data";

const BASE = "https://tevaxia.lu";
const LOCALES = ["fr", "en", "de", "pt", "lb"] as const;

// Pages classées par priorité SEO
const HIGH_PRIORITY = [
  "", "/estimation", "/carte", "/frais-acquisition",
  "/calculateur-loyer", "/simulateur-aides",
];

const MEDIUM_PRIORITY = [
  "/plus-values", "/achat-vs-location", "/valorisation",
  "/hedonique", "/outils-bancaires", "/comparer", "/vefa",
  "/bilan-promoteur", "/dcf-multi", "/indices", "/marche",
  "/syndic", "/portfolio",
  "/hotellerie", "/pro-agences", "/api-banques",
];

const LOW_PRIORITY = [
  "/estimateur-construction", "/calculateur-vrd",
  "/convertisseur-surfaces", "/pag-pap", "/terres-agricoles",
  "/aml-kyc", "/propcalc", "/propcalc/developers",
  "/pricing", "/plan-du-site", "/mentions-legales", "/confidentialite",
  "/hotellerie/valorisation", "/hotellerie/dscr",
  "/hotellerie/exploitation", "/hotellerie/renovation",
  "/hotellerie/revpar-comparison", "/hotellerie/score-e2",
];

const ENERGY_PAGES = [
  "", "/impact", "/renovation", "/communaute",
  "/epbd", "/estimateur-cpe", "/lenoz", "/portfolio", "/hvac",
];

function localeUrl(page: string, locale: string) {
  if (locale === "fr") return `${BASE}${page}`;
  return `${BASE}/${locale}${page}`;
}

function alternates(page: string) {
  const langs: Record<string, string> = {};
  for (const loc of LOCALES) langs[loc] = localeUrl(page, loc);
  langs["x-default"] = `${BASE}${page}`;
  return { languages: langs };
}

function addPages(
  entries: MetadataRoute.Sitemap,
  pages: string[],
  now: string,
  basePriority: number,
  changeFreq: "daily" | "weekly" | "monthly"
) {
  for (const page of pages) {
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(page, locale),
        lastModified: now,
        changeFrequency: changeFreq,
        priority: locale === "fr" ? basePriority : basePriority - 0.1,
        alternates: alternates(page),
      });
    }
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const entries: MetadataRoute.Sitemap = [];

  // Pages principales — haute priorité (outils les plus recherchés)
  addPages(entries, HIGH_PRIORITY, now, 1.0, "weekly");

  // Pages outils — priorité moyenne
  addPages(entries, MEDIUM_PRIORITY, now, 0.8, "monthly");

  // Pages utilitaires — priorité basse
  addPages(entries, LOW_PRIORITY, now, 0.6, "monthly");

  // Pages energy
  const energyPaths = ENERGY_PAGES.map((p) => `/energy${p}`);
  addPages(entries, energyPaths, now, 0.8, "monthly");

  // Pages communes — très bon pour la longue traîne SEO
  const communes = getAllCommunes();
  for (const commune of communes) {
    const slug = slugifyCommune(commune);
    const page = `/commune/${slug}`;
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(page, locale),
        lastModified: now,
        changeFrequency: "monthly",
        priority: locale === "fr" ? 0.7 : 0.5,
        alternates: alternates(page),
      });
    }
  }

  return entries;
}
