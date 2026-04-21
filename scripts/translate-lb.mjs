#!/usr/bin/env node
/**
 * Propper Lëtzebuergesch Iwwersetzungen fir déi 8 Personas + Hub.
 * Ersetzt den EN Fallback an src/messages/lb.json.
 * LU Rechtsbegrëffer beibehalen (Bëllegen Akt, Klimabonus, Gesetz vum 16. Mee 1975...).
 * Benotzt Dir (formelle Form), net du.
 */
import fs from "node:fs";

const SOLUTIONS = {
  syndic: {
    meta: {
      title: "Syndic-Software Lëtzebuerg, konform Gesetz vum 16.05.1975",
      description: "Verwalt Är Matbesëtzer ouni Weekender un Excel: Online-Generalversammlungen, Factur-X Fongsopruff, LU Kompabilitéit, PSD2 Bankreconciliatioun. Gratis Test.",
    },
    hero: {
      badge: "Fir Lëtzebuerger Matbesëtzer gebaut",
      title: "Äre Syndic, ouni",
      titleAccent: "Weekender un Excel",
      subtitle: "Online-Generalversammlungen mat Ofstëmmung no Tantièmen, Factur-X Fongsopruff konform, Lëtzebuerger Matbesëtz-Kompabilitéit an automatesch Bankreconciliatioun. Gebaut fir professionell Syndicen, déi genuch hunn tëscht 4 Outillen ze jongléieren.",
      cta: "Gratis ufänken",
      ctaSecondary: "Kuckt wéi et funktionéiert",
      kpis: [
        { value: "15 St", label: "pro GV gespuert" },
        { value: "100 %", label: "konform Gesetz 16.05.1975" },
        { value: "<24 St", label: "Support-Äntwertzäit" },
      ],
    },
    problem: {
      title: "E Matbesëtz zu Lëtzebuerg 2026 ze geréieren sollt net méi esou ausgesinn",
      intro: "Tëscht dem Gesetz vum 16. Mee 1975, trimestriellen Fongsopruff, Rappelen, GV-Virbereedung a Kompabilitéit fëllt d'Woch vun engem Syndic sech vun alleng. Ausser déi richteg Outillen huelen d'Laascht ewech.",
      items: [
        { title: "GV-Virbereedung op 3 Deeg", desc: "Aluedungen bannent 15 Deeg, Tagesuerdnung ausschaffen, Vollmuechten sammelen, Protokoll duerno tippen. De Verwaltungsopwand ësst d'Zäit, déi fir déi richteg Themen sollt benotzt ginn.", stat: "~15 Stonnen pro GV" },
        { title: "Rappelen mat der Hand", desc: "Suivéieren wien wat schëlleg ass, Fristen iwwerwaachen, legal Zënsen ausrechnen, formell Mise en demeure virbereeden. Ouni spezialiséierten Outil entwëscht eppes an d'Keess schrëmpft.", stat: "3-7 % chronesch onbezuelt" },
        { title: "Excel, Bank a Kompabilitéit jongléieren", desc: "Erakomend Bezuelungen mat Fongsopruff ofgläichen, an d'Kompabilitéit erfaassen, GV-Annexen aus 3 Quelle beienee bauen. All Schrëtt bréngt Feelerrisiko mat sech.", stat: "4 Outillen am Schnëtt" },
      ],
    },
    howItWorks: {
      title: "Eng Plattform, dräi Schrëtt",
      intro: "Keng komplex Migratioun, keng Formatioun iwwer 2 Deeg. Dir importéiert Är Matbesëtzer, konfiguréiert eemol d'Verdeelungsschlësselen, an den Outil iwwerhëlt.",
      steps: [
        { number: "1", title: "Är Matbesëtzer importéiert", desc: "Excel-Import, manuell Agab oder API. Eenheeten, Tantièmen, Matbesëtzer, Kontrakter, Buchhaltungshistorie. Funktionéiert mat all Syndic, dee scho strukturéiert ass." },
        { number: "2", title: "GV a Fongsopruff lafen alleng", desc: "PDF-Aluedungen pro Eenheet, elektronesch Ofstëmmung no Tantièmen gewiicht, Protokoll automatesch generéiert. Factur-X Fongsopruff konform EN 16931 un d'Matbesëtzer mat SEPA-Referenz." },
        { number: "3", title: "Kompabilitéit leeft vun alleng", desc: "All Fongsopruff, all erakomend Bezuelung, all erfaasst Ausgab fléisst an d'Buchhaltungsjournal. Déi 5 GV-Annexe ginn op Knäppchen als PDF generéiert." },
      ],
    },
    features: {
      title: "Alles wat e Lëtzebuerger Syndic wierklech brauch",
      intro: "Funktiounen gebaut fir de Rechtsrahmen vum Grand-Duché: Gesetz vum 16. Mee 1975, GV-Majoritéitsreegelen, TVA-Befreiung Art. 44 §1 f, 10-Joer-Archivéierung.",
      items: [
        { title: "Online-GV mat gewiichter Ofstëmmung", desc: "Elektronesch Ofstëmmung no Tantièmen gewiicht, einfach / absolut / duebel / eestëmmeg Majoritéiten automatesch behandelt." },
        { title: "Aluedungen + PDF-Protokoller", desc: "Aluedung pro Eenheet mat legaler Tagesuerdnung, Protokoll automatesch generéiert no der GV mat de Resultater." },
        { title: "Factur-X Fongsopruff", desc: "PDF/A-3 + CII D22B XML konform EN 16931, SEPA-Mandats-Referenz, Art. 261 D CGI Befreiung ugewannt." },
        { title: "Rappelen op 3 Niveauen", desc: "Frëndlech Erënnerung, formell Mise en demeure, Bezuelungsuerder. Lëtzebuerger legal Zënsen automatesch ausgerechent." },
        { title: "5 GV-Komptabilitéitsannexen", desc: "Bilanz, Journal, Budget, Käschteverdeelung, Status vun oppenen Creancen. PDF prett fir ze verdeelen." },
        { title: "PSD2 Bankreconciliatioun", desc: "Verbindung mat BCEE, BIL, Banque Raiffeisen, Post Finance iwwer Enable Banking. Automatesch Reconciliatioun." },
        { title: "Konfiguréierbar Verdeelungsschlësselen", desc: "Allgemeng Tantièmen, Exploitatioun-Tantièmen, Spezialkäschten pro Trapp/Gebai, individuell Undeeler." },
        { title: "Matbesëtzer-Portal", desc: "All Matbesëtzer huet säi Beräich: Ofstëmmung, Kontoauszuch, Aluedungen, Protokoller, Online-Bezuelung." },
        { title: "10 editéierbar Bréif-Schablounen", desc: "Rappelen, Aluedungen, formell Bekanntmaachungen, Vollmuechten. Komplett upassbar, DOCX / PDF / Google Drive Export." },
        { title: "Gratis Rechnungs-OCR", desc: "Liwwerantsrechnungen eroplueden, automatesch Extraktioun iwwer PDF.js + Tesseract.js. Keng manuell Agab." },
        { title: "SEPA Sammel-Iwwerweisungen", desc: "pain.001 XML-Generatioun fir gruppéiert Liwwerantsbezuelungen, kompatibel mat alle Lëtzebuerger Banken." },
        { title: "Käschte-Benchmark", desc: "Vergläich vun Äre Käschten pro m² mam Lëtzebuerger Duerchschnëtt no Wunnengstyp a Baujoer." },
      ],
    },
  },
  agence: {
    meta: {
      title: "Immobilienagence CRM Lëtzebuerg : Mandatspipeline, Matching, OpenImmo",
      description: "Zentraliséiert Mandater, Kontakter an Tâchen an engem CRM gebaut fir LU Agencen. Automatescht Keefer-Matching, Co-Branding Immobilie-PDFs, eIDAS-Ënnerschrëft.",
    },
    hero: {
      badge: "Immobilien-CRM fir LU Agencen",
      title: "Är Mandatspipeline an",
      titleAccent: "engem Outil, net véier",
      subtitle: "Mandatsverwaltung am OpenImmo-Format, Kontakt-CRM mat automatescht Keefer-Matching, Kanban Drag-Drop, Co-Branding Immobilie-PDFs an eIDAS elektronesch Ënnerschrëft. Gebaut fir Lëtzebuerger Immobilienagencen, déi genuch hunn tëscht verschiddenen Outillen ze jongléieren.",
      cta: "Gratis ufänken",
      ctaSecondary: "Kuckt wéi et funktionéiert",
      kpis: [
        { value: "/100", label: "Keefer-Matching-Score" },
        { value: "OpenImmo", label: "LU/DE Standardformat" },
        { value: "<24 St", label: "Support-Äntwertzäit" },
      ],
    },
    problem: {
      title: "Äert Business leeft op e puer Outillen, déi net mateneen schwätzen",
      intro: "Mandater am Excel, Kontakter am Gmail, Tâchen am Notion, Besichtegungen op WhatsApp. All Informatioun wunnt op enger anerer Plaz, an näischt kënnt beim Decideur un.",
      items: [
        { title: "Mandater verspreet op 3 Outillen", desc: "Tëscht Agence-CRM, Portalverdeelung, Tracker-Tabell an E-Mail-Threaden kënnt Dir de Status vun engem Mandat net mat engem Bléck gesinn.", stat: "~4 parallel Outillen" },
        { title: "Keefer-Matching op Gefill", desc: "En neit Mandat kënnt eran, Dir duerchsicht Är Keeferdatebank manuell. Rayon, Budget, Typ, Projetsdatum: alles verspreet, also ginn Kandidaten iwwersinn.", stat: "30-40 % verpasst Matches" },
        { title: "Manuell Portalverdeelung", desc: "Immobilie op athome, immotop, wort agedroen; nach eng Kéier agedroen bei Präisännerung. Inkonsistenzen tëscht Portaler schueden Ärer Mark.", stat: "~45 min pro Verdeelung" },
      ],
    },
    howItWorks: {
      title: "E CRM, dräi Schrëtt",
      intro: "Keng 2-Deeg-Formatioun, keng risikant Migratioun. Kontakter importéieren, éischt Mandat erstellen, Matching leeft automatesch.",
      steps: [
        { number: "1", title: "Kontakter iwwer CSV importéiert", desc: "Import vun Ärer bestoender Keeferdatebank. Automatescht Kolonn-Mapping. Bis zu 10.000 Kontakter an 2 Minutten." },
        { number: "2", title: "Mandater an der Kanban-Pipeline", desc: "Mandat am OpenImmo-Format erstellen. Drag-Drop Kanban no Status. Ee-Klick-Verdeelung op athome / immotop / wort." },
        { number: "3", title: "Automatescht /100-Matching", desc: "Soubal e Mandat oder Keefer an d'Datebank kënnt, rechent den Algorithmus d'Matches aus. Dir kritt eng no Score sortéiert Lëscht, prett fir ze kontaktéieren." },
      ],
    },
    features: {
      title: "Déi Funktiounen déi wierklech Zäit spueren",
      intro: "Gebaut fir Equipen vun 1 bis 20 Agenten, mat Workflows aus dem Lëtzebuerger Immobiliemaart.",
      items: [
        { title: "Kanban Mandatspipeline", desc: "Drag-Drop tëscht Statussen, Siicht no Agent, Stad oder Präis. Gespäichert Filteren." },
        { title: "Natiivt OpenImmo-Format", desc: "Standard XML OpenImmo 1.2.8 Export, kompatibel mat athome.lu, immotop.lu, wort.lu, immoscout24.de." },
        { title: "/100 Keefer-Matching", desc: "Score op Basis vu Budget, Rayon, Typ, Fläch, EPC, Projetsdatum. Sortéierbar an exportéierbar." },
        { title: "Komplett Kontakt-CRM", desc: "CSV-Import, Tags, Interaktiounen, Tâchen, Historie. Bidirektional Gmail-Sync." },
        { title: "Co-Branding Immobilie-PDFs", desc: "Logo, Markeguidelines, REV legal Notiz. A 10 Sekonnen generéiert." },
        { title: "Besichtegungszedelen PDFs", desc: "Mat Timeline-Log an elektronescher Ënnerschrëft. Rechtsgëlteg." },
        { title: "eIDAS Mandatsënnerschrëft", desc: "Fortgeschratt elektronesch Ënnerschrëft (eIDAS), rechtsverbindlech zu Lëtzebuerg." },
        { title: "Nurturing-Sequenzen", desc: "Drip-Kampagnen fir lauwarm Keefer z'erwiermen: 3 bis 7 automatesch E-Mailen." },
        { title: "E-Mail-Schablounen (10 Modeller)", desc: "Offer, Virstellung, Follow-up, Besichtegungsbestätegung, Mandatsopléisung asw." },
        { title: "Agent-Kommissiounen", desc: "Automatesch trimestriell Kommissiounsberechnung pro Agent. Komptabilitéits-Export." },
        { title: "Agent-Performance", desc: "Ranking: ënnerschriwwe Mandater, Verkaf, Ëmsaz, Kommissiounen. Anonyme Inter-Agence-Benchmark." },
        { title: "Keefer-Portal", desc: "Dedizéierte Beräich fir all Keefer: ugebuede Immobilien, Dokumenter, Messagen." },
      ],
    },
  },
  hotel: {
    meta: {
      title: "Hotel-PMS Lëtzebuerg : USALI-Folios, 3 % TVA, Forecast, Channel Manager",
      description: "Property Management System gebaut fir d'Lëtzebuerger Hotellerie: Auto-Posting USALI 19 Kategorien, LU TVA 3 % Rechnung, 90-Deeg-Forecast, iCal OTA.",
    },
    hero: {
      badge: "Multi-Etablissement-PMS fir LU",
      title: "Äert Hotel-PMS ofgestëmmt op",
      titleAccent: "LU 3 % TVA an USALI",
      subtitle: "Komplett Property Management System: Zëmmeren, Rate Plans, Reservatiounen, Folios mat USALI 19 Kategorien Auto-Posting, LU TVA 3 %/8 %/17 % Rechnung, 90-Deeg-Forecast, iCal Channel Manager. Gebaut fir Lëtzebuerger Hoteliere, déi e komplette Outil wëllen ouni déi monatlech Rechnung vun traditionellen PMS.",
      cta: "Gratis ufänken",
      ctaSecondary: "Kuckt wéi et funktionéiert",
      kpis: [
        { value: "19", label: "USALI-Kategorien" },
        { value: "3 / 8 / 17 %", label: "LU TVA behandelt" },
        { value: "<24 St", label: "Support-Äntwertzäit" },
      ],
    },
    problem: {
      title: "E Lëtzebuerger Hotel ouni dedizéierten Outil ze féieren ass erschëpfend",
      intro: "Tëscht 4+ OTAs iwwerwaachen, Folios mat der Hand tippt, 3 % TVA richteg verdeelt an Owner-Reporten zesummestellen, vergeet den Dag ouni richtege Fortschrëtt bei den essentiellen Saachen.",
      items: [
        { title: "Reservatiounen verspreet op 4+ OTAs", desc: "Booking, Airbnb, Expedia, Direktseit. All OTA huet hir Uewerfläch, Mapping, Sync. Duebelbuchungen sinn ouni Channel Manager onvermeidbar.", stat: "1-2 Duebelbuchungen / Mount" },
        { title: "Folios mat der Hand tippt", desc: "All Konsum (Kaffi, Minibar, Parking) manuell an d'Tabell agedroen. Um Check-out ëmständlech Rechnungs-Opbau mat der richteger TVA pro Linn.", stat: "~12 min pro Check-out" },
        { title: "Kee Forecast, statesch Präisser", desc: "Tariffer änneren eng Kéier pro Saison. Keng Siicht op de geplangten RevPAR, keng Präis-Optimiséierung fir lokal Evenementer (Foire Internationale, Schueberfouer).", stat: "15-25 % net erfaassten Ëmsaz" },
      ],
    },
    howItWorks: {
      title: "Komplett PMS, dräi Schrëtt",
      intro: "Gefouert Setup fir Zëmmeren a Rate Plans anzeginn. No der Konfiguratioun iwwerhëlt d'System Folios, Rechnungen a Reporting.",
      steps: [
        { number: "1", title: "Gefouerten Setup-Wizard", desc: "Etablissement erstellen, Zëmmeren no Typ, Rate Plans no Saison, Basistariffer. Am Schnëtt 20 Minutten fir en Hotel mat 15 Zëmmeren." },
        { number: "2", title: "Automatesch Reservatiounen a Folios", desc: "iCal-Import vu Booking / Airbnb / VRBO, direkt Reservatiounsagab, Auto-Posting an de Folio mat der richteger LU TVA." },
        { number: "3", title: "Rechnung a Reporting", desc: "Um Check-out: TVA-konform PDF-Rechnung + Factur-X EN 16931 fir Firmenclienten. Monatleche USALI-Report op Knäppchen, 90-Deeg-Forecast mat Konfidenzbänner." },
      ],
    },
    features: {
      title: "Alles wat e Lëtzebuerger Hotelier wierklech brauch",
      intro: "Spezifesch fir LU Hospitality-Reegelen (3 % TVA, Gemengetaxe) a Branche-Standarden (USALI, STR).",
      items: [
        { title: "Gefouerten Setup-Wizard", desc: "Etablissementskonfiguratioun an 20 min: Zëmmeren, Rate Plans, Saisonen, Tariffer." },
        { title: "Multi-Saison Rate Plans", desc: "Basis-/Héichsaison-Tariffer, Weekend-Promos, Gruppen, Woch vun der Foire Internationale." },
        { title: "Kalenner + Belegungs-Heatmap", desc: "Joressiicht, deeglech Belegung pro Zëmmer, Schwaachstellen identifizéieren." },
        { title: "Direkt + OTA-Reservatiounen", desc: "Direkt Agab oder iCal-Import Booking / Airbnb / VRBO. Bidirektional Sync." },
        { title: "USALI 19-Kategorien-Folios", desc: "Auto-Posting no Konsum: Zëmmer, Kaffi, Minibar, Spa, Telefon, Wäsch asw." },
        { title: "LU TVA Rechnung", desc: "Automatesch 3 % / 8 % / 17 % Zouweisung no Kategorie. PDF-Rechnung + Factur-X." },
        { title: "Monatleche USALI-Report", desc: "Weltstandardformat (Ëmsaz + Käschten). Als PDF a CSV exportéierbar." },
        { title: "90-Deeg Holt-Winters Forecast", desc: "Statistescht Modell mat wëchentlecher Saisonalitéit, 95 % Konfidenzintervall, MAPE-Backtest." },
        { title: "Pickup-Report", desc: "Reservatiounsvergläich op rullendem Fënster. Alarm bei Ofweichung vum Zil." },
        { title: "Restaurant/Bar-POS", desc: "F&B-Konsumagab, automatescht Posting an de Gaaschte-Folio." },
        { title: "Gruppen an Allotments", desc: "Zëmmerblocken fir Hochzäiten, Seminaren, MICE. Separat Gruppentariffer." },
        { title: "LU-Evenementer-Kalenner", desc: "Foire Internationale, Schueberfouer, ING-Marathon, MICE. Präisauswierkung." },
      ],
    },
  },
  "expert-evaluateur": {
    meta: {
      title: "Schätzer-Software TEGOVA EVS 2025 fir Lëtzebuerg",
      description: "EVS-2025-konforme Bewäertungsrapport an 20 min: 8 Methoden, 9 Asset-Typen, automatesch ausgefëllt Daten (98 Gemengen + 12 Makro-Serien), SHA-256-Ënnerschrëft.",
    },
    hero: {
      badge: "TEGOVA EVS 2025 + Charte 5e éd. konform",
      title: "EVS-2025-konforme Rapport an",
      titleAccent: "20 Minutten amplaz vun 4 Stonnen",
      subtitle: "Bewäertungsmodul mat 11 Sektiounen + Annexe konform TEGOVA European Valuation Standards 2025 a Charte de l'expertise 5e éd. 8 Methoden, 9 Asset-Typen, Daten fir 98 Lëtzebuerger Gemengen automatesch ausgefëllt. Gebaut fir REV, TRV an onofhängeg Schätzer.",
      cta: "Gratis ufänken",
      ctaSecondary: "Kuckt wéi et funktionéiert",
      kpis: [
        { value: "11", label: "Sektiounen + Annexe" },
        { value: "8 / 9", label: "Methoden / Assets" },
        { value: "98", label: "dokumentéiert Gemengen" },
      ],
    },
    problem: {
      title: "E Bewäertungsrapport ze schreiwen ass zu 60 % Datenrecherche",
      intro: "Vergläichsobjet fannen, Makroquellen kräizvergläichen, Rechtstexter iwwerpréiwen, no der Charte formatéieren. Den analytesche Deel, deen de richtege Mehrwäert vum Expert duerstellt, ass nëmmen e klengen Undeel vun der Gesamtzäit.",
      items: [
        { title: "4 Stonne pro Rapport am Schnëtt", desc: "E komplette EVS-2025-Rapport dauert typesch 3 bis 5 Stonnen tëscht Datensammelen an der finaler Formatéierung no der Charte.", stat: "~4 St pro Rapport" },
        { title: "Daten verspreet op 10 Quellen", desc: "STATEC fir Makro, Observatoire de l'Habitat fir Präisser, Geoportail fir Kadaster, Land Registry fir Transferen, EZB fir Zënsen, INSEE fir IRL, LENOZ fir Energie.", stat: "~10 Quelle pro Rapport" },
        { title: "Non-Conformitéits-Risiko Charte", desc: "Déi 11 obligatoresch Sektiounen, EVS 5 Spezialhypothesen, wesentlech Onsécherheetsangab: eng Ausloossung an de Rapport ass ufechtbar.", stat: "0 % akzeptabel Feelermarge" },
      ],
    },
    howItWorks: {
      title: "Vun der Missioun bis zum ënnerschriwwene Rapport, dräi Schrëtt",
      intro: "Dir gitt Adress an Immobilieparameter an. D'System lued d'Kontextdaten, Dir wielt d'Methoden, de PDF-Rapport gëtt erstallt.",
      steps: [
        { number: "1", title: "Adress + Immobilieparameter", desc: "Gemeng, Fläch, Baujoer, Energieklass, Asset-Typ. Makro-, demografesch an urbanistesch Daten lueden automatesch." },
        { number: "2", title: "Methoden a Vergläicher", desc: "Wielt tëscht 8 Methoden. Vergläichsobjet no Nopeschaft virgeschloen." },
        { number: "3", title: "Ënnerschriwwene PDF-Rapport", desc: "Server-side Generatioun vum 11-Sektiounen-Rapport, SHA-256-Ënnerschrëft, REV-Logo a Qualifikatiounen." },
      ],
    },
    features: {
      title: "Gebaut fir onofhängeg Schätzer a Kanzleien",
      intro: "All Funktioun beäntwert eng richteg Aschränkung vun der Schätzertätegkeet zu Lëtzebuerg: TEGOVA-Konformitéit, Réckverfollegbarkeet, ëffentlech Daten, beweisbar Ënnerschrëft.",
      items: [
        { title: "11 EVS-2025-Sektiounen", desc: "Missioun, Standuert, Recht, Urbanismus, Beschreiwung, Loyer, Maart, SWOT, Bewäertung, Konklusiounen, Zertifizéierung." },
        { title: "8 Bewäertungsmethoden", desc: "Vergläich, direkt Kapitaliséierung, DCF, CRR-Bélégowäert, energetesch Residualmethod, Term and Reversion, IRR, Monitoring." },
        { title: "9 Asset-Typen", desc: "Wunnen, Büro, Detailhandel, Logistik, Hoteller, Industrie, gemëscht, Entwécklung, Terrain." },
        { title: "98 dokumentéiert Gemengen", desc: "Populatioun, Wuesstum, Dicht, Medianerevenue, Chômage, auslännesch Awunner, Fläch, Kanton, Präisser." },
        { title: "12 Makro-Serien 2015-2026", desc: "10-Joer-OAT, Hypothéik-Zënsen, STATEC-Baukäschten-Index, PIB, Inflatioun, Transaktiounsvolumen, m²-Präisser, Loyeren, Bürovakanz, EZB." },
        { title: "Automatesch Vergläichsobjet", desc: "Virschléi no Gemeng, Typ, Fläch, Baujoer. Erklärbar Ajustementer." },
        { title: "EVS 5 Spezialhypothesen", desc: "Verbindlech Hypothesen a wesentlech Onsécherheet no EVS 5 a Red Book." },
        { title: "Server-side ënnerschriwwe PDF", desc: "Server-side Generatioun fir Konsistenz, SHA-256-Ënnerschrëft fir Net-Ofstreitung, Schätzer-Logo." },
        { title: "Konfidenzanzeig", desc: "Konfidenzscore op Basis vun der Zuel vu Vergläicher, Sträiung, Datenalter." },
        { title: "TEGOVA-Feldinspektioun", desc: "EVS-2025 41-Punkte-Checklëscht. Offline um Handy, Sync beim Zréckkommen, Import an de Rapport." },
        { title: "Hedonescht Modell", desc: "29 belegt Koeffizienten. Verëffentlechte MAPE a R²." },
        { title: "Modell-Transparenz", desc: "Ëffentlech /transparence-Säit: Back-Test op 20 LU-Immobilien, MAPE a R² ugewisen." },
      ],
    },
  },
  investisseur: {
    meta: {
      title: "Lëtzebuerger Immobilien-Investment-Simulator : Rendement, DCF, Besteierung",
      description: "Rendement, Acquisitiounskäschten mat Bëllegen Akt, Multi-Locataire-DCF, Plus-valuen, VEFA mat Zwëschenzënsen. LU Besteierung integréiert.",
    },
    hero: {
      badge: "Komplette LU Investment-Simulator",
      title: "Äert tatsächlecht Rendement,",
      titleAccent: "LU Besteierung abegraff",
      subtitle: "Immobilien-Rendementsimulator mat Bëllegen-Akt Acquisitiounskäschten, Multi-Locataire-DCF no Bail, VEFA mat Zwëschenzënsen, Plus-valuen, Multi-Asset-Portfolio a Bank-Outillen (LTV, DSCR, CRR).",
      cta: "Gratis ufänken",
      ctaSecondary: "Kuckt wéi et funktionéiert",
      kpis: [
        { value: "Bëllegen Akt", label: "Ofzuch integréiert" },
        { value: "LU + FR + BE", label: "Steiersystemer behandelt" },
        { value: "<24 St", label: "Support-Äntwertzäit" },
      ],
    },
    problem: {
      title: "LU-Rendement ze rechne bedeit mat 8 verschiddene Simulatoren ze jongléieren",
      intro: "Notarskäschten op enger Säit, Plus-valuen op enger anerer, DCF am selwergemaachten Excel. Dobäi vergësst een Elementer oder mécht Feeler, déi d'Investitiounsentscheedung verzerren.",
      items: [
        { title: "Ënnerschätzt Acquisitiounskäschten", desc: "7 % Agraangsdroit, Transcriptioun, Bëllegen Akt (bis 40.000 € Ofzuch), Notar, 3 % TVA Neibau: vill Investisseuren rechnen falsch a blockéieren hire Finanzéierungsplang.", stat: "3-7 % typesch Spann" },
        { title: "Brutto vs Netto Rendement Duerchernee", desc: "Tëscht Brutto, Netto an Netto-Netto (no Steier) bedeiten d'Zuele net datselwecht. E 5 % Bruttorendement kann no Steier bei 2 % eenegen.", stat: "~40 % Brutto vs Netto-Netto" },
        { title: "Kee un LU ugepassten DCF-Outil", desc: "Online Excel-Simulatoren si fir FR oder BE kalibréiert. Keng 5 %-Reegel, kee LU Handelsbail, keng LU 10 % Plus-valuen.", stat: "95 % Outillen net LU" },
      ],
    },
    howItWorks: {
      title: "Vun der Schätzung zur Entscheedung, dräi Schrëtt",
      intro: "Dir gitt d'Immobilie an. D'System rechent Rendement, Besteierung, DCF. Dir vergläicht Szenarien an decidéiert.",
      steps: [
        { number: "1", title: "Immobilie- a Finanzéierungsagab", desc: "Präis, Fläch, Gemeng, Typ, Apport, Kreditdauer, Zënssaz. Acquisitiounskäschten (Bëllegen Akt) automatesch ausgerechent." },
        { number: "2", title: "Parallel Simulatiounen", desc: "Rendement, 10-Joer-DCF, VEFA-Zwëschenzënsen, Plus-valuen beim Verkaf, monatlechen Cashflow. Interaktiv Grafiken." },
        { number: "3", title: "Szenarievergläich", desc: "Méi Szenarie späicheren. Exportéierbart PDF fir Äre Bankberuder." },
      ],
    },
    features: {
      title: "D'komplett LU Immobilie-Finanz-Toolkit",
      intro: "All Berechnung respektéiert d'Lëtzebuerger Reegelen: Bëllegen Akt, 3 % VEFA-TVA, 10 % Plus-valuen, CSSF-Säz, 5 %-Reegel.",
      items: [
        { title: "LU Acquisitiounskäschten", desc: "7 % Droit, Transcriptioun, Notar, Bëllegen Akt mat Konditiounen, 3 % VEFA-TVA." },
        { title: "Komplett Rendement", desc: "Brutto, Netto, Netto-Netto. Mat Vakanz, Käschten, Foncier, Versécherung, Verwaltung, Ënnerhalt." },
        { title: "Multi-Locataire-DCF", desc: "Bail fir Bail mat Break-Optiounen, Step Rents, geplangtem CAPEX, Equity-IRR a Projet-IRR." },
        { title: "VEFA-Simulator", desc: "Zwëschenzënsen, 3 % TVA, Fäerdegstellungsgarantie, Fongsopruff-Plang." },
        { title: "LU Plus-valuen", desc: "Besëtzdauer-Ofschlag, effektive Saz, Haaptwunneng vs Investitioun." },
        { title: "Kaaf-vs-Locatioun Komparator", desc: "NPV iwwer konfiguréierbar Dauer, Opportunitéitskäschten, Break-even-Schwell." },
        { title: "Multi-Asset-Portfolio", desc: "Konsolidéiert Siicht: Gesamtwäert, Duerchschnëttsrendement, geographesch Expositioun, Diversifikatioun." },
        { title: "Bank-Outillen", desc: "LTV, DSCR, CRR-Bélégowäert, +2 %-Zënsstresstest, Kreditkapazitéit." },
        { title: "Promoteur-Bilanz", desc: "Ëmsazprojet, STATEC-Baukäschten, Finanzéierungskäschten, Promoteur-Marge." },
        { title: "98 LU Gemengen", desc: "Präis pro m², Loyeren, Rendementer, Demografie, Medianerevenue. Trimestriell Updates." },
        { title: "Live-Makro", desc: "10-Joer-OAT, Hypothéik-Zënsen, Baukäschten-Index, Inflatioun. EZB + STATEC." },
        { title: "Bank PDF-Rapport", desc: "Komplett Finanzéierungsakt: Simulatioun, DCF, Stresstest, Sécherheeten." },
      ],
    },
  },
  particulier: {
    meta: {
      title: "Immobilie-Outillen fir Privatpersounen zu Lëtzebuerg : Schätzung, Aiden, Loyer",
      description: "Schätzung, Acquisitiounskäschten mat Bëllegen Akt, Aiden-Simulator Staat + Gemeng, 5 %-Loyer-Plafong, Kaaf vs Locatioun. Gratis, 5 Sproochen.",
    },
    hero: {
      badge: "Gratis Outillen fir LU Privatpersounen",
      title: "Kafen, lounen, renovéieren zu Lëtzebuerg",
      titleAccent: "ouni Conseil-Entreprise",
      subtitle: "Immobilie-Schätzung, Acquisitiounskäschten-Berechnung mat Bëllegen Akt, Staat + Gemengen-Aiden Simulatioun (Klimabonus abegraff), legale 5 %-Loyer-Plafong Check, Kaaf-vs-Locatioun Vergläich. Gebaut fir Lëtzebuerger Privatpersounen an Éischtkeefer.",
      cta: "Gratis ufänken",
      ctaSecondary: "Outillen kucken",
      kpis: [
        { value: "0 €", label: "keng Umeldung néideg" },
        { value: "5 Niveauen", label: "kumuléierbar Aiden" },
        { value: "98", label: "ofgedeckt Gemengen" },
      ],
    },
    problem: {
      title: "Zu Lëtzebuerg 2026 ze kafe verlaangt ze vill Pabeierkrom",
      intro: "Tëscht Besteierung, kumuléierbaren Aiden, legalem Loyer-Plafong, Acquisitiounskäschten ginn Stonne mat Sichen a Vergläiche verbruecht, ier een iwwerhaapt eng Agence kontaktéiert.",
      items: [
        { title: "Onkloer Acquisitiounskäschten", desc: "Agraangsdroit, Transcriptioun, Notar, Bëllegen Akt: wien bezilt wat, a wéivill kënnt wierklech aus der Täsch? Online-Simulatoren verpassen dacks d'Halschent.", stat: "8-12 % vum Präis typesch" },
        { title: "Schwéier ze fannen Aiden", desc: "Kaafprimes, Klimabonus, Wunnengsprimes, Gemengenhëllefen, 3 % Renovéierungs-TVA. Vill Stéit verpassen 2.000 bis 8.000 €.", stat: "~5.000 € am Schnëtt verpasst" },
        { title: "5 %-Loyer-Plafong wéineg bekannt", desc: "Déi 5 %-Reegel schützt d'Locataire a rahmt d'Locateur. Iwwerschreidung setzt Iech legalen Schrëtt aus.", stat: "~15 % vun de Baaln verletzt" },
      ],
    },
    howItWorks: {
      title: "Kloer Outillen, dräi Schrëtt",
      intro: "Keng Umeldung néideg fir unzefänken. All Outil gëtt eng genau Äntwert a puer Minutten.",
      steps: [
        { number: "1", title: "Är Situatioun aginn", desc: "Zilimmobilie, Apport, Gemeng, Status, Projet. Kee Kont fir Basis-Outillen néideg." },
        { number: "2", title: "Är Zuele kréien", desc: "Immobilie-Schätzung, detailléiert Acquisitiounskäschten, Lëscht vu kumuléierbaren Aiden, Kaaf-vs-Locatioun Vergläich." },
        { number: "3", title: "Exportéieren oder deelen", desc: "Gratis PDF-Download oder View-only-Link-Deelen (mat Kont). Mat op d'Bank, den Notar oder d'Agence huelen." },
      ],
    },
    features: {
      title: "All d'Outillen déi eng Lëtzebuerger Privatpersoun brauch",
      intro: "Spezifesch fir de Lëtzebuerger Kader (Bëllegen Akt, 3 % TVA, 5 %-Reegel, Klimabonus), all an 5 Sproochen.",
      items: [
        { title: "Direkt Schätzung", desc: "Präis pro m² no Gemeng a Quartier, hedonescht Modell mat 29 belegt Koeffizienten." },
        { title: "Detailléiert Acquisitiounskäschten", desc: "7 % Droit, Transcriptioun, Notar, Bëllegen Akt mat Konditiounen, 3 % VEFA-TVA." },
        { title: "5-Niveau-Aiden-Simulator", desc: "Staatlech Wunnengsprimes, Klimabonus, 1,5 % Klimaprêt, Gemengenhëllefen, 3 % Renovéierungs-TVA." },
        { title: "5 % legale Loyer-Plafong", desc: "Max-Loyer-Berechnung op Basis vum indexéierten investéierte Kapital + amortiséiert Aarbechten." },
        { title: "Kaaf vs Locatioun", desc: "NPV-Vergläich iwwer Dauer, Opportunitéitskäschten. Break-even-Schwell." },
        { title: "Präis-Kaart", desc: "Interaktiv Kaart 100 Gemengen + Stad Lëtzebuerg Quartiere mat Präisser a Rendementer." },
        { title: "Plus-valuen", desc: "Haaptwunneng (Befreiung), Zweetwunneng, Investitioun. Besëtzdauer-Ofschlag." },
        { title: "VEFA-Zwëschenzënsen", desc: "Zënse während der Bauphase a Gesamtkäschte mat 3 % TVA." },
        { title: "Rechtlech Guiden", desc: "Wunnungsloyer, Handelsloyer, Plus-valuen, Matbesëtz, Klimabonus." },
        { title: "Zwou Immobilie vergläichen", desc: "Side-by-side: Präis, Rendement, Käschten, Aiden, Pendeldistanz. Automatesch Empfehlung." },
        { title: "Privatpersoun-Wizard", desc: "4-Schrëtt-Flow: Schätzung + Käschten + Aiden + legale Loyer an engem Wee." },
        { title: "TEGOVA-Feldinspektioun", desc: "41-Punkte-Checklëscht fir Immobilie-Besichtegung." },
      ],
    },
  },
  promoteur: {
    meta: {
      title: "Promoteur-Software Lëtzebuerg : Bilanz, VEFA, Baukäschten",
      description: "Promoteur-Bilanz mat Cashflow-Plang, VEFA-Simulator mat Zwëschenzënsen, STATEC-Baukäschten-Schätzer, Stroossebau- an OAI/ILNAS-Fläch-Ëmwandlung.",
    },
    hero: {
      badge: "Fir LU Promoteuren a Marchands de biens",
      title: "Promoteur-Bilanz a VEFA-Simulatioun,",
      titleAccent: "ouni Käschten dräi Mol anzeginn",
      subtitle: "Komplett Promoteur-Bilanz mat monatlechem Cashflow-Plang a prospektiver Marge, VEFA-Simulator mat Zwëschenzënsen an LU 3 % TVA, STATEC-referenzéierte Baukäschten-Schätzer (17 Gewerker), Stroossebau-Rechner (9 Lous), OAI/ILNAS-Fläch-Ëmwandler. Gebaut fir Lëtzebuerger Promoteuren a Marchands de biens.",
      cta: "Gratis ufänken",
      ctaSecondary: "Kuckt wéi et funktionéiert",
      kpis: [
        { value: "17 Gewerker", label: "STATEC integréiert" },
        { value: "9 Lous", label: "Stroossebau konfiguréierbar" },
        { value: "<24 St", label: "Support-Äntwertzäit" },
      ],
    },
    problem: {
      title: "En Immobilieprojet zu Lëtzebuerg opzesetzen heescht mat 6 Tabellen ze jongléieren",
      intro: "Baukäschten an engem Excel, VEFA an engem aneren, Zwëschenzënse mat der Hand, Cashflow-Plang bei all Iteratioun nei gemaach. Resultat: de Moment wou een gesäit ob de Projet wierklech Marge bréngt, kënnt ganz spéit.",
      items: [
        { title: "Onscharf Baukäschten", desc: "Präisfindung op Basis vum leschte Vergläichsprojet, keng aktuell STATEC-Referenz. Um Enn 10-20 % Spann déi d'Marge ësst.", stat: "±10-20 % typesch Spann" },
        { title: "Komplex VEFA-Zwëschenzënsen", desc: "Fongsopruff-Plang pro Tranche, Kuerzzäit-Kreditzënssaz, 3 % TVA op der richteger Basis ze verdeelen: vill méiglech Feeler.", stat: "~3 St pro Simulatioun" },
        { title: "Keen dynameschen Cashflow-Plang", desc: "3 Méint Baugenehmegung-Verspéidung, 5 % Iwwerschreidung um Rohbau: een muss d'Tabell mat der Hand nei maachen fir den Effekt op d'Enn-Marge ze gesinn.", stat: "~8 St Iwwerschaffung pro Ännerung" },
      ],
    },
    howItWorks: {
      title: "Vun der Präisfindung bis zur Vermaartung, dräi Schrëtt",
      intro: "Dir gitt Terrain a Programm an. D'System rechent Baukäschten, projektéiert VEFA a rechent Marge.",
      steps: [
        { number: "1", title: "Terrain a Programm", desc: "Terrainspräis, bebaubar Fläch no PAG, Programm (Zuel vun Eenheeten, Typen, Flächen), Gemeng. Automatesch PAG/PAP-Reegelpréiwung." },
        { number: "2", title: "Baukäschten + Stroossebau", desc: "Präisfindung no STATEC-Gewerk (17 Posten), Upassung no Energieklass (AAA-C), Ausbau. Stroossebau 9 Lous mat belegte Präisser." },
        { number: "3", title: "Promoteur-Bilanz + VEFA", desc: "Monatlechen Cashflow-Plang, VEFA-Fongsopruff-Simulatioun, Zwëschenzënsen op Baukredit, 3 % Neibau-TVA, Brutto- an Nettomarge." },
      ],
    },
    features: {
      title: "All d'Outillen fir den Opbau vun engem Immobilieprojet",
      intro: "Spezifesch fir Lëtzebuerger Normen (STATEC, OAI FC.04, ILNAS 101:2016, 3 % VEFA-TVA, PAG/PAP) a Maart-Praktiken.",
      items: [
        { title: "Komplett Promoteur-Bilanz", desc: "Ëmsazprojet pro Eenheet, Gesamtkäschten, Finanzéierungskäschten, Brutto- an Nettomarge, Projet-IRR." },
        { title: "Monatlechen Cashflow-Plang", desc: "Monatlech VEFA-Recetten a Bau-Ausgaben. Break-even identifizéiert." },
        { title: "VEFA-Simulator", desc: "Zwëschenzënsen, 3 % TVA op der richteger Basis, financiell Fäerdegstellungsgarantie, Standard-Fongsopruff-Plang." },
        { title: "STATEC-Bau-Schätzer", desc: "17 Gewerker, STATEC-Index Oktober 2025: 1.173,24. Upassung no Energieklass." },
        { title: "Stroossebau-Rechner (9 Lous)", desc: "Äerdaarbechten, Stroossen, Ofwaasser, Waasserversuergung, Beliichtung, Gréngflächen. Belegt Präisser Batiprix 2026 (LU-Koef. ×1,20), CTG, CSDC-CT." },
        { title: "ACT-Fläch-Ëmwandler", desc: "SCB / SCP / benotzbar / bewunnbar nom ILNAS 101:2016. ACT-Gewiichtung nom OAI FC.04." },
        { title: "PAG-PAP-Analyse", desc: "PAG- a PAP-Urbanismusreegele pro Gemeng (COS, CUS, Ofstand, Héicht)." },
        { title: "Landwirtschaftsflächen", desc: "Landwirtschaftsflächen-Bewäertung, Paachrendement, Ëmwandlung an Bauland." },
        { title: "Szenarievergläich", desc: "Méi Szenarie parallel: Programm A (100 % Wunneng) vs B (gemëscht)." },
        { title: "Marge-Sensibilitéit", desc: "Stresstest op Dauer, Baukäschten, Verkafspräis. Worst-Case-Marge ugewisen." },
        { title: "Bank PDF-Rapport", desc: "Komplett Promoteur-Finanzéierungsakt: Bilanz, Cashflow-Plang, Garantien, Virvermaartung." },
        { title: "98 Gemengen-Daten", desc: "Verkafspräisser pro Gemeng, Demografie, Urbanismusreegelen. Virvermaartungspréiwung." },
      ],
    },
  },
  banque: {
    meta: {
      title: "Immobilien-Bewäertungssoftware fir Banken Lëtzebuerg : CRR, LTV, DSCR",
      description: "CRR-konform EVS-2025-Bewäertung, +2 %-Stresstest, LTV/DSCR-Outillen, AML/KYC, CRREM-Energie-Portfolio. Fir LU Kredit-Analysten a Risk Managers.",
    },
    hero: {
      badge: "Fir LU Banken a Kredit-Analysten",
      title: "Immobilie-Kredit-Analyse,",
      titleAccent: "CRR + EVS 2025 an engem Outil",
      subtitle: "EVS-2025-Bewäertung mat CRR-Bélégowäert (Energie-Haircut), LTV / DSCR / Kreditkapazitéit pro CSSF-Profil, AML/KYC mat EU-Sanktiounspréiwung, CRREM-Stranding-Energie-Portfolio. Gebaut fir Lëtzebuerger Kredit-Analysten, Risk Managers a Compliance Officers.",
      cta: "Gratis ufänken",
      ctaSecondary: "Kuckt wéi et funktionéiert",
      kpis: [
        { value: "CRR + EVS 2025", label: "dual Konformitéit" },
        { value: "CRREM-Stranding", label: "Energie-Haircut" },
        { value: "<24 St", label: "Support-Äntwertzäit" },
      ],
    },
    problem: {
      title: "Eng Immobilien-Kredit-Analyse zu Lëtzebuerg heescht 5 getrennt Outillen",
      intro: "Maartwäert an engem Outil, Bélégowäert an engem aneren, AML/KYC iwwer extern Portal, Stresstest mat der Hand. Akten brauchen 3 Deeg, wou se 3 Stonne brauche kéinten.",
      items: [
        { title: "Manuellen CRR-Bélégowäert", desc: "Energie-Haircut-Berechnung no Immobilie-Energieklass, Stranded-Asset-Upassung (CRREM 2030+), Check vun der CRR 575/2013-Konformitéit: vill manuell Duerchgäng.", stat: "~2 St pro Akt" },
        { title: "AML/KYC iwwer méi Plattformen", desc: "EU-Sanktiounspréiwung (CFSP), PEP, Ultimate Beneficial Owner, Hierkonft vun de Suen op 3 verschiddenen Outillen. Kee konsolidéierten Audit-Trail.", stat: "~1 St pro Akt" },
        { title: "Keng Energie-Portfolio-Siicht", desc: "Wéi eng Portfolio-Immobilie si 2030 oder 2040 gestrandet no CRREM? Wéi eng Réckstellung fir Energie-Haircut? Kee konsolidéierten Outil.", stat: "~0 LU Banke equipéiert" },
      ],
    },
    howItWorks: {
      title: "Vun der Kredit-Analyse bis zum Risiko-Reporting, dräi Schrëtt",
      intro: "Dir gitt d'Clientakt an. Den Outil rechent Maartwäert + Bélégowäert, applizéiert Energie-Haircut, préift AML/KYC, liwwert de Rapport.",
      steps: [
        { number: "1", title: "Emprunteur- + Immobilie-Akt", desc: "Emprunteur-Profil (Resident, Net-Resident, Investisseur), Immobilie (Adress, Fläch, Energieklass, Joer), Betrag, Dauer, Zënssaz." },
        { number: "2", title: "Bewäertung + CRR + LTV/DSCR", desc: "EVS-2025-Maartwäert (8 Methoden), CRR-Bélégowäert mat CRREM-Haircut, LTV pro CSSF-Profil, DSCR-Zil 1,25, +2 %-Zëns- a Chômage-Stresstest." },
        { number: "3", title: "AML/KYC + Risiko-Rapport", desc: "EU-Sanktiounen, PEP, UBO, Hierkonft-Suen-Check. Risiko-PDF-Rapport mat strukturéierter Meenung (APPROVED / REVIEW / DECLINED) prett fir de Kredit-Comité." },
      ],
    },
    features: {
      title: "Komplett Bank-Immobilien-Kredit-Analyse",
      intro: "Konform mat der EU-Verordnung 575/2013 (CRR), CSSF-Ufuerderungen, EN 16931, RGPD an EBA-Guidelines zu Immobilien-Sécherheeten.",
      items: [
        { title: "EVS-2025-Bewäertung", desc: "8 TEGOVA-Methoden, 9 Asset-Typen, 98 LU-Gemengen-Daten, automatesch Sensibilitéit. Charte 5e éd. konform." },
        { title: "CRR-Bélégowäert", desc: "Energie-Haircut pro CRREM-Stranding-Joer, Energieklass-Upassung, konform CRR 575/2013 Art. 208." },
        { title: "LTV / DSCR / Kapazitéit", desc: "Max LTV pro Profil (80 % Resident, 70 % Net-Resident, 60 % Investisseur), DSCR-Zil 1,25, Kreditkapazitéit." },
        { title: "+2 %-Stresstest + Chômage", desc: "Risikosimulatiounen: +2 %-Zëns, 6-Méint-Chômage, 10-20 % Wäertverloscht." },
        { title: "Integréiert AML/KYC", desc: "EU-Sanktiounspréiwung (CFSP), PEP, UBO, Hierkonft vun de Suen. Konsolidéierten Audit-Trail, JSON-Export." },
        { title: "CRREM-Energie-Portfolio", desc: "Stranding-Siicht 2030 / 2040 / 2050 pro Immobilie. Energie-Haircut-Réckstellung. Renovéierungs-Tracking." },
        { title: "Risiko-PDF-Rapport", desc: "APPROVED / REVIEW / DECLINED strukturéiert Meenung mat Begrënnung. Vir- oder Haapt-Kredit-Comité." },
        { title: "REST-API fir Bank-CRM", desc: "API-Integratioun: Bewäertung, LTV, Stresstest, AML/KYC. Webhook fir automatesche Push." },
        { title: "Modell-Transparenz", desc: "Ëffentlech MAPE a R², 29 belegt hedonesch Koeffizienten. Auditéierbarkeet fir BCL a CSSF." },
        { title: "Hotel-Bewäertung", desc: "Hotel-spezifesch Methoden (RevPAR × Multiplikator-Kapitaliséierung, Hotel-DSCR 1,25)." },
        { title: "Büro + Detailhandel DCF", desc: "Multi-Locataire-DCF no Bail. Break-Optiounen, Step Rents, geplangtem CAPEX." },
        { title: "Live-Makro-Daten", desc: "10-Joer-OAT, Hypothéik-Zënsen, Baukäschten-Index, Inflatioun. EZB + STATEC." },
      ],
    },
  },
};

