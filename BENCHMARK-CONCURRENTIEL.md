# Benchmark concurrentiel tevaxia.lu & energy.tevaxia.lu

> Date : 4 avril 2026 | Analyse exhaustive de 19 outils vs meilleurs concurrents

---

## PARTIE A — TEVAXIA.LU (12 outils)

---

### 1. Estimation instantanee

**Description tevaxia** : Modele hedonique simplifie combinant prix/m2 par commune (Observatoire), ajustements statistiques (etage, etat, exterieur, parking, classe energie, surface, neuf/ancien), double modele transactions vs annonces, indice de confiance, fourchette basse/centrale/haute, bail emphyteotique, estimation renovation, export PDF, partage URL.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **logement.public.lu** (Observatoire de l'Habitat) | https://logement.public.lu/fr/observatoire-habitat/prix-de-vente/simulateur.html | Simulateur officiel LU, double modele hedonique (actes notaries + annonces Immotop), intervalle de confiance 90%, base sur 12 derniers mois |
| **atHome.lu** | https://www.athome.lu/en/estimate | Algorithme base sur annonces similaires, lien vers expertise agent sur site, enorme base de donnees d'annonces LU |
| **MeilleursAgents** (France) | https://www.meilleursagents.com/estimation-immobiliere/ | N1 France, 1 estimation/8 sec, donnees notariales + agences, granularite rue, mise a jour mensuelle |

#### Ce qu'ils font MIEUX

- **logement.public.lu** : Intervalle de confiance statistique a 90% (methodologie rigoureuse), modele hedonique calibre sur actes notaries reels (pas d'annonces seulement), source officielle avec credibilite institutionnelle.
- **atHome.lu** : Base de donnees massive d'annonces LU (part de marche dominante), connexion directe avec agents pour estimation in situ, reconnaissance de marque LU.
- **MeilleursAgents** : Granularite a l'adresse exacte (pas juste commune), historique prix 5 ans consultable, carte interactive integree, estimation en 2 minutes chrono, comparables affiches.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- Double modele transactions vs annonces avec ecart en % affiche (transparence methodologique).
- Ajustements detailles visibles (etage, etat, exterieur, parking) avec coefficients explicites.
- Integration classe energie avec impact chiffre sur le prix.
- Estimation emphyteotique (decote bail emphyteotique).
- Estimation couts de renovation integree.
- Export PDF professionnel, partage par URL avec parametres.
- Alerte marche integree.

#### 5 ameliorations proposees

1. **Ajouter comparables visuels** : Afficher 3-5 transactions recentes proches (type, surface, prix, date) comme MeilleursAgents. Source : Open Data LU (data.public.lu) ou annonces Immotop.
2. **Granularite infra-communale** : Pour Lux-Ville et Esch, descendre au quartier avec donnees specifiques (Belair vs Gasperich). Deja partiellement present mais a enrichir avec les 24 quartiers de Lux-Ville.
3. **Historique d'evolution** : Afficher la courbe d'evolution du prix/m2 sur 3-5 ans pour la commune selectionnee (deja les donnees existent dans market-data, les rendre plus visibles).
4. **Mode "maison"** : Etendre le modele aux maisons (terrain, garage, nombre d'etages) en plus des appartements. Le formulaire est oriente appartement.
5. **Certification du resultat** : Ajouter un QR code sur le PDF menant a l'estimation en ligne (anti-falsification), et un hash de verification, pour donner de la credibilite bancaire.

---

### 2. Carte des prix

**Description tevaxia** : Carte Leaflet interactive de toutes les communes LU, code couleur par tranche de prix, 4 vues (existant, VEFA, annonces, rendement locatif), tri par canton/prix/nom, recherche commune, fiche commune avec evolution, demographics, score marche, cycle marche, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **MeilleursAgents Carte des prix** | https://www.meilleursagents.com/prix-immobilier/ | Zoom national > rue, code couleur, filtres appart/maison, mise a jour mensuelle |
| **ImmoScout24 Preisatlas** | https://atlas.immobilienscout24.de/ | 43M+ biens, ML Sprengnetter, donnees demographiques Deutsche Post, 4 ans historique, zoom adresse |
| **DVF Etalab** (France) | https://app.dvf.etalab.gouv.fr/ | Transactions reelles geolocalises sur carte, parcelle cadastrale, donnees 5 ans, telechargement brut |

#### Ce qu'ils font MIEUX

- **MeilleursAgents** : Zoom jusqu'a la rue (tevaxia = commune), filtres par type de bien (appart vs maison), tendances dynamiques par zone.
- **ImmoScout24** : Donnees socio-demographiques enrichies (age moyen, duree residence, statut matrimonial), AI/ML pour les prix, comparable properties affiches.
- **DVF** : Transactions reelles geolocalises parcelle par parcelle (transparence absolue), donnees brutes telechargeables.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- Vue rendement locatif integree (rapport loyer/prix par commune) — aucun concurrent ne propose ca.
- Score de marche composite et cycle de marche (indicateur acheteur/vendeur).
- Demographics enrichies par commune (population, tranches d'age, frontaliers).
- 4 modes de vue (existant, VEFA, annonces, rendement) sur la meme carte.

#### 5 ameliorations proposees

1. **Zoom infra-communal** : Pour les grandes communes (Lux-Ville, Esch, Differdange), afficher les quartiers avec contours polygones. Lux-Ville a 24 quartiers avec des ecarts de +3000 EUR/m2.
2. **Heatmap par prix** : Remplacer ou completer les marqueurs par une heatmap continue (interpolation), visuellement plus parlant que des points isoles.
3. **Filtre temporel** : Ajouter un slider temporel (T1 2023 -> T1 2026) pour voir l'evolution animee des prix par commune.
4. **Comparaison multi-commune** : Permettre de selectionner 2-3 communes et voir une comparaison cote a cote (prix, evolution, rendement, demographics).
5. **Donnees transactions reelles** : Integrer les donnees Open Data (data.public.lu) de ventes par commune pour afficher les volumes et prix medians reels vs annonces.

---

### 3. Calculateur de loyer (capital investi)

**Description tevaxia** : Calcul du plafond legal du loyer (5% du capital investi), revalorisation par coefficients, integration travaux, vetuste, colocation, meuble, affichage des coefficients de reval, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **logement.public.lu simulateur loyers** | https://logement.public.lu/fr/observatoire-habitat/prix-de-location/simulateur.html | Simulateur officiel base sur donnees annonces, estimation loyer marche (pas capital investi) |
| **logement.public.lu fichier Excel** | https://logement.public.lu/fr/locataire/bail-loyer.html | Tableur Excel telechargeable pour calcul capital investi pas-a-pas |
| **Brochure gouvernementale PDF** | https://gouvernement.lu/dam-assets/documents/actualites/2021/04-avril/23-brochure-simulateur-calcul/Brochure-Calcul-du-plafond-legal-du-loyer.pdf | Guide papier avec exemples |

#### Ce qu'ils font MIEUX

- **logement.public.lu simulateur** : Source officielle, credibilite institutionnelle, donnees marche reelles.
- **Fichier Excel officiel** : Detail pas-a-pas de chaque composante du capital investi (terrain + construction + ameliorations + frais accessoires), tres pedagogique.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Seul outil web interactif** pour le calcul du plafond legal au Luxembourg (l'officiel est un Excel a telecharger).
- Integration colocation (repartition entre colocataires).
- Option meuble (+40% implicite).
- Vetuste paramerable.
- Export PDF structure.
- Liens vers outils connexes (frais d'acquisition, plus-values).

#### 4 ameliorations proposees

1. **Decomposition capital investi detaillee** : Comme le tableur officiel, permettre la saisie separee de : terrain, construction, ameliorations, frais accessoires (notaire, architecte), equipements. Actuellement trop simplifie (juste prix achat + travaux).
2. **Loyer marche vs plafond legal** : Afficher cote a cote le loyer marche moyen de la commune (donnees existantes dans market-data) vs le plafond legal calcule, pour montrer l'ecart.
3. **Mode locataire** : Ajouter un mode "Verifier mon loyer" ou le locataire entre son loyer actuel et les donnees du bien, et l'outil dit si le loyer est conforme ou excessif (avec % de depassement).
4. **Reference juridique interactive** : Liens cliquables vers les articles pertinents de la loi du 21/09/2006 modifiee, avec popup explicatif pour chaque terme technique.

---

### 4. Frais d'acquisition

**Description tevaxia** : Calcul detaille des frais (enregistrement 6%, transcription 1%, notaire, hypotheque), Bellegen Akt (credit d'impot 30k/40k par personne), neuf vs ancien avec split terrain/construction, TVA 3% construction neuve, graphique camembert, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **FraisDeNotaire.lu** | https://fraisdenotaire.lu/ | 4 champs, estimation instantanee, interface minimaliste |
| **TheAgency.lu** | https://www.theagency.lu/en/tools/cost/ | Calculateur frais acquisition + charges mensuelles, integre credit utilise precedemment |
| **Nexvia.lu** | https://www.nexvia.lu/acquisition-monthly-charge | Couts acquisition + charge mensuelle, design moderne |

#### Ce qu'ils font MIEUX

- **FraisDeNotaire.lu** : Extreme simplicite (4 champs), reponse immediate, UX tres accessible pour le grand public.
- **TheAgency.lu** : Integre les charges mensuelles post-achat, prend en compte le credit Bellegen Akt deja utilise precedemment.
- **Nexvia.lu** : Design soigne, combine acquisition + simulation de pret dans le meme flux.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- Split terrain/construction pour le neuf (TVA 3% sur construction vs 7% sur terrain).
- Hypotheque detaillee avec montant specifique.
- Graphique camembert de repartition des frais.
- Nombre d'acquereurs (1 ou 2) avec impact Bellegen Akt.
- Export PDF professionnel.

#### 4 ameliorations proposees

1. **Flux integre vers simulateur pret** : Apres calcul des frais, bouton "Simuler le financement" qui pre-remplit les outils bancaires avec prix + frais = montant total a financer.
2. **Comparateur ancien vs neuf** : Afficher cote a cote les frais pour le meme bien en ancien vs neuf (si applicable) pour illustrer l'economie.
3. **Historique Bellegen Akt** : Permettre de saisir le credit d'impot deja utilise (comme TheAgency), car un acheteur peut avoir deja consomme une partie du plafond.
4. **Frais reels vs estimation** : Ajouter une mention "plage" avec fourchette (les honoraires notaire varient legerement), et lien vers le bareme officiel de la Chambre des Notaires.

---

### 5. Plus-values immobilieres

**Description tevaxia** : Calcul plus-value (speculation <2 ans vs cession >2 ans), coefficients de reevaluation officiels, abattement 50k/100k, demi-taux global, exoneration residence principale, frais acquisition et travaux deductibles, badge type (exonere/speculation/cession).

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **PlusValue.lu** | https://www.plusvalue.lu/ | Coefficients fiscaux automatiques, conversion LUF pre-2002, succession/heritage, terrain devenu constructible, projection 3 ans, prix minimum de vente |
| **Nexvia.lu capital gain** | https://www.nexvia.lu/capital-gain-tax | Profil vendeur, taux marginal, distinction speculative/long terme |
| **Selexium** (France) | https://www.selexium.com/outils/simulateur-plus-value-immobiliere/ | Simulateur FR avec abattements duree, prelevement sociaux, surcharge |

#### Ce qu'ils font MIEUX

- **PlusValue.lu** : Mode succession/heritage avec annee deces et valeur successorale, terrain devenu constructible, projection 3 ans avec appreciation 2%, prix minimum pour ne pas perdre d'argent, conversion LUF avant 2002.
- **Nexvia.lu** : Taux marginal d'imposition personnalise, integration du profil fiscal complet du vendeur.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- Integration dans un ecosysteme complet (lien estimation + frais + valorisation).
- Export PDF professionnel avec detail du calcul.
- Badge visuel type de gain (exonere/speculation/cession).
- Interface multilingue (FR/EN/DE/PT/LB).

#### 5 ameliorations proposees

1. **Mode succession/donation** : Ajouter le calcul pour les biens herites ou recus en donation (base = valeur declaree, coefficient depuis annee du deces/donation). PlusValue.lu le fait deja.
2. **Conversion LUF** : Pour les acquisitions avant 2002, permettre la saisie en LUF avec conversion automatique.
3. **Taux marginal personnalise** : Demander le revenu imposable pour calculer le taux effectif au lieu d'utiliser un demi-taux simplifie.
4. **Projection prix de vente optimal** : Calculer l'annee optimale de vente (quand l'impot est minimise grace a l'indexation progressive du coefficient).
5. **Report/immunisation** : Integrer le mecanisme de report d'imposition (art. 102, 102bis LIR) en cas de remploi dans les 2 ans.

---

### 6. Simulateur d'aides

**Description tevaxia** : Aides etatiques (acquisition, energie), privees, communales, patrimoine. Detail par aide avec montant, conditions, categorie, nature (directe/economie/garantie). Autocomplete commune, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Klima-Agence simulateur** | https://aides.klima-agence.lu/ | Simulateur officiel aides energetiques + communales, mis a jour regulierement |
| **Klima-Agence simulateur renovation** | https://renover.klima-agence.lu/ | Simulation renovation complete avec impact energetique en temps reel |
| **guichet.public.lu** | https://guichet.public.lu/fr/citoyens/aides/logement-construction/ | Liste exhaustive des aides publiques avec conditions detaillees |

#### Ce qu'ils font MIEUX

- **Klima-Agence** : Source officielle, mise a jour garantie quand les montants changent, integration des aides communales specifiques reelles (pas estimees), credibilite institutionnelle, simulation renovation avec impact energetique temps reel.
- **guichet.public.lu** : Exhaustivite des conditions d'eligibilite, formulaires telechargeable, fiches detaillees par aide.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Vue consolidee** : Toutes les aides (acquisition + energie + communales + patrimoine) dans un seul outil. Klima-Agence ne couvre que l'energie, guichet.lu est dispersee par fiche.
- Classification par categorie et nature (directe/economie/garantie).
- Integration dans le flux d'achat (lien vers estimation, frais, pret).
- Export PDF unifie de toutes les aides cumulees.
- Mode investisseur (aides applicables a un bien locatif).

#### 5 ameliorations proposees

1. **Synchronisation Klimabonus 2026** : Mettre a jour les montants avec le nouveau regime Klimabonus Wunnen 2026 (euros/m2 standardises, bonus materiaux ecologiques). Verifier que les taux dans le code correspondent aux baremes officiels 2026.
2. **Aides communales reelles** : Pour chaque commune, integrer les montants exacts des aides communales (pas juste une estimation). Source : sites web des communes + base Klima-Agence.
3. **Eligibilite dynamique** : Ajouter des questions filtres (revenus, premiere acquisition, age du bien) pour exclure les aides non-eligibles et ne montrer que les aides pertinentes.
4. **Topup social** : Integrer le "Topup social Klimabonus" (doublement des aides sous conditions de revenus) — c'est nouveau en 2026.
5. **Timeline de versement** : Indiquer pour chaque aide le delai moyen de versement et les pieces requises, pour aider a planifier la tresorerie.

---

### 7. Achat vs Location

**Description tevaxia** : Comparaison financiere sur 30 ans, graphique croise (patrimoine achat vs location), deduction interets debiteurs art. 98bis LIR (2000/1500/1000 EUR), assurance SRD, charges copro, taxe fonciere, entretien, appreciation, mode quick/full, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **NYT Rent vs Buy** | https://www.nytimes.com/interactive/2014/upshot/buy-rent-calculator.html | Reference mondiale, UX interactive, variables visuelles, breakeven dynamique |
| **NerdWallet** | https://www.nerdwallet.com/mortgages/calculators/rent-vs-buy-calculator | Donnees US actualisees, previsions economiques integrees |
| **Zillow** | https://www.zillow.com/rent-vs-buy-calculator | Horizon breakeven clair, connexion donnees marche Zillow |

#### Ce qu'ils font MIEUX

- **NYT** : Design interactif exceptionnel avec sliders et feedback immediat, variables visuellement ajustables, graphique dynamique, pedagogie remarquable.
- **NerdWallet** : Previsions macro integrees (appreciation, inflation), benchmarks nationaux pre-remplis.
- **Zillow** : Breakeven horizon clairement affiche ("achat = location apres X annees"), lien vers donnees marche locales.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Deduction interets debiteurs LU** (art. 98bis LIR) — aucun concurrent ne modelise cet avantage fiscal luxembourgeois.
- Assurance SRD (solde restant du).
- Mode quick vs full.
- Adaptation complete au contexte fiscal et reglementaire LU.
- Integration avec les autres outils tevaxia (frais acquisition pre-calcules).

#### 4 ameliorations proposees

1. **UX interactive type NYT** : Remplacer les InputField par des sliders interactifs avec graphique qui se met a jour en temps reel. L'experience NYT est la reference absolue.
2. **Breakeven clairement affiche** : Ajouter un grand indicateur "L'achat devient rentable apres X ans" bien visible, comme Zillow.
3. **Cout d'opportunite de l'apport** : Modeliser explicitement le rendement alternatif de l'apport investi en bourse (ETF monde ~7%/an) vs immobilier. C'est le facteur le plus impactant et souvent ignore.
4. **Scenarios pre-configures** : Proposer 3 scenarios (optimiste/neutre/pessimiste) pour l'appreciation immobiliere et montrer l'impact sur la decision.

---

### 8. Bilan Promoteur

**Description tevaxia** : Compte a rebours (charge fonciere residuelle), 3 types d'operation (immeuble/lotissement/maisons), recettes (surface vendable, parkings), couts construction, honoraires archi/BET, frais lotissement, pre-commercialisation, plan de tresorerie VEFA 7 tranches, marge promoteur, aleas, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Property Development Institute** | https://propertydevelopmentinstitute.com/residual-land-value-calculator/ | Calculateur charge fonciere residuelle gratuit, inputs simplifies |
| **Feasibility.pro** | https://www.feasibility.pro/ | Logiciel complet faisabilite promotion, Excel/SaaS, rapports detailles |
| **Cerema (France)** | https://outil2amenagement.cerema.fr/outils/bilan-promoteur | Guide methodologique bilan promoteur, reference francaise |

#### Ce qu'ils font MIEUX

- **Property Development Institute** : Simplicite extreme, resultat en 30 secondes (GDV - couts - profit = terrain max).
- **Feasibility.pro** : Modeles Excel professionnels avec analyse de sensibilite, scenarios multiples, rapports bancaires.
- **Cerema** : Methodologie de reference documentee, validation institutionnelle.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Plan de tresorerie VEFA** : 7 tranches temporelles (signature > fondations > livraison) avec flux mensuels — unique.
- 3 types d'operation (immeuble/lotissement/maisons) dans le meme outil.
- Taux de pre-commercialisation paramerable.
- Contextualise Luxembourg (couts construction LU, honoraires LU, TVA LU).
- Export PDF professionnel pour presentation bancaire.

#### 5 ameliorations proposees

1. **Analyse de sensibilite** : Matrice montrant l'impact sur la marge si prix vente +/-10% et couts +/-10% (tableau 3x3). C'est le standard bancaire.
2. **Monte Carlo simplifie** : Simuler 1000 scenarios avec variations aleatoires des inputs pour donner une probabilite de viabilite.
3. **Integration PAG/PAP** : Pre-remplir COS/CMU depuis l'outil urbanisme pour calculer automatiquement la surface brute constructible.
4. **Benchmark couts construction** : Afficher les couts moyens de construction par m2 au Luxembourg (Statec) a cote du champ, pour que l'utilisateur sache si sa saisie est realiste.
5. **Mode multi-phases** : Permettre la saisie de plusieurs phases (construction en 2-3 phases) avec echeanciers differencies.

---

### 9. Valorisation EVS 2025

**Description tevaxia** : 7 methodes (comparaison, capitalisation, terme de reversion, DCF, ESG, energie, MLV), reconciliation ponderee, multi-types d'actifs (residentiel, bureaux, commerce, logistique, terrain, hotel, cave), types de valeur EVS (Market Value, Fair Value, Investment Value...), comparables avec ajustements, marche-data integree, rapport EVS/DOCX genere, checklist EVS, narrative auto, profil evaluateur.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **PriceHubble** | https://www.pricehubble.com/ | AVM AI, 11 pays, donnees POI, image recognition, rapports PDF, conforme EBA |
| **Sprengnetter** | https://www.sprengnetter.de/ | 50+ ans, 2M+ prix reels, ML/AI, modele hedonique, rapports pro, API, Allemagne/Autriche |
| **Lysis (Amundi)** | - | Logiciel pro EVS/IVS/RICS, multi-methodes, rapport conforme, base de donnees interne |

#### Ce qu'ils font MIEUX

- **PriceHubble** : AI/ML pour estimation automatique, image recognition, POI (points d'interet), couverture 11 pays, API pour integration bancaire, conforme EBA pour prets hypothecaires.
- **Sprengnetter** : 2M+ prix de transaction reels, algorithme ML valide statistiquement, marque de confiance bancaire en DACH, integration onOffice.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **7 methodes de valorisation** dans un seul outil (PriceHubble = AVM uniquement, Sprengnetter = comparaison hedonique).
- **Conformite EVS 2025** explicite avec checklist et types de valeur standardises.
- **Rapport DOCX genere** conforme EVS avec 11 sections + annexes.
- **Reconciliation ponderee** multi-methodes avec justification.
- **Module ESG** et **energie** integres dans la valorisation.
- **Narrative auto-generee** en francais.
- Multi-types d'actifs (7 types) sans cout additionnel.
- **Gratuit / inclus** vs PriceHubble (SaaS 500+ EUR/mois) et Sprengnetter (pay-per-use).

#### 5 ameliorations proposees

1. **Base de comparables enrichie** : Connecter a data.public.lu (transactions reelles) pour proposer des comparables verifies, pas seulement suggeres depuis les prix communaux.
2. **Scoring qualite du rapport** : Ajouter un score de completude du rapport (X/100) avant export, signalant les sections manquantes ou faibles.
3. **Mode bancaire** : Generer un rapport format "Mortgage Lending Value" conforme CRR/CRD pour les banques LU (Spuerkeess, Raiffeisen).
4. **Historique des evaluations** : Permettre de comparer les evaluations successives d'un meme bien (evolution valeur dans le temps).
5. **Photographies du bien** : Permettre l'upload de photos qui s'integrent dans le rapport genere (comme PriceHubble avec l'image recognition).

---

### 10. Outils bancaires (LTV, DSCR, amortissement, capacite)

**Description tevaxia** : 4 onglets (LTV avec seuils LU 80/90%, capacite d'emprunt, tableau d'amortissement mois par mois, DSCR), seuils colores, explication pedagogique des regles CSSF, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Spuerkeess simulateur** | https://www.spuerkeess.lu/en/private-customers/tools/simulateurs/real-estate-loan-simulation/ | Taux reels Spuerkeess, simulation officielle |
| **Raiffeisen simulateur** | https://www.raiffeisen.lu/fr/particuliers/financer/outils/simulateurs-pret-immobilier | Capacite emprunt + mensualites, taux Raiffeisen |
| **Switchr.lu** | https://switchr.lu/en/banking/mortgage/simulator/ | Comparateur multi-banques, meilleurs taux courtiers, capacite emprunt |

#### Ce qu'ils font MIEUX

- **Spuerkeess/Raiffeisen** : Taux reels actualises de la banque, possibilite de passer directement a une demande de pret, credibilite bancaire.
- **Switchr.lu** : Comparaison multi-banques en temps reel, taux courtiers negocies (souvent meilleurs), combinaison capacite + simulation + comparaison.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **DSCR** (Debt Service Coverage Ratio) pour investisseurs — aucune banque LU ne le propose en ligne.
- **LTV avec seuils CSSF** expliques (80% standard, 90% primo-accedant, >90% garantie Etat).
- **Mortgage Lending Value** (valeur prudente) expliquee dans l'onglet LTV.
- 4 outils bancaires reunis vs 1 seul simulateur par banque.
- Export PDF professionnel.

#### 4 ameliorations proposees

1. **Taux indicatifs du marche** : Afficher les taux moyens actuels au Luxembourg (source : Switchr ou BCL) dans les champs, pour que l'utilisateur sache si son hypothese est realiste.
2. **Deduction interets art. 98bis** : Integrer l'avantage fiscal de la deduction des interets debiteurs dans le tableau d'amortissement (montrer le cout reel apres impot).
3. **Stress test** : Ajouter un scenario "taux +2%" pour montrer l'impact sur les mensualites (exigence CSSF).
4. **Flux integre frais acquisition** : Bouton "Importer les frais" depuis l'outil frais d'acquisition pour calculer le montant total a financer automatiquement.

---

### 11. Base de donnees marche

**Description tevaxia** : 6 onglets (residentiel par commune, bureaux sous-marches, commerces, logistique, terrains, macro), donnees STATEC/Observatoire, courbes evolution, export CSV, prix existant/VEFA/annonces/loyers par commune, taux de rendement, donnees macro (taux hypothecaire, OAT 10Y, indice construction).

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Observatoire de l'Habitat** | https://logement.public.lu/fr/observatoire-habitat/prix-de-vente.html | Source officielle, prix par commune trimestriels, actes notaries + annonces |
| **JLL Luxembourg** | https://www.jll.com/en-belux/insights/market-dynamics/luxembourg-office | Rapports trimestriels bureaux, loyers prime, taux rendement, pipeline |
| **CBRE Luxembourg** | https://www.cbre.lu/fr-lu/etudes-et-recherche | Etudes marche bureaux/logistique/retail, investissement, tendances |

#### Ce qu'ils font MIEUX

- **Observatoire de l'Habitat** : Donnees officielles (actes notaries), validation STATEC, tableaux trimestriels telechargeable, methodologie documentee.
- **JLL** : Analyse qualitative experte, pipeline de projets, previsions, donnees investissement institutionnel, couverture pan-europeenne.
- **CBRE** : Rapports thematiques approfondis, analyses tendances (ESG, flex office), cartes interactives loyers bureaux.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Tout en un seul endroit** : Residentiel + bureaux + commerces + logistique + terrains + macro dans un outil unique.
- Export CSV pour chaque segment.
- Donnees macro contextualisees (taux hypo, OAT, indice construction) a cote des prix.
- Interactif (pas un PDF statique comme JLL/CBRE).
- Gratuit et accessible a tous (JLL/CBRE = rapports reserves aux clients ou sur inscription).

#### 4 ameliorations proposees

1. **Fraicheur des donnees** : Afficher clairement la date de derniere mise a jour pour chaque indicateur. Mettre en place un workflow de mise a jour trimestriel automatise depuis data.public.lu.
2. **Donnees investissement** : Ajouter les volumes d'investissement immobilier LU (source : INOWAI, JLL, CBRE rapports publics) et les taux de capitalisation par segment.
3. **API publique** : Proposer une API REST pour que les professionnels puissent integrer les donnees tevaxia dans leurs outils.
4. **Alertes personnalisees** : Quand un indicateur change significativement (>5%), envoyer une notification aux utilisateurs abonnes.

---

### 12. PAG/PAP urbanisme

**Description tevaxia** : 4 onglets (recherche commune, zones PAG, PAP NQ/QE, servitudes), toutes les zones PAG avec COS/CMU, calculateur de constructibilite (surface au sol et brute), carte interactive, lien Geoportail.lu, procedures PAP documentees.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Geoportail.lu** | https://map.geoportail.lu/ | Carte officielle, PAG de toutes les communes refondues, parcelles cadastrales, donnees topographiques |
| **pag.geoportail.lu** | https://pag.geoportail.lu/ | Visualisation PAG reglementaire par parcelle, source officielle |
| **Sites communaux** | (varies) | Certaines communes publient leur PAG en detail sur leur site |

#### Ce qu'ils font MIEUX

- **Geoportail.lu** : Carte parcellaire exacte, donnees cadastrales officielles, couche PAG reglementaire opposable, zoom parcelle.
- **pag.geoportail.lu** : Reglements zone par zone, opposable juridiquement (le PAG tevaxia est pedagogique, pas opposable).

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Calculateur COS/CMU** : Entrer surface terrain, choisir zone = surface brute constructible calculee automatiquement. Geoportail ne calcule rien.
- Explication pedagogique de chaque zone (quoi construire, hauteur, densite).
- Procedures PAP (NQ = Nouveau Quartier, QE = Quartier Existant) documentees.
- Servitudes et delais expliques.
- Integration dans l'ecosysteme (lien vers bilan promoteur, estimation).

#### 4 ameliorations proposees

1. **Recherche par adresse/parcelle** : Permettre la saisie d'une adresse ou numero cadastral et afficher automatiquement la zone PAG correspondante (API Geoportail).
2. **Iframe Geoportail** : Integrer une vue Geoportail directement dans l'outil (iframe ou API) pour voir la parcelle sur la carte sans quitter tevaxia.
3. **Reglement zone complet** : Pour chaque zone, afficher le reglement detaille (hauteur max, recul, implantation, densite, nombre de logements) au lieu des seuls COS/CMU typiques.
4. **Alerte modification PAG** : Suivre les modifications PAG en cours (enquetes publiques, nouvelles zones) et notifier les utilisateurs concernes.

---

## PARTIE B — ENERGY.TEVAXIA.LU (7 outils)

---

### 13. Impact CPE sur la valeur

**Description tevaxia** : Green premium / brown discount par classe energetique (A=+8% a I=-25%), tableau comparatif 9 classes, delta en EUR et %, graphique, consommation par classe, CO2, methodologie sourcee, fallback local + API Spring Boot, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **PriceHubble EPC** | https://www.pricehubble.com/ | Prediction EPC integree dans l'AVM, impact prix automatique dans le rapport |
| **Rightmove Green Premium (UK)** | https://www.rightmove.co.uk/news/articles/property-news/green-premium-epc-ratings/ | Etudes statistiques green premium UK, donnees transactionnelles |
| **UK Home Energy EPC Calculator** | https://www.ukhomeenergy.co.uk/tools/epc-improvement-calculator/ | Impact EPC sur prix, cout amelioration, subventions UK |

#### Ce qu'ils font MIEUX

- **PriceHubble** : Donnees transactionnelles reelles pour calibrer le green premium (pas des coefficients statiques), couverture multi-pays.
- **Rightmove** : Etudes statistiques massives basees sur des millions de transactions UK, premium de +15.5% documente.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Specifique Luxembourg** : Echelle A-I luxembourgeoise (pas A-G europeenne), coefficients calibres sur donnees Observatoire de l'Habitat.
- **Comparaison complete 9 classes** : Tableau interactif montrant toutes les combinaisons de reclassement.
- Affichage simultane valeur, delta EUR, delta %, consommation kWh, CO2.
- Lien direct vers simulateur renovation pour chiffrer le passage de classe.
- Export PDF professionnel.

#### 4 ameliorations proposees

1. **Calibration empirique** : Utiliser les donnees reelles de transaction par classe energetique (data.public.lu + Observatoire) pour recalibrer les coefficients au lieu de valeurs statiques.
2. **Fourchette de confiance** : Afficher min-max du green premium (pas un chiffre unique), car l'impact varie selon localisation et type de bien.
3. **Comparaison europeenne** : Montrer les green premiums dans d'autres pays (DE, FR, UK) pour contextualiser la situation LU.
4. **Scenario "ne rien faire"** : Projeter la depreciation future si la classe energetique ne change pas (brown discount croissant avec EPBD).

---

### 14. ROI Renovation energetique

**Description tevaxia** : Saut de classe (A-I vers A-I), postes de travaux detailles avec couts min/max/moyen, honoraires, duree estimee, Klimabonus (taux par saut de classes), Klimapret (montant, taux 1.5%, mensualite), subvention conseil, economie annuelle kWh/EUR, payback, VAN 20 ans, TRI, reste a charge, graphique investissement, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Klima-Agence simulateur renovation** | https://renover.klima-agence.lu/ | Simulateur officiel, impact energetique temps reel, Klimabonus actualises |
| **HelloWatt.fr** | https://www.hellowatt.fr/renovation/ | Simulateur DPE, estimation gains, avance subventions, suivi conso mobile |
| **Effy.fr** | https://www.effy.fr/aide-energetique/simulateur-dpe | Simulateur DPE, reseau artisans RGE, accompagnement complet |

#### Ce qu'ils font MIEUX

- **Klima-Agence** : Montants Klimabonus officiels toujours a jour, integration aides communales reelles, credibilite institutionnelle, simulation impact energetique en temps reel piece par piece.
- **HelloWatt** : Avance des primes (pas d'attente), application mobile suivi consommation post-travaux, reseau artisans.
- **Effy** : Accompagnement bout-en-bout (diagnostic > travaux > suivi), 17 ans d'experience, reseau 8000+ artisans.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **VAN, TRI, payback** : Metriques financieres d'investissement — aucun concurrent ne les calcule.
- **Klimapret** detaille avec mensualite.
- Gain de valeur immobiliere chiffre (pas juste economie d'energie).
- Postes de travaux avec fourchette min/max/moyen.
- Integration dans le flux de valorisation (impact sur prix de vente).
- Mode investisseur (ROI financier, pas juste confort).

#### 5 ameliorations proposees

1. **Scenarios de renovation** : Proposer 3 scenarios pre-configures (minimum legal, optimal rapport cout/gain, renovation profonde) avec comparaison graphique.
2. **Montants Klimabonus 2026 exacts** : Verifier et synchroniser avec le nouveau regime Wunnen 2026 (EUR/m2 par poste). Les montants dans le code (tauxKB par saut) sont peut-etre approximatifs.
3. **Devis artisans** : Partenariat avec des artisans LU pour proposer des devis reels a partir des resultats de simulation (monetisation potentielle).
4. **Financement mixte** : Modeliser la combinaison Klimapret + pret bancaire + Klimabonus + epargne pour montrer le plan de financement complet.
5. **Suivi post-travaux** : Apres renovation, permettre de comparer conso reelle vs prevue pour valider les gains.

---

### 15. Communaute d'energie

**Description tevaxia** : Simulateur production PV, autoconsommation, surplus, economie totale et par participant, CO2 evite, cout installation (HTVA/TVA/TTC), payback, repartition mensuelle graphique, conformite juridique detaillee (loi 21/05/2021, reglement ILR E23/14), fallback local + API, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **WeShareEnergy (ILR/LIST)** | https://www.weshareenergy.lu/ | Logiciel officiel LU, courbes de charge, cles de repartition, 4 langues, Windows/Mac |
| **Enovos Energy Sharing Service** | https://www.enovos.lu/en/the-world-of-energy/energy-production/energy-sharing-service/ | Service commercial, gestion communaute, facturation, suivi financier |
| **RECON (Italie)** | - | Web app, evaluation economique/financiere CER, VAN, TRI, CO2 |

#### Ce qu'ils font MIEUX

- **WeShareEnergy** : Logiciel telechargeable avec courbes de charge reelles (pas d'estimation), cles de repartition par POD, resultats en kWh exacts, developpe par ILR + LIST.
- **Enovos** : Service operationnel complet (pas juste simulation), gestion facturation, suivi reel, accompagnement juridique.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Simulateur web instantane** : Pas de logiciel a telecharger (WeShareEnergy = application desktop).
- **Cadre juridique complet** : Statut juridique, perimetre, contrat repartition, declaration ILR, loi de reference — tout documente dans les resultats.
- Economie par participant et payback.
- CO2 evite chiffre.
- Cout installation TTC detaille.
- Export PDF professionnel.
- Integration dans l'ecosysteme energy.tevaxia.lu.

#### 4 ameliorations proposees

1. **Import courbes de charge** : Permettre l'import de profils de consommation reels (CSV) pour un calcul precis au lieu d'une moyenne annuelle.
2. **Modele juridique interactif** : Proposer un choix entre copropriete, ASBL, cooperative avec les implications juridiques et fiscales de chacun.
3. **Cartographie** : Afficher sur carte la zone de 1km autour d'un poste de transformation pour visualiser qui peut participer.
4. **Simulation multi-annuelle** : Projeter sur 25 ans avec degradation des panneaux (~0.5%/an), hausse tarifs electricite, et remplacement onduleur.

---

### 16. Timeline EPBD

**Description tevaxia** : Timeline visuelle des jalons EPBD (2026, 2028, 2030, 2033, 2035...), classes affectees par jalon, selection classe actuelle pour voir quand le bien est impacte, detail par jalon, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **CRREM Tool** | https://www.crrem.eu/ | Pathways decarbonation 1.5C, 44 pays, risque de stranding, timeline 2050 |
| **GRESB** | https://www.gresb.com/ | Benchmark ESG immobilier, integration CRREM, scoring portfolio |
| **Kamma Climate (UK)** | https://www.kammaclimate.com/ | Risque EPC pour preteurs hypothecaires, impact valeur |

#### Ce qu'ils font MIEUX

- **CRREM** : Science-based pathways (kWh/m2 et CO2/m2 par an jusqu'en 2050), calcul du "stranding year" precis pour chaque bien.
- **GRESB** : Benchmark entre pairs, scoring ESG normalise, reconnaissance institutionnelle (investisseurs).

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Specifique Luxembourg + EPBD** : Jalons reglementaires LU transposes, pas des pathways generiques.
- Selection de sa classe actuelle et visualisation immediate de l'impact.
- Interface pedagogique grand public (CRREM = outil expert complexe).
- Gratuit et accessible (CRREM = licence payante, GRESB = abonnement institutionnel).

#### 4 ameliorations proposees

1. **"Stranding year" personnalise** : Calculer l'annee ou le bien de l'utilisateur sera interdit a la location ou penalise, basee sur sa classe actuelle et les jalons EPBD.
2. **Cout de mise en conformite** : Lien automatique vers le simulateur renovation pour chiffrer ce qu'il faut investir pour eviter le stranding.
3. **Impact financier** : Projeter la perte de valeur (brown discount croissant) si aucune action n'est prise, annee par annee.
4. **Comparaison transposition LU vs FR vs DE** : Montrer comment les differents pays transposent l'EPBD (le Luxembourg peut etre plus ou moins strict).

---

### 17. Estimateur CPE

**Description tevaxia** : Questionnaire multi-etapes (type, annee construction, isolation, fenetres, chauffage, ECS, ventilation, renouvelables), scoring par points, estimation classe energetique A-I, code couleur, explications, lien vers renovation.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **HelloWatt simulateur DPE** | https://www.hellowatt.fr/renovation/diagnostic-performance-energetique/simulateur | Estimation DPE rapide, methode 3CL simplifiee, recommandations travaux |
| **Effy simulateur DPE** | https://www.effy.fr/aide-energetique/simulateur-dpe | Estimation en 5 minutes, lien vers audit energetique |
| **UK Home Energy EPC Calculator** | https://www.ukhomeenergy.co.uk/tools/epc-improvement-calculator/ | Calculateur EPC UK, impact ameliorations, subventions |

#### Ce qu'ils font MIEUX

- **HelloWatt** : Methode 3CL simplifiee plus scientifique (modelisation thermique), 7M+ DPE dans leur base, recommandations travaux priorisees par impact.
- **Effy** : Parcours en 5 minutes avec visuels, lien direct vers artisans et devis, accompagnement post-estimation.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Echelle A-I luxembourgeoise** (pas la francaise A-G).
- Scoring transparent (points visibles par critere).
- Lien direct vers les outils renovation et impact valeur.
- Pas de collecte de donnees personnelles (HelloWatt/Effy demandent email/telephone).
- Multilingue (FR/EN/DE/PT/LB).

#### 4 ameliorations proposees

1. **Modelisation thermique simplifiee** : Au lieu d'un scoring par points, calculer une consommation estimee en kWh/m2/an basee sur les reponses (surface, U-value estimee des parois, rendement chauffage). Plus credible qu'un score.
2. **Photographie reference** : Pour chaque question (type de fenetre, isolation...), afficher des photos illustratives pour aider l'utilisateur a identifier sa situation.
3. **Comparaison CPE reel** : Permettre de saisir le resultat du CPE officiel et comparer avec l'estimation pour voir la precision.
4. **Consommation reelle** : Demander la consommation reelle (facture gaz/elec) et comparer avec l'estimation theorique.

---

### 18. Scoring LENOZ

**Description tevaxia** : 6 categories (localisation, social, economies, environnement, batiment/installations, fonctionnel), criteres par categorie avec options a choix, score sur 60, classification 1-4 feuilles, couleurs par categorie, radar chart implicite, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Guichet.lu LENOZ** | https://guichet.public.lu/en/citoyens/logement/construction/performances-energie/certificat-lenoz.html | Description officielle, formulaire de demande, conditions |
| **Klima-Agence LENOZ** | https://www.klima-agence.lu/en/lenoz-certificate-0 | Information, formation, accompagnement certification |
| *Aucun simulateur en ligne concurrent* | - | - |

#### Ce qu'ils font MIEUX

- **Guichet.lu** : Source officielle, formulaire de demande reel, conditions d'eligibilite precises.
- **Klima-Agence** : Accompagnement et formation pour les professionnels certifies.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **SEUL simulateur LENOZ en ligne** : Ni guichet.lu ni Klima-Agence ne proposent un outil interactif pour estimer son score LENOZ.
- Scoring interactif par critere avec resultat instantane.
- Classification en feuilles (1-4).
- Export PDF du scoring detaille.
- Lien vers les outils de renovation et d'aide.

#### 4 ameliorations proposees

1. **143 criteres complets** : Actuellement, l'outil couvre un sous-ensemble des 143 criteres LENOZ. Viser l'exhaustivite du referentiel officiel.
2. **Pre-certification indicative** : Generer un document de pre-certification indicatif que le proprietaire peut montrer a un professionnel LENOZ pour gagner du temps.
3. **Recommandations** : Pour chaque critere ou le score est faible, proposer des actions concretes et leur cout estimatif.
4. **Lien avec aides financieres** : Afficher automatiquement les aides PRIMe House liees a la certification LENOZ (subvention construction durable).

---

### 19. Portfolio energetique

**Description tevaxia** : Gestion multi-biens (nom, classe, surface, valeur, type, annee), statistiques portfolio (distribution par classe, score moyen, valeur totale, consommation, CO2), green value totale, alertes EPBD, stockage local, export PDF.

#### Concurrents

| Concurrent | URL | Specificite |
|---|---|---|
| **Deepki Ready** | https://www.deepki.com/ | Plateforme ESG cloud, collecte auto donnees, benchmark, CSRD, multi-pays |
| **Measurabl** | https://www.measurabl.com/ | N1 ESG immobilier, GRESB, CRREM, CDP, Energy Star, bulk upload |
| **GRESB** | https://www.gresb.com/ | Benchmark ESG entre pairs, scoring institutionnel, 2000+ membres |

#### Ce qu'ils font MIEUX

- **Deepki** : Collecte automatique des donnees de consommation (compteurs, IoT), benchmark vs pairs, rapports CSRD conformes, couverture multi-pays/multi-fonds.
- **Measurabl** : Integration GRESB directe, workflow qualite donnees, alertes gaps, couverture 100k+ biens.
- **GRESB** : Reference mondiale, scoring ESG reconnu par investisseurs institutionnels, benchmark vs pairs.

#### Ce que tevaxia fait qu'ils NE FONT PAS

- **Gratuit et accessible** : Deepki/Measurabl = SaaS entreprise (10k-100k+ EUR/an). Tevaxia = gratuit.
- **Contexte luxembourgeois** : Classe A-I, Klimabonus, EPBD LU, legislation LU.
- **Impact valeur chiffre** : Green value / brown discount par bien et agregee.
- **Alertes EPBD** : Quels biens seront "stranded" et quand.
- Interface simple pour petits portfolios (5-50 biens) vs Deepki/Measurabl concu pour 1000+ biens.

#### 5 ameliorations proposees

1. **Import CSV/Excel** : Permettre l'import massif de biens via fichier au lieu de la saisie un par un.
2. **Plan de renovation portfolio** : Prioriser les biens a renover par ratio cout/impact (ROI) et generer un plan d'investissement pluriannuel.
3. **Budget carbone portfolio** : Calculer les emissions totales et montrer le pathway CRREM vers la neutralite carbone.
4. **Rapport ESG genere** : Produire un rapport ESG simplifie conforme aux attentes bancaires LU (pour les investisseurs institutionnels ou family offices).
5. **Synchronisation cloud** : Remplacer le stockage local (localStorage) par un stockage cloud securise pour ne pas perdre les donnees et permettre le partage d'equipe.

---

## SYNTHESE STRATEGIQUE

### Outils ou tevaxia est UNIQUE (aucun concurrent direct) :

| Outil | Raison |
|---|---|
| **Scoring LENOZ** | Seul simulateur LENOZ interactif en ligne au monde |
| **Bilan Promoteur** (LU context) | Seul outil en ligne avec plan tresorerie VEFA et contexte LU |
| **Calculateur loyer legal** (web) | Seul outil web pour le plafond 5% capital investi (officiel = Excel) |
| **Timeline EPBD** (LU) | Seul outil visualisant les jalons EPBD avec impact par classe LU |
| **Communaute d'energie** (web) | Seul simulateur web LU (WeShareEnergy = desktop) |

### Outils ou tevaxia a un avantage competitif fort :

| Outil | Avantage |
|---|---|
| **Valorisation EVS 2025** | 7 methodes + rapport DOCX, gratuit vs PriceHubble 500+ EUR/mois |
| **ROI Renovation** | VAN/TRI/payback + Klimabonus — aucun concurrent ne combine financier + energie |
| **Simulateur d'aides** | Vue consolidee toutes aides (acquisition + energie + communales) |
| **Achat vs Location** | Deduction interets LU art. 98bis integree |
| **Impact CPE** | Quantification EUR du green premium par classe, specifique LU |

### Top 10 ameliorations prioritaires (impact maximal) :

1. **Comparables visuels dans Estimation** — comble le gap principal vs MeilleursAgents
2. **Zoom infra-communal Carte** — Lux-Ville 24 quartiers, ecart >3000 EUR/m2
3. **Calibration empirique green premium** — credibilite des coefficients d'impact CPE
4. **Mode succession Plus-values** — PlusValue.lu le fait, tevaxia non
5. **Klimabonus 2026 synchronise** — nouveau regime Wunnen, montants EUR/m2
6. **Sliders interactifs Achat vs Location** — UX type NYT
7. **Analyse de sensibilite Bilan Promoteur** — standard bancaire
8. **Import CSV Portfolio** — rendre l'outil utilisable pour >10 biens
9. **Modelisation thermique Estimateur CPE** — kWh/m2 au lieu de points
10. **Taux indicatifs marche Outils bancaires** — contextualiser les saisies

---

*Benchmark realise le 4 avril 2026. Sources : recherches web, analyse du code source tevaxia, sites concurrents.*
