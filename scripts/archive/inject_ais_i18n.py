"""Inject ais namespace into the 5 locale JSON files."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MSG = ROOT / "src" / "messages"

DATA: dict[str, dict] = {
    "fr": {
        "back": "\u2190 Gestion locative",
        "title": "Gestion locative sociale (AIS) \u2014 abattement 75 %",
        "subtitle": "Si vous louez votre bien via une Agence Immobili\u00e8re Sociale (AIS) partenaire, vous b\u00e9n\u00e9ficiez d'un abattement fiscal de 75 % sur les revenus locatifs (art. L. 162bis LIR, accord tripartite 03/2023). \u00c9conomie typique : 40-60 % d'imp\u00f4t en moins.",
        "abattement75": "Abattement fiscal 75 %",
        "publicInfo": "Orientation publique (pas de commission)",
        "calcTitle": "Calculateur d'\u00e9conomie fiscale",
        "loyerMensuel": "Loyer mensuel (\u20ac)",
        "chargesDeductibles": "Charges d\u00e9ductibles annuelles (\u20ac)",
        "chargesHint": "Int\u00e9r\u00eats emprunt + assurance PNO + charges copro + entretien + amortissement",
        "tauxMarginal": "Votre taux marginal d'imposition",
        "scenarioStandard": "Sc\u00e9nario location classique",
        "scenarioStandardHint": "Revenus locatifs imposables \u00e0 100 %",
        "scenarioAIS": "Sc\u00e9nario AIS (abattement 75 %)",
        "scenarioAISHint": "Seuls 25 % des revenus sont imposables",
        "economie": "\u00c9conomie annuelle",
        "economiePct": "soit {pct} % d'imp\u00f4t \u00e9conomis\u00e9",
        "conditionsTitle": "Conditions \u00e9ligibilit\u00e9",
        "cond1": "Mandat de gestion exclusif sign\u00e9 avec une AIS agr\u00e9\u00e9e (dur\u00e9e minimale 3 ans)",
        "cond2": "Respect du loyer encadr\u00e9 fix\u00e9 par l'AIS (g\u00e9n\u00e9ralement -10 \u00e0 -15 % vs march\u00e9)",
        "cond3": "Le bien doit \u00eatre d\u00e9cent (classe \u00e9nergie F/G exclues, normes minimales)",
        "cond4": "L'AIS s\u00e9lectionne les locataires \u00e9ligibles et garantit le paiement du loyer",
        "partnersTitle": "Partenaires AIS Luxembourg",
        "partnersSubtitle": "Liste non exhaustive d'agences AIS agr\u00e9\u00e9es \u2014 contact direct, pas d'interm\u00e9diaire tevaxia.",
        "zone": "Zone",
        "site": "Site web",
        "sourcesTitle": "Sources r\u00e9glementaires",
        "sourcesNote": "Toutes les informations proviennent de sources publiques. Tevaxia agr\u00e8ge les informations mais n'est pas en partenariat avec les AIS \u2014 vous contactez directement l'agence de votre choix.",
        "disclaimer": "Informations indicatives. Le montant exact de l'abattement d\u00e9pend de votre situation fiscale compl\u00e8te (autres revenus, charges familiales, etc.). Consultez votre fiscaliste ou l'ACD pour validation."
    },
    "en": {
        "back": "\u2190 Rental management",
        "title": "Social rental management (AIS) \u2014 75 % tax allowance",
        "subtitle": "If you rent via a partner Social Real Estate Agency (AIS), you benefit from a 75 % tax allowance on rental income (art. L. 162bis LIR, tripartite agreement 03/2023). Typical savings: 40-60 % less tax.",
        "abattement75": "75 % tax allowance",
        "publicInfo": "Public orientation (no commission)",
        "calcTitle": "Tax savings calculator",
        "loyerMensuel": "Monthly rent (\u20ac)",
        "chargesDeductibles": "Annual deductible costs (\u20ac)",
        "chargesHint": "Loan interest + PNO insurance + condo fees + maintenance + depreciation",
        "tauxMarginal": "Your marginal income tax rate",
        "scenarioStandard": "Standard rental scenario",
        "scenarioStandardHint": "Rental income taxed at 100 %",
        "scenarioAIS": "AIS scenario (75 % allowance)",
        "scenarioAISHint": "Only 25 % of income is taxable",
        "economie": "Annual savings",
        "economiePct": "i.e. {pct} % tax saved",
        "conditionsTitle": "Eligibility conditions",
        "cond1": "Exclusive management mandate signed with an approved AIS (min 3 years)",
        "cond2": "Capped rent set by AIS (typically -10 to -15 % vs market)",
        "cond3": "Decent property (F/G energy class excluded, minimum standards)",
        "cond4": "AIS selects eligible tenants and guarantees rent payment",
        "partnersTitle": "AIS partners in Luxembourg",
        "partnersSubtitle": "Non-exhaustive list of approved AIS \u2014 direct contact, no tevaxia intermediary.",
        "zone": "Area",
        "site": "Website",
        "sourcesTitle": "Regulatory sources",
        "sourcesNote": "All information comes from public sources. Tevaxia aggregates info but is not partnered with AIS \u2014 contact agencies directly.",
        "disclaimer": "Indicative figures. Actual allowance depends on your full tax situation. Consult a tax adviser or ACD for validation."
    },
    "de": {
        "back": "\u2190 Mietverwaltung",
        "title": "Soziale Mietverwaltung (AIS) \u2014 75 % Steuerfreibetrag",
        "subtitle": "Wenn Sie \u00fcber eine anerkannte AIS vermieten, erhalten Sie 75 % Steuerfreibetrag auf Mieteinnahmen (Art. L. 162bis LIR).",
        "abattement75": "75 % Steuerfreibetrag",
        "publicInfo": "\u00d6ffentliche Orientierung",
        "calcTitle": "Steuerersparnis-Rechner",
        "loyerMensuel": "Monatsmiete (\u20ac)",
        "chargesDeductibles": "J\u00e4hrlich abzugsf\u00e4hige Kosten (\u20ac)",
        "chargesHint": "Darlehenszinsen + PNO-Versicherung + WEG-Kosten + Instandhaltung + Abschreibung",
        "tauxMarginal": "Ihr Grenzsteuersatz",
        "scenarioStandard": "Standard Mietszenario",
        "scenarioStandardHint": "Mieteinnahmen zu 100 % steuerpflichtig",
        "scenarioAIS": "AIS-Szenario (75 % Freibetrag)",
        "scenarioAISHint": "Nur 25 % der Einnahmen steuerpflichtig",
        "economie": "J\u00e4hrliche Ersparnis",
        "economiePct": "{pct} % Steuer gespart",
        "conditionsTitle": "F\u00f6rderbedingungen",
        "cond1": "Exklusiver Verwaltungsauftrag mit anerkannter AIS (min. 3 Jahre)",
        "cond2": "Gedeckelte Miete durch AIS (typisch -10 bis -15 % vs Markt)",
        "cond3": "Wohngerechte Immobilie (Klasse F/G ausgeschlossen)",
        "cond4": "AIS w\u00e4hlt Mieter aus und garantiert Mietzahlung",
        "partnersTitle": "AIS-Partner in Luxemburg",
        "partnersSubtitle": "Nicht ersch\u00f6pfende Liste \u2014 direkter Kontakt.",
        "zone": "Gebiet",
        "site": "Webseite",
        "sourcesTitle": "Regulatorische Quellen",
        "sourcesNote": "Alle Informationen aus \u00f6ffentlichen Quellen. Keine Partnerschaft mit AIS.",
        "disclaimer": "Indikative Werte. Beratung durch Steuerberater oder ACD empfohlen."
    },
    "pt": {
        "back": "\u2190 Gest\u00e3o locativa",
        "title": "Gest\u00e3o locativa social (AIS) \u2014 abatimento 75 %",
        "subtitle": "Se aluga via uma Ag\u00eancia Imobili\u00e1ria Social (AIS) parceira, beneficia de abatimento fiscal 75 % sobre rendas (art. L. 162bis LIR).",
        "abattement75": "Abatimento fiscal 75 %",
        "publicInfo": "Orienta\u00e7\u00e3o p\u00fablica",
        "calcTitle": "Calculadora de poupan\u00e7a fiscal",
        "loyerMensuel": "Renda mensal (\u20ac)",
        "chargesDeductibles": "Encargos dedut\u00edveis anuais (\u20ac)",
        "chargesHint": "Juros empr\u00e9stimo + seguro PNO + encargos cond. + manuten\u00e7\u00e3o + amortiza\u00e7\u00e3o",
        "tauxMarginal": "Sua taxa marginal IR",
        "scenarioStandard": "Cen\u00e1rio padr\u00e3o",
        "scenarioStandardHint": "Rendas tributadas a 100 %",
        "scenarioAIS": "Cen\u00e1rio AIS (abat. 75 %)",
        "scenarioAISHint": "Apenas 25 % tribut\u00e1veis",
        "economie": "Poupan\u00e7a anual",
        "economiePct": "{pct} % imposto poupado",
        "conditionsTitle": "Condi\u00e7\u00f5es elegibilidade",
        "cond1": "Mandato exclusivo com AIS homologada (m\u00edn 3 anos)",
        "cond2": "Renda limitada pela AIS (-10 a -15 % vs mercado)",
        "cond3": "Bem decente (classe F/G exclu\u00eddas)",
        "cond4": "AIS seleciona inquilinos e garante pagamento",
        "partnersTitle": "Parceiros AIS Luxemburgo",
        "partnersSubtitle": "Lista n\u00e3o exaustiva \u2014 contacto direto.",
        "zone": "Zona",
        "site": "Site",
        "sourcesTitle": "Fontes regulamentares",
        "sourcesNote": "Todas as informa\u00e7\u00f5es s\u00e3o p\u00fablicas.",
        "disclaimer": "Valores indicativos."
    },
    "lb": {
        "back": "\u2190 Lokatiouns-Gestioun",
        "title": "Sozial Lokatiouns-Gestioun (AIS) \u2014 75 % Ofzuch",
        "subtitle": "Wann Dir iwwer eng AIS vermutt, kritt Dir 75 % Steierofzuch op de Mutten (Art. L. 162bis LIR).",
        "abattement75": "75 % Steierofzuch",
        "publicInfo": "\u00cbffentlech Orient\u00e9ierung",
        "calcTitle": "Steierersparnis-Rechner",
        "loyerMensuel": "Monatsmutt (\u20ac)",
        "chargesDeductibles": "Joerlech ofz\u00e9ibar Charges (\u20ac)",
        "chargesHint": "Prêts-Z\u00ebnsen + PNO + Charges cop. + Ennerhalung + Amortisatioun",
        "tauxMarginal": "\u00c4re marginalen Taux",
        "scenarioStandard": "Standard Zenario",
        "scenarioStandardHint": "Mutten 100 % steierbar",
        "scenarioAIS": "AIS-Zenario (75 % Ofzuch)",
        "scenarioAISHint": "Nëmme 25 % steierbar",
        "economie": "Joeresspuerunken",
        "economiePct": "{pct} % Steier gespuert",
        "conditionsTitle": "Konditioune vun der \u00c9ligibilit\u00e9it",
        "cond1": "Exklusiven Gestiounsmandat mat enger AIS (Minimum 3 Joer)",
        "cond2": "Mutt limit\u00e9iert vun der AIS (typesch -10 bis -15 % vs Marché)",
        "cond3": "Uge\u00e7uch Bien (Klass F/G ausgeschloss)",
        "cond4": "AIS w\u00e4hlt Locatairen aus a garant\u00e9iert Zuelen",
        "partnersTitle": "AIS-Partner zu L\u00ebtzebuerg",
        "partnersSubtitle": "N\u00ebt ersch\u00f6pfend Lëscht \u2014 direkten Kontakt.",
        "zone": "Zon",
        "site": "Websäit",
        "sourcesTitle": "Reglementaresch Quellen",
        "sourcesNote": "All Informatiounen aus \u00f6ffentleche Quellen.",
        "disclaimer": "Indikativ Wäerter."
    }
}


def main() -> None:
    for loc, values in DATA.items():
        p = MSG / f"{loc}.json"
        d = json.load(open(p, encoding="utf-8"))
        d["ais"] = values
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{loc}: OK")


if __name__ == "__main__":
    main()
