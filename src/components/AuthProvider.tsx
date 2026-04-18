"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { syncLocalToCloud } from "@/lib/storage";
import { syncLocalLotsToCloud } from "@/lib/gestion-locative";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    // Check existing session (shared via .tevaxia.lu cookies)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Track if we've already synced in this session to avoid re-running on
    // chaque TOKEN_REFRESHED / INITIAL_SESSION (déclenché ~1×/heure).
    let syncedOnce = false;

    const runBackgroundSync = () => {
      if (syncedOnce) return;
      syncedOnce = true;
      // Défère aux idle-frames : ne bloque pas la peinture initiale du layout
      // post-login (perception 200-800 ms plus rapide selon device).
      const schedule: (cb: () => void) => void =
        typeof window !== "undefined" && "requestIdleCallback" in window
          ? (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback
          : (cb) => setTimeout(cb, 0);
      schedule(() => {
        void syncLocalToCloud();
        void syncLocalLotsToCloud();
      });
    };

    // Listen for auth changes (PKCE callback, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") {
        syncedOnce = false;
      }
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.has("code")) {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
        runBackgroundSync();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
