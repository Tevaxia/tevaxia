# Stratégie 3 axes — devenir #1 LU sur PMS, Syndic, CRM

**Date :** 2026-04-18
**Horizon :** 12 mois (T2 2026 → T1 2027)
**Mode :** 3 verticaux en parallèle, mono-développeur (Erwan)

## Principe directeur

Nous **n'affrontons pas** Mews / Matera / Apimo sur leurs terrains globaux. Nous construisons **3 verticaux natifs LU** avec table stakes mondiaux + différenciateurs LU inattaquables (droit, fiscalité, langues, données publiques, compliance).

**Abandonné :** positionnement « ERP de l'immo LU » (trop large, trop long, pas défendable).
**Conservé :** positionnement « couche référentielle + régulatoire LU » sur les modules existants (ESG, évaluation, observatoires, AML/KYC) qui **alimentent** les 3 verticaux.

---

## Axe 1 — PMS hôtellerie

### État actuel
- `/pms` hub + `/pms/proprietes/nouveau` (wizard création)
- Ops adjacents déjà en place : `/hotellerie/housekeeping`, `/hotellerie/mice`, `/hotellerie/impayes`, `/hotellerie/dscr`, `/hotellerie/observatoire-lu`, `/hotellerie/compset`, `/hotellerie/score-e2`, `/hotellerie/revpar-comparison`
- Paiements : Stripe démo (prêt prod dès SARL-S enregistrée)

