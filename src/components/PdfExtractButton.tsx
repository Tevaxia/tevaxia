"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface PdfExtractButtonProps {
  schema: "bilan_promoteur" | "plus_values" | "dpe";
  onExtracted: (data: Record<string, unknown>) => void;
  label?: string;
  accept?: string;
  className?: string;
}

const MAX_MB = 8;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function PdfExtractButton({
  schema,
  onExtracted,
  label = "Pré-remplir depuis PDF (IA)",
  accept = ".pdf,image/png,image/jpeg",
  className = "",
}: PdfExtractButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_MB} MB)`);
      e.target.value = "";
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");

      let token: string | null = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
      }
      if (!token) {
        setError("Session expirée, reconnectez-vous.");
        return;
      }

      const res = await fetch("/api/v1/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ schema, fileBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      onExtracted(data.data as Record<string, unknown>);
      setSuccess(`Données extraites via ${data.provider} (${data.model}). Vérifiez les champs pré-remplis.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40"
      >
        <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
          {loading ? (
            <>
              <circle className="opacity-25" cx="12" cy="12" r="10" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          )}
        </svg>
        {loading ? "Extraction..." : label}
      </button>
      {error && <div className="mt-1 text-[10px] text-rose-700">{error}</div>}
      {success && <div className="mt-1 text-[10px] text-emerald-700">{success}</div>}
      <div className="mt-1 text-[10px] text-muted">PDF : clé Anthropic BYOK · Image : OpenAI ou Anthropic BYOK</div>
    </div>
  );
}
