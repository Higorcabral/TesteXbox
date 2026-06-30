/* =================================================================
   AUTH — controle de sessão (cliente vs gestor)
   Hoje: validação local com usuários hardcoded.
   Amanhã: trocar Auth._validate por chamada a backend (Firebase/API).
   ================================================================= */
(function (global) {
  'use strict';

  var SESSION_KEY = 'hifera.session.v1';

  /* IMPORTANTE: credenciais mockadas — somente para o protótipo.
     Em produção, validar contra um backend e nunca expor segredos no client. */
  var ADMIN_PASS = 'admin@hifera#2026##';
  var USERS = [
    { user: 'cliente', pass: 'cliente', role: 'client',  name: 'Cliente Demo' },
    { user: 'admin',   pass: 'admin',   role: 'manager', name: 'Gestor Hifera' },
    { user: 'higorcabral007@gmail.com',  pass: ADMIN_PASS, role: 'manager', name: 'Higor Cavalcante' },
    { user: 'feferona123456@gmail.com',  pass: ADMIN_PASS, role: 'manager', name: 'Fernanda Rodrigues' }
  ];

  function readSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeSession(s) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  var Auth = {
    currentUser: function () {
      return readSession();
    },
    isAuthenticated: function () {
      return !!readSession();
    },
    isManager: function () {
      var s = readSession();
      return !!s && s.role === 'manager';
    },
    login: function (user, pass) {
      return Auth._validate(user, pass).then(function (match) {
        if (!match) throw new Error('Credenciais inválidas');
        var session = {
          user: match.user,
          role: match.role,
          name: match.name,
          startedAt: new Date().toISOString()
        };
        writeSession(session);
        return session;
      });
    },
    logout: function () {
      localStorage.removeItem(SESSION_KEY);
      return Promise.resolve(true);
    },
    requireAuth: function (redirectTo) {
      if (!Auth.isAuthenticated()) {
        window.location.href = redirectTo || 'login.html';
        return false;
      }
      return true;
    },
    requireManager: function (redirectTo) {
      if (!Auth.isManager()) {
        window.location.href = redirectTo || 'login.html';
        return false;
      }
      return true;
    },
    /* trocar este método por fetch('/api/login', ...) quando houver backend */
    _validate: function (user, pass) {
      var match = USERS.find(function (u) {
        return u.user === user && u.pass === pass;
      });
      return Promise.resolve(match || null);
    }
  };

  global.Auth = Auth;
})(window);
