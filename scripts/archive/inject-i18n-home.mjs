// Inject i18n keys for home page updates (hero CTAs, new modules, stats, trust badges, onboarding links)
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

/* ---------- helpers ---------- */
function deepSet(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in cur)) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function deepGet(obj, path) {
  const keys = path.split(".");
  let cur = obj;
  for (const k of keys) {
    if (cur == null || !(k in cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}

/* ---------- NEW KEYS ---------- */
// Format: dotPath → { fr, en, de, lb, pt }
const NEW_KEYS = {
  // Hero CTAs
  "home.heroCta1": {
    fr: "Estimer mon bien",
    en: "Estimate my property",
    de: "Meine Immobilie bewerten",
    lb: "Meng Immobilie bewäerten",
    pt: "Estimar o meu imóvel",
  },
  "home.heroCta2": {
    fr: "Voir les 30+ outils",
    en: "See all 30+ tools",
    de: "Alle 30+ Tools ansehen",
    lb: "All 30+ Tools gesinn",
    pt: "Ver as 30+ ferramentas",
  },

  // New module cards
  "home.modules.hotellerie.title": {
    fr: "Hub Hôtellerie",
    en: "Hospitality Hub",
    de: "Hotellerie-Hub",
    lb: "Hotellerie-Hub",
    pt: "Hub Hotelaria",
  },
  "home.modules.hotellerie.description": {
    fr: "6 calculateurs hôteliers : valorisation RevPAR/EBITDA, DSCR, exploitation, score E-2, forecast et comparaison RevPAR.",
    en: "6 hotel calculators: RevPAR/EBITDA valuation, DSCR, operating P&L, E-2 score, forecast and RevPAR comparison.",
    de: "6 Hotel-Rechner: RevPAR/EBITDA-Bewertung, DSCR, Betriebs-GuV, E-2-Score, Forecast und RevPAR-Vergleich.",
    lb: "6 Hotel-Rechner: RevPAR/EBITDA-Bewäertung, DSCR, Exploitatiounsbilanz, E-2-Score, Forecast an RevPAR-Vergläich.",
    pt: "6 calculadores hoteleiros: avaliação RevPAR/EBITDA, DSCR, exploração, score E-2, previsão e comparação RevPAR.",
  },
  "home.modules.hotellerie.tag": {
    fr: "Pré-acquisition hôtel",
    en: "Hotel pre-acquisition",
    de: "Hotel-Vorerwerb",
    lb: "Hotel-Virakaf",
    pt: "Pré-aquisição hotel",
  },

  "home.modules.gestionLocative.title": {
    fr: "Gestion Locative LU",
    en: "LU Rental Management",
    de: "LU Vermietungsverwaltung",
    lb: "LU Lounungsverwaltung",
    pt: "Gestão Locativa LU",
  },
  "home.modules.gestionLocative.description": {
    fr: "Règle des 5 %, Klimabonus locatif, rendement net, cashflow mensuel et tableau de bord pour propriétaires-bailleurs luxembourgeois.",
    en: "5% rule, rental Klimabonus, net yield, monthly cashflow and dashboard for Luxembourg landlords.",
    de: "5%-Regel, Miet-Klimabonus, Nettorendite, monatlicher Cashflow und Dashboard für Luxemburger Vermieter.",
    lb: "5%-Regel, Loyer-Klimabonus, Nettorendement, monatleche Cashflow an Dashboard fir Lëtzebuerger Proprietären.",
    pt: "Regra dos 5%, Klimabonus locativo, rendimento líquido, cashflow mensal e painel para proprietários luxemburgueses.",
  },
  "home.modules.gestionLocative.tag": {
    fr: "Propriétaire-bailleur",
    en: "Landlord tools",
    de: "Vermieter-Tools",
    lb: "Proprietär-Tools",
    pt: "Proprietário-arrendador",
  },

  "home.modules.bailCommercial.title": {
    fr: "Bail Commercial LU",
    en: "Commercial Lease LU",
    de: "Gewerbemietvertrag LU",
    lb: "Gewierflech Bail LU",
    pt: "Arrendamento Comercial LU",
  },
  "home.modules.bailCommercial.description": {
    fr: "Indexation IPC, durée légale, clauses triennales et coûts complémentaires du bail commercial luxembourgeois.",
    en: "CPI indexation, legal duration, triennial clauses and additional costs of Luxembourg commercial leases.",
    de: "VPI-Indexierung, gesetzliche Dauer, Dreijahresklauseln und Zusatzkosten luxemburgischer Gewerbemietverträge.",
    lb: "VPI-Indexéierung, gesetzlech Dauer, Dräijoerklauselen an Zousätzlech Käschte vu Lëtzebuerger Gewierflech Bailen.",
    pt: "Indexação IPC, duração legal, cláusulas trienais e custos complementares do arrendamento comercial luxemburguês.",
  },
  "home.modules.bailCommercial.tag": {
    fr: "Loi 03/02/2018",
    en: "Law 03/02/2018",
    de: "Gesetz 03/02/2018",
    lb: "Gesetz 03/02/2018",
    pt: "Lei 03/02/2018",
  },

  "home.modules.dcfMulti.title": {
    fr: "DCF Multi-locataires",
    en: "Multi-tenant DCF",
    de: "DCF Mehrmieter",
    lb: "DCF Multi-Locatairen",
    pt: "DCF Multi-inquilinos",
  },
  "home.modules.dcfMulti.description": {
    fr: "Analyse DCF complète avec break options, step rents, CAPEX, IRR equity et sensibilité sur taux de capitalisation.",
    en: "Full DCF analysis with break options, step rents, CAPEX, IRR equity and cap rate sensitivity.",
    de: "Vollständige DCF-Analyse mit Break Options, Staffelmieten, CAPEX, IRR Eigenkapital und Renditesensitivität.",
    lb: "Komplett DCF-Analyse mat Break Options, Staffelmieten, CAPEX, IRR Egenkapital an Renditesensitivitéit.",
    pt: "Análise DCF completa com break options, step rents, CAPEX, IRR equity e sensibilidade na taxa de capitalização.",
  },
  "home.modules.dcfMulti.tag": {
    fr: "Rendement / IRR",
    en: "Yield / IRR",
    de: "Rendite / IRR",
    lb: "Rendement / IRR",
    pt: "Rendimento / IRR",
  },

  "home.modules.portfolio.title": {
    fr: "Portefeuille Immobilier",
    en: "Property Portfolio",
    de: "Immobilien-Portfolio",
    lb: "Immobilien-Portfolio",
    pt: "Portfólio Imobiliário",
  },
  "home.modules.portfolio.description": {
    fr: "Analyse multi-biens, allocation par type d'actif, rendement global pondéré et suivi de performance.",
    en: "Multi-property analysis, allocation by asset type, weighted global yield and performance tracking.",
    de: "Multi-Objekt-Analyse, Allokation nach Assettyp, gewichtete Gesamtrendite und Performance-Tracking.",
    lb: "Multi-Immobilien-Analyse, Allokatioun no Assettyp, gewiicht Gesamtrendement a Performance-Tracking.",
    pt: "Análise multi-imóveis, alocação por tipo de ativo, rendimento global ponderado e acompanhamento de desempenho.",
  },
  "home.modules.portfolio.tag": {
    fr: "Multi-biens",
    en: "Multi-asset",
    de: "Multi-Objekt",
    lb: "Multi-Immobilie",
    pt: "Multi-imóveis",
  },

  "home.modules.propcalc.title": {
    fr: "Calculateur Cashflow",
    en: "Cashflow Calculator",
    de: "Cashflow-Rechner",
    lb: "Cashflow-Rechner",
    pt: "Calculador de Cashflow",
  },
  "home.modules.propcalc.description": {
    fr: "Cashflow net mensuel, rendement brut/net, TRI et projection sur 10 ans. Adapté FR/BE/LU.",
    en: "Monthly net cashflow, gross/net yield, IRR and 10-year projection. Adapted for FR/BE/LU.",
    de: "Monatlicher Netto-Cashflow, Brutto-/Nettorendite, IRR und 10-Jahres-Projektion. Angepasst für FR/BE/LU.",
    lb: "Monatleche Netto-Cashflow, Brutto-/Nettorendement, IRR an 10-Joer-Projektioun. Ugepasst fir FR/BE/LU.",
    pt: "Cashflow líquido mensal, rendimento bruto/líquido, TIR e projeção a 10 anos. Adaptado FR/BE/LU.",
  },
  "home.modules.propcalc.tag": {
    fr: "FR / BE / LU",
    en: "FR / BE / LU",
    de: "FR / BE / LU",
    lb: "FR / BE / LU",
    pt: "FR / BE / LU",
  },

  "home.modules.hedonique.title": {
    fr: "Méthode Hédonique",
    en: "Hedonic Method",
    de: "Hedonische Methode",
    lb: "Hedonesch Method",
    pt: "Método Hedónico",
  },
  "home.modules.hedonique.description": {
    fr: "Estimation par régression hédonique sur les caractéristiques du bien. Décomposition de la valeur par attribut.",
    en: "Hedonic regression estimation on property characteristics. Value decomposition by attribute.",
    de: "Hedonische Regressionsschätzung anhand der Immobilienmerkmale. Wertzerlegung nach Attribut.",
    lb: "Hedonesch Regressiounsschätzung op Basis vun den Immobiliecharakteristiken. Wäertzerleeung no Attribut.",
    pt: "Estimativa por regressão hedónica nas características do imóvel. Decomposição do valor por atributo.",
  },
  "home.modules.hedonique.tag": {
    fr: "Régression",
    en: "Regression",
    de: "Regression",
    lb: "Regressioun",
    pt: "Regressão",
  },

  "home.modules.amlKyc.title": {
    fr: "AML / KYC",
    en: "AML / KYC",
    de: "AML / KYC",
    lb: "AML / KYC",
    pt: "AML / KYC",
  },
  "home.modules.amlKyc.description": {
    fr: "Scoring anti-blanchiment et vérification d'identité pour transactions immobilières. Conformité CSSF / 4e directive.",
    en: "Anti-money laundering scoring and identity verification for real estate transactions. CSSF / 4th directive compliance.",
    de: "Geldwäscheprävention-Scoring und Identitätsprüfung für Immobilientransaktionen. CSSF- / 4. Richtlinie-Konformität.",
    lb: "Geldwäschepräventioun-Scoring an Identitéitsprüfung fir Immobilietransaktiounen. CSSF- / 4. Richtlin-Konformitéit.",
    pt: "Scoring anti-lavagem e verificação de identidade para transações imobiliárias. Conformidade CSSF / 4.ª diretiva.",
  },
  "home.modules.amlKyc.tag": {
    fr: "CSSF / 4e directive",
    en: "CSSF / 4th directive",
    de: "CSSF / 4. Richtlinie",
    lb: "CSSF / 4. Richtlin",
    pt: "CSSF / 4.ª diretiva",
  },

  "home.modules.inspection.title": {
    fr: "Inspection TEGOVA",
    en: "TEGOVA Inspection",
    de: "TEGOVA-Inspektion",
    lb: "TEGOVA-Inspektioun",
    pt: "Inspeção TEGOVA",
  },
  "home.modules.inspection.description": {
    fr: "Grille d'inspection terrain 120 points conforme EVS 2025. Scoring par section, photos, export PDF.",
    en: "120-point field inspection grid compliant with EVS 2025. Scoring by section, photos, PDF export.",
    de: "120-Punkte Vor-Ort-Inspektionsraster gemäß EVS 2025. Bewertung nach Abschnitt, Fotos, PDF-Export.",
    lb: "120-Punkten Terrain-Inspektiounsraster konform EVS 2025. Bewäertung pro Sektioun, Fotoen, PDF-Export.",
    pt: "Grelha de inspeção no terreno de 120 pontos conforme EVS 2025. Scoring por secção, fotos, exportação PDF.",
  },
  "home.modules.inspection.tag": {
    fr: "EVS 2025 terrain",
    en: "EVS 2025 field",
    de: "EVS 2025 Vor-Ort",
    lb: "EVS 2025 Terrain",
    pt: "EVS 2025 terreno",
  },

  "home.modules.terresAgricoles.title": {
    fr: "Terres Agricoles",
    en: "Agricultural Land",
    de: "Landwirtschaftliche Flächen",
    lb: "Landwirtschaftlech Flächen",
    pt: "Terrenos Agrícolas",
  },
  "home.modules.terresAgricoles.description": {
    fr: "Estimation de la valeur des terres agricoles au Luxembourg. Prix par hectare, zonage, droits de préemption.",
    en: "Agricultural land valuation in Luxembourg. Price per hectare, zoning, pre-emption rights.",
    de: "Bewertung landwirtschaftlicher Flächen in Luxemburg. Preis pro Hektar, Zonierung, Vorkaufsrechte.",
    lb: "Bewäertung vu landwirtschaftleche Flächen zu Lëtzebuerg. Präis pro Hektar, Zonéierung, Virkaafsrechter.",
    pt: "Avaliação de terrenos agrícolas no Luxemburgo. Preço por hectare, zonamento, direitos de preferência.",
  },
  "home.modules.terresAgricoles.tag": {
    fr: "Bail à ferme",
    en: "Farm lease",
    de: "Pachtvertrag",
    lb: "Pachtvertrag",
    pt: "Arrendamento rural",
  },

  "home.modules.transparence.title": {
    fr: "Transparence Fiscale",
    en: "Tax Transparency",
    de: "Steuerliche Transparenz",
    lb: "Steierlich Transparenz",
    pt: "Transparência Fiscal",
  },
  "home.modules.transparence.description": {
    fr: "Simulation de la transparence fiscale pour SCI/SCP luxembourgeoises. Impôt société vs impôt personnel.",
    en: "Tax transparency simulation for Luxembourg SCI/SCP. Corporate vs personal tax comparison.",
    de: "Simulation der steuerlichen Transparenz für luxemburgische SCI/SCP. Körperschaftsteuer vs Einkommensteuer.",
    lb: "Simulatioun vun der steierlecher Transparenz fir Lëtzebuerger SCI/SCP. Kierperschaftssteier vs Akommesteier.",
    pt: "Simulação da transparência fiscal para SCI/SCP luxemburguesas. Imposto societário vs imposto pessoal.",
  },
  "home.modules.transparence.tag": {
    fr: "SCI / SCP LU",
    en: "SCI / SCP LU",
    de: "SCI / SCP LU",
    lb: "SCI / SCP LU",
    pt: "SCI / SCP LU",
  },

  "home.modules.vefa.title": {
    fr: "VEFA",
    en: "VEFA (Off-plan)",
    de: "VEFA (Neubau)",
    lb: "VEFA (Neibau)",
    pt: "VEFA (Planta)",
  },
  "home.modules.vefa.description": {
    fr: "Simulation d'achat en VEFA : TVA 3% vs 17%, échelonnement des appels de fonds, comparaison avec l'ancien.",
    en: "Off-plan purchase simulation: VAT 3% vs 17%, fund call scheduling, comparison with existing properties.",
    de: "VEFA-Kaufsimulation: MwSt. 3% vs 17%, Ratenzahlungsplan, Vergleich mit Bestandsimmobilien.",
    lb: "VEFA-Kafsimulatioun: TVA 3% vs 17%, Ratenplang, Vergläich mat bestoenden Immobilien.",
    pt: "Simulação de compra em VEFA: IVA 3% vs 17%, escalonamento de chamadas de fundos, comparação com o existente.",
  },
  "home.modules.vefa.tag": {
    fr: "TVA 3% / 17%",
    en: "VAT 3% / 17%",
    de: "MwSt. 3% / 17%",
    lb: "TVA 3% / 17%",
    pt: "IVA 3% / 17%",
  },

  // Stats
  "home.stats.tests": {
    fr: "Tests automatisés",
    en: "Automated tests",
    de: "Automatisierte Tests",
    lb: "Automatiséiert Tester",
    pt: "Testes automatizados",
  },

  // Trust badges
  "home.trust.heading": {
    fr: "Fondations solides",
    en: "Solid foundations",
    de: "Solide Grundlagen",
    lb: "Solid Grondlagen",
    pt: "Fundações sólidas",
  },
  "home.trust.tegova": {
    fr: "TEGOVA EVS 2025",
    en: "TEGOVA EVS 2025",
    de: "TEGOVA EVS 2025",
    lb: "TEGOVA EVS 2025",
    pt: "TEGOVA EVS 2025",
  },
  "home.trust.tegovaDesc": {
    fr: "Méthodologie conforme",
    en: "Compliant methodology",
    de: "Konforme Methodik",
    lb: "Konform Methodik",
    pt: "Metodologia conforme",
  },
  "home.trust.data": {
    fr: "Données publiques LU",
    en: "LU public data",
    de: "Öffentliche Daten LU",
    lb: "Ëffentlech Donnéeën LU",
    pt: "Dados públicos LU",
  },
  "home.trust.dataDesc": {
    fr: "data.public.lu, STATEC",
    en: "data.public.lu, STATEC",
    de: "data.public.lu, STATEC",
    lb: "data.public.lu, STATEC",
    pt: "data.public.lu, STATEC",
  },
  "home.trust.rgpd": {
    fr: "RGPD conforme",
    en: "GDPR compliant",
    de: "DSGVO-konform",
    lb: "DSGVO-konform",
    pt: "RGPD conforme",
  },
  "home.trust.rgpdDesc": {
    fr: "Export, suppression, consentements",
    en: "Export, deletion, consents",
    de: "Export, Löschung, Einwilligungen",
    lb: "Export, Läschung, Zoustëmmungen",
    pt: "Exportação, supressão, consentimentos",
  },
  "home.trust.tests": {
    fr: "172 tests automatisés",
    en: "172 automated tests",
    de: "172 automatisierte Tests",
    lb: "172 automatiséiert Tester",
    pt: "172 testes automatizados",
  },
  "home.trust.testsDesc": {
    fr: "Qualité de code vérifiée",
    en: "Verified code quality",
    de: "Verifizierte Codequalität",
    lb: "Verifizéiert Codequalitéit",
    pt: "Qualidade de código verificada",
  },

  // Contact update
  "home.contact.tevaxiaTitle": {
    fr: "tevaxia.lu — 30+ outils",
    en: "tevaxia.lu — 30+ tools",
    de: "tevaxia.lu — 30+ Tools",
    lb: "tevaxia.lu — 30+ Tools",
    pt: "tevaxia.lu — 30+ ferramentas",
  },

  // Onboarding — syndic new links
  "onboarding.syndic.linkCopros": {
    fr: "Gestion copropriétés",
    en: "Co-ownership management",
    de: "Wohneigentumsverwaltung",
    lb: "Kopropriétéitsverwaltung",
    pt: "Gestão de condomínios",
  },
  "onboarding.syndic.linkGestion": {
    fr: "Gestion locative LU",
    en: "LU rental management",
    de: "LU Vermietungsverwaltung",
    lb: "LU Lounungsverwaltung",
    pt: "Gestão locativa LU",
  },
  "onboarding.syndic.linkBailCo": {
    fr: "Bail commercial",
    en: "Commercial lease",
    de: "Gewerbemietvertrag",
    lb: "Gewierflech Bail",
    pt: "Arrendamento comercial",
  },

  // Onboarding — hotellerie new links
  "onboarding.hotellerie.linkGroupe": {
    fr: "Portefeuille groupe",
    en: "Group portfolio",
    de: "Gruppen-Portfolio",
    lb: "Gruppen-Portfolio",
    pt: "Portfólio de grupo",
  },
  "onboarding.hotellerie.linkForecast": {
    fr: "Forecast RevPAR",
    en: "RevPAR Forecast",
    de: "RevPAR-Forecast",
    lb: "RevPAR-Forecast",
    pt: "Previsão RevPAR",
  },
  "onboarding.hotellerie.linkRevpar": {
    fr: "Comparaison RevPAR",
    en: "RevPAR Comparison",
    de: "RevPAR-Vergleich",
    lb: "RevPAR-Vergläich",
    pt: "Comparação RevPAR",
  },
  "onboarding.hotellerie.linkReno": {
    fr: "Rénovation hôtelière",
    en: "Hotel renovation",
    de: "Hotelrenovierung",
    lb: "Hotelrenovéierung",
    pt: "Renovação hoteleira",
  },

  // Onboarding — investisseur new links
  "onboarding.investisseur.linkInspection": {
    fr: "Inspection TEGOVA",
    en: "TEGOVA Inspection",
    de: "TEGOVA-Inspektion",
    lb: "TEGOVA-Inspektioun",
    pt: "Inspeção TEGOVA",
  },
  "onboarding.investisseur.linkTransparence": {
    fr: "Transparence fiscale",
    en: "Tax transparency",
    de: "Steuerliche Transparenz",
    lb: "Steierlich Transparenz",
    pt: "Transparência fiscal",
  },
};

/* ---------- run ---------- */
let totalInserted = 0;
for (const lang of LANGS) {
  const filePath = `${MSG_DIR}/${lang}.json`;
  const raw = readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  let inserted = 0;

  for (const [dotPath, translations] of Object.entries(NEW_KEYS)) {
    const val = translations[lang];
    if (val === undefined) continue;
    const existing = deepGet(json, dotPath);
    if (existing !== undefined) {
      // Only overwrite the contact.tevaxiaTitle (18+ → 30+)
      if (dotPath === "home.contact.tevaxiaTitle") {
        deepSet(json, dotPath, val);
        inserted++;
      }
      // skip other existing keys
      continue;
    }
    deepSet(json, dotPath, val);
    inserted++;
  }

  writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf-8");
  console.log(`${lang}: ${inserted} keys injected`);
  totalInserted += inserted;
}

console.log(`\nTotal: ${totalInserted} keys injected across ${LANGS.length} languages`);
