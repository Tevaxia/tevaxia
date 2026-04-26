import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ============================================================
// OAUTH MICROSOFT GRAPH (Calendar) — Callback
// ============================================================
// GET /api/oauth/microsoft/calendar/callback?code=...
//   1. Échange code → tokens via login.microsoftonline.com
//   2. GET /me sur Microsoft Graph pour external_user_id (id) + email
//   3. UPSERT calendar_oauth_integrations
//   4. Redirige vers /profil/calendrier?connected=microsoft
// ============================================================

export const runtime = "nodejs";

type MicrosoftTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

type MicrosoftUserInfo = {
  id: string;
  userPrincipalName: string;
  mail?: string;
  displayName?: string;
};

function redirectToProfile(status: "success" | "error", message?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";
  const url = new URL(`${baseUrl}/profil/calendrier`);
  url.searchParams.set("provider", "microsoft");
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

  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_OAUTH_CLIENT_SECRET;
  const tenant = process.env.MICROSOFT_OAUTH_TENANT || "common";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!clientId || !clientSecret || !supabaseUrl || !supabaseAnonKey) {
    return redirectToProfile("error", "server_misconfigured");
  }

  // 1. Exchange code → tokens
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${baseUrl}/api/oauth/microsoft/calendar/callback`,
      grant_type: "authorization_code",
      scope: "offline_access Calendars.ReadWrite User.Read openid email profile",
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => "");
    console.error("Microsoft token exchange failed", detail);
    return redirectToProfile("error", "token_exchange_failed");
  }

  const tokens = (await tokenRes.json()) as MicrosoftTokenResponse;

  // 2. Get userinfo from Microsoft Graph
  const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return redirectToProfile("error", "userinfo_failed");
  }
  const userInfo = (await userRes.json()) as MicrosoftUserInfo;
  const email = userInfo.mail || userInfo.userPrincipalName;

  // 3. Persist in Supabase
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
        provider: "microsoft",
        external_user_id: userInfo.id,
        external_email: email,
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
    console.error("OAuth Microsoft upsert failed", upsertError);
    return redirectToProfile("error", "db_save_failed");
  }

  return redirectToProfile("success");
}
