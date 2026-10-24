-- =================================================================
-- HIFERA · Leads e comportamento do site oficial
-- -----------------------------------------------------------------
-- Rode uma vez no SQL Editor do projeto Supabase (o mesmo do portal).
--
-- Duas tabelas, dois caminhos de dado:
--
--   site_leads   quem pediu contato pelo formulário do site. A pessoa
--                ENTREGA esses dados de propósito, para ser respondida.
--
--   site_events  comportamento anônimo de quem navega — pageview,
--                clique, rolagem, tempo na página. Só é gravado DEPOIS
--                do consentimento (js/consentimento.js). Não guarda IP,
--                não guarda nome, não cruza com o lead.
--
-- O navegador só INSERE, nunca LÊ (política de RLS abaixo). Quem lê é
-- a Function do admin, com a chave de serviço, do lado do servidor —
-- a mesma ideia do portal: a anon key vive no navegador e sozinha não
-- abre nada.
--
-- LGPD: site_events é dado pessoal (comportamento ligado a um
-- identificador de sessão). Base legal = consentimento. Antes de ligar
-- em produção: aviso de privacidade no site, retenção definida e um
-- jeito de apagar a pedido. A rotina de expurgo no fim deste arquivo é
-- o mínimo de retenção.
-- =================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------
-- site_leads — contatos vindos do formulário do site
-- -----------------------------------------------------------------
create table if not exists public.site_leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  empresa    text,
  contato    text not null,              -- e-mail OU telefone, como a pessoa deu
  objetivo   text,                       -- opção escolhida no formulário
  recado     text,
  origem     text not null default 'Formulário do site',
  pagina     text,                       -- caminho de onde enviou
  utm        jsonb not null default '{}'::jsonb,
  status     text not null default 'novo'
             check (status in ('novo','contato','ganho','perdido')),
  nota       text not null default '',
  criado_em  timestamptz not null default now()
);

comment on table public.site_leads is
  'Pedidos de contato do site oficial da Hifera. A pessoa enviou de propósito.';

create index if not exists site_leads_criado_idx on public.site_leads (criado_em desc);
create index if not exists site_leads_status_idx on public.site_leads (status);

-- -----------------------------------------------------------------
-- site_events — comportamento anônimo, só com consentimento
-- -----------------------------------------------------------------
create table if not exists public.site_events (
  id         bigint generated always as identity primary key,
  sessao     text not null,              -- id anônimo gerado no navegador (não é pessoa)
  tipo       text not null
             check (tipo in ('pageview','clique','scroll','tempo','envio')),
  pagina     text,
  alvo       text,                       -- rótulo do data-track clicado
  valor      numeric,                    -- ms na página, % de rolagem, etc.
  referrer   text,
  utm        jsonb not null default '{}'::jsonb,
  criado_em  timestamptz not null default now()
);

comment on table public.site_events is
  'Comportamento anônimo do site. Gravado só após consentimento. Sem IP, sem nome.';

create index if not exists site_events_criado_idx on public.site_events (criado_em desc);
create index if not exists site_events_tipo_idx   on public.site_events (tipo);
create index if not exists site_events_sessao_idx on public.site_events (sessao);

-- =================================================================
-- RLS — sem isto, a anon key leria tudo
-- -----------------------------------------------------------------
-- O navegador (role anon) só pode INSERIR. Nenhuma política de select,
-- update ou delete para anon = a leitura fica impossível do navegador.
-- A Function do admin usa a service_role, que ignora RLS por natureza.
-- =================================================================
alter table public.site_leads  enable row level security;
alter table public.site_events enable row level security;

drop policy if exists "anon insere lead"   on public.site_leads;
create policy "anon insere lead"
  on public.site_leads for insert to anon with check (true);

drop policy if exists "anon insere evento" on public.site_events;
create policy "anon insere evento"
  on public.site_events for insert to anon with check (true);

-- =================================================================
-- Retenção — comportamento não precisa viver para sempre
-- -----------------------------------------------------------------
-- Apaga eventos com mais de 180 dias. Agende no Supabase
-- (Database → Cron / pg_cron) para rodar diariamente:
--
--   select cron.schedule('expurgo-site-events', '0 4 * * *',
--     $$ delete from public.site_events where criado_em < now() - interval '180 days' $$);
--
-- Leads NÃO entram no expurgo automático: são relação comercial, e a
-- exclusão é a pedido da pessoa (direito LGPD), feita à mão ou por
-- rotina própria quando o processo estiver definido.
-- =================================================================
