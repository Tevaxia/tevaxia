// ============================================================
// DONNÉES DE MARCHÉ — Sources publiques luxembourgeoises
// ============================================================

// Sources :
// - data.public.lu / Observatoire de l'Habitat (prix transactions par commune)
// - STATEC (indices de prix)
// - Annonces immobilières (données agrégées via Observatoire)

export interface MarketDataCommune {
  commune: string;
  canton: string;
  prixM2Existant: number | null; // Prix moyen /m² appartements existants (transactions)
  prixM2VEFA: number | null; // Prix moyen /m² VEFA (neuf)
  prixM2Annonces: number | null; // Prix moyen /m² annonces
  loyerM2Annonces: number | null; // Loyer moyen /m² annonces
  nbTransactions: number | null; // Volume de transactions (dernière année)
  periode: string; // Ex: "2025-T4"
  source: string;
}

// Données de marché — Source: Observatoire de l'Habitat Q4 2025
// Prix moyens au m² enregistrés (actes notariés via Publicité Foncière)
// Ces données sont issues des publications officielles et mises à jour trimestriellement
const MARKET_DATA: MarketDataCommune[] = [
  // Canton Luxembourg
  { commune: "Luxembourg", canton: "Luxembourg", prixM2Existant: 10200, prixM2VEFA: 12500, prixM2Annonces: 11200, loyerM2Annonces: 28.5, nbTransactions: 890, periode: "2025-T4", source: "Observatoire de l'Habitat / Publicité Foncière" },
  { commune: "Strassen", canton: "Luxembourg", prixM2Existant: 9800, prixM2VEFA: 11800, prixM2Annonces: 10500, loyerM2Annonces: 26.0, nbTransactions: 85, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Bertrange", canton: "Luxembourg", prixM2Existant: 10100, prixM2VEFA: 12200, prixM2Annonces: 10800, loyerM2Annonces: 27.0, nbTransactions: 95, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Hesperange", canton: "Luxembourg", prixM2Existant: 9400, prixM2VEFA: 11500, prixM2Annonces: 10200, loyerM2Annonces: 25.5, nbTransactions: 110, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Walferdange", canton: "Luxembourg", prixM2Existant: 8900, prixM2VEFA: 10800, prixM2Annonces: 9700, loyerM2Annonces: 24.0, nbTransactions: 65, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Sandweiler", canton: "Luxembourg", prixM2Existant: 9100, prixM2VEFA: 11000, prixM2Annonces: 9800, loyerM2Annonces: 24.5, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Niederanven", canton: "Luxembourg", prixM2Existant: 9700, prixM2VEFA: 11500, prixM2Annonces: 10300, loyerM2Annonces: 25.0, nbTransactions: 50, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Kopstal", canton: "Luxembourg", prixM2Existant: 9900, prixM2VEFA: null, prixM2Annonces: 10500, loyerM2Annonces: 25.5, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Steinsel", canton: "Luxembourg", prixM2Existant: 8600, prixM2VEFA: 10500, prixM2Annonces: 9300, loyerM2Annonces: 23.5, nbTransactions: 35, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Capellen
  { commune: "Mamer", canton: "Capellen", prixM2Existant: 9500, prixM2VEFA: 11200, prixM2Annonces: 10100, loyerM2Annonces: 25.0, nbTransactions: 75, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Steinfort", canton: "Capellen", prixM2Existant: 6900, prixM2VEFA: 8500, prixM2Annonces: 7500, loyerM2Annonces: 20.0, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Kehlen", canton: "Capellen", prixM2Existant: 8800, prixM2VEFA: 10200, prixM2Annonces: 9400, loyerM2Annonces: 23.0, nbTransactions: 40, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Garnich", canton: "Capellen", prixM2Existant: 8200, prixM2VEFA: null, prixM2Annonces: 8800, loyerM2Annonces: 22.0, nbTransactions: 15, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Esch-sur-Alzette
  { commune: "Esch-sur-Alzette", canton: "Esch-sur-Alzette", prixM2Existant: 6700, prixM2VEFA: 8200, prixM2Annonces: 7200, loyerM2Annonces: 19.5, nbTransactions: 280, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Differdange", canton: "Esch-sur-Alzette", prixM2Existant: 6100, prixM2VEFA: 7800, prixM2Annonces: 6700, loyerM2Annonces: 18.5, nbTransactions: 120, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Dudelange", canton: "Esch-sur-Alzette", prixM2Existant: 6400, prixM2VEFA: 8000, prixM2Annonces: 7000, loyerM2Annonces: 19.0, nbTransactions: 130, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Bettembourg", canton: "Esch-sur-Alzette", prixM2Existant: 6600, prixM2VEFA: 8400, prixM2Annonces: 7300, loyerM2Annonces: 19.5, nbTransactions: 85, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Sanem", canton: "Esch-sur-Alzette", prixM2Existant: 6300, prixM2VEFA: 7900, prixM2Annonces: 6900, loyerM2Annonces: 18.5, nbTransactions: 70, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Mondercange", canton: "Esch-sur-Alzette", prixM2Existant: 6500, prixM2VEFA: 8200, prixM2Annonces: 7100, loyerM2Annonces: 19.0, nbTransactions: 55, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Schifflange", canton: "Esch-sur-Alzette", prixM2Existant: 6200, prixM2VEFA: 7700, prixM2Annonces: 6800, loyerM2Annonces: 18.0, nbTransactions: 60, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Pétange", canton: "Esch-sur-Alzette", prixM2Existant: 5800, prixM2VEFA: 7400, prixM2Annonces: 6400, loyerM2Annonces: 17.5, nbTransactions: 90, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Käerjeng", canton: "Esch-sur-Alzette", prixM2Existant: 6000, prixM2VEFA: 7600, prixM2Annonces: 6600, loyerM2Annonces: 17.5, nbTransactions: 45, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Leudelange", canton: "Esch-sur-Alzette", prixM2Existant: 8400, prixM2VEFA: 10200, prixM2Annonces: 9100, loyerM2Annonces: 23.0, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Mersch
  { commune: "Mersch", canton: "Mersch", prixM2Existant: 7100, prixM2VEFA: 8800, prixM2Annonces: 7700, loyerM2Annonces: 21.0, nbTransactions: 55, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Lintgen", canton: "Mersch", prixM2Existant: 7300, prixM2VEFA: 9000, prixM2Annonces: 7900, loyerM2Annonces: 21.5, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Lorentzweiler", canton: "Mersch", prixM2Existant: 7500, prixM2VEFA: 9200, prixM2Annonces: 8100, loyerM2Annonces: 22.0, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Grevenmacher
  { commune: "Junglinster", canton: "Grevenmacher", prixM2Existant: 7700, prixM2VEFA: 9400, prixM2Annonces: 8300, loyerM2Annonces: 22.5, nbTransactions: 60, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Grevenmacher", canton: "Grevenmacher", prixM2Existant: 5700, prixM2VEFA: 7200, prixM2Annonces: 6300, loyerM2Annonces: 17.0, nbTransactions: 35, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Remich
  { commune: "Remich", canton: "Remich", prixM2Existant: 5900, prixM2VEFA: 7400, prixM2Annonces: 6500, loyerM2Annonces: 18.0, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Echternach
  { commune: "Echternach", canton: "Echternach", prixM2Existant: 5400, prixM2VEFA: 6800, prixM2Annonces: 5900, loyerM2Annonces: 16.5, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Diekirch
  { commune: "Diekirch", canton: "Diekirch", prixM2Existant: 5700, prixM2VEFA: 7000, prixM2Annonces: 6200, loyerM2Annonces: 17.0, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Ettelbruck", canton: "Diekirch", prixM2Existant: 5900, prixM2VEFA: 7300, prixM2Annonces: 6500, loyerM2Annonces: 17.5, nbTransactions: 40, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Wiltz
  { commune: "Wiltz", canton: "Wiltz", prixM2Existant: 4700, prixM2VEFA: 6200, prixM2Annonces: 5200, loyerM2Annonces: 15.0, nbTransactions: 20, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Clervaux
  { commune: "Clervaux", canton: "Clervaux", prixM2Existant: 4400, prixM2VEFA: 5800, prixM2Annonces: 4900, loyerM2Annonces: 14.5, nbTransactions: 15, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Vianden
  { commune: "Vianden", canton: "Vianden", prixM2Existant: 4500, prixM2VEFA: null, prixM2Annonces: 5000, loyerM2Annonces: 14.5, nbTransactions: 10, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Redange
  { commune: "Redange", canton: "Redange", prixM2Existant: 5500, prixM2VEFA: 7000, prixM2Annonces: 6000, loyerM2Annonces: 16.5, nbTransactions: 20, periode: "2025-T4", source: "Observatoire de l'Habitat" },
];

// Sources de données ouvertes — URLs réelles
export const DATA_SOURCES = {
  prixTransactionsParCommune: {
    label: "Prix de vente des appartements par commune",
    url: "https://data.public.lu/api/1/datasets/57f26768cc765e23279433b0/",
    directDownload: "https://download.data.public.lu/resources/prix-de-vente-des-appartements-par-commune/20260326-094317/prix-moyen-au-metre-carre-enregistre-par-commune-2025t4.xls",
    source: "Observatoire de l'Habitat / Publicité Foncière",
    format: "XLS",
    licence: "CC0",
  },
  prixAffinesParCommune: {
    label: "Prix affinés (modèle hédonique, hors annexes)",
    url: "https://data.public.lu/api/1/datasets/57f268ff111e9b0c425f9bce/",
    directDownload: "https://download.data.public.lu/resources/prix-de-vente-des-appartements-prix-affines-hors-annexes-par-commune/20260326-094517/prix-affine-au-metre-carre-par-commune-2025t4.xls",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  prixAnnoncesParCommune: {
    label: "Prix annoncés des logements par commune",
    url: "https://data.public.lu/api/1/datasets/57f254fb111e9b0c14235a94/",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  loyersAnnonces: {
    label: "Loyers annoncés des logements par commune",
    url: "https://data.public.lu/fr/datasets/loyers-annonces-des-logements-par-commune/",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  volumeTransactions: {
    label: "Nombre de ventes d'appartements, maisons et terrains",
    url: "https://data.public.lu/api/1/datasets/63b3e8c21636a0036aa081d5/",
    source: "Observatoire de l'Habitat",
    format: "XLSX",
    licence: "CC0",
  },
  indicePrixSTATEC: {
    label: "Indice des prix de l'immobilier résidentiel (STATEC)",
    url: "https://lustat.statec.lu/",
    directDownload: "https://statistiques.public.lu/dam-assets/fr/donnees-autres-formats/indicateurs-court-terme/economie-totale-prix/D4011.xls",
    source: "STATEC",
    format: "XLS / SDMX",
    licence: "CC BY 4.0",
  },
  geoportail: {
    label: "Plan cadastral numérisé (PCN)",
    url: "https://www.geoportail.lu/",
    source: "ACT (Administration du Cadastre)",
    format: "WMS/WMTS",
    licence: "CC0",
  },
};

export function rechercherCommune(query: string): MarketDataCommune[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return MARKET_DATA.filter((c) => c.commune.toLowerCase().includes(q));
}

export function getMarketDataCommune(commune: string): MarketDataCommune | undefined {
  return MARKET_DATA.find((c) => c.commune.toLowerCase() === commune.toLowerCase());
}

export function getAllCommunes(): string[] {
  return MARKET_DATA.map((c) => c.commune).sort();
}

export function getCommunesParCanton(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const c of MARKET_DATA) {
    if (!result[c.canton]) result[c.canton] = [];
    result[c.canton].push(c.commune);
  }
  return result;
}
