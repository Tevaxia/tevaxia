-- ============================================================
-- PMS — EXTERNAL CALENDARS (iCal import / channel manager lite)
-- ============================================================
-- Subscribe à des URLs iCal (Airbnb, Booking, VRBO, HomeAway, Expedia
-- ou n'importe quel flux ICS) pour importer les événements en tant que
-- réservations "block" dans le PMS, afin d'éviter les double-bookings.
--
-- Cette approche one-way est le standard "channel manager lite"
-- utilisé par Airbnb/Booking. Pour le two-way sync API complet il faut
-- passer par SiteMinder / Cloudbeds distribution (roadmap T4).

create type pms_calendar_source as enum (
  'airbnb',
  'booking',
  'vrbo',
  'homeaway',
  'expedia',
  'agoda',
  'tripadvisor',
  'custom_ics'
);

-- ============================================================
-- Feeds iCal externes
-- ============================================================

create table if not exists pms_external_calendars (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references pms_properties(id) on delete cascade,
  -- Scope : une chambre précise OU un type de chambre (si pool)
  room_id uuid references pms_rooms(id) on delete cascade,
  room_type_id uuid references pms_room_types(id) on delete set null,
  source pms_calendar_source not null default 'custom_ics',
  label text not null,
  ics_url text not null,
  -- État / config
  active boolean not null default true,
  color text default '#6366F1', -- couleur calendar UI
  min_los smallint, -- restriction min nuits importées
  -- Sync stats
  last_sync_at timestamptz,
  last_sync_status text, -- 'ok' | 'error' | 'pending'
  last_error text,
  sync_count int not null default 0,
  events_count int not null default 0,
  -- Auto
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ics_url like 'http%' or ics_url like 'webcal%')
);

create index if not exists pms_ec_prop_idx on pms_external_calendars(property_id, active);
create index if not exists pms_ec_room_idx on pms_external_calendars(room_id) where room_id is not null;

alter table pms_external_calendars enable row level security;

create policy "pms_ec_crud_via_prop" on pms_external_calendars
  for all using (
    exists (select 1 from pms_properties p where p.id = pms_external_calendars.property_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from pms_properties p where p.id = pms_external_calendars.property_id and p.user_id = auth.uid())
  );

create policy "pms_ec_org_rw" on pms_external_calendars
  for all using (
    exists (select 1 from pms_properties p
            join org_members m on m.org_id = p.org_id
            where p.id = pms_external_calendars.property_id
              and p.org_id is not null and m.user_id = auth.uid() and m.role in ('admin','member'))
  ) with check (
    exists (select 1 from pms_properties p
            join org_members m on m.org_id = p.org_id
            where p.id = pms_external_calendars.property_id
              and p.org_id is not null and m.user_id = auth.uid() and m.role in ('admin','member'))
  );

drop trigger if exists pms_ec_touch on pms_external_calendars;
create trigger pms_ec_touch before update on pms_external_calendars
  for each row execute function pms_touch();

-- ============================================================
-- Extension pms_reservations : lien vers calendrier externe + UID iCal
-- ============================================================

alter table pms_reservations
  add column if not exists external_calendar_id uuid references pms_external_calendars(id) on delete set null,
  add column if not exists external_event_uid text;

-- Index pour update/delete lors des resync
create index if not exists pms_res_ical_uid_idx on pms_reservations(external_calendar_id, external_event_uid)
  where external_event_uid is not null;

-- ============================================================
-- RPC : statistiques sync par calendrier (pour page /channels)
-- ============================================================

create or replace function pms_external_calendar_stats(p_calendar_id uuid)
returns table (
  active_blocks int,
  future_blocks int,
  past_blocks int,
  last_event_end date
) language plpgsql security definer set search_path = public as $$
begin
  -- Auth : via propriété
  if not exists (
    select 1 from pms_external_calendars ec
    join pms_properties p on p.id = ec.property_id
    where ec.id = p_calendar_id and p.user_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  return query
  select
    count(*) filter (where r.check_in <= current_date and r.check_out > current_date)::int,
    count(*) filter (where r.check_in > current_date)::int,
    count(*) filter (where r.check_out <= current_date)::int,
    max(r.check_out)
  from pms_reservations r
  where r.external_calendar_id = p_calendar_id;
end;
$$;

grant execute on function pms_external_calendar_stats(uuid) to authenticated;
