import { describe, it, expect } from "vitest";
import {
  totalsByNature,
  summarizeBudgetVsActual,
  NATURE_LABELS,
  type BudgetLine,
  type BudgetVsActualRow,
} from "../coownership-budgets";

function fakeLine(nature: string, amount: number, i = 0): BudgetLine {
  return {
    id: `id-${i}`,
    coownership_id: "c1",
    year: 2026,
    account_id: `acc-${i}`,
    amount_budgeted: amount,
    allocation_key_id: null,
    nature: nature as BudgetLine["nature"],
    notes: null,
    created_by: null,
    created_at: "",
    updated_at: "",
  };
}

function fakeRow(classe: number, code: string, budgeted: number, actual: number): BudgetVsActualRow {
  return {
    coownership_id: "c1",
    year: 2026,
    account_id: `acc-${code}`,
    code, label: `Compte ${code}`, classe,
    amount_budgeted: budgeted,
    allocation_key_id: null,
    nature: "courantes",
    amount_actual: actual,
    variance: budgeted - actual,
    pct_consumed: budgeted === 0 ? null : Math.round(actual / budgeted * 1000) / 10,
  };
}

describe("totalsByNature", () => {
  it("totalise par nature", () => {
    const lines: BudgetLine[] = [
      fakeLine("courantes", 5000, 1),
      fakeLine("courantes", 3000, 2),
      fakeLine("travaux", 10000, 3),
      fakeLine("fonds_travaux", 2500, 4),
    ];
    const t = totalsByNature(lines);
    expect(t.courantes).toBe(8000);
    expect(t.travaux).toBe(10000);
    expect(t.fonds_travaux).toBe(2500);
    expect(t.exceptionnel).toBe(0);
  });
  it("considère null comme 'courantes' par défaut", () => {
    const lines: BudgetLine[] = [{ ...fakeLine("courantes", 1000), nature: null }];
    expect(totalsByNature(lines).courantes).toBe(1000);
  });
});

describe("NATURE_LABELS", () => {
  it("couvre les 4 natures", () => {
    expect(NATURE_LABELS.courantes).toBeDefined();
    expect(NATURE_LABELS.travaux).toBeDefined();
    expect(NATURE_LABELS.fonds_travaux).toBeDefined();
    expect(NATURE_LABELS.exceptionnel).toBeDefined();
  });
});

describe("summarizeBudgetVsActual", () => {
  it("calcule totaux charges/produits + variance", () => {
    const rows: BudgetVsActualRow[] = [
      fakeRow(6, "606", 12000, 8500),  // énergie budgété 12000 réalisé 8500
      fakeRow(6, "615", 6000, 7200),   // entretien dépassé
      fakeRow(7, "701", 20000, 15000), // appels de fonds encaissés partiellement
    ];
    const s = summarizeBudgetVsActual(rows);
    expect(s.expensesBudgeted).toBe(18000);
    expect(s.expensesActual).toBe(15700);
    expect(s.incomeBudgeted).toBe(20000);
    expect(s.incomeActual).toBe(15000);
    expect(s.pctConsumed).toBeCloseTo(87.2, 1);
  });
  it("pctConsumed null si budget dépenses = 0", () => {
    const rows: BudgetVsActualRow[] = [fakeRow(7, "701", 10000, 5000)];
    const s = summarizeBudgetVsActual(rows);
    expect(s.pctConsumed).toBeNull();
  });
  it("dépassement budget : pctConsumed > 100", () => {
    const rows: BudgetVsActualRow[] = [fakeRow(6, "615", 1000, 1500)];
    const s = summarizeBudgetVsActual(rows);
    expect(s.pctConsumed).toBeGreaterThan(100);
  });
});
