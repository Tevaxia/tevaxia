/**
 * Historique des sauvegardes utilisateur — table backup_history.
 *
 * Optionnel mais utile pour :
 * - Afficher "dernière sauvegarde : il y a 12 jours"
 * - Déclencher le rappel auto si > N jours
 * - Tracer destination (download local vs Drive)
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { BackupModule } from "./types";

export type BackupDestination = "download" | "drive";

export interface BackupRecord {
  id: string;
  user_id: string;
  module: BackupModule;
  destination: BackupDestination;
  counts: Record<string, number>;
  drive_file_id: string | null;
  created_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function recordBackup(input: {
  module: BackupModule;
  destination: BackupDestination;
  counts: Record<string, number>;
  driveFileId?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return; // silent no-op
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("backup_history").insert({
    user_id: user.id,
    module: input.module,
    destination: input.destination,
    counts: input.counts,
    drive_file_id: input.driveFileId ?? null,
  });
}

export async function listBackups(limit = 50): Promise<BackupRecord[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("backup_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as BackupRecord[];
}

export async function lastBackupPerModule(): Promise<Record<string, BackupRecord>> {
  const rows = await listBackups(200);
  const byModule: Record<string, BackupRecord> = {};
  for (const r of rows) {
    if (!byModule[r.module] || byModule[r.module].created_at < r.created_at) {
      byModule[r.module] = r;
    }
  }
  return byModule;
}
