"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/InputField";
import { useAuth } from "@/components/AuthProvider";
import { getProfile, saveProfile, loadAndMergeProfile, type UserProfile } from "@/lib/profile";

export default function Profil() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Mon profil</h1>
          <p className="mt-2 text-muted">Ces informations apparaîtront sur vos rapports de valorisation (PDF et DOCX).</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Identité</h2>
            <div className="space-y-4">
              <InputField label="Nom complet" type="text" value={profile.nomComplet} onChange={(v) => update("nomComplet", v)} hint="Tel qu'il apparaîtra sur les rapports" />
              <InputField label="Société / Cabinet" type="text" value={profile.societe} onChange={(v) => update("societe", v)} />
              <InputField label="Qualifications" type="text" value={profile.qualifications} onChange={(v) => update("qualifications", v)} hint="Ex: REV, TRV, MRICS, Expert TEGOVA" />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Coordonnées</h2>
            <div className="space-y-4">
              <InputField label="Email" type="text" value={profile.email} onChange={(v) => update("email", v)} />
              <InputField label="Téléphone" type="text" value={profile.telephone} onChange={(v) => update("telephone", v)} />
              <InputField label="Adresse" type="text" value={profile.adresse} onChange={(v) => update("adresse", v)} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Rapport</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate mb-1">Logo (URL)</label>
                <div className="flex gap-3 items-start">
                  <input
                    type="url"
                    value={profile.logoUrl || ""}
                    onChange={(e) => update("logoUrl", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                  {profile.logoUrl && (
                    <img src={profile.logoUrl} alt="Logo" className="h-10 w-10 rounded border border-card-border object-contain bg-white" />
                  )}
                </div>
                <p className="text-xs text-muted mt-1">URL de votre logo (PNG/SVG). Apparaît sur les rapports PDF.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate">Mention légale personnalisée</label>
                <textarea
                  value={profile.mentionLegale}
                  onChange={(e) => update("mentionLegale", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-y"
                />
                <p className="text-xs text-muted">Apparaît en bas de chaque rapport généré.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={syncing}
            className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-light transition-colors disabled:opacity-60"
          >
            {syncing ? "Synchronisation..." : saved ? "Profil sauvegardé !" : "Enregistrer le profil"}
          </button>

          {user && (
            <div className="rounded-xl border border-energy/20 bg-energy/5 p-6">
              <h2 className="text-base font-semibold text-navy mb-3">Avantages de votre compte</h2>
              <ul className="grid gap-2 sm:grid-cols-2 text-sm text-slate">
                {[
                  "Export PDF sur les 19 outils",
                  "Sauvegarde cloud multi-appareils",
                  "Historique de vos simulations",
                  "Profil personnalisé (logo, coordonnées)",
                  "Portfolio multi-biens persistant",
                  "Estimation détaillée (comparables)",
                  "Aides détaillées (ventilation)",
                  "Alertes marché par commune",
                  "Partage de lien de simulation",
                  "Comparateur de scénarios",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className="h-4 w-4 shrink-0 text-energy mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">
              {user
                ? "Votre profil est synchronisé avec votre compte. Il sera utilisé pour personnaliser vos rapports PDF et DOCX."
                : "Votre profil est stocké localement. Créez un compte pour synchroniser et accéder à tous les avantages."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
