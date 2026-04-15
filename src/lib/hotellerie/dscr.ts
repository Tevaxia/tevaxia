import type { AmortizationLine, DscrInputs, DscrResult } from "./types";

function pmt(principal: number, monthlyRate: number, nMonths: number): number {
  if (monthlyRate === 0) return principal / nMonths;
  const factor = Math.pow(1 + monthlyRate, nMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function buildAmortization(
  principal: number,
  monthlyRate: number,
  nMonths: number,
  monthlyPayment: number,
): AmortizationLine[] {
  const lines: AmortizationLine[] = [];
  let capitalRestant = principal;
  for (let year = 1; year <= Math.ceil(nMonths / 12); year++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    const monthsThisYear = Math.min(12, nMonths - (year - 1) * 12);
    for (let m = 0; m < monthsThisYear; m++) {
      const interest = capitalRestant * monthlyRate;
      const principalPaid = monthlyPayment - interest;
      yearInterest += interest;
      yearPrincipal += principalPaid;
      capitalRestant -= principalPaid;
    }
    lines.push({
      annee: year,
      capitalRestant: Math.max(0, capitalRestant),
      capitalRembourse: yearPrincipal,
      interets: yearInterest,
      totalAnnuel: yearInterest + yearPrincipal,
    });
  }
  return lines;
}

export function computeHotelDscr(input: DscrInputs): DscrResult {
  if (input.prixAcquisition <= 0) throw new Error("prixAcquisition must be > 0");
  if (input.travaux < 0) throw new Error("travaux must be >= 0");
  if (input.apport < 0) throw new Error("apport must be >= 0");
  if (input.tauxInteretAnnuel < 0 || input.tauxInteretAnnuel > 0.30) {
    throw new Error("tauxInteretAnnuel must be a decimal between 0 and 0.30");
  }
  if (input.dureeAns <= 0 || input.dureeAns > 40) {
    throw new Error("dureeAns must be between 1 and 40");
  }

  const totalProjet = input.prixAcquisition + input.travaux;
  const montantDette = Math.max(0, totalProjet - input.apport);
  const ltv = montantDette / totalProjet;

  const monthlyRate = input.tauxInteretAnnuel / 12;
  const nMonths = input.dureeAns * 12;
  const mensualite = montantDette > 0 ? pmt(montantDette, monthlyRate, nMonths) : 0;
  const serviceDetteAnnuel = mensualite * 12;

  const dscrCible = input.dscrCible ?? 1.30;
  const dscrCentral = serviceDetteAnnuel > 0 ? input.ebitdaStabilise / serviceDetteAnnuel : Infinity;
  const dscrStressOccupation =
    serviceDetteAnnuel > 0 ? (input.ebitdaStabilise * 0.85) / serviceDetteAnnuel : Infinity;
  const dscrStressADR =
    serviceDetteAnnuel > 0 ? (input.ebitdaStabilise * 0.90) / serviceDetteAnnuel : Infinity;
  const dscrStressDouble =
    serviceDetteAnnuel > 0 ? (input.ebitdaStabilise * 0.75) / serviceDetteAnnuel : Infinity;

  let diagnostic: DscrResult["diagnostic"];
  let diagnosticLabel: string;
  if (dscrCentral < 1.0) {
    diagnostic = "critique";
    diagnosticLabel = "DSCR < 1 — risque de défaut, financement refusé en l'état";
  } else if (dscrCentral < dscrCible) {
    diagnostic = "limite";
    diagnosticLabel = `DSCR insuffisant vs cible ${dscrCible.toFixed(2)} — banque va exiger plus d'apport`;
  } else if (dscrCentral < dscrCible + 0.30) {
    diagnostic = "sain";
    diagnosticLabel = "DSCR conforme — financement bancaire envisageable";
  } else {
    diagnostic = "fort";
    diagnosticLabel = "DSCR confortable — marge de manœuvre pour stress et CAPEX imprévus";
  }

  // Back-solve : montant max empruntable pour atteindre exactement le DSCR cible
  const serviceDetteCible = input.ebitdaStabilise / dscrCible;
  let maxEmpruntable = 0;
  if (serviceDetteCible > 0 && monthlyRate >= 0) {
    if (monthlyRate === 0) {
      maxEmpruntable = (serviceDetteCible / 12) * nMonths;
    } else {
      const factor = Math.pow(1 + monthlyRate, nMonths);
      maxEmpruntable = (serviceDetteCible / 12) * (factor - 1) / (monthlyRate * factor);
    }
  }

  const amortissement = montantDette > 0
    ? buildAmortization(montantDette, monthlyRate, nMonths, mensualite)
    : [];
  const totalInterets = amortissement.reduce((sum, l) => sum + l.interets, 0);
  const coutTotalCredit = montantDette + totalInterets;

  return {
    montantDette,
    ltv,
    mensualite,
    serviceDetteAnnuel,
    dscrCentral,
    dscrStressOccupation,
    dscrStressADR,
    dscrStressDouble,
    diagnostic,
    diagnosticLabel,
    maxEmpruntable,
    coutTotalCredit,
    totalInterets,
    amortissement,
  };
}
