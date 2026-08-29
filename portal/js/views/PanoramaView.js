/* =================================================================
   HIFERA PORTAL · View · Panorama
   -----------------------------------------------------------------
   A primeira tela. Responde, sem rolar: como está minha entrega,
   quando é a próxima, o que eu devo, o que chegou de lead e o que
   está aberto com a Hifera.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.PanoramaView = (function () {
  'use strict';

  var Fmt      = HiferaAdmin.Fmt;
  var Projetos = HiferaPortal.ClientProjectModel;
  var Leads    = HiferaPortal.LeadsModel;
  var Tickets  = HiferaAdmin.TicketsModel;
  var UI       = HiferaPortal.UI;

  function kpi(c) {
    return '<article class="kpi kpi--' + c.tom + (c.alerta ? ' kpi--pisca' : '') + '">' +
             '<div class="kpi-top">' +
               '<span class="kpi-icon">' + UI.svg(c.icone, 1.7) + '</span>' +
               '<span class="kpi-label">' + c.label + '</span>' +
             '</div>' +
             '<div class="kpi-valor">' + c.valor + '</div>' +
             (c.progresso !== undefined
               ? '<div class="kpi-bar"><span style="width:' +
                 Math.max(0, Math.min(c.progresso, 100)).toFixed(1) + '%"></span></div>'
               : '') +
             '<div class="kpi-nota">' + c.nota + '</div>' +
           '</article>';
  }

  function cartoes(projeto, resumoLeads, chamados) {
    var abertos = chamados.filter(function (t) {
      return Tickets.STATUS[t.status] && Tickets.STATUS[t.status].aberto;
    });

    var proximo = projeto && projeto.progresso.proximo;
    var fin = projeto ? projeto.financeiro : null;

    return [
      {
        label: 'Entrega do projeto', icone: UI.ICONE.bandeira, tom: 'cyan',
        valor: projeto ? projeto.progresso.pct + '%' : '—',
        progresso: projeto ? projeto.progresso.pct : 0,
        nota: projeto
          ? (projeto.progresso.base === 'marcos'
              ? projeto.progresso.concluidos + ' de ' + projeto.progresso.total + ' etapas entregues'
              : 'acompanhamento por contrato')
          : 'Nenhum projeto ativo'
      },
      {
        label: 'Próxima etapa', icone: UI.ICONE.relogio, tom: 'indigo',
        valor: proximo
          ? (proximo.data ? Fmt.data(proximo.data) : 'a definir')
          : '—',
        nota: proximo
          ? Fmt.esc(proximo.titulo)
          : (projeto ? 'Todas as etapas entregues' : 'Sem etapas cadastradas')
      },
      {
        label: 'A pagar', icone: UI.ICONE.dinheiro,
        tom: fin && fin.vencido > 0 ? 'red' : 'cyan-soft',
        alerta: !!(fin && fin.vencido > 0),
        valor: fin ? Fmt.moeda(fin.aPagar) : '—',
        nota: !fin
          ? 'Sem parcelas lançadas'
          : (fin.vencido > 0
              ? '<strong class="kpi-flag">' + Fmt.moeda(fin.vencido) + ' em aberto</strong> · fale com a gente'
              : (fin.aPagar > 0
                  ? Fmt.pct(fin.pctPago, 0) + ' do contrato já quitado'
                  : 'Contrato quitado'))
      },
      {
        label: 'Leads novos', icone: UI.ICONE.pessoa,
        tom: resumoLeads.novo > 0 ? 'green' : 'cyan-soft',
        valor: String(resumoLeads.novo),
        nota: resumoLeads.total
          ? resumoLeads.contato + ' em contato · ' + resumoLeads.ganhosNoMes + ' ganhos em 30 dias'
          : 'Nenhum lead recebido ainda'
      },
      {
        label: 'Chamados abertos', icone: UI.ICONE.chat,
        tom: abertos.length ? 'amber' : 'green',
        valor: String(abertos.length),
        nota: chamados.length
          ? chamados.length + ' no total · ' +
            (abertos.length ? 'a Hifera está com a bola' : 'nada pendente')
          : 'Você ainda não abriu nenhum'
      }
    ].map(kpi).join('');
  }

  /* --- Próximos passos: as etapas ainda em aberto ------------------- */
  function proximosPassos(projeto) {
    var abertos = projeto
      ? projeto.marcos.filter(function (m) { return m.status !== 'concluido'; }).slice(0, 4)
      : [];

    return '<div class="card">' +
        '<div class="card-head card-head--acoes">' +
          '<div>' +
            '<h2>Próximos passos</h2>' +
            '<p>O que a Hifera está construindo agora e o que vem depois.</p>' +
          '</div>' +
          '<a class="btn-sec" href="#projeto">Ver o projeto</a>' +
        '</div>' +
        (abertos.length
          ? '<ol class="marcos marcos--leitura">' + abertos.map(function (m) {
              return UI.linhaMarco(m, false);
            }).join('') + '</ol>'
          : '<div class="vazio-box"><strong>' +
              (projeto ? 'Nenhuma etapa em aberto' : 'Nenhum projeto ativo') + '</strong>' +
              '<p>' + (projeto
                ? 'Todas as entregas combinadas foram concluídas.'
                : 'Assim que um projeto começar, ele aparece aqui.') + '</p></div>') +
      '</div>';
  }

  /* --- Chamados recentes -------------------------------------------- */
  function chamadosRecentes(chamados) {
    var lista = chamados.slice(0, 4);

    return '<div class="card">' +
        '<div class="card-head card-head--acoes">' +
          '<div>' +
            '<h2>Seus chamados</h2>' +
            '<p>Suporte, dúvida ou pedido de algo novo — tudo com prazo de resposta.</p>' +
          '</div>' +
          '<a class="btn-pri" href="#chamados/novo">' + UI.svg(UI.ICONE.mais, 2) + 'Abrir chamado</a>' +
        '</div>' +
        (lista.length
          ? '<ul class="lista-simples">' + lista.map(function (t) {
              return '<li><a href="#chamados/' + Fmt.esc(t.id) + '">' +
                  '<span class="ls-cab">' +
                    UI.pillStatusChamado(t.status) +
                    '<strong>' + Fmt.esc(t.titulo) + '</strong>' +
                  '</span>' +
                  '<span class="ls-pe">' + Fmt.esc(t.id) + ' · aberto em ' +
                    Fmt.data(t.aberto_em.slice(0, 10)) + '</span>' +
                '</a></li>';
            }).join('') + '</ul>' +
            (chamados.length > 4
              ? '<a class="link-mais" href="#chamados">Ver todos os ' + chamados.length + '</a>'
              : '')
          : '<div class="vazio-box"><strong>Nenhum chamado aberto</strong>' +
              '<p>Quando precisar de suporte ou quiser pedir algo novo, é por aqui.</p></div>') +
      '</div>';
  }

  function render(el, ctx) {
    if (!el) return;

    var projeto  = Projetos.principal(ctx.cliente);
    var resumo   = Leads.resumo(ctx.cliente);
    var chamados = Tickets.porEmpresa(ctx.cliente);
    var pend     = Projetos.pendencias(ctx.cliente);

    el.innerHTML =
      '<div class="sec-head sec-head--saudacao">' +
        '<h2>Olá, ' + Fmt.esc((ctx.user.nome || '').split(' ')[0]) + '.</h2>' +
        '<p>Este é o painel da <strong>' + Fmt.esc(ctx.cliente) + '</strong> com a Hifera' +
          (projeto ? ' · <strong>' + Fmt.esc(projeto.titulo) + '</strong>' : '') + '.</p>' +
      '</div>' +

      (pend.length
        ? '<div class="banner banner--alerta">' + UI.svg(UI.ICONE.alerta) +
            '<div class="banner-txt">' +
              '<strong>' + Fmt.moeda(pend.reduce(function (s, x) { return s + x.valor; }, 0)) +
                ' em aberto</strong>' +
              '<span>' + pend.map(function (x) {
                return Fmt.esc(x.projeto) + ' · competência ' + x.meses.join(', ');
              }).join(' · ') + '</span>' +
            '</div>' +
            '<a class="btn-sec" href="#projeto">Ver parcelas</a>' +
          '</div>'
        : '') +

      '<div class="kpi-grid kpi-grid--5">' + cartoes(projeto, resumo, chamados) + '</div>' +

      '<div class="col-2">' +
        proximosPassos(projeto) +
        chamadosRecentes(chamados) +
      '</div>';
  }

  return { render: render };
})();
