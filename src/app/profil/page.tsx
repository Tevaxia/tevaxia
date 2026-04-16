"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useTranslations, useLocale } from "next-intl";
import { getProfile, saveProfile, loadAndMergeProfile, uploadLogo, type UserProfile } from "@/lib/profile";
import { listMySharedLinks, deleteSharedLink, buildSharedLinkUrl, type SharedLink } from "@/lib/shared-links";
import { buildDataExport, downloadAsJsonFile } from "@/lib/data-export";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import NotificationPreferencesSection from "@/components/NotificationPreferencesSection";
import TwoFactorSection from "@/components/TwoFactorSection";
import UpgradeToProButton from "@/components/UpgradeToProButton";
import AiSettingsSection from "@/components/AiSettingsSection";
import DashboardHero from "@/components/profil/DashboardHero";
import WorkspacesGrid from "@/components/profil/WorkspacesGrid";

// ============================================================
// MARKET ALERTS TYPES & SECTION
// ============================================================
interface MarketAlert {
  id: string;
  commune: string;
  target_price_m2: number | null;
  direction: "below" | "above";
  active: boolean;
  created_at: string;
}

function AlertsSection({ user }: { user: { id: string } | null }) {
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("market_alerts")
      .select("id, commune, target_price_m2, direction, active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading alerts:", error);
    } else {
      setAlerts((data as MarketAlert[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts();
  }, [fetchAlerts]);

  const toggleActive = async (alert: MarketAlert) => {
    if (!supabase) return;
    const newActive = !alert.active;
    const { error } = await supabase
      .from("market_alerts")
      .update({ active: newActive, updated_at: new Date().toISOString() })
      .eq("id", alert.id);
    if (error) {
      console.error("Error toggling alert:", error);
      return;
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, active: newActive } : a))
    );
  };

  const deleteAlert = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("market_alerts")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting alert:", error);
      return;
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (!user || !supabase) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-navy">Mes alertes marché</h2>

      {loading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune alerte active. Utilisez le bouton cloche sur les pages communes pour en créer.
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                alert.active
                  ? "border-card-border bg-white"
                  : "border-dashed border-card-border bg-background opacity-60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy truncate">
                  {alert.commune}
                </p>
                <p className="text-xs text-muted">
                  {alert.target_price_m2
                    ? `${alert.direction === "below" ? "En dessous de" : "Au-dessus de"} ${alert.target_price_m2.toLocaleString("fr-FR")} EUR/m2`
                    : "Pas de prix cible"}
                  {" \u00b7 "}
                  {new Date(alert.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle active/inactive */}
                <button
                  onClick={() => toggleActive(alert)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    alert.active ? "bg-navy" : "bg-gray-300"
                  }`}
                  title={alert.active ? "Desactiver" : "Activer"}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      alert.active ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="rounded-md p-1 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Supprimer l'alerte"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SharedLinksSection({ user }: { user: { id: string } | null }) {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    listMySharedLinks()
      .then((data) => setLinks(data))
      .catch((e) => console.error("Error loading shared links:", e))
      .finally(() => setLoading(false));
  }, [user]);

  const handleRevoke = async (id: string) => {
    if (!confirm("Révoquer ce lien ? Le bénéficiaire n'y aura plus accès.")) return;
    try {
      await deleteSharedLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error("Error revoking link:", e);
    }
  };

  const copyUrl = async (token: string, id: string) => {
    await navigator.clipboard.writeText(buildSharedLinkUrl(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toolLabel = (t: string) => ({
    "bilan-promoteur": "Bilan promoteur",
    "estimation": "Estimation",
    "valorisation": "Valorisation",
    "dcf-multi": "DCF multi-périodes",
    "hotel-valorisation": "Valorisation hôtel",
    "hotel-dscr": "DSCR hôtel",
  })[t] ?? t;

  if (!user || !supabase) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-navy">Liens publics partagés</h2>
          <p className="text-xs text-muted mt-0.5">Vues read-only que vous avez générées pour vos interlocuteurs.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted">Aucun lien partagé pour le moment. Utilisez le bouton « Partager un lien public » depuis un calculateur (ex. Bilan promoteur).</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const expired = new Date(link.expires_at) < new Date();
            const limitReached = link.max_views != null && link.view_count >= link.max_views;
            return (
              <div key={link.id} className="rounded-lg border border-card-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-navy truncate">{link.title || "Sans titre"}</span>
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-medium">{toolLabel(link.tool_type)}</span>
                      {expired && <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-medium">Expiré</span>}
                      {limitReached && <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-medium">Limite atteinte</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {link.view_count} vue{link.view_count > 1 ? "s" : ""}
                      {link.max_views != null && ` / ${link.max_views}`}
                      {" · expire le "}
                      {new Date(link.expires_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => copyUrl(link.token, link.id)}
                      className="rounded-md border border-card-border bg-white px-2 py-1 text-xs font-medium text-navy hover:bg-slate-50"
                    >
                      {copiedId === link.id ? "Copié ✓" : "Copier"}
                    </button>
                    <button
                      onClick={() => handleRevoke(link.id)}
                      className="rounded-md p-1 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Révoquer le lien"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TierAndExportSection({ user }: { user: { id: string } | null }) {
  const [tier, setTier] = useState<{ tier: string; items_cap: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from("user_tiers")
      .select("tier, items_cap")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setTier(data ?? { tier: "free", items_cap: 500 });
      });
  }, [user]);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await buildDataExport();
      downloadAsJsonFile(data);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const tierLabel: Record<string, string> = {
    free: "Gratuit",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const tierColor: Record<string, string> = {
    free: "bg-slate-100 text-slate-800",
    pro: "bg-emerald-100 text-emerald-800",
    enterprise: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-navy">Données &amp; plan</h2>
          <p className="mt-0.5 text-xs text-muted">
            Consultation de votre plan actuel et export RGPD de toutes vos données.
          </p>
        </div>
        {tier && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tierColor[tier.tier] ?? tierColor.free}`}>
            Plan {tierLabel[tier.tier] ?? tier.tier}
          </span>
        )}
      </div>

      {tier && (
        <div className="mt-4 rounded-lg border border-card-border bg-background p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Plafond de stockage cloud</span>
            <span className="font-semibold text-navy">{tier.items_cap.toLocaleString("fr-LU")} items</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted">Rétention automatique</span>
            <span className="font-semibold text-navy">180 jours après dernière modification</span>
          </div>
          {tier.tier === "free" && (
            <div className="mt-3">
              <UpgradeToProButton />
              <p className="mt-2 text-xs text-muted">
                Besoin d&apos;un plafond plus élevé (jusqu&apos;à 10 000 items) ou d&apos;un devis Enterprise ? Contactez-nous à{" "}
                <a href="mailto:contact@tevaxia.lu?subject=Plan%20Pro" className="text-navy underline hover:no-underline">contact@tevaxia.lu</a>.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleExport}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {loading ? "Préparation…" : exported ? "Téléchargé ✓" : "Exporter toutes mes données (JSON)"}
        </button>
        <p className="mt-2 text-xs text-muted">
          Export RGPD complet : profil, évaluations, lots locatifs, alertes, liens partagés, liste des clés API
          (sans les secrets). Format JSON lisible et portable.
        </p>
      </div>
    </div>
  );
}

export default function Profil() {
  const t = useTranslations("profil");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    // Charge le profil local immédiatement, puis merge avec le cloud
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(getProfile());
    loadAndMergeProfile().then((merged) => setProfile(merged));
  }, []);

  const update = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSyncing(true);
    await saveProfile(profile);
    setSyncing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const result = await uploadLogo(file);
    setUploading(false);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) {
      setProfile((prev) => ({ ...prev, logoUrl: result.url! }));
      setSaved(false);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>

        <DashboardHero user={user} profile={profile} />

        <div className="mt-8">
          <WorkspacesGrid locale={locale} />
        </div>

        <div className="mt-10 mb-4 flex items-center gap-3">
          <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{t("settingsTitle")}</h2>
          <div className="h-px flex-1 bg-card-border" />
        </div>

        <div className="space-y-6">
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

                {/* Aperçu du logo actuel */}
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
                  /* ── Utilisateur connecté : upload fichier via Supabase Storage ── */
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
                        disabled={uploading}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-xs text-muted mt-1">{t("fileHint")}</p>
                    {uploadError && (
                      <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                    )}
                  </div>
                ) : (
                  /* ── Non connecté : fallback saisie URL ── */
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

          <button
            onClick={handleSave}
            disabled={syncing}
            className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-light transition-colors disabled:opacity-60"
          >
            {syncing ? t("syncing") : saved ? t("profileSaved") : t("saveProfile")}
          </button>

          {/* Authentification à deux facteurs */}
          <TwoFactorSection />

          {/* Préférences IA / BYOK */}
          <AiSettingsSection />

          {/* Préférences notifications + consentements */}
          <NotificationPreferencesSection />

          {/* Tier affichage + export RGPD */}
          <TierAndExportSection user={user} />

          {/* Market alerts management section */}
          <AlertsSection user={user} />

          {/* Shared public links management */}
          <SharedLinksSection user={user} />

          {user && (
            <div className="rounded-xl border border-energy/20 bg-energy/5 p-6">
              <h2 className="text-base font-semibold text-navy mb-3">{t("accountAdvantages")}</h2>
              <ul className="grid gap-2 sm:grid-cols-2 text-sm text-slate">
                {([
                  "advantage1",
                  "advantage2",
                  "advantage3",
                  "advantage4",
                  "advantage5",
                  "advantage6",
                  "advantage7",
                  "advantage8",
                  "advantage9",
                  "advantage10",
                ] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <svg className="h-4 w-4 shrink-0 text-energy mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">
              {user
                ? t("syncNote")
                : t("localNote")}
            </p>
          </div>

          {/* Danger zone : suppression compte */}
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
