-- ============================================================
-- AGENCY — SIGNATURE ÉLECTRONIQUE eIDAS (simple electronic signature)
-- ============================================================
--
-- Workflow de signature électronique pour mandats immobiliers.
-- Conforme règlement UE 910/2014 (eIDAS) pour la "signature électronique
-- simple" — valide juridiquement pour les contrats commerciaux LU/UE
-- sans certification LuxTrust/ID Wallet.
--
-- Pour la "signature électronique avancée" ou "qualifiée" (mandat
-- notarié, compromis de vente), LuxTrust / Itsme est requis — roadmap T5.
--
-- Preuve de signature conservée :
--   - Hash SHA-256 du document signé (détecte altération)
--   - Horodatage certifié (serveur + client)
--   - IP + user-agent du signataire
--   - Checkbox acceptation explicite des termes
--   - Log immuable des événements (view/sign/decline)

create type signature_status as enum (
  'draft',       -- créée, pas encore envoyée
  'sent',        -- lien envoyé au signataire
  'viewed',      -- signataire a ouvert le lien
  'signed',      -- signature accomplie
  'declined',    -- signataire a refusé
  'expired',     -- délai dépassé
  'cancelled'    -- annulée par l'agence
);

create type signature_document_type as enum (
  'mandat',
  'avenant',
  'compromis',
  'bon_de_visite',
  'rapport_estimation',
  'autre'
);

-- ============================================================
-- Requêtes de signature
-- ============================================================

create table if not exists agency_signature_requests (
  id uuid primary key default gen_random_uuid(),
  -- Lien vers le mandat (source principale)
  mandate_id uuid references agency_mandates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  -- Document
  document_type signature_document_type not null default 'mandat',
  document_title text not null,
  document_body text not null, -- texte brut ou markdown
  document_hash text not null, -- SHA-256 hex
  document_pdf_path text,      -- PDF généré, archivé dans storage
  -- Signataire
  signer_name text not null,
  signer_email text not null,
  signer_phone text,
  -- Token d'accès public (opaque, unguessable)
  token text not null unique,
  status signature_status not null default 'draft',
  -- Timeline
  sent_at timestamptz,
  first_viewed_at timestamptz,
  signed_at timestamptz,
  declined_at timestamptz,
  declined_reason text,
  expires_at timestamptz not null,
  -- Preuve eIDAS (figée à la signature)
  signer_ip inet,
  signer_user_agent text,
  signer_timezone text,
  consent_text text, -- texte exact des conditions acceptées
  -- Traçabilité
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sig_mandate_idx on agency_signature_requests(mandate_id) where mandate_id is not null;
create index if not exists sig_user_idx on agency_signature_requests(user_id, created_at desc);
create index if not exists sig_token_idx on agency_signature_requests(token);
create index if not exists sig_status_idx on agency_signature_requests(status) where status in ('sent', 'viewed');

alter table agency_signature_requests enable row level security;

-- Créateur & organisation : full access
create policy "sig_crud_own" on agency_signature_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "sig_org_rw" on agency_signature_requests
  for all using (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = agency_signature_requests.org_id
        and m.user_id = auth.uid() and m.role in ('admin','member')
    )
  ) with check (
    org_id is not null and exists (
      select 1 from org_members m
      where m.org_id = agency_signature_requests.org_id
        and m.user_id = auth.uid() and m.role in ('admin','member')
    )
  );

-- ============================================================
-- Événements de signature (audit trail immuable)
-- ============================================================

create type signature_event_type as enum (
  'created', 'sent', 'viewed', 'signed', 'declined',
  'reminder_sent', 'expired', 'cancelled'
);

create table if not exists agency_signature_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references agency_signature_requests(id) on delete cascade,
  event_type signature_event_type not null,
  event_at timestamptz not null default now(),
  actor_ip inet,
  actor_user_agent text,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sig_events_req_idx on agency_signature_events(request_id, event_at);

alter table agency_signature_events enable row level security;

-- Lecture via la requête parent (si owner) OU via token côté server route
create policy "sig_events_via_parent" on agency_signature_events
  for select using (
    exists (
      select 1 from agency_signature_requests r
      where r.id = agency_signature_events.request_id
        and (r.user_id = auth.uid()
             or (r.org_id is not null and exists (
               select 1 from org_members m
               where m.org_id = r.org_id and m.user_id = auth.uid()
             )))
    )
  );

create policy "sig_events_insert_via_parent" on agency_signature_events
  for insert with check (
    exists (
      select 1 from agency_signature_requests r
      where r.id = agency_signature_events.request_id
        and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- Triggers
-- ============================================================

create or replace function sig_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists sig_touch_trg on agency_signature_requests;
create trigger sig_touch_trg before update on agency_signature_requests
  for each row execute function sig_touch();

-- Immutabilité post-signature : une fois signed_at fixé, impossible de modifier
-- les champs essentiels (document_hash, signer_ip, signed_at, consent_text)
create or replace function sig_immutable_after_sign() returns trigger language plpgsql as $$
begin
  if old.signed_at is not null then
    if coalesce(new.document_hash, '') <> coalesce(old.document_hash, '')
       or coalesce(new.signer_ip::text, '') <> coalesce(old.signer_ip::text, '')
       or coalesce(new.signed_at::text, '') <> coalesce(old.signed_at::text, '')
       or coalesce(new.consent_text, '') <> coalesce(old.consent_text, '')
       or coalesce(new.signer_name, '') <> coalesce(old.signer_name, '')
       or coalesce(new.signer_email, '') <> coalesce(old.signer_email, '') then
      raise exception 'Signature request is immutable once signed (eIDAS audit trail)';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists sig_immutable_trg on agency_signature_requests;
create trigger sig_immutable_trg before update on agency_signature_requests
  for each row execute function sig_immutable_after_sign();

-- ============================================================
-- Vue : état des signatures par mandat
-- ============================================================

create or replace view agency_mandate_signatures_summary as
select
  m.id as mandate_id,
  m.property_address,
  count(s.id) as nb_requests,
  count(s.id) filter (where s.status = 'signed') as nb_signed,
  count(s.id) filter (where s.status in ('sent','viewed')) as nb_pending,
  count(s.id) filter (where s.status = 'declined') as nb_declined,
  max(s.signed_at) as last_signed_at
from agency_mandates m
left join agency_signature_requests s on s.mandate_id = m.id
group by m.id, m.property_address;
