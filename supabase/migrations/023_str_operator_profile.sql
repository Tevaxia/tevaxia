-- ============================================================
-- STR OPERATOR — nouveau profile_type pour les exploitants
-- ============================================================
-- Ajoute 'str_operator' au CHECK de user_preferences.profile_types
-- pour couvrir les hôtes Airbnb/Booking/Vrbo au Luxembourg.

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_profile_types_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_profile_types_check
  CHECK (
    profile_types IS NULL
    OR profile_types <@ ARRAY[
      'particulier','expert','syndic','hotelier','investisseur',
      'agence','promoteur','api','str_operator'
    ]::TEXT[]
  );
