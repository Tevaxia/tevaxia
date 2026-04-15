// ============================================================
// SUPABASE CLIENT — Comptes utilisateurs + sauvegarde cloud
// ============================================================
// Migrations à appliquer dans cet ordre :
//   001_create_valuations.sql
//   002_create_market_alerts.sql
//   003_create_organizations.sql
//   004_create_api_keys_and_logs.sql
//   005_create_shared_links.sql
//   006_cloud_sync_valuations_and_lots.sql (plafond 500, rétention 180j)
//
// Pour activer :
// 1. Créer un projet sur supabase.com
// 2. Ajouter les variables d'environnement dans Vercel :
//    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
// 3. Appliquer les migrations (CLI supabase ou SQL Editor).
//
// NB : les CRUD sur calculs sauvegardés / lots locatifs sont désormais
// dans src/lib/storage.ts et src/lib/gestion-locative.ts (dual-write
// local + cloud transparent quand l'utilisateur est connecté).

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Utilise @supabase/ssr avec cookies sur .tevaxia.lu
// → session partagée sur .tevaxia.lu
export const supabase = supabaseUrl && supabaseKey
  ? createBrowserClient(supabaseUrl, supabaseKey, {
      cookieOptions: {
        domain: ".tevaxia.lu",
        path: "/",
        sameSite: "lax" as const,
        secure: true,
      },
    })
  : null;

export const isSupabaseConfigured = !!supabase;
