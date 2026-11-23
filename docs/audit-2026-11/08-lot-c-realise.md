# Note 8 — Lot C : pages de présentation des logiciels (21 novembre 2026)

Branche `fix/audit-lot-c`, empilée sur `fix/audit-lot-b`. Rien n'est déployé. Vérifications : types, lint, 2 510 tests, puis 42 contrôles automatiques sur une compilation de production locale, et un passage dans le navigateur en largeur d'ordinateur et de téléphone.

Le lot C couvre les actions 4.1, 4.2, 4.5 et 8.3 de l'audit. Les deux points qui le bloquaient ont été tranchés avant de commencer : les demandes de démonstration sont enregistrées dans une table Supabase, et le produit est montré par des aperçus reconstruits en HTML avec des données fictives.

## À faire de votre côté avant la mise en ligne

**Appliquer la migration `supabase/migrations/074_demo_requests.sql` en production.** Un déploiement du site ne l'applique pas. Tant qu'elle n'est pas appliquée, le formulaire répond « La demande n'a pas pu être enregistrée » et propose d'écrire à contact@tevaxia.lu : aucune demande n'est perdue en silence, mais aucune n'est enregistrée non plus.

Les demandes se lisent ensuite dans la table `demo_requests` de Supabase. Aucun e-mail ne vous prévient : il faut ouvrir la table. La colonne `status` (`new`, `contacted`, `closed`) sert à suivre les réponses à la main.

## Fait

| Action | Détail |
|---|---|
| 4.1 Logiciel de syndic | `/solutions/syndic` est refaite : titre « Logiciel de syndic de copropriété au Luxembourg », aperçu d'une assemblée générale, neuf fonctions, trois étapes de démarrage, cinq limites, prix, cinq questions, formulaire. Environ 1 190 mots en français. |
| 4.2 PMS hôtelier | `/solutions/hotel` devient la page du PMS : titre « PMS hôtelier au Luxembourg : logiciel de gestion d'hôtel », aperçu du planning des réservations, même structure. Les six outils d'analyse hôtelière et les encadrés TVA et Green Key sont conservés sous la présentation. |
| 4.2 Gestion locative | `/gestion-locative` devient une page de présentation rendue côté serveur : titre « Logiciel de gestion locative au Luxembourg », aperçu du portefeuille, même structure, liens vers les sources officielles conservés. |
| 4.5 Demande de démonstration | Formulaire court sur les trois pages et sur `/pro-agences` : nom, adresse e-mail, et en option société, téléphone, taille de l'activité, message. |
| 8.3 Montrer le produit | Quatre aperçus en HTML, légendés « Aperçu illustratif, données fictives » : assemblée générale et appels de fonds, planning des réservations avec occupation et RevPAR, portefeuille locatif avec plafond légal, pipeline des mandats du CRM. Aucune image à maintenir, traduits dans les cinq langues. |
| Maillage | Les trois pages sont liées depuis le pied de page de toutes les pages. |
| Cinq langues | Les trois pages, les aperçus et le formulaire sont traduits en entier en anglais, allemand, portugais et luxembourgeois (environ 2 600 mots par langue). |

## Découverte : l'ancienne page syndic annonçait des fonctions que le code ne confirme pas

Avant de réécrire, j'ai rapproché chaque fonction annoncée des écrans réels du logiciel (30 écrans syndic, 23 PMS, 12 gestion locative). L'ancienne page `/solutions/syndic` contenait plusieurs affirmations que je n'ai pas retrouvées dans le code :

| Ce que la page affichait | Ce que fait le logiciel |
|---|---|
| Appels de fonds « Factur-X conformes EN 16931 » | Un PDF par lot, qui porte la mention « Ne constitue pas une facture fiscale » |
| « Réconciliation bancaire PSD2 » pour le syndic | Import d'un relevé CSV ; la connexion PSD2 n'existe que dans la gestion locative |
| « art. 261 D CGI appliqué » | Article du code général des impôts français, sans objet au Luxembourg |
| « Import depuis Excel, saisie manuelle ou API » | Saisie à la main ; je n'ai trouvé aucun import de copropriétés |
| Portail copropriétaire avec « paiement en ligne » | Convocations, vote et relevé de compte ; pas de paiement |
| Données « AWS eu-central-1 Francfort » | La base est en Irlande (`eu-west-1`), d'après le relevé du lot A |
| « 15 h économisées par AG », « réponse moyenne sous 6 heures », « nouveaux modules toutes les 2 semaines » | Chiffres sans source |
| « L'AG en ligne est juridiquement valable », « 100 % conforme loi 16.05.1975 » | Affirmations juridiques que le logiciel ne peut pas garantir |

La nouvelle page ne cite que des fonctions qui correspondent à un écran, et elle comporte un bloc « Ce que le logiciel ne fait pas ». Les deux autres pages suivent la même règle ; elles reprennent les réserves déjà écrites en septembre pour l'hôtellerie (calendriers iCal, TVA saisie ligne par ligne, statuts de facturation déclaratifs).

