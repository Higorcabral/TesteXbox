/* =========================================================
   Rubra CRM — View: Atividade recente
   ========================================================= */

(function (global) {
  'use strict';

  const { Icons } = global.CRM;

  const KIND_ICON = {
    deal:  Icons.checkBold,
    email: Icons.mail,
    call:  Icons.phone,
    note:  Icons.note
  };

  function renderActivity(a) {
    return `
      <div class="activity">
        <div class="activity-icon ${a.kind}">${KIND_ICON[a.kind] || ''}</div>
        <div>
          <div class="activity-body">${a.html}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      </div>`;
  }

  const ActivityView = {
    render(root, activities) {
      root.innerHTML = `
        <div class="card-head">
          <div>
            <h3>Atividade recente</h3>
            <div class="sub">Últimas 24 horas</div>
          </div>
        </div>
        <div class="activity-list">
          ${activities.map(renderActivity).join('')}
        </div>
        <div class="card-foot"><a href="#">Ver histórico completo →</a></div>
      `;
    }
  };

  global.CRM.ActivityView = ActivityView;
})(window);
