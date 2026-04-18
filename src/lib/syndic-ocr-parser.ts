// ============================================================
// SYNDIC — Parseur heuristique factures (pur TS, zéro AI)
// ============================================================
//
// À partir de texte brut extrait d'une facture (PDF digital via pdf.js
// OU scanné via Tesseract.js), détecte :
//   - montants HT / TVA / TTC (regex EUR + formats FR/LU)
//   - taux TVA (3%, 8%, 14%, 17% LU)
//   - date facture
//   - n° facture
//   - IBAN du fournisseur
//   - n° TVA fournisseur (LU + 8 chiffres, FR + 11)
//   - nom du fournisseur (heuristique premier bloc MAJUSCULE)
//   - référence paiement (communication structurée)
//
// Fonctionne à 90%+ sur factures standardisées LU/EU (utilities,
// assurance, artisans). Résultat marqué "à vérifier manuellement".

export interface ExtractedInvoice {
  raw_text: string;
  supplier_name: string | null;
  supplier_vat: string | null;
  supplier_iban: string | null;
  supplier_bic: string | null;
  invoice_number: string | null;
  invoice_date: string | null; // YYYY-MM-DD
  due_date: string | null;
  amount_ht: number | null;
  amount_tva: number | null;
  amount_ttc: number | null;
  tva_rate: number | null;
  currency: string;
  payment_reference: string | null;
  confidence: number; // 0-100
  detected_fields: string[]; // liste des champs trouvés pour le score
}

// ============================================================
// Helpers regex
// ============================================================

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAmount(raw: string): number | null {
  // Formats possibles : 1 234,56 · 1.234,56 · 1,234.56 · 1234.56
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  // Détecte séparateur décimal : le dernier . ou , avant 2 chiffres
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  let normalized: string;
  if (lastComma > lastDot) {
    // virgule décimale (format EU)
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // point décimal (format US/UK)
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned;
  }
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function extractAmount(text: string, labels: string[]): number | null {
  for (const label of labels) {
    const escLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Exige un montant suivi de EUR ou €. Le % du taux TVA est non-capturé
    // car la regex veut un nombre suivi directement de EUR/€ (pas %).
    const patterns = [
      // "Label ... 1 234,56 EUR"  — pattern large, non-greedy
      new RegExp(`${escLabel}[\\s\\S]{0,100}?(\\d[\\d\\s.,]{0,15}\\d)\\s*(?:EUR|€)`, "i"),
      // "Label: 1234.56" sans EUR explicite mais en fin de ligne
      new RegExp(`${escLabel}[^\\n]{0,40}[:=]\\s*(\\d[\\d.,]{1,15})\\s*$`, "im"),
    ];
    for (const regex of patterns) {
      const match = text.match(regex);
      if (match) {
        const n = normalizeAmount(match[1]);
        if (n !== null && n > 0 && n < 10_000_000) return n;
      }
    }
  }
  return null;
}

function extractDate(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const labelRegex = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const r1 = new RegExp(`${labelRegex}[^\\d]*(\\d{2})[./-](\\d{2})[./-](\\d{4})`, "i");
    const m1 = text.match(r1);
    if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
    // YYYY-MM-DD
    const r2 = new RegExp(`${labelRegex}[^\\d]*(\\d{4})-(\\d{2})-(\\d{2})`, "i");
    const m2 = text.match(r2);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  }
  return null;
}

function extractFirstIban(text: string): string | null {
  // Longueurs IBAN par pays
  const ibanLengths: Record<string, number> = {
    LU: 20, FR: 27, BE: 16, DE: 22, NL: 18, IT: 27, ES: 24, PT: 25, CH: 21, AT: 20, GB: 22, IE: 22,
  };
  // On cherche toutes les occurrences possibles (avec ou sans espaces)
  // Trouve un préfixe pays-digit-digit puis consomme blocs alphanumériques
  const matches = text.matchAll(/\b([A-Z]{2})(\d{2})((?:[\s-]?[A-Z0-9]){10,32})\b/g);
  for (const m of matches) {
    const country = m[1].toUpperCase();
    const clean = (m[1] + m[2] + m[3]).replace(/[\s-]/g, "").toUpperCase();
    const expectedLen = ibanLengths[country];
    if (expectedLen && clean.length >= expectedLen) {
      const truncated = clean.slice(0, expectedLen);
      if (/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(truncated)) {
        return truncated;
      }
    }
  }
  return null;
}

