/* =========================================================
   Rubra CRM — View: Minhas tarefas
   ========================================================= */

(function (global) {
  'use strict';

  const { Icons } = global.CRM;

  function renderTask(t) {
    return `
      <label class="task">
        <input type="checkbox" ${t.done ? 'checked' : ''}/>
        <div class="task-content">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            <span class="pill neutral">${t.kind}</span>
            <span class="dot-sep">·</span>
            <span class="task-due ${t.dueKind}">${t.due}</span>
          </div>
        </div>
      </label>`;
  }

  const TasksView = {
    render(root, tasks) {
      root.innerHTML = `
        <div class="card-head">
          <div>
            <h3>Minhas tarefas</h3>
            <div class="sub">3 vencem hoje</div>
          </div>
          <button class="icon-btn" aria-label="Adicionar tarefa">${Icons.plusBold}</button>
        </div>
        <div class="task-list">
          ${tasks.map(renderTask).join('')}
        </div>
        <div class="card-foot"><a href="#">Ver todas as tarefas →</a></div>
      `;
    }
  };

  global.CRM.TasksView = TasksView;
})(window);
