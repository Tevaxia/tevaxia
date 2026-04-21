#!/usr/bin/env node
/**
 * Traductions DE propres pour les 8 personas + hub.
 * Remplace le fallback EN dans src/messages/de.json.
 * Terminologie business allemande, termes LU préservés (Bëllegen Akt,
 * Klimabonus, loi 16 mai 1975, etc.).
 */
import fs from "node:fs";

const SOLUTIONS = {
  syndic: {
    meta: {
      title: "Hausverwaltungs-Software Luxemburg, konform Gesetz 16.05.1975",
      description: "Verwalten Sie Ihre Gemeinschaften ohne Excel-Wochenenden: Online-Eigentümerversammlungen, Factur-X-Mittelabrufe, LU-Buchhaltung, PSD2-Bankabgleich. Kostenlose Testversion.",
    },
    hero: {
      badge: "Für Luxemburger Eigentümergemeinschaften gebaut",
      title: "Ihre Hausverwaltung, ohne",
      titleAccent: "Wochenenden an Excel",
      subtitle: "Online-Eigentümerversammlungen mit tantième-gewichteter Abstimmung, Factur-X-konforme Mittelabrufe, luxemburgische Gemeinschafts-Buchhaltung und automatischer Bankabgleich. Gebaut für professionelle Hausverwalter, die es leid sind, zwischen 4 Werkzeugen zu jonglieren.",
      cta: "Kostenlos starten",
      ctaSecondary: "Funktionsweise ansehen",
      kpis: [
        { value: "15 h", label: "pro EV eingespart" },
        { value: "100 %", label: "konform Gesetz 16.05.1975" },
        { value: "<24 h", label: "Support-Antwortzeit" },
      ],
    },
    problem: {
      title: "Eine Gemeinschaft in Luxemburg 2026 zu verwalten, sollte nicht mehr so aussehen",
      intro: "Zwischen Gesetz vom 16. Mai 1975, vierteljährlichen Mittelabrufen, Mahnungen, EV-Vorbereitung und Buchhaltung füllt sich die Woche eines Hausverwalters von selbst. Ausser die richtigen Werkzeuge nehmen die Last ab.",
      items: [
        { title: "EV-Vorbereitung in 3 Tagen", desc: "Einladungen innerhalb von 15 Tagen, Tagesordnung entwerfen, Vollmachten sammeln, Protokoll später tippen. Der Verwaltungsaufwand frisst die Zeit, die den eigentlichen Themen gelten sollte.", stat: "~15 Stunden pro EV" },
        { title: "Mahnungen von Hand", desc: "Verfolgen wer was schuldet, Fristen überwachen, gesetzliche Zinsen berechnen, formelle Mahnungen vorbereiten. Ohne Spezialwerkzeug geht etwas durch, und die Kasse schrumpft.", stat: "3-7 % chronisch unbezahlt" },
        { title: "Excel, Bank und Buchhaltung jonglieren", desc: "Eingehende Zahlungen mit Mittelabrufen abgleichen, in Buchhaltung erfassen, EV-Anlagen aus 3 Quellen zusammenstellen. Jeder Schritt birgt Fehlerrisiko.", stat: "4 Werkzeuge im Durchschnitt" },
      ],
    },
    howItWorks: {
      title: "Eine Plattform, drei Schritte",
      intro: "Keine komplexe Migration, keine 2-tägige Schulung. Sie importieren Ihre Gemeinschaften, konfigurieren einmal die Verteilungsschlüssel, und das Werkzeug übernimmt.",
      steps: [
        { number: "1", title: "Ihre Gemeinschaften importiert", desc: "Excel-Import, manuelle Eingabe oder API. Einheiten, Tantièmes, Miteigentümer, Verträge, Buchhaltungshistorie. Funktioniert mit jeder Hausverwaltung, die bereits strukturiert ist." },
        { number: "2", title: "EV und Mittelabrufe laufen selbst", desc: "PDF-Einladungen pro Einheit, tantième-gewichtete elektronische Abstimmung, automatisch erstelltes Protokoll. EN-16931-konforme Factur-X-Mittelabrufe an Miteigentümer mit SEPA-Referenz." },
        { number: "3", title: "Buchhaltung läuft von selbst", desc: "Jeder Mittelabruf, jede eingehende Zahlung, jede erfasste Ausgabe fliesst in das Buchhaltungsjournal. Die 5 EV-Anlagen werden auf Knopfdruck als PDF generiert." },
      ],
    },
    features: {
      title: "Alles, was ein luxemburgischer Hausverwalter wirklich braucht",
      intro: "Funktionen gebaut für den Rechtsrahmen des Grossherzogtums: Gesetz vom 16. Mai 1975, EV-Mehrheitsregeln, MwSt-Befreiung Art. 44 §1 f, 10-Jahres-Archivierung.",
      items: [
        { title: "Online-EV mit gewichteter Abstimmung", desc: "Elektronische Abstimmung gewichtet nach Tantièmes, einfache / absolute / doppelte / einstimmige Mehrheiten automatisch behandelt." },
        { title: "Einladungen + PDF-Protokolle", desc: "Einladung pro Einheit mit rechtlicher Tagesordnung, automatisch erstelltes Protokoll nach EV mit Ergebnissen." },
        { title: "Factur-X-Mittelabrufe", desc: "PDF/A-3 + CII D22B XML konform EN 16931, SEPA-Mandatsreferenz, Art. 261 D CGI Befreiung angewandt." },
        { title: "Mahnungen in 3 Stufen", desc: "Freundliche Erinnerung, formelle Mahnung, Zahlungsaufforderung. Luxemburgische gesetzliche Zinsen automatisch berechnet." },
        { title: "5 EV-Buchhaltungsanlagen", desc: "Bilanz, Journal, Budget, Kostenverteilung, Status offene Forderungen. Verteilbereite PDFs." },
        { title: "PSD2-Bankabgleich", desc: "Verbindung zu BCEE, BIL, Banque Raiffeisen, Post Finance über Enable Banking. Automatischer Abgleich." },
        { title: "Konfigurierbare Verteilungsschlüssel", desc: "Allgemeine Tantièmes, Betriebs-Tantièmes, Sonderkosten pro Treppenhaus/Gebäude, individuelle Anteile." },
        { title: "Miteigentümer-Portal", desc: "Jeder Miteigentümer hat seinen Bereich: Abstimmung, Kontoauszug, Einladungen, Protokolle, Online-Zahlung." },
        { title: "10 bearbeitbare Briefvorlagen", desc: "Mahnungen, Einladungen, formelle Mitteilungen, Vollmachten. Vollständig anpassbar, DOCX / PDF / Google Drive Export." },
        { title: "Kostenlose Rechnungs-OCR", desc: "Lieferantenrechnungen hochladen, automatische Extraktion via PDF.js + Tesseract.js. Keine manuelle Eingabe." },
        { title: "SEPA-Sammelüberweisungen", desc: "pain.001 XML-Generierung für gruppierte Lieferantenzahlungen, kompatibel mit allen luxemburgischen Banken." },
        { title: "Kosten-Benchmark", desc: "Vergleich Ihrer Kosten pro m² mit dem luxemburgischen Durchschnitt nach Wohnungstyp und Baujahr." },
      ],
    },
  },
  agence: {
    meta: {
      title: "Makler-CRM Luxemburg — Mandatspipeline, Matching, OpenImmo",
      description: "Zentralisieren Sie Mandate, Kontakte und Aufgaben in einem CRM, das für LU-Makler gebaut ist. Automatisches Käufer-Matching, Co-Branding-Objekt-PDFs, eIDAS-Signatur.",
    },
    hero: {
      badge: "Immobilien-CRM für LU-Makler",
      title: "Ihre Mandatspipeline in",
      titleAccent: "einem Werkzeug, nicht vier",
      subtitle: "OpenImmo-Format-Mandatsverwaltung, Kontakt-CRM mit automatischem Käufer-Matching, Drag-Drop-Kanban, Co-Branding-Objekt-PDFs und eIDAS-elektronische Signatur. Gebaut für luxemburgische Immobilienmakler, die genug haben, mehrere Werkzeuge zu jonglieren.",
      cta: "Kostenlos starten",
      ctaSecondary: "Funktionsweise ansehen",
      kpis: [
        { value: "/100", label: "Käufer-Matching-Score" },
        { value: "OpenImmo", label: "LU/DE Standardformat" },
        { value: "<24 h", label: "Support-Antwortzeit" },
      ],
    },
    problem: {
      title: "Ihr Geschäft läuft auf mehreren Werkzeugen, die nicht miteinander sprechen",
      intro: "Mandate in Excel, Kontakte in Gmail, Aufgaben in Notion, Besichtigungen auf WhatsApp. Jede Information lebt an einem anderen Ort, und nichts kommt beim Entscheider an.",
      items: [
        { title: "Mandate auf 3 Werkzeuge verstreut", desc: "Zwischen Agentur-CRM, Portal-Verteilung, Tracker-Tabelle und E-Mail-Threads können Sie den Status eines Mandats nicht auf einen Blick sehen.", stat: "~4 parallele Werkzeuge" },
        { title: "Käufer-Matching nach Gefühl", desc: "Ein neues Mandat kommt rein, Sie durchsuchen Ihre Käuferdatenbank manuell. Radius, Budget, Typ, Projektdatum: alles verstreut, also werden Kandidaten übersehen.", stat: "30-40 % verpasste Matches" },
        { title: "Manuelle Portalverteilung", desc: "Objekt auf athome, immotop, wort eingegeben; erneut eingegeben bei Preisänderung. Inkonsistenzen zwischen Portalen schädigen Ihre Marke.", stat: "~45 min pro Verteilung" },
      ],
    },
    howItWorks: {
      title: "Ein CRM, drei Schritte",
      intro: "Keine 2-tägige Schulung, keine riskante Migration. Kontakte importieren, erstes Mandat erstellen, Matching läuft automatisch.",
      steps: [
        { number: "1", title: "Kontakte via CSV importiert", desc: "Import Ihrer bestehenden Käuferdatenbank. Automatisches Spalten-Mapping. Bis zu 10.000 Kontakte in 2 Minuten." },
        { number: "2", title: "Mandate in Kanban-Pipeline", desc: "Mandat im OpenImmo-Format erstellen. Drag-Drop-Kanban nach Status. Ein-Klick-Verteilung an athome / immotop / wort." },
        { number: "3", title: "Automatisches /100-Matching", desc: "Sobald ein Mandat oder Käufer in die Datenbank kommt, berechnet der Algorithmus Matches. Sie erhalten eine nach Score sortierte Liste, kontaktbereit." },
      ],
    },
    features: {
      title: "Die Funktionen, die wirklich Zeit sparen",
      intro: "Gebaut für Teams von 1 bis 20 Agenten, mit Workflows aus dem luxemburgischen Immobilienmarkt.",
      items: [
        { title: "Kanban-Mandatspipeline", desc: "Drag-Drop zwischen Status, Ansicht nach Agent, Stadt oder Preis. Gespeicherte Filter." },
        { title: "Natives OpenImmo-Format", desc: "Standard XML OpenImmo 1.2.8 Export, kompatibel mit athome.lu, immotop.lu, wort.lu, immoscout24.de." },
        { title: "/100 Käufer-Matching", desc: "Score basiert auf Budget, Radius, Typ, Fläche, EPC, Projektdatum. Sortierbar und exportierbar." },
        { title: "Vollständiges Kontakt-CRM", desc: "CSV-Import, Tags, Interaktionen, Aufgaben, Historie. Bidirektionale Gmail-Sync." },
        { title: "Co-Branding-Objekt-PDFs", desc: "Logo, Markenrichtlinien, REV-Rechtshinweis. In 10 Sekunden generiert." },
        { title: "Besichtigungsschein-PDFs", desc: "Mit Timeline-Log und elektronischer Signatur. Rechtsgültig." },
        { title: "eIDAS-Mandatssignatur", desc: "Fortgeschrittene elektronische Signatur (eIDAS), rechtsverbindlich in Luxemburg." },
        { title: "Nurturing-Sequenzen", desc: "Drip-Kampagnen zur Aufwärmung lauwarmer Käufer: 3 bis 7 automatische E-Mails." },
        { title: "E-Mail-Vorlagen (10 Modelle)", desc: "Angebot, Einführung, Follow-up, Besichtigungsbestätigung, Mandatsauflösung usw." },
        { title: "Agenten-Provisionen", desc: "Automatische vierteljährliche Provisionsberechnung pro Agent. Buchhaltungsexport." },
        { title: "Agenten-Performance", desc: "Ranking: signierte Mandate, Verkäufe, Umsatz, Provisionen. Anonymer Inter-Agentur-Benchmark." },
        { title: "Käufer-Portal", desc: "Dedizierter Bereich für jeden Käufer: angebotene Objekte, Dokumente, Nachrichten." },
      ],
    },
  },
  hotel: {
    meta: {
      title: "Hotel-PMS Luxemburg — USALI-Folios, 3 % MwSt, Forecast, Channel Manager",
      description: "Property Management System gebaut für die luxemburgische Hotellerie: Auto-Posting USALI 19 Kategorien, LU-MwSt-3 %-Rechnung, 90-Tage-Forecast, iCal OTA.",
    },
    hero: {
      badge: "Multi-Objekt-PMS für LU",
      title: "Ihr Hotel-PMS abgestimmt auf",
      titleAccent: "LU 3 % MwSt und USALI",
      subtitle: "Vollständiges Property Management System: Zimmer, Rate Plans, Buchungen, Folios mit USALI-19-Kategorien-Auto-Posting, LU-MwSt-3 %/8 %/17 %-Rechnung, 90-Tage-Forecast, iCal-Channel-Manager. Gebaut für luxemburgische Hoteliers, die ein vollständiges Werkzeug ohne die monatliche Rechnung traditioneller PMS wollen.",
      cta: "Kostenlos starten",
      ctaSecondary: "Funktionsweise ansehen",
      kpis: [
        { value: "19", label: "USALI-Kategorien" },
        { value: "3 / 8 / 17 %", label: "LU MwSt gehandhabt" },
        { value: "<24 h", label: "Support-Antwortzeit" },
      ],
    },
    problem: {
      title: "Ein luxemburgisches Hotel ohne dediziertes Werkzeug zu führen ist erschöpfend",
      intro: "Zwischen 4+ OTAs zu beobachten, Folios per Hand getippt, 3 % MwSt korrekt verteilt und Owner-Reports zu kompilieren, vergeht der Tag ohne echten Fortschritt beim Wesentlichen.",
      items: [
        { title: "Buchungen auf 4+ OTAs verteilt", desc: "Booking, Airbnb, Expedia, Direktseite. Jede OTA ihre Oberfläche, Mapping, Sync. Doppelbuchungen sind ohne Channel Manager unvermeidbar.", stat: "1-2 Doppelbuchungen / Monat" },
        { title: "Folios per Hand getippt", desc: "Jeder Verbrauch (Frühstück, Minibar, Parken) manuell in Tabelle eingetragen. Beim Check-out mühsamer Rechnungsaufbau mit korrekter MwSt pro Zeile.", stat: "~12 min pro Check-out" },
        { title: "Kein Forecast, statische Preise", desc: "Raten ändern sich einmal pro Saison. Keine Sichtbarkeit auf geplanten RevPAR, keine Tarifoptimierung für lokale Events (Foire Internationale, Schueberfouer).", stat: "15-25 % nicht erfasster Umsatz" },
      ],
    },
    howItWorks: {
      title: "Komplettes PMS, drei Schritte",
      intro: "Geführtes Setup zur Eingabe von Zimmern und Rate Plans. Nach der Konfiguration übernimmt das System Folios, Rechnungen und Reporting.",
      steps: [
        { number: "1", title: "Geführter Setup-Wizard", desc: "Objekt erstellen, Zimmer nach Typ, Rate Plans nach Saison, Grundtarife. Durchschnittlich 20 Minuten für ein 15-Zimmer-Hotel." },
        { number: "2", title: "Automatische Buchungen und Folios", desc: "iCal-Import von Booking / Airbnb / VRBO, direkte Buchungseingabe, Auto-Posting ins Folio mit korrekter LU-MwSt." },
        { number: "3", title: "Rechnung und Reporting", desc: "Beim Check-out: MwSt-konforme PDF-Rechnung + Factur-X EN 16931 für Firmenkunden. Monatlicher USALI-Report auf Knopfdruck, 90-Tage-Forecast mit Konfidenzbändern." },
      ],
    },
    features: {
      title: "Alles, was ein luxemburgischer Hotelier wirklich braucht",
      intro: "Spezifisch für LU-Hospitality-Vorschriften (3 % MwSt, Gemeindesteuer) und Branchenstandards (USALI, STR).",
      items: [
        { title: "Geführter Setup-Wizard", desc: "Objektkonfiguration in 20 min: Zimmer, Rate Plans, Saisons, Tarife." },
        { title: "Multi-Saison Rate Plans", desc: "Nieder-/Hochsaison-Tarife, Wochenend-Promos, Gruppen, Foire-Internationale-Woche." },
        { title: "Kalender + Belegungs-Heatmap", desc: "Jahresansicht, tägliche Belegung pro Zimmer, Schwachstellen erkennen." },
        { title: "Direkte + OTA-Buchungen", desc: "Direkteingabe oder iCal-Import Booking / Airbnb / VRBO. Bidirektionale Sync." },
        { title: "19-Kategorien-USALI-Folios", desc: "Auto-Posting nach Verbrauch: Zimmer, Frühstück, Minibar, Spa, Telefon, Wäsche usw." },
        { title: "LU-MwSt-Rechnung", desc: "Automatische 3 % / 8 % / 17 % Zuweisung nach Kategorie. PDF-Rechnung + Factur-X." },
        { title: "Monatlicher USALI-Report", desc: "Weltstandardformat (Umsatz + Kosten). Als PDF und CSV exportierbar." },
        { title: "90-Tage Holt-Winters Forecast", desc: "Statistisches Modell mit wöchentlicher Saisonalität, 95 % Konfidenzintervall, MAPE-Backtest." },
        { title: "Pickup-Report", desc: "Buchungsvergleich auf rollierendem Fenster. Alarm bei Abweichung vom Ziel." },
        { title: "Restaurant/Bar-POS", desc: "F&B-Verbrauchseingabe, automatisches Posting ins Gast-Folio." },
        { title: "Gruppen und Allotments", desc: "Zimmerblöcke für Hochzeiten, Seminare, MICE. Separate Gruppentarife." },
        { title: "LU-Events-Kalender", desc: "Foire Internationale, Schueberfouer, ING-Marathon, MICE. Tarifauswirkung." },
      ],
    },
  },
  "expert-evaluateur": {
    meta: {
      title: "Gutachter-Software TEGOVA EVS 2025 — Luxemburg",
      description: "EVS-2025-konformer Bewertungsbericht in 20 min: 8 Methoden, 9 Asset-Typen, automatisch ausgefüllte Daten (98 Gemeinden + 12 Makro-Serien), SHA-256-Signatur.",
    },
    hero: {
      badge: "TEGOVA EVS 2025 + Charte 5. Aufl. konform",
      title: "EVS-2025-konformer Bericht in",
      titleAccent: "20 Minuten statt 4 Stunden",
      subtitle: "Bewertungsmodul mit 11 Abschnitten + Anhängen konform TEGOVA European Valuation Standards 2025 und Charte de l'expertise 5. Aufl. 8 Methoden, 9 Asset-Typen, Daten für 98 luxemburgische Gemeinden automatisch ausgefüllt. Gebaut für REV, TRV und unabhängige Gutachter.",
      cta: "Kostenlos starten",
      ctaSecondary: "Funktionsweise ansehen",
      kpis: [
        { value: "11", label: "Abschnitte + Anhänge" },
        { value: "8 / 9", label: "Methoden / Assets" },
        { value: "98", label: "dokumentierte Gemeinden" },
      ],
    },
    problem: {
      title: "Das Schreiben eines Bewertungsberichts ist zu 60 % Datenrecherche",
      intro: "Vergleichsobjekte finden, Makroquellen querverweisen, Rechtstexte prüfen, nach Charte formatieren. Der analytische Teil, der den wahren Mehrwert des Experten ausmacht, ist nur ein kleiner Anteil der Gesamtzeit.",
      items: [
        { title: "4 Stunden pro Bericht im Durchschnitt", desc: "Ein vollständiger EVS-2025-Bericht dauert typischerweise 3 bis 5 Stunden zwischen Datensammlung und endgültiger Formatierung nach Charte.", stat: "~4 h pro Bericht" },
        { title: "Daten auf 10 Quellen verstreut", desc: "STATEC für Makro, Observatoire de l'Habitat für Preise, Geoportail für Kataster, Land Registry für Übertragungen, EZB für Zinsen, INSEE für IRL, LENOZ für Energie.", stat: "~10 Quellen pro Bericht" },
        { title: "Non-Compliance-Risiko Charte", desc: "Die 11 obligatorischen Abschnitte, EVS 5 Sonderannahmen, wesentliche Unsicherheitsangabe: ein Versäumnis und der Bericht wird anfechtbar.", stat: "0 % akzeptable Fehlermarge" },
      ],
    },
    howItWorks: {
      title: "Vom Auftrag zum signierten Bericht, drei Schritte",
      intro: "Sie geben Adresse und Objektparameter ein. Das System lädt Kontextdaten, Sie wählen Methoden, der PDF-Bericht wird erstellt.",
      steps: [
        { number: "1", title: "Adresse + Objektparameter", desc: "Gemeinde, Fläche, Baujahr, Energieklasse, Asset-Typ. Makro-, demografische und städtebauliche Daten laden automatisch." },
        { number: "2", title: "Methoden und Vergleiche", desc: "Wahl aus 8 Methoden. Vergleichsobjekte nach Nähe vorgeschlagen." },
        { number: "3", title: "Signierter PDF-Bericht", desc: "Serverseitige Generierung des 11-Abschnitte-Berichts, SHA-256-Signatur, REV-Logo und Qualifikationen." },
      ],
    },
    features: {
      title: "Gebaut für unabhängige Gutachter und Kanzleien",
      intro: "Jede Funktion beantwortet eine echte Einschränkung der Gutachtertätigkeit in Luxemburg: TEGOVA-Konformität, Nachverfolgbarkeit, öffentliche Daten, beweisbare Signatur.",
      items: [
        { title: "11 EVS-2025-Abschnitte", desc: "Auftrag, Standort, Recht, Städtebau, Beschreibung, Miete, Markt, SWOT, Bewertung, Schlussfolgerungen, Zertifizierung." },
        { title: "8 Bewertungsmethoden", desc: "Vergleich, direkte Kapitalisierung, DCF, CRR-Beleihungswert, energetische Residualmethode, Term and Reversion, IRR, Monitoring." },
        { title: "9 Asset-Typen", desc: "Wohn, Büro, Einzelhandel, Logistik, Hotels, Industrie, gemischt, Entwicklung, Grundstücke." },
        { title: "98 dokumentierte Gemeinden", desc: "Bevölkerung, Wachstum, Dichte, Medianeinkommen, Arbeitslosigkeit, ausländische Einwohner, Fläche, Kanton, Preise." },
        { title: "12 Makro-Serien 2015-2026", desc: "10-Jahres-OAT, Hypothekenzinsen, STATEC-Baukostenindex, BIP, Inflation, Transaktionsvolumen, m²-Preise, Mieten, Bürovakanz, EZB." },
        { title: "Automatische Vergleichsobjekte", desc: "Vorschläge nach Gemeinde, Typ, Fläche, Baujahr. Erklärbare Anpassungen." },
        { title: "EVS 5 Sonderannahmen", desc: "Bindende Annahmen und wesentliche Unsicherheit nach EVS 5 und Red Book." },
        { title: "Serverseitig signiertes PDF", desc: "Serverseitige Generierung für Konsistenz, SHA-256-Signatur für Nicht-Abstreitbarkeit, Gutachter-Logo." },
        { title: "Konfidenzanzeige", desc: "Konfidenzscore basiert auf Anzahl Vergleiche, Streuung, Datenalter." },
        { title: "TEGOVA-Feldinspektion", desc: "EVS-2025 41-Punkte-Checkliste. Offline auf Handy, Sync bei Rückkehr, Import in Bericht." },
        { title: "Hedonisches Modell", desc: "29 belegt Koeffizienten. Veröffentlichter MAPE und R²." },
        { title: "Modelltransparenz", desc: "Öffentliche /transparence-Seite: Back-Test auf 20 LU-Objekten, MAPE und R² angezeigt." },
      ],
    },
  },
  investisseur: {
    meta: {
      title: "Luxemburger Immobilien-Investment-Simulator — Rendite, DCF, Besteuerung",
      description: "Rendite, Erwerbskosten mit Bëllegen Akt, Multi-Mieter-DCF, Veräusserungsgewinne, VEFA mit Zwischenzins. LU-Besteuerung integriert.",
    },
    hero: {
      badge: "Vollständiger LU-Investment-Simulator",
      title: "Ihre tatsächliche Rendite,",
      titleAccent: "LU-Besteuerung inbegriffen",
      subtitle: "Immobilien-Renditesimulator mit Bëllegen-Akt-Erwerbskosten, Multi-Mieter-DCF nach Bail, VEFA mit Zwischenzinsen, Veräusserungsgewinnen, Multi-Asset-Portfolio und Bank-Werkzeugen (LTV, DSCR, CRR).",
      cta: "Kostenlos starten",
      ctaSecondary: "Funktionsweise ansehen",
      kpis: [
        { value: "Bëllegen Akt", label: "Abzug integriert" },
        { value: "LU + FR + BE", label: "Steuersysteme behandelt" },
        { value: "<24 h", label: "Support-Antwortzeit" },
      ],
    },
    problem: {
      title: "LU-Rendite zu berechnen bedeutet, mit 8 verschiedenen Simulatoren zu jonglieren",
      intro: "Notargebühren auf einer Seite, Veräusserungsgewinne auf einer anderen, DCF in selbstgemachtem Excel. Dabei vergisst man Posten oder macht Fehler, die die Investitionsentscheidung verzerren.",
      items: [
        { title: "Unterschätzte Erwerbskosten", desc: "7 % Eintragungsgebühren, Transkription, Bëllegen Akt (bis 40.000 € Abzug), Notar, 3 % MwSt Neubau: viele Investoren rechnen falsch und blockieren ihren Finanzierungsplan.", stat: "3-7 % typische Lücke" },
        { title: "Brutto- vs. Nettorendite-Verwirrung", desc: "Zwischen brutto, netto und netto-netto (nach Steuer) bedeuten die Zahlen nicht dasselbe. Eine 5 %-Bruttorendite kann nach Steuern bei 2 % enden.", stat: "~40 % brutto vs netto-netto" },
        { title: "Kein an LU angepasstes DCF-Werkzeug", desc: "Online-Excel-Simulatoren sind für FR oder BE kalibriert. Keine 5 %-Regel, keine LU-Gewerbemiete, keine LU-10 %-Veräusserungsgewinne.", stat: "95 % Werkzeuge nicht-LU" },
      ],
    },
    howItWorks: {
      title: "Von der Schätzung zur Entscheidung, drei Schritte",
      intro: "Sie geben das Objekt ein. Das System berechnet Rendite, Besteuerung, DCF. Sie vergleichen Szenarien und entscheiden.",
      steps: [
        { number: "1", title: "Objekt- und Finanzierungseingabe", desc: "Preis, Fläche, Gemeinde, Typ, Anzahlung, Kreditlaufzeit, Zinssatz. Erwerbskosten (Bëllegen Akt) automatisch berechnet." },
        { number: "2", title: "Parallele Simulationen", desc: "Rendite, 10-Jahres-DCF, VEFA-Zwischenzinsen, Veräusserungsgewinne beim Verkauf, monatlicher Cashflow. Interaktive Grafiken." },
        { number: "3", title: "Szenarienvergleich", desc: "Mehrere Szenarien speichern. Exportierbares PDF für Ihren Banker." },
      ],
    },
    features: {
      title: "Das vollständige LU-Immobilien-Finanz-Toolkit",
      intro: "Jede Berechnung respektiert luxemburgische Vorschriften: Bëllegen Akt, 3 % VEFA-MwSt, 10 % Veräusserungsgewinne, CSSF-Sätze, 5 %-Regel.",
      items: [
        { title: "LU-Erwerbskosten", desc: "7 % Gebühren, Transkription, Notar, Bëllegen Akt mit Voraussetzungen, 3 % VEFA-MwSt." },
        { title: "Vollständige Rendite", desc: "Brutto, netto, netto-netto. Mit Leerstand, Kosten, Grundsteuer, Versicherung, Verwaltung, Instandhaltung." },
        { title: "Multi-Mieter-DCF", desc: "Bail für Bail mit Break-Options, Step Rents, geplantem CAPEX, Equity-IRR und Projekt-IRR." },
        { title: "VEFA-Simulator", desc: "Zwischenzinsen, 3 % MwSt, Fertigstellungsgarantie, Mittelabruf-Plan." },
        { title: "LU-Veräusserungsgewinne", desc: "Besitzzeit-Abschlag, effektiver Satz, Hauptwohnung vs Investition." },
        { title: "Kauf-vs-Miete-Komparator", desc: "NPV über konfigurierbare Dauer, Opportunitätskosten, Break-even-Schwelle." },
        { title: "Multi-Asset-Portfolio", desc: "Konsolidierte Ansicht: Gesamtwert, Durchschnittsrendite, geografische Exposition, Diversifikation." },
        { title: "Bank-Werkzeuge", desc: "LTV, DSCR, CRR-Beleihungswert, +2 %-Zinsstresstest, Kreditkapazität." },
        { title: "Bauträger-GuV", desc: "Umsatzprognose, STATEC-Baukosten, Finanzierungskosten, Bauträger-Marge." },
        { title: "98 LU-Gemeinden", desc: "Preise pro m², Mieten, Renditen, Demografie, Medianeinkommen. Vierteljährliche Updates." },
        { title: "Live-Makro", desc: "10-Jahres-OAT, Hypothekenzinsen, Baukostenindex, Inflation. EZB + STATEC." },
        { title: "Bank-PDF-Bericht", desc: "Vollständige Finanzierungsakte: Simulation, DCF, Stresstest, Sicherheiten." },
      ],
    },
  },
  particulier: {
    meta: {
      title: "Immobilien-Werkzeuge für Privatpersonen in Luxemburg — Schätzung, Förderungen, Miete",
      description: "Schätzung, Erwerbskosten mit Bëllegen Akt, Förderungen-Simulator Staat + Gemeinde, 5 %-Mietdeckel, Kauf vs Miete. Kostenlos, 5 Sprachen.",
    },
    hero: {
      badge: "Kostenlose Werkzeuge für LU-Privatpersonen",
      title: "Kaufen, mieten, renovieren in Luxemburg",
      titleAccent: "ohne Beratungsunternehmen",
      subtitle: "Objekt-Schätzung, Erwerbskosten-Berechnung mit Bëllegen Akt, Staat + Gemeinde-Förderungen-Simulation (Klimabonus inklusive), rechtlicher 5 %-Mietdeckel-Check, Kauf-vs-Miete-Vergleich. Gebaut für luxemburgische Privatpersonen und Erstkäufer.",
      cta: "Kostenlos starten",
      ctaSecondary: "Werkzeuge ansehen",
      kpis: [
        { value: "0 €", label: "keine Registrierung nötig" },
        { value: "5 Ebenen", label: "kumulierbarer Förderungen" },
        { value: "98", label: "abgedeckte Gemeinden" },
      ],
    },
    problem: {
      title: "In Luxemburg 2026 zu kaufen erfordert zu viel Papierkram",
      intro: "Zwischen Besteuerung, kumulierbaren Förderungen, rechtlicher Mietobergrenze, Erwerbskosten werden Stunden mit Suchen und Vergleichen verbracht, bevor man überhaupt einen Makler kontaktiert.",
      items: [
        { title: "Undurchsichtige Erwerbskosten", desc: "Eintragungsgebühren, Transkription, Notar, Bëllegen Akt: wer zahlt was, und wieviel kommt wirklich aus der Tasche? Online-Simulatoren verpassen oft die Hälfte.", stat: "8-12 % des Preises typisch" },
        { title: "Schwer zu findende Förderungen", desc: "Kaufprämie, Klimabonus, staatliche Wohnungsprämie, Gemeindehilfen, 3 % Renovierungs-MwSt. Viele Haushalte verpassen 2.000 bis 8.000 €.", stat: "~5.000 € verpasst durchschnittlich" },
        { title: "5 %-Mietdeckel wenig bekannt", desc: "Die 5 %-Regel schützt Mieter und rahmt Vermieter ein. Überschreitung setzt Sie rechtlichen Schritten aus.", stat: "~15 % der Bails verletzen" },
      ],
    },
    howItWorks: {
      title: "Klare Werkzeuge, drei Schritte",
      intro: "Keine Anmeldung nötig zum Start. Jedes Werkzeug gibt eine präzise Antwort in wenigen Minuten.",
      steps: [
        { number: "1", title: "Ihre Situation eingeben", desc: "Zielobjekt, Anzahlung, Gemeinde, Status, Projekt. Kein Konto für Basis-Werkzeuge nötig." },
        { number: "2", title: "Ihre Zahlen erhalten", desc: "Objekt-Schätzung, detaillierte Erwerbskosten, Liste kumulierbarer Förderungen, Kauf-vs-Miete-Vergleich." },
        { number: "3", title: "Exportieren oder teilen", desc: "Kostenloser PDF-Download oder View-only-Link-Teilen (mit Konto). Mit zur Bank, Notar oder Makler nehmen." },
      ],
    },
    features: {
      title: "Alle Werkzeuge, die eine luxemburgische Privatperson braucht",
      intro: "Spezifisch für den luxemburgischen Rahmen (Bëllegen Akt, 3 % MwSt, 5 %-Regel, Klimabonus), alle in 5 Sprachen.",
      items: [
        { title: "Sofortige Schätzung", desc: "Preis pro m² nach Gemeinde und Viertel, hedonisches Modell mit 29 belegen Koeffizienten." },
        { title: "Detaillierte Erwerbskosten", desc: "7 % Gebühren, Transkription, Notar, Bëllegen Akt mit Voraussetzungen, 3 % VEFA-MwSt." },
        { title: "5-Ebenen-Förderungen-Simulator", desc: "Staatliche Wohnungsprämie, Klimabonus, 1,5 % Klimaprêt, Gemeindehilfen, 3 % Renovierungs-MwSt." },
        { title: "5 % rechtlicher Mietdeckel", desc: "Max-Miet-Berechnung basiert auf indexiertem investiertem Kapital + amortisierten Arbeiten." },
        { title: "Kauf vs Miete", desc: "NPV-Vergleich über Dauer, Opportunitätskosten. Break-even-Schwelle." },
        { title: "Preiskarte", desc: "Interaktive Karte 100 Gemeinden + Luxemburg-Stadt-Viertel mit Preisen und Renditen." },
        { title: "Veräusserungsgewinne", desc: "Hauptwohnung (Befreiung), Zweitwohnung, Investition. Besitzzeit-Abschlag." },
        { title: "VEFA-Zwischenzinsen", desc: "Zinsen während Bauphase und Gesamtkosten mit 3 % MwSt." },
        { title: "Rechtsleitfäden", desc: "Wohnungsmiete, Gewerbemiete, Veräusserungsgewinne, Miteigentum, Klimabonus." },
        { title: "Zwei Objekte vergleichen", desc: "Side-by-side: Preis, Rendite, Gebühren, Förderungen, Pendelstrecke. Automatische Empfehlung." },
        { title: "Privatperson-Wizard", desc: "4-Schritte-Flow: Schätzung + Gebühren + Förderungen + rechtliche Miete in einem Pfad." },
        { title: "TEGOVA-Feldinspektion", desc: "41-Punkte-Checkliste für Objektbesichtigung." },
      ],
    },
  },
  promoteur: {
    meta: {
      title: "Bauträger-Software Luxemburg — GuV, VEFA, Baukosten",
      description: "Bauträger-GuV mit Cashflow-Plan, VEFA-Simulator mit Zwischenzinsen, STATEC-Baukosten-Schätzer, Strassenbau- und OAI/ILNAS-Flächenumrechnung.",
    },
    hero: {
      badge: "Für LU-Bauträger und Immobilienhändler",
      title: "Bauträger-GuV und VEFA-Simulation,",
      titleAccent: "ohne Kosten dreimal einzugeben",
      subtitle: "Vollständige Bauträger-GuV mit monatlichem Cashflow-Plan und Prognose-Marge, VEFA-Simulator mit Zwischenzinsen und LU-3 %-MwSt, STATEC-referenzierter Baukosten-Schätzer (17 Gewerke), Strassenbau-Rechner (9 Lose), OAI/ILNAS-Flächenumrechner. Gebaut für luxemburgische Bauträger und Immobilienhändler.",
      cta: "Kostenlos starten",
      ctaSecondary: "Funktionsweise ansehen",
      kpis: [
        { value: "17 Gewerke", label: "STATEC integriert" },
        { value: "9 Lose", label: "Strassenbau konfigurierbar" },
        { value: "<24 h", label: "Support-Antwortzeit" },
      ],
    },
    problem: {
      title: "Ein Immobilienprojekt in Luxemburg aufsetzen bedeutet, mit 6 Tabellen zu jonglieren",
      intro: "Baukosten in einem Excel, VEFA in einem anderen, Zwischenzinsen von Hand, Cashflow-Plan bei jeder Iteration neu gemacht. Ergebnis: der Moment, wo man sieht ob das Projekt wirklich Marge abwirft, kommt sehr spät.",
      items: [
        { title: "Unscharfe Baukosten", desc: "Preisfindung basiert auf dem letzten Vergleichsprojekt, keine aktuelle STATEC-Referenz. Am Ende 10-20 % Lücke, die die Marge frisst.", stat: "±10-20 % typische Lücke" },
        { title: "Komplexe VEFA-Zwischenzinsen", desc: "Mittelabruf-Plan pro Tranche, Kurzzeit-Kreditsatz, 3 % MwSt auf richtiger Basis zu verteilen: viele mögliche Fehler.", stat: "~3 h pro Simulation" },
        { title: "Kein dynamischer Cashflow-Plan", desc: "3 Monate Baubewilligungsverzug, 5 % Überschreitung am Rohbau: man muss die Tabelle von Hand neu machen, um den Effekt auf die Endmarge zu sehen.", stat: "~8 h Überarbeitung pro Änderung" },
      ],
    },
    howItWorks: {
      title: "Von der Preisfindung zur Vermarktung, drei Schritte",
      intro: "Sie geben Grundstück und Programm ein. Das System berechnet Baukosten, projiziert VEFA und berechnet Marge.",
      steps: [
        { number: "1", title: "Grundstück und Programm", desc: "Grundstückspreis, bebaubare Fläche pro PAG, Programm (Anzahl Einheiten, Typen, Flächen), Gemeinde. Automatische PAG/PAP-Regelprüfung." },
        { number: "2", title: "Baukosten + Strassenbau", desc: "Preisfindung nach STATEC-Gewerk (17 Posten), Anpassung nach Energieklasse (AAA-C), Ausbau. Strassenbau 9 Lose mit belegten Preisen." },
        { number: "3", title: "Bauträger-GuV + VEFA", desc: "Monatlicher Cashflow-Plan, VEFA-Mittelabruf-Simulation, Zwischenzinsen auf Baukredit, 3 % Neubau-MwSt, Brutto- und Nettomarge." },
      ],
    },
    features: {
      title: "Alle Werkzeuge für den Aufbau eines Immobilienprojekts",
      intro: "Spezifisch für luxemburgische Normen (STATEC, OAI FC.04, ILNAS 101:2016, 3 % VEFA-MwSt, PAG/PAP) und Marktpraktiken.",
      items: [
        { title: "Vollständige Bauträger-GuV", desc: "Umsatzprognose pro Einheit, Gesamtkosten, Finanzierungskosten, Brutto- und Nettomarge, Projekt-IRR." },
        { title: "Monatlicher Cashflow-Plan", desc: "Monatliche VEFA-Einnahmen und Bau-Ausgaben. Break-even identifiziert." },
        { title: "VEFA-Simulator", desc: "Zwischenzinsen, 3 % MwSt auf Bemessungsgrundlage, finanzielle Fertigstellungsgarantie, Standard-Mittelabruf-Plan." },
        { title: "STATEC-Bau-Schätzer", desc: "17 Gewerke, STATEC-Index Oktober 2025: 1.173,24. Anpassung nach Energieklasse." },
        { title: "Strassenbau-Rechner (9 Lose)", desc: "Erdarbeiten, Strassen, Abwasser, Wasserversorgung, Beleuchtung, Grünflächen. Belegte Preise Batiprix 2026 (LU-Koef. ×1,20), CTG, CSDC-CT." },
        { title: "ACT-Flächen-Umrechner", desc: "SCB / SCP / nutzbar / bewohnbar gemäss ILNAS 101:2016. ACT-Gewichtung gemäss OAI FC.04." },
        { title: "PAG-PAP-Analyse", desc: "PAG- und PAP-Städtebauregeln pro Gemeinde (COS, CUS, Abstand, Höhe)." },
        { title: "Landwirtschaftsflächen", desc: "Landwirtschaftsflächen-Bewertung, Pachtrendite, Umwandlung in Bauland." },
        { title: "Szenarienvergleich", desc: "Mehrere Szenarien parallel: Programm A (100 % Wohnung) vs B (gemischt)." },
        { title: "Margen-Sensibilität", desc: "Stresstest auf Dauer, Baukosten, Verkaufspreis. Worst-Case-Marge angezeigt." },
        { title: "Bank-PDF-Bericht", desc: "Vollständige Bauträger-Finanzierungsakte: GuV, Cashflow-Plan, Garantien, Vorvermarktung." },
        { title: "98 Gemeinde-Daten", desc: "Verkaufspreise pro Gemeinde, Demografie, Städtebauregeln. Vorvermarktungsprüfung." },
      ],
    },
  },
  banque: {
    meta: {
      title: "Immobilien-Bewertungssoftware für Banken Luxemburg — CRR, LTV, DSCR",
      description: "CRR-konforme EVS-2025-Bewertung, +2 %-Stresstest, LTV/DSCR-Werkzeuge, AML/KYC, CRREM-Energie-Portfolio. Für LU-Kreditanalysten und Risikomanager.",
    },
    hero: {
      badge: "Für LU-Banken und Kreditanalysten",
      title: "Immobilienkreditanalyse,",
      titleAccent: "CRR + EVS 2025 in einem Werkzeug",
      subtitle: "EVS-2025-Bewertung mit CRR-Beleihungswert (Energie-Haircut), LTV / DSCR / Kreditkapazität pro CSSF-Profil, AML/KYC mit EU-Sanktionsprüfung, CRREM-Stranding-Energie-Portfolio. Gebaut für luxemburgische Kreditanalysten, Risk Manager und Compliance Officer.",
      cta: "Kostenlos starten",
      ctaSecondary: "Funktionsweise ansehen",
      kpis: [
        { value: "CRR + EVS 2025", label: "duale Konformität" },
        { value: "CRREM-Stranding", label: "Energie-Haircut" },
        { value: "<24 h", label: "Support-Antwortzeit" },
      ],
    },
    problem: {
      title: "Eine Immobilienkreditanalyse in Luxemburg bedeutet 5 separate Werkzeuge",
      intro: "Marktwert in einem Werkzeug, Beleihungswert in einem anderen, AML/KYC über externes Portal, Stresstest von Hand. Akten brauchen 3 Tage, wo sie 3 Stunden brauchen könnten.",
      items: [
        { title: "Manueller CRR-Beleihungswert", desc: "Energie-Haircut-Berechnung nach Objekt-Energieklasse, Stranded-Asset-Anpassung (CRREM 2030+), Prüfung CRR 575/2013-Konformität: viele manuelle Durchgänge.", stat: "~2 h pro Akte" },
        { title: "AML/KYC über mehrere Plattformen", desc: "EU-Sanktionsprüfung (CFSP), PEP, Ultimate Beneficial Owner, Herkunft der Mittel auf 3 verschiedenen Werkzeugen. Kein konsolidierter Audit-Trail.", stat: "~1 h pro Akte" },
        { title: "Keine Energie-Portfolio-Sicht", desc: "Welche Portfolio-Objekte sind 2030 oder 2040 gestrandet gemäss CRREM? Welche Rückstellung für Energie-Haircut? Kein konsolidiertes Werkzeug.", stat: "~0 LU-Banken ausgestattet" },
      ],
    },
    howItWorks: {
      title: "Von der Kreditanalyse zum Risiko-Reporting, drei Schritte",
      intro: "Sie geben die Kundenakte ein. Das Werkzeug berechnet Marktwert + Beleihungswert, wendet Energie-Haircut an, prüft AML/KYC, liefert den Bericht.",
      steps: [
        { number: "1", title: "Kreditnehmer- + Objektakte", desc: "Kreditnehmerprofil (Resident, Nichtresident, Investor), Objekt (Adresse, Fläche, Energieklasse, Jahr), Betrag, Laufzeit, Zinssatz." },
        { number: "2", title: "Bewertung + CRR + LTV/DSCR", desc: "EVS-2025-Marktwert (8 Methoden), CRR-Beleihungswert mit CRREM-Haircut, LTV pro CSSF-Profil, DSCR-Ziel 1,25, +2 %-Zins- und Arbeitslosigkeits-Stresstest." },
        { number: "3", title: "AML/KYC + Risiko-Bericht", desc: "EU-Sanktionen, PEP, UBO, Herkunft-Mittel-Prüfung. Risiko-PDF-Bericht mit strukturierter Meinung (APPROVED / REVIEW / DECLINED) bereit für Kreditausschuss." },
      ],
    },
    features: {
      title: "Vollständige Bank-Immobilienkreditanalyse",
      intro: "Konform mit EU-Verordnung 575/2013 (CRR), CSSF-Anforderungen, EN 16931, DSGVO und EBA-Richtlinien zu Immobiliensicherheiten.",
      items: [
        { title: "EVS-2025-Bewertung", desc: "8 TEGOVA-Methoden, 9 Asset-Typen, 98 LU-Gemeinde-Daten, automatische Sensibilität. Charte 5. Aufl. konform." },
        { title: "CRR-Beleihungswert", desc: "Energie-Haircut pro CRREM-Stranding-Jahr, Energieklasse-Anpassung, konform CRR 575/2013 Art. 208." },
        { title: "LTV / DSCR / Kapazität", desc: "Max LTV pro Profil (80 % Resident, 70 % Nichtresident, 60 % Investor), DSCR-Ziel 1,25, Kreditkapazität." },
        { title: "+2 %-Stresstest + Arbeitslosigkeit", desc: "Risikosimulationen: +2 %-Zins, 6-Monats-Arbeitslosigkeit, 10-20 % Wertrückgang." },
        { title: "Integriertes AML/KYC", desc: "EU-Sanktionsprüfung (CFSP), PEP, UBO, Herkunft der Mittel. Konsolidierter Audit-Trail, JSON-Export." },
        { title: "CRREM-Energie-Portfolio", desc: "Stranding-Sicht 2030 / 2040 / 2050 pro Objekt. Energie-Haircut-Rückstellung. Renovierungs-Tracking." },
        { title: "Risiko-PDF-Bericht", desc: "APPROVED / REVIEW / DECLINED strukturierte Meinung mit Begründung. Vor- oder Hauptkreditausschuss." },
        { title: "REST-API für Bank-CRM", desc: "API-Integration: Bewertung, LTV, Stresstest, AML/KYC. Webhook für automatischen Push." },
        { title: "Modelltransparenz", desc: "Öffentliche MAPE und R², 29 belegt hedonische Koeffizienten. Auditierbarkeit für BCL und CSSF." },
        { title: "Hotelbewertung", desc: "Hotel-spezifische Methoden (RevPAR × Multiplikator-Kapitalisierung, Hotel-DSCR 1,25)." },
        { title: "Büro + Einzelhandel DCF", desc: "Multi-Mieter-DCF nach Bail. Break-Options, Step Rents, geplanter CAPEX." },
        { title: "Live-Makro-Daten", desc: "10-Jahres-OAT, Hypothekenzinsen, Baukostenindex, Inflation. EZB + STATEC." },
      ],
    },
  },
};

