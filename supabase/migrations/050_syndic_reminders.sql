-- ============================================================
-- SYNDIC — RELANCES IMPAYÉS (3 paliers auto)
-- ============================================================
-- Workflow opérationnel post-appel de fonds :
--   Palier 1 (J+15) : rappel amiable, sans frais
--   Palier 2 (J+30) : mise en demeure avec intérêts de retard
--                     (taux légal LU 2026 = 5,75 % + pénalité contractuelle)
--   Palier 3 (J+60) : mise en demeure préalable à l'action judiciaire,
--                     majorée des frais de recouvrement
--
-- Conforme loi 18.04.2004 (taux intérêt légal LU) et pratique
-- copropriété 1988. Historique immutable pour preuve en cas de
-- contentieux locataire devant le Juge de Paix.

-- ============================================================
-- Règles de relance par copropriété
-- ============================================================

create table if not exists coownership_reminder_rules (
  id uuid primary key default gen_random_uuid(),
  coownership_id uuid not null references coownerships(id) on delete cascade,
  palier smallint not null check (palier between 1 and 3),
  days_after_due smallint not null check (days_after_due >= 0),
  label text not null,
  template_body text not null,
  apply_late_interest boolean not null default false,
  -- Taux annuel en % (ex: 5.75 = 5.75%)
  interest_rate_pct numeric(5,2) not null default 0,
  -- Pénalité forfaitaire additionnelle (frais gestion recouvrement)
  penalty_fixed_eur numeric(10,2) not null default 0,
  -- Seuil minimum pour déclencher relance (évite relance pour 5 €)
  min_amount_eur numeric(10,2) not null default 10.00,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coownership_id, palier)
);

create index if not exists reminder_rules_coown_idx on coownership_reminder_rules(coownership_id, palier);

alter table coownership_reminder_rules enable row level security;

drop policy if exists reminder_rules_all on coownership_reminder_rules;
create policy reminder_rules_all on coownership_reminder_rules for all
  using (exists (select 1 from coownerships c
                 where c.id = coownership_id and is_org_member(c.org_id)))
  with check (exists (select 1 from coownerships c
                      where c.id = coownership_id and is_org_member(c.org_id)));

drop trigger if exists reminder_rules_touch on coownership_reminder_rules;
create trigger reminder_rules_touch before update on coownership_reminder_rules
  for each row execute function accounting_touch();

-- ============================================================
-- Historique des relances (immutable après 24h)
-- ============================================================

create type reminder_channel as enum ('email','letter','registered_letter','sms','hand_delivered');
create type reminder_delivery_status as enum ('queued','sent','delivered','failed','opened','bounced');

