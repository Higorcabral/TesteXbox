/* =================================================================
   HIFERA PORTAL · Controller · Entrada do cliente
   -----------------------------------------------------------------
   Liga a tela de login do cliente ao ClientAuthModel e faz o guard do
   painel. Espelha o AuthController interno — inclusive na devolução
   para o link que a pessoa tentou abrir — mas com sessão própria:
   entrar no portal NÃO dá acesso ao painel da Hifera, e vice-versa.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.PortalAuthController = (function () {
  'use strict';

  var Auth = HiferaPortal.ClientAuthModel;

  var LOGIN = 'index.html';
  var HOME  = 'painel.html';
  var CHAVE_DESTINO = 'hifera.portal.destino';

  function guardarDestino(href) {
    try { sessionStorage.setItem(CHAVE_DESTINO, href); } catch (e) { /* modo privado */ }
  }

  /* Só destino de mesma origem sai daqui. */
  function resgatarDestino() {
    var bruto;
    try {
      bruto = sessionStorage.getItem(CHAVE_DESTINO);
      sessionStorage.removeItem(CHAVE_DESTINO);
    } catch (e) { return null; }
    if (!bruto) return null;
    try {
      var url = new URL(bruto, window.location.href);
      return url.origin === window.location.origin ? url.href : null;
    } catch (e) { return null; }
  }

  /* --- Tela de login ------------------------------------------------ */
  function initLogin() {
    var form = document.getElementById('formLogin');
    if (!form) return;

    if (Auth.isAuthenticated()) {
      window.location.replace(resgatarDestino() || HOME);
      return;
    }

    var sel    = document.getElementById('contaCliente');
    var btn    = document.getElementById('btnEntrar');
    var status = document.getElementById('loginStatus');
    var ficha  = document.getElementById('contaFicha');

    /* As contas são de demonstração: no lugar de um campo de e-mail
       que não valida nada, uma lista honesta de com quem entrar. */
    sel.innerHTML = Auth.contas().map(function (c, i) {
      return '<option value="' + c.cliente + '"' + (i === 0 ? ' selected' : '') + '>' +
             c.cliente + '</option>';
    }).join('');

    function pintarFicha() {
      var c = Auth.contaDe(sel.value);
      if (!c || !ficha) return;
      ficha.innerHTML =
        '<span class="cf-av">' + c.iniciais + '</span>' +
        '<span class="cf-txt"><strong>' + c.nome + '</strong>' +
        '<small>' + c.papel + ' · ' + c.email + '</small></span>';
    }
    sel.addEventListener('change', pintarFicha);
    pintarFicha();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.classList.contains('is-loading')) return;

      btn.classList.add('is-loading');
      btn.disabled = true;
      if (status) status.textContent = 'Verificando o acesso…';

      Auth.signIn(sel.value).then(function (r) {
        if (status) {
          status.textContent = 'Bem-vindo(a), ' + r.user.nome + '. Abrindo o portal…';
          status.classList.add('is-ok');
        }
        var destino = resgatarDestino();
        setTimeout(function () { window.location.href = destino || HOME; }, 420);
      }).catch(function () {
        btn.classList.remove('is-loading');
        btn.disabled = false;
        if (status) status.textContent = 'Não foi possível entrar com essa conta.';
      });
    });
  }

  /* --- Guard do painel ---------------------------------------------- */
  function exigirSessao() {
    if (!Auth.isAuthenticated()) {
      guardarDestino(window.location.href);
      window.location.replace(LOGIN);
      return false;
    }
    return true;
  }

  function signOut() {
    Auth.signOut();
    try { sessionStorage.removeItem(CHAVE_DESTINO); } catch (e) {}
    window.location.replace(LOGIN);
  }

  return {
    initLogin: initLogin,
    exigirSessao: exigirSessao,
    signOut: signOut
  };
})();
