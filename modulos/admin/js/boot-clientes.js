/* =================================================================
   HIFERA MÓDULOS · Admin · Boot · Clientes \& Leads
   -----------------------------------------------------------------
   Mesma ordem do boot.js: tema, sidebar, controller. E a mesma espera
   pela identidade real — em admin.hifera.com.br o auth-edge.js busca
   /.auth/me antes de desenhar, e sem esperar por ele o chip do topo
   pisca com o usuário mockado. Local a promessa não existe e o boot
   acontece na hora.
   ================================================================= */
(function () {
  'use strict';

  function iniciar() {
    HiferaAdmin.ThemeController.init();
    HiferaAdmin.Sidebar.init();
    HiferaAdmin.ClientesController.init();
  }

  var espera = window.HIFERA_AUTH_ESPERA;
  if (espera && typeof espera.then === 'function') espera.then(iniciar, iniciar);
  else iniciar();
})();
