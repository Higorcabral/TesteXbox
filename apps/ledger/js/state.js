/* ============================================================
   state.js — estado central, mutações, derivações
   ============================================================ */

import { loadState, saveState, emptyState, demoState } from './storage.js';
import { today } from './helpers.js';

/** Estado global do app. Mutado via mutations, salvo a cada mudança. */
export let state = null;

/** Callbacks a serem chamados após cada mudança de estado */
const subscribers = [];
export const subscribe = (fn) => { subscribers.push(fn); };
const notify = () => subscribers.forEach(fn => fn());

/** Inicializa o estado: carrega do localStorage ou usa demo/empty */
export function initState(useDemo = false) {
  const stored = loadState();
  if (stored) {
    state = stored;
  } else {
    state = useDemo ? demoState() : emptyState();
    saveState(state);
  }
  return state;
}

/** Reset completo pra demo (apaga tudo e carrega exemplos) */
export function resetToDemo() {
  state = demoState();
  saveState(state);
  notify();
}

/** Reset pra estado vazio (apaga tudo) */
export function resetToEmpty() {
  state = emptyState();
  saveState(state);
  notify();
}

/** Substitui o estado inteiro (usado no import) */
export function replaceState(newState) {
  state = newState;
  saveState(state);
  notify();
}

/** Persiste e notifica — chamado após qualquer mutação */
export function commit() {
  saveState(state);
  notify();
}

// ============ MUTATIONS ============

// --- INCOME ---
export function updateIncome(income) {
  state.income = income;
  commit();
}

// --- ACCOUNTS ---
export function addAccount(account) {
  state.accounts.push(account);
  commit();
}
export function updateAccount(id, patch) {
  const acc = state.accounts.find(a => a.id === id);
  if (acc) Object.assign(acc, patch);
  commit();
}
export function removeAccount(id) {
  // Ao remover uma conta, precisamos validar uso em transações/assinaturas/parcelas
  const inUse =
    state.singleTransactions.some(t => t.accountId === id) ||
    state.installmentGroups.some(g => g.accountId === id) ||
    state.subscriptions.some(s => s.accountId === id);
  if (inUse) {
    throw new Error('Conta em uso por lançamentos. Remova ou migre-os antes.');
  }
  state.accounts = state.accounts.filter(a => a.id !== id);
  commit();
}

// --- CATEGORIES ---
export function addCategory(cat) {
  state.categories.push(cat);
  commit();
}
export function updateCategory(id, patch) {
  const cat = state.categories.find(c => c.id === id);
  if (cat) Object.assign(cat, patch);
  commit();
}
export function removeCategory(id) {
  const cat = state.categories.find(c => c.id === id);
  if (!cat || cat.system) throw new Error('Categoria padrão não pode ser removida');

  // Migra transações/grupos/assinaturas/metas pra "other"
  state.singleTransactions.forEach(t => { if (t.categoryId === id) t.categoryId = 'other'; });
  state.installmentGroups.forEach(g => { if (g.categoryId === id) g.categoryId = 'other'; });
  state.subscriptions.forEach(s => { if (s.categoryId === id) s.categoryId = 'other'; });
  state.goals = state.goals.filter(g => g.categoryId !== id);

  state.categories = state.categories.filter(c => c.id !== id);
  commit();
}

// --- TRANSACTIONS (avulsas) ---
export function addTransaction(tx) {
  state.singleTransactions.push(tx);
  commit();
}
export function removeTransaction(id) {
  state.singleTransactions = state.singleTransactions.filter(t => t.id !== id);
  commit();
}

// --- INSTALLMENTS ---
export function addInstallmentGroup(group) {
  state.installmentGroups.push(group);
  commit();
}
export function removeInstallmentGroup(id) {
  state.installmentGroups = state.installmentGroups.filter(g => g.id !== id);
  commit();
}

// --- SUBSCRIPTIONS ---
export function addSubscription(sub) {
  state.subscriptions.push(sub);
  commit();
}
export function updateSubscription(id, patch) {
  const sub = state.subscriptions.find(s => s.id === id);
  if (sub) Object.assign(sub, patch);
  commit();
}
export function removeSubscription(id) {
  state.subscriptions = state.subscriptions.filter(s => s.id !== id);
  commit();
}

