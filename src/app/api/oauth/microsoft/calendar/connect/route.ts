import { NextResponse } from "next/server";

// ============================================================
// OAUTH MICROSOFT GRAPH (Calendar) — Initiate
// ============================================================
// GET /api/oauth/microsoft/calendar/connect → consent screen
// Callback : /api/oauth/microsoft/calendar/callback (path strict)
// ============================================================

export const runtime = "nodejs";

const SCOPES = "offline_access Calendars.ReadWrite User.Read openid email profile";

export async function GET() {
  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const tenant = process.env.MICROSOFT_OAUTH_TENANT || "common";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";

  if (!clientId) {
    return NextResponse.json(
      {
        error: "OAuth Microsoft non configuré",
        hint: "Ajoutez MICROSOFT_OAUTH_CLIENT_ID et MICROSOFT_OAUTH_CLIENT_SECRET dans les variables d'environnement Vercel.",
      },
      { status: 503 }
    );
  }

  const redirectUri = `${baseUrl}/api/oauth/microsoft/calendar/callback`;

  const authUrl = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
