/* ============================================================
   modals/account.js — criar/editar conta (crédito/débito/pix/cash)
   ============================================================ */

import { state, addAccount, updateAccount, removeAccount } from '../state.js';
import { COLOR_PALETTE, ACCOUNT_TYPES } from '../config.js';
import { generateId } from '../helpers.js';
import { renderPage } from '../router.js';

let editingAcc = null;
let selectedColor = COLOR_PALETTE[0];

function renderColorGrid() {
  const grid = document.getElementById('accountColorGrid');
  if (!grid) return;
  grid.innerHTML = COLOR_PALETTE.map(c =>
    `<div class="color-swatch ${c === selectedColor ? 'selected' : ''}" style="background: ${c}" data-color="${c}"></div>`
  ).join('');
  grid.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      selectedColor = sw.dataset.color;
      renderColorGrid();
    });
  });
}

function updateCreditFields() {
  const type = document.getElementById('f-acc-type').value;
  const creditFields = document.getElementById('creditOnlyFields');
  if (creditFields) {
    creditFields.style.display = type === 'credit' ? 'block' : 'none';
  }
  // Hint contextual sobre benefit
  const benefitHint = document.getElementById('benefitHint');
  if (benefitHint) {
    benefitHint.style.display = type === 'benefit' ? 'block' : 'none';
  }
}

export function openAccountModal(acc) {
  const modal = document.getElementById('accountModal');
  const form = document.getElementById('accountForm');
  if (!modal || !form) return;

  editingAcc = acc;
  document.getElementById('accountModalTitle').textContent = acc ? 'Editar conta' : 'Nova conta';

  // Preenche select de tipos
  document.getElementById('f-acc-type').innerHTML = Object.entries(ACCOUNT_TYPES)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

  document.getElementById('deleteAccountBtn').style.display = acc ? 'block' : 'none';

  if (acc) {
    document.getElementById('f-acc-name').value = acc.name;
    document.getElementById('f-acc-type').value = acc.type;
    document.getElementById('f-acc-limit').value = acc.limit || '';
    document.getElementById('f-acc-closing').value = acc.closingDay || '';
    document.getElementById('f-acc-due').value = acc.dueDay || '';
    selectedColor = acc.color;
  } else {
    form.reset();
    document.getElementById('f-acc-type').value = 'credit';
    selectedColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  }
  renderColorGrid();
  updateCreditFields();

  modal.classList.add('active');
  setTimeout(() => document.getElementById('f-acc-name')?.focus(), 100);
}

export function closeAccountModal() {
  document.getElementById('accountModal')?.classList.remove('active');
  editingAcc = null;
}

export function initAccountModal() {
  const modal = document.getElementById('accountModal');
  const form = document.getElementById('accountForm');
  if (!modal || !form) return;

  document.getElementById('cancelAccountBtn')?.addEventListener('click', closeAccountModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAccountModal(); });

  document.getElementById('f-acc-type')?.addEventListener('change', updateCreditFields);

  document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
    if (!editingAcc) return;
    try {
      if (confirm(`Excluir a conta "${editingAcc.name}"?`)) {
        removeAccount(editingAcc.id);
        closeAccountModal();
        renderPage();
      }
    } catch (err) {
      alert(err.message);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('f-acc-name').value.trim();
    const type = document.getElementById('f-acc-type').value;
    const limit = parseFloat(document.getElementById('f-acc-limit').value) || 0;
    const closingDay = parseInt(document.getElementById('f-acc-closing').value) || 0;
    const dueDay = parseInt(document.getElementById('f-acc-due').value) || 0;

    if (!name) { alert('Informe o nome.'); return; }

    const data = { name, type, color: selectedColor };
    if (type === 'credit') {
      if (!limit || !closingDay || !dueDay) { alert('Preencha limite, fechamento e vencimento.'); return; }
      data.limit = limit;
      data.closingDay = closingDay;
      data.dueDay = dueDay;
    }

    if (editingAcc) {
      updateAccount(editingAcc.id, data);
    } else {
      const existingIds = state.accounts.map(a => a.id);
      addAccount({ ...data, id: generateId(name, existingIds) });
    }

    closeAccountModal();
    renderPage();
  });
}
