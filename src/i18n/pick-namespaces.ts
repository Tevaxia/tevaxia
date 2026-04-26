import { CLIENT_NAMESPACES } from "./client-namespaces";
import { COMMON_NAMESPACES, ROUTE_NAMESPACES } from "./route-namespaces";

const LOCALE_PREFIXES = ["en", "de", "lb", "pt"] as const;

const DYNAMIC_ROUTES: Array<{ regex: RegExp; ns: readonly string[] }> = (() => {
  const out: Array<{ regex: RegExp; ns: readonly string[] }> = [];
  for (const [pattern, ns] of Object.entries(ROUTE_NAMESPACES)) {
    if (pattern.includes("[")) {
      const escaped = pattern
        .replace(/[.+?^${}()|\\]/g, "\\$&")
        .replace(/\[\.\.\.[^\]]+\]/g, ".+")
        .replace(/\[[^\]]+\]/g, "[^/]+");
      out.push({ regex: new RegExp("^" + escaped + "/?$"), ns });
    }
  }
  return out;
})();

function stripLocale(pathname: string): string {
  for (const loc of LOCALE_PREFIXES) {
    if (pathname === `/${loc}`) return "/";
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname || "/";
}

function findRouteNamespaces(pathname: string): readonly string[] | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path in ROUTE_NAMESPACES) return ROUTE_NAMESPACES[path];
  for (const { regex, ns } of DYNAMIC_ROUTES) {
    if (regex.test(path)) return ns;
  }
  return null;
}

/**
 * Picks the smallest possible message set for the current request.
 *
 * Strategy:
 * 1. Resolve the FR canonical path (strip /en, /de, /lb, /pt prefix).
 * 2. Look up the per-route namespace list (generated at build time by
 *    scripts/generate_route_namespaces.py from the page's import graph).
 * 3. If the route is unknown (404 / not yet scanned), fall back to the
 *    full client-namespace set so nothing breaks at runtime.
 *
 * Common namespaces (Header, Footer, etc.) are guaranteed via the
 * COMMON_NAMESPACES set merged into every route by the generator.
 */
export function pickNamespaces(allMessages: Record<string, unknown>, pathname: string): Record<string, unknown> {
  const path = stripLocale(pathname);
  const routeNs = findRouteNamespaces(path);
  const wanted = new Set<string>(routeNs ?? CLIENT_NAMESPACES);
  for (const c of COMMON_NAMESPACES) wanted.add(c);
  const out: Record<string, unknown> = {};
  for (const ns of wanted) {
    if (ns in allMessages) out[ns] = allMessages[ns];
  }
  return out;
}
