import type { MetadataRoute } from "next";
import { getAllMarketData, hasPublishedPrices, slugifyCommune } from "@/lib/market-data";
import { GUIDES } from "@/lib/guides";
import { buildLocaleUrl } from "@/lib/seo";

const LOCALES = ["fr", "en", "de", "pt", "lb"] as const;

// Pages classées par priorité SEO
const HIGH_PRIORITY = [
  "", "/estimation", "/carte", "/frais-acquisition",
  "/calculateur-loyer", "/simulateur-aides",
];

const MEDIUM_PRIORITY = [
  "/plus-values", "/achat-vs-location", "/valorisation",
  "/outils-bancaires", "/comparer", "/vefa",
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
  "/hotellerie/compset", "/hotellerie/score-e2",
  "/docs", "/str/rentabilite", "/str/arbitrage",
  "/calculateur-loyer/observatoire", "/gestion-locative/ais",
  "/api-docs", "/cgu",
];

// Outils publics utilisables sans compte, indexables mais jusque-là absents du
// plan du site (audit du 20/11/2026).
const PUBLIC_TOOLS = [
  "/wizard-particulier", "/inspection", "/marche/forecast",
  "/hotellerie/capex", "/hotellerie/certifications-esg",
  "/hotellerie/due-diligence", "/hotellerie/housekeeping",
  "/hotellerie/impayes", "/hotellerie/mice", "/hotellerie/motel",
  "/hotellerie/observatoire-lu", "/hotellerie/pre-acquisition",
  "/hotellerie/transactions",
  "/str/compliance", "/str/compliance-eu", "/str/forecast",
  "/str/observatoire", "/str/pricing",
  "/gestion-locative/assurance-impayes", "/gestion-locative/etat-des-lieux",
  "/pro-agences/fiche-bien", "/syndic/procuration", "/syndic/lettres-types",
];

const ENERGY_PAGES = [
  "", "/impact", "/renovation", "/communaute",
  "/epbd", "/estimateur-cpe", "/lenoz", "/audit", "/hvac",
];

// Landing pages persona-spécifiques pour paid traffic (Google/Bing Ads).
// Priorité haute car destinations de campagnes et points de conversion.
const SOLUTIONS_PAGES = [
  "/solutions",
  "/solutions/syndic",
  "/solutions/agence",
  "/solutions/hotel",
  "/solutions/expert-evaluateur",
  "/solutions/investisseur",
  "/solutions/particulier",
  "/solutions/banque",
  "/solutions/promoteur",
];

// Les pages d'entrée des portails (/copropriete, /conseil-syndical, /locataire)
// restent accessibles mais ne sont plus proposées aux moteurs : elles servent
// aux personnes invitées par lien, pas à la recherche.

function localeUrl(page: string, locale: string) {
  return buildLocaleUrl(page, locale);
}

function alternates(page: string) {
  const langs: Record<string, string> = {};
  for (const loc of LOCALES) langs[loc] = localeUrl(page, loc);
  langs["x-default"] = localeUrl(page, "fr");
  return { languages: langs };
}

function addPages(
  entries: MetadataRoute.Sitemap,
  pages: string[],
  basePriority: number,
  changeFreq: "daily" | "weekly" | "monthly"
) {
  for (const page of pages) {
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(page, locale),
        changeFrequency: changeFreq,
        priority: locale === "fr" ? basePriority : basePriority - 0.1,
        alternates: alternates(page),
      });
    }
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Omit lastModified until a reliable editorial update date is available.
  const entries: MetadataRoute.Sitemap = [];

  // Pages principales — haute priorité (outils les plus recherchés)
  addPages(entries, HIGH_PRIORITY, 1.0, "weekly");

  // Pages outils — priorité moyenne
  addPages(entries, MEDIUM_PRIORITY, 0.8, "monthly");

  // Landings persona-spécifiques — priorité élevée (conversion pages)
  addPages(entries, SOLUTIONS_PAGES, 0.9, "weekly");

  // Pages utilitaires — priorité basse
  addPages(entries, LOW_PRIORITY, 0.6, "monthly");
  addPages(entries, PUBLIC_TOOLS, 0.6, "monthly");

  // Pages energy
  const energyPaths = ENERGY_PAGES.map((p) => `/energy${p}`);
  addPages(entries, energyPaths, 0.8, "monthly");

  // Public articles follow the same registry as the guide hub and related links.
  addPages(entries, ["/guide", ...GUIDES.map(guide => `/guide/${guide.slug}`)], 0.8, "monthly");
  addPages(entries, ["/gestion-locative", "/str", "/facturation", "/bail-commercial", "/esg", "/esg/crrem-pathways", "/esg/taxonomy", "/transparence"], 0.8, "monthly");

  // Pages communes — très bon pour la longue traîne SEO
  // Seules les communes ayant au moins une valeur publiée sont proposées.
  const communes = getAllMarketData().filter(hasPublishedPrices).map(row => row.commune);
  for (const commune of communes) {
    const slug = slugifyCommune(commune);
    const page = `/commune/${slug}`;
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(page, locale),
        changeFrequency: "monthly",
        priority: locale === "fr" ? 0.7 : 0.5,
        alternates: alternates(page),
      });
    }
  }

  return entries;
}
