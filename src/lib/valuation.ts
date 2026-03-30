// ============================================================
// VALORISATION IMMOBILIÈRE — TEGOVA EVS 2025 + CRR
// ============================================================

import { formatEUR } from "./calculations";

// ============================================================
// 1. MÉTHODE PAR COMPARAISON (EVS1 — Market Value)
// ============================================================

export interface Comparable {
  id: string;
  adresse: string;
  prixVente: number;
  surface: number; // m²
  dateVente: string; // YYYY-MM
  // Ajustements en % (positif = comparable inférieur → valeur à la hausse)
  ajustLocalisation: number;
  ajustEtat: number;
  ajustEtage: number;
  ajustExterieur: number; // Balcon, terrasse, jardin
  ajustParking: number;
  ajustDate: number; // Indexation temporelle
  ajustAutre: number;
  poids: number; // Pondération dans la moyenne (0-100)
}

export interface ComparaisonResult {
  comparables: {
    id: string;
    adresse: string;
    prixM2Brut: number;
    totalAjustements: number;
    prixM2Ajuste: number;
    poids: number;
  }[];
  prixM2Moyen: number;
  prixM2MoyenPondere: number;
  valeurEstimee: number;
  valeurEstimeePonderee: number;
}

export function calculerComparaison(
  comparables: Comparable[],
  surfaceBien: number
): ComparaisonResult {
  const results = comparables.map((c) => {
    const prixM2Brut = c.surface > 0 ? c.prixVente / c.surface : 0;
    const totalAjustements =
      c.ajustLocalisation + c.ajustEtat + c.ajustEtage +
      c.ajustExterieur + c.ajustParking + c.ajustDate + c.ajustAutre;
    const prixM2Ajuste = prixM2Brut * (1 + totalAjustements / 100);

    return {
      id: c.id,
      adresse: c.adresse,
      prixM2Brut,
      totalAjustements,
      prixM2Ajuste,
      poids: c.poids,
    };
  });

  const totalPoids = results.reduce((s, r) => s + r.poids, 0);
  const prixM2Moyen =
    results.length > 0
      ? results.reduce((s, r) => s + r.prixM2Ajuste, 0) / results.length
      : 0;
  const prixM2MoyenPondere =
    totalPoids > 0
      ? results.reduce((s, r) => s + r.prixM2Ajuste * r.poids, 0) / totalPoids
      : prixM2Moyen;

  return {
    comparables: results,
    prixM2Moyen,
    prixM2MoyenPondere,
    valeurEstimee: prixM2Moyen * surfaceBien,
    valeurEstimeePonderee: prixM2MoyenPondere * surfaceBien,
  };
}

// ============================================================
// 2. CAPITALISATION DIRECTE (EVS1 — Income Approach)
// ============================================================

export interface CapitalisationInput {
  loyerBrutAnnuel: number;
  chargesNonRecuperables: number;
  tauxVacance: number;
  provisionGrosEntretien: number;
  assurancePNO: number;
  fraisGestion: number;
  taxeFonciere: number;
  tauxCapitalisation: number;
  ervAnnuel?: number; // Valeur locative de marché (ERV) — pour rendement réversionnaire
}

export interface CapitalisationResult {
  loyerBrutEffectif: number;
  totalCharges: number;
  noi: number;
  tauxCapitalisation: number;
  valeur: number;
  rendementBrut: number;
  rendementNet: number;
  // Rendement réversionnaire (si ERV fourni)
  rendementInitial: number; // Loyer en place / valeur
  rendementReversionnaire?: number; // ERV / valeur
  sousLoue?: boolean; // true si loyer < ERV
  potentielReversion?: number; // Différence ERV - loyer en %
  // Sensibilité
  sensibilite: { tauxCap: number; valeur: number }[];
}

