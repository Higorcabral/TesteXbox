/* =================================================================
   HIFERA MÓDULOS · Admin · Controller · Clientes & Leads
   -----------------------------------------------------------------
   Junta os dois lados do relacionamento numa tela só: quem já paga
   (carteira, derivada dos lançamentos dos projetos) e quem ainda é
   oportunidade (funil, vindo do LeadsModel).

   A carteira não tem cadastro próprio de propósito. Cliente aqui é
   consequência de ter projeto lançado — manter uma segunda lista, à
   mão, garantiria que as duas divergissem no primeiro mês corrido.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ClientesController = (function () {
  'use strict';

  var P   = HiferaAdmin.ProjectsModel;
  var Fmt = HiferaAdmin.Fmt;

  /* Filtro do funil. Vive aqui, não no DOM: o valor precisa sobreviver
     ao innerHTML que redesenha a própria barra de filtros. */
  var filtro = 'todos';

  function el(id) { return document.getElementById(id); }

  /* Opcional: se a tela for aberta sem o modelo carregado, o bloco
     correspondente diz isso em vez de quebrar a página inteira. */
  function leads() { return HiferaAdmin.LeadsModel || null; }

  function cartao(rot, val, nota, tom) {
    return '<div class="kpi kpi--' + tom + '">' +
             '<span class="kpi-label">' + Fmt.esc(rot) + '</span>' +
             '<strong class="kpi-valor">' + Fmt.esc(String(val)) + '</strong>' +
             '<span class="kpi-nota">' + Fmt.esc(nota) + '</span>' +
           '</div>';
  }

  /* --- Cartões do topo -------------------------------------------- */
  function pintarKpis(ano, carteira) {
    var L = leads();
    var r = L ? L.resumoGeral() : null;

    var comReceita = carteira.filter(function (c) { return c.recebido > 0; });
    var receita = carteira.reduce(function (s, c) { return s + c.recebido; }, 0);
    var aReceber = carteira.reduce(function (s, c) { return s + c.aReceber; }, 0);
    var alertas = carteira.reduce(function (s, c) { return s + c.alertas; }, 0);

    /* Ticket médio sobre quem realmente faturou no ano. Dividir pela
       carteira inteira, incluindo cliente sem lançamento no período,
       produz um número menor que nunca correspondeu a contrato nenhum. */
    var ticket = comReceita.length ? receita / comReceita.length : 0;

    /* Concentração: quanto do faturamento vem do maior cliente. É o
       número que diz se perder um contrato derruba o ano.

       O maior é calculado aqui, não lido de carteira[0]: o
       ProjectsModel ordena por recebido + aReceber, e concentração
       olha só recebido. Quem tem contrato grande ainda a receber
       encabeça a lista sem ser o maior faturamento do ano. */
    var maior = carteira.reduce(function (a, c) {
      return (!a || c.recebido > a.recebido) ? c : a;
    }, null);
    var concentracao = receita && maior ? maior.recebido / receita : 0;

    var cartoes =
      cartao('Clientes na carteira', carteira.length,
             comReceita.length + ' com receita em ' + ano, 'cyan') +
      cartao('Receita no ano', Fmt.moeda(receita),
             aReceber ? Fmt.moeda(aReceber) + ' ainda a receber' : 'nada em aberto', 'green') +
      cartao('Ticket médio', comReceita.length ? Fmt.moeda(ticket) : '—',
             comReceita.length ? 'entre os ' + comReceita.length + ' que faturaram'
                               : 'nenhum lançamento no período', 'indigo') +
      cartao('Concentração', receita ? Fmt.pct(concentracao * 100) : '—',
             receita && maior ? 'do faturamento vem de ' + maior.cliente : 'sem receita no período',
             concentracao > 0.5 ? 'amber' : 'cyan') +
      cartao('Alertas na carteira', alertas,
             alertas ? 'parcela vencida ou entrega atrasada' : 'nada pendente',
             alertas ? 'red' : 'green');

    if (r) {
      var decididos = (r.ganho || 0) + (r.perdido || 0);
      cartoes += cartao('Leads em aberto', r.abertos || 0,
                        decididos ? Fmt.pct(((r.ganho || 0) / decididos) * 100) + ' de conversão até aqui'
                                  : 'nenhum lead decidido ainda', 'amber');
    }

    el('kpisRel').innerHTML = cartoes;
  }

  /* --- Carteira ---------------------------------------------------- */
  function pintarCarteira(carteira) {
    var tab = el('tabelaCarteira');
    if (!tab) return;

    if (!carteira.length) {
      tab.innerHTML = '<tbody><tr><td class="vazio">Nenhum cliente com projeto lançado.</td></tr></tbody>';
      return;
    }

    var total = carteira.reduce(function (s, c) { return s + c.recebido; }, 0);

    tab.innerHTML =
      '<thead><tr><th>Cliente</th><th>Projetos</th><th>Recebido</th>' +
      '<th>A receber</th><th>Peso</th><th>Situação</th></tr></thead>' +
      '<tbody>' + carteira.map(function (c) {
        var peso = total ? c.recebido / total : 0;
        return '<tr>' +
          '<td>' + Fmt.esc(c.cliente) + '</td>' +
          '<td class="num">' + c.projetos + '</td>' +
          '<td class="num">' + Fmt.moeda(c.recebido) + '</td>' +
          '<td class="num">' + (c.aReceber ? Fmt.moeda(c.aReceber) : '—') + '</td>' +
          '<td class="num">' + (total ? Fmt.pct(peso * 100) : '—') + '</td>' +
          '<td>' + (c.alertas
            ? '<span class="pill pill--red">' + c.alertas +
              (c.alertas === 1 ? ' alerta' : ' alertas') + '</span>'
            : '<span class="pill pill--green">em dia</span>') + '</td>' +
        '</tr>';
      }).join('') + '</tbody>';
  }

  /* --- Funil de leads ---------------------------------------------- */
  function pintarFiltro(L) {
    var alvo = el('filtroLead');
    if (!alvo) return;

    var r = L.resumoGeral();
    var opcoes = [{ id: 'todos', label: 'Todos', cor: 'cinza', n: r.total || 0 }];

    Object.keys(L.STATUS).forEach(function (k) {
      opcoes.push({ id: k, label: L.STATUS[k].label, cor: L.STATUS[k].cor, n: r[k] || 0 });
    });

    alvo.innerHTML = opcoes.map(function (o) {
      return '<button type="button" class="ch-legend-item' +
             (o.id === filtro ? ' is-on' : '') + '" data-lead-filtro="' + o.id + '"' +
             (o.id === filtro ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
             '<span class="pill pill--' + o.cor + '">' + o.n + '</span> ' +
             Fmt.esc(o.label) + '</button>';
    }).join('');
  }

  function pintarLeads(L) {
    var alvo = el('listaLeads');
    if (!alvo) return;

    var lista = L.todos(filtro);
    if (!lista.length) {
      alvo.innerHTML = '<li class="vazio">' +
        (filtro === 'todos' ? 'Nenhum lead captado ainda.'
                            : 'Nenhum lead com esse status.') + '</li>';
      return;
    }

    alvo.innerHTML = lista.map(function (x) {
      var st = L.STATUS[x.status] || { label: x.status, cor: 'cinza' };
      return '<li>' +
        '<div class="li-txt">' +
          '<strong>' + Fmt.esc(x.nome) +
            (x.empresa ? ' <span class="li-sec">· ' + Fmt.esc(x.empresa) + '</span>' : '') +
          '</strong>' +
          /* Fmt.data espera YYYY-MM-DD e quebra o resto por '-'. O
             lead.quando é ISO com hora, então sem o slice(0,10) a tela
             mostrava "01T10:30:00.000Z/09/2026". */
          '<small>' + Fmt.esc(x.origem) + ' · ' +
            Fmt.esc(Fmt.data(String(x.quando).slice(0, 10))) +
            (x.email ? ' · ' + Fmt.esc(x.email) : '') + '</small>' +
          (x.nota ? '<small class="li-nota">' + Fmt.esc(x.nota) + '</small>' : '') +
        '</div>' +
        '<span class="pill pill--' + st.cor + '">' + Fmt.esc(st.label) + '</span>' +
      '</li>';
    }).join('');
  }

  function pintarFunil() {
    var L = leads();
    var lista = el('listaLeads');
    if (!L) {
      if (lista) lista.innerHTML = '<li class="vazio">Modelo de leads não carregado nesta tela.</li>';
      var f = el('filtroLead');
      if (f) f.innerHTML = '';
      return;
    }
    pintarFiltro(L);
    pintarLeads(L);
  }

  /* --- Eventos ------------------------------------------------------
     Delegado no container do filtro: a barra é redesenhada a cada
     troca, e listener preso ao botão morreria junto com ele. */
  function ligarEventos() {
    var alvo = el('filtroLead');
    if (!alvo) return;
    alvo.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lead-filtro]');
      if (!btn) return;
      filtro = btn.getAttribute('data-lead-filtro');
      pintarFunil();
    });
  }

  function pintar() {
    var ano = HiferaAdmin.Shell.ano();
    var carteira = P.carteiraClientes(ano);
    pintarKpis(ano, carteira);
    pintarCarteira(carteira);
    pintarFunil();
  }

  function init() {
    if (!HiferaAdmin.Shell.iniciar(pintar)) return;
    ligarEventos();
    pintar();
  }

  return { init: init, pintar: pintar };
})();
