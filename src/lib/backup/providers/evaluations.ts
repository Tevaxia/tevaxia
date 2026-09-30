/**
 * Provider: évaluations perso — scénarios de valeur + estimations sauvegardées.
 * Lit depuis localStorage + Supabase (cloud sync).
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { listerEvaluationsAsync } from "@/lib/storage";

async function collect(ctx: ExportContext): Promise<BackupBundle> {
  const { items, cloudError } = await listerEvaluationsAsync(ctx.userId);
  if(cloudError)throw new Error("Calculation backup unavailable");
  const files: Record<string, string> = {
    "valuations.json": JSON.stringify(items, null, 2),
  };
  return { files, counts: { valuations: items.length } };
}

export const evaluationsProvider: ExportProvider = {
  module: "evaluations",
  collect,
};