export function calculerCapitalisation(input: CapitalisationInput): CapitalisationResult {
  const loyerBrutEffectif = input.loyerBrutAnnuel * (1 - input.tauxVacance);
  const fraisGestionMontant = input.loyerBrutAnnuel * input.fraisGestion;
  const provisionMontant = input.loyerBrutAnnuel * input.provisionGrosEntretien;

  const totalCharges =
    input.chargesNonRecuperables +
    fraisGestionMontant +
    provisionMontant +
    input.assurancePNO +
    input.taxeFonciere;

  const noi = loyerBrutEffectif - totalCharges;
  const valeur = input.tauxCapitalisation > 0 ? noi / input.tauxCapitalisation : 0;

  // Rendement réversionnaire
  const rendementInitial = valeur > 0 ? loyerBrutEffectif / valeur : 0;
  let rendementReversionnaire: number | undefined;
  let sousLoue: boolean | undefined;
  let potentielReversion: number | undefined;
  if (input.ervAnnuel && input.ervAnnuel > 0) {
    const ervEffectif = input.ervAnnuel * (1 - input.tauxVacance);
    rendementReversionnaire = valeur > 0 ? ervEffectif / valeur : 0;
    sousLoue = input.loyerBrutAnnuel < input.ervAnnuel;
    potentielReversion = input.loyerBrutAnnuel > 0
      ? ((input.ervAnnuel - input.loyerBrutAnnuel) / input.loyerBrutAnnuel) * 100
      : 0;
  }

  // Sensibilité cap rate ±25bps, ±50bps, ±100bps
  const sensibilite = [-1.0, -0.5, -0.25, 0, 0.25, 0.5, 1.0].map((delta) => {
    const t = input.tauxCapitalisation + delta / 100;
    return { tauxCap: (input.tauxCapitalisation * 100 + delta), valeur: t > 0 ? noi / t : 0 };
  });

  return {
    loyerBrutEffectif,
    totalCharges,
    noi,
    tauxCapitalisation: input.tauxCapitalisation,
    valeur,
    rendementBrut: valeur > 0 ? input.loyerBrutAnnuel / valeur : 0,
    rendementNet: valeur > 0 ? noi / valeur : 0,
    rendementInitial,
    rendementReversionnaire,
    sousLoue,
    potentielReversion,
    sensibilite,
  };
}

// ============================================================
// 3. DCF — Discounted Cash Flow (EVS1 — Income Approach)
// ============================================================

export interface DCFInput {
  loyerAnnuelInitial: number;
  tauxIndexation: number; // % annuel d'augmentation du loyer
  tauxVacance: number;
  chargesAnnuelles: number; // Charges propriétaire année 1
  tauxProgressionCharges: number; // % augmentation annuelle des charges
  periodeAnalyse: number; // Nombre d'années (typiquement 10)
  tauxActualisation: number; // Discount rate — SUBJECTIF → configurable
  tauxCapSortie: number; // Exit cap rate pour terminal value — SUBJECTIF → configurable
  fraisCessionPct: number; // Frais de cession à la sortie (%)
}

export interface DCFCashFlow {
  annee: number;
  loyerBrut: number;
  vacance: number;
  loyerNet: number;
  charges: number;
  noi: number;
  facteurActualisation: number;
  noiActualise: number;
}

export interface DCFResult {
  cashFlows: DCFCashFlow[];
  totalNOIActualise: number;
  noiTerminal: number;
  valeurTerminaleBrute: number;
  fraisCession: number;
  valeurTerminaleNette: number;
  valeurTerminaleActualisee: number;
  valeurDCF: number;
  irr: number; // Taux de rendement interne
  sensibilite: { tauxActu: number; tauxCapSortie: number; valeur: number }[];
}

// Calcul du TRI (IRR) par Newton-Raphson
export function calculerIRR(cashFlows: number[], guess: number = 0.08, maxIter: number = 100, tol: number = 1e-7): number {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      dnpv -= t * cashFlows[t] / (factor * (1 + rate));
    }
    if (Math.abs(npv) < tol) return rate;
    if (dnpv === 0) break;
    rate -= npv / dnpv;
  }
  return rate;
}

