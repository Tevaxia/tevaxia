// ============================================================
// DCF MULTI-LOCATAIRES — Modélisation bail par bail
// ============================================================
// Standard ARGUS-like : chaque bail est modélisé individuellement
// avec ses propres dates, loyer, indexation, franchise, renouvellement.

import { calculerIRR } from "./valuation";

export interface Lease {
  id: string;
  locataire: string;
  surface: number; // m²
  loyerAnnuel: number; // Loyer annuel actuel
  dateDebut: string; // YYYY-MM
  dateFin: string; // YYYY-MM
  dateBreak?: string; // YYYY-MM (option de sortie anticipée)
  probabiliteRenouvellement: number; // 0-100%
  ervM2: number; // Loyer de marché estimé au renouvellement (€/m²/an)
  indexation: number; // % annuel d'indexation contractuelle
  stepRents?: { annee: number; nouveauLoyer: number }[]; // Paliers de loyer (année relative + montant)
  franchiseMois: number; // Mois de franchise (rent-free) à l'entrée
  fitOutContribution: number; // Participation aménagement (€)
  chargesLocataire: number; // Charges refacturées annuelles
}

export interface DCFLeaseInput {
  leases: Lease[];
  periodeAnalyse: number; // années
  tauxActualisation: number; // %
  tauxCapSortie: number; // %
  fraisCessionPct: number; // %
  chargesProprietaireFixe: number; // charges non récup annuelles
  vacanceERV: number; // % de vacance appliqué sur les périodes vides
  dateValeur: string; // YYYY-MM
}

export interface DCFLeaseAnnualCF {
  annee: number;
  loyers: number; // Total loyers contractuels
  franchises: number; // Déduction franchises
  chargesRecuperees: number;
  loyerBrutEffectif: number;
  vacanceLots: string[]; // Lots vacants cette année
  loyerVacance: number; // Perte vacance
  chargesProprietaire: number;
  noi: number;
  facteurActu: number;
  noiActualise: number;
}

export interface DCFLeaseResult {
  cashFlows: DCFLeaseAnnualCF[];
  totalNOIActualise: number;
  // Terminal value
  noiStabilise: number; // NOI stabilisé (tous baux renouvelés à ERV)
  valeurTerminaleBrute: number;
  fraisCession: number;
  valeurTerminaleNette: number;
  valeurTerminaleActualisee: number;
  valeurDCF: number;
  irr: number;
  // Métriques
  surfaceTotale: number;
  loyerTotalAnnuel: number;
  loyerMoyenM2: number;
  ervMoyenM2: number;
  tauxOccupation: number; // % de surface louée
  wault: number; // Weighted Average Unexpired Lease Term
  potentielReversion: number; // % ERV vs loyer en place
  // Détail par locataire
  leaseDetails: {
    locataire: string;
    surface: number;
    loyerAnnuel: number;
    loyerM2: number;
    ervM2: number;
    ecartERV: number; // %
    dureeRestante: number; // années
    pctSurface: number;
    pctLoyer: number;
  }[];
}

function monthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split("-").map(Number);
  const [y2, m2] = to.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

function addMonths(date: string, months: number): string {
  const [y, m] = date.split("-").map(Number);
  const totalMonths = (y * 12 + m - 1) + months;
  const newY = Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  return `${newY}-${String(newM).padStart(2, "0")}`;
}

