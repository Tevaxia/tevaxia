"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifySignature, type VerificationResult } from "@/lib/valuation-signatures";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted">Chargement…</div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const params = useSearchParams();
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
      setError("Hash invalide : doit être un SHA-256 hexadécimal (64 caractères).");
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await verifySignature(h);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de vérification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Vérification d&apos;un rapport signé</h1>
      <p className="mt-1 text-sm text-muted">
        Vérifiez l&apos;authenticité d&apos;un rapport de valorisation signé via tevaxia.lu.
        Saisissez le hash SHA-256 imprimé sur le rapport pour confirmer qu&apos;il n&apos;a pas été
        altéré depuis la signature par l&apos;évaluateur.
      </p>

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Service de vérification non configuré sur cet environnement.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <label className="block text-xs font-semibold text-slate mb-2">Hash SHA-256 du rapport</label>
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value.trim())}
          placeholder="ex. 3a2b...ff (64 caractères hexadécimaux)"
          className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-mono"
        />
        <button
          onClick={() => doVerify(hash)}
          disabled={loading || hash.length !== 64}
          className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
        >
          {loading ? "Vérification…" : "Vérifier"}
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
                <h2 className="text-lg font-bold text-rose-900">Hash inconnu</h2>
              </div>
              <p className="mt-2 text-sm text-rose-800">
                Ce hash ne correspond à aucun rapport signé via tevaxia.lu. Le document a peut-être été
                modifié depuis la signature, ou il n&apos;a jamais été signé.
              </p>
            </div>
          ) : result.revoked ? (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠</span>
                <h2 className="text-lg font-bold text-amber-900">Signature révoquée</h2>
              </div>
              <p className="mt-2 text-sm text-amber-900">
                Cette signature a été révoquée le{" "}
                <strong>{result.revoked_at ? new Date(result.revoked_at).toLocaleString("fr-LU") : "—"}</strong>.
                Le rapport n&apos;est plus considéré comme valide.
              </p>
              {result.revocation_reason && (
                <p className="mt-2 text-xs text-amber-800">Raison : {result.revocation_reason}</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <h2 className="text-lg font-bold text-emerald-900">Rapport authentique</h2>
              </div>
              <p className="mt-2 text-sm text-emerald-800">
                Ce hash correspond à un rapport signé via tevaxia.lu. Les données n&apos;ont pas été
                modifiées depuis la signature.
              </p>
              <dl className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">Signé le</dt>
                  <dd className="font-mono">{result.signed_at ? new Date(result.signed_at).toLocaleString("fr-LU") : "—"}</dd>
                </div>
                {result.report_title && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Titre</dt>
                    <dd className="font-semibold">{result.report_title}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Type</dt>
                  <dd className="font-mono">{result.report_type ?? "—"}</dd>
                </div>
                {result.evaluator_name && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Évaluateur</dt>
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
        <strong>Limites du service :</strong> ce mécanisme offre une piste d&apos;audit horodatée mais
        n&apos;a pas la valeur d&apos;une signature électronique qualifiée eIDAS (LuxTrust, QTSP).
        Pour une opposabilité juridique renforcée, utilisez un QTSP agréé. Le hash prouve uniquement
        que les données n&apos;ont pas été modifiées depuis le moment de la signature enregistrée ici.
      </div>
    </div>
  );
}
