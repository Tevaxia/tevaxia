"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface AiPrefs {
  ai_provider: "cerebras" | "groq" | "openai" | "anthropic";
  ai_api_key_encrypted: string;
}

const PROVIDERS = [
  { value: "cerebras", label: "Cerebras (Llama 3.1 8B — gratuit, ultra-rapide)" },
  { value: "groq", label: "Groq (Llama 3.3 70B — gratuit)" },
  { value: "openai", label: "OpenAI (GPT-4o)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
] as const;

export default function AiSettingsSection() {
  const t = useTranslations("aiSettings");
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<AiPrefs>({ ai_provider: "cerebras", ai_api_key_encrypted: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("user_ai_settings")
      .select("ai_provider, ai_api_key_encrypted, daily_usage, last_usage_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            ai_provider: data.ai_provider,
            ai_api_key_encrypted: data.ai_api_key_encrypted ?? "",
          });
          const today = new Date().toISOString().slice(0, 10);
          setDailyUsage(data.last_usage_date === today ? data.daily_usage : 0);
        }
        setLoading(false);
      });
  }, [user]);

  const save = async () => {
    if (!user || !supabase) return;
    setSaving(true);
    await supabase.from("user_ai_settings").upsert({
      user_id: user.id,
      ai_provider: prefs.ai_provider,
      ai_api_key_encrypted: prefs.ai_api_key_encrypted || null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user || !supabase) return null;

  const hasByok = !!prefs.ai_api_key_encrypted;

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-navy">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("desc")}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            hasByok ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
          }`}>
            {hasByok ? t("byokActive") : t("freeTier")}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Provider select */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("providerLabel")}</label>
            <select
              value={prefs.ai_provider}
              onChange={(e) => {
                setPrefs((p) => ({ ...p, ai_provider: e.target.value as AiPrefs["ai_provider"] }));
                setSaved(false);
              }}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* API key input */}
          <div>
            <label className="block text-sm font-medium text-slate mb-1">{t("apiKeyLabel")}</label>
            <input
              type="password"
              value={prefs.ai_api_key_encrypted}
              onChange={(e) => {
                setPrefs((p) => ({ ...p, ai_api_key_encrypted: e.target.value }));
                setSaved(false);
              }}
              placeholder={prefs.ai_provider === "cerebras" ? "csk-..." : prefs.ai_provider === "groq" ? "gsk_..." : prefs.ai_provider === "openai" ? "sk-..." : "sk-ant-..."}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <p className="mt-1 text-xs text-muted">{t("apiKeyHint")}</p>
          </div>

          {/* Usage info */}
          <div className="rounded-lg border border-card-border bg-background p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t("usageToday")}</span>
              <span className="font-semibold text-navy">
                {hasByok
                  ? t("unlimited")
                  : `${dailyUsage} / 5`
                }
              </span>
            </div>
          </div>

          {/* BYOK explanation */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800 leading-relaxed">{t("byokExplain")}</p>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
          >
            {saving ? t("saving") : saved ? t("saved") : t("save")}
          </button>
        </div>
      )}
    </div>
  );
}
