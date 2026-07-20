/* ============================================================
   app.js — entry point, inicialização, atalhos
   ============================================================ */

import { initState } from './state.js';
import { navigate, renderPage } from './router.js';
import { initToast } from './toast.js';
import { initSearch, openSearch, closeSearch } from './search.js';

import { initTransactionModal, openModal as openTxModal, closeModal as closeTxModal } from './modals/transaction.js';
import { initIncomeModal, closeIncomeModal } from './modals/income.js';
import { initSubscriptionModal, closeSubscriptionModal } from './modals/subscription.js';
import { initCategoryModal, closeCategoryModal } from './modals/category.js';
import { initAccountModal, closeAccountModal } from './modals/account.js';
import { initGoalModal, closeGoalModal } from './modals/goal.js';
import { initTopupModal, closeTopupModal } from './modals/topup.js';

// ====== INIT ======

// Na primeira visita, carrega dados de demo pra você ver o app funcionando
initState(true);

// Inicializar todos os modais
initToast();
initSearch();
initTransactionModal();
initIncomeModal();
initSubscriptionModal();
initCategoryModal();
initAccountModal();
initGoalModal();
initTopupModal();

// ====== NAV ======
// Escuta no sidebar inteiro (temos múltiplos <nav> blocks dentro)
document.getElementById('sidebar')?.addEventListener('click', (e) => {
  const item = e.target.closest('.nav-item');
  if (item && item.dataset.page) navigate(item.dataset.page);
});

// ====== FAB ======
document.getElementById('fab')?.addEventListener('click', openTxModal);

// ====== MOBILE MENU ======
document.getElementById('menuBtn')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebarOverlay')?.classList.toggle('active');
});
document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
});

// ====== KEYBOARD SHORTCUTS ======
const PAGE_SHORTCUTS = {
  '1': 'dashboard',
  '2': 'invoices',
  '3': 'installments',
  '4': 'subscriptions',
  '5': 'accounts',
  '6': 'categories',
  '7': 'goals',
  '8': 'forecast',
  '9': 'settings'
};

document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + K → busca global
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openSearch();
    return;
  }

  // Esc → fecha todos os modais/overlays
  if (e.key === 'Escape') {
    closeTxModal();
    closeIncomeModal();
    closeSubscriptionModal();
    closeCategoryModal();
    closeAccountModal();
    closeGoalModal();
    closeTopupModal();
    closeSearch();
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
    return;
  }

  // Outros atalhos só disparam quando não estamos digitando em input/textarea/select
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  // Alguma modal aberta? Ignora atalhos adicionais
  if (document.querySelector('.modal-backdrop.active, .search-modal-backdrop.active')) return;

  // N → novo lançamento
  if (e.key.toLowerCase() === 'n') {
    e.preventDefault();
    openTxModal();
    return;
  }

  // 1-9 → páginas
  if (PAGE_SHORTCUTS[e.key]) {
    e.preventDefault();
    navigate(PAGE_SHORTCUTS[e.key]);
  }
});

// ====== INITIAL RENDER ======
renderPage();

console.log('%cLedger v1.0', 'font-size: 20px; font-weight: 700; color: #0a84ff;');
console.log('%cControle financeiro pessoal · Dados armazenados localmente no seu navegador', 'color: #8a8a8e; font-size: 11px;');
console.log('%cAtalhos: Cmd+K (busca) · N (novo lançamento) · 1-9 (páginas) · Esc (fechar)', 'color: #8a8a8e; font-size: 11px;');
