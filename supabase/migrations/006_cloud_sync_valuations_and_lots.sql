-- ============================================================
-- CLOUD SYNC — Extension de `valuations` + création `rental_lots`
-- ============================================================
-- Synchronise côté cloud les calculs sauvegardés et les lots de
-- gestion locative. Plafond 500 items par utilisateur (tier gratuit),
-- rétention 180 jours (expires_at auto-reculé à chaque update).
--
-- Dépend de : 001_create_valuations.sql

-- ============================================================
-- 1. Étendre `valuations`
-- ============================================================

ALTER TABLE valuations
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '180 days'),
  ADD COLUMN IF NOT EXISTS local_id TEXT; -- id localStorage pour dedup

CREATE INDEX IF NOT EXISTS valuations_user_id_idx ON valuations(user_id);
CREATE INDEX IF NOT EXISTS valuations_expires_at_idx ON valuations(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS valuations_user_local_unique
  ON valuations(user_id, local_id)
  WHERE local_id IS NOT NULL;

-- Plafond 500 items par utilisateur — via trigger (supprime les plus anciens)
CREATE OR REPLACE FUNCTION valuations_enforce_cap()
RETURNS TRIGGER AS $$
DECLARE
  cap INT := 500;
  to_delete INT;
BEGIN
  SELECT COUNT(*) - cap INTO to_delete
  FROM valuations
  WHERE user_id = NEW.user_id;

  IF to_delete > 0 THEN
    DELETE FROM valuations
    WHERE id IN (
      SELECT id FROM valuations
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT to_delete
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS valuations_cap_trigger ON valuations;
CREATE TRIGGER valuations_cap_trigger
  AFTER INSERT ON valuations
  FOR EACH ROW EXECUTE FUNCTION valuations_enforce_cap();

-- Push expires_at à chaque update (touch = prolongation de la rétention)
CREATE OR REPLACE FUNCTION valuations_touch_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.expires_at := NOW() + INTERVAL '180 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS valuations_touch_trigger ON valuations;
CREATE TRIGGER valuations_touch_trigger
  BEFORE UPDATE ON valuations
  FOR EACH ROW EXECUTE FUNCTION valuations_touch_expiry();

-- ============================================================
-- 2. Création `rental_lots` (gestion locative)
-- ============================================================

CREATE TABLE IF NOT EXISTS rental_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT, -- id localStorage pour dedup
  name TEXT NOT NULL,
  address TEXT,
  commune TEXT,

  -- caractéristiques
  surface NUMERIC NOT NULL DEFAULT 0,
  nb_chambres INT,
  classe_energie TEXT NOT NULL DEFAULT 'NC',
  est_meuble BOOLEAN NOT NULL DEFAULT FALSE,

  -- acquisition & travaux
  prix_acquisition NUMERIC NOT NULL DEFAULT 0,
  annee_acquisition INT NOT NULL DEFAULT 2024,
  travaux_montant NUMERIC NOT NULL DEFAULT 0,
  travaux_annee INT NOT NULL DEFAULT 2024,

  -- bail
  loyer_mensuel_actuel NUMERIC NOT NULL DEFAULT 0,
  charges_mensuelles NUMERIC NOT NULL DEFAULT 0,
  tenant_name TEXT,
  lease_start_date TEXT,
  lease_end_date TEXT,
  vacant BOOLEAN NOT NULL DEFAULT FALSE,

  -- meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '180 days')
);

CREATE INDEX IF NOT EXISTS rental_lots_user_id_idx ON rental_lots(user_id);
CREATE INDEX IF NOT EXISTS rental_lots_expires_at_idx ON rental_lots(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS rental_lots_user_local_unique
  ON rental_lots(user_id, local_id)
  WHERE local_id IS NOT NULL;

ALTER TABLE rental_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_view_rental_lots" ON rental_lots
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "owner_insert_rental_lots" ON rental_lots
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner_update_rental_lots" ON rental_lots
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner_delete_rental_lots" ON rental_lots
  FOR DELETE USING (user_id = auth.uid());

-- Plafond 500 lots par utilisateur
CREATE OR REPLACE FUNCTION rental_lots_enforce_cap()
RETURNS TRIGGER AS $$
DECLARE
  cap INT := 500;
  to_delete INT;
BEGIN
  SELECT COUNT(*) - cap INTO to_delete
  FROM rental_lots
  WHERE user_id = NEW.user_id;

  IF to_delete > 0 THEN
    DELETE FROM rental_lots
    WHERE id IN (
      SELECT id FROM rental_lots
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT to_delete
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS rental_lots_cap_trigger ON rental_lots;
CREATE TRIGGER rental_lots_cap_trigger
  AFTER INSERT ON rental_lots
  FOR EACH ROW EXECUTE FUNCTION rental_lots_enforce_cap();

CREATE OR REPLACE FUNCTION rental_lots_touch_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.expires_at := NOW() + INTERVAL '180 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rental_lots_touch_trigger ON rental_lots;
CREATE TRIGGER rental_lots_touch_trigger
  BEFORE UPDATE ON rental_lots
  FOR EACH ROW EXECUTE FUNCTION rental_lots_touch_expiry();

-- ============================================================
-- 3. Purge automatique via view filtrée
-- ============================================================
-- Les lignes expirées sont ignorées par les SELECT côté client
-- (filtre WHERE expires_at > NOW() dans les helpers Supabase).
-- Un cron Supabase pourra purger les lignes expirées périodiquement
-- via : DELETE FROM valuations WHERE expires_at < NOW();
--      DELETE FROM rental_lots WHERE expires_at < NOW();
