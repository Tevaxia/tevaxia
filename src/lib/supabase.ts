// ============================================================
// SUPABASE CLIENT — Comptes utilisateurs + sauvegarde cloud
// ============================================================
// Pour activer :
// 1. Créer un projet sur supabase.com
// 2. Ajouter les variables d'environnement dans Vercel :
//    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
// 3. Créer la table "valuations" avec le SQL ci-dessous
//
// CREATE TABLE valuations (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   nom TEXT NOT NULL,
//   type TEXT NOT NULL,
//   commune TEXT,
//   asset_type TEXT,
//   valeur_principale NUMERIC,
//   data JSONB NOT NULL DEFAULT '{}',
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users can view own valuations"
//   ON valuations FOR SELECT USING (auth.uid() = user_id);
//
// CREATE POLICY "Users can insert own valuations"
//   ON valuations FOR INSERT WITH CHECK (auth.uid() = user_id);
//
// CREATE POLICY "Users can update own valuations"
//   ON valuations FOR UPDATE USING (auth.uid() = user_id);
//
// CREATE POLICY "Users can delete own valuations"
//   ON valuations FOR DELETE USING (auth.uid() = user_id);

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Utilise @supabase/ssr avec cookies sur .tevaxia.lu
// → session partagée entre tevaxia.lu et energy.tevaxia.lu (SSO)
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

// ============================================================
// FONCTIONS CRUD (si Supabase est configuré, sinon fallback localStorage)
// ============================================================

import {
  sauvegarderEvaluation as localSave,
  listerEvaluations as localList,
  supprimerEvaluation as localDelete,
  type SavedValuation,
} from "./storage";

export async function saveValuation(valuation: Omit<SavedValuation, "id" | "date">) {
  if (!supabase) {
    return localSave(valuation);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return localSave(valuation);

  const { data, error } = await supabase.from("valuations").insert({
    user_id: user.id,
    nom: valuation.nom,
    type: valuation.type,
    commune: valuation.commune,
    asset_type: valuation.assetType,
    valeur_principale: valuation.valeurPrincipale,
    data: valuation.data,
  }).select().single();

  if (error) {
    console.error("Supabase save error:", error);
    return localSave(valuation);
  }

  return {
    id: data.id,
    nom: data.nom,
    date: data.created_at,
    type: data.type,
    commune: data.commune,
    assetType: data.asset_type,
    valeurPrincipale: data.valeur_principale,
    data: data.data,
  } as SavedValuation;
}

export async function listValuations(): Promise<SavedValuation[]> {
  if (!supabase) return localList();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return localList();

  const { data, error } = await supabase
    .from("valuations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return localList();

  return data.map((d: Record<string, unknown>) => ({
    id: d.id as string,
    nom: d.nom as string,
    date: d.created_at as string,
    type: d.type as SavedValuation["type"],
    commune: d.commune as string | undefined,
    assetType: d.asset_type as string | undefined,
    valeurPrincipale: d.valeur_principale as number | undefined,
    data: (d.data || {}) as Record<string, unknown>,
  }));
}

export async function deleteValuation(id: string) {
  if (!supabase) return localDelete(id);

  const { error } = await supabase.from("valuations").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete error:", error);
    localDelete(id);
  }
}
