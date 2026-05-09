#!/usr/bin/env python3
"""Inject portalLandings translation keys into all 5 message files.

Adds a top-level `portalLandings` object containing FR/EN/DE/LB/PT content
for the 3 public landing pages: /copropriete, /conseil-syndical, /locataire.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
MSG_DIR = ROOT / "src" / "messages"

CONTENT = {
    "fr": {
        "copropriete": {
            "meta": {
                "title": "Espace copropriétaire Luxembourg — accès portail tevaxia",
                "description": "Accédez à votre espace copropriétaire : convocations d'AG, votes en ligne, comptes individuels, appels de fonds. Lien magique sécurisé fourni par votre syndic.",
            },
            "hero": {
                "badge": "Portail copropriétaire",
                "title": "Votre copropriété",
                "titleAccent": "en toute transparence",
                "subtitle": "Convocations, procès-verbaux, votes aux résolutions, suivi des appels de fonds et de votre compte individuel : tout votre dossier de copropriété au même endroit. Accès sécurisé par lien magique fourni par votre syndic.",
                "primaryCta": "Demander mon lien d'accès",
                "secondaryCta": "Comprendre la copropriété au Luxembourg",
            },
            "features": {
                "title": "Ce que vous trouvez dans votre espace",
                "intro": "Toutes les informations légales de votre copropriété, accessibles 24/7 depuis tout appareil.",
                "items": [
                    {"icon": "📋", "title": "Convocations & PV d'AG", "desc": "Téléchargez convocations, ordres du jour et procès-verbaux signés. Historique conservé."},
                    {"icon": "🗳️", "title": "Vote en ligne aux résolutions", "desc": "Votez par voie électronique aux assemblées générales (loi du 16 mai 1975 modifiée)."},
                    {"icon": "💶", "title": "Mon compte individuel", "desc": "Suivez vos appels de fonds, charges, paiements et solde à jour. Téléchargez votre relevé en PDF."},
                    {"icon": "🤖", "title": "Assistant IA copropriété", "desc": "Posez vos questions sur le règlement, les charges ou la loi luxembourgeoise — réponses sourcées."},
                ],
            },
            "access": {
                "title": "Comment accéder à votre espace",
                "intro": "Aucune création de compte. Votre syndic vous envoie un lien magique sécurisé personnel.",
                "steps": [
                    {"number": "1", "title": "Demande au syndic", "desc": "Contactez votre syndic professionnel ou bénévole et demandez votre lien d'accès copropriétaire tevaxia."},
                    {"number": "2", "title": "Réception par e-mail", "desc": "Vous recevez un e-mail contenant votre lien personnel. Conservez-le, il reste valide tant qu'il n'est pas révoqué."},
                    {"number": "3", "title": "Accès direct", "desc": "Cliquez sur le lien : vous arrivez sur votre dossier sans mot de passe. Pas d'application à installer."},
                ],
                "note": "Vous n'avez pas reçu de lien ? Votre syndic n'utilise peut-être pas encore tevaxia. Invitez-le à découvrir notre solution syndic.",
            },
            "faq": {
                "title": "Questions fréquentes",
                "items": [
                    {"q": "Le lien est-il sécurisé ?", "a": "Le token est aléatoire (256 bits), unique et opaque. Il identifie strictement votre lot et vos données. Vous pouvez demander à votre syndic de le révoquer à tout moment."},
                    {"q": "Puis-je voter à l'AG depuis l'espace ?", "a": "Oui, sur les résolutions ouvertes au vote électronique. La loi du 16 mai 1975 modifiée par celle du 6 juin 2023 permet le vote à distance si le règlement de copropriété ne l'interdit pas."},
                    {"q": "Et si je suis aussi locataire d'un autre bien ?", "a": "Vous pouvez avoir plusieurs accès distincts (un par lot copropriété + un par bail locatif). Chaque token est indépendant."},
                    {"q": "Mes données sont-elles conservées en Europe ?", "a": "Oui. tevaxia héberge toutes les données dans l'Union européenne (Supabase EU + Vercel EU). Conformité RGPD."},
                    {"q": "Combien coûte cet accès pour moi ?", "a": "L'accès copropriétaire est gratuit. C'est votre syndic qui souscrit à tevaxia pour gérer la copropriété."},
                ],
            },
            "related": {
                "title": "Pour aller plus loin",
                "items": [
                    {"label": "Guide copropriété Luxembourg", "href": "/guide/copropriete-luxembourg", "desc": "Loi du 16 mai 1975, AG, charges, conseil syndical."},
                    {"label": "Solution syndic", "href": "/solutions/syndic", "desc": "Pour les syndics professionnels et bénévoles."},
                    {"label": "Espace conseil syndical", "href": "/conseil-syndical", "desc": "Membres du conseil : pilotez la copropriété."},
                ],
            },
        },
        "conseilSyndical": {
            "meta": {
                "title": "Espace conseil syndical Luxembourg — portail tevaxia",
                "description": "Pilotez votre copropriété en tant que membre du conseil syndical : vue consolidée, suivi des travaux, préparation d'AG, communication aux copropriétaires.",
            },
            "hero": {
                "badge": "Portail conseil syndical",
                "title": "Pilotez votre copropriété",
                "titleAccent": "en confiance",
                "subtitle": "Vue d'ensemble des comptes, suivi des travaux votés, préparation des AG et communication consolidée aux copropriétaires. L'outil dédié aux membres élus du conseil syndical.",
                "primaryCta": "Demander mon lien d'accès",
                "secondaryCta": "Rôle du conseil syndical",
            },
            "features": {
                "title": "Vos outils de pilotage",
                "intro": "En tant que membre élu, vous représentez les copropriétaires et contrôlez le syndic. tevaxia vous donne les bons indicateurs.",
                "items": [
                    {"icon": "📊", "title": "Vue consolidée des comptes", "desc": "Soldes, charges courantes, fonds de roulement, fonds travaux, impayés agrégés."},
                    {"icon": "🛠️", "title": "Suivi des travaux", "desc": "État d'avancement des résolutions de travaux votées, devis comparés, factures."},
                    {"icon": "📝", "title": "Préparation d'AG", "desc": "Ordre du jour collaboratif, projets de résolution, documents à annexer."},
                    {"icon": "✉️", "title": "Communication copropriétaires", "desc": "Envoi groupé d'informations aux copropriétaires, archivage des échanges."},
                ],
            },
            "access": {
                "title": "Comment accéder à votre espace",
                "intro": "Le syndic vous attribue un accès conseil syndical lors de votre élection en AG.",
                "steps": [
                    {"number": "1", "title": "Élection en AG", "desc": "Vous êtes élu(e) au conseil syndical par l'assemblée générale (article 15-1 loi 1975)."},
                    {"number": "2", "title": "Lien envoyé par le syndic", "desc": "Le syndic vous transmet votre lien personnel d'accès conseil syndical par e-mail."},
                    {"number": "3", "title": "Accès permanent", "desc": "Connectez-vous à tout moment depuis n'importe quel appareil. Pas de mot de passe."},
                ],
                "note": "Le mandat du conseil syndical est limité dans la durée (généralement 1 à 3 ans). Votre accès est révoqué à la fin du mandat.",
            },
            "faq": {
                "title": "Questions fréquentes",
                "items": [
                    {"q": "Quelles sont mes obligations légales ?", "a": "Le conseil syndical assiste et contrôle le syndic. Il est consulté pour tout marché ou contrat dépassant un seuil défini par l'AG (article 15-1 loi du 16 mai 1975 modifiée)."},
                    {"q": "Puis-je voir les pièces comptables ?", "a": "Oui, le conseil syndical a accès aux pièces justificatives à tout moment. tevaxia donne accès aux factures scannées par le syndic."},
                    {"q": "Que faire si je détecte une anomalie ?", "a": "Signalez-la au syndic via la messagerie tevaxia (traçabilité conservée). En cas de litige, le conseil peut convoquer une AG extraordinaire."},
                    {"q": "Combien de membres dans un conseil ?", "a": "La loi luxembourgeoise n'impose pas de nombre fixe. La pratique est 3 à 5 membres pour une copropriété de taille moyenne."},
                ],
            },
            "related": {
                "title": "Pour aller plus loin",
                "items": [
                    {"label": "Guide copropriété", "href": "/guide/copropriete-luxembourg", "desc": "Loi 1975, rôle du conseil syndical, AG."},
                    {"label": "Solution syndic", "href": "/solutions/syndic", "desc": "Pour les syndics — outil de gestion complet."},
                    {"label": "Espace copropriétaire", "href": "/copropriete", "desc": "Portail individuel des copropriétaires."},
                ],
            },
        },
        "locataire": {
            "meta": {
                "title": "Espace locataire Luxembourg — portail tevaxia",
                "description": "Accédez à votre espace locataire : quittances de loyer, état des lieux numérique, avis de charges, assistant IA bail. Lien magique sécurisé fourni par votre bailleur.",
            },
            "hero": {
                "badge": "Portail locataire",
                "title": "Votre bail au Luxembourg",
                "titleAccent": "tout au même endroit",
                "subtitle": "Quittances de loyer, état des lieux numérique, avis de charges, échanges avec votre bailleur ou agence. Accès sécurisé par lien magique, sans création de compte.",
                "primaryCta": "Demander mon lien d'accès",
                "secondaryCta": "Comprendre votre bail",
            },
            "features": {
                "title": "Ce que vous trouvez dans votre espace",
                "intro": "Toutes les pièces de votre bail accessibles 24/7, conformes au droit locatif luxembourgeois.",
                "items": [
                    {"icon": "🧾", "title": "Quittances de loyer", "desc": "Téléchargez vos quittances mensuelles signées. Indispensables pour vos démarches administratives."},
                    {"icon": "📋", "title": "État des lieux numérique", "desc": "État d'entrée et de sortie horodatés avec photos. Comparaison côte à côte pour le contradictoire."},
                    {"icon": "💶", "title": "Avis de charges", "desc": "Régularisation annuelle détaillée poste par poste, avec pièces justificatives."},
                    {"icon": "🤖", "title": "Assistant IA bail", "desc": "Posez vos questions sur la loi du 21 septembre 2006 modifiée — droits, obligations, dépôt de garantie."},
                ],
            },
            "access": {
                "title": "Comment accéder à votre espace",
                "intro": "Aucune création de compte. Votre bailleur ou agence vous envoie un lien magique sécurisé personnel.",
                "steps": [
                    {"number": "1", "title": "Demande au bailleur", "desc": "Contactez votre bailleur ou l'agence qui gère votre bail et demandez votre lien d'accès locataire tevaxia."},
                    {"number": "2", "title": "Réception par e-mail", "desc": "Vous recevez un e-mail contenant votre lien personnel. Valide pour toute la durée de votre bail."},
                    {"number": "3", "title": "Accès direct", "desc": "Cliquez sur le lien : vous arrivez sur votre dossier sans mot de passe. Pas d'application à installer."},
                ],
                "note": "Vous n'avez pas reçu de lien ? Votre bailleur n'utilise peut-être pas encore tevaxia. Invitez-le à découvrir notre solution gestion locative.",
            },
            "faq": {
                "title": "Questions fréquentes",
                "items": [
                    {"q": "Le lien est-il sécurisé ?", "a": "Le token est aléatoire (256 bits), unique et opaque. Vous pouvez demander à votre bailleur de le révoquer à tout moment."},
                    {"q": "Que faire en cas de litige sur les charges ?", "a": "Vous avez le droit de consulter les pièces justificatives. La loi du 21 septembre 2006 modifiée encadre la régularisation. En cas de désaccord persistant, la commission des loyers peut être saisie."},
                    {"q": "Le dépôt de garantie est-il géré ici ?", "a": "Le suivi du dépôt de garantie (placé sur compte bloqué selon l'article 5 de la loi) est visible dans votre espace, avec date de placement et restitution prévue."},
                    {"q": "Et si je change de logement ?", "a": "Votre nouveau bailleur vous transmettra un nouveau lien. L'ancien reste consultable en mode lecture seule pendant 12 mois."},
                    {"q": "Combien coûte cet accès pour moi ?", "a": "L'accès locataire est gratuit. C'est votre bailleur qui souscrit à tevaxia."},
                ],
            },
            "related": {
                "title": "Pour aller plus loin",
                "items": [
                    {"label": "Guide bail habitation", "href": "/guide/bail-habitation-luxembourg", "desc": "Loi 21 septembre 2006, droits, obligations, charges."},
                    {"label": "Règle des 5%", "href": "/guide/regle-5-pourcent-loyer", "desc": "Plafond légal du loyer au Luxembourg."},
                    {"label": "Calculateur loyer", "href": "/calculateur-loyer", "desc": "Vérifiez si votre loyer respecte la règle des 5%."},
                ],
            },
        },
    },
    "en": {
        "copropriete": {
            "meta": {
                "title": "Co-owner portal Luxembourg — tevaxia access",
                "description": "Access your co-owner portal: AGM notices, online voting, individual accounts, fund calls. Secure magic link provided by your syndic.",
            },
            "hero": {
                "badge": "Co-owner portal",
                "title": "Your co-ownership",
                "titleAccent": "in full transparency",
                "subtitle": "AGM notices, minutes, online voting, fund call tracking and individual account: your full co-ownership file in one place. Secure magic link access provided by your syndic.",
                "primaryCta": "Request my access link",
                "secondaryCta": "Understand co-ownership in Luxembourg",
            },
            "features": {
                "title": "What you find in your portal",
                "intro": "All legal information about your co-ownership, available 24/7 from any device.",
                "items": [
                    {"icon": "📋", "title": "AGM notices & minutes", "desc": "Download notices, agendas and signed minutes. Full history kept."},
                    {"icon": "🗳️", "title": "Online voting on resolutions", "desc": "Vote electronically at general assemblies (Law of 16 May 1975 as amended)."},
                    {"icon": "💶", "title": "My individual account", "desc": "Track fund calls, charges, payments and current balance. Download your statement as PDF."},
                    {"icon": "🤖", "title": "AI co-ownership assistant", "desc": "Ask about the rules, charges or Luxembourg law — sourced answers."},
                ],
            },
            "access": {
                "title": "How to access your portal",
                "intro": "No account creation. Your syndic sends you a secure personal magic link.",
                "steps": [
                    {"number": "1", "title": "Request from syndic", "desc": "Contact your professional or volunteer syndic and request your tevaxia co-owner access link."},
                    {"number": "2", "title": "Receive by email", "desc": "You receive an email with your personal link. Keep it — valid as long as not revoked."},
                    {"number": "3", "title": "Direct access", "desc": "Click the link: you reach your file without a password. No app to install."},
                ],
                "note": "Haven't received a link? Your syndic may not use tevaxia yet. Invite them to discover our syndic solution.",
            },
            "faq": {
                "title": "Frequently asked questions",
                "items": [
                    {"q": "Is the link secure?", "a": "The token is random (256 bits), unique and opaque. It strictly identifies your lot and your data. You can ask your syndic to revoke it at any time."},
                    {"q": "Can I vote at the AGM from the portal?", "a": "Yes, on resolutions open for electronic voting. Luxembourg law of 16 May 1975 (amended 6 June 2023) allows remote voting unless the co-ownership rules forbid it."},
                    {"q": "What if I'm also a tenant elsewhere?", "a": "You can have multiple separate accesses (one per co-ownership lot + one per rental lease). Each token is independent."},
                    {"q": "Is my data stored in Europe?", "a": "Yes. tevaxia hosts all data in the European Union (Supabase EU + Vercel EU). GDPR compliant."},
                    {"q": "How much does this access cost me?", "a": "Co-owner access is free. Your syndic subscribes to tevaxia to manage the co-ownership."},
                ],
            },
            "related": {
                "title": "Going further",
                "items": [
                    {"label": "Co-ownership guide Luxembourg", "href": "/guide/copropriete-luxembourg", "desc": "Law of 16 May 1975, AGM, charges, syndic council."},
                    {"label": "Syndic solution", "href": "/solutions/syndic", "desc": "For professional and volunteer syndics."},
                    {"label": "Syndic council portal", "href": "/conseil-syndical", "desc": "Council members: steer the co-ownership."},
                ],
            },
        },
        "conseilSyndical": {
            "meta": {
                "title": "Syndic council portal Luxembourg — tevaxia",
                "description": "Steer your co-ownership as a syndic council member: consolidated view, works tracking, AGM preparation, owner communication.",
            },
            "hero": {
                "badge": "Syndic council portal",
                "title": "Steer your co-ownership",
                "titleAccent": "with confidence",
                "subtitle": "Consolidated account view, voted works tracking, AGM preparation and consolidated communication to owners. The dedicated tool for elected syndic council members.",
                "primaryCta": "Request my access link",
                "secondaryCta": "Syndic council role",
            },
            "features": {
                "title": "Your steering tools",
                "intro": "As an elected member, you represent the owners and oversee the syndic. tevaxia gives you the right indicators.",
                "items": [
                    {"icon": "📊", "title": "Consolidated account view", "desc": "Balances, current charges, working fund, works fund, aggregated arrears."},
                    {"icon": "🛠️", "title": "Works tracking", "desc": "Status of voted works resolutions, compared quotes, invoices."},
                    {"icon": "📝", "title": "AGM preparation", "desc": "Collaborative agenda, draft resolutions, documents to attach."},
                    {"icon": "✉️", "title": "Owner communication", "desc": "Group messaging to owners, archived exchanges."},
                ],
            },
            "access": {
                "title": "How to access your portal",
                "intro": "The syndic grants you syndic council access upon your election at the AGM.",
                "steps": [
                    {"number": "1", "title": "Election at AGM", "desc": "You are elected to the syndic council by the general assembly (Article 15-1, Law 1975)."},
                    {"number": "2", "title": "Link sent by syndic", "desc": "The syndic sends your personal syndic council access link by email."},
                    {"number": "3", "title": "Permanent access", "desc": "Connect any time from any device. No password required."},
                ],
                "note": "The syndic council mandate is time-limited (usually 1 to 3 years). Your access is revoked at the end of the mandate.",
            },
            "faq": {
                "title": "Frequently asked questions",
                "items": [
                    {"q": "What are my legal duties?", "a": "The syndic council assists and oversees the syndic. It must be consulted for any contract above a threshold set by the AGM (Article 15-1, Law of 16 May 1975 as amended)."},
                    {"q": "Can I see accounting documents?", "a": "Yes, the syndic council can access supporting documents at any time. tevaxia gives access to invoices scanned by the syndic."},
                    {"q": "What if I detect an anomaly?", "a": "Report it to the syndic via tevaxia messaging (traceability kept). In case of dispute, the council can call an extraordinary AGM."},
                    {"q": "How many council members?", "a": "Luxembourg law sets no fixed number. Practice is 3 to 5 members for a medium-sized co-ownership."},
                ],
            },
            "related": {
                "title": "Going further",
                "items": [
                    {"label": "Co-ownership guide", "href": "/guide/copropriete-luxembourg", "desc": "Law 1975, syndic council role, AGM."},
                    {"label": "Syndic solution", "href": "/solutions/syndic", "desc": "For syndics — full management tool."},
                    {"label": "Co-owner portal", "href": "/copropriete", "desc": "Individual portal for co-owners."},
                ],
            },
        },
        "locataire": {
            "meta": {
                "title": "Tenant portal Luxembourg — tevaxia",
                "description": "Access your tenant portal: rent receipts, digital condition reports, charge statements, lease AI assistant. Secure magic link provided by your landlord.",
            },
            "hero": {
                "badge": "Tenant portal",
                "title": "Your Luxembourg lease",
                "titleAccent": "all in one place",
                "subtitle": "Rent receipts, digital condition reports, charge statements, exchanges with your landlord or agency. Secure magic link access without account creation.",
                "primaryCta": "Request my access link",
                "secondaryCta": "Understand your lease",
            },
            "features": {
                "title": "What you find in your portal",
                "intro": "All your lease documents accessible 24/7, compliant with Luxembourg rental law.",
                "items": [
                    {"icon": "🧾", "title": "Rent receipts", "desc": "Download your signed monthly receipts. Essential for administrative procedures."},
                    {"icon": "📋", "title": "Digital condition report", "desc": "Time-stamped entry and exit reports with photos. Side-by-side comparison."},
                    {"icon": "💶", "title": "Charge statements", "desc": "Annual reconciliation broken down line by line, with supporting documents."},
                    {"icon": "🤖", "title": "AI lease assistant", "desc": "Ask about Luxembourg law of 21 September 2006 — rights, duties, deposit."},
                ],
            },
            "access": {
                "title": "How to access your portal",
                "intro": "No account creation. Your landlord or agency sends you a secure personal magic link.",
                "steps": [
                    {"number": "1", "title": "Request from landlord", "desc": "Contact your landlord or the agency managing your lease and request your tevaxia tenant access link."},
                    {"number": "2", "title": "Receive by email", "desc": "You receive an email with your personal link. Valid for the entire lease duration."},
                    {"number": "3", "title": "Direct access", "desc": "Click the link: you reach your file without a password. No app to install."},
                ],
                "note": "Haven't received a link? Your landlord may not use tevaxia yet. Invite them to discover our rental management solution.",
            },
            "faq": {
                "title": "Frequently asked questions",
                "items": [
                    {"q": "Is the link secure?", "a": "The token is random (256 bits), unique and opaque. You can ask your landlord to revoke it at any time."},
                    {"q": "What if I dispute the charges?", "a": "You have the right to consult supporting documents. Luxembourg law of 21 September 2006 governs reconciliation. In case of persistent disagreement, the rent commission can be seized."},
                    {"q": "Is the deposit managed here?", "a": "Yes — the deposit (placed on a blocked account per Article 5 of the law) is visible in your portal, with placement and expected restitution dates."},
                    {"q": "What if I move?", "a": "Your new landlord will send you a new link. The old one stays read-only for 12 months."},
                    {"q": "How much does this access cost me?", "a": "Tenant access is free. Your landlord subscribes to tevaxia."},
                ],
            },
            "related": {
                "title": "Going further",
                "items": [
                    {"label": "Housing lease guide", "href": "/guide/bail-habitation-luxembourg", "desc": "Law 21 September 2006, rights, duties, charges."},
                    {"label": "5% rule", "href": "/guide/regle-5-pourcent-loyer", "desc": "Legal rent cap in Luxembourg."},
                    {"label": "Rent calculator", "href": "/calculateur-loyer", "desc": "Check whether your rent complies with the 5% rule."},
                ],
            },
        },
    },
    "de": {
        "copropriete": {
            "meta": {
                "title": "Miteigentümerportal Luxemburg — tevaxia Zugang",
                "description": "Zugang zu Ihrem Miteigentümerportal: Einberufungen zur ETV, Online-Abstimmungen, individuelle Konten, Mittelabrufe. Sicherer Magic-Link von Ihrem Verwalter.",
            },
            "hero": {
                "badge": "Miteigentümerportal",
                "title": "Ihre Wohneigentumsgemeinschaft",
                "titleAccent": "in voller Transparenz",
                "subtitle": "Einberufungen, Protokolle, Online-Abstimmungen, Verfolgung der Mittelabrufe und individuelles Konto: Ihre gesamte Akte an einem Ort. Sicherer Zugang per Magic-Link Ihres Verwalters.",
                "primaryCta": "Meinen Zugangslink anfordern",
                "secondaryCta": "Wohneigentum in Luxemburg verstehen",
            },
            "features": {
                "title": "Was Sie in Ihrem Portal finden",
                "intro": "Alle rechtlichen Informationen zu Ihrer Gemeinschaft, rund um die Uhr von jedem Gerät verfügbar.",
                "items": [
                    {"icon": "📋", "title": "Einberufungen & Protokolle", "desc": "Einberufungen, Tagesordnungen und unterzeichnete Protokolle herunterladen. Vollständige Historie."},
                    {"icon": "🗳️", "title": "Online-Abstimmung", "desc": "Elektronisch in der Eigentümerversammlung abstimmen (Gesetz vom 16. Mai 1975 in der geänderten Fassung)."},
                    {"icon": "💶", "title": "Mein individuelles Konto", "desc": "Mittelabrufe, Lasten, Zahlungen und aktueller Saldo. Auszug als PDF herunterladbar."},
                    {"icon": "🤖", "title": "KI-Assistent Wohneigentum", "desc": "Fragen zum Reglement, zu Lasten oder luxemburgischem Recht — mit Quellen."},
                ],
            },
            "access": {
                "title": "So greifen Sie auf Ihr Portal zu",
                "intro": "Keine Kontoerstellung. Ihr Verwalter sendet Ihnen einen sicheren persönlichen Magic-Link.",
                "steps": [
                    {"number": "1", "title": "Anfrage beim Verwalter", "desc": "Kontaktieren Sie Ihren professionellen oder ehrenamtlichen Verwalter und fordern Sie Ihren tevaxia-Zugangslink an."},
                    {"number": "2", "title": "E-Mail-Zustellung", "desc": "Sie erhalten eine E-Mail mit Ihrem persönlichen Link. Bewahren Sie ihn auf — gültig, solange er nicht widerrufen wird."},
                    {"number": "3", "title": "Direktzugriff", "desc": "Klicken Sie auf den Link: Sie gelangen ohne Passwort zu Ihrer Akte. Keine App zu installieren."},
                ],
                "note": "Keinen Link erhalten? Ihr Verwalter nutzt tevaxia eventuell noch nicht. Laden Sie ihn ein, unsere Verwalterlösung zu entdecken.",
            },
            "faq": {
                "title": "Häufig gestellte Fragen",
                "items": [
                    {"q": "Ist der Link sicher?", "a": "Der Token ist zufällig (256 Bit), eindeutig und opak. Er identifiziert ausschließlich Ihren Anteil und Ihre Daten. Sie können Ihren Verwalter jederzeit bitten, ihn zu widerrufen."},
                    {"q": "Kann ich aus dem Portal abstimmen?", "a": "Ja, bei Beschlüssen, die für elektronische Abstimmung freigegeben sind. Das luxemburgische Gesetz vom 16. Mai 1975 (geändert am 6. Juni 2023) erlaubt Fernabstimmungen, sofern das Reglement es nicht ausschließt."},
                    {"q": "Was, wenn ich auch Mieter bin?", "a": "Sie können mehrere getrennte Zugänge haben (einer pro Wohneigentum + einer pro Mietvertrag). Jeder Token ist unabhängig."},
                    {"q": "Werden meine Daten in Europa gespeichert?", "a": "Ja. tevaxia hostet alle Daten in der EU (Supabase EU + Vercel EU). DSGVO-konform."},
                    {"q": "Was kostet mich dieser Zugang?", "a": "Der Miteigentümerzugang ist kostenlos. Ihr Verwalter abonniert tevaxia für die Verwaltung."},
                ],
            },
            "related": {
                "title": "Weiterlesen",
                "items": [
                    {"label": "Leitfaden Wohneigentum Luxemburg", "href": "/guide/copropriete-luxembourg", "desc": "Gesetz vom 16. Mai 1975, ETV, Lasten, Verwaltungsbeirat."},
                    {"label": "Verwalterlösung", "href": "/solutions/syndic", "desc": "Für professionelle und ehrenamtliche Verwalter."},
                    {"label": "Verwaltungsbeirat", "href": "/conseil-syndical", "desc": "Beiratsmitglieder: Steuern Sie die Gemeinschaft."},
                ],
            },
        },
        "conseilSyndical": {
            "meta": {
                "title": "Verwaltungsbeirat Luxemburg — tevaxia Portal",
                "description": "Steuern Sie Ihre Wohneigentumsgemeinschaft als Beiratsmitglied: konsolidierte Sicht, Bauverfolgung, ETV-Vorbereitung, Eigentümerkommunikation.",
            },
            "hero": {
                "badge": "Verwaltungsbeirat",
                "title": "Steuern Sie Ihre Gemeinschaft",
                "titleAccent": "mit Vertrauen",
                "subtitle": "Konsolidierte Kontensicht, Verfolgung der beschlossenen Arbeiten, ETV-Vorbereitung und konsolidierte Kommunikation. Das spezielle Werkzeug für gewählte Beiratsmitglieder.",
                "primaryCta": "Meinen Zugangslink anfordern",
                "secondaryCta": "Rolle des Beirats",
            },
            "features": {
                "title": "Ihre Steuerungswerkzeuge",
                "intro": "Als gewähltes Mitglied vertreten Sie die Eigentümer und überwachen den Verwalter. tevaxia liefert Ihnen die richtigen Indikatoren.",
                "items": [
                    {"icon": "📊", "title": "Konsolidierte Kontensicht", "desc": "Salden, laufende Lasten, Betriebsfonds, Bauarbeitsfonds, aggregierte Rückstände."},
                    {"icon": "🛠️", "title": "Bauverfolgung", "desc": "Status der beschlossenen Bauresolutionen, verglichene Angebote, Rechnungen."},
                    {"icon": "📝", "title": "ETV-Vorbereitung", "desc": "Kollaborative Tagesordnung, Beschlussentwürfe, beizufügende Dokumente."},
                    {"icon": "✉️", "title": "Eigentümerkommunikation", "desc": "Sammelversand an Eigentümer, archivierter Austausch."},
                ],
            },
            "access": {
                "title": "So greifen Sie auf Ihr Portal zu",
                "intro": "Der Verwalter gewährt Ihnen den Beiratszugang nach Ihrer Wahl in der ETV.",
                "steps": [
                    {"number": "1", "title": "Wahl in der ETV", "desc": "Sie werden von der Eigentümerversammlung in den Beirat gewählt (Artikel 15-1 Gesetz 1975)."},
                    {"number": "2", "title": "Link vom Verwalter", "desc": "Der Verwalter sendet Ihren persönlichen Beiratszugang per E-Mail."},
                    {"number": "3", "title": "Dauerhafter Zugang", "desc": "Verbinden Sie sich jederzeit von jedem Gerät. Kein Passwort erforderlich."},
                ],
                "note": "Das Beiratsmandat ist zeitlich begrenzt (üblicherweise 1 bis 3 Jahre). Ihr Zugang wird am Mandatsende widerrufen.",
            },
            "faq": {
                "title": "Häufig gestellte Fragen",
                "items": [
                    {"q": "Welche rechtlichen Pflichten habe ich?", "a": "Der Beirat unterstützt und überwacht den Verwalter. Er ist bei jedem Vertrag zu konsultieren, der eine von der ETV festgelegte Schwelle überschreitet (Artikel 15-1 Gesetz vom 16. Mai 1975)."},
                    {"q": "Kann ich Buchhaltungsbelege einsehen?", "a": "Ja, der Beirat hat jederzeit Zugang zu Belegen. tevaxia gibt Zugriff auf vom Verwalter eingescannte Rechnungen."},
                    {"q": "Was bei Unregelmäßigkeiten?", "a": "Melden Sie diese dem Verwalter über die tevaxia-Nachrichten (Nachvollziehbarkeit gewährleistet). Bei Streit kann der Beirat eine außerordentliche ETV einberufen."},
                    {"q": "Wie viele Beiratsmitglieder?", "a": "Das luxemburgische Gesetz schreibt keine feste Zahl vor. In der Praxis 3 bis 5 Mitglieder bei mittelgroßen Gemeinschaften."},
                ],
            },
            "related": {
                "title": "Weiterlesen",
                "items": [
                    {"label": "Leitfaden Wohneigentum", "href": "/guide/copropriete-luxembourg", "desc": "Gesetz 1975, Beirat, ETV."},
                    {"label": "Verwalterlösung", "href": "/solutions/syndic", "desc": "Für Verwalter — vollständiges Verwaltungswerkzeug."},
                    {"label": "Miteigentümerportal", "href": "/copropriete", "desc": "Individuelles Portal für Miteigentümer."},
                ],
            },
        },
        "locataire": {
            "meta": {
                "title": "Mieterportal Luxemburg — tevaxia",
                "description": "Zugang zu Ihrem Mieterportal: Mietquittungen, digitale Wohnungsübergabe, Nebenkostenabrechnungen, KI-Mietassistent. Sicherer Magic-Link Ihres Vermieters.",
            },
            "hero": {
                "badge": "Mieterportal",
                "title": "Ihr Mietvertrag in Luxemburg",
                "titleAccent": "alles an einem Ort",
                "subtitle": "Mietquittungen, digitale Wohnungsübergabe, Nebenkostenabrechnungen, Austausch mit Vermieter oder Agentur. Sicherer Magic-Link ohne Kontoerstellung.",
                "primaryCta": "Meinen Zugangslink anfordern",
                "secondaryCta": "Ihren Mietvertrag verstehen",
            },
            "features": {
                "title": "Was Sie in Ihrem Portal finden",
                "intro": "Alle Vertragsunterlagen rund um die Uhr verfügbar, konform mit luxemburgischem Mietrecht.",
                "items": [
                    {"icon": "🧾", "title": "Mietquittungen", "desc": "Unterzeichnete monatliche Quittungen herunterladen. Unverzichtbar für Behördengänge."},
                    {"icon": "📋", "title": "Digitale Wohnungsübergabe", "desc": "Zeitgestempelte Ein- und Ausgangsprotokolle mit Fotos. Vergleich nebeneinander."},
                    {"icon": "💶", "title": "Nebenkostenabrechnung", "desc": "Detaillierte jährliche Abrechnung Posten für Posten, mit Belegen."},
                    {"icon": "🤖", "title": "KI-Mietassistent", "desc": "Fragen zum Gesetz vom 21. September 2006 — Rechte, Pflichten, Kaution."},
                ],
            },
            "access": {
                "title": "So greifen Sie auf Ihr Portal zu",
                "intro": "Keine Kontoerstellung. Ihr Vermieter oder die Agentur sendet Ihnen einen sicheren persönlichen Magic-Link.",
                "steps": [
                    {"number": "1", "title": "Anfrage beim Vermieter", "desc": "Kontaktieren Sie Ihren Vermieter oder die Agentur und fordern Sie Ihren tevaxia-Mieterzugang an."},
                    {"number": "2", "title": "E-Mail-Zustellung", "desc": "Sie erhalten eine E-Mail mit Ihrem persönlichen Link. Gültig für die gesamte Mietdauer."},
                    {"number": "3", "title": "Direktzugriff", "desc": "Klicken Sie auf den Link: Sie gelangen ohne Passwort zu Ihrer Akte. Keine App zu installieren."},
                ],
                "note": "Keinen Link erhalten? Ihr Vermieter nutzt tevaxia eventuell noch nicht. Laden Sie ihn ein, unsere Mietverwaltungslösung zu entdecken.",
            },
            "faq": {
                "title": "Häufig gestellte Fragen",
                "items": [
                    {"q": "Ist der Link sicher?", "a": "Der Token ist zufällig (256 Bit), eindeutig und opak. Sie können Ihren Vermieter jederzeit bitten, ihn zu widerrufen."},
                    {"q": "Was bei Streit über Nebenkosten?", "a": "Sie haben das Recht, Belege einzusehen. Das Gesetz vom 21. September 2006 regelt die Abrechnung. Bei dauerhaftem Streit kann die Mietkommission angerufen werden."},
                    {"q": "Wird die Kaution hier verwaltet?", "a": "Ja — die Kaution (auf Sperrkonto gemäß Artikel 5 des Gesetzes) ist im Portal sichtbar, mit Hinterlegungs- und voraussichtlichem Rückgabedatum."},
                    {"q": "Was beim Umzug?", "a": "Ihr neuer Vermieter sendet einen neuen Link. Der alte bleibt 12 Monate nur zur Ansicht verfügbar."},
                    {"q": "Was kostet mich dieser Zugang?", "a": "Der Mieterzugang ist kostenlos. Ihr Vermieter abonniert tevaxia."},
                ],
            },
            "related": {
                "title": "Weiterlesen",
                "items": [
                    {"label": "Leitfaden Wohnungsmietvertrag", "href": "/guide/bail-habitation-luxembourg", "desc": "Gesetz 21. September 2006, Rechte, Pflichten, Lasten."},
                    {"label": "5%-Regel", "href": "/guide/regle-5-pourcent-loyer", "desc": "Gesetzliche Mietobergrenze in Luxemburg."},
                    {"label": "Mietrechner", "href": "/calculateur-loyer", "desc": "Prüfen Sie, ob Ihre Miete der 5%-Regel entspricht."},
                ],
            },
        },
    },
    "lb": {
        "copropriete": {
            "meta": {
                "title": "Matbesëtzerportal Lëtzebuerg — tevaxia Zougang",
                "description": "Zougang zu Ärem Matbesëtzerportal: AV-Aluedungen, Online-Ofstëmmungen, individuell Konten, Fongsuriffer. Séchere Magic-Link vum Verwalter.",
            },
            "hero": {
                "badge": "Matbesëtzerportal",
                "title": "Är Matbesëtzergemeinschaft",
                "titleAccent": "an voller Transparenz",
                "subtitle": "Aluedungen, Protokoller, Online-Ofstëmmungen, Suivi vun de Fongsuriffer an individuellt Kont: Är ganz Akt op enger Plaz. Séchere Zougang iwwer Magic-Link vum Verwalter.",
                "primaryCta": "Mäi Zougangslink ufroen",
                "secondaryCta": "Matbesëtz zu Lëtzebuerg verstoen",
            },
            "features": {
                "title": "Wat Dir am Portal fannt",
                "intro": "All gesetzlech Informatiounen iwwer Är Gemeinschaft, 24/7 op all Apparat verfügbar.",
                "items": [
                    {"icon": "📋", "title": "Aluedungen & Protokoller", "desc": "Aluedungen, Dagesuerdnungen an ënnerschriwwen Protokoller eroflueden. Komplett Historik."},
                    {"icon": "🗳️", "title": "Online-Ofstëmmung", "desc": "Elektronesch op der Generalversammlung ofstëmmen (Gesetz vum 16. Mee 1975 a senger geännerter Versioun)."},
                    {"icon": "💶", "title": "Mäin individuellt Kont", "desc": "Fongsuriffer, Lasten, Bezuelungen an aktuelle Saldo. Auszug als PDF eroflueden."},
                    {"icon": "🤖", "title": "KI-Assistent Matbesëtz", "desc": "Froen iwwer d'Reglement, d'Lasten oder lëtzebuergescht Recht — mat Quellen."},
                ],
            },
            "access": {
                "title": "Wéi op Äert Portal zougräifen",
                "intro": "Keng Kontoerstellung. Äre Verwalter schéckt Iech e séchere perséinleche Magic-Link.",
                "steps": [
                    {"number": "1", "title": "Ufro beim Verwalter", "desc": "Kontaktéiert Äre professionnelle oder éierenamtleche Verwalter an froet Ären tevaxia-Zougangslink un."},
                    {"number": "2", "title": "Receptioun per Mail", "desc": "Dir kritt eng E-Mail mat Ärem perséinleche Link. Gëlteg, soulang en net widerrufen ass."},
                    {"number": "3", "title": "Direkten Zougang", "desc": "Klickt op de Link: Dir kommt ouni Passwuert op Är Akt. Keng App ze installéieren."},
                ],
                "note": "Keen Link kritt? Äre Verwalter benotzt eventuell nach net tevaxia. Invitéiert hien, eis Verwalterléisung z'entdecken.",
            },
            "faq": {
                "title": "Heefeg gestallt Froen",
                "items": [
                    {"q": "Ass de Link sécher?", "a": "Den Token ass zoufälleg (256 Bit), eenzegaarteg an opak. En identifizéiert strikt Äert Lot an Är Donnéeën. Dir kënnt Äre Verwalter zu all Moment froen, en ze widerrufen."},
                    {"q": "Kann ech aus dem Portal ofstëmmen?", "a": "Jo, op Beschlëss, déi fir elektronesch Ofstëmmung opgemaach sinn. D'Lëtzebuerger Gesetz vum 16. Mee 1975 (geännert 6. Juni 2023) erlaabt Fernofstëmmungen, wann d'Reglement et net verbitt."},
                    {"q": "Wat wann ech och Locataire sinn?", "a": "Dir kënnt méi getrennte Zougäng hunn (een pro Matbesëtzerlot + een pro Locatiounskontrakt). All Token ass onofhängeg."},
                    {"q": "Sinn meng Donnéeën an Europa?", "a": "Jo. tevaxia hostet all Donnéeën an der EU (Supabase EU + Vercel EU). DSGVO-konform."},
                    {"q": "Wat kascht mech dëse Zougang?", "a": "De Matbesëtzerzougang ass gratis. Äre Verwalter abonnéiert tevaxia fir d'Verwaltung."},
                ],
            },
            "related": {
                "title": "Méi liesen",
                "items": [
                    {"label": "Guide Matbesëtz Lëtzebuerg", "href": "/guide/copropriete-luxembourg", "desc": "Gesetz vum 16. Mee 1975, AV, Lasten, Verwaltungsrot."},
                    {"label": "Verwalterléisung", "href": "/solutions/syndic", "desc": "Fir professionnel an éierenamtlech Verwalter."},
                    {"label": "Verwaltungsrot", "href": "/conseil-syndical", "desc": "Rotsmemberen: Steiert d'Gemeinschaft."},
                ],
            },
        },
        "conseilSyndical": {
            "meta": {
                "title": "Verwaltungsrot Lëtzebuerg — tevaxia Portal",
                "description": "Steiert Är Matbesëtzergemeinschaft als Rotsmember: konsolidéiert Vue, Suivi vun den Aarbechten, AV-Virbereedung, Kommunikatioun mat den Eegentümer.",
            },
            "hero": {
                "badge": "Verwaltungsrot",
                "title": "Steiert Är Gemeinschaft",
                "titleAccent": "mat Vertrauen",
                "subtitle": "Konsolidéiert Kontosvue, Suivi vun de Stëmmaarbechten, AV-Virbereedung a konsolidéiert Kommunikatioun. Den dediéierten Outil fir gewielten Rotsmemberen.",
                "primaryCta": "Mäi Zougangslink ufroen",
                "secondaryCta": "Roll vum Rot",
            },
            "features": {
                "title": "Är Steierungsouti",
                "intro": "Als gewielte Member representéiert Dir d'Eegentümer a kontrolléiert de Verwalter. tevaxia gëtt Iech déi richteg Indicateuren.",
                "items": [
                    {"icon": "📊", "title": "Konsolidéiert Kontosvue", "desc": "Salden, lafend Lasten, Bedriffsfong, Aarbechtsfong, aggregéiert Réckstänn."},
                    {"icon": "🛠️", "title": "Suivi vun den Aarbechten", "desc": "Status vun de gestëmmten Aarbechtsresolutiounen, vergläichend Devisen, Rechnungen."},
                    {"icon": "📝", "title": "AV-Virbereedung", "desc": "Kollaborativ Dagesuerdnung, Resolutiounsentwerfer, Dokumenter ze annexéieren."},
                    {"icon": "✉️", "title": "Eegentümerkommunikatioun", "desc": "Grupp-Versand un d'Eegentümer, archivéierten Austausch."},
                ],
            },
            "access": {
                "title": "Wéi op Äert Portal zougräifen",
                "intro": "De Verwalter gëtt Iech den Zougang Verwaltungsrot bei Ärer Wahl an der AV.",
                "steps": [
                    {"number": "1", "title": "Wahl an der AV", "desc": "Dir gitt vun der Generalversammlung an de Rot gewielt (Artikel 15-1 Gesetz 1975)."},
                    {"number": "2", "title": "Link vum Verwalter", "desc": "De Verwalter schéckt Ären perséinleche Rotszougang per Mail."},
                    {"number": "3", "title": "Permanent Zougang", "desc": "Verbënnt Iech zu all Moment vu jiddwerengem Apparat. Kee Passwuert."},
                ],
                "note": "De Rotsmandat ass zäitlech limitéiert (normalerweis 1 bis 3 Joer). Äre Zougang gëtt um Enn vum Mandat widerrufen.",
            },
            "faq": {
                "title": "Heefeg gestallt Froen",
                "items": [
                    {"q": "Wéi sinn meng gesetzlech Flichten?", "a": "De Rot ënnerstëtzt a kontrolléiert de Verwalter. Hie muss bei all Kontrakt iwwer enger vun der AV festgeluechter Schwell konsultéiert ginn (Artikel 15-1 Gesetz vum 16. Mee 1975)."},
                    {"q": "Kann ech d'Buchhaltungsbeleeg gesinn?", "a": "Jo, de Rot huet zu all Moment Zougang zu de Beleeg. tevaxia gëtt Zougang zu de vum Verwalter gescannte Rechnungen."},
                    {"q": "Wat bei Onregelmäßegkeeten?", "a": "Mellt se dem Verwalter iwwer d'tevaxia-Messagerie (Nochweesbarkeet erhale). Bei Sträit kann de Rot eng aussergewéinlech AV beruffen."},
                    {"q": "Wéi vill Rotsmemberen?", "a": "D'Lëtzebuerger Gesetz schreift keng feste Zuel vir. Praxis ass 3 bis 5 Memberen bei mëttelgroussen Gemeinschaften."},
                ],
            },
            "related": {
                "title": "Méi liesen",
                "items": [
                    {"label": "Guide Matbesëtz", "href": "/guide/copropriete-luxembourg", "desc": "Gesetz 1975, Rot, AV."},
                    {"label": "Verwalterléisung", "href": "/solutions/syndic", "desc": "Fir Verwalter — komplett Verwaltungsoutil."},
                    {"label": "Matbesëtzerportal", "href": "/copropriete", "desc": "Individuellt Portal fir Matbesëtzer."},
                ],
            },
        },
        "locataire": {
            "meta": {
                "title": "Locatairesportal Lëtzebuerg — tevaxia",
                "description": "Zougang zu Ärem Locatairesportal: Locatiounsquittungen, digital Wunnengsiwwerreechung, Lastenofrechnungen, KI-Locatiounsassistent. Séchere Magic-Link vum Bailleur.",
            },
            "hero": {
                "badge": "Locatairesportal",
                "title": "Äre Bail zu Lëtzebuerg",
                "titleAccent": "alles op enger Plaz",
                "subtitle": "Locatiounsquittungen, digital Wunnengsiwwerreechung, Lastenofrechnungen, Austausch mat Bailleur oder Agence. Séchere Magic-Link ouni Kontoerstellung.",
                "primaryCta": "Mäi Zougangslink ufroen",
                "secondaryCta": "Äre Bail verstoen",
            },
            "features": {
                "title": "Wat Dir am Portal fannt",
                "intro": "All Är Bail-Dokumenter 24/7 verfügbar, konform mat Lëtzebuerger Locatiounsrecht.",
                "items": [
                    {"icon": "🧾", "title": "Locatiounsquittungen", "desc": "Är ënnerschriwwen monatlech Quittungen eroflueden. Onverzichtbar fir administrativ Schrëtt."},
                    {"icon": "📋", "title": "Digital Wunnengsiwwerreechung", "desc": "Zäitgestempelt Ein- an Ausgangsprotokoller mat Fotoen. Vergläich niewenanner."},
                    {"icon": "💶", "title": "Lastenofrechnung", "desc": "Detailléiert jährlech Ofrechnung Pos fir Pos, mat Beleeg."},
                    {"icon": "🤖", "title": "KI-Locatiounsassistent", "desc": "Froen iwwer d'Gesetz vum 21. September 2006 — Rechter, Flichten, Garantie."},
                ],
            },
            "access": {
                "title": "Wéi op Äert Portal zougräifen",
                "intro": "Keng Kontoerstellung. Äre Bailleur oder d'Agence schéckt Iech e séchere perséinleche Magic-Link.",
                "steps": [
                    {"number": "1", "title": "Ufro beim Bailleur", "desc": "Kontaktéiert Äre Bailleur oder d'Agence a froet Ären tevaxia-Locatairezougang un."},
                    {"number": "2", "title": "Receptioun per Mail", "desc": "Dir kritt eng E-Mail mat Ärem perséinleche Link. Gëlteg fir d'ganz Locatiounsdauer."},
                    {"number": "3", "title": "Direkten Zougang", "desc": "Klickt op de Link: Dir kommt ouni Passwuert op Är Akt. Keng App ze installéieren."},
                ],
                "note": "Keen Link kritt? Äre Bailleur benotzt eventuell nach net tevaxia. Invitéiert hien, eis Locatiounsverwaltungsléisung z'entdecken.",
            },
            "faq": {
                "title": "Heefeg gestallt Froen",
                "items": [
                    {"q": "Ass de Link sécher?", "a": "Den Token ass zoufälleg (256 Bit), eenzegaarteg an opak. Dir kënnt Äre Bailleur zu all Moment froen, en ze widerrufen."},
                    {"q": "Wat bei Sträit iwwer d'Lasten?", "a": "Dir hutt d'Recht, d'Beleeg ze konsultéieren. D'Gesetz vum 21. September 2006 regelt d'Ofrechnung. Bei dauerhaftem Sträit kann d'Locatiounskommissioun ugeruff ginn."},
                    {"q": "Gëtt d'Garantie hei verwalt?", "a": "Jo — d'Garantie (op gespaartem Kont laut Artikel 5 vum Gesetz) ass am Portal sichtbar, mat Hannerleeungs- a viraussichtlechen Restitutiounsdaten."},
                    {"q": "Wat beim Ëmplënneren?", "a": "Äre neie Bailleur schéckt e neie Link. Den ale bleift 12 Méint nëmmen ze liesen."},
                    {"q": "Wat kascht mech dëse Zougang?", "a": "De Locatairezougang ass gratis. Äre Bailleur abonnéiert tevaxia."},
                ],
            },
            "related": {
                "title": "Méi liesen",
                "items": [
                    {"label": "Guide Wunnengsbail", "href": "/guide/bail-habitation-luxembourg", "desc": "Gesetz 21. September 2006, Rechter, Flichten, Lasten."},
                    {"label": "5%-Regel", "href": "/guide/regle-5-pourcent-loyer", "desc": "Gesetzlech Locatiounsobergrenz zu Lëtzebuerg."},
                    {"label": "Locatiounsrechner", "href": "/calculateur-loyer", "desc": "Prüft, ob Är Locatioun der 5%-Regel entsprécht."},
                ],
            },
        },
    },
    "pt": {
        "copropriete": {
            "meta": {
                "title": "Portal de condómino Luxemburgo — acesso tevaxia",
                "description": "Aceda ao seu portal de condómino: convocatórias de AG, votação online, contas individuais, chamadas de fundos. Link mágico seguro fornecido pelo seu administrador.",
            },
            "hero": {
                "badge": "Portal de condómino",
                "title": "O seu condomínio",
                "titleAccent": "em total transparência",
                "subtitle": "Convocatórias, atas, votação online de resoluções, seguimento das chamadas de fundos e da sua conta individual: todo o seu processo de condomínio num só lugar. Acesso seguro por link mágico fornecido pelo seu administrador.",
                "primaryCta": "Pedir o meu link de acesso",
                "secondaryCta": "Compreender o condomínio no Luxemburgo",
            },
            "features": {
                "title": "O que encontra no portal",
                "intro": "Todas as informações legais do seu condomínio, acessíveis 24/7 a partir de qualquer dispositivo.",
                "items": [
                    {"icon": "📋", "title": "Convocatórias e atas de AG", "desc": "Descarregue convocatórias, ordens de trabalhos e atas assinadas. Histórico completo conservado."},
                    {"icon": "🗳️", "title": "Votação online de resoluções", "desc": "Vote eletronicamente nas assembleias gerais (Lei de 16 de maio de 1975 modificada)."},
                    {"icon": "💶", "title": "A minha conta individual", "desc": "Siga as chamadas de fundos, encargos, pagamentos e saldo atualizado. Descarregue o extrato em PDF."},
                    {"icon": "🤖", "title": "Assistente IA condomínio", "desc": "Faça perguntas sobre o regulamento, encargos ou lei luxemburguesa — respostas com fontes."},
                ],
            },
            "access": {
                "title": "Como aceder ao seu portal",
                "intro": "Sem criação de conta. O seu administrador envia-lhe um link mágico pessoal seguro.",
                "steps": [
                    {"number": "1", "title": "Pedido ao administrador", "desc": "Contacte o seu administrador profissional ou voluntário e peça o seu link de acesso de condómino tevaxia."},
                    {"number": "2", "title": "Receção por e-mail", "desc": "Recebe um e-mail com o seu link pessoal. Conserve-o, válido enquanto não for revogado."},
                    {"number": "3", "title": "Acesso direto", "desc": "Clique no link: chega ao seu processo sem palavra-passe. Sem aplicação para instalar."},
                ],
                "note": "Não recebeu link? O seu administrador pode ainda não usar tevaxia. Convide-o a descobrir a nossa solução de administração.",
            },
            "faq": {
                "title": "Perguntas frequentes",
                "items": [
                    {"q": "O link é seguro?", "a": "O token é aleatório (256 bits), único e opaco. Identifica estritamente o seu lote e os seus dados. Pode pedir ao administrador para o revogar a qualquer momento."},
                    {"q": "Posso votar em AG a partir do portal?", "a": "Sim, em resoluções abertas a votação eletrónica. A lei luxemburguesa de 16 de maio de 1975 (alterada em 6 de junho de 2023) permite voto à distância salvo proibição do regulamento."},
                    {"q": "E se também for inquilino noutro lugar?", "a": "Pode ter vários acessos distintos (um por lote condomínio + um por contrato de arrendamento). Cada token é independente."},
                    {"q": "Os meus dados ficam na Europa?", "a": "Sim. tevaxia aloja todos os dados na União Europeia (Supabase EU + Vercel EU). Conformidade RGPD."},
                    {"q": "Quanto custa este acesso?", "a": "O acesso de condómino é gratuito. É o seu administrador que subscreve tevaxia para gerir o condomínio."},
                ],
            },
            "related": {
                "title": "Para ir mais longe",
                "items": [
                    {"label": "Guia condomínio Luxemburgo", "href": "/guide/copropriete-luxembourg", "desc": "Lei de 16 de maio de 1975, AG, encargos, conselho fiscal."},
                    {"label": "Solução administrador", "href": "/solutions/syndic", "desc": "Para administradores profissionais e voluntários."},
                    {"label": "Portal conselho fiscal", "href": "/conseil-syndical", "desc": "Membros do conselho: pilote o condomínio."},
                ],
            },
        },
        "conseilSyndical": {
            "meta": {
                "title": "Portal conselho fiscal Luxemburgo — tevaxia",
                "description": "Pilote o seu condomínio enquanto membro do conselho fiscal: vista consolidada, seguimento de obras, preparação de AG, comunicação aos condóminos.",
            },
            "hero": {
                "badge": "Portal conselho fiscal",
                "title": "Pilote o seu condomínio",
                "titleAccent": "com confiança",
                "subtitle": "Vista geral das contas, seguimento das obras votadas, preparação de AG e comunicação consolidada aos condóminos. A ferramenta dedicada aos membros eleitos do conselho fiscal.",
                "primaryCta": "Pedir o meu link de acesso",
                "secondaryCta": "Papel do conselho fiscal",
            },
            "features": {
                "title": "As suas ferramentas de pilotagem",
                "intro": "Como membro eleito, representa os condóminos e supervisiona o administrador. tevaxia dá-lhe os bons indicadores.",
                "items": [
                    {"icon": "📊", "title": "Vista consolidada de contas", "desc": "Saldos, encargos correntes, fundo de maneio, fundo de obras, dívidas agregadas."},
                    {"icon": "🛠️", "title": "Seguimento de obras", "desc": "Estado das resoluções de obras votadas, orçamentos comparados, faturas."},
                    {"icon": "📝", "title": "Preparação de AG", "desc": "Ordem de trabalhos colaborativa, projetos de resolução, documentos a anexar."},
                    {"icon": "✉️", "title": "Comunicação aos condóminos", "desc": "Envio em grupo aos condóminos, arquivo das trocas."},
                ],
            },
            "access": {
                "title": "Como aceder ao seu portal",
                "intro": "O administrador atribui-lhe acesso conselho fiscal aquando da sua eleição em AG.",
                "steps": [
                    {"number": "1", "title": "Eleição em AG", "desc": "É eleito(a) para o conselho fiscal pela assembleia geral (artigo 15-1 lei 1975)."},
                    {"number": "2", "title": "Link enviado pelo administrador", "desc": "O administrador envia o seu link pessoal de acesso conselho fiscal por e-mail."},
                    {"number": "3", "title": "Acesso permanente", "desc": "Conecte-se a qualquer momento de qualquer dispositivo. Sem palavra-passe."},
                ],
                "note": "O mandato do conselho é limitado no tempo (geralmente 1 a 3 anos). O acesso é revogado no fim do mandato.",
            },
            "faq": {
                "title": "Perguntas frequentes",
                "items": [
                    {"q": "Quais as minhas obrigações legais?", "a": "O conselho fiscal assiste e fiscaliza o administrador. Deve ser consultado para qualquer contrato acima de um limiar definido pela AG (artigo 15-1 lei de 16 de maio de 1975)."},
                    {"q": "Posso ver as peças contabilísticas?", "a": "Sim, o conselho fiscal acede aos justificativos a qualquer momento. tevaxia dá acesso às faturas digitalizadas pelo administrador."},
                    {"q": "Que fazer se detetar uma anomalia?", "a": "Sinalize-a ao administrador via mensagens tevaxia (rastreabilidade conservada). Em caso de litígio, o conselho pode convocar uma AG extraordinária."},
                    {"q": "Quantos membros no conselho?", "a": "A lei luxemburguesa não impõe número fixo. A prática é 3 a 5 membros para condomínio de média dimensão."},
                ],
            },
            "related": {
                "title": "Para ir mais longe",
                "items": [
                    {"label": "Guia condomínio", "href": "/guide/copropriete-luxembourg", "desc": "Lei 1975, papel do conselho fiscal, AG."},
                    {"label": "Solução administrador", "href": "/solutions/syndic", "desc": "Para administradores — ferramenta de gestão completa."},
                    {"label": "Portal de condómino", "href": "/copropriete", "desc": "Portal individual dos condóminos."},
                ],
            },
        },
        "locataire": {
            "meta": {
                "title": "Portal de inquilino Luxemburgo — tevaxia",
                "description": "Aceda ao seu portal de inquilino: recibos de renda, vistoria digital, avisos de encargos, assistente IA arrendamento. Link mágico seguro fornecido pelo seu senhorio.",
            },
            "hero": {
                "badge": "Portal de inquilino",
                "title": "O seu arrendamento no Luxemburgo",
                "titleAccent": "tudo num só lugar",
                "subtitle": "Recibos de renda, vistoria digital, avisos de encargos, trocas com o seu senhorio ou agência. Acesso seguro por link mágico, sem criação de conta.",
                "primaryCta": "Pedir o meu link de acesso",
                "secondaryCta": "Compreender o seu arrendamento",
            },
            "features": {
                "title": "O que encontra no portal",
                "intro": "Todas as peças do seu contrato acessíveis 24/7, conformes ao direito de arrendamento luxemburguês.",
                "items": [
                    {"icon": "🧾", "title": "Recibos de renda", "desc": "Descarregue os seus recibos mensais assinados. Indispensáveis para diligências administrativas."},
                    {"icon": "📋", "title": "Vistoria digital", "desc": "Vistorias de entrada e saída com data e hora e fotografias. Comparação lado a lado."},
                    {"icon": "💶", "title": "Avisos de encargos", "desc": "Regularização anual detalhada por rubrica, com justificativos."},
                    {"icon": "🤖", "title": "Assistente IA arrendamento", "desc": "Faça perguntas sobre a lei de 21 de setembro de 2006 — direitos, deveres, caução."},
                ],
            },
            "access": {
                "title": "Como aceder ao seu portal",
                "intro": "Sem criação de conta. O seu senhorio ou agência envia-lhe um link mágico pessoal seguro.",
                "steps": [
                    {"number": "1", "title": "Pedido ao senhorio", "desc": "Contacte o seu senhorio ou a agência e peça o seu link de acesso de inquilino tevaxia."},
                    {"number": "2", "title": "Receção por e-mail", "desc": "Recebe um e-mail com o seu link pessoal. Válido durante toda a duração do arrendamento."},
                    {"number": "3", "title": "Acesso direto", "desc": "Clique no link: chega ao seu processo sem palavra-passe. Sem aplicação para instalar."},
                ],
                "note": "Não recebeu link? O seu senhorio pode ainda não usar tevaxia. Convide-o a descobrir a nossa solução de gestão de arrendamento.",
            },
            "faq": {
                "title": "Perguntas frequentes",
                "items": [
                    {"q": "O link é seguro?", "a": "O token é aleatório (256 bits), único e opaco. Pode pedir ao senhorio para o revogar a qualquer momento."},
                    {"q": "Que fazer em caso de litígio sobre encargos?", "a": "Tem o direito de consultar os justificativos. A lei de 21 de setembro de 2006 enquadra a regularização. Em caso de desacordo persistente, a comissão de rendas pode ser acionada."},
                    {"q": "A caução é gerida aqui?", "a": "O acompanhamento da caução (depositada em conta bloqueada conforme artigo 5 da lei) é visível no portal, com data de depósito e restituição prevista."},
                    {"q": "E se eu mudar de casa?", "a": "O seu novo senhorio enviará um novo link. O antigo permanece consultável em modo leitura por 12 meses."},
                    {"q": "Quanto custa este acesso?", "a": "O acesso de inquilino é gratuito. É o seu senhorio que subscreve tevaxia."},
                ],
            },
            "related": {
                "title": "Para ir mais longe",
                "items": [
                    {"label": "Guia arrendamento habitacional", "href": "/guide/bail-habitation-luxembourg", "desc": "Lei 21 de setembro de 2006, direitos, deveres, encargos."},
                    {"label": "Regra dos 5%", "href": "/guide/regle-5-pourcent-loyer", "desc": "Limite legal de renda no Luxemburgo."},
                    {"label": "Calculadora de renda", "href": "/calculateur-loyer", "desc": "Verifique se a sua renda respeita a regra dos 5%."},
                ],
            },
        },
    },
}


def inject(locale: str) -> None:
    path = MSG_DIR / f"{locale}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if "portalLandings" in data:
        print(f"[{locale}] portalLandings already present — overwriting")
    data["portalLandings"] = CONTENT[locale]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[{locale}] OK — {path}")


if __name__ == "__main__":
    for loc in ["fr", "en", "de", "lb", "pt"]:
        inject(loc)
    print("Done.")
