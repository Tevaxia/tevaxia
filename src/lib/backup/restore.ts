/**
 * Lecture et restauration d'un ZIP de sauvegarde Tevaxia.
 *
 * Pipeline :
 * 1. Parse ZIP → manifest.json + data/*.json
 * 2. Preview : affiche le module + counts (lecture seule)
 * 3. Apply : upsert les entités selon skipExisting (défaut true)
 *
 * V2 scope — n'applique que les modules "plats" (sans relations complexes) :
 *   - evaluations (localStorage)
 *   - inspection (localStorage)
 *
 * Les autres modules sont en preview-only (V3 pour l'apply complet).
 */

import { unzipSync, strFromU8 } from "fflate";
import type { BackupManifest, BackupModule } from "./types";

export interface ParsedBackup {
  manifest: BackupManifest;
  files: Record<string, string>; // nom (sans prefix) → contenu JSON
  pdfCount: number;
}

export interface RestoreResult {
  applied: boolean;
  imported: Record<string, number>;
  skipped: Record<string, number>;
  errors: string[];
}

const SUPPORTED_RESTORE: BackupModule[] = ["evaluations", "inspection"];

export function canRestore(module: BackupModule): boolean {
  return SUPPORTED_RESTORE.includes(module);
}

export async function parseBackupZip(file: File | Blob): Promise<ParsedBackup> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(buf);

  const manifestRaw = entries["manifest.json"];
  if (!manifestRaw) {
    throw new Error("manifest.json introuvable — ce n'est pas un ZIP Tevaxia valide.");
  }

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(strFromU8(manifestRaw));
  } catch {
    throw new Error("manifest.json illisible (JSON invalide).");
  }

  if (manifest.schemaVersion !== 1) {
    throw new Error(`Version de schéma non supportée : ${manifest.schemaVersion}`);
  }

  const files: Record<string, string> = {};
  let pdfCount = 0;
  for (const [path, bytes] of Object.entries(entries)) {
    if (path.startsWith("data/") && path.endsWith(".json")) {
      const key = path.slice("data/".length);
      files[key] = strFromU8(bytes);
    } else if (path.startsWith("pdfs/")) {
      pdfCount++;
    }
  }

  return { manifest, files, pdfCount };
}

/**
 * Applique un backup parsé selon les règles du module.
 * Renvoie RestoreResult avec compteurs.
 */
export async function applyBackup(
  parsed: ParsedBackup,
  opts: { skipExisting?: boolean } = {},
): Promise<RestoreResult> {
  const { manifest, files } = parsed;
  const skipExisting = opts.skipExisting ?? true;

  const result: RestoreResult = {
    applied: false,
    imported: {},
    skipped: {},
    errors: [],
  };

  if (!canRestore(manifest.module)) {
    result.errors.push(`Restauration non supportée pour le module « ${manifest.module} » (V3).`);
    return result;
  }

  if (manifest.module === "evaluations") {
    await applyEvaluations(files, skipExisting, result);
  } else if (manifest.module === "inspection") {
    await applyInspection(files, skipExisting, result);
  }

  result.applied = result.errors.length === 0;
  return result;
}

// ──────────────────────────────────────────────────────────────
// MODULE APPLIERS
// ──────────────────────────────────────────────────────────────

async function applyEvaluations(
  files: Record<string, string>,
  skipExisting: boolean,
  result: RestoreResult,
): Promise<void> {
  const raw = files["valuations.json"];
  if (!raw) {
    result.errors.push("valuations.json manquant dans le ZIP.");
    return;
  }
  let items: Array<Record<string, unknown>>;
  try {
    items = JSON.parse(raw);
  } catch {
    result.errors.push("valuations.json invalide.");
    return;
  }
  if (!Array.isArray(items)) {
    result.errors.push("valuations.json doit être un tableau.");
    return;
  }

  const STORAGE_KEY = "tevaxia_valuations";
  const existingRaw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const existing: Array<Record<string, unknown>> = existingRaw ? JSON.parse(existingRaw) : [];
  const existingIds = new Set(existing.map((e) => String(e.id)));

  let imported = 0;
  let skipped = 0;
  const merged = [...existing];
  for (const item of items) {
    const id = item.id ? String(item.id) : null;
    if (id && existingIds.has(id)) {
      if (skipExisting) { skipped++; continue; }
      // Overwrite : remplace in-place
      const idx = merged.findIndex((e) => String(e.id) === id);
      if (idx >= 0) merged[idx] = item;
      imported++;
    } else {
      merged.push(item);
      imported++;
    }
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }
  result.imported.valuations = imported;
  result.skipped.valuations = skipped;
}

async function applyInspection(
  files: Record<string, string>,
  skipExisting: boolean,
  result: RestoreResult,
): Promise<void> {
  const raw = files["inspection_draft.json"];
  if (!raw) {
    result.errors.push("inspection_draft.json manquant dans le ZIP.");
    return;
  }
  const data = JSON.parse(raw);
  if (!data) {
    result.imported.draft = 0;
    return;
  }

  const STORAGE_KEY = "tevaxia_inspection_draft";
  if (typeof window !== "undefined") {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && skipExisting) {
      result.skipped.draft = 1;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    result.imported.draft = 1;
  }
}
