import { supabase, isSupabaseConfigured } from "./supabase";

export type OrgRole = "admin" | "member" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
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
  contact_email?: string;
  contact_phone?: string;
  vat_number?: string;
  brand_color?: string;
}): Promise<Organization> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié.");

  const baseSlug = slugify(input.name) || "agence";
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = `${baseSlug}-${suffix}`;

  const { data, error } = await client
    .from("organizations")
    .insert({
      name: input.name,
      slug,
      created_by: user.id,
      contact_email: input.contact_email ?? user.email ?? null,
      contact_phone: input.contact_phone ?? null,
      vat_number: input.vat_number ?? null,
      brand_color: input.brand_color ?? "#0B2447",
    })
    .select("*")
    .single();

  if (error) throw error;
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
