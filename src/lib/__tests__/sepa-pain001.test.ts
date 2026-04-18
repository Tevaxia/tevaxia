import { describe, it, expect } from "vitest";
import {
  buildPain001Xml, validateBatch, validateIban, cleanIban,
  generateMessageId, generateEndToEndId,
  type SepaBatchConfig,
} from "../sepa-pain001";

describe("validateIban", () => {
  it("valide un IBAN LU correct (mod 97)", () => {
    expect(validateIban("LU28 0019 4006 4475 0000")).toBe(true);
  });
  it("valide un IBAN FR correct", () => {
    expect(validateIban("FR1420041010050500013M02606")).toBe(true);
  });
  it("refuse un IBAN corrompu", () => {
    expect(validateIban("LU99 0000 0000 0000 0001")).toBe(false);
  });
  it("refuse format invalide", () => {
    expect(validateIban("NOT_AN_IBAN")).toBe(false);
    expect(validateIban("")).toBe(false);
  });
  it("accepte les espaces (cleanup)", () => {
    expect(validateIban("LU28  0019 4006 4475 0000 ")).toBe(true);
  });
});

describe("cleanIban", () => {
  it("enlève les espaces et uppercase", () => {
    expect(cleanIban("lu28 0019 4006 4475 0000")).toBe("LU2800194006447500000".slice(0, 20));
  });
});

function validConfig(): SepaBatchConfig {
  return {
    message_id: "TEVAXIA-20260418-ABCDEF",
    execution_date: "2026-04-20",
    debtor: {
      name: "Syndicat Résidence Les Jardins",
      iban: "LU28 0019 4006 4475 0000",
      bic: "BCEELULL",
    },
    payments: [
      {
        id: "P001",
        end_to_end_id: "COPRO-PAY-001",
        amount: 1250.50,
        creditor_name: "SARL Plomberie Muller",
        creditor_iban: "LU28 0019 4006 4475 0000", // même IBAN valide pour test
        creditor_bic: "BCEELULL",
        remittance_info: "Facture 2026-0123 réparation conduite eau",
      },
    ],
  };
}

describe("validateBatch", () => {
  it("batch valide → aucune erreur", () => {
    expect(validateBatch(validConfig())).toHaveLength(0);
  });
  it("IBAN donneur invalide", () => {
    const c = validConfig();
    c.debtor.iban = "INVALID";
    const errors = validateBatch(c);
    expect(errors.some((e) => e.field === "debtor.iban")).toBe(true);
  });
  it("montant nul", () => {
    const c = validConfig();
    c.payments[0].amount = 0;
    const errors = validateBatch(c);
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });
  it("pas de paiements", () => {
    const c = validConfig();
    c.payments = [];
    const errors = validateBatch(c);
    expect(errors.some((e) => e.field === "payments")).toBe(true);
  });
});

describe("buildPain001Xml", () => {
  it("produit un XML pain.001.001.09 bien formé", () => {
    const xml = buildPain001Xml(validConfig());
    expect(xml).toMatch(/^<\?xml version="1.0"/);
    expect(xml).toContain("pain.001.001.09");
    expect(xml).toContain("<CstmrCdtTrfInitn>");
    expect(xml).toContain("</CstmrCdtTrfInitn>");
    expect(xml).toContain("<IBAN>LU280019400644750000");
    expect(xml).toContain("<InstdAmt Ccy=\"EUR\">1250.50");
    expect(xml).toContain("<NbOfTxs>1</NbOfTxs>");
    expect(xml).toContain("<CtrlSum>1250.50</CtrlSum>");
  });
  it("somme de contrôle = somme des montants", () => {
    const c = validConfig();
    c.payments.push({ ...c.payments[0], id: "P002", end_to_end_id: "COPRO-PAY-002", amount: 500 });
    const xml = buildPain001Xml(c);
    expect(xml).toContain("<CtrlSum>1750.50</CtrlSum>");
    expect(xml).toContain("<NbOfTxs>2</NbOfTxs>");
  });
  it("échappe les caractères spéciaux XML", () => {
    const c = validConfig();
    c.payments[0].creditor_name = "SARL <Tech & Co>";
    c.payments[0].remittance_info = "Facture A & B";
    const xml = buildPain001Xml(c);
    expect(xml).not.toContain("<Tech & Co>");
    expect(xml).toContain("&lt;Tech &amp; Co&gt;");
    expect(xml).toContain("Facture A &amp; B");
  });
  it("tronque les champs trop longs", () => {
    const c = validConfig();
    c.payments[0].creditor_name = "A".repeat(200);
    const xml = buildPain001Xml(c);
    // Nm limité à 140 chars
    const match = xml.match(/<Nm>(A+)<\/Nm>/);
    expect(match).not.toBeNull();
    expect(match![1].length).toBeLessThanOrEqual(140);
  });
});

describe("generators", () => {
  it("generateMessageId produit un ID < 35 chars", () => {
    const id = generateMessageId();
    expect(id.length).toBeLessThanOrEqual(35);
    expect(id).toMatch(/^TEVAXIA-\d+-/);
  });
  it("generateEndToEndId unique par index", () => {
    const id1 = generateEndToEndId("COPRO", 1);
    const id2 = generateEndToEndId("COPRO", 2);
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeLessThanOrEqual(35);
  });
});
