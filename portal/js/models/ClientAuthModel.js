/* =================================================================
   HIFERA PORTAL · Model · Sessão do cliente
   -----------------------------------------------------------------
   ATENÇÃO — ISTO É UMA FACHADA, NÃO É SEGURANÇA.
   Mesma limitação do AuthModel interno: a sessão vive no
   sessionStorage do navegador, então qualquer pessoa com o console
   aberto entra como qualquer cliente. Serve para prototipar o fluxo.

   O que ela JÁ faz de certo, e precisa continuar fazendo quando virar
   autenticação real: a sessão carrega **um** cliente, e todas as telas
   filtram por ele. Projeto, leads e chamados de outro cliente nunca
   entram na consulta — não é a view que esconde, é o model que não
   devolve.

   Para virar acesso real:
     1. Entra ID externo (B2C) ou magic link por e-mail — o cliente
        não tem conta corporativa da Hifera
     2. o escopo do cliente vem do token, NUNCA de um parâmetro de URL
     3. o filtro por cliente passa a ser do servidor, não do navegador
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.ClientAuthModel = (function () {
  'use strict';

  var CHAVE = 'hifera.portal.session';

  /* Contas de demonstração. Os e-mails batem com os solicitantes do
     seed de chamados, para o portal e o painel interno contarem a
     mesma história. Tudo fictício. */
  var CONTAS = [
    {
      cliente: 'Teste com Nome Fictício',
      nome:    'Joana Exemplo',
      papel:   'Coordenação de Operações',
      email:   'contato@exemplo-ficticio.test',
      iniciais:'JE'
    },
    {
      cliente: 'Distribuidora Vega',
      nome:    'Marina Alencar',
      papel:   'Comercial',
      email:   'marina@distribuidoravega.com.br',
      iniciais:'MA'
    },
    {
      cliente: 'Oficina RotaSul',
      nome:    'Cláudio Serrano',
      papel:   'Operações',
      email:   'claudio@oficinarotasul.com.br',
      iniciais:'CS'
    },
    {
      cliente: 'Studio Lune',
      nome:    'Luana Prado',
      papel:   'Atendimento',
      email:   'luana@studiolune.com.br',
      iniciais:'LP'
    },
    {
      cliente: 'Atacado Norte',
      nome:    'Paulo Ferraz',
      papel:   'Suprimentos',
      email:   'paulo@atacadonorte.test',
      iniciais:'PF'
    }
  ];

  function contas() { return CONTAS.slice(); }

  function contaDe(cliente) {
    return CONTAS.filter(function (c) { return c.cliente === cliente; })[0] || null;
  }

  function getSession() {
    try {
      var bruto = sessionStorage.getItem(CHAVE);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
      return null;
    }
  }

  function isAuthenticated() {
    var s = getSession();
    return !!(s && s.cliente && contaDe(s.cliente));
  }

  /* getCliente() é o que todas as telas usam. Devolve null sem sessão —
     nunca um cliente "padrão", senão um bug de sessão vira vazamento. */
  function getCliente() {
    var s = getSession();
    return s && s.cliente ? s.cliente : null;
  }

  function getUser() {
    var cliente = getCliente();
    return cliente ? contaDe(cliente) : null;
  }

  /* Promise só para o fluxo de tela ficar igual ao do MSAL de verdade,
     que é assíncrono. O atraso é teatro do protótipo. */
  function signIn(cliente) {
    return new Promise(function (resolve, reject) {
      var conta = contaDe(cliente);
      if (!conta) { reject(new Error('Cliente desconhecido.')); return; }
      setTimeout(function () {
        var sessao = { cliente: conta.cliente, entrouEm: new Date().toISOString() };
        try { sessionStorage.setItem(CHAVE, JSON.stringify(sessao)); } catch (e) { /* modo privado */ }
        resolve({ user: conta, sessao: sessao });
      }, 620);
    });
  }

  function signOut() {
    try { sessionStorage.removeItem(CHAVE); } catch (e) { /* segue */ }
  }

  return {
    contas: contas,
    contaDe: contaDe,
    isAuthenticated: isAuthenticated,
    getCliente: getCliente,
    getUser: getUser,
    signIn: signIn,
    signOut: signOut
  };
})();
