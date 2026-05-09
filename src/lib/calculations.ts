import {
  COEFFICIENTS_REEVALUATION,
  TAUX_PLAFOND_LOYER,
  TAUX_DROITS_TOTAL,
  BELLEGEN_AKT_PAR_PERSONNE,
  TVA_TAUX_NORMAL,
  TVA_TAUX_REDUIT,
  TVA_FAVEUR_PLAFOND,
  BAREME_NOTAIRE,
  ABATTEMENT_CESSION,
  ABATTEMENT_CESSION_COUPLE,
  SEUIL_SPECULATION_ANNEES,
  PRIME_ACCESSION_MAX,
  PRIME_ACCESSION_MAJORATION_COPROPRIETE,
  PRIME_ACCESSION_MAJORATION_JUMELEE,
  PRIME_EPARGNE_MAX,
  SUBVENTION_INTERET_MONTANT_BASE,
  SUBVENTION_INTERET_PAR_ENFANT,
  SUBVENTION_INTERET_MONTANT_MAX,
  BONIFICATION_PAR_ENFANT,
  BONIFICATION_PLAFOND,
  GARANTIE_ETAT_MAX,
  GARANTIE_ETAT_SEUIL_LTV,
  GARANTIE_ETAT_PLAFOND_PCT,
  GARANTIE_REVENU_PLAFOND_SEUL,
  GARANTIE_REVENU_PLAFOND_MULTI,
  BAREME_IR_CLASSE1,
} from "./constants";

// ============================================================
// UTILS
// ============================================================

