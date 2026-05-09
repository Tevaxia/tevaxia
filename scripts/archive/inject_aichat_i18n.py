"""Inject aiChat namespace into the 5 locale JSON files."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MSG = ROOT / "src" / "messages"

DATA: dict[str, dict] = {
    "fr": {
        "welcome": "Bonjour ! Je suis l'assistant tevaxia, spécialisé sur l'immobilier luxembourgeois (fiscalité, EVS/TEGOVA, VEFA, copropriété, hôtellerie, KYC). Posez votre question.",
        "openLabel": "Ouvrir l'assistant IA",
        "closeLabel": "Fermer",
        "sendLabel": "Envoyer",
        "headerTitle": "Assistant tevaxia",
        "headerSubtitle": "Expert immobilier LU",
        "thinking": "L'assistant réfléchit…",
        "inputPlaceholder": "Posez votre question immobilière LU…",
        "sessionExpired": "Session expirée, reconnectez-vous.",
        "errorCode": "Erreur {code}",
        "errorUnknown": "Erreur inconnue",
        "quotaExhausted": "Quota épuisé — ajoutez votre clé API dans votre profil",
        "remainingToday": "{count, plural, one {# message restant aujourd'hui} other {# messages restants aujourd'hui}}"
    },
    "en": {
        "welcome": "Hello! I'm the tevaxia assistant, specialized in Luxembourg real estate (tax, EVS/TEGOVA, VEFA, condominium, hospitality, KYC). Ask your question.",
        "openLabel": "Open AI assistant",
        "closeLabel": "Close",
        "sendLabel": "Send",
        "headerTitle": "tevaxia Assistant",
        "headerSubtitle": "LU real estate expert",
        "thinking": "Assistant is thinking…",
        "inputPlaceholder": "Ask your LU real estate question…",
        "sessionExpired": "Session expired, please sign in again.",
        "errorCode": "Error {code}",
        "errorUnknown": "Unknown error",
        "quotaExhausted": "Quota exhausted — add your API key in your profile",
        "remainingToday": "{count, plural, one {# message remaining today} other {# messages remaining today}}"
    },
    "de": {
        "welcome": "Hallo! Ich bin der tevaxia-Assistent, spezialisiert auf Luxemburger Immobilien (Steuern, EVS/TEGOVA, VEFA, WEG, Hotellerie, KYC). Stellen Sie Ihre Frage.",
        "openLabel": "KI-Assistent öffnen",
        "closeLabel": "Schließen",
        "sendLabel": "Senden",
        "headerTitle": "tevaxia-Assistent",
        "headerSubtitle": "LU-Immobilienexperte",
        "thinking": "Der Assistent denkt nach…",
        "inputPlaceholder": "Stellen Sie Ihre LU-Immobilienfrage…",
        "sessionExpired": "Sitzung abgelaufen, bitte erneut anmelden.",
        "errorCode": "Fehler {code}",
        "errorUnknown": "Unbekannter Fehler",
        "quotaExhausted": "Kontingent aufgebraucht — fügen Sie Ihren API-Schlüssel im Profil hinzu",
        "remainingToday": "{count, plural, one {# Nachricht heute übrig} other {# Nachrichten heute übrig}}"
    },
    "pt": {
        "welcome": "Olá! Sou o assistente tevaxia, especializado em imobiliário luxemburguês (fiscalidade, EVS/TEGOVA, VEFA, condomínio, hotelaria, KYC). Coloque a sua questão.",
        "openLabel": "Abrir o assistente IA",
        "closeLabel": "Fechar",
        "sendLabel": "Enviar",
        "headerTitle": "Assistente tevaxia",
        "headerSubtitle": "Perito imobiliário LU",
        "thinking": "O assistente está a pensar…",
        "inputPlaceholder": "Coloque a sua questão imobiliária LU…",
        "sessionExpired": "Sessão expirada, inicie sessão novamente.",
        "errorCode": "Erro {code}",
        "errorUnknown": "Erro desconhecido",
        "quotaExhausted": "Quota esgotada — adicione a sua chave API no perfil",
        "remainingToday": "{count, plural, one {# mensagem restante hoje} other {# mensagens restantes hoje}}"
    },
    "lb": {
        "welcome": "Moien! Ech sinn den tevaxia-Assistent, spezialiséiert op Lëtzebuerger Immobilien (Steieren, EVS/TEGOVA, VEFA, Matproprietéit, Hotellerie, KYC). Stellt Är Fro.",
        "openLabel": "KI-Assistent opmaachen",
        "closeLabel": "Zoumaachen",
        "sendLabel": "Schécken",
        "headerTitle": "tevaxia-Assistent",
        "headerSubtitle": "LU-Immobilienexpert",
        "thinking": "Den Assistent denkt no…",
        "inputPlaceholder": "Stellt Är Fro iwwer d'Lëtzebuerger Immobilien…",
        "sessionExpired": "Sessioun ofgelaf, mellt Iech nei un.",
        "errorCode": "Feeler {code}",
        "errorUnknown": "Onbekannt Feeler",
        "quotaExhausted": "Quota opgebraucht — füügt Äre API-Schlëssel am Profil derbäi",
        "remainingToday": "{count, plural, one {# Message haut iwwreg} other {# Messagen haut iwwreg}}"
    }
}


def main() -> None:
    for loc, values in DATA.items():
        p = MSG / f"{loc}.json"
        d = json.load(open(p, encoding="utf-8"))
        d["aiChat"] = values
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{loc}: OK")


if __name__ == "__main__":
    main()
