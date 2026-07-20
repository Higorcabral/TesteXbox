/* ============================================================
   helpers.js — formatação, datas, utilitários
   ============================================================ */

export const today = new Date();

/** Formata número como dinheiro brasileiro: 1234.56 → "1.234,56" */
export const money = (n) => n.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/** Formato curto: 1234 → "1.2k", 999 → "999" */
export const moneyShort = (n) => {
  if (Math.abs(n) >= 1000) return (n/1000).toFixed(1) + 'k';
  return n.toFixed(0);
};

/** Retorna data N dias atrás em ISO (yyyy-mm-dd) */
export const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

/** Verifica se uma data ISO cai no mesmo mês que a data de referência */
export const sameMonth = (dateStr, ref = today) => {
  const d = new Date(dateStr + 'T00:00');
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
};

/** Últimos N dias (contando a partir de hoje pro passado) */
export const lastNDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00');
  const diff = (today - d) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff < n;
};

/** Label de mês e ano: "abril de 2026" */
export const monthLabel = (date) => date.toLocaleDateString('pt-BR', {
  month: 'long',
  year: 'numeric'
});

/** Converte hex para rgba com alpha */
export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Gera um ID a partir do nome (slug seguro pro storage) */
export const generateId = (name, existingIds = []) => {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 20) || 'item';
  let id = base;
  let i = 1;
  while (existingIds.includes(id)) {
    id = base + '_' + i;
    i++;
  }
  return id;
};

/**
 * Calcula em qual fatura uma compra cai, dado o dia de fechamento do cartão.
 * Ex.: compra em 28/abr com fechamento dia 25 → fatura de maio
 *      compra em 20/abr com fechamento dia 25 → fatura de abril
 */
export const invoiceMonthForPurchase = (purchaseDateStr, closingDay) => {
  const d = new Date(purchaseDateStr + 'T00:00');
  const result = new Date(d);
  if (d.getDate() > closingDay) {
    result.setMonth(result.getMonth() + 1);
  }
  result.setDate(1);
  return result;
};

/** Retorna "abril 2026" a partir de uma data */
export const invoiceLabel = (date) => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

/** Verifica se uma data cai na fatura de um determinado mês/cartão */
export const isInInvoice = (dateStr, invoiceYear, invoiceMonth, closingDay) => {
  const invMonth = invoiceMonthForPurchase(dateStr, closingDay);
  return invMonth.getFullYear() === invoiceYear && invMonth.getMonth() === invoiceMonth;
};

/** Próxima data de cobrança de uma assinatura */
export const nextBillingDate = (sub, ref = today) => {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();
  let billingMonth = month;
  let billingYear = year;
  const lastDayCurr = new Date(year, month + 1, 0).getDate();
  const billingDayCurr = Math.min(sub.billingDay, lastDayCurr);
  if (day > billingDayCurr) {
    billingMonth++;
    if (billingMonth > 11) { billingMonth = 0; billingYear++; }
  }
  const lastDayTarget = new Date(billingYear, billingMonth + 1, 0).getDate();
  const finalDay = Math.min(sub.billingDay, lastDayTarget);
  return new Date(billingYear, billingMonth, finalDay);
};

/** Dias restantes no mês atual */
export const daysRemainingInMonth = () => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return lastDay - today.getDate();
};

/** Formata data ISO como "24 abr" */
export const shortDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

/** Capitaliza primeira letra */
export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
