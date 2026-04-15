"use client";

import { useState, useEffect, useCallback } from "react";
import InputField from "@/components/InputField";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "next-intl";
import { getProfile, saveProfile, loadAndMergeProfile, uploadLogo, type UserProfile } from "@/lib/profile";

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
      <h2 className="mb-4 text-base font-semibold text-navy">Mes alertes marche</h2>

      {loading ? (
        <p className="text-sm text-muted">Chargement...</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune alerte active. Utilisez le bouton cloche sur les pages communes pour en creer.
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

export default function Profil() {
  const t = useTranslations("profil");
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    // Charge le profil local immédiatement, puis merge avec le cloud
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
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="mb-3 rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-rose-900">Vous êtes en agence ?</div>
              <p className="text-xs text-rose-800 mt-0.5">Créez votre agence, invitez vos négociateurs, partagez le branding sur les rapports.</p>
            </div>
            <a href="organisation" className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">Mon agence →</a>
          </div>
        </div>

        <div className="mb-6 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Vous intégrez l&apos;API ?</div>
              <p className="text-xs text-slate-700 mt-0.5">Créez et gérez vos clés API, suivez l&apos;usage et les erreurs sur 30 jours.</p>
            </div>
            <a href="api" className="shrink-0 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Tableau de bord API →</a>
          </div>
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

          {/* Market alerts management section */}
          <AlertsSection user={user} />

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
        </div>
      </div>
    </div>
  );
}
