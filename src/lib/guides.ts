// Central registry for /guide/* articles + related-guide picker.

export type GuideEntry = {
  slug: string;
  titleKey: string;
  descKey: string;
  tags: string[];
};

export const GUIDES: GuideEntry[] = [
  { slug: "frais-notaire-luxembourg", titleKey: "fraisNotaireTitle", descKey: "fraisNotaireDesc", tags: ["acquisition", "fiscal", "notaire"] },
  { slug: "regle-5-pourcent-loyer", titleKey: "regle5PourcentTitle", descKey: "regle5PourcentDesc", tags: ["location", "legal", "bail"] },
  { slug: "bellegen-akt", titleKey: "bellegenAktTitle", descKey: "bellegenAktDesc", tags: ["acquisition", "fiscal", "aides"] },
  { slug: "plus-value-immobiliere", titleKey: "plusValueTitle", descKey: "plusValueDesc", tags: ["fiscal", "vente"] },
  { slug: "bail-habitation-luxembourg", titleKey: "bailHabitationTitle", descKey: "bailHabitationDesc", tags: ["location", "legal", "bail"] },
  { slug: "copropriete-luxembourg", titleKey: "coproTitle", descKey: "coproDesc", tags: ["syndic", "legal", "gestion"] },
  { slug: "klimabonus", titleKey: "klimabonusTitle", descKey: "klimabonusDesc", tags: ["energie", "aides", "renovation"] },
  { slug: "estimation-bien-immobilier", titleKey: "estimationTitle", descKey: "estimationDesc", tags: ["evaluation", "vente"] },
  { slug: "achat-immobilier-non-resident", titleKey: "achatNonResidentTitle", descKey: "achatNonResidentDesc", tags: ["acquisition", "fiscal", "international"] },
  { slug: "tva-3-pourcent-logement", titleKey: "tva3PourcentTitle", descKey: "tva3PourcentDesc", tags: ["fiscal", "aides", "acquisition"] },
  { slug: "bail-commercial-luxembourg", titleKey: "bailCommercialTitle", descKey: "bailCommercialDesc", tags: ["location", "legal", "bail", "commercial"] },
  { slug: "investir-hotel-luxembourg", titleKey: "investirHotelTitle", descKey: "investirHotelDesc", tags: ["hotellerie", "investissement"] },
  { slug: "ia-tevaxia", titleKey: "iaTevaxiaTitle", descKey: "iaTevaxiaDesc", tags: ["evaluation", "produit"] },
];

export function getRelatedGuides(currentSlug: string, max = 3): GuideEntry[] {
  const current = GUIDES.find((g) => g.slug === currentSlug);
  if (!current) return GUIDES.filter((g) => g.slug !== currentSlug).slice(0, max);

  const others = GUIDES.filter((g) => g.slug !== currentSlug);
  const scored = others.map((g) => ({
    g,
    score: g.tags.filter((tag) => current.tags.includes(tag)).length,
  }));

  scored.sort((a, b) => b.score - a.score);

  const picks = scored.filter((s) => s.score > 0).slice(0, max).map((s) => s.g);
  if (picks.length >= max) return picks;

  const fallback = scored.filter((s) => s.score === 0).map((s) => s.g);
  return [...picks, ...fallback].slice(0, max);
}
