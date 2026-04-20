-- ============================================================
-- BACKUP HISTORY — historique des sauvegardes utilisateur
-- ============================================================
-- Trace chaque export (download local ou Drive) pour afficher
-- "dernière sauvegarde il y a X jours" et déclencher le rappel auto.
--
-- Pas de données sensibles : juste module + destination + compteurs.

CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  destination TEXT NOT NULL CHECK (destination IN ('download','drive')),
  counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_history_user_created
  ON backup_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_history_user_module
  ON backup_history (user_id, module, created_at DESC);

-- RLS : user ne voit que ses propres backups
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_history_own_select"
  ON backup_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "backup_history_own_insert"
  ON backup_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "backup_history_own_delete"
  ON backup_history FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE backup_history IS 'Historique des sauvegardes user (module + destination + compteurs).';
