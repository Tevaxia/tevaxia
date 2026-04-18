"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { DEFAULT_CONSENT_TEXT, STATUS_LABELS, STATUS_COLORS, DOCUMENT_TYPE_LABELS } from "@/lib/agency-signatures";
import type { SignatureStatus, SignatureDocumentType } from "@/lib/agency-signatures";

interface PublicRequest {
  id: string;
  document_type: SignatureDocumentType;
  document_title: string;
  document_body: string;
  document_hash: string;
  signer_name: string;
  signer_email: string;
  status: SignatureStatus;
  expires_at: string;
  signed_at: string | null;
  mandate_id: string | null;
}

export default function SignerPage(props: { params: Promise<{ token: string }> }) {
  const { token } = use(props.params);
  const [request, setRequest] = useState<PublicRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"signed" | "declined" | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/signatures/${token}`);
      if (res.status === 410) {
        setError("Ce lien de signature a expiré.");
      } else if (!res.ok) {
        setError("Demande introuvable ou lien invalide.");
      } else {
        setRequest(await res.json());
      }
    } catch {
      setError("Erreur de chargement.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { void reload(); }, [reload]);

  const handleSign = async () => {
    if (!consentAccepted) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/signatures/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign",
          consent_text: DEFAULT_CONSENT_TEXT,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Erreur signature");
      } else {
        setDone("signed");
      }
    } catch {
      setError("Erreur réseau.");
    }
    setSubmitting(false);
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) { setError("Motif de refus requis."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/signatures/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", declined_reason: declineReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Erreur");
      } else {
        setDone("declined");
      }
    } catch {
      setError("Erreur réseau.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">
        Chargement du document à signer…
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8">
          <div className="text-4xl mb-2">⚠️</div>
          <h1 className="text-xl font-bold text-rose-900">{error}</h1>
          <p className="mt-3 text-sm text-rose-700">
            Contactez l&apos;émetteur du document pour obtenir un nouveau lien.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-navy underline">
            Retour au site tevaxia.lu
          </Link>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const alreadyProcessed = ["signed", "declined", "expired", "cancelled"].includes(request.status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-card-border pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Signature électronique eIDAS
          </div>
          <h1 className="mt-1 text-2xl font-bold text-navy">
            {DOCUMENT_TYPE_LABELS[request.document_type]} à signer
          </h1>
          <p className="mt-1 text-sm text-muted">
            {request.signer_name} · {request.signer_email}
          </p>
        </div>
        <div className="text-right">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[request.status]}`}>
            {STATUS_LABELS[request.status]}
          </span>
          <div className="mt-2 text-[10px] text-muted">
            Expire le {new Date(request.expires_at).toLocaleDateString("fr-LU")}
          </div>
        </div>
      </div>

      {/* Flash confirmation */}
      {done === "signed" && (
        <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <h2 className="text-xl font-bold text-emerald-900">Document signé électroniquement</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Votre signature a été enregistrée avec horodatage. L&apos;émetteur du document a été notifié.
          </p>
          <p className="mt-3 text-[11px] text-emerald-700">
            Signé le {new Date().toLocaleString("fr-LU")}
          </p>
        </div>
      )}

      {done === "declined" && (
        <div className="mt-6 rounded-xl border-2 border-rose-300 bg-rose-50 p-6 text-center">
          <h2 className="text-xl font-bold text-rose-900">Refus enregistré</h2>
          <p className="mt-2 text-sm text-rose-800">
            Votre refus a été transmis à l&apos;émetteur du document.
          </p>
        </div>
      )}

      {/* Document */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-6">
        <h2 className="text-lg font-bold text-navy mb-4">{request.document_title}</h2>
        <div className="max-h-[500px] overflow-y-auto rounded-lg border border-card-border/50 bg-background p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate leading-relaxed">
            {request.document_body}
          </pre>
        </div>
        <div className="mt-4 rounded-lg bg-background/60 p-3 text-[11px] text-muted">
          <strong>Hash SHA-256 du document :</strong>
          <div className="mt-1 font-mono text-[10px] break-all">{request.document_hash}</div>
          <div className="mt-2">
            Toute modification du document invalide ce hash et donc la signature. Cette empreinte
            cryptographique garantit l&apos;intégrité du texte que vous signez.
          </div>
        </div>
      </div>

      {alreadyProcessed && !done && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Cette demande a déjà été traitée (statut : {STATUS_LABELS[request.status]}).
          Aucune action supplémentaire n&apos;est possible.
        </div>
      )}

      {!alreadyProcessed && !done && (
        <>
          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>
          )}

          {/* Consent box */}
          {!showDecline && (
            <div className="mt-6 rounded-xl border-2 border-navy/20 bg-navy/5 p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1" />
                <div className="text-sm text-slate">
                  <pre className="whitespace-pre-wrap font-sans">{DEFAULT_CONSENT_TEXT}</pre>
                </div>
              </label>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={handleSign} disabled={!consentAccepted || submitting}
                  className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40">
                  {submitting ? "Signature en cours…" : "✍️ Signer électroniquement"}
                </button>
                <button onClick={() => setShowDecline(true)}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                  Refuser de signer
                </button>
              </div>
            </div>
          )}

          {/* Decline form */}
          {showDecline && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
              <h3 className="text-sm font-bold text-rose-900 mb-2">Refus de signature</h3>
              <label className="block">
                <div className="text-xs text-rose-800 mb-1">Motif du refus (obligatoire)</div>
                <textarea value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm" />
              </label>
              <div className="mt-3 flex gap-2">
                <button onClick={handleDecline} disabled={!declineReason.trim() || submitting}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                  Confirmer le refus
                </button>
                <button onClick={() => setShowDecline(false)}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm text-rose-700">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 rounded-xl border border-card-border bg-background/40 p-4 text-[11px] text-muted">
        <div className="font-semibold text-navy mb-1">À propos de la signature électronique</div>
        Cette signature est conforme au règlement européen eIDAS (UE 910/2014) — niveau
        &laquo;&nbsp;signature électronique simple&nbsp;&raquo;, valable pour les contrats commerciaux.
        Elle enregistre votre adresse IP, votre navigateur et l&apos;horodatage comme preuve.
        Pour les actes notariés ou compromis de vente, une signature qualifiée (LuxTrust) reste
        obligatoire.
      </div>

      <div className="mt-6 text-center text-[10px] text-muted">
        Plateforme tevaxia.lu — <Link href="/confidentialite" className="underline">Confidentialité</Link> ·{" "}
        <Link href="/mentions-legales" className="underline">Mentions légales</Link>
      </div>
    </div>
  );
}
