// Inject i18n keys for guide batch 3 (4 guides: achat non-résident, TVA 3%, bail commercial, investir hôtel)
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

const NEW_KEYS = {
  // === Guide: Achat immobilier non-résident ===
  "guide.achatNonResident": {
    title: {
      fr: "Un non-résident peut-il acheter un bien au Luxembourg ?",
      en: "Can a Non-Resident Buy Property in Luxembourg?",
      de: "Kann ein Nicht-Resident eine Immobilie in Luxemburg kaufen?",
      lb: "Kann en Net-Resident eng Immobilie zu Lëtzebuerg kafen?",
      pt: "Um não residente pode comprar um imóvel no Luxemburgo?",
    },
    metaDescription: {
      fr: "Achat immobilier par un non-résident au Luxembourg : aucune restriction, différences fiscales, Bëllegen Akt, financement LTV 70-75 %, convention double imposition, revenus fonciers.",
      en: "Buying property as a non-resident in Luxembourg: no restrictions, tax differences, Bëllegen Akt, LTV financing 70-75%, double tax treaty, rental income.",
      de: "Immobilienkauf als Nicht-Resident in Luxemburg: keine Beschränkungen, steuerliche Unterschiede, Bëllegen Akt, LTV-Finanzierung 70-75 %, Doppelbesteuerungsabkommen, Mieteinnahmen.",
      lb: "Immobilienakaf als Net-Resident zu Lëtzebuerg: keng Beschränkungen, steierleg Ënnerscheeder, Bëllegen Akt, LTV-Finanzéierung 70-75 %, Doppelbesteierungsofkommen, Mietakommes.",
      pt: "Compra de imóvel por não residente no Luxemburgo: sem restrições, diferenças fiscais, Bëllegen Akt, financiamento LTV 70-75 %, convenção dupla tributação, rendimentos prediais.",
    },
    intro: {
      fr: "Oui, un non-résident peut acheter librement un bien immobilier au Luxembourg. Il n'existe aucune restriction de nationalité ni de résidence pour l'acquisition de biens immobiliers dans le Grand-Duché. Toutefois, le statut de non-résident entraîne des différences notables en matière fiscale, de financement bancaire et de déclaration des revenus fonciers. Ce guide détaille les points essentiels à connaître avant d'investir depuis l'étranger.",
      en: "Yes, a non-resident can freely buy property in Luxembourg. There are no nationality or residency restrictions for acquiring real estate in the Grand Duchy. However, non-resident status brings notable differences in taxation, bank financing and rental income reporting. This guide details the essential points to know before investing from abroad.",
      de: "Ja, ein Nicht-Resident kann frei Immobilien in Luxemburg erwerben. Es gibt keine Nationalitäts- oder Wohnsitzbeschränkungen für den Immobilienerwerb im Großherzogtum. Allerdings bringt der Nicht-Resident-Status bemerkenswerte Unterschiede bei der Besteuerung, Bankfinanzierung und Mieteinnahmendeklaration mit sich. Dieser Ratgeber erläutert die wesentlichen Punkte vor einer Investition aus dem Ausland.",
      lb: "Jo, en Net-Resident kann fräi Immobilien zu Lëtzebuerg kafen. Et gëtt keng Nationalitéits- oder Wunnsëtzbeschränkungen fir den Immobilienerwierw am Grand-Duché. Allerdéngs bréngt den Net-Resident-Status merkbar Ënnerscheeder bei der Besteierung, Bankfinanzéierung an der Mietakommeserklärung mat sech. Dëse Guide erkläert déi wesentlech Punkten virun enger Investitioun aus dem Ausland.",
      pt: "Sim, um não residente pode comprar livremente um imóvel no Luxemburgo. Não existem restrições de nacionalidade nem de residência para a aquisição de bens imobiliários no Grão-Ducado. Contudo, o estatuto de não residente implica diferenças notáveis em matéria fiscal, de financiamento bancário e de declaração de rendimentos prediais. Este guia detalha os pontos essenciais a conhecer antes de investir a partir do estrangeiro.",
    },
    section1Title: {
      fr: "Fiscalité et Bëllegen Akt pour les non-résidents",
      en: "Taxation and Bëllegen Akt for Non-Residents",
      de: "Besteuerung und Bëllegen Akt für Nicht-Residenten",
      lb: "Besteierung a Bëllegen Akt fir Net-Residenten",
      pt: "Fiscalidade e Bëllegen Akt para não residentes",
    },
    section1Content: {
      fr: "Les droits d'enregistrement (6 % du prix d'acquisition + 1 % de transcription hypothécaire) s'appliquent de manière identique aux résidents et aux non-résidents. En revanche, le crédit d'impôt Bëllegen Akt (20.000 € par personne, soit 40.000 € pour un couple) n'est accordé que pour l'acquisition d'une résidence principale occupée personnellement au Luxembourg. Un non-résident achetant pour investissement locatif ne peut donc pas en bénéficier. Par ailleurs, les non-résidents sont soumis à l'impôt sur le revenu luxembourgeois uniquement sur leurs revenus de source luxembourgeoise (revenus fonciers, plus-values immobilières). Les conventions fiscales bilatérales (France-Luxembourg, Belgique-Luxembourg, Allemagne-Luxembourg, etc.) permettent d'éviter la double imposition : les revenus fonciers sont généralement imposés dans le pays de situation du bien (Luxembourg), puis exonérés ou crédités dans le pays de résidence.",
      en: "Registration duties (6% of the purchase price + 1% mortgage transcription fee) apply identically to residents and non-residents. However, the Bëllegen Akt tax credit (EUR 20,000 per person, i.e. EUR 40,000 per couple) is only granted for the acquisition of a primary residence personally occupied in Luxembourg. A non-resident buying for rental investment therefore cannot benefit. Moreover, non-residents are subject to Luxembourg income tax only on Luxembourg-source income (rental income, real estate capital gains). Bilateral tax treaties (France-Luxembourg, Belgium-Luxembourg, Germany-Luxembourg, etc.) prevent double taxation: rental income is generally taxed in the country where the property is located (Luxembourg), then exempted or credited in the country of residence.",
      de: "Die Registrierungsgebühren (6 % des Kaufpreises + 1 % Hypothekeneintragungsgebühr) gelten für Residenten und Nicht-Residenten gleichermaßen. Der Bëllegen Akt-Steuervorteil (20.000 € pro Person, also 40.000 € pro Paar) wird jedoch nur für den Erwerb eines selbst bewohnten Hauptwohnsitzes in Luxemburg gewährt. Ein Nicht-Resident, der zur Vermietung kauft, kann davon also nicht profitieren. Zudem unterliegen Nicht-Residenten der luxemburgischen Einkommensteuer nur auf ihre luxemburgischen Einkünfte (Mieteinnahmen, Immobilienveräußerungsgewinne). Bilaterale Doppelbesteuerungsabkommen (Frankreich-Luxemburg, Belgien-Luxemburg, Deutschland-Luxemburg usw.) vermeiden die Doppelbesteuerung: Mieteinnahmen werden in der Regel im Belegenheitsstaat (Luxemburg) besteuert und im Wohnsitzstaat freigestellt oder angerechnet.",
      lb: "D'Registréierungsgebühren (6 % vum Kafpräis + 1 % Hypothéikeregistréierungsgebühr) gëllen fir Residenten an Net-Residenten gläichméisseg. De Bëllegen Akt-Steiervirdeel (20.000 € pro Persoun, also 40.000 € pro Koppel) gëtt awer nëmmen fir den Erwierw vun engem selwer bewunnten Haaptwunnsëtz zu Lëtzebuerg accordéiert. En Net-Resident, deen zur Vermietung keeft, kann dovunner also net profitéieren. Zousätzlech ënnerleien Net-Residenten der Lëtzebuerger Akommessteier nëmmen op hir Lëtzebuerger Akommessen (Mietakommes, Immobilienveräusserungsgewënn). Bilateral Doppelbesteierungsofkommen (Frankräich-Lëtzebuerg, Belsch-Lëtzebuerg, Däitschland-Lëtzebuerg asw.) verhënneren d'Doppelbesteierung: Mietakommes gëtt an der Reegel am Belegenheetsland (Lëtzebuerg) besteit an am Wunnsëtzland fräigestallt oder ugerechent.",
      pt: "Os direitos de registo (6% do preço de aquisição + 1% de transcrição hipotecária) aplicam-se de forma idêntica a residentes e não residentes. Contudo, o crédito fiscal Bëllegen Akt (20.000 EUR por pessoa, ou 40.000 EUR por casal) só é concedido para a aquisição de uma residência principal ocupada pessoalmente no Luxemburgo. Um não residente que compre para investimento locativo não pode, portanto, beneficiar dele. Além disso, os não residentes estão sujeitos ao imposto sobre o rendimento luxemburguês apenas sobre os seus rendimentos de fonte luxemburguesa (rendimentos prediais, mais-valias imobiliárias). As convenções fiscais bilaterais (França-Luxemburgo, Bélgica-Luxemburgo, Alemanha-Luxemburgo, etc.) permitem evitar a dupla tributação: os rendimentos prediais são geralmente tributados no país de situação do bem (Luxemburgo) e depois isentos ou creditados no país de residência.",
    },
    section2Title: {
      fr: "Financement bancaire pour les non-résidents",
      en: "Bank Financing for Non-Residents",
      de: "Bankfinanzierung für Nicht-Residenten",
      lb: "Bankfinanzéierung fir Net-Residenten",
      pt: "Financiamento bancário para não residentes",
    },
    section2Content: {
      fr: "Les banques luxembourgeoises (Spuerkeess, BIL, BGL BNP Paribas, Raiffeisen, ING Luxembourg) acceptent de financer des non-résidents, mais avec des conditions plus restrictives. Le ratio prêt/valeur (LTV) est généralement réduit à 70-75 % pour un non-résident, contre 80-100 % pour un résident acquérant sa résidence principale. La banque exigera souvent un apport personnel de 25-30 %, une garantie hypothécaire de premier rang sur le bien luxembourgeois, et parfois des garanties complémentaires (nantissement d'épargne, caution personnelle). Les taux d'intérêt sont comparables à ceux proposés aux résidents, mais la durée maximale du prêt peut être réduite (20-25 ans au lieu de 30 ans). Il est recommandé de solliciter plusieurs établissements et de préparer un dossier solide incluant les 3 derniers avis d'imposition, les fiches de salaire, et un plan de financement détaillé.",
      en: "Luxembourg banks (Spuerkeess, BIL, BGL BNP Paribas, Raiffeisen, ING Luxembourg) accept to finance non-residents, but with stricter conditions. The loan-to-value (LTV) ratio is generally reduced to 70-75% for a non-resident, compared to 80-100% for a resident acquiring their primary residence. Banks will often require a 25-30% personal contribution, a first-rank mortgage on the Luxembourg property, and sometimes additional guarantees (pledged savings, personal surety). Interest rates are comparable to those offered to residents, but the maximum loan term may be reduced (20-25 years instead of 30 years). It is advisable to approach several institutions and prepare a solid file including the last 3 tax assessments, pay slips, and a detailed financing plan.",
      de: "Luxemburgische Banken (Spuerkeess, BIL, BGL BNP Paribas, Raiffeisen, ING Luxembourg) finanzieren auch Nicht-Residenten, allerdings mit strengeren Bedingungen. Die Beleihungsquote (LTV) wird für Nicht-Residenten in der Regel auf 70-75 % reduziert, gegenüber 80-100 % für Residenten beim Erwerb ihres Hauptwohnsitzes. Die Bank verlangt oft einen Eigenkapitalanteil von 25-30 %, eine erstrangige Hypothek auf die luxemburgische Immobilie und teilweise zusätzliche Sicherheiten (Sparverpfändung, persönliche Bürgschaft). Die Zinssätze sind vergleichbar mit denen für Residenten, aber die maximale Kreditlaufzeit kann verkürzt sein (20-25 Jahre statt 30 Jahre). Es empfiehlt sich, mehrere Institute anzufragen und eine solide Akte mit den letzten 3 Steuerbescheiden, Gehaltsabrechnungen und einem detaillierten Finanzierungsplan vorzubereiten.",
      lb: "Lëtzebuerger Banken (Spuerkeess, BIL, BGL BNP Paribas, Raiffeisen, ING Luxembourg) akzeptéieren Net-Residenten ze finanzéieren, awer mat méi strenge Konditiounen. Den LTV-Ratio gëtt fir Net-Residenten normalerweis op 70-75 % reduzéiert, am Géigesaz zu 80-100 % fir Residenten beim Kaf vun hirem Haaptwunnsëtz. D'Bank verlaangt dacks en Eegekapitalundeel vu 25-30 %, eng éischtrangeg Hypothéik op d'Lëtzebuerger Immobilie a heiansdo zousätzlech Sécherheeten (Spuerverplichtung, perséinlech Bürgschaft). D'Zënssätz si vergläichbar mat deene fir Residenten, awer d'maximal Kreditdauer kann verkierzt sinn (20-25 Joer amplaz 30 Joer). Et ass recommandéiert, verschidde Banken unzefroen an eng solid Akte mat den leschten 3 Steiererkläerungen, Gehaltsofrechungen an engem detailléierte Finanzéierungsplang virzebereeden.",
      pt: "Os bancos luxemburgueses (Spuerkeess, BIL, BGL BNP Paribas, Raiffeisen, ING Luxembourg) aceitam financiar não residentes, mas com condições mais restritivas. O rácio empréstimo/valor (LTV) é geralmente reduzido para 70-75% para um não residente, contra 80-100% para um residente que adquire a sua residência principal. O banco exigirá frequentemente um contributo pessoal de 25-30%, uma hipoteca de primeiro grau sobre o imóvel luxemburguês e por vezes garantias complementares (penhor de poupanças, caução pessoal). As taxas de juro são comparáveis às propostas aos residentes, mas a duração máxima do empréstimo pode ser reduzida (20-25 anos em vez de 30 anos). É aconselhável solicitar vários estabelecimentos e preparar um dossiê sólido incluindo as últimas 3 declarações fiscais, recibos de vencimento e um plano de financiamento detalhado.",
    },
    section3Title: {
      fr: "Déclaration des revenus fonciers au Luxembourg",
      en: "Declaring Rental Income in Luxembourg",
      de: "Deklaration der Mieteinnahmen in Luxemburg",
      lb: "Deklaratioun vun de Mietakommessen zu Lëtzebuerg",
      pt: "Declaração de rendimentos prediais no Luxemburgo",
    },
    section3Content: {
      fr: "Un non-résident qui met son bien luxembourgeois en location doit déposer une déclaration d'impôt sur le revenu au Luxembourg (déclaration modèle 100F pour les non-résidents). Les revenus fonciers nets (loyers perçus moins les charges déductibles : intérêts d'emprunt, assurance, travaux d'entretien, amortissement du bâtiment à 2 % par an) sont imposés au barème progressif luxembourgeois. Le taux marginal maximal est de 42 % (revenu imposable > 200.004 €), plus la contribution au fonds pour l'emploi (7-9 %). Les non-résidents bénéficient des mêmes déductions que les résidents sur leurs revenus fonciers luxembourgeois : intérêts débiteurs, frais d'obtention (Werbungskosten), amortissement du bâtiment. En cas de revente, la plus-value immobilière est taxée au Luxembourg selon les règles de l'article 99bis L.I.R. (taux quart du taux global après 2 ans de détention). La convention fiscale avec le pays de résidence évite la double imposition.",
      en: "A non-resident who rents out their Luxembourg property must file a Luxembourg income tax return (model 100F for non-residents). Net rental income (rents received minus deductible expenses: loan interest, insurance, maintenance works, building depreciation at 2% per year) is taxed at Luxembourg's progressive rate. The maximum marginal rate is 42% (taxable income > EUR 200,004), plus the employment fund contribution (7-9%). Non-residents benefit from the same deductions as residents on their Luxembourg rental income: debit interest, acquisition costs (Werbungskosten), building depreciation. In case of resale, the real estate capital gain is taxed in Luxembourg according to Article 99bis L.I.R. (quarter-rate of the global rate after 2 years of ownership). The tax treaty with the country of residence prevents double taxation.",
      de: "Ein Nicht-Resident, der seine luxemburgische Immobilie vermietet, muss eine luxemburgische Einkommensteuererklärung abgeben (Modell 100F für Nicht-Residenten). Die Nettomieteinnahmen (erhaltene Mieten abzüglich abzugsfähiger Ausgaben: Darlehenszinsen, Versicherung, Instandhaltungsarbeiten, Gebäudeabschreibung 2 % pro Jahr) werden nach dem luxemburgischen Progressionstarif besteuert. Der maximale Grenzsteuersatz beträgt 42 % (zu versteuerndes Einkommen > 200.004 €), zuzüglich Beschäftigungsfondsbeitrag (7-9 %). Nicht-Residenten profitieren von den gleichen Abzügen wie Residenten bei ihren luxemburgischen Mieteinnahmen: Schuldzinsen, Werbungskosten, Gebäudeabschreibung. Bei Weiterverkauf wird der Immobilienveräußerungsgewinn in Luxemburg nach Art. 99bis L.I.R. besteuert (Viertelsteuersatz nach 2 Jahren Besitz). Das Doppelbesteuerungsabkommen mit dem Wohnsitzstaat vermeidet die Doppelbesteuerung.",
      lb: "En Net-Resident, deen seng Lëtzebuerger Immobilie verméit, muss eng Lëtzebuerger Akommessteiererklärung ofginn (Modell 100F fir Net-Residenten). D'Nettomietakommessen (kritt Loyeren minus ofzuchsfäheg Ausgaben: Prêtszënsen, Versécherung, Ënnerhaltaarbechten, Gebaiofschreiwung 2 % pro Joer) ginn nom Lëtzebuerger Progressiounstarif besteit. De maximale Grenzstiersaz ass 42 % (ze versteierend Akommes > 200.004 €), zousätzlech de Beschäftegungsfongsbäitrag (7-9 %). Net-Residenten profitéieren vun deene selwechten Ofzich wéi Residenten bei hire Lëtzebuerger Mietakommessen: Scholdzënsen, Werbungskosten, Gebaiofschreiwung. Bei Weiderverkaf gëtt den Immobilienveräusserungsgewënn zu Lëtzebuerg no Art. 99bis L.I.R. besteit (Véiertelsteiersaz no 2 Joer Besëtz). D'Doppelbesteierungsofkommen mam Wunnsëtzland verhënnert d'Doppelbesteierung.",
      pt: "Um não residente que arrende o seu imóvel luxemburguês deve apresentar uma declaração de imposto sobre o rendimento no Luxemburgo (modelo 100F para não residentes). Os rendimentos prediais líquidos (rendas recebidas menos encargos dedutíveis: juros de empréstimo, seguro, obras de manutenção, amortização do edifício a 2% por ano) são tributados à taxa progressiva luxemburguesa. A taxa marginal máxima é de 42% (rendimento tributável > 200.004 EUR), mais a contribuição para o fundo de emprego (7-9%). Os não residentes beneficiam das mesmas deduções que os residentes sobre os seus rendimentos prediais luxemburgueses: juros devedores, custos de obtenção (Werbungskosten), amortização do edifício. Em caso de revenda, a mais-valia imobiliária é tributada no Luxemburgo segundo o artigo 99bis L.I.R. (taxa de um quarto da taxa global após 2 anos de detenção). A convenção fiscal com o país de residência evita a dupla tributação.",
    },
    relatedToolLabel: {
      fr: "Simuler les frais d'acquisition complets",
      en: "Simulate complete acquisition costs",
      de: "Komplette Erwerbskosten simulieren",
      lb: "Komplett Erwierbskäschte simuléieren",
      pt: "Simular custos de aquisição completos",
    },
    relatedToolLink: {
      fr: "/frais-acquisition",
      en: "/frais-acquisition",
      de: "/frais-acquisition",
      lb: "/frais-acquisition",
      pt: "/frais-acquisition",
    },
    faq1Q: {
      fr: "Un non-résident peut-il bénéficier du Bëllegen Akt ?",
      en: "Can a non-resident benefit from Bëllegen Akt?",
      de: "Kann ein Nicht-Resident vom Bëllegen Akt profitieren?",
      lb: "Kann en Net-Resident vum Bëllegen Akt profitéieren?",
      pt: "Um não residente pode beneficiar do Bëllegen Akt?",
    },
    faq1A: {
      fr: "Non, le Bëllegen Akt (crédit d'impôt de 20.000 € par acquéreur sur les droits d'enregistrement) est réservé à l'acquisition d'une résidence principale occupée personnellement au Luxembourg. Un non-résident qui achète pour investissement locatif ne peut pas en bénéficier et paie les droits d'enregistrement plein taux (6 % + 1 % de transcription).",
      en: "No, Bëllegen Akt (EUR 20,000 tax credit per buyer on registration duties) is reserved for acquiring a primary residence personally occupied in Luxembourg. A non-resident buying for rental investment cannot benefit and pays full registration duties (6% + 1% transcription).",
      de: "Nein, der Bëllegen Akt (Steuervorteil von 20.000 € pro Käufer auf die Registrierungsgebühren) ist dem Erwerb eines selbst bewohnten Hauptwohnsitzes in Luxemburg vorbehalten. Ein Nicht-Resident, der zur Vermietung kauft, kann nicht profitieren und zahlt die vollen Registrierungsgebühren (6 % + 1 % Eintragung).",
      lb: "Nee, de Bëllegen Akt (Steiervirdeel vu 20.000 € pro Keefer op d'Registréierungsgebühren) ass dem Erwierw vun engem selwer bewunnten Haaptwunnsëtz zu Lëtzebuerg virbehalten. En Net-Resident, deen zur Vermietung keeft, kann net profitéieren a bezuelt déi voll Registréierungsgebühren (6 % + 1 % Aschreiwung).",
      pt: "Não, o Bëllegen Akt (crédito fiscal de 20.000 EUR por adquirente sobre os direitos de registo) é reservado à aquisição de uma residência principal ocupada pessoalmente no Luxemburgo. Um não residente que compre para investimento locativo não pode beneficiar e paga os direitos de registo a taxa plena (6% + 1% de transcrição).",
    },
    faq2Q: {
      fr: "Quel apport minimum pour un non-résident au Luxembourg ?",
      en: "What is the minimum deposit for a non-resident in Luxembourg?",
      de: "Welchen Mindest-Eigenkapitalanteil braucht ein Nicht-Resident in Luxemburg?",
      lb: "Wéi vill Eegkapital brauch en Net-Resident zu Lëtzebuerg?",
      pt: "Qual é o contributo mínimo para um não residente no Luxemburgo?",
    },
    faq2A: {
      fr: "Les banques luxembourgeoises exigent généralement un apport personnel de 25 à 30 % du prix d'acquisition pour un non-résident (LTV de 70-75 %), contre parfois 0-20 % pour un résident acquérant sa résidence principale. Ce ratio varie selon la banque, le profil de l'emprunteur et la localisation du bien.",
      en: "Luxembourg banks generally require a personal contribution of 25-30% of the purchase price for a non-resident (LTV of 70-75%), compared to sometimes 0-20% for a resident acquiring their primary residence. This ratio varies by bank, borrower profile and property location.",
      de: "Luxemburgische Banken verlangen in der Regel einen Eigenkapitalanteil von 25-30 % des Kaufpreises für Nicht-Residenten (LTV 70-75 %), gegenüber teilweise 0-20 % für Residenten beim Erwerb ihres Hauptwohnsitzes. Dieses Verhältnis variiert je nach Bank, Kreditnehmerprofil und Lage der Immobilie.",
      lb: "Lëtzebuerger Banken verlaangen normalerweis en Eegekapitalundeel vu 25-30 % vum Kafpräis fir Net-Residenten (LTV 70-75 %), am Géigesaz zu heiansdo 0-20 % fir Residenten beim Kaf vun hirem Haaptwunnsëtz. Dëst Verhältnis variéiert jee no Bank, Kreditnehmerprofil an der Lag vun der Immobilie.",
      pt: "Os bancos luxemburgueses exigem geralmente um contributo pessoal de 25-30% do preço de aquisição para um não residente (LTV de 70-75%), contra por vezes 0-20% para um residente que adquire a sua residência principal. Este rácio varia consoante o banco, o perfil do mutuário e a localização do imóvel.",
    },
  },

  // === Guide: TVA 3% logement ===
  "guide.tva3Pourcent": {
    title: {
      fr: "Comment bénéficier de la TVA à 3 % sur un logement au Luxembourg ?",
      en: "How to Benefit from the 3% VAT on Housing in Luxembourg?",
      de: "Wie profitiert man von der 3 % MwSt. auf Wohnraum in Luxemburg?",
      lb: "Wéi profitéiert een vun der 3 % TVA op Wunnraum zu Lëtzebuerg?",
      pt: "Como beneficiar da TVA a 3 % sobre uma habitação no Luxemburgo?",
    },
    metaDescription: {
      fr: "TVA à 3 % au Luxembourg : taux super-réduit logement, conditions, surface max 400 m², demande AED, VEFA, plafond 50.000 € d'avantage. Guide complet.",
      en: "3% VAT in Luxembourg: super-reduced rate for housing, conditions, max 400 m², AED application, VEFA, EUR 50,000 benefit cap. Complete guide.",
      de: "3 % MwSt. in Luxemburg: super-ermäßigter Satz für Wohnraum, Bedingungen, max. 400 m², AED-Antrag, VEFA, 50.000 € Vorteilsgrenze. Kompletter Ratgeber.",
      lb: "3 % TVA zu Lëtzebuerg: super-reduzéierte Saz fir Wunnraum, Bedingungen, max. 400 m², AED-Demande, VEFA, 50.000 € Virdeelsgrenz. Komplette Guide.",
      pt: "TVA a 3 % no Luxemburgo: taxa super-reduzida habitação, condições, superfície máx. 400 m², pedido AED, VEFA, teto de 50.000 € de vantagem. Guia completo.",
    },
    intro: {
      fr: "Le Luxembourg applique un taux de TVA super-réduit de 3 % (au lieu du taux normal de 17 %) sur la construction, la rénovation et l'acquisition de logements affectés à l'habitation. Ce taux préférentiel, prévu par la loi TVA modifiée et le règlement grand-ducal du 30 juillet 2002, constitue un avantage fiscal significatif pouvant atteindre 50.000 € par logement. Voici les conditions à remplir et la procédure à suivre pour en bénéficier.",
      en: "Luxembourg applies a super-reduced VAT rate of 3% (instead of the standard 17%) on the construction, renovation and acquisition of residential housing. This preferential rate, provided by the modified VAT law and the Grand Ducal Regulation of 30 July 2002, constitutes a significant tax advantage of up to EUR 50,000 per dwelling. Here are the conditions and procedure to benefit from it.",
      de: "Luxemburg wendet einen super-ermäßigten MwSt.-Satz von 3 % (statt des Normalsatzes von 17 %) auf den Bau, die Renovierung und den Erwerb von Wohnimmobilien an. Dieser Vorzugssatz, vorgesehen durch das geänderte MwSt.-Gesetz und das Großherzogliche Reglement vom 30. Juli 2002, stellt einen erheblichen Steuervorteil von bis zu 50.000 € pro Wohnung dar. Hier die Bedingungen und das Verfahren, um davon zu profitieren.",
      lb: "Lëtzebuerg applizéiert en super-reduzéierte TVA-Saz vu 3 % (amplaz dem Normalsaz vun 17 %) op de Bau, d'Renovéierung an den Erwierw vu Wunnimmobilien. Dësen Virzouchssaz, virgesinn duerch d'geännert TVA-Gesetz an d'Groussherzoglecht Reglement vum 30. Juli 2002, stellt en erhiebleche Steiervirdeel vun bis zu 50.000 € pro Wunneng duer. Hei d'Bedingungen an d'Prozedur fir dovunner ze profitéieren.",
      pt: "O Luxemburgo aplica uma taxa de TVA super-reduzida de 3% (em vez da taxa normal de 17%) sobre a construção, renovação e aquisição de habitações afetas a uso residencial. Esta taxa preferencial, prevista pela lei TVA modificada e pelo regulamento grão-ducal de 30 de julho de 2002, constitui uma vantagem fiscal significativa que pode atingir 50.000 EUR por habitação. Eis as condições a cumprir e o procedimento a seguir para dela beneficiar.",
    },
    section1Title: {
      fr: "Conditions d'application du taux de 3 %",
      en: "Conditions for the 3% Rate",
      de: "Bedingungen für den 3 %-Satz",
      lb: "Bedingunge fir den 3 %-Saz",
      pt: "Condições de aplicação da taxa de 3 %",
    },
    section1Content: {
      fr: "Le taux super-réduit de 3 % s'applique sous plusieurs conditions cumulatives. Le logement doit être affecté à des fins d'habitation (résidence principale ou secondaire, location résidentielle). La surface habitable ne doit pas dépasser 400 m² ; au-delà, le taux de 17 % s'applique sur l'excédent de surface. Le bénéficiaire doit obtenir une autorisation préalable de l'Administration de l'enregistrement, des domaines et de la TVA (AED) avant le début des travaux ou la signature de l'acte d'acquisition. Les travaux doivent concerner la création de logement (construction neuve, transformation) ou la rénovation/réparation d'un logement existant de plus de 20 ans (certaines prestations). Les locaux commerciaux, bureaux et garages non attenants au logement restent au taux normal de 17 %.",
      en: "The super-reduced 3% rate applies under several cumulative conditions. The dwelling must be used for residential purposes (primary or secondary residence, residential rental). The habitable surface must not exceed 400 m²; beyond this, the 17% rate applies to the excess area. The beneficiary must obtain prior authorization from the Registration, Domains and VAT Administration (AED) before work begins or the acquisition deed is signed. Works must concern the creation of housing (new construction, conversion) or the renovation/repair of an existing dwelling over 20 years old (certain services). Commercial premises, offices and garages not attached to the dwelling remain at the standard 17% rate.",
      de: "Der super-ermäßigte Satz von 3 % gilt unter mehreren kumulativen Bedingungen. Die Wohnung muss Wohnzwecken dienen (Haupt- oder Zweitwohnsitz, Wohnvermietung). Die Wohnfläche darf 400 m² nicht überschreiten; darüber hinaus gilt der Satz von 17 % auf die überschüssige Fläche. Der Begünstigte muss vor Baubeginn oder Unterzeichnung des Erwerbsakts eine Vorabgenehmigung der Registrierungs-, Domänen- und MwSt.-Verwaltung (AED) einholen. Die Arbeiten müssen die Schaffung von Wohnraum (Neubau, Umbau) oder die Renovierung/Reparatur einer bestehenden Wohnung über 20 Jahre (bestimmte Leistungen) betreffen. Geschäftsräume, Büros und nicht zur Wohnung gehörende Garagen unterliegen weiterhin dem Normalsatz von 17 %.",
      lb: "De super-reduzéierte Saz vu 3 % gëllt ënner verschiddene kumulativen Bedingungen. D'Wunneng muss Wunnzwecker déngen (Haaptwunnsëtz oder Zweetwunnsëtz, Wunnvermietung). D'Wunnfläch däerf 400 m² net iwwerschreiden; doriwwer eraus gëllt den 17 %-Saz op déi iwwerschësseg Fläch. De Begënschtegten muss virum Baubeginn oder der Ënnerschrëft vum Erwierbsakt eng Virausgenehmegung vun der Registréierungs-, Domänen- an TVA-Verwaltung (AED) ahuelen. D'Aarbechten mussen d'Schaafung vu Wunnraum (Neibau, Ëmbau) oder d'Renovéierung/Reparatur vun enger besteeënder Wunneng iwwer 20 Joer (bestëmmte Leeschtungen) betreffen. Geschäftsraim, Büroen a Garagen déi net zur Wunneng gehéieren bleiwen um Normalsaz vu 17 %.",
      pt: "A taxa super-reduzida de 3% aplica-se sob várias condições cumulativas. A habitação deve ser afeta a fins residenciais (residência principal ou secundária, arrendamento residencial). A superfície habitável não deve ultrapassar 400 m²; além disso, a taxa de 17% aplica-se à superfície excedente. O beneficiário deve obter uma autorização prévia da Administração do Registo, Domínios e TVA (AED) antes do início das obras ou da assinatura da escritura de aquisição. As obras devem respeitar à criação de habitação (construção nova, transformação) ou à renovação/reparação de uma habitação existente com mais de 20 anos (certas prestações). Os locais comerciais, escritórios e garagens não anexas à habitação permanecem na taxa normal de 17%.",
    },
    section2Title: {
      fr: "Procédure de demande auprès de l'AED",
      en: "Application Procedure with the AED",
      de: "Antragsverfahren bei der AED",
      lb: "Demandeprozedur bei der AED",
      pt: "Procedimento de pedido junto da AED",
    },
    section2Content: {
      fr: "La demande d'application du taux de 3 % doit être adressée à l'AED (Administration de l'enregistrement, des domaines et de la TVA) avant le début des travaux. Le formulaire de demande (disponible sur guichet.lu) doit être accompagné des plans du logement, du permis de construire, et d'une estimation du coût des travaux. L'AED délivre une décision d'agrément qui précise le montant maximum de TVA pouvant bénéficier du taux réduit. Pour un acquéreur en VEFA (vente en l'état futur d'achèvement), le promoteur facture directement la TVA à 3 % sur la partie logement (dans la limite de 400 m²). Pour un constructeur individuel, les artisans facturent à 17 % et le maître d'ouvrage demande le remboursement de la différence (14 points) à l'AED. Le plafond de l'avantage TVA est fixé à 50.000 € par logement, ce qui correspond à un montant de travaux hors TVA d'environ 357.000 € bénéficiant du taux réduit.",
      en: "The application for the 3% rate must be submitted to the AED (Registration, Domains and VAT Administration) before work begins. The application form (available on guichet.lu) must include housing plans, the building permit, and a cost estimate. The AED issues an approval decision specifying the maximum VAT amount eligible for the reduced rate. For a VEFA buyer (off-plan purchase), the developer invoices 3% VAT directly on the housing portion (up to 400 m²). For individual builders, tradespeople invoice at 17% and the owner claims the difference (14 points) from the AED. The VAT benefit cap is set at EUR 50,000 per dwelling, corresponding to approximately EUR 357,000 of works excluding VAT benefiting from the reduced rate.",
      de: "Der Antrag auf Anwendung des 3 %-Satzes muss vor Baubeginn bei der AED (Registrierungs-, Domänen- und MwSt.-Verwaltung) eingereicht werden. Dem Antragsformular (verfügbar auf guichet.lu) sind die Wohnungspläne, die Baugenehmigung und eine Kostenschätzung beizufügen. Die AED erteilt einen Genehmigungsbescheid, der den maximalen MwSt.-Betrag zum ermäßigten Satz festlegt. Bei einem VEFA-Käufer (Kauf vom Plan) berechnet der Bauträger die MwSt. direkt zu 3 % auf den Wohnanteil (bis 400 m²). Bei Einzelbauherren berechnen Handwerker 17 % und der Bauherr beantragt die Erstattung der Differenz (14 Punkte) bei der AED. Die MwSt.-Vorteilsgrenze liegt bei 50.000 € pro Wohnung, was einem Bauleistungsbetrag ohne MwSt. von etwa 357.000 € zum ermäßigten Satz entspricht.",
      lb: "D'Demande fir d'Uwendung vum 3 %-Saz muss virum Baubeginn bei der AED (Registréierungs-, Domänen- an TVA-Verwaltung) agereecht ginn. Dem Demandeformulaire (verfügbar op guichet.lu) mussen d'Wunnengspläng, d'Baugenehmegung an eng Käschteschätzung bäigeleet ginn. D'AED stellt eng Genehmegungsdecisioun aus, déi de maximale TVA-Betrag zum reduzéierte Saz festleet. Bei engem VEFA-Keefer (Kaf vum Plang) berechent de Promoteur d'TVA direkt zu 3 % op de Wunnundeel (bis 400 m²). Bei Eenzelbauherrë berechne Handwierker 17 % an de Bauherr freet d'Erstattung vun der Differenz (14 Punkten) bei der AED un. D'TVA-Virdeelsgrenz läit bei 50.000 € pro Wunneng, wat engem Bauleeschtungsbetrag ouni TVA vu ronn 357.000 € zum reduzéierte Saz entsprécht.",
      pt: "O pedido de aplicação da taxa de 3% deve ser dirigido à AED (Administração do Registo, Domínios e TVA) antes do início das obras. O formulário de pedido (disponível em guichet.lu) deve ser acompanhado das plantas da habitação, da licença de construção e de uma estimativa do custo das obras. A AED emite uma decisão de aprovação que precisa o montante máximo de TVA que pode beneficiar da taxa reduzida. Para um adquirente em VEFA (venda no estado futuro de acabamento), o promotor fatura diretamente a TVA a 3% sobre a parte habitacional (no limite de 400 m²). Para um construtor individual, os artesãos faturam a 17% e o dono de obra pede o reembolso da diferença (14 pontos) à AED. O teto da vantagem TVA está fixado em 50.000 EUR por habitação, o que corresponde a um montante de obras sem TVA de aproximadamente 357.000 EUR beneficiando da taxa reduzida.",
    },
    section3Title: {
      fr: "Cas particuliers : rénovation et logements locatifs",
      en: "Special Cases: Renovation and Rental Housing",
      de: "Sonderfälle: Renovierung und Mietwohnungen",
      lb: "Spezielfäll: Renovéierung a Mietwunnengen",
      pt: "Casos particulares: renovação e habitações para arrendamento",
    },
    section3Content: {
      fr: "La TVA à 3 % s'applique également à la rénovation de logements existants, sans condition d'ancienneté minimale du bâtiment pour les travaux de création de logement (transformation d'un local commercial en habitation, par exemple). Pour les travaux de réparation et entretien, le logement doit avoir plus de 20 ans et les travaux doivent être réalisés par un professionnel. Les propriétaires bailleurs bénéficient aussi du taux de 3 % sur les logements qu'ils mettent en location résidentielle, à condition que le locataire y établisse sa résidence. L'avantage est plafonné à 50.000 € par logement, tous travaux confondus sur la durée de vie du bien. Les travaux de démolition-reconstruction totale sont assimilés à une construction neuve et bénéficient du taux réduit. En revanche, l'aménagement de jardins, piscines et autres équipements de luxe extérieurs reste au taux de 17 %.",
      en: "The 3% VAT also applies to renovation of existing dwellings, with no minimum building age requirement for housing creation works (converting commercial premises to residential, for example). For repair and maintenance works, the dwelling must be over 20 years old and works must be carried out by a professional. Landlords also benefit from the 3% rate on properties they rent as residential housing, provided the tenant establishes their residence there. The benefit is capped at EUR 50,000 per dwelling, all works combined over the property's lifetime. Total demolition-reconstruction works are treated as new construction and benefit from the reduced rate. However, landscaping, swimming pools and other luxury exterior amenities remain at 17%.",
      de: "Die 3 % MwSt. gilt auch für die Renovierung bestehender Wohnungen, ohne Mindestalter des Gebäudes für Wohnraumschaffung (z.B. Umbau von Geschäftsräumen in Wohnraum). Für Reparatur- und Instandhaltungsarbeiten muss die Wohnung über 20 Jahre alt sein und die Arbeiten von einem Fachmann ausgeführt werden. Vermieter profitieren ebenfalls vom 3 %-Satz bei Wohnungen, die sie als Wohnraum vermieten, sofern der Mieter dort seinen Wohnsitz begründet. Der Vorteil ist auf 50.000 € pro Wohnung gedeckelt, alle Arbeiten zusammen über die Lebensdauer der Immobilie. Totaler Abriss und Wiederaufbau werden als Neubau behandelt und profitieren vom ermäßigten Satz. Gartengestaltung, Schwimmbäder und andere Luxus-Außenausstattungen bleiben bei 17 %.",
      lb: "D'3 % TVA gëllt och fir d'Renovéierung vu besteeënde Wunnengen, ouni Mindestalter vum Gebai fir Wunnraumschafung (z.B. Ëmbau vu Geschäftsraim an Wunnraum). Fir Reparatur- an Ënnerhaltaarbechten muss d'Wunneng iwwer 20 Joer al sinn an d'Aarbechte vun engem Fachmann ausgefouert ginn. Vermieter profitéieren och vum 3 %-Saz bei Wunnengen, déi si als Wunnraum verméiden, wann de Locataire do säi Wunnsëtz begrënnt. De Virdeel ass op 50.000 € pro Wunneng gedeckelt, all Aarbechte zesummen iwwer d'Liewensdauer vun der Immobilie. Totalen Ofrass an Neiopbau gëtt als Neibau behandelt a profitéiert vum reduzéierte Saz. Gardegestaltung, Schwämmbidden an aner Luxus-Baussenaustattunge bleiwen op 17 %.",
      pt: "A TVA a 3% aplica-se igualmente à renovação de habitações existentes, sem condição de antiguidade mínima do edifício para obras de criação de habitação (transformação de um local comercial em habitação, por exemplo). Para obras de reparação e manutenção, a habitação deve ter mais de 20 anos e as obras devem ser realizadas por um profissional. Os proprietários senhorios beneficiam também da taxa de 3% sobre as habitações que colocam em arrendamento residencial, desde que o inquilino aí estabeleça a sua residência. A vantagem é limitada a 50.000 EUR por habitação, todas as obras incluídas ao longo da vida útil do bem. As obras de demolição-reconstrução total são equiparadas a construção nova e beneficiam da taxa reduzida. Em contrapartida, o arranjo de jardins, piscinas e outros equipamentos de luxo exteriores permanece na taxa de 17%.",
    },
    relatedToolLabel: {
      fr: "Simuler un achat en VEFA",
      en: "Simulate a VEFA purchase",
      de: "Einen VEFA-Kauf simulieren",
      lb: "E VEFA-Kaf simuléieren",
      pt: "Simular uma compra em VEFA",
    },
    relatedToolLink: {
      fr: "/vefa",
      en: "/vefa",
      de: "/vefa",
      lb: "/vefa",
      pt: "/vefa",
    },
    faq1Q: {
      fr: "Quel est le plafond de l'avantage TVA à 3 % au Luxembourg ?",
      en: "What is the 3% VAT benefit cap in Luxembourg?",
      de: "Wie hoch ist die MwSt.-Vorteilsgrenze von 3 % in Luxemburg?",
      lb: "Wéi héich ass d'TVA-Virdeelsgrenz vun 3 % zu Lëtzebuerg?",
      pt: "Qual é o teto da vantagem TVA a 3 % no Luxemburgo?",
    },
    faq1A: {
      fr: "Le plafond de l'avantage TVA est de 50.000 € par logement. Cela signifie que la différence entre la TVA à 17 % et la TVA à 3 % ne peut pas dépasser 50.000 €, ce qui correspond à environ 357.000 € de travaux hors TVA bénéficiant du taux réduit. Au-delà, le taux normal de 17 % s'applique.",
      en: "The VAT benefit cap is EUR 50,000 per dwelling. This means the difference between 17% VAT and 3% VAT cannot exceed EUR 50,000, corresponding to approximately EUR 357,000 of works excluding VAT at the reduced rate. Beyond this, the standard 17% rate applies.",
      de: "Die MwSt.-Vorteilsgrenze beträgt 50.000 € pro Wohnung. Das bedeutet, die Differenz zwischen 17 % und 3 % MwSt. darf 50.000 € nicht überschreiten, was etwa 357.000 € Bauleistungen ohne MwSt. zum ermäßigten Satz entspricht. Darüber hinaus gilt der Normalsatz von 17 %.",
      lb: "D'TVA-Virdeelsgrenz ass 50.000 € pro Wunneng. Dat bedeit, d'Differenz tëschent 17 % an 3 % TVA däerf 50.000 € net iwwerschreiden, wat ongeféier 357.000 € Bauleeschtungen ouni TVA zum reduzéierte Saz entsprécht. Doriwwer eraus gëllt den Normalsaz vun 17 %.",
      pt: "O teto da vantagem TVA é de 50.000 EUR por habitação. Isto significa que a diferença entre a TVA a 17% e a TVA a 3% não pode exceder 50.000 EUR, o que corresponde a aproximadamente 357.000 EUR de obras sem TVA beneficiando da taxa reduzida. Além disso, aplica-se a taxa normal de 17%.",
    },
    faq2Q: {
      fr: "Faut-il une autorisation préalable pour la TVA à 3 % ?",
      en: "Is prior authorization required for the 3% VAT?",
      de: "Ist eine Vorabgenehmigung für die 3 % MwSt. erforderlich?",
      lb: "Brauch een eng Virausgenehmegung fir d'3 % TVA?",
      pt: "É necessária uma autorização prévia para a TVA a 3 %?",
    },
    faq2A: {
      fr: "Oui, une demande préalable doit être adressée à l'AED (Administration de l'enregistrement, des domaines et de la TVA) avant le début des travaux. Sans cette autorisation, les artisans doivent facturer au taux normal de 17 %. Le formulaire est disponible sur guichet.lu et doit être accompagné des plans, du permis de construire et d'une estimation des coûts.",
      en: "Yes, a prior application must be submitted to the AED (Registration, Domains and VAT Administration) before work begins. Without this authorization, tradespeople must invoice at the standard 17% rate. The form is available on guichet.lu and must include plans, building permit and cost estimate.",
      de: "Ja, ein Vorabantrag muss vor Baubeginn bei der AED (Registrierungs-, Domänen- und MwSt.-Verwaltung) eingereicht werden. Ohne diese Genehmigung müssen Handwerker zum Normalsatz von 17 % abrechnen. Das Formular ist auf guichet.lu verfügbar und muss Pläne, Baugenehmigung und Kostenschätzung enthalten.",
      lb: "Jo, eng Viraudemande muss virum Baubeginn bei der AED (Registréierungs-, Domänen- an TVA-Verwaltung) agereecht ginn. Ouni dës Genehmegung musse Handwierker zum Normalsaz vu 17 % ofrechnen. De Formulaire ass op guichet.lu verfügbar a muss Pläng, Baugenehmegung an eng Käschteschätzung enthalen.",
      pt: "Sim, um pedido prévio deve ser dirigido à AED (Administração do Registo, Domínios e TVA) antes do início das obras. Sem esta autorização, os artesãos devem faturar à taxa normal de 17%. O formulário está disponível em guichet.lu e deve incluir plantas, licença de construção e estimativa de custos.",
    },
  },

  // === Guide: Bail commercial ===
  "guide.bailCommercial": {
    title: {
      fr: "Quelles sont les règles du bail commercial au Luxembourg ?",
      en: "What Are the Rules for Commercial Leases in Luxembourg?",
      de: "Welche Regeln gelten für Geschäftsmietverträge in Luxemburg?",
      lb: "Wéi eng Reegele gëllen fir Geschäftsmietverträg zu Lëtzebuerg?",
      pt: "Quais são as regras do arrendamento comercial no Luxemburgo?",
    },
    metaDescription: {
      fr: "Bail commercial au Luxembourg : loi 03.02.2018, durée minimale 9 ans, résiliation triennale, indexation IPC STATEC, pas-de-porte, droit au renouvellement. Guide complet.",
      en: "Commercial lease in Luxembourg: law of 03.02.2018, minimum 9-year term, triennial termination, CPI STATEC indexation, key money, renewal rights. Complete guide.",
      de: "Geschäftsmietvertrag in Luxemburg: Gesetz vom 03.02.2018, Mindestlaufzeit 9 Jahre, dreijährliche Kündigung, VPI-STATEC-Indexierung, Schlüsselgeld, Erneuerungsrecht. Kompletter Ratgeber.",
      lb: "Geschäftsmietvertrag zu Lëtzebuerg: Gesetz vum 03.02.2018, Mindestlafzäit 9 Joer, dräijährlech Kënnegung, VPI-STATEC-Indexéierung, Schlësselgeld, Erneierungsrecht. Komplette Guide.",
      pt: "Arrendamento comercial no Luxemburgo: lei de 03.02.2018, duração mínima 9 anos, rescisão trienal, indexação IPC STATEC, trespasse, direito à renovação. Guia completo.",
    },
    intro: {
      fr: "Le bail commercial au Luxembourg est régi par la loi du 3 février 2018 portant sur le bail commercial, entrée en vigueur le 1er avril 2018. Cette loi a profondément modernisé le cadre juridique des baux commerciaux, qui relevait auparavant du seul Code civil. Elle instaure une durée minimale de 9 ans, un droit au renouvellement pour le locataire, une indexation encadrée des loyers et des règles de résiliation spécifiques. Ce guide présente les règles essentielles pour les bailleurs et locataires de locaux commerciaux au Luxembourg.",
      en: "Commercial leases in Luxembourg are governed by the law of 3 February 2018 on commercial leases, which came into force on 1 April 2018. This law profoundly modernized the legal framework for commercial leases, which previously fell solely under the Civil Code. It establishes a minimum 9-year term, a renewal right for the tenant, regulated rent indexation, and specific termination rules. This guide presents the essential rules for landlords and tenants of commercial premises in Luxembourg.",
      de: "Der Geschäftsmietvertrag in Luxemburg wird durch das Gesetz vom 3. Februar 2018 über den Geschäftsmietvertrag geregelt, das am 1. April 2018 in Kraft trat. Dieses Gesetz hat den Rechtsrahmen für Geschäftsmietverträge, der zuvor nur dem Zivilgesetzbuch unterlag, grundlegend modernisiert. Es führt eine Mindestlaufzeit von 9 Jahren, ein Erneuerungsrecht für den Mieter, eine geregelte Mietindexierung und spezifische Kündigungsregeln ein. Dieser Ratgeber stellt die wesentlichen Regeln für Vermieter und Mieter von Geschäftsräumen in Luxemburg vor.",
      lb: "De Geschäftsmietvertrag zu Lëtzebuerg gëtt duerch d'Gesetz vum 3. Februar 2018 iwwer de Geschäftsmietvertrag gereegelt, dat den 1. Abrëll 2018 a Kraaft getrueden ass. Dëst Gesetz huet de Rechtsrahme fir Geschäftsmietverträg, deen virdru just dem Code civil ënnerlouch, grondsätzlech moderniséiert. Et féiert eng Mindestlafzäit vu 9 Joer, en Erneierungsrecht fir de Locataire, eng gereegelt Mietindexéierung a spezifesch Kënnegungsreegelen an. Dëse Guide stellt déi wesentlech Reegele fir Vermieter a Locatairen vu Geschäftsraim zu Lëtzebuerg vir.",
      pt: "O arrendamento comercial no Luxemburgo é regido pela lei de 3 de fevereiro de 2018 sobre o arrendamento comercial, que entrou em vigor a 1 de abril de 2018. Esta lei modernizou profundamente o enquadramento jurídico dos arrendamentos comerciais, que anteriormente dependia apenas do Código Civil. Estabelece uma duração mínima de 9 anos, um direito à renovação para o inquilino, uma indexação enquadrada das rendas e regras de rescisão específicas. Este guia apresenta as regras essenciais para senhorios e inquilinos de locais comerciais no Luxemburgo.",
    },
    section1Title: {
      fr: "Durée, résiliation triennale et préavis",
      en: "Duration, Triennial Termination and Notice",
      de: "Dauer, dreijährliche Kündigung und Kündigungsfrist",
      lb: "Dauer, dräijährlech Kënnegung a Kënnegungsfrist",
      pt: "Duração, rescisão trienal e pré-aviso",
    },
    section1Content: {
      fr: "La loi du 3 février 2018 impose une durée minimale de 9 ans pour tout bail commercial (art. 2). Les parties peuvent convenir d'une durée plus longue, mais jamais inférieure. Le locataire bénéficie d'un droit de résiliation triennale : il peut mettre fin au bail à l'expiration de chaque période triennale (3, 6, 9 ans) moyennant un préavis de 6 mois, notifié par acte extrajudiciaire ou lettre recommandée (art. 4). Le bailleur ne peut résilier le bail pendant sa durée que dans des cas limitativement énumérés : manquement grave du locataire, besoin personnel d'exploitation du bailleur (sous conditions strictes), ou travaux de démolition/reconstruction intégrale. Le non-renouvellement à l'échéance du bail doit également être notifié 6 mois à l'avance. Le bail se renouvelle par tacite reconduction pour une durée de 9 ans si aucune des parties ne signifie son refus de renouvellement.",
      en: "The law of 3 February 2018 imposes a minimum 9-year term for all commercial leases (Art. 2). Parties may agree on a longer term, but never shorter. The tenant benefits from a triennial termination right: they may end the lease at the expiry of each 3-year period (3, 6, 9 years) with 6 months' notice, served by extrajudicial act or registered letter (Art. 4). The landlord may only terminate during the lease term in exhaustively listed cases: serious tenant breach, landlord's personal need for business operation (under strict conditions), or total demolition/reconstruction works. Non-renewal at lease expiry must also be notified 6 months in advance. The lease renews by tacit renewal for 9 years if neither party gives notice of non-renewal.",
      de: "Das Gesetz vom 3. Februar 2018 schreibt eine Mindestlaufzeit von 9 Jahren für alle Geschäftsmietverträge vor (Art. 2). Die Parteien können eine längere, aber niemals kürzere Laufzeit vereinbaren. Der Mieter hat ein dreijährliches Kündigungsrecht: Er kann den Mietvertrag am Ende jeder Dreijahresperiode (3, 6, 9 Jahre) mit 6 Monaten Kündigungsfrist per Gerichtsvollzieherakt oder Einschreiben kündigen (Art. 4). Der Vermieter kann während der Laufzeit nur in abschließend aufgezählten Fällen kündigen: schwerer Vertragsverstoß des Mieters, persönlicher Geschäftsbedarf des Vermieters (unter strengen Bedingungen) oder totale Abriss-/Wiederaufbauarbeiten. Die Nichterneuerung bei Ablauf muss ebenfalls 6 Monate im Voraus mitgeteilt werden. Der Vertrag verlängert sich durch stillschweigende Erneuerung um 9 Jahre, wenn keine Partei die Nichterneuerung erklärt.",
      lb: "D'Gesetz vum 3. Februar 2018 schreift eng Mindestlafzäit vu 9 Joer fir all Geschäftsmietverträg vir (Art. 2). D'Parteien kënnen eng méi laang, awer ni eng méi kuerz Lafzäit vereinbaren. De Locataire huet en dräijährlechen Kënnegungsrecht: Hien kann de Mietvertrag um Enn vun all Dräijoresperiod (3, 6, 9 Joer) mat 6 Méint Kënnegungsfrist per Gerichtsvolzéieraktioun oder Recommandé kënnegen (Art. 4). De Vermieter kann während der Lafzäit nëmmen a limitativ opgelëschte Fäll kënnegen: schwéiere Vertragsverstouss vum Locataire, perséinleche Geschäftsbedarf vum Vermieter (ënner strenge Bedingungen) oder total Ofrass-/Neiaufbauaarbechten. D'Neterneierung um Enn vum Bail muss och 6 Méint am Viraus matgedeelt ginn. De Vertrag verlängert sech duerch stëllschweigend Erneierung ëm 9 Joer, wann keng Partei d'Neterneierung erkläert.",
      pt: "A lei de 3 de fevereiro de 2018 impõe uma duração mínima de 9 anos para todo arrendamento comercial (art. 2). As partes podem acordar uma duração mais longa, mas nunca inferior. O inquilino beneficia de um direito de rescisão trienal: pode pôr fim ao arrendamento no termo de cada período trienal (3, 6, 9 anos) mediante pré-aviso de 6 meses, notificado por ato extrajudicial ou carta registada (art. 4). O senhorio só pode rescindir durante a vigência do arrendamento em casos taxativamente enumerados: incumprimento grave do inquilino, necessidade pessoal de exploração do senhorio (sob condições estritas), ou obras de demolição/reconstrução integral. A não renovação no termo do arrendamento deve igualmente ser notificada com 6 meses de antecedência. O arrendamento renova-se por tácita recondução por 9 anos se nenhuma das partes notificar a sua recusa de renovação.",
    },
    section2Title: {
      fr: "Loyer, indexation et pas-de-porte",
      en: "Rent, Indexation and Key Money",
      de: "Miete, Indexierung und Schlüsselgeld",
      lb: "Loyer, Indexéierung a Schlësselgeld",
      pt: "Renda, indexação e trespasse",
    },
    section2Content: {
      fr: "Contrairement au bail d'habitation, le loyer commercial n'est pas plafonné par la règle des 5 % du capital investi (art. 3 loi 21.09.2006 sur le bail d'habitation). Le loyer est fixé librement entre les parties selon les conditions du marché. L'indexation du loyer commercial est liée à l'indice des prix à la consommation (IPC) publié par le STATEC, et non à un indice des loyers commerciaux (ILC) comme en France. La clause d'indexation doit être expressément prévue dans le bail ; à défaut, le loyer reste fixe. La révision du loyer peut être demandée par chaque partie à l'expiration de chaque période triennale si le loyer ne correspond plus à la valeur locative réelle (art. 7). Le pas-de-porte (ou droit d'entrée) est licite au Luxembourg : le bailleur peut exiger un versement initial en contrepartie des avantages commerciaux liés à l'emplacement. Ce montant n'est pas réglementé et se négocie librement.",
      en: "Unlike residential leases, commercial rent is not capped by the 5% rule of invested capital (Art. 3, law of 21.09.2006 on residential leases). Rent is freely set between parties according to market conditions. Commercial rent indexation is linked to the Consumer Price Index (CPI) published by STATEC, not to a commercial rent index (ILC) as in France. The indexation clause must be expressly provided in the lease; otherwise, rent remains fixed. Rent review may be requested by either party at the end of each 3-year period if the rent no longer corresponds to actual rental value (Art. 7). Key money (pas-de-porte) is lawful in Luxembourg: the landlord may require an initial payment in exchange for the commercial advantages of the location. This amount is unregulated and freely negotiated.",
      de: "Anders als bei Wohnmietverträgen ist die Geschäftsmiete nicht durch die 5 %-Regel des investierten Kapitals gedeckelt (Art. 3, Gesetz vom 21.09.2006 über Wohnraummiete). Die Miete wird frei zwischen den Parteien nach Marktbedingungen vereinbart. Die Indexierung der Geschäftsmiete ist an den Verbraucherpreisindex (VPI) des STATEC gekoppelt, nicht an einen Geschäftsmietindex (ILC) wie in Frankreich. Die Indexierungsklausel muss ausdrücklich im Mietvertrag vorgesehen sein; andernfalls bleibt die Miete fest. Eine Mietüberprüfung kann von jeder Partei am Ende jeder Dreijahresperiode verlangt werden, wenn die Miete nicht mehr dem tatsächlichen Mietwert entspricht (Art. 7). Schlüsselgeld (pas-de-porte) ist in Luxemburg zulässig: Der Vermieter kann eine Anfangszahlung als Gegenleistung für die Geschäftsvorteile der Lage verlangen. Dieser Betrag ist nicht reguliert und frei verhandelbar.",
      lb: "Am Géigesaz zum Wunnengsmietvertrag ass de Geschäftsloyer net duerch d'5 %-Reegel vum investéierte Kapital gedeckelt (Art. 3, Gesetz vum 21.09.2006 iwwer d'Wunnraumvermietung). De Loyer gëtt fräi tëschent de Parteien no Maartkonditionne festgesat. D'Indexéierung vum Geschäftsloyer ass un de Konsumerverbraucherindex (VPI) vum STATEC gekoppelt, net un e Geschäftsloyerindex (ILC) wéi a Frankräich. D'Indexéierungsklausel muss ausdrécklesch am Mietvertrag virgesinn sinn; soss bleift de Loyer fest. Eng Loyeriwwerpréifung kann vun all Partei um Enn vun all Dräijoresperiod ugefrot ginn, wann de Loyer net méi dem tatsächleche Mietwäert entsprécht (Art. 7). Schlësselgeld (pas-de-porte) ass zu Lëtzebuerg erlaabt: De Vermieter kann eng Ufankszuelung als Géigeleeschtung fir d'Geschäftsvirdeeler vun der Lag verlaangen. Dëse Betrag ass net reguléiert a fräi verhandelbar.",
      pt: "Ao contrário do arrendamento habitacional, a renda comercial não é limitada pela regra dos 5% do capital investido (art. 3, lei de 21.09.2006 sobre o arrendamento habitacional). A renda é fixada livremente entre as partes segundo as condições do mercado. A indexação da renda comercial está ligada ao Índice de Preços no Consumidor (IPC) publicado pelo STATEC, e não a um índice de rendas comerciais (ILC) como em França. A cláusula de indexação deve estar expressamente prevista no contrato; caso contrário, a renda permanece fixa. A revisão da renda pode ser pedida por cada parte no termo de cada período trienal se a renda já não corresponder ao valor locativo real (art. 7). O trespasse (ou direito de entrada) é lícito no Luxemburgo: o senhorio pode exigir um pagamento inicial em contrapartida das vantagens comerciais ligadas à localização. Este montante não é regulamentado e negocia-se livremente.",
    },
    section3Title: {
      fr: "Droit au renouvellement et indemnité d'éviction",
      en: "Renewal Right and Eviction Compensation",
      de: "Erneuerungsrecht und Räumungsentschädigung",
      lb: "Erneierungsrecht an Räumungsentschädegung",
      pt: "Direito à renovação e indemnização de despejo",
    },
    section3Content: {
      fr: "Le locataire commercial bénéficie d'un droit au renouvellement de son bail (art. 5 loi 03.02.2018). Ce droit s'exerce à l'échéance du bail en notifiant au bailleur une demande de renouvellement au moins 6 mois avant le terme. Le bailleur qui refuse le renouvellement sans motif légitime doit verser au locataire une indemnité d'éviction. Cette indemnité couvre le préjudice subi par le locataire : perte de clientèle, frais de déménagement et de réinstallation, indemnité pour perte de fonds de commerce. Le montant est fixé soit à l'amiable, soit par le juge. Le bailleur peut refuser le renouvellement sans indemnité uniquement pour motifs graves : manquement du locataire à ses obligations, état de l'immeuble nécessitant démolition/reconstruction, ou besoin d'exploitation personnelle (le bailleur doit alors exploiter les locaux pendant au moins 2 ans). La cession du bail commercial est possible sauf clause contraire, mais le bailleur doit être informé de la cession.",
      en: "The commercial tenant benefits from a lease renewal right (Art. 5, law of 03.02.2018). This right is exercised at lease expiry by notifying the landlord of a renewal request at least 6 months before the term. A landlord who refuses renewal without legitimate grounds must pay the tenant eviction compensation. This compensation covers the tenant's loss: loss of clientele, moving and reinstallation costs, compensation for loss of business goodwill. The amount is set either amicably or by a judge. The landlord may refuse renewal without compensation only for serious grounds: tenant's breach of obligations, building condition requiring demolition/reconstruction, or personal business need (the landlord must then operate the premises for at least 2 years). Assignment of the commercial lease is possible unless otherwise stipulated, but the landlord must be informed of the assignment.",
      de: "Der Geschäftsmieter hat ein Recht auf Erneuerung seines Mietvertrags (Art. 5, Gesetz vom 03.02.2018). Dieses Recht wird bei Vertragsablauf durch Benachrichtigung des Vermieters mindestens 6 Monate vor dem Termin ausgeübt. Ein Vermieter, der die Erneuerung ohne berechtigten Grund ablehnt, muss dem Mieter eine Räumungsentschädigung zahlen. Diese deckt den erlittenen Schaden: Verlust der Kundschaft, Umzugs- und Neueinrichtungskosten, Entschädigung für Geschäftsverlust. Der Betrag wird einvernehmlich oder durch einen Richter festgesetzt. Der Vermieter kann die Erneuerung nur aus schwerwiegenden Gründen ohne Entschädigung ablehnen: Pflichtverletzung des Mieters, baulicher Zustand, der Abriss/Wiederaufbau erfordert, oder persönlicher Geschäftsbedarf (der Vermieter muss die Räume dann mindestens 2 Jahre selbst nutzen). Die Abtretung des Geschäftsmietvertrags ist möglich, sofern nicht anders vereinbart, aber der Vermieter muss über die Abtretung informiert werden.",
      lb: "De Geschäftslocataire huet e Recht op Erneierung vu sengem Mietvertrag (Art. 5, Gesetz vum 03.02.2018). Dëst Recht gëtt beim Vertragsoflaaf duerch Benoriichtegung vum Vermieter op mannst 6 Méint virum Termin ausgeüübt. E Vermieter, deen d'Erneierung ouni berechtegte Grond oflehnt, muss dem Locataire eng Räumungsentschädegung bezuelen. Dës deckt de erlittene Schued: Verlust vun der Clientèle, Ëmzugs- an Neianrichtungskäschten, Entschädegung fir Geschäftsverlust. De Betrag gëtt entweder eenverneemlesch oder duerch e Riichter festgesat. De Vermieter kann d'Erneierung nëmmen aus schwéierwigende Grënn ouni Entschädegung oflehnen: Pflichtverstouss vum Locataire, Bauzoustand deen Ofrass/Neiaufbau erfuerdert, oder perséinleche Geschäftsbedarf (de Vermieter muss d'Raim dann op mannst 2 Joer selwer notzen). D'Zessioun vum Geschäftsmietvertrag ass méiglech, sou wäit net anescht vereinbart, awer de Vermieter muss iwwer d'Zessioun informéiert ginn.",
      pt: "O inquilino comercial beneficia de um direito à renovação do seu arrendamento (art. 5, lei de 03.02.2018). Este direito exerce-se no termo do arrendamento notificando ao senhorio um pedido de renovação pelo menos 6 meses antes do prazo. O senhorio que recuse a renovação sem motivo legítimo deve pagar ao inquilino uma indemnização de despejo. Esta indemnização cobre o prejuízo sofrido: perda de clientela, custos de mudança e reinstalação, indemnização por perda de fundo de comércio. O montante é fixado amigavelmente ou pelo juiz. O senhorio pode recusar a renovação sem indemnização apenas por motivos graves: incumprimento das obrigações pelo inquilino, estado do imóvel que necessita demolição/reconstrução, ou necessidade de exploração pessoal (o senhorio deve então explorar os locais durante pelo menos 2 anos). A cessão do arrendamento comercial é possível salvo cláusula em contrário, mas o senhorio deve ser informado da cessão.",
    },
    relatedToolLabel: {
      fr: "Simuler la rentabilité d'un bail commercial",
      en: "Simulate commercial lease profitability",
      de: "Rentabilität eines Geschäftsmietvertrags simulieren",
      lb: "Rentabilitéit vun engem Geschäftsmietvertrag simuléieren",
      pt: "Simular a rentabilidade de um arrendamento comercial",
    },
    relatedToolLink: {
      fr: "/bail-commercial",
      en: "/bail-commercial",
      de: "/bail-commercial",
      lb: "/bail-commercial",
      pt: "/bail-commercial",
    },
    faq1Q: {
      fr: "Quelle est la durée minimale d'un bail commercial au Luxembourg ?",
      en: "What is the minimum term of a commercial lease in Luxembourg?",
      de: "Welche Mindestlaufzeit hat ein Geschäftsmietvertrag in Luxemburg?",
      lb: "Wéi laang ass d'Mindestlafzäit vun engem Geschäftsmietvertrag zu Lëtzebuerg?",
      pt: "Qual é a duração mínima de um arrendamento comercial no Luxemburgo?",
    },
    faq1A: {
      fr: "La durée minimale est de 9 ans (art. 2, loi du 3 février 2018). Le locataire peut résilier à chaque période triennale (3, 6, 9 ans) avec un préavis de 6 mois. Le bailleur ne peut résilier que pour motifs limitativement énumérés par la loi.",
      en: "The minimum term is 9 years (Art. 2, law of 3 February 2018). The tenant may terminate at each triennial period (3, 6, 9 years) with 6 months' notice. The landlord may only terminate for reasons exhaustively listed by law.",
      de: "Die Mindestlaufzeit beträgt 9 Jahre (Art. 2, Gesetz vom 3. Februar 2018). Der Mieter kann zu jeder Dreijahresperiode (3, 6, 9 Jahre) mit 6 Monaten Frist kündigen. Der Vermieter kann nur aus gesetzlich abschließend aufgezählten Gründen kündigen.",
      lb: "D'Mindestlafzäit ass 9 Joer (Art. 2, Gesetz vum 3. Februar 2018). De Locataire kann zu all Dräijoresperiod (3, 6, 9 Joer) mat 6 Méint Frist kënnegen. De Vermieter kann nëmmen aus gesetzlech ofschléissend opgelëschte Grënn kënnegen.",
      pt: "A duração mínima é de 9 anos (art. 2, lei de 3 de fevereiro de 2018). O inquilino pode rescindir em cada período trienal (3, 6, 9 anos) com pré-aviso de 6 meses. O senhorio só pode rescindir por motivos taxativamente enumerados pela lei.",
    },
    faq2Q: {
      fr: "Le loyer commercial est-il plafonné au Luxembourg ?",
      en: "Is commercial rent capped in Luxembourg?",
      de: "Ist die Geschäftsmiete in Luxemburg gedeckelt?",
      lb: "Ass de Geschäftsloyer zu Lëtzebuerg gedeckelt?",
      pt: "A renda comercial é limitada no Luxemburgo?",
    },
    faq2A: {
      fr: "Non, contrairement au bail d'habitation (plafonné à 5 % du capital investi), le loyer commercial est fixé librement entre les parties selon les conditions du marché. Il n'existe pas de plafond légal. L'indexation se fait sur l'IPC du STATEC si une clause le prévoit dans le bail.",
      en: "No, unlike residential leases (capped at 5% of invested capital), commercial rent is freely set between parties according to market conditions. There is no legal cap. Indexation is based on the STATEC CPI if a clause provides for it in the lease.",
      de: "Nein, anders als bei Wohnmietverträgen (gedeckelt auf 5 % des investierten Kapitals) wird die Geschäftsmiete frei zwischen den Parteien nach Marktbedingungen vereinbart. Es gibt keine gesetzliche Obergrenze. Die Indexierung erfolgt über den VPI des STATEC, wenn eine entsprechende Klausel im Vertrag vorgesehen ist.",
      lb: "Nee, am Géigesaz zum Wunnengsmietvertrag (gedeckelt op 5 % vum investéierte Kapital) gëtt de Geschäftsloyer fräi tëschent de Parteien no Maartkonditionne festgesat. Et gëtt keng gesetzlech Grenz. D'Indexéierung erfolgt iwwer de VPI vum STATEC, wann eng entspriechend Klausel am Vertrag virgesinn ass.",
      pt: "Não, ao contrário do arrendamento habitacional (limitado a 5% do capital investido), a renda comercial é fixada livremente entre as partes segundo as condições do mercado. Não existe teto legal. A indexação é feita sobre o IPC do STATEC se uma cláusula o previr no contrato.",
    },
  },

  // === Guide: Investir dans un hôtel ===
  "guide.investirHotel": {
    title: {
      fr: "Comment investir dans un hôtel au Luxembourg ?",
      en: "How to Invest in a Hotel in Luxembourg?",
      de: "Wie investiert man in ein Hotel in Luxemburg?",
      lb: "Wéi investéiert een an en Hotel zu Lëtzebuerg?",
      pt: "Como investir num hotel no Luxemburgo?",
    },
    metaDescription: {
      fr: "Investir dans un hôtel au Luxembourg : marché ~130 hôtels, RevPAR, ADR, EBITDA, capitalisation, prix/chambre, DSCR bancaire, due diligence, Klimabonus. Guide complet.",
      en: "Investing in a hotel in Luxembourg: ~130 hotels market, RevPAR, ADR, EBITDA, capitalization, price/room, bank DSCR, due diligence, Klimabonus. Complete guide.",
      de: "In ein Hotel in Luxemburg investieren: ~130 Hotels Markt, RevPAR, ADR, EBITDA, Kapitalisierung, Preis/Zimmer, Bank-DSCR, Due Diligence, Klimabonus. Kompletter Ratgeber.",
      lb: "An en Hotel zu Lëtzebuerg investéieren: ~130 Hoteler Marché, RevPAR, ADR, EBITDA, Kapitaliséierung, Präis/Zëmmer, Bank-DSCR, Due Diligence, Klimabonus. Komplette Guide.",
      pt: "Investir num hotel no Luxemburgo: mercado ~130 hotéis, RevPAR, ADR, EBITDA, capitalização, preço/quarto, DSCR bancário, due diligence, Klimabonus. Guia completo.",
    },
    intro: {
      fr: "Le Luxembourg compte environ 130 hôtels classés (de 1 à 5 étoiles), représentant quelque 8.000 chambres, avec un taux d'occupation moyen d'environ 60-65 %. Le marché est porté par le tourisme d'affaires (institutions européennes, secteur financier), le tourisme de loisirs (Ardennes, Moselle, ville de Luxembourg patrimoine UNESCO) et la Grande Région transfrontalière (250.000 frontaliers). Ce guide présente les métriques clés, les approches de valorisation et les étapes de due diligence pour investir dans un hôtel au Luxembourg.",
      en: "Luxembourg has approximately 130 classified hotels (1 to 5 stars), representing some 8,000 rooms, with an average occupancy rate of around 60-65%. The market is driven by business tourism (European institutions, financial sector), leisure tourism (Ardennes, Moselle, Luxembourg City UNESCO heritage) and the Greater Region cross-border area (250,000 cross-border workers). This guide presents key metrics, valuation approaches and due diligence steps for investing in a hotel in Luxembourg.",
      de: "Luxemburg zählt etwa 130 klassifizierte Hotels (1 bis 5 Sterne) mit rund 8.000 Zimmern bei einer durchschnittlichen Auslastung von etwa 60-65 %. Der Markt wird getrieben vom Geschäftstourismus (EU-Institutionen, Finanzsektor), Freizeittourismus (Ardennen, Mosel, Stadt Luxemburg UNESCO-Welterbe) und der grenzüberschreitenden Großregion (250.000 Grenzgänger). Dieser Ratgeber stellt die wichtigsten Kennzahlen, Bewertungsansätze und Due-Diligence-Schritte für eine Hotelinvestition in Luxemburg vor.",
      lb: "Lëtzebuerg zielt ongeféier 130 klassiféiert Hoteler (1 bis 5 Stären) mat ronn 8.000 Zëmmeren bei enger duerchschnëttlecher Auslaschtung vun ongeféier 60-65 %. De Marché gëtt gedriwwen vum Geschäftstourismus (EU-Institutiounen, Finanzsecteur), Fräizäittourismus (Ardennen, Musel, Stad Lëtzebuerg UNESCO-Welterbe) an der grenziwwerschreidender Groussregioun (250.000 Grenzgänger). Dëse Guide stellt déi wichtegst Kennzuelen, Bewäertungsapprochen an Due-Diligence-Schrëtt fir eng Hotelinvestitioun zu Lëtzebuerg vir.",
      pt: "O Luxemburgo conta com aproximadamente 130 hotéis classificados (de 1 a 5 estrelas), representando cerca de 8.000 quartos, com uma taxa de ocupação média de cerca de 60-65%. O mercado é impulsionado pelo turismo de negócios (instituições europeias, setor financeiro), turismo de lazer (Ardenas, Mosela, cidade do Luxemburgo património UNESCO) e a Grande Região transfronteiriça (250.000 trabalhadores fronteiriços). Este guia apresenta as métricas-chave, as abordagens de valorização e as etapas de due diligence para investir num hotel no Luxemburgo.",
    },
    section1Title: {
      fr: "Métriques clés de performance hôtelière",
      en: "Key Hotel Performance Metrics",
      de: "Wichtige Hotelkennzahlen",
      lb: "Wichteg Hotelkennzuelen",
      pt: "Métricas-chave de desempenho hoteleiro",
    },
    section1Content: {
      fr: "L'analyse d'un investissement hôtelier repose sur plusieurs indicateurs de performance standardisés. Le RevPAR (Revenue Per Available Room) mesure le chiffre d'affaires hébergement par chambre disponible : il se calcule en multipliant le taux d'occupation par l'ADR (Average Daily Rate, tarif moyen journalier). Au Luxembourg, le RevPAR moyen se situe entre 60 € (budget/économique) et 150 € (upscale/luxury) selon la catégorie et la localisation. L'ADR moyen varie de 80-100 € (budget) à 200-300 € (luxury). Le GOP (Gross Operating Profit) représente le résultat d'exploitation brut avant management fees, loyer, charges financières et impôts — il correspond typiquement à 30-45 % du chiffre d'affaires total pour un hôtel bien géré. L'EBITDA (résultat avant intérêts, impôts, dépréciation et amortissement) est la base de la valorisation par capitalisation. Le TRI (taux de rendement interne) attendu par les investisseurs hôteliers se situe généralement entre 8 % et 15 % selon le profil de risque.",
      en: "Hotel investment analysis relies on several standardized performance indicators. RevPAR (Revenue Per Available Room) measures accommodation revenue per available room: it is calculated by multiplying occupancy rate by ADR (Average Daily Rate). In Luxembourg, average RevPAR ranges from EUR 60 (budget/economy) to EUR 150 (upscale/luxury) depending on category and location. Average ADR varies from EUR 80-100 (budget) to EUR 200-300 (luxury). GOP (Gross Operating Profit) represents gross operating income before management fees, rent, financial charges and taxes — typically 30-45% of total revenue for a well-managed hotel. EBITDA (earnings before interest, taxes, depreciation and amortization) is the basis for capitalization valuation. The IRR (internal rate of return) expected by hotel investors generally ranges from 8% to 15% depending on risk profile.",
      de: "Die Analyse einer Hotelinvestition stützt sich auf mehrere standardisierte Leistungskennzahlen. Der RevPAR (Revenue Per Available Room) misst den Beherbergungsumsatz pro verfügbarem Zimmer: Er berechnet sich aus der Multiplikation der Auslastung mit dem ADR (Average Daily Rate, durchschnittlicher Tagespreis). In Luxemburg liegt der durchschnittliche RevPAR zwischen 60 € (Budget/Economy) und 150 € (Upscale/Luxury) je nach Kategorie und Standort. Der durchschnittliche ADR variiert von 80-100 € (Budget) bis 200-300 € (Luxury). Der GOP (Gross Operating Profit) stellt das Bruttobetriebsergebnis vor Management-Gebühren, Miete, Finanzierungskosten und Steuern dar — typischerweise 30-45 % des Gesamtumsatzes bei einem gut geführten Hotel. Das EBITDA ist die Basis der Bewertung durch Kapitalisierung. Die von Hotelinvestoren erwartete IRR (interne Rendite) liegt in der Regel zwischen 8 % und 15 % je nach Risikoprofil.",
      lb: "D'Analyse vun enger Hotelinvestitioun stëtzt sech op verschidde standardiséiert Leeschtungskennzuelen. De RevPAR (Revenue Per Available Room) moosst den Héibergementsumsaz pro disponibelem Zëmmer: Hie berechent sech aus der Multiplikatioun vun der Auslaschtung mam ADR (Average Daily Rate, duerchschnëttlechen Dagespräis). Zu Lëtzebuerg läit den duerchschnëttleche RevPAR tëschent 60 € (Budget/Economy) an 150 € (Upscale/Luxury) jee no Kategorie a Standuert. Den duerchschnëttlechen ADR variéiert vu 80-100 € (Budget) bis 200-300 € (Luxury). De GOP (Gross Operating Profit) stellt d'Bruttobetriibsergebnis viru Management-Gebühren, Loyer, Finanzéierungskäschten an Steiere duer — typescherweis 30-45 % vum Gesamtumsaz bei engem gutt geféierten Hotel. D'EBITDA ass d'Basis vun der Bewäertung duerch Kapitaliséierung. D'vun Hotelinvestisseuren erwaart IRR (intern Rendite) läit an der Reegel tëschent 8 % an 15 % jee no Risikoprofil.",
      pt: "A análise de um investimento hoteleiro assenta em vários indicadores de desempenho padronizados. O RevPAR (Revenue Per Available Room) mede a receita de alojamento por quarto disponível: calcula-se multiplicando a taxa de ocupação pelo ADR (Average Daily Rate, tarifa média diária). No Luxemburgo, o RevPAR médio situa-se entre 60 EUR (budget/económico) e 150 EUR (upscale/luxury) consoante a categoria e localização. O ADR médio varia de 80-100 EUR (budget) a 200-300 EUR (luxury). O GOP (Gross Operating Profit) representa o resultado de exploração bruto antes de taxas de gestão, renda, encargos financeiros e impostos — corresponde tipicamente a 30-45% da receita total para um hotel bem gerido. O EBITDA é a base da valorização por capitalização. A TIR (taxa interna de retorno) esperada pelos investidores hoteleiros situa-se geralmente entre 8% e 15% consoante o perfil de risco.",
    },
    section2Title: {
      fr: "Approches de valorisation hôtelière",
      en: "Hotel Valuation Approaches",
      de: "Hotelbewertungsansätze",
      lb: "Hotelbewäertungsapprochen",
      pt: "Abordagens de valorização hoteleira",
    },
    section2Content: {
      fr: "Trois méthodes principales permettent de valoriser un hôtel au Luxembourg. La capitalisation de l'EBITDA : on applique un multiple (multiplicateur) à l'EBITDA stabilisé de l'hôtel. Les multiples observés au Luxembourg se situent entre 8x et 14x selon la catégorie (budget à luxury), la localisation (Luxembourg-Ville vs régions) et l'état du bien. Un hôtel 3 étoiles en bonne condition à Luxembourg-Ville peut se valoriser à 10-12x EBITDA. L'approche prix par chambre (price per key) : cette méthode compare le prix total de la transaction au nombre de chambres. Au Luxembourg, les prix observés vont de 80.000-120.000 €/chambre (budget, régions) à 250.000-400.000 €/chambre (upscale, Luxembourg-Ville). La méthode DCF (Discounted Cash Flow) : elle actualise les flux de trésorerie futurs sur 10 ans avec une valeur terminale, en utilisant un taux d'actualisation (WACC) de 7-10 % reflétant le risque hôtelier. Le DSCR (Debt Service Coverage Ratio) exigé par les banques luxembourgeoises se situe entre 1,25x et 1,40x, ce qui conditionne le montant maximum de dette mobilisable.",
      en: "Three main methods allow hotel valuation in Luxembourg. EBITDA capitalization: a multiple is applied to the hotel's stabilized EBITDA. Observed multiples in Luxembourg range from 8x to 14x depending on category (budget to luxury), location (Luxembourg City vs regions) and property condition. A well-maintained 3-star hotel in Luxembourg City may be valued at 10-12x EBITDA. The price per key approach: this method compares total transaction price to number of rooms. In Luxembourg, observed prices range from EUR 80,000-120,000/room (budget, regions) to EUR 250,000-400,000/room (upscale, Luxembourg City). The DCF (Discounted Cash Flow) method: it discounts future cash flows over 10 years with a terminal value, using a discount rate (WACC) of 7-10% reflecting hotel risk. The DSCR (Debt Service Coverage Ratio) required by Luxembourg banks ranges from 1.25x to 1.40x, which determines the maximum debt amount available.",
      de: "Drei Hauptmethoden ermöglichen die Hotelbewertung in Luxemburg. EBITDA-Kapitalisierung: Ein Multiplikator wird auf das stabilisierte EBITDA des Hotels angewandt. Die beobachteten Multiplikatoren in Luxemburg liegen zwischen 8x und 14x je nach Kategorie (Budget bis Luxury), Standort (Stadt Luxemburg vs. Regionen) und Immobilienzustand. Ein gepflegtes 3-Sterne-Hotel in Luxemburg-Stadt kann mit 10-12x EBITDA bewertet werden. Der Preis-pro-Zimmer-Ansatz (Price per Key): Diese Methode vergleicht den Gesamttransaktionspreis mit der Zimmeranzahl. In Luxemburg liegen die beobachteten Preise zwischen 80.000-120.000 €/Zimmer (Budget, Regionen) und 250.000-400.000 €/Zimmer (Upscale, Luxemburg-Stadt). Die DCF-Methode (Discounted Cash Flow): Sie diskontiert zukünftige Cashflows über 10 Jahre mit einem Restwert bei einem Abzinsungssatz (WACC) von 7-10 %, der das Hotelrisiko widerspiegelt. Der von luxemburgischen Banken geforderte DSCR (Debt Service Coverage Ratio) liegt zwischen 1,25x und 1,40x und bestimmt den maximal verfügbaren Schuldenbetrag.",
      lb: "Dräi Hauptmethoden erlaben d'Hotelbewäertung zu Lëtzebuerg. EBITDA-Kapitaliséierung: E Multiplikator gëtt op d'stabiliséiert EBITDA vum Hotel ugewandt. Déi beobachte Multiplikatoren zu Lëtzebuerg leien tëschent 8x an 14x jee no Kategorie (Budget bis Luxury), Standort (Stad Lëtzebuerg vs. Regiounen) an Immobilienzoustand. E gutt gepfleegte 3-Stären-Hotel an der Stad Lëtzebuerg kann mat 10-12x EBITDA bewäert ginn. De Präis-pro-Zëmmer-Approche (Price per Key): Dës Method vergläicht den Gesamttransaktiounspräis mat der Zëmmeranzuel. Zu Lëtzebuerg leien déi beobachte Präisser tëschent 80.000-120.000 €/Zëmmer (Budget, Regiounen) an 250.000-400.000 €/Zëmmer (Upscale, Stad Lëtzebuerg). D'DCF-Method (Discounted Cash Flow): Si diskontéiert zukünfteg Cashflows iwwer 10 Joer mat engem Restwäert bei engem Abzinsungssaz (WACC) vu 7-10 %, deen d'Hotelrisiko widerspigelt. Den vun de Lëtzebuerger Banken gefuerderten DSCR (Debt Service Coverage Ratio) läit tëschent 1,25x an 1,40x a bestëmmt de maximal verfügbaren Scholdebetrag.",
      pt: "Três métodos principais permitem valorizar um hotel no Luxemburgo. Capitalização do EBITDA: aplica-se um múltiplo ao EBITDA estabilizado do hotel. Os múltiplos observados no Luxemburgo situam-se entre 8x e 14x consoante a categoria (budget a luxury), a localização (cidade do Luxemburgo vs regiões) e o estado do bem. Um hotel 3 estrelas em bom estado na cidade do Luxemburgo pode ser valorizado a 10-12x EBITDA. A abordagem preço por quarto (price per key): este método compara o preço total da transação ao número de quartos. No Luxemburgo, os preços observados vão de 80.000-120.000 EUR/quarto (budget, regiões) a 250.000-400.000 EUR/quarto (upscale, cidade do Luxemburgo). O método DCF (Discounted Cash Flow): atualiza os fluxos de tesouraria futuros a 10 anos com um valor terminal, utilizando uma taxa de atualização (WACC) de 7-10% refletindo o risco hoteleiro. O DSCR (Debt Service Coverage Ratio) exigido pelos bancos luxemburgueses situa-se entre 1,25x e 1,40x, o que condiciona o montante máximo de dívida mobilizável.",
    },
    section3Title: {
      fr: "Due diligence et aides disponibles",
      en: "Due Diligence and Available Incentives",
      de: "Due Diligence und verfügbare Förderungen",
      lb: "Due Diligence a verfügbar Fërderungen",
      pt: "Due diligence e apoios disponíveis",
    },
    section3Content: {
      fr: "La due diligence d'un hôtel au Luxembourg doit couvrir plusieurs volets essentiels. Le volet opérationnel : analyse des 3-5 derniers exercices (P&L détaillé par département : hébergement, restauration, événementiel, spa), évolution du RevPAR, du taux d'occupation et de l'ADR, benchmarking STR (Smith Travel Research) par rapport au competitive set local. Le volet immobilier : état structurel du bâtiment, conformité aux normes de sécurité incendie (ITM — Inspection du travail et des mines), accessibilité PMR, diagnostic énergétique (Energiepass), et estimation des CAPEX de rénovation nécessaires. Le volet juridique : vérification du bail ou du titre de propriété, autorisations d'exploitation (autorisation de commerce, licence de restauration), classement étoilé par le Ministère de l'Économie, et contrats de gestion/franchise en cours. Côté aides, le programme Klimabonus tertiaire offre des subventions pour la rénovation énergétique des bâtiments commerciaux (isolation, pompes à chaleur, photovoltaïque), et des aides PME du Ministère de l'Économie sont disponibles pour les investissements de modernisation hôtelière. La Grande Région (Sarre, Rhénanie-Palatinat, Lorraine, Wallonie) constitue une zone de chalandise naturelle de plus de 11 millions d'habitants pour les hôtels luxembourgeois.",
      en: "Hotel due diligence in Luxembourg must cover several essential areas. The operational aspect: analysis of the last 3-5 fiscal years (detailed P&L by department: accommodation, catering, events, spa), RevPAR, occupancy rate and ADR trends, STR (Smith Travel Research) benchmarking against the local competitive set. The real estate aspect: building structural condition, fire safety compliance (ITM — Labour and Mines Inspectorate), disability accessibility, energy assessment (Energiepass), and estimated renovation CAPEX needed. The legal aspect: verification of lease or title deed, operating permits (trade authorization, restaurant license), star classification by the Ministry of Economy, and current management/franchise contracts. On the incentives side, the Klimabonus tertiary program offers subsidies for energy renovation of commercial buildings (insulation, heat pumps, photovoltaics), and SME grants from the Ministry of Economy are available for hotel modernization investments. The Greater Region (Saarland, Rhineland-Palatinate, Lorraine, Wallonia) constitutes a natural catchment area of over 11 million inhabitants for Luxembourg hotels.",
      de: "Die Due Diligence eines Hotels in Luxemburg muss mehrere wesentliche Bereiche abdecken. Der operative Aspekt: Analyse der letzten 3-5 Geschäftsjahre (detaillierte GuV nach Abteilung: Beherbergung, Gastronomie, Events, Spa), RevPAR-, Auslastungs- und ADR-Entwicklung, STR-Benchmarking (Smith Travel Research) gegenüber dem lokalen Wettbewerbsumfeld. Der Immobilienaspekt: baulicher Zustand des Gebäudes, Brandschutznormenkonformität (ITM — Gewerbe- und Grubenaufsicht), Barrierefreiheit, Energiediagnose (Energiepass) und geschätzte Renovierungs-CAPEX. Der rechtliche Aspekt: Überprüfung des Mietvertrags oder Eigentumstitels, Betriebsgenehmigungen (Gewerbeerlaubnis, Gaststättenlizenz), Sterneklassifizierung durch das Wirtschaftsministerium und laufende Management-/Franchiseverträge. Bei den Förderungen bietet das Klimabonus-Tertiärprogramm Zuschüsse für die energetische Sanierung von Gewerbegebäuden (Dämmung, Wärmepumpen, Photovoltaik), und KMU-Beihilfen des Wirtschaftsministeriums stehen für Hotelmodernisierungsinvestitionen zur Verfügung. Die Großregion (Saarland, Rheinland-Pfalz, Lothringen, Wallonien) bildet ein natürliches Einzugsgebiet von über 11 Millionen Einwohnern für luxemburgische Hotels.",
      lb: "D'Due Diligence vun engem Hotel zu Lëtzebuerg muss verschidde wesentlech Beräicher ofdecken. Den operative Aspekt: Analyse vun de leschten 3-5 Geschäftsjoeren (detailléiert GuV no Departement: Héibergement, Gastronomie, Events, Spa), RevPAR-, Auslaschtungs- an ADR-Entwécklung, STR-Benchmarking (Smith Travel Research) géintiwwer dem lokale Konkurrenzëmfeld. Den Immobilienaspekt: baulechem Zoustand vum Gebai, Brandschutznormenkonformitéit (ITM — Gewerbe- an Gruewenopsiicht), Barrierefreiheet, Energiediagnos (Energiepass) a geschate Renovéierungs-CAPEX. De rechtlechen Aspekt: Iwwerpréifung vum Mietvertrag oder Eegentumstitel, Betriibsgenehmegungen (Gewerbeerlabnis, Gaststättenlizenz), Stärenklassifizéierung duerch d'Wirtschaftsministère a lafend Management-/Franchiseverträg. Bei de Fërderungen bitt d'Klimabonus-Tertiärprogramm Zouschëss fir d'energeetesch Sanéierung vu Geschäftsgebainer (Isolatioun, Wärmepompen, Photovoltaik), a KMU-Beihëllefen vum Wirtschaftsministère stinn fir Hotelmoderniséierungsinvestitioune zur Verfügung. D'Groussregioun (Saarland, Rheinland-Pfalz, Lothréngen, Wallonien) bildt en natierlechen Azugsgebitt vun iwwer 11 Milliounen Awunner fir Lëtzebuerger Hoteler.",
      pt: "A due diligence de um hotel no Luxemburgo deve cobrir várias vertentes essenciais. A vertente operacional: análise dos últimos 3-5 exercícios (P&L detalhado por departamento: alojamento, restauração, eventos, spa), evolução do RevPAR, da taxa de ocupação e do ADR, benchmarking STR (Smith Travel Research) face ao competitive set local. A vertente imobiliária: estado estrutural do edifício, conformidade com as normas de segurança contra incêndios (ITM — Inspeção do Trabalho e Minas), acessibilidade PMR, diagnóstico energético (Energiepass) e estimativa dos CAPEX de renovação necessários. A vertente jurídica: verificação do arrendamento ou título de propriedade, autorizações de exploração (autorização de comércio, licença de restauração), classificação por estrelas pelo Ministério da Economia e contratos de gestão/franquia em vigor. Quanto aos apoios, o programa Klimabonus terciário oferece subsídios para a renovação energética de edifícios comerciais (isolamento, bombas de calor, fotovoltaico), e apoios PME do Ministério da Economia estão disponíveis para investimentos de modernização hoteleira. A Grande Região (Sarre, Renânia-Palatinado, Lorena, Valónia) constitui uma zona de captação natural de mais de 11 milhões de habitantes para os hotéis luxemburgueses.",
    },
    relatedToolLabel: {
      fr: "Analyser un investissement hôtelier",
      en: "Analyze a hotel investment",
      de: "Eine Hotelinvestition analysieren",
      lb: "Eng Hotelinvestitioun analyséieren",
      pt: "Analisar um investimento hoteleiro",
    },
    relatedToolLink: {
      fr: "/hotellerie",
      en: "/hotellerie",
      de: "/hotellerie",
      lb: "/hotellerie",
      pt: "/hotellerie",
    },
    faq1Q: {
      fr: "Quel est le RevPAR moyen des hôtels au Luxembourg ?",
      en: "What is the average RevPAR of hotels in Luxembourg?",
      de: "Wie hoch ist der durchschnittliche RevPAR von Hotels in Luxemburg?",
      lb: "Wéi héich ass den duerchschnëttleche RevPAR vun Hoteler zu Lëtzebuerg?",
      pt: "Qual é o RevPAR médio dos hotéis no Luxemburgo?",
    },
    faq1A: {
      fr: "Le RevPAR moyen au Luxembourg varie de 60 € pour les hôtels budget/économiques à 150 € pour les hôtels upscale/luxury. Luxembourg-Ville affiche les RevPAR les plus élevés, tirés par le tourisme d'affaires et les institutions européennes. Les régions touristiques (Ardennes, Moselle) ont des RevPAR plus saisonniers.",
      en: "Average RevPAR in Luxembourg ranges from EUR 60 for budget/economy hotels to EUR 150 for upscale/luxury hotels. Luxembourg City shows the highest RevPAR, driven by business tourism and European institutions. Tourist regions (Ardennes, Moselle) have more seasonal RevPAR patterns.",
      de: "Der durchschnittliche RevPAR in Luxemburg reicht von 60 € für Budget-/Economy-Hotels bis 150 € für Upscale-/Luxury-Hotels. Luxemburg-Stadt zeigt den höchsten RevPAR, angetrieben durch Geschäftstourismus und EU-Institutionen. Tourismusregionen (Ardennen, Mosel) haben saisonalere RevPAR-Muster.",
      lb: "Den duerchschnëttleche RevPAR zu Lëtzebuerg geet vu 60 € fir Budget-/Economy-Hoteler bis 150 € fir Upscale-/Luxury-Hoteler. D'Stad Lëtzebuerg weist den héchste RevPAR, gedriwwen vum Geschäftstourismus an den EU-Institutiounen. Touristesch Regiounen (Ardennen, Musel) hunn méi saisonal RevPAR-Muster.",
      pt: "O RevPAR médio no Luxemburgo varia de 60 EUR para hotéis budget/económicos a 150 EUR para hotéis upscale/luxury. A cidade do Luxemburgo apresenta os RevPAR mais elevados, impulsionados pelo turismo de negócios e pelas instituições europeias. As regiões turísticas (Ardenas, Mosela) têm padrões de RevPAR mais sazonais.",
    },
    faq2Q: {
      fr: "Quel DSCR exigent les banques pour un prêt hôtelier au Luxembourg ?",
      en: "What DSCR do banks require for a hotel loan in Luxembourg?",
      de: "Welchen DSCR verlangen Banken für einen Hotelkredit in Luxemburg?",
      lb: "Wéi eng DSCR verlaangen d'Banken fir en Hotelkredit zu Lëtzebuerg?",
      pt: "Que DSCR exigem os bancos para um empréstimo hoteleiro no Luxemburgo?",
    },
    faq2A: {
      fr: "Les banques luxembourgeoises exigent généralement un DSCR (Debt Service Coverage Ratio) compris entre 1,25x et 1,40x pour un financement hôtelier. Cela signifie que le cash-flow disponible après charges d'exploitation doit couvrir au minimum 1,25 à 1,40 fois le service de la dette annuel (capital + intérêts). Un DSCR inférieur à 1,25x rendra le financement difficile à obtenir.",
      en: "Luxembourg banks generally require a DSCR (Debt Service Coverage Ratio) between 1.25x and 1.40x for hotel financing. This means available cash flow after operating expenses must cover at least 1.25 to 1.40 times the annual debt service (principal + interest). A DSCR below 1.25x will make financing difficult to obtain.",
      de: "Luxemburgische Banken verlangen in der Regel einen DSCR (Debt Service Coverage Ratio) zwischen 1,25x und 1,40x für Hotelfinanzierungen. Das bedeutet, der verfügbare Cashflow nach Betriebskosten muss mindestens das 1,25- bis 1,40-fache des jährlichen Schuldendienstes (Tilgung + Zinsen) abdecken. Ein DSCR unter 1,25x macht die Finanzierung schwer erhältlich.",
      lb: "Lëtzebuerger Banken verlaangen an der Reegel en DSCR (Debt Service Coverage Ratio) tëschent 1,25x an 1,40x fir Hotelfinanzéierungen. Dat bedeit, den disponibele Cashflow no Betriibskäschte muss op mannst d'1,25- bis 1,40-facht vum jährleche Scholdendéngscht (Tilgung + Zinsen) ofdecken. En DSCR ënner 1,25x mécht d'Finanzéierung schwéier erhältlech.",
      pt: "Os bancos luxemburgueses exigem geralmente um DSCR (Debt Service Coverage Ratio) entre 1,25x e 1,40x para financiamento hoteleiro. Isto significa que o cash-flow disponível após encargos de exploração deve cobrir no mínimo 1,25 a 1,40 vezes o serviço de dívida anual (capital + juros). Um DSCR inferior a 1,25x tornará o financiamento difícil de obter.",
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && target[key]) {
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
  console.log(`OK ${lang}.json updated`);
}

console.log("Done — guide batch 3 i18n keys injected.");
