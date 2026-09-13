BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
INSERT INTO tevaxia_audit.schema_backups(migration,snapshot)
SELECT '071',jsonb_build_object('functions',jsonb_agg(jsonb_build_object('definition',pg_get_functiondef(p.oid),'acl',p.proacl)))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('pms_settle_folio','pms_folio_auto_post_room_charges','pms_invoice_immutable','pms_open_folio_on_checkin','pms_folio_charge_compute')
ON CONFLICT(migration) DO NOTHING;
ALTER TABLE public.pms_invoices ADD COLUMN IF NOT EXISTS tax_breakdown jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.pms_invoices ALTER COLUMN hebergement_tva_rate DROP NOT NULL,
 ALTER COLUMN fb_tva_rate DROP NOT NULL, ALTER COLUMN other_tva_rate DROP NOT NULL;
ALTER TABLE public.pms_folio_charges ADD COLUMN IF NOT EXISTS agreed_ttc numeric(12,2);

-- Provision the missing 055 module atomically with its access protections.
DO $$ BEGIN CREATE TYPE pms_group_status AS ENUM('prospect','tentative','confirmed','partially_booked','complete','cancelled','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pms_group_billing_mode AS ENUM('master_account','individual','split'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.pms_groups(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid NOT NULL REFERENCES pms_properties(id) ON DELETE CASCADE,
 code text NOT NULL,name text NOT NULL,status pms_group_status NOT NULL DEFAULT 'prospect',organizer_name text NOT NULL,
 organizer_email text,organizer_phone text,organizer_company text,check_in date NOT NULL,check_out date NOT NULL,
 nb_nights smallint GENERATED ALWAYS AS(greatest(1,check_out-check_in)) STORED,rooms_blocked smallint NOT NULL CHECK(rooms_blocked>0),rooms_booked smallint NOT NULL DEFAULT 0,
 negotiated_rate numeric(10,2),total_expected_revenue numeric(12,2),billing_mode pms_group_billing_mode NOT NULL DEFAULT 'individual',
 deposit_required numeric(12,2),deposit_paid numeric(12,2) NOT NULL DEFAULT 0,deposit_due_date date,cutoff_date date,cancellation_policy text,notes text,
 has_meeting_room boolean NOT NULL DEFAULT false,meeting_room_setup text,meeting_room_capacity smallint,fb_package text,
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(check_out>check_in),UNIQUE(property_id,code));
ALTER TABLE public.pms_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pms_groups_crud_via_prop ON public.pms_groups;
CREATE POLICY pms_groups_crud_via_prop ON public.pms_groups FOR ALL TO authenticated
 USING(EXISTS(SELECT 1 FROM pms_properties p WHERE p.id=property_id AND p.user_id=auth.uid()))
 WITH CHECK(EXISTS(SELECT 1 FROM pms_properties p WHERE p.id=property_id AND p.user_id=auth.uid()));
DROP POLICY IF EXISTS pms_groups_org_rw ON public.pms_groups;
CREATE POLICY pms_groups_org_rw ON public.pms_groups FOR ALL TO authenticated
 USING(EXISTS(SELECT 1 FROM pms_properties p JOIN org_members m ON m.org_id=p.org_id WHERE p.id=property_id AND m.user_id=auth.uid() AND m.role IN('admin','member')))
 WITH CHECK(EXISTS(SELECT 1 FROM pms_properties p JOIN org_members m ON m.org_id=p.org_id WHERE p.id=property_id AND m.user_id=auth.uid() AND m.role IN('admin','member')));
