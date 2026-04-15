-- ============================================================
-- SUPPRESSION DE COMPTE self-service (RGPD Art. 17)
-- ============================================================
-- Fonction sécurisée : l'utilisateur connecté supprime son propre
-- compte. Cascade automatique vers toutes les tables rattachées
-- (valuations, rental_lots, market_alerts, shared_links, api_keys,
-- user_tiers, user_profiles, org_members…) via les contraintes
-- ON DELETE CASCADE déjà définies sur auth.users(id).

CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid UUID;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- La suppression de auth.users cascade automatiquement sur
  -- toutes les tables liées par FK ON DELETE CASCADE.
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Accessible aux utilisateurs connectés uniquement
REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;
