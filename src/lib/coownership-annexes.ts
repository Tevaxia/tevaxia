// ============================================================
// COOWNERSHIP ANNEXES COMPTABLES — 5 annexes AG annuelle
// ============================================================
//
// Référence pratique LU : loi 1988 (copropriété) + loi 10 juin 1999
// (fonds travaux) + arrêtés grand-ducaux sur la comptabilité syndicale.
// Inspiré du décret français 2005-240 adapté au contexte LU qui ne
// dispose pas de modèle normalisé explicite.
//
// 5 annexes produites :
//   1. État financier (bilan)
//   2. Compte de gestion général (charges courantes)
//   3. Compte de gestion travaux
//   4. État des dettes et créances
//   5. État détaillé des dépenses

import { supabase, isSupabaseConfigured } from "./supabase";
import { getBalance, listAccounts, listEntries, listLines, type BalanceRow, type Account, type Entry, type EntryLine } from "./coownership-accounting";
import { listBudgetLines, type BudgetLine } from "./coownership-budgets";
import type { Coownership, CoownershipUnit } from "./coownerships";

// ============================================================
// Structures des 5 annexes
// ============================================================

export interface Annexe1Row {
  label: string;
  amount: number;
  isTotal?: boolean;
}

export interface Annexe1Data {
  year: number;
  items: {
    banque_operationnelle: number;
    banque_fonds_travaux: number;
    caisse: number;
    total_disponibilites: number;
    fonds_copropriete: number;
    provisions_travaux: number;
    resultat_exercice: number;
    total_capitaux: number;
    creances_coproprietaires: number; // solde débit 411
    dettes_fournisseurs: number;        // solde crédit 401
    dettes_coproprietaires: number;     // solde crédit 455
  };
}

export interface Annexe2Row {
  code: string;
  label: string;
  budgeted: number;
  actual: number;
  variance: number;
}

export interface Annexe2Data {
  year: number;
  rows: Annexe2Row[];
  totals: { budgeted: number; actual: number; variance: number };
}

export interface Annexe3Data {
  year: number;
  // Appels de fonds "travaux" + "fonds_travaux"
  rows: Annexe2Row[];
  totals: { budgeted: number; actual: number; variance: number };
  fonds_travaux_balance: number; // solde du compte 150 fin d'exercice
}

export interface Annexe4OwnerRow {
  unit_id: string;
  lot_number: string;
  owner_name: string | null;
  total_due: number;
  total_paid: number;
  balance_outstanding: number;
  oldest_unpaid: string | null;
}

export interface Annexe4Data {
  year: number;
  creances_coproprietaires: number;
  dettes_coproprietaires: number;
  dettes_fournisseurs: number;
  owners: Annexe4OwnerRow[];
}

export interface Annexe5EntryRow {
  entry_date: string;
  reference: string | null;
  label: string;
  account_code: string;
  account_label: string;
  debit: number;
  journal_code: string;
}

export interface Annexe5Data {
  year: number;
  rows: Annexe5EntryRow[];
  totalByAccount: Record<string, { label: string; total: number }>;
  grandTotal: number;
}

export interface CoownershipAnnexesBundle {
  coownership: Coownership;
  year: number;
  annexe1: Annexe1Data;
  annexe2: Annexe2Data;
  annexe3: Annexe3Data;
  annexe4: Annexe4Data;
  annexe5: Annexe5Data;
}

// ============================================================
// Helpers purs
// ============================================================

function accountBalance(balance: BalanceRow[], code: string): number {
  const row = balance.find((b) => b.code === code);
  if (!row) return 0;
  // Convention comptable : pour les comptes de classe 5 (financiers),
  // un solde débiteur positif = avoir en banque. Pour les tiers :
  // 411 débiteur → créances, 401/455 créditeur → dettes (balance < 0 ici).
  return Number(row.balance);
}

/**
 * Construit l'annexe 1 — état financier.
 */
