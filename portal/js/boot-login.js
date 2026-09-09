/* =================================================================
   HIFERA PORTAL · Boot da tela de entrada
   -----------------------------------------------------------------
   A sessão precisa estar resolvida antes de a tela escolher o que
   mostrar: é a restauração que diz se há magic link voltando na URL,
   se já existe sessão válida e se o Supabase está configurado.
   ================================================================= */
(function () {
  'use strict';
  HiferaAdmin.ThemeController.init();
  HiferaPortal.ClientAuthModel.restaurar()
    .then(function () { HiferaPortal.PortalAuthController.initLogin(); })
    .catch(function () { HiferaPortal.PortalAuthController.initLogin(); });
})();
