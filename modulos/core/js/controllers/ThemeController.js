/* =================================================================
   HIFERA ADMIN · Controller · Tema
   Escuro é o padrão (é o que combina com a home). O claro é escolha
   explícita do usuário e fica guardada no navegador.

   O <script> que aplica o tema roda inline no <head> das páginas,
   antes do CSS pintar — senão o painel pisca escuro antes de virar
   claro em todo carregamento.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ThemeController = (function () {
  'use strict';

  var CHAVE = 'hifera.admin.tema';
  var ESCURO = 'escuro', CLARO = 'claro';

  function lido() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }

  function atual() {
    return document.documentElement.getAttribute('data-tema') === CLARO ? CLARO : ESCURO;
  }

  function aplicar(tema, persistir) {
    var t = tema === CLARO ? CLARO : ESCURO;
    document.documentElement.setAttribute('data-tema', t);

    /* A barra do navegador no mobile acompanha */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === CLARO ? '#f7f8fa' : '#0a0a0b');

    if (persistir !== false) {
      try { localStorage.setItem(CHAVE, t); } catch (e) { /* modo privado */ }
    }
    atualizarBotao();
    return t;
  }

  function alternar() {
    var novo = aplicar(atual() === CLARO ? ESCURO : CLARO);
    /* O gráfico é SVG: as cores vêm de CSS var, mas o redesenho
       garante que legenda e tooltip peguem os novos tokens. */
    document.dispatchEvent(new CustomEvent('hifera:tema', { detail: { tema: novo } }));
    return novo;
  }

  var SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
            '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4' +
            'M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var LUA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function atualizarBotao() {
    var btn = document.getElementById('btnTema');
    if (!btn) return;
    var claro = atual() === CLARO;
    /* Mostra o destino, não o estado — é o que o clique vai fazer */
    btn.innerHTML = claro ? LUA : SOL;
    btn.setAttribute('title', claro ? 'Mudar para o tema escuro' : 'Mudar para o tema claro');
    btn.setAttribute('aria-label', btn.getAttribute('title'));
    btn.setAttribute('aria-pressed', String(claro));
  }

  function init() {
    /* O head já aplicou; aqui só sincroniza o botão e liga o clique */
    aplicar(lido() === CLARO ? CLARO : ESCURO, false);

    var btn = document.getElementById('btnTema');
    if (btn) btn.addEventListener('click', alternar);
  }

  return { init: init, alternar: alternar, aplicar: aplicar, atual: atual };
})();
