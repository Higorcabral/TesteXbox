/* ============================================================
   pages/subscriptions.js — assinaturas recorrentes
   ============================================================ */

import { state, getAccount, getCategory, updateSubscription } from '../state.js';
import { money, nextBillingDate } from '../helpers.js';
import { openSubscriptionModal } from '../modals/subscription.js';
import { renderPage } from '../router.js';

export function renderSubscriptions() {
  const active = state.subscriptions.filter(s => s.active);
  const paused = state.subscriptions.filter(s => !s.active);
  const monthlyTotal = active.reduce((s, sub) => s + sub.amount, 0);
  const yearlyTotal = monthlyTotal * 12;

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Assinaturas</div>
        <div class="page-sub">Cobranças recorrentes mensais</div>
      </div>
      <button class="page-action" id="newSubBtn">
        <span class="plus">+</span>
        <span>Nova assinatura</span>
      </button>
    </div>

    <div class="sub-summary">
      <div class="stat">
        <div class="stat-label">Total mensal</div>
        <div class="stat-value"><span class="currency">R$</span>${money(monthlyTotal)}</div>
        <div class="stat-sub">${active.length} ${active.length === 1 ? 'ativa' : 'ativas'}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total anual</div>
        <div class="stat-value"><span class="currency">R$</span>${money(yearlyTotal)}</div>
        <div class="stat-sub">projeção 12 meses</div>
      </div>
      <div class="stat">
        <div class="stat-label">Próxima cobrança</div>
        ${(() => {
          if (active.length === 0) return '<div class="stat-value" style="font-size: 18px; color: var(--text-tertiary);">—</div><div class="stat-sub">nenhuma ativa</div>';
          const next = active.map(s => ({ sub: s, date: nextBillingDate(s) })).sort((a, b) => a.date - b.date)[0];
          return `<div class="stat-value" style="font-size: 18px;">${next.sub.name}</div>
                  <div class="stat-sub">${next.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} · R$ ${money(next.sub.amount)}</div>`;
        })()}
      </div>
    </div>

    ${state.subscriptions.length === 0 ? `
      <div class="placeholder">
        <div class="placeholder-icon">∿</div>
        <div class="placeholder-title">Nenhuma assinatura ainda</div>
        <div class="placeholder-desc">Clique em "Nova assinatura" para controlar cobranças recorrentes como Netflix, Spotify, academia etc.</div>
      </div>
    ` : `
      ${active.length > 0 ? `
        <section>
          <div class="section-head">
            <div class="section-title">Ativas</div>
            <div class="section-sub">${active.length} cobrando</div>
          </div>
          <div class="sub-list">${active.map(renderSubCard).join('')}</div>
        </section>
      ` : ''}

      ${paused.length > 0 ? `
        <section>
          <div class="section-head">
            <div class="section-title">Pausadas</div>
            <div class="section-sub">${paused.length} inativas</div>
          </div>
          <div class="sub-list">${paused.map(renderSubCard).join('')}</div>
        </section>
      ` : ''}
    `}
  `;
}

function renderSubCard(sub) {
  const card = getAccount(sub.accountId);
  const cat = getCategory(sub.categoryId);
  const letter = sub.name.charAt(0).toUpperCase();
  const nextDate = nextBillingDate(sub);

  return `
    <div class="sub-card ${sub.active ? '' : 'paused'}">
      <div class="sub-icon" style="--icon-bg: ${cat?.color || '#888'}">${letter}</div>
      <div class="sub-body">
        <div class="sub-name">${sub.name}</div>
        <div class="sub-meta">
          <span>dia ${sub.billingDay}</span>
          <span class="dot">·</span>
          <span>${cat?.name || '—'}</span>
          <span class="dot">·</span>
          <span class="inst-card-tag" style="--card-color: ${card?.color || '#888'}">${card?.name.split(' ')[0] || '—'}</span>
        </div>
      </div>
      <div class="sub-next">
        <strong>${sub.active ? nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : 'pausada'}</strong>
        <span>${sub.active ? 'próxima' : '—'}</span>
      </div>
      <div class="sub-amount">R$ ${money(sub.amount)}</div>
      <div class="sub-actions">
        <label class="switch" title="${sub.active ? 'Pausar' : 'Ativar'}">
          <input type="checkbox" ${sub.active ? 'checked' : ''} data-toggle-sub="${sub.id}">
          <span class="slider"></span>
        </label>
        <button class="icon-btn" data-edit-sub="${sub.id}" title="Editar">✎</button>
      </div>
    </div>`;
}

export function bindSubscriptions() {
  document.getElementById('newSubBtn')?.addEventListener('click', () => openSubscriptionModal(null));

  document.querySelectorAll('[data-toggle-sub]').forEach(el => {
    el.addEventListener('change', () => {
      const id = parseInt(el.dataset.toggleSub);
      updateSubscription(id, { active: el.checked });
      renderPage();
    });
  });

  document.querySelectorAll('[data-edit-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = state.subscriptions.find(s => s.id === parseInt(btn.dataset.editSub));
      if (sub) openSubscriptionModal(sub);
    });
  });
}
