/* =================================================================
   ROUTES — mapa de rotas da aplicação
   Centraliza os caminhos das views para que controllers e links
   possam consultar a partir de um ponto único.
   ================================================================= */
(function (global) {
  'use strict';

  var BASE = '../../app/views/';

  var ROUTES = {
    home:          BASE + 'home.html',
    solucoes:      BASE + 'solucoes-prontas.html',
    personalizadas:BASE + 'personalizadas.html',
    automacao:     BASE + 'automacao.html',
    sobre:         BASE + 'sobre.html',
    contato:       BASE + 'sobre.html#contato'
  };

  global.Routes = {
    get: function (name) { return ROUTES[name]; },
    all: function () { return Object.assign({}, ROUTES); }
  };
})(window);
