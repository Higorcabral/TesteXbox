/* =================================================================
   HIFERA MÓDULOS · Core · UI · Navegação lateral
   -----------------------------------------------------------------
   A barra lateral era markup copiado em cada página. Com sete telas
   isso vira armadilha de manutenção: um item novo obriga a editar sete
   arquivos, e o primeiro esquecido some do menu só naquela tela.

   Aqui a lista mora num lugar só. Cada página diz quem ela é
   (data-tela no <nav>) e o resto sai daqui.

   Renderiza de forma síncrona, no carregamento do script, para o menu
   não piscar depois do primeiro paint.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.Nav = (function () {
  'use strict';

  /* href é relativo à raiz do app admin; cada página informa o prefixo
     que a leva até lá (data-raiz), porque /admin/ e /chamados/ estão um
     nível abaixo e a tela de login está na raiz. */
  var TELAS = [
    { grupo: 'Operação' },
    { id: 'projetos',  href: 'admin/',      rotulo: 'Gestão de Projetos',
      icone: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>' },
    { id: 'chamados',  href: 'chamados/',   rotulo: 'Chamados', selo: 'sideBadgeChamados',
      icone: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>' },

    { grupo: 'Números' },
    { id: 'kpis',      href: 'admin/kpis.html', rotulo: 'KPIs',
      icone: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>' },
    { id: 'financeiro', href: 'admin/financeiro.html', rotulo: 'Financeiro',
      icone: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },

    { grupo: 'Relacionamento' },
    { id: 'clientes',  href: 'admin/clientes.html', rotulo: 'Clientes &amp; Leads',
      icone: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>' },
    { id: 'conteudo',  href: 'admin/conteudo.html', rotulo: 'Conteúdo do site',
      icone: '<path d="M4 5h16v14H4z"/><path d="M4 9h16M9 9v10"/>' }
  ];

  function svg(caminho) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.7">' + caminho + '</svg>';
  }

  function render() {
    var el = document.getElementById('sideNav');
    if (!el) return;

    var atual = el.getAttribute('data-tela') || '';
    /* Só prefixo relativo simples. Vem de atributo do nosso próprio HTML,
       mas validar custa uma linha e fecha a porta para href estranho. */
    var raiz = el.getAttribute('data-raiz') || '';
    if (!/^(\.\.\/)*$/.test(raiz)) raiz = '';

    el.innerHTML = TELAS.map(function (t) {
      if (t.grupo) return '<span class="side-grupo">' + t.grupo + '</span>';

      var ativo = t.id === atual;
      /* A tela atual vira <span>: link para a página em que já se está
         é ruído, e o aria-current sozinho não impede o clique. */
      var tag = ativo ? 'span' : 'a';
      var attr = ativo
        ? ' class="side-link is-active" aria-current="page"'
        : ' class="side-link" href="' + raiz + t.href + '"';

      return '<' + tag + attr + '>' + svg(t.icone) + ' ' + t.rotulo +
             (t.selo ? '<span class="side-badge" id="' + t.selo + '" hidden></span>' : '') +
             '</' + tag + '>';
    }).join('');
  }

  render();
  return { render: render };
})();
