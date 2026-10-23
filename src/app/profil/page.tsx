"use client";
import LocaleLink from "@/components/LocaleLink";

import { useState, useEffect, useRef } from "react";
import InputField from "@/components/InputField";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations, useLocale } from "next-intl";
import { getProfile, defaultProfile, legacyProfileSnapshot, saveProfile, loadAndMergeProfile, uploadLogo, type UserProfile } from "@/lib/profile";
import OwnedSharedLinksSection from "@/components/OwnedSharedLinksSection";
import AccountExportSection from "@/components/AccountExportSection";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import StripeInvoicesSection from "@/components/StripeInvoicesSection";
import NotificationPreferencesSection from "@/components/NotificationPreferencesSection";
import TwoFactorSection from "@/components/TwoFactorSection";
import AiSettingsSection from "@/components/AiSettingsSection";
import DashboardHero from "@/components/profil/DashboardHero";
import WorkspacesGrid from "@/components/profil/WorkspacesGrid";
import ProfileTypeSelector from "@/components/profil/ProfileTypeSelector";
import MarketAlertsSection from "@/components/MarketAlertsSection";
import type { ProfileType } from "@/lib/profile-types";

type TabKey = "identity" | "notifications" | "security" | "billing" | "data";

const TABS: { key: TabKey; labelKey: string; icon: string }[] = [
  { key: "identity", labelKey: "tabIdentity", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
  { key: "notifications", labelKey: "tabNotifications", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
  { key: "security", labelKey: "tabSecurity", icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" },
  { key: "billing", labelKey: "tabBilling", icon: "M2.25 8.25h19.5M2.25 9v9a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9m-19.5 0h19.5m-13.5 4.5h3" },
  { key: "data", labelKey: "tabData", icon: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" },
];

export default function Profil() {
  const { user, loading } = useAuth();
  if(loading)return null;
  return <ProfileContent key={user?.id ?? "guest"} />;
}

function ProfileContent() {
  const t = useTranslations("profil");
  const locale = useLocale();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const live=useRef(true), action=useRef(false);
  const [profileError,setProfileError]=useState(false);
  const [profileReady,setProfileReady]=useState(false);
  const [legacy,setLegacy]=useState(false);
  const [revision,setRevision]=useState(0);
  const [profileTypes, setProfileTypes] = useState<ProfileType[]>([]);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<TabKey>("identity");

  useEffect(() => {
    let active=true;live.current=true;
    try {setProfile(getProfile(user?.id ?? null));setLegacy(legacyProfileSnapshot()!==null);} catch {setProfileError(true);}
    loadAndMergeProfile(user?.id ?? null).then(merged=>{if(active){setProfile(merged);setProfileReady(true);setProfileError(false);}}).catch(()=>{if(active)setProfileError(true);});
    return ()=>{active=false;live.current=false;};
  }, [user?.id,revision]);

  // Deep-link des onglets via ?section=
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section") as TabKey | null;
    if (s && TABS.some((tb) => tb.key === s)) setTab(s);
  }, []);

  const changeTab = (next: TabKey) => {
    setTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("section", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const update = (field: keyof UserProfile, value: string) => {
    if(!profileReady || action.current)return;
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setDirty(true);
  };

  const handleSave = async () => {
    if(action.current || !profileReady)return;
    action.current=true;setSyncing(true);setProfileError(false);setSaved(false);
    try {
      await saveProfile(profile,user?.id ?? null);
      if(live.current){setSaved(true);setDirty(false);}
    } catch {if(live.current)setProfileError(true);}
    finally {action.current=false;if(live.current)setSyncing(false);}
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0];
    if(!file || !user || action.current || !profileReady)return;
    action.current=true;setUploadError(null);setUploading(true);
    try {
      const result=await uploadLogo(file,user.id);
      if(!live.current)return;
      if(result.error){setUploadError(t("profileStorageError"));return;}
      if(result.url){setProfile(prev=>({...prev,logoUrl:result.url!}));setDirty(true);setSaved(false);}
    } catch {if(live.current)setUploadError(t("profileStorageError"));}
    finally {action.current=false;if(live.current)setUploading(false);}
  };
  const downloadLegacy = () => {
    try {const raw=legacyProfileSnapshot();if(raw===null)return;const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='tevaxia-profile-legacy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{setProfileError(true);}
  };

  return (
    <div className="bg-background py-6 sm:py-10">
      {profileError && <div role="alert" className="mx-auto max-w-5xl p-4 text-sm text-rose-700">{t("profileStorageError")} {!profileReady && <button className="underline" onClick={()=>{setRevision(n=>n+1);}}>{t("profileRetry")}</button>}</div>}
      {legacy && <div className="mx-auto max-w-5xl p-4 text-sm">{t("profileLegacyNotice")} <button className="underline" onClick={downloadLegacy}>{t("profileLegacyDownload")}</button></div>}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <DashboardHero user={user} profile={profile} />

        <div className="mt-8">
          <WorkspacesGrid locale={locale} selectedProfiles={profileTypes} />
          <div className="mt-3">
            <ProfileTypeSelector onChange={setProfileTypes} />
          </div>
        </div>

        {/* Section paramètres avec onglets */}
        <div className="mt-10 pt-8 border-t border-card-border grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Sidebar nav (desktop) / tabs horizontaux (mobile) */}
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-xl border border-card-border bg-card p-2">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {t("settingsTitle")}
              </div>
              <nav className="flex flex-row flex-wrap gap-1 lg:flex-col lg:gap-0.5">
                {TABS.map((tb) => (
                  <button
                    key={tb.key}
                    type="button"
                    onClick={() => changeTab(tb.key)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      tab === tb.key
                        ? "bg-navy text-white"
                        : "text-slate hover:bg-card-border/40 hover:text-navy"
                    }`}
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={tb.icon} />
                    </svg>
                    <span>{t(tb.labelKey)}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Contenu onglet actif */}
          <div className="space-y-6 min-w-0">
            {tab === "identity" && (
              <fieldset disabled={syncing || uploading || !profileReady} className="min-w-0 space-y-5">
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">{t("identity")}</h2>
                  <div className="space-y-4">
                    <InputField label={t("fullName")} type="text" value={profile.nomComplet} onChange={(v) => update("nomComplet", v)} hint={t("fullNameHint")} />
                    <InputField label={t("company")} type="text" value={profile.societe} onChange={(v) => update("societe", v)} />
                    <InputField label={t("qualifications")} type="text" value={profile.qualifications} onChange={(v) => update("qualifications", v)} hint={t("qualificationsHint")} />
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">{t("contactDetails")}</h2>
                  <div className="space-y-4">
                    <InputField label={t("email")} type="text" value={profile.email} onChange={(v) => update("email", v)} />
                    <InputField label={t("phone")} type="text" value={profile.telephone} onChange={(v) => update("telephone", v)} />
                    <InputField label={t("address")} type="text" value={profile.adresse} onChange={(v) => update("adresse", v)} />
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-navy">{t("report")}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate mb-1">{t("logo")}</label>

                      {profile.logoUrl && (
                        <div className="mb-3 flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={profile.logoUrl}
                            alt="Logo"
                            className="h-16 w-16 rounded-lg border border-card-border object-contain bg-white p-1"
                          />
                          <button
                            type="button"
                            onClick={() => { update("logoUrl", ""); }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            {t("delete")}
                          </button>
                        </div>
                      )}

                      {user ? (
                        <div>
                          <label
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors ${
                              uploading
                                ? "border-navy/40 bg-navy/5 text-navy/60"
                                : "border-input-border bg-input-bg text-muted hover:border-navy hover:text-navy"
                            }`}
                          >
                            {uploading ? (
                              <>
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                {t("uploading")}
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                {t("chooseFile")}
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml"
                              onChange={handleLogoUpload}
                              disabled={uploading || syncing || !profileReady}
                              className="sr-only"
                            />
                          </label>
                          <p className="text-xs text-muted mt-1">{t("fileHint")}</p>
                          {uploadError && (
                            <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex gap-3 items-start">
                            <input
                              type="url"
                              value={profile.logoUrl || ""}
                              onChange={(e) => update("logoUrl", e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                            />
                          </div>
                          <p className="text-xs text-muted mt-1">{t("urlHint")}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate">{t("customLegalNotice")}</label>
                      <textarea
                        value={profile.mentionLegale}
                        onChange={(e) => update("mentionLegale", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-y"
                      />
                      <p className="text-xs text-muted">{t("customLegalNoticeHint")}</p>
                    </div>
                  </div>
                </div>
              </fieldset>
            )}

            {tab === "notifications" && (
              <>
                <NotificationPreferencesSection />
                <AiSettingsSection />
              </>
            )}

            {tab === "security" && (
              <>
                <TwoFactorSection />
                <SecuritySection />
                <DeleteAccountSection />
              </>
            )}

            {tab === "billing" && (
              <>
                <AccountExportSection user={user} />
                <StripeInvoicesSection />
              </>
            )}

            {tab === "data" && (
              <>
                <div className="rounded-xl border border-card-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-navy">Sauvegardes</h2>
                      <p className="mt-1 text-xs text-muted max-w-xl">Exportez ZIP complet de vos données (syndic, CRM, PMS, évaluations…) vers votre disque ou votre Google Drive — droit RGPD Article 20.</p>
                    </div>
                    <LocaleLink href="/profil/sauvegardes" className="shrink-0 rounded-lg border border-navy bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5">Gérer →</LocaleLink>
                  </div>
                </div>
                <MarketAlertsSection user={user} />
                <OwnedSharedLinksSection user={user} />
                {!user && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-800">{t("localNote")}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sticky save bar : apparaît uniquement si identity tab + modifs non sauvées */}
        {tab === "identity" && dirty && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-navy bg-navy text-white px-4 py-2 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <span className="text-xs text-white/80">{t("unsavedChanges")}</span>
            <button
              onClick={handleSave}
              disabled={syncing || uploading || !profileReady}
              className="rounded-full bg-gold px-4 py-1 text-xs font-bold text-navy-dark hover:brightness-105 disabled:opacity-60"
            >
              {syncing ? t("syncing") : saved ? t("profileSaved") : t("saveProfile")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SecuritySection() {
  const t = useTranslations("profil.security");
  const { signOutAll, signingOut } = useAuth();
  const handleGlobalSignOut = async () => {
    if (!confirm(t("confirmRevokeAll"))) return;
    await signOutAll();
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">{t("title")}</h3>
          <p className="mt-1 text-xs text-amber-800">{t("description")}</p>


          <button
            onClick={handleGlobalSignOut}
            disabled={signingOut}
            className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            {signingOut ? t("loading") : t("revokeAllCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
