"""Inject marcheForecast namespace into 5 locale files."""
from __future__ import annotations
import json
from pathlib import Path

MSG = Path(__file__).resolve().parent.parent / "src" / "messages"

DATA = {
    "fr": {
        "back": "\u2190 March\u00e9",
        "title": "Pr\u00e9visions prix immobilier 12-48 mois",
        "subtitle": "Projection 3 sc\u00e9narios (pessimiste, central, optimiste) par commune, bas\u00e9e sur les trends historiques STATEC / Observatoire Habitat. Outil d'aide \u00e0 la d\u00e9cision pour acheteurs / vendeurs.",
        "badgeData": "Donn\u00e9es STATEC / Observatoire Habitat",
        "badgeDisclaimer": "Projection indicative, non garantie",
        "commune": "Commune",
        "communePlaceholder": "Rechercher une commune luxembourgeoise...",
        "currentPrice": "Prix m\u00b2 actuel",
        "horizon": "Horizon :",
        "months": "mois",
        "pessimiste": "Pessimiste",
        "central": "Central",
        "optimiste": "Optimiste",
        "cagrReference": "CAGR historique 5 ans : {cagr} %/an",
        "chartTitle": "\u00c9volution prix m\u00b2",
        "historical": "Historique (national \u00d7 ratio commune)",
        "chartNote": "Courbes en pointill\u00e9s = projections (zone apr\u00e8s le pic historique). Les projections supposent une croissance constante ; la r\u00e9alit\u00e9 comporte des inflexions (crise de taux, r\u00e9forme fiscale, accord tripartite, cycle \u00e9conomique).",
        "methodTitle": "M\u00e9thodologie",
        "methodHistorical": "Historique national : PRIX_MOYEN_M2 STATEC/Observatoire 2015-2026, interpol\u00e9 mensuellement pour la visualisation.",
        "methodRatio": "Ajustement commune : ratio prix commune actuel / prix national actuel appliqu\u00e9 \u00e0 l'historique (approximation — le ratio varie dans le temps dans la r\u00e9alit\u00e9).",
        "methodProjection": "Projection : croissance annuelle compos\u00e9e selon chaque sc\u00e9nario, convertie en taux mensuel.",
        "methodDisclaimer": "Outil indicatif. Pour une \u00e9valuation officielle ou une d\u00e9cision d'investissement, consultez un \u00e9valuateur certifi\u00e9 TEGOVA REV/TRV ou utilisez /valorisation EVS 2025."
    },
    "en": {
        "back": "\u2190 Market",
        "title": "Real estate price forecast 12-48 months",
        "subtitle": "3-scenario projection (pessimistic, central, optimistic) by commune, based on STATEC / Housing Observatory historical trends.",
        "badgeData": "STATEC / Housing Observatory data",
        "badgeDisclaimer": "Indicative projection, not guaranteed",
        "commune": "Commune",
        "communePlaceholder": "Search a Luxembourg commune...",
        "currentPrice": "Current price/sqm",
        "horizon": "Horizon:",
        "months": "months",
        "pessimiste": "Pessimistic",
        "central": "Central",
        "optimiste": "Optimistic",
        "cagrReference": "5-year historical CAGR: {cagr} %/yr",
        "chartTitle": "Price/sqm evolution",
        "historical": "Historical (national \u00d7 commune ratio)",
        "chartNote": "Dashed lines = projections. Assumes constant growth; reality includes inflections (rate crises, fiscal reform, economic cycle).",
        "methodTitle": "Methodology",
        "methodHistorical": "National history: STATEC/Observatory PRIX_MOYEN_M2 2015-2026, monthly interpolation.",
        "methodRatio": "Commune adjustment: current commune/national ratio applied to history.",
        "methodProjection": "Projection: compound annual growth per scenario.",
        "methodDisclaimer": "Indicative tool. For official valuation use /valorisation EVS 2025 or a TEGOVA REV/TRV expert."
    },
    "de": {
        "back": "\u2190 Markt",
        "title": "Immobilienpreis-Prognose 12-48 Monate",
        "subtitle": "3-Szenarien-Projektion (pessimistisch, zentral, optimistisch) pro Gemeinde, basierend auf STATEC / Wohnbeobachtung historischen Trends.",
        "badgeData": "STATEC / Wohnbeobachtung Daten",
        "badgeDisclaimer": "Indikative Projektion, nicht garantiert",
        "commune": "Gemeinde",
        "communePlaceholder": "Luxemburger Gemeinde suchen...",
        "currentPrice": "Aktueller Preis/m\u00b2",
        "horizon": "Horizont:",
        "months": "Monate",
        "pessimiste": "Pessimistisch",
        "central": "Zentral",
        "optimiste": "Optimistisch",
        "cagrReference": "Historische 5-J-CAGR: {cagr} %/J",
        "chartTitle": "Preis/m\u00b2 Entwicklung",
        "historical": "Historie (national \u00d7 Gemeindeverh\u00e4ltnis)",
        "chartNote": "Gestrichelte Linien = Projektionen.",
        "methodTitle": "Methodik",
        "methodHistorical": "Nationale Historie STATEC/Observatoire.",
        "methodRatio": "Gemeindeanpassung durch Verh\u00e4ltnis.",
        "methodProjection": "Zinseszins pro Szenario.",
        "methodDisclaimer": "Indikativ. F\u00fcr offizielle Bewertung /valorisation EVS 2025."
    },
    "pt": {
        "back": "\u2190 Mercado",
        "title": "Previs\u00e3o pre\u00e7os imobili\u00e1rios 12-48 meses",
        "subtitle": "Projec\u00e7\u00e3o 3 cen\u00e1rios por comuna, baseada em tend\u00eancias STATEC / Observat\u00f3rio Habita\u00e7\u00e3o.",
        "badgeData": "Dados STATEC / Observat\u00f3rio",
        "badgeDisclaimer": "Projec\u00e7\u00e3o indicativa, n\u00e3o garantida",
        "commune": "Comuna",
        "communePlaceholder": "Pesquisar comuna luxemburguesa...",
        "currentPrice": "Pre\u00e7o m\u00b2 atual",
        "horizon": "Horizonte:",
        "months": "meses",
        "pessimiste": "Pessimista",
        "central": "Central",
        "optimiste": "Otimista",
        "cagrReference": "CAGR hist\u00f3rico 5 anos: {cagr} %/ano",
        "chartTitle": "Evolu\u00e7\u00e3o pre\u00e7o/m\u00b2",
        "historical": "Hist\u00f3rico",
        "chartNote": "Linhas tracejadas = projec\u00e7\u00f5es.",
        "methodTitle": "Metodologia",
        "methodHistorical": "Hist\u00f3rico nacional STATEC.",
        "methodRatio": "Ajuste comuna por r\u00e1cio.",
        "methodProjection": "Capitaliza\u00e7\u00e3o composta por cen\u00e1rio.",
        "methodDisclaimer": "Indicativo. Para avalia\u00e7\u00e3o oficial /valorisation."
    },
    "lb": {
        "back": "\u2190 March\u00e9",
        "title": "Prognos Immobilie-Pr\u00e4isser 12-48 M\u00e9int",
        "subtitle": "3-Szenarien-Projektioun pro Gemeng, baséiert op STATEC / Observatoire Donn\u00e9eën.",
        "badgeData": "STATEC Donn\u00e9eën",
        "badgeDisclaimer": "Indikativ, net garant\u00e9iert",
        "commune": "Gemeng",
        "communePlaceholder": "L\u00ebtzebuerger Gemeng sichen...",
        "currentPrice": "Aktuellen Pr\u00e4is/m\u00b2",
        "horizon": "Horizont:",
        "months": "M\u00e9int",
        "pessimiste": "Pessimistesch",
        "central": "Zentral",
        "optimiste": "Optimistesch",
        "cagrReference": "Historesch 5-J CAGR: {cagr} %/J",
        "chartTitle": "Pr\u00e4is/m\u00b2 Entw\u00e9cklung",
        "historical": "Historesch",
        "chartNote": "Gestréchelt Linnen = Projektiounen.",
        "methodTitle": "Methodik",
        "methodHistorical": "National Historique STATEC.",
        "methodRatio": "Gemeng Upassung.",
        "methodProjection": "Zinseszinn pro Szenario.",
        "methodDisclaimer": "Indikativ. Fir offiziell Evaluatioun /valorisation."
    }
}


def main() -> None:
    for loc, vals in DATA.items():
        p = MSG / f"{loc}.json"
        d = json.load(open(p, encoding="utf-8"))
        d["marcheForecast"] = vals
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{loc}: OK")


if __name__ == "__main__":
    main()
