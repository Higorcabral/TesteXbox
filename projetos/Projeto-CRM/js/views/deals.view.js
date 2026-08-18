/* =========================================================
   Rubra CRM — View: Tabela de negócios recentes
   ========================================================= */

(function (global) {
  'use strict';

  const { Icons } = global.CRM;

  function renderRow(d) {
    const valueCell = d.lost
      ? `<td class="cell-strong cell-lost">${d.value}</td>`
      : `<td class="cell-strong">${d.value}</td>`;

    const fillClass = d.lost ? 'progress-fill lost' : 'progress-fill';

    return `
      <tr>
        <td>
          <div class="company">
            <div class="company-logo" style="background:${d.color}">${d.logo}</div>
            <div class="company-info">
              <div class="company-name">${d.name}</div>
              <div class="company-owner">${d.owner}</div>
            </div>
          </div>
        </td>
        <td><span class="pill ${d.stageKind}">${d.stage}</span></td>
        ${valueCell}
        <td>
          <div class="progress">
            <div class="progress-bar"><div class="${fillClass}" style="width:${d.probability}%"></div></div>
            <span class="progress-val">${d.probability}%</span>
          </div>
        </td>
        <td>${d.closeDate}</td>
      </tr>`;
  }

  const DealsView = {
    render(root, deals) {
      root.innerHTML = `
        <div class="card-head">
          <div>
            <h3>Negócios recentes</h3>
            <div class="sub">Ordenados por última atualização</div>
          </div>
          <button class="btn">${Icons.filter} Filtrar</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Probabilidade</th>
                <th>Fechamento</th>
              </tr>
            </thead>
            <tbody>
              ${deals.map(renderRow).join('')}
            </tbody>
          </table>
        </div>
        <div class="card-foot"><a href="#">Ver todos os 37 negócios →</a></div>
      `;
    }
  };

  global.CRM.DealsView = DealsView;
})(window);
