/* =================================================================
   HIFERA ADMIN · View · Detalhe do chamado (gaveta)
   Histórico em linha do tempo, mudança de status, resposta, marcação
   de solução e avaliação — as mesmas ações do atendimento real.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.TicketDetailView = (function () {
  'use strict';

  var Fmt   = HiferaAdmin.Fmt;
  var M     = HiferaAdmin.TicketsModel;
  var Vista = HiferaAdmin.TicketsView;
  var Img   = HiferaAdmin.ImageModel;

  var raiz = null, atual = null, aoMudar = null, focoAnterior = null;
  var notaEscolhida = 0;

  function quando(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') +
           '/' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0');
  }

  function relativo(iso) {
    var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return 'há ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24) return 'há ' + h + 'h';
    var d = Math.round(h / 24);
    return 'há ' + d + (d === 1 ? ' dia' : ' dias');
  }

  function iniciais(n) {
    return String(n || '?').split(/\s+/).slice(0, 2)
      .map(function (x) { return x.charAt(0).toUpperCase(); }).join('');
  }

  function eventos(t) {
    var linha = [{
      tipo: 'abertura', autor: t.solicitante, papel: 'cliente', quando: t.aberto_em,
      texto: t.descricao, titulo: 'abriu o chamado'
    }];
    t.comentarios.forEach(function (c) {
      linha.push({
        tipo: c.solucao ? 'solucao' : 'comentario',
        autor: c.autor, papel: c.papel, quando: c.quando, texto: c.texto,
        titulo: c.solucao ? 'registrou a solução' : (c.papel === 'cliente' ? 'respondeu' : 'comentou')
      });
    });
    if (t.avaliacao) {
      linha.push({
        tipo: 'avaliacao', autor: t.solicitante, papel: 'cliente',
        quando: t.avaliacao.quando, texto: t.avaliacao.comentario,
        nota: t.avaliacao.nota, titulo: 'avaliou o atendimento'
      });
    }
    return linha.sort(function (a, b) { return new Date(a.quando) - new Date(b.quando); });
  }

  function evento(e) {
    return '<li class="tl-ev tl-ev--' + e.tipo + '">' +
      '<span class="tl-ev-avatar' + (e.papel === 'cliente' ? ' is-cliente' : '') + '">' +
        Fmt.esc(iniciais(e.autor)) + '</span>' +
      '<div class="tl-ev-corpo">' +
        '<div class="tl-ev-topo">' +
          '<strong>' + Fmt.esc(e.autor) + '</strong>' +
          '<span class="tl-ev-acao">' + Fmt.esc(e.titulo) + '</span>' +
          '<time title="' + Fmt.esc(quando(e.quando)) + '">' + Fmt.esc(relativo(e.quando)) + '</time>' +
        '</div>' +
        (e.tipo === 'avaliacao' ? Vista.estrelas(e.nota, 'sm') : '') +
        (e.texto ? '<p class="tl-ev-txt">' + Fmt.esc(e.texto) + '</p>' : '') +
      '</div>' +
    '</li>';
  }

  function anexo(a) {
    return '<li class="anexo">' +
      (a.src ? '<img src="' + Fmt.esc(a.src) + '" alt="">' : '<span class="anexo-ext">' +
        Fmt.esc((a.nome.split('.').pop() || '?').toUpperCase()) + '</span>') +
      '<div><strong>' + Fmt.esc(a.nome) + '</strong><small>' + Img.formatarBytes(a.tamanho) + '</small></div>' +
    '</li>';
  }

  function desenhar() {
    var t = atual;
    var s = M.sla(t);
    var st = M.STATUS[t.status] || {};
    var p = M.PRIORIDADES[t.prioridade];

    raiz.innerHTML =
      '<div class="gaveta-fundo" data-fechar-tk></div>' +
      '<aside class="gaveta gaveta--larga" role="dialog" aria-modal="true" aria-labelledby="tkDetTitulo">' +

        '<header class="gaveta-topo">' +
          '<div>' +
            '<span class="tk-cod">' + Fmt.esc(t.id) + '</span>' +
            '<h2 id="tkDetTitulo">' + Fmt.esc(t.titulo) + '</h2>' +
            '<p>' + Vista.seloTipo(t.tipo) + ' aberto ' + Fmt.esc(relativo(t.aberto_em)) +
            ' por ' + Fmt.esc(t.solicitante) + '</p>' +
          '</div>' +
          '<button type="button" class="icon-btn" data-fechar-tk aria-label="Fechar">' +
            Vista.svg('<path d="M18 6L6 18M6 6l12 12"/>', 1.8) + '</button>' +
        '</header>' +

        '<div class="gaveta-corpo">' +

          '<div class="tk-faixa' + (s.estourado && st.aberto ? ' is-fora' : '') + '">' +
            '<div><span>Status</span>' + Vista.seloStatus(t.status) + '</div>' +
            '<div><span>Prioridade</span>' + Vista.seloPrioridade(t.prioridade) + '</div>' +
            '<div><span>SLA de solução</span><strong>' + Fmt.esc(s.rotulo) + '</strong></div>' +
            '<div><span>Fila</span><strong>' + Fmt.esc(M.FILAS[t.fila] ? M.FILAS[t.fila].label : t.fila) + '</strong></div>' +
          '</div>' +

          '<dl class="tk-ficha">' +
            '<div><dt>Categoria</dt><dd>' + Fmt.esc(t.categoria) + '</dd></div>' +
            '<div><dt>Sistema</dt><dd>' + Fmt.esc(t.sistema) + '</dd></div>' +
            '<div><dt>Módulo</dt><dd>' + Fmt.esc(t.modulo) + '</dd></div>' +
            '<div><dt>Operação</dt><dd>' + Fmt.esc(t.operacao || '—') + '</dd></div>' +
            '<div><dt>Empresa</dt><dd>' + Fmt.esc(t.empresa || '—') + '</dd></div>' +
            '<div><dt>E-mail</dt><dd>' + Fmt.esc(t.email) + '</dd></div>' +
            '<div><dt>Projeto</dt><dd>' + Fmt.esc(t.vinculo || '—') + '</dd></div>' +
            '<div><dt>Aberto em</dt><dd>' + Fmt.esc(quando(t.aberto_em)) + '</dd></div>' +
            '<div><dt>Prazo</dt><dd>' + Fmt.esc(quando(s.limite)) + '</dd></div>' +
            '<div><dt>Resposta prevista</dt><dd>' + p.resposta + 'h após abertura</dd></div>' +
          '</dl>' +

          (t.anexos.length
            ? '<section class="tk-sec"><h3>Anexos</h3><ul class="anexos">' +
              t.anexos.map(anexo).join('') + '</ul></section>'
            : '') +

          '<section class="tk-sec">' +
            '<h3>Histórico</h3>' +
            '<ul class="tl-eventos">' + eventos(t).map(evento).join('') + '</ul>' +
          '</section>' +

          (st.aberto ? blocoResposta() : '') +
          (!st.aberto && !t.avaliacao ? blocoAvaliacao() : '') +
          (t.avaliacao ? blocoAvaliacaoFeita(t) : '') +

        '</div>' +

        '<footer class="gaveta-pe gaveta-pe--acoes">' +
          '<label class="fld fld--inline">' +
            '<span class="fld-label">Mudar status</span>' +
            '<select id="tkStatus">' +
              Object.keys(M.STATUS).map(function (k) {
                return '<option value="' + k + '"' + (k === t.status ? ' selected' : '') + '>' + k + '</option>';
              }).join('') +
            '</select>' +
          '</label>' +
          '<button type="button" class="btn-sec is-danger-txt" id="tkExcluir">Excluir</button>' +
        '</footer>' +
      '</aside>';

    ligar();
  }

  function blocoResposta() {
    return '<section class="tk-sec tk-responder">' +
      '<h3>Responder</h3>' +
      '<textarea id="tkResposta" rows="3" placeholder="Escreva uma atualização ou a solução final…"></textarea>' +
      '<div class="tk-responder-acoes">' +
        '<label class="chk"><input type="checkbox" id="tkEhSolucao"><span class="chk-box"></span>' +
        '<span class="chk-txt">Esta é a solução <em>marca o chamado como resolvido</em></span></label>' +
        '<button type="button" class="btn-pri" id="tkEnviar">Enviar</button>' +
      '</div>' +
    '</section>';
  }

  function blocoAvaliacao() {
    return '<section class="tk-sec tk-avaliar">' +
      '<h3>Como foi o atendimento?</h3>' +
      '<p class="tk-avaliar-nota">A avaliação fica visível para o time e entra na média de satisfação.</p>' +
      '<div class="estrelas-input" id="tkEstrelas" role="radiogroup" aria-label="Nota de 1 a 5">' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" data-nota="' + n + '" role="radio" aria-checked="false" ' +
                 'aria-label="' + n + ' de 5">' + Vista.svg(Vista.IC.estrela, 1.4) + '</button>';
        }).join('') +
      '</div>' +
      '<textarea id="tkAvComentario" rows="2" placeholder="Quer comentar? (opcional)"></textarea>' +
      '<div class="tk-responder-acoes">' +
        '<button type="button" class="btn-sec" id="tkPular">Pular</button>' +
        '<button type="button" class="btn-pri" id="tkAvaliar" disabled>Enviar avaliação</button>' +
      '</div>' +
    '</section>';
  }

  function blocoAvaliacaoFeita(t) {
    return '<section class="tk-sec tk-avaliado">' +
      '<h3>Avaliação</h3>' +
      '<div class="tk-avaliado-linha">' + Vista.estrelas(t.avaliacao.nota) +
        '<strong>' + t.avaliacao.nota + ' de 5</strong>' +
        '<time>' + Fmt.esc(relativo(t.avaliacao.quando)) + '</time>' +
      '</div>' +
      (t.avaliacao.comentario ? '<p class="tl-ev-txt">' + Fmt.esc(t.avaliacao.comentario) + '</p>' : '') +
    '</section>';
  }

  function ligar() {
    raiz.querySelectorAll('[data-fechar-tk]').forEach(function (b) {
      b.addEventListener('click', fechar);
    });

    var sel = document.getElementById('tkStatus');
    if (sel) {
      sel.addEventListener('change', function () {
        M.mudarStatus(atual.id, sel.value);
        atual = M.getById(atual.id);
        if (aoMudar) aoMudar('status', atual, sel.value);
        desenhar();
      });
    }

    var enviar = document.getElementById('tkEnviar');
    if (enviar) {
      enviar.addEventListener('click', function () {
        var txt = document.getElementById('tkResposta').value;
        var sol = document.getElementById('tkEhSolucao').checked;
        if (!txt.trim()) { document.getElementById('tkResposta').focus(); return; }
        M.comentar(atual.id, txt, null, sol);
        atual = M.getById(atual.id);
        if (aoMudar) aoMudar(sol ? 'solucao' : 'comentario', atual);
        desenhar();
      });
    }

    var estrelas = document.getElementById('tkEstrelas');
    if (estrelas) {
      notaEscolhida = 0;
      estrelas.querySelectorAll('[data-nota]').forEach(function (b) {
        b.addEventListener('click', function () {
          notaEscolhida = parseInt(b.dataset.nota, 10);
          estrelas.querySelectorAll('[data-nota]').forEach(function (o) {
            var on = parseInt(o.dataset.nota, 10) <= notaEscolhida;
            o.classList.toggle('is-on', on);
            o.setAttribute('aria-checked', String(parseInt(o.dataset.nota, 10) === notaEscolhida));
          });
          document.getElementById('tkAvaliar').disabled = false;
        });
      });

      document.getElementById('tkAvaliar').addEventListener('click', function () {
        if (!notaEscolhida) return;
        M.avaliar(atual.id, notaEscolhida, document.getElementById('tkAvComentario').value);
        atual = M.getById(atual.id);
        if (aoMudar) aoMudar('avaliacao', atual, notaEscolhida);
        desenhar();
      });

      document.getElementById('tkPular').addEventListener('click', function () {
        document.querySelector('.tk-avaliar').remove();
      });
    }

    var excluir = document.getElementById('tkExcluir');
    if (excluir) {
      excluir.addEventListener('click', function () {
        if (!window.confirm('Excluir o chamado ' + atual.id + '?\n\nO histórico e a avaliação vão junto.')) return;
        var id = atual.id;
        M.remover(id);
        if (aoMudar) aoMudar('excluir', { id: id });
        fechar();
      });
    }
  }

  function aoTeclar(e) { if (e.key === 'Escape') fechar(); }

  function abrir(id, callback) {
    raiz = document.getElementById('tkRoot');
    atual = M.getById(id);
    if (!raiz || !atual) return;
    aoMudar = callback;
    focoAnterior = document.activeElement;
    desenhar();
    raiz.classList.add('is-open');
    document.body.classList.add('sem-scroll');
    document.addEventListener('keydown', aoTeclar);
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
