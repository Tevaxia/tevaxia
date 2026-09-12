-- Atomic journal entry creation, immutable closed years and exact charge allocations.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
INSERT INTO tevaxia_audit.schema_backups(migration,snapshot)
SELECT '069', jsonb_build_object('functions', (SELECT jsonb_agg(jsonb_build_object('definition',pg_get_functiondef(p.oid),'acl',p.proacl))
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('close_accounting_year','generate_charges_with_key')),
 'triggers',(SELECT jsonb_agg(pg_get_triggerdef(t.oid)) FROM pg_trigger t WHERE NOT t.tgisinternal AND t.tgrelid IN ('public.accounting_entries'::regclass,'public.accounting_entry_lines'::regclass,'public.coownership_accounting_years'::regclass)))
ON CONFLICT(migration) DO NOTHING;

CREATE OR REPLACE FUNCTION public.guard_accounting_year() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' AND NOT EXISTS(SELECT 1 FROM coownerships WHERE id=OLD.coownership_id) THEN RETURN OLD; END IF;
 IF TG_OP <> 'INSERT' AND OLD.status='closed' THEN RAISE EXCEPTION 'Closed accounting year is immutable'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW.year < 1900 OR NEW.year > 9999 THEN RAISE EXCEPTION 'Invalid accounting year'; END IF;
 IF TG_OP='UPDATE' AND (NEW.coownership_id,NEW.year) IS DISTINCT FROM (OLD.coownership_id,OLD.year)
 AND EXISTS(SELECT 1 FROM accounting_entries WHERE year_id=OLD.id) THEN RAISE EXCEPTION 'Accounting year identity is immutable'; END IF;
 IF NEW.status='closed' AND (TG_OP='INSERT' OR OLD.status='open') THEN
   IF EXISTS(SELECT 1 FROM accounting_entries e LEFT JOIN accounting_entry_lines l ON l.entry_id=e.id WHERE e.year_id=NEW.id GROUP BY e.id
     HAVING count(l.id)<2 OR coalesce(sum(l.debit),0)=0 OR sum(l.debit)<>sum(l.credit)) THEN RAISE EXCEPTION 'Unbalanced accounting year'; END IF;
   -- Direct REST closure and RPC closure obey the same validation/locking rules.
   UPDATE accounting_entries SET is_locked=true WHERE year_id=NEW.id AND NOT is_locked;
   NEW.closed_at := coalesce(NEW.closed_at,clock_timestamp());
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_accounting_entry() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE y coownership_accounting_years; target uuid;
BEGIN
 target:=CASE WHEN TG_OP='DELETE' THEN OLD.year_id ELSE NEW.year_id END;
 IF TG_OP='UPDATE' AND (NEW.year_id,NEW.coownership_id) IS DISTINCT FROM (OLD.year_id,OLD.coownership_id) THEN RAISE EXCEPTION 'Accounting entry identity is immutable'; END IF;
 SELECT * INTO y FROM coownership_accounting_years WHERE id=target FOR UPDATE;
 IF NOT FOUND THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF;
   RAISE EXCEPTION 'Accounting year unavailable';
 END IF;
 IF y.status<>'open' OR (TG_OP<>'INSERT' AND OLD.is_locked) THEN RAISE EXCEPTION 'Accounting entry is locked'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW.coownership_id<>y.coownership_id OR extract(year FROM NEW.entry_date)<>y.year THEN RAISE EXCEPTION 'Accounting entry outside its year'; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_accounting_line() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE e accounting_entries; y coownership_accounting_years; target uuid;
BEGIN
 target:=CASE WHEN TG_OP='DELETE' THEN OLD.entry_id ELSE NEW.entry_id END;
 IF TG_OP='UPDATE' AND NEW.entry_id<>OLD.entry_id THEN RAISE EXCEPTION 'Accounting line identity is immutable'; END IF;
 SELECT * INTO e FROM accounting_entries WHERE id=target;
 IF NOT FOUND THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF;
   RAISE EXCEPTION 'Accounting entry unavailable';
 END IF;
 SELECT * INTO y FROM coownership_accounting_years WHERE id=e.year_id FOR UPDATE;
 SELECT * INTO e FROM accounting_entries WHERE id=target FOR UPDATE;
 IF e.id IS NULL OR y.id IS NULL OR y.status<>'open' OR e.is_locked THEN RAISE EXCEPTION 'Accounting entry is locked'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 PERFORM 1 FROM accounting_accounts a WHERE a.id=NEW.account_id AND a.coownership_id=e.coownership_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Accounting account outside entry scope'; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.require_balanced_accounting_lines() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE target uuid; d numeric; c numeric; n bigint;
