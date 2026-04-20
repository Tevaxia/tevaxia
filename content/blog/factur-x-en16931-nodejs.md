---
title: "Factur-X EN 16931 from scratch: PDF/A-3 + CII XML in Node.js / TypeScript"
published: false
description: "A working, dependency-light implementation of the Factur-X hybrid e-invoice format (EN 16931 CII XML embedded in PDF/A-3), with real business rules, pdf-lib only, and the gotchas I hit building it for Luxembourg real estate SaaS."
tags: einvoicing, typescript, pdf, compliance
canonical_url: https://tevaxia.lu/facturation
cover_image:
series:
---

France's e-invoicing reform kicks in **September 1st 2026**. Germany's has been live since 2025. By 2027, every B2B invoice in the EU will be structured. Yet the amount of bad documentation around [Factur-X](https://fnfe-mpe.org/factur-x/factur-x-en/) — the hybrid PDF+XML format mandated in France and widely used in DACH — is impressive.

Most "tutorials" either point you at a €5k commercial SDK or wave hands at 200 pages of XML schema. This post is the opposite: a working implementation, under 500 lines of TypeScript, zero paid dependencies, that actually gets accepted by downstream platforms (Pennylane, Sellsy, Chorus Pro, the Peppol network).

I built this for [tevaxia.lu](https://tevaxia.lu) — a real estate platform where we need to generate invoices for syndic fund calls and hotel PMS folios. The code below is a faithful excerpt from what's in production.

## What Factur-X actually is

A Factur-X document is **a PDF/A-3 file with a CII XML attachment**. That's it. Two rules:

1. **The PDF is the legal document** — humans read it, it must render correctly everywhere.
2. **The XML is the machine-readable twin** — accounting software parses it, auditors trust it.

The XML follows the European standard **EN 16931**, specifically the **UN/CEFACT Cross Industry Invoice (CII) D22B** syntax. There's a sibling syntax called UBL 2.1 which is used by some Peppol flows, but Factur-X is CII-only.

Factur-X has five nested **profiles**, from minimal to extended:

| Profile | ~Fields | When to use |
|---------|---------|-------------|
| MINIMUM | 8 | Metadata only, no line detail |
| BASIC WL | ~30 | Without lines (summary invoice) |
| **BASIC** | ~80 | Detailed lines, covers 95% of B2B |
| EN 16931 | ~120 | Recommended for SaaS |
| EXTENDED | ~150 | Custom fields beyond EN 16931 |

BASIC is the sweet spot: enough to pass every validation I've run into, simple enough to code in a few hundred lines.

## The data model

Before we write XML, let's model the invoice. EN 16931 has a terrible habit of using internal identifiers like `BT-106` and `BR-CO-17`, which makes docs unreadable. We'll keep human names:

```ts
export interface FacturXInvoice {
  profile: "MINIMUM" | "BASIC_WL" | "BASIC" | "EN_16931" | "EXTENDED";
  document_type: "380" | "381" | "384" | "386"; // UNTDID 1001
  invoice_number: string;
  issue_date: string;   // YYYY-MM-DD
  due_date?: string;
  currency: string;     // ISO 4217
  seller: FacturXParty;
  buyer: FacturXParty;
  lines: FacturXLine[];
  notes?: string[];
  buyer_reference?: string;
  contract_reference?: string;
  payment_iban?: string;
  payment_bic?: string;
  payment_reference?: string;
  payment_terms?: string;
}

export interface FacturXLine {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_code?: string;          // UN/ECE Rec 20
  unit_price_net: number;
  discount_percent?: number;
  vat_category: "S" | "Z" | "E" | "AE" | "K" | "G" | "O";
  vat_rate_percent: number;
}

export interface FacturXParty {
  name: string;
  legal_id?: string;    // SIREN, RCS, etc.
  vat_id?: string;      // Intracom VAT: "FR12345678901"
  address_line1?: string;
  postcode?: string;
  city?: string;
  country_code: string; // ISO 3166-1 alpha-2
}
```

Two non-obvious things:

- **`vat_category`**: these are single-letter codes from EN 16931. `S` = standard rate, `E` = exempt, `AE` = reverse charge, `Z` = zero-rated. Get these wrong and the XML is technically valid but semantically broken — auditors *will* spot it.
- **`unit_code`**: UN/ECE Rec 20 codes. `C62` = piece, `HUR` = hour, `MON` = month, `MTK` = m². You can't just write "pcs". If you skip this, tooling falls back to `C62`.

## Computing totals (BR-CO-17)

Every EN 16931 line has a unit price, quantity, discount %, and VAT rate. The header has totals *calculated from the lines*. Mismatch any and validation fails.

```ts
export interface FacturXTotals {
  line_total: number;      // BT-106 Sum of net line amounts
  tax_basis: number;       // BT-109 Taxable amount
  vat_total: number;       // BT-110 Total VAT
  grand_total: number;     // BT-112 Total with VAT
  amount_due: number;      // BT-115 Amount due
  vat_breakdown: Array<{
    category: string;
    rate_percent: number;
    taxable_amount: number;
    tax_amount: number;
  }>;
}

export function computeTotals(inv: FacturXInvoice): FacturXTotals {
  const lineTotals = inv.lines.map((l) => {
    const gross = l.quantity * l.unit_price_net;
    const discount = l.discount_percent ? gross * (l.discount_percent / 100) : 0;
    return Math.round((gross - discount) * 100) / 100;
  });
  const line_total = lineTotals.reduce((s, v) => s + v, 0);

  // Group by (category, rate) — rule BR-CO-17
  const groups = new Map<string, { cat: string; rate: number; base: number }>();
  inv.lines.forEach((l, i) => {
    const key = `${l.vat_category}|${l.vat_rate_percent}`;
    const g = groups.get(key) ?? { cat: l.vat_category, rate: l.vat_rate_percent, base: 0 };
    g.base += lineTotals[i];
    groups.set(key, g);
  });

  const vat_breakdown = Array.from(groups.values()).map((g) => ({
    category: g.cat,
    rate_percent: g.rate,
    taxable_amount: Math.round(g.base * 100) / 100,
    tax_amount: Math.round(g.base * (g.rate / 100) * 100) / 100,
  }));

  const vat_total = vat_breakdown.reduce((s, v) => s + v.tax_amount, 0);
  const grand_total = Math.round((line_total + vat_total) * 100) / 100;

  return {
    line_total,
    tax_basis: line_total,
    vat_total: Math.round(vat_total * 100) / 100,
    grand_total,
    amount_due: grand_total,
    vat_breakdown,
  };
}
```

**The critical bit** is the rounding. Round *each line* before summing, not the sum. And compute per-rate totals from line totals, not from the gross. Get this wrong and the validator tells you `BR-CO-17: Sum of allowances does not match`. I've been there.

## Building the CII XML

CII D22B is heavy on namespaces and verbose element names. Instead of pulling in an XML builder library, we use string templates — the schema is fixed, so no dynamic structure is needed.

```ts
function renderLine(line: FacturXLine, idx: number): string {
  const gross = line.quantity * line.unit_price_net;
  const discount = line.discount_percent ? gross * (line.discount_percent / 100) : 0;
  const net = Math.round((gross - discount) * 100) / 100;

  return `<ram:IncludedSupplyChainTradeLineItem>
    <ram:AssociatedDocumentLineDocument>
      <ram:LineID>${line.id || String(idx + 1)}</ram:LineID>
    </ram:AssociatedDocumentLineDocument>
    <ram:SpecifiedTradeProduct>
      <ram:Name>${xmlEscape(line.name)}</ram:Name>
    </ram:SpecifiedTradeProduct>
    <ram:SpecifiedLineTradeAgreement>
      <ram:NetPriceProductTradePrice>
        <ram:ChargeAmount>${fmt4(line.unit_price_net)}</ram:ChargeAmount>
      </ram:NetPriceProductTradePrice>
    </ram:SpecifiedLineTradeAgreement>
    <ram:SpecifiedLineTradeDelivery>
      <ram:BilledQuantity unitCode="${line.unit_code ?? "C62"}">${fmt4(line.quantity)}</ram:BilledQuantity>
    </ram:SpecifiedLineTradeDelivery>
    <ram:SpecifiedLineTradeSettlement>
      <ram:ApplicableTradeTax>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CategoryCode>${line.vat_category}</ram:CategoryCode>
        <ram:RateApplicablePercent>${fmt2(line.vat_rate_percent)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementLineMonetarySummation>
        <ram:LineTotalAmount>${fmt2(net)}</ram:LineTotalAmount>
      </ram:SpecifiedTradeSettlementLineMonetarySummation>
    </ram:SpecifiedLineTradeSettlement>
  </ram:IncludedSupplyChainTradeLineItem>`;
}
```

**Gotcha: number formatting.** Unit prices use 4 decimals (`ChargeAmount`), totals use 2. Quantities technically accept 4 but most validators want 4. Dates are `format="102"` which means `YYYYMMDD` with zero separator. Currency codes are ISO 4217 uppercase. Country codes are ISO 3166-1 alpha-2 uppercase. Get any of these formats wrong and it's a silent pass through some validators, rejection by others.

**Gotcha: the profile URN.** The `GuidelineSpecifiedDocumentContextParameter/ID` tells downstream tools which profile you claim. The five URNs are:

```ts
function profileToGuideline(profile: string): string {
  switch (profile) {
    case "MINIMUM": return "urn:factur-x.eu:1p0:minimum";
    case "BASIC_WL": return "urn:factur-x.eu:1p0:basicwl";
    case "BASIC": return "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic";
    case "EN_16931": return "urn:cen.eu:en16931:2017";
    case "EXTENDED": return "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended";
  }
}
```

If you claim EN 16931 but your XML doesn't include fields the profile requires, validators reject. Claim BASIC and you pass — but keep more data. In production we output BASIC; it's the honest compromise.

## Business rules validation

EN 16931 defines ~140 business rules (`BR-01` through `BR-CO-23`). Rather than validating the XML *after* generation, validate the input *before*:

```ts
export interface ValidationError {
  rule: string;
  field: string;
  message: string;
}

export function validateInvoice(inv: FacturXInvoice): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!inv.invoice_number?.trim()) {
    errors.push({ rule: "BR-02", field: "invoice_number",
      message: "Invoice number required" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inv.issue_date)) {
    errors.push({ rule: "BR-03", field: "issue_date",
      message: "Issue date must be YYYY-MM-DD" });
  }
  if (!/^[A-Z]{3}$/.test(inv.currency)) {
    errors.push({ rule: "BR-05", field: "currency",
      message: "ISO 4217 currency code required" });
  }
  if (!inv.seller.name?.trim()) {
    errors.push({ rule: "BR-06", field: "seller.name",
      message: "Seller name required" });
  }
  if (!/^[A-Z]{2}$/.test(inv.seller.country_code)) {
    errors.push({ rule: "BR-08", field: "seller.country_code",
      message: "Seller country ISO alpha-2 required" });
  }
  if (!inv.lines.length) {
    errors.push({ rule: "BR-16", field: "lines",
      message: "At least one line required" });
  }

  inv.lines.forEach((l, i) => {
    if (!(l.quantity > 0)) {
      errors.push({ rule: "BR-22", field: `lines[${i}].quantity`,
        message: `Line ${i + 1} quantity must be > 0` });
    }
    if (l.unit_price_net < 0) {
      errors.push({ rule: "BR-27", field: `lines[${i}].unit_price_net`,
        message: `Line ${i + 1} price cannot be negative` });
    }
  });

  return errors;
}
```

I ship about 15 of the 140 rules. That catches all the basic structural errors. For deeper compliance you can use the [official Schematron validators](https://github.com/ConnectingEurope/eInvoicing-EN16931) — they're free, open-source, Java-based. We run them in CI, not at runtime.

## Embedding the XML in PDF/A-3

This is where 90% of tutorials stop or get it wrong. The XML must be attached to the PDF with a **specific AFRelationship** (`Alternative`, meaning "machine-readable alternative of the visible content"), and the PDF must declare `pdfaid:part=3` + `pdfaid:conformance=B`.

`pdf-lib` supports attachments with AFRelationship natively since v1.17:

```ts
import { PDFDocument, PDFName, AFRelationship } from "pdf-lib";

export async function generateFacturXPdf(inv: FacturXInvoice) {
  const xml = buildFacturXCiiXml(inv);
  const pdf = await PDFDocument.create();

  pdf.setTitle(`Invoice ${inv.invoice_number}`);
  pdf.setAuthor(inv.seller.name);
  pdf.setProducer("myapp Factur-X");
  pdf.setCreator("myapp");

  // 1. Draw the visible invoice
  await drawInvoice(pdf, inv);

  // 2. Attach the XML with AFRelationship="Alternative"
  const xmlBytes = new TextEncoder().encode(xml);
  await pdf.attach(xmlBytes, "factur-x.xml", {
    mimeType: "application/xml",
    description: "Factur-X (EN 16931 CII)",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Alternative,
  });

  // 3. Set XMP metadata declaring PDF/A-3B + Factur-X profile
  const xmp = buildXmpMetadata(inv);
  const catalog = pdf.catalog;
  const xmpStream = pdf.context.stream(xmp, {
    Type: "Metadata",
    Subtype: "XML",
  });
  const xmpRef = pdf.context.register(xmpStream);
  catalog.set(PDFName.of("Metadata"), xmpRef);

  return pdf.save();
}
```

The XMP metadata declares conformance and embeds the Factur-X-specific tags:

```ts
function buildXmpMetadata(inv: FacturXInvoice): string {
  const profile = ({
    MINIMUM: "MINIMUM", BASIC_WL: "BASIC WL",
    BASIC: "BASIC", EN_16931: "EN 16931", EXTENDED: "EXTENDED",
  })[inv.profile];
  const now = new Date().toISOString();

  return `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>${profile}</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
```

## The honest limitations

Strict PDF/A-3B requires:

- An **ICC color profile** embedded in the output intent
- **All fonts embedded and subsetted**
- **No transparency, no JavaScript**, no encryption

pdf-lib's Standard14 fonts (Helvetica, Courier) are not embedded in the output — they rely on viewer built-in fonts. That's fine for PDF/A-3 "relaxed" (which accepts Standard14) but fails strict veraPDF validation.

In practice:

- ✅ Accepted by **Chorus Pro**, the French state invoicing portal
- ✅ Accepted by **Pennylane**, **Sellsy**, **Quickbooks FR**
- ✅ Peppol AP gateways parse the XML successfully
- ⚠️ Fails `veraPDF` strict mode (ICC profile + font embedding missing)
- ⚠️ Some validators complain about missing output intent

If your users are other SaaS platforms: ship this. If your users are auditors demanding strict PDF/A-3B: you'll need to embed a sRGB ICC profile (search for `sRGB IEC61966-2-1` — it's free, 3 KB) and subset custom TrueType fonts via `pdf.embedFont(bytes, { subset: true })`.

## What happens next

The September 2026 French reform introduces a **PPF** (Portail Public de Facturation) as central hub + registered **PDPs** (Plateformes de Dématérialisation Partenaires) for transmission. Factur-X is one of three accepted formats (with UBL 2.1 and CII UN/CEFACT standalone). The choice of format doesn't matter to the state — all three carry the same EN 16931 semantic model.

What matters: **your invoices must be machine-readable**. If you're still generating PDF-only invoices, you have until September 2026 to move. After that, B2B invoices outside the PDP network won't be legally valid for VAT deduction.

## Where I use this in production

At [tevaxia.lu](https://tevaxia.lu) we generate Factur-X invoices automatically from two sources:

1. **Syndic fund calls** (copropriété in Luxembourg): one PDF per co-owner, batch-generated when the syndic issues a quarterly call, VAT-exempt under Article 261 D CGI for intra-coop operations
2. **Hotel PMS folios**: at check-out, the folio's 19 USALI categories are mapped to invoice lines with their correct VAT rate (3% accommodation, 17% F&B under Luxembourg law)

Both hooks run the same pipeline: `buildInvoice()` → `validateInvoice()` → `generateFacturXPdf()`. The full code is in `src/lib/facturation/` if you want to see production-ready variants — we publish the [OpenAPI 3.1 spec](https://tevaxia.lu/api-docs) for the REST endpoints.

## Takeaway

If you're building a SaaS that issues invoices in France/EU after September 2026, you need Factur-X (or UBL 2.1) — there's no opting out. The good news: the hard part is the *spec reading*, not the code. The full implementation above is ~500 lines and has no runtime dependencies beyond `pdf-lib`.

The spec is dense but logically consistent. The format is here to stay. And for once, "implemented from scratch" is the right path: SDKs are overpriced for what they deliver.

---

*This post is adapted from the Factur-X module we built for [tevaxia.lu](https://tevaxia.lu), a Luxembourg real estate SaaS. The [electronic invoicing module](https://tevaxia.lu/facturation) is free during our launch phase.*

**References**
- [EN 16931-1:2017 — semantic model](https://www.cen.eu/news/brief-news/Pages/NEWS-2017-017.aspx)
- [FNFE-MPE Factur-X v1.0.07 (08/2024)](https://fnfe-mpe.org/factur-x/)
- [Peppol BIS Billing 3.0](https://docs.peppol.eu/poacc/billing/3.0/)
- [France DGFiP reform calendar](https://www.impots.gouv.fr/actualite/la-facturation-electronique)
- [pdf-lib documentation](https://pdf-lib.js.org/)