export function getCoefficient(annee: number): number {
  if (annee < 1960) return COEFFICIENTS_REEVALUATION[1960] || 15.52;
  if (annee > 2026) return 1;
  return COEFFICIENTS_REEVALUATION[annee] || 1;
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-LU", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEUR2(amount: number): string {
  return new Intl.NumberFormat("fr-LU", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPct(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)} %`;
}

// ============================================================
// MODULE 1 — CAPITAL INVESTI / PLAFOND LOYER
// ============================================================

export interface TrancheTravauxInput {
  montant: number;
  annee: number;
}

export interface CapitalInvestiInput {
  prixAcquisition: number;
  anneeAcquisition: number;
  travauxMontant: number; // Tranche principale (rétrocompatibilité)
  travauxAnnee: number;
  tranchesSupplementaires?: TrancheTravauxInput[]; // Tranches additionnelles
  anneeBail: number;
  surfaceHabitable: number;
  nbColocataires?: number;
  appliquerVetuste: boolean;
  tauxVetusteAnnuel: number;
  estMeuble?: boolean; // Logement meublé = +10% sur le loyer max
}

export interface CapitalInvestiResult {
  prixReevalue: number;
  coeffAcquisition: number;
  travauxReevalues: number;
  coeffTravaux: number;
  anneesVetuste: number;
  decoteVetuste: number;
  decoteVetustePct: number;
  capitalInvesti: number;
  loyerAnnuelMax: number;
  loyerMensuelMax: number;
  loyerM2Mensuel: number;
  loyerParColocataire?: number;
}

export function calculerCapitalInvesti(input: CapitalInvestiInput): CapitalInvestiResult {
  const coeffAcquisition = getCoefficient(input.anneeAcquisition);
  const coeffTravaux = input.travauxMontant > 0 ? getCoefficient(input.travauxAnnee) : 1;

  const prixReevalue = input.prixAcquisition * coeffAcquisition;
  const travauxReevalues = input.travauxMontant * coeffTravaux;

  // Tranches supplémentaires de travaux
  let tranchesSupReevaluees = 0;
  if (input.tranchesSupplementaires) {
    for (const t of input.tranchesSupplementaires) {
      if (t.montant > 0) {
        tranchesSupReevaluees += t.montant * getCoefficient(t.annee);
      }
    }
  }

  const valeurBrute = prixReevalue + travauxReevalues + tranchesSupReevaluees;

  // Vétusté — optionnelle et configurable
  // La loi de 2006 ne fixe pas de taux de vétusté précis.
  // La pratique courante utilise 1-2%/an mais ce n'est pas une obligation légale.
  const anneeRef = input.travauxMontant > 0
    ? Math.max(input.anneeAcquisition, input.travauxAnnee)
    : input.anneeAcquisition;
  const anneesVetuste = Math.max(0, input.anneeBail - anneeRef);
  const decoteVetustePct = input.appliquerVetuste
    ? Math.min(1, anneesVetuste * input.tauxVetusteAnnuel)
    : 0;
  const decoteVetuste = valeurBrute * decoteVetustePct;

  const capitalInvesti = valeurBrute - decoteVetuste;
  const loyerAnnuelMax = capitalInvesti * TAUX_PLAFOND_LOYER;
  // Meublé : +10% autorisé par la loi
  const loyerAnnuelMaxFinal = input.estMeuble ? loyerAnnuelMax * 1.10 : loyerAnnuelMax;
  const loyerMensuelMax = loyerAnnuelMaxFinal / 12;
  const loyerM2Mensuel = input.surfaceHabitable > 0 ? loyerMensuelMax / input.surfaceHabitable : 0;

  const result: CapitalInvestiResult = {
    prixReevalue,
    coeffAcquisition,
    travauxReevalues,
    coeffTravaux,
    anneesVetuste,
    decoteVetuste,
    decoteVetustePct,
    capitalInvesti,
    loyerAnnuelMax: loyerAnnuelMaxFinal,
    loyerMensuelMax,
    loyerM2Mensuel,
  };

  if (input.nbColocataires && input.nbColocataires > 1) {
    result.loyerParColocataire = loyerMensuelMax / input.nbColocataires;
  }

  return result;
}

// ============================================================
// MODULE 2 — FRAIS D'ACQUISITION
// ============================================================

export interface FraisAcquisitionInput {
  prixBien: number;
  estNeuf: boolean;
  partTerrain?: number;
  partConstruction?: number;
  residencePrincipale: boolean;
  nbAcquereurs: 1 | 2;
  montantHypotheque?: number;
  dateActe?: string; // YYYY-MM — pour taux temporaire réduit
}

export interface FraisAcquisitionResult {
  // Droits d'enregistrement
  baseDroits: number;
  droitsEnregistrement: number;
  droitsTranscription: number;
  droitsTotal: number;
  // Bëllegen Akt
  creditBellegenAkt: number;
  droitsApresCredit: number;
  // TVA
  tvaApplicable: number;
  tauxTva: number;
  montantTva: number;
  faveurFiscaleTva: number;
  // Notaire
  emolumentsNotaire: number;
  // Hypothèque
  fraisHypotheque: number;
  droitsHypotheque: number;
  // Totaux
  totalFrais: number;
  totalPourcentage: number;
  coutTotalAcquisition: number;
}

export function calculerEmolumentsNotaire(montant: number): number {
  let emoluments = 0;
  let restant = montant;
  let seuil = 0;

  for (const tranche of BAREME_NOTAIRE) {
    const largeurTranche = tranche.limite - seuil;
    const montantDansTranche = Math.min(restant, largeurTranche);
    emoluments += montantDansTranche * tranche.taux;
    restant -= montantDansTranche;
    seuil = tranche.limite;
    if (restant <= 0) break;
  }

  return emoluments;
}

export function calculerFraisAcquisition(input: FraisAcquisitionInput): FraisAcquisitionResult {
  // Taux temporaire réduit (oct 2024 - juin 2025) : 3.5% au lieu de 7%
  let tauxDroitsEffectif = TAUX_DROITS_TOTAL;
  if (input.dateActe) {
    const [y, m] = input.dateActe.split("-").map(Number);
    if ((y === 2024 && m >= 10) || (y === 2025 && m <= 6)) {
      tauxDroitsEffectif = 0.035; // 3.5% temporaire
    }
  }

  // Base des droits d'enregistrement
  let baseDroits: number;
  if (input.estNeuf && input.partTerrain) {
    baseDroits = input.partTerrain;
  } else {
    baseDroits = input.prixBien;
  }

  const ratioEnreg = tauxDroitsEffectif * (6/7); // Proportion enregistrement
  const ratioTransc = tauxDroitsEffectif * (1/7); // Proportion transcription
  const droitsEnregistrement = baseDroits * ratioEnreg;
  const droitsTranscription = baseDroits * ratioTransc;
  const droitsTotal = droitsEnregistrement + droitsTranscription;

  // Bëllegen Akt
  let creditBellegenAkt = 0;
  if (input.residencePrincipale) {
    const maxCredit = input.nbAcquereurs * BELLEGEN_AKT_PAR_PERSONNE;
    creditBellegenAkt = Math.min(maxCredit, droitsTotal);
  }
  const droitsApresCredit = Math.max(0, droitsTotal - creditBellegenAkt);

  // TVA
  let tauxTva = 0;
  let montantTva = 0;
  let faveurFiscaleTva = 0;
  let tvaApplicable = 0;

  if (input.estNeuf) {
    const baseConstruction = input.partConstruction || (input.prixBien - (input.partTerrain || 0));
    if (input.residencePrincipale) {
      tauxTva = TVA_TAUX_REDUIT;
      const tvaNormale = baseConstruction * TVA_TAUX_NORMAL;
      const tvaReduite = baseConstruction * TVA_TAUX_REDUIT;
      faveurFiscaleTva = Math.min(TVA_FAVEUR_PLAFOND, tvaNormale - tvaReduite);
      montantTva = tvaNormale - faveurFiscaleTva;
      tvaApplicable = baseConstruction;
    } else {
      tauxTva = TVA_TAUX_NORMAL;
      montantTva = baseConstruction * TVA_TAUX_NORMAL;
      tvaApplicable = baseConstruction;
    }
  }

  // Émoluments notariaux
  const emolumentsNotaire = calculerEmolumentsNotaire(input.prixBien);

  // Frais d'hypothèque (inscription + émoluments notaire hypothèque)
  const montantHyp = input.montantHypotheque || 0;
  const droitsHypotheque = montantHyp * 0.005; // 0,5% droit d'inscription
  const fraisHypotheque = droitsHypotheque + calculerEmolumentsNotaire(montantHyp) * 0.5;

  // Totaux
  const totalFrais = droitsApresCredit + montantTva + emolumentsNotaire + fraisHypotheque;
  const coutTotalAcquisition = input.prixBien + totalFrais;
  const totalPourcentage = input.prixBien > 0 ? totalFrais / input.prixBien : 0;

  return {
    baseDroits,
    droitsEnregistrement,
    droitsTranscription,
    droitsTotal,
    creditBellegenAkt,
    droitsApresCredit,
    tvaApplicable,
    tauxTva,
    montantTva,
    faveurFiscaleTva,
    emolumentsNotaire,
    fraisHypotheque,
    droitsHypotheque,
    totalFrais,
    totalPourcentage,
    coutTotalAcquisition,
  };
}

// ============================================================
// CALCUL IMPÔT PROGRESSIF (BARÈME IR LU — CLASSE 1)
// ============================================================

/** Calcule l'impôt dû sur un revenu imposable selon le barème progressif classe 1 */
export function calculerImpotBareme(revenuImposable: number): number {
  let impot = 0;
  let seuil = 0;
  for (const tranche of BAREME_IR_CLASSE1) {
    const largeur = tranche.limite - seuil;
    const montantDansTranche = Math.min(Math.max(revenuImposable - seuil, 0), largeur);
    impot += montantDansTranche * tranche.taux;
    seuil = tranche.limite;
    if (revenuImposable <= seuil) break;
  }
  return impot;
}

/** Taux moyen d'imposition pour un revenu donné */
export function tauxMoyenIR(revenuImposable: number): number {
  if (revenuImposable <= 0) return 0;
  return calculerImpotBareme(revenuImposable) / revenuImposable;
}

/**
 * Calcule l'impôt sur un gain de spéculation (taux global = barème progressif).
 * Si revenuImposable est fourni : calcul du taux marginal réel.
 * Sinon : estimation à 40% (taux marginal max).
 */
function impotSpeculation(gainImposable: number, revenuImposable?: number): { impot: number; taux: number; estEstimation: boolean } {
  if (gainImposable <= 0) return { impot: 0, taux: 0, estEstimation: false };
  if (revenuImposable != null && revenuImposable > 0) {
    const impotSansGain = calculerImpotBareme(revenuImposable);
    const impotAvecGain = calculerImpotBareme(revenuImposable + gainImposable);
    const impot = impotAvecGain - impotSansGain;
    const taux = impot / gainImposable;
    return { impot, taux, estEstimation: false };
  }
  return { impot: gainImposable * 0.40, taux: 0.40, estEstimation: true };
}

/**
 * Calcule l'impôt sur un gain de cession (demi-taux global).
 * Art. 130(4) LIR : impôt = gain × (taux moyen global / 2).
 * Si revenuImposable est fourni : calcul du demi-taux réel.
 * Sinon : estimation à 20%.
 */
function impotCession(gainImposable: number, revenuImposable?: number): { impot: number; taux: number; estEstimation: boolean } {
  if (gainImposable <= 0) return { impot: 0, taux: 0, estEstimation: false };
  if (revenuImposable != null && revenuImposable > 0) {
    const revenuTotal = revenuImposable + gainImposable;
    const tauxGlobal = tauxMoyenIR(revenuTotal);
    const demiTaux = tauxGlobal / 2;
    const impot = gainImposable * demiTaux;
    return { impot, taux: demiTaux, estEstimation: false };
  }
  return { impot: gainImposable * 0.20, taux: 0.20, estEstimation: true };
}

// ============================================================
// MODULE 3 — PLUS-VALUES IMMOBILIÈRES
// ============================================================

export interface PlusValueInput {
  prixAcquisition: number;
  anneeAcquisition: number;
  prixCession: number;
  anneeCession: number;
  fraisAcquisition?: number; // Frais déductibles à l'acquisition
  travauxDeductibles?: number; // Travaux de plus-value
  estResidencePrincipale: boolean;
  estCouple: boolean;
  revenuImposable?: number; // Pour calcul taux global (spéculation)
  modeAcquisition?: "achat" | "succession" | "donation";
}

export interface PlusValueResult {
  typeGain: "speculation" | "cession" | "exonere";
  dureeDetention: number;
  prixAcquisitionRevalorise: number;
  coefficient: number;
  fraisForfaitaires: number;
  gainBrut: number;
  abattement: number;
  gainImposable: number;
  estimationImpot: number;
  tauxEffectif: number;
  netApresImpot: number; // Produit net = prix cession - prix acquisition - impôt
  explication: string;
}

export function calculerPlusValue(input: PlusValueInput): PlusValueResult {
  const dureeDetention = input.anneeCession - input.anneeAcquisition;
  const mode = input.modeAcquisition || "achat";

  // Label du prix d'acquisition selon le mode
  const prixLabel =
    mode === "succession"
      ? "Valeur successorale déclarée (art. 102 LIR)"
      : mode === "donation"
      ? "Valeur déclarée dans l'acte de donation (art. 102 LIR)"
      : "Prix d'acquisition";

  // Exonération résidence principale
  if (input.estResidencePrincipale) {
    return {
      typeGain: "exonere",
      dureeDetention,
      prixAcquisitionRevalorise: input.prixAcquisition,
      coefficient: 1,
      fraisForfaitaires: 0,
      gainBrut: input.prixCession - input.prixAcquisition,
      abattement: 0,
      gainImposable: 0,
      estimationImpot: 0,
      tauxEffectif: 0,
      netApresImpot: input.prixCession - input.prixAcquisition,
      explication:
        mode === "succession"
          ? "Exonération totale : résidence principale occupée effectivement et de manière continue. Base d'acquisition = valeur successorale déclarée (art. 102 LIR)."
          : mode === "donation"
          ? "Exonération totale : résidence principale occupée effectivement et de manière continue. Base d'acquisition = valeur déclarée dans l'acte de donation (art. 102 LIR)."
          : "Exonération totale : résidence principale occupée effectivement et de manière continue depuis l'acquisition ou pendant les 5 années précédant la cession.",
    };
  }

  // Spéculation (≤ 2 ans)
  if (dureeDetention <= SEUIL_SPECULATION_ANNEES) {
    const fraisDeductibles = (input.fraisAcquisition || 0) + (input.travauxDeductibles || 0);
    const gainBrut = input.prixCession - input.prixAcquisition - fraisDeductibles;
    const gainImposable = Math.max(0, gainBrut);
    // Taux global (barème progressif) — calcul réel si revenu connu, sinon estimation 40%
    const { impot: estimationImpot, taux: tauxEffectif, estEstimation } = impotSpeculation(gainImposable, input.revenuImposable);

    const modeExplication =
      mode === "succession"
        ? ` Base d'acquisition = valeur successorale déclarée (art. 102 LIR).`
        : mode === "donation"
        ? ` Base d'acquisition = valeur déclarée dans l'acte de donation (art. 102 LIR).`
        : "";

    const tauxExplication = estEstimation
      ? `Estimation au taux marginal max de 40% (renseignez votre revenu imposable pour un calcul précis).`
      : `Taux marginal effectif de ${formatPct(tauxEffectif)} calculé selon le barème IR classe 1.`;

    return {
      typeGain: "speculation",
      dureeDetention,
      prixAcquisitionRevalorise: input.prixAcquisition,
      coefficient: 1,
      fraisForfaitaires: fraisDeductibles,
      gainBrut,
      abattement: 0,
      gainImposable,
      estimationImpot,
      tauxEffectif,
      netApresImpot: input.prixCession - input.prixAcquisition - estimationImpot,
      explication: `Gain de spéculation (détention ≤ 2 ans). Imposé au taux global (barème progressif). ${tauxExplication}${modeExplication}`,
    };
  }

  // Cession longue durée (> 2 ans)
  const coefficient = getCoefficient(input.anneeAcquisition);
  const prixAcquisitionRevalorise = input.prixAcquisition * coefficient;
  const fraisForfaitaires = (input.fraisAcquisition || 0) + (input.travauxDeductibles || 0);
  const gainBrut = input.prixCession - prixAcquisitionRevalorise - fraisForfaitaires;
  const abattement = input.estCouple ? ABATTEMENT_CESSION_COUPLE : ABATTEMENT_CESSION;
  const gainImposable = Math.max(0, gainBrut - abattement);
  // Demi-taux global (art. 130(4) LIR) — calcul réel si revenu connu, sinon estimation 20%
  const { impot: estimationImpot, taux: tauxEffectif, estEstimation } = impotCession(gainImposable, input.revenuImposable);

  const modeExplication =
    mode === "succession"
      ? ` Base d'acquisition = valeur successorale déclarée (art. 102 LIR).`
      : mode === "donation"
      ? ` Base d'acquisition = valeur déclarée dans l'acte de donation (art. 102 LIR).`
      : "";

  const tauxExplication = estEstimation
    ? `Imposé au demi-taux global (estimation ~20% — renseignez votre revenu imposable pour un calcul précis).`
    : `Imposé au demi-taux global de ${formatPct(tauxEffectif)} (art. 130(4) LIR, barème classe 1).`;

  return {
    typeGain: "cession",
    dureeDetention,
    prixAcquisitionRevalorise,
    coefficient,
    fraisForfaitaires,
    gainBrut,
    abattement,
    gainImposable,
    estimationImpot,
    tauxEffectif,
    netApresImpot: input.prixCession - input.prixAcquisition - estimationImpot,
    explication: `Gain de cession (détention > 2 ans). ${prixLabel} revalorisé${mode === "achat" ? " par le coefficient" : " (coefficient"} ${coefficient.toFixed(2)}${mode !== "achat" ? ")" : ""}. Abattement décennal de ${formatEUR(abattement)}. ${tauxExplication}${modeExplication}`,
  };
}

