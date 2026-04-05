// ============================================================
// PERSISTANCE LOCALE — Sauvegarde des évaluations + corbeille
// ============================================================

export interface SavedValuation {
  id: string;
  nom: string;
  date: string;
  type: "estimation" | "valorisation" | "capitalisation" | "dcf" | "dcf-multi" | "frais" | "plus-values" | "loyer" | "aides" | "achat-location" | "bilan-promoteur";
  commune?: string;
  assetType?: string;
  valeurPrincipale?: number;
  data: Record<string, unknown>;
}

export interface TrashedValuation extends SavedValuation {
  deletedAt: string; // ISO date de suppression
}

const STORAGE_KEY = "tevaxia_valuations";
const TRASH_KEY = "tevaxia_trash";
const TRASH_RETENTION_DAYS = 7;

// ── Helpers ──

function getAll(): SavedValuation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAll(valuations: SavedValuation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(valuations));
}

function getTrash(): TrashedValuation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTrash(items: TrashedValuation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRASH_KEY, JSON.stringify(items));
}

/** Purge les éléments de la corbeille de plus de 7 jours */
function purgeExpiredTrash() {
  const trash = getTrash();
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const kept = trash.filter((t) => new Date(t.deletedAt).getTime() > cutoff);
  if (kept.length !== trash.length) saveTrash(kept);
  return kept;
}

// ── API publique — Évaluations ──

export function sauvegarderEvaluation(valuation: Omit<SavedValuation, "id" | "date">): SavedValuation {
  const all = getAll();
  const saved: SavedValuation = {
    ...valuation,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  all.unshift(saved);
  if (all.length > 50) all.length = 50;
  saveAll(all);
  return saved;
}

export function listerEvaluations(): SavedValuation[] {
  return getAll();
}

export function chargerEvaluation(id: string): SavedValuation | null {
  return getAll().find((v) => v.id === id) || null;
}

/** Supprime une évaluation → la déplace dans la corbeille */
export function supprimerEvaluation(id: string) {
  const all = getAll();
  const item = all.find((v) => v.id === id);
  if (item) {
    // Mettre dans la corbeille
    const trash = getTrash();
    trash.unshift({ ...item, deletedAt: new Date().toISOString() });
    saveTrash(trash);
  }
  saveAll(all.filter((v) => v.id !== id));
}

/** Supprime tout → déplace tout dans la corbeille */
export function supprimerTout() {
  const all = getAll();
  if (all.length > 0) {
    const trash = getTrash();
    const now = new Date().toISOString();
    trash.unshift(...all.map((v) => ({ ...v, deletedAt: now })));
    saveTrash(trash);
  }
  saveAll([]);
}

// ── API publique — Corbeille ──

/** Liste les éléments de la corbeille (purge les expirés automatiquement) */
export function listerCorbeille(): TrashedValuation[] {
  return purgeExpiredTrash();
}

/** Restaure un élément de la corbeille → retour dans les évaluations */
export function restaurerEvaluation(id: string) {
  const trash = getTrash();
  const item = trash.find((t) => t.id === id);
  if (item) {
    // Retirer de la corbeille
    saveTrash(trash.filter((t) => t.id !== id));
    // Remettre dans les évaluations
    const { deletedAt: _, ...valuation } = item;
    const all = getAll();
    all.unshift(valuation);
    if (all.length > 50) all.length = 50;
    saveAll(all);
  }
}

/** Supprime définitivement un élément de la corbeille */
export function supprimerDefinitivement(id: string) {
  saveTrash(getTrash().filter((t) => t.id !== id));
}

/** Vide la corbeille définitivement */
export function viderCorbeille() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TRASH_KEY);
}

/** Nombre d'éléments dans la corbeille (pour badge) */
export function compterCorbeille(): number {
  return purgeExpiredTrash().length;
}
