/* ============================================================
   CONTEÚDO DO SITE: edite só este arquivo para trocar textos, links e mídia.
   Campos entre colchetes [ ] são exemplos para você substituir.
   Deixe um link vazio ('') para ele não aparecer.
   ============================================================ */

const PERFIL = {
  nome: 'Murilo Augusto Destefani',
  apelido: 'Murilo',            // opcional: como você quer ser chamado na saudação (ex.: só o primeiro nome)
  cargo: 'Analista de Dados e BI',
  curriculo: 'assets/curriculo.pdf',   // PDF do currículo; deixe '' para esconder o botão
  sigla: 'MD',                  // iniciais no logo do topo
  titulo: 'Murilo Destefani',   // título grande da página inicial
  headline: 'Data Analyst | Business Intelligence | Power BI | SQL\nAutomações | Desenvolvimento de aplicações',   // \n = quebra de linha
  resumo: 'Sou profissional de Dados e Business Intelligence, formado em Engenharia Agronômica pela UNESP, com experiência no desenvolvimento de soluções tecnológicas voltadas à análise de dados, gestão e otimização de processos. Atuo no desenvolvimento de dashboards gerenciais, indicadores de desempenho (KPIs), estruturação e tratamento de dados, utilizando ferramentas como Power BI, DAX, Power Query, Claude Code, Excel e SQL.',
  local: '[Matão, SP]',
  links: { github: '', linkedin: 'https://www.linkedin.com/in/m-destefani', email: 'destefani-murilo@hotmail.com' }
};

const HABILIDADES = [
  { grupo: 'Dados e BI', itens: ['Power BI', 'Medidas DAX', 'Power Query', 'SQL', 'Modelagem de dados'] },
  { grupo: 'Automação', itens: ['Integração e automação de processos', 'Microsoft excel', 'Geração de relatórios', 'Claude Code'] },
  { grupo: 'Áreas de negócio', itens: ['Análise de dados', 'Indicadores', 'Orçamento e custos', 'Auditoria de processos e atendimento', 'Gestão'] }
];

/* Áreas de atuação: cartões ao lado da apresentação. icone: 'bi' | 'ia' | 'auto'. */
const AREAS = [
  { icone: 'bi', titulo: 'Business Intelligence', tags: ['Power BI', 'Medidas DAX', 'Power Query', 'Análise de dados'] },
  { icone: 'ia', titulo: 'Desenvolvimento', tags: ['Claude Code', 'SQL', 'Desenvolvimento de aplicações'] },
  { icone: 'auto', titulo: 'Automação de processos', tags: ['Excel', 'Claude Code', 'Relatórios automáticos', 'Integração de processos'] }
];

const EXPERIENCIA = [
  {
    cargo: 'Analista de Dados',
    empresa: 'Empresa do setor agrícola',
    periodo: 'Agosto 2025 – atual',
    pontos: [
      'Painéis de BI com indicadores operacionais.',
      'Aplicativos de gestão de ativos para celular e PC, com funcionamento offline e sincronização.',
      'Painel de auditoria de processos por unidade.',
      'Automação de rotinas semanais de relatórios, planilhas e e-mails.'
    ]
  },
  {
    cargo: 'Analista de Dados (estágio)',
    empresa: 'Prefeitura municipal',
    periodo: '2021',
    pontos: [
      'Coleta, estruturação e organização de dados e informações públicas da cidade.',
      'Atendimento ao público e elaboração de projetos.',
      'Auditoria de processos.'
    ]
  }
];

