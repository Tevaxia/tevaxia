#!/usr/bin/env node
/**
 * Traduções PT próprias para as 8 personas + hub.
 * Substitui o fallback EN em src/messages/pt.json.
 * Terminologia de negócio em português europeu (Portugal/comunidade LU),
 * termos LU preservados (Bëllegen Akt, Klimabonus, lei de 16 de maio de 1975, etc.).
 */
import fs from "node:fs";

const SOLUTIONS = {
  syndic: {
    meta: {
      title: "Software de administração de condomínios Luxemburgo, conforme lei 16.05.1975",
      description: "Administre os seus condomínios sem fins de semana no Excel: assembleias gerais em linha, chamadas de fundos Factur-X, contabilidade LU, reconciliação bancária PSD2. Teste gratuito.",
    },
    hero: {
      badge: "Concebido para condomínios luxemburgueses",
      title: "A sua administração de condomínios, sem",
      titleAccent: "fins de semana no Excel",
      subtitle: "Assembleias gerais em linha com voto ponderado por permilagens, chamadas de fundos em conformidade Factur-X, contabilidade de condomínio luxemburguesa e reconciliação bancária automática. Concebido para administradores de condomínio profissionais cansados de gerir quatro ferramentas em paralelo.",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver como funciona",
      kpis: [
        { value: "15 h", label: "poupadas por AG" },
        { value: "100 %", label: "conforme lei 16.05.1975" },
        { value: "<24 h", label: "tempo de resposta do suporte" },
      ],
    },
    problem: {
      title: "Administrar um condomínio no Luxemburgo em 2026 não devia continuar a ter este aspeto",
      intro: "Entre a lei de 16 de maio de 1975, as chamadas de fundos trimestrais, as cobranças, a preparação das AG e a contabilidade, a semana de um administrador enche-se sozinha. A menos que as ferramentas certas aliviem a carga.",
      items: [
        { title: "Preparação de AG em 3 dias", desc: "Convocatórias com 15 dias, ordem do dia a redigir, procurações a recolher, ata a escrever mais tarde. O trabalho administrativo absorve o tempo que devia ser dedicado aos temas de fundo.", stat: "~15 horas por AG" },
        { title: "Cobranças feitas à mão", desc: "Seguir quem deve o quê, controlar prazos, calcular juros legais, preparar cartas registadas. Sem ferramenta dedicada, algo escapa sempre, e a tesouraria sofre.", stat: "3-7 % cronicamente por cobrar" },
        { title: "Excel, banco e contabilidade em paralelo", desc: "Reconciliar recebimentos com as chamadas de fundos, lançar em contabilidade, montar os anexos da AG a partir de três origens. Cada etapa é uma oportunidade de erro.", stat: "4 ferramentas em média" },
      ],
    },
    howItWorks: {
      title: "Uma plataforma, três passos",
      intro: "Sem migração complexa, sem formação de dois dias. Importa os seus condomínios, configura uma vez as chaves de repartição, e a ferramenta assume o resto.",
      steps: [
        { number: "1", title: "Os seus condomínios importados", desc: "Importação Excel, introdução manual ou API. Lotes, permilagens, condóminos, contratos, histórico contabilístico. Funciona com qualquer administrador já estruturado." },
        { number: "2", title: "AG e chamadas de fundos funcionam sozinhas", desc: "Convocatórias PDF por lote, voto eletrónico ponderado por permilagens, ata gerada automaticamente. Chamadas de fundos Factur-X conformes EN 16931 enviadas aos condóminos com referência SEPA." },
        { number: "3", title: "Contabilidade que se escreve sozinha", desc: "Cada chamada de fundos, cada recebimento, cada despesa lançada flui para o diário contabilístico. Os 5 anexos da AG são gerados em PDF com um clique." },
      ],
    },
    features: {
      title: "Tudo o que um administrador de condomínios luxemburguês precisa mesmo",
      intro: "Funcionalidades concebidas para o enquadramento legal do Grão-Ducado: lei de 16 de maio de 1975, regras de maioria em AG, isenção de IVA art. 44 §1 f, arquivo de 10 anos.",
      items: [
        { title: "AG em linha com voto ponderado", desc: "Voto eletrónico ponderado por permilagens, maiorias simples / absoluta / dupla / unanimidade tratadas automaticamente." },
        { title: "Convocatórias + ata em PDF", desc: "Convocatória por lote com ordem do dia legal, ata gerada automaticamente após a AG com os resultados dos votos." },
        { title: "Chamadas de fundos Factur-X", desc: "PDF/A-3 + XML CII D22B conforme EN 16931, referência de mandato SEPA, isenção art. 261 D CGI aplicada." },
        { title: "Cobranças em 3 níveis", desc: "Lembrete amigável, carta registada, intimação de pagamento. Juros legais luxemburgueses calculados automaticamente." },
        { title: "5 anexos contabilísticos da AG", desc: "Balanço, diário, orçamento, repartição de despesas, estado de dívidas. PDFs prontos a distribuir." },
        { title: "Reconciliação bancária PSD2", desc: "Ligação à BCEE, BIL, Banque Raiffeisen, Post Finance via Enable Banking. Reconciliação automática." },
        { title: "Chaves de repartição configuráveis", desc: "Permilagens gerais, permilagens de exploração, despesas especiais por escada/edifício, quotas individualizadas." },
        { title: "Portal do condómino", desc: "Cada condómino tem a sua área: voto, extrato de conta, convocatórias, atas, pagamento em linha." },
        { title: "10 modelos de cartas editáveis", desc: "Cobranças, convocatórias, notificações formais, procurações. Totalmente personalizáveis, exportação DOCX / PDF / Google Drive." },
        { title: "OCR de faturas gratuito", desc: "Carrega as faturas de fornecedores, extração automática via PDF.js + Tesseract.js. Zero introdução manual." },
        { title: "Transferências SEPA em lote", desc: "Geração de XML pain.001 para pagamentos agrupados a fornecedores, compatível com todos os bancos luxemburgueses." },
        { title: "Benchmark de despesas", desc: "Comparação das suas despesas por m² com a média luxemburguesa por tipo de fração e ano de construção." },
      ],
    },
  },
  agence: {
    meta: {
      title: "CRM imobiliário Luxemburgo, pipeline de mandatos, matching, OpenImmo",
      description: "Centralize mandatos, contactos e tarefas num CRM concebido para agências LU. Matching automático de compradores, PDFs de imóvel em co-branding, assinatura eIDAS.",
    },
    hero: {
      badge: "CRM imobiliário para agências LU",
      title: "A sua pipeline de mandatos numa",
      titleAccent: "só ferramenta, não em quatro",
      subtitle: "Gestão de mandatos em formato OpenImmo, CRM de contactos com matching automático de compradores, kanban drag and drop, PDFs de imóvel em co-branding e assinatura eletrónica eIDAS. Concebido para agentes imobiliários luxemburgueses cansados de fazer malabarismo com várias ferramentas.",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver como funciona",
      kpis: [
        { value: "/100", label: "pontuação de matching de compradores" },
        { value: "OpenImmo", label: "formato padrão LU/DE" },
        { value: "<24 h", label: "tempo de resposta do suporte" },
      ],
    },
    problem: {
      title: "O seu negócio funciona em várias ferramentas que não comunicam entre si",
      intro: "Mandatos no Excel, contactos no Gmail, tarefas no Notion, visitas no WhatsApp. Cada informação vive num sítio diferente, e nada chega ao decisor.",
      items: [
        { title: "Mandatos espalhados por 3 ferramentas", desc: "Entre o CRM da agência, a difusão nos portais, a folha de acompanhamento e os tópicos de e-mail, é impossível ver o estado de um mandato num só olhar.", stat: "~4 ferramentas em paralelo" },
        { title: "Matching de compradores feito a olho", desc: "Entra um novo mandato, percorre a base de compradores à mão. Raio, orçamento, tipo, data do projeto: tudo disperso, pelo que se esquecem candidatos.", stat: "30-40 % de matches falhados" },
        { title: "Difusão manual nos portais", desc: "Imóvel introduzido em athome, immotop, wort; reintroduzido à primeira alteração de preço. As incoerências entre portais prejudicam a imagem da marca.", stat: "~45 min por difusão" },
      ],
    },
    howItWorks: {
      title: "Um CRM, três passos",
      intro: "Sem formação de dois dias, sem migração arriscada. Importa os contactos, cria o primeiro mandato, o matching é lançado automaticamente.",
      steps: [
        { number: "1", title: "Contactos importados via CSV", desc: "Importação da sua base de compradores existente. Mapeamento de colunas automático. Até 10.000 contactos em 2 minutos." },
        { number: "2", title: "Mandatos em pipeline kanban", desc: "Cria um mandato em formato OpenImmo. Kanban drag and drop por estado. Difusão com um clique para athome / immotop / wort." },
        { number: "3", title: "Matching automático /100", desc: "Assim que entra um mandato ou um comprador na base, o algoritmo calcula os matches. Recebe uma lista ordenada por pontuação, pronta a contactar." },
      ],
    },
    features: {
      title: "As funcionalidades que poupam mesmo tempo",
      intro: "Concebidas para equipas de 1 a 20 agentes, com fluxos extraídos do mercado imobiliário luxemburguês.",
      items: [
        { title: "Pipeline de mandatos kanban", desc: "Drag and drop entre estados, vista por agente, cidade ou preço. Filtros guardados." },
        { title: "Formato OpenImmo nativo", desc: "Exportação XML padrão OpenImmo 1.2.8, compatível com athome.lu, immotop.lu, wort.lu, immoscout24.de." },
        { title: "Matching de compradores /100", desc: "Pontuação baseada em orçamento, raio, tipo, área, classe energética, data do projeto. Ordenável e exportável." },
        { title: "CRM de contactos completo", desc: "Importação CSV, etiquetas, interações, tarefas, histórico. Sincronização Gmail bidirecional." },
        { title: "PDFs de imóvel em co-branding", desc: "Logótipo, identidade gráfica, menção legal REV. Gerados em 10 segundos." },
        { title: "Guias de visita em PDF", desc: "Com registo cronológico e assinatura eletrónica. Validade jurídica." },
        { title: "Assinatura eIDAS de mandatos", desc: "Assinatura eletrónica avançada (eIDAS), juridicamente vinculativa no Luxemburgo." },
        { title: "Sequências de nurturing", desc: "Campanhas drip para aquecer compradores mornos: 3 a 7 e-mails automáticos." },
        { title: "Modelos de e-mail (10 modelos)", desc: "Proposta, apresentação, seguimento, confirmação de visita, rescisão de mandato, etc." },
        { title: "Comissões dos agentes", desc: "Cálculo automático trimestral das comissões por agente. Exportação contabilística." },
        { title: "Desempenho dos agentes", desc: "Classificação: mandatos assinados, vendas, volume de negócios, comissões. Benchmark anónimo inter-agências." },
        { title: "Portal do comprador", desc: "Área dedicada para cada comprador: imóveis propostos, documentos, mensagens." },
      ],
    },
  },
  hotel: {
    meta: {
      title: "PMS hoteleiro Luxemburgo, folios USALI, IVA 3 %, forecast, channel manager",
      description: "Property Management System concebido para a hotelaria luxemburguesa: auto-posting USALI 19 categorias, faturação IVA LU 3 %, forecast a 90 dias, iCal OTA.",
    },
    hero: {
      badge: "PMS multi-propriedade para LU",
      title: "O seu PMS hoteleiro alinhado com",
      titleAccent: "o IVA LU a 3 % e o USALI",
      subtitle: "Property Management System completo: quartos, rate plans, reservas, folios com auto-posting USALI 19 categorias, faturação IVA LU 3 %/8 %/17 %, forecast a 90 dias, channel manager iCal. Concebido para hoteleiros luxemburgueses que querem uma ferramenta completa sem a fatura mensal dos PMS tradicionais.",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver como funciona",
      kpis: [
        { value: "19", label: "categorias USALI" },
        { value: "3 / 8 / 17 %", label: "IVA LU tratado" },
        { value: "<24 h", label: "tempo de resposta do suporte" },
      ],
    },
    problem: {
      title: "Gerir um hotel luxemburguês sem ferramenta dedicada é esgotante",
      intro: "Entre vigiar 4+ OTA, escrever folios à mão, atribuir corretamente o IVA a 3 % e compilar os relatórios para os proprietários, o dia passa sem avanço real no essencial.",
      items: [
        { title: "Reservas dispersas por 4+ OTA", desc: "Booking, Airbnb, Expedia, site direto. Cada OTA tem a sua interface, o seu mapeamento, a sua sincronização. As sobre-reservas são inevitáveis sem channel manager.", stat: "1-2 sobre-reservas / mês" },
        { title: "Folios escritos à mão", desc: "Cada consumo (pequeno-almoço, mini-bar, estacionamento) introduzido manualmente numa folha. No check-out, montagem penosa da fatura com o IVA correto por linha.", stat: "~12 min por check-out" },
        { title: "Sem forecast, preços estáticos", desc: "Tarifas alteradas uma vez por época. Sem visibilidade sobre o RevPAR previsto, sem otimização tarifária para os eventos locais (Feira Internacional, Schueberfouer).", stat: "15-25 % de receita não captada" },
      ],
    },
    howItWorks: {
      title: "PMS completo, três passos",
      intro: "Configuração guiada para introduzir quartos e rate plans. Depois da configuração, o sistema assume os folios, a faturação e o reporting.",
      steps: [
        { number: "1", title: "Assistente de configuração guiado", desc: "Cria a propriedade, os quartos por tipo, os rate plans por época, os tarifários de base. 20 minutos em média para um hotel de 15 quartos." },
        { number: "2", title: "Reservas e folios automáticos", desc: "Importação iCal Booking / Airbnb / VRBO, introdução direta de reservas, auto-posting no folio com IVA LU correto." },
        { number: "3", title: "Faturação e reporting", desc: "No check-out: fatura PDF conforme o IVA + Factur-X para clientes empresariais. Relatório USALI mensal com um clique, forecast a 90 dias com intervalos de confiança." },
      ],
    },
    features: {
      title: "Tudo o que um hoteleiro luxemburguês precisa mesmo",
      intro: "Específico para as regras do hospitality LU (IVA 3 %, taxa municipal) e para as normas setoriais (USALI, STR).",
      items: [
        { title: "Assistente de configuração guiado", desc: "Configuração da propriedade em 20 min: quartos, rate plans, épocas, tarifas." },
        { title: "Rate plans multi-época", desc: "Tarifas época baixa/alta, promoções fim de semana, grupos, semana da Feira Internacional." },
        { title: "Calendário + heatmap de ocupação", desc: "Vista anual, ocupação diária por quarto, identificar pontos fracos." },
        { title: "Reservas diretas + OTA", desc: "Introdução direta ou importação iCal Booking / Airbnb / VRBO. Sincronização bidirecional." },
        { title: "Folios USALI 19 categorias", desc: "Auto-posting por consumo: quarto, pequeno-almoço, mini-bar, spa, telefone, lavandaria, etc." },
        { title: "Faturação IVA LU", desc: "Atribuição automática 3 % / 8 % / 17 % por categoria. Fatura PDF + Factur-X." },
        { title: "Relatório USALI mensal", desc: "Formato norma mundial (receita + despesas). Exportável em PDF e CSV." },
        { title: "Forecast Holt-Winters a 90 dias", desc: "Modelo estatístico com sazonalidade semanal, intervalo de confiança 95 %, backtest MAPE." },
        { title: "Relatório de pickup", desc: "Comparação de reservas em janela móvel. Alerta em caso de desvio face ao objetivo." },
        { title: "POS de restaurante/bar", desc: "Registo de consumos F&B, posting automático no folio do hóspede." },
        { title: "Grupos e allotments", desc: "Blocos de quartos para casamentos, seminários, MICE. Tarifas de grupo separadas." },
        { title: "Calendário de eventos LU", desc: "Feira Internacional, Schueberfouer, Maratona ING, MICE. Impacto tarifário." },
      ],
    },
  },
  "expert-evaluateur": {
    meta: {
      title: "Software de avaliador TEGOVA EVS 2025, Luxemburgo",
      description: "Relatório de avaliação conforme EVS 2025 em 20 min: 8 métodos, 9 tipos de ativos, dados pré-preenchidos (98 comunas + 12 séries macro), assinatura SHA-256.",
    },
    hero: {
      badge: "Conforme TEGOVA EVS 2025 + Carta 5.ª ed.",
      title: "Relatório conforme EVS 2025 em",
      titleAccent: "20 minutos em vez de 4 horas",
      subtitle: "Módulo de avaliação com 11 secções + anexos conforme TEGOVA European Valuation Standards 2025 e Carta do perito 5.ª edição. 8 métodos, 9 tipos de ativos, dados de 98 comunas luxemburguesas pré-preenchidos. Concebido para peritos REV, TRV e avaliadores independentes.",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver como funciona",
      kpis: [
        { value: "11", label: "secções + anexos" },
        { value: "8 / 9", label: "métodos / ativos" },
        { value: "98", label: "comunas documentadas" },
      ],
    },
    problem: {
      title: "Redigir um relatório de avaliação é 60 % investigação de dados",
      intro: "Encontrar comparáveis, cruzar fontes macro, verificar textos legais, formatar segundo a Carta. A parte analítica, a que traz o verdadeiro valor acrescentado do perito, representa só uma pequena fração do tempo total.",
      items: [
        { title: "4 horas por relatório em média", desc: "Um relatório EVS 2025 completo demora tipicamente entre 3 e 5 horas, entre recolha de dados e formatação final conforme a Carta.", stat: "~4 h por relatório" },
        { title: "Dados dispersos em 10 fontes", desc: "STATEC para macro, Observatoire de l'Habitat para preços, Geoportail para cadastro, Land Registry para transações, BCE para taxas, INSEE para IRL, LENOZ para energia.", stat: "~10 fontes por relatório" },
        { title: "Risco de não conformidade com a Carta", desc: "As 11 secções obrigatórias, os pressupostos especiais EVS 5, a menção de incerteza material: uma omissão e o relatório torna-se contestável.", stat: "0 % de margem de erro aceitável" },
      ],
    },
    howItWorks: {
      title: "Do mandato ao relatório assinado, três passos",
      intro: "Introduz o endereço e os parâmetros do imóvel. O sistema carrega os dados de contexto, escolhe os métodos, o relatório PDF é gerado.",
      steps: [
        { number: "1", title: "Endereço + parâmetros do imóvel", desc: "Comuna, área, ano de construção, classe energética, tipo de ativo. Dados macro, demográficos e urbanísticos carregam automaticamente." },
        { number: "2", title: "Métodos e comparáveis", desc: "Escolha entre 8 métodos. Comparáveis sugeridos por proximidade." },
        { number: "3", title: "Relatório PDF assinado", desc: "Geração server-side do relatório com 11 secções, assinatura SHA-256, logótipo e qualificações REV." },
      ],
    },
    features: {
      title: "Concebido para avaliadores independentes e gabinetes",
      intro: "Cada funcionalidade responde a uma restrição real da atividade de avaliador no Luxemburgo: conformidade TEGOVA, rastreabilidade, dados públicos, assinatura comprovável.",
      items: [
        { title: "11 secções EVS 2025", desc: "Mandato, localização, jurídico, urbanismo, descrição, arrendamento, mercado, SWOT, avaliação, conclusões, certificação." },
        { title: "8 métodos de avaliação", desc: "Comparação, capitalização direta, DCF, valor de garantia CRR, residual energético, Term and Reversion, IRR, monitorização." },
        { title: "9 tipos de ativos", desc: "Residencial, escritórios, retalho, logística, hotéis, industrial, misto, promoção, terrenos." },
        { title: "98 comunas documentadas", desc: "População, crescimento, densidade, rendimento mediano, desemprego, residentes estrangeiros, área, cantão, preços." },
        { title: "12 séries macro 2015-2026", desc: "OAT 10 anos, taxas hipotecárias, índice de custos de construção STATEC, PIB, inflação, volume de transações, preços m², rendas, taxa de vacância em escritórios, BCE." },
        { title: "Comparáveis automáticos", desc: "Sugestões por comuna, tipo, área, ano de construção. Ajustamentos explicáveis." },
        { title: "Pressupostos especiais EVS 5", desc: "Pressupostos vinculativos e incerteza material conforme EVS 5 e Red Book." },
        { title: "PDF assinado server-side", desc: "Geração server-side para consistência, assinatura SHA-256 para não repúdio, logótipo do perito." },
        { title: "Indicador de confiança", desc: "Pontuação de confiança baseada no número de comparáveis, dispersão, idade dos dados." },
        { title: "Inspeção no terreno TEGOVA", desc: "Checklist de 41 pontos EVS 2025. Offline no telemóvel, sincronização ao regressar, importação para o relatório." },
        { title: "Modelo hedónico", desc: "29 coeficientes fundamentados. MAPE e R² publicados." },
        { title: "Transparência do modelo", desc: "Página /transparence pública: back-test em 20 imóveis LU, MAPE e R² apresentados." },
      ],
    },
  },
  investisseur: {
    meta: {
      title: "Simulador de investimento imobiliário Luxemburgo, rentabilidade, DCF, fiscalidade",
      description: "Rentabilidade, custos de aquisição com Bëllegen Akt, DCF multi-inquilino, mais-valias, VEFA com juros intercalares. Fiscalidade LU integrada.",
    },
    hero: {
      badge: "Simulador de investimento LU completo",
      title: "A sua rentabilidade real,",
      titleAccent: "fiscalidade LU incluída",
      subtitle: "Simulador de rentabilidade imobiliária com custos de aquisição Bëllegen Akt, DCF multi-inquilino arrendamento a arrendamento, VEFA com juros intercalares, mais-valias, portefólio multi-ativos e ferramentas bancárias (LTV, DSCR, CRR).",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver como funciona",
      kpis: [
        { value: "Bëllegen Akt", label: "dedução integrada" },
        { value: "LU + FR + BE", label: "regimes fiscais tratados" },
        { value: "<24 h", label: "tempo de resposta do suporte" },
      ],
    },
    problem: {
      title: "Calcular a rentabilidade LU significa fazer malabarismo com 8 simuladores diferentes",
      intro: "Custos de notário num site, mais-valias noutro, DCF num Excel caseiro. Nisto, esquecem-se rubricas ou cometem-se erros que distorcem a decisão de investimento.",
      items: [
        { title: "Custos de aquisição subestimados", desc: "7 % de direitos de registo, transcrição, Bëllegen Akt (até 40.000 € de dedução), notário, IVA 3 % novo: muitos investidores calculam mal e bloqueiam o seu plano de financiamento.", stat: "3-7 % de diferença típica" },
        { title: "Confusão rentabilidade bruta vs líquida", desc: "Entre bruta, líquida e líquida-líquida (depois de impostos), os números não querem dizer a mesma coisa. Uma rentabilidade bruta de 5 % pode acabar em 2 % depois de impostos.", stat: "~40 % bruta vs líquida-líquida" },
        { title: "Nenhuma ferramenta de DCF adaptada ao LU", desc: "Os simuladores Excel em linha estão calibrados para FR ou BE. Sem regra dos 5 %, sem arrendamentos comerciais LU, sem mais-valias a 10 % LU.", stat: "95 % das ferramentas não-LU" },
      ],
    },
    howItWorks: {
      title: "Da avaliação à decisão, três passos",
      intro: "Introduz o imóvel. O sistema calcula a rentabilidade, a fiscalidade, o DCF. Compara cenários e decide.",
      steps: [
        { number: "1", title: "Introdução do imóvel e do financiamento", desc: "Preço, área, comuna, tipo, entrada, prazo do crédito, taxa. Custos de aquisição (Bëllegen Akt) calculados automaticamente." },
        { number: "2", title: "Simulações em paralelo", desc: "Rentabilidade, DCF a 10 anos, juros intercalares VEFA, mais-valias à venda, cash-flow mensal. Gráficos interativos." },
        { number: "3", title: "Comparação de cenários", desc: "Guardar vários cenários. PDF exportável para o seu banqueiro." },
      ],
    },
    features: {
      title: "A caixa de ferramentas financeira imobiliária LU completa",
      intro: "Cada cálculo respeita a regulamentação luxemburguesa: Bëllegen Akt, IVA VEFA 3 %, mais-valias 10 %, taxas CSSF, regra dos 5 %.",
      items: [
        { title: "Custos de aquisição LU", desc: "7 % de direitos, transcrição, notário, Bëllegen Akt com pré-requisitos, IVA VEFA 3 %." },
        { title: "Rentabilidade completa", desc: "Bruta, líquida, líquida-líquida. Com vacância, encargos, contribuição predial, seguro, administração, manutenção." },
        { title: "DCF multi-inquilino", desc: "Arrendamento a arrendamento com break options, step rents, CAPEX programado, TIR equity e TIR projeto." },
        { title: "Simulador VEFA", desc: "Juros intercalares, IVA 3 %, garantia de acabamento, plano de chamadas de fundos." },
        { title: "Mais-valias LU", desc: "Abatimento por tempo de detenção, taxa efetiva, residência principal vs investimento." },
        { title: "Comparador comprar vs arrendar", desc: "VAL em prazo configurável, custo de oportunidade, limiar de break-even." },
        { title: "Portefólio multi-ativos", desc: "Vista consolidada: valor total, rentabilidade média, exposição geográfica, diversificação." },
        { title: "Ferramentas bancárias", desc: "LTV, DSCR, valor de garantia CRR, stress test de taxa +2 %, capacidade de endividamento." },
        { title: "Conta de exploração do promotor", desc: "Previsão de receitas, custos de construção STATEC, custos financeiros, margem do promotor." },
        { title: "98 comunas LU", desc: "Preços por m², rendas, rentabilidades, demografia, rendimento mediano. Atualizações trimestrais." },
        { title: "Macro em direto", desc: "OAT 10 anos, taxas hipotecárias, índice de custos de construção, inflação. BCE + STATEC." },
        { title: "Relatório PDF bancário", desc: "Dossier de financiamento completo: simulação, DCF, stress test, garantias." },
      ],
    },
  },
  particulier: {
    meta: {
      title: "Ferramentas imobiliárias para particulares no Luxemburgo, avaliação, apoios, arrendamento",
      description: "Avaliação, custos de aquisição com Bëllegen Akt, simulador de apoios Estado + Comuna, teto de arrendamento 5 %, comprar vs arrendar. Gratuito, 5 línguas.",
    },
    hero: {
      badge: "Ferramentas gratuitas para particulares LU",
      title: "Comprar, arrendar, renovar no Luxemburgo",
      titleAccent: "sem empresa de consultoria",
      subtitle: "Avaliação de imóveis, cálculo dos custos de aquisição com Bëllegen Akt, simulação de apoios Estado + Comuna (Klimabonus incluído), verificação do teto de arrendamento legal de 5 %, comparação comprar vs arrendar. Concebido para particulares e primeiros compradores luxemburgueses.",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver as ferramentas",
      kpis: [
        { value: "0 €", label: "sem registo necessário" },
        { value: "5 níveis", label: "de apoios cumuláveis" },
        { value: "98", label: "comunas abrangidas" },
      ],
    },
    problem: {
      title: "Comprar no Luxemburgo em 2026 pede demasiada papelada",
      intro: "Entre a fiscalidade, os apoios cumuláveis, o teto de arrendamento legal, os custos de aquisição, passam-se horas a pesquisar e a comparar antes mesmo de contactar uma agência.",
      items: [
        { title: "Custos de aquisição opacos", desc: "Direitos de registo, transcrição, notário, Bëllegen Akt: quem paga o quê, e quanto sai efetivamente do bolso? Os simuladores em linha esquecem-se frequentemente de metade.", stat: "8-12 % do preço tipicamente" },
        { title: "Apoios difíceis de encontrar", desc: "Prémio à aquisição, Klimabonus, prémio de habitação do Estado, apoios comunais, IVA 3 % em renovação. Muitos agregados perdem 2.000 a 8.000 €.", stat: "~5.000 € perdidos em média" },
        { title: "Teto de arrendamento de 5 % pouco conhecido", desc: "A regra dos 5 % protege os arrendatários e enquadra os senhorios. Ultrapassá-la expõe a ações judiciais.", stat: "~15 % dos arrendamentos infringem" },
      ],
    },
    howItWorks: {
      title: "Ferramentas claras, três passos",
      intro: "Sem inscrição necessária para começar. Cada ferramenta dá uma resposta precisa em alguns minutos.",
      steps: [
        { number: "1", title: "Introduzir a sua situação", desc: "Imóvel pretendido, entrada, comuna, estado civil, projeto. Sem conta necessário para as ferramentas de base." },
        { number: "2", title: "Obter os seus números", desc: "Avaliação do imóvel, custos de aquisição detalhados, lista de apoios cumuláveis, comparação comprar vs arrendar." },
        { number: "3", title: "Exportar ou partilhar", desc: "Descarga PDF gratuita ou partilha via ligação view-only (com conta). Levar para o banco, notário ou agência." },
      ],
    },
    features: {
      title: "Todas as ferramentas de que um particular luxemburguês precisa",
      intro: "Específicas para o enquadramento luxemburguês (Bëllegen Akt, IVA 3 %, regra dos 5 %, Klimabonus), todas disponíveis em 5 línguas.",
      items: [
        { title: "Avaliação instantânea", desc: "Preço por m² por comuna e bairro, modelo hedónico com 29 coeficientes fundamentados." },
        { title: "Custos de aquisição detalhados", desc: "7 % de direitos, transcrição, notário, Bëllegen Akt com pré-requisitos, IVA VEFA 3 %." },
        { title: "Simulador de apoios 5 níveis", desc: "Prémio de habitação do Estado, Klimabonus, Klimaprêt 1,5 %, apoios comunais, IVA 3 % em renovação." },
        { title: "Teto de arrendamento legal 5 %", desc: "Cálculo da renda máxima baseada no capital investido indexado + obras amortizadas." },
        { title: "Comprar vs arrendar", desc: "Comparação VAL no prazo, custo de oportunidade. Limiar de break-even." },
        { title: "Mapa de preços", desc: "Mapa interativo 100 comunas + bairros da cidade do Luxemburgo com preços e rentabilidades." },
        { title: "Mais-valias", desc: "Residência principal (isenção), secundária, investimento. Abatimento por tempo de detenção." },
        { title: "Juros intercalares VEFA", desc: "Juros durante a fase de construção e custo total com IVA 3 %." },
        { title: "Guias jurídicos", desc: "Arrendamento habitacional, comercial, mais-valias, condomínio, Klimabonus." },
        { title: "Comparar dois imóveis", desc: "Lado a lado: preço, rentabilidade, encargos, apoios, distância casa-trabalho. Recomendação automática." },
        { title: "Assistente do particular", desc: "Fluxo em 4 passos: avaliação + encargos + apoios + arrendamento legal num só percurso." },
        { title: "Inspeção no terreno TEGOVA", desc: "Checklist de 41 pontos para visita de imóvel." },
      ],
    },
  },
  promoteur: {
    meta: {
      title: "Software de promotor imobiliário Luxemburgo, conta de exploração, VEFA, custos de construção",
      description: "Conta de exploração do promotor com plano de tesouraria, simulador VEFA com juros intercalares, estimador de custos de construção STATEC, obras de urbanização e conversão de áreas OAI/ILNAS.",
    },
    hero: {
      badge: "Para promotores e marchands de biens LU",
      title: "Conta de exploração do promotor e simulação VEFA,",
      titleAccent: "sem voltar a introduzir os custos três vezes",
      subtitle: "Conta de exploração do promotor completa com plano de tesouraria mensal e previsão de margem, simulador VEFA com juros intercalares e IVA LU 3 %, estimador de custos de construção referenciado STATEC (17 ofícios), calculador de obras de urbanização (9 lotes), conversor de áreas OAI/ILNAS. Concebido para promotores imobiliários e marchands de biens luxemburgueses.",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver como funciona",
      kpis: [
        { value: "17 ofícios", label: "STATEC integrados" },
        { value: "9 lotes", label: "urbanização configurável" },
        { value: "<24 h", label: "tempo de resposta do suporte" },
      ],
    },
    problem: {
      title: "Montar um projeto imobiliário no Luxemburgo significa fazer malabarismo com 6 folhas",
      intro: "Custos de construção num Excel, VEFA noutro, juros intercalares à mão, plano de tesouraria refeito a cada iteração. Resultado: o momento em que se vê se o projeto faz mesmo margem chega muito tarde.",
      items: [
        { title: "Custos de construção imprecisos", desc: "Valorização feita com base no último projeto comparável, sem referência STATEC atualizada. No final, 10-20 % de diferença que consome a margem.", stat: "±10-20 % de diferença típica" },
        { title: "Juros intercalares VEFA complexos", desc: "Plano de chamadas de fundos por tranche, taxa de crédito de curto prazo, IVA 3 % a atribuir à base correta: muitos erros possíveis.", stat: "~3 h por simulação" },
        { title: "Sem plano de tesouraria dinâmico", desc: "3 meses de atraso na licença de construção, 5 % de derrapagem na estrutura: é preciso refazer a folha à mão para ver o efeito na margem final.", stat: "~8 h de revisão por alteração" },
      ],
    },
    howItWorks: {
      title: "Da valorização à comercialização, três passos",
      intro: "Introduz o terreno e o programa. O sistema calcula os custos de construção, projeta a VEFA e calcula a margem.",
      steps: [
        { number: "1", title: "Terreno e programa", desc: "Preço do terreno, área construível segundo PAG, programa (número de lotes, tipos, áreas), comuna. Verificação automática das regras PAG/PAP." },
        { number: "2", title: "Custos de construção + urbanização", desc: "Valorização por ofício STATEC (17 rubricas), ajustamento por classe energética (AAA-C), acabamentos. Urbanização 9 lotes com preços fundamentados." },
        { number: "3", title: "Conta de exploração + VEFA", desc: "Plano de tesouraria mensal, simulação de chamadas de fundos VEFA, juros intercalares em crédito de construção, IVA 3 % novo, margem bruta e líquida." },
      ],
    },
    features: {
      title: "Todas as ferramentas para montar um projeto imobiliário",
      intro: "Específicas para as normas luxemburguesas (STATEC, OAI FC.04, ILNAS 101:2016, IVA VEFA 3 %, PAG/PAP) e para as práticas do mercado.",
      items: [
        { title: "Conta de exploração do promotor completa", desc: "Previsão de receitas por lote, custos totais, custos financeiros, margem bruta e líquida, TIR do projeto." },
        { title: "Plano de tesouraria mensal", desc: "Receitas VEFA mensais e despesas de construção mês a mês. Break-even identificado." },
        { title: "Simulador VEFA", desc: "Juros intercalares, IVA 3 % em base tributável, garantia financeira de acabamento, plano de chamadas de fundos padrão." },
        { title: "Estimador de construção STATEC", desc: "17 ofícios, índice STATEC outubro 2025: 1.173,24. Ajustamento por classe energética." },
        { title: "Calculador de urbanização (9 lotes)", desc: "Movimentação de terras, vias, saneamento, abastecimento de água, iluminação, espaços verdes. Preços fundamentados Batiprix 2026 (coef. LU ×1,20), CTG, CSDC-CT." },
        { title: "Conversor de áreas ACT", desc: "SCB / SCP / utilizável / habitável conforme ILNAS 101:2016. Ponderação ACT conforme OAI FC.04." },
        { title: "Análise PAG-PAP", desc: "Regras urbanísticas PAG e PAP por comuna (COS, CUS, afastamento, altura)." },
        { title: "Áreas agrícolas", desc: "Valorização de áreas agrícolas, rendimento de arrendamento rural, conversão em terreno urbanizável." },
        { title: "Comparação de cenários", desc: "Vários cenários em paralelo: programa A (100 % habitação) vs B (misto)." },
        { title: "Sensibilidade de margem", desc: "Stress test em prazo, custos de construção, preço de venda. Margem worst-case apresentada." },
        { title: "Relatório PDF bancário", desc: "Dossier de financiamento de promotor completo: conta de exploração, plano de tesouraria, garantias, pré-comercialização." },
        { title: "Dados de 98 comunas", desc: "Preços de venda por comuna, demografia, regras urbanísticas. Verificação de pré-comercialização." },
      ],
    },
  },
  banque: {
    meta: {
      title: "Software de avaliação imobiliária para bancos Luxemburgo, CRR, LTV, DSCR",
      description: "Avaliação EVS 2025 conforme CRR, stress test +2 %, ferramentas LTV/DSCR, AML/KYC, portefólio energético CRREM. Para analistas de crédito e risk managers LU.",
    },
    hero: {
      badge: "Para bancos e analistas de crédito LU",
      title: "Análise de crédito imobiliário,",
      titleAccent: "CRR + EVS 2025 numa só ferramenta",
      subtitle: "Avaliação EVS 2025 com valor de garantia CRR (haircut energético), LTV / DSCR / capacidade de endividamento por perfil CSSF, AML/KYC com verificação de sanções UE, portefólio energético CRREM stranding. Concebido para analistas de crédito, risk managers e compliance officers luxemburgueses.",
      cta: "Começar gratuitamente",
      ctaSecondary: "Ver como funciona",
      kpis: [
        { value: "CRR + EVS 2025", label: "dupla conformidade" },
        { value: "CRREM stranding", label: "haircut energético" },
        { value: "<24 h", label: "tempo de resposta do suporte" },
      ],
    },
    problem: {
      title: "Uma análise de crédito imobiliário no Luxemburgo significa 5 ferramentas separadas",
      intro: "Valor de mercado numa ferramenta, valor de garantia noutra, AML/KYC em portal externo, stress test à mão. Os processos demoram 3 dias quando podiam demorar 3 horas.",
      items: [
        { title: "Valor de garantia CRR manual", desc: "Cálculo do haircut energético segundo a classe energética do imóvel, ajustamento stranded asset (CRREM 2030+), verificação de conformidade CRR 575/2013: muitas iterações manuais.", stat: "~2 h por processo" },
        { title: "AML/KYC em várias plataformas", desc: "Verificação de sanções UE (CFSP), PEP, Ultimate Beneficial Owner, origem dos fundos em 3 ferramentas diferentes. Nenhum audit trail consolidado.", stat: "~1 h por processo" },
        { title: "Sem vista de portefólio energético", desc: "Que imóveis do portefólio estarão stranded em 2030 ou 2040 segundo o CRREM? Que provisão para haircut energético? Nenhuma ferramenta consolidada.", stat: "~0 bancos LU equipados" },
      ],
    },
    howItWorks: {
      title: "Da análise de crédito ao reporting de risco, três passos",
      intro: "Introduz o processo do cliente. A ferramenta calcula valor de mercado + valor de garantia, aplica o haircut energético, verifica AML/KYC, entrega o relatório.",
      steps: [
        { number: "1", title: "Dossier do mutuário + imóvel", desc: "Perfil do mutuário (residente, não residente, investidor), imóvel (endereço, área, classe energética, ano), montante, prazo, taxa." },
        { number: "2", title: "Avaliação + CRR + LTV/DSCR", desc: "Valor de mercado EVS 2025 (8 métodos), valor de garantia CRR com haircut CRREM, LTV por perfil CSSF, DSCR alvo 1,25, stress test taxa +2 % e desemprego." },
        { number: "3", title: "AML/KYC + relatório de risco", desc: "Verificação de sanções UE, PEP, UBO, origem dos fundos. Relatório PDF de risco com parecer estruturado (APPROVED / REVIEW / DECLINED) pronto para comité de crédito." },
      ],
    },
    features: {
      title: "Análise de crédito imobiliário bancária completa",
      intro: "Conforme ao Regulamento UE 575/2013 (CRR), requisitos CSSF, EN 16931, RGPD e diretrizes EBA sobre garantias imobiliárias.",
      items: [
        { title: "Avaliação EVS 2025", desc: "8 métodos TEGOVA, 9 tipos de ativos, dados 98 comunas LU, sensibilidade automática. Conforme Carta 5.ª ed." },
        { title: "Valor de garantia CRR", desc: "Haircut energético por ano de stranding CRREM, ajustamento por classe energética, conforme CRR 575/2013 art. 208." },
        { title: "LTV / DSCR / capacidade", desc: "LTV máximo por perfil (80 % residente, 70 % não residente, 60 % investidor), DSCR alvo 1,25, capacidade de endividamento." },
        { title: "Stress test +2 % + desemprego", desc: "Simulações de risco: taxa +2 %, 6 meses de desemprego, desvalorização 10-20 %." },
        { title: "AML/KYC integrado", desc: "Verificação de sanções UE (CFSP), PEP, UBO, origem dos fundos. Audit trail consolidado, exportação JSON." },
        { title: "Portefólio energético CRREM", desc: "Vista stranding 2030 / 2040 / 2050 por imóvel. Provisão haircut energético. Acompanhamento de obras de renovação." },
        { title: "Relatório PDF de risco", desc: "Parecer estruturado APPROVED / REVIEW / DECLINED com justificação. Comité de crédito preliminar ou principal." },
        { title: "API REST para CRM bancário", desc: "Integração API: avaliação, LTV, stress test, AML/KYC. Webhook para push automático." },
        { title: "Transparência do modelo", desc: "MAPE e R² públicos, 29 coeficientes hedónicos fundamentados documentados. Auditabilidade para BCL e CSSF." },
        { title: "Avaliação hoteleira", desc: "Métodos específicos do setor hoteleiro (RevPAR × multiplicador de capitalização, DSCR hoteleiro 1,25)." },
        { title: "DCF escritórios + retalho", desc: "DCF multi-inquilino arrendamento a arrendamento. Break options, step rents, CAPEX programado." },
        { title: "Dados macro em direto", desc: "OAT 10 anos, taxas hipotecárias, índice de custos de construção, inflação. BCE + STATEC." },
      ],
    },
  },
};

