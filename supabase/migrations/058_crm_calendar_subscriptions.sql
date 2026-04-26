-- ============================================================
-- CALENDRIER : abonnements .ics (lecture seule)
-- ============================================================
-- Permet à un utilisateur de générer une URL .ics (avec token
-- aléatoire) qu'il colle dans Google Calendar / Outlook / Apple
-- Calendar pour voir ses tâches CRM et visites planifiées.
-- Aucune écriture distante : c'est un flux read-only.
--
-- Sécurité : token UUID v4 + secret (32 chars hex). Le SELECT par
-- token est exposé via RPC SECURITY DEFINER pour bypass RLS auth.
-- ============================================================

create table if not exists crm_calendar_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  label text default 'Calendrier tevaxia',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  access_count integer not null default 0
);

create index if not exists crm_calsub_user_idx on crm_calendar_subscriptions(user_id);
create index if not exists crm_calsub_token_idx on crm_calendar_subscriptions(token) where active;

alter table crm_calendar_subscriptions enable row level security;

create policy "crm_calsub_own" on crm_calendar_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- RPC : récupère les events pour un token
-- Renvoie tasks (todo/in_progress avec due_at) + futures visites
-- ============================================================

create or replace function crm_calendar_feed(p_token text)
returns table (
  uid text,
  summary text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  url text,
  status text,
  category text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Lookup token
  select user_id into v_user_id
    from crm_calendar_subscriptions
    where token = p_token and active = true;

  if v_user_id is null then
    return;
  end if;

  -- Track access
  update crm_calendar_subscriptions
    set last_accessed_at = now(),
        access_count = access_count + 1
    where token = p_token;

  -- Tasks
  return query
    select
      ('task-' || t.id::text) as uid,
      t.title as summary,
      coalesce(t.description, '') as description,
      t.due_at as starts_at,
      (t.due_at + interval '30 minutes') as ends_at,
      ('https://tevaxia.lu/pro-agences/crm/tasks#' || t.id::text) as url,
      case t.status::text
        when 'todo' then 'CONFIRMED'
        when 'in_progress' then 'CONFIRMED'
        when 'done' then 'COMPLETED'
        else 'TENTATIVE'
      end as status,
      'Tâche'::text as category
    from crm_tasks t
    where t.user_id = v_user_id
      and t.due_at is not null
      and t.status in ('todo', 'in_progress')
      and t.due_at > now() - interval '7 days'
      and t.due_at < now() + interval '180 days';

  -- Future visits (from interactions)
  return query
    select
      ('visit-' || i.id::text) as uid,
      coalesce(i.subject, 'Visite de bien') as summary,
      coalesce(i.body, '') as description,
      i.occurred_at as starts_at,
      (i.occurred_at + interval '1 hour') as ends_at,
      case
        when i.mandate_id is not null then ('https://tevaxia.lu/pro-agences/mandats/' || i.mandate_id::text)
        else 'https://tevaxia.lu/pro-agences/crm'
      end as url,
      'CONFIRMED'::text as status,
      'Visite'::text as category
    from crm_interactions i
    where i.user_id = v_user_id
      and i.interaction_type = 'visit'
      and i.occurred_at > now() - interval '1 day'
      and i.occurred_at < now() + interval '180 days';
end;
$$;

grant execute on function crm_calendar_feed(text) to anon, authenticated;
