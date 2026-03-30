// ============================================================
// CONSTANTES FISCALES & RÉGLEMENTAIRES — LUXEMBOURG
// ============================================================

// Coefficients de réévaluation (Art. 102 LIR) — pour plus-values et capital investi
// Source : Administration des Contributions Directes, barème 2025
export const COEFFICIENTS_REEVALUATION: Record<number, number> = {
  1960: 15.52, 1961: 15.21, 1962: 14.91, 1963: 14.30, 1964: 13.82,
  1965: 13.35, 1966: 12.91, 1967: 12.60, 1968: 12.33, 1969: 11.87,
  1970: 11.34, 1971: 10.83, 1972: 10.28, 1973: 9.68, 1974: 8.78,
  1975: 7.86, 1976: 7.28, 1977: 6.82, 1978: 6.60, 1979: 6.33,
  1980: 5.95, 1981: 5.51, 1982: 5.05, 1983: 4.64, 1984: 4.35,
  1985: 4.17, 1986: 4.17, 1987: 4.17, 1988: 4.10, 1989: 3.96,
  1990: 3.82, 1991: 3.70, 1992: 3.59, 1993: 3.47, 1994: 3.38,
  1995: 3.32, 1996: 3.28, 1997: 3.23, 1998: 3.20, 1999: 3.17,
  2000: 3.07, 2001: 2.97, 2002: 2.87, 2003: 2.80, 2004: 2.73,
  2005: 2.63, 2006: 2.56, 2007: 2.49, 2008: 2.40, 2009: 2.40,
  2010: 2.33, 2011: 2.25, 2012: 2.17, 2013: 2.10, 2014: 2.08,
  2015: 2.07, 2016: 2.07, 2017: 2.03, 2018: 1.99, 2019: 1.96,
  2020: 1.95, 2021: 1.88, 2022: 1.77, 2023: 1.64, 2024: 1.57,
  2025: 1.52, 2026: 1.48,
};

// Droits d'enregistrement et transcription
export const TAUX_ENREGISTREMENT = 0.06; // 6%
export const TAUX_TRANSCRIPTION = 0.01; // 1%
export const TAUX_DROITS_TOTAL = 0.07; // 7% total

// Bëllegen Akt — crédit d'impôt sur droits d'enregistrement
export const BELLEGEN_AKT_PAR_PERSONNE = 40_000; // 40 000 € par acquéreur
export const BELLEGEN_AKT_COUPLE = 80_000; // 80 000 € pour un couple

// TVA
export const TVA_TAUX_NORMAL = 0.17; // 17%
export const TVA_TAUX_REDUIT = 0.03; // 3% (résidence principale)
export const TVA_FAVEUR_PLAFOND = 50_000; // Plafond de la faveur fiscale TVA 3%

// Loyer — règle des 5% du capital investi
export const TAUX_PLAFOND_LOYER = 0.05; // 5% annuel
export const TAUX_VETUSTE_ANNUEL = 0.02; // 2% par an de décote vétusté

// Plus-values
export const SEUIL_SPECULATION_ANNEES = 2; // Détention ≤ 2 ans = spéculation
export const ABATTEMENT_CESSION = 50_000; // 50 000 € d'abattement décennal
export const ABATTEMENT_CESSION_COUPLE = 100_000; // 100 000 € pour couple
export const DEMI_TAUX_GLOBAL = true; // Gains de cession taxés au demi-taux global

// Garantie de l'État
export const GARANTIE_ETAT_MAX = 303_862; // Montant max 2025
export const GARANTIE_ETAT_SEUIL_LTV = 0.60; // Porte sur la partie > 60%
export const GARANTIE_ETAT_PLAFOND_PCT = 0.40; // Max 40% du projet
export const GARANTIE_EPARGNE_MIN_ANNUELLE = 1_000; // 1 000 €/an pendant 3 ans
export const GARANTIE_REVENU_PLAFOND_SEUL = 101_874; // Revenus max emprunteur seul
export const GARANTIE_REVENU_PLAFOND_MULTI = 141_049; // Revenus max plusieurs emprunteurs

