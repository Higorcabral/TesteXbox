# Hifera · Portal do cliente

A área que o **cliente** acessa. Separada de `/modulos/`, que é interna
da Hifera, porque são públicos diferentes: aqui entra quem contratou,
lá entra quem entrega.

Fica fora dos buscadores (`noindex` + `Disallow: /portal/` no
robots.txt) e não é linkada do site público.

| Rota | O que é |
|---|---|
| `/portal/` | Entrada do cliente (magic link — ver *Autenticação*) |
| `/portal/painel.html#panorama` | Como está a entrega, o que devo, o que chegou |
| `/portal/painel.html#projeto` | Roteiro de entrega e parcelas |
| `/portal/painel.html#leads` | Contatos que o sistema entregue capturou |
| `/portal/painel.html#chamados` | Lista, detalhe e abertura de chamado |

## Estrutura

```
portal/
├── index.html                        entrada
├── painel.html                       shell único, 4 telas por hash
├── supabase/
│   └── schema.sql                    portal_acessos + RLS (não publicado)
└── js/
    ├── config.js                     URL + anon key do Supabase
    ├── models/
    │   ├── SupabaseAuthModel.js      magic link e token, por fetch
    │   ├── ClientAuthModel.js        sessão do cliente e vínculo
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

## Autenticação

Entrada por **magic link** no Supabase. O cliente digita o e-mail,
recebe um link de uso único e entra — sem senha para criar e sem senha
para esquecer, que é o que faz sentido para quem usa o portal poucas
vezes por mês.

```
portal/js/config.js                  URL e anon key do projeto
portal/js/models/SupabaseAuthModel.js  GoTrue + PostgREST por fetch
portal/js/models/ClientAuthModel.js    quem é a pessoa e de qual cliente
portal/supabase/schema.sql             tabela portal_acessos + RLS
```

Não há SDK: são quatro chamadas de rede, e carregar um bundle de CDN
para fazer quatro `fetch` custaria mais em dependência do que economiza
em código. `create_user:false` no envio do link é o que impede que
digitar um e-mail qualquer crie conta e vire acesso.

**O vínculo pessoa → cliente não mora no navegador.** Ele vem da tabela
`portal_acessos`, lida com o token da própria pessoa; a política de RLS
devolve só a linha de quem perguntou. O portal manda um `select` sem
filtro nenhum e recebe uma linha só — o escopo é decisão do banco, não
do JavaScript.

Dois estados na tela de entrada, decididos pelo model:

| Estado | Quando | O que aparece |
|---|---|---|
| magic link | `config.js` preenchido | campo de e-mail, e só |
| sem clientes | `config.js` vazio | "Nenhum cliente cadastrado" + **Ver acesso de exemplo** |

O acesso de exemplo abre uma empresa fictícia com dados de demonstração,
e o painel carrega marcado como tal na barra lateral. Ele existe **só
enquanto o Supabase estiver desligado**: `signInExemplo()` recusa se
`configurado()` for verdadeiro, e a tela que oferece o botão nem chega a
ser montada. Não é uma porta que alguém precise lembrar de fechar quando
o primeiro cliente real entrar.

Em `localhost` a mesma tela ganha um seletor com as cinco contas
fictícias — conveniência de desenvolvimento, para conferir cada cliente
sem mexer em código. Não é controle de acesso.

Sessão do portal é separada da do painel interno: entrar num não dá
acesso ao outro.

### Ligar em um projeto novo

1. Supabase → Project Settings → API: copie *Project URL* e *anon
   public* para `portal/js/config.js`
2. Authentication → URL Configuration → Redirect URLs: adicione
   `https://clientes.hifera.com.br/`
3. rode `portal/supabase/schema.sql` no SQL Editor
4. para cada pessoa: Authentication → Users → *Add user / Send invite*,
   e depois a linha correspondente em `portal_acessos`

### O que ainda é do navegador

Projeto, leads e chamados continuam vindo de seed local — a autenticação
é real, os dados ainda não. Quando eles subirem para o Supabase, cada
tabela precisa da sua própria política de RLS por cliente; até lá, o
`ClientProjectModel` segue sendo a fronteira (ver acima).

## Rodando local

```
python3 -m http.server 5610 --directory <raiz do HiferaWebSite>
```

Depois `http://localhost:5610/portal/`. Sempre pela raiz — o portal lê
`../modulos/core/` e `../assets/`.
