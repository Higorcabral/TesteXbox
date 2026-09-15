/* =================================================================
   HIFERA MÓDULOS · Admin · Controller · KPIs
   -----------------------------------------------------------------
   Junta os três lados da operação numa tela só: entrega (projetos),
   atendimento (chamados) e comercial (leads).

   Tudo é derivado. Não existe número digitado à mão em lugar nenhum —
   se um KPI está errado, o erro está no lançamento, não aqui.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.KpisController = (function () {
  'use strict';

  var P   = HiferaAdmin.ProjectsModel;
  var Fmt = HiferaAdmin.Fmt;

  function el(id) { return document.getElementById(id); }

  /* Os outros dois modelos são opcionais: se a tela for aberta sem eles
     carregados, o bloco correspondente diz isso em vez de quebrar. */
  function tickets() { return HiferaAdmin.TicketsModel || null; }
  function leads()   { return HiferaAdmin.LeadsModel || null; }

  function linha(rot, valor, nota) {
    return '<div class="kpi-linha">' +
             '<span class="kpi-label">' + Fmt.esc(rot) + '</span>' +
             '<strong>' + Fmt.esc(String(valor)) + '</strong>' +
             (nota ? '<span class="kpi-nota">' + Fmt.esc(nota) + '</span>' : '') +
           '</div>';
  }

  function pintarGerais(ano) {
    var t = P.totais(ano);
    /* todosAlertas(ref) recebe uma DATA ISO de referência, não um ano —
       passar o número quebrava em hojeISO.slice(). E sem argumento é o
       certo aqui: alerta é o que está vencido agora, não o que venceu
       dentro de um ano que a pessoa escolheu no seletor. */
    var alertas = P.todosAlertas().length;
    var cont = P.contagemStatus();
    var fc = P.totalForecast ? P.totalForecast(ano) : 0;

    var cartoes = [
      { rot: 'Recebido no ano',  val: Fmt.moeda(t.recebido),
        nota: t.meta ? Fmt.pct((t.recebido / t.meta) * 100) + ' da meta' : 'sem meta definida', tom: 'green' },
      { rot: 'A receber',        val: Fmt.moeda(t.aReceber),
        nota: fc ? 'forecast de ' + Fmt.moeda(fc) + ' até dezembro' : 'carteira contratada', tom: 'cyan' },
      { rot: 'Gastos',           val: Fmt.moeda(t.gastos),
        nota: t.recebido ? Fmt.pct((t.gastos / t.recebido) * 100) + ' do que foi recebido' : '—', tom: 'amber' },
      { rot: 'Resultado',        val: Fmt.moeda(t.recebido - t.gastos),
        nota: t.recebido ? 'margem de ' + Fmt.pct((1 - t.gastos / t.recebido) * 100) : '—', tom: 'indigo' },
      { rot: 'Projetos ativos',  val: cont.andamento || 0,
        nota: (cont.finalizado || 0) + ' finalizados', tom: 'cyan' },
      { rot: 'Alertas abertos',  val: alertas,
        nota: alertas ? 'parcela vencida ou entrega atrasada' : 'nada vencido', tom: alertas ? 'red' : 'green' }
    ];

    el('kpisGerais').innerHTML = cartoes.map(function (c) {
      return '<div class="kpi kpi--' + c.tom + '">' +
               '<span class="kpi-label">' + Fmt.esc(c.rot) + '</span>' +
               '<strong class="kpi-valor">' + Fmt.esc(String(c.val)) + '</strong>' +
               '<span class="kpi-nota">' + Fmt.esc(c.nota) + '</span>' +
             '</div>';
    }).join('');
  }

  function pintarEntrega(ano) {
    var cont = P.contagemStatus();
    var todos = P.getAll();
    var noAr = todos.filter(function (p) { return p.publicado; }).length;
    var atrasados = todos.filter(function (p) {
      return P.alertasProjeto(p).some(function (a) { return /entrega/i.test(a); });
    }).length;

    el('kpiEntrega').innerHTML =
      linha('Em andamento', cont.andamento || 0) +
      linha('Finalizados', cont.finalizado || 0) +
      linha('Com pendência', cont.pendencia || 0) +
      linha('Publicados no site', noAr, noAr + ' de ' + todos.length + ' na base') +
      linha('Entrega atrasada', atrasados, atrasados ? 'precisa de repactuação' : 'nenhuma');
  }

  function pintarAtendimento() {
    var T = tickets();
    var alvo = el('kpiAtendimento');
    if (!T) { alvo.innerHTML = '<p class="vazio">Modelo de chamados não carregado nesta tela.</p>'; return; }

    var p = T.panorama();
    alvo.innerHTML =
      linha('Em aberto', p.emAberto) +
      linha('Fora do SLA', p.estourados || 0, p.estourados ? 'precisa de resposta agora' : 'tudo no prazo') +
      linha('Resolvidos', p.resolvidos || 0) +
      linha('Dentro do SLA', p.pctSla != null ? Math.round(p.pctSla) + '%' : '—',
            p.dentroSla + ' de ' + (p.resolvidos + p.fechados) + ' encerrados no prazo') +
      linha('Satisfação', p.satisfacao ? p.satisfacao.toFixed(1) + '/5' : 'sem avaliação');
  }

  function pintarComercial() {
    var L = leads();
    var alvo = el('kpiComercial');
    if (!L) { alvo.innerHTML = '<p class="vazio">Modelo de leads não carregado nesta tela.</p>'; return; }

    var r = L.resumoGeral();
    var total = r.total || 0;
    /* Conversão sobre o que já foi decidido: lead ainda em contato não
       entrou nem saiu, e contá-lo como perda achata o número sem motivo. */
    var decididos = (r.ganho || 0) + (r.perdido || 0);
    var conv = decididos ? (r.ganho || 0) / decididos : 0;

    alvo.innerHTML =
      linha('Novos', r.novo || 0) +
      linha('Em contato', r.contato || 0) +
      linha('Ganhos', r.ganho || 0) +
      linha('Perdidos', r.perdido || 0) +
      linha('Conversão', decididos ? Fmt.pct(conv * 100) : '—',
            decididos ? 'sobre ' + decididos + ' já decididos, de ' + total + ' no total'
                      : 'nenhum lead decidido ainda');
  }

  function pintar() {
    var ano = HiferaAdmin.Shell.ano();
    pintarGerais(ano);
    pintarEntrega(ano);
    pintarAtendimento();
    pintarComercial();
  }

  function init() {
    if (!HiferaAdmin.Shell.iniciar(pintar)) return;
    pintar();
  }

  return { init: init, pintar: pintar };
})();
