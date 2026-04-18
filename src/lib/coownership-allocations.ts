// ============================================================
// COOWNERSHIP ALLOCATIONS — clés de répartition
// ============================================================
//
// Permet de gérer des clés alternatives aux tantièmes généraux :
// chauffage (prorata radiateurs), ascenseur (exclu rez-de-chaussée),
// escalier A/B, parkings, entretien jardin privatif, etc.
//
// Conforme pratique copropriété LU (loi 16 mai 1975 + règlement).
// La clé "tantiemes_generaux" est seedée automatiquement par le
// trigger SQL à la création d'une copropriété.

import { supabase, isSupabaseConfigured } from "./supabase";

export interface AllocationKey {
  id: string;
  coownership_id: string;
  code: string;
  label: string;
  description: string | null;
  total_shares: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitAllocation {
  id: string;
  unit_id: string;
  key_id: string;
  shares: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Gabarits pré-définis recommandés pour une copropriété LU standard.
 * L'utilisateur peut les créer d'un clic pour gagner du temps.
 */
export interface AllocationKeyTemplate {
  code: string;
  label: string;
  description: string;
  defaultSeed?: "tantiemes" | "equal" | "zero"; // Comment pré-remplir les parts
}

export const LU_ALLOCATION_TEMPLATES: AllocationKeyTemplate[] = [
  {
    code: "chauffage",
    label: "Chauffage collectif",
    description: "Répartition selon surfaces chauffées ou nombre d'UR (unités de répartition). À paramétrer par lot.",
    defaultSeed: "zero",
  },
  {
    code: "eau_chaude",
    label: "Eau chaude sanitaire",
    description: "Souvent au prorata de la consommation mesurée (compteurs divisionnaires).",
    defaultSeed: "zero",
  },
  {
    code: "ascenseur",
    label: "Ascenseur",
    description: "Typiquement : étages supérieurs supportent la charge, rez-de-chaussée exonéré ou allégé.",
    defaultSeed: "tantiemes",
  },
  {
    code: "escalier_a",
    label: "Escalier A",
    description: "Charges d'entretien de la cage d'escalier A uniquement (lots qui y accèdent).",
    defaultSeed: "zero",
  },
  {
    code: "escalier_b",
    label: "Escalier B",
    description: "Idem escalier B.",
    defaultSeed: "zero",
  },
  {
    code: "parking",
    label: "Parking souterrain",
    description: "Charges entretien parking (lots parking uniquement).",
    defaultSeed: "zero",
  },
  {
    code: "espaces_verts",
    label: "Espaces verts",
    description: "Entretien jardins / pelouses communs.",
    defaultSeed: "tantiemes",
  },
  {
    code: "gros_travaux",
    label: "Gros travaux (loi 10 juin 1999)",
    description: "Fonds travaux obligatoire : généralement tantièmes généraux.",
    defaultSeed: "tantiemes",
  },
];

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listAllocationKeys(coownershipId: string): Promise<AllocationKey[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("coownership_allocation_keys")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("is_system", { ascending: false })
    .order("label");
  if (error) throw error;
  return (data ?? []) as AllocationKey[];
}

export async function getAllocationKey(id: string): Promise<AllocationKey | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("coownership_allocation_keys")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as AllocationKey | null) ?? null;
}

export async function createAllocationKey(input: {
  coownership_id: string;
  code: string;
  label: string;
  description?: string;
}): Promise<AllocationKey> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_allocation_keys")
    .insert({
      coownership_id: input.coownership_id,
      code: input.code,
      label: input.label,
      description: input.description ?? null,
      is_system: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AllocationKey;
}

export async function updateAllocationKey(id: string, patch: Partial<AllocationKey>): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("coownership_allocation_keys")
    .update({
      label: patch.label,
      description: patch.description,
    })
    .eq("id", id)
    .eq("is_system", false); // Seules les clés user peuvent être modifiées
  if (error) throw error;
}

export async function deleteAllocationKey(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("coownership_allocation_keys")
    .delete()
    .eq("id", id)
    .eq("is_system", false);
  if (error) throw error;
}

/**
 * Crée une clé pré-définie avec pré-remplissage des parts selon le template.
 */
export async function createFromTemplate(
  coownershipId: string,
  template: AllocationKeyTemplate,
): Promise<AllocationKey> {
  const key = await createAllocationKey({
    coownership_id: coownershipId,
    code: template.code,
    label: template.label,
    description: template.description,
  });

  if (template.defaultSeed === "tantiemes") {
    // Copie les parts depuis tantiemes_generaux
    const tantKey = await findKeyByCode(coownershipId, "tantiemes_generaux");
    if (tantKey) {
      const existing = await listUnitAllocations(tantKey.id);
      for (const ua of existing) {
        await upsertUnitAllocation({ unit_id: ua.unit_id, key_id: key.id, shares: ua.shares });
      }
    }
  } else if (template.defaultSeed === "equal") {
    // Toutes les unités à 1 part
    const client = ensureClient();
    const { data: units } = await client
      .from("coownership_units").select("id")
      .eq("coownership_id", coownershipId);
    for (const u of (units ?? []) as { id: string }[]) {
      await upsertUnitAllocation({ unit_id: u.id, key_id: key.id, shares: 1 });
    }
  }
  // "zero" : on ne fait rien, l'utilisateur configurera manuellement

  return key;
}

export async function findKeyByCode(coownershipId: string, code: string): Promise<AllocationKey | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("coownership_allocation_keys")
    .select("*")
    .eq("coownership_id", coownershipId)
    .eq("code", code)
    .maybeSingle();
  return (data as AllocationKey | null) ?? null;
}

// ---------- Unit allocations ----------

export async function listUnitAllocations(keyId: string): Promise<UnitAllocation[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("coownership_unit_allocations")
    .select("*")
    .eq("key_id", keyId);
  return (data ?? []) as UnitAllocation[];
}

export async function upsertUnitAllocation(input: {
  unit_id: string;
  key_id: string;
  shares: number;
  notes?: string | null;
}): Promise<UnitAllocation> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_unit_allocations")
    .upsert(
      { unit_id: input.unit_id, key_id: input.key_id, shares: input.shares, notes: input.notes ?? null },
      { onConflict: "unit_id,key_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as UnitAllocation;
}

export async function deleteUnitAllocation(unitId: string, keyId: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("coownership_unit_allocations")
    .delete()
    .eq("unit_id", unitId)
    .eq("key_id", keyId);
  if (error) throw error;
}

/**
 * Fait appel à la RPC Postgres qui applique la clé sélectionnée sur un appel
 * (remplace l'ancienne generateChargesForCall basée uniquement sur tantièmes).
 */
export async function generateChargesWithKey(callId: string): Promise<number> {
  const client = ensureClient();
  const { data, error } = await client.rpc("generate_charges_with_key", { p_call_id: callId });
  if (error) throw error;
  return Number(data ?? 0);
}

// ---------- Pure helpers ----------

/**
 * Calcule le montant qui reviendrait à une unité sur un appel donné avec
 * une clé particulière — utile pour simuler avant d'émettre.
 */
export function computeAllocation(params: {
  totalAmount: number;
  unitShares: number;
  totalShares: number;
}): number {
  if (params.totalShares <= 0) return 0;
  return Math.round((params.totalAmount * params.unitShares / params.totalShares) * 100) / 100;
}

export function validateKeyCode(code: string): string | null {
  if (!code.trim()) return "Le code est obligatoire.";
  if (!/^[a-z0-9_]+$/.test(code)) return "Code : lettres minuscules, chiffres, underscore uniquement.";
  if (code.length > 50) return "Code trop long (max 50).";
  return null;
}
