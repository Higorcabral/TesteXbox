-- =================================================================
-- HIFERA PORTAL · Acesso do cliente
-- -----------------------------------------------------------------
-- Rode uma vez no SQL Editor do projeto Supabase.
--
-- O que este arquivo resolve: o portal precisa saber DE QUAL CLIENTE
-- é a pessoa que acabou de autenticar. Essa resposta não pode morar
-- no navegador — se morar, quem abre o console troca de cliente.
-- Ela mora aqui, e a política de RLS faz o resto: a consulta que o
-- portal envia é sempre "select cliente from portal_acessos", sem
-- filtro nenhum, e o banco devolve só a linha de quem perguntou.
-- =================================================================

create table if not exists public.portal_acessos (
  email      text primary key,
  cliente    text not null,
  nome       text,
  papel      text,
  criado_em  timestamptz not null default now()
);

comment on table  public.portal_acessos is
  'Quem pode entrar no portal e a que cliente pertence. Uma linha por pessoa.';
comment on column public.portal_acessos.cliente is
  'Precisa bater exatamente com o nome do cliente usado no restante do portal.';

-- Busca por e-mail é o caminho de todo login.
create index if not exists portal_acessos_cliente_idx
  on public.portal_acessos (cliente);

-- -----------------------------------------------------------------
-- RLS: sem isto, a anon key lê a tabela inteira.
-- -----------------------------------------------------------------
alter table public.portal_acessos enable row level security;

-- Nenhuma política de insert/update/delete: manutenção é feita pelo
-- painel do Supabase ou por chave de serviço, nunca pelo navegador.
drop policy if exists "cliente lê o próprio vínculo" on public.portal_acessos;
create policy "cliente lê o próprio vínculo"
  on public.portal_acessos
  for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- =================================================================
-- Cadastro dos primeiros acessos
-- -----------------------------------------------------------------
-- Duas etapas para cada pessoa, nesta ordem:
--
--   1. Authentication → Users → Add user → "Send invite"
--      (ou Invite user). O magic link do portal usa create_user:false,
--      então e-mail que não existe como usuário não recebe nada — é
--      o que impede que digitar um endereço qualquer vire acesso.
--
--   2. a linha abaixo, com o mesmo e-mail.
--
-- Trocar os exemplos pelos dados reais antes de rodar.
-- =================================================================

-- insert into public.portal_acessos (email, cliente, nome, papel) values
--   ('marina@distribuidoravega.com.br', 'Distribuidora Vega', 'Marina Alencar', 'Comercial'),
--   ('claudio@oficinarotasul.com.br',   'Oficina RotaSul',    'Cláudio Serrano', 'Operações')
-- on conflict (email) do update
--   set cliente = excluded.cliente,
--       nome    = excluded.nome,
--       papel   = excluded.papel;
