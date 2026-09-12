import type { SharedToolType } from './shared-links';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
function numbers(row: Record<string, unknown>, keys: string[]): boolean { return keys.every(key => isFiniteNumber(row[key])); }
function rows(value: unknown, keys: string[], textKeys: string[] = []): boolean {
  return Array.isArray(value) && value.length <= 1000 && value.every(row => isRecord(row) && numbers(row, keys) && textKeys.every(key => typeof row[key] === 'string'));
}
/** Validate only display compatibility. Stored results are not recalculated or certified. */
export interface BilanPromoteurPayload {
  inputs: Record<string, unknown>;
  results: {
    caTotal: number;
    caLogements: number;
    caParkings: number;
    coutTerrain: number;
    totalConstruction: number;
    totalFrais: number;
    margeMontant: number;
    margeEffective: number;
    chargeFonciere: number;
    chargeFonciereM2Terrain: number;
    coutsConstruction: number;
    coutsArchitecte: number;
    coutsBET: number;
    coutsEtudes: number;
    coutsAleas: number;
    fFinanciers: number;
    fCommerciaux: number;
    fAssurances: number;
    fGestion: number;
    ratioConstructionCA: number;
    ratioFraisCA: number;
  };
}

export interface HotelValorisationPayload {
  inputs: Record<string, unknown>;
  results: {
    valeurCentrale: number;
    fourchetteBasse: number;
    fourchetteHaute: number;
    valeurDCF: number;
    valeurMultipleParChambre: number;
    multipleEbitda: number;
    revPAR: number;
    revenuRoomsAnnuel: number;
    revenuTotalAnnuel: number;
    breakdown: { fb: number; autres: number };
    charges: { staff: number; energy: number; other: number; total: number };
    gop: number;
    gopMargin: number;
    ffe: number;
    ebitda: number;
    ebitdaMargin: number;
    capRateUsed: number;
    pricePerKeyUsed: number;
  };
}

export interface HotelDscrPayload {
  inputs: Record<string, unknown>;
  results: {
    dscrCentral: number;
    dscrStressOccupation: number;
    dscrStressADR: number;
    dscrStressDouble: number;
    diagnostic: string;
    diagnosticLabel: string;
    montantDette: number;
    ltv: number;
    mensualite: number;
    serviceDetteAnnuel: number;
    maxEmpruntable: number;
    totalInterets: number;
    coutTotalCredit: number;
  };
}

export interface EstimationPayload {
  inputs: Record<string, unknown>;
  results: {
    estimationBasse: number;
    estimationCentrale: number;
    estimationHaute: number;
    prixM2Ajuste: number;
    confiance: string;
    ajustements: Array<{ label: string; pct: number }>;
  };
}

export interface DcfMultiPayload {
  inputs: Record<string, unknown>;
  results: {
    valeurDCF: number;
    irr: number;
    wault: number;
    loyerTotalAnnuel: number;
    surfaceTotale: number;
    loyerMoyenM2: number;
    ervMoyenM2: number;
    tauxOccupation: number;
    potentielReversion: number;
    totalNOIActualise: number;
    noiStabilise: number;
    valeurTerminaleBrute: number;
    valeurTerminaleActualisee: number;
    fraisCession: number;
    leaseDetails: Array<{ locataire: string; surface: number; loyerM2: number; ervM2: number; ecartERV: number; dureeRestante: number; pctLoyer: number }>;
  };
}

export interface ValorisationPayload {
  inputs: Record<string, unknown>;
  results: {
    valeurComparaison?: number;
    valeurCapitalisation?: number;
    valeurDCF?: number;
    valeurRetenue?: number;
  };
}

export function isBilanPromoteurPayload(payload: Record<string, unknown>): payload is BilanPromoteurPayload & Record<string, unknown> {
  return isRecord(payload.inputs)
    && isRecord(payload.results)
    && Object.values(payload.inputs).every(value => value === null || ['string', 'number', 'boolean'].includes(typeof value))
    && numbers(payload.results, ["caTotal", "caLogements", "caParkings", "coutTerrain", "totalConstruction", "totalFrais", "margeMontant", "margeEffective", "chargeFonciere", "chargeFonciereM2Terrain", "coutsConstruction", "coutsArchitecte", "coutsBET", "coutsEtudes", "coutsAleas", "fFinanciers", "fCommerciaux", "fAssurances", "fGestion", "ratioConstructionCA", "ratioFraisCA"]);
}

