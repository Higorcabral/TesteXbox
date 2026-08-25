/* =================================================================
   HIFERA ADMIN · Model · Persistência
   Wrapper fininho sobre o localStorage. Único ponto do painel que
   fala com o storage — se um dia virar API/Supabase, troca só aqui.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.StoreModel = (function () {
  'use strict';

  function disponivel() {
    try {
      var k = '__hifera_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function ler(chave, fallback) {
    try {
      var raw = localStorage.getItem(chave);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Hifera] storage ilegível em "' + chave + '":', e);
      return fallback;
    }
  }

  function gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.error('[Hifera] falha ao gravar "' + chave + '":', e);
      return false;
    }
  }

  function limpar(chave) {
    try { localStorage.removeItem(chave); return true; }
    catch (e) { return false; }
  }

  return {
    disponivel: disponivel,
    ler: ler,
    gravar: gravar,
    limpar: limpar
  };
})();
