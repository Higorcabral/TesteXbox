#!/usr/bin/env python3
# =====================================================================
# HIFERA · Montagem dos apps para deploy
# ---------------------------------------------------------------------
#   python3 scripts/montar.py              monta os três
#   python3 scripts/montar.py site         monta só um
#
# Por que existe
# -------------
# São três Static Web Apps, um por subdomínio, mas o código é um só:
# /portal usa /modulos/core (CSS, caminhos, format, models) e os dois
# usam /assets/logo. Apontar o app_location direto para a pasta subiria
# o portal sem CSS e sem JS.
#
# Então cada app é montado aqui: copia o que precisa, reescreve os
# caminhos para a nova profundidade e escreve o staticwebapp.config.json
# daquele app. A saída fica em dist/<app>/ e é o que o workflow publica.
#
# dist/ é descartável — nunca edite nada lá dentro.
# =====================================================================
import os
import re
import shutil
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(RAIZ, 'dist')
CONFIGS = os.path.join(RAIZ, 'deploy')

# O site público é a origem dos assets e das demos. Admin e clientes
# apontam para cá quando precisam de miniatura ou link de projeto.
SITE = 'https://www.hifera.com.br/'

VERDE, VERM, FIM = '\033[32m', '\033[31m', '\033[0m'
if not sys.stdout.isatty():
    VERDE = VERM = FIM = ''


def limpar(destino):
    if os.path.isdir(destino):
        shutil.rmtree(destino)
    os.makedirs(destino, exist_ok=True)


def copiar(origem, destino):
    """Copia arquivo ou pasta, criando o caminho intermediário."""
    o = os.path.join(RAIZ, origem)
    d = os.path.join(destino, origem if os.path.isdir(o) else os.path.basename(origem))
    os.makedirs(os.path.dirname(d), exist_ok=True)
    if os.path.isdir(o):
        shutil.copytree(o, d, dirs_exist_ok=True)
    else:
        shutil.copy2(o, d)


def htmls(raiz):
    for base, _, nomes in os.walk(raiz):
        for n in nomes:
            if n.endswith('.html'):
                yield os.path.join(base, n)


def reescrever(caminho, pares):
    """Aplica substituições literais e conta quantas pegaram."""
    s = open(caminho, encoding='utf-8').read()
    original = s
    for a, b in pares:
        s = s.replace(a, b)
    if s != original:
        open(caminho, 'w', encoding='utf-8').write(s)
        return True
    return False


# "Voltar para o site" e a logo da barra lateral apontavam para ../ ou
# ../../ — a raiz do monorepo. A partir da raiz de um subdomínio isso sobe
# acima do domínio e não vai a lugar nenhum. Vira link absoluto para o site.
VOLTAR_AO_SITE = [('href="../../"', f'href="{SITE}"'),
                  ('href="../"',    f'href="{SITE}"')]


def config(app, destino):
    """Escreve o staticwebapp.config.json daquele app."""
    origem = os.path.join(CONFIGS, f'{app}.config.json')
    if not os.path.isfile(origem):
        raise SystemExit(f'{VERM}falta {os.path.relpath(origem, RAIZ)}{FIM}')
    shutil.copy2(origem, os.path.join(destino, 'staticwebapp.config.json'))


# ---------------------------------------------------------------------
# Autenticação de borda (só no app admin)
# ---------------------------------------------------------------------
# Quem autentica em admin.hifera.com.br é o Static Web App, antes de
# servir a página. O código precisa saber disso por dois motivos:
#
#   1. o guard mockado mandaria para a tela de login, que redireciona
#      de volta — laço de redirecionamento;
#   2. sem buscar /.auth/me, o painel mostraria o usuário mockado para
#      qualquer pessoa que entrasse, e o log registraria o autor errado.
#
# A injeção acontece só aqui, no build. Rodando local o arquivo não é
# carregado, a variável não existe e o mock continua valendo.
PRIMEIRO_CORE = re.compile(r'<script src="((?:\.\./)?core/js/)caminhos\.js')


def injetar_auth_borda(html):
    s = open(html, encoding='utf-8').read()
    if 'HIFERA_AUTH_EDGE' in s:
        return
    m = PRIMEIRO_CORE.search(s)
    if not m:
        return
    prefixo = m.group(1)
    bloco = ('<script>window.HIFERA_AUTH_EDGE = true;</script>\n'
             f'<script src="{prefixo}auth-edge.js"></script>\n')
    s = s[:m.start()] + bloco + s[m.start():]
    open(html, 'w', encoding='utf-8').write(s)