// Adicionar trust, pricing, faq, finalCta para cada persona
const COMMON_BLOCKS = {
  syndic: {
    trust: {
      title: "Porque é que os administradores de condomínio LU nos escolhem",
      agileTitle: "Desenvolvimento ágil, releases regulares",
      agileDesc: "Novos módulos entregues a cada 2 semanas. Backlog público, os seus pedidos passam rapidamente a produção.",
      customTitle: "Desenvolvimento à medida disponível",
      customDesc: "Formato de convocatória específico, cálculo de permilagem invulgar, exportação para a sua contabilidade: desenvolvimento em 1 a 3 semanas.",
      supportTitle: "Suporte em menos de 24 h",
      supportDesc: "E-mail para contact@tevaxia.lu. Resposta média em menos de 6 horas nos dias úteis. Sem números de ticket, sem chatbot.",
    },
    pricing: {
      title: "Incluído na sua subscrição tevaxia",
      subtitle: "Sem faturação por condomínio, sem quota de AG, sem módulo premium. Tudo disponível em freemium para testar, na subscrição geral para utilização diária.",
      features: ["Condomínios ilimitados", "AG em linha com voto ponderado por permilagens", "Chamadas de fundos Factur-X conformes EN 16931", "Contabilidade de condomínio luxemburguesa", "Reconciliação bancária PSD2 (Enable Banking)", "Portal do condómino com acesso individual", "5 anexos contabilísticos PDF da AG", "Cobranças 3 níveis com juros LU", "Conforme lei de 16 de maio de 1975"],
      ctaPlatform: "Ver planos tevaxia",
      ctaEmit: "Ir para o módulo de administração",
    },
    faq: {
      title: "Perguntas frequentes",
      items: [
        { q: "Estou a mudar de [outra ferramenta] para a tevaxia, como migrar?", a: "Importação Excel padrão (lotes, condóminos, histórico de despesas), depois configuração das chaves de repartição. A retoma de um exercício a decorrer demora 2 a 4 horas. Acompanhamos sem custos adicionais." },
        { q: "A ferramenta está conforme ao direito luxemburguês do condomínio?", a: "Sim, a lei de 16 de maio de 1975 está integrada: maiorias simples / absoluta / dupla / unanimidade, prazo de convocatória de 15 dias, obrigações contabilísticas, arquivo de 10 anos." },
        { q: "Uma AG em linha tem valor legal?", a: "Sim, desde que o regulamento do condomínio o permita ou que uma deliberação anterior de AG física o tenha autorizado. A prática generalizou-se no Luxemburgo desde 2020." },
        { q: "As chamadas de fundos podem ser emitidas para condomínios isentos de IVA?", a: "Sim, o art. 44 §1 f da lei do IVA isenta a administração de condomínios. O módulo aplica automaticamente a isenção correta." },
        { q: "Os dados dos condóminos estão seguros?", a: "Armazenados no Supabase (AWS eu-central-1 Frankfurt) com Row Level Security, conforme RGPD, encriptação HTTPS." },
        { q: "Quanto tempo até estar operacional?", a: "Um administrador com 1 a 5 condomínios fica operacional em 1 a 2 horas. Acima de 10 condomínios, 4 a 6 horas para importação completa." },
      ],
    },
    finalCta: { title: "Pronto para recuperar os seus serões", desc: "Criar uma conta gratuita, importar o primeiro condomínio, gerar uma chamada de fundos de teste em 15 minutos. Zero compromisso.", cta: "Começar gratuitamente", ctaSecondary: "Ver o módulo de administração em direto" },
  },
};

