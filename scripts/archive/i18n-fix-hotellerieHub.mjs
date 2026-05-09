#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MSG_DIR = path.resolve('src/messages');

const translations = {
  en: {
    ddDesc: "Exhaustive pre-acquisition checklist (technical, commercial, legal, tax, ESG, HR). HVS-inspired.",
    esgDesc: "Green Key pre-diagnostic over 29 criteria: label eligibility, investment roadmap.",
    miceDesc: "Corporate group revenue: RFP, conversion, F&B capture, meeting-room rental.",
    motelDesc: "Valuation dedicated to extended-stay and budget hospitality.",
    alertsDesc: "Automatic alerts on pickup, ADR, occupancy, GOP vs benchmark.",
  },
  de: {
    ddDesc: "Umfassende Pre-Acquisition-Checkliste (Technik, Kommerz, Recht, Steuer, ESG, HR). HVS-inspiriert.",
    esgDesc: "Green-Key-Vordiagnose mit 29 Kriterien: Label-Eignung, Investitions-Roadmap.",
    miceDesc: "Umsatz Firmen-Gruppen: RFP, Conversion, F&B-Capture, Tagungsraumvermietung.",
    motelDesc: "Bewertung speziell für Langzeitaufenthalte und Budget-Hotellerie.",
    alertsDesc: "Automatische Alerts zu Pickup, ADR, Auslastung, GOP vs. Benchmark.",
  },
  pt: {
    ddDesc: "Checklist exaustiva pré-aquisição (técnica, comercial, jurídica, fiscal, ESG, RH). Inspirada HVS.",
    esgDesc: "Pré-diagnóstico Green Key com 29 critérios: elegibilidade ao selo, roadmap de investimentos.",
    miceDesc: "Receita de grupos corporate: RFP, conversão, captura F&B, aluguer de sala.",
    motelDesc: "Valorização dedicada às estadias prolongadas e à hotelaria económica.",
    alertsDesc: "Alertas automáticos sobre pickup, ADR, ocupação, GOP vs. benchmark.",
  },
  lb: {
    ddDesc: "Ëmfaassend Pre-Acquisition-Checklëscht (Technik, Kommerz, Recht, Steier, ESG, HR). HVS-inspiréiert.",
    esgDesc: "Green-Key-Virdiagnos iwwer 29 Critères: Label-Eegenheet, Investitiouns-Roadmap.",
    miceDesc: "Ëmsaz Firmen-Gruppen: RFP, Conversion, F&B-Capture, Locatioun vu Sall.",
    motelDesc: "Valorisatioun speziell fir laang Openthalten a Budget-Hotellerie.",
    alertsDesc: "Automatesch Alerten iwwer Pickup, ADR, Belegung, GOP vs. Benchmark.",
  },
};

for (const [lang, values] of Object.entries(translations)) {
  const file = path.join(MSG_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.hotellerieHub) {
    console.error(`No hotellerieHub in ${lang}`);
    process.exit(1);
  }
  for (const [key, value] of Object.entries(values)) {
    if (!(key in data.hotellerieHub)) {
      console.error(`Missing key ${key} in ${lang}`);
      process.exit(1);
    }
    data.hotellerieHub[key] = value;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${lang}: ${Object.keys(values).length} keys`);
}
