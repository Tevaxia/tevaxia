import { NextResponse } from "next/server";

// ============================================================
// OAUTH GOOGLE CALENDAR — Initiate flow
// ============================================================
// GET /api/oauth/google/calendar?action=connect
//   → redirige vers consent screen Google
// GET /api/oauth/google/calendar?action=callback&code=...
//   → échange code contre tokens, persiste dans Supabase
//
// Config requise (env vars) :
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   NEXT_PUBLIC_BASE_URL (https://tevaxia.lu)
// Setup côté Google Cloud Console :
//   1. Créer projet + activer Google Calendar API
//   2. OAuth 2.0 client ID type "Web application"
//   3. Redirect URI: {NEXT_PUBLIC_BASE_URL}/api/oauth/google/calendar?action=callback
//   4. Scope: https://www.googleapis.com/auth/calendar
// ============================================================

export const runtime = "nodejs";

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tevaxia.lu";

  if (!clientId) {
    return NextResponse.json(
      {
        error: "OAuth Google non configuré",
        hint: "Ajoutez GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET dans les variables d'environnement.",
      },
      { status: 503 }
    );
  }

  const redirectUri = `${baseUrl}/api/oauth/google/calendar?action=callback`;

  if (action === "connect" || !action) {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    return NextResponse.redirect(authUrl.toString());
  }

  if (action === "callback") {
    // TODO: Implémenter l'échange code → tokens et l'insertion dans
    // calendar_oauth_integrations. Voir l'issue de roadmap pour le détail.
    // 1. Récupérer ?code, ?state
    // 2. POST https://oauth2.googleapis.com/token avec client_id/secret/code
    // 3. GET https://www.googleapis.com/oauth2/v2/userinfo pour external_user_id/email
    // 4. INSERT INTO calendar_oauth_integrations
    // 5. Redirect vers /profil/calendrier?connected=google
    return NextResponse.json(
      {
        message: "OAuth callback Google reçu — implémentation en cours",
        next_step: "Échange du code contre les tokens à finaliser",
      },
      { status: 501 }
    );
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 });
}
