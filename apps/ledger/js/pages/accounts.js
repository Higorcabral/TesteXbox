/* ============================================================
   pages/accounts.js — gestão de contas (crédito/débito/pix/cash/benefit)
   ============================================================ */

import { state, allTransactions, getBenefitBalance, getBenefitMonthTopup } from '../state.js';
import { ACCOUNT_TYPES } from '../config.js';
import { today, money, moneyShort, sameMonth } from '../helpers.js';
import { openAccountModal } from '../modals/account.js';
import { openTopupModal } from '../modals/topup.js';

export function renderAccounts() {
  const tx = allTransactions();
  const monthTx = tx.filter(t => sameMonth(t.date));

  // Agrupar por tipo
  const byType = { credit: [], debit: [], pix: [], cash: [], benefit: [] };
  state.accounts.forEach(a => {
    if (byType[a.type]) byType[a.type].push(a);
  });

  const renderCard = (account) => {
    const spent = monthTx.filter(t => t.accountId === account.id).reduce((s, t) => s + t.amount, 0);
    const typeInfo = ACCOUNT_TYPES[account.type] || { badge: '—' };

    // Card especial pra contas de benefício
    if (account.type === 'benefit') {
      const balance = getBenefitBalance(account.id);
      const thisMonthTopup = getBenefitMonthTopup(account.id, today);
      return `
        <div class="card benefit-card" style="--card-color: ${account.color}">
          <div class="card-head">
            <div class="card-name">${account.name}</div>
            <div class="card-type-badge">${typeInfo.badge}</div>
          </div>
          <div class="benefit-balance-label">Saldo disponível</div>
          <div class="card-value benefit-balance ${balance < 0 ? 'negative' : ''}">
            <span class="currency">R$</span>${money(Math.max(0, balance))}
          </div>
          <div class="benefit-stats">
            <div class="benefit-stat">
              <span class="benefit-stat-label">Gasto no mês</span>
              <span class="benefit-stat-value">R$ ${money(spent)}</span>
            </div>
            <div class="benefit-stat">
              <span class="benefit-stat-label">Recarga no mês</span>
              <span class="benefit-stat-value">R$ ${money(thisMonthTopup)}</span>
            </div>
          </div>
          <div class="benefit-actions">
            <button class="benefit-btn primary" data-topup-account="${account.id}">+ Recarga</button>
            <button class="benefit-btn" data-edit-account="${account.id}">Editar</button>
          </div>
        </div>`;
    }

    // Card padrão (crédito, débito, pix, cash)
    const pct = account.limit ? Math.min(100, (spent / account.limit) * 100) : 0;
    return `
      <div class="card" style="--card-color: ${account.color}" data-edit-account="${account.id}">
        <div class="card-head">
          <div class="card-name">${account.name}</div>
          <div class="card-type-badge">${typeInfo.badge}</div>
        </div>
        <div class="card-value"><span class="currency">R$</span>${money(spent)}</div>
        ${account.limit ? `
          <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
          <div class="card-meta">
            <span>usado no mês</span>
            <span>limite R$ ${moneyShort(account.limit)}</span>
          </div>
          ${account.closingDay ? `<div class="card-dates">fecha dia ${account.closingDay} · vence dia ${account.dueDay || '—'}</div>` : ''}
        ` : `
          <div class="card-meta">
            <span>gasto no mês</span>
            <span>—</span>
          </div>
        `}
      </div>`;
  };

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Contas</div>
        <div class="page-sub">Cartões, débito, Pix, dinheiro e benefícios</div>
      </div>
      <button class="page-action" id="newAccountBtn">
        <span class="plus">+</span>
        <span>Nova conta</span>
      </button>
    </div>

    ${state.accounts.length === 0 ? `
      <div class="placeholder">
        <div class="placeholder-icon">∅</div>
        <div class="placeholder-title">Nenhuma conta cadastrada</div>
        <div class="placeholder-desc">Adicione cartões, débito, Pix, dinheiro ou vale-refeição para começar.</div>
      </div>
    ` : Object.entries(byType).map(([type, accounts]) => {
      if (accounts.length === 0) return '';
      return `
        <section>
          <div class="section-head">
            <div class="section-title">${ACCOUNT_TYPES[type].label}</div>
            <div class="section-sub">${accounts.length}</div>
          </div>
          <div class="cards-grid">${accounts.map(renderCard).join('')}</div>
        </section>
      `;
    }).join('')}
  `;
}

export function bindAccounts() {
  document.getElementById('newAccountBtn')?.addEventListener('click', () => openAccountModal(null));

  // Editar conta (clique no card ou botão "Editar")
  document.querySelectorAll('[data-edit-account]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const acc = state.accounts.find(a => a.id === el.dataset.editAccount);
      if (acc) openAccountModal(acc);
    });
  });

  // Recarga
  document.querySelectorAll('[data-topup-account]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTopupModal(btn.dataset.topupAccount);
    });
  });
}
