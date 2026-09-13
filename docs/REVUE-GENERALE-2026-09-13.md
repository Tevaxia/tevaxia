# Tevaxia — revue générale du 13 septembre 2026

La revue couvre les accès, les agrégats financiers, les parcours de gestion, les intégrations et l’affichage du site. Les migrations 064 à 073 sont appliquées à Supabase Tevaxia (`dpynqvilgniohgtichbz`). Les corrections sont publiées par lots sur `origin/master` ; le dernier lot est soumis au contrôle de déploiement décrit en fin de rapport.

## Corrections livrées

| Domaine | Résultat |
| --- | --- |
| Locations, paiements, colocataires | 064/065 : cohérence entre propriétaire, lot, paiement, colocataire et jeton public ; expiration vérifiée après attente de verrou. |
| Liens partagés et tableau de bord | 066 et corrections applicatives : accès atomique, compteurs cohérents, totaux personnels paginés, calculs en centimes, distinction entre zéro et données indisponibles, réponses tardives ignorées après changement de compte. |
| Droits de base et MFA | 067/068 : vues soumises aux droits de l’appelant, fonctions privées restreintes, chemins SQL fixés, exigence AAL2 dès qu’un facteur MFA est vérifié. MFA reste facultative tant qu’aucun facteur n’est vérifié. |
| Comptabilité et appels de fonds | 069 : écritures et restauration atomiques, équilibre au centime, cohérence compte/exercice/immeuble, clôture protégée, génération concurrente sérialisée, répartition des centimes sans écart de total. |
| Portails copropriétaires | 070 : jetons limités à leur immeuble et lot, brouillons masqués, montants dus/payés correctement utilisés, messages limités, votes sérialisés et refusés après expiration/clôture. Relevé des seuls impayés, sans addition répétée des pénalités de relance. |
| PMS et groupes | 071 : paiements concurrents et remboursements correctement agrégés, montants convenus conservés, devises préservées, TVA détaillée par taux, facture unique en cas de double clôture, factures émises protégées, restauration complète d’un folio. Création protégée du module groupes qui manquait dans Supabase ; compteurs des groupes source et destination corrigés. |
| Rattachements financiers et sauvegardes | 072 : contrôles de parenté sur 15 tables de copropriété et travaux ; impossible de mélanger deux immeubles même dans une organisation commune. Votes fermés protégés, transfert de parts actualisant les deux totaux, historique des sauvegardes manquant créé avec RLS/MFA. Audit de nuit conservant les séjours déjà terminés et refusant les devises mélangées sans conversion. |
| Stripe | 073 et serveur : un verrou privé sérialise la lecture de Stripe et l’écriture correspondante ; un traitement expiré ne peut écraser un traitement plus récent. Le niveau d’abonnement tient compte de tous les abonnements du compte, conserve la période déjà payée et ne rétrograde pas un abonnement actif à cause d’une ancienne annulation. |
| OAuth, exports et assistant | Google/Microsoft : état signé, expirant, lié à la session ; PKCE Microsoft. Export PDF de valorisation soumis à MFA et nom de fichier validé. Assistant du portail isolé par compte et lien, double envoi empêché, délai réseau borné, réponse tardive ignorée, erreurs privées masquées. |
| Affichage et langues | Deux écarts d’hydratation corrigés en luxembourgeois ; liens localisés ; configuration mobile Next.js corrigée. Paragraphe manquant du guide non-résident rétabli dans cinq langues et exemple de droits corrigé pour conserver 100 EUR. |