export function calculerDCF(input: DCFInput): DCFResult {
  const cashFlows: DCFCashFlow[] = [];
  let totalNOIActualise = 0;

  for (let i = 1; i <= input.periodeAnalyse; i++) {
    const loyerBrut = input.loyerAnnuelInitial * Math.pow(1 + input.tauxIndexation, i - 1);
    const vacance = loyerBrut * input.tauxVacance;
    const loyerNet = loyerBrut - vacance;
    const charges = input.chargesAnnuelles * Math.pow(1 + input.tauxProgressionCharges, i - 1);
    const noi = loyerNet - charges;
    const facteurActualisation = 1 / Math.pow(1 + input.tauxActualisation, i);
    const noiActualise = noi * facteurActualisation;
    totalNOIActualise += noiActualise;

    cashFlows.push({ annee: i, loyerBrut, vacance, loyerNet, charges, noi, facteurActualisation, noiActualise });
  }

  // Terminal value (année n+1)
  const dernierCF = cashFlows[cashFlows.length - 1];
  const noiTerminal = dernierCF
    ? dernierCF.noi * (1 + input.tauxIndexation)
    : 0;
  const valeurTerminaleBrute = input.tauxCapSortie > 0 ? noiTerminal / input.tauxCapSortie : 0;
  const fraisCession = valeurTerminaleBrute * input.fraisCessionPct;
  const valeurTerminaleNette = valeurTerminaleBrute - fraisCession;
  const facteurTerminal = 1 / Math.pow(1 + input.tauxActualisation, input.periodeAnalyse);
  const valeurTerminaleActualisee = valeurTerminaleNette * facteurTerminal;

  const valeurDCF = totalNOIActualise + valeurTerminaleActualisee;

  // IRR : cash flow initial = -valeurDCF (investissement), puis NOI annuels, dernière année + valeur terminale nette
  const irrFlows = [-valeurDCF, ...cashFlows.map((cf) => cf.noi)];
  irrFlows[irrFlows.length - 1] += valeurTerminaleNette;
  const irr = calculerIRR(irrFlows);

  // Sensibilité : matrice taux actualisation × taux de sortie
  const sensibilite: { tauxActu: number; tauxCapSortie: number; valeur: number }[] = [];
  for (const dActu of [-0.5, 0, 0.5]) {
    for (const dCap of [-0.5, 0, 0.5]) {
      const ta = input.tauxActualisation + dActu / 100;
      const tc = input.tauxCapSortie + dCap / 100;
      if (ta <= 0 || tc <= 0) continue;
      let totNOI = 0;
      for (const cf of cashFlows) {
        totNOI += cf.noi / Math.pow(1 + ta, cf.annee);
      }
      const vtBrute = tc > 0 ? noiTerminal / tc : 0;
      const vtNette = vtBrute - vtBrute * input.fraisCessionPct;
      const vtActu = vtNette / Math.pow(1 + ta, input.periodeAnalyse);
      sensibilite.push({
        tauxActu: +(input.tauxActualisation * 100 + dActu).toFixed(1),
        tauxCapSortie: +(input.tauxCapSortie * 100 + dCap).toFixed(1),
        valeur: totNOI + vtActu,
      });
    }
  }

  return {
    cashFlows,
    totalNOIActualise,
    noiTerminal,
    valeurTerminaleBrute,
    fraisCession,
    valeurTerminaleNette,
    valeurTerminaleActualisee,
    valeurDCF,
    irr,
    sensibilite,
  };
}

// ============================================================
// 4. MORTGAGE LENDING VALUE — EVS3 / CRR Art. 229
// ============================================================

export interface MLVInput {
  valeurMarche: number;
  // Sustainability adjustments — CRR requires excluding speculative elements
  decoteConjoncturelle: number; // % — marge prudentielle vs conditions actuelles
  decoteCommercialisation: number; // % — délai/risque de liquidité
  decoteSpecifique: number; // % — risques spécifiques au bien
}

export interface MLVResult {
  valeurMarche: number;
  totalDecotes: number;
  totalDecotesPct: number;
  mlv: number;
  ratioMLVsurMV: number;
  // CRR Risk Weight bands (Art. 125/126 CRR2)
  ltvBands: {
    label: string;
    ltvMax: number;
    riskWeight: number;
    montantMaxPret: number;
    commentaire: string;
  }[];
}

