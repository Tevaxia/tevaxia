# Tevaxia est bien classé sur 24 requêtes sur 35, et laisse filer le reste par des défauts qui se corrigent en heures

Audit du site en ligne, 20 novembre 2026 (version 2, qui remplace celle du matin). Périmètre : les 1 012 pages publiques explorées une à une, 35 requêtes Google, les cinq fichiers de langue, les paramètres légaux affichés, onze sites concurrents ou de référence, et les quatre guides Backlinko. Le détail est dans cinq notes :

| Note | Contenu |
|---|---|
| [01-inventaire-pages](audit-2026-11/01-inventaire-pages.md) | Les 259 pages françaises par famille, navigation, parcours ; tableau complet dans `audit-2026-11/donnees/pages-fr.csv` |
| [02-seo-backlinko](audit-2026-11/02-seo-backlinko.md) | Les 35 positions Google et la grille de conformité Backlinko, critère par critère |
| [03-exactitude-calculs-donnees](audit-2026-11/03-exactitude-calculs-donnees.md) | Tests, paramètres vérifiés auprès des sources officielles, données périmées |
| [04-traductions](audit-2026-11/04-traductions.md) | Contrôle des cinq langues sur les fichiers et sur le texte affiché |
| [05-benchmark-design](audit-2026-11/05-benchmark-design.md) | Onze sites comparés et dix propositions de design |
| [06-lot-a-realise](audit-2026-11/06-lot-a-realise.md) | Ce qui a été corrigé le 20 novembre (lot A), contrôles et mesures |
| [07-lot-b-realise](audit-2026-11/07-lot-b-realise.md) | Lot B (21 novembre) : ce qui est fait, ce qui reste, textes non audités découverts sur `/carte` et `/vefa` |

## Synthèse

Tevaxia apparaît dans les dix premiers résultats de Google Luxembourg sur 24 des 35 requêtes testées, dont trois premières places (simulateur VEFA, valorisation d'hôtel, calculateur de plafond de loyer en anglais) et cinq deuxièmes (frais de notaire, plus-value, bail commercial, CRM d'agence, guide du syndic). Le site se classe aussi en allemand et en anglais. Les 2 482 tests du dépôt passent, le plafond du Bëllegen Akt et le délai de spéculation affichés sont exacts au jour de l'audit, et aucun seuil légal ne diverge d’une langue à l’autre sur les outils clés.

Ce qui manque tient en neuf écarts. Aucun n'est un défaut de calcul. Ce sont : une mesure d'usage absente, une indexation en désordre (33 pages indexables hors sitemap, 8 coquilles vides, 31 pages communes sans donnée), des pages d'outils amaigries et mal reliées entre elles, trois verticaux professionnels sans page de présentation, des pages lourdes et jamais mises en cache, des données de marché en retard d'une publication, des traductions abrégées ou sans accents, un design qui ne montre ni le produit ni le résultat, et aucune action sur les liens.

Sur les délais : vous avez raison, la plupart des actions sont des corrections de texte, de métadonnées ou de configuration. Je les ai classées par effort réel et par ce qui les bloque. Trois lots sur cinq tiennent dans une journée de travail ; ce qui ne se comprime pas, c'est le temps que Google met à réexplorer, et les décisions qui vous reviennent.

## Écart 1 — Rien ne mesure ce que font les visiteurs

`track()` est vide (`src/lib/analytics.ts`, lignes 3 à 7) ; seule la page vue part vers PostHog, après accord (`PostHogProvider.tsx`, ligne 34). Le site est bien placé sur 24 requêtes et ne sait pas combien de simulations aboutissent, combien de comptes se créent, ni quels outils servent.

| N° | Action | Où | Effort |
|---|---|---|---|
| 1.1 | Compteur agrégé sans identité ni valeur saisie : outil, événement (simulation aboutie, PDF, compte créé, clic LPVI, clic outil associé), jour | `src/lib/analytics.ts`, une table Supabase | 1 à 2 h |
| 1.2 | Exporter requêtes et pages de la Search Console sur trois mois et les rapprocher des 35 positions relevées | Search Console | Accès à me donner, ou export à me transmettre |
| 1.3 | Point zéro PageSpeed mobile sur six pages avant les corrections de performance | — | Minutes |

