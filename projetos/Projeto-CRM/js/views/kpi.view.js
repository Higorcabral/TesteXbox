/* =========================================================
   Rubra CRM — View: cartões de KPI
   ========================================================= */

(function (global) {
  'use strict';

  const { Icons } = global.CRM;

  function renderCard(kpi) {
    return `
      <div class="card kpi">
        <div class="kpi-label">
          <span class="ic">${Icons[kpi.icon] || ''}</span>
          ${kpi.label}
        </div>
        <div class="kpi-value">${kpi.value}</div>
        <div class="kpi-delta">
          <span class="delta ${kpi.deltaKind}">${kpi.deltaValue}</span>
          ${kpi.deltaLabel}
        </div>
        <svg class="kpi-spark" viewBox="0 0 100 40" preserveAspectRatio="none">
          <polyline points="${kpi.spark}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`;
  }

  const KpiView = {
    render(root, kpis) {
      root.innerHTML = kpis.map(renderCard).join('');
    }
  };

  global.CRM.KpiView = KpiView;
})(window);
