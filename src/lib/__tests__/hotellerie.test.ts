import { describe, it, expect } from "vitest";
import { computeHotelValuation, getDefaultsForCategory } from "@/lib/hotellerie/valuation";
import { computeHotelDscr } from "@/lib/hotellerie/dscr";
import { computeE2Score } from "@/lib/hotellerie/e2-score";

describe("hotel valuation", () => {
  it("computes RevPAR = ADR × occupancy", () => {
    const r = computeHotelValuation({
      nbChambres: 50,
      adr: 100,
      occupancy: 0.70,
      category: "midscale",
    });
    expect(r.revPAR).toBeCloseTo(70);
  });

  it("computes annual rooms revenue = revPAR × 365 × keys", () => {
    const r = computeHotelValuation({
      nbChambres: 50,
      adr: 100,
      occupancy: 0.70,
      category: "midscale",
    });
    expect(r.revenuRoomsAnnuel).toBeCloseTo(70 * 365 * 50);
  });

  it("EBITDA decreases with category staff cost (luxury < budget margin)", () => {
    const inputs = { nbChambres: 50, adr: 200, occupancy: 0.70 } as const;
    const budget = computeHotelValuation({ ...inputs, category: "budget" });
    const luxury = computeHotelValuation({ ...inputs, category: "luxury" });
    expect(budget.ebitdaMargin).toBeGreaterThan(luxury.ebitdaMargin);
  });

  it("valuation is positive when EBITDA is positive", () => {
    const r = computeHotelValuation({
      nbChambres: 50,
      adr: 150,
      occupancy: 0.70,
      category: "midscale",
    });
    expect(r.ebitda).toBeGreaterThan(0);
    expect(r.valeurCentrale).toBeGreaterThan(0);
    expect(r.fourchetteBasse).toBeLessThan(r.valeurCentrale);
    expect(r.fourchetteHaute).toBeGreaterThan(r.valeurCentrale);
  });

  it("rejects invalid inputs", () => {
    expect(() => computeHotelValuation({ nbChambres: 0, adr: 100, occupancy: 0.7, category: "midscale" })).toThrow();
    expect(() => computeHotelValuation({ nbChambres: 10, adr: -1, occupancy: 0.7, category: "midscale" })).toThrow();
    expect(() => computeHotelValuation({ nbChambres: 10, adr: 100, occupancy: 1.5, category: "midscale" })).toThrow();
  });

  it("getDefaultsForCategory returns full structure", () => {
    const d = getDefaultsForCategory("upscale");
    expect(d.capRate).toBeGreaterThan(0);
    expect(d.pricePerKey).toBeGreaterThan(0);
    expect(d.revenueMix.rooms + d.revenueMix.fb + d.revenueMix.autres).toBeCloseTo(1);
  });
});

describe("hotel DSCR", () => {
  it("DSCR central = EBITDA / annual debt service", () => {
    const r = computeHotelDscr({
      ebitdaStabilise: 500000,
      prixAcquisition: 4000000,
      travaux: 0,
      apport: 1500000,
      tauxInteretAnnuel: 0.05,
      dureeAns: 20,
    });
    const expectedDscr = 500000 / r.serviceDetteAnnuel;
    expect(r.dscrCentral).toBeCloseTo(expectedDscr, 5);
  });

  it("LTV reflects equity vs total project", () => {
    const r = computeHotelDscr({
      ebitdaStabilise: 500000,
      prixAcquisition: 4000000,
      travaux: 1000000,
      apport: 2000000,
      tauxInteretAnnuel: 0.05,
      dureeAns: 20,
    });
    expect(r.montantDette).toBeCloseTo(3000000);
    expect(r.ltv).toBeCloseTo(3000000 / 5000000);
  });

  it("flags critique when DSCR < 1", () => {
    const r = computeHotelDscr({
      ebitdaStabilise: 50000,
      prixAcquisition: 4000000,
      travaux: 0,
      apport: 500000,
      tauxInteretAnnuel: 0.05,
      dureeAns: 20,
    });
    expect(r.diagnostic).toBe("critique");
  });

  it("stress double < stress single < central DSCR", () => {
    const r = computeHotelDscr({
      ebitdaStabilise: 500000,
      prixAcquisition: 4000000,
      travaux: 0,
      apport: 1500000,
      tauxInteretAnnuel: 0.05,
      dureeAns: 20,
    });
    expect(r.dscrStressDouble).toBeLessThan(r.dscrStressOccupation);
    expect(r.dscrStressOccupation).toBeLessThan(r.dscrCentral);
  });

  it("amortization sum of principal repaid ≈ initial debt", () => {
    const r = computeHotelDscr({
      ebitdaStabilise: 500000,
      prixAcquisition: 4000000,
      travaux: 0,
      apport: 1500000,
      tauxInteretAnnuel: 0.05,
      dureeAns: 20,
    });
    const totalPrincipal = r.amortissement.reduce((sum, l) => sum + l.capitalRembourse, 0);
    expect(totalPrincipal).toBeCloseTo(r.montantDette, 0);
  });

  it("max empruntable is positive when DSCR target reachable", () => {
    const r = computeHotelDscr({
      ebitdaStabilise: 500000,
      prixAcquisition: 4000000,
      travaux: 0,
      apport: 1500000,
      tauxInteretAnnuel: 0.05,
      dureeAns: 20,
    });
    expect(r.maxEmpruntable).toBeGreaterThan(0);
  });
});

describe("E-2 score", () => {
  it("strong dossier scores high (>=85)", () => {
    const r = computeE2Score({
      capitalInvesti: 800000,
      coutTotalProjet: 1000000,
      fondsEngages: true,
      revenuPrevisionnelAnnuel: 200000,
      minimumVitalAnnuel: 80000,
      emploisCreesOuMaintenus: 8,
      isHotelActif: true,
    });
    expect(r.scoreTotal).toBeGreaterThanOrEqual(85);
    expect(r.diagnostic).toBe("très favorable");
    expect(r.redFlags).toHaveLength(0);
  });

  it("low capital ratio triggers red flag", () => {
    const r = computeE2Score({
      capitalInvesti: 100000,
      coutTotalProjet: 1000000,
      fondsEngages: true,
      revenuPrevisionnelAnnuel: 200000,
      minimumVitalAnnuel: 80000,
      emploisCreesOuMaintenus: 5,
      isHotelActif: true,
    });
    expect(r.scoreSubstantiality).toBeLessThan(20);
    expect(r.redFlags.length).toBeGreaterThan(0);
  });

  it("revenue below minimum vital is fatal for marginality", () => {
    const r = computeE2Score({
      capitalInvesti: 800000,
      coutTotalProjet: 1000000,
      fondsEngages: true,
      revenuPrevisionnelAnnuel: 50000,
      minimumVitalAnnuel: 80000,
      emploisCreesOuMaintenus: 5,
      isHotelActif: true,
    });
    expect(r.scoreMarginality).toBe(0);
    expect(r.redFlags.some((f) => f.includes("Marginality"))).toBe(true);
  });

  it("computes ratios correctly", () => {
    const r = computeE2Score({
      capitalInvesti: 600000,
      coutTotalProjet: 1000000,
      fondsEngages: true,
      revenuPrevisionnelAnnuel: 160000,
      minimumVitalAnnuel: 80000,
      emploisCreesOuMaintenus: 4,
      isHotelActif: true,
    });
    expect(r.ratioCapital).toBeCloseTo(0.6);
    expect(r.ratioRevenu).toBeCloseTo(2.0);
  });
});