## Écart 2 — L'indexation est en désordre

| Constat | Pages |
|---|---|
| Indexables mais absentes du sitemap | 33, dont 10 outils hôteliers, 5 outils de location courte durée, 4 de gestion locative, `/wizard-particulier`, `/inspection`, `/marche/forecast` |
| Coquilles vides indexables (moins de 100 mots sans session) | `/portfolio` (au sitemap), `/syndic/portefeuille`, `/facturation/emission`, `/recherche`, `/onboarding`, `/verify`, `/energy/audit`, `/gestion-locative/reconciliation` |
| Doublon | `/hedonique` est la page `/estimation` sous le titre de `/transparence` |
| Faux guides | `/guide/regle-5-pourcent-loyer` et `/guide/plus-value-immobiliere` portent le H1 de l'outil, 350 et 475 mots, sans données structurées |
| Portails au sitemap | `/locataire`, `/copropriete`, `/conseil-syndical` ; `/locataire` ressort 2ᵉ sur la marque dans Bing |
| Pages communes sans contenu propre | 31 sur 100 affichent « Non publié » pour les quatre valeurs |

| N° | Action | Où | Effort |
|---|---|---|---|
| 2.1 | Ajouter au sitemap les outils publics qui fonctionnent sans compte ; passer en `noindex` les coquilles vides | `src/app/sitemap.ts`, liste `noindex` de `src/app/layout.tsx` | 1 h |
| 2.2 | Rediriger `/hedonique` vers `/estimation` (ou canonique) | `next.config.ts` | Minutes |
| 2.3 | Retirer les trois portails du sitemap | `src/app/sitemap.ts` | Minutes |
| 2.4 | Donner aux deux faux guides un H1 et un contenu de guide, ou les rediriger vers l'outil | `src/app/guide/*` | 1 à 2 h |
| 2.5 | Pages communes sans donnée : `noindex`, ou les enrichir (prix du canton, communes voisines avec données) | `src/app/commune/[slug]` | 1 à 2 h |

## Écart 3 — Les pages qui se classent sont amaigries et mal reliées

Les textes d'accompagnement ont été retirés de `/plus-values`, `/frais-acquisition` et `/estimation` : 600 mots, contre 2 600 chez plusvalue.lu, 1 200 chez carmoimmo.lu, 3 000 chez NerdWallet. Les menus de l'en-tête ne sont pas dans le HTML servi, si bien que 58 pages indexables ne reçoivent que deux liens internes ou moins ; `/plus-values`, 2ᵉ sur Google, en reçoit quatre. Sur la grille Backlinko : 33 titres sur 121 font 50 à 60 caractères, 46 titres d'outils n'ont pas « Luxembourg », 32 descriptions dépassent 160 caractères, 75 pages n'ont aucune donnée structurée propre, aucun outil ne porte `WebApplication`, aucune page n'a d'image, aucun auteur n'est affiché.

| N° | Action | Où | Effort |
|---|---|---|---|
| 3.1 | Réécrire titres et descriptions des 121 pages : requête en tête, « Luxembourg », année pour les sujets datés, 50 à 60 et moins de 160 caractères ; `/pricing` cesse de s'appeler « Fonctionnalités » | `src/messages/seo/*.json`, quelques `layout.tsx` | Demi-journée pour le français, autant pour les quatre langues |
| 3.2 | Rendre les liens des menus présents dans le HTML (menu rendu côté serveur, masqué en CSS) et ajouter au pied de page les 12 outils principaux | `src/components/Header.tsx`, `Footer.tsx` | 1 à 2 h |
| 3.3 | Remettre sous chaque outil classé un texte à jour : méthode, cas particuliers, exemple chiffré, FAQ ; reprendre la matière des guides, pas les anciennes clés | 8 outils particuliers d'abord | Une journée, relecture métier comprise |
| 3.4 | `WebApplication` sur chaque outil, `FAQPage` là où une FAQ est affichée | `src/components/JsonLd.tsx` | 1 à 2 h |
| 3.5 | Ligne « À jour au … — source » sous le titre de chaque outil | gabarit des outils | 1 à 2 h |
| 3.6 | Afficher un auteur ou un responsable de méthode sur les guides | `src/app/guide/*` | Minutes, après décision |
| 3.7 | Relier chaque page « solutions » depuis les outils de son métier | composants « outils associés » | 1 h |

