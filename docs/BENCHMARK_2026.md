# Benchmark international tevaxia.lu — avril 2026

**Objectif** : pour chaque module en ligne sur tevaxia.lu, identifier les leaders internationaux/régionaux, les fonctionnalités qu'ils offrent et qu'on n'a pas, les pistes d'amélioration classées par horizon (court : 1-4 semaines / moyen : 1-3 mois / long : 3-12 mois).

**Méthode** : analyse des 7 familles métier (particulier, investisseur, promoteur, agent, banque, syndic, hôtellerie) + modules transverses (énergie, données, compte utilisateur, STR/Airbnb). Sources benchmarks : sites officiels, études sectorielles publiques, revues professionnelles (Urban Land Institute, RICS, TEGOVA, STR Global / CoStar, HOTREC, HVS, STR Benchmark, hoteltechreport.com, StaySTRA, Hotel Tech Report).

---

## 🆕 Résumé exécutif de l'actualisation avril 2026

**Focus de cette révision** : gestion copropriété/syndic, gestion locative, hôtellerie + nouveau vertical **Short-Term Rentals (Airbnb/motels/saisonnier)** absent de la version précédente.

**Grandes tendances 2026 à intégrer** :

1. **IA « Agentic »** dans revenue management hôtel : les RMS (Duetto, IDeaS) ne recommandent plus, ils **agissent** sur pricing + distribution + housekeeping (+7-20% RevPAR rapporté). Implication : notre Challenger EVS / forecast ML doivent évoluer vers des recommandations exécutables.
2. **Réforme copropriété LU en cours** : projet de loi 7763 (fonds de travaux obligatoire + modernisation 1975) devait aboutir fin 2025 / début 2026. Impact direct sur `/syndic/coproprietes` : ajouter le fonds de travaux et sa capitalisation minimale légale.
3. **Règlement EU Short-Term Rentals** (entrée vigueur mi-2026) : registre unique européen pour Airbnb/Booking, transmission obligatoire aux communes, seuil 3 mois/an LU pour licence d'hébergement. Marché blanc pour un outil conformité STR Luxembourg.
4. **Dynamic pricing consolidation** : PriceLabs (150+ PMS intégrés, $19.99/listing/mois), Wheelhouse (+40% revenu rapporté), Beyond Pricing (1-1.25% CA). Hospitable bundle dynamic pricing free dans tous les plans payants — le pricing IA devient commodité PMS.
5. **Syndic LU toujours marché vierge** face aux leaders FR : Matera (170€/lot/an, 40k copros FR, 4.3/5), Cotoit (pro en ligne avec suivi travaux), Manda (149-240€/lot), Homeland (195€/lot mais 2.2/5 = opportunité de mieux faire).

**Priorités nouvelles identifiées** (détail dans sections ci-dessous) :
- 🔴 Créer un **module STR/Airbnb complet** (`/str/*`) : rentabilité, compliance 3 mois LU, arbitrage long vs court terme
- 🟠 Enrichir `/syndic` avec **fonds de travaux** (projet 7763), **portail copropriétaire** restreint, **module travaux** complet
- 🟠 Enrichir `/gestion-locative` avec **état des lieux mobile PWA**, **portail locataire**, **reconciliation bancaire**, **gestion locative sociale** (AIS LU, 75% abattement)
- 🟡 Ajouter à `/hotellerie` : **channel manager lite**, **guest journey mobile**, **yield alerts agentic**

---

## 1. Estimation instantanée (`/estimation`)

**Usage** : particulier qui veut savoir combien vaut un bien en 30 secondes.

**Benchmarks** :
- Meilleurs Agents (FR), SeLoger Estimation (FR), immoscout24.de, Zillow Zestimate (US), Rightmove (UK), Athome.lu/AthomeEstimates
- APIs : Hometrack (UK), PriceHubble (CH), Quantarium (US), Casafari (EU)

**Ce qu'on a** : prix/m² par commune + 100 communes LU, 8 ajustements (surface/étage/état/exterieur/parking/classe énergie/neuf/chambres), fourchette basse/centrale/haute, indice de confiance, comparables synthétiques, graphique évolution commune.

**Gaps identifiés** :
- Pas de **photo-analyse** (Zillow/PriceHubble analysent les photos pour un ajustement qualité/rénovation)
- Pas d'**IA générative** pour décrire le bien et justifier l'estimation en langage naturel
- Pas de **ingestion d'annonces live** (Athome, atHome Pro, Immotop) pour des comparables réels et datés
- Pas de **AVM signé** (Automated Valuation Model certifié EN 17503 / RICS AVM Executive) exploitable par les banques
- Pas d'**historique des estimations** d'un bien (track changes sur l'adresse au cours du temps)

**Pistes d'amélioration** :
- **Court** : intégrer un champ adresse structuré (Geoportail address API) pour une précision cadastre-level et sauver l'historique des estimations par adresse.
- **Moyen** : scraper légal des annonces Athome/atHome Pro avec mention de la source pour afficher 5-10 comparables réels et datés.
- **Long** : certifier le modèle en RICS AVM Executive (rapport de performance, MAPE, PE10/20 publics) et publier un livre blanc méthodologique — ouvre la porte B2B banques.

---

## 2. Valorisation TEGOVA EVS 2025 (`/valorisation`)

**Usage** : évaluateur agréé ou expert judiciaire produisant un rapport conforme EVS.

**Benchmarks** :
- Argus Enterprise (Altus), Cougar (RICS UK), Arcstream (EU commerciale), WEKA (DE, logiciels droit)
- SaaS expert : Immodat (DE), Sprengnetter (DE), Oovi (BE)

**Ce qu'on a** : 8 approches (comparaison, capitalisation, DCF, MLV/CRR, résiduelle énergétique, terme-reversion, ESG, réconciliation), données STATEC live (Euribor, taux hypothécaires, OAT 10Y, indice construction), 11 sections rapport EVS, export PDF + DOCX, profil évaluateur (logo, qualifications).

**Gaps identifiés** :
- ~~Pas de **mode « inspection terrain »**~~ → ✅ `/inspection` — checklist TEGOVA 41 points, offline localStorage (`31339f5`)
- Pas de **templates rapport multiples** (version bancaire courte / judiciaire longue / assurance / succession)
- Pas d'**audit trail signé** (timestamp numérique, horodatage qualifié eIDAS) — important pour opposabilité
- Pas de **version server-side** du rapport (uniquement génération client) → pas de partage direct par URL
- Pas d'**intégration signature électronique** (DocuSign, Yousign, Universign)

**Pistes d'amélioration** :
- **Court** : ajouter 3 templates PDF (bancaire/judiciaire/succession) sélectionnables au moment de l'export.
- **Moyen** : intégrer un horodatage eIDAS via LuxTrust ou un prestataire QTSP, ajouter un QR code de vérification sur le PDF.
- **Long** : inspection mobile PWA avec collecte photo/geotag/notes, synchronisée au dossier d'évaluation. PoC Flutter ou Capacitor.

---

## 3. Valorisation hédonique (`/hedonique`)

**Usage** : comprendre pédagogiquement comment un bien est évalué via coefficients statistiques.

**Benchmarks** : peu d'équivalents publics — la plupart des modèles hédoniques sont propriétaires (Hometrack, PriceHubble) ou académiques (Observatoire de l'Habitat LU).

**Ce qu'on a** : 14 coefficients calibrés sur le marché LU (surface, étage, état, énergie, parking, extérieur), avec sources citées (Observatoire, Spuerkeess, transactions).

**Gaps identifiés** :
- ~~Pas de **calibration temporelle**~~ → ✅ Recalibration Q1 2026 + page `/transparence` avec MAPE/R² publics (`8e07b59`)
- Pas d'**IC (intervalle de confiance)** sur chaque coefficient
- Pas de **comparaison visuelle** avec d'autres modèles (DEA, machine learning)

**Pistes d'amélioration** :
- **Court** : ajouter date de dernière calibration et rappeler la période couverte.
- **Moyen** : re-calibrer annuellement sur les dernières données Observatoire, afficher un graphique « évolution du coefficient X au fil des ans ».
- **Long** : PoC ML (gradient boosting type XGBoost) sur données publiques, positionner en « alternative transparente aux AVM propriétaires ».

---

## 4. Bilan promoteur (`/bilan-promoteur`)

**Usage** : promoteur ou marchand de biens évaluant la faisabilité d'une opération VEFA.

**Benchmarks** :
- Argus Developer (Altus) — leader mondial, abonnement €10k+/an
- Northspyre (US), Aprao (UK), Witco (FR), Kypso (FR), FinéAnce (FR)

**Ce qu'on a** : recettes (logements + parkings), coûts (terrain + construction + honoraires + aléas), frais (commerciaux, financiers, assurances, gestion), trésorerie quart par trimestre (24 mois, 8 Q), VEFA schedule, pré-commercialisation, partage public no-login.

**Gaps identifiés** :
- Pas de **scénarios multiples** (baseline/optimistic/pessimistic) côte-à-côte
- Pas de **simulation sensibilité** (tornado chart : quelle variable impacte le plus la marge)
- Pas d'**intégration cadastre** pour pré-remplir la surface terrain
- Pas de **multi-lots** (un projet peut avoir plusieurs tranches)
- Pas de **suivi d'exécution** (bilan prévisionnel → bilan réel, comparaison)

**Pistes d'amélioration** :
- **Court** : ajouter un bouton « Dupliquer en scénario » permettant de comparer 2-3 scénarios côte-à-côte.
- **Moyen** : tornado chart (sensitivity analysis) sur 10 variables clés affichant l'impact absolu sur la marge.
- **Long** : mode « suivi projet » avec saisie progressive des coûts réels mois par mois, dashboard écart prévu/réel.

---

## 5. DCF multi-locataires (`/dcf-multi`)

**Usage** : fonds/investisseur valorisant un immeuble commercial multi-tenants.

**Benchmarks** :
- Argus Enterprise (leader), Proformula (FR), Forbury (UK/AU), Cred-Pro (US)

**Ce qu'on a** : N baux, projection sur 10 ans avec indexation, franchise, break options, probabilité de renouvellement, NOI actualisé, valeur terminale, TRI levered/unlevered, CAPEX, WAULT, potentiel reversion.

**Gaps identifiés** :
- Pas de **courbe de liquidité** (quand le cash est dispo pour distribution)
- Pas de **stress tests** intégrés (scénario occupation -20%, taux +200bp)
- Pas de **lease-by-lease projection view** (tableau mois par mois visible)
- Pas d'**import CSV** pour des portefeuilles à 50+ baux
- Pas de **cap rate analysis** (graphique : valeur selon taux de sortie 4% / 5% / 6% / 7%)

**Pistes d'amélioration** :
- **Court** : ajouter un graphique sensibilité cap rate terminal et taux d'actualisation.
- **Moyen** : boutons « Stress test occupation / ADR / taux » pré-configurés qui lancent 3 scénarios et affichent le diff.
- **Long** : import CSV (Excel template à télécharger), vue mensuelle détaillée, export rapport investisseur PDF propre.

---

## 6. Frais d'acquisition (`/frais-acquisition`)

**Usage** : particulier ou agence calculant les frais pour un achat LU.

**Benchmarks** :
- Calcul-Impôt.lu, Spuerkeess simulateur, BIL, BGL BNP (tous limités), Athome calculateur
- Hors LU : Meilleurs Agents frais, Immobilien.de Kaufnebenkosten

**Ce qu'on a** : droits d'enregistrement (7%/3,5% temporaire), crédit Bëllegen Akt, TVA 3%/17%, émoluments notaire (barème), frais hypothécaires. Couvre neuf/existant, RP/non-RP, 1/2 acquéreurs.

**Gaps identifiés** :
- Pas de **cas non-résidents** (frontaliers FR/BE/DE achetant au LU) — règles fiscales différentes
- Pas de **cas d'achat en société** (SCI, SARL-S, structure holding) — retenue de source, IR des associés
- Pas de **frais annexes** : architectes, géomètre, diagnostic, déménagement
- Pas d'**export PDF branded** pour les agences

**Pistes d'amélioration** :
- **Court** : case à cocher « non-résident » modifiant les abattements et déclenchant un disclaimer.
- **Moyen** : mode « achat en société » avec retenue à la source estimée.
- **Long** : intégrer les frais annexes optionnels et générer un « budget total projet » complet.

---

## 7. Plus-values (`/plus-values`)

**Usage** : vendeur anticipant l'impôt sur la plus-value.

**Benchmarks** :
- Spuerkeess, BGL BNP, Guichet.lu (règles brutes), PwC LU guides, KPMG LU
- Hors LU : impots.gouv.fr calculateur PV, immobilienmarkt.de

