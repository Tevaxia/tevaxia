# Benchmark international tevaxia.lu — avril 2026

**Objectif** : pour chaque module en ligne sur tevaxia.lu, identifier les leaders internationaux/régionaux, les fonctionnalités qu'ils offrent et qu'on n'a pas, les pistes d'amélioration classées par horizon (court : 1-4 semaines / moyen : 1-3 mois / long : 3-12 mois).

**Méthode** : analyse des 7 familles métier (particulier, investisseur, promoteur, agent, banque, syndic, hôtellerie) + modules transverses (énergie, données, compte utilisateur). Sources benchmarks : sites officiels, études sectorielles publiques, revues professionnelles (Urban Land Institute, RICS, TEGOVA, STR Global, HOTREC, IREBS).

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
- Pas de **mode « inspection terrain »** (photo + geotag + notes vocales transcrites) pour collecter les données sur place
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
- Pas de **calibration temporelle** (les coefficients sont fixes — ils devraient varier avec le cycle)
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
- Pas de **support bail commercial** (règles différentes)

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

## 17. Gestion locative LU (`/gestion-locative`)

**Usage** : propriétaire 1-10 lots + syndics 10-100 lots, focus règle 5 % + Klimabonus.

**Benchmarks** :
- Rentila (FR, leader solo), Smovin (BE), AppFolio/Buildium (US, pros), Rentler, Hemlane
- Aucun n'intègre la règle des 5 % luxembourgeoise

**Ce qu'on a** : CRUD lots, analyse règle 5 %, détection Klimabonus (E/F/G), summary portefeuille (yield, alertes), sync cloud 500 items/180j.

**Gaps identifiés** :
- Pas de **suivi paiements** (qui a payé quand)
- Pas d'**appel de loyer** (génération quittance mensuelle)
- Pas de **bail numérique** (template + signature)
- Pas d'**état des lieux** mobile (photos, checklist)
- Pas de **multi-occupants** par lot (colocation)

**Pistes d'amélioration** :
- **Court** : sous-collection `rental_payments` (locataire, date, montant, statut) avec sync cloud.
- **Moyen** : génération automatique quittance PDF mensuelle, envoi email programmé.
- **Long** : bail numérique intégré (template conforme loi LU du 21.09.2006, signature Yousign/LuxTrust), état des lieux PWA.

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

## 25. Hôtellerie (6 outils) — `/hotellerie/*`

**Sous-outils** : Valorisation, DSCR, Exploitation USALI, Rénovation, RevPAR comparison, Score E-2.

**Benchmarks** :
- STR Global / CoStar (compset, prix €5-20k/an)
- Outils institutionnels : Cushman & Wakefield, JLL Hotels, HVS, PKF Consulting
- Accessibles : HVS Anarock, OHG (Onsite Hospitality Group), Aduro (US)

**Ce qu'on a** : 6 outils complets avec ratios USALI par catégorie, stress tests DSCR, compset MPI/ARI/RGI, Klimabonus tertiaire, score visa E-2.

**Gaps identifiés** :
- Pas d'**ingestion données marché live** (RevPAR moyens par ville LU/région)
- Pas d'**agrégation STR-like** (panel d'hôteliers partageant leurs données anonymisées)
- Pas d'**échantillon comparables** transactionnels (historique des ventes d'hôtels LU/BE/DE)
- Pas de **due diligence checklist** (audit complet avant acquisition)
- Pas d'**intégration avec OTA** (connecteurs Booking/Expedia pour taux d'occupation réels)

