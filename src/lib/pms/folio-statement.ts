import type { PmsFolio, PmsFolioCharge } from "./types";

const cents = (value: number): bigint => {
  if (!/^-?\d+(\.\d{1,2})?$/.test(String(value))) throw new Error("Invalid recorded amount");
  const [w, f = ""] = String(value).replace(/^-/, "").split(".");
  return (BigInt(w) * 100n + BigInt(f.padEnd(2, "0"))) * (value < 0 ? -1n : 1n);
};
const euros = (n: bigint) => {
  if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(-Number.MAX_SAFE_INTEGER)) throw new Error("Amount too large");
  return Number(n) / 100;
};
/** Copies recorded amounts without reconstructing an invoice or inferring a VAT treatment. */
export function prepareFolioStatement(folio: PmsFolio, charges: PmsFolioCharge[]) {
  if (!folio.id || !/^[A-Z]{3}$/.test(folio.currency)) throw new Error("Unsupported folio");
  const seen = new Set<string>();
  let ht = 0n, vat = 0n, gross = 0n;
  const lines: PmsFolioCharge[] = [];
  for (const c of charges) {
    if (!c.id || c.folio_id !== folio.id || seen.has(c.id) || typeof c.voided !== "boolean") throw new Error("Invalid charge identity");
    seen.add(c.id);
    if (c.voided) continue;
    if (!c.description?.trim() || !Number.isFinite(c.quantity) || c.quantity <= 0 || !Number.isFinite(c.unit_price_ht) || !Number.isFinite(c.tva_rate) || c.tva_rate < 0 || c.tva_rate > 99.99 || !Number.isFinite(Date.parse(c.posted_at)) || !/(Z|[+-]\d{2}:\d{2})$/.test(c.posted_at)) throw new Error("Invalid recorded charge");
    const h = cents(c.line_ht), v = cents(c.line_tva), g = cents(c.line_ttc);
    if (h + v !== g) throw new Error("Unbalanced charge");
    ht += h; vat += v; gross += g; lines.push({ ...c });
  }
  if (ht !== cents(folio.subtotal_ht) || vat !== cents(folio.total_tva) || gross !== cents(folio.total_ttc)) throw new Error("Folio changed or incomplete");
  return { currency: folio.currency, folioId: folio.id, lines, ht: euros(ht), vat: euros(vat), gross: euros(gross), balance: euros(cents(folio.balance_due)) };
}
export type FolioStatement = ReturnType<typeof prepareFolioStatement>;
