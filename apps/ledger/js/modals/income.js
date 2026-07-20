/* ============================================================
   modals/income.js — editar receitas mensais
   ============================================================ */

import { state, updateIncome } from '../state.js';
import { renderPage } from '../router.js';

export function openIncomeModal() {
  const modal = document.getElementById('incomeModal');
  if (!modal) return;
  document.getElementById('f-salary').value = state.income.salary || 0;
  document.getElementById('f-extra').value = state.income.extra || 0;
  modal.classList.add('active');
  setTimeout(() => document.getElementById('f-salary')?.focus(), 100);
}

export function closeIncomeModal() {
  document.getElementById('incomeModal')?.classList.remove('active');
}

export function initIncomeModal() {
  const modal = document.getElementById('incomeModal');
  const form = document.getElementById('incomeForm');
  if (!modal || !form) return;

  document.getElementById('cancelIncomeBtn')?.addEventListener('click', closeIncomeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeIncomeModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const salary = parseFloat(document.getElementById('f-salary').value) || 0;
    const extra = parseFloat(document.getElementById('f-extra').value) || 0;
    updateIncome({ ...state.income, salary, extra });
    closeIncomeModal();
    renderPage();
  });
}