export function calculerMLV(input: MLVInput): MLVResult {
  const totalDecotesPct = input.decoteConjoncturelle + input.decoteCommercialisation + input.decoteSpecifique;
  const totalDecotes = input.valeurMarche * (totalDecotesPct / 100);
  const mlv = input.valeurMarche - totalDecotes;
  const ratioMLVsurMV = input.valeurMarche > 0 ? mlv / input.valeurMarche : 0;

  // CRR2 Art. 125 — Residential risk weight bands
  const ltvBands = [
    {
      label: "LTV ≤ 50%",
      ltvMax: 0.50,
      riskWeight: 0.20,
      montantMaxPret: mlv * 0.50,
      commentaire: "Pondération réduite — couverture forte",
    },
    {
      label: "50% < LTV ≤ 60%",
      ltvMax: 0.60,
      riskWeight: 0.25,
      montantMaxPret: mlv * 0.60,
      commentaire: "Pondération favorable",
    },
    {
      label: "60% < LTV ≤ 80%",
      ltvMax: 0.80,
      riskWeight: 0.30,
      montantMaxPret: mlv * 0.80,
      commentaire: "Standard résidentiel — seuil EBA",
    },
    {
      label: "80% < LTV ≤ 90%",
      ltvMax: 0.90,
      riskWeight: 0.40,
      montantMaxPret: mlv * 0.90,
      commentaire: "Au-delà du standard — surpondération",
    },
    {
      label: "90% < LTV ≤ 100%",
      ltvMax: 1.00,
      riskWeight: 0.50,
      montantMaxPret: mlv * 1.00,
      commentaire: "Exposition élevée — capital réglementaire accru",
    },
    {
      label: "LTV > 100%",
      ltvMax: Infinity,
      riskWeight: 0.70,
      montantMaxPret: mlv * 1.00,
      commentaire: "LTV supérieur à 100% — pondération maximale",
    },
  ];

  return {
    valeurMarche: input.valeurMarche,
    totalDecotes,
    totalDecotesPct,
    mlv,
    ratioMLVsurMV,
    ltvBands,
  };
}

// ============================================================
// 5. RÉCONCILIATION DES VALEURS
// ============================================================

export interface ReconciliationInput {
  valeurComparaison?: number;
  poidsComparaison: number; // 0-100
  valeurCapitalisation?: number;
  poidsCapitalisation: number;
  valeurDCF?: number;
  poidsDCF: number;
}

export interface ReconciliationResult {
  valeurReconciliee: number;
  methodes: {
    nom: string;
    valeur: number;
    poids: number;
    contribution: number;
  }[];
  ecartType: number;
  ecartMaxPct: number; // Écart max entre méthodes en %
}

export function reconcilier(input: ReconciliationInput): ReconciliationResult {
  const methodes: { nom: string; valeur: number; poids: number }[] = [];

  if (input.valeurComparaison && input.poidsComparaison > 0) {
    methodes.push({ nom: "Comparaison", valeur: input.valeurComparaison, poids: input.poidsComparaison });
  }
  if (input.valeurCapitalisation && input.poidsCapitalisation > 0) {
    methodes.push({ nom: "Capitalisation", valeur: input.valeurCapitalisation, poids: input.poidsCapitalisation });
  }
  if (input.valeurDCF && input.poidsDCF > 0) {
    methodes.push({ nom: "DCF", valeur: input.valeurDCF, poids: input.poidsDCF });
  }

  const totalPoids = methodes.reduce((s, m) => s + m.poids, 0);
  const valeurReconciliee = totalPoids > 0
    ? methodes.reduce((s, m) => s + m.valeur * m.poids, 0) / totalPoids
    : 0;

  const contributions = methodes.map((m) => ({
    ...m,
    contribution: totalPoids > 0 ? (m.valeur * m.poids) / totalPoids : 0,
  }));

  // Écart-type
  const valeurs = methodes.map((m) => m.valeur);
  const moyenne = valeurs.length > 0 ? valeurs.reduce((s, v) => s + v, 0) / valeurs.length : 0;
  const variance = valeurs.length > 1
    ? valeurs.reduce((s, v) => s + Math.pow(v - moyenne, 2), 0) / (valeurs.length - 1)
    : 0;
  const ecartType = Math.sqrt(variance);

  // Écart max entre méthodes
  const ecartMaxPct = valeurs.length >= 2 && moyenne > 0
    ? ((Math.max(...valeurs) - Math.min(...valeurs)) / moyenne) * 100
    : 0;

  return {
    valeurReconciliee,
    methodes: contributions,
    ecartType,
    ecartMaxPct,
  };
}

