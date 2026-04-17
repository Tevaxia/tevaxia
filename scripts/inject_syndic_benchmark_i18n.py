"""Inject syndicBenchmark namespace into the 5 locale JSON files."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MSG = ROOT / "src" / "messages"

DATA: dict[str, dict] = {
    "fr": {
        "loginPrompt": "Connectez-vous pour accéder au benchmark inter-copropriétés.",
        "loginButton": "Se connecter",
        "back": "← Copropriétés",
        "title": "Benchmark inter-copropriétés",
        "subtitle": "Comparez les KPIs de toutes les copropriétés sous gestion de votre cabinet. Les percentiles sont calculés au sein de votre portefeuille — vert = top 25 %, ambre = milieu de tableau, rouge = bas 25 %.",
        "cabinetLabel": "Cabinet :",
        "loading": "Chargement…",
        "needTwo": "Au moins 2 copropriétés sont nécessaires pour générer un benchmark significatif.",
        "manageCopros": "Gérer mes copropriétés",
        "colCopro": "Copropriété",
        "colLots": "Lots",
        "colSurface": "Surface",
        "colBudget": "Budget {year}",
        "colChargesM2": "Charges €/m²",
        "colFundsM2": "Fonds trav. €/m²",
        "colRecouvrement": "Recouvrement",
        "colRetard": "Retard moy.",
        "colRelances": "Relances/lot",
        "colSyndicLot": "Syndic €/lot",
        "colScore": "Score",
        "hintChargesM2": "Budget annuel ramené au m² de surface cumulée. Plus c'est bas, mieux c'est (efficience).",
        "hintFundsM2": "Fonds de travaux accumulés par m². Plus c'est haut, mieux c'est (provision).",
        "hintRecouvrement": "Pourcentage encaissé sur les appels émis. Objectif ≥ 95 %.",
        "hintRetard": "Nombre de jours moyens entre la date d'échéance et la date de paiement. Objectif < 7 j.",
        "hintScore": "Score composite (0-100) basé sur les percentiles des 5 KPIs principaux dans votre portefeuille.",
        "methodology": "Méthodologie : les KPIs sont calculés en temps réel à partir des données de votre portefeuille. Les percentiles sont relatifs — ils ne comparent pas à un marché national. Pour une comparaison plus large (ex. benchmark national moyen), contactez-nous."
    },
    "en": {
        "loginPrompt": "Sign in to access the cross-coownership benchmark.",
        "loginButton": "Sign in",
        "back": "← Coownerships",
        "title": "Portfolio benchmark",
        "subtitle": "Compare KPIs across all coownerships managed by your firm. Percentiles are computed within your portfolio — green = top 25%, amber = middle, red = bottom 25%.",
        "cabinetLabel": "Firm:",
        "loading": "Loading…",
        "needTwo": "At least 2 coownerships are needed to produce a meaningful benchmark.",
        "manageCopros": "Manage coownerships",
        "colCopro": "Coownership",
        "colLots": "Units",
        "colSurface": "Surface",
        "colBudget": "Budget {year}",
        "colChargesM2": "Charges €/m²",
        "colFundsM2": "Works fund €/m²",
        "colRecouvrement": "Collection rate",
        "colRetard": "Avg delay",
        "colRelances": "Reminders/unit",
        "colSyndicLot": "Syndic €/unit",
        "colScore": "Score",
        "hintChargesM2": "Annual budget per sqm of total surface. Lower is better (efficiency).",
        "hintFundsM2": "Accumulated works fund per sqm. Higher is better (reserves).",
        "hintRecouvrement": "Percentage collected on issued calls. Target ≥ 95%.",
        "hintRetard": "Average days between due date and payment date. Target < 7 days.",
        "hintScore": "Composite score (0-100) based on percentiles of the 5 main KPIs in your portfolio.",
        "methodology": "Methodology: KPIs are computed in real-time from your portfolio data. Percentiles are relative — they don't compare to a national market baseline. For broader benchmarking, contact us."
    },
    "de": {
        "loginPrompt": "Melden Sie sich an, um auf den WEG-Benchmark zuzugreifen.",
        "loginButton": "Anmelden",
        "back": "← Wohneigentum",
        "title": "Portfolio-Benchmark",
        "subtitle": "Vergleichen Sie KPIs über alle von Ihrer Verwaltung betreuten WEGs. Perzentile werden innerhalb Ihres Portfolios berechnet — grün = Top 25 %, gelb = Mitte, rot = untere 25 %.",
        "cabinetLabel": "Verwaltung:",
        "loading": "Lädt…",
        "needTwo": "Mindestens 2 WEGs erforderlich, um einen aussagekräftigen Benchmark zu erstellen.",
        "manageCopros": "WEGs verwalten",
        "colCopro": "WEG",
        "colLots": "Einheiten",
        "colSurface": "Fläche",
        "colBudget": "Budget {year}",
        "colChargesM2": "Kosten €/m²",
        "colFundsM2": "Rücklage €/m²",
        "colRecouvrement": "Inkasso-Quote",
        "colRetard": "Ø Verzug",
        "colRelances": "Mahnungen/Einh.",
        "colSyndicLot": "Verwaltung €/Einh.",
        "colScore": "Score",
        "hintChargesM2": "Jahresbudget pro m² Gesamtfläche. Niedriger ist besser (Effizienz).",
        "hintFundsM2": "Angesammelte Instandhaltungsrücklage pro m². Höher ist besser (Reserve).",
        "hintRecouvrement": "Anteil der eingegangenen Zahlungen auf ausgestellte Forderungen. Ziel ≥ 95 %.",
        "hintRetard": "Durchschnittliche Tage zwischen Fälligkeit und Zahlung. Ziel < 7 Tage.",
        "hintScore": "Composite-Score (0-100) basierend auf Perzentilen der 5 Haupt-KPIs im Portfolio.",
        "methodology": "Methodik: KPIs werden in Echtzeit aus Ihren Portfoliodaten berechnet. Die Perzentile sind relativ — sie vergleichen nicht mit einem nationalen Marktbenchmark."
    },
    "pt": {
        "loginPrompt": "Inicie sessão para aceder ao benchmark de condomínios.",
        "loginButton": "Iniciar sessão",
        "back": "← Condomínios",
        "title": "Benchmark de portefólio",
        "subtitle": "Compare KPIs de todos os condomínios sob gestão do seu escritório. Os percentis são calculados no seu portefólio — verde = top 25 %, âmbar = meio, vermelho = últimos 25 %.",
        "cabinetLabel": "Escritório:",
        "loading": "A carregar…",
        "needTwo": "São necessários pelo menos 2 condomínios para gerar um benchmark significativo.",
        "manageCopros": "Gerir condomínios",
        "colCopro": "Condomínio",
        "colLots": "Frações",
        "colSurface": "Área",
        "colBudget": "Orçamento {year}",
        "colChargesM2": "Encargos €/m²",
        "colFundsM2": "Fundo obras €/m²",
        "colRecouvrement": "Taxa cobrança",
        "colRetard": "Atraso médio",
        "colRelances": "Cartas/fração",
        "colSyndicLot": "Admin. €/fração",
        "colScore": "Pontuação",
        "hintChargesM2": "Orçamento anual por m² de área total. Quanto mais baixo, melhor (eficiência).",
        "hintFundsM2": "Fundo de obras acumulado por m². Quanto mais alto, melhor (reserva).",
        "hintRecouvrement": "Percentagem cobrada sobre os valores emitidos. Objetivo ≥ 95 %.",
        "hintRetard": "Dias médios entre a data de vencimento e a data de pagamento. Objetivo < 7 d.",
        "hintScore": "Pontuação composta (0-100) baseada nos percentis dos 5 KPIs principais no portefólio.",
        "methodology": "Metodologia: os KPIs são calculados em tempo real a partir dos dados do portefólio. Os percentis são relativos — não comparam com um benchmark nacional."
    },
    "lb": {
        "loginPrompt": "Mellt Iech un, fir Zougang zum Portfolio-Benchmark ze kréien.",
        "loginButton": "Umellen",
        "back": "← Matproprietéiten",
        "title": "Portfolio-Benchmark",
        "subtitle": "Vergläicht d'KPIs vun all de Matproprietéiten, déi Äert Cabinet verwalt. Perzentillen ginn am Portfolio berechent — gréng = Top 25 %, gielw = Mëtt, rout = ënnescht 25 %.",
        "cabinetLabel": "Cabinet:",
        "loading": "Lued…",
        "needTwo": "Op d'mannst 2 Matproprietéiten néideg fir e sënnvolle Benchmark.",
        "manageCopros": "Matproprietéite geréieren",
        "colCopro": "Matproprietéit",
        "colLots": "Louten",
        "colSurface": "Surface",
        "colBudget": "Budget {year}",
        "colChargesM2": "Käschten €/m²",
        "colFundsM2": "Aarbechtsfong €/m²",
        "colRecouvrement": "Agank-Quot",
        "colRetard": "Ø Verspéidung",
        "colRelances": "Rappell/Lout",
        "colSyndicLot": "Syndic €/Lout",
        "colScore": "Score",
        "hintChargesM2": "Joeresbudget pro m² Gesamtfläch. Méi niddereg ass besser (Effizienz).",
        "hintFundsM2": "Ugesammelt Aarbechtsfong pro m². Méi héich ass besser (Reserv).",
        "hintRecouvrement": "Prozentsaz vun de kasséierten Zuelungen op ausgestallt Rechnungen. Zil ≥ 95 %.",
        "hintRetard": "Duerchschnëttsdeeg tëscht Fällegkeet an Zuelung. Zil < 7 Deeg.",
        "hintScore": "Composite Score (0-100) baséiert op Perzentillen vun de 5 Haapt-KPIs am Portfolio.",
        "methodology": "Methodik: KPIs ginn an Echtzäit aus Äre Portfoliodaten berechent. D'Perzentillen si relativ — se vergläichen net mat engem nationale Marchéebenchmark."
    }
}


def main() -> None:
    for loc, values in DATA.items():
        p = MSG / f"{loc}.json"
        d = json.load(open(p, encoding="utf-8"))
        d["syndicBenchmark"] = values
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{loc}: OK")


if __name__ == "__main__":
    main()
