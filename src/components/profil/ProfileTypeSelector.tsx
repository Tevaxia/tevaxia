"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { PROFILE_TYPES, type ProfileType } from "@/lib/profile-types";

interface ProfileTypeSelectorProps {
  onChange?: (types: ProfileType[]) => void;
}

export default function ProfileTypeSelector({ onChange }: ProfileTypeSelectorProps) {
  const { user } = useAuth();
  const t = useTranslations("profileTypes");
  const [selected, setSelected] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("user_preferences")
      .select("profile_types")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const types = (data as { profile_types?: ProfileType[] | null } | null)?.profile_types ?? [];
        setSelected(types);
        onChange?.(types);
        setLoading(false);
      });
  }, [user, onChange]);

  const persist = useCallback(
    async (next: ProfileType[]) => {
      if (!user || !supabase) return;
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        profile_types: next.length > 0 ? next : null,
      });
      if (error) {
        console.error("Error saving profile types:", error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    },
    [user],
  );

  const toggle = (type: ProfileType) => {
    const next = selected.includes(type)
      ? selected.filter((t) => t !== type)
      : [...selected, type];
    setSelected(next);
    onChange?.(next);
    void persist(next);
  };

  if (!user || !supabase || loading) return null;

  return (
    <div>
      {/* Barre de pilule subtile repliée par défaut */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 text-[11px] text-muted hover:text-navy transition-colors group"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="underline-offset-2 group-hover:underline">
            {selected.length === 0
              ? t("customizeCta")
              : t("selectedCount", { count: selected.length })}
          </span>
        </button>
        {saved && (
          <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium ring-1 ring-emerald-100">
            ✓ {t("saved")}
          </span>
        )}
      </div>

      {open && (
        <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
          <p className="text-xs text-muted mb-4">{t("description")}</p>
          <div className="flex flex-wrap gap-1.5">
            {PROFILE_TYPES.map((p) => {
              const isActive = selected.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => toggle(p.value)}
                  title={t(`${p.value}.description`)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-navy bg-navy text-white"
                      : "border-card-border bg-background text-slate hover:border-navy/40 hover:bg-card"
                  }`}
                >
                  {isActive && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {t(`${p.value}.label`)}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => { setSelected([]); onChange?.([]); void persist([]); }}
              className="mt-3 text-[11px] text-muted hover:text-rose-600 underline underline-offset-2"
            >
              {t("clearAll")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
