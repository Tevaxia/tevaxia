# Migrations Supabase — checklist opérationnelle

**Dernière mise à jour** : 2026-04-19 (migration 056 inclusive)

Les migrations ne sont **pas auto-déployées** avec Vercel. Elles doivent être appliquées manuellement dans **Supabase Dashboard → SQL Editor** dans l'ordre, OU via `supabase db push` si CLI configuré.

## État de déploiement (prod)

| Batch | Status | Date | Commentaire |
|-------|--------|------|-------------|
| 001–044 | ✅ appliquées | avant 2026-04-17 | Foundations (valuations, orgs, users, AI, hotels, coown, rental, AML, mandates, PMS core) |
| 045–054 | ✅ appliquées | 2026-04-19 (round 5-6) | Pipeline mandats, allocation keys, folios, iCal, relances, signatures eIDAS, portail, vote AG, RPC create_org |
| 055 | ✅ appliquée | 2026-04-19 (round 6) | pms_groups (allotements mariages/MICE) |
| 056 | ✅ appliquée | 2026-04-19 (round 7) | factur_x_history (12 mois rétention) |

## Checklist ordre d'application (greenfield)

Pour un nouveau déploiement from scratch, exécuter dans cet ordre strict :

### Foundations (001–011)
- [ ] `001_create_valuations.sql` — table valuations + RLS
- [ ] `002_create_market_alerts.sql` — alertes prix
- [ ] `003_create_organizations.sql` — orgs + membres
- [ ] `004_create_api_keys_and_logs.sql` — API keys + quotas
- [ ] `005_create_shared_links.sql` — liens publics rapport
- [ ] `006_cloud_sync_valuations_and_lots.sql` — sync ownership
- [ ] `007_user_tiers_and_cron_purge.sql` — plan Free/Pro + purge cron
- [ ] `008_delete_account.sql` — RPC supprimer compte
- [ ] `009_user_preferences.sql` — préférences user
- [ ] `010_org_verticals.sql` — org_type (agency/syndic/hotel_group/bank)
- [ ] `011_stripe_subscriptions.sql` — abonnements Stripe

### Domaines métier (013–044)
- [ ] `013_hotels.sql` — hôtels V1
- [ ] `014_coownerships.sql` — copropriétés V1
- [ ] `015_coownership_finance.sql` — comptes + appels de fonds
- [ ] `016_rental_payments.sql` — paiements locatifs
- [ ] `017_coownership_assemblies.sql` — AG copropriété
- [ ] `018_coownership_accounting.sql` — plan comptable normalisé
- [ ] `019_hotel_daily_metrics.sql` — RevPAR/Occ/ADR
- [ ] `020_ai_preferences.sql` — préférences IA (provider, modèles)
- [ ] `021_ai_add_cerebras.sql` — Cerebras provider
- [ ] `022_user_profile_types.sql` — personas (investisseur, bailleur, pro…)
- [ ] `023_str_operator_profile.sql` — persona short-term rental
- [ ] `024_works_fund.sql` — fonds travaux loi 10.06.1999
- [ ] `025_coownership_portal_tokens.sql` — portail copropriétaire magic link
- [ ] `026_tenant_portal_tokens.sql` — portail locataire
- [ ] `027_works_projects.sql` — projets travaux → devis → BC
- [ ] `028_hotel_yield_alerts.sql` — alertes yield management
- [ ] `029_coownership_messaging.sql` — messagerie syndic Supabase Realtime
- [ ] `030_dunning_and_coliving.sql` — relances + coliving
- [ ] `031_str_properties.sql` — biens STR
- [ ] `032_org_agency_stats.sql` — stats agences
- [ ] `033_shared_link_views.sql` — tracking vues partages
- [ ] `034_shared_link_comments.sql` — commentaires partages
- [ ] `035_api_webhooks.sql` — webhooks API Banques
- [ ] `036_activity_log_and_consents.sql` — journal RGPD + consentements
- [ ] `037_syndic_archive.sql` — archivage syndic
- [ ] `038_aml_kyc_archive.sql` — archivage AML 5 ans
- [ ] `039_agency_mandates.sql` — mandats agence V1
- [ ] `040_valuation_signatures.sql` — signatures rapports eIDAS
- [ ] `041_pms_core.sql` — PMS V1 (properties, rate_plans, room_types)
- [ ] `042_pms_reservations.sql` — réservations + check-in/out
- [ ] `043_pms_operations.sql` — housekeeping, night audit
- [ ] `044_agency_crm.sql` — CRM contacts + tâches + mandats