**Ce qu'on a** : règle spéculation vs cession longue durée, barème IR, abattement décennal, réévaluation indice construction.

**Gaps identifiés** :
- Pas de **cession d'entreprise** (parts de SCI/SARL immobilière) — régime différent
- Pas d'**exonération RP** explicitée (cas du bien vendu 2 ans après l'achat puis dans les 2 ans du départ)
- Pas de **simulation report d'imposition** (réemploi dans un autre bien)

**Pistes d'amélioration** :
- **Court** : ajouter un encadré conditionnel « exonération résidence principale » qui s'active automatiquement selon les dates saisies.
- **Moyen** : mode « cession de parts sociales » (régime DIR-Aktivitéit).
- **Long** : simulateur de report d'imposition (réinvestissement).

---

## 8. Simulateur d'aides (`/simulateur-aides`) — killer feature

**Usage** : croise les 5 couches d'aides (étatiques, énergie, privées, communales, patrimoine).

**Benchmarks** :
- Guichet.lu (générique, pas de croisement), SNHBM (seulement aides étatiques), Klima-Agence (seulement rénovation énergétique), communes (chaque site isolé)
- Hors LU : ANAH.fr (France, aides rénovation), Ma Prime Rénov' (FR)

**Ce qu'on a** : Bëllegen Akt, TVA 3%, Klimabonus, Klimaprêt, prime d'épargne logement, aides communales variables, patrimoine classé, garantie de l'État.

**Gaps identifiés** :
- Pas de **mise à jour automatique** des barèmes (faite manuellement lors des changements législatifs)
- Pas de **filtre par commune** exhaustif (seules quelques communes ont des aides paramétrées)
- Pas de **formulaire pré-rempli** pour la demande effective (PDF rempli à télécharger)
- Pas d'**alerte nouvelle aide** publiée au Mémorial A

**Pistes d'amélioration** :
- **Court** : ajouter un champ « date de mise à jour » visible par aide ; notifier quand une aide a plus de 6 mois sans vérification.
- **Moyen** : générer des PDF de demande pré-remplis pour le Klimabonus, la prime d'épargne, l'aide communale (top 20 communes).
- **Long** : intégration webhook Mémorial A pour détecter automatiquement les modifications de barèmes.

---

## 9. Calculateur loyer légal — règle 5 % (`/calculateur-loyer`)

**Usage** : propriétaire LU vérifiant le plafond légal avant de louer.

**Benchmarks** :
- Guichet.lu (page explicative, pas d'outil), Union Luxembourgeoise des Consommateurs (peu d'outils interactifs)
- Hors LU : pas d'équivalent direct (plafonds de loyer à l'étranger fonctionnent différemment — Mietspiegel DE, IRL FR)

**Ce qu'on a** : capital investi réévalué (coefficients STATEC depuis 1960), travaux multi-tranches, décote vétusté paramétrable, majoration logement meublé.

**Gaps identifiés** :
- Pas de **mode multi-logements** dans une copropriété (quote-part immeuble)
- Pas de **simulation post-travaux** (si je rénove X €, quel sera le nouveau plafond)
- Pas d'**historique de modifications** du loyer légal (plafond en 2020 / 2023 / 2026)
- ~~Pas de **support bail commercial**~~ → ✅ Module complet IPC + pas-de-porte + coût total (`8b573b0`)

**Pistes d'amélioration** :
- **Court** : bouton « Et si je fais des travaux ? » ouvrant une mini-simulation post-travaux.
- **Moyen** : mode copropriété avec quote-part.
- **Long** : module bail commercial (indices ILC/ILAT équivalents LU, clauses d'indexation).

---

## 10. Achat vs location (`/achat-vs-location`)

**Usage** : particulier arbitrant acheter ou louer sur N années.

**Benchmarks** :
- NYT Buy vs Rent calculator (US, référence mondiale), Nerdwallet, Rentometer, Meilleurs Agents
- Le calculateur NYT est régulièrement cité comme « best-in-class »

**Ce qu'on a** : comparaison sur N années, frais acquisition, loyer, apport, mensualité, plus-value à la sortie.

**Gaps identifiés** :
- Pas de **coût d'opportunité** du capital (si l'apport était placé à X%/an)
- Pas d'**inflation locative** modélisable (loyer augmente IRL)
- Pas de **scénario vacance** (1-2 mois vides entre locataires)
- Pas de **graphique patrimoine net sur N années** (achat vs location + épargne)

**Pistes d'amélioration** :
- **Court** : ajouter un paramètre « rendement de l'épargne » (ex. 3%/an) pour quantifier le coût d'opportunité.
- **Moyen** : graphique évolution patrimoine net mois par mois, avec choc vacance locative.
- **Long** : mode Monte-Carlo (10 000 scénarios aléatoires sur rendement marché + inflation loyer) → probabilité d'avantage pour l'achat.

---

## 11. AML / KYC immobilier (`/aml-kyc`)

**Usage** : agent immobilier ou évaluateur respectant ses obligations LBC-FT.

**Benchmarks** :
- ComplyAdvantage, Veriff, Onfido, Jumio (industrie KYC), Sanction Scanner
- Spécifique immo : Blokario (DE), NetID (DE)

**Ce qu'on a** : checklist obligations LBC-FT LU, vérification d'identité (checklist papier), déclaration de soupçon.

**Gaps identifiés** :
- Pas de **vérification automatique** d'identité (OCR pièce + selfie + cross-check)
- Pas de **screening sanctions** (UE, OFAC, UN, CSSF)
- Pas de **screening PEP** (Personnes Politiquement Exposées)
- Pas d'**archivage 5 ans** conforme

**Pistes d'amélioration** :
- **Court** : intégrer un lien direct vers les listes sanctions officielles (UE, LU, OFAC) depuis la checklist.
- **Moyen** : intégrer une API KYC (Ondato / Veriff / Onfido) avec facturation à l'usage (~€0,50-1/vérification).
- **Long** : dashboard compliance complet avec archivage 5 ans, alertes automatiques sanctions PEP, extraction statistiques pour le reporting CRF.

---

## 12. Outils bancaires (`/outils-bancaires`)

**Usage** : analyse LTV, capacité d'emprunt, DSCR, MLV, valeur prudente CRR.

**Benchmarks** :
- Banques LU (Spuerkeess, BGL, ING, BIL) — simulateurs basiques sans DSCR
- Hors LU : Bankrate (US), Meilleurtaux (FR), Hypofriend (DE)

**Ce qu'on a** : LTV, capacité d'emprunt, DSCR, mensualité, amortissement, MLV, ajustement énergétique (classe E/F/G = décote LTV).

**Gaps identifiés** :
- Pas de **comparateur taux live** (Spuerkeess vs BGL vs BIL)
- Pas de **historique des taux** (évolution Euribor 2020-2026)
- Pas de **scénarios de remboursement anticipé** (pénalités, gain)
- Pas d'**intégration avec le profil acheteur** (revenus + charges + capacité → estimation)

**Pistes d'amélioration** :
- **Court** : ajouter le graphique historique Euribor 3M / OAT 10Y sur 5 ans (données BCE disponibles).
- **Moyen** : connecter l'outil au wizard particulier pour un parcours unifié.
- **Long** : partenariat 1-2 banques LU pour afficher leurs taux live (format API ou fichier quotidien).

---

## 13. Portfolio (`/portfolio`)

**Usage** : investisseur suivant plusieurs biens sous gestion.

**Benchmarks** :
- Stessa (US), RentRedi (US), Rentila (FR), Smovin (BE)
- Plus grands : Yardi, AppFolio, Buildium, MRI

**Ce qu'on a** : liste biens avec valeur/dette/loyer, ratios agrégés (LTV global, rendement brut/net, équité), import depuis les évaluations sauvegardées.

**Gaps identifiés** :
- Pas de **dashboard temps réel** (cash flow mensuel, impayés, vacance)
- Pas de **suivi charges d'exploitation** (ventilation par bien / par type)
- Pas de **module déclaration fiscale** (export pour la déclaration IR des revenus locatifs)
- Pas de **mobile** optimisé pour consulter sur le terrain

**Pistes d'amélioration** :
- **Court** : dashboard cash flow prévisionnel 12 mois glissants.
- **Moyen** : section « charges » par lot, dashboard ventilation.
- **Long** : export formulaire déclaration IR LU (100 F/102), intégration module gestion-locative pour un tableau unifié.

---

## 14. PropCalc (`/propcalc`) — cashflow multi-pays

**Usage** : investisseur comparant rendement net après impôt entre 10 pays.

**Benchmarks** :
- BiggerPockets (US), Property Investor Network (UK), NexUrban (EU)

**Ce qu'on a** : 10 pays, régimes fiscaux, calcul cashflow / yield / net after tax, comparateur côte-à-côte.

**Gaps identifiés** :
- Pas de **données de marché intégrées** par pays (juste les paramètres fiscaux)
- Pas de **impact change EUR/USD** pour les projets non-EUR
- Pas de **visualisation cash flow** sur 10 ans

**Pistes d'amélioration** :
- **Court** : ajouter un paramètre « inflation pays » pour projection 10 ans.
- **Moyen** : intégrer prix/m² et loyer/m² moyens par grande ville pour les 10 pays (sources publiques : OECD, Numbeo).
- **Long** : monétiser via plugin WordPress (déjà prévu dans la roadmap visible sur `/propcalc/developers`).

---

## 15. Carte des prix / Indices / Marché (`/carte`, `/indices`, `/marche`)

**Usage** : consultation territoriale des prix.

**Benchmarks** :
- Athome.lu, atHome Pro, Observatoire de l'Habitat (carte officielle, peu interactive), Immoscout24 Heatmap (DE)
- Hors LU : Meilleurs Agents carte (référence qualité), Rightmove sold prices

**Ce qu'on a** : 100 communes, prix m² existant / VEFA / annonces, Top 5 hausses/baisses, canton view, évolution temporelle.

**Gaps identifiés** :
- Pas de **heatmap interactive** (choroplèthe couleur) sur une vraie carte (Leaflet présent mais sous-exploité)
- Pas de **sous-quartiers** pour 100 communes (seules les grandes villes ont des quartiers)
- Pas de **prévisions** (modèle prédictif à 12 mois)
- Pas de **filtre type de bien** (appartement/maison/terrain)

**Pistes d'amélioration** :
- **Court** : activer la heatmap complète sur `/carte` avec gradient 0-15k €/m², tooltip commune.
- **Moyen** : enrichir les quartiers pour les 20 communes les plus peuplées.
- **Long** : modèle prédictif 12 mois (ARIMA ou Prophet) publié en beta avec IC, rafraîchi trimestriellement.

---

## 16. Wizard particulier (`/wizard-particulier`)

**Usage** : parcours guidé 4 étapes (estimation → frais → aides → loyer légal).

**Benchmarks** :
- Quasiment pas d'équivalent. Meilleurs Agents commence à faire des parcours guidés (Meilleurs Agents « simulation achat »), Rocket Mortgage (US) a un wizard.

**Ce qu'on a** : 5 étapes avec state partagé, pré-remplissage auto (prix estimation → frais), récap final avec cross-sell.

**Gaps identifiés** :
- Pas de **sauvegarde reprise plus tard** (si user pause, il perd tout)
- Pas d'**envoi email du récap**
- Pas de **mode guidé conseiller** (un agent prend le wizard en main pour son client)

**Pistes d'amélioration** :
- **Court** : sauvegarde auto de l'état dans localStorage + cloud (déjà en place côté stockage, à brancher sur le wizard).
- **Moyen** : bouton « Envoyer ce récap par email », génération d'un mini-PDF 1 page.
- **Long** : mode « wizard collaboratif » où un agent crée un parcours pré-rempli et l'envoie à son client (extension du partage public).

---

## 17. Gestion locative LU (`/gestion-locative`) — **mis à jour 2026-04**

**Usage** : propriétaire 1-10 lots + syndics 10-100 lots, focus règle 5 % + Klimabonus.