## Écart 4 — Trois verticaux stratégiques n'ont pas de page de présentation

La stratégie 2026 vise le PMS, le syndic et le CRM. Le CRM a une vraie page (`/pro-agences`) et se classe 2ᵉ. Le PMS n'en a pas : `/pms` est en `noindex` et `/solutions/hotel` fait 326 mots. `/syndic` est un tableau de bord titré « Dashboard Syndic & Copropriété », en tutoiement. Résultat : absent sur « logiciel syndic copropriété luxembourg » et « logiciel gestion locative luxembourg », 9ᵉ sur « PMS hôtel luxembourg logiciel ». Même absence sur « capacité d'emprunt », « rendement locatif », « bilan promoteur », « rénovation énergétique », alors que les outils existent.

| N° | Action | Où | Effort |
|---|---|---|---|
| 4.1 | Page publique « Logiciel de syndic de copropriété au Luxembourg » : promesse, captures, fonctions, prix, FAQ, démonstration ; le tableau de bord passe derrière la connexion | nouvelle page ou refonte de `/solutions/syndic` | Demi-journée |
| 4.2 | Même page pour le PMS hôtelier et pour la gestion locative | `/solutions/hotel`, `/gestion-locative` | Demi-journée chacune |
| 4.3 | Retitrer `/pro-agences` avec « CRM immobilier Luxembourg » | métadonnées | Minutes |
| 4.4 | Retitrer et étoffer `/outils-bancaires` (capacité d'emprunt), `/bilan-promoteur`, `/energy/renovation`, `/str/rentabilite` sur leur requête | métadonnées, texte | 2 à 3 h |
| 4.5 | Formulaire court « Demander une démonstration » sur les pages professionnelles | composant commun | 1 à 2 h, après décision sur le destinataire |
| 4.6 | Fiche Capterra (1ᵉʳ sur les requêtes syndic et PMS) | hors site | Compte à créer par vous |

## Écart 5 — Les pages sont lourdes, jamais mises en cache, servies depuis les États-Unis

Toutes les pages répondent `Cache-Control: no-store`, `X-Vercel-Cache: MISS`, `X-Vercel-Id: cdg1::iad1`. Le HTML pèse 575 à 740 Ko, dont la feuille de style de 157 Ko répétée trois fois. 225 pages sur 260 affichent d'abord un écran « Chargement… ».

| N° | Action | Où | Effort |
|---|---|---|---|
| 5.1 | Exécuter les fonctions en Europe, dans la région du projet Supabase | `vercel.json` (`regions`) | Minutes, région Supabase à me confirmer |
| 5.2 | Mesurer avec et sans `inlineCss`, garder le meilleur | `next.config.ts`, ligne 28 | 1 h |
| 5.3 | Remplacer l'écran « Chargement… » racine par un squelette, ou le supprimer pour les pages publiques | `src/app/loading.tsx` | 1 à 2 h |
| 5.4 | Rendu statique des pages publiques : la langue est connue par le dossier (`src/app/en`, …) et n'a pas besoin de `headers()` dans le gabarit racine | `src/app/layout.tsx`, `src/i18n/request.ts`, `src/proxy.ts` | Chantier d'architecture : une à deux journées, à cadrer sur la documentation Next 16 du dépôt |

## Écart 6 — Des données et des mentions en retard

| Constat | Détail |
|---|---|
| Prix par commune | Publication du 25 juin 2026 ; celle du 24 septembre 2026 (2ᵉ trimestre) n'est pas importée. Touche l'estimation, la carte et les 100 pages communes |
| `/carte` | Affiche « Q4 2025 », ce qui contredit la page d'estimation |
| Indice de la construction | « octobre 2025 : 1 173,24 », « mis à jour trimestriellement » |
| Accueil | « réforme FR du 01/09/2026 » au futur ; « 991 tests » pour 2 482 |
| Location courte durée, terres agricoles | Sources datées du 4ᵉ trimestre 2025 et d'août 2025 |
| Traductions | « Q1 2025 » pour « T1 2026 » dans quatre langues |
| Projets de loi 8806 et 8807 | Bëllegen Akt à 45 000 € et exonération VEFA : en commission, non votés. Le site a raison de rester à 40 000 € |
| Plafond de la TVA à 3 % | 50 000 € sur le site ; un doublement est évoqué par une source : à vérifier sur le texte officiel |

| N° | Action | Où | Effort |
|---|---|---|---|
| 6.1 | Importer la publication du 24 septembre et aligner tous les libellés de date | `src/lib/market-data*.json`, `market-data.ts` | 1 à 2 h, tests compris |
| 6.2 | Corriger les mentions périmées listées ci-dessus | textes | 1 h |
| 6.3 | Interrupteur « projet de loi 8806 (45 000 €) » dans `/frais-acquisition` et `/simulateur-aides`, valeur par défaut inchangée | calculs et interface | 1 à 2 h |
| 6.4 | Contrôle automatique : la tâche quotidienne compare la date du jeu data.public.lu à celle du fichier importé et alerte | `src/app/api/cron/daily/route.ts` | 1 à 2 h |
| 6.5 | Vérifier auprès des sources le barème notarial, le barème d'impôt, les montants Klimabonus, le plafond de TVA | — | Demi-journée ; non fait dans cet audit |
| 6.6 | Purger les clés de traduction mortes qui portent d'anciennes règles | `src/messages/*.json` | 1 à 2 h |

## Écart 7 — Des traductions complètes en apparence, abrégées dans le détail

Tous les titres et H1 sont traduits et aucun seuil légal ne diverge. Mais le texte affiché ne représente que 77 % du français en allemand et 81 % en luxembourgeois ; 32 pages allemandes font moins des trois quarts de la version française. Le portugais affiche 169 mots sans accents sur 14 pages, pages légales comprises ; le français lui-même en a 12 sur 4 pages. L'allemand emploie « Syndikus » (juriste d'entreprise) pour syndic, 32 fois. L'écran « Chargement… » est en français dans toutes les langues.

