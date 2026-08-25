/* =================================================================
   HIFERA MÓDULOS · Chamados · Boot
   Módulo: Service Desk. Depende só de /modulos/core.
   ================================================================= */
(function () {
  'use strict';

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
})();
