# Hifera · Módulos internos

Ramificações internas da Hifera, separadas do site público. Ficam fora do
menu, fora do índice dos buscadores (`noindex` + `Disallow: /modulos/` no
robots.txt) e não são linkadas de nenhuma página pública.

Vivem dentro do repositório do site porque a raiz do repositório **é** a
raiz de publicação do GitHub Pages — o que sai daqui deixa de ir para o ar.
A separação é de pastas e de responsabilidade, não de repositório.

## Módulos

| Rota | O que é |
|---|---|
| `/modulos/` | Login SSO com botão Microsoft (**mock**) — entrada única |
| `/modulos/admin/` | Portfólio — KPIs, Meta vs Realizado, carteira por cliente, timeline e a lista de projetos |
| `/modulos/admin/projeto.html?id=…` | Gestão de **um** projeto — marcos, financeiro, diário e ficha do cliente |
| `/modulos/chamados/` | Service Desk — cascata, filas, SLA e avaliação |

## Estrutura (MVC, vanilla, sem build)

```
modulos/
├── index.html                      login — entrada única dos dois módulos
│
├── core/                           compartilhado. NÃO depende de nenhum módulo
│   ├── css/admin.css               tokens de tema claro/escuro + componentes
│   └── js/
│       ├── caminhos.js             resolve HIFERA_PATHS (ver "Caminhos")
│       ├── format.js               helpers pt-BR (moeda, datas, escape, URL/imagem segura)
│       ├── models/
│       │   ├── AuthModel.js        sessão mockada (trocar por MSAL)
│       │   ├── StoreModel.js       wrapper do localStorage
│       │   ├── ImageModel.js       redimensiona + converte para WebP em base64
│       │   ├── ProjectsModel.js    catálogo de projetos — lido pelos DOIS módulos
│       │   └── AuditModel.js       log de alterações
│       ├── views/AuditView.js      gaveta do histórico
│       ├── ui/sidebar.js           gaveta do menu lateral em telas estreitas
│       └── controllers/
│           ├── ThemeController.js  claro/escuro
│           └── AuthController.js   login e guard das telas
│
├── admin/                          MÓDULO · Projetos
│   ├── index.html                    portfólio: a carteira inteira
│   ├── projeto.html                  um projeto: ?id=<id do projeto>
│   └── js/
│       ├── models/PublishModel.js  gera o vitrine-dados.js público
│       ├── views/
│       │   ├── KpiView.js            cartões de métrica da carteira
│       │   ├── ChartView.js          Meta vs Realizado (serve as DUAS telas)
│       │   ├── TimelineView.js       início→entrega de todos os projetos
│       │   ├── PortfolioView.js      saúde da carteira + valor por cliente
│       │   ├── ProjectsView.js       cartões, tabela e modal de cadastro
│       │   └── ProjectDetailView.js  ficha, marcos, lançamentos, diário, cliente
│       ├── controllers/
│       │   ├── ProjectsController.js       DOM do index.html
│       │   └── ProjectDetailController.js  DOM do projeto.html
│       ├── boot.js                   entrada do index.html
│       └── boot-projeto.js           entrada do projeto.html
│
└── chamados/                       MÓDULO · Service Desk
    ├── index.html
    └── js/
        ├── models/TicketsModel.js  cascata, filas, SLA, avaliação
        ├── views/                  TicketsView, TicketFormView, TicketDetailView
        ├── controllers/TicketsController.js
        └── boot.js
```

**Regra de dependência, em uma linha:** módulo → `core`, nunca o contrário,
e nunca módulo → módulo. Se dois módulos passarem a precisar da mesma coisa,
ela sobe para `core` — foi o que aconteceu com o `ProjectsModel`, que o
formulário de chamados usa para sugerir o projeto relacionado.

## Caminhos

O login está a um nível da raiz do site e os módulos a dois. Antes isso era
um `'../'` escrito à mão dentro do `format.js` e do `ProjectsController` —
o que travava a estrutura de pastas: mover qualquer coisa quebrava as
miniaturas e os links de "abrir projeto".