BEGIN
 target:=CASE WHEN TG_OP='DELETE' THEN OLD.entry_id ELSE NEW.entry_id END;
 IF NOT EXISTS(SELECT 1 FROM accounting_entries WHERE id=target) THEN RETURN NULL; END IF;
 SELECT sum(debit),sum(credit),count(*) INTO d,c,n FROM accounting_entry_lines WHERE entry_id=target;
 IF n<2 OR d=0 OR d<>c THEN RAISE EXCEPTION 'Accounting entry must have balanced nonzero debit and credit'; END IF;
 RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.guard_accounting_account() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
 PERFORM 1 FROM coownership_accounting_years y WHERE EXISTS(SELECT 1 FROM accounting_entries e JOIN accounting_entry_lines l ON l.entry_id=e.id WHERE l.account_id=OLD.id AND e.year_id=y.id) ORDER BY y.id FOR UPDATE;
 IF NEW.coownership_id<>OLD.coownership_id AND EXISTS(SELECT 1 FROM accounting_entry_lines WHERE account_id=OLD.id) THEN RAISE EXCEPTION 'Referenced account scope is immutable'; END IF;
 IF (NEW.code,NEW.classe,NEW.account_type) IS DISTINCT FROM (OLD.code,OLD.classe,OLD.account_type)
 AND EXISTS(SELECT 1 FROM accounting_entry_lines l JOIN accounting_entries e ON e.id=l.entry_id JOIN coownership_accounting_years y ON y.id=e.year_id WHERE l.account_id=OLD.id AND (e.is_locked OR y.status='closed')) THEN RAISE EXCEPTION 'Closed accounting classification is immutable'; END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS accounting_year_guard ON public.coownership_accounting_years;
CREATE TRIGGER accounting_year_guard BEFORE INSERT OR UPDATE OR DELETE ON public.coownership_accounting_years FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_year();
DROP TRIGGER IF EXISTS accounting_entry_guard ON public.accounting_entries;
CREATE TRIGGER accounting_entry_guard BEFORE INSERT OR UPDATE OR DELETE ON public.accounting_entries FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_entry();
DROP TRIGGER IF EXISTS accounting_line_guard ON public.accounting_entry_lines;
CREATE TRIGGER accounting_line_guard BEFORE INSERT OR UPDATE OR DELETE ON public.accounting_entry_lines FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_line();
DROP TRIGGER IF EXISTS accounting_lines_balanced ON public.accounting_entry_lines;
CREATE CONSTRAINT TRIGGER accounting_lines_balanced AFTER INSERT OR UPDATE OR DELETE ON public.accounting_entry_lines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.require_balanced_accounting_lines();
DROP TRIGGER IF EXISTS accounting_account_guard ON public.accounting_accounts;
CREATE TRIGGER accounting_account_guard BEFORE UPDATE ON public.accounting_accounts FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_account();

CREATE OR REPLACE FUNCTION public.create_accounting_entry(p_entry jsonb, p_lines jsonb)
RETURNS public.accounting_entries LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE e accounting_entries; d numeric; c numeric; n int;
BEGIN
 IF auth.uid() IS NULL OR NOT public.session_has_required_aal() THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF jsonb_typeof(p_lines) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid accounting lines'; END IF;
 IF jsonb_array_length(p_lines)<2 OR jsonb_array_length(p_lines)>1000 THEN RAISE EXCEPTION 'Invalid accounting line count'; END IF;
 SELECT sum(debit),sum(credit),count(*) INTO d,c,n FROM jsonb_to_recordset(p_lines) AS l(debit numeric,credit numeric)
 WHERE debit>=0 AND credit>=0 AND (debit=0 OR credit=0) AND debit=round(debit,2) AND credit=round(credit,2);
 IF n<>jsonb_array_length(p_lines) OR d IS NULL OR d<=0 OR d<>c OR d::text IN ('NaN','Infinity') THEN RAISE EXCEPTION 'Invalid or unbalanced accounting lines'; END IF;
 INSERT INTO accounting_entries(id,coownership_id,year_id,entry_date,reference,label,journal_code,created_by,source_type,source_id)
 VALUES(coalesce((p_entry->>'id')::uuid,gen_random_uuid()),(p_entry->>'coownership_id')::uuid,(p_entry->>'year_id')::uuid,(p_entry->>'entry_date')::date,p_entry->>'reference',p_entry->>'label',coalesce(p_entry->>'journal_code','OD'),auth.uid(),p_entry->>'source_type',(p_entry->>'source_id')::uuid) RETURNING * INTO e;
 INSERT INTO accounting_entry_lines(entry_id,account_id,debit,credit,line_label)
 SELECT e.id,l.account_id,l.debit,l.credit,l.line_label FROM jsonb_to_recordset(p_lines) AS l(account_id uuid,debit numeric,credit numeric,line_label text);
 RETURN e;
