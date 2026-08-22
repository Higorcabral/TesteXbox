/* =================================================================
   HIFERA ADMIN · Boot · Chamados
   ================================================================= */
(function () {
  'use strict';

  HiferaAdmin.ThemeController.init();
  HiferaAdmin.TicketsController.init();

  /* Selo com o que está fora do SLA, na navegação lateral */
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

  var btn = document.getElementById('btnMenu');
  var side = document.getElementById('side');
  if (btn && side) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var aberto = side.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(aberto));
    });
    document.addEventListener('click', function (e) {
      if (side.classList.contains('is-open') && !side.contains(e.target) && e.target !== btn) {
        side.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();
