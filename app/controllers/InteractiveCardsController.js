/* =================================================================
   InteractiveCardsController — efeito spotlight macOS-like nos cards
   Listener único e delegado em document — funciona inclusive para
   cards renderizados dinamicamente (ex.: catálogo do CatalogController).
   ================================================================= */
(function () {
  'use strict';

  var SELECTOR = [
    /* Cards */
    '.diff-item',
    '.road-item',
    '.value',
    '.step',
    '.catalog-item',
    '.faq-item',
    '.stat-card',
    '.pillar',
    /* Botões */
    '.btn-primary',
    '.nav-cta',
    '.nav-login',
    '.auth-submit',
    '.auth-google',
    '.admin-btn-primary',
    '.admin-logout'
  ].join(', ');

  // Atualiza --mx e --my com a posição relativa do cursor (em %).
  function onMove(e) {
    var card = e.target.closest(SELECTOR);
    if (!card) return;
    var rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var x = ((e.clientX - rect.left) / rect.width)  * 100;
    var y = ((e.clientY - rect.top)  / rect.height) * 100;
    card.style.setProperty('--mx', x.toFixed(2) + '%');
    card.style.setProperty('--my', y.toFixed(2) + '%');
  }

  // Passive listener: não bloqueia scroll e melhora performance.
  document.addEventListener('mousemove', onMove, { passive: true });
})();