export function buildAnnexe1(balance: BalanceRow[], year: number): Annexe1Data {
  const banque_operationnelle = Math.max(0, accountBalance(balance, "512"));
  const banque_fonds_travaux = Math.max(0, accountBalance(balance, "513") || 0);
  const caisse = Math.max(0, accountBalance(balance, "530"));
  const total_disponibilites = banque_operationnelle + banque_fonds_travaux + caisse;

  const fonds_copropriete = -accountBalance(balance, "100"); // crédit → négatif en balance
  const provisions_travaux = -accountBalance(balance, "150");
  // Résultat = produits cl.7 - charges cl.6
  const income = balance.filter((b) => b.classe === 7).reduce((s, b) => s + (Number(b.total_credit) - Number(b.total_debit)), 0);
  const expense = balance.filter((b) => b.classe === 6).reduce((s, b) => s + (Number(b.total_debit) - Number(b.total_credit)), 0);
  const resultat_exercice = income - expense;
  const total_capitaux = fonds_copropriete + provisions_travaux + resultat_exercice;

  const creances_coproprietaires = Math.max(0, accountBalance(balance, "411"));
  const dettes_fournisseurs = Math.max(0, -accountBalance(balance, "401"));
  const dettes_coproprietaires = Math.max(0, -accountBalance(balance, "455"));

  return {
    year,
    items: {
      banque_operationnelle, banque_fonds_travaux, caisse, total_disponibilites,
      fonds_copropriete, provisions_travaux, resultat_exercice, total_capitaux,
      creances_coproprietaires, dettes_fournisseurs, dettes_coproprietaires,
    },
  };
}

/**
 * Annexe 2 — charges courantes (classe 6 hors travaux).
 * Travaux = budgets de nature "travaux" + "fonds_travaux" → annexe 3.
 */
export function buildAnnexe2(balance: BalanceRow[], budget: BudgetLine[], year: number): Annexe2Data {
  const travauxAccountIds = new Set(
    budget.filter((b) => b.nature === "travaux" || b.nature === "fonds_travaux").map((b) => b.account_id),
  );
  const rows: Annexe2Row[] = balance
    .filter((b) => b.classe === 6 && !travauxAccountIds.has(b.account_id))
    .map((b) => {
      const bl = budget.find((x) => x.account_id === b.account_id);
      const budgeted = bl?.amount_budgeted ?? 0;
      const actual = Number(b.total_debit) - Number(b.total_credit);
      return { code: b.code, label: b.label, budgeted, actual, variance: budgeted - actual };
    });
  const totals = rows.reduce((acc, r) => ({
    budgeted: acc.budgeted + r.budgeted,
    actual: acc.actual + r.actual,
    variance: acc.variance + r.variance,
  }), { budgeted: 0, actual: 0, variance: 0 });
  return { year, rows, totals };
}

/**
 * Annexe 3 — travaux et fonds travaux.
 */
export function buildAnnexe3(balance: BalanceRow[], budget: BudgetLine[], year: number): Annexe3Data {
  const travauxAccountIds = new Set(
    budget.filter((b) => b.nature === "travaux" || b.nature === "fonds_travaux").map((b) => b.account_id),
  );
  const rows: Annexe2Row[] = balance
    .filter((b) => b.classe === 6 && travauxAccountIds.has(b.account_id))
    .map((b) => {
      const bl = budget.find((x) => x.account_id === b.account_id);
      const budgeted = bl?.amount_budgeted ?? 0;
      const actual = Number(b.total_debit) - Number(b.total_credit);
      return { code: b.code, label: b.label, budgeted, actual, variance: budgeted - actual };
    });
  const totals = rows.reduce((acc, r) => ({
    budgeted: acc.budgeted + r.budgeted,
    actual: acc.actual + r.actual,
    variance: acc.variance + r.variance,
  }), { budgeted: 0, actual: 0, variance: 0 });
  const fonds_travaux_balance = Math.max(0, -accountBalance(balance, "150"));
  return { year, rows, totals, fonds_travaux_balance };
}

