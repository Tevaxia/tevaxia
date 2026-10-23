import { describe, expect, it } from "vitest";
import { parseLocalizedNumber, validateLocalizedNumber } from "../localized-number";

describe("parseLocalizedNumber", () => {
  it.each([
    ["en", "5,000", 5000], ["en", "12,345.67", 12345.67],
    ["fr", "5 000,50", 5000.5], ["fr", "5\u00a0000,50", 5000.5], ["fr", "5\u202f000,50", 5000.5],
    ["de", "5.000,50", 5000.5], ["lb", "5.000,50", 5000.5],
    ["pt", "5.000,50", 5000.5], ["en", " -123.5 ", -123.5], ["fr", "+123,5", 123.5],
    ["en", "0", 0], ["fr", "5000", 5000],
  ])("accepts %s syntax %s", (locale, input, value) => {
    expect(parseLocalizedNumber(input, locale)).toBe(value);
  });

  it.each([
    ["en", "5,00"], ["en", "5.000,50"], ["en", "1,2345"],
    ["fr", "5,000.50"], ["fr", "5.000"], ["de", "5,000.50"],
    ["fr", "5 00"], ["en", "5000 euros"], ["en", "1e3"], ["en", "Infinity"],
    ["en", ""], ["en", " "], ["en", "--5"], ["en", "1.2.3"], ["en", "1,"],
  ])("rejects malformed or foreign syntax %s %s", (locale, input) => {
    expect(parseLocalizedNumber(input, locale)).toBeNull();
  });
});

describe("validateLocalizedNumber", () => {
  it("preserves the English 5,000 input instead of clamping it to 4,000", () => {
    expect(validateLocalizedNumber("5,000", "en", 4000, 15000, 100)).toEqual({ value: 5000 });
  });
  it("rejects out of range values instead of silently clamping", () => {
    expect(validateLocalizedNumber("3,000", "en", 4000, 15000, 100)).toEqual({ error: "range" });
    expect(validateLocalizedNumber("16,000", "en", 4000, 15000, 100)).toEqual({ error: "range" });
  });
  it("rejects off-step values instead of rounding the user's amount", () => {
    expect(validateLocalizedNumber("5,050", "en", 4000, 15000, 100)).toEqual({ error: "step" });
    expect(validateLocalizedNumber("0.3", "en", 0.1, 1, 0.1)).toEqual({ value: 0.3 });
    expect(validateLocalizedNumber("3", "en", 1, 9, 2)).toEqual({ value: 3 });
  });
});
