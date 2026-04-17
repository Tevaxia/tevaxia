import { describe, it, expect } from "vitest";
import { encodeStateToHash, decodeStateFromHash } from "../url-state";

describe("encodeStateToHash", () => {
  it("encodes a simple object to non-empty string", () => {
    const h = encodeStateToHash({ a: 1, b: "hello" });
    expect(h.length).toBeGreaterThan(0);
  });

  it("produces URL-safe base64 (no special chars)", () => {
    const h = encodeStateToHash({ foo: "bar", n: 42 });
    // base64 uses A-Z, a-z, 0-9, +, /, = — acceptable in URL hashes
    expect(h).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("handles unicode correctly (é, ç, ñ, €)", () => {
    const original = { city: "Luxembourg", prix: "8 500 €", noteFR: "à rénover" };
    const h = encodeStateToHash(original);
    const decoded = decodeStateFromHash(h);
    expect(decoded).toEqual(original);
  });

  it("returns empty string on circular reference", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const h = encodeStateToHash(obj);
    expect(h).toBe("");
  });
});

describe("decodeStateFromHash", () => {
  it("round-trips encoded state", () => {
    const original = { commune: "Luxembourg", surface: 80, neuf: true };
    const encoded = encodeStateToHash(original);
    const decoded = decodeStateFromHash(encoded);
    expect(decoded).toEqual(original);
  });

  it("handles # prefix", () => {
    const original = { a: 1 };
    const encoded = encodeStateToHash(original);
    const withHash = `#${encoded}`;
    expect(decodeStateFromHash(withHash)).toEqual(original);
  });

  it("returns null for empty hash", () => {
    expect(decodeStateFromHash("")).toBeNull();
    expect(decodeStateFromHash("#")).toBeNull();
  });

  it("returns null for invalid base64", () => {
    expect(decodeStateFromHash("!!!!not-base64!!!!")).toBeNull();
  });

  it("returns null for valid base64 of non-JSON", () => {
    const bogus = btoa("hello world not json");
    expect(decodeStateFromHash(bogus)).toBeNull();
  });

  it("handles large objects correctly", () => {
    const big: Record<string, unknown> = {};
    for (let i = 0; i < 50; i++) big[`k${i}`] = `value-${i}`;
    const encoded = encodeStateToHash(big);
    const decoded = decodeStateFromHash(encoded);
    expect(decoded).toEqual(big);
  });

  it("preserves number precision", () => {
    const original = { pi: 3.14159265, big: 1234567890, neg: -42.5 };
    const decoded = decodeStateFromHash(encodeStateToHash(original));
    expect(decoded).toEqual(original);
  });
});
