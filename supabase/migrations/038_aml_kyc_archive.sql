-- ============================================================
-- ARCHIVAGE KYC / LBC-FT — 5 ans post-relation d'affaires
-- ============================================================
-- La loi modifiée du 12 novembre 2004 relative à la lutte contre le
-- blanchiment et le financement du terrorisme impose la conservation
-- des documents d'identification (KYC) et des dossiers de diligence
-- raisonnable pendant 5 ans après la fin de la relation d'affaires
-- (art. 3, paragraphe 6).
--
-- Cette table enregistre les métadonnées des documents KYC archivés.
-- Les fichiers eux-mêmes sont dans Supabase Storage (bucket "aml-kyc")
-- chiffré au repos AES-256.

create type kyc_document_type as enum (
  'id_document',           -- CNI, passeport
  'proof_of_address',      -- facture utilités, bail
  'beneficial_owner',      -- attestation bénéficiaire effectif (UBO)
  'source_of_funds',       -- justificatif origine des fonds
  'source_of_wealth',      -- justificatif patrimoine
  'pep_declaration',       -- déclaration personne politiquement exposée
  'sanctions_screening',   -- capture d'écran / rapport filtrage
  'risk_assessment',       -- évaluation des risques
  'business_relationship', -- contrat / accord de service
  'correspondence',        -- échanges formels
  'suspicious_activity',   -- déclaration de soupçon CRF
  'autre'
);

create type kyc_risk_level as enum ('faible', 'standard', 'eleve', 'tres_eleve');

-- Dossier KYC par contrepartie (client, vendeur, acquéreur)
create table if not exists kyc_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  counterparty_name text not null check (length(counterparty_name) between 1 and 255),
  counterparty_type text not null check (counterparty_type in ('personne_physique','personne_morale')),
  counterparty_ref text, -- NIF, numéro ID, numéro RCS
  relationship_start date not null default current_date,
  relationship_end date, -- quand la relation se termine
  risk_level kyc_risk_level not null default 'standard',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kyc_cases_user_idx on kyc_cases(user_id, relationship_start desc);
create index if not exists kyc_cases_org_idx on kyc_cases(org_id);
create index if not exists kyc_cases_end_idx on kyc_cases(relationship_end);

alter table kyc_cases enable row level security;

create policy "users_crud_own_kyc" on kyc_cases
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger de maj updated_at
create or replace function kyc_cases_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists kyc_cases_touch_trg on kyc_cases;
create trigger kyc_cases_touch_trg before update on kyc_cases
  for each row execute function kyc_cases_touch();

-- Documents KYC archivés
create table if not exists kyc_archives (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete restrict,
  document_type kyc_document_type not null,
  title text not null check (length(title) between 1 and 255),
  storage_path text not null,
  file_size bigint,
  sha256 text not null, -- intégrité
  archived_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz not null default now(),
  -- Rétention calculée dynamiquement : date fin relation + 5 ans (ou +5 ans par défaut si ouvert)
  retention_until timestamptz generated always as (
    coalesce(archived_at + interval '5 years', archived_at + interval '5 years')
  ) stored,
  metadata jsonb default '{}'::jsonb
);

create index if not exists kyc_archives_case_idx
  on kyc_archives(case_id, archived_at desc);
create index if not exists kyc_archives_retention_idx
  on kyc_archives(retention_until);

alter table kyc_archives enable row level security;

create policy "users_read_own_kyc_archives" on kyc_archives
  for select using (
    exists (
      select 1 from kyc_cases c where c.id = kyc_archives.case_id and c.user_id = auth.uid()
    )
  );

create policy "users_insert_own_kyc_archives" on kyc_archives
  for insert with check (
    exists (
      select 1 from kyc_cases c where c.id = kyc_archives.case_id and c.user_id = auth.uid()
    )
  );

-- Immutabilité des archives KYC
create or replace function kyc_archive_is_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'Les archives KYC sont immuables (conservation 5 ans loi 12.11.2004 art. 3)';
  return null;
end;
$$;
drop trigger if exists kyc_archive_no_update on kyc_archives;
create trigger kyc_archive_no_update before update on kyc_archives
  for each row execute function kyc_archive_is_immutable();

create or replace function kyc_archive_retention_check() returns trigger language plpgsql as $$
begin
  if old.retention_until > now() then
    raise exception 'Archive KYC protégée jusqu''au % (loi 12.11.2004)', old.retention_until;
  end if;
  return old;
end;
$$;
drop trigger if exists kyc_archive_retention_trigger on kyc_archives;
create trigger kyc_archive_retention_trigger before delete on kyc_archives
  for each row execute function kyc_archive_retention_check();
