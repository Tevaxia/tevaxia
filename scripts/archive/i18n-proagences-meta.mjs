#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MSG_DIR = path.resolve('src/messages');

const META = {
  fr: {
    title: "Offre agences immobilières, rapports co-brandés | tevaxia.lu",
    description: "Pour les agences LU/BE : génération automatique de rapports d'estimation co-brandés (estimation + frais + aides) en 1 PDF. Multi-utilisateurs, logo agence, données prospect.",
  },
  en: {
    title: "Real estate agency offer, co-branded reports | tevaxia.lu",
    description: "For LU/BE agencies: automatic generation of co-branded valuation reports (estimate + fees + subsidies) as 1 PDF. Multi-user, agency logo, prospect data.",
  },
  de: {
    title: "Angebot für Immobilienagenturen, co-gebrandete Berichte | tevaxia.lu",
    description: "Für LU/BE-Agenturen: automatische Erstellung co-gebrandeter Wertgutachten (Schätzung + Gebühren + Zuschüsse) in 1 PDF. Mehrbenutzer, Agentur-Logo, Interessentendaten.",
  },
  pt: {
    title: "Oferta agências imobiliárias, relatórios co-marcados | tevaxia.lu",
    description: "Para agências LU/BE: geração automática de relatórios de avaliação co-marcados (estimativa + taxas + apoios) em 1 PDF. Multi-utilizador, logótipo da agência, dados do cliente.",
  },
  lb: {
    title: "Offer fir Immobilie-Agencen, co-brandéiert Rapporten | tevaxia.lu",
    description: "Fir LU/BE-Agencen: automatesch Generatioun vu co-brandéierten Schätzungsrapporten (Schätzung + Frais + Hëllefen) an engem PDF. Multi-Benotzer, Agence-Logo, Prospect-Donnéeën.",
  },
};

for (const [lang, meta] of Object.entries(META)) {
  const file = path.join(MSG_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.proAgences) { console.error(`[${lang}] proAgences missing`); continue; }
  data.proAgences.meta = meta;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${lang}: proAgences.meta`);
}
