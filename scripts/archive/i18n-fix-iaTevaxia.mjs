#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MSG_DIR = path.resolve('src/messages');

const translations = {
  de: {
    title: "So nutzen Sie die KI auf tevaxia.lu",
    metaDescription: "KI-Assistent tevaxia.lu: Ergebnisanalyse, EVS-Berichtserstellung, PDF-Extraktion, Luxemburger Immobilien-Chat. Kostenlos 5/Tag, unbegrenzt mit eigenem Schlüssel (BYOK).",
    intro: "tevaxia.lu integriert eine auf Luxemburger Immobilien spezialisierte KI-Engine: LIR-Steuerrecht, TEGOVA EVS 2025, VEFA, Miteigentum, USALI-Hotellerie, AML/KYC. Jeder angemeldete Nutzer erhält täglich 5 kostenlose Analysen über Cerebras (Llama 3.1 8B). Für unbegrenzte Nutzung oder Zugriff auf GPT-4o / Claude können Sie Ihren eigenen API-Schlüssel (BYOK) im Profil hinterlegen. So nutzen Sie jede Funktion optimal.",
    section1Title: "Automatische Ergebnisanalyse",
    section1Content: "Rund zehn Tools (Schätzung, EVS-Bewertung, Projektentwickler-P&L, Multi-Lease-DCF, USALI-Hotel, E-2-Visa-Score, VEFA, Wertzuwachs, Vergleich, Kauf-vs-Miete) zeigen nach jeder Berechnung eine Schaltfläche „Mit KI analysieren“. Die KI erhält den vollständigen Kontext (Inputs und Ergebnisse) und verfasst einen professionellen Kommentar: Preisdiagnose, Risikoerkennung, Kennzahlenkonsistenz gegenüber den Luxemburger Marktstandards, Arbitrage-Empfehlungen. Die Prompts sind fachspezifisch: eine Bilanzanalyse nennt typische Baulandkosten-Quoten (10 bis 20 % des Umsatzes), eine USALI-P&L-Analyse vergleicht die GOP-Marge mit dem erwarteten Wert je Kategorie.",
    section2Title: "Erstellung des EVS-2025-Berichts",
    section2Content: "Der Modus EVS-Bericht auf der Seite /valorisation bietet 8 Schaltflächen „Mit KI formulieren“ neben den narrativen Feldern (Lage, Umfeld, Anbindung, Methodenbegründung, Steuerregime, ESG-Wirkung, Vorbehalte, Unsicherheit). Jede Schaltfläche erzeugt einen formalen Absatz, der direkt in das Feld eingefügt wird, konform mit den TEGOVA-Normen und der Charta 5. Auflage, mit Rechtsverweisen (Art. 102bis LIR, IVS 103, CRREM-Pfad). Der Modus EVS-Challenger auf der Registerkarte Abstimmung fungiert als kritischer Auditor: er kennzeichnet fehlende Daten, Inkonsistenzen, auffällige Kennzahlen und Compliance-Risiken vor der Unterzeichnung, jeweils mit dem Präfix [BLOCKIEREND], [GRAVIEREND] oder [GERING].",
    section3Title: "PDF-Extraktion (BYOK erforderlich)",
    section3Content: "Um ein Formular aus einem bestehenden Dokument vorzubefüllen (Projektentwickler-Budget, notarielle Veräußerungsurkunde, CPE-Zertifikat), startet die Schaltfläche „Aus PDF vorbefüllen“ eine Vision-Extraktion über Ihren BYOK-Schlüssel: Anthropic (für PDFs) oder OpenAI (für Bilder). Das Modell gibt strukturiertes JSON zurück, das die Felder direkt befüllt. Diese Funktion benötigt einen BYOK-API-Schlüssel, da die kostenlosen Cerebras/Groq-Modelle keine Vision-Verarbeitung bieten. Dateigröße: maximal 8 MB. Derzeit verfügbar auf /bilan-promoteur und /plus-values; weitere Schemata (CPE) werden über die API unterstützt.",
    section4Title: "Konversationsassistent und öffentliche API",
    section4Content: "Ein schwebendes Chat-Widget unten rechts öffnet eine freie Unterhaltung mit dem Luxemburger Immobilienassistenten. Sie können übergreifende Fragen stellen, die in kein spezifisches Tool passen: „Welche MwSt. gilt für die Sanierung eines Mischnutzungsgebäudes?“, „Welche Mehrheit ist für den Beschluss einer Dachsanierung im Miteigentum erforderlich?“, „Wie wird der Bëllegen Akt für ein nicht ansässiges Paar berechnet?“. Der Assistent behält den Kontext über mehrere Runden. Für B2B-Integratoren sind die 3 Endpunkte (`/api/v1/ai/analyze`, `/api/v1/ai/chat`, `/api/v1/ai/extract`) mit einem tevaxia-API-Schlüssel (Header X-API-Key) im Standard-Rate-Limit-Tarif zugänglich. Vollständige Dokumentation auf /api-docs.",
    relatedToolLabel: "Ihren KI-Schlüssel konfigurieren (BYOK)",
    faq1Q: "Ist die KI wirklich kostenlos?",
    faq1A: "Ja, 5 Analysen pro Tag und angemeldetem Nutzer, kostenfrei. Darüber hinaus können Sie Ihren eigenen Cerebras-, Groq-, OpenAI- oder Anthropic-Schlüssel im Profil für eine unbegrenzte Nutzung hinterlegen. Der tevaxia-Server nutzt Cerebras (Llama 3.1 8B) für den kostenlosen Tarif, mit automatischem Fallback auf Groq, sofern konfiguriert.",
    faq2Q: "Werden meine Daten an Dritte weitergegeben?",
    faq2A: "Ja, die Anfragen laufen über den konfigurierten KI-Anbieter (standardmäßig Cerebras oder Ihren BYOK-Schlüssel). Der übermittelte Kontext enthält ausschließlich die Inputs und Ergebnisse der aktuellen Berechnung, niemals personenbezogene Daten darüber hinaus. Cerebras und Groq speichern keine Prompts für das Training. Wenn Sie vertraulichkeitspflichtig sind (z. B. bei sensiblem AML/KYC), bevorzugen Sie einen Anthropic- oder OpenAI-Schlüssel mit den Unternehmensbedingungen Ihrer Wahl.",
    faq3Q: "Ersetzt die KI einen zertifizierten Sachverständigen?",
    faq3A: "Nein. Die KI unterstützt bei der Formulierung und Analyse, liefert aber kein bindendes Sachverständigengutachten. Für einen EVS-Bericht zuhanden einer Bank oder eines Gerichts bleibt der TEGOVA-zertifizierte Sachverständige für den angesetzten Wert verantwortlich und muss den Bericht prüfen, korrigieren und unterzeichnen. Die KI beschleunigt die Erstellung (Narrative-Entwurf, Inkonsistenzerkennung), ersetzt aber weder die menschliche Expertise noch die Ortsbesichtigung.",
  },
  pt: {
    title: "Como usar a IA em tevaxia.lu",
    metaDescription: "Assistente IA tevaxia.lu: análise de resultados, redação EVS, extração de PDF, chat imobiliário luxemburguês. Gratuito 5/dia, ilimitado com a sua chave (BYOK).",
    intro: "A tevaxia.lu integra um motor de IA especializado em imobiliário luxemburguês: fiscalidade LIR, normas TEGOVA EVS 2025, VEFA, copropriedade, hotelaria USALI, AML/KYC. Cada utilizador autenticado beneficia de 5 análises gratuitas por dia através da Cerebras (Llama 3.1 8B). Para uma utilização ilimitada ou acesso a GPT-4o / Claude, pode adicionar a sua própria chave API (BYOK) no seu perfil. Veja como tirar partido de cada funcionalidade.",
    section1Title: "Análise automática dos resultados",
    section1Content: "Em cerca de dez ferramentas (estimativa, valorização EVS, balanço do promotor, DCF multi-arrendamento, hotel USALI, score visto E-2, VEFA, mais-valias, comparação de imóveis, comprar vs. arrendar), aparece um botão «Analisar com a IA» após cada cálculo. A IA recebe o contexto completo (entradas e resultados) e redige um comentário profissional: diagnóstico do nível de preço, identificação de riscos, coerência dos rácios face aos padrões do mercado luxemburguês, recomendações de arbitragem. Os prompts são especializados por domínio: a análise de um balanço de promotor cita os rácios típicos de custo fundiário (10 a 20 % do volume de negócios), a de um P&L USALI compara com a margem GOP esperada por categoria.",
    section2Title: "Redação do relatório EVS 2025",
    section2Content: "O modo Relatório EVS da página /valorisation integra 8 botões «Redigir com a IA» colocados junto aos campos narrativos (localização, envolvente, acessibilidade, justificação dos métodos, regime fiscal, impacto ESG, reservas, incerteza). Cada botão gera um parágrafo formal injetado diretamente no campo, conforme às normas TEGOVA e à Carta 5.ª edição, com referências legais (art. 102bis LIR, IVS 103, pathway CRREM). O modo Challenger EVS, no separador Reconciliação, atua como auditor crítico: assinala os dados em falta, as incoerências, os rácios anormais e os riscos de não conformidade antes da assinatura, com os prefixos [BLOQUEANTE], [GRAVE] ou [MENOR].",
    section3Title: "Extração a partir de PDF (BYOK obrigatório)",
    section3Content: "Para pré-preencher um formulário a partir de um documento existente (balanço previsional de promotor, escritura notarial de mais-valia, certificado CPE), um botão «Pré-preencher a partir de PDF» lança uma extração por visão através da sua chave BYOK Anthropic (para PDF) ou OpenAI (para imagens). O modelo devolve um JSON estruturado que alimenta diretamente os campos. Esta funcionalidade exige uma chave API BYOK, pois os modelos gratuitos Cerebras e Groq não tratam visão. Limite de 8 MB por ficheiro. Disponível atualmente em /bilan-promoteur e /plus-values; os outros esquemas (CPE) estão suportados pela API.",
    section4Title: "Assistente conversacional e API pública",
    section4Content: "Um widget de chat flutuante no canto inferior direito abre uma conversa livre com o assistente imobiliário luxemburguês. Pode colocar-lhe questões transversais que não cabem numa ferramenta específica: «que IVA aplicar à renovação de um imóvel misto?», «que maioria é necessária para votar a reparação do telhado em copropriedade?», «como se calcula o Bëllegen Akt para um casal não residente?». O assistente mantém o contexto ao longo de várias interações. Para integradores B2B, os 3 endpoints (`/api/v1/ai/analyze`, `/api/v1/ai/chat`, `/api/v1/ai/extract`) estão acessíveis com uma chave API tevaxia (cabeçalho X-API-Key) no tier rate-limit padrão. Documentação completa em /api-docs.",
    relatedToolLabel: "Configurar a sua chave de IA (BYOK)",
    faq1Q: "A IA é mesmo gratuita?",
    faq1A: "Sim, 5 análises por dia por utilizador autenticado, sem custos. Para além disso, pode adicionar a sua própria chave Cerebras, Groq, OpenAI ou Anthropic no seu perfil para uma utilização ilimitada. O servidor tevaxia utiliza a Cerebras (Llama 3.1 8B) para o tier gratuito, com fallback automático para a Groq se estiver configurada.",
    faq2Q: "Os meus dados são enviados a terceiros?",
    faq2A: "Sim, os pedidos passam pelo fornecedor de IA configurado (Cerebras por omissão, ou a sua chave BYOK). Os contextos enviados contêm apenas as entradas e resultados do cálculo em curso, nunca dados pessoais fora desse cálculo. Os fornecedores Cerebras e Groq não armazenam os prompts para treino. Se está sujeito a confidencialidade (por exemplo AML/KYC sensível), prefira uma chave Anthropic ou OpenAI com as condições empresariais da sua escolha.",
    faq3Q: "A IA substitui um perito certificado?",
    faq3A: "Não. A IA fornece apoio à redação e à análise, não um parecer pericial vinculativo. Para um relatório EVS destinado a um banco ou a um tribunal, o perito certificado TEGOVA mantém-se responsável pelo valor retido e deve reler, corrigir e assinar o relatório. A IA acelera a produção (rascunho narrativo, deteção de incoerências), mas não substitui nem a perícia humana nem a visita ao imóvel.",
  },
  lb: {
    title: "Wéi d'KI op tevaxia.lu notzen",
    metaDescription: "KI-Assistent tevaxia.lu: Resultat-Analys, EVS-Redaktioun, PDF-Extraktioun, Lëtzebuerger Immobilien-Chat. Gratis 5/Dag, onlimitéiert mat Ärem Schlëssel (BYOK).",
    intro: "tevaxia.lu integréiert eng KI-Engine spezialiséiert op Lëtzebuerger Immobilien: LIR-Steierrecht, TEGOVA-EVS-Normen 2025, VEFA, Kopropriétéit, Hotellerie USALI, AML/KYC. All ageloggten Notzer kritt 5 gratis Analysen pro Dag iwwer Cerebras (Llama 3.1 8B). Fir eng onlimitéiert Notzung oder Zougang zu GPT-4o / Claude kënnt Dir Ären eegenen API-Schlëssel (BYOK) an Ärem Profil hannerleeën. Esou notze Dir all Funktioun optimal.",
    section1Title: "Automatesch Analys vun de Resultater",
    section1Content: "Op ongeféier zéng Tools (Schätzung, EVS-Valorisatioun, Promoter-Bilan, DCF multi-Baux, USALI-Hotel, E-2-Visa-Score, VEFA, Plus-value, Bien-Verglach, Kafen-géint-Lounen) erschéngt no all Berechnung e Knäppchen „Mat der KI analyséieren“. D'KI kritt de komplette Kontext (Inputs an Resultater) a schreift e professionelle Kommentar: Präis-Diagnos, Risiko-Erkennung, Kohärenz vun de Ratioen géintiwwer de Lëtzebuerger Maartstandarden, Arbitrage-Empfehlungen. D'Prompts si spezialiséiert pro Beruff: d'Analys vun engem Promoter-Bilan zitéiert déi typesch Baulandkäschten-Quoten (10 bis 20 % vum Ëmsaz), déi vun engem P&L USALI vergläicht mat der erwaarter GOP-Marge pro Kategorie.",
    section2Title: "Redaktioun vum EVS-2025-Bericht",
    section2Content: "De Modus EVS-Bericht op der Säit /valorisation integréiert 8 Knäppercher „Mat der KI schreiwen“ nieft den narrative Felder (Lag, Ëmfeld, Ubannung, Justifikatioun vun de Methoden, Steierregime, ESG-Impakt, Reserven, Onsécherheet). All Knäppche generéiert e formellen Abschnitt, deen direkt an d'Feld geschriwwe gëtt, konform mat den TEGOVA-Normen an der Chart 5. Editioun, mat legalen Referenzen (Art. 102bis LIR, IVS 103, CRREM-Pfad). De Modus EVS-Challenger, op der Ongletbar Reconciliatioun, handelt als kritesche Verifizéierer: hie markéiert déi feelend Donnéeën, d'Inkohärenzen, déi anormal Ratioen an d'Risike vu Net-Konformitéit virun der Ënnerschrëft, mam Präfix [BLOCKÉIEREND], [GROUSS] oder [KLENG].",
    section3Title: "PDF-Extraktioun (BYOK gefrot)",
    section3Content: "Fir e Formulaire virauszefëllen op Basis vun engem existéierenden Dokument (Promoter-Budget, notariellen Akt fir Plus-value, CPE-Zertifikat) lancéiert e Knäppchen „Virfëllen aus PDF“ eng Visiouns-Extraktioun iwwer Äre BYOK-Schlëssel Anthropic (fir PDF) oder OpenAI (fir Biller). De Modell gëtt e strukturéierte JSON zréck, deen d'Felder direkt fëllt. Dës Funktioun brauch e BYOK-API-Schlëssel, well déi gratis Modeller Cerebras a Groq keng Visioun traitéieren. Limit vun 8 MB pro Datei. Aktuell verfügbar op /bilan-promoteur an /plus-values; déi aner Schemaen (CPE) gi vun der API ënnerstëtzt.",
    section4Title: "Gespréichs-Assistent an ëffentlech API",
    section4Content: "E schwiewende Chat-Widget ënnen riets opent e fräie Gespréich mam Lëtzebuerger Immobilien-Assistent. Dir kënnt him transversal Froe stellen déi net an ee spezifescht Tool passen: „wéi eng TVA op d'Renovatioun vun engem gemëschte Gebai uwenden?“, „wéi eng Majoritéit ass néideg fir d'Dachreparatur an der Kopropriétéit ze stëmmen?“, „wéi gëtt de Bëllegen Akt fir e net-residentent Koppel berechent?“. Den Assistent behält de Kontext iwwer méi Ronnen. Fir B2B-Integrateuren sinn déi 3 Endpoints (`/api/v1/ai/analyze`, `/api/v1/ai/chat`, `/api/v1/ai/extract`) zougänglech mat engem tevaxia-API-Schlëssel (Header X-API-Key) am Standard-Rate-Limit. Komplett Dokumentatioun op /api-docs.",
    relatedToolLabel: "Ären KI-Schlëssel konfiguréieren (BYOK)",
    faq1Q: "Ass d'KI wierklech gratis?",
    faq1A: "Jo, 5 Analysen pro Dag pro ageloggte Notzer, ouni Käschten. Doriwwer eraus kënnt Dir Ären eegene Cerebras-, Groq-, OpenAI- oder Anthropic-Schlëssel an Ärem Profil hannerleeën fir eng onlimitéiert Notzung. De Server tevaxia notzt Cerebras (Llama 3.1 8B) fir de gratis Tier, mat engem automatesche Fallback op Groq wann e konfiguréiert ass.",
    faq2Q: "Ginn meng Donnéeën un Drëtter geschéckt?",
    faq2A: "Jo, d'Ufroe ginn iwwer de konfiguréierte KI-Fournisseur (Cerebras par défaut, oder Äre BYOK-Schlëssel). Déi geschéckte Kontexter enthalen nëmmen d'Inputs an d'Resultater vum aktuelle Kalkul, ni perséinlech Donnéeën dobausse dovun. D'Fournisseure Cerebras a Groq späicheren d'Prompts net fir d'Training. Wann Dir vertraulech gebonne sidd (z. B. sensibel AML/KYC), notzt léiwer en Anthropic- oder OpenAI-Schlëssel mat den Entreprisebedéngungen Ärer Wiel.",
    faq3Q: "Ersetzt d'KI en zertifizéierten Expert?",
    faq3A: "Nee. D'KI gëtt Hëllef bei der Redaktioun an der Analys, kee verbindlecht Expertegutachten. Fir en EVS-Bericht fir eng Bank oder e Geriicht bleift den TEGOVA-zertifizéierten Expert responsabel fir de gehalene Wäert a muss de Bericht nokontrolléieren, korrigéieren an ënnerschreiwen. D'KI beschleunegt d'Produktioun (Narrativ-Entworf, Erkennung vun Inkohärenzen), ersetzt awer weder déi mënschlech Expertise nach de Besuch um Terrain.",
  },
};

for (const [lang, values] of Object.entries(translations)) {
  const file = path.join(MSG_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.guide?.iaTevaxia) {
    console.error(`No guide.iaTevaxia in ${lang}`);
    process.exit(1);
  }
  for (const [key, value] of Object.entries(values)) {
    if (!(key in data.guide.iaTevaxia)) {
      console.error(`Missing key ${key} in ${lang}`);
      process.exit(1);
    }
    data.guide.iaTevaxia[key] = value;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${lang}: ${Object.keys(values).length} keys`);
}
