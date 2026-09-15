/* =================================================================
   HIFERA MÓDULOS · Admin · Controller · Financeiro
   -----------------------------------------------------------------
   Consolida o livro-caixa de todos os projetos. A tela de Gestão de
   Projetos mostra o mesmo dado por projeto; aqui ele é somado, e a
   pergunta muda: em vez de "como vai este cliente", é "o mês fecha".

   A tabela de recebíveis ordena da competência mais antiga para a mais
   nova de propósito: parcela velha em aberto é a que precisa de
   telefonema, e ela tem que ser a primeira coisa que se vê.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.FinanceiroController = (function () {
  'use strict';

  var P   = HiferaAdmin.ProjectsModel;
  var Fmt = HiferaAdmin.Fmt;

  function el(id) { return document.getElementById(id); }

  /* Toda parcela em aberto, de todos os projetos, achatada numa lista. */
  function receber(ano) {
    var linhas = [];
    P.getAll().forEach(function (p) {
      (p.lancamentos || []).forEach(function (x) {
        if (!x.aReceber) return;
        if (ano && x.mes.slice(0, 4) !== String(ano)) return;
        linhas.push({
          mes: x.mes, projeto: p.titulo, cliente: p.cliente || 'Sem cliente definido',
          valor: x.aReceber, vencida: x.mes < P.mesAtual()
        });
      });
    });
    return linhas.sort(function (a, b) { return a.mes.localeCompare(b.mes); });
  }

  function cartao(rot, val, nota, tom) {
    return '<div class="kpi kpi--' + tom + '">' +
             '<span class="kpi-label">' + Fmt.esc(rot) + '</span>' +
             '<strong class="kpi-valor">' + Fmt.esc(String(val)) + '</strong>' +
             '<span class="kpi-nota">' + Fmt.esc(nota) + '</span>' +
           '</div>';
  }

  function pintarKpis(ano, lista) {
    var t = P.totais(ano);
    var vencido = lista.reduce(function (s, l) { return s + (l.vencida ? l.valor : 0); }, 0);
    var fc = P.totalForecast ? P.totalForecast(ano) : 0;
    var resultado = t.recebido - t.gastos;

    el('kpisFin').innerHTML =
      cartao('Recebido', Fmt.moeda(t.recebido),
             t.meta ? Fmt.pct((t.recebido / t.meta) * 100) + ' da meta de ' + Fmt.moeda(t.meta) : 'sem meta', 'green') +
      cartao('A receber', Fmt.moeda(t.aReceber),
             vencido ? Fmt.moeda(vencido) + ' já vencido' : 'nada vencido',
             vencido ? 'red' : 'cyan') +
      cartao('Gastos', Fmt.moeda(t.gastos),
             t.recebido ? Fmt.pct((t.gastos / t.recebido) * 100) + ' do recebido' : 'sem receita no período', 'amber') +
      cartao('Resultado', Fmt.moeda(resultado),
             t.recebido ? 'margem de ' + Fmt.pct((resultado / t.recebido) * 100) : '—',
             resultado >= 0 ? 'indigo' : 'red') +
      cartao('Forecast', fc ? Fmt.moeda(fc) : '—',
             fc ? 'projeção até dezembro, pela média dos 3 últimos meses' : 'sem histórico para projetar', 'cyan');

    /* O banner só aparece quando há dinheiro vencido: aviso que aparece
       sempre vira paisagem e ninguém lê. */
    var banner = el('bannerVencido');
    if (vencido) {
      banner.hidden = false;
      banner.className = 'banner banner--alerta';
      var qtd = lista.filter(function (l) { return l.vencida; }).length;
      banner.innerHTML = '<div class="banner-txt"><strong>' + Fmt.moeda(vencido) + ' vencido</strong>' +
        '<span>' + qtd + (qtd === 1 ? ' parcela em aberto com competência anterior a este mês.'
                                    : ' parcelas em aberto com competência anterior a este mês.') + '</span></div>';
    } else {
      banner.hidden = true;
    }
  }

  function pintarGrafico(ano) {
    var alvo = el('graficoFin');
    if (!alvo || !HiferaAdmin.ChartView) return;
    /* Mesma chamada da tela de projetos: montar(), não render(). E passa
       o ano anterior para a linha de comparação aparecer quando existe. */
    /* anosDisponiveis() devolve strings; Shell.ano() devolve Number.
       Sem o String() o indexOf nunca achava nada e a linha de
       comparação com o ano anterior simplesmente não aparecia. */
    var anoAnt = P.anosDisponiveis().indexOf(String(ano - 1)) > -1 ? ano - 1 : null;
    HiferaAdmin.ChartView.montar(alvo, {
      serie: P.serieMensal(ano),
      forecast: P.forecast ? P.forecast(ano) : null,
      anterior: anoAnt ? P.serieMensal(anoAnt) : null,
      anoAnterior: anoAnt || ''
    });
    var t = P.totais(ano);
    el('finResumo').innerHTML =
      '<span>Recebido <strong>' + Fmt.moeda(t.recebido) + '</strong></span>' +
      '<span>vs meta <strong>' + Fmt.moeda(t.meta) + '</strong></span>';
  }

  function pintarTabela(lista) {
    var tab = el('tabelaReceber');
    if (!lista.length) {
      tab.innerHTML = '<tbody><tr><td class="vazio">Nenhuma parcela em aberto neste ano.</td></tr></tbody>';
      return;
    }
    tab.innerHTML =
      '<thead><tr><th>Competência</th><th>Cliente</th><th>Projeto</th><th>Valor</th><th>Situação</th></tr></thead>' +
      '<tbody>' + lista.map(function (l) {
        return '<tr>' +
          '<td>' + Fmt.esc(Fmt.competencia(l.mes)) + '</td>' +
          '<td>' + Fmt.esc(l.cliente) + '</td>' +
          '<td>' + Fmt.esc(l.projeto) + '</td>' +
          '<td class="num">' + Fmt.moeda(l.valor) + '</td>' +
          '<td>' + (l.vencida
            ? '<span class="pill pill--red">vencida</span>'
            : '<span class="pill pill--cyan">a vencer</span>') + '</td>' +
        '</tr>';
      }).join('') + '</tbody>';
  }

  function pintar() {
    var ano = HiferaAdmin.Shell.ano();
    var lista = receber(ano);
    pintarKpis(ano, lista);
    pintarGrafico(ano);
    pintarTabela(lista);
  }

  function init() {
    if (!HiferaAdmin.Shell.iniciar(pintar)) return;
    pintar();
  }

  return { init: init, pintar: pintar };
})();
