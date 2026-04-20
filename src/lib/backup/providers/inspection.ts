/**
 * Provider: inspection TEGOVA — checklists terrain stockées en localStorage.
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";

const STORAGE_KEY = "tevaxia_inspection_draft";

async function collect(_ctx: ExportContext): Promise<BackupBundle> {
  let raw: string | null = null;
  if (typeof window !== "undefined") {
    raw = window.localStorage.getItem(STORAGE_KEY);
  }
  const data = raw ? JSON.parse(raw) : null;

  const files: Record<string, string> = {
    "inspection_draft.json": JSON.stringify(data, null, 2),
  };
  return { files, counts: { draft: data ? 1 : 0 } };
}

export const inspectionProvider: ExportProvider = {
  module: "inspection",
  collect,
};
