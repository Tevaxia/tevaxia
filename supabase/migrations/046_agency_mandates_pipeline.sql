-- ============================================================
-- AGENCY MANDATES — diffusion portails + offres + co-mandats
-- ============================================================
-- Complète le pipeline agency_mandates (039) + CRM (044) avec les
-- briques qui manquent pour un outil de suivi mandat niveau mondial :
--   - agency_mandate_diffusion : état de publication par portail LU
--     (athome.lu, Immotop.lu, Immoweb, atHomeFinance, LinkedIn).
--   - agency_mandate_offers : offres reçues structurées (montant,
--     conditions suspensives, délai, statut acceptée/refusée/contre).
--   - agency_mandates : colonnes co-mandat + visites attendues.
--
-- Les visites et communications passent par crm_interactions (044).

-- ============================================================
-- 1. COLONNES AGENCY_MANDATES
-- ============================================================

alter table agency_mandates
  add column if not exists is_co_mandate boolean not null default false,
  add column if not exists co_agency_name text,
  add column if not exists co_agency_commission_pct numeric(5,2),
  add column if not exists co_agency_contact text,
  -- Diffusion publique (résumé)
  add column if not exists is_published boolean not null default false,
  add column if not exists published_at timestamptz,
  -- Photos / médias : nombre total (détail dans crm_documents)
  add column if not exists media_count integer not null default 0,
  -- Caractéristiques publiables
  add column if not exists property_bedrooms integer,
  add column if not exists property_bathrooms integer,
  add column if not exists property_floor integer,
  add column if not exists property_year_built integer,
  add column if not exists property_epc_class text, -- 'A','B','C','D','E','F','G','I'
  add column if not exists property_description text,
  -- Prix vendu : statistiques
  add column if not exists days_to_sign integer, -- jours entre mandat_signe et sous_compromis
  add column if not exists days_to_close integer; -- jours entre sous_compromis et vendu

-- Trigger : calcule days_to_sign / days_to_close automatiquement
create or replace function mandates_compute_days() returns trigger language plpgsql as $$
begin
  if new.status = 'sous_compromis' and old.status <> 'sous_compromis' and new.signed_at is not null then
    new.days_to_sign := (extract(epoch from now() - new.signed_at) / 86400)::int;
  end if;
  if new.status = 'vendu' and old.status <> 'vendu' and new.signed_at is not null then
    new.sold_at := coalesce(new.sold_at, now());
    new.days_to_close := (extract(epoch from new.sold_at - new.signed_at) / 86400)::int;
  end if;
  return new;
end;
$$;
drop trigger if exists mandates_compute_days_trg on agency_mandates;
create trigger mandates_compute_days_trg before update on agency_mandates
  for each row execute function mandates_compute_days();

-- ============================================================
-- 2. DIFFUSION PORTAILS
-- ============================================================

create type mandate_portal as enum (
  'athome',        -- athome.lu (dominant LU)
  'immotop',       -- Immotop.lu
  'immoweb',       -- Immoweb.lu (BE/LU)
  'athome_finance',-- atHomeFinance courtage crédit
  'linkedin',      -- LinkedIn (visibilité)
  'facebook',      -- Facebook Marketplace
  'website',       -- site propre de l'agence
  'seloger',       -- SeLoger (FR — frontaliers)
  'leboncoin',     -- Leboncoin (FR — frontaliers)
  'other'
);

create type diffusion_status as enum (
  'draft',          -- préparé, pas publié
  'pending',        -- envoyé, en attente validation portail
  'published',      -- en ligne
  'paused',         -- suspendu temporairement
  'expired',        -- expiré côté portail
  'withdrawn',      -- retiré (vendu / plus disponible)
  'rejected'        -- rejet portail (critères non respectés)
);

create table if not exists agency_mandate_diffusion (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references agency_mandates(id) on delete cascade,
  portal mandate_portal not null,
  status diffusion_status not null default 'draft',
  external_ref text,          -- référence côté portail (ex. annonce #12345)
  public_url text,
  published_at timestamptz,
  expires_at timestamptz,
  withdrawn_at timestamptz,
  -- Stats publication
  views_count integer,
  leads_count integer,
  last_sync_at timestamptz,   -- dernière sync XML / API
  -- Paramètres diffusion
  highlighted boolean not null default false, -- option "mise en avant" payante
  cost_eur numeric(10,2),     -- coût diffusion (portail premium)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mandate_id, portal)
);

