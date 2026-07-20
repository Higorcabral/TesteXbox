/* ============================================================
   modals/goal.js — criar/editar meta de categoria
   ============================================================ */

import { state, setGoal } from '../state.js';
import { renderPage } from '../router.js';

let editingGoal = null;

export function openGoalModal(goal) {
  const modal = document.getElementById('goalModal');
  const form = document.getElementById('goalForm');
  if (!modal || !form) return;

  editingGoal = goal;
  document.getElementById('goalModalTitle').textContent = goal ? 'Editar meta' : 'Nova meta';

  // Só categorias que ainda não têm meta (a menos que seja edição)
  const catsWithGoal = state.goals.map(g => g.categoryId);
  const availableCats = state.categories.filter(c => {
    if (goal && c.id === goal.categoryId) return true;
    return !catsWithGoal.includes(c.id) && c.id !== 'income';
  });

  document.getElementById('f-goal-cat').innerHTML = availableCats
    .map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  if (goal) {
    document.getElementById('f-goal-cat').value = goal.categoryId;
    document.getElementById('f-goal-cat').disabled = true;
    document.getElementById('f-goal-limit').value = goal.limit;
  } else {
    form.reset();
    document.getElementById('f-goal-cat').disabled = false;
  }

  modal.classList.add('active');
  setTimeout(() => {
    document.getElementById(goal ? 'f-goal-limit' : 'f-goal-cat')?.focus();
  }, 100);
}

export function closeGoalModal() {
  document.getElementById('goalModal')?.classList.remove('active');
  editingGoal = null;
}

export function initGoalModal() {
  const modal = document.getElementById('goalModal');
  const form = document.getElementById('goalForm');
  if (!modal || !form) return;

  document.getElementById('cancelGoalBtn')?.addEventListener('click', closeGoalModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeGoalModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const categoryId = document.getElementById('f-goal-cat').value;
    const limit = parseFloat(document.getElementById('f-goal-limit').value);

    if (!categoryId || !limit || limit <= 0) { alert('Preencha todos os campos.'); return; }

    setGoal(categoryId, limit);
    closeGoalModal();
    renderPage();
  });
}
