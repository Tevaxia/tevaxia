import { NextRequest, NextResponse } from "next/server";

const ENERGY_HOST = "energy.tevaxia.lu";

function getHost(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    ""
  ).replace(/:\d+$/, "");
}

function isEnergyHost(host: string): boolean {
  return host === ENERGY_HOST || host === "energy.localhost";
}

export function proxy(request: NextRequest) {
  const host = getHost(request);
  const { pathname } = request.nextUrl;

  // Sous-domaine energy : réécrire vers /energy/...
  if (isEnergyHost(host)) {
    // Déjà sous /energy → on laisse passer
    if (!pathname.startsWith("/energy") && !pathname.startsWith("/en/energy")) {
      const locale = pathname.startsWith("/en") ? "/en" : "";
      const rest = pathname.startsWith("/en") ? pathname.slice(3) : pathname;
      const target = `${locale}/energy${rest === "/" ? "" : rest}`;
      const url = request.nextUrl.clone();
      url.pathname = target || "/energy";
      const response = NextResponse.rewrite(url);
      response.headers.set("x-url", url.pathname);
      response.headers.set("x-energy-subdomain", "1");
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("x-url", pathname);
    response.headers.set("x-energy-subdomain", "1");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-url", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|icon|favicon|.*\\..*).*)"],
};