**Pistes d'amélioration** :
- **Court** : publier une table de benchmarks RevPAR par ville et catégorie (Luxembourg, Metz, Saarbrücken, Trèves, Liège) basée sur données publiques STR / Horwath.
- **Moyen** : due diligence PDF checklist 50 points (technique/commercial/juridique/fiscal).
- **Long** : panel Hotrec LU (accord avec la fédération) pour un MPI/ARI/RGI live sur adhésion réciproque.

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
- Pas d'**authentification forte** (2FA, TOTP, WebAuthn)
- Pas de **gestion de sessions actives** (« déconnecter tous les appareils »)
- Pas d'**historique d'activité** (journal audit des actions)
- Pas de **notifications centralisées** (préférences email/SMS par type d'événement)
- Pas de **suppression compte self-service** (RGPD — actuellement nécessite email)
- Pas de **gestion des consentements granulaire** (marketing, analytics, tiers)
- Pas de **impersonation admin** (pour le support, « voir comme cet utilisateur »)
- Pas de **facture PDF** (quand tu factures un tier Pro, il faut émettre une facture conforme LU)
- Pas de **moyen de paiement** stocké (Stripe Checkout intégré pour upgrade Pro)

**Pistes d'amélioration** :
- **Court** : bouton « Supprimer mon compte » déclenchant cascade (évaluations, lots, liens, alertes, clés). Logs audit pour 1 an post-suppression (pour contestation).
- **Court** : préférences notifications (alertes marché par email OUI/NON, récap mensuel OUI/NON).
- **Moyen** : 2FA via TOTP (Google Authenticator, Authy), écran « mes sessions actives », bouton « Déconnecter tout sauf ici ».
- **Moyen** : Stripe Checkout pour upgrade self-service Pro (abonnement mensuel €29/mois, annuel €290). Webhook → auto-update `user_tiers`. Facture PDF auto-générée conforme loi LU.
- **Long** : consentements RGPD granulaires (dashboard complet conforme Art. 7 RGPD), impersonation admin sécurisée pour le support.

---

## 29bis. Comptes & rôles verticaux métier (Syndic, Hôtellerie)

**État actuel** : la table `organizations` + `org_members` (rôles `admin`, `member`, `viewer`) est **mono-pattern, pensée pour les agences immo**. Elle ne couvre ni les spécificités syndic/copropriété ni la gestion multi-hôtels. Aucun rôle métier spécifique n'existe pour ces deux verticaux.

### 29bis.A — SYNDIC & COPROPRIÉTÉ

**Acteurs métier à modéliser** :

| Rôle | Description LU | Équivalent dans l'outil actuel |
|---|---|---|
| Syndic (gestionnaire) | Mandaté par l'AG, exécute budget et travaux | ❌ absent |
| Président du conseil syndical | Copropriétaire représentant, contre-pouvoir | ❌ absent |
| Membre du conseil syndical | Élu, consulté | ❌ absent |
| Copropriétaire (simple) | Détient un ou plusieurs lots, vote en AG | ❌ absent |
| Locataire du copropriétaire | Accès restreint (charges, règlement) | ❌ absent |
| Prestataire (entreprise travaux) | Reçoit bons de commande, factures | ❌ absent |

**Benchmarks** :
- **France** : Cotoit (SaaS syndic, 50k+ lots gérés), Matera (syndic bénévole, 40k copropriétés), Qlower, Homeland (syndic pro-am), Syndic One
- **Belgique** : Syndics.be, Smovin (focus gestion locative mais embarque quelques modules copropriété)
- **Suisse** : Swissacc, IAZI
- **Allemagne** : Facilis (WEG Verwaltung), ETG24, Casavi
- **Luxembourg** : aucun acteur dominant — **marché vierge côté SaaS**

**Fonctionnalités différenciantes observées chez les leaders** :
- **AG virtuelle** : convocation en ligne, ordre du jour, vote électronique conforme loi, compte-rendu généré automatiquement
- **Appels de fonds** : génération mensuelle par quote-part (millièmes), relances automatiques, suivi paiement
- **Espace copropriétaire** : accès propre (charges, règlement, PV d'AG, documents contractuels)
- **Gestion travaux** : appels d'offres, bons de commande, factures, paiement entreprises
- **Comptabilité copropriété** : plan comptable spécifique (CCAC LU), clôture annuelle, rapport syndic
- **Module conseil syndical** : vérification comptes, alertes anomalies
- **Archivage 10 ans** : conformité légale LU (loi du 16 mai 1975 + réforme 2020)

**Gaps critiques chez nous** :
- Pas de concept de **copropriété** (entité regroupant lots + quotes-parts + règlement)
- Pas de **quotes-parts / tantièmes** (millièmes) pour répartir charges
- Pas de **plan comptable copropriété** (compte 10 charges, 20 travaux, 30 réserves…)
- Pas d'**appels de fonds** automatiques
- Pas d'**espace copropriétaire** (portail restreint)
- Pas de **gestion d'AG** (convocation/vote/PV)
- Pas de **multi-copropriétés par syndic** (un syndic gère 20-200 copros)

**Pistes d'amélioration — compte & rôles syndic** :

**Court (1-4 semaines)** :
- Étendre `org_role` avec `syndic`, `conseil_syndical`, `coproprietaire`, `locataire`, `prestataire`
- Ajouter un champ `org_type` sur `organizations` ('agency' | 'syndic' | 'hotel_group' | 'bank' | 'other') pour basculer UI selon métier
- Ajouter un bandeau adapté dans `/profil` selon le type d'organisation

**Moyen (1-3 mois)** :
- Nouvelle table `coownerships` (immeubles sous gestion d'un syndic) avec quotes-parts par lot
- Table `coowners` (copropriétaires) avec rôle et lots rattachés
- Espace `/syndic/coproprietes` listant les copropriétés gérées + CRUD
- Espace copropriétaire restreint `/syndic/copro/[slug]` accessible via invitation email

**Long (3-12 mois)** :
- Module appels de fonds + suivi paiements (génération PDF mensuel conforme LU)
- Plan comptable copropriété LU avec clôture annuelle exportable pour l'expert-comptable
- Module AG virtuelle (convocation + vote électronique loi LU + PV auto)
- Module travaux : appels d'offres, bons de commande, suivi facturation

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
- Pas de concept d'**hôtel persisté** (chaque simulation est ponctuelle, pas liée à un établissement)
- Pas de **historique multi-périodes** (l'hôtel Belair Plaza au 2025-Q1 vs 2025-Q2)
- Pas de **rôles hôteliers distincts** (propriétaire vs directeur vs revenue manager)
- Pas de **multi-hôtel** pour un groupe
- Pas de **connecteur PMS** (injection données réelles depuis OPERA/Mews/Cloudbeds via API)
- Pas de **espace propriétaire** (owner report mensuel automatisé)
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
- Pas de **monitoring erreurs client** (Sentry absent — un user qui crash ne nous le dit pas)
- Pas de **alerting latence/uptime** (statut public /status)
- Pas de **tests E2E** (Playwright absent — que des tests unitaires Vitest)
- Pas de **CI/CD explicite** (Vercel déploie auto mais pas de pipeline de tests)
- Pas de **analytics produit** (PostHog, Mixpanel — Google Analytics ne suffit pas pour l'usage détaillé par outil)

**Pistes d'amélioration** :
- **Court** : Sentry gratuit + PostHog self-hosted gratuit.
- **Moyen** : Playwright sur les 10 parcours clés (estimation, frais, aides, loyer, wizard, gestion locative, partage public, connexion, profil, export).
- **Long** : page /status publique avec uptime 30j, latence p50/p95 par endpoint API.

---

## Priorisation conseillée (roadmap 3 mois)

| Sprint | Chantier | Impact business |
|---|---|---|
| 1 | ~~Supprimer compte~~ ✅ `8eae0ca` + ~~préférences notifications~~ ✅ `faa9e4b` + ~~2FA TOTP~~ ✅ `c24eb61` | Conformité RGPD, sécurité |
| 1 | ~~**Extension org_type (agency/syndic/hotel_group/bank)**~~ ✅ `dd95467` | Débloque verticaux syndic/hôtellerie |
| 1 | ~~Stripe Checkout upgrade Pro self-service~~ ✅ `d323bd8` — *reste à créer produit/price/webhook côté Stripe Dashboard + env vars Vercel* | Monétisation |
| 2 | ~~Sentry + PostHog + page /status~~ ✅ `30a9425` — *reste à créer projet Sentry + project PostHog + env vars Vercel* | Observabilité |
| 2 | ~~Sauvegarde wizard + gestion-locative : bail numérique template~~ ✅ `6d10f3f` | Différenciation produit |
| 2 | **Persistance hôtels (table `hotels`) + rôles hôteliers** | Récurrence usage vertical hôtellerie |
| 3 | API batch + OpenAPI docs + sandbox | Différenciation B2B banques |
| 3 | Module bail commercial + exonération RP plus-value | Complétude fiscale LU |
| 3 | **Table `coownerships` + CRUD copropriétés syndic** | Premier MVP vertical syndic |

## Priorisation 6-12 mois

| Horizon | Chantier | Type |
|---|---|---|
| 6 mois | Module gestion paiements locatifs + quittances auto | Produit |
| 6 mois | Panel Hotrec LU pour RevPAR live | Partenariat |
| 6 mois | Modèle hédonique re-calibré + rapport MAPE public | Crédibilité |
| 6 mois | **Owner report mensuel hôtelier PDF auto** | Rétention hôtels |
| 6 mois | **Appels de fonds copropriété + suivi paiements** | Cœur SaaS syndic |
| 9 mois | Inspection mobile PWA TEGOVA | Produit |
| 9 mois | Certification RICS AVM Executive | B2B banques |
| 9 mois | **Connecteur PMS (Mews, Cloudbeds) ingestion quotidienne** | Différenciateur hôtel |
| 9 mois | **AG virtuelle copropriété (convocation + vote + PV)** | Feature killer syndic |
| 12 mois | Module bail commercial complet + tableaux ILC LU | Niche experts |
| 12 mois | **Forecast ML 90 jours hôtel (ARIMA/Prophet)** | Intelligence revenue mgmt |
| 12 mois | **Comptabilité copropriété LU (plan comptable + clôture)** | Pro syndic complet |

---

## Sources et méthodologie

Ce benchmark s'appuie sur :
- Analyse publique des sites concurrents listés (pages produit, documentation, screenshots publics, billets de blog)
- Études sectorielles publiques : Urban Land Institute « Emerging Trends in Real Estate » 2024/2025, RICS Europe Valuation Report, Observatoire de l'Habitat LU rapports trimestriels
- Revues hôtellerie : Horwath HTL « European Hotel Valuation Index » 2025, STR Global « EMEA Performance Report »
- Guides réglementaires : TEGOVA EVS 2025 Charter 5e éd., EBA Guidelines on Loan Origination LTV, CSSF Circulaires
- Retours utilisateurs early adopters (conversations avec 3 agences LU, 1 banque régionale, 2 évaluateurs TEGOVA)

**Dernière mise à jour** : 2026-04-15.

**Prochaine révision** : 2026-10-15 (tous les 6 mois, avant freeze budget Q4).
