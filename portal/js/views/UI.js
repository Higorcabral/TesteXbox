/* =================================================================
   HIFERA PORTAL · View · Pedaços compartilhados
   -----------------------------------------------------------------
   Ícones e três fragmentos que as quatro telas do portal repetem.
   Fica aqui para o marco não ser desenhado de um jeito no panorama e
   de outro na tela do projeto.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.UI = (function () {
  'use strict';

  var Fmt     = HiferaAdmin.Fmt;
  var Projeto = HiferaAdmin.ProjectsModel;
  var Tickets = HiferaAdmin.TicketsModel;

  var ICONE = {
    bandeira: '<path d="M4 22V4"/><path d="M4 5h11l-1.6 3.5L15 12H4"/>',
    relogio:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    dinheiro: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    pessoa:   '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    chat:     '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
    mais:     '<path d="M12 5v14M5 12h14"/>',
    alerta:   '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none"/><path d="M10.3 3.9L2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    seta:     '<path d="M5 12h14M13 5l7 7-7 7"/>',
    voltar:   '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    baixar:   '<path d="M12 4v12"/><path d="M7 12l5 5 5-5"/><path d="M5 20h14"/>',
    grade:    '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    check:    '<path d="M20 6L9 17l-5-5"/>'
  };

  function svg(path, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
           (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  /* --- Marco, só leitura ---------------------------------------------
     Mesmo desenho da tela interna, sem os controles: no portal quem
     move o marco é a Hifera. */
  function linhaMarco(m, mostrarNota) {
    var st = Projeto.MARCO_STATUS[m.status] || Projeto.MARCO_STATUS.previsto;
    var atrasado = m.status !== 'concluido' && m.data && m.data < Projeto.hoje();

    return '<li class="marco marco--' + st.cor + (atrasado ? ' is-atrasado' : '') + '">' +
        '<span class="marco-eixo" aria-hidden="true"><i></i></span>' +
        '<div class="marco-corpo">' +
          '<div class="marco-cab">' +
            '<strong>' + Fmt.esc(m.titulo) + '</strong>' +
            '<span class="marco-data">' +
              (m.data ? Fmt.data(m.data) : '<span class="vazio">a definir</span>') +
            '</span>' +
          '</div>' +
          (mostrarNota && m.nota ? '<p class="marco-nota">' + Fmt.esc(m.nota) + '</p>' : '') +
        '</div>' +
        '<span class="marco-estado pill pill--' + st.cor + '">' +
          '<span class="pill-dot"></span>' + st.label + '</span>' +
      '</li>';
  }

  function pillStatusChamado(status) {
    var s = Tickets.STATUS[status] || Tickets.STATUS.Aberto;
    var cor = s.cor === 'cinza' ? 'gray' : s.cor;
    return '<span class="pill pill--' + cor + '"><span class="pill-dot"></span>' +
           Fmt.esc(s.label) + '</span>';
  }

  /* Aviso curto no canto. Mesma mecânica do painel interno. */
  function toast(msg, tipo) {
    var box = document.getElementById('toastRoot');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast' + (tipo ? ' toast--' + tipo : '');
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-on'); });
    setTimeout(function () {
      el.classList.remove('is-on');
      setTimeout(function () { el.remove(); }, 260);
    }, 3600);
  }

  /* "há 2 horas", "ontem", "há 5 dias" — mais legível que a data seca
     para coisa que acabou de chegar. */
  function desde(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    var min = Math.floor((Date.now() - d.getTime()) / 60000);
    if (min < 2)    return 'agora';
    if (min < 60)   return 'há ' + min + ' min';
    var h = Math.floor(min / 60);
    if (h < 24)     return 'há ' + h + (h === 1 ? ' hora' : ' horas');
    var dias = Math.floor(h / 24);
    if (dias === 1) return 'ontem';
    if (dias < 30)  return 'há ' + dias + ' dias';
    return Fmt.data(iso.slice(0, 10));
  }

  function baixar(nome, conteudo, mime) {
    var blob = new Blob([conteudo], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  return {
    ICONE: ICONE,
    svg: svg,
    linhaMarco: linhaMarco,
    pillStatusChamado: pillStatusChamado,
    toast: toast,
    desde: desde,
    baixar: baixar
  };
})();
