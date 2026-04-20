/**
 * Provider: facturation — historique Factur-X 12 mois.
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { listHistory } from "@/lib/facturation/history";

async function collect(_ctx: ExportContext): Promise<BackupBundle> {
  const history = await listHistory(500);
  const files: Record<string, string> = {
    "factur_x_history.json": JSON.stringify(history, null, 2),
  };
  return { files, counts: { factur_x: history.length } };
}

export const facturationProvider: ExportProvider = {
  module: "facturation",
  collect,
};
