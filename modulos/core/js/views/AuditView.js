/* =================================================================
   HIFERA ADMIN · View · Log de alterações (gaveta lateral)
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.AuditView = (function () {
  'use strict';

  var Fmt   = HiferaAdmin.Fmt;
  var Audit = HiferaAdmin.AuditModel;

  var raiz = null;
  var filtro = { acao: 'todas', termo: '' };
  var focoAnterior = null;

  /* "há 3 dias" fica mais legível que a data crua num log */
  function quandoRelativo(iso) {
    var t = new Date(iso).getTime();
    if (!isFinite(t)) return iso;
    var min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return 'há ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24) return 'há ' + h + 'h';
    var d = Math.round(h / 24);
    if (d < 30) return 'há ' + d + (d === 1 ? ' dia' : ' dias');
    var mes = Math.round(d / 30);
    return 'há ' + mes + (mes === 1 ? ' mês' : ' meses');
  }

  function dataCompleta(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() +
           ' às ' + String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0');
  }

  function iniciais(nome) {
    return String(nome || '?').split(/\s+/).slice(0, 2)
      .map(function (n) { return n.charAt(0).toUpperCase(); }).join('');
  }

  function entrada(e) {
    var a = Audit.ACOES[e.acao] || { label: e.acao, cor: 'cyan' };
    return '<li class="log-item">' +
      '<span class="log-avatar" aria-hidden="true">' + Fmt.esc(iniciais(e.autor)) + '</span>' +
      '<div class="log-corpo">' +
        '<div class="log-topo">' +
          '<span class="log-acao log-acao--' + a.cor + '">' + Fmt.esc(a.label) + '</span>' +
          '<strong>' + Fmt.esc(e.alvo) + '</strong>' +
        '</div>' +
        (e.resumo ? '<p class="log-resumo">' + Fmt.esc(e.resumo) + '</p>' : '') +
        '<div class="log-pe">' +
          Fmt.esc(e.autor) + ' · <time title="' + Fmt.esc(dataCompleta(e.quando)) + '">' +
          Fmt.esc(quandoRelativo(e.quando)) + '</time>' +
        '</div>' +
      '</div>' +
    '</li>';
  }

  function desenhar() {
    var lista = Audit.listar(filtro);
    var opcoes = ['todas'].concat(Object.keys(Audit.ACOES));

    raiz.innerHTML =
      '<div class="gaveta-fundo" data-fechar-log></div>' +
      '<aside class="gaveta" role="dialog" aria-modal="true" aria-labelledby="logTitulo">' +
        '<header class="gaveta-topo">' +
          '<div>' +
            '<h2 id="logTitulo">Log de alterações</h2>' +
            '<p>' + lista.length + (lista.length === 1 ? ' registro' : ' registros') + '</p>' +
          '</div>' +
          '<button type="button" class="icon-btn" data-fechar-log aria-label="Fechar log">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</header>' +
        '<div class="gaveta-filtros">' +
          '<label class="busca">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
            '<input type="search" id="logBusca" placeholder="Buscar no histórico…" value="' + Fmt.esc(filtro.termo) + '" aria-label="Buscar no log">' +
          '</label>' +
          '<select id="logAcao" aria-label="Filtrar por ação">' +
            opcoes.map(function (k) {
              var rot = k === 'todas' ? 'Todas as ações' : Audit.ACOES[k].label;
              return '<option value="' + k + '"' + (k === filtro.acao ? ' selected' : '') + '>' + rot + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        (lista.length
          ? '<ul class="log-lista">' + lista.map(entrada).join('') + '</ul>'
          : '<div class="vazio-box"><strong>Nada por aqui</strong><p>Nenhum registro bate com esse filtro.</p></div>') +
        '<footer class="gaveta-pe">' +
          '<span>Histórico local deste navegador · máx. 300 registros</span>' +
          '<button type="button" class="link-reset" id="logLimpar">Limpar histórico</button>' +
        '</footer>' +
      '</aside>';

    ligar();
  }

  function ligar() {
    raiz.querySelectorAll('[data-fechar-log]').forEach(function (b) {
      b.addEventListener('click', fechar);
    });

    var busca = document.getElementById('logBusca');
    if (busca) {
      busca.addEventListener('input', function () {
        filtro.termo = busca.value;
        var pos = busca.selectionStart;
        desenhar();
        var novo = document.getElementById('logBusca');
        if (novo) { novo.focus(); novo.setSelectionRange(pos, pos); }
      });
    }

    var acao = document.getElementById('logAcao');
    if (acao) {
      acao.addEventListener('change', function () { filtro.acao = acao.value; desenhar(); });
    }

    var limpar = document.getElementById('logLimpar');
    if (limpar) {
      limpar.addEventListener('click', function () {
        if (!window.confirm('Apagar todo o histórico de alterações?')) return;
        Audit.limpar();
        desenhar();
      });
    }
  }

  function aoTeclar(e) {
    if (e.key === 'Escape') fechar();
  }

  function abrir() {
    raiz = document.getElementById('logRoot');
    if (!raiz) return;
    focoAnterior = document.activeElement;
    filtro = { acao: 'todas', termo: '' };
    desenhar();
    raiz.classList.add('is-open');
    document.body.classList.add('sem-scroll');
    document.addEventListener('keydown', aoTeclar);
    var b = document.getElementById('logBusca');
    if (b) b.focus();
  }

  function fechar() {
    if (!raiz) return;
    raiz.classList.remove('is-open');
    document.body.classList.remove('sem-scroll');
    document.removeEventListener('keydown', aoTeclar);
    setTimeout(function () { if (raiz) raiz.innerHTML = ''; }, 240);
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  return { abrir: abrir, fechar: fechar };
})();
