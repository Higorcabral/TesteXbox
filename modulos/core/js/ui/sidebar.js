/* =================================================================
   HIFERA MÓDULOS · Core · UI · Menu lateral
   -----------------------------------------------------------------
   Abaixo de tablet a barra lateral vira gaveta. Este comportamento
   era copiado igual nos dois boots (admin e chamados); agora mora
   aqui e cada módulo só chama init().
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.Sidebar = (function () {
  'use strict';

  function init() {
    var btn  = document.getElementById('btnMenu');
    var side = document.getElementById('side');
    if (!btn || !side) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var aberto = side.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(aberto));
    });

    /* Clique fora fecha a gaveta */
    document.addEventListener('click', function (e) {
      if (side.classList.contains('is-open') && !side.contains(e.target) && e.target !== btn) {
        side.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  return { init: init };
})();
