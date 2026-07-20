/* ============================================================
   storage.js — persistência localStorage + import/export
   ============================================================ */

import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from './config.js';
import { daysAgo } from './helpers.js';

export const STORAGE_KEY = 'ledger.data.v1';
export const STORAGE_VERSION = 1;

/** Estado vazio — usado em reset */
export const emptyState = () => ({
  version: STORAGE_VERSION,
  income: { salary: 0, extra: 0, additional: [] },
  accounts: [
    // Só 2 cartões de crédito como base mínima
    { id: 'card1', name: 'Cartão 1', type: 'credit', limit: 5000, color: '#0a84ff', closingDay: 25, dueDay: 5 },
    { id: 'card2', name: 'Cartão 2', type: 'credit', limit: 3000, color: '#ff9f0a', closingDay: 20, dueDay: 27 }
  ],
  installmentGroups: [],
  singleTransactions: [],
  subscriptions: [],
  categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
  goals: [],
  topups: []  // recargas de cartões de benefício
});

/** Estado demo — populado com exemplos pra primeira visita */
export const demoState = () => ({
  version: STORAGE_VERSION,
  income: { salary: 7500, extra: 500, additional: [] },
  accounts: [
    ...JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),
    { id: 'vr', name: 'VR Refeição', type: 'benefit', color: '#30d158' }
  ],
  installmentGroups: [
    { id: 101, desc: 'Notebook Dell', totalAmount: 4200, count: 12, startDate: daysAgo(60), categoryId: 'shopping', accountId: 'nubank' },
    { id: 102, desc: 'Celular Samsung', totalAmount: 2400, count: 10, startDate: daysAgo(30), categoryId: 'shopping', accountId: 'itau' },
    { id: 103, desc: 'Curso Online', totalAmount: 1200, count: 6, startDate: daysAgo(15), categoryId: 'leisure', accountId: 'nubank' }
  ],
  singleTransactions: [
    { id: 1,  date: daysAgo(0),  desc: 'iFood — Jantar',        amount: 68.90,  categoryId: 'food',      accountId: 'nubank' },
    { id: 2,  date: daysAgo(0),  desc: 'Uber',                  amount: 22.50,  categoryId: 'transport', accountId: 'itau'  },
    { id: 3,  date: daysAgo(1),  desc: 'Mercado Pão de Açúcar', amount: 342.18, categoryId: 'food',      accountId: 'nubank' },
    { id: 4,  date: daysAgo(2),  desc: 'Cinema',                amount: 48.00,  categoryId: 'leisure',   accountId: 'nubank' },
    { id: 5,  date: daysAgo(3),  desc: 'Farmácia',              amount: 87.30,  categoryId: 'health',    accountId: 'nubank-debito' },
    { id: 6,  date: daysAgo(3),  desc: 'Posto Shell',           amount: 180.00, categoryId: 'transport', accountId: 'nubank' },
    { id: 7,  date: daysAgo(4),  desc: 'Amazon',                amount: 129.90, categoryId: 'shopping',  accountId: 'nubank' },
    { id: 8,  date: daysAgo(5),  desc: 'Padaria',               amount: 28.50,  categoryId: 'food',      accountId: 'cash' },
    { id: 9,  date: daysAgo(6),  desc: 'Almoço — Restaurante',  amount: 35.00,  categoryId: 'food',      accountId: 'vr'   },
    { id: 10, date: daysAgo(8),  desc: 'Uber',                  amount: 18.40,  categoryId: 'transport', accountId: 'itau'  },
    { id: 11, date: daysAgo(9),  desc: 'Almoço',                amount: 42.00,  categoryId: 'food',      accountId: 'vr'   },
    { id: 12, date: daysAgo(10), desc: 'iFood',                 amount: 45.80,  categoryId: 'food',      accountId: 'nubank' },
    { id: 13, date: daysAgo(11), desc: 'Almoço',                amount: 38.50,  categoryId: 'food',      accountId: 'vr'   },
    { id: 14, date: daysAgo(14), desc: 'Academia diária',       amount: 25.00,  categoryId: 'health',    accountId: 'pix' },
    { id: 15, date: daysAgo(16), desc: 'Mercado',               amount: 287.40, categoryId: 'food',      accountId: 'nubank' },
    { id: 16, date: daysAgo(18), desc: 'Conta de Luz',          amount: 165.20, categoryId: 'home',      accountId: 'itau'  }
  ],
  subscriptions: [
    { id: 201, name: 'Netflix',      amount: 55.90,  billingDay: 5,  categoryId: 'subscr', accountId: 'itau',   active: true  },
    { id: 202, name: 'Spotify',      amount: 21.90,  billingDay: 12, categoryId: 'subscr', accountId: 'itau',   active: true  },
    { id: 203, name: 'Academia',     amount: 119.00, billingDay: 10, categoryId: 'health', accountId: 'nubank', active: true  },
    { id: 204, name: 'iCloud+',      amount: 14.90,  billingDay: 15, categoryId: 'subscr', accountId: 'nubank', active: true  },
    { id: 205, name: 'ChatGPT Plus', amount: 119.00, billingDay: 22, categoryId: 'subscr', accountId: 'nubank', active: false }
  ],
  categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
  goals: [
    { id: 301, categoryId: 'food',      limit: 1500 },
    { id: 302, categoryId: 'leisure',   limit: 500  },
    { id: 303, categoryId: 'transport', limit: 600  }
  ],
  topups: [
    { id: 401, accountId: 'vr', date: daysAgo(35), amount: 800.00, note: 'Recarga mensal' },
    { id: 402, accountId: 'vr', date: daysAgo(5),  amount: 800.00, note: 'Recarga mensal' }
  ]
});

/** Carrega do localStorage. Se nada gravado, retorna null. */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) {
      console.warn('Versão de dados antiga — migração não implementada ainda');
    }
    return data;
  } catch (err) {
    console.error('Erro ao ler localStorage:', err);
    return null;
  }
}

/** Salva estado no localStorage com indicador visual */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showSaveIndicator();
    return true;
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar os dados. Verifique se há espaço disponível no navegador.');
    return false;
  }
}

/** Mostra o indicador "Salvo" por 1.2s */
let saveTimer = null;
function showSaveIndicator() {
  const el = document.getElementById('saveIndicator');
  if (!el) return;
  el.classList.add('active');
  el.textContent = 'Salvo';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => el.classList.remove('active'), 1200);
}

/** Exporta estado como arquivo JSON pra download */
export function exportToJSON(state) {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  a.download = `ledger-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Importa estado de um arquivo JSON */
export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Validação básica
        if (!data.version || !Array.isArray(data.singleTransactions)) {
          throw new Error('Arquivo inválido: estrutura não reconhecida');
        }
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

/** Limpa tudo */
export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
