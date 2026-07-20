/* ============================================================
   pages/categories.js — gestão de categorias
   ============================================================ */

import { state, allTransactions } from '../state.js';
import { money, sameMonth } from '../helpers.js';
import { openCategoryModal } from '../modals/category.js';

export function renderCategoriesPage() {
  const tx = allTransactions();
  const monthTx = tx.filter(t => sameMonth(t.date));

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Categorias</div>
        <div class="page-sub">Organize seus gastos com categorias personalizadas</div>
      </div>
      <button class="page-action" id="newCatBtn">
        <span class="plus">+</span>
        <span>Nova categoria</span>
      </button>
    </div>

    <div class="cats-grid">
      ${state.categories.map(cat => {
        const count = tx.filter(t => t.categoryId === cat.id).length;
        const monthAmount = monthTx.filter(t => t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
        return `
          <div class="cat-card ${cat.system ? 'system' : ''}" style="--cat-color: ${cat.color}">
            <div class="cat-card-swatch"></div>
            <div class="cat-card-body">
              <div class="cat-card-name">${cat.name}</div>
              <div class="cat-card-meta">${count} ${count === 1 ? 'lançamento' : 'lançamentos'}${monthAmount > 0 ? ` · R$ ${money(monthAmount)} este mês` : ''}</div>
            </div>
            <div class="cat-card-actions">
              <button class="icon-btn" data-edit-cat="${cat.id}" title="Editar">✎</button>
            </div>
          </div>`;
      }).join('')}
    </div>

    <div style="margin-top: 20px; padding: 14px 18px; background: var(--bg-card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 0.5px solid var(--hairline); border-radius: var(--r-md); font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
      <strong style="color: var(--text); font-weight: 600;">Sobre categorias padrão:</strong> categorias marcadas como "padrão" são usadas pelo sistema e não podem ser excluídas — apenas renomeadas ou recoloridas. Ao excluir uma categoria com lançamentos, eles serão movidos para "Outros" automaticamente.
    </div>
  `;
}

export function bindCategoriesPage() {
  document.getElementById('newCatBtn')?.addEventListener('click', () => openCategoryModal(null));

  document.querySelectorAll('[data-edit-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = state.categories.find(c => c.id === btn.dataset.editCat);
      if (cat) openCategoryModal(cat);
    });
  });
}
