-- Keep the deployed RPC bodies, hardening their bearer-token admission and scope.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
INSERT INTO tevaxia_audit.schema_backups(migration,snapshot)
SELECT '070',jsonb_build_object('functions',jsonb_agg(jsonb_build_object('definition',pg_get_functiondef(p.oid),'acl',p.proacl)))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('get_portal_data','get_portal_account','post_portal_message','portal_list_assembly_resolutions','portal_cast_vote')
ON CONFLICT(migration) DO NOTHING;

CREATE OR REPLACE FUNCTION public.lock_portal_token(p_token text)
RETURNS public.coownership_portal_tokens LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE t public.coownership_portal_tokens;
BEGIN
 IF p_token IS NULL OR length(p_token)>256 OR length(p_token)=0 THEN RETURN NULL; END IF;
 SELECT * INTO t FROM public.coownership_portal_tokens WHERE token=p_token FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 PERFORM 1 FROM public.coownerships WHERE id=t.coownership_id FOR SHARE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF t.unit_id IS NOT NULL THEN
   PERFORM 1 FROM public.coownership_units WHERE id=t.unit_id AND coownership_id=t.coownership_id FOR SHARE;
   IF NOT FOUND THEN RETURN NULL; END IF;
 END IF;
 IF t.revoked_at IS NOT NULL OR t.expires_at IS NULL OR t.expires_at<=clock_timestamp() THEN RETURN NULL; END IF;
 RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.lock_portal_token(text) FROM PUBLIC,anon,authenticated;

