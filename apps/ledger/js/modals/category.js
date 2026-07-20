/* ============================================================
   modals/category.js — criar/editar categoria
   ============================================================ */

import { state, addCategory, updateCategory, removeCategory } from '../state.js';
import { COLOR_PALETTE } from '../config.js';
import { generateId } from '../helpers.js';
import { renderPage } from '../router.js';

let editingCat = null;
let selectedColor = COLOR_PALETTE[0];

function renderColorGrid() {
  const grid = document.getElementById('colorGrid');
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

export function openCategoryModal(cat) {
  const modal = document.getElementById('catModal');
  const form = document.getElementById('catForm');
  if (!modal || !form) return;

  editingCat = cat;
  document.getElementById('catModalTitle').textContent = cat ? 'Editar categoria' : 'Nova categoria';

  const deleteBtn = document.getElementById('deleteCatBtn');
  deleteBtn.style.display = (cat && !cat.system) ? 'block' : 'none';

  if (cat) {
    document.getElementById('f-cat-name').value = cat.name;
    selectedColor = cat.color;
  } else {
    form.reset();
    selectedColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  }
  renderColorGrid();

  modal.classList.add('active');
  setTimeout(() => document.getElementById('f-cat-name')?.focus(), 100);
}

export function closeCategoryModal() {
  document.getElementById('catModal')?.classList.remove('active');
  editingCat = null;
}

export function initCategoryModal() {
  const modal = document.getElementById('catModal');
  const form = document.getElementById('catForm');
  if (!modal || !form) return;

  document.getElementById('cancelCatBtn')?.addEventListener('click', closeCategoryModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeCategoryModal(); });

  document.getElementById('deleteCatBtn')?.addEventListener('click', () => {
    if (!editingCat || editingCat.system) return;

    const affected = [
      ...state.singleTransactions.filter(t => t.categoryId === editingCat.id),
      ...state.installmentGroups.filter(g => g.categoryId === editingCat.id),
      ...state.subscriptions.filter(s => s.categoryId === editingCat.id)
    ].length;

    const msg = affected > 0
      ? `Excluir "${editingCat.name}"? ${affected} ${affected === 1 ? 'lançamento será movido' : 'lançamentos serão movidos'} para "Outros".`
      : `Excluir a categoria "${editingCat.name}"?`;

    if (confirm(msg)) {
      removeCategory(editingCat.id);
      closeCategoryModal();
      renderPage();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('f-cat-name').value.trim();
    if (!name) { alert('Informe o nome.'); return; }

    if (editingCat) {
      updateCategory(editingCat.id, { name, color: selectedColor });
    } else {
      const existingIds = state.categories.map(c => c.id);
      addCategory({
        id: generateId(name, existingIds),
        name,
        color: selectedColor,
        system: false
      });
    }

    closeCategoryModal();
    renderPage();
  });
}
