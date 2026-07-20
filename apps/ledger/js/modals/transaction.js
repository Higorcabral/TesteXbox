/* ============================================================
   modals/transaction.js — novo lançamento (single ou parcelado)
   ============================================================ */

import { state, addTransaction, addInstallmentGroup } from '../state.js';
import { today, money } from '../helpers.js';
import { renderPage } from '../router.js';

let currentTab = 'single';

export function openModal() {
  const modal = document.getElementById('txModal');
  const form = document.getElementById('txForm');
  if (!modal || !form) return;

  // preencher selects
  document.getElementById('f-cat').innerHTML = state.categories
    .filter(c => c.id !== 'income')
    .map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const accounts = state.accounts;
  document.getElementById('f-account').innerHTML = accounts
    .map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  // só cartões de crédito aparecem na aba parcelado
  document.getElementById('f-inst-account').innerHTML = state.accounts
    .filter(a => a.type === 'credit')
    .map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  form.reset();
  document.getElementById('f-date').value = today.toISOString().split('T')[0];
  document.getElementById('f-inst-start').value = today.toISOString().split('T')[0];
  document.getElementById('f-inst-count').value = 12;
  updateInstPreview();
  modal.classList.add('active');
  setTimeout(() => {
    document.getElementById(currentTab === 'single' ? 'f-desc' : 'f-inst-desc')?.focus();
  }, 100);
}

export function closeModal() {
  document.getElementById('txModal')?.classList.remove('active');
}

function updateInstPreview() {
  const total = parseFloat(document.getElementById('f-inst-total').value);
  const count = parseInt(document.getElementById('f-inst-count').value);
  const preview = document.getElementById('instPreview');
  if (!preview) return;
  if (total > 0 && count > 0) {
    preview.innerHTML = `<span>Valor por parcela</span><strong>R$ ${money(total / count)}</strong>`;
  } else {
    preview.innerHTML = `<span>Valor por parcela</span><strong>—</strong>`;
  }
}

export function initTransactionModal() {
  const modal = document.getElementById('txModal');
  const form = document.getElementById('txForm');
  if (!modal || !form) return;

  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // tabs
  document.querySelectorAll('#txModal .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('#txModal .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('#txModal .tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === currentTab));
    });
  });

  // preview
  ['f-inst-total', 'f-inst-count'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateInstPreview);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const categoryId = document.getElementById('f-cat').value;
    const note = document.getElementById('f-note').value.trim();

    if (currentTab === 'single') {
      const accountId = document.getElementById('f-account').value;
      const desc = document.getElementById('f-desc').value.trim();
      const amount = parseFloat(document.getElementById('f-amount').value);
      const date = document.getElementById('f-date').value;
      if (!desc || !amount || !date) { alert('Preencha todos os campos.'); return; }
      addTransaction({ id: Date.now(), desc, amount, date, categoryId, accountId, note });
    } else {
      const accountId = document.getElementById('f-inst-account').value;
      const desc = document.getElementById('f-inst-desc').value.trim();
      const totalAmount = parseFloat(document.getElementById('f-inst-total').value);
      const count = parseInt(document.getElementById('f-inst-count').value);
      const startDate = document.getElementById('f-inst-start').value;
      if (!desc || !totalAmount || !count || !startDate) { alert('Preencha todos os campos.'); return; }
      addInstallmentGroup({ id: Date.now(), desc, totalAmount, count, startDate, categoryId, accountId, note });
    }

    closeModal();
    renderPage();
  });
}