// Aides étatiques à l'acquisition
export const PRIME_ACCESSION_MAX = 10_000; // Max 10 000 €
export const PRIME_ACCESSION_MAJORATION_COPROPRIETE = 0.40; // +40%
export const PRIME_ACCESSION_MAJORATION_JUMELEE = 0.15; // +15%
export const PRIME_EPARGNE_MAX = 5_000; // Max 5 000 € (une seule fois)
export const PRIME_AMELIORATION_PCT = 0.40; // Jusqu'à 40% HTVA
export const PRIMES_CAPITAL_PLAFOND = 35_000; // Plafond cumulé primes en capital

// Subvention d'intérêt
export const SUBVENTION_INTERET_MIN = 0.0025; // 0,25%
export const SUBVENTION_INTERET_MAX = 0.035; // 3,5%
export const SUBVENTION_INTERET_MONTANT_BASE = 200_000; // Base 200 000 €
export const SUBVENTION_INTERET_PAR_ENFANT = 20_000; // +20 000 € par enfant
export const SUBVENTION_INTERET_MONTANT_MAX = 280_000; // Plafond 280 000 €

// Bonification d'intérêt
export const BONIFICATION_PAR_ENFANT = 0.005; // 0,50% par enfant
export const BONIFICATION_PLAFOND = 0.03; // Max 3%

// Rénovation énergie
export const KLIMABONUS_PCT_MAX = 0.625; // Jusqu'à 62,5% des travaux
export const SUBVENTION_CONSEIL_ENERGIE = 1_500; // 1 500 € pour audit
export const KLIMAPRET_TAUX = 0.015; // 1,5%
export const KLIMAPRET_MAX = 100_000; // Max 100 000 €
export const KLIMAPRET_DUREE_MAX = 15; // 15 ans
export const KLIMAPRET_GARANTIE_MAX = 50_000; // Garantie État max 50 000 €

// Émoluments notariaux — barème Luxembourg (simplifié)
export const BAREME_NOTAIRE = [
  { limite: 10_000, taux: 0.04 },      // 4% jusqu'à 10 000
  { limite: 25_000, taux: 0.02 },      // 2% de 10 001 à 25 000
  { limite: 50_000, taux: 0.015 },     // 1,5% de 25 001 à 50 000
  { limite: 100_000, taux: 0.01 },     // 1% de 50 001 à 100 000
  { limite: 250_000, taux: 0.008 },    // 0,8% de 100 001 à 250 000
  { limite: 500_000, taux: 0.005 },    // 0,5% de 250 001 à 500 000
  { limite: 1_000_000, taux: 0.004 },  // 0,4% de 500 001 à 1 000 000
  { limite: Infinity, taux: 0.002 },   // 0,2% au-delà
];

// Barème impôt sur le revenu LU 2025 (simplifié — classe 1)
export const BAREME_IR_CLASSE1 = [
  { limite: 12_438, taux: 0 },
  { limite: 14_508, taux: 0.08 },
  { limite: 16_578, taux: 0.09 },
  { limite: 18_648, taux: 0.10 },
  { limite: 20_718, taux: 0.11 },
  { limite: 22_788, taux: 0.12 },
  { limite: 24_858, taux: 0.14 },
  { limite: 26_928, taux: 0.16 },
  { limite: 28_998, taux: 0.18 },
  { limite: 31_068, taux: 0.20 },
  { limite: 33_138, taux: 0.22 },
  { limite: 35_208, taux: 0.24 },
  { limite: 37_278, taux: 0.26 },
  { limite: 39_348, taux: 0.28 },
  { limite: 41_418, taux: 0.30 },
  { limite: 43_488, taux: 0.32 },
  { limite: 45_558, taux: 0.34 },
  { limite: 47_628, taux: 0.36 },
  { limite: 49_698, taux: 0.38 },
  { limite: 51_768, taux: 0.39 },
  { limite: 110_403, taux: 0.40 },
  { limite: 165_600, taux: 0.41 },
  { limite: 220_788, taux: 0.42 },
  { limite: Infinity, taux: 0.42 },
];

