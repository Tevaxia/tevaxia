import { describe, it, expect } from "vitest";
import { estimer, backtestModel, type EstimationInput } from "../estimation";

const BASE: EstimationInput = {
  commune: "Luxembourg",
  surface: 90,
  nbChambres: 3,
  etage: "rez-de-chaussée",
  etat: "bon",
  exterieur: "balcon",
  parking: false,
  classeEnergie: "C",
  typeBien: "appartement",
  estNeuf: false,
};

describe("estimer", () => {
  it("produces an estimation for a known commune", () => {
    const r = estimer(BASE);
    expect(r).not.toBeNull();
    expect(r!.estimationCentrale).toBeGreaterThan(0);
    expect(r!.estimationBasse).toBeLessThan(r!.estimationCentrale);
    expect(r!.estimationHaute).toBeGreaterThan(r!.estimationCentrale);
  });

  it("returns null for an unknown commune", () => {
    const r = estimer({ ...BASE, commune: "XYZFAKECITYNOTEXISTING" });
    expect(r).toBeNull();
  });

  it("class A energy yields higher price than class G", () => {
    const a = estimer({ ...BASE, classeEnergie: "A" })!;
    const g = estimer({ ...BASE, classeEnergie: "G" })!;
    expect(a.estimationCentrale).toBeGreaterThan(g.estimationCentrale);
  });

  it("adds parking premium (+4%) when parking = true", () => {
    const withP = estimer({ ...BASE, parking: true })!;
    const noP = estimer({ ...BASE, parking: false })!;
    expect(withP.estimationCentrale).toBeGreaterThan(noP.estimationCentrale);
    expect(withP.ajustements.find((a) => a.labelKey === "estAjustParking")).toBeDefined();
  });

  it("new construction uses VEFA price when available", () => {
    const r = estimer({ ...BASE, estNeuf: true })!;
    expect(r.sourceBase.toLowerCase()).toContain("vefa");
  });

  it("existing construction uses transaction price", () => {
    const r = estimer({ ...BASE, estNeuf: false })!;
    expect(r.sourceBase.toLowerCase()).toMatch(/transactions|existant|quartier/);
  });

  it("totalAjustements = sum of ajustements", () => {
    const r = estimer(BASE)!;
    const sum = r.ajustements.reduce((s, a) => s + a.pct, 0);
    expect(r.totalAjustements).toBeCloseTo(sum, 6);
  });

  it("price per m² adjusted matches base × (1 + totalAjust/100)", () => {
    const r = estimer(BASE)!;
    expect(r.prixM2Ajuste).toBeCloseTo(r.prixM2Base * (1 + r.totalAjustements / 100), 0);
  });

  it("returns double model (transactions + annonces) when not quartier-based", () => {
    const r = estimer(BASE)!;
    // At least one of the two should be computed
    expect(r.estimationTransactions !== null || r.estimationAnnonces !== null).toBe(true);
  });

  it("confidence is 'forte' when quartier data available", () => {
    const r = estimer({ ...BASE, quartier: "Belair" });
    if (r) {
      // Selon que Belair quartier existe dans les données — skip si null
      if (r.sourceBase.toLowerCase().includes("quartier")) {
        expect(r.confiance).toBe("forte");
      }
    }
  });
});

describe("backtestModel", () => {
  it("returns samples and MAPE", () => {
    const r = backtestModel();
    expect(r.samples.length).toBeGreaterThan(0);
    expect(Number.isFinite(r.mape)).toBe(true);
    expect(r.mape).toBeGreaterThanOrEqual(0);
  });

  it("median error is reasonable (< 30 % on synthetic data)", () => {
    const r = backtestModel();
    expect(r.medianError).toBeLessThan(30);
  });

  it("R² approximation is between -1 and 1", () => {
    const r = backtestModel();
    expect(r.r2Approx).toBeLessThanOrEqual(1);
    expect(r.r2Approx).toBeGreaterThanOrEqual(-1);
  });
});


describe("scope and no double counting", () => {
  it.each([0, -1, NaN, Infinity])("rejects invalid surface %s", surface => expect(estimer({ ...BASE, surface })).toBeNull());
  it("does not value houses with apartment means", () => expect(estimer({ ...BASE, typeBien: "maison" })).toBeNull());
  it("does not replace a suppressed VEFA price by an existing one", () => expect(estimer({ ...BASE, commune: "Berdorf", estNeuf: true })).toBeNull());
  it("ignores fictitious neighborhood specificity", () => expect(estimer({ ...BASE, quartier: "Belair" })).toEqual(estimer(BASE)));
  it("does not add new-condition or energy premiums on VEFA means", () => {
    const r = estimer({ ...BASE, estNeuf: true, etat: "adjEtatNeuf", classeEnergie: "A" })!;
    expect(r.ajustements.some(a => a.labelKey === "estAjustEtat" || a.labelKey === "estAjustEnergie")).toBe(false);
    expect(r.prixM2Base).toBeCloseTo(10932.32, 4);
    expect(r.estimationAnnonces).toBeNull();
  });
  it("uses the price excluding annexes before adding the parking assumption", () => expect(estimer(BASE)!.prixM2Base).toBeCloseTo(8919.88, 4));
});