// ============================================================
// MODULE 4 — SIMULATEUR D'AIDES
// ============================================================

export interface AidesInput {
  typeProjet: "acquisition" | "construction" | "renovation";
  prixBien: number;
  montantTravaux?: number;
  revenuMenage: number;
  nbEmprunteurs: 1 | 2;
  nbEnfants: number;
  typeBien: "appartement" | "maison_rangee" | "maison_jumelee" | "maison_isolee";
  residencePrincipale: boolean;
  commune?: string;
  estNeuf: boolean;
  montantPret?: number;
  epargneReguliere3ans?: boolean;
}

export interface AideDetail {
  nom: string;
  categorie: "etatique_acquisition" | "etatique_energie" | "privee" | "communale" | "patrimoine";
  montant: number;
  description: string;
  conditions: string;
  nature: "directe" | "economie" | "garantie";
  source?: string; // Référence légale / lien
  lastVerified?: string; // YYYY-MM-DD : date de dernière vérification du barème
}

export interface AidesResult {
  aides: AideDetail[];
  totalParCategorie: Record<string, number>;
  totalAidesDirectes: number; // Cash effectivement reçu ou économisé
  totalEconomies: number; // Coûts évités (subventions intérêt, bonifications)
  garantieEtat: { montantGaranti: number; economieEstimee: number } | null;
  totalGeneral: number; // Directes + économies (hors garantie brute)
}