// Helper: standard trust blocks fir all Personas
function standardTrust(persona) {
  const titles = {
    agence: "Firwat LU Agencen eis wielen",
    hotel: "Firwat LU Hotelieren eis wielen",
    "expert-evaluateur": "Firwat LU Schätzer eis wielen",
    investisseur: "Firwat LU Investisseure eis wielen",
    particulier: "Firwat LU Privatpersounen eis benotzen",
    promoteur: "Firwat LU Promoteure eis wielen",
    banque: "Firwat LU Banken eis a Betruecht zéien",
  };
  return {
    title: titles[persona],
    agileTitle: "Agile Entwécklung, regelméisseg Releases",
    agileDesc: "Nei Moduler all 2 Wochen geliwwert. Ëffentleche Backlog op github.com/Tevaxia.",
    customTitle: "Individuell Entwécklung méiglech",
    customDesc: "Spezifesch Upassungen, dedizéiert Integratiounen: Entwécklung an 1 bis 3 Wochen.",
    supportTitle: "Support ënner 24 St",
    supportDesc: "E-Mail un contact@tevaxia.lu. Duerchschnëttsäntwert ënner 6 Stonnen op Schaffdeeg.",
  };
}

const COMMON_BLOCKS = {
  syndic: {
    trust: {
      title: "Firwat LU Syndicen eis wielen",
      agileTitle: "Agile Entwécklung, regelméisseg Releases",
      agileDesc: "Nei Moduler all 2 Wochen geliwwert. Ëffentleche Backlog, Är Ufroen ginn séier a Produktioun.",
      customTitle: "Individuell Entwécklung verfügbar",
      customDesc: "Spezifescht Aluedungs-Format, ongewéinlech Tantièmen-Berechnung, Export op Är Komptabilitéit: Entwécklung an 1 bis 3 Wochen.",
      supportTitle: "Support ënner 24 St",
      supportDesc: "E-Mail un contact@tevaxia.lu. Duerchschnëttsäntwert ënner 6 Stonnen op Schaffdeeg. Keng Ticketnummeren, kee Chatbot.",
    },
    pricing: {
      title: "An Ärem tevaxia-Abonnement abegraff",
      subtitle: "Keng Facturatioun pro Matbesëtz, kee GV-Quota, kee Premium-Modul. Alles am Freemium fir ze testen verfügbar, am allgemengen Abonnement fir den alldeegleche Gebrauch.",
      features: ["Onlimitéiert Matbesëtzer", "Online-GV mat Ofstëmmung no Tantièmen", "Factur-X Fongsopruff konform EN 16931", "Lëtzebuerger Matbesëtz-Komptabilitéit", "PSD2 Bankreconciliatioun (Enable Banking)", "Matbesëtzer-Portal mat individuellem Zougang", "5 GV PDF-Komptabilitéitsannexen", "Rappelen op 3 Niveauen mat LU Zënsen", "Konform Gesetz vum 16. Mee 1975"],
      ctaPlatform: "tevaxia-Päck kucken",
      ctaEmit: "Op de Syndic-Modul",
    },
    faq: {
      title: "Dacks gestallten Froen",
      items: [
        { q: "Ech wiesselen vun [engem aneren Outil] op tevaxia, wéi migréieren ech?", a: "Standard-Excel-Import (Eenheeten, Matbesëtzer, Käschten-Historie), duerno Konfiguratioun vun de Verdeelungsschlësselen. D'Iwwerhuele vun engem lafende Geschäftsjoer dauert 2 bis 4 Stonnen. Mir hëllefen Iech ouni Zousazkäschten." },
        { q: "Ass den Outil konform mam Lëtzebuerger Matbesëtzerecht?", a: "Jo, d'Gesetz vum 16. Mee 1975 ass integréiert: einfach / absolut / duebel / eestëmmeg Majoritéiten, 15-Deeg-Aluedungsfrist, Buchhaltungsflichten, 10-Joer-Archivéierung." },
        { q: "Ass eng Online-GV rechtsgëlteg?", a: "Jo, sou laang d'Matbesëtzreegelen et erlaben oder eng fréier physesch GV et genehmegt huet. D'Praxis ass zënter 2020 zu Lëtzebuerg verbreet." },
        { q: "Kënne Fongsopruff fir TVA-befreit Matbesëtzer erausgi ginn?", a: "Jo, Art. 44 §1 f vum TVA-Gesetz befreit Matbesëtz-Verwaltung. De Modul applizéiert automatesch déi richteg Befreiung." },
        { q: "Sinn d'Matbesëtzer-Donnéeë sécher?", a: "Gespäichert op Supabase (AWS eu-central-1 Frankfurt) mat Row Level Security, RGPD-konform, HTTPS-Verschlësselung." },
        { q: "Wéi laang bis ech operativ sinn?", a: "E Syndic mat 1 bis 5 Matbesëtzer ass an 1 bis 2 Stonnen operativ. Iwwer 10 Matbesëtzer, 4 bis 6 Stonne fir komplette Import." },
      ],
    },
    finalCta: { title: "Prett fir Är Owender zréckzehuelen", desc: "Kont gratis erstellen, éischt Matbesëtz importéieren, Test-Fongsopruff an 15 Minutte generéieren. Null Engagement.", cta: "Gratis ufänken", ctaSecondary: "Syndic-Modul live kucken" },
  },
};

