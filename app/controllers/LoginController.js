/* =================================================================
   LoginController — orquestra tela de login/cadastro
   Auth mockada via AuthModel (localStorage). Sem backend real.
   ================================================================= */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var el = function (id) { return document.getElementById(id); };

  function setMode(mode) {
    document.body.setAttribute('data-mode', mode);
    document.querySelectorAll('.auth-tab').forEach(function (t) {
      var active = t.dataset.mode === mode;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    el('auth-title').textContent = mode === 'signup' ? 'Crie sua conta' : 'Bem-vindo de volta';
    el('auth-sub').textContent   = mode === 'signup'
      ? 'Comece a usar o hub digital da Hifera em segundos.'
      : 'Acesse seu painel da Hifera Company.';
    el('auth-submit-label').textContent = mode === 'signup' ? 'Criar minha conta' : 'Entrar';
    el('footer-prompt').innerHTML = mode === 'signup'
      ? 'Já tem conta? <a href="#" data-go="login">Entrar</a>'
      : 'Não tem conta? <a href="#" data-go="signup">Criar agora</a>';

    /* Mostra/esconde campos conforme o modo */
    var signupFields = document.querySelectorAll('[data-signup-only]');
    signupFields.forEach(function (f) {
      f.style.display = (mode === 'signup') ? '' : 'none';
      var input = f.querySelector('input');
      if (input) input.required = (mode === 'signup');
    });

    clearMsg();
  }

  function showMsg(kind, text) {
    var box = el('auth-msg');
    box.className = 'auth-msg is-' + kind + ' is-shown';
    box.textContent = text;
  }
  function clearMsg() {
    var box = el('auth-msg');
    box.className = 'auth-msg';
    box.textContent = '';
  }

  function setLoading(on) {
    var btn = el('auth-submit');
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    el('auth-submit-label').textContent = on
      ? 'Aguarde…'
      : (document.body.getAttribute('data-mode') === 'signup' ? 'Criar minha conta' : 'Entrar');
  }

  function homeUrl()   { return '../../index.html'; }
  function adminUrl()  { return 'admin.html'; }

  function loginFlow(email, password) {
    if (!EMAIL_RE.test(email))  return showMsg('error', 'Informe um e-mail válido.');
    if (password.length < 4)    return showMsg('error', 'A senha precisa ter pelo menos 4 caracteres.');

    setLoading(true);
    var attempt = window.Auth
      ? window.Auth.login(email, password)
      : Promise.reject(new Error('Auth indisponível'));

    attempt.then(function (session) {
      showMsg('success', 'Bem-vindo, ' + (session.name || email) + '! Abrindo o painel…');
      var dest = session.role === 'manager' ? adminUrl() : homeUrl();
      setTimeout(function () { window.location.href = dest; }, 700);
    }).catch(function () {
      setLoading(false);
      showMsg('error', 'E-mail ou senha incorretos.');
    });
  }

  function signupFlow(name, email, password, confirm) {
    if (name.trim().length < 2) return showMsg('error', 'Informe seu nome.');
    if (!EMAIL_RE.test(email))  return showMsg('error', 'Informe um e-mail válido.');
    if (password.length < 6)    return showMsg('error', 'Crie uma senha de pelo menos 6 caracteres.');
    if (password !== confirm)   return showMsg('error', 'As senhas não conferem.');

    setLoading(true);
    setTimeout(function () {
      showMsg('success', 'Conta criada! (modo demonstração) Redirecionando…');
      setTimeout(function () { window.location.href = homeUrl(); }, 900);
    }, 900);
  }

  function togglePassword(btn) {
    var wrapper = btn.parentElement;
    var input = wrapper.querySelector('input');
    var open = btn.querySelector('.eye-open');
    var shut = btn.querySelector('.eye-shut');
    var hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    if (open) open.style.display = hidden ? 'none' : '';
    if (shut) shut.style.display = hidden ? '' : 'none';
  }

  function forgotFlow() {
    var email = el('email').value.trim();
    if (!EMAIL_RE.test(email)) {
      return showMsg('error', 'Preencha o e-mail para recuperar a senha.');
    }
    showMsg('info', 'Enviamos instruções para ' + email + ' (modo demonstração).');
  }

  function bind() {
    document.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { setMode(tab.dataset.mode); });
    });

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-go]');
      if (!trigger) return;
      e.preventDefault();
      setMode(trigger.dataset.go);
    });

    document.querySelectorAll('.eye-toggle').forEach(function (b) {
      b.addEventListener('click', function () { togglePassword(b); });
    });

    var form = el('auth-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mode = document.body.getAttribute('data-mode') || 'login';
      var email = el('email').value.trim();
      var password = el('password').value;
      if (mode === 'signup') {
        signupFlow(el('name').value, email, password, el('confirm').value);
      } else {
        loginFlow(email, password);
      }
    });

    var forgot = el('forgot');
    if (forgot) forgot.addEventListener('click', function (e) { e.preventDefault(); forgotFlow(); });

    setMode('login');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
