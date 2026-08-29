/* =================================================================
   HIFERA PORTAL · View · Meu projeto
   -----------------------------------------------------------------
   O que o cliente contratou, em que pé está e o que ele deve.
   Tudo em leitura: quem move marco e lança parcela é a Hifera.

   Os dados chegam já filtrados pelo ClientProjectModel — gastos,
   margem e meta não existem neste arquivo porque não existem no
   objeto que ele recebe.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.ProjetoView = (function () {
  'use strict';

  var Fmt      = HiferaAdmin.Fmt;
  var Projetos = HiferaPortal.ClientProjectModel;
  var STATUS   = HiferaAdmin.ProjectsModel.STATUS;
  var Dias     = HiferaAdmin.ProjectsModel.diasEntre;
  var Hoje     = HiferaAdmin.ProjectsModel.hoje;
  var UI       = HiferaPortal.UI;

  var handlers = {};
  function definirHandlers(h) { handlers = h || {}; }

  function pill(status) {
    var s = STATUS[status] || STATUS.andamento;
    return '<span class="pill pill--' + s.cor + '"><span class="pill-dot"></span>' + s.label + '</span>';
  }

  function prazo(p) {
    if (!p.entrega) return 'sem data de entrega combinada';
    var d = Dias(Hoje(), p.entrega);
    if (p.status === 'finalizado') return 'entregue';
    if (d < 0)  return 'prazo era ' + Fmt.data(p.entrega);
    if (d === 0) return 'entrega é hoje';
    return 'faltam ' + d + (d === 1 ? ' dia' : ' dias');
  }

  /* --- Cabeçalho ----------------------------------------------------- */
  function ficha(p) {
    return '<div class="card card--ficha-cliente">' +
        '<div class="fc-topo">' +
          '<div>' +
            '<span class="fc-selos">' + pill(p.status) + '</span>' +
            '<h2>' + Fmt.esc(p.titulo) + '</h2>' +
            '<p class="fc-sub">' + Fmt.esc(p.categoria) +
              (p.segmento ? ' · ' + Fmt.esc(p.segmento) : '') + '</p>' +
            (p.descricao ? '<p class="fc-desc">' + Fmt.esc(p.descricao) + '</p>' : '') +
          '</div>' +
          (p.link
            ? '<a class="btn-sec" href="' + Fmt.esc(Fmt.urlDoSite(Fmt.urlSegura(p.link))) + '" ' +
              'target="_blank" rel="noopener">Abrir o sistema</a>'
            : '') +
        '</div>' +

        '<div class="ficha-progresso">' +
          '<div class="prog-cab">' +
            '<strong>' + p.progresso.pct + '% concluído</strong>' +
            '<span>' + (p.progresso.base === 'marcos'
              ? p.progresso.concluidos + ' de ' + p.progresso.total + ' etapas entregues'
              : 'acompanhamento pelo contrato') + '</span>' +
          '</div>' +
          '<div class="prog-barra"><span style="width:' + p.progresso.pct + '%"></span></div>' +
        '</div>' +

        '<div class="ficha-meta">' +
          '<div class="meta-item"><span class="meta-rot">Início</span>' +
            '<strong class="meta-val">' + (p.inicio ? Fmt.data(p.inicio) : '—') + '</strong></div>' +
          '<div class="meta-item"><span class="meta-rot">Entrega prevista</span>' +
            '<strong class="meta-val">' + (p.entrega ? Fmt.data(p.entrega) : '—') + '</strong>' +
            '<small class="meta-extra">' + prazo(p) + '</small></div>' +
          '<div class="meta-item"><span class="meta-rot">Etapas entregues</span>' +
            '<strong class="meta-val">' + p.progresso.concluidos + ' / ' + p.progresso.total + '</strong></div>' +
          '<div class="meta-item"><span class="meta-rot">Contrato quitado</span>' +
            '<strong class="meta-val">' + p.financeiro.pctPago + '%</strong>' +
            '<small class="meta-extra">' + Fmt.moeda(p.financeiro.pago) + ' de ' +
              Fmt.moeda(p.financeiro.contratado) + '</small></div>' +
        '</div>' +
      '</div>';
  }

  /* --- Roteiro de entrega -------------------------------------------- */
  function roteiro(p) {
    return '<div class="card">' +
        '<div class="card-head">' +
          '<div>' +
            '<h2>Roteiro de entrega</h2>' +
            '<p>As etapas combinadas em contrato, na ordem. É o que define o percentual acima.</p>' +
          '</div>' +
        '</div>' +
        (p.marcos.length
          ? '<ol class="marcos marcos--leitura">' +
              p.marcos.map(function (m) { return UI.linhaMarco(m, true); }).join('') +
            '</ol>'
          : '<div class="vazio-box"><strong>Etapas ainda não cadastradas</strong>' +
              '<p>Assim que o escopo for fechado, o roteiro aparece aqui.</p></div>') +
      '</div>';
  }

  /* --- Pagamentos ----------------------------------------------------
     Só o lado do cliente. O que a Hifera gasta e a margem do contrato
     não chegam nem a este arquivo — ver ClientProjectModel.         */
  function pagamentos(p) {
    var f = p.financeiro;

    return '<div class="card">' +
        '<div class="card-head card-head--acoes">' +
          '<div>' +
            '<h2>Pagamentos</h2>' +
            '<p>As parcelas do seu contrato, por competência.</p>' +
          '</div>' +
          '<div class="card-resumo">' +
            '<span>Contratado <strong>' + Fmt.moeda(f.contratado) + '</strong></span>' +
            '<span>Pago <strong>' + Fmt.moeda(f.pago) + '</strong></span>' +
            '<span>A pagar <strong class="' + (f.vencido > 0 ? 'is-neg' : '') + '">' +
              Fmt.moeda(f.aPagar) + '</strong></span>' +
          '</div>' +
        '</div>' +

        (f.parcelas.length
          ? '<div class="tabela-wrap"><table class="tabela tabela--parcelas">' +
              '<thead><tr><th>Competência</th><th>Situação</th>' +
                '<th class="num">Pago</th><th class="num">Em aberto</th></tr></thead>' +
              '<tbody>' + f.parcelas.map(function (x) {
                var situacao = x.vencida
                  ? '<span class="pill pill--red"><span class="pill-dot"></span>Vencida</span>'
                  : (x.aPagar > 0
                      ? '<span class="pill pill--amber"><span class="pill-dot"></span>A vencer</span>'
                      : '<span class="pill pill--green"><span class="pill-dot"></span>Quitada</span>');
                return '<tr' + (x.vencida ? ' class="tem-alerta"' : '') + '>' +
                    '<td>' + Fmt.competencia(x.mes) + '</td>' +
                    '<td>' + situacao + '</td>' +
                    '<td class="num">' + (x.pago > 0 ? Fmt.moeda(x.pago) : '<span class="vazio">—</span>') + '</td>' +
                    '<td class="num">' + (x.aPagar > 0 ? Fmt.moeda(x.aPagar) : '<span class="vazio">—</span>') + '</td>' +
                  '</tr>';
              }).join('') + '</tbody>' +
            '</table></div>'
          : '<div class="vazio-box"><strong>Nenhuma parcela lançada</strong>' +
              '<p>As condições combinadas aparecem aqui assim que forem registradas.</p></div>') +

        (f.vencido > 0
          ? '<p class="nota-pagamento">' + UI.svg(UI.ICONE.alerta, 1.7) +
              '<span>Há <strong>' + Fmt.moeda(f.vencido) + '</strong> em aberto. ' +
              'Se já pagou, <a href="#chamados/novo">abra um chamado</a> com o comprovante ' +
              'que a gente acerta o registro.</span></p>'
          : '') +
      '</div>';
  }

  /* --- Seletor, quando o cliente tem mais de um projeto -------------- */
  function seletor(lista, atual) {
    if (lista.length < 2) return '';
    return '<div class="troca-projeto">' +
        '<span>Seus projetos</span>' +
        '<div class="troca-botoes">' + lista.map(function (p) {
          return '<button type="button" data-projeto="' + Fmt.esc(p.id) + '"' +
                 (p.id === atual.id ? ' class="is-on" aria-current="true"' : '') + '>' +
                 Fmt.esc(p.titulo) + '</button>';
        }).join('') + '</div>' +
      '</div>';
  }

  function render(el, ctx, idProjeto) {
    if (!el) return;

    var lista = Projetos.porCliente(ctx.cliente);
    if (!lista.length) {
      el.innerHTML =
        '<div class="vazio-box vazio-box--tela">' +
          '<strong>Nenhum projeto ativo</strong>' +
          '<p>Não há projeto registrado para a ' + Fmt.esc(ctx.cliente) + ' neste momento. ' +
            'Se isso não estiver certo, fale com a gente por um chamado.</p>' +
          '<a class="btn-pri" href="#chamados/novo">Abrir chamado</a>' +
        '</div>';
      return;
    }

    var p = (idProjeto && Projetos.porId(ctx.cliente, idProjeto)) ||
            Projetos.principal(ctx.cliente);

    el.innerHTML =
      seletor(lista, p) +
      ficha(p) +
      roteiro(p) +
      pagamentos(p);

    el.querySelectorAll('[data-projeto]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (typeof handlers.trocarProjeto === 'function') handlers.trocarProjeto(b.dataset.projeto);
      });
    });
  }

  return { render: render, definirHandlers: definirHandlers };
})();
