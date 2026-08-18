# Hifera Company — Hub Digital

Site institucional da Hifera Company. HTML, CSS e JavaScript estáticos, sem framework e sem etapa de build.

> Hub de soluções digitais e automações empresariais. Tecnologia que organiza, automatiza e escala o seu negócio.

**No ar:** https://higorcabral.github.io/TesteXbox/

---

## Estrutura de pastas

```
HiferaWebSite/
├── index.html              O site. Página única, com âncoras por seção
├── style.css               Todo o estilo do site
├── robots.txt              Libera buscadores, bloqueia crawlers de treino de IA
├── .nojekyll               Impede o GitHub Pages de processar via Jekyll
│
├── assets/
│   ├── og-cover.png          Capa 1200x630 do preview ao compartilhar
│   ├── logo/                 HiferaIcon, HiferaLogo2, HiferaPrincipalLogo (PNG)
│   └── thumbs/               Miniaturas dos cards de projeto (WebP, 1200px)
│
├── projetos/               Demos navegáveis, cada uma auto-contida
│   ├── Projeto-CRM/          Pipeline comercial
│   ├── Projeto-Mani/         Agenda para estúdio de manicure
│   ├── Projeto-Mecan/        Ordem de serviço para oficina
│   └── Projeto-Stoq/         Controle de estoque
│
├── apps/
│   └── ledger/             Controle Financeiro — demo ao vivo do produto
│
└── v2/
    └── index.html          Só um redirect para a raiz (ver abaixo)
```

Cada pasta em `projetos/` e `apps/` é independente: tem o próprio HTML, CSS e JS,
e não referencia nada fora de si. Dá para abrir qualquer uma isolada.

---

## Como rodar

Não há dependências nem build. Suba um servidor estático na raiz:

```bash
python3 -m http.server 5580
```

E abra `http://localhost:5580/`.

Abrir o `index.html` direto pelo `file://` funciona parcialmente, mas as demos em
`projetos/` usam módulos ES e precisam de servidor HTTP.

---

## Histórico de versões

O repositório teve três versões do site. A V2 venceu e virou a versão única,
servida na raiz. V1 (que era um MVC com `app/`, `config/` e `public/`) e V3 foram
removidas — estão no histórico do git, na tag `pre-reestruturacao`.

`v2/index.html` sobrou apenas como redirect: o site já circulou como
`.../TesteXbox/v2/` e esse stub evita que links compartilhados quebrem.

---

## Identidade visual

- **Gradiente da marca:** `#5de0e6` → `#004aad` (variável `--grad`)
- **Gradiente para texto:** `--grad-text`, que escurece menos na ponta azul.
  O `--grad` puro sobre o fundo escuro dá 2.4:1 de contraste e reprova no WCAG AA;
  a versão de texto fica em 7:1. Use `--grad` em botões e fundos, `--grad-text` em texto.
- **Fonte:** Poppins (Google Fonts)
- **Fundo:** `#0a0a0b`

---

## Convenções

- Breakpoint do menu: abaixo de 1100px vira hambúrguer, porque os itens só cabem
  em uma linha a partir de ~1098px. Entre 1100 e 1279px o menu usa espaçamento reduzido.
- Miniaturas em WebP a 1200px de largura (os cards têm ~600px, o dobro cobre telas retina).
- Texto sobre foto exige overlay: as imagens têm áreas claras que derrubam o contraste.
- O `<link>` do CSS usa `?v=N`. Ao mexer no `style.css`, incremente o número,
  senão quem já visitou continua com a versão em cache.
