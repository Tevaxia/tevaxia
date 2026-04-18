-- ============================================================
-- SYNDIC — Clés de répartition + budget par compte + lien appels/compta
-- ============================================================
-- Complète le socle comptable (018) avec les briques qui séparent un
-- wizard d'un vrai logiciel syndic :
--
--   1. Clés de répartition : au-delà des tantièmes généraux, chaque
--      nature de charge peut avoir sa propre clé (chauffage au prorata
--      radiateurs, ascenseur uniquement bâtiment A, etc.).
--      Conforme pratique copropriété LU (loi 16 mai 1975 + 27.08.2018).
--
--   2. Budget détaillé par compte (pas juste un total annuel JSON) :
--      permet comparatif budget prévisionnel vs réalisé par compte
--      du plan comptable, prérequis de toute AG annuelle.
--
--   3. Lien écritures ↔ appels de fonds / factures : source_type +
--      source_id pour traçabilité et auto-génération d'écritures à
--      l'émission d'un appel.

-- ============================================================
-- 1. CLÉS DE RÉPARTITION
-- ============================================================

create table if not exists coownership_allocation_keys (
  id uuid primary key default gen_random_uuid(),
  coownership_id uuid not null references coownerships(id) on delete cascade,
  code text not null,                  -- 'tantiemes_generaux', 'chauffage', 'ascenseur', ...
  label text not null,
  description text,
  -- total_shares : somme des parts (millièmes ou autre base) — recalculée
  total_shares numeric(14,4) not null default 0,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coownership_id, code)
);

create index if not exists allocation_keys_coown_idx on coownership_allocation_keys(coownership_id);

-- Parts d'une unité (lot) dans une clé donnée
create table if not exists coownership_unit_allocations (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references coownership_units(id) on delete cascade,
  key_id uuid not null references coownership_allocation_keys(id) on delete cascade,
  shares numeric(14,4) not null check (shares >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, key_id)
);

create index if not exists unit_allocations_key_idx on coownership_unit_allocations(key_id);

alter table coownership_allocation_keys enable row level security;
alter table coownership_unit_allocations enable row level security;

drop policy if exists allocation_keys_all on coownership_allocation_keys;
create policy allocation_keys_all on coownership_allocation_keys for all
  using (exists (select 1 from coownerships c
                 where c.id = coownership_id and is_org_member(c.org_id)))
  with check (exists (select 1 from coownerships c
                      where c.id = coownership_id and is_org_member(c.org_id)));

drop policy if exists unit_allocations_all on coownership_unit_allocations;
create policy unit_allocations_all on coownership_unit_allocations for all
  using (exists (select 1 from coownership_units u
                 join coownerships c on c.id = u.coownership_id
                 where u.id = unit_id and is_org_member(c.org_id)))
  with check (exists (select 1 from coownership_units u
                      join coownerships c on c.id = u.coownership_id
                      where u.id = unit_id and is_org_member(c.org_id)));

