"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { listMyOrganizations } from "@/lib/orgs";
import { getProvider, buildZip, defaultZipFilename, type BackupModule, type BackupManifest } from "@/lib/backup";
import { driveUpload, ensureTevaxiaFolder } from "@/lib/drive";
import { recordBackup } from "@/lib/backup/history";

interface Props {
  module: BackupModule;
  /** Libellé personnalisable. Si absent, fallback sur i18n backup.button. */
  label?: string;
}

type State =
  | { kind: "idle" }
  | { kind: "working"; step: "collecting" | "zipping" | "uploading" }
  | { kind: "success"; mode: "download" | "drive"; fileUrl?: string; filename: string; counts: Record<string, number> }
  | { kind: "error"; message: string };

export default function BackupButton({ module, label }: Props) {
  const t = useTranslations("backup");
  const tDrive = useTranslations("drive");
  const { user } = useAuth();
  const [state, setState] = useState<State>({ kind: "idle" });

  if (!user) {
    return <p className="text-xs text-muted">{t("loginRequired")}</p>;
  }

  const collect = async () => {
    const provider = getProvider(module);
    if (!provider) throw new Error(`Unknown module: ${module}`);

    const orgs = await listMyOrganizations();
    const activeOrgId = orgs[0]?.id ?? null;

    const bundle = await provider.collect({
      userId: user.id,
      orgId: activeOrgId,
      t: (k: string) => k,
    });

    const manifest: BackupManifest = {
      schemaVersion: 1,
      module,
      userId: user.id,
      exportedAt: new Date().toISOString(),
      counts: bundle.counts,
    };

    return { bundle, manifest };
  };

  const handleDownload = async () => {
    setState({ kind: "working", step: "collecting" });
    try {
      const { bundle, manifest } = await collect();
      setState({ kind: "working", step: "zipping" });

      const blob = buildZip({ manifest, bundle });
      const filename = defaultZipFilename(module);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      await recordBackup({ module, destination: "download", counts: manifest.counts });
      setState({ kind: "success", mode: "download", filename, counts: manifest.counts });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const handleDrive = async () => {
    if (!supabase) {
      setState({ kind: "error", message: tDrive("supabaseMissing") });
      return;
    }
    setState({ kind: "working", step: "collecting" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({ kind: "error", message: tDrive("loginRequired") });
        return;
      }
      const isGoogle = session.user.app_metadata?.provider === "google";
      if (!isGoogle) {
        setState({ kind: "error", message: tDrive("googleOnly") });
        return;
      }
      let accessToken = session.provider_token;
      if (!accessToken) {
        await requestDriveScope();
        return;
      }

      const { bundle, manifest } = await collect();
      setState({ kind: "working", step: "zipping" });
      const blob = buildZip({ manifest, bundle });
      const filename = defaultZipFilename(module);

      setState({ kind: "working", step: "uploading" });
      const folderId = await ensureTevaxiaFolder(accessToken);
      const result = await driveUpload({
        accessToken,
        blob,
        filename,
        mimeType: "application/zip",
        folderId: folderId ?? undefined,
        description: `Sauvegarde tevaxia.lu — module ${module}`,
      });

      if ("error" in result) {
        if (result.error === "scope_missing" || result.error === "unauthorized") {
          await requestDriveScope();
          return;
        }
        const msg = result.error === "network"
          ? `${tDrive("networkError")} — ${result.message}`
          : result.error === "upstream"
          ? `${tDrive("upstreamError")} (${result.status}) ${result.message}`
          : tDrive("unknownError");
        setState({ kind: "error", message: msg });
        return;
      }

      await recordBackup({ module, destination: "drive", counts: manifest.counts, driveFileId: result.id });
      setState({ kind: "success", mode: "drive", fileUrl: result.webViewLink, filename: result.name, counts: manifest.counts });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const requestDriveScope = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  const working = state.kind === "working";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={working}
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {working && state.step === "zipping" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
          {label ?? t("downloadZip")}
        </button>

        <button
          type="button"
          disabled={working}
          onClick={handleDrive}
          className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {working && state.step === "uploading" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M7.71 3.5L1.15 15l2.85 4.5h17.8L24 15 17.29 3.5H7.71z" fill="#4285F4" />
              <path d="M3.99 19.5L1.15 15 7.71 3.5h2.57L3.99 19.5z" fill="#1967D2" />
              <path d="M3.99 19.5l13.3-16h3.38L7.51 19.5H3.99z" fill="#FBBC04" />
              <path d="M17.29 3.5L24 15l-2.85 4.5H7.51L17.29 3.5z" fill="#188038" />
            </svg>
          )}
          {t("saveToDrive")}
        </button>
      </div>

      {working && state.step === "collecting" && (
        <p className="text-xs text-muted">{t("collecting")}</p>
      )}

      {state.kind === "success" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          <div className="font-medium">
            {state.mode === "drive" ? t("uploadedToDrive") : t("downloaded")} — {state.filename}
          </div>
          <div className="mt-0.5 text-emerald-800">
            {Object.entries(state.counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}
          </div>
          {state.mode === "drive" && state.fileUrl && (
            <a href={state.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block underline font-semibold">
              {tDrive("openInDrive")} →
            </a>
          )}
        </div>
      )}

      {state.kind === "error" && (
        <p className="text-xs text-rose-700">{state.message}</p>
      )}
    </div>
  );
}
