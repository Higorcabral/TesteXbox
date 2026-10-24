/* =====================================================================
 * /api/contato  —  endpoint do formulário público do www
 * ---------------------------------------------------------------------
 * O que faz
 *   POST /api/contato  { nome, retorno, recado, origem? }
 *   Valida o payload, aplica um honeypot, registra o lead no log
 *   (Application Insights), opcionalmente encaminha para um webhook
 *   externo (Teams/Slack/Make/n8n) e devolve 2xx.
 *
 *   Qualquer 2xx vira "Recebemos sua mensagem" no site; qualquer outro
 *   status/falha de rede dispara o fallback mailto do front, para a
 *   mensagem nunca se perder.
 *
 * Configuração opcional (App settings do Static Web App)
 *   CONTATO_WEBHOOK_URL   webhook HTTPS que recebe o lead em JSON.
 *                         Pode ser um "Incoming Webhook" do Teams, um
 *                         canal do Slack, Make/n8n, etc.
 *   CONTATO_WEBHOOK_TOKEN opcional; se definido, vai como Bearer no
 *                         header Authorization do POST para o webhook.
 *
 * Enquanto nada disso estiver configurado o endpoint ainda funciona:
 * grava o lead no log e devolve 200 — nenhum lead é perdido, só não
 * sai da Function. Dá para listar e exportar os logs no portal do
 * Azure (Function App → Log Stream / Application Insights).
 * ===================================================================== */
'use strict';

/* Normalização enxuta: tira espaços, limita tamanho, remove quebras
   em campos de 1 linha. Nada agressivo demais a ponto de arruinar um
   texto legítimo. */
function s(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}
function m(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

module.exports = async function (context, req) {
  // Preflight CORS — o SWA já cobre same-origin, isto é só para o caso
  // de alguém chamar de outro host declarado nas allowedOrigins.
  if (req.method === 'OPTIONS') {
    context.res = { status: 204 };
    return;
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const nome    = s(body.nome,    120);
  const retorno = s(body.retorno, 200);
  const recado  = m(body.recado, 4000);
  const origem  = s(body.origem,   40) || 'www';
  const trap    = s(body.aniversario, 10); // honeypot: campo que humano não preenche

  // Honeypot preenchido => é bot. Responde 200 silencioso para não dar
  // feedback de defesa.
  if (trap) {
    context.log.warn('contato: honeypot preenchido, descartando', { origem });
    context.res = { status: 200, body: { ok: true } };
    return;
  }

  if (!nome || !retorno || !recado) {
    context.res = {
      status: 400,
      headers: { 'content-type': 'application/json' },
      body: { ok: false, error: 'campos obrigatórios faltando' }
    };
    return;
  }

  // O /api/contato roda atrás do Azure Front Door do SWA; o IP real
  // vem no X-Forwarded-For (último é o do nó de borda, o primeiro é o
  // cliente).
  const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ua  = req.headers['user-agent'] || '';
  const lead = {
    at: new Date().toISOString(),
    nome, retorno, recado, origem,
    ip: fwd, ua,
  };

  // Grava no log. O App Insights mantém a trilha completa; sem
  // webhook configurado, é esta a trilha de recuperação dos leads.
  context.log('contato:lead', JSON.stringify(lead));

  // Encaminhamento opcional. Falha de webhook NÃO quebra a resposta
  // ao usuário — o lead já está no log; o front já pintou "recebido".
  const url = process.env.CONTATO_WEBHOOK_URL;
  if (url) {
    try {
      const h = { 'content-type': 'application/json' };
      if (process.env.CONTATO_WEBHOOK_TOKEN) {
        h['authorization'] = 'Bearer ' + process.env.CONTATO_WEBHOOK_TOKEN;
      }
      // AbortController para não deixar a Function pendurada se o
      // webhook demorar: 7s é mais do que suficiente para um ping.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: h,
          body: JSON.stringify(lead),
          signal: ctrl.signal,
        });
        if (!r.ok) context.log.warn('contato:webhook falhou', r.status);
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      context.log.warn('contato:webhook erro', String(e && e.message || e));
    }
  }

  context.res = {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { ok: true }
  };
};
