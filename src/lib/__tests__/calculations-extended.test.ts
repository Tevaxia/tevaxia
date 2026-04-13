import { describe, it, expect } from "vitest";
import {
  calculerEmolumentsNotaire,
  calculerFraisAcquisition,
  calculerImpotBareme,
  tauxMoyenIR,
  simulerAides,
  genererTableauAmortissement,
  calculerMensualite,
  formatEUR,
  formatPct,
} from "../calculations";

describe("calculerEmolumentsNotaire", () => {
  it("calculates for small amount (first tranche only)", () => {
    // 5000 × 4% = 200
    expect(calculerEmolumentsNotaire(5000)).toBeCloseTo(200, 0);
  });

  it("calculates for 750k (multiple tranches)", () => {
    const result = calculerEmolumentsNotaire(750000);
    // Manual: 10k×4% + 15k×2% + 25k×1.5% + 50k×1% + 150k×0.8% + 250k×0.5% + 250k×0.4%
    // = 400 + 300 + 375 + 500 + 1200 + 1250 + 1000 = 5025
    expect(result).toBeCloseTo(5025, 0);
  });

  it("returns 0 for 0 amount", () => {
    expect(calculerEmolumentsNotaire(0)).toBe(0);
  });

  it("increases with amount", () => {
    expect(calculerEmolumentsNotaire(500000)).toBeLessThan(calculerEmolumentsNotaire(750000));
  });
});

describe("calculerFraisAcquisition — extended", () => {
  it("applies temporary 3.5% rate for Oct 2024 - June 2025", () => {
    const normal = calculerFraisAcquisition({
      prixBien: 500000,
      estNeuf: false,
      residencePrincipale: false,
      nbAcquereurs: 1,
    });
    const reduced = calculerFraisAcquisition({
      prixBien: 500000,
      estNeuf: false,
      residencePrincipale: false,
      nbAcquereurs: 1,
      dateActe: "2025-03",
    });
    // Normal: 7% = 35000, Reduced: 3.5% = 17500
    expect(normal.droitsTotal).toBe(35000);
    expect(reduced.droitsTotal).toBe(17500);
  });

  it("calculates TVA for VEFA with residence principale", () => {
    const result = calculerFraisAcquisition({
      prixBien: 600000,
      estNeuf: true,
      residencePrincipale: true,
      nbAcquereurs: 2,
      partTerrain: 200000,
      partConstruction: 400000,
    });
    // TVA on construction part with 3% reduced rate + faveur fiscale
    expect(result.faveurFiscaleTva).toBeGreaterThan(0);
    expect(result.faveurFiscaleTva).toBeLessThanOrEqual(50000);
    expect(result.montantTva).toBeLessThan(400000 * 0.17); // less than full 17%
  });

  it("calculates mortgage inscription fees", () => {
    const result = calculerFraisAcquisition({
      prixBien: 500000,
      estNeuf: false,
      residencePrincipale: true,
      nbAcquereurs: 1,
      montantHypotheque: 400000,
    });
    // Mortgage inscription: 0.5% of 400k = 2000 + notary fees on mortgage
    expect(result.droitsHypotheque).toBe(2000);
    expect(result.fraisHypotheque).toBeGreaterThan(2000);
  });

  it("totalPourcentage is consistent", () => {
    const result = calculerFraisAcquisition({
      prixBien: 750000,
      estNeuf: false,
      residencePrincipale: false,
      nbAcquereurs: 1,
    });
    expect(result.totalPourcentage).toBeCloseTo(result.totalFrais / 750000, 4);
    expect(result.coutTotalAcquisition).toBe(750000 + result.totalFrais);
  });
});

describe("calculerImpotBareme", () => {
  it("returns 0 for income below first threshold", () => {
    expect(calculerImpotBareme(10000)).toBe(0);
  });

  it("returns 0 for exactly 12438", () => {
    expect(calculerImpotBareme(12438)).toBe(0);
  });

  it("calculates tax for 50k income", () => {
    const tax = calculerImpotBareme(50000);
    expect(tax).toBeGreaterThan(5000);
    expect(tax).toBeLessThan(15000);
  });

  it("tax increases with income", () => {
    expect(calculerImpotBareme(30000)).toBeLessThan(calculerImpotBareme(60000));
    expect(calculerImpotBareme(60000)).toBeLessThan(calculerImpotBareme(100000));
  });

  it("top rate applies for very high income", () => {
    const tax100k = calculerImpotBareme(100000);
    const tax200k = calculerImpotBareme(200000);
    // Marginal rate should be ~42% for the top tranche
    const marginalRate = (tax200k - tax100k) / 100000;
    expect(marginalRate).toBeGreaterThan(0.38);
    expect(marginalRate).toBeLessThanOrEqual(0.42);
  });
});

