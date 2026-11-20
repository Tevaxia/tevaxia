import { NextResponse } from "next/server";
import { MARKET_SNAPSHOT } from "@/lib/market-snapshot";

// API route pour rafraîchir les données depuis data.public.lu
// Les datasets de l'Observatoire de l'Habitat sont en format XLS
// On fetch les métadonnées (dernière mise à jour, URL du fichier)
// pour vérifier si nos données sont à jour.

const DATASETS = {
  prixTransactions: {
    id: "57f26768cc765e23279433b0",
    label: "Prix de vente des appartements par commune",
  },
  prixAffines: {
    id: "57f268ff111e9b0c425f9bce",
    label: "Prix affinés (modèle hédonique)",
  },
  prixAnnonces: {
    id: "57f254fb111e9b0c14235a94",
    label: "Prix annoncés des logements par commune",
  },
  volumeVentes: {
    id: "63b3e8c21636a0036aa081d5",
    label: "Nombre de ventes",
  },
};

interface DatasetInfo {
  id: string;
  label: string;
  lastModified: string | null;
  latestResourceUrl: string | null;
  latestResourceTitle: string | null;
  error?: string;
}

async function fetchDatasetInfo(id: string, label: string): Promise<DatasetInfo> {
  try {
    const res = await fetch(`https://data.public.lu/api/1/datasets/${id}/`, {
      next: { revalidate: 3600 }, // Cache 1h
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const resources = data.resources || [];
    const latest = resources[0]; // Le plus récent est en premier

    return {
      id,
      label,
      lastModified: data.last_modified || data.last_update || null,
      latestResourceUrl: latest?.url || null,
      latestResourceTitle: latest?.title || null,
    };
  } catch (e) {
    return {
      id,
      label,
      lastModified: null,
      latestResourceUrl: null,
      latestResourceTitle: null,
      error: String(e),
    };
  }
}

export async function GET() {
  const results = await Promise.all(
    Object.values(DATASETS).map((ds) => fetchDatasetInfo(ds.id, ds.label))
  );

  // Indice STATEC
  try {
    const statecRes = await fetch("https://statistiques.public.lu/dam-assets/fr/donnees-autres-formats/indicateurs-court-terme/economie-totale-prix/D4011.xls", {
      method: "HEAD",
      next: { revalidate: 3600 },
    });
    results.push({
      id: "statec-d4011",
      label: "Indice des prix résidentiels STATEC (D4011)",
      lastModified: statecRes.headers.get("last-modified"),
      latestResourceUrl: "https://statistiques.public.lu/dam-assets/fr/donnees-autres-formats/indicateurs-court-terme/economie-totale-prix/D4011.xls",
      latestResourceTitle: "D4011.xls",
    });
  } catch (e) {
    results.push({
      id: "statec-d4011",
      label: "Indice des prix résidentiels STATEC",
      lastModified: null,
      latestResourceUrl: null,
      latestResourceTitle: null,
      error: String(e),
    });
  }

  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    tevaxiaDataPeriode: `${MARKET_SNAPSHOT.periodStart} — ${MARKET_SNAPSHOT.periodEnd}`,
    datasets: results,
    note: "Les données tevaxia.lu sont mises à jour manuellement. Cette API vérifie les dernières mises à jour des sources publiques pour détecter quand un rafraîchissement est nécessaire.",
  });
}