export function simulerAides(input: AidesInput): AidesResult {
  const aides: AideDetail[] = [];

  if (!input.residencePrincipale) {
    return { aides: [], totalParCategorie: {}, totalAidesDirectes: 0, totalEconomies: 0, garantieEtat: null, totalGeneral: 0 };
  }

  // --- COUCHE 1 : Aides étatiques acquisition ---

  // Bëllegen Akt
  if (input.typeProjet !== "renovation") {
    const droitsEstimes = input.prixBien * TAUX_DROITS_TOTAL;
    const creditMax = input.nbEmprunteurs * BELLEGEN_AKT_PAR_PERSONNE;
    const credit = Math.min(creditMax, droitsEstimes);
    aides.push({
      nom: "Bëllegen Akt",
      categorie: "etatique_acquisition",
      montant: credit,
      description: `Crédit d'impôt de ${formatEUR(BELLEGEN_AKT_PAR_PERSONNE)} par acquéreur sur les droits d'enregistrement`,
      conditions: "Résidence principale, première utilisation du crédit",
      nature: "directe",
      source: "Loi du 22 octobre 2008 (Bëllegen Akt) — guichet.public.lu",
    });
  }

  // Prime d'accession
  if (input.typeProjet !== "renovation") {
    let primeAccession = PRIME_ACCESSION_MAX;
    if (input.typeBien === "appartement" || input.typeBien === "maison_rangee") {
      primeAccession *= (1 + PRIME_ACCESSION_MAJORATION_COPROPRIETE);
    } else if (input.typeBien === "maison_jumelee") {
      primeAccession *= (1 + PRIME_ACCESSION_MAJORATION_JUMELEE);
    }
    aides.push({
      nom: "Prime d'accession à la propriété",
      categorie: "etatique_acquisition",
      montant: primeAccession,
      description: `Max ${formatEUR(PRIME_ACCESSION_MAX)}, majorée selon le type de bien`,
      conditions: "Sous conditions de revenus, résidence principale",
      nature: "directe",
      source: "Loi modifiée du 25 février 1979 — Aide au logement, art. 14bis",
    });
  }

  // Prime d'épargne
  if (input.epargneReguliere3ans && input.typeProjet !== "renovation") {
    aides.push({
      nom: "Prime d'épargne",
      categorie: "etatique_acquisition",
      montant: PRIME_EPARGNE_MAX,
      description: "Prime unique de 5 000 € si 90% de l'épargne est investie",
      conditions: "Épargne régulière pendant min. 3 ans, 90% investie dans l'acquisition",
      nature: "directe",
      source: "Loi modifiée du 25 février 1979 — Aide au logement, art. 15",
    });
  }

  // Subvention d'intérêt
  if (input.montantPret && input.montantPret > 0) {
    const montantSubventionne = Math.min(
      input.montantPret,
      SUBVENTION_INTERET_MONTANT_BASE + input.nbEnfants * SUBVENTION_INTERET_PAR_ENFANT
    );
    const montantMax = Math.min(montantSubventionne, SUBVENTION_INTERET_MONTANT_MAX);
    // Estimation moyenne 1,5% sur 25 ans
    const economieEstimee = montantMax * 0.015 * 25;
    aides.push({
      nom: "Subvention d'intérêt",
      categorie: "etatique_acquisition",
      montant: economieEstimee,
      description: `Réduction de 0,25% à 3,5% sur un prêt de max ${formatEUR(montantMax)} — économie estimée sur la durée du prêt`,
      conditions: "Sous conditions de revenus, résidence principale",
      nature: "economie",
      source: "Loi modifiée du 25 février 1979 — Aide au logement, art. 10-13 (subvention d'intérêt)",
    });
  }

  // Bonification d'intérêt (enfants)
  if (input.nbEnfants > 0 && input.montantPret && input.montantPret > 0) {
    const tauxBonif = Math.min(input.nbEnfants * BONIFICATION_PAR_ENFANT, BONIFICATION_PLAFOND);
    const economieEstimee = (input.montantPret * tauxBonif) * 10; // ~10 ans effet moyen
    aides.push({
      nom: "Bonification d'intérêt",
      categorie: "etatique_acquisition",
      montant: economieEstimee,
      description: `Réduction de ${(tauxBonif * 100).toFixed(1)}% (${input.nbEnfants} enfant(s) × 0,5%, max 3%) — économie estimée sur ~10 ans`,
      conditions: "Par enfant à charge, plafonnée à 3%",
      nature: "economie",
      source: "Loi modifiée du 25 février 1979 — Aide au logement, art. 14 (bonification)",
    });
  }

  // Garantie de l'État — PAS une aide directe, c'est une caution publique
  // Le bénéfice réel = coût de la caution bancaire privée évitée (~1,5% du montant garanti)
  let garantieEtat: { montantGaranti: number; economieEstimee: number } | null = null;
  if (input.epargneReguliere3ans && input.montantPret) {
    const plafondRevenu = input.nbEmprunteurs > 1 ? GARANTIE_REVENU_PLAFOND_MULTI : GARANTIE_REVENU_PLAFOND_SEUL;
    if (input.revenuMenage <= plafondRevenu) {
      const partieEligible = Math.max(0, input.montantPret - input.prixBien * GARANTIE_ETAT_SEUIL_LTV);
      const garantieMax = Math.min(GARANTIE_ETAT_MAX, input.prixBien * GARANTIE_ETAT_PLAFOND_PCT);
      const montantGaranti = Math.min(partieEligible, garantieMax);
      if (montantGaranti > 0) {
        // Économie = coût évité d'une caution privée (~1,5% one-shot)
        const economieEstimee = montantGaranti * 0.015;
        garantieEtat = { montantGaranti, economieEstimee };
      }
    }
  }

  // TVA 3%
  if (input.estNeuf) {
    aides.push({
      nom: "TVA super-réduite 3%",
      categorie: "etatique_acquisition",
      montant: TVA_FAVEUR_PLAFOND,
      description: `Faveur fiscale max ${formatEUR(TVA_FAVEUR_PLAFOND)} (différence entre 17% et 3%)`,
      conditions: "Résidence principale, logement neuf",
      nature: "directe",
      source: "Loi TVA modifiée — Annexe B, pos. 12 (taux super-réduit 3% logement)",
    });
  }

  // --- COUCHE 2 : Aides rénovation énergie ---
  if (input.montantTravaux && input.montantTravaux > 0) {
    aides.push({
      nom: "Klimabonus",
      categorie: "etatique_energie",
      montant: input.montantTravaux * 0.5,
      description: "Jusqu'à 62,5% des travaux de rénovation énergétique (25% pour 1 classe, 37,5% pour 2, 50% pour 3, 62,5% pour 4+)",
      conditions: "Logement de plus de 10 ans, audit énergétique obligatoire par conseiller agréé",
      nature: "directe",
      source: "RGD du 23 décembre 2016 mod. — Klimabonus (klima-agence.lu)",
    });

    aides.push({
      nom: "Subvention conseil en énergie",
      categorie: "etatique_energie",
      montant: 1_500,
      description: "1 500 € pour l'audit énergétique obligatoire",
      conditions: "Audit par conseiller agréé (liste sur klima-agence.lu)",
      nature: "directe",
      source: "RGD du 23 décembre 2016 mod. — art. 9 (conseil en énergie)",
    });

    aides.push({
      nom: "Topup Klimabonus (Ministère Logement)",
      categorie: "etatique_energie",
      montant: input.montantTravaux * 0.1,
      description: "Prime complémentaire de 10% à 100% du Klimabonus initial, selon les revenus du ménage",
      conditions: "Sous conditions de revenus (plafond modulé selon la composition du ménage)",
      nature: "directe",
      source: "RGD du 23 décembre 2016 mod. — art. 5bis (complément social)",
    });
  }

  // Klimaprêt (financement à taux réduit)
  if (input.montantTravaux && input.montantTravaux > 0) {
    const klimabonusTotal = aides.filter(a => a.nom.includes("Klimabonus") || a.nom.includes("Subvention conseil")).reduce((s, a) => s + a.montant, 0);
    const resteACharge = Math.max(input.montantTravaux - klimabonusTotal, 0);
    const montantKlimapret = Math.min(resteACharge, 100_000);
    if (montantKlimapret > 0) {
      // Économie = différence d'intérêts Klimaprêt 1,5% vs marché ~4% sur 15 ans
      const dureeMois = 180;
      const rKlima = 0.015 / 12;
      const rMarche = 0.04 / 12;
      const mensKlima = montantKlimapret * rKlima / (1 - Math.pow(1 + rKlima, -dureeMois));
      const mensMarche = montantKlimapret * rMarche / (1 - Math.pow(1 + rMarche, -dureeMois));
      const economieInterets = Math.round((mensMarche - mensKlima) * dureeMois);
      aides.push({
        nom: "Klimaprêt (taux 1,5%)",
        categorie: "etatique_energie",
        montant: economieInterets,
        description: `Prêt ${formatEUR(montantKlimapret)} à 1,5% au lieu de ~4% marché. Économie d'intérêts sur 15 ans. Aucune avance de fonds.`,
        conditions: "Max 100 000 €, durée max 15 ans, résidence principale",
        nature: "economie",
        source: "Loi du 23 décembre 2016 mod. — Klimaprêt (guichet.public.lu)",
      });
    }
  }

  // TVA super-réduite 3% sur travaux de rénovation (résidence principale)
  if (input.montantTravaux && input.montantTravaux > 0 && input.residencePrincipale) {
    const faveurTVA = Math.min(input.montantTravaux * 0.14, 50_000); // diff 17% - 3% = 14%, plafonnée
    aides.push({
      nom: "TVA 3% sur travaux de rénovation",
      categorie: "etatique_acquisition",
      montant: faveurTVA,
      description: "TVA réduite à 3% au lieu de 17% pour travaux sur résidence principale (> 20 ans)",
      conditions: "Résidence principale, logement de plus de 20 ans, plafond faveur 50 000 €",
      nature: "directe",
      source: "Loi TVA modifiée — Annexe B, pos. 13 (taux super-réduit 3%)",
    });
  }

  // --- COUCHE 3 : Aides privées ---
  if (input.montantTravaux && input.montantTravaux > 0) {
    aides.push({
      nom: "Enoprimes (fournisseurs énergie)",
      categorie: "privee",
      montant: input.montantTravaux * 0.05,
      description: "Primes des fournisseurs d'énergie (Enovos, Sudstroum, etc.), cumulables avec Klimabonus",
      conditions: "Selon le type de travaux et le fournisseur — demander un devis",
      nature: "directe",
      source: "Mécanisme d'obligations (loi du 5 août 1993 mod.) — enoprimes.lu",
    });
  }

  // --- COUCHE 4 : Aides communales (données vérifiées) ---
  if (input.montantTravaux && input.montantTravaux > 0) {
    const COMMUNES_AIDES: Record<string, { pct: number; max?: number; forfait?: number; desc: string }> = {
      "Luxembourg":       { pct: 0.50,                 desc: "50% de l'aide étatique (isolation, fenêtres) — vdl.lu" },
      "Esch-sur-Alzette": { pct: 0.20,                 desc: "20% de l'aide étatique (isolation, PV, PAC) — administration.esch.lu" },
      "Differdange":      { pct: 0.40,                 desc: "40% de la subvention étatique — differdange.lu" },
      "Dudelange":        { pct: 0.25,                 desc: "25% de l'aide étatique (isolation, solaire, PAC) — dudelange.lu" },
      "Bertrange":        { pct: 0.25,                 desc: "25% de l'aide étatique (énergie/renouvelable) — bertrange.lu" },
      "Hesperange":       { pct: 0.35, max: 8_500,     desc: "35% de l'aide étatique (max 8 500 €) — hesperange.lu" },
      "Bettembourg":      { pct: 0.10, max: 560,       desc: "10% de l'aide étatique (max 560 €) — bettembourg.lu" },
      "Mamer":            { pct: 0.30, max: 7_200,     desc: "30% de l'aide étatique (max 7 200 €) — mamer.lu" },
      "Strassen":         { pct: 0.30,                 desc: "30% de l'aide étatique (assainissement énergétique) — strassen.lu" },
      "Lintgen":          { pct: 0.50, max: 1_500,     desc: "50% de l'aide étatique (max 1 500 €) — bauerenergie.lu" },
      "Junglinster":      { pct: 0.20,                 desc: "20% de l'aide étatique (isolation, PV) — junglinster.lu" },
      "Sandweiler":       { pct: 0.30, max: 7_200,     desc: "30% de l'aide étatique (max 7 200 €) — sandweiler.lu" },
      "Kayl":             { pct: 0.10,                 desc: "10% de l'aide étatique (isolation) — kayl.lu" },
      "Pétange":          { pct: 0.00, forfait: 500,   desc: "Montant fixe de 500 € — bauerenergie.lu" },
    };

    const commune = input.commune || "";
    const communeData = COMMUNES_AIDES[commune];
    let montantCommunal: number;

    if (communeData) {
      montantCommunal = communeData.forfait ?? input.montantTravaux * communeData.pct;
      if (communeData.max != null) {
        montantCommunal = Math.min(montantCommunal, communeData.max);
      }
    } else {
      montantCommunal = input.montantTravaux * 0.05; // défaut 5%
    }

    const descCommunale = communeData?.desc
      || "Variable selon la commune — estimation ~5% du montant des travaux";
    const sourceCommunale = communeData
      ? `Règlement communal de ${commune} — données vérifiées`
      : "Règlement communal — contacter le service urbanisme/logement de votre commune";

    aides.push({
      nom: "Aide communale rénovation",
      categorie: "communale",
      montant: montantCommunal,
      description: descCommunale,
      conditions: `Commune : ${commune || "non précisée"} — vérifier les règles locales`,
      nature: "directe",
      source: sourceCommunale,
    });
  }

  // Dernières vérifications des barèmes par aide (YYYY-MM-DD)
  // Source : Mémorial A + guichet.public.lu + klima-agence.lu
  const AIDE_LAST_VERIFIED: Record<string, string> = {
    "Bëllegen Akt": "2026-04-17",
    "Prime d'accession à la propriété": "2026-04-17",
    "Prime d'épargne": "2026-04-17",
    "Subvention d'intérêt": "2026-04-17",
    "Bonification d'intérêt": "2026-04-17",
    "TVA super-réduite 3%": "2026-04-17",
    "Klimabonus": "2026-04-17",
    "Subvention conseil en énergie": "2026-04-17",
    "Topup Klimabonus (Ministère Logement)": "2026-04-17",
    "Klimaprêt (taux 1,5%)": "2026-04-17",
    "TVA 3% sur travaux de rénovation": "2026-04-17",
    "Enoprimes (fournisseurs énergie)": "2026-04-17",
    "Aide communale rénovation": "2026-04-17",
  };
  for (const aide of aides) {
    aide.lastVerified = AIDE_LAST_VERIFIED[aide.nom] ?? "2026-04-17";
  }

  // Calcul totaux — séparés par nature
  const totalParCategorie: Record<string, number> = {};
  let totalAidesDirectes = 0;
  let totalEconomies = 0;
  for (const aide of aides) {
    totalParCategorie[aide.categorie] = (totalParCategorie[aide.categorie] || 0) + aide.montant;
    if (aide.nature === "directe") {
      totalAidesDirectes += aide.montant;
    } else {
      totalEconomies += aide.montant;
    }
  }
  // Ajouter l'économie de la garantie aux économies
  if (garantieEtat) {
    totalEconomies += garantieEtat.economieEstimee;
  }
  const totalGeneral = totalAidesDirectes + totalEconomies;

  return { aides, totalParCategorie, totalAidesDirectes, totalEconomies, garantieEtat, totalGeneral };
}

