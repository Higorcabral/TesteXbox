/* =================================================================
   HIFERA MÓDULOS · Admin · Controller · Site oficial
   -----------------------------------------------------------------
   Duas perguntas numa tela: quem pediu contato (leads do formulário) e
   como as pessoas usam o site (comportamento anônimo). Os dados vêm do
   SiteAnalyticsModel — da Function /api no admin publicado, ou de uma
   amostra local quando ela ainda não existe.

   A carga é assíncrona (a fonte real é rede), então pintar() roda
   depois que o model resolve. Enquanto isso a tela mostra um aviso de
   carregando em vez de blocos vazios.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.SiteController = (function () {
  'use strict';

  var Fmt = HiferaAdmin.Fmt;
  var M = HiferaAdmin.SiteAnalyticsModel;

  /* Filtro do funil fora do DOM: sobrevive ao innerHTML da barra. */
  var filtro = 'todos';

  function el(id) { return document.getElementById(id); }

  function cartao(rot, val, nota, tom) {
    return '<div class="kpi kpi--' + tom + '">' +
             '<span class="kpi-label">' + Fmt.esc(rot) + '</span>' +
             '<strong class="kpi-valor">' + Fmt.esc(String(val)) + '</strong>' +
             '<span class="kpi-nota">' + Fmt.esc(nota) + '</span>' +
           '</div>';
  }

  /* ms -> "2min 05s" / "48s" */
  function duracao(ms) {
    var s = Math.round((Number(ms) || 0) / 1000);
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + 'min' + (r ? ' ' + (r < 10 ? '0' + r : r) + 's' : '');
  }

  /* --- KPIs de leads ---------------------------------------------- */
  function pintarKpisLeads() {
    var r = M.resumoLeads();
    el('kpisLeads').innerHTML =
      cartao('Leads no total', r.total, r.total ? 'desde o início' : 'nenhum ainda', 'cyan') +
      cartao('Em aberto', r.abertos, 'novos + em contato', 'amber') +
      cartao('Ganhos no mês', r.ganhosNoMes, 'últimos 30 dias', 'green') +
      cartao('Conversão', r.total ? Fmt.pct(r.conversao, 0) : '—',
             (r.ganho + r.perdido) ? 'entre os leads decididos' : 'nenhum decidido ainda',
             r.conversao >= 40 ? 'green' : 'indigo');
  }

  /* --- KPIs de comportamento -------------------------------------- */
  function pintarKpisEventos() {
    var r = M.resumoEventos();
    el('kpisEventos').innerHTML =
      cartao('Visitas', r.visitas, 'pageviews no período', 'cyan') +
      cartao('Visitantes', r.visitantes, 'sessões distintas', 'indigo') +
      cartao('Tempo médio', r.visitas ? duracao(r.tempoMedioMs) : '—', 'por página medida', 'amber') +
      cartao('Cliques em CTA', r.cliques, 'botões de contato e casos', 'green') +
      cartao('Rejeição', r.visitantes ? Fmt.pct(r.rejeicao, 0) : '—',
             'saíram na primeira página', r.rejeicao > 70 ? 'red' : 'cyan');
  }

  /* --- Funil (filtro + lista) ------------------------------------- */
  function pintarFiltro() {
    var alvo = el('filtroLeadSite');
    if (!alvo) return;
    var r = M.resumoLeads();
    var opcoes = [{ id: 'todos', label: 'Todos', cor: 'cinza', n: r.total || 0 }];
    Object.keys(M.STATUS).forEach(function (k) {
      opcoes.push({ id: k, label: M.STATUS[k].label, cor: M.STATUS[k].cor, n: r[k] || 0 });
    });
    alvo.innerHTML = opcoes.map(function (o) {
      return '<button type="button" class="ch-legend-item' +
             (o.id === filtro ? ' is-on' : '') + '" data-lead-filtro="' + o.id + '" ' +
             'aria-pressed="' + (o.id === filtro ? 'true' : 'false') + '">' +
             '<span class="pill pill--' + o.cor + '">' + o.n + '</span> ' +
             Fmt.esc(o.label) + '</button>';
    }).join('');
  }

  function opcoesStatus(atual) {
    return Object.keys(M.STATUS).map(function (k) {
      return '<option value="' + k + '"' + (k === atual ? ' selected' : '') + '>' +
             Fmt.esc(M.STATUS[k].label) + '</option>';
    }).join('');
  }

  function pintarLeads() {
    var alvo = el('listaLeadsSite');
    if (!alvo) return;
    var lista = M.leads(filtro);
    if (!lista.length) {
      alvo.innerHTML = '<li class="vazio">' +
        (filtro === 'todos' ? 'Nenhum lead captado pelo site ainda.'
                            : 'Nenhum lead com esse status.') + '</li>';
      return;
    }
    alvo.innerHTML = lista.map(function (x) {
      return '<li>' +
        '<div class="li-txt">' +
          '<strong>' + Fmt.esc(x.nome) +
            (x.empresa ? ' <span class="li-sec">· ' + Fmt.esc(x.empresa) + '</span>' : '') +
          '</strong>' +
          '<small>' + Fmt.esc(x.origem) + ' · ' +
            Fmt.esc(Fmt.data(String(x.criado_em).slice(0, 10))) +
            (x.contato ? ' · ' + Fmt.esc(x.contato) : '') + '</small>' +
          (x.objetivo ? '<small class="li-nota">Quer: ' + Fmt.esc(x.objetivo) + '</small>' : '') +
        '</div>' +
        '<label class="sel-status"><span class="sr-only">Status de ' + Fmt.esc(x.nome) + '</span>' +
          '<select data-lead-id="' + Fmt.esc(x.id) + '">' + opcoesStatus(x.status) + '</select>' +
        '</label>' +
      '</li>';
    }).join('');
  }

  function pintarFunil() {
    pintarFiltro();
    pintarLeads();
  }

  /* --- Comportamento: gráfico e rankings -------------------------- */
  function pintarComportamento() {
    HiferaAdmin.SiteChartView.montar(el('chartVisitas'), M.seriePorDia(30));

    var maiorPag = M.topPaginas().reduce(function (m, p) { return Math.max(m, p.n); }, 0);
    el('topPaginas').innerHTML = rankingHTML(M.topPaginas(), maiorPag, 'Nenhuma visita registrada.');

    var maiorClk = M.topCliques().reduce(function (m, p) { return Math.max(m, p.n); }, 0);
    el('topCliques').innerHTML = rankingHTML(M.topCliques(), maiorClk, 'Nenhum clique registrado.');
  }

  function rankingHTML(lista, maior, vazio) {
    if (!lista.length) return '<li class="vazio">' + vazio + '</li>';
    return lista.map(function (p) {
      var pct = maior ? Math.round((p.n / maior) * 100) : 0;
      return '<li>' +
        '<div class="li-txt"><strong>' + Fmt.esc(p.rotulo) + '</strong>' +
          '<span class="barra-mini" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
        '</div>' +
        '<span class="pill pill--cinza">' + p.n + '</span>' +
      '</li>';
    }).join('');
  }

  /* --- Nota de fonte: deixa claro quando é amostra ---------------- */
  function pintarFonte() {
    var p = el('fonteNota');
    if (!p) return;
    if (M.fonte() === 'protótipo') {
      p.innerHTML = 'Quem pediu contato pelo formulário de hifera.com.br. ' +
        '<strong>Dados de exemplo</strong> — a coleta real liga com o deploy ' +
        '(ver supabase/site-analytics.sql e js/site-config.js).';
    }
  }

  /* --- Eventos ----------------------------------------------------- */
  function ligarEventos() {
    var funil = el('filtroLeadSite');
    if (funil) {
      funil.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-lead-filtro]');
        if (!btn) return;
        filtro = btn.getAttribute('data-lead-filtro');
        pintarFunil();
      });
    }

    var lista = el('listaLeadsSite');
    if (lista) {
      lista.addEventListener('change', function (e) {
        var sel = e.target.closest('select[data-lead-id]');
        if (!sel) return;
        var id = sel.getAttribute('data-lead-id');
        sel.disabled = true;
        M.mudarStatus(id, sel.value).then(function () {
          pintarKpisLeads();
          pintarFunil();
          HiferaAdmin.Shell.toast('Status atualizado.', 'ok');
        }).catch(function () {
          sel.disabled = false;
          HiferaAdmin.Shell.toast('Não consegui salvar o status.', 'erro');
        });
      });
    }

    var exp = el('btnExportLeads');
    if (exp) {
      exp.addEventListener('click', function () {
        var hoje = new Date().toISOString().slice(0, 10);
        HiferaAdmin.Shell.baixar('leads-site-' + hoje + '.csv', M.exportarCSV(),
                                 'text/csv;charset=utf-8');
      });
    }
  }

  function pintar() {
    pintarFonte();
    pintarKpisLeads();
    pintarKpisEventos();
    pintarFunil();
    pintarComportamento();
  }

  function init() {
    if (!HiferaAdmin.Shell.iniciar()) return;
    ligarEventos();
    el('kpisLeads').innerHTML = '<p class="vazio">Carregando…</p>';
    M.carregar().then(pintar);
  }

  return { init: init };
})();
