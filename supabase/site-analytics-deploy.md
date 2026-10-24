# Ligar os leads e o comportamento do site oficial

Tudo isto já está no código e funciona em **modo protótipo** (localhost
mostra uma amostra, nada sai do navegador). Os passos abaixo são o que
falta para **ligar de verdade** — e cada um depende de acesso que mora
no Azure/Supabase, não no repositório.

Enquanto não forem feitos: a tela "Site oficial" do admin segue
mostrando dados de exemplo (ela se identifica como "Dados de exemplo"),
e o site público não envia nada.

---

## 1. Banco (Supabase)

Mesmo projeto do portal.

1. SQL Editor → cole e rode [`site-analytics.sql`](site-analytics.sql).
   Cria `site_leads` e `site_events` com RLS **só-INSERT para anon**
   (o navegador grava, nunca lê).
2. (Retenção) agende o expurgo de eventos — bloco no fim do `.sql`.

## 2. Coleta no site público

1. Supabase → Project Settings → API: copie **Project URL** e a chave
   **anon public**.
2. Preencha em [`js/site-config.js`](../js/site-config.js):
   ```js
   supabase: { url: 'https://XXXX.supabase.co', anonKey: 'eyJ...' }
   ```
   (a anon key é pública por natureza — a segurança é o RLS, não ela.)
3. `git push` → o workflow publica o site. A partir daí o formulário
   grava o lead em `site_leads` e, **após o "Aceitar" do banner**, o
   `tracking.js` manda os eventos.

## 3. Leitura no admin (Azure Function)

A tela do admin lê pela Function `/api/site-analytics`, que roda no SWA
do admin (já protegido por Entra + papel `hifera`). A chave de serviço
do Supabase fica **só no servidor**, nunca no navegador.

1. No SWA do **admin** → Settings → **Environment variables** (Application
   settings), adicione:
   - `SUPABASE_URL` = a mesma Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = a chave **service_role** (Project
     Settings → API → `service_role`, *secret*). **Nunca** vai para o
     repositório nem para o `site-config.js`.
2. O deploy da Function já está ligado: `scripts/montar.py` copia `api/`
   para `dist/admin/` e o `publicar.yml` publica o admin com
   `api_location: api`. Só dar `git push`.
3. Se o plano do SWA do admin não permitir Managed Functions, suba a
   pasta `api/` como um Azure **Function App** separado e aponte o
   `API` do SWA para ele (Linked backend) — o código não muda.

Pré-requisito: o papel `hifera` precisa estar atribuído a quem vai ver a
tela (SWA → Role management → Invite), como já é hoje para o resto do
admin.

## 4. LGPD — antes de considerar "no ar"

`site_events` é dado pessoal (comportamento ligado a um id de sessão).
Base legal escolhida: **consentimento** (o banner).

- [ ] **Aviso de privacidade** real explicando o que se mede e por quê.
      Hoje o banner aponta para `seguranca.html`; troque por um texto de
      privacidade de verdade, ou crie `privacidade.html`.
- [ ] **Retenção** definida (o `.sql` sugere 180 dias para eventos).
- [ ] **Direito de apagar**: processo para remover um lead a pedido.
- [ ] Falar com quem cuida de privacidade antes de coletar gente real.

## 5. Conferir

- Site: abrir, aceitar o banner, enviar o formulário → a linha aparece
  em `site_leads`; navegar → linhas em `site_events`.
- Admin: abrir "Site oficial" → KPIs e gráfico saem do banco (o aviso
  "Dados de exemplo" some quando a Function responde).
