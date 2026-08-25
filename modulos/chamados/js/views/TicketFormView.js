/* =================================================================
   HIFERA ADMIN · View · Abertura de chamado
   A cascata é o coração da tela: Categoria destrava Sistema, que
   destrava Módulo, e o Módulo revela a fila que vai atender. O
   solicitante nunca escolhe fila — é o que evita chamado no lugar
   errado.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.TicketFormView = (function () {
  'use strict';

  var Fmt   = HiferaAdmin.Fmt;
  var M     = HiferaAdmin.TicketsModel;
  var Vista = HiferaAdmin.TicketsView;
  var Img   = HiferaAdmin.ImageModel;

  var modalEl = null, aoSalvar = null, focoAnterior = null;
  var anexos = [];
  var tipo = 'chamado';

  function opcoes(lista, sel, vazio) {
    return '<option value="">' + (vazio || 'Selecione…') + '</option>' +
      lista.map(function (v) {
        return '<option value="' + Fmt.esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + Fmt.esc(v) + '</option>';
      }).join('');
  }

  function corpo() {
    var t = M.TIPOS[tipo];
    var ehReq = tipo === 'requisicao';

    return '<form class="modal-form" id="formChamado" novalidate>' +
      '<div class="form-cols">' +
        '<div class="form-main">' +

          '<fieldset class="bloco">' +
            '<legend>Tipo <em>muda o que o time espera de você</em></legend>' +
            '<div class="tipo-escolha" role="radiogroup" aria-label="Tipo de solicitação">' +
              Object.keys(M.TIPOS).map(function (k) {
                var d = M.TIPOS[k];
                return '<button type="button" class="tipo-op' + (k === tipo ? ' is-on' : '') + '" ' +
                  'data-tipo="' + k + '" role="radio" aria-checked="' + (k === tipo) + '">' +
                  '<strong>' + Fmt.esc(d.label) + '</strong>' +
                  '<span>' + Fmt.esc(d.hint) + '</span></button>';
              }).join('') +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="bloco">' +
            '<legend>O que aconteceu</legend>' +
            '<div class="grid-flds">' +
              '<label class="fld fld--full"><span class="fld-label">Título <em>obrigatório</em></span>' +
                '<input type="text" id="tkTitulo" maxlength="120" required ' +
                'placeholder="' + (ehReq ? 'Resumo do que você precisa' : 'Resumo do problema') + '"></label>' +
              '<label class="fld fld--full"><span class="fld-label">Descrição <em>obrigatório</em></span>' +
                '<textarea id="tkDescricao" rows="5" required placeholder="' +
                (ehReq ? 'Explique o que precisa e para quando.'
                       : 'O que você estava fazendo, o que esperava e o que aconteceu.') + '"></textarea></label>' +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="bloco">' +
            '<legend>Onde <em>a fila é definida por esta escolha</em></legend>' +
            '<div class="grid-flds">' +
              '<label class="fld"><span class="fld-label">Categoria <em>obrigatório</em></span>' +
                '<select id="tkCategoria" required>' + opcoes(M.categorias()) + '</select></label>' +
              '<label class="fld"><span class="fld-label">Sistema / Plataforma <em>obrigatório</em></span>' +
                '<select id="tkSistema" required disabled>' + opcoes([], '', 'Escolha a categoria antes') + '</select></label>' +
              '<label class="fld"><span class="fld-label">Módulo / Serviço <em>obrigatório</em></span>' +
                '<select id="tkModulo" required disabled>' + opcoes([], '', 'Escolha o sistema antes') + '</select></label>' +
              '<label class="fld"><span class="fld-label">Operação <em>' + (ehReq ? 'opcional' : 'obrigatório') + '</em></span>' +
                '<input type="text" id="tkOperacao" placeholder="Financeiro, Comercial, Estoque…"' +
                (ehReq ? '' : ' required') + '></label>' +
            '</div>' +
            '<div class="fila-destino" id="tkFila" hidden></div>' +
          '</fieldset>' +

          '<fieldset class="bloco">' +
            '<legend>Prioridade e contexto</legend>' +
            '<div class="grid-flds">' +
              '<label class="fld"><span class="fld-label">Prioridade</span>' +
                '<select id="tkPrioridade">' +
                  Object.keys(M.PRIORIDADES).map(function (k) {
                    return '<option value="' + k + '"' + (k === 'Média' ? ' selected' : '') + '>' +
                      k + ' — resposta em ' + M.PRIORIDADES[k].resposta + 'h, solução em ' +
                      M.PRIORIDADES[k].solucao + 'h</option>';
                  }).join('') +
                '</select></label>' +
              '<label class="fld"><span class="fld-label">Projeto vinculado <em>opcional</em></span>' +
                '<select id="tkVinculo">' + opcoes(projetosDisponiveis(), '', 'Nenhum') + '</select></label>' +
              '<label class="fld"><span class="fld-label">Solicitante <em>obrigatório</em></span>' +
                '<input type="text" id="tkSolicitante" required placeholder="Nome de quem abriu"></label>' +
              '<label class="fld"><span class="fld-label">E-mail <em>obrigatório</em></span>' +
                '<input type="email" id="tkEmail" required placeholder="pessoa@empresa.com.br"></label>' +
              '<label class="fld"><span class="fld-label">Empresa</span>' +
                '<input type="text" id="tkEmpresa" placeholder="Nome do cliente"></label>' +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="bloco">' +
            '<legend>Anexos <em>print ajuda mais que descrição</em></legend>' +
            '<div class="drop-zona drop-zona--slim" id="tkDrop" tabindex="0" role="button" ' +
                 'aria-label="Solte arquivos aqui ou clique para escolher">' +
              Vista.svg('<path d="M12 16V4"/><path d="M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>', 1.5) +
              '<strong>Arraste prints ou arquivos</strong>' +
              '<span>PNG, JPG, WebP ou PDF · até 12 MB cada</span>' +
            '</div>' +
            '<input type="file" id="tkFile" accept="image/png,image/jpeg,image/webp,application/pdf" multiple hidden>' +
            '<p class="drop-aviso" id="tkAviso" role="status"></p>' +
            '<div class="rep" id="tkAnexos"></div>' +
          '</fieldset>' +

        '</div>' +

        '<aside class="form-side">' +
          '<div class="side-sticky">' +
            '<span class="side-titulo">Como vai chegar</span>' +
            '<div id="tkPreview"></div>' +
            '<p class="side-nota">O prazo abaixo começa a contar no momento em que você abrir. ' +
            'Marcar como <strong>aguardando cliente</strong> pausa o relógio.</p>' +
          '</div>' +
        '</aside>' +
      '</div>' +

      '<footer class="modal-rodape">' +
        '<span class="modal-erro" id="tkErro" role="alert"></span>' +
        '<div class="modal-botoes">' +
          '<button type="button" class="btn-sec" data-fechar>Cancelar</button>' +
          '<button type="submit" class="btn-pri">Abrir ' + Fmt.esc(t.label.toLowerCase()) + '</button>' +
        '</div>' +
      '</footer>' +
    '</form>';
  }

  /* Reaproveita os projetos cadastrados no outro módulo do painel */
  function projetosDisponiveis() {
    if (!HiferaAdmin.ProjectsModel) return [];
    try {
      return HiferaAdmin.ProjectsModel.getAll().map(function (p) { return p.titulo; });
    } catch (e) { return []; }
  }

  function coletar() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
    return {
      tipo: tipo,
      titulo: g('tkTitulo'), descricao: g('tkDescricao'),
      categoria: g('tkCategoria'), sistema: g('tkSistema'), modulo: g('tkModulo'),
      operacao: g('tkOperacao'), prioridade: g('tkPrioridade'), vinculo: g('tkVinculo'),
      solicitante: g('tkSolicitante'), email: g('tkEmail'), empresa: g('tkEmpresa'),
      status: 'Aberto', anexos: anexos.slice(), comentarios: []
    };
  }

  function atualizarPreview() {
    var d = coletar();
    var p = M.PRIORIDADES[d.prioridade] || M.PRIORIDADES['Média'];
    var fila = M.filaDe(d.categoria, d.sistema, d.modulo);

    var alvo = document.getElementById('tkPreview');
    if (alvo) {
      alvo.innerHTML = '<div class="tk-preview">' +
        '<div class="tk-preview-topo">' + Vista.seloTipo(d.tipo) + Vista.seloPrioridade(d.prioridade) + '</div>' +
        '<h4>' + Fmt.esc(d.titulo || 'Sem título ainda') + '</h4>' +
        '<p>' + Fmt.esc(d.descricao || 'A descrição aparece aqui.') + '</p>' +
        '<dl class="tk-preview-meta">' +
          '<div><dt>Fila</dt><dd>' + (fila ? Fmt.esc(M.FILAS[fila].label) : '—') + '</dd></div>' +
          '<div><dt>Resposta em</dt><dd>' + p.resposta + 'h</dd></div>' +
          '<div><dt>Solução em</dt><dd>' + p.solucao + 'h</dd></div>' +
          '<div><dt>Anexos</dt><dd>' + anexos.length + '</dd></div>' +
        '</dl>' +
      '</div>';
    }

    var caixaFila = document.getElementById('tkFila');
    if (caixaFila) {
      if (fila) {
        caixaFila.hidden = false;
        caixaFila.innerHTML = Vista.svg(Vista.IC.fila) +
          '<span>Vai para a fila <strong>' + Fmt.esc(M.FILAS[fila].label) + '</strong> · ' +
          Fmt.esc(M.FILAS[fila].email) + '</span>';
      } else {
        caixaFila.hidden = true;
      }
    }
  }

  function renderAnexos() {
    var el = document.getElementById('tkAnexos');
    if (!el) return;
    el.innerHTML = anexos.length ? anexos.map(function (a, i) {
      return '<div class="rep-linha rep-linha--img">' +
        '<div class="rep-thumb">' + (a.src
          ? '<img src="' + Fmt.esc(a.src) + '" alt="">'
          : '<span>PDF</span>') + '</div>' +
        '<div class="rep-arquivo"><strong>' + Fmt.esc(a.nome) + '</strong>' +
        '<small>' + Img.formatarBytes(a.tamanho) + (a.convertido ? ' · convertido para WebP' : '') + '</small></div>' +
        '<button type="button" class="icon-btn is-danger" data-rem-anexo="' + i + '" aria-label="Remover anexo">' +
        Vista.svg('<path d="M5 12h14"/>', 1.8) + '</button></div>';
    }).join('') : '';
    atualizarPreview();
  }

  function receber(lista) {
    var arquivos = [].slice.call(lista || []);
    if (!arquivos.length) return;
    var aviso = document.getElementById('tkAviso');
    var erros = [];

    arquivos.reduce(function (fila, arq) {
      return fila.then(function () {
        if (arq.type === 'application/pdf') {
          if (arq.size > 12 * 1024 * 1024) { erros.push('"' + arq.name + '" passa de 12 MB.'); return; }
          anexos.push({ nome: arq.name, tamanho: arq.size, tipo: arq.type, src: '' });
          return;
        }
        return Img.processar(arq, { larguraMax: 1400 }).then(function (r) {
          anexos.push({ nome: r.nome, tamanho: r.bytes, tipo: 'image/webp', src: r.src, convertido: true });
        }).catch(function (e) { erros.push(e.message); });
      });
    }, Promise.resolve()).then(function () {
      renderAnexos();
      if (aviso) {
        aviso.textContent = erros.length ? erros.join(' ') : anexos.length + ' anexo(s) prontos.';
        aviso.className = 'drop-aviso ' + (erros.length ? 'is-erro' : 'is-ok');
      }
    });
  }

  function ligar() {
    modalEl.querySelectorAll('[data-fechar]').forEach(function (b) {
      b.addEventListener('click', fechar);
    });

    /* Troca de tipo redesenha o corpo — os rótulos e obrigatoriedades mudam */
    modalEl.querySelectorAll('[data-tipo]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.tipo === tipo) return;
        tipo = b.dataset.tipo;
        var caixa = modalEl.querySelector('.modal-caixa');
        caixa.querySelector('.modal-form').outerHTML = corpo();
        ligar();
        renderAnexos();
      });
    });

    var cat = document.getElementById('tkCategoria');
    var sis = document.getElementById('tkSistema');
    var mod = document.getElementById('tkModulo');

    cat.addEventListener('change', function () {
      var lista = M.sistemas(cat.value);
      sis.innerHTML = opcoes(lista, '', lista.length ? 'Selecione…' : 'Sem sistemas');
      sis.disabled = !lista.length;
      mod.innerHTML = opcoes([], '', 'Escolha o sistema antes');
      mod.disabled = true;
      atualizarPreview();
    });

    sis.addEventListener('change', function () {
      var lista = M.modulos(cat.value, sis.value);
      mod.innerHTML = opcoes(lista, '', lista.length ? 'Selecione…' : 'Sem módulos');
      mod.disabled = !lista.length;
      atualizarPreview();
    });

    var form = document.getElementById('formChamado');
    form.addEventListener('input', atualizarPreview);
    form.addEventListener('change', atualizarPreview);

    var zona = document.getElementById('tkDrop');
    var file = document.getElementById('tkFile');
    zona.addEventListener('click', function () { file.click(); });
    zona.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); }
    });
    file.addEventListener('change', function () { receber(file.files); file.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('is-sobre'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('is-sobre'); });
    });
    zona.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) receber(e.dataTransfer.files);
    });

    modalEl.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rem-anexo]');
      if (rm) { anexos.splice(parseInt(rm.dataset.remAnexo, 10), 1); renderAnexos(); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = coletar();
      var erro = document.getElementById('tkErro');
      var falta = [];
      if (!d.titulo) falta.push('título');
      if (!d.descricao) falta.push('descrição');
      if (!d.categoria || !d.sistema || !d.modulo) falta.push('categoria/sistema/módulo');
      if (!d.solicitante) falta.push('solicitante');
      if (!d.email) falta.push('e-mail');
      if (tipo === 'chamado' && !d.operacao) falta.push('operação');

      if (falta.length) {
        erro.textContent = 'Falta preencher: ' + falta.join(', ') + '.';
        return;
      }
      erro.textContent = '';
      if (aoSalvar) aoSalvar(d);
      fechar();
    });

    atualizarPreview();
  }

  function abrir(callback) {
    modalEl = document.getElementById('modalRoot');
    if (!modalEl) return;
    aoSalvar = callback;
    focoAnterior = document.activeElement;
    anexos = [];
    tipo = 'chamado';

    modalEl.innerHTML =
      '<div class="modal-fundo" data-fechar></div>' +
      '<div class="modal-caixa" role="dialog" aria-modal="true" aria-labelledby="tkTituloModal">' +
        '<header class="modal-topo">' +
          '<div><h2 id="tkTituloModal">Abrir chamado</h2>' +
          '<p>A fila e o prazo saem do que você escolher em "Onde".</p></div>' +
          '<button type="button" class="icon-btn" data-fechar aria-label="Fechar">' +
            Vista.svg('<path d="M18 6L6 18M6 6l12 12"/>', 1.8) + '</button>' +
        '</header>' + corpo() +
      '</div>';

    modalEl.classList.add('is-open');
    document.body.classList.add('sem-scroll');
    ligar();
    renderAnexos();

    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) {
        fechar(); document.removeEventListener('keydown', esc);
      }
    });

    var t = document.getElementById('tkTitulo');
    if (t) t.focus();
  }

  function fechar() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.body.classList.remove('sem-scroll');
    setTimeout(function () { if (modalEl) modalEl.innerHTML = ''; }, 200);
    anexos = [];
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  return { abrir: abrir, fechar: fechar };
})();