// Helper: blocos trust/pricing padrão para personas sem versão personalizada
function standardTrust(persona) {
  const titles = {
    agence: "Porque é que as agências LU nos escolhem",
    hotel: "Porque é que os hoteleiros LU nos escolhem",
    "expert-evaluateur": "Porque é que os avaliadores LU nos escolhem",
    investisseur: "Porque é que os investidores LU nos escolhem",
    particulier: "Porque é que os particulares LU nos utilizam",
    promoteur: "Porque é que os promotores LU nos escolhem",
    banque: "Porque é que os bancos LU nos consideram",
  };
  return {
    title: titles[persona],
    agileTitle: "Desenvolvimento ágil, releases regulares",
    agileDesc: "Novos módulos entregues a cada 2 semanas. Backlog público em github.com/Tevaxia.",
    customTitle: "Desenvolvimento à medida possível",
    customDesc: "Adaptações específicas, integrações dedicadas: desenvolvimento em 1 a 3 semanas.",
    supportTitle: "Suporte em menos de 24 h",
    supportDesc: "E-mail para contact@tevaxia.lu. Resposta média em menos de 6 horas nos dias úteis.",
  };
}

// Builds completos para as restantes personas (trust, pricing, faq, finalCta)
const REST = {
  agence: {
    trust: standardTrust("agence"),
    pricing: { title: "Incluído na sua subscrição tevaxia", subtitle: "Sem faturação por mandato, sem faturação por contacto. Todo o CRM está incluído na subscrição geral.", features: ["Mandatos OpenImmo ilimitados", "Contactos ilimitados com importação CSV", "Matching automático de compradores /100", "Pipeline kanban drag and drop", "PDFs de imóvel em co-branding", "Guias de visita e assinatura eIDAS", "Sequências de nurturing automatizadas", "Comissões e desempenho dos agentes", "10 modelos de e-mail editáveis"], ctaPlatform: "Ver planos tevaxia", ctaEmit: "Ir para o CRM" },
    faq: { title: "Perguntas frequentes", items: [
      { q: "É compatível com o athome.lu e os portais LU?", a: "Sim, a exportação OpenImmo 1.2.8 é o formato padrão aceite pelo athome.lu, immotop.lu, wort.lu, assim como pelo immoscout24.de e idealista.it/pt." },
      { q: "Como funciona o matching de compradores?", a: "O algoritmo compara cada mandato com cada comprador segundo 6 critérios ponderados: orçamento, raio, tipo, área, classe energética, data do projeto." },
      { q: "Venho de outro CRM, como migro?", a: "Importação CSV padrão. Mapeamento automático das colunas com pré-visualização. A maioria das agências fica operacional em 2 a 4 horas. Acompanhamento na migração gratuito." },
      { q: "Posso gerir várias agências / agentes com papéis separados?", a: "Sim, organizações multi-entidade com papéis (Admin, Agente, Assistente). Cada agente só vê os mandatos e contactos que lhe estão atribuídos." },
      { q: "A assinatura eIDAS tem valor jurídico?", a: "Sim, a assinatura eletrónica avançada eIDAS (Regulamento UE 910/2014) tem validade jurídica equivalente à assinatura manuscrita." },
      { q: "Os dados dos contactos estão seguros em matéria de RGPD?", a: "Dados no Supabase (AWS eu-central-1 Frankfurt), Row Level Security por utilizador, HTTPS. Exportação completa dos dados em ZIP a qualquer momento." },
    ]},
    finalCta: { title: "Pronto para consolidar o seu negócio", desc: "Criar uma conta, importar a base de contactos, lançar o primeiro matching em 15 minutos. Zero compromisso.", cta: "Começar gratuitamente", ctaSecondary: "Ver o CRM em direto" },
  },
  hotel: {
    trust: standardTrust("hotel"),
    pricing: { title: "Incluído na sua subscrição tevaxia", subtitle: "Sem faturação por quarto, sem faturação por reserva. O PMS completo está incluído na subscrição geral.", features: ["Propriedades e quartos ilimitados", "Reservas ilimitadas", "Folios USALI 19 categorias com auto-posting", "Faturação IVA LU 3 % / 8 % / 17 % + Factur-X", "Relatório USALI mensal + forecast a 90 dias", "Importação/Exportação iCal (Booking, Airbnb, VRBO)", "POS de restaurante/bar + grupos MICE", "Heatmap de ocupação e relatório de pickup"], ctaPlatform: "Ver planos tevaxia", ctaEmit: "Ir para o PMS" },
    faq: { title: "Perguntas frequentes", items: [
      { q: "É compatível com o Booking.com e o Airbnb?", a: "Sim, via iCal. Copia cada ligação iCal da OTA a partir da interface deles, cola na tevaxia, e as reservas são importadas a cada 15 min." },
      { q: "Como funciona o IVA 3 % LU em alojamento?", a: "O IVA 3 % aplica-se às noites turísticas. O nosso módulo aplica automaticamente 3 % aos USALI quarto + cama extra, 17 % ao F&B, 0 % à taxa turística." },
      { q: "Os meus clientes empresariais querem Factur-X, é suportado?", a: "Sim. No check-out, a opção fatura empresa ativa a geração Factur-X (PDF/A-3 + XML EN 16931 embutido)." },
      { q: "O forecast a 90 dias é fiável?", a: "O modelo Holt-Winters com sazonalidade semanal fornece tipicamente um MAPE de 8-15 %. Adequado para planeamento de pessoal." },
      { q: "Posso gerir vários hotéis a partir de uma conta?", a: "Sim. Multi-property nativo. Dashboard consolidado para visão de portefólio. Funciona para grupos hoteleiros até 15-20 propriedades." },
      { q: "Os meus dados estão alojados na UE?", a: "Supabase (AWS eu-central-1, Frankfurt). Row Level Security, HTTPS. Exportação completa dos dados dos hóspedes em ZIP a qualquer momento." },
    ]},
    finalCta: { title: "Pronto para retomar o controlo da sua exploração", desc: "Criar uma conta, configurar a primeira propriedade em 20 minutos, registar a primeira reserva. Zero compromisso.", cta: "Começar gratuitamente", ctaSecondary: "Ver o PMS em direto" },
  },
  "expert-evaluateur": {
    trust: standardTrust("expert-evaluateur"),
    pricing: { title: "Incluído na sua subscrição tevaxia", subtitle: "Sem faturação por relatório, sem quota mensal. Todo o módulo de avaliação está incluído na subscrição geral.", features: ["Relatórios EVS 2025 ilimitados", "8 métodos de avaliação", "9 tipos de ativos suportados", "Dados macro e comunais pré-preenchidos", "Comparáveis automáticos por proximidade", "Assinatura SHA-256 + logótipo do perito", "Inspeção TEGOVA 41 pontos (offline)", "Modelo hedónico com MAPE/R² público"], ctaPlatform: "Ver planos tevaxia", ctaEmit: "Ir para o módulo de avaliação" },
    faq: { title: "Perguntas frequentes", items: [
      { q: "O relatório está conforme à Carta 5.ª ed.?", a: "Sim, as 11 secções obrigatórias seguem a estrutura TEGOVA/Carta. Pressupostos especiais EVS 5 e incerteza material incluídos." },
      { q: "Posso escolher apenas os métodos relevantes para o meu imóvel?", a: "Sim. Toggle por método: ativar comparação + capitalização para um escritório arrendado, DCF sozinho para um investimento, residual energético para uma renovação pesada." },
      { q: "Os dados comunais estão atualizados?", a: "Sim, preços m² do Observatoire de l'Habitat (trimestrais), demografia STATEC (anual), taxas macro BCE (mensais)." },
      { q: "Posso personalizar o PDF com o meu logótipo e as minhas qualificações?", a: "Sim, no seu perfil: logótipo, nome completo, qualificações (ex. REV TEGOVA, MRICS), menção legal personalizada." },
      { q: "A assinatura SHA-256 tem peso legal?", a: "A assinatura SHA-256 garante a integridade do documento. Não substitui uma assinatura eIDAS juridicamente qualificada, mas fornece prova criptográfica de que o relatório não foi alterado." },
      { q: "Como são tratados os pressupostos especiais EVS 5?", a: "Secção dedicada: lista os pressupostos vinculativos, a ferramenta apresenta o aviso obrigatório EVS 5 e ajusta o valor com base nos inputs." },
    ]},
    finalCta: { title: "Pronto para poupar 3 horas por relatório", desc: "Criar uma conta, personalizar o perfil, gerar o primeiro relatório EVS 2025 em 20 minutos. Zero compromisso.", cta: "Começar gratuitamente", ctaSecondary: "Ver o módulo de avaliação" },
  },
  investisseur: {
    trust: standardTrust("investisseur"),
    pricing: { title: "Incluído na sua subscrição tevaxia", subtitle: "Sem faturação por simulação, sem quota. Todas as ferramentas de investimento estão incluídas na subscrição geral.", features: ["Simulações ilimitadas", "Custos de aquisição LU com Bëllegen Akt", "DCF multi-inquilino arrendamento a arrendamento", "VEFA com juros intercalares", "Mais-valias LU", "Portefólio multi-ativos consolidado", "Ferramentas bancárias LTV / DSCR / CRR", "Macro em direto BCE + STATEC"], ctaPlatform: "Ver planos tevaxia", ctaEmit: "Ir para o portefólio" },
    faq: { title: "Perguntas frequentes", items: [
      { q: "A dedução Bëllegen Akt é tratada corretamente?", a: "Sim, a ferramenta verifica as condições de elegibilidade e aplica até 40.000 € por pessoa de dedução sobre os direitos de registo." },
      { q: "O IVA 3 % novo é integrado corretamente?", a: "Sim, o simulador VEFA aplica automaticamente a taxa de 3 % sujeita à ocupação mínima de 2 anos de residência principal." },
      { q: "O DCF multi-inquilino trata breaks franceses e LU?", a: "Sim. Cada arrendamento pode ter o seu prazo, indexação, step rents programadas, break options, CAPEX programado." },
      { q: "As mais-valias LU são calculadas corretamente?", a: "Sim. Residência principal isenção, secundária taxa meio-global, investimento taxa global/meio-global consoante o tempo de detenção." },
      { q: "As ferramentas bancárias (LTV, DSCR, CRR) seguem as regras CSSF?", a: "Sim. LTV máximo por perfil de mutuário, DSCR alvo 1,25, valor de garantia CRR com haircut energético. Stress test +2 %." },
      { q: "Posso partilhar as minhas simulações com o meu banqueiro?", a: "Sim. PDF dossier de financiamento dedicado. Partilha view-only com ligação de 7-90 dias." },
    ]},
    finalCta: { title: "Pronto para decidir depressa e bem", desc: "Criar uma conta, introduzir o primeiro cenário, obter a rentabilidade completa em 5 minutos. Zero compromisso.", cta: "Começar gratuitamente", ctaSecondary: "Ver o portefólio em direto" },
  },
  particulier: {
    trust: standardTrust("particulier"),
    pricing: { title: "Gratuito, sem registo para o essencial", subtitle: "Todas as ferramentas de base funcionam sem conta. Criar uma conta gratuita para guardar as simulações, exportar PDFs e aceder ao histórico.", features: ["Avaliação, encargos, apoios, arrendamento sem conta", "Exportação PDF com conta gratuita", "Armazenamento na nuvem multi-dispositivo", "Histórico das simulações", "Partilha view-only", "Comparação até 5 cenários", "Alertas de mercado por comuna", "5 línguas (FR / EN / DE / LB / PT)"], ctaPlatform: "Ver planos tevaxia", ctaEmit: "Avaliar um imóvel" },
    faq: { title: "Perguntas frequentes", items: [
      { q: "A avaliação é fiável?", a: "MAPE de ~12 %, comparável às ferramentas bancárias. Continua a ser uma estimativa: uma avaliação REV certificada é recomendada para um financiamento bancário." },
      { q: "O Bëllegen Akt é calculado corretamente?", a: "Sim. Condições verificadas (residência principal, 2 anos de ocupação). Até 40.000 € por pessoa de dedução." },
      { q: "Os apoios comunais estão atualizados?", a: "Sim, mais de 30 comunas têm as suas taxas integradas. Contacte-nos se a sua estiver em falta." },
      { q: "A regra de arrendamento 5 % aplica-se a todos os arrendamentos?", a: "Sim para os arrendamentos habitacionais ao abrigo da lei 21.09.2006. Exceções: arrendamentos comerciais, mobilados de curta duração, residências estudantis." },
      { q: "Posso utilizar as ferramentas sem conta?", a: "Sim, todas as ferramentas de base funcionam sem registo. A conta gratuita desbloqueia a exportação PDF, o armazenamento na nuvem, o histórico e a partilha por ligação." },
      { q: "Os meus dados são guardados?", a: "Sem conta, nada permanece do lado do servidor. Com conta gratuita, armazenados no Supabase (AWS eu-central-1, Frankfurt) com RLS." },
    ]},
    finalCta: { title: "Pronto para ver as coisas com clareza", desc: "Começar pela avaliação de um imóvel ou pela simulação dos encargos. Sem inscrição, sem compromisso, em 2 minutos.", cta: "Avaliar um imóvel gratuitamente", ctaSecondary: "Ver todas as ferramentas" },
  },
  promoteur: {
    trust: standardTrust("promoteur"),
    pricing: { title: "Incluído na sua subscrição tevaxia", subtitle: "Sem faturação por projeto, sem quota de simulação. Todas as ferramentas de promoção estão incluídas na subscrição geral.", features: ["Conta de exploração do promotor ilimitada", "VEFA com juros intercalares", "Estimador de construção STATEC 17 ofícios", "Calculador de urbanização 9 lotes fundamentados", "Conversor de áreas OAI/ILNAS ACT", "Análise PAG/PAP 98 comunas", "Comparação de cenários ilimitada", "Relatório PDF bancário", "Stress test de margem multi-parâmetro"], ctaPlatform: "Ver planos tevaxia", ctaEmit: "Ir para a conta de exploração do promotor" },
    faq: { title: "Perguntas frequentes", items: [
      { q: "Os índices STATEC estão atualizados?", a: "Sim, o índice de custos de construção é atualizado trimestralmente (valor mais recente: outubro 2025 = 1.173,24). Os 17 ofícios STATEC estão cobertos." },
      { q: "O IVA 3 % novo é tratado corretamente?", a: "Sim, para compradores residentes em primeira aquisição que ocupem o imóvel pelo menos 2 anos." },
      { q: "Posso configurar custos de construção próprios?", a: "Sim, os 17 ofícios STATEC servem de referência mas são todos ajustáveis." },
      { q: "A urbanização corresponde às regras luxemburguesas?", a: "Sim, os 9 lotes de urbanização utilizam preços Batiprix 2026 (coeficiente LU ×1,20), CTG 002 & 009, CSDC-CT." },
      { q: "A conversão de áreas respeita as normas OAI/ILNAS?", a: "Sim, ILNAS 101:2016 para os 4 tipos de área. Ponderação ACT conforme OAI FC.04." },
      { q: "Posso exportar a conta de exploração para o meu banco?", a: "Sim, PDF dossier de financiamento de promotor completo: conta de exploração, plano de tesouraria mensal, sensibilidade de margem. Partilha view-only possível." },
    ]},
    finalCta: { title: "Pronto para orçamentar os seus projetos mais depressa", desc: "Criar uma conta, introduzir o primeiro projeto, obter a conta de exploração em 30 minutos. Zero compromisso.", cta: "Começar gratuitamente", ctaSecondary: "Ver a conta de exploração do promotor" },
  },
  banque: {
    trust: standardTrust("banque"),
    pricing: { title: "Incluído na sua subscrição tevaxia", subtitle: "Sem faturação por processo. Todas as ferramentas bancárias estão incluídas na subscrição geral.", features: ["Avaliações EVS 2025 ilimitadas", "Valor de garantia CRR com haircut CRREM", "LTV / DSCR / capacidade de endividamento", "Stress test +2 % e desemprego", "AML/KYC com audit trail", "Portefólio energético CRREM stranding", "Relatório PDF de risco estruturado", "API REST para integração CRM", "DCF multi-inquilino + avaliação hoteleira"], ctaPlatform: "Ver planos tevaxia", ctaEmit: "Ir para as ferramentas bancárias" },
    faq: { title: "Perguntas frequentes", items: [
      { q: "Como é calculado o valor de garantia CRR?", a: "Valor de mercado EVS 2025 menos haircut energético baseado na classe energética do imóvel e na trajetória CRREM. Um ativo stranded antes de 2030 recebe um haircut de 20-30 %." },
      { q: "O AML/KYC cobre os requisitos CSSF?", a: "Sim: verificação de sanções UE (CFSP), PEP, UBO, origem dos fundos. Audit trail consolidado com timestamps. Relatório exportável para auditorias CSSF." },
      { q: "O stress test está conforme à EBA?", a: "Sim, os cenários padrão (+2 % de taxa, 6 meses de desemprego, desvalorização 10-20 %) correspondem às expectativas EBA em matéria de testes de resiliência." },
      { q: "Podemos integrar via API ao nosso core banking?", a: "Sim, API REST com OAuth 2.0. Endpoints: avaliação, LTV, stress test, AML/KYC. Webhook para push automático. Documentação pública OpenAPI 3.1." },
      { q: "Como é tratada a conformidade BCL e CSSF?", a: "Modelo hedónico com MAPE e R² públicos para auditabilidade, 29 coeficientes fundamentados documentados. Página /transparence pública." },
      { q: "Os dados dos clientes estão seguros ao nível bancário?", a: "Armazenamento Supabase (AWS eu-central-1 Frankfurt), Row Level Security, HTTPS, ISO 27001. Isolamento estrito por organização." },
    ]},
    finalCta: { title: "Pronto para acelerar os seus processos de crédito", desc: "Criar uma conta piloto, ligar um processo de teste, obter avaliação + CRR + AML/KYC em 10 minutos. Contacte-nos para uma POC bancária.", cta: "Começar gratuitamente", ctaSecondary: "Ver as ferramentas bancárias" },
  },
};

