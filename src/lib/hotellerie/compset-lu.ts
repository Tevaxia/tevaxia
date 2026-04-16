/**
 * Compset hôteliers Luxembourg et Grande Région — seed basé sur données
 * publiques STR EMEA Performance Report, Horwath HTL European Hotel
 * Valuation Index 2025, Deloitte European Hotel Industry Performance.
 *
 * Les valeurs sont des moyennes annualisées 2025. Mise à jour trimestrielle.
 */

export type HotelCategory = "budget" | "midscale" | "upscale" | "luxury";

export interface CompsetEntry {
  zone: string;
  label: string;
  category: HotelCategory;
  adr: number; // €/nuit
  occupancy: number; // 0-1
  revPAR: number; // calcul adr × occupancy
  source: string;
  periode: string;
}

function rev(adr: number, occ: number): number {
  return Math.round(adr * occ);
}

export const COMPSET_LU: CompsetEntry[] = [
  // Luxembourg-Ville Centre (très tendu, corporate)
  { zone: "Luxembourg Centre", label: "Budget 1-2★", category: "budget", adr: 95, occupancy: 0.70, revPAR: rev(95, 0.70), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Luxembourg Centre", label: "Midscale 3★", category: "midscale", adr: 145, occupancy: 0.74, revPAR: rev(145, 0.74), source: "STR EMEA Q4 2025 + Horwath HVI 2025", periode: "2025" },
  { zone: "Luxembourg Centre", label: "Upscale 4★", category: "upscale", adr: 205, occupancy: 0.72, revPAR: rev(205, 0.72), source: "STR EMEA Q4 2025 + Horwath HVI 2025", periode: "2025" },
  { zone: "Luxembourg Centre", label: "Luxury 5★", category: "luxury", adr: 340, occupancy: 0.68, revPAR: rev(340, 0.68), source: "Horwath HVI 2025", periode: "2025" },

  // Luxembourg Gare (transit, budget conscient)
  { zone: "Luxembourg Gare", label: "Budget 1-2★", category: "budget", adr: 85, occupancy: 0.75, revPAR: rev(85, 0.75), source: "Observatoire tevaxia 2025", periode: "2025" },
  { zone: "Luxembourg Gare", label: "Midscale 3★", category: "midscale", adr: 125, occupancy: 0.72, revPAR: rev(125, 0.72), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Luxembourg Gare", label: "Upscale 4★", category: "upscale", adr: 175, occupancy: 0.69, revPAR: rev(175, 0.69), source: "STR EMEA Q4 2025", periode: "2025" },

  // Kirchberg (corporate, européen, MICE)
  { zone: "Kirchberg / Plateau", label: "Midscale 3★", category: "midscale", adr: 150, occupancy: 0.78, revPAR: rev(150, 0.78), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Kirchberg / Plateau", label: "Upscale 4★", category: "upscale", adr: 215, occupancy: 0.75, revPAR: rev(215, 0.75), source: "STR EMEA Q4 2025 + Horwath HVI 2025", periode: "2025" },
  { zone: "Kirchberg / Plateau", label: "Luxury 5★", category: "luxury", adr: 310, occupancy: 0.71, revPAR: rev(310, 0.71), source: "Horwath HVI 2025", periode: "2025" },

  // Luxembourg Aéroport / Findel (transit, corporate)
  { zone: "Findel aéroport", label: "Midscale 3★", category: "midscale", adr: 135, occupancy: 0.76, revPAR: rev(135, 0.76), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Findel aéroport", label: "Upscale 4★", category: "upscale", adr: 180, occupancy: 0.73, revPAR: rev(180, 0.73), source: "STR EMEA Q4 2025", periode: "2025" },

  // Esch-sur-Alzette (corporate sud, moins tendu)
  { zone: "Esch-sur-Alzette", label: "Budget 1-2★", category: "budget", adr: 70, occupancy: 0.60, revPAR: rev(70, 0.60), source: "Observatoire tevaxia 2025", periode: "2025" },
  { zone: "Esch-sur-Alzette", label: "Midscale 3★", category: "midscale", adr: 110, occupancy: 0.65, revPAR: rev(110, 0.65), source: "Observatoire tevaxia 2025", periode: "2025" },

  // Mersch / Ettelbruck / Diekirch (Nord, tourisme)
  { zone: "Ettelbruck / Diekirch", label: "Midscale 3★", category: "midscale", adr: 95, occupancy: 0.58, revPAR: rev(95, 0.58), source: "Observatoire tevaxia 2025", periode: "2025" },
  { zone: "Mersch / Centre", label: "Midscale 3★", category: "midscale", adr: 100, occupancy: 0.60, revPAR: rev(100, 0.60), source: "Observatoire tevaxia 2025", periode: "2025" },

  // Grande Région — Metz, Saarbrücken, Trier, Liège
  { zone: "Metz (FR)", label: "Midscale 3★", category: "midscale", adr: 95, occupancy: 0.64, revPAR: rev(95, 0.64), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Metz (FR)", label: "Upscale 4★", category: "upscale", adr: 150, occupancy: 0.66, revPAR: rev(150, 0.66), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Saarbrücken (DE)", label: "Midscale 3★", category: "midscale", adr: 105, occupancy: 0.62, revPAR: rev(105, 0.62), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Trier (DE)", label: "Midscale 3★", category: "midscale", adr: 110, occupancy: 0.66, revPAR: rev(110, 0.66), source: "STR EMEA Q4 2025", periode: "2025" },
  { zone: "Liège (BE)", label: "Midscale 3★", category: "midscale", adr: 105, occupancy: 0.63, revPAR: rev(105, 0.63), source: "STR EMEA Q4 2025", periode: "2025" },
];

export function getCompsetByCategory(category: HotelCategory): CompsetEntry[] {
  return COMPSET_LU.filter((c) => c.category === category);
}

export function getCompsetByZone(zone: string): CompsetEntry[] {
  return COMPSET_LU.filter((c) => c.zone.toLowerCase().includes(zone.toLowerCase()));
}

export function averageRevPAR(entries: CompsetEntry[]): number {
  if (entries.length === 0) return 0;
  return Math.round(entries.reduce((s, e) => s + e.revPAR, 0) / entries.length);
}

export function averageADR(entries: CompsetEntry[]): number {
  if (entries.length === 0) return 0;
  return Math.round(entries.reduce((s, e) => s + e.adr, 0) / entries.length);
}

export function averageOccupancy(entries: CompsetEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.occupancy, 0) / entries.length;
}
