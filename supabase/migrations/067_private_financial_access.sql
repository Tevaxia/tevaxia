-- 067: private views obey RLS; exposed functions use least privilege.
-- No business rows are deleted. Original definitions/ACLs are retained privately.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE SCHEMA IF NOT EXISTS tevaxia_audit;
REVOKE ALL ON SCHEMA tevaxia_audit FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS tevaxia_audit.schema_backups (
  migration text PRIMARY KEY, captured_at timestamptz NOT NULL DEFAULT clock_timestamp(), snapshot jsonb NOT NULL
);
ALTER TABLE tevaxia_audit.schema_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA tevaxia_audit FROM PUBLIC, anon, authenticated;
INSERT INTO tevaxia_audit.schema_backups(migration,snapshot)
SELECT '067',jsonb_build_object(
 'functions',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),'acl',p.proacl)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'),
 'views',(SELECT jsonb_agg(jsonb_build_object('name',c.relname,'definition',pg_get_viewdef(c.oid,true),'options',c.reloptions,'acl',c.relacl)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v')
) ON CONFLICT (migration) DO NOTHING;

-- Public bearer-token entry points stay public; everything else needs a session.
DO $hardening$
DECLARE f record; v record;
BEGIN
 FOR v IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v' LOOP
   EXECUTE format('ALTER VIEW public.%I SET (security_invoker=true)',v.relname);
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure AS signature,p.proname,p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND p.prokind='f' LOOP
   IF f.proname NOT IN ('get_shared_link','post_shared_link_comment','get_tenant_portal_data','get_portal_data','post_portal_message','get_portal_account','portal_list_assembly_resolutions','portal_cast_vote','verify_signature','crm_calendar_feed') THEN
     EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',f.signature);
   ELSE
     EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC',f.signature);
     EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated',f.signature);
   END IF;
   IF f.proname IN ('purge_expired_rows','purge_expired_factur_x_history','reserve_ai_usage','get_user_items_cap','recalc_call_status') THEN
     EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated',f.signature);
     EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
   ELSIF NOT EXISTS (SELECT 1 FROM pg_proc p WHERE p.oid=f.signature::oid AND p.prorettype IN ('trigger'::regtype,'event_trigger'::regtype)) THEN
     EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);
   END IF;
   IF f.proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(f.proconfig) s WHERE s LIKE 'search_path=%' AND s NOT IN ('search_path=public','search_path=public, auth')) THEN
     EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public, pg_temp',f.signature);
   END IF;
 END LOOP;
END;
$hardening$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;

-- RLS on the underlying tables is authoritative for these business operations.
DO $invoker$
DECLARE f record;
BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('seed_accounting_chart','accounting_balance','close_accounting_year','seed_default_allocation_key','generate_charges_with_key','seed_default_reminder_rules','assembly_seed_votes','assembly_recompute_resolution','pms_folio_auto_post_room_charges','pms_settle_folio') LOOP
   EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER',f.signature);
 END LOOP;
END;
$invoker$;

CREATE OR REPLACE FUNCTION public.accounting_balance(p_coownership_id UUID, p_year INT)
RETURNS TABLE (
  account_id UUID,
  code TEXT,
  label TEXT,
  classe INT,
  account_type TEXT,
  total_debit NUMERIC,
  total_credit NUMERIC,
  balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.code,
    a.label,
    a.classe,
    a.account_type,
    COALESCE(SUM(l.debit) FILTER (WHERE e.id IS NOT NULL),  0)::NUMERIC AS total_debit,
    COALESCE(SUM(l.credit) FILTER (WHERE e.id IS NOT NULL), 0)::NUMERIC AS total_credit,
    (COALESCE(SUM(l.debit) FILTER (WHERE e.id IS NOT NULL),0) - COALESCE(SUM(l.credit) FILTER (WHERE e.id IS NOT NULL),0))::NUMERIC AS balance
  FROM accounting_accounts a
  LEFT JOIN accounting_entry_lines l ON l.account_id = a.id
  LEFT JOIN accounting_entries e ON e.id = l.entry_id AND e.coownership_id = a.coownership_id AND EXTRACT(YEAR FROM e.entry_date) = p_year
  WHERE a.coownership_id = p_coownership_id
  GROUP BY a.id, a.code, a.label, a.classe, a.account_type
  ORDER BY a.code;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp;

create or replace view public.coownership_budget_vs_actual with (security_invoker=true) as
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
      when e.id is null then 0
      when a.classe = 6 then l.debit - l.credit   -- charges = débit
      when a.classe = 7 then l.credit - l.debit   -- produits = crédit
      else l.debit - l.credit
    end
  ), 0) as amount_actual,
  b.amount_budgeted - coalesce(sum(
    case
      when e.id is null then 0
      when a.classe = 6 then l.debit - l.credit
      when a.classe = 7 then l.credit - l.debit
      else l.debit - l.credit
    end
  ), 0) as variance,
  case
    when b.amount_budgeted = 0 then null
    else round(coalesce(sum(
      case
        when e.id is null then 0
      when a.classe = 6 then l.debit - l.credit
        when a.classe = 7 then l.credit - l.debit
        else l.debit - l.credit
      end
    ), 0) / b.amount_budgeted * 100, 1)
  end as pct_consumed
from coownership_budget_lines b
join accounting_accounts a on a.id = b.account_id and a.coownership_id = b.coownership_id
left join accounting_entry_lines l on l.account_id = a.id
left join accounting_entries e on e.id = l.entry_id and e.coownership_id = b.coownership_id and extract(year from e.entry_date) = b.year
group by b.coownership_id, b.year, b.account_id, a.code, a.label, a.classe,
         b.amount_budgeted, b.allocation_key_id, b.nature;

-- ============================================================
-- 7. VUE : SOLDE PAR COPROPRIÉTAIRE (impayés)
-- ============================================================

create or replace view public.coownership_owner_balance with (security_invoker=true) as
select
  u.coownership_id,
  u.id as unit_id,
  u.lot_number,
  u.owner_name,
  count(ch.id) filter (where c.id is not null) as nb_charges,
  count(ch.id) filter (where c.id is not null and ch.amount_paid < ch.amount_due) as nb_unpaid,
  coalesce(sum(ch.amount_due) filter (where c.id is not null), 0) as total_due,
  coalesce(sum(ch.amount_paid) filter (where c.id is not null), 0) as total_paid,
  coalesce(sum(ch.amount_due - ch.amount_paid) filter (where c.id is not null), 0) as balance_outstanding,
  min(case when ch.amount_paid < ch.amount_due then c.due_date end) as oldest_unpaid_due_date
from coownership_units u
left join coownership_unit_charges ch on ch.unit_id = u.id
left join coownership_calls c on c.id = ch.call_id and c.coownership_id = u.coownership_id and c.status in ('issued','partially_paid','paid','overdue')
group by u.coownership_id, u.id, u.lot_number, u.owner_name;

COMMIT;