**Même affirmation ailleurs, non corrigée.** La page des tarifs annonce encore « appels de fonds (Factur-X batch) » pour le syndic (`pricing.pro.f2`). Je ne l'ai pas modifiée : elle est hors du lot.

**Les six autres pages « solutions » n'ont pas été relues.** `/solutions/agence`, `/banque`, `/expert-evaluateur`, `/investisseur`, `/particulier` et `/promoteur` utilisent l'ancien gabarit, avec le même type de chiffres et de promesses. `/pro-agences` garde aussi son texte d'origine : je n'y ai ajouté que l'aperçu et le formulaire.

## Ce que j'ai fait autrement que prévu

- **Le simulateur `/syndic` reste public.** L'audit proposait de le passer derrière la connexion. C'est un outil qui fonctionne sans compte ; je l'ai laissé accessible et renommé « Charges de copropriété au Luxembourg : simulateur par tantièmes », pour qu'il ne vise plus la même requête que la page du logiciel. Le lot B lui avait donné le titre « Logiciel de syndic… » : il est remplacé.
- **`/pms` reste en `noindex`.** C'est l'écran de connexion du PMS. La page publique du PMS est `/solutions/hotel`.
- **Prix.** Les pages reprennent ce que dit la page des tarifs : syndic et PMS gratuits avec un compte pendant le lancement, 29 € par mois annoncés pour l'offre Pro ; gestion locative comprise dans le compte gratuit.

## Le formulaire, en détail

- **Parcours.** Le formulaire envoie la demande à `/api/demo-request`, qui la valide puis appelle la fonction SQL `submit_demo_request`. La table n'est lisible et modifiable que par le rôle de service.
- **Protection contre les abus.** Champ piège invisible, refus des envois venant d'un autre site, taille de message limitée, et dans la base : au plus 5 demandes par expéditeur et 60 pour tout le site par heure, doublons ignorés pendant dix minutes.
- **Données personnelles.** L'adresse IP n'est pas enregistrée : seule une empreinte, renouvelée chaque jour, sert à limiter les envois. Un paragraphe « Demandes de démonstration » est ajouté à la politique de confidentialité dans les cinq langues, et sa date passe au 21 novembre 2026.
- **Ce qui reste à décider.** Aucune durée de conservation n'est fixée ni appliquée : les demandes restent dans la table jusqu'à ce que vous les supprimiez. La politique dit seulement que la suppression peut être demandée. Les pages promettent une réponse par e-mail pour convenir d'un créneau.

## Textes retirés

Les blocs que plus aucune page n'affiche sont supprimés dans les cinq langues : l'ancienne page `solutions.syndic`, l'accueil `gestionLocativeHub` (qui annonçait encore un « statut MVP » avec des lots enregistrés uniquement dans le navigateur) et le bloc de texte `gestionLocative.seo`, l'un des quinze blocs non relus signalés dans la note 7. Il en reste quatorze.

## Vérification

| Contrôle | Résultat |
|---|---|
| Types, lint, tests | `tsc` et `eslint` propres, 2 510 tests réussis, dont 24 nouveaux sur la validation et la route du formulaire |
| Compilation de production (copie temporaire sur `C:`, supprimée ensuite) | Réussie |
| Trois pages dans cinq langues (15 pages) | Titre, H1 unique, adresse canonique, aperçu, formulaire, balisages `SoftwareApplication` et `FAQPage`, toutes les fonctions et limites affichées, aucune clé brute, aucune des anciennes affirmations : 15 conformes |
| `/pro-agences`, confidentialité, `/syndic`, pied de page, dans cinq langues | 20 conformes |
| Sitemap | Les trois pages y figurent |
| Route du formulaire | Adresse invalide refusée, champ piège ignoré, autre origine refusée, corps illisible ou trop long refusé, repli annoncé quand la base n'est pas joignable : 6 conformes |
| Navigateur | Formulaire envoyé sur le site local : le message de repli et l'adresse de contact s'affichent. Aucun débordement horizontal à 375 px de large sur les quatre pages |
| Contrôles des lots précédents | Les 8 contrôles VEFA conformes ; 38 des 39 contrôles du lot B, le 39ᵉ étant l'ancien titre de `/syndic`, changé volontairement |

Deux défauts d'affichage trouvés au navigateur et corrigés : le planning du PMS débordait de sa colonne, et un libellé allemand dépassait de sa case.

Non vérifié :

- **L'enregistrement réel d'une demande.** La copie locale n'a pas accès à la base, et la migration n'est pas appliquée. La fonction SQL n'a donc jamais été exécutée ; seule la route est testée, avec une base simulée.
- **Le luxembourgeois**, que je ne peux juger que sur la cohérence.
- **L'effet sur les positions Google**, lisible seulement après déploiement.
