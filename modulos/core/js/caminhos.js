/* =================================================================
   HIFERA MÓDULOS · Core · Caminhos
   -----------------------------------------------------------------
   O login mora em /modulos/ e os módulos em /modulos/<nome>/, ou
   seja: cada tela está a uma profundidade diferente da raiz do site.
   Antes isso era um '../' escrito à mão dentro do format.js e do
   ProjectsController — o que travava a estrutura de pastas.

   Agora cada página declara os seus caminhos no <head>, ANTES de
   carregar qualquer script:

     <script>window.HIFERA_PATHS = {
       site:  '../../',       raiz do site (index.html, assets/, projetos/)
       login: '../',          onde está a tela de login
       home:  '../admin/'     para onde ir depois de autenticar
     };</script>

   Quem move uma pasta de lugar mexe só nessas três linhas.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.Caminhos = (function () {
  'use strict';

  var p = window.HIFERA_PATHS || {};

  /* Barra no fim é obrigatória em prefixo de pasta — sem ela,
     'site' + 'assets/x.png' vira '..assets/x.png'.

     Mas só em pasta: 'home' pode apontar para um arquivo
     ('./painel.html'), e acrescentar barra ali produziria
     './painel.html/', que dá 404. */
  function pasta(valor, padrao) {
    var v = String(valor || padrao);
    if (!v || v.slice(-1) === '/') return v;
    var ultimo = v.split('/').pop();
    return ultimo.indexOf('.') > 0 ? v : v + '/';
  }

  return {
    site:  pasta(p.site,  '../'),
    login: pasta(p.login, '../'),
    home:  pasta(p.home,  '../admin/')
  };
})();
