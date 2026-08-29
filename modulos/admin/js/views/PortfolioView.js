/* =================================================================
   HIFERA ADMIN · View · Carteira
   -----------------------------------------------------------------
   Dois recortes que o gráfico não dá: quanto cada cliente representa
   e quantos projetos estão saudáveis. Fica ao lado do "Meta vs
   Realizado" porque as três perguntas são a mesma reunião.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.PortfolioView = (function () {
  'use strict';

  var Fmt   = HiferaAdmin.Fmt;
  var Model = HiferaAdmin.ProjectsModel;

  var SAUDE = [
    { chave: 'ok',      label: 'Saudáveis', cor: 'green' },
    { chave: 'atencao', label: 'Atenção',   cor: 'amber' },
    { chave: 'risco',   label: 'Em risco',  cor: 'red'   }
  ];

  function barraSaude(c) {
    var total = c.total || 1;
    return '<div class="saude-barra" role="img" aria-label="' +
             SAUDE.map(function (s) { return c[s.chave] + ' ' + s.label.toLowerCase(); }).join(', ') + '">' +
             SAUDE.map(function (s) {
               var pct = (c[s.chave] / total) * 100;
               return pct > 0
                 ? '<span class="saude-fatia saude-fatia--' + s.cor + '" style="width:' + pct.toFixed(1) + '%"></span>'
                 : '';
             }).join('') +
           '</div>' +
           '<ul class="saude-legenda">' +
             SAUDE.map(function (s) {
               return '<li><i class="tl-chip tl-chip--' + s.cor + '"></i>' +
                      '<strong>' + c[s.chave] + '</strong> ' + s.label + '</li>';
             }).join('') +
           '</ul>';
  }

  function linhaCliente(c, maior) {
    var total = c.recebido + c.aReceber;
    var pct = maior > 0 ? (total / maior) * 100 : 0;
    return '<li class="cli">' +
        '<div class="cli-cab">' +
          '<strong>' + Fmt.esc(c.cliente) + '</strong>' +
          '<span class="num">' + Fmt.moeda(total) + '</span>' +
        '</div>' +
        '<div class="cli-barra"><span style="width:' + pct.toFixed(1) + '%"></span></div>' +
        '<div class="cli-pe">' +
          '<span>' + c.projetos + (c.projetos === 1 ? ' projeto' : ' projetos') + '</span>' +
          '<span>' + Fmt.moeda(c.recebido) + ' recebido</span>' +
          (c.aReceber > 0 ? '<span>' + Fmt.moeda(c.aReceber) + ' a receber</span>' : '') +
          (c.alertas ? '<span class="is-neg">' + c.alertas +
            (c.alertas === 1 ? ' alerta' : ' alertas') + '</span>' : '') +
        '</div>' +
      '</li>';
  }

  /* render(el, { ano, limite }) */
  function render(el, opts) {
    if (!el) return;
    opts = opts || {};
    var contagem = Model.contagemStatus();
    var carteira = Model.carteiraClientes(opts.ano);
    var limite = opts.limite || 5;
    var mostrados = carteira.slice(0, limite);
    var maior = mostrados.length ? (mostrados[0].recebido + mostrados[0].aReceber) : 0;
    var resto = carteira.length - mostrados.length;

    el.innerHTML =
      '<div class="card card--lado">' +
        '<div class="card-head">' +
          '<div>' +
            '<h2>Saúde da carteira</h2>' +
            '<p>Semáforo derivado de alerta, prazo e margem — não é campo que alguém marca à mão.</p>' +
          '</div>' +
        '</div>' +
        barraSaude(contagem) +

        '<div class="card-head card-head--interno">' +
          '<div>' +
            '<h3>Por cliente <em>' + (opts.ano || 'todo o período') + '</em></h3>' +
            '<p>Recebido mais o que ainda está contratado.</p>' +
          '</div>' +
        '</div>' +
        (carteira.length
          ? '<ul class="clientes">' +
              mostrados.map(function (c) { return linhaCliente(c, maior); }).join('') +
            '</ul>' +
            (resto > 0 ? '<p class="rep-vazio">e mais ' + resto + ' cliente(s) com valor menor no período.</p>' : '')
          : '<p class="rep-vazio">Nenhum cliente com lançamento neste período.</p>') +

        '<div class="carteira-pe">' +
          '<span><strong>' + contagem.clientes + '</strong> clientes</span>' +
          '<span><strong>' + contagem.total + '</strong> projetos</span>' +
          '<span><strong>' + contagem.publicados + '</strong> na vitrine</span>' +
        '</div>' +
      '</div>';
  }

  return { render: render };
})();
