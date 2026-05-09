// ============================================================
// Factur-X — génération PDF/A-3 avec XML embarqué
// ============================================================
//
// Construit un PDF/A-3 conforme Factur-X :
//   - Contenu visuel humainement lisible (facture rendue)
//   - XML EN 16931 (CII) embarqué comme pièce jointe
//     avec AFRelationship="Alternative" et conformance PDF/A-3B
//
// Utilise pdf-lib (client + serveur, pure JS, pas de dep native).
//
// Note : la conformité PDF/A-3B stricte demande un ICC profile
// embarqué et des métadonnées XMP spécifiques. Cette V1 produit
// un PDF/A-like avec XML embarqué et métadonnées XMP Factur-X —
// suffisant pour être accepté par les PA courantes (Pennylane,
// Sellsy, Chorus Pro). Validation stricte PDF/A-3B veritypdf
// prévue pour V1.2.

import { PDFDocument, PDFName, StandardFonts, rgb, AFRelationship } from "pdf-lib";
import type { FacturXInvoice } from "./factur-x";
import { buildFacturXCiiXml, computeTotals } from "./factur-x";

// ============================================================
// Rendu visuel PDF
// ============================================================

function fmtEUR(n: number, currency = "EUR"): string {
  const sym = currency === "EUR" ? "€" : currency;
  return `${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${sym}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function drawInvoice(pdf: PDFDocument, inv: FacturXInvoice): Promise<void> {
  const page = pdf.addPage([595, 842]); // A4 portrait pt
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const navy = rgb(0.04, 0.16, 0.34);
  const muted = rgb(0.45, 0.50, 0.56);
  const black = rgb(0, 0, 0);
  const line = rgb(0.85, 0.87, 0.91);

  const totals = computeTotals(inv);
  const W = 595, M = 40;

  let y = 800;

  // Header
  page.drawText("FACTURE", { x: M, y, size: 22, font: bold, color: navy });
  page.drawText(`N° ${inv.invoice_number}`, { x: W - M - 160, y: y + 4, size: 11, font: bold, color: black });
  page.drawText(`Date : ${formatDate(inv.issue_date)}`, { x: W - M - 160, y: y - 10, size: 9, font, color: muted });
  if (inv.due_date) {
    page.drawText(`Échéance : ${formatDate(inv.due_date)}`, { x: W - M - 160, y: y - 22, size: 9, font, color: muted });
  }
  y -= 50;

  // Vendeur
  page.drawText("VENDEUR", { x: M, y, size: 9, font: bold, color: muted });
  y -= 14;
  page.drawText(inv.seller.name, { x: M, y, size: 11, font: bold, color: black });
  y -= 14;
  if (inv.seller.address_line1) { page.drawText(inv.seller.address_line1, { x: M, y, size: 10, font, color: black }); y -= 12; }
  if (inv.seller.postcode || inv.seller.city) {
    page.drawText(`${inv.seller.postcode ?? ""} ${inv.seller.city ?? ""}`.trim(), { x: M, y, size: 10, font, color: black });
    y -= 12;
  }
  if (inv.seller.country_code) { page.drawText(inv.seller.country_code, { x: M, y, size: 10, font, color: muted }); y -= 12; }
  if (inv.seller.vat_id) { page.drawText(`TVA : ${inv.seller.vat_id}`, { x: M, y, size: 9, font, color: muted }); y -= 11; }
  if (inv.seller.legal_id) { page.drawText(`SIREN / RCS : ${inv.seller.legal_id}`, { x: M, y, size: 9, font, color: muted }); y -= 11; }

  // Acheteur (colonne droite)
  let yR = 750;
  page.drawText("CLIENT", { x: 320, y: yR, size: 9, font: bold, color: muted });
  yR -= 14;
  page.drawText(inv.buyer.name, { x: 320, y: yR, size: 11, font: bold, color: black });
  yR -= 14;
  if (inv.buyer.address_line1) { page.drawText(inv.buyer.address_line1, { x: 320, y: yR, size: 10, font, color: black }); yR -= 12; }
  if (inv.buyer.postcode || inv.buyer.city) {
    page.drawText(`${inv.buyer.postcode ?? ""} ${inv.buyer.city ?? ""}`.trim(), { x: 320, y: yR, size: 10, font, color: black });
    yR -= 12;
  }
  if (inv.buyer.country_code) { page.drawText(inv.buyer.country_code, { x: 320, y: yR, size: 10, font, color: muted }); yR -= 12; }
  if (inv.buyer.vat_id) { page.drawText(`TVA : ${inv.buyer.vat_id}`, { x: 320, y: yR, size: 9, font, color: muted }); yR -= 11; }

  y = Math.min(y, yR) - 20;

  // Refs
  if (inv.buyer_reference) {
    page.drawText(`Réf. client : ${inv.buyer_reference}`, { x: M, y, size: 9, font, color: muted });
    y -= 12;
  }
  if (inv.contract_reference) {
    page.drawText(`Contrat : ${inv.contract_reference}`, { x: M, y, size: 9, font, color: muted });
    y -= 12;
  }
  y -= 10;

  // Table header
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: line });
  y -= 14;
  page.drawText("Description", { x: M, y, size: 9, font: bold, color: navy });
  page.drawText("Qté", { x: 320, y, size: 9, font: bold, color: navy });
  page.drawText("P.U. HT", { x: 370, y, size: 9, font: bold, color: navy });
  page.drawText("TVA%", { x: 440, y, size: 9, font: bold, color: navy });
  page.drawText("Total HT", { x: W - M - 60, y, size: 9, font: bold, color: navy });
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: line });
  y -= 14;

  // Lines
  for (const l of inv.lines) {
    const gross = l.quantity * l.unit_price_net;
    const net = l.discount_percent ? gross * (1 - l.discount_percent / 100) : gross;
    const nameTrunc = l.name.length > 45 ? l.name.slice(0, 42) + "..." : l.name;
    page.drawText(nameTrunc, { x: M, y, size: 10, font, color: black });
    page.drawText(l.quantity.toFixed(2), { x: 320, y, size: 10, font: mono, color: black });
    page.drawText(l.unit_price_net.toFixed(2), { x: 370, y, size: 10, font: mono, color: black });
    page.drawText(`${l.vat_rate_percent}%`, { x: 440, y, size: 10, font: mono, color: black });
    page.drawText(net.toFixed(2), { x: W - M - 60, y, size: 10, font: mono, color: black });
    y -= 16;
    if (l.description) {
      const descTrunc = l.description.length > 80 ? l.description.slice(0, 77) + "..." : l.description;
      page.drawText(descTrunc, { x: M + 10, y, size: 8, font, color: muted });
      y -= 12;
    }
    if (l.discount_percent) {
      page.drawText(`   (remise ${l.discount_percent}%)`, { x: M + 10, y, size: 8, font, color: muted });
      y -= 12;
    }
  }
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: line });
  y -= 20;

  // Totaux
  const tx = W - M - 60;
  page.drawText("Total HT", { x: 360, y, size: 10, font, color: black });
  page.drawText(fmtEUR(totals.line_total, inv.currency), { x: tx, y, size: 10, font: mono, color: black });
  y -= 14;
  for (const v of totals.vat_breakdown) {
    page.drawText(`TVA ${v.rate_percent}%`, { x: 360, y, size: 10, font, color: black });
    page.drawText(fmtEUR(v.tax_amount, inv.currency), { x: tx, y, size: 10, font: mono, color: black });
    y -= 12;
  }
  y -= 4;
  page.drawLine({ start: { x: 360, y }, end: { x: W - M, y }, thickness: 0.5, color: line });
  y -= 16;
  page.drawText("Total TTC", { x: 360, y, size: 12, font: bold, color: navy });
  page.drawText(fmtEUR(totals.grand_total, inv.currency), { x: tx, y, size: 12, font: bold, color: navy });
  y -= 30;

  // Paiement
  if (inv.payment_iban) {
    page.drawText("PAIEMENT", { x: M, y, size: 9, font: bold, color: muted });
    y -= 14;
    page.drawText(`IBAN : ${inv.payment_iban}`, { x: M, y, size: 10, font: mono, color: black });
    y -= 12;
    if (inv.payment_bic) { page.drawText(`BIC : ${inv.payment_bic}`, { x: M, y, size: 10, font: mono, color: black }); y -= 12; }
    if (inv.payment_reference) { page.drawText(`Référence : ${inv.payment_reference}`, { x: M, y, size: 10, font, color: black }); y -= 12; }
    if (inv.payment_terms) { page.drawText(inv.payment_terms, { x: M, y, size: 9, font, color: muted }); y -= 12; }
    y -= 10;
  }

  // Notes
  if (inv.notes?.length) {
    for (const n of inv.notes) {
      const nTrunc = n.length > 100 ? n.slice(0, 97) + "..." : n;
      page.drawText(nTrunc, { x: M, y, size: 9, font, color: muted });
      y -= 12;
    }
  }

  // Footer Factur-X
  page.drawLine({ start: { x: M, y: 35 }, end: { x: W - M, y: 35 }, thickness: 0.5, color: line });
  page.drawText(`Facture Factur-X (EN 16931) — profil ${inv.profile} · XML CII embarqué`, {
    x: M, y: 22, size: 8, font, color: muted,
  });
  page.drawText("Généré par tevaxia.lu", { x: W - M - 90, y: 22, size: 8, font, color: muted });
}

// ============================================================
// Embed XML Factur-X (CII) en pièce jointe + métadonnées XMP
// ============================================================

async function embedFacturXml(pdf: PDFDocument, xml: string, filename = "factur-x.xml"): Promise<void> {
  const xmlBytes = new TextEncoder().encode(xml);
  await pdf.attach(xmlBytes, filename, {
    mimeType: "application/xml",
    description: "Facture électronique Factur-X (EN 16931 CII)",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Alternative,
  });
}

function buildXmpMetadata(inv: FacturXInvoice): string {
  const profileUrn = (() => {
    switch (inv.profile) {
      case "MINIMUM": return "MINIMUM";
      case "BASIC_WL": return "BASIC WL";
      case "BASIC": return "BASIC";
      case "EN_16931": return "EN 16931";
      case "EXTENDED": return "EXTENDED";
    }
  })();
  const now = new Date().toISOString();
  return `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="tevaxia-factur-x">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Facture ${inv.invoice_number}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>tevaxia.lu</rdf:li></rdf:Seq></dc:creator>
      <pdf:Producer>tevaxia.lu Factur-X</pdf:Producer>
      <xmp:CreatorTool>tevaxia.lu</xmp:CreatorTool>
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>${profileUrn}</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// ============================================================
// Public API
// ============================================================

export interface FacturXArtifacts {
  pdfBytes: Uint8Array;
  xml: string;
  pdfFilename: string;
  xmlFilename: string;
}

export async function generateFacturXPdf(inv: FacturXInvoice): Promise<FacturXArtifacts> {
  const xml = buildFacturXCiiXml(inv);
  const pdf = await PDFDocument.create();

  pdf.setTitle(`Facture ${inv.invoice_number}`);
  pdf.setAuthor(inv.seller.name);
  pdf.setSubject(`Facture ${inv.invoice_number} — ${inv.seller.name}`);
  pdf.setKeywords(["facture", "factur-x", "en16931", inv.invoice_number]);
  pdf.setProducer("tevaxia.lu Factur-X");
  pdf.setCreator("tevaxia.lu");

  await drawInvoice(pdf, inv);
  await embedFacturXml(pdf, xml);

  // Métadonnées XMP Factur-X (tag custom dans catalogue)
  const xmp = buildXmpMetadata(inv);
  const catalog = pdf.catalog;
  const xmpStream = pdf.context.stream(xmp, {
    Type: "Metadata",
    Subtype: "XML",
  });
  const xmpRef = pdf.context.register(xmpStream);
  catalog.set(PDFName.of("Metadata"), xmpRef);

  const pdfBytes = await pdf.save();
  const safeNum = inv.invoice_number.replace(/[^A-Za-z0-9_-]/g, "_");

  return {
    pdfBytes,
    xml,
    pdfFilename: `facture-${safeNum}.pdf`,
    xmlFilename: `facture-${safeNum}.xml`,
  };
}
