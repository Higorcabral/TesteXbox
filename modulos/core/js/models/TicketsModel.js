/* =================================================================
   HIFERA · Core · Model · Chamados
   -----------------------------------------------------------------
   Mesma mecânica de um service desk clássico:
     Tipo (Chamado | Requisição)
     → Categoria → Sistema → Módulo   (cascata dependente)
     → o Módulo define a Fila automaticamente
     → Prioridade define o SLA de resposta e de solução
     → histórico de comentários, anexos e avaliação no fim

   Taxonomia e dados são da Hifera e fictícios.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.TicketsModel = (function () {
  'use strict';

  var Store = HiferaAdmin.StoreModel;
  var CHAVE = 'hifera.admin.chamados.v1';

  /* --- Domínios ---------------------------------------------------- */
  var TIPOS = {
    chamado:    { label: 'Chamado',    hint: 'Algo parou de funcionar', cor: 'red',  icone: 'alerta' },
    requisicao: { label: 'Requisição', hint: 'Pedido de algo novo',     cor: 'cyan', icone: 'mais' }
  };

  var PRIORIDADES = {
    Baixa:   { label: 'Baixa',   cor: 'cinza',  ordem: 1, resposta: 24, solucao: 120 },
    Média:   { label: 'Média',   cor: 'cyan',   ordem: 2, resposta: 8,  solucao: 72  },
    Alta:    { label: 'Alta',    cor: 'amber',  ordem: 3, resposta: 4,  solucao: 24  },
    Urgente: { label: 'Urgente', cor: 'red',    ordem: 4, resposta: 2,  solucao: 8   }
  };

  var STATUS = {
    'Aberto':            { label: 'Aberto',            cor: 'cyan',   aberto: true,  ordem: 1 },
    'Em andamento':      { label: 'Em andamento',      cor: 'indigo', aberto: true,  ordem: 2 },
    'Aguardando cliente':{ label: 'Aguardando cliente',cor: 'amber',  aberto: true,  ordem: 3, pausaSla: true },
    'Resolvido':         { label: 'Resolvido',         cor: 'green',  aberto: false, ordem: 4 },
    'Fechado':           { label: 'Fechado',           cor: 'cinza',  aberto: false, ordem: 5 },
    'Cancelado':         { label: 'Cancelado',         cor: 'cinza',  aberto: false, ordem: 6 }
  };

  var FILAS = {
    'produto':   { label: 'Suporte a Produto',  email: 'suporte@hifera.com.br' },
    'automacao': { label: 'Automações',         email: 'automacoes@hifera.com.br' },
    'web':       { label: 'Web & Presença',     email: 'web@hifera.com.br' },
    'infra':     { label: 'Infra & Segurança',  email: 'infra@hifera.com.br' },
    'dados':     { label: 'Dados & Relatórios', email: 'dados@hifera.com.br' }
  };

  /* --- Cascata Categoria → Sistema → Módulo ------------------------
     Cada folha carrega a fila que atende. É o que dispensa o usuário
     de saber para quem mandar.                                      */
  var CASCATA = [
    { categoria: 'Produto Hifera', sistemas: [
      { nome: 'Controle Financeiro (Ledger)', modulos: [
        { nome: 'Fluxo de caixa',        fila: 'produto' },
        { nome: 'Contas a pagar/receber',fila: 'produto' },
        { nome: 'Importação de extrato', fila: 'dados'   },
        { nome: 'Metas e categorias',    fila: 'produto' },
        { nome: 'Relatórios',            fila: 'dados'   }
      ]},
      { nome: 'Gestão de Relacionamento (CRM)', modulos: [
        { nome: 'Pipeline de vendas',  fila: 'produto' },
        { nome: 'Follow-up automático',fila: 'automacao' },
        { nome: 'Relatórios comerciais', fila: 'dados' }
      ]},
      { nome: 'Gestão de Estoque', modulos: [
        { nome: 'Entrada e saída',       fila: 'produto' },
        { nome: 'Código de barras',      fila: 'produto' },
        { nome: 'Alertas de mínimo',     fila: 'automacao' },
        { nome: 'Curva ABC',             fila: 'dados' }
      ]},
      { nome: 'Mecânica Automotiva', modulos: [
        { nome: 'Ordem de serviço', fila: 'produto' },
        { nome: 'Orçamentos',       fila: 'produto' },
        { nome: 'Controle de frota',fila: 'produto' }
      ]},
      { nome: 'Salão de Manicure', modulos: [
        { nome: 'Agenda online',        fila: 'produto' },
        { nome: 'Cadastro de clientes', fila: 'produto' },
        { nome: 'Lembretes automáticos',fila: 'automacao' }
      ]}
    ]},
    { categoria: 'Automação & Integração', sistemas: [
      { nome: 'WhatsApp', modulos: [
        { nome: 'Envio de mensagens', fila: 'automacao' },
        { nome: 'Templates aprovados',fila: 'automacao' },
        { nome: 'Número e conexão',   fila: 'infra' }
      ]},
      { nome: 'Integrações bancárias', modulos: [
        { nome: 'Conciliação',   fila: 'automacao' },
        { nome: 'Boletos',       fila: 'automacao' },
        { nome: 'Chave Pix',     fila: 'infra' }
      ]},
      { nome: 'Rotinas agendadas', modulos: [
        { nome: 'Job não executou', fila: 'automacao' },
        { nome: 'Nova rotina',      fila: 'automacao' }
      ]},
      { nome: 'Planilhas & arquivos', modulos: [
        { nome: 'Importação em massa', fila: 'dados' },
        { nome: 'Exportação agendada', fila: 'dados' }
      ]}
    ]},
    { categoria: 'Site & Presença digital', sistemas: [
      { nome: 'Site institucional', modulos: [
        { nome: 'Conteúdo e textos', fila: 'web' },
        { nome: 'Formulário de contato', fila: 'web' },
        { nome: 'Performance',       fila: 'web' }
      ]},
      { nome: 'Domínio & e-mail', modulos: [
        { nome: 'Configuração de DNS', fila: 'infra' },
        { nome: 'Caixa de e-mail',     fila: 'infra' }
      ]},
      { nome: 'SEO & Analytics', modulos: [
        { nome: 'Indexação',   fila: 'web' },
        { nome: 'Tag de medição', fila: 'web' }
      ]}
    ]},
    { categoria: 'Infraestrutura & Acesso', sistemas: [
      { nome: 'Hospedagem', modulos: [
        { nome: 'Indisponibilidade', fila: 'infra' },
        { nome: 'Lentidão',          fila: 'infra' },
        { nome: 'Certificado SSL',   fila: 'infra' }
      ]},
      { nome: 'Contas & permissões', modulos: [
        { nome: 'Novo usuário',      fila: 'infra' },
        { nome: 'Reset de senha',    fila: 'infra' },
        { nome: 'Mudança de perfil', fila: 'infra' }
      ]},
      { nome: 'Backup', modulos: [
        { nome: 'Restauração',   fila: 'infra' },
        { nome: 'Rotina falhou', fila: 'infra' }
      ]}
    ]},
    { categoria: 'Dados & Relatórios', sistemas: [
      { nome: 'Painéis', modulos: [
        { nome: 'Número divergente', fila: 'dados' },
        { nome: 'Novo indicador',    fila: 'dados' }
      ]},
      { nome: 'Exportações', modulos: [
        { nome: 'Excel / CSV', fila: 'dados' },
        { nome: 'PDF',         fila: 'dados' }
      ]}
    ]}
  ];

  /* --- Navegação da cascata ---------------------------------------- */
  function categorias() {
    return CASCATA.map(function (c) { return c.categoria; });
  }
  function sistemas(categoria) {
    var c = CASCATA.filter(function (x) { return x.categoria === categoria; })[0];
    return c ? c.sistemas.map(function (s) { return s.nome; }) : [];
  }
  function modulos(categoria, sistema) {
    var c = CASCATA.filter(function (x) { return x.categoria === categoria; })[0];
    if (!c) return [];
    var s = c.sistemas.filter(function (x) { return x.nome === sistema; })[0];
    return s ? s.modulos.map(function (m) { return m.nome; }) : [];
  }
  /* A fila sai da folha da cascata — o usuário nunca escolhe */
  function filaDe(categoria, sistema, modulo) {
    var c = CASCATA.filter(function (x) { return x.categoria === categoria; })[0];
    if (!c) return null;
    var s = c.sistemas.filter(function (x) { return x.nome === sistema; })[0];
    if (!s) return null;
    var m = s.modulos.filter(function (x) { return x.nome === modulo; })[0];
    return m ? m.fila : null;
  }

  /* --- Datas / SLA -------------------------------------------------- */
  function agora() { return new Date(); }
  function iso(d) { return d.toISOString(); }
  function horasEntre(a, b) {
    return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
  }
  function somarHoras(isoStr, h) {
    return new Date(new Date(isoStr).getTime() + h * 3600000).toISOString();
  }

  /* Estado do SLA de solução. "Aguardando cliente" congela o relógio —
     não é justo contar contra a fila o tempo em que a bola está do
     outro lado. */
  function sla(t) {
    var p = PRIORIDADES[t.prioridade] || PRIORIDADES['Média'];
    var limite = somarHoras(t.aberto_em, p.solucao);
    var st = STATUS[t.status] || {};

    if (!st.aberto) {
      var fim = t.resolvido_em || t.fechado_em || t.atualizado_em;
      var estourou = fim ? new Date(fim) > new Date(limite) : false;
      return {
        limite: limite, encerrado: true, estourado: estourou,
        pct: 100,
        rotulo: estourou ? 'Resolvido fora do prazo' : 'Resolvido no prazo',
        horasRestantes: 0
      };
    }
    if (st.pausaSla) {
      return {
        limite: limite, encerrado: false, estourado: false, pausado: true,
        pct: null, rotulo: 'SLA pausado — aguardando cliente', horasRestantes: null
      };
    }

    var restante = horasEntre(iso(agora()), limite);
    var total = p.solucao;
    var decorrido = total - restante;
    return {
      limite: limite,
      encerrado: false,
      estourado: restante < 0,
      pct: Math.max(0, Math.min(100, (decorrido / total) * 100)),
      horasRestantes: restante,
      rotulo: restante < 0
        ? 'SLA estourado há ' + formatarHoras(-restante)
        : 'Vence em ' + formatarHoras(restante)
    };
  }

  function formatarHoras(h) {
    if (h < 1) return Math.max(1, Math.round(h * 60)) + ' min';
    if (h < 48) return Math.round(h) + 'h';
    return Math.round(h / 24) + ' dias';
  }

  /* --- Normalização -------------------------------------------------- */
  function novoId(lista) {
    var maior = 0;
    lista.forEach(function (t) {
      var n = parseInt(String(t.id).replace(/\D/g, ''), 10);
      if (n > maior) maior = n;
    });
    return 'HIF-' + String(maior + 1).padStart(4, '0');
  }

  function normalizar(t) {
    var criado = t.aberto_em || iso(agora());
    return {
      id:          String(t.id || ''),
      tipo:        TIPOS[t.tipo] ? t.tipo : 'chamado',
      titulo:      String(t.titulo || '').trim(),
      descricao:   String(t.descricao || '').trim(),
      categoria:   String(t.categoria || ''),
      sistema:     String(t.sistema || ''),
      modulo:      String(t.modulo || ''),
      fila:        FILAS[t.fila] ? t.fila : (filaDe(t.categoria, t.sistema, t.modulo) || 'produto'),
      prioridade:  PRIORIDADES[t.prioridade] ? t.prioridade : 'Média',
      status:      STATUS[t.status] ? t.status : 'Aberto',
      solicitante: String(t.solicitante || ''),
      email:       String(t.email || ''),
      empresa:     String(t.empresa || ''),
      operacao:    String(t.operacao || ''),
      vinculo:     String(t.vinculo || ''),
      aberto_em:   criado,
      atualizado_em: t.atualizado_em || criado,
      resolvido_em:  t.resolvido_em || '',
      fechado_em:    t.fechado_em || '',
      anexos:      (t.anexos || []).map(function (a) {
        return { nome: String(a.nome || ''), tamanho: a.tamanho || 0, tipo: a.tipo || '' };
      }),
      comentarios: (t.comentarios || []).map(function (c) {
        return {
          autor: String(c.autor || ''),
          papel: c.papel === 'cliente' ? 'cliente' : 'agente',
          quando: c.quando || criado,
          texto: String(c.texto || ''),
          solucao: !!c.solucao
        };
      }),
      avaliacao: t.avaliacao
        ? { nota: Number(t.avaliacao.nota) || 0,
            comentario: String(t.avaliacao.comentario || ''),
            quando: t.avaliacao.quando || '' }
        : null
    };
  }

  /* --- Semente ------------------------------------------------------
     Datas relativas a hoje pra a tela nunca parecer congelada.      */
  function hAtras(h) { return new Date(Date.now() - h * 3600000).toISOString(); }
  function dAtras(d) { return hAtras(d * 24); }

  function seed() {
    return [].map(normalizar);
  }

  /* --- Persistência --------------------------------------------------- */
  var cache = null;

  function carregar() {
    if (cache) return cache;
    var bruto = Store.ler(CHAVE, null);
    cache = Array.isArray(bruto) ? bruto.map(normalizar) : seed();
    return cache;
  }
  function persistir() { Store.gravar(CHAVE, cache); }

  function getAll() {
    return carregar().slice().sort(function (a, b) {
      return new Date(b.aberto_em) - new Date(a.aberto_em);
    });
  }
  function getById(id) {
    return carregar().filter(function (t) { return t.id === id; })[0] || null;
  }

  function salvar(dados) {
    carregar();
    var t = normalizar(dados);
    if (!t.id) t.id = novoId(cache);
    t.atualizado_em = iso(agora());

    var i = cache.findIndex(function (x) { return x.id === t.id; });
    if (i >= 0) cache[i] = t; else cache.unshift(t);
    persistir();
    return t;
  }

  function mudarStatus(id, status) {
    var t = getById(id);
    if (!t || !STATUS[status]) return null;
    t.status = status;
    t.atualizado_em = iso(agora());
    if (status === 'Resolvido' && !t.resolvido_em) t.resolvido_em = t.atualizado_em;
    if (status === 'Fechado' && !t.fechado_em) t.fechado_em = t.atualizado_em;
    persistir();
    return t;
  }

  /* papel: 'agente' (padrão, painel interno) ou 'cliente' (portal).
     Só agente marca solução — cliente não fecha o próprio chamado. */
  function comentar(id, texto, autor, ehSolucao, papel) {
    var t = getById(id);
    if (!t || !String(texto || '').trim()) return null;
    var ehCliente = papel === 'cliente';
    var solucao = !!ehSolucao && !ehCliente;
    t.comentarios.push({
      autor: autor || (ehCliente ? 'Cliente' : 'Higor Cabral'),
      papel: ehCliente ? 'cliente' : 'agente',
      quando: iso(agora()), texto: String(texto).trim(), solucao: solucao
    });
    t.atualizado_em = iso(agora());
    if (solucao && STATUS[t.status] && STATUS[t.status].aberto) {
      t.status = 'Resolvido';
      t.resolvido_em = t.atualizado_em;
    }
    /* Cliente respondendo destrava o relógio: 'Aguardando cliente'
       pausa o SLA, e a bola acabou de voltar para a Hifera. */
    if (ehCliente && t.status === 'Aguardando cliente') {
      t.status = 'Em andamento';
    }
    persistir();
    return t;
  }

  /* Só o que pertence a uma empresa. É o filtro que o portal do
     cliente usa — ele nunca enxerga chamado de outro cliente. */
  function porEmpresa(empresa) {
    var alvo = String(empresa || '').trim().toLowerCase();
    if (!alvo) return [];
    return getAll().filter(function (t) {
      return String(t.empresa || '').trim().toLowerCase() === alvo;
    });
  }

  function avaliar(id, nota, comentario) {
    var t = getById(id);
    if (!t) return null;
    t.avaliacao = {
      nota: Math.max(1, Math.min(5, Number(nota) || 0)),
      comentario: String(comentario || '').trim(),
      quando: iso(agora())
    };
    persistir();
    return t;
  }

  function remover(id) {
    carregar();
    cache = cache.filter(function (t) { return t.id !== id; });
    persistir();
  }

  function restaurarSeed() {
    cache = seed();
    persistir();
    return cache;
  }

  /* --- Agregados ------------------------------------------------------ */
  function panorama() {
    var lista = getAll();
    var p = {
      total: lista.length, abertos: 0, andamento: 0, aguardando: 0,
      resolvidos: 0, fechados: 0, cancelados: 0,
      estourados: 0, urgentes: 0, semDono: 0,
      notaMedia: 0, avaliados: 0, satisfacao: 0,
      porFila: {}, porPrioridade: {}, porCategoria: {}, porTipo: { chamado: 0, requisicao: 0 }
    };
    var somaNota = 0, somaResolucao = 0, contResolucao = 0;

    lista.forEach(function (t) {
      var st = STATUS[t.status] || {};
      if (t.status === 'Aberto') p.abertos++;
      if (t.status === 'Em andamento') p.andamento++;
      if (t.status === 'Aguardando cliente') p.aguardando++;
      if (t.status === 'Resolvido') p.resolvidos++;
      if (t.status === 'Fechado') p.fechados++;
      if (t.status === 'Cancelado') p.cancelados++;

      var s = sla(t);
      if (st.aberto && s.estourado) p.estourados++;
      if (st.aberto && t.prioridade === 'Urgente') p.urgentes++;

      p.porTipo[t.tipo] = (p.porTipo[t.tipo] || 0) + 1;
      p.porFila[t.fila] = (p.porFila[t.fila] || 0) + 1;
      p.porPrioridade[t.prioridade] = (p.porPrioridade[t.prioridade] || 0) + 1;
      p.porCategoria[t.categoria] = (p.porCategoria[t.categoria] || 0) + 1;

      if (t.avaliacao && t.avaliacao.nota) { somaNota += t.avaliacao.nota; p.avaliados++; }
      if (t.resolvido_em) {
        somaResolucao += horasEntre(t.aberto_em, t.resolvido_em);
        contResolucao++;
      }
    });

    p.emAberto = p.abertos + p.andamento + p.aguardando;
    p.notaMedia = p.avaliados ? somaNota / p.avaliados : 0;
    p.satisfacao = p.avaliados ? (p.notaMedia / 5) * 100 : 0;
    p.tempoMedioResolucao = contResolucao ? somaResolucao / contResolucao : 0;
    p.dentroSla = lista.filter(function (t) {
      return !STATUS[t.status].aberto && !sla(t).estourado;
    }).length;
    var encerrados = p.resolvidos + p.fechados;
    p.pctSla = encerrados ? (p.dentroSla / encerrados) * 100 : 100;
    return p;
  }

  /* Volume por mês: abertos vs resolvidos, últimos N meses */
  function serieMensal(meses) {
    meses = meses || 6;
    var hoje = new Date();
    var buckets = [];
    for (var i = meses - 1; i >= 0; i--) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      buckets.push({
        mes: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
        label: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][d.getMonth()],
        abertos: 0, resolvidos: 0
      });
    }
    var idx = {};
    buckets.forEach(function (b, i) { idx[b.mes] = i; });

    getAll().forEach(function (t) {
      var ma = String(t.aberto_em).slice(0, 7);
      if (idx[ma] !== undefined) buckets[idx[ma]].abertos++;
      if (t.resolvido_em) {
        var mr = String(t.resolvido_em).slice(0, 7);
        if (idx[mr] !== undefined) buckets[idx[mr]].resolvidos++;
      }
    });
    return buckets;
  }

  function exportarJSON() { return JSON.stringify(getAll(), null, 2); }

  return {
    TIPOS: TIPOS, PRIORIDADES: PRIORIDADES, STATUS: STATUS, FILAS: FILAS, CASCATA: CASCATA,
    categorias: categorias, sistemas: sistemas, modulos: modulos, filaDe: filaDe,
    getAll: getAll, getById: getById, salvar: salvar, remover: remover,
    mudarStatus: mudarStatus, comentar: comentar, avaliar: avaliar,
    restaurarSeed: restaurarSeed, exportarJSON: exportarJSON,
    porEmpresa: porEmpresa,
    sla: sla, formatarHoras: formatarHoras, horasEntre: horasEntre,
    panorama: panorama, serieMensal: serieMensal
  };
})();
