-- ============================================================
-- CALENDAR OAUTH INTEGRATIONS — Google Calendar / Microsoft Graph
-- ============================================================
-- Stockage chiffré des tokens OAuth pour la sync bi-directionnelle.
-- L'OAuth flow lui-même est géré par les routes API
--   /api/oauth/google/calendar/callback
--   /api/oauth/microsoft/calendar/callback
-- avec les credentials applicatifs (GOOGLE_OAUTH_CLIENT_ID/SECRET,
-- MICROSOFT_OAUTH_CLIENT_ID/SECRET) en variables d'environnement.
--
-- Statut : structure en place, OAuth flow à finaliser dans une
-- prochaine itération (nécessite création d'un projet Google Cloud
-- + app registration Azure côté config).
-- ============================================================

create type calendar_provider as enum ('google', 'microsoft', 'apple');

create table if not exists calendar_oauth_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider calendar_provider not null,
  -- Identifiant côté provider (sub, oid, etc.)
  external_user_id text not null,
  external_email text,
  -- Tokens — DOIVENT être chiffrés au repos (à faire via pgcrypto en next iteration)
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  -- Calendrier cible côté provider (par défaut le primary)
  external_calendar_id text default 'primary',
  -- Sync state
  active boolean not null default true,
  last_sync_at timestamptz,
  last_sync_error text,
  sync_token text, -- delta sync token Google / next link MS Graph
  events_pushed integer not null default 0,
  events_pulled integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_user_id)
);

create index if not exists calendar_oauth_user_idx
  on calendar_oauth_integrations(user_id, provider) where active;

alter table calendar_oauth_integrations enable row level security;

create policy "calendar_oauth_own" on calendar_oauth_integrations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function calendar_oauth_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists calendar_oauth_touch_trg on calendar_oauth_integrations;
create trigger calendar_oauth_touch_trg before update on calendar_oauth_integrations
  for each row execute function calendar_oauth_touch();

-- ============================================================
-- Mapping local → remote events (pour update/delete sans dupliquer)
-- ============================================================
create table if not exists calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references calendar_oauth_integrations(id) on delete cascade,
  local_kind text not null check (local_kind in ('task', 'visit')),
  local_id uuid not null,
  external_event_id text not null,
  etag text,
  pushed_at timestamptz not null default now(),
  unique (integration_id, local_kind, local_id)
);

create index if not exists calendar_event_links_local_idx
  on calendar_event_links(local_kind, local_id);

alter table calendar_event_links enable row level security;

create policy "calendar_event_links_own" on calendar_event_links
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