/**
 * Annexe 4 — dettes & créances.
 * Données individuelles copropriétaires depuis la vue coownership_owner_balance.
 */
export async function buildAnnexe4(
  coownershipId: string,
  balance: BalanceRow[],
  year: number,
): Promise<Annexe4Data> {
  const creances_coproprietaires = Math.max(0, accountBalance(balance, "411"));
  const dettes_coproprietaires = Math.max(0, -accountBalance(balance, "455"));
  const dettes_fournisseurs = Math.max(0, -accountBalance(balance, "401"));

  let owners: Annexe4OwnerRow[] = [];
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("coownership_owner_balance")
      .select("*")
      .eq("coownership_id", coownershipId);
    owners = ((data ?? []) as Array<{
      unit_id: string; lot_number: string; owner_name: string | null;
      total_due: number; total_paid: number; balance_outstanding: number;
      oldest_unpaid_due_date: string | null;
    }>)
      .map((o) => ({
        unit_id: o.unit_id,
        lot_number: o.lot_number,
        owner_name: o.owner_name,
        total_due: Number(o.total_due),
        total_paid: Number(o.total_paid),
        balance_outstanding: Number(o.balance_outstanding),
        oldest_unpaid: o.oldest_unpaid_due_date,
      }))
      .filter((o) => o.total_due > 0 || o.balance_outstanding > 0)
      .sort((a, b) => b.balance_outstanding - a.balance_outstanding);
  }
  return { year, creances_coproprietaires, dettes_coproprietaires, dettes_fournisseurs, owners };
}

/**
 * Annexe 5 — état détaillé des dépenses (classe 6).
 */
export async function buildAnnexe5(
  coownershipId: string,
  yearId: string,
  year: number,
): Promise<Annexe5Data> {
  const [accounts, entries] = await Promise.all([
    listAccounts(coownershipId),
    listEntries(yearId),
  ]);
  const accountMap: Record<string, Account> = {};
  for (const a of accounts) accountMap[a.id] = a;

  const rows: Annexe5EntryRow[] = [];
  const totalByAccount: Record<string, { label: string; total: number }> = {};
  let grandTotal = 0;

  for (const e of entries) {
    const lines = await listLines(e.id);
    for (const l of lines as EntryLine[]) {
      const acc = accountMap[l.account_id];
      if (!acc || acc.classe !== 6) continue;
      const debit = Number(l.debit);
      if (debit <= 0) continue;
      rows.push({
        entry_date: e.entry_date,
        reference: e.reference,
        label: (l.line_label ?? "").trim() || e.label,
        account_code: acc.code,
        account_label: acc.label,
        debit,
        journal_code: e.journal_code,
      });
      if (!totalByAccount[acc.code]) {
        totalByAccount[acc.code] = { label: acc.label, total: 0 };
      }
      totalByAccount[acc.code].total += debit;
      grandTotal += debit;
    }
  }
  rows.sort((a, b) => (a.entry_date < b.entry_date ? -1 : a.entry_date > b.entry_date ? 1 : 0));
  return { year, rows, totalByAccount, grandTotal };
}

/**
 * Orchestrateur : charge toutes les données et assemble le bundle des 5 annexes.
 */
export async function buildCoownershipAnnexes(input: {
  coownership: Coownership;
  yearId: string;
  year: number;
}): Promise<CoownershipAnnexesBundle> {
  const { coownership, yearId, year } = input;
  const [balance, budget, annexe5] = await Promise.all([
    getBalance(coownership.id, year),
    listBudgetLines(coownership.id, year),
    buildAnnexe5(coownership.id, yearId, year),
  ]);
  const annexe1 = buildAnnexe1(balance, year);
  const annexe2 = buildAnnexe2(balance, budget, year);
  const annexe3 = buildAnnexe3(balance, budget, year);
  const annexe4 = await buildAnnexe4(coownership.id, balance, year);
  return { coownership, year, annexe1, annexe2, annexe3, annexe4, annexe5 };
}
