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

/* USALI exploitation */

export interface UsaliInputs {
  nbChambres: number;
  adrYear1: number;
  occupancyYear1: number;
  adrGrowth: number;
  occupancyGrowthPts: number;
  category: HotelCategory;
  hasFB: boolean;
  hasMICE: boolean;
  staffCostPerFTE: number;
  fteCount: number;
  fixedCharges: number;
  horizonYears: number;
}

export interface UsaliYear {
  annee: number;
  occupancy: number;
  adr: number;
  revPAR: number;
  goppar: number;
  revenuRooms: number;
  revenuFB: number;
  revenuMICE: number;
  revenuAutres: number;
  revenuTotal: number;
  departmentalRooms: number;
  departmentalFB: number;
  departmentalAutres: number;
  totalDepartmentalProfit: number;
  undistributedAdmin: number;
  undistributedMarketing: number;
  undistributedEnergy: number;
  undistributedMaintenance: number;
  totalUndistributed: number;
  gop: number;
  gopMargin: number;
  fixedCharges: number;
  ffeReserve: number;
  ebitda: number;
  ebitdaMargin: number;
}

export interface UsaliResult {
  years: UsaliYear[];
  totalRevenuHorizon: number;
  totalGopHorizon: number;
  totalEbitdaHorizon: number;
  averageGoppar: number;
  averageEbitdaMargin: number;
  benchmark: {
    expectedGopMarginLow: number;
    expectedGopMarginHigh: number;
    diagnostic: "sous-performance" | "dans la norme" | "sur-performance";
  };
}

/* Rénovation énergétique hôtel */

export interface RenovationHotelInputs {
  surfaceChauffeeM2: number;
  nbChambres: number;
  consoActuelleKwhM2: number;
  consoCibleKwhM2: number;
  prixKwhMoyen: number;
  travauxIsolation: boolean;
  travauxCVC: boolean;
  travauxECS: boolean;
  travauxLED: boolean;
  travauxFenetres: boolean;
  adr: number;
  occupancy: number;
  gainRevparPctViaLabel: number;
}

export interface RenovationHotelLine {
  poste: string;
  retenu: boolean;
  coutBrut: number;
  tauxAideKlimabonus: number;
  aide: number;
  coutNet: number;
}

export interface RenovationHotelResult {
  lines: RenovationHotelLine[];
  coutBrutTotal: number;
  aideKlimabonusTotal: number;
  coutNetTotal: number;
  consoAvantKwh: number;
  consoApresKwh: number;
  reductionKwh: number;
  economiesAnnuelles: number;
  gainRevparAnnuel: number;
  paybackSansLabel: number;
  paybackAvecLabel: number;
  vanDixAns: number;
}

/* RevPAR comparison MPI/ARI/RGI */

export interface RevparCompsetInputs {
  hotelOccupancy: number;
  hotelADR: number;
  compsetOccupancy: number;
  compsetADR: number;
  nbChambres: number;
}

export interface RevparCompsetResult {
  hotelRevPAR: number;
  compsetRevPAR: number;
  mpi: number;
  ari: number;
  rgi: number;
  diagnostic: "problème commercial" | "problème prix" | "sain" | "sur-performance";
  diagnosticDetail: string;
  manqueAGagnerAnnuel: number;
}