/* Mídia: caminhos relativos à pasta do site. */
const M = 'assets/midia/';
const PROJETOS = [
  {
    id: 'ativos-ti',
    titulo: 'Ativos de TI: app de celular e painel web',
    selos: ['App de celular', 'Painel web', 'Funciona offline'],
    descricao: 'Controle do ciclo de vida de notebooks, monitores e celulares. O app funciona sem internet, guarda os registros no aparelho e envia tudo ao painel quando a conexão volta.',
    pontos: [
      'Inventário com vida útil restante, garantia e custo por mês de uso.',
      'Registro de entrega, devolução e inspeção direto no celular.',
      'Fila offline: salva no aparelho e sincroniza quando há internet.',
      'Painel web com a atividade do app chegando em tempo real.'
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'SVG'],
    videos: [
      { rotulo: 'Celular + PC integrados', src: M + 'ativos-ti_video_integrado.webm', gif: M + 'ativos-ti_video_integrado.gif', poster: M + 'ativos-ti_integrado_05_painel_atualizado.png', proporcao: '16/9' },
      { rotulo: 'App no celular', src: M + 'ativos-ti_video_celular.webm', gif: M + 'ativos-ti_video_celular.gif', poster: M + 'ativos-ti_02_ativos.png', proporcao: '760/940' }
    ],
    prints: [
      [M + 'ativos-ti_integrado_02_offline.png', 'Celular offline com registros na fila'],
      [M + 'ativos-ti_integrado_05_painel_atualizado.png', 'Painel web recebendo os registros'],
      [M + 'ativos-ti_02_ativos.png', 'Lista de ativos no celular'],
      [M + 'ativos-ti_03_detalhe.png', 'Detalhe do ativo e ações'],
      [M + 'ativos-ti_05_reparos.png', 'Reparos em andamento'],
      [M + 'ativos-ti_06_custos.png', 'Custos no celular'],
      [M + 'ativos-ti_pc_01_painel.png', 'Painel web'],
      [M + 'ativos-ti_pc_03_movimentacoes.png', 'Movimentações com origem do registro']
    ],
    demo: 'demos/ativos-ti/index.html', demoRotulo: 'Abrir demo (celular + PC)', codigo: ''
  },
  {
    id: 'auditoria',
    titulo: 'Painel de auditoria de atendimento',
    selos: ['Painel para PC', 'Tela de monitoramento'],
    descricao: 'Quadro em semáforo que mostra, por unidade, se as rotinas de atendimento e os lançamentos estão em dia, em atenção ou críticos.',
    pontos: [
      'Verde, âmbar e vermelho por indicador e por unidade.',
      'Seções que recolhem e mostram o resumo de críticos e atenção.',
      'Fonte e regra de cada indicador ao passar o mouse.',
      'Lista de tickets pendentes em painel lateral, sem sair da tela.'
    ],
    stack: ['HTML', 'CSS', 'JavaScript'],
    videos: [{ rotulo: 'Navegando pelo painel', src: M + 'auditoria-atendimento_video.webm', gif: M + 'auditoria-atendimento_video.gif', poster: M + 'auditoria-atendimento_01_painel.png', proporcao: '16/9' }],
    prints: [
      [M + 'auditoria-atendimento_01_painel.png', 'Visão geral por unidade'],
      [M + 'auditoria-atendimento_02_regra.png', 'Regra do indicador ao passar o mouse'],
      [M + 'auditoria-atendimento_03_secoes_recolhidas.png', 'Seções recolhidas com resumo'],
      [M + 'auditoria-atendimento_04_tickets.png', 'Tickets pendentes em painel lateral']
    ],
    demo: 'demos/auditoria/index.html', demoRotulo: 'Abrir demo', codigo: ''
  }
];