create table if not exists coownership_reminders (
  id uuid primary key default gen_random_uuid(),
  coownership_id uuid not null references coownerships(id) on delete cascade,
  charge_id uuid not null references coownership_unit_charges(id) on delete cascade,
  unit_id uuid not null references coownership_units(id) on delete cascade,
  palier smallint not null check (palier between 1 and 3),
  sent_at timestamptz not null default now(),
  channel reminder_channel not null default 'letter',
  delivery_status reminder_delivery_status not null default 'queued',
  -- Montants au moment de l'envoi (figés pour preuve)
  amount_due numeric(10,2) not null,
  amount_paid numeric(10,2) not null,
  amount_outstanding numeric(10,2) not null,
  days_late smallint not null,
  late_interest numeric(10,2) not null default 0,
  penalty numeric(10,2) not null default 0,
  total_claimed numeric(10,2) not null, -- outstanding + interest + penalty
  -- Infos destinataire (figées)
  owner_name text,
  owner_email text,
  owner_address text,
  -- Traçabilité
  letter_body text, -- copie conservée
  pdf_storage_path text,
  sent_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_coown_idx on coownership_reminders(coownership_id, sent_at desc);
create index if not exists reminders_charge_idx on coownership_reminders(charge_id, palier);
create index if not exists reminders_unit_idx on coownership_reminders(unit_id);

alter table coownership_reminders enable row level security;

drop policy if exists reminders_all on coownership_reminders;
create policy reminders_all on coownership_reminders for all
  using (exists (select 1 from coownerships c
                 where c.id = coownership_id and is_org_member(c.org_id)))
  with check (exists (select 1 from coownerships c
                      where c.id = coownership_id and is_org_member(c.org_id)));

-- Immutabilité des relances > 24h (preuve contentieux)
create or replace function reminders_immutable() returns trigger language plpgsql as $$
begin
  if old.created_at < now() - interval '24 hours' then
    if new.palier <> old.palier
       or new.amount_outstanding <> old.amount_outstanding
       or new.total_claimed <> old.total_claimed
       or new.sent_at <> old.sent_at
       or coalesce(new.letter_body, '') <> coalesce(old.letter_body, '') then
      raise exception 'Relance âgée de plus de 24h — immutable (audit trail)';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists reminders_immutable_trg on coownership_reminders;
create trigger reminders_immutable_trg before update on coownership_reminders
  for each row execute function reminders_immutable();

-- ============================================================
-- Seed : paliers par défaut pour une copropriété
-- ============================================================

create or replace function seed_default_reminder_rules(p_coownership_id uuid)
returns int language plpgsql security definer as $$
declare v_count int := 0;
begin
  insert into coownership_reminder_rules (
    coownership_id, palier, days_after_due, label, template_body,
    apply_late_interest, interest_rate_pct, penalty_fixed_eur, min_amount_eur
  ) values
    (p_coownership_id, 1, 15,
     'Rappel amiable',
     'Madame, Monsieur,' || E'\n\n' ||
     'Sauf erreur de notre part, votre appel de fonds n° {ref} pour un montant de {amount} est resté impayé au-delà de la date d''échéance.' || E'\n\n' ||
     'Nous vous saurions gré de bien vouloir régulariser votre situation dans un délai de 15 jours.' || E'\n\n' ||
     'Si votre paiement a été effectué dans l''intervalle, veuillez considérer cette lettre comme non avenue.' || E'\n\n' ||
     'Cordialement, le syndic.',
     false, 0, 0, 10.00),
    (p_coownership_id, 2, 30,
     'Mise en demeure',
     'Madame, Monsieur,' || E'\n\n' ||
     'Nonobstant notre rappel du {prev_date}, la somme de {outstanding} demeure impayée.' || E'\n\n' ||
     'Nous vous mettons en demeure de régulariser sous huitaine. À défaut, votre compte sera majoré des intérêts de retard au taux légal de {rate}% l''an, soit {interest}, ainsi que des frais de recouvrement forfaitaires de {penalty}.' || E'\n\n' ||
     'Total réclamé : {total}' || E'\n\n' ||
     'Conformément à l''article 2 de la loi du 18 avril 2004 sur le taux d''intérêt légal.' || E'\n\n' ||
     'Le syndic.',
     true, 5.75, 25.00, 25.00),
    (p_coownership_id, 3, 60,
     'Dernière mise en demeure avant action judiciaire',
     'Madame, Monsieur,' || E'\n\n' ||
     'Malgré nos relances précédentes, la somme de {total} reste due au syndicat de copropriété.' || E'\n\n' ||
     'Nous vous mettons en demeure ULTIME de régler ce montant sous huitaine. À défaut, le dossier sera transmis à notre conseil pour recouvrement judiciaire devant le Juge de Paix, conformément à la loi du 16 mai 1975 sur la copropriété.' || E'\n\n' ||
     'Les frais d''huissier et d''avocat seront intégralement à votre charge en sus des intérêts courus.' || E'\n\n' ||
     'Le syndic.',
     true, 5.75, 75.00, 50.00)
  on conflict (coownership_id, palier) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Trigger : seed auto des paliers à la création d'une copropriété
create or replace function coownerships_seed_reminders_trg() returns trigger language plpgsql as $$
begin
  perform seed_default_reminder_rules(new.id);
  return new;
end;
$$;
drop trigger if exists coownerships_seed_reminders on coownerships;
create trigger coownerships_seed_reminders after insert on coownerships
  for each row execute function coownerships_seed_reminders_trg();

-- Backfill immédiat pour les copropriétés existantes
do $$
declare r record;
begin
  for r in select id from coownerships loop
    perform seed_default_reminder_rules(r.id);
  end loop;
end $$;

-- ============================================================
-- Vue : charges impayées avec palier éligible
-- ============================================================

create or replace view coownership_unpaid_charges as
select
  ch.id as charge_id,
  ch.call_id,
  ch.unit_id,
  u.lot_number,
  u.owner_name,
  u.owner_email,
  c.coownership_id,
  c.label as call_label,
  c.due_date,
  ch.amount_due,
  ch.amount_paid,
  (ch.amount_due - ch.amount_paid) as amount_outstanding,
  (current_date - c.due_date)::int as days_late,
  -- Palier déjà atteint pour cette charge
  (select coalesce(max(r.palier), 0) from coownership_reminders r where r.charge_id = ch.id) as last_palier_sent,
  -- Palier théoriquement éligible selon les règles de la copropriété
  (
    select coalesce(max(rr.palier), 0)
    from coownership_reminder_rules rr
    where rr.coownership_id = c.coownership_id
      and rr.active = true
      and rr.days_after_due <= (current_date - c.due_date)::int
      and (ch.amount_due - ch.amount_paid) >= rr.min_amount_eur
  ) as eligible_palier
from coownership_unit_charges ch
join coownership_calls c on c.id = ch.call_id
join coownership_units u on u.id = ch.unit_id
where (ch.amount_due - ch.amount_paid) > 0
  and c.status in ('issued','partially_paid','overdue');

-- ============================================================
-- Fonctions utilitaires
-- ============================================================

-- Calcule les intérêts de retard à la date courante
-- Formule : outstanding × rate% × days / 365
create or replace function compute_late_interest(
  p_outstanding numeric,
  p_rate_pct numeric,
  p_days_late int
) returns numeric language sql immutable as $$
  select round((p_outstanding * p_rate_pct / 100.0 * p_days_late / 365.0)::numeric, 2);
$$;
