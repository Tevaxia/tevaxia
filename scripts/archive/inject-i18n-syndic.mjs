// Inject i18n keys for syndic management pages + rental payments page
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

const NEW_KEYS = {
  /* ===================================================================
   *  syndicCoproprietes — src/app/syndic/coproprietes/page.tsx
   * =================================================================== */
  syndicCoproprietes: {
    // Error messages
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    errorCreation: { fr: "Erreur création", en: "Creation error", de: "Erstellungsfehler", lb: "Erstellungsfeeler", pt: "Erro de criação" },
    errorDeletion: { fr: "Erreur suppression", en: "Deletion error", de: "Löschfehler", lb: "Läschfeeler", pt: "Erro de eliminação" },
    // Auth
    loginPrompt: { fr: "Connectez-vous pour accéder au dashboard syndic.", en: "Log in to access the syndic dashboard.", de: "Melden Sie sich an, um auf das Syndic-Dashboard zuzugreifen.", lb: "Loggt Iech an fir den Syndic-Dashboard ze benotzen.", pt: "Faça login para aceder ao painel do síndico." },
    loginButton: { fr: "Se connecter", en: "Log in", de: "Anmelden", lb: "Aloggen", pt: "Iniciar sessão" },
    // Breadcrumb
    backSyndic: { fr: "← Syndic", en: "← Syndic", de: "← Syndic", lb: "← Syndic", pt: "← Síndico" },
    // Page header
    title: { fr: "Mes copropriétés", en: "My condominiums", de: "Meine Miteigentümergemeinschaften", lb: "Meng Copropriétéiten", pt: "As minhas copropriedades" },
    subtitle: { fr: "Gestion des copropriétés sous mandat de votre cabinet syndic. Chaque copropriété regroupe ses lots avec leurs quotes-parts (millièmes).", en: "Manage condominiums under your syndic firm's mandate. Each condominium groups its units with their shares (thousandths).", de: "Verwaltung der Miteigentümergemeinschaften unter dem Mandat Ihrer Hausverwaltung. Jede Gemeinschaft gruppiert ihre Einheiten mit ihren Miteigentumsanteilen (Tausendstel).", lb: "Gestioun vun de Copropriétéiten ënnert dem Mandat vun Ärem Syndic-Büro. All Copropriétéit gruppéiert hir Loten mat hire Quoten (Tausendsten).", pt: "Gestão das copropriedades sob mandato do seu gabinete de síndico. Cada copropriedade agrupa os seus lotes com as suas quotas-partes (milésimos)." },
    createSyndicFirm: { fr: "Créer un cabinet syndic", en: "Create a syndic firm", de: "Hausverwaltung erstellen", lb: "Syndic-Büro erstellen", pt: "Criar gabinete de síndico" },
    // Empty state
    noFirm: { fr: "Aucun cabinet syndic", en: "No syndic firm", de: "Keine Hausverwaltung", lb: "Kee Syndic-Büro", pt: "Nenhum gabinete de síndico" },
    noFirmDesc: { fr: "Créez une organisation de type « Syndic / copropriété » depuis votre profil pour commencer à gérer vos copropriétés.", en: "Create a 'Syndic / condominium' type organization from your profile to start managing your condominiums.", de: "Erstellen Sie eine Organisation vom Typ 'Syndic / Miteigentümergemeinschaft' in Ihrem Profil, um mit der Verwaltung Ihrer Gemeinschaften zu beginnen.", lb: "Erstellt eng Organisatioun vum Typ 'Syndic / Copropriétéit' aus Ärem Profil fir mat der Gestioun vun Ären Copropriétéiten unzefänken.", pt: "Crie uma organização do tipo 'Síndico / condomínio' no seu perfil para começar a gerir as suas copropriedades." },
    // Org selector
    cabinetLabel: { fr: "Cabinet :", en: "Firm:", de: "Büro:", lb: "Büro:", pt: "Gabinete:" },
    // KPI cards
    kpiCoproprietes: { fr: "Copropriétés", en: "Condominiums", de: "Gemeinschaften", lb: "Copropriétéiten", pt: "Copropriedades" },
    kpiLotsTotaux: { fr: "Lots totaux", en: "Total units", de: "Gesamte Einheiten", lb: "Gesamt Loten", pt: "Lotes totais" },
    kpiCabinet: { fr: "Cabinet", en: "Firm", de: "Büro", lb: "Büro", pt: "Gabinete" },
    kpiCabinetType: { fr: "Syndic / copropriété", en: "Syndic / condominium", de: "Syndic / Miteigentümergemeinschaft", lb: "Syndic / Copropriétéit", pt: "Síndico / condomínio" },
    kpiAgAvenir: { fr: "AG à venir", en: "Upcoming GMs", de: "Kommende HV", lb: "Kommend HV", pt: "AGs futuras" },
    kpiDans3Mois: { fr: "dans 3 mois", en: "within 3 months", de: "in 3 Monaten", lb: "an 3 Méint", pt: "em 3 meses" },
    // Coownership list
    coproSousGestion: { fr: "Copropriétés sous gestion", en: "Condominiums under management", de: "Verwaltete Gemeinschaften", lb: "Verwalt Copropriétéiten", pt: "Copropriedades sob gestão" },
    cancel: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    addCopro: { fr: "+ Ajouter une copropriété", en: "+ Add a condominium", de: "+ Gemeinschaft hinzufügen", lb: "+ Copropriétéit derbäisetzen", pt: "+ Adicionar copropriedade" },
    // Create form
    placeholderName: { fr: "Nom de l'immeuble (ex. Résidence Belair)", en: "Building name (e.g. Résidence Belair)", de: "Gebäudename (z.B. Residenz Belair)", lb: "Gebainam (z.B. Residenz Belair)", pt: "Nome do edifício (ex. Residência Belair)" },
    placeholderAddress: { fr: "Adresse", en: "Address", de: "Adresse", lb: "Adress", pt: "Morada" },
    placeholderCommune: { fr: "Commune", en: "Municipality", de: "Gemeinde", lb: "Gemeng", pt: "Município" },
    placeholderTantiemes: { fr: "Total tantièmes (souvent 1000 ou 10000)", en: "Total shares (often 1000 or 10000)", de: "Gesamte Anteile (oft 1000 oder 10000)", lb: "Gesamt Tantièmen (oft 1000 oder 10000)", pt: "Total milésimos (geralmente 1000 ou 10000)" },
    createCopro: { fr: "Créer la copropriété", en: "Create the condominium", de: "Gemeinschaft erstellen", lb: "Copropriétéit erstellen", pt: "Criar a copropriedade" },
    // Empty list
    noCopro: { fr: "Aucune copropriété. Cliquez sur « + Ajouter une copropriété » pour commencer.", en: "No condominiums. Click '+ Add a condominium' to get started.", de: "Keine Gemeinschaften. Klicken Sie auf '+ Gemeinschaft hinzufügen', um zu beginnen.", lb: "Keng Copropriétéiten. Klickt op '+ Copropriétéit derbäisetzen' fir unzefänken.", pt: "Nenhuma copropriedade. Clique em '+ Adicionar copropriedade' para começar." },
    // Card details
    lotSingular: { fr: "lot", en: "unit", de: "Einheit", lb: "Lot", pt: "lote" },
    lotPlural: { fr: "lots", en: "units", de: "Einheiten", lb: "Loten", pt: "lotes" },
    tantièmes: { fr: "tantièmes", en: "shares", de: "Anteile", lb: "Tantièmen", pt: "milésimos" },
    annee: { fr: "Année", en: "Year", de: "Jahr", lb: "Joer", pt: "Ano" },
    derniereAg: { fr: "Dernière AG", en: "Last GM", de: "Letzte HV", lb: "Lescht HV", pt: "Última AG" },
    prochaineAg: { fr: "Prochaine AG", en: "Next GM", de: "Nächste HV", lb: "Nächst HV", pt: "Próxima AG" },
    voirLots: { fr: "Voir les lots →", en: "View units →", de: "Einheiten ansehen →", lb: "Loten ukucken →", pt: "Ver lotes →" },
    deleteTitle: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
    confirmDelete: { fr: "Supprimer cette copropriété ? Tous les lots associés seront également supprimés.", en: "Delete this condominium? All associated units will also be deleted.", de: "Diese Gemeinschaft löschen? Alle zugehörigen Einheiten werden ebenfalls gelöscht.", lb: "Dës Copropriétéit läschen? All verbonnen Loten ginn och geläscht.", pt: "Eliminar esta copropriedade? Todos os lotes associados serão também eliminados." },
  },

  /* ===================================================================
   *  syndicDetail — src/app/syndic/coproprietes/[id]/page.tsx
   * =================================================================== */
  syndicDetail: {
    // Error
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    loading: { fr: "Chargement…", en: "Loading…", de: "Laden…", lb: "Lueden…", pt: "A carregar…" },
    notFound: { fr: "Copropriété introuvable.", en: "Condominium not found.", de: "Miteigentümergemeinschaft nicht gefunden.", lb: "Copropriétéit net fonnt.", pt: "Copropriedade não encontrada." },
    backToList: { fr: "← Retour à la liste", en: "← Back to list", de: "← Zurück zur Liste", lb: "← Zréck op d'Lëscht", pt: "← Voltar à lista" },
    backCopros: { fr: "← Copropriétés", en: "← Condominiums", de: "← Gemeinschaften", lb: "← Copropriétéiten", pt: "← Copropriedades" },
    // Edit general
    cancel: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    editInfo: { fr: "Éditer les infos", en: "Edit info", de: "Infos bearbeiten", lb: "Infoen änneren", pt: "Editar infos" },
    save: { fr: "Enregistrer", en: "Save", de: "Speichern", lb: "Späicheren", pt: "Guardar" },
    placeholderAddress: { fr: "Adresse", en: "Address", de: "Adresse", lb: "Adress", pt: "Morada" },
    placeholderCommune: { fr: "Commune", en: "Municipality", de: "Gemeinde", lb: "Gemeng", pt: "Município" },
    placeholderYear: { fr: "Année de construction", en: "Year of construction", de: "Baujahr", lb: "Baujoer", pt: "Ano de construção" },
    placeholderFloors: { fr: "Nombre d'étages", en: "Number of floors", de: "Stockwerke", lb: "Zuel Stäck", pt: "Número de andares" },
    placeholderLastAg: { fr: "Dernière AG", en: "Last GM", de: "Letzte HV", lb: "Lescht HV", pt: "Última AG" },
    placeholderNextAg: { fr: "Prochaine AG", en: "Next GM", de: "Nächste HV", lb: "Nächst HV", pt: "Próxima AG" },
    elevator: { fr: "Ascenseur", en: "Elevator", de: "Aufzug", lb: "Ascenseur", pt: "Elevador" },
    // KPI
    kpiLots: { fr: "Lots", en: "Units", de: "Einheiten", lb: "Loten", pt: "Lotes" },
    kpiTotalTantiemes: { fr: "Total tantièmes", en: "Total shares", de: "Gesamtanteile", lb: "Gesamt Tantièmen", pt: "Total milésimos" },
    kpiAssigned: { fr: "Tantièmes attribués", en: "Assigned shares", de: "Zugewiesene Anteile", lb: "Zougewisen Tantièmen", pt: "Milésimos atribuídos" },
    kpiStatus: { fr: "Statut", en: "Status", de: "Status", lb: "Status", pt: "Estado" },
    kpiUsagePct: { fr: "écart", en: "gap", de: "Abweichung", lb: "Ofwäichung", pt: "desvio" },
    statusBalanced: { fr: "✓ Équilibré", en: "✓ Balanced", de: "✓ Ausgeglichen", lb: "✓ Ausgeglach", pt: "✓ Equilibrado" },
    statusMissing: { fr: "Lots manquants", en: "Missing units", de: "Fehlende Einheiten", lb: "Feelend Loten", pt: "Lotes em falta" },
    statusExcess: { fr: "Dépassement !", en: "Excess!", de: "Überschreitung!", lb: "Iwwerschreidung!", pt: "Excesso!" },
    // Actions
    fundsCallsButton: { fr: "Appels de fonds", en: "Funds calls", de: "Zahlungsaufforderungen", lb: "Fondsopruffen", pt: "Chamadas de fundos" },
    assembliesButton: { fr: "Assemblées générales", en: "General assemblies", de: "Hauptversammlungen", lb: "Generalversammlungen", pt: "Assembleias gerais" },
    accountingButton: { fr: "Comptabilité", en: "Accounting", de: "Buchhaltung", lb: "Comptabilitéit", pt: "Contabilidade" },
    // Unit list
    lotsTitle: { fr: "Lots", en: "Units", de: "Einheiten", lb: "Loten", pt: "Lotes" },
    addUnit: { fr: "+ Ajouter un lot", en: "+ Add a unit", de: "+ Einheit hinzufügen", lb: "+ Lot derbäisetzen", pt: "+ Adicionar lote" },
    editUnit: { fr: "Modifier le lot", en: "Edit unit", de: "Einheit bearbeiten", lb: "Lot änneren", pt: "Editar lote" },
    newUnit: { fr: "Nouveau lot", en: "New unit", de: "Neue Einheit", lb: "Neie Lot", pt: "Novo lote" },
    placeholderLotNumber: { fr: "N° de lot (ex. Lot 3)", en: "Unit # (e.g. Unit 3)", de: "Einheit-Nr. (z.B. Einheit 3)", lb: "Lot-Nr. (z.B. Lot 3)", pt: "N.º lote (ex. Lote 3)" },
    placeholderTantiemes: { fr: "Tantièmes", en: "Shares", de: "Anteile", lb: "Tantièmen", pt: "Milésimos" },
    placeholderFloor: { fr: "Étage", en: "Floor", de: "Stockwerk", lb: "Stack", pt: "Andar" },
    placeholderSurface: { fr: "Surface m²", en: "Area m²", de: "Fläche m²", lb: "Fläch m²", pt: "Área m²" },
    placeholderRooms: { fr: "Nombre de pièces", en: "Number of rooms", de: "Raumanzahl", lb: "Zuel Raim", pt: "Número de divisões" },
    placeholderOwner: { fr: "Copropriétaire", en: "Co-owner", de: "Miteigentümer", lb: "Mataigentümer", pt: "Coproprietário" },
    placeholderOwnerEmail: { fr: "Email copropriétaire", en: "Co-owner email", de: "E-Mail Miteigentümer", lb: "E-Mail Mataigentümer", pt: "Email coproprietário" },
    addUnitButton: { fr: "Ajouter le lot", en: "Add unit", de: "Einheit hinzufügen", lb: "Lot derbäisetzen", pt: "Adicionar lote" },
    saveUnit: { fr: "Enregistrer", en: "Save", de: "Speichern", lb: "Späicheren", pt: "Guardar" },
    editButton: { fr: "Éditer", en: "Edit", de: "Bearbeiten", lb: "Änneren", pt: "Editar" },
    deleteTitle: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
    confirmDeleteUnit: { fr: "Supprimer ce lot ?", en: "Delete this unit?", de: "Diese Einheit löschen?", lb: "Dëse Lot läschen?", pt: "Eliminar este lote?" },
    noUnits: { fr: "Aucun lot. Cliquez sur « + Ajouter un lot » pour commencer.", en: "No units. Click '+ Add a unit' to get started.", de: "Keine Einheiten. Klicken Sie auf '+ Einheit hinzufügen', um zu beginnen.", lb: "Keng Loten. Klickt op '+ Lot derbäisetzen' fir unzefänken.", pt: "Nenhum lote. Clique em '+ Adicionar lote' para começar." },
    // Table headers
    thLot: { fr: "Lot", en: "Unit", de: "Einheit", lb: "Lot", pt: "Lote" },
    thType: { fr: "Type", en: "Type", de: "Typ", lb: "Typ", pt: "Tipo" },
    thTantiemes: { fr: "Tantièmes", en: "Shares", de: "Anteile", lb: "Tantièmen", pt: "Milésimos" },
    thSurface: { fr: "Surface", en: "Area", de: "Fläche", lb: "Fläch", pt: "Área" },
    thOwner: { fr: "Copropriétaire", en: "Co-owner", de: "Miteigentümer", lb: "Mataigentümer", pt: "Coproprietário" },
    thStatus: { fr: "Statut", en: "Status", de: "Status", lb: "Status", pt: "Estado" },
    // Unit type labels
    unitApartment: { fr: "Appartement", en: "Apartment", de: "Wohnung", lb: "Appartement", pt: "Apartamento" },
    unitCommercial: { fr: "Local commercial", en: "Commercial unit", de: "Geschäftslokal", lb: "Geschäftslokal", pt: "Espaço comercial" },
    unitOffice: { fr: "Bureau", en: "Office", de: "Büro", lb: "Büro", pt: "Escritório" },
    unitParking: { fr: "Parking", en: "Parking", de: "Parkplatz", lb: "Parkplaz", pt: "Estacionamento" },
    unitCellar: { fr: "Cave", en: "Cellar", de: "Keller", lb: "Kellner", pt: "Cave" },
    unitOther: { fr: "Autre", en: "Other", de: "Sonstiges", lb: "Anert", pt: "Outro" },
    // Occupancy labels
    occOwner: { fr: "Occupé par le propriétaire", en: "Owner-occupied", de: "Selbstbewohnt", lb: "Vum Besëtzer bewunnt", pt: "Ocupado pelo proprietário" },
    occRented: { fr: "Loué", en: "Rented", de: "Vermietet", lb: "Verlouent", pt: "Arrendado" },
    occVacant: { fr: "Vacant", en: "Vacant", de: "Leer", lb: "Eidel", pt: "Vago" },
    occSeasonal: { fr: "Saisonnier", en: "Seasonal", de: "Saisonal", lb: "Saisonal", pt: "Sazonal" },
    // Roadmap note
    roadmapNote: { fr: "Prochaines fonctionnalités prévues : appels de fonds mensuels automatiques (génération PDF par lot selon tantièmes), module AG virtuelle (convocation + vote électronique + PV), plan comptable LU, espace copropriétaire restreint par lien d'invitation.", en: "Upcoming features: automatic monthly funds calls (PDF generation per unit based on shares), virtual GM module (convocation + e-voting + minutes), LU chart of accounts, restricted co-owner space via invitation link.", de: "Geplante Funktionen: automatische monatliche Zahlungsaufforderungen (PDF-Erstellung pro Einheit nach Anteilen), virtuelles HV-Modul (Einladung + E-Voting + Protokoll), LU-Kontenrahmen, eingeschränkter Miteigentümerbereich per Einladungslink.", lb: "Geplangte Funktionalitéiten: automatesch monatleche Fondsopruffen (PDF-Generéierung pro Lot no Tantièmen), virtuellen HV-Modul (Konvokatioun + elektronesche Vott + Protokoll), LU-Konteplan, ageschränkten Copropriétaire-Beräich iwwer Aluedungslink.", pt: "Próximas funcionalidades: chamadas de fundos mensais automáticas (geração PDF por lote segundo milésimos), módulo AG virtual (convocação + voto eletrónico + ata), plano de contas LU, espaço coproprietário restrito por link de convite." },
  },

  /* ===================================================================
   *  syndicAppels — src/app/syndic/coproprietes/[id]/appels/page.tsx
   * =================================================================== */
  syndicAppels: {
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    errorGeneration: { fr: "Erreur génération", en: "Generation error", de: "Generierungsfehler", lb: "Generéierungsfeeler", pt: "Erro de geração" },
    loading: { fr: "Chargement…", en: "Loading…", de: "Laden…", lb: "Lueden…", pt: "A carregar…" },
    // Page
    title: { fr: "Appels de fonds", en: "Funds calls", de: "Zahlungsaufforderungen", lb: "Fondsopruffen", pt: "Chamadas de fundos" },
    subtitle: { fr: "Génération et suivi des appels de fonds par période. Répartition automatique selon les tantièmes.", en: "Generation and tracking of funds calls by period. Automatic distribution by shares.", de: "Erstellung und Verfolgung der Zahlungsaufforderungen pro Periode. Automatische Verteilung nach Anteilen.", lb: "Generéierung an Tracking vun Fondsopruffen pro Period. Automatesch Verdeelung no Tantièmen.", pt: "Geração e acompanhamento de chamadas de fundos por período. Repartição automática segundo milésimos." },
    // Call list
    callsIssued: { fr: "Appels émis", en: "Issued calls", de: "Ausgestellte Aufforderungen", lb: "Ausgestallt Opruffen", pt: "Chamadas emitidas" },
    newCall: { fr: "+ Nouvel appel", en: "+ New call", de: "+ Neue Aufforderung", lb: "+ Neien Opruff", pt: "+ Nova chamada" },
    noCalls: { fr: "Aucun appel. Créez-en un.", en: "No calls. Create one.", de: "Keine Aufforderungen. Erstellen Sie eine.", lb: "Keng Opruffen. Erstellt eng.", pt: "Nenhuma chamada. Crie uma." },
    dueDate: { fr: "échéance", en: "due date", de: "Fälligkeitsdatum", lb: "Fällegkeetsdatum", pt: "vencimento" },
    // New call form
    placeholderLabel: { fr: "Libellé (ex. T1 2026)", en: "Label (e.g. Q1 2026)", de: "Bezeichnung (z.B. Q1 2026)", lb: "Beschreiwung (z.B. Q1 2026)", pt: "Descrição (ex. T1 2026)" },
    placeholderAmount: { fr: "Montant total (€)", en: "Total amount (€)", de: "Gesamtbetrag (€)", lb: "Gesamtbetrag (€)", pt: "Montante total (€)" },
    periodStart: { fr: "Début période", en: "Period start", de: "Periodenbeginn", lb: "Periodeufank", pt: "Início período" },
    periodEnd: { fr: "Fin période", en: "Period end", de: "Periodenende", lb: "Periodenenn", pt: "Fim período" },
    paymentDue: { fr: "Échéance paiement", en: "Payment due date", de: "Zahlungsfrist", lb: "Zahlungsfrist", pt: "Data de pagamento" },
    placeholderIban: { fr: "IBAN (LUxx xxxx xxxx xxxx xxxx)", en: "IBAN (LUxx xxxx xxxx xxxx xxxx)", de: "IBAN (LUxx xxxx xxxx xxxx xxxx)", lb: "IBAN (LUxx xxxx xxxx xxxx xxxx)", pt: "IBAN (LUxx xxxx xxxx xxxx xxxx)" },
    placeholderBic: { fr: "BIC", en: "BIC", de: "BIC", lb: "BIC", pt: "BIC" },
    placeholderHolder: { fr: "Titulaire du compte", en: "Account holder", de: "Kontoinhaber", lb: "Kontinhaber", pt: "Titular da conta" },
    createDraft: { fr: "Créer l'appel (brouillon)", en: "Create call (draft)", de: "Aufforderung erstellen (Entwurf)", lb: "Opruff erstellen (Brouillon)", pt: "Criar chamada (rascunho)" },
    cancel: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    // Call detail
    fromDate: { fr: "du", en: "from", de: "vom", lb: "vum", pt: "de" },
    toDate: { fr: "au", en: "to", de: "bis", lb: "bis", pt: "a" },
    // Status labels
    statusDraft: { fr: "Brouillon", en: "Draft", de: "Entwurf", lb: "Brouillon", pt: "Rascunho" },
    statusIssued: { fr: "Émis", en: "Issued", de: "Ausgestellt", lb: "Ausgestallt", pt: "Emitido" },
    statusPartiallyPaid: { fr: "Partiellement réglé", en: "Partially paid", de: "Teilweise bezahlt", lb: "Deelweis bezuelt", pt: "Parcialmente pago" },
    statusPaid: { fr: "Réglé", en: "Paid", de: "Bezahlt", lb: "Bezuelt", pt: "Pago" },
    statusOverdue: { fr: "En retard", en: "Overdue", de: "Überfällig", lb: "Iwwerfälleg", pt: "Atrasado" },
    statusCancelled: { fr: "Annulé", en: "Cancelled", de: "Storniert", lb: "Annuléiert", pt: "Cancelado" },
    // Actions
    generateCharges: { fr: "Générer les charges par lot", en: "Generate charges per unit", de: "Umlagen pro Einheit generieren", lb: "Chargen pro Lot generéieren", pt: "Gerar encargos por lote" },
    issueCall: { fr: "Émettre l'appel", en: "Issue the call", de: "Aufforderung ausstellen", lb: "Opruff erausginn", pt: "Emitir a chamada" },
    downloadAllPdfs: { fr: "Télécharger tous les PDFs", en: "Download all PDFs", de: "Alle PDFs herunterladen", lb: "All PDFs eroflueden", pt: "Descarregar todos os PDFs" },
    deleteButton: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
    markPaid: { fr: "Marquer payé", en: "Mark paid", de: "Als bezahlt markieren", lb: "Als bezuelt markéieren", pt: "Marcar pago" },
    reset: { fr: "Réinit.", en: "Reset", de: "Zurücksetzen", lb: "Zrécksetzen", pt: "Reiniciar" },
    // Table headers
    thLot: { fr: "Lot", en: "Unit", de: "Einheit", lb: "Lot", pt: "Lote" },
    thOwner: { fr: "Copropriétaire", en: "Co-owner", de: "Miteigentümer", lb: "Mataigentümer", pt: "Coproprietário" },
    thTantiemes: { fr: "Tantièmes", en: "Shares", de: "Anteile", lb: "Tantièmen", pt: "Milésimos" },
    thAmountDue: { fr: "Montant dû", en: "Amount due", de: "Fälliger Betrag", lb: "Fällege Betrag", pt: "Montante devido" },
    thPaid: { fr: "Payé", en: "Paid", de: "Bezahlt", lb: "Bezuelt", pt: "Pago" },
    thReference: { fr: "Référence", en: "Reference", de: "Referenz", lb: "Referenz", pt: "Referência" },
    // Confirm dialogs
    confirmIssue: { fr: "Émettre cet appel de fonds ? Il deviendra officiel et les charges seront appelées.", en: "Issue this funds call? It will become official and charges will be called.", de: "Diese Zahlungsaufforderung ausstellen? Sie wird offiziell und die Umlagen werden eingefordert.", lb: "Dësen Fondsoprouf erausginn? En gëtt offiziell an d'Chargen ginn opgefuerdert.", pt: "Emitir esta chamada de fundos? Tornar-se-á oficial e os encargos serão chamados." },
    confirmDeleteCall: { fr: "Supprimer cet appel de fonds ? Toutes les charges associées seront perdues.", en: "Delete this funds call? All associated charges will be lost.", de: "Diese Zahlungsaufforderung löschen? Alle zugehörigen Umlagen gehen verloren.", lb: "Dësen Fondsoprouf läschen? All verbonnen Chargen gi verluer.", pt: "Eliminar esta chamada de fundos? Todos os encargos associados serão perdidos." },
    chargesGenerated: { fr: "charges générées selon les tantièmes.", en: "charges generated based on shares.", de: "Umlagen nach Anteilen generiert.", lb: "Chargen no Tantièmen generéiert.", pt: "encargos gerados segundo milésimos." },
    generateHint: { fr: "Cliquez sur « Générer les charges par lot » pour répartir automatiquement le montant total selon les tantièmes de chaque lot.", en: "Click 'Generate charges per unit' to automatically distribute the total amount based on each unit's shares.", de: "Klicken Sie auf 'Umlagen pro Einheit generieren', um den Gesamtbetrag automatisch nach den Anteilen jeder Einheit zu verteilen.", lb: "Klickt op 'Chargen pro Lot generéieren' fir de Gesamtbetrag automatesch no den Tantièmen vun all Lot ze verdeelen.", pt: "Clique em 'Gerar encargos por lote' para distribuir automaticamente o montante total segundo os milésimos de cada lote." },
  },

  /* ===================================================================
   *  syndicAssemblees — src/app/syndic/coproprietes/[id]/assemblees/page.tsx
   * =================================================================== */
  syndicAssemblees: {
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    loading: { fr: "Chargement…", en: "Loading…", de: "Laden…", lb: "Lueden…", pt: "A carregar…" },
    // Page
    title: { fr: "Assemblées générales", en: "General assemblies", de: "Hauptversammlungen", lb: "Generalversammlungen", pt: "Assembleias gerais" },
    subtitle: { fr: "Convocations, ordre du jour, vote électronique pondéré par tantièmes et procès-verbal automatique — loi du 16 mai 1975.", en: "Convocations, agenda, electronic voting weighted by shares and automatic minutes — law of 16 May 1975.", de: "Einladungen, Tagesordnung, nach Anteilen gewichtete elektronische Abstimmung und automatisches Protokoll — Gesetz vom 16. Mai 1975.", lb: "Konvokatiounen, Dagesuerdnung, elektronesch Ofstëmmung gewiicht no Tantièmen an automatescht Protokoll — Gesetz vum 16. Mee 1975.", pt: "Convocações, ordem do dia, voto eletrónico ponderado por milésimos e ata automática — lei de 16 de maio de 1975." },
    // Assembly list
    cancel: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    newAg: { fr: "+ Nouvelle AG", en: "+ New GM", de: "+ Neue HV", lb: "+ Nei HV", pt: "+ Nova AG" },
    // Create assembly
    placeholderTitle: { fr: "Titre de l'assemblée", en: "Assembly title", de: "Versammlungstitel", lb: "Versammlungstitel", pt: "Título da assembleia" },
    typeOrdinary: { fr: "Assemblée ordinaire", en: "Ordinary assembly", de: "Ordentliche Versammlung", lb: "Ordentlech Versammlung", pt: "Assembleia ordinária" },
    typeExtraordinary: { fr: "Assemblée extraordinaire", en: "Extraordinary assembly", de: "Außerordentliche Versammlung", lb: "Ausserordentlech Versammlung", pt: "Assembleia extraordinária" },
    placeholderQuorum: { fr: "Quorum requis (% des tantièmes)", en: "Required quorum (% of shares)", de: "Erforderliches Quorum (% der Anteile)", lb: "Erfuerdert Quorum (% vun Tantièmen)", pt: "Quórum necessário (% dos milésimos)" },
    placeholderLocation: { fr: "Lieu (adresse ou salle)", en: "Location (address or room)", de: "Ort (Adresse oder Raum)", lb: "Uert (Adress oder Sall)", pt: "Local (morada ou sala)" },
    placeholderVirtual: { fr: "URL visioconférence (optionnel)", en: "Video conference URL (optional)", de: "Videokonferenz-URL (optional)", lb: "Videokonferenz-URL (optional)", pt: "URL videoconferência (opcional)" },
    placeholderNotes: { fr: "Notes complémentaires (optionnel)", en: "Additional notes (optional)", de: "Zusätzliche Notizen (optional)", lb: "Zousätzlech Notizen (optional)", pt: "Notas adicionais (opcional)" },
    createAssembly: { fr: "Créer l'assemblée", en: "Create assembly", de: "Versammlung erstellen", lb: "Versammlung erstellen", pt: "Criar assembleia" },
    // Summary
    quorumRequired: { fr: "Quorum requis :", en: "Required quorum:", de: "Erforderliches Quorum:", lb: "Erfuerdert Quorum:", pt: "Quórum necessário:" },
    quorumReached: { fr: "Atteint :", en: "Reached:", de: "Erreicht:", lb: "Erreecht:", pt: "Atingido:" },
    // Buttons
    convene: { fr: "Convoquer", en: "Convene", de: "Einberufen", lb: "Convoquéieren", pt: "Convocar" },
    openVote: { fr: "Ouvrir le vote", en: "Open voting", de: "Abstimmung eröffnen", lb: "Ofstëmmung opmaachen", pt: "Abrir votação" },
    closeVote: { fr: "Clôturer", en: "Close", de: "Schließen", lb: "Ofschléissen", pt: "Encerrar" },
    convocationPdf: { fr: "Convocation PDF", en: "Convocation PDF", de: "Einladung PDF", lb: "Konvokatioun PDF", pt: "Convocação PDF" },
    minutesPdf: { fr: "PV PDF", en: "Minutes PDF", de: "Protokoll PDF", lb: "Protokoll PDF", pt: "Ata PDF" },
    deleteTitle: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
    // Individual convocations
    downloadConvocations: { fr: "Télécharger convocations individuelles", en: "Download individual convocations", de: "Einzelne Einladungen herunterladen", lb: "Eenzel Konvokatiounen eroflueden", pt: "Descarregar convocações individuais" },
    lotsCount: { fr: "lots", en: "units", de: "Einheiten", lb: "Loten", pt: "lotes" },
    // Resolutions
    resolutionsTitle: { fr: "Ordre du jour & résolutions", en: "Agenda & resolutions", de: "Tagesordnung & Beschlüsse", lb: "Dagesuerdnung & Beschlëss", pt: "Ordem do dia & resoluções" },
    addResolution: { fr: "+ Résolution", en: "+ Resolution", de: "+ Beschluss", lb: "+ Beschloss", pt: "+ Resolução" },
    placeholderResTitle: { fr: "Intitulé de la résolution", en: "Resolution title", de: "Beschlusstitel", lb: "Beschlosstittel", pt: "Título da resolução" },
    placeholderResDesc: { fr: "Description détaillée (optionnel)", en: "Detailed description (optional)", de: "Detailbeschreibung (optional)", lb: "Detailléiert Beschreiwung (optional)", pt: "Descrição detalhada (opcional)" },
    addButton: { fr: "Ajouter", en: "Add", de: "Hinzufügen", lb: "Derbäisetzen", pt: "Adicionar" },
    noResolutions: { fr: "Aucune résolution à l'ordre du jour. Ajoutez-en avant de convoquer l'AG.", en: "No resolutions on the agenda. Add some before convening the GM.", de: "Keine Beschlüsse auf der Tagesordnung. Fügen Sie welche hinzu, bevor Sie die HV einberufen.", lb: "Keng Beschlëss op der Dagesuerdnung. Setzt der derbäi virum Convoquéieren vun der HV.", pt: "Nenhuma resolução na ordem do dia. Adicione antes de convocar a AG." },
    resolutionNumber: { fr: "Résolution n°", en: "Resolution #", de: "Beschluss Nr.", lb: "Beschloss Nr.", pt: "Resolução n.º" },
    resultApproved: { fr: "Adoptée", en: "Approved", de: "Angenommen", lb: "Ugeholl", pt: "Aprovada" },
    resultRejected: { fr: "Rejetée", en: "Rejected", de: "Abgelehnt", lb: "Ofgeleent", pt: "Rejeitada" },
    resultPending: { fr: "En attente", en: "Pending", de: "Ausstehend", lb: "Aussteehend", pt: "Pendente" },
    // Vote categories
    voteFor: { fr: "Pour", en: "For", de: "Dafür", lb: "Dofir", pt: "A favor" },
    voteAgainst: { fr: "Contre", en: "Against", de: "Dagegen", lb: "Dogéint", pt: "Contra" },
    voteAbstain: { fr: "Abstention", en: "Abstention", de: "Enthaltung", lb: "Enthaltung", pt: "Abstenção" },
    voteAbsent: { fr: "Absents", en: "Absent", de: "Abwesend", lb: "Ofwiesend", pt: "Ausentes" },
    tantièmes: { fr: "tantièmes", en: "shares", de: "Anteile", lb: "Tantièmen", pt: "milésimos" },
    // Vote detail table
    votesDetail: { fr: "Détail des votes", en: "Votes detail", de: "Abstimmungsdetail", lb: "Ofstëmmungsdetail", pt: "Detalhe dos votos" },
    thLot: { fr: "Lot", en: "Unit", de: "Einheit", lb: "Lot", pt: "Lote" },
    thOwner: { fr: "Copropriétaire", en: "Co-owner", de: "Miteigentümer", lb: "Mataigentümer", pt: "Coproprietário" },
    thTantiemes: { fr: "Tantièmes", en: "Shares", de: "Anteile", lb: "Tantièmen", pt: "Milésimos" },
    thVote: { fr: "Vote", en: "Vote", de: "Abstimmung", lb: "Ofstëmmung", pt: "Voto" },
    thModify: { fr: "Modifier", en: "Modify", de: "Ändern", lb: "Änneren", pt: "Modificar" },
    // Empty state
    noAssemblies: { fr: "Aucune assemblée programmée", en: "No assembly scheduled", de: "Keine Versammlung geplant", lb: "Keng Versammlung geplangt", pt: "Nenhuma assembleia agendada" },
    noAssembliesDesc: { fr: "Créez une assemblée générale pour gérer convocation, ordre du jour, vote et PV en ligne.", en: "Create a general assembly to manage convocation, agenda, voting and minutes online.", de: "Erstellen Sie eine Hauptversammlung, um Einladung, Tagesordnung, Abstimmung und Protokoll online zu verwalten.", lb: "Erstellt eng Generalversammlung fir Konvokatioun, Dagesuerdnung, Ofstëmmung an Protokoll online ze verwalten.", pt: "Crie uma assembleia geral para gerir convocação, ordem do dia, votação e ata online." },
    // Confirm dialogs
    confirmDeleteAssembly: { fr: "Supprimer cette assemblée ? Les résolutions et votes associés seront également supprimés.", en: "Delete this assembly? Associated resolutions and votes will also be deleted.", de: "Diese Versammlung löschen? Zugehörige Beschlüsse und Abstimmungen werden ebenfalls gelöscht.", lb: "Dës Versammlung läschen? Verbonnen Beschlëss an Ofstëmmungen ginn och geläscht.", pt: "Eliminar esta assembleia? As resoluções e votos associados serão também eliminados." },
    confirmConvene: { fr: "Marquer l'assemblée comme convoquée ? Vous pourrez ensuite télécharger les convocations PDF à envoyer.", en: "Mark the assembly as convened? You can then download the convocation PDFs to send.", de: "Versammlung als einberufen markieren? Sie können dann die Einladungs-PDFs zum Versenden herunterladen.", lb: "Versammlung als convoquéiert markéieren? Dir kënnt dann d'Konvokatioun-PDFs zum Schécken eroflueden.", pt: "Marcar a assembleia como convocada? Poderá depois descarregar os PDFs de convocação para enviar." },
    confirmClose: { fr: "Clôturer l'assemblée ? Les votes seront figés et le PV pourra être téléchargé.", en: "Close the assembly? Votes will be frozen and minutes can be downloaded.", de: "Versammlung schließen? Die Abstimmungen werden eingefroren und das Protokoll kann heruntergeladen werden.", lb: "Versammlung ofschléissen? D'Ofstëmmunge ginn agefuer an d'Protokoll kann erofgeluede ginn.", pt: "Encerrar a assembleia? Os votos serão congelados e a ata poderá ser descarregada." },
    confirmDeleteResolution: { fr: "Supprimer cette résolution ?", en: "Delete this resolution?", de: "Diesen Beschluss löschen?", lb: "Dëse Beschloss läschen?", pt: "Eliminar esta resolução?" },
    // Legal note
    legalNote: { fr: "Rappel légal : la convocation doit parvenir à chaque copropriétaire au moins 15 jours avant la date de l'assemblée (loi du 16 mai 1975). Le vote électronique nécessite mention explicite dans le règlement ou consentement préalable. Les majorités requises varient selon la nature de la résolution (travaux, syndic, modif. RC).", en: "Legal reminder: the convocation must reach each co-owner at least 15 days before the assembly date (law of 16 May 1975). Electronic voting requires explicit mention in the rules or prior consent. Required majorities vary according to the nature of the resolution (works, syndic, regulation changes).", de: "Rechtlicher Hinweis: Die Einladung muss jeden Miteigentümer mindestens 15 Tage vor dem Versammlungsdatum erreichen (Gesetz vom 16. Mai 1975). Die elektronische Abstimmung erfordert eine ausdrückliche Erwähnung in der Satzung oder vorherige Zustimmung. Die erforderlichen Mehrheiten variieren je nach Art des Beschlusses (Arbeiten, Syndic, Satzungsänderungen).", lb: "Rechtleche Rappel: d'Konvokatioun muss all Copropriétaire op d'mannst 15 Deeg virum Versammlungsdatum errechen (Gesetz vum 16. Mee 1975). D'elektronesch Ofstëmmung brauch eng explizit Mentioun am Reglement oder virheregt Averständnis. Déi erfuerdert Majoritéiten variéieren no der Natur vum Beschloss (Aarbechten, Syndic, RC-Ännerungen).", pt: "Lembrete legal: a convocação deve chegar a cada coproprietário pelo menos 15 dias antes da data da assembleia (lei de 16 de maio de 1975). O voto eletrónico requer menção explícita no regulamento ou consentimento prévio. As maiorias necessárias variam conforme a natureza da resolução (obras, síndico, alterações ao regulamento)." },
  },

  /* ===================================================================
   *  syndicComptabilite — src/app/syndic/coproprietes/[id]/comptabilite/page.tsx
   * =================================================================== */
  syndicComptabilite: {
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    loading: { fr: "Chargement…", en: "Loading…", de: "Laden…", lb: "Lueden…", pt: "A carregar…" },
    // Page
    title: { fr: "Comptabilité copropriété", en: "Condominium accounting", de: "Buchhaltung Miteigentümergemeinschaft", lb: "Comptabilitéit Copropriétéit", pt: "Contabilidade do condomínio" },
    subtitle: { fr: "Plan comptable standardisé LU · double-entrée · journal, balance et clôture annuelle avec calcul du résultat.", en: "Standardized LU chart of accounts · double-entry · journal, balance and annual closing with result calculation.", de: "Standardisierter LU-Kontenrahmen · Doppik · Journal, Bilanz und Jahresabschluss mit Ergebnisberechnung.", lb: "Standardiséierte LU-Konteplan · Doppik · Journal, Bilanz a Joersofschloss mat Resultatberechnung.", pt: "Plano de contas padronizado LU · partida dobrada · diário, balancete e encerramento anual com cálculo do resultado." },
    // Chart seed
    chartNotInitialized: { fr: "Plan comptable non initialisé", en: "Chart of accounts not initialized", de: "Kontenrahmen nicht initialisiert", lb: "Konteplan net initialiséiert", pt: "Plano de contas não inicializado" },
    chartSeedDesc: { fr: "Créez le plan comptable standardisé (classes 1 à 7, 22 comptes système) avant toute saisie.", en: "Create the standardized chart of accounts (classes 1 to 7, 22 system accounts) before any entry.", de: "Erstellen Sie den standardisierten Kontenrahmen (Klassen 1 bis 7, 22 Systemkonten) vor jeder Buchung.", lb: "Erstellt de standardiséierte Konteplan (Klassen 1 bis 7, 22 Systemkonten) virun all Buchung.", pt: "Crie o plano de contas padronizado (classes 1 a 7, 22 contas do sistema) antes de qualquer lançamento." },
    seedButton: { fr: "Initialiser le plan comptable", en: "Initialize chart of accounts", de: "Kontenrahmen initialisieren", lb: "Konteplan initialiséieren", pt: "Inicializar plano de contas" },
    // Year
    exercice: { fr: "Exercice", en: "Year", de: "Geschäftsjahr", lb: "Geschäftsjoer", pt: "Exercício" },
    statusOpen: { fr: "Ouvert", en: "Open", de: "Offen", lb: "Op", pt: "Aberto" },
    statusClosed: { fr: "Clôturé", en: "Closed", de: "Geschlossen", lb: "Zougemaach", pt: "Encerrado" },
    openYear: { fr: "+ Ouvrir exercice", en: "+ Open year", de: "+ Geschäftsjahr eröffnen", lb: "+ Geschäftsjoer opmaachen", pt: "+ Abrir exercício" },
    closeYear: { fr: "Clôturer", en: "Close", de: "Abschließen", lb: "Ofschléissen", pt: "Encerrar" },
    // KPIs
    kpiEntries: { fr: "Écritures", en: "Entries", de: "Buchungen", lb: "Buchungen", pt: "Lançamentos" },
    kpiIncome: { fr: "Produits (cl. 7)", en: "Income (cl. 7)", de: "Erträge (Kl. 7)", lb: "Erträg (Kl. 7)", pt: "Receitas (cl. 7)" },
    kpiExpenses: { fr: "Charges (cl. 6)", en: "Expenses (cl. 6)", de: "Aufwendungen (Kl. 6)", lb: "Opwenner (Kl. 6)", pt: "Encargos (cl. 6)" },
    kpiResult: { fr: "Résultat", en: "Result", de: "Ergebnis", lb: "Resultat", pt: "Resultado" },
    // Views
    viewJournal: { fr: "Journal", en: "Journal", de: "Journal", lb: "Journal", pt: "Diário" },
    viewBalance: { fr: "Balance", en: "Balance", de: "Bilanz", lb: "Bilanz", pt: "Balancete" },
    // New entry
    cancel: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    newEntry: { fr: "+ Nouvelle écriture", en: "+ New entry", de: "+ Neue Buchung", lb: "+ Nei Buchung", pt: "+ Novo lançamento" },
    placeholderRef: { fr: "Référence pièce", en: "Document reference", de: "Belegref.", lb: "Belegref.", pt: "Referência doc." },
    placeholderEntryLabel: { fr: "Libellé de l'écriture", en: "Entry label", de: "Buchungsbezeichnung", lb: "Buchungsbeschreiwung", pt: "Descrição do lançamento" },
    // Entry table headers
    thAccount: { fr: "Compte", en: "Account", de: "Konto", lb: "Kont", pt: "Conta" },
    thLineLabel: { fr: "Libellé ligne", en: "Line label", de: "Zeilenbezeichnung", lb: "Zeilbeschreiwung", pt: "Descrição da linha" },
    thDebit: { fr: "Débit", en: "Debit", de: "Soll", lb: "Soll", pt: "Débito" },
    thCredit: { fr: "Crédit", en: "Credit", de: "Haben", lb: "Haben", pt: "Crédito" },
    selectAccount: { fr: "— Sélectionner —", en: "— Select —", de: "— Auswählen —", lb: "— Auswielen —", pt: "— Selecionar —" },
    deleteLineTitle: { fr: "Supprimer ligne", en: "Delete line", de: "Zeile löschen", lb: "Zeil läschen", pt: "Eliminar linha" },
    totals: { fr: "Totaux", en: "Totals", de: "Summen", lb: "Summen", pt: "Totais" },
    addLine: { fr: "+ Ajouter une ligne", en: "+ Add a line", de: "+ Zeile hinzufügen", lb: "+ Zeil derbäisetzen", pt: "+ Adicionar linha" },
    balanced: { fr: "✓ Écriture équilibrée", en: "✓ Entry balanced", de: "✓ Buchung ausgeglichen", lb: "✓ Buchung ausgeglach", pt: "✓ Lançamento equilibrado" },
    gap: { fr: "Écart :", en: "Gap:", de: "Differenz:", lb: "Differenz:", pt: "Diferença:" },
    save: { fr: "Enregistrer", en: "Save", de: "Speichern", lb: "Späicheren", pt: "Guardar" },
    // Journal table headers
    thDate: { fr: "Date", en: "Date", de: "Datum", lb: "Datum", pt: "Data" },
    thJournal: { fr: "Journal", en: "Journal", de: "Journal", lb: "Journal", pt: "Diário" },
    thRef: { fr: "Réf.", en: "Ref.", de: "Ref.", lb: "Ref.", pt: "Ref." },
    thLabel: { fr: "Libellé", en: "Label", de: "Bezeichnung", lb: "Beschreiwung", pt: "Descrição" },
    thLines: { fr: "Lignes", en: "Lines", de: "Zeilen", lb: "Zeilen", pt: "Linhas" },
    noEntries: { fr: "Aucune écriture saisie.", en: "No entries recorded.", de: "Keine Buchungen erfasst.", lb: "Keng Buchungen erfaasst.", pt: "Nenhum lançamento registado." },
    deleteTitle: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
    // Balance table headers
    thCode: { fr: "Code", en: "Code", de: "Code", lb: "Code", pt: "Código" },
    thClasse: { fr: "Classe", en: "Class", de: "Klasse", lb: "Klass", pt: "Classe" },
    thDebitCumul: { fr: "Débit cumul.", en: "Cumul. debit", de: "Soll kum.", lb: "Soll kum.", pt: "Débito acum." },
    thCreditCumul: { fr: "Crédit cumul.", en: "Cumul. credit", de: "Haben kum.", lb: "Haben kum.", pt: "Crédito acum." },
    thSolde: { fr: "Solde", en: "Balance", de: "Saldo", lb: "Saldo", pt: "Saldo" },
    // Confirm dialogs
    confirmCloseYear: { fr: "Clôturer l'exercice {year} ? Les écritures seront verrouillées (non modifiables).", en: "Close year {year}? Entries will be locked (non-editable).", de: "Geschäftsjahr {year} abschließen? Die Buchungen werden gesperrt (nicht änderbar).", lb: "Geschäftsjoer {year} ofschléissen? D'Buchunge gi gespaart (net ännerbar).", pt: "Encerrar exercício {year}? Os lançamentos serão bloqueados (não editáveis)." },
    yearClosed: { fr: "Exercice {year} clôturé. Résultat :", en: "Year {year} closed. Result:", de: "Geschäftsjahr {year} abgeschlossen. Ergebnis:", lb: "Geschäftsjoer {year} ofgeschloss. Resultat:", pt: "Exercício {year} encerrado. Resultado:" },
    confirmDeleteEntry: { fr: "Supprimer cette écriture ?", en: "Delete this entry?", de: "Diese Buchung löschen?", lb: "Dës Buchung läschen?", pt: "Eliminar este lançamento?" },
    // Legal note
    legalNote: { fr: "Plan comptable LU : ce module propose un plan simplifié adapté aux syndics (classes 1, 4, 5, 6, 7). Les écritures respectent le principe de la partie double. La clôture fige les écritures et calcule automatiquement le résultat (produits cl. 7 – charges cl. 6). Pour les copropriétés soumises à contrôle comptable, un expert-comptable peut récupérer la balance et le journal au format standard.", en: "LU chart of accounts: this module offers a simplified chart adapted for syndics (classes 1, 4, 5, 6, 7). Entries follow the double-entry principle. Closing freezes entries and automatically calculates the result (income cl. 7 – expenses cl. 6). For condominiums subject to accounting audit, an accountant can retrieve the balance and journal in standard format.", de: "LU-Kontenrahmen: Dieses Modul bietet einen vereinfachten, an Syndics angepassten Kontenrahmen (Klassen 1, 4, 5, 6, 7). Die Buchungen folgen dem Prinzip der doppelten Buchführung. Der Abschluss sperrt die Buchungen und berechnet automatisch das Ergebnis (Erträge Kl. 7 – Aufwendungen Kl. 6). Für Gemeinschaften, die einer Rechnungsprüfung unterliegen, kann ein Wirtschaftsprüfer die Bilanz und das Journal im Standardformat abrufen.", lb: "LU-Konteplan: Dëse Modul bitt e vereinfachte Konteplan ugepasst fir Syndiken (Klassen 1, 4, 5, 6, 7). D'Buchunge respektéieren d'Prinzip vun der Doppik. D'Ofschléissen friert d'Buchungen an berechent automatesch d'Resultat (Erträg Kl. 7 – Opwenner Kl. 6). Fir Copropriétéiten déi ënner Rechnungskontroll stinn, kann en Expert-Comptable d'Bilanz an d'Journal am Standardformat recuperéieren.", pt: "Plano de contas LU: este módulo propõe um plano simplificado adaptado a síndicos (classes 1, 4, 5, 6, 7). Os lançamentos respeitam o princípio da partida dobrada. O encerramento congela os lançamentos e calcula automaticamente o resultado (receitas cl. 7 – encargos cl. 6). Para condomínios sujeitos a controlo contabilístico, um contabilista pode recuperar o balancete e o diário em formato padrão." },
  },

  /* ===================================================================
   *  paiementsLocatifs — src/app/gestion-locative/lot/[id]/paiements/page.tsx
   * =================================================================== */
  paiementsLocatifs: {
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    loading: { fr: "Chargement…", en: "Loading…", de: "Laden…", lb: "Lueden…", pt: "A carregar…" },
    // Page
    title: { fr: "Paiements & quittances", en: "Payments & receipts", de: "Zahlungen & Quittungen", lb: "Zahlungen & Quittungen", pt: "Pagamentos & recibos" },
    subtitle: { fr: "Suivi des loyers encaissés et génération automatique de quittances mensuelles (loi du 21 septembre 2006, art. 25).", en: "Tracking of collected rents and automatic generation of monthly receipts (law of 21 September 2006, art. 25).", de: "Verfolgung der eingenommenen Mieten und automatische Erstellung monatlicher Quittungen (Gesetz vom 21. September 2006, Art. 25).", lb: "Tracking vun de kasséierte Loyer'en an automatesch Generéierung vu monatleche Quittungen (Gesetz vum 21. September 2006, Art. 25).", pt: "Acompanhamento das rendas cobradas e geração automática de recibos mensais (lei de 21 de setembro de 2006, art. 25)." },
    // Seed year
    generateYear: { fr: "+ Générer les 12 mois de", en: "+ Generate 12 months for", de: "+ 12 Monate generieren für", lb: "+ 12 Méint generéiere fir", pt: "+ Gerar os 12 meses de" },
    confirmSeed: { fr: "Générer les 12 mois de {year} avec le loyer actuel ({rent} + {charges} charges) ?", en: "Generate 12 months for {year} with current rent ({rent} + {charges} charges)?", de: "12 Monate für {year} mit aktueller Miete ({rent} + {charges} Nebenkosten) generieren?", lb: "12 Méint fir {year} mat dem aktuelle Loyer ({rent} + {charges} Chargen) generéieren?", pt: "Gerar os 12 meses de {year} com a renda atual ({rent} + {charges} encargos)?" },
    // KPIs
    kpiExpected: { fr: "Loyer + charges attendus", en: "Expected rent + charges", de: "Erwartete Miete + Nebenkosten", lb: "Erwaarte Loyer + Chargen", pt: "Renda + encargos esperados" },
    kpiExpectedDetail: { fr: "12 ×", en: "12 ×", de: "12 ×", lb: "12 ×", pt: "12 ×" },
    kpiCollected: { fr: "Encaissé", en: "Collected", de: "Eingenommen", lb: "Kasséiert", pt: "Cobrado" },
    kpiMonths: { fr: "/ 12 mois", en: "/ 12 months", de: "/ 12 Monate", lb: "/ 12 Méint", pt: "/ 12 meses" },
    kpiRemaining: { fr: "Reste à encaisser", en: "Remaining to collect", de: "Noch einzunehmen", lb: "Nach ze kasséieren", pt: "Restante a cobrar" },
    kpiPending: { fr: "lignes en attente", en: "lines pending", de: "Zeilen ausstehend", lb: "Zeile aussteehend", pt: "linhas pendentes" },
    // Status labels
    statusDue: { fr: "À encaisser", en: "Due", de: "Fällig", lb: "Fälleg", pt: "A cobrar" },
    statusPartial: { fr: "Partiel", en: "Partial", de: "Teilweise", lb: "Deelweis", pt: "Parcial" },
    statusPaid: { fr: "Payé", en: "Paid", de: "Bezahlt", lb: "Bezuelt", pt: "Pago" },
    statusLate: { fr: "Retard", en: "Late", de: "Verspätet", lb: "Ze spéit", pt: "Atrasado" },
    statusCancelled: { fr: "Annulé", en: "Cancelled", de: "Storniert", lb: "Annuléiert", pt: "Cancelado" },
    statusNotCreated: { fr: "Non créé", en: "Not created", de: "Nicht erstellt", lb: "Net erstellt", pt: "Não criado" },
    // Table headers
    thMonth: { fr: "Mois", en: "Month", de: "Monat", lb: "Mount", pt: "Mês" },
    thAmount: { fr: "Montant", en: "Amount", de: "Betrag", lb: "Betrag", pt: "Montante" },
    thStatus: { fr: "Statut", en: "Status", de: "Status", lb: "Status", pt: "Estado" },
    thPaymentDate: { fr: "Date règlement", en: "Payment date", de: "Zahlungsdatum", lb: "Zahlungsdatum", pt: "Data pagamento" },
    thMethod: { fr: "Mode", en: "Method", de: "Zahlungsart", lb: "Zahlungsaart", pt: "Método" },
    thActions: { fr: "Actions", en: "Actions", de: "Aktionen", lb: "Aktiounen", pt: "Ações" },
    // Buttons
    create: { fr: "+ Créer", en: "+ Create", de: "+ Erstellen", lb: "+ Erstellen", pt: "+ Criar" },
    markPaid: { fr: "Marquer payé", en: "Mark paid", de: "Als bezahlt markieren", lb: "Als bezuelt markéieren", pt: "Marcar pago" },
    receiptPdf: { fr: "Quittance PDF", en: "Receipt PDF", de: "Quittung PDF", lb: "Quittung PDF", pt: "Recibo PDF" },
    edit: { fr: "Éditer", en: "Edit", de: "Bearbeiten", lb: "Änneren", pt: "Editar" },
    cancel: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    deleteTitle: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
    confirmDelete: { fr: "Supprimer cette ligne de paiement ?", en: "Delete this payment line?", de: "Diese Zahlungszeile löschen?", lb: "Dës Zahlungszeil läschen?", pt: "Eliminar esta linha de pagamento?" },
    // Month names
    month1: { fr: "Janv", en: "Jan", de: "Jan", lb: "Jan", pt: "Jan" },
    month2: { fr: "Févr", en: "Feb", de: "Feb", lb: "Feb", pt: "Fev" },
    month3: { fr: "Mars", en: "Mar", de: "Mär", lb: "Mäe", pt: "Mar" },
    month4: { fr: "Avr", en: "Apr", de: "Apr", lb: "Apr", pt: "Abr" },
    month5: { fr: "Mai", en: "May", de: "Mai", lb: "Mee", pt: "Mai" },
    month6: { fr: "Juin", en: "Jun", de: "Jun", lb: "Jun", pt: "Jun" },
    month7: { fr: "Juil", en: "Jul", de: "Jul", lb: "Jul", pt: "Jul" },
    month8: { fr: "Août", en: "Aug", de: "Aug", lb: "Aug", pt: "Ago" },
    month9: { fr: "Sept", en: "Sep", de: "Sep", lb: "Sep", pt: "Set" },
    month10: { fr: "Oct", en: "Oct", de: "Okt", lb: "Okt", pt: "Out" },
    month11: { fr: "Nov", en: "Nov", de: "Nov", lb: "Nov", pt: "Nov" },
    month12: { fr: "Déc", en: "Dec", de: "Dez", lb: "Dez", pt: "Dez" },
    // Legal note
    legalNote: { fr: "Obligations du bailleur (art. 25 de la loi du 21.09.2006) : vous devez remettre gratuitement une quittance de loyer au locataire qui en fait la demande. La quittance générée ici détaille la période, le loyer HC et les provisions sur charges — conforme aux exigences LU.", en: "Landlord obligations (art. 25 of the law of 21.09.2006): you must provide a rent receipt free of charge to the tenant upon request. The receipt generated here details the period, rent excluding charges and charge provisions — compliant with LU requirements.", de: "Pflichten des Vermieters (Art. 25 des Gesetzes vom 21.09.2006): Sie müssen dem Mieter auf Anfrage kostenlos eine Mietquittung ausstellen. Die hier erstellte Quittung enthält Details zu Zeitraum, Kaltmiete und Nebenkostenvorauszahlungen — konform mit den LU-Anforderungen.", lb: "Obligatiounen vum Bailleur (Art. 25 vum Gesetz vum 21.09.2006): Dir musst dem Locataire gratis eng Loyerquittung ginn wann en et freet. D'Quittung déi hei generéiert gëtt detailléiert d'Period, de Loyer HC an d'Chargenprovisioune — konform mat de LU-Ufuerderungen.", pt: "Obrigações do senhorio (art. 25 da lei de 21.09.2006): deve entregar gratuitamente um recibo de renda ao inquilino que o solicite. O recibo gerado aqui detalha o período, a renda sem encargos e as provisões para encargos — conforme com os requisitos LU." },
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
