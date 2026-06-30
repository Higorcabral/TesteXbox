/* =================================================================
   ThemeController — gerencia o switch entre tema claro e escuro
   Persiste a escolha em localStorage. Respeita preferência do SO
   na primeira visita.
   ================================================================= */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'hifera.theme';
  var ATTR = 'data-theme';

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function systemPrefersLight() {
    return global.matchMedia &&
           global.matchMedia('(prefers-color-scheme: light)').matches;
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
    toggle.setAttribute(
      'aria-label',
      isLight ? 'Alternar para tema escuro' : 'Alternar para tema claro'
    );
    toggle.title = isLight ? 'Tema claro ativo' : 'Tema escuro ativo';
  }

  function toggle() {
    var current = document.documentElement.getAttribute(ATTR) || 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    apply(next);
  }

  function bind() {
    var toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn && !toggleBtn.__bound) {
      toggleBtn.addEventListener('click', toggle);
      toggleBtn.__bound = true;
    }
    syncToggleState(document.documentElement.getAttribute(ATTR) || 'dark');
  }

  /* Aplica o tema o quanto antes para evitar flash visual */
  apply(resolveInitial());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  global.Theme = { apply: apply, toggle: toggle };
})(window);
