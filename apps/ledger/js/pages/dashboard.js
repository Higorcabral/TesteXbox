/* ============================================================
   pages/dashboard.js — página inicial com navegação de mês
   ============================================================ */

import { state, allTransactions, getAccount, getCategory, totalMonthlyIncome, removeTransaction, removeInstallmentGroup, updateSubscription, commit, getBenefitBalance } from '../state.js';
import { today, money, moneyShort, lastNDays, hexToRgba, daysRemainingInMonth, shortDate, capitalize } from '../helpers.js';
import { renderExpenseChart } from '../chart.js';
import { openIncomeModal } from '../modals/income.js';
import { showUndoToast } from '../toast.js';
import { renderPage } from '../router.js';

// Offset de mês visualizado (0 = atual, -1 = mês passado, +1 = próximo)
let monthOffset = 0;

/** Retorna a data de referência (dia 1 do mês selecionado) */
function getRefDate() {
  const d = new Date(today);
  d.setDate(1);
  d.setMonth(d.getMonth() + monthOffset);
  return d;
}

/** Filtra transações que caem no mês de referência */
function isInRefMonth(dateStr, refDate) {
  const d = new Date(dateStr + 'T00:00');
  return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
}

/** Quantos dias tem o mês de referência */
function daysInMonth(refDate) {
  return new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
}

