# Deploy — Hifera

Como o site vai para o ar, como saber se quebrou e como voltar atrás.

## O ambiente

Três Static Web Apps no Azure, um por subdomínio, publicados do mesmo
repositório:

| Subdomínio | App | O que é | Acesso |
|---|---|---|---|
| `www.hifera.com.br` | `site` | institucional, demos e o Ledger | público |
| `admin.hifera.com.br` | `admin` | gestão de projetos e chamados | **Microsoft + papel por convite** |
| `clientes.hifera.com.br` | `clientes` | área do cliente | login próprio do portal |

Domínio: `hifera.com.br`, no Registro.br, DNS no próprio Registro.br.
Vence em **11/08/2028** — a data está na ficha e no calendário.

O GitHub Pages foi desligado em 05/09/2026. Antes disso ele publicava em
paralelo com o Azure, servindo o mesmo conteúdo em dois endereços.

## Por que existe uma etapa de montagem

Os três apps saem de um repositório só, mas o código é compartilhado:
`portal/` usa `modulos/core/` (CSS, `caminhos.js`, `format.js` e quatro
models) e os dois usam `assets/logo/`.

Apontar o `app_location` direto para a pasta subiria o portal **sem CSS e
sem JS**. Por isso existe o `scripts/montar.py`: ele copia o que cada app
precisa, corrige os caminhos para a nova profundidade e escreve o
`staticwebapp.config.json` daquele app.

```bash
python3 scripts/montar.py            # monta os três em dist/
python3 scripts/montar.py admin      # monta só um
```

`dist/` é descartável e está no `.gitignore`. **Nunca edite nada lá dentro** —
o próximo `montar.py` apaga.

O que a montagem reescreve, e por quê:

| De | Para | Motivo |
|---|---|---|
| `../../assets/` | `../assets/` | `modulos/admin/` virou `/admin/`: perdeu um nível |
| `../modulos/core/` | `core/` | o core é copiado para dentro do app de clientes |
| `href="../"` | `https://www.hifera.com.br/` | a partir da raiz de um subdomínio, `../` sobe acima do domínio e não vai a lugar nenhum |
| `site: '../../'` | `https://www.hifera.com.br/` | miniatura e link de projeto moram no site público |
| — | `HIFERA_AUTH_EDGE` + `auth-edge.js` | só no app admin: avisa o código de que o Azure já autenticou |

## Publicar

Push em `main`. O workflow `publicar.yml` monta e sobe os três em paralelo.

Antes de subir, dois portões:

1. `verificar.py links` no repositório, num runner **Linux** — é onde
   aparece o erro de maiúscula/minúscula que o Mac esconde
2. `verificar.py links dist/<app>` em **cada pasta montada** — é o que pega
   caminho quebrado pela mudança de profundidade

Um app que falhe não derruba os outros (`fail-fast: false`). Um app cujo
segredo ainda não existe é **pulado com aviso**, não falha.

## Verificar

```bash
python3 scripts/verificar.py links                 # repositório
python3 scripts/verificar.py links dist/admin      # uma pasta montada
python3 scripts/verificar.py rotas                 # os três no ar
python3 scripts/verificar.py rotas admin           # só um
```

O `links` acusa três coisas: arquivo que não existe, **maiúscula/minúscula
que não bate com o disco** (abre no Mac, dá 404 no servidor) e projeto
publicado na vitrine apontando para link morto.

O `rotas` confere três coisas diferentes por app:

- **`ok`** — precisa responder 200
- **`ausente`** — precisa responder 404. É o que pega a área interna
  vazando de volta para o site público num merge
- **`protegido`** — precisa exigir login. Um 200 aqui significa painel
  aberto para qualquer pessoa. O verificador **não segue o redirecionamento**
  de propósito: seguindo, chegaria ao login da Microsoft, veria 200 e passaria
  com o painel desprotegido

## Monitorar

| Workflow | Quando | O que faz |
|---|---|---|
| `verificar.yml` | todo push e PR | `links` no repositório |
| `publicar.yml` | push em `main` | monta, confere cada `dist/` e publica |
| `monitorar.yml` | de 6 em 6 horas | `rotas` contra os três subdomínios |

Quando o monitor acha rota fora, abre issue com a etiqueta `site-fora` e
comenta nela se já houver uma aberta. Volta ao ar, fecha sozinha.

O GitHub desliga workflow agendado depois de 60 dias sem commit. Se as
execuções sumirem, reative em Actions → *Verificar site no ar* → *Enable*.

## O acesso ao admin

Quem autentica é o Static Web App, **na borda**, antes de servir a página.
Isso é diferente do que existia: o login do painel era uma fachada em
`sessionStorage` que qualquer pessoa com o console aberto contornava.