| N° | Action | Où | Effort |
|---|---|---|---|
| 7.1 | Corrections mécaniques : accents (portugais, allemand, français), « Syndikus », « síndico », tréma de Bëllegen Akt, millésimes, « Chargement… », tutoiement de `/syndic` | `src/messages/*.json`, `loading.tsx` | 2 à 3 h, avec contrôle par script |
| 7.2 | Retraduire en entier les blocs abrégés, en commençant par les pages classées en allemand et en anglais | `src/messages/{de,lb,en,pt}.json` | Une journée |
| 7.3 | Relecture native du luxembourgeois sur les dix pages les plus vues | — | Relecteur à trouver par vous |

## Écart 8 — Le design ne montre ni le produit ni le résultat

L'accueil s'ouvre sur un titre et deux boutons, puis déroule sept profils et trente-six outils. Aucune page n'a d'image. Sur les outils, le chiffre attendu est une ligne de tableau. Zillow ouvre sur un champ, NerdWallet sur le résultat en grand, Mews sur une capture du produit, Matera sur trois entrées, plusvalue.lu sur une question et un objet interactif.

| N° | Action | Où | Effort |
|---|---|---|---|
| 8.1 | Résultat principal en grand en tête de colonne, avec répartition graphique ; avertissements repliés | 8 outils particuliers | Demi-journée |
| 8.2 | Accueil : une question et un champ « commune », trois ou quatre entrées, le reste renvoyé à `/solutions` | `src/app/page.tsx` | Demi-journée, après accord sur la maquette |
| 8.3 | Captures du PMS, du CRM, du syndic et de la carte sur les pages professionnelles | `/solutions/*`, `/pro-agences`, `/hotellerie` | 2 à 3 h, avec un compte de démonstration |
| 8.4 | Bandeau de cookies en bande basse sur mobile ; en-tête sur une ligne | `CookieBanner.tsx`, `Header.tsx` | 1 h |
| 8.5 | Une image de partage par outil | `opengraph-image` par route | 1 à 2 h |
| 8.6 | Envoi du PDF par e-mail sans compte, à titre facultatif ; rappel d'échéance | `PdfButton.tsx`, envoi d'e-mails | Demi-journée, après décision |
| 8.7 | Un signe d'identité propre (titre de caractère, carte du pays en motif) | feuille de style | Décision de goût : maquette à vous soumettre |

