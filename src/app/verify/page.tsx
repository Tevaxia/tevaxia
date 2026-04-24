"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { verifySignature, type VerificationResult } from "@/lib/valuation-signatures";
import { isSupabaseConfigured } from "@/lib/supabase";
import { errMsg } from "@/lib/errors";

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyLoading() {
  const t = useTranslations("verify");
  return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted">{t("loading")}</div>;
}

function VerifyContent() {
  const params = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("verify");
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const queryHash = params?.get("hash") ?? "";

  const [hash, setHash] = useState(queryHash);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryHash) {
      void doVerify(queryHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryHash]);

  async function doVerify(h: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(h)) {
      setError(t("errHashInvalid"));
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await verifySignature(h);
      setResult(r);
    } catch (e) {
      setError(errMsg(e, t("errVerification")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-xs text-muted hover:text-navy">{t("backHome")}</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t("noService")}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <label className="block text-xs font-semibold text-slate mb-2">{t("hashLabel")}</label>
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value.trim())}
          placeholder={t("hashPlaceholder")}
          className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-mono"
        />
        <button
          onClick={() => doVerify(hash)}
          disabled={loading || hash.length !== 64}
          className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
        >
          {loading ? t("verifying") : t("verifyBtn")}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          {!result.found ? (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✗</span>
                <h2 className="text-lg font-bold text-rose-900">{t("unknownTitle")}</h2>
              </div>
              <p className="mt-2 text-sm text-rose-800">{t("unknownDesc")}</p>
            </div>
          ) : result.revoked ? (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠</span>
                <h2 className="text-lg font-bold text-amber-900">{t("revokedTitle")}</h2>
              </div>
              <p className="mt-2 text-sm text-amber-900">
                {t("revokedDesc", { date: result.revoked_at ? new Date(result.revoked_at).toLocaleString(dateLocale) : "—" })}
              </p>
              {result.revocation_reason && (
                <p className="mt-2 text-xs text-amber-800">{t("revokedReason", { reason: result.revocation_reason })}</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <h2 className="text-lg font-bold text-emerald-900">{t("authenticTitle")}</h2>
              </div>
              <p className="mt-2 text-sm text-emerald-800">{t("authenticDesc")}</p>
              <dl className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">{t("dtSignedAt")}</dt>
                  <dd className="font-mono">{result.signed_at ? new Date(result.signed_at).toLocaleString(dateLocale) : "—"}</dd>
                </div>
                {result.report_title && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t("dtTitle")}</dt>
                    <dd className="font-semibold">{result.report_title}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">{t("dtType")}</dt>
                  <dd className="font-mono">{result.report_type ?? "—"}</dd>
                </div>
                {result.evaluator_name && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t("dtEvaluator")}</dt>
                    <dd className="font-semibold">
                      {result.evaluator_name}
                      {result.evaluator_qualif && <span className="ml-1 text-muted">({result.evaluator_qualif})</span>}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("limitsStrong")}</strong> {t("limitsBody")}
      </div>
    </div>
  );
}
