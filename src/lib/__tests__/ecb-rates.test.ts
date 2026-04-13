import { describe, it, expect } from "vitest";

// Test the fallback/default values and types (not the actual API calls)
// API calls are tested via integration tests, not unit tests

describe("ECB rates module", () => {
  it("exports the expected functions", async () => {
    const mod = await import("../ecb-rates");
    expect(typeof mod.getECBRates).toBe("function");
    expect(typeof mod.fetchECBRatesClient).toBe("function");
    expect(typeof mod.fetchEuriborHistory).toBe("function");
  });

  it("fetchECBRatesClient returns valid structure", async () => {
    const { fetchECBRatesClient } = await import("../ecb-rates");
    const rates = await fetchECBRatesClient();
    // Should return fallback when network is unavailable in test env
    expect(rates).toHaveProperty("mainRefi");
    expect(rates).toHaveProperty("depositFacility");
    expect(rates).toHaveProperty("marginalLending");
    expect(rates).toHaveProperty("lastUpdate");
    expect(rates).toHaveProperty("live");
    expect(typeof rates.mainRefi).toBe("number");
    expect(typeof rates.depositFacility).toBe("number");
    expect(rates.mainRefi).toBeGreaterThan(0);
    expect(rates.depositFacility).toBeGreaterThan(0);
  });

  it("deposit facility < main refi rate", async () => {
    const { fetchECBRatesClient } = await import("../ecb-rates");
    const rates = await fetchECBRatesClient();
    expect(rates.depositFacility).toBeLessThanOrEqual(rates.mainRefi);
  });

  it("fetchEuriborHistory returns array", async () => {
    const { fetchEuriborHistory } = await import("../ecb-rates");
    const history = await fetchEuriborHistory(3);
    expect(Array.isArray(history)).toBe(true);
    // In test env without network, returns empty array (graceful fallback)
  });
});
