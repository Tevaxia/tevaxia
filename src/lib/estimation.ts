// ============================================================
// ESTIMATION INSTANTANÉE — Modèle simplifié
// ============================================================
// Combine : prix/m² commune (Observatoire) + ajustements statistiques
// Pas un AVM (pas assez de données granulaires), mais une estimation
// guidée par les données publiques disponibles.

import { rechercherCommune, type SearchResult } from "./market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR } from "./adjustments";

export interface EstimationInput {
  commune: string;
  quartier?: string;
  surface: number; // m²
  nbChambres: number;
  etage: string; // clé AJUST_ETAGE
  etat: string; // clé AJUST_ETAT
  exterieur: string; // clé AJUST_EXTERIEUR
  parking: boolean;
  classeEnergie: string; // A à G
  typeBien: "appartement" | "maison";
  estNeuf: boolean;
}

export interface EstimationResult {
  prixM2Base: number;
  sourceBase: string; // D'où vient le prix de base
  ajustements: { labelKey: string; labelParams?: Record<string, string | number>; pct: number }[];
  totalAjustements: number;
  prixM2Ajuste: number;
  estimationBasse: number;
  estimationCentrale: number;
  estimationHaute: number;
  confiance: "forte" | "moyenne" | "faible";
  confianceNote: string;
  // Double modèle : transactions vs annonces
  estimationTransactions: number | null; // basé sur prixM2Existant
  estimationAnnonces: number | null;     // basé sur prixM2Annonces
  ecartPct: number | null;               // écart en % entre les deux
}

// Impact de la classe énergie sur le prix (en %)
// Source : Observatoire de l'Habitat, analyses Spuerkeess, tendances marché
const IMPACT_ENERGIE: Record<string, number> = {
  "A": 5,
  "B": 3,
  "C": 1,
  "D": 0,  // référence
  "E": -3,
  "F": -6,
  "G": -10,
};

// Ajustement surface : les petites surfaces ont un prix/m² plus élevé
// Source : modèle hédonique Observatoire
function ajustSurface(surface: number): number {
  if (surface < 40) return 8;
  if (surface < 55) return 4;
  if (surface < 70) return 2;
  if (surface < 90) return 0; // référence
  if (surface < 120) return -2;
  if (surface < 150) return -4;
  return -6;
}

