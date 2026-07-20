# Ledger — Controle Financeiro Pessoal

Um app web de controle financeiro pessoal com visual inspirado no macOS/iOS dark mode. **100% local, 100% privado** — seus dados ficam no seu navegador e nunca saem dele.

![Ledger Dashboard](https://img.shields.io/badge/status-MVP-success) ![Privado](https://img.shields.io/badge/dados-localStorage-blue) ![Tema](https://img.shields.io/badge/tema-macOS%20dark-purple)

## Features

### Controle de fluxo de caixa
- **Saldo livre no mês** calculado em tempo real (receitas − gastos − parcelas − assinaturas)
- **"Quanto posso gastar por dia"** — o saldo disponível dividido pelos dias restantes do mês
- Barra de progresso visual: quanto da receita já foi usado
- Breakdown por tipo de gasto (avulsos, parcelas, assinaturas)

### Múltiplas contas
- **Cartões de crédito** com limite, data de fechamento e vencimento reais
- **Débito**, **Pix** e **Dinheiro** como contas separadas
- Cada conta com cor própria e resumo mensal individual

### Compras parceladas
- Registre uma compra em N parcelas e o sistema gera automaticamente os lançamentos futuros
- Progresso visual: "3/12 pagas, 9 restantes"
- Cada parcela cai na fatura correta respeitando o dia de fechamento do cartão

### Assinaturas recorrentes
- Cobranças mensais (Netflix, Spotify, academia...) com dia específico
- Pausar/ativar sem apagar (toggle iOS)
- Projeção anual automática

### Faturas mensais
- Visão mês a mês de cada cartão com todos os lançamentos
- Respeita a **data de fechamento** de cada cartão (uma compra em 28/abr com fechamento dia 25 cai na fatura de maio)
- Datas de fechamento e vencimento exibidas por fatura

### Metas e limites
- Defina limites mensais de gasto por categoria ("no máximo R$ 800 em Alimentação")
- Alertas visuais quando você passa de 80% (amarelo) ou ultrapassa (vermelho)

### Previsão de próximos meses
- Projeção de 6 meses à frente mostrando parcelas futuras + assinaturas
- Estimativa de "dinheiro livre" mês a mês
- Útil pra planejar compras grandes

### Categorias customizáveis
- Crie, edite, renomeie e recolora categorias livremente
- 16 cores sistema Apple disponíveis
- Ao excluir uma categoria, lançamentos migram automaticamente pra "Outros"

### Qualidade de vida
- **Busca global** (Cmd/Ctrl + K) em todos os lançamentos
- **Atalhos de teclado** (1-9 pra páginas, N pra novo, Esc pra fechar)
- **Undo** de 5 segundos em qualquer exclusão
- Indicador de "salvo" automático
- Export/import JSON pra backup manual
- Responsivo (desktop + mobile com menu hambúrguer)

## Estrutura do projeto

```
ledger/
├── index.html              # Shell principal
├── README.md
├── .gitignore
├── assets/
│   └── favicon.svg         # Ícone do app
├── css/
│   ├── base.css            # Variáveis, reset, tipografia
│   ├── layout.css          # Sidebar, main, page headers
│   ├── components.css      # Cards, stats, tabelas, modais
│   └── mobile.css          # Responsividade
└── js/
    ├── app.js              # Entry point
    ├── config.js           # Constantes, paletas
    ├── helpers.js          # Formatação, datas
    ├── storage.js          # localStorage + import/export
    ├── state.js            # Estado central + mutações
    ├── router.js           # Navegação
    ├── chart.js            # Gráficos Chart.js
    ├── search.js           # Busca global
    ├── toast.js            # Undo/notificações
    ├── pages/
    │   ├── dashboard.js
    │   ├── invoices.js
    │   ├── installments.js
    │   ├── subscriptions.js
    │   ├── accounts.js
    │   ├── categories.js
    │   ├── goals.js
    │   ├── forecast.js
    │   └── settings.js
    └── modals/
        ├── transaction.js
        ├── income.js
        ├── subscription.js
        ├── category.js
        ├── account.js
        └── goal.js
```

## Como executar localmente

Como o app usa **ES Modules** (`import`/`export`), ele precisa ser servido por um servidor web, não aberto direto do disco.

### Opção 1 — Python (mais simples)
```bash
cd ledger
python3 -m http.server 8000
```
Abra `http://localhost:8000` no navegador.

### Opção 2 — Node.js
```bash
npx serve ledger
```

### Opção 3 — VS Code
Instale a extensão **Live Server** e clique com o botão direito em `index.html` → **Open with Live Server**.

## Como publicar no GitHub Pages

1. Crie um repositório **privado** no GitHub (se quiser manter pra você mesmo)
2. Faça push do projeto:
   ```bash
   git init
   git add .
   git commit -m "Primeiro commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/ledger.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**
4. Em "Source", selecione **Deploy from a branch** → `main` → `/ (root)` → **Save**
5. Aguarde alguns minutos e acesse `https://SEU_USUARIO.github.io/ledger/`

> **⚠ Importante sobre GitHub Pages e repositórios privados:** o GitHub Pages **não** publica repositórios privados em contas gratuitas — você precisa ter um plano pago. Se o app for pra uso pessoal apenas, a forma mais simples e gratuita é manter o repositório local (ou privado) e rodar em `localhost`. Outra alternativa: usar Vercel ou Netlify, que publicam repos privados gratuitamente.

## Onde seus dados ficam

Todos os dados são salvos no **localStorage do seu navegador**. Isso significa:

- ✅ Nada é enviado pra internet, nem pro GitHub
- ✅ Só você (nesse navegador, nesse dispositivo) tem acesso
- ⚠ Se você limpar o cache do navegador, os dados somem
- ⚠ Se você usar em outro dispositivo, os dados não sincronizam
- ⚠ **Faça backups regulares** via **Configurações → Exportar JSON**

### Backup e restauração

1. Vá em **Configurações** (última opção do menu)
2. Clique em **Exportar JSON** — um arquivo `ledger-backup-YYYY-MM-DD.json` é baixado
3. Pra restaurar: **Importar JSON** e selecione o arquivo. Substitui todos os dados atuais.

Recomendação: exportar uma vez por semana e salvar numa pasta do iCloud, Dropbox ou Drive.

## Atalhos de teclado

| Tecla | Ação |
|-------|------|
| `Cmd/Ctrl + K` | Busca global de lançamentos |
| `N` | Novo lançamento |
| `1` a `9` | Navegar entre as páginas |
| `Esc` | Fechar modais e menus |

## Primeiro uso

Na primeira vez que abre o app, ele vem populado com **dados de demonstração** (cartões Nubank/Itaú, algumas transações, 3 parcelamentos, 5 assinaturas) pra você ver como tudo funciona. Pra começar do zero:

1. Vá em **Configurações → Apagar todos os dados**
2. Configure suas próprias **Contas** (incluindo datas de fechamento dos cartões)
3. Configure sua **Receita** no botão "Editar receitas" do dashboard
4. Comece a lançar seus gastos reais

## Tecnologias

- **HTML + CSS + JavaScript puro** (ES Modules, sem bundler)
- **Chart.js** para os gráficos (via CDN)
- **localStorage** para persistência
- **SF Pro** (fonte do sistema Apple) pra tipografia nativa em macOS/iOS

## Limitações conhecidas

- Não sincroniza entre dispositivos (por design — tudo é local)
- Não funciona offline se você não tiver o Chart.js em cache (1º carregamento precisa de internet)
- Dados não são criptografados no localStorage (não é um problema se o navegador é seu, mas vale saber)

## Roadmap

Ideias para próximas versões:

- [ ] Importar CSV de fatura do Nubank/Itaú com categorização automática por regras
- [ ] Lançamento rápido por texto natural ("45 mercado nubank")
- [ ] Duplicar transação com um clique
- [ ] Gráficos adicionais (pizza, heatmap tipo GitHub, comparativo ano anterior)
- [ ] PWA instalável (ícone na home do celular, funciona offline)
- [ ] Sincronização opcional via Supabase ou Firebase

## Licença

Uso pessoal livre. Se fez alguma modificação bacana, envie um PR!
