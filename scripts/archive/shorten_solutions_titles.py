#!/usr/bin/env python3
"""Shorten solutions.<persona>.meta.title across all 5 message files."""
import json
from pathlib import Path

MSG_DIR = Path(__file__).parent.parent / "src" / "messages"

# slug -> { lang: short_title }
NEW = {
    "agence": {
        "fr": "CRM agence immobilière Luxembourg — pipeline et OpenImmo",
        "en": "Luxembourg real estate agency CRM — pipeline and OpenImmo",
        "de": "Immobilienmakler-CRM Luxemburg — Pipeline und OpenImmo",
        "lb": "Immobilienagence-CRM Lëtzebuerg — Pipeline an OpenImmo",
        "pt": "CRM agência imobiliária Luxemburgo — pipeline e OpenImmo",
    },
    "investisseur": {
        "fr": "Simulateur investissement immobilier Luxembourg — DCF, fiscalité",
        "en": "Luxembourg property investment simulator — DCF, tax",
        "de": "Immobilien-Investitionsrechner Luxemburg — DCF, Steuern",
        "lb": "Immobilien-Investissementsrechner Lëtzebuerg — DCF, Steieren",
        "pt": "Simulador investimento imobiliário Luxemburgo — DCF, fiscal",
    },
    "particulier": {
        "fr": "Outils immobiliers particuliers Luxembourg — estimation, aides",
        "en": "Personal real estate tools Luxembourg — valuation, subsidies",
        "de": "Immobilien-Tools für Privatpersonen Luxemburg — Bewertung",
        "lb": "Immobilien-Tools fir Privatpersounen Lëtzebuerg — Evaluatioun",
        "pt": "Ferramentas imobiliárias particulares Luxemburgo — avaliação",
    },
    "promoteur": {
        "fr": "Logiciel promoteur immobilier Luxembourg — bilan, VEFA, coûts",
        "en": "Luxembourg property developer software — pro forma, VEFA, costs",
        "de": "Bauträger-Software Luxemburg — Wirtschaftlichkeit, VEFA, Kosten",
        "lb": "Bauträger-Software Lëtzebuerg — Wirtschaftlechkeet, VEFA, Käschten",
        "pt": "Software promotor imobiliário Luxemburgo — pro forma, VEFA, custos",
    },
    "banque": {
        "fr": "Valorisation immobilière banques Luxembourg — CRR, LTV, DSCR",
        "en": "Real estate valuation for banks Luxembourg — CRR, LTV, DSCR",
        "de": "Immobilienbewertung für Banken Luxemburg — CRR, LTV, DSCR",
        "lb": "Immobilienevaluatioun fir Banken Lëtzebuerg — CRR, LTV, DSCR",
        "pt": "Avaliação imobiliária para bancos Luxemburgo — CRR, LTV, DSCR",
    },
    "hotel": {
        "fr": "PMS hôtel Luxembourg — USALI, TVA 3 %, forecast, channels",
        "en": "Luxembourg hotel PMS — USALI, 3 % VAT, forecast, channels",
        "de": "Hotel-PMS Luxemburg — USALI, 3 % MwSt, Forecast, Channels",
        "lb": "Hotel-PMS Lëtzebuerg — USALI, 3 % MwSt, Forecast, Channels",
        "pt": "PMS hoteleiro Luxemburgo — USALI, IVA 3 %, forecast, channels",
    },
}


def main() -> None:
    for loc in ["fr", "en", "de", "lb", "pt"]:
        path = MSG_DIR / f"{loc}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        sols = data.setdefault("solutions", {})
        for slug, by_lang in NEW.items():
            if slug not in sols or "meta" not in sols[slug]:
                continue
            t = by_lang.get(loc)
            if not t:
                continue
            old = sols[slug]["meta"].get("title", "")
            sols[slug]["meta"]["title"] = t
            print(f"[{loc}] {slug}: {len(old)} -> {len(t)}  {t}")
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
