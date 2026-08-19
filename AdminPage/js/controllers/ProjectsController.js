/* =================================================================
   HIFERA ADMIN · Controller · Gestão de Projetos
   Orquestra KPIs, gráfico, timeline, CRUD, publicação e log.
   É o único que conhece o DOM da projetos.html.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ProjectsController = (function () {
  'use strict';

  var Model    = HiferaAdmin.ProjectsModel;
  var Audit    = HiferaAdmin.AuditModel;
  var Publish  = HiferaAdmin.PublishModel;
  var Img      = HiferaAdmin.ImageModel;
  var Kpi      = HiferaAdmin.KpiView;
  var Chart    = HiferaAdmin.ChartView;
  var Timeline = HiferaAdmin.TimelineView;
  var Vista    = HiferaAdmin.ProjectsView;
  var LogVista = HiferaAdmin.AuditView;
  var Fmt      = HiferaAdmin.Fmt;
  var Auth     = HiferaAdmin.AuthModel;

  var filtro = { ano: null, busca: '', status: 'todos' };

  /* --- Avisos rápidos -------------------------------------------- */
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

  /* --- Render ------------------------------------------------------ */
  function anoAnteriorDisponivel(ano) {
    var anterior = String(Number(ano) - 1);
    return Model.anosDisponiveis().indexOf(anterior) >= 0 ? anterior : null;
  }

  function renderDashboard() {
    var totais   = Model.totais(filtro.ano);
    var contagem = Model.contagemStatus();
    var serie    = Model.serieMensal(filtro.ano);
    var fc       = Model.forecast(filtro.ano);
    var anoAnt   = anoAnteriorDisponivel(filtro.ano);

    Kpi.render(document.getElementById('kpis'), {
      totais: totais,
      contagem: contagem,
      forecast: Model.totalForecast(filtro.ano),
      alertas: Model.todosAlertas()
    });

    Chart.montar(document.getElementById('grafico'), {
      serie: serie,
      forecast: fc,
      anterior: anoAnt ? Model.serieMensal(anoAnt) : null,
      anoAnterior: anoAnt || ''
    });

    var resumo = document.getElementById('graficoResumo');
    if (resumo) {
      var projetado = Model.totalForecast(filtro.ano);
      var acima = totais.recebido >= totais.meta;
      resumo.innerHTML =
        '<span>Recebido <strong>' + Fmt.moeda(totais.recebido) + '</strong></span>' +
        '<span>vs meta <strong>' + Fmt.moeda(totais.meta) + '</strong></span>' +
        (projetado > 0
          ? '<span>forecast <strong>+' + Fmt.moeda(projetado) + '</strong></span>'
          : '') +
        '<span class="' + (acima ? 'is-pos' : 'is-neg') + '">' +
          (acima ? '▲ ' : '▼ ') + Fmt.pct(Math.abs(totais.pctMeta - 100), 0) +
          (acima ? ' acima' : ' abaixo') +
        '</span>';
    }
  }

  function renderTimeline() {
    Timeline.render(document.getElementById('timeline'), Model.getAll());
  }

  function listaFiltrada() {
    var termo = filtro.busca.toLowerCase();
    return Model.getAll().filter(function (p) {
      if (filtro.status === 'alerta') {
        if (!Model.alertasProjeto(p).length) return false;
      } else if (filtro.status !== 'todos' && p.status !== filtro.status) {
        return false;
      }
      if (!termo) return true;
      return (p.titulo + ' ' + p.categoria + ' ' + p.segmento + ' ' + p.cliente)
               .toLowerCase().indexOf(termo) >= 0;
    });
  }

  function renderTabela() {
    var lista = listaFiltrada();
    Vista.renderTabela(document.getElementById('tabelaProjetos'), lista);
    var cont = document.getElementById('contadorProjetos');
    if (cont) cont.textContent = lista.length + (lista.length === 1 ? ' projeto' : ' projetos');
    renderBannerAlertas();
  }

  function renderBannerAlertas() {
    var el = document.getElementById('bannerAlertas');
    if (!el) return;
    var alertas = Model.todosAlertas();
    if (!alertas.length) {
      el.innerHTML = '';
      el.hidden = true;
      return;
    }
    el.hidden = false;
    var vencido = alertas
      .filter(function (a) { return a.alerta.tipo === 'parcela-vencida'; })
      .reduce(function (s, a) { return s + a.alerta.valor; }, 0);

    el.innerHTML =
      '<div class="banner banner--alerta">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none"/>' +
          '<path d="M10.3 3.9L2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>' +
        '<div class="banner-txt">' +
          '<strong>' + alertas.length + (alertas.length === 1 ? ' alerta aberto' : ' alertas abertos') +
          (vencido > 0 ? ' · ' + Fmt.moeda(vencido) + ' vencido' : '') + '</strong>' +
          '<span>' + alertas.slice(0, 3).map(function (a) {
            return Fmt.esc(a.projeto.titulo) + ': ' + Fmt.esc(a.alerta.label.toLowerCase());
          }).join(' · ') + (alertas.length > 3 ? ' e mais ' + (alertas.length - 3) : '') + '</span>' +
        '</div>' +
        '<button type="button" class="btn-sec" id="verAlertas">Ver só estes</button>' +
      '</div>';

    var btn = document.getElementById('verAlertas');
    if (btn) {
      btn.addEventListener('click', function () {
        var sel = document.getElementById('filtroStatus');
        if (sel) { sel.value = 'alerta'; filtro.status = 'alerta'; renderTabela(); }
        var tabela = document.getElementById('tabelaProjetos');
        if (tabela) tabela.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  function renderTudo() {
    renderDashboard();
    renderTimeline();
    renderTabela();
  }

  /* --- CRUD --------------------------------------------------------- */
  function projetoVazio() {
    var hoje = new Date();
    var mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
    return {
      id: 'proj-' + Math.random().toString(36).slice(2, 8),
      titulo: '', categoria: '', segmento: '', ordem: Model.getAll().length + 1,
      descricao: '', link: '', novaAba: true, preco: '', bullets: [],
      imagens: [],
      publicado: true, destaque: false, status: 'andamento',
      cliente: '', inicio: '', entrega: '', observacao: '',
      lancamentos: [{ mes: mes, meta: 0, recebido: 0, aReceber: 0, gastos: 0 }]
    };
  }

  function novo() {
    Vista.abrirModal(projetoVazio(), true, function (dados) {
      Model.salvar(dados);
      Audit.registrar('criar', dados.titulo,
        'Cadastrou o projeto' + (dados.imagens.length ? ' com ' + dados.imagens.length + ' imagem(ns).' : '.'));
      renderTudo();
      toast('Projeto "' + dados.titulo + '" cadastrado.', 'ok');
    });
  }

  function editar(id) {
    var antes = Model.getById(id);
    if (!antes) return;
    Vista.abrirModal(antes, false, function (dados) {
      var depois = Model.salvar(dados);
      Audit.registrar('editar', depois.titulo, Audit.descreverDiferencas(antes, depois));
      renderTudo();
      toast('Alterações salvas.', 'ok');
    });
  }

  function duplicar(id) {
    var p = Model.getById(id);
    if (!p) return;
    var origem = p.titulo;
    p.id = Model.slug(p.titulo) + '-copia-' + Math.random().toString(36).slice(2, 6);
    p.titulo = p.titulo + ' (cópia)';
    p.publicado = false;
    p.destaque = false;
    Model.salvar(p);
    Audit.registrar('duplicar', p.titulo, 'Cópia de "' + origem + '", criada como rascunho.');
    renderTudo();
    toast('Cópia criada como rascunho (não publicada).');
  }

  function excluir(id) {
    var p = Model.getById(id);
    if (!p) return;
    if (!window.confirm('Excluir "' + p.titulo + '"?\n\nOs lançamentos financeiros dele saem dos KPIs, do gráfico e da timeline. Não dá pra desfazer.')) return;
    Model.remover(id);
    Audit.registrar('excluir', p.titulo, 'Removeu o projeto e os lançamentos dele.');
    renderTudo();
    toast('Projeto excluído.', 'alerta');
  }

  function publicar(id) {
    var p = Model.getById(id);
    var estado = Model.alternarPublicado(id);
    if (p) {
      Audit.registrar(estado ? 'publicar' : 'despublicar', p.titulo,
        estado ? 'Passou a aparecer na vitrine.' : 'Saiu da vitrine, segue salvo no painel.');
    }
    renderTabela();
    toast(estado ? 'Publicado na vitrine.' : 'Removido da vitrine (segue salvo aqui).');
  }

  function abrir(id) {
    var p = Model.getById(id);
    if (!p || !p.link) { toast('Este projeto não tem link cadastrado.', 'alerta'); return; }
    var url = Fmt.urlSegura(p.link);
    if (!url) { toast('Link inválido.', 'alerta'); return; }
    var alvo = /^https?:\/\//i.test(url) ? url : '../' + url.replace(/^\.?\//, '');
    window.open(alvo, '_blank', 'noopener');
  }

  /* --- Publicação / backup -------------------------------------------- */
  function publicarSite() {
    var st = Publish.estatisticas();
    if (!st.projetos) { toast('Nenhum projeto publicado para gerar o arquivo.', 'alerta'); return; }

    var aviso = st.pesado
      ? '\n\nATENÇÃO: o arquivo ficou com ' + Img.formatarBytes(st.bytes) +
        ' porque tem ' + st.imagensEmbutidas + ' imagem(ns) embutida(s) em base64. ' +
        'Considere salvar essas imagens em assets/thumbs/ e referenciar pelo caminho.'
      : '';

    var ok = window.confirm(
      'Gerar js/vitrine-dados.js com ' + st.projetos + ' projeto(s)?\n\n' +
      '· ' + st.naGrade + ' na grade · ' + st.destaque + ' em destaque\n' +
      '· Tamanho: ' + Img.formatarBytes(st.bytes) + '\n' +
      '· Financeiro, cliente e status NÃO entram no arquivo\n\n' +
      'Depois é só colocar o arquivo em js/ e commitar.' + aviso
    );
    if (!ok) return;

    baixar('vitrine-dados.js', Publish.gerarArquivo(), 'text/javascript;charset=utf-8');
    Audit.registrar('publicarSite', 'Vitrine',
      'Gerou vitrine-dados.js com ' + st.projetos + ' projeto(s), ' + Img.formatarBytes(st.bytes) + '.');
    toast('vitrine-dados.js gerado — coloque em js/ e commite.', 'ok');
  }

  function exportar() {
    var hoje = new Date().toISOString().slice(0, 10);
    baixar('hifera-projetos-' + hoje + '.json', Model.exportarJSON(), 'application/json');
    toast('Backup exportado.', 'ok');
  }

  function importar(arquivo) {
    var leitor = new FileReader();
    leitor.onload = function () {
      try {
        var lista = Model.importarJSON(String(leitor.result));
        Audit.registrar('importar', 'Base de projetos', 'Importou ' + lista.length + ' projeto(s) de ' + arquivo.name + '.');
        renderTudo();
        toast(lista.length + ' projetos importados.', 'ok');
      } catch (e) {
        toast('JSON inválido: ' + e.message, 'alerta');
      }
    };
    leitor.readAsText(arquivo);
  }

  function restaurar() {
    if (!window.confirm('Restaurar os dados de exemplo?\n\nTudo que você cadastrou neste navegador será substituído.')) return;
    Model.restaurarSeed();
    Audit.registrar('restaurar', 'Base de projetos', 'Restaurou os dados de exemplo.');
    renderTudo();
    toast('Dados de exemplo restaurados.');
  }

  /* --- Boot ------------------------------------------------------------ */
  function montarTopo() {
    var u = Auth.getUser();
    if (!u) return;
    var chip = document.getElementById('userChip');
    if (chip) {
      chip.innerHTML =
        '<span class="avatar">' + Fmt.esc(u.iniciais) + '</span>' +
        '<span class="user-txt"><strong>' + Fmt.esc(u.nome) + '</strong>' +
        '<small>' + Fmt.esc(u.email) + '</small></span>';
    }
    var sair = document.getElementById('btnSair');
    if (sair) sair.addEventListener('click', HiferaAdmin.AuthController.signOut);
  }

  function montarFiltros() {
    var anos = Model.anosDisponiveis();
    filtro.ano = anos[anos.length - 1];

    var selAno = document.getElementById('filtroAno');
    if (selAno) {
      selAno.innerHTML = anos.map(function (a) {
        return '<option value="' + a + '"' + (a === filtro.ano ? ' selected' : '') + '>' + a + '</option>';
      }).join('');
      selAno.addEventListener('change', function () {
        filtro.ano = selAno.value;
        renderDashboard();
      });
    }

    var busca = document.getElementById('buscaProjeto');
    if (busca) {
      busca.addEventListener('input', function () {
        filtro.busca = busca.value;
        renderTabela();
      });
    }

    var selStatus = document.getElementById('filtroStatus');
    if (selStatus) {
      selStatus.addEventListener('change', function () {
        filtro.status = selStatus.value;
        renderTabela();
      });
    }
  }

  function montarAcoes() {
    var mapa = {
      btnNovo: novo,
      btnExportar: exportar,
      btnRestaurar: restaurar,
      btnPublicar: publicarSite,
      btnLog: function () { LogVista.abrir(); }
    };
    Object.keys(mapa).forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', mapa[id]);
    });

    var input = document.getElementById('inputImportar');
    var btnImp = document.getElementById('btnImportar');
    if (btnImp && input) {
      btnImp.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        if (input.files && input.files[0]) importar(input.files[0]);
        input.value = '';
      });
    }
  }

  function init() {
    if (!HiferaAdmin.AuthController.requireAuth()) return;

    if (!HiferaAdmin.StoreModel.disponivel()) {
      toast('Storage bloqueado neste navegador — as alterações não vão persistir.', 'alerta');
    }

    Vista.definirHandlers({
      editar: editar, duplicar: duplicar, excluir: excluir,
      publicar: publicar, abrir: abrir
    });

    montarTopo();
    montarFiltros();
    montarAcoes();
    renderTudo();

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(renderDashboard, 180);
    });
  }

  return { init: init };
})();
