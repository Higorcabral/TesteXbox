/* =================================================================
   HIFERA · Admin API · site-analytics
   -----------------------------------------------------------------
   A única porta que lê os leads e o comportamento do site. Roda no
   Static Web App do admin, que já autenticou a pessoa pelo Entra antes
   de a chamada chegar aqui. Duas defesas, não uma:

     1. a rota /api/* no staticwebapp.config.json exige o papel "hifera";
        quem não tem nem chega nesta função.
     2. esta função relê o principal do cabeçalho x-ms-client-principal
        e confere o papel de novo, para não depender só da config.

   A chave de serviço do Supabase (SUPABASE_SERVICE_ROLE_KEY) vive só
   aqui, nas configurações do app — nunca no navegador. É ela que
   ignora o RLS e consegue LER as tabelas que o site só pode escrever.

   GET   → { leads:[...], eventos:[...] }  (eventos: últimos 30 dias)
   PATCH → { id, campos:{status?, nota?} }  atualiza um lead
   ================================================================= */
'use strict';

var SUPABASE_URL = process.env.SUPABASE_URL;
var SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

var CAMPOS_LEAD = ['status', 'nota'];   // só isto o admin pode mudar
var STATUS_OK   = ['novo', 'contato', 'ganho', 'perdido'];

function principal(req) {
  var h = req.headers['x-ms-client-principal'];
  if (!h) return null;
  try {
    return JSON.parse(Buffer.from(h, 'base64').toString('utf8'));
  } catch (e) { return null; }
}

function temPapel(p, papel) {
  return !!(p && Array.isArray(p.userRoles) && p.userRoles.indexOf(papel) >= 0);
}

function base() { return String(SUPABASE_URL || '').replace(/\/+$/, ''); }

function cabecalhos(extra) {
  var h = {
    'apikey': SERVICE_KEY,
    'Authorization': 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json'
  };
  if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
  return h;
}

function resposta(context, status, corpo) {
  context.res = {
    status: status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: corpo
  };
}

async function lerLeads() {
  var url = base() + '/rest/v1/site_leads' +
    '?select=id,nome,empresa,contato,objetivo,recado,origem,pagina,status,nota,criado_em' +
    '&order=criado_em.desc&limit=1000';
  var r = await fetch(url, { headers: cabecalhos() });
  if (!r.ok) throw new Error('leads ' + r.status);
  return r.json();
}

async function lerEventos() {
  var desde = new Date(Date.now() - 30 * 86400000).toISOString();
  var url = base() + '/rest/v1/site_events' +
    '?select=id,sessao,tipo,pagina,alvo,valor,criado_em' +
    '&criado_em=gte.' + encodeURIComponent(desde) +
    '&order=criado_em.desc&limit=50000';
  var r = await fetch(url, { headers: cabecalhos() });
  if (!r.ok) throw new Error('eventos ' + r.status);
  return r.json();
}

async function atualizarLead(id, campos) {
  var patch = {};
  CAMPOS_LEAD.forEach(function (k) { if (campos[k] !== undefined) patch[k] = campos[k]; });
  if (patch.status !== undefined && STATUS_OK.indexOf(patch.status) < 0) {
    throw new Error('status inválido');
  }
  if (!Object.keys(patch).length) throw new Error('nada para atualizar');

  var url = base() + '/rest/v1/site_leads?id=eq.' + encodeURIComponent(id);
  var r = await fetch(url, {
    method: 'PATCH',
    headers: cabecalhos({ 'Prefer': 'return=minimal' }),
    body: JSON.stringify(patch)
  });
  if (!r.ok) throw new Error('patch ' + r.status);
}

module.exports = async function (context, req) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    resposta(context, 500, { erro: 'Function sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configurados.' });
    return;
  }

  var p = principal(req);
  if (!temPapel(p, 'hifera')) {
    resposta(context, 403, { erro: 'Acesso restrito à equipe Hifera.' });
    return;
  }

  try {
    if (req.method === 'PATCH') {
      var corpo = req.body || {};
      if (!corpo.id || !corpo.campos) {
        resposta(context, 400, { erro: 'Esperado { id, campos }.' });
        return;
      }
      await atualizarLead(corpo.id, corpo.campos);
      resposta(context, 200, { ok: true });
      return;
    }

    var par = await Promise.all([lerLeads(), lerEventos()]);
    resposta(context, 200, { leads: par[0], eventos: par[1] });
  } catch (e) {
    context.log.error('[site-analytics]', e && e.message);
    resposta(context, 502, { erro: 'Falha ao falar com o Supabase.' });
  }
};
