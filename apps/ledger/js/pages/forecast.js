/* ============================================================
   pages/forecast.js — projeção de gastos dos próximos meses
   ============================================================ */

import { state, expandInstallments, expandSubscriptions, totalMonthlyIncome } from '../state.js';
import { today, money, capitalize } from '../helpers.js';

export function renderForecast() {
  const totalIncome = totalMonthlyIncome();
  // Projeta próximos 6 meses (mês atual + 5)
  const months = [];
  for (let offset = 0; offset < 6; offset++) {
    const ref = new Date(today);
    ref.setDate(1);
    ref.setMonth(ref.getMonth() + offset);
    months.push(ref);
  }

  const allInstallments = state.installmentGroups.flatMap(expandInstallments);

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Previsão</div>
        <div class="page-sub">O que já está carimbado pros próximos meses</div>
      </div>
    </div>

    <div class="forecast-grid">
      ${months.slice(0, 3).map(refDate => renderMonthCard(refDate, allInstallments, totalIncome)).join('')}
    </div>

    <div class="section-head">
      <div class="section-title">Seguintes</div>
      <div class="section-sub">+3 meses à frente</div>
    </div>
    <div class="forecast-grid">
      ${months.slice(3, 6).map(refDate => renderMonthCard(refDate, allInstallments, totalIncome)).join('')}
    </div>

    <div style="margin-top: 24px; padding: 14px 18px; background: var(--bg-card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 0.5px solid var(--hairline); border-radius: var(--r-md); font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
      <strong style="color: var(--text); font-weight: 600;">Como funciona:</strong> a projeção inclui apenas compromissos fixos já conhecidos — parcelas futuras de compras registradas e assinaturas ativas. Não estima gastos variáveis (mercado, iFood, etc.), então os valores reais tendem a ser maiores.
    </div>
  `;
}

function renderMonthCard(refDate, allInstallments, totalIncome) {
  const isCurrent = refDate.getMonth() === today.getMonth() && refDate.getFullYear() === today.getFullYear();

  // Parcelas que caem neste mês
  const instInMonth = allInstallments.filter(i => {
    const d = new Date(i.date + 'T00:00');
    return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
  });
  const instTotal = instInMonth.reduce((s, i) => s + i.amount, 0);

  // Assinaturas que cairão neste mês
  const subs = expandSubscriptions(refDate);
  const subTotal = subs.reduce((s, t) => s + t.amount, 0);

  const total = instTotal + subTotal;
  const remaining = totalIncome - total;

  const monthName = capitalize(refDate.toLocaleDateString('pt-BR', { month: 'long' }));
  const year = refDate.getFullYear() !== today.getFullYear() ? ` ${refDate.getFullYear()}` : '';

  return `
    <div class="forecast-month ${isCurrent ? 'current' : ''}">
      <div class="forecast-month-name">${monthName}${year}${isCurrent ? ' · agora' : ''}</div>
      <div class="forecast-total"><span class="currency">R$</span>${money(total)}</div>
      <div class="forecast-breakdown">
        <div class="forecast-breakdown-row">
          <span>Parcelas (${instInMonth.length})</span>
          <span>R$ ${money(instTotal)}</span>
        </div>
        <div class="forecast-breakdown-row">
          <span>Assinaturas (${subs.length})</span>
          <span>R$ ${money(subTotal)}</span>
        </div>
        ${totalIncome > 0 ? `
          <div class="forecast-breakdown-row" style="border-top: 0.5px solid var(--separator); padding-top: 6px; margin-top: 4px;">
            <span style="color: var(--text);">Livre estimado</span>
            <span style="color: ${remaining >= 0 ? 'var(--sys-green)' : 'var(--sys-red)'}; font-weight: 600;">R$ ${money(remaining)}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function bindForecast() {
  // sem bindings específicos
}
