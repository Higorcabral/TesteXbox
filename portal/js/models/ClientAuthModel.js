/* =================================================================
   HIFERA PORTAL · Model · Sessão do cliente
   -----------------------------------------------------------------
   Quem é a pessoa e, principalmente, DE QUAL CLIENTE ela é. Todas as
   telas do portal filtram por esse cliente — projeto, leads e chamados
   de outra empresa nunca entram na consulta. Não é a view que esconde:
   é o model que não devolve.

   Duas realidades, decididas por portal/js/config.js:

   1. Supabase configurado (produção). A identidade vem de um magic
      link no e-mail; o vínculo pessoa → cliente vem da tabela
      portal_acessos, lida com o token DELA. A política de RLS só
      devolve a linha de quem está pedindo, então o escopo não é uma
      decisão do navegador — o banco simplesmente não entrega o resto.

   2. Sem configuração. Não existe cliente cadastrado, e a tela de
      entrada diz exatamente isso — com um acesso de exemplo ao lado,
      que abre uma empresa fictícia com dados de demonstração.

      Isso não é a porta destrancada de antes: lá, a lista de contas
      era o ÚNICO caminho e continuaria valendo com cliente real no ar.
      Aqui o exemplo só existe enquanto o Supabase estiver desligado.
      Configurou, a função recusa e a tela nem é montada.

   restaurar() precisa ser resolvido ANTES de qualquer tela desenhar.
   Quem cuida disso é o boot — ver portal/js/boot.js.
   ================================================================= */
window.HiferaPortal = window.HiferaPortal || {};

