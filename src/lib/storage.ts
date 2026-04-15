// ============================================================
// PERSISTANCE LOCALE + SYNC CLOUD (Supabase) — Évaluations
// ============================================================
// Les évaluations sont écrites dans localStorage instantanément
// (fonctionne hors-ligne et pour les anonymes). Si l'utilisateur est
// connecté, un dual-write Supabase est déclenché en arrière-plan,
// avec dédoublonnage via `local_id`. Plafond 500 items, rétention
// 180 jours côté cloud (triggers DB).

import { supabase } from "./supabase";

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
  deletedAt: string;
}

const STORAGE_KEY = "tevaxia_valuations";
const TRASH_KEY = "tevaxia_trash";
const TRASH_RETENTION_DAYS = 7;
const LOCAL_CAP = 500;

// ── Helpers localStorage ──

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

function purgeExpiredTrash() {
  const trash = getTrash();
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const kept = trash.filter((t) => new Date(t.deletedAt).getTime() > cutoff);
  if (kept.length !== trash.length) saveTrash(kept);
  return kept;
}

// ── Helpers Supabase (dual-write en arrière-plan) ──

async function cloudUpsert(v: SavedValuation): Promise<void> {
  if (!supabase) return;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    await supabase.from("valuations").upsert(
      {
        user_id: user.id,
        local_id: v.id,
        nom: v.nom,
        type: v.type,
        commune: v.commune ?? null,
        asset_type: v.assetType ?? null,
        valeur_principale: v.valeurPrincipale ?? null,
        data: v.data,
      },
      { onConflict: "user_id,local_id" }
    );
  } catch (e) {
    console.warn("cloudUpsert failed:", e);
  }
}

async function cloudDelete(localId: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    await supabase.from("valuations").delete().eq("user_id", user.id).eq("local_id", localId);
  } catch (e) {
    console.warn("cloudDelete failed:", e);
  }
}

async function cloudList(): Promise<SavedValuation[]> {
  if (!supabase) return [];
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return [];
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("valuations")
      .select("*")
      .eq("user_id", user.id)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(LOCAL_CAP);
    if (error || !data) return [];
    return data.map((d) => ({
      id: (d.local_id as string) || (d.id as string),
      nom: d.nom as string,
      date: (d.created_at as string) || new Date().toISOString(),
      type: d.type as SavedValuation["type"],
      commune: (d.commune as string | null) ?? undefined,
      assetType: (d.asset_type as string | null) ?? undefined,
      valeurPrincipale: (d.valeur_principale as number | null) ?? undefined,
      data: (d.data as Record<string, unknown>) ?? {},
    }));
  } catch (e) {
    console.warn("cloudList failed:", e);
    return [];
  }
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
  if (all.length > LOCAL_CAP) all.length = LOCAL_CAP;
  saveAll(all);
  // fire-and-forget cloud sync
  void cloudUpsert(saved);
  return saved;
}

/** Liste synchrone (localStorage uniquement) — pour compatibilité. */
export function listerEvaluations(): SavedValuation[] {
  return getAll();
}

/**
 * Liste asynchrone mergée local + cloud. Met à jour le localStorage
 * avec le résultat fusionné pour une lecture ultérieure cohérente.
 */
export async function listerEvaluationsAsync(): Promise<{ items: SavedValuation[]; cloud: boolean }> {
  const local = getAll();
  const cloud = await cloudList();
  if (cloud.length === 0) return { items: local, cloud: false };

  const byId = new Map<string, SavedValuation>();
  for (const v of local) byId.set(v.id, v);
  for (const v of cloud) {
    const existing = byId.get(v.id);
    if (!existing || existing.date < v.date) byId.set(v.id, v);
  }
  const merged = Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date));
  const capped = merged.slice(0, LOCAL_CAP);
  saveAll(capped);
  return { items: capped, cloud: true };
}

export function chargerEvaluation(id: string): SavedValuation | null {
  return getAll().find((v) => v.id === id) || null;
}

export function supprimerEvaluation(id: string) {
  const all = getAll();
  const item = all.find((v) => v.id === id);
  if (item) {
    const trash = getTrash();
    trash.unshift({ ...item, deletedAt: new Date().toISOString() });
    saveTrash(trash);
  }
  saveAll(all.filter((v) => v.id !== id));
  void cloudDelete(id);
}

export function supprimerTout() {
  const all = getAll();
  if (all.length > 0) {
    const trash = getTrash();
    const now = new Date().toISOString();
    trash.unshift(...all.map((v) => ({ ...v, deletedAt: now })));
    saveTrash(trash);
    for (const v of all) void cloudDelete(v.id);
  }
  saveAll([]);
}

/**
 * Pousse toutes les évaluations locales vers le cloud. À appeler à la
 * connexion pour rattraper les items créés hors-ligne.
 */
export async function syncLocalToCloud(): Promise<number> {
  const local = getAll();
  if (local.length === 0) return 0;
  await Promise.all(local.map((v) => cloudUpsert(v)));
  return local.length;
}

// ── Corbeille (locale uniquement) ──

export function listerCorbeille(): TrashedValuation[] {
  return purgeExpiredTrash();
}

export function restaurerEvaluation(id: string) {
  const trash = getTrash();
  const item = trash.find((t) => t.id === id);
  if (item) {
    saveTrash(trash.filter((t) => t.id !== id));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deletedAt: _deletedAt, ...valuation } = item;
    const all = getAll();
    all.unshift(valuation);
    if (all.length > LOCAL_CAP) all.length = LOCAL_CAP;
    saveAll(all);
    void cloudUpsert(valuation);
  }
}

export function supprimerDefinitivement(id: string) {
  saveTrash(getTrash().filter((t) => t.id !== id));
}

export function viderCorbeille() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TRASH_KEY);
}

export function compterCorbeille(): number {
  return purgeExpiredTrash().length;
}
