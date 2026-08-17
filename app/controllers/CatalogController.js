/* =================================================================
   CATALOG CONTROLLER
   Renderiza o grid de soluções PRONTAS em solucoes.html
   Usa .product-card do novo design system.
   ================================================================= */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function statusLabel(status) {
    if (status === 'available' || !status) return 'Disponível';
    if (status === 'unavailable') return 'Indisponível';
    if (status === 'soon') return 'Em breve';
    return String(status);
  }

  function renderCard(s) {
    var hasDemo = !!s.demoUrl;
    var href = hasDemo ? s.demoUrl : ('#solicitar?produto=' + encodeURIComponent(s.id));
    var linkAttrs = hasDemo ? ' target="_blank" rel="noopener"' : '';
    var ctaLabel = hasDemo ? (s.demoLabel || 'Experimentar demo') : 'Solicitar orçamento';
    var badgeClass = hasDemo ? 'product-badge is-demo' : 'product-badge';
    var badgeText = hasDemo ? 'Demo ao vivo' : statusLabel(s.status);

    var priceText = esc(s.price || 'Sob consulta');
    var hasRealPrice = /R\$/i.test(s.price || '');

    var features = (s.features || []).slice(0, 4).map(function (f) {
      return '<span class="chip">' + esc(f) + '</span>';
    }).join('');

    return '' +
      '<a class="product-card" href="' + esc(href) + '"' + linkAttrs + '>' +
        '<div class="product-photo">' +
          '<img src="' + esc(s.image) + '" alt="' + esc(s.title) + '" loading="lazy">' +
          '<span class="' + badgeClass + '">' + esc(badgeText) + '</span>' +
        '</div>' +
        '<div class="product-body">' +
          '<div class="product-head">' +
            '<div>' +
              '<div class="product-title">' + esc(s.title) + '</div>' +
              '<div class="text-xs text-dim" style="margin-top:2px;">Solução pronta</div>' +
            '</div>' +
            '<div class="product-price">' +
              (hasRealPrice ? '<span class="product-price-prefix">A partir de</span>' : '') +
              '<span class="product-price-value">' + priceText + '</span>' +
            '</div>' +
          '</div>' +
          '<p class="product-desc">' + esc(s.shortDescription || '') + '</p>' +
          (features ? '<div class="product-features">' + features + '</div>' : '') +
          '<div class="product-cta">' +
            '<span>' + esc(ctaLabel) + '</span>' +
            '<span class="arrow">→</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }

  function renderEmpty(container) {
    container.innerHTML =
      '<div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-dim); border: 1px dashed var(--border); border-radius: var(--r-lg);">' +
        '<p>Catálogo ainda não populado.</p>' +
      '</div>';
  }

  function init() {
    var container = document.getElementById('catalog-grid');
    if (!container) return;
    if (!window.Api) {
      console.error('[Catalog] Api não carregado');
      return;
    }
    Api.solutions.list().then(function (list) {
      if (!list.length) return renderEmpty(container);
      container.innerHTML = list.map(renderCard).join('');
      /* Re-attach spotlight nos novos cards */
      if (window.Layout && window.Layout.init) {
        // Não re-inicializa tudo, só spotlight
        var cards = container.querySelectorAll('.product-card');
        cards.forEach(function (c) {
          c.classList.add('card-spotlight');
          c.addEventListener('pointermove', function (e) {
            var rect = c.getBoundingClientRect();
            c.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
            c.style.setProperty('--my', (e.clientY - rect.top) + 'px');
          });
        });
      }
    }).catch(function (err) {
      console.error('[Catalog] falha ao carregar', err);
      container.innerHTML = '<p style="color: var(--text-dim);">Erro ao carregar catálogo.</p>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
