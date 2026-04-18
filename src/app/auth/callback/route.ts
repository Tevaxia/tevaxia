import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OAuth callback handler côté serveur.
 *
 * Supabase envoie ici le code OAuth (?code=...) après retour du provider
 * (Google, LinkedIn, etc.). L'échange code → session se fait en SSR sur le
 * premier octet : le cookie de session est posé avant que React hydrate,
 * l'utilisateur arrive sur la page de destination déjà connecté.
 *
 * Gain vs échange client-side : 1-3 s de perception (pas d'attente que
 * React monte + useEffect + fetch /token + setState).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/mes-evaluations";

  if (!code) {
    return NextResponse.redirect(new URL("/connexion?error=no_code", url.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/connexion?error=not_configured", url.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            cookieStore.set({
              name,
              value,
              ...options,
              domain: ".tevaxia.lu",
              path: "/",
              sameSite: "lax",
              secure: true,
            });
          }
        } catch {
          // Appelé dans un contexte read-only (RSC) : ignoré.
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/connexion?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
