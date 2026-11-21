# Note 7 — Lot B : ce qui a été fait (21 novembre 2026)

Branche `fix/audit-lot-b`, empilée sur `fix/audit-lot-a` (les deux lots touchent les mêmes fichiers de langue). Rien n'est committé ni déployé. Vérifications : types, 2 482 tests, puis 39 contrôles automatiques sur une compilation de production locale (1 342 pages) et une exploration de 912 pages.

Le lot B n'est pas entièrement terminé : deux actions sont faites en partie, et une découverte en cours de route change l'ordre de la suite. Tout est détaillé plus bas.

## Fait

| Action | Détail |
|---|---|
| 6.6 Clés mortes | 28 blocs de texte d'accompagnement qu'aucune page n'affichait plus, et l'espace de noms de l'ancienne page `/hedonique`, supprimés dans les cinq langues : 592 clés et environ 17 000 mots par langue. Aucune clé brute n'apparaît sur les 911 pages explorées. |
| 2.4 Faux guides | `/guide/regle-5-pourcent-loyer` et `/guide/plus-value-immobiliere` portent désormais leur propre H1 (le titre du guide) au lieu de celui de l'outil, reçoivent un balisage `Article` et n'imbriquent plus deux éléments `<main>`. Leur contenu, audité en septembre, est inchangé. |
| 2.5 Communes sans données | Les 36 communes dont aucune valeur de prix ou de loyer n'est publiée passent en `noindex` et sortent du sitemap (865 URL au lieu de 1 045). La règle se lit dans les données : une commune redevient indexable dès qu'une valeur est publiée. |
| 3.7 Pages « solutions » | Chaque outil affiche un bandeau « Tevaxia pour votre métier » vers la ou les pages « solutions » concernées, dans les cinq langues. Ces pages ne recevaient qu'un lien interne chacune. |
| 3.1 Titres et descriptions, français | 88 pages réécrites : requête en tête, « Luxembourg », année pour les sujets datés. 109 titres sur 111 font entre 44 et 62 caractères ; 110 descriptions sur 111 entre 90 et 160. `/pricing` s'appelle enfin « Tarifs ». |
| 3.1 Titres, autres langues | Les 35 pages prioritaires réécrites en anglais, allemand, portugais et luxembourgeois (descriptions pour une quinzaine d'entre elles). Exemple : la page allemande des outils bancaires s'intitulait « Bankwerkzeuge » (13 caractères). |
| 4.4 Quatre pages absentes de Google | `/outils-bancaires`, `/bilan-promoteur`, `/energy/renovation` et `/str/rentabilite` reçoivent un titre centré sur leur requête et un texte de trois paragraphes, dans les cinq langues : ce que l'outil calcule, comment le renseigner, ce qu'il ne couvre pas. Le texte ne fait que reprendre les mentions déjà affichées par chaque outil. |
| 3.3 Texte sous les outils classés | `/frais-acquisition`, `/estimation` et `/simulateur-aides` affichent quatre ou cinq questions-réponses reprises des guides audités, avec balisage `FAQPage` et lien vers le guide. `/plus-values` et `/calculateur-loyer` renvoient à leur guide. Aucun texte juridique nouveau n'a été écrit. |

## Découverte : des textes non audités sur deux pages bien classées

En préparant les retraductions, j'ai lu les blocs de texte placés sous `/carte` (3ᵉ sur « prix m2 luxembourg par commune ») et `/vefa` (1ᵉʳ sur « VEFA luxembourg simulateur »). Ils n'ont pas été nettoyés lors de l'audit de septembre et contredisent soit les données du site, soit les textes de loi.

**`/carte` : corrigé.** Le texte annonçait « 102 communes » (le site en compte 100), « plus de 12 000 €/m² » dans des communes où la donnée affichée est proche de 10 000 €/m², des variations annuelles différentes de la série Eurostat de la page `/indices`, une estimation pour 2026 alors que le site dit ne pas publier de prévision, et un écart « de 5 à 15 % » entre prix annoncés et prix de vente sans source. Les six passages sont réécrits d'après les données du site, sans chiffre appelé à périmer, puis traduits en entier dans les quatre autres langues.

**`/vefa` : corrigé en partie.** Le texte citait une « loi du 18 avril 2018 » qui n'encadre pas la VEFA. Le régime résulte de la loi du 28 décembre 1976 relative aux ventes d'immeubles à construire, soit les articles 1601-1 à 1601-14 du Code civil ([Legilux](https://legilux.public.lu/eli/etat/leg/loi/1976/12/28/n1/jo)), et la garantie d'achèvement relève de l'article 1601-5 ([Commissariat aux Assurances](https://www.caa.lu/uploads/documents/files/LC_16-6.pdf)). La référence est corrigée dans les cinq langues.

Restent sur `/vefa` trois affirmations que je n'ai pas pu confirmer et que je n'ai pas modifiées :

- un échéancier légal « 33 % à l'acte, 60 % hors d'eau, 95 % à l'achèvement », attribué à l'article 1601-11 ; un guide professionnel cite d'autres seuils ([Kolmio](https://kolmio.lu/fr/actualites/promotion-immobiliere-la-vente-en-etat-futur-d-achevement-ou-vefa)) ;
- une indemnité d'immobilisation plafonnée à 5 % (article 1601-10) et une garantie décennale rattachée à un « article 1792-2 » ;
- des intérêts déductibles « de 1 500 à 3 000 € par an ».

Si l'échéancier est faux, la question touche aussi le simulateur, qui s'en sert peut-être par défaut. C'est le premier point à vérifier.

Quinze autres pages utilisent encore ce type de bloc : `/achat-vs-location`, `/aml-kyc`, `/bail-commercial`, `/calculateur-loyer`, `/comparer`, `/convertisseur-surfaces`, `/energy`, `/gestion-locative`, `/hotellerie`, `/pag-pap`, `/portfolio`, `/pro-agences`, `/propcalc`, `/syndic`, `/wizard-particulier`. Je ne les ai pas relus.

## Fait en partie

**7.2 Retraduction des blocs abrégés.** Seule la page `/carte` est retraduite en entier. Il reste, en chaînes dont la traduction fait moins de 60 % du français :

| Langue | Chaînes | Mots français à traduire | Dont blocs sous les outils |
|---|---|---|---|
| Anglais | 50 | 2 400 | 18 |
| Allemand | 148 | 6 400 | 46 |
| Portugais | 166 | 7 200 | 52 |
| Luxembourgeois | 186 | 8 400 | 59 |

Je me suis arrêté là volontairement : traduire en entier des textes français non relus reviendrait à diffuser leurs erreurs en quatre langues. Les pages « solutions » et les parcours par profil, qui décrivent le produit, peuvent être retraduits sans attendre.

**3.1 Titres dans les autres langues.** Environ 45 pages par langue gardent leur ancien titre : 60 à 69 titres sur 109 sont dans la plage de longueur visée, contre 109 sur 111 en français.

**3.3 Texte sous les outils.** `/plus-values`, `/calculateur-loyer`, `/achat-vs-location` et `/vefa` n'ont pas reçu de texte nouveau. Un exemple chiffré calculé par l'outil lui-même serait la suite logique ; il demande votre relecture métier.

## Effets de bord à connaître

- Dans les quatre langues traduites, plusieurs pages tirent leur titre et leur H1 de la même clé. Le H1 de ces pages a donc changé avec le titre, sans le suffixe « | Tevaxia » (par exemple, en allemand, « Kreditrahmen in Luxemburg berechnen: Simulator, LTV, DSCR »). En français, c'est le cas de `/syndic`, `/guide`, `/api-banques`, `/facturation` et de l'état des lieux.
- Les titres portent l'année 2026 sur les frais de notaire, la plus-value, les aides et quelques guides. Ils seront à mettre à jour en janvier.
- Les questions reprises sous les outils figurent aussi dans les guides : le même texte apparaît sur deux pages.

## Vérification

| Contrôle | Résultat |
|---|---|
| Types et tests | `tsc` propre, 2 482 tests réussis |
| Compilation de production (copie sur `C:`) | 1 342 pages générées |
| 39 contrôles automatiques du rendu | 39 conformes |
| Clés de traduction brutes sur 911 pages | aucune |
| Pages en erreur | aucune (une redirection attendue) |

Contrôles couverts : titres dans les cinq langues, H1 et balisage des deux guides, `noindex` et sitemap des communes, liens vers les pages « solutions », blocs de questions et leur balisage, textes sous les quatre outils, corrections de `/carte` et de `/vefa`.

Non vérifié : l'effet sur les positions Google, qui ne se lira qu'après déploiement et réexploration ; la qualité du luxembourgeois, que je ne peux juger que sur la cohérence.
