"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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
  const locale = useLocale();
  const t = useTranslations("signer");
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";

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
        setError(t("errExpired"));
      } else if (!res.ok) {
        setError(t("errNotFound"));
      } else {
        setRequest(await res.json());
      }
    } catch {
      setError(t("errLoad"));
    }
    setLoading(false);
  }, [token, t]);

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
        setError(err.error ?? t("errSignGeneric"));
      } else {
        setDone("signed");
      }
    } catch {
      setError(t("errNetwork"));
    }
    setSubmitting(false);
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) { setError(t("errDeclineReasonRequired")); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/signatures/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", declined_reason: declineReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? t("errGeneric"));
      } else {
        setDone("declined");
      }
    } catch {
      setError(t("errNetwork"));
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">
        {t("loading")}
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
            {t("errContactSender")}
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-navy underline">
            {t("backSite")}
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
            {t("eidasKicker")}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-navy">
            {t("docToSign", { type: DOCUMENT_TYPE_LABELS[request.document_type] })}
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
            {t("expiresOn", { date: new Date(request.expires_at).toLocaleDateString(dateLocale) })}
          </div>
        </div>
      </div>

      {/* Flash confirmation */}
      {done === "signed" && (
        <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <h2 className="text-xl font-bold text-emerald-900">{t("signedTitle")}</h2>
          <p className="mt-2 text-sm text-emerald-800">
            {t("signedBody")}
          </p>
          <p className="mt-3 text-[11px] text-emerald-700">
            {t("signedOn", { date: new Date().toLocaleString(dateLocale) })}
          </p>
        </div>
      )}

      {done === "declined" && (
        <div className="mt-6 rounded-xl border-2 border-rose-300 bg-rose-50 p-6 text-center">
          <h2 className="text-xl font-bold text-rose-900">{t("declinedTitle")}</h2>
          <p className="mt-2 text-sm text-rose-800">
            {t("declinedBody")}
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
          <strong>{t("hashLabel")}</strong>
          <div className="mt-1 font-mono text-[10px] break-all">{request.document_hash}</div>
          <div className="mt-2">
            {t("hashExplain")}
          </div>
        </div>
      </div>

      {alreadyProcessed && !done && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t("alreadyProcessed", { status: STATUS_LABELS[request.status] })}
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
                  {submitting ? t("signing") : t("signBtn")}
                </button>
                <button onClick={() => setShowDecline(true)}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                  {t("declineBtn")}
                </button>
              </div>
            </div>
          )}

          {/* Decline form */}
          {showDecline && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
              <h3 className="text-sm font-bold text-rose-900 mb-2">{t("declineTitle")}</h3>
              <label className="block">
                <div className="text-xs text-rose-800 mb-1">{t("declineReasonLabel")}</div>
                <textarea value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm" />
              </label>
              <div className="mt-3 flex gap-2">
                <button onClick={handleDecline} disabled={!declineReason.trim() || submitting}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                  {t("confirmDeclineBtn")}
                </button>
                <button onClick={() => setShowDecline(false)}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm text-rose-700">
                  {t("cancelBtn")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 rounded-xl border border-card-border bg-background/40 p-4 text-[11px] text-muted">
        <div className="font-semibold text-navy mb-1">{t("aboutTitle")}</div>
        {t("aboutBody")}
      </div>

      <div className="mt-6 text-center text-[10px] text-muted">
        {t("platformLabel")} · <Link href="/confidentialite" className="underline">{t("linkPrivacy")}</Link> ·{" "}
        <Link href="/mentions-legales" className="underline">{t("linkLegal")}</Link>
      </div>
    </div>
  );
}