// ============================================================
// 5b. TERME & RÉVERSION (UK/EMEA Standard)
// ============================================================

export interface TermeReversionInput {
  loyerEnPlace: number; // Loyer actuel annuel
  erv: number; // Estimated Rental Value annuel
  dureeRestanteBail: number; // Années restantes du bail en cours
  tauxTerme: number; // Yield appliqué au loyer en place (plus sûr)
  tauxReversion: number; // Yield appliqué à l'ERV (plus risqué)
}

export interface TermeReversionResult {
  // Terme : loyer en place capitalisé pour la durée restante
  valeurTerme: number;
  facteurTerme: number; // Years' Purchase pour la durée restante
  // Réversion : ERV capitalisé en perpétuité, différé de la durée restante
  valeurReversion: number;
  facteurReversionPerp: number; // YP perpetuity
  facteurDiffere: number; // PV factor
  // Total
  valeur: number;
  rendementEquivalent: number; // Taux qui donne la même valeur en cap directe sur ERV
}

export function calculerTermeReversion(input: TermeReversionInput): TermeReversionResult {
  // Terme : Years' Purchase pour n années au taux terme
  const r1 = input.tauxTerme;
  const n = input.dureeRestanteBail;
  const facteurTerme = r1 > 0 ? (1 - Math.pow(1 + r1, -n)) / r1 : n;
  const valeurTerme = input.loyerEnPlace * facteurTerme;

  // Réversion : YP perpetuity au taux réversion × PV différé
  const r2 = input.tauxReversion;
  const facteurReversionPerp = r2 > 0 ? 1 / r2 : 0;
  const facteurDiffere = Math.pow(1 + r2, -n);
  const valeurReversion = input.erv * facteurReversionPerp * facteurDiffere;

  const valeur = valeurTerme + valeurReversion;

  // Rendement équivalent : taux qui donne valeur = ERV / taux
  const rendementEquivalent = valeur > 0 ? input.erv / valeur : 0;

  return {
    valeurTerme,
    facteurTerme,
    valeurReversion,
    facteurReversionPerp,
    facteurDiffere,
    valeur,
    rendementEquivalent,
  };
}

// ============================================================
// 6. APPROCHE RÉSIDUELLE ÉNERGÉTIQUE (EVS 2025)
// ============================================================

export interface ResiduelleEnergetiqueInput {
  classeActuelle: string; // A à G
  classeCible: string; // A à C typiquement
  valeurApresRenovation: number; // Valeur estimée une fois à la classe cible
  coutTravauxRenovation: number; // Travaux de mise en conformité
  honorairesEtudes: number; // Audit, maîtrise d'œuvre, bureau d'études
  fraisFinancement: number; // Intérêts intercalaires si financement des travaux
  margePrudentielle: number; // % — aléas chantier, configurable
  aidesPrevues: number; // Klimabonus, Topup, communales, etc.
}

export interface ResiduelleEnergetiqueResult {
  valeurApresRenovation: number;
  coutTotalBrut: number;
  margePrudentielleMontant: number;
  coutTotalAvecMarge: number;
  aidesDeduites: number;
  coutNetApresAides: number;
  valeurResiduelle: number;
  decoteEnergetique: number;
  decoteEnergetiquePct: number;
}

