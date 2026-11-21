"use client";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { listenAnalyticsConsent, OPEN_COOKIE_SETTINGS_EVENT, readAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent } from "@/lib/analytics-consent";

export default function CookieBanner() {
  const t = useTranslations("cookie"), locale = useLocale();
  const [visible, setVisible] = useState(false), [warning, setWarning] = useState(false), [hasChoice, setHasChoice] = useState(false);
  useEffect(() => {
    const refresh = () => { const choice = readAnalyticsConsent(); setHasChoice(choice !== null); if (choice === null) setVisible(true); };
    const open = () => { setWarning(false); setVisible(true); };
    refresh();
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    const unsubscribe = listenAnalyticsConsent(refresh);
    return () => { window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open); unsubscribe(); };
  }, []);
  const choose = (choice: AnalyticsConsent) => {
    const persisted = setAnalyticsConsent(choice);
    setHasChoice(true); setWarning(!persisted); if (persisted) setVisible(false);
  };
  if (!visible) return null;
  // Sur mobile : bande basse compacte, pour ne pas masquer l'outil à la première
  // visite. Les deux choix gardent la même taille et le même rang.
  return <section aria-label={t("settingsTitle")} className="print:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto p-2 sm:p-6">
    <div className="mx-auto max-w-2xl rounded-xl border border-card-border bg-card p-3 shadow-lg sm:p-5 [overflow-wrap:anywhere]">
      <h2 className="mb-1 text-sm font-semibold text-navy sm:mb-2 sm:text-base">{t("settingsTitle")}</h2>
      <p className="text-xs leading-snug text-slate sm:text-sm sm:leading-relaxed">{t("message")}</p>
      {warning && <p role="alert" className="mt-2 text-xs text-amber-800 sm:text-sm">{t("storageWarning")}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
        <a href={`${locale === "fr" ? "" : `/${locale}`}/confidentialite`} className="text-xs text-muted underline">{t("privacyLink")}</a>
        <div className="flex w-full gap-2 sm:w-auto sm:flex-wrap sm:gap-3">
          {hasChoice && <button onClick={() => setVisible(false)} className="rounded-lg border border-card-border px-3 py-2 text-xs sm:px-4 sm:text-sm">{t("close")}</button>}
          <button onClick={() => choose("denied")} className="flex-1 rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-muted hover:bg-background sm:flex-none sm:px-5 sm:text-sm">{t("refuse")}</button>
          <button onClick={() => choose("granted")} className="flex-1 rounded-lg bg-navy px-3 py-2 text-xs font-medium text-white hover:bg-navy-light sm:flex-none sm:px-5 sm:text-sm">{t("accept")}</button>
        </div>
      </div>
    </div>
  </section>;
}
