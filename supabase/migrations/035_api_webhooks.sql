-- ============================================================
-- API WEBHOOKS — Notifications push pour clients B2B
-- ============================================================
-- Les intégrateurs (banques, agences) peuvent enregistrer une
-- URL de webhook pour recevoir des notifications push (ex. variation
-- significative d'une estimation précédemment calculée).
--
-- Les événements sont signés via HMAC-SHA256 avec le `secret` pour
-- que le destinataire vérifie l'authenticité.

create type api_webhook_event as enum (
  'estimation.price_change',  -- variation > seuil sur une adresse déjà évaluée
  'estimation.new',            -- nouvelle estimation créée
  'health.check'               -- ping de santé (envoyé par "Test webhook")
);

create table if not exists api_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type api_webhook_event not null,
  url text not null,
  secret text not null default encode(gen_random_bytes(24), 'hex'),
  active boolean not null default true,
  threshold_pct numeric(5,2) default 5.00, -- seuil en % pour price_change
  created_at timestamptz not null default now(),
  last_triggered_at timestamptz
);

create index if not exists api_webhooks_user_idx on api_webhooks(user_id);
create index if not exists api_webhooks_active_event_idx on api_webhooks(active, event_type)
  where active = true;

alter table api_webhooks enable row level security;

create policy "users_view_own_webhooks" on api_webhooks
  for select using (user_id = auth.uid());
create policy "users_create_own_webhooks" on api_webhooks
  for insert with check (user_id = auth.uid());
create policy "users_update_own_webhooks" on api_webhooks
  for update using (user_id = auth.uid());
create policy "users_delete_own_webhooks" on api_webhooks
  for delete using (user_id = auth.uid());

-- Log des livraisons (pour debug et retry manuel)
create table if not exists api_webhook_deliveries (
  id bigserial primary key,
  webhook_id uuid not null references api_webhooks(id) on delete cascade,
  event_type api_webhook_event not null,
  payload jsonb not null,
  status_code int,
  response_body text,
  delivered_at timestamptz not null default now(),
  duration_ms int
);

create index if not exists api_webhook_deliveries_webhook_idx
  on api_webhook_deliveries(webhook_id, delivered_at desc);

alter table api_webhook_deliveries enable row level security;

create policy "users_view_own_deliveries" on api_webhook_deliveries
  for select using (
    exists (
      select 1 from api_webhooks w
      where w.id = api_webhook_deliveries.webhook_id
        and w.user_id = auth.uid()
    )
  );

-- Snapshots d'estimations pour détecter les variations
-- Clé composite : api_key_id + address_hash (hash des inputs significatifs)
create table if not exists api_estimation_snapshots (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid not null references api_keys(id) on delete cascade,
  input_hash text not null, -- hash stable des inputs (commune + surface + ...)
  last_estimation numeric not null,
  updated_at timestamptz not null default now(),
  unique (api_key_id, input_hash)
);

create index if not exists api_snapshots_key_hash_idx
  on api_estimation_snapshots(api_key_id, input_hash);

alter table api_estimation_snapshots enable row level security;

-- Les snapshots ne sont pas user-exposés directement (utilisés par le serveur)
-- mais on permet à l'owner de la clé de les voir
create policy "users_view_own_snapshots" on api_estimation_snapshots
  for select using (
    exists (
      select 1 from api_keys k
      where k.id = api_estimation_snapshots.api_key_id
        and k.user_id = auth.uid()
    )
  );
