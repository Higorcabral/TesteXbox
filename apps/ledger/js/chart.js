/* ============================================================
   chart.js — gráfico de evolução dos gastos (dias ou meses)
   ============================================================ */

import { state, allTransactions } from './state.js';
import { today, money, moneyShort, capitalize } from './helpers.js';

let chartInstance = null;

/**
 * Renderiza o gráfico de gastos.
 * @param {string} canvasId - ID do canvas
 * @param {number|string} period - número de dias (7, 30, 90) ou 'months' pra visão mensal
 * @returns {{ total: number, average: number, periodLabel: string, unitLabel: string }}
 */
export function renderExpenseChart(canvasId, period = 7) {
  // Calcula stats SEMPRE (independente de canvas ou Chart.js disponível)
  const stats = period === 'months' ? computeMonthlyStats() : computeDailyStats(parseInt(period));

  const canvas = document.getElementById(canvasId);
  if (!canvas) return stats;

  // Proteção: se Chart.js ainda não carregou (CDN lento), tenta de novo
  if (typeof Chart === 'undefined') {
    const wrap = canvas.parentElement;
    if (wrap) {
      wrap.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; color: var(--text-tertiary); font-size: 13px;">Carregando gráfico...</div>';
      setTimeout(() => {
        if (typeof Chart !== 'undefined') {
          wrap.innerHTML = `<canvas id="${canvasId}"></canvas>`;
          renderExpenseChart(canvasId, period);
          window.dispatchEvent(new CustomEvent('chart-rendered', { detail: { period } }));
        } else {
          wrap.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; color: var(--text-tertiary); font-size: 13px; text-align:center; padding: 20px;">Gráfico indisponível<br><span style="font-size: 11px;">(verifique sua conexão)</span></div>';
        }
      }, 1500);
    }
    return stats;
  }

  if (period === 'months') {
    renderMonthly(canvas);
  } else {
    renderDaily(canvas, parseInt(period));
  }

  return stats;
}

/** Calcula stats da visão por dia */
function computeDailyStats(days) {
  const creditAccounts = state.accounts.filter(a => a.type === 'credit');
  const accountIds = creditAccounts.map(a => a.id);
  const tx = allTransactions();

  let total = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    total += tx
      .filter(t => t.date === dateStr && accountIds.includes(t.accountId))
      .reduce((s, t) => s + t.amount, 0);
  }

  return {
    total,
    average: total / days,
    periodLabel: `últimos ${days} dias`,
    unitLabel: 'média/dia'
  };
}

/** Calcula stats da visão por mês */
function computeMonthlyStats() {
  const creditAccounts = state.accounts.filter(a => a.type === 'credit');
  const accountIds = creditAccounts.map(a => a.id);
  const tx = allTransactions();

  let total = 0;
  for (let i = 11; i >= 0; i--) {
    const ref = new Date(today.getFullYear(), today.getMonth() - i, 1);
    total += tx
      .filter(t => {
        const d = new Date(t.date + 'T00:00');
        return d.getMonth() === ref.getMonth()
            && d.getFullYear() === ref.getFullYear()
            && accountIds.includes(t.accountId);
      })
      .reduce((s, t) => s + t.amount, 0);
  }

  return {
    total,
    average: total / 12,
    periodLabel: 'últimos 12 meses',
    unitLabel: 'média/mês'
  };
}

/** Visão por DIA — últimos N dias (só desenha o gráfico) */
function renderDaily(canvas, days) {
  const creditAccounts = state.accounts.filter(a => a.type === 'credit');
  const tx = allTransactions();

  const labels = [];
  const dataByAccount = {};
  creditAccounts.forEach(a => dataByAccount[a.id] = []);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''));
    creditAccounts.forEach(a => {
      const total = tx
        .filter(t => t.date === dateStr && t.accountId === a.id)
        .reduce((s, t) => s + t.amount, 0);
      dataByAccount[a.id].push(total);
    });
  }

  drawChart(canvas, labels, creditAccounts, dataByAccount, days > 30 ? 4 : 16);
}

/** Visão por MÊS — últimos 12 meses (só desenha o gráfico) */
function renderMonthly(canvas) {
  const creditAccounts = state.accounts.filter(a => a.type === 'credit');
  const tx = allTransactions();

  const labels = [];
  const dataByAccount = {};
  creditAccounts.forEach(a => dataByAccount[a.id] = []);

  for (let i = 11; i >= 0; i--) {
    const ref = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = ref.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const yearSuffix = ref.getFullYear() !== today.getFullYear()
      ? `/${ref.getFullYear().toString().slice(-2)}`
      : '';
    labels.push(capitalize(monthName) + yearSuffix);

    creditAccounts.forEach(a => {
      const total = tx
        .filter(t => {
          const d = new Date(t.date + 'T00:00');
          return d.getMonth() === ref.getMonth()
              && d.getFullYear() === ref.getFullYear()
              && t.accountId === a.id;
        })
        .reduce((s, t) => s + t.amount, 0);
      dataByAccount[a.id].push(total);
    });
  }

  drawChart(canvas, labels, creditAccounts, dataByAccount, 28);
}

/** Helper compartilhado: desenha o chart.js com dados já preparados */
function drawChart(canvas, labels, accounts, dataByAccount, maxBarThickness) {
  if (chartInstance) chartInstance.destroy();

  const fontFamily = '-apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif';

  chartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: accounts.map(a => ({
        label: a.name,
        data: dataByAccount[a.id],
        backgroundColor: a.color,
        borderRadius: 4,
        maxBarThickness
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true, position: 'top', align: 'end',
          labels: {
            color: 'rgba(235, 235, 245, 0.60)',
            font: { family: fontFamily, size: 12, weight: '500' },
            boxWidth: 8, boxHeight: 8, padding: 16,
            usePointStyle: true, pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(44, 44, 46, 0.96)',
          titleColor: '#fff',
          titleFont: { family: fontFamily, size: 13, weight: '600' },
          bodyColor: 'rgba(255, 255, 255, 0.85)',
          bodyFont: { family: fontFamily, size: 13 },
          padding: 14, cornerRadius: 10,
          displayColors: true, boxPadding: 4,
          borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 0.5,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: R$ ${money(ctx.parsed.y)}`,
            footer: (items) => {
              const total = items.reduce((s, i) => s + i.parsed.y, 0);
              return `\nTotal: R$ ${money(total)}`;
            }
          },
          footerFont: { family: fontFamily, size: 14, weight: '700' },
          footerColor: '#0a84ff',
          footerMarginTop: 8
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: 'rgba(235, 235, 245, 0.30)',
            font: { family: fontFamily, size: 11 },
            maxRotation: 0, autoSkipPadding: 20
          }
        },
        y: {
          stacked: true,
          grid: { color: 'rgba(84, 84, 88, 0.36)', drawBorder: false },
          border: { display: false },
          ticks: {
            color: 'rgba(235, 235, 245, 0.30)',
            font: { family: fontFamily, size: 11 },
            callback: (v) => 'R$ ' + moneyShort(v),
            padding: 8
          }
        }
      }
    }
  });
}

