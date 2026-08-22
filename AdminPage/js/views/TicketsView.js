/* =================================================================
   HIFERA ADMIN · View · Chamados (panorama + lista)
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.TicketsView = (function () {
  'use strict';

  var Fmt = HiferaAdmin.Fmt;
  var M   = HiferaAdmin.TicketsModel;

  var handlers = {};

  /* --- Ícones -------------------------------------------------------- */
  var IC = {
    aberto:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    andamento: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 3v9l6 3"/>',
    aguardando:'<path d="M6 3h12M6 21h12M8 3v3.5a4 4 0 0 0 8 0V3M8 21v-3.5a4 4 0 0 1 8 0V21"/>',
    sla:       '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none"/><path d="M10.3 3.9L2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    ok:        '<path d="M20 6L9 17l-5-5"/>',
    estrela:   '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 16.9 6.7 19.7l1.1-6.1L3.4 9.4l6-.8z"/>',
    relogio:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    fila:      '<path d="M4 6h16M4 12h16M4 18h10"/>'
  };

  function svg(path, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.7) +
           '" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  /* --- Selos ---------------------------------------------------------- */
  function seloStatus(status) {
    var s = M.STATUS[status] || M.STATUS['Aberto'];
    return '<span class="pill pill--' + s.cor + '"><span class="pill-dot"></span>' + Fmt.esc(s.label) + '</span>';
  }

  function seloPrioridade(p) {
    var d = M.PRIORIDADES[p] || M.PRIORIDADES['Média'];
    return '<span class="prio prio--' + d.cor + '">' +
      '<span class="prio-barras" aria-hidden="true">' +
        [1, 2, 3, 4].map(function (n) {
          return '<i class="' + (n <= d.ordem ? 'is-on' : '') + '"></i>';
        }).join('') +
      '</span>' + Fmt.esc(d.label) + '</span>';
  }

  function seloTipo(tipo) {
    var t = M.TIPOS[tipo] || M.TIPOS.chamado;
    return '<span class="tipo tipo--' + t.cor + '" title="' + Fmt.esc(t.hint) + '">' + Fmt.esc(t.label) + '</span>';
  }

  function barraSla(t) {
    var s = M.sla(t);
    if (s.encerrado) {
      return '<span class="sla sla--fim' + (s.estourado ? ' is-fora' : '') + '">' +
             svg(s.estourado ? IC.sla : IC.ok, 2) + Fmt.esc(s.rotulo) + '</span>';
    }
    if (s.pausado) {
      return '<span class="sla sla--pausa">' + svg(IC.aguardando) + 'Pausado</span>';
    }
    var tom = s.estourado ? 'estourado' : (s.pct > 75 ? 'risco' : 'ok');
    return '<span class="sla sla--' + tom + '" title="' + Fmt.esc(s.rotulo) + '">' +
      '<span class="sla-barra"><i style="width:' + Math.min(100, s.pct).toFixed(0) + '%"></i></span>' +
      Fmt.esc(s.estourado ? 'Estourado' : M.formatarHoras(s.horasRestantes)) +
    '</span>';
  }

  function estrelas(n, tam) {
    var out = '<span class="estrelas' + (tam ? ' estrelas--' + tam : '') + '" aria-label="' + n + ' de 5">';
    for (var i = 1; i <= 5; i++) {
      out += '<span class="' + (i <= n ? 'is-on' : '') + '">' + svg(IC.estrela, 1.4) + '</span>';
    }
    return out + '</span>';
  }

  /* --- Panorama (KPIs) ------------------------------------------------ */
  function renderPanorama(el, p) {
    if (!el) return;

    var cards = [
      { label: 'Em aberto', valor: p.emAberto, icone: IC.aberto, tom: 'cyan',
        nota: p.abertos + ' novos · ' + p.andamento + ' em andamento · ' + p.aguardando + ' aguardando' },
      { label: 'Fora do SLA', valor: p.estourados, icone: IC.sla,
        tom: p.estourados ? 'red' : 'green', alerta: p.estourados > 0,
        nota: p.estourados
          ? 'Precisam de resposta agora'
          : 'Nenhum chamado aberto estourou o prazo' },
      { label: 'Urgentes abertos', valor: p.urgentes, icone: IC.andamento,
        tom: p.urgentes ? 'amber' : 'green',
        nota: p.urgentes ? 'SLA de 8h para solução' : 'Nada em urgência no momento' },
      { label: 'Resolvidos', valor: p.resolvidos + p.fechados, icone: IC.ok, tom: 'green',
        nota: p.resolvidos + ' resolvidos · ' + p.fechados + ' fechados' },
      { label: 'Dentro do SLA', valor: Fmt.pct(p.pctSla, 0), icone: IC.ok,
        tom: p.pctSla >= 90 ? 'green' : (p.pctSla >= 70 ? 'amber' : 'red'),
        nota: p.dentroSla + ' de ' + (p.resolvidos + p.fechados) + ' encerrados no prazo' },
      { label: 'Tempo médio de solução', valor: M.formatarHoras(p.tempoMedioResolucao), icone: IC.relogio, tom: 'indigo',
        nota: 'Da abertura até marcar como resolvido' },
      { label: 'Satisfação', valor: p.avaliados ? p.notaMedia.toFixed(1) + '/5' : '—', icone: IC.estrela, tom: 'cyan-soft',
        nota: p.avaliados ? p.avaliados + ' avaliações recebidas' : 'Ninguém avaliou ainda' },
      { label: 'Total no período', valor: p.total, icone: IC.fila, tom: 'indigo',
        nota: p.porTipo.chamado + ' chamados · ' + p.porTipo.requisicao + ' requisições' }
    ];

    el.innerHTML = '<div class="kpi-grid">' + cards.map(function (c) {
      return '<article class="kpi kpi--' + c.tom + (c.alerta ? ' kpi--pisca' : '') + '">' +
        '<div class="kpi-top">' +
          '<span class="kpi-icon">' + svg(c.icone) + '</span>' +
          '<span class="kpi-label">' + Fmt.esc(c.label) + '</span>' +
        '</div>' +
        '<strong class="kpi-valor">' + Fmt.esc(String(c.valor)) + '</strong>' +
        '<p class="kpi-nota">' + c.nota + '</p>' +
      '</article>';
    }).join('') + '</div>';
  }

  /* --- Gráfico de volume ---------------------------------------------- */
  function renderVolume(el, serie) {
    if (!el) return;

    var W = 1000, H = 260, M0 = { t: 20, r: 16, b: 36, l: 48 };
    var PW = W - M0.l - M0.r, PH = H - M0.t - M0.b;
    var max = Math.max(1, serie.reduce(function (a, b) {
      return Math.max(a, b.abertos, b.resolvidos);
    }, 0));
    var passo = max <= 4 ? 1 : Math.ceil(max / 4);
    var topo = Math.ceil(max / passo) * passo;
    var y = function (v) { return M0.t + PH - (v / topo) * PH; };
    var slot = PW / serie.length;
    var barW = Math.min(22, slot * 0.28);
    var base = M0.t + PH;

    var partes = ['<defs>' +
      '<linearGradient id="gAbertos" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#7fe9ee"/><stop offset="100%" stop-color="#2ea9cf"/></linearGradient>' +
      '<linearGradient id="gResolv" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#5ce0b0"/><stop offset="100%" stop-color="#12996f"/></linearGradient>' +
      '</defs>'];

    for (var v = 0; v <= topo; v += passo) {
      partes.push('<line class="ch-grid" x1="' + M0.l + '" y1="' + y(v).toFixed(1) +
                  '" x2="' + (W - M0.r) + '" y2="' + y(v).toFixed(1) + '"/>' +
                  '<text class="ch-ytick" x="' + (M0.l - 10) + '" y="' + (y(v) + 4).toFixed(1) +
                  '" text-anchor="end">' + v + '</text>');
    }

    serie.forEach(function (b, i) {
      var cx = M0.l + slot * i + slot / 2;
      if (b.abertos > 0) {
        partes.push('<rect class="ch-bar" x="' + (cx - barW - 2).toFixed(1) + '" y="' + y(b.abertos).toFixed(1) +
          '" width="' + barW.toFixed(1) + '" height="' + (base - y(b.abertos)).toFixed(1) +
          '" rx="3" fill="url(#gAbertos)"><title>' + b.label + ': ' + b.abertos + ' abertos</title></rect>');
      }
      if (b.resolvidos > 0) {
        partes.push('<rect class="ch-bar" x="' + (cx + 2).toFixed(1) + '" y="' + y(b.resolvidos).toFixed(1) +
          '" width="' + barW.toFixed(1) + '" height="' + (base - y(b.resolvidos)).toFixed(1) +
          '" rx="3" fill="url(#gResolv)"><title>' + b.label + ': ' + b.resolvidos + ' resolvidos</title></rect>');
      }
      partes.push('<text class="ch-xtick" x="' + cx.toFixed(1) + '" y="' + (base + 24) +
                  '" text-anchor="middle">' + b.label + '</text>');
    });

    partes.push('<line class="ch-axis" x1="' + M0.l + '" y1="' + base + '" x2="' + (W - M0.r) + '" y2="' + base + '"/>');

    el.innerHTML =
      '<div class="ch-legend ch-legend--estatica">' +
        '<span class="ch-legend-item"><span class="ch-key" style="--c:var(--cyan-ink)"></span><span>Abertos</span></span>' +
        '<span class="ch-legend-item"><span class="ch-key" style="--c:var(--green-ink)"></span><span>Resolvidos</span></span>' +
      '</div>' +
      '<div class="ch-area"><svg class="ch-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
      'preserveAspectRatio="xMidYMid meet" aria-label="Volume de chamados abertos e resolvidos por mês">' +
      partes.join('') + '</svg></div>';
  }

  /* --- Distribuição por fila ------------------------------------------- */
  function renderFilas(el, p) {
    if (!el) return;
    var chaves = Object.keys(M.FILAS);
    var max = Math.max.apply(null, chaves.map(function (k) { return p.porFila[k] || 0; }).concat([1]));

    el.innerHTML = '<ul class="filas">' + chaves.map(function (k) {
      var n = p.porFila[k] || 0;
      return '<li class="fila-linha">' +
        '<span class="fila-nome">' + Fmt.esc(M.FILAS[k].label) + '<small>' + Fmt.esc(M.FILAS[k].email) + '</small></span>' +
        '<span class="fila-barra"><i style="width:' + ((n / max) * 100).toFixed(1) + '%"></i></span>' +
        '<strong class="fila-num">' + n + '</strong>' +
      '</li>';
    }).join('') + '</ul>';
  }

  /* --- Tabela ---------------------------------------------------------- */
  function linha(t) {
    var s = M.sla(t);
    var st = M.STATUS[t.status] || {};
    var alerta = st.aberto && s.estourado;

    return '<tr data-id="' + Fmt.esc(t.id) + '"' + (alerta ? ' class="tem-alerta"' : '') + '>' +
      '<td class="cel-cod"><button type="button" class="link-cod" data-acao="abrir">' + Fmt.esc(t.id) + '</button></td>' +
      '<td class="cel-assunto">' +
        '<div class="cel-info">' +
          '<strong>' + Fmt.esc(t.titulo) + '</strong>' +
          '<small>' + seloTipo(t.tipo) + Fmt.esc(t.sistema) + ' · ' + Fmt.esc(t.modulo) + '</small>' +
        '</div>' +
      '</td>' +
      '<td class="cel-solicitante">' +
        '<div class="cel-info"><strong>' + Fmt.esc(t.solicitante) + '</strong>' +
        '<small>' + Fmt.esc(t.empresa) + '</small></div>' +
      '</td>' +
      '<td>' + Fmt.esc(M.FILAS[t.fila] ? M.FILAS[t.fila].label : t.fila) + '</td>' +
      '<td>' + seloPrioridade(t.prioridade) + '</td>' +
      '<td>' + seloStatus(t.status) + '</td>' +
      '<td class="cel-sla">' + barraSla(t) + '</td>' +
      '<td class="cel-acoes">' +
        '<button type="button" class="icon-btn" data-acao="abrir" title="Abrir chamado" aria-label="Abrir ' + Fmt.esc(t.id) + '">' +
          svg('<path d="M9 18l6-6-6-6"/>', 1.8) + '</button>' +
      '</td>' +
    '</tr>';
  }

  function renderTabela(el, lista) {
    if (!el) return;

    if (!lista.length) {
      el.innerHTML = '<div class="vazio-box"><strong>Nenhum chamado encontrado</strong>' +
                     '<p>Ajuste os filtros ou abra um chamado novo.</p></div>';
      return;
    }

    el.innerHTML = '<div class="tabela-wrap"><table class="tabela tabela--chamados">' +
      '<thead><tr>' +
        '<th>Código</th><th>Assunto</th><th>Solicitante</th><th>Fila</th>' +
        '<th>Prioridade</th><th>Status</th><th>SLA</th><th class="cel-acoes"></th>' +
      '</tr></thead><tbody>' + lista.map(linha).join('') + '</tbody></table></div>';

    el.querySelectorAll('[data-acao]').forEach(function (b) {
      b.addEventListener('click', function () {
        var fn = handlers[b.dataset.acao];
        if (fn) fn(b.closest('tr').dataset.id);
      });
    });
  }

  return {
    definirHandlers: function (h) { handlers = h; },
    renderPanorama: renderPanorama,
    renderVolume: renderVolume,
    renderFilas: renderFilas,
    renderTabela: renderTabela,
    seloStatus: seloStatus,
    seloPrioridade: seloPrioridade,
    seloTipo: seloTipo,
    barraSla: barraSla,
    estrelas: estrelas,
    svg: svg,
    IC: IC
  };
})();
