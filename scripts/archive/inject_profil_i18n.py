"""Inject dashboardHero, workspaces, profileTypes namespaces into 5 locale JSON files.

Run from project root:
    python scripts/inject_profil_i18n.py
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MSG_DIR = ROOT / "src" / "messages"

TRANSLATIONS: dict[str, dict[str, dict]] = {
    "fr": {
        "dashboardHero": {
            "welcome": "Bienvenue",
            "defaultUser": "Utilisateur",
            "plan": "Plan",
            "byokActive": "BYOK actif",
            "kpiValuations": "Évaluations",
            "kpiAiAnalyses": "Analyses IA",
            "kpiActiveAlerts": "Alertes actives",
            "kpiSharedLinks": "Liens partagés",
            "valuationsCap": "sur {cap} max",
            "aiUnlimited": "Illimité (BYOK)",
            "aiToday": "aujourd'hui",
            "alertsNone": "Aucune commune suivie",
            "alertsCommunesFollowed": "communes suivies",
            "sharedApiKeys": "{count, plural, =0 {0 clé API} one {# clé API} other {# clés API}}",
        },
        "workspaces": {
            "sectionTitle": "Mes espaces",
            "open": "Ouvrir",
            "filteredOn": "Filtré sur {count} profil(s)",
            "emptyState": "Aucun espace ne correspond à vos profils sélectionnés. Ajustez votre sélection ci-dessus.",
            "evaluationsTitle": "Mes évaluations",
            "evaluationsDesc": "Historique, rapports PDF et suivi TEGOVA EVS 2025",
            "portfolioTitle": "Mon portefeuille",
            "portfolioDesc": "Suivi de valeur, rendement et performance globale",
            "esgTitle": "Énergie & ESG",
            "esgDesc": "DPE, CRREM, rénovations et conformité ESG",
            "syndicTitle": "Copropriétés",
            "syndicDesc": "AG, fonds travaux, portails copropriétaires, messagerie",
            "hotelsTitle": "Hôtellerie",
            "hotelsDesc": "Groupe, compset, yield, MICE, ESG Green Key",
            "agencyTitle": "Organisation",
            "agencyDesc": "Équipe, permissions, logo et paramètres agence",
            "apiKeysTitle": "Clés API",
            "apiKeysDesc": "Tokens personnels, webhooks et intégrations",
            "apiDocsTitle": "Documentation API",
            "apiDocsDesc": "Référence OpenAPI, exemples et quotas",
        },
        "profileTypes": {
            "title": "Mes profils",
            "description": "Sélectionnez un ou plusieurs profils pour personnaliser votre tableau de bord. Laissez vide pour tout afficher.",
            "loading": "Chargement…",
            "saved": "Enregistré",
            "selectedCount": "{count, plural, one {# profil sélectionné} other {# profils sélectionnés}}",
            "particulier": {
                "label": "Particulier",
                "description": "Propriétaire occupant ou bailleur individuel",
            },
            "expert": {
                "label": "Expert / Évaluateur",
                "description": "Évaluateur certifié TEGOVA, notaire, fiscaliste",
            },
            "syndic": {
                "label": "Syndic",
                "description": "Syndic professionnel ou bénévole de copropriété",
            },
            "hotelier": {
                "label": "Hôtelier",
                "description": "Exploitant hôtel, motel ou résidence de tourisme",
            },
            "investisseur": {
                "label": "Investisseur",
                "description": "Investisseur particulier ou institutionnel",
            },
            "agence": {
                "label": "Agence / Gestion",
                "description": "Agence immobilière ou administrateur de biens",
            },
            "promoteur": {
                "label": "Promoteur",
                "description": "Promoteur, constructeur ou marchand de biens",
            },
            "api": {
                "label": "Intégrateur API",
                "description": "PropTech, banque, fintech, accès programmatique",
            },
            "str_operator": {
                "label": "Location courte durée",
                "description": "Airbnb, Booking, opérateur STR sous règlement EU 2024/1028",
            },
        },
    },
    "en": {
        "dashboardHero": {
            "welcome": "Welcome",
            "defaultUser": "User",
            "plan": "Plan",
            "byokActive": "BYOK active",
            "kpiValuations": "Valuations",
            "kpiAiAnalyses": "AI analyses",
            "kpiActiveAlerts": "Active alerts",
            "kpiSharedLinks": "Shared links",
            "valuationsCap": "of {cap} max",
            "aiUnlimited": "Unlimited (BYOK)",
            "aiToday": "today",
            "alertsNone": "No commune tracked",
            "alertsCommunesFollowed": "communes tracked",
            "sharedApiKeys": "{count, plural, =0 {0 API keys} one {# API key} other {# API keys}}",
        },
        "workspaces": {
            "sectionTitle": "My workspaces",
            "open": "Open",
            "filteredOn": "Filtered on {count} profile(s)",
            "emptyState": "No workspace matches your selected profiles. Adjust your selection above.",
            "evaluationsTitle": "My valuations",
            "evaluationsDesc": "History, PDF reports and TEGOVA EVS 2025 tracking",
            "portfolioTitle": "My portfolio",
            "portfolioDesc": "Value, yield and overall performance monitoring",
            "esgTitle": "Energy & ESG",
            "esgDesc": "EPC, CRREM, retrofits and ESG compliance",
            "syndicTitle": "Co-ownerships",
            "syndicDesc": "AGMs, works fund, co-owner portals, messaging",
            "hotelsTitle": "Hospitality",
            "hotelsDesc": "Group, compset, yield, MICE, ESG Green Key",
            "agencyTitle": "Organization",
            "agencyDesc": "Team, permissions, logo and agency settings",
            "apiKeysTitle": "API keys",
            "apiKeysDesc": "Personal tokens, webhooks and integrations",
            "apiDocsTitle": "API documentation",
            "apiDocsDesc": "OpenAPI reference, examples and quotas",
        },
        "profileTypes": {
            "title": "My profiles",
            "description": "Select one or more profiles to personalize your dashboard. Leave empty to show everything.",
            "loading": "Loading…",
            "saved": "Saved",
            "selectedCount": "{count, plural, one {# profile selected} other {# profiles selected}}",
            "particulier": {
                "label": "Individual",
                "description": "Owner-occupier or individual landlord",
            },
            "expert": {
                "label": "Expert / Valuer",
                "description": "TEGOVA-certified valuer, notary, tax advisor",
            },
            "syndic": {
                "label": "Property manager",
                "description": "Professional or volunteer co-ownership manager",
            },
            "hotelier": {
                "label": "Hotelier",
                "description": "Hotel, motel or tourist residence operator",
            },
            "investisseur": {
                "label": "Investor",
                "description": "Private or institutional investor",
            },
            "agence": {
                "label": "Agency / Asset manager",
                "description": "Real estate agency or property administrator",
            },
            "promoteur": {
                "label": "Developer",
                "description": "Developer, builder or property trader",
            },
            "api": {
                "label": "API integrator",
                "description": "PropTech, bank, fintech, programmatic access",
            },
            "str_operator": {
                "label": "Short-term rental",
                "description": "Airbnb, Booking, STR operator under EU 2024/1028",
            },
        },
    },
    "de": {
        "dashboardHero": {
            "welcome": "Willkommen",
            "defaultUser": "Nutzer",
            "plan": "Tarif",
            "byokActive": "BYOK aktiv",
            "kpiValuations": "Bewertungen",
            "kpiAiAnalyses": "KI-Analysen",
            "kpiActiveAlerts": "Aktive Alerts",
            "kpiSharedLinks": "Geteilte Links",
            "valuationsCap": "von {cap} max.",
            "aiUnlimited": "Unbegrenzt (BYOK)",
            "aiToday": "heute",
            "alertsNone": "Keine Gemeinde verfolgt",
            "alertsCommunesFollowed": "Gemeinden verfolgt",
            "sharedApiKeys": "{count, plural, =0 {0 API-Schlüssel} one {# API-Schlüssel} other {# API-Schlüssel}}",
        },
        "workspaces": {
            "sectionTitle": "Meine Bereiche",
            "open": "Öffnen",
            "filteredOn": "Gefiltert auf {count} Profil(e)",
            "emptyState": "Kein Bereich entspricht Ihren ausgewählten Profilen. Passen Sie Ihre Auswahl oben an.",
            "evaluationsTitle": "Meine Bewertungen",
            "evaluationsDesc": "Verlauf, PDF-Berichte und TEGOVA EVS 2025 Tracking",
            "portfolioTitle": "Mein Portfolio",
            "portfolioDesc": "Wert-, Rendite- und Gesamtperformance-Überwachung",
            "esgTitle": "Energie & ESG",
            "esgDesc": "Energieausweis, CRREM, Sanierungen und ESG-Konformität",
            "syndicTitle": "Wohneigentum (WEG)",
            "syndicDesc": "Versammlungen, Instandhaltungsrücklage, Eigentümer-Portale, Messaging",
            "hotelsTitle": "Hotellerie",
            "hotelsDesc": "Gruppe, Compset, Yield, MICE, ESG Green Key",
            "agencyTitle": "Organisation",
            "agencyDesc": "Team, Berechtigungen, Logo und Agentur-Einstellungen",
            "apiKeysTitle": "API-Schlüssel",
            "apiKeysDesc": "Persönliche Token, Webhooks und Integrationen",
            "apiDocsTitle": "API-Dokumentation",
            "apiDocsDesc": "OpenAPI-Referenz, Beispiele und Kontingente",
        },
        "profileTypes": {
            "title": "Meine Profile",
            "description": "Wählen Sie ein oder mehrere Profile, um Ihr Dashboard zu personalisieren. Leer lassen, um alles anzuzeigen.",
            "loading": "Lädt…",
            "saved": "Gespeichert",
            "selectedCount": "{count, plural, one {# Profil ausgewählt} other {# Profile ausgewählt}}",
            "particulier": {
                "label": "Privatperson",
                "description": "Selbstnutzer oder privater Vermieter",
            },
            "expert": {
                "label": "Sachverständiger",
                "description": "TEGOVA-zertifizierter Sachverständiger, Notar, Steuerberater",
            },
            "syndic": {
                "label": "Verwalter (WEG)",
                "description": "Professioneller oder ehrenamtlicher WEG-Verwalter",
            },
            "hotelier": {
                "label": "Hotelier",
                "description": "Hotel-, Motel- oder Aparthotel-Betreiber",
            },
            "investisseur": {
                "label": "Investor",
                "description": "Privater oder institutioneller Investor",
            },
            "agence": {
                "label": "Makler / Verwalter",
                "description": "Immobilienmakler oder Hausverwaltung",
            },
            "promoteur": {
                "label": "Projektentwickler",
                "description": "Bauträger, Projektentwickler oder Immobilienhändler",
            },
            "api": {
                "label": "API-Integrator",
                "description": "PropTech, Bank, Fintech, programmatischer Zugriff",
            },
            "str_operator": {
                "label": "Kurzzeitvermietung",
                "description": "Airbnb, Booking, STR-Betreiber nach EU 2024/1028",
            },
        },
    },
    "pt": {
        "dashboardHero": {
            "welcome": "Bem-vindo",
            "defaultUser": "Utilizador",
            "plan": "Plano",
            "byokActive": "BYOK ativo",
            "kpiValuations": "Avaliações",
            "kpiAiAnalyses": "Análises IA",
            "kpiActiveAlerts": "Alertas ativos",
            "kpiSharedLinks": "Links partilhados",
            "valuationsCap": "de {cap} máx",
            "aiUnlimited": "Ilimitado (BYOK)",
            "aiToday": "hoje",
            "alertsNone": "Nenhum município seguido",
            "alertsCommunesFollowed": "municípios seguidos",
            "sharedApiKeys": "{count, plural, =0 {0 chaves API} one {# chave API} other {# chaves API}}",
        },
        "workspaces": {
            "sectionTitle": "Os meus espaços",
            "open": "Abrir",
            "filteredOn": "Filtrado em {count} perfil(s)",
            "emptyState": "Nenhum espaço corresponde aos perfis selecionados. Ajuste a sua seleção acima.",
            "evaluationsTitle": "As minhas avaliações",
            "evaluationsDesc": "Histórico, relatórios PDF e acompanhamento TEGOVA EVS 2025",
            "portfolioTitle": "O meu portefólio",
            "portfolioDesc": "Acompanhamento de valor, rendimento e performance global",
            "esgTitle": "Energia & ESG",
            "esgDesc": "Certificado energético, CRREM, renovações e conformidade ESG",
            "syndicTitle": "Condomínios",
            "syndicDesc": "Assembleias, fundo de obras, portais de condóminos, mensagens",
            "hotelsTitle": "Hotelaria",
            "hotelsDesc": "Grupo, compset, yield, MICE, ESG Green Key",
            "agencyTitle": "Organização",
            "agencyDesc": "Equipa, permissões, logótipo e parâmetros da agência",
            "apiKeysTitle": "Chaves API",
            "apiKeysDesc": "Tokens pessoais, webhooks e integrações",
            "apiDocsTitle": "Documentação API",
            "apiDocsDesc": "Referência OpenAPI, exemplos e quotas",
        },
        "profileTypes": {
            "title": "Os meus perfis",
            "description": "Selecione um ou mais perfis para personalizar o painel. Deixe em branco para mostrar tudo.",
            "loading": "A carregar…",
            "saved": "Guardado",
            "selectedCount": "{count, plural, one {# perfil selecionado} other {# perfis selecionados}}",
            "particulier": {
                "label": "Particular",
                "description": "Proprietário ocupante ou senhorio individual",
            },
            "expert": {
                "label": "Perito / Avaliador",
                "description": "Avaliador certificado TEGOVA, notário, fiscalista",
            },
            "syndic": {
                "label": "Administrador",
                "description": "Administrador profissional ou voluntário de condomínio",
            },
            "hotelier": {
                "label": "Hoteleiro",
                "description": "Operador de hotel, motel ou residência turística",
            },
            "investisseur": {
                "label": "Investidor",
                "description": "Investidor particular ou institucional",
            },
            "agence": {
                "label": "Agência / Gestão",
                "description": "Agência imobiliária ou administrador de bens",
            },
            "promoteur": {
                "label": "Promotor",
                "description": "Promotor, construtor ou comerciante de imóveis",
            },
            "api": {
                "label": "Integrador API",
                "description": "PropTech, banco, fintech, acesso programático",
            },
            "str_operator": {
                "label": "Alojamento local",
                "description": "Airbnb, Booking, operador STR sob regulamento UE 2024/1028",
            },
        },
    },
    "lb": {
        "dashboardHero": {
            "welcome": "Wëllkomm",
            "defaultUser": "Benotzer",
            "plan": "Plang",
            "byokActive": "BYOK aktiv",
            "kpiValuations": "Bewäertungen",
            "kpiAiAnalyses": "KI-Analysen",
            "kpiActiveAlerts": "Aktiv Alarmer",
            "kpiSharedLinks": "Gedeelte Linken",
            "valuationsCap": "vu {cap} max",
            "aiUnlimited": "Onbegrenzt (BYOK)",
            "aiToday": "haut",
            "alertsNone": "Keng Gemeng verfollegt",
            "alertsCommunesFollowed": "Gemengen verfollegt",
            "sharedApiKeys": "{count, plural, =0 {0 API-Schlësselen} one {# API-Schlëssel} other {# API-Schlësselen}}",
        },
        "workspaces": {
            "sectionTitle": "Meng Beräicher",
            "open": "Opmaachen",
            "filteredOn": "Gefiltert op {count} Profil(er)",
            "emptyState": "Kee Beräich entsprécht Ären ausgewielte Profiler. Passt Är Auswiel uewen un.",
            "evaluationsTitle": "Meng Bewäertungen",
            "evaluationsDesc": "Historique, PDF-Rapporten an TEGOVA EVS 2025 Tracking",
            "portfolioTitle": "Mäi Portefeuille",
            "portfolioDesc": "Wäert-, Rendement- a Gesamtperformance-Iwwerwaachung",
            "esgTitle": "Energie & ESG",
            "esgDesc": "Energiepass, CRREM, Renovatiounen an ESG-Konformitéit",
            "syndicTitle": "Matproprietéit",
            "syndicDesc": "Versammlungen, Aarbechtsfong, Matproprietäre-Portaler, Messagerie",
            "hotelsTitle": "Hotellerie",
            "hotelsDesc": "Grupp, Compset, Yield, MICE, ESG Green Key",
            "agencyTitle": "Organisatioun",
            "agencyDesc": "Equipe, Rechter, Logo an Agence-Astellungen",
            "apiKeysTitle": "API-Schlësselen",
            "apiKeysDesc": "Perséinlech Tokens, Webhooks an Integratiounen",
            "apiDocsTitle": "API-Dokumentatioun",
            "apiDocsDesc": "OpenAPI-Referenz, Beispiller a Quoten",
        },
        "profileTypes": {
            "title": "Meng Profiler",
            "description": "Wielt een oder méi Profiler aus, fir Äert Dashboard ze personaliséieren. Eidel loossen fir alles ze weisen.",
            "loading": "Lued…",
            "saved": "Gespäichert",
            "selectedCount": "{count, plural, one {# Profil ausgewielt} other {# Profiler ausgewielt}}",
            "particulier": {
                "label": "Privatpersoun",
                "description": "Proprietär oder privat Locateur",
            },
            "expert": {
                "label": "Expert / Evaluateur",
                "description": "TEGOVA-zertifizéierte Evaluateur, Notaire, Steierberoder",
            },
            "syndic": {
                "label": "Syndic",
                "description": "Professionelle oder benevole Syndic vun enger Matproprietéit",
            },
            "hotelier": {
                "label": "Hotelier",
                "description": "Exploitant vun Hotel, Motel oder Touristen-Residence",
            },
            "investisseur": {
                "label": "Investisseur",
                "description": "Privat oder institutionnellen Investisseur",
            },
            "agence": {
                "label": "Agence / Gestioun",
                "description": "Immobilie-Agence oder Administrateur vu Bien",
            },
            "promoteur": {
                "label": "Promoteur",
                "description": "Promoteur, Bauhär oder Immobilies-Händler",
            },
            "api": {
                "label": "API-Integrateur",
                "description": "PropTech, Bank, Fintech, programmatesche Zougrëff",
            },
            "str_operator": {
                "label": "Kuerzzäitlocatioun",
                "description": "Airbnb, Booking, STR-Betreiber ënner EU-Reglement 2024/1028",
            },
        },
    },
}


def main() -> None:
    for locale, sections in TRANSLATIONS.items():
        path = MSG_DIR / f"{locale}.json"
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for ns, values in sections.items():
            data[ns] = values
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"[OK] {locale}.json — injected {len(sections)} namespaces")


if __name__ == "__main__":
    main()
