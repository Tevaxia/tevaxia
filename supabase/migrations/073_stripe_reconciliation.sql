BEGIN;
SET LOCAL lock_timeout='5s';
INSERT INTO tevaxia_audit.schema_backups(migration,snapshot)
SELECT '073',jsonb_build_object('definition',pg_get_functiondef('public.sync_user_tier_from_subscription()'::regprocedure)) ON CONFLICT(migration) DO NOTHING;
CREATE TABLE IF NOT EXISTS tevaxia_audit.stripe_reconciliation_leases(subscription_id text PRIMARY KEY,lease_id uuid NOT NULL,expires_at timestamptz NOT NULL);
ALTER TABLE tevaxia_audit.stripe_reconciliation_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tevaxia_audit.stripe_reconciliation_leases FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.acquire_stripe_reconciliation(p_subscription_id text,p_lease_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE acquired boolean;
BEGIN
 IF p_subscription_id !~ '^sub_[A-Za-z0-9]+$' OR p_lease_id IS NULL THEN RAISE EXCEPTION 'Invalid subscription lease'; END IF;
 INSERT INTO tevaxia_audit.stripe_reconciliation_leases AS l VALUES(p_subscription_id,p_lease_id,clock_timestamp()+interval '60 seconds')
 ON CONFLICT(subscription_id) DO UPDATE SET lease_id=EXCLUDED.lease_id,expires_at=EXCLUDED.expires_at WHERE l.expires_at<clock_timestamp() RETURNING true INTO acquired;
 RETURN coalesce(acquired,false);
END $$;
CREATE OR REPLACE FUNCTION public.release_stripe_reconciliation(p_subscription_id text,p_lease_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 DELETE FROM tevaxia_audit.stripe_reconciliation_leases WHERE subscription_id=p_subscription_id AND lease_id=p_lease_id;
$$;
CREATE OR REPLACE FUNCTION public.finish_stripe_reconciliation(p_subscription jsonb,p_lease_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE s stripe_subscriptions;
BEGIN
 s:=jsonb_populate_record(NULL::stripe_subscriptions,p_subscription);
 PERFORM 1 FROM tevaxia_audit.stripe_reconciliation_leases WHERE subscription_id=s.stripe_subscription_id AND lease_id=p_lease_id AND expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Subscription lease expired'; END IF;
 INSERT INTO stripe_subscriptions(user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,tier,status,current_period_start,current_period_end,cancel_at,canceled_at)
 VALUES(s.user_id,s.stripe_customer_id,s.stripe_subscription_id,s.stripe_price_id,s.tier,s.status,s.current_period_start,s.current_period_end,s.cancel_at,s.canceled_at)
 ON CONFLICT(stripe_subscription_id) DO UPDATE SET user_id=EXCLUDED.user_id,stripe_customer_id=EXCLUDED.stripe_customer_id,stripe_price_id=EXCLUDED.stripe_price_id,tier=EXCLUDED.tier,status=EXCLUDED.status,current_period_start=EXCLUDED.current_period_start,current_period_end=EXCLUDED.current_period_end,cancel_at=EXCLUDED.cancel_at,canceled_at=EXCLUDED.canceled_at;
 DELETE FROM tevaxia_audit.stripe_reconciliation_leases WHERE subscription_id=s.stripe_subscription_id AND lease_id=p_lease_id;
END $$;
REVOKE ALL ON FUNCTION public.acquire_stripe_reconciliation(text,uuid),public.release_stripe_reconciliation(text,uuid),public.finish_stripe_reconciliation(jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_stripe_reconciliation(text,uuid),public.release_stripe_reconciliation(text,uuid),public.finish_stripe_reconciliation(jsonb,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.stripe_subscription_owner_lock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Subscription owner is immutable'; END IF;
 PERFORM 1 FROM auth.users WHERE id=coalesce(NEW.user_id,OLD.user_id) FOR NO KEY UPDATE;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 NEW.updated_at:=clock_timestamp();RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS stripe_subscription_owner_lock ON public.stripe_subscriptions;
CREATE TRIGGER stripe_subscription_owner_lock BEFORE INSERT OR UPDATE OR DELETE ON public.stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION public.stripe_subscription_owner_lock();
CREATE OR REPLACE FUNCTION public.sync_user_tier_from_subscription() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE uid uuid:=coalesce(NEW.user_id,OLD.user_id); effective_tier text; expiry timestamptz; cap int;
BEGIN
 -- Keep the existing paid-period grace policy, considering every subscription of this owner.
 SELECT tier,CASE WHEN bool_or(current_period_end IS NULL) THEN NULL ELSE max(current_period_end) END INTO effective_tier,expiry
 FROM stripe_subscriptions WHERE user_id=uid AND (status IN('active','trialing') OR (status IN('canceled','unpaid','incomplete_expired','past_due') AND current_period_end>clock_timestamp()))
 GROUP BY tier ORDER BY CASE tier WHEN 'enterprise' THEN 0 ELSE 1 END LIMIT 1;
 IF effective_tier IS NOT NULL THEN
  cap:=CASE effective_tier WHEN 'enterprise' THEN 100000 ELSE 10000 END;
  INSERT INTO user_tiers(user_id,tier,items_cap,granted_at,expires_at) VALUES(uid,effective_tier,cap,clock_timestamp(),expiry)
  ON CONFLICT(user_id) DO UPDATE SET tier=EXCLUDED.tier,items_cap=EXCLUDED.items_cap,granted_at=EXCLUDED.granted_at,expires_at=EXCLUDED.expires_at;
 ELSIF TG_OP='DELETE' OR (NEW.status IN('canceled','unpaid','incomplete_expired','past_due') AND (NEW.current_period_end IS NULL OR NEW.current_period_end<clock_timestamp())) THEN
  UPDATE user_tiers SET tier='free',items_cap=500,expires_at=NULL,granted_at=clock_timestamp() WHERE user_id=uid;
 END IF;
 RETURN coalesce(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS stripe_subs_sync_tier ON public.stripe_subscriptions;
CREATE TRIGGER stripe_subs_sync_tier AFTER INSERT OR UPDATE OR DELETE ON public.stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION public.sync_user_tier_from_subscription();
REVOKE ALL ON FUNCTION public.stripe_subscription_owner_lock(),public.sync_user_tier_from_subscription() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
