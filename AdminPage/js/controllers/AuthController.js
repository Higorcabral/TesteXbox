/* =================================================================
   HIFERA ADMIN · Controller · Autenticação
   Liga a tela de login ao AuthModel e faz o guard das telas internas.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.AuthController = (function () {
  'use strict';

  var Auth = HiferaAdmin.AuthModel;
  var HOME = 'projetos.html';   /* pós-login: Gestão de Projetos */
  var LOGIN = 'index.html';

  /* --- Tela de login -------------------------------------------- */
  function initLogin() {
    var btn    = document.getElementById('btnMicrosoft');
    var status = document.getElementById('loginStatus');
    if (!btn) return;

    /* Já autenticado nesta aba? Vai direto pro painel. */
    if (Auth.isAuthenticated()) {
      window.location.replace(HOME);
      return;
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
        setTimeout(function () { window.location.href = HOME; }, 420);
      });
    });
  }

  /* --- Guard das telas internas --------------------------------- */
  function requireAuth() {
    if (!Auth.isAuthenticated()) {
      window.location.replace(LOGIN);
      return false;
    }
    return true;
  }

  function signOut() {
    Auth.signOut();
    window.location.replace(LOGIN);
  }

  return {
    initLogin: initLogin,
    requireAuth: requireAuth,
    signOut: signOut
  };
})();
