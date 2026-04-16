-- ============================================================
-- AI PREFERENCES — clé BYOK, provider, rate-limit quotidien
-- ============================================================
-- Stocke les préférences AI par utilisateur : provider choisi,
-- clé API chiffrée côté client, compteur d'usage quotidien.

CREATE TABLE IF NOT EXISTS user_ai_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_provider TEXT NOT NULL DEFAULT 'groq' CHECK (ai_provider IN ('groq','openai','anthropic')),
  ai_api_key_encrypted TEXT,
  daily_usage INT NOT NULL DEFAULT 0,
  last_usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_ai_select" ON user_ai_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_own_ai_insert" ON user_ai_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_ai_update" ON user_ai_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-touch updated_at
CREATE OR REPLACE FUNCTION user_ai_settings_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_ai_settings_touch_trigger ON user_ai_settings;
CREATE TRIGGER user_ai_settings_touch_trigger
  BEFORE UPDATE ON user_ai_settings
  FOR EACH ROW EXECUTE FUNCTION user_ai_settings_touch();