export function isHotelValorisationPayload(payload: Record<string, unknown>): payload is HotelValorisationPayload & Record<string, unknown> {
  return isRecord(payload.inputs)
    && isRecord(payload.results)
    && Object.values(payload.inputs).every(value => value === null || ['string', 'number', 'boolean'].includes(typeof value))
    && numbers(payload.results, ["valeurCentrale", "fourchetteBasse", "fourchetteHaute", "valeurDCF", "valeurMultipleParChambre", "multipleEbitda", "revPAR", "revenuRoomsAnnuel", "revenuTotalAnnuel", "gop", "gopMargin", "ffe", "ebitda", "ebitdaMargin", "capRateUsed", "pricePerKeyUsed"])
    && isRecord(payload.results.breakdown)
    && numbers(payload.results.breakdown, ['fb', 'autres'])
    && isRecord(payload.results.charges)
    && numbers(payload.results.charges, ['staff', 'energy', 'other', 'total']);
}

export function isHotelDscrPayload(payload: Record<string, unknown>): payload is HotelDscrPayload & Record<string, unknown> {
  return isRecord(payload.inputs)
    && isRecord(payload.results)
    && Object.values(payload.inputs).every(value => value === null || ['string', 'number', 'boolean'].includes(typeof value))
    && numbers(payload.results, ["dscrCentral", "dscrStressOccupation", "dscrStressADR", "dscrStressDouble", "montantDette", "ltv", "mensualite", "serviceDetteAnnuel", "maxEmpruntable", "totalInterets", "coutTotalCredit"])
    && ["diagnostic", "diagnosticLabel"].every(key => typeof (payload.results as Record<string, unknown>)[key] === 'string');
}

export function isEstimationPayload(payload: Record<string, unknown>): payload is EstimationPayload & Record<string, unknown> {
  return isRecord(payload.inputs)
    && isRecord(payload.results)
    && Object.values(payload.inputs).every(value => value === null || ['string', 'number', 'boolean'].includes(typeof value))
    && numbers(payload.results, ["estimationBasse", "estimationCentrale", "estimationHaute", "prixM2Ajuste"])
    && ["confiance"].every(key => typeof (payload.results as Record<string, unknown>)[key] === 'string')
    && rows(payload.results.ajustements, ['pct'], ['label']);
}

export function isDcfMultiPayload(payload: Record<string, unknown>): payload is DcfMultiPayload & Record<string, unknown> {
  return isRecord(payload.inputs)
    && isRecord(payload.results)
    && Object.values(payload.inputs).every(value => value === null || ['string', 'number', 'boolean'].includes(typeof value))
    && numbers(payload.results, ["valeurDCF", "irr", "wault", "loyerTotalAnnuel", "surfaceTotale", "loyerMoyenM2", "ervMoyenM2", "tauxOccupation", "potentielReversion", "totalNOIActualise", "noiStabilise", "valeurTerminaleBrute", "valeurTerminaleActualisee", "fraisCession"])
    && rows(payload.results.leaseDetails, ['surface', 'loyerM2', 'ervM2', 'ecartERV', 'dureeRestante', 'pctLoyer'], ['locataire'])
    && payload.inputs.model === undefined;
}

export function isValorisationPayload(payload: Record<string, unknown>): payload is ValorisationPayload & Record<string, unknown> {
  return isRecord(payload.inputs)
    && isRecord(payload.results)
    && Object.values(payload.inputs).every(value => value === null || ['string', 'number', 'boolean'].includes(typeof value))
    && ["valeurComparaison", "valeurCapitalisation", "valeurDCF", "valeurRetenue"].every(key => (payload.results as Record<string, unknown>)[key] === undefined || isFiniteNumber((payload.results as Record<string, unknown>)[key]))
    && ["valeurComparaison", "valeurCapitalisation", "valeurDCF", "valeurRetenue"].some(key => isFiniteNumber((payload.results as Record<string, unknown>)[key]));
}

export interface MonthlyDcfPayload extends Record<string, unknown> {
  inputs: Record<string, unknown> & { model: 'monthly-expected-v1' };
  results: { valeurDCF: number; fluxTerminal: number; cashFlows: Array<{ annee: number; loyerBrutEffectif: number; noi: number; fitOut: number; capex: number; fluxNet: number; fluxActualise: number }> };
}
export function isMonthlyDcfPayload(payload: Record<string, unknown>): payload is MonthlyDcfPayload {
  if (!isRecord(payload.inputs) || payload.inputs.model !== 'monthly-expected-v1' || !isRecord(payload.results)) return false;
  const cashFlows = payload.results.cashFlows;
  return numbers(payload.results, ['valeurDCF', 'fluxTerminal'])
    && rows(cashFlows, ['annee', 'loyerBrutEffectif', 'noi', 'fitOut', 'capex', 'fluxNet', 'fluxActualise'])
    && Array.isArray(cashFlows) && cashFlows.length > 0 && cashFlows.length <= 50
    && cashFlows.every((row, index) => row.annee === index + 1);
}
export function sharedCalculatorPath(tool: SharedToolType): string {
  return ({ 'bilan-promoteur': '/bilan-promoteur', estimation: '/estimation', valorisation: '/valorisation', 'dcf-multi': '/dcf-multi', 'hotel-valorisation': '/hotellerie/valorisation', 'hotel-dscr': '/hotellerie/dscr' })[tool];
}