const REST = {
  agence: {
    trust: standardTrust("agence"),
    pricing: { title: "An Ärem tevaxia-Abonnement abegraff", subtitle: "Keng Facturatioun pro Mandat, keng pro Kontakt. Dat ganzt CRM ass am allgemengen Abonnement abegraff.", features: ["Onlimitéiert OpenImmo-Mandater", "Onlimitéiert Kontakter mat CSV-Import", "Automatescht /100 Keefer-Matching", "Drag-Drop Kanban-Pipeline", "Co-Branding Immobilie-PDFs", "Besichtegungszedelen an eIDAS-Ënnerschrëft", "Automatiséiert Nurturing-Sequenzen", "Agent-Kommissiounen a Performance", "10 editéierbar E-Mail-Schablounen"], ctaPlatform: "tevaxia-Päck kucken", ctaEmit: "Op d'CRM" },
    faq: { title: "Dacks gestallten Froen", items: [
      { q: "Ass et kompatibel mat athome.lu an LU-Portaler?", a: "Jo, den OpenImmo 1.2.8 Export ass de Standardformat, dee vun athome.lu, immotop.lu, wort.lu, sou wéi immoscout24.de an idealista.it/pt akzeptéiert gëtt." },
      { q: "Wéi funktionéiert de Keefer-Matching?", a: "Den Algorithmus vergläicht all Mandat mat all Keefer no 6 gewiichte Kritären: Budget, Rayon, Typ, Fläch, Energieklass, Projetsdatum." },
      { q: "Ech kommen vun engem aneren CRM, wéi migréieren ech?", a: "Standard-CSV-Import. Automatescht Kolonn-Mapping mat Virschau. Déi meescht Agencen si bannent 2 bis 4 Stonnen operativ. Gratis Migratiouns-Hëllef." },
      { q: "Kann ech méi Agencen / Agente mat getrennte Rollen verwalten?", a: "Jo, Multi-Entity-Organisatioune mat Rollen (Admin, Agent, Assistent). All Agent gesäit nëmmen déi Mandater a Kontakter, déi him zougedeelt sinn." },
      { q: "Ass d'eIDAS-Ënnerschrëft rechtsgëlteg?", a: "Jo, déi fortgeschratt eIDAS elektronesch Ënnerschrëft (EU-Verordnung 910/2014) huet rechtlech Gëltegkeet gläichwäerteg mat der handgeschriwwener Ënnerschrëft." },
      { q: "Sinn d'Kontakt-Donnéeë RGPD-sécher?", a: "Donnéeën op Supabase (AWS eu-central-1 Frankfurt), user-baséiert Row Level Security, HTTPS. Komplette Datenexport als ZIP zu all Moment." },
    ]},
    finalCta: { title: "Prett fir Äert Business ze konsolidéieren", desc: "Kont erstellen, Kontakt-Datebank importéieren, éischt Matching an 15 Minutten ausféieren. Null Engagement.", cta: "Gratis ufänken", ctaSecondary: "CRM live kucken" },
  },
  hotel: {
    trust: standardTrust("hotel"),
    pricing: { title: "An Ärem tevaxia-Abonnement abegraff", subtitle: "Keng Facturatioun pro Zëmmer, keng pro Reservatioun. Dat komplette PMS ass am allgemengen Abonnement abegraff.", features: ["Onlimitéiert Etablissementer a Zëmmeren", "Onlimitéiert Reservatiounen", "USALI 19-Kategorien-Folios mat Auto-Posting", "LU TVA 3 % / 8 % / 17 %-Rechnung + Factur-X", "Monatleche USALI-Report + 90-Deeg-Forecast", "iCal Import/Export (Booking, Airbnb, VRBO)", "Restaurant/Bar-POS + MICE-Gruppen", "Belegungs-Heatmap a Pickup-Report"], ctaPlatform: "tevaxia-Päck kucken", ctaEmit: "Op de PMS" },
    faq: { title: "Dacks gestallten Froen", items: [
      { q: "Ass et kompatibel mat Booking.com an Airbnb?", a: "Jo, iwwer iCal. Dir huelt all OTA iCal-Link aus hirer Uewerfläch, setzt en an tevaxia an, a Reservatioune kommen all 15 min eran." },
      { q: "Wéi funktionéiert d'LU 3 %-Logement-TVA?", a: "3 % TVA gëllt fir Tourismus-Iwwernuechtungen. Eise Modul applizéiert automatesch 3 % op USALI-Zëmmer + Zousazbett, 17 % op F&B, 0 % op Séjour-Taxe." },
      { q: "Meng Firmenclienten wëlle Factur-X, gëtt et ënnerstëtzt?", a: "Jo. Um Check-out aktivéiert d'Optioun Firmenrechnung d'Factur-X-Generatioun (PDF/A-3 + agebautem EN 16931 XML)." },
      { q: "Ass den 90-Deeg-Forecast zouverléisseg?", a: "D'Holt-Winters-Modell mat wëchentlecher Saisonalitéit liwwert typesch MAPE vun 8-15 %. Gutt fir d'Personalplanung." },
      { q: "Kann ech méi Hoteller vun engem Kont verwalten?", a: "Jo. Natiiv Multi-Property. Konsolidéiert Dashboard fir Portfolio-Siicht. Funktionéiert fir Hotelgruppe bis 15-20 Etablissementer." },
      { q: "Sinn meng Donnéeën an der EU gehost?", a: "Supabase (AWS eu-central-1, Frankfurt). Row Level Security, HTTPS. Komplette Gaascht-Datenexport als ZIP zu all Moment." },
    ]},
    finalCta: { title: "Prett fir d'Kontroll iwwer Äre Betrib zréckzehuelen", desc: "Kont erstellen, éischt Etablissement an 20 Minutte konfiguréieren, éischt Reservatioun erfaassen. Null Engagement.", cta: "Gratis ufänken", ctaSecondary: "PMS live kucken" },
  },
  "expert-evaluateur": {
    trust: standardTrust("expert-evaluateur"),
    pricing: { title: "An Ärem tevaxia-Abonnement abegraff", subtitle: "Keng Facturatioun pro Rapport, kee Méintquota. Dat ganzt Bewäertungsmodul ass am allgemengen Abonnement abegraff.", features: ["Onlimitéiert EVS-2025-Rapporten", "8 Bewäertungsmethoden", "9 ënnerstëtzt Asset-Typen", "Automatesch ausgefëllt Makro- a Gemengen-Daten", "Automatesch Vergläichsobjet no Nopeschaft", "SHA-256-Ënnerschrëft + Schätzer-Logo", "TEGOVA 41-Punkte-Inspektioun (offline)", "Hedonescht Modell mat ëffentlechem MAPE/R²"], ctaPlatform: "tevaxia-Päck kucken", ctaEmit: "Op de Bewäertungsmodul" },
    faq: { title: "Dacks gestallten Froen", items: [
      { q: "Ass de Rapport Charte 5e éd. konform?", a: "Jo, déi 11 obligatoresch Sektiounen follegen der TEGOVA/Charte-Struktur. EVS-5-Spezialhypothesen a wesentlech Onsécherheet abegraff." },
      { q: "Kann ech nëmmen déi relevant Methoden fir meng Immobilie wielen?", a: "Jo. Toggle pro Methode: Vergläich + Kapitaliséierung fir geléinte Büro aktivéieren, DCF eleng fir Investitioun, energetesch Residualmethod fir schwéier Renovéierung." },
      { q: "Sinn d'Gemengen-Donnéeën aktuell?", a: "Jo, m²-Präisser vum Observatoire de l'Habitat (trimestriell), Demografie vum STATEC (jäerlech), Makrosäz vun der EZB (monatlech)." },
      { q: "Kann ech de PDF mat mengem Logo a Qualifikatiounen upassen?", a: "Jo, an Ärem Profil: Logo, kompletten Numm, Qualifikatiounen (z.B. REV TEGOVA, MRICS), ugepassten legale Vermierk." },
      { q: "Huet d'SHA-256-Ënnerschrëft rechtlecht Gewiicht?", a: "D'SHA-256-Ënnerschrëft garantéiert d'Integritéit vum Dokument. Si ersetzt keng rechtlech qualifizéiert eIDAS-Ënnerschrëft, gëtt awer kryptografesche Beweis datt de Rapport net geännert gouf." },
      { q: "Wéi ginn EVS-5-Spezialhypothesen behandelt?", a: "Dedizéiert Sektioun: Dir lëscht d'verbindlech Hypothesen, den Outil weist d'obligatoresch EVS-5-Warnung a passt de Wäert op Basis vun den Inputen un." },
    ]},
    finalCta: { title: "Prett fir 3 Stonne pro Rapport ze spueren", desc: "Kont erstellen, Profil personaliséieren, éischten EVS-2025-Rapport an 20 Minutte generéieren. Null Engagement.", cta: "Gratis ufänken", ctaSecondary: "Bewäertungsmodul kucken" },
  },
  investisseur: {
    trust: standardTrust("investisseur"),
    pricing: { title: "An Ärem tevaxia-Abonnement abegraff", subtitle: "Keng Facturatioun pro Simulatioun, kee Quota. All Investment-Outillen sinn am allgemengen Abonnement abegraff.", features: ["Onlimitéiert Simulatiounen", "LU Acquisitiounskäschten mat Bëllegen Akt", "Multi-Locataire-DCF no Bail", "VEFA mat Zwëschenzënsen", "LU Plus-valuen", "Konsolidéiert Multi-Asset-Portfolio", "Bank-Outillen LTV / DSCR / CRR", "Live-Makro EZB + STATEC"], ctaPlatform: "tevaxia-Päck kucken", ctaEmit: "Op de Portfolio" },
    faq: { title: "Dacks gestallten Froen", items: [
      { q: "Gëtt de Bëllegen-Akt-Ofzuch richteg behandelt?", a: "Jo, den Outil iwwerpréift d'Berechtegungskonditiounen an applizéiert bis zu 40.000 € pro Persoun Ofzuch op d'Agraangsdroit." },
      { q: "Gëtt 3 % Neibau-TVA korrekt integréiert?", a: "Jo, de VEFA-Simulator applizéiert automatesch den 3 %-Saz ënner der Konditioun Haaptwunnsëtz 2 Joer Mindestokkupatioun." },
      { q: "Behandelt de Multi-Locataire-DCF franséisch a LU Breaks?", a: "Jo. All Bail kann Dauer, Indexéierung, geplangte Step Rents, Break-Optiounen, geplangtem CAPEX hunn." },
      { q: "Ginn LU Plus-valuen korrekt ausgerechent?", a: "Jo. Haaptwunneng Befreiung, Zweetwunneng Halleft-Global-Saz, Investitioun Global-/Halleft-Global-Saz no der Halleng." },
      { q: "Folgen d'Bank-Outillen (LTV, DSCR, CRR) de CSSF-Reegelen?", a: "Jo. Max LTV pro Emprunteur-Profil, DSCR-Zil 1,25, CRR-Bélégowäert mat Energie-Haircut. +2 %-Stresstest." },
      { q: "Kann ech meng Simulatioune mat mengem Bankberuder deelen?", a: "Jo. Dedizéierten Finanzéierungsakt-PDF. View-only-Deelen mat 7-90-Deeg-Link." },
    ]},
    finalCta: { title: "Prett fir séier a gutt ze decidéieren", desc: "Kont erstellen, éischt Szenario aginn, komplett Rendement a 5 Minutte kréien. Null Engagement.", cta: "Gratis ufänken", ctaSecondary: "Portfolio live kucken" },
  },
  particulier: {
    trust: standardTrust("particulier"),
    pricing: { title: "Gratis, keng Umeldung fir dat Wesentlechst", subtitle: "All Basis-Outille funktionéieren ouni Kont. Gratis Kont erstellen fir Simulatiounen ze späicheren, PDFs ze exportéieren an op d'Historie zouzegräifen.", features: ["Schätzung, Käschten, Aiden, Loyer ouni Kont", "PDF-Export mat gratis Kont", "Multi-Device Cloud-Späichere", "Simulatiounshistorie", "View-only-Link-Deelen", "Vergläich vu bis zu 5 Szenarien", "Maart-Notifikatioune pro Gemeng", "5 Sproochen (FR / EN / DE / LB / PT)"], ctaPlatform: "tevaxia-Päck kucken", ctaEmit: "Immobilie schätzen" },
    faq: { title: "Dacks gestallten Froen", items: [
      { q: "Ass d'Schätzung zouverléisseg?", a: "MAPE vu ~12 %, vergläichbar mat Bank-Outillen. Et bleift eng Schätzung: eng zertifizéiert REV-Bewäertung ass fir d'Bankfinanzéierung empfohlen." },
      { q: "Gëtt de Bëllegen Akt korrekt ausgerechent?", a: "Jo. Konditiounen iwwerpréift (Haaptwunneng, 2 Joer Okkupatioun). Bis zu 40.000 € pro Persoun Ofzuch." },
      { q: "Sinn d'Gemengen-Aiden aktuell?", a: "Jo, iwwer 30 Gemengen hunn hir Säz integréiert. Kontaktéiert eis, wann Är feelt." },
      { q: "Gëllt d'5 %-Loyer-Reegel fir all Lounen?", a: "Jo fir Wunnraum-Lounen ënner dem Gesetz vum 21.09.2006. Ausnamen: Handelsloyer, kuerzfristeg méubléiert, Studenterezidenzen." },
      { q: "Kann ech d'Outillen ouni Kont benotzen?", a: "Jo, all Basis-Outille funktionéieren ouni Umeldung. De gratis Kont fräi schalt PDF-Export, Cloud-Späichere, Historie a Link-Deelen." },
      { q: "Ginn meng Donnéeën opbewahrt?", a: "Ouni Kont bleift näischt server-side. Mat gratis Kont op Supabase (AWS eu-central-1, Frankfurt) mat RLS gespäichert." },
    ]},
    finalCta: { title: "Prett fir kloer ze gesinn", desc: "Fänkt mat der Immobilie-Schätzung oder der Käschte-Simulatioun un. Keng Umeldung, keen Engagement, an 2 Minutten.", cta: "Immobilie gratis schätzen", ctaSecondary: "All Outillen kucken" },
  },
  promoteur: {
    trust: standardTrust("promoteur"),
    pricing: { title: "An Ärem tevaxia-Abonnement abegraff", subtitle: "Keng Facturatioun pro Projet, kee Simulatiounsquota. All Promoteur-Outillen sinn am allgemengen Abonnement abegraff.", features: ["Onlimitéiert Promoteur-Bilanzen", "VEFA mat Zwëschenzënsen", "STATEC-Bau-Schätzer 17 Gewerker", "Stroossebau-Rechner 9 belegt Lous", "OAI/ILNAS ACT-Fläch-Ëmwandler", "PAG/PAP-Analyse 98 Gemengen", "Onlimitéiert Szenarievergläich", "Bank PDF-Rapport", "Multi-Parameter-Marge-Stresstest"], ctaPlatform: "tevaxia-Päck kucken", ctaEmit: "Op d'Promoteur-Bilanz" },
    faq: { title: "Dacks gestallten Froen", items: [
      { q: "Sinn d'STATEC-Indexen aktuell?", a: "Jo, de Baukäschten-Index gëtt trimestriell aktualiséiert (aktuellste Wäert: Oktober 2025 = 1.173,24). Déi 17 STATEC-Gewerker sinn ofgedeckt." },
      { q: "Gëtt 3 % Neibau-TVA richteg behandelt?", a: "Jo, fir Resident-Éischtkeefer, déi d'Immobilie mindestens 2 Joer bewunnen." },
      { q: "Kann ech eegen Baukäschte konfiguréieren?", a: "Jo, déi 17 STATEC-Gewerker déngen als Referenz, sinn awer all upassbar." },
      { q: "Entsprécht de Stroossebau Lëtzebuerger Reegelen?", a: "Jo, déi 9 Stroossebau-Lous benotzen Batiprix-2026-Präisser (LU-Koeffizient ×1,20), CTG 002 & 009, CSDC-CT." },
      { q: "Respektéiert d'Fläch-Ëmwandlung OAI/ILNAS-Normen?", a: "Jo, ILNAS 101:2016 fir déi 4 Fläch-Typen. ACT-Gewiichtung nom OAI FC.04." },
      { q: "Kann ech meng Bilanz fir meng Bank exportéieren?", a: "Jo, komplette Promoteur-Finanzéierungsakt-PDF: Bilanz, monatlechen Cashflow-Plang, Marge-Sensibilitéit. View-only-Deele méiglech." },
    ]},
    finalCta: { title: "Prett fir Är Projeten méi séier ze kalkuléieren", desc: "Kont erstellen, éischt Projet aginn, Bilanz an 30 Minutte kréien. Null Engagement.", cta: "Gratis ufänken", ctaSecondary: "Promoteur-Bilanz kucken" },
  },
  banque: {
    trust: standardTrust("banque"),
    pricing: { title: "An Ärem tevaxia-Abonnement abegraff", subtitle: "Keng Facturatioun pro Akt. All Bank-Outillen sinn am allgemengen Abonnement abegraff.", features: ["Onlimitéiert EVS-2025-Bewäertungen", "CRR-Bélégowäert mat CRREM-Haircut", "LTV / DSCR / Kreditkapazitéit", "+2 %- a Chômage-Stresstest", "AML/KYC mat Audit-Trail", "CRREM-Stranding-Energie-Portfolio", "Strukturéierte Risiko-PDF-Rapport", "REST-API fir CRM-Integratioun", "Multi-Locataire-DCF + Hotel-Bewäertung"], ctaPlatform: "tevaxia-Päck kucken", ctaEmit: "Op d'Bank-Outillen" },
    faq: { title: "Dacks gestallten Froen", items: [
      { q: "Wéi gëtt de CRR-Bélégowäert ausgerechent?", a: "EVS-2025-Maartwäert minus Energie-Haircut op Basis vun der Immobilie-Energieklass an der CRREM-Trajectoire. Een Asset dat virum 2030 gestrandet ass kritt 20-30 % Haircut." },
      { q: "Deckt AML/KYC d'CSSF-Ufuerderungen of?", a: "Jo: EU-Sanktiounspréiwung (CFSP), PEP, UBO, Hierkonft vun de Suen. Konsolidéierten Audit-Trail mat Zäitstempelen. Exportéierbare Rapport fir CSSF-Auditen." },
      { q: "Ass de Stresstest EBA-konform?", a: "Jo, d'Standardszenarien (+2 %-Zëns, 6-Méint-Chômage, 10-20 % Wäertverloscht) entspriechen den EBA-Erwaardungen un Resilienz-Teschter." },
      { q: "Kënne mir iwwer API un eise Core Banking intégréieren?", a: "Jo, REST-API mat OAuth 2.0. Endpunkten: Bewäertung, LTV, Stresstest, AML/KYC. Webhook fir automatesche Push. Ëffentlech OpenAPI 3.1 Dokumentatioun." },
      { q: "Wéi gëtt d'BCL- a CSSF-Konformitéit behandelt?", a: "Hedonescht Modell mat ëffentlechem MAPE a R² fir d'Auditéierbarkeet, 29 belegt Koeffizienten dokumentéiert. Ëffentlech /transparence-Säit." },
      { q: "Sinn d'Clientendaten op Bankenniveau sécher?", a: "Supabase-Späicheren (AWS eu-central-1 Frankfurt), Row Level Security, HTTPS, ISO 27001. Strikt Isolatioun pro Organisatioun." },
    ]},
    finalCta: { title: "Prett fir Är Kreditakte méi séier ze maachen", desc: "Pilot-Kont erstellen, Test-Akt verbannen, Bewäertung + CRR + AML/KYC an 10 Minutte kréien. Kontaktéiert eis fir e Bank-POC.", cta: "Gratis ufänken", ctaSecondary: "Bank-Outillen kucken" },
  },
};