-- Trigger maj total_shares quand les parts changent
create or replace function allocation_key_refresh_total() returns trigger language plpgsql as $$
begin
  update coownership_allocation_keys
     set total_shares = coalesce((select sum(shares) from coownership_unit_allocations
                                  where key_id = coalesce(new.key_id, old.key_id)), 0),
         updated_at = now()
   where id = coalesce(new.key_id, old.key_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists unit_allocations_refresh_total on coownership_unit_allocations;
create trigger unit_allocations_refresh_total
  after insert or update or delete on coownership_unit_allocations
  for each row execute function allocation_key_refresh_total();

create or replace function allocation_keys_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists allocation_keys_touch_trg on coownership_allocation_keys;
create trigger allocation_keys_touch_trg before update on coownership_allocation_keys
  for each row execute function allocation_keys_touch();

drop trigger if exists unit_allocations_touch_trg on coownership_unit_allocations;
create trigger unit_allocations_touch_trg before update on coownership_unit_allocations
  for each row execute function allocation_keys_touch();

-- ============================================================
-- 2. SEED — clé système "tantièmes généraux" par copropriété
-- ============================================================
-- Backfill toutes les copropriétés existantes avec leur clé par défaut
-- peuplée à partir de coownership_units.tantiemes.

create or replace function seed_default_allocation_key(p_coownership_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_key_id uuid;
begin
  insert into coownership_allocation_keys (coownership_id, code, label, description, is_system)
  values (p_coownership_id, 'tantiemes_generaux',
          'Tantièmes généraux',
          'Clé de répartition par défaut basée sur la quote-part de chaque lot (loi 1988 art. 14).',
          true)
  on conflict (coownership_id, code) do update set is_system = true
  returning id into v_key_id;

  -- Peuple les parts depuis coownership_units.tantiemes
  insert into coownership_unit_allocations (unit_id, key_id, shares)
  select u.id, v_key_id, u.tantiemes::numeric
  from coownership_units u
  where u.coownership_id = p_coownership_id
  on conflict (unit_id, key_id) do update set shares = excluded.shares;

  return v_key_id;
end;
$$;

-- Backfill immédiat pour l'existant
do $$
declare r record;
begin
  for r in select id from coownerships loop
    perform seed_default_allocation_key(r.id);
  end loop;
end $$;

-- Trigger : à la création d'une nouvelle copropriété, seed la clé
create or replace function coownerships_seed_key_trg() returns trigger language plpgsql as $$
begin
  perform seed_default_allocation_key(new.id);
  return new;
end;
$$;
drop trigger if exists coownerships_seed_key on coownerships;
create trigger coownerships_seed_key after insert on coownerships
  for each row execute function coownerships_seed_key_trg();

-- Trigger : à la création d'une nouvelle unité, ajoute automatiquement
-- sa part dans la clé tantièmes généraux (et les autres system keys).
create or replace function units_seed_allocation_trg() returns trigger language plpgsql as $$
begin
  insert into coownership_unit_allocations (unit_id, key_id, shares)
  select new.id, k.id, new.tantiemes::numeric
  from coownership_allocation_keys k
  where k.coownership_id = new.coownership_id
    and k.code = 'tantiemes_generaux'
  on conflict (unit_id, key_id) do update set shares = excluded.shares;
  return new;
end;
$$;
drop trigger if exists units_seed_allocation on coownership_units;
create trigger units_seed_allocation after insert on coownership_units
  for each row execute function units_seed_allocation_trg();

-- ============================================================
-- 3. BUDGET DÉTAILLÉ PAR COMPTE
-- ============================================================

create table if not exists coownership_budget_lines (
  id uuid primary key default gen_random_uuid(),
  coownership_id uuid not null references coownerships(id) on delete cascade,
  year int not null,
  account_id uuid not null references accounting_accounts(id) on delete cascade,
  amount_budgeted numeric(14,2) not null default 0,
  -- Clé de répartition prévue pour cette ligne (ex. '606' énergie sur chauffage)
  allocation_key_id uuid references coownership_allocation_keys(id) on delete set null,
  nature text, -- 'courantes' | 'travaux' | 'fonds_travaux' | 'exceptionnel'
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coownership_id, year, account_id)
);

create index if not exists budget_lines_year_idx on coownership_budget_lines(coownership_id, year);
create index if not exists budget_lines_account_idx on coownership_budget_lines(account_id);

alter table coownership_budget_lines enable row level security;

drop policy if exists budget_lines_all on coownership_budget_lines;
create policy budget_lines_all on coownership_budget_lines for all
  using (exists (select 1 from coownerships c
                 where c.id = coownership_id and is_org_member(c.org_id)))
  with check (exists (select 1 from coownerships c
                      where c.id = coownership_id and is_org_member(c.org_id)));

create or replace function budget_lines_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists budget_lines_touch_trg on coownership_budget_lines;
create trigger budget_lines_touch_trg before update on coownership_budget_lines
  for each row execute function budget_lines_touch();

-- ============================================================
-- 4. LIEN ÉCRITURES ↔ SOURCE (appels, factures, paiements)
-- ============================================================

alter table accounting_entries
  add column if not exists source_type text,
  add column if not exists source_id uuid;

create index if not exists entries_source_idx on accounting_entries(source_type, source_id)
  where source_type is not null;

-- Extension coownership_calls : clé de répartition + nature
alter table coownership_calls
  add column if not exists allocation_key_id uuid references coownership_allocation_keys(id) on delete set null,
  add column if not exists nature text default 'courantes';

-- ============================================================
-- 5. FONCTION : génération charges avec clé custom
-- ============================================================

create or replace function generate_charges_with_key(p_call_id uuid)
returns int language plpgsql security definer as $$
declare
  v_call record;
  v_key_id uuid;
  v_total_shares numeric;
  v_total_amount numeric;
  v_period_code text;
  v_template text;
  v_count int := 0;
begin
  select * into v_call from coownership_calls where id = p_call_id;
  if not found then raise exception 'Appel introuvable'; end if;

  -- Utilise la clé de l'appel, sinon tantièmes_généraux par défaut
  v_key_id := v_call.allocation_key_id;
  if v_key_id is null then
    select id into v_key_id from coownership_allocation_keys
    where coownership_id = v_call.coownership_id and code = 'tantiemes_generaux'
    limit 1;
  end if;
  if v_key_id is null then raise exception 'Aucune clé de répartition disponible'; end if;

  select total_shares into v_total_shares from coownership_allocation_keys where id = v_key_id;
  if v_total_shares is null or v_total_shares = 0 then
    raise exception 'La clé "%" n''a aucune part attribuée', v_key_id;
  end if;

  v_total_amount := v_call.total_amount;
  v_period_code := substring(v_call.period_start::text, 1, 7);
  v_template := coalesce(v_call.payment_reference_template, 'COPRO-{lot}-{period}');

  -- Supprime les charges existantes si appel encore en brouillon
  if v_call.status = 'draft' then
    delete from coownership_unit_charges where call_id = p_call_id;
  end if;

  -- Insère une charge par unité en fonction de ses parts dans la clé
  insert into coownership_unit_charges (call_id, unit_id, amount_due, amount_paid, payment_reference)
  select
    p_call_id,
    u.id,
    round((v_total_amount * a.shares / v_total_shares)::numeric, 2),
    0,
    replace(replace(v_template, '{lot}', u.lot_number), '{period}', v_period_code)
  from coownership_unit_allocations a
  join coownership_units u on u.id = a.unit_id
  where a.key_id = v_key_id
    and u.coownership_id = v_call.coownership_id
  on conflict (call_id, unit_id) do update
    set amount_due = excluded.amount_due,
        payment_reference = excluded.payment_reference;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function generate_charges_with_key(uuid) to authenticated;

-- ============================================================
-- 6. VUE : BUDGET VS RÉALISÉ
-- ============================================================

create or replace view coownership_budget_vs_actual as
select
  b.coownership_id,
  b.year,
  b.account_id,
  a.code,
  a.label,
  a.classe,
  b.amount_budgeted,
  b.allocation_key_id,
  b.nature,
  coalesce(sum(
    case
      when a.classe = 6 then l.debit - l.credit   -- charges = débit
      when a.classe = 7 then l.credit - l.debit   -- produits = crédit
      else l.debit - l.credit
    end
  ), 0) as amount_actual,
  b.amount_budgeted - coalesce(sum(
    case
      when a.classe = 6 then l.debit - l.credit
      when a.classe = 7 then l.credit - l.debit
      else l.debit - l.credit
    end
  ), 0) as variance,
  case
    when b.amount_budgeted = 0 then null
    else round(coalesce(sum(
      case
        when a.classe = 6 then l.debit - l.credit
        when a.classe = 7 then l.credit - l.debit
        else l.debit - l.credit
      end
    ), 0) / b.amount_budgeted * 100, 1)
  end as pct_consumed
from coownership_budget_lines b
join accounting_accounts a on a.id = b.account_id
left join accounting_entry_lines l on l.account_id = a.id
left join accounting_entries e on e.id = l.entry_id and extract(year from e.entry_date) = b.year
group by b.coownership_id, b.year, b.account_id, a.code, a.label, a.classe,
         b.amount_budgeted, b.allocation_key_id, b.nature;

-- ============================================================
-- 7. VUE : SOLDE PAR COPROPRIÉTAIRE (impayés)
-- ============================================================

create or replace view coownership_owner_balance as
select
  u.coownership_id,
  u.id as unit_id,
  u.lot_number,
  u.owner_name,
  count(ch.id) as nb_charges,
  count(ch.id) filter (where ch.amount_paid < ch.amount_due) as nb_unpaid,
  coalesce(sum(ch.amount_due), 0) as total_due,
  coalesce(sum(ch.amount_paid), 0) as total_paid,
  coalesce(sum(ch.amount_due - ch.amount_paid), 0) as balance_outstanding,
  max(case when ch.amount_paid < ch.amount_due then c.due_date end) as oldest_unpaid_due_date
from coownership_units u
left join coownership_unit_charges ch on ch.unit_id = u.id
left join coownership_calls c on c.id = ch.call_id and c.status in ('issued','partially_paid','overdue')
group by u.coownership_id, u.id, u.lot_number, u.owner_name;