// Ajout trust, pricing, faq, finalCta pour chaque persona
const COMMON_BLOCKS = {
  syndic: {
    trust: {
      title: "Warum LU-Hausverwalter uns wählen",
      agileTitle: "Agile Entwicklung, regelmässige Releases",
      agileDesc: "Neue Module alle 2 Wochen geliefert. Öffentliches Backlog, Ihre Anfragen gehen schnell in Produktion.",
      customTitle: "Individualentwicklung verfügbar",
      customDesc: "Spezifisches Einladungsformat, ungewöhnliche Tantième-Berechnung, Export an Ihre Buchhaltung: Entwicklung in 1 bis 3 Wochen.",
      supportTitle: "Support unter 24 h",
      supportDesc: "E-Mail an contact@tevaxia.lu. Durchschnittsantwort unter 6 Stunden an Werktagen. Keine Ticketnummern, kein Chatbot.",
    },
    pricing: {
      title: "In Ihrem tevaxia-Abonnement enthalten",
      subtitle: "Keine Abrechnung pro Gemeinschaft, kein EV-Kontingent, kein Premium-Modul. Alles im Freemium zum Testen verfügbar, im allgemeinen Abonnement für täglichen Einsatz.",
      features: ["Unbegrenzte Gemeinschaften", "Online-EV mit tantième-gewichteter Abstimmung", "Factur-X-Mittelabrufe konform EN 16931", "Luxemburgische Gemeinschafts-Buchhaltung", "PSD2-Bankabgleich (Enable Banking)", "Miteigentümer-Portal mit Einzelzugang", "5 EV-PDF-Buchhaltungsanlagen", "3-stufige Mahnungen mit LU-Zinsen", "Konform Gesetz 16. Mai 1975"],
      ctaPlatform: "tevaxia-Pakete ansehen",
      ctaEmit: "Zum Hausverwalter-Modul",
    },
    faq: {
      title: "Häufig gestellte Fragen",
      items: [
        { q: "Ich wechsle von [anderem Werkzeug] zu tevaxia, wie migriere ich?", a: "Standard-Excel-Import (Einheiten, Miteigentümer, Kostenhistorie), dann Verteilungsschlüssel-Konfiguration. Die Übernahme eines laufenden Geschäftsjahres dauert 2 bis 4 Stunden. Wir unterstützen Sie ohne Zusatzkosten." },
        { q: "Ist das Werkzeug konform mit luxemburgischem Miteigentumsrecht?", a: "Ja, das Gesetz vom 16. Mai 1975 ist integriert: einfache / absolute / doppelte / einstimmige Mehrheiten, 15-tägige Einladungsfrist, Buchhaltungspflichten, 10-Jahres-Archivierung." },
        { q: "Ist eine Online-EV rechtsgültig?", a: "Ja, sofern die Gemeinschaftsregeln es erlauben oder eine frühere physische EV-Beschluss es genehmigt hat. Die Praxis ist seit 2020 in Luxemburg üblich." },
        { q: "Können Mittelabrufe für MwSt-befreite Gemeinschaften ausgestellt werden?", a: "Ja, Art. 44 §1 f des MwSt-Gesetzes befreit Gemeinschaftsverwaltung. Das Modul wendet automatisch die korrekte Befreiung an." },
        { q: "Sind Miteigentümer-Daten sicher?", a: "Gespeichert auf Supabase (AWS eu-central-1 Frankfurt) mit Row Level Security, DSGVO-konform, HTTPS-Verschlüsselung." },
        { q: "Wie lange bis ich operativ bin?", a: "Ein Hausverwalter mit 1 bis 5 Gemeinschaften ist in 1 bis 2 Stunden operativ. Über 10 Gemeinschaften, 4 bis 6 Stunden für kompletten Import." },
      ],
    },
    finalCta: { title: "Bereit, Ihre Abende zurückzunehmen", desc: "Konto kostenlos erstellen, erste Gemeinschaft importieren, Test-Mittelabruf in 15 Minuten generieren. Null Verpflichtung.", cta: "Kostenlos starten", ctaSecondary: "Hausverwalter-Modul live ansehen" },
  },
  // For other personas, we'll use the standard trust/pricing/faq/finalCta structure with LU-specific adaptations
};

