// Inject i18n keys for guide hub + batch 1 guide pages (4 guides)
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

const NEW_KEYS = {
  nav: {
    guide: {
      fr: "Guide immobilier LU",
      en: "LU Real Estate Guide",
      de: "LU Immobilien-Ratgeber",
      lb: "LU Immobilie-Guide",
      pt: "Guia Imobiliário LU",
    },
  },

  guideHub: {
    title: {
      fr: "Guide immobilier Luxembourg",
      en: "Luxembourg Real Estate Guide",
      de: "Immobilien-Ratgeber Luxemburg",
      lb: "Immobilie-Rotgeber Lëtzebuerg",
      pt: "Guia Imobiliário Luxemburgo",
    },
    description: {
      fr: "Réponses claires aux questions fréquentes sur l'immobilier au Luxembourg : frais, fiscalité, aides, baux, copropriété et plus.",
      en: "Clear answers to frequent questions about Luxembourg real estate: fees, taxation, subsidies, leases, co-ownership and more.",
      de: "Klare Antworten auf häufige Fragen zu Luxemburger Immobilien: Gebühren, Besteuerung, Beihilfen, Mietverträge, Miteigentum und mehr.",
      lb: "Kloer Äntwerten op heefeg Froen iwwer Lëtzebuerger Immobilien: Käschten, Steieren, Hëllefen, Baux, Copropriétéit a méi.",
      pt: "Respostas claras às perguntas frequentes sobre imobiliário no Luxemburgo: custos, fiscalidade, ajudas, arrendamentos, condomínio e mais.",
    },
    metaDescription: {
      fr: "Guide pratique de l'immobilier au Luxembourg : frais de notaire, plus-values, loyers, aides, copropriété. Réponses claires et outils de calcul.",
      en: "Practical guide to Luxembourg real estate: notary fees, capital gains, rents, subsidies, co-ownership. Clear answers and calculation tools.",
      de: "Praktischer Ratgeber zu Luxemburger Immobilien: Notargebühren, Kapitalgewinne, Mieten, Beihilfen, Miteigentum. Klare Antworten und Rechner.",
      lb: "Praktesche Guide fir Lëtzebuerger Immobilien: Notairsfraise, Kapitalgewënn, Loyeren, Hëllefen, Copropriétéit. Kloer Äntwerten an Rechner.",
      pt: "Guia prático do imobiliário no Luxemburgo: custos notariais, mais-valias, rendas, ajudas, condomínio. Respostas claras e ferramentas de cálculo.",
    },
    // 12 guide card titles + descriptions
    fraisNotaireTitle: {
      fr: "Frais de notaire au Luxembourg",
      en: "Notary Fees in Luxembourg",
      de: "Notargebühren in Luxemburg",
      lb: "Notairsfraise zu Lëtzebuerg",
      pt: "Custos notariais no Luxemburgo",
    },
    fraisNotaireDesc: {
      fr: "Droits d'enregistrement, transcription, émoluments notaire et frais hypothécaires détaillés.",
      en: "Registration duties, transcription, notary fees and mortgage costs explained in detail.",
      de: "Eintragungsgebühren, Transkription, Notargebühren und Hypothekenkosten im Detail.",
      lb: "Aschreiwungsgebühren, Transkriptioun, Notairsfraise an Hypothéikekosten am Detail.",
      pt: "Direitos de registo, transcrição, emolumentos notariais e custos hipotecários detalhados.",
    },
    regle5PourcentTitle: {
      fr: "Règle des 5 % pour les loyers",
      en: "The 5% Rent Rule",
      de: "Die 5%-Mietregel",
      lb: "D'5%-Loyerregel",
      pt: "Regra dos 5% para rendas",
    },
    regle5PourcentDesc: {
      fr: "Calcul du loyer maximum légal selon le capital investi réévalué et la loi du 21.09.2006.",
      en: "Maximum legal rent calculation based on revalued invested capital under the 21.09.2006 law.",
      de: "Berechnung der gesetzlichen Höchstmiete basierend auf dem aufgewerteten investierten Kapital gemäß Gesetz vom 21.09.2006.",
      lb: "Berechnung vum gesetzleche Maximallayer baséierend op dem opgewäerte investéierte Kapital laut Gesetz vum 21.09.2006.",
      pt: "Cálculo da renda máxima legal segundo o capital investido reavaliado e a lei de 21.09.2006.",
    },
    bellegenAktTitle: {
      fr: "Bëllegen Akt",
      en: "Bëllegen Akt (Reduced Registration)",
      de: "Bëllegen Akt (Ermäßigte Eintragung)",
      lb: "Bëllegen Akt",
      pt: "Bëllegen Akt (Registo Reduzido)",
    },
    bellegenAktDesc: {
      fr: "Crédit d'impôt sur les droits d'enregistrement pour première acquisition de résidence principale.",
      en: "Tax credit on registration duties for first-time primary residence acquisition.",
      de: "Steuergutschrift auf Eintragungsgebühren beim Erstkauf des Hauptwohnsitzes.",
      lb: "Steierkredit op Aschreiwungsgebühren beim Éischtkaf vum Haaptwunnsëtz.",
      pt: "Crédito fiscal sobre direitos de registo na primeira aquisição de residência principal.",
    },
    plusValueTitle: {
      fr: "Plus-value immobilière",
      en: "Real Estate Capital Gains",
      de: "Immobilien-Kapitalgewinne",
      lb: "Immobilien-Kapitalgewënn",
      pt: "Mais-valia imobiliária",
    },
    plusValueDesc: {
      fr: "Régime fiscal de la plus-value de cession : spéculation, taux global, abattements et exonérations.",
      en: "Tax regime for capital gains on disposal: speculation, global rate, allowances and exemptions.",
      de: "Steuerregime für Veräußerungsgewinne: Spekulation, Gesamtsatz, Freibeträge und Befreiungen.",
      lb: "Steierregime fir Veräusserungsgewënner: Spekulatioun, Gesamtsaz, Fräibedrag an Befreiungen.",
      pt: "Regime fiscal da mais-valia de cessão: especulação, taxa global, abatimentos e isenções.",
    },
    bailHabitationTitle: {
      fr: "Bail d'habitation au Luxembourg",
      en: "Residential Lease in Luxembourg",
      de: "Wohnungsmietvertrag in Luxemburg",
      lb: "Wunnengsmietvertrag zu Lëtzebuerg",
      pt: "Arrendamento habitacional no Luxemburgo",
    },
    bailHabitationDesc: {
      fr: "Durée, résiliation, garantie locative, charges et obligations du bailleur et du locataire.",
      en: "Duration, termination, rental deposit, charges and obligations of landlord and tenant.",
      de: "Dauer, Kündigung, Mietkaution, Nebenkosten und Pflichten von Vermieter und Mieter.",
      lb: "Dauer, Kënnegung, Mietkautioun, Nieftekosten a Pflichte vu Vermieter a Locataire.",
      pt: "Duração, rescisão, caução, encargos e obrigações do senhorio e do inquilino.",
    },
    coproTitle: {
      fr: "Copropriété au Luxembourg",
      en: "Co-ownership in Luxembourg",
      de: "Miteigentum in Luxemburg",
      lb: "Copropriétéit zu Lëtzebuerg",
      pt: "Condomínio no Luxemburgo",
    },
    coproDesc: {
      fr: "Règlement de copropriété, assemblées générales, charges communes et fonds de réserve.",
      en: "Co-ownership rules, general meetings, common charges and reserve funds.",
      de: "Miteigentumsordnung, Eigentümerversammlungen, gemeinsame Kosten und Rücklagenfonds.",
      lb: "Copropriétéitsreglement, Generalversammlungen, gemeinsam Käschten a Reservefong.",
      pt: "Regulamento de condomínio, assembleias gerais, encargos comuns e fundo de reserva.",
    },
    klimabonusTitle: {
      fr: "Klimabonus & aides énergie",
      en: "Klimabonus & Energy Subsidies",
      de: "Klimabonus & Energiebeihilfen",
      lb: "Klimabonus & Energiehëllefen",
      pt: "Klimabonus & ajudas energia",
    },
    klimabonusDesc: {
      fr: "PRIMe House, Klimabonus, subventions communales pour la rénovation et le logement durable.",
      en: "PRIMe House, Klimabonus, municipal subsidies for renovation and sustainable housing.",
      de: "PRIMe House, Klimabonus, kommunale Zuschüsse für Renovierung und nachhaltiges Wohnen.",
      lb: "PRIMe House, Klimabonus, kommunal Subventiounen fir Renovatioun an nohaltegt Wunnen.",
      pt: "PRIMe House, Klimabonus, subsídios municipais para renovação e habitação sustentável.",
    },
    estimationTitle: {
      fr: "Estimation d'un bien immobilier",
      en: "Real Estate Valuation",
      de: "Immobilienbewertung",
      lb: "Immobiliebewäertung",
      pt: "Avaliação imobiliária",
    },
    estimationDesc: {
      fr: "Méthodes d'estimation (comparaison, capitalisation, DCF) et critères de valorisation au Luxembourg.",
      en: "Valuation methods (comparison, capitalisation, DCF) and valuation criteria in Luxembourg.",
      de: "Bewertungsmethoden (Vergleich, Kapitalisierung, DCF) und Bewertungskriterien in Luxemburg.",
      lb: "Bewäertungsmethoden (Vergläich, Kapitaliséierung, DCF) a Bewäertungskritären zu Lëtzebuerg.",
      pt: "Métodos de avaliação (comparação, capitalização, DCF) e critérios de valorização no Luxemburgo.",
    },
    achatNonResidentTitle: {
      fr: "Achat immobilier non-résident",
      en: "Non-Resident Property Purchase",
      de: "Immobilienkauf für Nicht-Ansässige",
      lb: "Immobilienkaf fir Net-Awunner",
      pt: "Compra imobiliária não-residente",
    },
    achatNonResidentDesc: {
      fr: "Conditions, financement, fiscalité et particularités pour acheter au Luxembourg en tant que non-résident.",
      en: "Conditions, financing, taxation and specifics for buying in Luxembourg as a non-resident.",
      de: "Bedingungen, Finanzierung, Besteuerung und Besonderheiten beim Kauf als Nicht-Ansässiger.",
      lb: "Konditiounen, Finanzéierung, Steieren a Besonneschten beim Kaf als Net-Awunner.",
      pt: "Condições, financiamento, fiscalidade e particularidades para comprar no Luxemburgo como não-residente.",
    },
    tva3PourcentTitle: {
      fr: "TVA à 3 % sur le logement",
      en: "3% VAT on Housing",
      de: "3% MwSt. auf Wohnraum",
      lb: "3% TVA op Wunnraum",
      pt: "IVA a 3% sobre habitação",
    },
    tva3PourcentDesc: {
      fr: "Application de la TVA super-réduite à 3 % sur la construction et rénovation de logements au Luxembourg.",
      en: "Application of the super-reduced 3% VAT on housing construction and renovation in Luxembourg.",
      de: "Anwendung des super-ermäßigten MwSt.-Satzes von 3% auf Wohnungsbau und Renovierung in Luxemburg.",
      lb: "Uwendung vum super-reduzéierten TVA-Saz vu 3% op Wunnengsbau a Renovatioun zu Lëtzebuerg.",
      pt: "Aplicação do IVA super-reduzido de 3% na construção e renovação de habitação no Luxemburgo.",
    },
    bailCommercialTitle: {
      fr: "Bail commercial au Luxembourg",
      en: "Commercial Lease in Luxembourg",
      de: "Gewerbemietvertrag in Luxemburg",
      lb: "Gewierflech Mietvertrag zu Lëtzebuerg",
      pt: "Arrendamento comercial no Luxemburgo",
    },
    bailCommercialDesc: {
      fr: "Durée, renouvellement, indemnité d'éviction, pas-de-porte et clauses essentielles du bail commercial.",
      en: "Duration, renewal, eviction indemnity, key money and essential clauses of commercial leases.",
      de: "Dauer, Verlängerung, Räumungsentschädigung, Ablöse und wesentliche Klauseln des Gewerbemietvertrags.",
      lb: "Dauer, Verlängerung, Räumungsentschädigung, Ablöse a wesentlech Klauselen vum Gewierflech Mietvertrag.",
      pt: "Duração, renovação, indemnização de despejo, luvas e cláusulas essenciais do arrendamento comercial.",
    },
    investirHotelTitle: {
      fr: "Investir dans un hôtel au Luxembourg",
      en: "Investing in a Hotel in Luxembourg",
      de: "In ein Hotel in Luxemburg investieren",
      lb: "An en Hotel zu Lëtzebuerg investéieren",
      pt: "Investir num hotel no Luxemburgo",
    },
    investirHotelDesc: {
      fr: "Rendement hôtelier, fiscalité, financement, RevPAR et spécificités du marché luxembourgeois.",
      en: "Hotel yield, taxation, financing, RevPAR and Luxembourg market specifics.",
      de: "Hotelrendite, Besteuerung, Finanzierung, RevPAR und Besonderheiten des luxemburgischen Marktes.",
      lb: "Hotelrendement, Steieren, Finanzéierung, RevPAR a Besonneschten vum Lëtzebuerger Marché.",
      pt: "Rendimento hoteleiro, fiscalidade, financiamento, RevPAR e especificidades do mercado luxemburguês.",
    },
  },

  // === Guide: Frais de notaire ===
  "guide.fraisNotaire": {
    title: {
      fr: "Combien coûtent les frais de notaire au Luxembourg ?",
      en: "How Much Are Notary Fees in Luxembourg?",
      de: "Wie hoch sind die Notargebühren in Luxemburg?",
      lb: "Wéi héich sinn d'Notairsfraise zu Lëtzebuerg?",
      pt: "Quanto custam os custos notariais no Luxemburgo?",
    },
    metaDescription: {
      fr: "Détail des frais de notaire au Luxembourg : droits d'enregistrement (7 % ou 6 %), transcription 1 %, émoluments notaire, frais hypothécaires. Calcul complet.",
      en: "Breakdown of notary fees in Luxembourg: registration duties (7% or 6%), transcription 1%, notary emoluments, mortgage costs. Full calculation.",
      de: "Aufschlüsselung der Notargebühren in Luxemburg: Eintragungsgebühren (7% oder 6%), Transkription 1%, Notargebühren, Hypothekenkosten. Vollständige Berechnung.",
      lb: "Opschlësselung vun den Notairsfraise zu Lëtzebuerg: Aschreiwungsgebühren (7% oder 6%), Transkriptioun 1%, Notairsgebühren, Hypothéikekosten. Komplett Berechnung.",
      pt: "Detalhe dos custos notariais no Luxemburgo: direitos de registo (7% ou 6%), transcrição 1%, emolumentos notariais, custos hipotecários. Cálculo completo.",
    },
    intro: {
      fr: "Les frais de notaire au Luxembourg représentent environ 7 à 10 % du prix d'achat d'un bien ancien et 3 à 4 % pour un bien neuf (VEFA). Ils se composent des droits d'enregistrement, des droits de transcription, des émoluments du notaire et des frais hypothécaires. Voici le détail de chaque composante pour estimer précisément votre budget.",
      en: "Notary fees in Luxembourg represent approximately 7 to 10% of the purchase price for an existing property and 3 to 4% for a new-build (VEFA). They consist of registration duties, transcription duties, notary emoluments and mortgage costs. Here is a breakdown of each component to accurately estimate your budget.",
      de: "Die Notargebühren in Luxemburg betragen ca. 7 bis 10 % des Kaufpreises bei einer Bestandsimmobilie und 3 bis 4 % bei einem Neubau (VEFA). Sie setzen sich zusammen aus Eintragungsgebühren, Transkriptionsgebühren, Notargebühren und Hypothekenkosten. Hier die Aufschlüsselung jeder Komponente zur genauen Budgetplanung.",
      lb: "D'Notairsfraise zu Lëtzebuerg maachen ongeféier 7 bis 10 % vum Kafpräis bei enger bestoender Immobilie aus an 3 bis 4 % bei engem Neibau (VEFA). Si bestinn aus Aschreiwungsgebühren, Transkriptiounsgebühren, Notairsgebühren an Hypothéikekosten. Hei d'Opschlësselung vun all Komponent fir Äre Budget genau ze plangen.",
      pt: "Os custos notariais no Luxemburgo representam cerca de 7 a 10% do preço de compra de um imóvel antigo e 3 a 4% para um imóvel novo (VEFA). Compõem-se dos direitos de registo, direitos de transcrição, emolumentos notariais e custos hipotecários. Eis o detalhe de cada componente para estimar com precisão o seu orçamento.",
    },
    section1Title: {
      fr: "Droits d'enregistrement et de transcription",
      en: "Registration and Transcription Duties",
      de: "Eintragungsgebühren und Transkriptionsgebühren",
      lb: "Aschreiwungs- an Transkriptiounsgebühren",
      pt: "Direitos de registo e transcrição",
    },
    section1Content: {
      fr: "Les droits d'enregistrement s'élèvent à 7 % du prix de vente pour un bien ancien (loi modifiée du 22 frimaire an VII). Depuis 2023, un taux réduit de 6 % s'applique sous certaines conditions (bien destiné à la résidence principale, prix inférieur à un seuil). Les droits de transcription sont fixés à 1 % du prix de vente. Pour un bien neuf en VEFA, les droits ne s'appliquent que sur la part terrain, la construction étant soumise à la TVA (3 % taux super-réduit pour le logement, plafonné à 50 000 €).",
      en: "Registration duties amount to 7% of the sale price for an existing property (modified law of 22 Frimaire Year VII). Since 2023, a reduced rate of 6% applies under certain conditions (property intended as primary residence, price below a threshold). Transcription duties are fixed at 1% of the sale price. For a new-build (VEFA), duties apply only to the land portion, while construction is subject to VAT (3% super-reduced rate for housing, capped at €50,000).",
      de: "Die Eintragungsgebühren betragen 7 % des Verkaufspreises bei einer Bestandsimmobilie (geändertes Gesetz vom 22. Frimaire Jahr VII). Seit 2023 gilt unter bestimmten Bedingungen ein ermäßigter Satz von 6 % (Immobilie als Hauptwohnsitz, Preis unter einem Schwellenwert). Die Transkriptionsgebühren sind auf 1 % des Verkaufspreises festgelegt. Bei einem Neubau (VEFA) gelten die Gebühren nur für den Grundstücksanteil; der Bau unterliegt der MwSt. (3 % super-ermäßigter Satz für Wohnraum, gedeckelt auf 50.000 €).",
      lb: "D'Aschreiwungsgebühren betroe 7 % vum Verkafspräis bei enger bestoender Immobilie (geännert Gesetz vum 22. Frimaire Joer VII). Zënter 2023 gëllt ënnert bestëmmte Konditiounen en reduzéierten Taux vu 6 % (Immobilie als Haaptwunnsëtz, Präis ënnert engem Schwellenwäert). D'Transkriptiounsgebühren si fixéiert op 1 % vum Verkafspräis. Bei engem Neibau (VEFA) gëllen d'Gebühren nëmmen op den Terrain-Undeel; de Bau ënnerläit der TVA (3 % super-reduzéierten Taux fir Wunnraum, gedeckelt op 50.000 €).",
      pt: "Os direitos de registo ascendem a 7% do preço de venda para um imóvel antigo (lei modificada de 22 Frimário Ano VII). Desde 2023, aplica-se uma taxa reduzida de 6% sob certas condições (imóvel destinado a residência principal, preço abaixo de um limiar). Os direitos de transcrição são fixados em 1% do preço de venda. Para um imóvel novo (VEFA), os direitos aplicam-se apenas à parte do terreno, estando a construção sujeita a IVA (3% taxa super-reduzida para habitação, limitada a 50.000 €).",
    },
    section2Title: {
      fr: "Émoluments du notaire",
      en: "Notary Emoluments",
      de: "Notargebühren",
      lb: "Notairsgebühren",
      pt: "Emolumentos notariais",
    },
    section2Content: {
      fr: "Les émoluments du notaire sont réglementés par le règlement grand-ducal du 26 novembre 2015. Ils suivent un barème proportionnel et dégressif : 1,650 % jusqu'à 7 500 €, 1,100 % de 7 500 à 15 000 €, 0,825 % de 15 000 à 30 000 €, puis 0,550 % au-delà. Pour un bien à 750 000 €, les émoluments s'élèvent à environ 5 700 €. S'y ajoutent des frais de formalités (recherches hypothécaires, extraits cadastraux, certificats) qui représentent généralement 1 000 à 2 000 € supplémentaires.",
      en: "Notary emoluments are regulated by the Grand Ducal Regulation of 26 November 2015. They follow a proportional and degressive scale: 1.650% up to €7,500, 1.100% from €7,500 to €15,000, 0.825% from €15,000 to €30,000, then 0.550% above. For a property at €750,000, emoluments amount to approximately €5,700. Additional formalities costs (mortgage searches, cadastral extracts, certificates) typically add €1,000 to €2,000.",
      de: "Die Notargebühren sind durch die Großherzogliche Verordnung vom 26. November 2015 geregelt. Sie folgen einem proportionalen und degressiven Tarif: 1,650 % bis 7.500 €, 1,100 % von 7.500 bis 15.000 €, 0,825 % von 15.000 bis 30.000 €, dann 0,550 % darüber. Bei einer Immobilie von 750.000 € betragen die Gebühren ca. 5.700 €. Hinzu kommen Formalitätskosten (Hypothekenrecherchen, Katasterauszüge, Bescheinigungen) von typischerweise 1.000 bis 2.000 €.",
      lb: "D'Notairsgebühren sinn duerch de Groussherzoglecht Reglement vum 26. November 2015 gereegelt. Si follegen engem proportionalen an degressiven Tarif: 1,650 % bis 7.500 €, 1,100 % vu 7.500 bis 15.000 €, 0,825 % vu 15.000 bis 30.000 €, dunn 0,550 % doriwwer. Bei enger Immobilie vu 750.000 € betroe d'Gebühren ongeféier 5.700 €. Dozou kommen Formalitéitskosten (Hypothéikerecherchen, Katasterauswéiser, Bescheinegungen) vu typesch 1.000 bis 2.000 €.",
      pt: "Os emolumentos notariais são regulados pelo Regulamento Grão-Ducal de 26 de novembro de 2015. Seguem uma tabela proporcional e degressiva: 1,650% até 7.500 €, 1,100% de 7.500 a 15.000 €, 0,825% de 15.000 a 30.000 €, depois 0,550% acima. Para um imóvel de 750.000 €, os emolumentos ascendem a cerca de 5.700 €. Acrescem custos de formalidades (pesquisas hipotecárias, extratos cadastrais, certidões) que representam geralmente 1.000 a 2.000 € adicionais.",
    },
    section3Title: {
      fr: "Frais hypothécaires",
      en: "Mortgage Costs",
      de: "Hypothekenkosten",
      lb: "Hypothéikekosten",
      pt: "Custos hipotecários",
    },
    section3Content: {
      fr: "Si vous financez l'achat par un emprunt, l'inscription hypothécaire génère des frais supplémentaires : droit d'hypothèque de 0,5 % du montant emprunté, émoluments du notaire pour l'acte hypothécaire (même barème dégressif), et taxe de publicité foncière. Pour un emprunt de 600 000 €, comptez environ 5 500 à 6 500 € de frais hypothécaires. Au total, un acquéreur finançant 80 % d'un bien à 750 000 € doit prévoir environ 65 000 à 75 000 € de frais d'acquisition.",
      en: "If you finance the purchase with a mortgage, the mortgage registration generates additional costs: 0.5% mortgage duty on the borrowed amount, notary emoluments for the mortgage deed (same degressive scale), and land registry tax. For a €600,000 loan, expect approximately €5,500 to €6,500 in mortgage costs. In total, a buyer financing 80% of a €750,000 property should budget approximately €65,000 to €75,000 in acquisition costs.",
      de: "Wenn Sie den Kauf per Kredit finanzieren, fallen zusätzliche Kosten für die Hypothekeneintragung an: 0,5 % Hypothekengebühr auf den geliehenen Betrag, Notargebühren für die Hypothekenurkunde (gleicher degressiver Tarif) und Grundbuchsteuer. Bei einem Darlehen von 600.000 € rechnen Sie mit ca. 5.500 bis 6.500 € Hypothekenkosten. Insgesamt sollte ein Käufer, der 80 % einer Immobilie von 750.000 € finanziert, ca. 65.000 bis 75.000 € an Erwerbskosten einplanen.",
      lb: "Wann Dir den Akaf mat engem Prêt finanzéiert, entstinn zousätzlech Käschte fir d'Hypothéikenaschreiwung: 0,5 % Hypothéikegebühr op de geléinten Betrag, Notairsgebühren fir den Hypothéikeakt (selwechten degressiven Tarif) an Grondbuuchsteier. Bei engem Prêt vu 600.000 € rechent mat ongeféier 5.500 bis 6.500 € un Hypothéikekosten. Am Ganzen sollt en Keefer, deen 80 % vun enger Immobilie vu 750.000 € finanzéiert, ongeféier 65.000 bis 75.000 € u Käschten aplanzen.",
      pt: "Se financia a compra com um empréstimo, a inscrição hipotecária gera custos adicionais: 0,5% de direito de hipoteca sobre o montante emprestado, emolumentos notariais para a escritura hipotecária (mesma tabela degressiva) e imposto de publicidade fundiária. Para um empréstimo de 600.000 €, preveja aproximadamente 5.500 a 6.500 € de custos hipotecários. No total, um comprador que financie 80% de um imóvel de 750.000 € deve prever cerca de 65.000 a 75.000 € de custos de aquisição.",
    },
    relatedToolLabel: {
      fr: "Calculer vos frais d'acquisition",
      en: "Calculate your acquisition costs",
      de: "Berechnen Sie Ihre Erwerbskosten",
      lb: "Berechent Är Erwerbskosten",
      pt: "Calcule os seus custos de aquisição",
    },
    relatedToolLink: {
      fr: "/frais-acquisition",
      en: "/frais-acquisition",
      de: "/frais-acquisition",
      lb: "/frais-acquisition",
      pt: "/frais-acquisition",
    },
    faq1Q: {
      fr: "Combien de frais de notaire pour un appartement à 500 000 € au Luxembourg ?",
      en: "How much are notary fees for a €500,000 apartment in Luxembourg?",
      de: "Wie hoch sind die Notargebühren für eine Wohnung zu 500.000 € in Luxemburg?",
      lb: "Wéi héich sinn d'Notairsfraise fir en Appartement vu 500.000 € zu Lëtzebuerg?",
      pt: "Quanto custam os custos notariais para um apartamento de 500.000 € no Luxemburgo?",
    },
    faq1A: {
      fr: "Pour un appartement ancien à 500 000 €, comptez environ 44 000 à 50 000 € de frais totaux (droits d'enregistrement 7 % + transcription 1 % + émoluments notaire + frais hypothécaires si emprunt).",
      en: "For an existing apartment at €500,000, expect approximately €44,000 to €50,000 in total fees (7% registration duties + 1% transcription + notary emoluments + mortgage costs if financing).",
      de: "Für eine Bestandswohnung zu 500.000 € rechnen Sie mit ca. 44.000 bis 50.000 € Gesamtkosten (7 % Eintragungsgebühren + 1 % Transkription + Notargebühren + Hypothekenkosten bei Finanzierung).",
      lb: "Fir en Bestandappartement vu 500.000 € rechent mat ongeféier 44.000 bis 50.000 € Gesamtkäschten (7 % Aschreiwungsgebühren + 1 % Transkriptioun + Notairsgebühren + Hypothéikekosten bei Finanzéierung).",
      pt: "Para um apartamento antigo de 500.000 €, preveja aproximadamente 44.000 a 50.000 € de custos totais (7% direitos de registo + 1% transcrição + emolumentos notariais + custos hipotecários se financiado).",
    },
    faq2Q: {
      fr: "Les frais de notaire sont-ils réduits pour un bien neuf au Luxembourg ?",
      en: "Are notary fees reduced for new-build properties in Luxembourg?",
      de: "Sind die Notargebühren bei Neubauten in Luxemburg reduziert?",
      lb: "Sinn d'Notairsfraise fir Neibaute zu Lëtzebuerg reduzéiert?",
      pt: "Os custos notariais são reduzidos para imóveis novos no Luxemburgo?",
    },
    faq2A: {
      fr: "Oui, pour un bien neuf (VEFA), les droits d'enregistrement et de transcription ne s'appliquent que sur la part terrain. La construction est soumise à la TVA à 3 % (taux super-réduit), ce qui réduit significativement les frais totaux à environ 3 à 4 % du prix.",
      en: "Yes, for a new-build (VEFA), registration and transcription duties apply only to the land portion. Construction is subject to 3% VAT (super-reduced rate), which significantly reduces total costs to approximately 3 to 4% of the price.",
      de: "Ja, bei einem Neubau (VEFA) gelten die Eintragungsgebühren und Transkriptionsgebühren nur für den Grundstücksanteil. Der Bau unterliegt der MwSt. von 3 % (super-ermäßigter Satz), was die Gesamtkosten auf ca. 3 bis 4 % des Preises reduziert.",
      lb: "Jo, bei engem Neibau (VEFA) gëllen d'Aschreiwungsgebühren an d'Transkriptiounsgebühren nëmmen op den Terrain-Undeel. De Bau ënnerläit der TVA vu 3 % (super-reduzéierten Taux), wat d'Gesamtkäschten op ongeféier 3 bis 4 % vum Präis reduzéiert.",
      pt: "Sim, para um imóvel novo (VEFA), os direitos de registo e transcrição aplicam-se apenas à parte do terreno. A construção está sujeita a IVA de 3% (taxa super-reduzida), o que reduz significativamente os custos totais para cerca de 3 a 4% do preço.",
    },
  },

  // === Guide: Règle des 5 % ===
  "guide.regle5Pourcent": {
    title: {
      fr: "Comment fonctionne la règle des 5 % pour les loyers au Luxembourg ?",
      en: "How Does the 5% Rent Rule Work in Luxembourg?",
      de: "Wie funktioniert die 5%-Mietregel in Luxemburg?",
      lb: "Wéi funktionéiert d'5%-Loyerregel zu Lëtzebuerg?",
      pt: "Como funciona a regra dos 5% para rendas no Luxemburgo?",
    },
    metaDescription: {
      fr: "La règle des 5 % au Luxembourg limite le loyer annuel à 5 % du capital investi réévalué. Explications, calcul et coefficients STATEC.",
      en: "The 5% rule in Luxembourg limits annual rent to 5% of revalued invested capital. Explanations, calculation and STATEC coefficients.",
      de: "Die 5%-Regel in Luxemburg begrenzt die Jahresmiete auf 5% des aufgewerteten investierten Kapitals. Erklärungen, Berechnung und STATEC-Koeffizienten.",
      lb: "D'5%-Regel zu Lëtzebuerg begrenzt de Joresloyer op 5% vum opgewäerte investéierte Kapital. Erkläerungen, Berechnung an STATEC-Koeffizienten.",
      pt: "A regra dos 5% no Luxemburgo limita a renda anual a 5% do capital investido reavaliado. Explicações, cálculo e coeficientes STATEC.",
    },
    intro: {
      fr: "Au Luxembourg, le loyer annuel maximal d'un logement ne peut pas dépasser 5 % du capital investi réévalué par le bailleur. Cette règle, fixée par l'article 3 de la loi modifiée du 21 septembre 2006 sur le bail à usage d'habitation, protège le locataire contre les loyers excessifs tout en garantissant au propriétaire un rendement raisonnable sur son investissement.",
      en: "In Luxembourg, the maximum annual rent for a dwelling cannot exceed 5% of the revalued capital invested by the landlord. This rule, established by Article 3 of the modified law of 21 September 2006 on residential leases, protects tenants against excessive rents while guaranteeing the owner a reasonable return on investment.",
      de: "In Luxemburg darf die maximale Jahresmiete einer Wohnung 5 % des vom Vermieter aufgewerteten investierten Kapitals nicht überschreiten. Diese Regel, festgelegt durch Artikel 3 des geänderten Gesetzes vom 21. September 2006 über Wohnungsmietverträge, schützt den Mieter vor überhöhten Mieten und garantiert dem Eigentümer eine angemessene Rendite.",
      lb: "Zu Lëtzebuerg däerf de maximale Joresloyer vun enger Wunneng net méi wéi 5 % vum opgewäerte investéierte Kapital vum Bailleur iwwerschreiden. Dës Regel, festgeluecht duerch den Artikel 3 vum geännerte Gesetz vum 21. September 2006 iwwer de Bail à usage d'habitation, schützt de Locataire géint iwwerhéich Loyeren a garantéiert dem Proprietaire eng raisonabel Rendit.",
      pt: "No Luxemburgo, a renda anual máxima de uma habitação não pode exceder 5% do capital investido reavaliado pelo senhorio. Esta regra, fixada pelo artigo 3.o da lei modificada de 21 de setembro de 2006 sobre o arrendamento habitacional, protege o inquilino contra rendas excessivas, garantindo ao proprietário um retorno razoável sobre o seu investimento.",
    },
    section1Title: {
      fr: "Le capital investi et sa réévaluation",
      en: "Invested Capital and Its Revaluation",
      de: "Das investierte Kapital und seine Aufwertung",
      lb: "Dat investéiert Kapital an seng Opwäertung",
      pt: "O capital investido e a sua reavaliação",
    },
    section1Content: {
      fr: "Le capital investi comprend le prix d'acquisition du terrain et de la construction, les frais d'acte, les dépenses de transformation et d'amélioration (à l'exclusion de l'entretien courant). Ce montant est réévalué à la date de fixation du loyer au moyen des coefficients de réévaluation publiés par le STATEC, qui reflètent l'évolution du coût de la construction. Par exemple, un bien acheté 300 000 € en 2005 avec un coefficient de réévaluation de 1,45 donne un capital réévalué de 435 000 €.",
      en: "Invested capital includes the purchase price of land and construction, deed costs, transformation and improvement expenses (excluding routine maintenance). This amount is revalued at the date of rent determination using revaluation coefficients published by STATEC, which reflect changes in construction costs. For example, a property purchased for €300,000 in 2005 with a revaluation coefficient of 1.45 gives a revalued capital of €435,000.",
      de: "Das investierte Kapital umfasst den Kaufpreis von Grundstück und Gebäude, Urkundenkosten, Umbau- und Verbesserungsausgaben (ohne laufende Instandhaltung). Dieser Betrag wird zum Zeitpunkt der Mietfestsetzung anhand der vom STATEC veröffentlichten Aufwertungskoeffizienten aufgewertet, die die Entwicklung der Baukosten widerspiegeln. Beispiel: Eine 2005 für 300.000 € gekaufte Immobilie mit einem Koeffizienten von 1,45 ergibt ein aufgewertetes Kapital von 435.000 €.",
      lb: "Dat investéiert Kapital ëmfaasst de Kafpräis vum Terrain an der Konstruktioun, Aktekosten, Ëmbau- an Verbesserungsausgaben (ouni üblech Ënnerhalt). Dëse Betrag gëtt zum Zäitpunkt vun der Loyerfestleeung mat de vum STATEC publizéierten Opwäertungskoeffizienten opgewäert, déi d'Entwécklung vun de Baukäschten reflektéieren. Beispill: Eng 2005 fir 300.000 € kaf Immobilie mat engem Koeffizient vu 1,45 ergëtt en opgewäert Kapital vu 435.000 €.",
      pt: "O capital investido inclui o preço de aquisição do terreno e da construção, custos de escritura, despesas de transformação e melhoria (excluindo manutenção corrente). Este montante é reavaliado na data de fixação da renda através dos coeficientes de reavaliação publicados pelo STATEC, que refletem a evolução do custo de construção. Exemplo: um imóvel comprado por 300.000 € em 2005 com coeficiente de 1,45 dá um capital reavaliado de 435.000 €.",
    },
    section2Title: {
      fr: "Calcul du loyer maximum",
      en: "Maximum Rent Calculation",
      de: "Berechnung der Höchstmiete",
      lb: "Berechnung vum Maximallayer",
      pt: "Cálculo da renda máxima",
    },
    section2Content: {
      fr: "Le loyer annuel maximum est strictement plafonné à 5 % du capital investi réévalué (art. 3 loi 21.09.2006). Formule : loyer annuel max = capital investi réévalué × 5 %. Pour notre exemple (capital réévalué de 435 000 €), le loyer annuel maximum est de 21 750 €, soit 1 812,50 € par mois. Les charges locatives (eau, chauffage, entretien des communs) ne sont pas incluses dans ce plafond et doivent être facturées séparément sur base de frais réels. Si le locataire estime que son loyer dépasse ce seuil, il peut saisir la Commission des loyers de sa commune.",
      en: "The maximum annual rent is strictly capped at 5% of the revalued invested capital (Art. 3 law of 21.09.2006). Formula: max annual rent = revalued invested capital × 5%. For our example (revalued capital of €435,000), the maximum annual rent is €21,750, or €1,812.50 per month. Service charges (water, heating, common area maintenance) are not included in this cap and must be billed separately based on actual costs. If a tenant believes their rent exceeds this threshold, they can refer the matter to their municipal Rent Commission.",
      de: "Die maximale Jahresmiete ist strikt auf 5 % des aufgewerteten investierten Kapitals begrenzt (Art. 3 Gesetz vom 21.09.2006). Formel: max. Jahresmiete = aufgewertetes investiertes Kapital × 5 %. In unserem Beispiel (aufgewertetes Kapital von 435.000 €) beträgt die maximale Jahresmiete 21.750 €, also 1.812,50 € pro Monat. Nebenkosten (Wasser, Heizung, Gemeinschaftspflege) sind nicht in dieser Obergrenze enthalten und müssen separat nach tatsächlichen Kosten abgerechnet werden. Mieter können bei Überschreitung die kommunale Mietkommission anrufen.",
      lb: "De maximale Joresloyer ass strikt op 5 % vum opgewäerte investéierte Kapital begrenzt (Art. 3 Gesetz vum 21.09.2006). Formel: max. Joresloyer = opgewäert investéiert Kapital × 5 %. An eisem Beispill (opgewäert Kapital vu 435.000 €) ass de maximale Joresloyer 21.750 €, also 1.812,50 € pro Mount. Nieftekosten (Waasser, Heizung, Gemeinschaftspfleg) sinn net an dëser Obergrenz abegraff a mussen separat no tatsächleche Käschte berechnot ginn. Locatairen kënnen bei Iwwerschreidung d'Gemeng-Loyerkommissioun uruffen.",
      pt: "A renda anual máxima é estritamente limitada a 5% do capital investido reavaliado (art. 3.o lei de 21.09.2006). Fórmula: renda anual máx. = capital investido reavaliado × 5%. No nosso exemplo (capital reavaliado de 435.000 €), a renda anual máxima é de 21.750 €, ou 1.812,50 € por mês. Os encargos locativos (água, aquecimento, manutenção das partes comuns) não estão incluídos neste limite e devem ser faturados separadamente com base nos custos reais. Se o inquilino considerar que a sua renda excede este limiar, pode recorrer à Comissão de Rendas do seu município.",
    },
    section3Title: {
      fr: "Cas particuliers et recours",
      en: "Special Cases and Remedies",
      de: "Sonderfälle und Rechtsmittel",
      lb: "Speziell Fäll a Recoursen",
      pt: "Casos particulares e recursos",
    },
    section3Content: {
      fr: "Certains logements échappent à la règle des 5 % : les logements meublés (un supplément peut être appliqué), les logements de fonction, et les baux conclus avant l'entrée en vigueur de la loi. Pour les baux en cours, le bailleur ne peut augmenter le loyer que si le capital investi a été augmenté par des travaux d'amélioration. La réforme en discussion (projet de loi 8184) prévoit de ramener le plafond de 5 % à 3,5 % pour les nouveaux baux à partir de 2026, afin de mieux protéger les locataires face à la hausse des prix immobiliers.",
      en: "Some dwellings are exempt from the 5% rule: furnished accommodation (a supplement may apply), company housing, and leases concluded before the law came into force. For ongoing leases, the landlord can only increase rent if invested capital has been increased by improvement works. The reform under discussion (bill 8184) plans to reduce the cap from 5% to 3.5% for new leases from 2026, to better protect tenants against rising property prices.",
      de: "Bestimmte Wohnungen sind von der 5%-Regel ausgenommen: möblierte Wohnungen (ein Aufschlag kann erhoben werden), Dienstwohnungen und Mietverträge, die vor Inkrafttreten des Gesetzes geschlossen wurden. Bei laufenden Mietverträgen kann der Vermieter die Miete nur erhöhen, wenn das investierte Kapital durch Verbesserungsarbeiten erhöht wurde. Die diskutierte Reform (Gesetzentwurf 8184) sieht vor, die Obergrenze ab 2026 für neue Mietverträge von 5 % auf 3,5 % zu senken.",
      lb: "Bestëmmt Wunnengen sinn vun der 5%-Regel ausgenomm: möbléiert Wunnengen (en Zouschlag ka gefrot ginn), Déngschtlogementer a Baux, déi virun dem Akraaftrieden vum Gesetz ofgeschloss goufen. Bei lafende Baux kann de Bailleur de Loyer nëmmen erhéijen, wann dat investéiert Kapital duerch Verbesserungsaarbechten erhéicht gouf. D'Reform an der Diskussioun (Projet de loi 8184) gesäit vir, d'Obergrenz ab 2026 fir nei Baux vun 5 % op 3,5 % ze senken.",
      pt: "Algumas habitações estão isentas da regra dos 5%: habitações mobiladas (pode ser aplicado um suplemento), habitações de função e contratos celebrados antes da entrada em vigor da lei. Para contratos em curso, o senhorio só pode aumentar a renda se o capital investido foi aumentado por obras de melhoria. A reforma em discussão (projeto de lei 8184) prevê reduzir o limite de 5% para 3,5% para novos contratos a partir de 2026, para melhor proteger os inquilinos face à subida dos preços imobiliários.",
    },
    relatedToolLabel: {
      fr: "Calculer le loyer maximum légal",
      en: "Calculate the legal maximum rent",
      de: "Gesetzliche Höchstmiete berechnen",
      lb: "Gesetzlech Maximallayer berechnen",
      pt: "Calcular a renda máxima legal",
    },
    relatedToolLink: {
      fr: "/calculateur-loyer",
      en: "/calculateur-loyer",
      de: "/calculateur-loyer",
      lb: "/calculateur-loyer",
      pt: "/calculateur-loyer",
    },
    faq1Q: {
      fr: "Comment calculer le loyer maximum au Luxembourg ?",
      en: "How to calculate the maximum rent in Luxembourg?",
      de: "Wie berechnet man die Höchstmiete in Luxemburg?",
      lb: "Wéi berechent een de Maximallayer zu Lëtzebuerg?",
      pt: "Como calcular a renda máxima no Luxemburgo?",
    },
    faq1A: {
      fr: "Multipliez le capital investi réévalué (prix d'achat + travaux, réévalué par les coefficients STATEC) par 5 %. Divisez par 12 pour obtenir le loyer mensuel maximum.",
      en: "Multiply the revalued invested capital (purchase price + works, revalued by STATEC coefficients) by 5%. Divide by 12 to get the maximum monthly rent.",
      de: "Multiplizieren Sie das aufgewertete investierte Kapital (Kaufpreis + Arbeiten, aufgewertet mit STATEC-Koeffizienten) mit 5 %. Teilen Sie durch 12 für die maximale Monatsmiete.",
      lb: "Multiplikéiert dat opgewäert investéiert Kapital (Kafpräis + Aarbechten, opgewäert mat STATEC-Koeffizienten) mat 5 %. Deelt duerch 12 fir de maximale Mountsloyer.",
      pt: "Multiplique o capital investido reavaliado (preço de compra + obras, reavaliado pelos coeficientes STATEC) por 5%. Divida por 12 para obter a renda mensal máxima.",
    },
    faq2Q: {
      fr: "La règle des 5 % va-t-elle changer au Luxembourg ?",
      en: "Will the 5% rule change in Luxembourg?",
      de: "Wird die 5%-Regel in Luxemburg geändert?",
      lb: "Ännert sech d'5%-Regel zu Lëtzebuerg?",
      pt: "A regra dos 5% vai mudar no Luxemburgo?",
    },
    faq2A: {
      fr: "Le projet de loi 8184 prévoit de réduire le plafond de 5 % à 3,5 % pour les nouveaux baux. Cette réforme est en discussion parlementaire et pourrait entrer en vigueur en 2026.",
      en: "Bill 8184 plans to reduce the cap from 5% to 3.5% for new leases. This reform is under parliamentary discussion and could take effect in 2026.",
      de: "Der Gesetzentwurf 8184 sieht vor, die Obergrenze von 5 % auf 3,5 % für neue Mietverträge zu senken. Diese Reform wird im Parlament diskutiert und könnte 2026 in Kraft treten.",
      lb: "De Projet de loi 8184 gesäit vir, d'Obergrenz vun 5 % op 3,5 % fir nei Baux ze senken. Dës Reform gëtt am Parlament diskutéiert a kéint 2026 a Kraaft trieden.",
      pt: "O projeto de lei 8184 prevê reduzir o limite de 5% para 3,5% para novos contratos. Esta reforma está em discussão parlamentar e poderá entrar em vigor em 2026.",
    },
  },

  // === Guide: Bëllegen Akt ===
  "guide.bellegenAkt": {
    title: {
      fr: "Qu'est-ce que le Bëllegen Akt et comment en bénéficier ?",
      en: "What Is the Bëllegen Akt and How to Benefit From It?",
      de: "Was ist der Bëllegen Akt und wie profitiert man davon?",
      lb: "Wat ass de Bëllegen Akt a wéi profitéiert een dovun?",
      pt: "O que é o Bëllegen Akt e como beneficiar?",
    },
    metaDescription: {
      fr: "Le Bëllegen Akt est un crédit d'impôt de 20 000 € (40 000 € en couple) sur les droits d'enregistrement pour l'achat d'une résidence principale au Luxembourg.",
      en: "The Bëllegen Akt is a €20,000 tax credit (€40,000 for couples) on registration duties for purchasing a primary residence in Luxembourg.",
      de: "Der Bëllegen Akt ist eine Steuergutschrift von 20.000 € (40.000 € für Paare) auf die Eintragungsgebühren beim Kauf eines Hauptwohnsitzes in Luxemburg.",
      lb: "De Bëllegen Akt ass e Steierkredit vu 20.000 € (40.000 € fir Koppelen) op d'Aschreiwungsgebühren beim Kaf vum Haaptwunnsëtz zu Lëtzebuerg.",
      pt: "O Bëllegen Akt é um crédito fiscal de 20.000 € (40.000 € para casais) sobre os direitos de registo na compra de residência principal no Luxemburgo.",
    },
    intro: {
      fr: "Le Bëllegen Akt (littéralement « acte à bon marché ») est un crédit d'impôt accordé sur les droits d'enregistrement lors de l'acquisition d'un bien immobilier destiné à servir de résidence principale au Luxembourg. Chaque acquéreur peut bénéficier d'un crédit allant jusqu'à 20 000 € (soit 40 000 € pour un couple acquérant ensemble), ce qui réduit significativement le coût des frais de notaire. Ce dispositif est prévu par l'article 7 de la loi modifiée du 22 frimaire an VII et le règlement grand-ducal du 18 décembre 2020.",
      en: "The Bëllegen Akt (literally 'affordable deed') is a tax credit granted on registration duties when purchasing a property intended as a primary residence in Luxembourg. Each buyer can benefit from a credit of up to €20,000 (i.e., €40,000 for a couple purchasing together), which significantly reduces notary costs. This mechanism is provided by Article 7 of the modified law of 22 Frimaire Year VII and the Grand Ducal Regulation of 18 December 2020.",
      de: "Der Bëllegen Akt (wörtlich 'günstiger Akt') ist eine Steuergutschrift auf die Eintragungsgebühren beim Erwerb einer Immobilie, die als Hauptwohnsitz in Luxemburg dienen soll. Jeder Käufer kann eine Gutschrift von bis zu 20.000 € erhalten (also 40.000 € für ein gemeinsam kaufendes Paar), was die Notarkosten erheblich reduziert. Diese Regelung basiert auf Artikel 7 des geänderten Gesetzes vom 22. Frimaire Jahr VII und der Großherzoglichen Verordnung vom 18. Dezember 2020.",
      lb: "De Bëllegen Akt (wuertwiertlech 'bëllegen Akt') ass e Steierkredit op d'Aschreiwungsgebühren beim Kaf vun enger Immobilie, déi als Haaptwunnsëtz zu Lëtzebuerg soll déngen. All Keefer kann e Kredit vu bis zu 20.000 € kréien (also 40.000 € fir e Koppel dat zesumme kaaft), wat d'Notairskoste bedeitend reduzéiert. Dëst Dispositif baséiert op dem Artikel 7 vum geännerte Gesetz vum 22. Frimaire Joer VII an dem Groussherzoglecht Reglement vum 18. Dezember 2020.",
      pt: "O Bëllegen Akt (literalmente 'ato acessível') é um crédito fiscal concedido sobre os direitos de registo na aquisição de um imóvel destinado a servir de residência principal no Luxemburgo. Cada adquirente pode beneficiar de um crédito até 20.000 € (ou seja, 40.000 € para um casal que adquire em conjunto), o que reduz significativamente os custos notariais. Este mecanismo está previsto no artigo 7.o da lei modificada de 22 Frimário Ano VII e no regulamento grão-ducal de 18 de dezembro de 2020.",
    },
    section1Title: {
      fr: "Conditions d'éligibilité",
      en: "Eligibility Conditions",
      de: "Voraussetzungen",
      lb: "Viraussetzungen",
      pt: "Condições de elegibilidade",
    },
    section1Content: {
      fr: "Pour bénéficier du Bëllegen Akt, quatre conditions doivent être remplies : (1) l'acquéreur doit s'engager à occuper le bien comme résidence principale dans les deux ans suivant l'acquisition ; (2) il ne doit pas être propriétaire d'un autre logement au moment de la demande ; (3) le bien doit être situé au Luxembourg ; (4) le crédit n'a pas déjà été intégralement utilisé lors d'une acquisition antérieure. Le crédit est personnel : chaque personne physique dispose d'un crédit de 20 000 € sur l'ensemble de sa vie. Un couple marié ou pacsé achetant ensemble cumule donc 40 000 €.",
      en: "To benefit from the Bëllegen Akt, four conditions must be met: (1) the buyer must commit to occupying the property as a primary residence within two years of acquisition; (2) they must not own another dwelling at the time of application; (3) the property must be located in Luxembourg; (4) the credit has not already been fully used in a previous purchase. The credit is personal: each individual has a lifetime credit of €20,000. A married or civil-partnered couple purchasing together therefore accumulates €40,000.",
      de: "Um den Bëllegen Akt zu nutzen, müssen vier Bedingungen erfüllt sein: (1) Der Käufer muss sich verpflichten, die Immobilie innerhalb von zwei Jahren als Hauptwohnsitz zu nutzen; (2) er darf zum Zeitpunkt des Antrags keine andere Wohnung besitzen; (3) die Immobilie muss in Luxemburg liegen; (4) die Gutschrift wurde nicht bereits bei einem früheren Kauf vollständig genutzt. Die Gutschrift ist persönlich: Jede natürliche Person verfügt über einen lebenslangen Kredit von 20.000 €. Ein verheiratetes oder verpartnertes Paar kumuliert somit 40.000 €.",
      lb: "Fir vum Bëllegen Akt ze profitéieren, musse véier Konditioune erfëllt sinn: (1) De Keefer muss sech engagéieren, d'Immobilie bannent zwee Joer als Haaptwunnsëtz ze benotzen; (2) hien däerf zum Zäitpunkt vun der Demande keng aner Wunneng besëtzen; (3) d'Immobilie muss zu Lëtzebuerg leien; (4) de Kredit gouf net schonns komplett bei engem fréieren Akaf benotzt. De Kredit ass perséinlech: All natierlech Persoun verfügt iwwer e Liewekredit vu 20.000 €. E bestuet oder gepacsct Koppel kumuléiert also 40.000 €.",
      pt: "Para beneficiar do Bëllegen Akt, quatro condições devem ser cumpridas: (1) o adquirente deve comprometer-se a ocupar o imóvel como residência principal nos dois anos seguintes à aquisição; (2) não deve ser proprietário de outra habitação no momento do pedido; (3) o imóvel deve estar situado no Luxemburgo; (4) o crédito não deve ter sido integralmente utilizado numa aquisição anterior. O crédito é pessoal: cada pessoa singular dispõe de um crédito vitalício de 20.000 €. Um casal casado ou em união de facto que compre em conjunto acumula portanto 40.000 €.",
    },
    section2Title: {
      fr: "Montant et application du crédit",
      en: "Credit Amount and Application",
      de: "Höhe und Anwendung der Gutschrift",
      lb: "Héicht an Uwendung vum Kredit",
      pt: "Montante e aplicação do crédito",
    },
    section2Content: {
      fr: "Le crédit s'impute directement sur les droits d'enregistrement et de transcription dus lors de l'acte notarié. Exemple concret : pour un couple achetant un appartement à 600 000 €, les droits d'enregistrement (7 %) + transcription (1 %) = 48 000 €. Avec le Bëllegen Akt de 40 000 €, ils ne paient que 8 000 € de droits. Le notaire applique automatiquement le crédit lors de la rédaction de l'acte, après vérification auprès de l'Administration de l'enregistrement et des domaines (AED). Si le crédit excède les droits dus, le solde reste disponible pour une future acquisition.",
      en: "The credit is directly offset against registration and transcription duties due at the notarial deed. Concrete example: for a couple buying an apartment at €600,000, registration duties (7%) + transcription (1%) = €48,000. With the €40,000 Bëllegen Akt, they pay only €8,000 in duties. The notary automatically applies the credit when drafting the deed, after verification with the Registration and Domains Administration (AED). If the credit exceeds the duties owed, the balance remains available for a future purchase.",
      de: "Die Gutschrift wird direkt auf die bei der notariellen Urkunde fälligen Eintragungsgebühren und Transkriptionsgebühren angerechnet. Konkretes Beispiel: Ein Paar kauft eine Wohnung für 600.000 €, Eintragungsgebühren (7 %) + Transkription (1 %) = 48.000 €. Mit dem Bëllegen Akt von 40.000 € zahlen sie nur 8.000 € an Gebühren. Der Notar wendet die Gutschrift automatisch bei der Urkundenabfassung an, nach Prüfung bei der Einregistrierungsverwaltung (AED). Übersteigt die Gutschrift die fälligen Gebühren, bleibt der Rest für einen zukünftigen Kauf verfügbar.",
      lb: "De Kredit gëtt direkt op d'Aschreiwungs- an Transkriptiounsgebühren ugerechent, déi beim notarielle Akt fälleg sinn. Konkreet Beispill: E Koppel kaaft en Appartement fir 600.000 €, Aschreiwungsgebühren (7 %) + Transkriptioun (1 %) = 48.000 €. Mam Bëllegen Akt vu 40.000 € bezuelen si nëmmen 8.000 € u Gebühren. Den Notaire applizéiert de Kredit automatesch bei der Redaktioun vum Akt, no Verifizéierung bei der Administration de l'enregistrement et des domaines (AED). Wann de Kredit d'fälleg Gebühre iwwerschreit, bleift de Rescht fir en zukünftegen Akaf verfügbar.",
      pt: "O crédito é imputado diretamente nos direitos de registo e transcrição devidos na escritura notarial. Exemplo concreto: para um casal que compra um apartamento por 600.000 €, direitos de registo (7%) + transcrição (1%) = 48.000 €. Com o Bëllegen Akt de 40.000 €, pagam apenas 8.000 € de direitos. O notário aplica automaticamente o crédito na redação da escritura, após verificação junto da Administração do Registo e Domínios (AED). Se o crédito exceder os direitos devidos, o saldo fica disponível para uma futura aquisição.",
    },
    section3Title: {
      fr: "Points de vigilance",
      en: "Important Considerations",
      de: "Wichtige Hinweise",
      lb: "Wichteg Hiweiser",
      pt: "Pontos de atenção",
    },
    section3Content: {
      fr: "Si l'acquéreur ne respecte pas l'engagement d'occupation dans les deux ans, l'AED peut réclamer le remboursement du crédit majoré d'intérêts de retard. Le crédit ne s'applique pas aux terrains nus sans projet de construction immédiat. En cas de revente du bien avant l'expiration du délai d'occupation, le crédit peut également être réclamé. Attention : le Bëllegen Akt ne réduit pas les émoluments du notaire ni les frais hypothécaires, seulement les droits d'enregistrement et de transcription. Un crédit partiel est possible si une partie a déjà été utilisée lors d'une première acquisition.",
      en: "If the buyer fails to meet the two-year occupancy commitment, the AED can claim reimbursement of the credit plus late interest. The credit does not apply to bare land without an immediate construction project. If the property is resold before the occupancy period expires, the credit may also be reclaimed. Note: the Bëllegen Akt does not reduce notary emoluments or mortgage costs, only registration and transcription duties. A partial credit is possible if part was already used in a previous acquisition.",
      de: "Wenn der Käufer die Zweijahres-Belegungspflicht nicht einhält, kann die AED die Rückzahlung der Gutschrift zuzüglich Verzugszinsen fordern. Die Gutschrift gilt nicht für unbebaute Grundstücke ohne sofortiges Bauprojekt. Bei Wiederverkauf der Immobilie vor Ablauf der Belegungsfrist kann die Gutschrift ebenfalls zurückgefordert werden. Achtung: Der Bëllegen Akt reduziert nicht die Notargebühren oder Hypothekenkosten, sondern nur die Eintragungsgebühren und Transkriptionsgebühren. Eine Teilgutschrift ist möglich, wenn ein Teil bereits bei einem früheren Kauf verwendet wurde.",
      lb: "Wann de Keefer d'Zwee-Joer-Bewunnungspflicht net anhält, kann d'AED d'Réckzuelung vum Kredit zuzüglech Verzugszënsen fuerdere. De Kredit gëllt net fir onbebaut Terrainen ouni direkt Bauprojet. Bei Widdervekaf vun der Immobilie virun dem Oflaf vun der Bewunnungsfrist kann de Kredit och zréckgefuerdert ginn. Opgepasst: De Bëllegen Akt reduzéiert net d'Notairsgebühren oder Hypothéikekosten, mee nëmmen d'Aschreiwungs- an Transkriptiounsgebühren. En Deelkredit ass méiglech, wann en Deel schonns bei engem fréieren Akaf benotzt gouf.",
      pt: "Se o adquirente não cumprir o compromisso de ocupação nos dois anos, a AED pode reclamar o reembolso do crédito acrescido de juros de mora. O crédito não se aplica a terrenos sem projeto de construção imediato. Em caso de revenda do imóvel antes do término do prazo de ocupação, o crédito pode igualmente ser reclamado. Atenção: o Bëllegen Akt não reduz os emolumentos notariais nem os custos hipotecários, apenas os direitos de registo e transcrição. Um crédito parcial é possível se parte já foi utilizada numa aquisição anterior.",
    },
    relatedToolLabel: {
      fr: "Simuler vos frais avec le Bëllegen Akt",
      en: "Simulate your fees with the Bëllegen Akt",
      de: "Simulieren Sie Ihre Kosten mit dem Bëllegen Akt",
      lb: "Simuléiert Är Käschte mam Bëllegen Akt",
      pt: "Simule os seus custos com o Bëllegen Akt",
    },
    relatedToolLink: {
      fr: "/frais-acquisition",
      en: "/frais-acquisition",
      de: "/frais-acquisition",
      lb: "/frais-acquisition",
      pt: "/frais-acquisition",
    },
    faq1Q: {
      fr: "Le Bëllegen Akt est-il cumulable avec d'autres aides ?",
      en: "Can the Bëllegen Akt be combined with other subsidies?",
      de: "Ist der Bëllegen Akt mit anderen Beihilfen kombinierbar?",
      lb: "Ass de Bëllegen Akt mat aneren Hëllefen kombinéierbar?",
      pt: "O Bëllegen Akt é cumulável com outras ajudas?",
    },
    faq1A: {
      fr: "Oui, le Bëllegen Akt est cumulable avec la TVA à 3 % (pour les biens neufs) et les aides PRIMe House / Klimabonus pour la rénovation énergétique.",
      en: "Yes, the Bëllegen Akt can be combined with the 3% VAT (for new-build properties) and PRIMe House / Klimabonus subsidies for energy renovation.",
      de: "Ja, der Bëllegen Akt ist mit der 3%-MwSt. (für Neubauten) und den PRIMe House / Klimabonus-Beihilfen für energetische Sanierung kombinierbar.",
      lb: "Jo, de Bëllegen Akt ass mat der 3%-TVA (fir Neibauten) an de PRIMe House / Klimabonus-Hëllefen fir energeetesch Sanéierung kombinéierbar.",
      pt: "Sim, o Bëllegen Akt é cumulável com o IVA a 3% (para imóveis novos) e as ajudas PRIMe House / Klimabonus para renovação energética.",
    },
    faq2Q: {
      fr: "Peut-on utiliser le Bëllegen Akt pour un investissement locatif ?",
      en: "Can the Bëllegen Akt be used for a rental investment?",
      de: "Kann der Bëllegen Akt für eine Mietinvestition genutzt werden?",
      lb: "Kann de Bëllegen Akt fir eng Mietinvestitioun benotzt ginn?",
      pt: "Pode-se usar o Bëllegen Akt para um investimento locativo?",
    },
    faq2A: {
      fr: "Non, le Bëllegen Akt est strictement réservé à l'acquisition d'une résidence principale. Un investissement locatif ou une résidence secondaire ne permet pas d'en bénéficier.",
      en: "No, the Bëllegen Akt is strictly reserved for primary residence purchases. A rental investment or secondary residence does not qualify.",
      de: "Nein, der Bëllegen Akt ist ausschließlich für den Kauf eines Hauptwohnsitzes vorgesehen. Eine Mietinvestition oder ein Zweitwohnsitz berechtigt nicht dazu.",
      lb: "Nee, de Bëllegen Akt ass strikt fir den Akaf vun engem Haaptwunnsëtz reservéiert. Eng Mietinvestitioun oder en Zweetwunnsëtz berechtegt net dozou.",
      pt: "Não, o Bëllegen Akt é estritamente reservado à aquisição de residência principal. Um investimento locativo ou residência secundária não permite beneficiar.",
    },
  },

  // === Guide: Plus-value immobilière ===
  "guide.plusValue": {
    title: {
      fr: "Comment est imposée la plus-value immobilière au Luxembourg ?",
      en: "How Are Real Estate Capital Gains Taxed in Luxembourg?",
      de: "Wie werden Immobilien-Kapitalgewinne in Luxemburg besteuert?",
      lb: "Wéi ginn Immobilien-Kapitalgewënner zu Lëtzebuerg besteierd?",
      pt: "Como é tributada a mais-valia imobiliária no Luxemburgo?",
    },
    metaDescription: {
      fr: "Fiscalité de la plus-value immobilière au Luxembourg : spéculation < 2 ans, taux global, abattements 50 000 €/100 000 €, exonération résidence principale. Art. 99ter et 102bis LIR.",
      en: "Luxembourg real estate capital gains tax: speculation < 2 years, global rate, €50,000/€100,000 allowances, primary residence exemption. Art. 99ter and 102bis LIR.",
      de: "Luxemburger Immobilienkapitalertragssteuer: Spekulation < 2 Jahre, Gesamtsatz, Freibeträge 50.000 €/100.000 €, Hauptwohnsitz-Befreiung. Art. 99ter und 102bis LIR.",
      lb: "Lëtzebuerger Immobilie-Kapitalgewënnsteier: Spekulatioun < 2 Joer, Gesamtsaz, Fräibedrag 50.000 €/100.000 €, Haaptwunnsëtz-Befreiung. Art. 99ter an 102bis LIR.",
      pt: "Tributação da mais-valia imobiliária no Luxemburgo: especulação < 2 anos, taxa global, abatimentos 50.000 €/100.000 €, isenção residência principal. Art. 99ter e 102bis LIR.",
    },
    intro: {
      fr: "Au Luxembourg, la plus-value réalisée lors de la vente d'un bien immobilier est imposable selon deux régimes distincts : le bénéfice de spéculation si la revente intervient moins de 2 ans après l'acquisition (art. 99bis LIR), ou le bénéfice de cession si elle intervient après 2 ans (art. 99ter LIR). Le taux d'imposition, les abattements et les possibilités d'exonération dépendent de la durée de détention et de l'usage du bien. L'exonération totale est possible pour la résidence principale occupée personnellement.",
      en: "In Luxembourg, capital gains from selling real estate are taxable under two distinct regimes: speculation profit if the resale occurs less than 2 years after acquisition (Art. 99bis LIR), or transfer profit if it occurs after 2 years (Art. 99ter LIR). The tax rate, allowances and exemption possibilities depend on the holding period and property use. Full exemption is possible for the personally occupied primary residence.",
      de: "In Luxemburg unterliegen Kapitalgewinne aus dem Verkauf von Immobilien zwei verschiedenen Regelungen: Spekulationsgewinn bei Weiterverkauf innerhalb von 2 Jahren nach dem Erwerb (Art. 99bis LIR) oder Veräußerungsgewinn nach 2 Jahren (Art. 99ter LIR). Steuersatz, Freibeträge und Befreiungsmöglichkeiten hängen von der Haltedauer und der Nutzung der Immobilie ab. Eine vollständige Befreiung ist für den selbst bewohnten Hauptwohnsitz möglich.",
      lb: "Zu Lëtzebuerg ginn Kapitalgewënner aus dem Verkaf vun Immobilie no zwee ënnerschiddleche Regimer besteierd: Spekulatiounsgewënn bei Widdervekaf bannent 2 Joer no dem Erwierfung (Art. 99bis LIR), oder Veräusserungsgewënn no 2 Joer (Art. 99ter LIR). Steiersaz, Fräibedrag an Befreiungsméiglechkeeten hänken vun der Haltedauer an der Notzung vun der Immobilie of. Eng komplett Befreiung ass fir den selwer bewunnten Haaptwunnsëtz méiglech.",
      pt: "No Luxemburgo, a mais-valia realizada na venda de um imóvel é tributável segundo dois regimes distintos: benefício de especulação se a revenda ocorre menos de 2 anos após a aquisição (art. 99bis LIR), ou benefício de cessão se ocorre após 2 anos (art. 99ter LIR). A taxa de tributação, os abatimentos e as possibilidades de isenção dependem da duração de detenção e do uso do imóvel. A isenção total é possível para a residência principal ocupada pessoalmente.",
    },
    section1Title: {
      fr: "Bénéfice de spéculation (< 2 ans)",
      en: "Speculation Profit (< 2 years)",
      de: "Spekulationsgewinn (< 2 Jahre)",
      lb: "Spekulatiounsgewënn (< 2 Joer)",
      pt: "Benefício de especulação (< 2 anos)",
    },
    section1Content: {
      fr: "Lorsque la revente intervient dans les 2 ans suivant l'acquisition, la plus-value est qualifiée de bénéfice de spéculation (art. 99bis LIR). Elle est intégralement ajoutée aux revenus imposables et taxée au barème progressif de l'impôt sur le revenu (taux marginal jusqu'à 42 % + contribution au fonds pour l'emploi de 7 à 9 %, soit un taux effectif maximal d'environ 45,78 %). Aucun abattement spécifique ne s'applique. La plus-value est calculée comme la différence entre le prix de vente et le prix d'acquisition majoré des frais d'acte et des travaux d'amélioration.",
      en: "When the resale occurs within 2 years of acquisition, the capital gain qualifies as speculation profit (Art. 99bis LIR). It is fully added to taxable income and taxed at the progressive income tax rate (marginal rate up to 42% + employment fund contribution of 7 to 9%, giving a maximum effective rate of approximately 45.78%). No specific allowance applies. The capital gain is calculated as the difference between the sale price and the acquisition price increased by deed costs and improvement works.",
      de: "Wenn der Weiterverkauf innerhalb von 2 Jahren nach dem Erwerb erfolgt, gilt der Kapitalgewinn als Spekulationsgewinn (Art. 99bis LIR). Er wird vollständig zum steuerpflichtigen Einkommen addiert und mit dem progressiven Einkommensteuertarif besteuert (Grenzsteuersatz bis 42 % + Beschäftigungsfondsbeitrag von 7 bis 9 %, also ein maximaler Effektivsatz von ca. 45,78 %). Kein spezifischer Freibetrag ist anwendbar. Der Kapitalgewinn berechnet sich als Differenz zwischen Verkaufspreis und Anschaffungspreis zuzüglich Erwerbsnebenkosten und Verbesserungsarbeiten.",
      lb: "Wann de Widdervekaf bannent 2 Joer nom Erwierfung geschitt, gëllt de Kapitalgewënn als Spekulatiounsgewënn (Art. 99bis LIR). Hie gëtt komplett zum steierflichtegen Akommes derbäigesat an zum progressiven Akommenssteierentaux besteierd (Grenzsaz bis 42 % + Beschäftegungsfondsbäitrag vu 7 bis 9 %, also en maximalen Effektivsaz vun ongeféier 45,78 %). Keen spezifesche Fräibedrag gëtt applizéiert. De Kapitalgewënn berechent sech als Differenz tëschent Verkafspräis an Akafspräis zuzüglech Erwerbsnieftekäschten an Verbesserungsaarbechten.",
      pt: "Quando a revenda ocorre nos 2 anos seguintes à aquisição, a mais-valia qualifica-se como benefício de especulação (art. 99bis LIR). É integralmente adicionada aos rendimentos tributáveis e taxada à taxa progressiva do imposto sobre o rendimento (taxa marginal até 42% + contribuição para o fundo de emprego de 7 a 9%, resultando numa taxa efetiva máxima de aproximadamente 45,78%). Nenhum abatimento específico se aplica. A mais-valia é calculada como a diferença entre o preço de venda e o preço de aquisição acrescido dos custos de escritura e das obras de melhoria.",
    },
    section2Title: {
      fr: "Bénéfice de cession (≥ 2 ans)",
      en: "Transfer Profit (≥ 2 years)",
      de: "Veräußerungsgewinn (≥ 2 Jahre)",
      lb: "Veräusserungsgewënn (≥ 2 Joer)",
      pt: "Benefício de cessão (≥ 2 anos)",
    },
    section2Content: {
      fr: "Lorsque la cession intervient plus de 2 ans après l'acquisition, la plus-value est un bénéfice de cession (art. 99ter LIR). Elle bénéficie d'un régime fiscal plus favorable : seul le quart du taux global d'imposition s'applique (art. 102bis al. 1 LIR). Le prix d'acquisition est réévalué au moyen du coefficient de réévaluation de l'indice des prix de la construction publié par le STATEC. Un abattement décennal de 50 000 € par personne (100 000 € pour un couple imposé collectivement) est déduit de la plus-value imposable (art. 130 al. 4 LIR). Exemple : un bien acheté 400 000 € en 2010 et vendu 700 000 € en 2025, avec un coefficient de 1,25, donne un prix réévalué de 500 000 € et une plus-value brute de 200 000 €.",
      en: "When the disposal occurs more than 2 years after acquisition, the capital gain is a transfer profit (Art. 99ter LIR). It benefits from a more favourable tax regime: only one quarter of the overall tax rate applies (Art. 102bis para. 1 LIR). The acquisition price is revalued using the construction price index revaluation coefficient published by STATEC. A decennial allowance of €50,000 per person (€100,000 for a jointly taxed couple) is deducted from the taxable capital gain (Art. 130 para. 4 LIR). Example: a property purchased for €400,000 in 2010 and sold for €700,000 in 2025, with a coefficient of 1.25, gives a revalued price of €500,000 and a gross capital gain of €200,000.",
      de: "Wenn die Veräußerung mehr als 2 Jahre nach dem Erwerb erfolgt, handelt es sich um einen Veräußerungsgewinn (Art. 99ter LIR). Es gilt ein günstigeres Steuerregime: Nur ein Viertel des Gesamtsteuersatzes wird angewandt (Art. 102bis Abs. 1 LIR). Der Anschaffungspreis wird anhand des vom STATEC veröffentlichten Baukostenindex-Aufwertungskoeffizienten aufgewertet. Ein Zehn-Jahres-Freibetrag von 50.000 € pro Person (100.000 € für gemeinsam veranlagte Ehepaare) wird vom steuerpflichtigen Kapitalgewinn abgezogen (Art. 130 Abs. 4 LIR). Beispiel: Eine 2010 für 400.000 € gekaufte und 2025 für 700.000 € verkaufte Immobilie mit Koeffizient 1,25 ergibt einen aufgewerteten Preis von 500.000 € und einen Bruttogewinn von 200.000 €.",
      lb: "Wann d'Veräusserung méi wéi 2 Joer nom Erwierfung geschitt, ass de Kapitalgewënn e Veräusserungsgewënn (Art. 99ter LIR). Et gëllt en méi favorabelt Steierregime: Nëmmen e Véierel vum Gesamtsteiersaz gëtt applizéiert (Art. 102bis Abs. 1 LIR). Den Akafspräis gëtt mat dem vum STATEC publizéierten Baukostenindex-Opwäertungskoeffizient opgewäert. E Zéng-Joers-Fräibedrag vu 50.000 € pro Persoun (100.000 € fir zesumme besteierd Koppelen) gëtt vum steierflichtegen Kapitalgewënn ofgezunn (Art. 130 Abs. 4 LIR). Beispill: Eng 2010 fir 400.000 € kaaft an 2025 fir 700.000 € verkaaft Immobilie mat Koeffizient 1,25 ergëtt en opgewäerte Präis vu 500.000 € an e Bruttogewënn vu 200.000 €.",
      pt: "Quando a cessão ocorre mais de 2 anos após a aquisição, a mais-valia é um benefício de cessão (art. 99ter LIR). Beneficia de um regime fiscal mais favorável: apenas um quarto da taxa global de tributação se aplica (art. 102bis al. 1 LIR). O preço de aquisição é reavaliado através do coeficiente de reavaliação do índice de preços de construção publicado pelo STATEC. Um abatimento decenal de 50.000 € por pessoa (100.000 € para casal tributado conjuntamente) é deduzido da mais-valia tributável (art. 130 al. 4 LIR). Exemplo: um imóvel comprado por 400.000 € em 2010 e vendido por 700.000 € em 2025, com coeficiente de 1,25, dá um preço reavaliado de 500.000 € e uma mais-valia bruta de 200.000 €.",
    },
    section3Title: {
      fr: "Exonérations",
      en: "Exemptions",
      de: "Befreiungen",
      lb: "Befreiungen",
      pt: "Isenções",
    },
    section3Content: {
      fr: "L'exonération la plus courante concerne la résidence principale : la plus-value est totalement exonérée si le bien constitue la résidence principale du vendeur au moment de la cession et s'il l'a occupée effectivement et de manière continue pendant les 5 années précédant la vente (art. 102bis al. 3 LIR). Un sursis d'imposition (remploi) est possible si le produit de la vente est réinvesti dans un autre logement occupé comme résidence principale dans les 2 ans (art. 102bis al. 2 LIR). Pour les terrains, un régime de sursis est également possible sous conditions. Enfin, les mutations à titre gratuit (donation, succession) ne déclenchent pas d'imposition de la plus-value chez le donateur/défunt, mais le bénéficiaire reprend le prix d'acquisition historique.",
      en: "The most common exemption concerns the primary residence: the capital gain is fully exempt if the property is the seller's primary residence at the time of disposal and they have effectively and continuously occupied it for the 5 years preceding the sale (Art. 102bis para. 3 LIR). A tax deferral (reinvestment) is possible if the sale proceeds are reinvested in another owner-occupied primary residence within 2 years (Art. 102bis para. 2 LIR). For land, a deferral regime is also possible under certain conditions. Gratuitous transfers (gift, inheritance) do not trigger capital gains taxation for the donor/deceased, but the beneficiary assumes the historical acquisition price.",
      de: "Die häufigste Befreiung betrifft den Hauptwohnsitz: Der Kapitalgewinn ist vollständig befreit, wenn die Immobilie zum Zeitpunkt der Veräußerung der Hauptwohnsitz des Verkäufers ist und er sie während der 5 Jahre vor dem Verkauf tatsächlich und ununterbrochen bewohnt hat (Art. 102bis Abs. 3 LIR). Ein Steueraufschub (Reinvestition) ist möglich, wenn der Verkaufserlös innerhalb von 2 Jahren in einen anderen selbstbewohnten Hauptwohnsitz reinvestiert wird (Art. 102bis Abs. 2 LIR). Für Grundstücke ist ebenfalls ein Aufschubregime unter Bedingungen möglich. Unentgeltliche Übertragungen (Schenkung, Erbschaft) lösen keine Kapitalertragsbesteuerung beim Schenker/Verstorbenen aus, aber der Begünstigte übernimmt den historischen Anschaffungspreis.",
      lb: "Déi heefegst Befreiung betrefft den Haaptwunnsëtz: De Kapitalgewënn ass komplett befreit, wann d'Immobilie zum Zäitpunkt vun der Veräusserung den Haaptwunnsëtz vum Verkefer ass an hien se während den 5 Joer virum Verkaf tatsächlech an onofrocheg bewunnt huet (Art. 102bis Abs. 3 LIR). En Steieropschub (Reinvestitioun) ass méiglech, wann d'Verkafsproduit bannent 2 Joer an en anere selwer bewunnte Haaptwunnsëtz reinvestéiert gëtt (Art. 102bis Abs. 2 LIR). Fir Terrainen ass och en Opschubregime ënnert Konditiounen méiglech. Onentgeltlech Iwwerdroungen (Schenkung, Ierfschaft) léisen keng Kapitalgewënnbesteierung beim Schenker/Verstuerewene aus, awer de Begënschtegten iwwerhëlt den historeschen Akafspräis.",
      pt: "A isenção mais comum diz respeito à residência principal: a mais-valia é totalmente isenta se o imóvel constitui a residência principal do vendedor no momento da cessão e se este a ocupou efetiva e continuamente durante os 5 anos anteriores à venda (art. 102bis al. 3 LIR). Um diferimento de imposto (reinvestimento) é possível se o produto da venda for reinvestido noutra habitação ocupada como residência principal nos 2 anos seguintes (art. 102bis al. 2 LIR). Para terrenos, um regime de diferimento é igualmente possível sob condições. Transmissões gratuitas (doação, herança) não desencadeiam tributação de mais-valia do doador/falecido, mas o beneficiário assume o preço de aquisição histórico.",
    },
    relatedToolLabel: {
      fr: "Calculer votre plus-value imposable",
      en: "Calculate your taxable capital gain",
      de: "Berechnen Sie Ihren steuerpflichtigen Kapitalgewinn",
      lb: "Berechent Ären steierflichtegen Kapitalgewënn",
      pt: "Calcule a sua mais-valia tributável",
    },
    relatedToolLink: {
      fr: "/plus-values",
      en: "/plus-values",
      de: "/plus-values",
      lb: "/plus-values",
      pt: "/plus-values",
    },
    faq1Q: {
      fr: "Quel est le taux d'imposition sur les plus-values immobilières au Luxembourg ?",
      en: "What is the capital gains tax rate on real estate in Luxembourg?",
      de: "Wie hoch ist der Steuersatz auf Immobilienkapitalgewinne in Luxemburg?",
      lb: "Wéi héich ass de Steiersaz op Immobilienkapitalgewënner zu Lëtzebuerg?",
      pt: "Qual é a taxa de tributação sobre mais-valias imobiliárias no Luxemburgo?",
    },
    faq1A: {
      fr: "Pour une revente dans les 2 ans : barème progressif de l'IR (jusqu'à ~45,78 %). Après 2 ans : un quart du taux global, soit environ 10 à 11 % selon les revenus, après application de l'abattement de 50 000 €.",
      en: "For resale within 2 years: progressive income tax rate (up to ~45.78%). After 2 years: one quarter of the overall rate, approximately 10 to 11% depending on income, after the €50,000 allowance.",
      de: "Bei Weiterverkauf innerhalb von 2 Jahren: progressiver Einkommensteuertarif (bis ca. 45,78 %). Nach 2 Jahren: ein Viertel des Gesamtsatzes, also ca. 10 bis 11 % je nach Einkommen, nach Abzug des Freibetrags von 50.000 €.",
      lb: "Bei Widdervekaf bannent 2 Joer: progressiven Akommenssteierentaux (bis ongeféier 45,78 %). No 2 Joer: e Véierel vum Gesamtsaz, also ongeféier 10 bis 11 % je no Akommes, no Ofzuch vum Fräibedrag vu 50.000 €.",
      pt: "Para revenda em 2 anos: taxa progressiva do IRS (até ~45,78%). Após 2 anos: um quarto da taxa global, aproximadamente 10 a 11% conforme os rendimentos, após aplicação do abatimento de 50.000 €.",
    },
    faq2Q: {
      fr: "La vente de ma résidence principale est-elle imposable ?",
      en: "Is the sale of my primary residence taxable?",
      de: "Ist der Verkauf meines Hauptwohnsitzes steuerpflichtig?",
      lb: "Ass de Verkaf vu mengem Haaptwunnsëtz steierflichteg?",
      pt: "A venda da minha residência principal é tributável?",
    },
    faq2A: {
      fr: "Non, si vous avez occupé le bien comme résidence principale de manière continue pendant les 5 années précédant la vente, la plus-value est intégralement exonérée (art. 102bis al. 3 LIR).",
      en: "No, if you have continuously occupied the property as your primary residence for the 5 years preceding the sale, the capital gain is fully exempt (Art. 102bis para. 3 LIR).",
      de: "Nein, wenn Sie die Immobilie während der 5 Jahre vor dem Verkauf ununterbrochen als Hauptwohnsitz bewohnt haben, ist der Kapitalgewinn vollständig befreit (Art. 102bis Abs. 3 LIR).",
      lb: "Nee, wann Dir d'Immobilie während den 5 Joer virum Verkaf onofrocheg als Haaptwunnsëtz bewunnt hutt, ass de Kapitalgewënn komplett befreit (Art. 102bis Abs. 3 LIR).",
      pt: "Não, se ocupou o imóvel como residência principal de forma contínua durante os 5 anos anteriores à venda, a mais-valia é integralmente isenta (art. 102bis al. 3 LIR).",
    },
  },
};

// Deep merge helper
function _deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const lang of LANGS) {
  const filePath = `${MSG_DIR}/${lang}.json`;
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  for (const [nsKey, fields] of Object.entries(NEW_KEYS)) {
    // Build nested path from dot notation
    const parts = nsKey.split(".");
    let target = data;
    for (const part of parts) {
      if (!target[part]) target[part] = {};
      target = target[part];
    }
    for (const [fieldKey, translations] of Object.entries(fields)) {
      if (typeof translations === "object" && translations[lang] !== undefined) {
        target[fieldKey] = translations[lang];
      }
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`✓ ${lang}.json updated`);
}

console.log("Done — guide batch 1 i18n keys injected.");
