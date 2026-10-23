import { calculerMensualite, genererTableauAmortissement } from "./calculations";

export interface AchatLocationInput {
  prixBien: number;
  apport: number;
  tauxCredit: number;
  dureeCredit: number;
  fraisAcquisitionPct: number;
  chargesCoproMensuel: number;
  taxeFonciereAn: number;
  entretienAnPct: number;
  appreciationAn: number;
  tauxAssuranceSRD: number;
  loyerMensuel: number;
  indexationLoyer: number;
  rendementPlacement: number;
  horizon: number;
  anneeSimulation: number;
  anneeDisponibilite: number;
  deductionEligible: boolean;
  nbPersonnes: number;
  tauxMarginalIR: number;
  subventionInteretsAn: number;
}

/** ACD rules in force since 2024. Future years retain these rules as a scenario,
 * not a forecast of legislation. Primary home only, after availability.
 * https://impotsdirects.public.lu/fr/az/h/habit_pers.html
 */
export function plafondInteretsHabitation(annee: number, disponibilite: number, personnes: number): number {
  if (![annee, disponibilite, personnes].every(Number.isInteger) || annee < 2024 || disponibilite > annee || personnes < 1) {
    throw new RangeError("Unsupported interest deduction period or household");
  }
  const age = annee - disponibilite;
  if (age <= 1) return Infinity;
  return (age <= 5 ? 4000 : age <= 10 ? 3000 : 2000) * personnes;
}

export function calculerAchatLocation(p: AchatLocationInput) {
  const numeric = Object.values(p).filter((value): value is number => typeof value === "number");
  const nonNegative = [p.apport, p.tauxCredit, p.fraisAcquisitionPct, p.chargesCoproMensuel,
    p.taxeFonciereAn, p.entretienAnPct, p.tauxAssuranceSRD, p.loyerMensuel, p.tauxMarginalIR, p.subventionInteretsAn];
  if (!numeric.every(Number.isFinite) || nonNegative.some(v => v < 0) || p.prixBien <= 0 || p.prixBien > 1e12 ||
      p.apport > p.prixBien || p.tauxCredit > 30 || p.tauxMarginalIR > 100 ||
      !Number.isInteger(p.horizon) || p.horizon < 1 || p.horizon > 50 ||
      !Number.isInteger(p.dureeCredit * 12) || p.dureeCredit <= 0 || p.dureeCredit > 50 ||
      !Number.isInteger(p.nbPersonnes) || p.nbPersonnes < 1 || p.nbPersonnes > 20 ||
      !Number.isInteger(p.anneeSimulation) || p.anneeSimulation < 2024 || p.anneeSimulation > 2100 ||
      !Number.isInteger(p.anneeDisponibilite) || p.anneeDisponibilite < 1900 || p.anneeDisponibilite > p.anneeSimulation ||
      [p.appreciationAn, p.rendementPlacement, p.indexationLoyer].some(v => v <= -100 || v > 100)) {
    throw new RangeError("Invalid buy-versus-rent scenario");
  }
  const montantCredit = p.prixBien - p.apport;
  const mensualiteCredit = calculerMensualite(montantCredit, p.tauxCredit / 100, p.dureeCredit);
  const amortissement = genererTableauAmortissement(montantCredit, p.tauxCredit / 100, p.dureeCredit);
  const assuranceSRDMensuel = montantCredit * p.tauxAssuranceSRD / 100 / 12;
  const fraisAcquisition = p.prixBien * p.fraisAcquisitionPct / 100;
  const chargesMensuelles = p.chargesCoproMensuel + p.taxeFonciereAn / 12 + p.prixBien * p.entretienAnPct / 100 / 12;
  const rendementMensuel = Math.pow(1 + p.rendementPlacement / 100, 1 / 12) - 1;
  let capitalRestant = montantCredit;
  let placementCapital = p.apport + fraisAcquisition;
  let placementAchat = 0;
  let coutAchatCumule = p.apport + fraisAcquisition;
  let coutLocationCumule = 0;
  let economieFiscaleCumul = 0;
  const annees = [];

  for (let annee = 1; annee <= p.horizon; annee++) {
    const echeances = amortissement.slice((annee - 1) * 12, annee * 12);
    const interetsAnnuels = echeances.reduce((sum, ligne) => sum + ligne.interets, 0);
    const subvention = Math.min(interetsAnnuels, p.subventionInteretsAn);
    const deductionInterets = p.deductionEligible
      ? Math.min(interetsAnnuels - subvention, plafondInteretsHabitation(p.anneeSimulation + annee - 1, p.anneeDisponibilite, p.nbPersonnes))
      : 0;
    const economieFiscaleAnnuelle = deductionInterets * p.tauxMarginalIR / 100;
    const assuranceSRDAnnuel = echeances.length * assuranceSRDMensuel;
    const serviceDetteAnnuel = echeances.reduce((sum, ligne) => sum + ligne.mensualite, 0);
    const coutAchatAnnuel = serviceDetteAnnuel + chargesMensuelles * 12 + assuranceSRDAnnuel - subvention - economieFiscaleAnnuelle;
    const loyer = p.loyerMensuel * Math.pow(1 + p.indexationLoyer / 100, annee - 1);
    // Same monthly budget on both sides: invest the difference on the cheaper
    // side, at month end. Tax/subsidy benefit is spread over the year by assumption.
    for (let mois = 0; mois < 12; mois++) {
      const echeance = echeances[mois];
      const coutAchat = (echeance?.mensualite ?? 0) + chargesMensuelles +
        (echeance ? assuranceSRDMensuel : 0) - (subvention + economieFiscaleAnnuelle) / 12;
      placementCapital = placementCapital * (1 + rendementMensuel) + Math.max(0, coutAchat - loyer);
      placementAchat = placementAchat * (1 + rendementMensuel) + Math.max(0, loyer - coutAchat);
    }
    capitalRestant = echeances.at(-1)?.capitalRestant ?? 0;
    const valeurBien = p.prixBien * Math.pow(1 + p.appreciationAn / 100, annee);
    coutAchatCumule += coutAchatAnnuel;
    coutLocationCumule += loyer * 12;
    economieFiscaleCumul += economieFiscaleAnnuelle;
    annees.push({ annee, coutAchatAnnuel, coutAchatCumule, capitalRestant,
      capitalRembourse: montantCredit - capitalRestant, valeurBien, placementAchat,
      patrimoineNetAchat: valeurBien - capitalRestant + placementAchat, interetsAnnuels,
      deductionInterets, economieFiscaleCumul, assuranceSRDAnnuel, serviceDetteAnnuel, subvention,
      coutLocationCumule, placementCapital, patrimoineNetLocation: placementCapital });
  }
  const croisement = annees.find(a => a.patrimoineNetAchat > a.patrimoineNetLocation);
  let crossoverYear: number | null = null;
  for (let i = 1; i < annees.length; i++) {
    const prev = annees[i - 1], curr = annees[i];
    const before = prev.patrimoineNetAchat - prev.patrimoineNetLocation;
    const after = curr.patrimoineNetAchat - curr.patrimoineNetLocation;
    if (before <= 0 && after > 0) {
      crossoverYear = prev.annee - before / (after - before);
      break;
    }
  }
  return { mensualiteCredit, fraisAcquisition, montantCredit, assuranceSRDMensuel, annees,
    croisement, crossoverYear, derniere: annees[annees.length - 1],
    chartData: annees.map(a => ({ annee: a.annee, achat: Math.round(a.patrimoineNetAchat), location: Math.round(a.patrimoineNetLocation) })) };
}
