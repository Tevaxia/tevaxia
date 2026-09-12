# Tevaxia — audit énergie du 9 septembre 2026

## Communauté énergétique
Le précédent calcul mélangeait l’économie des consommateurs et les revenus du producteur, déduisait le taux de partage du nombre de membres et affichait 99 ans en l’absence de retour positif. Le nouveau scénario sépare les flux :
- consommateurs = énergie partagée × (prix variable évité − prix du partage − charges résiduelles) ;
- producteur = paiements du partage + vente du surplus − coûts annuels ;
- collectif = somme des deux ; les paiements internes s’annulent.
Le volume partagé est saisi et doit être inférieur ou égal à la production et à la consommation. Il doit être justifié par une étude des profils simultanés. Les ratios portent sur ce volume réel, sans confondre production annuelle et demande couverte. Prix, devis avec taxes non récupérables, aide confirmée initiale et coûts annuels sont explicites. Les hypothèses initiales sont des exemples. Les flux négatifs restent visibles ; aucun retour fictif de 99 ans. La moyenne par consommateur n’est pas une clé contractuelle.
Exemple testé : production 28 500 kWh, consommation 27 000 kWh, partage 14 000 kWh ; consommateurs 1 540 €/an, producteur 2 615 €/an, collectif 4 155 €/an. Modifier le prix interne déplace les montants individuels sans changer le total collectif.
La page ne fait plus appel au backend Java historique ni à une production PVGIS assimilée à une mesure réelle. Un lien vers PVGIS permet d’obtenir une estimation externe ; aucun statut de conformité ni gain CO2 automatique n’est délivré.

## EPBD
Retrait des dates de non-conformité, risques et décotes de prix dérivés de la seule lettre CPE. Trois catégories distinctes : résidentiel existant (trajectoire moyenne nationale), non résidentiel existant (seuils des fractions les moins performantes du parc de référence), constructions neuves (objectif émissions nulles). L’application nationale et les exemptions restent à vérifier pour le bâtiment concerné. La date générale de transposition ne vaut pas diagnostic individuel.

