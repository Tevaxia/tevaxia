import { NextResponse } from "next/server";

// ============================================================
// OAUTH GOOGLE CALENDAR — Initiate
// ============================================================
// GET /api/oauth/google/calendar/connect → redirige vers consent screen
// Callback : /api/oauth/google/calendar/callback (path strict, sans query)
// ============================================================

export const runtime = "nodejs";

const SCOPES = "https://www.googleapis.com/auth/calendar.events openid email profile";

export async function GET() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";

  if (!clientId) {
    return NextResponse.json(
      {
        error: "OAuth Google non configuré",
        hint: "Ajoutez GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET dans les variables d'environnement Vercel.",
      },
      { status: 503 }
    );
  }

  const redirectUri = `${baseUrl}/api/oauth/google/calendar/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");

  return NextResponse.redirect(authUrl.toString());
}
