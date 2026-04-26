import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ============================================================
// OAUTH GOOGLE CALENDAR — Callback
// ============================================================
// GET /api/oauth/google/calendar/callback?code=...
//   1. Échange code contre access_token + refresh_token
//   2. Récupère email + sub depuis userinfo
//   3. UPSERT dans calendar_oauth_integrations (lié à l'user Supabase courant)
//   4. Redirige vers /profil/calendrier?connected=google
// ============================================================

export const runtime = "nodejs";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
};

function redirectToProfile(status: "success" | "error", message?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";
  const url = new URL(`${baseUrl}/profil/calendrier`);
  url.searchParams.set("provider", "google");
  url.searchParams.set("status", status);
  if (message) url.searchParams.set("message", message);
  return NextResponse.redirect(url.toString());
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return redirectToProfile("error", error);
  }
  if (!code) {
    return redirectToProfile("error", "missing_code");
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!clientId || !clientSecret || !supabaseUrl || !supabaseAnonKey) {
    return redirectToProfile("error", "server_misconfigured");
  }

  // 1. Exchange code → tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${baseUrl}/api/oauth/google/calendar/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => "");
    console.error("Google token exchange failed", detail);
    return redirectToProfile("error", "token_exchange_failed");
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;

  // 2. Get userinfo
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return redirectToProfile("error", "userinfo_failed");
  }
  const userInfo = (await userRes.json()) as GoogleUserInfo;

  // 3. Persist in Supabase (uses authenticated user's RLS)
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirectToProfile("error", "not_authenticated");
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: upsertError } = await supabase
    .from("calendar_oauth_integrations")
    .upsert(
      {
        user_id: user.id,
        provider: "google",
        external_user_id: userInfo.sub,
        external_email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scope: tokens.scope,
        external_calendar_id: "primary",
        active: true,
        last_sync_error: null,
      },
      { onConflict: "user_id,provider,external_user_id" }
    );

  if (upsertError) {
    console.error("OAuth Google upsert failed", upsertError);
    return redirectToProfile("error", "db_save_failed");
  }

  return redirectToProfile("success");
}