// ============================================================
// MODULE 5 — OUTILS BANCAIRES
// ============================================================

export interface LTVInput {
  valeurBien: number;
  montantPret: number;
}

export interface CapaciteEmpruntInput {
  revenuNetMensuel: number;
  chargesMensuelles: number;
  tauxEndettementMax: number; // ex: 0.40
  tauxInteret: number; // ex: 0.035 pour 3,5%
  dureeAnnees: number;
}

export interface AmortissementLigne {
  mois: number;
  mensualite: number;
  capital: number;
  interets: number;
  capitalRestant: number;
}

export interface DSCRInput {
  revenuLocatifAnnuel: number;
  chargesAnnuelles: number; // Charges exploitation
  serviceDetteAnnuel: number; // Capital + intérêts annuels
}

export function calculerLTV(input: LTVInput): number {
  return input.valeurBien > 0 ? input.montantPret / input.valeurBien : 0;
}

export function calculerMensualite(capital: number, tauxAnnuel: number, dureeAnnees: number): number {
  const tauxMensuel = tauxAnnuel / 12;
  const nbMois = dureeAnnees * 12;
  if (tauxMensuel === 0) return capital / nbMois;
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
}

export function calculerCapaciteEmprunt(input: CapaciteEmpruntInput): {
  capaciteEmprunt: number;
  mensualiteMax: number;
} {
  const mensualiteMax = input.revenuNetMensuel * input.tauxEndettementMax - input.chargesMensuelles;
  const tauxMensuel = input.tauxInteret / 12;
  const nbMois = input.dureeAnnees * 12;

  let capaciteEmprunt: number;
  if (tauxMensuel === 0) {
    capaciteEmprunt = mensualiteMax * nbMois;
  } else {
    capaciteEmprunt = mensualiteMax * (Math.pow(1 + tauxMensuel, nbMois) - 1) / (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois));
  }

  return {
    capaciteEmprunt: Math.max(0, capaciteEmprunt),
    mensualiteMax: Math.max(0, mensualiteMax),
  };
}

