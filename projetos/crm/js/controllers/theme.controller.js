/* =========================================================
   Rubra CRM, Controller: alternância de tema (claro/escuro)
   Persiste em localStorage ("rubra-theme") e respeita o SO
   na primeira carga.
   ========================================================= */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'rubra-theme';

  const ThemeController = {
    init() {
      const root = document.documentElement;
      const btn  = document.getElementById('themeToggle');
      const iconMoon = document.getElementById('iconMoon');
      const iconSun  = document.getElementById('iconSun');
      if (!btn || !iconMoon || !iconSun) return;

      function apply(theme) {
        root.setAttribute('data-theme', theme);
        const dark = theme === 'dark';
        iconMoon.style.display = dark ? 'none' : '';
        iconSun.style.display  = dark ? ''     : 'none';
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
      }

      let initial;
      try { initial = localStorage.getItem(STORAGE_KEY); } catch (e) {}
      if (!initial) {
        initial = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      apply(initial);

      btn.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') || 'light';
        apply(current === 'dark' ? 'light' : 'dark');
      });
    }
  };

  global.CRM = global.CRM || {};
  global.CRM.ThemeController = ThemeController;
})(window);
