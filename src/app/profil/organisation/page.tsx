"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import OrgAgencyStats from "@/components/OrgAgencyStats";
import {
  acceptInvitationToken,
  buildInvitationLink,
  createOrganization,
  deleteInvitation,
  inviteMember,
  listMembers,
  listMyOrganizations,
  listPendingInvitations,
  rolesForOrgType,
  type Organization,
  type OrgInvitation,
  type OrgMember,
  type OrgRole,
  type OrgType,
} from "@/lib/orgs";
import { errMsg } from "@/lib/errors";
import { lookupVies, VIES_COUNTRIES } from "@/lib/vies";

const ROLE_KEY: Record<OrgRole, string> = {
  admin: "roleAdmin",
  member: "roleMember",
  viewer: "roleViewer",
  syndic: "roleSyndic",
  conseil_syndical: "roleConseilSyndical",
  coproprietaire: "roleCoproprietaire",
  locataire: "roleLocataire",
  prestataire: "rolePrestataire",
  hotel_owner: "roleHotelOwner",
  hotel_director: "roleHotelDirector",
  revenue_manager: "roleRevenueManager",
  fb_manager: "roleFbManager",
  reception: "roleReception",
};

const ORG_TYPE_META: Record<OrgType, { labelKey: string; descKey: string; accent: string }> = {
  agency: { labelKey: "orgTypeAgencyLabel", descKey: "orgTypeAgencyDesc", accent: "from-rose-500 to-rose-700" },
  syndic: { labelKey: "orgTypeSyndicLabel", descKey: "orgTypeSyndicDesc", accent: "from-teal-600 to-emerald-700" },
  hotel_group: { labelKey: "orgTypeHotelLabel", descKey: "orgTypeHotelDesc", accent: "from-purple-600 to-purple-800" },
  bank: { labelKey: "orgTypeBankLabel", descKey: "orgTypeBankDesc", accent: "from-slate-700 to-slate-900" },
  other: { labelKey: "orgTypeOtherLabel", descKey: "orgTypeOtherDesc", accent: "from-amber-500 to-amber-700" },
};

