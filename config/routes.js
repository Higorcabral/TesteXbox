/* =================================================================
   ROUTES — mapa central de rotas da aplicação
   Referência única para caminhos das views. Consultado por controllers
   ou por links dinâmicos que precisem se resolver em runtime.
   ================================================================= */
(function (global) {
  'use strict';

  /* Caminhos são relativos à raiz do site. Consumidor pode prefixar
     com a base necessária ('' na raiz, '../../' dentro de app/views/).  */
  var ROUTES = {
    home:           'index.html',
    solucoes:       'app/views/solucoes.html',
    solucoesTab:    function (tab) { return 'app/views/solucoes.html#' + tab; },
    sobre:          'app/views/sobre.html',
    contato:        'app/views/sobre.html#contato',
    fundadores:     'app/views/sobre.html#fundadores',
    login:          'app/views/login.html',
    admin:          'app/views/admin.html',
    ledger:         'apps/ledger/'
  };

  global.Routes = {
    get: function (name) { return ROUTES[name]; },
    all: function () { return Object.assign({}, ROUTES); }
  };
})(window);
