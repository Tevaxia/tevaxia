/**
 * Observatoire STR Luxembourg — données indicatives ADR/occupation par
 * commune et type de bien. Basé sur sources publiques (AirDNA sample,
 * Airbnb market reports, observations tevaxia Q4 2025).
 */

export type PropertyType = "studio" | "1bed" | "2bed" | "3bed" | "house";

export interface ObservatoireEntry {
  commune: string;
  zone: string;
  adrMedian: number;
  adrP25: number;
  adrP75: number;
  occupancyMedian: number; // 0-1
  nightsAvailableMedian: number;
  activeListings: number;
  revPARMedian: number;
}

export const OBSERVATOIRE_STR_LU: ObservatoireEntry[] = [
  { commune: "Luxembourg-Ville", zone: "Centre historique / Grund", adrMedian: 165, adrP25: 125, adrP75: 220, occupancyMedian: 0.68, nightsAvailableMedian: 285, activeListings: 850, revPARMedian: 112 },
  { commune: "Luxembourg-Ville", zone: "Gare / Bonnevoie", adrMedian: 110, adrP25: 85, adrP75: 145, occupancyMedian: 0.72, nightsAvailableMedian: 310, activeListings: 620, revPARMedian: 79 },
  { commune: "Luxembourg-Ville", zone: "Kirchberg / Clausen", adrMedian: 135, adrP25: 105, adrP75: 180, occupancyMedian: 0.70, nightsAvailableMedian: 290, activeListings: 380, revPARMedian: 95 },
  { commune: "Luxembourg-Ville", zone: "Limpertsberg / Belair", adrMedian: 140, adrP25: 110, adrP75: 185, occupancyMedian: 0.65, nightsAvailableMedian: 275, activeListings: 290, revPARMedian: 91 },

  { commune: "Esch-sur-Alzette", zone: "Centre", adrMedian: 85, adrP25: 65, adrP75: 115, occupancyMedian: 0.58, nightsAvailableMedian: 260, activeListings: 220, revPARMedian: 49 },
  { commune: "Differdange", zone: "Centre", adrMedian: 75, adrP25: 60, adrP75: 100, occupancyMedian: 0.52, nightsAvailableMedian: 240, activeListings: 80, revPARMedian: 39 },

  { commune: "Strassen / Bertrange", zone: "Périphérie LU-Ville", adrMedian: 115, adrP25: 90, adrP75: 150, occupancyMedian: 0.63, nightsAvailableMedian: 270, activeListings: 180, revPARMedian: 72 },
  { commune: "Mersch / Ettelbruck", zone: "Centre Nord", adrMedian: 85, adrP25: 65, adrP75: 110, occupancyMedian: 0.55, nightsAvailableMedian: 250, activeListings: 120, revPARMedian: 47 },

  { commune: "Diekirch / Vianden", zone: "Nord tourisme", adrMedian: 95, adrP25: 70, adrP75: 135, occupancyMedian: 0.62, nightsAvailableMedian: 230, activeListings: 200, revPARMedian: 59 },
  { commune: "Echternach / Mullerthal", zone: "Petite Suisse LU", adrMedian: 110, adrP25: 80, adrP75: 155, occupancyMedian: 0.65, nightsAvailableMedian: 220, activeListings: 280, revPARMedian: 71 },

  { commune: "Mondorf / Moselle", zone: "Bien-être / vin", adrMedian: 120, adrP25: 90, adrP75: 165, occupancyMedian: 0.67, nightsAvailableMedian: 250, activeListings: 170, revPARMedian: 80 },
  { commune: "Remich / Wormeldange", zone: "Moselle vignobles", adrMedian: 105, adrP25: 80, adrP75: 140, occupancyMedian: 0.60, nightsAvailableMedian: 240, activeListings: 110, revPARMedian: 63 },
];

export const LU_AIRBNB_TOTAL_LISTINGS = 4200; // estimation Q4 2025
export const LU_AIRBNB_GROWTH_YOY = 0.09; // +9% year-over-year

export function averageADR(entries: ObservatoireEntry[]): number {
  if (entries.length === 0) return 0;
  return Math.round(entries.reduce((s, e) => s + e.adrMedian, 0) / entries.length);
}

export function averageOccupancy(entries: ObservatoireEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.occupancyMedian, 0) / entries.length;
}

export function totalActiveListings(entries: ObservatoireEntry[]): number {
  return entries.reduce((s, e) => s + e.activeListings, 0);
}
