-- ============================================================
-- USER PROFILE TYPES — multi-select pour filtrer le dashboard
-- ============================================================
-- Chaque utilisateur peut cocher un ou plusieurs profils qui
-- le décrivent (particulier / expert / syndic / hôtelier / …),
-- ce qui filtre la grille 'Mes espaces' sur /profil.
--
-- NULL ou tableau vide = tous les espaces affichés (default).

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS profile_types TEXT[];

-- Contrainte de validation : valeurs autorisées seulement
ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_profile_types_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_profile_types_check
  CHECK (
    profile_types IS NULL
    OR profile_types <@ ARRAY[
      'particulier','expert','syndic','hotelier','investisseur',
      'agence','promoteur','api'
    ]::TEXT[]
  );
