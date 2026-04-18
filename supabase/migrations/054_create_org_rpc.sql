-- ============================================================
-- ORGANIZATIONS — RPC SECURITY DEFINER pour création robuste
-- ============================================================
-- Le policy RLS "auth_users_can_create_org" (migration 003) impose
-- created_by = auth.uid() ET auth.uid() IS NOT NULL côté INSERT.
--
-- Dans certains cas (cookies domain mismatch en preview, JWT expiré
-- silencieusement, client browser vs SSR), auth.uid() peut retourner
-- null alors que getUser() côté client retourne un utilisateur valide.
-- Résultat : erreur RLS 42501.
--
-- Cette RPC SECURITY DEFINER contourne le problème : elle tourne avec
-- les droits de son owner (postgres), mais vérifie explicitement que
-- auth.uid() est valide et utilise cet ID comme created_by. Le trigger
-- on_org_created_add_admin continue de fonctionner (SECURITY DEFINER
-- lui aussi) et ajoute le créateur comme admin.

create or replace function create_organization(
  p_name text,
  p_slug text,
  p_org_type text default 'agency',
  p_contact_email text default null,
  p_contact_phone text default null,
  p_vat_number text default null,
  p_brand_color text default '#0B2447',
  p_legal_mention text default null
) returns organizations language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_org organizations;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name_required' using errcode = '23514';
  end if;
  if p_slug is null or length(trim(p_slug)) = 0 then
    raise exception 'slug_required' using errcode = '23514';
  end if;
  if p_org_type not in ('agency', 'syndic', 'hotel_group', 'bank', 'other') then
    raise exception 'invalid_org_type' using errcode = '23514';
  end if;

  insert into organizations (
    name, slug, org_type,
    contact_email, contact_phone, vat_number,
    brand_color, legal_mention, created_by
  )
  values (
    trim(p_name), p_slug, p_org_type,
    p_contact_email, p_contact_phone, p_vat_number,
    coalesce(p_brand_color, '#0B2447'), p_legal_mention, v_user_id
  )
  returning * into v_org;

  -- Le trigger trg_org_created_add_admin (migration 003) ajoute
  -- automatiquement le créateur comme admin dans org_members.

  return v_org;
end;
$$;

grant execute on function create_organization(
  text, text, text, text, text, text, text, text
) to authenticated;

-- ============================================================
-- RPC utilitaire : suggère un slug unique (évite collision 1/10000)
-- ============================================================

create or replace function suggest_org_slug(p_base_slug text)
returns text language plpgsql stable as $$
declare
  v_slug text;
  v_suffix text;
  v_attempts int := 0;
begin
  if p_base_slug is null or length(trim(p_base_slug)) = 0 then
    v_slug := 'org';
  else
    v_slug := lower(regexp_replace(p_base_slug, '[^a-z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    if length(v_slug) = 0 then v_slug := 'org'; end if;
    if length(v_slug) > 40 then v_slug := substring(v_slug from 1 for 40); end if;
  end if;

  -- Tente d'abord slug nu, puis avec suffixes aléatoires
  loop
    if v_attempts = 0 then
      exit when not exists (select 1 from organizations where slug = v_slug);
    else
      v_suffix := substr(md5(random()::text), 1, 6);
      v_slug := substring(v_slug from 1 for 33) || '-' || v_suffix;
      exit when not exists (select 1 from organizations where slug = v_slug);
    end if;
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      -- Fallback ultime avec timestamp
      v_slug := 'org-' || extract(epoch from now())::bigint::text;
      exit;
    end if;
  end loop;

  return v_slug;
end;
$$;

grant execute on function suggest_org_slug(text) to authenticated;
