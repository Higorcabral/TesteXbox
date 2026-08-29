/* =================================================================
   HIFERA PORTAL · Boot do painel do cliente
   Ordem: tema → controller. O menu lateral é do próprio
   PortalController (o Sidebar do painel interno assume ids que aqui
   não existem).
   ================================================================= */
(function () {
  'use strict';
  HiferaAdmin.ThemeController.init();
  HiferaPortal.PortalController.init();
})();
