/* =================================================================
   HIFERA PORTAL · Model · Leads
   -----------------------------------------------------------------
   Leads do negócio DO CLIENTE — os contatos que o sistema entregue
   pela Hifera capturou (formulário do site, agendamento online,
   WhatsApp, indicação). Não são leads comerciais da Hifera.

   Toda leitura é filtrada por cliente na origem: `porCliente()` é a
   única porta de entrada da lista, e ela nunca devolve nada de outra
   empresa. A view não decide o que esconder.

   Hoje só o portal usa. Se a tela "Clientes & Leads" do painel interno
   sair do papel, este arquivo sobe para /modulos/core/js/models/ —
   mesma regra do TicketsModel, que já fez esse caminho.

   Dados pessoais: são fictícios, e de propósito o cadastro guarda o
   mínimo (nome, e-mail, origem). Quando isto virar produto com gente
   real, LGPD entra na conversa antes de qualquer campo novo — base
   legal, retenção e o direito de apagar.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.LeadsModel = (function () {
  'use strict';

  var Store = HiferaAdmin.StoreModel;
  var CHAVE = 'hifera.portal.leads.v1';

  var STATUS = {
    novo:    { label: 'Novo',       cor: 'cyan',  ordem: 1, aberto: true },
    contato: { label: 'Em contato', cor: 'amber', ordem: 2, aberto: true },
    ganho:   { label: 'Ganho',      cor: 'green', ordem: 3, aberto: false },
    perdido: { label: 'Perdido',    cor: 'red',   ordem: 4, aberto: false }
  };

  var ORIGENS = [
    'Formulário do site',
    'Agendamento online',
    'WhatsApp',
    'Indicação',
    'Importação de planilha'
  ];

  /* Datas relativas a hoje: a tela nunca parece congelada em 2026. */
  function hAtras(h) { return new Date(Date.now() - h * 3600000).toISOString(); }
  function dAtras(d) { return hAtras(d * 24); }

  function l(cliente, nome, empresa, email, origem, status, horas, nota) {
    return {
      id: '', cliente: cliente, nome: nome, empresa: empresa, email: email,
      origem: origem, status: status, quando: hAtras(horas), nota: nota || ''
    };
  }

  var SEED = [
    /* --- Teste com Nome Fictício ------------------------------------ */
    l('Teste com Nome Fictício', 'Mariana Alves',    'Alves Transportes',   'mariana@alvestransportes.test', 'Formulário do site',  'novo',    2,  'Pediu proposta para 12 rotas.'),
    l('Teste com Nome Fictício', 'Rogério Baptista', 'RB Cargas',           'rogerio@rbcargas.test',         'WhatsApp',            'novo',    6,  ''),
    l('Teste com Nome Fictício', 'Transportes Vega', 'Transportes Vega',    'contato@transportesvega.test',  'Agendamento online',  'contato', 26, 'Reunião marcada para sexta.'),
    l('Teste com Nome Fictício', 'Simone Diniz',     'Diniz Distribuição',  'simone@dinizdist.test',         'Formulário do site',  'contato', 50, 'Aguardando o volume mensal para orçar.'),
    l('Teste com Nome Fictício', 'Carla Nunes',      'Nunes Logística',     'carla@nuneslog.test',           'Formulário do site',  'ganho',   72, 'Fechou o plano mensal.'),
    l('Teste com Nome Fictício', 'Eduardo Prado',    'EP Armazéns',         'eduardo@eparmazens.test',       'Indicação',           'ganho',   140,''),
    l('Teste com Nome Fictício', 'Hélio Marques',    'Marques & Cia',       'helio@marquescia.test',         'WhatsApp',            'perdido', 190,'Escolheu concorrente por prazo.'),
    l('Teste com Nome Fictício', 'Bianca Rezende',   'Rezende Express',     'bianca@rezendeexpress.test',    'Agendamento online',  'novo',    12, ''),

    /* --- Distribuidora Vega ----------------------------------------- */
    l('Distribuidora Vega', 'Otávio Lins',    'Lins Mercados',    'otavio@linsmercados.test',   'Formulário do site', 'novo',    5,  ''),
    l('Distribuidora Vega', 'Renata Salles',  'Salles Atacado',   'renata@sallesatacado.test',  'Indicação',          'contato', 30, 'Pediu tabela de preço por volume.'),
    l('Distribuidora Vega', 'Grupo Andrade',  'Grupo Andrade',    'compras@grupoandrade.test',  'Formulário do site', 'ganho',   96, ''),

    /* --- Oficina RotaSul -------------------------------------------- */
    l('Oficina RotaSul', 'Fábio Correia',  '',              'fabio.correia@exemplo.test',  'Agendamento online', 'novo',    3,  'Revisão dos 40 mil km.'),
    l('Oficina RotaSul', 'Tatiana Moura',  '',              'tatiana.moura@exemplo.test',  'WhatsApp',           'contato', 20, ''),
    l('Oficina RotaSul', 'Frota Sul Ltda', 'Frota Sul',     'manutencao@frotasul.test',    'Indicação',          'ganho',   120,'Contrato de manutenção de 8 veículos.'),

    /* --- Studio Lune ------------------------------------------------- */
    l('Studio Lune', 'Priscila Amaral', '', 'priscila.amaral@exemplo.test', 'Agendamento online', 'novo',    4,  ''),
    l('Studio Lune', 'Juliana Petri',   '', 'juliana.petri@exemplo.test',   'Formulário do site', 'contato', 28, 'Quer pacote noiva.'),
    l('Studio Lune', 'Aline Bastos',    '', 'aline.bastos@exemplo.test',    'Agendamento online', 'ganho',   60, ''),

    /* --- Atacado Norte ------------------------------------------------ */
    l('Atacado Norte', 'Mercado Boa Vista', 'Mercado Boa Vista', 'compras@boavista.test', 'Formulário do site', 'novo', 9, '')
  ];

  function novoId() {
    return 'ld-' + Math.random().toString(36).slice(2, 9);
  }

  function normalizar(x) {
    x = x || {};
    return {
      id:      x.id || novoId(),
      cliente: String(x.cliente || ''),
      nome:    String(x.nome || '').trim() || 'Sem nome',
      empresa: String(x.empresa || '').trim(),
      email:   String(x.email || '').trim(),
      origem:  ORIGENS.indexOf(x.origem) >= 0 ? x.origem : ORIGENS[0],
      status:  STATUS[x.status] ? x.status : 'novo',
      quando:  x.quando || new Date().toISOString(),
      nota:    String(x.nota || '').trim()
    };
  }

  var cache = null;

  function carregar() {
    if (cache) return cache;
    var bruto = Store.ler(CHAVE, null);
    var lista = Array.isArray(bruto) && bruto.length ? bruto : SEED;
    cache = lista.map(normalizar);
    return cache;
  }

  function persistir() { Store.gravar(CHAVE, cache); }

  /* --- Leitura, sempre com escopo -----------------------------------
     Não existe getAll() público de propósito: quem chamar tem que
     dizer de qual cliente está falando.                              */
  function porCliente(cliente, filtro) {
    if (!cliente) return [];
    filtro = filtro || {};
    var termo = String(filtro.busca || '').trim().toLowerCase();

    return carregar()
      .filter(function (x) { return x.cliente === cliente; })
      .filter(function (x) {
        if (filtro.status && filtro.status !== 'todos' && x.status !== filtro.status) return false;
        if (filtro.origem && filtro.origem !== 'todas' && x.origem !== filtro.origem) return false;
        if (!termo) return true;
        return (x.nome + ' ' + x.empresa + ' ' + x.email).toLowerCase().indexOf(termo) >= 0;
      })
      .sort(function (a, b) { return a.quando < b.quando ? 1 : -1; });
  }

  function resumo(cliente) {
    var r = { total: 0, novo: 0, contato: 0, ganho: 0, perdido: 0, abertos: 0, ganhosNoMes: 0 };
    if (!cliente) return r;
    var corte = new Date();
    corte.setDate(corte.getDate() - 30);
    var corteISO = corte.toISOString();

    carregar().forEach(function (x) {
      if (x.cliente !== cliente) return;
      r.total++;
      r[x.status]++;
      if (STATUS[x.status].aberto) r.abertos++;
      if (x.status === 'ganho' && x.quando >= corteISO) r.ganhosNoMes++;
    });
    return r;
  }

  /* Um lead só muda de status dentro do próprio cliente. O confere
     abaixo é o que impede um id chutado de mexer em outra empresa. */
  function mudarStatus(cliente, id, status) {
    if (!STATUS[status]) return null;
    carregar();
    var lead = cache.filter(function (x) { return x.id === id && x.cliente === cliente; })[0];
    if (!lead) return null;
    lead.status = status;
    persistir();
    return lead;
  }

  function anotar(cliente, id, texto) {
    carregar();
    var lead = cache.filter(function (x) { return x.id === id && x.cliente === cliente; })[0];
    if (!lead) return null;
    lead.nota = String(texto || '').trim();
    persistir();
    return lead;
  }

  function exportarCSV(cliente) {
    var linhas = porCliente(cliente);
    var cabecalho = ['Nome', 'Empresa', 'E-mail', 'Origem', 'Status', 'Recebido em', 'Observação'];
    var escapa = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };

    return [cabecalho.map(escapa).join(';')].concat(
      linhas.map(function (x) {
        return [
          x.nome, x.empresa, x.email, x.origem,
          STATUS[x.status].label, x.quando.slice(0, 10), x.nota
        ].map(escapa).join(';');
      })
    ).join('\r\n');
  }

  return {
    STATUS: STATUS,
    ORIGENS: ORIGENS,
    porCliente: porCliente,
    resumo: resumo,
    mudarStatus: mudarStatus,
    anotar: anotar,
    exportarCSV: exportarCSV
  };
})();
