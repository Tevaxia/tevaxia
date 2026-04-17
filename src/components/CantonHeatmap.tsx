"use client";

/**
 * Heatmap choroplèthe simplifiée des 12 cantons luxembourgeois.
 *
 * Au lieu d'une carte GeoJSON détaillée (plusieurs Mo), on utilise
 * une grille 4 lignes × 4 colonnes qui reprend grossièrement la
 * position géographique des cantons : Nord en haut, Sud en bas,
 * Ouest à gauche, Est à droite. Chaque case est colorée selon le
 * prix m² moyen pondéré par commune.
 *
 * Trade-off : lisibilité immédiate + empreinte CSS pure sans charge
 * Leaflet/GeoJSON. Pour la carte précise par commune, voir /carte.
 */

import type { MarketDataCommune } from "@/lib/market-data";

interface CantonTile {
  canton: string;
  displayName: string;
  // Position grille (row, col) approximant la géographie LU
  row: number;
  col: number;
  // Taille (rowspan/colspan)
  rowspan?: number;
  colspan?: number;
}

// Layout grille 4×4 approximant la carte du LU
// Rangées : 1=Nord (Clervaux, Vianden) → 4=Sud (Esch, Remich)
// Colonnes : 1=Ouest (Redange, Capellen) → 4=Est (Grevenmacher, Remich)
const CANTON_TILES: CantonTile[] = [
  // Nord
  { canton: "Clervaux", displayName: "Clervaux", row: 1, col: 1, colspan: 2 },
  { canton: "Wiltz", displayName: "Wiltz", row: 1, col: 3 },
  { canton: "Vianden", displayName: "Vianden", row: 1, col: 4 },
  // Centre-Nord
  { canton: "Redange", displayName: "Redange", row: 2, col: 1 },
  { canton: "Diekirch", displayName: "Diekirch", row: 2, col: 2, colspan: 2 },
  { canton: "Echternach", displayName: "Echternach", row: 2, col: 4 },
  // Centre
  { canton: "Capellen", displayName: "Capellen", row: 3, col: 1 },
  { canton: "Mersch", displayName: "Mersch", row: 3, col: 2 },
  { canton: "Luxembourg", displayName: "Luxembourg", row: 3, col: 3 },
  { canton: "Grevenmacher", displayName: "Grevenmacher", row: 3, col: 4 },
  // Sud
  { canton: "Esch-sur-Alzette", displayName: "Esch-sur-Alzette", row: 4, col: 1, colspan: 3 },
  { canton: "Remich", displayName: "Remich", row: 4, col: 4 },
];

interface CantonAggregate {
  canton: string;
  prixMoyen: number;
  nbCommunes: number;
  nbTransactions: number;
  prixMin: number;
  prixMax: number;
}

function aggregateByCanton(data: MarketDataCommune[]): Record<string, CantonAggregate> {
  const byCanton: Record<string, { sum: number; count: number; transactions: number; min: number; max: number }> = {};
  for (const c of data) {
    if (!c.prixM2Existant) continue;
    const key = c.canton;
    if (!byCanton[key]) {
      byCanton[key] = { sum: 0, count: 0, transactions: 0, min: Infinity, max: -Infinity };
    }
    byCanton[key].sum += c.prixM2Existant;
    byCanton[key].count += 1;
    byCanton[key].transactions += c.nbTransactions ?? 0;
    byCanton[key].min = Math.min(byCanton[key].min, c.prixM2Existant);
    byCanton[key].max = Math.max(byCanton[key].max, c.prixM2Existant);
  }
  const out: Record<string, CantonAggregate> = {};
  for (const [k, v] of Object.entries(byCanton)) {
    out[k] = {
      canton: k,
      prixMoyen: v.count > 0 ? v.sum / v.count : 0,
      nbCommunes: v.count,
      nbTransactions: v.transactions,
      prixMin: v.min,
      prixMax: v.max,
    };
  }
  return out;
}

function priceToColor(price: number, min: number, max: number): string {
  // Gradient : vert (min, abordable) → jaune → orange → rouge (max, cher)
  if (max === min) return "#d1d5db";
  const pct = (price - min) / (max - min);
  // Points intermédiaires du gradient
  if (pct < 0.25) return "#86efac"; // vert clair
  if (pct < 0.5) return "#fde047"; // jaune
  if (pct < 0.75) return "#fb923c"; // orange
  return "#f87171"; // rouge
}

function textContrast(bgHex: string): string {
  // Tous les fonds utilisés sont clairs → texte sombre pour contraste
  if (bgHex === "#86efac") return "#14532d";
  if (bgHex === "#fde047") return "#713f12";
  if (bgHex === "#fb923c") return "#7c2d12";
  if (bgHex === "#f87171") return "#7f1d1d";
  return "#374151";
}

export default function CantonHeatmap({ data }: { data: MarketDataCommune[] }) {
  const aggregates = aggregateByCanton(data);
  const values = Object.values(aggregates).map((a) => a.prixMoyen).filter((v) => v > 0);
  const globalMin = Math.min(...values);
  const globalMax = Math.max(...values);

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows: "repeat(4, minmax(80px, auto))",
        }}
      >
        {CANTON_TILES.map((tile) => {
          const agg = aggregates[tile.canton];
          const bg = agg ? priceToColor(agg.prixMoyen, globalMin, globalMax) : "#f3f4f6";
          const fg = agg ? textContrast(bg) : "#6b7280";
          return (
            <div
              key={tile.canton}
              className="rounded-lg p-2 flex flex-col justify-between shadow-sm transition-transform hover:scale-[1.02] cursor-default"
              style={{
                gridRow: `${tile.row} / span ${tile.rowspan ?? 1}`,
                gridColumn: `${tile.col} / span ${tile.colspan ?? 1}`,
                backgroundColor: bg,
                color: fg,
              }}
              title={agg ? `${tile.displayName} — ${Math.round(agg.prixMoyen).toLocaleString("fr-LU")} €/m² moyen (${agg.nbCommunes} communes, ${agg.nbTransactions} transactions)` : tile.displayName}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                {tile.displayName}
              </div>
              {agg && (
                <>
                  <div className="text-base font-mono font-bold">
                    {Math.round(agg.prixMoyen).toLocaleString("fr-LU")}
                  </div>
                  <div className="text-[9px] font-semibold opacity-80">
                    €/m² · {agg.nbCommunes} comm.
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px] text-muted">
          Layout géographique approximatif (grille 4×4). Données :{" "}
          <span className="font-semibold text-slate">Observatoire Habitat Q4 2025</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-muted">{Math.round(globalMin).toLocaleString("fr-LU")} €</span>
          <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: "#86efac" }} />
          <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: "#fde047" }} />
          <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: "#fb923c" }} />
          <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: "#f87171" }} />
          <span className="text-muted">{Math.round(globalMax).toLocaleString("fr-LU")} €</span>
        </div>
      </div>
    </div>
  );
}
