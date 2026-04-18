import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "node:crypto";

describe("enable-banking", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.ENABLE_BANKING_APP_ID;
    delete process.env.ENABLE_BANKING_PRIVATE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isConfigured", () => {
    it("returns false when env vars absent", { timeout: 15000 }, async () => {
      // Cold-import peut dépasser 5 s en CI quand tous les test files
      // sont chargés en série avant ce test. 15 s laissent une marge sûre.
      const { isConfigured } = await import("../enable-banking");
      expect(isConfigured()).toBe(false);
    });

    it("returns false when only APP_ID set", async () => {
      process.env.ENABLE_BANKING_APP_ID = "abc";
      const { isConfigured } = await import("../enable-banking");
      expect(isConfigured()).toBe(false);
    });

    it("returns false when only PRIVATE_KEY set", async () => {
      process.env.ENABLE_BANKING_PRIVATE_KEY = "key";
      const { isConfigured } = await import("../enable-banking");
      expect(isConfigured()).toBe(false);
    });

    it("returns true when both env vars set", async () => {
      process.env.ENABLE_BANKING_APP_ID = "abc";
      process.env.ENABLE_BANKING_PRIVATE_KEY = "key";
      const { isConfigured } = await import("../enable-banking");
      expect(isConfigured()).toBe(true);
    });
  });

  describe("buildJwt", () => {
    let validKey: string;

    beforeEach(() => {
      // Générer une paire RSA valide pour tests
      const { privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      validKey = privateKey;
    });

    it("throws when not configured", async () => {
      const { buildJwt } = await import("../enable-banking");
      expect(() => buildJwt()).toThrow(/not configured/);
    });

    it("produces a valid 3-part JWT", async () => {
      process.env.ENABLE_BANKING_APP_ID = "test-app-123";
      process.env.ENABLE_BANKING_PRIVATE_KEY = validKey;
      const { buildJwt } = await import("../enable-banking");
      const jwt = buildJwt();
      expect(jwt.split(".")).toHaveLength(3);
    });

    it("header has alg RS256, typ JWT, correct kid", async () => {
      process.env.ENABLE_BANKING_APP_ID = "kid-xyz";
      process.env.ENABLE_BANKING_PRIVATE_KEY = validKey;
      const { buildJwt } = await import("../enable-banking");
      const [headerB64] = buildJwt().split(".");
      const header = JSON.parse(Buffer.from(headerB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
      expect(header.alg).toBe("RS256");
      expect(header.typ).toBe("JWT");
      expect(header.kid).toBe("kid-xyz");
    });

    it("payload has correct iss/aud and valid iat/exp", async () => {
      process.env.ENABLE_BANKING_APP_ID = "app";
      process.env.ENABLE_BANKING_PRIVATE_KEY = validKey;
      const { buildJwt } = await import("../enable-banking");
      const [, payloadB64] = buildJwt().split(".");
      const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
      expect(payload.iss).toBe("enablebanking.com");
      expect(payload.aud).toBe("api.enablebanking.com");
      expect(typeof payload.iat).toBe("number");
      expect(typeof payload.exp).toBe("number");
      expect(payload.exp).toBeGreaterThan(payload.iat);
      // TTL ≤ 24 h selon doc Enable Banking
      expect(payload.exp - payload.iat).toBeLessThanOrEqual(86400);
    });

    it("signature verifies with the matching public key", async () => {
      process.env.ENABLE_BANKING_APP_ID = "app";
      process.env.ENABLE_BANKING_PRIVATE_KEY = validKey;
      const { buildJwt } = await import("../enable-banking");
      const jwt = buildJwt();
      const [h, p, s] = jwt.split(".");

      const publicKey = crypto.createPublicKey(validKey);
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(`${h}.${p}`);
      verifier.end();

      const sig = Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
      expect(verifier.verify(publicKey, sig)).toBe(true);
    });

    it("handles \\n literal in env var (Vercel-style storage)", async () => {
      process.env.ENABLE_BANKING_APP_ID = "app";
      process.env.ENABLE_BANKING_PRIVATE_KEY = validKey.replace(/\n/g, "\\n");
      const { buildJwt } = await import("../enable-banking");
      expect(() => buildJwt()).not.toThrow();
      const jwt = buildJwt();
      expect(jwt.split(".")).toHaveLength(3);
    });

    it("caches token within its validity window", async () => {
      process.env.ENABLE_BANKING_APP_ID = "app";
      process.env.ENABLE_BANKING_PRIVATE_KEY = validKey;
      const { buildJwt } = await import("../enable-banking");
      const t1 = buildJwt();
      const t2 = buildJwt();
      expect(t1).toBe(t2);
    });
  });
});
