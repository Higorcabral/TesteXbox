/* =================================================================
   HIFERA ADMIN · View · Gestão de UM projeto
   -----------------------------------------------------------------
   A tela da lista responde "como está a carteira?". Esta responde
   "como está ESTE projeto, e o que eu faço agora?".

   Cada bloco renderiza sozinho num container da projeto.html; o
   controller decide quando redesenhar o quê. Nenhuma escrita acontece
   aqui — a view emite intenção pelos handlers e o controller grava.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ProjectDetailView = (function () {
  'use strict';

  var Fmt    = HiferaAdmin.Fmt;
  var Model  = HiferaAdmin.ProjectsModel;
  var STATUS = Model.STATUS;
  var MARCO  = Model.MARCO_STATUS;

  var handlers = {};

  function definirHandlers(h) { handlers = h || {}; }

  function chamar(nome, a, b) {
    if (typeof handlers[nome] === 'function') handlers[nome](a, b);
  }

  function svg(path, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
           (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  var ICONE = {
    voltar:   '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    editar:   '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    abrir:    '<path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    mais:     '<path d="M12 5v14M5 12h14"/>',
    menos:    '<path d="M5 12h14"/>',
    check:    '<path d="M20 6L9 17l-5-5"/>',
    relogio:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    alerta:   '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none"/><path d="M10.3 3.9L2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    pessoa:   '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
    bandeira: '<path d="M4 22V4"/><path d="M4 5h11l-1.6 3.5L15 12H4"/>',
    dinheiro: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    nota:     '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/>',
    lixo:     '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'
  };

  /* ================================================================
     1. FICHA — quem é o projeto, em uma tela
     ================================================================ */
  function pill(status) {
    var s = STATUS[status] || STATUS.andamento;
    return '<span class="pill pill--' + s.cor + '"><span class="pill-dot"></span>' + s.label + '</span>';
  }

  var TOM_SAUDE = { ok: 'green', atencao: 'amber', risco: 'red' };

  function seloSaude(s) {
    return '<span class="saude saude--' + TOM_SAUDE[s.chave] + '" ' +
             'title="' + Fmt.esc(s.motivos.join(' · ') || 'Sem pendência aberta') + '">' +
             '<span class="saude-dot"></span>' + Fmt.esc(s.label) +
           '</span>';
  }

  function metadado(rotulo, valor, extra) {
    return '<div class="meta-item">' +
             '<span class="meta-rot">' + rotulo + '</span>' +
             '<strong class="meta-val">' + valor + '</strong>' +
             (extra ? '<small class="meta-extra">' + extra + '</small>' : '') +
           '</div>';
  }

  function prazoTexto(p) {
    if (!p.entrega) return { valor: '<span class="vazio">sem prazo</span>', extra: '' };
    var dias = Model.diasEntre(Model.hoje(), p.entrega);
    if (p.status === 'finalizado') return { valor: Fmt.data(p.entrega), extra: 'entrega concluída' };
    if (dias < 0)  return { valor: Fmt.data(p.entrega), extra: '<span class="is-neg">' + Math.abs(dias) + ' dias de atraso</span>' };
    if (dias === 0) return { valor: Fmt.data(p.entrega), extra: 'é hoje' };
    return { valor: Fmt.data(p.entrega), extra: 'faltam ' + dias + ' dias' };
  }

  function renderFicha(el, p) {
    if (!el) return;
    var pg     = Model.progresso(p);
    var s      = Model.saude(p);
    var prazo  = prazoTexto(p);
    var capa   = p.imagens[0];
    var t      = Model.totaisProjeto(p);
    var contratado = t.recebido + t.aReceber;

    var proximo = pg.proximo
      ? '<span class="ficha-prox">Próximo: <strong>' + Fmt.esc(pg.proximo.titulo) + '</strong>' +
        (pg.proximo.data ? ' · ' + Fmt.data(pg.proximo.data) : '') + '</span>'
      : '<span class="ficha-prox vazio">Nenhum marco em aberto</span>';

    el.innerHTML =
      '<article class="ficha' + (capa ? ' ficha--com-capa' : '') + '">' +
        (capa
          ? '<div class="ficha-capa"><img src="' + Fmt.esc(Fmt.assetAdmin(capa.src)) + '" alt="" ' +
            'onerror="this.closest(\'.ficha-capa\').remove()"></div>'
          : '') +

        '<div class="ficha-corpo">' +
          '<div class="ficha-topo">' +
            '<div class="ficha-id">' +
              '<span class="ficha-selos">' + pill(p.status) + seloSaude(s) +
                (p.publicado
                  ? '<span class="selo-mini selo-mini--on">Na vitrine</span>'
                  : '<span class="selo-mini">Fora da vitrine</span>') +
              '</span>' +
              '<h2>' + Fmt.esc(p.titulo) + '</h2>' +
              '<p class="ficha-sub">' +
                (p.cliente ? '<strong>' + Fmt.esc(p.cliente) + '</strong> · ' : '') +
                Fmt.esc(p.categoria) + (p.segmento ? ' · ' + Fmt.esc(p.segmento) : '') +
              '</p>' +
              (p.descricao ? '<p class="ficha-desc">' + Fmt.esc(p.descricao) + '</p>' : '') +
            '</div>' +

            '<div class="ficha-acoes">' +
              '<button type="button" class="btn-pri" data-det="editar">' +
                svg(ICONE.editar) + 'Editar ficha</button>' +
              (p.link
                ? '<button type="button" class="btn-sec" data-det="abrir">' +
                  svg(ICONE.abrir) + 'Abrir demo</button>'
                : '') +
              '<button type="button" class="btn-sec" data-det="publicar">' +
                (p.publicado ? 'Tirar da vitrine' : 'Publicar na vitrine') + '</button>' +
            '</div>' +
          '</div>' +

          '<div class="ficha-progresso">' +
            '<div class="prog-cab">' +
              '<strong>' + pg.pct + '% concluído</strong>' +
              '<span>' + (pg.base === 'marcos'
                ? pg.concluidos + ' de ' + pg.total + ' marcos entregues' +
                  (pg.emExecucao ? ' · ' + pg.emExecucao + ' em execução' : '')
                : 'sem marcos cadastrados — régua pelo financeiro recebido') + '</span>' +
            '</div>' +
            '<div class="prog-barra"><span style="width:' + pg.pct + '%"></span></div>' +
            proximo +
          '</div>' +

          '<div class="ficha-meta">' +
            metadado('Início',     p.inicio ? Fmt.data(p.inicio) : '<span class="vazio">—</span>',
                     p.inicio ? Model.diasEntre(p.inicio, Model.hoje()) + ' dias de projeto' : '') +
            metadado('Entrega',    prazo.valor, prazo.extra) +
            metadado('Contratado', Fmt.moeda(contratado),
                     contratado > 0 ? Fmt.pct((t.recebido / contratado) * 100, 0) + ' já recebido' : 'sem lançamentos') +
            metadado('Contato',
                     p.contato.nome ? Fmt.esc(p.contato.nome) : '<span class="vazio">não informado</span>',
                     p.contato.papel ? Fmt.esc(p.contato.papel) : '') +
          '</div>' +

          /* Motivo que já é alerta sai daqui: o banner logo abaixo conta
             a mesma coisa com mais detalhe, e repetir vira ruído. */
          (function () {
            var rotulosAlerta = Model.alertasProjeto(p).map(function (a) { return a.label; });
            var extras = s.motivos.filter(function (m) { return rotulosAlerta.indexOf(m) < 0; });
            return extras.length
              ? '<p class="ficha-motivos">' + svg(ICONE.alerta, 1.7) +
                '<span>' + extras.map(Fmt.esc).join(' · ') + '</span></p>'
              : '';
          })() +
        '</div>' +
      '</article>';

    el.querySelectorAll('[data-det]').forEach(function (b) {
      b.addEventListener('click', function () { chamar(b.dataset.det); });
    });
  }

  /* ================================================================
     2. KPIs do projeto — dinheiro deste contrato, não da carteira
     ================================================================ */
  function kpi(c) {
    return '<article class="kpi kpi--' + c.tom + (c.alerta ? ' kpi--pisca' : '') + '">' +
             '<div class="kpi-top">' +
               '<span class="kpi-icon">' + svg(c.icone, 1.7) + '</span>' +
               '<span class="kpi-label">' + c.label + '</span>' +
             '</div>' +
             '<div class="kpi-valor">' + c.valor + '</div>' +
             (c.progresso !== undefined
               ? '<div class="kpi-bar"><span style="width:' +
                 Math.max(0, Math.min(c.progresso, 100)).toFixed(1) + '%"></span></div>'
               : '') +
             '<div class="kpi-nota">' + c.nota + '</div>' +
           '</article>';
  }

  function renderKpis(el, p) {
    if (!el) return;
    var t = Model.totaisProjeto(p);
    var contratado = t.recebido + t.aReceber;
    var resultado  = t.recebido - t.gastos;
    var margem     = t.recebido > 0 ? (resultado / t.recebido) * 100 : 0;

    var vencido = Model.alertasProjeto(p)
      .filter(function (a) { return a.tipo === 'parcela-vencida'; })
      .reduce(function (s, a) { return s + a.valor; }, 0);

    el.innerHTML = [
      {
        label: 'Contratado', icone: ICONE.bandeira, tom: 'indigo',
        valor: Fmt.moeda(contratado), progresso: contratado > 0 ? (t.recebido / contratado) * 100 : 0,
        nota: contratado > 0
          ? Fmt.moeda(t.recebido) + ' recebidos de ' + Fmt.moeda(contratado)
          : 'Nenhum lançamento neste projeto'
      },
      {
        label: 'Recebido', icone: ICONE.check, tom: 'cyan',
        valor: Fmt.moeda(t.recebido),
        nota: t.meta > 0
          ? Fmt.pct((t.recebido / t.meta) * 100, 0) + ' da meta de ' + Fmt.moeda(t.meta)
          : 'Sem meta cadastrada'
      },
      {
        label: 'A receber', icone: ICONE.dinheiro, tom: vencido > 0 ? 'red' : 'cyan-soft',
        valor: Fmt.moeda(t.aReceber), alerta: vencido > 0,
        nota: vencido > 0
          ? '<strong class="kpi-flag">' + Fmt.moeda(vencido) + ' vencido</strong> · cobre antes da próxima entrega'
          : (t.aReceber > 0 ? 'Tudo dentro do prazo combinado' : 'Nada em aberto')
      },
      {
        label: 'Gastos', icone: ICONE.relogio, tom: 'amber',
        valor: Fmt.moeda(t.gastos),
        nota: t.recebido > 0
          ? Fmt.pct((t.gastos / t.recebido) * 100, 0) + ' do que entrou'
          : 'Custo antes da primeira receita'
      },
      {
        label: 'Resultado', icone: ICONE.nota, tom: resultado < 0 ? 'red' : 'green',
        valor: Fmt.moeda(resultado),
        nota: 'Margem de ' + Fmt.pct(margem, 0) + ' sobre o recebido'
      }
    ].map(kpi).join('');
  }

  /* ================================================================
     3. ALERTAS do projeto
     ================================================================ */
  function renderAlertas(el, p) {
    if (!el) return;
    var lista = Model.alertasProjeto(p);
    if (!lista.length) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML =
      '<div class="banner banner--alerta">' +
        svg(ICONE.alerta) +
        '<div class="banner-txt">' +
          '<strong>' + lista.length + (lista.length === 1 ? ' alerta aberto' : ' alertas abertos') +
            ' neste projeto</strong>' +
          '<span>' + lista.map(function (a) {
            return Fmt.esc(a.label) + ' — ' + Fmt.esc(a.detalhe);
          }).join(' · ') + '</span>' +
        '</div>' +
      '</div>';
  }

  /* ================================================================
     4. MARCOS — o roteiro de entrega
     ================================================================ */
  function linhaMarco(m) {
    var atrasado = m.status !== 'concluido' && m.data && m.data < Model.hoje();
    var opcoes = Object.keys(MARCO).map(function (k) {
      return '<option value="' + k + '"' + (k === m.status ? ' selected' : '') + '>' +
             MARCO[k].label + '</option>';
    }).join('');

    return '<li class="marco marco--' + MARCO[m.status].cor +
             (atrasado ? ' is-atrasado' : '') + '" data-marco="' + Fmt.esc(m.id) + '">' +
        '<span class="marco-eixo" aria-hidden="true"><i></i></span>' +
        '<div class="marco-corpo">' +
          '<div class="marco-cab">' +
            '<strong>' + Fmt.esc(m.titulo) + '</strong>' +
            '<span class="marco-data">' +
              (m.data ? Fmt.data(m.data) : '<span class="vazio">sem data</span>') +
              (atrasado ? '<em class="is-neg"> · vencido</em>' : '') +
            '</span>' +
          '</div>' +
          (m.nota ? '<p class="marco-nota">' + Fmt.esc(m.nota) + '</p>' : '') +
        '</div>' +
        '<div class="marco-acoes">' +
          '<label class="sel-mini"><span class="sr">Status do marco</span>' +
            '<select data-marco-status>' + opcoes + '</select></label>' +
          '<button type="button" class="icon-btn" data-marco-editar aria-label="Editar marco" title="Editar">' +
            svg(ICONE.editar) + '</button>' +
          '<button type="button" class="icon-btn is-danger" data-marco-remover aria-label="Remover marco" title="Remover">' +
            svg(ICONE.lixo) + '</button>' +
        '</div>' +
      '</li>';
  }

  function renderMarcos(el, p) {
    if (!el) return;
    var pg = Model.progresso(p);

    el.innerHTML =
      '<div class="card">' +
        '<div class="card-head card-head--acoes">' +
          '<div>' +
            '<h2>Roteiro de entrega</h2>' +
            '<p>Os marcos definem o percentual de conclusão do projeto. Sem eles, a régua vira o financeiro.</p>' +
          '</div>' +
          '<div class="acoes-topo">' +
            (pg.total
              ? '<span class="contador">' + pg.concluidos + ' de ' + pg.total + ' concluídos</span>'
              : '') +
            '<button type="button" class="btn-pri" data-det="novoMarco">' +
              svg(ICONE.mais, 2) + 'Novo marco</button>' +
          '</div>' +
        '</div>' +
        (p.marcos.length
          ? '<ol class="marcos">' + p.marcos.map(linhaMarco).join('') + '</ol>'
          : '<div class="vazio-box">' +
              '<strong>Nenhum marco cadastrado</strong>' +
              '<p>Quebre a entrega em blocos que o cliente reconheça. É o que vira o aceite parcial.</p>' +
            '</div>') +
      '</div>';

    el.querySelectorAll('[data-det]').forEach(function (b) {
      b.addEventListener('click', function () { chamar(b.dataset.det); });
    });

    el.querySelectorAll('.marco').forEach(function (li) {
      var id = li.dataset.marco;
      var sel = li.querySelector('[data-marco-status]');
      if (sel) sel.addEventListener('change', function () { chamar('statusMarco', id, sel.value); });
      var ed = li.querySelector('[data-marco-editar]');
      if (ed) ed.addEventListener('click', function () { chamar('editarMarco', id); });
      var rm = li.querySelector('[data-marco-remover]');
      if (rm) rm.addEventListener('click', function () { chamar('removerMarco', id); });
    });
  }

  /* ================================================================
     5. LANÇAMENTOS — livro-caixa do projeto, editável na tela
     ================================================================ */
  /* Cada campo vem embrulhado num <label> com o nome da coluna. Em tela
     larga o nome fica escondido (o cabeçalho da grade já diz), e em tela
     estreita — onde o cabeçalho some e as linhas quebram — ele aparece.
     Sem isso, no celular sobram quatro números sem legenda nenhuma. */
  function celula(rotulo, classe, attrs) {
    return '<label class="lanc-cel lanc-cel--' + (classe === 'mes' ? 'mes' : 'num') + '">' +
             '<span>' + rotulo + '</span><input ' + attrs + '>' +
           '</label>';
  }

  function campoNum(rotulo, classe, valor) {
    return celula(rotulo, 'num',
      'type="number" class="rep-in rep-num ' + classe + '" value="' + valor +
      '" step="0.01" min="0" aria-label="' + rotulo + '"');
  }

  function linhaLanc(l, i) {
    var vencido = l.aReceber > 0 && l.mes && l.mes < Model.mesAtual();
    return '<div class="rep-linha rep-linha--fin' + (vencido ? ' is-vencida' : '') + '" data-lanc="' + i + '">' +
      celula('Competência', 'mes',
        'type="month" class="rep-in rep-mes" value="' + Fmt.esc(l.mes) + '" aria-label="Competência"') +
      campoNum('Meta',      'rep-meta',     l.meta) +
      campoNum('Recebido',  'rep-recebido', l.recebido) +
      campoNum('A receber', 'rep-areceber', l.aReceber) +
      campoNum('Gastos',    'rep-gastos',   l.gastos) +
      '<button type="button" class="icon-btn is-danger" data-rem-lanc="' + i + '" aria-label="Remover lançamento">' +
        svg(ICONE.menos) + '</button>' +
    '</div>';
  }

  /* Lê a tabela do DOM. É a fonte de verdade enquanto o usuário edita —
     o model só é tocado quando ele clica em salvar. */
  function coletarLancamentos(el) {
    return [].slice.call(el.querySelectorAll('.rep-linha--fin')).map(function (linha) {
      var v = function (cls) {
        var e = linha.querySelector('.' + cls);
        return e ? e.value : '';
      };
      return {
        mes:      v('rep-mes'),
        meta:     parseFloat(v('rep-meta'))     || 0,
        recebido: parseFloat(v('rep-recebido')) || 0,
        aReceber: parseFloat(v('rep-areceber')) || 0,
        gastos:   parseFloat(v('rep-gastos'))   || 0
      };
    }).filter(function (l) { return l.mes; });
  }

  function totaisDaTela(el) {
    return coletarLancamentos(el).reduce(function (a, l) {
      a.meta += l.meta; a.recebido += l.recebido;
      a.aReceber += l.aReceber; a.gastos += l.gastos;
      return a;
    }, { meta: 0, recebido: 0, aReceber: 0, gastos: 0 });
  }

  function pintarTotais(el) {
    var alvo = el.querySelector('#detTotais');
    if (!alvo) return;
    var t = totaisDaTela(el);
    alvo.innerHTML =
      '<span>Meta <strong>' + Fmt.moeda(t.meta) + '</strong></span>' +
      '<span>Recebido <strong>' + Fmt.moeda(t.recebido) + '</strong></span>' +
      '<span>A receber <strong>' + Fmt.moeda(t.aReceber) + '</strong></span>' +
      '<span>Gastos <strong>' + Fmt.moeda(t.gastos) + '</strong></span>' +
      '<span>Resultado <strong class="' + (t.recebido - t.gastos < 0 ? 'is-neg' : 'is-pos') + '">' +
        Fmt.moeda(t.recebido - t.gastos) + '</strong></span>';
  }

  function marcarSujo(el, sujo) {
    var btn = el.querySelector('#detSalvarLanc');
    if (!btn) return;
    btn.disabled = !sujo;
    btn.classList.toggle('is-sujo', !!sujo);
    var aviso = el.querySelector('#detAvisoLanc');
    if (aviso) aviso.textContent = sujo ? 'Há alterações não salvas.' : '';
  }

  function renderLancamentos(el, p) {
    if (!el) return;

    el.innerHTML =
      '<div class="card">' +
        '<div class="card-head card-head--acoes">' +
          '<div>' +
            '<h2>Lançamentos do projeto</h2>' +
            '<p>Uma linha por competência. Tudo acima — KPIs, gráfico e alertas — é derivado daqui.</p>' +
          '</div>' +
          '<div class="acoes-topo">' +
            '<span class="aviso-sujo" id="detAvisoLanc" role="status"></span>' +
            '<button type="button" class="btn-sec" data-det="addLanc">' + svg(ICONE.mais, 2) + 'Nova competência</button>' +
            '<button type="button" class="btn-pri" id="detSalvarLanc" disabled>Salvar lançamentos</button>' +
          '</div>' +
        '</div>' +

        '<div class="rep rep--fin" id="detRepLanc">' +
          /* .rep-head é o mesmo cabeçalho de grade usado no modal de
             cadastro — reusado aqui de propósito, para as duas telas
             alinharem as colunas exatamente igual. */
          '<div class="rep-head">' +
            '<span>Competência</span><span>Meta</span><span>Recebido</span>' +
            '<span>A receber</span><span>Gastos</span><span></span>' +
          '</div>' +
          (p.lancamentos.length
            ? p.lancamentos.map(linhaLanc).join('')
            : '<p class="rep-vazio">Nenhuma competência lançada ainda.</p>') +
        '</div>' +

        '<div class="rep-totais" id="detTotais"></div>' +
      '</div>';

    pintarTotais(el);
    marcarSujo(el, false);

    var rep = el.querySelector('#detRepLanc');

    el.querySelectorAll('[data-det]').forEach(function (b) {
      b.addEventListener('click', function () { chamar(b.dataset.det); });
    });

    rep.addEventListener('input', function () {
      pintarTotais(el);
      marcarSujo(el, true);
    });

    rep.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rem-lanc]');
      if (!btn) return;
      btn.closest('.rep-linha').remove();
      if (!rep.querySelector('.rep-linha--fin')) {
        rep.insertAdjacentHTML('beforeend', '<p class="rep-vazio">Nenhuma competência lançada ainda.</p>');
      }
      pintarTotais(el);
      marcarSujo(el, true);
    });

    var salvar = el.querySelector('#detSalvarLanc');
    if (salvar) {
      salvar.addEventListener('click', function () {
        chamar('salvarLancamentos', coletarLancamentos(el));
      });
    }
  }

  /* Acrescenta uma competência sem redesenhar (não perde o que está
     digitado nas outras linhas). */
  function adicionarLancamento(el, mes) {
    var rep = el.querySelector('#detRepLanc');
    if (!rep) return;
    var vazio = rep.querySelector('.rep-vazio');
    if (vazio) vazio.remove();
    var i = rep.querySelectorAll('.rep-linha--fin').length;
    rep.insertAdjacentHTML('beforeend', linhaLanc(
      { mes: mes, meta: 0, recebido: 0, aReceber: 0, gastos: 0 }, i));
    pintarTotais(el);
    marcarSujo(el, true);
    var nova = rep.querySelector('.rep-linha--fin:last-child .rep-mes');
    if (nova) nova.focus();
  }

  /* ================================================================
     6. DIÁRIO — o que foi combinado, quando
     ================================================================ */
  function renderNotas(el, p) {
    if (!el) return;

    el.innerHTML =
      '<div class="card">' +
        '<div class="card-head">' +
          '<div>' +
            '<h2>Diário do projeto</h2>' +
            '<p>Decisão combinada, risco levantado, promessa feita. O que você vai querer reler antes da próxima reunião.</p>' +
          '</div>' +
        '</div>' +

        '<form class="nota-form" id="formNota">' +
          '<label class="fld fld--full">' +
            '<span class="sr">Nova anotação</span>' +
            '<textarea id="detNotaTexto" rows="3" ' +
              'placeholder="Ex.: cliente pediu para adiar o treinamento para depois do fechamento contábil."></textarea>' +
          '</label>' +
          '<div class="nota-form-rodape">' +
            '<span class="nota-dica">Fica só neste navegador, junto com o resto do painel.</span>' +
            '<button type="submit" class="btn-pri">Registrar</button>' +
          '</div>' +
        '</form>' +

        (p.notas.length
          ? '<ul class="notas">' + p.notas.map(function (n) {
              return '<li class="nota" data-nota="' + Fmt.esc(n.id) + '">' +
                '<div class="nota-cab">' +
                  '<strong>' + (n.autor ? Fmt.esc(n.autor) : 'Sem autor') + '</strong>' +
                  '<span>' + Fmt.data(n.data) + '</span>' +
                  '<button type="button" class="icon-btn is-danger" data-nota-remover ' +
                    'aria-label="Remover anotação">' + svg(ICONE.lixo) + '</button>' +
                '</div>' +
                '<p>' + Fmt.esc(n.texto) + '</p>' +
              '</li>';
            }).join('') + '</ul>'
          : '<p class="rep-vazio">Nenhuma anotação ainda.</p>') +
      '</div>';

    var form = el.querySelector('#formNota');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var campo = el.querySelector('#detNotaTexto');
      var texto = campo.value.trim();
      if (!texto) { campo.focus(); return; }
      chamar('novaNota', texto);
    });

    el.querySelectorAll('.nota').forEach(function (li) {
      var rm = li.querySelector('[data-nota-remover]');
      if (rm) rm.addEventListener('click', function () { chamar('removerNota', li.dataset.nota); });
    });
  }

  /* ================================================================
     7. CLIENTE — ficha de contato do projeto
     ================================================================ */
  function renderCliente(el, p) {
    if (!el) return;

    el.innerHTML =
      '<div class="card">' +
        '<div class="card-head">' +
          '<div>' +
            '<h2>Cliente e contato</h2>' +
            '<p>O mínimo para saber com quem falar. Contrato, documentos e dados pessoais ficam fora daqui — ' +
              'este painel guarda tudo em texto puro no navegador.</p>' +
          '</div>' +
        '</div>' +

        '<form class="grid-flds grid-flds--cliente" id="formCliente">' +
          '<label class="fld"><span class="fld-label">Cliente</span>' +
            '<input type="text" id="detCliente" value="' + Fmt.esc(p.cliente) + '" placeholder="Razão social ou nome fantasia"></label>' +
          '<label class="fld"><span class="fld-label">Pessoa de contato</span>' +
            '<input type="text" id="detContatoNome" value="' + Fmt.esc(p.contato.nome) + '" placeholder="Quem decide do lado do cliente"></label>' +
          '<label class="fld"><span class="fld-label">Papel<em>área ou cargo</em></span>' +
            '<input type="text" id="detContatoPapel" value="' + Fmt.esc(p.contato.papel) + '" placeholder="Coordenação de Operações"></label>' +
          '<label class="fld"><span class="fld-label">E-mail de contato</span>' +
            '<input type="email" id="detContatoEmail" value="' + Fmt.esc(p.contato.email) + '" placeholder="contato@empresa.com"></label>' +
          '<label class="fld fld--full"><span class="fld-label">Observação interna<em>não aparece em lugar nenhum público</em></span>' +
            '<textarea id="detObservacao" rows="3" placeholder="O que você precisa lembrar sobre este cliente.">' +
            Fmt.esc(p.observacao) + '</textarea></label>' +
          '<div class="fld fld--full nota-form-rodape">' +
            '<span class="nota-dica" id="detAvisoCliente" role="status"></span>' +
            '<button type="submit" class="btn-pri">Salvar ficha do cliente</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    var form = el.querySelector('#formCliente');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return (el.querySelector('#' + id) || {}).value || ''; };
      chamar('salvarCliente', {
        cliente: v('detCliente').trim(),
        observacao: v('detObservacao').trim(),
        contato: {
          nome:  v('detContatoNome').trim(),
          papel: v('detContatoPapel').trim(),
          email: v('detContatoEmail').trim()
        }
      });
    });
  }

  /* ================================================================
     8. MODAL do marco
     ================================================================ */
  var modalEl = null;
  var focoAnterior = null;

  function fecharModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.body.classList.remove('sem-scroll');
    setTimeout(function () { if (modalEl) modalEl.innerHTML = ''; }, 200);
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  function abrirModalMarco(marco, novo, aoSalvar) {
    modalEl = document.getElementById('modalRoot');
    if (!modalEl) return;
    focoAnterior = document.activeElement;

    var opcoes = Object.keys(MARCO).map(function (k) {
      return '<option value="' + k + '"' + (k === marco.status ? ' selected' : '') + '>' +
             MARCO[k].label + '</option>';
    }).join('');

    modalEl.innerHTML =
      '<div class="modal-fundo" data-fechar></div>' +
      '<div class="modal-caixa modal-caixa--curta" role="dialog" aria-modal="true" aria-labelledby="tMarco">' +
        '<header class="modal-topo">' +
          '<div>' +
            '<h2 id="tMarco">' + (novo ? 'Novo marco' : 'Editar marco') + '</h2>' +
            '<p>Um bloco de entrega que o cliente reconhece como pronto.</p>' +
          '</div>' +
          '<button type="button" class="icon-btn" data-fechar aria-label="Fechar">' +
            svg('<path d="M18 6L6 18M6 6l12 12"/>') + '</button>' +
        '</header>' +

        '<form class="modal-form" id="formMarco" novalidate>' +
          '<fieldset class="bloco">' +
            '<div class="grid-flds">' +
              '<label class="fld fld--full"><span class="fld-label">Título</span>' +
                '<input type="text" id="mkTitulo" value="' + Fmt.esc(marco.titulo) + '" ' +
                'placeholder="Ex.: Importação da base histórica" required></label>' +
              '<label class="fld"><span class="fld-label">Data prevista</span>' +
                '<input type="date" id="mkData" value="' + Fmt.esc(marco.data) + '"></label>' +
              '<label class="fld"><span class="fld-label">Status</span>' +
                '<select id="mkStatus">' + opcoes + '</select></label>' +
              '<label class="fld fld--full"><span class="fld-label">Nota<em>opcional</em></span>' +
                '<textarea id="mkNota" rows="3" placeholder="Dependência, combinado, quem aprova.">' +
                Fmt.esc(marco.nota) + '</textarea></label>' +
            '</div>' +
          '</fieldset>' +

          '<footer class="modal-rodape">' +
            '<span class="modal-erro" id="mkErro" role="alert"></span>' +
            '<div class="modal-botoes">' +
              '<button type="button" class="btn-sec" data-fechar>Cancelar</button>' +
              '<button type="submit" class="btn-pri">' + (novo ? 'Adicionar marco' : 'Salvar marco') + '</button>' +
            '</div>' +
          '</footer>' +
        '</form>' +
      '</div>';

    modalEl.classList.add('is-open');
    document.body.classList.add('sem-scroll');

    modalEl.querySelectorAll('[data-fechar]').forEach(function (b) {
      b.addEventListener('click', fecharModal);
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
        fecharModal();
        document.removeEventListener('keydown', esc);
      }
    });

    modalEl.querySelector('#formMarco').addEventListener('submit', function (e) {
      e.preventDefault();
      var titulo = modalEl.querySelector('#mkTitulo').value.trim();
      if (!titulo) {
        modalEl.querySelector('#mkErro').textContent = 'O marco precisa de um título.';
        modalEl.querySelector('#mkTitulo').focus();
        return;
      }
      aoSalvar({
        id:     marco.id,
        titulo: titulo,
        data:   modalEl.querySelector('#mkData').value,
        status: modalEl.querySelector('#mkStatus').value,
        nota:   modalEl.querySelector('#mkNota').value.trim()
      });
      fecharModal();
    });

    var primeiro = modalEl.querySelector('#mkTitulo');
    if (primeiro) primeiro.focus();
  }

  return {
    definirHandlers: definirHandlers,
    renderFicha: renderFicha,
    renderKpis: renderKpis,
    renderAlertas: renderAlertas,
    renderMarcos: renderMarcos,
    renderLancamentos: renderLancamentos,
    renderNotas: renderNotas,
    renderCliente: renderCliente,
    adicionarLancamento: adicionarLancamento,
    coletarLancamentos: coletarLancamentos,
    abrirModalMarco: abrirModalMarco
  };
})();
