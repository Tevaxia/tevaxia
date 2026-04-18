import { describe, it, expect } from "vitest";
import { parseInvoiceText } from "../syndic-ocr-parser";

describe("parseInvoiceText — facture LU typique", () => {
  const sample = `
SARL ELECTRICITE MULLER
15 rue des artisans
L-1234 Luxembourg
TVA : LU12345678
IBAN : LU28 0019 4006 4475 0000
BIC : BCEELULL

Facture N° FAC-2026-0234
Date facture : 15/03/2026
Échéance : 15/04/2026

Prestation réparation tableau électrique :
Total HT : 850,00 EUR
TVA 17 % : 144,50 EUR
Total TTC : 994,50 EUR

Référence paiement : FAC-2026-0234
`;

  it("extrait le nom fournisseur", () => {
    const r = parseInvoiceText(sample);
    expect(r.supplier_name).toContain("MULLER");
  });
  it("extrait le numéro TVA LU", () => {
    const r = parseInvoiceText(sample);
    expect(r.supplier_vat).toBe("LU12345678");
  });
  it("extrait l'IBAN", () => {
    const r = parseInvoiceText(sample);
    expect(r.supplier_iban).toBe("LU2800194006447500000".slice(0, 20));
  });
  it("extrait le BIC", () => {
    const r = parseInvoiceText(sample);
    expect(r.supplier_bic).toBe("BCEELULL");
  });
  it("extrait le numéro de facture", () => {
    const r = parseInvoiceText(sample);
    expect(r.invoice_number).toContain("2026-0234");
  });
  it("extrait la date de facture au format ISO", () => {
    const r = parseInvoiceText(sample);
    expect(r.invoice_date).toBe("2026-03-15");
  });
  it("extrait la date d'échéance", () => {
    const r = parseInvoiceText(sample);
    expect(r.due_date).toBe("2026-04-15");
  });
  it("extrait les 3 montants", () => {
    const r = parseInvoiceText(sample);
    expect(r.amount_ht).toBe(850);
    expect(r.amount_tva).toBe(144.5);
    expect(r.amount_ttc).toBe(994.5);
  });
  it("extrait le taux TVA LU 17", () => {
    const r = parseInvoiceText(sample);
    expect(r.tva_rate).toBe(17);
  });
  it("confiance élevée sur cet échantillon propre", () => {
    const r = parseInvoiceText(sample);
    expect(r.confidence).toBeGreaterThanOrEqual(85);
  });
});

describe("parseInvoiceText — formats numériques", () => {
  it("format virgule décimale EU : 1 250,50", () => {
    const r = parseInvoiceText("Total TTC 1 250,50 EUR");
    expect(r.amount_ttc).toBe(1250.5);
  });
  it("format thousand sep point + décimal virgule : 1.250,50", () => {
    const r = parseInvoiceText("Total TTC 1.250,50 EUR");
    expect(r.amount_ttc).toBe(1250.5);
  });
  it("format US point décimal : 1250.50", () => {
    const r = parseInvoiceText("Total TTC 1250.50 EUR");
    expect(r.amount_ttc).toBe(1250.5);
  });
});

describe("parseInvoiceText — TVA numbers internationaux", () => {
  it("FR VAT", () => {
    const r = parseInvoiceText("Société X - TVA : FR12 345678901 - Facture");
    expect(r.supplier_vat).toBe("FR12345678901");
  });
  it("BE VAT", () => {
    const r = parseInvoiceText("Société BE - TVA : BE0123456789 - Facture");
    expect(r.supplier_vat).toBe("BE0123456789");
  });
  it("DE VAT", () => {
    const r = parseInvoiceText("Firma DE - USt-IdNr : DE123456789 - Rechnung");
    expect(r.supplier_vat).toBe("DE123456789");
  });
});

describe("parseInvoiceText — cas sans infos", () => {
  it("texte vide → confidence 0", () => {
    const r = parseInvoiceText("");
    expect(r.confidence).toBe(0);
    expect(r.detected_fields).toHaveLength(0);
  });
  it("texte non structuré → confidence faible", () => {
    const r = parseInvoiceText("lorem ipsum dolor sit amet");
    expect(r.confidence).toBeLessThan(30);
  });
});
