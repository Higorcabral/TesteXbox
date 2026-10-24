/* =================================================================
   HIFERA · Site oficial · Medição de comportamento
   -----------------------------------------------------------------
   Responde "o que ajuda quem visita o site": quantas visitas, quais
   páginas, o que a pessoa clica, até onde rola e quanto tempo fica.

   Três regras que este arquivo não quebra:

     1. Nada roda sem consentimento. Enquanto HiferaConsent.permitido()
        for falso, nenhum evento é criado. O "aceitar" do banner é que
        liga a medição — por isso o grosso do código vive dentro de
        HiferaConsent.aoLiberar().

     2. Ninguém é identificado. A "sessão" é um id aleatório guardado
        no navegador, que não diz quem é a pessoa e não cruza com o
        lead do formulário. Sem IP, sem nome, sem e-mail.

     3. Só INSERE. Manda evento para o Supabase pela anon key, que por
        RLS só pode gravar. A leitura é da Function do admin.

   Sem configuração (js/site-config.js vazio), em localhost tudo vira
   log no console — dá para ver os eventos saindo sem backend nenhum.
   ================================================================= */
(function () {
  'use strict';

  var Site = window.HiferaSite;
  var Consent = window.HiferaConsent;
  if (!Site || !Consent) return;

  var CHAVE_SESSAO = 'hifera.site.sessao.v1';

  /* Id de sessão: aleatório, só um balde para agrupar eventos da mesma
     visita. Expira em 30 min de inatividade para não virar um id
     permanente de pessoa. */
  function novaSessao() {
    var id = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'sx-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return { id: id, visto: Date.now() };
  }

  function sessao() {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || 'null'); } catch (e) { /* */ }
    if (!s || !s.id || (Date.now() - (s.visto || 0) > 30 * 60000)) s = novaSessao();
    s.visto = Date.now();
    try { sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(s)); } catch (e) { /* */ }
    return s.id;
  }

  var ctx = Site.contexto();

  function registrar(tipo, extra) {
    var ev = {
      sessao:   sessao(),
      tipo:     tipo,
      pagina:   ctx.pagina,
      referrer: document.referrer || '',
      utm:      ctx.utm
    };
    if (extra) {
      if (extra.alvo != null)  ev.alvo = String(extra.alvo).slice(0, 120);
      if (extra.valor != null) ev.valor = extra.valor;
    }
    Site.inserir('site_events', ev).catch(function () { /* perder um evento não é erro de UX */ });
  }

  /* Envio garantido na saída: sendBeacon sobrevive ao fechar a aba,
     coisa que o fetch normal não garante. */
  function registrarBeacon(tipo, valor) {
    if (!Site.configurado() || !navigator.sendBeacon) { registrar(tipo, { valor: valor }); return; }
    var cfg = (window.HIFERA_SITE_CONFIG || {}).supabase || {};
    var ev = {
      sessao: sessao(), tipo: tipo, pagina: ctx.pagina,
      referrer: document.referrer || '', utm: ctx.utm, valor: valor
    };
    try {
      var blob = new Blob([JSON.stringify(ev)], { type: 'application/json' });
      navigator.sendBeacon(
        cfg.url.replace(/\/+$/, '') + '/rest/v1/site_events?apikey=' + encodeURIComponent(cfg.anonKey),
        blob
      );
    } catch (e) { registrar(tipo, { valor: valor }); }
  }

  function medir() {
    /* 1. Pageview */
    registrar('pageview');

    /* 2. Cliques em alvos marcados no HTML com data-track */
    document.addEventListener('click', function (e) {
      var alvo = e.target.closest('[data-track]');
      if (!alvo) return;
      registrar('clique', { alvo: alvo.getAttribute('data-track') });
    }, true);

    /* 3. Profundidade de rolagem: marca 25/50/75/100 uma vez cada */
    var marcos = [25, 50, 75, 100];
    var batidos = {};
    function aoRolar() {
      var doc = document.documentElement;
      var alcance = doc.scrollHeight - doc.clientHeight;
      if (alcance <= 0) return;
      var pct = Math.min(100, Math.round((doc.scrollTop / alcance) * 100));
      marcos.forEach(function (m) {
        if (pct >= m && !batidos[m]) { batidos[m] = true; registrar('scroll', { valor: m }); }
      });
    }
    window.addEventListener('scroll', aoRolar, { passive: true });

    /* 4. Tempo na página: fecha a conta quando a aba some ou fecha.
          Só conta tempo visível, não aba esquecida aberta a noite toda. */
    var entrada = Date.now();
    var acumulado = 0;
    var contando = (document.visibilityState === 'visible');
    var enviado = false;

    function pausa() {
      if (contando) { acumulado += Date.now() - entrada; contando = false; }
    }
    function retoma() {
      if (!contando) { entrada = Date.now(); contando = true; }
    }
    function fechar() {
      if (enviado) return;
      pausa();
      enviado = true;
      registrarBeacon('tempo', acumulado);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { pausa(); fechar(); }
      else { enviado = false; retoma(); }
    });
    window.addEventListener('pagehide', fechar);
  }

  /* Só mede depois do "aceitar". Se a pessoa já tinha aceitado numa
     visita anterior, aoLiberar() chama medir() na hora. */
  Consent.aoLiberar(medir);
})();
