"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { acceptInvitationToken } from "@/lib/orgs";

export default function AcceptInvitationPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("invitation");
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();
  const token = String(params?.token ?? "");

  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!token || authLoading) return;
    if (!isSupabaseConfigured) return;
    if (!user) return;
    if (status !== "idle") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("pending");
    acceptInvitationToken(token).then((res) => {
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorKey(res.error ?? "generic");
      }
    });
  }, [token, user, authLoading, status]);

  const errorMessage = (key: string | null): string => {
    switch (key) {
      case "expired": return t("errExpired");
      case "already_accepted": return t("errAlreadyAccepted");
      case "email_mismatch": return t("errEmailMismatch");
      case "invitation_not_found": return t("errNotFound");
      case "not_authenticated": return t("errNotAuthenticated");
      case null: case undefined: case "": case "generic": return t("errGeneric");
      default: return key;
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("tokenLabel")} <code className="text-xs">{token.slice(0, 12)}…</code></p>

        {!isSupabaseConfigured && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {t("noSupabase")}
          </div>
        )}

        {isSupabaseConfigured && authLoading && (
          <div className="mt-6 text-sm text-muted">{t("checkingSession")}</div>
        )}

        {isSupabaseConfigured && !authLoading && !user && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">{t("mustSignIn")}</p>
            <Link
              href={`${lp}/connexion?redirect=${encodeURIComponent(`/invitation/${token}`)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
            >
              {t("signIn")}
            </Link>
          </div>
        )}

        {status === "pending" && (
          <div className="mt-6 text-sm text-muted">{t("accepting")}</div>
        )}

        {status === "success" && (
          <div className="mt-6 space-y-3">
            <div className="text-emerald-700 text-lg font-semibold">{t("successHeadline")}</div>
            <p className="text-sm text-muted">{t("successBody")}</p>
            <Link
              href={`${lp}/profil/organisation`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t("myAgency")}
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              {errorMessage(errorKey)}
            </div>
            <Link href={`${lp}/`} className="inline-flex items-center gap-2 text-sm text-navy hover:underline">
              {t("backHome")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
