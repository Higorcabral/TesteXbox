/* =================================================================
   API — camada de dados
   Hoje: localStorage. Amanhã: trocar implementação interna por fetch().
   Contrato público (Api.solutions.*) permanece o mesmo.
   ================================================================= */
(function (global) {
  'use strict';

  /* v2: fotos ecommerce + preços de exemplo. Bumping versão força reseed. */
  var STORAGE_KEY = 'hifera.solutions.v2';
  var SEED_FLAG = 'hifera.seeded.v2';

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[Api] read failed', e);
      return [];
    }
  }

  function write(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function uid() {
    return 'sol_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  var Api = {
    solutions: {
      list: function () {
        return Promise.resolve(read());
      },
      get: function (id) {
        var found = read().find(function (s) { return s.id === id; });
        return Promise.resolve(found || null);
      },
      create: function (data) {
        var list = read();
        var item = Object.assign({}, data, {
          id: data.id || uid(),
          createdAt: new Date().toISOString(),
          interestedCount: 0,
          status: data.status || 'available'
        });
        list.push(item);
        write(list);
        return Promise.resolve(item);
      },
      update: function (id, patch) {
        var list = read();
        var idx = list.findIndex(function (s) { return s.id === id; });
        if (idx === -1) return Promise.reject(new Error('Not found'));
        list[idx] = Object.assign({}, list[idx], patch, {
          updatedAt: new Date().toISOString()
        });
        write(list);
        return Promise.resolve(list[idx]);
      },
      remove: function (id) {
        var list = read().filter(function (s) { return s.id !== id; });
        write(list);
        return Promise.resolve(true);
      },
      addInterest: function (id) {
        var list = read();
        var idx = list.findIndex(function (s) { return s.id === id; });
        if (idx === -1) return Promise.reject(new Error('Not found'));
        list[idx].interestedCount = (list[idx].interestedCount || 0) + 1;
        write(list);
        return Promise.resolve(list[idx]);
      }
    },

    _internal: {
      isSeeded: function () { return localStorage.getItem(SEED_FLAG) === '1'; },
      markSeeded: function () { localStorage.setItem(SEED_FLAG, '1'); },
      seed: function (items) {
        write(items);
        this.markSeeded();
      },
      reset: function () {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SEED_FLAG);
      }
    }
  };

  global.Api = Api;
})(window);
