# Facturation électronique tevaxia — plan technique & roadmap

**Créé** : 2026-04-19
**Dernière mise à jour** : 2026-04-19 (V1.2 livrée)

## Contexte marché

### Réforme e-invoicing France

- **Base légale** : Art. 289 bis CGI + Ordonnance 2021-1190 + Directive UE 2014/55 + UE 2020/4
- **Norme** : EN 16931 (CII D22B ou UBL 2.1)
- **Format dominant FR** : Factur-X v1.0.07 (PDF/A-3 + XML CII embarqué)
- **Dates clés** :
  - **01/09/2026** : réception obligatoire pour **toutes** les entreprises
  - **01/09/2026** : émission obligatoire GE + ETI
  - **01/09/2027** : émission obligatoire PME + TPE
- **Architecture** : PPF (Portail Public de Facturation, gratuit, tronc commun) + PDP (Plateformes Dématérialisation Partenaires, agréées DGFiP)
- **Archivage** : 10 ans obligatoire, art. L102 B LPF

### Luxembourg

- **Règlement** : grand-ducal 22.12.2006 (amendé 2023) — facturation électronique
- **Peppol BIS Billing 3.0** obligatoire pour flux B2G depuis 2022
- **B2B** : pas d'obligation à ce jour, discussions en cours pour alignement avec tendance UE
- **Archivage** : 10 ans art. 65 §1 Loi TVA + art. 11 Code commerce

## Positionnement tevaxia

### Ce qu'on est

**Opérateur de dématérialisation (OD)** — terme non réglementé, usage libre. Nous générons des Factur-X conformes EN 16931.

### Ce qu'on n'est PAS (et c'est délibéré)

- **Pas une PDP agréée DGFiP**. Les travaux d'agrément demanderaient 6-12 mois, capital significatif, ISO 27001, audit AFNOR. Pas dans les moyens actuels.
- **Pas un service de transit PPF**. L'utilisateur injecte lui-même le fichier dans sa PA ou dans le PPF.
- **Pas un connecteur API multi-PA**. Chaque API PA change tous les 6 mois et chaque partenariat coûte cher à maintenir. Préférence pour le fichier standardisé + liberté utilisateur.

### Différenciateur

**Templates métier immobilier** + **TVA LU + FR natives** + **intégration modules tevaxia** (gestion locative, syndic, PMS, bail commercial, expertise) + **freemium 5 factures/mois**.

Aucun concurrent FR / LU ne combine ces 4 axes.

## Architecture technique V1

### Stack

| Couche | Choix | Raison |
|--------|-------|--------|
| XML CII generation | Pure TypeScript custom (`factur-x.ts`) | Pas de dépendance lourde, contrôle total sur le XML |
| PDF rendering | `pdf-lib` (1.17) | Pure JS, client + serveur, embed file attachment natif |
| Validation | Business rules EN 16931 codées à la main | Pas de dep XSD runtime |
| Storage | Supabase (historique) + localStorage (draft) | Cohérent avec le reste du stack tevaxia |
| i18n | next-intl | Pattern établi |

### Modules livrés V1.0 → V1.2

```
src/lib/facturation/
  factur-x.ts          # Core : types, XML CII, validation, totaux, formatage numéro
  factur-x-pdf.ts      # PDF/A-3 avec XML embarqué via pdf-lib
  history.ts           # CRUD Supabase factur_x_history

src/app/facturation/
  page.tsx             # Landing (positionnement, pricing, FAQ)
  emission/page.tsx    # Formulaire émission 6 templates
  historique/page.tsx  # Historique 12 mois (Essentiel+)

src/app/api/v1/facturation/
  generate/route.ts    # API POST Factur-X (plan Pro)

src/app/gestion-locative/lot/[id]/paiements/
  page.tsx             # Hook « Factur-X » par ligne de loyer

supabase/migrations/
  056_facturation_history.sql
```

### Profils Factur-X supportés

La V1 cible le profil **BASIC** (couvre >95% des cas immobilier FR/LU). Les 5 profils sont implémentés dans `factur-x.ts` :

| Profil | Niveau | Usage |
|--------|--------|-------|
| MINIMUM | 8 champs seulement | PPF obligatoire minimum |
| BASIC WL | Entête sans lignes détaillées | Factures simples |
| **BASIC** | Lignes détaillées | **Usage typique FR/LU (par défaut)** |
| EN 16931 | = COMFORT, complet | Flux B2B européen étendu |
| EXTENDED | Hors EN 16931 | Flux métier spécifiques |

