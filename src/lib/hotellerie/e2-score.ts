import type { E2Inputs, E2Result } from "./types";

export function computeE2Score(input: E2Inputs): E2Result {
  if (input.coutTotalProjet <= 0) throw new Error("coutTotalProjet must be > 0");
  if (input.minimumVitalAnnuel <= 0) throw new Error("minimumVitalAnnuel must be > 0");

  const ratioCapital = input.capitalInvesti / input.coutTotalProjet;
  const ratioRevenu = input.revenuPrevisionnelAnnuel / input.minimumVitalAnnuel;
  const redFlags: string[] = [];

  let scoreSubstantiality: number;
  if (ratioCapital >= 0.75) {
    scoreSubstantiality = 30;
  } else if (ratioCapital >= 0.50) {
    scoreSubstantiality = 20;
  } else if (ratioCapital >= 0.30) {
    scoreSubstantiality = 10;
    redFlags.push("Substantiality test : ratio capital/coût total < 50 % — défense difficile");
  } else {
    scoreSubstantiality = 0;
    redFlags.push("Substantiality test : ratio capital/coût total < 30 % — rejet quasi-certain");
  }

  const scoreAtRisk = input.fondsEngages ? 15 : 0;
  if (!input.fondsEngages) {
    redFlags.push("At-risk test : fonds non engagés concrètement (escrow, signature, travaux) — rejet probable");
  }

  let scoreMarginality: number;
  if (ratioRevenu >= 2.0) {
    scoreMarginality = 25;
  } else if (ratioRevenu >= 1.5) {
    scoreMarginality = 18;
  } else if (ratioRevenu >= 1.0) {
    scoreMarginality = 8;
    redFlags.push("Marginality : revenu attendu juste au-dessus du minimum vital — défense au cas par cas");
  } else {
    scoreMarginality = 0;
    redFlags.push("Marginality : revenu prévisionnel < minimum vital — visa rejeté");
  }

  const scoreRealOperating = input.isHotelActif ? 10 : 0;
  if (!input.isHotelActif) {
    redFlags.push("Real & operating : business non actif — non éligible E-2");
  }

  let scoreJobCreation: number;
  if (input.emploisCreesOuMaintenus >= 5) {
    scoreJobCreation = 20;
  } else if (input.emploisCreesOuMaintenus >= 3) {
    scoreJobCreation = 14;
  } else if (input.emploisCreesOuMaintenus >= 1) {
    scoreJobCreation = 7;
  } else {
    scoreJobCreation = 0;
    redFlags.push("Job creation : aucun emploi US créé/maintenu — point d'alerte fort");
  }

  const scoreTotal =
    scoreSubstantiality + scoreAtRisk + scoreMarginality + scoreRealOperating + scoreJobCreation;

  let diagnostic: E2Result["diagnostic"];
  if (scoreTotal < 40) {
    diagnostic = "rejet probable";
  } else if (scoreTotal < 65) {
    diagnostic = "à renforcer";
  } else if (scoreTotal < 85) {
    diagnostic = "favorable";
  } else {
    diagnostic = "très favorable";
  }

  return {
    scoreTotal,
    scoreSubstantiality,
    scoreAtRisk,
    scoreMarginality,
    scoreRealOperating,
    scoreJobCreation,
    ratioCapital,
    ratioRevenu,
    diagnostic,
    redFlags,
  };
}
