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

1. **CRM Kanban drag-drop** pipeline mandats — visuel agence
2. **Syndic AG en ligne** vote électronique — différenciateur Matera
3. **PMS group bookings + extranet guest** — ouverture corporate
4. **LuxTrust real integration** — actes notariés (quand dev account ouvert)
5. **OCR factures syndic** — workflow fournisseur (OpenAI Vision ou Mistral)
