# Note 3 — Exactitude des calculs, des paramètres et des données (20 novembre 2026)

## Ce qui a été fait, et ce qui ne l'a pas été

| Contrôle | Portée | Résultat |
|---|---|---|
| Suite de tests du dépôt (`npx vitest run`) | 206 fichiers, 2 482 tests | Tous réussis. Cela établit la cohérence interne des formules, pas leur conformité au droit. |
| Paramètres légaux affichés, confrontés à une source officielle du jour | Bëllegen Akt, données de l'Observatoire, coefficient de réévaluation 1918 | Voir ci-dessous |
| Dates et millésimes affichés sur les pages françaises | 159 pages hors communes | 9 mentions périmées ou incohérentes |
| Cohérence des chiffres entre le français et les autres langues, sur le texte rendu | 188 pages × 4 langues | Aucun seuil légal divergent sur les outils clés ; des détails manquent là où la traduction est abrégée |
| Recalcul indépendant de chaque outil, cas par cas | Non fait | Les audits métier des 8 et 9 septembre (`AUDIT-METIER-2026-09-08.md`, `-09-09.md`) l'ont fait ; je ne les ai pas refaits |
| Barème notarial, barème d'impôt, montants Klimabonus, plafonds CSSF | Non confrontés à la source | À faire |

Je ne peux donc pas affirmer que « tous les calculs sont justes ». Je peux affirmer que les tests passent, que les paramètres vérifiés sont exacts, et que les défauts trouvés sont des défauts de fraîcheur.

## Paramètres vérifiés

**Bëllegen Akt : exact.** Le site applique 40 000 € par acquéreur (`src/lib/constants.ts`, ligne 15) et précise que la hausse à 45 000 € n'est pas intégrée. Le projet de loi 8806, déposé le 24 juillet 2026, est toujours « en commission », dernière mise à jour le 13 octobre 2026 ([Chambre des Députés](https://www.chd.lu/fr/dossier/8806)). [Guichet.lu](https://guichet.public.lu/fr/citoyens/aides/logement-construction/aides-indirectes/credit-impot-actes-notaries.html) affiche toujours 40 000 €. La presse spécialisée indique une application rétroactive au 16 juillet 2026 une fois la loi votée ([Kleyr Grasso](https://kleyrgrasso.com/news/projet-de-loi-n-8806-augmentation-du-credit-dimpot-bellegen-akt-et-projet-de-loi-n-8807-exoneration-temporaire-des-droits-denregistrement-en-matiere-de-vefa/)).

**Seuil de spéculation : cohérent.** Le calculateur et le guide retiennent cinq ans en 2026 et le régime transitoire de 2025, dans les cinq langues. plusvalue.lu, outil concurrent indépendant, applique la même règle.

**Coefficients de réévaluation : un point de contrôle concordant.** La table 2026 du code (`src/lib/coefficients-reevaluation.ts`, source ACD, texte coordonné au 1ᵉʳ janvier 2026) donne 206,57 pour 1918 ; plusvalue.lu affiche la même valeur. Un seul point a été comparé.

**Minimum de 100 € de droits :** le simulateur le respecte (cas 750 000 €, deux acquéreurs : 52 500 € de droits, 52 400 € imputés, 100 € dus).

## Défauts de fraîcheur

