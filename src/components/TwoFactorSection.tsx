"use client";

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { captureMfaSession, ownedMfaRequest } from '@/lib/owned-mfa';
import type { SessionIdentity } from '@/lib/signed-out-session';

export default function TwoFactorSection() {
  const { user } = useAuth();
  return user && supabase ? <OwnedTwoFactorSection key={user.id} owner={user.id} /> : null;
}

function OwnedTwoFactorSection({ owner }: { owner: string }) {
  const t = useTranslations('profil.mfa'), locale = useLocale();
  const [factors, setFactors] = useState<NonNullable<User['factors']>>([]);
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false);
  const [enrolling, setEnrolling] = useState(false), [code, setCode] = useState('');
  const [setup, setSetup] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [friendlyName, setFriendlyName] = useState(''), [error, setError] = useState(false);
  const busy = useRef(false), alive = useRef(true), expected = useRef<SessionIdentity | null>(null);
  const refresh = async () => {
    const snapshot = await captureMfaSession(owner, expected.current);
    const result = await supabase!.auth.getUser(snapshot.session.access_token);
    if (result.error || result.data.user?.id !== owner) throw new Error('Session');
    await captureMfaSession(owner, snapshot.identity);
    if (alive.current) { expected.current = snapshot.identity; setFactors(result.data.user.factors ?? []); }
  };
  useEffect(() => {
    alive.current = true;
    void refresh().catch(() => { if (alive.current) setError(true); }).finally(() => { if (alive.current) setLoading(false); });
    return () => { alive.current = false; };
    // This instance is remounted on account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  const run = async (action: () => Promise<void>) => {
    if (busy.current || !alive.current) return;
    busy.current = true; setPending(true); setError(false);
    try { await action(); }
    catch { if (alive.current) setError(true); }
    finally { busy.current = false; if (alive.current) setPending(false); }
  };
  const clear = () => { setSetup(null); setCode(''); setFriendlyName(''); setEnrolling(false); };
  const start = () => run(async () => {
    const { session, identity } = await captureMfaSession(owner, expected.current);
    const result = await ownedMfaRequest<{ id: string; totp: { qr_code: string; secret: string } }>(session.access_token, '', 'POST', { factor_type: 'totp', friendly_name: friendlyName.trim() || `Tevaxia ${new Date().toISOString().slice(0, 10)}` });
    try {
      await captureMfaSession(owner, identity);
      if (!alive.current) throw new Error('Unmounted');
      setSetup({ id: result.id, qr: result.totp.qr_code, secret: result.totp.secret });
    } catch {
      // Only the newly created, still unverified factor from this operation.
      await ownedMfaRequest(session.access_token, `/${encodeURIComponent(result.id)}`, 'DELETE');
      throw new Error('Session changed');
    }
  });
  const remove = (id: string, cancelSetup = false) => run(async () => {
    const { session } = await captureMfaSession(owner, expected.current);
    await ownedMfaRequest(session.access_token, `/${encodeURIComponent(id)}`, 'DELETE');
    if (alive.current && cancelSetup) clear();
    await refresh();
  });
  const verify = () => run(async () => {
    if (!setup || !/^\d{6}$/.test(code)) return;
    await captureMfaSession(owner, expected.current);
    const challenge = await supabase!.auth.mfa.challenge({ factorId: setup.id });
    if (challenge.error) throw challenge.error;
    await captureMfaSession(owner, expected.current);
    const result = await supabase!.auth.mfa.verify({ factorId: setup.id, challengeId: challenge.data.id, code });
    if (result.error) throw result.error;
    if (alive.current) clear();
    await refresh();
  });
  const active = factors.filter(f => f.status === 'verified');
  const incomplete = factors.filter(f => f.status === 'unverified' && f.factor_type === 'totp' && f.id !== setup?.id);
  return <section className="rounded-xl border border-card-border bg-card p-6 shadow-sm" aria-busy={loading || pending}>
    <h2 className="text-base font-semibold text-navy">{t('title')}</h2>
    <p className="mt-1 text-xs text-muted">{t('desc')}</p>
    {loading ? <p className="mt-4" role="status">{t('loading')}</p> : <>
      {active.map(f => <div key={f.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <div><p className="text-sm font-medium">{f.friendly_name || t('unnamedFactor')} · {t('enabled')}</p><p className="text-xs text-muted">{t('addedOn')} {new Date(f.created_at).toLocaleDateString(locale)}</p></div>
        <button disabled={pending} onClick={() => { if (confirm(t('unenrollConfirm'))) void remove(f.id); }} className="rounded border border-rose-200 px-3 py-2 text-xs text-rose-700 disabled:opacity-50">{t('unenroll')}</button>
      </div>)}
      {incomplete.map(f => <div key={f.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs"><span>{f.friendly_name || t('unnamedFactor')} · {t('incomplete')}</span><button disabled={pending} onClick={() => void remove(f.id)}>{t('removeIncomplete')}</button></div>)}
      {!enrolling && !active.length && !error && <button disabled={pending} onClick={() => setEnrolling(true)} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm text-white">{t('enable')}</button>}
      {enrolling && <div className="mt-4 rounded-lg border bg-background p-4">
        {!setup ? <>
          <p className="text-sm font-medium">{t('enrollStep1Title')}</p><p className="mt-1 text-xs">{t('enrollStep1Desc')}</p>
          <label className="mt-3 block text-xs" htmlFor="mfa-factor-name">{t('factorLabel')}</label>
          <input id="mfa-factor-name" className="mt-1 w-full rounded border p-2" maxLength={100} value={friendlyName} disabled={pending} onChange={e => setFriendlyName(e.target.value)} placeholder={t('friendlyNamePlaceholder')} />
          <div className="mt-3 flex flex-wrap gap-4"><button disabled={pending} onClick={clear}>{t('cancel')}</button><button disabled={pending} onClick={() => void start()}>{pending ? t('loading') : t('continue')}</button></div>
        </> : <>
          <p className="text-sm font-medium">{t('enrollStep2Title')}</p><p className="mt-1 text-xs">{t('enrollStep2Desc')}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element -- Authenticator QR supplied by Supabase Auth. */}
            <img src={setup.qr.startsWith('data:') ? setup.qr : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr)}`} alt={t('factorLabel')} className="h-40 w-40 rounded border bg-white p-2" />
            <div className="min-w-0"><p className="text-xs">{t('secretFallback')}</p><code className="mt-1 block break-all rounded border bg-white p-2 text-xs">{setup.secret}</code></div>
          </div>
          <form className="mt-4" onSubmit={e => { e.preventDefault(); void verify(); }}>
            <label className="block text-xs" htmlFor="mfa-enroll-code">{t('codeLabel')}</label>
            <input id="mfa-enroll-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} disabled={pending} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded border p-2 font-mono tracking-widest" required />
            <div className="mt-4 flex flex-wrap gap-4"><button type="button" disabled={pending} onClick={() => void remove(setup.id, true)}>{t('cancel')}</button><button disabled={pending || code.length !== 6}>{pending ? t('loading') : t('verify')}</button></div>
          </form>
        </>}
      </div>}
    </>}
    {error && <div className="mt-3 text-sm"><p role="alert" className="text-rose-700">{t('actionFailed')}</p><button disabled={pending} className="mt-2 underline" onClick={() => void run(refresh)}>{t('retry')}</button></div>}
  </section>;
}
