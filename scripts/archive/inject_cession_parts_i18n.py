"""Inject cession-parts keys into plusValues namespace."""
from __future__ import annotations
import json
from pathlib import Path

MSG = Path(__file__).resolve().parent.parent / "src" / "messages"

DATA = {
    "fr": {
        "cessionPartsLabel": "Cession de parts sociales (SCI / SARL-S immobili\u00e8re)",
        "cessionPartsHint": "Vous c\u00e9dez des parts plut\u00f4t que le bien lui-m\u00eame (r\u00e9gime art. 100 LIR)",
        "cessionPartsRegime": "Cession de parts \u2014 Article 100 LIR",
        "pctDetention": "% de d\u00e9tention dans la soci\u00e9t\u00e9",
        "anneeDetentionParts": "Ann\u00e9e d'acquisition des parts",
        "valeurParts": "Prix d'acquisition des parts",
        "prixCessionParts": "Prix de cession des parts",
        "cessionPartsDuree": "Dur\u00e9e d\u00e9tention",
        "cessionPartsGain": "Gain sur parts",
        "cessionPartsRegimeFiscal": "R\u00e9gime fiscal",
        "cessionPartsAns": "ans",
        "cessionPartsSpec": "Sp\u00e9culation (\u2264 6 mois)",
        "cessionPartsCession": "Cession longue (> 6 mois)",
        "cessionPartsImpot": "Imp\u00f4t estim\u00e9",
        "cessionPartsTaux": "Taux effectif appliqu\u00e9 : {taux} %",
        "cessionPartsRegleTitle": "R\u00e8gles cl\u00e9s",
        "cessionPartsRegle1": "Participation substantielle = d\u00e9tention \u2265 10 % au cours des 5 derni\u00e8res ann\u00e9es (art. 100 LIR)",
        "cessionPartsRegle2": "Si participation substantielle + d\u00e9tention > 6 mois : demi-taux global (max 23 % au lieu de 45,78 %)",
        "cessionPartsRegle3": "Si d\u00e9tention \u2264 6 mois : b\u00e9n\u00e9fice de sp\u00e9culation, imposition au taux marginal plein sans abattement"
    },
    "en": {
        "cessionPartsLabel": "Sale of company shares (SCI / SARL-S property company)",
        "cessionPartsHint": "You sell shares rather than the asset (art. 100 LIR)",
        "cessionPartsRegime": "Share sale \u2014 Article 100 LIR",
        "pctDetention": "% holding in the company",
        "anneeDetentionParts": "Year shares acquired",
        "valeurParts": "Shares acquisition price",
        "prixCessionParts": "Shares sale price",
        "cessionPartsDuree": "Holding period",
        "cessionPartsGain": "Gain on shares",
        "cessionPartsRegimeFiscal": "Tax regime",
        "cessionPartsAns": "yrs",
        "cessionPartsSpec": "Speculation (\u2264 6 months)",
        "cessionPartsCession": "Long-term (> 6 months)",
        "cessionPartsImpot": "Estimated tax",
        "cessionPartsTaux": "Effective rate applied: {taux} %",
        "cessionPartsRegleTitle": "Key rules",
        "cessionPartsRegle1": "Substantial participation = \u2265 10 % holding during the last 5 years (art. 100 LIR)",
        "cessionPartsRegle2": "If substantial + > 6 months: half-rate regime (max 23 % instead of 45.78 %)",
        "cessionPartsRegle3": "If \u2264 6 months: speculation gain, full marginal rate with no abatement"
    },
    "de": {
        "cessionPartsLabel": "Verkauf von Gesellschaftsanteilen (SCI / SARL-S)",
        "cessionPartsHint": "Anteile statt Verm\u00f6gensgegenstand (Art. 100 LIR)",
        "cessionPartsRegime": "Anteilsverkauf \u2014 Artikel 100 LIR",
        "pctDetention": "% Beteiligung",
        "anneeDetentionParts": "Anteilserwerbsjahr",
        "valeurParts": "Erwerbspreis Anteile",
        "prixCessionParts": "Verkaufspreis Anteile",
        "cessionPartsDuree": "Haltedauer",
        "cessionPartsGain": "Gewinn auf Anteilen",
        "cessionPartsRegimeFiscal": "Steuerregime",
        "cessionPartsAns": "Jahre",
        "cessionPartsSpec": "Spekulation (\u2264 6 Monate)",
        "cessionPartsCession": "Langfristig (> 6 Monate)",
        "cessionPartsImpot": "Gesch\u00e4tzte Steuer",
        "cessionPartsTaux": "Effektiver Satz: {taux} %",
        "cessionPartsRegleTitle": "Schl\u00fcsselregeln",
        "cessionPartsRegle1": "Wesentliche Beteiligung = \u2265 10 % in den letzten 5 Jahren",
        "cessionPartsRegle2": "Wesentlich + > 6 Monate: Halbsatz (max 23 %)",
        "cessionPartsRegle3": "\u2264 6 Monate: Spekulationsgewinn, voller Grenzsteuersatz"
    },
    "pt": {
        "cessionPartsLabel": "Cess\u00e3o de quotas (SCI / SARL-S imobili\u00e1ria)",
        "cessionPartsHint": "Cede quotas em vez do bem (art. 100 LIR)",
        "cessionPartsRegime": "Cess\u00e3o de quotas \u2014 Art. 100 LIR",
        "pctDetention": "% de deten\u00e7\u00e3o",
        "anneeDetentionParts": "Ano aquisi\u00e7\u00e3o quotas",
        "valeurParts": "Pre\u00e7o aquisi\u00e7\u00e3o",
        "prixCessionParts": "Pre\u00e7o cess\u00e3o",
        "cessionPartsDuree": "Dura\u00e7\u00e3o deten\u00e7\u00e3o",
        "cessionPartsGain": "Mais-valia quotas",
        "cessionPartsRegimeFiscal": "Regime fiscal",
        "cessionPartsAns": "anos",
        "cessionPartsSpec": "Especula\u00e7\u00e3o (\u2264 6 meses)",
        "cessionPartsCession": "Longo prazo (> 6 meses)",
        "cessionPartsImpot": "Imposto estimado",
        "cessionPartsTaux": "Taxa efectiva: {taux} %",
        "cessionPartsRegleTitle": "Regras-chave",
        "cessionPartsRegle1": "Participa\u00e7\u00e3o substancial = \u2265 10 % nos \u00faltimos 5 anos",
        "cessionPartsRegle2": "Substancial + > 6 meses: meia-taxa (m\u00e1x 23 %)",
        "cessionPartsRegle3": "\u2264 6 meses: ganho especula\u00e7\u00e3o, taxa marginal plena"
    },
    "lb": {
        "cessionPartsLabel": "Verkaf vu Gesellschaftsparts (SCI / SARL-S)",
        "cessionPartsHint": "Dir verkaaft Parts amplaz de Bien (Art. 100 LIR)",
        "cessionPartsRegime": "Verkaf vu Parts \u2014 Artikel 100 LIR",
        "pctDetention": "% Participatioun",
        "anneeDetentionParts": "Joer vum Parts-Akaaf",
        "valeurParts": "Akafspr\u00e4is Parts",
        "prixCessionParts": "Verkafspr\u00e4is Parts",
        "cessionPartsDuree": "Haltdauer",
        "cessionPartsGain": "Gew\u00ebnn op Parts",
        "cessionPartsRegimeFiscal": "Steierregime",
        "cessionPartsAns": "Joer",
        "cessionPartsSpec": "Spekulatioun (\u2264 6 M\u00e9int)",
        "cessionPartsCession": "Laangfristeg (> 6 M\u00e9int)",
        "cessionPartsImpot": "Gesch\u00e4tzte Steier",
        "cessionPartsTaux": "Effektiven Taux: {taux} %",
        "cessionPartsRegleTitle": "Schl\u00ebsselregelen",
        "cessionPartsRegle1": "Substantiell Participatioun = \u2265 10 % an de leschte 5 Joer",
        "cessionPartsRegle2": "Substantiell + > 6 M\u00e9int: Hallef-Taux (max 23 %)",
        "cessionPartsRegle3": "\u2264 6 M\u00e9int: Spekulatiounsgew\u00ebnn, vull Marginalsteier"
    }
}


def main() -> None:
    for loc, vals in DATA.items():
        p = MSG / f"{loc}.json"
        d = json.load(open(p, encoding="utf-8"))
        d["plusValues"].update(vals)
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{loc}: OK")


if __name__ == "__main__":
    main()