Le minimum de droits de 100 EUR du guide a été vérifié le 13 septembre sur [Guichet.lu — Bëllegen Akt](https://guichet.public.lu/fr/citoyens/fiscalite/immobilier/achat-vente-donation/credit-impot-actes-notaries.html). Les exemples corrigés sont explicitement fictifs et excluent les autres frais.

## Étendue des contrôles

| Contrôle | Couverture et résultat |
| --- | --- |
| Inventaire | 220 routes sources et 43 handlers serveur ; inventaire détaillé dans `site-review-inventory.json`. Les copies linguistiques sont distinguées des routes sources. |
| Navigateur | 1 100 chargements : 220 routes dans chacune des cinq langues. HTTP 200 sur toutes ; aucun plantage JavaScript après correction. Les routes privées sont parcourues sans session et les identifiants dynamiques sont fictifs : ce passage contrôle leurs écrans d’accès, pas des dossiers clients réels. |
| Tests applicatifs | 2 194 tests dans 185 fichiers. TypeScript, lint ciblé et trois contrôles Python de traduction réussis. Compilation Next de 1 347 pages réussie. |
| SQL | Régressions 067–073 avec PGlite/PostgreSQL 18.3 et PostgreSQL natif 17.6. Deux organisations, deux immeubles d’une même organisation, propriétaire/personnel, AAL1/AAL2, accès anonyme et service, erreurs/retours arrière, réexécution des migrations. |
| Concurrence réelle | PostgreSQL 17.6 : doubles clôtures PMS, huit paiements simultanés et remboursement, huit écritures de parts, un seul gagnant parmi huit traitements Stripe. Tests supplémentaires des clôtures comptables, expirations et votes dans les lots précédents. |
| Interfaces authentifiées simulées | Composants réels du tableau de bord, MFA, portails et assistant : comptes synthétiques, changements de compte/lien, erreurs et réessais, réponses tardives, double clic. Cinq langues ; quatre largeurs pour MFA, tableau de bord et portails. |
| API | 18 appels locaux sans authentification ou avec corps invalide : refus attendus et aucune fuite de secret. Les contrôles de MFA et d’échecs des fournisseurs sont aussi testés avec services simulés. |
| Production Supabase | Vérification à 03:00 Paris : 93 tables applicatives avec RLS et politique MFA restrictive ; aucune vue publique recensée sans `security_invoker`; 15 protections de rattachement ; fonctions de réconciliation Stripe exécutables uniquement par `service_role`. Aucune charge ni part existante rattachée à un autre immeuble détectée. |

Les défauts de schéma découverts pendant l’application ont provoqué un retour arrière de la transaction 071 ; aucune installation partielle n’a été conservée. Le module groupes manquant a ensuite été créé dans la transaction complète validée.

## Publications et preuves

- Tableau de bord et 064–066 : `13747d50261e92dcc21159c60493f84e2df65330`, déploiement Production confirmé.
- MFA : `232c125984721be7ea41efa4a42b9965299bfb17`, CI et Production confirmées.
- Comptabilité, OAuth et facturation Stripe : `95214d46882e2d7752655224174d865fd23774f7`, CI et Production confirmées.
- Portails : `10abcb02ac7ba0f980ca3224579cab206c621578`, CI et Production confirmées.
- PMS : `973eed51683295f4cb46319377c8ee20aa1c4b6d`, [CI réussie](https://github.com/Tevaxia/tevaxia/actions/runs/34728596646), déploiement Production 6416077293 réussi.
- Preuves SQL : `064-065-production-verification.json`, `066_production_verification.json`, `067-production-verification.json`, `068-production-verification.json`, `069-production-verification.json`, `070-production-verification.json`, `071-production-verification.json`, `072-073-production-verification.json`.
- Régressions reproductibles : `scripts/test-financial-sql.cjs` dans le dépôt ; preuves locales supplémentaires dans `071-native-validation.log`, `072-073-native-validation.log`, `assistant-fixture-validation.log`, `site-browser-crawl.json` et `api-boundaries-local.json`.

Les définitions antérieures des fonctions et leurs droits sont sauvegardés dans le schéma privé `tevaxia_audit`. Les migrations de cette revue ne suppriment pas de dossiers métier existants.

## Limites précises

Cette revue technique ne constitue pas une certification de toutes les hypothèses fiscales ou juridiques des 220 pages. Les modèles métier bénéficient des tests et des revues antérieures consignées dans le dépôt ; les pages chargées ne sont pas présentées comme 1 100 scénarios métier complets.

Les essais financiers, signatures, votes et MFA actifs utilisent des données locales synthétiques. Aucun véritable paiement Stripe, consentement bancaire, e-mail, signature, vote ou facteur MFA d’un utilisateur n’a été déclenché pour les tests. Les raccordements réels aux fournisseurs, les taux de TVA choisis par un établissement et la validité fiscale d’un dossier client restent des vérifications propres au dossier. Le PDF PMS a été vérifié pour ses données et sa devise ; ce lot n’ajoute pas de revue visuelle de toutes les variantes PDF historiques.
