// ============================================================
// PROFIL UTILISATEUR — Personnalisation des rapports
// localStorage (offline) + sync Supabase user_metadata (cloud)
// ============================================================

import { supabase } from "./supabase";

export interface UserProfile {
  nomComplet: string;
  societe: string;
  qualifications: string; // ex: "REV, TRV, MRICS"
  telephone: string;
  email: string;
  adresse: string;
  logoUrl?: string; // URL du logo (optionnel)
  mentionLegale: string; // Mention personnalisée en bas du rapport
  /** Timestamp ISO de la dernière sauvegarde (pour merge cloud/local) */
  updatedAt?: string;
}

const STORAGE_KEY = "tevaxia_profile";

const DEFAULT_PROFILE: UserProfile = {
  nomComplet: "",
  societe: "",
  qualifications: "",
  telephone: "",
  email: "",
  adresse: "",
  mentionLegale: "Ce rapport est fourni à titre indicatif et ne constitue pas une expertise en évaluation immobilière au sens des EVS 2025.",
};

// ── localStorage (primaire, fonctionne hors ligne) ──────────

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfileLocal(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// ── Supabase cloud (user_metadata) ──────────────────────────

/** Pousse le profil dans auth.users.raw_user_meta_data si connecté */
export async function syncProfileToCloud(profile: UserProfile): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.auth.updateUser({ data: { profile } });
  } catch (err) {
    console.error("[profile] cloud sync failed:", err);
  }
}

/** Charge le profil depuis le cloud ; retourne null si indisponible */
export async function loadProfileFromCloud(): Promise<UserProfile | null> {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const cloud = user.user_metadata?.profile as UserProfile | undefined;
    if (!cloud || !cloud.nomComplet) return null;
    return { ...DEFAULT_PROFILE, ...cloud };
  } catch {
    return null;
  }
}

// ── API publique ────────────────────────────────────────────

/**
 * Sauvegarde le profil dans localStorage ET dans Supabase (si connecté).
 * Le timestamp updatedAt permet le merge cloud/local au chargement.
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
  const stamped = { ...profile, updatedAt: new Date().toISOString() };
  saveProfileLocal(stamped);
  await syncProfileToCloud(stamped);
}

/**
 * Charge le meilleur profil : compare local et cloud, garde le plus récent.
 * Retourne le profil mergé et synchronise les deux stores.
 */
export async function loadAndMergeProfile(): Promise<UserProfile> {
  const local = getProfile();
  const cloud = await loadProfileFromCloud();
  if (!cloud) return local;

  const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const cloudTime = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;

  if (cloudTime > localTime) {
    // Cloud plus récent -> met à jour le local
    saveProfileLocal(cloud);
    return cloud;
  }
  if (localTime > cloudTime && local.nomComplet) {
    // Local plus récent -> pousse vers le cloud
    syncProfileToCloud(local);
  }
  return local;
}

export function hasProfile(): boolean {
  const p = getProfile();
  return p.nomComplet.length > 0;
}

// ── Upload logo via Supabase Storage ───────────────────────
// Prérequis : créer le bucket "avatars" dans le dashboard Supabase
//   → Storage → New bucket → Name: "avatars", Public: ON
//   → Policies : allow INSERT/UPDATE for authenticated, SELECT for all

const LOGO_MAX_SIZE = 500 * 1024; // 500 KB
const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export interface UploadLogoResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload un logo dans Supabase Storage (bucket "avatars").
 * Retourne l'URL publique ou un message d'erreur localisé.
 */
export async function uploadLogo(file: File): Promise<UploadLogoResult> {
  if (!supabase) return { url: null, error: "Supabase non configuré." };

  // Validation format
  if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
    return { url: null, error: "Format non accepté. Utilisez PNG, JPEG ou SVG." };
  }

  // Validation taille
  if (file.size > LOGO_MAX_SIZE) {
    return { url: null, error: `Fichier trop volumineux (max ${LOGO_MAX_SIZE / 1024} Ko).` };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Vous devez être connecté pour uploader un logo." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `logos/${user.id}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error("[profile] logo upload error:", error);
    return { url: null, error: `Erreur d'upload : ${error.message}` };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