| Page | Ce qui est affiché | Ce qui est vrai au 20/11/2026 | Fichier |
|---|---|---|---|
| `/estimation`, `/hedonique`, `/transparence`, 100 pages communes | « publication du 25 juin 2026 », période avril 2025 à mars 2026 | Le jeu de données « Prix de vente des appartements par commune » a été mis à jour le 24 septembre 2026, avec le 2ᵉ trimestre 2026 ([data.public.lu](https://data.public.lu/en/datasets/prix-de-vente-des-appartements-par-commune/)) ; les prix annoncés aussi | `src/lib/market-data.ts` (ligne 36), `src/lib/market-data-2026t1.json` |
| `/carte` | « Données : Observatoire Habitat Q4 2025 » | Contredit la page d'estimation, qui annonce juin 2026 | libellé de la carte |
| `/solutions/promoteur`, accueil | « indice STATEC octobre 2025 : 1 173,24 », « mis à jour trimestriellement » | Valeur vieille de 13 mois ; la périodicité annoncée est à vérifier (l'indice des prix de la construction est publié deux fois par an, sauf erreur de ma part) | textes `solutions`, `home.modules` |
| Accueil | « pour la réforme FR du 01/09/2026 » | L'échéance est passée ; `/facturation` dit correctement « depuis le 1er septembre 2026 » | `home.modules.facturation` |
| Accueil | « 991 tests automatisés » | 2 482 | `src/app/page.tsx`, ligne 474 |
| `/str/observatoire` | « observations tevaxia Q4 2025 » | Un an | `src/lib/str-observatoire.ts` |
| `/terres-agricoles` | « Publication indiquée : 23 août 2025 » | Une édition 2026 existe peut-être : à vérifier | `src/lib/agricultural-reference.ts` |
| Outils bancaires (traductions) | « Q1 2025 », « Mäerz 2025 » en anglais, allemand, portugais, luxembourgeois | Le français dit « T1 2026 » | `outilsBancaires.indicativeRates*` |
| `README.md` | « Données live : data.public.lu » | Les prix communaux sont un fichier importé à la main ; la tâche planifiée quotidienne ne met à jour que des statuts de gestion | `src/app/api/cron/daily/route.ts` |

## Évolutions légales à suivre

| Sujet | État | Effet sur le site |
|---|---|---|
| Bëllegen Akt à 45 000 € (projet 8806) | En commission | Ajouter un interrupteur « projet de loi » dans `/frais-acquisition` et `/simulateur-aides`, comme le fait carmoimmo.lu, sans changer la valeur par défaut |
| Exonération temporaire des droits en VEFA (projet 8807) | Annoncée le 16 juillet 2026, non votée | Mention à ajouter sur `/vefa` et `/frais-acquisition` |
| Plafond de la TVA à 3 % | Le site applique 50 000 € (`TVA_FAVEUR_PLAFOND`). Une source évoque un doublement à 100 000 € annoncé en juin 2026 ([newimmo.lu](https://www.newimmo.lu/fr/blog/tva-logement-le-plafond-double-luxembourg/)), une autre s'en tient à 50 000 € | Non tranché : à vérifier sur le texte officiel avant toute modification |

## Clés de traduction mortes

Les fichiers `src/messages/*.json` contiennent encore les anciens textes d'accompagnement des outils (`plusValues.seo.*`, `fraisAcquisition.seo.*`, `estimation.seo.*`), qui ne sont plus affichés. Ils portent des règles dépassées, par exemple « après plus de 2 ans de détention » pour la plus-value, ou un exemple de frais à 8,2 %. Ils ne nuisent pas tant qu'ils restent masqués, mais ils seraient faux s'ils étaient réactivés tels quels, et Google en garde la trace : une recherche du 20/11 citait encore la règle des deux ans comme venant de tevaxia.lu.

## Sources

[Chambre des Députés, dossier 8806](https://www.chd.lu/fr/dossier/8806) · [Guichet.lu, Bëllegen Akt](https://guichet.public.lu/fr/citoyens/aides/logement-construction/aides-indirectes/credit-impot-actes-notaries.html) · [data.public.lu, prix par commune](https://data.public.lu/en/datasets/prix-de-vente-des-appartements-par-commune/) · [Logement.lu, prix de vente](https://logement.public.lu/fr/observatoire-habitat/prix-de-vente.html) · [Gouvernement, « Booster fir de Wunnengsbau »](https://gouvernement.lu/fr/actualites/toutes_actualites/communiques/2026/07-juillet/16-meisch-roth-booster-wunnengsbau2.html) · [plusvalue.lu](https://plusvalue.lu/)
