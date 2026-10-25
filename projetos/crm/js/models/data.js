/* =========================================================
   Rubra CRM, Model
   Fonte única de dados mockados. Nenhum acesso ao DOM aqui.
   Exportado em window.CRM.Data para as Views consumirem.
   ========================================================= */

(function (global) {
  'use strict';

  const Data = {
    company: {
      name: 'Rubra CRM',
      plan: 'Plano Business'
    },

    user: {
      initials: 'MR',
      name: 'Mariana Rocha',
      role: 'Gerente comercial'
    },

    nav: {
      main: [
        { icon: 'dashboard', label: 'Painel',           href: '#', active: true },
        { icon: 'users',     label: 'Contatos',         href: '#', badge: '1.284' },
        { icon: 'building',  label: 'Empresas',         href: '#' },
        { icon: 'briefcase', label: 'Negócios',         href: '#', badge: '37' },
        { icon: 'check',     label: 'Tarefas',          href: '#', badge: '12' },
        { icon: 'mail',      label: 'Caixa de entrada', href: '#' }
      ],
      marketing: [
        { icon: 'megaphone', label: 'Campanhas',  href: '#' },
        { icon: 'chart',     label: 'Relatórios', href: '#' },
        { icon: 'plus',      label: 'Automação',  href: '#' }
      ],
      system: [
        { icon: 'gear', label: 'Configurações', href: '#' },
        { icon: 'help', label: 'Ajuda',         href: '#' }
      ]
    },

    kpis: [
      {
        icon: 'money',
        label: 'Receita do mês',
        value: 'R$ 428.760',
        deltaValue: '▲ 12,4%',
        deltaKind: 'up',
        deltaLabel: 'vs. mês anterior',
        spark: '0,32 12,28 24,30 36,22 48,24 60,16 72,18 84,10 100,6'
      },
      {
        icon: 'user',
        label: 'Novos leads',
        value: '184',
        deltaValue: '▲ 8,1%',
        deltaKind: 'up',
        deltaLabel: 'vs. mês anterior',
        spark: '0,26 12,24 24,28 36,20 48,22 60,18 72,20 84,14 100,10'
      },
      {
        icon: 'check',
        label: 'Negócios ganhos',
        value: '37',
        deltaValue: '▲ 4,7%',
        deltaKind: 'up',
        deltaLabel: 'vs. mês anterior',
        spark: '0,30 12,26 24,28 36,24 48,20 60,22 72,16 84,14 100,12'
      },
      {
        icon: 'trend',
        label: 'Taxa de conversão',
        value: '24,6%',
        deltaValue: '▼ 1,2%',
        deltaKind: 'down',
        deltaLabel: 'vs. mês anterior',
        spark: '0,10 12,14 24,12 36,16 48,14 60,22 72,20 84,26 100,24'
      }
    ],

    pipeline: {
      subtitle: 'Trimestre atual · 5 etapas · R$ 1,42M em aberto',
      stages: [
        { label: 'Prospecção',   value: 'R$ 512K', count: '48 negócios', width: 100 },
        { label: 'Qualificação', value: 'R$ 384K', count: '31 negócios', width: 75  },
        { label: 'Proposta',     value: 'R$ 268K', count: '19 negócios', width: 52  },
        { label: 'Negociação',   value: 'R$ 172K', count: '11 negócios', width: 34  },
        { label: 'Fechamento',   value: 'R$ 84K',  count: '6 negócios',  width: 18  }
      ],
      chart: {
        revenue: '0,150 50,130 100,140 150,110 200,120 250,95 300,100 350,75 400,85 450,60 500,70 550,45 600,55',
        target:  '0,120 50,118 100,115 150,110 200,105 250,102 300,98 350,92 400,88 450,82 500,78 550,72 600,68'
      }
    },

    deals: [
      { logo: 'NL', color: '#DC2626', name: 'Nordeste Log',       owner: 'Beatriz Andrade · CTO',           stage: 'Negociação',   stageKind: 'warn',    value: 'R$ 128.400', probability: 72, closeDate: '28 ago 2026' },
      { logo: 'GV', color: '#1E293B', name: 'Grupo Vertex',       owner: 'Rafael Menezes · Diretor',        stage: 'Proposta',     stageKind: 'info',    value: 'R$ 86.750',  probability: 54, closeDate: '05 set 2026' },
      { logo: 'AN', color: '#D97706', name: 'Ateliê Norte',       owner: 'Carolina Vieira · Sócia',         stage: 'Qualificação', stageKind: 'neutral', value: 'R$ 42.900',  probability: 32, closeDate: '17 set 2026' },
      { logo: 'SE', color: '#16A34A', name: 'Solaris Energia',    owner: 'Diego Ramos · Head de Ops',       stage: 'Fechamento',   stageKind: 'good',    value: 'R$ 214.300', probability: 91, closeDate: '22 ago 2026' },
      { logo: 'IA', color: '#7C3AED', name: 'Instituto Aurora',   owner: 'Fernanda Lopes · Coordenadora',   stage: 'Prospecção',   stageKind: 'neutral', value: 'R$ 18.600',  probability: 18, closeDate: '03 out 2026' },
      { logo: 'MC', color: '#0891B2', name: 'MedCare Clínicas',   owner: 'Paulo Furtado · Diretor Médico',  stage: 'Proposta',     stageKind: 'info',    value: 'R$ 74.150',  probability: 48, closeDate: '11 set 2026' },
      { logo: 'CT', color: '#B91C1C', name: 'Cerâmica Terra',     owner: 'Lívia Sampaio · Compras',         stage: 'Perdido',      stageKind: 'bad',     value: 'R$ 32.000',  probability: 0,  closeDate: '12 ago 2026', lost: true }
    ],

    tasks: [
      { title: 'Ligar para Beatriz Andrade, Nordeste Log',        kind: 'Chamada', due: 'Atrasada · 1d',  dueKind: 'overdue', done: false },
      { title: 'Enviar proposta revisada, Grupo Vertex',           kind: 'E-mail',  due: 'Hoje · 14h30',   dueKind: 'today',   done: false },
      { title: 'Reunião de descoberta com Ateliê Norte',            kind: 'Reunião', due: 'Hoje · 16h00',   dueKind: 'today',   done: false },
      { title: 'Preparar apresentação para Solaris Energia',        kind: 'Interno', due: 'Concluída',      dueKind: '',        done: true  },
      { title: 'Follow-up com Instituto Aurora',                    kind: 'E-mail',  due: 'Amanhã · 09h00', dueKind: '',        done: false }
    ],

    activities: [
      { kind: 'deal',  html: '<strong>Solaris Energia</strong> avançou para Fechamento.',                  time: 'há 12 min · por Mariana Rocha' },
      { kind: 'email', html: 'E-mail enviado para <strong>Rafael Menezes</strong>, proposta revisada.',   time: 'há 1h · por Lucas Barreto' },
      { kind: 'call',  html: 'Ligação registrada com <strong>Beatriz Andrade</strong> · 24 min',           time: 'há 2h · por Camila Duarte' },
      { kind: 'note',  html: 'Nota adicionada em <strong>Ateliê Norte</strong>: cliente prefere reunião presencial.', time: 'há 4h · por Mariana Rocha' },
      { kind: 'deal',  html: 'Novo negócio criado: <strong>MedCare Clínicas</strong>, R$ 74.150.',        time: 'há 6h · por Diego Ramos' },
      { kind: 'email', html: '<strong>Fernanda Lopes</strong> respondeu ao primeiro contato.',             time: 'ontem, 18h42' }
    ]
  };

  global.CRM = global.CRM || {};
  global.CRM.Data = Data;
})(window);
