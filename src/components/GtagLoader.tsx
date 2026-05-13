"use client";

import { useEffect } from "react";

const GA_ID = "G-4033901KHR";

/**
 * Loads gtag/js only AFTER the visitor grants analytics consent. Saves
 * 154 KB of GTM script + ~600 ms of parse/compile on the main thread
 * for anonymous visitors who never accept cookies (the dominant case
 * on first-touch pages).
 *
 * The consent-default snippet still runs eagerly in layout.tsx (so
 * that any later GA call respects denied state by default). This
 * loader only fetches and initialises the heavy library on grant.
 */
function loadGtag() {
  if (document.querySelector(`script[data-gtag="${GA_ID}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.setAttribute("data-gtag", GA_ID);
  script.onload = () => {
    (window as unknown as { dataLayer: unknown[] }).dataLayer ??= [];
    const gtag = (...args: unknown[]) => {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push(args);
    };
    gtag("js", new Date());
    gtag("config", GA_ID);
  };
  document.head.appendChild(script);
}

export default function GtagLoader() {
  useEffect(() => {
    const consent = typeof window !== "undefined" ? localStorage.getItem("tevaxia_consent") : null;
    if (consent === "granted") {
      loadGtag();
      return;
    }
    const handler = () => loadGtag();
    window.addEventListener("tevaxia:consent-granted", handler);
    return () => window.removeEventListener("tevaxia:consent-granted", handler);
  }, []);

  return null;
}
