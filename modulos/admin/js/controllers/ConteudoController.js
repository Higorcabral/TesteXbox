/* =================================================================
   HIFERA MÓDULOS · Admin · Controller · Conteúdo do site
   -----------------------------------------------------------------
   A ponte entre o painel e a home pública. Mostra o que a vitrine vai
   publicar e gera o js/vitrine-dados.js pronto para commit.

   O ponto que esta tela precisa deixar claro, porque é onde a confusão
   nasce: clicar em "Publicar" NÃO coloca nada no ar. Ele baixa um
   arquivo. O site só muda quando esse arquivo é commitado e a esteira
   roda. Enquanto o painel viver em localStorage, é assim — e é melhor
   dizer isso na tela do que deixar alguém achar que publicou.

   Edição de projeto continua na tela de Gestão de Projetos. Aqui é só
   leitura e publicação: duas telas escrevendo o mesmo registro é como
   se perde alteração sem ninguém entender por quê.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ConteudoController = (function () {
  'use strict';

  var P       = HiferaAdmin.ProjectsModel;
  var Fmt     = HiferaAdmin.Fmt;
  var Publish = HiferaAdmin.PublishModel;

  function el(id) { return document.getElementById(id); }

  function kb(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* --- Aviso do topo -----------------------------------------------
     Três estados, e só um aparece: nada publicável, arquivo pesado
     demais, ou o lembrete de que publicar gera arquivo. */
  function pintarAviso(est) {
    var box = el('avisoPublicar');
    if (!box) return;

    if (!est.projetos) {
      box.hidden = false;
      box.className = 'banner banner--alerta';
      box.innerHTML = '<div class="banner-txt"><strong>Nenhum projeto publicável</strong>' +
        '<span>Um projeto só entra na vitrine com o campo "publicado" marcado e um link preenchido. ' +
        'Isso se ajusta na tela de Gestão de Projetos.</span></div>';
      return;
    }

    if (est.pesado) {
      box.hidden = false;
      box.className = 'banner banner--alerta';
      box.innerHTML = '<div class="banner-txt"><strong>Arquivo grande: ' + Fmt.esc(kb(est.bytes)) + '</strong>' +
        '<span>' + est.imagensEmbutidas + ' imagem(ns) embutida(s) em base64, somando ' +
        Fmt.esc(kb(est.bytesImagens)) + '. Vale trocar por arquivo em /assets/thumbs/ antes de commitar: ' +
        'base64 pesa cerca de um terço a mais e não entra em cache separado do JS.</span></div>';
      return;
    }

    box.hidden = false;
    box.className = 'banner';
    box.innerHTML = '<div class="banner-txt"><strong>Publicar gera um arquivo, não altera o site</strong>' +
      '<span>O botão abaixo baixa o <code>vitrine-dados.js</code>. A home só muda depois que ' +
      'ele for commitado em <code>js/</code> e a esteira publicar.</span></div>';
  }

  /* --- Lista do que vai para a vitrine ----------------------------- */
  function pintarVitrine(lista) {
    var alvo = el('listaVitrine');
    if (!alvo) return;

    if (!lista.length) {
      alvo.innerHTML = '<li class="vazio">Nenhum projeto marcado como publicado e com link.</li>';
      return;
    }

    alvo.innerHTML = lista.map(function (p, i) {
      var capa = (p.imagens || [])[0];
      /* assetAdmin, não fonteImagemSegura: os caminhos são gravados
         relativos à RAIZ do site ('assets/thumbs/crm.webp'), e esta
         página roda em /modulos/admin/. Sem o reapontamento toda
         miniatura de arquivo local dava 404 — só as de URL absoluta
         apareciam. É o mesmo helper que o ProjectsView usa. */
      var src = capa ? Fmt.assetAdmin(capa.src) : '';
      var href = Fmt.urlDoSite(p.link);

      return '<li>' +
        (src ? '<img class="li-thumb" src="' + Fmt.esc(src) + '" alt="" loading="lazy">' : '') +
        '<div class="li-txt">' +
          '<strong>' + (p.destaque ? '<span class="pill pill--indigo">destaque</span> ' : '') +
            Fmt.esc(p.titulo || 'Sem título') + '</strong>' +
          '<small>' + Fmt.esc(String(i + 1).padStart(2, '0')) + ' · ' +
            Fmt.esc(p.categoria || 'sem categoria') +
            (p.segmento ? ' · ' + Fmt.esc(p.segmento) : '') +
            (p.preco ? ' · ' + Fmt.esc(p.preco) : '') + '</small>' +
          '<a href="' + Fmt.esc(Fmt.urlSegura(href)) + '" target="_blank" rel="noopener">' +
            Fmt.esc(p.link) + '</a>' +
        '</div>' +
      '</li>';
    }).join('');
  }

  /* --- Bloco de publicação ----------------------------------------- */
  function linha(rot, valor, nota) {
    return '<div class="kpi-linha">' +
             '<span class="kpi-label">' + Fmt.esc(rot) + '</span>' +
             '<strong>' + Fmt.esc(String(valor)) + '</strong>' +
             (nota ? '<span class="kpi-nota">' + Fmt.esc(nota) + '</span>' : '') +
           '</div>';
  }

  function pintarPublicar(est) {
    var box = el('blocoPublicar');
    if (!box) return;

    var todos = P.getAll();
    var fora = todos.length - est.projetos;

    box.innerHTML =
      linha('Projetos na vitrine', est.projetos,
            fora ? fora + ' fora (sem publicação ou sem link)' : 'todos os da base entram') +
      linha('Card em destaque', est.destaque,
            est.destaque > 1 ? 'mais de um destaque: a home usa o primeiro'
                             : (est.destaque ? 'ocupa o bloco grande do topo' : 'nenhum marcado')) +
      linha('Cards na grade', est.naGrade) +
      linha('Tamanho do arquivo', kb(est.bytes),
            est.imagensEmbutidas ? est.imagensEmbutidas + ' imagem(ns) em base64 (' +
                                   kb(est.bytesImagens) + ')' : 'sem imagem embutida') +
      '<div class="bloco-acoes">' +
        '<button type="button" class="btn" id="btnPublicar"' +
          (est.projetos ? '' : ' disabled') + '>Baixar vitrine-dados.js</button>' +
        '<button type="button" class="btn-sec" id="btnPreverJson">Ver o JSON</button>' +
      '</div>' +
      '<p class="kpi-nota">Depois de baixar: substitua <code>js/vitrine-dados.js</code> ' +
        'no repositório, commite, e a esteira publica.</p>';
  }

  /* --- Ações -------------------------------------------------------- */
  function publicar() {
    var est = Publish.estatisticas();
    if (!est.projetos) {
      HiferaAdmin.Shell.toast('Nada publicável: nenhum projeto com link e marcado como publicado.', 'erro');
      return;
    }
    HiferaAdmin.Shell.baixar('vitrine-dados.js', Publish.gerarArquivo(), 'text/javascript;charset=utf-8');
    HiferaAdmin.Shell.toast('Arquivo baixado. Falta commitar para o site mudar.', 'ok');
  }

  /* Abre o conteúdo numa aba, para conferir antes de commitar sem
     precisar abrir o arquivo baixado num editor. */
  function preverJson() {
    var texto = JSON.stringify(Publish.listaPublicavel(), null, 2);
    var blob = new Blob([texto], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  /* Delegado no container: o bloco é redesenhado a cada pintura e
     listener preso ao botão morreria junto com ele. */
  function ligarEventos() {
    var box = el('blocoPublicar');
    if (box) {
      box.addEventListener('click', function (e) {
        if (e.target.closest('#btnPublicar')) publicar();
        else if (e.target.closest('#btnPreverJson')) preverJson();
      });
    }

    var verSite = el('btnVerSite');
    if (verSite) verSite.setAttribute('href', Fmt.urlDoSite(''));
  }

  function pintar() {
    var est = Publish.estatisticas();
    pintarAviso(est);
    pintarVitrine(Publish.listaPublicavel());
    pintarPublicar(est);
  }

  function init() {
    if (!HiferaAdmin.Shell.iniciar()) return;
    ligarEventos();
    pintar();
  }

  return { init: init, pintar: pintar };
})();