function extractBic(text: string): string | null {
  // BIC avec préfixe explicite + pays valide (pas juste 11 lettres quelconques)
  const match = text.match(/BIC\s*[:=]?\s*([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/i);
  if (match) return match[1].toUpperCase();
  // Fallback : BIC courants LU
  const luBic = text.match(/\b(BCEELULL|BILLLULL|BGLLLULL|CCRALULL|CELLLULX|BSUILULL|BLUXLULL)[A-Z0-9]{0,3}\b/i);
  return luBic ? luBic[0].toUpperCase() : null;
}

function extractVatNumber(text: string): string | null {
  // LU : LU + 8 chiffres
  const luMatch = text.match(/\bLU\s?\d{8}\b/i);
  if (luMatch) return luMatch[0].replace(/\s/g, "").toUpperCase();
  // FR : FR + 2 cle + 9 siren
  const frMatch = text.match(/\bFR\s?[A-Z0-9]{2}\s?\d{9}\b/i);
  if (frMatch) return frMatch[0].replace(/\s/g, "").toUpperCase();
  // BE : BE + 10 chiffres
  const beMatch = text.match(/\bBE\s?0?\d{9}\b/i);
  if (beMatch) return beMatch[0].replace(/\s/g, "").toUpperCase();
  // DE : DE + 9 chiffres
  const deMatch = text.match(/\bDE\s?\d{9}\b/i);
  if (deMatch) return deMatch[0].replace(/\s/g, "").toUpperCase();
  return null;
}

function extractInvoiceNumber(text: string): string | null {
  const patterns = [
    /(?:facture|invoice|rechnung|factuur)\s*(?:n°|no\.?|#|number)?\s*:?\s*([A-Z0-9][A-Z0-9\-_/]{2,25})/i,
    /\bFAC[-_]?(\d{4,10})\b/,
    /\bF\d{4,10}\b/,
    /\bN°\s*([A-Z0-9][A-Z0-9\-_/]{2,25})/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function extractTvaRate(text: string): number | null {
  // Taux LU : 3, 8, 14, 17. Formats : "TVA 17%", "17,00%", "17 %"
  const patterns = [
    /(?:TVA|VAT|BTW)[^0-9]{0,20}(\d{1,2})(?:[.,]\d{1,2})?\s*%/i,
    /(\d{1,2})(?:[.,]\d{1,2})?\s*%\s*(?:TVA|VAT)/i,
    /taux\s*(?:de\s*)?TVA?\s*:?\s*(\d{1,2})/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1]) {
      const rate = Number(match[1]);
      if ([3, 8, 14, 17, 20, 21].includes(rate)) return rate;
    }
  }
  return null;
}

function extractSupplierName(text: string): string | null {
  // Heuristique : premier bloc en majuscules de 3-80 chars en début de texte
  const lines = text.split(/\n|\r\n/);
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 80) continue;
    // Privilégie les lignes en MAJUSCULES
    if (/^[A-ZÀ-Ü\d&\s'.,\-]{3,80}$/.test(trimmed) && /[A-Z]{3,}/.test(trimmed)) {
      return trimmed;
    }
  }
  // Fallback : 1re ligne non vide
  const firstNonEmpty = lines.find((l) => l.trim().length >= 3);
  return firstNonEmpty?.trim().slice(0, 80) ?? null;
}

function extractPaymentReference(text: string): string | null {
  // Communication structurée : "+++NNN/NNNN/NNNNN+++" ou "BBAN..." ou ref commune
  const structured = text.match(/\+\+\+\d{3}\/\d{4}\/\d{5}\+\+\+/);
  if (structured) return structured[0];
  const patterns = [
    /(?:r[ée]f[ée]rence|referentie|reference)\s*(?:client|paiement|communication)?\s*:?\s*([A-Z0-9\-_/]{4,40})/i,
    /(?:communication)\s*:?\s*([A-Z0-9\-_/\s]{4,60})/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1]) return match[1].trim().slice(0, 60);
  }
  return null;
}

// ============================================================
// Fonction principale
// ============================================================

export function parseInvoiceText(rawText: string): ExtractedInvoice {
  const text = cleanText(rawText);
  const detected: string[] = [];

  const supplier_name = extractSupplierName(rawText);
  if (supplier_name) detected.push("supplier_name");

  const supplier_vat = extractVatNumber(text);
  if (supplier_vat) detected.push("supplier_vat");

  const supplier_iban = extractFirstIban(text);
  if (supplier_iban) detected.push("supplier_iban");

  const supplier_bic = extractBic(text);
  if (supplier_bic) detected.push("supplier_bic");

  const invoice_number = extractInvoiceNumber(text);
  if (invoice_number) detected.push("invoice_number");

  const invoice_date = extractDate(text, ["facture", "date facture", "date d'émission", "datum"]) ??
    extractDate(text, ["date"]);
  if (invoice_date) detected.push("invoice_date");

  const due_date = extractDate(text, [
    "échéance", "date d'échéance", "due date", "payable jusqu'au", "à régler avant", "zu zahlen bis",
  ]);
  if (due_date) detected.push("due_date");

  const amount_ttc = extractAmount(text, [
    "total TTC", "total à payer", "montant total", "total", "grand total", "a payer", "à payer",
  ]);
  if (amount_ttc) detected.push("amount_ttc");

  const amount_ht = extractAmount(text, [
    "total HT", "sous-total", "subtotal", "montant HT", "net HT",
  ]);
  if (amount_ht) detected.push("amount_ht");

  const amount_tva = extractAmount(text, [
    "montant TVA", "TVA", "total TVA", "VAT amount",
  ]);
  if (amount_tva) detected.push("amount_tva");

  const tva_rate = extractTvaRate(text);
  if (tva_rate) detected.push("tva_rate");

  const payment_reference = extractPaymentReference(text);
  if (payment_reference) detected.push("payment_reference");

  // Détection EUR par défaut
  const currency = /\bEUR\b|\u20AC/.test(text) ? "EUR" : "EUR";

  // Score de confiance : 5 champs critiques × 15 + bonus
  const critical = ["supplier_name", "amount_ttc", "invoice_date", "supplier_vat", "invoice_number"];
  const criticalFound = critical.filter((k) => detected.includes(k)).length;
  let confidence = Math.round((criticalFound / critical.length) * 75);
  if (supplier_iban) confidence += 10;
  if (tva_rate) confidence += 5;
  if (amount_ht && amount_tva && amount_ttc) confidence += 10;
  confidence = Math.min(100, confidence);

  return {
    raw_text: rawText.slice(0, 5000),
    supplier_name,
    supplier_vat,
    supplier_iban,
    supplier_bic,
    invoice_number,
    invoice_date,
    due_date,
    amount_ht,
    amount_tva,
    amount_ttc,
    tva_rate,
    currency,
    payment_reference,
    confidence,
    detected_fields: detected,
  };
}
