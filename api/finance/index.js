/* =================================================================
 * /api/finance  —  estado compartilhado do Caixa da Hifera
 * -----------------------------------------------------------------
 * Única porta de leitura/escrita do finance_state (tabela
 * single-row no Supabase). Duas defesas antes de chegar aqui:
 *
 *   1. a rota /api/* no staticwebapp.config.json já exige o papel
 *      'hifera';
 *   2. a Function relê o x-ms-client-principal e confere o papel de
 *      novo, para não depender só da config.
 *
 * A chave de serviço (SUPABASE_SERVICE_ROLE_KEY) vive só aqui, nas
 * App Settings do SWA do admin — jamais sai para o navegador.
 *
 * GET   /api/finance              → { ok, data, updated_at, updated_by }
 * PUT   /api/finance   { data }   → { ok, updated_at }
 * ================================================================= */
'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID    = 'hifera';

function principal(req) {
  const h = req.headers['x-ms-client-principal'];
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h, 'base64').toString('utf8')); }
  catch { return null; }
}
function temPapel(p, papel) {
  return !!(p && Array.isArray(p.userRoles) && p.userRoles.indexOf(papel) >= 0);
}
function nome(p) {
  return (p && (p.userDetails || p.userId)) || 'desconhecido';
}

function base() { return String(SUPABASE_URL || '').replace(/\/+$/, ''); }
function headers(extra) {
  const h = {
    'apikey': SERVICE_KEY,
    'Authorization': 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json'
  };
  if (extra) Object.keys(extra).forEach(k => { h[k] = extra[k]; });
  return h;
}
function resposta(context, status, corpo) {
  context.res = {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: corpo
  };
}

async function lerEstado() {
  const url = base() + '/rest/v1/finance_state?id=eq.' + encodeURIComponent(TENANT_ID)
            + '&select=data,updated_at,updated_by&limit=1';
  const r = await fetch(url, { headers: headers() });
  if (!r.ok) throw new Error('GET ' + r.status);
  const linhas = await r.json();
  return linhas[0] || { data: {}, updated_at: null, updated_by: null };
}

async function gravarEstado(data, by) {
  // UPSERT por id — Prefer: resolution=merge-duplicates faz o Supabase
  // tratar como insert ou update conforme o id já existir.
  const url = base() + '/rest/v1/finance_state';
  const payload = {
    id: TENANT_ID,
    data,
    updated_at: new Date().toISOString(),
    updated_by: by
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: headers({
      'Prefer': 'resolution=merge-duplicates,return=representation'
    }),
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('UPSERT ' + r.status);
  const linhas = await r.json();
  return linhas[0] || payload;
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') { context.res = { status: 204 }; return; }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    resposta(context, 500, { erro: 'Function sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configurados.' });
    return;
  }

  const p = principal(req);
  if (!temPapel(p, 'hifera')) {
    resposta(context, 403, { erro: 'Acesso restrito à equipe Hifera.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const linha = await lerEstado();
      resposta(context, 200, { ok: true, data: linha.data || {}, updated_at: linha.updated_at, updated_by: linha.updated_by });
      return;
    }

    if (req.method === 'PUT') {
      const corpo = req.body || {};
      if (!corpo.data || typeof corpo.data !== 'object') {
        resposta(context, 400, { erro: 'Esperado { data: object }.' });
        return;
      }
      const atualizado = await gravarEstado(corpo.data, nome(p));
      resposta(context, 200, { ok: true, updated_at: atualizado.updated_at });
      return;
    }

    resposta(context, 405, { erro: 'Método não suportado.' });
  } catch (e) {
    context.log.error('[finance]', e && e.message);
    resposta(context, 502, { erro: 'Falha ao falar com o Supabase.' });
  }
};
