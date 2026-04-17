"use client";

import { useState } from "react";
import Link from "next/link";

interface BankMovement {
  date: string;
  label: string;
  amount: number;
  reference: string;
  matched?: boolean;
  matchedPaymentId?: string;
}

// Parser CAMT.053 XML simplifié (format bancaire EU standard)
function parseCamt053(xml: string): BankMovement[] {
  const movements: BankMovement[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const entries = doc.getElementsByTagName("Ntry");
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const amt = parseFloat(e.getElementsByTagName("Amt")[0]?.textContent ?? "0");
      const cdtDbtInd = e.getElementsByTagName("CdtDbtInd")[0]?.textContent;
      const date = e.getElementsByTagName("BookgDt")[0]?.getElementsByTagName("Dt")[0]?.textContent ?? "";
      const label = e.getElementsByTagName("AddtlNtryInf")[0]?.textContent
        ?? e.getElementsByTagName("RmtInf")[0]?.textContent ?? "Mouvement bancaire";
      const reference = e.getElementsByTagName("AcctSvcrRef")[0]?.textContent ?? "";
      movements.push({
        date,
        label: label.trim().slice(0, 100),
        amount: cdtDbtInd === "CRDT" ? amt : -amt,
        reference,
      });
    }
  } catch (err) {
    console.error("Parse CAMT.053 error:", err);
  }
  return movements;
}

// Parser CSV simple (format bancaire LU typique)
function parseCsvBankExport(csv: string): BankMovement[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(/[,;]/);
  const dateIdx = header.findIndex((h) => h.includes("date"));
  const labelIdx = header.findIndex((h) => h.includes("libell") || h.includes("descript") || h.includes("communication"));
  const amountIdx = header.findIndex((h) => h.includes("montant") || h.includes("amount"));
  const refIdx = header.findIndex((h) => h.includes("ref"));

  const movements: BankMovement[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(/[,;]/);
    if (fields.length < 3) continue;
    movements.push({
      date: fields[dateIdx]?.trim() ?? "",
      label: fields[labelIdx]?.trim() ?? "",
      amount: parseFloat(fields[amountIdx]?.replace(",", ".") ?? "0"),
      reference: fields[refIdx]?.trim() ?? "",
    });
  }
  return movements;
}

export default function ReconciliationPage() {
  const [movements, setMovements] = useState<BankMovement[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    if (file.name.endsWith(".xml") || text.trimStart().startsWith("<?xml")) {
      setMovements(parseCamt053(text));
    } else {
      setMovements(parseCsvBankExport(text));
    }
  };

  const totalCredits = movements.filter((m) => m.amount > 0).reduce((s, m) => s + m.amount, 0);
  const totalDebits = movements.filter((m) => m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">&larr; Gestion locative</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Réconciliation bancaire</h1>
          <p className="mt-2 text-muted">
            Importez votre relevé bancaire (CAMT.053 XML standard EU ou CSV export Spuerkeess/BGL/BIL/ING) pour détecter
            automatiquement les loyers reçus et les marquer comme payés.
          </p>
        </div>

        <div className="rounded-xl border-2 border-dashed border-card-border bg-card p-8 text-center">
          <input type="file" accept=".xml,.csv,.txt" onChange={handleFile}
            className="hidden" id="bank-file" />
          <label htmlFor="bank-file" className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy-light">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Importer relevé bancaire
          </label>
          {fileName && <p className="mt-2 text-xs text-muted">{fileName} · {movements.length} mouvements détectés</p>}
          <p className="mt-3 text-xs text-muted">Formats acceptés : CAMT.053 XML (standard EU), CSV (Spuerkeess, BGL, BIL, ING Luxembourg)</p>
        </div>

        {movements.length > 0 && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted">Crédits</div>
                <div className="mt-1 text-xl font-bold text-emerald-700">+{totalCredits.toLocaleString("fr-LU", { minimumFractionDigits: 2 })} €</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted">Débits</div>
                <div className="mt-1 text-xl font-bold text-rose-700">-{totalDebits.toLocaleString("fr-LU", { minimumFractionDigits: 2 })} €</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted">Mouvements</div>
                <div className="mt-1 text-xl font-bold text-navy">{movements.length}</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate">Libellé</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate">Montant</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate">Réf.</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={i} className="border-b border-card-border/50">
                      <td className="px-4 py-2 font-mono text-xs">{m.date}</td>
                      <td className="px-4 py-2 text-xs truncate max-w-[300px]">{m.label}</td>
                      <td className={`px-4 py-2 text-right font-mono font-semibold ${m.amount > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {m.amount > 0 ? "+" : ""}{m.amount.toFixed(2)} €
                      </td>
                      <td className="px-4 py-2 text-xs text-muted font-mono">{m.reference || "—"}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px]">Manuel</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Connexion bancaire automatique (PSD2) :</strong> évitez l&apos;import manuel via{" "}
          <Link href="/gestion-locative/reconciliation/psd2" className="font-semibold underline hover:text-blue-700">
            GoCardless Bank Account Data
          </Link>
          {" "}(gratuit &lt; 100 requisitions/jour). SCA conforme PSD2. Support Spuerkeess, BGL, BIL, ING LU, Raiffeisen, Post.
        </div>
      </div>
    </div>
  );
}
