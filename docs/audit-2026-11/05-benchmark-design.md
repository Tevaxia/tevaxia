# Note 5 — Benchmark concurrentiel et international, et ce qu'il suggère pour le design (20 novembre 2026)

Sites observés le 20/11/2026, page d'accueil ou page d'outil, sur ordinateur (fenêtre de 800 px) et pour tevaxia.lu sur mobile (375 × 812). Les fonctionnalités sont déjà comparées module par module dans `BENCHMARK_2026.md` ; cette note porte sur la manière dont les pages se présentent et convertissent.

## Panel

| Site | Rôle dans le panel | Ce qu'on voit en premier |
|---|---|---|
| [plusvalue.lu](https://plusvalue.lu/) | Concurrent direct, 1ᵉʳ sur la plus-value | Une question en titre (« Combien d'impôt sur la vente de votre bien au Luxembourg ? »), une ligne « À jour : coefficients de la loi budgétaire 2026 », un bouton, puis un objet interactif (« Machine à remonter le temps » : une année, un coefficient). Titre en caractères à empattements, identité reconnaissable. Résultat conditionné à un e-mail. |
| [carmoimmo.lu](https://carmoimmo.lu/fr/outils) | Agence de Pétange, 9 simulateurs, présente sur 9 des 35 requêtes testées | « Décidez avec des chiffres, pas avec des impressions. » Preuves dans la description : méthode LPVI/TEGoVA, 5,0 sur 60 avis Google. |
| [fraisdenotaire.lu](https://fraisdenotaire.lu/) | 1ᵉʳ sur les frais de notaire | Page de 329 mots, un outil, un nom (Marc Kreitz), quatre domaines par langue (notaryfees.lu, notarkosten.lu). |
| [evaluationimmobiliere.lu](https://www.evaluationimmobiliere.lu/) | Expert indépendant | « La valeur de votre bien, démontrée — pas estimée à vue. » 3 200 mots, 20 ans, plus de 1 000 dossiers, pages par commune. |
| [mybuilding.lu](https://mybuilding.lu/) | Logiciel de syndic luxembourgeois, classé | « Gérez plus de copropriétés. Sans gérer plus d'administratif. » Démonstration, prix affiché, objection traitée (« changer de logiciel, c'est compliqué »). |
| [NerdWallet](https://www.nerdwallet.com/mortgages/mortgage-calculator) | Référence des calculateurs | Le résultat (« $2,098 ») en très grand, avec un anneau de répartition, visible sans rien saisir ; 3 000 mots dessous. |
| [Zillow](https://www.zillow.com/how-much-is-my-home-worth/) | Référence de l'estimation | Une question, un seul champ (l'adresse), un bouton. |
| [MeilleursAgents](https://www.meilleursagents.com/prix-immobilier/) | Référence des prix par ville | Le mois dans le titre (« Novembre 2026 »), un tableau de prix dès l'ouverture. |
| [Matera](https://www.matera.eu/fr) | Syndic et gestion, plusieurs métiers | Trois entrées illustrées dans l'ouverture (syndic, gestion locative, transaction), un bouton « Obtenir un devis ». |
| [Mews](https://www.mews.com/fr) | PMS hôtelier | Capture du produit dans l'ouverture, bouton « Demander une démo » répété. |
| [PriceHubble](https://www.pricehubble.com/fr/) | Données et estimation pour les banques | Promesse adressée au client professionnel, formulaire de contact, références clients. |

## tevaxia.lu, vu avec les mêmes yeux

- **Ouverture.** Titre « L'analyse immobilière du Luxembourg, par métier », un paragraphe, deux boutons. Pas de champ, pas d'image, pas de capture. Le produit le plus démonstratif du site, la carte des prix, n'apparaît pas.
- **Accueil.** Sept cartes de profils à icônes de sept couleurs, cinq chiffres, trois encarts, douze questions, trente-six cartes d'outils. Tout y est, rien n'est mis en avant.
- **Page d'outil.** Deux colonnes, formulaire à gauche, tableau de résultats à droite, calcul en direct : c'est bien. Mais le chiffre que l'utilisateur est venu chercher (l'impôt, les frais) est une ligne de tableau parmi d'autres, sans graphique, et les avertissements occupent autant de place que le résultat.
- **Images.** Aucune sur les 259 pages. Les pages professionnelles décrivent un CRM, un PMS et une comptabilité de syndic sans en montrer un écran.
- **Transitions.** Chaque changement de page affiche un écran blanc « Chargement… » avant le contenu.
- **En-tête.** Sous 1 000 px environ, il passe sur deux lignes (menus, puis connexion et langues).
- **Mobile.** Le bandeau de cookies masque plus de la moitié de l'écran à la première visite.
- **Identité.** Bleu marine, or, police Geist : propre et cohérent, mais sans élément propre à la marque. Rien ne distingue une capture de tevaxia.lu d'un gabarit SaaS.

## Ce que le benchmark suggère

| N° | Proposition | Exemple | Où |
|---|---|---|---|
| D1 | Ouvrir l'accueil sur une question et un champ : la commune, puis le prix au m² et l'accès à l'estimation | Zillow, plusvalue.lu | `src/app/page.tsx` |
| D2 | Réduire l'accueil à trois ou quatre entrées (particulier, investisseur et promoteur, gestion et syndic, hôtellerie) et renvoyer la liste complète à `/plan-du-site` ou `/solutions` | Matera | `src/app/page.tsx` |
| D3 | Sur chaque outil, afficher le résultat principal en grand, en tête de colonne, avec une répartition graphique ; replier les avertissements sous un lien « Hypothèses et limites » | NerdWallet | composants de résultat des outils |
| D4 | Montrer le produit : captures du PMS, du CRM, de la comptabilité de syndic et de la carte sur les pages professionnelles et l'accueil | Mews, mybuilding.lu | `/solutions/*`, `/pro-agences`, `/hotellerie` |
| D5 | Un bouton « Demander une démonstration » avec formulaire court sur les pages professionnelles, en plus de l'accès direct | Mews, Matera, PriceHubble | `/solutions/*` |
| D6 | Afficher « À jour au … » et la source sous le titre de chaque outil | plusvalue.lu, MeilleursAgents | gabarit des outils |
| D7 | Une image de partage par outil au lieu d'une seule pour tout le site | — | `opengraph-image` par route |
| D8 | Supprimer l'écran « Chargement… » pleine page au profit d'un squelette de la page | — | `src/app/loading.tsx` |
| D9 | Bandeau de cookies en bande basse sur mobile ; en-tête sur une ligne | — | `CookieBanner.tsx`, `Header.tsx` |
| D10 | Donner à la marque un signe propre : un titre de caractère (plusvalue.lu le fait avec une police à empattements), ou la carte du pays comme motif récurrent | plusvalue.lu | feuille de style globale |

## Ce que je ne recommande pas de copier

- Le résultat conditionné à un e-mail (plusvalue.lu). L'accès sans inscription est la promesse de Tevaxia et un vrai avantage face aux agences.
- Les domaines multiples par langue (fraisdenotaire.lu). Le site se classe déjà en allemand et en anglais sur un seul domaine.

## Limites

Observation visuelle d'une seule page par site, sans test utilisateur ni mesure de conversion. Aucun de ces sites ne publie ses taux de conversion ; les propositions indiquent une direction, pas un gain chiffré.
