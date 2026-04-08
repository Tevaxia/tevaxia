"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function Connexion() {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Detect energy subdomain + returnTo (from cookie, survives cross-domain OAuth redirect)
  const isEnergy = typeof window !== "undefined" && window.location.hostname.includes("energy");
  const returnTo = typeof window !== "undefined"
    ? (() => {
        const match = document.cookie.match(/auth_returnTo=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
      })()
    : null;

  if (!supabase) {
    return (
      <div className="bg-background py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <p className="text-muted">Authentification non configurée.</p>
        </div>
      </div>
    );
  }

  // Auto-redirect to energy subdomain after OAuth login, passing session tokens
  useEffect(() => {
    if (user && returnTo && supabase && !isEnergy) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          document.cookie = "auth_returnTo=;domain=.tevaxia.lu;path=/;max-age=0";
          const params = new URLSearchParams({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          window.location.href = `${returnTo}/connexion#${params.toString()}`;
        }
      });
    }
  }, [user, returnTo, isEnergy]);

  if (user) {
    return (
      <div className="bg-background py-16">
        <div className="mx-auto max-w-md px-4">
          <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 mx-auto mb-4">
              <svg className="h-8 w-8 text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-navy">Connecté</h2>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            {returnTo && <p className="mt-2 text-xs text-muted">Redirection en cours...</p>}
            <div className="mt-6 space-y-3">
              {returnTo ? (
                <a href={returnTo} className="block rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors">
                  Retour
                </a>
              ) : isEnergy ? (
                <Link href="/" className="block rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors">
                  Retour aux simulateurs énergie
                </Link>
              ) : (
                <Link href="/mes-evaluations" className="block rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors">
                  Mes évaluations
                </Link>
              )}
              <button onClick={signOut} className="block w-full rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-background transition-colors">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!supabase) return;

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: profession ? { data: { profession } } : undefined,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Vérifiez votre boîte mail pour confirmer votre inscription.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold text-navy-dark font-bold text-xl mx-auto">
              T
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy">
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === "login"
                ? "Accédez à vos évaluations sauvegardées"
                : "Sauvegardez vos évaluations dans le cloud"}
            </p>
          </div>

          {/* OAuth providers */}
          <div className="space-y-2 mb-6">
            <button
              onClick={async () => {
                if (!supabase) return;
                if (isEnergy) document.cookie = `auth_returnTo=${encodeURIComponent(window.location.origin)};domain=.tevaxia.lu;path=/;max-age=300;secure;samesite=lax`;
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: "https://tevaxia.lu/connexion" },
                });
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-card-border bg-white px-4 py-2.5 text-sm font-medium text-slate hover:bg-background transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>
            <button
              onClick={async () => {
                if (!supabase) return;
                await supabase.auth.signInWithOAuth({
                  provider: "linkedin_oidc",
                  options: { redirectTo: `https://tevaxia.lu/connexion${isEnergy ? "?returnTo=" + encodeURIComponent(window.location.origin) : ""}` },
                });
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-card-border bg-white px-4 py-2.5 text-sm font-medium text-slate hover:bg-background transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Continuer avec LinkedIn
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted">ou par email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="votre@email.lu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Min. 6 caractères"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-slate mb-1">Profession <span className="text-muted font-normal">(optionnel)</span></label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="evaluateur">Évaluateur immobilier</option>
                  <option value="analyste_bancaire">Analyste bancaire</option>
                  <option value="syndic">Syndic / Gestionnaire</option>
                  <option value="promoteur">Promoteur immobilier</option>
                  <option value="notaire">Notaire</option>
                  <option value="architecte">Architecte / Ingénieur</option>
                  <option value="particulier">Particulier</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-xs text-green-700">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
              className="text-sm text-navy hover:underline"
            >
              {mode === "login" ? "Pas encore de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            En créant un compte, vous acceptez nos{" "}
            <Link href="/mentions-legales" className="text-navy hover:underline">mentions légales</Link>
            {" "}et notre{" "}
            <Link href="/confidentialite" className="text-navy hover:underline">politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