// Prix moyens marché LU (Q3 2025, source Observatoire Habitat)
export const PRIX_MOYEN_M2_APPART_EXISTANT = 7_605; // €/m²
export const PRIX_MOYEN_M2_APPART_NEUF = 9_200; // €/m² (estimation)

// Données communes Luxembourg (échantillon — top communes)
export interface CommuneData {
  nom: string;
  canton: string;
  prixMoyenM2: number; // Appartements existants
  aidesCommunales?: string;
}

export const COMMUNES_LU: CommuneData[] = [
  { nom: "Luxembourg-Ville", canton: "Luxembourg", prixMoyenM2: 10_500, aidesCommunales: "Subvention patrimoine secteur protégé 750-20 000€, +10% zone UNESCO" },
  { nom: "Esch-sur-Alzette", canton: "Esch-sur-Alzette", prixMoyenM2: 6_800 },
  { nom: "Differdange", canton: "Esch-sur-Alzette", prixMoyenM2: 6_200 },
  { nom: "Dudelange", canton: "Esch-sur-Alzette", prixMoyenM2: 6_500 },
  { nom: "Ettelbruck", canton: "Diekirch", prixMoyenM2: 6_000 },
  { nom: "Diekirch", canton: "Diekirch", prixMoyenM2: 5_800 },
  { nom: "Strassen", canton: "Luxembourg", prixMoyenM2: 9_800, aidesCommunales: "Réputée généreuse — aides complémentaires significatives" },
  { nom: "Bertrange", canton: "Luxembourg", prixMoyenM2: 10_200, aidesCommunales: "25% aide État plafonnée à 1 800€/maison" },
  { nom: "Hesperange", canton: "Luxembourg", prixMoyenM2: 9_500 },
  { nom: "Sandweiler", canton: "Luxembourg", prixMoyenM2: 9_200 },
  { nom: "Walferdange", canton: "Luxembourg", prixMoyenM2: 9_000 },
  { nom: "Mersch", canton: "Mersch", prixMoyenM2: 7_200 },
  { nom: "Mamer", canton: "Luxembourg", prixMoyenM2: 9_600, aidesCommunales: "Réputée généreuse" },
  { nom: "Steinfort", canton: "Capellen", prixMoyenM2: 7_000 },
  { nom: "Pétange", canton: "Esch-sur-Alzette", prixMoyenM2: 5_900 },
  { nom: "Sanem", canton: "Esch-sur-Alzette", prixMoyenM2: 6_400 },
  { nom: "Mondercange", canton: "Esch-sur-Alzette", prixMoyenM2: 6_600 },
  { nom: "Schifflange", canton: "Esch-sur-Alzette", prixMoyenM2: 6_300 },
  { nom: "Bettembourg", canton: "Esch-sur-Alzette", prixMoyenM2: 6_700 },
  { nom: "Lintgen", canton: "Mersch", prixMoyenM2: 7_400, aidesCommunales: "50% aide État plafonnée à 1 500€" },
  { nom: "Wiltz", canton: "Wiltz", prixMoyenM2: 4_800 },
  { nom: "Clervaux", canton: "Clervaux", prixMoyenM2: 4_500 },
  { nom: "Vianden", canton: "Vianden", prixMoyenM2: 4_600 },
  { nom: "Echternach", canton: "Echternach", prixMoyenM2: 5_500 },
  { nom: "Grevenmacher", canton: "Grevenmacher", prixMoyenM2: 5_800 },
  { nom: "Remich", canton: "Remich", prixMoyenM2: 6_000 },
  { nom: "Junglinster", canton: "Grevenmacher", prixMoyenM2: 7_800 },
  { nom: "Niederanven", canton: "Luxembourg", prixMoyenM2: 9_800 },
  { nom: "Kopstal", canton: "Luxembourg", prixMoyenM2: 10_000 },
  { nom: "Leudelange", canton: "Esch-sur-Alzette", prixMoyenM2: 8_500 },
];