### Round 5-6 (045–055)
- [ ] `045_agency_mandates_stages.sql` — enum 7 étapes mandats
- [ ] `046_agency_mandates_pipeline.sql` — diffusion portails + offres structurées
- [ ] `047_syndic_allocation_keys.sql` — clés répartition 8 modèles LU
- [ ] `048_pms_folios.sql` — folios client 19 catégories USALI
- [ ] `049_pms_external_calendars.sql` — import iCal OTA 8 sources
- [ ] `050_syndic_reminders.sql` — relances 3 paliers + intérêts 5,75%
- [ ] `051_agency_signatures.sql` — signature eIDAS simple + audit trail
- [ ] `052_syndic_portal_extended.sql` — RPC /mon-compte copropriétaire
- [ ] `053_syndic_portal_voting.sql` — vote AG via portail public
- [ ] **`054_create_org_rpc.sql`** — ⚠ **CRITIQUE** : fix RLS 42501 création organisation
- [ ] `055_pms_groups.sql` — allotements groupes mariages/séminaires/MICE

### Round 7 (056)
- [ ] `056_facturation_history.sql` — historique Factur-X 12 mois + fonction purge

## Hot fixes / migrations bloquantes

| Migration | Problème résolu | Symptôme avant |
|-----------|-----------------|----------------|
| `054_create_org_rpc.sql` | RLS error 42501 à la création d'organisation via `/mon-agence` | `new row violates row-level security policy for table "organizations"` |
| `056_facturation_history.sql` | Page `/facturation/historique` vide | Pas d'erreur UI, juste aucune facture listée |

## Fonctions SECURITY DEFINER à brancher sur cron

Certaines migrations créent des fonctions à appeler périodiquement.

| Fonction | Fichier | Fréquence | Cron endpoint |
|----------|---------|-----------|---------------|
| `purge_expired_factur_x_history()` | 056 | quotidien | `/api/cron/daily` (à ajouter) |
| `generate_charges_with_key()` | 047 | à la demande | RPC direct |
| `create_organization(...)` | 054 | à la demande | RPC direct via `lib/orgs.ts` |
| `suggest_org_slug(...)` | 054 | à la demande | RPC direct |

## Variables d'environnement requises

Pour que toutes les migrations fonctionnent en prod, s'assurer que Vercel a :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — requis pour cron + signatures + portails publics (tokens)
- `CRON_SECRET` — requis pour `/api/cron/daily`
- `PMS_ICAL_SHARE_SECRET` — pour flux iCal sortant par token public

## Rollback strategy

**Supabase ne fait PAS de rollback automatique.** Pour annuler une migration :

1. Identifier les objets créés (`create table`, `create policy`, `create function`, `alter table … add column`…)
2. Écrire un nouveau fichier `0XX_rollback_XXX.sql` avec les `drop` correspondants
3. Appliquer dans Dashboard → SQL Editor
4. Ne jamais supprimer le fichier de migration original — garder l'historique

En pratique, vu la structure des données prod, **on ne rollback pas** — on corrige avec une nouvelle migration forward-only.

## Conseils opérationnels

- **Toujours** appliquer en ordre croissant. Les dépendances entre migrations ne sont pas déclarées explicitement.
- **Toujours** copier-coller le fichier **entier** (pas sélection partielle — les `create policy` dépendent des `alter table … enable row level security`).
- **Tester en preview** (Supabase branch) avant prod si changement schéma non-trivial.
- **Sauvegarder** les données métier (coown, rental, mandates, pms) avant d'appliquer une migration qui modifie leur structure — rare mais déjà arrivé sur 024/030 corrigées par 024_fix.
- **Fin de migration** : vérifier que la RLS est activée sur toute nouvelle table user-facing. Une table sans RLS est accessible à tous les utilisateurs authentifiés.

## Ressources

- Supabase docs : https://supabase.com/docs/guides/database/managing-schemas
- Dashboard SQL Editor : https://supabase.com/dashboard/project/_/sql
- Fichier d'index des features : `docs/BENCHMARK_2026.md`
