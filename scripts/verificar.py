#!/usr/bin/env python3
# =====================================================================
# HIFERA · Verificação do site
# ---------------------------------------------------------------------
# Só biblioteca padrão. Roda igual no Mac e no runner do GitHub Actions.
#
#   python3 scripts/verificar.py links          antes de publicar (offline)
#   python3 scripts/verificar.py rotas [url]    depois de publicar (online)
#   python3 scripts/verificar.py tudo [url]     os dois
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

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROD = 'https://higorcabral.github.io/TesteXbox'

# Rotas que precisam responder 200. Uma linha por página que existe.
ROTAS_OK = [
    '/',
    '/robots.txt',
    '/modulos/',
    '/modulos/admin/',
    '/modulos/admin/projeto.html',
    '/modulos/chamados/',
    '/portal/',
    '/portal/painel.html',
    '/modulos/core/css/admin.css',
    '/modulos/core/js/caminhos.js',
    '/projetos/Projeto-CRM/',
    '/projetos/Projeto-Mani/',
    '/projetos/Projeto-Mecan/',
    '/projetos/Projeto-Stoq/',
    '/apps/ledger/',
    '/js/demo.js',
    '/v2/',
]

# Rotas que precisam NÃO existir. Impede que uma pasta velha volte
# sozinha num merge e passe despercebida.
ROTAS_404 = [
    '/AdminPage/',
]

IGNORAR_PREFIXO = ('http://', 'https://', '//', 'mailto:', 'tel:', 'data:',
                   'javascript:', '#')
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
        # Caminho absoluto: no GitHub Pages o site vive em /TesteXbox/,
        # então '/x' aponta para fora do projeto. Tratamos como suspeito.
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

        if ref.startswith('/'):
            problemas.append((rel_origem, linha,
                              f'{contexto} "{ref}" — caminho absoluto quebra no '
                              f'GitHub Pages, que serve o site em /TesteXbox/'))
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
def status(url, tentativas=3):
    for n in range(tentativas):
        req = urllib.request.Request(url, method='GET',
                                     headers={'User-Agent': 'hifera-verificador'})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status
        except urllib.error.HTTPError as e:
            return e.code
        except Exception as e:
            if n == tentativas - 1:
                return f'erro: {e}'
    return 'erro'


def verificar_rotas(base):
    base = base.rstrip('/')
    print(f'  base: {base}')
    falhas = []

    for rota in ROTAS_OK:
        cod = status(base + rota)
        ok = cod == 200
        print(f'    {VERDE + "✓" + FIM if ok else VERM + "✗" + FIM} {rota:<34} {cod}')
        if not ok:
            falhas.append(f'{rota} devolveu {cod}, esperado 200')

    for rota in ROTAS_404:
        cod = status(base + rota)
        ok = cod == 404
        print(f'    {VERDE + "✓" + FIM if ok else AMAR + "!" + FIM} {rota:<34} {cod} (esperado 404)')
        if not ok:
            falhas.append(f'{rota} devolveu {cod}, deveria ter sumido (404)')

    if falhas:
        print(f'\n{VERM}  {len(falhas)} rota(s) com problema:{FIM}')
        for f in falhas:
            print(f'    {VERM}✗{FIM} {f}')
        return False
    print(f'  {VERDE}✓ {len(ROTAS_OK) + len(ROTAS_404)} rotas conferidas{FIM}')
    return True


# ---------------------------------------------------------------------
def main():
    modo = sys.argv[1] if len(sys.argv) > 1 else 'tudo'
    base = sys.argv[2] if len(sys.argv) > 2 else PROD

    if modo == 'links':
        print('\n== Referências (offline) ==')
        ok = verificar_links()
    elif modo == 'rotas':
        print('\n== Rotas (online) ==')
        ok = verificar_rotas(base)
    elif modo == 'tudo':
        print('\n== Referências (offline) ==')
        a = verificar_links()
        print('\n== Rotas (online) ==')
        b = verificar_rotas(base)
        ok = a and b
    else:
        print(f'uso: {sys.argv[0]} [links|rotas|tudo] [url]')
        return 2

    print()
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