HiferaPortal.ClientAuthModel = (function () {
  'use strict';

  var Supa = HiferaPortal.SupabaseAuthModel;
  var CHAVE_MOCK = 'hifera.portal.session';

  /* Estado resolvido por restaurar(). Antes disso, ninguém entra. */
  var estado = {
    pronto: false,
    modo: 'bloqueado',      /* 'supabase' | 'exemplo' | 'bloqueado' */
    cliente: null,
    user: null,
    erro: ''
  };

  /* --- Contas de exemplo -------------------------------------------- */
  /* Contas de demonstração. Os e-mails batem com os solicitantes do
     seed de chamados, para o portal e o painel interno contarem a
     mesma história. Tudo fictício. */
  var CONTAS = [
    { cliente: 'Teste com Nome Fictício', nome: 'Joana Exemplo',    papel: 'Coordenação de Operações', email: 'contato@exemplo-ficticio.test',     iniciais: 'JE' },
    { cliente: 'Distribuidora Vega',      nome: 'Marina Alencar',   papel: 'Comercial',                email: 'marina@distribuidoravega.com.br', iniciais: 'MA' },
    { cliente: 'Oficina RotaSul',         nome: 'Cláudio Serrano',  papel: 'Operações',                email: 'claudio@oficinarotasul.com.br',   iniciais: 'CS' },
    { cliente: 'Studio Lune',             nome: 'Luana Prado',      papel: 'Atendimento',              email: 'luana@studiolune.com.br',         iniciais: 'LP' },
    { cliente: 'Atacado Norte',           nome: 'Paulo Ferraz',     papel: 'Suprimentos',              email: 'paulo@atacadonorte.test',         iniciais: 'PF' }
  ];

  /* Usado só para decidir se a tela mostra o seletor das cinco contas —
     conveniência de desenvolvimento. Não é controle de acesso. */
  function ehAmbienteLocal() {
    var h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '' ||
           window.location.protocol === 'file:';
  }

  function contas() { return CONTAS.slice(); }

  function contaDe(cliente) {
    return CONTAS.filter(function (c) { return c.cliente === cliente; })[0] || null;
  }

  function lerExemplo() {
    try {
      var bruto = sessionStorage.getItem(CHAVE_MOCK);
      var s = bruto ? JSON.parse(bruto) : null;
      return s && s.cliente ? contaDe(s.cliente) : null;
    } catch (e) { return null; }
  }

  /* --- Perfil vindo do Supabase ------------------------------------ */
  function iniciais(nome, email) {
    var base = String(nome || email || '').trim();
    if (!base) return '?';
    var partes = base.split(/[\s@._-]+/).filter(Boolean);
    if (!partes.length) return '?';
    var a = partes[0].charAt(0);
    var b = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }

  /* A linha de portal_acessos é a fonte do vínculo. Sem linha, a pessoa
     autenticou mas não é cliente de ninguém — e aí não entra. */
  function resolverVinculo(perfil) {
    return Supa.selecionar('portal_acessos', 'select=cliente,nome,papel&limit=1')
      .then(function (linhas) {
        var v = linhas && linhas[0];
        if (!v || !v.cliente) {
          estado.modo = 'bloqueado';
          estado.erro = 'Este e-mail não está vinculado a nenhum cliente da Hifera.';
          return estado;
        }
        var email = (perfil && perfil.email) || '';
        estado.modo = 'supabase';
        estado.cliente = v.cliente;
        estado.user = {
          cliente:  v.cliente,
          nome:     v.nome || email,
          papel:    v.papel || '',
          email:    email,
          iniciais: iniciais(v.nome, email)
        };
        return estado;
      });
  }

  /* --- Restauração -------------------------------------------------- */
  function restaurar() {
    return Supa.restaurar().then(function (r) {
      estado.pronto = true;

      if (!r.configurado) {
        var conta = lerExemplo();
        estado.modo = 'exemplo';
        estado.cliente = conta ? conta.cliente : null;
        estado.user = conta;
        return estado;
      }

      if (r.erro) { estado.erro = r.erro; return estado; }
      if (!r.sessao) return estado;

      return Supa.usuario().then(function (perfil) {
        if (!perfil) { estado.erro = ''; return estado; }
        return resolverVinculo(perfil);
      });
    });
  }

  /* --- API usada pelas telas (síncrona, como antes) ----------------- */
  function isAuthenticated() { return !!(estado.pronto && estado.cliente); }

  /* Devolve null sem sessão — nunca um cliente "padrão", senão um bug
     de sessão vira vazamento. */
  function getCliente() { return estado.cliente || null; }
  function getUser() { return estado.user || null; }
  function modo() { return estado.modo; }
  function erro() { return estado.erro; }
  function configurado() { return Supa.configurado(); }
  function ambienteLocal() { return ehAmbienteLocal(); }

  /* --- Entrada ------------------------------------------------------ */
  function enviarLink(email) {
    var cfg = window.HIFERA_PORTAL_CONFIG || {};
    var destino = cfg.redirectTo || (window.location.origin + window.location.pathname);
    return Supa.enviarLink(email, destino);
  }

  /* Acesso de exemplo. Existe só ENQUANTO não há Supabase configurado —
     ou seja, enquanto não há cliente de verdade para vazar. Configurado o
     Supabase, esta função passa a recusar, e a tela que a chamava deixa de
     ser montada. Sem cliente informado, entra na primeira conta fictícia. */
  function signInExemplo(cliente) {
    return new Promise(function (resolve, reject) {
      if (Supa.configurado()) {
        reject(new Error('Acesso de exemplo indisponível.'));
        return;
      }
      var conta = cliente ? contaDe(cliente) : CONTAS[0];
      if (!conta) { reject(new Error('Cliente desconhecido.')); return; }
      setTimeout(function () {
        try {
          sessionStorage.setItem(CHAVE_MOCK, JSON.stringify({
            cliente: conta.cliente, entrouEm: new Date().toISOString()
          }));
        } catch (e) { /* modo privado */ }
        estado.modo = 'exemplo';
        estado.cliente = conta.cliente;
        estado.user = conta;
        resolve({ user: conta });
      }, 420);
    });
  }

  function signOut() {
    estado.cliente = null;
    estado.user = null;
    try { sessionStorage.removeItem(CHAVE_MOCK); } catch (e) { /* segue */ }
    return Supa.configurado() ? Supa.sair() : Promise.resolve();
  }

  return {
    restaurar: restaurar,
    isAuthenticated: isAuthenticated,
    getCliente: getCliente,
    getUser: getUser,
    modo: modo,
    erro: erro,
    configurado: configurado,
    ambienteLocal: ambienteLocal,
    enviarLink: enviarLink,
    signInExemplo: signInExemplo,
    signOut: signOut,
    contas: contas,
    contaDe: contaDe
  };
})();
