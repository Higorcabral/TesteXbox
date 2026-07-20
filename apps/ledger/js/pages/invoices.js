/* ============================================================
   pages/invoices.js — faturas mensais com lógica de fechamento
   ============================================================ */

import { state, allTransactions, getCategory } from '../state.js';
import { today, money, monthLabel, shortDate, invoiceMonthForPurchase, capitalize } from '../helpers.js';
import { renderPage } from '../router.js';

let invoiceMonthOffset = 0;

export function renderInvoices() {
  const refDate = new Date(today);
  refDate.setDate(1);
  refDate.setMonth(refDate.getMonth() + invoiceMonthOffset);

  const creditAccounts = state.accounts.filter(a => a.type === 'credit');
  const tx = allTransactions(refDate);

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Faturas</div>
        <div class="page-sub">Cada fatura respeita a data de fechamento do seu cartão</div>
      </div>
    </div>

    <div class="invoice-switcher">
      <button id="prevMonth" title="Mês anterior">←</button>
      <div class="invoice-month">${capitalize(monthLabel(refDate))}</div>
      <button id="nextMonth" title="Próximo mês">→</button>
      ${invoiceMonthOffset !== 0 ? '<button id="currentMonth" title="Hoje" style="width: auto; padding: 0 12px; font-size: 12px;">Hoje</button>' : ''}
    </div>

    ${creditAccounts.length === 0 ? `
      <div class="placeholder">
        <div class="placeholder-icon">∅</div>
        <div class="placeholder-title">Nenhum cartão de crédito cadastrado</div>
        <div class="placeholder-desc">Faturas são específicas de cartões de crédito. Vá em "Contas" e adicione um cartão para começar.</div>
      </div>
    ` : `
      <div class="invoice-cards">
        ${creditAccounts.map(card => {
          // Seleciona transações que caem NA FATURA deste mês, considerando o fechamento
          const items = tx.filter(t => {
            if (t.accountId !== card.id) return false;
            const invMonth = invoiceMonthForPurchase(t.date, card.closingDay || 1);
            return invMonth.getMonth() === refDate.getMonth() && invMonth.getFullYear() === refDate.getFullYear();
          }).sort((a, b) => a.date.localeCompare(b.date));

          const total = items.reduce((s, t) => s + t.amount, 0);

          // Datas de fechamento e vencimento desta fatura
          const closingDate = new Date(refDate);
          closingDate.setMonth(closingDate.getMonth() - 1);
          closingDate.setDate(card.closingDay || 1);
          const dueDate = new Date(refDate);
          dueDate.setDate(card.dueDay || 1);

          return `
            <div class="invoice-card">
              <div class="invoice-card-head">
                <strong style="--card-color: ${card.color}">${card.name}</strong>
                <div class="invoice-total">R$ ${money(total)}</div>
              </div>
              ${card.closingDay ? `
                <div class="invoice-dates">
                  fechou em ${closingDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')} ·
                  vence em ${dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                </div>
              ` : ''}
              <div class="invoice-lines">
                ${items.length === 0 ? '<div class="invoice-empty">Sem lançamentos nesta fatura.</div>' : items.map(t => {
                  const cat = getCategory(t.categoryId);
                  let extra = '';
                  if (t.isInstallment) extra = ` · parcela ${t.installmentNumber}/${t.installmentTotal}`;
                  else if (t.isSubscription) extra = ` · assinatura`;
                  return `
                    <div class="invoice-line">
                      <div>
                        <div class="invoice-line-desc">${t.desc}</div>
                        <div class="invoice-line-meta">${shortDate(t.date)} · ${cat?.name || '—'}${extra}</div>
                        ${t.note ? `<div class="invoice-line-note">💬 ${escapeHtmlInv(t.note)}</div>` : ''}
                      </div>
                      <div class="invoice-line-amount">R$ ${money(t.amount)}</div>
                    </div>`;
                }).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>
    `}
  `;
}

function escapeHtmlInv(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function bindInvoices() {
  document.getElementById('prevMonth')?.addEventListener('click', () => { invoiceMonthOffset--; renderPage(); });
  document.getElementById('nextMonth')?.addEventListener('click', () => { invoiceMonthOffset++; renderPage(); });
  document.getElementById('currentMonth')?.addEventListener('click', () => { invoiceMonthOffset = 0; renderPage(); });
}
