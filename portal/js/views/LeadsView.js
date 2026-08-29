/* =================================================================
   HIFERA PORTAL · View · Leads
   -----------------------------------------------------------------
   Os contatos que o sistema entregue pela Hifera capturou, na fila
   que o cliente trabalha: novo → em contato → ganho ou perdido.

   Aqui o cliente ESCREVE (muda status, anota). É a única tela do
   portal com escrita, e mesmo assim escopada: o LeadsModel só aceita
   a mudança se o lead pertencer ao cliente da sessão.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.LeadsView = (function () {
  'use strict';

  var Fmt   = HiferaAdmin.Fmt;
  var Leads = HiferaPortal.LeadsModel;
  var UI    = HiferaPortal.UI;

  var handlers = {};
  function definirHandlers(h) { handlers = h || {}; }

  /* Filtro é estado de tela, não de dado: vive aqui e morre no reload. */
  var filtro = { busca: '', status: 'todos', origem: 'todas' };

  var CARTOES = [
    { chave: 'novo',    rot: 'Novos',      cor: 'cyan'  },
    { chave: 'contato', rot: 'Em contato', cor: 'amber' },
    { chave: 'ganho',   rot: 'Ganhos',     cor: 'green' },
    { chave: 'perdido', rot: 'Perdidos',   cor: 'red'   }
  ];

  function resumo(r) {
    return '<div class="leads-resumo">' + CARTOES.map(function (c) {
      return '<button type="button" class="lr' + (filtro.status === c.chave ? ' is-on' : '') + '" ' +
          'data-filtro-status="' + c.chave + '">' +
          '<span class="lr-dot lr-dot--' + c.cor + '"></span>' +
          '<strong>' + r[c.chave] + '</strong>' +
          '<span class="lr-rot">' + c.rot + '</span>' +
        '</button>';
    }).join('') +
      '<button type="button" class="lr lr--todos' + (filtro.status === 'todos' ? ' is-on' : '') + '" ' +
        'data-filtro-status="todos">' +
        '<strong>' + r.total + '</strong><span class="lr-rot">Todos</span>' +
      '</button>' +
    '</div>';
  }

  function linha(lead) {
    var st = Leads.STATUS[lead.status];
    var opcoes = Object.keys(Leads.STATUS).map(function (k) {
      return '<option value="' + k + '"' + (k === lead.status ? ' selected' : '') + '>' +
             Leads.STATUS[k].label + '</option>';
    }).join('');

    return '<li class="lead lead--' + st.cor + '" data-lead="' + Fmt.esc(lead.id) + '">' +
        '<div class="lead-quem">' +
          '<span class="lead-av">' + Fmt.esc(iniciais(lead.nome)) + '</span>' +
          '<div>' +
            '<strong>' + Fmt.esc(lead.nome) + '</strong>' +
            (lead.empresa ? '<span class="lead-emp">' + Fmt.esc(lead.empresa) + '</span>' : '') +
            (lead.email
              ? '<a class="lead-mail" href="mailto:' + Fmt.esc(lead.email) + '">' +
                Fmt.esc(lead.email) + '</a>'
              : '') +
          '</div>' +
        '</div>' +

        '<div class="lead-origem">' +
          '<span class="chip-origem">' + Fmt.esc(lead.origem) + '</span>' +
          '<span class="lead-quando">' + UI.desde(lead.quando) + '</span>' +
        '</div>' +

        '<div class="lead-nota">' +
          '<input type="text" value="' + Fmt.esc(lead.nota) + '" data-lead-nota ' +
            'placeholder="Anotação rápida…" aria-label="Anotação sobre ' + Fmt.esc(lead.nome) + '">' +
        '</div>' +

        '<label class="sel-mini lead-status">' +
          '<span class="sr">Situação de ' + Fmt.esc(lead.nome) + '</span>' +
          '<select data-lead-status>' + opcoes + '</select>' +
        '</label>' +
      '</li>';
  }

  function iniciais(nome) {
    var p = String(nome || '').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  function barra() {
    var opOrigem = ['todas'].concat(Leads.ORIGENS).map(function (o) {
      return '<option value="' + Fmt.esc(o) + '"' + (o === filtro.origem ? ' selected' : '') + '>' +
             (o === 'todas' ? 'Todas as origens' : Fmt.esc(o)) + '</option>';
    }).join('');

    return '<div class="barra-filtros">' +
        '<label class="busca">' +
          UI.svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>') +
          '<input type="search" id="buscaLead" value="' + Fmt.esc(filtro.busca) + '" ' +
            'placeholder="Buscar por nome, empresa ou e-mail…" aria-label="Buscar lead">' +
        '</label>' +
        '<label class="sel-status"><span>Origem</span>' +
          '<select id="filtroOrigem" aria-label="Filtrar por origem">' + opOrigem + '</select></label>' +
        '<span class="contador" id="contadorLeads"></span>' +
        '<button type="button" class="btn-sec" id="btnExportarLeads">' +
          UI.svg(UI.ICONE.baixar) + 'Exportar CSV</button>' +
      '</div>';
  }

  function render(el, ctx) {
    if (!el) return;

    var r = Leads.resumo(ctx.cliente);
    var lista = Leads.porCliente(ctx.cliente, filtro);

    el.innerHTML =
      '<div class="sec-head">' +
        '<h2>Leads</h2>' +
        '<p>Contatos que o seu sistema capturou — formulário do site, agendamento, WhatsApp e indicação. ' +
          'Mude a situação conforme for falando com cada um.</p>' +
      '</div>' +

      resumo(r) +

      '<div class="card">' +
        barra() +
        (lista.length
          ? '<ul class="leads">' + lista.map(linha).join('') + '</ul>'
          : '<div class="vazio-box">' +
              '<strong>' + (r.total ? 'Nenhum lead com esse filtro' : 'Nenhum lead ainda') + '</strong>' +
              '<p>' + (r.total
                ? 'Ajuste a busca, a origem ou a situação acima.'
                : 'Assim que alguém preencher o formulário do site ou marcar um horário, ele aparece aqui.') +
              '</p></div>') +
      '</div>';

    var cont = el.querySelector('#contadorLeads');
    if (cont) cont.textContent = lista.length + (lista.length === 1 ? ' lead' : ' leads');

    ligar(el, ctx);
  }

  function ligar(el, ctx) {
    el.querySelectorAll('[data-filtro-status]').forEach(function (b) {
      b.addEventListener('click', function () {
        filtro.status = b.dataset.filtroStatus;
        render(el, ctx);
      });
    });

    var busca = el.querySelector('#buscaLead');
    if (busca) {
      busca.addEventListener('input', function () {
        filtro.busca = busca.value;
        render(el, ctx);
        /* re-render tira o foco do campo; devolver é o mínimo pra
           conseguir digitar a segunda letra */
        var novo = el.querySelector('#buscaLead');
        if (novo) { novo.focus(); novo.setSelectionRange(novo.value.length, novo.value.length); }
      });
    }

    var origem = el.querySelector('#filtroOrigem');
    if (origem) {
      origem.addEventListener('change', function () {
        filtro.origem = origem.value;
        render(el, ctx);
      });
    }

    var exportar = el.querySelector('#btnExportarLeads');
    if (exportar) {
      exportar.addEventListener('click', function () {
        if (typeof handlers.exportar === 'function') handlers.exportar();
      });
    }

    el.querySelectorAll('.lead').forEach(function (li) {
      var id = li.dataset.lead;

      var sel = li.querySelector('[data-lead-status]');
      if (sel) {
        sel.addEventListener('change', function () {
          if (typeof handlers.mudarStatus === 'function') handlers.mudarStatus(id, sel.value);
        });
      }

      /* Anotação salva ao sair do campo — salvar a cada tecla encheria
         o log e o storage sem motivo. */
      var nota = li.querySelector('[data-lead-nota]');
      if (nota) {
        nota.addEventListener('change', function () {
          if (typeof handlers.anotar === 'function') handlers.anotar(id, nota.value);
        });
      }
    });
  }

  return { render: render, definirHandlers: definirHandlers };
})();