// Merge common blocks into each persona
for (const [key, rest] of Object.entries(REST)) {
  SOLUTIONS[key] = { ...SOLUTIONS[key], ...rest };
}
// Syndic uses custom COMMON_BLOCKS.syndic
SOLUTIONS.syndic = { ...SOLUTIONS.syndic, ...COMMON_BLOCKS.syndic };

const SOLUTIONS_HUB = {
  meta: {
    title: "Lëtzebuerger Immobilielésungen no Profil : tevaxia.lu",
    description: "Syndic, Agence, Hotellerie, Schätzer, Investisseur, Privatpersoun: fannt déi tevaxia.lu-Lésung fir Äre Beruff. LU-Konformitéit, ëffentlech Daten, 5 Sproochen.",
  },
  hero: {
    badge: "6 Lésungen geduecht no Beruff",
    title: "Fannt déi Lésung déi zu Ärem Beruff passt",
    subtitle: "All Profil huet seng eege rechtlech Flichten, Workflows a Quelldaten, déi spezifesch fir de Lëtzebuerger Maart sinn. Anstatt an 40+ Outillen ze sichen, fänkt bei Ärem Beruff un.",
  },
  personas: {
    cta: "Detailléiert Lésung kucken",
    syndic: { title: "Syndic de copropriété", desc: "Online-GV mat Ofstëmmung no Tantièmen, Factur-X Fongsopruff, LU Matbesëtz-Komptabilitéit, PSD2 Bankreconciliatioun. Konform Gesetz vum 16. Mee 1975." },
    agence: { title: "Immobilienagence", desc: "OpenImmo Mandatspipeline, Kontakt-CRM mat /100 Keefer-Matching, Drag-Drop Kanban, Co-Branding Immobilie-PDFs, eIDAS-Ënnerschrëft." },
    hotel: { title: "Hotellerie", desc: "Multi-Etablissement-PMS, USALI 19 Kategorien Auto-Posting-Folios, LU TVA 3 %/8 %/17 % Rechnung, 90-Deeg-Forecast, iCal OTA." },
    "expert-evaluateur": { title: "Schätzer / Expert", desc: "TEGOVA EVS 2025-konforme Rapport an 20 min, 8 Methoden, 9 Asset-Typen, automatesch ausgefëllt Daten (98 Gemengen + 12 Makro-Serien)." },
    investisseur: { title: "Investisseur", desc: "Rendementsimulator mat Bëllegen Akt, Multi-Locataire-DCF, VEFA-Zwëschenzënsen, LU Plus-valuen, Multi-Asset-Portfolio." },
    particulier: { title: "Privatpersoun", desc: "Schätzung, Acquisitiounskäschten mat Bëllegen Akt, 5 Schichten vu kumuléierbaren Aiden (Klimabonus abegraff), legale 5 %-Loyer-Plafong." },
  },
  compare: {
    title: "Schnelle Komparator",
    intro: "Wann Dir tëscht zwee Profiler zéckt, vergläicht den alldeegleche Gebrauch, déi legal Konformitéit an déi implementéiert Standards.",
    profileCol: "Profil",
    dailyCol: "Alldeegleche Gebrauch",
    complianceCol: "LU-Konformitéit",
    standardsCol: "Standards",
    rows: {
      syndic: { daily: "GV, Fongsopruff, Rappelen, Matbesëtz-Komptabilitéit geréieren", compliance: "Gesetz vum 16. Mee 1975, TVA Art. 44 §1 f Befreiung", standards: "EN 16931, Peppol, ISO 20022" },
      agence: { daily: "Mandater, Kontakter, Portalverdeelung, Keefer-Matching", compliance: "eIDAS UE 910/2014, RGPD Zoustëmmung", standards: "OpenImmo 1.2.8, eIDAS" },
      hotel: { daily: "Reservatiounen, Folios, Rechnung, Revenue Management", compliance: "3 %-Logement-TVA, kommunal Séjour-Taxe", standards: "USALI 11th ed., STR, iCal" },
      "expert-evaluateur": { daily: "Immobilie-Bewäertungen, Rapporten, Feldinspektiounen", compliance: "TEGOVA EVS 2025, Charte 5e éd.", standards: "EVS 2025, Red Book, RICS" },
      investisseur: { daily: "Rendement, DCF, Finanzéierungssimulatiounen, Portfolio", compliance: "Bëllegen Akt, LU Plus-valuen, CSSF-Reegelen", standards: "CRR, EZB, Basel III" },
      particulier: { daily: "Schätzung, Käschten, Aiden, Kaaf/Locatioun-Vergläich", compliance: "Gesetz 21.09.2006, 5 %-Reegel, Klimabonus", standards: "IRL, Observatoire Habitat, STATEC" },
    },
  },
  faq: {
    title: "Gemeinsam Froe fir déi 6 Profiler",
    intro: "Zum Präismodell, zur individueller Entwécklung, zum Support, zur Sécherheet an zur Migratioun.",
    items: [
      { q: "Wéivill kascht den tevaxia-Abonnement?", a: "Keng Facturatioun pro Modul oder pro Benotzer bannent all Profil. Een eenzegen tevaxia-Abonnement gëtt Zougang zu alle Outillen fir Äre Beruff, ouni Quoten oder Volumelimitten. Komplett Präisopstellung op der /pricing-Säit." },
      { q: "Kann ech eng individuell Entwécklung ufroen?", a: "Jo. Spezifescht Format, atypesch Berechnung, dedizéiert Integratioun: Entwécklung an 1 bis 3 Wochen no Komplexitéit. Gratis Devis." },
      { q: "Wat ass d'Support-Äntwertzäit?", a: "Duerchschnëttsäntwert ënner 6 Stonnen op Schaffdeeg, maximal 24 Stonnen. E-Mail un contact@tevaxia.lu. Kee Chatbot, keng nummeréiert Ticketen: Dir schwätzt mat engem Mënsch, deen d'Produkt kennt." },
      { q: "Sinn d'Donnéeën an der EU gehost?", a: "Jo. Supabase (AWS eu-central-1, Frankfurt) mat user-baséiert Row Level Security, HTTPS, RGPD-konform. Komplette Datenexport als ZIP zu all Moment." },
      { q: "Wéi migréieren ech vun engem aneren Outil?", a: "CSV- oder Excel-Import no der Datenaart. Automatescht Kolonn-Mapping mat Virschau. Gratis Migratiouns-Hëllef." },
      { q: "Wéi dacks ginn d'Updates verëffentlecht?", a: "Releases am Schnëtt all 2 Wochen. Ëffentleche Backlog op github.com/Tevaxia. Auto-Updates: näischt z'installéieren." },
      { q: "Ass tevaxia multilingual?", a: "Jo, 5 Sproochen: Franséisch, Englesch, Däitsch, Portugisesch a Lëtzebuergesch. D'Persona-Landings si momentan komplett op FR an EN, mat DE/LB/PT an der Iwwersetzung." },
      { q: "Kann een tevaxia ausserhalb vu Lëtzebuerg benotzen?", a: "D'Plattform ass haaptsächlech fir de Lëtzebuerger Rechtsrahmen kalibréiert (3 % TVA, Bëllegen Akt, 5 %-Reegel, TEGOVA). E puer Moduler funktionéieren och fir Frankräich a Belsch (Factur-X, DCF, Kaaf/Locatioun-Komparator)." },
    ],
  },
  orientation: {
    title: "Net sécher wéi ee Profil zu Iech passt?",
    desc: "Schreift eis Är Tätegkeet op 2 Zeilen, mir orientéieren Iech a manner wéi 24 Stonnen op déi passend Lésung.",
    ctaContact: "E-Mail un contact@tevaxia.lu",
    ctaHome: "Zréck op d'Startsäit",
  },
};

// Now write to lb.json
const file = "src/messages/lb.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));
data.solutions = SOLUTIONS;
data.solutionsHub = SOLUTIONS_HUB;
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("lb.json updated: solutions + solutionsHub translated to Luxembourgish");
