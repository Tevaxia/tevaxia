// ============================================================
// Factur-X — builder dédié appels de fonds copropriété
// ============================================================
//
// Construit une Factur-X conforme EN 16931 à partir d'un appel de fonds
// + une charge individuelle copropriétaire. TVA exonérée (les syndicats
// de copropriété ne sont pas assujettis TVA — Art. 293 B + 261 D CGI FR
// ou Art. 44 §1 LU pour la zone d'application).
// ============================================================

import type { FacturXInvoice } from "./factur-x";

export interface CoproFacturXInput {
  call: {
    id: string;
    label: string;
    period_start: string;
    period_end: string;
    due_date: string;
    bank_iban?: string | null;
    bank_bic?: string | null;
    bank_account_holder?: string | null;
  };
  charge: {
    id: string;
    amount_due: number;
    payment_reference: string;
  };
  unit: {
    lot_number: string;
    owner_name?: string | null;
    tantiemes: number;
    address?: string | null;
  };
  coownership: {
    name: string;
    address?: string | null;
    commune?: string | null;
    total_tantiemes: number;
  };
  syndic: {
    name: string;
    address?: string | null;
    legal_id?: string | null;
    vat_id?: string | null;
    country_code?: string;
  };
}

function buildInvoiceNumber(call: { id: string }, unit: { lot_number: string }): string {
  const callShort = call.id.slice(0, 8).toUpperCase();
  const lotClean = unit.lot_number.replace(/[^A-Za-z0-9]/g, "");
  return `COPRO-${lotClean}-${callShort}`;
}

export function buildCoproFacturX(input: CoproFacturXInput): FacturXInvoice {
  const { call, charge, unit, coownership, syndic } = input;
  const tantiemesShare = coownership.total_tantiemes > 0
    ? (unit.tantiemes / coownership.total_tantiemes * 100).toFixed(3)
    : "0";

  const country = syndic.country_code ?? "LU";
  return {
    profile: "BASIC",
    document_type: "380",
    invoice_number: buildInvoiceNumber(call, unit),
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: call.due_date,
    currency: "EUR",
    seller: {
      name: `${coownership.name} (Syndicat de copropriété)`,
      address_line1: coownership.address ?? undefined,
      city: coownership.commune ?? undefined,
      country_code: country,
    },
    buyer: {
      name: unit.owner_name ?? `Lot ${unit.lot_number}`,
      address_line1: unit.address ?? coownership.address ?? undefined,
      city: coownership.commune ?? undefined,
      country_code: country,
    },
    lines: [{
      id: "1",
      name: `Appel de fonds — ${call.label}`,
      description: `Lot ${unit.lot_number} — ${unit.tantiemes} tantièmes (${tantiemesShare}%) — Période ${call.period_start} → ${call.period_end}`,
      quantity: 1,
      unit_code: "C62",
      unit_price_net: charge.amount_due,
      vat_category: "E",
      vat_rate_percent: 0,
    }],
    notes: [
      `Appel de fonds copropriété — exonération TVA (syndicat non assujetti)`,
      `Référence à mentionner au virement : ${charge.payment_reference}`,
      country === "FR" ? "Art. 261 D CGI" : "Art. 44 §1 Loi TVA LU",
      syndic.name ? `Syndic gestionnaire : ${syndic.name}` : "",
    ].filter(Boolean) as string[],
    buyer_reference: `Lot ${unit.lot_number}`,
    contract_reference: `Appel ${call.id.slice(0, 8)}`,
    payment_iban: call.bank_iban ?? undefined,
    payment_bic: call.bank_bic ?? undefined,
    payment_reference: charge.payment_reference,
    payment_terms: `À régler avant le ${new Date(call.due_date).toLocaleDateString("fr-FR")}`,
  };
}
