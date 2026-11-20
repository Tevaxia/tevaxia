// Structure du menu principal, partagée entre l'en-tête (composant client),
// le pied de page et les données structurées des outils (composants serveur).
export interface MenuItem {
  href: string;
  key: string;
}

export interface MenuGroup {
  key: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    key: "particuliers",
    items: [
      { href: "/estimation", key: "estimation" },
      { href: "/carte", key: "carte" },
      { href: "/frais-acquisition", key: "frais" },
      { href: "/calculateur-loyer", key: "loyer" },
      { href: "/simulateur-aides", key: "aides" },
      { href: "/plus-values", key: "plusValues" },
      { href: "/achat-vs-location", key: "achatLocation" },
      { href: "/comparer", key: "comparer" },
      { href: "/vefa", key: "vefa" },
      { href: "/str", key: "strHub" },
    ],
  },
  {
    key: "professionnels",
    items: [
      { href: "/valorisation", key: "valorisation" },
      { href: "/dcf-multi", key: "dcfMulti" },
      { href: "/outils-bancaires", key: "bancaire" },
      { href: "/bilan-promoteur", key: "bilanPromoteur" },
      { href: "/estimateur-construction", key: "estimateurConstruction" },
      { href: "/calculateur-vrd", key: "calculateurVrd" },
      { href: "/convertisseur-surfaces", key: "convertisseurSurfaces" },
      { href: "/portfolio", key: "portfolio" },
      { href: "/syndic", key: "syndic" },
      { href: "/gestion-locative", key: "gestionLocative" },
      { href: "/bail-commercial", key: "bailCommercial" },
      { href: "/aml-kyc", key: "amlKyc" },
      { href: "/pro-agences", key: "proAgences" },
      { href: "/facturation", key: "facturation" },
      { href: "/api-banques", key: "apiBanques" },
    ],
  },
  {
    key: "hotellerie",
    items: [
      { href: "/hotellerie", key: "hotelHub" },
      { href: "/pms", key: "pms" },
      { href: "/hotellerie/valorisation", key: "hotelValorisation" },
      { href: "/hotellerie/dscr", key: "hotelDscr" },
      { href: "/hotellerie/exploitation", key: "hotelExploitation" },
      { href: "/hotellerie/renovation", key: "hotelRenovation" },
      { href: "/hotellerie/compset", key: "hotelRevpar" },
      { href: "/hotellerie/score-e2", key: "hotelE2" },
    ],
  },
  {
    key: "energy",
    items: [
      { href: "/energy/impact", key: "energyImpact" },
      { href: "/energy/renovation", key: "energyRenovation" },
      { href: "/energy/communaute", key: "energyCommunaute" },
      { href: "/energy/hvac", key: "hvac" },
      { href: "/energy/epbd", key: "energyEpbd" },
      { href: "/energy/estimateur-cpe", key: "energyCpe" },
      { href: "/energy/lenoz", key: "energyLenoz" },
      { href: "/esg", key: "esgHub" },
      { href: "/esg/crrem-pathways", key: "esgCrrem" },
      { href: "/esg/taxonomy", key: "esgTaxonomy" },
    ],
  },
  {
    key: "donnees",
    items: [
      { href: "/marche", key: "marche" },
      { href: "/indices", key: "indices" },
      { href: "/pag-pap", key: "pagPap" },
      { href: "/terres-agricoles", key: "terresAgricoles" },
    ],
  },
];

/** Outils repris dans le pied de page de chaque page : ceux qui portent le trafic. */
export const FOOTER_TOOLS: MenuItem[] = [
  { href: "/estimation", key: "estimation" },
  { href: "/carte", key: "carte" },
  { href: "/frais-acquisition", key: "frais" },
  { href: "/calculateur-loyer", key: "loyer" },
  { href: "/plus-values", key: "plusValues" },
  { href: "/simulateur-aides", key: "aides" },
  { href: "/achat-vs-location", key: "achatLocation" },
  { href: "/vefa", key: "vefa" },
  { href: "/outils-bancaires", key: "bancaire" },
  { href: "/bail-commercial", key: "bailCommercial" },
  { href: "/energy/renovation", key: "energyRenovation" },
  { href: "/marche", key: "marche" },
];

// Entrées du menu qui ne sont pas des calculateurs : pages d'accueil de
// rubrique, espaces de gestion, données. Elles ne reçoivent pas de balisage
// WebApplication.
const NOT_CALCULATORS = new Set([
  "/carte", "/str", "/portfolio", "/syndic", "/gestion-locative", "/aml-kyc",
  "/pro-agences", "/facturation", "/api-banques", "/hotellerie", "/pms",
  "/esg", "/marche", "/indices", "/pag-pap",
]);

/** Renvoie l'entrée de menu d'un calculateur public, ou undefined. */
export function findCalculator(path: string): MenuItem | undefined {
  if (NOT_CALCULATORS.has(path)) return undefined;
  for (const group of MENU_GROUPS) {
    const item = group.items.find(entry => entry.href === path);
    if (item) return item;
  }
  return undefined;
}
