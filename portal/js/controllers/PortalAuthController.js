/* =================================================================
   HIFERA PORTAL · Controller · Entrada do cliente
   -----------------------------------------------------------------
   Liga a tela de entrada ao ClientAuthModel e faz o guard do painel.
   Espelha o AuthController interno — inclusive na devolução para o
   link que a pessoa tentou abrir — mas com sessão própria: entrar no
   portal NÃO dá acesso ao painel da Hifera, e vice-versa.

   A tela tem dois estados, e qual aparece é decidido pelo model, nunca
   por parâmetro de URL:
     · e-mail + magic link          → Supabase configurado
     · "nenhum cliente cadastrado"  → sem configuração, com um acesso
                                       de exemplo ao lado do recado
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.PortalAuthController = (function () {
  'use strict';

  var Auth = HiferaPortal.ClientAuthModel;

  var LOGIN = 'index.html';
  var HOME  = 'painel.html';
  var CHAVE_DESTINO = 'hifera.portal.destino';

  function el(id) { return document.getElementById(id); }

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

  function dizer(texto, classe) {
    var status = el('loginStatus');
    if (!status) return;
    status.textContent = texto || '';
    status.className = 'login-status' + (classe ? ' ' + classe : '');
  }

  /* --- Tela de entrada ---------------------------------------------- */
  function initLogin() {
    if (Auth.isAuthenticated()) {
      window.location.replace(resgatarDestino() || HOME);
      return;
    }

    var erro = Auth.erro();
    if (Auth.configurado()) montarMagicLink(erro);
    else montarSemClientes(erro);
  }

  /* Supabase ligado: e-mail e link. Sem lista de contas, sem senha. */
  function montarMagicLink(erroInicial) {
    var bloco = el('loginModos');
    if (!bloco) return;

    bloco.innerHTML =
      '<form id="formLink" class="login-form">' +
        '<label class="fld">' +
          '<span class="fld-label">Seu e-mail</span>' +
          '<input type="email" id="emailCliente" name="email" autocomplete="email" ' +
                 'inputmode="email" required placeholder="voce@suaempresa.com.br">' +
        '</label>' +
        '<button type="submit" class="btn-pri btn-entrar" id="btnEntrar">' +
          '<span class="btn-entrar-label">Receber link de acesso</span>' +
          '<span class="btn-ms-spin" aria-hidden="true"></span>' +
        '</button>' +
      '</form>';

    var nota = el('loginNota');
    if (nota) {
      nota.textContent = 'Enviamos um link de uso único para o e-mail cadastrado. ' +
                         'Sem senha para criar, sem senha para esquecer.';
    }

    if (erroInicial) dizer(erroInicial, 'is-erro');

    var form = el('formLink');
    var btn  = el('btnEntrar');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.classList.contains('is-loading')) return;

      var email = (el('emailCliente').value || '').trim();
      if (!email || email.indexOf('@') < 1) {
        dizer('Digite um e-mail válido.', 'is-erro');
        return;
      }

      btn.classList.add('is-loading');
      btn.disabled = true;
      dizer('Enviando o link…');

      Auth.enviarLink(email).then(function () {
        /* Resposta igual para e-mail cadastrado e não cadastrado: dizer
           qual dos dois é entregaria a lista de clientes da Hifera a
           quem só tem um campo de texto. */
        dizer('Se este e-mail estiver cadastrado, o link chega em instantes. ' +
              'Ele vale por pouco tempo e só pode ser usado uma vez.', 'is-ok');
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }).catch(function () {
        btn.classList.remove('is-loading');
        btn.disabled = false;
        dizer('Não foi possível enviar agora. Tente de novo em instantes.', 'is-erro');
      });
    });
  }

  /* Sem Supabase configurado: ainda não há cliente com acesso. O recado é
     esse, literalmente — e ao lado dele um acesso de exemplo, para quem
     chega pelo link conseguir ver do que o portal se trata.

     Por que isso não reabre o buraco que o HIF-C03 fechou: o acesso de
     exemplo entra numa conta de demonstração com dados fictícios, e só
     existe ENQUANTO o Supabase não estiver configurado. No instante em
     que houver cliente de verdade, esta tela deixa de ser montada e o
     botão desaparece junto — não é uma porta que alguém precise lembrar
     de fechar depois.

     Em localhost aparece também o seletor das cinco contas fictícias,
     que é ferramenta de desenvolvimento: dá para conferir cada cliente
     sem mexer em código. */
  function montarSemClientes(erroInicial) {
    var bloco = el('loginModos');
    if (!bloco) return;

    var local = Auth.ambienteLocal();

    var seletor = '';
    if (local) {
      seletor =
        '<label class="fld">' +
          '<span class="fld-label">Conta de exemplo</span>' +
          '<select id="contaCliente" aria-label="Escolha a conta de exemplo">' +
            Auth.contas().map(function (c, i) {
              return '<option value="' + c.cliente + '"' + (i === 0 ? ' selected' : '') + '>' +
                     c.cliente + '</option>';
            }).join('') +
          '</select>' +
        '</label>' +
        '<div class="conta-ficha" id="contaFicha" aria-live="polite"></div>';
    }

    bloco.innerHTML =
      '<div class="login-bloqueio">' +
        '<strong>Nenhum cliente cadastrado</strong>' +
        '<p>Ainda não há cliente com acesso liberado a este portal. Se você ' +
        'contratou a Hifera e precisa entrar, fale com a gente por ' +
        '<a href="mailto:comercial@hifera.com.br">comercial@hifera.com.br</a>.</p>' +
      '</div>' +
      '<form id="formLogin" class="login-form">' +
        seletor +
        '<button type="submit" class="btn-sec btn-entrar" id="btnEntrar">' +
          '<span class="btn-entrar-label">Ver acesso de exemplo</span>' +
          '<span class="btn-ms-spin" aria-hidden="true"></span>' +
        '</button>' +
      '</form>';

    var nota = el('loginNota');
    if (nota) {
      nota.innerHTML = '<span class="mock-dot"></span>O acesso de exemplo abre uma ' +
                       'empresa fictícia, com dados de demonstração.';
    }
    if (erroInicial) dizer(erroInicial, 'is-erro');

    var btn   = el('btnEntrar');
    var sel   = el('contaCliente');
    var ficha = el('contaFicha');

    function pintarFicha() {
      if (!sel || !ficha) return;
      var c = Auth.contaDe(sel.value);
      if (!c) return;
      ficha.innerHTML =
        '<span class="cf-av">' + c.iniciais + '</span>' +
        '<span class="cf-txt"><strong>' + c.nome + '</strong>' +
        '<small>' + c.papel + ' · ' + c.email + '</small></span>';
    }
    if (sel) { sel.addEventListener('change', pintarFicha); pintarFicha(); }

    el('formLogin').addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.classList.contains('is-loading')) return;

      btn.classList.add('is-loading');
      btn.disabled = true;
      dizer('Abrindo a demonstração…');

      Auth.signInExemplo(sel ? sel.value : null).then(function (r) {
        dizer('Entrando como ' + r.user.nome + ', da ' + r.user.cliente + '.', 'is-ok');
        var destino = resgatarDestino();
        setTimeout(function () { window.location.href = destino || HOME; }, 420);
      }).catch(function () {
        btn.classList.remove('is-loading');
        btn.disabled = false;
        dizer('Não foi possível abrir a demonstração.', 'is-erro');
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
    Auth.signOut().then(function () {
      try { sessionStorage.removeItem(CHAVE_DESTINO); } catch (e) {}
      window.location.replace(LOGIN);
    });
  }

  return {
    initLogin: initLogin,
    exigirSessao: exigirSessao,
    signOut: signOut
  };
})();
