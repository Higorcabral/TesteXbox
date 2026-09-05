/* =================================================================
   HIFERA MÓDULOS · Chamados · Boot
   Módulo: Service Desk. Depende só de /modulos/core.
   ================================================================= */
(function () {
  'use strict';

  /* Em admin.hifera.com.br o auth-edge.js busca a identidade real
     antes de desenhar. Sem essa espera, a tela pisca com o usuário
     mockado. Local, a promessa não existe e o boot é imediato. */
  function iniciar() {

    HiferaAdmin.ThemeController.init();
    HiferaAdmin.Sidebar.init();
    HiferaAdmin.TicketsController.init();

    /* Selo com o que está em aberto, na navegação lateral */
    try {
      var p = HiferaAdmin.TicketsModel.panorama();
      var selo = document.getElementById('sideBadgeChamados');
      if (selo && p.emAberto) {
        selo.hidden = false;
        selo.textContent = String(p.emAberto);
        selo.className = 'side-badge' + (p.estourados ? ' is-alerta' : '');
        selo.title = p.emAberto + ' em aberto' + (p.estourados ? ', ' + p.estourados + ' fora do SLA' : '');
      }
    } catch (e) { /* sem chamados, sem selo */ }
  }

  var espera = window.HIFERA_AUTH_ESPERA;
  if (espera && typeof espera.then === 'function') espera.then(iniciar, iniciar);
  else iniciar();
})();
