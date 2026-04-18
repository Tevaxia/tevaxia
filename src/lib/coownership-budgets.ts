// ============================================================
// COOWNERSHIP BUDGETS — budget détaillé par compte + comparatif
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";

export type BudgetNature = "courantes" | "travaux" | "fonds_travaux" | "exceptionnel";

export interface BudgetLine {
  id: string;
  coownership_id: string;
  year: number;
  account_id: string;
  amount_budgeted: number;
  allocation_key_id: string | null;
  nature: BudgetNature | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetVsActualRow {
  coownership_id: string;
  year: number;
  account_id: string;
  code: string;
  label: string;
  classe: number;
  amount_budgeted: number;
  allocation_key_id: string | null;
  nature: BudgetNature | null;
  amount_actual: number;
  variance: number;
  pct_consumed: number | null;
}

export const NATURE_LABELS: Record<BudgetNature, string> = {
  courantes: "Charges courantes",
  travaux: "Travaux",
  fonds_travaux: "Fonds travaux",
  exceptionnel: "Exceptionnel",
};

export const NATURE_COLORS: Record<BudgetNature, string> = {
  courantes: "bg-blue-100 text-blue-900",
  travaux: "bg-amber-100 text-amber-900",
  fonds_travaux: "bg-emerald-100 text-emerald-900",
  exceptionnel: "bg-rose-100 text-rose-900",
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listBudgetLines(coownershipId: string, year: number): Promise<BudgetLine[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("coownership_budget_lines")
    .select("*")
    .eq("coownership_id", coownershipId)
    .eq("year", year);
  if (error) throw error;
  return (data ?? []) as BudgetLine[];
}

export async function upsertBudgetLine(input: {
  coownership_id: string;
  year: number;
  account_id: string;
  amount_budgeted: number;
  allocation_key_id?: string | null;
  nature?: BudgetNature | null;
  notes?: string | null;
}): Promise<BudgetLine> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("coownership_budget_lines")
    .upsert(
      {
        coownership_id: input.coownership_id,
        year: input.year,
        account_id: input.account_id,
        amount_budgeted: input.amount_budgeted,
        allocation_key_id: input.allocation_key_id ?? null,
        nature: input.nature ?? "courantes",
        notes: input.notes ?? null,
        created_by: user?.id ?? null,
      },
      { onConflict: "coownership_id,year,account_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as BudgetLine;
}

export async function deleteBudgetLine(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("coownership_budget_lines").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Renvoie les lignes de la vue coownership_budget_vs_actual pour
 * afficher le comparatif budget ↔ réalisé en temps réel.
 */
export async function getBudgetVsActual(coownershipId: string, year: number): Promise<BudgetVsActualRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("coownership_budget_vs_actual")
    .select("*")
    .eq("coownership_id", coownershipId)
    .eq("year", year)
    .order("code");
  if (error) throw error;
  return (data ?? []) as BudgetVsActualRow[];
}

/**
 * Duplique un budget d'une année vers la suivante (workflow courant :
 * on part du budget précédent + ajustement indexation).
 */
export async function cloneBudgetFromPreviousYear(
  coownershipId: string,
  fromYear: number,
  toYear: number,
  uplift = 0.02,
): Promise<number> {
  const client = ensureClient();
  const previous = await listBudgetLines(coownershipId, fromYear);
  if (previous.length === 0) return 0;
  const rows = previous.map((l) => ({
    coownership_id: coownershipId,
    year: toYear,
    account_id: l.account_id,
    amount_budgeted: Math.round(l.amount_budgeted * (1 + uplift) * 100) / 100,
    allocation_key_id: l.allocation_key_id,
    nature: l.nature,
    notes: l.notes,
  }));
  const { error } = await client
    .from("coownership_budget_lines")
    .upsert(rows, { onConflict: "coownership_id,year,account_id" });
  if (error) throw error;
  return rows.length;
}

// ---------- Pure helpers ----------

/**
 * Totaux budget prévus par nature (pour ventilation dans les appels).
 */
export function totalsByNature(lines: BudgetLine[]): Record<BudgetNature, number> {
  const out: Record<BudgetNature, number> = {
    courantes: 0, travaux: 0, fonds_travaux: 0, exceptionnel: 0,
  };
  for (const l of lines) {
    const nature: BudgetNature = (l.nature ?? "courantes") as BudgetNature;
    out[nature] = (out[nature] ?? 0) + l.amount_budgeted;
  }
  return out;
}

/**
 * Résumé comparatif global : total budget, total réalisé, écart.
 */
export function summarizeBudgetVsActual(rows: BudgetVsActualRow[]): {
  totalBudgeted: number;
  totalActual: number;
  variance: number;
  pctConsumed: number | null;
  expensesBudgeted: number;
  expensesActual: number;
  incomeBudgeted: number;
  incomeActual: number;
} {
  const expensesBudgeted = rows.filter((r) => r.classe === 6).reduce((s, r) => s + r.amount_budgeted, 0);
  const expensesActual = rows.filter((r) => r.classe === 6).reduce((s, r) => s + r.amount_actual, 0);
  const incomeBudgeted = rows.filter((r) => r.classe === 7).reduce((s, r) => s + r.amount_budgeted, 0);
  const incomeActual = rows.filter((r) => r.classe === 7).reduce((s, r) => s + r.amount_actual, 0);
  const totalBudgeted = expensesBudgeted + incomeBudgeted;
  const totalActual = expensesActual + incomeActual;
  return {
    totalBudgeted,
    totalActual,
    variance: totalBudgeted - totalActual,
    pctConsumed: expensesBudgeted > 0 ? Math.round(expensesActual / expensesBudgeted * 1000) / 10 : null,
    expensesBudgeted, expensesActual,
    incomeBudgeted, incomeActual,
  };
}
