"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

const TRASH_LOCAL_KEYS = [
  "tevaxia_valuations",
  "tevaxia_trash",
  "tevaxia_rental_properties",
  "tevaxia_profile",
];

export default function DeleteAccountSection() {
  const t = useTranslations("profil.deleteAccount");
  const router = useRouter();
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, signOut } = useAuth();

  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !supabase) return null;

  const expected = t("confirmToken");

  const handleDelete = async () => {
    if (typed !== expected) {
      setError(t("typeWrong"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase!.rpc("delete_my_account");
      if (rpcError) throw rpcError;
      // Purge toute donnée locale
      for (const k of TRASH_LOCAL_KEYS) {
        try { localStorage.removeItem(k); } catch { /* ignore */ }
      }
      await signOut();
      router.push(`${lp}/?account_deleted=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deletion failed");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6">
      <h2 className="text-base font-semibold text-rose-900">{t("title")}</h2>
      <p className="mt-1 text-xs text-rose-800 leading-relaxed">{t("desc")}</p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          {t("ctaOpen")}
        </button>
      ) : (
        <div className="mt-4 rounded-lg border border-rose-200 bg-white p-4">
          <p className="text-sm font-semibold text-rose-900">{t("confirmTitle")}</p>
          <p className="mt-1 text-xs text-rose-800">{t("confirmDesc", { token: expected })}</p>
          <input
            type="text"
            value={typed}
            onChange={(e) => { setTyped(e.target.value); setError(null); }}
            placeholder={expected}
            className="mt-3 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-mono"
          />
          {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => { setOpen(false); setTyped(""); setError(null); }}
              className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || typed !== expected}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t("deleting") : t("confirmCta")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