END $$;
REVOKE ALL ON FUNCTION public.create_accounting_entry(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_accounting_entry(jsonb,jsonb) TO authenticated;

-- Restore a complete year atomically. Existing closed history is never overwritten.
CREATE OR REPLACE FUNCTION public.restore_accounting_year(p_year jsonb,p_entries jsonb,p_lines jsonb,p_skip_existing boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE y coownership_accounting_years; item jsonb; lines jsonb; restored int:=0; skipped int:=0; line_count int:=0; e accounting_entries;
BEGIN
 IF auth.uid() IS NULL OR NOT public.session_has_required_aal() THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF jsonb_typeof(p_entries) IS DISTINCT FROM 'array' OR jsonb_typeof(p_lines) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid accounting backup'; END IF;
 IF jsonb_array_length(p_entries)>5000 OR jsonb_array_length(p_lines)>100000 THEN RAISE EXCEPTION 'Accounting backup exceeds transaction limit'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_entries) j WHERE (j->>'year_id') IS DISTINCT FROM (p_year->>'id') OR (j->>'coownership_id') IS DISTINCT FROM (p_year->>'coownership_id') OR j->>'id' IS NULL)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_lines) l WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_entries) j WHERE j->>'id'=l->>'entry_id')) THEN RAISE EXCEPTION 'Accounting backup scope mismatch'; END IF;
 SELECT * INTO y FROM coownership_accounting_years WHERE id=(p_year->>'id')::uuid FOR UPDATE;
 IF FOUND THEN
   IF y.coownership_id<>(p_year->>'coownership_id')::uuid OR y.year<>(p_year->>'year')::int THEN RAISE EXCEPTION 'Accounting backup year mismatch'; END IF;
   IF y.status='closed' THEN
     IF NOT p_skip_existing THEN RAISE EXCEPTION 'Closed accounting year is immutable'; END IF;
     RETURN jsonb_build_object('entries_imported',0,'entries_skipped',jsonb_array_length(p_entries),'lines_imported',0,'year_imported',0,'year_skipped',1);
   END IF;
 ELSE
   INSERT INTO coownership_accounting_years(id,coownership_id,year,status,created_by,opened_at,closing_notes)
   VALUES((p_year->>'id')::uuid,(p_year->>'coownership_id')::uuid,(p_year->>'year')::int,'open',auth.uid(),coalesce((p_year->>'opened_at')::timestamptz,clock_timestamp()),p_year->>'closing_notes') RETURNING * INTO y;
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
   SELECT * INTO e FROM accounting_entries WHERE id=(item->>'id')::uuid FOR UPDATE;
   IF FOUND THEN
     IF e.year_id<>y.id THEN RAISE EXCEPTION 'Accounting backup entry mismatch'; END IF;
     IF p_skip_existing THEN skipped:=skipped+1; CONTINUE; END IF;
     DELETE FROM accounting_entries WHERE id=e.id;
   END IF;
   SELECT coalesce(jsonb_agg(l),'[]') INTO lines FROM jsonb_array_elements(p_lines) l WHERE l->>'entry_id'=item->>'id';
   PERFORM public.create_accounting_entry(item,lines);
   IF (item->>'is_locked')::boolean THEN UPDATE accounting_entries SET is_locked=true WHERE id=(item->>'id')::uuid; END IF;
   restored:=restored+1; line_count:=line_count+jsonb_array_length(lines);
 END LOOP;
 IF p_year->>'status'='closed' THEN UPDATE coownership_accounting_years SET status='closed',closed_at=(p_year->>'closed_at')::timestamptz WHERE id=y.id; END IF;
 RETURN jsonb_build_object('entries_imported',restored,'entries_skipped',skipped,'lines_imported',line_count,'year_imported',1,'year_skipped',0);
