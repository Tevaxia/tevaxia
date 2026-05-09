// Inject i18n keys for guide batch 2 (4 guides: bail habitation, copropriété, klimabonus, estimation)
import { readFileSync, writeFileSync } from "fs";

const LANGS = ["fr", "en", "de", "lb", "pt"];
const MSG_DIR = "src/messages";

const NEW_KEYS = {
  // === Guide: Bail d'habitation ===
  "guide.bailHabitation": {
    title: {
      fr: "Quelles sont les règles du bail d'habitation au Luxembourg ?",
      en: "What Are the Rules for Residential Leases in Luxembourg?",
      de: "Welche Regeln gelten für Wohnungsmietverträge in Luxemburg?",
      lb: "Wéi eng Reegele gëllen fir Wunnengsmietverträg zu Lëtzebuerg?",
      pt: "Quais são as regras do arrendamento habitacional no Luxemburgo?",
    },
    metaDescription: {
      fr: "Bail d'habitation au Luxembourg : loi 21.09.2006, durée, préavis 3/6 mois, dépôt de garantie max 3 mois, état des lieux, charges récupérables.",
      en: "Residential lease in Luxembourg: law of 21.09.2006, duration, 3/6-month notice, max 3-month deposit, inventory, recoverable charges.",
      de: "Wohnungsmietvertrag in Luxemburg: Gesetz vom 21.09.2006, Dauer, 3/6-monatige Kündigungsfrist, max. 3 Monate Kaution, Übergabeprotokoll, umlegbare Nebenkosten.",
      lb: "Wunnengsmietvertrag zu Lëtzebuerg: Gesetz vum 21.09.2006, Dauer, 3/6 Méint Kënnegungsfrist, max. 3 Méint Kautioun, Ëmstandsprotokoll, recuperabel Käschten.",
      pt: "Arrendamento habitacional no Luxemburgo: lei de 21.09.2006, duração, pré-aviso 3/6 meses, caução máx. 3 meses, inventário, encargos recuperáveis.",
    },
    intro: {
      fr: "Le bail d'habitation au Luxembourg est régi par la loi modifiée du 21 septembre 2006 sur le bail à usage d'habitation. Cette loi encadre strictement les relations entre bailleur et locataire : durée du contrat, conditions de résiliation, montant du dépôt de garantie, obligation d'état des lieux et répartition des charges. Le loyer est plafonné à 5 % du capital investi réévalué (art. 3). Voici les règles essentielles à connaître avant de signer un bail au Luxembourg.",
      en: "Residential leases in Luxembourg are governed by the modified law of 21 September 2006 on residential tenancy. This law strictly regulates the relationship between landlord and tenant: contract duration, termination conditions, security deposit amount, mandatory inventory and charge allocation. Rent is capped at 5% of the revalued invested capital (Art. 3). Here are the essential rules to know before signing a lease in Luxembourg.",
      de: "Der Wohnungsmietvertrag in Luxemburg wird durch das geänderte Gesetz vom 21. September 2006 über die Wohnraummiete geregelt. Dieses Gesetz regelt streng die Beziehung zwischen Vermieter und Mieter: Vertragsdauer, Kündigungsbedingungen, Kautionshöhe, Pflicht zur Erstellung eines Übergabeprotokolls und Kostenverteilung. Die Miete ist auf 5 % des aufgewerteten investierten Kapitals begrenzt (Art. 3). Hier die wesentlichen Regeln vor Abschluss eines Mietvertrags in Luxemburg.",
      lb: "De Wunnengsmietvertrag zu Lëtzebuerg gëtt duerch d'geännert Gesetz vum 21. September 2006 iwwer d'Wunnraumvermietung gereegelt. Dëst Gesetz reegelt streng d'Relatioun tëschent Vermieter a Locataire: Vertragsdauer, Kënnegungsbedingungen, Kautiounshéicht, Pflicht zum Ëmstandsprotokoll an d'Käschtenverteilung. De Loyer ass op 5 % vum opgewäerten investéierte Kapital limitéiert (Art. 3). Hei déi wesentlech Reegelen virum Ofschloss vun engem Mietvertrag zu Lëtzebuerg.",
      pt: "O arrendamento habitacional no Luxemburgo é regido pela lei modificada de 21 de setembro de 2006 sobre o arrendamento para habitação. Esta lei enquadra estritamente as relações entre senhorio e inquilino: duração do contrato, condições de rescisão, montante da caução, obrigação de inventário e repartição de encargos. A renda é limitada a 5% do capital investido reavaliado (art. 3). Eis as regras essenciais a conhecer antes de assinar um contrato no Luxemburgo.",
    },
    section1Title: {
      fr: "Durée du bail et préavis de résiliation",
      en: "Lease Duration and Notice Periods",
      de: "Mietdauer und Kündigungsfristen",
      lb: "Mietdauer a Kënnegungsfrist",
      pt: "Duração do contrato e pré-aviso de rescisão",
    },
    section1Content: {
      fr: "Le bail d'habitation est conclu pour une durée indéterminée par défaut (art. 1er loi 21.09.2006). Les baux à durée déterminée sont possibles mais, à leur terme, se transforment automatiquement en bail à durée indéterminée si le locataire reste dans les lieux. Le locataire peut résilier à tout moment moyennant un préavis de 3 mois, notifié par lettre recommandée (art. 12). Le bailleur ne peut résilier qu'avec un préavis de 6 mois et uniquement pour motifs légitimes : besoin personnel d'occupation (pour lui-même, son conjoint, ses ascendants ou descendants), manquement grave du locataire à ses obligations, ou travaux de démolition/reconstruction rendant le logement inhabitable. La résiliation par le bailleur doit être motivée par écrit sous peine de nullité.",
      en: "Residential leases are concluded for an indefinite duration by default (Art. 1, law of 21.09.2006). Fixed-term leases are possible but automatically convert to indefinite-term leases if the tenant remains in occupation at expiry. The tenant may terminate at any time with 3 months' notice by registered letter (Art. 12). The landlord may only terminate with 6 months' notice and exclusively for legitimate reasons: personal need for occupation (for themselves, their spouse, ascendants or descendants), serious breach by the tenant, or demolition/reconstruction works rendering the dwelling uninhabitable. The landlord's termination must state reasons in writing or be void.",
      de: "Wohnungsmietverträge werden standardmäßig auf unbestimmte Dauer geschlossen (Art. 1, Gesetz vom 21.09.2006). Befristete Mietverträge sind möglich, wandeln sich aber bei Verbleib des Mieters automatisch in unbefristete um. Der Mieter kann jederzeit mit einer Frist von 3 Monaten per Einschreiben kündigen (Art. 12). Der Vermieter kann nur mit 6 Monaten Frist und ausschließlich aus berechtigten Gründen kündigen: Eigenbedarf (für sich selbst, Ehepartner, Vor- oder Nachfahren), schwerer Vertragsverstoß des Mieters oder Abriss-/Umbauarbeiten, die die Wohnung unbewohnbar machen. Die Kündigung durch den Vermieter muss schriftlich begründet werden, andernfalls ist sie nichtig.",
      lb: "Wunnengsmietverträg gi standardméisseg op onbestëmmten Zäit ofgeschloss (Art. 1, Gesetz vum 21.09.2006). Befrist Mietverträg si méiglech, awer wandelen sech automatesch an onbefrist ëm wann de Locataire am Logement bleift. De Locataire kann zu all Moment mat enger Frist vu 3 Méint per Recommandé kënnegen (Art. 12). De Vermieter kann nëmmen mat 6 Méint Frist an exklusiv aus berechtegte Grënn kënnegen: Eegenbedarf (fir sech selwer, Conjoint, Elteren oder Kanner), schwéiere Vertragsverstouss vum Locataire oder Ofrass-/Ëmbauaarbechten, déi d'Wunneng onbewunnbar maachen. D'Kënnegung vum Vermieter muss schrëftlech begrënnt sinn, soss ass se nichteg.",
      pt: "Os contratos de arrendamento habitacional são celebrados por duração indeterminada por defeito (art. 1.º, lei de 21.09.2006). Os contratos a prazo são possíveis mas convertem-se automaticamente em contratos de duração indeterminada se o inquilino permanecer no local. O inquilino pode rescindir a qualquer momento com pré-aviso de 3 meses por carta registada (art. 12). O senhorio só pode rescindir com pré-aviso de 6 meses e exclusivamente por motivos legítimos: necessidade pessoal de ocupação (para si, cônjuge, ascendentes ou descendentes), incumprimento grave do inquilino, ou obras de demolição/reconstrução que tornem a habitação inabitável. A rescisão pelo senhorio deve ser fundamentada por escrito sob pena de nulidade.",
    },
    section2Title: {
      fr: "Dépôt de garantie et état des lieux",
      en: "Security Deposit and Inventory",
      de: "Mietkaution und Übergabeprotokoll",
      lb: "Mietkautioun an Ëmstandsprotokoll",
      pt: "Caução e inventário",
    },
    section2Content: {
      fr: "Le dépôt de garantie (caution locative) est limité à un maximum de 3 mois de loyer hors charges (art. 5 loi 21.09.2006). Il doit être déposé sur un compte bloqué au nom du locataire dans un établissement bancaire luxembourgeois. Les intérêts produits reviennent au locataire. La restitution du dépôt doit intervenir dans un délai raisonnable après la fin du bail, déduction faite des éventuels dommages constatés. L'état des lieux d'entrée et de sortie est obligatoire (art. 9). Il doit être établi contradictoirement entre les parties, de préférence par un expert indépendant. En l'absence d'état des lieux d'entrée, le locataire est présumé avoir reçu le logement en bon état (art. 1731 du Code civil). L'état des lieux protège les deux parties en cas de litige sur l'état du bien.",
      en: "The security deposit is limited to a maximum of 3 months' rent excluding charges (Art. 5, law of 21.09.2006). It must be placed in a blocked account in the tenant's name at a Luxembourg bank. Interest earned belongs to the tenant. The deposit must be returned within a reasonable time after the lease ends, minus any established damages. Entry and exit inventories are mandatory (Art. 9). They must be drawn up jointly between the parties, preferably by an independent expert. Without an entry inventory, the tenant is presumed to have received the dwelling in good condition (Art. 1731 Civil Code). The inventory protects both parties in case of disputes about the property's condition.",
      de: "Die Mietkaution ist auf maximal 3 Monatsmieten ohne Nebenkosten begrenzt (Art. 5, Gesetz vom 21.09.2006). Sie muss auf einem gesperrten Konto auf den Namen des Mieters bei einer luxemburgischen Bank hinterlegt werden. Die erwirtschafteten Zinsen gehören dem Mieter. Die Rückgabe der Kaution muss innerhalb einer angemessenen Frist nach Mietende erfolgen, abzüglich eventueller festgestellter Schäden. Das Übergabeprotokoll bei Ein- und Auszug ist Pflicht (Art. 9). Es muss im Beisein beider Parteien erstellt werden, vorzugsweise durch einen unabhängigen Sachverständigen. Ohne Einzugsprotokoll wird vermutet, dass der Mieter die Wohnung in gutem Zustand erhalten hat (Art. 1731 Zivilgesetzbuch). Das Protokoll schützt beide Parteien bei Streitigkeiten über den Zustand der Immobilie.",
      lb: "D'Mietkautioun ass op maximal 3 Méint Loyer ouni Nieftekosten limitéiert (Art. 5, Gesetz vum 21.09.2006). Si muss op engem gespaarten Konto op den Numm vum Locataire bei enger Lëtzebuerger Bank deposéiert ginn. D'Zinse gehéieren dem Locataire. D'Réckgab vun der Kautioun muss bannent enger raisonnabeler Frist nom Enn vum Bail geschéien, ofgezunn eventuell festgestallt Schied. Den Ëmstandsprotokoll beim An- an Auszuch ass Pflicht (Art. 9). Hie muss am Beisäin vu béide Parteien opgestallt ginn, viraussiichtlech duerch en onofhängegen Expert. Ouni Anzuchsprotokoll gëtt ugeholl, dass de Locataire d'Wunneng a guddem Zoustand kritt huet (Art. 1731 Code civil). De Protokoll schützt béid Parteien bei Streidegkeeten iwwer den Zoustand vun der Immobilie.",
      pt: "A caução está limitada a um máximo de 3 meses de renda sem encargos (art. 5, lei de 21.09.2006). Deve ser depositada numa conta bloqueada em nome do inquilino num banco luxemburguês. Os juros produzidos pertencem ao inquilino. A restituição da caução deve ocorrer num prazo razoável após o fim do contrato, deduzidos eventuais danos comprovados. O inventário de entrada e saída é obrigatório (art. 9). Deve ser elaborado contraditoriamente entre as partes, preferencialmente por um perito independente. Na ausência de inventário de entrada, presume-se que o inquilino recebeu a habitação em bom estado (art. 1731 do Código Civil). O inventário protege ambas as partes em caso de litígio sobre o estado do imóvel.",
    },
    section3Title: {
      fr: "Charges récupérables et obligations des parties",
      en: "Recoverable Charges and Party Obligations",
      de: "Umlegbare Nebenkosten und Pflichten der Parteien",
      lb: "Recuperabel Nieftekosten a Pflichte vun de Parteien",
      pt: "Encargos recuperáveis e obrigações das partes",
    },
    section3Content: {
      fr: "Les charges récupérables auprès du locataire sont limitativement énumérées par le règlement grand-ducal du 16 juin 2015. Elles comprennent : consommation d'eau/électricité/gaz des parties communes, chauffage collectif, entretien courant des communs (nettoyage, jardinage, ascenseur), taxe communale sur les ordures ménagères, et assurance responsabilité civile de l'immeuble. Le bailleur ne peut pas répercuter les gros travaux de réparation (toiture, façade, structure) ni les frais de gestion/syndic au-delà de la quote-part locataire. Le bailleur est tenu de délivrer le logement en bon état d'usage et de réparation (art. 1719 Code civil) et d'effectuer les grosses réparations. Le locataire doit user du logement en bon père de famille, payer son loyer à terme échu et effectuer les réparations locatives (menues réparations d'entretien). En cas de litige, le locataire peut saisir la Commission des loyers de sa commune avant tout recours judiciaire.",
      en: "Recoverable charges from the tenant are exhaustively listed in the Grand Ducal Regulation of 16 June 2015. They include: common area water/electricity/gas consumption, collective heating, routine maintenance of common areas (cleaning, gardening, elevator), municipal household waste tax, and building liability insurance. The landlord cannot pass on major structural repairs (roof, facade, structure) or management/syndic fees beyond the tenant's share. The landlord must deliver the dwelling in good condition (Art. 1719 Civil Code) and carry out major repairs. The tenant must use the dwelling responsibly, pay rent on time and carry out routine tenant repairs. In case of dispute, the tenant may refer to the municipal Rent Commission before any court action.",
      de: "Die auf den Mieter umlegbaren Nebenkosten sind im Großherzoglichen Reglement vom 16. Juni 2015 abschließend aufgelistet. Sie umfassen: Wasser-/Strom-/Gasverbrauch der Gemeinschaftsflächen, Zentralheizung, laufende Wartung der Gemeinschaftsbereiche (Reinigung, Gartenpflege, Aufzug), kommunale Müllgebühr und Gebäudehaftpflichtversicherung. Der Vermieter kann keine größeren Reparaturen (Dach, Fassade, Struktur) oder Verwaltungs-/Syndikusgebühren über den Mieteranteil hinaus umlegen. Der Vermieter muss die Wohnung in gutem Zustand übergeben (Art. 1719 Zivilgesetzbuch) und größere Reparaturen durchführen. Der Mieter muss die Wohnung pfleglich behandeln, die Miete pünktlich zahlen und Kleinreparaturen durchführen. Bei Streitigkeiten kann der Mieter die kommunale Mietkommission anrufen, bevor er den Rechtsweg beschreitet.",
      lb: "D'op de Locataire recuperabel Nieftekosten si vum Groussherzoglecht Reglement vum 16. Juni 2015 ofschléissend opgelëscht. Si ëmfaassen: Waasser-/Stroum-/Gasverbrauch vun de Gemeinschaftsflächen, Zentralheizung, laufend Ënnerhalt vun de Gemeinschaftsberäicher (Botzen, Gaardenaarbecht, Lift), kommunal Dreckstax an Gebaiiversécherung. De Vermieter kann keng gréisser Reparaturen (Daach, Fassade, Struktur) oder Verwaltungs-/Syndiksgebühren iwwert den Locataire-Undeel eraus ëmleeën. De Vermieter muss d'Wunneng a guddem Zoustand iwwerginn (Art. 1719 Code civil) a gréisser Reparaturen duerchféieren. De Locataire muss d'Wunneng respektvoll notzen, de Loyer pünktlech bezuelen a Klengreparaturen duerchféieren. Bei Streidegkeeten kann de Locataire d'kommunal Loyerskommissioun uruffen, ier en de Rechtsweg beschreit.",
      pt: "Os encargos recuperáveis junto do inquilino estão taxativamente enumerados no Regulamento Grão-Ducal de 16 de junho de 2015. Incluem: consumo de água/eletricidade/gás das partes comuns, aquecimento coletivo, manutenção corrente das partes comuns (limpeza, jardinagem, elevador), taxa municipal de resíduos e seguro de responsabilidade civil do edifício. O senhorio não pode repercutir grandes reparações estruturais (telhado, fachada, estrutura) nem taxas de gestão/síndico além da quota-parte do inquilino. O senhorio deve entregar a habitação em bom estado de uso e reparação (art. 1719 Código Civil) e efetuar as grandes reparações. O inquilino deve usar a habitação com cuidado, pagar a renda pontualmente e efetuar as pequenas reparações de manutenção. Em caso de litígio, o inquilino pode recorrer à Comissão de Rendas do município antes de qualquer ação judicial.",
    },
    relatedToolLabel: {
      fr: "Calculer le loyer maximum légal",
      en: "Calculate the maximum legal rent",
      de: "Berechnen Sie die gesetzliche Höchstmiete",
      lb: "Berechent déi gesetzlech Maximallayer",
      pt: "Calcule a renda máxima legal",
    },
    relatedToolLink: {
      fr: "/calculateur-loyer",
      en: "/calculateur-loyer",
      de: "/calculateur-loyer",
      lb: "/calculateur-loyer",
      pt: "/calculateur-loyer",
    },
    faq1Q: {
      fr: "Quel est le préavis pour quitter un logement au Luxembourg ?",
      en: "What is the notice period to leave a rental in Luxembourg?",
      de: "Wie lang ist die Kündigungsfrist für einen Auszug in Luxemburg?",
      lb: "Wéi laang ass d'Kënnegungsfrist fir en Auszuch zu Lëtzebuerg?",
      pt: "Qual é o pré-aviso para sair de uma habitação no Luxemburgo?",
    },
    faq1A: {
      fr: "Le locataire doit respecter un préavis de 3 mois, notifié par lettre recommandée (art. 12, loi 21.09.2006). Le bailleur doit respecter un préavis de 6 mois et ne peut résilier que pour motifs légitimes (besoin personnel, manquement grave, travaux majeurs).",
      en: "The tenant must give 3 months' notice by registered letter (Art. 12, law of 21.09.2006). The landlord must give 6 months' notice and may only terminate for legitimate reasons (personal need, serious breach, major works).",
      de: "Der Mieter muss eine Kündigungsfrist von 3 Monaten per Einschreiben einhalten (Art. 12, Gesetz vom 21.09.2006). Der Vermieter muss 6 Monate Frist einhalten und kann nur aus berechtigten Gründen kündigen (Eigenbedarf, schwerer Verstoß, größere Arbeiten).",
      lb: "De Locataire muss eng Kënnegungsfrist vu 3 Méint per Recommandé ahalten (Art. 12, Gesetz vum 21.09.2006). De Vermieter muss 6 Méint Frist ahalten a kann nëmmen aus berechtegte Grënn kënnegen (Eegenbedarf, schwéiere Verstouss, gréisser Aarbechten).",
      pt: "O inquilino deve respeitar um pré-aviso de 3 meses por carta registada (art. 12, lei de 21.09.2006). O senhorio deve respeitar um pré-aviso de 6 meses e só pode rescindir por motivos legítimos (necessidade pessoal, incumprimento grave, obras importantes).",
    },
    faq2Q: {
      fr: "Quel est le montant maximum de la garantie locative au Luxembourg ?",
      en: "What is the maximum rental deposit in Luxembourg?",
      de: "Wie hoch ist die maximale Mietkaution in Luxemburg?",
      lb: "Wéi héich ass d'maximal Mietkautioun zu Lëtzebuerg?",
      pt: "Qual é o montante máximo da caução no Luxemburgo?",
    },
    faq2A: {
      fr: "Le dépôt de garantie est plafonné à 3 mois de loyer hors charges (art. 5, loi 21.09.2006). Il doit être déposé sur un compte bloqué au nom du locataire et les intérêts lui reviennent.",
      en: "The security deposit is capped at 3 months' rent excluding charges (Art. 5, law of 21.09.2006). It must be held in a blocked account in the tenant's name and interest earned belongs to the tenant.",
      de: "Die Mietkaution ist auf 3 Monatsmieten ohne Nebenkosten gedeckelt (Art. 5, Gesetz vom 21.09.2006). Sie muss auf einem Sperrkonto auf den Namen des Mieters hinterlegt werden und die Zinsen gehören dem Mieter.",
      lb: "D'Mietkautioun ass op 3 Méint Loyer ouni Nieftekosten gedeckelt (Art. 5, Gesetz vum 21.09.2006). Si muss op engem Sparrkonto op den Numm vum Locataire deposéiert ginn an d'Zinse gehéieren dem Locataire.",
      pt: "A caução está limitada a 3 meses de renda sem encargos (art. 5, lei de 21.09.2006). Deve ser depositada numa conta bloqueada em nome do inquilino e os juros pertencem-lhe.",
    },
  },

  // === Guide: Copropriété ===
  "guide.copropriete": {
    title: {
      fr: "Comment fonctionne la copropriété au Luxembourg ?",
      en: "How Does Co-ownership Work in Luxembourg?",
      de: "Wie funktioniert Miteigentum in Luxemburg?",
      lb: "Wéi funktionéiert Copropriétéit zu Lëtzebuerg?",
      pt: "Como funciona o condomínio no Luxemburgo?",
    },
    metaDescription: {
      fr: "Copropriété au Luxembourg : loi 16.05.1975, syndic obligatoire, AG, tantièmes, fonds de réserve, majorités de vote. Guide complet.",
      en: "Co-ownership in Luxembourg: law of 16.05.1975, mandatory syndic, general meetings, shares, reserve fund, voting majorities. Complete guide.",
      de: "Miteigentum in Luxemburg: Gesetz vom 16.05.1975, Pflicht-Syndikus, HV, Miteigentumsanteile, Rücklagenfonds, Abstimmungsmehrheiten. Kompletter Ratgeber.",
      lb: "Copropriétéit zu Lëtzebuerg: Gesetz vum 16.05.1975, Pflicht-Syndikus, GV, Copropriétéitsundeeler, Reservefong, Ofstëmmungsmajoritéiten. Komplette Guide.",
      pt: "Condomínio no Luxemburgo: lei de 16.05.1975, síndico obrigatório, AG, permilagem, fundo de reserva, maiorias de voto. Guia completo.",
    },
    intro: {
      fr: "La copropriété au Luxembourg est régie par la loi modifiée du 16 mai 1975 portant réglementation de la copropriété des immeubles bâtis. Chaque copropriétaire détient un lot composé d'une partie privative (appartement, cave, parking) et d'une quote-part des parties communes exprimée en tantièmes ou millièmes. La gestion de l'immeuble repose sur trois organes : le syndic, l'assemblée générale des copropriétaires et le conseil syndical. Voici comment tout cela s'articule.",
      en: "Co-ownership in Luxembourg is governed by the modified law of 16 May 1975 regulating co-ownership of built properties. Each co-owner holds a lot composed of a private part (apartment, cellar, parking) and a share of the common parts expressed in tantièmes or thousandths. Building management relies on three bodies: the syndic, the general meeting of co-owners, and the syndical council. Here is how it all works together.",
      de: "Das Miteigentum in Luxemburg wird durch das geänderte Gesetz vom 16. Mai 1975 zur Regelung des Miteigentums an bebauten Immobilien geregelt. Jeder Miteigentümer besitzt einen Anteil bestehend aus einem privaten Teil (Wohnung, Keller, Stellplatz) und einem Anteil an den Gemeinschaftsteilen, ausgedrückt in Tausendstel. Die Hausverwaltung stützt sich auf drei Organe: den Syndikus, die Eigentümerversammlung und den Verwaltungsrat. So funktioniert das Zusammenspiel.",
      lb: "D'Copropriétéit zu Lëtzebuerg gëtt duerch d'geännert Gesetz vum 16. Mee 1975 iwwer d'Reegelung vun der Copropriétéit vu bebauten Immobilie gereegelt. All Copropriétaire besëtzt e Lot besteeend aus engem private Deel (Appartement, Keller, Parking) an engem Undeel un de gemeinsame Deeler, ausgedréckt an Tausendstel. D'Gebaigeverwaltung stëtzt sech op dräi Organer: de Syndikus, d'Generalversammlung vun de Copropriétairen an de Verwaltungsrot. Hei wéi alles zesummeshänkt.",
      pt: "O condomínio no Luxemburgo é regido pela lei modificada de 16 de maio de 1975 que regulamenta a copropriedade de imóveis edificados. Cada condómino detém um lote composto por uma parte privativa (apartamento, cave, estacionamento) e uma quota-parte das partes comuns expressa em milésimos. A gestão do edifício assenta em três órgãos: o síndico, a assembleia geral de condóminos e o conselho sindical. Eis como tudo se articula.",
    },
    section1Title: {
      fr: "Le syndic et l'assemblée générale",
      en: "The Syndic and General Meeting",
      de: "Der Syndikus und die Eigentümerversammlung",
      lb: "De Syndikus an d'Generalversammlung",
      pt: "O síndico e a assembleia geral",
    },
    section1Content: {
      fr: "La désignation d'un syndic professionnel est obligatoire pour les copropriétés de plus de 5 lots (art. 16 loi 16.05.1975 modifiée). Le syndic est le mandataire légal du syndicat des copropriétaires : il exécute les décisions de l'assemblée générale, gère le budget, recouvre les charges, entretient les parties communes et représente le syndicat en justice. Son mandat est limité à 3 ans, renouvelable. L'assemblée générale (AG) se réunit au moins une fois par an (art. 14). Elle vote le budget prévisionnel, approuve les comptes, décide des travaux et désigne ou révoque le syndic. Chaque copropriétaire dispose d'un nombre de voix proportionnel à ses tantièmes. Le quorum est atteint lorsque les copropriétaires présents ou représentés détiennent au moins 50 % des tantièmes.",
      en: "Appointing a professional syndic is mandatory for co-ownerships with more than 5 lots (Art. 16, modified law of 16.05.1975). The syndic is the legal representative of the co-owners' association: they execute general meeting decisions, manage the budget, collect charges, maintain common areas and represent the association in court. Their mandate is limited to 3 years, renewable. The general meeting (GM) convenes at least once a year (Art. 14). It votes on the forecast budget, approves accounts, decides on works and appoints or removes the syndic. Each co-owner has voting rights proportional to their shares. Quorum is reached when present or represented co-owners hold at least 50% of shares.",
      de: "Die Bestellung eines professionellen Syndikus ist für Miteigentumsgemeinschaften mit mehr als 5 Einheiten Pflicht (Art. 16, geändertes Gesetz vom 16.05.1975). Der Syndikus ist der gesetzliche Vertreter der Eigentümergemeinschaft: Er führt die Beschlüsse der Versammlung aus, verwaltet das Budget, erhebt die Umlagen, pflegt die Gemeinschaftsteile und vertritt die Gemeinschaft vor Gericht. Sein Mandat ist auf 3 Jahre begrenzt und verlängerbar. Die Eigentümerversammlung (EV) tagt mindestens einmal jährlich (Art. 14). Sie stimmt über den Wirtschaftsplan ab, genehmigt die Abrechnung, beschließt Arbeiten und bestellt oder widerruft den Syndikus. Jeder Miteigentümer hat Stimmrechte proportional zu seinen Anteilen. Die Beschlussfähigkeit ist erreicht, wenn anwesende oder vertretene Eigentümer mindestens 50 % der Anteile halten.",
      lb: "D'Ernennung vun engem professionelle Syndikus ass Pflicht fir Copropriétéite mat méi wéi 5 Loten (Art. 16, geännert Gesetz vum 16.05.1975). De Syndikus ass de gesetzleche Vertrieder vun der Eigentümergemeinschaft: Hien féiert d'Decisiounen vun der Generalversammlung aus, verwaltet de Budget, erhieft d'Ëmlagen, flegt d'Gemeinschaftsdeeler a vertrëtt d'Gemeinschaft virum Gericht. Säi Mandat ass op 3 Joer limitéiert a verlängerbar. D'Generalversammlung (GV) trëtt mindestens eemol am Joer zesummen (Art. 14). Si stëmmt iwwert de Wirtschaftsplang of, genehmegt d'Ofrechnung, beschléisst Aarbechten a bestellt oder widerréift de Syndikus. All Copropriétaire huet Stëmmrechter proportional zu senge Undeeler. D'Beschlossféiegkeet ass erreecht, wann uwiersend oder vertruede Copropriétairen op mannst 50 % vun den Undeeler halen.",
      pt: "A nomeação de um síndico profissional é obrigatória para condomínios com mais de 5 lotes (art. 16, lei modificada de 16.05.1975). O síndico é o mandatário legal do sindicato de condóminos: executa as decisões da assembleia geral, gere o orçamento, cobra os encargos, mantém as partes comuns e representa o sindicato em tribunal. O seu mandato é limitado a 3 anos, renovável. A assembleia geral (AG) reúne-se pelo menos uma vez por ano (art. 14). Vota o orçamento previsional, aprova as contas, decide sobre obras e nomeia ou destitui o síndico. Cada condómino dispõe de votos proporcionais aos seus milésimos. O quórum é atingido quando os condóminos presentes ou representados detêm pelo menos 50% dos milésimos.",
    },
    section2Title: {
      fr: "Règlement de copropriété et tantièmes",
      en: "Co-ownership Regulations and Shares",
      de: "Miteigentumsordnung und Miteigentumsanteile",
      lb: "Copropriétéitsreglement an Undeeler",
      pt: "Regulamento de condomínio e milésimos",
    },
    section2Content: {
      fr: "Le règlement de copropriété est un acte notarié obligatoire publié au cadastre qui définit : la destination de l'immeuble, la répartition des parties privatives et communes, les tantièmes/millièmes de chaque lot, les règles de jouissance des parties privatives et communes, et les modalités de répartition des charges. Les tantièmes déterminent à la fois les droits de vote en AG et la répartition des charges communes. Ils sont calculés en fonction de la superficie, de la situation et de la consistance de chaque lot (art. 5 loi 16.05.1975). La modification du règlement de copropriété nécessite un vote à la majorité des 3/4 des tantièmes (art. 14). Les parties communes comprennent : le gros œuvre, les toitures, les escaliers, les halls d'entrée, les espaces verts, les canalisations principales et les équipements collectifs.",
      en: "The co-ownership regulations are a mandatory notarial deed registered at the cadastre that defines: the building's purpose, the distribution of private and common parts, the shares for each lot, rules for use of private and common parts, and charge allocation methods. Shares determine both voting rights at GMs and common charge allocation. They are calculated based on the area, location and consistency of each lot (Art. 5, law of 16.05.1975). Amending the co-ownership regulations requires a 3/4 majority of shares (Art. 14). Common parts include: structural work, roofs, staircases, entrance halls, green spaces, main pipes and collective equipment.",
      de: "Die Miteigentumsordnung ist eine notarielle Pflichtsurkunde, die im Kataster veröffentlicht wird und festlegt: die Zweckbestimmung des Gebäudes, die Aufteilung der privaten und gemeinschaftlichen Teile, die Miteigentumsanteile jeder Einheit, die Nutzungsregeln für private und gemeinschaftliche Teile und die Kostenverteilung. Die Anteile bestimmen sowohl die Stimmrechte in der EV als auch die Kostenverteilung. Sie werden nach Fläche, Lage und Beschaffenheit jeder Einheit berechnet (Art. 5, Gesetz vom 16.05.1975). Eine Änderung der Miteigentumsordnung erfordert eine 3/4-Mehrheit der Anteile (Art. 14). Gemeinschaftsteile umfassen: Rohbau, Dächer, Treppenhäuser, Eingangshallen, Grünflächen, Hauptleitungen und Gemeinschaftsausstattung.",
      lb: "D'Copropriétéitsreglement ass eng notariell Pflichtsurkond, déi am Kataster publizéiert gëtt a definéiert: den Zweck vum Gebai, d'Opdeelung vun de privaten a gemeinsame Deeler, d'Undeeler vu all Lot, d'Notzungsreegelen fir privat a gemeinsam Deeler an d'Käschtenverteilung. D'Undeeler bestëmmen souwuel d'Stëmmrechter an der GV wéi och d'Käschtenverteilung. Si gi no Fläch, Lag a Beschafenheet vun all Lot berechent (Art. 5, Gesetz vum 16.05.1975). Eng Ännerung vum Copropriétéitsreglement erfuerdert eng 3/4-Majoritéit vun den Undeeler (Art. 14). Gemeinschaftsdeeler ëmfaassen: Rohbau, Diecher, Trapen, Agankshal, Grénganlagen, Haaptleitungen a Gemeinschaftsausstattung.",
      pt: "O regulamento de condomínio é uma escritura notarial obrigatória publicada no cadastro que define: a finalidade do edifício, a repartição das partes privativas e comuns, os milésimos de cada lote, as regras de uso das partes privativas e comuns, e as modalidades de repartição de encargos. Os milésimos determinam simultaneamente os direitos de voto na AG e a repartição de encargos comuns. São calculados em função da superfície, da localização e da consistência de cada lote (art. 5, lei de 16.05.1975). A modificação do regulamento de condomínio exige uma maioria de 3/4 dos milésimos (art. 14). As partes comuns compreendem: a estrutura, as coberturas, as escadas, os halls de entrada, os espaços verdes, as canalizações principais e os equipamentos coletivos.",
    },
    section3Title: {
      fr: "Fonds de réserve et majorités de vote",
      en: "Reserve Fund and Voting Majorities",
      de: "Rücklagenfonds und Abstimmungsmehrheiten",
      lb: "Reservefong an Ofstëmmungsmajoritéiten",
      pt: "Fundo de reserva e maiorias de voto",
    },
    section3Content: {
      fr: "Depuis la réforme de 2018, la constitution d'un fonds de réserve est obligatoire pour les copropriétés de plus de 5 lots. La cotisation annuelle minimale est fixée par l'AG et doit permettre de financer les gros travaux de maintenance à venir (ravalement, toiture, ascenseur). Les majorités de vote en AG sont graduées selon l'importance de la décision : majorité simple (50 % + 1 des tantièmes présents/représentés) pour les décisions courantes (budget, entretien) ; majorité absolue (50 % + 1 de tous les tantièmes) pour les travaux d'amélioration ; majorité des 3/4 de tous les tantièmes pour les modifications du règlement de copropriété, les travaux de transformation et le changement de destination de l'immeuble ; unanimité pour les décisions portant atteinte aux droits privatifs (modification de la répartition des tantièmes, suppression d'un équipement privatif). Le conseil syndical, organe facultatif composé de copropriétaires élus, contrôle la gestion du syndic et prépare les AG.",
      en: "Since the 2018 reform, establishing a reserve fund is mandatory for co-ownerships with more than 5 lots. The minimum annual contribution is set by the GM and must fund future major maintenance works (facade renovation, roof, elevator). Voting majorities at GMs are graduated according to the decision's importance: simple majority (50% + 1 of present/represented shares) for routine decisions (budget, maintenance); absolute majority (50% + 1 of all shares) for improvement works; 3/4 majority of all shares for amendments to co-ownership regulations, transformation works and change of building purpose; unanimity for decisions affecting private rights (modifying share allocation, removing private equipment). The syndical council, an optional body of elected co-owners, oversees the syndic's management and prepares GMs.",
      de: "Seit der Reform von 2018 ist die Bildung eines Rücklagenfonds für Miteigentumsgemeinschaften mit mehr als 5 Einheiten Pflicht. Der jährliche Mindestbeitrag wird von der EV festgelegt und muss künftige größere Instandhaltungsarbeiten finanzieren (Fassadensanierung, Dach, Aufzug). Die Abstimmungsmehrheiten in der EV sind nach Bedeutung der Entscheidung gestaffelt: einfache Mehrheit (50 % + 1 der anwesenden/vertretenen Anteile) für laufende Entscheidungen (Budget, Wartung); absolute Mehrheit (50 % + 1 aller Anteile) für Verbesserungsarbeiten; 3/4-Mehrheit aller Anteile für Änderungen der Miteigentumsordnung, Umbauarbeiten und Zweckänderung des Gebäudes; Einstimmigkeit für Entscheidungen, die private Rechte betreffen (Änderung der Anteilsverteilung, Entfernung privater Ausstattung). Der Verwaltungsrat, ein fakultatives Gremium gewählter Miteigentümer, kontrolliert die Verwaltung des Syndikus und bereitet die EV vor.",
      lb: "Zënter der Reform vu 2018 ass d'Bilddung vun engem Reservefong Pflicht fir Copropriétéite mat méi wéi 5 Loten. De jährlech Mindestbäitrag gëtt vun der GV festgeluecht a muss zukünfteg gréisser Ënnerhaltaarbechten finanzéieren (Fassadesanéierung, Daach, Lift). D'Ofstëmmungsmajoritéiten an der GV sinn no der Bedeitung vun der Decisioun gestaffelt: einfach Majoritéit (50 % + 1 vun den uwiersenden/vertruedenen Undeeler) fir laufend Decisiounen (Budget, Ënnerhalt); absolut Majoritéit (50 % + 1 vun allen Undeeler) fir Verbesserungsaarbechten; 3/4-Majoritéit vun allen Undeeler fir Ännerunge vum Copropriétéitsreglement, Ëmbauaarbechten an Zweckännerung vum Gebai; Eestëmmegkeet fir Decisiounen, déi privat Rechter betreffen (Ännerung vun der Undeelerverteilung, Ewechhuele vu privater Ausstattung). De Verwaltungsrot, e fakultatiivt Gremium vu gewielten Copropriétairen, kontrolléiert d'Verwaltung vum Syndikus a bereet d'GV vir.",
      pt: "Desde a reforma de 2018, a constituição de um fundo de reserva é obrigatória para condomínios com mais de 5 lotes. A contribuição anual mínima é fixada pela AG e deve permitir financiar futuras grandes obras de manutenção (renovação de fachada, cobertura, elevador). As maiorias de voto na AG são graduadas conforme a importância da decisão: maioria simples (50% + 1 dos milésimos presentes/representados) para decisões correntes (orçamento, manutenção); maioria absoluta (50% + 1 de todos os milésimos) para obras de melhoria; maioria de 3/4 de todos os milésimos para modificações do regulamento de condomínio, obras de transformação e alteração de destino do edifício; unanimidade para decisões que afetem direitos privativos (modificação da repartição de milésimos, supressão de equipamento privativo). O conselho sindical, órgão facultativo composto por condóminos eleitos, fiscaliza a gestão do síndico e prepara as AG.",
    },
    relatedToolLabel: {
      fr: "Accéder à l'outil syndic",
      en: "Access the syndic tool",
      de: "Zum Syndikus-Tool",
      lb: "Zum Syndikus-Tool",
      pt: "Aceder à ferramenta síndico",
    },
    relatedToolLink: {
      fr: "/syndic",
      en: "/syndic",
      de: "/syndic",
      lb: "/syndic",
      pt: "/syndic",
    },
    faq1Q: {
      fr: "Le syndic est-il obligatoire en copropriété au Luxembourg ?",
      en: "Is a syndic mandatory in Luxembourg co-ownerships?",
      de: "Ist ein Syndikus in Luxemburger Miteigentumsgemeinschaften Pflicht?",
      lb: "Ass e Syndikus an Lëtzebuerger Copropriétéiten Pflicht?",
      pt: "O síndico é obrigatório nos condomínios no Luxemburgo?",
    },
    faq1A: {
      fr: "Oui, la désignation d'un syndic professionnel est obligatoire pour les copropriétés de plus de 5 lots (art. 16, loi modifiée du 16.05.1975). Pour les petites copropriétés (≤ 5 lots), la gestion peut être assurée directement par les copropriétaires.",
      en: "Yes, appointing a professional syndic is mandatory for co-ownerships with more than 5 lots (Art. 16, modified law of 16.05.1975). For small co-ownerships (5 lots or fewer), management can be handled directly by the co-owners.",
      de: "Ja, die Bestellung eines professionellen Syndikus ist für Miteigentumsgemeinschaften mit mehr als 5 Einheiten Pflicht (Art. 16, geändertes Gesetz vom 16.05.1975). Bei kleinen Gemeinschaften (≤ 5 Einheiten) kann die Verwaltung direkt durch die Miteigentümer erfolgen.",
      lb: "Jo, d'Ernennung vun engem professionelle Syndikus ass Pflicht fir Copropriétéite mat méi wéi 5 Loten (Art. 16, geännert Gesetz vum 16.05.1975). Fir kleng Copropriétéiten (≤ 5 Loten) kann d'Verwaltung direkt vun de Copropriétairen iwwerholl ginn.",
      pt: "Sim, a nomeação de um síndico profissional é obrigatória para condomínios com mais de 5 lotes (art. 16, lei modificada de 16.05.1975). Para pequenos condomínios (5 lotes ou menos), a gestão pode ser assegurada diretamente pelos condóminos.",
    },
    faq2Q: {
      fr: "Quelle majorité faut-il pour voter des travaux en copropriété ?",
      en: "What majority is needed to vote on works in a co-ownership?",
      de: "Welche Mehrheit braucht man für Beschlüsse über Arbeiten in einer Miteigentumsgemeinschaft?",
      lb: "Wéi eng Majoritéit brauch ee fir Beschlëss iwwer Aarbechten an enger Copropriétéit?",
      pt: "Que maioria é necessária para votar obras num condomínio?",
    },
    faq2A: {
      fr: "Les travaux d'entretien courant se votent à la majorité simple. Les travaux d'amélioration requièrent la majorité absolue. Les travaux de transformation ou de modification du règlement nécessitent la majorité des 3/4 de tous les tantièmes. Seules les décisions portant atteinte aux droits privatifs exigent l'unanimité.",
      en: "Routine maintenance works require a simple majority. Improvement works require an absolute majority. Transformation works or regulation amendments require a 3/4 majority of all shares. Only decisions affecting private rights require unanimity.",
      de: "Laufende Instandhaltungsarbeiten erfordern eine einfache Mehrheit. Verbesserungsarbeiten erfordern die absolute Mehrheit. Umbauarbeiten oder Ordnungsänderungen erfordern eine 3/4-Mehrheit aller Anteile. Nur Entscheidungen, die private Rechte betreffen, erfordern Einstimmigkeit.",
      lb: "Laufend Ënnerhaltaarbechten erfuerderen eng einfach Majoritéit. Verbesserungsaarbechten erfuerderen eng absolut Majoritéit. Ëmbauaarbechten oder Reeglementsännerungen erfuerderen eng 3/4-Majoritéit vun allen Undeeler. Nëmmen Decisiounen, déi privat Rechter betreffen, erfuerderen Eestëmmegkeet.",
      pt: "As obras de manutenção corrente votam-se por maioria simples. As obras de melhoria requerem maioria absoluta. As obras de transformação ou modificação do regulamento necessitam de maioria de 3/4 de todos os milésimos. Apenas as decisões que afetem direitos privativos exigem unanimidade.",
    },
  },

  // === Guide: Klimabonus ===
  "guide.klimabonus": {
    title: {
      fr: "Quelles sont les aides Klimabonus pour la rénovation énergétique ?",
      en: "What Are the Klimabonus Subsidies for Energy Renovation?",
      de: "Welche Klimabonus-Beihilfen gibt es für die energetische Sanierung?",
      lb: "Wéi eng Klimabonus-Hëllefen gëtt et fir déi energeetesch Sanéierung?",
      pt: "Quais são as ajudas Klimabonus para a renovação energética?",
    },
    metaDescription: {
      fr: "Aides Klimabonus Luxembourg : PRIMe House, subventions isolation/fenêtres/PAC/PV, montants, conditions CPE, cumul TVA 3 %, Klimaprêt taux zéro.",
      en: "Klimabonus subsidies Luxembourg: PRIMe House, insulation/windows/heat pump/PV grants, amounts, EPC conditions, 3% VAT combination, zero-rate Klimaprêt.",
      de: "Klimabonus-Beihilfen Luxemburg: PRIMe House, Zuschüsse Dämmung/Fenster/Wärmepumpe/PV, Beträge, EPB-Bedingungen, 3% MwSt.-Kombination, Klimaprêt Nullzins.",
      lb: "Klimabonus-Hëllefen Lëtzebuerg: PRIMe House, Subventiounen Isolatioun/Fënsteren/Wärmepompel/PV, Montanten, CPE-Bedingungen, 3% TVA-Kombinatioun, Klimaprêt Nullzins.",
      pt: "Ajudas Klimabonus Luxemburgo: PRIMe House, subsídios isolamento/janelas/bomba de calor/PV, montantes, condições CPE, combinação IVA 3%, Klimaprêt taxa zero.",
    },
    intro: {
      fr: "Le Luxembourg offre un ensemble généreux de subventions pour encourager la rénovation énergétique des logements existants et la construction durable. Le programme PRIMe House, remanié en 2024 sous l'appellation « Klimabonus », couvre l'isolation thermique, le remplacement des fenêtres, l'installation de pompes à chaleur (PAC), de panneaux photovoltaïques (PV) et de bornes de recharge. Ces aides sont cumulables avec la TVA à 3 % sur les travaux de rénovation et le Klimaprêt à taux zéro. Voici le détail des montants, conditions et démarches.",
      en: "Luxembourg offers a generous set of subsidies to encourage energy renovation of existing dwellings and sustainable construction. The PRIMe House programme, revamped in 2024 under the 'Klimabonus' label, covers thermal insulation, window replacement, heat pump (HP) installation, photovoltaic (PV) panels and charging stations. These subsidies can be combined with the 3% VAT on renovation works and the zero-rate Klimaprêt loan. Here are the details on amounts, conditions and procedures.",
      de: "Luxemburg bietet großzügige Beihilfen zur Förderung der energetischen Sanierung bestehender Wohngebäude und des nachhaltigen Bauens. Das PRIMe-House-Programm, 2024 unter dem Label 'Klimabonus' neu aufgelegt, umfasst Wärmedämmung, Fenstertausch, Wärmepumpen-Installation (WP), Photovoltaik-Anlagen (PV) und Ladestationen. Diese Beihilfen sind kombinierbar mit der 3%-MwSt. auf Renovierungsarbeiten und dem zinslosen Klimaprêt. Hier die Details zu Beträgen, Bedingungen und Verfahren.",
      lb: "Lëtzebuerg bitt eng generéis Rei vu Subventiounen fir déi energeetesch Sanéierung vu bestoende Wunnenge an nohaltegt Bauen ze fërderen. De PRIMe-House-Programm, 2024 ënnert dem Label 'Klimabonus' nei opgeluecht, deckt Wärmedämmung, Fënstertausch, Wärmepompel-Installatioun (WP), Photovoltaik-Anlagen (PV) a Luedstatiounen of. Dës Hëllefen si kombinéierbar mat der 3%-TVA op Renovatiounsaarbechten an dem zinslose Klimaprêt. Hei d'Detailer zu Montanten, Bedingungen a Prozeduren.",
      pt: "O Luxemburgo oferece um conjunto generoso de subsídios para incentivar a renovação energética de habitações existentes e a construção sustentável. O programa PRIMe House, remodelado em 2024 sob a designação 'Klimabonus', cobre o isolamento térmico, a substituição de janelas, a instalação de bombas de calor (BC), painéis fotovoltaicos (PV) e postos de carregamento. Estas ajudas são cumuláveis com o IVA a 3% sobre obras de renovação e o Klimaprêt a taxa zero. Eis o detalhe dos montantes, condições e procedimentos.",
    },
    section1Title: {
      fr: "PRIMe House : subventions par poste de travaux",
      en: "PRIMe House: Subsidies by Work Category",
      de: "PRIMe House: Zuschüsse nach Arbeitskategorie",
      lb: "PRIMe House: Subventiounen no Aarbechtskategorie",
      pt: "PRIMe House: subsídios por categoria de obras",
    },
    section1Content: {
      fr: "Les subventions PRIMe House / Klimabonus sont accordées par le Ministère de l'Environnement, du Climat et du Développement durable via myenergy. Principaux montants (barème 2024-2025) : isolation toiture/combles jusqu'à 55 €/m² ; isolation murs extérieurs jusqu'à 110 €/m² ; isolation dalle/cave jusqu'à 55 €/m² ; remplacement fenêtres triple vitrage jusqu'à 150 €/m² de surface vitrée ; pompe à chaleur air-eau/géothermique 6 000 à 12 000 € ; installation photovoltaïque 500 €/kWc (max 20 kWc) ; ventilation double flux avec récupération de chaleur 3 000 à 5 000 €. Les montants exacts dépendent de la performance atteinte (amélioration de la classe CPE) et peuvent être majorés en fonction de critères sociaux. Une bonification de 25 % est accordée si le logement est loué à un loyer social.",
      en: "PRIMe House / Klimabonus subsidies are granted by the Ministry of the Environment, Climate and Sustainable Development via myenergy. Key amounts (2024-2025 schedule): roof/attic insulation up to EUR 55/m²; external wall insulation up to EUR 110/m²; floor/cellar insulation up to EUR 55/m²; triple-glazed window replacement up to EUR 150/m² of glazed area; air-to-water/geothermal heat pump EUR 6,000 to 12,000; photovoltaic installation EUR 500/kWp (max 20 kWp); dual-flow ventilation with heat recovery EUR 3,000 to 5,000. Exact amounts depend on the performance achieved (improvement in EPC class) and may be increased based on social criteria. A 25% bonus is granted if the dwelling is rented at a social rent.",
      de: "PRIMe-House-/Klimabonus-Zuschüsse werden vom Ministerium für Umwelt, Klima und nachhaltige Entwicklung über myenergy gewährt. Wichtige Beträge (Tarif 2024-2025): Dach-/Dachbodendämmung bis zu 55 €/m²; Außenwanddämmung bis zu 110 €/m²; Boden-/Kellerdämmung bis zu 55 €/m²; Fensteraustausch Dreifachverglasung bis zu 150 €/m² Glasfläche; Luft-Wasser-/Erdwärmepumpe 6.000 bis 12.000 €; Photovoltaikanlage 500 €/kWp (max. 20 kWp); Lüftung mit Wärmerückgewinnung 3.000 bis 5.000 €. Die genauen Beträge hängen von der erreichten Leistung (Verbesserung der EPB-Klasse) ab und können nach sozialen Kriterien erhöht werden. Ein Bonus von 25 % wird gewährt, wenn die Wohnung zu einer Sozialmiete vermietet wird.",
      lb: "PRIMe-House-/Klimabonus-Subventiounen gi vum Ministère fir Ëmwelt, Klima an nohalteg Entwécklung iwwer myenergy accordéiert. Wichteg Montanten (Tarif 2024-2025): Daach-/Daachbuedemdämmung bis zu 55 €/m²; Baussemauerisolatioun bis zu 110 €/m²; Buedem-/Kellerdämmung bis zu 55 €/m²; Fënstertausch Dräifachverglasung bis zu 150 €/m² Glasfläch; Loft-Waasser-/Äerdwärmepompel 6.000 bis 12.000 €; Photovoltaikanlage 500 €/kWp (max. 20 kWp); Lëftung mat Wärmeréckgewannung 3.000 bis 5.000 €. Déi genee Montante hänken vun der erreechter Leeschtung (Verbesserung vun der CPE-Klass) of a kënne no sozialen Kritären erhéicht ginn. E Bonus vu 25 % gëtt accordéiert, wann d'Wunneng zu enger Sozialloyer verlount gëtt.",
      pt: "Os subsídios PRIMe House / Klimabonus são concedidos pelo Ministério do Ambiente, Clima e Desenvolvimento Sustentável via myenergy. Montantes principais (tabela 2024-2025): isolamento telhado/sótão até 55 EUR/m²; isolamento paredes exteriores até 110 EUR/m²; isolamento laje/cave até 55 EUR/m²; substituição janelas triplas até 150 EUR/m² de superfície envidraçada; bomba de calor ar-água/geotérmica 6.000 a 12.000 EUR; instalação fotovoltaica 500 EUR/kWp (máx. 20 kWp); ventilação duplo fluxo com recuperação de calor 3.000 a 5.000 EUR. Os montantes exatos dependem do desempenho alcançado (melhoria da classe CPE) e podem ser majorados segundo critérios sociais. Uma bonificação de 25% é concedida se a habitação for arrendada a renda social.",
    },
    section2Title: {
      fr: "Conditions : le certificat de performance énergétique (CPE)",
      en: "Conditions: The Energy Performance Certificate (EPC)",
      de: "Bedingungen: Der Energieausweis (EPB)",
      lb: "Bedingungen: Den Energieausweis (CPE)",
      pt: "Condições: o Certificado de Desempenho Energético (CPE)",
    },
    section2Content: {
      fr: "Pour bénéficier des aides Klimabonus, un certificat de performance énergétique (CPE) doit être réalisé avant et après les travaux par un conseiller en énergie agréé. Le CPE classe le bâtiment de A (très performant) à I (très énergivore) selon deux axes : besoin en énergie primaire (kWh/m²/an) et isolation thermique de l'enveloppe. Les subventions sont conditionnées à une amélioration d'au moins 2 classes CPE (ex. : passer de F à D). Pour les rénovations profondes visant la classe A ou B, des montants majorés sont prévus. Le CPE avant travaux ne doit pas dater de plus de 2 ans. L'audit énergétique lui-même est subventionné par myenergy (conseil gratuit). Les travaux doivent être réalisés par des entreprises établies au Luxembourg ou dans l'UE, et les factures doivent être acquittées dans les 4 ans suivant l'accord de principe.",
      en: "To qualify for Klimabonus subsidies, an Energy Performance Certificate (EPC) must be carried out before and after works by an approved energy advisor. The EPC classifies the building from A (very efficient) to I (very energy-intensive) on two axes: primary energy demand (kWh/m²/year) and thermal insulation of the envelope. Subsidies require improvement of at least 2 EPC classes (e.g. from F to D). For deep renovations targeting class A or B, increased amounts are available. The pre-works EPC must not be older than 2 years. The energy audit itself is subsidised by myenergy (free advice). Works must be carried out by companies established in Luxembourg or the EU, and invoices must be settled within 4 years of the agreement in principle.",
      de: "Um Klimabonus-Beihilfen zu erhalten, muss ein Energieausweis (EPB) vor und nach den Arbeiten von einem zugelassenen Energieberater erstellt werden. Der EPB klassifiziert das Gebäude von A (sehr effizient) bis I (sehr energieintensiv) nach zwei Achsen: Primärenergiebedarf (kWh/m²/Jahr) und Wärmedämmung der Gebäudehülle. Die Zuschüsse erfordern eine Verbesserung um mindestens 2 EPB-Klassen (z.B. von F auf D). Für Tiefensanierungen mit Zielklasse A oder B sind erhöhte Beträge vorgesehen. Der EPB vor Beginn der Arbeiten darf nicht älter als 2 Jahre sein. Das Energieaudit selbst wird von myenergy subventioniert (kostenlose Beratung). Die Arbeiten müssen von in Luxemburg oder der EU ansässigen Unternehmen durchgeführt werden, und die Rechnungen müssen innerhalb von 4 Jahren nach der Grundsatzvereinbarung beglichen sein.",
      lb: "Fir Klimabonus-Hëllefen ze kréien, muss en Energieausweis (CPE) virun an no den Aarbechte vun engem zougeloossenen Energieberoder erstallt ginn. De CPE klasséiert d'Gebai vun A (ganz effizient) bis I (ganz energieintensiv) no zwee Achsen: Primärenergiebesoin (kWh/m²/Joer) an Wärmedämmung vun der Gebaienhüll. D'Subventiounen erfuerderen eng Verbesserung vun op mannst 2 CPE-Klassen (z.B. vu F op D). Fir Déifsanéierunge mat Zilklass A oder B sinn erhéicht Montante virgesinn. De CPE virun den Aarbechte dierf net méi al wéi 2 Joer sinn. Den Energieaudit selwer gëtt vu myenergy subventionéiert (gratis Berodung). D'Aarbechte mussen vun zu Lëtzebuerg oder an der EU ugesiddelten Entreprisen duerchgefouert ginn, an d'Rechnunge mussen bannent 4 Joer no der Grondverständegung bezuelt sinn.",
      pt: "Para beneficiar das ajudas Klimabonus, um Certificado de Desempenho Energético (CPE) deve ser realizado antes e depois das obras por um consultor energético aprovado. O CPE classifica o edifício de A (muito eficiente) a I (muito energívoro) segundo dois eixos: necessidade de energia primária (kWh/m²/ano) e isolamento térmico da envolvente. Os subsídios estão condicionados a uma melhoria de pelo menos 2 classes CPE (ex.: passar de F a D). Para renovações profundas visando a classe A ou B, estão previstos montantes majorados. O CPE antes das obras não deve ter mais de 2 anos. A auditoria energética em si é subsidiada pela myenergy (aconselhamento gratuito). As obras devem ser realizadas por empresas estabelecidas no Luxemburgo ou na UE, e as faturas devem ser liquidadas nos 4 anos seguintes ao acordo de princípio.",
    },
    section3Title: {
      fr: "Cumul avec la TVA à 3 % et le Klimaprêt",
      en: "Combining with 3% VAT and Klimaprêt",
      de: "Kombination mit 3% MwSt. und Klimaprêt",
      lb: "Kombinatioun mat 3% TVA an Klimaprêt",
      pt: "Acumulação com IVA a 3% e Klimaprêt",
    },
    section3Content: {
      fr: "Les aides Klimabonus sont cumulables avec le taux de TVA super-réduit de 3 % applicable aux travaux de rénovation et de transformation de logements au Luxembourg (application limitée à un plafond de 50 000 € de TVA par logement). Elles sont également cumulables avec le Klimaprêt, un prêt à taux zéro accordé par les banques partenaires (BCEE, BIL, Raiffeisen, etc.) pour financer les travaux de rénovation énergétique. Le montant du Klimaprêt peut atteindre 50 000 € remboursable sur 15 ans maximum, sans intérêts (l'État prend en charge la bonification). Pour en bénéficier, les travaux doivent figurer dans le devis validé par myenergy et concerner une amélioration effective de la performance énergétique. Au total, un propriétaire qui rénove un logement ancien de classe G vers classe B peut cumuler 30 000 à 50 000 € de subventions PRIMe House, la TVA réduite (économie de 10 000 à 20 000 €) et un Klimaprêt à 0 %, réduisant considérablement le reste à charge.",
      en: "Klimabonus subsidies can be combined with the super-reduced 3% VAT rate applicable to renovation and conversion works on housing in Luxembourg (limited to a ceiling of EUR 50,000 in VAT per dwelling). They are also combinable with the Klimaprêt, a zero-rate loan granted by partner banks (BCEE, BIL, Raiffeisen, etc.) to finance energy renovation works. The Klimaprêt amount can reach EUR 50,000 repayable over a maximum of 15 years, interest-free (the State covers the interest subsidy). To qualify, works must appear in the quote validated by myenergy and concern effective improvement of energy performance. In total, an owner renovating an older dwelling from class G to class B can combine EUR 30,000 to 50,000 in PRIMe House subsidies, reduced VAT (saving EUR 10,000 to 20,000) and a 0% Klimaprêt, considerably reducing the remaining cost.",
      de: "Die Klimabonus-Beihilfen sind kombinierbar mit dem super-ermäßigten MwSt.-Satz von 3 % für Renovierungs- und Umbauarbeiten an Wohnungen in Luxemburg (begrenzt auf eine Obergrenze von 50.000 € MwSt. pro Wohnung). Sie sind auch kombinierbar mit dem Klimaprêt, einem zinslosen Darlehen von Partnerbanken (BCEE, BIL, Raiffeisen etc.) zur Finanzierung energetischer Sanierungsarbeiten. Das Klimaprêt kann bis zu 50.000 € betragen, rückzahlbar über maximal 15 Jahre, zinsfrei (der Staat übernimmt die Zinsbonifikation). Voraussetzung ist, dass die Arbeiten im von myenergy validierten Kostenvoranschlag aufgeführt sind und eine effektive Verbesserung der Energieeffizienz betreffen. Insgesamt kann ein Eigentümer, der ein älteres Gebäude von Klasse G auf Klasse B saniert, 30.000 bis 50.000 € PRIMe-House-Zuschüsse, die ermäßigte MwSt. (Ersparnis 10.000 bis 20.000 €) und einen Klimaprêt zu 0 % kombinieren, was die Restkosten erheblich reduziert.",
      lb: "D'Klimabonus-Hëllefen si kombinéierbar mam super-reduzéierten TVA-Saz vu 3 % fir Renovatiouns- an Ëmbauaarbechten u Wunnengen zu Lëtzebuerg (limitéiert op en Héchstbetrag vu 50.000 € TVA pro Wunneng). Si si och kombinéierbar mam Klimaprêt, engem zinslose Prêt vu Partnerbanken (BCEE, BIL, Raiffeisen etc.) fir déi energeetesch Sanéierungsaarbechten ze finanzéieren. De Klimaprêt kann bis zu 50.000 € erreechen, réckzuelbar iwwer maximal 15 Joer, ouni Zinsen (de Staat iwwerhëlt d'Zinsbonifikatioun). Viraussetzung ass, dass d'Aarbechten am vun myenergy validéierte Kostenvirschlag opgelëscht sinn an eng effektiv Verbesserung vun der Energieeffizienz betreffen. Am Ganzen kann en Proprietaire, deen en eelert Gebai vu Klass G op Klass B sanéiert, 30.000 bis 50.000 € PRIMe-House-Subventiounen, d'reduzéiert TVA (Erspuernis 10.000 bis 20.000 €) an e Klimaprêt zu 0 % kombinéieren, wat d'Reschtkosten erhieflech reduzéiert.",
      pt: "As ajudas Klimabonus são cumuláveis com a taxa de IVA super-reduzida de 3% aplicável a obras de renovação e transformação de habitações no Luxemburgo (limitada a um teto de 50.000 EUR de IVA por habitação). São igualmente cumuláveis com o Klimaprêt, um empréstimo a taxa zero concedido por bancos parceiros (BCEE, BIL, Raiffeisen, etc.) para financiar obras de renovação energética. O montante do Klimaprêt pode atingir 50.000 EUR reembolsável em máximo 15 anos, sem juros (o Estado assume a bonificação de juros). Para beneficiar, as obras devem constar do orçamento validado pela myenergy e referir-se a uma melhoria efetiva do desempenho energético. No total, um proprietário que renove uma habitação antiga de classe G para classe B pode acumular 30.000 a 50.000 EUR de subsídios PRIMe House, o IVA reduzido (poupança de 10.000 a 20.000 EUR) e um Klimaprêt a 0%, reduzindo consideravelmente o custo remanescente.",
    },
    relatedToolLabel: {
      fr: "Simuler vos aides à la rénovation",
      en: "Simulate your renovation subsidies",
      de: "Simulieren Sie Ihre Renovierungszuschüsse",
      lb: "Simuléiert Är Renovatiounssubventiounen",
      pt: "Simule as suas ajudas à renovação",
    },
    relatedToolLink: {
      fr: "/simulateur-aides",
      en: "/simulateur-aides",
      de: "/simulateur-aides",
      lb: "/simulateur-aides",
      pt: "/simulateur-aides",
    },
    faq1Q: {
      fr: "Les aides Klimabonus sont-elles cumulables avec la TVA à 3 % ?",
      en: "Can Klimabonus subsidies be combined with 3% VAT?",
      de: "Sind Klimabonus-Beihilfen mit der 3%-MwSt. kombinierbar?",
      lb: "Sinn d'Klimabonus-Hëllefen mat der 3%-TVA kombinéierbar?",
      pt: "As ajudas Klimabonus são cumuláveis com o IVA a 3%?",
    },
    faq1A: {
      fr: "Oui, les subventions PRIMe House / Klimabonus sont intégralement cumulables avec la TVA à 3 % sur les travaux de rénovation et avec le Klimaprêt à taux zéro. C'est l'un des dispositifs les plus avantageux d'Europe pour la rénovation énergétique.",
      en: "Yes, PRIMe House / Klimabonus subsidies are fully combinable with the 3% VAT on renovation works and with the zero-rate Klimaprêt. It is one of the most advantageous schemes in Europe for energy renovation.",
      de: "Ja, die PRIMe-House-/Klimabonus-Zuschüsse sind vollständig kombinierbar mit der 3%-MwSt. auf Renovierungsarbeiten und dem zinslosen Klimaprêt. Es ist eines der vorteilhaftesten Programme in Europa für energetische Sanierung.",
      lb: "Jo, d'PRIMe-House-/Klimabonus-Subventiounen si vollstänneg kombinéierbar mat der 3%-TVA op Renovatiounsaarbechten an dem zinslose Klimaprêt. Et ass eent vun de virdeelechsten Programmer an Europa fir energeetesch Sanéierung.",
      pt: "Sim, os subsídios PRIMe House / Klimabonus são integralmente cumuláveis com o IVA a 3% sobre obras de renovação e com o Klimaprêt a taxa zero. É um dos dispositivos mais vantajosos da Europa para renovação energética.",
    },
    faq2Q: {
      fr: "Combien peut-on obtenir pour l'installation d'une pompe à chaleur au Luxembourg ?",
      en: "How much can you get for installing a heat pump in Luxembourg?",
      de: "Wie viel Zuschuss gibt es für eine Wärmepumpe in Luxemburg?",
      lb: "Wéi vill Subventioun kritt een fir eng Wärmepompel zu Lëtzebuerg?",
      pt: "Quanto se pode obter para instalar uma bomba de calor no Luxemburgo?",
    },
    faq2A: {
      fr: "L'aide pour l'installation d'une pompe à chaleur (air-eau ou géothermique) varie de 6 000 à 12 000 € selon le type et la puissance, dans le cadre du programme PRIMe House / Klimabonus. Ce montant peut être majoré de 25 % si le logement est loué à un loyer social. S'y ajoute le bénéfice de la TVA à 3 % et du Klimaprêt à taux zéro.",
      en: "The subsidy for installing a heat pump (air-to-water or geothermal) ranges from EUR 6,000 to 12,000 depending on type and capacity, under the PRIMe House / Klimabonus programme. This amount can be increased by 25% if the dwelling is rented at a social rent. Additionally, the 3% VAT benefit and zero-rate Klimaprêt apply.",
      de: "Der Zuschuss für die Installation einer Wärmepumpe (Luft-Wasser oder Erdwärme) beträgt 6.000 bis 12.000 € je nach Typ und Leistung im Rahmen des PRIMe-House-/Klimabonus-Programms. Dieser Betrag kann um 25 % erhöht werden, wenn die Wohnung zu einer Sozialmiete vermietet wird. Hinzu kommen die 3%-MwSt.-Vergünstigung und der zinslose Klimaprêt.",
      lb: "D'Subventioun fir d'Installatioun vun enger Wärmepompel (Loft-Waasser oder Äerdwärm) betreit 6.000 bis 12.000 € je no Typ a Leeschtung am Kader vum PRIMe-House-/Klimabonus-Programm. Dëse Montant kann ëm 25 % erhéicht ginn, wann d'Wunneng zu enger Sozialloyer verlount gëtt. Dozou kommen d'3%-TVA-Vergënschtegung an de zinslose Klimaprêt.",
      pt: "O subsídio para instalação de uma bomba de calor (ar-água ou geotérmica) varia de 6.000 a 12.000 EUR segundo o tipo e a potência, no âmbito do programa PRIMe House / Klimabonus. Este montante pode ser majorado em 25% se a habitação for arrendada a renda social. Acresce o benefício do IVA a 3% e do Klimaprêt a taxa zero.",
    },
  },

  // === Guide: Estimation bien immobilier ===
  "guide.estimation": {
    title: {
      fr: "Comment estimer la valeur d'un bien immobilier au Luxembourg ?",
      en: "How to Estimate the Value of a Property in Luxembourg?",
      de: "Wie schätzt man den Wert einer Immobilie in Luxemburg?",
      lb: "Wéi schätzt een de Wäert vun enger Immobilie zu Lëtzebuerg?",
      pt: "Como estimar o valor de um imóvel no Luxemburgo?",
    },
    metaDescription: {
      fr: "Estimation immobilière Luxembourg : 3 approches (comparaison, capitalisation, DCF), sources de données, facteurs clés, modèle hédonique, TEGOVA EVS 2025.",
      en: "Property valuation Luxembourg: 3 approaches (comparison, capitalisation, DCF), data sources, key factors, hedonic model, TEGOVA EVS 2025.",
      de: "Immobilienbewertung Luxemburg: 3 Ansätze (Vergleich, Kapitalisierung, DCF), Datenquellen, Schlüsselfaktoren, hedonisches Modell, TEGOVA EVS 2025.",
      lb: "Immobiliebewäertung Lëtzebuerg: 3 Approchen (Vergläich, Kapitaliséierung, DCF), Datenquellen, Schlësselfaktoren, hedonesch Modell, TEGOVA EVS 2025.",
      pt: "Avaliação imobiliária Luxemburgo: 3 abordagens (comparação, capitalização, DCF), fontes de dados, fatores-chave, modelo hedónico, TEGOVA EVS 2025.",
    },
    intro: {
      fr: "Estimer la valeur d'un bien immobilier au Luxembourg nécessite une méthodologie rigoureuse appuyée sur des données fiables. Les professionnels (experts évaluateurs TEGOVA REV/TRV, agents immobiliers) utilisent principalement trois approches : la comparaison directe, la capitalisation des revenus et le Discounted Cash Flow (DCF). Le choix de la méthode dépend du type de bien (résidentiel, commercial, hôtelier) et de la disponibilité des données de marché. Les normes européennes d'évaluation TEGOVA EVS 2025 encadrent ces pratiques au Luxembourg.",
      en: "Estimating property value in Luxembourg requires a rigorous methodology supported by reliable data. Professionals (TEGOVA REV/TRV valuers, real estate agents) primarily use three approaches: direct comparison, income capitalisation and Discounted Cash Flow (DCF). The choice of method depends on the property type (residential, commercial, hospitality) and market data availability. The European TEGOVA EVS 2025 valuation standards govern these practices in Luxembourg.",
      de: "Die Immobilienbewertung in Luxemburg erfordert eine rigorose Methodik, gestützt auf zuverlässige Daten. Fachleute (TEGOVA REV/TRV-Gutachter, Immobilienmakler) verwenden hauptsächlich drei Ansätze: direkten Vergleich, Ertragswertkapitalisierung und Discounted Cash Flow (DCF). Die Methodenwahl hängt von der Immobilienart (Wohn-, Gewerbe-, Hotelimmobilie) und der Verfügbarkeit von Marktdaten ab. Die europäischen Bewertungsstandards TEGOVA EVS 2025 regeln diese Praktiken in Luxemburg.",
      lb: "D'Immobiliebewäertung zu Lëtzebuerg erfuerdert eng rigoréis Methodik, gestëtzt op zouverlässeg Donnéeën. Fachleit (TEGOVA REV/TRV-Experten, Immobiliemakler) benotzen haaptsächlech dräi Approchen: direkten Vergläich, Ertragswäertkapitaliséierung an Discounted Cash Flow (DCF). D'Methodewiel hänkt vum Immobilietyp (Wunn-, Gewerbe-, Hotelimmobilie) an der Verfügbarkeet vu Marktdonnéeën of. Déi europäesch Bewäertungsstandarden TEGOVA EVS 2025 reegelen dës Praktiken zu Lëtzebuerg.",
      pt: "Estimar o valor de um imóvel no Luxemburgo requer uma metodologia rigorosa apoiada em dados fiáveis. Os profissionais (peritos avaliadores TEGOVA REV/TRV, agentes imobiliários) utilizam principalmente três abordagens: comparação direta, capitalização de rendimentos e Discounted Cash Flow (DCF). A escolha do método depende do tipo de imóvel (residencial, comercial, hoteleiro) e da disponibilidade de dados de mercado. As normas europeias de avaliação TEGOVA EVS 2025 enquadram estas práticas no Luxemburgo.",
    },
    section1Title: {
      fr: "Les 3 approches d'évaluation",
      en: "The 3 Valuation Approaches",
      de: "Die 3 Bewertungsansätze",
      lb: "Déi 3 Bewäertungsapprochen",
      pt: "As 3 abordagens de avaliação",
    },
    section1Content: {
      fr: "L'approche par comparaison directe est la plus utilisée pour les biens résidentiels : elle consiste à analyser les prix de vente récents de biens similaires dans le même secteur géographique, puis à ajuster pour les différences (surface, étage, état, orientation, parking). C'est la méthode privilégiée lorsque le marché offre suffisamment de références comparables. L'approche par capitalisation des revenus est adaptée aux biens locatifs : la valeur est obtenue en divisant le revenu locatif net annuel par un taux de capitalisation reflétant le risque et le rendement attendu du marché. Au Luxembourg, les taux de capitalisation résidentiels oscillent entre 3 % et 5 % selon la localisation. L'approche par Discounted Cash Flow (DCF) projette les flux de trésorerie futurs (loyers, charges, revente) sur une période de 10 à 15 ans et les actualise au taux de rendement requis. Cette méthode est privilégiée pour les actifs commerciaux et hôteliers, conformément à l'EVS 2025 (European Valuation Standards).",
      en: "The direct comparison approach is most commonly used for residential properties: it involves analysing recent sale prices of similar properties in the same area, then adjusting for differences (area, floor, condition, orientation, parking). This is the preferred method when the market provides sufficient comparable references. The income capitalisation approach suits rental properties: value is obtained by dividing net annual rental income by a capitalisation rate reflecting market risk and expected return. In Luxembourg, residential capitalisation rates range between 3% and 5% depending on location. The Discounted Cash Flow (DCF) approach projects future cash flows (rents, charges, resale) over 10 to 15 years and discounts them at the required rate of return. This method is preferred for commercial and hospitality assets, in line with EVS 2025 (European Valuation Standards).",
      de: "Der direkte Vergleichsansatz wird am häufigsten für Wohnimmobilien verwendet: Er analysiert aktuelle Verkaufspreise ähnlicher Objekte im selben Gebiet und passt für Unterschiede an (Fläche, Stockwerk, Zustand, Ausrichtung, Stellplatz). Dies ist die bevorzugte Methode, wenn der Markt ausreichend Vergleichsobjekte bietet. Der Ertragswertansatz eignet sich für Mietobjekte: Der Wert wird ermittelt, indem die jährliche Nettomieteinnahme durch einen Kapitalisierungssatz geteilt wird, der Marktrisiko und erwartete Rendite widerspiegelt. In Luxemburg liegen die Kapitalisierungssätze für Wohnimmobilien zwischen 3 % und 5 % je nach Lage. Der Discounted-Cash-Flow-Ansatz (DCF) projiziert künftige Zahlungsströme (Mieten, Kosten, Wiederverkauf) über 10 bis 15 Jahre und diskontiert sie mit dem geforderten Renditesatz. Diese Methode wird für Gewerbe- und Hotelimmobilien bevorzugt, gemäß EVS 2025 (European Valuation Standards).",
      lb: "Den direkten Vergläichsansaz gëtt am heefegsten fir Wunnimmobilie benotzt: Hien analyséiert aktuell Verkafspräisser vun ähnlechen Objeten am selwechte Gebitt an passt fir Ënnerscheeder un (Fläch, Stack, Zoustand, Ausriichtung, Parking). Dëst ass déi bevorzugt Method, wann de Marché genuch Vergläichsobjeten bitt. Den Ertragswäertansaz eegent sech fir Mietobjeten: De Wäert gëtt ermëttelt, andeems d'jährlech Nettomietanahm duerch en Kapitaliséierungssaz gedeelt gëtt, deen de Marktrisiko an d'erwaart Rendit widerspigelt. Zu Lëtzebuerg leien d'Kapitaliséierungssätz fir Wunnimmobilie tëschent 3 % an 5 % je no Lag. Den Discounted-Cash-Flow-Ansaz (DCF) projizéiert zukünfteg Zahlungsströme (Loyeren, Käschten, Widdervekaf) iwwer 10 bis 15 Joer an diskontéiert se mam gefierderten Renditesaz. Dës Method gëtt fir Gewerbe- an Hotelimmobilie bevorzugt, geméiss EVS 2025 (European Valuation Standards).",
      pt: "A abordagem por comparação direta é a mais utilizada para imóveis residenciais: consiste em analisar os preços de venda recentes de imóveis semelhantes na mesma zona geográfica e depois ajustar para as diferenças (superfície, andar, estado, orientação, estacionamento). É o método preferido quando o mercado oferece referências comparáveis suficientes. A abordagem por capitalização de rendimentos adapta-se a imóveis de arrendamento: o valor obtém-se dividindo o rendimento locativo líquido anual por uma taxa de capitalização que reflete o risco e o rendimento esperado do mercado. No Luxemburgo, as taxas de capitalização residenciais oscilam entre 3% e 5% conforme a localização. A abordagem por Discounted Cash Flow (DCF) projeta os fluxos de tesouraria futuros (rendas, encargos, revenda) num período de 10 a 15 anos e atualiza-os à taxa de rendimento exigida. Este método é privilegiado para ativos comerciais e hoteleiros, conforme a EVS 2025 (European Valuation Standards).",
    },
    section2Title: {
      fr: "Sources de données au Luxembourg",
      en: "Data Sources in Luxembourg",
      de: "Datenquellen in Luxemburg",
      lb: "Datenquellen zu Lëtzebuerg",
      pt: "Fontes de dados no Luxemburgo",
    },
    section2Content: {
      fr: "L'estimation fiable repose sur des données de qualité. Au Luxembourg, les principales sources sont : l'Observatoire de l'Habitat (observatoire.liser.lu) qui publie des prix de transaction moyens par commune et par type de bien ; le STATEC qui fournit l'indice des prix de l'immobilier résidentiel (IPIR) et les indices de construction ; la Publicité Foncière (Administration de l'enregistrement et des domaines) qui recense les actes de vente notariés avec les prix réels ; le portail immobilier athome.lu qui agrège les annonces du marché. Pour les biens commerciaux, les rapports des cabinets de conseil (JLL, CBRE, Cushman & Wakefield) fournissent des données sur les loyers de bureau, les taux de vacance et les rendements. Le modèle hédonique, utilisé notamment par le LISER, décompose le prix d'un bien en fonction de ses caractéristiques intrinsèques (surface, nombre de pièces, performance énergétique) et extrinsèques (localisation, proximité transports, écoles), permettant d'estimer la valeur marginale de chaque attribut.",
      en: "Reliable estimation relies on quality data. In Luxembourg, the main sources are: the Housing Observatory (observatoire.liser.lu) which publishes average transaction prices by municipality and property type; STATEC which provides the residential property price index (IPIR) and construction indices; Land Registry (Registration and Domains Administration) which records notarial sale deeds with actual prices; the athome.lu property portal which aggregates market listings. For commercial properties, consulting firm reports (JLL, CBRE, Cushman & Wakefield) provide data on office rents, vacancy rates and yields. The hedonic model, used notably by LISER, decomposes a property's price based on its intrinsic characteristics (area, number of rooms, energy performance) and extrinsic factors (location, transport proximity, schools), enabling estimation of each attribute's marginal value.",
      de: "Eine zuverlässige Bewertung basiert auf qualitativ hochwertigen Daten. In Luxemburg sind die Hauptquellen: das Wohnungsobservatorium (observatoire.liser.lu) mit durchschnittlichen Transaktionspreisen nach Gemeinde und Immobilientyp; STATEC mit dem Wohnimmobilienpreisindex (IPIR) und Bauindizes; das Grundbuchamt (Administration de l'enregistrement et des domaines) mit notariellen Kaufurkunden und realen Preisen; das Immobilienportal athome.lu mit Marktangeboten. Für Gewerbeimmobilien liefern Beratungsberichte (JLL, CBRE, Cushman & Wakefield) Daten zu Büromieten, Leerstandsquoten und Renditen. Das hedonische Modell, insbesondere vom LISER verwendet, zerlegt den Immobilienpreis nach intrinsischen Merkmalen (Fläche, Zimmerzahl, Energieeffizienz) und extrinsischen Faktoren (Lage, ÖPNV-Nähe, Schulen) und ermöglicht die Schätzung des Grenzwerts jedes Attributs.",
      lb: "Eng zouverlässeg Bewäertung baséiert op qualitativ héichwäertegen Donnéeën. Zu Lëtzebuerg sinn d'Haaptquellen: den Observatoire de l'Habitat (observatoire.liser.lu) mat duerchschnëttlechen Transaktiounspräisser no Gemeng an Immobilientyp; de STATEC mam Wunnimmobiliepräisindex (IPIR) an Bauindizen; d'Publicité Foncière (Administration de l'enregistrement et des domaines) mat notarielle Kafakten a reellen Präisser; den Immobilieportal athome.lu mat Marchéangeboder. Fir Gewerbeimmobilien liwweren d'Berichter vu Berodungsfirmen (JLL, CBRE, Cushman & Wakefield) Donnéeën zu Büroloyeren, Leerstands-Taux a Renditen. Den hedonesche Modell, besonnesch vum LISER benotzt, zerléit den Immobiliepräis no intrinseschen Eegeschaften (Fläch, Zimmerzuel, Energieeffizienz) an extrinseschen Faktoren (Lag, ëffentlechen Transport, Schoulen) an erméiglecht d'Schätzung vum Grenzwäert vun all Attribut.",
      pt: "A estimativa fiável assenta em dados de qualidade. No Luxemburgo, as principais fontes são: o Observatório da Habitação (observatoire.liser.lu) que publica preços médios de transação por município e tipo de imóvel; o STATEC que fornece o índice de preços do imobiliário residencial (IPIR) e os índices de construção; a Publicidade Fundiária (Administração do Registo e Domínios) que recensa as escrituras de venda notariais com preços reais; o portal imobiliário athome.lu que agrega anúncios do mercado. Para imóveis comerciais, os relatórios de consultoras (JLL, CBRE, Cushman & Wakefield) fornecem dados sobre rendas de escritórios, taxas de vacância e rendimentos. O modelo hedónico, utilizado nomeadamente pelo LISER, decompõe o preço de um imóvel em função das suas características intrínsecas (superfície, número de divisões, desempenho energético) e extrínsecas (localização, proximidade de transportes, escolas), permitindo estimar o valor marginal de cada atributo.",
    },
    section3Title: {
      fr: "Facteurs clés de valorisation et normes TEGOVA",
      en: "Key Valuation Factors and TEGOVA Standards",
      de: "Schlüsselfaktoren der Bewertung und TEGOVA-Standards",
      lb: "Schlësselfaktoren vun der Bewäertung an TEGOVA-Standarden",
      pt: "Fatores-chave de valorização e normas TEGOVA",
    },
    section3Content: {
      fr: "Les facteurs qui influencent le plus la valeur d'un bien au Luxembourg sont : la localisation (commune, quartier, rue — avec un écart de prix pouvant aller du simple au quadruple entre zones rurales et Luxembourg-Ville Centre) ; la surface habitable et le nombre de chambres ; l'état général et la qualité des finitions ; la performance énergétique (le CPE classe A à I a un impact croissant sur le prix, estimé entre 3 et 8 % par classe selon les études du LISER) ; la présence d'extérieurs (terrasse, jardin, balcon) et de parking. Les normes TEGOVA EVS 2025 (European Valuation Standards) définissent les bases de valeur reconnues : valeur de marché (Market Value), valeur d'investissement, juste valeur (Fair Value) conformément à IFRS 13. Tout rapport d'évaluation professionnel doit préciser la base de valeur retenue, la ou les méthodes appliquées, les hypothèses clés et les conditions particulières. Au Luxembourg, les experts certifiés TEGOVA REV (Recognised European Valuer) garantissent le respect de ces standards.",
      en: "The factors most influencing property value in Luxembourg are: location (municipality, neighbourhood, street — with price differences up to fourfold between rural areas and Luxembourg City Centre); living area and number of bedrooms; general condition and finish quality; energy performance (EPC class A to I has a growing price impact, estimated at 3 to 8% per class according to LISER studies); outdoor spaces (terrace, garden, balcony) and parking. The TEGOVA EVS 2025 standards (European Valuation Standards) define recognised bases of value: Market Value, Investment Value, Fair Value in accordance with IFRS 13. Any professional valuation report must specify the basis of value adopted, the method(s) applied, key assumptions and special conditions. In Luxembourg, TEGOVA REV (Recognised European Valuer) certified experts guarantee compliance with these standards.",
      de: "Die Faktoren, die den Immobilienwert in Luxemburg am stärksten beeinflussen, sind: Lage (Gemeinde, Viertel, Straße — mit Preisunterschieden bis zum Vierfachen zwischen ländlichen Gebieten und Luxemburg-Stadt Zentrum); Wohnfläche und Zimmerzahl; allgemeiner Zustand und Qualität der Ausstattung; Energieeffizienz (EPB-Klasse A bis I hat einen wachsenden Einfluss auf den Preis, geschätzt auf 3 bis 8 % pro Klasse laut LISER-Studien); Außenbereiche (Terrasse, Garten, Balkon) und Stellplatz. Die TEGOVA EVS 2025 Standards (European Valuation Standards) definieren anerkannte Wertgrundlagen: Marktwert, Investitionswert, Fair Value gemäß IFRS 13. Jedes professionelle Bewertungsgutachten muss die gewählte Wertgrundlage, die angewandte(n) Methode(n), Schlüsselannahmen und besondere Bedingungen angeben. In Luxemburg garantieren TEGOVA REV (Recognised European Valuer) zertifizierte Experten die Einhaltung dieser Standards.",
      lb: "D'Faktoren, déi de Wäert vun enger Immobilie zu Lëtzebuerg am stäerksten beaflossen, sinn: d'Lag (Gemeng, Quartier, Strooss — mat Präisënnerscheeder bis zum Véierfachen tëschent ländlechen Zonen a Lëtzebuerg-Stad Zentrum); d'Wunnfläch an d'Zuel vu Schlofkummeren; den allgemenge Zoustand an d'Qualitéit vun der Ausstattung; d'Energieeffizienz (CPE-Klass A bis I huet en ëmmer méi groussen Afloss op de Präis, geschat op 3 bis 8 % pro Klass laut LISER-Etüden); Bausseberäicher (Terrasse, Gaart, Balcon) a Parking. D'TEGOVA EVS 2025 Standarden (European Valuation Standards) definéieren unerkannt Wäertgrondlagen: Marchéwäert, Investitiounswäert, Fair Value geméiss IFRS 13. All professionelle Bewäertungsbericht muss d'gewielt Wäertgrondlag, déi applizéiert Method(en), Schlësselunahmen a besonnesch Bedingungen uginn. Zu Lëtzebuerg garantéieren TEGOVA REV (Recognised European Valuer) zertifizéiert Experten d'Anhale vun dësen Standarden.",
      pt: "Os fatores que mais influenciam o valor de um imóvel no Luxemburgo são: a localização (município, bairro, rua — com diferenças de preço que podem ir do simples ao quádruplo entre zonas rurais e Luxemburgo-Cidade Centro); a superfície habitável e o número de quartos; o estado geral e a qualidade dos acabamentos; o desempenho energético (o CPE classe A a I tem um impacto crescente no preço, estimado entre 3 e 8% por classe segundo estudos do LISER); a presença de espaços exteriores (terraço, jardim, varanda) e estacionamento. As normas TEGOVA EVS 2025 (European Valuation Standards) definem as bases de valor reconhecidas: valor de mercado (Market Value), valor de investimento, justo valor (Fair Value) conforme IFRS 13. Todo relatório de avaliação profissional deve especificar a base de valor adotada, o(s) método(s) aplicado(s), as hipóteses-chave e as condições particulares. No Luxemburgo, os peritos certificados TEGOVA REV (Recognised European Valuer) garantem o respeito destas normas.",
    },
    relatedToolLabel: {
      fr: "Estimer votre bien immobilier",
      en: "Estimate your property value",
      de: "Schätzen Sie Ihre Immobilie",
      lb: "Schätzt Är Immobilie",
      pt: "Estime o valor do seu imóvel",
    },
    relatedToolLink: {
      fr: "/estimation",
      en: "/estimation",
      de: "/estimation",
      lb: "/estimation",
      pt: "/estimation",
    },
    faq1Q: {
      fr: "Quelle est la méthode la plus fiable pour estimer un bien au Luxembourg ?",
      en: "What is the most reliable method for valuing a property in Luxembourg?",
      de: "Welches ist die zuverlässigste Methode zur Immobilienbewertung in Luxemburg?",
      lb: "Wéi eng ass déi zouverlässegst Method fir eng Immobiliebewäertung zu Lëtzebuerg?",
      pt: "Qual é o método mais fiável para avaliar um imóvel no Luxemburgo?",
    },
    faq1A: {
      fr: "Pour les biens résidentiels, l'approche par comparaison directe est la plus fiable lorsque des données de marché suffisantes existent. Pour les biens locatifs, la capitalisation des revenus est recommandée. Les normes TEGOVA EVS 2025 préconisent d'utiliser au moins deux méthodes et de recouper les résultats pour renforcer la fiabilité de l'estimation.",
      en: "For residential properties, the direct comparison approach is most reliable when sufficient market data exists. For rental properties, income capitalisation is recommended. TEGOVA EVS 2025 standards recommend using at least two methods and cross-checking results to strengthen estimation reliability.",
      de: "Für Wohnimmobilien ist der direkte Vergleichsansatz am zuverlässigsten, wenn ausreichend Marktdaten vorliegen. Für Mietobjekte wird die Ertragswertkapitalisierung empfohlen. Die TEGOVA EVS 2025 Standards empfehlen mindestens zwei Methoden anzuwenden und die Ergebnisse abzugleichen, um die Zuverlässigkeit der Bewertung zu stärken.",
      lb: "Fir Wunnimmobilie ass den direkten Vergläichsansaz am zouverlässegsten, wann genuch Marktdonnéeën virleien. Fir Mietobjeten gëtt d'Ertragswäertkapitaliséierung recommandéiert. D'TEGOVA EVS 2025 Standarden empfeelen mindestens zwou Methoden unzewenden an d'Resultater ofzegläichen, fir d'Zouverlässegkeet vun der Bewäertung ze stäerken.",
      pt: "Para imóveis residenciais, a abordagem por comparação direta é a mais fiável quando existem dados de mercado suficientes. Para imóveis de arrendamento, recomenda-se a capitalização de rendimentos. As normas TEGOVA EVS 2025 preconizam utilizar pelo menos dois métodos e cruzar os resultados para reforçar a fiabilidade da estimativa.",
    },
    faq2Q: {
      fr: "Le CPE influence-t-il le prix d'un bien immobilier au Luxembourg ?",
      en: "Does the EPC affect property prices in Luxembourg?",
      de: "Beeinflusst der Energieausweis den Immobilienpreis in Luxemburg?",
      lb: "Beaflosst den Energieausweis den Immobiliepräis zu Lëtzebuerg?",
      pt: "O CPE influencia o preço de um imóvel no Luxemburgo?",
    },
    faq2A: {
      fr: "Oui, de manière croissante. Les études du LISER montrent qu'une amélioration d'une classe CPE (ex. D vers C) peut augmenter la valeur du bien de 3 à 8 %. Un logement en classe A ou B se vend nettement mieux qu'un bien en classe F ou G, l'acheteur anticipant les coûts énergétiques réduits et l'absence de travaux de rénovation à prévoir.",
      en: "Yes, increasingly so. LISER studies show that improving by one EPC class (e.g. D to C) can increase property value by 3 to 8%. A dwelling in class A or B sells significantly better than one in class F or G, as buyers anticipate reduced energy costs and no upcoming renovation works.",
      de: "Ja, zunehmend. LISER-Studien zeigen, dass eine Verbesserung um eine EPB-Klasse (z.B. D auf C) den Immobilienwert um 3 bis 8 % steigern kann. Eine Wohnung der Klasse A oder B verkauft sich deutlich besser als eine der Klasse F oder G, da Käufer geringere Energiekosten und keine anstehenden Renovierungsarbeiten erwarten.",
      lb: "Jo, ëmmer méi. LISER-Etüde weisen, dass eng Verbesserung vun enger CPE-Klass (z.B. D op C) den Immobilienwäert ëm 3 bis 8 % steigere kann. Eng Wunneng vun der Klass A oder B verkeeft sech däitlech besser wéi eng vun der Klass F oder G, well Keefer manner Energiekäschten an keng ugesoten Renovatiounsaarbechten erwaarden.",
      pt: "Sim, cada vez mais. Estudos do LISER mostram que uma melhoria de uma classe CPE (ex. D para C) pode aumentar o valor do imóvel em 3 a 8%. Uma habitação de classe A ou B vende-se significativamente melhor do que uma de classe F ou G, antecipando o comprador custos energéticos reduzidos e ausência de obras de renovação a prever.",
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
  console.log(`OK ${lang}.json updated`);
}

console.log("Done — guide batch 2 i18n keys injected.");
