"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { DELETED_AUTH_EVENT, DELETED_AUTH_PREFIX, visibleAuthUser, type DeletedAuthNotice } from "@/lib/deleted-auth-owner";
import { SIGNED_OUT_EVENT, SIGNED_OUT_PREFIX, isSignedOutSession, sessionIdentity, type SessionIdentity } from "@/lib/signed-out-session";
import { signOutOwnedSession } from "@/lib/sign-out-owned-session";
import type { Session, User } from "@supabase/supabase-js";
import MfaGate from './MfaGate';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signingOut: boolean;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signingOut: false, signOut: async () => {}, signOutAll: async () => {} });
export function useAuth() { return useContext(AuthContext); }

export default function AuthProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const [sessionSnapshot, setSessionSnapshot] = useState<Session | null>(null);
  const user = sessionSnapshot?.user ?? null;
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const busy = useRef(false);
  const currentSession = useRef<Session | null>(null);
  const [deletionNotice, setDeletionNotice] = useState("");
  const [logoutNotice, setLogoutNotice] = useState<{ key: string; error: boolean } | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true, receivedAuthEvent = false, revision = 0;
    const receiveSession = (incoming: Session | null) => {
      // A late notification from a retired session must not hide a newer login.
      if (incoming && !visibleAuthUser(incoming.user)) {
        if (currentSession.current?.user.id !== incoming.user.id) return false;
        incoming = null;
      }
      if (incoming && isSignedOutSession(incoming.access_token)) {
        if (sessionIdentity(currentSession.current?.access_token)?.sessionId !== sessionIdentity(incoming.access_token)?.sessionId) return false;
        incoming = null;
      }
      revision++;
      currentSession.current = incoming;
      setSessionSnapshot(currentSession.current);
      if (currentSession.current) { setDeletionNotice(""); setLogoutNotice(null); }
      return true;
    };
    const refreshAfterLogout = () => {
      const snapshotRevision = revision;
      void client.auth.getSession().then(({ data, error }) => {
        if (active && revision === snapshotRevision && !error) receiveSession(data.session);
      }).catch(() => {});
    };
    const onDeleted = (event: Event) => {
      const notice = (event as CustomEvent<DeletedAuthNotice>).detail;
      if (notice?.owner !== currentSession.current?.user.id) return;
      setDeletionNotice(notice.message); receiveSession(null);
    };
    const onSignedOut = (event: Event) => {
      const notice = (event as CustomEvent<SessionIdentity>).detail;
      const identity = sessionIdentity(currentSession.current?.access_token);
      if (!identity || notice?.owner !== identity.owner || notice.sessionId !== identity.sessionId) return;
      receiveSession(null); refreshAfterLogout();
    };
    const onStorage = (event: StorageEvent) => {
      const session = currentSession.current;
      if (!session) return;
      if (event.key?.startsWith(DELETED_AUTH_PREFIX) && !visibleAuthUser(session.user)) receiveSession(null);
      if (event.key?.startsWith(SIGNED_OUT_PREFIX) && isSignedOutSession(session.access_token)) { receiveSession(null); refreshAfterLogout(); }
    };
    window.addEventListener(DELETED_AUTH_EVENT, onDeleted);
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    window.addEventListener("storage", onStorage);
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "INITIAL_SESSION" && receivedAuthEvent) return;
      if (receiveSession(session)) receivedAuthEvent = true;
      setLoading(false);
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        const params = new URLSearchParams(window.location.search);
        if (params.has("code")) window.history.replaceState({}, "", window.location.pathname);
      }
    });
    void client.auth.getSession().then(({ data: { session } }) => {
      if (active && !receivedAuthEvent) receiveSession(session);
    }).catch(() => {
      if (active && !receivedAuthEvent) receiveSession(null);
    }).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.removeEventListener(DELETED_AUTH_EVENT, onDeleted);
      window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
      window.removeEventListener("storage", onStorage);
      subscription.unsubscribe();
    };
  }, []);

  const renderedIdentity = sessionIdentity(sessionSnapshot?.access_token);
  const logout = async (scope: 'local' | 'global') => {
    if (busy.current) return;
    const expected = renderedIdentity;
    if (expected && expected.owner !== user?.id) return;
    if (!expected) { setLogoutNotice({ key: 'signOutFailed', error: true }); return; }
    const stillCurrent = () => {
      const now = sessionIdentity(currentSession.current?.access_token);
      return now?.owner === expected.owner && now.sessionId === expected.sessionId;
    };
    busy.current = true; setSigningOut(true); setLogoutNotice(null);
    try {
      const result = await signOutOwnedSession(expected, scope, stillCurrent);
      const now = sessionIdentity(currentSession.current?.access_token);
      if (result.accountChanged || (now && now.sessionId !== expected.sessionId)) return;
      setLogoutNotice({ key: !result.localCleared ? 'signOutFailed' : !result.serverRevoked ? 'signOutRemoteUnconfirmed' : !result.remembered ? 'signOutSyncUnconfirmed' : scope === 'global' ? 'signedOutAll' : 'signedOut', error: !result.localCleared || !result.serverRevoked || !result.remembered });
    } catch {
      if (stillCurrent()) setLogoutNotice({ key: 'signOutFailed', error: true });
    } finally { busy.current = false; setSigningOut(false); }
  };
  const signOut = () => logout('local');
  const signOutAll = () => logout('global');
  return <AuthContext.Provider value={{ user, loading, signingOut, signOut, signOutAll }}>
    {deletionNotice && <p role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 [overflow-wrap:anywhere]">{deletionNotice}</p>}
    {logoutNotice && <p role={logoutNotice.error ? 'alert' : 'status'} className="border-b border-card-border bg-card px-4 py-3 text-sm [overflow-wrap:anywhere]">{t(logoutNotice.key)}</p>}
    {sessionSnapshot ? <MfaGate key={renderedIdentity?.sessionId ?? sessionSnapshot.access_token} session={sessionSnapshot} signOut={signOut} signingOut={signingOut}>{children}</MfaGate> : children}
  </AuthContext.Provider>;
}
