# Note 6 — Lot A : ce qui a été fait (20 novembre 2026)

Branche `fix/audit-lot-a`, créée depuis `origin/master`. Rien n'est committé ni déployé. Vérifications : types (`tsc`), style (`eslint` sur les fichiers modifiés), 2 482 tests, contrôle des espaces de traduction par route. La vérification du rendu en production locale est décrite en fin de note.

## Indexation

| Action | Fichiers | Détail |
|---|---|---|
| 2.2 `/hedonique` | `next.config.ts`, 5 dossiers `hedonique` supprimés | Redirection permanente vers `/estimation` dans les cinq langues. Les liens internes pointent désormais vers `/estimation` (accueil, plan du site, comparateur, valorisation, parcours par profil, liens automatiques). |
| 2.1 sitemap | `src/app/sitemap.ts` | 25 pages ajoutées : 10 outils hôteliers, 5 outils de location courte durée, 2 de gestion locative, `/wizard-particulier`, `/inspection`, `/marche/forecast`, `/pro-agences/fiche-bien`, `/syndic/procuration`, `/syndic/lettres-types`, `/api-docs`, `/cgu`. |
| 2.1 `noindex` | `src/app/layout.tsx` | `/recherche`, `/onboarding`, `/syndic/portefeuille`, `/facturation/emission`, `/gestion-locative/reconciliation` et sa sous-page : ces pages n'affichent rien sans compte. |
| 2.3 portails | `src/app/sitemap.ts` | `/locataire`, `/copropriete`, `/conseil-syndical` retirés du sitemap ; les pages restent accessibles. |

Deux corrections à mon propre audit : `/portfolio` n'est pas une coquille vide (l'outil fonctionne sans compte, c'est son rendu serveur qui est court) et `/verify` est un service public. Je les ai laissées indexables.

## Maillage et données structurées

| Action | Fichiers | Détail |
|---|---|---|
| 3.2 menus | `src/lib/nav-menu.ts` (nouveau), `Header.tsx` | Les cinq panneaux de menu restent dans le HTML servi, masqués par l'attribut `hidden` tant qu'ils sont fermés. Le comportement visible ne change pas. |
| 3.2 pied de page | `Footer.tsx` | Une colonne « Outils » avec les douze outils principaux, sur chaque page. |
| 3.4 `WebApplication` | `JsonLd.tsx`, `layout.tsx` | Balisage ajouté sur chaque calculateur du menu, dans la langue de la page, avec nom, URL canonique, gratuité. Les pages de rubrique et les espaces de gestion n'en reçoivent pas. |
| 4.3 `/pro-agences` | `messages/*.json` | Titre « CRM immobilier au Luxembourg pour agences \| Tevaxia » et description alignée sur le contenu de la page, dans les cinq langues. |

## Performance

| Action | Fichiers | Détail |
|---|---|---|
| 5.1 région | `vercel.json` | `regions: ["dub1"]`. La base Supabase répond depuis `eu-west-1` (Dublin), vérifié par l'adresse de `db.<projet>.supabase.co` dans les plages publiées par AWS. Les fonctions s'exécutaient à Washington. |
| 5.3 écran de chargement | `src/app/loading.tsx` supprimé | Le contenu arrive directement dans la page au lieu d'un écran « Chargement… » suivi d'un bloc différé. Le texte était en français dans toutes les langues. |
| 5.2 CSS inliné | aucun | Mesuré, conservé. Voir ci-dessous. |

## Données et mentions datées

| Action | Fichiers | Détail |
|---|---|---|
| 6.1 prix communaux | `src/lib/market-data-2026t2.json`, `market-data.ts`, `market-snapshot.ts` (nouveau) | Import des quatre fichiers officiels du 24 septembre 2026 (prix affinés : version 2 du 2 octobre), période du 1ᵉʳ juillet 2025 au 30 juin 2026. Les totaux du classeur sont retrouvés : 3 089 ventes, 512 VEFA, 21 740 annonces de vente, 9 479 annonces de location. Luxembourg-Ville : 10 268,68 €/m² sur 613 ventes. Prix de l'existant publiés pour 51 communes (57 auparavant) ; ratio médian nouveau/ancien 0,992. |
| 6.1 libellés | `messages/*.json`, `CantonHeatmap.tsx`, API `refresh-data` | Date de publication et période alignées partout, y compris la carte qui affichait « Q4 2025 ». La période vient d'une constante unique. |
| 6.4 alerte | `src/app/api/cron/daily/route.ts` | La tâche quotidienne compare la date du jeu importé à celle du jeu officiel et envoie un avertissement Sentry si une publication plus récente existe. Elle n'importe rien. |
| 6.2 indice de la construction | `messages/*.json` | Valeur d'avril 2026 : 1 195,69 ([STATEC, 16 juillet 2026](https://statistiques.public.lu/fr/actualites/2026/stn29-26-construction.html)) ; « mis à jour deux fois par an » au lieu de « trimestriellement ». |
| 6.2 autres mentions | `messages/*.json`, `src/app/page.tsx` | Réforme française de la facturation décrite comme en vigueur depuis le 1ᵉʳ septembre 2026 ; « 2400+ » tests au lieu de 991 ; millésime « T1 2026 » reporté dans les quatre traductions. |

