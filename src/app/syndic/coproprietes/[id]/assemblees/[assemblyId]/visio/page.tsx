"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => { dispose: () => void; executeCommand: (cmd: string, ...args: unknown[]) => void };
  }
}

export default function VisioAGPage() {
  const t = useTranslations("syndicVisio");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useParams();
  const id = String(params?.id ?? "");
  const assemblyId = String(params?.assemblyId ?? "");
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<NonNullable<typeof window.JitsiMeetExternalAPI>["prototype"]["constructor"]> | null>(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const roomName = `tevaxia-ag-${id.slice(0, 8)}-${assemblyId.slice(0, 8)}`;

  const loadJitsiScript = (): Promise<void> => new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(t("loadJitsiError")));
    document.head.appendChild(script);
  });

  const startMeeting = async () => {
    setLoading(true);
    try {
      await loadJitsiScript();
      if (!window.JitsiMeetExternalAPI || !containerRef.current) return;
      const JitsiMeetExternalAPI = window.JitsiMeetExternalAPI;
      apiRef.current = new JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        width: "100%",
        height: 600,
        parentNode: containerRef.current,
        userInfo: {
          displayName: user?.email ?? t("defaultDisplayName"),
          email: user?.email ?? undefined,
        },
        configOverwrite: {
          prejoinPageEnabled: true,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableSelfView: false,
          hideConferenceTimer: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","chat","raisehand","videoquality","filmstrip","invite","tileview"],
        },
      });
      setStarted(true);
    } catch (err) {
      alert(t("startLoadError", { msg: err instanceof Error ? err.message : t("errUnknown") }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => {
    if (apiRef.current) {
      try { apiRef.current.dispose(); } catch { /* ignore */ }
    }
  }, []);

  return (
    <div className="bg-background min-h-screen py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}/assemblees`} className="text-xs text-muted hover:text-navy">{t("backAssemblees")}</Link>
        <div className="mt-2 mb-4">
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("pageSubtitle")}
            <Link href={`${lp}/syndic/coproprietes/${id}/assemblees`} className="text-navy underline">{t("tabAssemblees")}</Link>
            {t("dot")}
          </p>
        </div>

        {!started ? (
          <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 p-8 text-white shadow-lg text-center">
            <div className="text-xl font-bold">{t("readyTitle")}</div>
            <div className="mt-2 text-sm text-white/80">{t("roomLabel")}<code className="bg-white/10 px-2 py-0.5 rounded text-xs">{roomName}</code></div>
            <p className="mt-3 text-sm text-white/70 max-w-lg mx-auto">
              {t("jitsiNote")}
            </p>
            <button onClick={() => void startMeeting()} disabled={loading}
              className="mt-6 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-50 disabled:opacity-60">
              {loading ? t("btnLoading") : t("btnStart")}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div ref={containerRef} style={{ minHeight: 600 }} />
          </div>
        )}

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>{t("legalTitle")}</strong> {t("legalBody")}
        </div>
      </div>
    </div>
  );
}