export function renderDashboard() {
  const refDate = getRefDate();
  const isCurrentMonth = monthOffset === 0;
  const isPastMonth = monthOffset < 0;
  const isFutureMonth = monthOffset > 0;

  const tx = allTransactions(refDate);

  // Identificar IDs de contas de benefício — gastos delas NÃO entram no "dinheiro livre"
  const benefitAccountIds = state.accounts.filter(a => a.type === 'benefit').map(a => a.id);
  const isBenefitTx = (t) => benefitAccountIds.includes(t.accountId);

  // monthTx no contexto financeiro = exclui gastos de benefício
  const monthTxAll = tx.filter(t => isInRefMonth(t.date, refDate));
  const monthTx = monthTxAll.filter(t => !isBenefitTx(t));
  const monthTxBenefit = monthTxAll.filter(t => isBenefitTx(t));

  const monthTotal = monthTx.reduce((s, t) => s + t.amount, 0);
  const totalIncome = totalMonthlyIncome();
  const available = totalIncome - monthTotal;
  const pctUsed = totalIncome > 0 ? Math.min(100, (monthTotal / totalIncome) * 100) : 0;

  const instThisMonth = monthTx.filter(t => t.isInstallment).reduce((s, t) => s + t.amount, 0);
  const subsThisMonth = monthTx.filter(t => t.isSubscription).reduce((s, t) => s + t.amount, 0);
  const singleThisMonth = monthTx.filter(t => !t.isInstallment && !t.isSubscription).reduce((s, t) => s + t.amount, 0);

  const benefitThisMonth = monthTxBenefit.reduce((s, t) => s + t.amount, 0);

  // Métricas específicas do mês atual (só fazem sentido pra hoje)
  const daysLeft = daysRemainingInMonth();
  const canSpendPerDay = daysLeft > 0 && available > 0 ? available / daysLeft : 0;
  const dayOfMonth = today.getDate();
  const totalDaysRef = daysInMonth(refDate);

  // Média diária: no mês atual divide pelo dia de hoje; em outros meses divide pelos dias cheios
  const divisorMedia = isCurrentMonth ? dayOfMonth : totalDaysRef;

  // Semana: só faz sentido no mês atual (últimos 7 dias reais)
  const weekTotal = isCurrentMonth
    ? tx.filter(t => lastNDays(t.date, 7)).reduce((s, t) => s + t.amount, 0)
    : 0;

  const monthName = refDate.toLocaleDateString('pt-BR', { month: 'long' });
  const yearLabel = refDate.getFullYear() !== today.getFullYear() ? ` ${refDate.getFullYear()}` : '';

  // Sub-título contextual dependendo da situação
  let subtitle;
  if (isCurrentMonth) {
    subtitle = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } else if (isPastMonth) {
    subtitle = `Histórico · ${Math.abs(monthOffset)} ${Math.abs(monthOffset) === 1 ? 'mês atrás' : 'meses atrás'}`;
  } else {
    subtitle = `Previsão · daqui a ${monthOffset} ${monthOffset === 1 ? 'mês' : 'meses'}`;
  }

  // Label do saldo se adapta ao contexto
  let balanceLabel;
  if (isCurrentMonth) {
    balanceLabel = available >= 0 ? 'Dinheiro livre no mês' : 'Você está negativo';
  } else if (isPastMonth) {
    balanceLabel = available >= 0 ? 'Sobra do mês' : 'Ficou negativo';
  } else {
    balanceLabel = 'Previsão de sobra';
  }

  // Só cartões de crédito no bloco principal
  const creditAccounts = state.accounts.filter(a => a.type === 'credit');

  return `
    <div class="page-header">
      <div>
        <div class="page-title-wrap">
          <button class="month-nav-btn" id="prevMonthBtn" title="Mês anterior">←</button>
          <div class="page-title">${capitalize(monthName)}${yearLabel}</div>
          <button class="month-nav-btn" id="nextMonthBtn" title="Próximo mês">→</button>
          ${!isCurrentMonth ? '<button class="month-today-btn" id="todayBtn" title="Voltar pro mês atual">Hoje</button>' : ''}
        </div>
        <div class="page-sub">${subtitle}</div>
      </div>
    </div>

    <div class="hero-balance ${isFutureMonth ? 'future' : ''} ${isPastMonth ? 'past' : ''}">
      <div class="balance-grid">
        <div class="balance-main">
          <div class="balance-label">${balanceLabel}</div>
          <div class="balance-value ${available >= 0 ? 'positive' : 'negative'}">
            <span class="currency">R$</span>${money(Math.abs(available))}
          </div>
          ${isCurrentMonth && daysLeft > 0 && available > 0 ? `
            <div class="balance-daily">
              <span>Podes gastar</span>
              <strong>R$ ${money(canSpendPerDay)}/dia</strong>
              <span>pelos próximos ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}</span>
            </div>
          ` : ''}
          ${isFutureMonth ? `
            <div class="balance-daily">
              <span>⚠ Projeção inclui apenas</span>
              <strong>compromissos fixos</strong>
              <span>(parcelas + assinaturas)</span>
            </div>
          ` : ''}
          <div class="balance-bar">
            <div class="balance-bar-fill ${pctUsed >= 100 ? 'over' : ''}" style="width: ${pctUsed}%"></div>
          </div>
          <div class="balance-pct">
            <span>${pctUsed.toFixed(0)}% da receita usado</span>
            <span>R$ ${money(monthTotal)} / R$ ${money(totalIncome)}</span>
          </div>
        </div>
        <div class="balance-breakdown">
          <div class="breakdown-row">
            <span class="breakdown-label" style="--dot-color: var(--sys-green)">Receitas</span>
            <span class="breakdown-value pos">+ R$ ${money(totalIncome)}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-label" style="--dot-color: var(--sys-red)">Gastos avulsos</span>
            <span class="breakdown-value neg">− R$ ${money(singleThisMonth)}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-label" style="--dot-color: var(--sys-orange)">Parcelas do mês</span>
            <span class="breakdown-value neg">− R$ ${money(instThisMonth)}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-label" style="--dot-color: var(--sys-teal)">Assinaturas</span>
            <span class="breakdown-value neg">− R$ ${money(subsThisMonth)}</span>
          </div>
          <div class="breakdown-divider"></div>
          <div class="breakdown-row">
            <span class="breakdown-label" style="--dot-color: ${available >= 0 ? 'var(--sys-green)' : 'var(--sys-red)'}">Saldo</span>
            <span class="breakdown-value ${available >= 0 ? 'pos' : 'neg'}">R$ ${money(available)}</span>
          </div>
          ${isCurrentMonth ? '<button class="edit-income-btn" id="editIncomeBtn">Editar receitas</button>' : ''}
        </div>
      </div>
    </div>

    <div class="mini-stats">
      <div class="stat">
        <div class="stat-label">${isFutureMonth ? 'Previsão do mês' : 'Gasto no mês'}</div>
        <div class="stat-value"><span class="currency">R$</span>${money(monthTotal)}</div>
        <div class="stat-sub">${monthTx.length} ${monthTx.length === 1 ? 'transação' : 'transações'}</div>
      </div>
      ${isCurrentMonth ? `
        <div class="stat">
          <div class="stat-label">Esta semana</div>
          <div class="stat-value"><span class="currency">R$</span>${money(weekTotal)}</div>
          <div class="stat-sub">últimos 7 dias</div>
        </div>
      ` : `
        <div class="stat">
          <div class="stat-label">Total de dias</div>
          <div class="stat-value">${totalDaysRef}</div>
          <div class="stat-sub">dias no mês</div>
        </div>
      `}
      <div class="stat">
        <div class="stat-label">Média diária</div>
        <div class="stat-value"><span class="currency">R$</span>${money(monthTotal / divisorMedia)}</div>
        <div class="stat-sub">${isCurrentMonth ? 'desde dia 1' : `em ${totalDaysRef} dias`}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Compromissos fixos</div>
        <div class="stat-value"><span class="currency">R$</span>${money(instThisMonth + subsThisMonth)}</div>
        <div class="stat-sub">parcelas + assinaturas</div>
      </div>
    </div>

    ${state.accounts.filter(a => a.type === 'benefit').length > 0 ? `
      <section>
        <div class="section-head">
          <div class="section-title">Benefícios</div>
          <div class="section-sub">saldo independente do dinheiro livre</div>
        </div>
        <div class="cards-grid">${state.accounts.filter(a => a.type === 'benefit').map(b => {
          const balance = getBenefitBalance(b.id);
          const spent = monthTxBenefit.filter(t => t.accountId === b.id).reduce((s, t) => s + t.amount, 0);
          return `
            <div class="card benefit-card" style="--card-color: ${b.color}">
              <div class="card-head">
                <div class="card-name">${b.name}</div>
                <div class="card-type-badge">VR</div>
              </div>
              <div class="benefit-balance-label">Saldo disponível</div>
              <div class="card-value benefit-balance ${balance < 0 ? 'negative' : ''}">
                <span class="currency">R$</span>${money(Math.max(0, balance))}
              </div>
              <div class="card-meta">
                <span>gasto no mês</span>
                <span>R$ ${money(spent)}</span>
              </div>
            </div>`;
        }).join('')}</div>
      </section>
    ` : ''}

    ${creditAccounts.length > 0 ? `
      <section>
        <div class="section-head">
          <div class="section-title">Cartões de crédito</div>
          <div class="section-sub">${isFutureMonth ? 'previsão de' : isPastMonth ? 'fatura de' : 'fatura de'} ${monthName}</div>
        </div>
        <div class="cards-grid">${creditAccounts.map(card => {
          const spent = monthTx.filter(t => t.accountId === card.id).reduce((s, t) => s + t.amount, 0);
          const pct = card.limit ? Math.min(100, (spent / card.limit) * 100) : 0;
          return `
            <div class="card" style="--card-color: ${card.color}">
              <div class="card-head">
                <div class="card-name">${card.name}</div>
                <div class="card-pct">${pct.toFixed(0)}% do limite</div>
              </div>
              <div class="card-value"><span class="currency">R$</span>${money(spent)}</div>
              <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
              <div class="card-meta">
                <span>${isFutureMonth ? 'previsto' : isPastMonth ? 'faturado' : 'fatura atual'}</span>
                <span>limite R$ ${moneyShort(card.limit || 0)}</span>
              </div>
              ${card.closingDay ? `<div class="card-dates">fecha dia ${card.closingDay} · vence dia ${card.dueDay}</div>` : ''}
            </div>`;
        }).join('')}</div>
      </section>
    ` : ''}

    ${isCurrentMonth ? `
      <section>
        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">Evolução dos gastos</div>
              <div class="section-sub" style="margin-top: 4px;">por cartão de crédito</div>
            </div>
            <div class="filters" id="chartFilters">
              <button class="filter-btn active" data-range="7">7 dias</button>
              <button class="filter-btn" data-range="30">30 dias</button>
              <button class="filter-btn" data-range="90">90 dias</button>
              <button class="filter-btn" data-range="months">12 meses</button>
            </div>
          </div>
          <div class="chart-stats" id="chartStats">
            <div class="chart-stat">
              <div class="chart-stat-label">Total no período</div>
              <div class="chart-stat-value"><span class="currency">R$</span><span id="chartStatTotal">0,00</span></div>
            </div>
            <div class="chart-stat">
              <div class="chart-stat-label" id="chartStatAvgLabel">Média/dia</div>
              <div class="chart-stat-value"><span class="currency">R$</span><span id="chartStatAvg">0,00</span></div>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="weekChart"></canvas></div>
        </div>
      </section>
    ` : ''}

    <section>
      <div class="two-col">
        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">${isFutureMonth ? 'Compromissos previstos' : 'Lançamentos'}</div>
              <div class="section-sub" style="margin-top: 4px;">${monthTx.length} ${isCurrentMonth ? 'este mês' : (isFutureMonth ? 'previstos' : 'no mês')}</div>
            </div>
          </div>
          <table class="tx-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Conta</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${renderTxRows([...monthTx].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 15), isCurrentMonth)}</tbody>
          </table>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">Por categoria</div>
              <div class="section-sub" style="margin-top: 4px;">${isCurrentMonth ? 'este mês' : monthName}</div>
            </div>
          </div>
          <div class="cat-list">${renderCatList(monthTx)}</div>
        </div>
      </div>
    </section>
  `;
}

