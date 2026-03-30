"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("tevaxia_consent");
    if (!consent) {
      setVisible(true);
    } else if (consent === "granted") {
      updateConsent(true);
    }
  }, []);

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

  function accept() {
    localStorage.setItem("tevaxia_consent", "granted");
    updateConsent(true);
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
          Ce site utilise des cookies de mesure d'audience (Google Analytics) pour
          améliorer votre expérience. Aucune donnée personnelle n'est collectée via
          les calculateurs.{" "}
          <a href="/confidentialite" className="text-navy font-medium hover:underline">
            Politique de confidentialité
          </a>
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={accept}
            className="rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={refuse}
            className="rounded-lg border border-card-border px-5 py-2 text-sm font-medium text-muted hover:bg-background transition-colors"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
