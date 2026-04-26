import { NextResponse } from "next/server";

// ============================================================
// OAUTH MICROSOFT GRAPH (Calendar) — Initiate flow
// ============================================================
// GET /api/oauth/microsoft/calendar?action=connect
//   → redirige vers consent screen Microsoft
// GET /api/oauth/microsoft/calendar?action=callback&code=...
//   → échange code contre tokens, persiste dans Supabase
//
// Config requise (env vars) :
//   MICROSOFT_OAUTH_CLIENT_ID
//   MICROSOFT_OAUTH_CLIENT_SECRET
//   MICROSOFT_OAUTH_TENANT (default: "common" pour multi-tenant)
//   NEXT_PUBLIC_BASE_URL (https://tevaxia.lu)
// Setup côté Azure Portal :
//   1. Azure Active Directory → App registrations → New registration
//   2. Redirect URI Web: {NEXT_PUBLIC_BASE_URL}/api/oauth/microsoft/calendar?action=callback
//   3. API permissions: Microsoft Graph → Calendars.ReadWrite (delegated)
//   4. Certificates & secrets → New client secret
// ============================================================

export const runtime = "nodejs";

const SCOPES = "offline_access Calendars.ReadWrite User.Read";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const tenant = process.env.MICROSOFT_OAUTH_TENANT || "common";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";

  if (!clientId) {
    return NextResponse.json(
      {
        error: "OAuth Microsoft non configuré",
        hint: "Ajoutez MICROSOFT_OAUTH_CLIENT_ID et MICROSOFT_OAUTH_CLIENT_SECRET dans les variables d'environnement.",
      },
      { status: 503 }
    );
  }

  const redirectUri = `${baseUrl}/api/oauth/microsoft/calendar?action=callback`;

  if (action === "connect" || !action) {
    const authUrl = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("prompt", "consent");
    return NextResponse.redirect(authUrl.toString());
  }

  if (action === "callback") {
    // TODO: Implémenter l'échange code → tokens et l'insertion dans
    // calendar_oauth_integrations. Voir l'issue de roadmap.
    return NextResponse.json(
      {
        message: "OAuth callback Microsoft reçu — implémentation en cours",
        next_step: "Échange du code contre les tokens à finaliser",
      },
      { status: 501 }
    );
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 });
}
