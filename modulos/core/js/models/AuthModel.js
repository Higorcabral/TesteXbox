/* =================================================================
   HIFERA ADMIN · Model · Autenticação
   -----------------------------------------------------------------
   ATENÇÃO — ISTO É UMA FACHADA, NÃO É SEGURANÇA.
   A sessão vive no sessionStorage do próprio navegador, então
   qualquer pessoa com o console aberto entra. Serve só para
   prototipar o fluxo de telas.

   Para virar acesso real, trocar `signIn()` por MSAL Browser
   (Entra ID / Azure AD) e mover qualquer dado sensível para um
   backend que valide o token de verdade:
     - App Registration no Entra ID (SPA, redirect URI = /modulos/)
     - @azure/msal-browser -> loginPopup({ scopes: ['User.Read'] })
     - o painel só renderiza depois de validar o token no servidor
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.AuthModel = (function () {
  'use strict';

  var SESSION_KEY = 'hifera.admin.session';

  /* Perfil mockado — no MSAL real isto vem do account/idTokenClaims */
  var MOCK_USER = {
    nome:    'Higor Cabral',
    email:   'higor@hifera.com',
    cargo:   'Co-fundador · Tecnologia',
    iniciais:'HC',
    tenant:  'Hifera Company'
  };

  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isAuthenticated() {
    var s = getSession();
    return !!(s && s.user);
  }

  /* Simula o round-trip do popup da Microsoft (latência artificial) */
  function signIn() {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var session = {
          user: MOCK_USER,
          provider: 'microsoft-mock',
          entrouEm: new Date().toISOString()
        };
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (e) { /* modo privado — segue sem persistir */ }
        resolve(session);
      }, 900);
    });
  }

  function signOut() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function getUser() {
    var s = getSession();
    return s ? s.user : null;
  }

  return {
    isAuthenticated: isAuthenticated,
    signIn: signIn,
    signOut: signOut,
    getUser: getUser
  };
})();
