-- ============================================================
-- SUIVI MANDATS AGENCES IMMO LU
-- ============================================================
-- Pipeline CRM léger pour agences : de la prospection à la vente.
-- Conforme loi du 28 décembre 1988 (professions immobilières) et
-- règlement grand-ducal du 4 juillet 2000 (mandats).

create type mandate_status as enum (
  'prospect',    -- contact identifié, pas encore de mandat signé
  'mandat_signe',-- mandat en cours
  'sous_compromis', -- compromis de vente signé
  'vendu',       -- acte définitif signé
  'abandonne',   -- mandat résilié sans vente
  'expire'       -- délai écoulé sans activité
);

create type mandate_type as enum (
  'exclusif',    -- mandat exclusif (3 mois min.)
  'simple',      -- mandat simple (plusieurs agences)
  'semi_exclusif', -- exclusivité géographique ou temporelle
  'recherche'    -- mandat de recherche (acquéreur)
);

create table if not exists agency_mandates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  reference text, -- référence interne de l'agence
  property_address text not null,
  property_commune text,
  property_type text, -- 'appartement', 'maison', 'terrain', 'commercial'
  property_surface numeric,
  prix_demande numeric,
  client_name text,
  client_email text,
  client_phone text,
  mandate_type mandate_type not null default 'simple',
  status mandate_status not null default 'prospect',
  commission_pct numeric(5,2), -- taux commission (ex. 3.00 = 3%)
  commission_amount_estimee numeric, -- commission estimée si vente au prix demandé
  commission_amount_percue numeric, -- commission réellement perçue
  start_date date,
  end_date date, -- fin validité mandat (3 mois exclusif, 1 an simple en général)
  signed_at timestamptz,
  sold_at timestamptz,
  sold_price numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mandates_user_idx on agency_mandates(user_id, created_at desc);
create index if not exists mandates_org_idx on agency_mandates(org_id);
create index if not exists mandates_status_idx on agency_mandates(status) where status in ('mandat_signe','sous_compromis');
create index if not exists mandates_end_date_idx on agency_mandates(end_date) where end_date is not null;

alter table agency_mandates enable row level security;

-- L'utilisateur créateur peut tout faire.
create policy "user_crud_own_mandates" on agency_mandates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Si mandat lié à une org, les membres de l'org (role agent/admin) peuvent voir.
create policy "org_members_read_mandates" on agency_mandates
  for select using (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = agency_mandates.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin','member')
    )
  );

-- Trigger maj updated_at
create or replace function mandates_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists mandates_touch_trg on agency_mandates;
create trigger mandates_touch_trg before update on agency_mandates
  for each row execute function mandates_touch();

-- Vue : mandats qui expirent dans les 30 jours (pour relance agence)
create or replace view agency_mandates_expiring as
select
  m.id, m.user_id, m.reference, m.property_address, m.client_name,
  m.end_date, m.status, m.mandate_type,
  (m.end_date - current_date)::int as days_remaining
from agency_mandates m
where m.status in ('mandat_signe','sous_compromis')
  and m.end_date is not null
  and m.end_date between current_date and (current_date + interval '30 days');
