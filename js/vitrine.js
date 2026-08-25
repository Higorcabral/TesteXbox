/* =================================================================
   HIFERA · Hidratação da vitrine
   -----------------------------------------------------------------
   A grade de projetos da home é HTML estático (bom para SEO e para
   o primeiro paint). Este script só entra em ação se existir uma
   lista vinda do painel — aí ele substitui a grade. Sem dados,
   não toca em nada.

   Ordem de precedência:
     1. localStorage 'hifera.admin.projetos.v1'  (edições do /modulos/admin)
     2. window.HIFERA_PROJETOS                    (lista publicada no repo)
     3. o HTML que já está na página              (fallback)
   ================================================================= */
(function () {
  'use strict';

  var CHAVE = 'hifera.admin.projetos.v1';

  function esc(t) {
    return String(t === undefined || t === null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Links: nada de javascript:/data: */
  function urlSegura(u) {
    u = String(u || '').trim();
    return /^(javascript|data|vbscript):/i.test(u) ? '' : u;
  }

  /* Imagens: o painel embute data: URI raster, então esses passam.
     SVG continua barrado — pode carregar script. */
  function fonteImagem(u) {
    u = String(u || '').trim();
    if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(u)) return u;
    return urlSegura(u);
  }

  function obterLista() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        var l = JSON.parse(bruto);
        if (Array.isArray(l) && l.length) return l;
      }
    } catch (e) { /* storage bloqueado — segue para o fallback */ }
    if (Array.isArray(window.HIFERA_PROJETOS) && window.HIFERA_PROJETOS.length) {
      return window.HIFERA_PROJETOS;
    }
    return null;
  }

  function card(p, i) {
    var link = urlSegura(p.link);
    if (!link) return '';

    var imagens = (p.imagens || [])
      .map(function (im) { return typeof im === 'string' ? { src: im, alt: '' } : im; })
      .filter(function (im) { return im && fonteImagem(im.src); });

    var slides = imagens.length
      ? imagens.map(function (im, k) {
          return '<img class="slide' + (k === 0 ? ' is-active' : '') + '" src="' + esc(im.src) +
                 '" alt="' + esc(im.alt) + '" loading="lazy">';
        }).join('')
      : '';

    var ordem = String(Math.max(0, Math.round(Number(p.ordem) || (i + 1))));
    if (ordem.length < 2) ordem = '0' + ordem;

    var alvo = p.novaAba === false ? '' : ' target="_blank" rel="noopener"';

    return '<a href="' + esc(link) + '"' + alvo + ' class="proj-card reveal is-visible">' +
      '<div class="proj-media">' +
        '<div class="carousel" data-carousel>' + slides + '</div>' +
        '<div class="proj-tag">Projeto · ' + esc(p.categoria || '') + '</div>' +
      '</div>' +
      '<div class="proj-body">' +
        '<span class="proj-meta">' + ordem + ' · ' + esc(p.segmento || '') + '</span>' +
        '<h3>' + esc(p.titulo || '') + '</h3>' +
        '<p>' + esc(p.descricao || '') + '</p>' +
        '<span class="proj-cta">Ver caso <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span>' +
      '</div>' +
    '</a>';
  }

  /* O card grande do topo: atualizado no lugar, pra não perder o
     brilho/animação que já existem no HTML. */
  function hidratarDestaque(p) {
    var art = document.querySelector('.feature-product');
    if (!art || !p) return;

    var capa = (p.imagens || [])
      .map(function (im) { return typeof im === 'string' ? { src: im, alt: '' } : im; })
      .filter(function (im) { return im && fonteImagem(im.src); })[0];

    var img = art.querySelector('.fp-media img');
    if (img && capa) {
      img.setAttribute('src', capa.src);
      img.setAttribute('alt', capa.alt || '');
    }

    var h = art.querySelector('.fp-content h3');
    if (h && p.titulo) h.textContent = p.titulo;

    var desc = art.querySelector('.fp-content > p');
    if (desc && p.descricao) desc.textContent = p.descricao;

    var ul = art.querySelector('.fp-list');
    if (ul && Array.isArray(p.bullets) && p.bullets.length) {
      ul.innerHTML = p.bullets.map(function (b) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
               '<path d="M20 6L9 17l-5-5"/></svg> ' + esc(b) + '</li>';
      }).join('');
    }

    var link = urlSegura(p.link);
    var a = art.querySelector('.fp-cta a');
    if (a && link) {
      a.setAttribute('href', link);
      if (p.novaAba === false) { a.removeAttribute('target'); a.removeAttribute('rel'); }
      else { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
    }

    var preco = art.querySelector('.fp-price');
    if (preco) {
      if (p.preco) { preco.textContent = p.preco; preco.hidden = false; }
      else { preco.hidden = true; }
    }
  }

  function hidratar() {
    var grade = document.querySelector('.proj-grid');
    if (!grade) return;

    var lista = obterLista();
    if (!lista) return;

    var destaque = lista.filter(function (p) {
      return p && p.destaque && p.publicado !== false;
    })[0];
    if (destaque) hidratarDestaque(destaque);

    /* O produto em destaque tem card próprio no topo, fora da grade */
    var visiveis = lista
      .filter(function (p) { return p && p.publicado !== false && !p.destaque && urlSegura(p.link); })
      .sort(function (a, b) { return (Number(a.ordem) || 0) - (Number(b.ordem) || 0); });

    if (!visiveis.length) return;

    var html = visiveis.map(card).join('');
    if (html) grade.innerHTML = html;
  }

  hidratar();

  /* Editou no painel em outra aba? A vitrine acompanha. */
  window.addEventListener('storage', function (e) {
    if (e.key === CHAVE) hidratar();
  });
})();
