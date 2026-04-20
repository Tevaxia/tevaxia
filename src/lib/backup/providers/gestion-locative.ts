/**
 * Provider: gestion locative — lots, baux, paiements.
 * listLotsAsync() lit depuis Supabase (cloud) + fusionne local storage.
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { listLotsAsync } from "@/lib/gestion-locative";
import { listPaymentsForLot } from "@/lib/rental-payments";

async function collect(_ctx: ExportContext): Promise<BackupBundle> {
  const { items: lots } = await listLotsAsync();

  const paymentsAll: unknown[] = [];
  for (const lot of lots) {
    try {
      const payments = await listPaymentsForLot(lot.id);
      paymentsAll.push(...payments);
    } catch {
      // Lot local-only — pas de paiements cloud
    }
  }

  const files: Record<string, string> = {
    "lots.json": JSON.stringify(lots, null, 2),
    "payments.json": JSON.stringify(paymentsAll, null, 2),
  };
  return { files, counts: { lots: lots.length, payments: paymentsAll.length } };
}

export const gestionLocativeProvider: ExportProvider = {
  module: "gestion-locative",
  collect,
};
