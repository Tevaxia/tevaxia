// Questions-réponses reprises des guides audités et affichées sous l'outil
// correspondant. Aucun texte nouveau : `items` désigne des entrées existantes
// de `guide.<x>.faq`. Une liste vide n'affiche que le lien vers le guide.
export interface ToolGuideSource {
  /** Espace de traduction du guide, par exemple "guide.fraisNotaire". */
  namespace: string;
  /** Segment d'URL du guide sous /guide/. */
  slug: string;
  /** Index des questions du guide à reprendre. */
  items: number[];
}

export const TOOL_GUIDES: Record<string, ToolGuideSource[]> = {
  "/frais-acquisition": [{ namespace: "guide.fraisNotaire", slug: "frais-notaire-luxembourg", items: [0, 1, 2, 4] }],
  "/estimation": [{ namespace: "guide.estimation", slug: "estimation-bien-immobilier", items: [0, 2, 3, 5] }],
  "/simulateur-aides": [
    { namespace: "guide.bellegenAkt", slug: "bellegen-akt", items: [1, 2, 3] },
    { namespace: "guide.klimabonus", slug: "klimabonus", items: [0, 1] },
  ],
  "/plus-values": [{ namespace: "guide.plusValue", slug: "plus-value-immobiliere", items: [] }],
  "/calculateur-loyer": [{ namespace: "guide.regle5Pourcent", slug: "regle-5-pourcent-loyer", items: [] }],
};

/** Texte « ce que calcule l'outil » : clé sous `toolNotes` dans les messages. */
export const TOOL_NOTES: Record<string, string> = {
  "/outils-bancaires": "outilsBancaires",
  "/bilan-promoteur": "bilanPromoteur",
  "/energy/renovation": "energyRenovation",
  "/str/rentabilite": "strRentabilite",
};
