-- ============================================================
-- ORGANIZATIONS — Multi-tenant pour agences immobilières
-- ============================================================
-- Permet à une agence d'inviter ses négociateurs et de partager
-- les rapports d'estimation co-brandés sous un même branding.

create extension if not exists "pgcrypto";

-- 1) ORGANIZATIONS

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  brand_color text default '#0B2447',
  contact_email text,
  contact_phone text,
  vat_number text,
  legal_mention text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) ORG_MEMBERS

create type org_role as enum ('admin', 'member', 'viewer');

create table if not exists org_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_members_user_idx on org_members(user_id);

-- 3) ORG_INVITATIONS

create table if not exists org_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role org_role not null default 'member',
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists org_invitations_token_idx on org_invitations(token);
create index if not exists org_invitations_email_idx on org_invitations(email);

-- 4) RLS

alter table organizations enable row level security;
alter table org_members enable row level security;
alter table org_invitations enable row level security;

-- helper view : non utilisée mais documente la sémantique
-- "user is admin of org X" = exists row in org_members where user_id=auth.uid() and org_id=X and role='admin'

-- Org : visible aux membres
create policy "org_members_can_view_org" on organizations
  for select
  using (
    exists (
      select 1 from org_members
      where org_members.org_id = organizations.id
        and org_members.user_id = auth.uid()
    )
  );

-- Org : créateur peut insérer (devient admin via trigger)
create policy "auth_users_can_create_org" on organizations
  for insert
  with check (auth.uid() is not null and created_by = auth.uid());

-- Org : seuls admins peuvent updater
create policy "org_admins_can_update_org" on organizations
  for update
  using (
    exists (
      select 1 from org_members
      where org_members.org_id = organizations.id
        and org_members.user_id = auth.uid()
        and org_members.role = 'admin'
    )
  );

-- Org : seul créateur peut supprimer
create policy "org_creator_can_delete_org" on organizations
  for delete
  using (created_by = auth.uid());

-- Members : visibles à tous les membres de l'org
create policy "org_members_visible_to_org_members" on org_members
  for select
  using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

-- Members : seuls admins peuvent inviter / supprimer
create policy "org_admins_manage_members" on org_members
  for all
  using (
    exists (
      select 1 from org_members m2
      where m2.org_id = org_members.org_id
        and m2.user_id = auth.uid()
        and m2.role = 'admin'
    )
  );

-- Invitations : visibles aux admins de l'org concernée + au destinataire (par email)
create policy "org_admins_view_invitations" on org_invitations
  for select
  using (
    exists (
      select 1 from org_members
      where org_members.org_id = org_invitations.org_id
        and org_members.user_id = auth.uid()
        and org_members.role = 'admin'
    )
    or email = (select email from auth.users where id = auth.uid())
  );

create policy "org_admins_create_invitations" on org_invitations
  for insert
  with check (
    exists (
      select 1 from org_members
      where org_members.org_id = org_invitations.org_id
        and org_members.user_id = auth.uid()
        and org_members.role = 'admin'
    )
    and invited_by = auth.uid()
  );

create policy "org_admins_delete_invitations" on org_invitations
  for delete
  using (
    exists (
      select 1 from org_members
      where org_members.org_id = org_invitations.org_id
        and org_members.user_id = auth.uid()
        and org_members.role = 'admin'
    )
  );

-- 5) TRIGGER : créateur d'org devient admin automatiquement

create or replace function on_org_created_add_admin()
returns trigger language plpgsql security definer as $$
begin
  if new.created_by is not null then
    insert into org_members (org_id, user_id, role)
    values (new.id, new.created_by, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_org_created_add_admin on organizations;
create trigger trg_org_created_add_admin
  after insert on organizations
  for each row execute function on_org_created_add_admin();

-- 6) RPC : accept_invitation atomic

create or replace function accept_invitation(invitation_token text)
returns json language plpgsql security definer as $$
declare
  inv org_invitations%rowtype;
  current_user_id uuid := auth.uid();
  current_user_email text;
begin
  if current_user_id is null then
    return json_build_object('success', false, 'error', 'not_authenticated');
  end if;

  select email into current_user_email from auth.users where id = current_user_id;

  select * into inv from org_invitations where token = invitation_token;

  if not found then
    return json_build_object('success', false, 'error', 'invitation_not_found');
  end if;
  if inv.accepted_at is not null then
    return json_build_object('success', false, 'error', 'already_accepted');
  end if;
  if inv.expires_at < now() then
    return json_build_object('success', false, 'error', 'expired');
  end if;
  if lower(inv.email) <> lower(current_user_email) then
    return json_build_object('success', false, 'error', 'email_mismatch');
  end if;

  insert into org_members (org_id, user_id, role)
  values (inv.org_id, current_user_id, inv.role)
  on conflict (org_id, user_id) do update set role = excluded.role;

  update org_invitations set accepted_at = now() where id = inv.id;

  return json_build_object('success', true, 'org_id', inv.org_id);
end;
$$;

grant execute on function accept_invitation(text) to authenticated;

-- 7) updated_at trigger

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orgs_updated_at on organizations;
create trigger trg_orgs_updated_at
  before update on organizations
  for each row execute function set_updated_at();
