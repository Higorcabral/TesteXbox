/* =========================================================
   Rubra CRM — Controller principal
   Conecta o Model (CRM.Data) às Views, montando o painel.
   ========================================================= */

(function (global) {
  'use strict';

  const {
    Data,
    SidebarView, TopbarView,
    KpiView, PipelineView,
    DealsView, TasksView, ActivityView,
    ThemeController
  } = global.CRM;

  function el(id) { return document.getElementById(id); }

  const AppController = {
    init() {
      // Views estruturais
      SidebarView.render(el('sidebar'), Data);
      TopbarView .render(el('topbar'));

      // Views de conteúdo
      KpiView     .render(el('kpiGrid'),   Data.kpis);
      PipelineView.render(el('pipeline'),  Data.pipeline);
      DealsView   .render(el('deals'),     Data.deals);
      TasksView   .render(el('tasks'),     Data.tasks);
      ActivityView.render(el('activity'),  Data.activities);

      // Controllers de UI (dependem do DOM já pintado)
      ThemeController.init();
    }
  };

  global.CRM.AppController = AppController;
})(window);
