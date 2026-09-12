import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getAssuredUser, requiresMfaChallenge } from '../mfa-assurance';

const token = (aal: string) => `header.${Buffer.from(JSON.stringify({ aal })).toString('base64url')}.signature`;
const factor = (status: 'verified' | 'unverified', factor_type = 'totp') => ({ id: 'factor', status, factor_type }) as NonNullable<User['factors']>[number];
const user = (factors?: User['factors']) => ({ id: 'owner', factors }) as User;
const client = (u: User | null, error: unknown = null) => {
  const getUser = vi.fn(async () => ({ data: { user: u }, error }));
  const getSession = vi.fn(async () => ({ data: { session: { access_token: token('aal1') } }, error: null }));
  return { instance: { auth: { getUser, getSession } } as unknown as SupabaseClient, getUser, getSession };
};
describe('MFA assurance on server-verified sessions', () => {
  it('keeps MFA optional until a factor is verified', () => {
    expect(requiresMfaChallenge(user(), token('aal1'))).toBe(false);
    expect(requiresMfaChallenge(user([factor('unverified')]), token('aal1'))).toBe(false);
  });
  it.each(['aal1', '', 'aal3'])('requires a challenge for a verified factor and level %s', aal => {
    expect(requiresMfaChallenge(user([factor('verified')]), token(aal))).toBe(true);
  });
  it('accepts AAL2 for any verified factor type, including future phone support', () => {
    expect(requiresMfaChallenge(user([factor('verified', 'phone')]), token('aal2'))).toBe(false);
  });
  it('fails closed on malformed claims when MFA is active', () => {
    expect(requiresMfaChallenge(user([factor('verified')]), 'broken')).toBe(true);
  });
  it('does not trust a forged aal2 claim when Auth rejects its token', async () => {
    const c = client(null, new Error('bad signature'));
    expect((await getAssuredUser(c.instance, token('aal2'))).data.user).toBeNull();
  });
  it('verifies the exact bearer token and rejects AAL1 before privileged access', async () => {
    const c = client(user([factor('verified')])), jwt = token('aal1');
    const result = await getAssuredUser(c.instance, jwt);
    expect(c.getUser).toHaveBeenCalledWith(jwt);
    expect(c.getSession).not.toHaveBeenCalled();
    expect(result.data.user).toBeNull();
    expect(result.error?.code).toBe('mfa_required');
  });
  it('allows a verified AAL2 bearer', async () => {
    const c = client(user([factor('verified')]));
    expect((await getAssuredUser(c.instance, token('aal2'))).data.user?.id).toBe('owner');
  });
  it('uses the SSR cookie session when no bearer was supplied', async () => {
    const c = client(user([factor('verified')]));
    expect((await getAssuredUser(c.instance)).error?.code).toBe('mfa_required');
    expect(c.getUser).toHaveBeenCalledWith(token('aal1'));
  });
  it('fails closed if the Auth service is unavailable', async () => {
    const c = client(user()); c.getUser.mockRejectedValueOnce(new Error('offline'));
    expect((await getAssuredUser(c.instance, token('aal1'))).data.user).toBeNull();
  });
});
