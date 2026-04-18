import { describe, it, expect } from "vitest";
import {
  generateToken, hashDocument, signingUrl, mailtoLink,
  DEFAULT_CONSENT_TEXT, STATUS_LABELS, STATUS_COLORS, DOCUMENT_TYPE_LABELS,
  type SignatureRequest,
} from "../agency-signatures";

describe("generateToken", () => {
  it("produit un token hex de 64 caractères (32 octets)", () => {
    const t = generateToken();
    expect(t).toHaveLength(64);
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });
  it("produit des tokens uniques", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 50; i++) tokens.add(generateToken());
    expect(tokens.size).toBe(50);
  });
});

describe("hashDocument", () => {
  it("produit un hash SHA-256 déterministe hex 64 caractères", async () => {
    const h1 = await hashDocument("hello world");
    const h2 = await hashDocument("hello world");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
  it("hashes différents pour contenus différents", async () => {
    const h1 = await hashDocument("A");
    const h2 = await hashDocument("B");
    expect(h1).not.toBe(h2);
  });
  it("détecte une modification d'un seul caractère", async () => {
    const h1 = await hashDocument("Prix : 500 000 EUR");
    const h2 = await hashDocument("Prix : 600 000 EUR");
    expect(h1).not.toBe(h2);
  });
});

describe("signingUrl", () => {
  it("construit l'URL /signer/[token]", () => {
    expect(signingUrl("abc123", "https://www.tevaxia.lu")).toBe("https://www.tevaxia.lu/signer/abc123");
  });
  it("fallback origin tevaxia.lu", () => {
    const url = signingUrl("xyz");
    expect(url).toContain("/signer/xyz");
  });
});

function fakeRequest(o: Partial<SignatureRequest> = {}): SignatureRequest {
  return {
    id: "r1", mandate_id: "m1", user_id: "u1", org_id: null,
    document_type: "mandat", document_title: "Test",
    document_body: "Corps", document_hash: "abc",
    document_pdf_path: null,
    signer_name: "Jean Dupont", signer_email: "jean@example.com",
    signer_phone: null, token: "tok",
    status: "sent", sent_at: null, first_viewed_at: null,
    signed_at: null, declined_at: null, declined_reason: null,
    expires_at: "2026-12-31T00:00:00Z",
    signer_ip: null, signer_user_agent: null,
    signer_timezone: null, consent_text: null,
    created_at: "", updated_at: "",
    ...o,
  };
}

describe("mailtoLink", () => {
  it("génère un mailto avec subject + body encodés", () => {
    const link = mailtoLink(fakeRequest(), "https://tevaxia.lu");
    expect(link).toMatch(/^mailto:jean@example\.com/);
    expect(link).toContain("subject=");
    expect(link).toContain("body=");
    expect(decodeURIComponent(link)).toContain("https://tevaxia.lu/signer/tok");
  });
  it("encode les caractères spéciaux (espaces, accents) dans le subject", () => {
    const r = fakeRequest({ document_title: "Mandat séparation & vente" });
    const link = mailtoLink(r);
    expect(link).toContain("%20");  // espaces encodés
    expect(link).toContain("%26");  // & encodé
    expect(link).toContain("%C3%A9");  // é encodé
  });
});

describe("Constants exhaustive", () => {
  const statuses = ["draft", "sent", "viewed", "signed", "declined", "expired", "cancelled"] as const;
  it("chaque status a label + couleur", () => {
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeDefined();
      expect(STATUS_COLORS[s]).toBeDefined();
    }
  });
  it("DEFAULT_CONSENT_TEXT référence eIDAS", () => {
    expect(DEFAULT_CONSENT_TEXT).toContain("eIDAS");
    expect(DEFAULT_CONSENT_TEXT).toContain("910/2014");
  });
  it("DOCUMENT_TYPE_LABELS contient mandat et compromis", () => {
    expect(DOCUMENT_TYPE_LABELS.mandat).toBe("Mandat");
    expect(DOCUMENT_TYPE_LABELS.compromis).toContain("Compromis");
  });
});
