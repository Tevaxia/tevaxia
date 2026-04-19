import { describe, it, expect } from "vitest";
import {
  buildFacturXCiiXml, computeTotals, validateInvoice,
  formatInvoiceNumber, VAT_RATES_FR, VAT_RATES_LU,
  type FacturXInvoice,
} from "../facturation/factur-x";

function baseInvoice(): FacturXInvoice {
  return {
    profile: "BASIC",
    document_type: "380",
    invoice_number: "F-26-00001",
    issue_date: "2026-03-15",
    due_date: "2026-04-14",
    currency: "EUR",
    seller: {
      name: "SCI Exemple",
      legal_id: "123456789",
      vat_id: "FR12345678901",
      address_line1: "10 rue des Acacias",
      postcode: "75001",
      city: "Paris",
      country_code: "FR",
    },
    buyer: {
      name: "M. Locataire",
      address_line1: "20 avenue du Bel Air",
      postcode: "75012",
      city: "Paris",
      country_code: "FR",
    },
    lines: [
      {
        id: "1",
        name: "Loyer mars 2026",
        quantity: 1,
        unit_code: "MON",
        unit_price_net: 1000,
        vat_category: "E",
        vat_rate_percent: 0,
      },
    ],
    notes: ["Loyer d'habitation — exempt TVA art. 261 D CGI"],
    payment_iban: "FR7630001007941234567890185",
    payment_terms: "Paiement avant le 5 du mois",
  };
}

describe("computeTotals — facture mono-ligne exempt TVA (loyer habitation)", () => {
  const r = computeTotals(baseInvoice());
  it("line total = 1000", () => expect(r.line_total).toBe(1000));
  it("VAT total = 0 (exempt)", () => expect(r.vat_total).toBe(0));
  it("grand total = 1000", () => expect(r.grand_total).toBe(1000));
  it("amount due = grand total", () => expect(r.amount_due).toBe(1000));
  it("1 seul groupe TVA", () => expect(r.vat_breakdown).toHaveLength(1));
  it("breakdown categorie E taux 0", () => {
    expect(r.vat_breakdown[0].category).toBe("E");
    expect(r.vat_breakdown[0].rate_percent).toBe(0);
  });
});

describe("computeTotals — facture multi-taux (hotel FR)", () => {
  const inv = baseInvoice();
  inv.seller.country_code = "FR";
  inv.lines = [
    { id: "1", name: "Chambre", quantity: 2, unit_code: "DAY", unit_price_net: 120, vat_category: "S", vat_rate_percent: 10 },
    { id: "2", name: "Petit-déjeuner", quantity: 2, unit_code: "C62", unit_price_net: 18, vat_category: "S", vat_rate_percent: 10 },
    { id: "3", name: "Minibar", quantity: 1, unit_code: "C62", unit_price_net: 25, vat_category: "S", vat_rate_percent: 20 },
  ];
  const r = computeTotals(inv);
  it("line total = 240 + 36 + 25 = 301", () => expect(r.line_total).toBe(301));
  it("2 groupes TVA (10% et 20%)", () => expect(r.vat_breakdown).toHaveLength(2));
  it("TVA 10% = 27.60", () => {
    const g10 = r.vat_breakdown.find((v) => v.rate_percent === 10);
    expect(g10?.tax_amount).toBeCloseTo(27.6, 2);
  });
  it("TVA 20% = 5.00", () => {
    const g20 = r.vat_breakdown.find((v) => v.rate_percent === 20);
    expect(g20?.tax_amount).toBeCloseTo(5, 2);
  });
  it("grand total = 333.60", () => expect(r.grand_total).toBeCloseTo(333.6, 2));
});

describe("computeTotals — hôtel LU TVA 3% hébergement + 17% autre", () => {
  const inv = baseInvoice();
  inv.seller.country_code = "LU";
  inv.buyer.country_code = "LU";
  inv.lines = [
    { id: "1", name: "Nuitée Kirchberg", quantity: 3, unit_code: "DAY", unit_price_net: 180, vat_category: "S", vat_rate_percent: 3 },
    { id: "2", name: "Taxi aéroport", quantity: 1, unit_code: "C62", unit_price_net: 50, vat_category: "S", vat_rate_percent: 17 },
  ];
  const r = computeTotals(inv);
  it("line total = 540 + 50 = 590", () => expect(r.line_total).toBe(590));
  it("TVA 3% = 16.20", () => {
    const g3 = r.vat_breakdown.find((v) => v.rate_percent === 3);
    expect(g3?.tax_amount).toBeCloseTo(16.2, 2);
  });
  it("TVA 17% = 8.50", () => {
    const g17 = r.vat_breakdown.find((v) => v.rate_percent === 17);
    expect(g17?.tax_amount).toBeCloseTo(8.5, 2);
  });
});