const PAINEIS = [
  {
    id: 'orcamento',
    titulo: 'Acompanhamento orçamentário',
    selos: ['Power BI (original)', 'Demo em HTML'],
    descricao: 'Comparação entre safras e acompanhamento da safra em andamento, com custo por hora e distribuição dos gastos. A demo é uma réplica web, com dados fictícios, de um painel feito em Power BI.',
    pontos: [
      'Orçado e realizado lado a lado em três safras.',
      'Status de desvio: bom, atenção, crítico e estouro.',
      'Análise detalhada por frota, com saldo e filtros.',
      'CRM: custo por hora, idade do equipamento e composição dos custos.'
    ],
    stack: ['Power BI', 'DAX', 'Modelagem de dados'],
    videos: [{ rotulo: 'Navegando pelo painel', src: M + 'bi-orcamento_video.webm', gif: M + 'bi-orcamento_video.gif', poster: M + 'bi-orcamento_03_safra.png', proporcao: '16/9' }],
    prints: [
      [M + 'bi-orcamento_01_capa.png', 'Capa com navegação'],
      [M + 'bi-orcamento_02_compara-safras.png', 'Comparação entre safras'],
      [M + 'bi-orcamento_03_safra.png', 'Safra em andamento'],
      [M + 'bi-orcamento_04_analise-detalhada.png', 'Análise detalhada por frota'],
      [M + 'bi-orcamento_05_custos-crm.png', 'Custos e CRM']
    ],
    demo: 'demos/orcamento/index.html', demoRotulo: 'Abrir demo interativa', codigo: ''
  },
  {
    id: 'os',
    titulo: 'Ordens de serviço e performance',
    selos: ['Power BI (original)', 'Demo em HTML'],
    descricao: 'Fila de ordens abertas e indicadores de disponibilidade, MTBF e MTTR, com comparação com o ano anterior. A demo é uma réplica web, com dados fictícios, de um painel feito em Power BI.',
    pontos: [
      'Ordens abertas por unidade e safra, com tempo e valor.',
      'Disponibilidade, MTBF e MTTR com variação sobre o ano anterior.',
      'Filtro cruzado entre tabela, barras, rosca e dispersão.',
      'Escala de cores para destacar o que merece atenção.'
    ],
    stack: ['Power BI', 'DAX', 'SQL'],
    videos: [{ rotulo: 'Navegando pelo painel', src: M + 'bi-os_video.webm', gif: M + 'bi-os_video.gif', poster: M + 'bi-os_03_performance.png', proporcao: '16/9' }],
    prints: [
      [M + 'bi-os_01_capa.png', 'Capa com navegação'],
      [M + 'bi-os_02_ordens-abertas.png', 'Ordens abertas'],
      [M + 'bi-os_03_performance.png', 'Performance de manutenção']
    ],
    demo: 'demos/os/index.html', demoRotulo: 'Abrir demo interativa', codigo: ''
  }
];

const AUTOMACOES = [
  {
    titulo: 'Relatórios e e-mails semanais',
    descricao: 'Rotina que lê as bases, gera os PDFs de cada unidade, monta o resumo da semana e deixa os e-mails prontos para revisão, sem enviar sozinha.',
    fluxo: [['Bases e planilhas', 'Leitura somente leitura'], ['Python', 'Regras e geração de PDFs'], ['Rascunhos prontos', 'E-mails com anexos para revisar']],
    stack: ['Python', 'PDF', 'Outlook']
  },
  {
    titulo: 'Relatório de horas por oficina',
    descricao: 'Transforma a planilha de apontamentos em um relatório com gráfico filtrável por empresa e funcionário, em arquivo protegido contra alterações.',
    fluxo: [['Planilha de apontamentos', 'Dados do mês'], ['Excel + VBA', 'Tabela e gráfico dinâmicos'], ['Relatório protegido', 'Só o filtro fica editável']],
    stack: ['Excel', 'VBA', 'Tabela dinâmica']
  },
  {
    titulo: 'Atualização automática de painéis',
    descricao: 'Script agendado que consulta o banco, calcula os indicadores e grava o arquivo que alimenta o painel web, sem intervenção manual.',
    fluxo: [['Banco de dados', 'Consultas só de leitura'], ['Script agendado', 'Cálculo dos indicadores'], ['Painel web', 'Dados sempre atualizados']],
    stack: ['SQL', 'Python', 'JavaScript']
  }
];