export function genererTableauAmortissement(
  capital: number,
  tauxAnnuel: number,
  dureeAnnees: number
): AmortissementLigne[] {
  const mensualite = calculerMensualite(capital, tauxAnnuel, dureeAnnees);
  const tauxMensuel = tauxAnnuel / 12;
  const nbMois = dureeAnnees * 12;
  const tableau: AmortissementLigne[] = [];
  let capitalRestant = capital;

  for (let mois = 1; mois <= nbMois; mois++) {
    const interets = capitalRestant * tauxMensuel;
    const capitalRembourse = mensualite - interets;
    capitalRestant = Math.max(0, capitalRestant - capitalRembourse);

    tableau.push({
      mois,
      mensualite,
      capital: capitalRembourse,
      interets,
      capitalRestant,
    });
  }

  return tableau;
}

export function calculerDSCR(input: DSCRInput): number {
  const noi = input.revenuLocatifAnnuel - input.chargesAnnuelles;
  return input.serviceDetteAnnuel > 0 ? noi / input.serviceDetteAnnuel : 0;
}

export interface PrepaymentInput {
  capital: number;
  tauxAnnuel: number;   // ex: 0.035
  dureeAnnees: number;
  moisPrepaiement: number;  // 1-based, entre 1 et dureeAnnees*12
  montantRembourse: number;
  penaliteMoisInterets: number; // LU : max 6 mois d'intérêts sur le montant remboursé
  strategie: "reduire_duree" | "reduire_mensualite";
}