describe("computeTotals — remise ligne %", () => {
  const inv = baseInvoice();
  inv.lines = [
    { id: "1", name: "Prestation", quantity: 10, unit_price_net: 100, discount_percent: 10, vat_category: "S", vat_rate_percent: 20 },
  ];
  const r = computeTotals(inv);
  it("line total = 1000 - 10% = 900", () => expect(r.line_total).toBe(900));
  it("TVA = 180", () => expect(r.vat_total).toBe(180));
  it("grand total = 1080", () => expect(r.grand_total).toBe(1080));
});

describe("buildFacturXCiiXml — structure XML", () => {
  const xml = buildFacturXCiiXml(baseInvoice());

  it("commence par declaration XML", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
  it("contient CrossIndustryInvoice root", () => {
    expect(xml).toContain("<rsm:CrossIndustryInvoice");
  });
  it("contient numero facture", () => {
    expect(xml).toContain("<ram:ID>F-26-00001</ram:ID>");
  });
  it("contient type 380 (commercial invoice)", () => {
    expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
  });
  it("contient date format 102 (YYYYMMDD)", () => {
    expect(xml).toContain("<udt:DateTimeString format=\"102\">20260315</udt:DateTimeString>");
  });
  it("contient vendeur SCI Exemple", () => {
    expect(xml).toContain("<ram:Name>SCI Exemple</ram:Name>");
  });
  it("contient TVA vendeur FR", () => {
    expect(xml).toContain("FR12345678901");
  });
  it("contient IBAN paiement sans espaces", () => {
    expect(xml).toContain("<ram:IBANID>FR7630001007941234567890185</ram:IBANID>");
  });
  it("contient guideline BASIC Factur-X", () => {
    expect(xml).toContain("urn:factur-x.eu:1p0:basic");
  });
  it("contient total grand amount 1000.00", () => {
    expect(xml).toContain("<ram:GrandTotalAmount>1000.00</ram:GrandTotalAmount>");
  });
});

describe("buildFacturXCiiXml — échappement XML", () => {
  const inv = baseInvoice();
  inv.seller.name = "A&B <SCI> \"Les Tilleuls\"";
  const xml = buildFacturXCiiXml(inv);
  it("échappe & < > \" en entités", () => {
    expect(xml).toContain("A&amp;B &lt;SCI&gt; &quot;Les Tilleuls&quot;");
  });
});

describe("validateInvoice — EN 16931 business rules", () => {
  it("facture valide : 0 erreurs", () => {
    expect(validateInvoice(baseInvoice())).toHaveLength(0);
  });
  it("BR-02 : numéro manquant", () => {
    const inv = baseInvoice();
    inv.invoice_number = "";
    const errs = validateInvoice(inv);
    expect(errs.find((e) => e.rule === "BR-02")).toBeDefined();
  });
  it("BR-03 : date mal formée", () => {
    const inv = baseInvoice();
    inv.issue_date = "15/03/2026";
    const errs = validateInvoice(inv);
    expect(errs.find((e) => e.rule === "BR-03")).toBeDefined();
  });
  it("BR-05 : devise invalide", () => {
    const inv = baseInvoice();
    inv.currency = "eu";
    const errs = validateInvoice(inv);
    expect(errs.find((e) => e.rule === "BR-05")).toBeDefined();
  });
  it("BR-06 : vendeur sans nom", () => {
    const inv = baseInvoice();
    inv.seller.name = "";
    const errs = validateInvoice(inv);
    expect(errs.find((e) => e.rule === "BR-06")).toBeDefined();
  });
  it("BR-16 : aucune ligne", () => {
    const inv = baseInvoice();
    inv.lines = [];
    const errs = validateInvoice(inv);
    expect(errs.find((e) => e.rule === "BR-16")).toBeDefined();
  });
  it("BR-22 : quantité nulle", () => {
    const inv = baseInvoice();
    inv.lines[0].quantity = 0;
    const errs = validateInvoice(inv);
    expect(errs.find((e) => e.rule === "BR-22")).toBeDefined();
  });
});

describe("formatInvoiceNumber — Art. 242 nonies A annexe II CGI", () => {
  it("F-26-00001", () => {
    expect(formatInvoiceNumber("F", 2026, 1)).toBe("F-26-00001");
  });
  it("FAC-26-12345", () => {
    expect(formatInvoiceNumber("FAC", 2026, 12345)).toBe("FAC-26-12345");
  });
  it("séquence >= 5 chiffres", () => {
    expect(formatInvoiceNumber("F", 2026, 1).split("-")[2]).toHaveLength(5);
  });
});

describe("Tables TVA", () => {
  it("FR standard 20%", () => expect(VAT_RATES_FR.standard).toBe(20));
  it("FR intermédiaire 10%", () => expect(VAT_RATES_FR.intermediate).toBe(10));
  it("LU standard 17%", () => expect(VAT_RATES_LU.standard).toBe(17));
  it("LU super-réduit 3% (hébergement)", () => expect(VAT_RATES_LU.super_reduced).toBe(3));
});
