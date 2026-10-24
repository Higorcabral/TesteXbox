/* =================================================================
   HIFERA · Site oficial · Configuração de coleta
   -----------------------------------------------------------------
   Ponto único onde o SITE PÚBLICO aprende a falar com o Supabase para
   gravar leads do formulário e eventos de comportamento. É o mesmo
   princípio do portal (ver portal/js/config.js): a anon key é feita
   para viver no navegador e, sozinha, não lê nada — a política de RLS
   no banco só deixa INSERIR. A service_role NUNCA entra aqui.

   Enquanto url e anonKey estiverem vazias:
     · em localhost, a coleta cai em modo protótipo: nada sai do
       navegador, os envios viram log no console para dar para testar;
     · em produção, a coleta simplesmente não acontece — publicar sem
       configurar não pode virar envio para lugar nenhum.

   Para ligar:
     1. Supabase → Project Settings → API
     2. copie "Project URL" para url e "anon public" para anonKey
     3. rode supabase/site-analytics.sql no SQL Editor
     4. confira que o consentimento (js/consentimento.js) está no ar

   Observação de LGPD: ligar isto começa a tratar dado pessoal
   (comportamento de visitante). Aviso de privacidade, retenção e o
   direito de apagar precisam estar resolvidos antes. O tracking só
   roda depois do "aceitar" do banner; o lead do formulário é a pessoa
   se oferecendo para contato, caminho diferente.
   ================================================================= */
window.HIFERA_SITE_CONFIG = {
  supabase: {
    // Projeto "hifera" (eswccbwgosgsfjabfjtv, sa-east-1).
    // A anon key é feita pra viver no navegador: por RLS no banco,
    // ela só consegue INSERIR em site_leads e site_events — jamais
    // ler. A service role (que ignora RLS) só vive nas App Settings
    // do SWA do admin, nunca neste arquivo.
    url: 'https://eswccbwgosgsfjabfjtv.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzd2NjYndnb3Nnc2ZqYWJmanR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MDMyNzksImV4cCI6MjEwODM3OTI3OX0.3RHtzWuGM5M6am7lQO5jaePd1TvHusiVdShu6Ye5JeU'
  }
};

window.HiferaSite = (function () {
  'use strict';

  var cfg = (window.HIFERA_SITE_CONFIG || {}).supabase || {};

  function configurado() {
    return !!(cfg.url && cfg.anonKey);
  }

  function ehLocal() {
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '' ||
           /\.localhost$/.test(h) || /\.test$/.test(h);
  }

  function base() {
    return String(cfg.url || '').replace(/\/+$/, '');
  }

  /* UTM e página de origem, lidos uma vez e reaproveitados. */
  function contexto() {
    var p = new URLSearchParams(location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
      .forEach(function (k) { if (p.get(k)) utm[k] = p.get(k); });
    return { pagina: location.pathname, utm: utm };
  }

  /* Inserção genérica, sempre só-INSERT. Resolve com true em 2xx.
     Em modo protótipo (sem config) não quebra: loga e resolve, para a
     UI do formulário seguir seu fluxo normal de WhatsApp/e-mail. */
  function inserir(tabela, registro) {
    if (!configurado()) {
      if (ehLocal()) {
        console.debug('[Hifera coleta · protótipo] ' + tabela, registro);
      }
      return Promise.resolve(false);
    }

    return fetch(base() + '/rest/v1/' + tabela, {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(registro)
    }).then(function (r) {
      if (!r.ok) throw new Error('coleta ' + tabela + ': ' + r.status);
      return true;
    });
  }

  return {
    configurado: configurado,
    ehLocal: ehLocal,
    contexto: contexto,
    inserir: inserir
  };
})();
