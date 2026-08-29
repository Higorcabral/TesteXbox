# Hifera Company — Hub Digital

Site institucional da Hifera Company. HTML, CSS e JavaScript estáticos, sem framework e sem etapa de build.

> Hub de soluções digitais e automações empresariais. Tecnologia que organiza, automatiza e escala o seu negócio.

**No ar:** https://higorcabral.github.io/TesteXbox/

---

## Estrutura de pastas

```
HiferaWebSite/                 raiz do repositório = raiz do GitHub Pages
│
├── ── SITE PÚBLICO ──────────────────────────────────────────────
├── index.html              O site. Página única, com âncoras por seção
├── style.css               Todo o estilo do site
├── robots.txt              Libera buscadores, bloqueia crawlers de treino de IA
├── .nojekyll               Impede o GitHub Pages de processar via Jekyll
│
├── js/
│   ├── vitrine-dados.js      GERADO pelo painel (/modulos/admin → Publicar)
│   ├── vitrine.js            Hidrata a grade de projetos da home
│   └── demo.js               Faixa "Demonstração" + pop-up, injetada nas demos
│
├── assets/
│   ├── og-cover.png          Capa 1200x630 do preview ao compartilhar
│   ├── logo/                 HiferaIcon, HiferaLogo2, HiferaPrincipalLogo (PNG)
│   └── thumbs/               Miniaturas dos cards de projeto (WebP, 1200px)
│
├── ── DEMOS / PRODUTOS ──────────────────────────────────────────
├── projetos/               Demos navegáveis, cada uma auto-contida
│   ├── Projeto-CRM/          Pipeline comercial
│   ├── Projeto-Mani/         Agenda para estúdio de manicure
│   ├── Projeto-Mecan/        Ordem de serviço para oficina
│   └── Projeto-Stoq/         Controle de estoque
│
├── apps/
│   └── ledger/             Controle Financeiro — demo ao vivo do produto
│
├── ── ÁREA INTERNA (não pública) ────────────────────────────────
├── modulos/                Ramificações internas. Ver modulos/README.md
│   ├── index.html            Login (SSO mock) — entrada única
│   ├── core/                 Compartilhado: auth, tema, storage, format
│   ├── admin/                Portfólio + gestão de cada projeto
│   └── chamados/             Service Desk
│
└── v2/
    └── index.html          Só um redirect para a raiz (ver abaixo)
```

Cada pasta em `projetos/` e `apps/` é independente: tem o próprio HTML, CSS e JS.
A única referência que sai da pasta é o `<script src="../../js/demo.js">` no fim
do `<body>` — a faixa de demonstração da Hifera, que precisa da logo e dos links
da raiz. Abrir a demo isolada continua funcionando: sem o script, ela só não
mostra a faixa.

**Toda tela nova em `projetos/` ou `apps/` precisa da faixa.** É o que deixa
claro para quem chega por link direto que aquilo é demonstração com dados
fictícios, e é o único lugar onde a marca aparece dentro do produto do cliente:

```html
<script src="../../js/demo.js?v=2"
        data-raiz="../../"
        data-projeto="Projeto-Nome"
        data-tela="Nome da tela"></script>
```

`modulos/` é a exceção proposital: é área interna, compartilha um `core/` e
depende do resto do site (assets e links de projeto), sempre por caminho
declarado em `HIFERA_PATHS`. Detalhes em [`modulos/README.md`](modulos/README.md).

---

## Como as partes se conectam

```
                       ┌─────────────────────────┐
   /modulos/admin/ ──▶ │  localStorage           │
   (edita projetos)    │  hifera.admin.*.v1      │  só no SEU navegador
                       └───────────┬─────────────┘
                                   │ botão "Publicar"
                                   ▼
                       js/vitrine-dados.js          commitado no repo
                                   │
                                   ▼
   index.html ──▶ js/vitrine.js ──▶ grade de projetos da home
                       │
                       └─▶ links relativos ──▶ projetos/… e apps/ledger/
```

Três coisas que valem lembrar antes de mexer:

1. **Editar no painel muda a home só na sua máquina.** Para publicar de
   verdade: *Publicar* → substituir `js/vitrine-dados.js` → commitar.
2. **Os `link:` dos projetos são relativos à raiz do site** (`projetos/Projeto-CRM/`),
   não à pasta do painel. Quem faz a tradução é `Fmt.urlDoSite()`.
3. **A vitrine tem fallback triplo**: `localStorage` → `vitrine-dados.js` →
   HTML estático da `index.html`. Nenhum dos três pode sair de sincronia sem
   que alguém perceba — se um projeto novo só existe no painel, ele some para
   o resto do mundo.

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
