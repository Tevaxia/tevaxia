-- ============================================================
-- API KEYS + USAGE LOGS — Pour les banques et clients API
-- ============================================================
-- Permet aux utilisateurs (banques, fintech, agences) de gérer
-- leurs clés API et de monitorer l'usage de l'API d'estimation.

create extension if not exists "pgcrypto";

-- 1) API_KEYS

create type api_tier as enum ('free', 'pro', 'enterprise');

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  tier api_tier not null default 'free',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_keys_user_idx on api_keys(user_id);
create index if not exists api_keys_org_idx on api_keys(org_id);
create index if not exists api_keys_hash_idx on api_keys(key_hash);

-- 2) API_CALLS (logs)

create table if not exists api_calls (
  id bigserial primary key,
  api_key_id uuid not null references api_keys(id) on delete cascade,
  endpoint text not null,
  status_code int not null,
  latency_ms int not null,
  created_at timestamptz not null default now()
);

create index if not exists api_calls_key_time_idx on api_calls(api_key_id, created_at desc);

-- 3) RLS

alter table api_keys enable row level security;
alter table api_calls enable row level security;

-- API keys : visibles uniquement à leur propriétaire
create policy "users_view_own_api_keys" on api_keys
  for select using (user_id = auth.uid());

create policy "users_create_own_api_keys" on api_keys
  for insert with check (user_id = auth.uid());

create policy "users_update_own_api_keys" on api_keys
  for update using (user_id = auth.uid());

create policy "users_delete_own_api_keys" on api_keys
  for delete using (user_id = auth.uid());

-- API calls : visibles aux propriétaires de la clé
create policy "users_view_own_api_calls" on api_calls
  for select using (
    api_key_id in (select id from api_keys where user_id = auth.uid())
  );

-- 4) Stats RPC : usage agrégé pour dashboard

create or replace function api_usage_daily(p_key_id uuid, p_days int default 30)
returns table(day date, total bigint, errors bigint, avg_latency_ms numeric)
language sql security definer as $$
  select
    date_trunc('day', created_at)::date as day,
    count(*) as total,
    count(*) filter (where status_code >= 400) as errors,
    round(avg(latency_ms)::numeric, 0) as avg_latency_ms
  from api_calls
  where api_key_id = p_key_id
    and created_at >= now() - (p_days || ' days')::interval
    and exists (
      select 1 from api_keys
      where api_keys.id = p_key_id and api_keys.user_id = auth.uid()
    )
  group by 1
  order by 1 asc;
$$;

grant execute on function api_usage_daily(uuid, int) to authenticated;
