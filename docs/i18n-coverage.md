# Couverture i18n — état par page

**Créé** : 2026-04-19
**Méthode d'audit** : grep des imports `useTranslations` / `getTranslations` de `next-intl` sur tous les `src/app/**/page.tsx`. Les pages sans import sont marquées « No i18n » — certaines peuvent cependant avoir peu de texte user-facing.

## Résumé

| État | Nombre | % |
|------|--------|---|
| ✅ i18n complète (import next-intl) | ~105 pages | ~70% |
| ⚠️ No i18n (FR hardcodé) | ~40 pages | ~27% |
| 🛠 Technique / non-UI | ~5 pages | ~3% |

Le site est principalement en français ; les 5 langues (FR/EN/DE/LB/PT) sont requises uniquement pour les pages publiques à forte SEO value ou à audience pro internationale. Les pages B2B derrière auth peuvent rester FR-only à court terme si ça accélère les livraisons.

## Pages à i18n complète (extrait)

Toutes les pages principales du site :
- `/` (accueil)
- `/estimation`, `/valorisation`, `/hedonique`, `/dcf-multi`
- `/frais-acquisition`, `/calculateur-loyer`, `/plus-values`
- `/comparer`, `/achat-vs-location`, `/simulateur-aides`, `/vefa`
- `/bilan-promoteur`, `/estimateur-construction`, `/calculateur-vrd`, `/convertisseur-surfaces`
- `/outils-bancaires`, `/portfolio`, `/aml-kyc`, `/api-banques`
- `/hotellerie` (hub), `/hotellerie/valorisation`, `/hotellerie/dscr`, `/hotellerie/exploitation`, `/hotellerie/renovation`, `/hotellerie/revpar-comparison`, `/hotellerie/score-e2`, `/hotellerie/forecast`, `/hotellerie/observatoire-lu`
- `/hotellerie/pre-acquisition` ✅ **corrigé 2026-04-19**
- `/pms` (hub)
- `/syndic` (hub), `/syndic/coproprietes`, `/syndic/benchmark`
- `/energy/*` (hub + impact + rénovation + communauté + hvac + epbd + cpe + lenoz)
- `/marche`, `/indices`, `/pag-pap`, `/terres-agricoles`
- `/carte`, `/guide`, `/propcalc`
- `/connexion`, `/profil`
- `/mentions-legales`, `/confidentialite`, `/cgu` ✅ **livré 2026-04-19**
- `/api-docs` ✅ **corrigé 2026-04-19**
- `/actions-prioritaires` ✅ **corrigé 2026-04-19**
- `/facturation` ✅ **livré 2026-04-19**
- `/facturation/emission` ✅ **livré 2026-04-19**
- `/facturation/historique` ✅ **livré 2026-04-19**

## Pages user-facing sans i18n (à corriger)

### Priorité HAUTE — pages publiques ou accueil d'un module

| Page | Contexte | Priorité fix |
|------|----------|--------------|
| `recherche` | Recherche globale cross-entités | Haute — point d'entrée fréquent |
| `tableau-bord` | Dashboard user principal | Haute — page d'accueil post-login |
| `transparence` | Page publique transparence plateforme | Haute — enjeu crédibilité |
| `wizard-particulier` | Wizard d'accueil particulier | Haute — UX critique |
| `str/*` (7 pages) | Module Short-Term Rentals complet | Moyenne — pages publiques SEO |
| `commune/[slug]` | Data-driven page par commune | Basse — data domine texte |

### Priorité MOYENNE — pages pro derrière auth

Ces pages sont utilisées par des professionnels LU qui comprennent FR. Traduction utile mais non bloquante.

| Module | Pages | Note |
|--------|-------|------|
| Gestion locative | `assurance-impayes`, `etat-des-lieux`, `fiscal`, `reconciliation`, `relances` | Bailleurs LU parlent FR |
| Hôtellerie | `alerts`, `benchmark`, `capex`, `certifications-esg`, `compset`, `due-diligence`, `housekeeping`, `impayes`, `mice`, `motel`, `transactions` | Pro hôtel LU parlent EN+FR ; EN prioritaire |
| CRM Agences | `pro-agences/{commissions,crm,fiche-bien,mandats,performance}` | Agents LU parlent FR |
| Syndic | `syndic/{lettres-types,portefeuille,procuration}` | Syndics LU parlent FR+DE ; DE prioritaire |
| Energy | `energy/{connexion,mes-evaluations,profil}` | Partiellement couvert |
| ESG | `esg/{crrem-pathways,taxonomy}` | Pro ESG parlent EN ; EN prioritaire |
| Calculateur loyer | `observatoire` | Extension du calculateur déjà i18n |

### Priorité BASSE — pages à tokens publics

| Page | Usage | Note |
|------|-------|------|
| `aml-kyc/archives` | Archive interne | FR OK |
| `conseil-syndical/[token]` | Dashboard conseil syndical via token | Usage rare |
| `copropriete/[token]` | Portail copropriétaire via token | Déjà multilingue partiel |
| `locataire/[token]` | Portail locataire via token | Déjà multilingue partiel |
| `signer/[token]` | Page signature eIDAS publique | Langue définie par la requête |

## Pages techniques / non-UI

Ces pages n'ont pas besoin de i18n :

- `inspection` — PWA TEGOVA mobile (FR natif, pas traduite volontairement)
- `onboarding` — Wizard technique, corpus réduit
- `profil/api` — Gestion clés API (termes techniques EN/FR mixés)
- `propcalc/developers` — Documentation développeur (EN standard)
- `status` — Page publique statut services
- `verify` — Outil technique de vérification

## Stratégie de rattrapage

### Court terme (quand demande explicite utilisateur)

1. Fix les pages HAUTE priorité si un utilisateur non-FR se plaint
2. Traiter d'un coup un module entier (ex : tout `/str/*`) plutôt que pages isolées pour cohérence

### Moyen terme (roadmap 2026-Q3)

1. Moduliser les clés de traduction par namespace (`str.*`, `hotellerie.*`) pour éviter la croissance du fichier unique
2. Envisager `next-intl` dynamic loading si `fr.json` dépasse 12 000 lignes (actuellement ~9000)
3. Automatiser la détection de strings hardcodées via un script ESLint custom ou un check CI

### Long terme (2027+)

1. Professional translation review DE + LB par natif LU (actuellement machine-aided + validation basique)
2. Locale-based routing complet (aujourd'hui `/en/*` `/de/*` etc. via re-export pattern)

## Rappel memory

Cf. `feedback_i18n_verification.md` : **ne jamais déclarer une i18n complète sans grep systématique**. Le site est un patchwork de contributions et les oublis sont fréquents, surtout sur les pages récemment créées. Audit périodique recommandé à chaque release majeure.

## Historique audits

| Date | Scope | Résultat |
|------|-------|----------|
| 2026-04-19 | Audit ciblé 3 pages signalées | Fix `/hotellerie/pre-acquisition`, `/actions-prioritaires`, `/api-docs` — commit `0c461a8` |
| 2026-04-19 | Audit global `src/app/**/page.tsx` | Ce document — ~40 pages user-facing restantes en FR hardcodé |
