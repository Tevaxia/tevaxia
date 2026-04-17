// Indice composite tevaxia — mesure synthétique santé marché immobilier LU
//
// Base 100 = Q1 2020 (pré-COVID, stabilité perçue comme référence).
// Composition :
//   - Prix immo résidentiel LU (pondération 0,50) — indice STATEC/ACT
//   - Taux hypothécaire moyen 20 ans (pondération 0,25, inversé : + taux = - santé)
//   - Inflation ICV construction (pondération 0,15, inversée)
//   - Pression locative (yield brut moyen) (pondération 0,10, inversé)
//
// Mise à jour trimestrielle manuelle à chaque release data STATEC / BCE / BCL.

export interface TevaxiaIndexPoint {
  quarter: string; // 'YYYY-Qn'
  prixImmoIndex: number; // base Q1 2020 = 100
  tauxHypo: number; // % annuel
  icvConstruction: number; // base Q1 2020 = 100
  yieldBrutMoyen: number; // % rendement brut LU
  index: number; // indice composite calculé
}

const W_PRIX = 0.50;
const W_TAUX = 0.25;
const W_ICV = 0.15;
const W_YIELD = 0.10;

// Références normalisation (Q1 2020)
const TAUX_REF = 1.5; // taux hypothécaire Q1 2020
const ICV_REF = 100;
const YIELD_REF = 3.8; // yield brut Q1 2020 LU

function normalizeTaux(taux: number): number {
  // Taux bas = santé haute. Inversion non-linéaire.
  // Q1 2020 : 1.5 % → 100. 5 % → 40. 0.5 % → 140.
  return Math.max(0, 100 - (taux - TAUX_REF) * 20);
}

function normalizeICV(icv: number): number {
  // ICV bas = santé haute (inflation construction modérée).
  // Retour proportionnel mais inversé autour de la référence.
  return Math.max(0, 200 - icv);
}

function normalizeYield(yieldPct: number): number {
  // Yield haut = santé haute (cash on cash favorable).
  return 100 * (yieldPct / YIELD_REF);
}

function computeIndex(p: Omit<TevaxiaIndexPoint, "index">): number {
  return (
    W_PRIX * p.prixImmoIndex +
    W_TAUX * normalizeTaux(p.tauxHypo) +
    W_ICV * normalizeICV(p.icvConstruction) +
    W_YIELD * normalizeYield(p.yieldBrutMoyen)
  );
}

const RAW_POINTS: Omit<TevaxiaIndexPoint, "index">[] = [
  { quarter: "2020-Q1", prixImmoIndex: 100, tauxHypo: 1.50, icvConstruction: 100, yieldBrutMoyen: 3.8 },
  { quarter: "2020-Q4", prixImmoIndex: 108, tauxHypo: 1.30, icvConstruction: 102, yieldBrutMoyen: 3.5 },
  { quarter: "2021-Q2", prixImmoIndex: 115, tauxHypo: 1.20, icvConstruction: 106, yieldBrutMoyen: 3.3 },
  { quarter: "2021-Q4", prixImmoIndex: 120, tauxHypo: 1.40, icvConstruction: 112, yieldBrutMoyen: 3.2 },
  { quarter: "2022-Q2", prixImmoIndex: 124, tauxHypo: 2.10, icvConstruction: 124, yieldBrutMoyen: 3.2 },
  { quarter: "2022-Q4", prixImmoIndex: 118, tauxHypo: 3.60, icvConstruction: 132, yieldBrutMoyen: 3.5 },
  { quarter: "2023-Q2", prixImmoIndex: 108, tauxHypo: 4.30, icvConstruction: 134, yieldBrutMoyen: 3.9 },
  { quarter: "2023-Q4", prixImmoIndex: 101, tauxHypo: 4.50, icvConstruction: 135, yieldBrutMoyen: 4.2 },
  { quarter: "2024-Q2", prixImmoIndex: 99,  tauxHypo: 4.20, icvConstruction: 136, yieldBrutMoyen: 4.3 },
  { quarter: "2024-Q4", prixImmoIndex: 101, tauxHypo: 3.80, icvConstruction: 137, yieldBrutMoyen: 4.2 },
  { quarter: "2025-Q2", prixImmoIndex: 104, tauxHypo: 3.50, icvConstruction: 138, yieldBrutMoyen: 4.0 },
  { quarter: "2025-Q4", prixImmoIndex: 107, tauxHypo: 3.20, icvConstruction: 139, yieldBrutMoyen: 3.9 },
  { quarter: "2026-Q1", prixImmoIndex: 109, tauxHypo: 3.10, icvConstruction: 140, yieldBrutMoyen: 3.8 },
];

export const TEVAXIA_INDEX: TevaxiaIndexPoint[] = RAW_POINTS.map((p) => ({
  ...p,
  index: Math.round(computeIndex(p) * 10) / 10,
}));

export const TEVAXIA_INDEX_LAST_UPDATE = "2026-04-15";

export function getCurrentIndex(): TevaxiaIndexPoint {
  return TEVAXIA_INDEX[TEVAXIA_INDEX.length - 1];
}

export function getIndexChange(periods: number = 4): { absolute: number; pct: number } {
  const current = TEVAXIA_INDEX[TEVAXIA_INDEX.length - 1];
  const past = TEVAXIA_INDEX[Math.max(0, TEVAXIA_INDEX.length - 1 - periods)];
  const abs = current.index - past.index;
  const pct = past.index > 0 ? (abs / past.index) * 100 : 0;
  return { absolute: abs, pct };
}

export function interpretIndex(index: number): { label: string; color: string } {
  if (index >= 110) return { label: "fort", color: "text-emerald-700" };
  if (index >= 100) return { label: "équilibré", color: "text-navy" };
  if (index >= 90) return { label: "tendu", color: "text-amber-700" };
  return { label: "préoccupant", color: "text-rose-700" };
}
