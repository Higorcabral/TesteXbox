/* =================================================================
   HIFERA PORTAL · Controller · Painel do cliente
   -----------------------------------------------------------------
   Roteador por hash e ponte view → model. Quatro telas num shell só,
   porque as quatro compartilham o mesmo contexto (o cliente da
   sessão) e trocar de aba não deveria recarregar o mundo.

   Rotas:
     #panorama                 (padrão)
     #projeto  |  #projeto/<id do projeto>
     #leads
     #chamados |  #chamados/novo  |  #chamados/<HIF-0000>

   TODA leitura passa por ctx.cliente. Se a sessão sumir no meio do
   caminho, o guard devolve para o login em vez de renderizar vazio.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.PortalController = (function () {
  'use strict';

  var Auth     = HiferaPortal.ClientAuthModel;
  var Projetos = HiferaPortal.ClientProjectModel;
  var Leads    = HiferaPortal.LeadsModel;
  var Tickets  = HiferaAdmin.TicketsModel;
  var Fmt      = HiferaAdmin.Fmt;
  var UI       = HiferaPortal.UI;

  var Panorama = HiferaPortal.PanoramaView;
  var Projeto  = HiferaPortal.ProjetoView;
  var LeadsV   = HiferaPortal.LeadsView;
  var ChamadosV= HiferaPortal.ChamadosView;

  var ctx = null;   /* { cliente, user } — montado uma vez, no init */

  function el(id) { return document.getElementById(id); }

  /* --- Rota ---------------------------------------------------------- */
  function rotaAtual() {
    var bruto = (window.location.hash || '').replace(/^#\/?/, '');
    var partes = bruto.split('/').filter(Boolean).map(decodeURIComponent);
    return { tela: partes[0] || 'panorama', arg: partes[1] || '' };
  }

  var TELAS = ['panorama', 'projeto', 'leads', 'chamados'];

  function navegar(hash) {
    if (window.location.hash === hash) desenhar();
    else window.location.hash = hash;
  }

  function desenhar() {
    /* Sessão pode ter caído em outra aba. Não renderiza nada sem ela. */
    if (!Auth.isAuthenticated()) {
      HiferaPortal.PortalAuthController.exigirSessao();
      return;
    }

    var r = rotaAtual();
    if (TELAS.indexOf(r.tela) < 0) r.tela = 'panorama';

    var alvo = el('conteudo');
    alvo.scrollTop = 0;
    window.scrollTo(0, 0);

    if (r.tela === 'panorama')      Panorama.render(alvo, ctx);
    else if (r.tela === 'projeto')  Projeto.render(alvo, ctx, r.arg);
    else if (r.tela === 'leads')    LeadsV.render(alvo, ctx);
    else if (r.tela === 'chamados') {
      if (r.arg === 'novo')      ChamadosV.renderNovo(alvo, ctx);
      else if (r.arg)            ChamadosV.renderDetalhe(alvo, ctx, r.arg);
      else                       ChamadosV.renderLista(alvo, ctx);
    }

    marcarMenu(r.tela);
    fecharMenuEstreito();
  }

  function marcarMenu(tela) {
    document.querySelectorAll('[data-tela]').forEach(function (a) {
      var ligado = a.dataset.tela === tela;
      a.classList.toggle('is-active', ligado);
      if (ligado) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var titulos = {
      panorama: 'Panorama',
      projeto:  'Meu projeto',
      leads:    'Leads',
      chamados: 'Chamados'
    };
    var h1 = el('tituloTela');
    if (h1) h1.textContent = titulos[tela] || 'Panorama';
    document.title = (titulos[tela] || 'Portal') + ' · ' + ctx.cliente + ' · Hifera';
  }

  function fecharMenuEstreito() {
    var side = el('side');
    if (side) side.classList.remove('is-open');
  }

  /* --- Contadores do menu -------------------------------------------- */
  function atualizarBadges() {
    var novos = Leads.resumo(ctx.cliente).novo;
    var abertos = Tickets.porEmpresa(ctx.cliente).filter(function (t) {
      return Tickets.STATUS[t.status] && Tickets.STATUS[t.status].aberto;
    }).length;

    var b1 = el('badgeLeads');
    if (b1) { b1.textContent = novos; b1.hidden = !novos; }

    var b2 = el('badgeChamados');
    if (b2) { b2.textContent = abertos; b2.hidden = !abertos; }
  }

  /* --- Ações: leads ---------------------------------------------------- */
  function mudarStatusLead(id, status) {
    var lead = Leads.mudarStatus(ctx.cliente, id, status);
    if (!lead) { UI.toast('Não foi possível atualizar este lead.', 'alerta'); return; }
    desenhar();
    atualizarBadges();
    UI.toast(lead.nome + ' agora está como ' + Leads.STATUS[status].label.toLowerCase() + '.', 'ok');
  }

  function anotarLead(id, texto) {
    if (!Leads.anotar(ctx.cliente, id, texto)) return;
    UI.toast('Anotação salva.', 'ok');
  }

  function exportarLeads() {
    var csv = Leads.exportarCSV(ctx.cliente);
    var nome = 'leads-' + HiferaAdmin.ProjectsModel.slug(ctx.cliente) + '-' +
               HiferaAdmin.ProjectsModel.hoje() + '.csv';
    /* BOM para o Excel em pt-BR abrir os acentos certos */
    UI.baixar(nome, '﻿' + csv, 'text/csv;charset=utf-8');
    UI.toast('CSV exportado.', 'ok');
  }

  /* --- Ações: chamados -------------------------------------------------- */
  function abrirChamado(dados) {
    /* Quem é o solicitante NÃO vem do formulário: vem da sessão. */
    var t = Tickets.salvar({
      tipo:        dados.tipo,
      titulo:      dados.titulo,
      descricao:   dados.descricao,
      categoria:   dados.categoria,
      sistema:     dados.sistema,
      modulo:      dados.modulo,
      prioridade:  dados.prioridade,
      status:      'Aberto',
      solicitante: ctx.user.nome,
      email:       ctx.user.email,
      empresa:     ctx.cliente,
      vinculo:     (Projetos.principal(ctx.cliente) || {}).titulo || ''
    });

    ChamadosV.limparRascunho();
    atualizarBadges();
    navegar('#chamados/' + t.id);
    UI.toast('Chamado ' + t.id + ' aberto. Fila: ' +
      (Tickets.FILAS[t.fila] ? Tickets.FILAS[t.fila].label : t.fila) + '.', 'ok');
  }

  function responderChamado(id, texto) {
    var t = Tickets.getById(id);
    if (!t || String(t.empresa).toLowerCase() !== String(ctx.cliente).toLowerCase()) {
      UI.toast('Chamado não encontrado.', 'alerta');
      return;
    }
    Tickets.comentar(id, texto, ctx.user.nome, false, 'cliente');
    desenhar();
    atualizarBadges();
    UI.toast('Resposta enviada.', 'ok');
  }

  /* --- Boot -------------------------------------------------------------- */
  function montarTopo() {
    var chip = el('userChip');
    if (chip) {
      chip.innerHTML =
        '<span class="avatar">' + Fmt.esc(ctx.user.iniciais) + '</span>' +
        '<span class="user-txt"><strong>' + Fmt.esc(ctx.user.nome) + '</strong>' +
        '<small>' + Fmt.esc(ctx.cliente) + '</small></span>';
    }

    var marca = el('marcaCliente');
    if (marca) marca.textContent = ctx.cliente;

    var sair = el('btnSair');
    if (sair) {
      sair.addEventListener('click', function () {
        HiferaPortal.PortalAuthController.signOut();
      });
    }

    var menu = el('btnMenu');
    var side = el('side');
    if (menu && side) {
      menu.addEventListener('click', function (e) {
        e.stopPropagation();
        side.classList.toggle('is-open');
        menu.setAttribute('aria-expanded', String(side.classList.contains('is-open')));
      });
      document.addEventListener('click', function (e) {
        if (side.classList.contains('is-open') &&
            !side.contains(e.target) && e.target !== menu) {
          side.classList.remove('is-open');
          menu.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  function init() {
    if (!HiferaPortal.PortalAuthController.exigirSessao()) return;

    ctx = { cliente: Auth.getCliente(), user: Auth.getUser() };

    if (!HiferaAdmin.StoreModel.disponivel()) {
      UI.toast('Este navegador bloqueou o armazenamento — nada que você mudar aqui vai persistir.', 'alerta');
    }

    LeadsV.definirHandlers({
      mudarStatus: mudarStatusLead,
      anotar: anotarLead,
      exportar: exportarLeads
    });

    ChamadosV.definirHandlers({
      abrir: abrirChamado,
      responder: responderChamado
    });

    Projeto.definirHandlers({
      trocarProjeto: function (id) { navegar('#projeto/' + encodeURIComponent(id)); }
    });

    montarTopo();
    atualizarBadges();

    window.addEventListener('hashchange', desenhar);
    desenhar();
  }

  return { init: init };
})();
