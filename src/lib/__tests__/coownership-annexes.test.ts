import { describe, it, expect } from "vitest";
import { buildAnnexe1, buildAnnexe2, buildAnnexe3 } from "../coownership-annexes";
import type { BalanceRow } from "../coownership-accounting";
import type { BudgetLine } from "../coownership-budgets";

function balRow(code: string, label: string, classe: number, debit: number, credit: number): BalanceRow {
  return {
    account_id: `id-${code}`,
    code, label, classe,
    account_type: classe === 6 ? "expense" : classe === 7 ? "income" : "asset",
    total_debit: debit,
    total_credit: credit,
    balance: debit - credit,
  };
}

function budgetLine(accountId: string, amount: number, nature: "courantes" | "travaux" | "fonds_travaux" | "exceptionnel"): BudgetLine {
  return {
    id: `b-${accountId}`, coownership_id: "c1", year: 2026,
    account_id: accountId, amount_budgeted: amount,
    allocation_key_id: null, nature, notes: null,
    created_by: null, created_at: "", updated_at: "",
  };
}

describe("buildAnnexe1 — état financier", () => {
  it("calcule disponibilités, capitaux, résultat", () => {
    const balance: BalanceRow[] = [
      balRow("512", "Banque", 5, 20000, 5000),  // solde +15 000
      balRow("530", "Caisse", 5, 500, 100),      // solde +400
      balRow("100", "Fonds copro", 1, 0, 30000), // crédit → balance -30000
      balRow("150", "Provisions travaux", 1, 0, 10000),
      balRow("411", "Coprop débiteurs", 4, 5000, 0),  // créance 5000
      balRow("401", "Fournisseurs", 4, 0, 3000),      // dette 3000
      balRow("606", "Énergie", 6, 12000, 0),
      balRow("701", "Appels courants", 7, 0, 15000),
    ];
    const a = buildAnnexe1(balance, 2026);
    expect(a.items.banque_operationnelle).toBe(15000);
    expect(a.items.caisse).toBe(400);
    expect(a.items.total_disponibilites).toBe(15400);
    expect(a.items.fonds_copropriete).toBe(30000);
    expect(a.items.provisions_travaux).toBe(10000);
    // Résultat = 15000 (produits) - 12000 (charges) = 3000
    expect(a.items.resultat_exercice).toBe(3000);
    expect(a.items.creances_coproprietaires).toBe(5000);
    expect(a.items.dettes_fournisseurs).toBe(3000);
  });
  it("comptes absents traités comme 0", () => {
    const a = buildAnnexe1([], 2026);
    expect(a.items.banque_operationnelle).toBe(0);
    expect(a.items.total_disponibilites).toBe(0);
    expect(a.items.resultat_exercice).toBe(0);
  });
});

describe("buildAnnexe2 — charges courantes", () => {
  it("exclut les comptes de budget travaux", () => {
    const balance: BalanceRow[] = [
      balRow("606", "Énergie", 6, 12000, 0),
      balRow("615", "Entretien", 6, 8000, 0),
      balRow("670", "Gros travaux", 6, 50000, 0),
    ];
    const budget: BudgetLine[] = [
      budgetLine("id-606", 10000, "courantes"),
      budgetLine("id-615", 6000, "courantes"),
      budgetLine("id-670", 60000, "travaux"),
    ];
    const a = buildAnnexe2(balance, budget, 2026);
    expect(a.rows).toHaveLength(2);
    expect(a.rows.find((r) => r.code === "670")).toBeUndefined();
    expect(a.rows.find((r) => r.code === "606")?.variance).toBe(-2000); // 10k budget, 12k réalisé
    expect(a.totals.budgeted).toBe(16000);
    expect(a.totals.actual).toBe(20000);
  });
});

describe("buildAnnexe3 — travaux", () => {
  it("inclut uniquement comptes avec budget nature travaux ou fonds_travaux", () => {
    const balance: BalanceRow[] = [
      balRow("670", "Gros travaux", 6, 50000, 0),
      balRow("671", "Fonds travaux", 6, 10000, 0),
      balRow("606", "Énergie courante", 6, 12000, 0),
      balRow("150", "Provisions", 1, 0, 15000),
    ];
    const budget: BudgetLine[] = [
      budgetLine("id-670", 60000, "travaux"),
      budgetLine("id-671", 12000, "fonds_travaux"),
      budgetLine("id-606", 10000, "courantes"),
    ];
    const a = buildAnnexe3(balance, budget, 2026);
    expect(a.rows).toHaveLength(2);
    expect(a.totals.budgeted).toBe(72000);
    expect(a.totals.actual).toBe(60000);
    expect(a.fonds_travaux_balance).toBe(15000);
  });
});