END $$;
REVOKE ALL ON FUNCTION public.restore_accounting_year(jsonb,jsonb,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.restore_accounting_year(jsonb,jsonb,jsonb,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_accounting_year(p_year_id uuid)
RETURNS TABLE(result_amount numeric) LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE y coownership_accounting_years; result numeric;
BEGIN
 SELECT * INTO y FROM coownership_accounting_years WHERE id=p_year_id FOR UPDATE;
 IF NOT FOUND OR y.status<>'open' THEN RAISE EXCEPTION 'Accounting year unavailable or already closed'; END IF;
 SELECT coalesce(sum(CASE WHEN a.classe IN (6,7) THEN l.credit-l.debit ELSE 0 END),0) INTO result
 FROM accounting_entries e JOIN accounting_entry_lines l ON l.entry_id=e.id JOIN accounting_accounts a ON a.id=l.account_id AND a.coownership_id=e.coownership_id WHERE e.year_id=y.id;
 UPDATE coownership_accounting_years SET status='closed' WHERE id=y.id;
 RETURN QUERY SELECT result;
END $$;

CREATE OR REPLACE FUNCTION public.generate_charges_with_key(p_call_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE c coownership_calls; v_key_id uuid; n int;
BEGIN
 SELECT * INTO c FROM coownership_calls WHERE id=p_call_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Fund call unavailable'; END IF;
 IF c.status<>'draft' THEN RAISE EXCEPTION 'Only draft fund calls can be regenerated'; END IF;
 IF c.total_amount IS NULL OR c.total_amount<=0 OR c.total_amount::text IN ('NaN','Infinity') THEN RAISE EXCEPTION 'Invalid fund call amount'; END IF;
 v_key_id:=c.allocation_key_id;
 IF v_key_id IS NULL THEN SELECT k.id INTO v_key_id FROM coownership_allocation_keys k WHERE k.coownership_id=c.coownership_id AND k.code='tantiemes_generaux'; END IF;
 PERFORM 1 FROM coownership_allocation_keys k WHERE k.id=v_key_id AND k.coownership_id=c.coownership_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Allocation key outside fund call scope'; END IF;
 IF EXISTS(SELECT 1 FROM coownership_unit_allocations a WHERE a.key_id=v_key_id AND a.shares::text IN ('NaN','Infinity','-Infinity')) THEN RAISE EXCEPTION 'Invalid allocation shares'; END IF;
 PERFORM 1 FROM coownership_unit_charges WHERE call_id=c.id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM coownership_unit_charges WHERE call_id=c.id AND (amount_paid<>0 OR paid_at IS NOT NULL)) THEN RAISE EXCEPTION 'Paid charges cannot be regenerated'; END IF;
 IF NOT EXISTS(SELECT 1 FROM coownership_unit_allocations a JOIN coownership_units u ON u.id=a.unit_id WHERE a.key_id=v_key_id AND u.coownership_id=c.coownership_id AND a.shares>0) THEN RAISE EXCEPTION 'Allocation key has no shares'; END IF;
 DELETE FROM coownership_unit_charges WHERE call_id=c.id;
 -- One statement snapshot: exact total shares and deterministic distribution of residual cents.
 WITH shares AS (SELECT u.id,u.lot_number,a.shares FROM coownership_unit_allocations a JOIN coownership_units u ON u.id=a.unit_id WHERE a.key_id=v_key_id AND u.coownership_id=c.coownership_id AND a.shares>0),
 exact AS (SELECT *,round(c.total_amount*100)*shares/sum(shares) OVER() AS cents FROM shares),
 ranked AS (SELECT *,floor(cents) AS base,row_number() OVER(ORDER BY cents-floor(cents) DESC,id) AS rank,round(c.total_amount*100)-sum(floor(cents)) OVER() AS remainder FROM exact)
 INSERT INTO coownership_unit_charges(call_id,unit_id,amount_due,amount_paid,payment_reference)
 SELECT c.id,id,(base+CASE WHEN rank<=remainder THEN 1 ELSE 0 END)/100,0,replace(replace(coalesce(c.payment_reference_template,'COPRO-{lot}-{period}'),'{lot}',lot_number),'{period}',to_char(c.period_start,'YYYY-MM')) FROM ranked;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n=0 THEN RAISE EXCEPTION 'Allocation key has no shares'; END IF;
 RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.guard_accounting_year(),public.guard_accounting_entry(),public.guard_accounting_line(),public.require_balanced_accounting_lines(),public.guard_accounting_account() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
