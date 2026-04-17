-- ============================================================
-- SHARED LINK ANALYTICS — timeline de vues par lien partagé
-- ============================================================
-- Permet au propriétaire d'un lien partagé de voir l'historique
-- détaillé des consultations (quand, combien). Le RPC
-- get_shared_link est mis à jour pour insérer une ligne à chaque
-- consultation réussie.

create table if not exists shared_link_views (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references shared_links(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  ua_family text -- 'chrome','safari','firefox','edge','other' — grossièrement dérivé
);

create index if not exists shared_link_views_link_idx
  on shared_link_views(link_id, viewed_at desc);

alter table shared_link_views enable row level security;

-- Owner du lien voit les vues de ses propres liens
create policy "owner_sees_own_link_views" on shared_link_views
  for select using (
    exists (
      select 1 from shared_links sl
      where sl.id = shared_link_views.link_id
        and sl.owner_user_id = auth.uid()
    )
  );

-- Remplace get_shared_link pour logger la vue
create or replace function get_shared_link(p_token text)
returns jsonb language plpgsql security definer as $$
declare
  link shared_links%rowtype;
begin
  select * into link from shared_links where token = p_token;
  if not found then
    return jsonb_build_object('success', false, 'error', 'not_found');
  end if;
  if link.expires_at < now() then
    return jsonb_build_object('success', false, 'error', 'expired');
  end if;
  if link.max_views is not null and link.view_count >= link.max_views then
    return jsonb_build_object('success', false, 'error', 'view_limit_reached');
  end if;

  update shared_links set view_count = view_count + 1 where id = link.id;
  insert into shared_link_views (link_id) values (link.id);

  return jsonb_build_object(
    'success', true,
    'tool_type', link.tool_type,
    'title', link.title,
    'payload', link.payload,
    'view_count', link.view_count + 1,
    'expires_at', link.expires_at
  );
end;
$$;

grant execute on function get_shared_link(text) to anon, authenticated;

-- RPC pour owner : timeline agrégée par jour sur les 30 derniers jours
create or replace function get_shared_link_timeline(p_link_id uuid, p_days int default 30)
returns jsonb language plpgsql security definer as $$
declare
  link_owner uuid;
  rows jsonb;
begin
  select owner_user_id into link_owner from shared_links where id = p_link_id;
  if link_owner is null or link_owner <> auth.uid() then
    return jsonb_build_object('success', false, 'error', 'unauthorized');
  end if;

  with days as (
    select generate_series(
      (now() - make_interval(days => p_days))::date,
      now()::date,
      interval '1 day'
    )::date as d
  ),
  counts as (
    select date_trunc('day', viewed_at)::date as d, count(*) as n
    from shared_link_views
    where link_id = p_link_id and viewed_at >= now() - make_interval(days => p_days)
    group by 1
  )
  select jsonb_agg(jsonb_build_object(
    'day', to_char(days.d, 'YYYY-MM-DD'),
    'views', coalesce(counts.n, 0)
  ) order by days.d) into rows
  from days left join counts on days.d = counts.d;

  return jsonb_build_object('success', true, 'timeline', coalesce(rows, '[]'::jsonb));
end;
$$;

grant execute on function get_shared_link_timeline(uuid, int) to authenticated;