Agora cada página declara os próprios caminhos no `<head>`, **antes** de
qualquer script:

```html
<script>
window.HIFERA_PATHS = {
  site:  '../../',      /* raiz do site: index.html, assets/, projetos/ */
  login: '../',         /* onde está a tela de login */
  home:  '../admin/'    /* para onde ir depois de autenticar */
};
</script>
```

O `core/js/caminhos.js` normaliza isso em `HiferaAdmin.Caminhos`, e quem
precisa de caminho usa `Fmt.assetAdmin()` (imagens) ou `Fmt.urlDoSite()`
(links). Mover uma pasta de lugar = mexer nessas três linhas do HTML dela.

## Ordem de carga

`caminhos.js` → models → views → controllers → `boot.js`.
O `caminhos.js` vem primeiro porque o `AuthController` lê `Caminhos` na
avaliação do módulo, não em tempo de chamada.

Tudo em `window.HiferaAdmin.*`, carregado por `<script>` na ordem
model → view → controller. Sem framework, sem bundler, igual ao resto
do site.

## Dados

Chaves no `localStorage`: `hifera.admin.projetos.v1` (projetos),
`hifera.admin.chamados.v1` (chamados), `hifera.admin.log.v1` (histórico) e
`hifera.admin.tema` (claro/escuro).
Sem nada gravado, o painel sobe com 6 projetos de exemplo (`SEED` no
`core/js/models/ProjectsModel.js`): os 4 casos da home, o Ledger como produto
em destaque e o **Portal de Operações — Teste Fictício**, do cliente
"Teste com Nome Fictício".

Esse último existe para exercitar a tela de gestão com um caso sob medida
completo — seis marcos em estados diferentes, diário com quatro entradas e
uma parcela vencida que dispara o alerta. Ele nasce com `publicado: false`,
então **não aparece na vitrine** nem entra no `vitrine-dados.js`: é cliente
de teste, não portfólio.

Cada projeto guarda os campos do card da vitrine (título, categoria,
segmento, ordem, descrição, link, imagens, publicado, destaque), o
controle interno (status, cliente, contato, datas, observação), um
**livro-caixa mensal** — cada linha é `{ mês, meta, recebido, aReceber,
gastos }` —, uma lista de **marcos** (`{ título, data, status, nota }`)
e um **diário** (`{ data, autor, texto }`).

Os KPIs, o gráfico, o percentual de conclusão e o semáforo são sempre
derivados desses dados — não existe total nem "status de saúde" digitado
à mão em lugar nenhum. Ver "Duas telas, um modelo" logo abaixo.

## Tema

Escuro é o padrão — é o que combina com a vitrine. O claro entra por
`[data-tema="claro"]` no `<html>`, guardado em `hifera.admin.tema`.

Um `<script>` inline no `<head>` aplica o atributo **antes** do CSS pintar.
Sem ele o painel pisca escuro a cada carregamento de quem usa o claro.

Como o sistema funciona:

| Token | Papel |
|---|---|
| `--on` | canal das sobreposições — branco no escuro, preto no claro. É o que faz `rgba(var(--on),.06)` servir nos dois temas |
| `--sh` | canal das sombras |
| `--*-ink` | versão do acento com contraste para texto e ícone |

O `--*-ink` existe porque o cyan da marca (`#5de0e6`) dá 1,9:1 sobre branco:
funciona como barra de gráfico, é ilegível como texto. No escuro os `ink`
valem exatamente as cores originais, então nada muda lá.

Ambos os temas passam AA (4.5:1 para texto normal, 3:1 para grande) nas
duas telas.

## Chamados

Service desk completo, com a mesma mecânica de um portal de TI:

**Cascata** — Categoria → Sistema → Módulo, cada nível destravando o
seguinte. A folha define a **fila** automaticamente, então o solicitante
nunca precisa saber para quem mandar. Cinco filas: Suporte a Produto,
Automações, Web & Presença, Infra & Segurança, Dados & Relatórios.