function renderTxRows(txs, canDelete) {
  if (txs.length === 0) {
    return '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-tertiary);">Nenhum lançamento.</td></tr>';
  }
  return txs.map(t => {
    const cat = getCategory(t.categoryId);
    const acc = getAccount(t.accountId);
    let meta = '';
    if (t.isInstallment) meta = `<span class="tx-inst">parcela ${t.installmentNumber}/${t.installmentTotal}</span>`;
    else if (t.isSubscription) meta = `<span class="tx-inst">assinatura mensal</span>`;

    let deleteAttr = `data-id="${t.id}"`;
    if (t.isInstallment) deleteAttr = `data-group-id="${t.groupId}"`;
    else if (t.isSubscription) deleteAttr = `data-subscription-id="${t.subscriptionId}"`;

    const catBg = cat ? hexToRgba(cat.color, 0.12) : 'var(--bg-input)';
    const catFg = cat ? cat.color : 'var(--text-secondary)';

    const hasNote = t.note && t.note.trim().length > 0;
    const noteIcon = hasNote
      ? `<button class="note-toggle" data-tx-id="${t.id}" title="Ver comentário">💬</button>`
      : '';
    const noteRow = hasNote
      ? `<tr class="note-row" id="note-${t.id}" hidden><td colspan="6"><div class="note-content">${escapeHtml(t.note)}</div></td></tr>`
      : '';

    return `
      <tr>
        <td class="tx-date">${shortDate(t.date)}</td>
        <td><div class="tx-desc-wrap"><span class="tx-desc">${t.desc} ${noteIcon}</span>${meta}</div></td>
        <td><span class="tx-cat" style="--cat-bg: ${catBg}; --cat-fg: ${catFg}">${cat?.name || '—'}</span></td>
        <td><span class="tx-card-dot" style="--card-color: ${acc?.color || '#888'}">${acc?.name.split(' ')[0] || '—'}</span></td>
        <td class="tx-amount">R$ ${money(t.amount)}</td>
        <td style="width:24px;">${canDelete ? `<button class="tx-delete" ${deleteAttr} title="Excluir">✕</button>` : ''}</td>
      </tr>
      ${noteRow}`;
  }).join('');
}