## Sources consultées
- [ILR — autoconsommation et partage](https://www.ilr.lu/secteurs-activites/energie/electricite/energie-renouvelable-partage/autoconsommation-partage-delectricite/).
- [MyILR — raccordement et contrats](https://www.myilr.lu/mes-questions/energie/produire-autoconsommer-et-partager-delectricite/).
- [Directive UE 2024/1275](https://eur-lex.europa.eu/eli/dir/2024/1275/oj).
- [Commission européenne — EPBD](https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings/energy-performance-buildings-directive_en).
- [Ministère de l’Économie — ressources techniques](https://meco.gouvernement.lu/fr/domaines-activites/energie/efficacite-energetique/informations-techniques.html).
- [ILR — consultation du 14 août au 27 septembre 2026](https://www.ilr.lu/consultations/consultation-publique-du-14-aout-au-27-septembre-2026/), identifiée comme consultation, sans la présenter comme texte déjà adopté.

## Validation
1 140 tests dans 89 fichiers passent, dont 8 nouveaux tests de cohérence du partage. Lint ciblé et compilation réussis. Parcours des deux pages et des trois catégories EPBD vérifiés dans les cinq langues, aux largeurs 320, 390, 768 et 1440 pixels. Douze PDF générés : cinq bilans de partage, cinq synthèses EPBD résidentielles et deux autres catégories en français ; dix-sept pages rendues et inspectées. Espaces numériques du PDF normalisés. Locale numérique explicite pour le luxembourgeois après constat de différences entre Node et Chromium qui provoquaient une erreur d’hydratation.

## Périmètre restant
Ce lot ne certifie pas la transposition exhaustive des dispositions EPBD au Luxembourg, n’établit pas un CPE et ne calcule pas les taxes ou tarifs réglementés individuels. L’ancien service Java, les autres modules énergétiques et les modules professionnels restent à auditer. L’audit global de Tevaxia demeure ouvert.


## CPE — préparation du dossier et relevés
L’ancien questionnaire associait arbitrairement des points à six réponses, puis une lettre CPE, une consommation, une facture au tarif fixe de 0,22 €/kWh et des émissions avec un facteur de 0,300 kg/kWh. Aucun modèle thermique justificatif n’étant présent, ces résultats ont été retirés.
La page conserve six rubriques déclaratives (type, époque, chauffage, isolation, fenêtres, ventilation) avec une réponse inconnue possible, puis une synthèse destinée à l’expert. Le seul calcul est le quotient de l’énergie livrée renseignée sur douze mois par la surface correspondante. Aucune correction climatique, conversion énergie primaire ou classification n’est appliquée. Données absentes, négatives ou surface nulle ne produisent pas de ratio.
La navigation, la présentation sur l’accueil énergie et les métadonnées sont alignées sur la préparation du CPE. Les exigences techniques et le dossier sont renvoyés à la [démarche officielle Guichet.lu](https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html), consultée le 9 septembre 2026. La page ne délivre pas de certificat.
Validation : 1 143 tests / 90 fichiers réussis, dont trois tests du quotient mesuré. Lint ciblé réussi. Le déploiement et les contrôles de production sont consignés dans le suivi opérationnel.

## Portefeuille énergétique — inventaire fiable
Le portefeuille appliquait des coefficients fixes de valeur par classe, fabriquait une consommation et des émissions à partir d’une lettre, puis en déduisait un risque réglementaire. La formule d’impact mélangeait en outre une valeur déjà ajustée et une valeur de référence, produisant un double effet de classe. Ces résultats et l’analyse IA qui les réutilisait ont été retirés, avec leur ancienne version PDF.

Le module présente désormais les valeurs et surfaces déclarées, leur somme et la répartition des surfaces par classe, sans fabriquer de classe CPE moyenne. Les classes A+ et inconnue sont acceptées. Les limites d’une répartition mêlant logements et bâtiments non résidentiels sont explicites. Les scénarios de valeur et les objectifs EPBD renvoient aux pages dédiées déjà revues.

La structure et la clé des portefeuilles sauvegardés sont conservées. Les données illisibles ou invalides ne sont pas écrasées et peuvent être téléchargées dans leur forme originale. Les échecs de sauvegarde sont signalés. L’import fonctionne aussi depuis un portefeuille vide ; le lecteur CSV reconnaît le séparateur, les virgules décimales dans les fichiers à point-virgule, les champs entre guillemets et les noms multilignes. Les lignes invalides sont signalées sans générer de valeurs de remplacement. Le formulaire refuse les valeurs non finies, négatives, les surfaces nulles et les années invalides.

Exemple de contrôle : 880 000 EUR en G + 1 200 000 EUR en A+ + 500 000 EUR sans classe = 2 580 000 EUR, inchangés par les lettres. Sur 400 m², les trois parts valent 25 %, 50 % et 25 %. Le PDF reprend exactement les données de l’inventaire et garde chaque fiche de bien sur une même page.

Sources revérifiées le 9 septembre 2026 : [Guichet.lu — CPE](https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html) et [Commission européenne — EPBD](https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings/energy-performance-buildings-directive_en). Cette correction n’établit ni certificat CPE ni conformité réglementaire individuelle.

Validation technique : 1 151 tests dans 91 fichiers, dont huit nouveaux tests métier/CSV/sauvegarde ; compilation et lint ciblé réussis. Cinq PDF de deux pages générés, totaux extraits et dix pages inspectées visuellement. Les contrôles d’interface et de production sont consignés ci-dessous après leur achèvement.

## Financement et CPE — comparaison de conditions explicites
L’onglet attribuait des ajustements fixes de taux et de LTV selon une classe CPE, assortis de justifications non établies (échéance EPBD, éligibilité verte, absence de risque). Il citait aussi à tort la circulaire CSSF 22/811 comme référence LTV. La source pertinente vers laquelle le nouvel outil renvoie est le [règlement CSSF 20-08](https://www.cssf.lu/fr/Document/reglement-cssf-n-20-08-du-3-decembre-2020/), vérifié le 9 septembre 2026. Le simulateur ne certifie pas l’admissibilité réglementaire d’un dossier.

L’onglet « Conditions de financement » compare maintenant deux taux nominaux et deux ratios prêt/valeur saisis, pour un capital et une durée identiques. Les valeurs initiales sont explicitement un exemple, identique entre A et B, sans attribution à une banque. Le taux et le plafond ne sont plus fabriqués à partir du CPE. La formule d’annuité utilise log1p/expm1 pour rester stable près de zéro ; le taux nul donne capital / nombre de mois. Le total d’intérêts est distinct du total remboursé, qui inclut le capital. Les plafonds valeur × ratio sont séparés des mensualités ; un capital dépassant le plafond déclenche une indication explicite, sans prétendre à une offre disponible ou à une capacité d’emprunt calculée.

Le périmètre exclut assurance, frais, taxes, aides et remboursement anticipé. Aucun TAEG n’est annoncé dans ce nouvel onglet. Les saisies invalides masquent les résultats. Les conditions réelles doivent provenir de l’offre et de l’analyse du dossier.

Validation : 1 142 tests dans 91 fichiers réussis ; les seize tests de l’ancien barème ont été remplacés par sept tests significatifs (annuité indépendante, intérêts, capital identique, plafond, taux nul/proche de zéro, limites). Lint et compilation réussis. Interface vérifiée dans cinq langues à 390, 320, 768 et 1440 pixels, sans erreur JavaScript de page observée. Aucun PDF n’existait dans cet onglet, aucun export n’y est ajouté.

Ce lot ne valide pas les autres onglets bancaires : comparateur d’offres nommées, références de taux et autres formules restent à reprendre, ainsi que le questionnaire d’audit énergétique et les modules non encore contrôlés.

## Comparateur de propositions — coûts et assurance
Les taux nommément attribués à Spuerkeess, BIL et BGL sans justificatif ont été retirés. Trois scénarios identiques, explicitement illustratifs et non attribués à une banque, servent de point de départ. Les coûts à zéro sont présentés comme des champs à compléter.

Le capital est commun aux trois propositions. Chaque proposition précise son taux fixe nominal, sa durée entière, la prime d’assurance initiale, les primes mensuelles constantes, les autres frais initiaux et les autres frais mensuels constants. Les coûts initiaux sont payés au départ et comptés une seule fois ; les coûts mensuels sont appliqués sur la durée entière. La formule réutilise l’annuité stable déjà contrôlée. Le coût hors capital est la somme des intérêts, assurances et autres frais saisis ; le total payé ajoute le capital. Le modèle ne traite pas les primes variables, les frais financés, les variations de taux, différés, remboursements anticipés ou la fiscalité, et n’annonce aucun TAEG réglementaire. L’ancien calcul inutilisé d’un pseudo-TEG a été supprimé.

À durée identique, le coût saisi le plus faible est signalé avec gestion des ex æquo, sans prétendre comparer les garanties contractuelles. Si les durées diffèrent, les résultats restent disponibles sans désigner une meilleure proposition. Toute saisie invalide masque le tableau.

L’ancien encadré de fourchettes de taux fixes et variables, avec attribution BCL/Switchr non établie et taux BCE de secours, a été retiré des trois onglets où il était utilisé. Un lien vers les [statistiques officielles BCL](https://www.bcl.lu/fr/statistiques/series_statistiques_luxembourg/03_marche_capitaux_interets/index.html), vérifié le 9 septembre 2026, rappelle la distinction entre moyennes et propositions individuelles. La [page officielle sur l’assurance solde restant dû](https://logement.public.lu/fr/proprietaire/fiscalit/assurance-solde-restant-du.html) est également liée. La mention générique « assurance obligatoire » et la promesse globale de conformité du sous-titre sont retirées. Les blocs SEO contenant des taux, garanties, conditions CPE et pénalités non justifiés sont retirés de la page.

Contrôle numérique indépendant : capital 120 000 EUR, taux nul, 10 ans, prime initiale 2 400 EUR, prime mensuelle 20 EUR, frais initiaux 600 EUR et mensuels 5 EUR : mensualité du prêt 1 000 EUR, sortie mensuelle 1 025 EUR, dépenses initiales 3 000 EUR, assurance totale 4 800 EUR, autres frais 1 200 EUR, coût hors capital 6 000 EUR, total payé 126 000 EUR.

Validation : 1 149 tests dans 92 fichiers passent, dont sept nouveaux tests. Lint et compilation réussis ; parcours vérifiés dans cinq langues à 390/320/768/1440 pixels, avec contrôles des coûts, égalités, durées différentes, saisies invalides et liens sources dans trois autres onglets. Aucun export PDF ne figurait dans le comparateur et aucun n’est ajouté.

L’historique graphique des taux, les autres calculs bancaires (capacité, remboursement, LTV, DSCR), le questionnaire énergétique et les modules restants demeurent à contrôler. Ce lot ne valide pas l’ensemble des outils bancaires.

## Capacité d’emprunt et remboursement anticipé
La capacité d’emprunt affichait une assurance calculée séparément sans la déduire du budget disponible pour rembourser le prêt. Le nouveau module retranche les engagements existants, l’assurance et les autres frais mensuels avant de convertir le budget résiduel en capital. Le ratio initial de 40 % est une hypothèse modifiable, sans prétention à un plafond légal universel. Les coûts mensuels sont saisis en euros d’après les devis, et non déduits automatiquement d’un pourcentage du capital. Le dépassement du budget est explicite et la capacité est nulle lorsque le budget est épuisé. Les anciennes additions d’apport fixes présentées comme budgets d’achat sont retirées.

Le remboursement anticipé intervient immédiatement après l’échéance mensuelle sélectionnée, sans arrondi silencieux du mois. Deux modalités restent possibles : conserver la mensualité et réduire la durée, ou conserver la durée restante et réduire la mensualité. Les résultats distinguent le capital restant, le montant effectivement remboursé, l’excédent non utilisé, les liquidités mobilisées avec frais, la dernière échéance éventuellement partielle et les intérêts futurs. Un remboursement à la dernière échéance n’applique aucun montant ni frais supplémentaires. Les frais de l’opération sont appliqués seulement lorsqu’un capital est effectivement remboursé.

L’indemnité par défaut égale à six mois d’intérêts a été remplacée par un montant en euros provenant du décompte bancaire, avec zéro présenté comme hypothèse à confirmer. Le texte reprend les limites indiquées par la [CSSF sur les contrats de crédit immobilier](https://www.cssf.lu/fr/contrats-credit-immobilier/), consultée le 9 septembre 2026 : conditions d’habitation effective et principale pendant au moins deux ans sans interruption, et exclusion du plafond pour la fraction cumulée des remboursements anticipés dépassant 450 000 EUR. Le calcul ne détermine ni l’indemnité légale applicable ni l’éligibilité du dossier.

Le gain affiché est limité aux intérêts évités moins les frais saisis. Le délai de couverture des frais utilise les intérêts évités sur toute la durée résiduelle initiale, même après extinction du prêt raccourci et en cas de remboursement total. Il ne constitue pas un délai de récupération du capital mobilisé. Les anciennes recommandations automatiques sont retirées. Assurance, fiscalité, actualisation, rendement alternatif de l’épargne et taux variables restent exclus ; les soldes doivent être rapprochés du décompte bancaire.

Contrôles indépendants : revenus 5 000 EUR, engagements 500 EUR, ratio 40 %, assurance 100 EUR et frais mensuels 50 EUR donnent un budget du prêt de 1 350 EUR ; à taux nul sur dix ans, capital de 162 000 EUR. Un prêt de 12 000 EUR sur douze mois à taux nul, remboursé de 3 500 EUR après la deuxième échéance, laisse 6 500 EUR : sept échéances en conservant une mensualité de 1 000 EUR, dont une dernière de 500 EUR ; ou dix mensualités de 650 EUR en conservant la durée.

Validation : 1 147 tests / 92 fichiers réussis. Treize tests significatifs remplacent les quinze anciens tests liés à ces fonctions. Cas couverts : budget assurance comprise, dépenses supérieures au budget, deux stratégies, échéance partielle, remboursement total, montant excédentaire, date finale, remboursement nul, délai de couverture après la fin du prêt raccourci et saisies invalides. Les anciennes fonctions retirées n’avaient pas d’autre appel dans le code. Aucun PDF n’était proposé dans ces deux onglets ; aucun export n’y est ajouté.

Contrôles d’interface de ce lot : compilation et lint réussis. Les deux onglets ont été vérifiés dans cinq langues à 390/320/768/1440 pixels : budget après assurance, budget dépassé, deux modalités de remboursement, échéance finale, surplus inutilisé, capital totalement remboursé et saisies invalides. Aucun message d’erreur JavaScript de page observé. Mise en ligne et contrôles de production consignés dans le suivi opérationnel.


## Ratios LTV/DSCR et amortissement bancaire

Le ratio LTV utilise la valeur et le prêt saisis, sans transformer ses seuils en verdict d’acceptation ou en éligibilité à une garantie. Une valeur nulle/invalide bloque le résultat. La part de valeur non couverte et le prêt excédant la valeur sont distingués, hors frais d’acquisition. Le lien au règlement CSSF 20-08 replace le calcul dans le dossier bancaire.

Le DSCR conserve un revenu net négatif, exige un service de dette strictement positif et distingue revenu d’exploitation et solde après dette. Les périodes sont annuelles et les charges excluent le prêt et ses intérêts pour éviter leur double comptage. Les seuils prétendument universels de 1,2/1,5 et les verdicts de solvabilité sont retirés.

L’annuité utilise une formule stable à taux presque nul. Le tableau conserve le capital et solde la dernière échéance. Les saisies invalides masquent les résultats et l’export ; le consommateur agence de cette même fonction est protégé contre une saisie invalide. Le PDF n’invente plus de valeur immobilière, d’apport, de LTV à 80 % ou de taux d’endettement : il contient les paramètres du prêt, les totaux et chaque année du tableau. Le total capital + intérêts est nommé explicitement, hors assurance/frais. Les écarts de centimes liés aux arrondis bancaires restent possibles.

Le graphique historique des taux, alimenté par des séries sans références ligne par ligne et une année 2026 estimée, a été retiré de cette page ; le lien aux statistiques BCL le remplace. Les autres utilisations de macro-data restent à contrôler et sont inscrites dans l’inventaire de revue.

Validation : 1 152 tests dans 93 fichiers réussis, compilation TypeScript/Next et lint ciblé réussis. Contrôle des trois onglets dans cinq langues et à 320/390/768/1440 pixels, cas invalides et ratios négatifs inclus, sans erreur JavaScript observée. Cinq PDF d’amortissement ont été générés et inspectés visuellement. Exemple indépendant : 12 000 EUR à 12 % nominal sur douze mois, mensualité 1 066,185464 EUR et intérêts 794,225570 EUR. Mise en ligne suivie dans le journal opérationnel.


## Fiches immobilières des agences

L’ancien forfait d’émoluments « 1,3 % + 500 EUR » est remplacé par la fonction tarifaire déjà vérifiée. Le calcul automatique est réservé au logement existant en vente ordinaire, avant Bëllegen Akt : 6 % d’enregistrement + 1 % de transcription et émolument de vente TVA 17 % comprise. Hypothèque, débours, copies, honoraires d’agence et frais bancaires sont exclus et visibles. À 750 000 EUR : droits 52 500 EUR + émolument TTC 2 223,27 EUR = sous-total 54 723,27 EUR. Pour terrain, local commercial, bureau ou VEFA, le PDF n’applique aucun sous-total résidentiel et invite à obtenir le décompte adapté.

La valeur saisie n’est plus appelée « estimation indépendante » ou « modèle hédonique ». Son inclusion devient optionnelle ; la fourchette est explicitement un pourcentage choisi par l’agence, sans intervalle de confiance. Les descriptions commerciales préremplies sont supprimées. Les classes CPE et isolation sont distinctes, A+ est disponible, les valeurs par défaut sont non renseignées et aucune conformité réglementaire n’est certifiée par la fiche.

Le PDF utilise maintenant la langue sélectionnée et les montants à deux décimales. L’apport sur prix et les frais chiffrés sont distingués ; le modèle de crédit exclut assurance et frais bancaires. Les saisies incohérentes bloquent l’export et les erreurs de génération sont affichées sans effacer les champs.

Validation : 1 152 tests réussis, lint et compilation réussis, cinq langues et quatre largeurs vérifiées. Dix pages PDF de référence inspectées visuellement ; cinq autres PDF ont été réellement téléchargés via le formulaire local et leur contenu contrôlé. Contrôles d’interface : valeur optionnelle, A+/isolation distinctes, forfait supprimé, exclusion terrain/VEFA, taux zéro, champs invalides et bouton bloqué.


## Questionnaire énergétique

Les vingt questions sont conservées comme recueil déclaratif avant une étude professionnelle. L’ancien score, sa conversion en CPE A–G, les recommandations chiffrées sans métrés, les pourcentages forfaitaires Klimabonus et les gains additionnés puis plafonnés à 85 % sont supprimés. Le budget, l’occupation ou l’intention de rénover ne changent plus artificiellement une classe énergétique.

Chaque question admet « je ne sais pas ». Le dossier final distingue les réponses renseignées des inconnues, conserve toutes les réponses et fournit une liste de documents à examiner avec le professionnel. Un avancement de questionnaire n’est pas présenté comme une note énergétique. La navigation est explicite, sans temporisation susceptible de sauter une question après plusieurs clics. Modification et remise à zéro sont disponibles. Les métadonnées dans les cinq langues et la carte d’accueil énergie sont alignées.

Source : Guichet.lu, certificat de performance énergétique des bâtiments d’habitation et documents nécessaires, consulté le 9 septembre 2026. Le questionnaire ne détermine pas les aides : les critères techniques, dates, démarches et confirmations du dossier restent nécessaires.

Validation : 1 140 tests / 93 fichiers réussis. Quatre tests de recueil remplacent seize tests qui validaient les anciennes hypothèses arbitraires (classe et aides). Compilation et lint réussis. Parcours des vingt questions, toutes réponses inconnues, modification, remise à zéro, métadonnées et responsive contrôlés dans cinq langues.


## Chauffage / HVAC

Le calcul précédent comportait une erreur d’unité de facteur 1 000 dans la conversion de puissance et heures en consommation. Il combinait également des tableaux de puissance non démontrés « EN 12831 », des prix et caractéristiques de catalogues sans devis de modèle précis, un forfait d’eau chaude par nombre de pièces, des aides automatiques et une déduction TVA appliquée aux coûts sans base fiscale cohérente.

Le module compare maintenant deux scénarios explicitement documentés : chaleur utile annuelle, facteur saisonnier, prix de l’énergie, entretien et autres coûts annuels. Énergie achetée = chaleur utile / facteur saisonnier. Exemple : 18 000 kWh / 0,9 = 20 000 kWh ; 18 000 / 3 = 6 000 kWh. À 0,10 et 0,25 EUR/kWh avec 200 et 250 EUR d’entretien : coûts 2 200 et 1 750 EUR, économie 450 EUR. Les hausses de coût restent négatives. Aucune performance saisonnière n’est déduite d’un COP ponctuel.

Le détail conserve sept lots et ajoute les autres frais, saisis d’après les devis TTC. Les aides sont confirmées par le dossier, zéro sinon ; elles ne peuvent dépasser les devis et ne comprennent pas une économie TVA déjà incluse au prix TTC. Le retour simple et le solde nominal utilisent l’horizon saisi, avec prix constants, sans crédit/actualisation/remplacement. Aucun devis signifie budget incomplet et retour non calculé, sans ancienne valeur fictive de 99 ans.

La charge thermique et la puissance disponible sont renseignées depuis l’étude et les fiches aux mêmes conditions. Leur différence n’est pas une certification de dimensionnement : pas d’autosélection de produit, débit VMC, validation de modulation, appoint ou émetteurs. Le guide officiel Klima-Agence de planification des pompes à chaleur est lié ; aucun taux d’aide historique de ce guide n’est repris. Métadonnées et carte d’accueil adaptées.

Validation : 1 144 tests / 94 fichiers réussis, compilation et lint ciblé réussis. Les cinq langues et quatre largeurs ont été vérifiées, avec unités, coûts négatifs, aides excessives, facteurs invalides et horizon de retour. Cinq PDF (dix pages) ont été générés et inspectés ; les montants et kWh correspondent au scénario. Ancien générateur PDF HVAC devenu inutilisé supprimé. La mise en ligne est suivie au journal opérationnel.

## LENOZ

Les médailles et le score simplifié sans dossier sont remplacés par la vérification des seuils des quatre classes officielles : 85/40 %, 70/35 %, 55/30 % et 40 % global sans minimum catégoriel. Le second seuil s’applique séparément aux catégories économie, écologie, bâtiment/installations techniques et fonctionnalité ; implantation et société n’ont pas ce minimum. Le pourcentage global doit provenir du dossier complet, il n’est pas la moyenne des quatre saisies.

Les résultats restent une lecture des seuils déclarés et ne délivrent aucun certificat ni droit à aide. Les valeurs absentes, non finies et hors de 0 à 100 % empêchent le résultat et le PDF. Les métadonnées et l’accueil énergie sont adaptés dans les cinq langues. Les sources sont le ministère du Logement (classification et dossier LENOZ) et Guichet.lu, consultés le 9 septembre 2026.

Validation : 1 148 tests / 95 fichiers réussis, compilation et lint ciblé réussis. Les transitions entre les quatre classes et l’absence de classe ont été vérifiées pour chaque minimum catégoriel. Parcours navigateur dans les cinq langues, de 320 à 1 440 pixels, réussi ; le titre allemand a été corrigé pour éviter un débordement. Cinq PDF d’une page ont été générés et inspectés. L’ancien PDF fondé sur les médailles a été supprimé.

## Taxonomie UE — activité 7.7, atténuation

La voie CPE pour l’ancien accepte A/A+, pas B. Les seuils top 15 % et nZEB luxembourgeois sans source sont supprimés : le seuil et son justificatif doivent venir du dossier. La comparaison du récent utilise 90 % du seuil nZEB saisi ; elle ne suffit pas seule à remplir la contribution substantielle. Au-delà de 5 000 m², les justificatifs d’enveloppe et de GWP sont demandés. Au-delà de 290 kW pour le non-résidentiel, le suivi et l’évaluation de la performance sont requis. Les limites exactes 5 000 m² et 290 kW sont testées. La date pertinente est à établir avec les pièces et la FAQ (demande de permis).

Le DNSH de 7.7 porte ici sur l’adaptation selon l’appendice A ; les quatre axes eau/circularité/pollution/biodiversité sont N/A pour cette activité, sans supprimer les autres obligations légales. Les garanties minimales sont une revue des procédures de l’entreprise selon l’article 18, pas quatre cases assimilées à une certification. Le score 40/40/20 et le verdict d’alignement automatique sont supprimés. Le résultat distingue déclarations satisfaites, non satisfaites et inconnues, avec revue professionnelle nécessaire. Le changement de régime ou de voie réinitialise les seuils et leurs justificatifs.

Sources consultées le 9 septembre 2026 : règlement délégué 2021/2139 consolidé au 1er janvier 2026, annexe I sections 7.1 et 7.7 et appendice A ; communication Commission 2023/267, notamment FAQ 140–145 ; règlement 2020/852 articles 3 et 18. Le renvoi de 7.7 vers 7.1 vise la contribution substantielle et ne réimporte pas le DNSH de 7.1 (FAQ 141).

Validation : 1 144 tests / 95 fichiers réussis ; six tests remplacent dix anciens tests validant notamment la classe B et le score arbitraire. Compilation et lint réussis. Parcours cinq langues, seuils inclusifs, invalides, changement de voie, réinitialisation des preuves, métadonnées et affichage 320/390/768/1440 px vérifiés. Aucun PDF n’était proposé sur cette page. Accueil ESG et métadonnées mis à jour.

## Trajectoires énergie/carbone et accueil ESG

Les anciennes courbes prétendument CRREM « v3.0 2024 », les facteurs LU non étayés, le mélange chaleur utile/électricité des PAC, les rénovations forfaitaires et la date « net zéro » obtenue depuis la cible sont retirés. Les fausses obligations de location E en 2030 et D en 2033 sont également supprimées. Une année de dépassement n’est ni une interdiction de louer ni une estimation de perte de valeur.

Le module calcule les intensités depuis un bilan annuel documenté (kWh/surface et kg CO₂e/surface). La comparaison conserve deux graphiques et le détail annuel, mais repose sur cinq colonnes fournies par le dossier : année, cible énergie/carbone, bâtiment énergie/carbone. Toutes les années doivent être consécutives ; aucun zéro n’est inventé pour une cellule vide, aucune interpolation ou extrapolation n’est appliquée. Les évolutions du réseau, des consommations et des travaux appartiennent explicitement au scénario fourni. Le premier dépassement strict de chaque critère et le premier des deux sont conservés, même si le bâtiment revient ensuite sous la cible. Sans dépassement, le résultat vaut uniquement pour la période fournie. L’exemple optionnel est identifié comme fictif, sans données CRREM.

Limite d’intégration : la bibliothèque officielle CRREM consultée le 9 septembre 2026 publie les données et la méthode, mais exige un accord License Partner pour leur intégration commerciale. Aucun accord n’a été retrouvé dans le projet. Les données propriétaires ne sont donc pas embarquées et Tevaxia ne se présente pas comme un outil CRREM certifié. Le lien vers la bibliothèque officielle et le guide est conservé. Une intégration officielle complète reste conditionnée à la licence et à la validation contre les exemples de référence du fournisseur.

L’accueil ESG expose les deux outils opérationnels avec des liens conservant la langue ; les promesses de reporting SFDR/CRR, la décote automatique et les modules futurs sans date vérifiée sont retirés de la présentation. Métadonnées traduites alignées.

Validation : 1 137 tests / 95 fichiers réussis ; cinq tests remplacent douze tests de l’ancienne approximation. Lint et compilation réussis. Cinq langues et quatre largeurs contrôlées, bilan de 23 500 kWh / 150 m² et 4 200 kg / 150 m², dépassement strict, retour sous cible, années manquantes, champs vides, référence absente, décimales avec virgule et imports tabulés vérifiés. Les graphiques, le détail annuel, les métadonnées et les liens localisés de l’accueil ont été contrôlés. Cette page ne proposait pas de PDF.

## Valorisation — onglet environnement / ESG

Le score automatique, les niveaux A–E, les primes/décotes forfaitaires par CPE, risque, équipement, âge et certificat sont supprimés. Le relevé distingue désormais inconnu, présent et absent ; aucune réponse manquante ne devient une absence de risque. Le CPE A+ à I, les certifications et les sources du dossier sont déclaratifs. Les compteurs indiquent uniquement les réponses renseignées sur sept, pas une note ESG. L’outil explicite les dimensions environnementales couvertes et ne prétend pas couvrir seul social et gouvernance.

Une sensibilité de valeur séparée applique uniquement le pourcentage saisi à une valeur fournie, avec justification obligatoire pour tout ajustement non nul. Exemple : 1 000 000 EUR et −5 % donnent −50 000 EUR et 950 000 EUR ; +6 % donne 1 060 000 EUR. Changer le CPE ou la PAC n’altère pas ces montants. Le texte rappelle le besoin de comparables et le risque de double comptage dans loyers/rendement/travaux. Le résultat n’alimente pas automatiquement la réconciliation ni le PDF d’évaluation.

Source professionnelle : RICS, ESG and sustainability in commercial property valuation, quatrième édition 2026, entrée en vigueur le 30 avril 2026, consultée le 9 septembre. Aucun pourcentage de marché n’est déduit de ce standard.

Validation : 1 130 tests / 95 fichiers réussis ; trois tests remplacent dix tests de l’ancien score. Lint et compilation réussis. Cinq langues et quatre largeurs testées, états inconnus, indépendance CPE/valeur, ajustements positifs/négatifs, justification manquante et entrées invalides. Un débordement préexistant du titre allemand de la valorisation a été corrigé par retour à la ligne du groupe titre/badge.

## Valeur résiduelle après rénovation et coûts automatiques

La valeur résiduelle repose désormais sur une hypothèse de valeur après travaux, des devis TTC, honoraires, financement, provision choisie et aides confirmées. Les valeurs principales sont vides au départ ; aucune aide de 40 000 EUR n’est préremplie. Le dossier et la date de valeur doivent être référencés. Le résultat est présenté comme une sensibilité aux coûts, pas comme une décote de marché démontrée ou une conformité EVS/CRR. Le besoin de vérifier calendrier, actualisation et autres coûts est explicite.

La fonction refuse coûts négatifs/non finis, valeur nulle, provision hors de 0–100 % et aides supérieures au budget, au lieu de plafonner silencieusement ces dernières. Une valeur résiduelle négative reste visible. Exemple : 800 000 EUR de valeur après travaux ; 80 000 + 8 000 + 3 000 EUR de coûts ; provision 10 % = 9 100 EUR ; budget 100 100 EUR ; solde 699 900 EUR sans aide ou 739 900 EUR avec 40 000 EUR confirmés. Le changement des étiquettes CPE ne modifie aucun coût.

L’ancien estimateur déduisant les travaux, leurs prix et leur durée d’un saut de classe et d’une surface habitable est supprimé, ainsi que ses deux usages. Sur la page d’estimation, un renvoi général accessible sans connexion conduit au comparateur de rénovation documenté. Les détails d’estimation restent soumis au contrôle de connexion existant. Le texte d’aide automatique « jusqu’à 62,5 % » n’est plus affiché dans ce bloc.

Validation : 1 127 tests / 94 fichiers réussis ; ajout de trois tests sur les coûts/grants/invalides, suppression de six tests de l’estimateur sans source. Compilation et lint réussis. Cinq langues, quatre largeurs, budgets, aides excessives, montants négatifs et liens localisés contrôlés. Aucun nouveau PDF ni transfert automatique vers la réconciliation. La première vérification du lien a révélé qu’il était dans le bloc protégé : le renvoi général a été déplacé en dehors, sans modifier le contrôle d’accès.

## Disponibilité HTTP — contrôle transversal

Un contrôle en lecture seule des 160 routes statiques sans paramètre ni groupe de route a été effectué en production. Aucune réponse 4xx/5xx ni erreur réseau. Ce contrôle ne valide pas les calculs, l’authentification ou les parcours des routes dynamiques ; la revue métier reste ouverte.

## Terme et réversion — rendement équivalent

Le rendement équivalent était égal au loyer de marché divisé par la valeur : ce rapport est le rendement réversionnaire simple. Il est désormais résolu comme le taux commun actualisant les loyers en place et la réversion vers la même valeur. Le rendement initial simple et le rendement réversionnaire restent affichés séparément, hors frais d'acquisition. Convention explicite : loyers annuels à terme échu, années entières et réversion perpétuelle constante ; hypothèses de départ illustratives à justifier.

Exemple indépendant : 36 000 EUR pendant cinq ans au taux de terme de 4 %, puis 42 000 EUR capitalisés à 5 % et différés cinq ans : valeur 818 427,58 EUR ; rendement équivalent 4,9738 %, réversionnaire 5,1318 %, initial 4,3987 %. Le calcul accepte le terme nul et la réversion immédiate, refuse les durées fractionnaires et les valeurs invalides. La réconciliation reçoit la valeur calculée et efface cette entrée lorsque le scénario devient invalide.

Référence méthodologique : [RICS, APC valuation competency advice](https://ww3.rics.org/uk/en/journals/property-journal/apc-valuation-competency-advice.html). Validation : 1 131 tests / 94 fichiers réussis, compilation et lint réussis ; cinq langues et quatre largeurs, restitution des flux, taux nuls, loyer nul, durée nulle, invalides et transfert vers la réconciliation contrôlés. Aucun nouveau PDF.

## Estimation — provenance des informations complémentaires

Retrait des cinq comparables fictifs calculés autour du résultat de l'estimation et datés comme des transactions. Retrait de la courbe communale obtenue en multipliant une série nationale par le prix ajusté du bien, ainsi que du profil démographique sans provenance vérifiable par valeur. Les références communales officielles et le calcul déjà audités le 8 septembre restent utilisés ; aucune nouvelle série n'est inventée.

Un bloc public explique l'absence de ventes individuelles et de série historique communale dans ce résultat et les éléments nécessaires à une expertise. Il renvoie à STATEC pour les statistiques et aux outils bancaires contrôlés pour préparer le financement. Le crédit à 3,3 %, les charges fixes de 250 EUR et l'impôt de 15 EUR par mois ne sont plus présentés comme un budget du bien ; les frais réels à ajouter sont explicités. Le contrôle de connexion des détails est conservé.

Source vérifiée : https://data.public.lu/fr/datasets/prix-de-vente-des-appartements-par-commune/ — publication du 25 juin 2026, données communales agrégées, période avril 2025 à mars 2026. Validation : compilation et lint réussis, cinq langues et quatre largeurs, absence des anciens blocs et navigation bancaire localisée contrôlées. Les formules et le PDF d'estimation ne sont pas modifiés par ce lot.

## Estimation — historique local et liens partagés

L'historique JSON est validé avant utilisation : forme du tableau, champs textuels, date, valeurs positives finies, identifiants uniques et limite de 50 entrées. Une corruption n'écrase pas l'original. Les entrées lisibles restent consultables, les modifications sont bloquées et un téléchargement restitue le contenu original exact avant une éventuelle suppression confirmée. Les erreurs de quota ou d'accès au stockage sont signalées ; l'interface ne prétend plus avoir enregistré une modification qui a échoué.

Les liens partagés choisissent une commune exacte ou une recherche non ambiguë, jamais la première proposition d'une liste ambiguë. Les textes de récupération et de suppression sont traduits dans les cinq langues. Validation : 1 135 tests / 95 fichiers réussis, compilation et lint réussis ; cinq langues, quatre largeurs, export exact, annulation puis confirmation de suppression, ajout/suppression, lien ambigu et échec de stockage contrôlés dans des sessions de navigateur de test isolées.

## DCF — revenu de sortie, hypothèses et entrées invalides

Correction du revenu de sortie : les loyers et charges de l'année N+1 sont projetés séparément à leurs taux respectifs. L'ancien calcul appliquait l'indexation des loyers au NOI de l'année N, donc aussi aux charges, même si leur progression différait. Exemple indépendant : loyer initial 10 000 EUR, vacance 10 %, charges 2 000 EUR, croissance respective 10 % et 20 %, horizon deux ans : NOI 7 000 puis 7 500 EUR, NOI de sortie 8 010 EUR ; capitalisation 10 %, frais 10 %, produit net 72 090 EUR. Avec actualisation nulle : valeur 86 590 EUR.

Les flux annuels et la revente sont explicitement en fin d'année. Les valeurs initiales sont des exemples ; les travaux, financement, fiscalité et acquisition non modélisés sont signalés. Le TRI établi à partir du prix DCF lui-même est retiré de l'affichage : il retrouve par construction le taux d'actualisation pour les flux conventionnels et ne constitue pas une rentabilité indépendante. L'API conserve ce taux pour les flux conventionnels et renvoie null si des pertes intermédiaires rendent cette lecture inappropriée. La fonction IRR partagée avec d'autres outils n'est pas modifiée.

Validation des montants, taux, durée entière de 1 à 50 ans et revenu de sortie positif nécessaire à cette capitalisation. Les saisies vides et invalides ne produisent plus de résultat, y compris via l'API (400). Les taux de la matrice de sensibilité conservent leur précision ; le graphique en proportions qui devenait trompeur avec des flux négatifs est retiré. La valeur est transmise après calcul à la réconciliation et effacée quand le scénario devient invalide.

Référence : https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/discounted-cash-flow-valuation . Validation : 1 139 tests / 95 fichiers, compilation et lint réussis ; cinq langues, quatre largeurs, calcul indépendant, taux nul, champ vide, durée fractionnaire, sortie négative et API vérifiés. Aucun nouveau PDF.

## Valeur prudentielle — suppression des assimilations réglementaires

L'ancien calcul retranchait trois pourcentages par défaut (5 + 3 + 2 %) puis présentait le solde comme une MLV et fournissait une grille universelle de pondérations CRR2. Les données saisies ne permettent ni une évaluation prudentielle réglementaire ni une détermination du risque de crédit. Le règlement (UE) 2024/1623 a notamment modifié les articles 124–126 et 229 ; les régimes et conditions ne sont pas représentés par cette ancienne grille.

Le nouvel onglet permet une sensibilité additive documentée de la valeur issue de la réconciliation : trois décotes initiales nulles, référence et justification requises, total limité à 100 %, résultat identifié comme scénario non réglementaire. Aucun prêt maximal ni pondération de risque n'est inventé. Les exigences d'expertise indépendante, critères conservateurs, plafonds applicables et dossier bancaire sont expliquées sans prétendre les valider automatiquement. Aucun transfert automatique vers le rapport.

L'API authentifiée /api/v1/mlv conserve son chemin et ses champs numériques historiques pour compatibilité, mais marque explicitement le résultat non réglementaire et la méthode documentée. ltvBands est désormais vide ; les mentions de conformité et bases légales présentées comme certification sont retirées. L'authentification et la journalisation restent en place. Les corps null/tableaux et montants invalides sont refusés par 400.

Sources : https://eur-lex.europa.eu/eli/reg/2024/1623/oj ; https://www.eba.europa.eu/publications-and-media/publications/asset-side-0 . Validation : 1 144 tests / 96 fichiers réussis, compilation et lint réussis ; cinq langues, quatre largeurs, référence obligatoire, calcul 840 000 × (1 − 10 %) = 756 000 EUR, limite 100 %, invalides et absence de grille contrôlés. Trois tests de l'API utilisent une authentification simulée dans un environnement isolé, sans appel authentifié réel ni modification de données de clients.

## Présentation de l'API bancaire

La page /api-banques et ses cinq versions linguistiques décrivent désormais le contrat réellement implémenté : URL https://tevaxia.lu/api/v1/estimation, vrais champs de requête et enveloppe success/data/meta. L'exemple de réponse inventant nombre de comparables, précision, LTV recommandé et MLV est supprimé. Les annonces non démontrées de conformité TEGOVA, erreur inférieure à 8 %, latence inférieure à 200 ms, hébergement LU/EU, conservation garantie de 90 jours et délais garantis de mise à jour sont retirées.

Les limites de l'estimation communale et de la sensibilité prudentielle sont exposées. Les conditions d'intégration, confidentialité et service sont à documenter ; la journalisation observée dans le code est décrite sans prétendre valider l'ensemble du traitement des données. Les métadonnées sont traduites. Validation : compilation et lint réussis, cinq langues et quatre largeurs, vrais champs, liens localisés et métadonnées contrôlés. Aucune formule modifiée par ce lot. La documentation OpenAPI et l'endpoint batch font l'objet du lot suivant.

## Estimation API — contrat unitaire, batch et OpenAPI

Un validateur commun aligne les paramètres par défaut et les erreurs des endpoints unitaire et batch. Les types JSON sont contrôlés sans coercition : booléens textuels, champs inconnus, anciennes clés d'ajustement non reconnues, classes sans hypothèse dans ce modèle et maisons sont refusés au lieu de produire un calcul avec un paramètre ignoré. Les propriétés facultatives omises utilisent les valeurs documentées. A+, H, I et classe inconnue ne sont pas assimilées à D ; leur intégration nécessite un choix méthodologique distinct.

Le batch valide son corps même s'il est null, conserve les index et détaille les échecs par ligne ; sa méthode et ses limites sont identiques à celles de l'endpoint unitaire. Un même appartement avec les mêmes entrées renvoie exactement le même résultat. L'authentification et la journalisation sont préservées.

OpenAPI 1.1.0 corrige les champs, énumérations, valeurs par défaut et limites des schémas estimation, batch, sensibilité historique MLV et DCF annuel. Les promesses de certification, exemple de MLV avec champs inexistants et description du DCF comme multi-locataires sont retirés. Les autres endpoints de la spécification restent à revoir. La documentation web explique le contrat strict, les succès partiels et la vérification de response.ok ; ses métadonnées sont reprises dans les cinq langues. La clé sandbox publique ne déborde plus sur mobile.

Validation : 1 148 tests / 97 fichiers réussis, compilation et lint réussis. Un test lit directement le YAML publié et soumet son exemple, ses énumérations et ses valeurs par défaut au vrai traitement avec authentification simulée. Contrôles de types invalides, corps null, communes ambiguës, concordance unitaire/batch et succès partiel. Cinq langues, quatre largeurs, métadonnées, spécification servie et maintien de la réponse 401 sans clé vérifiés. Aucun appel avec une clé de client.

## Capitalisation directe — revenus, ratios et invalides

Les montants, taux, ERV facultative et limites numériques sont validés. Un taux nul, un revenu net non positif ou un dépassement numérique ne produit plus une valeur présentée comme exploitable. Les sensibilités à des taux impossibles sont omises au lieu d'afficher zéro. Le formulaire transmet sa valeur après calcul et efface l'entrée de réconciliation lorsque le scénario devient invalide.

Les bases sont explicites : vacance sur le loyer brut ; gestion et provision sur le brut avant vacance ; autres charges annuelles. Exemple indépendant : 10 000 EUR de loyer brut, vacance 10 %, charges fixes 1 000 + 200 + 100 EUR, gestion 5 % et provision 1 % : charges totales 1 900 EUR, NOI 7 100 EUR, capitalisation à 5 % = 142 000 EUR. Les ratios brut/net sont distingués ; le ratio ERV après vacance reste avant charges. L'ERV vide signifie inconnue, zéro signifie un loyer de marché nul. Des loyers égaux ne sont plus qualifiés de surloyer.

Le contrat OpenAPI de capitalisation décrit les vrais paramètres et fractions de taux, et son accès public actuel. Les champs historiques de ratios de l'API conservent leur formule documentée. Une protection contre l'infini est également ajoutée au DCF pour un taux de sortie extrêmement petit.

Validation : 1 153 tests / 97 fichiers réussis, compilation et lint réussis. Cinq langues, quatre largeurs, NOI, ERV vide/nulle/négative, taux nul, champs vides, transfert et effacement en réconciliation, API valide/400 contrôlés. Aucun nouveau PDF dans ce lot.


## Réconciliation et cohérence des rapports

La pondération normalise uniquement les méthodes disponibles et retenues ; poids non finis, négatifs ou supérieurs à 100 refusés. Une absence de méthode ne devient plus une valeur immobilière fictive de 750 000 EUR. La valeur centrale et les poids persistent entre réconciliation et sensibilité prudentielle et alimentent le PDF, le DOCX, la sauvegarde et les données de partage. Aucun export n'est proposé lorsque le résultat est absent ou invalide. Une signature antérieure n'est plus réutilisée si son contenu de calcul a changé. Les parcours externes de signature et de partage n'ont pas été exécutés avec des données réelles.

Les faux seuils EVS de dispersion, jauges de confiance fondées sur le seul nombre de méthodes, récits automatiques de conformité et sensibilités arbitraires sont supprimés de ce parcours. Les variations basse et haute sont explicitement arithmétiques, facultatives et non exportées. La note de travail doit être reprise dans le dossier final par le rédacteur. Les rapports ne déclarent plus automatiquement indépendance, conformité ou prime/décote universelle liée au CPE.

Une erreur d'unité est corrigée dans le PDF : le prix moyen au m² des références était divisé une seconde fois par la surface du bien. Les montants des rapports conservent désormais deux décimales, comme l'écran. Les quatre modèles utilisent la même valeur pondérée et affichent les poids effectifs.

Validation : 1 156 tests / 97 fichiers réussis ; compilation et lint réussis. Parcours dans cinq langues et quatre largeurs : deux valeurs 840 000 et 86 590 EUR, pondérations 25/75, résultat 274 942,50 EUR ; transfert prudentiel identique, poids conservés, zéro/vides/invalides et retrait des exports contrôlés. Quatre PDF fictifs totalisant 32 pages générés, textes vérifiés et toutes les pages inspectées visuellement ; DOCX généré et contenu XML contrôlé. Les autres parcours de rapports et la conservation des saisies propres à chaque méthode restent à examiner.


## Comparaison — références documentées et validation

Le formulaire n’invente plus un comparable en multipliant une moyenne communale par la surface et en lui attribuant le mois courant comme date de vente. Chaque nouvelle référence est vide ; adresse, source vérifiable, mois de vente non futur, prix, surface et justification sont requis. Les statistiques d’appartements existants restent un repère distinct, sans application automatique aux maisons, terrains ou locaux professionnels. Les repères de quartier et guides d’ajustement non vérifiés sont retirés de ce parcours.

Le calcul utilise des ajustements additifs et des poids relatifs explicites. Surfaces/prix non positifs, nombres non finis, poids hors 0–100, poids tous nuls et prix ajustés non positifs sont refusés. Un poids nul exclut la contribution de la référence. Aucun arrondi intermédiaire n’est appliqué lors du transfert PDF. Le calcul central réagit à la surface même lorsque l’onglet comparaison est fermé. Les références incomplètes ne sont pas envoyées aux exports ; dates, sources et justifications des références valides sont reprises dans les PDF et DOCX.

Source méthodologique : https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/comparable-evidence-in-real-estate-valuation (première édition toujours applicable pendant la consultation de la deuxième édition). Le logiciel ne certifie pas la réalité des ventes saisies.

Validation : 1 160 tests / 97 fichiers réussis, compilation et lint réussis. Exemple indépendant : 600 000/75 m² ajusté de +10−5 %, poids 1, et 400 000/60 m² sans ajustement, poids 3 ; surface évaluée 90 m², résultat 639 000 EUR. Cinq langues, quatre largeurs, références vides, invalides, sources et date requises, liaison réconciliation et changement de surface depuis un autre onglet contrôlés. DOCX téléchargé dans le navigateur avec montant, dates et sources vérifiés. Quatre PDF de test, 32 pages, régénérés avec une référence descriptive longue et toutes les pages inspectées.


## Valorisation — conservation des saisies pendant la session

Les méthodes visitées restent montées et masquées lors du changement d’onglet. Le passage calculateur/rapport conserve également les formulaires et le brouillon. La capitalisation directe et le terme/réversion ont désormais des résultats séparés ; le dernier onglet de revenu consulté détermine la méthode retenue, identifiée dans la réconciliation et les libellés exportés. Ouvrir une autre méthode ne réinitialise plus les saisies précédentes.

Le bouton Réinitialiser efface maintenant tous les formulaires du parcours : méthodes, notes, scénarios, brouillon, signatures, références, résultats et paramètres généraux reviennent à leur état initial. Ce maintien de saisie concerne la session de page ; il ne promet pas une sauvegarde durable après rechargement ou fermeture.

Validation : compilation et lint réussis ; parcours dans cinq langues et quatre largeurs. Loyers, taux, notes et brouillon conservés après plusieurs allers-retours ; valeurs directe et terme/réversion distinctes ; DCF conservé ; réinitialisation des champs et retrait des anciens exports vérifiés. Aucune formule numérique modifiée par ce lot.


## Périmètre de valorisation et export réel du brouillon

La page et ses métadonnées, dans les cinq langues, ne promettent plus une conformité automatique TEGOVA/EVS. Le sélecteur de base qui changeait seulement l’étiquette en loyer, liquidation ou MLV sans changer les calculs est retiré du calculateur. Le périmètre est un scénario indicatif de valeur en capital. Le type d’actif identifie le dossier sans imposer des taux ; les fourchettes de référence non justifiées, décotes MLV automatiques et score de conformité issu du remplissage sont retirés. Une surface vide, nulle, non finie ou supérieure à 10 millions de m² bloque réconciliation et exports de calcul.

Le brouillon de dossier dispose maintenant de son propre export HTML lisible et imprimable. Il reprend les valeurs actuelles des champs, les commentaires, les cases cochées ou non, les douze sections même repliées et les références de comparaison validées. Les PDF/DOCX de calcul sont explicitement distincts du brouillon rédactionnel. Le choix d’annexes constitue une liste de pièces à joindre : aucun fichier n’est attaché automatiquement.

Les états inconnus ne sont plus préremplis comme des faits : qualification REV, indépendance, compétence, six déclarations de certification, classe D, année 1990, état bon, propriété pleine, occupation libre et valeurs de conclusion sont supprimés comme valeurs par défaut. Les classes A+, H et I sont proposées avec un état non renseigné. Une valeur manuelle nulle n’est plus remplacée par la réconciliation. Le brouillon ne présente plus celle-ci comme une valeur CRR ni comme un financement à 80 %. Les boutons qui inventaient des faits de voisinage, d’urbanisme, d’ESG ou une incertitude sans données suffisantes sont retirés de ce parcours.

Validation : compilation et lint réussis ; cinq langues et quatre largeurs contrôlées. Export HTML téléchargé pour chaque langue, douze sections présentes, texte d’une section repliée conservé, source de comparaison présente, champs inconnus et cases non précochées vérifiés. Une saisie contenant des balises script reste du texte échappé ; le fichier ne contient ni script ni contrôle interactif. Impression de contrôle du brouillon : 17 pages inspectées visuellement. Les dernières corrections de libellés retirent des références normatives impropres et distinguent la case capitalisation directe de terme/réversion. Ce lot ne constitue pas une validation professionnelle des déclarations de l’utilisateur.


## DCF multi-locataires — flux mensuels déterministes et exports alignés

Le moteur abandonne les tirages aléatoires et les loyers annuels entiers pour les baux partiels. Les mois de début et fin sont inclus, la franchise et la contribution d’aménagement suivent le début réel du bail. Le loyer déclaré est courant à la date de valeur (initial pour un bail futur), sans réindexation rétroactive. Les paliers futurs sont appliqués à leur échéance. Une date de break déclarée devient une hypothèse explicite de sortie exercée. Après sortie, le loyer attendu combine ERV, probabilité d’occupation et vacance, sans seuil artificiel à 80 % et sans double perte.

Les remboursements de charges sont compensés par une dépense identique. Les charges fixes et la réserve CAPEX sont déduites ; la valeur terminale utilise le flux récurrent réellement projeté en N+1. Les contributions d’aménagement connues en N+1 sont déduites ponctuellement. Le périmètre précise que les changements ultérieurs ne sont pas projetés et que ce calcul ne mesure pas un rendement d’investissement. Le TRI circulaire, les scénarios aléatoires et les indications automatiques non étayées sont retirés.

Le formulaire démarre sans baux inventés ; un exemple fictif reste disponible sur demande. Les champs vides ou incohérents bloquent le calcul et ses exports. Import CSV atomique avec guillemets, décimales à virgule et zéros conservés, dates et paliers validés. Les CSV de baux et flux mensuels et le PDF utilisent le même moteur. Le PDF détaille les hypothèses, les baux et les flux annuels ; ses libellés généraux historiques restent en français, les explications du modèle sont traduites. Les cinq interfaces et métadonnées sont mises à jour.

Validation : 1 172 tests dans 98 fichiers, compilation et lint réussis. Parcours dans cinq langues et quatre largeurs (320 à 1440 px), import invalide sans remplacement de la liste, champs invalides sans résultat et téléchargements contrôlés. Cas indépendant juillet-décembre : 6 000 € de loyers, 2 000 € de franchise, 2 400 € d’aménagement, flux net 1 600 €, valeur 121 600 € à taux d’actualisation nul et taux de sortie 10 %. Les 600 € de remboursements de charges restent neutres ; une réserve CAPEX de 1 000 € réduit la valeur à 110 600 €. Cinq PDF de quatre pages inspectés visuellement, sommes du CSV vérifiées indépendamment.


## Projection mensuelle STR — calendrier, nuitées et portée statistique

Le revenu historique conserve désormais les nuitées déclarées, y compris zéro. Si elles sont absentes, l’estimation utilise l’occupation et les jours réels du mois, années bissextiles comprises. Les projections suivent également le calendrier. Le périmètre est un logement disponible tous les jours ; il ne convient pas à une agrégation de plusieurs unités ou à une disponibilité partielle. Les recettes sont brutes avant charges, commissions et fiscalité.

Import CSV atomique : mois uniques consécutifs, dates, montants, occupation, pourcentages explicites (1 % = 0,01), décimales à virgule avec séparateur point-virgule et nuitées entières contrôlés. Un fichier invalide ne remplace pas les données existantes. L’exemple est déterministe, entièrement fictif, identifié à l’écran et dans le CSV ; aucune attribution AirDNA/observatoire non étayée n’est conservée dans son code.

Les mentions de fiabilité déterminées seulement par la longueur de l’historique et de backtest sur des ajustements internes sont retirées. À partir de 24 observations, le modèle utilise Holt-Winters additif à paramètres fixes ; entre 6 et 23, une moyenne constante sans tendance. La fourchette est une variation arithmétique de revenu explicitement choisie, initialement nulle, sans probabilité ni intervalle à 95 %. Le besoin de saisons complètes pour initialiser la saisonnalité est documenté par le NIST : https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc435.htm ; cette référence ne valide pas la précision du modèle ni ses paramètres fixes.

Le CSV indique jours, nuitées, origine déclarée/estimée/projetée, données utilisateur/démonstration et variation. Les cinq interfaces et métadonnées sont alignées. La bannière globale de cookies permet maintenant le retour à la ligne de ses boutons sur mobile ; son lien de confidentialité respecte la langue courante.

Validation : 1 176 tests dans 98 fichiers, compilation et lint réussis. Cas indépendant janvier-juin 2024 : revenu total 7 000 €, février estimé à 1 450 € sur 29 jours, mars déclaré zéro, juillet projeté à 1 550 €. Variation ±10 % : 1 395–1 705 €. Contrôles navigateur et CSV dans cinq langues et quatre largeurs, conservation après import invalide, blocage des hypothèses invalides et identification de la démonstration.


## Prévisions hôtelières — données réelles, RevPAR et scénarios

Le parcours ne propose plus d’enregistrer un historique fictif dans un hôtel. Les anciennes lignes forecast_seed sont exclues des calculs et signalées sans être supprimées. Les imports CSV et saisies manuelles sont validés intégralement avant écriture : dates réelles non futures, doublons, occupation 0–100 %, ADR/RevPAR finis et non négatifs, pourcentages explicites et décimales à virgule. La fonction d’enregistrement refuse les sources de démonstration et exige une session authentifiée. Les droits de base existants restent en place ; aucune migration ni modification de dossier réel n’a été effectuée.

Le RevPAR est cohérent avec occupation × ADR ; un RevPAR fourni en contradiction au-delà de deux centimes est refusé lors de l’enregistrement. Sa projection combine occupation et ADR projetés, au lieu d’une troisième série indépendante. Définition professionnelle : https://www.costar.com/products/str-benchmark/resources/glossary et glossaire STR https://str.com/sites/default/files/us_hotel_forecast_review_sample.pdf. Les séries nécessitent au moins 14 jours uniques et consécutifs, sans valeur manquante pour la métrique retenue ; les jours manquants ne sont plus comprimés comme des jours adjacents.

Le prétendu backtest MAPE interne et les bandes à 95 % sont retirés de la présentation. La bande est une variation arithmétique choisie, initialement nulle, bornée selon la métrique. La méthode et ses paramètres fixes sont explicités ; aucune précision prédictive n’est garantie. Les moyennes sont identifiées comme des moyennes simples des jours, non des ratios pondérés par chambres. Les champs manuels ne préremplissent plus 75 % et 120 € comme des faits ; les montants affichent les centimes. Le changement d’hôtel vide immédiatement les anciens chiffres et ignore les retours de requêtes dépassées.

Validation : 1 181 tests dans 98 fichiers, compilation et lint réussis. Cas constant : occupation 50 %, ADR 100 €, RevPAR 50 €, variation ±10 % = 45–55 €. Tests de cohérence des projections, dates impossibles/futures, doublons, jours absents, valeurs nulles/invalides, données fictives et validation avant persistance. Dix rendus isolés de composant (cinq langues, séries complètes et incomplètes), quatre largeurs, formulaires et tableaux vérifiés ; capture française inspectée. Ces essais utilisent des fixtures locales, sans authentification à un dossier client et sans écriture de données réelles. La vérification des écritures de bout en bout avec un compte client réel n’a pas été effectuée.

Contrôle public : barrière de connexion et liens localisés préservés, descriptif du hub aligné dans les cinq langues.


## Carte et communes — population officielle RNPP

Les chiffres démographiques arrondis et estimés sans références par ligne sont remplacés par l’extrait CTIE du registre national des personnes physiques au 1er juillet 2026, publié le 6 juillet. Source officielle CC0 : https://data.public.lu/fr/datasets/registre-national-des-personnes-physiques-rnpp-population-par-commune-population-per-municipality/. L’extrait est administratif ; il n’est pas présenté comme une statistique STATEC de population résidente.

Les 100 communes, noms et quatre effectifs (majeurs/mineurs par sexe) concordent entre les versions CSV et XML officielles téléchargées indépendamment. Population = majeurs + mineurs, total des 100 lignes : 693 913. Exemples : Luxembourg 138 215, Esch-sur-Alzette 38 323, Redange/Attert 3 170. Le nom Redange du jeu immobilier est rapproché explicitement du code 0809. Les noms inconnus ne reçoivent aucun repli national ou estimation.

Le même composant affiche population, majeurs, mineurs, date et lien source sur la carte et les fiches communales, dans les cinq langues. Les revenus médians, taux d’emploi, proportions d’étrangers, densités et croissances non justifiés sont retirés. Les helpers cantonaux inutilisés de l’ancien jeu estimatif sont supprimés. Le fichier source original Windows-1252 est conservé avec empreinte SHA-256, métadonnées et désactivation de la conversion de fins de ligne pour préserver son intégrité sur Windows et en CI Linux.

Validation : 1 177 tests dans 98 fichiers, compilation et lint réussis. Les tests couvrent 100 codes uniques, additions, somme nationale, exemples indépendants, source/empreinte, correspondance de toutes les communes immobilières et absence de champs économiques inventés. Parcours carte et trois fiches dans les cinq langues et quatre largeurs. Le nom Grevenmacher de la carte par canton peut maintenant se couper sur petit écran, supprimant un débordement à 320 px.


## Indices immobiliers — série annuelle officielle et observations communales

Les graphiques partagés par /indices, /carte, les fiches /commune et /marche utilisent désormais les observations Eurostat prc_hpi_a pour LU, achats TOTAL, indice annuel moyen I15_A_AVG et variation RCH_A_AVG. La réponse source, mise à jour le 2 juillet 2026, est conservée dans docs/sources. Elle couvre les achats de logements neufs et existants par les ménages : https://ec.europa.eu/eurostat/web/housing-price-statistics. Tableau : https://ec.europa.eu/eurostat/databrowser/view/prc_hpi_a/default/table?lang=en.

Le graphique d’indice utilise les niveaux publiés : 100 exactement en 2015, 165,14 en 2025. Il ne cumule plus les pourcentages annuels arrondis, et n’applique plus la hausse 2015 à sa propre année de base. Les variations publiées comprennent -9,1 % en 2023, -5,2 % en 2024 et +1,6 % en 2025. Aucune observation annuelle 2026 n’est inventée. La portée nationale, les années, les données tabulaires et la source sont disponibles dans les cinq langues.

La page /indices retire le composite de santé du marché à composantes non étayées, les classements de hausses/baisses et les tendances déduites de l’écart prix annoncés/prix enregistrés. Cette différence entre échantillons ne mesure pas une évolution dans le temps ni une décote négociable. Le prix moyen national précédemment obtenu par moyenne simple des communes n’est plus affiché. La page présente l’indice national officiel et les observations communales de transactions existantes avec leur période, recherche, tri et CSV de la sélection. Les données absentes restent absentes, sans zéro fictif, et se trient en fin de liste. Les métadonnées ne promettent plus un indice mensuel ou des tendances locales non mesurées.

Validation : 1 180 tests dans 99 fichiers, compilation et lint réussis. Chaque point est comparé à la réponse JSON-stat source, avec contrôle des unités, du pays, du champ TOTAL, de l’année de base et de l’absence de 2026. Vérifications navigateur dans cinq langues, quatre pages consommatrices et quatre largeurs, tableaux, recherche, tri, lien communal localisé et CSV téléchargé.

Limite de ce lot : le module d’ajustements temporels ancien demeure dans un composant orphelin non utilisé par les pages ; il n’alimente plus les graphiques publics. Les autres indicateurs du marché commercial et les commentaires locaux font l’objet de la suite de la revue.


## Carte, fiches communales et PDF — observations distinctes et valeurs absentes

La carte et les fiches communales présentent maintenant le même bloc d’observations : moyennes enregistrées existant/VEFA, prix annoncés, loyers annoncés et leurs effectifs respectifs, période et liens directs vers les sources de l’Observatoire de l’Habitat. Les prix absents sont « non publiés », tout en conservant les effectifs disponibles. Les montants sont affichés avec centimes.

Le score de marché et les commentaires automatiques attribuant une qualité au volume de transactions ou une remise négociable à l’écart annonces/transacté sont retirés de ces pages. Le ratio loyer/prix brut est nommé comme tel : il combine des moyennes de biens différents et ne déduit pas vacance, charges, travaux, frais ou impôts ; il ne constitue pas le rendement d’un investissement précis. Une recherche sans résultat sur la carte n’affiche plus toutes les communes. Les liens vers estimation et valorisation respectent la langue courante.

Le PDF de carte reçoit les mêmes observations, libellés et dates que l’écran. Il ne présente plus le prix annoncé comme médiane, ni une décote artificielle de 15 % et un prix VEFA comme fourchette de valeur. Une moyenne non publiée n’est jamais remplacée par zéro, y compris sur la couverture. Les liens de sources sont cliquables. Les libellés et explications métier sont traduits en cinq langues ; le pied de page et l’avertissement commun historique restent en français.

Validation : compilation, lint et suite de tests réussis. Dix PDF (Luxembourg et Beaufort, cinq langues), trente pages inspectées visuellement ; montants, centimes, période, effectifs, mentions de données absentes et trois liens source vérifiés. Contrôles navigateur des deux communes et de la carte, cinq langues et quatre largeurs, retrait des scores, recherche inconnue et liens localisés. Les cartes de montants utilisent une colonne sur petit écran pour conserver les centimes lisibles avec le zoom général de 10 %. Aucun nouveau modèle financier n’est introduit : le bloc et le PDF exposent les observations existantes sans fabriquer de médiane ou d’intervalle.

### Scénarios de prix immobiliers — 9 septembre, 15:00
- Suppression de l’historique communal fictif interpolé depuis une ancienne série nationale et du CAGR associé. Suppression du prix de secours à 7 500 €/m².
- Prix et mois de départ déclarés, référence communale facultative avec période/source exacte, copie explicite et absence de prix respectée. Changer de commune efface la saisie précédente.
- Trois taux annuels constants déclarés, initiaux neutres à zéro, ordre et bornes contrôlés. Calcul exact prix × (1+taux/100)^(mois/12), sans arrondi intermédiaire. Aucune probabilité ni intervalle de confiance.
- Tableau mensuel accessible, affichage monétaire localisé à deux décimales, cinq langues et quatre largeurs de 320 à 1440 pixels. Libellés et métadonnées corrigés.
- Vérification : 1175 tests / 99 fichiers, build et lint réussis ; cinq parcours navigateur réussis (référence manquante, copie, changement de commune, capitalisation, champs vides/invalides et responsive).
- Lot communal précédent a654fa9 : CI 34351228936 réussie, déploiement dpl_CNgSody7KFBPkdZoysJjGmDvJHwo prêt, cinq parcours de production réussis.

### Page marché et export par commune — 9 septembre
- Résidentiel : huit observations, période/source, conservation des zéros publiés et des valeurs absentes, tri des valeurs manquantes en fin de liste dans les deux sens. CSV de la sélection avec sources. Liens localisés.
- PDF : export des communes séparément, suppression de la moyenne simple présentée comme nationale et du champ VEFA étiqueté « maisons ». Montants à deux décimales. Nouveau document en cinq langues, polices PDF standard pour éviter une corruption des caractères lors de générations successives ; cette correction concerne ce document, les autres générateurs restent à examiner sur ce point.
- Bureaux : six repères du rapport Cushman & Wakefield Office MarketBeat Q2 2026. Commerce : quatre repères du Retail MarketBeat H1 2026. Prix prime distingués des moyennes et take-up distingué des ventes. Chaque CSV précise période, source, URL, page et périmètre.
- Terrains : ventes retenues 2023/2024 (326/565) et variation hédonique 2022–2024 (−14,9 %) du rapport 19, p.5, publié le 10 octobre 2025. Suppression des prix par zone non justifiés.
- Logistique et macro : absence de série vérifiée explicitée, sans anciens loyers/stocks/taux non documentés ; accès aux séries BCL/STATEC. La bibliothèque historique market-data-commercial n’alimente plus la page publique.
- Rapports vérifiés : https://content.cushmanwakefield.com/api/public/content/85790d9d1da645ec8a369dfc2d0885c1?v=0ebfb4e7 ; https://content.cushmanwakefield.com/api/public/content/7bff92eb9e6f411abc223f57882307ca?v=0e941721 ; https://logement.public.lu/dam-assets/documents/publications/observatoire/rapport-analyse-19.pdf . Empreintes et pages dans docs/sources/commercial-market-references-2026-09-09.json.
- Contrôles : 1175 tests / 99 fichiers ; six onglets × cinq langues × quatre largeurs, filtres/tris et 20 CSV vérifiés. PDF de deux communes dans cinq langues (20 pages) plus export des 100 communes (102 pages), pages rendues et contrôlées visuellement, bornes et liens vérifiés.
- Scénarios de prix d88d481 : CI 34354070104 réussie, déploiement dpl_4T5cJbKyLJ6DwyyExEd1bCekU9AW prêt et cinq parcours de production réussis.

### Budget de construction documenté — 9 septembre
- Remplacement des coûts unitaires et pondérations prétendument STATEC/Batiprix, des majorations CPE automatiques et des honoraires par défaut par un bordereau de postes documentés. Dix-sept suggestions de libellés conservées, sans prix présumé.
- Quantité propre à chaque poste (unité/forfait, m², m³, m ou h), prix TTC, distinction travaux/frais, référence obligatoire. Surface brute facultative utilisée seulement pour le ratio final. Ajout/suppression de postes ; champ vide distinct de zéro.
- Montants calculés en centimes avec arithmétique entière et arrondi par ligne ; provision déclarée sur travaux uniquement, justification si positive. Aucune aide ni récupération de TVA automatique, total limité aux postes saisis.
- Nouveau CSV et PDF utilisant le même calcul, avec références, quantités, prix et hypothèses. PDF en polices standard, cinq langues, 15 pages rendues et vérifiées. Metadonnées et mentions d’intégration tarifaire sur accueil/pages promoteurs corrigées.
- Méthodologie primaire : https://statistiques.public.lu/fr/donnees/methodologie/methodes/economie-totale-prix/prix-construction.html ; l’indice mesure une évolution des prix, hors TVA et terrain, et ne constitue pas un devis.
- Vérification : 1180 tests / 100 fichiers réussis, build réussi, lint sans erreur (un avertissement existant dans calculateur-loyer). Cinq parcours navigateur et cinq CSV : 12,5 × 80,12 = 1001,50 € travaux, 200 € frais, 10 % aléas sur travaux = 100,15 €, total 1301,65 €. Cas vide/zéro/référence manquante et largeurs 320/390/768/1440 contrôlés.
- Marché bf64d1f : CI 34355538434 réussie, déploiement dpl_9mXNPPsXk4QyR17NGnmPax6MMEge prêt, cinq parcours de production réussis.

### VRD : métrés explicites et budget documenté — 9 septembre
- Suppression des prix unitaires présumés Batiprix/CTG/Creos, des valeurs de projet fictives et des coefficients pente/sol rocheux non justifiés. Neuf suggestions de lots conservées pour le classement.
- Bordereau TTC commun avec le budget de construction, prix et références requis ; aucune quantité/prix par défaut ne produit un résultat complet. Les dimensions d’un métré transféré restent dans le libellé.
- Calcul géométrique facultatif : longueur × largeur ; volume = longueur × largeur × épaisseur en cm / 100. Quantité arrondie à quatre décimales, bornes et valeurs invalides contrôlées. Aucune prétention au dimensionnement de réseaux/chaussée, ni foisonnement/compactage automatique.
- CSV et PDF réutilisent le moteur de totaux en centimes. Cinq PDF (15 pages) rendus et contrôlés. Les anciens générateurs ConstructionDoc/VrdDoc de ToolsPdf sont désormais sans appel depuis ces pages et restent hérités.
- Vérification : 1183 tests / 101 fichiers, build réussi, lint sans erreur (avertissement existant calculateur-loyer). Cinq parcours VRD et cinq parcours de non-régression construction réussis à 320/390/768/1440 px ; cinq CSV vérifiés. Cas : 100 × 6 × 20/100 = 120 m³ ; 120 × 22 = 2640 € TTC.
- Construction 110e281 : CI 34356811700 réussie, déploiement dpl_58h2QQ7HXktoEtdvsFSMPiyb1BNw prêt et cinq parcours de production réussis.


## Commandes PDF communes — contrôle du parcours et des erreurs
- Chargement de session et génération en cours désactivent les actions ; verrou synchrone contre les doubles générations.
- Fenêtre de connexion native accessible et traduite dans les cinq langues, lien de connexion localisé, fermeture par Échap et retour du focus.
- Échecs de génération, fichiers vides et fenêtres bloquées signalés sans exposer de détails techniques. Une fenêtre de prévisualisation fermée ou déjà naviguée n’est pas réutilisée.
- Validation : 1 183 tests / 101 fichiers, build de production, lint du composant ; fixture isolée des actions autorisées et parcours public réel dans les cinq langues / quatre largeurs. Aucun compte réel ni donnée client utilisé pour les tests authentifiés simulés.
- Ces contrôles portent sur la commande commune, pas sur l’exactitude de tous les rapports PDF encore à revoir.


## Bilan promoteur — recettes et coûts documentés, résiduel et bénéfice distincts
- Remplacement du modèle à coûts et honoraires présumés, financement sur une assiette erronée et calendrier VEFA fixe. Le nouveau bilan démarre sans chiffres : chaque recette/dépense, mois et référence doit être saisi.
- Terrain connu : bénéfice = recettes − dépenses − terrain − frais fixes/proportionnels d’acquisition ; écart à la marge cible distinct du bénéfice. Compte à rebours : budget après coûts, cible et frais fixes, puis prix compatible après frais proportionnels. Budget négatif conservé sans inventer de taxe négative.
- Arrondis monétaires au centime ; calcul des pourcentages en entiers. Recettes positives, autres montants explicitement nuls ou positifs, limites 200 lignes/120 mois et références obligatoires.
- Base économique déclarée : hors TVA effectivement récupérable, TVA non récupérable incluse. Pas de calcul automatique de droits, d’aides ou d’impôt sur le résultat. Les frais financiers sont les montants documentés de l’opération.
- Échéancier de budget, uniquement pour terrain connu, dépenses avant recettes dans chaque mois ; acquisition au mois du terrain. Le solde final rejoint exactement le bénéfice. Le déficit est celui de cette convention, pas un calcul de crédit/equity ni une trésorerie bancaire avec décalages de TVA.
- Export CSV avec références et soldes, dossier JSON complet et import validé atomiquement, PDF de tous les paramètres et lignes. Les anciens scénarios locaux ne sont ni écrasés ni présentés comme compatibles. Les anciennes commandes de partage et extraction liées au schéma incomplet ont été retirées de cette page ; les liens déjà émis restent sur leur lecteur historique.
- Textes d’accueil, descriptifs professionnels et métadonnées alignés ; suppression des annonces de TVA automatique, tornado et Gantt qui ne correspondent plus au calcul proposé.
- Sources : https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/valuation-of-development-property ; https://guichet.public.lu/fr/citoyens/logement/acquisition/aspects-contractuels/acquerir-bien-a-construire.html . Aucun label de conformité RICS n’est attribué au résultat.
- Validation : six tests métier dédiés, suite de 1 189 tests/102 fichiers ; parcours navigateur cinq langues/quatre largeurs, export/rechargement complet et rejet sans perte des dossiers invalides. Dix PDF, 35 pages rendues et inspectées visuellement, montants/références/limites de pages contrôlés.
- Cas chiffré : recettes 1 000 000 €, coûts 620 000 €, terrain 200 000 €, acquisition 24 000 € → bénéfice 156 000 €, cible 150 000 €, écart 6 000 €. En résiduel : budget 220 000 €, prix terrain 205 607,47 € avec frais proportionnels déclarés à 7 %.


## Chargement initial de session
- Abonnement aux événements d’authentification avant lecture de la session initiale ; un événement récent prend la priorité sur une réponse initiale tardive.
- Une erreur de lecture initiale est interceptée et libère l’état de chargement. Le démontage du composant désabonne et empêche les mises à jour tardives.
- Fixture React hors ligne du composant réel : session normale, rejet initial, connexion/déconnexion/rafraîchissement prioritaires, démontage et absence de promesse rejetée non traitée. Aucun compte réel utilisé. Suite 1 189 tests, lint du composant.


## Terres agricoles — suppression des prix présumés et série officielle
- Retrait de la grille région/qualité sans transactions identifiées, de la décote forfaitaire de bail 30 %, des valeurs bâtiments 150 €/m² et des coûts automatiques 80/45 €/m². Une cessation d’exploitation ne déclenche plus une démolition calculée.
- Calcul documenté : hectares × prix/ha + bâtiments conservés − démolition − remise en état ; chaque montant et le périmètre des droits/TVA doivent être explicités. Pas de valeur de marché certifiée ni de contrôle juridique de parcelle revendiqué.
- Conversion 1 ha = 10 000 m², surface à quatre décimales d’hectare, prix/coûts à deux décimales, arrondi monétaire en entiers au centime ; zéros explicites, données absentes bloquantes, résultats nets négatifs conservés.
- Série SER/LUSTAT DF_D2121 : 66 observations nationales 2003–2024, trois séries distinctes (arables, prairies, médiane combinée). Publication indiquée 23/08/2025, extraction 09/09/2026. Source liée par le portail ministériel : https://lustat.statec.lu/rest/data/LU1,DF_D2121,1.0/all .
- Périmètre : transactions d’agriculteurs, usages non agricoles exclus. Note officielle : hors TVA, frais de notaire inclus et, depuis 2015, TVA sur ces frais incluse. Aucune moyenne reconstituée, aucune projection 2026 et aucune application automatique à la parcelle.
- CSV et structure SDMX conservés avec SHA-256 et attributs Git de préservation des octets ; toutes les observations recoupées et labels lus dans CL_D2121_SPECIFICATION. Source de méthode : https://agriculture.public.lu/de/agrarstatistik/landwirtschaftliche-preise-und-indizes.html .
- Validation : cinq tests métier/source, suite 1 194 tests/103 fichiers, build et lint, cinq langues/quatre largeurs et CSV contrôlés. Cas 2,5 ha × 40 000,25 €/ha = 100 000,63 € ; +10 000 −2 000 −3 000 = 105 000,63 €.


## Compte d’exploitation hôtelier documenté
- Retrait du modèle par catégorie qui ajoutait recettes restauration/annexes, ratios de charges, croissance et réserve 4 % sans justificatifs, et présentait le résultat après réserve comme EBITDA.
- Nouveau compte d’une période déclarée de 1 à 366 jours ; jours calendaires réels, capacité disponible saisie et plafonnée à chambres × jours, chambres-nuits vendues cohérentes. Ratios indéfinis conservés comme tels en l’absence de dénominateur ; occupation zéro autorisée, plus de plancher 5 %/plafond 95 % inventé.
- Onze catégories obligatoirement documentées, y compris zéro : recettes chambres/F&B/autres, personnel départemental et général séparé des autres charges, management, produits/charges non opérationnels et réserve. Pas de salaires ajoutés une seconde fois dans les autres charges.
- GOP puis EBITDA avant réserve, puis EBITDA après réserve clairement séparés. Exclusions des intérêts, impôt sur résultat et amortissements explicites ; pas de certification USALI ou benchmark de solvabilité HVS/PwC.
- Export CSV avec unités de chaque compteur/ratio/montant, toutes les lignes et références. Le titre générique de colonne du CSV promoteur a également été corrigé (valeur plutôt qu’EUR pour des cellules contenant des pourcentages ou textes).
- Textes du hub, descriptifs professionnels, métadonnées et guide IA alignés. Les anciennes fonctions usali.ts ne sont plus utilisées par la page et restent uniquement dans les tests historiques.
- Sources : https://www.costar.com/products/str-benchmark/resources/glossary ; https://www.hftp.org/downloads/documents/usali/resources/usali_faqs.pdf .
- Validation : cinq tests dédiés, suite 1 199 tests/104 fichiers, cinq langues/quatre largeurs ; cas de février 2024 (29 jours), capacité réelle, zéro vente/disponibilité, pertes et données manquantes. Cas recettes 35 000 €, personnel 10 000 €, GOP 18 000 €, EBITDA 16 000 €, après réserve 14 000 €.


## Valorisation hôtelière — méthodes distinctes et preuves saisies
- Retrait de l’estimation des recettes/charges par catégorie, du taux et du prix/chambre présumés, de la moyenne automatique entre méthodes et de la fourchette ±15 %. Le calcul revenu/taux est désormais nommé capitalisation directe, pas DCF.
- Revenu annuel stabilisé et taux documentés sur un même périmètre de droits ; revenu nul/négatif conservé, sans assimiler absence de valeur par capitalisation à un bien valant zéro.
- Comparaison : transactions identifiées, sources, prix, nombres de chambres entiers, dates au plus tard à la date de valeur, ajustements justifiés et poids explicites. Calcul prix/chambre ajusté puis moyenne pondérée sans arrondis intermédiaires, appliquée aux chambres du sujet.
- Les deux méthodes peuvent être utilisées séparément ou affichées ensemble ; aucune réconciliation automatique. Droits immobiliers, mobilier et exploitation doivent être distingués.
- CSV des hypothèses, transactions, références, dates, poids normalisés, unités et résultats séparés ; les anciens liens déjà partagés restent des lectures historiques et ne sont pas recalculés par cette page.
- Sources : https://ww3.rics.org/uk/en/journals/property-journal/valuation-approaches-methods-models.html ; https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/discounted-cash-flow-valuation .
- Cinq tests métier ; suite 1 204 tests/105 fichiers. Cas 100 000 €/an à 5 % → 2 M€. Comparables 100 000 €/chambre +10 %, poids 1, et 120 000 €/chambre −5 %, poids 3 → 113 000 €/chambre, soit 2,26 M€ pour 20 chambres.
- Validation navigateur finale de la valorisation hôtelière : cinq langues/quatre largeurs, méthodes indépendantes, export CSV, transactions futures refusées et zéro poids bloquant ; build et lint passent.

## Couverture de dette hôtelière — revue du 9 septembre 2026

La page /hotellerie/dscr utilise désormais un emprunt à mensualités constantes documenté : capital, taux nominal annuel, durée entière en mois, frais mensuels et frais initiaux distincts. Le flux disponible annuel et son origine sont saisis explicitement ; il n'est pas assimilé automatiquement à l'EBITDA. Le scénario dégradé exige son propre flux et sa référence. Le LTV repose sur une valeur immobilière documentée, pas sur le coût du projet. Le seuil de DSCR appartient au dossier et ne vaut pas décision bancaire.

L'annuité présentée est annualisée sur douze mois ; l'échéancier regroupe les mois réellement remboursés, y compris la dernière période incomplète. Le flux de chaque période est réparti uniformément au prorata des mois, hypothèse explicitée. Un service nul produit un ratio indisponible ; les flux négatifs restent négatifs. La capacité mathématique résout la même formule d'annuité en déduisant les frais récurrents. Les frais initiaux sont séparés du DSCR récurrent et inclus dans le total payé. Les exports CSV conservent les hypothèses, références, unités et échéances.

Périmètre : prêt fixe à échéances de fin de mois, sans différé, ballon, remboursement anticipé ni taux variable. Ce modèle ne remplace pas les dates, arrondis et conventions contractuels. Référence de contexte : EBA, Guidelines on loan origination and monitoring (2020), sans seuil automatique présenté comme réglementaire.

Validation : 1 210 tests sur 106 fichiers, compilation et lint réussis ; navigateur dans cinq langues et quatre largeurs (320, 390, 768, 1 440 px), export CSV contrôlé. Cas de référence : 120 000 EUR sur 120 mois à taux nul = 1 000 EUR/mois ; flux 15 000 EUR/an = DSCR 1,25. Avec 100 EUR/mois de frais : service 13 200 EUR/an, capacité 108 000 EUR pour un seuil de 1,25 ; 200 EUR initiaux portent le total payé à 132 200 EUR. Cas sept mois, absence de prêt, champs manquants et flux négatifs vérifiés. L'ancien module dscr.ts, désormais sans consommateur public dans cette page, et les anciens liens partagés ne sont pas recalculés.

## Pré-acquisition hôtelière — revue du 9 septembre 2026

La page /hotellerie/pre-acquisition remplace les multiples EBITDA et prix par chambre non sourcés, la moyenne automatique de valorisations et le score go/no-go par un scénario de trésorerie documenté. Les flux avant dette sont saisis séparément pour 1 à 30 années complètes ; ils intègrent, sous la responsabilité du rédacteur et avec référence, charges, impôts, besoin en fonds de roulement et investissements. Ils ne sont pas assimilés automatiquement à l'EBITDA, ni extrapolés par des taux cachés.

Le financement initial est équilibré : prix + frais initiaux (financement compris) + investissements initiaux − dette = apport initial. Une dette supérieure au besoin est rejetée. Le prêt utilise les mensualités constantes vérifiées ; son service et ses frais cessent à l'échéance, même en cours d'année. La sortie en fin de dernière année utilise un prix et des frais/impôts documentés, puis déduit le capital restant après les échéances de l'année. Le prix de sortie n'est pas une estimation automatique de marché.

Les flux nets négatifs sont des apports complémentaires ; les flux positifs sont les distributions. Le multiple est distributions/apports cumulés, sans double comptage du capital initial. La VAN utilise le taux explicite des fonds propres. Le TRI est calculé par dichotomie uniquement pour une séquence partant d'un apport négatif et avec un seul changement de signe ; aucun chiffre n'est inventé pour plusieurs changements de signe, absence d'apport ou absence de racine dans le domaine numérique. Les modèles restent annuels, à flux de fin d'année, sans financement intrannuel automatique.

CSV : entrées, références, unités et échéances. JSON : sauvegarde complète et restauration validée avant remplacement du scénario ; fichier incompatible/invalide refusé sans effacer le travail courant. Les anciens enregistrements locaux ne sont ni effacés ni interprétés comme ce nouveau modèle. Aucun score ne vaut décision bancaire ou conseil d'achat. La présentation du module sur le hub est alignée.

Validation : 1 217 tests sur 107 fichiers ; lint et compilation finale réussis. Cas métier : prix 100 000 EUR, frais 10 000 EUR, investissements 10 000 EUR, dette 60 000 EUR à 0 % sur 24 mois ; apport 60 000 EUR, mensualité 2 500 EUR. Deux flux annuels de 40 000 EUR, sortie 110 000 EUR moins 10 000 EUR de coûts : distributions 120 000 EUR, multiple 2, gain 60 000 EUR. Tests de maturité 7/12/120 mois, frais, pertes, apports complémentaires, TRI absent et import incompatible. Les contrôles navigateur couvrent cinq langues, quatre largeurs et les exports CSV/JSON. Référence méthodologique de contexte : RICS, Discounted cash flow valuation ; aucun agrément RICS du logiciel n'est revendiqué. Ancien pre-acquisition.ts désormais sans appel dans la page publique, non refondu.

## E‑2 : dossier documentaire, sans score d'éligibilité

La page /hotellerie/score-e2 ne calcule plus de probabilité d'acceptation ni de diagnostic favorable/rejet probable à partir d'un ratio de capital, d'un revenu minimal présumé ou du nombre d'emplois. Le modèle précédent utilisait des seuils arbitraires (30/50/75 % de capital, cinq emplois, revenu x1/x2) qui ne peuvent pas remplacer l'examen des conditions E‑2.

Le nouveau parcours prépare le dossier d'un investisseur principal : nationalité conventionnée, nationalité de l'entreprise, origine/contrôle des fonds, engagement/risque, entreprise réelle, investissement substantiel, non-marginalité, développement/direction et intention de départ. Chaque rubrique débute à documenter ; les états « pièce renseignée » exigent une référence, sans que cette saisie atteste la validité du document. Aucun score ni avis automatique ne résulte d'un dossier rempli. Le périmètre exclut la prétention à couvrir toutes les conditions d'admission, les salariés et les familles ; les instructions consulaires et l'examen individuel restent nécessaires.

Sources officielles consultées le 9 septembre 2026 : Department of State, 9 FAM 402.9 (version CT:VISA-2190, 17 février 2026), sections 4 et 6, page Treaty Trader & Treaty Investor et liste des Treaty Countries. Le FAM précise l'absence de minimum universel en dollars et de pourcentages fixes pour le caractère substantiel ; la non-marginalité peut reposer sur une contribution économique significative et la capacité future est généralement appréciée dans les cinq années du début normal d'activité. La propriété conventionnée de 50 % et la capacité personnelle de contrôle sont distinguées. La page précise qu'une dette garantie par les actifs de l'entreprise ne constitue pas le capital à risque de l'investisseur.

Références : https://fam.state.gov/fam/09FAM/09FAM040209.html ; https://travel.state.gov/content/travel/en/us-visas/employment/treaty-trader-investor-visa-e.html ; https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/treaty.html . Le FAM a été récupéré directement sur le domaine officiel après échec de l'outil de lecture web ; aucun miroir USCIS non officiel n'a été retenu.

Exports CSV et JSON : neuf états et références, sans score ; import validé avant remplacement et conservation du dossier en cas d'erreur. Aucun document n'est transmis par cette page. Validation : 1 221 tests, 108 fichiers, compilation et lint réussis ; cinq langues, quatre largeurs, saisies de références, exports et import incompatible vérifiés. L'ancien e2-score.ts reste orphelin de la page, ses anciens tests ne constituent pas une validation juridique de ses seuils.

## Accès aux détails : clavier, langue et conservation des saisies

AuthGate masque maintenant ses commandes au clavier et aux technologies d'assistance avec inert/aria-hidden tant que la session est en cours de vérification ou anonyme. L'état de chargement affiche un message traduit et pas d'invitation prématurée à se connecter. L'invitation et son lien respectent les cinq langues. Les enfants restent montés lors des transitions de session afin de préserver leurs saisies. Ce composant de présentation ne remplace pas les autorisations serveur des données privées.

Le composant ToggleField autorise le retour à la ligne des longs libellés ; le débordement constaté sur le simulateur d'aides allemand à 320 px est corrigé. Les fils d'Ariane hôteliers des pages exploitation, DSCR, pré-acquisition et E‑2 ont des libellés traduits.

Validation : composant réel testé hors ligne dans les cinq langues (chargement, navigation Tab, lien localisé, connexion/déconnexion simulées, un seul montage et maintien des saisies). Compilation finale et lint réussis. Navigateur sur simulateur d'aides : cinq langues, quatre largeurs, contrôle des attributs d'accessibilité, manipulation des interrupteurs, navigation vers connexion et fil d'Ariane E‑2. Aucun compte client réel n'a été modifié pour ces essais.

## Comparatif hôtelier : volumes documentés et indices cohérents

/hotellerie/compset ne fournit plus de grille de 21 zones/catégories attribuée sans publication précise à STR, Horwath ou à un observatoire Tevaxia. Le modèle part de données saisies et référencées sur une période commune (1 à 366 jours), avec justification de l'échantillon. Il exige des chambres-nuitées disponibles/vendues cohérentes avec la capacité physique et des recettes de chambres en euros sur une même base hors TVA. Les personnes-nuitées et les recettes de restauration ne doivent pas y être substituées.

Les ratios agrégés utilisent les sommes des volumes : ADR = recettes/vendues ; occupation = vendues/disponibles ; RevPAR = recettes/disponibles. Un hôtel étudié optionnel est exclu de l'échantillon concurrent. ARI, MPI et RGI utilisent son indicateur divisé par l'indicateur agrégé × 100. Les dénominateurs nuls donnent un résultat indisponible ; une occupation nulle avec une capacité disponible réelle demeure zéro. Aucun chiffre ne prétend représenter tout le Luxembourg ou une statistique sous licence STR.

Validation : 1 226 tests sur 109 fichiers, lint et compilation finale réussis, cinq langues et quatre largeurs, CSV/JSON complets et import invalide sans perte de saisie. Cas de référence : concurrents A (100 disponibles, 50 vendues, 5 000 EUR) et B (300 disponibles, 240 vendues, 36 000 EUR) : ADR 141,379310... EUR, occupation 72,5 %, RevPAR 102,50 EUR. La moyenne simple des ADR aurait donné 125 EUR, ce qui ne représente pas l'ADR de ce groupe. L'hôtel étudié (100 disponibles, 70 vendues, 9 800 EUR) reste exclu et ses indices satisfont RGI = ARI × MPI / 100. Les doublons d'identifiant, plusieurs hôtels étudiés, période invalide, ventes excessives et recettes sans vente sont rejetés.

Référence des définitions : https://www.costar.com/products/str-benchmark/resources/glossary . Ancien compset-lu.ts désormais sans consommateur public ; ses chiffres présumés ne sont pas repris dans le nouveau modèle.

## Observatoire hôtelier : remplacement par trois séries Eurostat vérifiées

/hotellerie/observatoire-lu utilise désormais les séries mensuelles Eurostat tour_occ_nim (nuitées), tour_occ_arm (arrivées) et tour_occ_mnor (occupation nette des chambres). Périmètre : Luxembourg, hôtels et hébergements similaires NACE I55.1, résidents et non-résidents réunis ; occupation avec accomunit=BEDRM, distinct des lits. Trois réponses JSON originales, paramètres de requête et empreintes SHA-256 sont conservés. Données mises à jour le 31 août 2026 et extraites le 9 septembre.

Les 43 mois de janvier 2023 à juillet 2026 comprennent 42 observations publiées et juillet 2026 sans valeur dans chaque série. Aucune valeur absente n'est remplacée par zéro. Janvier 2023 : 106 284 nuitées de personnes, 57 791 arrivées et 33,04 % d'occupation nette des chambres. Total des douze mois de 2025 : 2 019 907 nuitées. Juin 2026 : 172 461 nuitées, 100 244 arrivées, 40,92 % d'occupation. Le cumul 2026 couvre six mois et se compare aux mêmes six mois de 2025, jamais à l'année entière.

La page distingue nuitées de personnes et chambres-nuitées, arrivées et visiteurs uniques. Aucun ADR, RevPAR, détail par étoiles/origines ou taux annuel obtenu par moyenne simple des mois n'est reconstitué. Les anciennes séries présumées et grilles tarifaires ne sont plus affichées. Les descriptions de liens vers les modules hôteliers repris sont alignées avec leur contenu effectif.

Validation : 1 230 tests sur 110 fichiers, lint et compilation finale réussis ; chaque observation comparée aux réponses originales et chaque empreinte contrôlée. Navigateur : cinq langues, quatre largeurs, année pleine/partielle, mois absent, variation non disponible sans période antérieure et CSV contrôlés. Sources exactes dans docs/sources/eurostat-tourism-*-2026-09-09.json et src/lib/data/tourism-eurostat.json ; méthodologie https://ec.europa.eu/eurostat/cache/metadata/en/tour_occ_esms.htm . Ancien statec-tourism.ts sans consommateur public après remplacement de cette page ; ses tests historiques ne valident pas la provenance de ses données.

## Transactions hôtelières : sélection de communiqués vérifiés

La page /hotellerie/transactions remplace la grille de prix et rendements non corroborés par deux opérations documentées en Belgique et Allemagne. Elle ne prétend pas être un échantillon représentatif du Luxembourg ou de la Grande Région. Les dates d'accord et de réalisation sont distinctes ; aucun montant total de marché ni taux de capitalisation n'est calculé.

- Crowne Plaza Antwerp : Pandox annonce la réalisation le 2 février 2026, après accord annoncé le 2 décembre 2025 ; environ 19 M EUR pour l'immeuble hôtelier ET l'exploitation, 262 chambres. Source : https://www.pandox.se/media/press-releases/2026/pandox-has-completed-the-previously-announced-divestment-of-crowne-plaza-antwerp/ .
- Pullman Cologne : accord annoncé le 6 mars 2025, réalisation le 1er avril 2025 ; environ 66 M EUR DROITS DE MUTATION INCLUS, immeuble loué à AccorInvest, 275 chambres. Sources : https://www.pandox.se/media/press-releases/2025/pandox-acquires-a-hotel-property-in-cologne-germany/ et https://www.pandox.se/media/press-releases/2025/pandox-has-completed-previously-announced-acquisition-of-hotel-pullman-cologne/ .

Le montant par chambre divise le montant approximatif publié par les chambres de l'opération ; son périmètre (droits, exploitation) est conservé et il ne devient pas un comparable ajusté ou un prix immobilier hors droits. Le filtre Luxembourg indique qu'aucune opération corroborée n'est retenue dans cette sélection, sans affirmer une absence de transactions dans le pays.

Validation : compilation et lint réussis, cinq langues/quatre largeurs, filtres pays/absence de données, montant de 66 M EUR / 275 = environ 240 000 EUR par chambre, dates et CSV avec périmètres et liens vérifiés. La suite générale de référence comporte 1 230 tests ; ce lot de données publiées a fait l'objet de contrôles ciblés de rendu et d'export. L'ancien hotel-transactions.ts n'est plus appelé par la page ; ses anciennes lignes ne sont pas présentées comme validées.


### Consolidation du comparatif RevPAR — 9 septembre 2026

Les cinq anciennes routes `/hotellerie/revpar-comparison` redirigent définitivement vers le comparatif documenté de leur langue. Le menu, les liens contextuels, le plan du site et le sitemap pointent directement vers ce comparatif ; la carte doublonnée du hub est retirée. Cela supprime de l’interface publique l’ancien diagnostic arbitraire et le manque à gagner calculé sur 365 jours sans période documentée. Le comparatif conservé exige des volumes et des références sur une période commune et exclut l’hôtel étudié de son groupe de comparaison.

Le lot transactions adbd224 est confirmé en production : CI 34373327389 réussie, déploiement dpl_5roUyQVJWM1iJJJzYwzKBHVmN6w3 Ready, vérifications des montants, périmètres, dates, filtres, CSV et quatre largeurs dans les cinq langues réussies.

Validation de la consolidation : compilation de production et lint réussis ; réponse HTTP 308, destination dans la même langue et formulaire du comparatif vérifiés dans les cinq langues en local. Les redirections sont déclarées dans next.config.ts pour précéder le rendu diffusé de la page.


### Benchmark des hôtels enregistrés — période commune et données absentes

Le tableau connecté exige une date de début et de fin explicites. Chaque hôtel est interrogé sur ces deux dates exactes ; aucune dernière période choisie par tri textuel ne se substitue à la période demandée. Les hôtels sans enregistrement restent affichés avec un statut explicite. Les doublons pour une même période, comme les erreurs de lecture, déclenchent une erreur plutôt qu’une sélection silencieuse.

Suppression du score arbitraire (35 % occupation + 30 % ADR normalisé + 35 % marge) et des moyennes simples présentées comme indicateurs du groupe. Le tableau est alphabétique et affiche les ratios enregistrés, sans les certifier ni les recalculer depuis des volumes absents. Le comparatif documenté reste accessible pour agréger des volumes réellement renseignés. Zéro reste zéro ; les valeurs absentes/non finies et l’occupation hors 0–100 % sont rendues indisponibles. Les marges négatives sont conservées.

Les chargements sont associés à l’utilisateur, l’organisation et les dates ; les réponses obsolètes sont ignorées. Déconnexion, changement de sélection et erreurs ne laissent pas apparaître l’ancien tableau comme résultat courant. Tous les liens internes conservent la langue. Les erreurs sont affichées avec une nouvelle tentative ; le tableau est défilable au clavier sur petit écran.

Validation ciblée : composant réel exécuté avec services simulés dans les cinq langues, périodes exactes contrôlées dans les requêtes, absence de requête avant saisie, zéro/absence/marge négative, changement rapide d’organisation, erreur/nouvelle tentative, déconnexion et lien de connexion localisé. Aucun compte client ni donnée réelle n’a été modifié. Lint réussi. Les parcours connectés réels et leurs droits serveur ne sont pas certifiés par cette simulation.

Compilation de production réussie. Contrôle public local aux largeurs 320/390/768/1440 dans les cinq langues : service de comptes non configuré localement, aucune ligne protégée affichée. Les liens de connexion et états connectés ont été contrôlés dans la simulation ; le contrôle public en production est effectué après déploiement. Le message de service indisponible est traduit sans exposer de noms de tables ou de migrations.


### Budget MICE — hypothèses explicites et capacité

L’ancien modèle appliquait deux personnes par chambre, des marges fixes 45/25/75 %, des recettes annuelles présumées et une saisonnalité non sourcée, jusque dans le prompt d’analyse. Il est remplacé par un budget de période de 1 à 366 jours : groupes attendus (fractionnaires autorisés), nuitées-chambres, unités de restauration et journées-salles par groupe, tarifs, coûts directs par groupe et coûts fixes documentés. Aucun résultat initial ni référence de marché inventée.

Les capacités disponibles pour cette activité sont saisies et contrôlées séparément pour les chambres et les salles. Les journées-salles représentent une salle pendant une journée ; les nuitées-chambres ne sont pas des nuitées-personnes. Les unités de restauration doivent être définies dans les hypothèses. Recettes = groupes × volume par groupe × tarif, arrondies au centime par ligne via entiers BigInt ; les coûts directs sont calculés par groupe, les coûts fixes une seule fois sur la période. Le solde est nommé contribution après coûts saisis, sans assimilation au GOP/EBITDA/bénéfice net. Les coûts fixes restent dus avec zéro groupe et la marge est indisponible si les recettes sont nulles.

Tous les champs, y compris zéro, et les références sont requis. Précision 4 décimales pour quantités, 2 pour euros ; montants non finis/négatifs et capacités dépassées bloqués. CSV avec période, hypothèses, unités et résultats ; texte de référence protégé contre les débuts de formules.

Validation : 1 236 tests dans 111 fichiers réussis, dont 6 cas métier MICE ; lint et build réussis. Cinq langues, quatre largeurs 320/390/768/1440, absence de résultat initial, champs manquants, dépassement de capacité, zéro groupe et export contrôlés. Cas indépendant : 2,5 groupes × 10 nuitées × 100 EUR = 2 500 EUR, restauration 1 000 EUR, salles 500 EUR, coûts directs 425 EUR, fixes 100 EUR, contribution 3 475 EUR. Les cinq CSV confirment l’addition des recettes et le solde.

Benchmark connecté 0b15bb7 confirmé en production : CI 34380637265 réussie, dpl_D4pJpK7Q2UZEkVuy8KyYGCe2hXje Ready et contrôle public dans les cinq langues/quatre largeurs avec lien de connexion localisé, sans lignes privées.


### Parcours motel / aparthotel — consolidation des calculs

La page utilisait un nombre de nuits arrondi avant multiplication, des recettes annexes automatiques (petit-déjeuner 8 %, autres 4 %), des ratios de charges par catégorie et une réserve FF&E retranchée pour nommer un EBITDA. Une division par un taux était ensuite appelée DCF. Ces calculs parallèles ont été supprimés de la page publique.

La route est conservée et propose un parcours vers les outils déjà corrigés : compte d’exploitation documenté, valorisation par revenu/comparables documentés, puis acquisition et financement. Elle explique la notion d’unité vendue à la nuit pour un appartement et les pièces nécessaires, distingue revenu immobilier et exploitation et précise que les données doivent être reportées dans chaque outil. Aucun faux chiffre ou taux de marché lié à la catégorie n’est injecté. Les liens et contenus sont traduits dans les cinq langues.

Budget MICE 49453db confirmé en production : CI34381335085 réussie, déploiement dpl_E5fUqk1VAfsf68R3GFyEECNDRj6n Ready, cinq langues/quatre largeurs, calculs, capacités, zéros et CSV contrôlés sur tevaxia.lu.

Validation du parcours motel/aparthotel : build et lint réussis ; cinq langues et quatre largeurs, trois destinations localisées, navigation réelle vers le compte d’exploitation et absence des anciens calculs vérifiées.


### CAPEX hôtelier — dépenses et réserve séparées

Le modèle précédent ajoutait les versements annuels à la réserve FF&E aux rénovations calculées en pourcentage du chiffre d’affaires : un transfert interne pouvait être compté comme une dépense supplémentaire. Il imposait aussi des cycles 5/10/20 ans et des ratios par catégorie sans références documentées.

Le nouveau plan requiert le solde initial réellement disponible, puis des années consécutives (1 à 30), des dépenses et fonds supplémentaires affectés explicites, avec références aux devis, échéanciers et financements. Le total CAPEX correspond aux seules dépenses. Solde annuel = solde précédent + fonds affectés − dépenses ; aucune injection complémentaire n’est simulée. Le besoin complémentaire est le maximum des déficits de clôture et non leur somme. Un versement ultérieur ne supprime pas le déficit d’une clôture antérieure.

La portée annuelle est affichée : aucune vérification des dates de paiement dans l’année, des intérêts ou de l’inflation n’est implicite. Le besoin réel intra-annuel peut dépasser le déficit de clôture. Montants au centime, calcul en entiers, zéro explicite, absence et valeurs invalides bloquées. CSV exporte les soldes et sources par année, sépare dépenses et financement et protège les références commençant par une formule.

Validation : build/lint réussis ; 1 242 tests dans 112 fichiers, dont 6 nouveaux cas CAPEX. Contrôle UI cinq langues/quatre largeurs et cinq CSV : ouverture 100 EUR, fonds 20 EUR et travaux 80 EUR en 2026, puis fonds 20 EUR et travaux 70 EUR en 2027 donnent 150 EUR de dépenses, 40 EUR de fonds supplémentaires, solde −10 EUR et besoin complémentaire 10 EUR. Années non consécutives/champs manquants bloqués ; zéros conservés.

Parcours motel/aparthotel 7c29974 confirmé en production : CI34381868504 réussie, déploiement dpl_F78T7y6JoPxRJ21se9bQueb9r2Nn Ready, cinq langues et quatre largeurs vérifiées avec navigation vers l’exploitation.


### Green Key — retrait de l’éligibilité fictive

L’ancien écran attribuait des points maison à 29 critères (dont des seuils non sourcés), concluait à l’éligibilité dès 40 points et demandait à l’IA d’estimer coûts, aides et gain de prix hôtelier. Ce mécanisme est supprimé.

La page devient un registre documentaire interne : établissement, version 2022–2026 ou 2026–2031, périmètre et confirmation de l’opérateur ; références de critères saisies depuis la version choisie ; type impératif/progressif/à vérifier ; statut non examiné, preuve référencée, à vérifier ou non-applicabilité à justifier. Tout statut autre que non examiné exige un justificatif. Aucun score, pourcentage de conformité, seuil d’éligibilité ni décision de certification. Les références saisies ne sont pas présentées comme une liste exhaustive ni comme une validation indépendante.

Sources primaires consultées le 9 septembre 2026 :
- https://www.greenkey.global/criteria/2022-2026
- https://www.greenkey.global/criteria-20262031
- https://www.greenkey.global/application-process
- https://www.greenkey.global/certification-process-2026-2031
- https://www.greenkey.global/join-green-key

La documentation officielle distingue critères impératifs et progressifs, prévoit une évaluation puis une décision. Deux référentiels sont publiés ; la procédure de transition est à confirmer avec le programme, sans sélection automatique fondée sur la date du navigateur. Le CSV conserve la version, la source, les déclarations et preuves, et indique qu’il ne constitue aucune décision de conformité ou de certification.

Validation : build/lint réussis ; 1 246 tests dans 113 fichiers, dont 4 nouveaux contrôles du dossier. Cinq langues, quatre largeurs, statuts initiaux inconnus, obligation de preuve, ajout de ligne et export vérifiés ; cinq CSV relus avec version et statuts exacts. Les intitulés du hub sont alignés sur la préparation documentaire.

CAPEX 5b234a7 confirmé en production : CI34382425442 réussie, dpl_HHdfFbVcXDyqnz4Y2UKDM45jXGG6 Ready ; cinq langues/quatre largeurs, calculs et exports vérifiés sur tevaxia.lu.


### Due diligence hôtelière — déclarations documentées et PDF

Les 50 points sont conservés comme aide de préparation non exhaustive, sans affiliation aux standards HVS/Cushman & Wakefield revendiquée. Les priorités sont indicatives. Dix-neuf libellés ont été réécrits comme documents et exigences à faire vérifier : notamment TVA par prestation/boisson, autorisations, contrôles techniques, contrats et cotisations, exigences énergétiques et RH. Retrait des raccourcis « hébergement 90j », « F&B 14 % », norme CE pour l’air, contrôleur systématiquement nommé, échéances énergétiques universelles et références sociales non établies.

Les statuts restent déclaratifs : preuve référencée, réserve ou hors périmètre déclaré. Un statut hors « à traiter » exige une note pour compter dans l’avancement et autoriser l’export. Le nom est requis ; les notes sont limitées à 1 000 caractères. Le pourcentage mesure les points renseignés avec justificatif, pas la conformité. L’analyse IA qui recommandait go/stop, décote ou conditions contractuelles est retirée.

PDF : mention de brouillon et limites, 50 points et leurs statuts conservés, justificatifs sur toute la largeur, titre de rubrique solidaire du premier point, pagination des autres points, pied de page sur chaque feuille. Le verrou d’export évite les doubles clics ; un échec est signalé et le bouton est réactivé. La langue des libellés est dérivée à l’affichage, sans figer les traductions dans l’état du formulaire. Liens localisés, boutons plus lisibles et retours à la ligne sur mobile.

Sources primaires utilisées pour orienter les vérifications, sans certification juridique du dossier : https://pfi.public.lu/fr/citoyen/tva/taux-tva.html ; https://pfi.public.lu/fr/publications/textes-de-loi/tva010126.html ; https://guichet.public.lu/fr/entreprises/creation-developpement/autorisation-etablissement/commerce/etablissement-hebergement.html .

Validation : build/lint réussis ; cinq langues et quatre largeurs. 0/50 initialement, statut sans note non compté et export bloqué, trois points justifiés donnent 3/50 ; double clic produit un seul téléchargement. Cinq PDF finaux de trois pages : 50 libellés intégralement retrouvés, note longue complète, réserves et mentions de brouillon sur chaque page, limites de page contrôlées. Les 15 pages ont été rendues en PNG et inspectées après correction des notes étroites et titres orphelins du premier rendu. La suite générale de référence reste à 1 246 tests dans 113 fichiers, complétée ici par ces contrôles de formulaire et PDF.

Green Key 80f0167 confirmé en production : CI34383215142 réussie, dpl_D142ZVm9MdDKAyynkg3X1HCWq682 Ready, cinq langues/quatre largeurs et cinq CSV contrôlés sur tevaxia.lu.


## Périodes des hôtels enregistrés et rapport propriétaire — 9 septembre 2026

- Suppression de l’occupation/ADR préremplis et de la réserve automatique de 4 %. GOP et EBITDA sont désormais des montants déclarés, distincts de la réserve FF&E. Les trois catégories de charges ne suffisent pas à reconstruire ces agrégats comptables.
- Zéro explicite conservé ; champ vide inconnu. Total des revenus seulement si les quatre rubriques sont renseignées, addition en centimes. Marges seulement sur revenu total strictement positif ; pertes conservées. RevPAR = ADR × occupation sur le périmètre déclaré.
- Dates réelles sur 1 à 366 jours ; montants finis bornés et précision contrôlée ; sources/périmètre obligatoires. Validation répétée dans savePeriod, utilisateur authentifié requis, mise à jour filtrée par identifiant de fiche ET hôtel. Aucun changement des politiques RLS ni attestation de leur audit.
- Historique conservé sans réécriture automatique. À l’édition, GOP, EBITDA et réserve doivent être ressaisis depuis les justificatifs ; mention visible des anciennes valeurs potentiellement automatiques.
- Chargement anonyme remplacé par connexion localisée ; état isolé par utilisateur/hôtel et réponses tardives ignorées ; erreurs/réessai, verrou anti-double enregistrement et PDF, contrôles de formulaire associés à leurs libellés.
- PDF dans cinq langues : toutes les rubriques affichées, inconnus explicites, centimes et pertes conservés, dates toujours présentes, sources intégrales, suppression des comparaisons de périodes arbitraires et des mentions de certification USALI/STR. Pied de page sur chaque page ; titre ajusté après contrôle visuel.
- Vérification : 1 256 tests / 115 fichiers, dont 10 nouveaux tests métier/persistance. Parcours du composant réel avec services simulés dans cinq langues : zéro/inconnu, pertes, dates, doublon, changement utilisateur/hôtel et édition. Cinq PDF de deux pages rendus et inspectés (sources longues, libellés, bornes, pied de page). Formulaire avec CSS réel vérifié à 320/390/768/1440 px. Aucune écriture de test dans les comptes de production.


## Tableau de groupe hôtelier — 9 septembre 2026

- Le « CAPEX cumulé » était la somme des prix d’acquisition : renommé explicitement prix d’acquisition cumulés (EUR), sans confusion avec travaux ou valeur actuelle. Un prix manquant/invalide empêche le total complet ; un prix nul confirmé reste zéro. Les anciennes chambres à zéro sont inconnues, pas une capacité nulle supposée.
- Accès direct aux fiches/périodes ajouté. Les liens de simulateurs n’affirment plus importer/rattacher automatiquement les données ; paramètres hôtel ignorés supprimés. Segments déclarés sans correspondance inventée aux étoiles.
- Chargements, erreurs et réessais séparés ; état isolé par utilisateur et groupe, réponses tardives écartées ; aucune fausse liste vide pendant le chargement. Création validée (nom, chambres entières de 1 à 100 000, segment), auteur authentifié, verrou double clic ; suppression conserve sa confirmation dans le produit.
- Vérification : 1 260 tests / 116 fichiers, ESLint ciblé, build production. Composant réel avec services simulés : cinq langues, montants inconnus/zéro, changements de groupe, création/doublon, suppression confirmée/annulée, erreurs/réessai et déconnexion. Parcours public et formulaire avec CSS réel sur quatre largeurs. Aucune mutation QA dans les comptes de production.

La livraison précédente des périodes et PDF (3c1cc7c) est confirmée : CI 34386805577 réussie ; Vercel dpl_FfHVzmz5RDdgo1RXW3sPqem5prBi Ready sur tevaxia.lu ; parcours public vérifié dans les cinq langues.


## Impayés hôteliers — calcul documenté des intérêts

- Suppression du taux présumé de 12,5 %, des probabilités de recouvrement 95/80/55/30 %, du calendrier arbitraire présenté comme légal et des frais automatiques par palier.
- Une facture à principal constant ; distinction entreprise/consommateur/pouvoir public ; principal taxes comprises, frais explicitement documentés saisis une fois. Aucune validation d’exigibilité ou de recouvrabilité, aucun envoi. Les paiements partiels/principaux variables restent hors périmètre.
- Segments réels consécutifs, premier/dernier jour inclus, sans trou/chevauchement et chacun dans un semestre ; taux saisi et sourcé pour chaque segment. Base ACT/365 selon la formule Guichet, calcul entier en centimes et taux à quatre décimales, arrondi au centime par segment. Aucun taux 2026 appliqué par défaut.
- Sources officielles consultées le 9 septembre 2026 : https://guichet.public.lu/fr/entreprises/gestion-juridique-comptabilite/facturation/encaissement/interets-retard.html et https://mj.gouvernement.lu/fr/service-citoyens/taux-interet-legal.html . Les conditions commerciales et consommateurs diffèrent ; le forfait commercial ne s’applique pas universellement.
- Vérification : 1 266 tests / 117 fichiers ; exemple officiel 2 000 EUR, 12,5 %, 19 jours = 13,01 EUR ; année bissextile, deux taux, frais uniques, zéros, dates/trous/chevauchements et injection CSV. Build et lint ciblé réussis. Navigateur cinq langues/quatre largeurs : exemple, export, zéro/inconnu, changement de semestre et deux taux.

Le groupe hôtelier (403e8cc) est confirmé en production : CI 34387445135 réussie, Vercel dpl_9nod77ZZ5o1dxiaGp9KPivAWA7v1 Ready, parcours public cinq langues vérifié.


## Housekeeping — plan quotidien documenté

- Suppression des chambres/occupations/coûts préremplis, courbe hebdomadaire inventée, superviseur minimum imposé, majoration automatique de 25 % et analyse IA avec benchmarks non sourcés.
- Saisie des chambres de départ et recouches à nettoyer, minutes observées et parties communes, heures payées et minutes productives par agent, coûts employeur séparés et nombre/heures de supervision explicites. Pas d’import PMS automatique.
- Besoin agents = plafond(charge/minutes productives), facturation de la totalité des heures payées ; superviseurs ajoutés sans contribution supposée au nettoyage. Zéro travail = zéro agent, aucun superviseur imposé. Ratios sans chambres inconnus. Contrôles de dates, précision, capacité, temps et sources. Pas de validation réglementaire du planning.
- Vérification : 1 272 tests / 118 fichiers, lint ciblé et build réussis. Cas de 400 minutes = 1 agent à 160 EUR + supervision 60 EUR = 220 EUR ; 400,01 minutes nécessitent 2 vacations. Absence de travail, tâches des parties communes sans chambres, capacités impossibles et arrondis employeur couverts. Parcours et CSV cinq langues/quatre largeurs vérifiés.

Le calcul des impayés (f5ccd3b) est confirmé en production : CI 34388203562 réussie, Vercel dpl_EkYoUyUFVerMN5rXPLbDELfCHnrc Ready, cinq parcours complets sur tevaxia.lu.


## Alertes hôtelières — configuration honnête et écritures contrôlées

- Le dépôt contient le stockage hotel_yield_alerts mais aucun évaluateur de ces règles ni preuve du cron 07:00/SMTP annoncés. Le cron applicatif quotidien et la fonction check-alerts concernent d’autres fonctions. Retrait des promesses IA « agit », surveillance quotidienne et emails assurés. L’écran décrit explicitement son périmètre de configuration ; aucun moteur de surveillance n’a été créé ou certifié.
- Règles historiques conservées, statuts/préférences indiqués comme paramètres enregistrés et non preuves de traitement. Nouvelles règles désactivées et email/push faux par défaut. Liens vers comparaisons documentées pour contrôle manuel.
- Édition avec bouton Enregistrer, aucune requête par frappe, seuils/fenêtres validés (occupation 0–100 %, GOP négatif possible), gestion des types historiques inconnus. Erreurs de lecture et d’écriture visibles ; changements utilisateur/hôtel isolés, anti-double-clic, brouillon conservé en cas d’erreur.
- Services : vérification de l’identité actuelle avant action ; lecture de l’hôtel accessible avant enregistrement ; mise à jour/suppression filtrées par règle, utilisateur et hôtel. Aucune politique RLS de production modifiée ni certification de son état effectif. Les notifications existantes ne sont pas activées/modifiées silencieusement lors de l’édition.
- Vérification : 1 278 tests / 119 fichiers, lint et build réussis. Tests service pour identité changée, accès hôtel refusé, portée des mutations, erreurs et notifications non activées ; composant simulé cinq langues pour frappes sans écriture, validation, doublon, brouillon après erreur, changement hôtel/compte, suppression et déconnexion ; parcours public/formulaire quatre largeurs. Aucune écriture ou notification QA en production.

Housekeeping (ee4eac0) confirmé en ligne : CI 34388944339 réussie, Vercel dpl_752FT4TzJyuKCbzEeXUiiBPRG6rC Ready, cinq parcours métier complets vérifiés sur tevaxia.lu.


## Offre hôtelière et guide d’investissement — cohérence des contenus

- Accueil, tarifs, parcours hôtelier et solution hôtel alignés sur les outils documentés : retrait des scores de visa, rendements garantis, consolidation PMS supposée, configuration en cinq minutes, TVA F&B uniforme et promesses de certification/notification non établies.
- Guide investir-hotel-luxembourg entièrement repris dans les cinq langues : statistiques et multiples non sourcés retirés ; périmètres des indicateurs, des transactions et du financement explicités ; exemple fictif exact (3 650 chambres-nuitées, 1 825 vendues, ADR 100 EUR HT, revenu 182 500 EUR HT, RevPAR 50 EUR).
- Correction E-2 : Luxembourg pays du traité, investissement dans une entreprise aux États-Unis ; absence de lien automatique avec l’achat d’un hôtel au Luxembourg. Sources Department of State, Guichet autorisation/statut hôtelier/aide environnementale et Eurostat reliées directement. Aucune subvention présumée.
- Réexport des métadonnées dans les quatre routes traduites ; date de mise à jour du guide fixée au 9 septembre. Titres longs du composant partagé autorisés à revenir à la ligne à 320 px, sans réduction de police.
- Vérification : lint ciblé et build réussis ; 25 pages publiques (5 pages × 5 langues), contenu, liens, métadonnées/FAQ structurée du guide et quatre largeurs vérifiés. Le reste des pages PMS, du hub hôtel et des offres métiers reste en cours de revue.

Alertes (7540004) confirmées en production : CI 34389785747 réussie, Vercel dpl_CYQdCLfsCQ8CQZRhwXnPGoHq6aZa Ready, cinq parcours publics vérifiés.


## PMS — journal mensuel et inventaire observé

- Le rapport nommé USALI mélangeait revenus estimés d’audits nocturnes et écritures de folios, ajoutait la taxe de séjour au revenu, extrapolait l’inventaire maximum à tous les jours du mois et fabriquait le chiffre d’affaires de comparaison N-1. Il devient un journal des écritures enregistrées, sans certification USALI/comptable/fiscale, ni ADR/RevPAR/TRevPAR ou YoY calculés sur des bases différentes.
- Période de posting UTC semi-ouverte, incluant les fractions de dernière seconde ; annulations exclues. Toutes les catégories conservées, taxe isolée, montants signés additionnés en centimes BigInt. Les taux et écritures historiques ne sont pas recalculés ; le journal ne prouve ni paiement, ni émission de facture, ni rattachement comptable au séjour.
- Lecture paginée par 500 jusqu’à 200 000 lignes maximum ; dépassement, troncature, compte changeant, doublons, erreurs de requête et données incohérentes refusés au lieu de publier un total partiel. Identité vérifiée avant et après lecture, propriété filtrée par propriétaire. Lecture de données vivantes, sans verrouillage transactionnel ; aucune politique RLS/SQL de production modifiée ou certifiée.
- Inventaire = somme des relevés quotidiens disponibles, taux sur ce même échantillon, couverture et statut clôturé explicités ; aucune extrapolation aux jours manquants. Aucun ratio sans dénominateur positif. Les revenus estimés et compteurs historiques de la fonction SQL night audit restent à revoir séparément.
- Page, parent et menu : changement de mois/compte/propriété isolé, réponses tardives ignorées, erreurs et nouvelle tentative, déconnexion visible sans chargement infini. Liens PMS conservent la langue. PDF avec verrou anti-double-clic, erreur récupérable et téléchargement abandonné après démontage.
- Export cinq langues, synthèse, 19 catégories sans troncature et détail des relevés ; montants au centime et mêmes limites explicites. 15 pages PDF rendues et inspectées, pieds de page contrôlés.
- Correctif de génération des namespaces : inclusion des layouts ancêtres et de leurs imports clients, avec test Python de non-régression (sans récupération des namespaces des frères).
- Vérification : 1 286 tests / 120 fichiers, 1 test Python, lint ciblé et build réussis ; composants réels page/parent/menu/PDF avec services simulés dans les cinq langues, quatre largeurs ; échantillon 30 chambres-nuitées/15 occupées = 50 %, 19 lignes dont 246,39 EUR hors taxe de séjour + 6 EUR = 252,39 EUR au total ; pagination 1 001 lignes et erreurs couvertes. Aucune écriture client effectuée pour les tests.

Offre publique hôtel et guide (7c4eacb) confirmés en production : CI 34392746536, Vercel dpl_DoxNMXaWvj2PE1foPZSLvuS2UhwU Ready, 25 pages publiques revérifiées cinq langues/quatre largeurs.


## PMS — saisie documentée des prestations et fiabilité des folios

- Prix HT et TVA désormais saisis explicitement avec référence obligatoire, quantité visible, aperçu HT/TVA/TTC ; retrait des prix inventés et des taux imposés par catégorie. Un taux nul doit être justifié. Source : loi TVA 2026, annexe B (restauration distincte des boissons alcooliques).
- Arrondis exacts en centimes : HT arrondi avant calcul de TVA, limites et précision conformes aux colonnes SQL. Exemple : 1,15 × 8,01 = 9,21 HT ; 17 % = 1,57 ; TTC 10,78. Ventilations additionnées en centimes, salle de réunion classée hors F&B.
- Identité et propriété du folio ouvert contrôlées avant écriture ; verrou de formulaire et UUID stable pour reprise idempotente après erreur réseau. Une erreur conserve les saisies. Référence visible dans les lignes enregistrées.
- Consulter un folio ou le POS ne crée plus de folio ni de prestations automatiquement. L’ouverture explicite ne réouvre pas un folio soldé. Lecture des lignes paginée, erreurs/troncatures refusées ; changement de compte ou réservation isolé.
- Vérification : 1 295 tests / 121 fichiers (12 nouveaux tests, retrait de 3 tests qui consacraient les anciens taux incorrects), lint et build réussis. Dix parcours de composants réels avec services simulés, cinq langues, quatre largeurs ; références visibles, double clic, reprise réseau, changement d’identité et absence d’écriture à la consultation contrôlés. Débordement mobile du tableau des catégories corrigé. Aucune écriture de client réel pour la QA.
- Limites restant à traiter : règlement/auto-posting SQL, génération des factures, exhaustivité du sélecteur de réservations POS. Ces contrôles clients ne certifient pas les RPC/RLS de production. Accès CLI Supabase indisponible (authentification absente), aucune migration SQL appliquée.

Journal mensuel (db5191b) confirmé en production : CI 34394676709 réussie, Vercel dpl_9cdMsEtNPhTstKTNup4qE2dVdZy2 Ready, cinq parcours publics revérifiés.


## PMS — relevé PDF distinct d’une facture émise

- L’ancien bouton Factur-X du folio créait un numéro HOT dérivé de la réservation, une date du jour et une échéance de sortie, sans rattachement à une facture émise. Il inférait le régime Z à partir du seul taux nul et ajoutait une mention de TVA restauration incorrecte. Ce builder sans autre consommateur est retiré.
- Le téléchargement fournit désormais un relevé de prestations clairement identifié : aucun numéro de facture, échéance, XML ou revendication PDF/A/Factur-X. La fonction de consultation des factures émises reste distincte et doit encore être auditée. Sources consultées : PFI mentions obligatoires des factures et FNFE-MPE documentation Factur-X.
- Copie des montants enregistrés, somme exacte en centimes et rapprochement avec les totaux du folio. Doublons, lignes d’un autre folio, dates invalides, devise différente, données incohérentes et total partiel refusés. Aucun recalcul des taux historiques ; taxe et solde enregistré explicités sans preuve de paiement ni qualification automatique d’un taux nul.
- Document traduit dans les cinq langues avec toutes les lignes actives et leurs références, pagination automatique sans troncature ; cinq PDF de trois pages rendus et inspectés, sept références longues conservées dans chacun. Verrou anti-double-clic, erreur récupérable et abandon du téléchargement après changement de compte.
- Vérification : 1 300 tests / 122 fichiers, cinq tests de rapprochement nouveaux, lint ciblé réussi ; cinq parcours du composant réel avec services simulés et exports vérifiés. Revue complète du circuit d’émission et des RPC SQL encore nécessaire ; aucune migration appliquée et aucune donnée client modifiée pour la QA.

Saisie des prestations (af8a4b9) confirmée en production : CI 34397940733 success, Vercel dpl_CpVJdEXjGdcGBergPbJCwoegk3hN Ready ; dix parcours publics cinq langues/quatre largeurs revérifiés.


## Hub hôtellerie — explications et métadonnées

- Descriptions et six FAQ, y compris données structurées, alignées sur les outils actuels dans les cinq langues : capitalisation documentée sans taux/prix de chambre inventés ; GOP/EBITDA/réserve distingués ; retrait des taux F&B uniformes, taxes locales présumées, alertes envoyées, rétention RGPD automatisée et immutabilité fiscale non démontrées.
- iCal présenté avec ses limites de synchronisation ; préparation E-2, aides et qualification bancaire sans seuil automatique. Une empreinte SHA-256 n’est plus présentée comme signature ou expertise. Sources officielles TVA et E-2 accessibles.
- Métadonnées traduites réexportées dans les quatre routes locales ; lien groupe traduit ; contrôles des cinq pages, six FAQ structurées et quatre largeurs réussis, lint et build réussis.
- Vérification du code consommateur : les anciens textes solutions.hotel, fraisAcquisition.seo et energy.lenoz.seo ne sont plus rendus par leurs pages réécrites ; ils ne constituent pas des anomalies visibles de ces routes. Les autres guides et offres actives restent à vérifier.

Relevés PDF (8c9e0a2) confirmés en production : CI 34398958161 success, Vercel dpl_BpuYmFD5jDFWeELJqKG3n6xTFzuD Ready ; dix parcours publics cinq langues/quatre largeurs revérifiés.


## Guide frais de notaire — droits, émoluments et exemples séparés

- Guide actif entièrement repris dans les cinq langues : correction du double comptage 7 % + 1 % dans les métadonnées, retrait de l’ancien faux barème 2015 et des enveloppes non sourcées (honoraires, hypothèque, débours). Tableau de neuf tranches du barème 7 tiré des constantes déjà vérifiées du calculateur, avec limites cumulées et taux HT ; minimum, TVA et exclusions expliqués.
- Exemples limités explicitement aux droits ordinaires, deux acquéreurs éligibles à 50/50 avec soldes personnels complets. Minimum de 100 EUR conservé : 750 000 × 7 % = 52 500 ; crédit utilisé 52 400 ; droits résiduels 100, sans prétendre que c’est le décompte total. Cinq prix de 300 000 à 1 500 000 EUR vérifiés.
- VEFA : terrain/travaux existants/travaux futurs à distinguer, aucune TVA réduite automatique ; avantage de 50 000 EUR et habitation du propriétaire. Prêt : obligation, inscription sur garantie et émoluments distincts, aucune économie forfaitaire de mandat hypothécaire.
- Fiscalité locative corrigée : acquisition et financement ne suivent pas le même traitement, terrain exclu de l’amortissement ; aucune extrapolation globale à l’habitation personnelle. Sources PFI, Chambre des Notaires, ministère du Logement et ACD consultées et reliées. Plafond 40 000 confirmé sur PFI/Guichet ; hausse annoncée à 45 000 non assimilée à une entrée en vigueur vérifiée.
- Métadonnées réexportées dans quatre routes locales, date du guide 9 septembre 2026. Build/lint réussis ; cinq langues, deux tableaux (neuf et cinq lignes), six FAQ structurées, sources et quatre largeurs vérifiés.

Hub hôtellerie (0abe245) confirmé en production : CI 34399433885 success, Vercel dpl_4vWFWvR8ZCw68EpCf6GwgZAsPxyU Ready ; cinq pages revérifiées en quatre largeurs.


## Guide Bëllegen Akt — solde personnel, délais et restitution

- Les cinq versions distinguent le délai d’entrée dans le logement (deux ans, quatre pour terrain/immeuble en construction) et la durée de deux ans d’occupation continue. Dérogations/prorogations relevant de l’AED, engagements de l’acquéreur et justificatifs explicites ; suppression de l’application automatique sans démarche ni condition.
- Solde propre à chaque acquéreur, quote-part et absence de transfert de crédit entre personnes ; traitement résident EEE / hors EEE expliqué, avec avance puis restitution dans ce dernier cas. Remboursement d’un avantage indu reconstitue le crédit à hauteur du principal restitué, pas des intérêts ; revente après occupation requise ne restaure pas le crédit consommé.
- Cinq exemples pour un ou deux acquéreurs, minimum de 100 EUR préservé : deux soldes complets à 750 000 EUR => crédit 52 400, droits 100, solde cumulé 27 600. Aucun cumul d’aides garanti. Sources PFI conditions/délais et Guichet vérifiées.
- Métadonnées réexportées quatre langues et date mise à jour. Correction complémentaire du sommaire du guide notarial : clé FAQ inexistante remplacée par la traduction commune ; contrôle explicite de l’absence de clés brutes dans la page.
- Validation : build/lint réussis, dix pages des deux guides en cinq langues/quatre largeurs, tableaux et données structurées contrôlés. Le guide notarial 1b8bea5 avait CI 34400411294 réussie ; la vérification finale en production inclura ce correctif du sommaire.


## Guide TVA logement — plafond exact et procédures distinctes

- Les cinq langues corrigent les tableaux incohérents : à 400 000 EUR HT, TVA normale 68 000, faveur plafonnée 50 000, TVA due 18 000, TTC 418 000 ; à 500 000 HT, TVA due 35 000 et TTC 535 000. Exemples sans terrain ni postes exclus, tout éligible et plafond intégral disponible explicitement supposés. Aucun total d’économies cumulées inventé.
- Brochure AED 2025 et ministère du Logement vérifiés : création réservée à l’habitation principale du propriétaire ; rénovation possible pour celle d’un tiers ; rénovation dans les cinq ans de l’acquisition ou logement d’au moins dix ans, suppression de l’ancien seuil de vingt ans. Retrait du plafond de 400 m², règle d’usage mixte expliquée ; frais professionnels/meubles non confondus avec travaux éligibles.
- Application directe avec fournisseur avant travaux distinguée du remboursement après travaux. Devis minimal 3 000 EUR HT, factures de remboursement 1 250 EUR HT et ensemble 3 000 EUR HT, intervalle et prescription documentés ; usage/occupation et régularisation mentionnés. Avantage antérieurement consommé à vérifier, aucun nouveau plafond présumé par changement de propriétaire.
- Guide, six FAQ structurées, cinq exemples, métadonnées et date actualisés. Build/lint et cinq pages/quatre largeurs réussis. Aucun moteur fiscal ou PDF modifié dans ce lot.

Guides Bëllegen Akt/notaire (90e8308) confirmés en production : CI 34401078513 success, Vercel dpl_G6YiD4erXhSzvLfMAP3FF9MVGrYL Ready ; dix pages revérifiées, y compris traduction du sommaire.

Contrôle d’accès Supabase complémentaire : la session navigateur authentifiée ne donne pas accès au projet de la configuration Tevaxia et redirige vers une autre organisation. Aucun compte, permission, secret ou donnée modifié. L’absence d’accès empêche toujours de certifier/appliquer les changements SQL en production ; la revue des autres surfaces continue.


## Factures PMS — lecture complète et totaux par devise

- Suppression du plafond silencieux de 500 factures, y compris dans le fournisseur de sauvegarde qui réutilise cette lecture. Pagination par 500, nombre exact, ordre stable date/identifiant ; refus des résultats tronqués, doublons, changement du nombre de lignes ou périmètre incorrect. Plafond de sécurité de 200 000 provoquant une erreur explicite, jamais un total partiel.
- Identité contrôlée avant/après lecture et propriété filtrée par propriétaire. Cela complète les contrôles applicatifs sans certifier les RLS ni les RPC en production.
- Écran réinitialisé par utilisateur/établissement ; réponses tardives ignorées, déconnexion affichée immédiatement avec lien localisé ; erreur et bouton Réessayer distincts de la liste vide. Tableau contenu horizontalement sur mobile.
- Totaux en centimes signés, séparés par devise ; contrôle HT + TVA + taxe de séjour = TTC ; montants absents/incohérents refusés. Les libellés décrivent les factures émises et celles marquées manuellement payées, sans les assimiler à un rapprochement des encaissements. Retrait de l’affirmation globale de conformité/immutabilité non vérifiée sur cet écran.
- Huit tests supplémentaires : plus de 1 000 lignes, erreurs/vide, troncature, doublons/périmètre/changements, identité, devises/avoirs et montants invalides. Suite : 1 308 tests / 123 fichiers réussis. Émission, marquage payé, PDF et SQL restent à revoir séparément.

TVA logement (81ae7a2) confirmée en production : CI 34401827599 success ; Vercel dpl_Eq5QY8nP4S1VwHePzA7xemHMo865 Ready et domaine tevaxia.lu associé ; cinq pages/quatre largeurs réussies. Le projet Supabase public présent dans les scripts de production est bien dpynqvilgniohgtichbz, identique à la configuration locale et inaccessible avec la session disponible.


### Correction du périmètre des contrôles de routes PMS

Le contrôle renforcé des factures a révélé l’absence des alias des pages internes PMS en EN/DE/PT/LB (HTTP 404). Certains anciens tests anonymes reconnaissaient le lien de connexion de l’en-tête général sur la page 404 : leurs résultats ne prouvaient donc pas l’accessibilité des routes traduites. Les validations hors ligne des composants et des calculs restent distinctes et valides. Ajout de 92 alias pages/layouts vers les composants canoniques, avec reprise du noindex et du layout de propriété. Le test factures exige maintenant HTTP 200 et le titre exact du contenu ; un inventaire HTTP distinct contrôle les 21 pages dynamiques dans les cinq langues. Cette correction ne vaut pas certification des opérations connectées ni des autres pages du site.

Validation finale locale du lot factures/routes : build et lint réussis ; cinq écrans factures avec titre/statut HTTP vérifiés, quatre largeurs, erreur/retry/déconnexion/changement de compte testés sur composants réels avec services simulés ; 105 URL PMS vérifiées HTTP 200 sans contenu 404. Aucun test d’écriture en production.


## Relevé PDF des documents PMS — types, montants signés et périmètre explicite

- L’ancien export affichait systématiquement FACTURE, masquait les catégories négatives et annonçait une conformité fiscale non démontrée. Il utilisait les coordonnées actuelles de la propriété, sans original archivé ni détail des prestations par taux. Le bouton produit désormais un relevé des données enregistrées, distinct d’une émission, quittance ou validation fiscale.
- Le type standard/acompte/avoir/pro forma et le statut brouillon/émis/payé manuel sont reproduits. Contrôle de propriété, référence, client, dates calendaires, montants par catégorie et totaux au centime avant génération ; refus des incohérences. Les sommes signées sont conservées, aucune TVA ni qualification de taxe de séjour n’est reconstruite à partir de taux agrégés.
- Coordonnées actuelles clairement identifiées ; notes et mentions intégrales dans le flux paginé. Aucun faux numéro, taux, date d’émission ou classement fiscal ajouté. Les coordonnées et le contenu ne sont pas certifiés comme photographie historique à l’émission.
- Chargement PDF à la demande, verrou contre le double clic, erreur localisée, nouvelle tentative possible, export abandonné après changement de compte/rechargement ; URL de téléchargement libérée.
- Cinq PDF de deux pages (dix pages rendues/inspectées) : avoir de -147,32 EUR, trois catégories signées, notes et mentions longues préservées. Cinq tests métier supplémentaires ; suite 1 313 tests / 124 fichiers réussie. Tests de génération réelle du PDF avec services simulés : cinq langues, erreur, retry, double clic, déconnexion.
- Source de la limite de conformité : [AED — contenu obligatoire des factures](https://pfi.public.lu/fr/professionnel/tva/en-cours-activite-economique/que-doivent-contenir-factures.html), notamment date, identification, nature/quantité des prestations et ventilation par taux. L’émission SQL, l’immutabilité et les originaux archivés restent hors certification tant que la base n’est pas accessible.

Factures/routes bd1998f confirmées en production : CI 34404141074 success ; Vercel dpl_GBDVUT66pPAwH26JHUaPQs2dQAFZ Ready ; cinq pages factures avec titre/statut HTTP corrects et quatre largeurs ; 105 routes PMS HTTP 200 sans page 404. Ces contrôles remplacent les anciennes conclusions insuffisantes d’accessibilité multilingue du PMS.


## Routes internes multilingues et navigation

- Ajout des alias de 28 pages dynamiques agence/syndic/locataire/portails et de leurs layouts manquants : 148 fichiers. Les contrôles d’accès des composants canoniques et leurs métadonnées noindex sont repris ; aucune autorisation de données ajoutée. Inventaire HTTP avec identifiants fictifs : 140 adresses ont répondu sans page 404. Cela vérifie les routes, pas les opérations métier connectées.
- Les 19 destinations du menu PMS et les 15 du menu syndic, titres de sections et liens secondaires sont localisés en cinq langues. Descriptions non vérifiées retirées (TVA 3/17 universelle, annexes obligatoires, automatismes). Une seule rubrique active, basée sur la destination la plus précise, avec aria-current.
- Bouton de fermeture mobile placé au-dessus du panneau après découverte d’un recouvrement réel ; espace réservé en bas du menu, fermeture par Échap et état aria-expanded. Le layout syndic masque le menu après déconnexion, ignore les réponses anciennes et ne conserve pas le nom d’une précédente identité/copropriété ; suppression du main imbriqué.
- Dernière page canonique sans alias : /offline. Quatre alias ajoutés, titre/métadonnées et retour accueil localisés ; retrait de la promesse non garantie d’accès aux données récentes. Tous les chemins canoniques ont désormais des fichiers de route dans les cinq langues ; cela ne certifie pas la traduction exhaustive du contenu de chaque écran.
- Revue du service worker : le cache v3 stocke encore les réponses de navigation sans distinguer les pages privées et son fallback hors ligne est français. Correctif séparé à préparer ; aucun changement du service worker dans ce lot.

Relevé PDF fae95a2 confirmé en production : CI 34405527410 success ; Vercel dpl_BTfm29LzCDJwhZaKnNpu9qVmeVyN Ready ; cinq pages factures vérifiées avec titre/statut HTTP et quatre largeurs. Dix pages PDF fictives inspectées ; pas de modification de facture réelle ni de validation SQL.

Validation finale navigation : build/lint réussis ; dix menus testés (PMS/syndic × cinq langues), libellés/destinations, rubrique active unique, 320/390/768 px ouverture/fermeture et Échap, retour bureau, changement de compte/déconnexion syndic. Cinq pages /offline vérifiées HTTP, titre, métadonnées noindex et quatre largeurs. Les 140 URL dynamiques et 5 URL hors ligne sont accessibles ; aucune donnée réelle modifiée.


## Cache PWA — ne plus conserver les pages privées

- Le service worker v4 ne met plus en cache les navigations, même réussies, et ne rejoue jamais une ancienne page consultée. Il précache seulement les cinq écrans /offline et deux fichiers publics avec credentials omit ; cache des fichiers de build sous /_next/static et des fichiers publics explicitement désignés.
- Comparaison exacte de l’origine ; requêtes API, RSC, avec Authorization, méthodes non GET et fichiers hors périmètre non interceptés. Réponses private/no-store non stockées. Fallback hors ligne selon la langue de l’URL, depuis le cache courant uniquement, puis réponse 503 simple si le stockage est absent.
- Activation : suppression des anciennes versions tevaxia-vN, sans toucher aux autres caches. Le nouveau worker prend aussi le relais si le nettoyage du stockage échoue ; il ne consulte pas ces anciennes versions. Enregistrement updateViaCache none et en-tête HTTP no-cache/no-store sur /sw.js.
- Neuf tests supplémentaires, suite 1 322 tests / 125 fichiers réussie ; build, lint des fichiers TypeScript et vérification syntaxique du worker réussis (public/sw.js est exclu par la configuration ESLint du dépôt). Navigateur isolé : cache v3 fictif supprimé, cache étranger préservé, vraie coupure réseau dans cinq langues, aucune page privée ajoutée au cache v4 ; inspection visuelle du fallback.
- Aucun compte, aucune facture, aucun document métier en production modifié par ces essais. Le cache HTTP général du navigateur et les sauvegardes applicatives constituent d’autres mécanismes ; ce lot porte sur le service worker.

Navigation 400d356 confirmée en production : CI 34407231200 success ; Vercel dpl_Hc6tve1KeXoR7jQjrqb9VqGqp5Rs Ready ; 140 URL internes et cinq pages hors ligne avec métadonnées/noindex et quatre largeurs revérifiées. Menus connectés contrôlés séparément sur composants réels avec services simulés.


## Documents de facturation — statuts explicites et écritures contrôlées

- Écran renommé Documents de facturation ; type affiché et montants séparés par type ET devise. Factures standards, acomptes, avoirs et pro forma ne sont plus regroupés dans un seul montant qui pourrait être pris pour du chiffre d’affaires. Les montants restent ceux des documents, avec leurs signes, sans compensation/requalification implicite.
- « Marquer émis » remplace « Émettre » ; la confirmation décrit uniquement l’enregistrement d’un statut pour un original émis/contrôlé par l’utilisateur. Retrait de la promesse d’immutabilité. Le marquage payé reste déclaratif et n’est pas présenté comme un rapprochement des encaissements.
- Avant écriture : identité, propriété détenue par l’utilisateur, identifiant, référence, version updated_at et montants contrôlés. UPDATE conditionnel sur propriété/référence/version/statut antérieur ; le marquage payé exige un document déjà émis. Une nouvelle tentative ne réécrit pas un horodatage déjà enregistré. Zéro ligne modifiée provoque une vérification explicite du statut, et non un faux succès.
- Verrou UI partagé pour les actions de statut ; génération PDF et modification du statut ne se chevauchent plus. Erreur localisée prudente (« non confirmée »), relecture disponible, réponses anciennes ignorées après changement de compte. Aucun test d’écriture sur données réelles.
- Neuf tests métier supplémentaires et cinq essais de composants réels avec services simulés : annulation, double clic, échec/reprise, paramètres d’identité/version, changement de compte pendant une requête. Suite 1 331 tests / 126 fichiers réussie. Ces garde-fous applicatifs ne remplacent pas la vérification des politiques SQL/RPC, toujours inaccessible en production.

PWA 9168e0e confirmée en production : CI 34407993584 success ; Vercel dpl_AUYFPJfPghiRcQ9vaqQQRYoAQuxh Ready. Vrai navigateur isolé sur tevaxia.lu : cinq coupures réseau, fallback localisé, suppression du cache v3 fictif, cache étranger conservé, aucun cache de navigation privée, en-tête HTTP no-store du worker vérifié.


## 10 septembre — pied de page commun

Traduction des derniers libellés fixes (accroche, conditions, solutions, plan, contact) dans les cinq langues ; conservation des liens internes localisés. Textes secondaires portés à 14 px avant zoom global et opacité 75 % pour améliorer la lecture. Lien énergie remplacé par Klima-Agence (https://www.klima-agence.lu/fr, consulté le 10 septembre). Build et lint réussis ; navigateur : cinq langues, quatre largeurs 320/390/768/1440, libellés/liens/styles contrôlés, capture allemande inspectée. Aucun calcul modifié.

Le lot précédent ff435db est publié : CI 34409790040 réussie, déploiement dpl_Hh2nfATUGV8Ka3X3h2rpUSiAf4Gy Ready ; cinq pages factures vérifiées en production avec HTTP 200, titre exact, lien de connexion et quatre largeurs.


## 10 septembre — authentification de l’API de facturation

La route /api/v1/facturation/generate acceptait toute valeur non vide de clé. Elle utilise maintenant authenticateApiRequestAsync : contrôle des clés configurées ou actives en base et limite commune de requêtes. Clés free/sandbox refusées pour cet export annoncé Pro ; clés Pro/Enterprise admises. OPTIONS/CORS, réponses no-store, formats explicites et erreurs structurelles 400/422 ; détails des erreurs internes non exposés. Dix tests avec le véritable vérificateur de clés et un export simulé, dont refus avant lecture du corps, Bearer Enterprise et limite 60/min Pro. Suite 1 341 tests / 127 fichiers, lint et build réussis. Contrôle HTTP local réel : sans clé 401, clé fictive 401, sandbox 403, OPTIONS 204. Aucun export réel ni donnée client écrit en production pour ce test.

Périmètre limité à l’accès HTTP : le modèle fiscal, le schéma complet, les calculs XML et la conformité PDF/A/Factur-X ne sont pas validés par ce lot. Anomalies déjà repérées dans le générateur : allégations de conformité non démontrées, pagination absente et textes tronqués ; elles nécessitent une reprise séparée des documents et de leurs interfaces.

Le pied de page 9520bb3 est publié : CI 34410196241 réussie, dpl_9wn53Bt7MS52th1LFRjKwBvsZ9x4 Ready, cinq versions contrôlées en production.


## 10 septembre — validation commune des données de facturation

Validation robuste sur une entrée inconnue, sans coercition de chaînes en nombres ni plantage sur les objets incomplets : dates réelles, identités structurées, champs textuels/XML, montants finis, catégories/types/profils connus, bornes de remise et cohérence catégorie/taux. Le générateur XML partagé refuse les entrées invalides avant export, y compris les appels directs. Ce contrôle d’intégrité ne certifie ni le traitement fiscal ni le profil XML annoncé. Neuf nouveaux tests ; suite 1 350 tests / 128 fichiers, lint et build réussis. Cinq corps invalides testés sur le véritable serveur local avec une clé de test éphémère : tous 422, aucun document généré. Aucun changement de données de production.

Le contrôle des arrondis a reproduit une anomalie restante : quantité 1 × prix HT 1,005 devient 1,00 dans le moteur actuel. Les arrondis, remises XML et restitution PDF feront l’objet du lot suivant ; ils ne sont pas déclarés corrigés ici.

API d4fa6ba publiée : CI 34410562093 réussie, dpl_HVnGdw6hJiwvpyzDQYmRZXrxPsB8 Ready ; contrôle production sans clé/clé fictive/sandbox = 401/401/403, OPTIONS 204.


## 10 septembre — arrondis et cohérence écran/PDF/XML

Moteur décimal exact (BigInt) pour prix × quantité × remise, arrondi de chaque ligne au centime, somme des lignes arrondies et TVA arrondie par catégorie/taux. Cas 1,005 → 1,01 corrigé ; résidus binaires éliminés. XML : prix unitaire net après remise et quantités/taux sans réduction silencieuse à quatre/deux décimales. PDF : mêmes montants de lignes, prix et quantités saisis conservés. Plafond opérationnel de conversion : 9 999 999 999,99 ; dépassement affiché indisponible et export bloqué dans le formulaire.

Écran : affichage monétaire selon les cinq langues, remise visible/modifiable, taux enregistré hors liste conservé au lieu d’afficher une autre option ; champs numériques vides invalides, non transformés en zéro. Grille plus lisible, entête mobile sans débordement et libellés accessibles explicites.

Dix tests nouveaux ; suite 1 360 tests / 129 fichiers, ciblés 52, lint et compilation réussis. Navigateur réel cinq langues × quatre largeurs : taux 20 conservé, remise 10 → 20 → 10 modifiant le TTC, montant effacé bloquant l’export, dépassement géré. PDF technique d’une page rendu et inspecté : lignes 1,01 / 0,60 / 0,02, HT 1,63, TVA 0,33, TTC 1,96. XML embarqué identique au standalone, totaux réconciliés. Exemple arithmétique fictif, pas une validation de l’application territoriale du taux. Aucun téléchargement ni sauvegarde de facture client exécuté pour la QA navigateur.

Références des équations consultées : https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434/BR-CO-10/ et https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434/BR-CO-17/. Ce lot ne certifie pas le format Factur-X/Peppol ; revendications PDF/A, pagination/textes longs, modèles métier et historique restent à reprendre. Validation 61b45b0 publiée : CI 34411171766 réussie, dpl_Ha6EMwu83rsLKEdBjmP8vsGTK34B Ready.


## 10 septembre — PDF/A, pagination et présentation de la facturation

Le PDF partagé embarque désormais des polices Source Sans Pro (licence OFL jointe), un profil sRGB, des identifiants et des métadonnées XMP UTF-8 avec déclaration du schéma Factur-X. Les noms accentués et les documents longs sont conservés ; pagination sans troncature, titres selon le type 380/381/384/386 et cinq langues. Chargement du générateur à la demande dans les trois écrans concernés. XML : ordre des adresses et des échéances corrigé, description conservée dans le nom du produit pour BASIC, référence de paiement et conditions sans échéance conservées.

Contrôle externe Mustang CLI 2.26.0 (veraPDF et schémas/Schematron inclus) : cinq cas BASIC fictifs, TVA standard, identités complètes, huit lignes avec arrondis/remise et longues descriptions/notes, trois pages chacun. Les cinq fichiers effectivement téléchargés dans le navigateur passent les contrôles PDF/A et XML ; XML embarqué identique au fichier séparé et textes identiques au rendu Node. Quinze pages rendues et inspectées. Ces résultats portent sur ce corpus, pas sur tous les profils, régimes TVA ou exigences des destinataires. Les contrôles d’entrée restent des contrôles d’intégrité ; modèles métier, mentions fiscales et autres profils restent à revoir.

La page d’accueil facturation et les textes actifs de préparation/historique distinguent préparation, émission, transmission et conservation d’un original. Suppression des promesses générales non établies de conformité, d’indexation automatique et d’archivage ; liens officiels DGFiP, Guichet.lu et FNFE-MPE. Métadonnées localisées et vérification des trois liens internes. Cinq langues × quatre largeurs sans débordement, scénarios interactifs d’arrondis toujours réussis. Les téléchargements QA utilisent des données fictives, exclusivement en local avec trafic Supabase bloqué.

Validation : suite 1 364 tests / 130 fichiers réussie, quatre tests PDF ciblés repassés après correction du typage, lint sans erreur et build 1 347 pages réussi. Aucune vulnérabilité de dépendance de production signalée par npm audit au contrôle de ce lot.

Références : https://fnfe-mpe.org/factur-x/implementer-factur-x/ ; https://github.com/ZUGFeRD/mustangproject/releases/tag/core-2.26.0 ; https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees ; https://guichet.public.lu/fr/entreprises/gestion-juridique-comptabilite/marche-public-concession/facturation/emission-facture-electronique-marche-public-contrat-concession.html.

Arrondis 062bfdb publiés : CI 34412816970 réussie ; dpl_22pXmA9ACUE455odp9PJPPPTBX7s Ready, cinq langues contrôlées sur la production.


## 10 septembre — historique de facturation et sauvegarde complète

Lecture par pages avec curseur d’identifiant, filtre explicite user_id et contrôle du compte avant/après les requêtes. Les limites 200/500 deviennent des tailles de pages ; aucun résultat partiel n’est présenté comme complet en cas d’erreur. La sauvegarde ZIP utilise l’utilisateur de son contexte. Une limite opérationnelle de 100 000 entrées entraîne une erreur explicite, pas une troncature. La lecture n’est pas un snapshot transactionnel si les données changent simultanément.

Enregistrement lié au compte capturé avant la génération ; un document commencé anonymement n’est pas enregistré dans un compte connecté plus tard. Échec de sauvegarde signalé. Suppression filtrée par propriétaire et identifiant, avec vérification d’une ligne réellement supprimée. L’historique est remonté séparément pour chaque utilisateur : annulation des anciennes lectures, erreurs visibles avec reprise, actions mutuellement verrouillées, erreur PDF gérée, contrôle d’identité après génération, URL de téléchargement libérée après délai. Montants localisés, dates civiles sans décalage de fuseau, entête mobile et libellés accessibles améliorés.

Sept tests service nouveaux ; suite 1 371 tests / 131 fichiers réussie, lint sans erreur et build réussi. Cinq langues en navigateur isolé : lecture en échec puis reprise, absence de faux historique vide, double clic PDF et erreur, annulation/échec de suppression, isolation au changement de compte et déconnexion. Les services de ces scénarios sont simulés : aucune donnée client modifiée. Les politiques RLS réelles et l’ancien brouillon local partagé restent hors de cette validation.

PDF 6daf17b publié : CI 34415552734 réussie ; dpl_99ovP9AWSk55MSypRvWke8uSaxup Ready. Page facturation, métadonnées/liens, quatre largeurs et interactions de calcul vérifiées en production dans les cinq langues.


## 10 septembre — brouillons de facturation isolés et récupérables

L’éditeur attend la résolution de l’authentification et remonte un état distinct par compte/visiteur. Les brouillons sont enregistrés sous des clés séparées ; l’historique et le préremplissage locatif utilisent la même destination. L’ancienne clé commune est conservée, sans chargement automatique ; restauration volontaire avec confirmation d’appartenance. Une structure illisible bloque l’enregistrement automatique et permet d’exporter les données brutes avant réinitialisation. Champs numériques temporairement vides conservés invalides, non transformés en zéro. Échec de stockage signalé au lieu d’être masqué.

Génération protégée contre les doubles clics ; champs verrouillés pendant l’export. Résultat tardif abandonné après changement de compte/démontage, contrôle du propriétaire avant téléchargement authentifié, libération différée des URL. Ce stockage local n’est pas un coffre chiffré ; les règles de TVA du préremplissage locatif et les modèles métier ne sont pas certifiés par ce lot.

Neuf tests nouveaux : suite 1 380 tests / 132 fichiers, lint sans erreur et build réussis. Cinq langues en navigateur isolé : deux comptes et visiteur, restauration annulée puis acceptée, ancien original préservé, double clic/génération et changement d’identité, brouillon corrompu non écrasé, quota de stockage signalé. Cinq téléchargements réels sur serveur local compilé avec trafic Supabase bloqué ; scénarios de calcul et quatre largeurs toujours réussis. Aucun enregistrement client de production exécuté.

Historique f80eebe publié : CI 34416090971 réussie ; dpl_EiiDcqiAKWWubsNECZaYGQLtCxZb Ready. Accès anonyme, lien de connexion et quatre largeurs vérifiés dans les cinq langues sur la production.


## 10 septembre — profils XML réellement disponibles

Contrôle externe du même cas complet dans les cinq profils annoncés : BASIC, EN 16931 et EXTENDED validés ; MINIMUM et BASIC WL échouent aux schémas (structure spécifique incompatible avec les lignes et notes générées). Ces deux profils sont désormais refusés explicitement par la validation commune, donc par le formulaire et l’API. Aucun changement silencieux de profil. Un sélecteur de profil permet de corriger un ancien brouillon tout en conservant ses données. Les trois profils disponibles restent soumis aux mentions requises et à la validation du destinataire ; le passage d’un exemple complet n’est pas une certification générale.

Cinq tests supplémentaires ; suite 1 385 tests / 132 fichiers, lint sans erreur et build réussis. Validateur utilisé : Mustang CLI 2.26.0, contrôles XML/schémas/Schematron, sources et traces dans work/facturx-validation/profile-*.log. Cette correction ne traite pas encore les motifs d’exonération ni toutes les identités fiscales requises.

Brouillons e62cc49 publiés : CI 34416743081 réussie ; dpl_2n47tS86gohHK9Z6DYPwEurfygDa Ready. Cinq langues en production, brouillon visiteur, interactions de calcul et quatre largeurs vérifiés.

Navigateur réel : cinq langues, ancien MINIMUM conservé et export bloqué, choix BASIC/EN 16931/EXTENDED enregistrés et export activé, quatre largeurs sans débordement.


## 10 septembre — modèles sans présomption fiscale et dates civiles

Les modèles fournissent des libellés traduits mais ne préremplissent plus un prix, un taux, une exonération ou une qualification professionnelle. Suppression des mentions automatiques CGI/TVA LU/ILAT/TEGOVA/EVS dans ces modèles. Le modèle syndic concerne des prestations de gestion, pas une conversion d’appel de fonds en facture. La catégorie reste éditable et un taux numérique explicite est requis ; saisie libre pour les taux absents des anciennes listes nationales. Les données déjà enregistrées conservent leurs valeurs. Les nouveaux documents ne reçoivent plus systématiquement le numéro F-26-00001 : l’utilisateur attribue sa référence selon sa séquence.

Date par défaut calculée selon le jour civil au Luxembourg ; ajout des trente jours sur des dates civiles, sans décalage UTC/DST. Les modèles préservent dates, références et parties existantes. Sept tests nouveaux : suite 1 392 tests / 133 fichiers réussie, lint sans erreur et build réussi.

Profils b284e4f publiés : CI 34416998109 réussie ; dpl_CjrRyk1aAP9qRVr2HJXeMBkU2oaq Ready. Cinq langues et quatre largeurs, profil incompatible conservé/bloqué et trois profils disponibles vérifiés en production. Les mentions fiscales obligatoires et la conversion directe des appels syndic restent des travaux distincts.

Contrôle navigateur cinq langues : nouveau numéro et taux vides, cinq modèles nécessitant prix/taux, absence de notes juridiques automatiques, taux personnalisé 19 % produisant 119 EUR pour 100 EUR HT. Quatre largeurs et anciens scénarios d’arrondis/remises réussis.


## 10 septembre — appels de fonds distincts des factures fiscales

Retrait des boutons de conversion Factur-X individuelle/groupée et du générateur qui attribuait automatiquement une exonération TVA et des références CGI/LTVA aux appels de fonds. Le PDF d’appel de fonds existant et ses actions individuelle/groupée sont conservés. Un texte localisé précise la nature du document. Ce lot ne certifie ni les règles de répartition ni le traitement fiscal propre à chaque syndicat.

Référence sur la nature provisionnelle des appels en France : https://www.service-public.gouv.fr/particuliers/vosdroits/F20586. Le retrait des assertions fiscales LU/FR repose sur l’absence des informations nécessaires dans la conversion, sans appliquer un régime français au Luxembourg.

Lint sans erreur (une directive existante inutile), build réussi. Cinq langues testées sur l’écran réel avec services/rendu PDF simulés : texte de portée, absence des boutons fiscaux, actions PDF individuelle/groupée conservant le montant et le nom du fichier. Aucun PDF client ni opération financière produit par ces tests. Le rendu existant de l’appel n’a pas été modifié.

Modèles e141499 publiés : CI 34417387221 réussie ; dpl_33mUwmg8eW6Rh3LhPSzzktNwTCKt Ready. Cinq langues, modèles sans taux implicite, taux personnalisé et quatre largeurs vérifiés en production.


## 10 septembre — préremplissage locatif à vérifier avant facturation

Le préremplissage utilise désormais le propriétaire, le lot, l’année et le mois du paiement réel ; il refuse les identités discordantes, périodes invalides, montants négatifs/non finis et totaux incohérents. Les deux montants enregistrés sont conservés, sans présumer le pays ou la TVA. Numéro et pays laissés à compléter, taux requis, aucune référence CGI ajoutée et aucun nom de partie inventé. Date de préparation au jour civil luxembourgeois, échéance du 5 exprimée comme date civile de la période. Libellés et action traduits ; enregistrement du brouillon sous le compte initiateur, échec visible.

Neuf tests nouveaux ; suite 1 401 tests / 134 fichiers, lint sans erreur et build réussis. Cinq langues en navigateur isolé avec lecture simulée : montants/période/libellés conservés, destination localisée et brouillon par compte, TVA non supposée, refus sans écriture ni navigation pour un paiement d’un autre compte. Ni les quittances, ni le calcul des loyers, ni le stockage global des lots ne sont certifiés par ce lot.

Appels de fonds f11163c publiés : CI 34417797988 réussie ; dpl_4SsVGeVhZwx33gFx4mJMKQ7xw5Gx Ready. Les scénarios connectés de ce module ont été vérifiés avec des services simulés, pas avec des données client de production.


## 10 septembre — identifiants fiscaux et motifs dans les exports

Validation d’export partagée par le formulaire, l’API et le générateur XML, en complément de l’intégrité des données. Identifiant vendeur requis ; numéro TVA ou identifiant fiscal distinct pour les catégories concernées. L’identifiant fiscal vendeur est transmis sous le schéma CII FC et imprimé dans le PDF, sans inventer de numéro TVA. Autoliquidation : identifiant client requis. Motif saisi explicitement pour E/AE/G/O, conservé intégralement dans la ventilation XML et le PDF. Un document O exclut les autres catégories et les numéros TVA vendeur/client ; les balises de taux TVA y sont omises et le PDF affiche un tiret à la place du taux.

La catégorie K reste refusée explicitement : les informations de livraison nécessaires ne sont pas prises en charge. L’autre identifiant fiscal client (distinct de TVA/légal) et la représentation fiscale ne sont pas implémentés. Ces contrôles ne choisissent pas le régime fiscal, ne vérifient pas l’inscription des identifiants dans un registre et ne remplacent pas les règles nationales ou celles du destinataire.

Treize tests supplémentaires, y compris réponse API 422 avant génération : suite 1 414 tests / 135 fichiers, lint sans erreur et build réussis. Les anciennes données de test valides ont été complétées avec des identifiants/motifs fictifs pour respecter cette frontière plus stricte. Les vérifications purement arithmétiques restent distinctes.

Mustang CLI 2.26.0 : matrice de 18 XML (S/Z/E/AE/G/O × BASIC/EN 16931/EXTENDED) valide. Variante E avec identifiant fiscal FC et sans numéro TVA validée dans les trois profils. Cinq PDF BASIC de trois pages (FR E, EN AE, DE G, PT O, LB Z) passent PDF/A et XML ; quinze pages rendues/inspectées, page FR réinspectée après ajout FC. Motifs longs et descriptions complets. Navigateur réel local cinq langues/quatre largeurs : motifs et identifiants manquants bloquent, données corrigées permettent les téléchargements ; contenu PDF et XML embarqué/séparé identiques au corpus Node. PDF FR réellement téléchargé également validé extérieurement. Trafic Supabase bloqué pour ces téléchargements fictifs ; aucune facture client créée.

Sources primaires : https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434/BR-CO-26/ ; BR-S-02, BR-E-02, BR-E-10, BR-AE-02, BR-AE-10, BR-G-10, BR-O-02, BR-O-10 et BR-O-11 dans le même référentiel. Structure CII contrôlée sur les schémas Factur-X distribués avec Mustang. Ces sources étayent les contrôles du format, pas l’application d’un régime fiscal à une opération réelle.

Préremplissage locatif a147a9d publié : CI 34418273901 réussie ; dpl_Ev5hroUsm8DTUAA1hfBGF95bUikr Ready. Scénarios connectés vérifiés avec des données et services simulés, sans opération client de production.


## 10 septembre — import des observations PMS

Authentification via la recherche partagée de clé hachée, puis contrôle explicite de la clé active, de son propriétaire, de son organisation, du rôle actuel admin/member et de l’appartenance de l’hôtel. Les clés environnement/sandbox et les comptes viewer ne peuvent pas écrire. Les anciennes références à is_active et api_usage_log, absentes du schéma versionné, sont remplacées par les mécanismes partagés existants.

Validation de tout le lot avant une unique écriture : dates réelles et uniques jusqu’au jour luxembourgeois, EUR, occupation avec unité explicite ratio/percent ou chambres vendues/disponibles cohérentes, ADR complet et RevPAR concordant. Aucun pourcentage deviné ni ligne invalide silencieusement ignorée. Les observations partielles sont refusées pour ne pas écraser des valeurs par des champs absents. Confirmation des dates effectivement retournées, erreurs techniques génériques, échec de journalisation sans faux échec d’un import déjà confirmé. Documentation GET précise : format normalisé nécessitant un adaptateur fournisseur, limites par instance, aucune promesse de connecteur natif.

29 tests supplémentaires ; suite 1 443 tests / 137 fichiers et lint réussis. Contrôles d’écriture avec base simulée : droits, organisation, absence de toute écriture si une ligne est invalide, calculs et confirmation. Les politiques et écritures Supabase de production restent non vérifiées faute d’accès ; ce lot n’applique aucune migration et ne modifie aucune observation client pendant les essais.

Facturation e6dc52d : CI 34419175142 réussie ; déploiement dpl_9M77qSaCsd3Ef1cUUiACm8reT4jN Ready avec alias tevaxia.lu. Contrôles production cinq langues/quatre largeurs réussis, sans création de facture client.

Compilation de production et contrôles HTTP locaux réussis : GET documentaire, OPTIONS, POST sans clé et avec clé fictive refusés en 401, réponses non mises en cache.


## 10 septembre — données et interactions des prévisions hôtelières

Le CSV exige désormais un ratio entre 0 et 1 ou le signe % explicite : 1 signifie 100 %, 1 % signifie 0,01 ; 82 seul est refusé. Aide actualisée dans cinq langues. Les observations remplacées doivent être complètes, avec ADR nul uniquement si aucune chambre n’est vendue, et RevPAR cohérent. Dates selon le jour civil luxembourgeois. Les anciennes lignes partielles restent lisibles mais une nouvelle écriture ne peut pas effacer involontairement des mesures absentes.

Lecture paginée jusqu’à épuisement, sans supposer qu’une page courte est la dernière ; erreur/cursor incohérent refusé sans résultat partiel. Chaque opération reçoit le compte initiateur, vérifie l’hôtel et l’appartenance à son organisation. Écritures réservées aux rôles admin/member au niveau du client ; les politiques RLS de production restent à vérifier indépendamment. Suppression filtrée par hôtel et identifiant, avec confirmation de la ligne retournée. Enregistrement confirmé par les dates retournées ; created_by existant n’est pas réécrit.

Écran remonté par compte, requêtes tardives ignorées après changement d’hôtel/déconnexion, saisies remises à zéro au changement d’hôtel, verrou pendant les actions. Chargement et erreur distincts d’un historique réellement insuffisant ; bouton réessayer. Confirmation avant suppression. Une sauvegarde échouée conserve la saisie. Le compteur d’historique correspond aux 60 lignes effectivement affichées. Aucun changement à la méthode de prévision dans ce lot.

Huit nouveaux tests : suite 1 451 tests / 138 fichiers réussie, lint sans erreur. Navigateur isolé cinq langues avec les véritables composants/calculs et services simulés : CSV ambigu rejeté avant écriture, unité explicite, compte/hôtel transmis, verrou, changement de compte pendant sauvegarde, erreurs lecture/sauvegarde/suppression, annulation de suppression, déconnexion. Une resélection du même hôtel invalidait la requête sans la relancer : corrigée et scénarios rejoués avec succès. Pas de données client modifiées ; ces essais ne certifient pas les RLS ni la transactionnalité des contrôles d’accès séparés.

Import PMS cae2153 : CI 34420109744 réussie ; déploiement dpl_4FEf9KFTFayGWcohYn8j3CvXq35q Ready avec alias tevaxia.lu. Contrôles HTTP en production réussis : documentation, prévol, refus des requêtes sans clé et avec clé fictive, no-store.

Compilation de production réussie après le dernier correctif. Parcours anonyme réel local : lien de connexion localisé et absence de débordement aux largeurs 320/390/768/1440 dans cinq langues. Les scénarios connectés ci-dessus restent des simulations de services.


## 10 septembre — erreurs d’authentification API et bornes de quotas

La recherche partagée d’une clé vérifie les métadonnées renvoyées : active=true, propriétaire et identifiant présents, niveau free/pro/enterprise reconnu. Un niveau inconnu est refusé au lieu de provoquer une erreur dans les quotas. Une erreur de requête ou une exception réseau renvoie une indisponibilité 503 générique et non mise en cache, sans détail de base exposé. Les fenêtres de quota se réinitialisent exactement à leur borne annoncée (>=), sans seconde de rejet avec Retry-After=0. Le commentaire sandbox précise le partage par clé et instance ; aucune limite globale ou par IP n’est prétendue.

Huit nouveaux tests : hachage SHA-256 effectivement utilisé dans la recherche, propriétaire conservé, métadonnées invalides refusées, erreurs renvoyées/levées, dix appels puis reprise exactement à 60 secondes. Suite 1 459 tests / 139 fichiers et lint réussis. Aucun changement de tarification ni de politique d’attribution des niveaux. Le schéma local 004 permet au propriétaire de modifier sa ligne de clé ; l’autorité sur le niveau payant et les éventuelles politiques plus récentes exigent une vérification Supabase de production qui n’est pas disponible. Ce lot ne certifie pas ces droits en base.

Prévisions 189b933 publiées : CI 34420790269 réussie ; déploiement dpl_87WnrFkk3kuzxxPvtmFLHWou8WVG Ready avec alias tevaxia.lu.

Compilation réussie ; tests HTTP locaux facturation/PMS réussis (absence/clé fictive 401, sandbox facturation 403, prévols). Prévisions : contrôle public production réussi dans cinq langues/quatre largeurs.


## 10 septembre — documentation des quotas et diagnostic de la lecture des clés

Sandbox documentée dans cinq langues conformément au code : 10 requêtes/minute et 200/fenêtre de 24 heures, partagées entre utilisateurs d’une même clé sur une instance serveur. Retrait des anciennes annonces 60/minute et 10 000/mois. Facturation/PMS exclus de cette clé Free. OpenAPI 1.1.1 précise les limites par niveau, les fenêtres et le caractère non distribué des compteurs, ainsi que l’indisponibilité possible de l’authentification.

4c41933 est déployé (CI 34421001459 réussie, dpl_HfvSqq49umETHK1zV4D7vB4GZNrS Ready), mais le contrôle production a révélé une erreur de lecture des clés Supabase : clé fictive renvoyée en 503, anciennement masquée en 401. Le contrôle production ne valide donc PAS une authentification fonctionnelle pour les clés stockées en base. Sans clé, le refus 401 fonctionne. Aucune tentative d’écriture client. Un diagnostic serveur minimal est ajouté : uniquement un code d’erreur technique filtré, jamais la clé, le message de base ni les paramètres.

Test additionnel de non-divulgation du journal : suite 1 460 tests / 139 fichiers réussie, lint et compilation réussis. Diagnostic de production à préciser après publication.

Contrôle navigateur local réussi : nouveau texte sandbox dans cinq langues, quatre largeurs sans débordement, spécification 1.1.1 servie avec les quotas corrigés.


## 10 septembre — schéma réel des clés et isolation de leur gestion

Le diagnostic serveur a identifié 42703. Des requêtes anonymes en lecture, limitées à zéro ligne, confirment sur dpynqvilgniohgtichbz que api_keys possède id/name/tier/user_id/key_hash/key_prefix/created_at/last_used_at/revoked_at, mais pas active, is_active ni org_id. Aucune clé ni ligne client lue. La description OpenAPI de la base renvoie 401 ; pas de tentative de contournement. Les anciens constats tirés du seul schéma local 004 ne décrivent donc pas exactement la production.

Authentification compatible : sur le schéma complet, active=true ET revoked_at=null requis ; uniquement si active est explicitement absent, recherche hachée filtrée par revoked_at=null. Une clé désactivée, révoquée ou une erreur sur une autre colonne ne déclenche jamais cette compatibilité. L’import PMS continue d’exiger une organisation vérifiable : l’absence d’org_id n’autorise aucune écriture et reste une limitation à résoudre dans le schéma/mécanisme d’attribution, pas par suppression du contrôle.

Gestion des clés : compte initiateur requis avant/après opération, pagination complète et filtre propriétaire explicite, absence de hash dans les listes, création individuelle uniquement Free, secret affiché seulement au compte initiateur. Création sans colonnes optionnelles inexistantes ; lecture retire uniquement la colonne explicitement absente et conserve les autres. Révocation par date sur l’ancien schéma, après reconnaissance exacte de la colonne active absente. Révocation/suppression confirmées par les lignes retournées. Les règles RLS et l’attribution des niveaux payants restent non certifiées : aucune migration appliquée.

Écran remonté par compte, effacement des secrets et résultats à la déconnexion/changement de compte, actions verrouillées et erreurs de presse-papiers traitées. Erreurs de listes/statistiques séparées d’un résultat vide, statistiques annulées au changement de clé et réessayables, sélection de clé accessible au clavier. Valeurs numériques SQL converties et vérifiées avant agrégation ; hauteur du graphique définie pour ses barres. Les webhooks sont remis à zéro par le remontage, mais leurs services/opérations ne sont pas certifiés par ce lot.

Douze nouveaux tests depuis 49ce0da : suite 1 472 tests / 140 fichiers. Essais navigateur isolés cinq langues avec services simulés : compte capturé, arrivée tardive d’un secret, verrou, révocation/suppression échouées, annulation, erreur de statistiques et reprise, lecture échouée, déconnexion. Aucune clé réelle créée/révoquée/supprimée ; aucun webhook envoyé.

49ce0da publié : CI 34421360148 réussie, dpl_J2T8qPK68eDuQPtKVdqCb3Gma9fR Ready ; documentation cinq langues/quatre largeurs et spécification corrigée contrôlées en production. Sur cette version, le 503 de lecture de clé était encore présent ; le nouveau correctif de compatibilité reste à confirmer une fois déployé. Sandbox facturation refusée 403 comme prévu.

Compilation et lint réussis après adaptation du typage de la sélection dynamique. Local réel sans configuration Supabase : message de configuration affiché sans débordement dans cinq langues/quatre largeurs ; tests HTTP facturation/PMS locaux réussis. Les parcours connectés sont ceux de la simulation décrite ci-dessus.


## 10 septembre — webhooks : résultat réel, portée et gestion

Le client respecte désormais le résultat métier de la livraison : une réponse HTTP 200 du endpoint de test ne suffit pas. Seuls ok=true et un statut de destination 2xx donnent un succès. Erreurs de transport, statut 500 du destinataire, réponse malformée ou échec du endpoint restent des échecs. Compte et session vérifiés avant envoi, résultat refusé après changement de compte. Aucun webhook réel envoyé pendant les essais.

Les actions de l’écran sont verrouillées, les erreurs de création/test/activation/suppression sont traitées et les réponses après démontage ignorées. Les appels de gestion reçoivent le compte initiateur, filtrent le propriétaire, lisent toutes les pages et confirment les lignes modifiées/supprimées. Les listes n’incluent plus les secrets de signature. La lecture publique à zéro ligne confirme l’existence des colonnes utilisées sur api_webhooks en production, sans lecture de données client ; elle ne certifie pas les politiques RLS.

Recherche dans les sources : le seul envoi implémenté est le test manuel health.check. Les annonces de notifications automatiques sur variation de prix ont été remplacées dans cinq langues par la portée réelle. Nouvelles configurations limitées à health.check ; anciennes étiquettes conservées et clairement non automatiques. Validation HTTPS sans identifiants intégrés, port 443, conforme aux contraintes du transport serveur existant ; protection DNS et refus des destinations privées restent côté serveur. Message d’indisponibilité de gestion des clés reformulé sans prescription de migrations au visiteur.

Quatorze nouveaux tests : suite 1 486 tests / 141 fichiers réussie ; lint sans erreur. Navigateur isolé cinq langues avec services simulés : échec de livraison visible, verrou, compte capturé, action échouée traitée, ancien résultat ignoré après changement de compte. Aucune création/suppression réelle et aucune notification externe. Les tentatives automatiques, leur planification et un provisionnement de secrets côté utilisateur ne sont pas implémentés par ce lot.

ce86ddf confirmé publié : CI 34422245054 réussie, dpl_8oNStEVmcgVBdVuZFEL2Qqxtbqcx Ready avec alias tevaxia.lu. Après Ready, contrôles HTTP production facturation/PMS réussis : absence/clé fictive 401, sandbox facturation 403, prévols. Le 503 dû à la colonne active absente est résolu pour la recherche de clé testée. Pas de test avec une clé client valide et pas d’import PMS autorisé. Parcours public gestion des clés cinq langues/quatre largeurs réussi en production. Les premiers essais avant Ready visaient encore l’ancienne version et ne sont pas ceux retenus pour cette confirmation.

Contrôle supplémentaire de contenu rendu : les anciennes variables de traduction utilisées comme fonctions masquaient des extraits de code. Balises riches corrigées pour la signature, l’événement et les exemples endpoint/authentification/corps/lien, puis vérifiées dans cinq langues. Le sélecteur des nouvelles configurations n’affiche que health.check.

Compilation finale réussie après corrections de contenu riche. Parcours public local cinq langues/quatre largeurs et refus HTTP facturation/PMS rejoués avec succès ; aucun envoi de webhook.


## 10 septembre — page d’état et textes riches restants

Page d’état : portée reformulée en contrôles HTTP ponctuels. Le fichier robots.txt, le contrat GET de l’API, la configuration publique d’authentification et le portail externe ne valident ni toutes les pages, ni les transactions/calculs, ni les données/RLS. Retrait de l’annonce de contrôle des paiements et d’actualisation automatique toutes les 60 secondes dans le navigateur. La sonde d’authentification transmet désormais l’en-tête public apikey côté serveur. HTTP 401/403 reste inconnu, pas une preuve de panne. Un état inconnu empêche le résultat global positif ; une liste vide est également inconnue. Les temporisateurs sont libérés dans tous les cas, corps de réponse annulé et seuil lent explicite à 2 secondes. Retour à l’accueil localisé.

Analyse des appels t.rich avec fonctions de rendu et messages FR : six substitutions mal formées supplémentaires détectées sur organisation/propcalc-développeurs/état. Balises riches corrigées pour la marque et le contact, message d’organisation indisponible remplacé par une information utilisateur sans demander au visiteur de configurer des variables ou migrations. L’analyse ciblée ne trouve plus ce motif ; ce n’est pas une certification de toutes les traductions ni des promesses commerciales de PropCalc.

Six nouveaux tests : suite 1 492 tests / 142 fichiers réussie, lint sans erreur. Cas couverts : agrégation inconnue/vide/dégradée/échouée, autorisation HTTP inconnue, en-tête transmis sans présence dans le résultat, nettoyage du timeout après réussite/échec, réponses lentes et HTTP 500. Aucun test de transaction ni envoi de message externe.

f33388b webhooks publié : CI 34423248700 réussie, dpl_CNjN6FNAL7uBpKYpGxyK9wqodKjS Ready avec alias tevaxia.lu. Refus HTTP production facturation/PMS passés et parcours public de gestion des clés cinq langues/quatre largeurs réussi. Les tests de livraison webhook restent simulés.

Le navigateur a révélé une copie statique anglaise de PropCalc développeurs également utilisée par DE/PT/LB. Les quatre routes réexportent désormais la page traduite commune et sa métadonnée ; exemple data-lang et liens internes localisés. Le CTA Documentation rejoint la section API existante au lieu de la racine API sans route. Les routes status réexportent également la métadonnée traduite. Une URL longue qui débordait à 320 px est rendue sécable. Les promesses de package/extensions/autres canaux restent un sujet distinct non certifié ici.

Compilation finale réussie. Navigateur local : status, PropCalc développeurs et organisation dans cinq langues et aux largeurs 320/390/768/1440, sans débordement ni erreur de page. Métadonnée status, contact visible, retour localisé, marque rendue, CTA Documentation vers #api et message de configuration vérifiés. Sonde publique Supabase avec apikey vérifiée séparément en 200, sans lecture de compte ni de données client.


## 10 septembre — validation des entrées de l’API PropCalc

Les quatre POST frais/emprunt/rendement/cash-flow refusent désormais les corps autres qu’un objet, les champs inconnus, les types incorrects, null explicite et les nombres non finis/hors domaine. Les taux sont des ratios décimaux. Les durées supérieures au plafond national sont refusées au lieu d’être tronquées ; un régime locatif inconnu n’est plus ignoré. Le cash-flow refuse un apport nul (ratio sur fonds propres indéfini) ou supérieur au coût total. Les résultats non finis ne sont plus sérialisés en null.

Les réponses indiquent la devise et les hypothèses effectivement appliquées : frais approximatifs de financement, fiscalité marginale, vacance, coûts omis et progression selon le calcul. Ces informations rendent le modèle inspectable ; elles ne constituent pas une validation fiscale des dix pays. Retrait de l’en-tête annonçant un quota non implémenté, réponses no-store et documentation dans cinq langues précisant unités/types. Exemple curl corrigé (isNew, ancien champ type non pris en charge).

Validation : 33 nouveaux tests, suite complète 1 525 tests / 143 fichiers réussie, lint sans erreur. Requêtes HTTP locales des quatre calculs et OPTIONS réussies, dont erreurs d’entrée et scénarios fictifs valides avec devise/hypothèses. Aucun enregistrement client modifié.

Lot précédent 94ce575 publié : CI 34424347826 réussie, déploiement dpl_BjtpgzrtCjWMFUD3UsR7X9ga9PQY Ready. Parcours production état/PropCalc développeurs/organisation cinq langues et quatre largeurs réussis.


## 10 septembre — intégrations PropCalc utilisables

Documentation recentrée sur le widget livré et les quatre calculs REST. Retrait de la commande npm et de ses résultats codés en dur, du bouton Chrome sans cible et des fonctions Sheets sans procédure d’installation fournie. Cela ne conclut pas à l’absence de produits externes ; leur distribution n’a pas pu être vérifiée. Exemple JavaScript fetch exécutant l’API avec traitement des erreurs et lecture des hypothèses, sans montant garanti. Retrait des affirmations de licence/zéro dépendance/16 fonctions non justifiées par ces intégrations.

Inspection du widget livré : code Royaume-Uni uk, modules rental/stampduty (et non yield/transfertax), sept langues, sans lb. Documentation alignée ; exemple de la page luxembourgeoise explicitement en français. Bundle inchangé : ce contrôle de chargement ne constitue pas une validation de ses règles fiscales.

Lint et compilation réussis. Navigateur local : cinq langues, quatre largeurs sans débordement, exécution de l’exemple fetch extrait de la page, chargement du vrai bundle/CSS depuis l’exemple HTML, dix onglets et modules britanniques rental/stampduty rendus. Aucune donnée client écrite. Le premier essai de fixture inter-origines était bloqué par la protection loopback du navigateur ; fixture même origine utilisée, sans désactiver la protection.

Lot API c98d753 publié : CI 34425528743 réussie, dpl_A3gwDQ2zgsaFvhxybz9fhP7mRFht Ready et alias tevaxia.lu. Requêtes HTTP production quatre calculs/OPTIONS/entrées invalides réussies ; documentation production cinq langues/quatre largeurs réussie.


## 10 septembre — isolation des lots locatifs par compte

Suppression de l’envoi automatique de la sauvegarde globale des lots lors de la connexion. Nouveau stockage local v2 par compte (et espace invité distinct), identité explicitement transmise par portefeuille/édition/paiements/colocataires/export/sauvegarde. L’ancien contenu non attribué reste intact et peut être téléchargé depuis le portefeuille ; il n’est pas affiché ni importé automatiquement dans un compte. Suppression de compte : nettoyage de sa clé locative v2 ajouté.

Écritures cloud : contrôle du compte avant/après, propriétaire explicite, résultat confirmé avant mise à jour du cache. Réessai de création avec identifiant stable ; erreur de sauvegarde visible et navigation seulement après réussite. Pas de troncature silencieuse au-delà de 500 lots. Lecture par pages successives jusqu’à épuisement ; erreur intermédiaire ne produit pas de résultat partiel présenté comme complet. Une liste cloud vide confirmée est autoritaire et ne ressuscite pas l’ancien cache. Une modification locale intervenue pendant la lecture empêche son écrasement. Les erreurs cloud affichent un avertissement sur la copie locale ; stockage invalide/quota ne sont pas remplacés silencieusement par un portefeuille vide.

Vues recréées au changement de compte et, pour un lot, d’identifiant. Chargements tardifs du portefeuille/éditeur ignorés ; boutons d’écriture verrouillés. Accès direct à un lot relit la source du compte au lieu de dépendre uniquement d’une visite préalable au portefeuille. Les exports locatifs refusent une lecture cloud non confirmée.

Validation : 17 nouveaux tests, suite complète 1 542 tests / 144 fichiers réussie, lint sans avertissement et compilation réussie. Fixture navigateur avec pages réelles cinq langues : compte remplacé, ancienne requête retardée ignorée, erreur de lecture non assimilée à un portefeuille vide, erreur d’écriture sans navigation, identifiant de réessai stable, verrou et changement de compte pendant sauvegarde. Aucune donnée client lue ou modifiée pour ces scénarios ; Supabase simulé. Les règles de paiement/colocation, calculs fiscaux, profils globaux et politiques RLS réelles ne sont pas certifiés par ce lot. Le SQL local de plafond cloud doit encore être revu, notamment son comportement concurrent ; aucune migration appliquée.

Documentation PropCalc 8d10f99 publiée : CI 34425950581 réussie, dpl_88sEAAGv6qLV51Pf5K3VhN6Zm8Wt Ready. Cinq langues en production : quatre largeurs, code fetch extrait/exécuté, vrai widget chargé et modules britanniques affichés.


## 10 septembre — identité utilisée dans les rapports

Profil local séparé par compte/invité avec clé v2 ; ancienne sauvegarde globale conservée et téléchargeable explicitement. Tous les consommateurs existants du profil (valorisation, DOCX, bail, quittance, syndic, visite, exports) transmettent le compte concerné. Une lecture du profil n’envoie plus la version locale vers les métadonnées cloud. Le profil cloud vide est respecté, et une lecture concurrente n’écrase pas une modification locale.

Sauvegarde de métadonnées liée à un jeton de session capturé et vérifié pour le compte attendu : contrat PUT /auth/v1/user confirmé dans le SDK installé. Réponse HTTP, identité et contenu confirmés avant cache/succès ; vérification du compte courant après la requête. Le téléversement de logo utilise également le jeton capturé dans l’option headers documentée par le SDK installé ; extension dérivée du type MIME accepté plutôt que du nom fourni. Aucune requête réelle de modification de profil ou de logo effectuée pendant l’audit.

Écran de profil recréé au changement de compte, chargements tardifs ignorés, champs verrouillés pendant chargement/écriture, erreurs visibles, anciennes saisies conservées après refus de sauvegarde. Nettoyage de sa clé v2 ajouté à la suppression de compte. Les mises en page PDF/DOCX n’ont pas été modifiées ni recertifiées ; seul le choix du profil est modifié. Les autres paramètres utilisateur/exports globaux restent à revoir séparément.

Validation : 16 nouveaux tests, suite 1 558 tests / 145 fichiers réussie ; lint sans avertissement, compilation réussie. Fixture cinq langues : lecture refusée, champs bloqués tant que non chargés, changement de compte, fin de requête tardive, refus d’enregistrement sans faux succès, saisies préservées. Parcours publics profil/valorisation/nouveau lot cinq langues/quatre largeurs sans débordement ni erreur de page.

Lots locatifs 6bef222 publiés : CI 34426893810 réussie, dpl_6ED6hwmvt6hcNFXtuVVRyC4GG2Te Ready. Portefeuille/nouveau lot en production cinq langues/quatre largeurs sans erreur. Les essais d’écritures restent simulés.


## 10 septembre — indications métier du portefeuille locatif

Classe énergétique : prise en charge A+ à I (et NC). Le repère E à I devient une priorité de vérification de rénovation, sans attribution d’éligibilité ou de montant Klimabonus. Suppression des messages « 65 % + prime CO₂ » et de la promesse de hausse de valeur. Messages traduits et liens vers les conditions officielles. Source Energiepass : https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html ; conditions rénovation 2026 : https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement-conseil-energie.html (âge, caractéristiques des travaux, calendrier et accord préalable sont distincts de la classe).

Retrait du « net approximatif = brut − 1,5 point », faute de dépenses réelles : net non calculé. Brut potentiel du lot et brut du portefeuille occupé restent distingués. Aucune conformité affirmée lorsque les données du plafond sont incomplètes. Le paramètre legacy tauxVetusteAnnuel reste transmis pour compatibilité du type ; le moteur partagé applique ses propres règles et n’est pas modifié ici.

FAQ/texte SEO du hub dans cinq langues : retrait des affirmations de rendement maximal de 5 % du prix d’achat, vétusté forfaitaire libre de 1 %, supplément meublé automatique de 10 %, absence de toute transmission en ligne. La base du rendement et celle du plafond légal sont distinguées ; données manquantes et parcours de vérification explicités. Le fonctionnement cloud/local décrit correspond au nouveau stockage par compte. Références : https://logement.public.lu/fr/proprietaire/logement-location/faq-bail-a-loyer.html et https://guichet.public.lu/fr/citoyens/logement/location/contrat-litige/conclure-contrat-bail-location.html . Ce lot ne certifie pas tous les contrats/baux générés ni les autres pages fiscales.

Validation : 1 561 tests / 145 fichiers réussis, dont trois cas supplémentaires A+/H/I et assertions métier actualisées. Lint propre ; compilation finale réussie après maintien du paramètre legacy requis. Fixture cinq langues avec véritables analyzeLot/summarize/InputField : priorité de rénovation, absence de faux net et de droit aux aides, options A+/H/I, source officielle. Hub public local cinq langues/quatre largeurs, sections/FAQ révisées et liens officiels vérifiés.

Profil ef18a54 publié : CI 34427678853 réussie, dpl_DRNriAYhrEwSQnYSxmAvtgdhwnkb Ready. Parcours production profil/valorisation/nouveau lot cinq langues/quatre largeurs réussi.


## 10 septembre — évaluations sauvegardées séparées par compte

Stockage v2 explicite par compte/invité, archive et corbeille regroupées en une écriture locale atomique. Anciennes données globales préservées et téléchargeables sans attribution automatique au compte connecté. Validation des données, montants finis, capacité explicite ; aucun écrasement silencieux d’une archive corrompue. Suppression de la synchronisation automatique des archives non attribuées à la connexion.

Écritures cloud attendues et confirmées, propriétaire vérifié avant/après, lecture paginée complète ou erreur explicite. Une lecture cloud vide est respectée ; les copies locales disparues du cloud passent en récupération locale. Sauvegarde après résultat ambigu réutilisant le même identifiant, restauration conservant la date et l’identifiant. Erreurs de cache affichées, aucune réussite simulée. Les tests de mutations sont isolés : aucune archive client modifiée pendant l’audit ; politiques RLS et quota concurrent en production non certifiés.

Tous les outils appelants transmettent le compte et attendent la sauvegarde. Bouton verrouillé pendant la requête, succès seulement après confirmation, état tardif ignoré après changement de compte. Mes évaluations, comparaison, tableau de bord et évaluations du portefeuille isolent leurs lectures ; exports refusés si lecture cloud incomplète. Détail des données sauvegardées accessible, zéro et montants négatifs affichables, lien vers l’outil localisé. Les biens saisis manuellement dans /portfolio restent un lot distinct à corriger.

Validation métier/stockage : 1 569 tests / 145 fichiers réussis, dont 25 tests locaux/cloud. Fixture interface cinq langues réussie : détails, zéro, refus de suppression, changement de compte, requête tardive, sauvegarde refusée puis confirmée. Compilation et lint réussis avant contrôle final des ajustements mobiles. Le contrôle responsive a révélé des débordements sur achat/location, portefeuille et longs titres des frais d’acquisition ; correction en cours de validation, agrandissement global +10 % conservé.

Lot précédent 105adf9 publié : CI 34428596071 réussie, dpl_8XAU6RAePLBhBNo9sKZXJLpwHnY1 Ready ; hub locatif en production vérifié dans cinq langues et quatre largeurs.

Validation finale du lot évaluations : compilation et lint des ajustements réussis ; 13 routes × 5 langues × 4 largeurs (320/390/768/1440) vérifiées, sans débordement persistant ni erreur JavaScript. Les contrôles attendent le recalcul responsive des graphiques après changement de largeur. Montants achat/location empilés sur petit écran, filtres du portefeuille repliables et césure des longs titres/texte SEO. Publication à suivre.


## 10 septembre — portefeuille manuel, périmètre et scénarios

Suppression des deux biens fictifs préchargés et de leur restauration après suppression totale. Stockage v2 par compte/invité, sans import automatique de l’ancien portefeuille global. Téléchargement de récupération conservant les chaînes brutes, même corrompues. Les lectures ne réécrivent plus le cache ; une écriture est validée et confirmée avant changement visible. Erreur de quota, valeurs négatives/non finies, données corrompues et doublons d’identifiant refusés. Clé v2 ajoutée au nettoyage local de suppression de compte ; aucun compte réel supprimé.

Seules estimation/valorisation/capitalisation/DCF peuvent contribuer aux montants des évaluations immobilières ; frais, loyers, aides, taxes et résultats STR/promoteur sont exclus. Surface reconnue selon les champs réellement sauvegardés. Prix moyen au m² sur les seules lignes avec surface connue. Vue manuelle par défaut ; avertissement explicite : scénarios enregistrés et biens manuels ne sont pas dédupliqués. Graphique montrant chaque évaluation, sans cumul prétendant mesurer une performance patrimoniale. Repère énergétique A+ à I : moyenne simple explicitement non officielle, sans promesse d’aide ou d’obligation de travaux. Retrait des anciens messages EPBD/E-2030/D-2033, rendement de marché, décotes et recommandations fiscales non établies.

Suppression du rendement net forfaitaire (-30 % à l’écran, -15 % dans l’ancien CSV) et du faux rendement sur fonds propres calculé à partir de loyers bruts. Indicateurs non calculés faute de dépenses réelles. Scénario mensuel explicitement illustratif : 5 % vacance, 15 % charges après vacance, intérêt 3,5 %, aucune saisonnalité inventée, aucun remboursement de capital ni impôt ; solde arithmétiquement égal aux recettes moins charges et intérêts. L’ancien tableau de charges reste un scénario distinct, avec toutes ses hypothèses affichées et sans statut sain/risqué ou valeur fiscale.

Ancien export fiscal supprimé : il inventait intérêts, PNO, taxe, gestion, amortissement de 2 % de la valeur, exercice et instructions de report. Remplacé par lien officiel ACD. CSV limité aux biens manuels et ratios bruts, champs entièrement échappés et texte neutralisé contre les formules de tableur. PDF limité à la vue des biens manuels, bouton nommé en conséquence ; verrou de génération, erreur visible et téléchargement tardif ignoré après changement de compte. Aucune mise en page PDF modifiée ni recertification du document dans ce lot.

Sources consultées : https://impotsdirects.public.lu/fr/az/l/logem_loc.html et https://guichet.public.lu/fr/citoyens/fiscalite/immobilier/location/declarer-revenu-location.html . L’imposition locative nécessite recettes, dépenses et règles d’amortissement applicables ; la base amortissable n’est pas une simple valeur de marché terrain compris. Le lot n’implémente pas une déclaration fiscale complète.

Validation : 1 589 tests / 146 fichiers réussis, dont 20 nouveaux cas (isolation, vide persistant, corruption/quota, typage des résultats, surface, CSV et arithmétique du scénario). Fixture cinq langues réussie : aucun bien fictif, dernier bien supprimé reste absent après rechargement, changement de compte, erreur de quota et corruption préservées, frais exclus, PDF réservé aux biens manuels. Compilation initiale réussie ; compilation finale et parcours responsive en cours.

Lot évaluations d9299e6 publié : CI 34430671783 réussie, dpl_GgrMDPo1c3Nj2Kbn1WVqvBjyLzPC Ready. Contrôle production de 13 routes × 5 langues × 4 largeurs réussi, sans débordement persistant ni erreur JavaScript (valuation-storage-public-prod.log).

Validation finale portefeuille : compilation réussie ; parcours public cinq langues et quatre largeurs réussi avec un bien synthétique stocké uniquement dans un contexte navigateur de test. CSV réellement téléchargé et vérifié. Rendu visuel ordinateur et mobile inspecté ; tableaux gardés en défilement horizontal, message de net non calculé séparé pour éviter le débordement, en-tête du scénario empilé sur mobile. Aucun envoi de donnée client.


## 10 septembre — accueil Énergie et cohérence des contenus

Les pages détaillées EPBD/CRREM/rénovation utilisaient déjà les composants corrigés ; plusieurs anciens messages erronés sont désormais inutilisés. En revanche l’accueil /energy rendait encore +33 % de prime de valeur, 62,5 % de Klimabonus maximal, un coût d’isolation générique, les classes E-2030/D-2033 pour tout logement et des statistiques non établies. Ces affirmations sont supprimées de l’accueil et de ses cinq FAQ dans les cinq langues.

Descriptions des cartes alignées sur les outils réellement disponibles : hypothèses de valeur saisies, VAN/TRI avec devis et aides confirmées, partage énergétique simulé sans certification réglementaire. CPE résidentiel A+ à I, distinction performance/isolation et professionnel habilité. EPBD : distinction trajectoire résidentielle nationale et seuils non résidentiels, sans attribution d’obligation à un bâtiment sur sa seule classe. Klimabonus rénovation sur conseil : conseil et accord de principe avant les travaux, conditions/dates à vérifier ; aucune subvention forfaitaire automatique. Trois liens officiels remplacent les chiffres généraux. Titres et descriptions metadata désormais localisés, sans le décompte erroné de huit outils (neuf cartes).

Sources consultées le 10 septembre : https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings/energy-performance-buildings-directive_en ; https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement-conseil-energie.html ; https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html . Ce lot ne certifie pas la transposition nationale exhaustive de l’EPBD ni l’éligibilité d’un projet individuel.

Validation : lint sans avertissement, compilation réussie ; page publique cinq langues/quatre largeurs, cinq réponses FAQ et JSON-LD, trois sources, neuf liens localisés, titres HTML/OpenGraph vérifiés. Aucun moteur de calcul modifié dans ce lot ; suite précédente de 1 589 tests / 146 fichiers réussie.

Portefeuille manuel dc04dcf publié : CI 34431987740 réussie, dpl_CGnxWsNt7KWts9SPQfJkDsRwTk7v Ready ; contrôle production cinq langues/quatre largeurs et téléchargement CSV réussi (manual-portfolio-public-prod.log), avec données synthétiques uniquement dans le navigateur de test.


## 10 septembre — registre locatif et quittances

Correction de la correspondance entre identifiant local du lot et clé primaire cloud : toutes les opérations de paiement et la création du lien locataire résolvent désormais le lot du propriétaire connecté. Lectures paginées complètes, validation des lignes/montants/périodes, refus des réponses partielles, identité vérifiée avant et après requêtes. Création d'un mois sans écraser un mois existant ; modification limitée aux montants, contrôle de version, confirmation explicite des écritures et suppressions. Les lignes payées, annulées ou déjà quittancées ne sont plus modifiables/supprimables dans cet écran. La génération annuelle compte les lignes effectivement créées. Un échec de lecture des paiements fait échouer la sauvegarde au lieu d'omettre les données.

Totaux fondés sur les échéances réellement enregistrées, hors annulations, calculés en centimes. Aucun montant annuel inventé à partir du loyer actuel. Le solde reste indéterminé en présence d'un paiement partiel dont le montant n'est pas enregistré. Le graphique représente les périodes de loyer, pas des encaissements bancaires annuels ; suppression du seuil arbitraire de ponctualité. Déclaration manuelle du paiement aujourd'hui, date Luxembourg, sans mode de règlement inventé. Contrôles verrouillés pendant les actions, erreurs et reprise explicites, réponses d'un ancien compte ignorées. Formulaire mobile sans débordement, agrandissement global conservé.

Quittance française : relecture du paiement avant génération, parties nommées et montants cohérents requis. Suppression de l'affirmation de conformité à l'article 25 de la loi du 21 septembre 2006, qui n'établit pas cette conformité. Mention de déclaration à vérifier et signer, sans certification juridique ni validation bancaire. Mise en page corrigée pour noms/adresses longs, signature et pied de page lisibles ; deux PDF synthétiques (une et deux pages) rendus et inspectés visuellement. Libellé FR explicite dans les cinq langues.

Validation : 1 613 tests / 147 fichiers réussis, dont 24 nouveaux cas du registre ; lint sans avertissement ; compilation réussie. Scénarios UI isolés cinq langues (échec d'écriture, verrouillage, changement de compte, réponses tardives), et CSS compilé sur quatre largeurs de 320 à 1440 px. Aucune écriture sur paiements réels, aucun lien locataire réel créé, aucune quittance client transmise.

Limites : politiques RLS, clés étrangères et triggers de production non certifiés sans accès administrateur. La migration locale 016 ne vérifie pas dans sa politique l'appartenance du lot : les contrôles applicatifs ne remplacent pas une protection SQL contre des appels REST directs. Les autres fonctions du portail locataire restent à examiner. Aucun rapprochement bancaire, montant partiel détaillé, archivage probant ou conformité PDF/A de ces quittances n'est annoncé.

Accueil Énergie cb7438b publié : CI 34432494891 réussie, dpl_J185h9Qjh4fFosJud4Av65bnANBP Ready ; contrôle de production cinq langues/quatre largeurs réussi.


## 10 septembre — portail locataire : solde, historique et erreurs

Réponse RPC validée avant affichage : montants numériques normalisés en centimes, total loyer + charges, statuts, périodes et dates contrôlés ; doublons/refus de données incomplètes au lieu d'un solde zéro trompeur. Paiement partiel sans montant connu : solde indéterminé. Annulations et paiements soldés exclus des échéances en attente. Le solde concerne uniquement les lignes affichées ; les 24 dernières échéances ne sont plus présentées comme 24 mois consécutifs ou comme l'intégralité de la dette.

Un problème réseau/service est désormais distinct d'un lien révoqué ou expiré, avec réessai. Changement de jeton : ancien contenu démonté et réponses tardives ignorées. Tableau horizontal consultable sur petit écran. Suppression de la certification RGPD/bail non établie ; la date d'émission enregistrée n'est plus présentée comme une quittance signée accessible. Métadonnée no-referrer ajoutée, noindex maintenu. Aucun jeton réel utilisé : validation locale sur données synthétiques et contrôle public de jetons malformés qui ne déclenchent pas de RPC.

Validation : 1 629 tests / 148 fichiers réussis, dont 16 nouveaux ; lint et compilation réussis. UI cinq langues/quatre largeurs, changement de jeton, réponse tardive, panne, reprise et lien invalide vérifiés.

Limite SQL importante : la migration locale 026 autorise une création de jeton selon owner_id sans vérifier le propriétaire du lot, et sa fonction SECURITY DEFINER ne recoupe pas cette propriété. Le correctif applicatif de création ne suffit pas contre des appels REST directs. Les politiques/fonctions effectives de production restent non vérifiables sans accès SQL administrateur. Aucune certification de sécurité de la base ni de complétude de l'historique n'est faite. Les fonctions inutilisées listTenantTokens/revokeTenantToken et l'assistant restent hors de ce lot.

Registre locatif 3aec2d2 publié : CI 34434288822 réussie, dpl_8V3dfNPk7cPVTN1n4BZqfQMyprdp Ready, contrôle public de production cinq langues/quatre largeurs réussi (rental-ledger-public-prod.log).


## 10 septembre — correctif SQL de propriété préparé et testé, NON appliqué

Ajout de la migration 064_rental_portal_ownership.sql et du test scripts/test-rental-portal-sql.cjs. Dans PostgreSQL PGlite 0.5.8 en mémoire, les migrations historiques 001/006/016/026 reproduisent effectivement l'accès à un lot tiers par jeton de propriétaire incohérent. Après 064 : accès croisés bloqués par politiques restrictives, contrôle de propriété dans la RPC, paiements filtrés par propriétaire, search_path fixé et droits EXECUTE ciblés. Écritures légitimes conservées, jetons incohérents/révoqués/expirés refusés, tri et limite 24 maintenus, migration réexécutable sans suppression de données. Test supplémentaire avec politiques permissives larges pour vérifier qu'elles ne contournent pas les restrictions.

La migration n'est PAS appliquée à Supabase production : accès administrateur indisponible, et le déploiement Vercel ne lance pas les migrations. Procédure et limites dans docs/RENTAL-PORTAL-SQL-064.md. Aucun jeton réel ni compte client utilisé pour ces tests. La reproduction locale ne démontre pas que les politiques historiques sont actives en production.

Portail locataire ac06483 publié : CI 34434739685 réussie, dpl_2dTz9B4n7aM733VNQrC1bEaNAy9U Ready ; QA production cinq langues/quatre largeurs, lien malformé sans RPC, noindex/no-referrer réussie (tenant-portal-public-prod.log). Suite applicative 1 629 tests / 148 fichiers inchangée pour ce lot SQL/documentation.


## 10 septembre — colocation : identité, parts et arrondis

CRUD colocataires lié au propriétaire et à la clé primaire cloud du lot, lectures paginées jusqu'à fin explicite, réponses contrôlées, versions et confirmation des modifications/suppressions. Création avec identifiant stable de formulaire pour éviter un doublon lors d'une réponse ambiguë. Dates, parts et garanties validées. Les saisies de parts sont désormais des brouillons avec bouton d'enregistrement individuel ; suppression des écritures à chaque frappe. La préparation automatique ne modifie plus le cloud par une série d'écritures susceptibles de s'arrêter à mi-chemin.

Répartition : seuls les actifs comptent pour les 100 %. Les parts historiques des occupants partis/en attente sont préservées sans diminuer le reliquat. Les actifs à zéro reçoivent des centièmes de pourcentage totalisant exactement le reliquat ; dépassement ou absence de bénéficiaire du reliquat refusés. Montants nominaux calculés seulement pour une répartition enregistrée complète, avec distribution des centimes restants conservant le total exact. Garanties affichées = montants déclarés des actifs, sans prétendre suivre les versements/remboursements ou certifier un plafond réglementaire. Suppression des références d'articles non vérifiées ; lien Guichet et distinction entre répartition interne et obligations envers le bailleur. Source consultée : https://guichet.public.lu/fr/citoyens/logement/location/contrat-litige/conclure-contrat-bail-location.html .

UI : actions verrouillées, erreurs récupérables, données/saisies préservées après échec, réponses tardives d'un ancien compte ignorées. KPI empilés sur mobile, tableau défilant. Validation : 1 646 tests / 149 fichiers réussis, dont 17 nouveaux cas ; lint sans avertissement, compilation réussie, UI isolée cinq langues/quatre largeurs (brouillons sans écriture, préparation, erreur, confirmation, somme exacte et changement de compte).

Migration 065_cotenant_lot_ownership.sql préparée : politique restrictive pour l'appartenance du lot, test PostgreSQL PGlite en mémoire étendu et réussi. Comme 064, NON appliquée en production faute d'accès SQL administrateur. Aucun colocataire réel modifié ni contrat signé ; les contrôles applicatifs ne certifient pas les politiques effectives de production.

Lot SQL/documentation bc96f7a poussé, CI34435011694 réussie, Vercel dpl_4cdkEdVWrcrzJXXXmF31wCBMM11R Ready ; cela ne signifie pas que la migration 064 a été exécutée.


## 10 septembre — présentation publique du portail locataire

Accueil /locataire dans cinq langues aligné sur le portail réel : informations du logement, échéances et statuts déclarés, historique borné. Suppression des promesses non réalisées : quittances signées téléchargeables, états des lieux avec photos, justificatifs de charges, gestion des mouvements de garantie, assistant de dossier, envoi automatique de mail, durée automatique égale au bail et maintien 12 mois après départ. Le jeton est généré sur 24 octets, pas 256 bits comme annoncé ; le chiffre promotionnel est supprimé au profit d'une indication claire qu'un détenteur du lien peut lire les données partagées.

CTA désormais vers les instructions de demande au bailleur, au lieu d'un mail au support présenté comme une demande de lien personnel. Métadonnées publiques/privées localisées et cohérentes, noindex/no-referrer privés maintenus. Retour à la ligne des titres longs dans le composant de présentation partagé. Aucun moteur de calcul modifié ; dernière suite 1 646 tests / 149 fichiers réussie.

Colocation dbb10a6 publiée : CI34435564791 réussie, dpl_JMTcq5aQhDUabQvD5WnLcsQeAU32 Ready ; contrôle public production cinq langues/quatre largeurs réussi (cotenants-public-prod.log). Migrations SQL 064/065 toujours non appliquées en production.


## 10 septembre — assurance impayés : devis saisis et affichage des centimes

Suppression du catalogue de cinq offres chiffrées sans source, du classement « meilleure valeur », des coefficients de risque arbitraires et de la recommandation IA construite sur ces chiffres. La page Foyer consultée annonce jusqu'à 12 mois, contrairement aux 30 mois codés auparavant ; aucun tarif complet comparable n'a été établi pour les offres fictivement comparées. Cette correction n'affirme pas que ces assureurs ne proposent pas de garantie : deux liens officiels sont conservés comme références non exhaustives, sans classement.

L'outil compare désormais trois devis personnels A/B/C : prime annuelle totale réellement saisie pour le même ensemble de lots, équivalent mensuel et ratio de coût par rapport à la base annuelle déclarée. Sans devis, résultat non calculé ; zéro explicite conservé. La quantité multiplie uniquement la base locative, jamais une prime déjà donnée pour tout le portefeuille. Arrondi d'affichage seulement pour l'équivalent mensuel ; aucune indemnisation, éligibilité ou valeur de couverture calculée. Conditions à comparer : périmètre, plafonds, franchise, carence, exclusions et déclaration de sinistre. Suppression de l'ancien texte de caution trois mois et de la promesse de déductibilité fiscale forfaitaire.

Sources consultées le 10 septembre 2026 : https://www.foyer.lu/fr/particuliers/habitation-quotidien/assurance-loyer-impaye/ et https://www.baloise.lu/fr/particuliers/mon-assurance-luxembourg/assurance-habitation/assurance-habitation-home.html . Aucun assureur contacté ni devis demandé/transmis.

Correction complémentaire d'affichage : le format monétaire global arrondissait à l'euro. Paiements/quittances à l'écran, colocation, portail locataire et comparateur assurance affichent maintenant deux décimales selon la langue. Les tests UI de ces trois écrans locatifs ont été relancés avec le format réel, au lieu du formateur simulé utilisé dans les premiers essais ; cinq langues réussies, sans perte des centimes. Les PDF de quittance comportaient déjà deux décimales et ne sont pas modifiés.

Suite complète : 1 660 tests / 150 fichiers réussis, dont 14 nouveaux cas sur le budget d'assurance. Lint sans avertissement. Validation finale de compilation/affichage public consignée au déploiement.

Présentation locataire 55cc640 publiée : CI34436264220 réussie, dpl_G7T5QeV4xkSWNPHGhrTDtbHZ9JnW Ready ; contrôle production cinq langues/quatre largeurs, quatre fonctions, cinq FAQ, ancre d'accès et métadonnées privées localisées réussi (tenant-landing-public-prod.log). Les alias de page ont été corrigés pour exporter generateMetadata.


## 10 septembre — préparation fiscale locative

Suppression de l'assurance fictive de 450 euros par lot, du plancher zéro qui effaçait les déficits, de l'addition automatique de toutes les provisions aux recettes imposables et de l'affectation automatique au seul mois de loyer. L'ACD décrit le rattachement à la perception avec une exception pour les recettes périodiques proches du changement d'année, le traitement des avances sur frais et la distinction entretien/investissement. Le relevé applicatif utilise la date de paiement déclarée, signale les années différentes et paiements partiels sans montant ; il n'effectue pas cette qualification fiscale à la place du déclarant.

Nouvelle feuille préparatoire aux frais réels pour patrimoine privé : recettes fiscalement retenues et sept catégories de frais à renseigner explicitement, zéro seulement après saisie/action explicite. Amortissement déterminé séparément, aucun taux automatique ou forfait de frais de gestion. Calcul en centimes et résultats négatifs conservés ; total incomplet dès qu'un lot a une rubrique vide/invalide. Aucun impôt, régime forfaitaire, société, exonération ou gestion locative sociale calculé. Suppression de l'import OCR classant automatiquement des travaux en entretien et de la recommandation IA alimentée par des références/formulaires/forfaits non établis.

Sources consultées : https://impotsdirects.public.lu/fr/az/l/logem_loc.html ; https://guichet.public.lu/fr/citoyens/fiscalite/immobilier/location/declarer-revenu-location.html . Liens officiels visibles dans la feuille.

Données : chargement complet par compte via helpers lots/paiements déjà contrôlés, trois lectures concurrentes maximum, aucun résultat partiel après échec ; réponses tardives ignorées. Brouillons distincts par année dans la session du compte, sans stockage cloud annoncé. Téléchargement JSON pour conserver la saisie et le relevé source ; aucun dépôt fiscal transmis. Métadonnées localisées/noindex dans les cinq langues et suppression du titre caché dupliqué.

Validation : 1 676 tests / 151 fichiers réussis, dont 16 nouveaux ; lint et compilation réussis. UI isolée cinq langues/quatre largeurs : rubriques vides, déficit exact, changement d'année/compte, export JSON réel, avertissements paiements partiels/changement d'année, panne et réessai. L'accès public est contrôlé séparément sans utiliser de données fiscales réelles.

Assurance/centimes 6848618 publié : CI34436670520 réussie, dpl_FvjNaPfsN16pSP6wRubfWgW2BmXJ Ready ; QA production cinq langues/quatre largeurs avec devis synthétiques réussi (insurance-budget-public-prod.log). Aucun devis assureur envoyé.


## 10 septembre — gestion locative sociale, exonération datée

L'ancien calcul utilisait 75 % pour toutes les années, sur deux loyers supposés identiques, avec une économie présentée comme un gain général. Correction des millésimes vérifiés par l'ACD : 50 % de 2017 à 2022, 75 % en 2023, 90 % depuis 2024 (jusqu'à 2026 dans l'outil) sur les revenus nets éligibles. Années hors de ce périmètre refusées. Confirmation de l'éligibilité via organisme conventionné avant toute estimation d'avantage.

Saisies désormais distinctes pour loyers et frais annuels des scénarios classique/social, aucune hypothèse préremplie. Comparaison des revenus nets après impôt approximé au taux marginal saisi, sans confondre économie d'impôt et gain total. L'écart peut être négatif lorsque le loyer social est inférieur. Les déficits restent visibles et leur traitement fiscal n'est pas inventé. Le taux constant n'est pas un calcul complet d'IR (barème, autres revenus, famille) ni de trésorerie.

Suppression de la référence erronée à L.162bis, des économies typiques 40–60 %, de la réduction de loyer universelle 10–15 %, de l'exclusion automatique des classes F/G et du contrat minimal universel de trois ans. Liste de contacts/partenaires potentiellement obsolète remplacée par le répertoire ministériel, sans se présenter comme partenaire commercial. Sources consultées : https://impotsdirects.public.lu/fr/az/l/logem_loc.html ; https://logement.public.lu/fr/proprietaire/logement-location/gestion-locative-sociale.html .

Validation : 1 695 tests / 152 fichiers réussis, dont 19 nouveaux sur millésimes, base nette, éligibilité, revenus différents, pertes, centimes et données invalides. Lint sans avertissement. Compilation et contrôles publics finaux consignés au déploiement.

Préparation fiscale 75e6579 publiée : CI34437444961 réussie, dpl_2MsMJCfnSggf9HJdPUGrLFTky8RK Ready ; QA publique production cinq langues/quatre largeurs, métadonnées localisées/noindex et accès authentifié requis réussie (rental-fiscal-public-prod.log).


## État des lieux : constat incomplet visible et PDF à signer — 10 septembre 2026

- Suppression de la promesse de conformité automatique et de la référence erronée à l’article 9. Texte vérifié sur Guichet.lu : entrée obligatoire si garantie locative, document écrit/précis/contradictoire/daté/signé ; sortie généralement recommandée et usure normale distincte des dégâts imputables. Source : https://guichet.public.lu/fr/citoyens/logement/location/contrat-litige/etat-lieux-bail-loyer.html (page actualisée le 19 juin 2025, consultée le 10 septembre 2026).
- Date et nombre de clés initialement inconnus, aucune valeur de deux clés inventée. Date réelle, adresse et parties obligatoires pour l’export ; clés facultatives mais entières entre 0 et 999. Zéro explicite conservé. Relevés vides libellés « non renseigné » avec unités dans le PDF.
- Les 37 points de la liste restent exportés, même sans évaluation. Ajout de « non applicable / absent » et retour à « non évalué ». Une observation seule ne devient pas une évaluation. Le pourcentage porte sur cette liste indicative, sans certifier l’inspection complète du bien ; autres pièces/réserves à détailler dans les observations générales.
- Projet PDF explicitement non signé, à relire ensemble et signer. Pas de signature électronique, horodatage probant, photographie jointe ni archivage certifié promis. Saisie temporaire sans sauvegarde automatique annoncée.
- Export protégé contre les doubles clics, erreurs de génération et achèvement après départ de la page. Saisies conservées sur erreur ; formulaire gelé pendant génération ; lien de retour et métadonnées localisés dans les cinq langues.
- Modèle PDF extrait dans RentalInspectionPdf. Paragraphes longs paginables, titres attachés au premier élément, signatures conservées ensemble, pied et numéros sur chaque page. Le contrôle visuel a détecté un problème d’héritage de hauteur de ligne du moteur PDF, corrigé ; vérification géométrique de tout texte dans la feuille ajoutée au contrôle des documents.
- Validation : 1 711 tests / 153 fichiers, lint et build de production ; 10 PDF synthétiques dans les cinq langues (courts 2 pages, longs 5 pages), 35 pages rendues et inspectées, vérification des fins d’observations, des états inconnus et des numéros. Parcours public cinq langues / quatre largeurs, validations des champs, remise à zéro d’un état et téléchargement réel du PDF. Aucune donnée d’un client utilisée ou modifiée.

La revue globale Tevaxia reste en cours. Les migrations de sécurité Supabase 064/065 sont préparées/testées localement, mais non appliquées en production faute d’accès administrateur.


## Suppression de compte : identité confirmée et caches attribués — 10 septembre 2026

- L’ancien appel SDK choisissait la session courante au moment de l’exécution ; la confirmation pouvait persister après un changement de compte. Formulaire désormais remonté par identifiant, compte concerné affiché, confirmation effacée après échec, double soumission et saisies pendant l’opération bloquées.
- Capture du jeton, vérification de son utilisateur par getUser(jeton), relecture de la session et de la présence du formulaire avant envoi. POST vers delete_my_account avec Authorization explicitement lié au jeton vérifié. Une réponse tardive ne peut pas transformer la requête en suppression du nouvel utilisateur. Aucun nouvel essai automatique après une réponse ambiguë.
- Après réponse HTTP réussie seulement, retrait des cinq caches attribués au compte : profil, évaluations/corbeille v2, lots, portefeuille manuel et brouillon de facture. Aucune purge globale des données invitées, anciennes non attribuées ou d’un autre compte. Échec serveur/réseau : copies locales conservées ; échec de nettoyage local distinct d’un échec de suppression serveur.
- Aucun appel SDK signOut dans ce parcours : ce dernier relit la session après acquisition de son verrou et pouvait déconnecter un compte plus récent. AuthProvider masque uniquement l’identité supprimée, ignore ses notifications d’authentification tardives et conserve une nouvelle identité. Marqueur local minimal par identifiant, notification dans la page et propagation entre onglets de même origine ; aucune suppression du cookie partagé d’une autre session.
- Limite explicite : ce marqueur est un contrôle d’affichage, pas une révocation cryptographique des JWT. Les cookies/jetons restants dépendent du service d’authentification et de leur expiration. Le contrôle serveur de delete_my_account, les cascades effectives, fichiers stockés et données d’autres services restent à auditer avec l’accès administrateur Supabase. L’ancien texte promettant l’effacement exhaustif et automatique de toutes les données a été retiré.
- Validation : 1 726 tests / 154 fichiers, dont 15 cas de suppression simulée et de session ; lint/build ; vrai AuthProvider, formulaire et service dans une fixture isolée avec authentification et serveur fictifs, cinq langues/quatre largeurs. Scénarios : changement de compte avant requête, changement pendant requête, erreur serveur, caches d’un autre compte préservés, aucun signOut, événements tardifs et rechargement après suppression confirmée. Contrôle public anonyme accueil/profil/connexion. Aucun compte réel ni donnée réelle supprimé.

La revue globale reste en cours ; les migrations Supabase 064/065 ne sont toujours pas appliquées en production faute d’accès administrateur.


## Cookies : choix révocable et arrêt des mesures — 10 septembre 2026

- Ajout d’un bouton permanent « Réglages des cookies » en pied de page, dans les cinq langues, pour revenir sur un accord ou un refus. Le bandeau nomme Google Analytics et PostHog et ne mélange plus cookies, synchronisation des calculs et durée de conservation cloud.
- Source unique du choix de ce navigateur : seules les valeurs explicites granted/denied sont reconnues. Stockage indisponible : choix appliqué à la page, avertissement de non-mémorisation, aucun plantage. Synchronisation des changements entre onglets de même origine ; aucune autorisation publicitaire accordée.
- Retrait : ga-disable activé immédiatement, Google Consent Mode mis à jour, cookies _ga/_ga_* accessibles retirés sans toucher aux cookies de connexion. Contrôle à la fin du téléchargement gtag pour ne pas configurer la mesure après un retrait intervenu pendant le chargement.
- PostHog : contrôle de l’accord après l’import différé, opt-out de capture/persistance, réactivation seulement sur nouvel accord, opt-out par défaut avant initialisation, filtre before_send. Les erreurs de chargement analytique ne bloquent pas l’application.
- Sources techniques : https://developers.google.com/tag-platform/security/guides/privacy?hl=fr ; API et types du SDK posthog-js effectivement installé, documentation https://posthog.com/docs/libraries/js/usage. Ce lot ne constitue pas une certification générale RGPD ni une revue complète du contenu de tous les événements analytiques.
- Validation : 1 739 tests / 155 fichiers ; lint et build ; composants réels dans fixture isolée, cinq langues/quatre largeurs, scripts suspendus pendant retrait, réacceptation, arrêt après initialisation, synchronisation entre onglets, cookie de connexion préservé et stockage bloqué. Vérification supplémentaire avec le SDK PostHog réellement installé : opt-in/opt-out, nouvel événement refusé, persistance analytique retirée ; toutes les requêtes de télémétrie interceptées. Contrôle du bandeau réel sur le build local puis production, télémétrie interceptée pour ne pas alimenter les statistiques réelles avec les essais.

À poursuivre : préférences du profil (ancien champ consent_analytics non relié à ce choix navigateur, anciennes autorisations de partage non reliées à un traitement identifié, sauvegardes non confirmées) ; revue des URL et métadonnées pouvant être incluses dans les événements analytiques, notamment routes privées. La revue globale reste en cours.


## Préférences du profil : sauvegarde confirmée et accords anciens — 10 septembre 2026

- L’ancien composant ignorait les erreurs de lecture et d’upsert, affichait « Enregistré » même après refus, et conservait son état lors d’un changement d’utilisateur. Formulaire maintenant isolé par compte, lecture obligatoire avant modification, erreur/rechargement explicites, saisies préservées sur erreur et retour tardif ignoré.
- Service notification-preferences : jeton capturé et utilisateur vérifié, filtre de propriétaire, validation stricte des booléens et de la ligne retournée. PATCH avec version et anciennes valeurs, confirmation d’une unique ligne aux valeurs demandées. Création d’une ligne absente par INSERT, sans upsert global susceptible d’écraser les paramètres d’un autre composant. Les champs de profil professionnel, thème et langue ne sont pas écrits.
- Suppression des trois cases demandant de nouveaux accords génériques, dont le faux lien avec des partenaires institutionnels et la promesse de données « jamais personnelles ». Les accords déjà enregistrés restent visibles et peuvent être retirés explicitement à la prochaine sauvegarde ; aucune nouvelle autorisation de partage n’est accordée par le formulaire.
- Réglage des cookies accessible séparément, via le vrai bandeau du navigateur. Aucune prétention que l’ancien champ de compte consent_analytics contrôle Google Analytics/PostHog. Les préférences de notification sont présentées comme des choix enregistrés pour les fonctions compatibles ; elles ne garantissent ni service d’envoi actif ni calendrier automatique.
- Validation : 1 758 tests / 156 fichiers, dont 19 cas de lecture stricte, absence confirmée, réponse étrangère, erreurs, conflits, valeurs non confirmées, retrait des accords, création sans upsert et changement de compte. Lint/build ; fixture avec vrais composants AuthProvider/formulaire/service, serveur simulé, cinq langues/quatre largeurs, échecs puis reprise, modification conservée, requête suspendue et changement de compte, accès au bandeau réel. Contrôle public anonyme du profil dans les cinq langues. Sonde du schéma public user_preferences avec limit=0 : HTTP 200, zéro ligne ; aucune préférence réelle lue ou modifiée.

La revue globale reste en cours. Les contrôles des droits/cascades SQL effectifs en production nécessitent toujours l’accès administrateur Supabase manquant ; les migrations 064/065 restent non appliquées.


## 10 septembre 2026 — PropCalc : droits de mutation résidentiels français

Les quinze départements proposés sont recalés sur le tableau DGFiP du 1er juin 2026 : taux départemental 5 %, taxe communale 1,20 %, prélèvement 2,37 % du droit départemental, soit 6,3185 %. L'ancien 5,81 %/6,2 % sous-estimait les droits. Les deux conditions primo-accession ET résidence principale sont requises pour écarter la hausse sur toute la part acquise : 4,5 % départemental, total 5,80665 %. Le cas d'acquéreurs à éligibilités mixtes et les exonérations locales ne sont pas modélisés. Un département inconnu est refusé ; une localisation absente donne une hypothèse explicitement identifiée, jamais une moyenne nationale. Les API fees/cashflow exposent la date et la portée de cette hypothèse ; la démonstration du site la présente dans ses cinq langues.

Validation : 1779 tests / 157 fichiers réussis, dont 21 contrôles supplémentaires (15 départements, conditions cumulatives, 200 000 EUR → 12 637 EUR de droits / 11 613,30 EUR si éligible, émoluments séparés, refus d'un département inconnu, propagation API). Aucun acte réel ni donnée client modifié. Le barème est un instantané daté, pas un calcul historique ou futur automatique.

Sources : [DGFiP, tableau au 1er juin 2026](https://www.impots.gouv.fr/sites/default/files/media/1_metier/3_partenaire/notaires/dmto/dmto_2026-06.pdf), [BOFiP, régime de droit commun au 17 juin 2026](https://bofip.impots.gouv.fr/bofip/3311-PGP.html/identifiant=BOI-ENR-DMTOI-10-20-20260617), [CGI 1647, prélèvement pour frais d'assiette](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053562192/2026-05-17).

Portée limitée : ce lot corrige les DMTO de droit commun dans l'ancien. La branche neuf (assiette HT/TTC et éligibilité TVA), la garantie de prêt ancienne PPD, les frais de formalités/débours, le livre foncier d'Alsace-Moselle et les autres modèles fiscaux PropCalc restent à traiter ; le total actuel ne vaut pas décompte notarial complet. La revue exhaustive de Tevaxia n'est pas terminée.

Le contrôle mobile de ce lot a également corrigé le titre PropCalc : balise br auparavant affichée en texte brut, responsable du débordement horizontal. Balise riche appariée dans les cinq traductions et retour à la ligne des longs mots ; agrandissement général de 10 % conservé. Compilation finale et lint réussis.

Les anciennes pages autonomes DE/PT/LB ont été remplacées par la page partagée traduite, comme EN : elles ne contenaient pas le simulateur actuel. Les cinq locales bénéficient désormais des mêmes corrections.


## 10 septembre 2026 — PropCalc France : neuf, devis de garantie et périmètre des frais

Le seul indicateur isNew ne déclenche plus les droits réduits. L'API exige frenchVatOnFullPrice pour une vente neuve : false conserve le droit commun, true qualifie une vente neuve soumise à TVA sur le prix total (hors TVA sur marge), avec frenchVatRate explicite 0.055, 0.1 ou 0.2. price représente le prix TTC ; les droits réduits exacts de 0,71498 % portent sur son équivalent HT. Aucune TVA n'est ajoutée deux fois. Les émoluments de vente et la CSI ordinaire restent séparés.

L'ancienne garantie PPD calculée automatiquement à 0,05 % du prêt est supprimée. Le financement ne permet pas de déduire son type ni son coût complet : loanGuaranteeCost reprend uniquement un devis renseigné, avec un prêt, sans faux taux réglementaire. Une absence reste inconnue et un devis explicite nul reste distinct. Le même montant et la couverture des coûts sont propagés à cashflow. Les formalités, débours, actes supplémentaires et frais d'agence restent exclus ; en 67, la publication au livre foncier est signalée hors calcul au lieu d'appliquer la CSI ordinaire. La réponse acquisitionCoverage indique toujours partial pour ce sous-total : aucune affirmation de décompte notarial complet. La démonstration et la documentation développeur rendent ce périmètre visible dans les cinq langues.

Validation : 1793 tests / 158 fichiers réussis, dont 14 nouveaux cas (vente récente sans TVA, qualification manquante, bases HT aux trois taux, types invalides, coût de garantie absent/nul/renseigné, absence de prêt, couverture partielle et propagation cashflow). Exemple 240 000 EUR TTC à 20 % : base HT 200 000 EUR, droits réduits 1 429,96 EUR ; pas 1 716 EUR calculés sur le TTC. Aucune opération client ou acte réel créé.

Sources : [DGFiP, achat dans le neuf](https://www.impots.gouv.fr/particulier/achat-dans-le-neuf), [Notaires de France, assiette HT dans le neuf](https://www.immobilier.notaires.fr/node/953), [CGI 1647, prélèvement de 2,14 % sur le droit réduit](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053562192/2026-05-17), [Service Public, hypothèque légale spéciale depuis 2022](https://www.service-public.gouv.fr/particuliers/vosdroits/F786), [BOFiP, régime local de publicité foncière](https://bofip.impots.gouv.fr/bofip/3311-PGP.html/identifiant=BOI-ENR-DMTOI-10-20-20260617).

Limites conservées : devis notarial requis pour compléter les frais ; régime simplifié, sans qualification juridique automatique, exonérations locales ni coacquéreurs mixtes. Les autres modèles nationaux et fiscaux ne sont pas certifiés par ce lot. La revue globale de Tevaxia reste en cours.


## 10 septembre 2026 — PropCalc : fiscalité locative française 2025/2026

Module français séparé : location nue micro-foncier (30 %, plafond 15 000 EUR) ou réel ordinaire ; meublé longue durée micro-BIC (50 %), tourisme classé (50 %) et nouveau régime non classé (30 %). Minimum micro-BIC de 305 EUR sur les recettes agrégées, sans l'appliquer au micro-foncier. Référence micro-BIC 77 700 EUR pour les revenus 2025 et 83 600 EUR pour 2026, non-classé 15 000 EUR. L'éligibilité n'est pas déduite du seul chiffre de l'année courante : confirmation explicite frenchMicroEligible pour le foyer/l'activité et les conditions antérieures. Le meublé exige la qualification non professionnelle ; recettes touristiques supérieures à 23 000 EUR et cotisations d'activité hors simulation sont refusées.

Prélèvements sociaux distincts : revenus fonciers 17,2 %, meublés régime général 18,6 % dès les revenus 2025 ; option explicite solidarity_only 7,5 % sous condition d'affiliation ouvrant droit, jamais déduite de la nationalité. Impôt au taux marginal : pas de liquidation complète, d'imputation automatique des déficits, de CSG déductible, d'amortissement ou de traité international.

Réparation arithmétique : un résultat économique négatif n'annule plus l'impôt micro sur recettes après abattement. Les recettes modélisées sont réduites de la vacance avant application de l'abattement, et annualTaxReceipts permet des recettes agrégées explicites incluant les charges taxables. Le réel conserve les pertes sans crédit fiscal inventé. Le défaut API français est désormais un scénario nue/réel explicite au lieu d'un micro-foncier présumé éligible. Documentation API et précision du scénario de démonstration dans les cinq langues.

Validation : 1812 tests / 159 fichiers, dont 19 nouveaux cas couvrant les deux années, taux sociaux, trois micro-BIC, minimum 305 EUR, vacance, pertes, seuils et qualification. Aucun revenu client modifié.

Sources : [DGFiP, location meublée et déclaration 2025](https://www.impots.gouv.fr/particulier/location-meublee), [Service Public, revenus de location meublée 2026](https://www.service-public.gouv.fr/particuliers/vosdroits/F32744), [Service Public Entreprendre, conditions de seuils N-1/N-2](https://entreprendre.service-public.gouv.fr/vosdroits/F32353), [DGFiP, prélèvements sociaux locatifs](https://www.impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux), [DGFiP, taux meublé applicable dès les revenus 2025](https://www.impots.gouv.fr/international-particulier/questions/je-suis-non-resident-je-percois-des-revenus-immobiliers-sagit-i), [Service Public, affiliation européenne et solidarité seule](https://www.service-public.gouv.fr/particuliers/vosdroits/F2329).

La revue des autres pays et des autres parcours de Tevaxia reste à poursuivre ; ce lot ne certifie pas l'ensemble des calculs fiscaux ni le moteur de projection de trésorerie.


## 10 septembre 2026 — PropCalc UK : territoires, majorations et démonstration

Correction du code gb inexistant dans la démonstration : uk correspond maintenant au moteur réellement chargé. Le scénario britannique de la démonstration est explicitement limité à un achat résidentiel supplémentaire en Angleterre/Irlande du Nord par un particulier résident au sens SDLT, sans avantage primo-accédant. Les API et la documentation distinguent ENG/NIR (SDLT), SCT (LBTT) et WLS (LTT), avec refus d'un territoire inconnu et défaut ENG identifié.

La majoration ne découle plus de !isPrimary : ukAdditionalProperty confirme séparément la situation, permettant notamment une résidence principale encore soumise au taux majoré ou un premier investissement qui ne l'est pas. ukNonResident ajoute les 2 points SDLT seulement en ENG/NIR. Minimum 40 000 GBP pour les majorations, règles ordinaires au-dessous. Avantage primo-accédant seulement avec usage principal, tous les acquéreurs qualifiés et sans scénario supplémentaire ; plafond ENG/NIR 500 000 GBP, seuil écossais 175 000 GBP et aucun avantage gallois spécifique. Le pays de Galles utilise ses tranches majorées propres (5/8,5/10/12,5/15/17 %), et non un supplément uniforme sur les tranches ordinaires. ADS écossais 8 %.

Suppression des 1 500 GBP de solicitor, 300 GBP de registre et 500 GBP de survey inventés par défaut : acquisitionCoverage indique un sous-total fiscal et les frais restant à chiffrer sur devis. /cashflow conserve un scénario d'achat supplémentaire ENG explicite, sans surcharge non-résident. Le régime couvre une acquisition résidentielle ordinaire par particuliers, hors sociétés, opérations liées, loyers de nouveaux baux et dispositions transitoires ; pas de certification fiscale générale.

Validation : 1826 tests / 160 fichiers, dont 14 nouveaux tests et exemples officiels : SDLT 295 000 GBP → 4 750 GBP, LTT majoré 260 000 GBP → 15 950 GBP, LBTT 875 000 GBP → 63 350 GBP, cumul des majorations, limites 40 000/500 000, conditions de primo-accession et coûts exclus. Compilation et lint réussis. Aucun achat ou dossier client créé.

Sources : [HMRC, taux SDLT résidentiels](https://www.gov.uk/stamp-duty-land-tax/residential-property-rates), [HMRC, non-résidents](https://www.gov.uk/guidance/rates-of-stamp-duty-land-tax-for-non-uk-residents), [Gouvernement gallois, tranches LTT](https://www.gov.wales/land-transaction-tax-rates-and-bands), [Gouvernement gallois, conditions des taux majorés](https://www.gov.wales/higher-rates-land-transaction-tax-overview), [Revenue Scotland, LBTT résidentiel](https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property), [Revenue Scotland, ADS](https://revenue.scot/taxes/land-buildings-transaction-tax/additional-dwelling-supplement-ads), [Revenue Scotland, primo-accédants](https://revenue.scot/taxes/land-buildings-transaction-tax/lbtt-legislation-guidance/lbtt3001-exemptions-reliefs/lbtt3010-tax-reliefs/lbtt3048-first-time-buyer-relief).

Les autres modèles nationaux, le traitement complet des revenus locatifs UK et les autres parcours du site restent à auditer.


## 10 septembre — échéancier et graphique de trésorerie PropCalc

- Le graphique lisait `yearCashFlow`, absent du moteur : raccordé à `annualCashFlow`, 20 barres vérifiées dans les sept scénarios et les cinq langues.
- Échéancier mensuel à taux fixe, intérêts/principal au centime, solde réglé à la dernière échéance ; année partielle de six mois testée. La première projection reprend exactement le résultat annuel de synthèse ; indexation de 2 % seulement à partir de l’année 2.
- Suppression de l’amortissement fiscal automatique fondé sur une quote-part de bâtiment inventée. Aucune déduction par défaut ; taux marginal explicitement présenté comme scénario constant et non déclaration fiscale nationale.
- Même calcul fiscal dans les résultats et projections ; réduction britannique de 20 % plafonnée au bénéfice, hypothèse de revenu global ajusté non limitant explicitée, aucun report ni prévision de lois futures. Source officielle : https://www.gov.uk/hmrc-internal-manuals/property-income-manual/pim4460 . Cette simplification ne remplace pas le calcul fiscal du foyer.
- Comparaison sans levier recalculée sans déduction d’intérêts. Résultats conservés au centime, invalidité du prix/loyer signalée, curseur compatible avec l’hypothèse américaine de 6,8 %.
- Validation : 1 839 tests / 161 fichiers ; lint ciblé et compilation Next réussis. API des sept pays, graphiques, récupération après erreur et quatre largeurs (320/390/768/1440) dans cinq langues vérifiés sur build final local.
- Lot précédent dd331e9 : CI34445786113 réussie, dpl_9mb9oHtG2pENGHNbNcqMkd2AmzBQ Ready avec alias tevaxia.lu ; contrôles UK API et cinq langues en production réussis.
- Restent notamment la fiscalité complète des autres pays, la réduction britannique du moteur de rendement séparé, les flux MFA et les validations serveur SQL déjà documentées. Audit exhaustif non terminé.


## 10 septembre — réduction des données de mesure d’audience

- Les configurations automatiques transmettaient potentiellement URL complète, référent et interactions. PostHog est désormais limité aux pages publiques d’une liste explicite, avec consentement navigateur ; les routes privées/dynamiques/inconnues sont exclues.
- Reconstruction des événements au dernier contrôle avant envoi : uniquement page publique canonique sans paramètres/fragment, identifiant aléatoire en mémoire, métadonnées de transport nécessaires. Aucun titre, référent, formulaire, trait de compte ou événement métier. Aucun profil de personne ; pas d’identité conservée entre chargements de document.
- Autocapture, replay, erreurs, performances, heatmaps, enquêtes, scripts externes et requêtes de configuration distantes du SDK désactivés. La navigation vers une page privée suspend la capture ; révocation conservée.
- Google Analytics n’est plus chargé. Sa mesure améliorée peut produire des événements d’historique même avec send_page_view=false ; aucun accès de configuration GA distant n’est disponible pour vérifier ces collectes. Le collecteur public restreint PostHog conserve une mesure limitée, lorsqu’une clé est configurée. Nettoyage des anciens cookies GA conservé.
- Texte du bandeau, descriptions de préférences et sections audience de la confidentialité corrigés en cinq langues. Ceci ne constitue pas une validation de toute la politique de confidentialité ni de Sentry, qui relève du diagnostic d’erreurs et reste à examiner séparément.
- Validation : 1 856 tests / 162 fichiers, lint et build réussis. Test du SDK réellement installé avec toutes les requêtes interceptées : corps des envois contrôlé, aucun secret synthétique d’URL/formulaire, pas d’envoi privé ni après retrait. Pages profil/confidentialité contrôlées en cinq langues et quatre largeurs.
- Sources : https://posthog.com/docs/libraries/js/config ; https://developers.google.com/analytics/devguides/collection/ga4/views . Aucun événement réel de client ni réglage de compte externe modifié.
- Lot trésorerie 571bc35 : CI34446783395 réussie ; dpl_3yYyC2penYcpcXgeovhfCizkkF5f Ready / alias tevaxia.lu ; contrôle API et graphiques en production réussi dans cinq langues.


## 10 septembre — diagnostic d’erreurs sans contexte de dossiers

- Filtre final partagé entre navigateur, Node et Edge : reconstruction des événements Sentry, exclusion des messages variables, URL de dossiers, requêtes/en-têtes/cookies, utilisateur, contexte métier, variables, breadcrumbs et pièces jointes.
- Préservation du type d’erreur, identifiant technique, environnement standard, version/hash admissible et repères de fichiers compilés/ligne/colonne. Les messages privés et le contexte de code ne sont plus disponibles dans les rapports, ce qui réduit volontairement le détail de diagnostic.
- Traces de performances serveur/Edge, logs et replay désactivés ; collecte automatique de corps, headers, paramètres, variables, entrées/sorties IA et données de requêtes DB désactivée explicitement.
- 1 865 tests / 163 fichiers ; lint et compilation finale réussis. Transports des SDK réels navigateur et Node testés localement avec faux secrets : aucun message/URL/identité/contexte/pièce jointe transmis, erreur et ligne conservées, aucun envoi réel. Runtime Edge compile avec le même filtre ; pas de faux incident généré en production.
- Politique : description ciblée du diagnostic et mention Sentry dans les cinq langues. Les autres affirmations historiques de la politique (purges, durées, mécanismes métier) ne sont pas toutes certifiées par ce lot.
- Sources : https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management/sensitive-data/ ; https://docs.sentry.io/platforms/javascript/enriching-events/attachments/ ; options et enveloppes du SDK installé examinées.
- Lot audience 6b01c42 : CI34447862615 réussie, dpl_A7PQHWmAufhUzDn7XUoT875z1gt2 Ready avec alias tevaxia.lu, contrôles profil/confidentialité cinq langues en production réussis.


## 10 septembre — retour OAuth et destinations de connexion

- Correction de la redirection ouverte : `next` ne peut plus désigner une URL externe, une adresse relative de réseau, un chemin avec antislash/contrôle, un encodage détourné ou un autre gestionnaire auth/API. Les chemins internes de pages sont conservés ; paramètres et fragments retirés.
- Les erreurs du fournisseur ne sont plus copiées dans l’URL ou affichées telles quelles sur la page de connexion. Messages fixes localisés, langue conservée lorsque la destination est localisée.
- Les cookies de l’échange OAuth sont préparés en mémoire puis attachés uniquement à la réponse de succès ; plus d’échec d’écriture silencieux. Une erreur ne renvoie pas une réponse partiellement authentifiée.
- Redirections non mises en cache, sans référent et non indexables. Le test sur build réel a détecté que l’en-tête global Next écrasait Referrer-Policy : règle explicite finale ajoutée pour /auth/callback.
- 1 892 tests / 165 fichiers, lint et build final réussis ; callback sans code vérifié sur build local. Ce build ne contient pas les paramètres Supabase de production et affiche donc « authentification non configurée » : le composant réel de connexion a été vérifié séparément avec un fournisseur simulé, dans cinq langues et quatre largeurs (work/oauth-fixture.log PASS). Échanges de codes, cookies et échecs testés avec mocks isolés, aucun compte réel ni fournisseur OAuth utilisé. Le contrôle complet du formulaire en ligne est distinct et reste à consigner après déploiement.
- Complément diagnostic : conservation exclusive des identifiants de source maps générés avec fichiers compilés nettoyés, pour préserver la résolution du code sans restaurer le contexte privé.
- Lot diagnostic c8f31c9 : CI34448851034 réussie, dpl_8MNqPJoJXnEWLKpVijfBpEQf6W7h Ready / alias tevaxia.lu ; contrôle public cinq langues en production réussi.


## 10 septembre — déconnexion liée à la session affichée

- La déconnexion ordinaire vise maintenant la session locale ; la révocation globale reste une action distincte du profil. Requête Auth construite avec le JWT capturé, sans réutiliser SDK signOut qui relit une session mutable après acquisition du verrou.
- Contrôle du propriétaire et du session_id avant envoi ; contrôle des cookies après réponse sous le verrou partagé du SDK installé. Un autre compte ou une nouvelle session ouverte entre-temps est conservé. Les cookies de vérification OAuth, préférences et données métier ne sont pas supprimés.
- Révocation distante, effacement local et synchronisation des onglets distingués : pas de faux succès si les cookies sont bloqués ; hors ligne, effacement local possible avec avertissement de révocation non confirmée. Sans Web Locks, le nettoyage local n’est pas déclaré sûr/réussi.
- Marqueur limité au session_id retiré pour ignorer les anciennes notifications ; une nouvelle connexion du même compte reste autorisée. Notifications INITIAL_SESSION tardives, jetons rafraîchis de sessions retirées et anciennes fonctions de clic ne remplacent pas le compte courant. Protection après suppression du compte conservée.
- Plus de redirection retardée du profil susceptible de déplacer un compte ouvert ensuite. Texte en cinq langues : les jetons d’accès déjà émis restent valides jusqu’à expiration, conformément à Supabase https://supabase.com/docs/guides/auth/signout . Aucun raccourcissement de JWT ou changement SQL prétendu.
- Validation : 1 903 tests / 166 fichiers, lint et build final réussis. AuthProvider et SDK Supabase réels dans une fixture entièrement interceptée : deux véritables onglets, compte B ouvert pendant la déconnexion de A, notifications tardives, ancien gestionnaire de clic, nouvelle session A, local/global/échec réseau, cookies et données préservés. Cinq langues et quatre largeurs. Aucun compte réel déconnecté ni token réel utilisé.
- Contrôle public du build final : accueil/connexion/profil dans cinq langues, sans erreur client ni traduction racine manquante, zoom global 1,1 conservé à 320/390/768/1440 pixels.
- OAuth 3dbac56 : CI34449793718 réussie ; dpl_FucKpACL9rFcPek6SBHtmv3otDwP Ready / alias tevaxia.lu ; contrôle complet connexion/callback sans code en production réussi dans cinq langues (work/oauth-public-prod.log).
- Revue exhaustive encore ouverte : MFA/AAL2 et enforcement SQL, données métier/Syndic, modèles fiscaux restants et contenu historique. Un passage GET sur l’ensemble des routes locales a été lancé séparément ; il ne valide pas les opérations authentifiées.


## 10 septembre — base fiscale italienne distincte du résultat économique

- /yield Italie : la cedolare secca ordinaire à 21 % porte sur le loyer contractuel brut déclaré, même si le résultat après charges est négatif. Plus de déduction implicite des charges, intérêts, amortissement ou prélèvements sociaux étrangers.
- italianAnnualContractRent obligatoire : montant correspondant à la quote-part et à la période louée ; aucune réduction automatique par la vacance économique. italianCedolareEligible=true confirme un bailleur personne physique éligible hors activité professionnelle, un bail résidentiel ordinaire à loyer libre et une option valide. Aucun choix automatique d'éligibilité à partir du seul pays.
- IRPEF est refusé explicitement au lieu du faux calcul sur charges réelles ; locations courtes, taux réduits/concordato, impayés, situations cadastrales particulières et conventions fiscales sont hors scénario. Il ne s'agit pas d'une liquidation complète de l'impôt italien. Les frais d'acquisition italiens restent à revoir séparément.
- Contrat API strict et documentation dans les cinq langues ; les champs italiens sont refusés pour un autre pays. Exemple : loyer contractuel 12 000 EUR, recettes après vacance 6 000 EUR, charges 7 200 EUR : résultat économique −1 200 EUR, impôt 2 520 EUR, après impôt −3 720 EUR.
- Sources officielles consultées : https://infoprecompilata.agenziaentrate.gov.it/portale/semplificata-mod-fabbricati (index officiel, accès direct 403) et guide Agenzia https://www.agenziaentrate.gov.it/portale/documents/20143/3015794/GUIDA+AFFITTI+17+OTTOBRE+INTERNET+(1).pdf ; option/qualité du bailleur corroborées par l'échéancier 2026 de l'administration. Périmètre volontairement limité aux contrats ordinaires à 21 %.
- Validation : 1 915 tests / 167 fichiers, lint et build final réussis. 12 nouveaux tests couvrent base brute, perte économique, absence de déductions, quote-part/période, zéro, centimes, qualification obligatoire, IRPEF et entrées invalides. QA du build final : API et documentation cinq langues à 320/390/768/1440 pixels, sans débordement ni erreur client ; zoom 1,1 conservé (work/italian-rental-local.log).
- Livraison précédente d34c74c : CI34451520221 réussie, dpl_7x2eruUq9T2rLDpEJxKFPSj22G97 Ready et alias tevaxia.lu contrôlés ; QA publique accueil/connexion/profil cinq langues et quatre largeurs réussie (work/signout-public-prod.log). Aucun compte réel déconnecté.
- Passage GET local terminé : 1 300 routes, aucune erreur HTTP ni redirection externe (work/site-route-crawl.json). Cela ne valide pas les calculs, l'hydratation ni les opérations authentifiées. La revue exhaustive reste ouverte.


## 10 septembre — Portugal : catégorie F et dispositif de 2026

- /yield utilise une base fiscale distincte du résultat économique : portugueseAnnualTaxReceipts moins portugueseDeductibleExpenses, champs obligatoires y compris à zéro. portugueseCategoryFConfirmed confirme un scénario ordinaire de catégorie F et des dépenses effectivement payées admissibles. Une perte économique ne supprime pas un bénéfice fiscal ; un déficit fiscal ne crée pas un remboursement automatique.
- Taux autonomes suivant l'usage, non la seule résidence : housing 25 %, other 28 %. Le précédent 28 % résidentiel résident et 25 % non-résident quel que soit l'usage étaient incorrects. L'option progressive_resident applique le taux marginal fourni, sans liquidation du barème global ni choix automatique du meilleur régime.
- Revenus 2025/2026 seulement. Pour l'habitation en 2026, portugueseModerateRentEligible doit explicitement confirmer ou exclure les conditions de l'EBF article 45-C : taux autonome de 10 % si éligible. L'éligibilité inclut les plafonds mensuels légaux DL97/2026 article2 ; elle n'est pas déduite du loyer économique après vacance. Les taux plus favorables de longue durée/anciens contrats, exonérations, adaptations régionales, sous-location, catégorie B, déficits reportables et conventions sont exclus du scénario et annoncés.
- Aucun intérêt financier ou amortissement déduit ; les dépenses admissibles excluent également mobilier, électroménager, décoration et AIMI conformément à l'article41. Pas de double déduction des charges économiques. Les entrées spécifiques sont refusées pour un autre pays ; documentation en cinq langues.
- Sources officielles consultées : CIRS art.41 https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/pages/irs41.aspx ; art.72 https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs72.aspx ; EBF45-C https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/bf_rep/Pages/ebf45c.aspx ; DL97/2026 https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/diplomas_legislativos/Documents/decreto-lei-97-2026.pdf . La rectification26/2026/1 consultée ne modifie pas ces articles de taux/base : https://diariodarepublica.pt/dr/analise-juridica/retificacoes/declaracao-retificacao/26-2026-1146287134 . Le dispositif45-C produit ses effets dès le 1er janvier2026 ; les années futures ne sont pas calculées automatiquement.
- Validation : 1 933 tests / 168 fichiers, lint et build réussis ; 18 tests supplémentaires couvrent les taux25/28/10, englobamento, qualification, années, dépenses interdites, zéro, centimes, déficits et contrat API. Contrôle du build final en cinq langues et quatre largeurs sans débordement/erreur client ni traduction manquante ; zoom1,1 conservé (work/portuguese-rental-local.log).
- Lot italien225b2b1 confirmé en production : CI34452860088 réussie, dpl_AkJMCzxLoYYC6X2nKpDvSMDk6Cnz Ready et alias tevaxia.lu ; API et documentation cinq langues/quatre largeurs contrôlées (work/italian-rental-prod.log).
- Les barèmes d'acquisition portugais, autres informations pays et fiscalités non couvertes restent à examiner. Ce lot ne certifie pas une fiscalité portugaise exhaustive ni les opérations authentifiées du site.


## 10 septembre — connexion : échecs, demandes simultanées et langue

- Un verrou immédiat partagé empêche deux envois simultanés du formulaire ou le mélange formulaire/Google/LinkedIn. Les contrôles et le changement de mode sont désactivés pendant la demande. Les exceptions et réponses en erreur rendent le formulaire réutilisable grâce à try/catch/finally ; les erreurs du fournisseur ne sont plus affichées brutes, et les identifiants invalides conservent leur message traduit.
- Labels liés aux champs, saisie automatique adaptée connexion/inscription, annonces alert/status. Liens de confidentialité/mentions et destination du callback conservent la langue. Les URL /en|de|pt|lb/energy/connexion sont reconnues comme section Énergie. L'inscription transmet aussi une destination de confirmation localisée au callback existant.
- Validation : 1 933 tests / 168 fichiers, build final réussi ; lint sans erreur (un ancien commentaire eslint-disable signalé inutilisé). Composant réel dans une fixture à services Auth substitués et requêtes entièrement interceptées : exceptions, erreur retournée, nouvelle tentative, deux soumissions synchrones, exclusion OAuth/formulaire, confirmation fictive, destinations langue/Énergie, cinq langues et quatre largeurs (work/login-resilience-fixture.log).
- Vérification publique locale du build final : deux pages de connexion dans cinq langues, quatre largeurs, zoom1,1 et absence d'erreur client/traduction. Le miroir local n'a pas de configuration Supabase : ce contrôle vérifie l'état non configuré ; le formulaire fonctionnel est vérifié séparément par la fixture. Aucune inscription, connexion, déconnexion, redirection OAuth réelle ni aucun envoi d'e-mail exécuté pour ces essais.
- Ce lot ne constitue pas une validation MFA/AAL2, des politiques SQL ni des changements de session entre plusieurs comptes pendant une connexion ; ces points restent dans la revue.
- Lot Portugal453ad9f livré : CI34453508214 réussie ; dpl_VLdYdSmZ3djpTXoA9wdU9VBM5gjc Ready et alias tevaxia.lu ; QA API et documentation cinq langues/quatre largeurs en production réussie (work/portuguese-rental-prod.log).


## 10 septembre — sélection des espaces du profil confirmée côté serveur

- ProfileTypeSelector charge les seules colonnes user_id/profile_types/updated_at avec un jeton capturé et vérifié pour le compte affiché. Réponse strictement validée : compte, types connus sans doublons et version ; lecture échouée, lignes multiples et données malformées ne deviennent plus une sélection vide silencieuse.
- Sélection et filtre des espaces ne changent qu'après confirmation du serveur. Écriture limitée à profile_types, PATCH conditionné par propriétaire/version/ancienne valeur du tableau ; POST si ligne absente, sans upsert des réglages d'autres composants. Aucune modification des consentements ou notifications.
- Réponse absente, zéro ligne, conflit, refus ou valeur différente : message d'échec et rechargement explicites. Pas de faux badge enregistré. Verrou immédiat contre doubles clics, aucune minuterie de succès tardive, contrôles désactivés pendant l'enregistrement et aria-pressed. Formulaire remonté par propriétaire, anciennes lectures/réponses ignorées après changement de compte.
- Validation : 1 953 tests / 169 fichiers, lint et build final réussis ; 20 tests supplémentaires du client REST. Fixture composant réel + client REST, comptes et réseau simulés : lecture échouée/rechargement, état non optimiste, conflit, sauvegarde/effacement confirmés, réponse de A après passage à B, cinq langues et quatre largeurs. Contrôle public final accueil/connexion/profil cinq langues, zoom1,1 et responsive conservés (work/profile-types-public-local.log).
- Production Supabase : deux sondes limitées à zéro ligne confirment la présence des trois colonnes et l'acceptation du filtre d'égalité de tableau (HTTP200, zéro donnée reçue). Aucune préférence réelle modifiée ; cela ne certifie pas les politiques RLS ou les opérations administratives. Référence syntaxe https://docs.postgrest.org/en/v12/references/api/tables_views.html .
- Lot connexion9c92887 livré : CI34454073719 réussie, dpl_CnzHHKZqgnbyA28LYaX7trqa3W8W Ready et alias tevaxia.lu. QA production : vrais formulaires publics principal/Énergie, labels, saisie automatique, bascule inscription sans soumission, liens localisés, cinq langues/quatre largeurs (work/login-resilience-prod.log). Aucune connexion/inscription réelle ni e-mail.


## 10 septembre — tâche quotidienne : mises à jour concurrentes et compte rendu

- /api/cron/daily réapplique les critères d'état et de date dans l'UPDATE : un dossier entre-temps payé, arrivé, signé, annulé ou prolongé ne doit pas être écrasé sur la base d'une ancienne lecture d'identifiants. Le rapport compte uniquement les lignes effectivement retournées avec le nouvel état attendu.
- Les erreurs de lecture ne deviennent plus un résultat vide réussi. Erreurs de mise à jour, réponses incohérentes et journalisation non confirmée produisent un rapport incomplet et HTTP500, avec codes fixes sans détails privés de la base.
- Journal des signatures : événements créés seulement pour les lignes effectivement expirées ; nombre d'événements confirmé séparément. Les deux écritures ne forment pas une transaction SQL : un échec de journalisation après expiration reste possible et est maintenant signalé, sans prétendre à une atomicité non implémentée.
- Lot limité à500 dossiers par étape, comptage exact et signalement limited_steps/complete=false si reste à traiter ou réponse serveur tronquée ; aucun rapport exhaustif fictif. Budget réseau global45s, requête10s maximum, sous la durée de route60s. Authentification du cron conservée ; réponses no-store/noindex. Pas de nouvelle tâche planifiée créée.
- Délais opérationnels UTC existants conservés : réservations avant hier, appels de fonds échus depuis plus de15jours, fin de mandat avant aujourd'hui, date d'expiration de signature dépassée. Il ne s'agit pas d'une validation de délais légaux. Retrait du commentaire affirmant une expiration de calendriers qui n'était pas implémentée.
- Validation : 1 973 tests / 170 fichiers, lint, build et contrôle TypeScript réussis. 20 tests supplémentaires avec base simulée vérifient les quatre courses de statut et les quatre prolongations, frontières de date, refus d'accès, erreurs de lecture/écriture/événement, lot incomplet, rejouabilité et budget réseau. Requête publique locale sans aucun secret : rejet avant création du client privilégié et en-têtes corrects. Aucun cron autorisé invoqué, aucune réservation, créance, signature ou donnée réelle modifiée pendant la QA.
- Lot espaces84e278d livré : CI34454751421 réussie, dpl_DprCnC6rUzyoiNrcSymFmhxUcJAh Ready et alias tevaxia.lu ; contrôle public accueil/connexion/profil cinq langues et quatre largeurs réussi (work/profile-types-public-prod.log). Les essais authentifiés restent synthétiques.


## 10 septembre — communes : seuils de suivi manuel, sans promesse d'envoi

- Le dépôt contient une fonction check-alerts dont la récupération de prix renvoie une collection vide et dont l'envoi est un journal console. Aucun service de notification réellement raccordé n'a été établi pendant cette revue. L'interface propose donc clairement un suivi manuel avec seuil enregistré, sans promesse de notification automatique. Aucun expéditeur ou cron de notification n'a été activé ni testé sur des destinataires réels.
- MarketAlertButton et la liste du profil utilisent un client REST commun lié au compte capturé/vérifié. Lectures paginées par identifiant jusqu'à une page vide (même si une page est courte), contrôle du propriétaire/champs/ordre/doublons ; borne100pages avec erreur explicite si lecture incomplète. Les erreurs ne sont plus assimilées à aucune alerte.
- Création avec identifiant explicite et réponse confirmée ; modifications/suppressions conditionnées par compte, identifiant, version et valeurs antérieures. Aucun état enregistré/supprimé annoncé sur zéro ligne, conflit ou réponse incohérente. Verrou de clic et formulaire remonté par propriétaire/commune ; réponse tardive de A ignorée après passage à B.
- Prix non négatif, fini, au plus deux décimales, virgule ou point, valeur vide distincte de zéro ; plus de parseFloat partiel acceptant des chaînes ambiguës. Liste du profil localisée, zéro affiché comme un vrai seuil. Plusieurs enregistrements existants d'une même commune ne sont pas fusionnés/supprimés automatiquement : l'éditeur renvoie vers leur gestion individuelle.
- La création simultanée dans deux onglets peut encore nécessiter une contrainte d'unicité SQL : ce lot ne prétend pas l'avoir appliquée. Les politiques RLS restent hors validation administrative. La lecture sans données (limit0) des huit colonnes de market_alerts est acceptée en production (HTTP200, zéro ligne), sans aucune modification de compte réel.
- Fenêtre native dialog (clavier/Escape/focus modal), labels et textes cinq langues, connexion localisée pour les visiteurs. Plus de repli anonyme donnant l'impression d'une alerte serveur ; l'ancienne clé locale n'est ni migrée vers un compte ni supprimée.
- Validation : 1 993 tests / 171 fichiers, lint et build final réussis. 20 tests supplémentaires du client REST ; composants réels et client REST dans une fixture interceptée : lecture/écriture, décimales invalides, conflits/rechargement, pause/suppression, changement de compte, visiteur et fenêtre à320/390/768/1440px dans cinq langues. Contrôle des pages communes du build final : mentions de suivi manuel, lien de connexion localisé, Escape, aucun débordement/erreur client/traduction et zoom1,1 préservé (work/market-thresholds-local.log).
- Lot1091f6c maintenance livré : CI34455482195 réussie, dpl_3itTTXNRD4pTXzQhmRBLuMBngEM6 Ready et alias tevaxia.lu. Contrôle production exclusivement sans secret : refus avant toute opération privilégiée, no-store/noindex (work/daily-maintenance-prod.log). Aucun cron réel déclenché.


## 10 septembre — tableau de bord : compteurs et plan vérifiables

- Compteurs REST HEAD exacts, jeton capturé et compte vérifié : évaluations synchronisées, suivis manuels actifs, liens enregistrés (y compris expirés), clés API non révoquées. Filtre des liens corrigé vers owner_user_id et des clés vers revoked_at is null ; aucune lecture des clés IA chiffrées pour ce résumé.
- Une lecture en erreur, un total absent ou un plan absent/invalide/expiré donne une indisponibilité explicite, jamais un zéro ni un plan Gratuit/500 inventé. Les valeurs partielles valides restent affichées ; bouton de rechargement, réponse tardive ignorée après changement de compte.
- Suppression du quota IA et de la promesse illimitée que ce résumé ne permettait pas de justifier. Textes dans cinq langues, valeurs localisées, cartes sur une colonne en petit écran pour conserver la lisibilité des grands nombres. Zoom global 1,1 préservé.
- Validation : 2 007 tests / 172 fichiers dont 14 nouveaux, lint et compilation finale réussis. Fixture avec composant et client REST réels, authentification/réseau simulés : échec partiel, vrai zéro, rechargement, plan inconnu, compte A/B, 12 345 678, cinq langues et quatre largeurs. Contrôle visuel du rendu allemand à320px. Pages publiques accueil/connexion/profil du build final contrôlées sans connexion réelle ; le serveur local ne dispose pas de configuration d'authentification.
- Le lot ne valide pas les politiques RLS ni l'intégralité du profil : export, liens partagés et MFA restent des périmètres distincts à poursuivre.
- Lot précédent74a2f92 : CI34456666703 réussie et déploiement dpl_DvT2dnWmzS16jqMv8EHgC2xtv5rZ Ready avec alias tevaxia.lu ; contrôle public des communes réussi dans cinq langues.


## 10 septembre — export JSON limité, paginé et en lecture seule

- L'ancien export présenté comme complet ignorait certaines erreurs, ne paginait pas plusieurs tables et rechargeait les évaluations/lots en écrivant leur cache. Le nouveau format_version2 conserve séparément les trois copies locales du compte (dont la corbeille existante des évaluations), le profil cloud et les enregistrements cloud explicitement sélectionnés. Aucune synchronisation, fusion ou écriture de cache n'est déclenchée.
- Le fichier et l'interface précisent qu'il ne s'agit pas de toutes les données du compte : autres navigateurs/caches non attribués, autres modules/espaces de travail, documents, factures, secrets et contenu des liens partagés ne sont pas inclus. Les liens exportés sont des métadonnées sans jeton d'accès ; les clés API n'incluent ni secret ni hash. Lectures successives, sans promesse de transaction à un instant unique.
- Compte affiché exigé à l'appel, jeton capturé/vérifié, filtre propriétaire sur chaque table, contrôles de compte entre pages et avant remise du fichier. Sélection explicite des champs, reconstruction des réponses pour exclure les champs imprévus, contrôle du propriétaire et de l'ordre/doublons. Pagination jusqu'à une page vide, y compris après une page courte ; limite10000lignes/table et budget réseau60s produisent une erreur, jamais un export silencieusement tronqué. Aucun filtre d'expiration ne masque les lignes encore accessibles.
- Échec de lecture, structure incomplète, JSON local malformé, modification locale ou changement de compte empêchent la remise du fichier. Plan absent représenté par null, sans inventer Gratuit/500. Métadonnées de plan exportées telles que stockées, sans interpréter un ancien plan comme un droit actuel.
- Composant localisé cinq langues, verrou de double clic, états erreur/reprise, réponse tardive ignorée après changement de compte. Message « téléchargement lancé » : aucune fausse attestation d'enregistrement sur disque. La section de données n'affiche plus une rétention universelle180jours ou un état de paiement démo non vérifiés ; le résumé de plan vérifié demeure dans le tableau de bord.
- Validation : 2026tests/173fichiers (19nouveaux), lint et build réussis. Fixture composant/client réels, frontières d'authentification et réseau simulées, JSON uniquement synthétique : échec/reprise, contenu de récupération préservé, pas de double export, A après B, cinq langues/quatre largeurs, zoom1,1. Capture allemande320px inspectée. Pages publiques du build final contrôlées (authentification locale non configurée). Six probes de schéma en production limit0 : HTTP200 et zéro ligne, sans lecture/export de données privées ni vérification RLS administrative.
- Tableau de bord960b512 livré : CI34458201380 réussie, dpl_1Vtg2W5nQb42rXGCcvzvgbasvN5n Ready avec alias tevaxia.lu ; contrôle public en production cinq langues réussi.


## 10 septembre — gestion des liens partagés liée au propriétaire

- Liste paginée jusqu'à une page vide, propriétaire explicite et jeton capturé/vérifié ; seule la métadonnée nécessaire est chargée, sans payload des calculs. Identifiants, jeton48hex, propriétaire, dates et compteurs validés ; ordre strict/doublons et limite10000/budget60s avec erreur explicite. Échec de lecture distinct d'une liste vide.
- Révocation filtrée par propriétaire, identifiant et jeton exact du lien, confirmée uniquement par une ligne cohérente renvoyée par le serveur. Aucun retrait optimiste ni succès sur zéro ligne. Les consultations concurrentes n'empêchent pas la révocation : ce contrôle porte sur l'identité du lien d'accès, pas sur une version globale de toutes ses métadonnées.
- Un composant commun remplace les deux listes du profil et de sa page dédiée. Chargement des commentaires et statistiques à la demande, après relecture du lien possédé ; RPC liés au jeton capturé, refus et réponses malformées traités en erreurs. Les RPC existants prévoient31dates (aujourd'hui et les30dates précédentes) : série quotidienne contiguë et compteurs vérifiés. Pas d'ouverture automatique du lien public et donc aucune consultation ajoutée pour charger la liste ou ses détails.
- États isolés par compte, actions verrouillées, erreurs de copie visibles, lecture/révocation tardive ignorée après changement de compte. Textes et dates localisés cinq langues, cartes adaptées au mobile ; commentaires affichés comme texte, sans lien email construit depuis leur contenu. Liste incluant aussi les liens expirés/plafonnés et compteurs au dernier chargement ; les consultations ne sont pas présentées comme des visiteurs uniques.
- Le tableau de bord général utilise aussi la liste liée au compte, affiche — en cas d'échec de cette liste et exclut du compteur de liens actifs les plafonds de vues atteints. Les autres agrégats de ce tableau de bord demeurent un périmètre distinct à poursuivre.
- Validation : 2047tests/174fichiers dont21nouveaux, lint et compilation finale réussis. Fixture composant/client réels, réseau/authentification simulés : lecture/reprise, RPC refusé puis détails, copie refusée/réussie, révocation zéro ligne, réponse A après B et révocation confirmée ; cinq langues/quatre largeurs/zoom1,1, capture allemande320px inspectée. Pages publiques profil/liens-partages/tableau-bord du build final vérifiées, sans compte réel. Schéma10colonnes accepté par un GET limit0 en production (HTTP200, zéro ligne).
- Aucun lien réel créé, ouvert ou révoqué, aucun commentaire réel lu ou envoyé. Les politiques/RPC SQL de production n'ont pas été validés administrativement. La création et la consommation publiques des liens restent à poursuivre séparément.
- Exportab99f91 livré : CI34459107694 réussie, dpl_4t5PQAUTqhC59tTktjMxPYyHzy9M Ready avec alias tevaxia.lu ; contrôle public production cinq langues réussi.


## 10 septembre — création des liens et messages réellement fournis aux pages

- Création liée au compte affiché et au jeton capturé/vérifié ; copie JSON des données avant toute attente, remise à zéro du formulaire lorsque le compte ou le calcul change, verrou de double clic. Durée entière1..365jours, plafond facultatif entier1..1000000, titre200caractères, JSON250000octets UTF8 et nombres non finis refusés. Les champs objet optionnels undefined sont omis selon JSON ; zéro reste zéro.
- Identifiant de tentative conservé tant que les paramètres sémantiques restent identiques. Une reprise recherche d'abord cet identifiant appartenant au compte ; une réponse perdue après INSERT peut ainsi être récupérée sans republier une deuxième copie. Confirmation des champs/dates et contenu JSON indépendant de l'ordre des clés JSONB. Aucun lien affiché comme créé sur une réponse vide, incohérente ou reçue après changement de compte. Ce mécanisme concerne la même tentative dans le composant courant, pas une déduplication universelle entre onglets ou après fermeture/rechargement.
- Formulaire cinq langues, labels associés, champs non corrigés silencieusement, erreurs de copie et création incertaine explicites ; aucun destinataire contacté. Copie figée du calcul clairement expliquée ; toute personne possédant le lien peut y accéder. Le plafond n'est pas présenté comme un blocage strict d'ouvertures simultanées : la fonction SQL033 du dépôt lit avant de mettre à jour le compteur, sans verrou atomique. Aucune correction SQL de production n'est prétendue ni appliquée.
- Contrôle d'intégration ayant révélé un défaut du générateur de traductions : seuls les directives use client entre doubles guillemets étaient reconnus. Les fixtures antérieures utilisaient les messages complets et les parcours publics ne rendaient pas les sections connectées ; ils ne prouvaient donc pas que leurs traductions étaient réellement embarquées. Cette limite des validations précédentes est corrigée ici.
- Générateurs corrigés pour les deux styles de guillemets et les dépendances héritant de la frontière client. Visites distinguées par fichier/contexte client, réexports et imports dynamiques vérifiés. Cartes régénérées et étape CI ajoutée avant typecheck/tests. Les nouvelles fixtures utilisent maintenant pickNamespaces et les cartes générées pour le profil, la gestion des liens et la création. Six tests supplémentaires vérifient la sélection réelle sur cinq langues et cinq routes, plus le repli de route inconnue.
- Validation finale :2079tests/176fichiers,3tests Python du générateur, lint et build1347pages réussis. Les trois fixtures d'export/gestion/création avec sélection réelle des messages passent chacune dans cinq langues et quatre largeurs, zoom1,1. Création testée uniquement via réseau/authentification simulés, y compris POST réussi avec réponse perdue, reprise sans deuxième POST et réponse A après B. Captures allemandes320px inspectées. Pages du build final profil/liens-partages/estimation/valorisation/dcf-multi vérifiées avec présence des namespaces dans le HTML et absence de débordement/erreur client. Le test choisit le main racine, certaines pages existantes comportant un main interne.
- Lotbe93ce6 gestion des liens livré : CI34460182051 réussie, dpl_B4GFdRbZTNEppCT2XfW5EMXTFb3v Ready avec alias tevaxia.lu et contrôle public production5langues réussi.
- Restant hors de ce lot : consommation publique des calculs et commentaires (validation de payload, formulaires, contrôle concurrent serveur), autres agrégats du tableau de bord, MFA/AAL2, politiques/RPC SQL sans accès administratif, autres vérifications fiscales/éditoriales déjà recensées. La revue exhaustive du site n'est pas terminée.


## 12 septembre — reprise et lecture publique des calculs partagés

- Reprise depuis 59196d6, dépôt propre, CI et déploiement GitHub de ce commit confirmés. Consignes récupérées : poursuivre la revue et publier les lots vérifiés, cinq langues, agrandissement global de 10 %, pas de sous-agents ni automatisation.
- Lecture publique : jeton 48 caractères hexadécimaux vérifié avant RPC, délai 15 secondes, erreurs réseau/service distinctes des refus explicites (absent, expiré, plafond). Réponse publique reconstruite et contrôlée ; données JSON bornées à 1 Mo/32 niveaux/50 000 éléments, valeurs non finies refusées. Limite de création existante 250 Ko inchangée.
- État remonté par jeton ; résultats tardifs ignorés. Le RPC comptant une vue, la relecture des effets React StrictMode réutilise la même requête. Une reprise manuelle est explicite et rappelle qu'une réponse perdue peut avoir déjà comptabilisé une vue. Aucun rejeu automatique.
- Validation de compatibilité avant les vues détaillées. Nouveau lecteur du format DCF monthly-expected-v1 réellement produit par le calculateur ; tableaux des flux sauvegardés, sans inventer TRI/NOI/indicateurs absents. Formats incompatibles : message explicite et copie JSON disponible. Tous les partages affichent la portée historique de la copie et donnent accès aux données enregistrées ; aucun recalcul ou avis de validité financière implicite.
- Montants avec centimes et locale, zéro et valeurs négatives conservés. Lien vers le calculateur correspondant. Referrer-Policy no-referrer et X-Robots-Tag noindex/nofollow/noarchive sur les cinq routes publiques. Grands montants lisibles à 320 px ; zoom 1,1 conservé.
- Commentaire : contrôle des champs avant RPC, verrou immédiat contre doubles soumissions, champs désactivés pendant l'envoi, état isolé par jeton, labels et annonces accessibles, texte conservé en cas d'échec. Une réponse ambiguë signale que le commentaire a peut-être été reçu et qu'un nouvel envoi risque de dupliquer ; le serveur ne fournit pas d'identifiant d'idempotence. « Enregistré » seulement sur succès explicite ; aucun envoi d'e-mail promis.
- Validation : 2 116 tests / 177 fichiers, dont 37 nouveaux ; 3 tests Python des cartes de traduction ; lint et build réussis. Fixture React StrictMode avec page/client réels et cartes pickNamespaces, RPC entièrement fictifs : une lecture par montage, échec/reprise, double envoi, lecture/commentaire tardifs, zéro, DCF actuel, formats invalides. Cinq langues et largeurs 320/390/768/1440 ; capture allemande mobile inspectée. Build local vérifié dans cinq langues, jeton volontairement invalide sans appel RPC, en-têtes et affichage contrôlés.
- Aucun lien client réel ouvert, aucun commentaire réel envoyé, aucune donnée de compte lue ou modifiée durant ces essais. Les corrections de concurrence SQL033/034 restent à préparer/vérifier séparément ; aucune migration Supabase appliquée dans ce lot. Revue exhaustive encore ouverte.
