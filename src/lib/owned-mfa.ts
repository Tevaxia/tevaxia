import { supabase } from './supabase';
import { isSignedOutSession, sessionIdentity, type SessionIdentity } from './signed-out-session';

export async function captureMfaSession(owner: string, expected?: SessionIdentity | null) {
  if (!supabase) throw new Error('Session unavailable');
  const { data, error } = await supabase.auth.getSession();
  const session = data.session;
  const identity = sessionIdentity(session?.access_token);
  if (error || !session || !identity || identity.owner !== owner || isSignedOutSession(session.access_token) || (expected && expected.sessionId !== identity.sessionId)) throw new Error('Session changed');
  return { session, identity };
}

/** Enrollment/deletion uses a captured JWT; the SDK otherwise re-reads mutable storage. */
export async function ownedMfaRequest<T>(token: string, path: string, method: 'POST' | 'DELETE', body?: object): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Auth unavailable');
  const response = await fetch(`${url}/auth/v1/factors${path}`, {
    method, headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('MFA action failed');
  return response.json() as Promise<T>;
}