// Fundir blocos comuns em cada persona
for (const [key, rest] of Object.entries(REST)) {
  SOLUTIONS[key] = { ...SOLUTIONS[key], ...rest };
}
// Syndic utiliza o COMMON_BLOCKS.syndic personalizado
SOLUTIONS.syndic = { ...SOLUTIONS.syndic, ...COMMON_BLOCKS.syndic };

const SOLUTIONS_HUB = {
  meta: {
    title: "Soluções imobiliárias luxemburguesas por perfil, tevaxia.lu",
    description: "Administração de condomínios, agência, hotelaria, avaliador, investidor, particular: encontre a solução tevaxia.lu para a sua profissão. Conformidade LU, dados públicos, 5 línguas.",
  },
  hero: {
    badge: "6 soluções específicas por setor",
    title: "Encontre a solução adequada à sua profissão",
    subtitle: "Cada perfil tem as suas obrigações legais, fluxos de trabalho e fontes de dados específicas do mercado luxemburguês. Em vez de procurar em mais de 40 ferramentas, comece pela sua profissão.",
  },
  personas: {
    cta: "Ver a solução detalhada",
    syndic: { title: "Administração de condomínios / Síndico", desc: "AG em linha com voto ponderado por permilagens, chamadas de fundos Factur-X, contabilidade de condomínio LU, reconciliação bancária PSD2. Conforme lei de 16 de maio de 1975." },
    agence: { title: "Agência imobiliária", desc: "Pipeline de mandatos OpenImmo, CRM de contactos com matching de compradores /100, kanban drag and drop, PDFs de imóvel em co-branding, assinatura eIDAS." },
    hotel: { title: "Hotelaria", desc: "PMS multi-propriedade, folios auto-posting USALI 19 categorias, faturação IVA LU 3 %/8 %/17 %, forecast a 90 dias, iCal OTA." },
    "expert-evaluateur": { title: "Avaliador / Perito", desc: "Relatório conforme TEGOVA EVS 2025 em 20 min, 8 métodos, 9 tipos de ativos, dados pré-preenchidos (98 comunas + 12 séries macro)." },
    investisseur: { title: "Investidor", desc: "Simulador de rentabilidade com Bëllegen Akt, DCF multi-inquilino, juros intercalares VEFA, mais-valias LU, portefólio multi-ativos." },
    particulier: { title: "Particular", desc: "Avaliação, custos de aquisição com Bëllegen Akt, 5 níveis de apoios cumuláveis (Klimabonus incluído), teto de arrendamento legal de 5 %." },
  },
  compare: {
    title: "Comparação rápida",
    intro: "Se está indeciso entre dois perfis, compare a utilização diária, a conformidade legal e as normas implementadas.",
    profileCol: "Perfil",
    dailyCol: "Utilização diária",
    complianceCol: "Conformidade LU",
    standardsCol: "Normas",
    rows: {
      syndic: { daily: "Gerir AG, chamadas de fundos, cobranças, contabilidade de condomínio", compliance: "Lei de 16 de maio de 1975, isenção de IVA art. 44 §1 f", standards: "EN 16931, Peppol, ISO 20022" },
      agence: { daily: "Mandatos, contactos, difusão em portais, matching de compradores", compliance: "eIDAS UE 910/2014, consentimento RGPD", standards: "OpenImmo 1.2.8, eIDAS" },
      hotel: { daily: "Reservas, folios, faturação, revenue management", compliance: "IVA 3 % alojamento, taxa municipal", standards: "USALI 11.ª ed., STR, iCal" },
      "expert-evaluateur": { daily: "Avaliações imobiliárias, relatórios, inspeções no terreno", compliance: "TEGOVA EVS 2025, Carta 5.ª ed.", standards: "EVS 2025, Red Book, RICS" },
      investisseur: { daily: "Rentabilidade, DCF, simulações de financiamento, portefólio", compliance: "Bëllegen Akt, mais-valias LU, regras CSSF", standards: "CRR, BCE, Basileia III" },
      particulier: { daily: "Avaliação, encargos, apoios, comparação comprar/arrendar", compliance: "Lei 21.09.2006, regra dos 5 %, Klimabonus", standards: "IRL, Observatoire Habitat, STATEC" },
    },
  },
  faq: {
    title: "Perguntas comuns aos 6 perfis",
    intro: "Sobre o modelo de preços, o desenvolvimento à medida, o suporte, a segurança e a migração.",
    items: [
      { q: "Qual é o custo da subscrição tevaxia?", a: "Sem faturação por módulo nem por utilizador dentro de cada perfil. Uma única subscrição tevaxia dá acesso a todas as ferramentas da sua profissão, sem quotas nem limites de volume. Preçário completo na página /pricing." },
      { q: "Posso pedir desenvolvimento à medida?", a: "Sim. Formato específico, cálculo atípico, integração dedicada: desenvolvimento em 1 a 3 semanas consoante a complexidade. Orçamento gratuito." },
      { q: "Qual é o tempo de resposta do suporte?", a: "Resposta média em menos de 6 horas nos dias úteis, máximo 24 horas. E-mail contact@tevaxia.lu. Sem chatbot, sem tickets numerados: fala com uma pessoa que conhece o produto." },
      { q: "Os dados estão alojados na UE?", a: "Sim. Supabase (AWS eu-central-1, Frankfurt) com Row Level Security por utilizador, HTTPS, conforme RGPD. Exportação completa dos dados em ZIP a qualquer momento." },
      { q: "Como migrar a partir de outra ferramenta?", a: "Importação CSV ou Excel consoante o tipo de dados. Mapeamento automático das colunas com pré-visualização. Acompanhamento na migração gratuito." },
      { q: "Com que frequência são publicadas as atualizações?", a: "Releases em média a cada 2 semanas. Backlog público em github.com/Tevaxia. Atualizações automáticas: nada a instalar." },
      { q: "A tevaxia é multilingue?", a: "Sim, 5 línguas: francês, inglês, alemão, português e luxemburguês. As landings de persona estão atualmente completamente em FR e EN, com DE/LB/PT em tradução." },
      { q: "A tevaxia pode ser utilizada fora do Luxemburgo?", a: "A plataforma está principalmente calibrada para o enquadramento legal luxemburguês (IVA 3 %, Bëllegen Akt, regra dos 5 %, TEGOVA). Alguns módulos funcionam também para França e Bélgica (Factur-X, DCF, comparador comprar/arrendar)." },
    ],
  },
  orientation: {
    title: "Não tem a certeza de qual é o perfil adequado?",
    desc: "Escreva-nos a sua atividade em 2 linhas, orientamo-lo em menos de 24 horas para a solução mais adequada.",
    ctaContact: "Enviar e-mail a contact@tevaxia.lu",
    ctaHome: "Voltar à página inicial",
  },
};

// Escrever agora em pt.json
const file = "src/messages/pt.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));
data.solutions = SOLUTIONS;
data.solutionsHub = SOLUTIONS_HUB;
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("PT translation applied successfully");
