/* =================================================================
   HIFERA PORTAL · Model · Supabase (GoTrue + PostgREST) na unha
   -----------------------------------------------------------------
   Fala com o Supabase por fetch, sem SDK e sem build step — o mesmo
   princípio do resto do repositório. São quatro chamadas ao todo, e
   carregar um bundle de CDN para fazer quatro fetch custaria mais em
   dependência do que economiza em código.

   O fluxo é magic link, porque o cliente da Hifera não tem conta
   corporativa nossa e não deveria precisar inventar mais uma senha:

     1. a pessoa digita o e-mail
     2. POST /auth/v1/otp com create_user:false — e-mail que não está
        cadastrado não recebe nada e não vira conta
     3. o link do e-mail devolve a pessoa aqui com os tokens no
        fragmento da URL
     4. os tokens saem do fragmento (a URL não fica com token no
        histórico), vão para o localStorage e valem até expirar

   O que este arquivo NÃO faz, de propósito: decidir quem vê o quê.
   Isso é do banco, via RLS. Aqui só se transporta o token.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.SupabaseAuthModel = (function () {
  'use strict';

  var CHAVE = 'hifera.portal.sessao.v2';
  var cfg = (window.HIFERA_PORTAL_CONFIG || {}).supabase || {};
  var sessao = null;

  function configurado() {
    return !!(cfg.url && cfg.anonKey);
  }

  function base() {
    return String(cfg.url || '').replace(/\/+$/, '');
  }

  function cabecalhos(comToken) {
    var h = {
      'apikey': cfg.anonKey,
      'Content-Type': 'application/json'
    };
    if (comToken && sessao && sessao.access_token) {
      h.Authorization = 'Bearer ' + sessao.access_token;
    }
    return h;
  }

  /* --- Persistência ------------------------------------------------ */
  function guardar(s) {
    sessao = s;
    try {
      if (s) localStorage.setItem(CHAVE, JSON.stringify(s));
      else localStorage.removeItem(CHAVE);
    } catch (e) { /* modo privado: sessão vive só nesta aba */ }
  }

  function ler() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) { return null; }
  }

  function expirada(s) {
    return !s || !s.expires_at || (Date.now() > (s.expires_at - 60000));
  }

  function normalizar(dados) {
    if (!dados || !dados.access_token) return null;
    var segundos = Number(dados.expires_in || 3600);
    return {
      access_token: dados.access_token,
      refresh_token: dados.refresh_token || '',
      expires_at: Date.now() + (segundos * 1000),
      email: (dados.user && dados.user.email) || (sessao && sessao.email) || ''
    };
  }

  /* --- Tokens que voltam no fragmento da URL ----------------------- */
  function colherDaUrl() {
    var frag = window.location.hash || '';
    if (frag.indexOf('access_token=') < 0 && frag.indexOf('error=') < 0) return null;

    var p = new URLSearchParams(frag.replace(/^#/, ''));
    /* Sai da URL de qualquer jeito — com token ou com erro, esse
       fragmento não pode ficar no histórico nem em print de tela. */
    if (window.history && history.replaceState) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    if (p.get('error')) {
      return { erro: p.get('error_description') || p.get('error') };
    }

    var s = normalizar({
      access_token: p.get('access_token'),
      refresh_token: p.get('refresh_token'),
      expires_in: p.get('expires_in')
    });
    if (s) guardar(s);
    return { sessao: s };
  }

  /* --- Chamadas ---------------------------------------------------- */
  function enviarLink(email, redirectTo) {
    if (!configurado()) return Promise.reject(new Error('Portal sem configuração de acesso.'));

    var url = base() + '/auth/v1/otp';
    if (redirectTo) url += '?redirect_to=' + encodeURIComponent(redirectTo);

    return fetch(url, {
      method: 'POST',
      headers: cabecalhos(false),
      /* create_user:false é o que impede que digitar um e-mail
         qualquer crie uma conta e vire acesso. */
      body: JSON.stringify({ email: email, create_user: false })
    }).then(function (r) {
      if (r.ok) return true;
      return r.json().catch(function () { return {}; }).then(function (e) {
        throw new Error(e.msg || e.error_description || e.message || 'Falha ao enviar o link.');
      });
    });
  }

  function renovar() {
    if (!sessao || !sessao.refresh_token) return Promise.resolve(null);
    return fetch(base() + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: cabecalhos(false),
      body: JSON.stringify({ refresh_token: sessao.refresh_token })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var s = normalizar(d);
        guardar(s);
        return s;
      })
      .catch(function () { guardar(null); return null; });
  }

  function usuario() {
    if (!sessao) return Promise.resolve(null);
    return fetch(base() + '/auth/v1/user', { headers: cabecalhos(true) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* Leitura de tabela com o token da pessoa. O filtro de quem vê o quê
     é a RLS — este método não sabe e não precisa saber. */
  function selecionar(tabela, query) {
    if (!sessao) return Promise.resolve([]);
    var url = base() + '/rest/v1/' + encodeURIComponent(tabela) + '?' + (query || 'select=*');
    return fetch(url, { headers: cabecalhos(true) })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; });
  }

  function sair() {
    var pendente = sessao
      ? fetch(base() + '/auth/v1/logout', { method: 'POST', headers: cabecalhos(true) }).catch(function () {})
      : Promise.resolve();
    guardar(null);
    return pendente;
  }

  /* --- Restauração ao abrir a página ------------------------------- */
  function restaurar() {
    if (!configurado()) return Promise.resolve({ configurado: false });

    var vindo = colherDaUrl();
    if (vindo && vindo.erro) {
      return Promise.resolve({ configurado: true, erro: vindo.erro, sessao: null });
    }

    if (!sessao) sessao = ler();

    if (!sessao) return Promise.resolve({ configurado: true, sessao: null });
    if (!expirada(sessao)) return Promise.resolve({ configurado: true, sessao: sessao });

    return renovar().then(function (s) {
      return { configurado: true, sessao: s };
    });
  }

  return {
    configurado: configurado,
    restaurar: restaurar,
    enviarLink: enviarLink,
    usuario: usuario,
    selecionar: selecionar,
    sair: sair,
    sessaoAtual: function () { return sessao; }
  };
})();
