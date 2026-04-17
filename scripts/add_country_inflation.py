"""Add inflation + propertyGrowth fields to each country JSON.

Sources :
- Eurostat HICP (tec00118) moyenne 2023-2025 pour pays EU
- BLS US CPI 2023-2025
- ONS UK CPI 2023-2025

Les valeurs sont indicatives et servent aux projections propcalc 10 ans.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COUNTRIES = ROOT / "src" / "lib" / "propcalc" / "data" / "countries"

# Moyenne HICP 3 ans (2023-2025) + appréciation immo moyenne 5 ans
INFLATION_DATA = {
    "lu": {"hicpAvg": 2.8, "propertyGrowth": 1.5, "sources": "STATEC IPCN 2023-2025 + Observatoire Habitat"},
    "fr": {"hicpAvg": 2.9, "propertyGrowth": -1.0, "sources": "INSEE IPC + Notaires de France 2023-2025"},
    "de": {"hicpAvg": 3.8, "propertyGrowth": -2.0, "sources": "Destatis VPI + vdpResearch 2023-2025"},
    "be": {"hicpAvg": 3.2, "propertyGrowth": 0.5, "sources": "Statbel IPC + Notaires BE 2023-2025"},
    "nl": {"hicpAvg": 3.5, "propertyGrowth": 4.5, "sources": "CBS HICP + NVM 2023-2025"},
    "it": {"hicpAvg": 3.3, "propertyGrowth": 1.0, "sources": "ISTAT NIC + Nomisma 2023-2025"},
    "es": {"hicpAvg": 3.1, "propertyGrowth": 6.0, "sources": "INE IPC + Registradores 2023-2025"},
    "pt": {"hicpAvg": 3.5, "propertyGrowth": 7.5, "sources": "INE IPC + Confidencial Imobiliário 2023-2025"},
    "uk": {"hicpAvg": 4.2, "propertyGrowth": 1.5, "sources": "ONS CPI + Halifax/Nationwide 2023-2025"},
    "us": {"hicpAvg": 3.4, "propertyGrowth": 4.0, "sources": "BLS CPI-U + S&P CoreLogic Case-Shiller 2023-2025"},
}


def main() -> None:
    for code, data in INFLATION_DATA.items():
        path = COUNTRIES / f"{code}.json"
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
        d["macro"] = {
            "hicpAvg": data["hicpAvg"],
            "propertyGrowth": data["propertyGrowth"],
            "sources": data["sources"],
            "lastUpdate": "2026-04-17",
        }
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{code}: HICP {data['hicpAvg']}% + property {data['propertyGrowth']}%")


if __name__ == "__main__":
    main()
