/* =================================================================
   HIFERA PORTAL · Model · O projeto visto pelo cliente
   -----------------------------------------------------------------
   Projeção do ProjectsModel para fora de casa. Existe por um motivo
   só, e ele é a regra mais importante deste arquivo:

     O QUE É DA HIFERA NÃO ATRAVESSA.

   Gastos, margem, resultado, meta de faturamento, observação interna
   e o diário do projeto são dados de gestão. Não é a view que esconde
   — é este model que **não devolve**. Se um campo novo aparecer no
   ProjectsModel, ele não chega aqui sozinho: precisa ser copiado à
   mão para a projeção abaixo, e essa fricção é intencional.

   Do dinheiro, o cliente vê só o lado dele: o que contratou, o que já
   pagou, o que falta pagar e quando vence.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.ClientProjectModel = (function () {
  'use strict';

  var Projetos = HiferaAdmin.ProjectsModel;

  /* --- Projeção -----------------------------------------------------
     Lista branca explícita. Nada de varrer o objeto e remover o que
     é sensível: some um campo da lista de bloqueio e vaza tudo. */
  function projetar(p) {
    var pg = Projetos.progresso(p);

    return {
      id:        p.id,
      titulo:    p.titulo,
      categoria: p.categoria,
      segmento:  p.segmento,
      descricao: p.descricao,
      status:    p.status,
      inicio:    p.inicio,
      entrega:   p.entrega,
      link:      p.link,
      capa:      (p.imagens[0] && p.imagens[0].src) || '',

      /* Marcos são só de leitura no portal: o cliente acompanha a
         entrega, quem move o marco é a Hifera. */
      marcos: p.marcos.map(function (m) {
        return { id: m.id, titulo: m.titulo, data: m.data, status: m.status, nota: m.nota };
      }),

      progresso: {
        pct:        pg.pct,
        base:       pg.base,
        total:      pg.total,
        concluidos: pg.concluidos,
        proximo:    pg.proximo
          ? { titulo: pg.proximo.titulo, data: pg.proximo.data, nota: pg.proximo.nota }
          : null
      },

      financeiro: financeiro(p)
    };
  }

  /* --- Financeiro, só o lado do cliente ------------------------------
     `meta` e `gastos` existem no lançamento e ficam onde estão.      */
  function financeiro(p) {
    var mesRef = Projetos.mesAtual();
    var pago = 0, aPagar = 0, vencido = 0;

    var parcelas = p.lancamentos
      .filter(function (x) { return x.recebido > 0 || x.aReceber > 0; })
      .map(function (x) {
        var vencida = x.aReceber > 0 && x.mes < mesRef;
        pago   += x.recebido;
        aPagar += x.aReceber;
        if (vencida) vencido += x.aReceber;
        return {
          mes:     x.mes,
          pago:    x.recebido,
          aPagar:  x.aReceber,
          vencida: vencida,
          quitada: x.aReceber === 0 && x.recebido > 0
        };
      });

    var contratado = pago + aPagar;
    return {
      contratado: contratado,
      pago:       pago,
      aPagar:     aPagar,
      vencido:    vencido,
      pctPago:    contratado > 0 ? Math.round((pago / contratado) * 100) : 0,
      parcelas:   parcelas
    };
  }

  /* --- Leitura, sempre com escopo ------------------------------------
     Sem cliente na sessão, devolve lista vazia. Nunca "todos". */
  function porCliente(cliente) {
    if (!cliente) return [];
    return Projetos.getAll()
      .filter(function (p) { return p.cliente === cliente; })
      .map(projetar);
  }

  /* O projeto que abre o portal: o que ainda está em aberto e entrega
     mais cedo; se estiver tudo entregue, o mais recente. */
  function principal(cliente) {
    var lista = porCliente(cliente);
    if (!lista.length) return null;

    var abertos = lista.filter(function (p) { return p.status !== 'finalizado'; });
    var alvo = abertos.length ? abertos : lista;

    return alvo.slice().sort(function (a, b) {
      if (a.entrega && b.entrega) return a.entrega < b.entrega ? -1 : 1;
      return a.entrega ? -1 : 1;
    })[0];
  }

  function porId(cliente, id) {
    return porCliente(cliente).filter(function (p) { return p.id === id; })[0] || null;
  }

  /* Só o que o cliente precisa ver como pendência dele: parcela em
     aberto vencida. Atraso de entrega é assunto da Hifera com o
     cliente numa conversa, não um selo vermelho no portal dele. */
  function pendencias(cliente) {
    var saida = [];
    porCliente(cliente).forEach(function (p) {
      if (p.financeiro.vencido > 0) {
        saida.push({
          tipo: 'parcela-vencida',
          projeto: p.titulo,
          valor: p.financeiro.vencido,
          meses: p.financeiro.parcelas
            .filter(function (x) { return x.vencida; })
            .map(function (x) { return x.mes; })
        });
      }
    });
    return saida;
  }

  return {
    porCliente: porCliente,
    principal: principal,
    porId: porId,
    pendencias: pendencias
  };
})();
