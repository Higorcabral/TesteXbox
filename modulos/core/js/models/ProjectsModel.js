/* =================================================================
   HIFERA ADMIN · Model · Projetos
   Fonte única de verdade do painel e (via hidratação) da vitrine
   pública. Cada projeto carrega os campos que aparecem no card da
   home + um livro-caixa mensal que alimenta KPIs e gráfico.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.ProjectsModel = (function () {
  'use strict';

  var Store  = HiferaAdmin.StoreModel;
  var CHAVE  = 'hifera.admin.projetos.v1';

  var STATUS = {
    andamento:  { label: 'Em andamento',  cor: 'cyan'  },
    finalizado: { label: 'Finalizado',    cor: 'green' },
    pendencia:  { label: 'Com pendência', cor: 'amber' }
  };

  var MESES_CURTOS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  /* --- Seed --------------------------------------------------------
     Espelha os 4 cards que já estão na home + o Ledger como produto
     em destaque. Números são mock de protótipo.                      */
  function l(mes, meta, recebido, aReceber, gastos) {
    return { mes: mes, meta: meta || 0, recebido: recebido || 0, aReceber: aReceber || 0, gastos: gastos || 0 };
  }

  var SEED = [
    {
      id: 'proj-crm',
      titulo: 'Projeto-CRM',
      categoria: 'CRM',
      segmento: 'Comercial & Vendas',
      ordem: 1,
      descricao: 'Pipeline visual, follow-up automático e relatórios comerciais para time de vendas.',
      link: 'projetos/Projeto-CRM/',
      novaAba: true,
      imagens: [{ src: 'assets/thumbs/crm.webp', alt: 'Painel comercial' }],
      publicado: true,
      destaque: false,
      status: 'finalizado',
      cliente: 'Distribuidora Vega',
      inicio: '2025-11-18',
      entrega: '2026-04-22',
      lancamentos: [
        l('2025-11', 3000, 3600, 0, 500),
        l('2025-12', 3000, 0,    0, 400),
        l('2026-01', 4000, 5400, 0, 900),
        l('2026-02', 4000, 4200, 0, 700),
        l('2026-03', 4000, 4200, 0, 600),
        l('2026-04', 4000, 4200, 0, 450)
      ]
    },
    {
      id: 'proj-mani',
      titulo: 'Projeto-Mani',
      categoria: 'Estética',
      segmento: 'Serviços & agendamento',
      ordem: 2,
      descricao: 'Agenda online, cadastro de clientes e lembretes automáticos para estúdio de manicure.',
      link: 'projetos/Projeto-Mani/',
      novaAba: true,
      imagens: [{ src: 'assets/thumbs/mani.webp', alt: 'Landing hero' }],
      publicado: true,
      destaque: false,
      status: 'finalizado',
      cliente: 'Studio Lune',
      inicio: '2025-12-09',
      entrega: '2026-05-16',
      lancamentos: [
        l('2025-12', 1500, 1500, 0, 200),
        l('2026-02', 2500, 2250, 0, 380),
        l('2026-03', 2500, 2625, 0, 420),
        l('2026-05', 2500, 2625, 0, 300)
      ]
    },
    {
      id: 'proj-mecan',
      titulo: 'Projeto-Mecan',
      categoria: 'Automotivo',
      segmento: 'Oficina & frota',
      ordem: 3,
      descricao: 'Ordem de serviço digital, controle de veículos e orçamentos para oficina mecânica.',
      link: 'projetos/Projeto-Mecan/',
      novaAba: true,
      imagens: [
        { src: 'assets/thumbs/mecan.webp',   alt: 'Hero' },
        { src: 'assets/thumbs/mecan-2.webp', alt: 'Agendamento' }
      ],
      publicado: true,
      destaque: false,
      status: 'andamento',
      cliente: 'Oficina RotaSul',
      inicio: '2026-04-01',
      entrega: '2026-10-30',
      lancamentos: [
        l('2026-04', 4000, 6600, 0,    1200),
        l('2026-05', 4000, 5400, 0,    1450),
        l('2026-08', 4000, 0,    4400, 1100),
        l('2026-09', 4000, 0,    3300, 800),
        l('2026-10', 3000, 0,    2300, 500)
      ]
    },
    {
      id: 'proj-stoq',
      titulo: 'Projeto-Stoq',
      categoria: 'Comércio',
      segmento: 'Estoque & logística',
      ordem: 4,
      descricao: 'Controle de estoque com código de barras, alertas de mínimo e curva ABC para distribuidora.',
      link: 'projetos/Projeto-Stoq/',
      novaAba: true,
      imagens: [
        { src: 'assets/thumbs/stoq.webp',   alt: 'Dashboard' },
        { src: 'assets/thumbs/stoq-2.webp', alt: 'Estoque' }
      ],
      publicado: true,
      destaque: false,
      status: 'pendencia',
      cliente: 'Atacado Norte',
      inicio: '2026-06-02',
      entrega: '2026-08-08',
      observacao: 'Parcela de julho vencida e homologação parada aguardando retorno do cliente.',
      lancamentos: [
        l('2026-06', 5000, 4500, 0,    1600),
        l('2026-07', 5000, 0,    5250, 1300),
        l('2026-08', 5000, 0,    5250, 900)
      ]
    },
    {
      id: 'produto-ledger',
      titulo: 'Controle Financeiro completo',
      categoria: 'Produto próprio',
      segmento: 'Financeiro & recorrência',
      ordem: 0,
      descricao: 'Fluxo de caixa, contas a pagar/receber, categorias, metas, parcelamentos, assinaturas recorrentes e importação de extratos em Excel.',
      link: 'apps/ledger/',
      novaAba: true,
      imagens: [{ src: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&auto=format&q=80', alt: 'Painel financeiro' }],
      publicado: true,
      destaque: true,
      status: 'andamento',
      cliente: 'Hifera (SaaS próprio)',
      inicio: '2025-07-14',
      entrega: '',
      preco: 'A partir de R$ 397/mês',
      bullets: [
        'Fluxo de caixa em tempo real',
        'Multi-conta e multi-categoria',
        'Importa & exporta Excel',
        'Relatórios prontos para o contador'
      ],
      lancamentos: [
        l('2025-07',  300,    0, 0,    400),
        l('2025-08',  300,  199, 0,    380),
        l('2025-09',  400,  398, 0,    350),
        l('2025-10',  500,  497, 0,    300),
        l('2025-11',  600,  596, 0,    280),
        l('2025-12',  700,  695, 0,    260),
        l('2026-01',  400,  397, 0,    120),
        l('2026-02',  800,  794, 0,    140),
        l('2026-03', 1200, 1191, 0,    160),
        l('2026-04', 1600, 1588, 0,    180),
        l('2026-05', 2000, 1985, 0,    210),
        l('2026-06', 2400, 2382, 0,    240),
        l('2026-07', 2800, 2779, 0,    260),
        l('2026-08', 3200, 1588, 1588, 280),
        l('2026-09', 3600, 0,    3176, 300),
        l('2026-10', 4000, 0,    3573, 320),
        l('2026-11', 4400, 0,    3970, 340),
        l('2026-12', 4800, 0,    4367, 360)
      ]
    }
  ];

  /* --- Normalização ------------------------------------------------
     Garante que qualquer objeto vindo do storage (ou de um import
     JSON manual) tenha a forma completa antes de circular no app.   */
  function num(v) {
    var n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return isFinite(n) ? n : 0;
  }

  function slug(txt) {
    return String(txt || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'projeto';
  }

  function normalizarProjeto(p) {
    p = p || {};
    return {
      id:          p.id || (slug(p.titulo) + '-' + Math.random().toString(36).slice(2, 7)),
      titulo:      p.titulo || 'Sem título',
      categoria:   p.categoria || 'Projeto',
      segmento:    p.segmento || '',
      ordem:       num(p.ordem),
      descricao:   p.descricao || '',
      link:        p.link || '',
      novaAba:     p.novaAba !== false,
      imagens:     (Array.isArray(p.imagens) ? p.imagens : [])
                     .map(function (im) {
                       if (typeof im === 'string') return { src: im, alt: '' };
                       return { src: (im && im.src) || '', alt: (im && im.alt) || '' };
                     })
                     .filter(function (im) { return im.src; }),
      publicado:   p.publicado !== false,
      destaque:    !!p.destaque,
      status:      STATUS[p.status] ? p.status : 'andamento',
      cliente:     p.cliente || '',
      inicio:      p.inicio || '',
      entrega:     p.entrega || '',
      preco:       p.preco || '',
      observacao:  p.observacao || '',
      bullets:     (Array.isArray(p.bullets) ? p.bullets : [])
                     .map(function (b) { return String(b || '').trim(); })
                     .filter(Boolean),
      lancamentos: (Array.isArray(p.lancamentos) ? p.lancamentos : [])
                     .filter(function (x) { return x && x.mes; })
                     .map(function (x) {
                       return {
                         mes:      x.mes,
                         meta:     num(x.meta),
                         recebido: num(x.recebido),
                         aReceber: num(x.aReceber),
                         gastos:   num(x.gastos)
                       };
                     })
                     .sort(function (a, b) { return a.mes < b.mes ? -1 : 1; })
    };
  }

  /* --- Acesso ------------------------------------------------------ */
  var cache = null;

  function carregar() {
    if (cache) return cache;
    var bruto = Store.ler(CHAVE, null);
    var lista = Array.isArray(bruto) && bruto.length ? bruto : SEED;
    cache = lista.map(normalizarProjeto);
    return cache;
  }

  function persistir() {
    Store.gravar(CHAVE, cache);
    /* Avisa outras abas abertas (a home hidratada, por exemplo) */
    try { window.dispatchEvent(new CustomEvent('hifera:projetos-alterados')); } catch (e) {}
  }

  function getAll() {
    return carregar().slice().sort(function (a, b) {
      if (a.ordem !== b.ordem) return a.ordem - b.ordem;
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
  }

  function getById(id) {
    var achado = carregar().filter(function (p) { return p.id === id; })[0];
    return achado ? JSON.parse(JSON.stringify(achado)) : null;
  }

  function salvar(projeto) {
    carregar();
    var norm = normalizarProjeto(projeto);
    var i = cache.findIndex(function (p) { return p.id === norm.id; });
    if (i >= 0) cache[i] = norm;
    else cache.push(norm);
    persistir();
    return norm;
  }

  function remover(id) {
    carregar();
    var antes = cache.length;
    cache = cache.filter(function (p) { return p.id !== id; });
    if (cache.length !== antes) persistir();
    return cache.length !== antes;
  }

  function alternarPublicado(id) {
    carregar();
    var p = cache.filter(function (x) { return x.id === id; })[0];
    if (!p) return null;
    p.publicado = !p.publicado;
    persistir();
    return p.publicado;
  }

  function restaurarSeed() {
    cache = SEED.map(normalizarProjeto);
    persistir();
    return cache;
  }

  function importarJSON(texto) {
    var dados = JSON.parse(texto);
    if (!Array.isArray(dados)) throw new Error('O JSON precisa ser uma lista de projetos.');
    cache = dados.map(normalizarProjeto);
    persistir();
    return cache;
  }

  function exportarJSON() {
    return JSON.stringify(getAll(), null, 2);
  }

  /* --- Agregados ---------------------------------------------------- */
  function anosDisponiveis() {
    var set = {};
    carregar().forEach(function (p) {
      p.lancamentos.forEach(function (x) { set[x.mes.slice(0, 4)] = true; });
    });
    var anos = Object.keys(set).sort();
    if (!anos.length) anos = [String(new Date().getFullYear())];
    return anos;
  }

  /* Série de 12 meses do ano pedido, somando todos os projetos */
  function serieMensal(ano) {
    ano = String(ano || anosDisponiveis().slice(-1)[0]);
    var base = [];
    for (var m = 1; m <= 12; m++) {
      var mm = (m < 10 ? '0' : '') + m;
      base.push({
        mes: ano + '-' + mm,
        label: MESES_CURTOS[m - 1],
        meta: 0, recebido: 0, aReceber: 0, gastos: 0
      });
    }
    var indice = {};
    base.forEach(function (b, i) { indice[b.mes] = i; });

    carregar().forEach(function (p) {
      p.lancamentos.forEach(function (x) {
        var i = indice[x.mes];
        if (i === undefined) return;
        base[i].meta     += x.meta;
        base[i].recebido += x.recebido;
        base[i].aReceber += x.aReceber;
        base[i].gastos   += x.gastos;
      });
    });
    return base;
  }

  function totaisProjeto(p) {
    return p.lancamentos.reduce(function (acc, x) {
      acc.meta     += x.meta;
      acc.recebido += x.recebido;
      acc.aReceber += x.aReceber;
      acc.gastos   += x.gastos;
      return acc;
    }, { meta: 0, recebido: 0, aReceber: 0, gastos: 0 });
  }

  /* Totais acumulados do ano (ou geral, se ano = null) */
  function totais(ano) {
    var acc = { meta: 0, recebido: 0, aReceber: 0, gastos: 0 };
    carregar().forEach(function (p) {
      p.lancamentos.forEach(function (x) {
        if (ano && x.mes.slice(0, 4) !== String(ano)) return;
        acc.meta     += x.meta;
        acc.recebido += x.recebido;
        acc.aReceber += x.aReceber;
        acc.gastos   += x.gastos;
      });
    });
    acc.resultado = acc.recebido - acc.gastos;
    acc.previsto  = acc.recebido + acc.aReceber;
    acc.pctMeta   = acc.meta > 0 ? (acc.recebido / acc.meta) * 100 : 0;
    acc.margem    = acc.recebido > 0 ? (acc.resultado / acc.recebido) * 100 : 0;
    return acc;
  }

  function contagemStatus() {
    var c = { andamento: 0, finalizado: 0, pendencia: 0, total: 0, publicados: 0, alertados: 0, alertas: 0 };
    carregar().forEach(function (p) {
      c.total++;
      if (p.publicado) c.publicados++;
      if (c[p.status] !== undefined) c[p.status]++;
      var a = alertasProjeto(p);
      if (a.length) { c.alertados++; c.alertas += a.length; }
    });
    return c;
  }

  /* --- Datas de referência ------------------------------------------ */
  function hoje() {
    var d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }
  function mesAtual() { return hoje().slice(0, 7); }

  /* --- Alertas -------------------------------------------------------
     Duas coisas que a tabela precisa gritar: dinheiro que era pra ter
     entrado e não entrou, e entrega que passou do prazo.              */
  function alertasProjeto(p, ref) {
    var hojeISO = ref || hoje();
    var mesRef = hojeISO.slice(0, 7);
    var lista = [];

    var vencidas = p.lancamentos.filter(function (x) {
      return x.aReceber > 0 && x.mes < mesRef;
    });
    if (vencidas.length) {
      var valor = vencidas.reduce(function (a, x) { return a + x.aReceber; }, 0);
      lista.push({
        tipo: 'parcela-vencida',
        label: vencidas.length === 1 ? 'Parcela vencida' : vencidas.length + ' parcelas vencidas',
        detalhe: 'Competência ' + vencidas.map(function (x) { return x.mes; }).join(', ') +
                 ' segue em aberto.',
        valor: valor,
        meses: vencidas.map(function (x) { return x.mes; })
      });
    }

    if (p.entrega && p.status !== 'finalizado' && p.entrega < hojeISO) {
      lista.push({
        tipo: 'entrega-estourada',
        label: 'Entrega atrasada',
        detalhe: 'Prazo era ' + p.entrega + ' e o projeto não está finalizado.',
        valor: 0,
        dias: diasEntre(p.entrega, hojeISO)
      });
    }

    return lista;
  }

  function diasEntre(aISO, bISO) {
    var a = new Date(aISO + 'T00:00:00');
    var b = new Date(bISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function todosAlertas(ref) {
    var saida = [];
    carregar().forEach(function (p) {
      alertasProjeto(p, ref).forEach(function (a) {
        saida.push({ projeto: p, alerta: a });
      });
    });
    return saida;
  }

  /* --- Forecast ------------------------------------------------------
     Mesma lógica do FinOps: média dos 3 últimos meses realizados,
     projetada para a frente. Só preenche meses ainda não realizados.  */
  function forecast(ano, janela) {
    janela = janela || 3;
    var serie = serieMensal(ano);
    var refMes = mesAtual();

    /* Último mês com receita reconhecida (nunca projeta pra trás) */
    var ultimoReal = -1;
    serie.forEach(function (m, i) {
      if (m.recebido > 0 && m.mes <= refMes) ultimoReal = i;
    });

    /* Ano inteiro no passado: nada a projetar */
    if (ultimoReal < 0 || String(ano) < refMes.slice(0, 4)) {
      return serie.map(function () { return null; });
    }

    var base = [];
    for (var i = ultimoReal; i >= 0 && base.length < janela; i--) {
      if (serie[i].recebido > 0) base.push(serie[i].recebido);
    }
    if (!base.length) return serie.map(function () { return null; });

    var media = base.reduce(function (a, b) { return a + b; }, 0) / base.length;

    return serie.map(function (m, i) {
      return i > ultimoReal ? Math.round(media) : null;
    });
  }

  /* Soma o que o forecast projeta a partir de hoje */
  function totalForecast(ano) {
    return forecast(ano).reduce(function (a, v) { return a + (v || 0); }, 0);
  }

  /* --- Janela do projeto na timeline --------------------------------- */
  function periodoProjeto(p) {
    var ini = p.inicio;
    var fim = p.entrega;
    if (!ini && p.lancamentos.length) ini = p.lancamentos[0].mes + '-01';
    if (!fim && p.lancamentos.length) fim = p.lancamentos[p.lancamentos.length - 1].mes + '-28';
    if (!ini && !fim) return null;
    if (!ini) ini = fim;
    if (!fim) fim = hoje() > ini ? hoje() : ini;
    return { inicio: ini, fim: fim < ini ? ini : fim };
  }

  return {
    STATUS: STATUS,
    MESES_CURTOS: MESES_CURTOS,
    slug: slug,
    getAll: getAll,
    getById: getById,
    salvar: salvar,
    remover: remover,
    alternarPublicado: alternarPublicado,
    restaurarSeed: restaurarSeed,
    importarJSON: importarJSON,
    exportarJSON: exportarJSON,
    anosDisponiveis: anosDisponiveis,
    serieMensal: serieMensal,
    totaisProjeto: totaisProjeto,
    totais: totais,
    contagemStatus: contagemStatus,
    hoje: hoje,
    mesAtual: mesAtual,
    diasEntre: diasEntre,
    alertasProjeto: alertasProjeto,
    todosAlertas: todosAlertas,
    forecast: forecast,
    totalForecast: totalForecast,
    periodoProjeto: periodoProjeto
  };
})();
