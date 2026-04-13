// ============================================================
// TAUX DIRECTEURS BCE — Données temps réel
// ============================================================
// Source : ECB Statistical Data Warehouse (SDW)
// API SDMX REST — gratuite, sans clé, CORS activé
// https://data.ecb.europa.eu/

export interface ECBRates {
  mainRefi: number;       // Taux de refinancement principal
  depositFacility: number; // Taux de la facilité de dépôt
  marginalLending: number; // Taux de prêt marginal
  lastUpdate: string;      // Date ISO de la dernière observation
  live: boolean;           // true si données live, false si fallback
}

// Fallback statique (mis à jour manuellement si API indisponible)
const FALLBACK: ECBRates = {
  mainRefi: 2.65,
  depositFacility: 2.50,
  marginalLending: 2.90,
  lastUpdate: "2025-03-06",
  live: false,
};

// Cache en mémoire (durée : 1 heure)
let cache: { data: ECBRates; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1h

async function fetchSeriesLatest(seriesKey: string): Promise<number | null> {
  try {
    const url = `https://data-api.ecb.europa.eu/service/data/FM/${seriesKey}?lastNObservations=1&format=csvdata`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const csv = await res.text();
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return null;

    // CSV header contains OBS_VALUE column
    const header = lines[0].split(",");
    const valueIdx = header.indexOf("OBS_VALUE");
    const dateIdx = header.indexOf("TIME_PERIOD");
    if (valueIdx === -1) return null;

    const values = lines[1].split(",");
    const val = parseFloat(values[valueIdx]);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

async function fetchDateLatest(seriesKey: string): Promise<string | null> {
  try {
    const url = `https://data-api.ecb.europa.eu/service/data/FM/${seriesKey}?lastNObservations=1&format=csvdata`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const csv = await res.text();
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return null;

    const header = lines[0].split(",");
    const dateIdx = header.indexOf("TIME_PERIOD");
    if (dateIdx === -1) return null;

    return lines[1].split(",")[dateIdx] || null;
  } catch {
    return null;
  }
}

/**
 * Récupère les taux directeurs BCE en temps réel.
 * Utilise un cache mémoire d'1 heure. Retombe sur les valeurs statiques en cas d'erreur.
 */
export async function getECBRates(): Promise<ECBRates> {
  // Vérifier le cache
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  // Fetch en parallèle
  const [refi, deposit, marginal, date] = await Promise.all([
    fetchSeriesLatest("B.U2.EUR.4F.KR.MRR_FR.LEV"),
    fetchSeriesLatest("B.U2.EUR.4F.KR.DFR.LEV"),
    fetchSeriesLatest("B.U2.EUR.4F.KR.MLFR.LEV"),
    fetchDateLatest("B.U2.EUR.4F.KR.MRR_FR.LEV"),
  ]);

  if (refi !== null && deposit !== null) {
    const data: ECBRates = {
      mainRefi: refi,
      depositFacility: deposit,
      marginalLending: marginal ?? refi + 0.25,
      lastUpdate: date ?? new Date().toISOString().slice(0, 10),
      live: true,
    };
    cache = { data, fetchedAt: Date.now() };
    return data;
  }

  // Fallback
  return FALLBACK;
}

/**
 * Hook-friendly : fetch côté client via un endpoint ou directement
 */
export async function fetchECBRatesClient(): Promise<ECBRates> {
  try {
    return await getECBRates();
  } catch {
    return FALLBACK;
  }
}
