#!/usr/bin/env python3
# =====================================================================
# HIFERA · Verificação do site
# ---------------------------------------------------------------------
# Só biblioteca padrão. Roda igual no Mac e no runner do GitHub Actions.
#
#   python3 scripts/verificar.py links [raiz]     antes de publicar (offline)
#   python3 scripts/verificar.py rotas [app]      depois de publicar (online)
#   python3 scripts/verificar.py tudo             os dois
#
# `raiz` permite conferir uma pasta montada: dist/admin, dist/clientes…
# `app` é site, admin, clientes ou todos (padrão).
#
# Sai com código 1 se achar problema — é isso que faz o deploy parar e
# o monitor abrir issue.
# =====================================================================
import os
import re
import sys
import html.parser
import urllib.request
import urllib.error

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAIZ = REPO   # trocada por --raiz ao conferir uma pasta montada em dist/

# Um Static Web App por subdomínio. Cada um serve conteúdo diferente,
# então cada um tem a sua lista.
APPS = {
    'site': {
        'ativo': True,
        'base': 'https://www.hifera.com.br',
        'ok': ['/', '/robots.txt', '/style.css',
               '/js/vitrine.js', '/js/demo.js',
               '/projetos/Projeto-CRM/', '/projetos/Projeto-Mani/',
               '/projetos/Projeto-Mecan/', '/projetos/Projeto-Stoq/',
               '/apps/ledger/', '/v2/'],
        # A área interna saiu daqui: se voltar a responder, é vazamento.
        'ausente': ['/modulos/', '/modulos/admin/', '/portal/', '/scripts/montar.py'],
    },
    'admin': {
        # Vira True quando o Static Web App existir e o DNS resolver.
        # Antes disso o monitor abriria issue todo dia por um subdomínio
        # que ainda não foi criado — e alarme falso treina a gente a ignorar.
        'ativo': False,
        'base': 'https://admin.hifera.com.br',
        # Tudo exige login: 200 significaria painel aberto para anônimo.
        'ok': [],
        'ausente': [],
        'protegido': ['/', '/admin/', '/chamados/'],
    },
    'clientes': {
        'ativo': False,
        'base': 'https://clientes.hifera.com.br',
        'ok': ['/', '/painel.html', '/core/css/admin.css'],
        'ausente': [],
    },
}

# /.auth/* é servido pelo próprio Static Web App em tempo de execução;
# não existe como arquivo e nunca vai existir no disco.
IGNORAR_PREFIXO = ('http://', 'https://', '//', 'mailto:', 'tel:', 'data:',
                   'javascript:', '#', '/.auth/')
PASTAS_FORA = {'.git', 'node_modules', '.github'}

VERDE, VERM, AMAR, FIM = '\033[32m', '\033[31m', '\033[33m', '\033[0m'
if not sys.stdout.isatty():
    VERDE = VERM = AMAR = FIM = ''