### Validation business rules EN 16931

11 règles implémentées, à étendre V1.3 :
- BR-02 : numéro facture obligatoire
- BR-03 : date émission format YYYY-MM-DD
- BR-04 : type document présent
- BR-05 : code devise ISO 4217
- BR-06 : nom vendeur
- BR-07 : nom acheteur
- BR-08 : code pays vendeur ISO alpha-2
- BR-11 : code pays acheteur ISO alpha-2
- BR-16 : au moins une ligne
- BR-21 : libellé ligne obligatoire
- BR-22 : quantité > 0
- BR-27 : prix unitaire >= 0
- BR-CO-17 : taux TVA [0, 100]

### Templates métier

Chaque template pré-remplit la structure lignes + notes + TVA par défaut :

| Template | TVA défaut | Notes défaut | Unit code |
|----------|-----------|--------------|-----------|
| Générique | TVA S 20% (FR) | — | C62 |
| Bailleur / SCI | **Exempt E 0%** | « Loyer d'habitation — exempt TVA art. 261 D CGI » | MON (month) |
| Syndic copro | Exempt E 0% | « Charges copropriété — tantièmes appliqués » | C62 |
| Hôtel LU | **S 3% nuitée + 17% F&B** | « TVA LU 3% hébergement (art. 39 L. TVA) » | DAY / C62 |
| Bail commercial | S 20% | « Bail commercial — indexation ILAT (INSEE) » | 3MO (trimestre) |
| Expert | S 20% | « Honoraires expertise TEGOVA REV/TRV » | C62 |

## Roadmap

### V1.3 — conformité PDF/A-3B stricte (prévue)

**Problème** : la V1.2 produit un PDF/A-like avec XML embarqué — suffisant pour être accepté par les PA courantes (Pennylane, Sellsy, Chorus Pro), mais pas strictement PDF/A-3B validé par veraPDF.

**Solution** :
- Embarquer un ICC color profile (sRGB v2)
- Générer un OutputIntent complet
- Référencer le XMP dans le catalog via `Metadata` + `Lang` + `MarkInfo`
- Tester avec veraPDF (library open source ou Docker container)

**Effort** : 3-5 jours. Besoin de packager un ICC profile (~500 KB) avec l'app.

### V1.4 — hook syndic (prévue)

