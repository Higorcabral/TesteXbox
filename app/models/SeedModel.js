/* =================================================================
   SeedModel — popula localStorage com as 8 soluções iniciais na 1ª visita.
   Não roda se já existe seed flag (gestor pode editar/criar sem voltar).

   Fotos: Unsplash (CDN), otimizadas em 800×450 (formato ecommerce).
   Preços: valores de exemplo — editáveis pelo painel admin.
   ================================================================= */
(function (global) {
  'use strict';

  // Parametros comuns nas URLs do Unsplash — cache + crop + qualidade
  var IMG_Q = '?w=800&h=450&fit=crop&auto=format&q=80';

  var INITIAL = [
    {
      id: 'sol-agenda',
      title: 'Agenda Online',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe' + IMG_Q,
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
      price: 'R$ 297/mês',
      status: 'available'
    },
    {
      id: 'sol-financeiro',
      title: 'Controle Financeiro',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f' + IMG_Q,
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
      price: 'R$ 397/mês',
      status: 'available',
      /* Demo funcional integrado — CTA do card abre este link em nova aba */
      demoUrl: '../../apps/ledger/',
      demoLabel: 'Experimentar demo'
    },
    {
      id: 'sol-dashboards',
      title: 'Dashboards',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71' + IMG_Q,
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
      price: 'R$ 497/mês',
      status: 'available'
    },
    {
      id: 'sol-veiculos',
      title: 'Cadastro de Veículos',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d' + IMG_Q,
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
      price: 'R$ 397/mês',
      status: 'available'
    },
    {
      id: 'sol-estoque',
      title: 'Controle de Estoque',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d' + IMG_Q,
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
      price: 'R$ 447/mês',
      status: 'available'
    },
    {
      id: 'sol-crm',
      title: 'CRM',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978' + IMG_Q,
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
      price: 'R$ 497/mês',
      status: 'available'
    },
    {
      id: 'sol-catalogo',
      title: 'Catálogo Digital',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8' + IMG_Q,
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
      price: 'R$ 197/mês',
      status: 'available'
    },
    {
      id: 'sol-automacoes',
      title: 'Automações Simples',
      category: 'PRONTA',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176' + IMG_Q,
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
      price: 'R$ 297/mês',
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
