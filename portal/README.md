# Hifera · Portal do cliente

A área que o **cliente** acessa. Separada de `/modulos/`, que é interna
da Hifera, porque são públicos diferentes: aqui entra quem contratou,
lá entra quem entrega.

Fica fora dos buscadores (`noindex` + `Disallow: /portal/` no
robots.txt) e não é linkada do site público.

| Rota | O que é |
|---|---|
| `/portal/` | Entrada do cliente (mock — ver *Autenticação*) |
| `/portal/painel.html#panorama` | Como está a entrega, o que devo, o que chegou |
| `/portal/painel.html#projeto` | Roteiro de entrega e parcelas |
| `/portal/painel.html#leads` | Contatos que o sistema entregue capturou |
| `/portal/painel.html#chamados` | Lista, detalhe e abertura de chamado |

## Estrutura

```
portal/
├── index.html                        entrada
├── painel.html                       shell único, 4 telas por hash
└── js/
    ├── models/
    │   ├── ClientAuthModel.js        sessão do cliente (mock)
    │   ├── ClientProjectModel.js     PROJEÇÃO do projeto — ver abaixo
    │   └── LeadsModel.js             leads do negócio do cliente
    ├── views/
    │   ├── UI.js                     ícones + marco, pill e toast
    │   ├── PanoramaView.js
    │   ├── ProjetoView.js
    │   ├── LeadsView.js
    │   └── ChamadosView.js
    ├── controllers/
    │   ├── PortalAuthController.js   entrada e guard
    │   └── PortalController.js       roteador por hash
    ├── boot-login.js
    └── boot.js
```

O portal reusa `/modulos/core/` (tokens de CSS, `Fmt`, `StoreModel`,
`ProjectsModel`, `TicketsModel`, `ThemeController`) declarando os
caminhos em `HIFERA_PATHS`, como qualquer outra tela.

**Isso é uma dívida consciente:** `core/` mora dentro de `modulos/`,
que hoje serve também um app que não é módulo interno. Enquanto forem
dois consumidores, o caminho relativo resolve. No terceiro, `core/`
sobe para a raiz do site e as três linhas de `HIFERA_PATHS` de cada
página acompanham.

## A regra que sustenta o portal

> **O que é da Hifera não atravessa.**

O `ClientProjectModel` não é um wrapper de conveniência: é a fronteira.
Ele monta um objeto novo, campo a campo, com **lista branca**. Gastos,
margem, resultado, meta de faturamento, observação interna e o diário
do projeto simplesmente não existem no que sai dele — não é a view que
esconde.

A fricção é de propósito: campo novo no `ProjectsModel` **não** chega
ao portal sozinho. Alguém precisa copiá-lo para a projeção, e nessa
hora decide se o cliente deve mesmo vê-lo.

Do dinheiro, o cliente vê só o lado dele:

| Vê | Não vê |
|---|---|
| Contratado, pago, a pagar | Gastos da Hifera |
| Parcelas por competência e vencimento | Margem e resultado |
| Percentual quitado | Meta de faturamento |

O mesmo vale para leitura por cliente: `LeadsModel.porCliente()` e
`ClientProjectModel.porCliente()` **exigem** o cliente e devolvem lista
vazia sem ele. Não existe `getAll()` público em nenhum dos dois. O
detalhe de chamado confere a `empresa` antes de desenhar, então um id
chutado na URL devolve "não pertence a você", não o chamado.

## Marcos são lidos pelo cliente

O `marco.nota` cadastrado no painel interno aparece no portal. O campo
avisa isso no formulário ("o cliente lê isto no portal dele") porque a
alternativa — descobrir depois — é pior.

Quem move marco é a Hifera. No portal o roteiro é só leitura.

## Leads

Leads **do negócio do cliente**: quem preencheu o formulário do site,
marcou horário, chamou no WhatsApp ou veio por indicação. Não são leads
comerciais da Hifera.

É a única tela do portal com escrita: o cliente move a fila
(novo → em contato → ganho/perdido) e anota. O `LeadsModel` só aceita a
mudança se o lead for do cliente da sessão.

Exporta CSV com BOM, para o Excel em pt-BR abrir os acentos certos.

Dados em `hifera.portal.leads.v1`. **Sobre dados pessoais:** o cadastro
guarda o mínimo (nome, e-mail, origem) e tudo é fictício. Quando isto
virar produto com gente real, LGPD entra antes de qualquer campo novo —
base legal, retenção e o direito de apagar.

## Chamados

Mesmo `TicketsModel` do painel interno, mesma chave de storage
(`hifera.admin.chamados.v1`). Chamado aberto no portal aparece na fila
da Hifera na hora, e resposta da Hifera aparece no portal.

Foi por causa disso que o `TicketsModel` saiu de `modulos/chamados/` e
subiu para `modulos/core/`: dois consumidores, mesma regra do README dos
módulos.

O formulário é a mesma cascata Categoria → Sistema → Módulo, que define
a fila sozinha. O que sumiu em relação ao interno: empresa, solicitante
e e-mail. Esses vêm da sessão — no portal ninguém digita quem é.

Duas coisas que o cliente **não** faz: marcar a própria resposta como
solução e fechar o próprio chamado. Responder num chamado em
"Aguardando cliente" devolve ele para "Em andamento", porque a bola
voltou para a Hifera e o SLA tem que voltar a correr.

## Autenticação — o que falta para valer

`ClientAuthModel.js` é fachada, igual à do painel interno: a sessão vive
no `sessionStorage` e a tela de entrada é uma lista de contas de
demonstração. Segura o protótipo, não protege nada.

O que ela já faz de certo e precisa continuar fazendo: a sessão carrega
**um** cliente, e todo o resto filtra por ele.

Para virar acesso real:

1. Entra ID **externo** (B2C) ou magic link por e-mail — o cliente não
   tem conta corporativa da Hifera
2. o escopo do cliente vem do token, **nunca** de parâmetro de URL
3. o filtro por cliente passa a ser do servidor. Enquanto for 100%
   estático no GitHub Pages, o filtro é do navegador e portanto não é
   controle de acesso — é organização de tela

Sessão do portal (`hifera.portal.session`) é separada da do painel
(`hifera.admin.session`): entrar num não dá acesso ao outro.

## Rodando local

```
python3 -m http.server 5610 --directory <raiz do HiferaWebSite>
```

Depois `http://localhost:5610/portal/`. Sempre pela raiz — o portal lê
`../modulos/core/` e `../assets/`.
