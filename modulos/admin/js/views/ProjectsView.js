/* =================================================================
   HIFERA ADMIN · View · Gestão do site (CRUD de projetos)
   Tabela com alertas + modal de cadastro com upload por drag & drop
   e preview ao vivo do card da home.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ProjectsView = (function () {
  'use strict';

  var Fmt    = HiferaAdmin.Fmt;
  var Model  = HiferaAdmin.ProjectsModel;
  var Img    = HiferaAdmin.ImageModel;
  var STATUS = Model.STATUS;

  var handlers = {};

  /* ================================================================
     TABELA
     ================================================================ */
  function pill(status) {
    var s = STATUS[status] || STATUS.andamento;
    return '<span class="pill pill--' + s.cor + '"><span class="pill-dot"></span>' + s.label + '</span>';
  }

  var ICONE_ALERTA = {
    'parcela-vencida':   '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    'entrega-estourada': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'
  };

  function badgesAlerta(p) {
    var lista = Model.alertasProjeto(p);
    if (!lista.length) return '';
    return '<span class="alerta-lista">' + lista.map(function (a) {
      var extra = a.tipo === 'parcela-vencida'
        ? ' · ' + Fmt.moeda(a.valor) + ' em aberto'
        : ' · ' + a.dias + (a.dias === 1 ? ' dia' : ' dias') + ' de atraso';
      return '<span class="alerta alerta--' + a.tipo + '" title="' + Fmt.esc(a.detalhe + extra) + '">' +
             '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
             (ICONE_ALERTA[a.tipo] || '') + '</svg>' + Fmt.esc(a.label) + '</span>';
    }).join('') + '</span>';
  }

  function linha(p) {
    var t = Model.totaisProjeto(p);
    var capa = p.imagens[0];
    var thumb = capa
      ? '<img src="' + Fmt.esc(Fmt.assetAdmin(capa.src)) + '" alt="" loading="lazy" onerror="this.classList.add(\'is-broken\')">'
      : '<span class="sem-foto">sem foto</span>';
    var alertas = Model.alertasProjeto(p);

    return '<tr data-id="' + Fmt.esc(p.id) + '"' + (alertas.length ? ' class="tem-alerta"' : '') + '>' +
      '<td class="cel-projeto">' +
        '<div class="cel-thumb">' + thumb + '</div>' +
        '<div class="cel-info">' +
          '<strong>' + Fmt.esc(p.titulo) + (p.destaque ? '<span class="tag-destaque">destaque</span>' : '') + '</strong>' +
          '<small>' + Fmt.esc(p.categoria) + (p.segmento ? ' · ' + Fmt.esc(p.segmento) : '') + '</small>' +
          badgesAlerta(p) +
        '</div>' +
      '</td>' +
      '<td>' + pill(p.status) + '</td>' +
      '<td class="cel-cliente">' + (p.cliente ? Fmt.esc(p.cliente) : '<span class="vazio">—</span>') + '</td>' +
      '<td class="num">' + Fmt.moeda(t.recebido) + '</td>' +
      '<td class="num">' + (t.aReceber > 0 ? Fmt.moeda(t.aReceber) : '<span class="vazio">—</span>') + '</td>' +
      '<td class="num">' + Fmt.moeda(t.gastos) + '</td>' +
      '<td>' +
        '<button type="button" class="switch' + (p.publicado ? ' is-on' : '') + '" data-acao="publicar" ' +
        'role="switch" aria-checked="' + p.publicado + '" ' +
        'aria-label="' + (p.publicado ? 'Despublicar' : 'Publicar') + ' ' + Fmt.esc(p.titulo) + '">' +
        '<span class="switch-knob"></span></button>' +
      '</td>' +
      '<td class="cel-acoes">' +
        botao('editar',   'Editar',    '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>') +
        botao('duplicar', 'Duplicar',  '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>') +
        botao('abrir',    'Abrir link','<path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>') +
        botao('excluir',  'Excluir',   '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>', 'is-danger') +
      '</td>' +
    '</tr>';
  }

  function botao(acao, titulo, path, extra) {
    return '<button type="button" class="icon-btn ' + (extra || '') + '" data-acao="' + acao + '" ' +
           'title="' + titulo + '" aria-label="' + titulo + '">' +
           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
           'stroke-linecap="round" stroke-linejoin="round">' + path + '</svg></button>';
  }

  function renderTabela(el, lista) {
    if (!el) return;

    if (!lista.length) {
      el.innerHTML =
        '<div class="vazio-box">' +
          '<strong>Nenhum projeto encontrado</strong>' +
          '<p>Ajuste a busca ou cadastre o primeiro projeto da vitrine.</p>' +
        '</div>';
      return;
    }

    el.innerHTML =
      '<div class="tabela-wrap">' +
        '<table class="tabela">' +
          '<thead><tr>' +
            '<th>Projeto</th><th>Status</th><th>Cliente</th>' +
            '<th class="num">Recebido</th><th class="num">A receber</th><th class="num">Gastos</th>' +
            '<th>No site</th><th class="cel-acoes">Ações</th>' +
          '</tr></thead>' +
          '<tbody>' + lista.map(linha).join('') + '</tbody>' +
        '</table>' +
      '</div>';

    el.querySelectorAll('[data-acao]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('tr').dataset.id;
        var fn = handlers[btn.dataset.acao];
        if (fn) fn(id);
      });
    });
  }

  /* ================================================================
     MODAL / FORMULÁRIO
     ================================================================ */
  var modalEl = null;
  var rascunho = null;
  var aoSalvar = null;
  var focoAnterior = null;
  var imagens = [];        /* fonte de verdade das imagens no modal */

  function campo(id, label, valor, opts) {
    opts = opts || {};
    var attrs = 'id="' + id + '" name="' + id + '" value="' + Fmt.esc(valor) + '"' +
                (opts.type ? ' type="' + opts.type + '"' : ' type="text"') +
                (opts.placeholder ? ' placeholder="' + Fmt.esc(opts.placeholder) + '"' : '') +
                (opts.required ? ' required' : '') +
                (opts.min !== undefined ? ' min="' + opts.min + '"' : '') +
                (opts.step ? ' step="' + opts.step + '"' : '');
    return '<label class="fld' + (opts.largura ? ' fld--' + opts.largura : '') + '">' +
             '<span class="fld-label">' + label + (opts.hint ? '<em>' + opts.hint + '</em>' : '') + '</span>' +
             '<input ' + attrs + '>' +
           '</label>';
  }

  function area(id, label, valor, opts) {
    opts = opts || {};
    return '<label class="fld fld--full">' +
             '<span class="fld-label">' + label + (opts.hint ? '<em>' + opts.hint + '</em>' : '') + '</span>' +
             '<textarea id="' + id + '" name="' + id + '" rows="' + (opts.rows || 3) + '" ' +
             'placeholder="' + Fmt.esc(opts.placeholder || '') + '">' + Fmt.esc(valor) + '</textarea>' +
           '</label>';
  }

  function selecao(id, label, valor, opcoes) {
    return '<label class="fld"><span class="fld-label">' + label + '</span>' +
             '<select id="' + id + '" name="' + id + '">' +
               opcoes.map(function (o) {
                 return '<option value="' + o.v + '"' + (o.v === valor ? ' selected' : '') + '>' + o.t + '</option>';
               }).join('') +
             '</select></label>';
  }

  function caixa(id, label, marcado, hint) {
    return '<label class="chk">' +
             '<input type="checkbox" id="' + id + '" name="' + id + '"' + (marcado ? ' checked' : '') + '>' +
             '<span class="chk-box"></span>' +
             '<span class="chk-txt">' + label + (hint ? '<em>' + hint + '</em>' : '') + '</span>' +
           '</label>';
  }

  /* --- Imagens ---------------------------------------------------- */
  function linhaImagem(im, i) {
    var eUpload = im.origem === 'upload';
    var miolo = eUpload
      ? '<div class="rep-arquivo">' +
          '<strong>' + Fmt.esc(im.nome || 'imagem enviada') + '</strong>' +
          '<small>' + Fmt.esc(im.formato || 'WebP') + ' · ' + Fmt.esc(im.dimensoes || '') +
          ' · ' + Img.formatarBytes(im.bytes || 0) +
          (im.reducao ? ' · −' + im.reducao + '%' : '') + '</small>' +
        '</div>'
      : '<input type="text" class="rep-in rep-src" data-i="' + i + '" value="' + Fmt.esc(im.src) +
        '" placeholder="assets/thumbs/arquivo.webp ou https://…">';

    return '<div class="rep-linha rep-linha--img" data-img="' + i + '" draggable="true">' +
      '<span class="rep-arraste" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/></svg>' +
      '</span>' +
      '<div class="rep-thumb">' +
        (im.src ? '<img src="' + Fmt.esc(Fmt.assetAdmin(im.src)) + '" alt="">' : '<span>?</span>') +
        (i === 0 ? '<span class="rep-capa">capa</span>' : '') +
      '</div>' +
      miolo +
      '<input type="text" class="rep-in rep-alt" data-i="' + i + '" value="' + Fmt.esc(im.alt) + '" placeholder="Texto alternativo">' +
      '<button type="button" class="icon-btn is-danger" data-rem-img="' + i + '" aria-label="Remover imagem">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>' +
      '</button>' +
    '</div>';
  }

  function renderImagens() {
    var alvo = document.getElementById('repImagens');
    if (!alvo) return;
    alvo.innerHTML = imagens.length
      ? imagens.map(linhaImagem).join('')
      : '<p class="rep-vazio">Nenhuma imagem ainda. Arraste um arquivo na área acima ou cole um caminho.</p>';
    atualizarPreview();
    atualizarUsoStorage();
  }

  function atualizarUsoStorage() {
    var el = document.getElementById('usoStorage');
    if (!el) return;
    var uso = Img.usoStorage();
    var critico = uso.pct > 80;
    el.className = 'uso-storage' + (critico ? ' is-critico' : '');
    el.innerHTML =
      '<div class="uso-barra"><span style="width:' + Math.min(100, uso.pct).toFixed(1) + '%"></span></div>' +
      '<span>' + Img.formatarBytes(uso.bytes) + ' de ~' + Img.formatarBytes(uso.cota) +
      ' usados no navegador' + (critico ? ' — perto do limite' : '') + '</span>';
  }

  function avisoImagem(msg, tipo) {
    var el = document.getElementById('dropAviso');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'drop-aviso' + (tipo ? ' is-' + tipo : '');
  }

  function receberArquivos(lista) {
    var arquivos = [].slice.call(lista || []);
    if (!arquivos.length) return;

    avisoImagem('Convertendo ' + arquivos.length + (arquivos.length === 1 ? ' imagem…' : ' imagens…'), 'processando');

    var zona = document.getElementById('dropZona');
    if (zona) zona.classList.add('is-processando');

    var erros = [];
    var feitos = 0;

    arquivos.reduce(function (fila, arq) {
      return fila.then(function () {
        return Img.processar(arq).then(function (r) {
          if (!Img.cabeNoStorage(r.bytes)) {
            erros.push('Sem espaço no navegador para "' + arq.name + '".');
            return;
          }
          imagens.push({
            src: r.src, alt: '', origem: 'upload', nome: r.nome,
            bytes: r.bytes, formato: r.formato,
            dimensoes: r.largura + '×' + r.altura, reducao: r.reducao
          });
          feitos++;
        }).catch(function (e) {
          erros.push(e.message);
        });
      });
    }, Promise.resolve()).then(function () {
      if (zona) zona.classList.remove('is-processando');
      renderImagens();
      if (erros.length) {
        avisoImagem(erros.join(' '), 'erro');
      } else {
        var ultima = imagens[imagens.length - 1];
        avisoImagem(feitos + (feitos === 1 ? ' imagem convertida' : ' imagens convertidas') +
                    ' para ' + (ultima ? ultima.formato : 'WebP') +
                    (ultima && ultima.reducao ? ' · ' + ultima.reducao + '% menor que o original' : ''), 'ok');
      }
    });
  }

  /* --- Bullets do card em destaque --------------------------------- */
  function linhaBullet(txt, i) {
    return '<div class="rep-linha rep-linha--bullet" data-bullet="' + i + '">' +
      '<span class="rep-check" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6L9 17l-5-5"/></svg>' +
      '</span>' +
      '<input type="text" class="rep-in rep-bullet" value="' + Fmt.esc(txt) + '" placeholder="Fluxo de caixa em tempo real">' +
      '<button type="button" class="icon-btn is-danger" data-rem-bullet="' + i + '" aria-label="Remover item">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>' +
      '</button>' +
    '</div>';
  }

  function linhaLancamento(l, i) {
    var vencido = l.aReceber > 0 && l.mes && l.mes < Model.mesAtual();
    return '<div class="rep-linha rep-linha--fin' + (vencido ? ' is-vencida' : '') + '" data-lanc="' + i + '">' +
      '<input type="month" class="rep-in rep-mes" value="' + Fmt.esc(l.mes) + '" aria-label="Competência">' +
      '<input type="number" class="rep-in rep-num rep-meta"     value="' + l.meta     + '" step="0.01" min="0" aria-label="Meta">' +
      '<input type="number" class="rep-in rep-num rep-recebido" value="' + l.recebido + '" step="0.01" min="0" aria-label="Recebido">' +
      '<input type="number" class="rep-in rep-num rep-areceber" value="' + l.aReceber + '" step="0.01" min="0" aria-label="A receber">' +
      '<input type="number" class="rep-in rep-num rep-gastos"   value="' + l.gastos   + '" step="0.01" min="0" aria-label="Gastos">' +
      '<button type="button" class="icon-btn is-danger" data-rem-lanc="' + i + '" aria-label="Remover lançamento">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>' +
      '</button>' +
    '</div>';
  }

  /* --- Preview ------------------------------------------------------ */
  function previewGrade(p) {
    var capa = (p.imagens[0] && p.imagens[0].src) ? p.imagens[0] : null;
    var ordem = String(Math.max(0, Math.round(p.ordem)));
    if (ordem.length < 2) ordem = '0' + ordem;
    return '<div class="pv-card">' +
      '<div class="pv-media">' +
        (capa ? '<img src="' + Fmt.esc(Fmt.assetAdmin(capa.src)) + '" alt="">' : '<div class="pv-nofoto">sem foto de capa</div>') +
        '<span class="pv-tag">Projeto · ' + Fmt.esc(p.categoria || '—') + '</span>' +
        (p.imagens.length > 1 ? '<span class="pv-count">' + p.imagens.length + ' telas</span>' : '') +
      '</div>' +
      '<div class="pv-body">' +
        '<span class="pv-meta">' + ordem + ' · ' + Fmt.esc(p.segmento || 'sem segmento') + '</span>' +
        '<h4>' + Fmt.esc(p.titulo || 'Sem título') + '</h4>' +
        '<p>' + Fmt.esc(p.descricao || 'Sem descrição.') + '</p>' +
        '<span class="pv-cta">Ver caso →</span>' +
      '</div>' +
    '</div>';
  }

  function previewDestaque(p) {
    var capa = (p.imagens[0] && p.imagens[0].src) ? p.imagens[0] : null;
    return '<div class="pv-card pv-card--destaque">' +
      '<div class="pv-media pv-media--wide">' +
        (capa ? '<img src="' + Fmt.esc(Fmt.assetAdmin(capa.src)) + '" alt="">' : '<div class="pv-nofoto">sem foto de capa</div>') +
      '</div>' +
      '<div class="pv-body">' +
        '<span class="pv-fptag"><span class="dot"></span>Demo ao vivo</span>' +
        '<h4>' + Fmt.esc(p.titulo || 'Sem título') + '</h4>' +
        '<p>' + Fmt.esc(p.descricao || 'Sem descrição.') + '</p>' +
        (p.bullets.length
          ? '<ul class="pv-lista">' + p.bullets.map(function (b) {
              return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' + Fmt.esc(b) + '</li>';
            }).join('') + '</ul>'
          : '<p class="pv-vazio">Sem itens na lista de benefícios.</p>') +
        '<div class="pv-fpcta">' +
          '<span class="pv-btn">Experimentar agora →</span>' +
          (p.preco ? '<span class="pv-preco">' + Fmt.esc(p.preco) + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function previewCard(p) {
    return p.destaque ? previewDestaque(p) : previewGrade(p);
  }

  /* --- Corpo do modal ------------------------------------------------ */
  function corpoModal(p, novo) {
    var opStatus = Object.keys(STATUS).map(function (k) { return { v: k, t: STATUS[k].label }; });
    var t = Model.totaisProjeto(p);

    return '' +
    '<form class="modal-form" id="formProjeto" novalidate>' +

      '<div class="form-cols">' +
        '<div class="form-main">' +

          '<fieldset class="bloco">' +
            '<legend>Vitrine <em>o que aparece no card da home</em></legend>' +
            '<div class="grid-flds">' +
              campo('f_titulo', 'Título', p.titulo, { placeholder: 'Projeto-Nome', required: true }) +
              campo('f_categoria', 'Categoria', p.categoria, { placeholder: 'CRM, Estética, Comércio…', hint: 'vira "Projeto · X"' }) +
              campo('f_segmento', 'Segmento', p.segmento, { placeholder: 'Comercial & Vendas' }) +
              campo('f_ordem', 'Ordem', p.ordem, { type: 'number', min: 0, hint: 'posição na grade' }) +
              area('f_descricao', 'Descrição', p.descricao, { rows: 3, placeholder: 'Uma frase sobre o que o sistema resolve.' }) +
              campo('f_link', 'Link do projeto', p.link, { placeholder: 'projetos/Projeto-Nome/', largura: 'full' }) +
              campo('f_preco', 'Preço exibido', p.preco, { placeholder: 'A partir de R$ 397/mês', hint: 'só no card em destaque' }) +
            '</div>' +
            '<div class="chk-linha">' +
              caixa('f_publicado', 'Publicado no site', p.publicado, 'aparece na vitrine') +
              caixa('f_destaque', 'Produto em destaque', p.destaque, 'card grande do topo') +
              caixa('f_novaAba', 'Abrir em nova aba', p.novaAba) +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="bloco bloco--destaque' + (p.destaque ? '' : ' is-inativo') + '" id="blocoBullets">' +
            '<legend>Benefícios do card grande <em>a listinha com os checks</em></legend>' +
            '<p class="bloco-nota" id="notaBullets">' +
              (p.destaque
                ? 'Estes itens aparecem sob a descrição no card em destaque da home.'
                : 'Só renderiza quando "Produto em destaque" estiver marcado.') +
            '</p>' +
            '<div class="rep" id="repBullets">' +
              (p.bullets.length ? p.bullets.map(linhaBullet).join('') : '') +
            '</div>' +
            '<button type="button" class="btn-sec" id="addBullet">+ Adicionar benefício</button>' +
          '</fieldset>' +

          '<fieldset class="bloco">' +
            '<legend>Imagens <em>a primeira vira a capa; as demais entram no carrossel</em></legend>' +

            '<div class="drop-zona" id="dropZona" tabindex="0" role="button" ' +
                 'aria-label="Solte imagens aqui ou clique para escolher">' +
              '<svg class="drop-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M12 16V4"/><path d="M8 8l4-4 4 4"/>' +
                '<path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
              '<strong>Arraste as telas do projeto aqui</strong>' +
              '<span>ou clique para escolher · PNG, JPG ou WebP até 12 MB</span>' +
              '<span class="drop-tec">Convertemos para ' + (Img.suportaWebp() ? 'WebP' : 'JPEG') +
              ' e redimensionamos para 1200px antes de guardar</span>' +
              '<span class="drop-spin" aria-hidden="true"></span>' +
            '</div>' +
            '<input type="file" id="fileImagens" accept="image/png,image/jpeg,image/webp" multiple hidden>' +
            '<p class="drop-aviso" id="dropAviso" role="status"></p>' +

            '<div class="rep" id="repImagens"></div>' +
            '<button type="button" class="btn-sec" id="addImagemUrl">+ Adicionar por caminho/URL</button>' +
            '<div class="uso-storage" id="usoStorage"></div>' +
          '</fieldset>' +

          '<fieldset class="bloco">' +
            '<legend>Gestão <em>controle interno, não aparece no site</em></legend>' +
            '<div class="grid-flds">' +
              selecao('f_status', 'Status', p.status, opStatus) +
              campo('f_cliente', 'Cliente', p.cliente, { placeholder: 'Nome da empresa' }) +
              campo('f_inicio', 'Início', p.inicio, { type: 'date' }) +
              campo('f_entrega', 'Entrega prevista', p.entrega, { type: 'date' }) +
              area('f_observacao', 'Observação interna', p.observacao, { rows: 2, placeholder: 'O que está travando, próximo passo…' }) +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="bloco">' +
            '<legend>Financeiro <em>alimenta os KPIs, o gráfico e os alertas</em></legend>' +
            '<div class="rep-head">' +
              '<span>Competência</span><span class="num">Meta</span><span class="num">Recebido</span>' +
              '<span class="num">A receber</span><span class="num">Gastos</span><span></span>' +
            '</div>' +
            '<div class="rep" id="repLancamentos">' +
              (p.lancamentos.length ? p.lancamentos.map(linhaLancamento).join('') : '') +
            '</div>' +
            '<button type="button" class="btn-sec" id="addLancamento">+ Adicionar mês</button>' +
            '<div class="rep-totais" id="repTotais">' +
              '<span>Meta <strong>' + Fmt.moeda(t.meta) + '</strong></span>' +
              '<span>Recebido <strong>' + Fmt.moeda(t.recebido) + '</strong></span>' +
              '<span>A receber <strong>' + Fmt.moeda(t.aReceber) + '</strong></span>' +
              '<span>Gastos <strong>' + Fmt.moeda(t.gastos) + '</strong></span>' +
            '</div>' +
          '</fieldset>' +

        '</div>' +

        '<aside class="form-side">' +
          '<div class="side-sticky">' +
            '<span class="side-titulo" id="previewTitulo">Preview do card</span>' +
            '<div id="previewCard">' + previewCard(p) + '</div>' +
            '<p class="side-nota">Assim o projeto vai aparecer na home. ' +
            'Só entra na vitrine se estiver marcado como <strong>publicado</strong>.</p>' +
          '</div>' +
        '</aside>' +
      '</div>' +

      '<footer class="modal-rodape">' +
        '<span class="modal-erro" id="modalErro" role="alert"></span>' +
        '<div class="modal-botoes">' +
          '<button type="button" class="btn-sec" data-fechar>Cancelar</button>' +
          '<button type="submit" class="btn-pri">' + (novo ? 'Cadastrar projeto' : 'Salvar alterações') + '</button>' +
        '</div>' +
      '</footer>' +

    '</form>';
  }

  /* --- Leitura do formulário ----------------------------------------- */
  function coletar() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
    var c = function (id) { var e = document.getElementById(id); return e ? e.checked : false; };

    /* alt vem dos inputs, src vem do array (data URI não cabe num value legível) */
    document.querySelectorAll('#repImagens .rep-alt').forEach(function (inp) {
      var i = parseInt(inp.dataset.i, 10);
      if (imagens[i]) imagens[i].alt = inp.value.trim();
    });
    document.querySelectorAll('#repImagens .rep-src').forEach(function (inp) {
      var i = parseInt(inp.dataset.i, 10);
      if (imagens[i]) imagens[i].src = inp.value.trim();
    });

    var bullets = [].slice.call(document.querySelectorAll('#repBullets .rep-bullet'))
      .map(function (i) { return i.value.trim(); })
      .filter(Boolean);

    var lancamentos = [].slice.call(document.querySelectorAll('#repLancamentos .rep-linha')).map(function (l) {
      return {
        mes:      l.querySelector('.rep-mes').value,
        meta:     l.querySelector('.rep-meta').value,
        recebido: l.querySelector('.rep-recebido').value,
        aReceber: l.querySelector('.rep-areceber').value,
        gastos:   l.querySelector('.rep-gastos').value
      };
    }).filter(function (l) { return l.mes; });

    return {
      id:          rascunho.id,
      titulo:      g('f_titulo'),
      categoria:   g('f_categoria'),
      segmento:    g('f_segmento'),
      ordem:       g('f_ordem'),
      descricao:   g('f_descricao'),
      link:        Fmt.urlSegura(g('f_link')),
      preco:       g('f_preco'),
      publicado:   c('f_publicado'),
      destaque:    c('f_destaque'),
      novaAba:     c('f_novaAba'),
      status:      g('f_status'),
      cliente:     g('f_cliente'),
      inicio:      g('f_inicio'),
      entrega:     g('f_entrega'),
      observacao:  g('f_observacao'),
      bullets:     bullets,
      imagens:     imagens.filter(function (im) { return im.src; })
                          .map(function (im) { return { src: im.src, alt: im.alt }; }),
      lancamentos: lancamentos
    };
  }

  function atualizarPreview() {
    var atual = coletar();
    atual.imagens = imagens.filter(function (im) { return im.src; });

    var alvo = document.getElementById('previewCard');
    if (alvo) alvo.innerHTML = previewCard(atual);

    var tituloPv = document.getElementById('previewTitulo');
    if (tituloPv) tituloPv.textContent = atual.destaque ? 'Preview do card em destaque' : 'Preview do card';

    /* Bloco de bullets acompanha o checkbox de destaque */
    var bloco = document.getElementById('blocoBullets');
    var nota = document.getElementById('notaBullets');
    if (bloco) bloco.classList.toggle('is-inativo', !atual.destaque);
    if (nota) {
      nota.textContent = atual.destaque
        ? 'Estes itens aparecem sob a descrição no card em destaque da home.'
        : 'Só renderiza quando "Produto em destaque" estiver marcado.';
    }

    var soma = { meta: 0, recebido: 0, aReceber: 0, gastos: 0 };
    atual.lancamentos.forEach(function (l) {
      soma.meta     += parseFloat(l.meta)     || 0;
      soma.recebido += parseFloat(l.recebido) || 0;
      soma.aReceber += parseFloat(l.aReceber) || 0;
      soma.gastos   += parseFloat(l.gastos)   || 0;
    });
    var tot = document.getElementById('repTotais');
    if (tot) {
      tot.innerHTML =
        '<span>Meta <strong>' + Fmt.moeda(soma.meta) + '</strong></span>' +
        '<span>Recebido <strong>' + Fmt.moeda(soma.recebido) + '</strong></span>' +
        '<span>A receber <strong>' + Fmt.moeda(soma.aReceber) + '</strong></span>' +
        '<span>Gastos <strong>' + Fmt.moeda(soma.gastos) + '</strong></span>';
    }
  }

  /* --- Ciclo de vida -------------------------------------------------- */
  function fechar() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.body.classList.remove('sem-scroll');
    setTimeout(function () { if (modalEl) modalEl.innerHTML = ''; }, 200);
    imagens = [];
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  function abrirModal(projeto, novo, callbackSalvar) {
    modalEl = document.getElementById('modalRoot');
    if (!modalEl) return;

    rascunho = projeto;
    aoSalvar = callbackSalvar;
    focoAnterior = document.activeElement;
    imagens = (projeto.imagens || [])
      .filter(function (im) { return im && im.src; })
      .map(function (im) {
        var eData = /^data:/.test(im.src);
        return {
          src: im.src, alt: im.alt || '',
          origem: eData ? 'upload' : 'url',
          nome: eData ? 'imagem enviada' : '',
          bytes: eData ? Img.bytesDataUri(im.src) : 0,
          formato: eData ? (/webp/.test(im.src.slice(0, 30)) ? 'WebP' : 'JPEG') : '',
          dimensoes: ''
        };
      });

    modalEl.innerHTML =
      '<div class="modal-fundo" data-fechar></div>' +
      '<div class="modal-caixa" role="dialog" aria-modal="true" aria-labelledby="modalTitulo">' +
        '<header class="modal-topo">' +
          '<div>' +
            '<h2 id="modalTitulo">' + (novo ? 'Novo projeto' : 'Editar projeto') + '</h2>' +
            '<p>' + (novo ? 'Preencha os campos da vitrine e, se quiser, já lance o financeiro.'
                          : Fmt.esc(projeto.titulo)) + '</p>' +
          '</div>' +
          '<button type="button" class="icon-btn" data-fechar aria-label="Fechar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</header>' +
        corpoModal(projeto, novo) +
      '</div>';

    modalEl.classList.add('is-open');
    document.body.classList.add('sem-scroll');

    renderImagens();
    ligarModal();

    var primeiro = document.getElementById('f_titulo');
    if (primeiro) primeiro.focus();
  }

  function ligarModal() {
    modalEl.querySelectorAll('[data-fechar]').forEach(function (b) {
      b.addEventListener('click', fechar);
    });

    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
        fechar();
        document.removeEventListener('keydown', esc);
      }
    });

    var form = document.getElementById('formProjeto');
    var repLan = document.getElementById('repLancamentos');
    var repBul = document.getElementById('repBullets');

    form.addEventListener('input', function (e) {
      /* Thumb do repetidor acompanha o caminho digitado, sem re-render */
      if (e.target.classList.contains('rep-src')) {
        var linhaEl = e.target.closest('.rep-linha');
        var img = linhaEl && linhaEl.querySelector('.rep-thumb img');
        var val = Fmt.assetAdmin(e.target.value.trim());
        if (img) img.src = val;
        else if (linhaEl && val) {
          linhaEl.querySelector('.rep-thumb').innerHTML = '<img src="' + Fmt.esc(val) + '" alt="">';
        }
      }
      atualizarPreview();
    });
    form.addEventListener('change', atualizarPreview);

    /* --- Drag & drop de imagens --- */
    var zona = document.getElementById('dropZona');
    var file = document.getElementById('fileImagens');

    if (zona && file) {
      zona.addEventListener('click', function () { file.click(); });
      zona.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); }
      });
      file.addEventListener('change', function () {
        receberArquivos(file.files);
        file.value = '';
      });

      ['dragenter', 'dragover'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          zona.classList.add('is-sobre');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          if (ev === 'dragleave' && zona.contains(e.relatedTarget)) return;
          zona.classList.remove('is-sobre');
        });
      });
      zona.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files) receberArquivos(e.dataTransfer.files);
      });

      /* Colar print direto do Cmd+Shift+4 */
      zona.addEventListener('paste', function (e) {
        var itens = (e.clipboardData && e.clipboardData.files) || [];
        if (itens.length) { e.preventDefault(); receberArquivos(itens); }
      });
    }

    var addUrl = document.getElementById('addImagemUrl');
    if (addUrl) {
      addUrl.addEventListener('click', function () {
        imagens.push({ src: '', alt: '', origem: 'url' });
        renderImagens();
        var campos = document.querySelectorAll('#repImagens .rep-src');
        var ultimo = campos[campos.length - 1];
        if (ultimo) ultimo.focus();
      });
    }

    /* --- Reordenar imagens (a primeira é a capa) --- */
    var arrastando = null;
    var repImg = document.getElementById('repImagens');
    if (repImg) {
      repImg.addEventListener('dragstart', function (e) {
        var l = e.target.closest('.rep-linha--img');
        if (!l) return;
        arrastando = parseInt(l.dataset.img, 10);
        l.classList.add('is-arrastando');
      });
      repImg.addEventListener('dragend', function (e) {
        var l = e.target.closest('.rep-linha--img');
        if (l) l.classList.remove('is-arrastando');
        arrastando = null;
      });
      repImg.addEventListener('dragover', function (e) { e.preventDefault(); });
      repImg.addEventListener('drop', function (e) {
        e.preventDefault();
        var l = e.target.closest('.rep-linha--img');
        if (!l || arrastando === null) return;
        var destino = parseInt(l.dataset.img, 10);
        if (destino === arrastando) return;
        var mov = imagens.splice(arrastando, 1)[0];
        imagens.splice(destino, 0, mov);
        arrastando = null;
        renderImagens();
      });
    }

    document.getElementById('addBullet').addEventListener('click', function () {
      repBul.insertAdjacentHTML('beforeend', linhaBullet('', repBul.children.length));
      var campos = repBul.querySelectorAll('.rep-bullet');
      var ultimo = campos[campos.length - 1];
      if (ultimo) ultimo.focus();
    });

    document.getElementById('addLancamento').addEventListener('click', function () {
      var hoje = new Date();
      var padrao = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
      repLan.insertAdjacentHTML('beforeend',
        linhaLancamento({ mes: padrao, meta: 0, recebido: 0, aReceber: 0, gastos: 0 }, repLan.children.length));
      var campos = repLan.querySelectorAll('.rep-mes');
      var ultimo = campos[campos.length - 1];
      if (ultimo) ultimo.focus();
    });

    modalEl.addEventListener('click', function (e) {
      var rmImg = e.target.closest('[data-rem-img]');
      if (rmImg) {
        imagens.splice(parseInt(rmImg.dataset.remImg, 10), 1);
        renderImagens();
        return;
      }
      var rmBul = e.target.closest('[data-rem-bullet]');
      if (rmBul) { rmBul.closest('.rep-linha').remove(); atualizarPreview(); return; }
      var rmLan = e.target.closest('[data-rem-lanc]');
      if (rmLan) { rmLan.closest('.rep-linha').remove(); atualizarPreview(); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dados = coletar();
      var erro = document.getElementById('modalErro');

      if (!dados.titulo) {
        if (erro) erro.textContent = 'O título é obrigatório.';
        document.getElementById('f_titulo').focus();
        return;
      }
      if (erro) erro.textContent = '';

      if (aoSalvar) aoSalvar(dados);
      fechar();
    });
  }

  return {
    definirHandlers: function (h) { handlers = h; },
    renderTabela: renderTabela,
    abrirModal: abrirModal,
    fecharModal: fechar
  };
})();
