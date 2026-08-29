/* =================================================================
   HIFERA PORTAL · View · Chamados
   -----------------------------------------------------------------
   Três estados na mesma tela: lista, detalhe e abertura. O roteador
   do PortalController decide qual, pelo hash.

   O formulário é a mesma cascata do service desk interno — é ela que
   escolhe a fila, e é por isso que o cliente nunca precisa saber para
   quem mandar. O que sumiu em relação ao formulário interno: empresa,
   solicitante e e-mail, que vêm da sessão. Ninguém digita quem é.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.ChamadosView = (function () {
  'use strict';

  var Fmt     = HiferaAdmin.Fmt;
  var Tickets = HiferaAdmin.TicketsModel;
  var UI      = HiferaPortal.UI;

  var handlers = {};
  function definirHandlers(h) { handlers = h || {}; }

  /* Rascunho do formulário. Vive enquanto a tela está aberta. */
  var rascunho = null;

  function vazio() {
    return {
      tipo: 'chamado', categoria: '', sistema: '', modulo: '',
      titulo: '', descricao: '', prioridade: 'Média'
    };
  }

  /* ================================================================
     LISTA
     ================================================================ */
  function cartaoChamado(t) {
    var s = Tickets.STATUS[t.status] || Tickets.STATUS.Aberto;
    var sla = Tickets.sla(t);
    var tipo = Tickets.TIPOS[t.tipo] || Tickets.TIPOS.chamado;

    return '<li class="ch-item">' +
        '<a href="#chamados/' + Fmt.esc(t.id) + '">' +
          '<div class="ch-cab">' +
            UI.pillStatusChamado(t.status) +
            '<span class="ch-tipo ch-tipo--' + tipo.cor + '">' + tipo.label + '</span>' +
            '<span class="ch-id">' + Fmt.esc(t.id) + '</span>' +
          '</div>' +
          '<strong class="ch-titulo">' + Fmt.esc(t.titulo) + '</strong>' +
          '<div class="ch-pe">' +
            '<span>' + Fmt.esc(t.categoria) +
              (t.sistema ? ' · ' + Fmt.esc(t.sistema) : '') + '</span>' +
            '<span>aberto ' + UI.desde(t.aberto_em) + '</span>' +
            /* sla.rotulo já vem pronto do model: "Vence em 6h",
               "SLA estourado há 2 dias", "SLA pausado…". */
            (s.aberto && sla
              ? '<span class="' + (sla.estourado ? 'is-neg' : '') + '">' +
                Fmt.esc(sla.rotulo) + '</span>'
              : '') +
            (t.comentarios.length
              ? '<span>' + t.comentarios.length +
                (t.comentarios.length === 1 ? ' resposta' : ' respostas') + '</span>'
              : '') +
          '</div>' +
        '</a>' +
      '</li>';
  }

  function renderLista(el, ctx) {
    var lista = Tickets.porEmpresa(ctx.cliente);
    var abertos = lista.filter(function (t) {
      return Tickets.STATUS[t.status] && Tickets.STATUS[t.status].aberto;
    });

    el.innerHTML =
      '<div class="sec-head sec-head--acoes">' +
        '<div>' +
          '<h2>Chamados</h2>' +
          '<p>Suporte, dúvida ou pedido de algo novo. Cada chamado tem prazo de resposta e de solução.</p>' +
        '</div>' +
        '<a class="btn-pri" href="#chamados/novo">' + UI.svg(UI.ICONE.mais, 2) + 'Abrir chamado</a>' +
      '</div>' +

      (lista.length
        ? '<div class="card">' +
            '<div class="card-head">' +
              '<div class="card-resumo">' +
                '<span>Abertos <strong>' + abertos.length + '</strong></span>' +
                '<span>Total <strong>' + lista.length + '</strong></span>' +
              '</div>' +
            '</div>' +
            '<ul class="ch-lista">' + lista.map(cartaoChamado).join('') + '</ul>' +
          '</div>'
        : '<div class="vazio-box vazio-box--tela">' +
            '<strong>Você ainda não abriu nenhum chamado</strong>' +
            '<p>Se algo parou de funcionar ou você quer pedir uma melhoria, abra por aqui. ' +
              'A gente responde em até 24h úteis — antes disso, conforme a prioridade.</p>' +
            '<a class="btn-pri" href="#chamados/novo">Abrir o primeiro</a>' +
          '</div>');
  }

  /* ================================================================
     DETALHE
     ================================================================ */
  function renderDetalhe(el, ctx, id) {
    var t = Tickets.getById(id);

    /* Confere o dono antes de desenhar: id de outra empresa não abre. */
    if (!t || String(t.empresa).toLowerCase() !== String(ctx.cliente).toLowerCase()) {
      el.innerHTML =
        '<div class="vazio-box vazio-box--tela">' +
          '<strong>Chamado não encontrado</strong>' +
          '<p>Este chamado não existe ou não pertence à ' + Fmt.esc(ctx.cliente) + '.</p>' +
          '<a class="btn-pri" href="#chamados">Voltar para a lista</a>' +
        '</div>';
      return;
    }

    var s = Tickets.STATUS[t.status];
    var sla = Tickets.sla(t);
    var tipo = Tickets.TIPOS[t.tipo] || Tickets.TIPOS.chamado;

    el.innerHTML =
      '<a class="voltar-link" href="#chamados">' + UI.svg(UI.ICONE.voltar) + 'Todos os chamados</a>' +

      '<div class="card">' +
        '<div class="ch-det-topo">' +
          '<div>' +
            '<div class="ch-cab">' +
              UI.pillStatusChamado(t.status) +
              '<span class="ch-tipo ch-tipo--' + tipo.cor + '">' + tipo.label + '</span>' +
              '<span class="ch-id">' + Fmt.esc(t.id) + '</span>' +
            '</div>' +
            '<h2>' + Fmt.esc(t.titulo) + '</h2>' +
            '<p class="fc-sub">' + Fmt.esc(t.categoria) +
              (t.sistema ? ' · ' + Fmt.esc(t.sistema) : '') +
              (t.modulo ? ' · ' + Fmt.esc(t.modulo) : '') + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="ficha-meta ficha-meta--3">' +
          '<div class="meta-item"><span class="meta-rot">Aberto em</span>' +
            '<strong class="meta-val">' + Fmt.data(t.aberto_em.slice(0, 10)) + '</strong>' +
            '<small class="meta-extra">' + UI.desde(t.aberto_em) + '</small></div>' +
          '<div class="meta-item"><span class="meta-rot">Prioridade</span>' +
            '<strong class="meta-val">' + Fmt.esc(t.prioridade) + '</strong></div>' +
          '<div class="meta-item"><span class="meta-rot">Prazo de solução</span>' +
            '<strong class="meta-val' + (sla.estourado ? ' is-neg' : '') + '">' +
              Fmt.data(String(sla.limite).slice(0, 10)) + '</strong>' +
            '<small class="meta-extra">' + Fmt.esc(sla.rotulo) + '</small>' +
          '</div>' +
        '</div>' +

        '<div class="ch-descricao">' +
          '<span class="meta-rot">O que você relatou</span>' +
          '<p>' + Fmt.esc(t.descricao) + '</p>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head"><div><h2>Conversa</h2>' +
          '<p>Tudo que foi trocado sobre este chamado, do mais antigo ao mais recente.</p></div></div>' +

        (t.comentarios.length
          ? '<ul class="conversa">' + t.comentarios.map(function (c) {
              return '<li class="cv cv--' + (c.papel === 'cliente' ? 'cliente' : 'agente') + '">' +
                  '<div class="cv-cab">' +
                    '<strong>' + Fmt.esc(c.autor) + '</strong>' +
                    '<span class="cv-papel">' + (c.papel === 'cliente' ? 'você' : 'Hifera') + '</span>' +
                    '<span class="cv-quando">' + UI.desde(c.quando) + '</span>' +
                    (c.solucao ? '<span class="cv-solucao">' + UI.svg(UI.ICONE.check, 2.2) + 'solução</span>' : '') +
                  '</div>' +
                  '<p>' + Fmt.esc(c.texto) + '</p>' +
                '</li>';
            }).join('') + '</ul>'
          : '<p class="rep-vazio">Ainda sem respostas. A Hifera responde dentro do prazo acima.</p>') +

        (s.aberto
          ? '<form class="nota-form" id="formResposta">' +
              '<label class="fld fld--full"><span class="sr">Sua resposta</span>' +
                '<textarea id="respostaTexto" rows="3" ' +
                  'placeholder="Complementar informação, mandar um print, responder o que foi perguntado…"></textarea>' +
              '</label>' +
              '<div class="nota-form-rodape">' +
                '<span class="nota-dica">' +
                  (s.pausaSla
                    ? 'Este chamado está aguardando você — responder destrava o prazo.'
                    : 'Sua resposta entra na conversa e avisa a Hifera.') + '</span>' +
                '<button type="submit" class="btn-pri">Responder</button>' +
              '</div>' +
            '</form>'
          : '<p class="rep-vazio">Este chamado está ' + s.label.toLowerCase() +
            '. Para retomar o assunto, abra um novo.</p>') +
      '</div>';

    var form = el.querySelector('#formResposta');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var campo = el.querySelector('#respostaTexto');
        var texto = campo.value.trim();
        if (!texto) { campo.focus(); return; }
        if (typeof handlers.responder === 'function') handlers.responder(id, texto);
      });
    }
  }

  /* ================================================================
     ABERTURA
     ================================================================ */
  function opcoes(lista, atual, placeholder) {
    return '<option value="">' + placeholder + '</option>' +
      lista.map(function (o) {
        return '<option value="' + Fmt.esc(o) + '"' + (o === atual ? ' selected' : '') + '>' +
               Fmt.esc(o) + '</option>';
      }).join('');
  }

  function filaEscolhida() {
    var f = Tickets.filaDe(rascunho.categoria, rascunho.sistema, rascunho.modulo);
    return f ? Tickets.FILAS[f] : null;
  }

  function renderNovo(el, ctx) {
    if (!rascunho) rascunho = vazio();

    var sistemas = rascunho.categoria ? Tickets.sistemas(rascunho.categoria) : [];
    var modulos  = (rascunho.categoria && rascunho.sistema)
      ? Tickets.modulos(rascunho.categoria, rascunho.sistema) : [];
    var fila = filaEscolhida();
    var ehReq = rascunho.tipo === 'requisicao';

    el.innerHTML =
      '<a class="voltar-link" href="#chamados">' + UI.svg(UI.ICONE.voltar) + 'Todos os chamados</a>' +

      '<div class="sec-head">' +
        '<h2>Abrir chamado</h2>' +
        '<p>Escolha o tipo e onde aconteceu. A gente descobre sozinho quem atende — você não precisa saber.</p>' +
      '</div>' +

      '<form class="card" id="formChamado" novalidate>' +

        '<fieldset class="bloco">' +
          '<legend>Tipo</legend>' +
          '<div class="tipo-escolha">' + Object.keys(Tickets.TIPOS).map(function (k) {
            var t = Tickets.TIPOS[k];
            return '<label class="tipo-op' + (rascunho.tipo === k ? ' is-on' : '') + '">' +
                '<input type="radio" name="tipo" value="' + k + '"' +
                  (rascunho.tipo === k ? ' checked' : '') + '>' +
                '<strong>' + t.label + '</strong>' +
                '<span>' + t.hint + '</span>' +
              '</label>';
          }).join('') + '</div>' +
        '</fieldset>' +

        '<fieldset class="bloco">' +
          '<legend>Onde <em>cada escolha destrava a próxima</em></legend>' +
          '<div class="grid-flds">' +
            '<label class="fld"><span class="fld-label">Categoria</span>' +
              '<select id="chCategoria">' +
                opcoes(Tickets.categorias(), rascunho.categoria, 'Selecione…') +
              '</select></label>' +

            '<label class="fld"><span class="fld-label">Sistema</span>' +
              '<select id="chSistema"' + (sistemas.length ? '' : ' disabled') + '>' +
                opcoes(sistemas, rascunho.sistema,
                  sistemas.length ? 'Selecione…' : 'escolha a categoria antes') +
              '</select></label>' +

            '<label class="fld"><span class="fld-label">Módulo</span>' +
              '<select id="chModulo"' + (modulos.length ? '' : ' disabled') + '>' +
                opcoes(modulos, rascunho.modulo,
                  modulos.length ? 'Selecione…' : 'escolha o sistema antes') +
              '</select></label>' +

            '<label class="fld"><span class="fld-label">Prioridade' +
              '<em>define o prazo de resposta</em></span>' +
              '<select id="chPrioridade">' + Object.keys(Tickets.PRIORIDADES).map(function (k) {
                var pr = Tickets.PRIORIDADES[k];
                return '<option value="' + k + '"' + (k === rascunho.prioridade ? ' selected' : '') + '>' +
                  pr.label + ' — resposta em ' + Tickets.formatarHoras(pr.resposta) + '</option>';
              }).join('') + '</select></label>' +
          '</div>' +

          (fila
            ? '<p class="fila-aviso">' + UI.svg(UI.ICONE.check, 2.2) +
                '<span>Vai para a fila <strong>' + Fmt.esc(fila.label) + '</strong>.</span></p>'
            : '<p class="fila-aviso fila-aviso--vazia">' +
                '<span>Complete as três escolhas acima para a gente saber quem atende.</span></p>') +
        '</fieldset>' +

        '<fieldset class="bloco">' +
          '<legend>O que aconteceu</legend>' +
          '<div class="grid-flds">' +
            '<label class="fld fld--full"><span class="fld-label">Assunto</span>' +
              '<input type="text" id="chTitulo" value="' + Fmt.esc(rascunho.titulo) + '" ' +
                'placeholder="' + (ehReq
                  ? 'Ex.: incluir um campo de centro de custo no pedido'
                  : 'Ex.: o relatório de expedição não abre desde ontem') + '" required></label>' +

            '<label class="fld fld--full"><span class="fld-label">Detalhes' +
              '<em>' + (ehReq ? 'o que você quer conseguir fazer' : 'o que você fez e o que apareceu') +
              '</em></span>' +
              '<textarea id="chDescricao" rows="5" placeholder="' + (ehReq
                ? 'Descreva o resultado esperado. Se souber, diga quem vai usar e com que frequência.'
                : 'Passo a passo do que estava fazendo, o que esperava e o que aconteceu. Mensagem de erro ajuda muito.') +
              '">' + Fmt.esc(rascunho.descricao) + '</textarea></label>' +
          '</div>' +
        '</fieldset>' +

        '<div class="ch-quem">' +
          UI.svg(UI.ICONE.pessoa, 1.7) +
          '<span>Abrindo como <strong>' + Fmt.esc(ctx.user.nome) + '</strong> · ' +
            Fmt.esc(ctx.user.email) + ' · ' + Fmt.esc(ctx.cliente) + '</span>' +
        '</div>' +

        '<footer class="modal-rodape">' +
          '<span class="modal-erro" id="chErro" role="alert"></span>' +
          '<div class="modal-botoes">' +
            '<a class="btn-sec" href="#chamados">Cancelar</a>' +
            '<button type="submit" class="btn-pri">Abrir chamado</button>' +
          '</div>' +
        '</footer>' +
      '</form>';

    ligarForm(el, ctx);
  }

  function ligarForm(el, ctx) {
    var g = function (id) { var e = el.querySelector('#' + id); return e ? e.value : ''; };

    el.querySelectorAll('input[name="tipo"]').forEach(function (r) {
      r.addEventListener('change', function () {
        colher(el);
        rascunho.tipo = r.value;
        renderNovo(el, ctx);
      });
    });

    /* Cada nível zera os de baixo: manter "Fluxo de caixa" depois de
       trocar a categoria produziria uma fila errada, em silêncio. */
    var cat = el.querySelector('#chCategoria');
    if (cat) cat.addEventListener('change', function () {
      colher(el);
      rascunho.categoria = cat.value;
      rascunho.sistema = '';
      rascunho.modulo = '';
      renderNovo(el, ctx);
    });

    var sis = el.querySelector('#chSistema');
    if (sis) sis.addEventListener('change', function () {
      colher(el);
      rascunho.sistema = sis.value;
      rascunho.modulo = '';
      renderNovo(el, ctx);
    });

    var mod = el.querySelector('#chModulo');
    if (mod) mod.addEventListener('change', function () {
      colher(el);
      rascunho.modulo = mod.value;
      renderNovo(el, ctx);
    });

    var form = el.querySelector('#formChamado');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      colher(el);

      var erro = el.querySelector('#chErro');
      var falta =
        !rascunho.titulo ? 'Escreva um assunto para o chamado.' :
        !rascunho.descricao ? 'Conte o que aconteceu — sem isso a gente responde perguntando.' :
        !rascunho.categoria || !rascunho.sistema || !rascunho.modulo
          ? 'Complete categoria, sistema e módulo para o chamado chegar na fila certa.' : '';

      if (falta) {
        erro.textContent = falta;
        return;
      }

      if (typeof handlers.abrir === 'function') {
        handlers.abrir({
          tipo: rascunho.tipo,
          titulo: rascunho.titulo,
          descricao: rascunho.descricao,
          categoria: rascunho.categoria,
          sistema: rascunho.sistema,
          modulo: rascunho.modulo,
          prioridade: rascunho.prioridade
        });
      }
    });

    function colher(raiz) {
      rascunho.titulo     = (raiz.querySelector('#chTitulo') || {}).value || '';
      rascunho.descricao  = (raiz.querySelector('#chDescricao') || {}).value || '';
      rascunho.prioridade = (raiz.querySelector('#chPrioridade') || {}).value || 'Média';
      rascunho.titulo = rascunho.titulo.trim();
      rascunho.descricao = rascunho.descricao.trim();
      return g;
    }
  }

  function limparRascunho() { rascunho = null; }

  return {
    definirHandlers: definirHandlers,
    renderLista: renderLista,
    renderDetalhe: renderDetalhe,
    renderNovo: renderNovo,
    limparRascunho: limparRascunho
  };
})();