Non modifié, faute de donnée plus récente vérifiée : l'indice de terrassement cité dans le calculateur VRD, les observations de location courte durée et hôtelières du 4ᵉ trimestre 2025, la publication agricole d'août 2025.

## Traductions

| Action | Détail |
|---|---|
| Accents portugais | 958 chaînes corrigées, par une table construite sur le corpus lui-même puis des règles de terminaison, avec exclusion des mots ambigus. Variables et balises contrôlées avant et après : aucune altération. |
| Accents allemands | 220 chaînes (« fuer », « Gebaeude », « Haeufig »…). |
| Accents français | 31 chaînes affichées réécrites à la main (`/pag-pap`, `/comparer`, `/propcalc`, `/energy`). |
| « Syndikus » | Remplacé par « Verwalter » dans 32 chaînes allemandes, génitif compris. |
| « síndico » | Remplacé par « administrador de condomínio » dans 46 chaînes portugaises. |
| « Bëllegen Akt » | Tréma rétabli dans 30 chaînes anglaises et allemandes. |
| Vouvoiement | `/syndic` : « Créez et pilotez vos copropriétés ». |

Restent à traiter, hors de ce lot : les chaînes françaises sans accents des blocs qui ne sont plus affichés ; la relecture native du luxembourgeois ; les traductions abrégées (lot B).

## Mobile

| Action | Fichiers | Détail |
|---|---|---|
| 8.4 bandeau de cookies | `CookieBanner.tsx` | Version compacte sous 640 px : marges et corps de texte réduits, les deux boutons côte à côte et de même taille. Le texte et les choix sont inchangés. |
| 8.4 en-tête | `LanguageSwitcher.tsx`, `Header.tsx` | Sélecteur de langue compact (codes FR, EN…) jusqu'à 1 280 px et menus resserrés : l'en-tête tient sur une ligne à 375, 1 024 et 1 366 px (70 px de haut, contre 105 px à 1 024 px auparavant). |

## Reporté

- **3.5 « À jour au … » sur chaque outil.** Afficher une date de mise à jour revient à certifier les paramètres de l'outil à cette date. Je ne l'ai vérifié que pour le Bëllegen Akt, le délai de spéculation et les prix communaux. À faire après la vérification des barèmes (action 6.5).
- **1.3 point zéro PageSpeed.** Le quota de l'API était encore dépassé ; la mesure locale ci-dessous en tient lieu.
- **`/pricing`** s'appelle toujours « Fonctionnalités » : la réécriture des titres est dans le lot B.

## Trois points tranchés après coup

À votre demande, j'ai traité moi-même les trois points que je vous avais laissés.