// --- GOALS ---
export function setGoal(categoryId, limit) {
  const existing = state.goals.find(g => g.categoryId === categoryId);
  if (existing) {
    existing.limit = limit;
  } else {
    state.goals.push({ id: Date.now(), categoryId, limit });
  }
  commit();
}
export function removeGoal(categoryId) {
  state.goals = state.goals.filter(g => g.categoryId !== categoryId);
  commit();
}

// --- TOPUPS (recargas de benefícios) ---
export function addTopup(topup) {
  if (!state.topups) state.topups = [];
  state.topups.push(topup);
  commit();
}
export function removeTopup(id) {
  state.topups = (state.topups || []).filter(t => t.id !== id);
  commit();
}

// ============ DERIVATIONS ============

/** Expande um grupo de parcelamento em transações virtuais (1 por mês) */
export function expandInstallments(group) {
  const out = [];
  const amountPerInst = group.totalAmount / group.count;
  const start = new Date(group.startDate + 'T00:00');
  for (let i = 0; i < group.count; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    out.push({
      id: `${group.id}-${i}`,
      groupId: group.id,
      date: d.toISOString().split('T')[0],
      desc: group.desc,
      amount: amountPerInst,
      categoryId: group.categoryId,
      accountId: group.accountId,
      note: group.note || '',
      isInstallment: true,
      installmentNumber: i + 1,
      installmentTotal: group.count
    });
  }
  return out;
}

/** Expande assinaturas ativas em transações virtuais pro mês de referência */
export function expandSubscriptions(refDate = today) {
  const out = [];
  state.subscriptions.filter(s => s.active).forEach(s => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(s.billingDay, lastDay);
    const d = new Date(year, month, day);
    out.push({
      id: `sub-${s.id}-${year}-${month}`,
      subscriptionId: s.id,
      date: d.toISOString().split('T')[0],
      desc: s.name,
      amount: s.amount,
      categoryId: s.categoryId,
      accountId: s.accountId,
      note: s.note || '',
      isSubscription: true
    });
  });
  return out;
}

/** Todas as transações (avulsas + parcelas + assinaturas) num intervalo de meses */
export function allTransactions(refDate = today, monthsBefore = 12, monthsAhead = 6) {
  const instTx = state.installmentGroups.flatMap(expandInstallments);
  const subTx = [];
  for (let offset = -monthsBefore; offset <= monthsAhead; offset++) {
    const d = new Date(refDate);
    d.setMonth(d.getMonth() + offset);
    subTx.push(...expandSubscriptions(d));
  }
  return [...state.singleTransactions, ...instTx, ...subTx];
}

// ============ LOOKUPS ============
export const getAccount = (id) => state.accounts.find(a => a.id === id);
export const getCategory = (id) =>
  state.categories.find(c => c.id === id) || state.categories.find(c => c.id === 'other');

/**
 * Calcula saldo atual de uma conta de benefício (VR/VA).
 * saldo = soma das recargas - soma dos gastos
 */
export function getBenefitBalance(accountId) {
  const topups = (state.topups || []).filter(t => t.accountId === accountId);
  const totalIn = topups.reduce((s, t) => s + t.amount, 0);
  const spent = state.singleTransactions
    .filter(t => t.accountId === accountId)
    .reduce((s, t) => s + t.amount, 0);
  return totalIn - spent;
}

/** Soma das recargas no mês atual de uma conta */
export function getBenefitMonthTopup(accountId, refDate) {
  const topups = (state.topups || []).filter(t => t.accountId === accountId);
  return topups
    .filter(t => {
      const d = new Date(t.date + 'T00:00');
      return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
    })
    .reduce((s, t) => s + t.amount, 0);
}

/** Total de receitas mensais (salário + extra + adicionais recorrentes) */
export function totalMonthlyIncome() {
  const extras = (state.income.additional || []).reduce((s, a) => s + (a.amount || 0), 0);
  return (state.income.salary || 0) + (state.income.extra || 0) + extras;
}
