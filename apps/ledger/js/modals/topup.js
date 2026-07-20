/* ============================================================
   modals/topup.js — registrar recarga de cartão de benefício
   ============================================================ */

import { state, addTopup } from '../state.js';
import { today } from '../helpers.js';
import { renderPage } from '../router.js';

let currentAccountId = null;

export function openTopupModal(accountId) {
  const modal = document.getElementById('topupModal');
  const form = document.getElementById('topupForm');
  if (!modal || !form) return;

  currentAccountId = accountId;
  const acc = state.accounts.find(a => a.id === accountId);
  document.getElementById('topupModalAccount').textContent = acc?.name || '—';

  form.reset();
  document.getElementById('f-topup-date').value = today.toISOString().split('T')[0];
  document.getElementById('f-topup-note').value = 'Recarga mensal';

  modal.classList.add('active');
  setTimeout(() => document.getElementById('f-topup-amount')?.focus(), 100);
}

export function closeTopupModal() {
  document.getElementById('topupModal')?.classList.remove('active');
  currentAccountId = null;
}

export function initTopupModal() {
  const modal = document.getElementById('topupModal');
  const form = document.getElementById('topupForm');
  if (!modal || !form) return;

  document.getElementById('cancelTopupBtn')?.addEventListener('click', closeTopupModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeTopupModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentAccountId) return;
    const amount = parseFloat(document.getElementById('f-topup-amount').value);
    const date = document.getElementById('f-topup-date').value;
    const note = document.getElementById('f-topup-note').value.trim() || 'Recarga';
    if (!amount || !date) { alert('Preencha valor e data.'); return; }

    addTopup({ id: Date.now(), accountId: currentAccountId, date, amount, note });
    closeTopupModal();
    renderPage();
  });
}
