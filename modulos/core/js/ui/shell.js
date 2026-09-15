/* =================================================================
   HIFERA MÓDULOS · Core · UI · Topo da tela
   -----------------------------------------------------------------
   Guard, chip do usuário, botão Sair e seletor de ano são iguais em
   toda tela do painel. Estavam copiados controller a controller — e
   cada cópia é uma chance de uma tela ficar para trás quando algo
   muda (foi o que aconteceu com o chip mostrando o usuário mockado).

   Devolve false quando o guard barrou, para o controller poder parar
   sem renderizar nada.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.Shell = (function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  /* aoTrocarAno é opcional: telas sem recorte anual passam nada e o
     seletor simplesmente não é preenchido. */
  function iniciar(aoTrocarAno) {
    if (!HiferaAdmin.AuthController.requireAuth()) return false;

    var Fmt = HiferaAdmin.Fmt;
    var P = HiferaAdmin.ProjectsModel;

    /* ProjectsModel.hoje() devolve string ISO ('2026-09-14'), não Date —
       é assim que TimelineView, ProjectDetailView e alertasProjeto a
       usam. Chamar .getFullYear() nela lançava TypeError e deixava em
       branco toda tela que passa por aqui.

       anosDisponiveis() também devolve strings, então a comparação do
       selected tem de ser string com string: com número, nenhuma opção
       vinha marcada e o seletor abria no ano mais antigo. */
    var sel = el('filtroAno');
    if (sel && P) {
      var anos = P.anosDisponiveis();
      var atual = P.hoje().slice(0, 4);
      /* Sem lançamento no ano corrente, abre no mais recente que existe;
         o ano mais antigo da base é a pior pergunta para abrir a tela. */
      var escolhido = anos.indexOf(atual) > -1 ? atual : anos[anos.length - 1];

      sel.innerHTML = anos.map(function (a) {
        return '<option value="' + a + '"' + (a === escolhido ? ' selected' : '') +
               '>' + a + '</option>';
      }).join('');
      if (aoTrocarAno) sel.addEventListener('change', aoTrocarAno);
    }

    var sair = el('btnSair');
    if (sair) sair.addEventListener('click', HiferaAdmin.AuthController.signOut);

    var chip = el('userChip');
    var u = HiferaAdmin.AuthModel.getUser();
    if (chip && u) {
      chip.innerHTML =
        '<span class="avatar">' + Fmt.esc(u.iniciais || '?') + '</span>' +
        '<span class="user-txt"><strong>' + Fmt.esc(u.nome || '') + '</strong>' +
        (u.email ? '<small>' + Fmt.esc(u.email) + '</small>' : '') +
        '</span>';
    }

    return true;
  }

  /* O ano escolhido, ou o corrente quando a tela não tem seletor.
     Sempre Number: os controllers fazem conta com ele (ano - 1 para a
     linha de comparação do gráfico). Quem precisa comparar com
     anosDisponiveis() converte para string na hora. */
  function ano() {
    var sel = el('filtroAno');
    if (sel && sel.value) return Number(sel.value);
    return Number(HiferaAdmin.ProjectsModel.hoje().slice(0, 4));
  }

  /* Aviso curto no canto. Estava copiado em ProjectsController e em
     ProjectDetailController; as telas novas usam esta cópia única em vez
     de criar uma terceira. */
  function toast(msg, tipo) {
    var box = el('toastRoot');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast' + (tipo ? ' toast--' + tipo : '');
    t.textContent = msg;
    box.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    setTimeout(function () {
      t.classList.remove('is-on');
      setTimeout(function () { t.remove(); }, 260);
    }, 3600);
  }

  /* Download de arquivo gerado na memória, sem passar por servidor. */
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

  return { iniciar: iniciar, ano: ano, toast: toast, baixar: baixar };
})();
