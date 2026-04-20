/**
 * Lecture et restauration d'un ZIP de sauvegarde Tevaxia.
 *
 * Pipeline :
 * 1. Parse ZIP → manifest.json + data/*.json
 * 2. Preview : affiche le module + counts (lecture seule)
 * 3. Apply : upsert les entités selon skipExisting (défaut true)
 *
 * V3 scope :
 *   - evaluations, inspection (localStorage)
 *   - syndic complet (coownerships → units → AG → résolutions → votes →
 *     budgets → calls → charges → allocations → accounting → reminders)
 *   - PMS basique (properties → rooms → rate plans → reservations → guests → invoices → folios)
 *   - CRM agences (contacts, tasks, interactions, mandates)
 */

import { unzipSync, strFromU8 } from "fflate";
import type { BackupManifest, BackupModule } from "./types";
import { upsertRows, parseJsonArray, RestoreAccumulator } from "./restore-helpers";

export interface ParsedBackup {
  manifest: BackupManifest;
  files: Record<string, string>;
  pdfCount: number;
}

export interface RestoreResult {
  applied: boolean;
  imported: Record<string, number>;
  skipped: Record<string, number>;
  errors: string[];
}

const SUPPORTED_RESTORE: BackupModule[] = [
  "evaluations",
  "inspection",
  "syndic",
  "pms",
  "crm-agences",
];

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
    result.errors.push(`Restauration non supportée pour le module « ${manifest.module} » (V4).`);
    return result;
  }

  try {
    switch (manifest.module) {
      case "evaluations": await applyEvaluations(files, skipExisting, result); break;
      case "inspection": await applyInspection(files, skipExisting, result); break;
      case "syndic": await applySyndic(files, skipExisting, result); break;
      case "pms": await applyPms(files, skipExisting, result); break;
      case "crm-agences": await applyCrm(files, skipExisting, result); break;
    }
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : String(e));
  }

  result.applied = result.errors.length === 0;
  return result;
}

// ──────────────────────────────────────────────────────────────
// LOCAL STORAGE MODULES
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

// ──────────────────────────────────────────────────────────────
// SUPABASE MODULES — ordered by FK dependency
// ──────────────────────────────────────────────────────────────

/** Champs à retirer avant upsert : Supabase régénère timestamps + triggers. */
const OMIT_META = ["created_at", "updated_at"];

interface TableMapping {
  file: string;
  table: string;
  omit?: string[];
}

async function applyOrderedTables(
  files: Record<string, string>,
  skipExisting: boolean,
  mappings: TableMapping[],
): Promise<{ imported: Record<string, number>; skipped: Record<string, number>; errors: string[] }> {
  const acc = new RestoreAccumulator();
  for (const { file, table, omit } of mappings) {
    const rows = parseJsonArray(files, file);
    if (rows.length === 0) continue;
    const res = await upsertRows({
      table,
      rows,
      skipExisting,
      omit: [...OMIT_META, ...(omit ?? [])],
    });
    acc.add(res);
  }
  return { imported: acc.getImported(), skipped: acc.getSkipped(), errors: acc.getErrors() };
}

async function applySyndic(
  files: Record<string, string>,
  skipExisting: boolean,
  result: RestoreResult,
): Promise<void> {
  const mappings: TableMapping[] = [
    { file: "coownerships.json", table: "coownerships" },
    { file: "units.json", table: "coownership_units" },
    { file: "assemblies.json", table: "coownership_assemblies" },
    { file: "resolutions.json", table: "assembly_resolutions" },
    { file: "votes.json", table: "assembly_votes" },
    { file: "allocation_keys.json", table: "coownership_allocation_keys" },
    { file: "unit_allocations.json", table: "coownership_unit_allocations" },
    { file: "budgets.json", table: "coownership_budgets" },
    { file: "budget_lines.json", table: "coownership_budget_lines" },
    { file: "calls.json", table: "coownership_calls" },
    { file: "charges.json", table: "coownership_unit_charges" },
    { file: "accounting_years.json", table: "coownership_accounting_years" },
    { file: "accounts.json", table: "accounting_accounts" },
    { file: "entries.json", table: "accounting_entries" },
    { file: "reminders.json", table: "coownership_reminders" },
  ];
  const out = await applyOrderedTables(files, skipExisting, mappings);
  Object.assign(result.imported, out.imported);
  Object.assign(result.skipped, out.skipped);
  result.errors.push(...out.errors);
}

async function applyPms(
  files: Record<string, string>,
  skipExisting: boolean,
  result: RestoreResult,
): Promise<void> {
  const mappings: TableMapping[] = [
    { file: "properties.json", table: "pms_properties" },
    { file: "room_types.json", table: "pms_room_types" },
    { file: "rooms.json", table: "pms_rooms" },
    { file: "rate_plans.json", table: "pms_rate_plans" },
    { file: "seasonal_rates.json", table: "pms_seasonal_rates" },
    { file: "groups.json", table: "pms_groups" },
    { file: "guests.json", table: "pms_guests" },
    { file: "reservations.json", table: "pms_reservations" },
    { file: "reservation_lines.json", table: "pms_reservation_rooms" },
    { file: "payments.json", table: "pms_payments" },
    { file: "folios.json", table: "pms_folios" },
    { file: "folio_charges.json", table: "pms_folio_charges" },
    { file: "invoices.json", table: "pms_invoices" },
  ];
  const out = await applyOrderedTables(files, skipExisting, mappings);
  Object.assign(result.imported, out.imported);
  Object.assign(result.skipped, out.skipped);
  result.errors.push(...out.errors);
}

async function applyCrm(
  files: Record<string, string>,
  skipExisting: boolean,
  result: RestoreResult,
): Promise<void> {
  const mappings: TableMapping[] = [
    { file: "contacts.json", table: "crm_contacts" },
    { file: "mandates.json", table: "agency_mandates" },
    { file: "interactions.json", table: "crm_interactions" },
    { file: "tasks.json", table: "crm_tasks" },
  ];
  const out = await applyOrderedTables(files, skipExisting, mappings);
  Object.assign(result.imported, out.imported);
  Object.assign(result.skipped, out.skipped);
  result.errors.push(...out.errors);
}
