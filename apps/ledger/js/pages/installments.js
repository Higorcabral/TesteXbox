/* ============================================================
   pages/installments.js — compras parceladas
   ============================================================ */

import { state, expandInstallments, getAccount, getCategory, removeInstallmentGroup, commit } from '../state.js';
import { today, money } from '../helpers.js';
import { showUndoToast } from '../toast.js';
import { renderPage } from '../router.js';

export function renderInstallments() {
  const today0 = today.toISOString().split('T')[0];

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Parcelamentos</div>
        <div class="page-sub">Todas as suas compras parceladas ativas</div>
      </div>
    </div>

    ${state.installmentGroups.length === 0 ? `
      <div class="placeholder">
        <div class="placeholder-icon">—</div>
        <div class="placeholder-title">Nenhum parcelamento ativo</div>
        <div class="placeholder-desc">Clique em "Novo lançamento" e escolha a aba "Parcelado" para registrar uma compra em parcelas.</div>
      </div>
    ` : `
      <div class="inst-list">
        ${state.installmentGroups.map(g => {
          const paid = expandInstallments(g).filter(i => i.date <= today0).length;
          const remaining = g.count - paid;
          const pct = (paid / g.count) * 100;
          const card = getAccount(g.accountId);
          const cat = getCategory(g.categoryId);
          const perInst = g.totalAmount / g.count;
          return `
            <div class="inst-card">
              <div class="inst-main">
                <div class="inst-desc">${g.desc}</div>
                <div class="inst-meta">
                  <span class="inst-card-tag" style="--card-color: ${card?.color || '#888'}">${card?.name || '—'}</span>
                  <span class="dot">·</span>
                  <span>${cat?.name || '—'}</span>
                  <span class="dot">·</span>
                  <span>iniciado em ${new Date(g.startDate + 'T00:00').toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div class="inst-progress">
                <div class="inst-progress-head">
                  <span>${paid}/${g.count} pagas</span>
                  <span>${remaining} restantes</span>
                </div>
                <div class="inst-progress-bar">
                  <div class="inst-progress-fill" style="width: ${pct}%"></div>
                </div>
              </div>
              <div class="inst-amounts">
                <div class="inst-total">R$ ${money(g.totalAmount)}</div>
                <div class="inst-installment">${g.count}× R$ ${money(perInst)}</div>
              </div>
              <button class="inst-delete" data-group-id="${g.id}" title="Excluir">✕</button>
            </div>`;
        }).join('')}
      </div>
    `}
  `;
}

export function bindInstallments() {
  document.querySelectorAll('.inst-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.groupId);
      const group = state.installmentGroups.find(g => g.id === id);
      if (!group) return;
      if (confirm(`Remover "${group.desc}"? Todas as ${group.count} parcelas serão apagadas.`)) {
        const backup = { ...group };
        removeInstallmentGroup(id);
        renderPage();
        showUndoToast(`"${backup.desc}" removido`, () => {
          state.installmentGroups.push(backup);
          commit();
          renderPage();
        });
      }
    });
  });
}
