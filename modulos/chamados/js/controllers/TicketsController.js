/* =================================================================
   HIFERA ADMIN · Controller · Chamados
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.TicketsController = (function () {
  'use strict';

  var M       = HiferaAdmin.TicketsModel;
  var Vista   = HiferaAdmin.TicketsView;
  var Form    = HiferaAdmin.TicketFormView;
  var Detalhe = HiferaAdmin.TicketDetailView;
  var Audit   = HiferaAdmin.AuditModel;
  var Fmt     = HiferaAdmin.Fmt;
  var Auth    = HiferaAdmin.AuthModel;

  var filtro = { busca: '', status: 'abertos', fila: 'todas', prioridade: 'todas', tipo: 'todos' };

  function toast(msg, tom) {
    var box = document.getElementById('toastRoot');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast' + (tom ? ' toast--' + tom : '');
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-on'); });
    setTimeout(function () {
      el.classList.remove('is-on');
      setTimeout(function () { el.remove(); }, 260);
    }, 3600);
  }

  /* --- Filtro ------------------------------------------------------- */
  function lista() {
    var termo = filtro.busca.toLowerCase();
    return M.getAll().filter(function (t) {
      var st = M.STATUS[t.status] || {};

      if (filtro.status === 'abertos' && !st.aberto) return false;
      if (filtro.status === 'encerrados' && st.aberto) return false;
      if (filtro.status === 'sla' && !(st.aberto && M.sla(t).estourado)) return false;
      if (filtro.status !== 'todos' && filtro.status !== 'abertos' &&
          filtro.status !== 'encerrados' && filtro.status !== 'sla' &&
          t.status !== filtro.status) return false;

      if (filtro.fila !== 'todas' && t.fila !== filtro.fila) return false;
      if (filtro.prioridade !== 'todas' && t.prioridade !== filtro.prioridade) return false;
      if (filtro.tipo !== 'todos' && t.tipo !== filtro.tipo) return false;

      if (!termo) return true;
      return (t.id + ' ' + t.titulo + ' ' + t.solicitante + ' ' + t.empresa + ' ' +
              t.sistema + ' ' + t.modulo).toLowerCase().indexOf(termo) >= 0;
    });
  }

  /* --- Render -------------------------------------------------------- */
  function renderTopo() {
    var p = M.panorama();
    Vista.renderPanorama(document.getElementById('panorama'), p);
    Vista.renderVolume(document.getElementById('volume'), M.serieMensal(6));
    Vista.renderFilas(document.getElementById('filas'), p);

    var resumo = document.getElementById('volumeResumo');
    if (resumo) {
      var s = M.serieMensal(6);
      var ab = s.reduce(function (a, b) { return a + b.abertos; }, 0);
      var re = s.reduce(function (a, b) { return a + b.resolvidos; }, 0);
      var saldo = ab - re;
      resumo.innerHTML =
        '<span>Abertos <strong>' + ab + '</strong></span>' +
        '<span>Resolvidos <strong>' + re + '</strong></span>' +
        '<span class="' + (saldo > 0 ? 'is-neg' : 'is-pos') + '">' +
          (saldo > 0 ? '▲ ' + saldo + ' de backlog' : (saldo === 0 ? 'Em equilíbrio' : '▼ ' + (-saldo) + ' a menos')) +
        '</span>';
    }
  }

  function renderLista() {
    var l = lista();
    Vista.renderTabela(document.getElementById('tabelaChamados'), l);
    var c = document.getElementById('contadorChamados');
    if (c) c.textContent = l.length + (l.length === 1 ? ' chamado' : ' chamados');
  }

  function renderTudo() { renderTopo(); renderLista(); }

  /* --- Ações --------------------------------------------------------- */
  function abrirDetalhe(id) {
    Detalhe.abrir(id, function (evento, t, extra) {
      if (evento === 'excluir') {
        Audit.registrar('excluir', 'Chamado ' + t.id, 'Removeu o chamado e o histórico dele.');
        toast('Chamado ' + t.id + ' excluído.', 'alerta');
      } else if (evento === 'status') {
        Audit.registrar('editar', 'Chamado ' + t.id, 'Mudou o status para "' + extra + '".');
        toast('Status alterado para ' + extra + '.');
      } else if (evento === 'solucao') {
        Audit.registrar('editar', 'Chamado ' + t.id, 'Registrou a solução e resolveu o chamado.');
        toast('Solução registrada — chamado resolvido.', 'ok');
      } else if (evento === 'comentario') {
        Audit.registrar('editar', 'Chamado ' + t.id, 'Respondeu no chamado.');
      } else if (evento === 'avaliacao') {
        Audit.registrar('editar', 'Chamado ' + t.id, 'Recebeu avaliação de ' + extra + ' estrela(s).');
        toast('Obrigado pela avaliação!', 'ok');
      }
      renderTudo();
    });
  }

  function novo() {
    Form.abrir(function (dados) {
      var t = M.salvar(dados);
      Audit.registrar('criar', 'Chamado ' + t.id,
        M.TIPOS[t.tipo].label + ' em ' + t.sistema + ' · fila ' + M.FILAS[t.fila].label + '.');
      renderTudo();
      toast('Chamado ' + t.id + ' aberto na fila ' + M.FILAS[t.fila].label + '.', 'ok');
      setTimeout(function () { abrirDetalhe(t.id); }, 400);
    });
  }

  function exportar() {
    var blob = new Blob([M.exportarJSON()], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'hifera-chamados-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Chamados exportados.', 'ok');
  }

  function restaurar() {
    if (!window.confirm('Restaurar os chamados de exemplo?\n\nTudo que você registrou neste navegador será substituído.')) return;
    M.restaurarSeed();
    Audit.registrar('restaurar', 'Chamados', 'Restaurou os chamados de exemplo.');
    renderTudo();
    toast('Chamados de exemplo restaurados.');
  }

  /* --- Boot ----------------------------------------------------------- */
  function montarTopo() {
    var u = Auth.getUser();
    if (!u) return;
    var chip = document.getElementById('userChip');
    if (chip) {
      chip.innerHTML = '<span class="avatar">' + Fmt.esc(u.iniciais) + '</span>' +
        '<span class="user-txt"><strong>' + Fmt.esc(u.nome) + '</strong>' +
        '<small>' + Fmt.esc(u.email) + '</small></span>';
    }
    var sair = document.getElementById('btnSair');
    if (sair) sair.addEventListener('click', HiferaAdmin.AuthController.signOut);
  }

  function montarFiltros() {
    var fila = document.getElementById('filtroFila');
    if (fila) {
      fila.innerHTML = '<option value="todas">Todas as filas</option>' +
        Object.keys(M.FILAS).map(function (k) {
          return '<option value="' + k + '">' + M.FILAS[k].label + '</option>';
        }).join('');
    }
    var prio = document.getElementById('filtroPrioridade');
    if (prio) {
      prio.innerHTML = '<option value="todas">Toda prioridade</option>' +
        Object.keys(M.PRIORIDADES).map(function (k) {
          return '<option value="' + k + '">' + k + '</option>';
        }).join('');
    }

    var mapa = {
      buscaChamado: ['input', function (e) { filtro.busca = e.target.value; }],
      filtroStatus: ['change', function (e) { filtro.status = e.target.value; }],
      filtroFila: ['change', function (e) { filtro.fila = e.target.value; }],
      filtroPrioridade: ['change', function (e) { filtro.prioridade = e.target.value; }],
      filtroTipo: ['change', function (e) { filtro.tipo = e.target.value; }]
    };
    Object.keys(mapa).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(mapa[id][0], function (e) { mapa[id][1](e); renderLista(); });
    });
  }

  function montarAcoes() {
    var mapa = {
      btnNovoChamado: novo,
      btnExportarChamados: exportar,
      btnRestaurarChamados: restaurar,
      btnLog: function () { HiferaAdmin.AuditView.abrir(); }
    };
    Object.keys(mapa).forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', mapa[id]);
    });
  }

  function init() {
    if (!HiferaAdmin.AuthController.requireAuth()) return;

    Vista.definirHandlers({ abrir: abrirDetalhe });
    montarTopo();
    montarFiltros();
    montarAcoes();
    renderTudo();

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(renderTopo, 180);
    });
  }

  return { init: init };
})();
