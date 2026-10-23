const LOCALES = ["en", "de", "pt", "lb"] as const;

export function localeFromPath(pathname: string): string {
  return LOCALES.find(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) ?? "fr";
}

/** Change only the language prefix; retain the URL's query and fragment verbatim. */
export function switchLocalePath(path: string, locale: string): string {
  const match = path.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] || "/", suffix = match?.[2] || "";
  const current = localeFromPath(pathname);
  const base = current === "fr" ? pathname : pathname.slice(current.length + 1) || "/";
  return (locale === "fr" ? base : `/${locale}${base === "/" ? "" : base}`) + suffix;
}

/** Prefix site pages, leaving external URLs, assets, API/auth endpoints and explicit locales intact. */
export function localizePath(path: string, locale: string): string {
  if (locale === "fr" || !path.startsWith("/") || path.startsWith("//")) return path;
  const pathname = path.split(/[?#]/, 1)[0];
  if (localeFromPath(pathname) !== "fr" || /^\/(?:api|auth|_next)(?:\/|$)/.test(pathname) || /\.[^/]+$/.test(pathname)) return path;
  return `/${locale}${path}`;
}

export function getLocalePrefix(): string {
  if (typeof window === "undefined") return "";
  const locale = localeFromPath(window.location.pathname);
  return locale === "fr" ? "" : `/${locale}`;
}

export function localePath(path: string): string {
  return localizePath(path, typeof window === "undefined" ? "fr" : localeFromPath(window.location.pathname));
}
