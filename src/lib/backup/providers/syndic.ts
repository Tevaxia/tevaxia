/**
 * SyndicExportProvider — copropriétés, lots, AG, appels de fonds,
 * comptabilité, budgets, clés de répartition, relances.
 *
 * Tout est fetché côté client via Supabase (RLS scope par org_id).
 */

import { createElement } from "react";
import type { ReactElement } from "react";
import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { listCoownerships, listUnits } from "@/lib/coownerships";
import { listAssemblies, listResolutions, listVotes } from "@/lib/coownership-assemblies";
import { listBudgets, listCalls, listCharges } from "@/lib/coownership-finance";
import { listBudgetLines } from "@/lib/coownership-budgets";
import { listAllocationKeys, listUnitAllocations } from "@/lib/coownership-allocations";
import { listYears, listAccounts, listEntries } from "@/lib/coownership-accounting";
import { listRemindersSent, listUnpaidCharges } from "@/lib/coownership-reminders";
import { getProfile } from "@/lib/profile";

function safeFilename(s: string): string {
  return s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

async function collect(ctx: ExportContext): Promise<BackupBundle> {
  if (!isSupabaseConfigured || !supabase || !ctx.orgId) {
    throw new Error("Supabase ou organisation non disponible");
  }

  const coownerships = await listCoownerships(ctx.orgId);

  const unitsAll: unknown[] = [];
  const assembliesAll: unknown[] = [];
  const resolutionsAll: unknown[] = [];
  const votesAll: unknown[] = [];
  const budgetsAll: unknown[] = [];
  const budgetLinesAll: unknown[] = [];
  const callsAll: unknown[] = [];
  const chargesAll: unknown[] = [];
  const allocationKeysAll: unknown[] = [];
  const unitAllocationsAll: unknown[] = [];
  const accountingYearsAll: unknown[] = [];
  const accountsAll: unknown[] = [];
  const entriesAll: unknown[] = [];
  const remindersAll: unknown[] = [];
  const unpaidAll: unknown[] = [];

  // PDFs : lazy-load @react-pdf/renderer seulement si besoin
  const binaries: Record<string, Uint8Array> = {};
  let pdfModule: typeof import("@react-pdf/renderer") | null = null;
  let AssemblyMinutesPdf: typeof import("@/components/AssemblyMinutesPdf").default | null = null;
  const profile = getProfile();

  for (const copro of coownerships) {
    const [units, assemblies, budgets, calls, allocationKeys, accountingYears, accounts, reminders, unpaid] = await Promise.all([
      listUnits(copro.id),
      listAssemblies(copro.id),
      listBudgets(copro.id),
      listCalls(copro.id),
      listAllocationKeys(copro.id),
      listYears(copro.id),
      listAccounts(copro.id),
      listRemindersSent(copro.id, 1000),
      listUnpaidCharges(copro.id),
    ]);

    unitsAll.push(...units);
    assembliesAll.push(...assemblies);
    budgetsAll.push(...budgets);
    callsAll.push(...calls);
    allocationKeysAll.push(...allocationKeys);
    accountingYearsAll.push(...accountingYears);
    accountsAll.push(...accounts);
    remindersAll.push(...reminders);
    unpaidAll.push(...unpaid);

    for (const ag of assemblies) {
      const resolutions = await listResolutions(ag.id);
      resolutionsAll.push(...resolutions);
      const votesByResolution: Record<string, unknown[]> = {};
      for (const r of resolutions) {
        const votes = await listVotes(r.id);
        votesAll.push(...votes);
        votesByResolution[r.id] = votes;
      }

      // PV PDF pour AG closed/in_progress avec résolutions
      const shouldGenPdf = resolutions.length > 0 && (ag.status === "closed" || ag.status === "in_progress");
      if (shouldGenPdf) {
        try {
          if (!pdfModule) pdfModule = await import("@react-pdf/renderer");
          if (!AssemblyMinutesPdf) {
            const mod = await import("@/components/AssemblyMinutesPdf");
            AssemblyMinutesPdf = mod.default;
          }
          const element = createElement(AssemblyMinutesPdf, {
            coownership: { name: copro.name, address: copro.address, total_tantiemes: copro.total_tantiemes },
            syndic: { name: profile.nomComplet || profile.societe || "Syndic", email: profile.email },
            assembly: ag,
            resolutions,
            votesByResolution: votesByResolution as Record<string, import("@/lib/coownership-assemblies").AssemblyVote[]>,
          }) as ReactElement;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blob = await pdfModule.pdf(element as any).toBlob();
          const buf = new Uint8Array(await blob.arrayBuffer());
          const date = ag.scheduled_at ? new Date(ag.scheduled_at).toISOString().slice(0, 10) : "undated";
          const name = `PV-AG-${safeFilename(copro.name)}-${safeFilename(ag.title)}-${date}.pdf`;
          binaries[name] = buf;
        } catch {
          // Best-effort : si la génération PDF échoue, on continue l'export sans
        }
      }
    }

    for (const call of calls) {
      const charges = await listCharges(call.id);
      chargesAll.push(...charges);
    }

    for (const key of allocationKeys) {
      const allocs = await listUnitAllocations(key.id);
      unitAllocationsAll.push(...allocs);
    }

    for (const year of accountingYears) {
      const entries = await listEntries(year.id);
      entriesAll.push(...entries);

      const distinctYears = new Set(budgets.map((b) => b.year));
      distinctYears.forEach(async (y) => {
        const lines = await listBudgetLines(copro.id, y);
        budgetLinesAll.push(...lines);
      });
    }

    // Budget lines (standalone)
    const distinctBudgetYears = Array.from(new Set(budgets.map((b) => b.year)));
    for (const y of distinctBudgetYears) {
      const lines = await listBudgetLines(copro.id, y);
      budgetLinesAll.push(...lines);
    }
  }

  const toJson = (v: unknown) => JSON.stringify(v, null, 2);

  const files: Record<string, string> = {
    "coownerships.json": toJson(coownerships),
    "units.json": toJson(unitsAll),
    "assemblies.json": toJson(assembliesAll),
    "resolutions.json": toJson(resolutionsAll),
    "votes.json": toJson(votesAll),
    "budgets.json": toJson(budgetsAll),
    "budget_lines.json": toJson(budgetLinesAll),
    "calls.json": toJson(callsAll),
    "charges.json": toJson(chargesAll),
    "allocation_keys.json": toJson(allocationKeysAll),
    "unit_allocations.json": toJson(unitAllocationsAll),
    "accounting_years.json": toJson(accountingYearsAll),
    "accounts.json": toJson(accountsAll),
    "entries.json": toJson(entriesAll),
    "reminders.json": toJson(remindersAll),
    "unpaid_charges.json": toJson(unpaidAll),
  };

  const counts: Record<string, number> = {
    coownerships: coownerships.length,
    units: unitsAll.length,
    assemblies: assembliesAll.length,
    resolutions: resolutionsAll.length,
    votes: votesAll.length,
    budgets: budgetsAll.length,
    budget_lines: budgetLinesAll.length,
    calls: callsAll.length,
    charges: chargesAll.length,
    allocation_keys: allocationKeysAll.length,
    unit_allocations: unitAllocationsAll.length,
    accounting_years: accountingYearsAll.length,
    accounts: accountsAll.length,
    entries: entriesAll.length,
    reminders: remindersAll.length,
    unpaid_charges: unpaidAll.length,
  };

  const pdfCount = Object.keys(binaries).length;
  if (pdfCount > 0) counts.pv_pdfs = pdfCount;

  return { files, counts, binaries };
}

export const syndicProvider: ExportProvider = {
  module: "syndic",
  collect,
};
