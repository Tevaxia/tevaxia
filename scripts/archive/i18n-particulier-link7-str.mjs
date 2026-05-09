#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MSG_DIR = path.resolve('src/messages');

const LINK7 = {
  fr: "Location courte durée (Airbnb)",
  en: "Short-term rental (Airbnb)",
  de: "Kurzzeitvermietung (Airbnb)",
  pt: "Arrendamento de curta duração (Airbnb)",
  lb: "Kuerzzäit-Locatioun (Airbnb)",
};

for (const [lang, label] of Object.entries(LINK7)) {
  const file = path.join(MSG_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.onboarding || !data.onboarding.particulier) {
    console.error(`[${lang}] onboarding.particulier missing`);
    continue;
  }
  data.onboarding.particulier.link7 = label;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${lang}: personas.particulier.link7`);
}
