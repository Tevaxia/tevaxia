-- ============================================================
-- SIGNATURES DE RAPPORTS DE VALORISATION (audit trail léger)
-- ============================================================
-- Pour opposabilité light sans eIDAS : enregistrement horodaté d'un
-- hash SHA-256 des données d'un rapport EVS. Le destinataire peut
-- vérifier l'intégrité via /verify?hash=<sha256>.
--
-- Pas équivalent à une signature électronique qualifiée eIDAS (LuxTrust/
-- QTSP), mais fournit une piste d'audit horodatée hors manipulation
-- possible par l'utilisateur après signature.

create table if not exists valuation_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hash text not null, -- SHA-256 hex du payload canonique
  report_type text not null default 'evs2025', -- 'evs2025', 'hedonique', 'mlv', 'dcf-multi'
  report_title text,
  evaluator_name text,
  evaluator_qualif text, -- 'TEGOVA', 'RICS', 'expert agréé CSSF', ...
  payload_summary jsonb default '{}'::jsonb, -- résumé (pas tout le payload)
  signed_at timestamptz not null default now(),
  revoked_at timestamptz,
  revocation_reason text,
  unique (user_id, hash)
);

create index if not exists valuation_sig_hash_idx on valuation_signatures(hash);
create index if not exists valuation_sig_user_idx on valuation_signatures(user_id, signed_at desc);

alter table valuation_signatures enable row level security;

-- L'utilisateur voit ses propres signatures
create policy "users_view_own_signatures" on valuation_signatures
  for select using (user_id = auth.uid());

create policy "users_create_own_signatures" on valuation_signatures
  for insert with check (user_id = auth.uid());

create policy "users_revoke_own_signatures" on valuation_signatures
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- RPC public pour vérifier un hash (sans authentification)
-- Renvoie les métadonnées si le hash existe et n'est pas révoqué
create or replace function verify_signature(p_hash text)
returns jsonb language plpgsql security definer as $$
declare
  sig valuation_signatures%rowtype;
begin
  select * into sig from valuation_signatures where hash = p_hash order by signed_at desc limit 1;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  if sig.revoked_at is not null then
    return jsonb_build_object(
      'found', true,
      'revoked', true,
      'revoked_at', sig.revoked_at,
      'revocation_reason', sig.revocation_reason
    );
  end if;
  return jsonb_build_object(
    'found', true,
    'revoked', false,
    'signed_at', sig.signed_at,
    'report_type', sig.report_type,
    'report_title', sig.report_title,
    'evaluator_name', sig.evaluator_name,
    'evaluator_qualif', sig.evaluator_qualif,
    'payload_summary', sig.payload_summary
  );
end;
$$;

grant execute on function verify_signature(text) to anon, authenticated;
