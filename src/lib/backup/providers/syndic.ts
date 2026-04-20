/**
 * SyndicExportProvider — copropriétés, lots, AG, appels de fonds,
 * comptabilité, budgets, clés de répartition, relances.
 *
 * Tout est fetché côté client via Supabase (RLS scope par org_id).
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { listCoownerships, listUnits } from "@/lib/coownerships";
import { listAssemblies, listResolutions, listVotes } from "@/lib/coownership-assemblies";
import { listBudgets, listCalls, listCharges } from "@/lib/coownership-finance";
import { listBudgetLines } from "@/lib/coownership-budgets";
import { listAllocationKeys, listUnitAllocations } from "@/lib/coownership-allocations";
import { listYears, listAccounts, listEntries } from "@/lib/coownership-accounting";
import { listRemindersSent, listUnpaidCharges } from "@/lib/coownership-reminders";

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
      for (const r of resolutions) {
        const votes = await listVotes(r.id);
        votesAll.push(...votes);
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

  return { files, counts };
}

export const syndicProvider: ExportProvider = {
  module: "syndic",
  collect,
};
