/**
 * Gestion des rappels de sauvegarde.
 *
 * Principe : chaque module a une fréquence (off / 7j / 30j / 90j) stockée en
 * localStorage (user-local, pas besoin de DB). Au login, on compare la date
 * de la dernière sauvegarde à la fréquence et on affiche un toast si dû.
 */

import { lastBackupPerModule } from "./history";
import type { BackupModule } from "./types";

export type ReminderFrequency = "off" | "weekly" | "monthly" | "quarterly";

const STORAGE_KEY = "tevaxia_backup_reminders";
const LAST_CHECK_KEY = "tevaxia_backup_last_reminder_check";
const MIN_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h entre deux checks

export const FREQUENCY_DAYS: Record<ReminderFrequency, number> = {
  off: Infinity,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

export function getReminderSettings(): Partial<Record<BackupModule, ReminderFrequency>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function setReminderFrequency(module: BackupModule, freq: ReminderFrequency): void {
  if (typeof window === "undefined") return;
  const cur = getReminderSettings();
  cur[module] = freq;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
}

export function resetLastCheck(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LAST_CHECK_KEY);
}

function shouldCheck(): boolean {
  if (typeof window === "undefined") return false;
  const last = window.localStorage.getItem(LAST_CHECK_KEY);
  if (!last) return true;
  const ms = Date.now() - new Date(last).getTime();
  return ms > MIN_CHECK_INTERVAL_MS;
}

function markChecked(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
}

export interface OverdueModule {
  module: BackupModule;
  lastBackupAt: string | null;
  thresholdDays: number;
  daysSince: number;
}

/**
 * Renvoie la liste des modules dont la sauvegarde est en retard
 * selon les fréquences configurées. null si rien à faire (pas connecté,
 * ou check déjà effectué récemment).
 */
export async function checkOverdueBackups(): Promise<OverdueModule[] | null> {
  if (!shouldCheck()) return null;

  const settings = getReminderSettings();
  const activeEntries = Object.entries(settings).filter(([, f]) => f && f !== "off") as Array<[BackupModule, ReminderFrequency]>;
  if (activeEntries.length === 0) {
    markChecked();
    return [];
  }

  const last = await lastBackupPerModule().catch(() => ({} as Record<string, { created_at: string }>));
  const now = Date.now();
  const overdue: OverdueModule[] = [];

  for (const [module, freq] of activeEntries) {
    const thresholdDays = FREQUENCY_DAYS[freq];
    const lastRec = last[module];
    const lastMs = lastRec ? new Date(lastRec.created_at).getTime() : 0;
    const daysSince = lastMs ? Math.floor((now - lastMs) / (1000 * 60 * 60 * 24)) : Infinity;
    if (daysSince >= thresholdDays) {
      overdue.push({
        module,
        lastBackupAt: lastRec?.created_at ?? null,
        thresholdDays,
        daysSince: daysSince === Infinity ? -1 : daysSince,
      });
    }
  }

  markChecked();
  return overdue;
}
