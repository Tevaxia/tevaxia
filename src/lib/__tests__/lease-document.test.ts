import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { leaseChecksum, validateLeaseDraft, type LeaseDraftInput } from "../lease-document";

const draft: LeaseDraftInput = {
  landlordName: "Alice Example", landlordAddress: "1 rue A", tenantName: "Bob Example", tenantAddress: "2 rue B",
  propertyAddress: "3 rue C", cadastralReference: "Section A, 123/456", premisesDescription: "Séjour, cuisine, chambre, salle de bains, cave",
  conclusionDate: "2026-10-23", leaseStart: "2026-11-01", leaseEnd: "", duration: "durée indéterminée",
  monthlyRent: 1500, monthlyCharges: 200, deposit: 3000, furnished: false, furnitureSupplement: 0,
};
describe("new residential lease draft", () => {
  it("accepts a complete draft at the two-month deposit boundary", () => expect(validateLeaseDraft(draft)).toEqual([]));
  it.each([3000.01, 4500, -1, NaN, Infinity])("rejects invalid guarantee %s without relying on the HTML max attribute", deposit => {
    expect(validateLeaseDraft({ ...draft, deposit }).some(message => message.includes("garantie"))).toBe(true);
  });
  it("does not silently use the old regime or invalid dates", () => {
    expect(validateLeaseDraft({ ...draft, conclusionDate: "2024-07-31" })).not.toEqual([]);
    expect(validateLeaseDraft({ ...draft, conclusionDate: "2026-02-30" })).not.toEqual([]);
    expect(validateLeaseDraft({ ...draft, leaseEnd: "2026-10-31" })).not.toEqual([]);
  });
  it.each(["landlordName", "landlordAddress", "tenantName", "tenantAddress", "propertyAddress", "cadastralReference", "premisesDescription"])("requires %s instead of inserting an invented party or missing property description", field => {
    expect(validateLeaseDraft({ ...draft, [field]: " " })).not.toEqual([]);
  });
  it("requires valid rent and charges", () => {
    expect(validateLeaseDraft({ ...draft, monthlyRent: 0 })).not.toEqual([]);
    expect(validateLeaseDraft({ ...draft, monthlyCharges: -1 })).not.toEqual([]);
  });
  it("treats the furniture supplement as part of the declared rent", () => {
    expect(validateLeaseDraft({ ...draft, furnished: true, furnitureSupplement: 100 })).toEqual([]);
    expect(validateLeaseDraft({ ...draft, furnished: true, furnitureSupplement: 1501 })).not.toEqual([]);
    expect(validateLeaseDraft({ ...draft, furnitureSupplement: 100 })).not.toEqual([]);
  });
});
describe("external PDF checksum", () => {
  it("matches an independent hash of the exact final bytes, and detects a changed file", async () => {
    const bytes = Buffer.from("%PDF-1.7\nFinal document\n%%EOF\n");
    const line = await leaseChecksum(new Blob([bytes]), "projet-bail.pdf");
    const expected = createHash("sha256").update(bytes).digest("hex");
    expect(line).toBe(`${expected}  projet-bail.pdf\n`);
    const changed = await leaseChecksum(new Blob([bytes, "changed"]), "projet-bail.pdf");
    expect(changed).not.toBe(line);
  });
  it("rejects filenames that could corrupt a checksum manifest", async () => {
    await expect(leaseChecksum(new Blob(), "bail.pdf\ninjected.pdf")).rejects.toThrow();
  });
});
