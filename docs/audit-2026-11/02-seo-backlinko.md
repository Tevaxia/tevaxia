# Note 2 — Audit SEO et conformité aux recommandations Backlinko (20 novembre 2026)

Référentiel : les quatre guides Backlinko demandés, [On-Page SEO](https://backlinko.com/on-page-seo), [How to Rank Higher on Google](https://backlinko.com/rank-high-on-google), [Increase Domain Authority](https://backlinko.com/increase-domain-authority) et [Ways to Increase Traffic](https://backlinko.com/increase-website-traffic), dans la lecture qui en a été faite le même jour pour le dossier Auclair (`D:\auclair\docs\notes-de-recherche\seo_acquisition_mesure.md`, section 3). Les mesures portent sur les 121 pages françaises indexables hors communes, sauf mention contraire.

## Positions Google relevées

Session non connectée, `gl=lu`, 35 requêtes, une seule observation par requête. tevaxia.lu apparaît dans les dix premiers résultats sur 24 d’entre elles.

| Requête | Position | Premier résultat |
|---|---|---|
| VEFA luxembourg simulateur échéancier | 1 | — |
| valorisation hôtel luxembourg | 1 | — |
| rent cap luxembourg calculator 5% (EN) | 1 | — |
| frais de notaire luxembourg calculateur | 2 | fraisdenotaire.lu |
| simulateur plus-value immobilière luxembourg | 2 | plusvalue.lu |
| bail commercial luxembourg indexation calcul | 2 | krieger-avocats.lu |
| CRM agence immobilière luxembourg | 2 | nextimmo.lu |
| syndic copropriété luxembourg guide | 2 | agigest.lu |
| prix m2 luxembourg par commune | 3 | logement.public.lu |
| TVA 3 % logement luxembourg simulateur | 3 | logement.public.lu |
| Mietobergrenze Luxemburg berechnen (DE) | 3 | nextimmo.lu |
| calcul loyer maximum 5 % capital investi | 4 | logement.public.lu |
| notary fees luxembourg calculator (EN) | 4 | notaryfees.lu |
| Notarkosten Luxemburg Rechner (DE) | 4 | notarkosten.lu |
| prix terres agricoles luxembourg hectare | 4 | lustat.statec.lu |
| simulateur klimabonus aides logement | 6 | klima-agence.lu |
| acheter ou louer luxembourg simulateur | 6 | logement.public.lu |
| bëllegen akt calcul | 6 | guichet.public.lu |
| estimation appartement luxembourg | 6 | logement.public.lu |
| prix immobilier Differdange | 6 | immotop.lu |
| rentabilité airbnb luxembourg | 6 | carmoimmo.lu |
| PAG PAP luxembourg explication | 7 | vdl.lu |
| PMS hôtel luxembourg logiciel | 9 | capterra.lu |
| convertisseur surface habitable luxembourg | 9 | guichet.public.lu |
| estimation immobilière luxembourg gratuite | absent | immotop.lu |
| logiciel syndic copropriété luxembourg | absent | capterra.lu |
| logiciel gestion locative luxembourg | absent | progetis.lu |
| capacité d'emprunt luxembourg simulateur | absent | bgl.lu |
| calcul rendement locatif luxembourg | absent | gouvernement.lu |
| bilan promoteur luxembourg calcul | absent | entreprisesmagazine.com |
| simulateur rénovation énergétique luxembourg | absent | klima-agence.lu |
| estimer classe énergétique logement luxembourg | absent | logement.public.lu |
| prix m2 Mamer | absent | immotop.lu |
| airbnb luxembourg réglementation | absent | albaluxcredit.lu |
| calculadora custos notário Luxemburgo (PT) | absent | fraisdenotaire.lu |

Un concurrent revient sur neuf de ces requêtes : carmoimmo.lu, agence de Pétange qui aligne neuf simulateurs.

## Grille de conformité

| Recommandation Backlinko | Mesure sur tevaxia.lu | Verdict |
|---|---|---|
| Titre unique par page | 0 doublon sur 188 pages | Conforme |
| Titre de 50 à 60 caractères | 33 sur 121 ; 70 plus courts, 18 plus longs | Partiel |
| Mot-clé au début du titre, avec modificateurs | 46 titres d'outils sans « Luxembourg » ; « Simulateur de Frais d'Acquisition \| Tevaxia », « Dashboard Syndic & Copropriété », « Fonctionnalités — tevaxia.lu » pour la page des tarifs | Non conforme sur les pages clés |
| Année en cours dans les titres de sujets datés | 9 guides la portent ; aucun outil | Partiel |
| Description unique, moins de 160 caractères | 0 doublon ; 32 dépassent 160 (jusqu'à 384) | Partiel |
| Un seul H1 contenant le mot-clé | Un H1 par page ; 3 paires de H1 identiques ; 4 pages indexables sans H1 | Partiel |
| Mot-clé dans les 100 à 150 premiers mots | 225 pages servent d'abord « Chargement… » ; le contenu suit dans un bloc masqué que le navigateur déplace | À corriger (voir performance) |
| Contenu qui répond à l'intention, avec un apport propre | Outils réels, sources citées : c'est le point fort. Mais le texte d'accompagnement a été retiré de `/plus-values`, `/frais-acquisition`, `/estimation` (600 mots contre 1 200 à 2 600 chez ceux qui les devancent) | Partiel |
| Étoffer les pages de moins de 250 mots, retirer celles qui n'apportent rien | 28 pages indexables sous 250 mots, dont 8 sous 100 ; 31 pages communes sans aucune donnée | Non conforme |
| Structure lisible par les IA : réponse en tête, intertitres en questions, FAQ | FAQ sur 17 outils et 11 guides ; pas de réponse directe en tête des outils ; pas de `llms.txt` (facultatif) | Partiel |
| Données structurées | `Article` + `FAQPage` sur les guides, `Place` sur les communes ; 75 pages sur 121 sans balisage propre ; aucun outil ne porte `WebApplication` | Partiel |
| Images : nom de fichier, texte alternatif, compression | Aucune image de contenu sur les 259 pages ; `og-image.png` unique pour tout le site | Sans objet, et c'est un manque |
| Liens internes depuis les pages fortes, ancres descriptives | Menus non présents dans le HTML ; 58 pages à 2 liens entrants ou moins ; pages « solutions » à 1 | Non conforme |
| Architecture : toute page à 3 clics | 246 pages sur 250 à 2 clics ou moins | Conforme |
| URL courtes et parlantes | Oui ; une exception de langue, les URL restent en français dans les 5 langues (`/en/frais-acquisition`) | Conforme pour le français, discutable ailleurs |
| Vitesse, mobile, pages explorables | `no-store` partout, exécution à Washington, 575 à 740 Ko de HTML, écran de chargement à chaque navigation ; PageSpeed non mesuré | Non conforme |
| Profondeur plutôt que largeur ; grappes thématiques | 40 modules sur 9 métiers ; les grappes existent (guide + outil + communes) mais ne sont pas reliées par les menus | Partiel |
| Mise à jour et relance des contenus | Données de marché en retard d'une publication ; pas de date « à jour au » sur la plupart des outils | Partiel |
| Suivi mensuel (trafic, CTR, positions) | Aucune mesure d'usage ; Search Console non vérifiable de l'extérieur | Non conforme |
| Actifs citables (statistiques, outils gratuits, données originales) | Présents : 100 pages communes, indices, carte, calculateurs. Aucune page « chiffres clés » pensée pour être citée | Atout sous-exploité |
| Liens : annuaires pertinents, mentions non liées, relations presse | Fiche de réutilisation data.public.lu ; lien vers LPVI en pied de page ; profil de liens non mesuré | Non vérifié |
| Auteur et expertise visibles | `Person` dans les données structurées seulement ; aucun nom ni qualité affichés sur les guides | Non conforme |

## Ce qui en découle

1. Le socle est bon et le site se classe : il ne s'agit pas de refaire le SEO, mais de traiter des défauts ponctuels sur les pages qui portent le trafic.
2. Les trois manques les plus coûteux au regard de Backlinko sont le maillage interne (menus invisibles), le contenu retiré des outils les mieux placés, et l'absence de suivi.
3. Les requêtes professionnelles où le site est absent (syndic, gestion locative, promoteur) n'ont pas de page construite pour elles : `/syndic` est un tableau de bord, pas une page de présentation.
4. Les autres langues se classent aussi (allemand et anglais relevés entre la 1ʳᵉ et la 4ᵉ place), ce qui justifie de corriger les traductions.

## Non vérifié

Volumes de recherche, trafic, CTR, liens entrants, Core Web Vitals (quota PageSpeed dépassé le 20/11), indexation réelle page par page.