export default function OrgPage() {
  const t = useTranslations("profilOrganisation");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState<OrgType>("agency");
  const [newOrgPhone, setNewOrgPhone] = useState("");
  const [newOrgVat, setNewOrgVat] = useState("");
  const [newOrgAddress, setNewOrgAddress] = useState("");
  const [viesCountry, setViesCountry] = useState("LU");
  const [viesInput, setViesInput] = useState("");
  const [viesLoading, setViesLoading] = useState(false);
  const [viesError, setViesError] = useState<string | null>(null);
  const [viesValidated, setViesValidated] = useState(false);

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
      setError(e instanceof Error ? e.message : t("errLoad"));
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, t]);

  const reloadMembersAndInvites = useCallback(async (orgId: string) => {
    try {
      const [m, inv] = await Promise.all([listMembers(orgId), listPendingInvitations(orgId)]);
      setMembers(m);
      setInvitations(inv);
    } catch (e) {
      setError(errMsg(e, t("errLoad")));
    }
  }, [t]);

  useEffect(() => {
    if (user) reloadOrgs();
  }, [user, reloadOrgs]);

  useEffect(() => {
    if (activeOrgId) reloadMembersAndInvites(activeOrgId);
  }, [activeOrgId, reloadMembersAndInvites]);

  if (authLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted">{t("loading")}</div>;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">{t("supabaseNotConfiguredTitle")}</h2>
          <p className="mt-2 text-sm">
            {t.rich("supabaseNotConfiguredBody", {
              url: () => <code>NEXT_PUBLIC_SUPABASE_URL</code>,
              anon: () => <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
              sql: () => <code>003_create_organizations.sql</code>,
            })}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="rounded-xl border border-card-border bg-card p-8">
          <h2 className="text-lg font-semibold text-navy">{t("loginRequired")}</h2>
          <p className="mt-2 text-sm text-muted">{t("loginHint")}</p>
          <Link href={`${lp}/connexion`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("login")}
          </Link>
        </div>
      </div>
    );
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;

  const handleViesLookup = async () => {
    const raw = viesInput.trim();
    if (!raw) return;
    setViesLoading(true);
    setViesError(null);
    setViesValidated(false);
    try {
      const result = await lookupVies(viesCountry, raw);
      if ("error" in result) {
        const msg = result.error === "vies_user_error"
          ? t("viesInvalid", { code: result.code ?? "-" })
          : result.error === "vies_network_error"
          ? t("viesUnreachable")
          : result.error === "vies_upstream_error"
          ? t("viesUpstream")
          : t("viesFailed");
        setViesError(msg);
        return;
      }
      if (!result.valid) {
        setViesError(t("viesNotValid"));
        return;
      }
      // Préremplit le formulaire
      if (result.name) setNewOrgName(result.name);
      if (result.address) setNewOrgAddress(result.address);
      setNewOrgVat(result.countryCode + result.vatNumber);
      setViesValidated(true);
    } catch (e) {
      setViesError(errMsg(e, t("viesQueryError")));
    } finally {
      setViesLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createOrganization({
        name: newOrgName.trim(),
        org_type: newOrgType,
        contact_phone: newOrgPhone.trim() || undefined,
        vat_number: newOrgVat.trim() || undefined,
        legal_mention: newOrgAddress.trim() || undefined,
      });
      setNewOrgName("");
      setNewOrgType("agency");
      setNewOrgPhone("");
      setNewOrgVat("");
      setNewOrgAddress("");
      setViesInput("");
      setViesValidated(false);
      setViesError(null);
      setShowCreate(false);
      setActiveOrgId(created.id);
      await reloadOrgs();
    } catch (e) {
      setError(errMsg(e, t("errCreate")));
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
      setError(errMsg(e, t("errInvite")));
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
      setError(errMsg(e, t("errDelete")));
    }
  };

  const myRole = activeOrgId ? members.find((m) => m.user_id === user.id)?.role : undefined;
  const isAdmin = myRole === "admin";

  const placeholderName = newOrgType === "syndic" ? t("placeholderNameSyndic")
    : newOrgType === "hotel_group" ? t("placeholderNameHotel")
    : newOrgType === "bank" ? t("placeholderNameBank")
    : t("placeholderNameDefault");

  const viesPlaceholder = viesCountry === "LU" ? t("viesPlaceholderLU")
    : viesCountry === "FR" ? t("viesPlaceholderFR")
    : t("viesPlaceholderOther");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>
        </div>
        <Link href={`${lp}/profil`} className="text-sm text-muted hover:text-navy">{t("backToProfile")}</Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      {/* Org switcher + create */}
      <div className="mb-8 rounded-xl border border-card-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-navy">{t("activeAgency")}</span>
          {orgs.length === 0 ? (
            <span className="text-sm text-muted italic">{t("noAgency")}</span>
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
            {t("createOrg")}
          </button>
        </div>

        {showCreate && (
          <div className="mt-4 border-t border-card-border pt-4 space-y-5">
            {/* VIES lookup : préremplit depuis n° TVA intracommunautaire */}
            <div className="rounded-lg border border-navy/20 bg-navy/5 p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold text-navy">{t("viesTitle")}</h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t("viesSubtitle")}
                  </p>
                </div>
                <span className="text-[10px] text-muted font-mono">{t("viesOptional")}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                <select
                  value={viesCountry}
                  onChange={(e) => { setViesCountry(e.target.value); setViesValidated(false); setViesError(null); }}
                  className="rounded-lg border border-input-border bg-white px-2 py-2 text-sm"
                >
                  {VIES_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={viesInput}
                  onChange={(e) => { setViesInput(e.target.value); setViesValidated(false); setViesError(null); }}
                  placeholder={viesPlaceholder}
                  className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm font-mono"
                  onKeyDown={(e) => { if (e.key === "Enter") handleViesLookup(); }}
                />
                <button
                  type="button"
                  onClick={handleViesLookup}
                  disabled={viesLoading || !viesInput.trim()}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
                >
                  {viesLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {t("viesSearching")}
                    </span>
                  ) : (
                    t("viesSearch")
                  )}
                </button>
              </div>
              {viesError && (
                <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                  {viesError}
                </div>
              )}
              {viesValidated && !viesError && (
                <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 flex items-start gap-2">
                  <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                  </svg>
                  <span>{t("viesValidated")}</span>
                </div>
              )}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("orgTypeTitle")}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {(Object.keys(ORG_TYPE_META) as OrgType[]).map((key) => {
                const info = ORG_TYPE_META[key];
                const selected = newOrgType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setNewOrgType(key)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected ? "border-navy bg-navy/5" : "border-card-border bg-background hover:bg-slate-50"
                    }`}
                  >
                    <div className={`inline-flex h-6 rounded-full bg-gradient-to-br ${info.accent} px-2 py-0.5 text-[10px] font-semibold text-white items-center`}>
                      {t(info.labelKey)}
                    </div>
                    <p className="mt-1.5 text-xs text-muted leading-snug">{t(info.descKey)}</p>
                  </button>
                );
              })}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("detailsTitle")}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="text-xs sm:col-span-2">
                  <span className="text-muted">{t("nameLabel")}</span>
                  <input
                    type="text"
                    placeholder={placeholderName}
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      viesValidated ? "border-emerald-300 bg-emerald-50" : "border-input-border bg-input-bg"
                    }`}
                  />
                </label>
                <label className="text-xs sm:col-span-2">
                  <span className="text-muted">{t("addressLabel")}</span>
                  <textarea
                    rows={2}
                    placeholder={t("addressPlaceholder")}
                    value={newOrgAddress}
                    onChange={(e) => setNewOrgAddress(e.target.value)}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      viesValidated && newOrgAddress ? "border-emerald-300 bg-emerald-50" : "border-input-border bg-input-bg"
                    }`}
                  />
                </label>
                <label className="text-xs">
                  <span className="text-muted">{t("vatLabel")}</span>
                  <input
                    type="text"
                    placeholder={t("vatPlaceholder")}
                    value={newOrgVat}
                    onChange={(e) => setNewOrgVat(e.target.value.toUpperCase())}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${
                      viesValidated ? "border-emerald-300 bg-emerald-50" : "border-input-border bg-input-bg"
                    }`}
                  />
                </label>
                <label className="text-xs">
                  <span className="text-muted">{t("phoneLabel")}</span>
                  <input
                    type="text"
                    placeholder={t("phonePlaceholder")}
                    value={newOrgPhone}
                    onChange={(e) => setNewOrgPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => { setShowCreate(false); setViesError(null); setViesValidated(false); }}
                  className="rounded-lg border border-card-border bg-background px-4 py-2 text-sm text-slate hover:border-navy"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !newOrgName.trim()}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
                >
                  {loading ? t("creating") : t("createSubmit")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeOrg && (
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy">{activeOrg.name}</h2>
            <div className="mt-1 text-xs text-muted">
              {t("slug")} <code>{activeOrg.slug}</code> · {t("myRole")} <strong>{t(ROLE_KEY[myRole ?? "viewer"])}</strong>
            </div>
            {activeOrg.contact_email && (
              <div className="mt-1 text-xs text-muted">{t("contact")} {activeOrg.contact_email}</div>
            )}
          </div>

          {activeOrg.org_type === "agency" && myRole === "admin" && (
            <OrgAgencyStats orgId={activeOrg.id} />
          )}

          {/* Members */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy">{t("members", { n: members.length })}</h2>
            <ul className="mt-3 divide-y divide-card-border/50">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium text-navy">{m.user_id === user.id ? t("you") : m.user_id.slice(0, 8) + "…"}</span>
                    <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-navy">{t(ROLE_KEY[m.role])}</span>
                  </div>
                  <span className="text-xs text-muted">{t("since", { date: new Date(m.joined_at).toLocaleDateString(dateLocale) })}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Invite form */}
          {isAdmin && (
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">{t("inviteTitle")}</h2>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <input
                  type="email"
                  placeholder={t("invitePlaceholderEmail")}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                  className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                >
                  {rolesForOrgType(activeOrg?.org_type ?? "agency").map((r) => (
                    <option key={r} value={r}>{t(ROLE_KEY[r])}</option>
                  ))}
                </select>
                <button
                  onClick={handleInvite}
                  disabled={loading || !inviteEmail.trim()}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:bg-muted"
                >
                  {t("invite")}
                </button>
              </div>

              {lastInviteLink && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
                  <div className="font-medium text-emerald-900">{t("inviteLinkTitle")}</div>
                  <code className="mt-1 block break-all text-emerald-800">{lastInviteLink}</code>
                  <div className="mt-1 text-emerald-700">{t("inviteLinkHint")}</div>
                </div>
              )}

              {invitations.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{t("pendingInvitations")}</h3>
                  <ul className="mt-2 divide-y divide-card-border/50">
                    {invitations.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <span className="font-medium text-navy">{inv.email}</span>
                          <span className="ml-2 text-xs text-muted">{t(ROLE_KEY[inv.role])}</span>
                          <span className="ml-2 text-xs text-muted">{t("expiresOn", { date: new Date(inv.expires_at).toLocaleDateString(dateLocale) })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(buildInvitationLink(inv.token))}
                            className="text-xs text-navy hover:underline"
                          >
                            {t("copyLink")}
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(inv.id)}
                            className="text-xs text-rose-700 hover:underline"
                          >
                            {t("cancelInvite")}
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
