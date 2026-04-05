// Client API pour le backend Spring Boot energy-api
// En dev : http://localhost:8081, en prod : https://tevaxia-energy-api.onrender.com

const API_BASE = process.env.NEXT_PUBLIC_ENERGY_API_URL || "http://localhost:8081";

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Erreur API ${res.status}`);
  }

  return res.json();
}

// --- Impact CPE ---

export interface ImpactRequest {
  valeurBien: number;
  classeActuelle: string;
}

export interface ClasseImpact {
  classe: string;
  ajustementPct: number;
  valeurAjustee: number;
  delta: number;
}

export interface ImpactResponse {
  valeurBase: number;
  classeActuelle: string;
  classes: ClasseImpact[];
  methodologie: string;
  sources: string[];
}

export function calculerImpact(request: ImpactRequest): Promise<ImpactResponse> {
  return post("/api/v1/impact", request);
}

// --- Rénovation ROI ---

export interface RenovationRequest {
  classeActuelle: string;
  classeCible: string;
  surface: number;
  anneeConstruction: number;
  valeurBien: number;
  prixEnergieKwh?: number;
}

export interface PosteTravaux {
  labelKey: string;
  coutMin: number;
  coutMax: number;
  coutMoyen: number;
}

export interface Klimabonus {
  sautClasses: number;
  taux: number;
  montant: number;
  description: string;
}

export interface Klimapret {
  montantMax: number;
  taux: number;
  dureeMois: number;
  mensualite: number;
}

export interface RenovationResponse {
  sautClasse: string;
  postes: PosteTravaux[];
  totalMin: number;
  totalMax: number;
  totalMoyen: number;
  honoraires: number;
  totalProjet: number;
  dureeEstimeeMois: number;
  gainValeur: number;
  gainValeurPct: number;
  roiPct: number;
  klimabonus: Klimabonus;
  klimapret: Klimapret;
  subventionConseil: number;
  totalAides: number;
  resteACharge: number;
  economieAnnuelleKwh: number;
  economieAnnuelleEur: number;
  paybackAnnees: number;
  van20ans: number;
  triPct: number;
}

export function calculerRenovation(request: RenovationRequest): Promise<RenovationResponse> {
  return post("/api/v1/renovation", request);
}

// --- Communauté d'énergie ---

export interface CommunauteRequest {
  nbParticipants: number;
  puissancePV: number;
  consoMoyenneParParticipant: number;
  tarifReseau: number;
  tarifPartage: number;
}

export interface ProductionMensuelle {
  mois: string;
  kwh: number;
}

export interface Conformite {
  statutJuridique: string;
  perimetre: string;
  contratRepartition: string;
  declarationILR: string;
  loiReference: string;
  reglementILR: string;
}

export interface CommunauteResponse {
  productionAnnuelle: number;
  consoTotale: number;
  tauxCouverturePct: number;
  tauxAutoConsoPct: number;
  energieAutoconsommee: number;
  surplus: number;
  economieTotale: number;
  economieParParticipant: number;
  revenuSurplus: number;
  co2EviteKg: number;
  coutInstallationHTVA: number;
  coutInstallationTVA: number;
  coutInstallationTTC: number;
  coutParParticipant: number;
  paybackGlobalAnnees: number;
  productionMensuelle: ProductionMensuelle[];
  parametres: {
    productionParKwc: number;
    tauxAutoConsoBase: number;
    facteurFoisonnement: number;
    tarifRachatSurplus: number;
    co2Facteur: number;
  };
  conformite: Conformite;
}

export function calculerCommunaute(request: CommunauteRequest): Promise<CommunauteResponse> {
  return post("/api/v1/communaute", request);
}
