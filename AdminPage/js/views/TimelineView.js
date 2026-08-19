/* =================================================================
   HIFERA ADMIN · View · Timeline (Gantt)
   Cada projeto vira uma barra entre início e entrega. O preenchimento
   interno mostra quanto do contrato já foi recebido, então dá pra ver
   "prazo" e "caixa" na mesma linha.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.TimelineView = (function () {
  'use strict';

  var Fmt   = HiferaAdmin.Fmt;
  var Model = HiferaAdmin.ProjectsModel;

  function dias(iso) { return new Date(iso + 'T00:00:00').getTime() / 86400000; }

  function primeiroDiaDoMes(iso) { return iso.slice(0, 7) + '-01'; }

  function proximoMes(iso) {
    var a = parseInt(iso.slice(0, 4), 10);
    var m = parseInt(iso.slice(5, 7), 10) + 1;
    if (m > 12) { m = 1; a++; }
    return a + '-' + String(m).padStart(2, '0') + '-01';
  }

  function rotuloMes(iso) {
    var m = parseInt(iso.slice(5, 7), 10);
    return Model.MESES_CURTOS[m - 1] + (m === 1 ? ' ' + iso.slice(2, 4) : '');
  }

  function render(el, projetos) {
    if (!el) return;

    var itens = projetos.map(function (p) {
      return { p: p, periodo: Model.periodoProjeto(p) };
    }).filter(function (x) { return x.periodo; });

    if (!itens.length) {
      el.innerHTML = '<div class="vazio-box"><strong>Sem datas cadastradas</strong>' +
                     '<p>Informe início e entrega nos projetos para montar a linha do tempo.</p></div>';
      return;
    }

    /* Janela: do primeiro início ao último fim, arredondada por mês */
    var min = itens[0].periodo.inicio, max = itens[0].periodo.fim;
    itens.forEach(function (x) {
      if (x.periodo.inicio < min) min = x.periodo.inicio;
      if (x.periodo.fim > max) max = x.periodo.fim;
    });
    var ini = primeiroDiaDoMes(min);
    var fim = proximoMes(max.slice(0, 7) + '-01');

    var d0 = dias(ini), d1 = dias(fim);
    var span = Math.max(1, d1 - d0);
    var pos = function (iso) { return ((dias(iso) - d0) / span) * 100; };

    /* Cabeçalho de meses */
    var meses = [];
    for (var m = ini; m < fim; m = proximoMes(m)) {
      meses.push({ iso: m, esq: pos(m), larg: (dias(proximoMes(m)) - dias(m)) / span * 100 });
    }

    var hoje = Model.hoje();
    var marcaHoje = (hoje >= ini && hoje <= fim)
      ? '<div class="tl-hoje" style="left:' + pos(hoje).toFixed(3) + '%"><span>hoje</span></div>'
      : '';

    var cabecalho =
      '<div class="tl-linha tl-linha--head">' +
        '<div class="tl-rot"></div>' +
        '<div class="tl-trilha">' +
          meses.map(function (x) {
            return '<span class="tl-mes" style="left:' + x.esq.toFixed(3) + '%;width:' + x.larg.toFixed(3) + '%">' +
                   rotuloMes(x.iso) + '</span>';
          }).join('') +
        '</div>' +
      '</div>';

    var linhas = itens.map(function (x) {
      var p = x.p;
      var t = Model.totaisProjeto(p);
      var contratado = t.recebido + t.aReceber;
      var pctPago = contratado > 0 ? (t.recebido / contratado) * 100 : 0;
      var esq = pos(x.periodo.inicio);
      var larg = Math.max(1.2, pos(x.periodo.fim) - esq);
      var cor = (Model.STATUS[p.status] || {}).cor || 'cyan';
      var alertas = Model.alertasProjeto(p);
      var atrasado = alertas.some(function (a) { return a.tipo === 'entrega-estourada'; });

      var titulo = p.titulo + ' · ' + Fmt.data(x.periodo.inicio) + ' → ' + Fmt.data(x.periodo.fim) +
                   ' · ' + Fmt.pct(pctPago, 0) + ' recebido' +
                   (atrasado ? ' · ENTREGA ATRASADA' : '');

      return '<div class="tl-linha">' +
        '<div class="tl-rot">' +
          '<strong>' + Fmt.esc(p.titulo) + '</strong>' +
          '<small>' + Fmt.esc(p.cliente || p.categoria) + '</small>' +
        '</div>' +
        '<div class="tl-trilha">' +
          meses.map(function (mm) {
            return '<span class="tl-guia" style="left:' + mm.esq.toFixed(3) + '%"></span>';
          }).join('') +
          '<div class="tl-barra tl-barra--' + cor + (atrasado ? ' is-atrasada' : '') + '" ' +
               'style="left:' + esq.toFixed(3) + '%;width:' + larg.toFixed(3) + '%" ' +
               'title="' + Fmt.esc(titulo) + '">' +
            '<span class="tl-fill" style="width:' + pctPago.toFixed(1) + '%"></span>' +
            '<span class="tl-legenda">' + Fmt.pct(pctPago, 0) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML = '<div class="tl">' + cabecalho +
                   '<div class="tl-corpo">' + marcaHoje + linhas + '</div></div>';
  }

  return { render: render };
})();
