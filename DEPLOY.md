# Deploy — Hifera

Como o site vai para o ar, como saber se quebrou e como voltar atrás.
Vale para <https://higorcabral.github.io/TesteXbox/>.

## O ambiente

| | |
|---|---|
| Hospedagem | GitHub Pages (build nativo por branch, sem Actions) |
| Origem | `Higorcabral/TesteXbox`, branch `main`, pasta `/` |
| Publica quando | há push em `main` — não existe etapa de build |
| Tempo até o ar | ~30 s a 2 min |
| Custo | R$ 0 |

Consequência que dita tudo: **a raiz do repositório é a raiz de publicação.**
O que sai dessa pasta some do site; o que entra nela vai ao ar no próximo push.

## Publicar

```bash
./scripts/publicar.sh "o que mudou"
```

É o caminho normal, e faz sempre a mesma sequência:

1. **Sanidade** — branch certa, `gh` autenticado, remoto sincronizado
2. **Referências** — procura link quebrado *antes* de subir
3. **Commit e push**
4. **Espera o Pages** terminar de construir (não é instantâneo)
5. **Confere as rotas no ar** — o passo que separa "publiquei" de "funcionou"

Qualquer passo que falhe interrompe a sequência e imprime o comando de saída.
Se a verificação do passo 2 falhar, **nada é enviado**.

Para checar sem publicar:

```bash
./scripts/publicar.sh --so-verificar
```

## Verificar

```bash
python3 scripts/verificar.py links     # offline, antes de subir
python3 scripts/verificar.py rotas     # online, contra produção
python3 scripts/verificar.py tudo      # os dois
```

O `links` varre HTML, CSS e `js/vitrine-dados.js` e acusa quatro coisas:

| O que pega | Por que importa |
|---|---|
| Arquivo que não existe | o óbvio |
| Caminho absoluto (`/assets/…`) | o site vive em `/TesteXbox/`, não na raiz do domínio — absoluto aponta para fora |
| **Maiúscula/minúscula errada** | o Mac não diferencia, o servidor do GitHub sim. Abre aqui, dá 404 em produção |
| Projeto publicado na vitrine apontando para link morto | o card aparece na home e não abre |

O terceiro é o traiçoeiro: passa em todos os testes locais e só quebra no ar.

Para acrescentar uma rota nova ao monitoramento, edite a lista `ROTAS_OK`
no topo do `scripts/verificar.py`. `ROTAS_404` é o contrário — rotas que
precisam continuar não existindo, para que uma pasta velha não volte
sozinha num merge.

## Monitorar

Dois workflows, ambos de graça em repositório público:

| Workflow | Quando | O que faz |
|---|---|---|
| `verificar.yml` | todo push e PR | roda o `links` num runner **Linux** — é a rede contra o erro de maiúscula que o Mac esconde |
| `monitorar.yml` | de 6 em 6 horas | roda o `rotas` contra produção |

Quando o `monitorar` acha rota fora, ele abre uma issue com a etiqueta
`site-fora` contendo a saída completa. Se já houver uma issue aberta, só
comenta nela — não vira enxurrada. Quando o site volta, ele comenta e
**fecha a issue sozinho**.

Rodar na hora, sem esperar o horário:

```bash
gh workflow run monitorar.yml && sleep 20 && gh run list --workflow=monitorar.yml --limit 3
```

**Limite conhecido:** o GitHub desliga workflows agendados depois de 60 dias
sem commit no repositório. Se as execuções sumirem, é isso — reative em
Actions → *Verificar site no ar* → *Enable workflow*. Uma checagem a cada 6h
também significa que uma queda pode levar até 6h para ser notada; para um
site institucional em MVP isso é aceitável, e o custo é zero. Se um dia
precisar de minutos em vez de horas, aí sim entra um serviço externo de
uptime (UptimeRobot tem plano gratuito de 5 min).

## Voltar atrás

O deploy é um commit, então reverter também é:

```bash
git revert HEAD && ./scripts/publicar.sh "revert: volta o deploy anterior"
```

O `publicar.sh` imprime o comando de revert já com o hash certo logo depois
de cada push — é só copiar. Prefira `revert` a `reset --hard`: o histórico
fica honesto e ninguém precisa forçar push.

Para inspecionar o que estava no ar antes:

```bash
git log --oneline -10
git show <hash> --stat
```

## Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Publicou e o navegador mostra o antigo | cache do `?v=N` | suba o número no `<link>`/`<script>` que mudou |
| Rota 404 no ar, 200 no local | maiúscula/minúscula, ou arquivo não commitado | `python3 scripts/verificar.py links` e `git status` |
| Build do Pages com erro | quase sempre Jekyll tentando processar | confira que o `.nojekyll` continua na raiz |
| Página interna sem estilo | caminho de `modulos/` errado | confira o `window.HIFERA_PATHS` no `<head>` da página |
| Issue `site-fora` aberta | monitoramento achou rota caída | leia a saída na issue; corrija e publique — ela fecha sozinha |

## O que ainda não existe

Registrado de propósito, para não parecer que está coberto:

- **Ambiente de homologação.** Só existe produção. Um `staging` daria para
  fazer publicando uma branch em outro repositório Pages, mas não está feito.
- **Domínio próprio.** O site está no subcaminho `higorcabral.github.io/TesteXbox/`.
  Quando `hifera.com` apontar para cá, revisar o `PROD` no `verificar.py`,
  o `canonical` da `index.html` e o `CNAME`.
- **Teste de interface automatizado.** O verificador confere que as páginas
  respondem e que os arquivos existem — não que os botões funcionam.
