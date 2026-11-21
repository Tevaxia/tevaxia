# Note 7 — Lot B : ce qui a été fait (21 novembre 2026)

Branche `fix/audit-lot-b`, empilée sur `fix/audit-lot-a` (les deux lots touchent les mêmes fichiers de langue). Rien n'est déployé. Vérifications : types, 2 486 tests, puis 39 contrôles automatiques sur une compilation de production locale (1 342 pages) et une exploration de 912 pages.

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

**`/vefa` : corrigé après vérification sur les textes officiels.** La page citait une « loi du 18 avril 2018 » qui n'encadre pas la VEFA, et plusieurs de ses plafonds étaient faux. Sources : le Code civil consolidé, version applicable au 26 décembre 2025 ([Legilux](https://legilux.public.lu/eli/etat/leg/code/civil/20251226)), la loi du 28 décembre 1976 ([Legilux](https://legilux.public.lu/eli/etat/leg/loi/1976/12/28/n1/jo)), le règlement grand-ducal du 24 février 1977 ([Legilux](https://legilux.public.lu/eli/etat/leg/rgd/1977/02/24/n1/jo)) et [Guichet.lu](https://guichet.public.lu/fr/citoyens/fiscalite/immobilier/depenses-deductibles/declarer-residence-principale-secondaire.html) pour la déduction des intérêts.

| Sujet | Ce que la page affichait | Ce que disent les textes |
|---|---|---|
| Loi applicable | Loi du 18 avril 2018 | Loi du 28 décembre 1976, articles 1601-1 à 1601-14 du Code civil |
| Échéancier | « Article 1601-11 » : 33 % à l'acte, 60 % hors d'eau, 95 % à l'achèvement | Article 1601-9 : terrain à l'acte (au plus 10 % du prix total, sauf justification), puis au plus 15 % du prix des constructions aux fondations, 50 % à la dalle supérieure, 95 % à l'achèvement, solde à la mise à disposition |
| Réservation | Indemnité d'immobilisation plafonnée à 5 % (art. 1601-10) | Dépôt de garantie du contrat préliminaire limité à 2 % du prix prévisionnel (art. 1601-13) ; indemnité forfaitaire de résolution limitée à 10 % (art. 1601-11) |
| Garantie d'achèvement | Garantie « bancaire ou d'assurance » (art. 1601-12), avec une variante « intrinsèque » sur fonds propres du promoteur | Garantie d'achèvement ou de remboursement donnée par une banque, par ouverture de crédit ou cautionnement (art. 1601-5 et règlement de 1977). La variante « intrinsèque » est une notion française ; la seule dispense vise les constructions publiques |
| Garantie décennale | « Art. 1792-2 » | Art. 1646-1, qui renvoie aux articles 1792 et 2270 : dix ans pour les vices cachés, deux ans pour les menus ouvrages |
| Solde de 5 % | « Retenu tant que les réserves ne sont pas levées » | Payable à la mise à disposition ; peut être consigné en cas de contestation sur la conformité (art. 1601-9) |
| Intérêts intercalaires | Déductibles « de 1 500 à 3 000 € par an » | Intégralement déductibles tant que le logement n'est pas à disposition ; plafonds par personne après l'occupation (2 000 à 4 000 € depuis l'année d'imposition 2024, chiffres tirés de sources secondaires concordantes) |

Seize chaînes de la page sont réécrites dans les cinq langues, en entier cette fois, ainsi que cinq chaînes du parcours « promoteur » et la consigne donnée à l'assistant d'analyse de contrat, qui demandait de vérifier une « assurance dommages-ouvrage » et un « parfait achèvement » propres au droit français.

**Le simulateur lui-même : échéancier par défaut aligné.** L'ancien échéancier par défaut (5 % à la signature, puis 15, 20, 20, 15, 15 et 10 %) restait sous les plafonds légaux, mais il était peu réaliste : la loi permet d'appeler le prix du terrain dès l'acte, soit 30 % dans l'exemple par défaut, là où le simulateur n'appelait que 5 %. Les intérêts intercalaires affichés étaient donc sous-estimés.

