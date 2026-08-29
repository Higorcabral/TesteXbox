/* =================================================================
   HIFERA · Faixa de demonstração
   -----------------------------------------------------------------
   Injeta em qualquer demo de projetos/ ou apps/ uma barra fixa no
   rodapé com a marca da Hifera, mais um pop-up na primeira visita
   deixando claro que aquilo é uma demonstração com dados fictícios.

   Como usar, no fim do <body> da demo:

     <script src="../../js/demo.js"
             data-raiz="../../"
             data-projeto="Projeto-CRM"
             data-tela="Painel comercial"></script>

   · data-raiz    caminho até a raiz do site (obrigatório para logo e links)
   · data-projeto nome do projeto como aparece na vitrine
   · data-tela    tela específica, quando a demo tem mais de uma (opcional)

   Nada aqui depende do CSS da demo: todo o estilo entra num <style>
   próprio, com prefixo hfd- e z-index acima de qualquer coisa.
   Se o arquivo não carregar, a demo continua funcionando igual.
   ================================================================= */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var RAIZ    = script.getAttribute('data-raiz') || '../../';
  var PROJETO = script.getAttribute('data-projeto') || 'Demonstração';
  var TELA    = script.getAttribute('data-tela') || '';
  var CHAVE   = 'hifera.demo.visto.' + PROJETO;
  var CHAVE_BARRA = 'hifera.demo.barra';

  var CONTATO = 'mailto:comercial@hifera.com?subject=' +
                encodeURIComponent('Quero algo assim: ' + PROJETO);

  function esc(txt) {
    return String(txt == null ? '' : txt)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* sessionStorage pode estourar em modo privado — nunca derruba a demo */
  function lembrar(chave, valor) {
    try { sessionStorage.setItem(chave, valor); } catch (e) { /* segue */ }
  }
  function lembrado(chave) {
    try { return sessionStorage.getItem(chave); } catch (e) { return null; }
  }

  /* --- Estilo ------------------------------------------------------
     Escuro fixo de propósito: a barra é da Hifera, não da demo, e
     precisa se ler igual sobre fundo claro ou escuro.               */
  var CSS = [
    /* Os resets vão dentro de :where() de propósito. Com o seletor
       normal, `.hfd-raiz button` (0,1,1) venceria `.hfd-btn` (0,1,0)
       e os botões da faixa perderiam fundo, borda e tamanho de fonte
       para o reset. Dentro de :where() a especificidade é zero, então
       qualquer regra de componente abaixo passa na frente. */
    ':where(.hfd-raiz,.hfd-raiz *){box-sizing:border-box}',
    '.hfd-raiz{font-family:"Poppins",system-ui,-apple-system,"Segoe UI",sans-serif;',
      'font-size:14px;line-height:1.5;color:#f2f2f4;-webkit-font-smoothing:antialiased}',
    ':where(.hfd-raiz button){font:inherit;color:inherit;background:none;border:none;cursor:pointer;margin:0;padding:0}',
    ':where(.hfd-raiz a){color:inherit;text-decoration:none}',
    ':where(.hfd-raiz img){display:block;max-width:100%}',
    '.hfd-raiz :focus-visible{outline:2px solid #5de0e6;outline-offset:2px;border-radius:6px}',

    /* Barra */
    '.hfd-barra{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;',
      'display:flex;align-items:center;gap:14px;padding:9px 16px;',
      'background:rgba(10,10,11,.9);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);',
      'border-top:1px solid rgba(255,255,255,.12);',
      'box-shadow:0 -8px 30px rgba(0,0,0,.35);',
      'transform:translateY(0);transition:transform .42s cubic-bezier(.2,.8,.2,1)}',
    '.hfd-barra[hidden]{display:none}',
    '.hfd-marca{display:flex;align-items:center;gap:9px;flex:0 0 auto}',
    '.hfd-marca img{width:36px;height:36px;margin:-6px 0;object-fit:contain;display:block}',
    '.hfd-marca b{font-weight:700;letter-spacing:.02em;font-size:13px;white-space:nowrap}',
    '.hfd-marca b i{font-style:normal;background:linear-gradient(135deg,#5de0e6 0%,#4d9fe8 100%);',
      '-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}',

    '.hfd-sep{width:1px;height:22px;background:rgba(255,255,255,.14);flex:0 0 auto}',

    '.hfd-selo{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;',
      'padding:4px 11px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.02em;',
      'background:rgba(93,224,230,.14);border:1px solid rgba(93,224,230,.34);color:#5de0e6}',
    '.hfd-pisca{width:6px;height:6px;border-radius:50%;background:#5de0e6;',
      'animation:hfd-pulso 2.4s ease-in-out infinite}',
    '@keyframes hfd-pulso{0%,100%{opacity:1}50%{opacity:.25}}',
    '@media (prefers-reduced-motion:reduce){.hfd-pisca{animation:none}}',

    '.hfd-txt{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;line-height:1.3}',
    '.hfd-txt strong{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.hfd-txt small{font-size:11.5px;color:#a1a1aa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',

    '.hfd-acoes{display:flex;align-items:center;gap:8px;flex:0 0 auto}',
    '.hfd-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;',
      'font-size:12.5px;font-weight:600;white-space:nowrap;',
      'border:1px solid rgba(255,255,255,.18);color:#f2f2f4;',
      'transition:background .2s,border-color .2s,transform .2s}',
    '.hfd-btn:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.3)}',
    '.hfd-btn--pri{background:linear-gradient(135deg,#5de0e6 0%,#004aad 100%);border-color:transparent;color:#04121f}',
    '.hfd-btn--pri:hover{background:linear-gradient(135deg,#5de0e6 0%,#004aad 100%);transform:translateY(-1px)}',
    '.hfd-btn svg{width:14px;height:14px;flex:0 0 auto}',
    '.hfd-fechar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;',
      'border:1px solid rgba(255,255,255,.16);color:#a1a1aa;transition:color .2s,background .2s}',
    '.hfd-fechar:hover{color:#f2f2f4;background:rgba(255,255,255,.09)}',
    '.hfd-fechar svg{width:14px;height:14px}',

    /* Pílula, quando a barra é recolhida */
    '.hfd-pilula{position:fixed;left:16px;bottom:16px;z-index:2147483000;',
      'display:flex;align-items:center;gap:8px;padding:8px 14px 8px 9px;border-radius:999px;',
      'background:rgba(10,10,11,.9);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);',
      'border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 28px rgba(0,0,0,.4);',
      'font-size:12.5px;font-weight:600;transition:transform .2s,border-color .2s}',
    '.hfd-pilula:hover{transform:translateY(-2px);border-color:rgba(93,224,230,.45)}',
    '.hfd-pilula[hidden]{display:none}',
    '.hfd-pilula img{width:30px;height:30px;margin:-5px;object-fit:contain}',

    /* Pop-up */
    '.hfd-modal{position:fixed;inset:0;z-index:2147483100;display:grid;place-items:center;padding:20px;',
      'background:rgba(5,5,6,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
      'opacity:0;transition:opacity .28s ease}',
    '.hfd-modal.is-on{opacity:1}',
    '.hfd-modal[hidden]{display:none}',
    '.hfd-caixa{width:min(520px,100%);max-height:calc(100vh - 40px);overflow:auto;',
      'background:#101012;border:1px solid rgba(255,255,255,.12);border-radius:20px;',
      'box-shadow:0 30px 80px rgba(0,0,0,.6);padding:30px;',
      'transform:translateY(14px) scale(.98);transition:transform .34s cubic-bezier(.2,.8,.2,1)}',
    '.hfd-modal.is-on .hfd-caixa{transform:none}',
    '.hfd-caixa{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.22) transparent}',
    '.hfd-caixa::-webkit-scrollbar{width:8px;height:8px}',
    '.hfd-caixa::-webkit-scrollbar-track,.hfd-caixa::-webkit-scrollbar-corner{background:transparent}',
    '.hfd-caixa::-webkit-scrollbar-thumb{background:rgba(255,255,255,.22);border-radius:99px}',
    '.hfd-caixa-topo{display:flex;align-items:center;gap:12px;margin-bottom:20px}',
    '.hfd-caixa-topo img{width:54px;height:54px;margin:-8px;object-fit:contain}',
    '.hfd-caixa-topo span{display:flex;flex-direction:column;line-height:1.25}',
    '.hfd-caixa-topo b{font-size:15px;font-weight:700;letter-spacing:.02em}',
    '.hfd-caixa-topo small{font-size:12px;color:#a1a1aa}',
    '.hfd-caixa h2{margin:0 0 10px;font-size:23px;line-height:1.2;font-weight:700;letter-spacing:-.02em}',
    '.hfd-caixa h2 i{font-style:normal;background:linear-gradient(135deg,#5de0e6 0%,#4d9fe8 100%);',
      '-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}',
    '.hfd-caixa p{margin:0 0 14px;font-size:14px;color:#a1a1aa}',
    '.hfd-lista{margin:0 0 22px;padding:0;list-style:none;display:grid;gap:9px}',
    '.hfd-lista li{display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:#d4d4d8}',
    '.hfd-lista svg{width:15px;height:15px;flex:0 0 auto;margin-top:2px;color:#5de0e6}',
    '.hfd-caixa-acoes{display:flex;flex-wrap:wrap;gap:10px}',
    '.hfd-caixa-acoes .hfd-btn{padding:11px 20px;font-size:13.5px}',

    /* Telas estreitas: a barra vira duas linhas e alguns textos somem */
    '@media (max-width:860px){',
      '.hfd-barra{gap:10px;padding:8px 12px}',
      '.hfd-sep,.hfd-txt small{display:none}',
      '.hfd-rotulo{display:none}',
      '.hfd-caixa{padding:24px}',
      '.hfd-caixa h2{font-size:20px}',
    '}',
    '@media (max-width:520px){',
      '.hfd-selo span:last-child{display:none}',
      '.hfd-selo{padding:5px 8px}',
      '.hfd-marca b{display:none}',
    '}',
    '@media print{.hfd-raiz{display:none}}'
  ].join('');

  var ICONE = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    seta:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    grade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    mail:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    x:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
  };

  var LOGO = RAIZ + 'assets/logo/HiferaIcon.png';
  var raiz, barra, pilula, modal;

  function montar() {
    var estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    raiz = document.createElement('div');
    raiz.className = 'hfd-raiz';

    var contexto = TELA ? PROJETO + ' · ' + TELA : PROJETO;

    raiz.innerHTML =
      /* ---- Barra ---- */
      '<div class="hfd-barra" role="region" aria-label="Aviso de demonstração da Hifera">' +
        '<a class="hfd-marca" href="' + esc(RAIZ) + '" title="Ir para o site da Hifera">' +
          '<img src="' + esc(LOGO) + '" alt="Hifera Company">' +
          '<b>HIFERA <i>COMPANY</i></b>' +
        '</a>' +
        '<span class="hfd-sep" aria-hidden="true"></span>' +
        '<span class="hfd-selo"><span class="hfd-pisca" aria-hidden="true"></span>' +
          '<span>Demonstração</span></span>' +
        '<span class="hfd-txt">' +
          '<strong>' + esc(contexto) + '</strong>' +
          '<small>Ambiente de demonstração — todos os dados são fictícios.</small>' +
        '</span>' +
        '<span class="hfd-acoes">' +
          '<button type="button" class="hfd-btn" data-hfd="sobre">Sobre esta demo</button>' +
          '<a class="hfd-btn" href="' + esc(RAIZ) + '#produtos">' + ICONE.grade +
            '<span class="hfd-rotulo">Outros projetos</span></a>' +
          '<a class="hfd-btn hfd-btn--pri" href="' + esc(CONTATO) + '">' +
            '<span>Quero um assim</span>' + ICONE.seta + '</a>' +
          '<button type="button" class="hfd-fechar" data-hfd="recolher" ' +
            'aria-label="Recolher a faixa de demonstração">' + ICONE.x + '</button>' +
        '</span>' +
      '</div>' +

      /* ---- Pílula (barra recolhida) ---- */
      '<button type="button" class="hfd-pilula" data-hfd="expandir" hidden ' +
        'aria-label="Mostrar a faixa de demonstração da Hifera">' +
        '<img src="' + esc(LOGO) + '" alt="">' +
        '<span>Demonstração Hifera</span>' +
      '</button>' +

      /* ---- Pop-up ---- */
      '<div class="hfd-modal" role="dialog" aria-modal="true" aria-labelledby="hfdTitulo" hidden>' +
        '<div class="hfd-caixa">' +
          '<div class="hfd-caixa-topo">' +
            '<img src="' + esc(LOGO) + '" alt="">' +
            '<span><b>HIFERA COMPANY</b><small>Hub de soluções digitais</small></span>' +
          '</div>' +
          '<h2 id="hfdTitulo">Você está numa <i>demonstração.</i></h2>' +
          '<p><strong>' + esc(contexto) + '</strong> é um projeto real da Hifera, ' +
            'aberto aqui em modo de demonstração para você navegar à vontade.</p>' +
          '<ul class="hfd-lista">' +
            '<li>' + ICONE.check + '<span>Empresa, clientes e números são <strong>fictícios</strong> — nada aqui é dado de cliente real.</span></li>' +
            '<li>' + ICONE.check + '<span>Pode clicar em tudo: nada é enviado, cobrado ou salvo em servidor.</span></li>' +
            '<li>' + ICONE.check + '<span>Na versão sua, o conteúdo, a identidade e as regras são os do seu negócio.</span></li>' +
          '</ul>' +
          '<div class="hfd-caixa-acoes">' +
            '<button type="button" class="hfd-btn hfd-btn--pri" data-hfd="fechar">' +
              '<span>Explorar a demo</span>' + ICONE.seta + '</button>' +
            '<a class="hfd-btn" href="' + esc(CONTATO) + '">' + ICONE.mail + '<span>Falar com a Hifera</span></a>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(raiz);

    barra  = raiz.querySelector('.hfd-barra');
    pilula = raiz.querySelector('.hfd-pilula');
    modal  = raiz.querySelector('.hfd-modal');

    raiz.querySelectorAll('[data-hfd]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var acao = el.getAttribute('data-hfd');
        if (acao === 'sobre')    { e.preventDefault(); abrirModal(); }
        if (acao === 'fechar')   { fecharModal(); }
        if (acao === 'recolher') { recolher(true); }
        if (acao === 'expandir') { recolher(false); }
      });
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) fecharModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) fecharModal();
    });

    if (lembrado(CHAVE_BARRA) === 'recolhida') recolher(true);
    ajustarEspaco();
  }

  /* A barra é fixa: sem esta folga o último bloco da página fica embaixo
     dela. Em layout preso a 100vh (app shell) o padding não muda nada,
     e aí o jeito é recolher — por isso o botão existe. */
  function ajustarEspaco() {
    var alto = barra && !barra.hidden ? barra.offsetHeight : 0;
    document.body.style.paddingBottom = alto ? alto + 'px' : '';
  }

  function recolher(sim) {
    barra.hidden = !!sim;
    pilula.hidden = !sim;
    lembrar(CHAVE_BARRA, sim ? 'recolhida' : 'aberta');
    ajustarEspaco();
    (sim ? pilula : barra.querySelector('[data-hfd="recolher"]')).focus();
  }

  var focoAnterior = null;

  function abrirModal() {
    focoAnterior = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add('is-on'); });
    var botao = modal.querySelector('[data-hfd="fechar"]');
    if (botao) botao.focus();
  }

  function fecharModal() {
    modal.classList.remove('is-on');
    lembrar(CHAVE, '1');
    setTimeout(function () {
      modal.hidden = true;
      if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
    }, 260);
  }

  function iniciar() {
    montar();
    /* Uma vez por sessão e por projeto: quem já viu não leva o pop-up
       de novo ao navegar entre as telas da mesma demo. */
    if (!lembrado(CHAVE)) setTimeout(abrirModal, 700);
    window.addEventListener('resize', ajustarEspaco, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
