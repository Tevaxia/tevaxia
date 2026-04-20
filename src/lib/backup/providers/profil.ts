/**
 * Provider: profil utilisateur — préférences, organisations, API keys.
 * Note : pas les secrets (API secret keys) — uniquement les métadonnées.
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { listMyOrganizations } from "@/lib/orgs";

async function collect(ctx: ExportContext): Promise<BackupBundle> {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase non configuré");

  const [{ data: prefs }, { data: tier }, orgs] = await Promise.all([
    supabase.from("user_preferences").select("*").eq("user_id", ctx.userId).maybeSingle(),
    supabase.from("user_tiers").select("*").eq("user_id", ctx.userId).maybeSingle(),
    listMyOrganizations(),
  ]);

  // API keys metadata (pas les secrets)
  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("id, label, created_at, last_used_at, revoked_at")
    .eq("user_id", ctx.userId);

  const files: Record<string, string> = {
    "preferences.json": JSON.stringify(prefs ?? null, null, 2),
    "tier.json": JSON.stringify(tier ?? null, null, 2),
    "organizations.json": JSON.stringify(orgs, null, 2),
    "api_keys_metadata.json": JSON.stringify(apiKeys ?? [], null, 2),
  };

  const counts: Record<string, number> = {
    preferences: prefs ? 1 : 0,
    organizations: orgs.length,
    api_keys: (apiKeys ?? []).length,
  };

  return { files, counts };
}

export const profilProvider: ExportProvider = {
  module: "profil",
  collect,
};