export function calculerDCFLeases(input: DCFLeaseInput): DCFLeaseResult {
  const { leases, periodeAnalyse, tauxActualisation, tauxCapSortie, fraisCessionPct, chargesProprietaireFixe, vacanceERV, dateValeur } = input;

  const surfaceTotale = leases.reduce((s, l) => s + l.surface, 0);
  const loyerTotalAnnuel = leases.reduce((s, l) => s + l.loyerAnnuel, 0);

  // WAULT
  const wault = surfaceTotale > 0
    ? leases.reduce((s, l) => {
        const moisRestants = Math.max(0, monthsBetween(dateValeur, l.dateFin));
        return s + (moisRestants / 12) * l.surface;
      }, 0) / surfaceTotale
    : 0;

  // ERV total
  const ervTotal = leases.reduce((s, l) => s + l.ervM2 * l.surface, 0);
  const ervMoyenM2 = surfaceTotale > 0 ? ervTotal / surfaceTotale : 0;
  const loyerMoyenM2 = surfaceTotale > 0 ? loyerTotalAnnuel / surfaceTotale : 0;
  const potentielReversion = loyerTotalAnnuel > 0 ? ((ervTotal - loyerTotalAnnuel) / loyerTotalAnnuel) * 100 : 0;

  // Cash flows année par année
  const cashFlows: DCFLeaseAnnualCF[] = [];
  let totalNOIActualise = 0;

  for (let a = 1; a <= periodeAnalyse; a++) {
    const anneeDebut = addMonths(dateValeur, (a - 1) * 12);
    const anneeFin = addMonths(dateValeur, a * 12);
    let loyers = 0;
    let franchises = 0;
    let chargesRecuperees = 0;
    let loyerVacance = 0;
    const vacanceLots: string[] = [];

    for (const lease of leases) {
      // Break option: if the current year is past the break date, the tenant
      // may exercise the break with probability (100 - probabiliteRenouvellement)/100.
      // When exercised, the effective end date becomes dateBreak instead of dateFin.
      let effectiveDateFin = lease.dateFin;
      if (lease.dateBreak && lease.dateBreak < lease.dateFin && anneeDebut >= lease.dateBreak) {
        const breakProba = (100 - lease.probabiliteRenouvellement) / 100;
        if (Math.random() < breakProba) {
          effectiveDateFin = lease.dateBreak;
        }
      }

      const bailActif = effectiveDateFin >= anneeDebut && lease.dateDebut < anneeFin;

      if (bailActif) {
        // Loyer indexé
        const anneesDepuisDebut = Math.max(0, monthsBetween(lease.dateDebut, anneeDebut) / 12);
        let loyerIndexe = lease.loyerAnnuel * Math.pow(1 + lease.indexation / 100, anneesDepuisDebut);

        // Step rents: if the current year matches a step rent year, override with the new amount
        if (lease.stepRents && lease.stepRents.length > 0) {
          // Find the most recent step rent that applies (annee is relative year from lease start)
          const anneeRelative = Math.floor(anneesDepuisDebut) + 1;
          const applicableSteps = lease.stepRents
            .filter((sr) => sr.annee <= anneeRelative)
            .sort((a, b) => b.annee - a.annee);
          if (applicableSteps.length > 0) {
            loyerIndexe = applicableSteps[0].nouveauLoyer * Math.pow(1 + lease.indexation / 100, anneesDepuisDebut - (applicableSteps[0].annee - 1));
          }
        }

        loyers += loyerIndexe;
        chargesRecuperees += lease.chargesLocataire;

        // Franchise (première année du bail seulement)
        if (lease.franchiseMois > 0 && a === 1) {
          const moisFranchise = Math.min(lease.franchiseMois, 12);
          franchises += loyerIndexe * (moisFranchise / 12);
        }
      } else {
        // Bail expiré — renouvellement ou vacance ?
        const moisDepuisFin = monthsBetween(effectiveDateFin, anneeDebut);
        if (moisDepuisFin >= 0) {
          if (Math.random() * 100 < lease.probabiliteRenouvellement || lease.probabiliteRenouvellement >= 80) {
            // Renouvelé à l'ERV
            const loyerRenouvele = lease.ervM2 * lease.surface;
            loyers += loyerRenouvele;
          } else {
            // Vacant
            vacanceLots.push(lease.locataire);
            loyerVacance += lease.ervM2 * lease.surface * (1 - vacanceERV / 100);
          }
        }
      }
    }

    const loyerBrutEffectif = loyers - franchises;
    const noi = loyerBrutEffectif + chargesRecuperees - chargesProprietaireFixe - loyerVacance;
    const facteurActu = 1 / Math.pow(1 + tauxActualisation / 100, a);
    const noiActualise = noi * facteurActu;
    totalNOIActualise += noiActualise;

    cashFlows.push({
      annee: a,
      loyers,
      franchises,
      chargesRecuperees,
      loyerBrutEffectif,
      vacanceLots,
      loyerVacance,
      chargesProprietaire: chargesProprietaireFixe,
      noi,
      facteurActu,
      noiActualise,
    });
  }

  // Terminal value — NOI stabilisé (tous à ERV)
  const noiStabilise = ervTotal * (1 - vacanceERV / 100) - chargesProprietaireFixe;
  const valeurTerminaleBrute = tauxCapSortie > 0 ? noiStabilise / (tauxCapSortie / 100) : 0;
  const fraisCession = valeurTerminaleBrute * (fraisCessionPct / 100);
  const valeurTerminaleNette = valeurTerminaleBrute - fraisCession;
  const facteurTerminal = 1 / Math.pow(1 + tauxActualisation / 100, periodeAnalyse);
  const valeurTerminaleActualisee = valeurTerminaleNette * facteurTerminal;

  const valeurDCF = totalNOIActualise + valeurTerminaleActualisee;

  // IRR
  const irrFlows = [-valeurDCF, ...cashFlows.map((cf) => cf.noi)];
  irrFlows[irrFlows.length - 1] += valeurTerminaleNette;
  const irr = calculerIRR(irrFlows);

  // Détail par locataire
  const leaseDetails = leases.map((l) => {
    const dureeRestante = Math.max(0, monthsBetween(dateValeur, l.dateFin) / 12);
    return {
      locataire: l.locataire,
      surface: l.surface,
      loyerAnnuel: l.loyerAnnuel,
      loyerM2: l.surface > 0 ? l.loyerAnnuel / l.surface : 0,
      ervM2: l.ervM2,
      ecartERV: l.loyerAnnuel > 0 ? ((l.ervM2 * l.surface - l.loyerAnnuel) / l.loyerAnnuel) * 100 : 0,
      dureeRestante,
      pctSurface: surfaceTotale > 0 ? (l.surface / surfaceTotale) * 100 : 0,
      pctLoyer: loyerTotalAnnuel > 0 ? (l.loyerAnnuel / loyerTotalAnnuel) * 100 : 0,
    };
  });

  const tauxOccupation = surfaceTotale > 0
    ? (leases.filter((l) => l.dateFin >= dateValeur).reduce((s, l) => s + l.surface, 0) / surfaceTotale) * 100
    : 0;

  return {
    cashFlows,
    totalNOIActualise,
    noiStabilise,
    valeurTerminaleBrute,
    fraisCession,
    valeurTerminaleNette,
    valeurTerminaleActualisee,
    valeurDCF,
    irr,
    surfaceTotale,
    loyerTotalAnnuel,
    loyerMoyenM2,
    ervMoyenM2,
    tauxOccupation,
    wault,
    potentielReversion,
    leaseDetails,
  };
}
