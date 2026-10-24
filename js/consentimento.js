/* =================================================================
   HIFERA · Site oficial · Consentimento (LGPD)
   -----------------------------------------------------------------
   O tracking de comportamento (js/tracking.js) é dado pessoal e só
   pode rodar com base legal. Aqui essa base é o consentimento: nada é
   medido antes de a pessoa dizer "pode".

   A regra que o arquivo segue: enquanto a escolha não existir, o
   tracking fica parado. "Aceitar" libera; "Só essenciais" bloqueia —
   e os dois gravam a decisão para não perguntar de novo a cada página.

   O que NUNCA depende disto: o formulário de contato. Ali a pessoa
   entrega os dados de propósito, para ser respondida — caminho
   diferente de medir navegação sem ela pedir.

   Respeita Do Not Track do navegador: com DNT ligado, o banner nem
   aparece e o tracking fica desligado por padrão.

   Expõe window.HiferaConsent:
     permitido()   → true só quando a pessoa aceitou análises
     definido()    → já houve escolha (ou DNT decidiu por ela)
     aoLiberar(fn) → chama fn assim que/se o consentimento for dado
   ================================================================= */
window.HiferaConsent = (function () {
  'use strict';

  var CHAVE = 'hifera.site.consentimento.v1';
  var ouvintes = [];

  function dnt() {
    var v = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return v === '1' || v === 'yes';
  }

  function ler() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }
  function gravar(v) {
    try { localStorage.setItem(CHAVE, v); } catch (e) { /* modo privado */ }
  }

  function permitido() { return ler() === 'aceito'; }
  function definido()  { return dnt() || ler() !== null; }

  function aoLiberar(fn) {
    if (typeof fn !== 'function') return;
    if (permitido()) { fn(); return; }
    ouvintes.push(fn);
  }

  function liberar() {
    var fila = ouvintes.slice();
    ouvintes.length = 0;
    fila.forEach(function (fn) { try { fn(); } catch (e) { /* um ouvinte não derruba os outros */ } });
  }

  /* --- Banner ------------------------------------------------------ */
  function estilo() {
    if (document.getElementById('hifera-consent-css')) return;
    var s = document.createElement('style');
    s.id = 'hifera-consent-css';
    s.textContent =
      '.consent-bar{position:fixed;left:16px;right:16px;bottom:16px;z-index:9000;' +
      'max-width:720px;margin:0 auto;display:flex;flex-wrap:wrap;gap:14px 20px;' +
      'align-items:center;justify-content:space-between;padding:16px 18px;' +
      'border-radius:16px;background:rgba(18,18,20,.92);color:#f2f2f3;' +
      'border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(10px);' +
      'box-shadow:0 18px 50px rgba(0,0,0,.45);' +
      'font:400 .9rem/1.45 "Poppins",system-ui,sans-serif;' +
      'opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s}' +
      '.consent-bar.is-on{opacity:1;transform:none}' +
      '.consent-bar p{margin:0;flex:1 1 300px;color:#cfcfd4}' +
      '.consent-bar a{color:#5de0e6;text-decoration:underline;text-underline-offset:2px}' +
      '.consent-bar .consent-acoes{display:flex;gap:10px;flex:0 0 auto}' +
      '.consent-bar button{cursor:pointer;border-radius:999px;padding:9px 18px;' +
      'font:inherit;font-weight:600;border:1px solid transparent;transition:filter .2s,background .2s}' +
      '.consent-bar .c-aceitar{background:linear-gradient(90deg,#5de0e6,#004aad);color:#fff}' +
      '.consent-bar .c-aceitar:hover{filter:brightness(1.08)}' +
      '.consent-bar .c-recusar{background:transparent;color:#cfcfd4;border-color:rgba(255,255,255,.22)}' +
      '.consent-bar .c-recusar:hover{background:rgba(255,255,255,.06)}' +
      '@media (prefers-reduced-motion:reduce){.consent-bar{transition:none}}';
    document.head.appendChild(s);
  }

  function banner() {
    if (document.querySelector('.consent-bar')) return;
    estilo();

    var bar = document.createElement('div');
    bar.className = 'consent-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Aviso de privacidade');
    bar.setAttribute('aria-live', 'polite');

    var texto = document.createElement('p');
    texto.innerHTML =
      'Usamos medições anônimas para entender o que ajuda quem visita o site. ' +
      'Nada disso identifica você. Saiba mais em ' +
      '<a href="seguranca.html">privacidade</a>.';

    var acoes = document.createElement('div');
    acoes.className = 'consent-acoes';

    var recusar = document.createElement('button');
    recusar.type = 'button';
    recusar.className = 'c-recusar';
    recusar.textContent = 'Só essenciais';

    var aceitar = document.createElement('button');
    aceitar.type = 'button';
    aceitar.className = 'c-aceitar';
    aceitar.textContent = 'Aceitar';

    function fechar() {
      bar.classList.remove('is-on');
      setTimeout(function () { bar.remove(); }, 320);
    }

    aceitar.addEventListener('click', function () { gravar('aceito'); fechar(); liberar(); });
    recusar.addEventListener('click', function () { gravar('recusado'); fechar(); });

    acoes.appendChild(recusar);
    acoes.appendChild(aceitar);
    bar.appendChild(texto);
    bar.appendChild(acoes);
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('is-on'); });
  }

  function iniciar() {
    if (dnt()) return;          /* DNT: respeitamos sem nem perguntar */
    if (ler() !== null) return; /* já escolheu antes */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', banner);
    } else {
      banner();
    }
  }

  iniciar();

  return {
    permitido: permitido,
    definido: definido,
    aoLiberar: aoLiberar
  };
})();
