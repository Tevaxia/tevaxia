#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MSG_DIR = path.resolve('src/messages');

const K = {
  fr: {
    backCrm: "← CRM",
    pageTitle: "Bibliothèque emails types",
    pageSubtitle: "10 modèles d'emails pré-rédigés pour les situations commerciales les plus fréquentes en immobilier LU. Variables auto-substituées. Ouvre directement votre client mail avec mailto: pré-rempli.",
    filterAll: "Toutes ({n})",
    filterCat: "{label} ({n})",
    emptyPanel: "Sélectionnez un modèle à gauche pour personnaliser et envoyer.",
    usageTitle: "Usage :",
    usageBody: "adaptez les variables à votre contexte (prénom client, adresse bien, prix…) puis cliquez «Ouvrir dans mon client mail». Le mailto ouvrira Gmail, Outlook ou Apple Mail selon votre config OS avec sujet + corps pré-remplis. Les templates sont versionnés dans le code (pas de base de données), demandez un ajout / modif via vos canaux habituels.",
    selectedLabel: "Modèle sélectionné",
    variablesTitle: "Variables",
    emailLabel: "Email destinataire",
    emailPlaceholder: "destinataire@example.com",
    previewTitle: "Aperçu",
    btnOpenMail: "📧 Ouvrir dans mon mail",
    btnCopy: "📋 Copier",
    flashCopied: "Corps du mail copié ✓",
  },
  en: {
    backCrm: "← CRM",
    pageTitle: "Email template library",
    pageSubtitle: "10 ready-made email templates for the most common LU real estate situations. Variables auto-substituted. Opens your mail client directly with a pre-filled mailto:.",
    filterAll: "All ({n})",
    filterCat: "{label} ({n})",
    emptyPanel: "Select a template on the left to customise and send.",
    usageTitle: "Usage:",
    usageBody: "adjust the variables to your context (client first name, property address, price…) then click «Open in my mail client». Mailto will open Gmail, Outlook or Apple Mail depending on your OS config with subject + body pre-filled. Templates are versioned in the code (no database), request an addition / change through your usual channels.",
    selectedLabel: "Selected template",
    variablesTitle: "Variables",
    emailLabel: "Recipient email",
    emailPlaceholder: "recipient@example.com",
    previewTitle: "Preview",
    btnOpenMail: "📧 Open in my mail client",
    btnCopy: "📋 Copy",
    flashCopied: "Email body copied ✓",
  },
  de: {
    backCrm: "← CRM",
    pageTitle: "Bibliothek E-Mail-Vorlagen",
    pageSubtitle: "10 vorformulierte E-Mail-Vorlagen für die häufigsten Verkaufssituationen im LU-Immobilienmarkt. Variablen werden automatisch ersetzt. Öffnet Ihr E-Mail-Programm mit vorausgefülltem mailto:.",
    filterAll: "Alle ({n})",
    filterCat: "{label} ({n})",
    emptyPanel: "Wählen Sie links eine Vorlage, um sie anzupassen und zu senden.",
    usageTitle: "Nutzung:",
    usageBody: "passen Sie die Variablen an Ihren Kontext an (Kundenvorname, Objektadresse, Preis…) und klicken Sie auf «In meinem E-Mail-Client öffnen». Der mailto-Link öffnet Gmail, Outlook oder Apple Mail je nach Betriebssystem mit Betreff und Text vorausgefüllt. Die Vorlagen sind im Code versioniert (keine Datenbank), Anpassungen bitte über die üblichen Kanäle anfragen.",
    selectedLabel: "Ausgewählte Vorlage",
    variablesTitle: "Variablen",
    emailLabel: "Empfänger-E-Mail",
    emailPlaceholder: "empfaenger@example.com",
    previewTitle: "Vorschau",
    btnOpenMail: "📧 In meinem E-Mail-Client öffnen",
    btnCopy: "📋 Kopieren",
    flashCopied: "E-Mail-Inhalt kopiert ✓",
  },
  pt: {
    backCrm: "← CRM",
    pageTitle: "Biblioteca de modelos de email",
    pageSubtitle: "10 modelos de email pré-redigidos para as situações comerciais mais frequentes no imobiliário LU. Variáveis substituídas automaticamente. Abre diretamente o seu cliente de email com mailto: pré-preenchido.",
    filterAll: "Todos ({n})",
    filterCat: "{label} ({n})",
    emptyPanel: "Selecione um modelo à esquerda para personalizar e enviar.",
    usageTitle: "Utilização:",
    usageBody: "adapte as variáveis ao seu contexto (primeiro nome do cliente, morada do imóvel, preço…) depois clique «Abrir no meu cliente de email». O mailto abrirá Gmail, Outlook ou Apple Mail consoante a configuração do SO com assunto + corpo pré-preenchidos. Os modelos são versionados no código (sem base de dados), peça uma adição / alteração pelos seus canais habituais.",
    selectedLabel: "Modelo selecionado",
    variablesTitle: "Variáveis",
    emailLabel: "Email destinatário",
    emailPlaceholder: "destinatario@example.com",
    previewTitle: "Pré-visualização",
    btnOpenMail: "📧 Abrir no meu email",
    btnCopy: "📋 Copiar",
    flashCopied: "Corpo do email copiado ✓",
  },
  lb: {
    backCrm: "← CRM",
    pageTitle: "Bibliothéik E-Mail-Schablounen",
    pageSubtitle: "10 virschriwwen E-Mail-Schablounen fir déi heefegst kommerziell Situatiounen am LU-Immobilien. Variabelen ginn automatesch ersat. Mécht direkt Äre Mail-Client op mat virausgefëlltem mailto:.",
    filterAll: "All ({n})",
    filterCat: "{label} ({n})",
    emptyPanel: "Wielt eng Schablon lénks aus fir se ze personaliséieren an ze schécken.",
    usageTitle: "Notzung:",
    usageBody: "passt d'Variabelen un Äre Kontext un (Virnumm vum Client, Adress vum Bien, Präis…) a klickt op «An mengem Mail-Client opmaachen». De mailto mécht Gmail, Outlook oder Apple Mail op no Ärer OS-Konfiguratioun mat Sujet + Kierper virausgefëllt. D'Schablounen sinn am Code versionéiert (keng Datebank), freet eng Ergänzung / Ännerung iwwer Är gewinnt Kanäl un.",
    selectedLabel: "Ausgewielt Schablon",
    variablesTitle: "Variabelen",
    emailLabel: "Empfänger-E-Mail",
    emailPlaceholder: "empfaenger@example.com",
    previewTitle: "Virschau",
    btnOpenMail: "📧 An mengem Mail opmaachen",
    btnCopy: "📋 Kopéieren",
    flashCopied: "E-Mail-Kierper kopéiert ✓",
  },
};

for (const [lang, keys] of Object.entries(K)) {
  const file = path.join(MSG_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.proaCrmTemplates = keys;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${lang}: +${Object.keys(keys).length} keys`);
}