create index if not exists mandate_diffusion_status_idx on agency_mandate_diffusion(mandate_id, status);
create index if not exists mandate_diffusion_sync_idx on agency_mandate_diffusion(last_sync_at);

alter table agency_mandate_diffusion enable row level security;

create policy "diffusion_via_mandate_owner" on agency_mandate_diffusion
  for all using (
    exists (select 1 from agency_mandates m
            where m.id = agency_mandate_diffusion.mandate_id
              and (m.user_id = auth.uid()
                   or (m.org_id is not null and exists (
                     select 1 from org_members om
                     where om.org_id = m.org_id and om.user_id = auth.uid()
                       and om.role in ('admin','member')
                   ))))
  ) with check (
    exists (select 1 from agency_mandates m
            where m.id = agency_mandate_diffusion.mandate_id
              and (m.user_id = auth.uid()
                   or (m.org_id is not null and exists (
                     select 1 from org_members om
                     where om.org_id = m.org_id and om.user_id = auth.uid()
                       and om.role in ('admin','member')
                   ))))
  );

create or replace function diffusion_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists diffusion_touch_trg on agency_mandate_diffusion;
create trigger diffusion_touch_trg before update on agency_mandate_diffusion
  for each row execute function diffusion_touch();

-- Quand une diffusion passe à "published", le mandat est marqué is_published
-- et son statut avance à 'diffuse' si actuellement 'mandat_signe'
create or replace function diffusion_propagate() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and coalesce(old.status,'') <> 'published' then
    update agency_mandates
       set is_published = true,
           published_at = coalesce(published_at, now()),
           status = case
             when status = 'mandat_signe' then 'diffuse'::mandate_status
             else status
           end
     where id = new.mandate_id;
  end if;
  return new;
end;
$$;
drop trigger if exists diffusion_propagate_trg on agency_mandate_diffusion;
create trigger diffusion_propagate_trg after insert or update on agency_mandate_diffusion
  for each row execute function diffusion_propagate();

-- ============================================================
-- 3. OFFRES
-- ============================================================

create type offer_status as enum (
  'received',       -- reçue
  'counter_sent',   -- contre-proposition envoyée
  'counter_received',-- contre-proposition reçue
  'accepted',       -- acceptée par le vendeur
  'refused',        -- refusée
  'withdrawn',      -- retirée par l'acheteur
  'expired'         -- délai de validité écoulé
);