## Écart 9 — Aucune action sur les liens et la notoriété

Backlinko fait de l'autorité un travail de six mois : actifs citables, annuaires pertinents, mentions à transformer en liens, relations presse. Tevaxia a les actifs (100 pages communes, indices, carte, calculateurs) et une seule référence tierce connue, la fiche data.public.lu. Le profil de liens n'a pas pu être mesuré. Chaque page déclare comme éditeur NOTARIA PRIME, à Pont-l'Abbé.

| N° | Action | Effort |
|---|---|---|
| 9.1 | Page « Chiffres clés de l'immobilier luxembourgeois », mise à jour à chaque publication, faite pour être citée | 2 à 3 h |
| 9.2 | Demander un lien retour à LPVI, vers qui le site renvoie depuis chaque page | Un message de votre part |
| 9.3 | Liste des annuaires et sites luxembourgeois pertinents, sur le modèle du fichier de liens Auclair | Demi-journée de recherche ; je peux la produire |
| 9.4 | Trancher la question de l'éditeur avant de démarcher syndics et banques | Décision |

## Ordre de traitement

| Lot | Contenu | Effort cumulé | Bloqué par |
|---|---|---|---|
| A — corrections sans décision | 2.1 à 2.3, 3.2, 3.4, 3.5, 4.3, 5.1 à 5.3, 6.1, 6.2, 6.4, 7.1, 8.4, 1.3 | Une journée | Région Supabase pour 5.1 |
| B — textes et métadonnées | 3.1, 3.3, 3.7, 2.4, 2.5, 4.4, 6.6, 7.2 | Deux journées | Relecture métier de 3.3 |
| C — pages professionnelles | 4.1, 4.2, 4.5, 8.3 | Une à deux journées | Compte de démonstration, destinataire des demandes |
| D — design | 8.1, 8.2, 8.5, 8.7, 9.1 | Une à deux journées | Accord sur maquette |
| E — architecture et mesure | 5.4, 1.1, 6.3, 8.6 | Deux journées | Cadrage Next 16 ; décision sur l'e-mail |
| Hors code | 1.2, 4.6, 6.5, 7.3, 9.2 à 9.4, 3.6 | — | Vous |

Le lot A peut partir tout de suite. Les effets sur les positions, eux, se liront sur plusieurs semaines : c'est le délai de réexploration de Google, pas celui du travail.

## Ce qui n'a pas été vérifié

- Trafic, requêtes réelles, taux de clic, liens entrants.
- Temps d'affichage (quota PageSpeed dépassé) ; seuls les poids et les en-têtes sont mesurés.
- Le recalcul indépendant de chaque outil : les tests passent et trois paramètres ont été confrontés aux sources, pas l'ensemble des barèmes.
- La qualité du luxembourgeois au-delà de la cohérence terminologique.
- Les écrans connectés et les portails à jeton.
- Les positions, relevées une seule fois, de l'extérieur.
- La région du projet Supabase ; la périodicité exacte de l'indice STATEC de la construction ; le plafond de TVA à 3 % annoncé.
