# Caixa da Hifera — passos para ligar o backend real

Depois do merge, o Caixa (`admin.hifera.com.br/admin/ledger/`) procura
`/api/finance` e, enquanto não encontrar o Supabase, cai no cache
local — tudo continua funcionando no navegador, mas os dados não
são compartilhados entre as pessoas da Hifera.

Para virar dado real da empresa:

## 1. Criar as tabelas no Supabase

Rode no **SQL Editor** do projeto Supabase (o mesmo do portal/clientes):

```sql
-- Conteúdo de supabase/caixa-hifera.sql
```

O script cria `finance_state`, insere a linha única `hifera` e
fecha o RLS para `anon`/`authenticated` — só a Function do admin,
com a service role no lado do servidor, lê e escreve.

## 2. Configurar o SWA do admin

Portal do Azure → Static Web App `hifera-admin` → **Configuration** →
**Application settings** → adicione:

| Nome                            | Valor                                   |
|---------------------------------|-----------------------------------------|
| `SUPABASE_URL`                  | URL do projeto (Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave `service_role` (**nunca** a anon) |

> A `service_role` ignora o RLS. Ela só existe neste lado — nunca no
> navegador. Vazar essa chave abre tudo que o Supabase conhece.

## 3. Testar

Entre em `admin.hifera.com.br/admin/ledger/` com uma conta que tem
o papel `hifera`. Faça uma edição qualquer (ex.: ajustar o salário).
Em outra pessoa da Hifera, abra o mesmo endereço e confirme que o
dado chegou. O indicador do topo passa de **Salvo** para **Salvo na
nuvem** quando o backend confirmou.

## Como se recupera uma edição errada

A tabela é single-row — não guarda histórico. Para uma trilha de
auditoria mais robusta no futuro, uma opção é um trigger que insira
cada versão em `finance_state_history (data, saved_at, saved_by)`.
Por ora, lembre-se de **Configurações → Exportar JSON** periodicamente
para ter um backup externo.

## Rolar para trás

Se precisar desligar temporariamente:

- No **Azure**: apague `SUPABASE_URL` nas Application settings → a
  Function responde 500 e o Caixa cai no cache local, sem perder dados.
- No **Supabase**: `drop table public.finance_state;` apaga o estado.
  O Caixa segue funcionando no navegador de quem já estava usando.
