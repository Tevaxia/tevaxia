"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

// Utilise le MFA natif de Supabase Auth :
// https://supabase.com/docs/guides/auth/auth-mfa
// Pré-requis : activer l'option MFA dans le dashboard Supabase
// (Authentication → Providers → MFA → TOTP enabled).

interface Factor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
  created_at: string;
}

export default function TwoFactorSection() {
  const t = useTranslations("profil.mfa");
  const { user } = useAuth();

  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refreshFactors = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      setFactors((data?.totp ?? []) as Factor[]);
    } catch (e) {
      console.warn("listFactors failed:", e);
    }
  };

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    refreshFactors().finally(() => setLoading(false));
  }, [user]);

  const startEnroll = async () => {
    if (!supabase) return;
    setEnrolling(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: friendlyName || `tevaxia-${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrUrl(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enroll failed");
      setEnrolling(false);
    }
  };

  const verifyEnroll = async () => {
    if (!supabase || !factorId) return;
    setError(null);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;
      setEnrolling(false);
      setFactorId(null);
      setQrUrl(null);
      setSecret(null);
      setCode("");
      setFriendlyName("");
      await refreshFactors();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    }
  };

  const unenroll = async (id: string) => {
    if (!supabase) return;
    if (!confirm(t("unenrollConfirm"))) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      await refreshFactors();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unenroll failed");
    }
  };

  if (!user || !supabase) return null;

  const active = factors.filter((f) => f.status === "verified");

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-navy">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("desc")}</p>
        </div>
        {active.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("enabled")}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : (
        <>
          {/* Facteurs actifs */}
          {active.length > 0 && (
            <div className="mt-4 space-y-2">
              {active.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-card-border bg-background p-3">
                  <div>
                    <div className="text-sm font-medium text-navy">{f.friendly_name || t("unnamedFactor")}</div>
                    <div className="text-xs text-muted">
                      {t("addedOn")} {new Date(f.created_at).toLocaleDateString("fr-LU")}
                    </div>
                  </div>
                  <button
                    onClick={() => unenroll(f.id)}
                    className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    {t("unenroll")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Enrollment */}
          {!enrolling ? (
            active.length === 0 && (
              <button
                onClick={() => setEnrolling(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {t("enable")}
              </button>
            )
          ) : !qrUrl ? (
            <div className="mt-4 rounded-lg border border-navy/20 bg-navy/5 p-4">
              <p className="text-sm font-medium text-navy">{t("enrollStep1Title")}</p>
              <p className="mt-1 text-xs text-muted">{t("enrollStep1Desc")}</p>
              <input
                type="text"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                placeholder={t("friendlyNamePlaceholder")}
                className="mt-3 w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
              />
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEnrolling(false)} className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  {t("cancel")}
                </button>
                <button onClick={startEnroll} className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy-light">
                  {t("continue")}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-navy/20 bg-navy/5 p-4">
              <p className="text-sm font-medium text-navy">{t("enrollStep2Title")}</p>
              <p className="mt-1 text-xs text-muted">{t("enrollStep2Desc")}</p>
              <div className="mt-3 flex flex-col items-center sm:flex-row sm:items-start sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="MFA QR" className="h-40 w-40 rounded-lg border border-card-border bg-white p-2" />
                <div className="mt-3 sm:mt-0 flex-1">
                  <p className="text-xs text-muted">{t("secretFallback")}</p>
                  <code className="mt-1 block break-all rounded bg-white border border-card-border p-2 text-xs font-mono">{secret}</code>
                </div>
              </div>

              <label className="mt-4 block text-xs font-medium text-slate-700">{t("codeLabel")}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="mt-1 w-40 rounded-lg border border-input-border bg-white px-3 py-2 text-center font-mono text-lg tracking-widest"
              />

              {error && <p className="mt-3 text-xs text-rose-700">{error}</p>}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setEnrolling(false); setQrUrl(null); setFactorId(null); setSecret(null); setCode(""); setError(null); }}
                  className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={verifyEnroll}
                  disabled={code.length !== 6}
                  className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-40"
                >
                  {t("verify")}
                </button>
              </div>
            </div>
          )}

          {error && !enrolling && <p className="mt-3 text-xs text-rose-700">{error}</p>}
        </>
      )}
    </div>
  );
}
