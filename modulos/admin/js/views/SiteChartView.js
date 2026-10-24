/* =================================================================
   HIFERA ADMIN · View · Visitas por dia (site oficial)
   -----------------------------------------------------------------
   Uma série só — visitas por dia — em barras SVG escritas na mão, nas
   mesmas classes ch-* do gráfico financeiro, então herda grade, eixo,
   cursor e tooltip do admin.css sem CSS novo.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.SiteChartView = (function () {
  'use strict';

  var Fmt = HiferaAdmin.Fmt;

  var W = 1000, H = 300;
  var M = { top: 20, right: 20, bottom: 40, left: 56 };
  var PW = W - M.left - M.right;
  var PH = H - M.top - M.bottom;

  var estado = { el: null, serie: [] };

  function escalaBonita(maxBruto, alvoLinhas) {
    if (!(maxBruto > 0)) return { max: 10, passo: 5 };
    var bruto = maxBruto / alvoLinhas;
    var mag = Math.pow(10, Math.floor(Math.log(bruto) / Math.LN10));
    var norm = bruto / mag;
    var passoNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    var passo = passoNorm * mag;
    return { max: Math.ceil(maxBruto / passo) * passo, passo: passo };
  }

  function svg() {
    var serie = estado.serie;
    var max = serie.reduce(function (m, p) { return Math.max(m, p.n); }, 0);
    var esc = escalaBonita(max, 4);
    var y = function (v) { return M.top + PH - (v / esc.max) * PH; };
    var slot = PW / Math.max(1, serie.length);
    var barW = Math.min(22, slot * 0.6);
    var cx = function (i) { return M.left + slot * i + slot / 2; };
    var base = M.top + PH;

    var partes = [];
    partes.push(
      '<defs><linearGradient id="gVisitas" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#7fe9ee"/><stop offset="100%" stop-color="#2ea9cf"/>' +
      '</linearGradient></defs>'
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

    /* rótulo de dia a cada ~5 dias para não embolar */
    var passoLabel = Math.max(1, Math.round(serie.length / 6));

    serie.forEach(function (p, i) {
      partes.push(
        '<rect class="ch-hit" data-i="' + i + '" x="' + (M.left + slot * i).toFixed(1) +
        '" y="' + M.top + '" width="' + slot.toFixed(1) + '" height="' + PH + '"/>'
      );
      if (p.n > 0) {
        partes.push(
          '<rect class="ch-bar" x="' + (cx(i) - barW / 2).toFixed(1) + '" y="' + y(p.n).toFixed(1) +
          '" width="' + barW.toFixed(1) + '" height="' + (base - y(p.n)).toFixed(1) +
          '" rx="3" fill="url(#gVisitas)"/>'
        );
      }
      if (i % passoLabel === 0) {
        partes.push(
          '<text class="ch-xtick" x="' + cx(i).toFixed(1) + '" y="' + (base + 24) +
          '" text-anchor="middle">' + p.label + '</text>'
        );
      }
    });

    partes.push('<line class="ch-axis" x1="' + M.left + '" y1="' + base +
                '" x2="' + (W - M.right) + '" y2="' + base + '"/>');
    partes.push('<line class="ch-cursor" id="chCursor" x1="0" y1="' + M.top +
                '" x2="0" y2="' + base + '" style="opacity:0"/>');

    var total = serie.reduce(function (a, p) { return a + p.n; }, 0);

    return '<svg class="ch-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
           'preserveAspectRatio="xMidYMid meet" ' +
           'aria-label="Visitas por dia. Total de ' + total + ' no período.">' +
           partes.join('') + '</svg>';
  }

  function ligarEventos() {
    var el = estado.el;
    var area = el.querySelector('.ch-area');
    var tip = el.querySelector('.ch-tip');
    var svgEl = el.querySelector('.ch-svg');
    var cursor = el.querySelector('#chCursor');
    if (!area || !svgEl) return;

    function esconder() {
      if (tip) tip.classList.remove('is-on');
      if (cursor) cursor.style.opacity = '0';
    }

    svgEl.querySelectorAll('.ch-hit').forEach(function (hit) {
      hit.addEventListener('mouseenter', function () {
        var i = parseInt(hit.dataset.i, 10);
        var p = estado.serie[i];
        if (!p || !tip) return;

        tip.innerHTML =
          '<div class="tip-head">' + Fmt.esc(Fmt.data(p.dia)) + '</div>' +
          '<div class="tip-row"><span class="tip-key" style="--c:var(--cyan-ink)"></span>' +
          '<span class="tip-label">Visitas</span>' +
          '<span class="tip-val">' + p.n + '</span></div>';
        tip.classList.add('is-on');

        var slot = PW / Math.max(1, estado.serie.length);
        var cxSvg = M.left + slot * i + slot / 2;
        var razao = area.clientWidth / W;
        var px = cxSvg * razao;
        if (cursor) {
          cursor.setAttribute('x1', cxSvg);
          cursor.setAttribute('x2', cxSvg);
          cursor.style.opacity = '1';
        }
        var largura = tip.offsetWidth || 160;
        tip.style.left = Math.max(8, Math.min(px - largura / 2, area.clientWidth - largura - 8)) + 'px';
      });
    });

    area.addEventListener('mouseleave', esconder);
  }

  function montar(el, serie) {
    if (!el) return;
    estado.el = el;
    estado.serie = serie || [];
    el.innerHTML = '<div class="ch-area"><div class="ch-tip" role="status"></div>' + svg() + '</div>';
    ligarEventos();
  }

  return { montar: montar };
})();
