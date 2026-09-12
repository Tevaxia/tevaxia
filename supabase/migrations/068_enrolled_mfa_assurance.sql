-- Deploy the MFA challenge UI BEFORE applying this migration.
-- MFA is optional. A verified factor makes AAL2 mandatory for private data.
BEGIN;
SET LOCAL lock_timeout = '5s';
INSERT INTO tevaxia_audit.schema_backups(migration,snapshot)
SELECT '068',jsonb_build_object(
 'functions',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),'acl',p.proacl)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'),
 'policies',(SELECT jsonb_agg(to_jsonb(p)) FROM pg_policies p WHERE schemaname IN ('public','storage'))
) ON CONFLICT (migration) DO NOTHING;

CREATE OR REPLACE FUNCTION public.session_has_required_aal()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND (
   COALESCE(auth.jwt()->>'aal' = 'aal2',false)
   OR NOT EXISTS (SELECT 1 FROM auth.mfa_factors f WHERE f.user_id=auth.uid() AND f.status='verified')
 );
$$;
REVOKE ALL ON FUNCTION public.session_has_required_aal() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.session_has_required_aal() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.assert_session_aal()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 -- Server jobs have no end-user identity. Their existing service-role ACLs apply.
 IF auth.uid() IS NOT NULL AND NOT public.session_has_required_aal() THEN
   RAISE EXCEPTION 'MFA verification required' USING ERRCODE='42501';
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_session_aal() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_session_aal() TO authenticated, service_role;

DO $policies$
DECLARE r record;
BEGIN
 FOR r IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind IN ('r','p') AND c.relrowsecurity
 AND (n.nspname='public' OR (n.nspname='storage' AND c.relname='objects')) LOOP
   EXECUTE format('DROP POLICY IF EXISTS enrolled_mfa_guard ON %I.%I',r.nspname,r.relname);
   EXECUTE format('CREATE POLICY enrolled_mfa_guard ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.session_has_required_aal())) WITH CHECK ((SELECT public.session_has_required_aal()))',r.nspname,r.relname);
 END LOOP;
END;
$policies$;

-- These organization helpers also serve SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT public.session_has_required_aal() AND EXISTS (
   SELECT 1 FROM public.org_members m WHERE m.org_id=p_org_id AND m.user_id=auth.uid()
 );
$$;
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT public.session_has_required_aal() AND EXISTS (
   SELECT 1 FROM public.org_members m WHERE m.org_id=p_org_id AND m.user_id=auth.uid() AND m.role='admin'
 );
$$;

-- Preserve production bodies while adding an AAL check at their entry point.
-- Explicit list excludes public bearer links, trigger handlers and machine API quotas.
DO $rpc$
DECLARE f record; definition text; guarded text;
BEGIN
 FOR f IN SELECT p.oid,p.proname,p.prosrc,l.lanname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
 WHERE n.nspname='public' AND p.proname IN (
   'create_organization','accept_invitation','delete_my_account','org_agency_stats',
   'api_usage_daily','crm_kanban_mandates','get_shared_link_timeline','list_shared_link_comments',
   'pms_availability','pms_next_invoice_number','pms_next_reservation_number','pms_run_night_audit','pms_external_calendar_stats'
 ) LOOP
   IF f.lanname <> 'plpgsql' THEN RAISE EXCEPTION 'Review required: unexpected language for %',f.proname; END IF;
   IF position('PERFORM public.assert_session_aal();' IN f.prosrc) > 0 THEN CONTINUE; END IF;
   definition := pg_get_functiondef(f.oid);
   guarded := regexp_replace(f.prosrc,'\mBEGIN\M','BEGIN' || chr(10) || ' PERFORM public.assert_session_aal();','i');
   IF guarded=f.prosrc THEN RAISE EXCEPTION 'Review required: no BEGIN in %',f.proname; END IF;
   EXECUTE replace(definition,f.prosrc,guarded);
 END LOOP;
END;
$rpc$;
NOTIFY pgrst, 'reload schema';
COMMIT;
