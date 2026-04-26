#!/usr/bin/env python3
"""Shorten layout.tsx page titles > 70 chars for Bing SEO compliance.

Walks src/app and src/app/{en,de,lb,pt} for layout.tsx files matching a
predefined slug map and replaces the `title: "..."` entry with a shorter
version (≤ 65 chars target, never above 70).
"""
import re
from pathlib import Path

APP = Path(__file__).parent.parent / "src" / "app"

# slug -> { lang: short_title }
# slug = path under src/app (or under src/app/<locale>) without trailing /layout.tsx
NEW_TITLES: dict[str, dict[str, str]] = {
    "calculateur-vrd": {
        "fr": "Estimateur VRD Luxembourg — Métrés et bordereau de prix",
        "en": "VRD Estimator Luxembourg — Quantities and Bill of Prices",
        "de": "VRD-Schätzer Luxemburg — Mengen und Leistungsverzeichnis",
        "lb": "VRD-Schätzer Lëtzebuerg — Mengen a Leeschtungsverzeechnes",
        "pt": "Estimador VRD Luxemburgo — Medições e Mapa de Quantidades",
    },
    "convertisseur-surfaces": {
        "fr": "Convertisseur de surfaces — SCB, SCP, ILNAS 101 Luxembourg",
        "en": "Surface Area Converter — GBA, GFA, ILNAS 101 Luxembourg",
        "de": "Flächenrechner — BGF, NRF, ILNAS 101 Luxemburg",
        "lb": "Surface-Konvertisseur — SCB, SCP, ILNAS 101 Lëtzebuerg",
        "pt": "Conversor de Superfícies — ABC, APC, ILNAS 101 Luxemburgo",
    },
    "frais-acquisition": {
        "fr": "Frais d'acquisition Luxembourg — Droits, Bëllegen Akt, TVA",
        "en": "Luxembourg Acquisition Fees — Duties, Bëllegen Akt, VAT",
        "de": "Erwerbskosten Luxemburg — Abgaben, Bëllegen Akt, MwSt",
        "lb": "Acquisitiounskäschten Lëtzebuerg — Drot, Bëllegen Akt, MwSt",
        "pt": "Custos de aquisição Luxemburgo — Direitos, Bëllegen Akt, IVA",
    },
    "indices": {
        "fr": "Indice prix immobilier Luxembourg 2026 — Prix au m² commune",
        "en": "Luxembourg Property Price Index 2026 — Price per m² by Commune",
        "de": "Immobilien-Preisindex Luxemburg 2026 — m²-Preise nach Gemeinde",
        "lb": "Immobilien-Präisindex Lëtzebuerg 2026 — m²-Präisser pro Gemeng",
        "pt": "Índice preço imobiliário Luxemburgo 2026 — €/m² por comuna",
    },
    "marche": {
        "fr": "Marché immobilier Luxembourg — Prix, loyers, bureaux, commerces",
        "en": "Luxembourg Real Estate Market — Prices, Rents, Offices, Retail",
        "de": "Immobilienmarkt Luxemburg — Preise, Mieten, Büros, Einzelhandel",
        "lb": "Immobiliemaart Lëtzebuerg — Präisser, Locatiounen, Büroen",
        "pt": "Mercado imobiliário Luxemburgo — Preços, rendas, escritórios",
    },
    "vefa": {
        "fr": "Simulateur VEFA Luxembourg — Appels de fonds, TVA 3 %",
        "en": "Luxembourg VEFA Calculator — Off-Plan Payment Schedule, 3 % VAT",
        "de": "VEFA-Rechner Luxemburg — Off-Plan-Zahlungsplan, 3 % MwSt",
        "lb": "VEFA-Rechner Lëtzebuerg — Off-Plan-Bezuelplang, 3 % MwSt",
        "pt": "Calculadora VEFA Luxemburgo — Planeamento off-plan, IVA 3 %",
    },
    "energy/hvac": {
        "fr": "Simulateur HVAC Luxembourg — Dimensionnement et chiffrage",
        "en": "HVAC Simulator Luxembourg — Sizing, Products and Cost",
        "de": "HVAC-Simulator Luxemburg — Dimensionierung und Kosten",
        "lb": "HVAC-Simulator Lëtzebuerg — Dimensionéierung a Käschten",
        "pt": "Simulador HVAC Luxemburgo — Dimensionamento e Orçamento",
    },
}


TITLE_RE = re.compile(r'(\btitle:\s*)"[^"]*"')


def find_layout_file(slug: str, locale: str) -> Path | None:
    if locale == "fr":
        p = APP / slug / "layout.tsx"
    else:
        p = APP / locale / slug / "layout.tsx"
    return p if p.is_file() else None


def replace_first_title(path: Path, new_title: str) -> bool:
    text = path.read_text(encoding="utf-8")
    new_text, count = TITLE_RE.subn(f'\\1"{new_title}"', text, count=1)
    if count == 0:
        return False
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> None:
    for slug, by_locale in NEW_TITLES.items():
        for loc, title in by_locale.items():
            f = find_layout_file(slug, loc)
            if not f:
                print(f"[skip] {loc}/{slug} (file not found)")
                continue
            ok = replace_first_title(f, title)
            print(f"[{loc}] {slug}: {len(title)} chars  {'OK' if ok else '(no change)'}  {title}")


if __name__ == "__main__":
    main()
