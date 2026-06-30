/* =================================================================
   LoginController — orquestra a tela de login/cadastro
   Lógica mockada (sem backend real). Usa AuthModel para persistir
   uma sessão fake no localStorage e redireciona para a home.
   ================================================================= */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function el(id) { return document.getElementById(id); }

  function setMode(mode) {
    document.body.setAttribute('data-mode', mode);
    var tabs = el('auth-tabs');
    if (tabs) tabs.setAttribute('data-mode', mode);
    document.querySelectorAll('.auth-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    el('auth-title').textContent = mode === 'signup' ? 'Crie sua conta' : 'Bem-vindo de volta';
    el('auth-sub').textContent   = mode === 'signup'
      ? 'Comece a usar o hub digital da Hifera em segundos.'
      : 'Acesse seu painel da Hifera Company.';
    el('auth-submit-label').textContent = mode === 'signup' ? 'Criar minha conta' : 'Entrar';
    el('footer-prompt').innerHTML = mode === 'signup'
      ? 'Já tem conta? <a href="#" data-go="login">Entrar</a>'
      : 'Não tem conta? <a href="#" data-go="signup">Criar agora</a>';
    clearMsg();
  }

  function showMsg(kind, text) {
    var box = el('auth-msg');
    box.className = 'auth-msg is-shown ' + kind;
    box.textContent = text;
  }
  function clearMsg() {
    var box = el('auth-msg');
    box.className = 'auth-msg';
    box.textContent = '';
  }

  function togglePassword(btn) {
    var input = btn.parentElement.querySelector('input');
    var open  = btn.querySelector('.eye-open');
    var shut  = btn.querySelector('.eye-shut');
    var hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    open.style.display = hidden ? 'none' : '';
    shut.style.display = hidden ? '' : 'none';
  }

  function loginFlow(email, password) {
    if (!EMAIL_RE.test(email))     return showMsg('error', 'Informe um e-mail válido.');
    if (password.length < 4)       return showMsg('error', 'A senha precisa ter pelo menos 4 caracteres.');

    setLoading(true);
    var attempt = window.Auth
      ? window.Auth.login(email, password)
      : Promise.reject(new Error('Auth indisponível'));

    attempt.then(function (session) {
      showMsg('success', 'Bem-vindo, ' + (session.name || email) + '! Abrindo o painel…');
      var dest = session.role === 'manager' ? 'admin.html' : 'home.html';
      setTimeout(function () { window.location.href = dest; }, 700);
    }).catch(function () {
      setLoading(false);
      showMsg('error', 'E-mail ou senha incorretos.');
    });
  }

  function signupFlow(name, email, password, confirm) {
    if (name.trim().length < 2)    return showMsg('error', 'Informe seu nome.');
    if (!EMAIL_RE.test(email))     return showMsg('error', 'Informe um e-mail válido.');
    if (password.length < 6)       return showMsg('error', 'Crie uma senha de pelo menos 6 caracteres.');
    if (password !== confirm)      return showMsg('error', 'As senhas não conferem.');

    setLoading(true);
    setTimeout(function () {
      showMsg('success', 'Conta criada! (modo demonstração) Entrando no painel…');
      setTimeout(function () { window.location.href = 'home.html'; }, 900);
    }, 1100);
  }

  function setLoading(on) {
    var btn = el('auth-submit');
    btn.classList.toggle('is-loading', on);
    btn.disabled = on;
  }

  function googleFlow() {
    showMsg('info', 'Conectando com Google… (modo demonstração)');
    setTimeout(function () {
      if (window.Auth) {
        window.Auth.login('admin', 'admin').catch(function () {});
      }
      showMsg('success', 'Autenticação Google simulada. Abrindo o painel…');
      setTimeout(function () { window.location.href = 'admin.html'; }, 700);
    }, 900);
  }

  function forgotFlow() {
    var email = el('email').value.trim();
    if (!EMAIL_RE.test(email)) {
      return showMsg('error', 'Preencha o e-mail acima para recuperar a senha.');
    }
    showMsg('info', 'Enviamos instruções para ' + email + ' (modo demonstração).');
  }

  function bind() {
    document.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { setMode(tab.dataset.mode); });
    });

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-go]');
      if (!trigger) return;
      e.preventDefault();
      setMode(trigger.dataset.go);
    });

    document.querySelectorAll('.eye-toggle').forEach(function (b) {
      b.addEventListener('click', function () { togglePassword(b); });
    });

    el('auth-form').addEventListener('submit', function (e) {
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

    el('btn-google').addEventListener('click', googleFlow);
    el('forgot').addEventListener('click', function (e) { e.preventDefault(); forgotFlow(); });

    // Modo inicial
    setMode('login');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
