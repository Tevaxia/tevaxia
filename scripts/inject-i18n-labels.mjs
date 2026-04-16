// Inject missing i18n labels into all 5 message files
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

// All new translation keys organized by namespace
const NEW_KEYS = {
  // === hotellerieCalc.renovation.labels ===
  "hotellerieCalc.renovation.labels": {
    surfaceChauffee: { fr: "Surface chauffée totale", en: "Total heated area", de: "Gesamte beheizte Fläche", lb: "Gesamt behëtzte Fläch", pt: "Área aquecida total" },
    nbChambres: { fr: "Nombre de chambres", en: "Number of rooms", de: "Anzahl Zimmer", lb: "Zuel Zëmmer", pt: "Número de quartos" },
    consoActuelle: { fr: "Consommation actuelle", en: "Current consumption", de: "Aktueller Verbrauch", lb: "Aktuellen Verbrauch", pt: "Consumo atual" },
    consoCible: { fr: "Consommation cible (optionnelle)", en: "Target consumption (optional)", de: "Zielverbrauch (optional)", lb: "Zilverbrauch (optional)", pt: "Consumo alvo (opcional)" },
    prixKwh: { fr: "Prix moyen kWh", en: "Average kWh price", de: "Durchschn. kWh-Preis", lb: "Duerchschn. kWh-Präis", pt: "Preço médio kWh" },
    isolation: { fr: "Isolation enveloppe (toiture, façade)", en: "Building envelope insulation (roof, facade)", de: "Gebäudedämmung (Dach, Fassade)", lb: "Gebaisolatioun (Daach, Fassad)", pt: "Isolamento envolvente (telhado, fachada)" },
    cvc: { fr: "CVC (chauffage / ventilation / clim)", en: "HVAC (heating / ventilation / AC)", de: "HLK (Heizung / Lüftung / Klima)", lb: "HLK (Heizung / Lëftung / Klima)", pt: "AVAC (aquecimento / ventilação / AC)" },
    ecs: { fr: "Eau chaude sanitaire (PAC, solaire)", en: "Domestic hot water (heat pump, solar)", de: "Warmwasser (Wärmepumpe, Solar)", lb: "Waarmwaasser (Wärmepump, Solar)", pt: "Água quente sanitária (bomba calor, solar)" },
    led: { fr: "Éclairage LED + GTB", en: "LED lighting + BMS", de: "LED-Beleuchtung + GLT", lb: "LED-Beliichtung + GLT", pt: "Iluminação LED + BMS" },
    fenetres: { fr: "Menuiseries (triple vitrage)", en: "Windows (triple glazing)", de: "Fenster (Dreifachverglasung)", lb: "Fënsteren (Dreifachverglasung)", pt: "Caixilharia (vidro triplo)" },
    adr: { fr: "ADR", en: "ADR", de: "ADR", lb: "ADR", pt: "ADR" },
    occupation: { fr: "Occupation", en: "Occupancy", de: "Auslastung", lb: "Auslaaschtung", pt: "Ocupação" },
    gainRevpar: { fr: "Gain RevPAR via label éco", en: "RevPAR gain from eco-label", de: "RevPAR-Gewinn durch Öko-Label", lb: "RevPAR-Gewënn duerch Öko-Label", pt: "Ganho RevPAR por label eco" },
    hintCpe: { fr: "Voir CPE / facture énergie", en: "See EPC / energy bill", de: "Siehe EPB / Energierechnung", lb: "Kuckt EPB / Energierechnung", pt: "Ver CPE / fatura energia" },
    hintConsoAuto: { fr: "0 = calculée auto", en: "0 = auto-calculated", de: "0 = automatisch berechnet", lb: "0 = automatesch berechent", pt: "0 = calculado auto" },
    hintGainLabel: { fr: "Green Key, EU Ecolabel = +1-3 % RevPAR observé", en: "Green Key, EU Ecolabel = +1-3% RevPAR observed", de: "Green Key, EU Ecolabel = +1-3% RevPAR beobachtet", lb: "Green Key, EU Ecolabel = +1-3% RevPAR observéiert", pt: "Green Key, EU Ecolabel = +1-3% RevPAR observado" },
    vanCumulee: { fr: "VAN cumulée 10 ans", en: "Cumulative NPV 10 years", de: "Kumulativer Kapitalwert 10 Jahre", lb: "Kumuléierte Kapitalwäert 10 Joer", pt: "VPL acumulado 10 anos" },
  },

  // === hotellerieCalc.valorisation.labels ===
  "hotellerieCalc.valorisation.labels": {
    nbChambres: { fr: "Nombre de chambres", en: "Number of rooms", de: "Anzahl Zimmer", lb: "Zuel Zëmmer", pt: "Número de quartos" },
    categorie: { fr: "Catégorie", en: "Category", de: "Kategorie", lb: "Kategorie", pt: "Categoria" },
    occupancy: { fr: "Taux d'occupation", en: "Occupancy rate", de: "Auslastungsrate", lb: "Auslaaschtungsrat", pt: "Taxa de ocupação" },
    adr: { fr: "ADR (revenu/chambre occupée)", en: "ADR (revenue/occupied room)", de: "ADR (Umsatz/belegtes Zimmer)", lb: "ADR (Ëmsaz/beluechte Zëmmer)", pt: "ADR (receita/quarto ocupado)" },
    ratioFB: { fr: "Ratio F&B (% RevPAR)", en: "F&B ratio (% RevPAR)", de: "F&B-Anteil (% RevPAR)", lb: "F&B-Undeel (% RevPAR)", pt: "Rácio F&B (% RevPAR)" },
    ratioOther: { fr: "Revenus annexes (%)", en: "Other revenue (%)", de: "Sonstige Einnahmen (%)", lb: "Aner Akommes (%)", pt: "Receitas acessórias (%)" },
    staffRatio: { fr: "Ratio charges staff", en: "Staff cost ratio", de: "Personalkostenquote", lb: "Personalkostenquote", pt: "Rácio custo pessoal" },
    opexRatio: { fr: "Ratio OPEX autres", en: "Other OPEX ratio", de: "Sonstiger OPEX-Anteil", lb: "Aneren OPEX-Undeel", pt: "Rácio outros OPEX" },
    capRate: { fr: "Cap rate EBITDA", en: "EBITDA cap rate", de: "EBITDA Cap Rate", lb: "EBITDA Cap Rate", pt: "Cap rate EBITDA" },
  },

  // === hotellerieCalc.dscr.labels ===
  "hotellerieCalc.dscr.labels": {
    ebitda: { fr: "EBITDA annuel", en: "Annual EBITDA", de: "Jährliches EBITDA", lb: "Jäerlechet EBITDA", pt: "EBITDA anual" },
    valeurHotel: { fr: "Valeur de l'hôtel", en: "Hotel value", de: "Hotelwert", lb: "Hotelwäert", pt: "Valor do hotel" },
    montantPret: { fr: "Montant du prêt", en: "Loan amount", de: "Darlehensbetrag", lb: "Prêtsmontant", pt: "Montante do empréstimo" },
    tauxInteret: { fr: "Taux d'intérêt", en: "Interest rate", de: "Zinssatz", lb: "Zënssaz", pt: "Taxa de juro" },
    dureePret: { fr: "Durée du prêt", en: "Loan term", de: "Kreditlaufzeit", lb: "Kreditdauer", pt: "Prazo do empréstimo" },
    ffePct: { fr: "Réserve FF&E (% revenu)", en: "FF&E reserve (% revenue)", de: "FF&E-Reserve (% Umsatz)", lb: "FF&E-Reserv (% Ëmsaz)", pt: "Reserva FF&E (% receita)" },
    occupancyStress: { fr: "Occupation stress (pts)", en: "Occupancy stress (pts)", de: "Auslastung Stress (Pkt.)", lb: "Auslaaschtung Stress (Pkt.)", pt: "Ocupação stress (pts)" },
  },

  // === hotellerieCalc.exploitation.labels ===
  "hotellerieCalc.exploitation.labels": {
    nbChambres: { fr: "Nombre de chambres", en: "Number of rooms", de: "Anzahl Zimmer", lb: "Zuel Zëmmer", pt: "Número de quartos" },
    categorie: { fr: "Catégorie", en: "Category", de: "Kategorie", lb: "Kategorie", pt: "Categoria" },
    occupancy: { fr: "Occupation (%)", en: "Occupancy (%)", de: "Auslastung (%)", lb: "Auslaaschtung (%)", pt: "Ocupação (%)" },
    adr: { fr: "ADR (€)", en: "ADR (€)", de: "ADR (€)", lb: "ADR (€)", pt: "ADR (€)" },
    ratioFB: { fr: "F&B (% CA total)", en: "F&B (% total revenue)", de: "F&B (% Gesamtumsatz)", lb: "F&B (% Gesamtëmsaz)", pt: "F&B (% receita total)" },
    ratioMice: { fr: "MICE (% CA total)", en: "MICE (% total revenue)", de: "MICE (% Gesamtumsatz)", lb: "MICE (% Gesamtëmsaz)", pt: "MICE (% receita total)" },
    ratioOther: { fr: "Autres revenus (%)", en: "Other revenue (%)", de: "Sonstige Einnahmen (%)", lb: "Aner Akommes (%)", pt: "Outras receitas (%)" },
    staffRatio: { fr: "Charges personnel (%)", en: "Staff costs (%)", de: "Personalkosten (%)", lb: "Personalkosten (%)", pt: "Custos pessoal (%)" },
    energyRatio: { fr: "Énergie (%)", en: "Energy (%)", de: "Energie (%)", lb: "Energie (%)", pt: "Energia (%)" },
    otherOpex: { fr: "Autres OPEX (%)", en: "Other OPEX (%)", de: "Sonstiger OPEX (%)", lb: "Aneren OPEX (%)", pt: "Outros OPEX (%)" },
  },

  // === hotellerieCalc.revparCompset.labels ===
  "hotellerieCalc.revparCompset.labels": {
    nbChambres: { fr: "Nombre de chambres", en: "Number of rooms", de: "Anzahl Zimmer", lb: "Zuel Zëmmer", pt: "Número de quartos" },
    occupancy: { fr: "Occupation (%)", en: "Occupancy (%)", de: "Auslastung (%)", lb: "Auslaaschtung (%)", pt: "Ocupação (%)" },
    adr: { fr: "ADR (€)", en: "ADR (€)", de: "ADR (€)", lb: "ADR (€)", pt: "ADR (€)" },
    compsetOcc: { fr: "Occupation compset (%)", en: "Compset occupancy (%)", de: "Compset-Auslastung (%)", lb: "Compset-Auslaaschtung (%)", pt: "Ocupação compset (%)" },
    compsetAdr: { fr: "ADR compset (€)", en: "Compset ADR (€)", de: "Compset-ADR (€)", lb: "Compset-ADR (€)", pt: "ADR compset (€)" },
  },

  // === hotellerieCalc.scoreE2.labels ===
  "hotellerieCalc.scoreE2.labels": {
    prixAchat: { fr: "Prix d'achat hôtel", en: "Hotel purchase price", de: "Hotel-Kaufpreis", lb: "Hotel-Kaafpräis", pt: "Preço compra hotel" },
    apportPersonnel: { fr: "Apport personnel", en: "Personal equity", de: "Eigenkapital", lb: "Eegekapital", pt: "Capital próprio" },
    nbChambres: { fr: "Nombre de chambres", en: "Number of rooms", de: "Anzahl Zimmer", lb: "Zuel Zëmmer", pt: "Número de quartos" },
    emploisCrees: { fr: "Emplois créés (ETP)", en: "Jobs created (FTE)", de: "Geschaffene Arbeitsplätze (VZÄ)", lb: "Geschafene Aarbechtsplazen (VZÄ)", pt: "Empregos criados (ETC)" },
    ebitdaPrev: { fr: "EBITDA prévisionnel", en: "Projected EBITDA", de: "Prognostiziertes EBITDA", lb: "Prognostizéiert EBITDA", pt: "EBITDA previsto" },
  },

  // === hotelGroupe — full page ===
  "hotelGroupe": {
    title: { fr: "Dashboard Groupe hôtelier", en: "Hotel Group Dashboard", de: "Hotelgruppe Dashboard", lb: "Hotelgrupp Dashboard", pt: "Dashboard Grupo hoteleiro" },
    subtitle: { fr: "Gestion multi-sites pour les organisations de type « Groupe hôtelier ».", en: "Multi-site management for hotel group organizations.", de: "Multi-Standort-Verwaltung für Hotelgruppen.", lb: "Multi-Site Gestioun fir Hotelgruppen.", pt: "Gestão multi-sites para grupos hoteleiros." },
    linkSubtitle: { fr: "Chaque simulation (valorisation, DSCR, exploitation, rénovation, RevPAR, E-2) peut être rattachée à un hôtel persisté.", en: "Each simulation (valuation, DSCR, operations, renovation, RevPAR, E-2) can be linked to a persisted hotel.", de: "Jede Simulation (Bewertung, DSCR, Betrieb, Renovierung, RevPAR, E-2) kann einem gespeicherten Hotel zugeordnet werden.", lb: "All Simulatioun (Bewäertung, DSCR, Betrib, Renovéierung, RevPAR, E-2) kann engem gespäicherten Hotel zougeuernt ginn.", pt: "Cada simulação (avaliação, DSCR, exploração, renovação, RevPAR, E-2) pode ser ligada a um hotel persistido." },
    createGroup: { fr: "Créer un groupe hôtelier", en: "Create a hotel group", de: "Hotelgruppe erstellen", lb: "Hotelgrupp erstellen", pt: "Criar grupo hoteleiro" },
    noGroup: { fr: "Aucun groupe hôtelier", en: "No hotel group", de: "Keine Hotelgruppe", lb: "Keng Hotelgrupp", pt: "Nenhum grupo hoteleiro" },
    noGroupDesc: { fr: "Créez une organisation de type « Groupe hôtelier » depuis votre profil pour commencer à ajouter vos établissements.", en: "Create a 'Hotel Group' organization from your profile to start adding properties.", de: "Erstellen Sie eine Organisation vom Typ 'Hotelgruppe' in Ihrem Profil, um Hotels hinzuzufügen.", lb: "Erstellt eng Organisatioun vum Typ 'Hotelgrupp' an Ärem Profil, fir Hotels derbäizesetzen.", pt: "Crie uma organização do tipo 'Grupo Hoteleiro' no seu perfil para começar a adicionar estabelecimentos." },
    group: { fr: "Groupe", en: "Group", de: "Gruppe", lb: "Grupp", pt: "Grupo" },
    establishments: { fr: "Établissements", en: "Properties", de: "Betriebe", lb: "Betriber", pt: "Estabelecimentos" },
    totalRooms: { fr: "Chambres totales", en: "Total rooms", de: "Zimmer gesamt", lb: "Zëmmer gesamt", pt: "Quartos totais" },
    capexCumul: { fr: "CAPEX cumulé", en: "Cumulative CAPEX", de: "Kumuliertes CAPEX", lb: "Kumuléiert CAPEX", pt: "CAPEX acumulado" },
    organisation: { fr: "Organisation", en: "Organization", de: "Organisation", lb: "Organisatioun", pt: "Organização" },
    hotelGroup: { fr: "Groupe hôtelier", en: "Hotel group", de: "Hotelgruppe", lb: "Hotelgrupp", pt: "Grupo hoteleiro" },
    myHotels: { fr: "Mes hôtels", en: "My hotels", de: "Meine Hotels", lb: "Meng Hotelen", pt: "Meus hotéis" },
    addHotel: { fr: "+ Ajouter un hôtel", en: "+ Add a hotel", de: "+ Hotel hinzufügen", lb: "+ Hotel derbäisetzen", pt: "+ Adicionar hotel" },
    cancel: { fr: "Annuler", en: "Cancel", de: "Abbrechen", lb: "Ofbriechen", pt: "Cancelar" },
    hotelName: { fr: "Nom de l'hôtel", en: "Hotel name", de: "Hotelname", lb: "Hotelnumm", pt: "Nome do hotel" },
    commune: { fr: "Commune / ville", en: "City / municipality", de: "Gemeinde / Stadt", lb: "Gemeng / Stad", pt: "Cidade / município" },
    nbRooms: { fr: "Nombre de chambres", en: "Number of rooms", de: "Anzahl Zimmer", lb: "Zuel Zëmmer", pt: "Número de quartos" },
    createHotel: { fr: "Créer l'hôtel", en: "Create hotel", de: "Hotel erstellen", lb: "Hotel erstellen", pt: "Criar hotel" },
    deleteConfirm: { fr: "Supprimer cet hôtel ? Les périodes de performance associées seront également supprimées.", en: "Delete this hotel? Associated performance periods will also be deleted.", de: "Dieses Hotel löschen? Zugehörige Leistungsperioden werden ebenfalls gelöscht.", lb: "Dëst Hotel läschen? Zougehéiereg Leistungsperioden ginn och geläscht.", pt: "Eliminar este hotel? Os períodos de desempenho associados também serão eliminados." },
    noHotelDesc: { fr: "Aucun hôtel dans ce groupe. Cliquez sur « + Ajouter un hôtel » pour commencer.", en: "No hotels in this group. Click '+ Add a hotel' to get started.", de: "Keine Hotels in dieser Gruppe. Klicken Sie auf '+ Hotel hinzufügen'.", lb: "Keng Hotelen an dëser Grupp. Klickt op '+ Hotel derbäisetzen'.", pt: "Nenhum hotel neste grupo. Clique em '+ Adicionar hotel' para começar." },
    energyClass: { fr: "Classe énergie", en: "Energy class", de: "Energieklasse", lb: "Energieklass", pt: "Classe energia" },
    yearBuilt: { fr: "Année constr.", en: "Year built", de: "Baujahr", lb: "Baujoer", pt: "Ano construção" },
    acquisitionPrice: { fr: "Prix d'acquisition", en: "Acquisition price", de: "Kaufpreis", lb: "Kaafpräis", pt: "Preço aquisição" },
    login: { fr: "Connectez-vous pour accéder à votre dashboard hôtelier.", en: "Log in to access your hotel dashboard.", de: "Melden Sie sich an, um auf Ihr Hotel-Dashboard zuzugreifen.", lb: "Mellt Iech un, fir op Äert Hotel-Dashboard zouzegräifen.", pt: "Inicie sessão para aceder ao seu dashboard hoteleiro." },
    loginBtn: { fr: "Se connecter", en: "Log in", de: "Anmelden", lb: "Umellen", pt: "Iniciar sessão" },
    hubLink: { fr: "← Hub hôtellerie", en: "← Hospitality hub", de: "← Hotel-Hub", lb: "← Hotel-Hub", pt: "← Hub hotelaria" },
  },

  // === bailCommercialLabels ===
  "bailCommercialLabels": {
    loyerAnnuel: { fr: "Loyer annuel initial (hors charges)", en: "Initial annual rent (excl. charges)", de: "Anfangsmiete jährlich (ohne Nebenkosten)", lb: "Ufanksloyer jäerlech (ouni Käschten)", pt: "Renda anual inicial (s/ encargos)" },
    anneeSignature: { fr: "Année de signature du bail", en: "Lease signing year", de: "Jahr der Mietvertragsunterzeichnung", lb: "Joer vun der Mietvertragsënnerschrëft", pt: "Ano assinatura contrato" },
    anneeIndexation: { fr: "Année de l'indexation calculée", en: "Indexation year calculated", de: "Berechnetes Indexierungsjahr", lb: "Berechent Indexéierungsjoer", pt: "Ano indexação calculado" },
    duree: { fr: "Durée du bail", en: "Lease duration", de: "Mietdauer", lb: "Mietdauer", pt: "Duração contrato" },
    plafond: { fr: "Plafond d'indexation total (% vs loyer initial)", en: "Total indexation cap (% vs initial rent)", de: "Indexierungsobergrenze gesamt (% vs Anfangsmiete)", lb: "Indexéierungsobergrenz gesamt (% vs Ufanksloyer)", pt: "Teto indexação total (% vs renda inicial)" },
    pasDePt: { fr: "Pas-de-porte (droit d'entrée)", en: "Key money (entry fee)", de: "Ablöse (Eintrittsgebühr)", lb: "Ablöse (Antrëttsgebühr)", pt: "Luvas (direito de entrada)" },
    depot: { fr: "Dépôt de garantie", en: "Security deposit", de: "Kaution", lb: "Kautioun", pt: "Depósito garantia" },
    charges: { fr: "Charges annuelles (provisions)", en: "Annual charges (provisions)", de: "Jährliche Nebenkosten (Vorauszahlung)", lb: "Jäerlech Niewekäschten (Virausbezuelung)", pt: "Encargos anuais (provisões)" },
    hintPlafond: { fr: "Usuel : 15-25 %. Au-delà, le locataire peut demander la révision judiciaire (art. 1757-4 Code civil).", en: "Usual: 15-25%. Beyond, the tenant may request judicial review (art. 1757-4 Civil Code).", de: "Üblich: 15-25 %. Darüber hinaus kann der Mieter eine gerichtliche Überprüfung beantragen (Art. 1757-4 BGB).", lb: "Üblech: 15-25 %. Doriwwer eraus kann de Locataire eng geriichtlech Iwwerpréiwung ufroen.", pt: "Usual: 15-25%. Acima, o inquilino pode pedir revisão judicial (art. 1757-4 Código Civil)." },
    hintPasDePt: { fr: "Somme versée en une fois à la signature, non récupérable.", en: "One-time payment at signing, non-refundable.", de: "Einmalzahlung bei Vertragsunterzeichnung, nicht erstattungsfähig.", lb: "Eemol-Bezuelung bei Ënnerschrëft, net zréckzéibar.", pt: "Pagamento único na assinatura, não reembolsável." },
    hintDepot: { fr: "Usuel : 3 à 12 mois. Restitué en fin de bail (sauf dégradations).", en: "Usual: 3-12 months. Refunded at end of lease (unless damages).", de: "Üblich: 3-12 Monate. Rückerstattung bei Mietende (außer bei Schäden).", lb: "Üblech: 3-12 Méint. Zréckbezuelt um Enn vum Bail (ausser bei Schied).", pt: "Usual: 3-12 meses. Restituído no fim do contrato (salvo danos)." },
  },
};

// Inject keys into each language file
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
  console.log(`✓ ${lang}.json updated`);
}

console.log("Done — all labels injected.");
