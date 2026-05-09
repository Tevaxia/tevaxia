#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MSG_DIR = path.resolve('src/messages');

const K = {
  fr: {
    tenantPortalCopied: "Lien portail locataire copié ✓\n\n{url}\n\nÀ transmettre au locataire par email.",
    errCopyGeneric: "Erreur : {msg}",
    errUnknown: "inconnue",
    tenantPortalBtn: "🔗 Générer lien portail locataire",
    cumTitle: "Cumul mensuel {year}",
    cumSubtitle: "Loyers perçus cumulés vs loyers dus cumulés.",
    legendDue: "Dû",
    legendPaidOnTime: "Perçu (à jour)",
    legendPaidLate: "Perçu (en retard)",
    facturxTitle: "Pré-remplir une Factur-X pour ce mois",
  },
  en: {
    tenantPortalCopied: "Tenant portal link copied ✓\n\n{url}\n\nShare with the tenant by email.",
    errCopyGeneric: "Error: {msg}",
    errUnknown: "unknown",
    tenantPortalBtn: "🔗 Generate tenant portal link",
    cumTitle: "Monthly cumulative {year}",
    cumSubtitle: "Cumulative rents received vs cumulative rents due.",
    legendDue: "Due",
    legendPaidOnTime: "Received (on time)",
    legendPaidLate: "Received (late)",
    facturxTitle: "Pre-fill a Factur-X for this month",
  },
  de: {
    tenantPortalCopied: "Mieterportal-Link kopiert ✓\n\n{url}\n\nDem Mieter per E-Mail weiterleiten.",
    errCopyGeneric: "Fehler: {msg}",
    errUnknown: "unbekannt",
    tenantPortalBtn: "🔗 Mieterportal-Link erzeugen",
    cumTitle: "Monatliche Kumulation {year}",
    cumSubtitle: "Kumulierte erhaltene Mieten vs kumulierte geschuldete Mieten.",
    legendDue: "Geschuldet",
    legendPaidOnTime: "Erhalten (pünktlich)",
    legendPaidLate: "Erhalten (verspätet)",
    facturxTitle: "Factur-X für diesen Monat vorausfüllen",
  },
  pt: {
    tenantPortalCopied: "Ligação do portal do inquilino copiada ✓\n\n{url}\n\nA transmitir ao inquilino por email.",
    errCopyGeneric: "Erro: {msg}",
    errUnknown: "desconhecido",
    tenantPortalBtn: "🔗 Gerar ligação do portal do inquilino",
    cumTitle: "Acumulado mensal {year}",
    cumSubtitle: "Rendas recebidas acumuladas vs rendas devidas acumuladas.",
    legendDue: "Devido",
    legendPaidOnTime: "Recebido (em dia)",
    legendPaidLate: "Recebido (em atraso)",
    facturxTitle: "Pré-preencher uma Factur-X para este mês",
  },
  lb: {
    tenantPortalCopied: "Locatair-Portal-Link kopéiert ✓\n\n{url}\n\nUn de Locatair per E-Mail iwwerdroen.",
    errCopyGeneric: "Feeler: {msg}",
    errUnknown: "onbekannt",
    tenantPortalBtn: "🔗 Locatair-Portal-Link generéieren",
    cumTitle: "Monatskumul {year}",
    cumSubtitle: "Kumuléiert krut Mieten vs kumuléiert geschëllt Mieten.",
    legendDue: "Geschëllt",
    legendPaidOnTime: "Krut (pünktlech)",
    legendPaidLate: "Krut (verspéidegt)",
    facturxTitle: "Eng Factur-X fir dëse Mount virfëllen",
  },
};

for (const [lang, keys] of Object.entries(K)) {
  const file = path.join(MSG_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.paiementsLocatifs) data.paiementsLocatifs = {};
  data.paiementsLocatifs = { ...data.paiementsLocatifs, ...keys };
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${lang}: +${Object.keys(keys).length} keys`);
}