**Tipos** — Chamado (algo quebrou) e Requisição (pedido de algo novo).
A troca redesenha o formulário: em requisição, "Operação" deixa de ser
obrigatória e os textos de ajuda mudam.

**SLA por prioridade**, contado da abertura:

| Prioridade | Resposta | Solução |
|---|---|---|
| Urgente | 2h | 8h |
| Alta | 4h | 24h |
| Média | 8h | 72h |
| Baixa | 24h | 120h |

`Aguardando cliente` **pausa o relógio** — não é justo contar contra a fila
o tempo em que a bola está do outro lado.

**Atendimento** — histórico em linha do tempo separando cliente de agente,
anexos (imagem convertida para WebP, PDF preservado), resposta com marcação
de "esta é a solução" que resolve o chamado, mudança de status e avaliação
de 1 a 5 estrelas com comentário opcional.

**Panorama** — 8 indicadores, volume mensal de abertos contra resolvidos,
distribuição por fila. Toda ação entra no log de alterações.

Dados em `hifera.admin.chamados.v1`.

## Duas telas, um modelo

A gestão de projetos foi separada em duas perguntas diferentes, porque
elas nunca são feitas na mesma hora:

| Tela | Pergunta que responde |
|---|---|
| `admin/index.html` | *Como está a carteira?* — soma de tudo, quem está em risco, quem paga |
| `admin/projeto.html?id=…` | *Como está ESTE projeto, e o que eu faço agora?* |

O portfólio mostra a lista em **cartões** (padrão) ou em **tabela**. O
cartão é onde se decide o que fazer: capa, semáforo, barra de conclusão e
o botão *Gerenciar*. A tabela é onde se confere número, em varredura
vertical. A escolha fica em `hifera.admin.modoLista`.

### O que é derivado, e de quê

Nada nestas telas é um campo que alguém marca e esquece de atualizar:

| Indicador | Regra |
|---|---|
| **Conclusão (%)** | marcos concluídos ÷ marcos totais. Sem marcos, cai para `recebido ÷ contratado` — a régua que sempre existe |
| **Semáforo** | *risco* se a entrega estourou o prazo ou há duas frentes abertas; *atenção* com uma; *saudável* sem nenhuma |
| **Contratado** | `recebido + aReceber` dos lançamentos |
| **Carteira por cliente** | agrupa os projetos por `cliente` e soma o período selecionado |

O atraso de entrega vai direto para *risco* porque é o único item da
lista que não se resolve com um telefonema.

### O que a tela do projeto edita

Marco (com modal próprio), status de marco (direto na linha), lançamentos
(grade inline, com botão de salvar que só acende quando há mudança),
anotações do diário e a ficha do cliente. A ficha da vitrine continua no
mesmo modal do portfólio — `ProjectsView.abrirModal` é reusado, não
duplicado.

O `?id=` que não existe na base não quebra: a tela troca o conteúdo por
um aviso explicando que os dados do protótipo vivem no `localStorage` de
cada máquina, com link de volta para o portfólio.

### Cliente e contato — o limite

O bloco de contato guarda três campos: nome, papel e e-mail. É o mínimo
para saber com quem falar. Contrato, documento e qualquer outro dado
pessoal ficam **fora** — este painel é 100% estático e grava tudo em
texto puro no `localStorage` do navegador. Enquanto não houver backend
com autenticação real (ver *Autenticação*), essa é a fronteira.

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

`/js/vitrine.js` roda na home e substitui a grade de projetos quando
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

1. App Registration no Entra ID (tipo SPA, redirect URI `/modulos/`)
2. `@azure/msal-browser` → `loginPopup({ scopes: ['User.Read'] })`
3. Restringir por tenant/grupo e validar o token em um backend antes de
   devolver qualquer dado — enquanto for 100% estático no GitHub Pages,
   nenhuma informação sensível pode viver aqui.

## Rodando local

```
python3 -m http.server 5610 --directory <raiz do HiferaWebSite>
```

Depois abra `http://localhost:5610/modulos/`.

Sempre pela raiz do site, nunca pela pasta `modulos/` — os módulos leem
assets em `../../assets/`, que só existem a partir da raiz.
