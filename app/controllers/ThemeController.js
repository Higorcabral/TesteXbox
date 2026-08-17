/* =================================================================
   ThemeController — switch entre tema claro e escuro
   Persiste em localStorage. Respeita preferência do SO na 1ª visita.
   Usa delegação de evento — o botão pode ser injetado dinamicamente
   depois deste script rodar.
   ================================================================= */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'hifera.theme';
  var ATTR = 'data-theme';

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function systemPrefersLight() {
    return global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches;
  }

  function resolveInitial() {
    var stored = getStored();
    if (stored === 'light' || stored === 'dark') return stored;
    return systemPrefersLight() ? 'light' : 'dark';
  }

  function apply(theme) {
    document.documentElement.setAttribute(ATTR, theme);
    syncToggleState(theme);
  }

  function syncToggleState(theme) {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    var isLight = theme === 'light';
    toggle.setAttribute('aria-pressed', String(isLight));
    toggle.setAttribute('aria-label', isLight ? 'Alternar para tema escuro' : 'Alternar para tema claro');
    toggle.title = isLight ? 'Tema claro ativo' : 'Tema escuro ativo';
  }

  function toggle() {
    var current = document.documentElement.getAttribute(ATTR) || 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    apply(next);
  }

  /* Aplica o tema o quanto antes para evitar flash visual */
  apply(resolveInitial());

  /* Delegação: pega qualquer #theme-toggle, mesmo se injetado depois */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('#theme-toggle');
    if (t) { toggle(); }
  });

  /* Sincroniza o estado do botão assim que ele existir */
  var mo = new MutationObserver(function () {
    if (document.getElementById('theme-toggle')) {
      syncToggleState(document.documentElement.getAttribute(ATTR) || 'dark');
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  global.Theme = { apply: apply, toggle: toggle };
})(window);
