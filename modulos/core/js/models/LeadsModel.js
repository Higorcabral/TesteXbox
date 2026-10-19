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
/* Vive no core porque os DOIS apps precisam: o portal mostra os leads do
   cliente, o admin mostra o funil consolidado. Publica nos dois nomes de
   namespace para não quebrar quem já o chamava. */
window.HiferaAdmin  = window.HiferaAdmin  || {};
window.HiferaPortal = window.HiferaPortal || {};

HiferaAdmin.LeadsModel = HiferaPortal.LeadsModel = (function () {
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

  var SEED = [];

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
    var lista = Array.isArray(bruto) ? bruto : SEED;
    cache = lista.map(normalizar);
    return cache;
  }

  function persistir() { Store.gravar(CHAVE, cache); }

  /* --- Leitura, sempre com escopo -----------------------------------
     Não existe getAll() público de propósito: quem chamar tem que
     dizer de qual cliente está falando.                              */
  /* O portal sempre olha um cliente por vez; o admin precisa do todo.
     Sem isto, resumo() sem cliente devolve zeros e a tela de KPIs
     mostraria funil vazio como se não houvesse lead nenhum. */
  function todos(filtro) {
    var lista = carregar().slice();
    if (filtro && filtro !== 'todos') {
      lista = lista.filter(function (x) { return x.status === filtro; });
    }
    return lista.sort(function (a, b) { return b.quando.localeCompare(a.quando); });
  }

  function resumoGeral() {
    var r = { total: 0, novo: 0, contato: 0, ganho: 0, perdido: 0,
              abertos: 0, ganhosNoMes: 0, clientes: 0 };
    var vistos = {};
    var corte = new Date();
    corte.setDate(corte.getDate() - 30);
    var corteISO = corte.toISOString();

    carregar().forEach(function (x) {
      r.total++;
      if (r[x.status] != null) r[x.status]++;
      if (STATUS[x.status] && STATUS[x.status].aberto) r.abertos++;
      if (x.status === 'ganho' && x.quando >= corteISO) r.ganhosNoMes++;
      if (!vistos[x.cliente]) { vistos[x.cliente] = 1; r.clientes++; }
    });
    return r;
  }

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
    todos: todos,
    resumoGeral: resumoGeral,
    resumo: resumo,
    mudarStatus: mudarStatus,
    anotar: anotar,
    exportarCSV: exportarCSV
  };
})();
