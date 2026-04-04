"use client";

import { usePathname } from "next/navigation";

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "pt", label: "PT" },
  { code: "lb", label: "LB" },
] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname();

  // Detect current locale from path
  const currentLocale = LOCALES.find(
    (l) => l.code !== "fr" && (pathname === `/${l.code}` || pathname.startsWith(`/${l.code}/`))
  )?.code || "fr";

  // Strip locale prefix to get the base path
  const basePath = currentLocale === "fr"
    ? pathname
    : pathname.replace(new RegExp(`^/${currentLocale}/?`), "/");

  function buildPath(locale: string) {
    if (locale === "fr") return basePath || "/";
    return `/${locale}${basePath === "/" ? "" : basePath}`;
  }

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/10 p-0.5">
      {LOCALES.map((l) => (
        <a
          key={l.code}
          href={buildPath(l.code)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            currentLocale === l.code
              ? "bg-white/20 text-white"
              : "text-white/50 hover:text-white"
          }`}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
