import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAssuredUser } from './mfa-assurance';
import { sessionIdentity } from './signed-out-session';

type Provider = 'google' | 'microsoft';
interface Flow { state: string; verifier: string; owner: string; sessionId: string; issued: number }
const COOKIE_TTL = 600;
const scopes = { google: 'https://www.googleapis.com/auth/calendar.events openid email profile', microsoft: 'offline_access Calendars.ReadWrite User.Read openid email profile' };
const cookieName = (p: Provider) => `__Host-tevaxia-calendar-${p}`;
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: COOKIE_TTL };
const safeResponse = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store'); response.headers.set('Referrer-Policy', 'no-referrer'); return response;
};
function config(p: Provider) {
  const prefix = p === 'google' ? 'GOOGLE' : 'MICROSOFT';
  const id = process.env[`${prefix}_OAUTH_CLIENT_ID`], secret = process.env[`${prefix}_OAUTH_CLIENT_SECRET`];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!id || !secret || !url || !key) throw new Error('Configuration unavailable');
  const base = new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://tevaxia.lu').origin;
  const tenant = encodeURIComponent(process.env.MICROSOFT_OAUTH_TENANT || 'common');
  return { id, secret, url, key, base, redirect: `${base}/api/oauth/${p}/calendar/callback`,
    authorize: p === 'google' ? 'https://accounts.google.com/o/oauth2/v2/auth' : `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    token: p === 'google' ? 'https://oauth2.googleapis.com/token' : `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    userinfo: p === 'google' ? 'https://www.googleapis.com/oauth2/v3/userinfo' : 'https://graph.microsoft.com/v1.0/me',
  };
}
const sign = (body: string, p: Provider, secret: string) => createHmac('sha256', secret).update(`${p}:${body}`).digest('base64url');
export function encodeCalendarFlow(flow: Flow, p: Provider, secret: string) {
  const body = Buffer.from(JSON.stringify(flow)).toString('base64url'); return `${body}.${sign(body, p, secret)}`;
}
export function decodeCalendarFlow(raw: string | undefined, state: string | null, p: Provider, secret: string, now = Date.now()): Flow | null {
  try {
    if (!raw || raw.length > 4096 || !state || !/^[A-Za-z0-9_-]{43}$/.test(state)) return null;
    const [body, signature, extra] = raw.split('.');
    const expected = sign(body, p, secret);
    if (extra || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const flow: Flow = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (flow.state !== state || !/^[A-Za-z0-9_-]{43}$/.test(flow.verifier) || typeof flow.owner !== 'string' || typeof flow.sessionId !== 'string' || !Number.isFinite(flow.issued) || flow.issued > now || now - flow.issued >= COOKIE_TTL * 1000) return null;
    return flow;
  } catch { return null; }
}
async function auth(c: ReturnType<typeof config>) {
  const jar = await cookies();
  // The browser owns session renewal. An OAuth response must not overwrite a newer login's cookies.
  const client = createServerClient(c.url, c.key, { cookies: { getAll: () => jar.getAll(), setAll: () => {} } });
  const snapshot = await client.auth.getSession();
  const token = snapshot.data.session?.access_token;
  if (snapshot.error || !token) return null;
  const verified = await getAssuredUser(client, token), identity = sessionIdentity(token);
  if (verified.error || !verified.data.user || !identity || identity.owner !== verified.data.user.id) return null;
  return { client, identity, jar };
}
export async function startCalendarOAuth(provider: Provider) {
  try {
    const c = config(provider), current = await auth(c);
    if (!current) return safeResponse(NextResponse.json({ error: 'Authentication and MFA verification required' }, { status: 401 }));
    const flow: Flow = { state: randomBytes(32).toString('base64url'), verifier: randomBytes(32).toString('base64url'), owner: current.identity.owner, sessionId: current.identity.sessionId, issued: Date.now() };
    const url = new URL(c.authorize);
    for (const [key, value] of Object.entries({ client_id: c.id, redirect_uri: c.redirect, response_type: 'code', scope: scopes[provider], state: flow.state, prompt: 'consent' })) url.searchParams.set(key, value);
    if (provider === 'google') { url.searchParams.set('access_type', 'offline'); url.searchParams.set('include_granted_scopes', 'true'); }
    else {
      url.searchParams.set('response_mode', 'query'); url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('code_challenge', createHash('sha256').update(flow.verifier).digest('base64url'));
    }
    const response = safeResponse(NextResponse.redirect(url));
    response.cookies.set(cookieName(provider), encodeCalendarFlow(flow, provider, c.secret), cookieOptions);
    return response;
  } catch { return safeResponse(NextResponse.json({ error: 'Calendar connection unavailable' }, { status: 503 })); }
}
export async function finishCalendarOAuth(provider: Provider, request: Request) {
  const base = new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://tevaxia.lu').origin;
  const finish = (status: 'success' | 'error', message?: string) => {
    const url = new URL('/profil/calendrier', base); url.searchParams.set('provider', provider); url.searchParams.set('status', status);
    if (message) url.searchParams.set('message', message);
    const response = safeResponse(NextResponse.redirect(url));
    response.cookies.set(cookieName(provider), '', { ...cookieOptions, maxAge: 0 }); return response;
  };
  try {
    const c = config(provider), query = new URL(request.url).searchParams, current = await auth(c);
    if (!current) return finish('error', 'not_authenticated');
    const flow = decodeCalendarFlow(current.jar.get(cookieName(provider))?.value, query.get('state'), provider, c.secret);
    if (!flow || flow.owner !== current.identity.owner || flow.sessionId !== current.identity.sessionId) return finish('error', 'invalid_state');
    if (query.has('error')) return finish('error', 'consent_declined');
    const code = query.get('code'); if (!code || code.length > 4096) return finish('error', 'missing_code');
    const body = new URLSearchParams({ code, client_id: c.id, client_secret: c.secret, redirect_uri: c.redirect, grant_type: 'authorization_code' });
    if (provider === 'microsoft') body.set('code_verifier', flow.verifier);
    const tokenRes = await fetch(c.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!tokenRes.ok) return finish('error', 'token_exchange_failed');
    const tokens = await tokenRes.json();
    if (typeof tokens.access_token !== 'string' || !tokens.access_token || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0 || tokens.expires_in > 31_536_000) return finish('error', 'invalid_provider_response');
    const userRes = await fetch(c.userinfo, { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!userRes.ok) return finish('error', 'userinfo_failed');
    const user = await userRes.json(), externalId = provider === 'google' ? user.sub : user.id;
    const email = provider === 'google' ? user.email : user.mail || user.userPrincipalName;
    if (typeof externalId !== 'string' || !externalId || typeof email !== 'string') return finish('error', 'invalid_provider_response');
    const row = { user_id: current.identity.owner, provider, external_user_id: externalId, external_email: email,
      access_token: tokens.access_token, ...(typeof tokens.refresh_token === 'string' && tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(), scope: typeof tokens.scope === 'string' ? tokens.scope : '',
      external_calendar_id: provider === 'google' ? 'primary' : 'default', active: true, last_sync_error: null };
    // Omitting refresh_token on reconnect preserves the stored value when the provider does not issue another.
    const { error } = await current.client.from('calendar_oauth_integrations').upsert(row, { onConflict: 'user_id,provider,external_user_id' });
    if (error) return finish('error', 'db_save_failed');
    return finish('success');
  } catch { return finish('error', 'connection_failed'); }
}