export interface PrepaymentResult {
  mensualiteInitiale: number;
  capitalRestantAvant: number;   // juste avant le remboursement anticipé, au mois N
  capitalRestantApres: number;
  interetsRestantsAvant: number; // intérêts qui auraient été payés sur la durée résiduelle sans RA
  interetsRestantsApres: number;
  gainInterets: number;
  penalite: number;
  gainNet: number;
  nouvelleMensualite: number;
  nouvelleDureeMois: number;
  breakEvenMois: number | null; // mois min à garder le crédit pour que le RA soit rentable
}

export function simulerRemboursementAnticipe(input: PrepaymentInput): PrepaymentResult {
  const {
    capital,
    tauxAnnuel,
    dureeAnnees,
    moisPrepaiement,
    montantRembourse,
    penaliteMoisInterets,
    strategie,
  } = input;

  const tauxMensuel = tauxAnnuel / 12;
  const nbMoisTotal = Math.round(dureeAnnees * 12);
  const mensualiteInitiale = calculerMensualite(capital, tauxAnnuel, dureeAnnees);

  const moisN = Math.max(1, Math.min(nbMoisTotal, Math.round(moisPrepaiement)));

  let capitalRestantAvant = capital;
  for (let m = 1; m <= moisN; m++) {
    const i = capitalRestantAvant * tauxMensuel;
    const c = mensualiteInitiale - i;
    capitalRestantAvant = Math.max(0, capitalRestantAvant - c);
  }

  const montantEffectif = Math.max(0, Math.min(montantRembourse, capitalRestantAvant));
  const capitalRestantApres = capitalRestantAvant - montantEffectif;

  let interetsRestantsAvantRA = 0;
  let cr = capitalRestantAvant;
  for (let m = moisN + 1; m <= nbMoisTotal; m++) {
    const i = cr * tauxMensuel;
    const c = mensualiteInitiale - i;
    cr = Math.max(0, cr - c);
    interetsRestantsAvantRA += i;
  }

  const moisResiduels = nbMoisTotal - moisN;
  let nouvelleMensualite = mensualiteInitiale;
  let nouvelleDureeMois = moisResiduels;
  let interetsRestantsApresRA = 0;

  if (capitalRestantApres <= 0) {
    nouvelleMensualite = 0;
    nouvelleDureeMois = 0;
    interetsRestantsApresRA = 0;
  } else if (strategie === "reduire_mensualite") {
    nouvelleDureeMois = moisResiduels;
    if (tauxMensuel === 0) {
      nouvelleMensualite = capitalRestantApres / moisResiduels;
    } else {
      nouvelleMensualite =
        capitalRestantApres *
        (tauxMensuel * Math.pow(1 + tauxMensuel, moisResiduels)) /
        (Math.pow(1 + tauxMensuel, moisResiduels) - 1);
    }
    let cr2 = capitalRestantApres;
    for (let m = 1; m <= moisResiduels; m++) {
      const i = cr2 * tauxMensuel;
      const c = nouvelleMensualite - i;
      cr2 = Math.max(0, cr2 - c);
      interetsRestantsApresRA += i;
    }
  } else {
    // reduire_duree : on conserve la mensualité initiale, on réduit nb mois
    nouvelleMensualite = mensualiteInitiale;
    let cr2 = capitalRestantApres;
    let m = 0;
    while (cr2 > 0.01 && m < moisResiduels) {
      m++;
      const i = cr2 * tauxMensuel;
      const c = Math.min(mensualiteInitiale - i, cr2);
      cr2 = Math.max(0, cr2 - c);
      interetsRestantsApresRA += i;
    }
    nouvelleDureeMois = m;
  }

  const gainInterets = interetsRestantsAvantRA - interetsRestantsApresRA;
  // Indemnité de remploi LU : min(6 mois d'intérêts au taux, plafond légal).
  // On l'exprime ici en « N mois d'intérêts sur le montant remboursé ».
  const interetsMensuels = montantEffectif * tauxMensuel;
  const penalite = interetsMensuels * Math.max(0, penaliteMoisInterets);
  const gainNet = gainInterets - penalite;

  // Break-even : combien de mois de remboursement anticipé faut-il garder pour que le gain
  // d'intérêts dépasse la pénalité ? On reprend le calcul mois par mois.
  let breakEvenMois: number | null = null;
  if (penalite > 0 && capitalRestantApres > 0) {
    let crAvant = capitalRestantAvant;
    let crApres = capitalRestantApres;
    let cumGain = 0;
    const limMois = strategie === "reduire_duree" ? nouvelleDureeMois : moisResiduels;
    for (let m = 1; m <= Math.max(limMois, 1); m++) {
      const iAvant = crAvant * tauxMensuel;
      const cAvant = mensualiteInitiale - iAvant;
      crAvant = Math.max(0, crAvant - cAvant);

      const iApres = crApres * tauxMensuel;
      const cApres = Math.min(nouvelleMensualite - iApres, crApres);
      crApres = Math.max(0, crApres - cApres);

      cumGain += iAvant - iApres;
      if (cumGain >= penalite) {
        breakEvenMois = m;
        break;
      }
    }
  } else if (penalite === 0 && gainInterets > 0) {
    breakEvenMois = 1;
  }

  return {
    mensualiteInitiale,
    capitalRestantAvant,
    capitalRestantApres,
    interetsRestantsAvant: interetsRestantsAvantRA,
    interetsRestantsApres: interetsRestantsApresRA,
    gainInterets,
    penalite,
    gainNet,
    nouvelleMensualite,
    nouvelleDureeMois,
    breakEvenMois,
  };
}
