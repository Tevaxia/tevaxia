-- ============================================================
-- AI PREFERENCES — ajout du provider 'gemini' + nouveau défaut
-- ============================================================
-- Contexte : Cerebras a migré les comptes personnels gratuits vers PayGo
-- (2026-08). Sans moyen de paiement, toute inférence renvoie HTTP 402
-- `payment_required`, ce qui a cassé le tier gratuit. Groq reste
-- inaccessible à l'inscription pour certains domaines email (cf. 021).
-- Google Gemini devient donc le fournisseur du tier gratuit : pas de
-- carte bancaire, ~1500 requêtes/jour, endpoint OpenAI-compatible.

ALTER TABLE user_ai_settings
  DROP CONSTRAINT IF EXISTS user_ai_settings_ai_provider_check;

ALTER TABLE user_ai_settings
  ADD CONSTRAINT user_ai_settings_ai_provider_check
  CHECK (ai_provider IN ('gemini','cerebras','groq','openai','anthropic'));

ALTER TABLE user_ai_settings
  ALTER COLUMN ai_provider SET DEFAULT 'gemini';

-- Les comptes SANS clé BYOK utilisaient le tier gratuit serveur : leur
-- valeur 'cerebras' n'est qu'un défaut hérité, on la réaligne. Les comptes
-- AVEC clé BYOK gardent leur fournisseur : leur clé csk- leur appartient.
UPDATE user_ai_settings
  SET ai_provider = 'gemini'
  WHERE ai_provider = 'cerebras'
    AND (ai_api_key_encrypted IS NULL OR ai_api_key_encrypted = '');