### Gap table stakes (doit avoir pour être pris au sérieux)
- [ ] Moteur de réservations : inventory jour-par-jour, rooming chart, folios multi-services
- [ ] Check-in / check-out workflow
- [ ] Night audit
- [ ] Rate plans + restrictions (MinLOS, CTA, closed-to-arrival, closed-to-departure)
- [ ] Groupes + allotements
- [ ] **Channel manager (blocker #1)** : Booking.com, Expedia, Airbnb, Hotelbeds
- [ ] POS restaurant/bar lié aux folios
- [ ] Self check-in mobile (QR key / envoi SMS-email)
- [ ] Card tokenization (déjà Stripe) + pré-autorisations
- [ ] Reporting : Manager Flash quotidien, USALI mensuel

### Blocker critique : channel manager
Sans channel manager, aucun hôtel n'adopte un PMS. 3 options :
1. **SiteMinder / Hotel-Spider middleware** (2–4 semaines, certification partenaire) ← **recommandé pour démarrer**
2. Direct Booking Connectivity Partner (BCP, ~3 mois de certification) + Expedia EQC + Airbnb API
3. Partenariat/acquisition channel manager LU existant

### Différenciateurs LU (inattaquables)
- [ ] TVA 3/8/17 % native + déclaration AED automatisée
- [ ] USALI multilingue FR/DE/EN/LB/PT (unique mondialement)
- [ ] Observatoire STATEC intégré dans le dashboard (déjà fait)
- [ ] Compset LU auto-alimenté (déjà fait)
- [ ] CRREM hôtel + E-2 score (déjà fait) — pas de PMS mondial n'a ça
- [ ] AML/KYC clients corporate (déjà fait)
- [ ] Statistiques STATEC obligatoires auto-remplies (nuitées, pays d'origine)
- [ ] Taxe de séjour commune LU auto-calculée

---

## Axe 2 — Syndic

### État actuel
- `/syndic` hub
- `/syndic/coproprietes` (gestion basique)
- `/syndic/procuration` (AG generator)
- `/syndic/benchmark` (benchmark entre copros — unique)

### Gap table stakes
- [ ] **Compta copropriété complète (blocker #1)**
  - Plan comptable normalisé copropriété
  - Budget prévisionnel + appels de fonds
  - Répartition charges (tantièmes, clés spéciales)
  - Annexes comptables réglementaires
  - Clôture d'exercice
  - Comptes bancaires séparés par syndicat (intégration PSD2 multi-comptes — infra déjà pour GL)
- [ ] Gestion AG complète : convocation → ODJ → procurations → vote (présentiel + électronique) → PV → exécution
- [ ] Portail copropriétaire self-service : consulter compte, télécharger PV/budget, voter en ligne
- [ ] OCR factures + workflow validation président/syndic
- [ ] Relances impayés auto (paliers, intérêts de retard, mise en demeure, recouvrement)
- [ ] Gestion technique : contrats maintenance, sinistres, interventions, devis
- [ ] Archivage documentaire (PV 10 ans, compta 10 ans)

### Blocker critique : compta copro
3–4 mois de dev sérieux. Pas de raccourci — c'est ce qui sépare un outil d'un wizard.

**Décision à prendre :** construction native ou intégration comptable tierce (BOB Software LU, Sage Luxembourg) ?
- **Recommandation :** construction native (défendabilité + contrôle UX) avec export format bancaire standard pour cabinets compta externes.

### Différenciateurs LU (inattaquables)
- [ ] Loi copropriété LU 1988 + amendements 2010 **native** (Matera/Immoware24 ne couvrent pas LU)
- [ ] Multilingue FR/DE/LB obligatoire (propriétaires âgés parlent LB)
- [ ] Benchmark inter-copros (déjà fait) — personne d'autre ne l'a
- [ ] Intégration notaires LU (acte + cession quote-part + syndicat informé automatiquement)
- [ ] Liaison directe CRREM/EPBD par copropriété (passeport rénovation obligatoire 2030)
- [ ] Klimabonus rénovation collectif : calcul + dossier auto-généré
- [ ] Intégration Mémorial A (veille légale copropriété)

---

## Axe 3 — CRM agence

### État actuel
- `/pro-agences` hub
- `/pro-agences/mandats` (stub pipeline)
- `/pro-agences/crm` + `/crm/contacts` + `/crm/tasks`
- `/pro-agences/fiche-bien` (générateur PDF)
- Rapprochement estimation + CRREM + observatoire déjà branchable

### Gap table stakes
- [ ] Pipeline mandats complet : étapes (prospection → mandat → diffusion → visite → offre → compromis → acte), commissions, co-mandats, historique
- [ ] **Sync portails immobiliers (blocker #1)** : athome.lu, Immotop.lu, Immoweb, atHomeFinance
- [ ] Matching automatique acquéreur ↔ bien (critères + scoring)
- [ ] Mailing acquéreurs + nurturing (séquences auto)
- [ ] **Signature électronique LuxTrust native** (Apimo utilise DocuSign, inadapté LU régulé)
- [ ] Mobile app agent terrain (visites, photos, bon de visite)
- [ ] Visite planning + compte-rendu + retour acquéreur
- [ ] Fiche bien PDF (déjà fait)
- [ ] Gestion documents : mandat, compromis, état des lieux, DPE/CPE

### Blocker critique : sync athome.lu
Sans `athome`, **aucune agence LU n'adopte**. 3 options :
1. **API partenaire athome** (business dev — à tenter cette semaine)
2. Flux XML / CSV import-export (minimum vital, déjà standard marché)
3. Scraping (légalement risqué, à éviter)

**Recommandation :** attaque XML tout de suite (marche pour tous les portails via formats standard type ImmoSWAP / XML immo-standard), et en parallèle contact business dev athome.

### Différenciateurs LU (inattaquables)
- [ ] **LuxTrust natif** pour signature mandat / compromis (pas DocuSign)
- [ ] AML/KYC CSSF intégré dans flux mandat (déjà fait)
- [ ] Estimation tevaxia + CRREM + ESG auto-insérés dans fiche bien (déjà partiel)
- [ ] Observatoire prix + frais Bëllegen Akt intégrés
- [ ] Multi-langue natif FR/DE/EN/LB/PT (déjà fait site)
- [ ] Enable Banking pour vérification solvabilité acquéreur (infra déjà PSD2)
- [ ] Calcul commissions automatique avec barème LU (pas forfait comme Apimo)

---

## Séquençage 12 mois

| Trimestre | PMS | Syndic | CRM |
|---|---|---|---|
| **T2 2026** (mai–juil) | Core réservations + rate plans + folios | Compta copro fondation (plan comptable + appels de fonds) | Pipeline mandats complet + import XML athome |
| **T3 2026** (août–oct) | **Channel manager (SiteMinder)** + night audit | Compta suite (répartition + annexes) + AG complet + portail copro | **Business dev athome** + matching auto + mailing |
| **T4 2026** (nov–janv) | POS + self check-in + USALI v2 | Portail copropriétaire self-service + OCR factures | LuxTrust signature + mobile app agent |
| **T1 2027** (fév–avr) | Polish + 2–3 hôtels pilote | Polish + 2–3 copros pilote | Polish + 3–5 agences pilote |

## Décisions ouvertes

- [ ] PMS channel manager : SiteMinder middleware vs direct BCP
- [ ] Syndic compta : construction native (recommandé) vs intégration BOB/Sage LU
- [ ] CRM athome : quand contacter business dev (parallèle au dev XML)

## Exécution par étapes

Le plan se déroule **en parallèle** sur les 3 axes, pas en séquentiel. Priorité d'attaque par ordre de la roadmap T2 2026 :

1. **Semaine en cours** — CRM : extension pipeline mandats complet (étapes, commissions, historique)
2. **Semaine suivante** — Syndic : plan comptable copropriété + appels de fonds
3. **Semaine d'après** — PMS : moteur réservations core (inventory + rooming + folios)

Puis on boucle en ajoutant une couche sur chaque axe chaque sprint.

## Mémoire projet

Cette stratégie est aussi reflétée dans l'auto-memory (`project_strategy_3_axes_2026.md`) pour être récupérée automatiquement dans toutes les futures sessions.

## Accompli 2026-04-18 (T2 → T4 en une session)

### CRM agence
- **T2** : Pipeline mandats étendu (prospect → mandat_signé → diffusé → en_visite → offre_reçue → sous_compromis → vendu). Tables diffusion portails (10 sources) + offres structurées (conditions suspensives, acceptation auto → sous_compromis). Export OpenImmo v1.2.7 + CSV portails LU.
- **T3** : Matching acquéreur ↔ mandat avec scoring /100 (budget 40 + surface 30 + zone 20 + type 10). Pages bidirectionnelles (liste acquéreurs pour un mandat + liste mandats pour un acquéreur).
- **T4** : Signature électronique eIDAS simple (règlement UE 910/2014). Page publique `/signer/[token]`, preuve IP + UA + hash SHA-256, workflow draft→sent→viewed→signed avec audit trail immuable.

### Syndic copropriété
- **T2** : Clés de répartition spéciales (8 modèles LU : chauffage, ascenseur, escaliers A/B, parking, espaces verts…). Budget détaillé par compte × nature × clé. Vue `budget_vs_actual` temps réel. RPC `generate_charges_with_key` remplace logique TS.
- **T3** : 5 annexes comptables PDF (état financier, compte gestion général/travaux, dettes/créances, détail dépenses). Loi 16.05.1975 + 10.06.1999.
- **T4** : Relances impayés 3 paliers (J+15/J+30/J+60) avec intérêts légaux LU 5,75 % (loi 18.04.2004). PDF lettre formelle + mention recommandé palier 3. Historique immutable > 24h pour preuve Juge de Paix. Portail copropriétaire `/mon-compte` étendu avec solde + relances reçues (transparence totale).

### PMS hôtellerie
- **T2** : Folios client in-house (19 catégories USALI) avec auto-posting nuits + taxe séjour au check-in. RPC `pms_settle_folio` → facture immuable TVA LU (3/17/0).
- **T3** : Import iCal (channel manager lite) — 8 sources OTA (Airbnb/Booking/VRBO/Expedia…). Parseur RFC 5545 maison. Upsert par UID + annulation auto quand UID disparaît.
- **T4** : Rapport USALI v11 mensuel (standard AHLA/HOTREC) avec KPIs Occupancy/ADR/RevPAR/TRevPAR + YoY + ventilation 4 buckets + PDF pro.

### Stats globales (commit 6e7b2f9)
- **10 commits** en une session
- **~15 000 lignes** ajoutées (TypeScript + SQL + PDF)
- **9 migrations** (045–052)
- **+122 tests** (678 → 800, tous passants)
- **Positionnement tenu** : 100% conforme spec LU (droit, fiscalité, langues, LuxTrust prep)

## Prochaines priorités (T5 candidates)

1. ~~**CRM Kanban drag-drop** pipeline mandats~~ — **✓ livré** (commit c110607)
2. ~~**Syndic AG en ligne** vote électronique~~ — **✓ livré** (commit 66e6dfa)
3. **PMS group bookings + extranet guest** — ouverture corporate
4. **LuxTrust real integration** — actes notariés (quand dev account ouvert)
5. **OCR factures syndic** — workflow fournisseur (OpenAI Vision ou Mistral)
6. **Global cross-module search** — recherche unifiée mandats/contacts/copros/hôtels

## Livraisons additionnelles post-T4 (même session 2026-04-18)

Session ultra-marathon — 21 commits au total dont 7 supplémentaires après la clôture T4 :

- **PMS Pickup report** (1040ad9) — RM metric ventilé par mois de séjour + canaux.
- **PMS Revenue forecast** (2a772a5) — projection OTB + pickup avec alertes J-2/J-7/J-14.
- **Syndic AG vote en ligne** (66e6dfa) — détail AG syndic + voting page public portal (migration 053).
- **CRM Kanban drag-drop** (c110607) — pipeline mandats avec HTML5 native drag-drop.
- **Syndic PV PDF** (d966478) — export procès-verbal depuis détail AG.
- **PMS Heatmap annuel** (66cc81f) — calendrier 365 jours colorés par occupancy.
- **CRM Commissions annuelles** (775b878) — reporting fiscal avec split co-mandat.
- **Dashboard actions prioritaires** (5d85218) — cross-modules CRM/Syndic/PMS.
- **CRM Performance agents** (235789c) — classement + podium commissions.
- **Portail AG link** (4f6d27d) — bouton direct vote AG dans portail copropriétaire.

**Stats finales session** : ~23 commits · ~20 000 lignes · 11 migrations · +190 tests.

### Extras round 3 (continuation)

- **PMS Front desk opérationnel** (c8f3804) — page print-friendly réception (arrivées/départs/in-house du jour).
- **Syndic Portefeuille consolidé** (4980251) — vue multi-copros triée par impayés pour syndic pro.

**Total session unique cumulé** : **~25 commits** · ~21 000 lignes · 11 migrations · +190 tests.

### Round 4 (continuation profite erreur RLS)

- **Recherche globale** (650c00c) — `/recherche` cross-entités avec API.
- **CRM email templates** (38f74ef) — 10 modèles email pré-rédigés.
- **Bon de visite PDF** (b7edefd) — document légal loi 1988 + log CRM.
- **Cron API quotidien** (045b7d4) — maintenance auto (no-shows, overdue, expired).
- **Vercel cron config** (b00813e) — schedule 02:00 UTC.
- **🐛 Fix RLS 42501 création org** (6926c87) — migration 054 RPC SECURITY DEFINER.
- **Syndic lettres types** (f677e89) — 10 modèles courrier opérations syndic.
- **CRM export CSV RGPD** (e499755) — bouton portability.
- **Syndic convocation PDF** (8028c78) — avant ouverture AG.
- **Syndic OwnerStatementPdf** (bf3a063 + f401dc6) — relevé compte copropriétaire avec export depuis portail.
- **CRM import CSV** (e074722) — mapping auto 17 alias + preview + validation RGPD.
- **PMS bulk rate editor** (079f85b + d987598) — 5 opérations sur périodes (+%, +€, set, stop sell, reopen).

**Total FINAL session** : **~49 commits** · ~28 000 lignes · **12 migrations** (045–054) · +220 tests · **854 tests** passent.

**Migration 054 à appliquer manuellement dans Supabase Dashboard SQL Editor** pour résoudre erreur RLS création organisation.

### Round 5 — UX unification benchmark concurrents mondiaux

Feedback utilisateur : outils syndic/PMS/CRM éparpillés, accès pas clair. Benchmark Matera / Immoware24 / Domus (syndic), Mews / Cloudbeds / OPERA / Apaleo (PMS), Apimo / HubSpot RE / Propertybase (CRM) et application des patterns UX standards.

- **Syndic sidebar copropriété** (764eb7d) — layout `/syndic/coproprietes/[id]/layout.tsx` + `CoproSidebar` 260px persistant avec 4 sections organisées (Général 3, Finance 6, AG 2, Travaux 1) + liens transverses (portefeuille, lettres types, benchmark, actions prioritaires). Mobile drawer bottom sheet.
- **PMS sidebar propriété** (8fb5155) — layout `/pms/[propertyId]/layout.tsx` + `PropertySidebar` 260px avec 6 sections × 17 items (Opérations jour, Réservations, Tarifs & distribution, Chambres & Setup, Facturation, Reporting). Toutes pages T2-T5 accessibles d'un clic.
- **CRM top nav** (8122c77) — layout `/pro-agences/crm/layout.tsx` + `CrmTopNav` sticky top 4 sections (Pipeline, Contacts, Outils, Reporting). Badge 🔔 Actions prioritaires accessible partout.
- **UX police + audit tailles minuscules** (b3cfb22) — retour utilisateur "pas facile à lire" : labels 12→14px, descriptions 10→12px, titres sections 9→12px bold, icônes 16→18px, padding items +50%. Audit global `text-[7/8/9px]` → `[9/10px]` sur heatmap, calendrier, str/forecast.

**Total FINAL session** : **~53 commits** · ~29 500 lignes · **12 migrations** (045–054) · +220 tests · **854 tests** passent · **3 layouts nav unifiés** conformes best practices mondiales.

### Round 6 — Post-application migrations (2026-04-19)

Utilisateur a appliqué les 10 migrations Supabase en prod. Session reprend sur les items T5-T6 pending.

- **PMS groupes & allotements** (d8d6540) — migration 055 + page `/pms/[id]/groupes` pour mariages/séminaires/MICE avec tarif négocié, cutoff alerts, billing 3 modes.
- **Onboarding wizard 3 personas** (10ceee3) — `/onboarding` guidé syndic/agence/hôtelier en 3 étapes (org + 1re entité) + roadmap personnalisée après.
- **CRM nurturing sequences** (2e8fb00) — 5 séquences drip campaign pré-définies (prospect silent 30j, post-visite, acquéreur actif, post-vente, mandat vendeur) créent N tâches rappel auto.
- **Syndic rapprochement bancaire CSV** (45d10ea) — upload relevé LU (BCEE/BIL/Spuerkeess/ING) + auto-matching transactions ↔ appels impayés via référence + montant + nom.
- **PMS POS restaurant/bar** (e399e94) — page kiosk tablette avec 19 items pré-configurés pour saisie rapide F&B/spa/parking sur folio client in-house.
- **Syndic SEPA pain.001 XML** (a4e7e4a) — génération fichier ISO 20022 pour virements bulk fournisseurs importable dans web banking LU + validation IBAN mod 97.
- **PMS événements LU calendar** (223c5b0 + 84ce0ab) — 14 événements récurrents (Schueberfouer, Alfi Conf, Foire Automne, Winterlights, etc.) intégrés au forecast avec multiplicateur impact.

**Total session cumulé (run 1 + run 2)** : **~60 commits** · ~33 000 lignes · **13 migrations** (045–055) · +295 tests · **916 tests** passent.

### Round 7 — Facturation, finitions et legal (2026-04-19)

Session longue (~14 commits) qui clôture les T5-T6 restants et lance le nouveau module Facturation électronique en V1.2 complet.

**Syndic** :
- **OCR factures 100% gratuit** (4bf93af) — lib `syndic-ocr-parser.ts` heuristique 14 champs (fournisseur, IBAN, BIC, TVA, montants, dates ISO) + page `/ocr-factures` avec PDF.js + Tesseract.js fallback, **traitement 100% navigateur**, zéro appel IA externe. 18 tests.
- **Rapprochement bancaire PSD2 live** (c747056) — intégration Enable Banking sur page `/rapprochement` : sélection banque LU/BE/FR/DE/NL, SCA LuxTrust, import transactions 90j max, auto-matching contre appels impayés (réutilise scoring existant).

**Hôtellerie** :
- **Workflow pré-acquisition hôtelière** (df70508) — `/hotellerie/pre-acquisition` ARGUS-killer : triangulation valorisation 3 méthodes (multiple EBITDA, prix/clé LU, DCF 5y + Gordon), DSCR + LTV, business plan 10 ans, exit value 5/7/10 ans, TRI equity + equity multiple, score go/no-go 0-100 avec 5 signals. Persistance localStorage. 15 tests unitaires.

**Facturation électronique V1 → V1.2** (nouveau module) :
- **V1 core** (0dcfeff) — lib `factur-x.ts` : XML CII D22B conforme EN 16931, 5 profils Factur-X, calculs totaux ventilés TVA, tables FR (20/10/5,5/2,1) + LU (17/14/8/3), validation 11 business rules, numérotation CGI. 42 tests. Landing `/facturation` 5 langues.
- **Pivot messaging honnête** (dedbfb7) — retire claims vaporware « agrément PDP en cours », repositionne en « outil de préparation, tu gardes la main sur ta PA ». Q5 FAQ explique pourquoi pas d'intégration API PAs directe.
- **V1.1** (d2062b8) — UI émission `/facturation/emission` avec formulaire complet + 6 templates métier + totaux live + validation EN 16931 avant génération + double-download PDF+XML. Lib `factur-x-pdf.ts` (pdf-lib) : rendu A4 + embed XML pièce jointe + métadonnées XMP Factur-X. API `POST /api/v1/facturation/generate` protégée par X-API-Key (pdf/xml/json). Hook `/gestion-locative/paiements` bouton Factur-X par ligne de loyer.
- **V1.2** (f78b385) — **migration 056** `factur_x_history` + RLS owner-only + fonction purge. Page `/facturation/historique` liste/re-download/édition/suppression. Hook auto : emission sauvegarde dans historique après génération réussie. Rétention 12 mois.

**Legal & UX** :
- **CGU complètes i18n 5 langues** (7762108) — 10 articles (objet, accès, tarifs, engagements, responsabilité, PI, RGPD, durée, modification, droit applicable). Page `/cgu` + lien footer.
- **Fix i18n 3 pages critiques** (0c461a8) — `/hotellerie/pre-acquisition`, `/actions-prioritaires`, `/api-docs` refactorés avec useTranslations. ~120 clés × 5 langues.
- **Copy `/syndic` moins racoleur** (4d46402) — « Pack syndic complet » → « Outils complémentaires ». Memory `feedback_tone_marketing` enregistrée.
- **Footer épuré** (2d5d4d1) — 6 colonnes → 4 (logo + légal + sources + contact), retire doublons du header.
- **MAJ confidentialité + mentions légales 5 langues** (2f2d4db) — 4 nouvelles catégories de données (B2B métier, PSD2, OCR, paiements), 2 sous-traitants ajoutés (Stripe IE, Enable Banking FI), obligations LU 10 ans compta et 5 ans AML, mention traitement client-side OCR + JWT RS256 PSD2.

**Total session cumulé (runs 1+2+3)** : **~74 commits** · ~37 500 lignes · **14 migrations** (045–056) · +310 tests · **991 tests** passent.

### Checklist migrations Supabase

- [x] 045-054 (appliquées round 5)
- [x] 055 pms_groups (appliquée round 6)
- [x] 056 facturation_history (appliquée round 7, 2026-04-19)

---

## État des blockers business (pas encore attaqués)

Ces 3 blockers décidés en début de stratégie restent ouverts et nécessitent action hors code.

### PMS — Channel manager réel (au-delà iCal lite)
- **Lite livré** : iCal import 8 sources OTA (Airbnb, Booking, VRBO, HomeAway, Expedia, Agoda, TripAdvisor, custom). One-way, 15 min–3h de latence selon portail.
- **Pro requis** : SiteMinder certification partenaire (2–4 semaines de dev + certification) OU direct Booking Connectivity Partner (3 mois).
- **Action** : contacter SiteMinder business dev quand prêt pour démo client.

### Syndic — Compta intégration bancaire PSD2 multi-comptes
- **Infra PSD2 existe** : Enable Banking sandbox déjà intégré côté Gestion Locative + syndic.
- **Reste à faire** : UI multi-comptes par copropriété (1 syndicat = 1 RIB séparé en LU) + rapprochement automatique factures fournisseurs + appels de fonds.
- **Action** : dev 2–3 semaines quand syndic pilote en place.

### CRM — API partenaire athome.lu
- **Fallback livré** : export OpenImmo v1.2.7 XML qui est reconnu par la plupart des portails européens (mais pas athome.lu natif).
- **Critique** : sans athome, aucune agence LU n'adopte. Si OpenImmo fonctionne côté athome (à tester), fin de l'histoire. Sinon : business dev athome pour API partenaire OU flux XML custom.
- **Action** : test OpenImmo côté athome + contact business dev athome en parallèle.

---

## Checklist migration manuelle Supabase

À appliquer dans **Supabase Dashboard → SQL Editor** dans l'ordre (copier-coller fichier entier) :

- [ ] `supabase/migrations/045_agency_mandates_stages.sql` — enum stages mandats
- [ ] `supabase/migrations/046_agency_mandates_pipeline.sql` — tables diffusion + offers
- [ ] `supabase/migrations/047_syndic_allocation_keys.sql` — clés répartition + budget lines
- [ ] `supabase/migrations/048_pms_folios.sql` — folios client
- [ ] `supabase/migrations/049_pms_external_calendars.sql` — iCal OTA import
- [ ] `supabase/migrations/050_syndic_reminders.sql` — relances 3 paliers
- [ ] `supabase/migrations/051_agency_signatures.sql` — eIDAS signatures
- [ ] `supabase/migrations/052_syndic_portal_extended.sql` — RPC mon compte
- [ ] `supabase/migrations/053_syndic_portal_voting.sql` — vote AG portail
- [ ] `supabase/migrations/054_create_org_rpc.sql` — fix RLS création org (**CRITIQUE, débloque UI Mon agence**)

Les migrations ne sont pas auto-déployées avec Vercel. Elles doivent être appliquées manuellement ou via `supabase db push` si CLI configuré.

---

## Config Vercel requise

- **CRON_SECRET** (string aléatoire 32+ chars) — requis pour `/api/cron/daily`.
- **PMS_ICAL_SHARE_SECRET** (déjà configuré probablement) — pour flux iCal sortant par token public.
- **SUPABASE_SERVICE_ROLE_KEY** (déjà configuré) — requis pour cron + signature + portail.

Activer Vercel Cron (Pro plan) : `vercel.json` livré avec schedule `0 2 * * *` → `/api/cron/daily`.

---

## Prochaines priorités (T5-T6 candidates restantes)

Après la méga-session, ces items sont encore ouverts :

1. **PMS group bookings + allotements** — événements, mariages, conférences (>10 chambres par commande groupée).
2. **PMS POS restaurant/bar** — intégration folio automatique (breakfast/lunch/dinner/bar/minibar direct sur folio du guest).
3. **LuxTrust qualified signature** — actes notariés + compromis, nécessite dev account LuxTrust approuvé (business dev).
4. **OCR factures syndic** — upload PDF facture fournisseur → extraction montant + TVA + IBAN auto via OpenAI Vision / Mistral Pixtral / Claude Vision.
5. **Syndic banking reconciliation PSD2** — import transactions via Enable Banking et matching automatique avec appels de fonds (réf de paiement unique).
6. **PMS Revenue forecast v2** — intégration événements LU (Bouneweger Mess, Foire de Luxembourg, Kirchberg congrès) pour ajuster pickup attendu.
7. **CRM nurturing email drip** — séquences auto 3 emails J+7/J+30/J+90 pour prospects silencieux.
8. **Syndic convocation multi-format** — envoi email groupé des convocations AG avec PDF joint + lien portail personnalisé par copropriétaire.
9. **Onboarding wizard** — tour guidé nouveau syndic / agence / hôtelier pour configurer rapidement 1ère copro/mandat/hôtel.
10. **Mentions légales + CGU tevaxia** — finaliser pages `/confidentialite`, `/mentions-legales` avec références eIDAS / RGPD / CSSF explicites.

---

## Décisions structurantes à prendre en 2026

### 1. Hébergement Supabase : payant vs self-hosted
- **Actuel** : Supabase Cloud plan gratuit / Pro €25/mois.
- **Échelle** : RLS policies + triggers + RPC rapidement limités si > 500 coproprietes ou > 10 000 mandats.
- **Option** : self-host Supabase sur Hetzner (€20/mois) ou Scaleway LU.
- **Recommandation** : rester Cloud tant que < 5 clients pilote, migrer self-host LU à l'approche GDPR-plus stricte (données locales).

### 2. Stockage PDF : Supabase Storage vs S3 LU
- **Actuel** : documents générés côté client (PDF blob → download), non stockés.
- **Besoin futur** : archivage réglementaire (PV AG 10 ans, factures LU 10 ans, KYC 5 ans).
- **Recommandation** : Supabase Storage bucket dédié + durée de rétention via cron auto-delete, ou S3 Scaleway LU (meilleure conformité résidence données LU).

### 3. Channel manager : build vs buy
- Build SiteMinder partner integration (2–4 semaines) vs acquisition d'un channel manager LU existant (~€50k).
- Build-first recommandé, acquisition seulement si gros client pilote l'exige.

### 4. LuxTrust : dev account officiel
- Compte dev LuxTrust gratuit pour POC, production payante ~€500/mois + certificats.
- Valeur livrée : signatures qualifiées pour compromis de vente (pas juste simple eIDAS).
- Recommandation : demander dev account dès Q3 2026, activer prod dès 1er client payant.

---

## Références externes utilisées

### Standards techniques
- **USALI v11** — Uniform System of Accounts for the Lodging Industry (AHLA, HOTREC)
- **OpenImmo v1.2.7** — standard européen XML immobilier
- **iCal RFC 5545** — format calendriers
- **ISO 20022 pain.001** — virements SEPA (non implémenté encore)
- **eIDAS UE 910/2014** — signature électronique
- **CRREM v3.0 (2024)** — courbes décarbonation
- **EU Taxonomy 2020/852** — Climate Delegated Act
- **SFDR 2019/2088** — reporting ESG financier
- **EPBD IV 2024** — performance énergétique bâtiments

### Lois LU référencées dans le code
- Loi 16.05.1975 — statut copropriété
- Loi 10.06.1999 — fonds travaux obligatoire
- Loi 28.12.1988 — professions immobilières (règlement 04.07.2000 mandats)
- Loi 18.04.2004 — taux intérêt légal (5,75 % en 2026)
- Loi 12.02.1979 — TVA (hébergement 3 %, F&B 17 %, taxe séjour art. 44)
- Règlement grand-ducal 24.03.2023 — facturation électronique
- Règlement grand-ducal 23.07.2016 — nZEB LU
- Loi 31.05.1999 — fiche police (hôtellerie)
- Règlement 17.06.2011 — police des étrangers

### Concurrents benchmarkés
- **Syndic** : Matera (FR), Immoware24 (DE), Domus, Syndic One
- **PMS** : Mews, Cloudbeds, Oracle OPERA, Apaleo, protel, StayNTouch
- **CRM agence** : Apimo (dominant FR), HubSpot real estate, Propertybase, Follow Up Boss, Hektor
- **Rate shopping** : SiteMinder, Duetto, Lighthouse
- **Channel manager** : SiteMinder (recommandé), Hotel-Spider, Cubilis

---

## Positionnement cible 12 mois

**"La plateforme référence immobilière luxembourgeoise"**

3 verticaux opérationnels + couche référentielle commune (ESG, observatoires, AML/KYC, évaluation) qui alimente les 3. Inattaquable localement grâce à la conformité LU extrême (droit, fiscalité, langues LB native, LuxTrust, PSD2 LU, compliance CSSF).

Pas de concurrent direct multi-vertical au LU. Matera ne fait que syndic. Apimo ne fait que CRM. Mews ne fait que PMS. **tevaxia = les 3 + le référentiel LU.**

Cible commerciale T1 2027 : 2 hôtels + 2 copros + 3 agences pilotes en production payante. Validation positionnement avant scale-up T2 2027+.

---

## Rituels de maintenance

### Quotidien (automatisé via `/api/cron/daily` à 02:00 UTC)
- Mark no-shows PMS (check_in < hier)
- Mark overdue syndic (due_date + 15j)
- Expire mandats CRM (end_date < today)
- Expire signatures eIDAS (expires_at < now)

### Hebdomadaire (manuel, lundi matin)
- `/actions-prioritaires` : parcourir alertes cross-modules
- `/syndic/portefeuille` : prioriser recouvrement par impayés
- Sync iCal OTA manuelle si agence n'a pas automatisé

### Mensuel
- Clôture night audit mensuel + USALI monthly PDF
- Export CSV contacts CRM pour backup local
- Review pickup / forecast PMS pour ajuster rate plans

### Trimestriel / annuel
- Annexes comptables AG (annuel)
- PV AG (post-AG)
- Convocations AG (15j avant AG)
- Appels de fonds trimestriels syndic

---

## Contact / debug

- **Repo** : https://github.com/Tevaxia/tevaxia
- **Prod** : https://www.tevaxia.lu (Vercel auto-deploy sur push master)
- **Supabase** : Dashboard SQL Editor pour migrations
- **Erreurs connues** :
  - Si "new row violates RLS policy for organizations" : appliquer migration 054.
  - Si cookie session absent en preview Vercel : domain `.tevaxia.lu` configuré dans `lib/supabase.ts`, les preview deploys ne reçoivent pas le cookie.
  - Si Supabase RPC not found : migrations 045–056 non appliquées en prod.
  - Si `/facturation/historique` affiche vide malgré factures générées : vérifier que migration 056 est appliquée.

---

**Fin du document.** Dernière mise à jour : 2026-04-19, commit `f78b385`.

