-- Requires 006, 016 and 026. Apply through an administrative database session.
-- Website deployment alone DOES NOT apply this migration.
-- Restrictive policies also constrain any existing permissive owner policies.
BEGIN;

ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_payments_owned_lot_guard ON public.rental_payments;
CREATE POLICY rental_payments_owned_lot_guard ON public.rental_payments
 AS RESTRICTIVE FOR ALL TO PUBLIC
 USING (user_id = auth.uid() AND EXISTS (
   SELECT 1 FROM public.rental_lots l
   WHERE l.id = rental_payments.lot_id AND l.user_id = auth.uid()
 ))
 WITH CHECK (user_id = auth.uid() AND EXISTS (
   SELECT 1 FROM public.rental_lots l
   WHERE l.id = rental_payments.lot_id AND l.user_id = auth.uid()
 ));

ALTER TABLE public.tenant_portal_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_portal_owned_lot_guard ON public.tenant_portal_tokens;
CREATE POLICY tenant_portal_owned_lot_guard ON public.tenant_portal_tokens
 AS RESTRICTIVE FOR ALL TO PUBLIC
 USING (owner_id = auth.uid() AND EXISTS (
   SELECT 1 FROM public.rental_lots l
   WHERE l.id = tenant_portal_tokens.lot_id AND l.user_id = auth.uid()
 ))
 WITH CHECK (owner_id = auth.uid() AND EXISTS (
   SELECT 1 FROM public.rental_lots l
   WHERE l.id = tenant_portal_tokens.lot_id AND l.user_id = auth.uid()
 ));

CREATE OR REPLACE FUNCTION public.get_tenant_portal_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET lock_timeout = '5s' AS $$
DECLARE
 v_token public.tenant_portal_tokens%ROWTYPE;
 v_lot JSONB;
 v_payments JSONB;
 v_access_time TIMESTAMPTZ;
BEGIN
 SELECT t.* INTO v_token FROM public.tenant_portal_tokens t
 WHERE t.token = p_token
 FOR UPDATE OF t;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
 IF v_token.revoked_at IS NOT NULL OR v_token.expires_at <= clock_timestamp() THEN
   RETURN jsonb_build_object('error','invalid_token');
 END IF;

 SELECT to_jsonb(l) INTO v_lot FROM (
   SELECT name,address,commune,surface,nb_chambres,classe_energie,est_meuble
 FROM public.rental_lots WHERE id=v_token.lot_id AND user_id=v_token.owner_id
 FOR SHARE
 ) l;
 IF v_lot IS NULL THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
 -- Keep ownership stable during this read and check expiry after either lock wait.
 v_access_time := clock_timestamp();
 IF v_token.expires_at <= v_access_time THEN RETURN jsonb_build_object('error','invalid_token'); END IF;

 SELECT jsonb_agg(jsonb_build_object(
   'id',p.id,'period',p.period_year||'-'||LPAD(p.period_month::text,2,'0'),
   'amount_rent',p.amount_rent,'amount_charges',p.amount_charges,'amount_total',p.amount_total,
   'status',p.status,'paid_at',p.paid_at,'receipt_issued_at',p.receipt_issued_at
 ) ORDER BY p.period_year DESC,p.period_month DESC) INTO v_payments
 FROM (
   SELECT id,period_year,period_month,amount_rent,amount_charges,amount_total,status,paid_at,receipt_issued_at
   FROM public.rental_payments
   WHERE lot_id=v_token.lot_id AND user_id=v_token.owner_id
   ORDER BY period_year DESC,period_month DESC LIMIT 24
 ) p;

 UPDATE public.tenant_portal_tokens
 SET view_count=LEAST(COALESCE(view_count,0)::bigint+1,2147483647)::integer,last_viewed_at=v_access_time
 WHERE id=v_token.id;
 RETURN jsonb_build_object('lot',v_lot,'tenant_name',v_token.tenant_name,'payments',COALESCE(v_payments,'[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.get_tenant_portal_data(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_portal_data(TEXT) TO anon,authenticated;
COMMIT;