export function calculerResiduelleEnergetique(input: ResiduelleEnergetiqueInput): ResiduelleEnergetiqueResult {
  const coutTotalBrut = input.coutTravauxRenovation + input.honorairesEtudes + input.fraisFinancement;
  const margePrudentielleMontant = coutTotalBrut * (input.margePrudentielle / 100);
  const coutTotalAvecMarge = coutTotalBrut + margePrudentielleMontant;
  const aidesDeduites = Math.min(input.aidesPrevues, coutTotalAvecMarge);
  const coutNetApresAides = coutTotalAvecMarge - aidesDeduites;

  const valeurResiduelle = input.valeurApresRenovation - coutNetApresAides;
  const decoteEnergetique = input.valeurApresRenovation - valeurResiduelle;
  const decoteEnergetiquePct = input.valeurApresRenovation > 0
    ? (decoteEnergetique / input.valeurApresRenovation) * 100
    : 0;

  return {
    valeurApresRenovation: input.valeurApresRenovation,
    coutTotalBrut,
    margePrudentielleMontant,
    coutTotalAvecMarge,
    aidesDeduites,
    coutNetApresAides,
    valeurResiduelle,
    decoteEnergetique,
    decoteEnergetiquePct,
  };
}

// ============================================================
// 7. CRR MONITORING — Suivi de la valeur (EBA GL/2020/06)
// ============================================================

export interface MonitoringInput {
  valeurInitiale: number;
  dateEvaluation: string; // YYYY-MM-DD
  indiceMarche: number; // Variation de l'indice de marché depuis évaluation (%)
  seuilReeval: number; // Seuil de déclenchement réévaluation (%, typiquement -10%)
  montantPret: number;
  typeExposition: "residentiel" | "commercial";
}

export interface MonitoringResult {
  valeurEstimeeActuelle: number;
  variationPct: number;
  reevaluationRequise: boolean;
  raisonReeval: string;
  ltvActuel: number;
  ltvInitial: number;
  alertes: string[];
}

export function evaluerMonitoring(input: MonitoringInput): MonitoringResult {
  const valeurEstimeeActuelle = input.valeurInitiale * (1 + input.indiceMarche / 100);
  const variationPct = input.indiceMarche;
  const ltvInitial = input.valeurInitiale > 0 ? input.montantPret / input.valeurInitiale : 0;
  const ltvActuel = valeurEstimeeActuelle > 0 ? input.montantPret / valeurEstimeeActuelle : 0;

  const alertes: string[] = [];
  let reevaluationRequise = false;
  let raisonReeval = "";

  // Seuil de variation du marché
  if (variationPct <= input.seuilReeval) {
    reevaluationRequise = true;
    raisonReeval = `Baisse de marché de ${Math.abs(variationPct).toFixed(1)}% — dépasse le seuil de ${Math.abs(input.seuilReeval)}%`;
    alertes.push(`Indice de marché en baisse de ${Math.abs(variationPct).toFixed(1)}%`);
  }

  // EBA : réévaluation obligatoire si exposition > 300k€ (commercial) ou à intervalles réguliers
  if (input.typeExposition === "commercial" && input.montantPret > 300_000) {
    alertes.push("Exposition commerciale > 300 000 € — réévaluation annuelle requise (EBA GL/2020/06)");
  }

  // LTV dégradé
  if (ltvActuel > 0.90 && ltvInitial <= 0.90) {
    alertes.push(`LTV passé de ${(ltvInitial * 100).toFixed(1)}% à ${(ltvActuel * 100).toFixed(1)}% — dépassement du seuil 90%`);
    reevaluationRequise = true;
    if (!raisonReeval) raisonReeval = "LTV dégradé au-delà de 90%";
  }

  // Fréquence de réévaluation
  if (input.typeExposition === "residentiel") {
    alertes.push("Résidentiel : monitoring statistique annuel, réévaluation physique tous les 3 ans min. (EBA GL/2020/06)");
  } else {
    alertes.push("Commercial : réévaluation annuelle par évaluateur indépendant si exposition > 300k€ (EBA GL/2020/06)");
  }

  return {
    valeurEstimeeActuelle,
    variationPct,
    reevaluationRequise,
    raisonReeval,
    ltvActuel,
    ltvInitial,
    alertes,
  };
}
