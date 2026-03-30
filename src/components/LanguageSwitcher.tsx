"use client";

import { useState, useEffect } from "react";

export function useLocale(): string {
  const [locale, setLocale] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("tevaxia_locale") || "fr";
    setLocale(saved);
  }, []);

  return locale;
}

export function setLocale(locale: string) {
  localStorage.setItem("tevaxia_locale", locale);
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
  window.location.reload();
}

export default function LanguageSwitcher() {
  const locale = useLocale();

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/10 p-0.5">
      <button
        onClick={() => setLocale("fr")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          locale === "fr" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          locale === "en" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
