/* ============================================================
   toast.js — sistema de undo/notificação temporária
   ============================================================ */

let toastTimer = null;
let currentUndo = null;

/**
 * Mostra um toast com botão "Desfazer" por 5 segundos.
 * @param {string} message - mensagem visível
 * @param {function} undoFn - função que reverte a ação
 */
export function showUndoToast(message, undoFn) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMsg');
  const btn = document.getElementById('toastUndo');
  if (!toast || !msg || !btn) return;

  msg.textContent = message;
  toast.classList.add('active');
  currentUndo = undoFn;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hideToast(), 5000);
}

export function hideToast() {
  const toast = document.getElementById('toast');
  if (toast) toast.classList.remove('active');
  currentUndo = null;
  clearTimeout(toastTimer);
}

export function initToast() {
  const btn = document.getElementById('toastUndo');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (currentUndo) {
      currentUndo();
      hideToast();
    }
  });
}
