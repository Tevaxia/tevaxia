"use client";

import { Suspense, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { localeFromPath, switchLocalePath } from "@/lib/locale-path";

const LOCALES = [
  { code: "fr", label: "FR", name: "Français" },
  { code: "en", label: "EN", name: "English" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "pt", label: "PT", name: "Português" },
  { code: "lb", label: "LB", name: "Lëtzebuergesch" },
] as const;

function subscribeHash(notify: () => void) {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => { window.removeEventListener("hashchange", notify); window.removeEventListener("popstate", notify); };
}
const readHash = () => window.location.hash;
const serverHash = () => "";

function LanguageChoices({ path }: { path: string }) {
  const t = useTranslations("nav"), currentLocale = localeFromPath(path.split(/[?#]/, 1)[0]);
  const href = (locale: string) => switchLocalePath(path, locale);
  const liveHref = (locale: string) => switchLocalePath(window.location.pathname + window.location.search + window.location.hash, locale);
  return <>
    <select aria-label={t("language")} value={currentLocale} onChange={e => { window.location.href = liveHref(e.target.value); }} className="sm:hidden rounded-lg bg-navy px-1 py-2 text-xs text-white">
      {LOCALES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
    </select>
    <div className="hidden sm:flex gap-0.5 rounded-lg bg-white/10 p-0.5" aria-label={t("language")}>
      {LOCALES.map(l => <a key={l.code} href={href(l.code)} hrefLang={l.code} lang={l.code} aria-label={l.name} aria-current={currentLocale === l.code ? "page" : undefined}
        onClick={e => { e.currentTarget.href = liveHref(l.code); }}
        onFocus={e => { e.currentTarget.href = liveHref(l.code); }}
        onPointerDown={e => { e.currentTarget.href = liveHref(l.code); }}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${currentLocale === l.code ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}>{l.label}</a>)}
    </div>
  </>;
}

function CurrentLanguageChoices() {
  const pathname = usePathname(), query = useSearchParams().toString();
  const hash = useSyncExternalStore(subscribeHash, readHash, serverHash);
  return <LanguageChoices path={pathname + (query ? `?${query}` : "") + hash} />;
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  return <Suspense fallback={<LanguageChoices path={pathname} />}><CurrentLanguageChoices /></Suspense>;
}
