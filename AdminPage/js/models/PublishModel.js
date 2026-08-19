/* =================================================================
   HIFERA ADMIN · Model · Publicação
   Gera o `js/vitrine-dados.js` pronto pra commit.

   REGRA IMPORTANTE: o arquivo é público. Só vão os campos que o card
   da home realmente usa. Financeiro, cliente, status e observação
   interna ficam de fora — são dados de gestão, não de vitrine.
   ================================================================= */
window.HiferaAdmin = window.HiferaAdmin || {};

HiferaAdmin.PublishModel = (function () {
  'use strict';

  var Model = HiferaAdmin.ProjectsModel;
  var Img   = HiferaAdmin.ImageModel;

  /* Campos liberados para o arquivo público */
  var CAMPOS_PUBLICOS = [
    'id', 'titulo', 'categoria', 'segmento', 'ordem',
    'descricao', 'link', 'novaAba', 'imagens', 'destaque', 'preco', 'bullets'
  ];

  function higienizar(p) {
    var saida = {};
    CAMPOS_PUBLICOS.forEach(function (k) {
      var v = p[k];
      if (v === '' || v === undefined || v === null) return;
      if (Array.isArray(v) && !v.length) return;
      saida[k] = v;
    });
    saida.publicado = true;   /* só publicados chegam até aqui */
    return saida;
  }

  function listaPublicavel() {
    return Model.getAll()
      .filter(function (p) { return p.publicado && p.link; })
      .map(higienizar);
  }

  function gerarArquivo() {
    var lista = listaPublicavel();
    var agora = new Date();
    var carimbo = String(agora.getDate()).padStart(2, '0') + '/' +
                  String(agora.getMonth() + 1).padStart(2, '0') + '/' + agora.getFullYear() +
                  ' às ' + String(agora.getHours()).padStart(2, '0') + ':' +
                  String(agora.getMinutes()).padStart(2, '0');

    return '/* =================================================================\n' +
           '   HIFERA · Dados da vitrine — ARQUIVO GERADO, NÃO EDITE À MÃO\n' +
           '   -----------------------------------------------------------------\n' +
           '   Gerado pelo painel /AdminPage em ' + carimbo + '.\n' +
           '   ' + lista.length + (lista.length === 1 ? ' projeto publicado.' : ' projetos publicados.') + '\n' +
           '\n' +
           '   Para atualizar: edite no painel e clique em "Publicar" de novo,\n' +
           '   depois commite este arquivo. O js/vitrine.js lê daqui quando não\n' +
           '   há edições locais no navegador.\n' +
           '\n' +
           '   Só campos de vitrine entram aqui. Financeiro, cliente e status\n' +
           '   ficam no painel — este arquivo é público.\n' +
           '   ================================================================= */\n' +
           'window.HIFERA_PROJETOS = ' + JSON.stringify(lista, null, 2) + ';\n';
  }

  function estatisticas() {
    var lista = listaPublicavel();
    var conteudo = gerarArquivo();
    var embutidas = 0;
    var bytesImagens = 0;

    lista.forEach(function (p) {
      (p.imagens || []).forEach(function (im) {
        if (/^data:/.test(im.src)) {
          embutidas++;
          bytesImagens += Img.bytesDataUri(im.src);
        }
      });
    });

    return {
      projetos: lista.length,
      destaque: lista.filter(function (p) { return p.destaque; }).length,
      naGrade: lista.filter(function (p) { return !p.destaque; }).length,
      bytes: conteudo.length,
      imagensEmbutidas: embutidas,
      bytesImagens: bytesImagens,
      pesado: conteudo.length > 1024 * 1024
    };
  }

  return {
    gerarArquivo: gerarArquivo,
    estatisticas: estatisticas,
    listaPublicavel: listaPublicavel
  };
})();