L'échéancier par défaut se déduit désormais du prix et de la part terrain saisis : le terrain est appelé à l'acte, et le prix des constructions est réparti en 15 % aux fondations, 20 % au hors d'eau, 15 % au hors d'air, 20 % aux cloisons, 25 % aux finitions et 5 % à la livraison, soit en cumul 15 %, 50 % et 95 % aux trois étapes plafonnées par l'article 1601-9. La règle est isolée dans `src/lib/vefa-schedule.ts` et couverte par quatre tests.

| Exemple par défaut (650 000 €, dont 195 000 € de terrain, prêt de 520 000 € à 3,5 %) | Avant | Après |
|---|---|---|
| Échéancier, en % du prix total | 5 / 15 / 20 / 20 / 15 / 15 / 10 | 30 / 10,5 / 14 / 10,5 / 14 / 17,5 / 3,5 |
| Intérêts intercalaires affichés | 18 200 € | 23 402 € |

L'échéancier suit la part terrain tant que l'utilisateur n'a pas modifié un pourcentage : avec un terrain à 10 % du prix, il devient 10 / 13,5 / 18 / 13,5 / 18 / 22,5 / 4,5. Dès qu'un pourcentage est saisi à la main, la saisie est conservée ; « Réinitialiser » revient à l'échéancier déduit. Les pourcentages acceptent une décimale. La note sous l'échéancier explique la règle et rappelle les plafonds légaux, dans les cinq langues.

Deux limites. Le simulateur n'applique pas le plafond de 10 % du prix total pour le terrain payable à l'acte : la loi l'écarte lorsque la valeur du terrain est justifiée, ce que l'outil ne peut pas savoir. Il ne bloque pas non plus un échéancier saisi à la main qui dépasserait les plafonds. Le bloc « garantie » garde son fonctionnement, avec deux choix relibellés : garantie bancaire (cas général) ou vendeur public dispensé.

Reste à votre appréciation : le taux de coût de la garantie proposé par défaut (0,8 % du prix) n'a pas de source ; il est maintenant présenté comme une hypothèse.

Quinze autres pages utilisent encore ce type de bloc : `/achat-vs-location`, `/aml-kyc`, `/bail-commercial`, `/calculateur-loyer`, `/comparer`, `/convertisseur-surfaces`, `/energy`, `/gestion-locative`, `/hotellerie`, `/pag-pap`, `/portfolio`, `/pro-agences`, `/propcalc`, `/syndic`, `/wizard-particulier`. Je ne les ai pas relus.

## Fait en partie

**7.2 Retraduction des blocs abrégés.** Les pages `/carte` et `/vefa` sont retraduites en entier. Il reste, en chaînes dont la traduction fait moins de 60 % du français :

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
| Types et tests | `tsc` propre, 2 486 tests réussis (dont 4 nouveaux sur l'échéancier VEFA) |
| Compilation de production (copie sur `C:`) | 1 342 pages générées |
| 39 contrôles automatiques du rendu | 39 conformes |
| Clés de traduction brutes sur 911 pages | aucune |
| Pages en erreur | aucune (une redirection attendue) |
| Page VEFA après correction juridique, cinq langues | 8 contrôles conformes ; les 39 contrôles du lot rejoués, toujours conformes |
| Échéancier VEFA par défaut, sur une nouvelle compilation | Valeurs attendues affichées dans les cinq langues ; changement de la part terrain, saisie manuelle et réinitialisation testés dans le navigateur ; les 8 et 39 contrôles rejoués, conformes |

Contrôles couverts : titres dans les cinq langues, H1 et balisage des deux guides, `noindex` et sitemap des communes, liens vers les pages « solutions », blocs de questions et leur balisage, textes sous les quatre outils, corrections de `/carte` et de `/vefa`.

Non vérifié : l'effet sur les positions Google, qui ne se lira qu'après déploiement et réexploration ; la qualité du luxembourgeois, que je ne peux juger que sur la cohérence.
