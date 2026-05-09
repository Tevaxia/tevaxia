// Inject i18n keys for hotelForecast, hotelDetail, and remaining hotelGroupe strings
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

const NEW_KEYS = {
  // === hotelForecast — full page ===
  "hotelForecast": {
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    loginPrompt: { fr: "Connectez-vous pour accéder au module de prévision.", en: "Log in to access the forecast module.", de: "Melden Sie sich an, um auf das Prognose-Modul zuzugreifen.", lb: "Mellt Iech un, fir op de Prognose-Modul zouzegräifen.", pt: "Inicie sessão para aceder ao módulo de previsão." },
    loginBtn: { fr: "Se connecter", en: "Log in", de: "Anmelden", lb: "Umellen", pt: "Iniciar sessão" },
    hubLink: { fr: "← Hub hôtellerie", en: "← Hospitality hub", de: "← Hotel-Hub", lb: "← Hotel-Hub", pt: "← Hub hotelaria" },
    title: { fr: "Prévision à 90 jours — revenue management", en: "90-day forecast — revenue management", de: "90-Tage-Prognose — Revenue Management", lb: "90-Deeg-Prognose — Revenue Management", pt: "Previsão a 90 dias — revenue management" },
    subtitle: { fr: "Lissage exponentiel triple (Holt-Winters additif) avec saisonnalité hebdomadaire. Horizon paramétrable jusqu'à 180 jours. Intervalle de confiance à 95 % basé sur l'écart-type des résidus.", en: "Triple exponential smoothing (additive Holt-Winters) with weekly seasonality. Configurable horizon up to 180 days. 95% confidence interval based on residual standard deviation.", de: "Dreifache exponentielle Glättung (additives Holt-Winters) mit wöchentlicher Saisonalität. Konfigurierbarer Horizont bis 180 Tage. 95%-Konfidenzintervall basierend auf Residual-Standardabweichung.", lb: "Dräifach exponentiell Glätten (additiv Holt-Winters) mat wëchentlecher Saisonnalitéit. Konfiguréierbaren Horizont bis 180 Deeg. 95%-Konfidenzintervall baséiert op Residual-Standardofwäichung.", pt: "Suavização exponencial tripla (Holt-Winters aditivo) com sazonalidade semanal. Horizonte configurável até 180 dias. Intervalo de confiança a 95% baseado no desvio-padrão dos resíduos." },
    noHotel: { fr: "Aucun hôtel persisté.", en: "No hotel saved.", de: "Kein Hotel gespeichert.", lb: "Keen Hotel gespäichert.", pt: "Nenhum hotel guardado." },
    noHotelLink: { fr: "Créez d'abord un hôtel", en: "Create a hotel first", de: "Erstellen Sie zuerst ein Hotel", lb: "Erstellt als éischt en Hotel", pt: "Crie primeiro um hotel" },
    noHotelSuffix: { fr: "depuis votre dashboard groupe hôtelier.", en: "from your hotel group dashboard.", de: "über Ihr Hotelgruppen-Dashboard.", lb: "iwwer Äert Hotelgruppen-Dashboard.", pt: "a partir do seu dashboard grupo hoteleiro." },
    hotelLabel: { fr: "Hôtel :", en: "Hotel:", de: "Hotel:", lb: "Hotel:", pt: "Hotel:" },
    manualEntry: { fr: "+ Saisie manuelle", en: "+ Manual entry", de: "+ Manuelle Eingabe", lb: "+ Manuell Agab", pt: "+ Entrada manual" },
    importCsv: { fr: "Import CSV", en: "CSV Import", de: "CSV-Import", lb: "CSV-Import", pt: "Importar CSV" },
    generateDemo: { fr: "Générer données de démo", en: "Generate demo data", de: "Demodaten generieren", lb: "Demodaten generéieren", pt: "Gerar dados de demonstração" },
    seedConfirm: { fr: "Générer 120 jours de données synthétiques pour tester la prévision ? (marquées 'forecast_seed', supprimables)", en: "Generate 120 days of synthetic data to test the forecast? (marked 'forecast_seed', deletable)", de: "120 Tage synthetische Daten zum Testen der Prognose generieren? (als 'forecast_seed' markiert, löschbar)", lb: "120 Deeg synthetesch Donnéeën generéieren fir d'Prognose ze testen? (als 'forecast_seed' markéiert, löschbar)", pt: "Gerar 120 dias de dados sintéticos para testar a previsão? (marcados 'forecast_seed', elimináveis)" },
    dateLabel: { fr: "Date", en: "Date", de: "Datum", lb: "Datum", pt: "Data" },
    occupancyLabel: { fr: "Taux d'occupation (0-1)", en: "Occupancy rate (0-1)", de: "Auslastung (0-1)", lb: "Auslaaschtung (0-1)", pt: "Taxa de ocupação (0-1)" },
    adrLabel: { fr: "ADR (€)", en: "ADR (€)", de: "ADR (€)", lb: "ADR (€)", pt: "ADR (€)" },
    save: { fr: "Enregistrer", en: "Save", de: "Speichern", lb: "Späicheren", pt: "Guardar" },
    csvFormat: { fr: "Format : YYYY-MM-DD,occupancy,adr · une ligne par jour · occupation décimale (0.82) ou pourcentage (82 %)", en: "Format: YYYY-MM-DD,occupancy,adr · one row per day · occupancy as decimal (0.82) or percentage (82%)", de: "Format: YYYY-MM-DD,occupancy,adr · eine Zeile pro Tag · Auslastung als Dezimalzahl (0.82) oder Prozent (82 %)", lb: "Format: YYYY-MM-DD,occupancy,adr · eng Zeil pro Dag · Auslaaschtung als Dezimalzuel (0.82) oder Prozent (82 %)", pt: "Formato: YYYY-MM-DD,occupancy,adr · uma linha por dia · ocupação em decimal (0.82) ou percentagem (82%)" },
    importBtn: { fr: "Importer", en: "Import", de: "Importieren", lb: "Importéieren", pt: "Importar" },
    noCsvRows: { fr: "Aucune ligne valide détectée dans le CSV.", en: "No valid rows detected in the CSV.", de: "Keine gültigen Zeilen im CSV erkannt.", lb: "Keng gëlteg Zeilen am CSV erkannt.", pt: "Nenhuma linha válida detetada no CSV." },
    metricOccupancy: { fr: "Taux d'occupation", en: "Occupancy rate", de: "Auslastung", lb: "Auslaaschtung", pt: "Taxa de ocupação" },
    metricAdr: { fr: "ADR (€)", en: "ADR (€)", de: "ADR (€)", lb: "ADR (€)", pt: "ADR (€)" },
    metricRevpar: { fr: "RevPAR (€)", en: "RevPAR (€)", de: "RevPAR (€)", lb: "RevPAR (€)", pt: "RevPAR (€)" },
    horizonLabel: { fr: "Horizon :", en: "Horizon:", de: "Horizont:", lb: "Horizont:", pt: "Horizonte:" },
    days30: { fr: "30 jours", en: "30 days", de: "30 Tage", lb: "30 Deeg", pt: "30 dias" },
    days60: { fr: "60 jours", en: "60 days", de: "60 Tage", lb: "60 Deeg", pt: "60 dias" },
    days90: { fr: "90 jours", en: "90 days", de: "90 Tage", lb: "90 Deeg", pt: "90 dias" },
    days120: { fr: "120 jours", en: "120 days", de: "120 Tage", lb: "120 Deeg", pt: "120 dias" },
    days180: { fr: "180 jours", en: "180 days", de: "180 Tage", lb: "180 Deeg", pt: "180 dias" },
    kpiAvgHistorical: { fr: "{metric} moyen (historique)", en: "{metric} average (historical)", de: "{metric} Durchschnitt (historisch)", lb: "{metric} Duerchschnëtt (historesch)", pt: "{metric} médio (histórico)" },
    kpiAvgForecast: { fr: "{metric} moyen (prévu)", en: "{metric} average (forecast)", de: "{metric} Durchschnitt (Prognose)", lb: "{metric} Duerchschnëtt (Prognose)", pt: "{metric} médio (previsto)" },
    kpiMape: { fr: "MAPE backtest (30 j)", en: "MAPE backtest (30 d)", de: "MAPE Backtest (30 T.)", lb: "MAPE Backtest (30 D.)", pt: "MAPE backtest (30 d)" },
    kpiHistoryPoints: { fr: "Points d'historique", en: "History points", de: "Verlaufspunkte", lb: "Verlafspunkten", pt: "Pontos de histórico" },
    showForecastValues: { fr: "Afficher les valeurs prévisionnelles ({count} jours)", en: "Show forecast values ({count} days)", de: "Prognosewerte anzeigen ({count} Tage)", lb: "Prognosewäerter uweisen ({count} Deeg)", pt: "Mostrar valores previsionais ({count} dias)" },
    thDate: { fr: "Date", en: "Date", de: "Datum", lb: "Datum", pt: "Data" },
    thForecast: { fr: "Prévision", en: "Forecast", de: "Prognose", lb: "Prognose", pt: "Previsão" },
    thCiLow: { fr: "IC 95 % bas", en: "95% CI low", de: "95%-KI unten", lb: "95%-KI ënnen", pt: "IC 95% baixo" },
    thCiHigh: { fr: "IC 95 % haut", en: "95% CI high", de: "95%-KI oben", lb: "95%-KI uewen", pt: "IC 95% alto" },
    minDataWarning: { fr: "Il faut au moins 14 jours de données journalières pour lancer une prévision. Importez un CSV, saisissez manuellement ou utilisez le bouton « Générer données de démo ».", en: "At least 14 days of daily data are required to run a forecast. Import a CSV, enter data manually, or use the 'Generate demo data' button.", de: "Es sind mindestens 14 Tage täglicher Daten erforderlich, um eine Prognose zu starten. Importieren Sie eine CSV, geben Sie Daten manuell ein oder verwenden Sie die Schaltfläche 'Demodaten generieren'.", lb: "Et brauch mindestens 14 Deeg deeglech Donnéeën fir eng Prognose ze starten. Importéiert eng CSV, gitt Donnéeën manuell an oder benotzt de Knäppchen 'Demodaten generéieren'.", pt: "São necessários pelo menos 14 dias de dados diários para executar uma previsão. Importe um CSV, introduza dados manualmente ou use o botão 'Gerar dados de demonstração'." },
    showHistory: { fr: "Historique saisi ({count} jours)", en: "Entered history ({count} days)", de: "Erfasster Verlauf ({count} Tage)", lb: "Erfaasste Verlaf ({count} Deeg)", pt: "Histórico introduzido ({count} dias)" },
    thOccupation: { fr: "Occupation", en: "Occupancy", de: "Auslastung", lb: "Auslaaschtung", pt: "Ocupação" },
    thAdr: { fr: "ADR", en: "ADR", de: "ADR", lb: "ADR", pt: "ADR" },
    thRevpar: { fr: "RevPAR", en: "RevPAR", de: "RevPAR", lb: "RevPAR", pt: "RevPAR" },
    thSource: { fr: "Source", en: "Source", de: "Quelle", lb: "Quell", pt: "Fonte" },
    deleteTitle: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
    methodology: { fr: "Méthodologie : modèle Holt-Winters additif (m=7) avec \u03B1=0.3, \u03B2=0.1, \u03B3=0.3. Qualité mesurée par MAPE (erreur moyenne en pourcentage) sur les 30 derniers points. Une MAPE < 10 % est excellente pour un forecast hôtelier, 10-20 % acceptable, > 20 % signale une forte volatilité. Le MAPE n'inclut pas les chocs exogènes (grèves, événements majeurs, saisonnalités atypiques).", en: "Methodology: additive Holt-Winters model (m=7) with \u03B1=0.3, \u03B2=0.1, \u03B3=0.3. Quality measured by MAPE (mean absolute percentage error) on the last 30 points. A MAPE < 10% is excellent for hotel forecasting, 10-20% acceptable, > 20% signals high volatility. MAPE does not include exogenous shocks (strikes, major events, atypical seasonality).", de: "Methodik: additives Holt-Winters-Modell (m=7) mit \u03B1=0.3, \u03B2=0.1, \u03B3=0.3. Qualität gemessen am MAPE (mittlerer absoluter prozentualer Fehler) der letzten 30 Punkte. Ein MAPE < 10 % ist exzellent für Hotel-Prognosen, 10-20 % akzeptabel, > 20 % signalisiert hohe Volatilität. MAPE beinhaltet keine exogenen Schocks (Streiks, Großereignisse, atypische Saisonalität).", lb: "Methodik: additiv Holt-Winters-Modell (m=7) mat \u03B1=0.3, \u03B2=0.1, \u03B3=0.3. Qualitéit gemooss um MAPE (mëttlere absolute prozentuale Feeler) vun de leschten 30 Punkten. E MAPE < 10 % ass exzellent fir Hotel-Prognosen, 10-20 % akzeptabel, > 20 % signaliséiert héich Volatilitéit. MAPE enthält keng exogen Schocks (Streiken, Groussevenementer, atypesch Saisonnalitéit).", pt: "Metodologia: modelo Holt-Winters aditivo (m=7) com \u03B1=0.3, \u03B2=0.1, \u03B3=0.3. Qualidade medida pelo MAPE (erro médio absoluto percentual) nos últimos 30 pontos. Um MAPE < 10% é excelente para previsão hoteleira, 10-20% aceitável, > 20% sinaliza alta volatilidade. O MAPE não inclui choques exógenos (greves, eventos importantes, sazonalidades atípicas)." },
    chartToday: { fr: "Aujourd'hui", en: "Today", de: "Heute", lb: "Haut", pt: "Hoje" },
    legendHistorical: { fr: "Historique", en: "Historical", de: "Historisch", lb: "Historesch", pt: "Histórico" },
    legendForecast: { fr: "Prévision", en: "Forecast", de: "Prognose", lb: "Prognose", pt: "Previsão" },
    legendCi: { fr: "IC 95 %", en: "95% CI", de: "95%-KI", lb: "95%-KI", pt: "IC 95%" },
  },

  // === hotelDetail — full page ===
  "hotelDetail": {
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    loading: { fr: "Chargement…", en: "Loading…", de: "Laden…", lb: "Lueden…", pt: "A carregar…" },
    notFound: { fr: "Hôtel introuvable.", en: "Hotel not found.", de: "Hotel nicht gefunden.", lb: "Hotel net fonnt.", pt: "Hotel não encontrado." },
    backToGroup: { fr: "← Retour au groupe", en: "← Back to group", de: "← Zurück zur Gruppe", lb: "← Zréck zur Grupp", pt: "← Voltar ao grupo" },
    rooms: { fr: "chambres", en: "rooms", de: "Zimmer", lb: "Zëmmer", pt: "quartos" },
    cancelBtn: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    addPeriod: { fr: "+ Ajouter une période", en: "+ Add a period", de: "+ Periode hinzufügen", lb: "+ Period derbäisetzen", pt: "+ Adicionar período" },
    editPeriodTitle: { fr: "Modifier la période", en: "Edit period", de: "Periode bearbeiten", lb: "Period änneren", pt: "Editar período" },
    newPeriodTitle: { fr: "Nouvelle période", en: "New period", de: "Neue Periode", lb: "Nei Period", pt: "Novo período" },
    periodLabelPlaceholder: { fr: "Libellé (ex. Q1 2026)", en: "Label (e.g. Q1 2026)", de: "Bezeichnung (z.B. Q1 2026)", lb: "Bezeechnung (z.B. Q1 2026)", pt: "Rótulo (ex. Q1 2026)" },
    startDate: { fr: "Début", en: "Start", de: "Beginn", lb: "Ufank", pt: "Início" },
    endDate: { fr: "Fin", en: "End", de: "Ende", lb: "Enn", pt: "Fim" },
    occupancyRate: { fr: "Taux occupation", en: "Occupancy rate", de: "Auslastungsrate", lb: "Auslaaschtungsrat", pt: "Taxa ocupação" },
    adrLabel: { fr: "ADR (€)", en: "ADR (€)", de: "ADR (€)", lb: "ADR (€)", pt: "ADR (€)" },
    revparAuto: { fr: "RevPAR (auto)", en: "RevPAR (auto)", de: "RevPAR (auto)", lb: "RevPAR (auto)", pt: "RevPAR (auto)" },
    revenueRooms: { fr: "Revenu Rooms", en: "Room revenue", de: "Zimmerumsatz", lb: "Zëmmerëmsaz", pt: "Receita quartos" },
    revenueFb: { fr: "Revenu F&B", en: "F&B revenue", de: "F&B-Umsatz", lb: "F&B-Ëmsaz", pt: "Receita F&B" },
    revenueMice: { fr: "Revenu MICE", en: "MICE revenue", de: "MICE-Umsatz", lb: "MICE-Ëmsaz", pt: "Receita MICE" },
    staffCost: { fr: "Coût personnel", en: "Staff cost", de: "Personalkosten", lb: "Personalkosten", pt: "Custo pessoal" },
    energyCost: { fr: "Coût énergie", en: "Energy cost", de: "Energiekosten", lb: "Energiekosten", pt: "Custo energia" },
    otherOpex: { fr: "Autres opex", en: "Other opex", de: "Sonstiger Opex", lb: "Aneren Opex", pt: "Outros opex" },
    mpiCompset: { fr: "MPI (compset)", en: "MPI (compset)", de: "MPI (Compset)", lb: "MPI (Compset)", pt: "MPI (compset)" },
    ariCompset: { fr: "ARI (compset)", en: "ARI (compset)", de: "ARI (Compset)", lb: "ARI (Compset)", pt: "ARI (compset)" },
    rgiCompset: { fr: "RGI (compset)", en: "RGI (compset)", de: "RGI (Compset)", lb: "RGI (Compset)", pt: "RGI (compset)" },
    notesPlaceholder: { fr: "Commentaires direction (optionnel)", en: "Management comments (optional)", de: "Kommentare der Geschäftsführung (optional)", lb: "Kommentare vun der Geschäftsfuerung (optional)", pt: "Comentários da direção (opcional)" },
    saveBtn: { fr: "Enregistrer", en: "Save", de: "Speichern", lb: "Späicheren", pt: "Guardar" },
    addPeriodBtn: { fr: "Ajouter la période", en: "Add period", de: "Periode hinzufügen", lb: "Period derbäisetzen", pt: "Adicionar período" },
    periodsTitle: { fr: "Historique des périodes", en: "Period history", de: "Periodenhistorie", lb: "Period-Histor", pt: "Histórico de períodos" },
    noPeriods: { fr: "Aucune période enregistrée. Ajoutez-en une pour commencer l'historique et générer des owner reports.", en: "No periods recorded. Add one to start the history and generate owner reports.", de: "Keine Perioden erfasst. Fügen Sie eine hinzu, um den Verlauf zu starten und Owner Reports zu generieren.", lb: "Keng Perioden erfaasst. Füügt eng derbäi fir den Verlaf ze starten an Owner Reporten ze generéieren.", pt: "Nenhum período registado. Adicione um para iniciar o histórico e gerar owner reports." },
    ownerReportPdf: { fr: "Owner report PDF", en: "Owner report PDF", de: "Owner Report PDF", lb: "Owner Report PDF", pt: "Owner report PDF" },
    editBtn: { fr: "Éditer", en: "Edit", de: "Bearbeiten", lb: "Änneren", pt: "Editar" },
    revenuTotal: { fr: "Revenu total", en: "Total revenue", de: "Gesamtumsatz", lb: "Gesamtëmsaz", pt: "Receita total" },
    gopLabel: { fr: "GOP", en: "GOP", de: "GOP", lb: "GOP", pt: "GOP" },
    ebitdaLabel: { fr: "EBITDA", en: "EBITDA", de: "EBITDA", lb: "EBITDA", pt: "EBITDA" },
    ownerReportInfo: { fr: "Pour vos propriétaires : l'owner report PDF agrège tous les KPIs de la période (RevPAR, P&L USALI, compset MPI/ARI/RGI) avec comparaison automatique vs la période précédente. Génération en un clic, envoyable directement par email.", en: "For your owners: the owner report PDF aggregates all KPIs for the period (RevPAR, P&L USALI, compset MPI/ARI/RGI) with automatic comparison vs the previous period. One-click generation, ready to send by email.", de: "Für Ihre Eigentümer: Der Owner Report PDF aggregiert alle KPIs der Periode (RevPAR, P&L USALI, Compset MPI/ARI/RGI) mit automatischem Vergleich zur Vorperiode. Generierung per Klick, direkt per E-Mail versendbar.", lb: "Fir Är Proprietären: den Owner Report PDF aggregéiert all KPIs vun der Period (RevPAR, P&L USALI, Compset MPI/ARI/RGI) mat automatescher Vergläichung vs déi vireg Period. Generéierung mat engem Klick, direkt per E-Mail verschéckbar.", pt: "Para os seus proprietários: o owner report PDF agrega todos os KPIs do período (RevPAR, P&L USALI, compset MPI/ARI/RGI) com comparação automática vs o período anterior. Geração num clique, pronto a enviar por email." },
    occShort: { fr: "Occ", en: "Occ", de: "Ausl.", lb: "Ausl.", pt: "Oc." },
  },

  // === hotelGroupe — remaining hardcoded strings ===
  "hotelGroupe": {
    error: { fr: "Erreur", en: "Error", de: "Fehler", lb: "Feeler", pt: "Erro" },
    errorCreation: { fr: "Erreur création", en: "Creation error", de: "Erstellungsfehler", lb: "Erstellungsfeeler", pt: "Erro de criação" },
    errorDeletion: { fr: "Erreur suppression", en: "Deletion error", de: "Löschfehler", lb: "Läschfeeler", pt: "Erro de eliminação" },
    groupLabel: { fr: "Groupe :", en: "Group:", de: "Gruppe:", lb: "Grupp:", pt: "Grupo:" },
    roomsCount: { fr: "chambres", en: "rooms", de: "Zimmer", lb: "Zëmmer", pt: "quartos" },
    roomsNotSet: { fr: "Chambres non renseignées", en: "Rooms not specified", de: "Zimmer nicht angegeben", lb: "Zëmmer net uginn", pt: "Quartos não indicados" },
    valorisation: { fr: "Valorisation", en: "Valuation", de: "Bewertung", lb: "Bewäertung", pt: "Avaliação" },
    dscr: { fr: "DSCR", en: "DSCR", de: "DSCR", lb: "DSCR", pt: "DSCR" },
    exploitation: { fr: "Exploitation", en: "Operations", de: "Betrieb", lb: "Betrib", pt: "Exploração" },
    revpar: { fr: "RevPAR", en: "RevPAR", de: "RevPAR", lb: "RevPAR", pt: "RevPAR" },
    renovation: { fr: "Rénovation", en: "Renovation", de: "Renovierung", lb: "Renovéierung", pt: "Renovação" },
    deleteBtn: { fr: "Supprimer", en: "Delete", de: "Löschen", lb: "Läschen", pt: "Eliminar" },
  },
};

for (const lang of LANGS) {
  const filePath = `${MSG_DIR}/${lang}.json`;
  const raw = readFileSync(filePath, "utf-8");
  const msg = JSON.parse(raw);

  for (const [nsPath, keys] of Object.entries(NEW_KEYS)) {
    const parts = nsPath.split(".");
    let target = msg;
    for (const part of parts) {
      if (!target[part]) target[part] = {};
      target = target[part];
    }
    for (const [key, translations] of Object.entries(keys)) {
      if (!target[key]) {
        target[key] = translations[lang];
      }
    }
  }

  writeFileSync(filePath, JSON.stringify(msg, null, 2) + "\n", "utf-8");
  console.log(`Done ${lang}.json`);
}

console.log("All hotel2 i18n keys injected.");