Page `/syndic/coproprietes/[id]/appels/[id]/factur-x` qui :
- Prend un appel de fonds groupé
- Génère N Factur-X (une par copropriétaire)
- Lignes pré-remplies selon tantièmes et budget annuel
- Export ZIP ou API batch
- TVA exempt (copropriété n'est pas assujettie)

### V1.5 — hook PMS (prévue)

Page `/pms/[propertyId]/reservations/[id]/factur-x` qui :
- Prend une réservation au check-out
- Génère Factur-X avec nuits TVA 3% + F&B 17% + taxe séjour (hors TVA)
- IBAN hôtel + BIC auto
- Si client corporate a une PA, transmission directe (V2)

### V2 — connecteur PDP partenaire

Le goulot actuel : l'utilisateur télécharge le fichier et l'injecte dans sa PA manuellement. Solution V2 : signer un partenariat avec **une PDP agréée** (candidats : Docaposte, Sellsy PDP, Tenor, Esker) pour un POST webhook automatisé.

**Architecture cible** :
```
tevaxia emission → si utilisateur plan Pro a connecté sa PDP partenaire
                 → POST Factur-X au endpoint PDP via OAuth2 client credentials
                 → PDP transmet au PPF ou au destinataire
                 → Webhook callback PDP → tevaxia update statut (sent/delivered/bounced)
```

**Effort** : 2-4 semaines dev + semaines business pour signer partenariat + NDA + tests.

### V2.1 — Peppol BIS Billing 3.0 pour LU B2G

- Transformation XML CII → UBL 2.1 (format Peppol natif)
- Intégration avec Access Point Peppol (via Storecove, Pagero ou similaire — ~€50/mois)
- Utile pour clients LU facturant l'État / communes

**Effort** : 2 semaines. Peppol est plus simple que PPF côté transit.

### V3 — agrément PDP DGFiP

**Non prioritaire tant que tevaxia n'est pas une entité juridique sérieuse avec capital et assurance pro.**

Chemin :
1. Immatriculation entité FR (SAS minimum, pas SARL-S LU directement éligible)
2. Capital social ≥ €100k dédié
3. ISO 27001 certification (~9 mois, ~€30k audit)
4. Homologation technique DGFiP (tests PPF sandbox)
5. Contrat d'adhésion + publication au registre officiel

**Délai réaliste** : 12-18 mois + ~€150k all-in.

## Décisions techniques à documenter

### Pourquoi pas un connecteur API Pennylane / Qonto / Dougs / Tiime ?

Discussion avec l'utilisateur 2026-04-19 :

1. **Chaque API change tous les 6 mois** → dette technique permanente pour 0 valeur ajoutée.
2. **Chaque partenariat = contrat commercial** (access fees, minimum engagement, clauses d'exclusivité).
3. **Dilution de dépendance = mythe** : passer de 1 à 5 dépendances ne protège pas, ça multiplie les risques de casse.
4. **Valeur utilisateur** : ce qui compte c'est le fichier conforme qu'il peut utiliser partout. Son autonomie est supérieure à notre « router ».

Exception : si un utilisateur plan Pro demande explicitement une intégration et paie, on code l'adapteur spécifique. Pas avant.

### Pourquoi pas d'archivage légal 10 ans ?

- **Obligation légale** : 10 ans art. L102 B LPF (FR) ou art. 65 §1 Loi TVA (LU)
- **Notre choix** : 12 mois Supabase (plan Essentiel+) pour faciliter la ré-émission / recherche
- **Responsabilité utilisateur** : archiver ses PDF sur son support propre (Google Drive, NAS, Storage tier archive)
- **Raison** : un archivage probatoire 10 ans nécessite :
  - Infrastructure cold storage (coût)
  - Horodatage qualifié eIDAS
  - Scellement cryptographique ou coffre-fort numérique certifié NF Z42-013
  - Responsabilité juridique significative

Livraison future V3+ : partenariat coffre-fort numérique type **Docaposte Digikeeper** ou **Primobox** pour les utilisateurs Pro qui le demandent.

### Pourquoi client-side pour la génération ?

- **Confidentialité** : les données de facture (montants, clients, TVA) ne transitent pas par nos serveurs. Argument RGPD fort.
- **Coût serveur** : 0. Gratuit à l'échelle de 10 000 utilisateurs Free.
- **Performance** : génération <500ms, pas de round-trip réseau.
- **Offline** : marche même sans connexion (utile terrain).

Limite : si besoin future de signer cryptographiquement côté serveur (cachet eIDAS qualifié), il faudra basculer la génération serveur-side ou ajouter une signature post-génération.

## Monitoring & observabilité

À ajouter progressivement :

- [ ] PostHog event `facturation_generated` (count, template, VAT rate, seller country)
- [ ] Alerte Sentry si `generateFacturXPdf()` throw (diagnostic stack trace pdf-lib)
- [ ] Compteur mensuel de Factur-X générées par user (pour enforcement plan Free 5/mois)
- [ ] Graphique adoption template (via PostHog) pour prioriser V1.4/V1.5

## Références normatives

- EN 16931-1:2017 — Semantic data model
- EN 16931-2:2017 — List of syntaxes
- CEN/TS 16931-3-2:2017 — UBL syntax binding
- CEN/TS 16931-3-3:2017 — UN/CEFACT CII syntax binding
- ISO 32000-1:2008 — PDF 1.7
- ISO 19005-3:2012 — PDF/A-3
- Factur-X Technical Specification v1.0.07 — FNFE-MPE (août 2024)
- Peppol BIS Billing 3.0 — OpenPeppol 2024
- RFC 20 — UN/ECE Unit codes

## Sources utiles dev

- XSD EN 16931 officiel : https://github.com/ConnectingEurope/eInvoicing-EN16931
- Validation service veraPDF : https://docs.verapdf.org/
- FNFE-MPE (France France Facture) : https://fnfe-mpe.org/factur-x/
- PPF sandbox DGFiP : https://portail-de-facturation.cloud.impots.gouv.fr
- Peppol directory : https://directory.peppol.eu
