import { stringFromBase64URL } from '@supabase/ssr';
import { AuthError, type SupabaseClient, type User } from '@supabase/supabase-js';

/** The user MUST come from Auth.getUser(jwt), never client metadata or a decoded JWT.
 * Decoding aal alone is not authentication: getUser verifies this exact token first.
 */
export function requiresMfaChallenge(user: Pick<User, 'factors'>, verifiedToken: string): boolean {
  if (!user.factors?.some(factor => factor.status === 'verified')) return false;
  try {
    const claims = JSON.parse(stringFromBase64URL(verifiedToken.split('.')[1]));
    return claims.aal !== 'aal2';
  } catch { return true; }
}

/** Shared boundary for session-backed server APIs, including service-role readers. */
export async function getAssuredUser(client: SupabaseClient, token?: string) {
  try {
    const jwt = token ?? (await client.auth.getSession()).data.session?.access_token;
    const result = await client.auth.getUser(jwt);
    if (result.error || !result.data.user) return result;
    if (requiresMfaChallenge(result.data.user, jwt ?? '')) {
      return { data: { user: null }, error: new AuthError('MFA verification required', 403, 'mfa_required') };
    }
    return result;
  } catch {
    return { data: { user: null }, error: new AuthError('Session verification unavailable', 503, 'session_unavailable') };
  }
}
