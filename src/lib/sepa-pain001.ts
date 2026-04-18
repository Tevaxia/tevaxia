// ============================================================
// SEPA Credit Transfer — pain.001.001.09 XML
// ============================================================
//
// Génère un fichier de virements en lot au format ISO 20022
// pain.001.001.09 (Customer Credit Transfer Initiation) accepté par
// toutes les banques LU (BCEE, BIL, BGL, Spuerkeess, Raiffeisen, ING)
// pour import dans leur web banking et validation groupée.
//
// Référence : ISO 20022 Payments — SEPA Credit Transfer Scheme
// Rulebook EPC.

export interface SepaDebtor {
  name: string;
  iban: string;
  bic?: string;
}

export interface SepaPayment {
  id: string; // identifiant unique interne (max 35 chars)
  end_to_end_id: string; // référence e2e envoyée au bénéficiaire (max 35 chars)
  amount: number; // EUR
  creditor_name: string;
  creditor_iban: string;
  creditor_bic?: string;
  remittance_info: string; // communication libre (max 140 chars)
}

export interface SepaBatchConfig {
  message_id: string; // ID unique du fichier (max 35 chars)
  execution_date: string; // YYYY-MM-DD
  debtor: SepaDebtor;
  payments: SepaPayment[];
  batch_booking?: boolean; // true = 1 écriture groupée sur relevé
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanIban(iban: string): string {
  return iban.replace(/\s/g, "").toUpperCase();
}

function validateIban(iban: string): boolean {
  const clean = cleanIban(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(clean)) return false;
  // Mod 97 check (IBAN validation ISO 13616)
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const d of numeric) {
    rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

function formatAmount(n: number): string {
  return n.toFixed(2);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Génère le XML pain.001.001.09 d'un lot de virements.
 */
export function buildPain001Xml(config: SepaBatchConfig): string {
  const creationDateTime = new Date().toISOString().slice(0, 19);
  const totalAmount = config.payments.reduce((s, p) => s + p.amount, 0);
  const nbTxs = config.payments.length;
  const batchBooking = config.batch_booking ?? false;
  const paymentInfoId = truncate(`${config.message_id}-PI1`, 35);

  const paymentLines = config.payments.map((p, idx) => {
    const bicLine = p.creditor_bic
      ? `          <CdtrAgt>
            <FinInstnId>
              <BICFI>${xmlEscape(p.creditor_bic)}</BICFI>
            </FinInstnId>
          </CdtrAgt>`
      : "";
    return `        <CdtTrfTxInf>
          <PmtId>
            <InstrId>${xmlEscape(truncate(p.id, 35))}</InstrId>
            <EndToEndId>${xmlEscape(truncate(p.end_to_end_id, 35))}</EndToEndId>
          </PmtId>
          <Amt>
            <InstdAmt Ccy="EUR">${formatAmount(p.amount)}</InstdAmt>
          </Amt>
${bicLine}
          <Cdtr>
            <Nm>${xmlEscape(truncate(p.creditor_name, 140))}</Nm>
          </Cdtr>
          <CdtrAcct>
            <Id>
              <IBAN>${xmlEscape(cleanIban(p.creditor_iban))}</IBAN>
            </Id>
          </CdtrAcct>
          <RmtInf>
            <Ustrd>${xmlEscape(truncate(p.remittance_info, 140))}</Ustrd>
          </RmtInf>
        </CdtTrfTxInf>`;
  }).join("\n");

  const debtorBic = config.debtor.bic
    ? `        <DbtrAgt>
          <FinInstnId>
            <BICFI>${xmlEscape(config.debtor.bic)}</BICFI>
          </FinInstnId>
        </DbtrAgt>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${xmlEscape(truncate(config.message_id, 35))}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${formatAmount(totalAmount)}</CtrlSum>
      <InitgPty>
        <Nm>${xmlEscape(truncate(config.debtor.name, 140))}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${xmlEscape(paymentInfoId)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>${batchBooking ? "true" : "false"}</BtchBookg>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${formatAmount(totalAmount)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>
        <Dt>${config.execution_date}</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>${xmlEscape(truncate(config.debtor.name, 140))}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${xmlEscape(cleanIban(config.debtor.iban))}</IBAN>
        </Id>
      </DbtrAcct>
${debtorBic}
      <ChrgBr>SLEV</ChrgBr>
${paymentLines}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

// ============================================================
// Validation pré-export
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
  paymentIndex?: number;
}

export function validateBatch(config: SepaBatchConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config.debtor.name.trim()) errors.push({ field: "debtor.name", message: "Nom donneur d'ordre requis" });
  if (!validateIban(config.debtor.iban)) errors.push({ field: "debtor.iban", message: "IBAN donneur invalide" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.execution_date)) {
    errors.push({ field: "execution_date", message: "Date d'exécution au format YYYY-MM-DD requise" });
  }
  if (config.payments.length === 0) errors.push({ field: "payments", message: "Aucun virement" });
  config.payments.forEach((p, i) => {
    if (!p.creditor_name.trim()) errors.push({ field: "creditor_name", message: "Nom bénéficiaire requis", paymentIndex: i });
    if (!validateIban(p.creditor_iban)) errors.push({ field: "creditor_iban", message: `IBAN invalide (ligne ${i + 1})`, paymentIndex: i });
    if (p.amount <= 0) errors.push({ field: "amount", message: `Montant invalide (ligne ${i + 1})`, paymentIndex: i });
    if (!p.remittance_info.trim()) errors.push({ field: "remittance_info", message: `Communication requise (ligne ${i + 1})`, paymentIndex: i });
  });
  return errors;
}

export function generateMessageId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[^\d]/g, "").slice(0, 14);
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TEVAXIA-${ts}-${rnd}`;
}

export function generateEndToEndId(prefix: string, index: number): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-8);
  return truncate(`${prefix}-${ts}-${String(index).padStart(3, "0")}`, 35);
}

export { validateIban, cleanIban };