// Helper: standard trust/pricing blocks for personas without custom
function standardTrust(persona) {
  const titles = {
    agence: "Warum LU-Agenturen uns wählen",
    hotel: "Warum LU-Hoteliers uns wählen",
    "expert-evaluateur": "Warum LU-Gutachter uns wählen",
    investisseur: "Warum LU-Investoren uns wählen",
    particulier: "Warum LU-Privatpersonen uns nutzen",
    promoteur: "Warum LU-Bauträger uns wählen",
    banque: "Warum LU-Banken uns in Betracht ziehen",
  };
  return {
    title: titles[persona],
    agileTitle: "Agile Entwicklung, regelmässige Releases",
    agileDesc: "Neue Module alle 2 Wochen geliefert. Öffentliches Backlog auf github.com/Tevaxia.",
    customTitle: "Individualentwicklung möglich",
    customDesc: "Spezifische Anpassungen, dedizierte Integrationen: Entwicklung in 1 bis 3 Wochen.",
    supportTitle: "Support unter 24 h",
    supportDesc: "E-Mail an contact@tevaxia.lu. Durchschnittsantwort unter 6 Stunden an Werktagen.",
  };
}

// Full builds for remaining personas (trust, pricing, faq, finalCta standard-ish)
const REST = {
  agence: {
    trust: standardTrust("agence"),
    pricing: { title: "In Ihrem tevaxia-Abonnement enthalten", subtitle: "Keine Abrechnung pro Mandat, keine pro Kontakt. Das gesamte CRM ist im allgemeinen Abonnement enthalten.", features: ["Unbegrenzte OpenImmo-Mandate", "Unbegrenzte Kontakte mit CSV-Import", "Automatisches /100 Käufer-Matching", "Drag-Drop-Kanban-Pipeline", "Co-Branding-Objekt-PDFs", "Besichtigungsscheine und eIDAS-Signatur", "Automatisierte Nurturing-Sequenzen", "Agenten-Provisionen und -Performance", "10 bearbeitbare E-Mail-Vorlagen"], ctaPlatform: "tevaxia-Pakete ansehen", ctaEmit: "Zum CRM" },
    faq: { title: "Häufig gestellte Fragen", items: [
      { q: "Ist es kompatibel mit athome.lu und LU-Portalen?", a: "Ja, der OpenImmo 1.2.8 Export ist das Standardformat, das von athome.lu, immotop.lu, wort.lu, sowie immoscout24.de und idealista.it/pt akzeptiert wird." },
      { q: "Wie funktioniert das Käufer-Matching?", a: "Der Algorithmus vergleicht jedes Mandat mit jedem Käufer nach 6 gewichteten Kriterien: Budget, Radius, Typ, Fläche, Energieklasse, Projektdatum." },
      { q: "Ich komme von einem anderen CRM, wie migriere ich?", a: "Standard-CSV-Import. Automatisches Spalten-Mapping mit Vorschau. Die meisten Agenturen sind in 2 bis 4 Stunden operativ. Migrationsunterstützung kostenlos." },
      { q: "Kann ich mehrere Agenturen / Agenten mit separaten Rollen verwalten?", a: "Ja, Multi-Entity-Organisationen mit Rollen (Admin, Agent, Assistent). Jeder Agent sieht nur Mandate und Kontakte, die ihm zugewiesen sind." },
      { q: "Ist eIDAS-Signatur rechtsgültig?", a: "Ja, die fortgeschrittene eIDAS elektronische Signatur (EU-Verordnung 910/2014) hat rechtliche Gültigkeit gleichwertig mit handschriftlicher Unterschrift." },
      { q: "Sind Kontaktdaten DSGVO-sicher?", a: "Daten auf Supabase (AWS eu-central-1 Frankfurt), nutzerbasierte Row Level Security, HTTPS. Vollständiger Datenexport als ZIP jederzeit." },
    ]},
    finalCta: { title: "Bereit, Ihr Geschäft zu konsolidieren", desc: "Konto erstellen, Kontaktdatenbank importieren, erstes Matching in 15 Minuten ausführen. Null Verpflichtung.", cta: "Kostenlos starten", ctaSecondary: "CRM live ansehen" },
  },
  hotel: {
    trust: standardTrust("hotel"),
    pricing: { title: "In Ihrem tevaxia-Abonnement enthalten", subtitle: "Keine Abrechnung pro Zimmer, keine pro Buchung. Das komplette PMS ist im allgemeinen Abonnement enthalten.", features: ["Unbegrenzte Objekte und Zimmer", "Unbegrenzte Buchungen", "USALI-19-Kategorien-Folios mit Auto-Posting", "LU-MwSt 3 % / 8 % / 17 %-Rechnung + Factur-X", "Monatlicher USALI-Report + 90-Tage-Forecast", "iCal Import/Export (Booking, Airbnb, VRBO)", "Restaurant/Bar-POS + MICE-Gruppen", "Belegungs-Heatmap und Pickup-Report"], ctaPlatform: "tevaxia-Pakete ansehen", ctaEmit: "Zum PMS" },
    faq: { title: "Häufig gestellte Fragen", items: [
      { q: "Ist es kompatibel mit Booking.com und Airbnb?", a: "Ja, via iCal. Sie holen jedes OTA iCal-Link aus ihrer Oberfläche, fügen ihn in tevaxia ein, und Buchungen kommen alle 15 min rein." },
      { q: "Wie funktioniert LU 3 %-Beherbergung-MwSt?", a: "3 % MwSt gilt für Tourismus-Übernachtungen. Unser Modul wendet automatisch 3 % auf USALI-Zimmer + Zusatzbett, 17 % auf F&B, 0 % auf Kurtaxe an." },
      { q: "Meine Firmenkunden wollen Factur-X, wird es unterstützt?", a: "Ja. Beim Check-out aktiviert die Option Firmenrechnung die Factur-X-Generierung (PDF/A-3 + eingebettetes EN 16931 XML)." },
      { q: "Ist der 90-Tage-Forecast zuverlässig?", a: "Das Holt-Winters-Modell mit wöchentlicher Saisonalität liefert typischerweise MAPE von 8-15 %. Gut für Personalplanung." },
      { q: "Kann ich mehrere Hotels von einem Konto verwalten?", a: "Ja. Natives Multi-Property. Konsolidiertes Dashboard für Portfolio-Sicht. Funktioniert für Hotelgruppen bis 15-20 Objekte." },
      { q: "Sind meine Daten in der EU gehostet?", a: "Supabase (AWS eu-central-1, Frankfurt). Row Level Security, HTTPS. Vollständiger Gastdaten-Export als ZIP jederzeit." },
    ]},
    finalCta: { title: "Bereit, die Kontrolle über Ihren Betrieb zurückzunehmen", desc: "Konto erstellen, erstes Objekt in 20 Minuten konfigurieren, erste Buchung erfassen. Null Verpflichtung.", cta: "Kostenlos starten", ctaSecondary: "PMS live ansehen" },
  },
  "expert-evaluateur": {
    trust: standardTrust("expert-evaluateur"),
    pricing: { title: "In Ihrem tevaxia-Abonnement enthalten", subtitle: "Keine Abrechnung pro Bericht, kein Monatskontingent. Das gesamte Bewertungsmodul ist im allgemeinen Abonnement enthalten.", features: ["Unbegrenzte EVS-2025-Berichte", "8 Bewertungsmethoden", "9 unterstützte Asset-Typen", "Automatisch ausgefüllte Makro- und Gemeindedaten", "Automatische Vergleichsobjekte nach Nähe", "SHA-256-Signatur + Gutachter-Logo", "TEGOVA 41-Punkte-Inspektion (offline)", "Hedonisches Modell mit öffentlichem MAPE/R²"], ctaPlatform: "tevaxia-Pakete ansehen", ctaEmit: "Zum Bewertungsmodul" },
    faq: { title: "Häufig gestellte Fragen", items: [
      { q: "Ist der Bericht Charte-5.-Aufl.-konform?", a: "Ja, die 11 obligatorischen Abschnitte folgen der TEGOVA/Charte-Struktur. EVS-5-Sonderannahmen und wesentliche Unsicherheit eingeschlossen." },
      { q: "Kann ich nur die relevanten Methoden für mein Objekt wählen?", a: "Ja. Toggle pro Methode: Vergleich + Kapitalisierung für vermietetes Büro aktivieren, DCF allein für Investition, energetische Residualmethode für schwere Renovierung." },
      { q: "Sind Gemeindedaten aktuell?", a: "Ja, m²-Preise vom Observatoire de l'Habitat (quartalsweise), Demografie von STATEC (jährlich), Makrosätze von EZB (monatlich)." },
      { q: "Kann ich das PDF mit meinem Logo und Qualifikationen anpassen?", a: "Ja, in Ihrem Profil: Logo, voller Name, Qualifikationen (z.B. REV TEGOVA, MRICS), angepasster Rechtshinweis." },
      { q: "Hat die SHA-256-Signatur rechtliches Gewicht?", a: "Die SHA-256-Signatur garantiert Dokumentintegrität. Sie ersetzt keine rechtlich qualifizierte eIDAS-Signatur, bietet aber kryptografischen Beweis, dass der Bericht nicht verändert wurde." },
      { q: "Wie werden EVS-5-Sonderannahmen behandelt?", a: "Dedizierter Abschnitt: Sie listen bindende Annahmen auf, das Werkzeug zeigt die obligatorische EVS-5-Warnung und passt den Wert basierend auf Eingaben an." },
    ]},
    finalCta: { title: "Bereit, 3 Stunden pro Bericht zu sparen", desc: "Konto erstellen, Profil personalisieren, ersten EVS-2025-Bericht in 20 Minuten generieren. Null Verpflichtung.", cta: "Kostenlos starten", ctaSecondary: "Bewertungsmodul ansehen" },
  },
  investisseur: {
    trust: standardTrust("investisseur"),
    pricing: { title: "In Ihrem tevaxia-Abonnement enthalten", subtitle: "Keine Abrechnung pro Simulation, kein Kontingent. Alle Investment-Werkzeuge sind im allgemeinen Abonnement enthalten.", features: ["Unbegrenzte Simulationen", "LU-Erwerbskosten mit Bëllegen Akt", "Multi-Mieter-DCF nach Bail", "VEFA mit Zwischenzinsen", "LU-Veräusserungsgewinne", "Konsolidiertes Multi-Asset-Portfolio", "Bank-Werkzeuge LTV / DSCR / CRR", "Live-Makro EZB + STATEC"], ctaPlatform: "tevaxia-Pakete ansehen", ctaEmit: "Zum Portfolio" },
    faq: { title: "Häufig gestellte Fragen", items: [
      { q: "Wird der Bëllegen-Akt-Abzug richtig behandelt?", a: "Ja, das Werkzeug prüft Eignungsbedingungen und wendet bis zu 40.000 € pro Person Abzug auf Eintragungsgebühren an." },
      { q: "Wird 3 %-Neubau-MwSt korrekt einbezogen?", a: "Ja, der VEFA-Simulator wendet automatisch den 3 %-Satz vorbehaltlich Hauptwohnsitz 2 Jahre Mindestbelegung an." },
      { q: "Behandelt der Multi-Mieter-DCF französische und LU-Breaks?", a: "Ja. Jeder Bail kann Laufzeit, Indexierung, geplante Step Rents, Break-Options, geplanten CAPEX haben." },
      { q: "Werden LU-Veräusserungsgewinne korrekt berechnet?", a: "Ja. Hauptwohnung Befreiung, Zweitwohnung Halb-Global-Satz, Investition Global-/Halb-Global-Satz je nach Haltedauer." },
      { q: "Folgen Bank-Werkzeuge (LTV, DSCR, CRR) CSSF-Regeln?", a: "Ja. Max LTV pro Kreditnehmerprofil, DSCR-Ziel 1,25, CRR-Beleihungswert mit Energie-Haircut. +2 %-Stresstest." },
      { q: "Kann ich meine Simulationen mit meinem Banker teilen?", a: "Ja. Dediziertes Finanzierungsakte-PDF. View-only-Teilen mit 7-90-Tage-Link." },
    ]},
    finalCta: { title: "Bereit, schnell und gut zu entscheiden", desc: "Konto erstellen, erstes Szenario eingeben, vollständige Rendite in 5 Minuten erhalten. Null Verpflichtung.", cta: "Kostenlos starten", ctaSecondary: "Portfolio live ansehen" },
  },
  particulier: {
    trust: standardTrust("particulier"),
    pricing: { title: "Kostenlos, keine Registrierung für das Wesentliche", subtitle: "Alle Basis-Werkzeuge funktionieren ohne Konto. Kostenloses Konto erstellen, um Simulationen zu speichern, PDFs zu exportieren und Historie zuzugreifen.", features: ["Schätzung, Gebühren, Förderungen, Miete ohne Konto", "PDF-Export mit kostenlosem Konto", "Multi-Device-Cloud-Speicherung", "Simulationshistorie", "View-only-Link-Teilen", "Vergleich bis zu 5 Szenarien", "Marktbenachrichtigungen pro Gemeinde", "5 Sprachen (FR / EN / DE / LB / PT)"], ctaPlatform: "tevaxia-Pakete ansehen", ctaEmit: "Objekt schätzen" },
    faq: { title: "Häufig gestellte Fragen", items: [
      { q: "Ist die Schätzung zuverlässig?", a: "MAPE von ~12 %, vergleichbar mit Bank-Werkzeugen. Noch eine Schätzung: eine zertifizierte REV-Bewertung ist für Bankfinanzierung empfohlen." },
      { q: "Wird Bëllegen Akt korrekt berechnet?", a: "Ja. Bedingungen geprüft (Hauptwohnung, 2 Jahre Belegung). Bis zu 40.000 € pro Person Abzug." },
      { q: "Sind Gemeinde-Förderungen aktuell?", a: "Ja, über 30 Gemeinden haben ihre Sätze integriert. Kontaktieren Sie uns, wenn Ihre fehlt." },
      { q: "Gilt die 5 %-Mietregel für alle Vermietungen?", a: "Ja für Wohnraummieten unter dem Gesetz 21.09.2006. Ausnahmen: Gewerbemiete, kurzfristige möblierte, Studentenresidenzen." },
      { q: "Kann ich die Werkzeuge ohne Konto nutzen?", a: "Ja, alle Basis-Werkzeuge funktionieren ohne Anmeldung. Das kostenlose Konto schaltet PDF-Export, Cloud-Speicher, Historie und Link-Teilen frei." },
      { q: "Werden meine Daten aufbewahrt?", a: "Ohne Konto bleibt nichts serverseitig. Mit kostenlosem Konto auf Supabase (AWS eu-central-1, Frankfurt) mit RLS gespeichert." },
    ]},
    finalCta: { title: "Bereit, klar zu sehen", desc: "Beginnen Sie mit Objekt-Schätzung oder Gebühren-Simulation. Keine Anmeldung, keine Verpflichtung, in 2 Minuten.", cta: "Objekt kostenlos schätzen", ctaSecondary: "Alle Werkzeuge ansehen" },
  },
  promoteur: {
    trust: standardTrust("promoteur"),
    pricing: { title: "In Ihrem tevaxia-Abonnement enthalten", subtitle: "Keine Abrechnung pro Projekt, kein Simulationskontingent. Alle Bauträger-Werkzeuge sind im allgemeinen Abonnement enthalten.", features: ["Unbegrenzte Bauträger-GuV", "VEFA mit Zwischenzinsen", "STATEC-Bau-Schätzer 17 Gewerke", "Strassenbau-Rechner 9 belegte Lose", "OAI/ILNAS ACT-Flächenumrechner", "PAG/PAP-Analyse 98 Gemeinden", "Unbegrenzter Szenarienvergleich", "Bank-PDF-Bericht", "Multi-Parameter-Margen-Stresstest"], ctaPlatform: "tevaxia-Pakete ansehen", ctaEmit: "Zur Bauträger-GuV" },
    faq: { title: "Häufig gestellte Fragen", items: [
      { q: "Sind STATEC-Indizes aktuell?", a: "Ja, der Baukostenindex wird vierteljährlich aktualisiert (neuester Wert: Oktober 2025 = 1.173,24). Die 17 STATEC-Gewerke sind abgedeckt." },
      { q: "Wird 3 %-Neubau-MwSt richtig behandelt?", a: "Ja, für Resident-Erstkäufer, die das Objekt mindestens 2 Jahre belegen." },
      { q: "Kann ich eigene Baukosten konfigurieren?", a: "Ja, die 17 STATEC-Gewerke dienen als Referenz, sind aber alle anpassbar." },
      { q: "Entspricht der Strassenbau luxemburgischen Regeln?", a: "Ja, die 9 Strassenbau-Lose verwenden Batiprix-2026-Preise (LU-Koeffizient ×1,20), CTG 002 & 009, CSDC-CT." },
      { q: "Respektiert die Flächenumrechnung OAI/ILNAS-Normen?", a: "Ja, ILNAS 101:2016 für die 4 Flächentypen. ACT-Gewichtung gemäss OAI FC.04." },
      { q: "Kann ich meine GuV für meine Bank exportieren?", a: "Ja, vollständiges Bauträger-Finanzierungsakte-PDF: GuV, monatlicher Cashflow-Plan, Margen-Sensibilität. View-only-Teilen möglich." },
    ]},
    finalCta: { title: "Bereit, Ihre Projekte schneller zu kalkulieren", desc: "Konto erstellen, erstes Projekt eingeben, GuV in 30 Minuten erhalten. Null Verpflichtung.", cta: "Kostenlos starten", ctaSecondary: "Bauträger-GuV ansehen" },
  },
  banque: {
    trust: standardTrust("banque"),
    pricing: { title: "In Ihrem tevaxia-Abonnement enthalten", subtitle: "Keine Abrechnung pro Akte. Alle Bank-Werkzeuge sind im allgemeinen Abonnement enthalten.", features: ["Unbegrenzte EVS-2025-Bewertungen", "CRR-Beleihungswert mit CRREM-Haircut", "LTV / DSCR / Kreditkapazität", "+2 %- und Arbeitslosigkeits-Stresstest", "AML/KYC mit Audit-Trail", "CRREM-Stranding-Energie-Portfolio", "Strukturierter Risiko-PDF-Bericht", "REST-API für CRM-Integration", "Multi-Mieter-DCF + Hotelbewertung"], ctaPlatform: "tevaxia-Pakete ansehen", ctaEmit: "Zu Bank-Werkzeugen" },
    faq: { title: "Häufig gestellte Fragen", items: [
      { q: "Wie wird CRR-Beleihungswert berechnet?", a: "EVS-2025-Marktwert minus Energie-Haircut basierend auf Objekt-Energieklasse und CRREM-Trajektorie. Ein vor 2030 gestrandetes Asset erhält 20-30 % Haircut." },
      { q: "Deckt AML/KYC CSSF-Anforderungen ab?", a: "Ja: EU-Sanktionsprüfung (CFSP), PEP, UBO, Herkunft der Mittel. Konsolidierter Audit-Trail mit Zeitstempeln. Exportierbarer Bericht für CSSF-Audits." },
      { q: "Ist der Stresstest EBA-konform?", a: "Ja, Standardszenarien (+2 %-Zins, 6-Monats-Arbeitslosigkeit, 10-20 % Wertrückgang) entsprechen EBA-Erwartungen an Resilienztests." },
      { q: "Können wir via API an unser Core Banking integrieren?", a: "Ja, REST-API mit OAuth 2.0. Endpunkte: Bewertung, LTV, Stresstest, AML/KYC. Webhook für automatischen Push. Öffentliche OpenAPI 3.1 Dokumentation." },
      { q: "Wie wird BCL- und CSSF-Konformität gehandhabt?", a: "Hedonisches Modell mit öffentlichem MAPE und R² für Auditierbarkeit, 29 belegt Koeffizienten dokumentiert. Öffentliche /transparence-Seite." },
      { q: "Sind Kundendaten auf Banken-Standard sicher?", a: "Supabase-Speicherung (AWS eu-central-1 Frankfurt), Row Level Security, HTTPS, ISO 27001. Strikte Isolation pro Organisation." },
    ]},
    finalCta: { title: "Bereit, Ihre Kreditakten zu beschleunigen", desc: "Pilot-Konto erstellen, Testakte verbinden, Bewertung + CRR + AML/KYC in 10 Minuten erhalten. Kontaktieren Sie uns für ein Bank-POC.", cta: "Kostenlos starten", ctaSecondary: "Bank-Werkzeuge ansehen" },
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
    title: "Luxemburger Immobilienlösungen nach Profil — tevaxia.lu",
    description: "Hausverwaltung, Makler, Hotel, Gutachter, Investor, Privatperson: finden Sie die tevaxia.lu-Lösung für Ihren Beruf. LU-Konformität, öffentliche Daten, 5 Sprachen.",
  },
  hero: {
    badge: "6 branchenspezifische Lösungen",
    title: "Finden Sie die für Ihren Beruf passende Lösung",
    subtitle: "Jedes Profil hat seine eigenen Rechtspflichten, Workflows und Quelldaten, die spezifisch für den luxemburgischen Markt sind. Statt in 40+ Werkzeugen zu suchen, starten Sie mit Ihrem Beruf.",
  },
  personas: {
    cta: "Detaillierte Lösung ansehen",
    syndic: { title: "Hausverwaltung / Syndic", desc: "Online-EV mit tantième-gewichteter Abstimmung, Factur-X-Mittelabrufe, LU-Gemeinschafts-Buchhaltung, PSD2-Bankabgleich. Konform Gesetz 16. Mai 1975." },
    agence: { title: "Immobilienmakler", desc: "OpenImmo-Mandatspipeline, Kontakt-CRM mit /100 Käufer-Matching, Drag-Drop-Kanban, Co-Branding-Objekt-PDFs, eIDAS-Signatur." },
    hotel: { title: "Hotellerie", desc: "Multi-Objekt-PMS, USALI-19-Kategorien-Auto-Posting-Folios, LU-MwSt-3 %/8 %/17 %-Rechnung, 90-Tage-Forecast, iCal OTA." },
    "expert-evaluateur": { title: "Gutachter / Experte", desc: "TEGOVA-EVS-2025-konformer Bericht in 20 min, 8 Methoden, 9 Asset-Typen, automatisch ausgefüllte Daten (98 Gemeinden + 12 Makro-Serien)." },
    investisseur: { title: "Investor", desc: "Renditesimulator mit Bëllegen Akt, Multi-Mieter-DCF, VEFA-Zwischenzinsen, LU-Veräusserungsgewinne, Multi-Asset-Portfolio." },
    particulier: { title: "Privatperson", desc: "Schätzung, Erwerbskosten mit Bëllegen Akt, 5 Ebenen kumulierbarer Förderungen (Klimabonus inklusive), rechtlicher 5 %-Mietdeckel." },
  },
  compare: {
    title: "Schneller Vergleich",
    intro: "Wenn Sie zwischen zwei Profilen schwanken, vergleichen Sie tägliche Nutzung, Rechtskonformität und implementierte Standards.",
    profileCol: "Profil",
    dailyCol: "Tägliche Nutzung",
    complianceCol: "LU-Konformität",
    standardsCol: "Standards",
    rows: {
      syndic: { daily: "EV, Mittelabrufe, Mahnungen, Gemeinschafts-Buchhaltung verwalten", compliance: "Gesetz 16. Mai 1975, MwSt Art. 44 §1 f Befreiung", standards: "EN 16931, Peppol, ISO 20022" },
      agence: { daily: "Mandate, Kontakte, Portalverteilung, Käufer-Matching", compliance: "eIDAS EU 910/2014, DSGVO-Einwilligung", standards: "OpenImmo 1.2.8, eIDAS" },
      hotel: { daily: "Buchungen, Folios, Rechnungen, Revenue Management", compliance: "3 %-Beherbergungs-MwSt, kommunale Kurtaxe", standards: "USALI 11. Aufl., STR, iCal" },
      "expert-evaluateur": { daily: "Immobilienbewertungen, Berichte, Feldinspektionen", compliance: "TEGOVA EVS 2025, Charte 5. Aufl.", standards: "EVS 2025, Red Book, RICS" },
      investisseur: { daily: "Rendite, DCF, Finanzierungssimulationen, Portfolio", compliance: "Bëllegen Akt, LU-Veräusserungsgewinne, CSSF-Regeln", standards: "CRR, EZB, Basel III" },
      particulier: { daily: "Schätzung, Gebühren, Förderungen, Kauf/Miete-Vergleich", compliance: "Gesetz 21.09.2006, 5 %-Regel, Klimabonus", standards: "IRL, Observatoire Habitat, STATEC" },
    },
  },
  faq: {
    title: "Fragen gemeinsam für alle 6 Profile",
    intro: "Zum Preismodell, zur Individualentwicklung, zum Support, zur Sicherheit und zur Migration.",
    items: [
      { q: "Wie viel kostet das tevaxia-Abonnement?", a: "Keine Abrechnung pro Modul oder pro Benutzer innerhalb jedes Profils. Ein einziges tevaxia-Abonnement gibt Zugriff auf alle Werkzeuge für Ihren Beruf, ohne Kontingente oder Volumenbegrenzungen. Vollständige Preisgestaltung auf der /pricing-Seite." },
      { q: "Kann ich Individualentwicklung anfragen?", a: "Ja. Spezifisches Format, atypische Berechnung, dedizierte Integration: Entwicklung in 1 bis 3 Wochen je nach Komplexität. Kostenloses Angebot." },
      { q: "Was ist die Support-Antwortzeit?", a: "Durchschnittsantwort unter 6 Stunden an Werktagen, maximal 24 Stunden. E-Mail contact@tevaxia.lu. Kein Chatbot, keine nummerierten Tickets: Sie sprechen mit einem Menschen, der das Produkt kennt." },
      { q: "Sind Daten in der EU gehostet?", a: "Ja. Supabase (AWS eu-central-1, Frankfurt) mit nutzerbasierter Row Level Security, HTTPS, DSGVO-konform. Vollständiger Datenexport als ZIP jederzeit." },
      { q: "Wie migriere ich von einem anderen Werkzeug?", a: "CSV- oder Excel-Import je nach Datentyp. Automatisches Spalten-Mapping mit Vorschau. Kostenlose Migrationsunterstützung." },
      { q: "Wie oft werden Updates ausgerollt?", a: "Releases im Durchschnitt alle 2 Wochen. Öffentliches Backlog auf github.com/Tevaxia. Auto-Updates: nichts zu installieren." },
      { q: "Ist tevaxia mehrsprachig?", a: "Ja, 5 Sprachen: Französisch, Englisch, Deutsch, Portugiesisch und Luxemburgisch. Persona-Landings sind derzeit vollständig in FR und EN, mit DE/LB/PT in Übersetzung." },
      { q: "Kann tevaxia ausserhalb Luxemburgs genutzt werden?", a: "Die Plattform ist hauptsächlich für den luxemburgischen Rechtsrahmen kalibriert (3 % MwSt, Bëllegen Akt, 5 %-Regel, TEGOVA). Einige Module funktionieren auch für Frankreich und Belgien (Factur-X, DCF, Kauf/Miete-Komparator)." },
    ],
  },
  orientation: {
    title: "Nicht sicher, welches Profil zu Ihnen passt?",
    desc: "Schreiben Sie uns Ihre Tätigkeit in 2 Zeilen, wir orientieren Sie in weniger als 24 Stunden zur passendsten Lösung.",
    ctaContact: "E-Mail an contact@tevaxia.lu",
    ctaHome: "Zurück zur Startseite",
  },
};

// Now write to de.json
const file = "src/messages/de.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));
data.solutions = SOLUTIONS;
data.solutionsHub = SOLUTIONS_HUB;
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("DE translation applied successfully");
