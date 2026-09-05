/* =================================================================
   HIFERA MÓDULOS · Admin · Boot
   Módulo: Gestão de Projetos. Depende só de /modulos/core.
   ================================================================= */
(function () {
  'use strict';

  /* Em admin.hifera.com.br o auth-edge.js busca a identidade real
     antes de desenhar. Sem essa espera, a tela pisca com o usuário
     mockado. Local, a promessa não existe e o boot é imediato. */
  function iniciar() {

    HiferaAdmin.ThemeController.init();
    HiferaAdmin.Sidebar.init();
    HiferaAdmin.ProjectsController.init();
  }

  var espera = window.HIFERA_AUTH_ESPERA;
  if (espera && typeof espera.then === 'function') espera.then(iniciar, iniciar);
  else iniciar();
})();