**Todos os três apps estão no tier Free.** Autenticação com registro próprio
do Entra é recurso de Standard (~US$ 9/mês), e foi trocada pelo provedor
Microsoft embutido, que é gratuito. A diferença importa:

| | Standard (registro próprio) | Free (embutido) — **é o que está no ar** |
|---|---|---|
| Quem consegue autenticar | só contas do tenant da Hifera | **qualquer conta Microsoft** |
| Quem consegue entrar | qualquer pessoa do tenant, automático | só quem tem o papel `hifera` |
| Como se libera alguém | nada, é automático | **um convite por pessoa** |

Por isso a regra é `allowedRoles: ["hifera"]`, e **não** `authenticated`:
com `authenticated`, qualquer conta Microsoft do mundo entraria no painel.

O fluxo para quem não tem o papel: autentica na Microsoft, volta, recebe
403 e cai em `/sem-acesso.html`, que mostra com qual conta ela entrou —
sem isso a pessoa não sabe se errou de conta ou não tem permissão.

### Convidar alguém

```bash
az staticwebapp users invite -n hifera-admin -g ADMIN-IT-RESOURCES \
  --authentication-provider aad --user-details "pessoa@hifera.com.br" \
  --role hifera --domain admin.hifera.com.br \
  --invitation-expiration-in-hours 168 --query invitationUrl -o tsv
```

O link vale 7 dias e **dá acesso a quem o abrir** — mande por canal privado,
não por grupo. Depois de aceito, o papel fica; o link expirar não derruba
ninguém.

Ver e remover quem tem acesso:

```bash
az staticwebapp users list -n hifera-admin -g ADMIN-IT-RESOURCES -o table
az staticwebapp users update -n hifera-admin -g ADMIN-IT-RESOURCES \
  --user-id <id> --role ""     # tira o papel
```

Limite do Free: 25 usuários com papel por app. Para dois sócios sobra muito.

### As duas pontes no código

Em `modulos/core/`, e sem elas o app quebra de formas que só apareceriam
em produção:

- **`auth-edge.js`** busca `/.auth/me` e preenche a identidade real. Sem
  ele, o painel mostraria o usuário mockado para qualquer pessoa e o log
  registraria o autor errado — pior que não ter nome é ter o de outra pessoa
- **`AuthController`** reconhece `HIFERA_AUTH_EDGE` e pula o guard mockado.
  Sem isso o guard não acharia `sessionStorage`, mandaria para o login, que
  redireciona de volta: **laço de redirecionamento**

Rodando local nada disso é carregado e o mock continua valendo.

## Voltar atrás

```bash
git revert HEAD && git push
```

O deploy é um commit. Para inspecionar o que estava no ar:

```bash
git log --oneline -10
git show <hash> --stat
```

## Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Publicou e o navegador mostra o antigo | cache do `?v=N` | suba o número no `<link>`/`<script>` que mudou |
| Rota 404 no ar, 200 no local | maiúscula/minúscula, ou arquivo não commitado | `verificar.py links` e `git status` |
| Página interna sem estilo | caminho de `modulos/` errado | confira `window.HIFERA_PATHS` no `<head>` |
| Portal sem CSS depois do deploy | `montar.py` não copiou o core | rode `montar.py clientes` e confira `dist/clientes/core/` |
| Admin em laço de redirecionamento | `HIFERA_AUTH_EDGE` não foi injetado | confira a injeção em `montar.py` e o `auth-edge.js` no `dist/admin` |
| Admin abre sem pedir login | `admin.config.json` não subiu, ou a regra virou `authenticated` | confira o `staticwebapp.config.json` no `dist/admin`: a regra `/*` tem de exigir o papel `hifera` |
| Pessoa certa recebe “sem acesso” | não tem o papel | gere um convite (ver acima) |
| Um app não publicou | falta o segredo | leia o aviso no resumo do workflow |

## O que ainda não existe

- **Ambiente de homologação.** Só existe produção. O Static Web App cria
  ambiente por pull request — dá para usar, mas não está combinado.
- **Login automático para o tenant.** No Free, cada pessoa precisa de um
  convite. Voltar ao Standard (~US$ 9/mês) libera todo o tenant sozinho.
- **Apex `hifera.com.br`.** Não abre: apontar apex para Static Web App exige
  registro ALIAS/ANAME, que o Registro.br não oferece. Só `www` funciona.
- **Teste de interface automatizado.** O verificador confere que as páginas
  respondem e que os arquivos existem — não que os botões funcionam.
- **Varredura de segredo no CI.** A regra "nenhuma chave no repositório"
  ainda depende de disciplina.
