import { describe, it, expect } from "vitest";
import { computeUsali } from "@/lib/hotellerie/usali";
import { computeRenovationHotel } from "@/lib/hotellerie/renovation";
import { computeRevparCompset } from "@/lib/hotellerie/revpar-comparison";

describe("USALI exploitation", () => {
  it("produces N years of P&L when horizon=N", () => {
    const r = computeUsali({
      nbChambres: 50,
      adrYear1: 120,
      occupancyYear1: 0.65,
      adrGrowth: 0.02,
      occupancyGrowthPts: 1,
      category: "midscale",
      hasFB: true,
      hasMICE: false,
      staffCostPerFTE: 45000,
      fteCount: 18,
      fixedCharges: 80000,
      horizonYears: 5,
    });
    expect(r.years).toHaveLength(5);
  });

  it("ADR and occupancy grow over time", () => {
    const r = computeUsali({
      nbChambres: 50,
      adrYear1: 100,
      occupancyYear1: 0.60,
      adrGrowth: 0.03,
      occupancyGrowthPts: 2,
      category: "midscale",
      hasFB: true,
      hasMICE: false,
      staffCostPerFTE: 40000,
      fteCount: 15,
      fixedCharges: 50000,
      horizonYears: 3,
    });
    expect(r.years[2].adr).toBeGreaterThan(r.years[0].adr);
    expect(r.years[2].occupancy).toBeGreaterThan(r.years[0].occupancy);
  });

  it("GOPPAR equals GOP / (rooms × 365)", () => {
    const r = computeUsali({
      nbChambres: 100,
      adrYear1: 150,
      occupancyYear1: 0.70,
      adrGrowth: 0,
      occupancyGrowthPts: 0,
      category: "upscale",
      hasFB: true,
      hasMICE: true,
      staffCostPerFTE: 50000,
      fteCount: 35,
      fixedCharges: 200000,
      horizonYears: 1,
    });
    const expected = r.years[0].gop / (100 * 365);
    expect(r.years[0].goppar).toBeCloseTo(expected, 2);
  });

  it("flags sous-performance when GOP margin too low", () => {
    const r = computeUsali({
      nbChambres: 50,
      adrYear1: 80,
      occupancyYear1: 0.50,
      adrGrowth: 0,
      occupancyGrowthPts: 0,
      category: "upscale",
      hasFB: true,
      hasMICE: true,
      staffCostPerFTE: 60000,
      fteCount: 30,
      fixedCharges: 300000,
      horizonYears: 3,
    });
    expect(r.benchmark.diagnostic).toBe("sous-performance");
  });

  it("rejects bad inputs", () => {
    expect(() =>
      computeUsali({
        nbChambres: 0,
        adrYear1: 100,
        occupancyYear1: 0.6,
        adrGrowth: 0,
        occupancyGrowthPts: 0,
        category: "midscale",
        hasFB: true,
        hasMICE: false,
        staffCostPerFTE: 40000,
        fteCount: 10,
        fixedCharges: 50000,
        horizonYears: 1,
      }),
    ).toThrow();
  });
});

