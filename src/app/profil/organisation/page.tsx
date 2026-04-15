"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  acceptInvitationToken,
  buildInvitationLink,
  createOrganization,
  deleteInvitation,
  inviteMember,
  listMembers,
  listMyOrganizations,
  listPendingInvitations,
  type Organization,
  type OrgInvitation,
  type OrgMember,
  type OrgRole,
} from "@/lib/orgs";

const ROLE_LABEL: Record<OrgRole, string> = {
  admin: "Admin",
  member: "Négociateur",
  viewer: "Lecture seule",
};

export default function OrgPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgPhone, setNewOrgPhone] = useState("");
  const [newOrgVat, setNewOrgVat] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("member");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const reloadOrgs = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listMyOrganizations();
      setOrgs(list);
      if (!activeOrgId && list.length > 0) {
        setActiveOrgId(list[0].id);
      } else if (activeOrgId && !list.some((o) => o.id === activeOrgId)) {
        setActiveOrgId(list[0]?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  const reloadMembersAndInvites = useCallback(async (orgId: string) => {
    try {
      const [m, inv] = await Promise.all([listMembers(orgId), listPendingInvitations(orgId)]);
      setMembers(m);
      setInvitations(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    }
  }, []);

  useEffect(() => {
    if (user) reloadOrgs();
  }, [user, reloadOrgs]);

  useEffect(() => {
    if (activeOrgId) reloadMembersAndInvites(activeOrgId);
  }, [activeOrgId, reloadMembersAndInvites]);

  if (authLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted">Chargement…</div>;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">Supabase non configuré</h2>
          <p className="mt-2 text-sm">La gestion d&apos;agences nécessite Supabase. Configurez les variables d&apos;environnement <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> et appliquez la migration SQL <code>003_create_organizations.sql</code>.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="rounded-xl border border-card-border bg-card p-8">
          <h2 className="text-lg font-semibold text-navy">Connexion requise</h2>
          <p className="mt-2 text-sm text-muted">Connectez-vous pour gérer votre agence.</p>
          <Link href={`${lp}/connexion`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createOrganization({
        name: newOrgName.trim(),
        contact_phone: newOrgPhone.trim() || undefined,
        vat_number: newOrgVat.trim() || undefined,
      });
      setNewOrgName("");
      setNewOrgPhone("");
      setNewOrgVat("");
      setShowCreate(false);
      setActiveOrgId(created.id);
      await reloadOrgs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de création.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!activeOrgId || !inviteEmail.trim()) return;
    setLoading(true);
    setError(null);
    setLastInviteLink(null);
    try {
      const inv = await inviteMember(activeOrgId, inviteEmail.trim(), inviteRole);
      setLastInviteLink(buildInvitationLink(inv.token));
      setInviteEmail("");
      await reloadMembersAndInvites(activeOrgId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!activeOrgId) return;
    try {
      await deleteInvitation(id);
      await reloadMembersAndInvites(activeOrgId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur suppression.");
    }
  };

  const myRole = activeOrgId ? members.find((m) => m.user_id === user.id)?.role : undefined;
  const isAdmin = myRole === "admin";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mon agence</h1>
          <p className="mt-1 text-sm text-muted">Gérez vos agences immobilières et invitez vos négociateurs.</p>
        </div>
        <Link href={`${lp}/profil`} className="text-sm text-muted hover:text-navy">← Profil</Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      {/* Org switcher + create */}
      <div className="mb-8 rounded-xl border border-card-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-navy">Agence active :</span>
          {orgs.length === 0 ? (
            <span className="text-sm text-muted italic">aucune agence</span>
          ) : (
            <select
              value={activeOrgId ?? ""}
              onChange={(e) => setActiveOrgId(e.target.value || null)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="ml-auto rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            + Créer une agence
          </button>
        </div>

        {showCreate && (
          <div className="mt-4 border-t border-card-border pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nom de l'agence (ex. Immo Luxembourg SA)"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Téléphone (optionnel)"
                value={newOrgPhone}
                onChange={(e) => setNewOrgPhone(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="N° TVA (optionnel)"
                value={newOrgVat}
                onChange={(e) => setNewOrgVat(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <button
                onClick={handleCreate}
                disabled={loading || !newOrgName.trim()}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-muted"
              >
                Créer
              </button>
            </div>
          </div>
        )}
      </div>

      {activeOrg && (
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy">{activeOrg.name}</h2>
            <div className="mt-1 text-xs text-muted">
              Slug : <code>{activeOrg.slug}</code> · Mon rôle : <strong>{ROLE_LABEL[myRole ?? "viewer"]}</strong>
            </div>
            {activeOrg.contact_email && (
              <div className="mt-1 text-xs text-muted">Contact : {activeOrg.contact_email}</div>
            )}
          </div>

          {/* Members */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy">Membres ({members.length})</h2>
            <ul className="mt-3 divide-y divide-card-border/50">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium text-navy">{m.user_id === user.id ? "Vous" : m.user_id.slice(0, 8) + "…"}</span>
                    <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-navy">{ROLE_LABEL[m.role]}</span>
                  </div>
                  <span className="text-xs text-muted">depuis {new Date(m.joined_at).toLocaleDateString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Invite form */}
          {isAdmin && (
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Inviter un négociateur</h2>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <input
                  type="email"
                  placeholder="email@exemple.lu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                  className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                >
                  <option value="member">Négociateur</option>
                  <option value="viewer">Lecture seule</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={loading || !inviteEmail.trim()}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:bg-muted"
                >
                  Inviter
                </button>
              </div>

              {lastInviteLink && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
                  <div className="font-medium text-emerald-900">Lien d&apos;invitation à transmettre :</div>
                  <code className="mt-1 block break-all text-emerald-800">{lastInviteLink}</code>
                  <div className="mt-1 text-emerald-700">Envoyez ce lien par email ou messagerie. Valable 14 jours.</div>
                </div>
              )}

              {invitations.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Invitations en attente</h3>
                  <ul className="mt-2 divide-y divide-card-border/50">
                    {invitations.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <span className="font-medium text-navy">{inv.email}</span>
                          <span className="ml-2 text-xs text-muted">{ROLE_LABEL[inv.role]}</span>
                          <span className="ml-2 text-xs text-muted">expire le {new Date(inv.expires_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(buildInvitationLink(inv.token))}
                            className="text-xs text-navy hover:underline"
                          >
                            Copier lien
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(inv.id)}
                            className="text-xs text-rose-700 hover:underline"
                          >
                            Annuler
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const __notUsed = { acceptInvitationToken };
