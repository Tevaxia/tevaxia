import { NextRequest, NextResponse } from "next/server";

const ENERGY_HOST = "energy.tevaxia.lu";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.replace(/:\d+$/, "") || "";
  const { pathname } = request.nextUrl;

  // Sous-domaine energy : réécrire vers /energy/...
  if (host === ENERGY_HOST || host === "energy.localhost") {
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
  }

  const response = NextResponse.next();
  // Pass the URL to the i18n request config
  response.headers.set("x-url", pathname);
  if (host === ENERGY_HOST || host === "energy.localhost") {
    response.headers.set("x-energy-subdomain", "1");
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|icon|favicon|.*\\..*).*)"],
};
