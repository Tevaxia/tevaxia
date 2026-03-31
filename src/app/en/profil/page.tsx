"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/InputField";
import { getProfile, saveProfile, type UserProfile } from "@/lib/profile";

export default function Profil() {
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const update = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">My Profile</h1>
          <p className="mt-2 text-muted">This information will appear on your valuation reports (PDF and DOCX).</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Identity</h2>
            <div className="space-y-4">
              <InputField label="Full name" type="text" value={profile.nomComplet} onChange={(v) => update("nomComplet", v)} hint="As it will appear on reports" />
              <InputField label="Company / Firm" type="text" value={profile.societe} onChange={(v) => update("societe", v)} />
              <InputField label="Qualifications" type="text" value={profile.qualifications} onChange={(v) => update("qualifications", v)} hint="E.g.: REV, TRV, MRICS, TEGOVA Expert" />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Contact Details</h2>
            <div className="space-y-4">
              <InputField label="Email" type="text" value={profile.email} onChange={(v) => update("email", v)} />
              <InputField label="Phone" type="text" value={profile.telephone} onChange={(v) => update("telephone", v)} />
              <InputField label="Address" type="text" value={profile.adresse} onChange={(v) => update("adresse", v)} />
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Report</h2>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate">Custom legal notice</label>
              <textarea
                value={profile.mentionLegale}
                onChange={(e) => update("mentionLegale", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-y"
              />
              <p className="text-xs text-muted">Appears at the bottom of each generated report.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-light transition-colors"
          >
            {saved ? "Profile saved!" : "Save profile"}
          </button>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">
              Your profile is stored locally in your browser. It will be used to personalise
              the PDF and DOCX reports generated from the valuation module.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
