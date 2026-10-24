/* =================================================================
   HIFERA MÓDULOS · Core · Model · Site oficial (leads + comportamento)
   -----------------------------------------------------------------
   Os dados do SITE PÚBLICO da Hifera: leads do formulário e eventos
   anônimos de navegação. Diferente do LeadsModel, que são os leads do
   negócio DO CLIENTE — aqui a Hifera é a dona do funil.

   De onde vêm os dados:
     · No admin publicado (admin.hifera.com.br), a leitura é da Function
       /api/site-analytics, que é a única que tem a chave de serviço do
       Supabase. A página já passou pelo Entra; a Function confere o
       papel antes de responder. Nenhuma chave de leitura vive aqui.
     · Em localhost não existe Function: o model cai em modo protótipo,
       com uma amostra gerada na hora, para dar para desenhar a tela.
       Mesma lógica do portal (config vazia = protótipo).

   carregar() devolve Promise porque a fonte real é rede. O controller
   desenha depois que ela resolve — com seed o resolve é imediato.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.SiteAnalyticsModel = (function () {
  'use strict';

  var Store = HiferaAdmin.StoreModel;
  var API = '/api/site-analytics';
  var CHAVE_SEED = 'hifera.admin.site.seed.v2';

  var STATUS = {
    novo:    { label: 'Novo',       cor: 'cyan',  ordem: 1, aberto: true },
    contato: { label: 'Em contato', cor: 'amber', ordem: 2, aberto: true },
    ganho:   { label: 'Ganho',      cor: 'green', ordem: 3, aberto: false },
    perdido: { label: 'Perdido',    cor: 'red',   ordem: 4, aberto: false }
  };

  var ORIGENS = ['Formulário do site', 'WhatsApp', 'Indicação'];

  /* --- estado carregado ------------------------------------------- */
  var dados = { leads: [], eventos: [], fonte: '' };

  function ehLocal() {
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '' ||
           /\.localhost$/.test(h) || /\.test$/.test(h);
  }

  /* =================================================================
     Protótipo — amostra plausível dos últimos 30 dias
     ================================================================= */
  function hAtras(h) { return new Date(Date.now() - h * 3600000).toISOString(); }

  function seed() {
    var guardado = Store.ler(CHAVE_SEED, null);
    if (guardado && guardado.leads) return guardado;

    var leadsBrutos = [
      ['Mariana Alves', 'Transportadora Rota Norte', 'mariana@rotanorte.com.br', 'Automatizar processo', 'novo', 3],
      ['Paulo Bastos', 'Mecânica BastosDiesel', 'paulo@bastosdiesel.com.br', 'Site novo', 'contato', 28],
      ['Lucía Fernández', '', 'lucia.fz@gmail.com', 'Ainda não sei', 'novo', 50],
      ['Rafael Teixeira', 'Logística Interlagos', 'rafael@interlagoslog.com.br', 'Ferramenta interna', 'ganho', 140],
      ['Camila Souza', 'Studio Camila Arq', 'contato@camilaarq.com.br', 'Site novo', 'contato', 180],
      ['Diego Ramos', 'Oficina RotaSul', 'diego@rotasul.com.br', 'Automatizar processo', 'perdido', 320],
      ['Ana Prado', 'Clínica Vida+', 'ana@vidamais.com.br', 'Ainda não sei', 'novo', 8],
      ['Henrique Lima', 'Distribuidora Vega', 'henrique@vega.com.br', 'Ferramenta interna', 'ganho', 500]
    ];

    var leads = leadsBrutos.map(function (l, i) {
      return {
        id: 'seed-' + i,
        nome: l[0], empresa: l[1], contato: l[2], objetivo: l[3],
        recado: '', origem: 'Formulário do site', pagina: '/',
        status: l[4], nota: '', criado_em: hAtras(l[5])
      };
    });

    /* Eventos: ~30 dias de pageviews/cliques/tempo, com fim de semana
       mais fraco e tendência leve de alta, para o gráfico não ser reta. */
    var paginas = ['/', '/', '/', '/#produtos', '/#contato', '/seguranca.html'];
    var alvos = ['cta:nav-conversar', 'cta:hero-falar', 'produto:ver-caso',
                 'cta:footer-contato', 'produto:ver-caso', 'cta:hero-falar'];
    var eventos = [];
    var seq = 1;
    for (var d = 29; d >= 0; d--) {
      var dow = new Date(Date.now() - d * 86400000).getDay();
      var base = (dow === 0 || dow === 6) ? 10 : 24;
      var visitas = Math.round(base + (29 - d) * 0.4 + Math.random() * 8);
      for (var v = 0; v < visitas; v++) {
        var ses = 's' + d + '-' + v;
        var hora = d * 24 + Math.floor(Math.random() * 24);

        /* Nº de páginas da visita: a maioria vê uma, parte navega. Sem
           isto toda sessão teria 1 pageview e a rejeição daria 100%. */
        var r = Math.random();
        var paginasNaVisita = r < 0.58 ? 1 : (r < 0.86 ? 2 : 3);

        for (var pp = 0; pp < paginasNaVisita; pp++) {
          var pag = paginas[Math.floor(Math.random() * paginas.length)];
          eventos.push({ id: seq++, sessao: ses, tipo: 'pageview', pagina: pag,
                         valor: null, criado_em: hAtras(hora) });
          /* ~65% das páginas rendem tempo registrável */
          if (Math.random() < 0.65) {
            eventos.push({ id: seq++, sessao: ses, tipo: 'tempo', pagina: pag,
                           valor: Math.round(8000 + Math.random() * 120000), criado_em: hAtras(hora) });
          }
        }

        /* ~24% das visitas clicam em algum CTA */
        if (Math.random() < 0.24) {
          eventos.push({ id: seq++, sessao: ses, tipo: 'clique', pagina: '/',
                         alvo: alvos[Math.floor(Math.random() * alvos.length)],
                         valor: null, criado_em: hAtras(hora) });
        }
      }
    }

    var amostra = { leads: leads, eventos: eventos, fonte: 'protótipo' };
    Store.gravar(CHAVE_SEED, amostra);
    return amostra;
  }

  /* =================================================================
     Carga
     -----------------------------------------------------------------
     Em produção o estado da fonte é honesto: 'api' quando o backend
     respondeu (mesmo que vazio) e 'erro' quando a Function falhou. O
     seed só pinta a tela em localhost — produção nunca mostra dado
     fictício, porque ter mock no painel induz a decisão errada.
     ================================================================= */
  function carregar() {
    /* Localhost nunca tem a Function: nem tenta, vai de seed. */
    if (ehLocal()) {
      dados = seed();
      return Promise.resolve(dados);
    }

    return fetch(API, { credentials: 'include', cache: 'no-store',
                        headers: { 'Accept': 'application/json' } })
      .then(function (r) {
        if (!r.ok) { var e = new Error('api ' + r.status); e.http = r.status; throw e; }
        return r.json();
      })
      .then(function (j) {
        dados = {
          leads:   Array.isArray(j.leads) ? j.leads : [],
          eventos: Array.isArray(j.eventos) ? j.eventos : [],
          fonte:   'api'
        };
        /* Reset de resquício de dado mockado guardado em versões
           anteriores — a partir desta versão nunca mais gravamos seed
           em produção. */
        try { Store.gravar(CHAVE_SEED, null); } catch (_) { /* ignore */ }
        return dados;
      })
      .catch(function (err) {
        /* Em produção não mostramos amostra — a tela fica vazia com
           aviso de erro. "Amostra plausível" cheira a dado real e já
           causou confusão (PR fix dos leads mockados). */
        dados = { leads: [], eventos: [], fonte: 'erro', erro: (err && err.http) || 'rede' };
        return dados;
      });
  }

  function fonte() { return dados.fonte; }
  function detalheErro() { return dados.erro || null; }

  /* =================================================================
     Leads — derivações
     ================================================================= */
  function leads(filtro) {
    var lista = dados.leads.slice();
    if (filtro && filtro !== 'todos') {
      lista = lista.filter(function (x) { return x.status === filtro; });
    }
    return lista.sort(function (a, b) {
      return String(b.criado_em).localeCompare(String(a.criado_em));
    });
  }

  function resumoLeads() {
    var r = { total: 0, novo: 0, contato: 0, ganho: 0, perdido: 0,
              abertos: 0, ganhosNoMes: 0, conversao: 0 };
    var corte = hAtras(30 * 24);
    dados.leads.forEach(function (x) {
      r.total++;
      if (r[x.status] != null) r[x.status]++;
      if (STATUS[x.status] && STATUS[x.status].aberto) r.abertos++;
      if (x.status === 'ganho' && x.criado_em >= corte) r.ganhosNoMes++;
    });
    var decididos = r.ganho + r.perdido;
    r.conversao = decididos ? (r.ganho / decididos) * 100 : 0;
    return r;
  }

  /* =================================================================
     Eventos — derivações
     ================================================================= */
  function soTipo(tipo) {
    return dados.eventos.filter(function (e) { return e.tipo === tipo; });
  }

  function resumoEventos() {
    var pv = soTipo('pageview');
    var cliques = soTipo('clique');
    var tempos = soTipo('tempo');

    var sessoes = {};
    dados.eventos.forEach(function (e) { if (e.sessao) sessoes[e.sessao] = 1; });

    var somaTempo = tempos.reduce(function (s, e) { return s + (Number(e.valor) || 0); }, 0);
    var tempoMedio = tempos.length ? somaTempo / tempos.length : 0;

    var visitantes = Object.keys(sessoes).length;
    /* Taxa de rejeição aproximada: sessões com um único pageview. */
    var pvPorSessao = {};
    pv.forEach(function (e) { pvPorSessao[e.sessao] = (pvPorSessao[e.sessao] || 0) + 1; });
    var umaPagina = Object.keys(pvPorSessao).filter(function (s) { return pvPorSessao[s] === 1; }).length;
    var rejeicao = visitantes ? (umaPagina / visitantes) * 100 : 0;

    return {
      visitas: pv.length,
      visitantes: visitantes,
      cliques: cliques.length,
      tempoMedioMs: tempoMedio,
      rejeicao: rejeicao
    };
  }

  function contarPor(lista, chave) {
    var mapa = {};
    lista.forEach(function (e) {
      var k = e[chave] || '—';
      mapa[k] = (mapa[k] || 0) + 1;
    });
    return Object.keys(mapa).map(function (k) { return { rotulo: k, n: mapa[k] }; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  function topPaginas() { return contarPor(soTipo('pageview'), 'pagina').slice(0, 8); }
  function topCliques() { return contarPor(soTipo('clique'), 'alvo').slice(0, 8); }

  /* Série diária de visitas dos últimos `dias` dias, pronta para o
     gráfico: [{ dia:'2026-10-20', label:'20/10', n:34 }, ...]. */
  function seriePorDia(dias) {
    dias = dias || 30;
    var pv = soTipo('pageview');
    var balde = {};
    pv.forEach(function (e) {
      var dia = String(e.criado_em).slice(0, 10);
      balde[dia] = (balde[dia] || 0) + 1;
    });
    var serie = [];
    for (var i = dias - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var iso = d.toISOString().slice(0, 10);
      serie.push({ dia: iso, label: iso.slice(8, 10) + '/' + iso.slice(5, 7), n: balde[iso] || 0 });
    }
    return serie;
  }

  /* =================================================================
     Mutação de lead — PATCH na Function; protótipo atualiza a amostra
     ================================================================= */
  function aplicarLocal(id, campos) {
    var lead = dados.leads.filter(function (x) { return x.id === id; })[0];
    if (!lead) return null;
    Object.keys(campos).forEach(function (k) { lead[k] = campos[k]; });
    if (dados.fonte === 'protótipo') Store.gravar(CHAVE_SEED, dados);
    return lead;
  }

  function salvar(id, campos) {
    if (dados.fonte !== 'api') return Promise.resolve(aplicarLocal(id, campos));
    return fetch(API, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, campos: campos })
    }).then(function (r) {
      if (!r.ok) throw new Error('patch ' + r.status);
      return aplicarLocal(id, campos);
    });
  }

  function mudarStatus(id, status) {
    if (!STATUS[status]) return Promise.resolve(null);
    return salvar(id, { status: status });
  }
  function anotar(id, texto) {
    return salvar(id, { nota: String(texto || '').trim() });
  }

  /* =================================================================
     Exportação
     ================================================================= */
  function exportarCSV() {
    var linhas = leads('todos');
    var cab = ['Nome', 'Empresa', 'Contato', 'Objetivo', 'Origem', 'Status', 'Recebido em', 'Observação'];
    var escapa = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    return [cab.map(escapa).join(';')].concat(linhas.map(function (x) {
      return [x.nome, x.empresa, x.contato, x.objetivo, x.origem,
              (STATUS[x.status] || {}).label || x.status,
              String(x.criado_em).slice(0, 10), x.nota].map(escapa).join(';');
    })).join('\r\n');
  }

  return {
    STATUS: STATUS,
    ORIGENS: ORIGENS,
    carregar: carregar,
    fonte: fonte,
    detalheErro: detalheErro,
    leads: leads,
    resumoLeads: resumoLeads,
    resumoEventos: resumoEventos,
    topPaginas: topPaginas,
    topCliques: topCliques,
    seriePorDia: seriePorDia,
    mudarStatus: mudarStatus,
    anotar: anotar,
    exportarCSV: exportarCSV
  };
})();
