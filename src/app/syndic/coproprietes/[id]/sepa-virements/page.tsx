"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import {
  buildPain001Xml, validateBatch, validateIban,
  generateMessageId, generateEndToEndId,
  type SepaPayment,
} from "@/lib/sepa-pain001";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function SepaVirementsPage() {
  const params = useParams();
  const coownershipId = String(params?.id ?? "");
  const { user, loading: authLoading } = useAuth();
  const [coown, setCoown] = useState<Coownership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [debtor, setDebtor] = useState({
    name: "",
    iban: "",
    bic: "",
  });
  const [executionDate, setExecutionDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
  );
  const [payments, setPayments] = useState<Array<{
    id: string;
    creditor_name: string;
    creditor_iban: string;
    creditor_bic: string;
    amount: string;
    remittance_info: string;
  }>>([{
    id: crypto.randomUUID().slice(0, 8),
    creditor_name: "", creditor_iban: "", creditor_bic: "",
    amount: "", remittance_info: "",
  }]);

  const reload = useCallback(async () => {
    if (!coownershipId) return;
    setLoading(true);
    try {
      const c = await getCoownership(coownershipId);
      setCoown(c);
      if (c) {
        setDebtor((d) => ({ ...d, name: c.name }));
      }
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [coownershipId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const addPayment = () => {
    setPayments([...payments, {
      id: crypto.randomUUID().slice(0, 8),
      creditor_name: "", creditor_iban: "", creditor_bic: "",
      amount: "", remittance_info: "",
    }]);
  };

  const removePayment = (idx: number) => {
    setPayments(payments.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, field: string, value: string) => {
    setPayments(payments.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const total = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const generateXml = () => {
    const msgId = generateMessageId();
    const sepaPayments: SepaPayment[] = payments
      .filter((p) => p.creditor_name.trim() && p.creditor_iban.trim() && Number(p.amount) > 0)
      .map((p, i) => ({
        id: `P${String(i + 1).padStart(3, "0")}`,
        end_to_end_id: generateEndToEndId("COPRO", i + 1),
        amount: Number(p.amount),
        creditor_name: p.creditor_name,
        creditor_iban: p.creditor_iban,
        creditor_bic: p.creditor_bic || undefined,
        remittance_info: p.remittance_info,
      }));

    const errors = validateBatch({
      message_id: msgId,
      execution_date: executionDate,
      debtor: {
        name: debtor.name,
        iban: debtor.iban,
        bic: debtor.bic || undefined,
      },
      payments: sepaPayments,
    });

    if (errors.length > 0) {
      setError(errors.map((e) => (e.paymentIndex != null ? `L${e.paymentIndex + 1} ` : "") + e.message).join(" · "));
      return;
    }

    const xml = buildPain001Xml({
      message_id: msgId,
      execution_date: executionDate,
      debtor: { name: debtor.name, iban: debtor.iban, bic: debtor.bic || undefined },
      payments: sepaPayments,
      batch_booking: false,
    });

    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `virements-sepa-${new Date().toISOString().slice(0, 10)}.xml`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !coown) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  const debtorIbanValid = !debtor.iban || validateIban(debtor.iban);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">Virements SEPA — fournisseurs</h1>
      <p className="mt-1 text-sm text-muted">
        Générez un fichier XML pain.001.001.09 (SEPA Credit Transfer) importable
        dans votre web banking LU (BCEE, BIL, BGL, Spuerkeess, Raiffeisen, ING)
        pour exécuter N virements fournisseurs en lot en une validation.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Donneur d'ordre */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
          Donneur d&apos;ordre (syndicat)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs">
            <div className="mb-1 font-semibold text-slate">Nom *</div>
            <input type="text" value={debtor.name}
              onChange={(e) => setDebtor({ ...debtor, name: e.target.value })}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">
            <div className="mb-1 font-semibold text-slate">IBAN *</div>
            <input type="text" value={debtor.iban}
              onChange={(e) => setDebtor({ ...debtor, iban: e.target.value })}
              placeholder="LU28 0019 ..."
              className={`w-full rounded-lg border bg-input-bg px-3 py-2 text-sm font-mono ${
                debtorIbanValid ? "border-input-border" : "border-rose-400 bg-rose-50"
              }`} />
          </label>
          <label className="text-xs">
            <div className="mb-1 font-semibold text-slate">BIC (optionnel)</div>
            <input type="text" value={debtor.bic}
              onChange={(e) => setDebtor({ ...debtor, bic: e.target.value.toUpperCase() })}
              placeholder="BCEELULL"
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono" />
          </label>
        </div>
        <div className="mt-3">
          <label className="text-xs">
            <div className="mb-1 font-semibold text-slate">Date d&apos;exécution souhaitée</div>
            <input type="date" value={executionDate}
              onChange={(e) => setExecutionDate(e.target.value)}
              className="w-48 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
        </div>
      </section>

      {/* Paiements */}
      <section className="mt-4 rounded-xl border border-card-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
            Virements fournisseurs ({payments.length})
          </h2>
          <button onClick={addPayment}
            className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
            + Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {payments.map((p, idx) => {
            const ibanValid = !p.creditor_iban || validateIban(p.creditor_iban);
            return (
              <div key={p.id} className="rounded-lg border border-card-border/50 bg-background/40 p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                    Ligne {idx + 1}
                  </div>
                  {payments.length > 1 && (
                    <button onClick={() => removePayment(idx)}
                      className="text-xs text-rose-700 hover:underline">
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <label className="text-xs">
                    <div className="mb-1 text-muted">Bénéficiaire *</div>
                    <input type="text" value={p.creditor_name}
                      onChange={(e) => updatePayment(idx, "creditor_name", e.target.value)}
                      placeholder="SARL Ascenseurs Kone"
                      className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
                  </label>
                  <label className="text-xs">
                    <div className="mb-1 text-muted">IBAN *</div>
                    <input type="text" value={p.creditor_iban}
                      onChange={(e) => updatePayment(idx, "creditor_iban", e.target.value)}
                      placeholder="LU..."
                      className={`w-full rounded border bg-input-bg px-2 py-1 text-xs font-mono ${
                        ibanValid ? "border-input-border" : "border-rose-400 bg-rose-50"
                      }`} />
                  </label>
                  <label className="text-xs">
                    <div className="mb-1 text-muted">BIC (optionnel)</div>
                    <input type="text" value={p.creditor_bic}
                      onChange={(e) => updatePayment(idx, "creditor_bic", e.target.value.toUpperCase())}
                      className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs font-mono" />
                  </label>
                  <label className="text-xs">
                    <div className="mb-1 text-muted">Montant (€) *</div>
                    <input type="number" step="0.01" value={p.amount}
                      onChange={(e) => updatePayment(idx, "amount", e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs font-mono text-right" />
                  </label>
                  <label className="text-xs sm:col-span-4">
                    <div className="mb-1 text-muted">Communication *</div>
                    <input type="text" value={p.remittance_info}
                      onChange={(e) => updatePayment(idx, "remittance_info", e.target.value)}
                      placeholder="Facture 2026-0234 entretien ascenseur mai"
                      className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-navy/5 p-3">
          <span className="text-sm font-semibold text-navy">Total à virer</span>
          <span className="text-xl font-bold text-navy">{formatEUR(total)}</span>
        </div>
      </section>

      <div className="mt-5 flex justify-end gap-2">
        <Link href={`/syndic/coproprietes/${coownershipId}`}
          className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-slate">
          Annuler
        </Link>
        <button onClick={generateXml}
          disabled={!debtor.name.trim() || !debtorIbanValid || total <= 0}
          className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          ↓ Générer fichier SEPA XML
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Utilisation :</strong> téléchargez le XML, importez-le dans votre web
        banking (BCEE : Virements → Import fichiers SEPA · BIL : Import SCT · Spuerkeess :
        SEPA Bulk Upload) puis validez avec votre LuxTrust / Token. Les banques appliqueront
        les virements à la date d&apos;exécution souhaitée si fonds disponibles.
        Format ISO 20022 pain.001.001.09 accepté par toutes les banques SEPA (UE + EEE).
      </div>
    </div>
  );
}
