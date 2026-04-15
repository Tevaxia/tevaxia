-- ============================================================
-- STRIPE SUBSCRIPTIONS — suivi des abonnements Pro/Enterprise
-- ============================================================
-- Traçabilité des événements Stripe côté DB. Les webhooks
-- insèrent/mettent à jour les lignes. Un trigger bascule
-- automatiquement user_tiers sur 'pro' quand status = 'active'.

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  tier TEXT NOT NULL DEFAULT 'pro' CHECK (tier IN ('pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused')),

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_subs_user_idx ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS stripe_subs_status_idx ON stripe_subscriptions(status);

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Lecture : l'utilisateur voit ses propres abonnements
CREATE POLICY "user_read_own_subscriptions" ON stripe_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- INSERT / UPDATE : réservés au service_role (via webhook backend)

-- ------------------------------------------------------------
-- Trigger : sync user_tiers selon le status de l'abonnement
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_user_tier_from_subscription()
RETURNS TRIGGER AS $$
DECLARE
  cap INT;
BEGIN
  -- plafond selon tier
  cap := CASE NEW.tier
    WHEN 'enterprise' THEN 100000
    ELSE 10000  -- pro
  END;

  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    -- upgrade user_tiers
    INSERT INTO user_tiers (user_id, tier, items_cap, granted_at, expires_at)
    VALUES (NEW.user_id, NEW.tier, cap, NOW(), NEW.current_period_end)
    ON CONFLICT (user_id) DO UPDATE SET
      tier = EXCLUDED.tier,
      items_cap = EXCLUDED.items_cap,
      granted_at = NOW(),
      expires_at = EXCLUDED.expires_at;
  ELSIF NEW.status IN ('canceled','unpaid','incomplete_expired','past_due') THEN
    -- ne pas downgrade immédiatement si expires_at est encore dans le futur
    -- (l'utilisateur a payé jusqu'à current_period_end)
    IF NEW.current_period_end IS NULL OR NEW.current_period_end < NOW() THEN
      UPDATE user_tiers
      SET tier = 'free', items_cap = 500, expires_at = NULL, granted_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS stripe_subs_sync_tier ON stripe_subscriptions;
CREATE TRIGGER stripe_subs_sync_tier
  BEFORE INSERT OR UPDATE ON stripe_subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_user_tier_from_subscription();
