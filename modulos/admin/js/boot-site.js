/* =================================================================
   HIFERA MÓDULOS · Admin · Boot · Site oficial
   -----------------------------------------------------------------
   Mesma ordem dos outros boots: tema, sidebar, controller. E a mesma
   espera pela identidade real — em admin.hifera.com.br o auth-edge.js
   resolve /.auth/me antes de desenhar; local a promessa não existe e o
   boot acontece na hora.
   ================================================================= */
(function () {
  'use strict';

  function iniciar() {
    HiferaAdmin.ThemeController.init();
    HiferaAdmin.Sidebar.init();
    HiferaAdmin.SiteController.init();
  }

  var espera = window.HIFERA_AUTH_ESPERA;
  if (espera && typeof espera.then === 'function') espera.then(iniciar, iniciar);
  else iniciar();
})();