DROP POLICY IF EXISTS enrolled_mfa_required ON public.pms_groups;
CREATE POLICY enrolled_mfa_required ON public.pms_groups AS RESTRICTIVE FOR ALL TO authenticated USING(public.session_has_required_aal()) WITH CHECK(public.session_has_required_aal());
REVOKE ALL ON public.pms_groups FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.pms_groups TO authenticated;
ALTER TABLE public.pms_reservations ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.pms_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS pms_res_group_idx ON public.pms_reservations(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pms_groups_prop_idx ON public.pms_groups(property_id,status);
CREATE INDEX IF NOT EXISTS pms_groups_dates_idx ON public.pms_groups(property_id,check_in,check_out);
DROP TRIGGER IF EXISTS pms_groups_touch ON public.pms_groups;
CREATE TRIGGER pms_groups_touch BEFORE UPDATE ON public.pms_groups FOR EACH ROW EXECUTE FUNCTION public.pms_touch();
CREATE OR REPLACE FUNCTION public.pms_group_lock() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 PERFORM 1 FROM pms_groups WHERE id IN(NEW.group_id,OLD.group_id) ORDER BY id FOR UPDATE;
 RETURN coalesce(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS a0_pms_group_lock ON public.pms_reservations;
CREATE TRIGGER a0_pms_group_lock BEFORE INSERT OR UPDATE OR DELETE ON public.pms_reservations FOR EACH ROW EXECUTE FUNCTION public.pms_group_lock();
CREATE OR REPLACE FUNCTION public.pms_group_sync_rooms_booked() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 UPDATE pms_groups g SET rooms_booked=(SELECT count(*) FROM pms_reservations WHERE group_id=g.id AND status IN('confirmed','checked_in','checked_out')),updated_at=clock_timestamp()
 WHERE id IN(NEW.group_id,OLD.group_id);
 UPDATE pms_groups SET status=CASE WHEN rooms_booked=0 THEN 'confirmed'::pms_group_status WHEN rooms_booked<rooms_blocked THEN 'partially_booked'::pms_group_status ELSE 'complete'::pms_group_status END
 WHERE id IN(NEW.group_id,OLD.group_id) AND status IN('confirmed','partially_booked','complete');
 RETURN coalesce(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS pms_res_group_sync ON public.pms_reservations;
CREATE TRIGGER pms_res_group_sync AFTER INSERT OR UPDATE OR DELETE ON public.pms_reservations FOR EACH ROW EXECUTE FUNCTION public.pms_group_sync_rooms_booked();
CREATE OR REPLACE FUNCTION public.pms_next_group_code(p_property_id uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.session_has_required_aal() OR NOT EXISTS(SELECT 1 FROM pms_properties p WHERE p.id=p_property_id AND (p.user_id=auth.uid() OR EXISTS(SELECT 1 FROM org_members m WHERE m.org_id=p.org_id AND m.user_id=auth.uid() AND m.role IN('admin','member')))) THEN RAISE EXCEPTION 'Property unavailable'; END IF;
 RETURN 'GRP-'||extract(year FROM current_date)||'-'||replace(gen_random_uuid()::text,'-','');
END $$;
REVOKE ALL ON FUNCTION public.pms_next_group_code(uuid),public.pms_group_lock(),public.pms_group_sync_rooms_booked() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pms_next_group_code(uuid) TO authenticated;
CREATE OR REPLACE VIEW public.pms_groups_active WITH(security_invoker=true) AS SELECT g.*,
 (g.cutoff_date IS NOT NULL AND g.cutoff_date<current_date) cutoff_passed,(g.rooms_blocked-g.rooms_booked) rooms_remaining,
 CASE WHEN g.status IN('cancelled','completed') THEN NULL WHEN g.cutoff_date IS NULL THEN NULL ELSE g.cutoff_date-current_date END days_until_cutoff,
 CASE WHEN g.check_in<=current_date AND g.check_out>=current_date THEN 'in_progress' WHEN g.check_in>current_date THEN 'upcoming' ELSE 'past' END period_state FROM pms_groups g;
REVOKE ALL ON public.pms_groups_active FROM anon;
GRANT SELECT ON public.pms_groups_active TO authenticated;

CREATE OR REPLACE FUNCTION public.pms_parent_scope_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE rowdata jsonb:=to_jsonb(NEW); scope uuid; parent_scope uuid; col text; parent_table text; parent_id uuid;
BEGIN
 scope:=(rowdata->>'property_id')::uuid;
 IF TG_OP='UPDATE' THEN
   IF rowdata->>'property_id' IS DISTINCT FROM to_jsonb(OLD)->>'property_id' THEN RAISE EXCEPTION 'PMS property scope is immutable'; END IF;
   IF TG_TABLE_NAME IN ('pms_payments','pms_reservation_rooms','pms_folios') AND rowdata->>'reservation_id' IS DISTINCT FROM to_jsonb(OLD)->>'reservation_id' THEN RAISE EXCEPTION 'PMS reservation scope is immutable'; END IF;
   IF TG_TABLE_NAME='pms_folio_charges' AND rowdata->>'folio_id' IS DISTINCT FROM to_jsonb(OLD)->>'folio_id' THEN RAISE EXCEPTION 'PMS folio scope is immutable'; END IF;
 END IF;
 IF scope IS NULL AND rowdata->>'folio_id' IS NOT NULL THEN SELECT property_id INTO scope FROM pms_folios WHERE id=(rowdata->>'folio_id')::uuid FOR KEY SHARE; END IF;
 IF scope IS NULL AND rowdata->>'reservation_id' IS NOT NULL THEN SELECT property_id INTO scope FROM pms_reservations WHERE id=(rowdata->>'reservation_id')::uuid FOR KEY SHARE; END IF;
 IF scope IS NULL THEN RAISE EXCEPTION 'PMS parent unavailable'; END IF;
 FOREACH col IN ARRAY ARRAY['reservation_id','guest_id','room_type_id','room_id','rate_plan_id','group_id','invoice_id'] LOOP
   parent_id:=(rowdata->>col)::uuid;
   IF parent_id IS NULL THEN CONTINUE; END IF;
   parent_table:=CASE col WHEN 'reservation_id' THEN 'pms_reservations' WHEN 'guest_id' THEN 'pms_guests' WHEN 'room_type_id' THEN 'pms_room_types' WHEN 'room_id' THEN 'pms_rooms' WHEN 'rate_plan_id' THEN 'pms_rate_plans' WHEN 'group_id' THEN 'pms_groups' WHEN 'invoice_id' THEN 'pms_invoices' END;
   EXECUTE format('SELECT property_id FROM public.%I WHERE id=$1 FOR KEY SHARE',parent_table) INTO parent_scope USING parent_id;
   IF parent_scope IS DISTINCT FROM scope THEN RAISE EXCEPTION 'PMS related record outside property scope'; END IF;
 END LOOP;
 IF TG_TABLE_NAME='pms_reservations' AND TG_OP='UPDATE' AND rowdata->>'currency' IS DISTINCT FROM to_jsonb(OLD)->>'currency' AND EXISTS(SELECT 1 FROM pms_folios WHERE reservation_id=(rowdata->>'id')::uuid) THEN RAISE EXCEPTION 'Reservation with a folio has immutable currency'; END IF;
 IF TG_TABLE_NAME='pms_reservation_rooms' AND rowdata->>'room_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pms_rooms WHERE id=(rowdata->>'room_id')::uuid AND room_type_id=(rowdata->>'room_type_id')::uuid) THEN RAISE EXCEPTION 'Assigned room has another type'; END IF;
 RETURN NEW;
END $$;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['pms_room_types','pms_rooms','pms_rate_plans','pms_guests','pms_seasonal_rates','pms_reservations','pms_reservation_rooms','pms_payments','pms_invoices','pms_folios','pms_folio_charges','pms_housekeeping_tasks','pms_external_calendars','pms_groups'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS a1_pms_parent_scope ON public.%I',t);
  EXECUTE format('CREATE TRIGGER a1_pms_parent_scope BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.pms_parent_scope_guard()',t);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.pms_payment_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE rid uuid;
BEGIN
 rid:=CASE WHEN TG_OP='DELETE' THEN OLD.reservation_id ELSE NEW.reservation_id END;
 PERFORM 1 FROM pms_reservations WHERE id=rid FOR NO KEY UPDATE;
 IF NOT FOUND THEN
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'PMS reservation unavailable';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW.amount::text IN ('NaN','Infinity','-Infinity') OR NEW.amount=0 THEN RAISE EXCEPTION 'Invalid PMS payment'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a0_pms_payment_guard ON public.pms_payments;
CREATE TRIGGER a0_pms_payment_guard BEFORE INSERT OR UPDATE OR DELETE ON public.pms_payments FOR EACH ROW EXECUTE FUNCTION public.pms_payment_guard();

CREATE OR REPLACE FUNCTION public.pms_charge_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE f pms_folios; fid uuid;
BEGIN
 fid:=CASE WHEN TG_OP='DELETE' THEN OLD.folio_id ELSE NEW.folio_id END;
 SELECT * INTO f FROM pms_folios WHERE id=fid;
 IF NOT FOUND THEN
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'PMS folio unavailable';
 END IF;
 PERFORM 1 FROM pms_reservations WHERE id=f.reservation_id FOR NO KEY UPDATE;
 SELECT * INTO f FROM pms_folios WHERE id=fid FOR UPDATE;
 IF f.status NOT IN ('open','pending_settlement') THEN RAISE EXCEPTION 'PMS folio is closed'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW.quantity::text IN ('NaN','Infinity','-Infinity') OR NEW.unit_price_ht::text IN ('NaN','Infinity','-Infinity') OR NEW.tva_rate::text IN ('NaN','Infinity','-Infinity') OR NEW.tva_rate<0 OR NEW.tva_rate>99.99 THEN RAISE EXCEPTION 'Invalid PMS charge'; END IF;
 IF NEW.category='taxe_sejour' AND NEW.tva_rate<>0 THEN RAISE EXCEPTION 'Tourist tax must use the separate tax field'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a0_pms_charge_guard ON public.pms_folio_charges;
CREATE TRIGGER a0_pms_charge_guard BEFORE INSERT OR UPDATE OR DELETE ON public.pms_folio_charges FOR EACH ROW EXECUTE FUNCTION public.pms_charge_guard();

CREATE OR REPLACE FUNCTION public.pms_folio_state_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE reservation_currency text;
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.status='settled' AND EXISTS(SELECT 1 FROM pms_properties WHERE id=OLD.property_id) THEN RAISE EXCEPTION 'Invoiced folio is immutable'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' AND OLD.status IN ('settled','cancelled') AND (NEW.status,NEW.currency,NEW.invoice_id) IS DISTINCT FROM (OLD.status,OLD.currency,OLD.invoice_id) THEN RAISE EXCEPTION 'Closed folio state is immutable'; END IF;
 IF TG_OP='UPDATE' AND NEW.currency<>OLD.currency AND EXISTS(SELECT 1 FROM pms_folio_charges WHERE folio_id=NEW.id) THEN RAISE EXCEPTION 'Charged folio currency is immutable'; END IF;
 SELECT currency INTO reservation_currency FROM pms_reservations WHERE id=NEW.reservation_id;
 IF NEW.currency IS DISTINCT FROM reservation_currency THEN RAISE EXCEPTION 'Folio currency differs from reservation'; END IF;
 IF NEW.status='settled' AND NOT EXISTS(SELECT 1 FROM pms_invoices WHERE id=NEW.invoice_id AND property_id=NEW.property_id AND reservation_id=NEW.reservation_id AND issued AND currency=NEW.currency AND total_ttc=(SELECT coalesce(sum(line_ttc),0) FROM pms_folio_charges WHERE folio_id=NEW.id AND NOT voided)) THEN RAISE EXCEPTION 'Settled folio requires its issued invoice'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pms_folio_state_guard ON public.pms_folios;
CREATE TRIGGER pms_folio_state_guard BEFORE INSERT OR UPDATE OR DELETE ON public.pms_folios FOR EACH ROW EXECUTE FUNCTION public.pms_folio_state_guard();

-- Derived balances cannot be supplied by a client. Definer triggers read only their parent row's children.
CREATE OR REPLACE FUNCTION public.pms_folio_totals_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE paid numeric;
BEGIN
 SELECT coalesce(sum(line_ht),0),coalesce(sum(line_tva),0),coalesce(sum(line_ttc),0)
 INTO NEW.subtotal_ht,NEW.total_tva,NEW.total_ttc FROM public.pms_folio_charges WHERE folio_id=NEW.id AND NOT voided;
 SELECT coalesce(sum(amount),0) INTO paid FROM public.pms_payments WHERE reservation_id=NEW.reservation_id;
 NEW.balance_due:=greatest(0,NEW.total_ttc-paid);
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.pms_reservation_amount_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 SELECT coalesce(sum(amount),0) INTO NEW.amount_paid FROM public.pms_payments WHERE reservation_id=NEW.id;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pms_folio_totals_guard ON public.pms_folios;
CREATE TRIGGER pms_folio_totals_guard BEFORE INSERT OR UPDATE ON public.pms_folios FOR EACH ROW EXECUTE FUNCTION public.pms_folio_totals_guard();
DROP TRIGGER IF EXISTS pms_reservation_amount_guard ON public.pms_reservations;
CREATE TRIGGER pms_reservation_amount_guard BEFORE INSERT OR UPDATE ON public.pms_reservations FOR EACH ROW EXECUTE FUNCTION public.pms_reservation_amount_guard();

CREATE OR REPLACE FUNCTION public.pms_folio_charge_compute() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF NEW.agreed_ttc IS NOT NULL THEN
  IF NEW.agreed_ttc<0 OR NEW.agreed_ttc::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid agreed gross amount'; END IF;
  NEW.line_ttc:=NEW.agreed_ttc;
  NEW.line_ht:=round(NEW.line_ttc/(1+NEW.tva_rate/100),2);
  NEW.line_tva:=NEW.line_ttc-NEW.line_ht;
 ELSE
  NEW.line_ht:=round(NEW.quantity*NEW.unit_price_ht,2);
  NEW.line_tva:=round(NEW.line_ht*NEW.tva_rate/100,2);
  NEW.line_ttc:=NEW.line_ht+NEW.line_tva;
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.pms_invoice_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.issued AND EXISTS(SELECT 1 FROM pms_properties WHERE id=OLD.property_id) THEN RAISE EXCEPTION 'Issued invoice is immutable'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' AND OLD.issued THEN
  IF (to_jsonb(NEW)-ARRAY['paid','paid_at','updated_at','pdf_storage_path','pdf_hash_sha256','notes','reservation_id','guest_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['paid','paid_at','updated_at','pdf_storage_path','pdf_hash_sha256','notes','reservation_id','guest_id'])
    OR (NEW.reservation_id IS NOT NULL AND NEW.reservation_id IS DISTINCT FROM OLD.reservation_id)
    OR (NEW.guest_id IS NOT NULL AND NEW.guest_id IS DISTINCT FROM OLD.guest_id) THEN RAISE EXCEPTION 'Issued invoice is immutable'; END IF;
 ELSE
  IF NEW.total_ht IS DISTINCT FROM NEW.hebergement_ht+NEW.fb_ht+NEW.other_ht+NEW.taxe_sejour
    OR NEW.total_tva IS DISTINCT FROM NEW.hebergement_tva+NEW.fb_tva+NEW.other_tva
    OR NEW.total_ttc IS DISTINCT FROM NEW.total_ht+NEW.total_tva
    OR NEW.total_ttc::text IN ('NaN','Infinity','-Infinity') OR NEW.currency !~ '^[A-Z]{3}$' THEN RAISE EXCEPTION 'Invalid PMS invoice totals'; END IF;
 END IF;
 NEW.updated_at:=clock_timestamp();
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pms_inv_immut ON public.pms_invoices;
CREATE TRIGGER pms_inv_immut BEFORE INSERT OR UPDATE OR DELETE ON public.pms_invoices FOR EACH ROW EXECUTE FUNCTION public.pms_invoice_immutable();

CREATE OR REPLACE FUNCTION public.pms_settle_folio(p_folio_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE f pms_folios; r pms_reservations; p pms_properties; g pms_guests; v_invoice_id uuid; inv_number text;
 hh numeric; hv numeric; fb numeric; fv numeric; ot numeric; ov numeric; ts numeric;
 hr numeric; fr numeric; orate numeric; breakdown jsonb;
BEGIN
 SELECT * INTO f FROM pms_folios WHERE pms_folios.id=p_folio_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Folio unavailable'; END IF;
 SELECT * INTO r FROM pms_reservations WHERE pms_reservations.id=f.reservation_id FOR NO KEY UPDATE;
 IF NOT FOUND OR r.property_id<>f.property_id THEN RAISE EXCEPTION 'Reservation outside folio scope'; END IF;
 SELECT * INTO f FROM pms_folios WHERE pms_folios.id=p_folio_id FOR UPDATE;
 IF f.status='settled' AND f.invoice_id IS NOT NULL THEN RETURN f.invoice_id; END IF;
 IF f.status NOT IN ('open','pending_settlement') THEN RAISE EXCEPTION 'Folio cannot be invoiced'; END IF;
 SELECT * INTO p FROM pms_properties WHERE pms_properties.id=f.property_id FOR KEY SHARE;
 IF NOT FOUND OR p.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the property owner can issue invoices'; END IF;
 IF f.currency IS DISTINCT FROM r.currency THEN RAISE EXCEPTION 'Folio currency differs from reservation'; END IF;
 IF r.guest_id IS NOT NULL THEN
  SELECT * INTO g FROM pms_guests WHERE pms_guests.id=r.guest_id AND property_id=f.property_id FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Guest outside folio scope'; END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pms_folio_charges WHERE folio_id=f.id AND NOT voided) THEN RAISE EXCEPTION 'Empty folio cannot be invoiced'; END IF;
 WITH grouped AS(SELECT CASE WHEN category IN ('room','extra_bed') THEN 'room' WHEN category IN ('breakfast','lunch','dinner','bar','minibar','room_service') THEN 'fb' WHEN category='taxe_sejour' THEN 'tax' ELSE 'other' END kind,* FROM pms_folio_charges WHERE folio_id=f.id AND NOT voided)
 SELECT coalesce(sum(line_ht) FILTER(WHERE kind='room'),0),coalesce(sum(line_tva) FILTER(WHERE kind='room'),0),
 coalesce(sum(line_ht) FILTER(WHERE kind='fb'),0),coalesce(sum(line_tva) FILTER(WHERE kind='fb'),0),
 coalesce(sum(line_ht) FILTER(WHERE kind='other'),0),coalesce(sum(line_tva) FILTER(WHERE kind='other'),0),coalesce(sum(line_ht) FILTER(WHERE kind='tax'),0),
 CASE WHEN count(DISTINCT tva_rate) FILTER(WHERE kind='room')<=1 THEN min(tva_rate) FILTER(WHERE kind='room') END,
 CASE WHEN count(DISTINCT tva_rate) FILTER(WHERE kind='fb')<=1 THEN min(tva_rate) FILTER(WHERE kind='fb') END,
 CASE WHEN count(DISTINCT tva_rate) FILTER(WHERE kind='other')<=1 THEN min(tva_rate) FILTER(WHERE kind='other') END
 INTO hh,hv,fb,fv,ot,ov,ts,hr,fr,orate FROM grouped;
 SELECT jsonb_agg(jsonb_build_object('category',category,'rate',tva_rate,'base',base,'vat',vat,'gross',gross) ORDER BY category,tva_rate) INTO breakdown
 FROM(SELECT category,tva_rate,sum(line_ht) base,sum(line_tva) vat,sum(line_ttc) gross FROM pms_folio_charges WHERE folio_id=f.id AND NOT voided GROUP BY category,tva_rate) s;
 inv_number:=pms_next_invoice_number(f.property_id);
 INSERT INTO pms_invoices(property_id,reservation_id,guest_id,invoice_number,invoice_type,customer_name,customer_address,
 hebergement_ht,hebergement_tva_rate,hebergement_tva,fb_ht,fb_tva_rate,fb_tva,other_ht,other_tva_rate,other_tva,taxe_sejour,total_ht,total_tva,total_ttc,currency,tax_breakdown,legal_footer,issued,issued_at)
 VALUES(f.property_id,f.reservation_id,r.guest_id,inv_number,'standard',coalesce(nullif(trim(concat_ws(' ',g.first_name,g.last_name)),''),r.booker_name,'Client'),g.address,
 hh,hr,hv,fb,fr,fv,ot,orate,ov,ts,hh+fb+ot+ts,hv+fv+ov,hh+fb+ot+ts+hv+fv+ov,f.currency,breakdown,p.legal_footer,true,clock_timestamp()) RETURNING pms_invoices.id INTO v_invoice_id;
 UPDATE pms_folios SET status='settled',settled_at=clock_timestamp(),invoice_id=v_invoice_id WHERE pms_folios.id=f.id;
 RETURN v_invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.pms_folio_auto_post_room_charges(p_folio_id uuid) RETURNS int
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE f pms_folios; r pms_reservations; p pms_properties; n int; people int;
BEGIN
 SELECT * INTO f FROM pms_folios WHERE id=p_folio_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Folio unavailable'; END IF;
 SELECT * INTO r FROM pms_reservations WHERE id=f.reservation_id FOR NO KEY UPDATE;
 IF NOT FOUND OR r.property_id<>f.property_id THEN RAISE EXCEPTION 'Reservation outside folio scope'; END IF;
 SELECT * INTO f FROM pms_folios WHERE id=p_folio_id FOR UPDATE;
 IF f.status NOT IN ('open','pending_settlement') THEN RAISE EXCEPTION 'Folio is closed'; END IF;
 SELECT * INTO p FROM pms_properties WHERE id=f.property_id FOR KEY SHARE;
 IF p.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the property owner can post financial charges'; END IF;
 IF f.currency IS DISTINCT FROM r.currency THEN RAISE EXCEPTION 'Folio currency differs from reservation'; END IF;
 IF EXISTS(SELECT 1 FROM pms_folio_charges WHERE folio_id=f.id AND source IN ('auto_room','auto_taxe')) THEN RETURN 0; END IF;
 IF EXISTS(SELECT 1 FROM pms_reservation_rooms rr LEFT JOIN pms_room_types rt ON rt.id=rr.room_type_id WHERE rr.reservation_id=r.id AND (rt.property_id IS DISTINCT FROM f.property_id OR rr.nb_nights<=0 OR rr.line_total<0 OR rr.line_total::text IN ('NaN','Infinity','-Infinity'))) THEN RAISE EXCEPTION 'Invalid reservation charge scope or amount'; END IF;
 IF p.taxe_sejour_eur>0 AND f.currency<>'EUR' THEN RAISE EXCEPTION 'Tourist tax currency requires manual conversion'; END IF;
 INSERT INTO pms_folio_charges(folio_id,category,description,quantity,unit_price_ht,tva_rate,source,agreed_ttc)
 SELECT f.id,'room','Hébergement '||rr.nb_nights||' nuit(s) — '||rt.name,1,round(rr.line_total/(1+p.tva_rate/100),2),p.tva_rate,'auto_room',rr.line_total
 FROM pms_reservation_rooms rr JOIN pms_room_types rt ON rt.id=rr.room_type_id WHERE rr.reservation_id=r.id;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n=0 THEN RAISE EXCEPTION 'Reservation has no room charges'; END IF;
 people:=r.nb_adults+CASE WHEN p.taxe_sejour_enfants THEN r.nb_children ELSE 0 END;
 IF p.taxe_sejour_eur>0 AND people>0 THEN
  INSERT INTO pms_folio_charges(folio_id,category,description,quantity,unit_price_ht,tva_rate,source)
  VALUES(f.id,'taxe_sejour','Taxe de séjour',people*(r.check_out-r.check_in),p.taxe_sejour_eur,0,'auto_taxe'); n:=n+1;
 END IF;
 RETURN n;
END $$;

-- Operational staff can change stay status; owner-scoped financial posting remains separate.
DO $migration$ DECLARE f text; patched text; BEGIN
 SELECT pg_get_functiondef('public.pms_open_folio_on_checkin()'::regprocedure) INTO f;
 patched:=replace(f,'insert into pms_folios (property_id, reservation_id, status)','insert into pms_folios (property_id, reservation_id, status, currency)');
 patched:=replace(patched,'values (new.property_id, new.id, ''open'')','values (new.property_id, new.id, ''open'', new.currency)');
 patched:=replace(patched,'coalesce(old.status, '''') <>','old.status IS DISTINCT FROM');
 IF position('PMS_STAFF_071' IN patched)=0 THEN
  patched:=regexp_replace(patched,'begin','BEGIN /* PMS_STAFF_071 */
   IF NOT EXISTS(SELECT 1 FROM pms_properties WHERE id=NEW.property_id AND user_id=auth.uid()) THEN RETURN NEW; END IF;','i');
 END IF;
 IF position('status, currency)' IN patched)=0 OR position('new.currency)' IN patched)=0 OR position('coalesce(old.status' IN patched)>0 THEN RAISE EXCEPTION 'Unexpected check-in function: review required'; END IF;
 EXECUTE patched;
END $migration$;
CREATE OR REPLACE FUNCTION public.restore_pms_folio(p_folio jsonb,p_charges jsonb,p_skip_existing boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE input pms_folios; saved pms_folios; n int;
BEGIN
 IF auth.uid() IS NULL OR NOT public.session_has_required_aal() THEN RAISE EXCEPTION 'Authentication required'; END IF;
 input:=jsonb_populate_record(NULL::pms_folios,p_folio);
 IF jsonb_typeof(p_charges) IS DISTINCT FROM 'array' OR jsonb_array_length(p_charges)>10000 THEN RAISE EXCEPTION 'Invalid folio backup'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_charges) c WHERE c->>'folio_id' IS DISTINCT FROM input.id::text) THEN RAISE EXCEPTION 'Folio backup scope mismatch'; END IF;
 PERFORM 1 FROM pms_properties WHERE id=input.property_id AND user_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Property unavailable'; END IF;
 PERFORM 1 FROM pms_reservations WHERE id=input.reservation_id AND property_id=input.property_id FOR NO KEY UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reservation unavailable'; END IF;
 SELECT * INTO saved FROM pms_folios WHERE id=input.id FOR UPDATE;
 IF FOUND THEN
  IF (saved.property_id,saved.reservation_id) IS DISTINCT FROM (input.property_id,input.reservation_id) THEN RAISE EXCEPTION 'Folio backup scope mismatch'; END IF;
  IF p_skip_existing THEN RETURN jsonb_build_object('imported',0,'skipped',1,'charges_imported',0); END IF;
  IF saved.status IN ('settled','cancelled') THEN RAISE EXCEPTION 'Closed folio is immutable'; END IF;
  IF saved.currency IS DISTINCT FROM input.currency THEN RAISE EXCEPTION 'Folio backup currency mismatch'; END IF;
  DELETE FROM pms_folio_charges WHERE folio_id=saved.id;
  UPDATE pms_folios SET notes=input.notes WHERE id=saved.id;
 ELSE
  INSERT INTO pms_folios(id,property_id,reservation_id,currency,status,notes)
  VALUES(input.id,input.property_id,input.reservation_id,input.currency,'open',input.notes);
 END IF;
 INSERT INTO pms_folio_charges(id,folio_id,category,description,quantity,unit_price_ht,tva_rate,agreed_ttc,posted_at,posted_by,voided,voided_at,voided_by,void_reason,source,external_ref,notes)
 SELECT id,folio_id,category,description,quantity,unit_price_ht,tva_rate,agreed_ttc,coalesce(posted_at,clock_timestamp()),posted_by,coalesce(voided,false),voided_at,voided_by,void_reason,source,external_ref,notes
 FROM jsonb_populate_recordset(NULL::pms_folio_charges,p_charges);
 GET DIAGNOSTICS n=ROW_COUNT;
 SELECT * INTO saved FROM pms_folios WHERE id=input.id;
 IF (saved.subtotal_ht,saved.total_tva,saved.total_ttc) IS DISTINCT FROM (input.subtotal_ht,input.total_tva,input.total_ttc) THEN RAISE EXCEPTION 'Incomplete or inconsistent folio backup'; END IF;
 UPDATE pms_folios SET status=input.status,invoice_id=input.invoice_id,opened_at=coalesce(input.opened_at,opened_at),closed_at=input.closed_at,settled_at=input.settled_at WHERE id=input.id;
 RETURN jsonb_build_object('imported',1,'skipped',0,'charges_imported',n);
END $$;
REVOKE ALL ON FUNCTION public.restore_pms_folio(jsonb,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.restore_pms_folio(jsonb,jsonb,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.pms_parent_scope_guard(),public.pms_payment_guard(),public.pms_charge_guard(),public.pms_folio_state_guard(),public.pms_folio_totals_guard(),public.pms_reservation_amount_guard() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
