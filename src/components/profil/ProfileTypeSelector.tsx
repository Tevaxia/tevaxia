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

  useEffect(() => {
    if (!user || !supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/dep-driven sync with external source (URL, localStorage, Supabase)
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
      ? selected.filter((ty) => ty !== type)
      : [...selected, type];
    setSelected(next);
    onChange?.(next);
    void persist(next);
  };

  if (!user || !supabase || loading) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-navy">{t("title")}</h3>
          <p className="mt-0.5 text-xs text-muted">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && (
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium ring-1 ring-emerald-100">
              ✓ {t("saved")}
            </span>
          )}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => { setSelected([]); onChange?.([]); void persist([]); }}
              className="text-[11px] text-muted hover:text-rose-600 underline underline-offset-2"
            >
              {t("clearAll")}
            </button>
          )}
        </div>
      </div>

      {/* Pills centrées, wrap naturel sur 2 lignes avec 9 profils */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
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
                  ? "border-navy bg-navy text-white shadow-sm"
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
    </div>
  );
}
