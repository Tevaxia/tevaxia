import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["en", "de", "pt", "lb"];

function getHost(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    ""
  ).replace(/:\d+$/, "");
}

function asciiSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .toLowerCase();
}

/**
 * Proxy unifié :
 * 1. 301 redirect energy.tevaxia.lu/* → tevaxia.lu/{locale}/energy/*
 * 2. Injecte le header x-url pour la détection i18n (toutes requêtes)
 */
export function proxy(request: NextRequest) {
  const host = getHost(request);
  const pathname = request.nextUrl.pathname;

  // --- Sous-domaine energy : 301 redirect vers domaine principal ---
  if (host === "energy.tevaxia.lu" || host === "energy.localhost") {
    const mainHost = host.replace("energy.", "");

    // Extraire le préfixe de langue s'il existe
    let locale = "";
    let rest = pathname;
    for (const loc of LOCALES) {
      if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
        locale = `/${loc}`;
        rest = pathname.slice(loc.length + 1) || "/";
        break;
      }
    }

    // /{locale}/energy{/rest}
    const energyPath = rest === "/" ? "/energy" : `/energy${rest}`;
    const newPath = `${locale}${energyPath}`;

    const protocol = request.nextUrl.protocol || "https:";
    const url = new URL(newPath, `${protocol}//${mainHost}`);
    url.search = request.nextUrl.search;

    return NextResponse.redirect(url, 301);
  }

  // --- Redirect 301 : /commune/<slug-avec-accent> → /commune/<slug-ascii> ---
  const communeMatch = pathname.match(/^(\/(?:en|de|pt|lb))?\/commune\/(.+?)\/?$/);
  if (communeMatch) {
    const [, localePrefix = "", rawSlug] = communeMatch;
    const decoded = decodeURIComponent(rawSlug);
    const normalized = asciiSlug(decoded);
    if (normalized !== decoded) {
      const url = request.nextUrl.clone();
      url.pathname = `${localePrefix}/commune/${normalized}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // --- Domaine principal : injecter x-url pour next-intl ---
  const response = NextResponse.next();
  response.headers.set("x-url", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|icon|favicon|.*\\.).*)"],
};
