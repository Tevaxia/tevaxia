"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { driveUpload, ensureTevaxiaFolder } from "@/lib/drive";

interface SaveToGoogleDriveProps {
  /**
   * Fonction qui produit le Blob à uploader (async pour permettre la
   * génération paresseuse — PDF/DOCX coûteux). Appelée uniquement au clic.
   */
  getBlob: () => Promise<Blob>;
  filename: string;
  mimeType?: string;
  /** Si true, crée/utilise un dossier "tevaxia" dans la racine du Drive. */
  useFolder?: boolean;
  /** Libellé du bouton (défaut : "Save to Drive" traduit via i18n). */
  label?: string;
  /** Classe Tailwind optionnelle pour surcharger le style par défaut. */
  className?: string;
}

type UiState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "success"; fileUrl: string; filename: string }
  | { kind: "error"; message: string };

export default function SaveToGoogleDrive(props: SaveToGoogleDriveProps) {
  const t = useTranslations("drive");
  const [state, setState] = useState<UiState>({ kind: "idle" });

  const defaultClass =
    "inline-flex items-center gap-2 rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-50 transition-colors";

  const handleUpload = async () => {
    if (!supabase) {
      setState({ kind: "error", message: t("supabaseMissing") });
      return;
    }
    setState({ kind: "uploading" });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setState({ kind: "error", message: t("loginRequired") });
      return;
    }

    let accessToken = session.provider_token;
    const providerRefresh = session.provider_refresh_token;
    const isGoogle = session.user.app_metadata?.provider === "google";

    if (!isGoogle) {
      setState({ kind: "error", message: t("googleOnly") });
      return;
    }

    if (!accessToken) {
      // Provider token perdu (post-refresh). Re-demande auth avec scopes Drive.
      await requestDriveScope();
      return; // redirect en cours
    }

    try {
      const blob = await props.getBlob();

      const folderId = props.useFolder ? await ensureTevaxiaFolder(accessToken) : null;
      const result = await driveUpload({
        accessToken,
        blob,
        filename: props.filename,
        mimeType: props.mimeType,
        folderId: folderId ?? undefined,
      });

      if ("error" in result) {
        if (result.error === "scope_missing" || result.error === "unauthorized") {
          // Re-consent auto
          await requestDriveScope();
          return;
        }
        if (result.error === "network") {
          setState({ kind: "error", message: `${t("networkError")} — ${result.message}` });
        } else if (result.error === "upstream") {
          setState({ kind: "error", message: `${t("upstreamError")} (${result.status}) ${result.message}` });
        } else {
          setState({ kind: "error", message: t("unknownError") });
        }
        // Mark refresh token unused to avoid TS warning when absent
        void providerRefresh;
        return;
      }

      setState({ kind: "success", fileUrl: result.webViewLink, filename: result.name });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const requestDriveScope = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setState({ kind: "error", message: error.message });
    }
  };

  const DriveIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M7.71 3.5L1.15 15l2.85 4.5h17.8L24 15 17.29 3.5H7.71z" fill="#4285F4" />
      <path d="M3.99 19.5L1.15 15 7.71 3.5h2.57L3.99 19.5z" fill="#1967D2" />
      <path d="M3.99 19.5l13.3-16h3.38L7.51 19.5H3.99z" fill="#FBBC04" />
      <path d="M17.29 3.5L24 15l-2.85 4.5H7.51L17.29 3.5z" fill="#188038" />
    </svg>
  );

  if (state.kind === "success") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="font-medium">{t("uploaded")}</span>
        <a
          href={state.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold"
        >
          {t("openInDrive")} →
        </a>
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="ml-1 text-[10px] text-emerald-800 hover:text-emerald-900"
          aria-label={t("close")}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={state.kind === "uploading"}
        onClick={handleUpload}
        className={props.className ?? defaultClass}
      >
        {state.kind === "uploading" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate/30 border-t-slate" />
        ) : (
          <DriveIcon />
        )}
        {state.kind === "uploading" ? t("uploading") : (props.label ?? t("saveToDrive"))}
      </button>
      {state.kind === "error" && (
        <div className="text-[11px] text-rose-700 max-w-xs">{state.message}</div>
      )}
    </div>
  );
}
