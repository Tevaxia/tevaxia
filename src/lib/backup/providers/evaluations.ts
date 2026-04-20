/**
 * Provider: évaluations perso — valorisations EVS 2025 + estimations sauvegardées.
 * Lit depuis localStorage + Supabase (cloud sync).
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { listerEvaluationsAsync } from "@/lib/storage";

async function collect(_ctx: ExportContext): Promise<BackupBundle> {
  const { items } = await listerEvaluationsAsync();
  const files: Record<string, string> = {
    "valuations.json": JSON.stringify(items, null, 2),
  };
  return { files, counts: { valuations: items.length } };
}

export const evaluationsProvider: ExportProvider = {
  module: "evaluations",
  collect,
};
