import { supabase, isSupabaseConfigured } from "./supabase";

export type OrgType = "agency" | "syndic" | "hotel_group" | "bank" | "other";

export type OrgRole =
  | "admin"
  | "member"
  | "viewer"
  // Syndic
  | "syndic"
  | "conseil_syndical"
  | "coproprietaire"
  | "locataire"
  | "prestataire"
  // Hôtellerie
  | "hotel_owner"
  | "hotel_director"
  | "revenue_manager"
  | "fb_manager"
  | "reception";

export function rolesForOrgType(orgType: OrgType): OrgRole[] {
  switch (orgType) {
    case "agency":
      return ["admin", "member", "viewer"];
    case "syndic":
      return ["admin", "syndic", "conseil_syndical", "coproprietaire", "locataire", "prestataire", "viewer"];
    case "hotel_group":
      return ["admin", "hotel_owner", "hotel_director", "revenue_manager", "fb_manager", "reception", "viewer"];
    case "bank":
      return ["admin", "member", "viewer"];
    case "other":
    default:
      return ["admin", "member", "viewer"];
  }
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: OrgType;
  vertical_config: Record<string, unknown>;
  logo_url: string | null;
  brand_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  vat_number: string | null;
  legal_mention: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: string;
  email?: string;
}

export interface OrgInvitation {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase n'est pas configuré.");
  }
  return supabase;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function createOrganization(input: {
  name: string;
  org_type?: OrgType;
  contact_email?: string;
  contact_phone?: string;
  vat_number?: string;
  brand_color?: string;
  legal_mention?: string;
}): Promise<Organization> {
  const client = ensureClient();
  // getSession() s'assure que le JWT est rafraîchi et vérifie sa validité,
  // tandis que getUser() peut retourner un user de cache même si JWT expiré.
  const { data: { session } } = await client.auth.getSession();
  const user = session?.user;
  if (!user || !session?.access_token) {
    throw new Error("Session expirée. Reconnectez-vous pour créer une organisation.");
  }

  const baseSlug = slugify(input.name) || "org";

  // 1) Slug unique via RPC DB (évite collision / conflict race)
  let slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const { data: suggested } = await client.rpc("suggest_org_slug", { p_base_slug: baseSlug });
    if (typeof suggested === "string" && suggested.length > 0) slug = suggested;
  } catch {
    // fallback silencieux au slug local
  }

  // 2) Insertion via RPC SECURITY DEFINER — contourne le bug RLS INSERT
  //    où auth.uid() retournait NULL malgré getUser() valide côté client
  //    (cookies domain ".tevaxia.lu" vs preview deploy, JWT expiré, etc.).
  const { data, error } = await client.rpc("create_organization", {
    p_name: input.name,
    p_slug: slug,
    p_org_type: input.org_type ?? "agency",
    p_contact_email: input.contact_email ?? user.email ?? null,
    p_contact_phone: input.contact_phone ?? null,
    p_vat_number: input.vat_number ?? null,
    p_brand_color: input.brand_color ?? "#0B2447",
    p_legal_mention: input.legal_mention ?? null,
  });

  if (error) {
    if (error.message?.includes("not_authenticated")) {
      throw new Error("Session non reconnue côté serveur. Déconnectez-vous et reconnectez-vous.");
    }
    throw error;
  }

  return data as Organization;
}

export async function listMyOrganizations(): Promise<Organization[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function updateOrganization(orgId: string, patch: Partial<Organization>): Promise<Organization> {
  const client = ensureClient();
  const { data, error } = await client
    .from("organizations")
    .update(patch)
    .eq("id", orgId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Organization;
}

export async function listMembers(orgId: string): Promise<OrgMember[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("org_members")
    .select("*")
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrgMember[];
}

export async function inviteMember(orgId: string, email: string, role: OrgRole = "member"): Promise<OrgInvitation> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié.");
  const { data, error } = await client
    .from("org_invitations")
    .insert({
      org_id: orgId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: user.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as OrgInvitation;
}

export async function listPendingInvitations(orgId: string): Promise<OrgInvitation[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("org_invitations")
    .select("*")
    .eq("org_id", orgId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrgInvitation[];
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("org_invitations").delete().eq("id", invitationId);
  if (error) throw error;
}

export async function acceptInvitationToken(token: string): Promise<{ success: boolean; error?: string; org_id?: string }> {
  const client = ensureClient();
  const { data, error } = await client.rpc("accept_invitation", { invitation_token: token });
  if (error) return { success: false, error: error.message };
  return data as { success: boolean; error?: string; org_id?: string };
}

export function buildInvitationLink(token: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://tevaxia.lu");
  return `${base}/invitation/${token}`;
}

export { slugify };
