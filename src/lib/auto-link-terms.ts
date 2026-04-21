// Lexique pour l'auto-linker éditorial (guides).
// Règle de modération: max 3 liens injectés par bloc de texte, seulement
// la première occurrence de chaque terme, pas de self-link.
// Les termes sont ordonnés par priorité (les plus spécifiques d'abord pour
// privilégier les guides experts vs les outils génériques).

export type LinkTerm = {
  term: string;
  href: string;
  caseSensitive?: boolean;
};

export const LINK_TERMS: LinkTerm[] = [
  // Légal / fiscal LU (priorité haute, spécifiques)
  { term: "Bëllegen Akt", href: "/guide/bellegen-akt" },
  { term: "Bellegen Akt", href: "/guide/bellegen-akt" },
  { term: "Klimabonus", href: "/guide/klimabonus" },
  { term: "TVA à 3%", href: "/guide/tva-3-pourcent-logement" },
  { term: "TVA 3%", href: "/guide/tva-3-pourcent-logement" },
  { term: "règle des 5%", href: "/guide/regle-5-pourcent-loyer" },
  { term: "règle 5%", href: "/guide/regle-5-pourcent-loyer" },
  { term: "loi du 16 mai 1975", href: "/guide/copropriete-luxembourg" },
  { term: "plus-value immobilière", href: "/guide/plus-value-immobiliere" },
  { term: "frais de notaire", href: "/guide/frais-notaire-luxembourg" },
  { term: "bail d'habitation", href: "/guide/bail-habitation-luxembourg" },
  { term: "bail commercial", href: "/guide/bail-commercial-luxembourg" },

  // ESG / énergie (termes techniques, faible risque de faux positif)
  { term: "CRREM", href: "/esg/crrem-pathways", caseSensitive: true },
  { term: "LENOZ", href: "/energy/lenoz", caseSensitive: true },
  { term: "EPBD", href: "/energy/epbd-2050", caseSensitive: true },
  { term: "Taxonomie UE", href: "/esg/taxonomy" },
  { term: "Factur-X", href: "/facturation", caseSensitive: true },

  // Hôtellerie
  { term: "RevPAR", href: "/hotellerie/revpar-comparison", caseSensitive: true },
  { term: "visa E-2", href: "/hotellerie/score-e2" },

  // Outils (plus génériques — priorité basse, moins de chance d'être atteints)
  { term: "bilan promoteur", href: "/bilan-promoteur" },
  { term: "DCF multi-locataires", href: "/dcf-multi" },
  { term: "carte des prix", href: "/carte" },
  { term: "valorisation hédonique", href: "/hedonique" },
  { term: "valorisation EVS", href: "/valorisation" },
  { term: "simulateur d'aides", href: "/simulateur-aides" },
  { term: "Base de données marché", href: "/marche" },
  { term: "PMS hôtelier", href: "/pms" },
  { term: "syndic de copropriété", href: "/syndic" },
];
