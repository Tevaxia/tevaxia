import { describe, it, expect } from "vitest";
import {
  COEFFICIENTS_REEVALUATION,
  TAUX_DROITS_TOTAL,
  TAUX_ENREGISTREMENT,
  TAUX_TRANSCRIPTION,
  BELLEGEN_AKT_PAR_PERSONNE,
  BELLEGEN_AKT_COUPLE,
  BAREME_NOTAIRE,
  BAREME_IR_CLASSE1,
  SEUIL_SPECULATION_ANNEES,
  ABATTEMENT_CESSION,
  ABATTEMENT_CESSION_COUPLE,
  KLIMAPRET_TAUX,
  KLIMAPRET_MAX,
} from "../constants";

describe("COEFFICIENTS_REEVALUATION", () => {
  it("covers 1960 to 2026", () => {
    expect(COEFFICIENTS_REEVALUATION[1960]).toBeDefined();
    expect(COEFFICIENTS_REEVALUATION[2026]).toBeDefined();
  });

  it("coefficients decrease over time (recent years worth less revaluation)", () => {
    expect(COEFFICIENTS_REEVALUATION[1960]).toBeGreaterThan(COEFFICIENTS_REEVALUATION[2000]);
    expect(COEFFICIENTS_REEVALUATION[2000]).toBeGreaterThan(COEFFICIENTS_REEVALUATION[2026]);
  });

  it("2025 coefficient is 1.52", () => {
    expect(COEFFICIENTS_REEVALUATION[2025]).toBe(1.52);
  });

  it("no coefficient exceeds 16", () => {
    for (const coeff of Object.values(COEFFICIENTS_REEVALUATION)) {
      expect(coeff).toBeLessThanOrEqual(16);
      expect(coeff).toBeGreaterThan(0);
    }
  });
});

describe("Droits d'enregistrement", () => {
  it("total = enregistrement + transcription = 7%", () => {
    expect(TAUX_ENREGISTREMENT + TAUX_TRANSCRIPTION).toBeCloseTo(TAUX_DROITS_TOTAL);
  });

  it("Bellegen Akt couple = 2x individual", () => {
    expect(BELLEGEN_AKT_COUPLE).toBe(BELLEGEN_AKT_PAR_PERSONNE * 2);
  });
});

describe("BAREME_NOTAIRE", () => {
  it("has 8 tranches", () => {
    expect(BAREME_NOTAIRE).toHaveLength(8);
  });

  it("tranches are in ascending order", () => {
    for (let i = 1; i < BAREME_NOTAIRE.length; i++) {
      expect(BAREME_NOTAIRE[i].limite).toBeGreaterThan(BAREME_NOTAIRE[i - 1].limite);
    }
  });

  it("rates decrease with higher amounts", () => {
    for (let i = 1; i < BAREME_NOTAIRE.length; i++) {
      expect(BAREME_NOTAIRE[i].taux).toBeLessThanOrEqual(BAREME_NOTAIRE[i - 1].taux);
    }
  });

  it("last tranche covers infinity", () => {
    expect(BAREME_NOTAIRE[BAREME_NOTAIRE.length - 1].limite).toBe(Infinity);
  });

  it("calculates notary fees for 750k correctly", () => {
    let fees = 0;
    let remaining = 750_000;
    let prevLimit = 0;
    for (const tranche of BAREME_NOTAIRE) {
      const taxable = Math.min(remaining, tranche.limite - prevLimit);
      fees += taxable * tranche.taux;
      remaining -= taxable;
      prevLimit = tranche.limite;
      if (remaining <= 0) break;
    }
    // Should be around 5000-6000€ for a 750k property
    expect(fees).toBeGreaterThan(4000);
    expect(fees).toBeLessThan(7000);
  });
});

describe("BAREME_IR_CLASSE1", () => {
  it("starts with 0% tax", () => {
    expect(BAREME_IR_CLASSE1[0].taux).toBe(0);
  });

  it("top marginal rate is 42%", () => {
    const lastTranche = BAREME_IR_CLASSE1[BAREME_IR_CLASSE1.length - 1];
    expect(lastTranche.taux).toBe(0.42);
  });

  it("rates increase monotonically", () => {
    for (let i = 1; i < BAREME_IR_CLASSE1.length; i++) {
      expect(BAREME_IR_CLASSE1[i].taux).toBeGreaterThanOrEqual(BAREME_IR_CLASSE1[i - 1].taux);
    }
  });
});

describe("Plus-values constants", () => {
  it("speculation threshold is 2 years", () => {
    expect(SEUIL_SPECULATION_ANNEES).toBe(2);
  });

  it("couple abatement is double", () => {
    expect(ABATTEMENT_CESSION_COUPLE).toBe(ABATTEMENT_CESSION * 2);
  });
});

describe("Klimaprêt constants", () => {
  it("rate is 1.5%", () => {
    expect(KLIMAPRET_TAUX).toBe(0.015);
  });

  it("max is 100k€", () => {
    expect(KLIMAPRET_MAX).toBe(100_000);
  });
});
