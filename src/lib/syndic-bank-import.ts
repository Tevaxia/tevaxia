// ============================================================
// SYNDIC — Import relevé bancaire CSV + rapprochement auto
// ============================================================
//
// Parse d'un CSV de relevé bancaire (format BCEE / BIL / Spuerkeess /
// ING LU standard) et rapprochement automatique des crédits entrants
// avec les appels de fonds via la référence de paiement unique.

export interface BankTransaction {
  date: string; // YYYY-MM-DD
  amount: number; // positif = crédit entrant, négatif = débit sortant
  label: string;
  reference: string | null; // référence virement (souvent la comm. donneur d'ordre)
  counterparty: string | null; // nom / IBAN contrepartie
  raw: Record<string, string>;
}

export interface ParsedBankStatement {
  transactions: BankTransaction[];
  headers: string[];
  delimiter: ";" | ",";
  format: "bcee" | "bil" | "spuerkeess" | "ing" | "generic";
  total: number;
  credits: number;
  debits: number;
}

// ============================================================
// Détection format bancaire LU
// ============================================================

function detectFormat(headers: string[]): ParsedBankStatement["format"] {
  const h = headers.join("|").toLowerCase();
  if (h.includes("bcee") || h.includes("comptes") && h.includes("luxlait")) return "bcee";
  if (h.includes("bil") || (h.includes("date de valeur") && h.includes("montant en eur"))) return "bil";
  if (h.includes("raiffeisen") || h.includes("spuerkeess")) return "spuerkeess";
  if (h.includes("ing luxembourg")) return "ing";
  return "generic";
}

// ============================================================
// CSV parsing
// ============================================================

function splitCsv(line: string, delim: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; continue; }
      inQuote = !inQuote; continue;
    }
    if (c === delim && !inQuote) { out.push(current); current = ""; continue; }
    current += c;
  }
  out.push(current);
  return out;
}

function parseAmount(v: string): number {
  if (!v) return 0;
  const cleaned = v
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "") // thousand sep EU
    .replace(",", ".")
    .trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(v: string): string {
  if (!v) return "";
  // DD/MM/YYYY or DD.MM.YYYY
  const m1 = v.match(/^(\d{2})[./](\d{2})[./](\d{4})/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  // YYYY-MM-DD already
  const m2 = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return v;
}

/**
 * Mappe les colonnes usuelles vers notre modèle BankTransaction.
 */
function mapRow(row: Record<string, string>, _format: ParsedBankStatement["format"]): BankTransaction | null {
  const find = (keys: string[]): string | null => {
    for (const k of keys) {
      const val = Object.entries(row).find(([hk]) => hk.toLowerCase().includes(k))?.[1];
      if (val) return val;
    }
    return null;
  };

  const dateRaw = find(["date opération", "date valeur", "date de valeur", "date", "booking date"]);
  const amountRaw = find(["montant", "montant en eur", "amount", "valeur"]);
  const label = find(["libellé", "description", "communication", "détails", "objet"]);
  const reference = find(["référence", "communication", "comm.", "ref", "communication structurée", "reference"]);
  const counterparty = find(["bénéficiaire", "donneur d'ordre", "contrepartie", "name", "iban contrepartie", "nom"]);

  if (!dateRaw || !amountRaw) return null;

  const amount = parseAmount(amountRaw);
  if (amount === 0) return null;

  return {
    date: parseDate(dateRaw),
    amount,
    label: label ?? "",
    reference: reference ?? null,
    counterparty: counterparty ?? null,
    raw: row,
  };
}

export function parseBankStatement(content: string): ParsedBankStatement {
  const text = content.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith("#"));
  if (lines.length === 0) {
    return { transactions: [], headers: [], delimiter: ";", format: "generic", total: 0, credits: 0, debits: 0 };
  }
  const firstLine = lines[0];
  const nbSemi = (firstLine.match(/;/g) ?? []).length;
  const nbComma = (firstLine.match(/,/g) ?? []).length;
  const delimiter: ";" | "," = nbSemi >= nbComma ? ";" : ",";
  const headers = splitCsv(firstLine, delimiter).map((h) => h.trim().toLowerCase());
  const format = detectFormat(headers);

  const transactions: BankTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsv(lines[i], delimiter);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (cells[j] ?? "").trim();
    }
    const tx = mapRow(row, format);
    if (tx) transactions.push(tx);
  }

  const credits = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const debits = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return { transactions, headers, delimiter, format, total: transactions.length, credits, debits };
}

// ============================================================
// Matching auto transactions → appels de fonds
// ============================================================

export interface UnpaidChargeForMatch {
  charge_id: string;
  unit_id: string;
  lot_number: string;
  owner_name: string | null;
  amount_due: number;
  amount_paid: number;
  outstanding: number;
  payment_reference: string | null;
  call_label: string;
}

export interface MatchResult {
  tx: BankTransaction;
  matched_charge: UnpaidChargeForMatch | null;
  match_score: number; // 0-100
  match_reason: string;
}

/**
 * Rapprochement : pour chaque transaction créditrice, tente de trouver
 * un appel impayé dont la référence de paiement correspond ou dont le
 * montant + nom propriétaire matchent.
 */
export function matchTransactions(
  transactions: BankTransaction[],
  unpaidCharges: UnpaidChargeForMatch[],
): MatchResult[] {
  const results: MatchResult[] = [];
  const usedChargeIds = new Set<string>();

  for (const tx of transactions) {
    if (tx.amount <= 0) {
      // débits sortants : ignore pour rapprochement appels de fonds (qui sont des crédits entrants)
      continue;
    }

    let bestMatch: UnpaidChargeForMatch | null = null;
    let bestScore = 0;
    let bestReason = "";

    for (const charge of unpaidCharges) {
      if (usedChargeIds.has(charge.charge_id)) continue;
      if (charge.outstanding <= 0) continue;

      let score = 0;
      const reasons: string[] = [];

      // Score 1 : référence exacte (le meilleur signal)
      if (charge.payment_reference && tx.reference) {
        const refNorm = charge.payment_reference.toLowerCase().replace(/\s+/g, "");
        const txRef = tx.reference.toLowerCase().replace(/\s+/g, "");
        if (txRef.includes(refNorm)) {
          score += 60;
          reasons.push("ref match");
        } else if (tx.label.toLowerCase().includes(refNorm)) {
          score += 45;
          reasons.push("ref dans libellé");
        }
      }

      // Score 2 : montant exact
      if (Math.abs(tx.amount - charge.outstanding) < 0.01) {
        score += 30;
        reasons.push("montant exact");
      } else if (Math.abs(tx.amount - charge.outstanding) < 1) {
        score += 15;
        reasons.push("montant ± 1 EUR");
      }

      // Score 3 : nom propriétaire dans libellé ou contrepartie
      if (charge.owner_name) {
        const ownerLast = charge.owner_name.split(" ").pop()?.toLowerCase();
        if (ownerLast && ownerLast.length > 2) {
          const haystack = `${tx.label} ${tx.counterparty ?? ""}`.toLowerCase();
          if (haystack.includes(ownerLast)) {
            score += 10;
            reasons.push(`nom "${ownerLast}"`);
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = charge;
        bestReason = reasons.join(", ");
      }
    }

    if (bestMatch && bestScore >= 30) {
      usedChargeIds.add(bestMatch.charge_id);
      results.push({ tx, matched_charge: bestMatch, match_score: bestScore, match_reason: bestReason });
    } else {
      results.push({ tx, matched_charge: null, match_score: 0, match_reason: "aucun match" });
    }
  }

  return results;
}
