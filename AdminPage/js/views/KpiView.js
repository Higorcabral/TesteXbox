/* =================================================================
   HIFERA ADMIN · View · Cartões de métrica
   Linha 1 = dinheiro (a receber, recebido, meta, gastos)
   Linha 2 = carteira (andamento, finalizados, pendência, resultado)
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.KpiView = (function () {
  'use strict';

  var Fmt = HiferaAdmin.Fmt;

  var ICONES = {
    aReceber:   '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    recebido:   '<path d="M20 6L9 17l-5-5"/>',
    meta:       '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    gastos:     '<path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
    andamento:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    finalizado: '<path d="M9 11l2.5 2.5L16 9"/><circle cx="12" cy="12" r="9"/>',
    pendencia:  '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none"/><path d="M10.3 3.9L2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    resultado:  '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>'
  };

  function icone(chave) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
           'stroke-linecap="round" stroke-linejoin="round">' + (ICONES[chave] || '') + '</svg>';
  }

  function card(c) {
    var barra = '';
    if (c.progresso !== undefined) {
      var pct = Math.max(0, Math.min(c.progresso, 100));
      barra = '<div class="kpi-bar" role="presentation">' +
                '<span style="width:' + pct.toFixed(1) + '%"></span>' +
              '</div>';
    }
    return '<article class="kpi kpi--' + c.tom + (c.alerta ? ' kpi--pisca' : '') + '">' +
             '<div class="kpi-top">' +
               '<span class="kpi-icon">' + icone(c.icone) + '</span>' +
               '<span class="kpi-label">' + Fmt.esc(c.label) + '</span>' +
             '</div>' +
             '<div class="kpi-valor">' + c.valor + '</div>' +
             barra +
             '<div class="kpi-nota">' + c.nota + '</div>' +
           '</article>';
  }

  function render(el, dados) {
    if (!el) return;
    var t = dados.totais;
    var c = dados.contagem;
    var alertas = dados.alertas || [];
    var forecast = dados.forecast || 0;

    var vencido = alertas
      .filter(function (a) { return a.alerta.tipo === 'parcela-vencida'; })
      .reduce(function (s, a) { return s + a.alerta.valor; }, 0);
    var atrasados = alertas.filter(function (a) { return a.alerta.tipo === 'entrega-estourada'; }).length;

    var cards = [
      {
        label: 'Valores a receber', icone: 'aReceber', tom: vencido > 0 ? 'red' : 'cyan-soft',
        valor: Fmt.moeda(t.aReceber),
        alerta: vencido > 0,
        nota: vencido > 0
          ? '<strong class="kpi-flag">' + Fmt.moeda(vencido) + ' vencido</strong> · carteira de ' +
            Fmt.moeda(t.previsto) + ' no ano'
          : 'Previsto entrando · carteira futura de ' + Fmt.moeda(t.previsto) + ' no ano'
      },
      {
        label: 'Recebido', icone: 'recebido', tom: 'cyan',
        valor: Fmt.moeda(t.recebido),
        nota: (t.meta > 0 ? Fmt.pct(t.pctMeta, 0) + ' da meta do período' : 'Sem meta definida no período') +
              (forecast > 0 ? ' · forecast de +' + Fmt.moeda(forecast) + ' até dezembro' : '')
      },
      {
        label: 'Meta', icone: 'meta', tom: 'indigo',
        valor: Fmt.moeda(t.meta),
        progresso: t.pctMeta,
        nota: t.meta > 0
          ? 'Faltam ' + Fmt.moeda(Math.max(0, t.meta - t.recebido)) + ' para bater'
          : 'Cadastre metas nos lançamentos'
      },
      {
        label: 'Gastos', icone: 'gastos', tom: 'amber',
        valor: Fmt.moeda(t.gastos),
        nota: t.recebido > 0
          ? Fmt.pct((t.gastos / t.recebido) * 100, 0) + ' do que foi recebido'
          : 'Nenhuma receita no período'
      },
      {
        label: 'Projetos em andamento', icone: 'andamento', tom: 'cyan',
        valor: String(c.andamento),
        nota: c.total + ' projetos na base · ' + c.publicados + ' publicados no site'
      },
      {
        label: 'Projetos finalizados', icone: 'finalizado', tom: 'green',
        valor: String(c.finalizado),
        nota: c.total > 0
          ? Fmt.pct((c.finalizado / c.total) * 100, 0) + ' da carteira entregue'
          : 'Carteira vazia'
      },
      {
        label: 'Projetos com pendência', icone: 'pendencia', tom: (c.pendencia || alertas.length) ? 'red' : 'green',
        valor: String(c.pendencia),
        alerta: alertas.length > 0,
        nota: alertas.length
          ? '<strong class="kpi-flag">' + alertas.length +
            (alertas.length === 1 ? ' alerta aberto' : ' alertas abertos') + '</strong>' +
            (atrasados ? ' · ' + atrasados + ' entrega(s) atrasada(s)' : '')
          : (c.pendencia > 0 ? 'Marcados como pendentes, sem alerta automático' : 'Nada travado por aqui')
      },
      {
        label: 'Resultado', icone: 'resultado', tom: t.resultado < 0 ? 'red' : 'green',
        valor: Fmt.moeda(t.resultado),
        nota: 'Recebido menos gastos · margem de ' + Fmt.pct(t.margem, 0)
      }
    ];

    el.innerHTML = cards.map(card).join('');
  }

  return { render: render };
})();
