export type HotelCategory = "budget" | "midscale" | "upscale" | "luxury";

export interface RevenueMix {
  rooms: number;
  fb: number;
  autres: number;
}

export interface HotelValuationInputs {
  nbChambres: number;
  adr: number;
  occupancy: number;
  category: HotelCategory;
  revenueMix?: RevenueMix;
  staffRatio?: number;
  energyRatio?: number;
  otherOpexRatio?: number;
  ffeReserve?: number;
  capRate?: number;
  pricePerKeyOverride?: number;
}

export interface HotelValuationResult {
  revPAR: number;
  revenuRoomsAnnuel: number;
  revenuTotalAnnuel: number;
  breakdown: {
    rooms: number;
    fb: number;
    autres: number;
  };
  charges: {
    staff: number;
    energy: number;
    other: number;
    total: number;
  };
  ffe: number;
  gop: number;
  gopMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  capRateUsed: number;
  valeurDCF: number;
  valeurMultipleParChambre: number;
  pricePerKeyUsed: number;
  valeurCentrale: number;
  fourchetteBasse: number;
  fourchetteHaute: number;
  multipleEbitda: number;
}

export interface DscrInputs {
  ebitdaStabilise: number;
  prixAcquisition: number;
  travaux: number;
  apport: number;
  tauxInteretAnnuel: number;
  dureeAns: number;
  dscrCible?: number;
}

export interface DscrResult {
  montantDette: number;
  ltv: number;
  mensualite: number;
  serviceDetteAnnuel: number;
  dscrCentral: number;
  dscrStressOccupation: number;
  dscrStressADR: number;
  dscrStressDouble: number;
  diagnostic: "critique" | "limite" | "sain" | "fort";
  diagnosticLabel: string;
  maxEmpruntable: number;
  coutTotalCredit: number;
  totalInterets: number;
  amortissement: AmortizationLine[];
}

export interface AmortizationLine {
  annee: number;
  capitalRestant: number;
  capitalRembourse: number;
  interets: number;
  totalAnnuel: number;
}

export interface E2Inputs {
  capitalInvesti: number;
  coutTotalProjet: number;
  fondsEngages: boolean;
  revenuPrevisionnelAnnuel: number;
  minimumVitalAnnuel: number;
  emploisCreesOuMaintenus: number;
  isHotelActif: boolean;
}

export interface E2Result {
  scoreTotal: number;
  scoreSubstantiality: number;
  scoreAtRisk: number;
  scoreMarginality: number;
  scoreRealOperating: number;
  scoreJobCreation: number;
  ratioCapital: number;
  ratioRevenu: number;
  diagnostic: "rejet probable" | "à renforcer" | "favorable" | "très favorable";
  redFlags: string[];
}
