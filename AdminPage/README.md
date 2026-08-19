# Hifera · AdminPage

Painel interno da Hifera. Fica fora do menu do site, fora do índice dos
buscadores (`noindex` + `Disallow: /AdminPage/` no robots.txt) e não é
linkado de nenhuma página pública.

## Telas

| Arquivo | O que é |
|---|---|
| `index.html` | Login SSO com botão Microsoft (**mock**) |
| `projetos.html` | Gestão de Projetos — KPIs, gráfico Meta vs Realizado e CRUD da vitrine |

## Estrutura (MVC, vanilla, sem build)

```
AdminPage/
├── index.html            login
├── projetos.html         painel
├── css/admin.css
└── js/
    ├── format.js                    helpers pt-BR (moeda, datas, escape, URL/imagem segura)
    ├── app.js                       boot
    ├── models/
    │   ├── AuthModel.js             sessão mockada (trocar por MSAL)
    │   ├── StoreModel.js            wrapper do localStorage
    │   ├── ImageModel.js            redimensiona + converte para WebP em base64
    │   ├── ProjectsModel.js         projetos, lançamentos, agregados, alertas, forecast
    │   ├── AuditModel.js            log de alterações
    │   └── PublishModel.js          gera o vitrine-dados.js público
    ├── views/
    │   ├── KpiView.js               8 cartões de métrica
    │   ├── ChartView.js             gráfico SVG escrito à mão
    │   ├── TimelineView.js          Gantt início → entrega
    │   ├── ProjectsView.js          tabela + modal (upload, bullets, preview)
    │   └── AuditView.js             gaveta do histórico
    └── controllers/
        ├── AuthController.js        login e guard das telas
        └── ProjectsController.js    orquestra o painel
```

Tudo em `window.HiferaAdmin.*`, carregado por `<script>` na ordem
model → view → controller. Sem framework, sem bundler, igual ao resto
do site.

## Dados

Chaves no `localStorage`: `hifera.admin.projetos.v1` (projetos) e
`hifera.admin.log.v1` (histórico).
Sem nada gravado, o painel sobe com 5 projetos de exemplo (`SEED` no
`ProjectsModel.js`) — os 4 casos da home + o Ledger como produto em destaque.

Cada projeto guarda os campos do card da vitrine (título, categoria,
segmento, ordem, descrição, link, imagens, publicado, destaque), o
controle interno (status, cliente, datas, observação) e um **livro-caixa
mensal**: cada linha é `{ mês, meta, recebido, aReceber, gastos }`.
Os KPIs e o gráfico são sempre derivados desses lançamentos — não existe
total digitado à mão em lugar nenhum.

## Alertas automáticos

Derivados dos dados, não digitados:

| Alerta | Regra |
|---|---|
| Parcela vencida | lançamento com `aReceber > 0` em competência anterior ao mês corrente |
| Entrega atrasada | `entrega` no passado e status diferente de `finalizado` |

Aparecem como badge na linha da tabela, banner no topo e contador nos KPIs.
O filtro **Com alerta** isola só esses projetos.

## Forecast e comparativo

- **Forecast**: média dos 3 últimos meses com receita reconhecida, projetada
  para os meses seguintes. Desenhada como contorno tracejado sobre o slot da
  receita — dá pra comparar com o que já está contratado (a barra hachurada).
  Não projeta para trás nem para anos já fechados.
- **Ano anterior**: linha cinza sobre o mesmo gráfico, ligada pela legenda.
  Só aparece quando existe histórico do ano anterior. O tooltip mostra a
  variação percentual mês a mês.

## Imagens

O drag & drop redimensiona para 1200px de largura e converte para WebP
(JPEG onde WebP não é suportado), com queda progressiva de qualidade se o
resultado passar de 320 KB. O arquivo vira `data:` URI no `localStorage` —
por isso o painel mostra o quanto da cota (~4,2 MB) já foi usada, e recusa
o upload que não couber.

Arrastar as linhas da lista reordena; a primeira imagem é sempre a capa.
Para imagens que já estão no repositório, use **Adicionar por caminho/URL**
— fica muito mais leve que embutir base64.

## Como o painel chega na vitrine

`../js/vitrine.js` roda na home e substitui a grade de projetos quando
encontra dados, nesta ordem:

1. `localStorage` — o que você editou neste navegador
2. `window.HIFERA_PROJETOS` — lista publicada no repositório
3. o HTML estático da `index.html` — fallback, se não houver nenhum dos dois

Ou seja: **editar no painel muda a home só na sua máquina**. Para publicar
para todo mundo:

1. Clique em **Publicar** no painel — baixa um `vitrine-dados.js` pronto
2. Substitua `js/vitrine-dados.js` pelo arquivo baixado
3. Commite e suba

O arquivo publicado carrega **só campos de vitrine**. Financeiro, cliente,
status e observação interna nunca entram nele — ele é público.

Tanto a grade quanto o card grande em destaque (título, descrição, capa,
bullets, preço e link) são hidratados a partir dessa lista.

## Log de alterações

Botão **Histórico** no topo. Registra criação, edição, exclusão, duplicação,
publicação e geração de arquivo, com autor, horário e um resumo do que mudou
(a comparação campo a campo é feita no `AuditModel.descreverDiferencas`).
Guarda os últimos 300 registros em `hifera.admin.log.v1`.

Como a autenticação ainda é mockada, o "autor" é sempre o usuário mockado —
o log só vira rastreabilidade de verdade junto com o MSAL.

## Autenticação — o que falta para valer

`AuthModel.js` é uma **fachada**: a sessão vive no `sessionStorage`, então
qualquer pessoa com o console aberto entra. Isso segura o protótipo, não
protege nada. Para virar acesso real:

1. App Registration no Entra ID (tipo SPA, redirect URI `/AdminPage/`)
2. `@azure/msal-browser` → `loginPopup({ scopes: ['User.Read'] })`
3. Restringir por tenant/grupo e validar o token em um backend antes de
   devolver qualquer dado — enquanto for 100% estático no GitHub Pages,
   nenhuma informação sensível pode viver aqui.

## Rodando local

```
python3 -m http.server 5610 --directory <raiz do HiferaWebSite>
```

Depois abra `http://localhost:5610/AdminPage/`.