- **Loi citée sur `/pag-pap`.** Le texte consolidé de la loi du 25 février 2022 relative au patrimoine culturel ([INPA](https://inpa.public.lu/content/dam/ssmn/legislation/loi-patrimoine-culturel-consolidee.pdf), version applicable au 29 avril 2025) abroge la loi du 18 juillet 1983 à son article 125. Les immeubles classés monuments nationaux sont réputés « classés comme patrimoine culturel national » (art. 127) ; ceux de l'inventaire supplémentaire gardent ce statut à titre transitoire (art. 128) ; la loi crée les « secteurs protégés d'intérêt national ». Le texte français de la page reprend ces termes et cite la loi de 2022. Les quatre autres langues ne citaient aucune loi.
- **Terme allemand.** Guichet.lu écrit « Immobilien-/Wohnungseigentumsverwalter (administrateur de biens – syndic de copropriété) » ([Guichet.lu](https://guichet.public.lu/de/entreprises/creation-developpement/autorisation-etablissement/commerce/immobilier.html)) et le ministère du Logement « Verwalter » ou « Syndic ». J'ai retenu « Verwalter », déjà le plus fréquent sur le site, dans les 32 chaînes où figurait « Syndikus ». Les 17 emplois antérieurs de « Hausverwalter » n'ont pas été touchés.
- **Portugais.** Les neuf chaînes du guide de la copropriété sont reformulées : « sindicato » devient « associação de condóminos », avec le terme français entre parenthèses à la première mention ; « conselho sindical » devient « conselho de condóminos » ; « pessoa jurídica » et « inadimplemento », brésiliens, deviennent « pessoa coletiva » et « incumprimento ». Ces choix sont les miens : il n'existe pas de traduction portugaise officielle de la loi luxembourgeoise.

## Vérification du rendu

La compilation de production échoue sur ce poste quand le projet est sur `D:` : le disque est en exFAT, Turbopack ne peut pas y créer de jonction et webpack échoue sur `readlink`. Ce n'est pas lié aux modifications. J'ai compilé une copie sur `C:` (1 342 pages générées), servie en local, puis supprimée.

Sur cette version locale, 41 contrôles automatiques, dont 30 échouaient sur le site en ligne avant correction :

| Contrôle | Avant (en ligne) | Après (local) |
|---|---|---|
| `/hedonique` dans les cinq langues | 200 | 308 vers `/estimation` |
| Sitemap | 940 URL, avec portails et `/hedonique` | 1 045 URL, sans eux, avec les outils ajoutés |
| `noindex` sur les six pages sans contenu public | absent | présent, dans chaque langue |
| Liens internes dans l'en-tête de l'accueil | 7 | 54 |
| Liens internes dans le pied de page | 5 | 17 |
| Liens internes reçus par `/plus-values` | 4 | 208 |
| Pages françaises à deux liens entrants ou moins | 58 (liens du contenu seul) | 34 (tous liens, dont les huit pages « solutions », lot B) |
| Début de `<main>` | « Chargement… » | le titre de la page |
| `WebApplication` sur les calculateurs | absent | présent (vérifié en français, anglais, allemand) |
| `/estimation` | publication du 25 juin 2026 | publication du 24 septembre 2026 |
| `/commune/luxembourg` | 10 250,65 €/m² | 10 268,68 €/m² |
| Mots sans accents affichés, portugais | 169 sur 14 pages | 4 sur 3 pages |
| Mots sans accents affichés, allemand | 13 sur 6 pages | 3 sur 2 pages |
| Mots sans accents affichés, français | 12 sur 4 pages | 0 |
| « Syndikus », « síndico » affichés | 32 et 37 | 0 et 0 |
| Bandeau de cookies sur mobile (375 × 812) | plus de la moitié de l'écran | 271 px, un tiers ; le premier champ de l'outil reste visible |
| Pages inconnues | 404 | 404 |

## Mesure du CSS inliné

Six pages, mobile simulé (réseau 4G lent, processeur ralenti quatre fois), trois passages, valeur médiane, premier chargement sans cache.

| Page | Inliné : premier affichage | HTML transféré | Externe : premier affichage | HTML + CSS transférés |
|---|---|---|---|---|
| `/` | 1,03 s | 111 Ko | 1,53 s | 43 + 23 Ko |
| `/frais-acquisition` | 0,78 s | 94 Ko | 1,32 s | 26 + 23 Ko |
| `/estimation` | 0,69 s | 114 Ko | 1,38 s | 45 + 23 Ko |
| `/plus-values` | 0,75 s | 91 Ko | 1,28 s | 22 + 23 Ko |
| `/commune/luxembourg` | 0,78 s | 92 Ko | 1,48 s | 23 + 23 Ko |
| `/guide/frais-notaire-luxembourg` | 0,82 s | 100 Ko | 1,43 s | 32 + 23 Ko |

Le CSS inliné affiche la page environ une demi-seconde plus tôt à la première visite, au prix d'un HTML quatre à six fois plus lourd une fois décompressé. Comme l'essentiel des visiteurs arrive de Google sur une seule page, j'ai conservé `inlineCss: true`. Mon audit présentait cette option comme un défaut : la mesure ne le confirme pas pour le premier affichage. La question se reposera quand les pages seront mises en cache (action 5.4), car le CSS externe profite alors aux visites suivantes.

Deux pages restent lentes dans les deux variantes : le plus grand élément de `/estimation` s'affiche à 3,7 s et celui de `/commune/luxembourg` à 4,4 s, alors que le premier affichage intervient avant 1 s. C'est un bloc rendu après le chargement du JavaScript, à traiter à part.

Limite : mesure locale, serveur sur la même machine ; elle compare deux variantes entre elles et ne remplace pas PageSpeed sur le site en ligne.