describe("tauxMoyenIR", () => {
  it("returns 0 for non-taxable income", () => {
    expect(tauxMoyenIR(10000)).toBe(0);
  });

  it("average rate is less than marginal rate", () => {
    const avg = tauxMoyenIR(80000);
    expect(avg).toBeGreaterThan(0);
    expect(avg).toBeLessThan(0.42); // less than top marginal
  });
});

describe("simulerAides", () => {
  it("returns empty for non-residence principale", () => {
    const result = simulerAides({
      prixBien: 500000,
      residencePrincipale: false,
      typeProjet: "acquisition",
      typeBien: "appartement",
      nbEmprunteurs: 1,
      revenuImposable: 60000,
      nbEnfants: 0,
      epargneReguliere3ans: false,
      montantPret: 400000,
      tauxInteret: 0.035,
      dureeAnnees: 25,
    });
    expect(result.aides).toHaveLength(0);
    expect(result.totalGeneral).toBe(0);
  });

  it("includes Bellegen Akt for acquisition", () => {
    const result = simulerAides({
      prixBien: 500000,
      residencePrincipale: true,
      typeProjet: "acquisition",
      typeBien: "appartement",
      nbEmprunteurs: 2,
      revenuImposable: 60000,
      nbEnfants: 0,
      epargneReguliere3ans: false,
      montantPret: 400000,
      tauxInteret: 0.035,
      dureeAnnees: 25,
    });
    const bellegen = result.aides.find((a) => a.nom === "Bëllegen Akt");
    expect(bellegen).toBeDefined();
    expect(bellegen!.montant).toBeGreaterThan(0);
  });

  it("includes prime epargne when eligible", () => {
    const result = simulerAides({
      prixBien: 500000,
      residencePrincipale: true,
      typeProjet: "acquisition",
      typeBien: "maison",
      nbEmprunteurs: 1,
      revenuImposable: 60000,
      nbEnfants: 0,
      epargneReguliere3ans: true,
      montantPret: 400000,
      tauxInteret: 0.035,
      dureeAnnees: 25,
    });
    const epargne = result.aides.find((a) => a.nom === "Prime d'épargne");
    expect(epargne).toBeDefined();
    expect(epargne!.montant).toBe(5000);
  });

  it("totalGeneral is sum of all aides", () => {
    const result = simulerAides({
      prixBien: 500000,
      residencePrincipale: true,
      typeProjet: "acquisition",
      typeBien: "appartement",
      nbEmprunteurs: 1,
      revenuImposable: 60000,
      nbEnfants: 2,
      epargneReguliere3ans: true,
      montantPret: 400000,
      tauxInteret: 0.035,
      dureeAnnees: 25,
    });
    expect(result.totalGeneral).toBeGreaterThan(0);
    expect(result.aides.length).toBeGreaterThanOrEqual(2);
  });
});

describe("genererTableauAmortissement", () => {
  it("generates correct number of rows", () => {
    const tableau = genererTableauAmortissement(300000, 0.035, 25);
    expect(tableau).toHaveLength(25 * 12);
  });

  it("first payment has highest interest portion", () => {
    const tableau = genererTableauAmortissement(300000, 0.035, 25);
    expect(tableau[0].interets).toBeGreaterThan(tableau[0].capital);
  });

  it("last payment has lowest interest portion", () => {
    const tableau = genererTableauAmortissement(300000, 0.035, 25);
    const last = tableau[tableau.length - 1];
    expect(last.interets).toBeLessThan(last.capital);
  });

  it("capital restant reaches ~0 at end", () => {
    const tableau = genererTableauAmortissement(300000, 0.035, 25);
    const last = tableau[tableau.length - 1];
    expect(last.capitalRestant).toBeLessThan(1);
  });

  it("all mensualites are equal", () => {
    const tableau = genererTableauAmortissement(300000, 0.035, 25);
    const m = tableau[0].mensualite;
    for (const row of tableau) {
      expect(row.mensualite).toBeCloseTo(m, 2);
    }
  });

  it("total interest paid is reasonable", () => {
    const tableau = genererTableauAmortissement(300000, 0.035, 25);
    const totalInterets = tableau.reduce((s, r) => s + r.interets, 0);
    // ~155k interest on 300k over 25 years at 3.5%
    expect(totalInterets).toBeGreaterThan(100000);
    expect(totalInterets).toBeLessThan(200000);
  });
});

describe("formatEUR", () => {
  it("formats with thousands separator", () => {
    const result = formatEUR(1234567);
    expect(result).toContain("1");
    expect(result).toContain("234");
  });
});

describe("formatPct", () => {
  it("formats percentage with decimals", () => {
    const result = formatPct(0.0534);
    expect(result).toContain("5");
    expect(result).toContain("34");
  });
});