/** Escapa HTML pra evitar XSS em comentários */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderCatList(monthTx) {
  const total = monthTx.reduce((s, t) => s + t.amount, 0);
  if (total === 0) {
    return '<div style="color: var(--text-tertiary); font-size: 13px; padding: 20px 0;">Nenhum gasto no período.</div>';
  }
  const byCategory = {};
  monthTx.forEach(t => {
    byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount;
  });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return sorted.map(([id, amount]) => {
    const cat = getCategory(id);
    const pct = (amount / total * 100);
    const goal = state.goals.find(g => g.categoryId === id);
    const overGoal = goal && amount > goal.limit;
    return `
      <div class="cat-item">
        <div class="cat-name">
          <span class="cat-dot" style="--cat-color: ${cat.color}"></span>
          <span>${cat.name}</span>
          <span class="cat-pct">${pct.toFixed(1)}%${overGoal ? ' · ⚠ acima da meta' : ''}</span>
        </div>
        <div class="cat-amount">R$ ${money(amount)}</div>
        <div class="cat-bar-wrap">
          <div class="cat-bar"><div class="cat-bar-fill ${overGoal ? 'over' : ''}" style="--cat-color: ${cat.color}; width: ${pct}%"></div></div>
        </div>
      </div>`;
  }).join('');
}

