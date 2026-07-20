/* =================================================================
   CATALOG — renderiza o grid de soluções em solucoes-prontas.html
   ================================================================= */
(function () {
  'use strict';

  var ICONS = {
    calendar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    dollar:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    chart:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    truck:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>',
    package:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    users:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    book:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    bolt:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    grid:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function iconHTML(name) {
    return ICONS[name] || ICONS.grid;
  }

  function statusLabel(status) {
    if (status === 'available' || !status) return 'DISPONÍVEL';
    if (status === 'unavailable') return 'INDISPONÍVEL';
    if (status === 'soon') return 'EM BREVE';
    return String(status).toUpperCase();
  }

  function renderCard(s) {
    var features = (s.features || []).map(function (f) {
      return '<li>' + esc(f) + '</li>';
    }).join('');

    var priceText = esc(s.price || 'Sob consulta');
    var hasRealPrice = /R\$/i.test(s.price || '');

    /* Se a solução tem demoUrl, o card vira link direto para o demo funcional
       (abre em nova aba); caso contrário, aponta para detalhe.html?id=... */
    var hasDemo = !!s.demoUrl;
    var href = hasDemo ? s.demoUrl : ('detalhe.html?id=' + encodeURIComponent(s.id));
    var linkAttrs = hasDemo
      ? ' target="_blank" rel="noopener"'
      : '';
    var ctaLabel = hasDemo ? (s.demoLabel || 'Experimentar demo') : 'Ver detalhes';
    var demoBadge = hasDemo
      ? '<span class="ci-demo-badge">Demo ao vivo</span>'
      : '';

    return '' +
      '<a class="catalog-item ecommerce' + (hasDemo ? ' has-demo' : '') + '" href="' + esc(href) + '"' + linkAttrs + '>' +
        '<div class="ci-photo">' +
          '<img src="' + esc(s.image) + '" alt="' + esc(s.title) + '" loading="lazy">' +
          '<span class="ci-badge">' + esc(statusLabel(s.status)) + '</span>' +
        '</div>' +
        '<div class="ci-body">' +
          '<div class="ci-head">' +
            '<div class="ci-title-block">' +
              '<div class="ci-icon">' + iconHTML(s.icon) + '</div>' +
              '<div class="ci-title-text">' +
                '<h4>' + esc(s.title) + '</h4>' +
                '<small>Solução pronta · Hifera</small>' +
              '</div>' +
            '</div>' +
            '<div class="ci-price-block">' +
              (hasRealPrice ? '<span class="ci-price-prefix">A partir de</span>' : '') +
              '<span class="ci-price">' + priceText + '</span>' +
            '</div>' +
          '</div>' +
          '<p>' + esc(s.shortDescription || s.longDescription || '') + '</p>' +
          '<ul class="feature-list">' + features + '</ul>' +
          '<div class="ci-foot">' +
            demoBadge +
            '<span class="ci-cta">' + esc(ctaLabel) + ' <span class="arrow">→</span></span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }

  function renderEmpty(container) {
    container.innerHTML =
      '<div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-dim); border: 1px dashed var(--line); border-radius: 16px;">' +
        '<p style="font-size: 15px;">Nenhuma solução cadastrada no catálogo ainda.</p>' +
      '</div>';
  }

  function init() {
    var container = document.getElementById('catalog-grid');
    if (!container) return;

    Api.solutions.list().then(function (list) {
      if (!list.length) return renderEmpty(container);
      container.innerHTML = list.map(renderCard).join('');
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
