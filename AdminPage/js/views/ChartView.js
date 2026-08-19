/* =================================================================
   HIFERA ADMIN · View · Gráfico "Meta vs Realizado"
   -----------------------------------------------------------------
   SVG escrito na mão, sem biblioteca. Leitura mês a mês:
     · barra 1 = Recebido (sólido) + A Receber empilhado (hachurado)
     · barra 2 = Gastos
     · linha tracejada = Meta
     · contorno fantasma = Forecast (média dos últimos meses realizados)
     · linha cinza = mesmo mês do ano anterior
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ChartView = (function () {
  'use strict';

  var Fmt = HiferaAdmin.Fmt;

  var SERIES = [
    { chave: 'recebido', label: 'Recebido',  cor: '#5de0e6', marca: 'bloco' },
    { chave: 'aReceber', label: 'A receber', cor: '#5de0e6', marca: 'hachura' },
    { chave: 'gastos',   label: 'Gastos',    cor: '#f5a524', marca: 'bloco' },
    { chave: 'meta',     label: 'Meta',      cor: '#8ba4ff', marca: 'tracejada' },
    { chave: 'forecast', label: 'Forecast',  cor: '#5de0e6', marca: 'contorno', opcional: true },
    { chave: 'anterior', label: 'Ano ant.',  cor: '#9aa0aa', marca: 'solida',   opcional: true }
  ];

  var W = 1000, H = 380;
  var M = { top: 24, right: 20, bottom: 46, left: 68 };
  var PW = W - M.left - M.right;
  var PH = H - M.top - M.bottom;

  var estado = {
    el: null,
    serie: [],
    forecast: [],
    anterior: null,
    anoAnterior: '',
    ocultas: { anterior: true }   /* comparativo começa desligado */
  };

  function escalaBonita(maxBruto, alvoLinhas) {
    if (!(maxBruto > 0)) return { max: 100, passo: 25 };
    var bruto = maxBruto / alvoLinhas;
    var mag = Math.pow(10, Math.floor(Math.log(bruto) / Math.LN10));
    var norm = bruto / mag;
    var passoNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    var passo = passoNorm * mag;
    return { max: Math.ceil(maxBruto / passo) * passo, passo: passo };
  }

  function temForecast() {
    return estado.forecast.some(function (v) { return v > 0; });
  }
  function temAnterior() {
    return !!estado.anterior && estado.anterior.some(function (m) { return m.recebido > 0; });
  }
  function disponivel(chave) {
    if (chave === 'forecast') return temForecast();
    if (chave === 'anterior') return temAnterior();
    return true;
  }
  function visivel(chave) {
    return disponivel(chave) && !estado.ocultas[chave];
  }

  function calcularMax() {
    var max = 0;
    estado.serie.forEach(function (m, i) {
      var pilha = (visivel('recebido') ? m.recebido : 0) + (visivel('aReceber') ? m.aReceber : 0);
      max = Math.max(max, pilha);
      if (visivel('gastos')) max = Math.max(max, m.gastos);
      if (visivel('meta'))   max = Math.max(max, m.meta);
      if (visivel('forecast')) max = Math.max(max, estado.forecast[i] || 0);
      if (visivel('anterior') && estado.anterior) max = Math.max(max, estado.anterior[i].recebido);
    });
    return max;
  }

  function svg() {
    var serie = estado.serie;
    var esc = escalaBonita(calcularMax(), 4);
    var y = function (v) { return M.top + PH - (v / esc.max) * PH; };
    var slot = PW / serie.length;
    var barW = Math.min(20, slot * 0.26);
    var gap  = 4;
    var cx   = function (i) { return M.left + slot * i + slot / 2; };
    var base = M.top + PH;

    var partes = [];

    partes.push(
      '<defs>' +
        '<linearGradient id="gRecebido" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#7fe9ee"/><stop offset="100%" stop-color="#2ea9cf"/>' +
        '</linearGradient>' +
        '<linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#ffc45c"/><stop offset="100%" stop-color="#e08c0d"/>' +
        '</linearGradient>' +
        '<pattern id="pReceber" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
          '<rect width="6" height="6" fill="rgba(93,224,230,0.16)"/>' +
          '<line x1="0" y1="0" x2="0" y2="6" stroke="#5de0e6" stroke-width="2.4" stroke-opacity="0.75"/>' +
        '</pattern>' +
      '</defs>'
    );

    for (var v = 0; v <= esc.max + 0.5; v += esc.passo) {
      var gy = y(v);
      partes.push(
        '<line class="ch-grid" x1="' + M.left + '" y1="' + gy.toFixed(1) +
        '" x2="' + (W - M.right) + '" y2="' + gy.toFixed(1) + '"/>' +
        '<text class="ch-ytick" x="' + (M.left - 12) + '" y="' + (gy + 4).toFixed(1) +
        '" text-anchor="end">' + Fmt.compacto(v) + '</text>'
      );
    }

    serie.forEach(function (m, i) {
      partes.push(
        '<rect class="ch-hit" data-i="' + i + '" x="' + (M.left + slot * i).toFixed(1) +
        '" y="' + M.top + '" width="' + slot.toFixed(1) + '" height="' + PH + '"/>'
      );
      partes.push(
        '<text class="ch-xtick" x="' + cx(i).toFixed(1) + '" y="' + (M.top + PH + 26) +
        '" text-anchor="middle">' + m.label + '</text>'
      );
    });

    /* Barras */
    serie.forEach(function (m, i) {
      var xEsq = cx(i) - barW - gap / 2;
      var xDir = cx(i) + gap / 2;

      if (visivel('recebido') && m.recebido > 0) {
        partes.push(
          '<rect class="ch-bar" x="' + xEsq.toFixed(1) + '" y="' + y(m.recebido).toFixed(1) +
          '" width="' + barW.toFixed(1) + '" height="' + (base - y(m.recebido)).toFixed(1) +
          '" rx="3" fill="url(#gRecebido)"/>'
        );
      }
      if (visivel('aReceber') && m.aReceber > 0) {
        var pe = visivel('recebido') ? m.recebido : 0;
        var topo = y(pe + m.aReceber);
        partes.push(
          '<rect class="ch-bar" x="' + xEsq.toFixed(1) + '" y="' + topo.toFixed(1) +
          '" width="' + barW.toFixed(1) + '" height="' + (y(pe) - topo).toFixed(1) +
          '" rx="3" fill="url(#pReceber)" stroke="rgba(93,224,230,0.55)" stroke-width="1"/>'
        );
      }
      if (visivel('gastos') && m.gastos > 0) {
        partes.push(
          '<rect class="ch-bar" x="' + xDir.toFixed(1) + '" y="' + y(m.gastos).toFixed(1) +
          '" width="' + barW.toFixed(1) + '" height="' + (base - y(m.gastos)).toFixed(1) +
          '" rx="3" fill="url(#gGastos)"/>'
        );
      }
      /* Forecast: contorno fantasma sobre o mesmo slot da receita */
      if (visivel('forecast')) {
        var f = estado.forecast[i];
        if (f > 0) {
          partes.push(
            '<rect class="ch-forecast" x="' + (xEsq - 1.5).toFixed(1) + '" y="' + y(f).toFixed(1) +
            '" width="' + (barW + 3).toFixed(1) + '" height="' + (base - y(f)).toFixed(1) + '" rx="3"/>'
          );
        }
      }
    });

    /* Linha do ano anterior (atrás da meta, na frente das barras) */
    if (visivel('anterior') && estado.anterior) {
      var pontosAnt = estado.anterior.map(function (m, i) {
        return cx(i).toFixed(1) + ',' + y(m.recebido).toFixed(1);
      });
      partes.push('<polyline class="ch-ant-line" points="' + pontosAnt.join(' ') + '"/>');
      estado.anterior.forEach(function (m, i) {
        partes.push('<circle class="ch-ant-dot" cx="' + cx(i).toFixed(1) + '" cy="' + y(m.recebido).toFixed(1) + '" r="2.6"/>');
      });
    }

    if (visivel('meta')) {
      var pontos = serie.map(function (m, i) { return cx(i).toFixed(1) + ',' + y(m.meta).toFixed(1); });
      partes.push('<polyline class="ch-meta-line" points="' + pontos.join(' ') + '"/>');
      serie.forEach(function (m, i) {
        partes.push('<circle class="ch-meta-dot" cx="' + cx(i).toFixed(1) + '" cy="' + y(m.meta).toFixed(1) + '" r="3.4"/>');
      });
    }

    partes.push('<line class="ch-axis" x1="' + M.left + '" y1="' + base +
                '" x2="' + (W - M.right) + '" y2="' + base + '"/>');
    partes.push('<line class="ch-cursor" id="chCursor" x1="0" y1="' + M.top +
                '" x2="0" y2="' + base + '" style="opacity:0"/>');

    var total = serie.reduce(function (a, m) { return a + m.recebido; }, 0);

    return '<svg class="ch-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
           'preserveAspectRatio="xMidYMid meet" ' +
           'aria-label="Gráfico de barras por mês comparando recebido, a receber, gastos, meta' +
           (visivel('forecast') ? ', forecast' : '') +
           (visivel('anterior') ? ' e o ano anterior' : '') +
           '. Recebido acumulado de ' + Fmt.moeda(total) + '.">' +
           partes.join('') + '</svg>';
  }

  function marcaLegenda(s) {
    var classes = {
      bloco: 'ch-key',
      hachura: 'ch-key ch-key-hatch',
      tracejada: 'ch-key ch-key-line',
      contorno: 'ch-key ch-key-ghost',
      solida: 'ch-key ch-key-solid'
    };
    return '<span class="' + (classes[s.marca] || 'ch-key') + '" style="--c:' + s.cor + '"></span>';
  }

  function legenda() {
    return '<div class="ch-legend" role="group" aria-label="Séries do gráfico">' +
      SERIES.filter(function (s) { return disponivel(s.chave); }).map(function (s) {
        var off = estado.ocultas[s.chave] ? ' is-off' : '';
        var rot = s.chave === 'anterior' ? 'Recebido ' + estado.anoAnterior : s.label;
        return '<button type="button" class="ch-legend-item' + off + '" data-serie="' + s.chave +
               '" aria-pressed="' + (off ? 'false' : 'true') + '">' + marcaLegenda(s) +
               '<span>' + rot + '</span></button>';
      }).join('') +
      '</div>';
  }

  function tooltipHTML(m, i) {
    var linha = function (cor, label, valor, marca) {
      var classes = { hachura: 'tip-key tip-key-hatch', contorno: 'tip-key tip-key-ghost', solida: 'tip-key tip-key-solid' };
      return '<div class="tip-row">' +
             '<span class="' + (classes[marca] || 'tip-key') + '" style="--c:' + cor + '"></span>' +
             '<span class="tip-label">' + label + '</span>' +
             '<span class="tip-val">' + Fmt.moedaExata(valor) + '</span></div>';
    };

    var html = '<div class="tip-head">' + Fmt.competencia(m.mes) + '</div>' +
      linha('#5de0e6', 'Recebido',  m.recebido) +
      linha('#5de0e6', 'A receber', m.aReceber, 'hachura') +
      linha('#f5a524', 'Gastos',    m.gastos) +
      linha('#8ba4ff', 'Meta',      m.meta);

    if (visivel('forecast') && estado.forecast[i] > 0) {
      html += linha('#5de0e6', 'Forecast', estado.forecast[i], 'contorno');
    }

    var saldo = m.recebido - m.gastos;
    var atingiu = m.meta > 0 ? (m.recebido / m.meta) * 100 : 0;

    if (visivel('anterior') && estado.anterior) {
      var ant = estado.anterior[i].recebido;
      html += linha('#9aa0aa', estado.anoAnterior, ant, 'solida');
      var variacao = ant > 0 ? ((m.recebido - ant) / ant) * 100 : (m.recebido > 0 ? 100 : 0);
      html += '<div class="tip-foot">' +
        '<span>Saldo <strong class="' + (saldo < 0 ? 'is-neg' : 'is-pos') + '">' + Fmt.moedaExata(saldo) + '</strong></span>' +
        '<span>vs ' + estado.anoAnterior + ' <strong class="' + (variacao < 0 ? 'is-neg' : 'is-pos') + '">' +
          (variacao >= 0 ? '+' : '') + Fmt.pct(variacao, 0) + '</strong></span>' +
      '</div>';
      return html;
    }

    html += '<div class="tip-foot">' +
      '<span>Saldo <strong class="' + (saldo < 0 ? 'is-neg' : 'is-pos') + '">' + Fmt.moedaExata(saldo) + '</strong></span>' +
      '<span>Meta atingida <strong>' + Fmt.pct(atingiu, 0) + '</strong></span>' +
    '</div>';
    return html;
  }

  function ligarEventos() {
    var el = estado.el;
    var area = el.querySelector('.ch-area');
    var tip  = el.querySelector('.ch-tip');
    var svgEl = el.querySelector('.ch-svg');
    var cursor = el.querySelector('#chCursor');
    if (!area || !svgEl) return;

    el.querySelectorAll('.ch-legend-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.dataset.serie;
        estado.ocultas[k] = !estado.ocultas[k];
        desenhar();
      });
    });

    function esconder() {
      if (tip) tip.classList.remove('is-on');
      if (cursor) cursor.style.opacity = '0';
    }

    svgEl.querySelectorAll('.ch-hit').forEach(function (hit) {
      hit.addEventListener('mouseenter', function () {
        var i = parseInt(hit.dataset.i, 10);
        var m = estado.serie[i];
        if (!m || !tip) return;

        tip.innerHTML = tooltipHTML(m, i);
        tip.classList.add('is-on');

        var slot = PW / estado.serie.length;
        var cxSvg = M.left + slot * i + slot / 2;
        var razao = area.clientWidth / W;
        var px = cxSvg * razao;

        if (cursor) {
          cursor.setAttribute('x1', cxSvg);
          cursor.setAttribute('x2', cxSvg);
          cursor.style.opacity = '1';
        }

        var largura = tip.offsetWidth || 200;
        tip.style.left = Math.max(8, Math.min(px - largura / 2, area.clientWidth - largura - 8)) + 'px';
      });
    });

    area.addEventListener('mouseleave', esconder);
  }

  function desenhar() {
    estado.el.innerHTML =
      legenda() +
      '<div class="ch-area"><div class="ch-tip" role="status"></div>' + svg() + '</div>';
    ligarEventos();
  }

  /* montar(el, { serie, forecast, anterior, anoAnterior }) */
  function montar(el, dados) {
    if (!el) return;
    dados = dados || {};
    estado.el = el;
    estado.serie = dados.serie || [];
    estado.forecast = dados.forecast || estado.serie.map(function () { return null; });
    estado.anterior = dados.anterior || null;
    estado.anoAnterior = dados.anoAnterior || '';
    desenhar();
  }

  return { montar: montar };
})();
