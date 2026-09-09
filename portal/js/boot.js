/* =================================================================
   HIFERA PORTAL · Boot do painel do cliente
   Ordem: tema → sessão → controller. O menu lateral é do próprio
   PortalController (o Sidebar do painel interno assume ids que aqui
   não existem).

   A sessão é resolvida ANTES do controller porque ela é assíncrona
   (token do Supabase e vínculo com o cliente vêm da rede) e todas as
   telas leem cliente/usuário de forma síncrona. Renderizar antes disso
   mostraria o painel vazio de quem, um instante depois, seria mandado
   para a tela de entrada.
   ================================================================= */
(function () {
  'use strict';
  HiferaAdmin.ThemeController.init();
  HiferaPortal.ClientAuthModel.restaurar()
    .then(function () { HiferaPortal.PortalController.init(); })
    .catch(function () { HiferaPortal.PortalController.init(); });
})();