export function estimer(input: EstimationInput): EstimationResult | null {
  // Trouver la commune
  const results = rechercherCommune(input.commune);
  if (results.length === 0) return null;

  // Prendre le meilleur résultat
  let bestResult: SearchResult = results[0];
  // Si on a un quartier spécifique, chercher aussi
  if (input.quartier) {
    const quartierResults = rechercherCommune(input.quartier);
    if (quartierResults.length > 0 && quartierResults[0].quartier) {
      bestResult = quartierResults[0];
    }
  }

  const commune = bestResult.commune;
  let prixM2Base: number;
  let sourceBase: string;

  if (bestResult.quartier) {
    prixM2Base = bestResult.quartier.prixM2;
    sourceBase = `Quartier ${bestResult.quartier.nom}, ${commune.commune}`;
  } else if (input.estNeuf && commune.prixM2VEFA) {
    prixM2Base = commune.prixM2VEFA;
    sourceBase = `${commune.commune} — prix VEFA (neuf)`;
  } else if (commune.prixM2Existant) {
    prixM2Base = commune.prixM2Existant;
    sourceBase = `${commune.commune} — prix transactions existant`;
  } else if (commune.prixM2Annonces) {
    prixM2Base = commune.prixM2Annonces;
    sourceBase = `${commune.commune} — prix annonces`;
  } else {
    return null;
  }

  // Calculer les ajustements
  const ajustements: { labelKey: string; labelParams?: Record<string, string | number>; pct: number }[] = [];

  // Étage
  const etageMatch = AJUST_ETAGE.find((a) => a.labelKey === input.etage);
  if (etageMatch && etageMatch.value !== 0) {
    ajustements.push({ labelKey: "estAjustEtage", labelParams: { etage: input.etage }, pct: etageMatch.value });
  }

  // État
  const etatMatch = AJUST_ETAT.find((a) => a.labelKey === input.etat);
  if (etatMatch && etatMatch.value !== 0) {
    ajustements.push({ labelKey: "estAjustEtat", labelParams: { etat: input.etat }, pct: etatMatch.value });
  }

  // Extérieur
  const extMatch = AJUST_EXTERIEUR.find((a) => a.labelKey === input.exterieur);
  if (extMatch && extMatch.value !== 0) {
    ajustements.push({ labelKey: "estAjustExterieur", labelParams: { exterieur: input.exterieur }, pct: extMatch.value });
  }

  // Parking
  if (input.parking) {
    ajustements.push({ labelKey: "estAjustParking", pct: 4 });
  }

  // Surface
  const surfAdj = ajustSurface(input.surface);
  if (surfAdj !== 0) {
    ajustements.push({ labelKey: surfAdj > 0 ? "estAjustSurfacePetit" : "estAjustSurfaceGrand", labelParams: { surface: input.surface }, pct: surfAdj });
  }

  // Énergie
  const energieAdj = IMPACT_ENERGIE[input.classeEnergie] || 0;
  if (energieAdj !== 0) {
    ajustements.push({ labelKey: "estAjustEnergie", labelParams: { classe: input.classeEnergie }, pct: energieAdj });
  }

  const totalAjustements = ajustements.reduce((s, a) => s + a.pct, 0);
  const prixM2Ajuste = prixM2Base * (1 + totalAjustements / 100);

  const estimationCentrale = Math.round(prixM2Ajuste * input.surface);
  // Marge : ±12% si données par quartier, ±18% par commune, ±25% si annonces seulement
  let marge: number;
  let confiance: "forte" | "moyenne" | "faible";
  let confianceNote: string;

  if (bestResult.quartier) {
    marge = 0.12;
    confiance = "forte";
    confianceNote = `Données par quartier (${bestResult.quartier.nom}), ${commune.nbTransactions || "?"} transactions sur la commune`;
  } else if (commune.prixM2Existant) {
    marge = 0.18;
    confiance = "moyenne";
    confianceNote = `Données communales (${commune.commune}), ${commune.nbTransactions || "?"} transactions. Fourchette plus large faute de données par quartier.`;
  } else {
    marge = 0.25;
    confiance = "faible";
    confianceNote = "Basé sur les prix annonces uniquement — pas de données de transactions disponibles pour cette commune.";
  }

  // Double modèle : calculer les estimations basées sur transactions et annonces
  const multiplicateur = 1 + totalAjustements / 100;
  let estimationTransactions: number | null = null;
  let estimationAnnonces: number | null = null;
  let ecartPct: number | null = null;

  // Si on est sur un quartier, pas de double modèle (une seule source)
  if (!bestResult.quartier) {
    if (commune.prixM2Existant) {
      estimationTransactions = Math.round(commune.prixM2Existant * multiplicateur * input.surface);
    }
    if (commune.prixM2Annonces) {
      estimationAnnonces = Math.round(commune.prixM2Annonces * multiplicateur * input.surface);
    }
    if (estimationTransactions != null && estimationAnnonces != null && estimationTransactions > 0) {
      ecartPct = Math.round(((estimationAnnonces - estimationTransactions) / estimationTransactions) * 1000) / 10;
    }
  }

  return {
    prixM2Base,
    sourceBase,
    ajustements,
    totalAjustements,
    prixM2Ajuste: Math.round(prixM2Ajuste),
    estimationBasse: Math.round(estimationCentrale * (1 - marge)),
    estimationCentrale,
    estimationHaute: Math.round(estimationCentrale * (1 + marge)),
    confiance,
    confianceNote,
    estimationTransactions,
    estimationAnnonces,
    ecartPct,
  };
}