describe("Renovation hotel", () => {
  it("returns zero work when nothing checked", () => {
    const r = computeRenovationHotel({
      surfaceChauffeeM2: 2500,
      nbChambres: 40,
      consoActuelleKwhM2: 250,
      consoCibleKwhM2: 0,
      prixKwhMoyen: 0.18,
      travauxIsolation: false,
      travauxCVC: false,
      travauxECS: false,
      travauxLED: false,
      travauxFenetres: false,
      adr: 100,
      occupancy: 0.65,
      gainRevparPctViaLabel: 0,
    });
    expect(r.coutBrutTotal).toBe(0);
    expect(r.coutNetTotal).toBe(0);
    expect(r.economiesAnnuelles).toBe(0);
  });

  it("Klimabonus discount reduces total cost", () => {
    const r = computeRenovationHotel({
      surfaceChauffeeM2: 2500,
      nbChambres: 40,
      consoActuelleKwhM2: 250,
      consoCibleKwhM2: 0,
      prixKwhMoyen: 0.18,
      travauxIsolation: true,
      travauxCVC: true,
      travauxECS: false,
      travauxLED: false,
      travauxFenetres: false,
      adr: 100,
      occupancy: 0.65,
      gainRevparPctViaLabel: 0,
    });
    expect(r.aideKlimabonusTotal).toBeGreaterThan(0);
    expect(r.coutNetTotal).toBeLessThan(r.coutBrutTotal);
  });

  it("payback is shorter when label gain is added", () => {
    const inputs = {
      surfaceChauffeeM2: 2500,
      nbChambres: 40,
      consoActuelleKwhM2: 250,
      consoCibleKwhM2: 0,
      prixKwhMoyen: 0.18,
      travauxIsolation: true,
      travauxCVC: true,
      travauxECS: true,
      travauxLED: true,
      travauxFenetres: false,
      adr: 100,
      occupancy: 0.65,
    };
    const without = computeRenovationHotel({ ...inputs, gainRevparPctViaLabel: 0 });
    const withLabel = computeRenovationHotel({ ...inputs, gainRevparPctViaLabel: 3 });
    expect(withLabel.paybackAvecLabel).toBeLessThan(without.paybackSansLabel);
  });

  it("VAN is more positive with label gain", () => {
    const inputs = {
      surfaceChauffeeM2: 2500,
      nbChambres: 40,
      consoActuelleKwhM2: 250,
      consoCibleKwhM2: 0,
      prixKwhMoyen: 0.20,
      travauxIsolation: true,
      travauxCVC: true,
      travauxECS: false,
      travauxLED: true,
      travauxFenetres: false,
      adr: 130,
      occupancy: 0.70,
    };
    const without = computeRenovationHotel({ ...inputs, gainRevparPctViaLabel: 0 });
    const withLabel = computeRenovationHotel({ ...inputs, gainRevparPctViaLabel: 3 });
    expect(withLabel.vanDixAns).toBeGreaterThan(without.vanDixAns);
  });
});

describe("RevPAR compset comparison", () => {
  it("sain when MPI ARI RGI all near 100", () => {
    const r = computeRevparCompset({
      hotelOccupancy: 0.70,
      hotelADR: 120,
      compsetOccupancy: 0.71,
      compsetADR: 121,
      nbChambres: 50,
    });
    expect(r.mpi).toBeCloseTo(70 / 71 * 100, 1);
    expect(r.diagnostic).toBe("sain");
  });

  it("flags problème prix when ARI > 100 but MPI < 95", () => {
    const r = computeRevparCompset({
      hotelOccupancy: 0.55,
      hotelADR: 140,
      compsetOccupancy: 0.70,
      compsetADR: 120,
      nbChambres: 50,
    });
    expect(r.ari).toBeGreaterThan(100);
    expect(r.mpi).toBeLessThan(95);
    expect(r.diagnostic).toBe("problème prix");
  });

  it("flags problème commercial when ARI < 95 and MPI >= 100", () => {
    const r = computeRevparCompset({
      hotelOccupancy: 0.78,
      hotelADR: 100,
      compsetOccupancy: 0.70,
      compsetADR: 120,
      nbChambres: 50,
    });
    expect(r.ari).toBeLessThan(95);
    expect(r.mpi).toBeGreaterThanOrEqual(100);
    expect(r.diagnostic).toBe("problème commercial");
  });

  it("manque à gagner is positive when below fair share", () => {
    const r = computeRevparCompset({
      hotelOccupancy: 0.55,
      hotelADR: 100,
      compsetOccupancy: 0.70,
      compsetADR: 120,
      nbChambres: 50,
    });
    expect(r.manqueAGagnerAnnuel).toBeGreaterThan(0);
  });

  it("manque à gagner is zero when at or above fair share", () => {
    const r = computeRevparCompset({
      hotelOccupancy: 0.80,
      hotelADR: 130,
      compsetOccupancy: 0.70,
      compsetADR: 120,
      nbChambres: 50,
    });
    expect(r.manqueAGagnerAnnuel).toBe(0);
  });

  it("rejects bad inputs", () => {
    expect(() =>
      computeRevparCompset({
        hotelOccupancy: 0,
        hotelADR: 100,
        compsetOccupancy: 0.7,
        compsetADR: 120,
        nbChambres: 50,
      }),
    ).toThrow();
  });
});
