/* =================================================================
   HIFERA ADMIN · Model · Log de alterações
   Quem mexeu, no quê e quando. Antes de a Fernanda também editar,
   isto é o mínimo pra saber de onde veio uma mudança.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.AuditModel = (function () {
  'use strict';

  var Store = HiferaAdmin.StoreModel;
  var CHAVE = 'hifera.admin.log.v1';
  var LIMITE = 300;   /* mantém o storage sob controle */

  var ACOES = {
    criar:      { label: 'Criou',        cor: 'green' },
    editar:     { label: 'Editou',       cor: 'cyan'  },
    excluir:    { label: 'Excluiu',      cor: 'red'   },
    duplicar:   { label: 'Duplicou',     cor: 'cyan'  },
    publicar:   { label: 'Publicou',     cor: 'green' },
    despublicar:{ label: 'Despublicou',  cor: 'amber' },
    importar:   { label: 'Importou',     cor: 'amber' },
    restaurar:  { label: 'Restaurou',    cor: 'amber' },
    publicarSite:{ label: 'Gerou publicação', cor: 'indigo' }
  };

  /* Log de exemplo — some assim que houver histórico real */
  var SEED = [
    { id: 's6', quando: '2026-08-17T18:42:00.000Z', autor: 'Higor Cabral', acao: 'editar',
      alvo: 'Projeto-Stoq', resumo: 'Marcou como "com pendência" e registrou a parcela de julho em aberto.' },
    { id: 's5', quando: '2026-08-14T13:05:00.000Z', autor: 'Higor Cabral', acao: 'editar',
      alvo: 'Controle Financeiro completo', resumo: 'Atualizou o preço exibido para R$ 397/mês.' },
    { id: 's4', quando: '2026-08-06T09:20:00.000Z', autor: 'Higor Cabral', acao: 'editar',
      alvo: 'Projeto-Mecan', resumo: 'Lançou as parcelas de setembro e outubro como a receber.' },
    { id: 's3', quando: '2026-06-02T11:00:00.000Z', autor: 'Higor Cabral', acao: 'criar',
      alvo: 'Projeto-Stoq', resumo: 'Cadastrou o projeto na vitrine com 2 telas.' },
    { id: 's2', quando: '2026-05-16T16:30:00.000Z', autor: 'Higor Cabral', acao: 'editar',
      alvo: 'Projeto-Mani', resumo: 'Mudou o status para finalizado após a entrega.' },
    { id: 's1', quando: '2026-04-22T17:10:00.000Z', autor: 'Higor Cabral', acao: 'editar',
      alvo: 'Projeto-CRM', resumo: 'Mudou o status para finalizado e quitou a última parcela.' }
  ];

  var cache = null;

  function carregar() {
    if (cache) return cache;
    var bruto = Store.ler(CHAVE, null);
    cache = Array.isArray(bruto) ? bruto : SEED.slice();
    return cache;
  }

  function persistir() { Store.gravar(CHAVE, cache); }

  function autorAtual() {
    var u = HiferaAdmin.AuthModel && HiferaAdmin.AuthModel.getUser();
    return (u && u.nome) || 'Desconhecido';
  }

  /* registrar('editar', 'Projeto-CRM', 'Trocou a capa.') */
  function registrar(acao, alvo, resumo) {
    carregar();
    cache.unshift({
      id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      quando: new Date().toISOString(),
      autor: autorAtual(),
      acao: ACOES[acao] ? acao : 'editar',
      alvo: alvo || '—',
      resumo: resumo || ''
    });
    if (cache.length > LIMITE) cache.length = LIMITE;
    persistir();
    return cache[0];
  }

  function listar(filtro) {
    var lista = carregar().slice();
    if (filtro && filtro.acao && filtro.acao !== 'todas') {
      lista = lista.filter(function (e) { return e.acao === filtro.acao; });
    }
    if (filtro && filtro.termo) {
      var t = filtro.termo.toLowerCase();
      lista = lista.filter(function (e) {
        return (e.alvo + ' ' + e.resumo + ' ' + e.autor).toLowerCase().indexOf(t) >= 0;
      });
    }
    return lista;
  }

  function limpar() {
    cache = [];
    persistir();
  }

  /* Compara dois projetos e devolve uma frase do que mudou */
  function descreverDiferencas(antes, depois) {
    if (!antes) return 'Cadastro inicial.';
    var rotulos = {
      titulo: 'título', categoria: 'categoria', segmento: 'segmento', ordem: 'ordem',
      descricao: 'descrição', link: 'link', preco: 'preço', status: 'status',
      cliente: 'cliente', inicio: 'início', entrega: 'entrega', observacao: 'observação',
      publicado: 'publicação', destaque: 'destaque', novaAba: 'abrir em nova aba'
    };
    var mudou = [];

    Object.keys(rotulos).forEach(function (k) {
      if (String(antes[k]) !== String(depois[k])) mudou.push(rotulos[k]);
    });
    if ((antes.imagens || []).length !== (depois.imagens || []).length) mudou.push('imagens');
    if ((antes.bullets || []).join('|') !== (depois.bullets || []).join('|')) mudou.push('bullets');

    var la = JSON.stringify(antes.lancamentos || []);
    var ld = JSON.stringify(depois.lancamentos || []);
    if (la !== ld) mudou.push('financeiro');

    if (!mudou.length) return 'Salvou sem alterações.';
    if (mudou.length > 4) return 'Alterou ' + mudou.length + ' campos, incluindo ' + mudou.slice(0, 3).join(', ') + '.';
    return 'Alterou ' + mudou.join(', ') + '.';
  }

  return {
    ACOES: ACOES,
    registrar: registrar,
    listar: listar,
    limpar: limpar,
    descreverDiferencas: descreverDiferencas
  };
})();
