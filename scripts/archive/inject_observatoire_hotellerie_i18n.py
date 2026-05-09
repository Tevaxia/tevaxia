"""Inject observatoireHotellerie namespace into the 5 locale JSON files."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MSG = ROOT / "src" / "messages"

DATA: dict[str, dict] = {
    "fr": {
        "backHub": "\u2190 H\u00f4tellerie",
        "title": "Observatoire h\u00f4telier Luxembourg",
        "subtitle": "Taux d'occupation, nuit\u00e9es, RevPAR national et par cat\u00e9gorie. Donn\u00e9es publiques STATEC + Eurostat + STR EMEA \u2014 alternative gratuite aux panels payants STR Global / Horwath.",
        "publicData": "Donn\u00e9es publiques",
        "noSignup": "Aucun compte requis",
        "kpiNights": "Nuit\u00e9es {year}",
        "kpiOcc": "Occupation moyenne",
        "kpiAdrNat": "ADR national",
        "kpiAdrNatHint": "Moyenne pond\u00e9r\u00e9e",
        "kpiRevPARNat": "RevPAR national",
        "kpiRevPARNatHint": "ADR \u00d7 occupation",
        "yearFilter": "Ann\u00e9e :",
        "chartMonthlyTitle": "Nuit\u00e9es & occupation mensuelles {year}",
        "chartMonthlySubtitle": "Saisonnalit\u00e9 LU classique \u2014 creux janvier/d\u00e9cembre, pics juin-ao\u00fbt",
        "legendNights": "Nuit\u00e9es",
        "legendOccupancy": "Occupation %",
        "chartCategoryTitle": "Performance par cat\u00e9gorie {year}",
        "chartCategorySubtitle": "1-2\u2605 / 3\u2605 / 4\u2605 / 5\u2605 \u2014 ADR STR EMEA pond\u00e9r\u00e9",
        "colCategory": "Cat\u00e9gorie",
        "colOccupancy": "Occ.",
        "colAdr": "ADR",
        "colRevPAR": "RevPAR",
        "colNights": "Nuit\u00e9es",
        "chartOriginTitle": "Provenance des clients",
        "chartOriginSubtitle": "STATEC B5200 \u2014 nuit\u00e9es par pays de r\u00e9sidence 2025",
        "sourcesTitle": "Sources publiques utilis\u00e9es",
        "sourcesNote": "Toutes les donn\u00e9es proviennent de sources publiques. Aucun partenariat commercial n\u00e9cessaire. Tevaxia agr\u00e8ge + harmonise pour vous \u00e9pargner la friction.",
        "disclaimer": "Les valeurs trimestrielles sont publi\u00e9es avec 2-3 mois de d\u00e9calage par STATEC. Les ADR par cat\u00e9gorie sont des estimations pond\u00e9r\u00e9es \u00e0 partir de STR EMEA + observatoire tevaxia."
    },
    "en": {
        "backHub": "\u2190 Hospitality",
        "title": "Luxembourg hotel observatory",
        "subtitle": "National occupancy, nights, RevPAR by category. Public data STATEC + Eurostat + STR EMEA \u2014 free alternative to paid STR Global / Horwath panels.",
        "publicData": "Public data",
        "noSignup": "No signup required",
        "kpiNights": "Nights {year}",
        "kpiOcc": "Average occupancy",
        "kpiAdrNat": "National ADR",
        "kpiAdrNatHint": "Weighted average",
        "kpiRevPARNat": "National RevPAR",
        "kpiRevPARNatHint": "ADR \u00d7 occupancy",
        "yearFilter": "Year:",
        "chartMonthlyTitle": "Monthly nights & occupancy {year}",
        "chartMonthlySubtitle": "Classic LU seasonality \u2014 troughs in Jan/Dec, peaks Jun-Aug",
        "legendNights": "Nights",
        "legendOccupancy": "Occupancy %",
        "chartCategoryTitle": "Performance by category {year}",
        "chartCategorySubtitle": "1-2\u2605 / 3\u2605 / 4\u2605 / 5\u2605 \u2014 weighted STR EMEA ADR",
        "colCategory": "Category",
        "colOccupancy": "Occ.",
        "colAdr": "ADR",
        "colRevPAR": "RevPAR",
        "colNights": "Nights",
        "chartOriginTitle": "Guest origin",
        "chartOriginSubtitle": "STATEC B5200 \u2014 nights by country of residence 2025",
        "sourcesTitle": "Public sources used",
        "sourcesNote": "All data comes from public sources. No commercial partnership required.",
        "disclaimer": "Quarterly data published with 2-3 month lag by STATEC. Category ADRs are weighted estimates."
    },
    "de": {
        "backHub": "\u2190 Hotellerie",
        "title": "Hotelobservatorium Luxemburg",
        "subtitle": "Nationale Belegung, \u00dcbernachtungen, RevPAR nach Kategorie. \u00d6ffentliche Daten STATEC + Eurostat + STR EMEA \u2014 kostenlose Alternative zu kostenpflichtigen Panels.",
        "publicData": "\u00d6ffentliche Daten",
        "noSignup": "Keine Anmeldung erforderlich",
        "kpiNights": "\u00dcbernachtungen {year}",
        "kpiOcc": "Durchschnittliche Belegung",
        "kpiAdrNat": "Nationale ADR",
        "kpiAdrNatHint": "Gewichteter Durchschnitt",
        "kpiRevPARNat": "Nationale RevPAR",
        "kpiRevPARNatHint": "ADR \u00d7 Belegung",
        "yearFilter": "Jahr:",
        "chartMonthlyTitle": "Monatliche \u00dcbernachtungen & Belegung {year}",
        "chartMonthlySubtitle": "Klassische LU-Saisonalit\u00e4t \u2014 Tiefs Jan/Dez, H\u00f6hepunkte Jun-Aug",
        "legendNights": "\u00dcbernachtungen",
        "legendOccupancy": "Belegung %",
        "chartCategoryTitle": "Performance nach Kategorie {year}",
        "chartCategorySubtitle": "1-2\u2605 / 3\u2605 / 4\u2605 / 5\u2605 \u2014 gewichtete STR EMEA ADR",
        "colCategory": "Kategorie",
        "colOccupancy": "Bel.",
        "colAdr": "ADR",
        "colRevPAR": "RevPAR",
        "colNights": "\u00dcbern.",
        "chartOriginTitle": "G\u00e4steherkunft",
        "chartOriginSubtitle": "STATEC B5200 \u2014 \u00dcbernachtungen nach Wohnsitzland 2025",
        "sourcesTitle": "Verwendete \u00f6ffentliche Quellen",
        "sourcesNote": "Alle Daten stammen aus \u00f6ffentlichen Quellen.",
        "disclaimer": "Quartalsdaten werden von STATEC mit 2-3 Monaten Verz\u00f6gerung ver\u00f6ffentlicht."
    },
    "pt": {
        "backHub": "\u2190 Hotelaria",
        "title": "Observat\u00f3rio hoteleiro Luxemburgo",
        "subtitle": "Ocupa\u00e7\u00e3o nacional, dormidas, RevPAR por categoria. Dados p\u00fablicos STATEC + Eurostat + STR EMEA.",
        "publicData": "Dados p\u00fablicos",
        "noSignup": "Sem registo",
        "kpiNights": "Dormidas {year}",
        "kpiOcc": "Ocupa\u00e7\u00e3o m\u00e9dia",
        "kpiAdrNat": "ADR nacional",
        "kpiAdrNatHint": "M\u00e9dia ponderada",
        "kpiRevPARNat": "RevPAR nacional",
        "kpiRevPARNatHint": "ADR \u00d7 ocupa\u00e7\u00e3o",
        "yearFilter": "Ano:",
        "chartMonthlyTitle": "Dormidas & ocupa\u00e7\u00e3o mensais {year}",
        "chartMonthlySubtitle": "Sazonalidade LU cl\u00e1ssica \u2014 m\u00ednimos jan/dez, picos jun-ago",
        "legendNights": "Dormidas",
        "legendOccupancy": "Ocupa\u00e7\u00e3o %",
        "chartCategoryTitle": "Performance por categoria {year}",
        "chartCategorySubtitle": "1-2\u2605 / 3\u2605 / 4\u2605 / 5\u2605 \u2014 ADR STR EMEA ponderado",
        "colCategory": "Categoria",
        "colOccupancy": "Oc.",
        "colAdr": "ADR",
        "colRevPAR": "RevPAR",
        "colNights": "Dormidas",
        "chartOriginTitle": "Origem dos h\u00f3spedes",
        "chartOriginSubtitle": "STATEC B5200 \u2014 dormidas por pa\u00eds de resid\u00eancia 2025",
        "sourcesTitle": "Fontes p\u00fablicas utilizadas",
        "sourcesNote": "Todos os dados prov\u00eam de fontes p\u00fablicas.",
        "disclaimer": "Dados trimestrais publicados com 2-3 meses de atraso pela STATEC."
    },
    "lb": {
        "backHub": "\u2190 Hotellerie",
        "title": "Hotel-Observatoire L\u00ebtzebuerg",
        "subtitle": "National Occupatioun, Nuechten, RevPAR no Kategorie. \u00cbffentlech Donn\u00e9e\u00eb STATEC + Eurostat + STR EMEA.",
        "publicData": "\u00cbffentlech Donn\u00e9e\u00ebn",
        "noSignup": "Keng Umeldung n\u00e9ideg",
        "kpiNights": "Nuechten {year}",
        "kpiOcc": "Duerchschn\u00ebttlech Occupatioun",
        "kpiAdrNat": "National ADR",
        "kpiAdrNatHint": "Gewiichten Duerchschn\u00ebtt",
        "kpiRevPARNat": "National RevPAR",
        "kpiRevPARNatHint": "ADR \u00d7 Occupatioun",
        "yearFilter": "Joer:",
        "chartMonthlyTitle": "Monatlech Nuechten & Occupatioun {year}",
        "chartMonthlySubtitle": "Klassesch LU-Saisonalit\u00e9it",
        "legendNights": "Nuechten",
        "legendOccupancy": "Occupatioun %",
        "chartCategoryTitle": "Performance no Kategorie {year}",
        "chartCategorySubtitle": "1-2\u2605 / 3\u2605 / 4\u2605 / 5\u2605",
        "colCategory": "Kategorie",
        "colOccupancy": "Occ.",
        "colAdr": "ADR",
        "colRevPAR": "RevPAR",
        "colNights": "Nuechten",
        "chartOriginTitle": "Hierkonft vun den Clienten",
        "chartOriginSubtitle": "STATEC B5200 \u2014 Nuechten no Wunns\u00ebtzland 2025",
        "sourcesTitle": "Benotzt \u00f6ffentlech Quellen",
        "sourcesNote": "All Donn\u00e9e\u00eb kommen aus \u00f6ffentleche Quellen.",
        "disclaimer": "Trimestriell Donn\u00e9e\u00eb publiz\u00e9iert mat 2-3 M\u00e9int Delai."
    }
}


def main() -> None:
    for loc, values in DATA.items():
        p = MSG / f"{loc}.json"
        d = json.load(open(p, encoding="utf-8"))
        d["observatoireHotellerie"] = values
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{loc}: OK")


if __name__ == "__main__":
    main()
