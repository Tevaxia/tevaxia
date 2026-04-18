import { describe, it, expect } from "vitest";
import {
  computeLateInterest, renderTemplate, prepareReminder,
  canSendNewPalier, nextPalier, formatEurFR,
  PALIER_LABELS, PALIER_COLORS,
  type UnpaidCharge, type ReminderRule,
} from "../coownership-reminders";

describe("computeLateInterest", () => {
  it("calcule 100€ × 5,75% × 365j = 5,75€", () => {
    expect(computeLateInterest(100, 5.75, 365)).toBeCloseTo(5.75, 2);
  });
  it("calcule pro rata : 1000€ × 5,75% × 30j = 4,73€", () => {
    expect(computeLateInterest(1000, 5.75, 30)).toBeCloseTo(4.73, 2);
  });
  it("retourne 0 si outstanding ou taux ou jours ≤ 0", () => {
    expect(computeLateInterest(0, 5, 30)).toBe(0);
    expect(computeLateInterest(100, 0, 30)).toBe(0);
    expect(computeLateInterest(100, 5, 0)).toBe(0);
    expect(computeLateInterest(-10, 5, 30)).toBe(0);
  });
  it("arrondit au centime", () => {
    const r = computeLateInterest(1234.56, 5.75, 45);
    expect(Math.round(r * 100)).toBe(Math.round(r * 100));
  });
});

describe("renderTemplate", () => {
  it("remplace les variables connues", () => {
    const out = renderTemplate("Salut {name}, vous devez {amount}", { name: "Jean", amount: 500 });
    expect(out).toBe("Salut Jean, vous devez 500");
  });
  it("laisse les variables inconnues intactes", () => {
    expect(renderTemplate("{unknown} et {x}", { x: "ok" })).toBe("{unknown} et ok");
  });
  it("gère plusieurs occurrences", () => {
    expect(renderTemplate("{a} {a}", { a: "X" })).toBe("X X");
  });
});

describe("prepareReminder", () => {
  const charge: UnpaidCharge = {
    charge_id: "ch1", call_id: "cl1", unit_id: "u1",
    lot_number: "A12", owner_name: "Dupont",
    owner_email: "d@example.com",
    coownership_id: "cp1",
    call_label: "T1 2026 Appel courant",
    due_date: "2026-01-15",
    amount_due: 1000, amount_paid: 0, amount_outstanding: 1000,
    days_late: 30, last_palier_sent: 0, eligible_palier: 2,
  };

  const rule1: ReminderRule = {
    id: "r1", coownership_id: "cp1", palier: 1,
    days_after_due: 15, label: "Rappel",
    template_body: "Montant dû : {outstanding}",
    apply_late_interest: false, interest_rate_pct: 0,
    penalty_fixed_eur: 0, min_amount_eur: 10, active: true,
    created_at: "", updated_at: "",
  };
  const rule2: ReminderRule = {
    ...rule1, palier: 2, days_after_due: 30,
    apply_late_interest: true, interest_rate_pct: 5.75,
    penalty_fixed_eur: 25,
    template_body: "Dû {outstanding} + {interest} intérêts + {penalty} frais = {total}",
  };

  it("palier 1 sans intérêt : total = outstanding", () => {
    const r = prepareReminder(charge, rule1);
    expect(r.late_interest).toBe(0);
    expect(r.penalty).toBe(0);
    expect(r.total_claimed).toBe(1000);
  });

  it("palier 2 avec intérêt + pénalité", () => {
    const r = prepareReminder(charge, rule2);
    expect(r.late_interest).toBeCloseTo(4.73, 2); // 1000 × 5.75% × 30/365
    expect(r.penalty).toBe(25);
    expect(r.total_claimed).toBeCloseTo(1029.73, 2);
  });

  it("template remplacé avec variables montant", () => {
    const r = prepareReminder(charge, rule2);
    // fr-LU utilise . comme séparateur milliers et , décimal : "1.000,00 €"
    expect(r.letter_body).toMatch(/1[\s\u202f.,]000,00/);
    expect(r.letter_body).toContain("25,00");
  });
});

describe("canSendNewPalier / nextPalier", () => {
  const mk = (last: number, eligible: number): UnpaidCharge => ({
    charge_id: "c", call_id: "cl", unit_id: "u", lot_number: "",
    owner_name: null, owner_email: null, coownership_id: "cp",
    call_label: "", due_date: "", amount_due: 0, amount_paid: 0,
    amount_outstanding: 0, days_late: 0,
    last_palier_sent: last, eligible_palier: eligible,
  });

  it("eligible > last → can send", () => {
    expect(canSendNewPalier(mk(0, 1))).toBe(true);
    expect(canSendNewPalier(mk(1, 2))).toBe(true);
  });
  it("eligible == last → cannot", () => {
    expect(canSendNewPalier(mk(1, 1))).toBe(false);
  });
  it("nextPalier = last + 1", () => {
    expect(nextPalier(mk(0, 1))).toBe(1);
    expect(nextPalier(mk(1, 2))).toBe(2);
    expect(nextPalier(mk(2, 3))).toBe(3);
  });
  it("palier 3 déjà atteint → null", () => {
    expect(nextPalier(mk(3, 3))).toBeNull();
  });
});

describe("PALIER_LABELS / COLORS", () => {
  it("3 paliers couverts", () => {
    expect(PALIER_LABELS[1]).toBe("Rappel amiable");
    expect(PALIER_LABELS[2]).toBe("Mise en demeure");
    expect(PALIER_LABELS[3]).toBe("Dernière mise en demeure");
    expect(PALIER_COLORS[3]).toContain("rose");
  });
});

describe("formatEurFR", () => {
  it("formate avec € et décimale virgule (locale fr-LU)", () => {
    const s = formatEurFR(1234.56);
    expect(s).toContain(",56");
    expect(s).toContain("€");
  });
});
