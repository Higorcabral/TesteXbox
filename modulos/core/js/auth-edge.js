/* =================================================================
   HIFERA MÓDULOS · Core · Identidade vinda da borda
   -----------------------------------------------------------------
   Só entra no build de admin.hifera.com.br (o scripts/montar.py injeta
   a tag). Localmente o arquivo não é carregado e o mock continua valendo.

   O Static Web App autentica ANTES de servir a página: quando este
   script roda, a pessoa já passou pelo Entra. O que falta é saber QUEM
   ela é — e isso vem do endpoint /.auth/me.

   Por que isso importa: sem esta ponte, o painel mostraria o usuário
   mockado (“Higor Cabral”) para qualquer pessoa que entrasse, e o log
   de alterações registraria o autor errado. Pior que não ter nome é
   ter o nome de outra pessoa.

   O boot espera esta promessa antes de renderizar, então nenhum dado
   de usuário errado chega a aparecer na tela.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

window.HIFERA_AUTH_ESPERA = (function () {
  'use strict';

  function iniciais(nome, email) {
    var base = (nome || email || '').trim();
    if (!base) return '?';
    var partes = base.split(/[\s@._-]+/).filter(Boolean);
    if (!partes.length) return '?';
    var a = partes[0].charAt(0);
    var b = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }

  /* O /.auth/me devolve os claims do token, e o formato varia com o
     provedor. O embutido da Microsoft pode devolver userDetails vazio —
     foi o que apareceu no az staticwebapp users list.

     Por isso NÃO se exige userDetails: procura-se identidade em qualquer
     campo disponível, na ordem do mais legível para o menos. E se nada
     identificar a pessoa, devolve-se um perfil neutro em vez de null:
     retornar null deixaria o usuário mockado na tela, que é exatamente o
     que este arquivo existe para impedir. Melhor "Conta Microsoft" que o
     nome de outra pessoa. */
  function claim(cliente, nomes) {
    var achado = '';
    (cliente.claims || []).forEach(function (c) {
      if (achado) return;
      var t = String(c.typ || '');
      for (var i = 0; i < nomes.length; i++) {
        if (t === nomes[i] || t.endsWith('/' + nomes[i])) { achado = c.val; return; }
      }
    });
    return achado;
  }

  function perfil(cliente) {
    if (!cliente) return null;

    var email = cliente.userDetails ||
                claim(cliente, ['emailaddress', 'email', 'preferred_username', 'upn']) || '';
    var nome  = claim(cliente, ['name', 'given_name']) || '';

    if (!email && !nome) {
      return { nome: 'Conta Microsoft', email: '', cargo: '',
               iniciais: 'MS', tenant: 'Hifera Company',
               id: cliente.userId || '' };
    }

    return {
      nome: nome || email,
      email: email,
      cargo: '',
      iniciais: iniciais(nome, email),
      tenant: 'Hifera Company',
      id: cliente.userId || ''
    };
  }

  return fetch('/.auth/me', { credentials: 'include' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (dados) {
      var p = perfil(dados && dados.clientPrincipal);
      if (p && HiferaAdmin.AuthModel && HiferaAdmin.AuthModel.definirUsuario) {
        HiferaAdmin.AuthModel.definirUsuario(p);
      }
      return p;
    })
    .catch(function () {
      /* Sem rede ou fora do Static Web App: segue com o que houver.
         Não bloqueia a tela — o Azure já garantiu o acesso. */
      return null;
    });
})();
