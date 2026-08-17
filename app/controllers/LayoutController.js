/* =================================================================
   LAYOUT CONTROLLER
   Injeta a mesma navegação e footer em todas as views, adapta os
   caminhos conforme a profundidade da página, e ativa comportamentos
   compartilhados: menu mobile, reveal on-scroll, spotlight nos cards
   e sombra no nav ao rolar.

   Fonte única — mudar aqui reflete em todas as páginas.
   ================================================================= */
(function (global) {
  'use strict';

  var BRAND = {
    name: 'HIFERA',
    tagline: 'COMPANY',
    subtitle: 'Hub Digital',
    email: 'comercial@hifera.com'
  };

  var LINKS = [
    { id: 'solucoes', label: 'Soluções',  href: 'solucoes.html' },
    { id: 'sobre',    label: 'Sobre',     href: 'sobre.html' }
  ];

  /* ----------------------------------------------------------------
     Descobre em que profundidade a página está, para computar caminhos
     relativos corretos. Duas profundidades:
       - Home:      /index.html                → depth 0
       - Sub-view:  /app/views/*.html           → depth 2
     ---------------------------------------------------------------- */
  function detectDepth() {
    var path = location.pathname;
    if (path.indexOf('/app/views/') !== -1) return 2;
    return 0;
  }

  function base(depth) {
    return depth === 2 ? '../../' : '';
  }

  function currentViewId() {
    var path = location.pathname.toLowerCase();
    if (path.indexOf('solucoes') !== -1) return 'solucoes';
    if (path.indexOf('sobre') !== -1) return 'sobre';
    if (path.indexOf('login') !== -1) return 'login';
    if (path.indexOf('admin') !== -1) return 'admin';
    return 'home';
  }

  /* ----------------------------------------------------------------
     Templates HTML
     ---------------------------------------------------------------- */
  function navHTML(depth) {
    var b = base(depth);
    var current = currentViewId();
    var subViewsBase = b + 'app/views/';
    var homeHref = b === '' ? 'index.html' : b + 'index.html';

    var linksHTML = LINKS.map(function (l) {
      var active = (l.id === current) ? ' is-active' : '';
      return '<li><a href="' + subViewsBase + l.href + '" class="' + active.trim() + '">' + l.label + '</a></li>';
    }).join('');

    var mobileLinksHTML =
      '<a href="' + homeHref + '" class="' + (current === 'home' ? 'is-active' : '') + '">Início</a>' +
      LINKS.map(function (l) {
        var active = (l.id === current) ? ' is-active' : '';
        return '<a href="' + subViewsBase + l.href + '" class="' + active.trim() + '">' + l.label + '</a>';
      }).join('');

    return '' +
      '<nav class="nav" id="nav">' +
        '<div class="nav-inner">' +
          '<a href="' + homeHref + '" class="nav-logo" aria-label="Hifera Company — Início">' +
            '<img class="nav-logo-img" src="' + b + 'public/img/logo/HiferaIcon.png" alt="">' +
            '<span class="nav-logo-text">' +
              '<strong>' + BRAND.name + ' <span class="grad-text">' + BRAND.tagline + '</span></strong>' +
              '<small>' + BRAND.subtitle + '</small>' +
            '</span>' +
          '</a>' +
          '<ul class="nav-links">' + linksHTML + '</ul>' +
          '<div class="nav-actions">' +
            themeToggleHTML() +
            '<a href="' + subViewsBase + 'sobre.html#contato" class="btn btn-primary btn-sm nav-cta-desktop">' +
              'Solicitar orçamento <span class="arrow">→</span>' +
            '</a>' +
            '<button class="nav-menu-btn" id="nav-menu-btn" aria-label="Abrir menu" aria-expanded="false">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="13" x2="21" y2="13"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</nav>' +
      '<div class="nav-mobile" id="nav-mobile" aria-hidden="true">' +
        '<div class="nav-mobile-links">' +
          mobileLinksHTML +
          '<a href="' + subViewsBase + 'sobre.html#contato" class="btn btn-primary" style="margin-top: 16px;">' +
            'Solicitar orçamento <span class="arrow">→</span>' +
          '</a>' +
        '</div>' +
      '</div>';
  }

  function themeToggleHTML() {
    return '' +
      '<button class="theme-toggle" id="theme-toggle" type="button" aria-label="Alternar tema">' +
        '<span class="theme-toggle-thumb"></span>' +
        '<svg class="theme-toggle-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
        '<svg class="theme-toggle-sun"  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>' +
      '</button>';
  }

  function footerHTML(depth) {
    var b = base(depth);
    var subViewsBase = b + 'app/views/';
    var homeHref = b === '' ? 'index.html' : b + 'index.html';
    var year = new Date().getFullYear();

    return '' +
      '<footer class="footer">' +
        '<div class="container">' +
          '<div class="footer-grid">' +
            '<div class="footer-brand">' +
              '<a href="' + homeHref + '" class="nav-logo">' +
                '<img class="nav-logo-img" src="' + b + 'public/img/logo/HiferaIcon.png" alt="">' +
                '<span class="nav-logo-text">' +
                  '<strong>' + BRAND.name + ' <span class="grad-text">' + BRAND.tagline + '</span></strong>' +
                  '<small>' + BRAND.subtitle + '</small>' +
                '</span>' +
              '</a>' +
              '<p>Tecnologia que organiza, automatiza e escala. Sistemas prontos, projetos sob medida e automações — para PMEs que querem mais tempo e menos processo manual.</p>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h6>Soluções</h6>' +
              '<ul>' +
                '<li><a href="' + subViewsBase + 'solucoes.html">Catálogo completo</a></li>' +
                '<li><a href="' + subViewsBase + 'solucoes.html#personalizadas">Sob medida</a></li>' +
                '<li><a href="' + subViewsBase + 'solucoes.html#automacao">Automação</a></li>' +
              '</ul>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h6>Empresa</h6>' +
              '<ul>' +
                '<li><a href="' + subViewsBase + 'sobre.html">Sobre a Hifera</a></li>' +
                '<li><a href="' + subViewsBase + 'sobre.html#fundadores">Fundadores</a></li>' +
                '<li><a href="' + subViewsBase + 'sobre.html#contato">Contato</a></li>' +
              '</ul>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h6>Contato</h6>' +
              '<ul>' +
                '<li><a href="mailto:' + BRAND.email + '">' + BRAND.email + '</a></li>' +
                '<li><a href="#" aria-label="LinkedIn">LinkedIn</a></li>' +
                '<li><a href="' + subViewsBase + 'login.html">Área do cliente</a></li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="footer-bottom">' +
            '<span>© ' + year + ' Hifera Company · Todos os direitos reservados</span>' +
            '<span>Feito com tecnologia que trabalha por você</span>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  /* ----------------------------------------------------------------
     Comportamentos
     ---------------------------------------------------------------- */
  function attachNavScroll() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 8) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function attachMobileMenu() {
    var btn = document.getElementById('nav-menu-btn');
    var panel = document.getElementById('nav-mobile');
    if (!btn || !panel) return;

    var close = function () {
      panel.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    var toggle = function () {
      var open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', toggle);

    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* Anima elementos com .reveal quando entram no viewport */
  function attachReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Spotlight que segue o cursor em cards marcados com .card-spotlight */
  function attachSpotlight() {
    var cards = document.querySelectorAll('.card-spotlight, .bento-card, .step, .faq-item, .product-card');
    cards.forEach(function (c) {
      c.classList.add('card-spotlight');
      c.addEventListener('pointermove', function (e) {
        var rect = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        c.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ----------------------------------------------------------------
     Bootstrap
     ---------------------------------------------------------------- */
  function init() {
    var depth = detectDepth();

    var navMount = document.querySelector('[data-nav]');
    if (navMount) navMount.outerHTML = navHTML(depth);

    var footerMount = document.querySelector('[data-footer]');
    if (footerMount) footerMount.outerHTML = footerHTML(depth);

    attachNavScroll();
    attachMobileMenu();
    attachReveal();
    attachSpotlight();
  }

  global.Layout = {
    init: init,
    getDepth: detectDepth,
    getBase: function () { return base(detectDepth()); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
