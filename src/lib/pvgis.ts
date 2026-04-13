// PVGIS 5.3 API integration for real solar production data
// https://re.jrc.ec.europa.eu/api/v5_3/
// Free, public, no API key required, CORS-enabled

import { COMMUNE_COORDS } from "./communes-coords";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PVGISMonthly {
  month: string;
  kwh: number;
}

export interface PVGISResult {
  annualKwh: number;
  monthlyKwh: PVGISMonthly[];
}

// ---------------------------------------------------------------------------
// Orientation mapping
// ---------------------------------------------------------------------------

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/**
 * Maps common orientation labels used in Luxembourg PV simulators
 * to PVGIS azimuth degrees (0 = south, -90 = east, 90 = west, 180 = north).
 */
export function orientationToAzimuth(
  label: "SUD" | "SUD_EST" | "SUD_OUEST" | "EST_OUEST" | "EST" | "OUEST" | "PLAT" | "NORD" | string
): number {
  switch (label) {
    case "SUD":       return 0;
    case "SUD_EST":   return -45;
    case "SUD_OUEST": return 45;
    case "EST":       return -90;
    case "OUEST":     return 90;
    case "EST_OUEST": return 0;   // average of east/west, use south as proxy
    case "PLAT":      return 0;   // flat roof, azimuth irrelevant at low tilt
    case "NORD":      return 180;
    default:          return 0;
  }
}

/**
 * Returns a sensible tilt angle for flat-roof orientations.
 * For "PLAT", a low optimal tilt (10-15 degrees) is used instead of steep tilt.
 */
export function orientationToTilt(
  label: string,
  defaultTilt: number = 35
): number {
  if (label === "PLAT") return 10; // flat roof: low-angle mounting
  return defaultTilt;
}

// ---------------------------------------------------------------------------
// Commune coordinates lookup
// ---------------------------------------------------------------------------

/**
 * Looks up GPS coordinates for a Luxembourg commune.
 * Returns [latitude, longitude] or null if the commune is not found.
 */
export function getCommuneCoords(commune: string): [number, number] | null {
  // Direct lookup
  if (COMMUNE_COORDS[commune]) {
    return COMMUNE_COORDS[commune];
  }
  // Case-insensitive search
  const lowerCommune = commune.toLowerCase();
  for (const [name, coords] of Object.entries(COMMUNE_COORDS)) {
    if (name.toLowerCase() === lowerCommune) {
      return coords;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// PVGIS API call
// ---------------------------------------------------------------------------

const PVGIS_BASE = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc";

/**
 * Fetches real solar production data from the EU PVGIS 5.3 API.
 *
 * @param lat       - Latitude (decimal degrees)
 * @param lon       - Longitude (decimal degrees)
 * @param peakPower - Peak PV power in kWc (kWp)
 * @param azimuth   - Panel azimuth in degrees (0 = south, -90 = east, 90 = west)
 * @param tilt      - Panel tilt/inclination in degrees
 * @param loss      - System losses in percent (default 14%)
 * @returns PVGISResult with annual and monthly production, or null on failure
 */
export async function fetchPVGISProduction(
  lat: number,
  lon: number,
  peakPower: number,
  azimuth: number = 0,
  tilt: number = 35,
  loss: number = 14
): Promise<PVGISResult | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
      peakpower: peakPower.toFixed(2),
      loss: loss.toString(),
      angle: tilt.toString(),
      aspect: azimuth.toString(),
      outputformat: "json",
    });

    const response = await fetch(`${PVGIS_BASE}?${params.toString()}`, {
      signal: AbortSignal.timeout(15000), // 15-second timeout
    });

    if (!response.ok) {
      console.warn(`PVGIS API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Extract annual production
    const totals = data?.outputs?.totals?.fixed;
    if (!totals) {
      console.warn("PVGIS: unexpected response structure", data);
      return null;
    }

    const annualKwh = Math.round(totals.E_y); // E_y = annual energy production (kWh)

    // Extract monthly production
    const monthlyData = data?.outputs?.monthly?.fixed;
    const monthlyKwh: PVGISMonthly[] = MONTH_NAMES_FR.map((name, i) => {
      const monthEntry = monthlyData?.find(
        (m: { month: number }) => m.month === i + 1
      );
      return {
        month: name,
        kwh: monthEntry ? Math.round(monthEntry.E_m) : Math.round(annualKwh / 12),
      };
    });

    return { annualKwh, monthlyKwh };
  } catch (error) {
    console.warn("PVGIS API call failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback estimation (offline / API error)
// ---------------------------------------------------------------------------

const FALLBACK_KWH_PER_KWC = 950;

/** Monthly distribution factors for Luxembourg (south-facing, 35 degree tilt) */
const MONTHLY_DISTRIBUTION = [0.04, 0.06, 0.09, 0.11, 0.12, 0.12, 0.12, 0.11, 0.09, 0.07, 0.04, 0.03];

/**
 * Estimates solar production using a fixed 950 kWh/kWc/year ratio.
 * Used as fallback when PVGIS is unavailable.
 */
export function estimateProduction(peakPower: number): PVGISResult {
  const annualKwh = Math.round(peakPower * FALLBACK_KWH_PER_KWC);
  const monthlyKwh: PVGISMonthly[] = MONTH_NAMES_FR.map((name, i) => ({
    month: name,
    kwh: Math.round(annualKwh * MONTHLY_DISTRIBUTION[i]),
  }));
  return { annualKwh, monthlyKwh };
}
