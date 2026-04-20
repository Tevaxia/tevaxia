/**
 * Helpers pour la restauration : parse JSON, upsert Supabase avec gestion
 * des conflits (skip-existing ou overwrite), tracking des compteurs.
 *
 * Les IDs sont conservés : RLS empêchera l'insert si le user n'a pas les droits
 * sur l'org (sécurité par construction, pas besoin de ré-authentifier).
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface UpsertOptions {
  table: string;
  rows: Array<Record<string, unknown>>;
  /** Colonne de conflit (défaut "id"). */
  onConflict?: string;
  /** Si true, saute les rows dont l'id existe déjà. Si false, écrase. */
  skipExisting: boolean;
  /** Champs à ne pas inclure dans l'upsert (ex. champs calculés). */
  omit?: string[];
}

export interface UpsertResult {
  table: string;
  imported: number;
  skipped: number;
  errors: string[];
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase non configuré");
  return supabase;
}

/**
 * Upsert un lot de rows dans une table.
 * En mode skipExisting : fait d'abord un SELECT des IDs existants, filtre, puis insert.
 * En mode overwrite : utilise upsert({ onConflict }).
 */
export async function upsertRows(opts: UpsertOptions): Promise<UpsertResult> {
  const client = requireClient();
  const onConflict = opts.onConflict ?? "id";
  const result: UpsertResult = { table: opts.table, imported: 0, skipped: 0, errors: [] };

  if (!Array.isArray(opts.rows) || opts.rows.length === 0) return result;

  // Copie et omission
  const cleaned = opts.rows.map((r) => {
    const out: Record<string, unknown> = { ...r };
    if (opts.omit) for (const k of opts.omit) delete out[k];
    return out;
  });

  let toInsert = cleaned;

  if (opts.skipExisting) {
    const ids = cleaned.map((r) => r[onConflict]).filter((v): v is string | number => v != null);
    if (ids.length > 0) {
      const { data, error } = await client.from(opts.table).select(onConflict).in(onConflict, ids);
      if (error) {
        result.errors.push(`${opts.table}: ${error.message}`);
        return result;
      }
      const existingIds = new Set((data ?? []).map((d) => (d as unknown as Record<string, unknown>)[onConflict]));
      toInsert = cleaned.filter((r) => !existingIds.has(r[onConflict]));
      result.skipped = cleaned.length - toInsert.length;
    }
  }

  if (toInsert.length === 0) return result;

  // Batch par 500 pour éviter les timeouts
  const BATCH_SIZE = 500;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = opts.skipExisting
      ? await client.from(opts.table).insert(batch)
      : await client.from(opts.table).upsert(batch, { onConflict });

    if (error) {
      result.errors.push(`${opts.table} batch[${i}]: ${error.message}`);
    } else {
      result.imported += batch.length;
    }
  }

  return result;
}

/**
 * Parse un fichier JSON du ZIP, vérifie que c'est bien un tableau,
 * et applique une transformation optionnelle (ex. omit created_by).
 */
export function parseJsonArray(
  files: Record<string, string>,
  name: string,
): Array<Record<string, unknown>> {
  const raw = files[name];
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${name} doit être un tableau`);
    }
    return parsed as Array<Record<string, unknown>>;
  } catch (e) {
    throw new Error(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Stocke les erreurs et compteurs cumulés par un restore multi-tables. */
export class RestoreAccumulator {
  private imported: Record<string, number> = {};
  private skipped: Record<string, number> = {};
  private errors: string[] = [];

  add(r: UpsertResult): void {
    this.imported[r.table] = (this.imported[r.table] ?? 0) + r.imported;
    this.skipped[r.table] = (this.skipped[r.table] ?? 0) + r.skipped;
    this.errors.push(...r.errors);
  }

  getImported() { return this.imported; }
  getSkipped() { return this.skipped; }
  getErrors() { return this.errors; }
}
