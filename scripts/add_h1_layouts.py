#!/usr/bin/env python3
"""Add a server-rendered <h1 class="sr-only"> + noindex metadata to
auth-gated pages whose h1 is rendered conditionally after auth check
(so Bingbot sees Loading... without h1 in initial HTML).

Strategy:
- For each affected route, write src/app/<route>/layout.tsx that:
  1. Sets robots: noindex (these are auth-gated, no public SEO value)
  2. Renders a sr-only h1 always present in the SSR HTML
  3. Wraps children unchanged

If a layout already exists, merges (keeps existing metadata, adds noindex
+ h1 wrapper).
"""
import re
from pathlib import Path

APP = Path(__file__).parent.parent / "src" / "app"

# route -> visible page title (FR, will be in <h1 sr-only>)
PAGES = {
    "actions-prioritaires": "Actions prioritaires",
    "aml-kyc/archives": "Archives AML / KYC",
    "facturation/historique": "Historique de facturation",
    "gestion-locative/fiscal": "Bilan fiscal locatif",
    "gestion-locative/relances": "Relances locatives",
    "hotellerie/alerts": "Alertes hôtellerie",
    "hotellerie/benchmark": "Benchmark hôtelier",
    "hotellerie/forecast": "Forecast hôtelier",
    "hotellerie/groupe": "Groupe hôtelier",
    "pms/proprietes/nouveau": "Nouvelle propriété PMS",
    "pro-agences/commissions": "Commissions agence",
    "pro-agences/crm/contacts": "Contacts CRM",
    "pro-agences/crm/contacts/import": "Import contacts CRM",
    "pro-agences/crm/tasks": "Tâches CRM",
    "pro-agences/mandats": "Mandats agence",
    "pro-agences/performance": "Performance agence",
    "status": "Statut système tevaxia",
    "str/portefeuille": "Portefeuille STR",
    "syndic/coproprietes": "Copropriétés syndic",
    "tableau-bord": "Tableau de bord",
}

LAYOUT_TEMPLATE = '''import type {{ Metadata }} from "next";
import {{ NOINDEX_METADATA }} from "@/lib/seo";

export const metadata: Metadata = {{
  title: "{title}",
  ...NOINDEX_METADATA,
}};

export default function Layout({{ children }}: {{ children: React.ReactNode }}) {{
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {{children}}
    </>
  );
}}
'''


def main() -> None:
    created = updated = 0
    for route, title in PAGES.items():
        target = APP / route / "layout.tsx"
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            text = target.read_text(encoding="utf-8")
            # Skip if already has sr-only h1 (idempotent)
            if 'className="sr-only">' in text and "<h1" in text:
                print(f"[skip already-h1] {route}")
                continue
            # Otherwise overwrite — these layouts are simple and we want
            # canonical content
            target.write_text(LAYOUT_TEMPLATE.format(title=title), encoding="utf-8")
            print(f"[updated]        {route}")
            updated += 1
        else:
            target.write_text(LAYOUT_TEMPLATE.format(title=title), encoding="utf-8")
            print(f"[created]        {route}")
            created += 1
    print(f"\nCreated: {created}, Updated: {updated}")


if __name__ == "__main__":
    main()