export function bindDashboard() {
  // Navegação de mês
  document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    monthOffset--;
    renderPage();
  });
  document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    monthOffset++;
    renderPage();
  });
  document.getElementById('todayBtn')?.addEventListener('click', () => {
    monthOffset = 0;
    renderPage();
  });

  // Gráfico só aparece no mês atual
  const chartFilters = document.getElementById('chartFilters');
  if (chartFilters) {
    /** Atualiza os contadores de Total e Média no canto */
    function updateChartStats(stats) {
      if (!stats) return;
      const totalEl = document.getElementById('chartStatTotal');
      const avgEl = document.getElementById('chartStatAvg');
      const avgLabelEl = document.getElementById('chartStatAvgLabel');
      if (totalEl) totalEl.textContent = money(stats.total);
      if (avgEl) avgEl.textContent = money(stats.average);
      if (avgLabelEl) avgLabelEl.textContent = capitalize(stats.unitLabel);
    }

    chartFilters.addEventListener('click', (e) => {
      if (!e.target.matches('.filter-btn')) return;
      chartFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const range = e.target.dataset.range;
      const periodArg = range === 'months' ? 'months' : parseInt(range);
      const stats = renderExpenseChart('weekChart', periodArg);
      updateChartStats(stats);
    });

    // Render inicial (default = 7 dias)
    const initialStats = renderExpenseChart('weekChart', 7);
    updateChartStats(initialStats);
  }

  // Delete (só funciona no mês atual; botões não são renderizados nos outros)
  document.querySelectorAll('.tx-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.groupId) {
        const groupId = parseInt(btn.dataset.groupId);
        const group = state.installmentGroups.find(g => g.id === groupId);
        if (!group) return;
        if (confirm(`Remover o parcelamento "${group.desc}" (${group.count}x)?`)) {
          const backup = { ...group };
          removeInstallmentGroup(groupId);
          renderPage();
          showUndoToast(`Parcelamento "${backup.desc}" removido`, () => {
            state.installmentGroups.push(backup);
            commit();
            renderPage();
          });
        }
      } else if (btn.dataset.subscriptionId) {
        const subId = parseInt(btn.dataset.subscriptionId);
        const sub = state.subscriptions.find(s => s.id === subId);
        if (!sub) return;
        if (confirm(`Pausar a assinatura "${sub.name}"?`)) {
          updateSubscription(subId, { active: false });
          renderPage();
          showUndoToast(`"${sub.name}" pausada`, () => {
            updateSubscription(subId, { active: true });
            renderPage();
          });
        }
      } else {
        const id = parseInt(btn.dataset.id);
        const tx = state.singleTransactions.find(t => t.id === id);
        if (!tx) return;
        const backup = { ...tx };
        removeTransaction(id);
        renderPage();
        showUndoToast(`"${backup.desc}" removido`, () => {
          state.singleTransactions.push(backup);
          commit();
          renderPage();
        });
      }
    });
  });

  const editBtn = document.getElementById('editIncomeBtn');
  if (editBtn) editBtn.addEventListener('click', openIncomeModal);

  // Toggle de comentários
  document.querySelectorAll('.note-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const txId = btn.dataset.txId;
      const noteRow = document.getElementById('note-' + txId);
      if (noteRow) {
        noteRow.hidden = !noteRow.hidden;
        btn.classList.toggle('active', !noteRow.hidden);
      }
    });
  });
}
