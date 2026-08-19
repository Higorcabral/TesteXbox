/* =================================================================
   HIFERA ADMIN · Model · Imagens
   Recebe o arquivo solto do drag & drop, redimensiona no canvas,
   converte pra WebP e devolve data URI. Nada sai da máquina.

   O localStorage tem ~5 MB por origem, então o redimensionamento
   não é vaidade: é o que impede o painel de estourar a cota.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ImageModel = (function () {
  'use strict';

  var LARGURA_MAX  = 1200;
  var QUALIDADE    = 0.78;
  var ENTRADA_MAX  = 12 * 1024 * 1024;   /* 12 MB de arquivo bruto */
  var COTA_ALVO    = 4.2 * 1024 * 1024;  /* margem sob os ~5 MB do storage */

  var suporteWebp = null;
  function suportaWebp() {
    if (suporteWebp !== null) return suporteWebp;
    try {
      var c = document.createElement('canvas');
      c.width = c.height = 1;
      suporteWebp = c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) {
      suporteWebp = false;
    }
    return suporteWebp;
  }

  function formatarBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* data URI base64 → tamanho real em bytes */
  function bytesDataUri(uri) {
    var i = String(uri || '').indexOf(',');
    if (i < 0) return 0;
    var b64 = uri.slice(i + 1);
    var pad = (b64.slice(-2).match(/=/g) || []).length;
    return Math.floor(b64.length * 3 / 4) - pad;
  }

  function usoStorage() {
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        total += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
    } catch (e) { return { bytes: 0, pct: 0, cota: COTA_ALVO }; }
    return { bytes: total, pct: Math.min(100, (total / COTA_ALVO) * 100), cota: COTA_ALVO };
  }

  function carregarImagem(arquivo) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(arquivo);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Não consegui ler esse arquivo como imagem.'));
      };
      img.src = url;
    });
  }

  /* processar(File) -> Promise<{src, largura, altura, bytes, formato, nome, reducao}> */
  function processar(arquivo, opts) {
    opts = opts || {};
    var larguraMax = opts.larguraMax || LARGURA_MAX;
    var qualidade  = opts.qualidade  || QUALIDADE;

    if (!arquivo) return Promise.reject(new Error('Nenhum arquivo recebido.'));
    if (!/^image\//.test(arquivo.type)) {
      return Promise.reject(new Error('"' + arquivo.name + '" não é uma imagem.'));
    }
    if (arquivo.type === 'image/svg+xml') {
      return Promise.reject(new Error('SVG não passa pelo conversor — use PNG, JPG ou WebP.'));
    }
    if (arquivo.size > ENTRADA_MAX) {
      return Promise.reject(new Error('Arquivo de ' + formatarBytes(arquivo.size) +
                                      ' — o limite é ' + formatarBytes(ENTRADA_MAX) + '.'));
    }

    return carregarImagem(arquivo).then(function (img) {
      var escala = Math.min(1, larguraMax / img.naturalWidth);
      var w = Math.max(1, Math.round(img.naturalWidth * escala));
      var h = Math.max(1, Math.round(img.naturalHeight * escala));

      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      var formato = suportaWebp() ? 'image/webp' : 'image/jpeg';
      var src = canvas.toDataURL(formato, qualidade);

      /* Ainda pesado? Reduz a qualidade em degraus antes de desistir. */
      var q = qualidade;
      while (bytesDataUri(src) > 320 * 1024 && q > 0.4) {
        q -= 0.12;
        src = canvas.toDataURL(formato, q);
      }

      var bytes = bytesDataUri(src);
      return {
        src: src,
        largura: w,
        altura: h,
        bytes: bytes,
        formato: formato === 'image/webp' ? 'WebP' : 'JPEG',
        nome: arquivo.name,
        original: arquivo.size,
        reducao: arquivo.size > 0 ? Math.max(0, Math.round((1 - bytes / arquivo.size) * 100)) : 0
      };
    });
  }

  function cabeNoStorage(bytesNovos) {
    return (usoStorage().bytes + bytesNovos) < COTA_ALVO;
  }

  return {
    processar: processar,
    usoStorage: usoStorage,
    cabeNoStorage: cabeNoStorage,
    formatarBytes: formatarBytes,
    bytesDataUri: bytesDataUri,
    suportaWebp: suportaWebp
  };
})();
