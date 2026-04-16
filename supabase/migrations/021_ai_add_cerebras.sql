-- ============================================================
-- AI PREFERENCES — ajout du provider 'cerebras'
-- ============================================================
-- La 020 a été appliquée avant l'ajout de Cerebras ; ce correctif
-- élargit le CHECK constraint pour inclure le nouveau provider
-- (Groq bloque certains domaines email au signup).

ALTER TABLE user_ai_settings
  DROP CONSTRAINT IF EXISTS user_ai_settings_ai_provider_check;

ALTER TABLE user_ai_settings
  ADD CONSTRAINT user_ai_settings_ai_provider_check
  CHECK (ai_provider IN ('cerebras','groq','openai','anthropic'));

ALTER TABLE user_ai_settings
  ALTER COLUMN ai_provider SET DEFAULT 'cerebras';
