-- =================================================================
-- HIFERA · Caixa da Hifera (controle financeiro da empresa)
-- -----------------------------------------------------------------
-- Uma única linha ("hifera") guarda o estado inteiro do app como
-- JSONB. Decisão deliberada:
--
--   · A UI do Caixa (admin/ledger/) foi feita como app client-side
--     e mantém TODO o estado num único objeto JS (contas, categorias,
--     transações, parcelas, assinaturas, metas, recargas). Em vez
--     de dinamitar isso em 10 tabelas, guardamos o objeto inteiro
--     e deixamos o front como ele é — mais barato de evoluir, zero
--     impedance mismatch.
--
--   · A empresa é um tenant só. "Last write wins" entre pessoas da
--     Hifera que editem ao mesmo tempo é aceitável neste ponto; se
--     um dia virar problema, trocamos este schema por tabelas
--     relacionais com transação otimista.
--
-- RLS: ninguém lê nem escreve pela anon key. Só a Function
-- /api/finance do admin, com a chave de serviço no lado do servidor
-- (e já atrás do SSO + papel 'hifera' no SWA), toca nesta tabela.
-- =================================================================

create extension if not exists "pgcrypto";

create table if not exists public.finance_state (
  id          text        primary key default 'hifera',
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

comment on table public.finance_state is
  'Estado do Caixa da Hifera. Uma linha única por tenant; a UI vem do admin.';

-- Garante a linha "hifera" na primeira execução.
insert into public.finance_state (id, data)
values ('hifera', '{}'::jsonb)
on conflict (id) do nothing;

-- -----------------------------------------------------------------
-- RLS — anon/authenticated não lêem nem escrevem; a service role
-- (usada apenas pela Function do admin) ignora o RLS.
-- -----------------------------------------------------------------
alter table public.finance_state enable row level security;

drop policy if exists finance_state_select_anon on public.finance_state;
drop policy if exists finance_state_insert_anon on public.finance_state;
drop policy if exists finance_state_update_anon on public.finance_state;
-- Nenhuma policy = RLS fecha para anon/authenticated.
