/* =================================================================
   SeedModel — popula localStorage com as 8 soluções iniciais na 1ª visita.
   Não roda se já existe seed flag (gestor pode editar/criar sem voltar).
   ================================================================= */
(function (global) {
  'use strict';

  var ICON_BASE = '../../public/img/icons/';

  var INITIAL = [
    {
      id: 'sol-agenda',
      title: 'Agenda Online',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-agenda.svg',
      icon: 'calendar',
      shortDescription: 'Sistema completo de agendamentos com lembretes automáticos, bloqueio de horários, múltiplos profissionais e área do cliente.',
      longDescription: 'Sistema completo de agendamentos com lembretes automáticos, bloqueio de horários, múltiplos profissionais e área do cliente. Substitui planilhas e cadernos por uma agenda profissional acessível de qualquer lugar — com confirmações automáticas, histórico de atendimentos e integração com WhatsApp.',
      features: ['lembretes automáticos', 'multi-profissionais', 'integração WhatsApp', 'área do cliente'],
      specs: {
        'Implantação': '3 a 5 dias úteis',
        'Treinamento': 'Incluso (2h online)',
        'Suporte': '30 dias gratuito',
        'Hospedagem': 'Inclusa no primeiro ano'
      },
      price: 'Sob consulta',
      status: 'available'
    },
    {
      id: 'sol-financeiro',
      title: 'Controle Financeiro',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-financeiro.svg',
      icon: 'dollar',
      shortDescription: 'Gestão de entradas, saídas, categorias, contas a pagar/receber e fluxo de caixa visual.',
      longDescription: 'Gestão de entradas, saídas, categorias, contas a pagar/receber e fluxo de caixa visual. Relatórios mensais, comparativos e DRE simplificado para quem quer enxergar o caixa sem precisar de contador para entender. Multi-conta e multi-categoria.',
      features: ['fluxo de caixa', 'contas a pagar/receber', 'relatórios mensais', 'multi-conta'],
      specs: {
        'Implantação': '5 dias úteis',
        'Treinamento': 'Incluso (3h online)',
        'Suporte': '30 dias gratuito',
        'Exportação': 'PDF, Excel, CSV'
      },
      price: 'Sob consulta',
      status: 'available'
    },
    {
      id: 'sol-dashboards',
      title: 'Dashboards',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-dashboards.svg',
      icon: 'chart',
      shortDescription: 'Painéis visuais com indicadores de negócio atualizados em tempo real. KPIs financeiros, operacionais e comerciais.',
      longDescription: 'Painéis visuais com indicadores de negócio atualizados em tempo real. KPIs financeiros, operacionais e comerciais em uma única tela. Conecta com planilhas, ERPs e bancos de dados existentes. Compartilhável via link público ou restrito por permissões.',
      features: ['tempo real', 'KPIs customizáveis', 'multi-fonte', 'exportação PDF'],
      specs: {
        'Implantação': '7 dias úteis',
        'Fontes': 'Planilhas, ERPs, BD',
        'Suporte': '60 dias gratuito',
        'Atualização': 'Automática'
      },
      price: 'Sob consulta',
      status: 'available'
    },
    {
      id: 'sol-veiculos',
      title: 'Cadastro de Veículos',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-veiculos.svg',
      icon: 'truck',
      shortDescription: 'Gestão de frota com cadastro de veículos, motoristas, manutenções, abastecimentos, multas e documentos.',
      longDescription: 'Gestão de frota com cadastro de veículos, motoristas, manutenções programadas, abastecimentos, multas e documentos. Alertas automáticos para vencimentos (CNH, IPVA, licenciamento). Indicado para frotas de qualquer porte, de 2 a 500 veículos.',
      features: ['alertas de vencimento', 'histórico completo', 'custos por veículo', 'documentos digitalizados'],
      specs: {
        'Implantação': '5 dias úteis',
        'Capacidade': 'Frota ilimitada',
        'Suporte': '30 dias gratuito',
        'App mobile': 'Em breve'
      },
      price: 'Sob consulta',
      status: 'available'
    },
    {
      id: 'sol-estoque',
      title: 'Controle de Estoque',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-estoque.svg',
      icon: 'package',
      shortDescription: 'Entradas, saídas, transferências, inventário, código de barras e alertas de estoque mínimo.',
      longDescription: 'Entradas, saídas, transferências, inventário, código de barras e alertas de estoque mínimo. Relatórios de giro, curva ABC e movimentações. Ideal para comércio, distribuição e pequenas indústrias. Multi-armazém e multi-empresa.',
      features: ['código de barras', 'alertas de mínimo', 'curva ABC', 'inventário rápido'],
      specs: {
        'Implantação': '7 dias úteis',
        'Itens': 'Ilimitados',
        'Armazéns': 'Multi-armazém',
        'Integração': 'API REST disponível'
      },
      price: 'Sob consulta',
      status: 'available'
    },
    {
      id: 'sol-crm',
      title: 'CRM',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-crm.svg',
      icon: 'users',
      shortDescription: 'Pipeline de vendas visual com kanban, gestão de contatos, histórico de interações e follow-ups automáticos.',
      longDescription: 'Pipeline de vendas visual com kanban, gestão de contatos, histórico de interações, follow-ups automáticos e relatórios comerciais. Centraliza vendedores, leads e oportunidades num só lugar. Integração com email e WhatsApp.',
      features: ['pipeline kanban', 'follow-ups automáticos', 'histórico de contatos', 'relatórios de venda'],
      specs: {
        'Implantação': '5 dias úteis',
        'Usuários': 'Multi-vendedor',
        'Integração': 'Email + WhatsApp',
        'Suporte': '60 dias gratuito'
      },
      price: 'Sob consulta',
      status: 'available'
    },
    {
      id: 'sol-catalogo',
      title: 'Catálogo Digital',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-catalogo.svg',
      icon: 'book',
      shortDescription: 'Vitrine online com produtos, fotos, preços e categorias, com pedido direto via WhatsApp.',
      longDescription: 'Vitrine online com produtos, fotos, preços e categorias, com pedido direto via WhatsApp. Link compartilhável, layout responsivo e fácil atualização. Substitui o catálogo PDF e fideliza o cliente. Domínio próprio opcional.',
      features: ['pedido via WhatsApp', 'link compartilhável', 'responsivo', 'atualização rápida'],
      specs: {
        'Implantação': '3 dias úteis',
        'Produtos': 'Ilimitados',
        'Domínio': 'Próprio opcional',
        'Suporte': '30 dias gratuito'
      },
      price: 'Sob consulta',
      status: 'available'
    },
    {
      id: 'sol-automacoes',
      title: 'Automações Simples',
      category: 'PRONTA',
      image: ICON_BASE + 'sol-automacoes.svg',
      icon: 'bolt',
      shortDescription: 'Pacotes de automação para tarefas recorrentes: disparo de mensagens, envio de relatórios e integração entre sistemas.',
      longDescription: 'Pacotes de automação para tarefas recorrentes: disparo de mensagens, envio de relatórios, integração entre sistemas, lembretes e workflows. Tudo configurado para rodar sozinho. Inclui monitoramento de execução e logs detalhados.',
      features: ['disparos automáticos', 'integrações', 'workflows', 'relatórios agendados'],
      specs: {
        'Implantação': '5 a 10 dias úteis',
        'Workflows': 'Por demanda',
        'Monitoramento': 'Painel de execução',
        'Suporte': '60 dias gratuito'
      },
      price: 'Sob consulta',
      status: 'available'
    }
  ];

  function ensureSeed() {
    if (!global.Api) {
      console.error('[Seed] Api não está carregado');
      return;
    }
    if (Api._internal.isSeeded()) return;
    Api._internal.seed(INITIAL);
    console.info('[Seed] catálogo inicial criado com', INITIAL.length, 'soluções');
  }

  global.Seed = { run: ensureSeed, INITIAL: INITIAL };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSeed);
  } else {
    ensureSeed();
  }
})(window);