DO $migration$
DECLARE f record; body text; original text;
BEGIN
 FOR f IN SELECT p.oid,p.proname,pg_get_functiondef(p.oid) def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('get_portal_data','get_portal_account','post_portal_message','portal_list_assembly_resolutions','portal_cast_vote') LOOP
  body:=f.def;
  IF position('public.lock_portal_token(p_token)' IN body)>0 THEN CONTINUE; END IF;
  original:=body;
  body:=regexp_replace(body,'select\s+\*\s+into\s+v_token\s+from\s+(public\.)?coownership_portal_tokens\s+where\s+token\s*=\s*p_token\s+and\s+revoked_at\s+is\s+null\s+and\s+expires_at\s*>\s*now\(\)\s*;',
   'SELECT * INTO v_token FROM public.lock_portal_token(p_token) WHERE id IS NOT NULL;','i');
  IF body=original THEN RAISE EXCEPTION 'Unexpected portal token body: %',f.proname; END IF;
  body:=regexp_replace(body,'view_count\s*=\s*view_count\s*\+\s*1','view_count = least(view_count::bigint + 1, 2147483647)::int','gi');
  body:=regexp_replace(body,'last_viewed_at\s*=\s*now\(\)','last_viewed_at = clock_timestamp()','gi');
  IF f.proname='get_portal_data' THEN
   body:=regexp_replace(body,'WHERE coownership_id = v_token.coownership_id','WHERE coownership_id = v_token.coownership_id AND status IN (''convened'',''in_progress'',''closed'')','i');
   body:=regexp_replace(body,'WHERE uc.unit_id = v_token.unit_id','WHERE uc.unit_id = v_token.unit_id AND cc.coownership_id = v_token.coownership_id AND cc.status IN (''issued'',''partially_paid'',''paid'',''overdue'')','i');
   body:=regexp_replace(body,'uc.paid_at IS NOT NULL','uc.amount_paid >= uc.amount_due','i');
  ELSIF f.proname='get_portal_account' THEN
   body:=regexp_replace(body,'v_balance\s*:=\s*row\(0,\s*0,\s*0,\s*0\);','SELECT 0::numeric AS total_due,0::numeric AS total_paid,0::numeric AS outstanding,0::bigint AS nb_unpaid INTO v_balance;','i');
   body:=regexp_replace(body,'where ch.unit_id = v_unit.id','where ch.unit_id = v_unit.id AND c.coownership_id = v_token.coownership_id','gi');
   body:=regexp_replace(body,'where r.unit_id = v_unit.id','where r.unit_id = v_unit.id AND r.coownership_id = v_token.coownership_id','i');
  ELSIF f.proname='portal_list_assembly_resolutions' THEN
   body:=regexp_replace(body,'where id = p_assembly_id and coownership_id = v_token.coownership_id;','where id = p_assembly_id and coownership_id = v_token.coownership_id AND status IN (''convened'',''in_progress'',''closed'') FOR SHARE;','i');
  ELSIF f.proname='portal_cast_vote' THEN
   body:=regexp_replace(body,'if p_vote not in','if p_vote IS NULL OR p_vote not in','i');
   body:=regexp_replace(body,'where r.id = p_resolution_id and a.coownership_id = v_token.coownership_id;','where r.id = p_resolution_id and a.coownership_id = v_token.coownership_id FOR SHARE OF a FOR UPDATE OF r;','i');
   body:=regexp_replace(body,'if v_assembly.status = ''closed'' or v_assembly.status = ''cancelled'' then','if v_assembly.status NOT IN (''convened'',''in_progress'') then','i');
   body:=regexp_replace(body,'if v_assembly.status NOT IN', 'IF v_token.expires_at <= clock_timestamp() THEN RETURN jsonb_build_object(''error'',''invalid_token''); END IF;
  if v_assembly.status NOT IN','i');
  ELSIF f.proname='post_portal_message' THEN
   body:=regexp_replace(body,'SELECT owner_name INTO v_owner_name',
    'IF v_token.unit_id IS NULL THEN RETURN jsonb_build_object(''error'',''token_not_unit_specific''); END IF;
     IF p_body IS NULL OR length(trim(p_body))=0 OR length(p_body)>4000 OR p_subject IS NULL OR length(trim(p_subject))=0 OR length(p_subject)>200 THEN RETURN jsonb_build_object(''error'',''invalid_message''); END IF;
     IF EXISTS(SELECT 1 FROM coownership_messages WHERE author_portal_token=p_token AND created_at>clock_timestamp()-interval ''30 seconds'') THEN RETURN jsonb_build_object(''error'',''rate_limited''); END IF;
     SELECT owner_name INTO v_owner_name','i');
  END IF;
  IF f.proname='portal_cast_vote' AND (position('FOR UPDATE OF r' IN body)=0 OR position('v_token.expires_at <= clock_timestamp()' IN body)=0) THEN RAISE EXCEPTION 'Unexpected vote body'; END IF;
  IF f.proname='portal_list_assembly_resolutions' AND position('FOR SHARE;' IN body)=0 THEN RAISE EXCEPTION 'Unexpected assembly body'; END IF;
  IF f.proname='get_portal_account' AND position('AS nb_unpaid INTO v_balance' IN body)=0 THEN RAISE EXCEPTION 'Unexpected account body'; END IF;
  IF f.proname='get_portal_data' AND position('cc.coownership_id = v_token.coownership_id' IN body)=0 THEN RAISE EXCEPTION 'Unexpected portal data body'; END IF;
  IF f.proname='post_portal_message' AND position('rate_limited' IN body)=0 THEN RAISE EXCEPTION 'Unexpected message body'; END IF;
  EXECUTE body;
  EXECUTE format('ALTER FUNCTION %s SET search_path=pg_catalog,public,pg_temp',f.oid::regprocedure);
  EXECUTE format('ALTER FUNCTION %s SET lock_timeout=''5s''',f.oid::regprocedure);
 END LOOP;
END $migration$;

-- Reject malformed parent relationships at the authenticated write boundary.
DROP POLICY IF EXISTS portal_unit_scope ON public.coownership_portal_tokens;
CREATE POLICY portal_unit_scope ON public.coownership_portal_tokens AS RESTRICTIVE FOR ALL TO authenticated
 USING(unit_id IS NULL OR EXISTS(SELECT 1 FROM public.coownership_units u WHERE u.id=coownership_portal_tokens.unit_id AND u.coownership_id=coownership_portal_tokens.coownership_id))
 WITH CHECK(unit_id IS NULL OR EXISTS(SELECT 1 FROM public.coownership_units u WHERE u.id=coownership_portal_tokens.unit_id AND u.coownership_id=coownership_portal_tokens.coownership_id));
NOTIFY pgrst,'reload schema';
COMMIT;
