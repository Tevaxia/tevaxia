#!/usr/bin/env python3
"""Shorten guide titles that exceed 70 chars across all 5 message files.

Bing's "Title too long" warning fires above ~65-70 chars (SERP truncation).
We keep the keyword density (Luxembourg, year, law refs) but trim verbose
phrasing.
"""
import json
from pathlib import Path

MSG_DIR = Path(__file__).parent.parent / "src" / "messages"

# slug -> { lang: new_title }
NEW_TITLES = {
    "regle5Pourcent": {
        "fr": "Règle des 5 % du loyer Luxembourg : calcul et réforme 2026",
        "en": "Luxembourg 5 % rent rule: calculation and 2026 reform",
        "de": "5 %-Mietregel Luxemburg: Berechnung und Reform 2026",
        "lb": "5 %-Locatiounsregel Lëtzebuerg: Berechnung a Reform 2026",
        "pt": "Regra dos 5 % do arrendamento Luxemburgo: cálculo e reforma 2026",
    },
    "bellegenAkt": {
        "fr": "Bëllegen Akt 2026 : crédit d'impôt acte notarié Luxembourg",
        "en": "Bëllegen Akt 2026: notary deed tax credit Luxembourg",
        "de": "Bëllegen Akt 2026: Steuergutschrift notarielle Urkunde Luxemburg",
        "lb": "Bëllegen Akt 2026: Steiergutschrëft notariell Akt Lëtzebuerg",
        "pt": "Bëllegen Akt 2026: crédito fiscal de escritura notarial Luxemburgo",
    },
    "plusValue": {
        "fr": "Plus-value immobilière Luxembourg : fiscalité 2026 (LIR)",
        "en": "Luxembourg real estate capital gains: 2026 tax rules (LIR)",
        "de": "Immobilien-Veräußerungsgewinn Luxemburg: Steuern 2026 (LIR)",
        "lb": "Immobilien-Plus-value Lëtzebuerg: Steieren 2026 (LIR)",
        "pt": "Mais-valia imobiliária Luxemburgo: fiscalidade 2026 (LIR)",
    },
    "bailHabitation": {
        "fr": "Bail d'habitation Luxembourg : loi 21.09.2006, droits 2026",
        "en": "Luxembourg housing lease: law 21.09.2006, 2026 rights",
        "de": "Wohnungsmietvertrag Luxemburg: Gesetz 21.09.2006, Rechte 2026",
        "lb": "Wunnengsmietkontrakt Lëtzebuerg: Gesetz 21.09.2006, Rechter 2026",
        "pt": "Arrendamento habitacional Luxemburgo: lei 21.09.2006, direitos 2026",
    },
    "copropriete": {
        "fr": "Copropriété Luxembourg : loi 16.05.1975, syndic, AG, fonds 2026",
        "en": "Luxembourg co-ownership: law 16.05.1975, syndic, AGM, fund 2026",
        "de": "Wohneigentum Luxemburg: Gesetz 16.05.1975, Verwalter, EV 2026",
        "lb": "Copropriétéit Lëtzebuerg: Gesetz 16.05.1975, Syndikus, GV 2026",
        "pt": "Condomínio Luxemburgo: lei 16.05.1975, síndico, AG, fundo 2026",
    },
    "estimation": {
        "fr": "Estimation immobilière Luxembourg : méthodes TEGOVA EVS 2025",
        "en": "Luxembourg real estate valuation: TEGOVA EVS 2025 methods",
        "de": "Immobilienbewertung Luxemburg: TEGOVA EVS 2025 Methoden",
        "lb": "Immobilienevaluatioun Lëtzebuerg: TEGOVA EVS 2025 Methoden",
        "pt": "Avaliação imobiliária Luxemburgo: métodos TEGOVA EVS 2025",
    },
    "achatNonResident": {
        "fr": "Achat immobilier Luxembourg pour non-résidents : guide 2026",
        "en": "Buying property in Luxembourg as non-resident: 2026 guide",
        "de": "Immobilienkauf Luxemburg für Nichtansässige: Leitfaden 2026",
        "lb": "Immobilienkaaf Lëtzebuerg fir Net-Resident: Guide 2026",
        "pt": "Comprar imóvel no Luxemburgo como não residente: guia 2026",
    },
    "tva3Pourcent": {
        "fr": "TVA logement 3 % Luxembourg : conditions et démarche AED 2026",
        "en": "Luxembourg 3 % housing VAT: conditions and AED procedure 2026",
        "de": "3 % Wohnungs-MwSt Luxemburg: Bedingungen und AED-Verfahren 2026",
        "lb": "3 %-Wunnengs-MwSt Lëtzebuerg: Konditiounen an AED-Verfahren 2026",
        "pt": "IVA habitação 3 % Luxemburgo: condições e procedimento AED 2026",
    },
    "bailCommercial": {
        "fr": "Bail commercial Luxembourg : loi 03.02.2018, durée 9 ans",
        "en": "Luxembourg commercial lease: law 03.02.2018, 9-year term",
        "de": "Gewerbemietvertrag Luxemburg: Gesetz 03.02.2018, 9 Jahre",
        "lb": "Geschäftsmietkontrakt Lëtzebuerg: Gesetz 03.02.2018, 9 Joer",
        "pt": "Arrendamento comercial Luxemburgo: lei 03.02.2018, 9 anos",
    },
    "investirHotel": {
        "fr": "Investir dans un hôtel au Luxembourg : guide 2026 (RevPAR, DSCR)",
        "en": "Investing in a Luxembourg hotel: 2026 guide (RevPAR, DSCR)",
        "de": "In ein Hotel in Luxemburg investieren: Leitfaden 2026 (RevPAR, DSCR)",
        "lb": "An en Hotel zu Lëtzebuerg investéieren: Guide 2026 (RevPAR, DSCR)",
        "pt": "Investir num hotel no Luxemburgo: guia 2026 (RevPAR, DSCR)",
    },
}


def main() -> None:
    for loc in ["fr", "en", "de", "lb", "pt"]:
        path = MSG_DIR / f"{loc}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        guide = data.setdefault("guide", {})
        for slug, titles in NEW_TITLES.items():
            if slug not in guide:
                continue
            new = titles.get(loc)
            if not new:
                continue
            old = guide[slug].get("title", "")
            guide[slug]["title"] = new
            print(f"[{loc}] {slug}: {len(old)} -> {len(new)}  {new}")
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
