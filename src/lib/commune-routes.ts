import { getAllCommunes, slugifyCommune } from "./market-data";

/** Former commune names retained as permanent aliases after the 2023 mergers. */
export const COMMUNE_ALIASES: Readonly<Record<string, string>> = {
  bous: "bous-waldbredimus",
  waldbredimus: "bous-waldbredimus",
  grosbous: "groussbus-wal",
  wahl: "groussbus-wal",
};
const currentSlugs = new Set(getAllCommunes().map(slugifyCommune));

export function resolveCommuneRoute(rawSlug: string): string | null {
  let decoded: string;
  try { decoded = decodeURIComponent(rawSlug); } catch { return null; }
  const normalized = slugifyCommune(decoded);
  const canonical = COMMUNE_ALIASES[normalized] ?? normalized;
  return currentSlugs.has(canonical) ? canonical : null;
}
