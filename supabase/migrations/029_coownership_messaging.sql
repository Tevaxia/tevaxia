-- ============================================================
-- MESSAGERIE COPROPRIÉTÉ — threads syndic<>copropriétaires (Supabase Realtime)
-- ============================================================

CREATE TABLE IF NOT EXISTS coownership_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES coownership_units(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'private' CHECK (kind IN ('private','announcement','incident')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS threads_coown_idx ON coownership_threads(coownership_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS threads_unit_idx ON coownership_threads(unit_id);

CREATE TABLE IF NOT EXISTS coownership_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES coownership_threads(id) ON DELETE CASCADE,
  author_kind TEXT NOT NULL CHECK (author_kind IN ('syndic','coproprietaire')),
  author_name TEXT,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_portal_token TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS msgs_thread_idx ON coownership_messages(thread_id, created_at);

ALTER TABLE coownership_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE coownership_messages ENABLE ROW LEVEL SECURITY;

-- Syndic peut tout voir
DROP POLICY IF EXISTS "syndic_threads" ON coownership_threads;
CREATE POLICY "syndic_threads" ON coownership_threads FOR ALL USING (
  coownership_id IN (SELECT c.id FROM coownerships c
    JOIN org_members m ON m.org_id = c.org_id
    WHERE m.user_id = auth.uid() AND m.role IN ('admin','syndic'))
);

DROP POLICY IF EXISTS "syndic_messages" ON coownership_messages;
CREATE POLICY "syndic_messages" ON coownership_messages FOR ALL USING (
  thread_id IN (SELECT id FROM coownership_threads)
);

-- Publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE coownership_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE coownership_messages;

-- RPC pour le portail copropriétaire (permet envoi message sans auth JWT)
CREATE OR REPLACE FUNCTION post_portal_message(
  p_token TEXT,
  p_body TEXT,
  p_subject TEXT DEFAULT 'Message copropriétaire'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token coownership_portal_tokens%ROWTYPE;
  v_thread_id UUID;
  v_owner_name TEXT;
BEGIN
  SELECT * INTO v_token FROM coownership_portal_tokens
    WHERE token = p_token AND revoked_at IS NULL AND expires_at > NOW();
  IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;

  SELECT owner_name INTO v_owner_name FROM coownership_units WHERE id = v_token.unit_id;

  -- Trouver ou créer le thread pour ce lot
  SELECT id INTO v_thread_id FROM coownership_threads
    WHERE coownership_id = v_token.coownership_id AND unit_id = v_token.unit_id AND kind = 'private'
    ORDER BY created_at DESC LIMIT 1;

  IF v_thread_id IS NULL THEN
    INSERT INTO coownership_threads (coownership_id, unit_id, subject, kind)
      VALUES (v_token.coownership_id, v_token.unit_id, p_subject, 'private')
      RETURNING id INTO v_thread_id;
  END IF;

  INSERT INTO coownership_messages (thread_id, author_kind, author_name, author_portal_token, body)
    VALUES (v_thread_id, 'coproprietaire', COALESCE(v_owner_name, 'Copropriétaire'), p_token, p_body);

  UPDATE coownership_threads SET last_message_at = NOW() WHERE id = v_thread_id;

  RETURN jsonb_build_object('thread_id', v_thread_id);
END;
$$;

GRANT EXECUTE ON FUNCTION post_portal_message(TEXT, TEXT, TEXT) TO anon, authenticated;
