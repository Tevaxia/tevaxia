import { describe, expect, it } from "vitest";
import { calculerAchatLocation, plafondInteretsHabitation, type AchatLocationInput } from "../achat-location";

const scenario: AchatLocationInput = {
  prixBien: 750000, apport: 150000, tauxCredit: 3.5, dureeCredit: 25, fraisAcquisitionPct: 7,
  chargesCoproMensuel: 250, taxeFonciereAn: 200, entretienAnPct: 1, appreciationAn: 2,
  tauxAssuranceSRD: .3, loyerMensuel: 2000, indexationLoyer: 2, rendementPlacement: 4,
  horizon: 30, anneeSimulation: 2026, anneeDisponibilite: 2026, deductionEligible: false,
  nbPersonnes: 2, tauxMarginalIR: 39, subventionInteretsAn: 0,
};
describe("buy versus rent: independent cash-flow regressions", () => {
  it("repays 600000 over 300 months and stops payments/insurance at maturity", () => {
    const result = calculerAchatLocation(scenario);
    expect(result.mensualiteCredit).toBeCloseTo(3003.74142156, 6);
    expect(result.annees[0].interetsAnnuels).toBeCloseTo(20756.29, 2);
    expect(result.annees[24].capitalRestant).toBe(0);
    expect(result.annees[25].serviceDetteAnnuel).toBe(0);
    expect(result.annees[25].assuranceSRDAnnuel).toBe(0);
    expect(result.annees[25].coutAchatAnnuel).toBe(10700);
    expect(result.annees.reduce((sum, a) => sum + a.capitalRembourse - (a.annee === 1 ? 0 : result.annees[a.annee - 2].capitalRembourse), 0)).toBeCloseTo(600000);
  });
  it("invests equal-budget savings for the buyer too", () => {
    const r = calculerAchatLocation({ ...scenario, prixBien: 120000, apport: 120000,
      fraisAcquisitionPct: 0, chargesCoproMensuel: 0, taxeFonciereAn: 0, entretienAnPct: 0,
      appreciationAn: 0, loyerMensuel: 1000, indexationLoyer: 0, rendementPlacement: 0, horizon: 2 });
    expect(r.derniere.placementAchat).toBe(24000);
    expect(r.derniere.patrimoineNetAchat).toBe(144000);
    expect(r.derniere.patrimoineNetLocation).toBe(120000);
  });
  it("does not infer fiscal eligibility and deducts subsidies before the cap", () => {
    expect(calculerAchatLocation(scenario).annees[0].deductionInterets).toBe(0);
    const r = calculerAchatLocation({ ...scenario, deductionEligible: true, subventionInteretsAn: 1000 });
    expect(r.annees[0].deductionInterets).toBeCloseTo(r.annees[0].interetsAnnuels - 1000);
    expect(r.annees[2].deductionInterets).toBe(8000);
  });
  it("handles zero interest and a loan ending partway through a year", () => {
    const r = calculerAchatLocation({ ...scenario, prixBien: 18000, apport: 0, tauxCredit: 0, dureeCredit: 1.5 });
    expect(r.mensualiteCredit).toBe(1000);
    expect(r.annees[1].serviceDetteAnnuel).toBe(6000);
    expect(r.annees[1].assuranceSRDAnnuel).toBe(27);
    expect(r.annees[1].capitalRestant).toBe(0);
  });
  it.each([{ apport: 800000 }, { dureeCredit: 0 }, { tauxCredit: NaN }, { horizon: 0 }, { nbPersonnes: 1.5 }, { anneeDisponibilite: 2027 }])("rejects invalid inputs %o", change => {
    expect(() => calculerAchatLocation({ ...scenario, ...change })).toThrow(RangeError);
  });
});
describe("ACD deduction rules since 2024", () => {
  it.each([[2026, Infinity], [2027, Infinity], [2028, 8000], [2031, 8000], [2032, 6000], [2036, 6000], [2037, 4000]])("applies year %i", (year, cap) => {
    expect(plafondInteretsHabitation(year, 2026, 2)).toBe(cap);
  });
  it("includes eligible children and rejects unsupported old tax years", () => {
    expect(plafondInteretsHabitation(2026, 2020, 4)).toBe(12000);
    expect(() => plafondInteretsHabitation(2023, 2020, 2)).toThrow();
  });
});
