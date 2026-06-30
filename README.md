# Hifera Company — Hub Digital

Site institucional da Hifera Company, organizado no padrão **MVC** (Model–View–Controller).

> Hub de soluções digitais e automações empresariais. Tecnologia que organiza, automatiza e escala o seu negócio.

---

## Estrutura de pastas

```
HiferaWebSite/
├── index.html                       Entrada do site (redireciona para a home)
├── README.md
│
├── app/                             Camada da aplicação (MVC)
│   ├── controllers/                 Lógica de interação das views
│   │   ├── CatalogController.js       — renderiza o catálogo de soluções
│   │   └── ThemeController.js         — gerencia o switch dark/light
│   │
│   ├── models/                      Camada de dados / regras de negócio
│   │   ├── ApiModel.js                — contrato de API (hoje localStorage)
│   │   ├── AuthModel.js               — sessão e autenticação
│   │   └── SeedModel.js               — catálogo inicial
│   │
│   └── views/                       Páginas HTML
│       ├── home.html
│       ├── solucoes-prontas.html
│       ├── personalizadas.html
│       ├── automacao.html
│       └── sobre.html
│
├── public/                          Assets estáticos
│   ├── css/
│   │   └── styles.css                 — estilos com tema claro e escuro
│   ├── img/
│   │   ├── logo/                      — logos da marca em SVG
│   │   │   ├── hifera-mark.svg          (símbolo H)
│   │   │   ├── hifera-logo.svg          (logo empilhado)
│   │   │   └── hifera-horizontal.svg    (logo horizontal)
│   │   └── icons/                     — ícones das soluções
│   │       └── sol-*.svg
│   └── js/                          (reservado para scripts públicos futuros)
│
└── config/
    └── routes.js                    Mapa central de rotas da aplicação
```

---

## Como usar

Abra `index.html` no navegador — ele redireciona automaticamente para `app/views/home.html`.

Para hospedagem, basta servir a pasta `HiferaWebSite/` como diretório estático em qualquer servidor (Apache, Nginx, GitHub Pages, Netlify, Vercel, etc.).

---

## Tema claro / escuro

O site suporta dois temas:

- **Escuro** (padrão) — visual moderno com fundo profundo
- **Claro** — versão clara para uso diurno ou em apresentações

O switch fica no canto superior direito de qualquer página. A preferência é salva em `localStorage` (`hifera.theme`) e respeita a configuração do sistema na primeira visita.

Implementado em [`app/controllers/ThemeController.js`](app/controllers/ThemeController.js) e estilizado em [`public/css/styles.css`](public/css/styles.css) via `[data-theme="light|dark"]` no `<html>`.

---

## Identidade visual

- **Gradiente da marca:** `#5de0e6` → `#004aad`
- **Fonte:** Poppins (Google Fonts)
- **Logos:** SVG vetoriais com fundo transparente, em [`public/img/logo/`](public/img/logo/)

---

## Convenções

- **Models** retornam `Promise` para facilitar migração futura para back-end real
- **Controllers** ficam responsáveis apenas pela orquestração da view (DOM + binding)
- Views não fazem fetch direto — sempre passam pelos models
- Cores e espaçamentos são variáveis CSS, evitando hard-coded em componentes
