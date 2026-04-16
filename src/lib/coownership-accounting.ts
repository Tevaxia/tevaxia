// ============================================================
// COOWNERSHIP ACCOUNTING — plan comptable + journal + balance
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type AccountingYearStatus = "open" | "closed";
export type JournalCode = "ACH" | "BQ" | "VT" | "OD" | "AN";

export interface AccountingYear {
  id: string;
  coownership_id: string;
  year: number;
  status: AccountingYearStatus;
  opened_at: string;
  closed_at: string | null;
  closing_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  coownership_id: string;
  code: string;
  label: string;
  classe: number;
  account_type: AccountType;
  is_system: boolean;
  created_at: string;
}

export interface Entry {
  id: string;
  coownership_id: string;
  year_id: string;
  entry_date: string;
  reference: string | null;
  label: string;
  journal_code: JournalCode;
  is_locked: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryLine {
  id: string;
  entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  line_label: string | null;
  created_at: string;
}

export interface BalanceRow {
  account_id: string;
  code: string;
  label: string;
  classe: number;
  account_type: AccountType;
  total_debit: number;
  total_credit: number;
  balance: number;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export const JOURNAL_LABEL: Record<JournalCode, string> = {
  ACH: "Achats",
  BQ: "Banque",
  VT: "Ventes / Appels",
  OD: "Opérations diverses",
  AN: "À-nouveaux",
};

export const CLASSE_LABEL: Record<number, string> = {
  1: "Capitaux",
  2: "Immobilisations",
  3: "Stocks",
  4: "Tiers",
  5: "Financiers",
  6: "Charges",
  7: "Produits",
};

// ---------- Years ----------

export async function listYears(coownershipId: string): Promise<AccountingYear[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_accounting_years")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("year", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AccountingYear[];
}

export async function openYear(coownershipId: string, year: number): Promise<AccountingYear> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("coownership_accounting_years")
    .insert({ coownership_id: coownershipId, year, created_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as AccountingYear;
}

export async function closeYear(yearId: string): Promise<number> {
  const client = ensureClient();
  const { data, error } = await client.rpc("close_accounting_year", { p_year_id: yearId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return Number(row?.result_amount ?? 0);
}

// ---------- Chart of accounts ----------

export async function listAccounts(coownershipId: string): Promise<Account[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("accounting_accounts")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("code", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function seedChart(coownershipId: string): Promise<number> {
  const client = ensureClient();
  const { data, error } = await client.rpc("seed_accounting_chart", { p_coownership_id: coownershipId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function createAccount(input: {
  coownership_id: string;
  code: string;
  label: string;
  classe: number;
  account_type: AccountType;
}): Promise<Account> {
  const client = ensureClient();
  const { data, error } = await client
    .from("accounting_accounts")
    .insert({ ...input, is_system: false })
    .select("*")
    .single();
  if (error) throw error;
  return data as Account;
}

export async function deleteAccount(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("accounting_accounts").delete().eq("id", id).eq("is_system", false);
  if (error) throw error;
}

// ---------- Entries ----------

export async function listEntries(yearId: string): Promise<Entry[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("accounting_entries")
    .select("*")
    .eq("year_id", yearId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function createEntryWithLines(input: {
  coownership_id: string;
  year_id: string;
  entry_date: string;
  reference?: string;
  label: string;
  journal_code?: JournalCode;
  lines: { account_id: string; debit: number; credit: number; line_label?: string }[];
}): Promise<Entry> {
  const client = ensureClient();

  const totalDebit = input.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = input.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Écriture non équilibrée : débit ${totalDebit.toFixed(2)} ≠ crédit ${totalCredit.toFixed(2)}`);
  }
  if (totalDebit === 0) {
    throw new Error("L'écriture doit contenir au moins un débit et un crédit non nuls.");
  }

  const { data: { user } } = await client.auth.getUser();

  const { data: entry, error: entryErr } = await client
    .from("accounting_entries")
    .insert({
      coownership_id: input.coownership_id,
      year_id: input.year_id,
      entry_date: input.entry_date,
      reference: input.reference ?? null,
      label: input.label,
      journal_code: input.journal_code ?? "OD",
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (entryErr) throw entryErr;

  const linesPayload = input.lines
    .filter((l) => (Number(l.debit) || 0) + (Number(l.credit) || 0) > 0)
    .map((l) => ({
      entry_id: (entry as Entry).id,
      account_id: l.account_id,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      line_label: l.line_label ?? null,
    }));

  const { error: linesErr } = await client.from("accounting_entry_lines").insert(linesPayload);
  if (linesErr) throw linesErr;

  return entry as Entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("accounting_entries").delete().eq("id", id).eq("is_locked", false);
  if (error) throw error;
}

export async function listLines(entryId: string): Promise<EntryLine[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("accounting_entry_lines")
    .select("*")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EntryLine[];
}

// ---------- Balance ----------

export async function getBalance(coownershipId: string, year: number): Promise<BalanceRow[]> {
  const client = ensureClient();
  const { data, error } = await client.rpc("accounting_balance", { p_coownership_id: coownershipId, p_year: year });
  if (error) throw error;
  return (data ?? []) as BalanceRow[];
}

// ---------- Helpers ----------

export function computeResult(balance: BalanceRow[]): { income: number; expense: number; result: number } {
  const income = balance.filter((b) => b.classe === 7).reduce((s, b) => s + (b.total_credit - b.total_debit), 0);
  const expense = balance.filter((b) => b.classe === 6).reduce((s, b) => s + (b.total_debit - b.total_credit), 0);
  return { income, expense, result: income - expense };
}
