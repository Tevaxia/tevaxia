#!/usr/bin/env python3
"""Generate per-route namespace map for next-intl pick optimization.

For each `src/app/**/page.tsx` (FR canonical, ignoring locale shims):
  1. Walk the import graph recursively (@/* and relative imports).
  2. Whenever a `'use client'` file is encountered, collect every
     `useTranslations("ns")` literal AND every `<SEOContent ns="ns">` /
     `<ModuleContextBar moduleKey>` dynamic dispatch.
  3. Emit { "/route": ["ns", ...], ... } to src/i18n/route-namespaces.ts.

Common namespaces (used by Header / Footer / CookieBanner / AiChatWidget
etc. always present in the layout tree) are merged into every route
automatically.

Used by src/app/layout.tsx to pick only the messages a page actually
needs, keeping the inlined hydration JSON minimal (Bing 1MB HTML cap).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
APP = SRC / "app"
OUT = SRC / "i18n" / "route-namespaces.ts"

LOCALE_PREFIXES = {"en", "de", "lb", "pt"}

# Composants présents dans le layout root (toujours montés).
LAYOUT_TREE_FILES = [
    SRC / "components" / "Header.tsx",
    SRC / "components" / "Footer.tsx",
    SRC / "components" / "CookieBanner.tsx",
    SRC / "components" / "AuthProvider.tsx",
    SRC / "components" / "PostHogProvider.tsx",
    SRC / "components" / "ServiceWorkerRegistration.tsx",
    SRC / "components" / "AiChatWidget.tsx",
    SRC / "components" / "BackupReminderToast.tsx",
    SRC / "components" / "ModuleContextBar.tsx",
    SRC / "components" / "JsonLd.tsx",
]

# ModuleContextBar dispatches dynamically to these namespaces.
MODULE_CONTEXT_BAR_NS = {
    "syndicContextBar", "pmsContextBar", "crmContextBar", "hotellerieContextBar",
}

USE_T_RE = re.compile(r"useTranslations\(\s*['\"]([^'\"]+)['\"]")
SEO_NS_RE = re.compile(r"<SEOContent[^>]*\sns=\"([^\"]+)\"")
IMPORT_RE = re.compile(
    r"""(?:import|from)\s*(?:[^'"]*['"])([^'"]+)['"]""",
    re.MULTILINE,
)
DYN_IMPORT_RE = re.compile(r"""import\(\s*['"]([^'"]+)['"]""")


def resolve_import(spec: str, from_file: Path) -> Path | None:
    """Resolve a TS import spec to a real .tsx/.ts path."""
    if spec.startswith("@/"):
        base = SRC / spec[2:]
    elif spec.startswith("."):
        base = (from_file.parent / spec).resolve()
    else:
        return None  # external package
    candidates = [
        base.with_suffix(".tsx"),
        base.with_suffix(".ts"),
        base / "index.tsx",
        base / "index.ts",
    ]
    for c in candidates:
        if c.is_file():
            return c
    return None


def collect_ns_from_subtree(entry: Path, visited: set[Path]) -> set[str]:
    """Walk the import graph from `entry`, collect useTranslations ns from
    every reachable client component (and SEOContent ns props anywhere)."""
    if entry in visited or not entry.is_file():
        return set()
    visited.add(entry)
    try:
        text = entry.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return set()
    namespaces: set[str] = set()

    # SEOContent ns="X" dispatch — namespace is reachable via client even if
    # this file itself is a server component (SEOContent is the client one).
    for m in SEO_NS_RE.findall(text):
        namespaces.add(m.split(".")[0])

    # useTranslations literals — only count for client files.
    is_client = '"use client"' in text
    if is_client:
        for m in USE_T_RE.findall(text):
            namespaces.add(m.split(".")[0])

    # Recurse imports (any kind of file — server may render client).
    for spec in IMPORT_RE.findall(text):
        resolved = resolve_import(spec, entry)
        if resolved:
            namespaces |= collect_ns_from_subtree(resolved, visited)
    for spec in DYN_IMPORT_RE.findall(text):
        resolved = resolve_import(spec, entry)
        if resolved:
            namespaces |= collect_ns_from_subtree(resolved, visited)

    return namespaces


def common_namespaces() -> set[str]:
    """Namespaces required by the always-mounted layout-tree components."""
    ns: set[str] = set(MODULE_CONTEXT_BAR_NS)
    visited: set[Path] = set()
    for f in LAYOUT_TREE_FILES:
        ns |= collect_ns_from_subtree(f, visited)
    return ns


def page_to_route(page_path: Path) -> str:
    """Convert src/app/foo/bar/page.tsx → /foo/bar (FR canonical)."""
    rel = page_path.relative_to(APP).with_suffix("")
    parts = list(rel.parts)
    if not parts:
        return "/"
    if parts[-1] == "page":
        parts = parts[:-1]
    if not parts:
        return "/"
    if parts[0] in LOCALE_PREFIXES:
        return None  # locale shim — skip
    # strip dynamic segments [param] for a stable route key
    cleaned = []
    for p in parts:
        if p.startswith("[") and p.endswith("]"):
            cleaned.append(p)  # keep — runtime will handle
        else:
            cleaned.append(p)
    return "/" + "/".join(cleaned)


def main() -> None:
    common = common_namespaces()
    route_ns: dict[str, list[str]] = {}

    for page in sorted(APP.rglob("page.tsx")):
        # skip locale shims (src/app/{en,de,lb,pt}/...)
        rel_parts = page.relative_to(APP).parts
        if rel_parts[0] in LOCALE_PREFIXES:
            continue
        # skip api/offline
        if rel_parts[0] in {"api", "offline"}:
            continue
        route = page_to_route(page)
        if route is None:
            continue
        visited: set[Path] = set()
        ns = collect_ns_from_subtree(page, visited) | common
        route_ns[route] = sorted(ns)

    # Emit TS file
    body = "// AUTO-GENERATED by scripts/generate_route_namespaces.py — DO NOT EDIT\n"
    body += "// Run `npm run build` (or `python scripts/generate_route_namespaces.py`) to regenerate.\n\n"
    body += "// Common namespaces always included (layout-tree client components).\n"
    body += "export const COMMON_NAMESPACES = [\n"
    for n in sorted(common):
        body += f'  "{n}",\n'
    body += "] as const;\n\n"
    body += "// Per-route namespace map, FR canonical (locale prefix stripped).\n"
    body += "// Keys may include [param] segments and resolve via prefix matching.\n"
    body += "export const ROUTE_NAMESPACES: Record<string, readonly string[]> = "
    body += json.dumps(route_ns, ensure_ascii=False, indent=2)
    body += ";\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(body, encoding="utf-8")
    print(f"Wrote {len(route_ns)} routes, {len(common)} common ns to {OUT}")


if __name__ == "__main__":
    main()
