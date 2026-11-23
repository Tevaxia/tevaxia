// Échéancier par défaut du simulateur VEFA.
//
// Article 1601-9 du Code civil : avant le début des travaux, le vendeur ne peut
// demander que le prix du terrain et des équipements existants ; ensuite, les
// paiements pour les constructions suivent l'avancement, sans dépasser 15 % du
// prix des constructions à l'achèvement des fondations, 50 % à l'achèvement de
// la dalle supérieure et 95 % à l'achèvement de l'immeuble. Le solde est payable
// à la mise à disposition.
//
// Le terrain est donc appelé à l'acte, et le prix des constructions est réparti
// entre les étapes en restant sous ces plafonds.

export interface VefaMilestone {
  labelKey: string;
  /** Part du prix des constructions appelée à cette étape, en %. */
  constructionPct: number;
  monthsAfterStart: number;
}

export const VEFA_MILESTONES: VefaMilestone[] = [
  { labelKey: "milestoneSignature", constructionPct: 0, monthsAfterStart: 0 },
  { labelKey: "milestoneFondations", constructionPct: 15, monthsAfterStart: 4 },
  { labelKey: "milestoneHorsEau", constructionPct: 20, monthsAfterStart: 10 },
  { labelKey: "milestoneHorsAir", constructionPct: 15, monthsAfterStart: 14 },
  { labelKey: "milestoneCloisons", constructionPct: 20, monthsAfterStart: 18 },
  { labelKey: "milestoneFinition", constructionPct: 25, monthsAfterStart: 22 },
  { labelKey: "milestoneLivraison", constructionPct: 5, monthsAfterStart: 26 },
];

/** Plafonds légaux cumulés, en % du prix des constructions (art. 1601-9). */
export const VEFA_LEGAL_CAPS = { foundations: 15, topSlab: 50, completion: 95 } as const;

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Pourcentages du prix total appelés à chaque étape : le terrain à l'acte, puis
 * le prix des constructions selon `VEFA_MILESTONES`. Arrondis au dixième ; la
 * dernière étape absorbe l'écart d'arrondi pour que le total fasse 100.
 */
export function defaultVefaSchedule(prixTotal: number, partTerrain: number): number[] {
  const landShare = prixTotal > 0 && Number.isFinite(partTerrain)
    ? Math.min(1, Math.max(0, partTerrain / prixTotal))
    : 0;
  const pcts = VEFA_MILESTONES.map((milestone, index) =>
    round1((index === 0 ? landShare * 100 : 0) + (1 - landShare) * milestone.constructionPct));
  const last = pcts.length - 1;
  pcts[last] = round1(100 - pcts.slice(0, last).reduce((sum, value) => sum + value, 0));
  return pcts;
}
