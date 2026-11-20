# Note 1 — Inventaire des pages publiques (état au 20 novembre 2026)

Méthode : exploration automatique des 940 URL du sitemap (188 pages × 5 langues) et des 72 routes françaises statiques présentes dans `src/app` mais absentes du sitemap. Toutes répondent 200 (une redirection 308 : `/hotellerie/revpar-comparison`). Le tableau complet est dans `donnees/pages-fr.csv` (259 lignes : URL, sitemap, indexable, titre, H1, mots, données structurées, liens entrants, volume par langue). Les 300 routes dynamiques (`[token]`, `[id]`, `[propertyId]`) n'ont pas été explorées : elles exigent un compte ou un lien.

## Vue d'ensemble

| Mesure | Valeur |
|---|---|
| Pages françaises explorées | 259 |
| Indexables | 221 (100 communes + 121 autres) |
| Au sitemap | 188 |
| Indexables mais absentes du sitemap | 33 |
| Indexables de moins de 100 mots | 8 |
| Pages avec au moins une image dans le contenu | 0 sur 259 |
| Profondeur de clic depuis l'accueil | 1 clic : 54 pages ; 2 clics : 192 ; 3 clics : 3 |
| Pages affichant d'abord « Chargement… » | 225 sur 260 (`src/app/loading.tsx`) |

## Par famille

| Famille | Pages publiques | Constat principal |
|---|---|---|
| Accueil | `/` | 1 586 mots, 7 profils, 36 cartes d'outils, 12 questions. Aucun champ de saisie, aucune image. |
| Calculateurs particuliers | `/estimation`, `/frais-acquisition`, `/plus-values`, `/calculateur-loyer`, `/simulateur-aides`, `/achat-vs-location`, `/vefa`, `/carte` | 600 à 900 mots (sauf `/vefa` 2 086, `/carte` 1 153). Ce sont les pages qui se classent. Titre de `/frais-acquisition` sans « Luxembourg » ni « notaire ». |
| Estimation | `/estimation`, `/hedonique`, `/comparer`, `/transparence`, `/wizard-particulier` | `/hedonique` est la même page que `/estimation` (réexport) sous le titre de `/transparence`. `/wizard-particulier` (638 mots, FAQ) est indexable mais hors sitemap et n'a qu'un lien entrant. |
| Guides | `/guide` + 13 guides | 11 guides de 850 à 1 700 mots avec `Article` et `FAQPage`. Deux « guides » (`regle-5-pourcent-loyer`, `plus-value-immobiliere`) reprennent le H1 de l'outil, font 350 et 475 mots et n'ont aucune donnée structurée. |
| Communes | 100 pages `/commune/*` | 505 à 532 mots, gabarit identique. 31 pages n'affichent aucune des quatre valeurs (« Non publié » partout), 18 n'en affichent qu'une. |
| Données | `/marche`, `/indices`, `/marche/forecast`, `/calculateur-loyer/observatoire` | `/marche` 2 166 mots. `/marche/forecast` indexable, hors sitemap. |
| Investisseur, promoteur | `/valorisation`, `/dcf-multi`, `/bilan-promoteur`, `/estimateur-construction`, `/calculateur-vrd`, `/outils-bancaires`, `/portfolio`, `/terres-agricoles`, `/pag-pap`, `/convertisseur-surfaces`, `/bail-commercial` | 290 à 600 mots pour la plupart. `/portfolio` : 19 mots, au sitemap. 2 à 7 liens entrants chacun. |
| Énergie, ESG | `/energy` + 8, `/esg` + 2 | Titres courts sans « Luxembourg » (`/energy/renovation` : 26 caractères). `/energy/audit` : 74 mots. Aucune donnée structurée sur les simulateurs. |
| Hôtellerie | `/hotellerie` + 20 sous-pages, `/solutions/hotel` | 7 sous-pages au sitemap, 10 indexables hors sitemap (dont `/hotellerie/due-diligence`, 944 mots), 4 en `noindex`. |
| PMS | `/pms` | `noindex`, 7 mots sans session. Aucune page publique ne présente le PMS ; `/solutions/hotel` (326 mots, la plus courte des pages « solutions ») y renvoie par un bouton. |
| Location courte durée | `/str` + 8 | 2 sous-pages au sitemap, 5 indexables hors sitemap. |
| Syndic | `/syndic` + 5, `/solutions/syndic`, `/copropriete`, `/conseil-syndical` | `/syndic` est un tableau de bord titré « Dashboard Syndic & Copropriété », en tutoiement (« Crée et pilote tes copropriétés »). `/syndic/portefeuille` : 7 mots, indexable. Les portails `/copropriete` et `/conseil-syndical` sont au sitemap. |
| Gestion locative | `/gestion-locative` + 8, `/locataire` | 4 sous-pages indexables hors sitemap, 3 en `noindex`. `/locataire` au sitemap. |
| Agences | `/pro-agences` + 9, `/solutions/agence` | `/pro-agences` (1 033 mots) fait office de page de présentation du CRM ; titre « Offre agences immobilières, rapports co-brandés » sans le mot CRM. |
| Solutions | `/solutions` + 8 | 1 000 à 1 200 mots, bien construites, mais un seul lien entrant chacune (depuis `/solutions`). |
| Banque, API | `/api-banques`, `/api-docs`, `/propcalc`, `/propcalc/developers` | `/api-docs` indexable, hors sitemap. |
| Facturation | `/facturation`, `/facturation/emission` | `/facturation/emission` : 11 mots, indexable, sans H1. |
| Compte | `/connexion`, `/profil/*`, `/mes-evaluations`, `/tableau-bord` | Correctement en `noindex`. `/onboarding` et `/recherche` (5 à 7 mots, sans H1) sont indexables. |
| Légal | `/mentions-legales`, `/confidentialite`, `/cgu`, `/pricing`, `/plan-du-site`, `/status`, `/verify` | `/cgu` hors sitemap. `/pricing` titré « Fonctionnalités ». |