# ---------------------------------------------------------------------
# Coleta de referências
# ---------------------------------------------------------------------
class ColetorHTML(html.parser.HTMLParser):
    """Junta todo href/src/poster do documento."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        for attr in ('href', 'src', 'poster'):
            valor = d.get(attr)
            if valor:
                self.refs.append((attr, valor, self.getpos()[0]))


def arquivos(*extensoes):
    for base, dirs, nomes in os.walk(RAIZ):
        dirs[:] = [d for d in dirs if d not in PASTAS_FORA]
        for n in nomes:
            if n.endswith(extensoes):
                yield os.path.join(base, n)


def caminho_no_disco(origem, ref):
    """Resolve uma referência relativa. Devolve o caminho absoluto ou None."""
    ref = ref.split('?')[0].split('#')[0]
    if not ref:
        return None
    if ref.startswith('/'):
        # No Azure cada app é servido na raiz do seu domínio, então '/x'
        # resolve a partir da raiz do app. (No GitHub Pages, que servia em
        # /TesteXbox/, isso quebrava — por isso a regra antiga barrava.)
        return os.path.join(RAIZ, ref.lstrip('/'))
    return os.path.normpath(os.path.join(os.path.dirname(origem), ref))


def caixa_confere(caminho):
    """
    O Mac não diferencia maiúscula de minúscula; o servidor do GitHub sim.
    'Assets/logo.png' abre aqui e dá 404 em produção. Esta função compara
    componente a componente com o que está realmente no disco.
    """
    atual = caminho
    while len(atual) > len(RAIZ):
        pai, nome = os.path.split(atual)
        try:
            if nome not in os.listdir(pai):
                return False, atual
        except OSError:
            return False, atual
        atual = pai
    return True, None


# ---------------------------------------------------------------------
# Verificação 1 — referências quebradas (offline)
# ---------------------------------------------------------------------
def verificar_links():
    problemas = []
    total = 0

    def checar(origem, ref, linha, contexto):
        nonlocal total
        if ref.startswith(IGNORAR_PREFIXO):
            return
        total += 1
        rel_origem = os.path.relpath(origem, RAIZ)
        alvo = caminho_no_disco(origem, ref)
        if alvo is None:
            return

        existe = os.path.isfile(alvo)
        if os.path.isdir(alvo):
            indice = os.path.join(alvo, 'index.html')
            if os.path.isfile(indice):
                alvo, existe = indice, True

        if not existe:
            problemas.append((rel_origem, linha,
                              f'{contexto} "{ref}" — não existe no disco'))
            return

        ok, culpado = caixa_confere(alvo)
        if not ok:
            problemas.append((rel_origem, linha,
                              f'{contexto} "{ref}" — maiúscula/minúscula não bate '
                              f'com o disco em "{os.path.relpath(culpado, RAIZ)}". '
                              f'Abre no Mac, dá 404 em produção'))

    # HTML
    for arq in arquivos('.html'):
        col = ColetorHTML()
        col.feed(open(arq, encoding='utf-8', errors='replace').read())
        for attr, valor, linha in col.refs:
            checar(arq, valor, linha, attr)

    # CSS — url(...)
    for arq in arquivos('.css'):
        texto = open(arq, encoding='utf-8', errors='replace').read()
        for m in re.finditer(r'url\(\s*[\'"]?([^\'")]+)', texto):
            linha = texto[:m.start()].count('\n') + 1
            checar(arq, m.group(1), linha, 'url()')

    # Vitrine publicada — link e imagem de cada projeto, relativos à raiz
    dados = os.path.join(RAIZ, 'js', 'vitrine-dados.js')
    if os.path.isfile(dados):
        texto = open(dados, encoding='utf-8', errors='replace').read()
        indice = os.path.join(RAIZ, 'index.html')
        for chave in ('link', 'src'):
            for m in re.finditer(r'"%s"\s*:\s*"([^"]+)"' % chave, texto):
                linha = texto[:m.start()].count('\n') + 1
                checar(indice, m.group(1), linha, f'vitrine-dados.js:{chave}')

    print(f'  {total} referências verificadas em HTML, CSS e vitrine-dados.js')
    if problemas:
        print(f'\n{VERM}  {len(problemas)} referência(s) quebrada(s):{FIM}')
        for arquivo, linha, msg in problemas:
            print(f'    {VERM}✗{FIM} {arquivo}:{linha}  {msg}')
        return False
    print(f'  {VERDE}✓ nenhuma referência quebrada{FIM}')
    return True


# ---------------------------------------------------------------------
# Verificação 2 — rotas no ar (online)
# ---------------------------------------------------------------------
class SemRedirect(urllib.request.HTTPRedirectHandler):
    """Deixa o 302 passar em vez de segui-lo.

    É o que permite testar o SSO: se seguíssemos o redirecionamento até o
    login da Microsoft, a resposta final seria 200 e o teste passaria com
    o painel desprotegido."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def status(url, tentativas=3, seguir=True):
    abridor = urllib.request.build_opener() if seguir \
        else urllib.request.build_opener(SemRedirect)
    for n in range(tentativas):
        req = urllib.request.Request(url, method='GET',
                                     headers={'User-Agent': 'hifera-verificador'})
        try:
            with abridor.open(req, timeout=20) as r:
                return r.status
        except urllib.error.HTTPError as e:
            return e.code
        except Exception as e:
            if n == tentativas - 1:
                return f'erro: {e}'
    return 'erro'