# ---------------------------------------------------------------------
# site — www.hifera.com.br e hifera.com.br
# ---------------------------------------------------------------------
def montar_site():
    d = os.path.join(DIST, 'site')
    limpar(d)
    for item in ('index.html', 'style.css', 'robots.txt',
                 'assets', 'js', 'projetos', 'apps', 'v2'):
        copiar(item, d)
    config('site', d)
    return d


# ---------------------------------------------------------------------
# admin — admin.hifera.com.br (login SSO + gestão + chamados)
# ---------------------------------------------------------------------
def montar_admin():
    d = os.path.join(DIST, 'admin')
    limpar(d)

    # modulos/ vira a raiz do app: sobe um nível de profundidade
    shutil.copytree(os.path.join(RAIZ, 'modulos'), d, dirs_exist_ok=True)
    # o README do módulo é interno, não vai para o ar
    for lixo in ('README.md',):
        p = os.path.join(d, lixo)
        if os.path.isfile(p):
            os.remove(p)

    # só o logo é usado; o resto de assets/ fica no site público
    os.makedirs(os.path.join(d, 'assets'), exist_ok=True)
    shutil.copytree(os.path.join(RAIZ, 'assets', 'logo'),
                    os.path.join(d, 'assets', 'logo'), dirs_exist_ok=True)

    # Cada página subiu um nível (modulos/admin/ virou /admin/), então o
    # caminho até assets/ encurta em um. O login, que estava em modulos/,
    # foi para a raiz e passa a referenciar assets/ sem prefixo nenhum.
    for h in htmls(d):
        na_raiz = os.path.dirname(h) == d
        pares = [('"../assets/logo/', '"assets/logo/')] if na_raiz \
                else [('"../../assets/', '"../assets/')]
        # Miniatura e link de projeto moram no site público, não aqui.
        pares += [("site:  '../../'", f"site:  '{SITE}'"),
                  ("site:  '../'", f"site:  '{SITE}'")]
        pares += VOLTAR_AO_SITE
        reescrever(h, pares)
        injetar_auth_borda(h)

    config('admin', d)
    return d


# ---------------------------------------------------------------------
# clientes — clientes.hifera.com.br (área do cliente)
# ---------------------------------------------------------------------
def montar_clientes():
    d = os.path.join(DIST, 'clientes')
    limpar(d)

    shutil.copytree(os.path.join(RAIZ, 'portal'), d, dirs_exist_ok=True)
    for lixo in ('README.md',):
        p = os.path.join(d, lixo)
        if os.path.isfile(p):
            os.remove(p)

    # o core compartilhado entra como /core/
    shutil.copytree(os.path.join(RAIZ, 'modulos', 'core'),
                    os.path.join(d, 'core'), dirs_exist_ok=True)
    os.makedirs(os.path.join(d, 'assets'), exist_ok=True)
    shutil.copytree(os.path.join(RAIZ, 'assets', 'logo'),
                    os.path.join(d, 'assets', 'logo'), dirs_exist_ok=True)

    for h in htmls(d):
        reescrever(h, [
            ('"../modulos/core/', '"core/'),
            ('"../assets/logo/', '"assets/logo/'),
            ("site:  '../'", f"site:  '{SITE}'"),
        ] + VOLTAR_AO_SITE)

    config('clientes', d)
    return d


APPS = {'site': montar_site, 'admin': montar_admin, 'clientes': montar_clientes}


def main():
    alvos = sys.argv[1:] or list(APPS)
    desconhecido = [a for a in alvos if a not in APPS]
    if desconhecido:
        raise SystemExit(f'app desconhecido: {", ".join(desconhecido)}. '
                         f'Use: {", ".join(APPS)}')

    print()
    for app in alvos:
        d = APPS[app]()
        n = sum(len(f) for _, _, f in os.walk(d))
        tam = sum(os.path.getsize(os.path.join(b, f))
                  for b, _, fs in os.walk(d) for f in fs)
        print(f'  {VERDE}✓{FIM} {app:<9} {n:>3} arquivos  '
              f'{tam/1024:>7.0f} KB  ->  dist/{app}/')
    print()


if __name__ == '__main__':
    main()
