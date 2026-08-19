/* =================================================================
   HIFERA ADMIN · Helpers de formatação (pt-BR)
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.Fmt = (function () {
  'use strict';

  var moedaFull = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2
  });
  var moedaSeca = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0
  });

  /* R$ 12.345 — usado nos KPIs e tabelas */
  function moeda(v) { return moedaSeca.format(Number(v) || 0); }

  /* R$ 12.345,67 — usado em tooltip e formulário */
  function moedaExata(v) { return moedaFull.format(Number(v) || 0); }

  /* 12k / 1,2M — usado no eixo Y do gráfico, onde espaço é curto */
  function compacto(v) {
    var n = Number(v) || 0;
    var abs = Math.abs(n);
    var enxuga = function (txt) { return txt.replace(/[.,]0$/, '').replace('.', ','); };
    if (abs >= 1000000) return enxuga((n / 1000000).toFixed(abs >= 10000000 ? 0 : 1)) + 'M';
    if (abs >= 1000)    return enxuga((n / 1000).toFixed(abs >= 10000 ? 0 : 1)) + 'k';
    return String(Math.round(n));
  }

  function pct(v, casas) {
    var n = Number(v) || 0;
    return n.toFixed(casas === undefined ? 1 : casas).replace('.', ',') + '%';
  }

  /* 2026-04-22 -> 22/04/2026 (sem passar por Date, evita fuso) */
  function data(iso) {
    if (!iso) return '—';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  /* 2026-04 -> abr/26 */
  function competencia(iso) {
    if (!iso) return '—';
    var p = String(iso).split('-');
    var m = parseInt(p[1], 10);
    var nomes = HiferaAdmin.ProjectsModel.MESES_CURTOS;
    return (nomes[m - 1] || '?') + '/' + String(p[0]).slice(2);
  }

  /* Escapa antes de jogar em innerHTML — os textos vêm de formulário */
  function esc(txt) {
    return String(txt === undefined || txt === null ? '' : txt)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Bloqueia javascript:/data: em href vindo do formulário.
     Rígido de propósito: isto é para LINKS. */
  function urlSegura(url) {
    var u = String(url || '').trim();
    if (!u) return '';
    if (/^(javascript|data|vbscript):/i.test(u)) return '';
    return u;
  }

  /* Para SRC de imagem, o data: URI é justamente o formato que o
     upload produz — liberado só para os tipos raster que geramos.
     SVG fica de fora: pode carregar script. */
  function fonteImagemSegura(src) {
    var u = String(src || '').trim();
    if (!u) return '';
    if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(u)) return u;
    return urlSegura(u);
  }

  /* O painel vive em /AdminPage/, mas os caminhos dos projetos são
     relativos à raiz do site — reapontamos para cá na hora de exibir. */
  function assetAdmin(src) {
    var u = fonteImagemSegura(src);
    if (!u) return '';
    if (/^data:/i.test(u)) return u;
    if (/^(https?:)?\/\//i.test(u) || u.charAt(0) === '/') return u;
    return '../' + u.replace(/^\.?\//, '');
  }

  return {
    assetAdmin: assetAdmin,
    fonteImagemSegura: fonteImagemSegura,
    moeda: moeda,
    moedaExata: moedaExata,
    compacto: compacto,
    pct: pct,
    data: data,
    competencia: competencia,
    esc: esc,
    urlSegura: urlSegura
  };
})();