def verificar_rotas(nome, cfg):
    base = cfg['base'].rstrip('/')
    print(f'\n  {nome} — {base}')
    falhas = []

    for rota in cfg.get('ok', []):
        cod = status(base + rota)
        ok = cod == 200
        print(f'    {VERDE + "✓" + FIM if ok else VERM + "✗" + FIM} {rota:<30} {cod}')
        if not ok:
            falhas.append(f'{nome}{rota} devolveu {cod}, esperado 200')

    # Rotas que precisam NÃO existir: uma pasta que voltou sozinha num
    # merge, ou área interna vazando no site público.
    for rota in cfg.get('ausente', []):
        cod = status(base + rota)
        ok = cod in (404, 403)
        print(f'    {VERDE + "✓" + FIM if ok else VERM + "✗" + FIM} {rota:<30} {cod} (esperado 404)')
        if not ok:
            falhas.append(f'{nome}{rota} devolveu {cod}, deveria estar fora do ar')

    # Rotas protegidas por SSO: anônimo tem de ser barrado ou mandado
    # para o login. 200 aqui significa painel aberto para qualquer um.
    for rota in cfg.get('protegido', []):
        cod = status(base + rota, seguir=False)
        ok = cod in (302, 401, 403)
        print(f'    {VERDE + "✓" + FIM if ok else VERM + "✗" + FIM} {rota:<30} {cod} (login exigido)')
        if not ok:
            falhas.append(f'{nome}{rota} devolveu {cod} sem login — deveria exigir autenticação')

    if falhas:
        for f in falhas:
            print(f'    {VERM}✗{FIM} {f}')
        return False
    total = sum(len(cfg.get(k, [])) for k in ('ok', 'ausente', 'protegido'))
    print(f'    {VERDE}✓ {total} rotas conferidas{FIM}')
    return True


# ---------------------------------------------------------------------
def main():
    global RAIZ
    args = sys.argv[1:]
    modo = args[0] if args else 'tudo'
    arg = args[1] if len(args) > 1 else None

    if modo == 'links':
        if arg:
            RAIZ = os.path.abspath(arg)
            if not os.path.isdir(RAIZ):
                print(f'{VERM}pasta não encontrada: {arg}{FIM}')
                return 2
        print(f'\n== Referências (offline) == {os.path.relpath(RAIZ, REPO)}')
        ok = verificar_links()

    elif modo == 'rotas':
        if arg in (None, 'todos'):
            alvos = {n: c for n, c in APPS.items() if c.get('ativo')}
        elif arg in APPS:
            alvos = {arg: APPS[arg]}      # pedido explícito ignora o flag
        else:
            alvos = None
        if alvos is None:
            print(f'{VERM}app desconhecido: {arg}. Use: {", ".join(APPS)}, todos{FIM}')
            return 2
        print('\n== Rotas (online) ==')
        ok = all([verificar_rotas(n, c) for n, c in alvos.items()])

    elif modo == 'tudo':
        print('\n== Referências (offline) ==')
        a = verificar_links()
        print('\n== Rotas (online) ==')
        b = all([verificar_rotas(n, c) for n, c in APPS.items() if c.get('ativo')])
        ok = a and b

    else:
        print(f'uso: {sys.argv[0]} [links [raiz] | rotas [app] | tudo]')
        return 2

    print()
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
