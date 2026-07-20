/* ============================================================
   pages/goals.js — metas/limites por categoria
   ============================================================ */

import { state, allTransactions, getCategory, setGoal, removeGoal } from '../state.js';
import { money, sameMonth } from '../helpers.js';
import { openGoalModal } from '../modals/goal.js';
import { renderPage } from '../router.js';

export function renderGoals() {
  const monthTx = allTransactions().filter(t => sameMonth(t.date));

  // Totais gastos por categoria este mês
  const spentByCategory = {};
  monthTx.forEach(t => {
    spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] || 0) + t.amount;
  });

  const totalLimit = state.goals.reduce((s, g) => s + g.limit, 0);
  const totalSpent = state.goals.reduce((s, g) => s + (spentByCategory[g.categoryId] || 0), 0);

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Metas</div>
        <div class="page-sub">Limites mensais de gasto por categoria</div>
      </div>
      <button class="page-action" id="newGoalBtn">
        <span class="plus">+</span>
        <span>Nova meta</span>
      </button>
    </div>

    ${state.goals.length > 0 ? `
      <div class="mini-stats" style="grid-template-columns: 1fr 1fr;">
        <div class="stat">
          <div class="stat-label">Total de limites</div>
          <div class="stat-value"><span class="currency">R$</span>${money(totalLimit)}</div>
          <div class="stat-sub">${state.goals.length} ${state.goals.length === 1 ? 'meta' : 'metas'}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Gasto dentro das metas</div>
          <div class="stat-value"><span class="currency">R$</span>${money(totalSpent)}</div>
          <div class="stat-sub">${totalLimit > 0 ? ((totalSpent / totalLimit) * 100).toFixed(0) + '% dos limites' : '—'}</div>
        </div>
      </div>
    ` : ''}

    ${state.goals.length === 0 ? `
      <div class="placeholder">
        <div class="placeholder-icon">◎</div>
        <div class="placeholder-title">Nenhuma meta cadastrada</div>
        <div class="placeholder-desc">Defina limites mensais de gasto por categoria. Ex.: "no máximo R$ 800 em alimentação por mês". O sistema te avisa quando você se aproxima ou ultrapassa.</div>
      </div>
    ` : `
      <div class="goal-list">
        ${state.goals.map(goal => {
          const cat = getCategory(goal.categoryId);
          if (!cat) return '';
          const spent = spentByCategory[goal.categoryId] || 0;
          const pct = goal.limit > 0 ? (spent / goal.limit) * 100 : 0;
          const displayPct = Math.min(pct, 100);
          const over = pct > 100;
          const warning = pct > 80 && pct <= 100;
          const remaining = goal.limit - spent;

          return `
            <div class="goal-card">
              <div class="goal-head">
                <div class="goal-title">
                  <span class="cat-dot" style="--cat-color: ${cat.color}"></span>
                  <span>${cat.name}</span>
                </div>
                <div class="goal-amounts">
                  <strong>R$ ${money(spent)}</strong> de R$ ${money(goal.limit)}
                </div>
              </div>
              <div class="goal-bar">
                <div class="goal-bar-fill ${over ? 'over' : (warning ? 'warning' : '')}" style="--cat-color: ${cat.color}; width: ${displayPct}%"></div>
              </div>
              <div class="goal-footer">
                <span class="pct ${over ? 'over' : (warning ? 'warning' : '')}">${pct.toFixed(0)}% usado ${over ? '⚠ acima da meta' : (warning ? '· perto do limite' : '')}</span>
                <span>${remaining >= 0 ? `R$ ${money(remaining)} restantes` : `R$ ${money(Math.abs(remaining))} acima`}</span>
              </div>
              <div style="display: flex; gap: 6px; margin-top: 12px; justify-content: flex-end;">
                <button class="icon-btn" data-edit-goal="${goal.categoryId}" title="Editar">✎</button>
                <button class="icon-btn" data-delete-goal="${goal.categoryId}" title="Remover" style="color: var(--sys-red);">✕</button>
              </div>
            </div>`;
        }).join('')}
      </div>
    `}
  `;
}

export function bindGoals() {
  document.getElementById('newGoalBtn')?.addEventListener('click', () => openGoalModal(null));

  document.querySelectorAll('[data-edit-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goal = state.goals.find(g => g.categoryId === btn.dataset.editGoal);
      if (goal) openGoalModal(goal);
    });
  });

  document.querySelectorAll('[data-delete-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.deleteGoal;
      const cat = getCategory(catId);
      if (confirm(`Remover meta da categoria "${cat?.name || catId}"?`)) {
        removeGoal(catId);
        renderPage();
      }
    });
  });
}