create table if not exists agency_mandate_offers (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references agency_mandates(id) on delete cascade,
  -- Offrant
  buyer_contact_id uuid references crm_contacts(id) on delete set null,
  buyer_name text not null, -- fallback si pas de contact CRM
  buyer_email text,
  buyer_phone text,
  -- Offre
  amount_eur numeric(15,2) not null check (amount_eur > 0),
  currency text not null default 'EUR',
  offered_at date not null default current_date,
  valid_until date,
  status offer_status not null default 'received',
  -- Conditions suspensives
  requires_financing boolean not null default true,
  financing_amount_eur numeric(15,2),
  financing_bank text,
  financing_deadline date,
  requires_sale_of_current_property boolean not null default false,
  other_conditions text,
  -- Décision
  response_notes text,
  accepted_at timestamptz,
  refused_at timestamptz,
  -- Lien
  compromis_id uuid, -- référence future table compromis
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists mandate_offers_mandate_idx on agency_mandate_offers(mandate_id, offered_at desc);
create index if not exists mandate_offers_status_idx on agency_mandate_offers(status);
create index if not exists mandate_offers_contact_idx on agency_mandate_offers(buyer_contact_id) where buyer_contact_id is not null;

alter table agency_mandate_offers enable row level security;

create policy "offers_via_mandate_owner" on agency_mandate_offers
  for all using (
    exists (select 1 from agency_mandates m
            where m.id = agency_mandate_offers.mandate_id
              and (m.user_id = auth.uid()
                   or (m.org_id is not null and exists (
                     select 1 from org_members om
                     where om.org_id = m.org_id and om.user_id = auth.uid()
                       and om.role in ('admin','member')
                   ))))
  ) with check (
    exists (select 1 from agency_mandates m
            where m.id = agency_mandate_offers.mandate_id
              and (m.user_id = auth.uid()
                   or (m.org_id is not null and exists (
                     select 1 from org_members om
                     where om.org_id = m.org_id and om.user_id = auth.uid()
                       and om.role in ('admin','member')
                   ))))
  );

create or replace function offers_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists offers_touch_trg on agency_mandate_offers;
create trigger offers_touch_trg before update on agency_mandate_offers
  for each row execute function offers_touch();

-- Quand une offre est acceptée → mandat passe en 'sous_compromis'
-- Quand une offre est reçue (première du mandat) → mandat passe en 'offre_recue'
create or replace function offers_propagate_status() returns trigger language plpgsql as $$
begin
  if new.status = 'accepted' and coalesce(old.status,'') <> 'accepted' then
    new.accepted_at := coalesce(new.accepted_at, now());
    update agency_mandates
       set status = 'sous_compromis'::mandate_status,
           sold_price = new.amount_eur,
           commission_amount_estimee = new.amount_eur * (coalesce(commission_pct, 3) / 100)
     where id = new.mandate_id
       and status in ('mandat_signe','diffuse','en_visite','offre_recue');
  elsif new.status = 'refused' and coalesce(old.status,'') <> 'refused' then
    new.refused_at := coalesce(new.refused_at, now());
  end if;
  return new;
end;
$$;
drop trigger if exists offers_propagate_trg on agency_mandate_offers;
create trigger offers_propagate_trg before insert or update on agency_mandate_offers
  for each row execute function offers_propagate_status();

-- Après insert : si c'est la 1re offre du mandat, avance à 'offre_recue'
create or replace function offers_first_offer_advance() returns trigger language plpgsql as $$
declare
  c integer;
begin
  select count(*) into c from agency_mandate_offers where mandate_id = new.mandate_id;
  if c = 1 then
    update agency_mandates
       set status = 'offre_recue'::mandate_status
     where id = new.mandate_id
       and status in ('mandat_signe','diffuse','en_visite');
  end if;
  return new;
end;
$$;
drop trigger if exists offers_first_offer_trg on agency_mandate_offers;
create trigger offers_first_offer_trg after insert on agency_mandate_offers
  for each row execute function offers_first_offer_advance();

-- ============================================================
-- 4. VUE : DASHBOARD DIFFUSION
-- ============================================================

create or replace view agency_mandate_diffusion_summary as
select
  m.id as mandate_id,
  m.user_id,
  m.property_address,
  m.prix_demande,
  m.status,
  count(d.id) filter (where d.status = 'published') as nb_published,
  count(d.id) filter (where d.status in ('draft','pending')) as nb_pending,
  count(d.id) filter (where d.status = 'rejected') as nb_rejected,
  array_agg(d.portal order by d.portal) filter (where d.status = 'published') as portals_live,
  sum(d.views_count) as total_views,
  sum(d.leads_count) as total_leads,
  sum(d.cost_eur) as total_diffusion_cost
from agency_mandates m
left join agency_mandate_diffusion d on d.mandate_id = m.id
group by m.id, m.user_id, m.property_address, m.prix_demande, m.status;

-- ============================================================
-- 5. VUE : OFFRES EN COURS PAR MANDAT
-- ============================================================

create or replace view agency_mandate_active_offers as
select
  o.*,
  m.property_address,
  m.prix_demande,
  m.user_id as mandate_user_id,
  (o.amount_eur - coalesce(m.prix_demande, o.amount_eur)) as vs_asking,
  case
    when m.prix_demande is null or m.prix_demande = 0 then null
    else round((o.amount_eur / m.prix_demande - 1) * 100, 2)
  end as vs_asking_pct
from agency_mandate_offers o
join agency_mandates m on m.id = o.mandate_id
where o.status in ('received','counter_sent','counter_received');
