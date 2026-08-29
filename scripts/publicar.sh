#!/usr/bin/env bash
# =====================================================================
# HIFERA · Publicação padronizada
# ---------------------------------------------------------------------
#   ./scripts/publicar.sh "mensagem do commit"
#   ./scripts/publicar.sh --so-verificar     (não publica, só checa)
#
# Faz sempre a mesma sequência, na mesma ordem:
#   1. confere que a árvore está sã e na branch certa
#   2. verifica referências quebradas ANTES de subir
#   3. commita e empurra
#   4. espera o GitHub Pages terminar de construir
#   5. confere as rotas NO AR
#
# Se qualquer passo falhar, para ali e diz o que fazer.
# =====================================================================
set -uo pipefail

REPO="Higorcabral/TesteXbox"
BRANCH="main"
PROD="https://higorcabral.github.io/TesteXbox"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

V='\033[32m'; R='\033[31m'; A='\033[33m'; N='\033[1m'; F='\033[0m'
ok()    { echo -e "  ${V}✓${F} $1"; }
erro()  { echo -e "  ${R}✗${F} $1"; }
passo() { echo -e "\n${N}$1${F}"; }
morre() { erro "$1"; [ -n "${2:-}" ] && echo -e "    ${A}→ $2${F}"; exit 1; }

cd "$RAIZ"
SO_VERIFICAR=false
[ "${1:-}" = "--so-verificar" ] && SO_VERIFICAR=true

# --- 1. Sanidade -----------------------------------------------------
passo "1/5 · Sanidade do repositório"

atual="$(git rev-parse --abbrev-ref HEAD)"
[ "$atual" = "$BRANCH" ] || morre "você está em '$atual', não em '$BRANCH'" \
  "o GitHub Pages publica de '$BRANCH'; troque com: git switch $BRANCH"
ok "branch $BRANCH"

command -v gh >/dev/null || morre "gh CLI não encontrado" "instale com: brew install gh"
gh auth status >/dev/null 2>&1 || morre "gh não autenticado" "rode: gh auth login"
ok "gh autenticado"

git fetch origin --quiet
atras="$(git rev-list --count HEAD..origin/$BRANCH)"
[ "$atras" -eq 0 ] || morre "o remoto tem $atras commit(s) que você não tem" \
  "rode: git pull --rebase origin $BRANCH"
ok "sincronizado com o remoto"

if $SO_VERIFICAR; then
  passo "2/5 · Referências (offline)"
  python3 scripts/verificar.py links || exit 1
  passo "· Rotas do que já está no ar"
  python3 scripts/verificar.py rotas "$PROD" || exit 1
  echo -e "\n${V}Só verificação — nada foi publicado.${F}\n"
  exit 0
fi

# --- 2. Verificação antes de subir -----------------------------------
passo "2/5 · Referências (offline)"
python3 scripts/verificar.py links \
  || morre "há referência quebrada — corrija antes de publicar" \
           "nada foi enviado; o repositório continua como estava"

# --- 3. Commit + push ------------------------------------------------
passo "3/5 · Commit e envio"

if [ -z "$(git status --porcelain)" ]; then
  ok "nada novo para commitar — seguindo para a verificação do que está no ar"
else
  MSG="${1:-}"
  [ -n "$MSG" ] || morre "faltou a mensagem do commit" \
    "uso: ./scripts/publicar.sh \"o que mudou\""
  git add -A
  echo "  arquivos:"
  git diff --cached --name-status | sed 's/^/    /'
  git commit -q -m "$MSG"
  ok "commit $(git rev-parse --short HEAD)"
fi

antes="$(git rev-parse origin/$BRANCH)"
if [ "$antes" != "$(git rev-parse HEAD)" ]; then
  git push -q origin "$BRANCH" || morre "push falhou"
  ok "enviado: ${antes:0:7}..$(git rev-parse --short HEAD)"
  echo -e "    ${A}reverter, se precisar:${F} git revert $(git rev-parse --short HEAD) && git push"
else
  ok "remoto já está neste commit"
fi

# --- 4. Esperar o Pages ----------------------------------------------
passo "4/5 · Build do GitHub Pages"
echo -n "  aguardando"
for _ in $(seq 1 60); do
  st="$(gh api "repos/$REPO/pages" --jq .status 2>/dev/null || echo '?')"
  [ "$st" = "built" ] && break
  [ "$st" = "errored" ] && { echo; morre "o build do Pages falhou" \
    "veja em: https://github.com/$REPO/deployments"; }
  echo -n "."
  sleep 5
done
echo
[ "$st" = "built" ] || morre "o build não terminou em 5 minutos" \
  "veja em: https://github.com/$REPO/deployments"
ok "build concluído"

# --- 5. Conferir no ar -----------------------------------------------
passo "5/5 · Rotas em produção"
sleep 3   # o CDN leva alguns segundos para trocar
python3 scripts/verificar.py rotas "$PROD" \
  || morre "publicou, mas há rota quebrada no ar" \
           "reverta com: git revert HEAD && ./scripts/publicar.sh \"revert\""

echo -e "\n${V}${N}No ar:${F} $PROD\n"
