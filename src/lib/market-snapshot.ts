// Module volontairement minuscule : importable côté client sans embarquer les
// données communales.

/** Période couverte et date de publication du jeu importé. Source unique des
 * libellés affichés et du contrôle de fraîcheur de la tâche quotidienne. */
export const MARKET_SNAPSHOT = {
  periodStart: "2025-07-01",
  periodEnd: "2026-06-30",
  published: "2026-09-24",
} as const;
