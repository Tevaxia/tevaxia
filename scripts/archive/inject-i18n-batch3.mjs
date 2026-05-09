// Inject i18n keys for bail-commercial, inspection TEGOVA, transparence pages
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

const NEW_KEYS = {
  /* ===================================================================
   *  bailCommercialPage — src/app/bail-commercial/page.tsx
   *  (non-InputField strings: titles, results, table, legal, etc.)
   * =================================================================== */
  bailCommercialPage: {
    // Page header
    backLink: { fr: "← tevaxia.lu", en: "← tevaxia.lu", de: "← tevaxia.lu", lb: "← tevaxia.lu", pt: "← tevaxia.lu" },
    pageTitle: { fr: "Bail commercial LU — indexation & durée", en: "Commercial lease LU — indexation & duration", de: "Gewerbemietvertrag LU — Indexierung & Laufzeit", lb: "Gewierflech Bail LU — Indexéierung & Dauer", pt: "Arrendamento comercial LU — indexação & duração" },
    pageDescription: { fr: "Calcul de l'indexation du loyer selon l'IPC luxembourgeois (STATEC) et rappel des règles applicables au bail commercial (loi du 3 février 2018).", en: "Rent indexation calculation based on the Luxembourg CPI (STATEC) and reminder of rules applicable to commercial leases (law of 3 February 2018).", de: "Berechnung der Mietindexierung nach dem luxemburgischen VPI (STATEC) und Erinnerung an die Regeln für Gewerbemietverträge (Gesetz vom 3. Februar 2018).", lb: "Berechnung vun der Loyerindexéierung no dem Lëtzebuerger VPI (STATEC) an Erënnerung un d'Reegelen fir Gewierflech Bailen (Gesetz vum 3. Februar 2018).", pt: "Cálculo da indexação da renda segundo o IPC luxemburguês (STATEC) e lembrete das regras aplicáveis ao arrendamento comercial (lei de 3 de fevereiro de 2018)." },

    // Warning box
    warningImportant: { fr: "Important :", en: "Important:", de: "Wichtig:", lb: "Wichteg:", pt: "Importante:" },
    warningText: { fr: "contrairement au bail d'habitation, la règle des 5 % (plafond légal de loyer) ne s'applique pas au bail commercial. Le loyer est librement convenu à la signature, puis encadré par les clauses d'indexation négociées entre les parties.", en: "unlike residential leases, the 5% rule (legal rent cap) does not apply to commercial leases. The rent is freely agreed upon at signing, then governed by the indexation clauses negotiated between the parties.", de: "im Gegensatz zum Wohnungsmietvertrag gilt die 5%-Regel (gesetzliche Mietobergrenze) nicht für Gewerbemietverträge. Die Miete wird bei Vertragsunterzeichnung frei vereinbart und dann durch die zwischen den Parteien ausgehandelten Indexierungsklauseln geregelt.", lb: "am Géigesaz zum Wunnengsbail gëllt d'5%-Regel (gesetzlech Loyerobergrenz) net fir Gewierflech Bailen. De Loyer gëtt bei der Ënnerschrëft fräi vereinbaart an dann duerch d'Indexéierungsklauselen tëschent de Parteien gereegelt.", pt: "ao contrário do arrendamento habitacional, a regra dos 5% (teto legal de renda) não se aplica ao arrendamento comercial. A renda é livremente acordada na assinatura, depois regulada pelas cláusulas de indexação negociadas entre as partes." },

    // Section titles
    sectionLoyerInitial: { fr: "Loyer initial & dates", en: "Initial rent & dates", de: "Anfangsmiete & Daten", lb: "Ufanksloyer & Datumen", pt: "Renda inicial & datas" },
    sectionClausesBail: { fr: "Clauses du bail", en: "Lease clauses", de: "Mietvertragsklauseln", lb: "Bailklauselen", pt: "Cláusulas do contrato" },
    sectionCoutsComplementaires: { fr: "Coûts complémentaires", en: "Additional costs", de: "Zusätzliche Kosten", lb: "Zousätzlech Käschten", pt: "Custos complementares" },

    // Duree select options
    duree9: { fr: "9 ans (durée minimale légale LU)", en: "9 years (LU legal minimum)", de: "9 Jahre (gesetzl. Mindestdauer LU)", lb: "9 Joer (gesetzlech Mindestdauer LU)", pt: "9 anos (duração mínima legal LU)" },
    duree12: { fr: "12 ans", en: "12 years", de: "12 Jahre", lb: "12 Joer", pt: "12 anos" },
    duree15: { fr: "15 ans", en: "15 years", de: "15 Jahre", lb: "15 Joer", pt: "15 anos" },
    duree18: { fr: "18 ans", en: "18 years", de: "18 Jahre", lb: "18 Joer", pt: "18 anos" },
    duree24: { fr: "24 ans", en: "24 years", de: "24 Jahre", lb: "24 Joer", pt: "24 anos" },
    duree99: { fr: "Durée libre (> 24 ans)", en: "Free duration (> 24 years)", de: "Freie Dauer (> 24 Jahre)", lb: "Fräi Dauer (> 24 Joer)", pt: "Duração livre (> 24 anos)" },

    // Suffixes
    suffixEuro: { fr: "€", en: "€", de: "€", lb: "€", pt: "€" },
    suffixPercent: { fr: "%", en: "%", de: "%", lb: "%", pt: "%" },
    suffixMoisLoyer: { fr: "mois de loyer", en: "months of rent", de: "Monatsmieten", lb: "Méint Loyer", pt: "meses de renda" },
    suffixEuroAn: { fr: "€/an", en: "€/yr", de: "€/Jahr", lb: "€/Joer", pt: "€/ano" },

    // Blue result card
    loyerIndexeA: { fr: "Loyer indexé à", en: "Indexed rent at", de: "Indexierte Miete", lb: "Indexéierte Loyer", pt: "Renda indexada em" },
    perAn: { fr: "/an", en: "/yr", de: "/Jahr", lb: "/Joer", pt: "/ano" },
    soit: { fr: "Soit", en: "i.e.", de: "D.h.", lb: "D.h.", pt: "Ou seja" },
    perMois: { fr: "/mois", en: "/mo", de: "/Monat", lb: "/Mount", pt: "/mês" },
    ipcLabel: { fr: "IPC", en: "CPI", de: "VPI", lb: "VPI", pt: "IPC" },
    coefficientLabel: { fr: "Coefficient", en: "Coefficient", de: "Koeffizient", lb: "Koeffizient", pt: "Coeficiente" },
    evolutionBrute: { fr: "Évolution brute", en: "Gross change", de: "Brutoveränderung", lb: "Bruttoverännerung", pt: "Evolução bruta" },
    indexPlafonne: { fr: "Indexation plafonnée : l'IPC aurait donné", en: "Capped indexation: CPI would have given", de: "Gedeckelte Indexierung: VPI hätte ergeben", lb: "Gedeckelt Indexéierung: VPI hätt erginn", pt: "Indexação limitada: o IPC teria dado" },
    indexPlafonneClause: { fr: "mais votre clause limite à", en: "but your clause limits to", de: "aber Ihre Klausel begrenzt auf", lb: "mee Är Klausel limitéiert op", pt: "mas a sua cláusula limita a" },
    duLoyerInitial: { fr: "du loyer initial.", en: "of initial rent.", de: "der Anfangsmiete.", lb: "vum Ufanksloyer.", pt: "da renda inicial." },

    // ResultPanel: regulatory
    resultTitle: { fr: "Rappels réglementaires — bail commercial LU", en: "Regulatory reminders — commercial lease LU", de: "Regulatorische Hinweise — Gewerbemietvertrag LU", lb: "Regulatoresch Erënnerungen — Gewierflech Bail LU", pt: "Lembretes regulamentares — arrendamento comercial LU" },
    regDureeMin: { fr: "Durée minimale légale", en: "Legal minimum duration", de: "Gesetzliche Mindestdauer", lb: "Gesetzlech Mindestdauer", pt: "Duração mínima legal" },
    regDureeMinVal: { fr: "9 ans (loi du 03.02.2018)", en: "9 years (law of 03.02.2018)", de: "9 Jahre (Gesetz vom 03.02.2018)", lb: "9 Joer (Gesetz vum 03.02.2018)", pt: "9 anos (lei de 03.02.2018)" },
    regTriennale: { fr: "Période triennale", en: "Triennial period", de: "Dreijahresperiode", lb: "Dräijoerperiod", pt: "Período trienal" },
    regTriennaleVal: { fr: "Résiliation possible tous les 3 ans (préavis 6 mois)", en: "Termination possible every 3 years (6 months' notice)", de: "Kündigung alle 3 Jahre möglich (6 Monate Frist)", lb: "Kënnegung all 3 Joer méiglech (6 Méint Frist)", pt: "Rescisão possível a cada 3 anos (aviso prévio 6 meses)" },
    regRenouvellement: { fr: "Renouvellement automatique", en: "Automatic renewal", de: "Automatische Verlängerung", lb: "Automatesch Verlängerung", pt: "Renovação automática" },
    regRenouvellementVal: { fr: "Sauf congé donné 6 mois avant terme", en: "Unless notice given 6 months before expiry", de: "Sofern nicht 6 Monate vor Ablauf gekündigt", lb: "Ausser Kënnegung 6 Méint virum Enn", pt: "Salvo aviso dado 6 meses antes do termo" },
    regIndice: { fr: "Indice d'indexation LU", en: "LU indexation index", de: "LU-Indexierungsindex", lb: "LU-Indexéierungsindex", pt: "Índice de indexação LU" },
    regIndiceVal: { fr: "IPC STATEC (pas d'ILC/ILAT équivalent LU)", en: "CPI STATEC (no equivalent ILC/ILAT in LU)", de: "VPI STATEC (kein ILC/ILAT-Äquivalent in LU)", lb: "VPI STATEC (keen ILC/ILAT-Äquivalent zu LU)", pt: "IPC STATEC (sem ILC/ILAT equivalente em LU)" },
    regRegle5: { fr: "Règle des 5 %", en: "5% rule", de: "5%-Regel", lb: "5%-Regel", pt: "Regra dos 5%" },
    regRegle5Val: { fr: "Ne s'applique PAS aux baux commerciaux", en: "Does NOT apply to commercial leases", de: "Gilt NICHT für Gewerbemietverträge", lb: "Gëllt NET fir Gewierflech Bailen", pt: "NÃO se aplica a arrendamentos comerciais" },
    regForme: { fr: "Forme", en: "Form", de: "Form", lb: "Form", pt: "Forma" },
    regFormeVal: { fr: "Écrit obligatoire si > 9 ans (art. 1715 Code civil)", en: "Written form required if > 9 years (art. 1715 Civil Code)", de: "Schriftform erforderlich wenn > 9 Jahre (Art. 1715 BGB)", lb: "Schrëftlech obligatoresch wann > 9 Joer (Art. 1715 Code civil)", pt: "Escrito obrigatório se > 9 anos (art. 1715 Código Civil)" },

    // Total cost section
    coutTotalBail: { fr: "Coût total du bail", en: "Total lease cost", de: "Gesamtkosten des Mietvertrags", lb: "Gesamtkäschte vum Bail", pt: "Custo total do arrendamento" },
    ansLabel: { fr: "ans", en: "years", de: "Jahre", lb: "Joer", pt: "anos" },
    loyersCumules: { fr: "Loyers cumulés (indexés)", en: "Cumulative rent (indexed)", de: "Kumulierte Mieten (indexiert)", lb: "Kumuléiert Loyeren (indexéiert)", pt: "Rendas acumuladas (indexadas)" },
    chargesCumulees: { fr: "Charges cumulées", en: "Cumulative charges", de: "Kumulierte Nebenkosten", lb: "Kumuléiert Niewekäschten", pt: "Encargos acumulados" },
    pasDePtLabel: { fr: "Pas-de-porte", en: "Key money", de: "Ablöse", lb: "Ablöse", pt: "Luvas" },
    depotGarantieImmob: { fr: "Dépôt de garantie (immobilisé)", en: "Security deposit (held)", de: "Kaution (hinterlegt)", lb: "Kautioun (hinterluegt)", pt: "Depósito de garantia (retido)" },
    coutTotalOccupation: { fr: "Coût total occupation", en: "Total occupation cost", de: "Gesamtbelegungskosten", lb: "Gesamtbelegungskäschten", pt: "Custo total de ocupação" },
    soitMoyenne: { fr: "Soit", en: "i.e.", de: "D.h.", lb: "D.h.", pt: "Ou seja" },
    anMoyenne: { fr: "/an en moyenne", en: "/yr average", de: "/Jahr durchschnittlich", lb: "/Joer duerchschnëttlech", pt: "/ano em média" },

    // Triennial periods section
    periodesTriennales: { fr: "Périodes triennales", en: "Triennial periods", de: "Dreijahresperioden", lb: "Dräijoerperioden", pt: "Períodos trienais" },
    finDuBail: { fr: "Fin du bail", en: "End of lease", de: "Mietvertragsende", lb: "Enn vum Bail", pt: "Fim do contrato" },
    periodeTriennaleN: { fr: "Période triennale n°", en: "Triennial period #", de: "Dreijahresperiode Nr.", lb: "Dräijoerperiod Nr.", pt: "Período trienal n.º" },
    resiliationPossible: { fr: "(résiliation possible)", en: "(termination possible)", de: "(Kündigung möglich)", lb: "(Kënnegung méiglech)", pt: "(rescisão possível)" },
    preavisTriennale: { fr: "Préavis de 6 mois par LRAR avant chaque échéance triennale.", en: "6 months' notice by registered letter before each triennial deadline.", de: "6 Monate Kündigungsfrist per Einschreiben vor jedem Dreijahresende.", lb: "6 Méint Frist per Ageschriwwenen virun all Dräijoersenn.", pt: "Aviso prévio de 6 meses por carta registada antes de cada prazo trienal." },

    // Clauses box
    clausesTitle: { fr: "Clauses fréquentes à vérifier :", en: "Common clauses to check:", de: "Häufige Klauseln zu prüfen:", lb: "Heefeg Klauselen ze préiwen:", pt: "Cláusulas frequentes a verificar:" },
    clausesText: { fr: "pas-de-porte, dépôt de garantie (3-12 mois), charges déductibles, destination des lieux, droit au renouvellement, indemnité d'éviction en cas de non-renouvellement.", en: "key money, security deposit (3-12 months), deductible charges, premises designation, renewal rights, eviction compensation in case of non-renewal.", de: "Ablöse, Kaution (3-12 Monate), absetzbare Nebenkosten, Nutzungszweck, Verlängerungsrecht, Räumungsentschädigung bei Nichtverlängerung.", lb: "Ablöse, Kautioun (3-12 Méint), ofsetzbar Niewekäschten, Bestëmmung vun de Räimlechkeeten, Verlängerungsrecht, Räumungsentschädegung bei Net-Verlängerung.", pt: "luvas, depósito de garantia (3-12 meses), encargos dedutíveis, destino do local, direito à renovação, indemnização de despejo em caso de não renovação." },

    // IPC table
    tableTitle: { fr: "Tableau d'indexation IPC — année par année", en: "CPI indexation table — year by year", de: "VPI-Indexierungstabelle — Jahr für Jahr", lb: "VPI-Indexéierungstabell — Joer fir Joer", pt: "Tabela de indexação IPC — ano a ano" },
    tableSubtitle: { fr: "Évolution du loyer indexé de", en: "Indexed rent evolution from", de: "Entwicklung der indexierten Miete von", lb: "Entwécklung vum indexéierte Loyer vun", pt: "Evolução da renda indexada de" },
    tableTo: { fr: "à", en: "to", de: "bis", lb: "bis", pt: "a" },
    tableIpcBase: { fr: "IPC STATEC (base 100 = 2015)", en: "CPI STATEC (base 100 = 2015)", de: "VPI STATEC (Basis 100 = 2015)", lb: "VPI STATEC (Basis 100 = 2015)", pt: "IPC STATEC (base 100 = 2015)" },
    tablePlafond: { fr: "plafond contractuel :", en: "contractual cap:", de: "vertragliche Obergrenze:", lb: "vertraglech Obergrenz:", pt: "teto contratual:" },
    tableAucun: { fr: "aucun", en: "none", de: "keiner", lb: "keen", pt: "nenhum" },
    thAnnee: { fr: "Année", en: "Year", de: "Jahr", lb: "Joer", pt: "Ano" },
    thIpc: { fr: "IPC STATEC", en: "CPI STATEC", de: "VPI STATEC", lb: "VPI STATEC", pt: "IPC STATEC" },
    thCoefficient: { fr: "Coefficient", en: "Coefficient", de: "Koeffizient", lb: "Koeffizient", pt: "Coeficiente" },
    thLoyerBrut: { fr: "Loyer brut indexé", en: "Gross indexed rent", de: "Brutto-indexierte Miete", lb: "Brutto-indexéierte Loyer", pt: "Renda bruta indexada" },
    thLoyerPlafonne: { fr: "Loyer plafonné", en: "Capped rent", de: "Gedeckelte Miete", lb: "Gedeckelte Loyer", pt: "Renda limitada" },
    thMensuel: { fr: "Mensuel", en: "Monthly", de: "Monatlich", lb: "Monatslech", pt: "Mensal" },
    thEvolVsInitial: { fr: "Évol. vs initial", en: "Change vs initial", de: "Änderung vs Anfang", lb: "Ännerung vs Ufank", pt: "Evol. vs inicial" },
    refBadge: { fr: "(réf.)", en: "(ref.)", de: "(Ref.)", lb: "(Ref.)", pt: "(ref.)" },
    cibleBadge: { fr: "(cible)", en: "(target)", de: "(Ziel)", lb: "(Zil)", pt: "(alvo)" },
    plafBadge: { fr: "(plaf.)", en: "(cap.)", de: "(ged.)", lb: "(ged.)", pt: "(lim.)" },
  },

  /* ===================================================================
   *  inspectionTegova — src/app/inspection/client.tsx
   * =================================================================== */
  inspectionTegova: {
    // Page header
    backLink: { fr: "← tevaxia.lu", en: "← tevaxia.lu", de: "← tevaxia.lu", lb: "← tevaxia.lu", pt: "← tevaxia.lu" },
    pageTitle: { fr: "Inspection terrain TEGOVA", en: "TEGOVA field inspection", de: "TEGOVA Vor-Ort-Inspektion", lb: "TEGOVA Terrain-Inspektioun", pt: "Inspeção de campo TEGOVA" },
    pageDescription: { fr: "Checklist conforme EVS 2025. Sauvegarde locale automatique — fonctionne hors connexion.", en: "Checklist compliant with EVS 2025. Automatic local save — works offline.", de: "Checkliste gemäß EVS 2025. Automatische lokale Speicherung — funktioniert offline.", lb: "Checklist konform EVS 2025. Automatesch lokal Späicherung — fonctionnéiert offline.", pt: "Checklist conforme EVS 2025. Gravação local automática — funciona offline." },

    // Header form labels
    labelAdresse: { fr: "Adresse du bien", en: "Property address", de: "Adresse der Immobilie", lb: "Adress vun der Immobilie", pt: "Morada do imóvel" },
    labelInspecteur: { fr: "Inspecteur", en: "Inspector", de: "Inspektor", lb: "Inspekteur", pt: "Inspetor" },
    labelDate: { fr: "Date", en: "Date", de: "Datum", lb: "Datum", pt: "Data" },
    labelHeureDebut: { fr: "Heure début", en: "Start time", de: "Startzeit", lb: "Ufankszäit", pt: "Hora início" },
    labelHeureFin: { fr: "Heure fin", en: "End time", de: "Endzeit", lb: "Ennzäit", pt: "Hora fim" },
    placeholderAdresse: { fr: "12 rue de la Gare, Luxembourg", en: "12 rue de la Gare, Luxembourg", de: "12 rue de la Gare, Luxemburg", lb: "12 rue de la Gare, Lëtzebuerg", pt: "12 rue de la Gare, Luxemburgo" },
    placeholderInspecteur: { fr: "Nom de l'évaluateur", en: "Valuator name", de: "Name des Gutachters", lb: "Numm vum Gutachter", pt: "Nome do avaliador" },
    refLabel: { fr: "Réf. :", en: "Ref.:", de: "Ref.:", lb: "Ref.:", pt: "Ref.:" },

    // Progress
    progressLabel: { fr: "Progression :", en: "Progress:", de: "Fortschritt:", lb: "Fortschrëtt:", pt: "Progresso:" },
    progressPoints: { fr: "points", en: "items", de: "Punkte", lb: "Punkten", pt: "pontos" },
    okLabel: { fr: "OK", en: "OK", de: "OK", lb: "OK", pt: "OK" },
    ncLabel: { fr: "Non conforme", en: "Non-compliant", de: "Nicht konform", lb: "Net konform", pt: "Não conforme" },
    enAttente: { fr: "en attente", en: "pending", de: "ausstehend", lb: "ausstänneg", pt: "pendente" },

    // Confirm reset
    confirmReset: { fr: "Effacer l'inspection en cours et recommencer ?", en: "Clear current inspection and start over?", de: "Aktuelle Inspektion löschen und neu beginnen?", lb: "Aktuell Inspektioun läschen an nei ufänken?", pt: "Apagar a inspeção em curso e recomeçar?" },

    // Export text header
    exportHeader: { fr: "RAPPORT D'INSPECTION TERRAIN — TEGOVA EVS 2025", en: "FIELD INSPECTION REPORT — TEGOVA EVS 2025", de: "VOR-ORT-INSPEKTIONSBERICHT — TEGOVA EVS 2025", lb: "TERRAIN-INSPEKTIOUNSBERICHT — TEGOVA EVS 2025", pt: "RELATÓRIO DE INSPEÇÃO DE CAMPO — TEGOVA EVS 2025" },
    exportReference: { fr: "Référence", en: "Reference", de: "Referenz", lb: "Referenz", pt: "Referência" },
    exportAdresse: { fr: "Adresse", en: "Address", de: "Adresse", lb: "Adress", pt: "Morada" },
    exportInspecteur: { fr: "Inspecteur", en: "Inspector", de: "Inspektor", lb: "Inspekteur", pt: "Inspetor" },
    exportDate: { fr: "Date", en: "Date", de: "Datum", lb: "Datum", pt: "Data" },
    exportStatusOk: { fr: "✓ OK", en: "✓ OK", de: "✓ OK", lb: "✓ OK", pt: "✓ OK" },
    exportStatusNc: { fr: "✗ NC", en: "✗ NC", de: "✗ NK", lb: "✗ NK", pt: "✗ NC" },
    exportStatusNa: { fr: "— N/A", en: "— N/A", de: "— N/A", lb: "— N/A", pt: "— N/A" },
    exportStatusPending: { fr: "? En attente", en: "? Pending", de: "? Ausstehend", lb: "? Ausstänneg", pt: "? Pendente" },
    exportNote: { fr: "Note:", en: "Note:", de: "Anmerkung:", lb: "Notiz:", pt: "Nota:" },
    exportNotesGenerales: { fr: "NOTES GÉNÉRALES", en: "GENERAL NOTES", de: "ALLGEMEINE ANMERKUNGEN", lb: "ALLGEMENG NOTIZEN", pt: "NOTAS GERAIS" },

    // Note placeholder
    notePlaceholder: { fr: "Note...", en: "Note...", de: "Notiz...", lb: "Notiz...", pt: "Nota..." },

    // General notes
    notesGenerales: { fr: "Notes générales", en: "General notes", de: "Allgemeine Anmerkungen", lb: "Allgemeng Notizen", pt: "Notas gerais" },
    notesPlaceholder: { fr: "Observations complémentaires, points d'attention...", en: "Additional observations, points of attention...", de: "Zusätzliche Beobachtungen, Aufmerksamkeitspunkte...", lb: "Zousätzlech Beobachtungen, Opmierksamkeetspunkten...", pt: "Observações complementares, pontos de atenção..." },

    // Action buttons
    btnExportTxt: { fr: "Exporter rapport (TXT)", en: "Export report (TXT)", de: "Bericht exportieren (TXT)", lb: "Bericht exportéieren (TXT)", pt: "Exportar relatório (TXT)" },
    btnExportJson: { fr: "Exporter données (JSON)", en: "Export data (JSON)", de: "Daten exportieren (JSON)", lb: "Daten exportéieren (JSON)", pt: "Exportar dados (JSON)" },
    btnNouvelle: { fr: "Nouvelle inspection", en: "New inspection", de: "Neue Inspektion", lb: "Nei Inspektioun", pt: "Nova inspeção" },

    // Legal info box
    legalTitle: { fr: "Usage hors connexion :", en: "Offline usage:", de: "Offline-Nutzung:", lb: "Offline-Notzung:", pt: "Uso offline:" },
    legalText: { fr: "cette page sauvegarde automatiquement dans le stockage local de votre navigateur. Vous pouvez remplir la checklist sur le terrain sans connexion internet. Exportez le rapport avant d'effacer les données. Compatible mobile (responsive).", en: "this page automatically saves to your browser's local storage. You can fill the checklist on-site without an internet connection. Export the report before clearing data. Mobile compatible (responsive).", de: "diese Seite speichert automatisch im lokalen Speicher Ihres Browsers. Sie können die Checkliste vor Ort ohne Internetverbindung ausfüllen. Exportieren Sie den Bericht vor dem Löschen der Daten. Mobilkompatibel (responsive).", lb: "dës Säit späichert automatesch am lokale Späicher vun Ärem Browser. Dir kënnt d'Checklist um Terrain ouni Internetverbindung ausfëllen. Exportéiert de Bericht ier Dir d'Donnéeën läscht. Mobilkompatibel (responsive).", pt: "esta página grava automaticamente no armazenamento local do seu navegador. Pode preencher a checklist no terreno sem ligação à internet. Exporte o relatório antes de apagar os dados. Compatível com telemóvel (responsivo)." },

    // Section titles
    sectionIdentification: { fr: "1. Identification du bien", en: "1. Property identification", de: "1. Immobilienidentifikation", lb: "1. Identifikatioun vun der Immobilie", pt: "1. Identificação do imóvel" },
    sectionEnvironnement: { fr: "2. Environnement & localisation", en: "2. Environment & location", de: "2. Umgebung & Lage", lb: "2. Ëmfeld & Lag", pt: "2. Ambiente & localização" },
    sectionExterieur: { fr: "3. État extérieur", en: "3. Exterior condition", de: "3. Außenzustand", lb: "3. Äusseren Zoustand", pt: "3. Estado exterior" },
    sectionInterieur: { fr: "4. État intérieur", en: "4. Interior condition", de: "4. Innenzustand", lb: "4. Bannenzoustand", pt: "4. Estado interior" },
    sectionEnergetique: { fr: "5. Performance énergétique", en: "5. Energy performance", de: "5. Energetische Leistung", lb: "5. Energetesch Leeschtung", pt: "5. Desempenho energético" },
    sectionJuridique: { fr: "6. Aspects juridiques & documents", en: "6. Legal aspects & documents", de: "6. Rechtliche Aspekte & Dokumente", lb: "6. Juristesch Aspekter & Dokumenter", pt: "6. Aspetos jurídicos & documentos" },
    sectionPhotos: { fr: "7. Relevé photographique", en: "7. Photographic record", de: "7. Fotografische Aufnahme", lb: "7. Fotographesch Opnam", pt: "7. Registo fotográfico" },

    // Checklist items — 1. Identification
    checkAdresse: { fr: "Adresse complète vérifiée", en: "Full address verified", de: "Vollständige Adresse überprüft", lb: "Komplett Adress iwwerpréift", pt: "Morada completa verificada" },
    checkCadastre: { fr: "Référence cadastrale relevée", en: "Cadastral reference noted", de: "Katasterreferenz erfasst", lb: "Katasterreferenz erfaasst", pt: "Referência cadastral anotada" },
    checkAcces: { fr: "Accès au bien confirmé", en: "Property access confirmed", de: "Zugang zur Immobilie bestätigt", lb: "Zougang zur Immobilie bestätegt", pt: "Acesso ao imóvel confirmado" },
    checkProprietaire: { fr: "Identité du propriétaire/contact", en: "Owner/contact identity", de: "Identität des Eigentümers/Kontakts", lb: "Identitéit vum Proprietaire/Kontakt", pt: "Identidade do proprietário/contacto" },
    checkTypeBien: { fr: "Type de bien (appartement, maison, terrain, commercial)", en: "Property type (apartment, house, land, commercial)", de: "Immobilientyp (Wohnung, Haus, Grundstück, Gewerbe)", lb: "Typ vun der Immobilie (Appartement, Haus, Terrain, Gewierflech)", pt: "Tipo de imóvel (apartamento, casa, terreno, comercial)" },

    // Checklist items — 2. Environnement
    checkQuartier: { fr: "Caractéristiques du quartier", en: "Neighbourhood characteristics", de: "Stadtviertelmerkmale", lb: "Quartiersmierkmolen", pt: "Características do bairro" },
    checkTransports: { fr: "Desserte transports en commun (bus, tram, gare)", en: "Public transport access (bus, tram, station)", de: "ÖPNV-Anbindung (Bus, Tram, Bahnhof)", lb: "Ëffentleche Transport (Bus, Tram, Gare)", pt: "Acesso a transportes públicos (autocarro, elétrico, estação)" },
    checkCommerces: { fr: "Proximité commerces et services", en: "Proximity to shops and services", de: "Nähe zu Geschäften und Dienstleistungen", lb: "Proximitéit zu Geschäfter a Servicer", pt: "Proximidade de comércio e serviços" },
    checkNuisances: { fr: "Nuisances identifiées (bruit, olfactives, visuelles)", en: "Nuisances identified (noise, smell, visual)", de: "Erkannte Belästigungen (Lärm, Geruch, optisch)", lb: "Identifizéiert Belaaschtungen (Kaméidi, Geroch, visuell)", pt: "Perturbações identificadas (ruído, olfativas, visuais)" },
    checkZoneInondable: { fr: "Zone inondable / risques naturels", en: "Flood zone / natural risks", de: "Überschwemmungsgebiet / Naturrisiken", lb: "Iwwerschwemmungsgebitt / Naturrisiken", pt: "Zona inundável / riscos naturais" },
    checkPluPad: { fr: "PAG/PAP — classement urbanistique", en: "PAG/PAP — urban classification", de: "PAG/PAP — städtebauliche Einstufung", lb: "PAG/PAP — urbanistisch Klassement", pt: "PAG/PAP — classificação urbanística" },

    // Checklist items — 3. Extérieur
    checkFacade: { fr: "État de la façade (fissures, enduit, ravalement)", en: "Facade condition (cracks, render, restoration)", de: "Fassadenzustand (Risse, Putz, Sanierung)", lb: "Fassadenzoustand (Rëss, Verputz, Sanéierung)", pt: "Estado da fachada (fissuras, reboco, restauro)" },
    checkToiture: { fr: "État de la toiture visible", en: "Visible roof condition", de: "Sichtbarer Dachzustand", lb: "Siichtbare Daachzoustand", pt: "Estado visível da cobertura" },
    checkMenuiseriesExt: { fr: "Menuiseries extérieures (fenêtres, volets)", en: "External joinery (windows, shutters)", de: "Außentischlerei (Fenster, Rolläden)", lb: "Äusser Schreinerei (Fënstere, Rollladen)", pt: "Caixilharia exterior (janelas, persianas)" },
    checkPartiesCommunes: { fr: "Parties communes (hall, escalier, ascenseur)", en: "Common areas (hall, stairs, elevator)", de: "Gemeinschaftsbereiche (Flur, Treppe, Aufzug)", lb: "Gemeinschaftsberäicher (Hall, Trapp, Ascenseur)", pt: "Partes comuns (hall, escadas, elevador)" },
    checkParking: { fr: "Stationnement (type, nombre de places)", en: "Parking (type, number of spaces)", de: "Stellplatz (Art, Anzahl Plätze)", lb: "Parking (Typ, Zuel vu Plazen)", pt: "Estacionamento (tipo, número de lugares)" },
    checkEspacesVerts: { fr: "Espaces verts / terrasse / balcon", en: "Green spaces / terrace / balcony", de: "Grünflächen / Terrasse / Balkon", lb: "Gréngflächen / Terrass / Balcon", pt: "Espaços verdes / terraço / varanda" },

    // Checklist items — 4. Intérieur
    checkSurface: { fr: "Surface habitable mesurée / vérifiée", en: "Living area measured / verified", de: "Wohnfläche gemessen / überprüft", lb: "Wunnfläch gemooss / iwwerpréift", pt: "Área habitável medida / verificada" },
    checkDistribution: { fr: "Distribution des pièces (cohérence, luminosité)", en: "Room layout (coherence, brightness)", de: "Raumaufteilung (Kohärenz, Helligkeit)", lb: "Raumopdeeling (Kohärenz, Hellegkeet)", pt: "Distribuição dos cómodos (coerência, luminosidade)" },
    checkSols: { fr: "État des sols", en: "Floor condition", de: "Bodenzustand", lb: "Buedemzoustand", pt: "Estado dos pavimentos" },
    checkMurs: { fr: "État des murs et plafonds (fissures, humidité)", en: "Wall and ceiling condition (cracks, humidity)", de: "Wand- und Deckenzustand (Risse, Feuchtigkeit)", lb: "Mauer- an Deckezoustand (Rëss, Fiichtegkeet)", pt: "Estado das paredes e tetos (fissuras, humidade)" },
    checkMenuiseriesInt: { fr: "Menuiseries intérieures (portes, placard)", en: "Internal joinery (doors, cupboards)", de: "Innentischlerei (Türen, Schränke)", lb: "Banne Schreinerei (Dieren, Schaf)", pt: "Caixilharia interior (portas, armários)" },
    checkSdbCuisine: { fr: "Salle de bain et cuisine (équipements, état)", en: "Bathroom and kitchen (fittings, condition)", de: "Badezimmer und Küche (Ausstattung, Zustand)", lb: "Buedzëmmer a Kichen (Ausstattung, Zoustand)", pt: "Casa de banho e cozinha (equipamentos, estado)" },
    checkElectricite: { fr: "Installation électrique (tableau, conformité)", en: "Electrical installation (panel, compliance)", de: "Elektroinstallation (Sicherungskasten, Konformität)", lb: "Elektroinstallatioun (Sécherheetskëscht, Konformitéit)", pt: "Instalação elétrica (quadro, conformidade)" },
    checkPlomberie: { fr: "Plomberie (état visible, fuites)", en: "Plumbing (visible condition, leaks)", de: "Sanitärinstallation (sichtbarer Zustand, Lecks)", lb: "Sanitärinstallatioun (siichtbare Zoustand, Lecken)", pt: "Canalização (estado visível, fugas)" },
    checkChauffage: { fr: "Système de chauffage (type, état, entretien)", en: "Heating system (type, condition, maintenance)", de: "Heizsystem (Typ, Zustand, Wartung)", lb: "Heizungssystem (Typ, Zoustand, Ënnerhalt)", pt: "Sistema de aquecimento (tipo, estado, manutenção)" },
    checkVentilation: { fr: "Ventilation (VMC, naturelle)", en: "Ventilation (MVHR, natural)", de: "Belüftung (KWL, natürlich)", lb: "Belëftung (KWL, natiirlech)", pt: "Ventilação (VMC, natural)" },

    // Checklist items — 5. Energétique
    checkCpe: { fr: "CPE (Certificat de Performance Énergétique) disponible", en: "EPC (Energy Performance Certificate) available", de: "Energieausweis (CPE) verfügbar", lb: "Energieauswäis (CPE) verfügbar", pt: "CPE (Certificado de Desempenho Energético) disponível" },
    checkClasseEnergie: { fr: "Classe énergie relevée (A-I)", en: "Energy class noted (A-I)", de: "Energieklasse erfasst (A-I)", lb: "Energieklass erfaasst (A-I)", pt: "Classe energética anotada (A-I)" },
    checkClasseIsolation: { fr: "Classe isolation thermique relevée", en: "Thermal insulation class noted", de: "Wärmedämmklasse erfasst", lb: "Wärmedämmklass erfaasst", pt: "Classe de isolamento térmico anotada" },
    checkTypeVitrage: { fr: "Type de vitrage (simple, double, triple)", en: "Glazing type (single, double, triple)", de: "Verglasungstyp (einfach, doppelt, dreifach)", lb: "Verglasungstyp (einfach, duebel, dräifach)", pt: "Tipo de vidro (simples, duplo, triplo)" },
    checkIsolation: { fr: "Isolation identifiable (murs, toiture, sol)", en: "Identifiable insulation (walls, roof, floor)", de: "Erkennbare Dämmung (Wände, Dach, Boden)", lb: "Erkennbar Isolatioun (Maueren, Daach, Buedem)", pt: "Isolamento identificável (paredes, cobertura, pavimento)" },
    checkPanneaux: { fr: "Panneaux solaires / pompe à chaleur", en: "Solar panels / heat pump", de: "Solarpaneele / Wärmepumpe", lb: "Solarplatten / Wärmepompel", pt: "Painéis solares / bomba de calor" },

    // Checklist items — 6. Juridique
    checkTitrePropriete: { fr: "Titre de propriété vérifié", en: "Title deed verified", de: "Eigentumstitel überprüft", lb: "Proprietéitstitel iwwerpréift", pt: "Título de propriedade verificado" },
    checkServitudes: { fr: "Servitudes éventuelles identifiées", en: "Potential easements identified", de: "Eventuelle Dienstbarkeiten identifiziert", lb: "Eventuell Dienstbarkeeten identifizéiert", pt: "Servidões eventuais identificadas" },
    checkReglementCopro: { fr: "Règlement de copropriété (si applicable)", en: "Condominium rules (if applicable)", de: "Miteigentumsordnung (falls zutreffend)", lb: "Copropriétéitsreglement (wann zoutreffend)", pt: "Regulamento de condomínio (se aplicável)" },
    checkChargesCopro: { fr: "Charges de copropriété annuelles", en: "Annual condominium charges", de: "Jährliche Miteigentumskosten", lb: "Jäerlech Copropriétéitskäschten", pt: "Encargos de condomínio anuais" },
    checkTravauxVotes: { fr: "Travaux votés en AG (en cours / prévus)", en: "Works voted at GM (ongoing / planned)", de: "In HV beschlossene Arbeiten (laufend / geplant)", lb: "An HV ofgestëmmte Aarbechten (laafend / geplangt)", pt: "Obras votadas em AG (em curso / previstas)" },
    checkBailEnCours: { fr: "Bail en cours (type, durée, loyer)", en: "Current lease (type, duration, rent)", de: "Laufender Mietvertrag (Typ, Dauer, Miete)", lb: "Lafende Bail (Typ, Dauer, Loyer)", pt: "Contrato em curso (tipo, duração, renda)" },

    // Checklist items — 7. Photos
    checkPhotoFacade: { fr: "Photo façade principale", en: "Main facade photo", de: "Foto Hauptfassade", lb: "Foto Haaptfassad", pt: "Foto fachada principal" },
    checkPhotoRue: { fr: "Photo vue de la rue / environnement", en: "Street view / environment photo", de: "Foto Straßenansicht / Umgebung", lb: "Foto Stroossuesiicht / Ëmfeld", pt: "Foto vista da rua / ambiente" },
    checkPhotoSejour: { fr: "Photo pièce principale (séjour)", en: "Main room photo (living room)", de: "Foto Hauptraum (Wohnzimmer)", lb: "Foto Haaptraum (Wunnzëmmer)", pt: "Foto sala principal (sala de estar)" },
    checkPhotoCuisine: { fr: "Photo cuisine", en: "Kitchen photo", de: "Foto Küche", lb: "Foto Kichen", pt: "Foto cozinha" },
    checkPhotoSdb: { fr: "Photo salle de bain", en: "Bathroom photo", de: "Foto Badezimmer", lb: "Foto Buedzëmmer", pt: "Foto casa de banho" },
    checkPhotoChambres: { fr: "Photos chambres", en: "Bedroom photos", de: "Fotos Schlafzimmer", lb: "Fotoe Schlofzëmmer", pt: "Fotos quartos" },
    checkPhotoExterieur: { fr: "Photo espaces extérieurs", en: "Outdoor spaces photo", de: "Foto Außenbereiche", lb: "Foto Äussere Beräicher", pt: "Foto espaços exteriores" },
    checkPhotoDefauts: { fr: "Photos des défauts / anomalies identifiés", en: "Photos of identified defects / anomalies", de: "Fotos erkannter Mängel / Anomalien", lb: "Fotoe vun identifizéierte Mängel / Anomalien", pt: "Fotos dos defeitos / anomalias identificados" },
  },

  /* ===================================================================
   *  transparencePage — src/app/transparence/client.tsx
   * =================================================================== */
  transparencePage: {
    // Page header
    backLink: { fr: "← tevaxia.lu", en: "← tevaxia.lu", de: "← tevaxia.lu", lb: "← tevaxia.lu", pt: "← tevaxia.lu" },
    pageTitle: { fr: "Transparence du modèle d'estimation", en: "Estimation model transparency", de: "Transparenz des Schätzmodells", lb: "Transparenz vum Schätzmodell", pt: "Transparência do modelo de estimativa" },
    pageDescription: { fr: "Méthodologie, coefficients, sources de données et résultats de back-test. Cette page est publique : tout utilisateur peut vérifier la qualité et les limites de notre modèle.", en: "Methodology, coefficients, data sources and back-test results. This page is public: any user can verify the quality and limitations of our model.", de: "Methodik, Koeffizienten, Datenquellen und Back-Test-Ergebnisse. Diese Seite ist öffentlich: jeder Nutzer kann die Qualität und Grenzen unseres Modells überprüfen.", lb: "Methodik, Koeffizienten, Datenquellen a Back-Test-Resultater. Dës Säit ass ëffentlech: all Benotzer kann d'Qualitéit an d'Limiten vun eisem Modell iwwerpréiwen.", pt: "Metodologia, coeficientes, fontes de dados e resultados de back-test. Esta página é pública: qualquer utilizador pode verificar a qualidade e as limitações do nosso modelo." },

    // KPI labels
    kpiMape: { fr: "MAPE", en: "MAPE", de: "MAPE", lb: "MAPE", pt: "MAPE" },
    kpiMapeDesc: { fr: "Erreur absolue moyenne (%)", en: "Mean absolute percentage error", de: "Mittlerer absoluter prozentualer Fehler", lb: "Mëttlere absolute prozentualen Feeler", pt: "Erro absoluto percentual médio" },
    kpiMediane: { fr: "Erreur médiane", en: "Median error", de: "Medianfehler", lb: "Medianfeeler", pt: "Erro mediano" },
    kpiMedianeDesc: { fr: "50e percentile d'erreur", en: "50th percentile of error", de: "50. Fehler-Perzentil", lb: "50. Feeler-Perzentil", pt: "Percentil 50 de erro" },
    kpiR2: { fr: "R² approx.", en: "R² approx.", de: "R² ca.", lb: "R² ca.", pt: "R² aprox." },
    kpiR2Desc: { fr: "Coefficient de détermination", en: "Coefficient of determination", de: "Bestimmtheitsmaß", lb: "Bestëmmtheetsmooss", pt: "Coeficiente de determinação" },
    kpiBiens: { fr: "Biens-test", en: "Test properties", de: "Testimmobilien", lb: "Testimmobilien", pt: "Imóveis-teste" },
    kpiBiensDesc: { fr: "Échantillon de validation", en: "Validation sample", de: "Validierungsstichprobe", lb: "Validéierungsstéchprouw", pt: "Amostra de validação" },

    // Methodology section
    sectionMethodologie: { fr: "Méthodologie", en: "Methodology", de: "Methodik", lb: "Methodik", pt: "Metodologia" },
    methodoP1: { fr: "Le modèle combine un prix de référence au m² (par commune ou quartier, issu de l'Observatoire de l'Habitat via data.public.lu) avec des ajustements multiplicatifs reflétant les caractéristiques intrinsèques du bien. Ce n'est pas un AVM (Automated Valuation Model) au sens bancaire — il ne dispose pas de l'exhaustivité des actes notariés.", en: "The model combines a reference price per m² (by municipality or neighbourhood, from the Observatoire de l'Habitat via data.public.lu) with multiplicative adjustments reflecting the property's intrinsic characteristics. This is not an AVM (Automated Valuation Model) in the banking sense — it does not have the completeness of notarial deeds.", de: "Das Modell kombiniert einen Referenzpreis pro m² (nach Gemeinde oder Stadtviertel, vom Observatoire de l'Habitat über data.public.lu) mit multiplikativen Anpassungen, die die intrinsischen Eigenschaften der Immobilie widerspiegeln. Es handelt sich nicht um ein AVM (Automated Valuation Model) im Banksinne — es verfügt nicht über die Vollständigkeit der notariellen Urkunden.", lb: "De Modell kombinéiert e Referenzpräis pro m² (no Gemeng oder Quartier, vum Observatoire de l'Habitat iwwer data.public.lu) mat multiplikative Upassungen déi d'intrinsesch Eegeschafte vun der Immobilie reflektéieren. Et ass keen AVM (Automated Valuation Model) am Banksënn — et verfügt net iwwer d'Vollständegkeet vun den notarielle Akten.", pt: "O modelo combina um preço de referência por m² (por município ou bairro, do Observatoire de l'Habitat via data.public.lu) com ajustamentos multiplicativos que refletem as características intrínsecas do imóvel. Não é um AVM (Automated Valuation Model) no sentido bancário — não dispõe da exaustividade dos atos notariais." },
    methodoApproche: { fr: "L'approche est log-linéaire :", en: "The approach is log-linear:", de: "Der Ansatz ist log-linear:", lb: "Den Ansaz ass log-linear:", pt: "A abordagem é log-linear:" },
    methodoP2: { fr: "Chaque ajustement est un pourcentage additif (positif ou négatif) appliqué au prix de base. Les coefficients proviennent de l'Observatoire de l'Habitat, des analyses Spuerkeess et de la pratique professionnelle d'évaluation au Luxembourg.", en: "Each adjustment is an additive percentage (positive or negative) applied to the base price. The coefficients come from the Observatoire de l'Habitat, Spuerkeess analyses and professional valuation practice in Luxembourg.", de: "Jede Anpassung ist ein additiver Prozentsatz (positiv oder negativ), der auf den Basispreis angewandt wird. Die Koeffizienten stammen vom Observatoire de l'Habitat, den Spuerkeess-Analysen und der professionellen Bewertungspraxis in Luxemburg.", lb: "All Upassung ass e additive Prozentsaz (positiv oder negativ) dee op de Basispräis applizéiert gëtt. D'Koeffizienten kommen vum Observatoire de l'Habitat, de Spuerkeess-Analysen an der professioneller Bewäertungspraxis zu Lëtzebuerg.", pt: "Cada ajustamento é uma percentagem aditiva (positiva ou negativa) aplicada ao preço base. Os coeficientes provêm do Observatoire de l'Habitat, das análises Spuerkeess e da prática profissional de avaliação no Luxemburgo." },

    // Sources section
    sectionSources: { fr: "Sources de données", en: "Data sources", de: "Datenquellen", lb: "Datenquellen", pt: "Fontes de dados" },
    thSource: { fr: "Source", en: "Source", de: "Quelle", lb: "Quell", pt: "Fonte" },
    thDonnees: { fr: "Données utilisées", en: "Data used", de: "Verwendete Daten", lb: "Benotzten Daten", pt: "Dados utilizados" },
    thFrequence: { fr: "Fréquence de MAJ", en: "Update frequency", de: "Aktualisierungshäufigkeit", lb: "Aktualiséierungsheefegkeet", pt: "Frequência de atualização" },
    thAcces: { fr: "Accès", en: "Access", de: "Zugang", lb: "Zougang", pt: "Acesso" },
    // Source rows
    srcObservatoire: { fr: "Observatoire de l'Habitat", en: "Observatoire de l'Habitat", de: "Observatoire de l'Habitat", lb: "Observatoire de l'Habitat", pt: "Observatoire de l'Habitat" },
    srcObservatoireData: { fr: "Prix/m² par commune, quartiers Lux-Ville, modèle hédonique", en: "Price/m² per municipality, Lux-City neighbourhoods, hedonic model", de: "Preis/m² pro Gemeinde, Lux-Stadt Stadtteile, hedonisches Modell", lb: "Präis/m² pro Gemeng, Lux-Stad Quartieren, hedonesche Modell", pt: "Preço/m² por município, bairros Lux-Cidade, modelo hedónico" },
    srcObservatoireFreq: { fr: "Trimestriel", en: "Quarterly", de: "Vierteljährlich", lb: "Véierteljäerlech", pt: "Trimestral" },
    srcStatec: { fr: "STATEC", en: "STATEC", de: "STATEC", lb: "STATEC", pt: "STATEC" },
    srcStatecData: { fr: "Indices de prix résidentiels annuels, IPC", en: "Annual residential price indices, CPI", de: "Jährliche Wohnpreisindizes, VPI", lb: "Jäerlech Wunnpräisindizen, VPI", pt: "Índices de preços residenciais anuais, IPC" },
    srcStatecFreq: { fr: "Annuel", en: "Annual", de: "Jährlich", lb: "Jäerlech", pt: "Anual" },
    srcSpuerkeess: { fr: "Spuerkeess", en: "Spuerkeess", de: "Spuerkeess", lb: "Spuerkeess", pt: "Spuerkeess" },
    srcSpuerkeessData: { fr: "Impact classe énergie sur prix de vente", en: "Energy class impact on sale price", de: "Auswirkung der Energieklasse auf den Verkaufspreis", lb: "Impakt Energieklass op de Verkafspräis", pt: "Impacto da classe energética no preço de venda" },
    srcSpuerkeessFreq: { fr: "Annuel", en: "Annual", de: "Jährlich", lb: "Jäerlech", pt: "Anual" },
    srcPublicationAnnuelle: { fr: "Publication annuelle", en: "Annual publication", de: "Jährliche Veröffentlichung", lb: "Jäerlech Verëffentlechung", pt: "Publicação anual" },
    srcPubliciteFonciere: { fr: "Publicité Foncière", en: "Land Registry", de: "Grundbuchamt", lb: "Grondbuchemter", pt: "Registo Predial" },
    srcPubliciteFonciereData: { fr: "Volume transactions par commune (nombre d'actes)", en: "Transaction volume per municipality (number of deeds)", de: "Transaktionsvolumen pro Gemeinde (Anzahl Urkunden)", lb: "Transaktiounsvolumen pro Gemeng (Zuel Akten)", pt: "Volume de transações por município (número de atos)" },
    srcViaObservatoire: { fr: "Via Observatoire", en: "Via Observatory", de: "Über Observatoire", lb: "Iwwer Observatoire", pt: "Via Observatório" },
    srcAnnoncesImmo: { fr: "Annonces immobilières", en: "Property listings", de: "Immobilienanzeigen", lb: "Immobilienannoncen", pt: "Anúncios imobiliários" },
    srcAnnoncesImmoData: { fr: "Prix demandés agrégés (loyers, ventes)", en: "Aggregated asking prices (rentals, sales)", de: "Aggregierte Angebotspreise (Mieten, Verkäufe)", lb: "Aggregéiert Offerpräisser (Loyeren, Verkaf)", pt: "Preços pedidos agregados (rendas, vendas)" },
    srcContinu: { fr: "Continu", en: "Continuous", de: "Laufend", lb: "Laafend", pt: "Contínuo" },

    // Coefficients section
    sectionCoefficients: { fr: "Coefficients d'ajustement", en: "Adjustment coefficients", de: "Anpassungskoeffizienten", lb: "Upassungskoeffizienten", pt: "Coeficientes de ajustamento" },
    coeffParametres: { fr: "paramètres", en: "parameters", de: "Parameter", lb: "Parameteren", pt: "parâmetros" },
    coeffDesc: { fr: "Chaque coefficient est un pourcentage appliqué au prix de référence au m². Le niveau de confiance reflète la robustesse statistique de la source.", en: "Each coefficient is a percentage applied to the reference price per m². The confidence level reflects the statistical robustness of the source.", de: "Jeder Koeffizient ist ein Prozentsatz, der auf den Referenzpreis pro m² angewandt wird. Das Konfidenzniveau spiegelt die statistische Robustheit der Quelle wider.", lb: "All Koeffizient ass e Prozentsaz dee op de Referenzpräis pro m² applizéiert gëtt. De Konfidenznivoau reflektéiert d'statistesch Robustheet vun der Quell.", pt: "Cada coeficiente é uma percentagem aplicada ao preço de referência por m². O nível de confiança reflete a robustez estatística da fonte." },
    thCaracteristique: { fr: "Caractéristique", en: "Feature", de: "Merkmal", lb: "Mierkmal", pt: "Característica" },
    thCoefficient: { fr: "Coefficient", en: "Coefficient", de: "Koeffizient", lb: "Koeffizient", pt: "Coeficiente" },
    thSourceCoeff: { fr: "Source", en: "Source", de: "Quelle", lb: "Quell", pt: "Fonte" },
    thConfiance: { fr: "Confiance", en: "Confidence", de: "Konfidenz", lb: "Konfidenz", pt: "Confiança" },

    // Confidence levels
    confForte: { fr: "Forte", en: "High", de: "Hoch", lb: "Héich", pt: "Alta" },
    confMoyenne: { fr: "Moyenne", en: "Medium", de: "Mittel", lb: "Mëttel", pt: "Média" },
    confFaible: { fr: "Faible", en: "Low", de: "Niedrig", lb: "Niddreg", pt: "Baixa" },

    // Back-test section
    sectionBacktest: { fr: "Résultats du back-test", en: "Back-test results", de: "Back-Test-Ergebnisse", lb: "Back-Test-Resultater", pt: "Resultados do back-test" },
    backtestBiens: { fr: "biens", en: "properties", de: "Immobilien", lb: "Immobilien", pt: "imóveis" },
    backtestDesc: { fr: "Comparaison entre le prix réel de référence et l'estimation produite par le modèle. Les prix réels sont issus de fourchettes observées sur les communes concernées.", en: "Comparison between the actual reference price and the model's estimate. Actual prices are derived from ranges observed in the relevant municipalities.", de: "Vergleich zwischen dem tatsächlichen Referenzpreis und der Modellschätzung. Die tatsächlichen Preise stammen aus beobachteten Spannen in den betreffenden Gemeinden.", lb: "Vergläich tëschent dem reelle Referenzpräis an der Modellschätzung. Déi reell Präisser kommen aus beobachte Spannen an de betraffene Gemengen.", pt: "Comparação entre o preço real de referência e a estimativa produzida pelo modelo. Os preços reais são derivados de intervalos observados nos municípios em questão." },
    thCommune: { fr: "Commune", en: "Municipality", de: "Gemeinde", lb: "Gemeng", pt: "Município" },
    thSurface: { fr: "Surface", en: "Area", de: "Fläche", lb: "Fläch", pt: "Área" },
    thEnergie: { fr: "Énergie", en: "Energy", de: "Energie", lb: "Energie", pt: "Energia" },
    thPrixReel: { fr: "Prix réel", en: "Actual price", de: "Tatsächlicher Preis", lb: "Reelle Präis", pt: "Preço real" },
    thEstimation: { fr: "Estimation", en: "Estimate", de: "Schätzung", lb: "Schätzung", pt: "Estimativa" },
    thErreur: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    mapeFooter: { fr: "MAPE (erreur absolue moyenne)", en: "MAPE (mean absolute error)", de: "MAPE (mittlerer absoluter Fehler)", lb: "MAPE (mëttlere absolute Feeler)", pt: "MAPE (erro absoluto médio)" },

    // Limitations section
    sectionLimites: { fr: "Limites du modèle", en: "Model limitations", de: "Modellgrenzen", lb: "Modellgrenzen", pt: "Limitações do modelo" },
    limite1: { fr: "Les données de l'Observatoire sont agrégées par commune — la granularité infra-communale (rue, lotissement) n'est pas captée.", en: "Observatory data is aggregated by municipality — sub-municipal granularity (street, subdivision) is not captured.", de: "Die Daten des Observatoire sind nach Gemeinden aggregiert — die infrakommunale Granularität (Straße, Baugebiet) wird nicht erfasst.", lb: "D'Daten vum Observatoire sinn no Gemenge aggregéiert — d'infrakommunal Granularitéit (Strooss, Lotissement) gëtt net erfaasst.", pt: "Os dados do Observatório são agregados por município — a granularidade inframunicípal (rua, loteamento) não é captada." },
    limite2: { fr: "Les biens atypiques (châteaux, immeubles de rapport, maisons d'architecte) ne relèvent pas de ce modèle.", en: "Atypical properties (castles, investment buildings, architect-designed houses) are not covered by this model.", de: "Atypische Immobilien (Schlösser, Renditeobjekte, Architektenhäuser) fallen nicht unter dieses Modell.", lb: "Atypesch Immobilien (Schläss, Renteobjekter, Architektenhäiser) falen net ënner dëse Modell.", pt: "Os imóveis atípicos (castelos, prédios de rendimento, casas de arquiteto) não são abrangidos por este modelo." },
    limite3: { fr: "L'effet de micromarché (vue, nuisances, orientation) n'est pas modélisé faute de données structurées.", en: "Micro-market effects (view, nuisances, orientation) are not modelled due to lack of structured data.", de: "Mikromarkteffekte (Aussicht, Belästigungen, Ausrichtung) werden mangels strukturierter Daten nicht modelliert.", lb: "Mikromaarteffekter (Aussicht, Belaaschtungen, Orientéierung) ginn net modelléiert well strukturéiert Daten feelen.", pt: "O efeito de micromercado (vista, perturbações, orientação) não é modelado por falta de dados estruturados." },
    limite4: { fr: "Les prix de référence reflètent les actes T-4 ; en marché très dynamique, un décalage de 3-6 mois peut exister.", en: "Reference prices reflect T-4 deeds; in a very dynamic market, a 3-6 month lag may exist.", de: "Die Referenzpreise spiegeln T-4 Urkunden wider; in einem sehr dynamischen Markt kann eine Verzögerung von 3-6 Monaten bestehen.", lb: "D'Referenzpräisser reflektéieren T-4 Akten; an engem ganz dynamesche Maart kann eng Verzögerung vu 3-6 Méint bestoen.", pt: "Os preços de referência refletem os atos T-4; num mercado muito dinâmico, pode existir um desfasamento de 3-6 meses." },
    limite5: { fr: "Ce modèle ne remplace pas une expertise TEGOVA/RICS avec visite physique — il fournit un ordre de grandeur rapide.", en: "This model does not replace a TEGOVA/RICS expert valuation with physical visit — it provides a quick order of magnitude.", de: "Dieses Modell ersetzt keine TEGOVA/RICS-Bewertung mit physischer Besichtigung — es liefert eine schnelle Größenordnung.", lb: "Dëse Modell ersetzt keng TEGOVA/RICS-Bewertung mat physescher Besichtigung — en liwwert eng séier Gréissenordnung.", pt: "Este modelo não substitui uma peritagem TEGOVA/RICS com visita física — fornece uma ordem de grandeza rápida." },

    // Engagement box
    engagementTitle: { fr: "Engagement de transparence :", en: "Transparency commitment:", de: "Transparenzverpflichtung:", lb: "Transparenzverpflichtung:", pt: "Compromisso de transparência:" },
    engagementText: { fr: "cette page sera mise à jour à chaque recalibration (trimestrielle, alignée sur les publications de l'Observatoire). Les utilisateurs professionnels (banques, agences) peuvent vérifier la fiabilité du modèle avant de l'intégrer dans leur workflow.", en: "this page will be updated with each recalibration (quarterly, aligned with Observatory publications). Professional users (banks, agencies) can verify the model's reliability before integrating it into their workflow.", de: "diese Seite wird bei jeder Rekalibrierung aktualisiert (vierteljährlich, abgestimmt auf die Veröffentlichungen des Observatoire). Professionelle Nutzer (Banken, Agenturen) können die Zuverlässigkeit des Modells überprüfen, bevor sie es in ihren Workflow integrieren.", lb: "dës Säit gëtt bei all Rekalibrierung aktualiséiert (véierteljäerlech, ofgestëmmt op d'Veröffentlechungen vum Observatoire). Professionell Benotzer (Banken, Agenturen) kënnen d'Zouverlässegkeet vum Modell iwwerpréiwen ier se en an hire Workflow integréieren.", pt: "esta página será atualizada a cada recalibração (trimestral, alinhada com as publicações do Observatório). Os utilizadores profissionais (bancos, agências) podem verificar a fiabilidade do modelo antes de o integrar no seu workflow." },
  },
};

// ---- Inject into message files ----

for (const lang of LANGS) {
  const filePath = `${MSG_DIR}/${lang}.json`;
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  for (const [namespace, keys] of Object.entries(NEW_KEYS)) {
    if (!data[namespace]) data[namespace] = {};
    for (const [key, translations] of Object.entries(keys)) {
      // Only write if key doesn't already exist (don't overwrite)
      if (data[namespace][key] === undefined) {
        data[namespace][key] = translations[lang];
      }
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`✓ ${filePath} updated`);
}

console.log("Done — all 5 message files updated.");
