/* =================================================================
   HIFERA ADMIN · Boot
   ================================================================= */
(function () {
  'use strict';

  HiferaAdmin.ProjectsController.init();

  /* Sidebar em telas estreitas */
  var btn  = document.getElementById('btnMenu');
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
