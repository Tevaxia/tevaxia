BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
INSERT INTO tevaxia_audit.schema_backups(migration,snapshot)
SELECT '072',jsonb_build_object('functions',jsonb_agg(pg_get_functiondef(p.oid))) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN('allocation_key_refresh_total','pms_run_night_audit') ON CONFLICT(migration) DO NOTHING;

-- Install the missing 057 backup log with owner scope and enrolled MFA.
CREATE TABLE IF NOT EXISTS public.backup_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,module text NOT NULL,destination text NOT NULL CHECK(destination IN('download','drive')),counts jsonb NOT NULL DEFAULT '{}',drive_file_id text,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_backup_history_user_created ON public.backup_history(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_user_module ON public.backup_history(user_id,module,created_at DESC);
DROP POLICY IF EXISTS backup_history_own_select ON public.backup_history;
DROP POLICY IF EXISTS backup_history_own_insert ON public.backup_history;
DROP POLICY IF EXISTS backup_history_own_delete ON public.backup_history;
DROP POLICY IF EXISTS enrolled_mfa_required ON public.backup_history;
CREATE POLICY backup_history_own_select ON public.backup_history FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY backup_history_own_insert ON public.backup_history FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY backup_history_own_delete ON public.backup_history FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE POLICY enrolled_mfa_required ON public.backup_history AS RESTRICTIVE FOR ALL TO authenticated USING(public.session_has_required_aal()) WITH CHECK(public.session_has_required_aal());
REVOKE ALL ON public.backup_history FROM anon;
GRANT SELECT,INSERT,DELETE ON public.backup_history TO authenticated;

CREATE OR REPLACE FUNCTION public.coownership_parent_scope_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE d jsonb:=to_jsonb(NEW); scope uuid:=(d->>'coownership_id')::uuid; related uuid; parent_id uuid; col text; tbl text;
BEGIN
 IF TG_OP='UPDATE' AND d->>'coownership_id' IS DISTINCT FROM to_jsonb(OLD)->>'coownership_id' THEN RAISE EXCEPTION 'Coownership scope is immutable'; END IF;
 IF TG_TABLE_NAME='assembly_votes' AND TG_OP='UPDATE' AND d->>'resolution_id' IS DISTINCT FROM to_jsonb(OLD)->>'resolution_id' THEN RAISE EXCEPTION 'Vote resolution is immutable'; END IF;
 FOREACH col IN ARRAY ARRAY['unit_id','proxy_from_unit_id','key_id','allocation_key_id','call_id','assembly_id','resolution_id','account_id','charge_id','thread_id','project_id'] LOOP
  parent_id:=(d->>col)::uuid; IF parent_id IS NULL THEN CONTINUE; END IF;
  IF col='resolution_id' THEN
   SELECT a.coownership_id INTO related FROM assembly_resolutions r JOIN coownership_assemblies a ON a.id=r.assembly_id WHERE r.id=parent_id FOR SHARE OF a;
  ELSIF col='charge_id' THEN
   SELECT c.coownership_id INTO related FROM coownership_unit_charges u JOIN coownership_calls c ON c.id=u.call_id WHERE u.id=parent_id FOR SHARE OF c;
  ELSE
   tbl:=CASE col WHEN 'unit_id' THEN 'coownership_units' WHEN 'proxy_from_unit_id' THEN 'coownership_units' WHEN 'key_id' THEN 'coownership_allocation_keys' WHEN 'allocation_key_id' THEN 'coownership_allocation_keys' WHEN 'call_id' THEN 'coownership_calls' WHEN 'assembly_id' THEN 'coownership_assemblies' WHEN 'account_id' THEN 'accounting_accounts' WHEN 'thread_id' THEN 'coownership_threads' WHEN 'project_id' THEN 'works_projects' END;
   EXECUTE format('SELECT coownership_id FROM public.%I WHERE id=$1 FOR SHARE',tbl) INTO related USING parent_id;
  END IF;
  IF related IS NULL THEN RAISE EXCEPTION 'Coownership parent unavailable'; END IF;
  IF scope IS NULL THEN scope:=related; END IF;
  IF scope IS DISTINCT FROM related THEN RAISE EXCEPTION 'Related record outside coownership scope'; END IF;
 END LOOP;
 IF TG_TABLE_NAME='coownership_reminders' AND NOT EXISTS(SELECT 1 FROM coownership_unit_charges WHERE id=(d->>'charge_id')::uuid AND unit_id=(d->>'unit_id')::uuid) THEN RAISE EXCEPTION 'Reminder charge belongs to another unit'; END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['coownership_units','coownership_allocation_keys','coownership_unit_allocations','coownership_calls','coownership_unit_charges','coownership_budget_lines','coownership_assemblies','assembly_resolutions','assembly_votes','coownership_reminders','coownership_threads','coownership_messages','works_projects','works_quotes','works_invoices'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS a0_coownership_parent_scope ON public.%I',t);
  EXECUTE format('CREATE TRIGGER a0_coownership_parent_scope BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.coownership_parent_scope_guard()',t);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.allocation_key_lock() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 PERFORM 1 FROM coownership_allocation_keys WHERE id IN(NEW.key_id,OLD.key_id) ORDER BY id FOR UPDATE;
 IF TG_OP<>'DELETE' AND NEW.shares::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid allocation shares'; END IF;
 RETURN coalesce(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS a00_allocation_key_lock ON public.coownership_unit_allocations;
CREATE TRIGGER a00_allocation_key_lock BEFORE INSERT OR UPDATE OR DELETE ON public.coownership_unit_allocations FOR EACH ROW EXECUTE FUNCTION public.allocation_key_lock();
CREATE OR REPLACE FUNCTION public.allocation_key_refresh_total() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 UPDATE coownership_allocation_keys k SET total_shares=coalesce((SELECT sum(shares) FROM coownership_unit_allocations WHERE key_id=k.id),0),updated_at=clock_timestamp() WHERE id IN(NEW.key_id,OLD.key_id);
 RETURN coalesce(NEW,OLD);
END $$;
CREATE OR REPLACE FUNCTION public.assembly_vote_lock() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE rid uuid:=coalesce(NEW.resolution_id,OLD.resolution_id); state text;
BEGIN
 SELECT a.status INTO state FROM assembly_resolutions r JOIN coownership_assemblies a ON a.id=r.assembly_id WHERE r.id=rid FOR SHARE OF a;
 IF state IN('closed','cancelled') THEN RAISE EXCEPTION 'Assembly voting is closed'; END IF;
 PERFORM 1 FROM assembly_resolutions WHERE id=rid FOR UPDATE;
 RETURN coalesce(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS a00_assembly_vote_lock ON public.assembly_votes;
CREATE TRIGGER a00_assembly_vote_lock BEFORE INSERT OR UPDATE OR DELETE ON public.assembly_votes FOR EACH ROW EXECUTE FUNCTION public.assembly_vote_lock();
REVOKE ALL ON FUNCTION public.coownership_parent_scope_guard(),public.allocation_key_lock(),public.assembly_vote_lock() FROM PUBLIC,anon,authenticated;
-- Historical occupancy must retain checked-out stays; stayovers count room lines.
DO $migration$ DECLARE f text; BEGIN
 SELECT pg_get_functiondef('public.pms_run_night_audit(uuid,date)'::regprocedure) INTO f;
 f:=replace(f,'''confirmed'',''checked_in'')','''confirmed'',''checked_in'',''checked_out'')');
 f:=replace(f,'v_stayovers := greatest(0, v_occupied - v_arrivals);','SELECT count(*) INTO v_stayovers FROM pms_reservations res JOIN pms_reservation_rooms rr ON rr.reservation_id=res.id WHERE res.property_id=p_property_id AND res.status IN (''confirmed'',''checked_in'',''checked_out'') AND p_date>res.check_in AND p_date<res.check_out;');
 IF position('PMS_CURRENCY_072' IN f)=0 THEN
  f:=regexp_replace(f,'begin','BEGIN /* PMS_CURRENCY_072 */
   IF NOT public.session_has_required_aal() OR NOT EXISTS(SELECT 1 FROM pms_properties WHERE id=p_property_id AND user_id=auth.uid()) THEN RAISE EXCEPTION ''unauthorized''; END IF;
   IF EXISTS(SELECT 1 FROM pms_reservations r JOIN pms_properties p ON p.id=r.property_id WHERE r.property_id=p_property_id AND r.status IN(''confirmed'',''checked_in'',''checked_out'') AND p_date>=r.check_in AND p_date<r.check_out AND r.currency IS DISTINCT FROM p.currency) THEN RAISE EXCEPTION ''Mixed currencies require conversion before a night audit''; END IF;','i');
 END IF;
 IF position('greatest(0, v_occupied - v_arrivals)' IN f)>0 THEN RAISE EXCEPTION 'Unexpected night audit definition'; END IF;
 EXECUTE f;
END $migration$;

NOTIFY pgrst,'reload schema';
COMMIT;
