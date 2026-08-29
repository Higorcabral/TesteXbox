/* =================================================================
   HIFERA ADMIN · Controller · Autenticação
   Liga a tela de login ao AuthModel e faz o guard das telas internas.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.AuthController = (function () {
  'use strict';

  var Auth = HiferaAdmin.AuthModel;

  /* Cada página declara onde ficam login e home em HIFERA_PATHS —
     o controller não sabe (nem precisa saber) a profundidade da pasta. */
  var HOME  = HiferaAdmin.Caminhos.home;    /* pós-login: Gestão de Projetos */
  var LOGIN = HiferaAdmin.Caminhos.login;

  /* Onde a pessoa estava tentando entrar quando o guard barrou.
     Sem isto, um link direto para projeto.html?id=… é jogado fora no
     caminho e todo mundo cai no painel genérico depois do login. */
  var CHAVE_DESTINO = 'hifera.admin.destino';

  function guardarDestino(href) {
    try { sessionStorage.setItem(CHAVE_DESTINO, href); } catch (e) { /* modo privado */ }
  }

  /* Só devolve destino de MESMA ORIGEM. O valor sai do sessionStorage,
     que é nosso, mas validar aqui é o que impede isto de virar um
     redirecionador aberto se um dia alguém escrever a chave de fora. */
  function resgatarDestino() {
    var bruto;
    try {
      bruto = sessionStorage.getItem(CHAVE_DESTINO);
      sessionStorage.removeItem(CHAVE_DESTINO);
    } catch (e) { return null; }
    if (!bruto) return null;
    try {
      var url = new URL(bruto, window.location.href);
      if (url.origin !== window.location.origin) return null;
      return url.href;
    } catch (e) { return null; }
  }

  function irPara(destino) {
    window.location.href = destino || HOME;
  }

  /* "projeto.html" não diz nada para quem lê. Traduz a rota para o
     nome da tela; o que não estiver no mapa vira uma frase genérica. */
  var NOME_ROTA = [
    { teste: /\/admin\/projeto\.html/, nome: 'a página do projeto' },
    { teste: /\/admin\/?($|\?)/,       nome: 'a Gestão de Projetos' },
    { teste: /\/chamados\//,           nome: 'os Chamados' }
  ];

  function nomeDoDestino(href) {
    var caminho;
    try {
      caminho = new URL(href, window.location.href).pathname;
    } catch (e) {
      return 'a página que você abriu';
    }
    for (var i = 0; i < NOME_ROTA.length; i++) {
      if (NOME_ROTA[i].teste.test(caminho)) return NOME_ROTA[i].nome;
    }
    return 'a página que você abriu';
  }

  /* --- Tela de login -------------------------------------------- */
  function initLogin() {
    var btn    = document.getElementById('btnMicrosoft');
    var status = document.getElementById('loginStatus');
    if (!btn) return;

    /* Espiada sem consumir: serve para avisar na tela para onde a
       pessoa volta, e para o caso de já haver sessão nesta aba. */
    var pendente;
    try { pendente = sessionStorage.getItem(CHAVE_DESTINO); } catch (e) { pendente = null; }

    /* Já autenticado nesta aba? Vai direto — de volta ao que pediu. */
    if (Auth.isAuthenticated()) {
      window.location.replace(resgatarDestino() || HOME);
      return;
    }

    var aviso = document.getElementById('loginDestino');
    if (aviso && pendente) {
      aviso.textContent = 'Depois de entrar você volta para ' + nomeDoDestino(pendente) + '.';
      aviso.hidden = false;
    }

    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-loading')) return;

      btn.classList.add('is-loading');
      btn.disabled = true;
      if (status) status.textContent = 'Conectando à conta Microsoft…';

      Auth.signIn().then(function (session) {
        if (status) {
          status.textContent = 'Autenticado como ' + session.user.email + '. Abrindo o painel…';
          status.classList.add('is-ok');
        }
        var destino = resgatarDestino();
        setTimeout(function () { irPara(destino); }, 420);
      });
    });
  }

  /* --- Guard das telas internas --------------------------------- */
  function requireAuth() {
    if (!Auth.isAuthenticated()) {
      guardarDestino(window.location.href);
      window.location.replace(LOGIN);
      return false;
    }
    return true;
  }

  function signOut() {
    Auth.signOut();
    /* Sair é intencional: não guarda destino, senão o próximo login
       joga a pessoa de volta na tela de onde ela acabou de sair. */
    try { sessionStorage.removeItem(CHAVE_DESTINO); } catch (e) {}
    window.location.replace(LOGIN);
  }

  return {
    initLogin: initLogin,
    requireAuth: requireAuth,
    signOut: signOut
  };
})();