## Navigation et maillage

- L'en-tête ne contient que 5 liens dans le HTML servi (accueil, tarifs, connexion, langues). Les cinq menus (Particuliers, Professionnels, Hôtellerie, Énergie, Données) sont des boutons dont le contenu n'apparaît qu'au clic.
- Le pied de page ne porte que 5 liens internes (mentions, confidentialité, CGU, solutions, plan du site).
- Conséquence : seuls 8 outils reçoivent plus de 100 liens internes (ceux que citent les pages communes). 58 pages indexables en reçoivent 2 ou moins, dont `/convertisseur-surfaces`, toutes les pages `/solutions/*` et la plupart des simulateurs énergie. `/plus-values`, 2ᵉ sur Google, n'en reçoit que 4.
- Quatre pages indexables ne sont atteignables par aucun lien : `/onboarding`, `/recherche`, `/syndic/lettres-types`, `/syndic/portefeuille`.

## Parcours et conversion

- Sauvegarde sans compte : locale au navigateur. Export PDF : fenêtre « Se connecter » (`src/components/PdfButton.tsx`), sans alternative.
- Inscription : e-mail et mot de passe, Google, LinkedIn (`src/app/connexion/page.tsx`).
- Aucun formulaire de contact ni de demande de démonstration ; uniquement des liens `mailto:`. Les pages professionnelles renvoient à « Accéder au CRM », « Accéder au PMS », « Ouvrir mes copropriétés », c'est-à-dire à l'écran de connexion.
- Mesure : `track()` est vide (`src/lib/analytics.ts`), seule la page vue part vers PostHog après accord.

## Non couvert

Les écrans connectés (tableaux de bord, PMS, comptabilité de syndic, CRM) et les portails à jeton. La revue du 13 septembre (`REVUE-GENERALE-2026-09-13.md`) les a parcourus.
