"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

function updateConsent(granted: boolean) {
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

export default function CookieBanner() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("tevaxia_consent");
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    } else if (consent === "granted") {
      updateConsent(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("tevaxia_consent", "granted");
    updateConsent(true);
    // Notify deferred loaders (GtagLoader, PostHogProvider) that consent
    // was just granted, so they can initialise without requiring a reload.
    window.dispatchEvent(new CustomEvent("tevaxia:consent-granted"));
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem("tevaxia_consent", "denied");
    updateConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-xl border border-card-border bg-card p-5 shadow-lg">
        <p className="text-sm text-slate leading-relaxed">
          {t("message")}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <a href="/confidentialite" className="text-xs text-muted hover:text-navy hover:underline transition-colors">
            {t("privacyLink")}
          </a>
          <div className="flex gap-3">
            <button
              onClick={refuse}
              className="rounded-lg border border-card-border px-5 py-2 text-sm font-medium text-muted hover:bg-background transition-colors"
            >
              {t("refuse")}
            </button>
            <button
              onClick={accept}
              className="rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors"
            >
              {t("accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
