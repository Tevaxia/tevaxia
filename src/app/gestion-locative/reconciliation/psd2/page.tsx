"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { errMsg } from "@/lib/errors";

interface Institution { id: string; name: string; country: string; logo: string; bic: string }
interface AccountData { uid: string; account_id?: { iban?: string }; name?: string; currency?: string }
interface BankMovement { date: string; label: string; amount: number; reference: string }

type Step = "loading" | "configure" | "select-bank" | "authenticate" | "done";

export default function Psd2Page() {
  const { user } = useAuth();
  const t = useTranslations("glPsd2");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [country, setCountry] = useState("LU");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [accountsData, setAccountsData] = useState<AccountData[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [movements, setMovements] = useState<BankMovement[]>([]);

  const authFetch = async (input: string, init?: RequestInit) => {
    if (!supabase) throw new Error(t("errSupabase"));
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error(t("errSignIn"));
    return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && user) {
      setStep("loading");
      (async () => {
        try {
          const res = await authFetch(`/api/psd2/requisition?code=${encodeURIComponent(code)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? t("errExchange"));
          setSessionId(data.id);
          setAccounts(data.accounts ?? []);
          setAccountsData(data.accountsData ?? []);
          setStep("done");
          window.history.replaceState({}, "", window.location.pathname);
        } catch (e) {
          setError(errMsg(e, String(e)));
          setStep("select-bank");
        }
      })();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasCode = new URLSearchParams(window.location.search).has("code");
    if (hasCode) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/psd2/institutions?country=${country}`);
        if (res.status === 501) { setConfigured(false); setStep("configure"); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        setConfigured(true);
        setInstitutions(data.institutions ?? []);
        setStep("select-bank");
      } catch (e) {
        setConfigured(true);
        setError(errMsg(e, String(e)));
        setStep("select-bank");
      } finally { setLoading(false); }
    })();
  }, [country]);

  const connect = async (inst: Institution) => {
    if (!user) { setError(t("errSignIn")); return; }
    setLoading(true);
    setError(null);
    try {
      const redirect = `${window.location.origin}/gestion-locative/reconciliation/psd2`;
      const res = await authFetch("/api/psd2/requisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId: inst.id, country: inst.country, redirect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errGeneric"));
      window.location.href = data.link;
    } catch (e) {
      setError(errMsg(e, String(e)));
      setLoading(false);
    }
  };

  const loadAccount = async (accId: string) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/psd2/transactions?accountId=${accId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errGeneric"));
      setMovements(data.movements ?? []);
    } catch (e) {
      setError(errMsg(e, String(e)));
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/gestion-locative/reconciliation" className="text-xs text-muted hover:text-navy">{t("backRec")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        {configured === false && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <strong>{t("configStrong")}</strong>
            <p className="mt-2">{t("configBody")}</p>
            <ol className="mt-2 ml-5 list-decimal space-y-1 text-xs">
              <li>{t("configStep1")}</li>
              <li>{t("configStep2")}
                <code className="ml-2 block mt-1 p-2 bg-white rounded text-[11px] font-mono whitespace-pre-wrap">
                  ENABLE_BANKING_APP_ID=&lt;app id&gt;{"\n"}
                  ENABLE_BANKING_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
                </code>
                <span className="block mt-1">{t("configStep2Note")}</span>
              </li>
              <li>{t("configStep3")}</li>
            </ol>
          </div>
        )}

        {configured === true && (
          <>
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <label className="text-sm text-muted">{t("countryLabel")}</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm">
                <option value="LU">Luxembourg</option>
                <option value="BE">Belgique</option>
                <option value="FR">France</option>
                <option value="DE">Allemagne</option>
                <option value="NL">Pays-Bas</option>
                <option value="FI">Finlande (sandbox)</option>
              </select>
              <span className="text-[11px] text-muted">{t("sandboxNote")}</span>
            </div>

            {loading && <p className="text-sm text-muted">{t("loading")}</p>}
            {error && <p className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">{error}</p>}

            {step === "select-bank" && institutions.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {institutions.map((i) => (
                  <button key={`${i.id}-${i.country}`} onClick={() => connect(i)}
                    className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-4 text-left shadow-sm hover:border-navy hover:shadow-md transition">
                    {i.logo && <img src={i.logo} alt={i.name} className="h-10 w-10 object-contain" />}
                    <div>
                      <div className="text-sm font-semibold text-navy">{i.name}</div>
                      <div className="text-[10px] text-muted">{i.country}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === "select-bank" && !loading && institutions.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>{t("noBanksStrong", { country })}</strong>
                <p className="mt-2 text-xs">{t("noBanksCauses")}</p>
                <ul className="mt-1 ml-4 list-disc text-xs space-y-1">
                  <li>{t("noBanksCause1")}</li>
                  <li>{t("noBanksCause2")}</li>
                  <li>{t("noBanksCause3")}</li>
                </ul>
                <p className="mt-2 text-xs">{t("noBanksVerify")}</p>
              </div>
            )}

            {step === "done" && accounts.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="text-sm font-semibold text-emerald-900">{t("connectedTitle")}</h3>
                <p className="mt-1 text-xs text-emerald-800">{t("connectedDetail", { n: accounts.length, session: sessionId ?? "" })}</p>
                <div className="mt-3 space-y-2">
                  {accounts.map((uid) => {
                    const ad = accountsData.find((a) => a.uid === uid);
                    return (
                      <button key={uid} onClick={() => loadAccount(uid)}
                        className="w-full rounded-lg border border-emerald-300 bg-white p-2 text-left text-xs hover:bg-emerald-100">
                        <span className="font-mono">{ad?.account_id?.iban ?? uid}</span>
                        {ad?.name && <span className="ml-2 text-muted">{ad.name}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {movements.length > 0 && (
              <div className="mt-6 rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-background">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate">{t("thDate")}</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate">{t("thLabel")}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate">{t("thAmount")}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate">{t("thRef")}</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>{t("sandboxStrong")}</strong> {t("sandboxBody")}{" "}
          <Link href="/gestion-locative/reconciliation" className="underline">{t("sandboxLink")}</Link>{" "}
          {t("sandboxSuffix")}
        </div>
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4 text-xs text-muted">
          <strong>{t("legalStrong")}</strong> {t("legalBody")}
        </div>
      </div>
    </div>
  );
}
