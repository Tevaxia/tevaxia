"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { acceptInvitationToken } from "@/lib/orgs";

export default function AcceptInvitationPage() {
  const params = useParams();
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();
  const token = String(params?.token ?? "");

  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || authLoading) return;
    if (!isSupabaseConfigured) return;
    if (!user) return;
    if (status !== "idle") return;

    setStatus("pending");
    acceptInvitationToken(token).then((res) => {
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(res.error ?? "Invitation invalide.");
      }
    });
  }, [token, user, authLoading, status]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold text-navy">Invitation à rejoindre une agence</h1>
        <p className="mt-2 text-sm text-muted">Token : <code className="text-xs">{token.slice(0, 12)}…</code></p>

        {!isSupabaseConfigured && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Supabase n&apos;est pas configuré sur cet environnement.
          </div>
        )}

        {isSupabaseConfigured && authLoading && (
          <div className="mt-6 text-sm text-muted">Vérification de la session…</div>
        )}

        {isSupabaseConfigured && !authLoading && !user && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">Vous devez être connecté avec l&apos;email destinataire de l&apos;invitation.</p>
            <Link
              href={`${lp}/connexion?redirect=${encodeURIComponent(`/invitation/${token}`)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
            >
              Se connecter
            </Link>
          </div>
        )}

        {status === "pending" && (
          <div className="mt-6 text-sm text-muted">Acceptation en cours…</div>
        )}

        {status === "success" && (
          <div className="mt-6 space-y-3">
            <div className="text-emerald-700 text-lg font-semibold">Bienvenue dans l&apos;agence !</div>
            <p className="text-sm text-muted">Vous êtes maintenant membre. Accédez à votre espace agence.</p>
            <Link
              href={`${lp}/profil/organisation`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Mon agence
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              {errorMessage === "expired" && "Cette invitation a expiré (validité 14 jours)."}
              {errorMessage === "already_accepted" && "Cette invitation a déjà été acceptée."}
              {errorMessage === "email_mismatch" && "L'email de votre compte ne correspond pas à celui de l'invitation."}
              {errorMessage === "invitation_not_found" && "Cette invitation n'existe pas ou a été annulée."}
              {errorMessage === "not_authenticated" && "Connexion requise."}
              {errorMessage && !["expired", "already_accepted", "email_mismatch", "invitation_not_found", "not_authenticated"].includes(errorMessage) && errorMessage}
            </div>
            <Link href={`${lp}/`} className="inline-flex items-center gap-2 text-sm text-navy hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
