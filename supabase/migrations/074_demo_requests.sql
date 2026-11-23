-- Demo requests sent from the public product pages (syndic, PMS, rental, CRM).
-- Administrative review/application required.
-- A website deployment does NOT apply this migration. Until it is applied, the
-- form on the website reports an error and shows an e-mail link instead.
-- No existing row is deleted or rewritten by this migration.
BEGIN;

CREATE TABLE IF NOT EXISTS public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  product text NOT NULL CHECK (product IN ('syndic', 'pms', 'rental', 'crm')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  company text CHECK (company IS NULL OR char_length(company) <= 160),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  size_hint text CHECK (size_hint IS NULL OR char_length(size_hint) <= 80),
  message text CHECK (message IS NULL OR char_length(message) <= 2000),
  locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en', 'de', 'pt', 'lb')),
  page text CHECK (page IS NULL OR char_length(page) <= 200),
  -- SHA-256 of the sender address and the day: used for rate limiting only.
  ip_hash text CHECK (ip_hash IS NULL OR ip_hash ~ '^[a-f0-9]{64}$'),
  -- Follow-up state, edited by hand in the Supabase table editor.
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);

-- No policy on purpose: only the service role (the server route and the
-- Supabase dashboard) reads or writes this table.
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.demo_requests FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS demo_requests_created_at_idx ON public.demo_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS demo_requests_ip_hash_idx ON public.demo_requests (ip_hash, created_at DESC);

-- Rate-limited insert. The limits live here because the website runs on
-- short-lived server instances that share no memory.
CREATE OR REPLACE FUNCTION public.submit_demo_request(
  p_product text, p_name text, p_company text, p_email text, p_phone text,
  p_size_hint text, p_message text, p_locale text, p_page text, p_ip_hash text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
SET lock_timeout = '5s'
AS $$
DECLARE
  since timestamptz := clock_timestamp() - interval '1 hour';
BEGIN
  -- Same sender, same product, a few minutes apart: a double submission.
  IF EXISTS (
    SELECT 1 FROM public.demo_requests
    WHERE email = p_email AND product = p_product
      AND created_at > clock_timestamp() - interval '10 minutes'
  ) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;
  -- At most 5 requests per sender address and 60 for the whole site, per hour.
  IF p_ip_hash IS NOT NULL AND (
    SELECT count(*) FROM public.demo_requests WHERE ip_hash = p_ip_hash AND created_at > since
  ) >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
  END IF;
  IF (SELECT count(*) FROM public.demo_requests WHERE created_at > since) >= 60 THEN
    RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
  END IF;

  INSERT INTO public.demo_requests
    (product, name, company, email, phone, size_hint, message, locale, page, ip_hash)
  VALUES
    (p_product, p_name, p_company, p_email, p_phone, p_size_hint, p_message, p_locale, p_page, p_ip_hash);
  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_demo_request(text, text, text, text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_demo_request(text, text, text, text, text, text, text, text, text, text)
  TO service_role;

COMMIT;
