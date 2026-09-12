"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { requiresMfaChallenge } from '@/lib/mfa-assurance';
import { sessionIdentity, isSignedOutSession } from '@/lib/signed-out-session';

type State = { status: 'checking' | 'ready' | 'challenge' | 'error'; factors: { id: string; name: string }[] };

/** Mounted per auth session. Token renewal preserves unsaved forms; account changes reset the gate. */
export default function MfaGate({ session, children, signOut, signingOut }: {
  session: Session; children: ReactNode; signOut: () => Promise<void>; signingOut: boolean;
}) {
  const t = useTranslations('authMfa');
  const [state, setState] = useState<State>({ status: 'checking', factors: [] });
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    const inspect = async () => {
      const client = supabase;
      if (!client || isSignedOutSession(session.access_token)) throw new Error('session');
      const { data, error } = await client.auth.getUser(session.access_token);
      if (error || data.user?.id !== session.user.id) throw new Error('session');
      const needed = requiresMfaChallenge(data.user, session.access_token);
      const factors = (data.user.factors ?? []).filter(f => f.status === 'verified' && f.factor_type === 'totp').map(f => ({ id: f.id, name: f.friendly_name || t('unnamedFactor') }));
      if (active) {
        setState({ status: needed ? 'challenge' : 'ready', factors });
        setSelected(factors[0]?.id ?? '');
      }
    };
    void inspect().catch(() => { if (active) setState({ status: 'error', factors: [] }); });
    return () => { active = false; };
  }, [session.access_token, session.user.id, attempt, t]);

  const verify = async () => {
    const client = supabase;
    if (!client || busy.current || !/^\d{6}$/.test(code) || !state.factors.some(f => f.id === selected)) return;
    const expected = sessionIdentity(session.access_token);
    const check = async () => {
      const current = await client.auth.getSession();
      const identity = sessionIdentity(current.data.session?.access_token);
      if (!mounted.current || current.error || !expected || identity?.owner !== expected.owner || identity.sessionId !== expected.sessionId || isSignedOutSession(session.access_token)) throw new Error('session');
    };
    busy.current = true; setPending(true); setError(false);
    try {
      await check();
      const challenge = await client.auth.mfa.challenge({ factorId: selected });
      if (challenge.error) throw challenge.error;
      await check();
      // The SDK holds its shared auth lock throughout verify and session persistence.
      // The factor ID also binds the operation to its original account on the server.
      const verified = await client.auth.mfa.verify({ factorId: selected, challengeId: challenge.data.id, code });
      if (verified.error) throw verified.error;
      if (mounted.current) { setCode(''); setAttempt(n => n + 1); }
      // AuthProvider receives MFA_CHALLENGE_VERIFIED and inspects the upgraded token.
    } catch { if (mounted.current) setError(true); }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };

  if (state.status === 'ready') return children;
  return <main className="mx-auto my-12 w-full max-w-lg px-4">
    <section className="rounded-xl border border-card-border bg-card p-6 shadow-sm" aria-busy={pending || state.status === 'checking'}>
      <h1 className="text-xl font-semibold">{t('challengeTitle')}</h1>
      {state.status === 'checking' ? <p role="status" className="mt-4">{t('loading')}</p> : <>
        <p className="mt-3 text-sm">{state.status === 'error' ? t('checkFailed') : t('challengeDesc')}</p>
        {state.status === 'challenge' && state.factors.length > 0 && <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); void verify(); }}>
          {state.factors.length > 1 && <label className="block">{t('factorLabel')}<select className="mt-1 w-full rounded border p-2" value={selected} disabled={pending} onChange={e => { setSelected(e.target.value); setCode(''); }}>{state.factors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
          <label className="block" htmlFor="mfa-login-code">{t('codeLabel')}</label>
          <input id="mfa-login-code" className="w-full rounded-lg border p-3 font-mono tracking-widest" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} disabled={pending} required />
          <button className="w-full rounded-lg bg-navy px-4 py-3 text-white disabled:opacity-50" disabled={pending || code.length !== 6}>{pending ? t('loading') : t('verify')}</button>
        </form>}
        {state.status === 'challenge' && !state.factors.length && <p className="mt-4" role="alert">{t('unsupportedFactor')}</p>}
        {error && <p className="mt-3 text-rose-700" role="alert">{t('verifyFailed')}</p>}
        <div className="mt-4 flex flex-wrap gap-4">
          <button disabled={pending} onClick={() => { setState({ status: 'checking', factors: [] }); setAttempt(n => n + 1); }}>{t('retry')}</button>
          <button disabled={signingOut || pending} onClick={() => void signOut()}>{t('signOut')}</button>
        </div>
      </>}
    </section>
  </main>;
}
