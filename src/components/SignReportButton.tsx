"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  hashReportPayload,
  signValuation,
  buildVerificationUrl,
} from "@/lib/valuation-signatures";
import { isSupabaseConfigured } from "@/lib/supabase";

interface Props {
  reportTitle: string;
  reportType?: string;
  payload: Record<string, unknown>;
  evaluatorName?: string;
  evaluatorQualif?: string;
  className?: string;
  onSigned?: (hash: string, url: string, date: string) => void;
}

export default function SignReportButton({
  reportTitle,
  reportType = "evs2025",
  payload,
  evaluatorName,
  evaluatorQualif,
  className = "",
  onSigned,
}: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "signing" | "signed" | "error">("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isSupabaseConfigured || !user) return null;

  async function handleSign() {
    setStatus("signing");
    setError(null);
    try {
      const h = await hashReportPayload(payload);
      await signValuation({
        hash: h,
        reportType,
        reportTitle,
        evaluatorName,
        evaluatorQualif,
        payloadSummary: {
          commune: payload.commune ?? null,
          surface: payload.surface ?? null,
          valeurRetenue: payload.valeurComparaison ?? payload.valeurCapitalisation ?? payload.valeurDCF ?? null,
        },
      });
      setHash(h);
      setStatus("signed");
      onSigned?.(h, buildVerificationUrl(h), new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de signature");
      setStatus("error");
    }
  }

  async function handleCopy() {
    if (!hash) return;
    const url = buildVerificationUrl(hash);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "signed" && hash) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2 ${className}`}>
        <span className="text-emerald-700">✓</span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-emerald-900">Rapport signé</span>
          <span className="text-[10px] font-mono text-emerald-700">{hash.slice(0, 16)}…</span>
        </div>
        <button
          onClick={handleCopy}
          className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
          title="Copier l'URL de vérification"
        >
          {copied ? "✓ Copié" : "Copier URL"}
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={handleSign}
        disabled={status === "signing"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-navy bg-white px-3 py-2 text-xs font-medium text-navy hover:bg-navy/5 disabled:opacity-50"
        title="Enregistre un hash SHA-256 du rapport dans la base, avec horodatage. URL de vérification publique."
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        {status === "signing" ? "Signature…" : "Signer le rapport"}
      </button>
      {error && <span className="text-[10px] text-rose-700">{error}</span>}
    </div>
  );
}
