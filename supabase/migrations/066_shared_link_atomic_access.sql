-- Requires migrations 005, 033 and 034. Administrative review/application required.
-- A website deployment does NOT apply this migration.
-- No rows are deleted or rewritten by this migration.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_shared_link(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
SET lock_timeout = '5s'
AS $$
DECLARE
  link public.shared_links%ROWTYPE;
  access_time timestamptz;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{48}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  -- Serialize admission, increments and deletion of this one access link.
  SELECT * INTO link FROM public.shared_links WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  -- now() is the transaction-start time, potentially before waiting for the lock.
  access_time := clock_timestamp();
  IF link.expires_at <= access_time THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;
  IF link.view_count >= 2147483647 OR (link.max_views IS NOT NULL AND link.view_count >= link.max_views) THEN
    RETURN jsonb_build_object('success', false, 'error', 'view_limit_reached');
  END IF;

  UPDATE public.shared_links SET view_count = view_count + 1
    WHERE id = link.id RETURNING * INTO link;
  -- Both writes commit or roll back together. Do not swallow a journal error.
  INSERT INTO public.shared_link_views(link_id, viewed_at) VALUES (link.id, access_time);
  RETURN jsonb_build_object(
    'success', true, 'tool_type', link.tool_type, 'title', link.title,
    'payload', link.payload, 'view_count', link.view_count, 'expires_at', link.expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.post_shared_link_comment(
  p_token text, p_message text, p_visitor_name text DEFAULT NULL, p_visitor_email text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
SET lock_timeout = '5s'
AS $$
DECLARE
  link public.shared_links%ROWTYPE;
  comment_time timestamptz;
BEGIN
  IF p_message IS NULL OR length(btrim(p_message)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_message');
  END IF;
  IF length(p_message) > 4000 OR length(coalesce(p_visitor_name, '')) > 100
      OR length(coalesce(p_visitor_email, '')) > 200 THEN
    RETURN jsonb_build_object('success', false, 'error', 'message_too_long');
  END IF;
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{48}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  -- All comment admissions for one token take the same lock before checking time.
  SELECT * INTO link FROM public.shared_links WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  comment_time := clock_timestamp();
  IF link.expires_at <= comment_time THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;
  IF EXISTS (SELECT 1 FROM public.shared_link_comments
      WHERE link_id = link.id AND created_at > comment_time - interval '1 minute') THEN
    RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
  END IF;
  -- A view cap restricts calculation reads, not commenting on an already opened
  -- calculation. Preserve this existing distinction; expiry/deletion still deny.
  INSERT INTO public.shared_link_comments(link_id, visitor_name, visitor_email, message, created_at)
  VALUES (link.id, nullif(btrim(coalesce(p_visitor_name, '')), ''),
    nullif(btrim(coalesce(p_visitor_email, '')), ''), btrim(p_message), comment_time);
  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_link(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.post_shared_link_comment(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_link(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_shared_link_comment(text, text, text, text) TO anon, authenticated;
COMMIT;