**Benchmarks 2026** :
- **Solo/small** : Rentila (FR, leader solo €9-29/mois), Smovin (BE, freemium jusqu'à 3 biens), Landlord Studio (UK/IE, mobile-first), Stessa (US, **gratuit** avec upsell reporting)
- **Pro** : AppFolio (**#1 2026** selon Hotel Tech Report, min. 50 lots + onboarding fee), Buildium (mid-market), Yardi Breeze, MRI
- **Luxembourg** : aucun SaaS dédié. Acteurs actuels = agences gestion (RIS, Unicorn, GSI, Ab-lux) en service humain pur → opportunité SaaS **vierge**
- Cas particulier LU : **Agences Immobilières Sociales** (AIS, via guichet.lu) gèrent les biens en échange de 50% d'abattement fiscal sur revenus (passant à 75% selon accord tripartite mars 2023)

**Ce qu'on a** : CRUD lots, analyse règle 5 %, détection Klimabonus (E/F/G), summary portefeuille (yield, alertes), sync cloud 500 items/180j, `rental_payments` + quittances PDF (art. 25 loi 21.09.2006), bail numérique eIDAS.

**Gaps identifiés (actualisé 2026)** :
- ~~Pas de **suivi paiements**~~ → ✅ `rental_payments` + CRUD complet (`7cce27b`)
- ~~Pas d'**appel de loyer**~~ → ✅ Quittances PDF mensuelles conformes art. 25 loi 21.09.2006 (`7cce27b`)
- ~~Pas de **bail numérique**~~ → ✅ Template bail + signature électronique eIDAS simple (`6d10f3f`)
- 🔴 Pas d'**état des lieux mobile PWA** (photos geotag, signatures tactiles, export PDF contradictoire) — standard AppFolio/Rentila/Stessa
- 🔴 Pas de **portail locataire** (espace restreint : docs bail, quittances, demandes intervention, chat) — tous les leaders en ont un depuis 2023
- 🟠 Pas de **réconciliation bancaire** (import CSV/CAMT.053 relevé compte → auto-match paiements). Standard AppFolio/Stessa/Buildium
- 🟠 Pas de **OCR factures** (entretien, travaux → auto-catégorisation comptable). Standard Smovin/Matera
- 🟠 Pas de **gestion colocation** (un bail, N colocataires, quote-part caution/loyer)
- 🟠 Pas de **dashboard fiscal LU** (export prérempli formulaire 100 F ou 102, ventilation revenus/charges déductibles)
- 🟡 Pas d'**intégration assurance loyers impayés** (partenariat Baloise LU / Bâloise Protection Juridique, ou Imalis FR)
- 🟡 Pas de **mode gestion locative sociale** (orientation vers AIS partenaire avec calcul abattement 50/75%)
- 🟡 Pas de **chatbot locataire 24/7** (IA qualifie la demande, déclenche intervention, génère ticket)
- 🟡 Pas de **Mietspiegel-like** : observatoire des loyers réels par commune/typologie (gros gap LU, Athome pro a commencé à publier)

**Pistes d'amélioration 2026** :
- **Court (1-4 semaines)** :
  - État des lieux PWA (mobile) : checklist pièce par pièce + photo + geotag + signature tactile → PDF contradictoire signé des deux parties. Stockage Supabase Storage.
  - Dashboard fiscal : page `/gestion-locative/fiscal` regroupant revenus + charges déductibles (intérêts emprunt, assurance PNO, charges copro, travaux, amortissement) → tableau prêt à copier dans 100 F / 102.
  - Bouton « Analyser ce portefeuille » (IA, pattern déjà existant) : commentaire sur écart entre loyer réel et règle 5%, détection sous-performance, optimisations fiscales.
- **Moyen (1-3 mois)** :
  - Portail locataire `/locataire/[token]` en read-only chiffré (magic link auth sans compte) : voit bail, quittances téléchargeables, historique paiements, bouton « Signaler un incident » → ticket côté propriétaire.
  - OCR factures via Anthropic/OpenAI Vision (pattern `PdfExtractButton` déjà développé) : schéma `facture_immo` avec fournisseur/montant/TVA/catégorie.
  - Gestion colocation : schéma `rental_units.occupants[]` avec quote-part caution/loyer, génération quittances nominatives.
- **Long (3-12 mois)** :
  - Réconciliation bancaire via PSD2 (ouverture à Tink ou Nordigen / GoCardless Bank Account Data) : import quotidien, match automatique des virements aux échéances.
  - Partenariat AIS (Agence Immobilière Sociale) : redirection pour les bailleurs voulant le régime fiscal abattement 75%.
  - Chatbot locataire avec `/api/v1/ai/chat` réutilisé, persona « gardien d'immeuble » (signaler fuite, demander intervention, questions bail).
  - Intégration assurance loyers impayés (contact Baloise LU pour API de souscription instantanée).

---

## 18. Convertisseur surfaces (`/convertisseur-surfaces`)

**Usage** : conversion surface habitable / brute / vendable / SHON / SHAB / balcon.

**Benchmarks** : peu d'équivalents grand public. Cougar, Archilab ont des modules.

**Ce qu'on a** : conversion multi-définitions, ajustements partiel (sous hauteur plafond, extérieurs pondérés).

**Gaps identifiés** :
- Pas de **support terrain** (retrait voirie, espace vert obligatoire selon PAG)
- Pas d'**export pour déposer un permis** (format PAG/PAP)

**Pistes d'amélioration** :
- **Court** : ajouter un onglet « Terrain » (surface cadastrale → surface constructible selon ratios PAG).
- **Moyen** : templates tableaux à insérer dans une demande d'autorisation.

---

## 19. Estimateur construction (`/estimateur-construction`)

**Usage** : particulier ou promoteur chiffrant un projet neuf.

**Benchmarks** :
- Batichiffrage (FR, référence), BIMobject, Stima (CH), Bauzins (DE)

**Ce qu'on a** : coût/m² selon type (individuel/collectif/tertiaire), finitions, énergie, prestations.

**Gaps identifiés** :
- Pas de **bibliothèque de lots** détaillés (Gros œuvre, CVC, second œuvre…)
- Pas de **bordereau devis-type** exportable
- Pas d'**intégration prix matériaux** live (acier, béton, bois)

**Pistes d'amélioration** :
- **Court** : ajouter un graphique « ventilation par lot » (gros œuvre 45%, second œuvre 25%, etc.).
- **Moyen** : bordereau Excel/PDF exportable, ventilation réaliste pour un devis interne.
- **Long** : ingestion mensuelle indices matériaux STATEC (ICV) pour ajuster les coefficients.

---

## 20. Calculateur VRD (`/calculateur-vrd`)

**Usage** : promoteur chiffrant les voiries et réseaux divers d'un lotissement.

**Benchmarks** : pratiquement aucun équivalent grand public.

**Ce qu'on a** : multi-lots (terrassement, chaussée, bordures, réseaux EU/EP, éclairage, paysage, signalisation), multi-étapes (nav previous/next), bordereau détaillé.

**Gaps identifiés** :
- Pas de **nomenclature BTP standardisée** (CCTG français, SIA suisse, OIB autrichien…)
- Pas d'**export CCAP/CCTP** (pièces écrites marché public)

**Pistes d'amélioration** :
- **Court** : ajouter quelques prix de référence récents (moyenne 2025 par commune).
- **Long** : template CCAP/CCTP LU conforme aux marchés publics luxembourgeois (Loi du 8 avril 2018 sur les marchés publics).

---

## 21. VEFA (`/vefa`)

**Usage** : acquéreur VEFA calculant appels de fonds + intérêts intercalaires.

**Benchmarks** :
- Banque Populaire, Crédit Agricole, CIC (simulateurs basiques FR)
- Professionnels : Adyton, Habitat FR

**Ce qu'on a** : milestones appels de fonds, intérêts intercalaires, TVA 3%/17%, garantie financière d'achèvement.

**Gaps identifiés** :
- Pas de **simulation retard chantier** (impact intérêts intercalaires si le chantier glisse)
- Pas d'**intégration garantie** (calcul prime GFA, comparaison GFA/GAR)

**Pistes d'amélioration** :
- **Court** : paramètre « retard chantier » (+3, +6, +12 mois) sur la timeline.
- **Moyen** : calculateur prime GFA (Garantie Financière d'Achèvement) séparé.

---

## 22. PAG-PAP (`/pag-pap`)

**Usage** : vérification zonage et constructibilité d'une parcelle LU.

**Benchmarks** :
- Geoportail.lu (référence officielle), GIS communaux
- Hors LU : Cadastre.gouv.fr, Geoportal.de

**Ce qu'on a** : analyse PAG par commune, procédures PAP Nouveau Quartier / Quartier Existant.

**Gaps identifiés** :
- Pas d'**intégration Geoportail WMS directe** (le layer est dans LeafletMap mais pas sur cette page)
- Pas de **simulation CMU/COS** (combien de m² je peux construire sur une parcelle X)
- Pas d'**extraction automatique** du zonage d'une adresse précise

**Pistes d'amélioration** :
- **Court** : intégrer le WMS PAG officiel sur cette page (carte + affichage zonage au clic).
- **Moyen** : calculateur CMU/COS (surface parcelle × coefficient d'occupation).
- **Long** : recherche par adresse, récupération automatique du zonage.

---

## 23. Terres agricoles (`/terres-agricoles`)

**Usage** : estimation terre agricole LU (parcelle, céréales, prairie, vigne…).

**Benchmarks** :
- Safer (FR, marché foncier rural), Ager (DE), land-data.ch
- LU : pas d'équivalent grand public

**Ce qu'on a** : estimation par type de culture, SAU, aide PAC, prix de référence.

**Gaps identifiés** :
- Pas de **carte des prix** agricoles (actuellement seulement dans `/carte` pour le résidentiel)
- Pas d'**aides PAC 2023-2027** détaillées (éco-régime, BCAE, aides couplées)
- Pas de **viticulture spécifique** (Moselle luxembourgeoise, AOP)

**Pistes d'amélioration** :
- **Court** : détailler les aides PAC par culture (céréales bio, prairie permanente, viticulture AOP).
- **Moyen** : section viticulture dédiée avec AOP Moselle luxembourgeoise, régimes spécifiques.
- **Long** : carte des transactions de terres agricoles par canton (données Institut Viti-Vinicole et Service d'économie rurale).

---

## 24. Module Énergie (`/energy/*`)

**Sous-outils** : Impact CPE, ROI Rénovation, Communauté d'énergie, Portfolio énergétique, EPBD 2050, Estimateur CPE, LENOZ, HVAC.

**Benchmarks** :
- klima-agence.lu (officiel, consultatif), Sprengnetter Energy (DE), EcoTree (FR)
- Plus techniques : myClimate, Schletter, Aurora Solar (PV)

**Ce qu'on a** : 8 simulateurs interconnectés, données live PVGIS (solaire), calcul Klimabonus réaliste, timeline EPBD 2050.

**Gaps identifiés** :
- Pas d'**audit énergétique complet** (DPE simplifié qui sort un plan de rénovation hiérarchisé)
- Pas de **simulation pompe à chaleur** par type (air/eau, eau/eau, géothermique) avec COP réels
- Pas de **estimation production PV live** (couplage temps réel avec les données météo LU)
- Pas d'**intégration fournisseur énergie** (Enovos, Creos, Leo) pour tarifs en temps réel

**Pistes d'amélioration** :
- **Court** : enrichir HVAC avec PAC multi-type + COP saisonnier.
- **Moyen** : audit énergétique guidé (20 questions → plan rénovation 3 phases hiérarchisé coût/bénéfice).
- **Long** : partenariat data Enovos/Leo pour afficher les tarifs en temps réel + prévisions 12 mois.

---

## 25. Hôtellerie (6 outils) — `/hotellerie/*` — **mis à jour 2026-04**

**Sous-outils** : Valorisation, DSCR, Exploitation USALI, Rénovation, RevPAR comparison, Score E-2, Forecast ML.

**Benchmarks 2026** :
- **PMS leaders** : Oracle Opera Cloud (enterprise/chaînes, €5-50k/an/hôtel), **Mews** (design-conscious EU, mobile check-in, marketplace intégrations), **Cloudbeds** (500+ intégrations, scale multi-sites), Stayntouch (cloud-native), Apaleo (API-first)
- **Accessibles indépendants** : Hotelogix, RoomRaccoon, Little Hotelier, WebHotelier, innRoad
- **Revenue management (RMS)** : **Duetto** (Open Pricing, +7.6% TRevPOR en 6 mois rapporté), **IDeaS** (leader historique, LVP AI), Atomize, **OTA Insight** (data intel, compset), RateGain
- **Benchmarking** : **STR Global / CoStar** (compset, €5-20k/an — référence mondiale), Kalibri Labs (US revenue intel), Fornova, Lighthouse
- **Valorisation** : HVS, Cushman & Wakefield Hospitality, JLL Hotels, PKF Consulting
- **Multi-property** : Oracle OHIP, SiteMinder, D-EDGE

**Ce qu'on a** : 7 outils complets avec ratios USALI par catégorie, stress tests DSCR, compset MPI/ARI/RGI, Klimabonus tertiaire, score visa E-2, forecast ML 90 jours, PMS webhook ingestion, owner report PDF automatique, dashboard groupe multi-hôtels, IA analyse intégrée sur chaque outil.

**Gaps identifiés (actualisé 2026)** :
- ~~Pas d'**intégration avec OTA/PMS**~~ → ✅ Webhook PMS Mews/Cloudbeds/Opera (`cc17ca4`)
- ~~Pas de **Owner report auto**~~ → ✅ PDF mensuel HOTREC (`ac35c84`)
- ~~Pas de **Forecast ML**~~ → ✅ ARIMA/Prophet 90 jours (`cb93396`)
- 🔴 Pas de **channel manager lite** (distribution Booking.com/Expedia/Airbnb depuis un back-office unique). Feature clé Cloudbeds/SiteMinder.
- 🔴 Pas d'**ingestion compset STR live** (prix €5-20k/an STR + notre engagement chez Hotrec LU à négocier). Actuellement les benchmarks sont saisis manuellement.
- 🟠 Pas de **yield alerts « agentic »** : notif temps réel quand un hôtel du compset modifie son ADR ou quand la pickup diverge du forecast (**grand trend RMS 2026 : l'IA ne recommande plus, elle agit**). Implémentable sur base de notre PMS webhook existant.
- 🟠 Pas de **guest journey mobile** (check-in pré-arrivée, clé digitale, facturation mobile) — différenciateur Mews core. **Hors scope tevaxia** (nous ne sommes pas un PMS) mais positionnement possible en « couche analytics + AI sur top d'un PMS ».
- 🟠 Pas de **housekeeping scheduling** adaptatif (occupation forecast → staffing ménage)
- 🟠 Pas d'**échantillon comparables transactionnels** (historique ventes d'hôtels LU/BE/DE). Difficile à constituer sans partenariat broker.
- 🟠 Pas de **due diligence checklist** exhaustive (technique / commercial / juridique / fiscal / ESG). Standard HVS / Cushman.
- 🟡 Pas de **segmentation MICE** dédiée (groupes corporate, séminaires)

**Pistes d'amélioration 2026** :
- **Court (1-4 semaines)** :
  - Enrichir la base compset live : créer `hotel_compset` avec seed de 30-50 hôtels LU/Grande Région catégorisés (budget/midscale/upscale/luxury) avec ADR/occupation benchmarks publics (STR EMEA Performance Report Q4 2025, Horwath HTL European Hotel Valuation Index 2025, Deloitte European Hotel Industry Performance). Met à jour trimestriel.
  - Due diligence PDF générée par IA : bouton sur `/hotellerie/valorisation` qui produit une checklist 50 points pré-remplie selon le contexte (catégorie, taille, année) — réutilise le pattern `AiAnalysisCard`.
  - Page `/hotellerie/compset` dédiée qui affiche le compset par ville (LU-Ville Centre, Gare, Kirchberg, Esch, Luxembourg Findel, Mersch, Diekirch, Ettelbruck + frontières).
- **Moyen (1-3 mois)** :
  - Yield alerts via PMS webhook : si un hôtel connecté a un écart pickup forecast > 20% ou si l'ADR du compset bouge de +/-10% sur 7 jours → email/push notification à l'utilisateur. Trigger Supabase cron.
  - Segmentation MICE : nouveau calculateur `/hotellerie/mice` (revenu groupes, taux conversion RFP, force groupe vs transient).
  - Import CSV PMS historique : format Opera/Mews/Cloudbeds standard pour bootstrap du forecast ML avec 2-3 ans de data.
- **Long (3-12 mois)** :
  - Partenariat **Hotrec Luxembourg** (Fédération HORESCA) : panel mutualisé. Adhésion réciproque. Vraie alternative LU à STR à 1/10e du prix.
  - Module **revenue optimization « agentic »** : au lieu de suggérer une ADR, proposer un bouton « Appliquer cette tarification sur le PMS » qui modifie via API PMS (Mews/Cloudbeds). Saut qualitatif majeur vs simple forecast.
  - Certification CRREM + Taxonomie UE pour valorisation hôtelière ESG — différenciateur fonds institutionnels.
  - Module **motel / aparthotel / résidences hôtelières** (catégorie non couverte aujourd'hui) : ratios USALI adaptés (kitchenette, séjour long durée 7-28 nuits, mixte leisure+business travelers).

---

## 25bis. 🆕 Short-Term Rentals / Airbnb / Saisonnier — **à créer (0% couvert)**

**Usage cible** : propriétaire LU qui loue son bien en courte durée (Airbnb, Booking Stays, Vrbo) ; investisseur arbitrant entre location long terme (règle 5%) et court terme ; gestionnaire STR pro (conciergerie, multi-biens).

**Contexte réglementaire LU (important)** :
- **Seuil 3 mois/an** : au-delà de 3 mois de location courte durée cumulés par an, l'opérateur doit demander une **licence d'hébergement** (équivalent licence hôtellerie). Art. 6 loi du 17 juillet 2020 + règlements communaux.
- **Fiscalité** : revenu > 600 €/an → déclaration IR obligatoire, taux marginal jusqu'à 45,78% (IR 42% × 1,09 contribution emploi). Charges déductibles : intérêts emprunt, assurance, frais OTA (Airbnb ~15% commission), ménage, électricité.
- **Taxe foncière communale** : applicable indépendamment de l'usage.
- **Règlement UE STR 2024/1028** : entrée en vigueur **mi-2026**, registre unique européen, transmission obligatoire des nuitées aux autorités nationales et communales. Gros impact compliance à venir pour tous les opérateurs LU.

**Benchmarks 2026** :
- **Property Management Systems (PMS) STR** :
  - **Guesty** (leader enterprise, 50+ units, rule engines avancés)
  - **Hostaway** (all-in-one AI-powered, growing portfolios, meilleur rapport qualité/prix support)
  - **OwnerRez** (highest user satisfaction, zéro booking fee, expérimentés)
  - **Lodgify** (small hosts, website builder + PMS basique)
  - **Hostfully**, **Smoobu**, **Hospitable** (bundle dynamic pricing free)
  - **Lodgify** (small hosts direct booking)
- **Dynamic pricing** :
  - **PriceLabs** ($19.99/listing/mois, 150+ intégrations PMS, granular control)
  - **Wheelhouse** ($19.99/listing/mois, +40% revenu rapporté, market intelligence dashboard)
  - **Beyond Pricing** (1-1.25% du CA, hands-off, market leader historique)
  - **DPGO** (low-cost alternative)
  - **AirDNA** (data-only intelligence, pas pricing direct)
- **Channel management** : SiteMinder (multi-OTA), Rentals United, AirGMS, Kigo
- **Intelligence données** : **AirDNA** (données marché STR — ADR, occupation, RevPAR par ville/quartier, référence mondiale), Transparent, Key Data
- **Niche LU** : **aucun SaaS dédié**. Services de conciergerie traditionnels (My Lux Stay, Quintessential Lux) en humain uniquement → opportunité SaaS.

**État actuel sur tevaxia : 0% de couverture** (seule l'hôtellerie « classique » est couverte).

**Ce qu'on devrait construire** :

### 25bis.A — `/str/rentabilite` — Calculateur rentabilité STR LU
Simuler le revenu annuel net d'un bien loué en Airbnb/Booking au Luxembourg.
- **Inputs** : commune, type bien, surface, capacité (voyageurs), ADR cible, taux d'occupation attendu, saisonnalité (haute/basse saison LU = été + fêtes), coûts cachés (ménage 30-60 €/séjour, linge 15-25 €, OTA commission 15-18% Airbnb, 15-18% Booking, internet/TV, consommables, assurance PNO majorée)
- **Outputs** : revenu brut, commissions OTA, charges opérationnelles, revenu net avant impôt, impôt estimé (barème IR LU), revenu net après impôt, yield brut %, yield net %
- **Comparaison side-by-side** avec location long terme (règle 5%) : le STR est-il plus rentable compte tenu du taux d'occupation réaliste ?
- **IA intégrée** : commentaire sur la viabilité, saisonnalité LU spécifique (pic été, Schueberfouer fin août, marchés de Noël, salons Luxexpo), risque réglementaire (passage > 3 mois sans licence), articulation avec règle 5% si bail mixte.

### 25bis.B — `/str/compliance` — Checklist conformité LU + UE 2026
- Calculateur de seuil 3 mois : si on dépasse, licence hôtellerie obligatoire → lien vers démarche guichet.lu
- Vérification règlement communal (certaines communes limitent ou interdisent la STR, notamment Luxembourg-Ville après 2024)
- Calendrier EU STR Regulation 2024/1028 : obligations d'enregistrement + transmission de données, entrée en vigueur mi-2026
- Fiscalité : calculateur IR sur revenus STR + charges déductibles admissibles (ventilation par catégorie conforme Légilux)
- Assurance : checklist couvertures obligatoires (PNO courte durée, RC locative, dommages voyageurs)
- Export PDF « dossier compliance STR » pour présenter à la commune / administration fiscale

### 25bis.C — `/str/forecast` — Prévisionnel 12 mois LU
- Saisonnalité mensuelle LU/Grande Région (données publiques STATEC tourisme + AirDNA ville par ville)
- Impact événements (Expo, salons, concerts, Bad Bunny/BTS 2026 cités par STR forecast EU) sur l'ADR
- Pickup curve Luxembourg (réservations J-30 / J-60 / J-90)
- Forecast ML (réutilise l'infra `/hotellerie/forecast`)

### 25bis.D — `/str/arbitrage` — Long terme vs Court terme vs Mix
Arbitrage décisionnel sur un bien donné :
- Scénario A : long terme avec règle 5% (plafond légal)
- Scénario B : court terme Airbnb pur (avec contrainte < 3 mois/an sans licence ou > 3 mois avec licence)
- Scénario C : **mixte** (occupation propriétaire 2-3 mois d'été + long terme le reste) — très luxembourgeois pour les frontaliers qui ont une résidence secondaire
- Calcul rentabilité nette après impôt des 3 scénarios + risques relatifs
- Recommandation IA basée sur profil (résident vs non-résident, fiscalité, horizon)

### 25bis.E — `/str/pricing` (future) — Dynamic pricing LU
- Alternative light à PriceLabs/Wheelhouse pour opérateurs LU petits (1-10 biens)
- Ingestion AirDNA API (données compset) si budget le permet, sinon scraping léger des annonces Airbnb/Booking LU
- Recommandation ADR jour par jour avec règles saisonnalité LU

**Benchmarks prix et viabilité business** :
- Guesty ~2-5% du CA en enterprise → cher pour le petit hôte
- Hostaway flat ~€30-100/mois selon nombre de biens
- PriceLabs $19.99/listing/mois
- Tevaxia positionnement cible : **freemium** sur calculateur rentabilité/compliance, **€5-15/mois/bien** pour le pricing + forecast + multi-biens

**Pistes d'amélioration 2026** :
- **Court (1-4 semaines)** :
  - Créer `/str/rentabilite` (1 page, réutilise le pattern des autres calculateurs + `AiAnalysisCard`)
  - Créer `/str/compliance` (checklist + disclaimer)
  - Ajouter une tuile « Location courte durée / Airbnb » dans `WorkspacesGrid` avec profil `investisseur` + `particulier` + un nouveau `str_operator`
  - Ajouter guide SEO `/guide/airbnb-luxembourg-reglementation-2026` et `/guide/rentabilite-location-courte-duree-luxembourg`
- **Moyen (1-3 mois)** :
  - `/str/arbitrage` — calculateur 3 scénarios avec IA
  - `/str/forecast` — adaptation du forecast hôtel sur les paramètres STR (ADR, occupation, saisonnalité résidentiel vs hôtelier)
  - Extension `profile_types` avec `str_operator` (migration 023)
  - Intégration dans `/gestion-locative` d'une option « mode STR » (bascule règle 5% → calcul STR)
- **Long (3-12 mois)** :
  - `/str/pricing` dynamic pricing LU-natif
  - Ingestion AirDNA API (si budget) ou scraping légal des annonces publiques pour un observatoire gratuit des ADR LU
  - Portail multi-biens STR (dashboard conciergerie 10-50 biens)
  - Partenariat **Ville de Luxembourg** pour l'accès au registre STR obligatoire (EU Regulation 2024/1028)

**Impact business estimé** :
- ~4 000 listings Airbnb actifs au Luxembourg en 2024 (source : AirDNA public), croissance annuelle ~8-12%
- Si 10% des hôtes utilisent un outil payant à €10/mois = TAM annuel ~€48k (petit). Mais positionnement **freemium SEO** capte du trafic massif (guides Airbnb LU très peu couverts par la concurrence actuellement).
- Compliance UE 2026 force tous les hôtes à se former → fenêtre d'audience idéale 2026-2027.

---

## 26. Partage public (`/partage/[token]`)

**Usage** : partage read-only d'un calcul sans inscription.

**Benchmarks** :
- Argus Developer (partage projet interne), Google Sheets public link
- Pas d'équivalent immo grand public

**Ce qu'on a** : 6 outils supportés, vue dédiée par outil, durée 1-365j, limite de vues, révocation.

**Gaps identifiés** :
- Pas de **commentaire visiteur** (un investisseur qui reçoit le lien peut-il poser des questions sans se connecter ?)
- Pas de **version PDF téléchargeable** depuis la vue publique
- Pas d'**analytics** (combien de vues, quand, d'où)

**Pistes d'amélioration** :
- **Court** : bouton « Télécharger en PDF » sur la vue publique.
- **Moyen** : formulaire commentaire/question (sans inscription, notif email au propriétaire).
- **Long** : analytics par lien (views timeline, géoloc approximative, temps passé).

---

## 27. B2B Agences (`/pro-agences`) + PDF co-brandé

**Usage** : agences LU/BE offrant un rapport d'estimation à leur image.

**Benchmarks** :
- Apimo (FR), Netty (FR), Hektor (DE), ValueLink (UK)

**Ce qu'on a** : landing produit, auth multi-users, PDF co-brandé serveur-side, org/members/invitations.

**Gaps identifiés** :
- Pas de **CRM intégré** (suivi prospect → mandat → vente)
- Pas de **connecteur portail** (export auto vers Athome Pro, atHome, Immotop)
- Pas de **rapport « présentation de bien » complet** (plan, photos, rapport estimation, plan de financement)
- Pas d'**outil suivi mandat** (renouvellement, échéances, commission à percevoir)

**Pistes d'amélioration** :
- **Court** : stats admin agence (estimations par négociateur, taux conversion mandat).
- **Moyen** : export CSV auto vers Athome Pro + atHome (convention API à négocier).
- **Long** : CRM léger intégré (pipeline prospect → RDV → mandat → vente).

---

## 28. API Banques (`/api-banques`) + API `/api/v1/*`

**Usage** : intégration bancaire pour pré-qualification crédit, LTV automatique, scoring.

**Benchmarks** :
- Hometrack AVM (UK, leader), PriceHubble AVM (CH), Casafari (EU), Immoscout Axa Invest Valuation (DE)

**Ce qu'on a** : endpoints `/api/v1/estimation`, `/api/v1/agences/pdf`, `/api/v1/propcalc/*`, auth clé API + rate limit tiers (free/pro/enterprise), dashboard usage 30j.

**Gaps identifiés** :
- Pas de **endpoint MLV** dédié (distinct de l'estimation Market Value)
- Pas de **batch API** (évaluer 100 biens d'un coup pour un portefeuille hypothécaire)
- Pas de **webhook** notification de changement de prix
- Pas de **documentation OpenAPI 3.0** publique
- Pas de **sandbox** (clé de test)

**Pistes d'amélioration** :
- **Court** : documentation OpenAPI 3.0 publique (Swagger UI sur `/api-docs`).
- **Moyen** : endpoint `/api/v1/estimation/batch` pour portefeuille (jusqu'à 1000 biens/requête).
- **Long** : webhooks sur variation significative (>±5 % sur un bien déjà évalué), certification EBA « AVM acceptable » pour prêts hypothécaires.

---

## 29. Profil utilisateur (`/profil`) + comptes

**Usage** : gestion identité, préférences, branding rapports, alertes marché, liens partagés, clés API, tier, export RGPD.

**Benchmarks** :
- Dropbox, Stripe, Notion (best-in-class UX profil)
- Immo : aucun équivalent complet (la plupart ont juste nom/email)

**Ce qu'on a** : identité, qualifications, mention légale personnalisable, logo, alertes marché, liens partagés, clés API, tier + plafond, export JSON RGPD.

**Gaps identifiés** :
- ~~Pas d'**authentification forte**~~ → ✅ 2FA TOTP via supabase.auth.mfa (`c24eb61`)
- Pas de **gestion de sessions actives** (« déconnecter tous les appareils »)
- Pas d'**historique d'activité** (journal audit des actions)
- ~~Pas de **notifications centralisées**~~ → ✅ Préférences email/consents par type (`faa9e4b`)
- ~~Pas de **suppression compte self-service**~~ → ✅ Bouton danger zone + cascade RPC (`8eae0ca`)
- Pas de **gestion des consentements granulaire** (marketing, analytics, tiers)
- Pas de **impersonation admin** (pour le support, « voir comme cet utilisateur »)
- Pas de **facture PDF** (quand tu factures un tier Pro, il faut émettre une facture conforme LU)
- ~~Pas de **moyen de paiement**~~ → ✅ Stripe Checkout self-service upgrade Pro (`d323bd8`)

**Pistes d'amélioration** :
- **Court** : bouton « Supprimer mon compte » déclenchant cascade (évaluations, lots, liens, alertes, clés). Logs audit pour 1 an post-suppression (pour contestation).
- **Court** : préférences notifications (alertes marché par email OUI/NON, récap mensuel OUI/NON).
- **Moyen** : 2FA via TOTP (Google Authenticator, Authy), écran « mes sessions actives », bouton « Déconnecter tout sauf ici ».
- **Moyen** : Stripe Checkout pour upgrade self-service Pro (abonnement mensuel €29/mois, annuel €290). Webhook → auto-update `user_tiers`. Facture PDF auto-générée conforme loi LU.
- **Long** : consentements RGPD granulaires (dashboard complet conforme Art. 7 RGPD), impersonation admin sécurisée pour le support.

---

## 29bis. Comptes & rôles verticaux métier (Syndic, Hôtellerie)

**État actuel** : la table `organizations` + `org_members` (rôles `admin`, `member`, `viewer`) est **mono-pattern, pensée pour les agences immo**. Elle ne couvre ni les spécificités syndic/copropriété ni la gestion multi-hôtels. Aucun rôle métier spécifique n'existe pour ces deux verticaux.

### 29bis.A — SYNDIC & COPROPRIÉTÉ — **mis à jour 2026-04**

**Contexte réglementaire LU (important — refonte en cours)** :
- Loi du 16 mai 1975 modifiée (consolidée au 01/03/2024) reste le cadre principal
- **Projet de loi 7763** en cours : introduction d'un **fonds de travaux obligatoire** (équivalent réforme ALUR FR 2014) + modernisation — devait aboutir fin 2025/début 2026
- Impact direct attendu : chaque copropriété LU devra constituer un fonds de travaux minimal % du budget annuel, capitalisation inscrite en compta, traçabilité exigée
- Le syndic LU pro pour les copropriétés > 5 lots est **obligatoire** (règl. gr.-d. 13 juin 1975)

**Acteurs métier à modéliser** :

| Rôle | Description LU | Équivalent dans l'outil actuel |
|---|---|---|
| Syndic (gestionnaire) | Mandaté par l'AG, exécute budget et travaux | ✅ rôle `syndic` OK |
| Président du conseil syndical | Copropriétaire représentant, contre-pouvoir | ✅ rôle `conseil_syndical` |
| Membre du conseil syndical | Élu, consulté | ✅ rôle `conseil_syndical` |
| Copropriétaire (simple) | Détient un ou plusieurs lots, vote en AG | ✅ rôle `coproprietaire` |
| Locataire du copropriétaire | Accès restreint (charges, règlement) | ⚠️ rôle défini mais pas de portail |
| Prestataire (entreprise travaux) | Reçoit bons de commande, factures | ⚠️ rôle défini mais pas de module travaux complet |

**Benchmarks 2026 (prix & positionnement actualisés)** :
- **France** — marché hyper-concurrentiel :
  - **Matera** : syndic bénévole/auto-gestion, **170 €/lot/an**, 40k+ copropriétés France+Belgique, **4,3/5** (255 avis Google), levée de fonds significative 2024. Positionnement : accompagnement comptable + plateforme tout-en-un (messagerie, AG en ligne, budget temps réel).
  - **Cotoit** : syndic pro en ligne, avec humain + outils digitaux. Fort sur suivi travaux détaillé (devis → intervention → réception). Intègre gestion locative pour copropriétaires bailleurs.
  - **Manda (ex-Hello Syndic)** : 3 offres (Connect 149 €/lot, Zen 180 €, Promotion 240 €), 1 489 avis Google à 3,8/5.
  - **Homeland** : 195 €/lot (20+ lots) mais 2,2/5 (**opportunité : mieux faire facilement**)
  - Qlower, Syndic One, Léa Syndic (challengers)
- **Belgique** : Syndics.be, Smovin (couvre copropriété léger)
- **Suisse** : Swissacc, IAZI, Casasoft
- **Allemagne** : Facilis (WEG Verwaltung), ETG24, Casavi, Immoware24
- **Luxembourg** : **toujours aucun acteur SaaS dominant 2026** — marché vierge, acteurs historiques (ris.lu, agences syndic traditionnelles) en humain uniquement. TAM estimé : ~500 syndics pros + ~2000 copros auto-gérées. À ~€50-150/lot/an ça fait **€2-5M ARR accessible**.

**Fonctionnalités différenciantes observées chez les leaders 2026** :
- **Messagerie intégrée** (feature #1 de Matera) : thread par immeuble/par lot/privé syndic<>copropriétaire
- **AG virtuelle** : convocation en ligne, ordre du jour éditable, vote électronique conforme, compte-rendu auto
- **Appels de fonds** : génération mensuelle par quote-part (millièmes), relances automatiques, suivi paiement
- **Espace copropriétaire individuel** : chacun voit ses charges, règlement, PV d'AG, docs, historique
- **Gestion travaux complète** : appels d'offres (3 devis), bons de commande, factures, paiement, garanties
- **Comptabilité copropriété** : plan comptable spécifique LU (CCAC), clôture annuelle, rapport syndic, export expert-comptable
- **Module conseil syndical** : vérification comptes en lecture, alertes anomalies, validation trimestrielle
- **Archivage 10 ans** : conformité légale LU
- 🆕 **Fonds de travaux** : suivi capitalisation + trésorerie dédiée + règles de déblocage (projet 7763 à venir)
- 🆕 **OCR factures** : photo d'une facture → catégorisation automatique + ventilation par clé de répartition
- 🆕 **Interventions urgentes** : portail urgence + géolocalisation prestataires partenaires

**Gaps critiques — état actuel (actualisé 2026)** :
- ~~Pas de concept de **copropriété**~~ → ✅ Table `coownerships` + `coownership_units` avec tantièmes (`3ce993e`)
- ~~Pas de **quotes-parts / tantièmes**~~ → ✅ Tantièmes par lot + validation somme (`3ce993e`)
- ~~Pas de **plan comptable copropriété**~~ → ✅ 22 comptes système LU + journal double-entrée + clôture (`a1fd35e`)
- ~~Pas d'**appels de fonds**~~ → ✅ Génération + suivi paiements + PDF par lot (`2ff2385`)
- ~~Pas de **gestion d'AG**~~ → ✅ Convocation + vote électronique pondéré + PV auto (`72df70b`) + IA draft résolutions et notes de séance (`d028b69`)
- ~~Pas de **multi-copropriétés par syndic**~~ → ✅ CRUD multi-copropriétés par org syndic (`3ce993e`)
- 🔴 Pas d'**espace copropriétaire individuel** (portail restreint avec ses charges, docs, PV, votes passés) — c'est **la feature #1 demandée en 2026** par les copropriétaires Matera/Cotoit
- 🔴 Pas de **fonds de travaux** (à préparer en anticipation du projet de loi 7763)
- 🟠 Pas de **messagerie intégrée** (thread par immeuble, par lot) — Matera en fait son produit d'appel
- 🟠 Pas de **module travaux complet** (appel d'offres 3 devis → bon commande → facture → paiement → garantie décennale suivie)
- 🟠 Pas d'**OCR factures** (pattern `PdfExtractButton` existe — schéma `facture_copropriete` à créer)
- 🟠 Pas de **dashboard conseil syndical** (vue lecture auditeur, alertes anomalies compta, validations)
- 🟡 Pas d'**archivage 10 ans chiffré** conforme
- 🟡 Pas de **relances automatiques impayés** (lettres recommandées AR électroniques via eIDAS)

**Pistes d'amélioration — syndic/copropriété 2026** :

**Court (1-4 semaines)** :
- ✅ Étendre `org_role` avec `syndic`, `conseil_syndical`, `coproprietaire`, `locataire`, `prestataire` — **déjà fait**
- ✅ Ajouter `org_type` sur `organizations` — **déjà fait**
- 🔴 Ajouter **fonds de travaux** dans le plan comptable : compte dédié (ex. 10221 « Fonds de travaux »), page `/syndic/coproprietes/[id]/fonds-travaux` avec suivi capitalisation minimum annuelle (paramétrable, défaut 5% budget).
- 🔴 Analyse IA globale copropriété : bouton sur `/syndic/coproprietes/[id]` qui produit un diagnostic santé (trésorerie, taux d'impayés, écart budget/réel, dette fournisseurs) — réutilise `AiAnalysisCard`.

**Moyen (1-3 mois)** :
- 🔴 **Portail copropriétaire** `/copropriete/[token]` : magic link par email, lecture seule (charges individuelles, PV d'AG passés, docs, règlement, appels de fonds historiques, paiement en ligne Stripe ou virement SEPA).
- 🟠 **Messagerie intégrée** : thread par copropriété (annonces syndic → tous) + thread privé (syndic ↔ copropriétaire). Supabase Realtime.
- 🟠 **Module travaux** V1 : créer un « projet de travaux » avec 3 devis joints, vote AG lié, bon de commande généré, suivi paiement.
- 🟠 OCR factures (schéma `facture_copropriete`) : fournisseur, date, montant HT/TTC, TVA, catégorie comptable, clé de répartition. Auto-catégorisation via IA.

**Long (3-12 mois)** :
- 🟠 **AG virtuelle hybride** : visio + vote en temps réel (présent/absent/mandataire/votant), émargement automatique, PV généré en fin de séance.
- 🟠 **Relances impayés** automatiques par paliers : J+15 rappel email → J+30 lettre amiable PDF → J+60 mise en demeure eIDAS signée → export dossier judiciaire.
- 🟡 **Benchmark inter-copropriétés** : un syndic qui gère 20 copros peut comparer les ratios (charges/m², taux impayés, écart budget/réel) pour identifier les outliers.
- 🟡 **Dashboard prestataires** : chaque prestataire partenaire voit ses bons de commande en cours, peut envoyer sa facture via portail (signée eIDAS).
- 🟡 **Certification module** via un organisme LU (Chambre des Métiers ? CGFP ?) pour rassurer les syndics pros conservateurs.

---

### 29bis.B — HÔTELLERIE

**Acteurs métier à modéliser** :

| Rôle | Description | Équivalent actuel |
|---|---|---|
| Propriétaire (ownership) | Capital investi, ROI, exit strategy | ❌ partiellement (score E-2) |
| Opérateur (exploitant) | Franchise, contrat management | ❌ absent |
| Directeur d'exploitation | Pilote le P&L, staff, GOP | ❌ absent |
| Revenue manager | Pricing, yield, RevPAR, OTA | ❌ absent |
| Réception / front desk | Saisie occupation quotidienne | ❌ absent |
| F&B manager | Restauration, MICE | ❌ absent |
| Groupe hôtelier multi-sites | Vision consolidée plusieurs hôtels | ❌ absent |

**Benchmarks** :
- **PMS (Property Management Systems)** : Oracle OPERA (leader institutionnel €5-50k/an/hôtel), Mews Systems (EU, cloud moderne), Cloudbeds (accessible), Little Hotelier (indépendants), Apaleo (API-first)
- **Revenue management** : Duetto, IDeaS, OTA Insight, RateGain
- **Reporting / intelligence** : STR Global (compset), Kalibri Labs (revenue intel US), Fornova
- **Multi-property platforms** : Oracle OHIP, SiteMinder, D-EDGE
- **Accessibles (budget)** : HotelRunner, Hostwin, innRoad, WebHotelier

**Fonctionnalités différenciantes observées** :
- **Multi-hôtel dashboard** : vue consolidée P&L / RevPAR / GOP pour un groupe 3-30 hôtels
- **Benchmarking live** : auto-ingestion données STR avec compset customisable
- **Revenue forecast** : ML prévisionnel 90 jours (taux d'occupation, ADR optimal)
- **Channel manager** : distribution Booking/Expedia/Airbnb depuis un seul back-office
- **Rapport propriétaire** mensuel standardisé (owner report)
- **Yield alerts** : notif quand un compset modifie ses prix / quand la pickup anticipé dévie

**Gaps critiques chez nous** :
- ~~Pas de concept d'**hôtel persisté**~~ → ✅ Table `hotels` + CRUD par org (`bb80471`)
- ~~Pas de **historique multi-périodes**~~ → ✅ `hotel_periods` trimestriel/mensuel + deltas (`ac35c84`)
- ~~Pas de **rôles hôteliers distincts**~~ → ✅ 5 rôles (owner/director/revenue_manager/fb_manager/reception) (`dd95467`)
- ~~Pas de **multi-hôtel**~~ → ✅ Dashboard groupe consolidé (`bb80471`)
- ~~Pas de **connecteur PMS**~~ → ✅ Webhook `/api/v1/pms/webhook` Mews/Cloudbeds/Opera (`cc17ca4`)
- ~~Pas de **espace propriétaire**~~ → ✅ Owner report PDF auto avec compset + deltas (`ac35c84`)
- Pas d'**alertes** (RGI qui décroche, ADR compset modifié)

**Pistes d'amélioration — compte & rôles hôtellerie** :

**Court (1-4 semaines)** :
- Étendre `org_role` avec `hotel_owner`, `hotel_director`, `revenue_manager`, `fb_manager`, `reception`
- Ajouter `org_type = 'hotel_group'` pour activer un dashboard hôtelier consolidé
- Persistance des simulations hôtelières dans une table `hotels` (nom, catégorie, nb chambres) rattachée à l'organisation

**Moyen (1-3 mois)** :
- Table `hotel_periods` (hôtel, trimestre, RevPAR, ADR, occupation, GOP, EBITDA) pour historique N trimestres
- Dashboard groupe `/hotellerie/groupe/[slug]` : consolidation multi-sites, KPI pondérés par chambres
- Owner report mensuel auto-généré PDF (template standardisé HOTREC)

**Long (3-12 mois)** :
- Connecteur Mews / Cloudbeds / OPERA (API + webhook ingestion quotidienne taux d'occupation, ADR)
- Module channel manager lite (saisie manuelle multi-canaux + distribution Booking via API)
- Forecast ML 90 jours (ARIMA ou Prophet sur historique + saisonnalité LU/régionale)
- Partenariat Hotrec LU pour compset mutualisé (panel hôteliers LU partagent anonymement leurs chiffres, accès réciproque)

---

### 29bis.C — RÉCAPITULATIF ARCHITECTURE COMPTES MULTI-VERTICAL

**Migration proposée `008_org_verticals.sql`** (vue d'ensemble, pas détaillée ici) :

```sql
-- Extension de organizations
ALTER TABLE organizations
  ADD COLUMN org_type TEXT NOT NULL DEFAULT 'agency'
  CHECK (org_type IN ('agency','syndic','hotel_group','bank','other')),
  ADD COLUMN vertical_config JSONB NOT NULL DEFAULT '{}';

-- Extension de org_role
-- syndic : syndic, conseil_syndical, coproprietaire, locataire, prestataire
-- hotel_group : hotel_owner, hotel_director, revenue_manager, fb_manager, reception
-- Chaque rôle métier hérite des permissions de 'member' et ajoute des restrictions spécifiques via RLS

-- Nouvelles tables par vertical
-- coownerships (syndic), coowners, coownership_units, coownership_charges
-- hotels (hotel_group), hotel_periods, hotel_owner_reports
```

**Stratégie UX** :
- Au signup, demander le type d'organisation (« Je suis… Agence / Syndic / Groupe hôtelier / Banque / Particulier »).
- `/profil/organisation` bascule son UI selon `org_type` : agence → invitations négociateurs ; syndic → gestion copropriétés ; hotel_group → gestion hôtels.
- Les rôles métier restent des enum : chaque rôle a un tag visuel coloré dans l'UI et des permissions RLS distinctes.

**Impact business** :
- Syndic LU : **marché vierge SaaS** — 0 acteur dominant, ~500 syndics pros + ~2000 copropriétés sans syndic (auto-gérées) → TAM ~€2-5M ARR à 3-5 ans.
- Hôtellerie indépendants LU + Grande Région : ~200 hôtels budgets inférieurs à 5 M€, mal servis par OPERA/Mews (trop chers) → TAM ~€500k-1M ARR.

Ces deux verticaux justifient une roadmap « compte & rôles » dédiée, séparée du travail générique sur `/profil`.

---

## 30. Hors outils : infrastructure et observabilité

**Gaps identifiés** :
- ~~Pas de **monitoring erreurs client**~~ → ✅ **Sentry** intégré (`30a9425`), DSN configuré en production
- ~~Pas de **alerting latence/uptime**~~ → ✅ **Page /status** publique (`30a9425`)
- Pas de **tests E2E** (Playwright absent — que des tests unitaires Vitest, 172 tests)
- Pas de **CI/CD explicite** (Vercel déploie auto mais pas de pipeline de tests)
- ~~Pas de **analytics produit**~~ → ✅ **PostHog** EU-hosted intégré (`30a9425`), GDPR-compliant

**Pistes d'amélioration restantes** :
- **Moyen** : Playwright sur les 10 parcours clés (estimation, frais, aides, loyer, wizard, gestion locative, partage public, connexion, profil, export).
- **Moyen** : CI GitHub Actions (tsc + eslint + vitest) avant chaque deploy Vercel.

---

## Priorisation conseillée (roadmap 3 mois — réactualisée avril 2026)

### Items déjà livrés (archive)
| Chantier | Statut |
|---|---|
| Supprimer compte, préférences notifications, 2FA TOTP | ✅ `8eae0ca`/`faa9e4b`/`c24eb61` |
| Extension org_type (agency/syndic/hotel_group/bank) | ✅ `dd95467` |
| Stripe Checkout upgrade Pro | ✅ `d323bd8` (reste config Stripe/Vercel) |
| Sentry + PostHog + /status | ✅ `30a9425` |
| Bail numérique + signature eIDAS | ✅ `6d10f3f` |
| Persistance hôtels + rôles | ✅ `bb80471` |
| API batch + OpenAPI + sandbox | ✅ `2544cf9` |
| Module bail commercial + exonération RP | ✅ `85897ef` |
| Coownerships + appels de fonds + compta + AG | ✅ `3ce993e`/`2ff2385`/`a1fd35e`/`72df70b` |
| Owner report hôtel + forecast ML + PMS webhook | ✅ `ac35c84`/`cb93396`/`cc17ca4` |
| Inspection mobile PWA TEGOVA | ✅ `31339f5` |
| Module IA complet (analyze, chat, extract, challenger EVS) | ✅ Avril 2026 |
| Dashboard /profil type Vercel/Stripe (KPI + workspaces + profile_types) | ✅ Avril 2026 |

### Priorités Q2-Q3 2026 — **100% livré en avril 2026**

| Sprint | Chantier | Vertical | Statut |
|---|---|---|---|
| **1** | ✅ **Module STR `/str/rentabilite` + `/str/compliance` + `/str/arbitrage`** | STR | `8b1c8f9` |
| **1** | ✅ **Fonds de travaux copropriété** (anticipation projet 7763) | Syndic | `a40d8dd` |
| **1** | ✅ **État des lieux mobile PWA** (gestion locative) | Locatif | `6d7ed77` |
| **2** | ✅ **Portail copropriétaire** individuel `/copropriete/[token]` | Syndic | `a40d8dd` |
| **2** | ✅ **Portail locataire** magic link + paiements | Locatif | `45100df` |
| **2** | ✅ `/str/arbitrage` long vs court terme + IA | STR | `8b1c8f9` |
| **3** | ✅ **Messagerie intégrée** copropriété (Supabase Realtime) | Syndic | `e7547a8` |
| **3** | ✅ **OCR factures** copropriété + gestion locative (schéma facture_immo) | Syndic+Locatif | `45100df` + module travaux `4572af1` |
| **3** | ✅ **Dashboard fiscal LU** gestion locative (export 100 F / 102) | Locatif | `45100df` |
| **3** | ✅ **Compset hôtelier LU** seed + table | Hôtel | `6d7ed77` |

### Priorités 6-12 mois — **100% livré en avril 2026**

| Horizon | Chantier | Vertical | Statut |
|---|---|---|---|
| ~~6 mois~~ | ✅ **Module travaux complet copropriété** (projets → devis → BC → factures OCR → garantie) | Syndic | `4572af1` |
| ~~6 mois~~ | ✅ **Réconciliation bancaire** (CAMT.053 + CSV, import manuel — PSD2 natif S2 2026) | Locatif | `e7547a8` |
| ~~6 mois~~ | ✅ **Yield alerts agentic** hôtel (5 types d'alertes + cron Supabase) | Hôtel | `4572af1` |
| ~~6 mois~~ | ✅ **`/str/pricing`** dynamic pricing LU avec saisonnalité + événements | STR | `ad6f599` |
| ~~9 mois~~ | ✅ **AG virtuelle hybride** Jitsi Meet intégré | Syndic | `e7547a8` |
| ~~9 mois~~ | ✅ **Relances impayés paliers 3 niveaux** (PDF conforme loi 21.09.2006) | Locatif | `e7e958e` |
| ~~9 mois~~ | ✅ **Chatbots locataire + copropriétaire** (réutilise `/api/v1/ai/chat`) | Locatif+Syndic | `ad6f599` + `9bc0ef1` |
| ~~12 mois~~ | ✅ **Module motel/aparthotel/résidences hôtelières** (ratios USALI adaptés) | Hôtel | `ad6f599` |
| ~~12 mois~~ | ✅ **Registre EU STR 2024/1028** — génération dossier PDF | STR | `ad6f599` |

### Livrables additionnels avril 2026 (au-delà du plan initial)

| Chantier | Vertical | Commit |
|---|---|---|
| ✅ **Observatoire ADR STR Luxembourg** (12 zones, alternative gratuite à AirDNA) | STR | `4450ceb` |
| ✅ **Portefeuille multi-biens STR** (dashboard conciergerie 10-50 biens) | STR | `ab0ba79` |
| ✅ **Observatoire loyers LT LU** (Mietspiegel-like, 19 zones × 5 typologies) | Locatif | `217da0b` |
| ✅ **GLI comparateur assurance impayés** (5 assureurs LU avec primes indicatives) | Locatif | `9bc0ef1` |
| ✅ **Dashboard conseil syndical** (lecture-seule + détection anomalies automatique) | Syndic | `4450ceb` |
| ✅ **Due diligence hôtelière 50 points** (6 catégories, export PDF, AI synthèse) | Hôtel | `e7e958e` |
| ✅ **Segmentation MICE** (groupes corporate, RFP conversion, F&B capture) | Hôtel | `ab0ba79` |
| ✅ **Certifications ESG Green Key** (29 critères en 7 catégories) | Hôtel | `9067cba` |
| ✅ **OpenAPI 3.1 mis à jour** avec `/api/v1/ai/analyze` + `/chat` + `/extract` | Infra | `4450ceb` |
| ✅ **CI GitHub Actions** (Node 22, tsc + vitest, fix lock out-of-sync) | Infra | `398b0a2` |
| ✅ **Playwright E2E** 8 smoke tests parcours critiques publics | Infra | `e7e958e` |

### Livrables supplémentaires 2026-04-17 (nocturne autonome)

| Chantier | Vertical | Commit |
|---|---|---|
| ✅ **Benchmark inter-copropriétés** `/syndic/benchmark` — 6 KPIs + percentiles + score composite 0-100 | Syndic | `dd49a07` |
| ✅ **`/str/forecast`** Holt-Winters mensuel (m=12) — import CSV PMS + export, MAPE backtest | STR | `4228ad6` |
| ✅ **Sweep refs temporelles 2025→2026** (FR/EN/DE/PT/LB) — Klimabonus, Marché, Tendances, taux bancaires | i18n | `bf8e707` |
| ✅ **AiChatWidget i18n complet** (welcome, placeholder, erreurs, quota) 5 langues | i18n | `cdb40a1` |
| ✅ **Fix modèle Cerebras** `llama-3.3-70b` → `llama3.1-8b` (allowlist gpt-oss) | AI | `47a89ff` / `c2e5515` |
| ✅ **Fix migrations 025/030** noms de tables copro (`coownership_unit_charges` au lieu de tables fantômes) | DB | `24462e1` |
| ✅ **Fix icônes /profil** emoji → SVG Heroicons dans gradient badge | UX | `88f115b` |
| ✅ **Fix gestion-locative bug silencieux** `tauxVetusteAnnuel=1` → `0.01` (décote 100 % au lieu de 1 %/an) | Locatif | `c74e406` |
| ✅ **202 nouveaux tests Vitest** (str-forecast 16, str-calc 23, estimation 13, esg 10, evs-checklist 9, energy-comparables 10, macro-data 14, demographics 9, market-data 13, gestion-locative 12, asset-types 10, str-observatoire 13, loyer-observatoire 7, propcalc-mortgage 13, propcalc-amortization 11, propcalc-rental 11, propcalc-buyvsrent 8) | Infra | 17 commits |
| ✅ **2 smoke tests Playwright** (/str/forecast, /syndic/benchmark) | Infra | `a18dde0` |

## ⏸️ Prérequis enregistrement société (SARL-S LU prévu)

Fonctionnalités fonctionnelles en code + sandbox/demo, activation prod dès incorporation :

| Feature | Statut code | Bloqueur prod |
|---|---|---|
| **Stripe paiements** (abonnement Pro) | ✅ intégration complète, test mode actif | Stripe Prod key + compte business + KYB Stripe |
| **Stripe factures PDF** (/profil) | ✅ endpoints + UI + fallback @react-pdf/renderer | Idem Stripe prod + numéro TVA LU |
| **Enable Banking PSD2** (réconciliation auto) | ✅ wrapper JWT RS256 + 3 endpoints + page flow | Société enregistrée (Enable Banking exige entité légale pour prod) |

Checklist post-incorporation :
1. Créer Stripe account business LU, récupérer prod keys → remplacer `STRIPE_SECRET_KEY` côté Vercel
2. Request production Enable Banking Control Panel → cocher ASPSPs LU (Spuerkeess/BGL/BIL/ING/Raiffeisen/Post)
3. Mettre à jour mentions légales, CGU, DPA
4. Retirer les bannières "Mode démo" dans /profil, /gestion-locative/reconciliation/psd2, StripeInvoicesSection

En attendant la société, voies opérationnelles :
- **Paiements** : reste en démo / pas d&apos;encaissement réel
- **Réconciliation bancaire** : import manuel CAMT.053 XML ou CSV (déjà fonctionnel sur `/gestion-locative/reconciliation`)

---

### Livrables 11e session 2026-04-17 (gaps résiduels — 6 items)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **/bilan-promoteur phasage multi-tranches** — toggle + 3 tranches (% CA + offset mois), Gantt 48 mois, consolidation besoin financement VEFA étalée | Promoteur | `31a7352` |
| ✅ **/simulateur-aides dossier PDF Klimabonus** — dossier préparatoire Wunnen 2026 avec identité + bien + mesures + barème + checklist 7 docs + next steps | Aides | `31a7352` |
| ✅ **/calculateur-loyer historique plafond légal** — table évolution 2015/2018/2020/2023/2026 avec delta % entre chaque étape | Loyer | `acc958c` |
| ✅ **/frais-acquisition frais annexes** — toggle + 5 postes optionnels (architecte, géomètre, diagnostic, déménagement, courtage) inclus dans total | Frais | `acc958c` |
| ✅ **/estimation historique par adresse** — champ adresse optionnel + filtre history par adresse (vs commune) pour tracker un bien dans le temps | Estimation | `ef5aa58` |
| ✅ **Partage commentaires visiteur** — migration 034 + RPC `post_shared_link_comment` (anonyme, rate-limit 1/min) + form `/partage/[token]` + expand badge dans `/profil/liens-partages` | Partage | `ef5aa58` |

Total session 11 : **+6 gaps BENCHMARK livrés** (FR/EN/DE/PT/LB), 561 tests passent, type-check clean.

### Livrables 10e session 2026-04-17 (gaps résiduels — 10 items)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **/outils-bancaires remboursement anticipé** — tableau complet indemnité remploi LU (max 6 mois d'intérêts), stratégie durée vs mensualité, break-even + 14 tests Vitest | Bancaire | `82219ae` |
| ✅ **/convertisseur-surfaces terrain PAG** — section cadastral → constructible (COS/CMU) × zone PAG + retrait voirie + espace vert | Surfaces | `82219ae` |
| ✅ **/energy/hvac PAC eau-eau** (aquathermie) — 3 produits Viessmann/Waterkotte/Stiebel + SCOP 5.0+ + Klimabonus aligné géothermique | Énergie | `82219ae` |
| ✅ **/hedonique IC 95 %** + significativité statistique (ns/*/**/***) sur 14 coefficients, erreurs-types bootstrap ACT 2018-2024 | Hédonique | `82219ae` |
| ✅ **/calculateur-loyer mode copropriété** — toggle + tantièmes/total + travaux collectifs capitalisés intégrés au capital investi au prorata | Loyer | `e1738f3` |
| ✅ **/propcalc démo cashflow 10 ans** — ComposedChart live avec 5 pays par défaut, sliders apport/taux, KPI rendement/cash-on-cash | PropCalc | `e1738f3` |
| ✅ **/dcf-multi courbe de liquidité** — NOI annuel + cashflow distribuable (NOI − service dette − CAPEX) + cumul | DCF | `f619310` |
| ✅ **/dcf-multi vue mensuelle lease-by-lease** — table 12 mois × N baux année 1 avec indexation et franchises | DCF | `f619310` |
| ✅ **Partage analytics** (/profil/liens-partages) — Migration 033 + RPC `get_shared_link_timeline` + sparkline 30 jours par lien, RGPD-compliant (jour only) | Partage | `425e3cd` |
| ✅ **/portfolio export fiscal LU 100 F** — CSV annexe 190 revenus locatifs avec intérêts/PNO/taxe/gestion/amortissement + totaux | Portfolio | `9c55201` |

Total session 10 : **+10 gaps BENCHMARK livrés** (FR/EN/DE/PT/LB), **+14 tests Vitest** (561 total), type-check clean.

### Livrables 9e session 2026-04-17 (OpenAPI + stats agences + tests)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **OpenAPI 3.1 étendue** — `public/openapi.yaml` complété avec MLV/DCF/capitalisation/frais/plus-values/market-data/propcalc (×5) | API | pending |
| ✅ **RPC `org_agency_stats`** (migration 032) — agrège membres + clés + appels/erreurs + top 5 membres + daily bars, security definer admin-only | B2B | pending |
| ✅ **Composant `OrgAgencyStats`** + intégration `/profil/organisation` (visible uniquement org_type=agency + role admin) | B2B | pending |
| ✅ **Enable Banking → cert X.509 self-signed** (fix "Wrong signature" du mode sandbox) + script `generate_psd2_keys.mjs` refait via node-forge | Locatif | pending |
| ✅ **11 tests Vitest enable-banking** (isConfigured, buildJwt header/payload, signature RSA round-trip, Vercel `\n` literal handling, token cache) | Infra | pending |
| ✅ **Endpoint `/api/psd2/debug`** — retourne JWT décodé + méta config (sans private key) pour diagnostic signature | Locatif | pending |

### Livrables 8e session 2026-04-17 (factures Stripe + heatmap + PSD2)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **Section factures Stripe dans /profil** — liste via `/api/stripe/invoices`, redirect PDF hébergé via `/api/stripe/invoice/[id]` + i18n x5 locales | Profil | `c69309d` |
| ✅ **Fallback local @react-pdf/renderer** (`StripeInvoicePdf.tsx`) conformité LU (art. 61-63 loi TVA 12/02/1979, RGD 24/03/2023) | Profil | `c69309d` |
| ✅ **Heatmap cantons LU** (`/carte`) — SVG choroplèthe 4×3, 12 cantons, gradient vert→rouge par prix m² moyen | Carte | `c69309d` |
| ✅ **GoCardless BAD PSD2** wrapper (`src/lib/gocardless-bad.ts`) — token cache, institutions/requisition/transactions | Locatif | `98502eb` |
| ✅ **Endpoints `/api/psd2/*`** (institutions, requisition POST/GET, transactions) — renvoient 501 si secrets absents | Locatif | `98502eb` |
| ✅ **Page `/gestion-locative/reconciliation/psd2`** — flow guidé : sélection banque → auth SCA → liste comptes → import transactions | Locatif | `98502eb` |

Activation PSD2 : ajouter `GOCARDLESS_BAD_SECRET_ID` + `_KEY` côté Vercel env (free tier 100 requisitions/jour).

### Livrables 7e session 2026-04-17 (polish + tests + macro pays + DCF/geo)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **SEO metadata 6 pages** récentes + 5 pages legacy (bail-commercial, observatoire loyers, noindex portails) | SEO | `f6d5c3f`/`839fc0b` |
| ✅ **Tests price-forecast.ts** (10 tests : scénarios ordonnés, horizon, +10 %/an vérif capital.) | Infra | `f6d5c3f` |
| ✅ **/profil sécurité** — bouton 'Déconnecter toutes mes sessions' (Supabase signOut scope global) | Profil | `bd6dcc8` |
| ✅ **+4 smoke Playwright** (marche/forecast, energy/audit, ais, observatoire-lu) | Infra | `a274d2c` |
| ✅ **PropCalc macro 10 pays** (HICP + propertyGrowth + sources) — FR/DE/BE/NL/IT/ES/PT/UK/US/LU | PropCalc | `1bbc3ba` |
| ✅ **/propcalc badges HICP + immo** sur country cards (exposition UI du macro data) | PropCalc | `e363195` |
| ✅ **Tests url-state.ts** (11 tests : encode/decode, base64, unicode, circular ref) | Infra | `4157ba4` |
| ✅ **Tests storage.ts** (12 tests : CRUD localStorage, corbeille, compteur) | Infra | `4157ba4` |
| ✅ **Tests market-score.ts** (10 tests : liquidity, trend, yield, quartiers) | Infra | `7bb4fd2` |
| ✅ **Tests energy-banking.ts** (16 tests : LTV ajustement, simulation crédit) | Infra | `f8fa558` |
| ✅ **Tests dcf-leases.ts** (18 tests : invariants, reversion, taux effect) | Infra | `f8480bd` |
| ✅ **Tests geoportail.ts** (11 tests : WMS config, viewer URL, coords) | Infra | `4bc4044` |
| ✅ **Tests locale-path.ts** (14 tests : détection locale, no double-prefix) | Infra | `74556c9` |
| ✅ **Tests api-utils.ts** (7 tests : handleCalculation wrapper /api/v1) | Infra | `864f703` |

Total Vitest session 7 : **437 → 536 tests** (+99, +22.7 %).

### Livrables 6e session 2026-04-17 (forecast prix + tests)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **/marche/forecast** — prévisions prix 12-48 mois, 3 scénarios configurables + graphique historique × commune × projection | Marché | `14b238f` |
| ✅ **Tests Vitest energy-audit.ts** (16 tests : scoring, classes, recos, Klimabonus cap) | Infra | `14b238f` |
| ✅ **Tests Vitest statec-tourism.ts** (15 tests : chrono, occupation, ADR croissant, YoY) | Infra | `14b238f` |

Total Vitest : **396 → 437 tests** (+10.4 %), smoke Playwright **10 → 14**.

### Livrables 5e session 2026-04-17 (CI + wizard conseiller + SCI + CCAP/CCTP)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **CI Node 24** actions/checkout + setup-node v4 → v5 (fix Node 20 deprecation warning) | Infra | `edb03e0` |
| ✅ **/wizard-particulier mode conseiller** (URL shareable ?c=&s=&…, clipboard feedback) | Wizard | `34ed6be` |
| ✅ **/plus-values cession parts SCI/SARL** (art. 100 LIR, demi-taux 23 % si ≥ 10 % + > 6 mois) | PV | `34ed6be` |
| ✅ **/calculateur-vrd templates CCAP/CCTP** (loi 08/04/2018 LU, 10 articles + bordereau DQE) | VRD | `34ed6be` |

### Livrables 4e session 2026-04-17 (wrap-up items complexes)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **/bilan-promoteur scénarios multiples côte-à-côte** (duplicate + localStorage + comparaison delta %) | Promoteur | `9a3e5d2` |
| ✅ **/wizard-particulier récap mailto** (body pré-rempli, sans API externe) + bouton Imprimer/PDF | Wizard | `9a3e5d2` |
| ✅ **/estimateur-construction badges STATEC** (indice ICV oct 2025 + Batiprix 2026) | Construction | `9a3e5d2` |
| ✅ **/energy/audit** — **audit guidé 20 questions** en 5 catégories → score 0-100 + classe A-G + plan rénovation hiérarchisé 8 types recos + totaux Klimabonus/reste à charge | Énergie | `2488797` |

### Livrables 3e session 2026-04-17 (ex-partenariats + items restants)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **Observatoire hôtelier LU public** `/hotellerie/observatoire-lu` — STATEC + Eurostat + STR EMEA (ex-Hotrec partenariat) | Hôtel | `45d99bb` |
| ✅ **Page AIS orientation + calculateur 75 %** `/gestion-locative/ais` — partenaires publics, pas de démarchage (ex-AIS partenariat) | Locatif | `45d99bb` |
| ✅ **/outils-bancaires historique 8 ans** BCE/OAT/hypothèque LU/inflation (données publiques) | Bancaire | `dcfce4b` |
| ✅ **/calculateur-loyer simulation post-travaux** — bouton 'Et si je fais des travaux' + gain mensuel/annuel | Loyer | `dcfce4b` |
| ✅ **/vefa GFA** — extrinsèque (banque/assureur, prime 0.3-2 %) vs intrinsèque (fonds propres) | VEFA | `dcfce4b` |
| ✅ **/aml-kyc 8 liens sanctions officielles** UE/OFAC/UN/CSSF/ICIJ/OpenSanctions/World-Check | AML | `d620ba0` |
| ✅ **/estimation historique localStorage** par commune avec delta % vs précédente | Estimation | `3ab3058` |

### Livrables supplémentaires 2026-04-17 (après-midi — gaps BENCHMARK_2026)

| Chantier | Module | Commit |
|---|---|---|
| ✅ **/dcf-multi matrice sensibilité 5×5** cap rate × discount rate (±2pp), Argus-style | DCF | `ffc3809` |
| ✅ **/dcf-multi 4 stress tests pré-configurés** (occupation -20 %, loyer -10 %, taux +200bp, combiné) | DCF | `be040ef` |
| ✅ **/dcf-multi import CSV portefeuille baux** + template téléchargeable | DCF | `9917246` |
| ✅ **/frais-acquisition cas non-résident** (checkbox + disclaimer convention fiscale LU-FR/BE/DE) | Frais | `ffc3809` |
| ✅ **/frais-acquisition achat via société** (SCI/SARL-S) — 5 spécificités fiscales IRC/ICC/amortissement/retenue | Frais | `f92dc1a` |
| ✅ **/bilan-promoteur tornado chart** ±10 % sur 8 variables, triées par amplitude | Promoteur | `ffc3809` |
| ✅ **/vefa retard chantier** (slider 0-24 mois) + surcoût intérêts intercalaires | VEFA | `acde524` |
| ✅ **/partage/[token] bouton Imprimer/PDF** (print CSS, `print:hidden` contrôles) | Partage | `acde524` |
| ✅ **/portfolio cash flow 12 mois glissants** — barres empilées + ligne nette, saisonnalité LU | Portfolio | `dc14078` |
| ✅ **/simulateur-aides badge Barèmes vérifiés** (date dernière vérification visible) | Aides | `be040ef` |
| ✅ **/terres-agricoles viticulture AOP Moselle** — table cépages/zones (Grand 1er Cru → bases) | Agricole | `43fbf63` |
| ✅ **/hedonique badge calibration Q1 2026** + lien méthodologie publique | Hédonique | `cbf0d38` |
| ✅ **/valorisation EVS 3 templates rapport** — standard / bancaire MLV / judiciaire / succession + commissionnaire | EVS | `98f9eff` |
| ✅ **/estimateur-construction bordereau CSV/Excel** — export par corps de métier prêt à envoyer aux entreprises | Construction | `9917246` |
| ✅ **/plus-values report d'imposition** (art. 102 LIR) — toggle + 4 conditions + impact trésorerie | PV | `5916d2d` |

### Déjà couvert (vérifications réalisées)

| Gap listé | Statut | Commentaire |
|---|---|---|
| Plus-values exonération RP auto | ✅ Déjà en place | `estResidencePrincipale` + `rpOccupeeAuMomentVente` + `moisDepuisDepart` |
| Achat vs location coût opportunité | ✅ Déjà en place | `rendementPlacement` + `indexationLoyer` + `appreciationAn` |
| Wizard particulier sauvegarde état | ✅ Déjà en place | localStorage `tevaxia_wizard_particulier_draft` |
| PAG-PAP calculateur CMU/COS | ✅ Déjà en place | `ZONES_PAG` + calcul constructibilité |
| Estimateur construction ventilation par lot | ✅ Déjà en place | `totalParCategorie` + barre horizontale empilée + tableau détaillé |

Passe de **194 → 396 tests unitaires Vitest** (+104 %), 16 → 32 fichiers de tests.

### Ex-'reste à chantier' convertis en items autonomes (2026-04-17)

Doctrine : on n'est pas légitime pour démarcher des fédérations ou des
sociétés. On vise uniquement des données publiques, des APIs self-serve
et des sources open sources.

| Item | Approche autonome | Statut |
|---|---|---|
| ~~Panel Hotrec LU RevPAR~~ | ✅ **Observatoire STATEC/Eurostat/STR** `/hotellerie/observatoire-lu` — données publiques trimestrielles | ✅ Livré |
| ~~Partenariat AIS LU~~ | ✅ **Page orientation AIS** `/gestion-locative/ais` — calculateur abattement 75 % + liste partenaires publics | ✅ Livré |
| ~~PSD2 natif~~ | CAMT.053 + CSV manuel en place (`e7547a8`). Pour PSD2 auto, le user peut créer un compte GoCardless BAD (free tier EU, 100 calls/jour) lui-même. Pas de démarchage. | 📋 Décision commerciale user |
| ~~Certification RICS AVM Executive~~ | `/transparence` publique avec MAPE 14,7 % + R² + coefficients est suffisant pour transparence. La certification elle-même = frais admin RICS ~3-5k£. | 📋 Décision commerciale user |

## Priorités structurelles continues

- 🟢 **Modèle hédonique re-calibré + MAPE public** ✅ `8e07b59`
- 🟠 Certification RICS AVM Executive (chantier lourd — partenariat tiers nécessaire)
- 🟠 Playwright E2E sur 10 parcours clés (différé — 172 tests unitaires Vitest + 22 tests routes IA en place)
- 🟠 CI GitHub Actions (tsc + eslint + vitest) avant deploy Vercel

---

## Sources et méthodologie

Ce benchmark s'appuie sur :
- Analyse publique des sites concurrents listés (pages produit, documentation, screenshots publics, billets de blog)
- Études sectorielles publiques : Urban Land Institute « Emerging Trends in Real Estate » 2024/2025/2026, RICS Europe Valuation Report, Observatoire de l'Habitat LU rapports trimestriels
- Revues hôtellerie 2026 : Horwath HTL « European Hotel Valuation Index » 2025, STR Global / CoStar « EMEA Performance Report » Q4 2025 + forecast 2026, HotelTechReport.com top rankings 2026, PwC Hospitality Outlook 2026
- Revues STR/Airbnb 2026 : StaySTRA pricing tools comparison, AirDNA market intelligence, Hotel Tech Report « Best Airbnb pricing tools 2026 », EU Regulation 2024/1028 short-term rentals
- Revues syndic 2026 : Matera blog + Cotoit blog (comparatifs syndic en ligne France/Belgique 2026), ImmoCompare, CasaCalida
- Guides réglementaires LU : Loi 16.05.1975 (consolidée 01/03/2024), projet de loi 7763 (fonds de travaux), loi 21.09.2006 (bail habitation), loi 03.02.2018 (bail commercial), art. 102bis LIR
- Guides réglementaires EU : TEGOVA EVS 2025 Charter 5e éd., EBA Guidelines on Loan Origination LTV, CSSF Circulaires, EPBD IV refonte 2024, EU STR Regulation 2024/1028
- Sources fiscales LU STR : Airbnb Tax Guide Luxembourg 2026 (PwC), guichet.lu, Delano.lu articles 2024-2025 sur régulation Airbnb LU
- Retours utilisateurs early adopters (conversations avec 3 agences LU, 1 banque régionale, 2 évaluateurs TEGOVA)

**Dernière mise à jour** : 2026-04-17 (7 sessions : 37 gaps livrés + 2 ex-partenariats autonomes + CI Node 24 + **536 tests Vitest** (+176 %) + 14 smoke Playwright + SEO 11 pages).

**Prochaine révision** : 2026-10-15 (tous les 6 mois, avant freeze budget Q4) ou plus tôt si entrée en vigueur EU STR Regulation / projet loi 7763.
