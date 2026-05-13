"use client";

import { useEffect } from "react";

/**
 * Initialise PostHog côté client. Respecte le consentement RGPD :
 * l'utilisateur doit avoir coché « consent_analytics » OU le bandeau
 * cookies (localStorage.tevaxia_consent === 'granted').
 * Si aucune des conditions n'est remplie, PostHog reste dormant.
 *
 * posthog-js (~55 KB gzipped) est chargé via `await import()` seulement
 * après acceptation du consentement, pour ne pas peser sur le bundle
 * initial des visiteurs anonymes (RGPD-friendly).
 */
async function initPostHog(key: string) {
  const { default: posthog } = await import("posthog-js");
  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      disable_session_recording: true,
      persistence: "localStorage+cookie",
    });
  }
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    const consent = typeof window !== "undefined" ? localStorage.getItem("tevaxia_consent") : null;
    if (consent === "granted") {
      void initPostHog(key);
      return;
    }
    const handler = () => void initPostHog(key);
    window.addEventListener("tevaxia:consent-granted", handler);
    return () => window.removeEventListener("tevaxia:consent-granted", handler);
  }, []);

  return <>{children}</>;
}
