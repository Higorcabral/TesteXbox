/* =================================================================
   HIFERA ADMIN · Controller · Gestão de um projeto
   -----------------------------------------------------------------
   Lê o ?id= da URL, monta a tela e faz a ponte view → model → log.
   É o único arquivo que conhece o DOM da admin/projeto.html.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ProjectDetailController = (function () {
  'use strict';

  var Model    = HiferaAdmin.ProjectsModel;
  var Audit    = HiferaAdmin.AuditModel;
  var Vista    = HiferaAdmin.ProjectDetailView;
  var Ficha    = HiferaAdmin.ProjectsView;      /* reusa o modal de cadastro */
  var Chart    = HiferaAdmin.ChartView;
  var LogVista = HiferaAdmin.AuditView;
  var Fmt      = HiferaAdmin.Fmt;
  var Auth     = HiferaAdmin.AuthModel;

  var idProjeto = null;
  var anoGrafico = null;

  function el(id) { return document.getElementById(id); }

  /* --- Avisos ------------------------------------------------------- */
  function toast(msg, tipo) {
    var box = el('toastRoot');
    if (!box) return;
    var node = document.createElement('div');
    node.className = 'toast' + (tipo ? ' toast--' + tipo : '');
    node.textContent = msg;
    box.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('is-on'); });
    setTimeout(function () {
      node.classList.remove('is-on');
      setTimeout(function () { node.remove(); }, 260);
    }, 3600);
  }

  /* --- Estado ------------------------------------------------------- */
  function atual() { return Model.getById(idProjeto); }

  function paramId() {
    try {
      return new URLSearchParams(window.location.search).get('id') || '';
    } catch (e) {
      var m = /[?&]id=([^&]+)/.exec(window.location.search);
      return m ? decodeURIComponent(m[1]) : '';
    }
  }

  /* --- Render ------------------------------------------------------- */
  function renderTitulo(p) {
    document.title = p.titulo + ' · Hifera Admin';
    var t = el('tituloProjeto');
    if (t) t.textContent = p.titulo;
    var m = el('migalhaProjeto');
    if (m) m.textContent = p.cliente || p.categoria;
  }

  function renderGrafico(p) {
    var alvo = el('graficoProjeto');
    if (!alvo) return;

    var anos = Model.anosProjeto(p);
    if (anos.indexOf(anoGrafico) < 0) anoGrafico = anos[anos.length - 1];

    var sel = el('anoProjeto');
    if (sel) {
      sel.innerHTML = anos.map(function (a) {
        return '<option value="' + a + '"' + (a === anoGrafico ? ' selected' : '') + '>' + a + '</option>';
      }).join('');
      sel.disabled = anos.length < 2;
    }

    var serie = Model.serieMensalProjeto(p, anoGrafico);
    var anterior = anos.indexOf(String(Number(anoGrafico) - 1)) >= 0
      ? Model.serieMensalProjeto(p, String(Number(anoGrafico) - 1))
      : null;

    Chart.montar(alvo, {
      serie: serie,
      forecast: serie.map(function () { return null; }),   /* forecast é da carteira, não do contrato */
      anterior: anterior,
      anoAnterior: anterior ? String(Number(anoGrafico) - 1) : ''
    });

    var resumo = el('resumoGrafico');
    if (resumo) {
      var t = serie.reduce(function (a, m) {
        a.recebido += m.recebido; a.aReceber += m.aReceber; a.gastos += m.gastos; a.meta += m.meta;
        return a;
      }, { recebido: 0, aReceber: 0, gastos: 0, meta: 0 });
      resumo.innerHTML =
        '<span>Em ' + anoGrafico + ': <strong>' + Fmt.moeda(t.recebido) + '</strong> recebidos</span>' +
        (t.aReceber > 0 ? '<span>a receber <strong>' + Fmt.moeda(t.aReceber) + '</strong></span>' : '') +
        '<span>gastos <strong>' + Fmt.moeda(t.gastos) + '</strong></span>';
    }
  }

  function renderTudo() {
    var p = atual();
    if (!p) { semProjeto(); return; }

    renderTitulo(p);
    Vista.renderFicha(el('fichaProjeto'), p);
    Vista.renderAlertas(el('alertasProjeto'), p);
    Vista.renderKpis(el('kpisProjeto'), p);
    renderGrafico(p);
    Vista.renderMarcos(el('marcosProjeto'), p);
    Vista.renderLancamentos(el('lancamentosProjeto'), p);
    Vista.renderNotas(el('notasProjeto'), p);
    Vista.renderCliente(el('clienteProjeto'), p);
  }

  function semProjeto() {
    var main = el('conteudo');
    if (!main) return;
    main.innerHTML =
      '<div class="vazio-box vazio-box--tela">' +
        '<strong>Projeto não encontrado</strong>' +
        '<p>O identificador <code>' + Fmt.esc(idProjeto || '(vazio)') + '</code> não existe nesta base. ' +
          'Ele pode ter sido excluído, ou você abriu o painel em outro navegador — ' +
          'os dados do protótipo vivem no localStorage de cada máquina.</p>' +
        '<a class="btn-pri" href="./">Voltar para a Gestão de Projetos</a>' +
      '</div>';
    document.title = 'Projeto não encontrado · Hifera Admin';
  }

  /* --- Ações da ficha ------------------------------------------------ */
  function editarFicha() {
    var antes = atual();
    if (!antes) return;
    Ficha.abrirModal(antes, false, function (dados) {
      var depois = Model.salvar(dados);
      Audit.registrar('editar', depois.titulo, Audit.descreverDiferencas(antes, depois));
      renderTudo();
      toast('Ficha atualizada.', 'ok');
    });
  }

  function abrirDemo() {
    var p = atual();
    if (!p || !p.link) { toast('Este projeto não tem link cadastrado.', 'alerta'); return; }
    var url = Fmt.urlSegura(p.link);
    if (!url) { toast('Link inválido.', 'alerta'); return; }
    window.open(Fmt.urlDoSite(url), '_blank', 'noopener');
  }

  function alternarPublicado() {
    var p = atual();
    if (!p) return;
    var estado = Model.alternarPublicado(idProjeto);
    Audit.registrar(estado ? 'publicar' : 'despublicar', p.titulo,
      estado ? 'Passou a aparecer na vitrine.' : 'Saiu da vitrine, segue salvo no painel.');
    renderTudo();
    toast(estado ? 'Publicado na vitrine.' : 'Removido da vitrine (segue salvo aqui).');
  }

  /* --- Marcos --------------------------------------------------------- */
  function novoMarco() {
    Vista.abrirModalMarco(
      { id: Model.novoId('mk'), titulo: '', data: '', status: 'previsto', nota: '' },
      true,
      function (marco) {
        var p = atual();
        Model.salvarMarco(idProjeto, marco);
        Audit.registrar('editar', p.titulo, 'Novo marco: "' + marco.titulo + '".');
        renderTudo();
        toast('Marco adicionado.', 'ok');
      }
    );
  }

  function editarMarco(marcoId) {
    var p = atual();
    var marco = p.marcos.filter(function (m) { return m.id === marcoId; })[0];
    if (!marco) return;
    Vista.abrirModalMarco(marco, false, function (novo) {
      Model.salvarMarco(idProjeto, novo);
      Audit.registrar('editar', p.titulo, 'Marco "' + novo.titulo + '" atualizado.');
      renderTudo();
      toast('Marco salvo.', 'ok');
    });
  }

  function statusMarco(marcoId, status) {
    var p = atual();
    var marco = p.marcos.filter(function (m) { return m.id === marcoId; })[0];
    if (!marco) return;
    marco.status = status;
    Model.salvarMarco(idProjeto, marco);
    Audit.registrar('editar', p.titulo,
      'Marco "' + marco.titulo + '" agora está como ' + Model.MARCO_STATUS[status].label.toLowerCase() + '.');
    renderTudo();
    toast('Marco: ' + Model.MARCO_STATUS[status].label.toLowerCase() + '.');
  }

  function removerMarco(marcoId) {
    var p = atual();
    var marco = p.marcos.filter(function (m) { return m.id === marcoId; })[0];
    if (!marco) return;
    if (!window.confirm('Remover o marco "' + marco.titulo + '"?\n\nO percentual de conclusão do projeto muda.')) return;
    Model.removerMarco(idProjeto, marcoId);
    Audit.registrar('editar', p.titulo, 'Removeu o marco "' + marco.titulo + '".');
    renderTudo();
    toast('Marco removido.', 'alerta');
  }

  /* --- Lançamentos ------------------------------------------------------ */
  function addLancamento() {
    var alvo = el('lancamentosProjeto');
    if (!alvo) return;
    /* Sugere o mês seguinte ao último lançado, que é quase sempre o certo */
    var lista = Vista.coletarLancamentos(alvo);
    var base = lista.length ? lista[lista.length - 1].mes : Model.mesAtual();
    var ano = parseInt(base.slice(0, 4), 10);
    var mes = parseInt(base.slice(5, 7), 10) + 1;
    if (mes > 12) { mes = 1; ano++; }
    Vista.adicionarLancamento(alvo, ano + '-' + String(mes).padStart(2, '0'));
  }

  function salvarLancamentos(lista) {
    var p = atual();
    var antes = Model.totaisProjeto(p);
    Model.salvarLancamentos(idProjeto, lista);
    var depois = Model.totaisProjeto(atual());

    Audit.registrar('editar', p.titulo,
      'Lançamentos: ' + lista.length + ' competência(s). Recebido ' +
      Fmt.moeda(antes.recebido) + ' → ' + Fmt.moeda(depois.recebido) + '.');

    /* Redesenha os lançamentos também: o model normaliza e reordena */
    renderTudo();
    toast('Lançamentos salvos.', 'ok');
  }

  /* --- Diário ------------------------------------------------------------ */
  function novaNota(texto) {
    var p = atual();
    var u = Auth.getUser();
    Model.adicionarNota(idProjeto, {
      data: Model.hoje(),
      autor: (u && u.nome) || '',
      texto: texto
    });
    Audit.registrar('editar', p.titulo, 'Registrou uma anotação no diário.');
    renderTudo();
    toast('Anotação registrada.', 'ok');
  }

  function removerNota(notaId) {
    if (!window.confirm('Remover esta anotação?')) return;
    var p = atual();
    Model.removerNota(idProjeto, notaId);
    Audit.registrar('editar', p.titulo, 'Removeu uma anotação do diário.');
    renderTudo();
    toast('Anotação removida.', 'alerta');
  }

  /* --- Cliente ------------------------------------------------------------ */
  function salvarCliente(dados) {
    var antes = atual();
    var depois = Model.atualizarCampos(idProjeto, dados);
    Audit.registrar('editar', depois.titulo, Audit.descreverDiferencas(antes, depois));
    renderTudo();
    toast('Ficha do cliente salva.', 'ok');
  }

  /* --- Boot ---------------------------------------------------------------- */
  function montarTopo() {
    var u = Auth.getUser();
    if (u) {
      var chip = el('userChip');
      if (chip) {
        chip.innerHTML =
          '<span class="avatar">' + Fmt.esc(u.iniciais) + '</span>' +
          '<span class="user-txt"><strong>' + Fmt.esc(u.nome) + '</strong>' +
          '<small>' + Fmt.esc(u.email) + '</small></span>';
      }
    }
    var sair = el('btnSair');
    if (sair) sair.addEventListener('click', HiferaAdmin.AuthController.signOut);

    var log = el('btnLog');
    if (log) log.addEventListener('click', function () { LogVista.abrir(); });

    var ano = el('anoProjeto');
    if (ano) {
      ano.addEventListener('change', function () {
        anoGrafico = ano.value;
        var p = atual();
        if (p) renderGrafico(p);
      });
    }
  }

  function init() {
    if (!HiferaAdmin.AuthController.requireAuth()) return;

    idProjeto = paramId();

    Vista.definirHandlers({
      editar: editarFicha,
      abrir: abrirDemo,
      publicar: alternarPublicado,
      novoMarco: novoMarco,
      editarMarco: editarMarco,
      statusMarco: statusMarco,
      removerMarco: removerMarco,
      addLanc: addLancamento,
      salvarLancamentos: salvarLancamentos,
      novaNota: novaNota,
      removerNota: removerNota,
      salvarCliente: salvarCliente
    });

    montarTopo();

    if (!idProjeto || !atual()) { semProjeto(); return; }

    renderTudo();

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var p = atual();
        if (p) renderGrafico(p);
      }, 180);
    });
  }

  return { init: init };
})();
