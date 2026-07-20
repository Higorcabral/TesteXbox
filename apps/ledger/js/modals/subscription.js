/* ============================================================
   modals/subscription.js — criar/editar assinatura
   ============================================================ */

import { state, addSubscription, updateSubscription, removeSubscription } from '../state.js';
import { renderPage } from '../router.js';

let editingSub = null;

export function openSubscriptionModal(sub) {
  const modal = document.getElementById('subModal');
  const form = document.getElementById('subForm');
  if (!modal || !form) return;

  editingSub = sub;
  document.getElementById('subModalTitle').textContent = sub ? 'Editar assinatura' : 'Nova assinatura';

  document.getElementById('f-sub-cat').innerHTML = state.categories
    .map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('f-sub-account').innerHTML = state.accounts
    .map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  document.getElementById('deleteSubBtn').style.display = sub ? 'block' : 'none';

  if (sub) {
    document.getElementById('f-sub-name').value = sub.name;
    document.getElementById('f-sub-amount').value = sub.amount;
    document.getElementById('f-sub-day').value = sub.billingDay;
    document.getElementById('f-sub-cat').value = sub.categoryId;
    document.getElementById('f-sub-account').value = sub.accountId;
    document.getElementById('f-sub-note').value = sub.note || '';
  } else {
    form.reset();
    document.getElementById('f-sub-cat').value = 'subscr';
  }

  modal.classList.add('active');
  setTimeout(() => document.getElementById('f-sub-name')?.focus(), 100);
}

export function closeSubscriptionModal() {
  document.getElementById('subModal')?.classList.remove('active');
  editingSub = null;
}

export function initSubscriptionModal() {
  const modal = document.getElementById('subModal');
  const form = document.getElementById('subForm');
  if (!modal || !form) return;

  document.getElementById('cancelSubBtn')?.addEventListener('click', closeSubscriptionModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeSubscriptionModal(); });

  document.getElementById('deleteSubBtn')?.addEventListener('click', () => {
    if (editingSub && confirm(`Excluir a assinatura "${editingSub.name}"?`)) {
      removeSubscription(editingSub.id);
      closeSubscriptionModal();
      renderPage();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('f-sub-name').value.trim();
    const amount = parseFloat(document.getElementById('f-sub-amount').value);
    const billingDay = parseInt(document.getElementById('f-sub-day').value);
    const categoryId = document.getElementById('f-sub-cat').value;
    const accountId = document.getElementById('f-sub-account').value;
    const note = document.getElementById('f-sub-note').value.trim();

    if (!name || !amount || !billingDay) { alert('Preencha todos os campos.'); return; }
    if (billingDay < 1 || billingDay > 31) { alert('Dia deve ser entre 1 e 31.'); return; }

    if (editingSub) {
      updateSubscription(editingSub.id, { name, amount, billingDay, categoryId, accountId, note });
    } else {
      addSubscription({ id: Date.now(), name, amount, billingDay, categoryId, accountId, note, active: true });
    }

    closeSubscriptionModal();
    renderPage();
  });
}
