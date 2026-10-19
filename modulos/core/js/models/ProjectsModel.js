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

  /* Status de um marco (entregável). Só três, de propósito: mais que
     isso vira taxonomia que ninguém mantém. */
  var MARCO_STATUS = {
    previsto:  { label: 'Previsto',     cor: 'gray'  },
    andamento: { label: 'Em execução',  cor: 'cyan'  },
    concluido: { label: 'Concluído',    cor: 'green' }
  };

  var MESES_CURTOS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  /* --- Seed --------------------------------------------------------
     Espelha os 4 cards que já estão na home + o Ledger como produto
     em destaque. Números são mock de protótipo.                      */
  function l(mes, meta, recebido, aReceber, gastos) {
    return { mes: mes, meta: meta || 0, recebido: recebido || 0, aReceber: aReceber || 0, gastos: gastos || 0 };
  }

  function mk(id, titulo, data, status, nota) {
    return { id: id, titulo: titulo, data: data, status: status, nota: nota || '' };
  }

  var SEED = [];

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

  /* id curto e único dentro de uma lista de marcos/notas */
  function novoId(prefixo) {
    return prefixo + '-' + Math.random().toString(36).slice(2, 8);
  }

  function normalizarMarco(m) {
    m = m || {};
    return {
      id:     m.id || novoId('mk'),
      titulo: String(m.titulo || '').trim() || 'Marco sem título',
      data:   m.data || '',
      status: MARCO_STATUS[m.status] ? m.status : 'previsto',
      nota:   String(m.nota || '').trim()
    };
  }

  function normalizarNota(n) {
    n = n || {};
    return {
      id:    n.id || novoId('nt'),
      data:  n.data || hoje(),
      autor: String(n.autor || '').trim(),
      texto: String(n.texto || '').trim()
    };
  }

  function normalizarProjeto(p) {
    p = p || {};
    var contato = p.contato || {};
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
      contato:     {
                     nome:  String(contato.nome  || '').trim(),
                     papel: String(contato.papel || '').trim(),
                     email: String(contato.email || '').trim()
                   },
      marcos:      (Array.isArray(p.marcos) ? p.marcos : [])
                     .map(normalizarMarco)
                     .sort(function (a, b) {
                       /* Sem data vai pro fim: é marco ainda não datado */
                       if (!a.data) return b.data ? 1 : 0;
                       if (!b.data) return -1;
                       return a.data < b.data ? -1 : 1;
                     }),
      notas:       (Array.isArray(p.notas) ? p.notas : [])
                     .map(normalizarNota)
                     .filter(function (n) { return n.texto; })
                     .sort(function (a, b) { return a.data > b.data ? -1 : 1; }),
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
    var lista = Array.isArray(bruto) ? bruto : SEED;
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
    var c = {
      andamento: 0, finalizado: 0, pendencia: 0,
      total: 0, publicados: 0, alertados: 0, alertas: 0,
      ok: 0, atencao: 0, risco: 0, clientes: 0
    };
    var clientes = {};
    carregar().forEach(function (p) {
      c.total++;
      if (p.publicado) c.publicados++;
      if (c[p.status] !== undefined) c[p.status]++;
      if (p.cliente) clientes[p.cliente] = true;
      c[saude(p).chave]++;
      var a = alertasProjeto(p);
      if (a.length) { c.alertados++; c.alertas += a.length; }
    });
    c.clientes = Object.keys(clientes).length;
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

  /* --- Marcos, progresso e saúde --------------------------------------
     O progresso do projeto NÃO é digitado: sai da razão entre marcos
     concluídos e marcos totais. Se ninguém cadastrou marco, a régua
     cai para o financeiro (recebido / contratado), que é o que sempre
     existe. Assim a barra nunca fica vazia nem mentindo.              */
  function progresso(p) {
    var marcos = p.marcos || [];
    var concluidos = marcos.filter(function (m) { return m.status === 'concluido'; }).length;
    var emExecucao = marcos.filter(function (m) { return m.status === 'andamento'; }).length;

    var proximo = marcos.filter(function (m) { return m.status !== 'concluido'; })[0] || null;

    if (marcos.length) {
      return {
        base: 'marcos',
        total: marcos.length,
        concluidos: concluidos,
        emExecucao: emExecucao,
        pct: Math.round((concluidos / marcos.length) * 100),
        proximo: proximo
      };
    }

    var t = totaisProjeto(p);
    var contratado = t.recebido + t.aReceber;
    return {
      base: 'financeiro',
      total: 0, concluidos: 0, emExecucao: 0,
      pct: contratado > 0 ? Math.round((t.recebido / contratado) * 100) : 0,
      proximo: null
    };
  }

  /* Semáforo do projeto. Deriva de alerta + prazo + margem — nunca é
     um campo que alguém marca à mão e esquece de atualizar. */
  function saude(p, ref) {
    var hojeISO = ref || hoje();
    var motivos = [];
    var alertas = alertasProjeto(p, hojeISO);

    alertas.forEach(function (a) { motivos.push(a.label); });

    var t = totaisProjeto(p);
    if (t.recebido > 0 && (t.recebido - t.gastos) < 0) motivos.push('Resultado negativo');

    /* Entrega chegando com marco em aberto ainda por fazer */
    if (p.entrega && p.status !== 'finalizado' && p.entrega >= hojeISO) {
      var faltam = diasEntre(hojeISO, p.entrega);
      var pg = progresso(p);
      if (faltam <= 30 && pg.pct < 70) {
        motivos.push('Faltam ' + faltam + ' dias e ' + pg.pct + '% concluído');
      }
    }

    if (p.status === 'pendencia') motivos.push('Marcado como pendência');

    /* Uma pendência isolada é atenção; prazo estourado ou duas frentes
       abertas ao mesmo tempo é risco. Atraso de entrega vai direto para
       risco porque é o único que não se resolve com um telefonema. */
    var atrasado = alertas.some(function (a) { return a.tipo === 'entrega-estourada'; });
    var chave = 'ok';
    if (atrasado || motivos.length >= 2) chave = 'risco';
    else if (motivos.length === 1) chave = 'atencao';

    return {
      chave: chave,
      label: chave === 'ok' ? 'Saudável' : (chave === 'atencao' ? 'Atenção' : 'Risco'),
      motivos: motivos
    };
  }

  /* Série de 12 meses de UM projeto — mesma forma da serieMensal geral,
     para que a ChartView sirva as duas telas sem saber a diferença. */
  function serieMensalProjeto(p, ano) {
    ano = String(ano || (p.lancamentos.length
      ? p.lancamentos[p.lancamentos.length - 1].mes.slice(0, 4)
      : new Date().getFullYear()));

    var base = [];
    for (var m = 1; m <= 12; m++) {
      var mm = (m < 10 ? '0' : '') + m;
      base.push({
        mes: ano + '-' + mm, label: MESES_CURTOS[m - 1],
        meta: 0, recebido: 0, aReceber: 0, gastos: 0
      });
    }
    var indice = {};
    base.forEach(function (b, i) { indice[b.mes] = i; });

    p.lancamentos.forEach(function (x) {
      var i = indice[x.mes];
      if (i === undefined) return;
      base[i].meta     += x.meta;
      base[i].recebido += x.recebido;
      base[i].aReceber += x.aReceber;
      base[i].gastos   += x.gastos;
    });
    return base;
  }

  function anosProjeto(p) {
    var set = {};
    p.lancamentos.forEach(function (x) { set[x.mes.slice(0, 4)] = true; });
    var anos = Object.keys(set).sort();
    return anos.length ? anos : [String(new Date().getFullYear())];
  }

  /* --- Escrita parcial -------------------------------------------------
     A tela de gestão do projeto edita pedaços (um marco, uma nota, um
     lançamento). Passar o projeto inteiro de volta a cada clique é
     convite a sobrescrever o que outra aba acabou de gravar.          */
  function atualizarCampos(id, patch) {
    var p = getById(id);
    if (!p) return null;
    Object.keys(patch || {}).forEach(function (k) { p[k] = patch[k]; });
    return salvar(p);
  }

  function salvarMarco(id, marco) {
    var p = getById(id);
    if (!p) return null;
    var norm = normalizarMarco(marco);
    var i = p.marcos.findIndex(function (m) { return m.id === norm.id; });
    if (i >= 0) p.marcos[i] = norm;
    else p.marcos.push(norm);
    return salvar(p);
  }

  function removerMarco(id, marcoId) {
    var p = getById(id);
    if (!p) return null;
    p.marcos = p.marcos.filter(function (m) { return m.id !== marcoId; });
    return salvar(p);
  }

  function adicionarNota(id, nota) {
    var p = getById(id);
    if (!p) return null;
    p.notas.unshift(normalizarNota(nota));
    return salvar(p);
  }

  function removerNota(id, notaId) {
    var p = getById(id);
    if (!p) return null;
    p.notas = p.notas.filter(function (n) { return n.id !== notaId; });
    return salvar(p);
  }

  function salvarLancamentos(id, lancamentos) {
    return atualizarCampos(id, { lancamentos: lancamentos });
  }

  /* Clientes distintos, com o que cada um representa na carteira */
  function carteiraClientes(ano) {
    var mapa = {};
    getAll().forEach(function (p) {
      var nome = p.cliente || 'Sem cliente definido';
      if (!mapa[nome]) {
        mapa[nome] = { cliente: nome, projetos: 0, recebido: 0, aReceber: 0, alertas: 0 };
      }
      var c = mapa[nome];
      c.projetos++;
      c.alertas += alertasProjeto(p).length;
      p.lancamentos.forEach(function (x) {
        if (ano && x.mes.slice(0, 4) !== String(ano)) return;
        c.recebido += x.recebido;
        c.aReceber += x.aReceber;
      });
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; })
      .sort(function (a, b) { return (b.recebido + b.aReceber) - (a.recebido + a.aReceber); });
  }

  return {
    STATUS: STATUS,
    MARCO_STATUS: MARCO_STATUS,
    MESES_CURTOS: MESES_CURTOS,
    novoId: novoId,
    progresso: progresso,
    saude: saude,
    serieMensalProjeto: serieMensalProjeto,
    anosProjeto: anosProjeto,
    atualizarCampos: atualizarCampos,
    salvarMarco: salvarMarco,
    removerMarco: removerMarco,
    adicionarNota: adicionarNota,
    removerNota: removerNota,
    salvarLancamentos: salvarLancamentos,
    carteiraClientes: carteiraClientes,
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
